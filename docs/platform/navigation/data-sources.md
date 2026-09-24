# Navigation Data Sources

This page documents the data-mode side of declarative navigation: how `dataSource`, `StateCondition`, `boundParams`, and generated graph bindings are evaluated by the current analyzer.

For the route/action declaration schema, start with [`declaration.md`](declaration.md). This page is for debugging graph expansion and deciding how to model data-dependent navigation.

## Runtime vs analyzer

`dataSource` is not a runtime router. Apps still navigate through their app navigation hook and React Router.

`dataSource` is consumed by:

| Consumer | File | Purpose |
|---|---|---|
| Nav graph analyzer | `scripts/navigation_declaration_analyzer.mjs` | Expands schema routes into concrete data-mode nodes and edges. |
| One-shot builder | `scripts/build_nav_artifacts.mjs` | Runs consistency checks, graph generation, and task generation. |
| Action task generator | `scripts/generate_action_tasks_from_nav_graph.mjs` | Uses concrete graph edges/actions to create action tasks. |
| Graph viewer | `public/nav_graph_viewer.html` | Visualizes schema/data graphs emitted to `public/`. |

Use data mode when a declaration needs to enumerate concrete values from app data:

```bash
node scripts/build_nav_artifacts.mjs Wechat --data data/index.ts
```

CLI flags relevant to data mode:

| Flag | Default | Effect |
|---|---|---|
| `--data <path>` | (off) | Enable data mode using the given config module. |
| `--data-export <name>` | auto-detect `*_CONFIG` | Pick a non-default export from the config module. |
| `--data-limit <n>` | `10` | Cap each `dataSource.ref` expansion to `n` items (set to `0` to disable the cap). Prevents graph/task explosion for large datasets. |
| `--prune-unreachable` | off | Drop unreachable islands from the output instead of just reporting them. |

