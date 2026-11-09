"""True-flow cross-app tasks: App A fact must land in App B's business state."""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

_CST = timezone(timedelta(hours=8))
_MEET_START = int(datetime(2026, 7, 15, 14, 0, tzinfo=_CST).timestamp() * 1000)
_LAUNCH_START = int(datetime(2026, 7, 17, 15, 0, tzinfo=_CST).timestamp() * 1000)


def _new_rows(input: JudgeInput, app: str, field: str) -> list[dict[str, Any]]:
    init_ids = {
        str(row.get("id"))
        for row in ((input.apps_init.get(app) or {}).get(field) or [])
        if isinstance(row, dict)
    }
    return [
        row
        for row in ((input.apps.get(app) or {}).get(field) or [])
        if isinstance(row, dict) and str(row.get("id")) not in init_ids
    ]


def _kapi_expense(amount: float | None, *, category: str | None = None, tolerance: float = 0.51):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        matches = []
        for row in _new_rows(input, "kapi", "bills"):
            if row.get("type") != "expense" or row.get("ledgerId") != "l_main":
                continue
            if category and row.get("categoryName") != category:
                continue
            paid = float(row.get("amount") or 0)
            if amount is not None and abs(paid - amount) > tolerance:
                continue
            matches.append(row)
        return [{
            "field": "kapi_expense",
            "expected": {
                "ledger": "l_main",
                "type": "expense",
                "amount": amount,
                "category": category,
            },
            "actual": [
                {
                    "id": row.get("id"),
                    "amount": row.get("amount"),
                    "categoryName": row.get("categoryName"),
                    "ledgerId": row.get("ledgerId"),
                    "note": row.get("note"),
                }
                for row in _new_rows(input, "kapi", "bills")
            ],
            "passed": bool(matches),
        }]
    return _check


def _kapi_matches_source(amount_fn, *, category: str | None = None, tolerance: float = 0.51):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        amount = amount_fn(input)
        if amount is None:
            return [{
                "field": "kapi_from_source",
                "expected": "source amount exists",
                "actual": None,
                "passed": False,
            }]
        return _kapi_expense(float(amount), category=category, tolerance=tolerance)(input)
    return _check


def _alipay_new_transfer(counterparty: str, amount: float):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        matches = []
        for row in _new_rows(input, "alipay", "transferRecords"):
            title = f"{row.get('displayTitle') or ''} {row.get('counterpartyName') or ''} {row.get('targetAccount') or ''}"
            if counterparty not in title:
                continue
            if abs(abs(float(row.get("delta") or 0)) - amount) > 0.05:
                continue
            if float(row.get("delta") or 0) >= 0:
                continue
            matches.append(row)
        return [{
            "field": "alipay_transfer",
            "expected": {"to": counterparty, "amount": amount},
            "actual": [
                {
                    "id": row.get("id"),
                    "delta": row.get("delta"),
                    "displayTitle": row.get("displayTitle"),
                    "counterpartyName": row.get("counterpartyName"),
                }
                for row in _new_rows(input, "alipay", "transferRecords")
            ],
            "passed": bool(matches),
        }]
    return _check


def _jd_paid_amount(item_token: str, *, existing_id: str | None = None):
    def _amount(input: JudgeInput) -> float | None:
        orders = list((input.apps.get("jingdong") or {}).get("orders") or [])
        init = {str(row.get("id")) for row in ((input.apps_init.get("jingdong") or {}).get("orders") or [])}
        if existing_id:
            row = next((o for o in orders if str(o.get("id")) == existing_id), None)
            if not row or row.get("status") == "unpaid":
                return None
            paid = float(row.get("paidAmount") or 0)
            return paid if paid > 0.01 else None
        for row in orders:
            if str(row.get("id")) in init:
                continue
            blob = " ".join(
                str(part)
                for part in [row.get("shopName"), *(line.get("title") or "" for line in (row.get("lines") or []))]
            )
            if item_token not in blob:
                continue
            if row.get("status") == "unpaid":
                continue
            paid = float(row.get("paidAmount") or 0)
            return paid if paid > 0.01 else None
        return None
    return _amount


