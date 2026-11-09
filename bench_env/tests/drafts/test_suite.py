from __future__ import annotations

from pathlib import Path
import json
import re
from types import SimpleNamespace

from bench_env.hybrid_benchmark.runner import _write_results
from bench_env.task.drafts.specs import CASES
from bench_env.task.drafts.tasks import RUNTIME_CASES
from bench_env.task.drafts.tool_surface import APP_TOOLS
from bench_env.task.registry import TaskRegistry
from bench_env.tests.core.test_suite import _judge_input


def _tasks():
    registry = TaskRegistry()
    return [
        registry.create_task(f"drafts.{name}")
        for name in registry.list_tasks("drafts")
    ]


def test_materializes_80_unique_fixed_tasks():
    tasks = _tasks()
    assert len(tasks) == len(CASES) == len(RUNTIME_CASES) == 80
    assert len({task.id for task in tasks}) == 80
    assert len({task.spec.task_id for task in tasks}) == 80
    assert all(task.description == task.spec.instruction for task in tasks)
    assert all("{" not in task.description for task in tasks)


def test_official_rows_are_in_the_official_test_split():
    test_ids = {
        line.strip()
        for line in Path("bench_env/splits/test.txt").read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    }
    official = [spec for spec in RUNTIME_CASES if spec.group in {"commerce", "content", "life", "work"}]
    assert len(official) == 67
    assert all(spec.source_task in test_ids for spec in official)


def test_source_verifiers_and_default_parameters_are_reused():
    registry = TaskRegistry()
    for spec in RUNTIME_CASES:
        wrapped = registry.create_task(f"drafts.{spec.class_name}")
        source = registry.create_task(spec.source_task)
        assert source.__class__ in wrapped.__class__.__mro__
        assert wrapped.params == source.params


def test_only_path_dependent_procedural_checks_are_filtered():
    filtered = {
        spec.source_task: spec.verifier_ignored_fields
        for spec in RUNTIME_CASES
        if spec.verifier_ignored_fields
    }
    assert set(filtered) == {
        "crossapp_commerce.EbayBalanceDiffToNotes",
        "crossapp_commerce.EbayDualItemCompareToNotes",
        "crossapp_commerce.EbayLowestPriceToNotes",
        "crossapp_commerce.EbayProductShareToWechat",
        "crossapp_commerce.FullShoppingDecisionFlow",
        "crossapp_content.EbayCheapToRedbook",
        "spotify.BuildPlaylistFromTwoArtists",
        "map.NearestInRadiusRatingRank",
    }
    assert all(
        set(fields) <= {
            "ebay_search", "item1_search", "item2_search",
            "searched_artist1", "searched_artist2",
            "search.performed",
        } for fields in filtered.values()
    )


def test_suite_mix_and_candidate_tool_coverage():
    assert sum(spec.difficulty == "L4" for spec in RUNTIME_CASES) >= 45
    assert sum(len(spec.apps) >= 3 for spec in RUNTIME_CASES) >= 20
    assert {spec.group for spec in RUNTIME_CASES} == {
        "commerce", "content", "life", "work", "taobao", "transfer"
    }
    expected_tools = {name for names in APP_TOOLS.values() for name in names}
    candidate_tools = {
        name for spec in RUNTIME_CASES for name in spec.candidate_tools
    }
    assert len(expected_tools) == 203
    assert candidate_tools == expected_tools


def test_known_v2_contract_defects_are_not_selected():
    excluded = {
        "crossapp_commerce.AlipayLargestExpenseToMoments",
        "crossapp_commerce.AlipayThankTopIncomeTransfer",
        "crossapp_content.FileManagerSendFileToWechatContact",
        "crossapp_life.RailwayBalanceConditionalBuyNotify",
        "crossapp_life.RealisticTrip001",
        "crossapp_work.MeetingReminderToNotes",
        "crossapp_work.OrganizePdfReportsToWechat",
        "steps.HTV2Transfer06",
    }
    assert not excluded.intersection(spec.source_task for spec in RUNTIME_CASES)


def test_transfer_verifiers_keep_source_goals():
    registry = TaskRegistry()
    for spec in (item for item in RUNTIME_CASES if item.group == "transfer"):
        assert spec.goals
        task = registry.create_task(f"drafts.{spec.class_name}")
        positive = task.evaluate(_judge_input(spec, positive=True))
        negative = task.evaluate(_judge_input(spec, positive=False))
        assert positive.success, (spec.task_id, positive.issues)
        assert not negative.success, spec.task_id


def test_hybrid_result_writer_serializes_regex_verifier_details(tmp_path):
    row = {
        "task_id": "drafts.regex",
        "success": False,
        "clean": True,
        "error": None,
        "stop_reason": "COMPLETE",
        "app_tool_calls": [],
        "issues": [{"expected": re.compile(r"123\\s+456")}],
    }
    _write_results(SimpleNamespace(output_dir=tmp_path), [], [row])
    saved = json.loads((tmp_path / "results.jsonl").read_text(encoding="utf-8"))
    assert saved["issues"][0]["expected"] == r"re.compile('123\\\\s+456')"
