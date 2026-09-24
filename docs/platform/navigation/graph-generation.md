# Navigation Graph Generation

Navigation declarations generate machine-readable graphs and action tasks consumed by `bench_env`, the consistency linter, the viewer, and Agent runtime helpers.

## Commands

```bash
# One-shot: consistency + schema nav graph + action tasks (no data mode)
node scripts/build_nav_artifacts.mjs <AppName>

# Same plus data-mode graph (concrete params from app config)
node scripts/build_nav_artifacts.mjs <AppName> --data data/index.ts

# Skip task enumeration; only regenerate graphs
node scripts/build_nav_artifacts.mjs <AppName> --skip-tasks

# Enumerate all paths (not just shortest set) — significantly larger output
node scripts/build_nav_artifacts.mjs <AppName> --tasks-all-paths

# Path-enumeration bounds (defaults: depth 30, paths 20 per target)
node scripts/build_nav_artifacts.mjs <AppName> --tasks-max-depth 30 --tasks-max-paths 20
```

## Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| Schema nav graph | `public/<app>_nav_graph.json` | Static route/transition/action topology. Nodes use `:param` placeholders for unbounded query/path values. |
| Schema simplified graph | `public/<app>_nav_graph_simplified.json` | Route-level aggregation of the schema graph (see "Simplified graph" below). |
| Data nav graph | `public/<app>_data_graph.json` | Schema graph expanded by `dataSource` with concrete values. |
| Action tasks (schema) | `public/<app>_action_tasks.json` | Candidate action trajectories from the schema graph. |
| Action tasks (data) | `public/<app>_action_tasks_data.json` | Same, from the data graph. |

The viewer at `public/nav_graph_viewer.html` reads these JSONs directly.

## Node identity

The canonical schema-mode node id is:

```
nodeId = routePath + discreteSearchSuffix + queryParamPlaceholderSuffix
```

- **routePath**: the route's `path` exactly as declared (e.g. `/book/:bookId`).
- **discreteSearchSuffix**: each `uiState`'s `search` literal, sorted by key, joined as `?k=v&k2=v2`.
- **queryParamPlaceholderSuffix**: each `queryParams` key as `?k=:k` (placeholder, not concrete value).