def _jd_paid(item_token: str, *, existing_id: str | None = None):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        amount = _jd_paid_amount(item_token, existing_id=existing_id)(input)
        return [{
            "field": "jingdong_paid",
            "expected": {"item": item_token, "paid": True},
            "actual": amount,
            "passed": amount is not None,
        }]
    return _check


def _ctrip_train_to_calendar():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        draft = dict(((input.apps.get("ctrip") or {}).get("taskAudit") or {}).get("trainBookingDraft") or {})
        trains = list((input.apps.get("ctrip") or {}).get("trains") or [])
        train = next((row for row in trains if str(row.get("id")) == str(draft.get("trainId") or "")), None)
        if train is None:
            train = next((row for row in trains if str(row.get("trainNo")) == str(draft.get("trainNo") or "")), None)
        train = train if isinstance(train, dict) else {}
        train_no = str(draft.get("trainNo") or train.get("trainNo") or "")
        dest = str(draft.get("to") or train.get("to") or "")
        origin = str(draft.get("from") or train.get("from") or "")
        events = _new_rows(input, "calendar", "events")
        titled = [
            ev for ev in events
            if "杭州出发" in str(ev.get("title") or "")
        ]
        if not train_no:
            for ev in titled:
                found = re.findall(r"[GDC]\d{3,5}", f"{ev.get('title') or ''} {ev.get('description') or ''}")
                if found:
                    train_no = found[0]
                    break
        hit = [
            ev for ev in titled
            if train_no and train_no in f"{ev.get('title') or ''} {ev.get('description') or ''}"
        ]
        route_ok = "杭州" in dest and "上海" in origin
        return [{
            "field": "ctrip_train_calendar",
            "expected": {"to": "杭州", "from": "上海", "calendar_title": "杭州出发", "trainNo": train_no or "G/D/C from calendar"},
            "actual": {"draft": draft, "events": [{"title": e.get("title"), "description": e.get("description")} for e in events]},
            "passed": bool(hit) and route_ok and bool(train_no),
        }]
    return _check


def _ctrip_hotel_to_kapi():
    def _amount(input: JudgeInput) -> float | None:
        draft = dict(((input.apps.get("ctrip") or {}).get("taskAudit") or {}).get("hotelBookingDraft") or {})
        if draft.get("hotelId") != "h_atour":
            return None
        hotels = list((input.apps.get("ctrip") or {}).get("hotels") or [])
        hotel = next((h for h in hotels if h.get("id") == "h_atour"), None)
        room = next((r for r in (hotel or {}).get("rooms") or [] if r.get("id") == draft.get("roomId")), None)
        if room is None and hotel:
            room = (hotel.get("rooms") or [None])[0]
        if not room:
            return None
        return float(room.get("price") or 0)

    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        draft = dict(((input.apps.get("ctrip") or {}).get("taskAudit") or {}).get("hotelBookingDraft") or {})
        hotel_ok = draft.get("hotelId") == "h_atour"
        amount = _amount(input)
        kapi = _kapi_expense(amount, category="住房")(input) if amount else [{
            "field": "kapi_expense",
            "expected": "hotel room price",
            "actual": draft,
            "passed": False,
        }]
        return [{
            "field": "ctrip_hotel_draft",
            "expected": "h_atour 填单",
            "actual": draft,
            "passed": hotel_ok,
        }] + kapi
    return _check


def _railway_to_calendar():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        orders = _new_rows(input, "railway12306", "orders")
        picked = None
        for row in orders:
            tickets = row.get("tickets") or []
            names = " ".join(str(t.get("passengerName") or "") for t in tickets)
            seats = " ".join(str(t.get("seatType") or "") for t in tickets)
            route = f"{row.get('fromStation') or ''} {row.get('toStation') or ''}"
            if "王思雨" in names and "上海" in route and "杭州" in route and "二等" in seats and str(row.get("status") or "") == "pending":
                picked = row
                break
        train_no = str((picked or {}).get("trainNo") or "")
        events = _new_rows(input, "calendar", "events")
        hit = [
            ev for ev in events
            if "杭州出发" in str(ev.get("title") or "")
            and train_no
            and train_no in f"{ev.get('title') or ''} {ev.get('description') or ''}"
        ]
        return [{
            "field": "railway_order_calendar",
            "expected": {"passenger": "王思雨", "route": "上海-杭州", "seat": "二等座", "trainNo": train_no},
            "actual": {"orders": orders, "events": events},
            "passed": bool(picked) and bool(hit),
        }]
    return _check


