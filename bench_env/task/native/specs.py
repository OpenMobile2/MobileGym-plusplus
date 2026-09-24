"""V6 suite membership and contract decisions."""

from __future__ import annotations

from dataclasses import fields

from bench_env.task.prior.specs import CASES as V5_CASES
from bench_env.task.prior.specs import SIMULATED_TIME
from bench_env.task.native.model import HybridV6Case


EXCLUDED_CASES = {45}
REPAIRED_CASES = {11, 20, 25, 33, 54}

INSTRUCTION_OVERRIDES = {
    25: (
        "查看微信读书从今天起往前7天（包含今天）的记录，找出阅读最久的一天；"
        "再汇总 Spotify 今天听过且已点赞的歌曲名称和作者。发一条朋友圈，分别以"
        "“最近阅读最投入的一天”和“今天在听的歌”为两个栏目标题，汇总上述两部分结果。"
    ),
}

REPAIR_REASONS = {
    11: (
        "Accept the full Alipay counterparty label, its visible nickname, or the "
        "real name in parentheses while keeping the winning amount strict."
    ),
    20: (
        "Match the complete title content while ignoring optional punctuation, "
        "spacing, and decorative emoji."
    ),
    25: (
        "Clarify that the two quoted phrases are section headings and rename the "
        "Spotify heading to avoid implying the current unliked track."
    ),
    33: (
        "Treat equal-rating POIs whose distances collapse to the same GUI-visible "
        "distance label as tied best candidates."
    ),
    54: (
        "Accept natural exact-hour expressions such as '11点开始' when the "
        "expected meeting time is 11:00."
    ),
}


def _materialize_case(case) -> HybridV6Case:
    payload = {
        field.name: getattr(case, field.name)
        for field in fields(HybridV6Case)
    }
    if case.index in REPAIRED_CASES:
        payload.update(
            revision="v6_contract_repaired",
            audit_reason=REPAIR_REASONS[case.index],
            contract_severity="V6",
            contract_repair=REPAIR_REASONS[case.index],
        )
    if case.index in INSTRUCTION_OVERRIDES:
        payload["instruction"] = INSTRUCTION_OVERRIDES[case.index]
    return HybridV6Case(**payload)


CASES = [
    _materialize_case(case)
    for case in V5_CASES
    if case.index not in EXCLUDED_CASES
]


assert len(CASES) == 75
assert {case.index for case in CASES} == set(range(1, 77)) - EXCLUDED_CASES
assert all(case.simulated_time == SIMULATED_TIME for case in CASES)

del _materialize_case
