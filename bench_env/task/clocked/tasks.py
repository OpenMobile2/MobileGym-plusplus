"""Materialize V4 as deterministic wrappers around audited source contracts."""

from __future__ import annotations

from dataclasses import replace
from typing import Any

from bench_env.task.alipay.app import Alipay
from bench_env.task.clocked.specs import CASES
from bench_env.task.clocked.time_control import FrozenTimeSetupMixin
from bench_env.task.clocked.tool_surface import tools_for
from bench_env.task.map.app import Map
from bench_env.task.redbook.app import Redbook
from bench_env.task.registry import TaskRegistry


_PROCEDURAL_FIELDS = {
    "crossapp_commerce.EbayBalanceDiffToNotes": ("ebay_search",),
    "crossapp_commerce.EbayDualItemCompareToNotes": ("item1_search", "item2_search"),
    "crossapp_commerce.EbayLowestPriceToNotes": ("ebay_search",),
    "crossapp_commerce.EbayProductShareToWechat": ("ebay_search",),
    "crossapp_commerce.FullShoppingDecisionFlow": ("ebay_search",),
    "crossapp_content.EbayCheapToRedbook": ("ebay_search",),
    "spotify.BuildPlaylistFromTwoArtists": ("searched_artist1", "searched_artist2"),
    "map.NearestInRadiusRatingRank": ("search.performed",),
}


def _repair_goals(case, goals):
    if case.v3_index != 79:
        return tuple(goals)
    repaired = []
    for goal in goals:
        if goal.kind == "calendar_new_event":
            values = dict(goal.values)
            values.pop("description_contains", None)
            goal = replace(goal, values=values)
        repaired.append(goal)
    return tuple(repaired)


class _AuditedSourceMixin(FrozenTimeSetupMixin):
    """Freeze source parameters and apply only documented V4 verifier repairs."""

    _v4_default_params: dict[str, Any] = {}
    _v4_seed = 0

    def __init__(self, task_name: str = "", _seed=None, **params):
        fixed = dict(self._v4_default_params)
        fixed.update(params)
        super().__init__(
            task_name=task_name,
            _seed=self._v4_seed if _seed is None else _seed,
            **fixed,
        )

    @property
    def description(self) -> str:
        return self.templates[0]

    def boss_message_for_os(self, os_state):
        message = super().boss_message_for_os(os_state)
        if self.spec.v3_index == 60:
            return f"{message} 我记得那个文件应该是这个月1号修改的。"
        return message

    def _check_redbook_feed_and_dm(self, input):
        rb = Redbook(input.apps["redbook"], init=input.apps_init["redbook"])
        keyword = str(self.p.keyword or "")
        message = str(self.p.message)
        candidates = []
        for note_id in rb.init.feed_ids:
            note = rb.init.notes_by_id.get(str(note_id))
            if (
                note
                and str(note.get("category") or "") == "推荐"
                and keyword
                and keyword in str(note.get("title") or "")
            ):
                candidates.append(note)

        success = None
        for note in candidates:
            note_id = str(note["id"])
            if note_id not in rb.added_to_collected():
                continue
            author_id = str(rb.note_author(note).get("id") or "")
            if author_id and rb.chat_has_message(author_id, message):
                success = note
                break

        chosen = success or next(
            (note for note in candidates if str(note["id"]) in rb.added_to_collected()),
            candidates[0] if candidates else None,
        )
        if chosen is None:
            return [
                {"field": "collect_feed_note", "expected": "a feed title containing the keyword", "actual": "(no candidate)", "passed": False},
                {"field": "dm_author", "expected": message, "actual": "(no candidate)", "passed": False},
            ]
        author_name = str(rb.note_author(chosen).get("name") or "")
        return [
            rb.check_note_collected(str(chosen["id"]), field="collect_feed_note"),
            rb.check_chat_exact_message_to(author_name, message, field="dm_author")
            if author_name else {
                "field": "dm_author", "expected": message, "actual": "(no author)", "passed": False,
            },
        ]

    def check_goals(self, input):
        if self.spec.v3_index == 42:
            return self._check_redbook_feed_and_dm(input)
        if self.spec.source_task == "map.NearestInRadiusRatingRank":
            return [
                Map.check_answer_match(
                    input.answer,
                    self.get_answer(input),
                    field="answer.rank",
                )
            ]
        checks = super().check_goals(input)
        if self.spec.source_task == "crossapp_commerce.AlipayLargestExpenseToNotes":
            transaction = Alipay(input.apps_init["alipay"]).largest_expense()
            label = Alipay(input.apps_init["alipay"]).transaction_primary_label(transaction)
            aliases = {label, label.replace("-", "给", 1), label.replace("-", "：", 1)}
            for check in checks:
                if check.get("field") == "largest_expense_target" and not check.get("passed"):
                    actual = str(check.get("actual") or "")
                    check["passed"] = any(alias in actual for alias in aliases)
        if self.spec.source_task == "crossapp_content.RedbookDmThenWechatReport":
            for check in checks:
                if check.get("field") == "wechat_report" and not check.get("passed"):
                    actual = str(check.get("actual") or "")
                    check["passed"] = any(
                        phrase in actual for phrase in ("已经联系", "已联系", "联系过")
                    )
        ignored = set(self.spec.verifier_ignored_fields)
        return [check for check in checks if check.get("field") not in ignored]


_registry = TaskRegistry()
RUNTIME_CASES = []

for _case in CASES:
    _source_suite, _source_name = _case.source_task.split(".", 1)
    _base = _registry.get(_source_suite, _source_name)
    _source_defaults = dict(_base().params)
    _source_spec = getattr(_base, "spec", None)
    _apps = tuple(_base.apps)
    _spec = replace(
        _case,
        apps=_apps,
        setup_profiles=tuple(getattr(_source_spec, "setup_profiles", ())),
        candidate_tools=tuple(tools_for(_apps)),
        verifier_ignored_fields=_PROCEDURAL_FIELDS.get(_case.source_task, ()),
        goals=_repair_goals(_case, getattr(_source_spec, "goals", ())),
        expected_changes=tuple(
            getattr(_source_spec, "expected_changes", _base.expected_changes)
        ),
        difficulty=_base.difficulty,
        scope=_base.scope,
        composition=_base.composition,
        max_steps=_base.max_steps or 60,
    )
    RUNTIME_CASES.append(_spec)
    _attrs = {
        "__module__": __name__,
        "__doc__": _spec.instruction,
        "spec": _spec,
        "templates": [_spec.instruction],
        "simulated_time": _spec.simulated_time,
        "_v4_default_params": _source_defaults,
        "_v4_seed": _spec.v3_index,
        "_go_home_after_v4_setup": _source_suite == "steps",
        "candidate_tools": list(_spec.candidate_tools),
        "gui_required": _spec.gui_required,
        "hybrid_tags": list(_spec.tags),
        "max_steps": _spec.max_steps,
    }
    globals()[_spec.class_name] = type(
        _spec.class_name,
        (_AuditedSourceMixin, _base),
        _attrs,
    )

del _apps, _attrs, _base, _case, _registry, _source_defaults, _source_spec
del _source_name, _source_suite, _spec
