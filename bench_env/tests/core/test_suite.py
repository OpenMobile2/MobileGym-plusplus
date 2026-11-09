from __future__ import annotations

import copy
import asyncio
import json
from pathlib import Path

from bench_env.env.base import Observation
from bench_env.task.core.setup import (
    CALENDAR_EVENTS,
    CLOCK_ALARMS,
    DAYSMATTER_EVENTS,
    NOTES_ITEMS,
    NOTES_TODOS,
    WECHAT_CHATS,
    WECHAT_CONTACTS,
    apply_setup_profiles,
)
from bench_env.task.core.specs import TASK_SPECS
from bench_env.task.judge import JudgeInput
from bench_env.task.registry import TaskRegistry
from bench_env.hybrid_benchmark.runner import _build_summary, _load_tasks, HybridBenchmarkConfig


ALL_TOOLS = {
    "calendar__search_events", "calendar__open_event", "calendar__open_date",
    "calendar__get_busy_intervals", "calendar__prepare_event_draft",
    "wechat__search_contacts", "wechat__list_recent_chats", "wechat__search_messages",
    "wechat__get_message_context", "wechat__open_contact", "wechat__open_chat",
    "wechat__open_chat_search", "wechat__open_moments", "wechat__send_text_message",
    "wechat__prepare_moment_draft", "tbsg__search_shops", "tbsg__search_items",
    "tbsg__get_shop_menu", "tbsg__open_shop", "tbsg__get_cart", "tbsg__add_item_to_cart",
    "tbsg__open_cart", "tbsg__list_orders", "tbsg__open_order", "tbsg__prepare_checkout",
    "daysmatter__search_events", "daysmatter__list_upcoming_events",
    "daysmatter__get_event_countdown", "daysmatter__list_notebooks",
    "daysmatter__open_event", "daysmatter__open_notebook",
    "daysmatter__calculate_date_difference", "daysmatter__prepare_event_draft",
    "daysmatter__archive_event", "clock__list_alarms", "clock__get_next_alarm",
    "clock__create_alarm", "clock__set_alarm_enabled", "clock__open_alarms",
    "clock__search_world_cities", "clock__get_world_times", "clock__add_world_city",
    "clock__open_timer", "notes__search_notes", "notes__list_recent_notes",
    "notes__open_note", "notes__list_folders", "notes__open_folder", "notes__create_note",
    "notes__search_todos", "notes__create_todo", "notes__set_todo_completed",
    "notes__open_todos",
}


def _base_state():
    return {
        "apps": {
            "calendar": {"events": copy.deepcopy(CALENDAR_EVENTS), "selectedDateTs": 0},
            "wechat": {
                "user": {"wxid": "xiaoming001"},
                "contacts": copy.deepcopy(WECHAT_CONTACTS),
                "chats": copy.deepcopy(WECHAT_CHATS),
                "moments": [],
            },
            "tbsg": {
                "cart": [], "checkoutDraft": None, "chats": {}, "favorites": [],
                "orders": [], "route": "/",
            },
            "daysmatter": {
                "events": copy.deepcopy(DAYSMATTER_EVENTS),
                "filter": {"kind": "home"},
            },
            "clock": {
                "alarms": copy.deepcopy(CLOCK_ALARMS),
                "selectedCityIds": ["london", "newyork"],
            },
            "notes": {
                "notes": copy.deepcopy(NOTES_ITEMS),
                "todos": copy.deepcopy(NOTES_TODOS),
                "selectedFolderId": "all",
            },
        },
        "os": {},
    }


def _find(items, item_id, key="id"):
    return next((item for item in items if str(item.get(key)) == str(item_id)), None)


