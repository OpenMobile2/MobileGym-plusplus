"""Shared task machinery for the self-built-app Hybrid GUI+Tools suite.

Design goal: reuse the already-validated ``core`` declarative goal model
(``HybridTaskSpec`` / ``goal`` / ``evaluate_goals``) instead of writing new per-app
``app.py`` CRUD helpers. Every task's primary checkable artifact is a Notes entry
(``notes_note`` goal kind), optionally plus 1-2 inline state-diff checks for tasks
that also require a low-risk write action (cart / queue / favorite / follow).

Per-app spec files (``specs_<app>.py``) only need to:
  1. Build a list of ``HybridTaskSpec`` via ``spec(...)``.
  2. Optionally register extra per-task-id check functions in ``EXTRA_CHECKS``.
  3. Optionally register a per-task-id initial-state patch in ``PREPARE_STATE`` (dict
     merged into ``apps.<app>`` via ``env.set_state`` before the episode starts —
     use this when the app's seeded defaults would make a "newly added" diff check
     trivially pass/fail, e.g. an item already present in a queue/cart/favorites).
  4. Call ``build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals())``.
"""

from __future__ import annotations

from typing import Any, Callable, ClassVar

from bench_env.task.base import BaseTask
from bench_env.task.core.model import GoalSpec, HybridTaskSpec, goal
from bench_env.task.core.verifier import evaluate_goals
from bench_env.task.judge import JudgeInput

__all__ = ["GoalSpec", "HybridTaskSpec", "goal", "spec", "SelfbuiltTask", "build_task_classes"]


def spec(
    task_id: str,
    instruction: str,
    apps: list[str],
    goals: list[GoalSpec],
    changes: list[str],
    tools: list[str],
    *,
    max_steps: int = 45,
    tags: tuple[str, ...] = (),
) -> HybridTaskSpec:
    """Convenience constructor mirroring ``an earlier app set``'s ``spec()``."""
    return HybridTaskSpec(
        task_id=task_id,
        instruction=instruction,
        apps=tuple(apps),
        setup_profiles=(),
        goals=tuple(goals),
        expected_changes=tuple(changes),
        candidate_tools=tuple(tools),
        gui_required=True,
        max_steps=max_steps,
        tags=("selfbuilt", "paired", "gui_path_required", *tags),
    )


ExtraCheckFn = Callable[[JudgeInput], list[dict[str, Any]]]


class SelfbuiltTask(BaseTask):
    """Shared BaseTask for every generated tasklib task class.

    ``spec`` and ``extra_check`` are injected per-class by ``build_task_classes``.
    """

    spec: ClassVar[HybridTaskSpec]
    extra_check: ClassVar[ExtraCheckFn | None] = None
    prepare_state: ClassVar[dict[str, Any] | None] = None

    scope = "S2"
    objective = "hybrid"
    composition = "transfer"
    difficulty = "L3"
    capabilities = ["gui", "tool_use", "comparison", "state_transfer"]

    def _create_sampler(self):
        return None

    async def _prepare(self, env: Any) -> None:
        if self.prepare_state:
            await env.set_state({"apps": self.prepare_state})

    async def setup(self, env: Any, *, warm: bool = True):
        await super().setup(env, warm=warm)
        await env.go_home()
        return await env.get_observation()

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = evaluate_goals(self.spec.goals, input)
        if self.extra_check is not None:
            checks.extend(self.extra_check(input))
        return checks

    def get_expected_changes(self, input: JudgeInput) -> list[str]:
        del input
        return list(self.spec.expected_changes)


def build_task_classes(
    specs: list[HybridTaskSpec],
    extra_checks: dict[str, ExtraCheckFn] | None,
    *,
    module_globals: dict[str, Any],
    module_name: str,
    prepare_states: dict[str, dict[str, Any]] | None = None,
) -> None:
    """Generate one ``SelfbuiltTask`` subclass per spec and inject it into
    ``module_globals`` (call with ``globals()`` from the spec file itself, and
    ``module_name`` set to ``__name__`` of that same file)."""
    extra_checks = extra_checks or {}
    prepare_states = prepare_states or {}
    for item in specs:
        attrs = {
            "__module__": module_name,
            "__doc__": item.instruction,
            "spec": item,
            # ``staticmethod`` prevents Python from treating this plain function as
            # an instance method (which would implicitly bind ``self`` as its first
            # positional argument when accessed via ``self.extra_check``).
            "extra_check": staticmethod(extra_checks.get(item.task_id)) if extra_checks.get(item.task_id) else None,
            "prepare_state": prepare_states.get(item.task_id),
            "templates": [item.instruction],
            "apps": list(item.apps),
            "max_steps": item.max_steps,
            "candidate_tools": list(item.candidate_tools),
            "gui_required": item.gui_required,
            "hybrid_tags": list(item.tags),
        }
        module_globals[item.class_name] = type(item.class_name, (SelfbuiltTask,), attrs)
