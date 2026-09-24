"""Real-browser setup, initial-negative and dynamic-tool smoke test for V3."""

from __future__ import annotations

import argparse
import asyncio
from dataclasses import replace
import json
from pathlib import Path
from typing import Any

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.browser_tools import BrowserToolClient
from bench_env.task.drafts.tool_surface import APP_TOOLS
from bench_env.task.judge import JudgeInput
from bench_env.task.registry import TaskRegistry


def _has_id(items: Any, item_id: str, key: str = "id") -> bool:
    return any(
        isinstance(item, dict) and str(item.get(key)) == item_id
        for item in (items or [])
    )


def _check_profile_anchors(state: dict[str, Any], profiles: tuple[str, ...]) -> None:
    apps = state.get("apps") or {}
    if "calendar_work" in profiles:
        assert _has_id((apps.get("calendar") or {}).get("events"), "ht_cal_review")
    if "wechat_work" in profiles:
        assert _has_id((apps.get("wechat") or {}).get("contacts"), "ht_alice", "wxid")
        assert _has_id((apps.get("wechat") or {}).get("chats"), "ht_mia")
    if "daysmatter_work" in profiles:
        assert _has_id((apps.get("daysmatter") or {}).get("events"), "ht_dm_contract")
    if "clock_work" in profiles:
        assert _has_id((apps.get("clock") or {}).get("alarms"), "ht_alarm_standup")
    if "notes_work" in profiles:
        assert _has_id((apps.get("notes") or {}).get("notes"), "ht_note_release")
        assert _has_id((apps.get("notes") or {}).get("todos"), "ht_todo_minutes")


async def run_smoke(env_url: str, *, headless: bool) -> dict[str, Any]:
    registry = TaskRegistry()
    tasks = [
        registry.create_task(f"drafts.{name}")
        for name in registry.list_tasks("drafts")
    ]
    env = MobileGymEnv(
        url=env_url,
        headless=headless,
        coord_space="norm_0_1000",
        delay_after_action=0.05,
        verbose=False,
        viewport_size=(360, 800),
        physical_size=(1080, 2400),
        device_scale_factor=3,
    )
    rows: list[dict[str, Any]] = []
    await env.start()
    try:
        for task in tasks:
            initial_obs = await task.setup(env)
            state = await env.get_state(required_apps=list(task.apps))
            _check_profile_anchors(state, task.spec.setup_profiles)
            judged_obs = replace(initial_obs, state=state)
            judge = task.evaluate(
                JudgeInput(init_obs=judged_obs, last_obs=judged_obs, answer=None)
            )
            if judge.success:
                raise AssertionError(f"{task.id} passes before the agent acts")

            client = BrowserToolClient(env.page)
            tool_counts: dict[str, int] = {}
            for app in task.apps:
                expected = APP_TOOLS.get(app, ())
                if not expected:
                    continue
                await env.open_app(app, wait_stable=True)
                actual = await client.list_tools(app)
                actual_names = sorted(str(item["name"]) for item in actual)
                if actual_names != sorted(expected):
                    raise AssertionError(
                        f"{task.id} tool mismatch for {app}: "
                        f"expected={sorted(expected)}, actual={actual_names}"
                    )
                tool_counts[app] = len(actual_names)

            rows.append({
                "task_id": task.id,
                "dataset_id": task.spec.task_id,
                "source_task": task.spec.source_task,
                "apps": list(task.apps),
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
