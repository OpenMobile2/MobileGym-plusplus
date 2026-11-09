"""Deterministic state injection for hybrid-tools-v1 tasks."""

from __future__ import annotations

import copy
from datetime import datetime
from typing import Any, Callable


def _ts(value: str) -> int:
    return int(datetime.fromisoformat(value).timestamp() * 1000)


CALENDAR_EVENTS = [
    {
        "id": "ht_cal_review",
        "type": "event",
        "title": "Project Atlas review",
        "description": "Location: Cedar Room. Bring the launch checklist.",
        "location": "Cedar Room",
        "allDay": False,
        "startTs": _ts("2026-07-14T14:00:00+08:00"),
        "endTs": _ts("2026-07-14T15:00:00+08:00"),
        "reminderMinutesBefore": 15,
        "alarmEnabled": False,
        "calendarAccount": "Local calendar",
    },
    {
        "id": "ht_cal_vendor",
        "type": "event",
        "title": "Vendor sync",
        "description": "Video room code V-4821. Owner: Mia.",
        "location": "Online V-4821",
        "allDay": False,
        "startTs": _ts("2026-07-15T10:00:00+08:00"),
        "endTs": _ts("2026-07-15T11:00:00+08:00"),
        "reminderMinutesBefore": 30,
        "alarmEnabled": True,
        "calendarAccount": "Local calendar",
    },
    {
        "id": "ht_cal_design",
        "type": "event",
        "title": "Design critique",
        "description": "Location: Maple Room. Review onboarding screens.",
        "location": "Maple Room",
        "allDay": False,
        "startTs": _ts("2026-07-16T16:00:00+08:00"),
        "endTs": _ts("2026-07-16T17:30:00+08:00"),
        "reminderMinutesBefore": 5,
        "alarmEnabled": False,
        "calendarAccount": "Local calendar",
    },
]


WECHAT_CONTACTS = [
    {
        "wxid": "ht_alice",
        "name": "Alice Chen",
        "alias": "Alice",
        "avatar": "avatars/avatar_12.jpg",
        "category": "A",
        "signature": "Product operations",
        "region": "China Shanghai",
        "gender": "女",
        "memo": "Atlas launch owner",
        "isBlacklisted": False,
        "isStarred": False,
        "permissionMode": "all",
        "hideMyMoments": False,
        "hideTheirMoments": False,
        "aiConfig": {"enabled": False},
    },
    {
        "wxid": "ht_mia",
        "name": "Mia Wang",
        "alias": "Mia",
        "avatar": "avatars/avatar_18.jpg",
        "category": "M",
        "signature": "Vendor manager",
        "region": "China Hangzhou",
        "gender": "女",
        "memo": "Vendor contact",
        "isBlacklisted": False,
        "isStarred": False,
        "permissionMode": "all",
        "hideMyMoments": False,
        "hideTheirMoments": False,
        "aiConfig": {"enabled": False},
    },
    {
        "wxid": "ht_engineer",
        "name": "Chen Gong",
        "alias": "Engineer Chen",
        "avatar": "avatars/avatar_20.jpg",
        "category": "C",
        "signature": "Release engineering",
        "region": "China Beijing",
        "gender": "男",
        "memo": "Build owner",
        "isBlacklisted": False,
        "isStarred": False,
        "permissionMode": "all",
        "hideMyMoments": False,
        "hideTheirMoments": False,
        "aiConfig": {"enabled": False},
    },
]


def _chat(contact: dict[str, Any], messages: list[tuple[str, str]]) -> dict[str, Any]:
    rows = []
    base = _ts("2026-07-11T09:00:00+08:00")
    for index, (sender, content) in enumerate(messages):
        rows.append({
            "id": f"ht_msg_{contact['wxid']}_{index}",
            "type": "text",
            "content": content,
            "senderId": sender,
            "timestamp": base + index * 60_000,
        })
    return {
        "id": contact["wxid"],
        "user": {
            "wxid": contact["wxid"],
            "name": contact["name"],
            "avatar": contact["avatar"],
        },
        "isMuted": False,
        "isSticky": False,
        "isAlert": True,
        "messages": rows,
    }


WECHAT_CHATS = [
    _chat(WECHAT_CONTACTS[0], [
        ("ht_alice", "Atlas launch is approved. The handoff code is ATLAS-731."),
        ("xiaoming001", "Received, I will prepare the follow-up."),
        ("ht_alice", "Please use Cedar Room for the review."),
    ]),
    _chat(WECHAT_CONTACTS[1], [
        ("ht_mia", "Vendor meeting code V-4821 is confirmed for Wednesday."),
        ("ht_mia", "The backup contact is 021-5550-8820."),
    ]),
    _chat(WECHAT_CONTACTS[2], [
        ("ht_engineer", "Release candidate RC-204 passed smoke testing."),
        ("ht_engineer", "Please notify the team before 18:00."),
    ]),
]


