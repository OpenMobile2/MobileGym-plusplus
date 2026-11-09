"""V6 verifier repairs layered over V5 without changing older suites."""

from __future__ import annotations

import re
from typing import Any

from bench_env.task.alipay.app import Alipay
from bench_env.task.common_tasks import match_duration, match_time, normalize_text
from bench_env.task.prior.contracts import (
    _contains_equivalent_number,
    address_matches,
    entity_contains,
)
from bench_env.task.judge import JudgeInput
from bench_env.task.map.app import Map
from bench_env.task.redbook.app import Redbook
from bench_env.task.tencent_meeting.app import TencentMeeting
from bench_env.task.utils import norm, now_ms, sim_today
from bench_env.task.wechat.app import Wechat


def _counterparty_aliases(record: dict[str, Any]) -> list[str]:
    """Return complete labels plus the names independently visible in the UI."""

    aliases: list[str] = []
    for raw in Alipay.transaction_labels(record) + [
        Alipay.transfer_counterparty_label(record)
    ]:
        value = re.sub(r"^转账\s*(?:[-—:：]|给)?\s*", "", str(raw or "")).strip()
        if not value:
            continue
        aliases.append(value)
        matched = re.fullmatch(r"\s*([^()（）]+?)\s*[（(]\s*([^()（）]+?)\s*[）)]\s*", value)
        if matched:
            aliases.extend((matched.group(1).strip(), matched.group(2).strip()))
    return list(dict.fromkeys(alias for alias in aliases if alias))


def _title_without_decoration(value: Any) -> str:
    """Keep title content while ignoring spacing, punctuation, and emoji."""

    return "".join(
        char.casefold()
        for char in normalize_text(str(value or ""))
        if char.isalnum()
    )


def _match_time_v6(expected: str, actual: Any) -> bool:
    """Extend time matching with natural exact-hour expressions."""

    if match_time(expected, actual):
        return True

    expected_match = re.search(r"(\d{1,2}):(\d{2})", normalize_text(expected))
    if expected_match is None or int(expected_match.group(2)) != 0:
        return False
    expected_hour = int(expected_match.group(1))

    actual_text = normalize_text(str(actual or ""))
    pattern = re.compile(
        r"(?<!\d)(上午|下午|早上|晚上|中午|凌晨)?\s*"
        r"(\d{1,2})\s*[点时](?!\s*(?:\d|半|一刻|三刻))"
    )
    for matched in pattern.finditer(actual_text):
        prefix, hour_text = matched.groups()
        hour = int(hour_text)
        if prefix in {"下午", "晚上"} and hour < 12:
            hour += 12
        elif prefix in {"上午", "早上", "凌晨"} and hour == 12:
            hour = 0
        if hour == expected_hour:
            return True
    return False


