"""More true-cross: unused atoms + multi-app gather, especially social."""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

from bench_env.task.compose.defs.specs_compose import _note_contains
from bench_env.task.flow.defs.specs_flow import _kapi_expense, _new_rows
from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

_CST = timezone(timedelta(hours=8))
_INTERVIEW_START = int(datetime(2026, 7, 18, 10, 0, tzinfo=_CST).timestamp() * 1000)


def _boss_interview_cal():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        interviews = list((input.apps.get("boss") or {}).get("interviews") or [])
        hit_iv = any(
            row.get("type") == "offline"
            and "18" in str(row.get("date") or "")
            and "10:00" in str(row.get("time") or "")
            for row in interviews
        )
        events = _new_rows(input, "calendar", "events")
        hit_cal = any(
            "线下面试" in str(ev.get("title") or "")
            and ev.get("startTs") == _INTERVIEW_START
            for ev in events
        )
        return [{
            "field": "boss_interview_calendar",
            "expected": {"interview": "7月18日 10:00 offline", "title": "线下面试"},
            "actual": {"interviews": interviews, "events": events},
            "passed": hit_iv and hit_cal,
        }]
    return _check


def _typhoon_weather_note():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        wx = input.apps.get("weather") or {}
        bundle = ((wx.get("bundlesByCityId") or {}).get("beijing") or {}).get("bundle") or {}
        dailies = list(bundle.get("daily") or [])
        tomorrow = dailies[1] if len(dailies) > 1 else {}
        weather_token = str(tomorrow.get("textDay") or tomorrow.get("text") or "").strip()
        notes = _new_rows(input, "notes", "notes")
        item = next((n for n in notes if str(n.get("title") or "") == "台风注意"), None)
        text = f"{(item or {}).get('title') or ''}\n{(item or {}).get('content') or ''}"
        wx_ok = bool(weather_token) and weather_token in text
        return [{
            "field": "typhoon_weather_note",
            "expected": {"title": "台风注意", "contains": ["巴威", "北京", weather_token or "天气词"]},
            "actual": {"note": item, "weather_token": weather_token, "lastAccess": wx.get("lastAccess")},
            "passed": item is not None and "巴威" in text and "北京" in text and wx_ok,
        }]
    return _check


