"""Async orchestration loop for mixed MobileGym GUI and browser App Tools."""

from __future__ import annotations

import asyncio
import time
from typing import Any, Protocol

from bench_env.env.app_aliases import resolve_app_id
from bench_env.env.base import ActionType, Observation
from bench_env.hybrid_agent.agent import HybridXmlAgent
from bench_env.hybrid_agent.browser_tools import BrowserToolClient
from bench_env.hybrid_agent.mobile_use import (
    MOBILE_USE_NAME,
    MobileUseArgumentError,
    to_mobilegym_action,
)
from bench_env.hybrid_agent.modes import (
    GUI_ONLY_MODE,
    HYBRID_MODE,
    validate_interaction_mode,
)
from bench_env.hybrid_agent.types import (
    FunctionCall,
    HybridRunResult,
    HybridStepRecord,
    StepFeedback,
)
from bench_env.hybrid_agent.xml_protocol import ToolCallParseError


class HybridStepRecorder(Protocol):
    def record_step(
        self,
        record: HybridStepRecord,
        before: Observation,
        after: Observation,
        messages: list[dict[str, Any]],
    ) -> None: ...

    def finish(self, result: HybridRunResult) -> None: ...


class HybridAgentRuntime:
    """Runs one model turn, then exactly one GUI or app-tool call, sequentially."""

    def __init__(
        self,
        env: Any,
        agent: Any,
        recorder: HybridStepRecorder | None = None,
        interaction_mode: str = HYBRID_MODE,
    ):
        self.env = env
        self.agent = agent
        self.recorder = recorder
        self.interaction_mode = validate_interaction_mode(interaction_mode)
        self.browser_tools = BrowserToolClient(env.page)
        self._local_call_sequence = 0

    async def run(
        self,
        task: str,
        *,
        max_steps: int = 30,
        initial_observation: Observation | None = None,
    ) -> HybridRunResult:
        """Run a standalone episode; task setup and verifier remain caller-owned."""

        self.agent.reset(task)
        obs = initial_observation or await self.env.get_observation()
        feedback: StepFeedback | None = None
        trace: list[HybridStepRecord] = []
        stop_reason = "MAX_STEPS"

        for step in range(1, max_steps + 1):
            if self.interaction_mode == GUI_ONLY_MODE:
                current_app = await self.browser_tools.resolve_foreground_app(
                    obs.current_app
                )
                definitions: list[dict[str, Any]] = []
            else:
                tool_context = await self.browser_tools.discover_tools(obs.current_app)
                current_app = tool_context.app
                definitions = tool_context.tools
            before_obs = obs
            definitions_by_name = {
                str(item.get("name")): item
                for item in definitions
                if isinstance(item, dict) and item.get("name")
            }
            available_names = [MOBILE_USE_NAME, *definitions_by_name]
            route_before = dict(obs.route)
            started_at = time.time()

            try:
                parsed = await asyncio.to_thread(
                    self.agent.act,
                    obs,
                    definitions,
                    feedback,
                    current_app,
                    self.interaction_mode,
                )
            except ToolCallParseError as error:
                feedback = self._local_error("protocol", "INVALID_TOOL_CALL", str(error))
                record = HybridStepRecord(
                    step=step,
                    current_app=current_app,
                    available_tools=available_names,
                    response=self.agent.last_response,
                    feedback=feedback,
                    route_before=route_before,
                    route_after=route_before,
                    started_at=started_at,
                    finished_at=time.time(),
                )
                trace.append(record)
                if self.recorder:
                    self.recorder.record_step(
                        record, before_obs, obs, self.agent.last_messages
                    )
                continue

            call = parsed.call
            if call.name == MOBILE_USE_NAME:
                feedback, obs, done = await self._execute_mobile_use(call)
                mobile_action = str(call.arguments.get("action") or "").lower()
                ui_effect = "navigation" if mobile_action in {
                    "click",
                    "double_tap",
                    "long_press",
                    "type",
                    "swipe",
                    "drag",
                    "system_button",
                    "open_app",
                } else "none"
            else:
                definition = definitions_by_name.get(call.name)
                if definition is None:
                    feedback = self._local_error(
                        call.name,
                        "TOOL_NOT_AVAILABLE",
                        f"{call.name} is not exposed by the foreground app {current_app or '<none>'}",
                    )
                    done = False
                else:
                    actual_context = await self.browser_tools.discover_tools(obs.current_app)
                    actual_app = actual_context.app
                    actual_names = {
                        str(item.get("name"))
                        for item in actual_context.tools
                        if isinstance(item, dict) and item.get("name")
                    }
                    if actual_app != current_app or call.name not in actual_names:
                        feedback = self._local_error(
                            call.name,
                            "STALE_TOOL_CONTEXT",
                            f"foreground tool context changed from {current_app or '<system>'} "
                            f"to {actual_app or '<system>'}",
                        )
                    else:
                        feedback = await self._execute_app_tool(call)
                    done = False
                ui_effect = str(
                    ((definition or {}).get("annotations") or {}).get("uiEffect") or "none"
                )
                # callTool() is awaited; only now capture the UI that resulted from it.
                obs = await self.env.get_observation()

            record = HybridStepRecord(
                step=step,
                current_app=current_app,
                available_tools=available_names,
                response=parsed.raw_response,
                call=call,
                feedback=feedback,
                ui_effect=ui_effect,
                route_before=route_before,
                route_after=dict(obs.route),
                started_at=started_at,
                finished_at=time.time(),
            )
            trace.append(record)
            if self.recorder:
                self.recorder.record_step(
                    record, before_obs, obs, self.agent.last_messages
                )
            if self.agent.config.verbose:
                print(
                    f"[Hybrid step {step}] {call.name}({call.arguments}) "
                    f"-> ok={feedback.ok}, app={obs.current_app or 'launcher'}"
                )
            if done:
                reason = feedback.result.get("stop_reason") or "TERMINATED"
                stop_reason = str(getattr(reason, "value", reason))
                break

        result = HybridRunResult(
            trace=trace,
            stop_reason=stop_reason,
            task=task,
            interaction_mode=self.interaction_mode,
            agent_answer=getattr(self.env, "agent_answer", None),
            agent_message=getattr(self.env, "agent_message", None),
        )
        if self.recorder:
            self.recorder.finish(result)
        return result

    async def _execute_mobile_use(
        self, call: FunctionCall
    ) -> tuple[StepFeedback, Observation, bool]:
        try:
            action = to_mobilegym_action(
                call.arguments,
                coord_space=str(getattr(self.env, "coord_space", "norm_0_1000")),
                physical_size=(
                    int(getattr(self.env, "physical_width", 1080)),
                    int(getattr(self.env, "physical_height", 2400)),
                ),
            )
        except MobileUseArgumentError as error:
            obs = await self.env.get_observation()
            return (
                self._local_error(call.name, "INVALID_ARGUMENT", str(error)),
                obs,
                False,
            )

        if action.action_type == ActionType.AWAKE:
            app_name = str(action.data.get("value") or "").strip()
            app_name_map = getattr(self.env, "APP_NAME_MAP", None)
            known_app_ids = getattr(self.env, "_KNOWN_APP_IDS", None)
            if isinstance(app_name_map, dict) and known_app_ids is not None:
                if resolve_app_id(app_name, app_name_map, known_app_ids) is None:
                    obs = await self.env.get_observation()
                    return (
                        self._local_error(
                            call.name,
                            "APP_NOT_FOUND",
                            f"Unknown app '{app_name}'; use a supported app name or app id.",
                        ),
                        obs,
                        False,
                    )

        result = await self.env.step(action)
        call_id = self._next_local_call_id()
        output = {
            "action_type": action.action_type.value,
            "done": result.done,
            **result.info,
        }
        return StepFeedback(call_id, call.name, True, output), result.observation, result.done

    async def _execute_app_tool(self, call: FunctionCall) -> StepFeedback:
        result = await self.browser_tools.call_tool(call.name, call.arguments)
        call_id = str(result.get("callId") or self._next_local_call_id())
        if bool(result.get("ok")):
            return StepFeedback(call_id, call.name, True, result.get("output"))
        return StepFeedback(
            call_id,
            call.name,
            False,
            result.get("error") or {"code": "UNKNOWN_TOOL_ERROR", "message": "Tool failed"},
        )

    def _local_error(self, name: str, code: str, message: str) -> StepFeedback:
        return StepFeedback(
            self._next_local_call_id(),
            name,
            False,
            {"code": code, "message": message},
        )

    def _next_local_call_id(self) -> str:
        self._local_call_sequence += 1
        return f"hybrid_call_{self._local_call_sequence}"
