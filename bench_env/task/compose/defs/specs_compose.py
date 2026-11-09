"""Compose already-run atoms + gather facts from several apps into one write."""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

from bench_env.task.flow.defs.specs_flow import (
    _kapi_expense,
    _kapi_matches_source,
    _new_rows,
)
from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

_CST = timezone(timedelta(hours=8))
_NIMBUS_START = int(datetime(2026, 7, 13, 14, 0, tzinfo=_CST).timestamp() * 1000)
_WEEKEND_START = int(datetime(2026, 7, 18, 18, 0, tzinfo=_CST).timestamp() * 1000)
_MEET_START = int(datetime(2026, 7, 15, 14, 0, tzinfo=_CST).timestamp() * 1000)


def _alipay_max_expense(input: JudgeInput) -> tuple[float, str]:
    best = 0.0
    title = ""
    for row in ((input.apps_init.get("alipay") or {}).get("transferRecords") or []):
        delta = float(row.get("delta") or 0)
        if delta >= 0:
            continue
        paid = abs(delta)
        if paid > best:
            best = paid
            title = str(row.get("displayTitle") or row.get("counterpartyName") or "")
    return best, title


def _kapi_category_sum(input: JudgeInput, category: str) -> float:
    total = 0.0
    for row in ((input.apps_init.get("kapi") or {}).get("bills") or []):
        if row.get("type") == "expense" and row.get("categoryName") == category:
            total += float(row.get("amount") or 0)
    return round(total, 1)


def _alipay_max_to_kapi():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        amount, title = _alipay_max_expense(input)
        kapi = _kapi_expense(amount)(input)
        note_text = str(((kapi[0].get("actual") or [{}])[0] or {}).get("note") or "") if kapi else ""
        note_ok = any(token in note_text for token in ("正中", "刘沐辰"))
        return kapi + [{
            "field": "kapi_note_mentions_source",
            "expected": "正中/刘沐辰",
            "actual": kapi[0].get("actual") if kapi else None,
            "passed": bool(kapi and kapi[0].get("passed")) and note_ok,
        }]
    return _check


def _weifang_train_cal():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        draft = dict(((input.apps.get("ctrip") or {}).get("taskAudit") or {}).get("trainBookingDraft") or {})
        trains = list((input.apps.get("ctrip") or {}).get("trains") or [])
        train = next((row for row in trains if str(row.get("id")) == str(draft.get("trainId") or "")), None) or {}
        train_no = str(draft.get("trainNo") or train.get("trainNo") or "")
        dest = str(draft.get("to") or train.get("to") or "")
        depart = str(train.get("depart") or "")
        events = _new_rows(input, "calendar", "events")
        hit = [
            ev for ev in events
            if "潍坊出发" in str(ev.get("title") or "")
            and train_no
            and train_no in f"{ev.get('title') or ''} {ev.get('description') or ''}"
        ]
        return [{
            "field": "weifang_train_calendar",
            "expected": {"to": "潍坊", "trainNo": train_no, "depart": depart},
            "actual": {"draft": draft, "events": events},
            "passed": "潍坊" in dest and bool(hit) and ("07:05" in f"{hit[0].get('title') or ''} {hit[0].get('description') or ''}" if hit else False),
        }]
    return _check


def _luckin_orange_amount(input: JudgeInput) -> float | None:
    for row in _new_rows(input, "luckin", "orders"):
        if row.get("productId") != "orange-c":
            continue
        if row.get("status") == "unpaid":
            continue
        if int(row.get("quantity") or 0) < 2:
            continue
        return float(row.get("amount") or 0)
    return None


def _taobao_bottle_amount(input: JudgeInput) -> float | None:
    init = {str(row.get("id")) for row in ((input.apps_init.get("taobao") or {}).get("orders") or [])}
    for row in ((input.apps.get("taobao") or {}).get("orders") or []):
        if str(row.get("id")) in init:
            continue
        blob = str(row.get("title") or "") + " ".join(str(x.get("title") or "") for x in (row.get("lines") or []) if isinstance(x, dict))
        if "焖烧" not in blob and "简木" not in blob:
            continue
        if row.get("status") == "pendingPayment":
            continue
        paid = float(row.get("paidAmount") or row.get("actualPay") or row.get("total") or 0)
        return paid if paid > 0.01 else float(row.get("itemTotal") or row.get("price") or 89)
    return None


