"""Real-browser delivery smoke for all retained 0815 tasks."""

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
from bench_env.task.workflows import SIMULATED_TIME
from bench_env.task.clocked.time_control import simulated_time_bootstrap_url
from bench_env.task.judge import JudgeInput
from bench_env.task.registry import TaskRegistry


async def run(env_url: str, *, headless: bool, suite: str) -> dict[str, Any]:
    registry = TaskRegistry()
    tasks = [
        registry.create_task(f"{suite}.{name}")
        for name in registry.list_tasks(suite)
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
            actual_time = float(((state.get("os") or {}).get("time") or {}).get("timestamp") or 0)
            if abs(actual_time - expected_time) > 1000:
                raise AssertionError(f"{task.id}: simulator clock mismatch {actual_time}")
            judged_obs = replace(initial_obs, state=state)
            result = task.evaluate(JudgeInput(init_obs=judged_obs, last_obs=judged_obs, answer=None))
            if result.success:
                raise AssertionError(f"{task.id}: untouched initial state passes verifier")

            required_tools = set(task.candidate_tools)
            exposed_tools: set[str] = set()
            if required_tools:
                await env.open_app(task.apps[0], wait_stable=True)
                exposed_tools = {
                    str(item["name"])
                    for item in await BrowserToolClient(env.page).list_tools(task.apps[0])
                }
                missing = required_tools - exposed_tools
                if missing:
                    raise AssertionError(f"{task.id}: missing runtime tools {sorted(missing)}")
            rows.append({
                "task_id": task.id,
                "app": task.apps[0],
                "initial_success": False,
                "required_tools": sorted(required_tools),
                "runtime_tool_count": len(exposed_tools),
                "fixed_time": SIMULATED_TIME,
                "ok": True,
            })
            if len(rows) % 10 == 0 or len(rows) == len(tasks):
                print(f"[{suite}] {len(rows)}/{len(tasks)}", flush=True)
            task.teardown(env)
    finally:
        await env.close()
    return {"suite": suite, "tasks_checked": len(rows), "failures": 0, "rows": rows}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-url", default="http://127.0.0.1:4181")
    parser.add_argument("--suite", default="workflows")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = asyncio.run(run(args.env_url, headless=args.headless, suite=args.suite))
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
