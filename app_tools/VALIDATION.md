# App Tools Validation Record

This document records real-browser validation for the MobileGym App Tool layer.

## 13-App Expansion Run

Date: 2026-07-13

```text
MobileGym preview: http://127.0.0.1:4181
Browser: isolated headless Chrome contexts
Viewport: 402 x 874
Validator: app_tools/expanded_browser_smoke.mjs
Report: runs/app-tools-expanded-smoke-v3-final-r6/report.json
```

| Metric | Result |
| --- | ---: |
| Apps | 13 |
| Registered expansion tools | 150 |
| Distinct tools called | 150 |
| Successful invocations | 159 |
| Failed invocations | 0 |
| Immediate UI screenshots | 55 |
| Read-only non-UI calls with app-state changes | 0 |

The run used each App's real seeded state to derive IDs and parameters. Every query,
navigation, draft, and write tool was called once. Read-only calls were checked against a
canonical before/after `__SIM__.getState()` snapshot. Navigation and draft calls were
checked for non-empty rendered text and a non-trivial immediate screenshot. Browser
contexts were isolated per App.

The first two passes found two implementation issues and three validator-fixture issues:

- Map place IDs returned from query were not stable after a result page refreshed its
  view snapshot. Search results now have a tool-session cache, so `search_places` followed
  by `open_place` is stable.
- Reddit feed communities used names such as `r/self`, while the static community catalog
  used unrelated `com_*` IDs. The tool now normalizes known communities and safely derives
  unknown communities represented by the visible feed.
- Map and eBay smoke queries were changed to deterministic offline-catalog queries.
- Weather smoke waits for normal first-mount background loading before state-diff checks.

The V3 benchmark audit added targeted same-source checks and repairs:

- Alipay `search_bills` now uses the GUI's own quick-filter predicate, including `order`.
- Spotify recent plays expose both chronological positions, and liked identity matches
  the GUI by normalized title plus artist rather than dataset-local ID.
- Weather forecasts identify `day_offset=0` as today and use deterministic offline city data.
- Map nearby search accepts common English category aliases and retains the GUI's distance semantics.
- RedBook query tools merge the same lazy base dataset and runtime overlays used by GUI pages.
- eBay filtering, shipping-inclusive totals, and default ordering match the normal search page.

Reproduce the expansion run after building and starting preview:

```bash
env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY \
  -u ALL_PROXY -u all_proxy \
  node app_tools/expanded_browser_smoke.mjs \
  http://127.0.0.1:4181 runs/app-tools-expanded-smoke-local
```

The validator intentionally performs reversible writes in isolated browser storage. It
does not use `__SIM__.setState()` to execute a tool; `__SIM__.getState()` is only a test
observer.

## First Expansion Run

Date: 2026-07-12

Environment:

```text
MobileGym preview: http://127.0.0.1:4181
Browser: isolated headless Chrome profiles
Viewport: 402 x 874
Validator: app_tools/browser_smoke.mjs
```

Combined machine-readable report:

```text
runs/app-tools-smoke-20260712/report.json
```

Summary:

| Metric | Result |
| --- | ---: |
| Registered tools | 48 |
| Distinct tools called | 48 |
| Total successful invocations | 52 |
| Failed invocations | 0 |
| Missing/unexpected tools | 0 |
| Immediate UI screenshots | 17 |
| Read-only query calls with app-state changes | 0 |

The invocation count exceeds 48 because selected write results were queried again to
verify persistence and searchability.

## What The Browser Smoke Suite Checks

For every tool, the validator checks the structured `ToolResult` and records the top-level
app-state diff using `window.__SIM__.getState()` strictly as a test observer. It also checks:

- every registered tool is called at least once with a valid representative input;
- `listTools({app})` itself does not change app state;
- read-only non-UI tools do not change app state;
- writes change only an explicit per-tool allowlist of state keys;
- sent/created objects can be found through a subsequent query or state observation;
- draft tools do not create the final business object;
- checkout draft creation does not create or mutate an order;
- UI tools reach their exact route before returning;
- each UI route has non-empty rendered text and a non-trivial immediate screenshot;
- form drafts are verified through the actual `input`/`textarea` value, not `innerText`.

Representative state effects observed:

