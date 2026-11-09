"""Opt-in scenario setup helpers for standalone hybrid-agent demos."""

from __future__ import annotations

from datetime import datetime
from typing import Any


CALENDAR_DEMO_EVENT: dict[str, Any] = {
    "id": "evt_demo_project_review",
    "type": "event",
    "title": "项目评审",
    "description": "会议地点：3号会议室。讨论移动端发布计划。",
    "location": "3号会议室",
    "allDay": False,
    "startTs": int(datetime.fromisoformat("2026-07-14T14:00:00+08:00").timestamp() * 1000),
    "endTs": int(datetime.fromisoformat("2026-07-14T15:00:00+08:00").timestamp() * 1000),
    "reminderMinutesBefore": 15,
    "alarmEnabled": False,
    "calendarAccount": "本地日历",
}


async def setup_calendar_demo(env: Any) -> dict[str, Any]:
    """Inject one deterministic Calendar event before the agent's first turn."""

    event = dict(CALENDAR_DEMO_EVENT)
    await env.set_state(
        {"apps": {"calendar": {"events": [event]}}},
        deep=True,
        reload=False,
    )
    state = await env.get_state(required_apps=["calendar"])
    events = ((state.get("apps") or {}).get("calendar") or {}).get("events") or []
    if not any(item.get("id") == event["id"] for item in events if isinstance(item, dict)):
        raise RuntimeError("Calendar demo event injection did not persist")
    await env.go_home()
    return event
