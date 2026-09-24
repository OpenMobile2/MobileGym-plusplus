"""Kimi K2.6 protocol adapter for MobileGym GUI and App Tools."""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
import json
import re
from typing import Any

from bench_env.env.base import Observation
from bench_env.hybrid_agent.mobile_use import MOBILE_USE_NAME
from bench_env.hybrid_agent.modes import GUI_ONLY_MODE, HYBRID_MODE, validate_interaction_mode
from bench_env.hybrid_agent.prompt import build_user_text
from bench_env.hybrid_agent.types import FunctionCall, ParsedModelResponse, StepFeedback
from bench_env.hybrid_agent.xml_protocol import ToolCallParseError, model_function_definition


KIMI_K2_6_PROTOCOL = "kimi_k2_6"
KIMI_COORD_SPACE = "norm_0_1"


@dataclass
class KimiK26AgentConfig:
    """Model-facing settings kept separate from the general XML agent."""

    model_args: dict[str, Any] = field(
        default_factory=lambda: kimi_k2_6_model_args(max_tokens=8192)
    )
    stream: bool = False
    verbose: bool = True
    history_n_images: int = 3


@dataclass(frozen=True)
class _ConversationTurn:
    step: int
    user_text: str
    image_data_url: str
    assistant_text: str


def kimi_k2_6_model_args(
    *,
    max_tokens: int,
    thinking_enabled: bool = True,
    extra_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build request parameters accepted by the official Kimi K2.6 API."""

    body = dict(extra_body or {})
    if "thinking" not in body and "enable_thinking" not in body:
        body["thinking"] = {
            "type": "enabled" if thinking_enabled else "disabled"
        }
    return {
        "temperature": 1.0 if thinking_enabled else 0.6,
        "top_p": 0.95,
        "max_tokens": int(max_tokens),
        "extra_body": body,
    }


class KimiK26Agent:
    """MobileWorld-style Kimi protocol mapped onto MobileGym's action space."""

    def __init__(self, llm: Any, config: KimiK26AgentConfig | None = None):
        self.llm = llm
        self.config = config or KimiK26AgentConfig()
        if self.config.history_n_images < 1:
            raise ValueError("history_n_images must be at least 1")
        self._task = ""
        self._history: list[_ConversationTurn] = []
        self.last_messages: list[dict[str, Any]] = []
        self.last_response = ""

    @property
    def name(self) -> str:
        return "KimiK26Agent"

    def reset(self, task: str) -> None:
        self._task = task
        self._history = []
        self.last_messages = []
        self.last_response = ""

    def act(
        self,
        obs: Observation,
        app_tool_definitions: list[dict[str, Any]],
        previous_feedback: StepFeedback | None,
        foreground_app: str | None = None,
        interaction_mode: str = HYBRID_MODE,
    ) -> ParsedModelResponse:
        current_app = obs.current_app if foreground_app is None else foreground_app
        system_prompt, schemas_by_name = build_kimi_k2_6_system_prompt(
            app_tool_definitions,
            current_app,
            interaction_mode,
        )
        step = len(self._history) + 1
        user_text = build_user_text(
            self._task,
            step,
            previous_feedback.to_dict() if previous_feedback else None,
        )
        messages = self._build_messages(system_prompt, obs.image_data_url, user_text)
        response = self.llm.chat(
            messages=messages,
            args={
                **self.config.model_args,
                "stream": self.config.stream,
                "stream_print": self.config.stream and self.config.verbose,
            },
        )
        response_text = str(response.content or "")
        self.last_response = response_text
        self.last_messages = _artifact_message_view(messages)
        self._history.append(
            _ConversationTurn(step, user_text, obs.image_data_url, response_text)
        )
        if self.config.verbose and not self.config.stream:
            print(f"\n[KimiK26Agent response]\n{response_text}\n")
        return parse_kimi_k2_6_response(response_text, schemas_by_name)

    def _build_messages(
        self,
        system_prompt: str,
        current_image: str,
        current_user_text: str,
    ) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt}
        ]
        historical_image_budget = max(0, self.config.history_n_images - 1)
        first_visual_history = max(0, len(self._history) - historical_image_budget)
        for index, turn in enumerate(self._history):
            content: list[dict[str, Any]] = []
            if index >= first_visual_history:
                content.append(_image_part(turn.image_data_url))
            else:
                content.append(
                    {
                        "type": "text",
                        "text": "[The screenshot from this past turn is omitted.]",
                    }
                )
            content.append({"type": "text", "text": turn.user_text})
            messages.append({"role": "user", "content": content})
            messages.append({"role": "assistant", "content": turn.assistant_text})
        messages.append(
            {
                "role": "user",
                "content": [
                    _image_part(current_image),
                    {"type": "text", "text": current_user_text},
                ],
            }
        )
        return messages