def _xianyu_iphone_order(input: JudgeInput) -> dict[str, Any] | None:
    for row in _new_rows(input, "xianyu", "orders"):
        if str(row.get("itemId") or "") != "i4" and "iPhone 14" not in str(row.get("title") or ""):
            continue
        if row.get("status") == "pendingPayment":
            continue
        return row if isinstance(row, dict) else None
    return None


def _xianyu_iphone_amount(input: JudgeInput) -> float | None:
    row = _xianyu_iphone_order(input)
    if not row:
        return None
    return float(row.get("price") or 0)


def _mail_nimbus_replied():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        sent = [
            row for row in _new_rows(input, "mail", "mails")
            if row.get("folder") == "sent"
        ]
        hit = False
        for row in sent:
            addrs = " ".join(
                str(item.get("address") or "")
                for item in (row.get("to") or [])
                if isinstance(item, dict)
            )
            body = f"{row.get('subject') or ''} {row.get('preview') or ''} {row.get('body') or ''}"
            if "nimbus" in addrs.lower() and ("已知悉" in body or "尽快" in body) and str(row.get("accountId") or "") == "school":
                hit = True
        return [{
            "field": "mail_nimbus_reply",
            "expected": "sent to billing@nimbus.dev containing 已知悉",
            "actual": [{"to": r.get("to"), "preview": r.get("preview")} for r in sent],
            "passed": hit,
        }]
    return _check


def _dianping_fav_cal():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        favs = list((input.apps.get("dianping") or {}).get("favoriteShopIds") or [])
        events = _new_rows(input, "calendar", "events")
        hit = any(
            "火锅聚餐" in str(ev.get("title") or "")
            and "王和李" in f"{ev.get('title') or ''} {ev.get('description') or ''}"
            for ev in events
        )
        return [{
            "field": "dianping_fav_calendar",
            "expected": {"fav": "wangheli", "title": "火锅聚餐"},
            "actual": {"favoriteShopIds": favs, "events": events},
            "passed": "wangheli" in favs and hit,
        }]
    return _check


def _cainiao_note():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        orders = [
            row for row in _new_rows(input, "cainiao", "shipOrders")
            if "赵磊" in str(row.get("toName") or "")
        ]
        tokens = []
        for order in orders:
            for key in ("shipCode", "orderNo", "trackingNo", "pickupCode", "mailNo"):
                val = str(order.get(key) or "").strip()
                if val and val not in tokens:
                    tokens.append(val)
        notes = _new_rows(input, "notes", "notes")
        hit = any(
            "寄件赵磊" in str(n.get("title") or "")
            and any(token in f"{n.get('title') or ''} {n.get('content') or ''}" for token in tokens)
            for n in notes
        )
        return [{
            "field": "cainiao_note_tracking",
            "expected": {"to": "赵磊", "tokens": tokens},
            "actual": {"orders": orders, "notes": notes},
            "passed": bool(orders) and bool(tokens) and hit,
        }]
    return _check


def _note_contains(title: str, tokens: list[str]):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        notes = _new_rows(input, "notes", "notes")
        item = next((n for n in notes if str(n.get("title") or "") == title), None)
        text = f"{(item or {}).get('title') or ''}\n{(item or {}).get('content') or ''}"
        digits = "".join(ch for ch in text if ch.isdigit())
        missing = [t for t in tokens if t not in text and t not in digits]
        return [{
            "field": "notes_gather",
            "expected": {"title": title, "contains": tokens},
            "actual": {"note": item, "missing": missing},
            "passed": item is not None and not missing,
        }]
    return _check


def _gather_weekend():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        sessions = [
            row for row in ((input.apps.get("maoyan") or {}).get("sessions") or [])
            if row.get("movieId") == "m_kungfu"
        ]
        starts = {str(row.get("start") or "") for row in sessions}
        events = _new_rows(input, "calendar", "events")
        hit = False
        for ev in events:
            text = f"{ev.get('title') or ''} {ev.get('description') or ''}"
            if "王和李" not in text or "功夫女足" not in text:
                continue
            if any(st and st in text for st in starts):
                hit = True
        return [{
            "field": "weekend_gather",
            "expected": {"shop": "王和李", "movie": "功夫女足", "session_start": True},
            "actual": {"events": events, "starts": sorted(starts)[:8]},
            "passed": hit,
        }]
    return _check


