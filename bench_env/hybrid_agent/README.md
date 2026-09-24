# Hybrid GUI + App Tools Agent

This package is the Python-side integration for mixed MobileGym GUI actions and browser App Tools. It is intentionally independent from the existing `bench_env.agent` implementations and benchmark `Controller`.

## Runtime Flow

```text
current Observation.route.app
  -> BrowserToolClient.list_tools(app=current_app)
  -> dynamic system prompt: mobile_use + current app tools
  -> model returns one Qwen-style XML tool_call
  -> mobile_use: MobileGymEnv.step(Action)
     app tool: window.__MOBILE_GYM_TOOLS__.callTool(...)
  -> await completion
  -> capture the next observation
  -> return structured tool_result + screenshot to the model
```

Only tools belonging to the foreground app are exposed. On the launcher, only `mobile_use` is available. Tool availability is re-evaluated every model turn.

## Standalone Run

From the repository root, with the simulator already running:

```bash
python -m bench_env.hybrid_agent \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME" \
  --max-tokens 8192 \
  --calendar-demo-setup \
  --output-dir runs/hybrid-calendar-demo \
  --instruction "Find the Project Review event, open it and inspect its notes"
```

Each run writes `index.html`, `trace.json`, and per-step before/after screenshots, prompt JSON, model response, and execution result. Without `--output-dir`, a timestamped directory is created under `runs/hybrid_agent/`.

`--calendar-demo-setup` injects a deterministic event before the first model turn:

```text
2026-07-14 14:00-15:00
Project Review / 项目评审
Notes: 会议地点：3号会议室。讨论移动端发布计划。
```

The injected payload is also saved as `setup.json` in the artifact directory.

This mode deliberately has no task setup or verifier. A future benchmark adapter should invoke `HybridAgentRuntime.run(..., initial_observation=task_setup_obs)` and pass its final environment state to the existing judge.

## Boundaries

- Browser TypeScript remains the source of truth for tool schemas and business behavior.
- Python does not access Zustand state or `__SIM__.setState()` to execute tools.
- App tools are executed sequentially and are never parallelized with screenshots.
- A tool name not exposed by the current foreground app is rejected at runtime.
- Each parallel worker must construct its own `BrowserToolClient` from its own environment page.

## Kimi K2.6 独立适配

Kimi K2.6 不经过 `HybridXmlAgent`。它使用独立的 `KimiK26Agent`，但继续复用
相同的 `HybridAgentRuntime`、前台 App Tool 发现机制、MobileGym 动作执行和轨迹
记录。General XML Agent 的 prompt、解析器和坐标行为不会因此改变。

Kimi 协议与 General XML 协议保持以下评测条件一致：

- 每轮只执行一个 GUI 动作或 App Tool；
- 只提供当前前台 App 的工具；
- Hybrid 和 GUI-only 只在是否暴露 App Tools 上有区别；
- 使用相同的任务、setup、环境、最大步数和 verifier；
- GUI 动作最终都进入相同的 `MobileGymEnv.step()`。

模型特定差异如下：

- 输出采用 MobileWorld 风格的 `Thought:` + `Action:` JSON，而不是 Qwen XML；
- 截图坐标为 `[0,1]`，必须使用 `--coord-space norm_0_1`；
- 默认保留最近 3 张截图，较早轮次保留文本历史但省略图片；
- thinking 模式使用固定的 `temperature=1.0, top_p=0.95`；关闭 thinking 时使用
  `temperature=0.6, top_p=0.95`；
- 图片通过 base64 `image_url` 输入，不对 MobileGym 的 1080x2400 截图额外缩放。

模型输出示例：

```text
Thought: Open Calendar directly before inspecting the requested date.
Action: {"action_type":"open_app","app":"calendar"}
```

```text
Thought: Tap the event near the middle of the current screen.
Action: {"action_type":"click","coordinate":[0.51,0.46]}
```

```text
Thought: Use the currently exposed Calendar tool to open the target date.
Action: {"action_type":"app_tool","name":"calendar__open_date","arguments":{"date":"2026-07-14"}}
```

Standalone 调试命令：

```bash
python -m bench_env.hybrid_agent \
  --agent-protocol kimi_k2_6 \
  --coord-space norm_0_1 \
  --kimi-thinking enabled \
  --kimi-history-images 3 \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name kimi-k2.6 \
  --max-tokens 8192 \
  --instruction "Open Calendar and inspect tomorrow's schedule."
```

若需要让视觉历史严格对齐当前 General XML Agent 的“只保留当前截图”设置，可传
`--kimi-history-images 1`。正式复现 MobileWorld 风格的 Kimi 配置时使用默认值 3。
