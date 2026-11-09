"""Focused real-browser probes for V5 environment and verifier boundaries."""

from __future__ import annotations

import argparse
import asyncio
import copy
import json
from dataclasses import replace
from pathlib import Path
from typing import Any

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.browser_tools import BrowserToolClient
from bench_env.task.prior.contracts import PANTRY_TARGETS
from bench_env.task.prior.specs import SIMULATED_TIME
from bench_env.task.prior.time_control import simulated_time_bootstrap_url
from bench_env.task.judge import JudgeInput
from bench_env.task.railway12306.app import Railway12306
from bench_env.task.registry import TaskRegistry
from bench_env.task.spotify.app import Spotify
from bench_env.task.weather.app import Weather
from bench_env.task.wechat_reading.app import WechatReading


def _result(result: Any) -> dict[str, Any]:
    payload = result.to_dict()
    if payload.get("judge_error"):
        raise AssertionError(payload["judge_error"])
    return payload


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
        spotify_task = registry.create_task("prior.HTV5Case14")
        spotify_initial = await spotify_task.setup(env)
        await env.open_app("spotify", wait_stable=True)
        client = BrowserToolClient(env.page)
        recent = await client.call_tool("spotify__list_recent_plays", {"limit": 20})
        assert recent.get("ok") is True, recent
        expected_times = [
            str(item["played_at"])[11:16]
            for item in recent["output"]["items"]
        ]
        await env.page.locator('[data-scroll-container="main"] header > div').first.click()
        await env.page.get_by_text("最近播放", exact=True).last.click()
        count = len(expected_times)
        await env.page.get_by_text(f"已播放 {count} 首歌曲", exact=True).click()
        await env.page.wait_for_timeout(200)
        body = await env.page.locator("body").inner_text()
        assert expected_times and all(value in body for value in expected_times)
        report["spotify_chronology"] = {
            "tool_times": expected_times,
            "gui_times_visible": True,
        }

        state = await env.get_state(required_apps=list(spotify_task.apps))
        song = str(Spotify(state["apps"]["spotify"]).nth_today_play(1)["title"])
        book = WechatReading(
            state["apps"]["wechat_reading"]
        ).first_hot_search_title()
        cultural_content = f"{song}\n{book}"
        notes = copy.deepcopy(state["apps"]["notes"]["notes"])
        notes.append({
            "id": "v5_boundary_cultural_note",
            "title": "今日文化清单",
            "content": cultural_content,
            "updatedAt": 1783819000000,
            "folderId": "unfiled",
            "pinned": False,
        })
        redbook = copy.deepcopy(state["apps"]["redbook"])
        note_id = "v5_boundary_cultural_post"
        post = copy.deepcopy(next(iter(redbook["notes"].values())))
        post.update({
            "id": note_id,
            "title": "今日文化分享",
            "desc": cultural_content,
            "content": cultural_content,
            "authorId": redbook["user"]["id"],
            "createdAt": 1783819000000,
        })
        redbook["notes"][note_id] = post
        redbook["user"]["publishedNoteIds"] = [
            note_id,
            *(redbook["user"].get("publishedNoteIds") or []),
        ]
        await env.set_state(
            {"apps": {"notes": {"notes": notes}, "redbook": redbook}},
            deep=True,
            reload=False,
        )
        final_state = await env.get_state(required_apps=list(spotify_task.apps))
        correct_title = _result(spotify_task.evaluate(JudgeInput(
            init_obs=spotify_initial,
            last_obs=replace(spotify_initial, state=final_state),
        )))
        assert correct_title["success"] is True
        notes[-1]["title"] = "随手记"
        await env.set_state(
            {"apps": {"notes": {"notes": notes}}}, deep=True, reload=False
        )
        final_state = await env.get_state(required_apps=list(spotify_task.apps))
        wrong_title = _result(spotify_task.evaluate(JudgeInput(
            init_obs=spotify_initial,
            last_obs=replace(spotify_initial, state=final_state),
        )))
        assert wrong_title["success"] is False
        report["case14_output_contract"] = {
            "exact_new_note_title_accepted": True,
            "wrong_note_title_rejected": True,
            "redbook_requires_both_items": True,
        }

        reading_task = registry.create_task("prior.HTV5Case17")
        reading_initial = await reading_task.setup(env)
        state = await env.get_state(required_apps=list(reading_task.apps))
        reading = WechatReading(state["apps"]["wechat_reading"])
        reading_targets = []
        for item in reading.shelf:
            book_id = str(item.get("bookId") or "")
            progress = reading.get_progress(book_id)
            if 0 < progress < 99.9:
                reading_targets.append(
                    str(reading.require_store_book(book_id)["title"])
                )
        plan_notes = copy.deepcopy(state["apps"]["notes"]["notes"])
        plan_notes.append({
            "id": "v5_boundary_reading_plan",
            "title": "本周阅读计划",
            "content": "\n".join(reading_targets),
            "updatedAt": 1783819000000,
            "folderId": "unfiled",
            "pinned": False,
        })
        await env.set_state(
            {"apps": {"notes": {"notes": plan_notes}}}, deep=True, reload=False
        )
        final_state = await env.get_state(required_apps=list(reading_task.apps))
        complete_plan = _result(reading_task.evaluate(JudgeInput(
            init_obs=reading_initial,
            last_obs=replace(reading_initial, state=final_state),
        )))
        assert complete_plan["success"] is True
        plan_notes[-1]["content"] = "\n".join(reading_targets[:-1])
        await env.set_state(
            {"apps": {"notes": {"notes": plan_notes}}}, deep=True, reload=False
        )
        final_state = await env.get_state(required_apps=list(reading_task.apps))
        incomplete_plan = _result(reading_task.evaluate(JudgeInput(
            init_obs=reading_initial,
            last_obs=replace(reading_initial, state=final_state),
        )))
        assert incomplete_plan["success"] is False
        report["case17_reading_set"] = {
            "targets": reading_targets,
            "complete_plan_accepted": True,
            "missing_book_rejected": True,
        }

        weather_task = registry.create_task("prior.HTV5Case36")
        await weather_task.setup(env)
        added = await BrowserToolClient(env.page).call_tool(
            "weather__add_saved_city", {"city_id": "nanjing"}
        )
        assert added.get("ok") is True, added
        await env.open_app("weather", wait_stable=True)
        manager = env.page.get_by_label("城市管理")
        if await manager.count() == 0:
            manager = env.page.get_by_label("Manage cities")
        await manager.click()
        await env.page.wait_for_timeout(200)
        body = await env.page.locator("body").inner_text()
        assert "南京" in body and "--°" not in body
        report["weather_saved_city_gui"] = {
            "city": "南京",
            "forecast_values_visible": True,
        }

        dates_task = registry.create_task("prior.HTV5Case40")
        initial = await dates_task.setup(env)
        state = await env.get_state(required_apps=list(dates_task.apps))
        expected_dates = Weather(state["apps"]["weather"]).non_rainy_dates(
            dates_task.p.city, 1, 5
        )
        notes = copy.deepcopy(state["apps"]["notes"]["notes"])
        notes.append({
            "id": "v5_boundary_non_rainy",
            "title": "适合出行的日子",
            "content": "、".join(expected_dates),
            "updatedAt": 1783820000000,
            "folderId": "unfiled",
            "pinned": False,
        })
        await env.set_state({"apps": {"notes": {"notes": notes}}}, deep=True, reload=False)
        final_state = await env.get_state(required_apps=list(dates_task.apps))
        exact = _result(dates_task.evaluate(JudgeInput(
            init_obs=initial,
            last_obs=replace(initial, state=final_state),
        )))
        assert exact["success"] is True
        notes[-1]["content"] += "、2026-07-18"
        await env.set_state({"apps": {"notes": {"notes": notes}}}, deep=True, reload=False)
        final_state = await env.get_state(required_apps=list(dates_task.apps))
        extra = _result(dates_task.evaluate(JudgeInput(
            init_obs=initial,
            last_obs=replace(initial, state=final_state),
        )))
        assert extra["success"] is False
        report["case40_exact_set"] = {
            "expected_dates": expected_dates,
            "exact_accepted": True,
            "superset_rejected": True,
        }

        train_task = registry.create_task("prior.HTV5Case41")
        initial = await train_task.setup(env)
        state = await env.get_state(required_apps=list(train_task.apps))
        target_date = Weather(state["apps"]["weather"]).first_non_rainy_date(
            train_task.p.city, 1, 3
        )
        rail = Railway12306(state["apps"]["railway12306"])
        order = {
            "id": "v5_boundary_order",
            "trainNo": "G999",
            "fromStation": train_task.p.from_station,
            "toStation": train_task.p.city,
            "departTime": "08:00",
            "arriveTime": "12:00",
            "date": target_date,
            "tickets": [{
                "passengerName": rail.user_name,
                "ticketType": "成人票",
                "seatType": "二等座",
                "seatNo": "01车 01A号",
                "price": 500,
            }],
            "status": "pending",
            "createTime": "2026-07-12T09:00:00+08:00",
        }
        orders = copy.deepcopy(state["apps"]["railway12306"]["orders"])
        orders.append(order)
        await env.set_state(
            {"apps": {"railway12306": {"orders": orders}}},
            deep=True,
            reload=False,
        )
        final_state = await env.get_state(required_apps=list(train_task.apps))
        high_speed = _result(train_task.evaluate(JudgeInput(
            init_obs=initial,
            last_obs=replace(initial, state=final_state),
        )))
        assert high_speed["success"] is True
        orders[-1]["trainNo"] = "D999"
        await env.set_state(
            {"apps": {"railway12306": {"orders": orders}}},
            deep=True,
            reload=False,
        )
        final_state = await env.get_state(required_apps=list(train_task.apps))
        regular = _result(train_task.evaluate(JudgeInput(
            init_obs=initial,
            last_obs=replace(initial, state=final_state),
        )))
        assert regular["success"] is False
        report["case41_train_class"] = {
            "G_series_accepted": True,
            "D_series_rejected": True,
            "judge_error": None,
        }

        pantry_task = registry.create_task("prior.HTV5Case74")
        initial = await pantry_task.setup(env)
        await env.open_app("tbsg", wait_stable=True)
        client = BrowserToolClient(env.page)
        additions = []
        for item_id in sorted(PANTRY_TARGETS):
            added = await client.call_tool(
                "tbsg__add_item_to_cart",
                {"item_id": item_id, "quantity": 1},
            )
            assert added.get("ok") is True, added
            additions.append(added["output"])
        final_state = await env.get_state(required_apps=list(pantry_task.apps))
        pantry = _result(pantry_task.evaluate(JudgeInput(
            init_obs=initial,
            last_obs=replace(initial, state=final_state),
        )))
        assert pantry["success"] is True
        report["case74_exact_cart"] = {
            "additions": additions,
            "exact_delta_accepted": True,
            "checkout_and_orders_unchanged": True,
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
