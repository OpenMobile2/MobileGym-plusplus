from __future__ import annotations

import asyncio
import copy
import datetime
import json
from contextlib import contextmanager
from dataclasses import replace
from pathlib import Path

from bench_env.env.base import Observation
from bench_env.hybrid_benchmark.runner import (
    HybridBenchmarkConfig,
    _build_summary,
    _configured_env_url,
    _create_agent,
    _load_tasks,
)
from bench_env.task.base import BaseTask
from bench_env.task.drafts.specs import CASES as V3_CASES
from bench_env.task.clocked.specs import (
    CASES,
    DROP_REASONS,
    INSTRUCTION_OVERRIDES,
    SIMULATED_TIME,
)
from bench_env.task.clocked.tasks import RUNTIME_CASES
from bench_env.task.clocked.time_control import (
    FrozenTimeSetupMixin,
    simulated_time_bootstrap_url,
)
from bench_env.task.clocked.tool_surface import APP_TOOLS
from bench_env.task.judge import JudgeInput
from bench_env.task.redbook.app import Redbook
from bench_env.task.registry import TaskRegistry


def _tasks():
    registry = TaskRegistry()
    return [
        registry.create_task(f"clocked.{name}")
        for name in registry.list_tasks("clocked")
    ]


def test_materializes_76_unique_fixed_tasks():
    tasks = _tasks()
    assert len(tasks) == len(CASES) == len(RUNTIME_CASES) == 76
    assert len({task.id for task in tasks}) == 76
    assert [case.index for case in RUNTIME_CASES] == list(range(1, 77))
    assert all(task.description == task.spec.instruction for task in tasks)
    assert all("{" not in task.description for task in tasks)


def test_every_v3_case_has_one_explicit_audit_decision():
    retained = {case.v3_index for case in CASES}
    dropped = set(DROP_REASONS)
    assert retained.isdisjoint(dropped)
    assert retained | dropped == {case.index for case in V3_CASES}
    assert dropped == {14, 36, 39, 67}
    assert set(INSTRUCTION_OVERRIDES) <= retained


def test_time_is_frozen_per_task_on_a_sunday():
    expected = datetime.datetime.fromisoformat(SIMULATED_TIME)
    assert expected.weekday() == 6
    assert {case.simulated_time for case in RUNTIME_CASES} == {SIMULATED_TIME}


def test_source_verifiers_and_default_parameters_are_reused():
    registry = TaskRegistry()
    for spec in RUNTIME_CASES:
        wrapped = registry.create_task(f"clocked.{spec.class_name}")
        source = registry.create_task(spec.source_task)
        assert source.__class__ in wrapped.__class__.__mro__
        assert wrapped.params == source.params


def test_candidate_surface_still_covers_all_203_tools():
    expected = {name for names in APP_TOOLS.values() for name in names}
    actual = {name for spec in RUNTIME_CASES for name in spec.candidate_tools}
    assert len(expected) == 203
    assert actual == expected


def test_standard_hybrid_runner_loads_v4_and_reports_sr_as_primary_metric():
    config = HybridBenchmarkConfig(
        env_url="http://127.0.0.1:4181",
        model_base_url="https://example.invalid/v1",
        model_name="test",
        suite="clocked",
    )
    assert len(_load_tasks(config)) == 76
    summary = _build_summary([
        {
            "success": True,
            "error": None,
            "clean": False,
            "stop_reason": "COMPLETE",
            "app_tool_calls": ["calendar__open_date"],
        },
        {
            "success": False,
            "error": None,
            "clean": True,
            "stop_reason": "MAX_STEPS",
            "app_tool_calls": [],
        },
    ])
    assert summary["successful"] == 1
    assert summary["sr"] == 0.5
    assert "progress" not in summary
    assert "use" not in summary

    gui_summary = _build_summary([], interaction_mode="gui_only")
    assert gui_summary["interaction_mode"] == "gui_only"
    assert gui_summary["app_tool_calls"] == 0


