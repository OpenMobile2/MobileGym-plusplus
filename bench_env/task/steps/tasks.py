"""Materialize the 50 fixed hybrid-tools-v2 tasks."""

from __future__ import annotations

from typing import Any, ClassVar

from bench_env.task.base import BaseTask
from bench_env.task.core.verifier import evaluate_goals
from bench_env.task.steps.model import HybridV2TaskSpec, make_spec
from bench_env.task.steps.setup import apply_setup_profiles
from bench_env.task.steps.specs import (
    CUSTOM_SPECS,
    OFFICIAL_CASES,
    TASK_SPECS,
    tools_for,
)
from bench_env.task.judge import JudgeInput
from bench_env.task.registry import TaskRegistry


class _FixedInstructionMixin:
    """Keep official defaults but disable sampling and template expansion."""

    def _create_sampler(self):
        return None

    @property
    def description(self) -> str:
        return self.templates[0]


class _CustomHybridV2Task(BaseTask):
    spec: ClassVar[HybridV2TaskSpec]
    capabilities = ["gui", "tool_use", "reasoning", "state_transfer"]

    def _create_sampler(self):
        return None

    async def _prepare(self, env: Any) -> None:
        await apply_setup_profiles(env, self.spec.setup_profiles)

    async def setup(self, env: Any, *, warm: bool = True):
        await super().setup(env, warm=warm)
        await env.go_home()
        return await env.get_observation()

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        return evaluate_goals(self.spec.goals, input)

    def get_expected_changes(self, input: JudgeInput) -> list[str]:
        del input
        return list(self.spec.expected_changes)


_registry = TaskRegistry()

for _task_id, _source_task, _instruction in OFFICIAL_CASES:
    _suite, _name = _source_task.split(".", 1)
    _base = _registry.get(_suite, _name)
    _apps = list(_base.apps)
    _spec = make_spec(
        _task_id,
        _instruction,
        _apps,
        changes=list(_base.expected_changes),
        tools=tools_for(_apps),
        tags=["official_verifier", "fixed_defaults", _base.composition],
        difficulty=_base.difficulty,
        scope=_base.scope,
        composition=_base.composition,
        source_task=_source_task,
        max_steps=_base.max_steps or 60,
    )
    TASK_SPECS.append(_spec)
    _attrs = {
        "__module__": __name__,
        "__doc__": _instruction,
        "spec": _spec,
        "templates": [_instruction],
        "candidate_tools": list(_spec.candidate_tools),
        "gui_required": True,
        "hybrid_tags": list(_spec.tags),
        "max_steps": _spec.max_steps,
    }
    globals()[_spec.class_name] = type(
        _spec.class_name, (_FixedInstructionMixin, _base), _attrs
    )

for _spec in CUSTOM_SPECS:
    TASK_SPECS.append(_spec)
    _attrs = {
        "__module__": __name__,
        "__doc__": _spec.instruction,
        "spec": _spec,
        "templates": [_spec.instruction],
        "apps": list(_spec.apps),
        "scope": _spec.scope,
        "objective": "hybrid",
        "composition": _spec.composition,
        "difficulty": _spec.difficulty,
        "max_steps": _spec.max_steps,
        "candidate_tools": list(_spec.candidate_tools),
        "gui_required": True,
        "hybrid_tags": list(_spec.tags),
    }
    globals()[_spec.class_name] = type(
        _spec.class_name, (_CustomHybridV2Task,), _attrs
    )

del _attrs, _base, _instruction, _name, _registry, _source_task, _spec, _suite, _task_id