def _wechat_new_to(input: JudgeInput, contact: str) -> list[str]:
    me = str(((input.apps.get("wechat") or {}).get("user") or {}).get("wxid") or "xiaoming001")
    init_by_id = {
        str(chat.get("id")): {
            str(msg.get("id"))
            for msg in (chat.get("messages") or [])
            if isinstance(msg, dict)
        }
        for chat in ((input.apps_init.get("wechat") or {}).get("chats") or [])
        if isinstance(chat, dict)
    }
    texts: list[str] = []
    for chat in ((input.apps.get("wechat") or {}).get("chats") or []):
        if not isinstance(chat, dict):
            continue
        name = str(((chat.get("user") or {}) if isinstance(chat.get("user"), dict) else {}).get("name") or "")
        if contact not in name:
            continue
        seen = init_by_id.get(str(chat.get("id")), set())
        for msg in (chat.get("messages") or []):
            if not isinstance(msg, dict) or str(msg.get("id")) in seen:
                continue
            if str(msg.get("senderId") or "") not in {me, "xiaoming001"}:
                continue
            texts.append(str(msg.get("content") or ""))
    return texts


def _wechat_has(contact: str, tokens: list[str]):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        texts = _wechat_new_to(input, contact)
        hit = any(all(token in text for token in tokens) for text in texts)
        return [{
            "field": f"wechat_{contact}",
            "expected": {"to": contact, "contains": tokens},
            "actual": texts,
            "passed": hit,
        }]
    return _check


def _c06_maoyan_wechat():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        orders = [
            row for row in _new_rows(input, "maoyan", "orders")
            if row.get("movieId") == "m_kungfu" or "功夫女足" in str(row.get("movieName") or row.get("title") or "")
        ]
        snack_ok = any(
            "sn_couple" in [str(x) for x in (row.get("snacks") or [])]
            or (isinstance(row.get("snacks"), list) and any(
                (isinstance(x, dict) and x.get("id") == "sn_couple") or x == "sn_couple"
                for x in row.get("snacks") or []
            ))
            for row in orders
        )
        count_ok = any(int(row.get("count") or 0) == 2 for row in orders)
        texts = _wechat_new_to(input, "陈静")
        blob = " ".join(texts)
        sent = ("功夫女足" in blob or "文悦" in blob) and any(ch.isdigit() for ch in blob)
        return [
            {
                "field": "maoyan_kungfu_order",
                "expected": "new 功夫女足 order with sn_couple x2",
                "actual": [{"id": r.get("id"), "movieId": r.get("movieId"), "snacks": r.get("snacks"), "count": r.get("count")} for r in orders],
                "passed": bool(orders) and snack_ok and count_ok,
            },
            {
                "field": "wechat_chenjing_session",
                "expected": "陈静收到场次或座位",
                "actual": texts,
                "passed": sent,
            },
        ]
    return _check


def _c10_slack_cal():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        replies = [
            row for row in _new_rows(input, "slack", "messages")
            if row.get("threadParentId") == "m_gen_4" and not row.get("deleted")
        ]
        events = [
            ev for ev in _new_rows(input, "calendar", "events")
            if "例会" in str(ev.get("title") or "")
            and ev.get("startTs") == _MEET_START
        ]
        return [
            {
                "field": "slack_suya_reply",
                "expected": "reply to 苏雅 例会",
                "actual": [{"text": r.get("text"), "threadParentId": r.get("threadParentId")} for r in replies],
                "passed": bool(replies),
            },
            {
                "field": "calendar_suya_meet",
                "expected": {"title": "例会", "startTs": _MEET_START},
                "actual": [{"title": e.get("title"), "startTs": e.get("startTs")} for e in _new_rows(input, "calendar", "events")],
                "passed": bool(events),
            },
        ]
    return _check


def _c13_didi_wechat():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        texts = _wechat_new_to(input, "张伟")
        hit = any(
            "云溪苑" in text and "东北门" in text and re.search(r"\d", text)
            for text in texts
        )
        return [{
            "field": "wechat_zhangwei_didi",
            "expected": "张伟收到上车点和预估",
            "actual": texts,
            "passed": hit,
        }]
    return _check


