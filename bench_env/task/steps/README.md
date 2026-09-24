# Hybrid Tools V2

`steps` is a fixed 50-task challenge suite for mixed GUI and sparse
App Tool agents. It is independent of the official MobileGym split and does not
change any upstream task.

## Design

- Instructions describe high-level intent instead of an action recipe.
- Values that must be transferred are present only in simulator state.
- Forty tasks fix official MobileGym L3/L4 scenarios to deterministic defaults
  and inherit the official setup and verifier implementation.
- Ten tasks add genuine dependencies across Calendar, WeChat, Notes, Clock,
  Days Matter, and Taobao Instant using the isolated App Tool setup.
- Apps without tools, including Weather, Map, Alipay, Railway 12306, Bilibili,
  RedBook, Spotify, WeChat Reading, Gallery, File Manager, SMS, and Tencent
  Meeting, remain GUI-only.
- Final-state verifiers are path-independent: pure GUI and hybrid execution are
  judged by the same contract.

See `TASK_CATALOG.md` for all instructions and verifier provenance.
See `RESULTS_GEMINI31PRO.md` for the first full Gemini 3.1 Pro run and repair
provenance.

## Run

```bash
python -m bench_env.hybrid_benchmark \
  --suite steps \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME" \
  --max-tokens 8192 \
  --parallel 4 \
  --output-dir runs/hybrid-tools-v2-gemini31pro-50-par4
```