def build_kimi_k2_6_system_prompt(
    app_tool_definitions: list[dict[str, Any]],
    current_app: str,
    interaction_mode: str = HYBRID_MODE,
) -> tuple[str, dict[str, dict[str, Any]]]:
    """Build Kimi's dynamic prompt without touching the general XML prompt."""

    interaction_mode = validate_interaction_mode(interaction_mode)
    converted_tools = []
    if interaction_mode != GUI_ONLY_MODE:
        converted_tools = [
            model_function_definition(item)["function"]
            for item in app_tool_definitions
        ]
    schemas_by_name = {
        str(item["name"]): item.get("parameters")
        or {"type": "object", "properties": {}}
        for item in converted_tools
    }
    app_context = current_app or "launcher/system UI"
    role = (
        "You are a mobile agent operating the MobileGym simulator. Complete the "
        "user's task entirely through visible GUI interaction."
        if interaction_mode == GUI_ONLY_MODE
        else "You are a mobile agent operating the MobileGym simulator. Complete the "
        "user's task by combining visible GUI interaction with the sparse App Tools "
        "available in the current foreground app."
    )
    if converted_tools:
        rendered_tools = "\n".join(
            json.dumps(item, ensure_ascii=False, separators=(",", ":"))
            for item in converted_tools
        )
        tool_policy = f"""Sparse App Tools from the current foreground app are listed below.
Call one with action_type `app_tool`, its exact `name`, and an `arguments` object.
<app_tools>
{rendered_tools}
</app_tools>"""
    else:
        reason = (
            "App-provided business tools are disabled in this GUI-only run."
            if interaction_mode == GUI_ONLY_MODE
            else "The launcher/system UI exposes no App Tools in this turn."
        )
        tool_policy = reason + " Do not emit action_type `app_tool`."

    return f"""# Role

{role}

# Runtime policy

- The current foreground context is `{app_context}`.
- Execute exactly one action per turn, then inspect the next screenshot and tool result.
- Never invent an App Tool or call a tool that is not listed in this turn.
- When a task names an app, prefer `open_app` with its exact name or id instead of guessing a launcher icon.
- In benchmark instructions, `笔记` or `Notes` means the system Notes app, never Flomo unless Flomo is named explicitly.
- `answer` records an answer but does not terminate. After every requested operation is complete, use `terminate` with status `success`.
- Use `terminate` with status `failure` only when the task is genuinely impossible, not after a recoverable error.

# Screenshot coordinates

- The screenshot coordinate system is normalized independently on both axes to `[0, 1]`.
- The top-left corner is `[0, 0]` and the bottom-right corner is `[1, 1]`.
- Use the center of a visible target. For example, `[0.25, 0.75]` means 25% from the left and 75% from the top.
- Every click, long press, swipe, and drag coordinate must remain in this range.

# GUI action format

Return one JSON action after the `Action:` label:

- Click: `{{"action_type":"click","coordinate":[0.25,0.75]}}`
- Double tap: `{{"action_type":"double_tap","coordinate":[0.25,0.75]}}`
- Long press: `{{"action_type":"long_press","coordinate":[0.25,0.75],"time":0.8}}`
- Type into the focused field: `{{"action_type":"input_text","text":"hello","clear":false}}`
- Swipe: `{{"action_type":"swipe","start_coordinate":[0.5,0.8],"end_coordinate":[0.5,0.2]}}`
- Drag: `{{"action_type":"drag","start_coordinate":[0.3,0.4],"end_coordinate":[0.7,0.6]}}`
- System button: `{{"action_type":"system_button","button":"Back"}}`
- Open app: `{{"action_type":"open_app","app":"calendar"}}`
- Wait: `{{"action_type":"wait","time":1}}`
- Record answer: `{{"action_type":"answer","text":"answer text"}}`
- Finish: `{{"action_type":"terminate","status":"success","text":"optional summary"}}`
- App Tool: `{{"action_type":"app_tool","name":"tool_name","arguments":{{...}}}}`

{tool_policy}

# Response format

Respond in exactly this order:

Thought: one concise sentence explaining the next move.
Action: one valid JSON object for exactly one GUI action or App Tool call.

Do not add Markdown fences or any text after the Action JSON.
""", schemas_by_name