def _apply_goal(state, goal, index):
    apps = state["apps"]
    v = goal.values
    if goal.kind == "answer":
        alternatives = v.get("alternatives") or [[v.get("expected", "")]]
        first = alternatives[0]
        return " ".join(map(str, first if isinstance(first, list) else [first])), None
    if goal.kind == "route":
        return None, {"app": "clock", "path": v["path"]}
    if goal.kind == "calendar_new_event":
        apps["calendar"]["events"].append({"id": f"new_cal_{index}", "description": " ".join(v.get("description_contains", [])), **{k: val for k, val in v.items() if k != "description_contains"}})
    elif goal.kind == "calendar_event":
        item = _find(apps["calendar"]["events"], v["id"])
        item.update(v["fields"])
        if v.get("description_contains"):
            item["description"] = " ".join(v["description_contains"])
    elif goal.kind == "wechat_sent":
        chat = _find(apps["wechat"]["chats"], v["contact_id"])
        if chat is None:
            chat = {"id": v["contact_id"], "messages": []}
            apps["wechat"]["chats"].append(chat)
        chat["messages"].append({"id": f"new_wx_{index}", "type": "text", "senderId": "xiaoming001", "content": " ".join(v["contains"]), "timestamp": 9999999999999})
    elif goal.kind == "wechat_contact":
        _find(apps["wechat"]["contacts"], v["id"], "wxid").update(v["fields"])
    elif goal.kind == "wechat_chat":
        _find(apps["wechat"]["chats"], v["id"]).update(v["fields"])
    elif goal.kind == "wechat_moment":
        apps["wechat"]["moments"].append({"id": f"new_moment_{index}", "content": " ".join(v["contains"]), "location": v.get("location")})
    elif goal.kind == "tbsg_cart":
        apps["tbsg"]["cart"].append({"id": f"cart_{index}", "itemId": v["item_id"], "qty": v.get("min_qty", 1), "selected": v.get("selected", False), "skuDesc": " / ".join(v.get("sku_contains", []))})
    elif goal.kind == "tbsg_checkout":
        lines = [{"itemId": v["item_id"]}] if v.get("item_id") else []
        apps["tbsg"]["checkoutDraft"] = {"shopGroups": [{"shopId": v.get("shop_id"), "lines": lines}], **v.get("fields", {})}
        for key in v.get("non_null", []):
            apps["tbsg"]["checkoutDraft"][key] = "set"
    elif goal.kind == "tbsg_chat":
        apps["tbsg"]["chats"].setdefault(v["chat_key"], []).append({"id": f"chat_{index}", "from": "me", "text": " ".join(v["contains"])})
    elif goal.kind == "tbsg_favorite":
        apps["tbsg"]["favorites"].append(v["shop_id"])
    elif goal.kind == "tbsg_orders_unchanged":
        pass
    elif goal.kind == "days_event":
        if "id" in v:
            _find(apps["daysmatter"]["events"], v["id"]).update(v.get("fields", {}))
        else:
            apps["daysmatter"]["events"].append({"id": f"new_dm_{index}", "title": v["title"], **v.get("fields", {})})
    elif goal.kind == "clock_alarm":
        if "id" in v:
            item = _find(apps["clock"]["alarms"], v["id"])
            item.update({k: val for k, val in v.items() if k != "id"})
        else:
            apps["clock"]["alarms"].append({"id": f"new_alarm_{index}", **v})
    elif goal.kind == "clock_alarm_absent":
        apps["clock"]["alarms"] = [item for item in apps["clock"]["alarms"] if item["id"] != v["id"]]
    elif goal.kind == "clock_city":
        selected = apps["clock"]["selectedCityIds"]
        if v.get("selected", True) and v["city_id"] not in selected:
            selected.append(v["city_id"])
        if not v.get("selected", True):
            apps["clock"]["selectedCityIds"] = [item for item in selected if item != v["city_id"]]
    elif goal.kind == "notes_note":
        if "id" in v:
            item = _find(apps["notes"]["notes"], v["id"])
            item.update(v.get("fields", {}))
            item["content"] = item.get("content", "") + "\n" + " ".join(v.get("contains", []))
        else:
            apps["notes"]["notes"].append({"id": f"new_note_{index}", "title": v["title"], "content": " ".join(v.get("contains", [])), **v.get("fields", {})})
    elif goal.kind == "notes_todo":
        if "id" in v:
            _find(apps["notes"]["todos"], v["id"]).update(v.get("fields", {}))
        else:
            apps["notes"]["todos"].append({"id": f"new_todo_{index}", "text": v["text"], **v.get("fields", {})})
    else:
        raise AssertionError(goal.kind)
    return None, None


