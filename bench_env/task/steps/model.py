"""Declarative metadata for the fixed hybrid-tools-v2 suite."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from bench_env.task.core.model import GoalSpec


@dataclass(frozen=True)
class HybridV2TaskSpec:
    task_id: str
    instruction: str
    apps: tuple[str, ...]
    setup_profiles: tuple[str, ...] = ()
    goals: tuple[GoalSpec, ...] = ()
    expected_changes: tuple[str, ...] = ()
    candidate_tools: tuple[str, ...] = ()
    gui_required: bool = True
    max_steps: int = 60
    tags: tuple[str, ...] = field(default_factory=tuple)
    difficulty: str = "L4"
    scope: str = "S3"
    composition: str = "deep_dive"
    source_task: str | None = None

    @property
    def class_name(self) -> str:
        return "HTV2" + "".join(part.title() for part in self.task_id.split("_"))


def make_spec(
    task_id: str,
    instruction: str,
    apps: list[str],
    *,
    profiles: list[str] | None = None,
    goals: list[GoalSpec] | None = None,
    changes: list[str] | None = None,
    tools: list[str] | None = None,
    tags: list[str] | None = None,
    difficulty: str = "L4",
    scope: str = "S3",
    composition: str = "deep_dive",
    source_task: str | None = None,
    max_steps: int = 60,
) -> HybridV2TaskSpec:
    return HybridV2TaskSpec(
        task_id=task_id,
        instruction=instruction,
        apps=tuple(apps),
        setup_profiles=tuple(profiles or ()),
        goals=tuple(goals or ()),
        expected_changes=tuple(changes or ()),
        candidate_tools=tuple(tools or ()),
        tags=tuple(tags or ()),
        difficulty=difficulty,
        scope=scope,
        composition=composition,
        source_task=source_task,
        max_steps=max_steps,
    )