def parse_kimi_k2_6_response(
    response_text: str,
    schemas_by_name: dict[str, dict[str, Any]],
) -> ParsedModelResponse:
    """Parse Kimi Thought/Action JSON and map it to a runtime FunctionCall."""

    raw = str(response_text or "").strip()
    if not raw:
        raise ToolCallParseError("empty Kimi model response")
    visible = re.sub(r"<think>.*?</think>", "", raw, flags=re.IGNORECASE | re.DOTALL).strip()
    parts = re.split(r"(?:^|\n)\s*Action\s*:\s*", visible, maxsplit=1, flags=re.IGNORECASE)
    if len(parts) != 2:
        raise ToolCallParseError("expected `Thought:` followed by one `Action:` JSON object")
    thought = re.sub(r"^\s*Thought\s*:\s*", "", parts[0], flags=re.IGNORECASE).strip()
    action_data = _decode_action_json(parts[1])
    call = _action_to_function_call(action_data, schemas_by_name)
    return ParsedModelResponse(
        thought=thought,
        action=str(action_data.get("action_type") or ""),
        call=call,
        raw_response=raw,
    )


def _action_to_function_call(
    action_data: dict[str, Any],
    schemas_by_name: dict[str, dict[str, Any]],
) -> FunctionCall:
    raw_kind = str(action_data.get("action_type") or "").strip().lower().replace("-", "_")
    aliases = {
        "tap": "click",
        "press": "click",
        "touch": "click",
        "double_click": "double_tap",
        "long_tap": "long_press",
        "type": "input_text",
        "enter_text": "input_text",
        "navigate_home": "home",
        "navigate_back": "back",
        "keyboard_enter": "enter",
        "mcp": "app_tool",
    }
    kind = aliases.get(raw_kind, raw_kind)

    if kind == "app_tool":
        name = str(action_data.get("name") or action_data.get("action_name") or "").strip()
        arguments = action_data.get("arguments", action_data.get("action_json", {}))
        if name not in schemas_by_name:
            raise ToolCallParseError(f"App Tool is not available in this turn: {name or '<empty>'}")
        if not isinstance(arguments, dict):
            raise ToolCallParseError(f"arguments for {name} must be a JSON object")
        _validate_tool_arguments(name, arguments, schemas_by_name[name])
        return FunctionCall(name, arguments)

    if kind in {"click", "double_tap", "long_press"}:
        arguments: dict[str, Any] = {
            "action": kind,
            "coordinate": _normalized_point(action_data.get("coordinate"), "coordinate"),
        }
        if kind == "long_press" and "time" in action_data:
            arguments["time"] = _non_negative_number(action_data["time"], "time")
        return FunctionCall(MOBILE_USE_NAME, arguments)

    if kind == "input_text":
        arguments = {
            "action": "type",
            "text": _required_string(action_data, "text"),
            "clear": _optional_boolean(action_data.get("clear", False), "clear"),
        }
        if "coordinate" in action_data:
            arguments["coordinate"] = _normalized_point(
                action_data["coordinate"], "coordinate"
            )
        return FunctionCall(MOBILE_USE_NAME, arguments)

    if kind in {"swipe", "drag"}:
        start = action_data.get("start_coordinate", action_data.get("coordinate"))
        end = action_data.get("end_coordinate", action_data.get("coordinate2"))
        return FunctionCall(
            MOBILE_USE_NAME,
            {
                "action": kind,
                "coordinate": _normalized_point(start, "start_coordinate"),
                "coordinate2": _normalized_point(end, "end_coordinate"),
            },
        )

    if kind == "scroll":
        return FunctionCall(MOBILE_USE_NAME, _scroll_to_swipe(action_data))

    if kind in {"home", "back", "enter"}:
        return FunctionCall(
            MOBILE_USE_NAME,
            {"action": "system_button", "button": kind.title()},
        )

    if kind == "system_button":
        return FunctionCall(
            MOBILE_USE_NAME,
            {
                "action": "system_button",
                "button": _required_string(action_data, "button"),
            },
        )

    if kind == "open_app":
        return FunctionCall(
            MOBILE_USE_NAME,
            {"action": "open_app", "app": _required_string(action_data, "app")},
        )

    if kind == "wait":
        return FunctionCall(
            MOBILE_USE_NAME,
            {
                "action": "wait",
                "time": _non_negative_number(action_data.get("time", 1), "time"),
            },
        )

    if kind == "answer":
        return FunctionCall(
            MOBILE_USE_NAME,
            {"action": "answer", "text": _required_string(action_data, "text")},
        )

    if kind in {"terminate", "status"}:
        status = str(
            action_data.get("status") or action_data.get("goal_status") or ""
        ).strip().lower()
        status = {"complete": "success", "completed": "success", "infeasible": "failure"}.get(
            status, status
        )
        if status not in {"success", "failure"}:
            raise ToolCallParseError("terminate status must be success or failure")
        return FunctionCall(
            MOBILE_USE_NAME,
            {
                "action": "terminate",
                "status": status,
                "text": str(action_data.get("text") or ""),
            },
        )

    raise ToolCallParseError(f"unsupported Kimi action_type: {raw_kind or '<empty>'}")


