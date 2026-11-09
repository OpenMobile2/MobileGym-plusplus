# Add a New Agent

This guide shows you how to add an agent adapter to MobileGym so you can evaluate any vision-language model on the benchmark. An "agent" here is a Python class that translates between the simulator's unified action space and your model's prompt/parsing schema. A typical adapter is ~100–150 lines.

## What an adapter has to do

Three jobs:

1. Build a chat-style prompt from the current observation (screenshot + history).
2. Send it to a model endpoint (OpenAI-compatible by default).
3. Parse the response into a unified `Action` object.

`BaseAgent` is an abstract class. It standardizes the shape (`name`, `SYSTEM_PROMPT`, `ACTION_MAP`, `build_messages`, `parse_response`, `reset`, `act`), exposes the trajectory `history` container, and provides helpers like `parse_action`, `get_action_space`, and `_evict_old_records`. Image encoding, prompt shape, LLM calls, and history updates live inside each concrete adapter; the actual OpenAI-compatible request, retry, and streaming are usually delegated to `bench_env/llm/LLMClient`. Look at `bench_env/agent/generic.py` for the canonical pattern.

## File layout

```
bench_env/agent/
├── __init__.py             # registry — your adapter is listed here
├── base.py                 # BaseAgent, AgentConfig, ActionMapping
├── generic.py              # plain JSON {action, args, …}
├── generic_v2.py           # <think> / <answer> two-field schema
├── autoglm.py              # Open-AutoGLM chat schema
├── uitars.py · venus.py · gui_owl.py · gelab.py · mai_ui.py
└── human.py                # manual / Playwright Inspector mode
```

## The unified action space

The benchmark's `Action` enum (defined in `bench_env/env/base.py`) is the contract every adapter must reduce its model's output into. The high-level vocabulary:

| Action | Args | Use |
|---|---|---|
| `CLICK` | `point=(x,y)` | Tap a coordinate (normalized `[0, 1000]`) |
| `DOUBLE_TAP` | `point=(x,y)` | Two quick taps |
| `LONG_PRESS` | `point=(x,y)` | Long press |
| `TYPE` | `value=str`, `clear=bool` | Type into the focused field |
| `SWIPE` | `point1`, `point2` | Swipe between two points (with inertia) |
| `DRAG` | `point1`, `point2` | Drag (slower, hold in between, no inertia) |
| `BACK` | — | System back |
| `HOME` | — | Go to launcher |
| `RECENT` | — | Open recents / multitask UI |
| `ENTER` | — | Synthesize Enter / return key |
| `AWAKE` | `value=str` | Wake / open app by name |
| `WAIT` | `value=seconds` | Idle for some seconds |
| `ANSWER` | `value=str` | Submit a plain text answer in legacy text mode; grounded tasks normally use the AnswerSheet UI |
| `INFO` | `value=str` | Ask the user a question |
| `COMPLETE` | `return=str` | Declare task done |
| `ABORT` | `value=str` | Declare task impossible |

That's the full 16-action vocabulary. (There is an internal `NOOP` sentinel for parse failures or model "thinking" steps; it advances the trajectory without changing environment state. Adapters can emit it but most don't need to.) Adapters omit actions their model never produces.

Coordinates are always normalized to `[0, 1000]`. Playwright maps them to physical pixels for you.

## Adapter skeleton

The simplest adapter inherits `BaseAgent` and implements the abstract surface: `name`, `SYSTEM_PROMPT`, `ACTION_MAP`, `build_messages()`, `parse_response()`, `reset()`, and `act()`. The factory instantiates AI adapters as `agent_cls(llm=llm, config=agent_config)`, so your constructor should accept an `LLMClient`.

```python
import json
from typing import Any, ClassVar, Optional

from bench_env.agent.base import BaseAgent, AgentConfig, ActionMapping, AgentStepRecord
from bench_env.env.base import Action, ActionType, Observation
from bench_env.llm import LLMClient

class MyAgent(BaseAgent):
    SYSTEM_PROMPT: ClassVar[str] = """You are a mobile GUI agent.
Output exactly one JSON object with shape:
  {"action": "CLICK|TYPE|SWIPE|BACK|...", "point": [x, y], "value": "...", ...}
Coordinates are normalized to [0, 1000].
"""

    ACTION_MAP: ActionMapping = {
        "CLICK":     (ActionType.CLICK,      lambda p: {"point": p["point"]}),
        "TYPE":      (ActionType.TYPE,       lambda p: {"value": p["value"], "clear": p.get("clear", False)}),
        "SWIPE":     (ActionType.SWIPE,      lambda p: {"point1": p["point1"], "point2": p["point2"]}),
        "BACK":      (ActionType.BACK,       lambda p: {}),
        "HOME":      (ActionType.HOME,       lambda p: {}),
        "COMPLETE":  (ActionType.COMPLETE,   lambda p: {"return": p.get("return", "done")}),
        "ABORT":     (ActionType.ABORT,      lambda p: {"value": p.get("value", "")}),
    }

    def __init__(self, llm: LLMClient, config: Optional[AgentConfig] = None):
        super().__init__(config)
        self.llm = llm

    @property
    def name(self) -> str:
        return "MyAgent"

    def reset(self, task: str) -> None:
        self._task = task
        self._history = []

    def build_messages(self, obs: Observation) -> list[dict]:
        # Compose the chat-style payload your model expects.
        return [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "text", "text": f"Task: {self.task}\n\nObservation:"},
                {"type": "image_url", "image_url": {"url": obs.image_data_url}},
            ]},
        ]

    def parse_response(self, response_text: str) -> Action:
        # Reduce the model's text into one of the ACTION_MAP entries
        parsed = json.loads(response_text)
        return self.parse_action(parsed["action"], parsed)

    def act(self, obs: Observation) -> Action:
        messages = self.build_messages(obs)
        response = self.llm.chat(
            messages=messages,
            args={**self.config.model_args, "stream": self.config.stream},
        )
        action = self.parse_response(response.content)
        self._history.append(AgentStepRecord(
            step_idx=obs.step_idx,
            observation=obs,
            action=action,
            llm_response=response.content,
            llm_prompt=messages,
        ))
        self._evict_old_records(keep_recent=2)
        return action
```

