# Hybrid Tools V5

`prior` 是 V4 的契约修订版本。它保留相同的 76 个任务 ID、来源
setup、冻结模拟时间、App Tool 策略和主要 SR 指标。当前累计修订 41 条任务：
包括原有 14 条 P1、13 条 P2，以及本轮针对 20 条中高风险任务完成的语义审查
修订（其中 6 条与原 P1/P2 重叠）；其余 35 条继承 V4 契约。

## Contract

- Suite time is frozen at `2026-07-12 09:00:00` before app initialization.
- Hybrid and GUI-only modes use the same setup and final-state verifier.
- App Tools remain dynamically scoped to the foreground app.
- The benchmark does not inject the current date into the agent prompt.
- Primary metric is SR. Progress and clean-state output remain diagnostics.
- V4 and the original MobileGym suites are still registered separately.

V5 repairs the audited failures at the narrowest responsible layer:

- task-local instruction changes for ambiguous target semantics;
- task-local setup for deterministic Spotify chronology and pantry SKUs;
- task-local verifier changes for false-positive/false-negative boundaries;
- shared GUI/tool fixes only where GUI and App Tools exposed different state.

全部修订见 [CONTRACT_REPAIRS.md](CONTRACT_REPAIRS.md)，完整任务清单见
[TASK_CATALOG.md](TASK_CATALOG.md)。

## Validation

Start a built MobileGym preview, then run:

```bash
conda run --no-capture-output -n mobilegym-bench python -m pytest -q \
  bench_env/tests/prior \
  bench_env/tests/clocked \
  bench_env/tests/hybrid_agent

npm test -- --run \
  tests/priorEnvironment.contract.test.ts \
  tests/expandedAppTools.contract.test.ts \
  tests/appToolsBenchmarkIsolation.test.ts

env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY \
  -u ALL_PROXY -u all_proxy \
conda run --no-capture-output -n mobilegym-bench python \
  -m bench_env.task.prior.smoke \
  --env-url http://127.0.0.1:4181 --headless \
  --output runs/hybrid-tools-v5-smoke.json

env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY \
  -u ALL_PROXY -u all_proxy \
conda run --no-capture-output -n mobilegym-bench python \
  -m bench_env.task.prior.boundary_smoke \
  --env-url http://127.0.0.1:4181 --headless \
  --output runs/hybrid-tools-v5-boundary-smoke.json
```

完整 smoke 覆盖 76 条固定时间 setup，确认所有初始状态均不能误通过，并检查每个
相关 App 的运行时工具面。本轮语义修订另有正反例单测覆盖自由文本、数值单位、
地址、天气、日期、时间、忙闲表达及淘宝默认 SKU 边界。

## List And Run

```bash
python -m bench_env.hybrid_benchmark --suite prior --list
```

After model configuration, run hybrid mode with:

```bash
RUN_DIR="runs/hybrid-tools-v5-model-76-par8-$(date +%Y%m%d-%H%M%S)"

env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY \
  -u ALL_PROXY -u all_proxy \
conda run --no-capture-output -n mobilegym-bench python \
  -m bench_env.hybrid_benchmark \
  --suite prior \
  --interaction-mode hybrid \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME" \
  --parallel 8 --headless \
  --max-tokens 8192 --temperature 0 --top-p 1 \
  --output-dir "$RUN_DIR"
```

For the matched GUI-only condition, change only `--interaction-mode gui_only`
and the output directory.

GPT-5.4 uses original screenshot coordinates in this evaluation. For both its Hybrid
and GUI-only runs, additionally pass `--coord-space physical`; this preserves the task,
tools and XML protocol while describing and executing coordinates in the 1080x2400
screenshot space. Gemini runs retain the default `norm_0_1000` mode.
