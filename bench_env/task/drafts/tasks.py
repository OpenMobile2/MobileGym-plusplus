"""Materialize V3 as isolated wrappers around frozen source contracts."""

from __future__ import annotations

from dataclasses import replace

from bench_env.task.alipay.app import Alipay
from bench_env.task.drafts.specs import CASES
from bench_env.task.drafts.tool_surface import tools_for
from bench_env.task.map.app import Map
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


class _FrozenSourceMixin:
    """Freeze source parameters while retaining setup-time RNG helpers."""

    _v3_default_params = {}
    _v3_seed = 0

    def __init__(self, task_name: str = "", _seed=None, **params):
        fixed = dict(self._v3_default_params)
        fixed.update(params)
        super().__init__(
            task_name=task_name,
            _seed=self._v3_seed if _seed is None else _seed,
            **fixed,
        )

    @property
    def description(self) -> str:
        return self.templates[0]

    def check_goals(self, input):
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
                        phrase in actual for phrase in ("\u5df2\u7ecf\u8054\u7cfb", "\u5df2\u8054\u7cfb", "\u8054\u7cfb\u8fc7")
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
        goals=tuple(getattr(_source_spec, "goals", ())),
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
        "_v3_default_params": _source_defaults,
        "_v3_seed": _spec.index,
        "candidate_tools": list(_spec.candidate_tools),
        "gui_required": _spec.gui_required,
        "hybrid_tags": list(_spec.tags),
        "max_steps": _spec.max_steps,
    }
    globals()[_spec.class_name] = type(
        _spec.class_name,
        (_FrozenSourceMixin, _base),
        _attrs,
    )

del _apps, _attrs, _base, _case, _registry, _source_defaults, _source_spec
del _source_name, _source_suite, _spec