def _maoyan_to_calendar():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        orders = [
            row for row in _new_rows(input, "maoyan", "orders")
            if row.get("kind") == "movie" and "功夫女足" in str(row.get("title") or "")
        ]
        order = orders[0] if orders else None
        cinema = str((order or {}).get("cinemaOrVenue") or "")
        session = str((order or {}).get("sessionDesc") or "")
        start = ""
        for token in session.split():
            if ":" in token and "-" in token:
                start = token.split("-")[0]
                break
        events = _new_rows(input, "calendar", "events")
        blob_ok = False
        for ev in events:
            text = f"{ev.get('title') or ''} {ev.get('description') or ''}"
            if "功夫女足" not in text:
                continue
            if cinema and cinema in text and (not start or start in text):
                blob_ok = True
                break
        return [{
            "field": "maoyan_calendar",
            "expected": {"movie": "功夫女足", "cinema": cinema, "start": start},
            "actual": {"orders": orders, "events": events},
            "passed": bool(order) and blob_ok,
        }]
    return _check


def _luckin_paid_amount(input: JudgeInput) -> float | None:
    for row in _new_rows(input, "luckin", "orders"):
        if row.get("productId") != "coconut-latte":
            continue
        if row.get("status") == "unpaid":
            continue
        return float(row.get("amount") or 0)
    return None


def _luckin_paid():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        amount = _luckin_paid_amount(input)
        return [{
            "field": "luckin_paid",
            "expected": "coconut-latte paid",
            "actual": amount,
            "passed": amount is not None,
        }]
    return _check


