# Hybrid Tools V4

`clocked` is the quality-focused revision of the 80-task V3 GUI + App
Tools suite. It contains 76 scored tasks after a case-by-case audit.

## Contract

- The V4 runner bootstraps device time at `2026-07-12 09:00:00` in the simulator
  URL before eager app modules materialize relative default timestamps. Each task
  verifies the frozen clock again after reset and before app warming, setup data,
  or sampling. Weather's eagerly initialized offline library is realigned to the
  frozen date in the same setup phase. Other suites and ordinary simulator URLs
  do not receive the V4 bootstrap parameters.
- The fixed date is a Sunday, so WeChat Reading's Monday-Sunday GUI week and
  the verifier's inclusive trailing-seven-day window refer to the same dates.
- The date is not injected into the agent prompt. The agent must infer temporal
  context from the simulated UI when needed.
- 61 V3 instructions remain unchanged and 14 receive minimal verifier-facing
  clarification. Two verifier contracts are repaired: RedBook candidate selection
  and Case75's unstated calendar-description requirement; Case75 belongs to both
  groups.
- Four V3 tasks are removed because the current mock UI cannot reliably commit
  the state required by their verifiers.
- Source setup and business-state verifiers remain the default. V4 does not
  modify official tasks, V3, app business logic, or the original benchmark.
- App Tools are optional and dynamically scoped to the foreground app. Pure GUI
  and hybrid trajectories are judged by the same final-state verifier.
- The primary score is **SR** (`success / total`). Progress and USE are retained
  only as runner diagnostics and are not V4 benchmark metrics.

See `V3_TO_V4_AUDIT.md` for all 80 decisions and `TASK_CATALOG.md` for the 76
final instructions.

## Validation

```bash
/opt/miniconda3/envs/mobilegym-bench/bin/python -m pytest -q \
  bench_env/tests/clocked bench_env/tests/hybrid_agent

NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  -u http_proxy -u https_proxy -u all_proxy \
/opt/miniconda3/envs/mobilegym-bench/bin/python \
  -m bench_env.task.clocked.smoke \
  --env-url http://127.0.0.1:4181 --headless \
  --output runs/hybrid-tools-v4-setup-smoke.json

NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  -u http_proxy -u https_proxy -u all_proxy \
/opt/miniconda3/envs/mobilegym-bench/bin/python \
  -m bench_env.task.clocked.boundary_smoke \
  --env-url http://127.0.0.1:4181 --headless \
  --output runs/hybrid-tools-v4-boundary-smoke.json
```

The browser smoke starts with the same boot-time URL as the benchmark and verifies
all task setups, frozen OS time, initially negative verifiers, and runtime App Tool
exposure. The boundary smoke additionally checks
the reading-window alignment, Weather tool/state day-zero equality, Map's complete
candidate ranking, the scrollable RedBook candidate set, normal train bookability,
and the file preservation contract. Neither script runs an LLM.

## Run Gemini 3.1 Pro

```bash
RUN_DIR="runs/hybrid-tools-v4-gemini31pro-76-par4-$(date +%Y%m%d-%H%M%S)"

NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  -u http_proxy -u https_proxy -u all_proxy \
/opt/miniconda3/envs/mobilegym-bench/bin/python -m bench_env.hybrid_benchmark \
  --suite clocked \
  --interaction-mode hybrid \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME" \
  --parallel 4 --headless \
  --max-tokens 8192 --temperature 0 --top-p 1 \
  --output-dir "$RUN_DIR"
```

For the controlled GUI-only condition, use the identical command and change only the
mode and output directory:

```bash
RUN_DIR="runs/hybrid-tools-v4-gemini31pro-76-par8-gui-only-$(date +%Y%m%d-%H%M%S)"

NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  -u http_proxy -u https_proxy -u all_proxy \
/opt/miniconda3/envs/mobilegym-bench/bin/python -m bench_env.hybrid_benchmark \
  --suite clocked \
  --interaction-mode gui_only \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME" \
  --parallel 8 --headless \
  --max-tokens 8192 --temperature 0 --top-p 1 \
  --output-dir "$RUN_DIR"
```

`gui_only` keeps the same XML prompt structure and the complete `mobile_use` action
space, including `open_app`. It removes only app-provided business tools. Both modes use
the same 76 task setups, frozen time, final-state verifiers, and SR calculation.