def _judge_input(spec, positive):
    initial = _base_state()
    final = copy.deepcopy(initial)
    answer = None
    route = {"path": "/"}
    if positive:
        for index, item in enumerate(spec.goals):
            new_answer, new_route = _apply_goal(final, item, index)
            answer = new_answer if new_answer is not None else answer
            route = new_route if new_route is not None else route
    init_obs = Observation(state=initial, route={"path": "/"})
    last_obs = Observation(state=final, route=route)
    return JudgeInput(init_obs=init_obs, last_obs=last_obs, answer=answer)


def test_suite_has_90_fixed_tasks_and_full_tool_coverage():
    assert len(TASK_SPECS) == 90
    assert len({spec.task_id for spec in TASK_SPECS}) == 90
    assert len({spec.class_name for spec in TASK_SPECS}) == 90
    assert {tool for spec in TASK_SPECS for tool in spec.candidate_tools} == ALL_TOOLS
    assert sum(spec.gui_required for spec in TASK_SPECS) >= 45
    assert sum(spec.task_id.startswith("cross_") for spec in TASK_SPECS) == 18


def test_registry_materializes_every_fixed_task():
    names = TaskRegistry().list_tasks("core")
    assert len(names) == 90
    assert set(names) == {spec.class_name for spec in TASK_SPECS}


def test_every_verifier_accepts_positive_and_rejects_unchanged_state():
    registry = TaskRegistry()
    for spec in TASK_SPECS:
        task = registry.create_task(f"core.{spec.class_name}")
        positive = task.evaluate(_judge_input(spec, positive=True))
        assert positive.success, f"positive verifier failed for {spec.task_id}: {positive.issues}"
        negative = task.evaluate(_judge_input(spec, positive=False))
        assert not negative.success, f"unchanged state passed for {spec.task_id}"


def test_fixed_tasks_do_not_sample_or_change_instruction():
    registry = TaskRegistry()
    for spec in TASK_SPECS:
        task = registry.create_task(f"core.{spec.class_name}")
        assert task.sampler is None
        assert task.description == spec.instruction
        assert task.params == {}


def test_single_app_tasks_name_their_target_app():
    markers = {
        "calendar": ("calendar",),
        "wechat": ("wechat",),
        "tbsg": ("淘宝闪购", "taobao instant"),
        "daysmatter": ("days matter",),
        "clock": ("clock", "alarm", "timer", "world clock"),
        "notes": ("note", "to-do", "todo"),
    }
    for spec in TASK_SPECS:
        if len(spec.apps) != 1:
            continue
        instruction = spec.instruction.casefold()
        assert any(marker in instruction for marker in markers[spec.apps[0]]), spec.task_id


def test_expected_changes_cover_known_business_side_effects():
    navigation_tools = {
        "tbsg__open_shop", "tbsg__open_cart", "tbsg__open_order",
        "tbsg__prepare_checkout",
    }
    for spec in TASK_SPECS:
        changes = set(spec.expected_changes)
        tools = set(spec.candidate_tools)
        if "notes__set_todo_completed" in tools:
            assert "apps.notes.todos._relative_order" in changes, spec.task_id
        if any(goal.kind == "notes_note" and "id" in goal.values for goal in spec.goals):
            assert "apps.notes.notes._relative_order" in changes, spec.task_id
        if "tbsg__add_item_to_cart" in tools:
            assert "apps.tbsg.recentShops" in changes, spec.task_id
        if navigation_tools & tools:
            assert "apps.tbsg.route" in changes, spec.task_id
        if "tbsg__open_shop" in tools:
            assert "apps.tbsg.recentShops" in changes, spec.task_id


