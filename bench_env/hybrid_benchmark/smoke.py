"""No-model browser smoke test for fixed task setup and dynamic tool exposure."""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path
from typing import Any

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.browser_tools import BrowserToolClient
from bench_env.task.registry import TaskRegistry


EXPECTED_TOOL_COUNTS = {
    "calendar": 5,
    "wechat": 10,
    "tbsg": 10,
    "daysmatter": 9,
    "clock": 9,
    "notes": 10,
    "taobao": 0,
}


def _has_id(items: Any, item_id: str, key: str = "id") -> bool:
    return any(isinstance(item, dict) and str(item.get(key)) == item_id for item in (items or []))


def _check_profile_anchors(state: dict[str, Any], profiles: tuple[str, ...]) -> None:
    apps = state.get("apps") or {}
    if "calendar_work" in profiles:
        assert _has_id((apps.get("calendar") or {}).get("events"), "ht_cal_review")
    if "wechat_work" in profiles:
        assert _has_id((apps.get("wechat") or {}).get("contacts"), "ht_alice", "wxid")
        assert _has_id((apps.get("wechat") or {}).get("chats"), "ht_mia")
    if "daysmatter_work" in profiles:
        assert _has_id((apps.get("daysmatter") or {}).get("events"), "ht_dm_contract")
    if "clock_work" in profiles or "clock_next" in profiles:
        assert _has_id((apps.get("clock") or {}).get("alarms"), "ht_alarm_standup")
    if "notes_work" in profiles:
        assert _has_id((apps.get("notes") or {}).get("notes"), "ht_note_release")
        assert _has_id((apps.get("notes") or {}).get("todos"), "ht_todo_minutes")


async def run_smoke(env_url: str, *, all_tasks: bool, headless: bool) -> dict[str, Any]:
    registry = TaskRegistry()
    tasks = [
        registry.create_task(f"core.{name}")
        for name in registry.list_tasks("core")
    ]
    if not all_tasks:
        wanted = {"cal_01", "wx_01", "tb_01", "dm_01", "clk_01", "note_01", "cross_01"}
        tasks = [task for task in tasks if task.spec.task_id in wanted]

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
    rows = []
    await env.start()
    try:
        for task in tasks:
            obs = await task.setup(env)
            state = await env.get_state(required_apps=list(task.apps))
            _check_profile_anchors(state, task.spec.setup_profiles)
            counts = {}
            client = BrowserToolClient(env.page)
            for app in task.apps:
                await env.open_app(app, wait_stable=True)
                tools = await client.list_tools(app)
                counts[app] = len(tools)
                assert len(tools) == EXPECTED_TOOL_COUNTS[app], (task.id, app, len(tools))
            rows.append({
                "task_id": task.id,
                "dataset_id": task.spec.task_id,
                "apps": task.apps,
                "setup_profiles": list(task.spec.setup_profiles),
                "initial_route": obs.route,
                "tool_counts": counts,
                "ok": True,
            })
    finally:
        await env.close()
    return {"tasks_checked": len(rows), "all_tasks": all_tasks, "rows": rows}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-url", default="http://127.0.0.1:4181")
    parser.add_argument("--all-tasks", action="store_true")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()
    report = asyncio.run(run_smoke(args.env_url, all_tasks=args.all_tasks, headless=args.headless))
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