def _decode_action_json(payload: str) -> dict[str, Any]:
    text = payload.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```\s*$", "", text)
    start = text.find("{")
    if start < 0:
        raise ToolCallParseError("Action must contain one JSON object")
    try:
        value, end = json.JSONDecoder().raw_decode(text[start:])
    except json.JSONDecodeError as error:
        raise ToolCallParseError(f"invalid Action JSON: {error}") from error
    trailing = text[start + end :].strip()
    if trailing:
        raise ToolCallParseError("unexpected text after the Action JSON object")
    if not isinstance(value, dict):
        raise ToolCallParseError("Action JSON must be an object")
    return value


def _validate_tool_arguments(
    name: str,
    arguments: dict[str, Any],
    schema: dict[str, Any],
) -> None:
    properties = schema.get("properties") or {}
    if schema.get("additionalProperties") is False:
        unknown = sorted(set(arguments) - set(properties))
        if unknown:
            raise ToolCallParseError(f"unknown argument for {name}: {', '.join(unknown)}")
    missing = [item for item in schema.get("required") or [] if item not in arguments]
    if missing:
        raise ToolCallParseError(f"missing required arguments for {name}: {', '.join(missing)}")


def _normalized_point(value: Any, name: str) -> list[float]:
    if not isinstance(value, list) or len(value) != 2:
        raise ToolCallParseError(f"{name} must be a two-item coordinate array")
    point = [_number(item, name) for item in value]
    if any(item < 0 or item > 1 for item in point):
        raise ToolCallParseError(f"{name} values must be in the 0-1 range")
    return point


def _scroll_to_swipe(action_data: dict[str, Any]) -> dict[str, Any]:
    direction = str(action_data.get("direction") or "").strip().lower()
    coordinates = {
        "down": ([0.5, 0.8], [0.5, 0.2]),
        "up": ([0.5, 0.2], [0.5, 0.8]),
        "right": ([0.8, 0.5], [0.2, 0.5]),
        "left": ([0.2, 0.5], [0.8, 0.5]),
    }
    if direction not in coordinates:
        raise ToolCallParseError("scroll direction must be up, down, left, or right")
    start, end = coordinates[direction]
    return {"action": "swipe", "coordinate": start, "coordinate2": end}


def _required_string(data: dict[str, Any], name: str) -> str:
    value = data.get(name)
    if value is None or not str(value).strip():
        raise ToolCallParseError(f"{name} is required")
    return str(value)


def _number(value: Any, name: str) -> float:
    if isinstance(value, bool):
        raise ToolCallParseError(f"{name} must contain numbers")
    try:
        return float(value)
    except (TypeError, ValueError) as error:
        raise ToolCallParseError(f"{name} must contain numbers") from error


def _non_negative_number(value: Any, name: str) -> float:
    number = _number(value, name)
    if number < 0:
        raise ToolCallParseError(f"{name} must be non-negative")
    return number


def _optional_boolean(value: Any, name: str) -> bool:
    if not isinstance(value, bool):
        raise ToolCallParseError(f"{name} must be a boolean")
    return value


def _image_part(image_data_url: str) -> dict[str, Any]:
    if image_data_url and not image_data_url.startswith("data:image/"):
        raise ValueError("Kimi K2.6 requires base64 image data URLs")
    return {"type": "image_url", "image_url": {"url": image_data_url}}


def _artifact_message_view(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep the current image for the recorder and label older visual history."""

    result = copy.deepcopy(messages)
    image_parts = [
        part
        for message in result
        if isinstance(message.get("content"), list)
        for part in message["content"]
        if isinstance(part, dict) and part.get("type") == "image_url"
    ]
    for index, part in enumerate(image_parts[:-1], start=1):
        part["image_url"]["url"] = f"<Kimi historical screenshot {index}>"
    return result
