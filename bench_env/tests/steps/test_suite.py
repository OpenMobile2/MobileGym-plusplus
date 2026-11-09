from __future__ import annotations

from bench_env.task.registry import TaskRegistry
from bench_env.task.steps import tasks as _task_definitions  # noqa: F401
from bench_env.task.steps.specs import TASK_SPECS
from bench_env.tests.core.test_suite import _judge_input


def _tasks():
    registry = TaskRegistry()
    return [registry.create_task(f"steps.{name}") for name in registry.list_tasks("steps")]


def test_suite_materializes_50_unique_fixed_tasks():
    tasks = _tasks()
    assert len(tasks) == 50
    assert len(TASK_SPECS) == 50
    assert len({task.id for task in tasks}) == 50
    assert len({spec.task_id for spec in TASK_SPECS}) == 50
    assert all(task.sampler is None for task in tasks)


def test_suite_has_expected_challenge_mix():
    assert sum(spec.source_task is not None for spec in TASK_SPECS) == 40
    assert sum(spec.source_task is None for spec in TASK_SPECS) == 10
    assert sum(spec.difficulty == "L4" for spec in TASK_SPECS) >= 30
    assert sum(len(spec.apps) >= 3 for spec in TASK_SPECS) >= 20
    assert all(spec.gui_required for spec in TASK_SPECS)
    assert all(spec.max_steps >= 45 for spec in TASK_SPECS)


def test_instructions_do_not_leak_custom_source_values():
    forbidden = {
        "transfer_01": ["Maple Room"],
        "transfer_02": ["RC-204", "Cedar Room", "Alice Chen"],
        "transfer_03": ["RC-204", "17:50"],
        "transfer_04": ["2026-08-20", "2026-08-13"],
        "transfer_05": ["Fresh milk", "Coffee", "Apples"],
        "transfer_06": ["Vendor prep", "09:40"],
        "transfer_08": ["2026-11-01"],
        "transfer_09": ["V-4821", "021-5550-8820"],
        "transfer_10": ["RC-204", "Cedar Room", "Alice Chen"],
    }
    by_id = {spec.task_id: spec for spec in TASK_SPECS}
    for task_id, values in forbidden.items():
        assert all(value.casefold() not in by_id[task_id].instruction.casefold() for value in values)


def test_official_wrappers_keep_official_verifiers_and_defaults():
    registry = TaskRegistry()
    for spec in TASK_SPECS:
        if not spec.source_task:
            continue
        wrapped = registry.create_task(f"steps.{spec.class_name}")
        source = registry.create_task(spec.source_task)
        assert wrapped.check_goals.__func__ is source.check_goals.__func__
        assert wrapped.params == source.params
        assert wrapped.description == spec.instruction


def test_custom_verifiers_accept_expected_state_and_reject_unchanged_state():
    registry = TaskRegistry()
    for spec in TASK_SPECS:
        if spec.source_task:
            continue
        task = registry.create_task(f"steps.{spec.class_name}")
        positive = task.evaluate(_judge_input(spec, positive=True))
        assert positive.success, f"positive verifier failed for {spec.task_id}: {positive.issues}"
        negative = task.evaluate(_judge_input(spec, positive=False))
        assert not negative.success, f"unchanged state passed for {spec.task_id}"
