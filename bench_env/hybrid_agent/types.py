"""Shared data types for the GUI + App Tools agent runtime."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from bench_env.hybrid_agent.modes import HYBRID_MODE


JsonObject = dict[str, Any]


@dataclass(frozen=True)
class FunctionCall:
    """One model-requested function call."""

    name: str
    arguments: JsonObject


@dataclass(frozen=True)
class ParsedModelResponse:
    """Parsed Qwen-style XML response."""

    thought: str
    action: str
    call: FunctionCall
    raw_response: str


@dataclass(frozen=True)
class StepFeedback:
    """Result returned to the model after executing its previous call."""

    call_id: str
    name: str
    ok: bool
    result: Any

    def to_dict(self) -> JsonObject:
        key = "output" if self.ok else "error"
        return {
            "call_id": self.call_id,
            "name": self.name,
            "ok": self.ok,
            key: self.result,
        }


@dataclass
class HybridStepRecord:
    """Serializable trace entry for one model turn."""

    step: int
    current_app: str
    available_tools: list[str]
    response: str
    call: FunctionCall | None = None
    feedback: StepFeedback | None = None
    ui_effect: str = "none"
    route_before: JsonObject = field(default_factory=dict)
    route_after: JsonObject = field(default_factory=dict)
    started_at: float | None = None
    finished_at: float | None = None

    def to_dict(self) -> JsonObject:
        return {
            "step": self.step,
            "current_app": self.current_app,
            "available_tools": self.available_tools,
            "response": self.response,
            "call": (
                {"name": self.call.name, "arguments": self.call.arguments}
                if self.call
                else None
            ),
            "feedback": self.feedback.to_dict() if self.feedback else None,
            "ui_effect": self.ui_effect,
            "route_before": self.route_before,
            "route_after": self.route_after,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
        }


@dataclass
class HybridRunResult:
    """Outcome of a standalone hybrid-agent episode."""

    trace: list[HybridStepRecord]
    stop_reason: str
    task: str = ""
    interaction_mode: str = HYBRID_MODE
    agent_answer: str | None = None
    agent_message: str | None = None

    def to_dict(self) -> JsonObject:
        return {
            "stop_reason": self.stop_reason,
            "task": self.task,
            "interaction_mode": self.interaction_mode,
            "agent_answer": self.agent_answer,
            "agent_message": self.agent_message,
            "steps": len(self.trace),
            "trace": [record.to_dict() for record in self.trace],
        }
