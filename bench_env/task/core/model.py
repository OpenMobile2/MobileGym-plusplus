"""Declarative task records for the fixed hybrid-tools benchmark."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class GoalSpec:
    kind: str
    values: dict[str, Any]


@dataclass(frozen=True)
class HybridTaskSpec:
    task_id: str
    instruction: str
    apps: tuple[str, ...]
    setup_profiles: tuple[str, ...]
    goals: tuple[GoalSpec, ...]
    expected_changes: tuple[str, ...]
    candidate_tools: tuple[str, ...]
    gui_required: bool
    max_steps: int = 45
    tags: tuple[str, ...] = field(default_factory=tuple)

    @property
    def class_name(self) -> str:
        return "HTV1" + "".join(part.title() for part in self.task_id.split("_"))


def goal(kind: str, **values: Any) -> GoalSpec:
    return GoalSpec(kind=kind, values=values)

