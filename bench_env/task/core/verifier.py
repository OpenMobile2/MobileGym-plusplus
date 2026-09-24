"""State-only semantic verifiers shared by the fixed hybrid task records."""

from __future__ import annotations

from datetime import datetime
import re
from typing import Any

from bench_env.task.judge import JudgeInput
from bench_env.task.core.model import GoalSpec


def _norm(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip().casefold()


def _contains_all(value: Any, tokens: list[Any]) -> bool:
    text = _norm(value)
    return all(_norm(token) in text for token in tokens)


def _items(apps: dict[str, Any], app: str, field: str) -> list[dict[str, Any]]:
    value = (apps.get(app) or {}).get(field) or []
    return [item for item in value if isinstance(item, dict)]


def _by_id(items: list[dict[str, Any]], item_id: str, keys: tuple[str, ...] = ("id",)) -> dict[str, Any] | None:
    for item in items:
        if any(str(item.get(key) or "") == item_id for key in keys):
            return item
    return None


def _new_items(input: JudgeInput, app: str, field: str, keys: tuple[str, ...] = ("id",)) -> list[dict[str, Any]]:
    initial = _items(input.apps_init, app, field)
    ids = {str(item.get(key) or "") for item in initial for key in keys if item.get(key) is not None}
    return [item for item in _items(input.apps, app, field) if not any(str(item.get(key) or "") in ids for key in keys)]


def _fields_match(item: dict[str, Any] | None, fields: dict[str, Any]) -> bool:
    if item is None:
        return False
    return all(item.get(key) == value for key, value in fields.items())


def _check(goal: GoalSpec, input: JudgeInput) -> tuple[Any, Any, bool]:
    v = goal.values
    kind = goal.kind
    if kind == "answer":
        actual = input.answer or ""
        alternatives = v.get("alternatives") or [v.get("expected", "")]
        if v.get("exact"):
            passed = any(_norm(actual) == _norm(tokens) for tokens in alternatives)
        else:
            passed = any(_contains_all(actual, list(tokens) if isinstance(tokens, list) else [tokens]) for tokens in alternatives)
        return alternatives, actual, passed

    if kind == "route":
        actual = str(input.route.get("path") or "")
        expected = str(v["path"])
        return expected, actual, actual == expected

    if kind == "calendar_new_event":
        candidates = [item for item in _new_items(input, "calendar", "events") if _norm(item.get("title")) == _norm(v["title"])]
        item = candidates[-1] if candidates else None
        fields = {key: v[key] for key in ("startTs", "endTs", "reminderMinutesBefore", "alarmEnabled", "allDay") if key in v}
        passed = _fields_match(item, fields) and _contains_all((item or {}).get("description"), v.get("description_contains", []))
        return {"title": v["title"], **fields}, item, passed

    if kind == "calendar_event":
        item = _by_id(_items(input.apps, "calendar", "events"), v["id"])
        fields = dict(v.get("fields") or {})
        description_contains = list(v.get("description_contains") or [])
        passed = _fields_match(item, fields) and _contains_all(
            (item or {}).get("description"), description_contains
        )
        return {**fields, "description_contains": description_contains}, item, passed

    if kind == "wechat_sent":
        chat = _by_id(_items(input.apps, "wechat", "chats"), v["contact_id"])
        me = str((input.apps.get("wechat") or {}).get("user", {}).get("wxid") or "")
        initial_chat = _by_id(_items(input.apps_init, "wechat", "chats"), v["contact_id"])
        initial_ids = {str(m.get("id")) for m in (initial_chat or {}).get("messages", []) if isinstance(m, dict)}
        outgoing = [m for m in (chat or {}).get("messages", []) if isinstance(m, dict) and str(m.get("senderId")) == me and str(m.get("id")) not in initial_ids]
        actual = [m.get("content") for m in outgoing]
        passed = any(_contains_all(text, v["contains"]) for text in actual)
        return v["contains"], actual, passed

    if kind == "wechat_contact":
        item = _by_id(_items(input.apps, "wechat", "contacts"), v["id"], ("wxid",))
        fields = dict(v["fields"])
        return fields, item, _fields_match(item, fields)

    if kind == "wechat_chat":
        item = _by_id(_items(input.apps, "wechat", "chats"), v["id"])
        fields = dict(v["fields"])
        return fields, item, _fields_match(item, fields)

    if kind == "wechat_moment":
        initial_ids = {str(item.get("id")) for item in _items(input.apps_init, "wechat", "moments")}
        candidates = [item for item in _items(input.apps, "wechat", "moments") if str(item.get("id")) not in initial_ids]
        item = next((item for item in candidates if _contains_all(item.get("content"), v["contains"])), None)
        passed = item is not None and ("location" not in v or _norm(item.get("location")) == _norm(v["location"]))
        if v.get("no_images"):
            passed = passed and not list((item or {}).get("images") or [])
        return v, item, passed

    if kind == "tbsg_cart":
        lines = [item for item in _items(input.apps, "tbsg", "cart") if str(item.get("itemId")) == v["item_id"]]
        actual_qty = sum(int(item.get("qty") or 0) for item in lines)
        selected_ok = "selected" not in v or any(bool(item.get("selected")) == bool(v["selected"]) for item in lines)
        sku_ok = "sku_contains" not in v or any(_contains_all(item.get("skuDesc"), v["sku_contains"]) for item in lines)
        return v, lines, actual_qty >= int(v.get("min_qty", 1)) and selected_ok and sku_ok

    if kind == "tbsg_checkout":
        draft = (input.apps.get("tbsg") or {}).get("checkoutDraft")
        groups = (draft or {}).get("shopGroups") or []
        shop_ok = not v.get("shop_id") or any(str(group.get("shopId")) == v["shop_id"] for group in groups if isinstance(group, dict))
        lines = [line for group in groups if isinstance(group, dict) for line in (group.get("lines") or []) if isinstance(line, dict)]
        item_ok = not v.get("item_id") or any(str(line.get("itemId")) == v["item_id"] for line in lines)
        fields = dict(v.get("fields") or {})
        non_null = list(v.get("non_null") or [])
        non_null_ok = bool(draft) and all((draft or {}).get(key) not in (None, "") for key in non_null)
        return {"shop_id": v.get("shop_id"), "item_id": v.get("item_id"), **fields, "non_null": non_null}, draft, bool(draft) and shop_ok and item_ok and _fields_match(draft, fields) and non_null_ok

    if kind == "tbsg_chat":
        messages = ((input.apps.get("tbsg") or {}).get("chats") or {}).get(v["chat_key"], [])
        initial = ((input.apps_init.get("tbsg") or {}).get("chats") or {}).get(v["chat_key"], [])
        initial_ids = {str(item.get("id")) for item in initial if isinstance(item, dict)}
        outgoing = [item for item in messages if isinstance(item, dict) and item.get("from") == "me" and str(item.get("id")) not in initial_ids]
        actual = [item.get("text") for item in outgoing]
        return v["contains"], actual, any(_contains_all(text, v["contains"]) for text in actual)

    if kind == "tbsg_favorite":
        actual = list((input.apps.get("tbsg") or {}).get("favorites") or [])
        return v["shop_id"], actual, v["shop_id"] in actual

    if kind == "tbsg_orders_unchanged":
        initial = _items(input.apps_init, "tbsg", "orders")
        actual = _items(input.apps, "tbsg", "orders")
        initial_ids = {str(item.get("id")) for item in initial}
        actual_ids = {str(item.get("id")) for item in actual}
        return sorted(initial_ids), sorted(actual_ids), actual_ids == initial_ids

    if kind == "days_event":
        if "id" in v:
            item = _by_id(_items(input.apps, "daysmatter", "events"), v["id"])
        else:
            item = next((row for row in _new_items(input, "daysmatter", "events") if _norm(row.get("title")) == _norm(v["title"])), None)
        fields = dict(v.get("fields") or {})
        return {"id": v.get("id"), "title": v.get("title"), **fields}, item, _fields_match(item, fields)

    if kind == "clock_alarm":
        candidates = _items(input.apps, "clock", "alarms")
        if "id" in v:
            item = _by_id(candidates, v["id"])
        else:
            initial_ids = {str(item.get("id")) for item in _items(input.apps_init, "clock", "alarms")}
            item = next((row for row in candidates if str(row.get("id")) not in initial_ids and row.get("hour") == v["hour"] and row.get("minute") == v["minute"]), None)
        fields = {key: v[key] for key in ("hour", "minute", "enabled", "repeat", "note", "vibrate", "autoDelete") if key in v}
        return fields, item, _fields_match(item, fields)

    if kind == "clock_alarm_absent":
        item = _by_id(_items(input.apps, "clock", "alarms"), v["id"])
        return "absent", item, item is None

    if kind == "clock_city":
        actual = list((input.apps.get("clock") or {}).get("selectedCityIds") or [])
        expected = bool(v.get("selected", True))
        return {"city_id": v["city_id"], "selected": expected}, actual, (v["city_id"] in actual) == expected

    if kind == "notes_note":
        if "id" in v:
            item = _by_id(_items(input.apps, "notes", "notes"), v["id"])
        else:
            item = next((row for row in _new_items(input, "notes", "notes") if _norm(row.get("title")) == _norm(v["title"])), None)
        fields = dict(v.get("fields") or {})
        passed = _fields_match(item, fields) and _contains_all(f"{(item or {}).get('title', '')}\n{(item or {}).get('content', '')}", v.get("contains", []))
        return v, item, passed

    if kind == "notes_todo":
        if "id" in v:
            item = _by_id(_items(input.apps, "notes", "todos"), v["id"])
        else:
            item = next((row for row in _new_items(input, "notes", "todos") if _norm(row.get("text")) == _norm(v["text"])), None)
        fields = dict(v.get("fields") or {})
        return {"text": v.get("text"), **fields}, item, _fields_match(item, fields)

    raise ValueError(f"Unknown hybrid goal kind: {kind}")


def evaluate_goals(goals: tuple[GoalSpec, ...], input: JudgeInput) -> list[dict[str, Any]]:
    checks = []
    for index, item in enumerate(goals, start=1):
        expected, actual, passed = _check(item, input)
        checks.append({
            "field": f"{item.kind}[{index}]",
            "expected": expected,
            "actual": actual,
            "passed": bool(passed),
        })
    return checks
