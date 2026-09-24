# Navigation Actions

Actions describe non-navigation effects that a user can trigger: send a message, like a post, submit a payment, delete an item. They live in `navigation.declaration.ts` alongside routes and transitions, attached to `uiStates[].actions[]`.

## When to Use an Action

| Use `transitions` | Use `actions` |
|---|---|
| The visible route/UI state changes. | Data changes while the current route may stay the same. |
| Tab switch, dialog open, drawer close. | Send, delete, like, follow, save, submit. |

Decision rules for ambiguous cases:

- **Navigation + side effect on the same tap** → still a `transition`. The URL changes, so it must be a transition; the side effect is observed downstream.
- **"Submit then back" (确定 / 完成 / 发表)** → model as `action` with `behavior: 'submit'`. The `onTrigger` performs the side effect, then calls `back()` to close. **Do not** model it as a transition with a hardcoded `to` — that pollutes the graph with a misleading return target.
- **Pure back / cancel / close overlay** → use `bindBack()` (`data-trigger="system.back"`). **Do not** declare a transition for it, and **do not** assign it an actionId.

## Action declaration

Actions are objects on a `uiState`'s `actions[]`. The full grammar lives in [declaration.md → Actions](declaration.md#actions); this file is the rules reference.

### Required fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Must satisfy the ActionId grammar (below). Globally unique within the app. |
| `label` | yes | Human-readable Chinese label for graph viewer + task generation. |
| `behavior` | yes | `'toggle'` / `'select'` / `'input'` / `'submit'` / `'other'`. Drives DOM tagging and CI validation. |
| `scope` | optional | `'item'` for per-list-item actions. Omit for page-scope. |
| `paramsSchema` | conditional | Required for `behavior='input'`, `scope='item'`, and any place callers rely on params. See validation rules below. |
| `effects` | optional | `ActionEffect[]` — declarative `localState.open` / `localState.close` annotations. Does not generate edges; used for documentation and Agent training metadata. |
| `condition` | optional | Data-mode `StateCondition` filtering action visibility. |

## ActionId grammar (hard rules)

- **Regex**: `^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)+$`
- **Minimum 3 segments**: `<domain>.<control>.<verb>` (recommended `<appId>.<page>.<control>.<verb>`).
- **No `-` or `_`** — only letters, digits, and dots. CamelCase within a segment is fine.
- **App-internal global uniqueness**: every action id must be unique across the entire app's declaration.
- **`scope='item'` actions** should include `.item.` in the id: `<appId>.<page>.item.<verb>`.

### Verb suffix by behavior

The verb segment is fixed by the action's behavior:

| Behavior | Verb suffix | Example |
|---|---|---|
| `toggle` | `.toggle` | `fastPay.enabled.toggle` |
| `select` | `.select.<option>` | `language.select.zhHans`, `payOrder.mode.select.system` |
| `input` | `.input` | `search.bar.input`, `fontSize.slider.input` |
| `submit` | `.submit` | `language.save.submit`, `fastPay.disable.submit` |
| `other` | free-form | `fastPayPassword.keypad.delete` |

### `select` shared-prefix means mutual exclusion

Multiple `select` actions sharing a prefix (e.g. `language.select.zhCN`, `language.select.zhTW`, `language.select.en`) are treated as a **mutually exclusive choice group** by the graph generator and task generator. This is the radio-group semantic: picking one implies un-picking the others.

### Toggle is one control = one id

A toggle has a single action id, not separate enable/disable. The current state is observed by reading the underlying setting, or expressed via optional `params.to`. **Do not** split `settings.darkMode.enable` + `settings.darkMode.disable`.

## `paramsSchema` validation rules (CI-enforced)

`paramsSchema: Record<string, 'string' | 'number' | 'boolean'>` — the allowed primitive types.

CI checks enforce:

1. **`behavior='input'`** → `paramsSchema` must include `value: 'string' | 'number'`.
2. **`scope='item'`** → `paramsSchema` must include at least one **object identifier field** (e.g. `bookId`, `userId`, `postId`). Identifier fields are restricted to `'string'` or `'number'` (no `'boolean'`).
3. **`behavior='select'`** → action id must match `<prefix>.select.<option>` shape.

### `data-action-params` consistency

If `paramsSchema` is declared, controls binding the action must emit `data-action-params` whose:

- **key set** matches `paramsSchema` exactly (no missing or extra keys)
- **value types** match the declared primitives
- **value** is valid JSON

The gesture hook (`bindTap({ kind: 'action', id, ... }, params)`) produces a compliant JSON string automatically — prefer it over hand-crafting attributes.

### When `data-trigger-params` / `data-action-params` is required

- **`data-trigger-params` required**: when multiple controls share the same `transitionId` but target different parameter values (Tab switching, list-item open). Without it, the analyzer can't distinguish entries.
- **`data-action-params` required**: when `scope='item'` (the per-item identifier must be present), or when callers depend on the params (e.g. `behavior='input'` value).
- **Not required**: back buttons, single-target transitions, page-scope actions with no params.

## DOM Binding

Controls that execute actions emit:

```text
data-action="<actionId>"
data-action-type="<gesture>"      // tap | longPress | doubleTap
data-action-params="<JSON>"        // optional, JSON-encoded operands
```

Use the app's gesture hook (which wraps `useTriggerGestures`); ID must be a **string literal** at the bind site.

**Do not** tag placeholders or disabled controls that don't actually perform the action.

### Mixing `data-trigger` and `data-action` on one element

- **Default rule**: a given gesture type on a given DOM node is **either** a transition (`data-trigger`) **or** an action (`data-action`), not both. The analyzer can't disambiguate two registrations for the same gesture.
- **Exception**: the same DOM node may carry **different gestures** with different semantics — e.g. an avatar that opens a profile on single-tap and triggers `cheer` on double-tap. In that case both `data-trigger` and `data-action` may coexist, distinguished by `data-trigger-type` vs `data-action-type`. The runtime must ensure a single gesture event never fires both `go()` and `onTrigger`.
- **Pure back-style controls (返回 / 取消 / 关闭遮罩)**: use `bindBack()` only. No transition declaration, no action declaration.

## Related Docs

- Full declaration grammar → [declaration.md](declaration.md)
- Data-source expansion → [data-sources.md](data-sources.md)
- Build artifacts and CI output contract → [graph-generation.md](graph-generation.md)