| Tool | Observed app-state changes |
| --- | --- |
| `wechat__send_text_message` | `chats` |
| `wechat__prepare_moment_draft` | `textMomentDraft`, `_temp`; `moments` unchanged |
| `tbsg__add_item_to_cart` | `cart` |
| `tbsg__prepare_checkout` | `checkoutDraft`, `route`; `orders` unchanged |
| `daysmatter__prepare_event_draft` | `_temp`; `events` unchanged |
| `daysmatter__archive_event` | `events` only |
| `clock__create_alarm` / `clock__set_alarm_enabled` | `alarms` |
| `clock__add_world_city` | `selectedCityIds` plus expected derived `selectedCities` |
| `notes__create_note` | `notes` |
| `notes__create_todo` / `notes__set_todo_completed` | `todos` |

## Visual Review

The 17 screenshots cover all navigation and draft tools. Key screens were manually
reviewed for visible content and continued GUI operability, including:

- WeChat contact, chat, chat search, Moments, and populated text-Moment draft;
- Taobao Instant shop, cart, order detail, and unpaid checkout draft;
- Days Matter event, notebook-filtered home, and populated event draft;
- Clock alarm list containing the created alarm and the timer tab;
- Notes editor, folder-filtered list, and to-do list containing the created/completed item.

No blank, wrong-app, stale-route, or visibly blocked target page was observed.

## Findings And Adjustments

Two initial failures were validator errors rather than product defects: text inside an
`input` or `textarea` is not part of `document.body.innerText`. The validator now checks
control values explicitly. Clock city addition also updates the existing
`selectedCities` state-adapter field derived from `selectedCityIds`; this was confirmed as
the intended GUI-equivalent effect and added to the state allowlist.

The production bootstrap was additionally hardened for benchmark isolation. It now
statically imports only passive tool definitions. App handlers and their stores are loaded
through dynamic import only after an actual `callTool`. Standard benchmark evaluation does
not call the App Tool API, so the tool layer does not execute app actions or initialize
handler modules merely because MobileGym starts.

## Reproduction

Build and start the preview first, then run all apps or one comma-separated subset:

```bash
node app_tools/browser_smoke.mjs \
  --env-url http://127.0.0.1:4181 \
  --apps wechat,tbsg,daysmatter,clock,notes \
  --output-dir runs/app-tools-smoke-local
```

Chrome can be selected explicitly when needed:

```bash
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node app_tools/browser_smoke.mjs --apps notes
```

## Remaining Limits

This is exhaustive tool-name coverage, not exhaustive parameter-space coverage. Invalid
IDs, extra arguments, date validation, SKU validation, privacy filtering, and selected
idempotency cases are covered by Vitest, but every possible boundary combination is not.
The run validates environment behavior without a model; model planning quality and complete
task/verifier success still require a separate hybrid benchmark task set.

## New App Expansion Run

Date: 2026-08-02

The latest `origin/main` versions of Broadcast (Apple Podcasts), Ctrip, Luckin, and
Ximalaya were imported into the Tooluse branch without merging over the independent
Hybrid runtime history. Production build passed after the import and Tool registration.

Validator:

```text
app_tools/new_apps_browser_smoke.mjs
```

Machine-readable report:

```text
runs/new-app-tools-smoke-1785655391792/report.json
```

Summary:

| Metric | Result |
| --- | ---: |
| Apps validated | 3 / 3 |
| Registered tools | 23 |
| Successful representative invocations | 23 |
| Failed invocations | 0 |
| Read-only calls with business-state changes | 0 |
| Navigation tools with exact-route screenshots | 6 |

The smoke suite checks App-scoped dynamic discovery, representative query results,
read-only state invariance, exact post-call routes, non-blank immediate screenshots, and
the two limited writes: Broadcast queue insertion and Luckin default-spec cart insertion.
Payment, booking, refund, order creation, playback, rating, download, product
customization, and final confirmation remain GUI-only capabilities.

Paired model run (`gemini-3.1-pro-preview`, six fixed tasks): Hybrid passed 5/6
(83.3%, 54 steps), while GUI-only passed 3/6 (50.0%, 167 steps). The complete audited
result, failure attribution, and episode locations are in
`benchmark_evidence/NEW_APPS_V1_EXPERIMENT_20260802.md`. The Broadcast duration verifier
accepts both `66分钟` and semantically equivalent `1小时6分钟`, while still requiring the
complete episode title.

Workspace-wide `tsc --noEmit` still reports two pre-existing Map route-step typing errors
in `apps/Map/hooks/useRouting.ts` where nullable `instructions` is passed to a callback
expecting `string | undefined`. No new App or App Tool TypeScript errors were reported,
and the Vite production build completed successfully.
