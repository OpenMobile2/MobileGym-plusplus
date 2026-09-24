"""Demo specs: long Ctrip hotel + WeChat share; shorter Taobao + Kapi; secretary prep."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

# Same frozen clock as the 369 suites: 2026-07-12 09:00. 「后天下午」= 2026-07-14 14:00.
# Do not write that calendar date into the instruction; the model reads today from the system clock.
_CST = timezone(timedelta(hours=8))
_MEETING_START_MS = int(datetime(2026, 7, 14, 14, 0, tzinfo=_CST).timestamp() * 1000)
_MEETING_NOTE = (
    "地点：杭州西湖国际会议中心。"
    "会前材料：打印《青禾合作备忘录》一式三份；议程含签约条款、交付节点；发言稿用王总已确认版本。"
)
_MEETING_SETTINGS = {
    "calendar": True,
    "waitingRoom": False,
    "enableSignUp": False,
    "allowBeforeHost": True,
    "muteOnJoin": "auto_after_6",
    "watermark": False,
    "allowMultiDevice": True,
    "forbidAddContact": False,
    "autoCloudRecord": False,
    "autoTranscribe": False,
    "allowUploadDoc": True,
}


def _ms(y: int, m: int, d: int, hh: int, mm: int = 0) -> int:
    return int(datetime(y, m, d, hh, mm, tzinfo=_CST).timestamp() * 1000)


def _sched(mid: str, number: str, title: str, start_ms: int, *, note: str = "", duration: int = 60) -> dict[str, Any]:
    return {
        "id": mid,
        "meetingId": number,
        "title": title,
        "note": note,
        "startTime": start_ms,
        "duration": duration,
        "timezone": "(GMT+08:00) 中国标准时间",
        "repeatType": "none",
        "hostId": "user_wangzong" if "王总" in title else "user_001",
        "invitees": [
            {"id": "user_wangzong", "name": "王总"},
            {"id": "user_001", "name": "小明"},
        ],
        "settings": dict(_MEETING_SETTINGS),
        "status": "pending",
        "createdAt": start_ms,
    }


# Homepage sorts by startTime. Gold is 07-14 14:00; foils sit above and beside it
# so the 备忘录 is not the first card. search_meetings("王总"/"杭州") hits several titles;
# only sched_003.note has 青禾合作备忘录.
_SECRETARY_MEETINGS = [
    _sched("sched_d01", "201 110 401", "王总周报同步", _ms(2026, 7, 12, 14, 30), note="带上周报，不用打印。"),
    _sched("sched_d02", "201 110 402", "杭州办值班交接", _ms(2026, 7, 12, 16, 10), note="值班表在群里。"),
    _sched("sched_d03", "201 110 503", "合作方合同初审", _ms(2026, 7, 13, 8, 30), note="只看框架条款，不涉及备忘录。"),
    _sched("sched_d04", "201 110 504", "王总一对一", _ms(2026, 7, 13, 9, 0), note="个人行程，不是出差场。"),
    _sched("sched_d05", "201 110 505", "杭州项目晨会", _ms(2026, 7, 13, 10, 0), note="远程同步进度。"),
    _sched("sched_d06", "201 110 506", "王总上海客户拜访准备", _ms(2026, 7, 13, 11, 30), note="客户在上海，不是杭州。"),
    _sched("sched_d07", "201 110 507", "财务对账", _ms(2026, 7, 13, 14, 0), note="对十二月流水。"),
    _sched("sched_d08", "201 110 508", "杭州渠道沟通", _ms(2026, 7, 13, 15, 30), note="电话会，无会前材料。"),
    _sched("sched_d09", "201 110 509", "王总晚上通气", _ms(2026, 7, 13, 19, 0), note="十分钟站会。"),
    _sched("sched_d10", "201 110 601", "王总会前碰头", _ms(2026, 7, 14, 8, 0), note="确认出发时间，材料在另一场。"),
    _sched("sched_d11", "201 110 602", "杭州办晨会", _ms(2026, 7, 14, 8, 30), note="本地晨会，与合作方会无关。"),
    _sched("sched_d15", "201 110 610", "杭州办午间同步", _ms(2026, 7, 14, 10, 0), note="本地午餐对接。"),
    _sched("sched_d16", "201 110 611", "王总远程过材料", _ms(2026, 7, 14, 11, 30), note="线上过稿，人在上海。"),
    _sched("sched_d17", "201 110 612", "王总会前确认", _ms(2026, 7, 14, 13, 0), note="确认出发材料，备忘录在合作方那场。"),
    _sched(
        "sched_003",
        "628 417 903",
        "王总杭州西湖国际会议中心合作方会",
        _MEETING_START_MS,
        note=_MEETING_NOTE,
        duration=120,
    ),
    _sched("sched_d12", "201 110 604", "王总杭州返程沟通", _ms(2026, 7, 14, 16, 30), note="会后电话，不用备忘录。"),
    _sched("sched_d13", "201 110 701", "合作方跟进会", _ms(2026, 7, 15, 9, 30), note="会后复盘，材料已发出。"),
    _sched("sched_d14", "201 110 702", "王总周例会", _ms(2026, 7, 15, 14, 0), note="常规例会。"),
]

_SECRETARY_PREPARE = {
    "tencent_meeting": {
        "contacts[]": [{"id": "user_wangzong", "name": "王总"}],
        "scheduledMeetings[]": _SECRETARY_MEETINGS,
    },
    "kapi": {
        "currentLedgerId": "l_company",
    },
    "ctrip": {
        "hotelCity": "杭州",
    },
}


def _kapi_bill_added(category_name: str, amount: float, *, tolerance: float = 0.5):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        init_ids = {str(row.get("id")) for row in ((input.apps_init.get("kapi") or {}).get("bills") or [])}
        final = list((input.apps.get("kapi") or {}).get("bills") or [])
        matches = [
            row for row in final
            if str(row.get("id")) not in init_ids
            and row.get("categoryName") == category_name
            and abs(float(row.get("amount") or 0) - amount) <= tolerance
        ]
        return [{
            "field": "kapi_bill_added",
            "expected": f"new bill category={category_name} amount≈{amount}",
            "actual": [
                {
                    "id": row.get("id"),
                    "categoryName": row.get("categoryName"),
                    "amount": row.get("amount"),
                    "note": row.get("note"),
                }
                for row in final
                if str(row.get("id")) not in init_ids
            ],
            "passed": bool(matches),
        }]
    return _check


def _opened_cheapest_item(item_id: str):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        init_fps = list((input.apps_init.get("taobao") or {}).get("footprints") or [])
        final_fps = list((input.apps.get("taobao") or {}).get("footprints") or [])
        init_date = next((row.get("date") for row in init_fps if str(row.get("itemId")) == item_id), None)
        final_row = next((row for row in final_fps if str(row.get("itemId")) == item_id), None)
        opened = bool(final_row) and final_row.get("date") != init_date
        return [{
            "field": "taobao_item_opened",
            "expected": f"open item {item_id} so the cheapest product is on screen",
            "actual": {"init_date": init_date, "final": final_row},
            "passed": opened,
        }]
    return _check


def _hhmm_minutes(value: Any) -> int | None:
    parts = str(value or "").split(":")
    if len(parts) != 2:
        return None
    try:
        return int(parts[0]) * 60 + int(parts[1])
    except ValueError:
        return None


def _ctrip_train_noon_hsr(city: str):
    """上海→杭州：中午前后出发的高铁，约 1 小时到，14:00 开会前落到杭州。"""
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        audit = dict((input.apps.get("ctrip") or {}).get("taskAudit") or {})
        draft = audit.get("trainBookingDraft") or {}
        if not isinstance(draft, dict):
            draft = {}
        dest = str(draft.get("to") or "")
        trains = list((input.apps.get("ctrip") or {}).get("trains") or [])
        train = next((row for row in trains if str(row.get("id")) == str(draft.get("trainId") or "")), None)
        if train is None:
            train = next((row for row in trains if str(row.get("trainNo")) == str(draft.get("trainNo") or "")), None)
        train = train if isinstance(train, dict) else {}
        depart_m = _hhmm_minutes(train.get("depart"))
        arrive_m = _hhmm_minutes(train.get("arrive"))
        train_no = str(train.get("trainNo") or draft.get("trainNo") or "")
        train_type = str(train.get("type") or "")
        is_hsr = train_no.startswith("G") or "高铁" in train_type
        passed = (
            city in dest
            and bool(train)
            and depart_m is not None and 11 * 60 <= depart_m <= 12 * 60 + 40
            and arrive_m is not None and arrive_m <= 14 * 60
            and is_hsr
        )
        return [{
            "field": "ctrip_train_draft",
            "expected": {"to": city, "depart": "11:00–12:40", "type": "高铁", "arrive": "≤14:00"},
            "actual": {
                "trainId": draft.get("trainId"),
                "trainNo": train_no or draft.get("trainNo"),
                "to": dest,
                "depart": train.get("depart"),
                "arrive": train.get("arrive"),
                "type": train_type,
            },
            "passed": passed,
        }]
    return _check


def _kapi_company_bill(
    category_name: str,
    *,
    amount: float | None = None,
    max_amount: float | None = None,
    tolerance: float = 0.5,
):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        init_ids = {str(row.get("id")) for row in ((input.apps_init.get("kapi") or {}).get("bills") or [])}
        final = list((input.apps.get("kapi") or {}).get("bills") or [])
        matches = []
        for row in final:
            if str(row.get("id")) in init_ids:
                continue
            if row.get("categoryName") != category_name or row.get("ledgerId") != "l_company":
                continue
            paid = float(row.get("amount") or 0)
            if amount is not None and abs(paid - amount) > tolerance:
                continue
            if max_amount is not None and paid > max_amount:
                continue
            matches.append(row)
        expected = f"new 公司账本 {category_name} bill"
        if amount is not None:
            expected += f" amount≈{amount}"
        if max_amount is not None:
            expected += f" ≤{max_amount}"
        return [{
            "field": f"kapi_company_{category_name}",
            "expected": expected,
            "actual": [
                {
                    "id": row.get("id"),
                    "categoryName": row.get("categoryName"),
                    "amount": row.get("amount"),
                    "ledgerId": row.get("ledgerId"),
                }
                for row in final
                if str(row.get("id")) not in init_ids
            ],
            "passed": bool(matches),
        }]
    return _check


def _wechat_kapi_bill_image():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        chats = list((input.apps.get("wechat") or {}).get("chats") or [])
        chat = next((row for row in chats if str(row.get("id")) == "wxid_zhangwei_888"), None)
        me = str((input.apps.get("wechat") or {}).get("user", {}).get("wxid") or "")
        init_chat = next(
            (row for row in list((input.apps_init.get("wechat") or {}).get("chats") or [])
             if str(row.get("id")) == "wxid_zhangwei_888"),
            None,
        )
        init_ids = {str(m.get("id")) for m in (init_chat or {}).get("messages", []) if isinstance(m, dict)}
        outgoing = [
            m for m in (chat or {}).get("messages", [])
            if isinstance(m, dict) and str(m.get("senderId")) == me and str(m.get("id")) not in init_ids
        ]
        images = [
            m for m in outgoing
            if m.get("type") == "image" and (
                "kapi_share" in str(m.get("content") or "")
                or "Pictures/Saved" in str(m.get("content") or "")
            )
        ]
        nodes = list((((input.os or {}).get("fileSystem") or {}).get("nodes") or []))
        album = [
            n for n in nodes
            if isinstance(n, dict) and "kapi_share" in str(n.get("name") or n.get("path") or "")
        ]
        return [{
            "field": "wechat_kapi_bill_image",
            "expected": "image of 卡皮月账单 to 张伟 (after save-to-album)",
            "actual": {
                "images": [m.get("content") for m in images],
                "album": [n.get("name") or n.get("path") for n in album],
            },
            "passed": bool(images),
        }]
    return _check


def _ctrip_hotel_draft(hotel_id: str, room_id: str):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        audit = dict((input.apps.get("ctrip") or {}).get("taskAudit") or {})
        draft = audit.get("hotelBookingDraft") or {}
        if not isinstance(draft, dict):
            draft = {}
        booked = draft.get("hotelId") == hotel_id and (
            not room_id or draft.get("roomId") == room_id
        )
        return [{
            "field": "ctrip_booking_draft",
            "expected": {"hotelId": hotel_id, **({"roomId": room_id} if room_id else {})},
            "actual": {"hotelId": draft.get("hotelId"), "roomId": draft.get("roomId")},
            "passed": booked,
        }]
    return _check


def _secretary_visible(hotel_id: str, room_id: str, amount: float):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        return (
            _ctrip_hotel_draft(hotel_id, "")(input)
            + _ctrip_train_noon_hsr("杭州")(input)
            + _kapi_company_bill("住房", max_amount=amount)(input)
            + _kapi_company_bill("交通")(input)
            + _wechat_kapi_bill_image()(input)
        )
    return _check


def _demo_visible_writes(category_name: str, amount: float, item_id: str):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        return _kapi_bill_added(category_name, amount)(input) + _opened_cheapest_item(item_id)(input)
    return _check


def _ctrip_qinghe_visible(hotel_id: str, room_id: str):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        audit = dict((input.apps.get("ctrip") or {}).get("taskAudit") or {})
        draft = audit.get("hotelBookingDraft") or {}
        if not isinstance(draft, dict):
            draft = {}
        fac = bool(audit.get(f"hotelFacilities:{hotel_id}"))
        reviews = bool(audit.get(f"hotelReviewsViewed:{hotel_id}"))
        booked = draft.get("hotelId") == hotel_id and draft.get("roomId") == room_id
        return [
            {
                "field": "ctrip_facilities",
                "expected": f"open facilities for {hotel_id}",
                "actual": fac,
                "passed": fac,
            },
            {
                "field": "ctrip_reviews",
                "expected": f"open reviews for {hotel_id}",
                "actual": reviews,
                "passed": reviews,
            },
            {
                "field": "ctrip_booking_draft",
                "expected": {"hotelId": hotel_id, "roomId": room_id, "breakfast": "1份早餐"},
                "actual": {
                    "hotelId": draft.get("hotelId"),
                    "roomId": draft.get("roomId"),
                    "breakfast": draft.get("breakfast"),
                },
                "passed": booked,
            },
        ]
    return _check


SPECS = [
    spec(
        "secretary_wang_hangzhou_prep",
        "王总后天下午在杭州西湖国际会议中心有个合作方会议。"
        "你去腾讯会议里把这场会的时间和会前材料看清楚，再按日程去携程旅行订上海到杭州的火车和当晚酒店。"
        "酒店就近选西湖国际会议中心附近的，不能超过住房预算，火车和酒店都进填单就行先别付。"
        "卡皮记账里进公司账本，按住房和交通把当晚房价和火车票记上，再导出本月账单，保存图片到相册。"
        "最后用微信把会前材料和这张账单图发给张伟。",
        ["tencent_meeting", "ctrip", "wechat", "kapi"],
        [goal(
            "wechat_sent",
            contact_id="wxid_zhangwei_888",
            contains=["青禾合作备忘录", "议程"],
        )],
        ["apps.wechat.chats", "ctrip.taskAudit", "kapi.bills"],
        [
            "tencent_meeting__search_meetings",
            "tencent_meeting__get_meeting_summary",
            "tencent_meeting__list_scheduled",
            "ctrip__search_hotels",
            "ctrip__search_trains",
            "ctrip__get_hotel_summary",
            "ctrip__open_hotel",
            "kapi__get_budget_status",
            "kapi__prepare_bill_draft",
        ],
        tags=("demo", "crossapp", "secretary"),
        max_steps=50,
    ),
    spec(
        "ctrip_hangzhou_qinghe_share",
        "周末去杭州西湖玩，帮我在携程湖滨商圈找一家含早、别太贵的。"
        "打开青禾酒店杭州西湖湖滨解放路店，看一眼设施和点评，"
        "选雅致大床房带一份早餐，进填单页就行先别付。"
        "把这家分享给微信张伟。",
        ["ctrip", "wechat"],
        [goal(
            "wechat_sent",
            contact_id="wxid_zhangwei_888",
            contains=["青禾", "310"],
        )],
        ["apps.wechat.chats", "ctrip.taskAudit"],
        [
            "ctrip__search_hotels",
            "ctrip__get_hotel_summary",
            "ctrip__open_hotel",
        ],
        tags=("demo", "crossapp", "ctrip", "share"),
        max_steps=50,
    ),
    spec(
        "taobao_qfs_cheapest_wechat_kapi",
        "帮我在淘宝清风山店里比一下，哪件最便宜，打开那件确认一下，"
        "把这件分享给微信张伟，请他先帮忙付了。"
        "卡皮记账里也按购物记一笔同样的数，备注写上这件。",
        ["taobao", "wechat", "kapi"],
        [goal(
            "wechat_sent",
            contact_id="wxid_zhangwei_888",
            contains=["护手霜", "128"],
        )],
        ["apps.wechat.chats", "kapi.bills"],
        [
            "taobao__search_items",
            "taobao__compare_items",
            "taobao__get_item_summary",
            "taobao__open_item",
            "kapi__prepare_bill_draft",
        ],
        tags=("demo", "crossapp", "taobao", "share"),
        max_steps=45,
    ),
]

EXTRA_CHECKS = {
    "secretary_wang_hangzhou_prep": _secretary_visible("h_qinghe_icc", "", 360),
    "ctrip_hangzhou_qinghe_share": _ctrip_qinghe_visible("h_quanji", "r_32106985"),
    "taobao_qfs_cheapest_wechat_kapi": _demo_visible_writes("购物", 128, "i_handcream"),
}

PREPARE_STATE = {
    "secretary_wang_hangzhou_prep": _SECRETARY_PREPARE,
}

build_task_classes(
    SPECS,
    EXTRA_CHECKS,
    module_globals=globals(),
    module_name=__name__,
    prepare_states=PREPARE_STATE,
)
