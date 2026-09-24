"""GPT computer-use adapter backed by the native Responses API."""

from __future__ import annotations

from dataclasses import dataclass
import json
import random
import time
from typing import Any

from bench_env.env.base import Observation
from bench_env.hybrid_agent.modes import GUI_ONLY_MODE
from bench_env.hybrid_agent.types import FunctionCall, ParsedModelResponse, StepFeedback
from bench_env.hybrid_agent.xml_protocol import ToolCallParseError


@dataclass
class GptResponsesAgentConfig:
    base_url: str
    api_key: str
    model: str
    max_output_tokens: int = 8192
    reasoning_effort: str = "medium"
    timeout_s: float = 300.0
    verbose: bool = True


class GptResponsesAgent:
    """Use GPT's native computer and function calls without an XML shim."""

    def __init__(self, config: GptResponsesAgentConfig, client: Any | None = None):
        self.config = config
        if client is None:
            from openai import OpenAI

            client = OpenAI(
                base_url=config.base_url.rstrip("/"),
                api_key=config.api_key,
                timeout=config.timeout_s,
            )
        self.client = client
        self.last_messages: list[dict[str, Any]] = []
        self.last_response = ""
        self._task = ""
        self._previous_response_id: str | None = None
        self._pending_call_id: str | None = None
        self._pending_call_kind: str | None = None
        self._queued_actions: list[dict[str, Any]] = []

    @property
    def name(self) -> str:
        return "GptResponsesAgent"

    def reset(self, task: str) -> None:
        self._task = task
        self.last_messages = []
        self.last_response = ""
        self._previous_response_id = None
        self._pending_call_id = None
        self._pending_call_kind = None
        self._queued_actions = []

    def act(
        self,
        obs: Observation,
        app_tool_definitions: list[dict[str, Any]],
        previous_feedback: StepFeedback | None,
        foreground_app: str | None = None,
        interaction_mode: str = "hybrid",
    ) -> ParsedModelResponse:
        if self._queued_actions and (previous_feedback is None or previous_feedback.ok):
            return self._dequeue_computer_action()
        if previous_feedback is not None and not previous_feedback.ok:
            self._queued_actions.clear()

        tools = self._build_tools(app_tool_definitions, interaction_mode)
        input_items = self._build_input(obs, previous_feedback)
        instructions = self._instructions(foreground_app or obs.current_app, interaction_mode)
        request: dict[str, Any] = {
            "model": self.config.model,
            "tools": tools,
            "input": input_items,
            "instructions": instructions,
            "max_output_tokens": self.config.max_output_tokens,
            "reasoning": {"effort": self.config.reasoning_effort},
        }
        if self._previous_response_id:
            request["previous_response_id"] = self._previous_response_id

        self.last_messages = [
            {"role": "system", "content": instructions},
            {"role": "user", "content": input_items},
        ]
        response = self._create_response(request)
        self._previous_response_id = str(response.id)
        output = [item.model_dump() for item in response.output]
        self.last_response = json.dumps(output, ensure_ascii=False, indent=2)
        if self.config.verbose:
            print(f"\n[GptResponsesAgent response]\n{self.last_response}\n")

        for item in response.output:
            if item.type == "computer_call":
                actions = [action.model_dump() for action in (item.actions or [])]
                if not actions and getattr(item, "action", None) is not None:
                    actions = [item.action.model_dump()]
                if not actions:
                    raise ToolCallParseError("computer_call contained no actions")
                self._pending_call_id = str(item.call_id)
                self._pending_call_kind = "computer"
                self._queued_actions = actions
                return self._dequeue_computer_action()
            if item.type == "function_call":
                self._pending_call_id = str(item.call_id)
                self._pending_call_kind = "function"
                try:
                    arguments = json.loads(item.arguments or "{}")
                except json.JSONDecodeError as error:
                    raise ToolCallParseError(
                        f"invalid native function arguments for {item.name}: {item.arguments}"
                    ) from error
                return self._function_response(str(item.name), arguments)

        final_text = str(getattr(response, "output_text", "") or "").strip()
        if final_text:
            return ParsedModelResponse(
                thought=final_text,
                action="Terminate after the model returned its final response.",
                call=FunctionCall(
                    "mobile_use",
                    {"action": "terminate", "status": "success", "text": final_text},
                ),
                raw_response=self.last_response,
            )
        raise ToolCallParseError("GPT Responses output contained no callable action")

    def _create_response(self, request: dict[str, Any]) -> Any:
        from openai import (
            APIConnectionError,
            APITimeoutError,
            InternalServerError,
            RateLimitError,
        )

        transient = (RateLimitError, APIConnectionError, APITimeoutError, InternalServerError)
        for attempt in range(1, 6):
            try:
                return self.client.responses.create(**request)
            except transient:
                if attempt == 5:
                    raise
                delay = min(30.0, 2.0 ** attempt) + random.uniform(0, 1)
                time.sleep(delay)
        raise RuntimeError("unreachable GPT Responses retry state")

    def _build_input(
        self, obs: Observation, previous_feedback: StepFeedback | None
    ) -> list[dict[str, Any]]:
        screenshot = {
            "type": "computer_screenshot",
            "image_url": obs.image_data_url,
            "detail": "original",
        }
        if self._pending_call_kind == "computer" and self._pending_call_id:
            items = [{
                "type": "computer_call_output",
                "call_id": self._pending_call_id,
                "output": screenshot,
            }]
        elif self._pending_call_kind == "function" and self._pending_call_id:
            payload = previous_feedback.to_dict() if previous_feedback else {}
            # With a previous response, the computer tool accepts screenshots only
            # as computer_call_output. The model can request a fresh screenshot next.
            items = [{
                "type": "function_call_output",
                "call_id": self._pending_call_id,
                "output": json.dumps(payload, ensure_ascii=False),
            }]
        else:
            items = [{
                "role": "user",
                "content": [
                    {"type": "input_text", "text": self._task},
                    {
                        "type": "input_image",
                        "image_url": obs.image_data_url,
                        "detail": "original",
                    },
                ],
            }]
        self._pending_call_id = None
        self._pending_call_kind = None
        return items

    def _build_tools(
        self, definitions: list[dict[str, Any]], interaction_mode: str
    ) -> list[dict[str, Any]]:
        tools: list[dict[str, Any]] = [
            {"type": "computer"},
            _function_tool(
                "open_app",
                "Open a known MobileGym app directly by its exact name or app id.",
                {
                    "type": "object",
                    "properties": {"app": {"type": "string"}},
                    "required": ["app"],
                    "additionalProperties": False,
                },
            ),
            _function_tool(
                "answer",
                "Record a textual answer without ending the task.",
                {
                    "type": "object",
                    "properties": {"text": {"type": "string"}},
                    "required": ["text"],
                    "additionalProperties": False,
                },
            ),
            _function_tool(
                "terminate",
                "End the task only after all requested work is complete or genuinely impossible.",
                {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "enum": ["success", "failure"]},
                        "text": {"type": "string"},
                    },
                    "required": ["status"],
                    "additionalProperties": False,
                },
            ),
        ]
        if interaction_mode != GUI_ONLY_MODE:
            for definition in definitions:
                tools.append(
                    _function_tool(
                        str(definition["name"]),
                        str(definition.get("description") or ""),
                        definition.get("inputSchema")
                        or {"type": "object", "properties": {}},
                    )
                )
        return tools

    def _instructions(self, current_app: str | None, interaction_mode: str) -> str:
        mode = (
            "App-provided business functions are disabled; use visual GUI interaction."
            if interaction_mode == GUI_ONLY_MODE
            else "Sparse functions from the current app may be used together with visual GUI interaction."
        )
        return f"""You are operating the MobileGym mobile simulator to complete the user's task.
The current foreground app is {current_app or 'the launcher/system UI'}. {mode}
Use the computer tool for visible interaction. Its coordinates are original 1080x2400 screenshot pixels.
Use open_app instead of searching launcher pages when the task names an app.
In benchmark instructions, 笔记 or Notes means the system Notes app, not Flomo unless named.
After every action, inspect the returned screenshot and verify that the UI changed as expected.
Do not merely describe an action. Keep working until every requirement is satisfied.
For an information question, call answer with the result, then call terminate with success.
For an operation task, call terminate with success only after the state has actually been changed.
Call at most one non-computer function at a time."""

    def _dequeue_computer_action(self) -> ParsedModelResponse:
        action = self._queued_actions.pop(0)
        arguments = _computer_action_to_mobile_use(action)
        return ParsedModelResponse(
            thought="",
            action=str(action.get("type") or "computer action"),
            call=FunctionCall("mobile_use", arguments),
            raw_response=self.last_response,
        )

    def _function_response(
        self, name: str, arguments: dict[str, Any]
    ) -> ParsedModelResponse:
        if name == "open_app":
            call = FunctionCall(
                "mobile_use", {"action": "open_app", "app": arguments.get("app", "")}
            )
        elif name == "answer":
            call = FunctionCall(
                "mobile_use", {"action": "answer", "text": arguments.get("text", "")}
            )
        elif name == "terminate":
            call = FunctionCall(
                "mobile_use",
                {
                    "action": "terminate",
                    "status": arguments.get("status", "success"),
                    "text": arguments.get("text", ""),
                },
            )
        else:
            call = FunctionCall(name, arguments)
        return ParsedModelResponse("", name, call, self.last_response)


