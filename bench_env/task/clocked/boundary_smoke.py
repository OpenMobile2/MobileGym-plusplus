"""Focused browser checks for contracts repaired or clarified in V4."""

from __future__ import annotations

import argparse
import asyncio
import datetime
import json
from pathlib import Path
from typing import Any

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.browser_tools import BrowserToolClient
from bench_env.task.calendar.app import Calendar
from bench_env.task.file_manager.app import FileSystem
from bench_env.task.map.app import Map
from bench_env.task.redbook.app import Redbook
from bench_env.task.registry import TaskRegistry
from bench_env.task.clocked.specs import SIMULATED_TIME
from bench_env.task.clocked.time_control import simulated_time_bootstrap_url
from bench_env.task.utils import sim_today
from bench_env.task.weather.app import Weather
from bench_env.task.wechat_reading.app import WechatReading


def _task_for_v3(registry: TaskRegistry, index: int):
    for name in registry.list_tasks("clocked"):
        task = registry.create_task(f"clocked.{name}")
        if task.spec.v3_index == index:
            return task
    raise KeyError(index)


def _sellable(value: Any) -> bool:
    return value == "many" or isinstance(value, (int, float)) and value > 0


async def run(env_url: str, *, headless: bool) -> dict[str, Any]:
    registry = TaskRegistry()
    env = MobileGymEnv(
        url=simulated_time_bootstrap_url(env_url, SIMULATED_TIME),
        headless=headless,
        coord_space="norm_0_1000",
        delay_after_action=0.05,
        verbose=False,
        viewport_size=(360, 800),
        physical_size=(1080, 2400),
        device_scale_factor=3,
    )
    report: dict[str, Any] = {}
    await env.start()
    try:
        # V3 case 25: on the frozen Sunday, rolling seven days and the GUI's
        # Monday-Sunday week must select the same date and duration.
        reading_task = _task_for_v3(registry, 25)
        await reading_task.setup(env)
        state = await env.get_state(required_apps=list(reading_task.apps))
        reader = WechatReading(state["apps"]["wechat_reading"])
        today = sim_today(state["os"])
        week_start = today - datetime.timedelta(days=today.weekday())
        week_end = week_start + datetime.timedelta(days=6)
        gui_totals: dict[str, int] = {}
        for item in reader.reading_records:
            day = reader.parse_record_date(item["date"])
            if week_start <= day <= week_end:
                key = day.isoformat()
                gui_totals[key] = gui_totals.get(key, 0) + int(item["duration"])
        max_minutes = max(gui_totals.values())
        gui_best = {day for day, value in gui_totals.items() if value == max_minutes}
        rolling_best = set(reader.best_reading_dates_in_last_week(state["os"]))
        assert gui_best == rolling_best
        report["reading_window"] = {
            "today": today.isoformat(),
            "gui_week": [week_start.isoformat(), week_end.isoformat()],
            "best_dates": sorted(gui_best),
            "minutes": max_minutes,
        }

        # Weather's tool output and the state consumed by verifiers must use
        # the same frozen day-zero date.
        weather_task = _task_for_v3(registry, 38)
        await weather_task.setup(env)
        state = await env.get_state(required_apps=list(weather_task.apps))
        state_day_zero = Weather(state["apps"]["weather"]).weather_daily("北京")[0]["fxDate"]
        await env.open_app("weather", wait_stable=True)
        forecast_result = await BrowserToolClient(env.page).call_tool(
            "weather__get_daily_forecast",
            {"city_id": "beijing", "days": 1},
        )
        assert forecast_result.get("ok") is True, forecast_result
        tool_day_zero = forecast_result["output"]["days"][0]["date"]
        assert state_day_zero == tool_day_zero == "2026-07-12"
        report["weather_time_contract"] = {
            "state_day_zero": state_day_zero,
            "tool_day_zero": tool_day_zero,
        }

        # V3 case 35: the nearby tool must paginate over the same complete
        # candidate domain used by the verifier's competition ranking.
        map_task = _task_for_v3(registry, 37)
        await map_task.setup(env)
        await env.open_app("map", wait_stable=True)
        nearby_result = await BrowserToolClient(env.page).call_tool(
            "map__find_nearby",
            {
                "category": map_task.p.category,
                "radius_meters": map_task.p.radius,
                "limit": 50,
            },
        )
        assert nearby_result.get("ok") is True, nearby_result
        nearby = nearby_result["output"]
        assert nearby["truncated"] is False
        rated = [item for item in nearby["items"] if item.get("rating") is not None]
        nearest = min(rated, key=lambda item: item["distance_meters"])
        tool_rank = 1 + sum(item["rating"] > nearest["rating"] for item in rated)
        all_results = Map.filter_results(
            Map.geo_search(map_task.p.category, limit=0),
            max_distance_meters=map_task.p.radius,
        )
        verifier_nearest = Map.nearest_rated_from_results(all_results)
        verifier_rank = Map.rating_rank_from_results(
            all_results,
            str(verifier_nearest["name"]),
            min_results=2,
            place_id=str(verifier_nearest["place_id"]),
        )
        assert tool_rank == verifier_rank
        report["map_candidate_contract"] = {
            "tool_total": nearby["total"],
            "tool_rank": tool_rank,
            "verifier_rank": verifier_rank,
        }

        # V3 case 42: the valid recommendation card is below the old hard-coded
        # top-20 verifier cap but remains in the GUI's scrollable recommendation feed.
        redbook_task = _task_for_v3(registry, 42)
        await redbook_task.setup(env)
        state = await env.get_state(required_apps=list(redbook_task.apps))
        redbook = Redbook(state["apps"]["redbook"])
        recommendation = [
            note
            for note_id in redbook.feed_ids
            if (note := redbook.notes_by_id.get(note_id))
            and str(note.get("category") or "") == "推荐"
        ]
        matches = [
            {"index": index, "id": str(note["id"]), "title": str(note["title"])}
            for index, note in enumerate(recommendation)
            if "分享" in str(note.get("title") or "")
        ]
        assert matches and any(item["index"] >= 20 for item in matches)
        report["redbook_scrollable_feed"] = {"matches": matches}

        # V3 case 33: the frozen weather/calendar-derived date must expose a
        # normally bookable high-speed train, not only an unsupported waitlist.
        trip_task = _task_for_v3(registry, 33)
        await trip_task.setup(env)
        state = await env.get_state(required_apps=list(trip_task.apps))
        weather = Weather(state["apps"]["weather"])
        calendar = Calendar(state["apps"]["calendar"])
        target_date = next(
            day
            for day in weather.non_rainy_dates("上海", 1, 14)
            if calendar.count_events_on_date(datetime.date.fromisoformat(day)) == 0
        )
        await env.open_app("railway12306", wait_stable=True)
        result = await BrowserToolClient(env.page).call_tool(
            "railway12306__query_trains",
            {"from": "北京", "to": "上海", "date": target_date, "limit": 50},
        )
        assert result.get("ok") is True, result
        trains = (result.get("output") or {}).get("items") or []
        high_speed = [
            train for train in trains
            if str(train.get("train_no") or "").startswith("G")
            and any(_sellable(seat.get("available")) for seat in train.get("seats") or [])
        ]
        assert high_speed
        earliest = min(high_speed, key=lambda train: str(train["departure"]))
        report["trip_bookability"] = {
            "target_date": target_date,
            "earliest_sellable_high_speed": earliest["train_no"],
            "departure": earliest["departure"],
        }

        # V3 case 51: every explicitly named delete target and every other
        # verifier-preserved file exists in the seeded directory.
        file_task = _task_for_v3(registry, 51)
        await file_task.setup(env)
        state = await env.get_state(required_apps=list(file_task.apps))
        fs = FileSystem(state["os"]["fileSystem"])
        assert all(fs.exists(path) for path in file_task.target_paths)
        assert all(fs.exists(path) for path in file_task.preserve_paths)
        report["file_contract"] = {
            "delete_targets": [Path(path).name for path in file_task.target_paths],
            "preserved": [Path(path).name for path in file_task.preserve_paths],
        }
    finally:
        await env.close()
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-url", default="http://127.0.0.1:4181")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()
    report = asyncio.run(run(args.env_url, headless=args.headless))
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
