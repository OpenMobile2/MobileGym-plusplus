"""Declarative records for the Hybrid Tools V4 suite."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class HybridV4Case:
    index: int
    v3_index: int
    source_task: str
    original_instruction: str
    instruction: str
    group: str
    rationale: str
    revision: str
    audit_reason: str
    simulated_time: str
    tags: tuple[str, ...] = field(default_factory=tuple)
    apps: tuple[str, ...] = field(default_factory=tuple)
    setup_profiles: tuple[str, ...] = field(default_factory=tuple)
    candidate_tools: tuple[str, ...] = field(default_factory=tuple)
    verifier_ignored_fields: tuple[str, ...] = field(default_factory=tuple)
    goals: tuple[Any, ...] = field(default_factory=tuple)
    expected_changes: tuple[str, ...] = field(default_factory=tuple)
    gui_required: bool = True
    difficulty: str = "L4"
    scope: str = "S3"
    composition: str = "deep_dive"
    max_steps: int = 60

    @property
    def task_id(self) -> str:
        return f"case_{self.index:02d}"

    @property
    def class_name(self) -> str:
        return f"HTV4Case{self.index:02d}"

