"""Real-browser setup, frozen-time, initial-negative and tool-surface smoke."""

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
from bench_env.task.clocked.specs import SIMULATED_TIME
from bench_env.task.clocked.time_control import simulated_time_bootstrap_url
from bench_env.task.clocked.tool_surface import APP_TOOLS
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
        registry.create_task(f"clocked.{name}")
        for name in registry.list_tasks("clocked")
    ]
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
    rows: list[dict[str, Any]] = []
    expected = datetime.datetime.fromisoformat(SIMULATED_TIME).timestamp() * 1000
    await env.start()
    try:
        boot_state = await env.get_state(required_apps=["wechat"])
        boot_now = await env.page.evaluate("() => window.__SIM_TIME__?.now()")
        boss = next(
            chat
            for chat in boot_state["apps"]["wechat"]["chats"]
            if chat["user"]["name"] == "Boss"
        )
        boss_latest = boss["messages"][-1]
        boss_age_ms = float(boot_now) - float(boss_latest["timestamp"])
        if abs(boss_age_ms - 30 * 60 * 1000) > 1000:
            raise AssertionError(
                "WeChat relative defaults were not materialized under the V4 boot clock: "
                f"boss_latest_age_ms={boss_age_ms}"
            )

        for task in tasks:
            initial_obs = await task.setup(env)
            state = await env.get_state(required_apps=list(task.apps))
            actual = _timestamp_ms(state.get("os") or {})
            if abs(actual - expected) > 1000:
                raise AssertionError(
                    f"{task.id} time mismatch: expected={expected}, actual={actual}"
                )
            config = await env.page.evaluate("() => window.__SIM_TIME__?.getConfig()")
            if config.get("mode") != "simulated" or config.get("flowing") is not False:
                raise AssertionError(f"{task.id} clock is not frozen: {config}")

            judged_obs = replace(initial_obs, state=state)
            judge = task.evaluate(
                JudgeInput(init_obs=judged_obs, last_obs=judged_obs, answer=None)
            )
            if judge.success:
                raise AssertionError(f"{task.id} passes before the agent acts")

            client = BrowserToolClient(env.page)
            tool_counts: dict[str, int] = {}
            for app in task.apps:
                names = APP_TOOLS.get(app, ())
                if not names:
                    continue
                await env.open_app(app, wait_stable=True)
                actual_names = sorted(
                    str(item["name"]) for item in await client.list_tools(app)
                )
                if actual_names != sorted(names):
                    raise AssertionError(
                        f"{task.id} tool mismatch for {app}: "
                        f"expected={sorted(names)}, actual={actual_names}"
                    )
                tool_counts[app] = len(actual_names)

            rows.append({
                "task_id": task.id,
                "v3_index": task.spec.v3_index,
                "source_task": task.spec.source_task,
                "simulated_time": task.spec.simulated_time,
                "initial_success": False,
                "tool_counts": tool_counts,
                "ok": True,
            })
            task.teardown(env)
    finally:
        await env.close()
    return {
        "tasks_checked": len(rows),
        "failures": 0,
        "time_bootstrap": {"boss_latest_age_minutes": boss_age_ms / 60000},
        "rows": rows,
    }


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