def test_runner_forwards_optional_model_extra_body(monkeypatch):
    captured = {}

    class _Llm:
        def __init__(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setattr("bench_env.hybrid_benchmark.runner.LLMClient", _Llm)
    config = HybridBenchmarkConfig(
        env_url="http://127.0.0.1:4181",
        model_base_url="http://model.invalid/v1",
        model_name="qwen35-9b",
        model_extra_body={"chat_template_kwargs": {"enable_thinking": False}},
    )
    agent = _create_agent(config)
    assert captured["model"] == "qwen35-9b"
    assert agent.config.model_args["extra_body"] == {
        "chat_template_kwargs": {"enable_thinking": False}
    }


def test_v4_runner_bootstraps_time_without_changing_other_suites():
    base_url = "http://127.0.0.1:4181/?existing=value#screen"
    bootstrapped = simulated_time_bootstrap_url(base_url, SIMULATED_TIME)
    assert "existing=value" in bootstrapped
    assert "mobilegym_simulated_time=2026-07-12+09%3A00%3A00" in bootstrapped
    assert "mobilegym_time_flowing=false" in bootstrapped
    assert bootstrapped.endswith("#screen")

    v4 = HybridBenchmarkConfig(
        env_url=base_url,
        model_base_url="https://example.invalid/v1",
        model_name="test",
        suite="clocked",
    )
    v3 = replace(v4, suite="drafts")
    assert _configured_env_url(v4) == bootstrapped
    assert _configured_env_url(v3) == base_url


def test_revisions_are_small_and_auditable():
    revisions = {case.v3_index: case.revision for case in CASES}
    assert sum(value == "retained" for value in revisions.values()) == 60
    assert sum(value == "instruction_clarified" for value in revisions.values()) == 14
    assert sum(value == "verifier_fix" for value in revisions.values()) == 2
    assert revisions[13] == "instruction_clarified"
    assert revisions[42] == "verifier_fix"
    assert revisions[79] == "verifier_fix"


def test_case_13_requires_title_and_case_57_clarifies_only_v4_boss_message():
    registry = TaskRegistry()
    case_13 = registry.create_task("clocked.HTV4Case13")
    assert "包含该视频完整标题" in case_13.description

    case_57 = registry.create_task("clocked.HTV4Case57")
    source = registry.create_task(case_57.spec.source_task)
    os_state = {
        "time": int(datetime.datetime(2026, 7, 12, 9, 0).timestamp() * 1000),
    }
    clarification = "我记得那个文件应该是这个月1号修改的。"
    assert clarification in case_57.boss_message_for_os(os_state)
    assert clarification not in source.boss_message_for_os(os_state)


def test_case_75_does_not_require_an_unstated_calendar_description():
    from bench_env.task.clocked.tasks import RUNTIME_CASES

    case = next(item for item in RUNTIME_CASES if item.v3_index == 79)
    event_goal = next(goal for goal in case.goals if goal.kind == "calendar_new_event")
    assert "description_contains" not in event_goal.values


class _Stopwatch:
    def reset(self):
        pass

    @contextmanager
    def phase(self, _name):
        yield

    def summary(self):
        return "test"


class _Page:
    def __init__(self, events):
        self.events = events

    async def evaluate(self, _script, argument=None):
        if argument is None:
            self.events.append(("realign_weather",))
            return {"changed": True, "anchor": "2026-07-13", "target": "2026-07-12"}
        self.events.append(("freeze", argument))
        return {"mode": "simulated", "simulatedTime": argument, "flowing": False}


class _Env:
    supports_state_injection = True

    def __init__(self):
        self.events = []
        self.page = _Page(self.events)
        self.stopwatch = _Stopwatch()

    async def reset(self, app_ids=None):
        self.events.append(("reset", app_ids))

    async def open_app(self, app_id, wait_stable=True):
        self.events.append(("open", app_id, wait_stable))

    async def get_state(self, required_apps=None):
        self.events.append(("state", required_apps))
        return {"apps": {"calendar": {}}, "os": {}}

    async def get_observation(self):
        self.events.append(("observation",))
        return Observation(state={"apps": {"calendar": {}}, "os": {}})


class _SetupProbe(FrozenTimeSetupMixin, BaseTask):
    templates = ["probe"]
    apps = ["weather"]
    simulated_time = SIMULATED_TIME

    async def _prepare(self, env):
        env.events.append(("prepare",))

    def check_goals(self, _input):
        return [{"field": "probe", "passed": False}]


def test_freeze_and_time_dependent_realign_happen_before_app_open_and_prepare():
    env = _Env()
    asyncio.run(_SetupProbe().setup(env))
    names = [event[0] for event in env.events]
    assert names == [
        "reset", "freeze", "realign_weather", "open", "prepare", "state",
        "observation",
    ]
    assert env.events[1][1] == SIMULATED_TIME


def _redbook_states():
    initial = json.loads(
        Path("apps/RedBook/data/defaults.json").read_text(encoding="utf-8")
    )
    accessor = Redbook(initial)
    candidate = next(
        note
        for note_id in accessor.feed_ids
        if (note := accessor.notes_by_id.get(note_id))
        and str(note.get("category") or "") == "推荐"
        and "分享" in str(note.get("title") or "")
        and note_id not in accessor.collected_notes
    )
    final = copy.deepcopy(initial)
    final["user"]["collectedNotes"].append(str(candidate["id"]))
    author = accessor.note_author(candidate)
    final["chats"].append({
        "userId": str(author["id"]),
        "username": str(author["name"]),
        "messages": [{
            "id": "v4_test_message",
            "senderId": str(initial["user"]["id"]),
            "content": "这篇内容很有启发，谢谢分享",
            "timestamp": 1,
            "type": "text",
        }],
    })
    return initial, final


def test_repaired_redbook_verifier_accepts_visible_feed_pair_and_rejects_unchanged():
    task = next(task for task in _tasks() if task.spec.v3_index == 42)
    initial, final = _redbook_states()
    init_obs = Observation(state={"apps": {"redbook": initial}, "os": {}})
    final_obs = Observation(state={"apps": {"redbook": final}, "os": {}})
    positive = task.check_goals(JudgeInput(init_obs=init_obs, last_obs=final_obs))
    negative = task.check_goals(JudgeInput(init_obs=init_obs, last_obs=init_obs))
    assert all(check["passed"] for check in positive), positive
    assert not all(check["passed"] for check in negative), negative