SPECS = [
    spec(
        "compose_nimbus_kapi",
        "我想打开 Nimbus 付款失败那封邮件，看清失败金额，再到卡皮总账本按同一金额记一笔支出并保存，备注写上 Nimbus。",
        ["mail", "kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "compose", "finance"),
        max_steps=45,
    ),
    spec(
        "compose_boss_cal",
        "我想在 BOSS 手动记一条与阚云舟的线下面试：日期选本周六，时间选上午 10:00。再按这个时间在日历新建「线下面试」，说明里写上对方名字。",
        ["boss", "calendar"],
        [goal("calendar_new_event", title="线下面试", startTs=_INTERVIEW_START, allDay=False)],
        ["apps.boss.interviews", "apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "compose", "work"),
        max_steps=50,
    ),
    spec(
        "gather_nimbus_balance",
        "我想打开 Nimbus 付款失败邮件看清金额，再看支付宝现在余额还有多少，写进系统笔记 App「付款够不够」，这两个数都要有。",
        ["mail", "alipay", "notes"],
        [goal("notes_note", title="付款够不够", contains=["200", "100023"])],
        ["apps.notes.notes"],
        ["alipay__get_balance_summary", "notes__create_note"],
        tags=("bench", "gather", "finance"),
        max_steps=45,
    ),
    spec(
        "gather_hotpot",
        "我想在微博找到那条安利火锅、说毛肚绝了的探店，再在点评确认王和李·海鲜火锅大排档这家店，然后把微博里的那句安利和店名写进系统笔记 App「火锅安利」。",
        ["weibo", "dianping", "notes"],
        [goal("notes_note", title="火锅安利", contains=["毛肚", "王和李"])],
        ["apps.notes.notes"],
        ["notes__create_note"],
        tags=("bench", "gather", "social"),
        max_steps=50,
    ),
    spec(
        "gather_typhoon",
        "我想在微博看台风巴威的预警说的是哪里，再打开天气 App 看北京明天白天是什么天气，写进系统笔记 App「台风注意」，预警里的台风名字、北京和明天的天气都要有。",
        ["weibo", "weather", "notes"],
        [goal("notes_note", title="台风注意")],
        ["apps.notes.notes"],
        ["weather__get_daily_forecast", "notes__create_note"],
        tags=("bench", "gather", "social"),
        max_steps=50,
    ),
    spec(
        "gather_shhz",
        "我想在 12306 确认乘车人里有没有王思雨，再在携程查上海到杭州能订的车次，把她的名字和其中一趟车次号写进系统笔记 App「沪杭同行」。",
        ["railway12306", "ctrip", "notes"],
        [goal("notes_note", title="沪杭同行", contains=["王思雨"])],
        ["apps.notes.notes"],
        ["ctrip__search_trains", "notes__create_note"],
        tags=("bench", "gather", "travel"),
        max_steps=50,
    ),
    spec(
        "gather_vivo_balance",
        "我想在京东打开 vivo X300 看现在标价多少，再看支付宝余额还剩多少，写进系统笔记 App「国补手机」，标价和余额都要有。",
        ["jingdong", "alipay", "notes"],
        [goal("notes_note", title="国补手机", contains=["4099", "100023"])],
        ["apps.notes.notes"],
        ["alipay__get_balance_summary", "notes__create_note"],
        tags=("bench", "gather", "shopping"),
        max_steps=45,
    ),
    spec(
        "gather_hotel_balance",
        "我想在携程打开杭州西湖湖滨中山北路云栖酒店看房价，再看支付宝余额还剩多少，写进系统笔记 App「杭州住一晚」，房价和余额都要有。",
        ["ctrip", "alipay", "notes"],
        [goal("notes_note", title="杭州住一晚", contains=["412", "100023"])],
        ["apps.notes.notes"],
        ["ctrip__open_hotel", "alipay__get_balance_summary", "notes__create_note"],
        tags=("bench", "gather", "travel"),
        max_steps=45,
    ),
    spec(
        "gather_friday_pay",
        "我想在 Slack 的 education 频道看清陈昊说的上线改到哪天，再打开 Nimbus 付款失败邮件看清金额，写进系统笔记 App「周五前付款」，改期那天和金额都要有。",
        ["slack", "mail", "notes"],
        [goal("notes_note", title="周五前付款", contains=["200"])],
        ["apps.notes.notes"],
        ["notes__create_note"],
        tags=("bench", "gather", "work"),
        max_steps=45,
    ),
    spec(
        "gather_orange_movie",
        "我想在瑞幸看橙 C 美式现在卖多少钱，再在猫眼看功夫女足任意一场的开场时间，写进系统笔记 App「下午安排」，价格、电影名和这场开场时间都要有。",
        ["luckin", "maoyan", "notes"],
        [goal("notes_note", title="下午安排", contains=["12.9", "功夫女足"])],
        ["apps.notes.notes"],
        ["notes__create_note"],
        tags=("bench", "gather", "local"),
        max_steps=50,
    ),
    spec(
        "gather_xianyu_balance",
        "我想在闲鱼打开 iPhone 14 Pro 那条看看现在标价多少，再看支付宝余额还剩多少，写进系统笔记 App「二手手机」，标价和余额都要有。",
        ["xianyu", "alipay", "notes"],
        [goal("notes_note", title="二手手机", contains=["4299", "100023"])],
        ["apps.notes.notes"],
        ["alipay__get_balance_summary", "notes__create_note"],
        tags=("bench", "gather", "shopping"),
        max_steps=45,
    ),
    spec(
        "gather_didi_pickup",
        "我想在滴滴看从云溪苑东北门出发时的上车点名字，再在菜鸟看即食鸡胸肉卷的取件码和驿站，写进系统笔记 App「出门顺路」，上车点和取件码都要有。",
        ["didi", "cainiao", "notes"],
        [goal("notes_note", title="出门顺路", contains=["云溪苑", "583920"])],
        ["apps.notes.notes"],
        ["notes__create_note"],
        tags=("bench", "gather", "local"),
        max_steps=45,
    ),
    spec(
        "gather_listen_read",
        "我想在播客里找到标题带 MiniMax 的那一集，再看微信读书热搜第 1 名，写进系统笔记 App「周末听读」，节目关键词和书名都要有。",
        ["broadcast", "wechat_reading", "notes"],
        [goal("notes_note", title="周末听读", contains=["MiniMax", "亏成首富"])],
        ["apps.notes.notes"],
        ["notes__create_note"],
        tags=("bench", "gather", "media"),
        max_steps=50,
    ),
    spec(
        "compose_pickup_cal",
        "我想在菜鸟打开即食鸡胸肉卷这个待取包裹，看清取件码和驿站，再在日历今天新建「驿站取件」，说明里写上取件码和驿站。",
        ["cainiao", "calendar"],
        [goal("calendar_new_event", title="驿站取件")],
        ["apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "compose", "local"),
        max_steps=40,
    ),
]

EXTRA_CHECKS = {
    "compose_nimbus_kapi": lambda input: _kapi_expense(200.0)(input) + [{
        "field": "kapi_note_nimbus",
        "expected": "Nimbus",
        "actual": [row.get("note") for row in _new_rows(input, "kapi", "bills")],
        "passed": any("nimbus" in str(row.get("note") or "").lower() for row in _new_rows(input, "kapi", "bills")),
    }],
    "compose_boss_cal": _boss_interview_cal(),
    "gather_nimbus_balance": _note_contains("付款够不够", ["200", "100023"]),
    "gather_hotpot": _note_contains("火锅安利", ["毛肚", "王和李"]),
    "gather_typhoon": _typhoon_weather_note(),
    "gather_shhz": lambda input: (
        _note_contains("沪杭同行", ["王思雨"])(input)
        + [{
            "field": "shhz_train_no",
            "expected": sorted({
                str(row.get("trainNo") or "")
                for row in ((input.apps.get("ctrip") or {}).get("trains") or [])
                if "上海" in str(row.get("from") or "") and "杭州" in str(row.get("to") or "") and str(row.get("trainNo") or "")
            }),
            "actual": next((n for n in _new_rows(input, "notes", "notes") if str(n.get("title") or "") == "沪杭同行"), None),
            "passed": any(
                train_no in f"{n.get('title') or ''} {n.get('content') or ''}"
                for n in _new_rows(input, "notes", "notes")
                if str(n.get("title") or "") == "沪杭同行"
                for train_no in (
                    str(row.get("trainNo") or "")
                    for row in ((input.apps.get("ctrip") or {}).get("trains") or [])
                    if "上海" in str(row.get("from") or "") and "杭州" in str(row.get("to") or "")
                )
                if train_no
            ),
        }]
    ),
    "gather_vivo_balance": _note_contains("国补手机", ["4099", "100023"]),
    "gather_hotel_balance": _note_contains("杭州住一晚", ["412", "100023"]),
    "gather_friday_pay": lambda input: (
        _note_contains("周五前付款", ["200"])(input)
        + [{
            "field": "friday_in_content",
            "expected": "content contains 周五",
            "actual": next((n for n in _new_rows(input, "notes", "notes") if str(n.get("title") or "") == "周五前付款"), None),
            "passed": any(
                "周五" in str(n.get("content") or "")
                for n in _new_rows(input, "notes", "notes")
                if str(n.get("title") or "") == "周五前付款"
            ),
        }]
    ),
    "gather_orange_movie": lambda input: (
        _note_contains("下午安排", ["12.9", "功夫女足"])(input)
        + [{
            "field": "orange_movie_session",
            "expected": "a m_kungfu session start",
            "actual": next((n for n in _new_rows(input, "notes", "notes") if str(n.get("title") or "") == "下午安排"), None),
            "passed": any(
                str(row.get("start") or "")
                and str(row.get("start") or "") in f"{n.get('title') or ''} {n.get('content') or ''}"
                for n in _new_rows(input, "notes", "notes")
                if str(n.get("title") or "") == "下午安排"
                for row in ((input.apps.get("maoyan") or {}).get("sessions") or [])
                if row.get("movieId") == "m_kungfu"
            ),
        }]
    ),
    "gather_xianyu_balance": _note_contains("二手手机", ["4299", "100023"]),
    "gather_didi_pickup": _note_contains("出门顺路", ["云溪苑", "583920", "阳光苑"]),
    "gather_listen_read": _note_contains("周末听读", ["MiniMax", "亏成首富"]),
    "compose_pickup_cal": lambda input: [{
        "field": "pickup_calendar",
        "expected": {"title": "驿站取件", "code": "583920", "station": "阳光苑"},
        "actual": _new_rows(input, "calendar", "events"),
        "passed": any(
            "驿站取件" in str(ev.get("title") or "")
            and "583920" in f"{ev.get('title') or ''} {ev.get('description') or ''}"
            and "阳光苑" in f"{ev.get('title') or ''} {ev.get('description') or ''}"
            for ev in _new_rows(input, "calendar", "events")
        ),
    }],
}

build_task_classes(
    SPECS,
    EXTRA_CHECKS,
    module_globals=globals(),
    module_name=__name__,
)
