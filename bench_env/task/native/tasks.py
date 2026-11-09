"""Materialize the 75 stable-ID V6 task wrappers from V5."""

from __future__ import annotations

from dataclasses import replace

from bench_env.task.native.contracts import V6ContractMixin
from bench_env.task.native.specs import CASES
from bench_env.task.registry import TaskRegistry


_registry = TaskRegistry()
RUNTIME_CASES = []

for _case in CASES:
    _base = _registry.get("prior", f"HTV5Case{_case.index:02d}")
    _v5_spec = _base.spec
    _spec = replace(
        _case,
        apps=tuple(_v5_spec.apps),
        setup_profiles=tuple(_v5_spec.setup_profiles),
        candidate_tools=tuple(_v5_spec.candidate_tools),
        verifier_ignored_fields=tuple(_v5_spec.verifier_ignored_fields),
        goals=tuple(_v5_spec.goals),
        expected_changes=tuple(_v5_spec.expected_changes),
        gui_required=_v5_spec.gui_required,
        difficulty=_v5_spec.difficulty,
        scope=_v5_spec.scope,
        composition=_v5_spec.composition,
        max_steps=_v5_spec.max_steps,
    )
    RUNTIME_CASES.append(_spec)
    _attrs = {
        "__module__": __name__,
        "__doc__": _spec.instruction,
        "spec": _spec,
        "templates": [_spec.instruction],
        "simulated_time": _spec.simulated_time,
        "candidate_tools": list(_spec.candidate_tools),
        "gui_required": _spec.gui_required,
        "hybrid_tags": list(_spec.tags),
        "max_steps": _spec.max_steps,
    }
    globals()[_spec.class_name] = type(
        _spec.class_name,
        (V6ContractMixin, _base),
        _attrs,
    )

del _attrs, _base, _case, _registry, _spec, _v5_spec
