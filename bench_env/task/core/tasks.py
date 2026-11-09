"""Materialize the 90 fixed v1 task records as normal MobileGym task classes."""

from __future__ import annotations

from typing import Any, ClassVar

from bench_env.task.base import BaseTask
from bench_env.task.core.model import HybridTaskSpec
from bench_env.task.core.setup import apply_setup_profiles
from bench_env.task.core.specs import TASK_SPECS
from bench_env.task.core.verifier import evaluate_goals
from bench_env.task.judge import JudgeInput


class _FixedHybridToolsTask(BaseTask):
    spec: ClassVar[HybridTaskSpec]
    scope = "S3"
    objective = "hybrid"
    composition = "sequential"
    difficulty = "L4"
    capabilities = ["gui", "tool_use", "state_transfer"]

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


for _spec in TASK_SPECS:
    _attrs = {
        "__module__": __name__,
        "__doc__": _spec.instruction,
        "spec": _spec,
        "templates": [_spec.instruction],
        "apps": list(_spec.apps),
        "max_steps": _spec.max_steps,
        "candidate_tools": list(_spec.candidate_tools),
        "gui_required": _spec.gui_required,
        "hybrid_tags": list(_spec.tags),
    }
    globals()[_spec.class_name] = type(_spec.class_name, (_FixedHybridToolsTask,), _attrs)

del _attrs, _spec

