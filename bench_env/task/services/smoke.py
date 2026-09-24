"""Real-browser setup, frozen-time, initial-negative and Tool smoke for V4."""

from __future__ import annotations

import argparse
import asyncio
from dataclasses import replace
import datetime
import json
from pathlib import Path
from typing import Any

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.browser_tools import BrowserToolClient
from bench_env.task.clocked.time_control import simulated_time_bootstrap_url
from bench_env.task.judge import JudgeInput
from bench_env.task.registry import TaskRegistry


SUITE = "services"
SIMULATED_TIME = "2026-07-12 09:00:00"


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
        registry.create_task(f"{SUITE}.{name}")
        for name in registry.list_tasks(SUITE)
    ]
    if len(tasks) != 76:
        raise AssertionError(f"expected 76 tasks, found {len(tasks)}")
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
    rows: list[dict[str, Any]] = []
    await env.start()
    try:
        client = BrowserToolClient(env.page)
        for task in tasks:
            initial_obs = await task.setup(env)
            state = await env.get_state(required_apps=list(task.apps))
            actual_time = _timestamp_ms(state.get("os") or {})
            if abs(actual_time - expected_time) > 1000:
                raise AssertionError(f"{task.id} clock mismatch: {actual_time}")
            config = await env.page.evaluate("() => window.__SIM_TIME__?.getConfig()")
            if config.get("mode") != "simulated" or config.get("flowing") is not False:
                raise AssertionError(f"{task.id} clock is not frozen: {config}")

            judged_obs = replace(initial_obs, state=state)
            judge = task.evaluate(JudgeInput(init_obs=judged_obs, last_obs=judged_obs, answer=None))
            if judge.judge_error:
                raise AssertionError(f"{task.id} initial judge error: {judge.judge_error}")
            if judge.success:
                raise AssertionError(f"{task.id} passes before the agent acts")

            runtime_tools: set[str] = set()
            tool_counts: dict[str, int] = {}
            for app in task.apps:
                await env.open_app(app, wait_stable=True)
                names = {str(item["name"]) for item in await client.list_tools(app)}
                runtime_tools.update(names)
                tool_counts[app] = len(names)
            required = set(getattr(task.spec, "candidate_tools", ()) or ())
            missing = sorted(required - runtime_tools)
            if missing:
                raise AssertionError(f"{task.id} missing candidate tools: {missing}")

            rows.append({
                "task_id": task.id,
                "apps": list(task.apps),
                "initial_success": False,
                "required_tools": sorted(required),
                "tool_counts": tool_counts,
                "fixed_time": SIMULATED_TIME,
                "ok": True,
            })
            task.teardown(env)
    finally:
        await env.close()
    return {"suite": SUITE, "tasks_checked": len(rows), "failures": 0, "rows": rows}


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
    print(json.dumps({"tasks_checked": report["tasks_checked"], "failures": 0}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
