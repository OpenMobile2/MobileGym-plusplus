"""Materialize V5 wrappers around the 76 fixed V4 task instances."""

from __future__ import annotations

from dataclasses import replace

from bench_env.task.core.model import GoalSpec
from bench_env.task.prior.contracts import V5ContractMixin
from bench_env.task.prior.specs import CASES
from bench_env.task.registry import TaskRegistry


def _repair_goal_metadata(case_index: int, goals: tuple[GoalSpec, ...]) -> tuple[GoalSpec, ...]:
    repaired = []
    for goal in goals:
        if case_index == 73 and goal.kind == "wechat_sent":
            goal = replace(goal, values={
                **goal.values,
                "contains": ["2026-08-20", "2026-08-13"],
            })
        elif case_index == 75 and goal.kind == "wechat_sent":
            goal = replace(goal, values={
                **goal.values,
                "contains": ["2026-11-01"],
            })
        repaired.append(goal)
    return tuple(repaired)


_registry = TaskRegistry()
RUNTIME_CASES = []

for _case in CASES:
    _base = _registry.get("clocked", f"HTV4Case{_case.index:02d}")
    _base_instance = _base()
    _v4_spec = _base.spec
    _default_params = dict(_base_instance.params)
    if _case.index == 47:
        _default_params["date"] = "2026-07-14"

    _spec = replace(
        _case,
        apps=tuple(_v4_spec.apps),
        setup_profiles=tuple(_v4_spec.setup_profiles),
        candidate_tools=tuple(_v4_spec.candidate_tools),
        verifier_ignored_fields=tuple(_v4_spec.verifier_ignored_fields),
        goals=_repair_goal_metadata(_case.index, tuple(_v4_spec.goals)),
        expected_changes=tuple(_v4_spec.expected_changes),
        gui_required=_v4_spec.gui_required,
        difficulty=_v4_spec.difficulty,
        scope=_v4_spec.scope,
        composition=_v4_spec.composition,
        max_steps=_v4_spec.max_steps,
    )
    RUNTIME_CASES.append(_spec)
    _attrs = {
        "__module__": __name__,
        "__doc__": _spec.instruction,
        "spec": _spec,
        "templates": [_spec.instruction],
        "simulated_time": _spec.simulated_time,
        "_v4_default_params": _default_params,
        "_v4_seed": _spec.v3_index,
        "candidate_tools": list(_spec.candidate_tools),
        "gui_required": _spec.gui_required,
        "hybrid_tags": list(_spec.tags),
        "max_steps": _spec.max_steps,
    }
    globals()[_spec.class_name] = type(
        _spec.class_name,
        (V5ContractMixin, _base),
        _attrs,
    )

del _attrs, _base, _base_instance, _case, _default_params, _registry, _spec, _v4_spec

