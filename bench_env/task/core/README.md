# Hybrid Tools V1

`core` is a fixed 90-task MobileGym suite for evaluating agents that can
interleave screenshot-based GUI actions with sparse app-provided tools.

## Dataset Contract

- Every task has one fixed English instruction and one deterministic initial state.
- Tasks start from the launcher after all involved app stores are warmed and setup data is injected.
- Every task is solvable with pure GUI interaction. Tools are optional accelerators, never a verifier requirement.
- Fifty-one tasks deliberately contain at least one operation that the exposed App Tools cannot complete directly.
- Query answers use `mobile_use(action="answer")`; the AnswerSheet app is not used by this suite.
- Success is judged from initial/final app state and, for query tasks, `agent_answer`.
- The primary metric is goal SR (`JudgeResult.success`). Unexpected changes are retained as diagnostics but do not change SR.

The fixed records live in `specs.py`. Each record declares its instruction, involved
apps, setup profiles, semantic goals, expected state changes, candidate tools, and
whether an efficient solution still needs GUI interaction. `tasks.py` materializes the
records as normal MobileGym `BaseTask` classes, so setup and verification use the same
state bridge as the official suites.

See `TASK_CATALOG.md` for all instructions and stable runner task IDs.

## Composition

| Group | Tasks |
| --- | ---: |
| Calendar | 12 |
| WeChat | 12 |
| Taobao Instant (`tbsg`) | 12 |
| Days Matter | 12 |
| Clock | 12 |
| Notes | 12 |
| Cross-app transfers | 18 |
| **Total** | **90** |

The `candidate_tools` metadata covers all 53 currently registered App Tools. It is for
coverage analysis only: a pure-GUI trajectory can pass the same verifier.
Two cross-app tasks deliberately use the regular Taobao app, which exposes no App Tools,
as a GUI-only information source before writing the result through Notes or WeChat tools.

## Deterministic Setup

`setup.py` injects only data needed by a task, after normal app reset/warm-up. It adds
stable Calendar events, WeChat contacts/messages, Days Matter events, Clock alarms,
and Notes/todos. Taobao Instant tasks use its existing deterministic catalog and orders.
The setup code never exposes verifier goals to the model.

## Verification

`verifier.py` implements semantic checks such as:

- a newly created Calendar event has the requested title, time, reminder, and description;
- a new outgoing WeChat message contains facts read from another app;
- a cart/checkout draft contains the requested catalog item and GUI-edited fields;
- a Days Matter event, alarm, note, or todo was created or updated correctly;
- a query answer matches the deterministic initial-state fact.

The same checks accept tool-produced and GUI-produced state because App Tools use the
same app stores as the GUI.

## Validation

Offline verifier matrix:

```bash
conda run -n mobilegym-bench pytest -q \
  --confcutdir=bench_env/tests/core \
  bench_env/tests/core/test_suite.py
```

This verifies all 90 positive states, all 90 unchanged negative states, registry
materialization, fixed instructions, no parameter sampling, and complete 53-tool metadata coverage.

With the simulator preview running, validate setup and runtime tool exposure without a model:

```bash
conda run -n mobilegym-bench python -m bench_env.hybrid_benchmark.smoke \
  --env-url http://127.0.0.1:4181 \
  --all-tasks \
  --headless \
  --output runs/hybrid-tools-v1-setup-smoke.json
```

The existing `app_tools/browser_smoke.mjs` remains the exhaustive environment-side
execution check for all 53 tools.