Cross-file aggregation: `ref` paths are resolved against a **single root config object**. Apps with data split across files must aggregate the references in the main config. See [declaration.md → Cross-file data aggregation](declaration.md#cross-file-data-aggregation) for the canonical pattern.

## Expansion pipeline

Data-mode graph generation is roughly:

1. Load the navigation declaration and build the schema graph.
2. Load the app config module passed with `--data` (using `--data-export` if set, else the first `*_CONFIG` export).
3. Attach each transition's `dataSource` to its schema edge.
4. Expand edges with concrete params:
   - pass 0 expands static `dataSource.ref` paths that do not require existing bound params;
   - pass 1 expands parameterized refs such as `users[id={userId}].recentBooks` from concrete source nodes;
   - inherited param edges are copied from concrete source nodes to concrete target nodes.
5. Evaluate `stateCondition`, `transition.ui.condition`, and action `condition`.
6. Prune nodes and edges whose conditions evaluate to false.
7. Compute reachability from entry points. By default, unreachable islands are kept and reported in `reachability`; `--prune-unreachable` removes them.

The output uses concrete `boundParams` on expanded nodes and per-edge `binding` metadata so you can trace where every param came from.

## Concrete node shape

Every expanded data-mode node carries:

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Concrete path with bound params substituted, e.g. `/book/60`. |
| `routePath` | **yes** | The original template path, e.g. `/book/:bookId`. **Load-bearing** — without it, downstream tools can't map the concrete node back to its declaration entry. |
| `boundParams` | yes | The concrete values of all params for this node (`{ bookId: '60' }`). |
| `component` | yes | Same as the route's declared `component`. |
| `data` | optional | The resolved entity object for this concrete node, when applicable. |

## Ref resolution

`dataSource.ref` is resolved against the root config object loaded from the `--data` module.

| Form | Returns | Current behavior |
|---|---|---|
| `collection` | array / value | Reads `data.collection`. |
| `a.b.c` | nested | Nested property access. |
| `users[id={userId}].recentBooks` | **single element** (`.find` semantics) | Finds **one** array item whose `id` equals the source node's `boundParams.userId`, then reads `recentBooks`. Returns the resolved value (not an array). |
| `shelf[isPrivate=false]` | **subset** (`.filter` semantics) | Filters an array by a literal `=` or `!=`. Supported operators: `=`, `!=`. Supported literal value types: booleans, non-negative integers, and bare `\w+` strings. |
| `items.{itemId}` | value | Uses a bound param as an object key. |
| `$value` in `paramMapping` | (operand) | Uses the array item itself as the target param value. |
| `$key` in `paramMapping` | (operand) | Iterates object keys in `Object.keys(obj).sort()` order (deterministic, for stable diffs across regenerations) and uses each key as the target param value. |

If a parameterized ref needs a bound param that is not available, it resolves to `null` and is not expanded in that pass.

### No implicit `id`-field lookup

There is **no implicit "primary key is `id`" assumption**. Different apps use different identifier field names (`id` / `wxid` / `mid` / `bvid`), so the syntax requires explicit `[field={param}]`. **Do not** propose or rely on shortcuts like `users.{userId}.field` that imply an implicit lookup field.

### `paramMapping` scope

`paramMapping` exists only to fill `to`'s **path params** (the `:bookId` placeholders). It does **not** fill `searchParams` — those come from explicit `transition.search` / `transition.searchParams` in the declaration.

## Choosing a dataSource entry

`transition.dataSource` may be either one object or an array. The current analyzer checks entries in array order and returns the first entry whose `from` constraint matches the source node.

Write declarations from most specific to least specific:

```ts
dataSource: [
  {
    from: { path: '/bookshelf', search: { tab: 'finished' } },
    ref: 'finishedBooks',
    paramMapping: { bookId: 'bookId' },
  },
  {
    from: '/bookshelf',
    ref: 'allBooks',
    paramMapping: { bookId: 'bookId' },
  },
]
```

`from` matching rules:

| Form | Meaning |
|---|---|
| omitted or `'*'` | Fallback; matches any source. |
| `'/path'` | Matches the route path exactly. |
| `{ path, search }` | Matches route path and every listed search key. |
| `search: { k: '*' }` | The key must exist with any value. |
| `search: { k: null }` | The key must be absent. |
| `search: { k: 'v' }` | The key must equal the literal string. |

### Priority contract (designed; current analyzer relies on order)

The intended matching contract, in descending priority, is:

1. Precise `FromConstraint` (path + all `search` values literal).
2. `FromConstraint` with parameter wildcards (`search: { k: '*' }`).
3. Plain path string.
4. `'*'` fallback.

When two entries at the same priority match the same source, the analyzer **should** raise an ambiguity error. The current implementation does **not** sort by specificity and does not raise — declaration order is the practical contract. Treat the priority list as the spec; don't write ambiguous declarations even though the analyzer currently tolerates them.

## Param binding

Concrete edges use `binding` to explain how params were filled. Each variant carries a concrete `value` (except `unbound`):

| Source | `value` | Meaning | Example |
|---|---|---|---|
| `dataSource` | required | The value came from the matched `dataSource.paramMapping`. | `/feed` to `/note/abc` where `noteId` came from `notes[].id`. |
| `inherited` | required | The value came from the concrete source node's `boundParams`. | `/book/60` to `/read/60` — `bookId` is inherited from the source. |
| `unbound` | none | The schema edge still has an unresolved placeholder. | Usually only relevant outside concrete data-mode expansion. |

**Both `dataSource` and `inherited` bindings must carry `value`.** Downstream pruning, graph viewers, and task generators all depend on the concrete value being present. A binding marked `inherited` without `value` cannot be pruned even when the source node has a concrete value, leading to phantom edges.

### Common mistake: `inherited` ≠ "the route template has `:param`"

`inherited` is determined by **whether the source node has the param in `boundParams`**, not by whether the route template path contains `:param`. So:

- `/book/:bookId` (abstract schema node, no `boundParams`) → child edges' `bookId` is **`unbound`**, not `inherited`.
- `/book/60` (concrete data-mode node, `boundParams: { bookId: '60' }`) → child edges' `bookId` is **`inherited`** with `value: '60'`.

The implementation must check `sourceNode.boundParams[param]`, not `sourcePath.includes(':param')`. This was a recurring bug in early iterations.

### Abstract edges are skipped in data mode

In data mode, edges involving parameterized source or target routes are skipped if they cannot be expanded to concrete nodes. This avoids dangling schema islands such as `/book/:bookId`.

## Conditions

Conditions are evaluated in data mode only. They may appear on:

| Declaration field | Graph target |
|---|---|
| `uiStates[].stateCondition` | Node existence. |
| `transition.ui.condition` | Edge existence. |
| `action.condition` | Action existence on a node. |

Supported canonical ops:

| Op | Shape | Notes |
|---|---|---|
| `always` | `{ op: 'always' }` | Explicit true fallback. |
| `eq` | `{ op: 'eq', ref, equals }` | Strict equality against a resolved ref. |
| `notEmpty` | `{ op: 'notEmpty', ref, filterFn? }` | Requires the resolved ref to be an array. |
| `memberOf` | `{ op: 'memberOf', ref, param, field?, filterFn? }` | Checks a bound param against a collection. Default `field` is `$value`. |
| `paramEq` | `{ op: 'paramEq', param, ref }` | Compares a bound param to a **primitive** ref using `String(paramValue) === String(refValue)`. If the ref is an object, the condition returns unevaluable (`reason: 'ref is not primitive'`). |
| `paramNeq` | `{ op: 'paramNeq', param, ref }` | Negated `paramEq`. Same primitive-only and string-coercion semantics. |
| `and` / `or` | `{ op: 'and' \| 'or', items }` | See short-circuit rules below. Empty `items` → unevaluable with reason `'and.items missing/empty'` / `'or.items missing/empty'`. |
| `not` | `{ op: 'not', item }` | Unevaluable child keeps the parent unevaluable. |

Legacy `equals`, `notEquals`, and `empty` are still parsed for compatibility. New declarations should use the canonical ops above.

### `and` / `or` short-circuit + unevaluable propagation

- **`and`**:
  - Any evaluable-`false` child → `satisfied: false, evaluable: true` (short-circuit).
  - All children evaluable and satisfied → `satisfied: true, evaluable: true`.
  - Any unevaluable child without a false sibling → `evaluable: false` (conservative keep).
- **`or`**:
  - Any evaluable-satisfied child → `satisfied: true, evaluable: true` (short-circuit).
  - All children evaluable and none satisfied → `satisfied: false, evaluable: true`.
  - Otherwise → `evaluable: false`.
- **`not`**: unevaluable child → parent unevaluable.

The "conservative keep on unevaluable" rule is critical: the static analyzer must not delete a runtime-reachable path just because some condition can't be evaluated at analysis time.

## Unevaluable conditions

The analyzer separates "false" from "cannot prove":

| Result | Graph behavior |
|---|---|
| evaluable true, satisfied true | Keep the node, edge, or action. |
| evaluable true, satisfied false | Prune it. |
| evaluable false | Keep it and attach `conditionStatus: { status: 'unevaluable', reason }`. |

This conservative policy prevents the analyzer from deleting valid runtime paths just because data mode lacks a bound param or a ref cannot be resolved.

### Type-mismatch policy (hard rule)

When a canonical op's resolved ref is of the wrong type for its semantic, the analyzer **must** return `unevaluable` with a descriptive reason, **not** silently coerce or treat as empty:

- `memberOf` expects the ref to be an array. Non-array → `unevaluable` (reason `'ref is not array'`).
- `eq` expects the ref to be a primitive. Object refs → `unevaluable`.
- `paramEq` / `paramNeq` expect the ref to be primitive. Object refs → `unevaluable` (`'ref is not primitive'`).

Silently treating a non-array as an empty array would falsely "prune" nodes whose conditions are actually unprovable, removing valid runtime paths.

Common unevaluable reasons in emitted output: `param <name> not bound`, `ref not found`, `ref is not array`, `ref is not primitive`, `and.items missing/empty`, `or.items missing/empty`, and propagated unevaluable children inside `and` / `or` / `not`.

When debugging generated graphs, search for `conditionStatus` in the emitted JSON before assuming the declaration is wrong.

## filterFn

`filterFn` is a string evaluated as `(item, data) => boolean`.

```ts
dataSource: {
  ref: 'initialShelf',
  filterFn: '(item, data) => data.bookProgress[item.bookId]?.charOffset > 0',
  paramMapping: { bookId: 'bookId' },
}
```

The analyzer uses `new Function` to evaluate it. Keep `filterFn` pure and deterministic:

- read only `item` and `data`;
- do not mutate data;
- do not depend on browser globals;
- prefer straightforward expressions that can be reviewed in code.

If a `filterFn` throws for one item, the current implementation logs a warning and keeps that item. If the function cannot be compiled, the original collection is kept.

## Design decisions

| Decision | Reason |
|---|---|
| Data paths share one grammar across `dataSource.ref` and `StateCondition.ref`. | Keeps declarations compact and avoids two parallel path languages. |
| Inheritance is based on concrete `boundParams`, not route templates. | `/book/:bookId` does not carry a value; `/book/60` does. |
| Conditions keep unevaluable items instead of pruning them. | Static analysis should not delete runtime-reachable paths when evidence is incomplete. |
| `dataSource` entries are ordered fallbacks. | This matches the current analyzer implementation and keeps local declaration intent visible. |
| `dataSource` and inherited bindings both carry concrete `value`. | Downstream graph viewers and task generators can show and reuse the exact value. |
| Lookup-field syntax is explicit (`[field={param}]`), not implicit. | Different apps use different primary keys (`id`/`wxid`/`mid`/`bvid`); an implicit "use `id`" rule would fail on most of them. |

## Common problems

| Symptom | Likely cause | Fix |
|---|---|---|
| Data graph still contains only schema-level nodes | `--data` was not provided, or the `ref` resolves to empty/null. | Run `build_nav_artifacts` with `--data data/index.ts` and inspect the config export. |
| A fallback `dataSource` captures a specific route | The fallback appears before the specific entry. | Reorder entries from most specific to least specific. |
| Concrete target nodes are missing | `paramMapping` does not fill every target path param. | Map every `:param` in `to` to a source field, `$value`, or `$key`. |
| Edge disappears only in data mode | `transition.ui.condition` evaluated false. | Inspect the emitted edge condition and its resolved `boundParams`. |
| Node is kept with `conditionStatus` | The condition could not be fully evaluated. | Check whether required params exist on the source node or whether `ref` points to an array/primitive of the expected shape. |
| Data graph has unreachable islands | The analyzer found concrete nodes that no entry point can reach after condition pruning. | Inspect the emitted `reachability` block; run `navigation_declaration_analyzer.mjs --prune-unreachable` if you need a pruned debugging graph. |
| Phantom edges in data mode that the runtime never produces | A binding is marked `inherited` but missing `value`. | Ensure the binding carries the concrete value from the source node's `boundParams`. |