Discrete `search` values and dynamic `queryParams` placeholders both appear on the schema node so consumers can tell which key is finite-enumerated vs unbounded. In **data mode**, dynamic placeholders may be replaced with concrete values (e.g. `/book/123`), and the node carries a `routePath` field pointing back to the original template (required — see [data-sources.md → Concrete node shape](data-sources.md#concrete-node-shape)).

`uiStates[].localStates` does **not** generate nodes; it's documentation-only metadata. See [declaration.md → `localStates`](declaration.md#localstates-documentation-only).

## Edge expansion semantics

When a transition uses `searchParams`, the analyzer expands it into edges based on the target route's structure:

- **Static `search` overrides same-key `searchParams`.** If a transition (or one of its `cases[]` branches) fixes `search: { sub: 'audio' }`, the analyzer does **not** also expand `sub` via `searchParams`. The static value wins. This precedence is also documented in [declaration.md → Two semantics of `searchParams`](declaration.md#two-semantics-of-searchparams).
- **Self-loop filtering (default + exception).** Edges where `source === target` are filtered out by default — they're usually noise (e.g. "click home while on home"). The exception: when `mode: 'push'` and `to` contains a path parameter (e.g. `/video/:bvid`), the self-loop is **kept** to represent "open another instance of the same entity type from this page."
- **Abstract edges are dropped in data mode** if neither end can be expanded to a concrete node. See [data-sources.md → Abstract edges](data-sources.md#abstract-edges-are-skipped-in-data-mode).

### Availability

Edges (and `cases[]` branches) may carry `availability`:

| Value | Meaning | Viewer rendering |
|---|---|---|
| (absent) | Edge is always available when reachable. | Default solid line. |
| `'requires_prior_visit'` | Edge exists only after the user has visited a related route in the same session (e.g. a "resume to last-watched video" entry). | Purple dashed line. Pathfinders avoid it on first reach and fall back to alternative routes; tools report `fallback(no availability edges)` when they had to use such an edge. |

`availabilityNote` is the optional human-readable explanation.

## Simplified graph

The simplified graph collapses each `routePath` into a single node, then merges edges:

- Multiple nodes for the same `routePath` (one per `uiState`) → one simplified node.
- **Intra-route edges are dropped** (a transition that only changes `search` within the same route disappears in the simplified graph).
- Cross-route edges with the same `transitionId` are deduplicated.
- Actions are aggregated into the simplified node's `actionIds` / `actionCount` fields.

Use the schema (non-simplified) graph for precise reasoning about discrete UI states; use the simplified graph for "how do I get from this page to that page" navigation overviews.

## Consistency-check output

```bash
node scripts/check_navigation_declaration_consistency.mjs <AppName> --actions
```

The check returns a JSON report with the following top-level categories. ERROR-level categories fail CI; WARN categories surface issues without breaking the build by default (use `--fail-on-warn` to escalate).

| Category | Level | What it reports |
|---|---|---|
| `missingInDeclaration` | ERROR | Transition / action ids used in source code (`bindTap('x.y')`) that have no matching entry in `navigation.declaration.ts`. The `missingUsageSites` field gives the `file:line:col` for each. |
| `unusedInCode` | WARN | Ids declared but not used anywhere — usually placeholder or dead. |
| `fromMismatches` | ERROR | A `bindTap('id', …)` call sits inside a component whose route is not listed in the transition's `from`. The report includes `expectedFromPaths` so the fix is obvious. |
| `extraFromWarnings` | WARN | `from` includes a route that has no observed usage of this transition. Often signals a refactor leftover. |
| `gestureMismatches` | ERROR | The `ui.gesture` declared (`tap` / `longPress` / `doubleTap`) doesn't match the bind site (e.g. declared `tap` but bound via `bindLongPress`). |
| `fromSearchTooBroad` | WARN | A `FromConstraint` uses `*` or omits `search` where a narrower constraint is possible. |
| `fromBarePathWithoutBaseState` | ERROR | `from: '/x'` (bare path) on a route that has no `.base` state. Use a `FromConstraint` to pin the discrete state. |
| `invalidBaseStateIds` | ERROR | A `uiState` with `search: {}` whose id does not end with `.base`. |
| `multipleBaseStates` | ERROR | A single route declared two `search: {}` states. |

The human-readable printer (no `--format=json`) prints summary line plus each category's bullets with `file:line:col` examples. **Reports must include specific ids + locations**, not just summary counts, when surfacing failures.

## WARN codes in schema graph generation

In schema mode, the graph builder also emits `WARN(schema)` entries (not the same as the consistency check above):

- `target_missing` — a transition's `to` resolves to a non-existent route.
- `target_unreachable` — the route exists but the discrete target state doesn't.
- `source_missing` / `source_unreachable` — same as above for `from`.
- Duplicate-edge warning — if the same `(source, target, transitionId)` triple is produced more than once during expansion (max 20 examples per triple are listed).

These warnings indicate the declaration would build a broken or ambiguous graph.

## Verification path-finding

```bash
python3 scripts/nav_path_finder.py --graph public/<app>_nav_graph.json --from <A> --to <B>
```

Returns the shortest path (or set of shortest paths) between two nodes. Useful for verifying that a newly-declared transition actually creates the reachability you expected.

## Action task generation

`build_nav_artifacts.mjs` (without `--skip-tasks`) enumerates **action trajectories** — sequences of transitions + an action — from each entry point. Defaults:

- Only **shortest-path set** is emitted (multiple shortest paths to the same target are all kept; longer paths are not). Use `--tasks-all-paths` to enumerate non-shortest paths (output grows quickly).
- Default depth cap: `--tasks-max-depth 30`. Default per-target path cap: `--tasks-max-paths 20`.
- Edges marked `availability: 'requires_prior_visit'` are deprioritized; the task generator records `fallback(no availability edges)` when it had to use such an edge.

## Related Docs

- Declaration grammar → [declaration.md](declaration.md)
- Data-source semantics → [data-sources.md](data-sources.md)
- Actions reference → [actions.md](actions.md)
- Tooling overview → [../tooling/build.md](../tooling/build.md)