def _c16_kapi_wechat():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        food = 0.0
        for row in ((input.apps_init.get("kapi") or {}).get("bills") or []):
            if row.get("type") == "expense" and row.get("categoryName") == "餐饮":
                food += float(row.get("amount") or 0)
        over = round(food - 1500, 1)
        texts = _wechat_new_to(input, "陈静")
        blob = " ".join(texts)
        if over > 0:
            passed = "餐饮" in blob and (
                str(int(over)) in blob
                or f"{over:.1f}" in blob
                or str(int(food)) in blob
                or f"{food:.1f}" in blob
            )
        else:
            passed = "没超" in blob or "没有超" in blob or "未超" in blob
        return [{
            "field": "wechat_chenjing_food_budget",
            "expected": {"food": food, "budget": 1500, "over": over},
            "actual": texts,
            "passed": passed,
        }]
    return _check


def _gather_meet_pay():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        events = _new_rows(input, "calendar", "events")
        hit = [
            ev for ev in events
            if ev.get("startTs") == _MEET_START
            and "3楼" in str(ev.get("description") or ev.get("title") or "")
            and "200" in str(ev.get("description") or ev.get("title") or "")
        ]
        return [{
            "field": "meet_pay_gather",
            "expected": {"startTs": _MEET_START, "contains": ["3楼", "200"]},
            "actual": events,
            "passed": bool(hit),
        }]
    return _check