def test_benchmark_loader_and_sr_summary(tmp_path):
    config = HybridBenchmarkConfig(
        env_url="http://example.invalid",
        model_base_url="http://example.invalid/v1",
        model_name="test",
        limit=3,
        output_dir=tmp_path,
    )
    tasks = _load_tasks(config)
    assert len(tasks) == 3
    summary = _build_summary([
        {"success": True, "clean": True, "error": None, "stop_reason": "COMPLETE", "app_tool_calls": ["notes__create_note"]},
        {"success": False, "clean": True, "error": None, "stop_reason": "MAX_STEPS", "app_tool_calls": []},
    ])
    assert summary["sr"] == 0.5
    assert summary["successful"] == 1
    assert summary["distinct_app_tools_used"] == 1


def test_setup_profiles_merge_required_seed_data():
    class FakeEnv:
        def __init__(self):
            self.state = _base_state()

        async def get_state(self):
            return copy.deepcopy(self.state)

        async def set_state(self, patch, *, deep, reload):
            assert deep is True and reload is False
            for app, values in patch["apps"].items():
                self.state["apps"].setdefault(app, {}).update(copy.deepcopy(values))

    env = FakeEnv()
    asyncio.run(apply_setup_profiles(
        env,
        ("calendar_work", "wechat_work", "daysmatter_work", "clock_next", "notes_work"),
    ))
    apps = env.state["apps"]
    assert _find(apps["calendar"]["events"], "ht_cal_review")
    assert _find(apps["wechat"]["contacts"], "ht_alice", "wxid")
    assert _find(apps["daysmatter"]["events"], "ht_dm_contract")
    assert _find(apps["notes"]["notes"], "ht_note_release")
    enabled = [item for item in apps["clock"]["alarms"] if item["enabled"]]
    assert [item["id"] for item in enabled] == ["ht_alarm_standup"]


def test_specs_reference_existing_apps_and_catalog_ids():
    root = Path(__file__).resolve().parents[3]
    tbsg = json.loads((root / "apps/TaobaoShangou/data/defaults.json").read_text())
    taobao = json.loads((root / "apps/Taobao/data/defaults.json").read_text())
    item_ids = {item["id"] for item in tbsg["items"]}
    shop_ids = {item["id"] for item in tbsg["shops"]}
    order_ids = {item["id"] for item in tbsg["orders"]}
    city_ids = {
        item["id"]
        for item in json.loads((root / "system/Clock/data/cities.json").read_text())
    }
    taobao_items = {item["id"]: item for item in taobao["items"]}
    assert taobao_items["i_cable"]["price"] == 19.9
    assert taobao_items["i_handcream"]["price"] == 128
    goal_apps = {
        "calendar_new_event": "calendar", "calendar_event": "calendar",
        "wechat_sent": "wechat", "wechat_contact": "wechat", "wechat_chat": "wechat",
        "wechat_moment": "wechat", "tbsg_cart": "tbsg", "tbsg_checkout": "tbsg",
        "tbsg_chat": "tbsg", "tbsg_favorite": "tbsg", "tbsg_orders_unchanged": "tbsg",
        "days_event": "daysmatter", "clock_alarm": "clock", "clock_alarm_absent": "clock",
        "clock_city": "clock", "notes_note": "notes", "notes_todo": "notes",
    }
    assert len({spec.instruction for spec in TASK_SPECS}) == 90
    for spec in TASK_SPECS:
        for item in spec.goals:
            app = goal_apps.get(item.kind)
            assert app is None or app in spec.apps, (spec.task_id, item.kind, spec.apps)
            values = item.values
            if values.get("item_id"):
                assert values["item_id"] in item_ids
            if values.get("shop_id"):
                assert values["shop_id"] in shop_ids
            if item.kind == "clock_city":
                assert values["city_id"] in city_ids
        for order_id in ("o1001", "o1002", "o1005"):
            if order_id in spec.instruction:
                assert order_id in order_ids