class V6ContractMixin:
    """Apply verifier changes approved for V6 without changing older suites."""

    def _check_case_11_v6(self, input: JudgeInput) -> list[dict[str, Any]]:
        alipay = Alipay(input.apps_init["alipay"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        this_year = sim_today(input.os_init).year
        this_top = alipay.yearly_largest_expense(this_year)
        last_top = alipay.yearly_largest_expense(this_year - 1)
        winner = (
            this_top
            if abs(float(this_top["delta"])) > abs(float(last_top["delta"]))
            else last_top
        )
        amount = abs(float(winner["delta"]))
        aliases = _counterparty_aliases(winner)
        actual = wechat.joined_new_texts_to(self.p.contact)
        return [
            {
                "field": "year_compare_top_expense_amount",
                "expected": amount,
                "actual": actual[:400] or "(none)",
                "passed": _contains_equivalent_number(actual, amount, tolerance=0.02),
            },
            {
                "field": "year_compare_top_expense_counterparty",
                "expected": {"any_visible_alias": aliases},
                "actual": actual[:400] or "(none)",
                "passed": bool(actual) and any(
                    entity_contains(actual, alias) for alias in aliases
                ),
            },
        ]

    def _check_case_20_v6(self, input: JudgeInput) -> list[dict[str, Any]]:
        redbook = Redbook(input.apps["redbook"], init=input.apps_init["redbook"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        expected = str(redbook.first_search_note(self.p.keyword)["title"])
        sent_texts = wechat.new_sent_texts_to(self.p.contact)
        actual = sent_texts[-1] if sent_texts else ""
        expected_core = _title_without_decoration(expected)
        actual_core = _title_without_decoration(actual)
        return [{
            "field": "redbook_title_share",
            "expected": {
                "content_title_ignoring_punctuation_and_emoji": expected,
            },
            "actual": actual[:400] or "(none)",
            "passed": bool(expected_core) and expected_core in actual_core,
        }]

    def _check_case_25_v6(self, input: JudgeInput) -> list[dict[str, Any]]:
        """Use the clarified V6 Spotify section heading."""

        checks = super().check_goals(input)
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        actual = wechat._latest_new_moment_content()
        expected_heading = "今天在听的歌"
        for check in checks:
            if check.get("field") != "moment_headings":
                continue
            check.update(
                expected=["最近阅读最投入的一天", expected_heading],
                actual=actual[:300] or "(none)",
                passed=(
                    bool(actual)
                    and norm("最近阅读最投入的一天") in norm(actual)
                    and norm(expected_heading) in norm(actual)
                ),
            )
        return checks

    def _check_case_33_v6(self, input: JudgeInput) -> list[dict[str, Any]]:
        rated = Map.filter_results(
            Map.geo_search(self.p.category, limit=0),
            max_distance_meters=float(self.p.radius),
            rated_only=True,
        )
        if not rated:
            raise ValueError("No rated POI in the fixed Case33 setup")
        top_rating = max(float(place["rating"]) for place in rated)
        top_rated = [
            place for place in rated if float(place["rating"]) == top_rating
        ]
        nearest_display_distance = min(
            Map._display_distance_meters_for_radius(Map._parse_distance_value(place))
            for place in top_rated
        )
        legal = [
            place
            for place in top_rated
            if Map._display_distance_meters_for_radius(Map._parse_distance_value(place))
            == nearest_display_distance
        ]

        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        actual = wechat.joined_new_texts_to(self.p.contact)
        attempts = []
        for place in legal:
            attempt = {
                "name": place["name"],
                "rating": place["rating"],
                "address": Map.extract_address(place),
                "display_distance_meters": nearest_display_distance,
            }
            attempt["passed"] = (
                entity_contains(actual, attempt["name"])
                and _contains_equivalent_number(
                    actual, attempt["rating"], tolerance=0.01
                )
                and address_matches(actual, attempt["address"])
            )
            attempts.append(attempt)
        return [{
            "field": "best_poi_share",
            "expected": {
                "any_gui_indistinguishable_best_candidate": attempts,
            },
            "actual": actual[:400] or "(none)",
            "passed": any(attempt["passed"] for attempt in attempts),
        }]

    def _check_case_54_v6(self, input: JudgeInput) -> list[dict[str, Any]]:
        meeting = TencentMeeting(input.apps_init["tencent_meeting"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        route_duration = str(Map.geo_route_to(self.p.place, "WALKING")["duration"])
        upcoming = meeting.first_upcoming_scheduled(now_ms(input.os_init))
        meeting_time = TencentMeeting.meeting_start_hh_mm(upcoming)
        actual = wechat.joined_new_texts_to(self.p.contact)
        return [{
            "field": "wechat_eta_and_meeting",
            "expected": f"历时≈{route_duration}，会议时间≈{meeting_time}",
            "actual": actual[:500] or "(none)",
            "passed": (
                bool(actual)
                and match_duration(route_duration, actual)
                and _match_time_v6(meeting_time, actual)
            ),
        }]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        if self.spec.index == 11:
            return self._check_case_11_v6(input)
        if self.spec.index == 20:
            return self._check_case_20_v6(input)
        if self.spec.index == 25:
            return self._check_case_25_v6(input)
        if self.spec.index == 33:
            return self._check_case_33_v6(input)
        if self.spec.index == 54:
            return self._check_case_54_v6(input)
        return super().check_goals(input)