DAYSMATTER_EVENTS = [
    {
        "id": "ht_dm_contract",
        "title": "Contract renewal",
        "targetDate": _ts("2026-08-20T00:00:00+08:00"),
        "notebookId": "nb_work",
        "calendar": "solar",
        "pinned": False,
        "showOnHome": True,
        "repeat": "none",
        "reminder": "none",
        "plusOne": False,
        "hasEndDate": False,
        "endDate": None,
        "parentId": None,
        "archived": False,
        "createdAt": _ts("2026-07-01T09:00:00+08:00"),
    },
    {
        "id": "ht_dm_launch",
        "title": "Atlas public launch",
        "targetDate": _ts("2026-09-15T00:00:00+08:00"),
        "notebookId": "nb_work",
        "calendar": "solar",
        "pinned": True,
        "showOnHome": True,
        "repeat": "none",
        "reminder": "weekly",
        "plusOne": False,
        "hasEndDate": False,
        "endDate": None,
        "parentId": None,
        "archived": False,
        "createdAt": _ts("2026-07-01T09:10:00+08:00"),
    },
    {
        "id": "ht_dm_birthday",
        "title": "Mia birthday",
        "targetDate": _ts("2026-11-08T00:00:00+08:00"),
        "notebookId": "nb_anniv",
        "calendar": "solar",
        "pinned": False,
        "showOnHome": True,
        "repeat": "year",
        "reminder": "yearly",
        "plusOne": False,
        "hasEndDate": False,
        "endDate": None,
        "parentId": None,
        "archived": False,
        "createdAt": _ts("2026-07-01T09:20:00+08:00"),
    },
]


NOTES_ITEMS = [
    {
        "id": "ht_note_release",
        "title": "Atlas release checklist",
        "content": "Owner: Alice Chen\nBuild: RC-204\nReview room: Cedar Room",
        "updatedAt": _ts("2026-07-11T12:00:00+08:00"),
        "folderId": "unfiled",
        "pinned": False,
    },
    {
        "id": "ht_note_vendor",
        "title": "Vendor call notes",
        "content": "Meeting code V-4821\nBackup phone 021-5550-8820",
        "updatedAt": _ts("2026-07-10T15:00:00+08:00"),
        "folderId": "call",
        "pinned": False,
    },
    {
        "id": "ht_note_groceries",
        "title": "Office pantry",
        "content": "Fresh milk\nCoffee\nApples",
        "updatedAt": _ts("2026-07-09T18:00:00+08:00"),
        "folderId": "unfiled",
        "pinned": False,
    },
]


NOTES_TODOS = [
    {"id": "ht_todo_minutes", "text": "Organize Atlas review minutes", "completed": False, "updatedAt": _ts("2026-07-11T13:00:00+08:00")},
    {"id": "ht_todo_vendor", "text": "Confirm vendor meeting", "completed": False, "updatedAt": _ts("2026-07-11T13:10:00+08:00")},
    {"id": "ht_todo_archive", "text": "Archive old launch files", "completed": True, "updatedAt": _ts("2026-07-11T13:20:00+08:00")},
]


CLOCK_ALARMS = [
    {"id": "ht_alarm_standup", "hour": 9, "minute": 15, "enabled": True, "repeat": "workday", "note": "Daily standup", "vibrate": True, "autoDelete": False},
    {"id": "ht_alarm_vendor", "hour": 9, "minute": 40, "enabled": False, "repeat": "once", "note": "Vendor prep", "vibrate": True, "autoDelete": False},
    {"id": "ht_alarm_release", "hour": 17, "minute": 30, "enabled": True, "repeat": "once", "note": "Release check", "vibrate": False, "autoDelete": False},
]


def _upsert(items: list[Any], additions: list[dict[str, Any]], key: str) -> list[Any]:
    addition_keys = {str(item[key]) for item in additions}
    kept = [item for item in items if not isinstance(item, dict) or str(item.get(key)) not in addition_keys]
    return kept + copy.deepcopy(additions)


def _calendar(app: dict[str, Any]) -> dict[str, Any]:
    return {"events": _upsert(list(app.get("events") or []), CALENDAR_EVENTS, "id")}


def _wechat(app: dict[str, Any]) -> dict[str, Any]:
    return {
        "contacts": _upsert(list(app.get("contacts") or []), WECHAT_CONTACTS, "wxid"),
        "chats": _upsert(list(app.get("chats") or []), WECHAT_CHATS, "id"),
    }


def _daysmatter(app: dict[str, Any]) -> dict[str, Any]:
    return {"events": _upsert(list(app.get("events") or []), DAYSMATTER_EVENTS, "id")}


def _notes(app: dict[str, Any]) -> dict[str, Any]:
    return {
        "notes": _upsert(list(app.get("notes") or []), NOTES_ITEMS, "id"),
        "todos": _upsert(list(app.get("todos") or []), NOTES_TODOS, "id"),
    }


def _clock(app: dict[str, Any]) -> dict[str, Any]:
    return {"alarms": _upsert(list(app.get("alarms") or []), CLOCK_ALARMS, "id")}


def _clock_next(app: dict[str, Any]) -> dict[str, Any]:
    disabled = [{**item, "enabled": False} for item in list(app.get("alarms") or [])]
    seeded = [
        {**item, "enabled": item["id"] == "ht_alarm_standup"}
        for item in CLOCK_ALARMS
    ]
    return {"alarms": _upsert(disabled, seeded, "id")}


PROFILE_BUILDERS: dict[str, tuple[str, Callable[[dict[str, Any]], dict[str, Any]]]] = {
    "calendar_work": ("calendar", _calendar),
    "wechat_work": ("wechat", _wechat),
    "daysmatter_work": ("daysmatter", _daysmatter),
    "notes_work": ("notes", _notes),
    "clock_work": ("clock", _clock),
    "clock_next": ("clock", _clock_next),
}


async def apply_setup_profiles(env: Any, profiles: tuple[str, ...]) -> None:
    if not profiles:
        return
    state = await env.get_state()
    apps = state.get("apps") or {}
    patch: dict[str, Any] = {}
    for profile in profiles:
        app_id, builder = PROFILE_BUILDERS[profile]
        merged = dict(patch.get(app_id) or apps.get(app_id) or {})
        patch[app_id] = {**merged, **builder({**(apps.get(app_id) or {}), **merged})}
    if patch:
        await env.set_state({"apps": patch}, deep=True, reload=False)
