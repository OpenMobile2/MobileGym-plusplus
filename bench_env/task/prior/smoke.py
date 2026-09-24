"""Real-browser V5 setup, frozen-time, initial-negative and tool-surface smoke."""

from __future__ import annotations

import argparse
import asyncio
import datetime
import json
from dataclasses import replace
from pathlib import Path
from typing import Any

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.browser_tools import BrowserToolClient
from bench_env.task.prior.contracts import PANTRY_NOTE
from bench_env.task.prior.specs import SIMULATED_TIME
from bench_env.task.prior.time_control import simulated_time_bootstrap_url
from bench_env.task.prior.tool_surface import APP_TOOLS
from bench_env.task.judge import JudgeInput
from bench_env.task.registry import TaskRegistry


def _timestamp_ms(os_state: dict[str, Any]) -> float:
    value = os_state.get("time")
    if isinstance(value, dict):
        value = value.get("timestamp")
    if not isinstance(value, (int, float)):
        raise AssertionError(f"Missing os.time timestamp: {os_state.get('time')!r}")
    return float(value)


async def run_smoke(env_url: str, *, headless: bool) -> dict[str, Any]:
    registry = TaskRegistry()
    tasks = [
        registry.create_task(f"prior.{name}")
        for name in registry.list_tasks("prior")
    ]
    env = MobileGymEnv(
        url=simulated_time_bootstrap_url(env_url, SIMULATED_TIME),
        headless=headless,
        coord_space="norm_0_1000",
        delay_after_action=0.03,
        verbose=False,
        viewport_size=(360, 800),
        physical_size=(1080, 2400),
        device_scale_factor=3,
    )
    expected_time = datetime.datetime.fromisoformat(SIMULATED_TIME).timestamp() * 1000
    rows = []
    await env.start()
    try:
        for task in tasks:
            initial_obs = await task.setup(env)
            state = await env.get_state(required_apps=list(task.apps))
            actual_time = _timestamp_ms(state.get("os") or {})
            if abs(actual_time - expected_time) > 1000:
                raise AssertionError(f"{task.id} clock mismatch: {actual_time}")

            judged_obs = replace(initial_obs, state=state)
            judge = task.evaluate(
                JudgeInput(init_obs=judged_obs, last_obs=judged_obs, answer=None)
            )
            if judge.judge_error:
                raise AssertionError(f"{task.id} initial judge error: {judge.judge_error}")
            if judge.success:
                raise AssertionError(f"{task.id} passes before the agent acts")

            if task.spec.index in {14, 21, 22, 25}:
                history = state["apps"]["spotify"].get("playHistory") or []
                if len(history) != len(state["apps"]["spotify"].get("recentPlays") or []):
                    raise AssertionError(f"{task.id} playback history was not seeded")
                await env.open_app("spotify", wait_stable=True)
                result = await BrowserToolClient(env.page).call_tool(
                    "spotify__list_recent_plays", {"limit": 20}
                )
                if not result.get("ok"):
                    raise AssertionError(f"{task.id} recent-play tool failed: {result}")
                if not all(item.get("played_at") for item in result["output"]["items"]):
                    raise AssertionError(f"{task.id} recent-play timestamps missing")

            if task.spec.index == 47 and task.params.get("date") != "2026-07-14":
                raise AssertionError(f"{task.id} date is not pinned: {task.params}")

            if task.spec.index == 74:
                pantry = next(
                    note
                    for note in state["apps"]["notes"]["notes"]
                    if note.get("title") == "Office pantry"
                )
                if pantry.get("content") != PANTRY_NOTE:
                    raise AssertionError(f"{task.id} pantry setup mismatch: {pantry}")

            client = BrowserToolClient(env.page)
            tool_counts = {}
            for app in task.apps:
                expected_names = APP_TOOLS.get(app, ())
                if not expected_names:
                    continue
                await env.open_app(app, wait_stable=True)
                actual_names = sorted(str(item["name"]) for item in await client.list_tools(app))
                if actual_names != sorted(expected_names):
                    raise AssertionError(
                        f"{task.id} tool mismatch for {app}: {actual_names}"
                    )
                tool_counts[app] = len(actual_names)

            rows.append({
                "task_id": task.id,
                "initial_success": False,
                "tool_counts": tool_counts,
                "ok": True,
            })
            task.teardown(env)
    finally:
        await env.close()
    return {"tasks_checked": len(rows), "failures": 0, "rows": rows}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-url", default="http://127.0.0.1:4181")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()
    report = asyncio.run(run_smoke(args.env_url, headless=args.headless))
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

