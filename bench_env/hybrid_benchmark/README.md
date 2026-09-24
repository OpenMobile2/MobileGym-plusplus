# Hybrid Benchmark Runner

This package is an independent adapter between fixed MobileGym tasks and
`HybridAgentRuntime`. It does not modify the official agent factory, controller, runner,
splits, metrics, or benchmark task suites.

The runner supports two controlled interaction conditions through the same XML agent:

- `--interaction-mode hybrid` (default): expose `mobile_use` plus tools from the
  foreground app.
- `--interaction-mode gui_only`: expose only `mobile_use`. This retains every GUI
  action, including `open_app`, but neither discovers nor executes App Tools.

For each episode it performs:

1. `BaseTask.setup()` and deterministic task data injection.
2. Return to the launcher and start `HybridAgentRuntime` with the setup observation.
3. Execute one XML `mobile_use` or App Tool call per model turn.
4. Re-fetch complete final state for every task app.
5. Call the task's state verifier with `JudgeInput(init_obs, last_obs, agent_answer)`.
6. Save screenshots, model prompts/responses, tool returns, judge details, and SR.

## List Tasks

```bash
python -m bench_env.hybrid_benchmark --list
```

## One-Task Smoke Run

```bash
RUN_DIR="runs/hybrid-tools-v1-smoke-$(date +%Y%m%d-%H%M%S)"

env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
python -m bench_env.hybrid_benchmark \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME" \
  --task-ids core.HTV1Cross01 \
  --max-tokens 8192 \
  --output-dir "$RUN_DIR"
```

## Full Suite With Four Workers

```bash
RUN_DIR="runs/hybrid-tools-v1-90-par4-$(date +%Y%m%d-%H%M%S)"

env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
python -m bench_env.hybrid_benchmark \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME" \
  --parallel 4 \
  --max-tokens 8192 \
  --output-dir "$RUN_DIR"
```

Use `--limit N` for a deterministic prefix or `--task-ids` for a comma-separated subset.
The runner reuses one isolated browser environment and model client per worker.

## Controlled GUI-Only Baseline

Use the same runner and XML agent with `--interaction-mode gui_only` for the primary
GUI-only comparison. It preserves the model protocol, screenshots, conversation history,
coordinates, `open_app`, task setup, verifier, and model parameters. Only foreground App
Tool definitions and execution are disabled:

```bash
RUN_DIR="runs/hybrid-tools-v4-${MODEL_NAME}-gui-only-$(date +%Y%m%d-%H%M%S)"

env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
python -m bench_env.hybrid_benchmark \
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

Run the paired hybrid condition with the same command and change only:

```bash
--interaction-mode hybrid
```

Use separate output directories. `interaction_mode` is written to `meta.json`, every
`results.jsonl` row, `summary.json`, each episode's `trace.json`, and its HTML viewer.
In GUI-only runs, `app_tool_calls`, `distinct_app_tools_used`, and `tool_usage` should all
remain zero/empty. An App Tool name emitted by the model is rejected as an invalid call.

The suite can still be run with a different agent through the official MobileGym runner,
but that changes the prompt and history protocol and is therefore not the controlled
GUI-only comparison described here.

The standalone `python -m bench_env.hybrid_agent` command accepts the same
`--interaction-mode hybrid|gui_only` option for manual instructions without a verifier.

## Coordinate modes

The default `--coord-space norm_0_1000` interprets GUI coordinates in the normalized
0-1000 space. For models such as GPT-5.4 that ground clicks in the original screenshot
resolution, pass `--coord-space physical`. This changes the model-facing `mobile_use`
definition, prompt and validation to 1080x2400 screenshot pixels. `MobileGymEnv` then
uses its existing physical-pixel to Playwright viewport conversion. Do not enable this
for models that emit normalized coordinates.

### GPT native computer use

GPT-5.4 should use its Responses API computer-use protocol instead of the Qwen XML
adapter. This keeps screenshots at original fidelity, consumes native computer actions,
and exposes foreground App Tools as native function tools:

```bash
python -m bench_env.hybrid_benchmark \
  --suite prior \
  --interaction-mode hybrid \
  --agent-protocol gpt_responses \
  --reasoning-effort medium \
  --coord-space physical \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name gpt-5.4 \
  --parallel 8 --max-tokens 8192 --headless \
  --output-dir runs/hybrid-tools-v5-gpt54-native
```

For the paired ablation, change only `--interaction-mode gui_only` and the output
directory. `open_app`, `answer`, and `terminate` remain available in both settings;
only app business functions are removed. The GPT protocol requires
`--coord-space physical` and returns each updated screenshot with
`detail="original"`. Other models continue to use the default `xml` protocol.

### Kimi K2.6 独立协议

Kimi K2.6 使用独立的 `kimi_k2_6` 协议。它采用 `Thought:` + `Action:` JSON，
并按 MobileWorld 的公开配置使用 `[0,1]` 归一化坐标。不要给该协议传
`norm_0_1000` 或 `physical`。

Hybrid 标准测试：

```bash
python -m bench_env.hybrid_benchmark \
  --suite native \
  --interaction-mode hybrid \
  --agent-protocol kimi_k2_6 \
  --coord-space norm_0_1 \
  --kimi-thinking enabled \
  --kimi-history-images 3 \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name kimi-k2.6 \
  --parallel 8 --headless \
  --max-tokens 8192 \
  --output-dir runs/hybrid-tools-v6-kimi-k2.6-hybrid-75-par8
```

GUI-only 对照实验使用完全相同的命令，只修改：

```bash
--interaction-mode gui_only \
--output-dir runs/hybrid-tools-v6-kimi-k2.6-gui-only-75-par8
```

Kimi 官方接口对生成参数有固定要求，因此该协议不会使用 CLI 中面向通用模型的
`--temperature` 和 `--top-p`：thinking 开启时固定为 `1.0/0.95`，关闭时固定为
`0.6/0.95`。`--model-extra-body-json` 仍可用于兼容代理服务，例如需要旧式
`enable_thinking` 字段时可传：

```bash
--model-extra-body-json '{"enable_thinking":true}'
```

这套适配只新增模型协议选择，不改变 suite、setup、verifier、环境动作和 General
XML Agent。轨迹仍写入相同的 `trace.json`、逐步截图和 `index.html`。

For OpenAI-compatible deployments that require provider-specific request fields, use
`--model-extra-body-json`. For example, disable Qwen3.x thinking with:

```bash
--model-extra-body-json '{"chat_template_kwargs":{"enable_thinking":false}}'
```

## Outputs

```text
<run>/meta.json
<run>/tasks.json
<run>/results.jsonl
<run>/summary.json
<run>/episodes/<task-id>/index.html
<run>/episodes/<task-id>/trace.json
<run>/episodes/<task-id>/step_*_{before,after}.jpg
```

`summary.json` reports the interaction mode, SR, errors, stop reasons, total App Tool
calls, distinct tools used, and per-tool usage. `clean` and detailed unexpected-change
warnings remain in `results.jsonl` for diagnosis but are not folded into the primary SR.