SPECS = [
    spec(
        "compose_alipay_max_kapi",
        "我想在支付宝找出支出金额最大的一笔，到卡皮总账本按同一金额记一笔支出并保存，备注写清对方。",
        ["alipay", "kapi"],
        [],
        ["kapi.bills"],
        ["alipay__search_bills", "kapi__prepare_bill_draft"],
        tags=("bench", "compose", "finance"),
        max_steps=45,
    ),
    spec(
        "compose_weifang_cal",
        "我想在携程订上海到潍坊最早有二等座的车次，进填单就行先别付，再按这趟车的车次和出发时间在日历新建「潍坊出发」。",
        ["ctrip", "calendar"],
        [goal("calendar_new_event", title="潍坊出发")],
        ["ctrip.taskAudit", "apps.calendar.events"],
        ["ctrip__search_trains", "calendar__prepare_event_draft"],
        tags=("bench", "compose", "travel"),
        max_steps=50,
    ),
    spec(
        "compose_orangec_kapi",
        "我想在瑞幸把橙 C 美式加到购物车改成 2 杯并完成支付，再按这笔实付在卡皮总账本咖啡分类记一笔支出并保存。",
        ["luckin", "kapi"],
        [],
        ["apps.luckin.orders", "kapi.bills"],
        ["luckin__open_product", "kapi__prepare_bill_draft"],
        tags=("bench", "compose", "local"),
        max_steps=50,
    ),
    spec(
        "compose_taobao_bottle_kapi",
        "我想在淘宝搜焖烧保温杯，买下简木那款并完成支付，再按这笔实付在卡皮总账本购物分类记一笔支出并保存。",
        ["taobao", "kapi"],
        [],
        ["apps.taobao.orders", "kapi.bills"],
        ["taobao__open_item", "kapi__prepare_bill_draft"],
        tags=("bench", "compose", "shopping"),
        max_steps=50,
    ),
    spec(
        "compose_mail_nimbus_cal",
        "我想打开 Nimbus 付款失败那封邮件，回复对方我已知悉并将尽快处理，再用学校邮箱发出去，然后在日历明天 14:00 建一个半小时的「处理 Nimbus 付款」。",
        ["mail", "calendar"],
        [goal("calendar_new_event", title="处理 Nimbus 付款", startTs=_NIMBUS_START, allDay=False)],
        ["apps.mail.mails", "apps.calendar.events"],
        ["mail__prepare_draft", "calendar__prepare_event_draft"],
        tags=("bench", "compose", "work"),
        max_steps=50,
    ),
    spec(
        "compose_xianyu_kapi",
        "我想在闲鱼买下 iPhone 14 Pro，收货地址换成张小妹的杭州地址，用支付宝余额付完，再按实付在卡皮总账本购物分类记一笔。",
        ["xianyu", "kapi"],
        [],
        ["apps.xianyu.orders", "kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "compose", "shopping"),
        max_steps=55,
    ),
    spec(
        "compose_dianping_cal",
        "我想在点评收藏王和李·海鲜火锅大排档，再按这家店在日历本周六 18:00 新建「火锅聚餐」，说明里写上店名。",
        ["dianping", "calendar"],
        [goal("calendar_new_event", title="火锅聚餐", startTs=_WEEKEND_START, allDay=False)],
        ["apps.dianping.favoriteShopIds", "apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "compose", "local"),
        max_steps=45,
    ),
    spec(
        "compose_cainiao_note",
        "我想用菜鸟把保温杯服务点自寄给赵磊并提交订单，再到系统笔记 App 新建「寄件赵磊」，把运单号或寄件单号写进去。",
        ["cainiao", "notes"],
        [goal("notes_note", title="寄件赵磊")],
        ["apps.cainiao.shipOrders", "apps.notes.notes"],
        ["notes__create_note"],
        tags=("bench", "compose", "local"),
        max_steps=50,
    ),
    spec(
        "gather_can_buy",
        "我想对一下三笔数：支付宝支出最大的一笔、京东待付款 ThinkBook 要付多少、支付宝现在余额还有多少。写进系统笔记 App「能不能买」，这三个数都要有。",
        ["alipay", "jingdong", "notes"],
        [goal("notes_note", title="能不能买", contains=["2500", "6629", "100023"])],
        ["apps.notes.notes"],
        ["alipay__search_bills", "jingdong__list_orders", "notes__create_note"],
        tags=("bench", "gather", "finance"),
        max_steps=50,
    ),
    spec(
        "gather_spend_compare",
        "我想把支付宝支出最大的那一笔对方和金额，以及卡皮总账本里所有餐饮支出的合计，写进系统笔记 App「开支对照」，两处数字都要有。",
        ["alipay", "kapi", "notes"],
        [goal("notes_note", title="开支对照", contains=["2500", "378"])],
        ["apps.notes.notes"],
        ["alipay__search_bills", "kapi__get_budget_status", "notes__create_note"],
        tags=("bench", "gather", "finance"),
        max_steps=45,
    ),
    spec(
        "gather_weekend",
        "我想在点评确认王和李·海鲜火锅大排档这家店，再在猫眼看功夫女足任意一场的开场时间，然后在日历新建「周末安排」，说明里写上店名、电影和这场的开场时间。",
        ["dianping", "maoyan", "calendar"],
        [goal("calendar_new_event", title="周末安排")],
        ["apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "gather", "local"),
        max_steps=50,
    ),
    spec(
        "gather_meet_pay",
        "我想在 Slack 全员频道看清下周三例会的时间和地点，再打开 Nimbus 付款失败邮件看清金额，然后在日历按例会时间新建「例会后处理付款」，说明里写上地点和那笔金额。",
        ["slack", "mail", "calendar"],
        [goal("calendar_new_event", title="例会后处理付款", startTs=_MEET_START, allDay=False)],
        ["apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "gather", "work"),
        max_steps=50,
    ),
    spec(
        "compose_ctrip_share",
        "张伟来杭州，想在携程找湖滨含早、400 块以内更划算那家，订完分享到微信给他。",
        ["ctrip", "wechat"],
        [],
        ["wechat.chats"],
        ["ctrip__search_hotels", "wechat__send_text_message"],
        tags=("bench", "compose", "travel"),
        max_steps=50,
    ),
    spec(
        "compose_maoyan_wechat",
        "明天想在猫眼文悦 IMAX 订功夫女足两人连座加双人餐，订完把场次座位微信发给陈静。",
        ["maoyan", "wechat"],
        [],
        ["apps.maoyan.orders", "wechat.chats"],
        ["wechat__send_text_message"],
        tags=("bench", "compose", "local"),
        max_steps=55,
    ),
    spec(
        "compose_slack_cal",
        "我想在 Slack 回苏雅例会那条，再在日历按同一时间建同名日程。",
        ["slack", "calendar"],
        [goal("calendar_new_event", title="全员例会", startTs=_MEET_START, allDay=False)],
        ["apps.slack.messages", "apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "compose", "work"),
        max_steps=45,
    ),
    spec(
        "compose_didi_wechat",
        "我想从云溪苑东北门打车到星辰广场，把上车点和预估微信发给张伟。",
        ["didi", "wechat"],
        [],
        ["wechat.chats"],
        ["wechat__send_text_message"],
        tags=("bench", "compose", "travel"),
        max_steps=45,
    ),
    spec(
        "compose_kapi_wechat",
        "我想在卡皮看本月餐饮超没超，超了的分类金额微信发给陈静。",
        ["kapi", "wechat"],
        [],
        ["wechat.chats"],
        ["kapi__get_budget_status", "wechat__send_text_message"],
        tags=("bench", "compose", "finance"),
        max_steps=40,
    ),
]

EXTRA_CHECKS = {
    "compose_alipay_max_kapi": _alipay_max_to_kapi(),
    "compose_weifang_cal": _weifang_train_cal(),
    "compose_orangec_kapi": lambda input: (
        [{"field": "luckin_orange", "expected": "orange-c x2 paid", "actual": _luckin_orange_amount(input), "passed": _luckin_orange_amount(input) is not None}]
        + _kapi_matches_source(_luckin_orange_amount, category="咖啡")(input)
    ),
    "compose_taobao_bottle_kapi": lambda input: (
        [{"field": "taobao_bottle", "expected": "焖烧 paid", "actual": _taobao_bottle_amount(input), "passed": _taobao_bottle_amount(input) is not None}]
        + _kapi_matches_source(_taobao_bottle_amount, category="购物")(input)
    ),
    "compose_mail_nimbus_cal": _mail_nimbus_replied(),
    "compose_xianyu_kapi": lambda input: (
        [{"field": "xianyu_iphone", "expected": "i4 paid", "actual": _xianyu_iphone_amount(input), "passed": _xianyu_iphone_amount(input) is not None}]
        + [{
            "field": "xianyu_hangzhou_pay",
            "expected": {"name": "张小妹", "city": "杭州", "payMethod": "支付宝 or 余额"},
            "actual": {
                "addressSnapshot": (_xianyu_iphone_order(input) or {}).get("addressSnapshot"),
                "payMethod": (_xianyu_iphone_order(input) or {}).get("payMethod"),
            },
            "passed": (
                "张小妹" in str((_xianyu_iphone_order(input) or {}).get("addressSnapshot") or {})
                and "杭州" in str((_xianyu_iphone_order(input) or {}).get("addressSnapshot") or {})
                and str((_xianyu_iphone_order(input) or {}).get("payMethod") or "") in {"支付宝", "余额"}
            ),
        }]
        + _kapi_matches_source(_xianyu_iphone_amount, category="购物")(input)
    ),
    "compose_dianping_cal": _dianping_fav_cal(),
    "compose_cainiao_note": _cainiao_note(),
    "gather_can_buy": _note_contains("能不能买", ["2500", "6629", "100023"]),
    "gather_spend_compare": _note_contains("开支对照", ["2500", "378", "正中"]),
    "compose_ctrip_share": lambda input: (
        [{
            "field": "ctrip_hotel_draft",
            "expected": "hotelBookingDraft 青禾 or 湖滨含早≤400",
            "actual": dict(((input.apps.get("ctrip") or {}).get("taskAudit") or {}).get("hotelBookingDraft") or {}),
            "passed": (
                str((dict(((input.apps.get("ctrip") or {}).get("taskAudit") or {}).get("hotelBookingDraft") or {})).get("hotelId") or "") in {"h_quanji", "h_qinghe"}
                or "青禾" in str(dict(((input.apps.get("ctrip") or {}).get("taskAudit") or {}).get("hotelBookingDraft") or {}))
            ),
        }]
        + _wechat_has("张伟", ["青禾"])(input)
    ),
    "gather_weekend": _gather_weekend(),
    "gather_meet_pay": _gather_meet_pay(),
    "compose_maoyan_wechat": _c06_maoyan_wechat(),
    "compose_slack_cal": _c10_slack_cal(),
    "compose_didi_wechat": _c13_didi_wechat(),
    "compose_kapi_wechat": _c16_kapi_wechat(),
}

build_task_classes(
    SPECS,
    EXTRA_CHECKS,
    module_globals=globals(),
    module_name=__name__,
)