`parse_action(action_name, parsed_data)` is provided by `BaseAgent` and uses your `ACTION_MAP` to construct the `Action`. You can override it if your model's vocabulary is fundamentally different.

## Register the adapter

Add the import and registry entry to `bench_env/agent/__init__.py`:

```python
from bench_env.agent.my_agent import MyAgent

AGENT_REGISTRY: dict[str, type[BaseAgent]] = {
    # … existing ones …
    "my_agent": MyAgent,
}
```

You can also call `register_agent("my_agent", MyAgent)` if you prefer plugin-style registration from outside `__init__.py`.

That's it — `python -m bench_env.run --agent my_agent ...` now works.

## Run it

```bash
export MODEL_BASE_URL=http://localhost:8001/v1
export MODEL_API_KEY=your-api-key
export MODEL_NAME=my-model

# Smoke-test on a single task
python -m bench_env.run \
  --task-id wechat.ReadMyWxid \
  --agent my_agent \
  --env-url http://localhost:3000 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME"

# Or hand it a free-text instruction, no judge
python -m bench_env.run \
  --exec "Open Settings and turn on airplane mode" \
  --agent my_agent \
  --env-url http://localhost:3000 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME"
```

## Tuning for production

Common knobs you can pass on the CLI:

| Flag | Purpose |
|---|---|
| `--temperature 0.0` | Greedy decoding for reproducibility |
| `--top-p 0.9` | Nucleus sampling cap |
| `--max-tokens 1024` | Cap per turn |
| `--no-stream` | Disable streaming if your endpoint doesn't support it |
| `--infer-timeout 300.0` | Per-request timeout in seconds |
| `--screenshot-scale 1.0` | Downscale screenshots before sending (JPEG is small enough that 1.0 is usually fine) |
| `--delay-after-action 1.0` | Wait after each action so animations finish before the next screenshot |
| `--max-steps 30` | Step budget cap (overrides per-difficulty default) |

If your model needs a custom default for any of these, set `DEFAULT_MODEL_ARGS` on the class:

```python
class MyAgent(BaseAgent):
    DEFAULT_MODEL_ARGS = {"temperature": 0.0, "top_p": 0.95, "max_tokens": 2048}
```

## History management

`BaseAgent` exposes `self.history` (a list of `AgentStepRecord`) and cleanup helpers, but your adapter's `act()` method is responsible for appending each step. Most adapters render a compact view of the last few steps into the user message so the model has short-term context. See `bench_env/agent/autoglm.py` for a good example of building a history block.

If your model has a context-length budget, override `_evict_old_records(keep_recent: int)` to truncate intelligently.

## Special action types worth knowing

- **`INFO`** — the agent asks for clarification mid-run. The default `AgentConfig.info_reply` returns an automatic fallback reply; use `bench_env.agent.interactive_info_reply` in a custom factory/config if you want a blocking terminal prompt.
- **`COMPLETE` / `ABORT`** — proper termination signals. Reaching `max_steps` without `COMPLETE` shows up in the `OT` (Overdue Termination) metric.
- **`AWAKE`** — switches apps by name. Adapters that don't model app-switching can drop this from their action space.

## Tips and pitfalls

- **Coordinates outside `[0, 1000]`** silently clamp. Watch for parse errors that produce `2400` from a misread "y-coord at the bottom" — that's almost certainly a parsing bug.
- **Image format.** Prefer `obs.image_data_url` for chat-completions image inputs; it builds the correct `data:` URL from either `obs.screenshot_bytes` or `obs.screenshot_base64`. Use `obs.get_screenshot_bytes()` for raw bytes, or `obs.screenshot` for a decoded HWC RGB array when available.
- **Token budgeting.** A typical 1.5 MP screenshot can dominate context. Use `--screenshot-scale 0.75` if you hit limits.
- **Don't mutate the observation.** It's reused for the trajectory record.
- **Retries vs. backoff.** `LLMClient` retries transient OpenAI SDK connection, timeout, and internal-server errors, plus the known vLLM `"Already borrowed"` tokenizer error. Other provider errors should bubble as exceptions — the runner will log them as step failures.

## Reference adapters

Read these in order of increasing complexity:

| Adapter | Schema | Worth studying for… |
|---|---|---|
| `generic.py` | Plain JSON | The minimum viable shape |
| `generic_v2.py` | `<think>` + `<answer>` | Two-field reasoning models |
| `autoglm.py` | AutoGLM chat | Chinese-prompt design + rich history blocks |
| `uitars.py` | UI-TARS schema | Action vocabulary expansion |
| `gui_owl.py` | GUI-Owl think mode | Streaming `<think>` parsing |
| `venus.py` | UI-Venus schema | Coordinate action parsing |
| `gelab.py` | Gelab-Zero schema | Tab-separated action parsing |
| `mai_ui.py` | MAI-UI schema | Multimodal-action-interface checkpoints |
| `human.py` | None | Manual fallback via Playwright Inspector |

## Where to go next

- 📊 Bench it on the 256-task test split → [bench-an-agent.md](bench-an-agent.md)
- 🏆 Submit your agent to the leaderboard → open a PR adding a row to the leaderboard table in [`../../README.md`](../../README.md)
- 🧪 Sanity-check it on a single task first → [getting-started.md](../getting-started.md#run-the-full-benchmark)