def _function_tool(name: str, description: str, parameters: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "function",
        "name": name,
        "description": description,
        "parameters": parameters,
    }


def _computer_action_to_mobile_use(action: dict[str, Any]) -> dict[str, Any]:
    kind = str(action.get("type") or "").lower()
    if kind == "click":
        return {"action": "click", "coordinate": [action["x"], action["y"]]}
    if kind == "double_click":
        return {"action": "double_tap", "coordinate": [action["x"], action["y"]]}
    if kind == "type":
        return {"action": "type", "text": str(action.get("text") or ""), "clear": True}
    if kind == "scroll":
        x = float(action.get("x", 540))
        y = float(action.get("y", 1200))
        dx = float(action.get("scroll_x", action.get("scrollX", 0)) or 0)
        dy = float(action.get("scroll_y", action.get("scrollY", 0)) or 0)
        scale = min(900.0, max(300.0, abs(dx) if abs(dx) > abs(dy) else abs(dy)))
        if abs(dx) > abs(dy):
            direction = 1 if dx > 0 else -1
            start = [max(0, min(1079, x + direction * scale / 2)), y]
            end = [max(0, min(1079, x - direction * scale / 2)), y]
        else:
            direction = 1 if dy > 0 else -1
            start = [x, max(0, min(2399, y + direction * scale / 2))]
            end = [x, max(0, min(2399, y - direction * scale / 2))]
        return {"action": "swipe", "coordinate": start, "coordinate2": end}
    if kind == "drag":
        path = action.get("path") or []
        if len(path) >= 2:
            return {
                "action": "drag",
                "coordinate": [path[0]["x"], path[0]["y"]],
                "coordinate2": [path[-1]["x"], path[-1]["y"]],
            }
    if kind == "keypress":
        keys = [str(key).lower() for key in action.get("keys") or []]
        if "enter" in keys:
            return {"action": "system_button", "button": "Enter"}
        if "esc" in keys or "escape" in keys or "back" in keys:
            return {"action": "system_button", "button": "Back"}
    if kind == "wait":
        return {"action": "wait", "time": 1}
    if kind in {"screenshot", "move"}:
        return {"action": "wait", "time": 0}
    raise ToolCallParseError(f"unsupported GPT computer action: {action}")