SPECS = [
    spec(
        "finance_transfer_kapi",
        "我想在支付宝向浩杰转账150元，备注写报销，转完之后按这笔实付金额在卡皮总账本记一笔支出并保存。",
        ["alipay", "kapi"],
        [],
        ["apps.alipay.transferRecords", "kapi.bills"],
        ["alipay__prepare_transfer", "kapi__prepare_bill_draft"],
        tags=("bench", "flow", "finance"),
        max_steps=50,
    ),
    spec(
        "finance_gas_kapi",
        "我想在支付宝账单里找到那笔燃气费，看清金额后，在卡皮总账本按同一金额记一笔支出并保存。",
        ["alipay", "kapi"],
        [],
        ["kapi.bills"],
        ["alipay__search_bills", "kapi__prepare_bill_draft"],
        tags=("bench", "flow", "finance"),
        max_steps=45,
    ),
    spec(
        "shop_vivo_kapi",
        "我想在京东买 vivo X300（幻夜黑 12+256）并走国家补贴下单支付，然后在卡皮总账本购物分类按这笔实付记一笔，备注写京东 vivo X300。",
        ["jingdong", "kapi"],
        [],
        ["apps.jingdong.orders", "kapi.bills"],
        ["jingdong__prepare_checkout", "kapi__prepare_bill_draft"],
        tags=("bench", "flow", "shopping"),
        max_steps=60,
    ),
    spec(
        "shop_thinkbook_kapi",
        "我想把京东里待付款的 ThinkBook 订单付完，然后在卡皮总账本购物分类按这笔实付记一笔。",
        ["jingdong", "kapi"],
        [],
        ["apps.jingdong.orders", "kapi.bills"],
        ["jingdong__list_orders", "kapi__prepare_bill_draft"],
        tags=("bench", "flow", "shopping"),
        max_steps=45,
    ),
    spec(
        "travel_train_cal",
        "我想在携程查上海到杭州的高铁，选一趟进填单就行先别付，再按这趟车的车次在日历新建「杭州出发」，说明里写上车次。",
        ["ctrip", "calendar"],
        [goal("calendar_new_event", title="杭州出发")],
        ["ctrip.taskAudit", "apps.calendar.events"],
        ["ctrip__search_trains", "calendar__prepare_event_draft"],
        tags=("bench", "flow", "travel"),
        max_steps=50,
    ),
    spec(
        "travel_hotel_kapi",
        "我想在携程打开杭州西湖湖滨中山北路云栖酒店，选一个房型进填单先别付，再按这间房的价格在卡皮总账本住房分类记一笔支出并保存。",
        ["ctrip", "kapi"],
        [],
        ["ctrip.taskAudit", "kapi.bills"],
        ["ctrip__open_hotel", "kapi__prepare_bill_draft"],
        tags=("bench", "flow", "travel"),
        max_steps=50,
    ),
    spec(
        "travel_12306_cal",
        "我想在12306给乘客王思雨买一张上海到杭州的二等座，提交到待支付即可，再按这趟车的车次在日历新建「杭州出发」，说明里写上车次。",
        ["railway12306", "calendar"],
        [goal("calendar_new_event", title="杭州出发")],
        ["apps.railway12306.orders", "apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "flow", "travel"),
        max_steps=55,
    ),
    spec(
        "local_movie_cal",
        "我想在猫眼买功夫女足任意一场并完成支付，再按这张票的影院和开场时间在日历新建「功夫女足」，说明里写上影院和开场时间。",
        ["maoyan", "calendar"],
        [goal("calendar_new_event", title="功夫女足")],
        ["apps.maoyan.orders", "apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "flow", "local"),
        max_steps=55,
    ),
    spec(
        "local_coffee_kapi",
        "我想在瑞幸下一杯生椰拿铁并完成支付，再按这笔实付在卡皮总账本咖啡分类记一笔支出并保存。",
        ["luckin", "kapi"],
        [],
        ["apps.luckin.orders", "kapi.bills"],
        ["luckin__open_product", "kapi__prepare_bill_draft"],
        tags=("bench", "flow", "local"),
        max_steps=45,
    ),
    spec(
        "work_meet_cal",
        "我想在 Slack 全员频道把下周三例会的时间和地点看清楚，按通知在日历新建「全员例会」，从下周三下午两点开始，说明里写上地点。",
        ["slack", "calendar"],
        [goal(
            "calendar_new_event",
            title="全员例会",
            startTs=_MEET_START,
            allDay=False,
            description_contains=["3楼"],
        )],
        ["apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "flow", "work"),
        max_steps=40,
    ),
    spec(
        "work_launch_cal",
        "我想在 Slack 的 education 频道把陈昊说的上线时间看清楚，按他说的那天 15:00 在日历新建「上线确认」。",
        ["slack", "calendar"],
        [goal(
            "calendar_new_event",
            title="上线确认",
            startTs=_LAUNCH_START,
            allDay=False,
        )],
        ["apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "flow", "work"),
        max_steps=40,
    ),
]

EXTRA_CHECKS = {
    "finance_transfer_kapi": lambda input: (
        _alipay_new_transfer("浩杰", 150)(input) + _kapi_expense(150)(input)
    ),
    "finance_gas_kapi": _kapi_expense(36.2),
    "shop_vivo_kapi": lambda input: (
        _jd_paid("vivo X300")(input)
        + _kapi_matches_source(_jd_paid_amount("vivo X300"), category="购物")(input)
        + [{
            "field": "kapi_note_jd_vivo",
            "expected": "京东 and vivo X300",
            "actual": [row.get("note") for row in _new_rows(input, "kapi", "bills")],
            "passed": any(
                "京东" in str(row.get("note") or "") and "vivo" in str(row.get("note") or "").lower()
                for row in _new_rows(input, "kapi", "bills")
            ),
        }]
    ),
    "shop_thinkbook_kapi": lambda input: (
        _jd_paid("ThinkBook", existing_id="o_2")(input)
        + _kapi_matches_source(_jd_paid_amount("ThinkBook", existing_id="o_2"), category="购物")(input)
    ),
    "travel_train_cal": _ctrip_train_to_calendar(),
    "travel_hotel_kapi": _ctrip_hotel_to_kapi(),
    "travel_12306_cal": _railway_to_calendar(),
    "local_movie_cal": _maoyan_to_calendar(),
    "local_coffee_kapi": lambda input: (
        _luckin_paid()(input)
        + _kapi_matches_source(_luckin_paid_amount, category="咖啡")(input)
    ),
}

build_task_classes(
    SPECS,
    EXTRA_CHECKS,
    module_globals=globals(),
    module_name=__name__,
)
