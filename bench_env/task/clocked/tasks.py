"""Materialize V4 as deterministic wrappers around audited source contracts."""

from __future__ import annotations

from dataclasses import replace
from typing import Any

from bench_env.task.alipay.app import Alipay
from bench_env.task.clock.app import Clock
from bench_env.task.ebay.app import Ebay
from bench_env.task.clocked.specs import CASES
from bench_env.task.clocked.time_control import FrozenTimeSetupMixin
from bench_env.task.clocked.tool_surface import tools_for
from bench_env.task.map.app import Map
from bench_env.task.notes.app import Notes
from bench_env.task.redbook.app import Redbook
from bench_env.task.railway12306.app import Railway12306
from bench_env.task.spotify.app import Spotify, match_with_aliases
from bench_env.task.wechat.app import Wechat
from bench_env.task.weather.app import Weather
from bench_env.task.wechat_reading.app import WechatReading
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
        if self.spec.index == 9:
            ali = Alipay(input.apps_init["alipay"])
            wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
            ts_now = float((input.os_init.get("time") or {}).get("timestamp") or 0)
            expenses = [
                tx for tx in ali.transactions
                if float(tx["delta"]) < 0 and int(tx["timestamp"]) >= ts_now - 30 * 86400 * 1000
            ]
            expenses.sort(key=lambda tx: abs(float(tx["delta"])), reverse=True)
            checks = []
            for index, transaction in enumerate(expenses[:3], start=1):
                label = Alipay.transaction_primary_label(transaction)
                checks.append(wechat.check_new_sent_number_near_any_keyword(
                    self.p.contact,
                    round(abs(float(transaction["delta"])), 2),
                    [label],
                    field=f"wechat_top{index}_title_amount_pair",
                ))
            checks.append(wechat.check_new_sent_contains(
                self.p.contact, "省着点", field="wechat_closing",
            ))
            return checks
        if self.spec.index == 38:
            spotify = Spotify(input.apps["spotify"])
            playlist = spotify.get_playlist_by_name(self.p.playlist)
            tracks = list((playlist or {}).get("tracks") or [])
            artist1_count = sum(
                match_with_aliases(self.p.artist1, str(track.get("artist") or ""))
                for track in tracks
            )
            artist2_count = sum(
                match_with_aliases(self.p.artist2, str(track.get("artist") or ""))
                for track in tracks
            )
            return [
                {
                    "field": "playlist_exact_composition",
                    "expected": {self.p.artist1: self.p.count, self.p.artist2: self.p.count, "total": 2 * self.p.count},
                    "actual": {self.p.artist1: artist1_count, self.p.artist2: artist2_count, "total": len(tracks)},
                    "passed": len(tracks) == 2 * self.p.count and artist1_count == self.p.count and artist2_count == self.p.count,
                },
                spotify.check_is_playing(),
                spotify.check_current_track_in_playlist(self.p.playlist, field="playing_two_artist_playlist"),
            ]
        if self.spec.index == 25:
            spotify = Spotify(input.apps_init["spotify"])
            wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
            content = wechat._latest_new_moment_content()
            liked = spotify.liked_recent_intersection()
            required = ["最近阅读最投入的一天", "现在在听的歌"] + [
                token for track in liked for token in (str(track.get("title") or ""), str(track.get("artist") or ""))
            ]
            liked_titles = {str(track.get("title") or "") for track in liked}
            forbidden = [
                str(track.get("title") or "") for track in spotify.recent_plays
                if str(track.get("title") or "") not in liked_titles
            ]
            return [{
                "field": "moment_exact_reading_and_liked_tracks",
                "expected": {"required": required, "forbidden_unliked_titles": forbidden},
                "actual": content,
                "passed": bool(content) and all(token in content for token in required) and not any(token and token in content for token in forbidden),
            }]
        if self.spec.index == 40:
            checks = super().check_goals(input)
            weather = Weather(input.apps["weather"])
            notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
            content = notes.note_text_by_title("适合出行的日子")
            non_rainy = set(weather.non_rainy_dates(self.p.city, 1, 5))
            all_dates = [row["fxDate"] for row in weather.weather_daily(self.p.city)[1:6]]
            rainy = [date for date in all_dates if date not in non_rainy]
            forbidden_hits = [
                label for date in rainy for label in Weather.date_labels(date, input.os)
                if label and label in content
            ]
            checks.append({
                "field": "rainy_dates_excluded",
                "expected": rainy,
                "actual": forbidden_hits,
                "passed": not forbidden_hits,
            })
            return checks
        if self.spec.index == 41:
            checks = super().check_goals(input)
            rail = Railway12306(input.apps["railway12306"], init=input.apps_init["railway12306"])
            pending = rail.new_pending_orders()
            checks.append({
                "field": "high_speed_train_required",
                "expected": "new pending order with G train",
                "actual": [str(order.get("trainNo") or "") for order in pending],
                "passed": bool(pending) and all(str(order.get("trainNo") or "").startswith("G") for order in pending),
            })
            return checks
        if self.spec.index == 42:
            checks = super().check_goals(input)
            clock = Clock(input.apps["clock"], init=input.apps_init["clock"])
            new_alarm = next((alarm for alarm in clock.new_alarms() if int(alarm.get("hour", -1)) == 8 and int(alarm.get("minute", -1)) == 0), None)
            checks = [check for check in checks if check.get("field") != "alarm"]
            checks.append({
                "field": "new_enabled_alarm",
                "expected": {"time": "08:00", "enabled": True},
                "actual": new_alarm,
                "passed": bool(new_alarm) and bool(new_alarm.get("enabled")),
            })
            return checks
        if self.spec.index in {2, 3, 5, 6, 7}:
            checks = super().check_goals(input)
            notes = Notes(input.apps["notes"], init=input.apps_init["notes"]) if "notes" in self.apps else None
            wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"]) if "wechat" in self.apps else None
            ebay = Ebay(input.apps["ebay"] if self.spec.index != 3 else input.apps_init["ebay"])
            replacements = {}
            if self.spec.index == 3:
                replacements = {
                    "item1_title": notes.check_latest_norm_contains(ebay.cheapest_product(query=self.p.item1).title, field="item1_title"),
                    "item2_title": notes.check_latest_norm_contains(ebay.cheapest_product(query=self.p.item2).title, field="item2_title"),
                }
            else:
                condition = "全新" if self.spec.index in {2, 6, 7} else None
                top = ebay.cheapest_product(query=self.p.query, condition=condition)
                if notes is not None:
                    replacements["note_title"] = notes.check_latest_norm_contains(top.title, field="note_title")
                if wechat is not None:
                    replacements["wechat_title"] = wechat.check_new_sent_norm_contains(self.p.contact, top.title, field="wechat_title")
            return [replacements.get(check.get("field"), check) for check in checks]
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
    if _case.index == 47:
        # The V4 instruction names July 14 explicitly. Do not let the source
        # task's host-time-dependent ``default_tomorrow`` move setup/judging.
        _source_defaults["date"] = "2026-07-14"
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
