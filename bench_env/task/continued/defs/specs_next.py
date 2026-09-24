"""Weibo/Keep facts must land in a second-app order."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from bench_env.task.flow.defs.specs_flow import (
    _alipay_new_transfer,
    _kapi_expense,
    _kapi_matches_source,
    _new_rows,
)
from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

_CST = timezone(timedelta(hours=8))
_TYPHOON_DAY = int(datetime(2026, 7, 13, 0, 0, tzinfo=_CST).timestamp() * 1000)
_SATURDAY = int(datetime(2026, 7, 18, 0, 0, tzinfo=_CST).timestamp() * 1000)


def _new_redbook_blobs(input: JudgeInput) -> list[str]:
    init_ids = set(((input.apps_init.get("redbook") or {}).get("notes") or {}))
    notes = (input.apps.get("redbook") or {}).get("notes") or {}
    if not isinstance(notes, dict):
        return []
    blobs = []
    for key, row in notes.items():
        if str(key) in init_ids or not isinstance(row, dict):
            continue
        blobs.append(f"{row.get('title') or ''} {row.get('content') or ''}")
    return blobs


def _pdd_earbuds_amount(input: JudgeInput) -> float | None:
    for row in _new_rows(input, "pinduoduo", "orders"):
        blob = " ".join(
            f"{item.get('itemId') or ''} {item.get('title') or ''}"
            for item in (row.get("lines") or [])
            if isinstance(item, dict)
        )
        if "earbuds" not in blob.lower() and "FreeBuds" not in blob and "耳机" not in blob:
            continue
        if row.get("status") in {"pendingPayment", "cancelled"}:
            continue
        paid = float(row.get("paidAmount") or row.get("itemTotal") or row.get("autoPayAmount") or 0)
        return paid if paid > 0.01 else 202.0
    return None


def _pdd_earbuds_paid():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        amount = _pdd_earbuds_amount(input)
        return [{
            "field": "pdd_earbuds_paid",
            "expected": "new paid FreeBuds order",
            "actual": amount,
            "passed": amount is not None,
        }]
    return _check


def _vip_paid_amount(input: JudgeInput) -> float | None:
    for row in _new_rows(input, "vipshop", "orders"):
        if row.get("status") in {"pendingPayment", "pending_pay", "cancelled"}:
            continue
        paid = float(row.get("paidAmount") or row.get("actualPay") or row.get("total") or 0)
        if paid > 0.01:
            return paid
    return None


def _vip_new_paid():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        amount = _vip_paid_amount(input)
        return [{
            "field": "vipshop_paid",
            "expected": "new paid vipshop order",
            "actual": amount,
            "passed": amount is not None,
        }]
    return _check


def _wangyiyun_added(song_id: str):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        init_ids = {
            str(row.get("id"))
            for row in ((input.apps_init.get("wangyiyun") or {}).get("playlists") or [])
            if isinstance(row, dict)
        }
        created = []
        for row in ((input.apps.get("wangyiyun") or {}).get("playlists") or []):
            if not isinstance(row, dict) or str(row.get("id")) in init_ids:
                continue
            title = str(row.get("title") or "")
            songs = set(row.get("songIds") or [])
            if song_id in songs or "有何不可" in title:
                created.append({"id": row.get("id"), "title": title, "songIds": list(songs)})
        return [{
            "field": "wangyiyun_new_playlist",
            "expected": "new playlist named with 有何不可 or containing the song",
            "actual": created,
            "passed": bool(created),
        }]
    return _check


def _meituan_haidilao_tripe():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        orders = []
        for row in _new_rows(input, "meituan", "orders"):
            if row.get("restaurantId") != "r002" and "海底捞" not in str(row.get("restaurantName") or ""):
                continue
            blob = " ".join(
                str(item.get("name") or "")
                for item in (row.get("items") or [])
                if isinstance(item, dict)
            )
            if "毛肚" in blob:
                orders.append(row)
        return [{
            "field": "meituan_haidilao_tripe",
            "expected": "new 海底捞 order containing 毛肚",
            "actual": [
                {"id": r.get("id"), "restaurantName": r.get("restaurantName"), "items": r.get("items")}
                for r in _new_rows(input, "meituan", "orders")
            ],
            "passed": bool(orders),
        }]
    return _check


SPECS = [
    spec(
        "social_weibo_meituan",
        "我想在微博找到那条说火锅毛肚绝了的探店，再到美团外卖打开海底捞火锅外卖，点一份毛肚并完成下单。",
        ["weibo", "meituan"],
        [],
        ["apps.meituan.orders"],
        [],
        tags=("bench", "social_see", "local"),
        max_steps=55,
    ),
    spec(
        "local_keep_dumbbell_kapi",
        "我想在 Keep 商城看清浸塑哑铃现在卖多少钱，再到卡皮总账本按这个标价记一笔购物支出并保存，备注写上哑铃。",
        ["keep", "kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "social_see", "finance"),
        max_steps=45,
    ),
    spec(
        "local_keep_whey_kapi",
        "我想在 Keep 商城看清乳清蛋白粉现在卖多少钱，再到卡皮总账本按这个标价记一笔购物支出并保存，备注写上蛋白粉。",
        ["keep", "kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "social_see", "finance"),
        max_steps=45,
    ),
    spec(
        "work_nimbus_slack",
        "我想打开 Nimbus 付款失败那封邮件，看清失败金额，再到 Slack 全员频道发一条消息，带上 Nimbus 和这个金额。",
        ["mail", "slack"],
        [],
        ["apps.slack.messages"],
        [],
        tags=("bench", "social_see", "work"),
        max_steps=40,
    ),
    spec(
        "work_wangsiyu_slack",
        "我想在 12306 确认乘车人里有王思雨，再到 Slack 全员频道发一条消息，带上她的名字，说明沪杭行程要带上她。",
        ["railway12306", "slack"],
        [],
        ["apps.slack.messages"],
        [],
        tags=("bench", "social_see", "work"),
        max_steps=40,
    ),
    spec(
        "content_broadcast_slack",
        "我想在播客里找到标题带 MiniMax 的那一集，看清完整标题，再到 Slack 全员频道发一条消息，带上 MiniMax。",
        ["broadcast", "slack"],
        [],
        ["apps.slack.messages"],
        [],
        tags=("bench", "social_see", "content"),
        max_steps=40,
    ),
    spec(
        "content_reading_dida",
        "我想在微信读书热搜里看清第 1 名是哪本书，再到滴答清单新建待办，标题里带上这本书名里的「亏成首富」。",
        ["wechat_reading", "dida"],
        [],
        ["apps.dida.tasks"],
        [],
        tags=("bench", "social_see", "content"),
        max_steps=40,
    ),
    spec(
        "local_maoyan_dida",
        "我想在猫眼看清功夫女足任意一场的开场时间，再到滴答清单新建待办「看功夫女足」。",
        ["maoyan", "dida"],
        [],
        ["apps.dida.tasks"],
        [],
        tags=("bench", "social_see", "local"),
        max_steps=40,
    ),
    spec(
        "travel_qunaer_kapi",
        "我想在去哪儿打开南京金陵饭店，看清现在标价多少，再到卡皮总账本住房分类按这个标价记一笔支出并保存。",
        ["qunaer", "kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "social_see", "travel"),
        max_steps=45,
    ),
    spec(
        "social_weibo_dida",
        "我想在微博看台风巴威的预警说的是哪里登陆，再到滴答清单新建待办「台风巴威」，标题里带上登陆地。",
        ["weibo", "dida"],
        [],
        ["apps.dida.tasks"],
        [],
        tags=("bench", "social_see", "social"),
        max_steps=40,
    ),
    spec(
        "local_cainiao_slack",
        "我想在菜鸟打开即食鸡胸肉卷这个待取包裹，看清取件码，再到 Slack 全员频道发一条消息，带上这个取件码。",
        ["cainiao", "slack"],
        [],
        ["apps.slack.messages"],
        [],
        tags=("bench", "social_see", "local"),
        max_steps=40,
    ),
    spec(
        "work_boss_slack",
        "我想在 BOSS 打开阚云舟这条招聘者，看清他的名字和职位，再到 Slack 全员频道发一条消息，带上阚云舟。",
        ["boss", "slack"],
        [],
        ["apps.slack.messages"],
        [],
        tags=("bench", "social_see", "work"),
        max_steps=40,
    ),
    spec(
        "shop_pdd_kapi",
        "我想在拼多多打开华为 FreeBuds 那款耳机，看清现在的拼单价，再到卡皮总账本购物分类按这个标价记一笔支出并保存。",
        ["pinduoduo", "kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "social_see", "shopping"),
        max_steps=45,
    ),
    spec(
        "content_broadcast_redbook",
        "我想在播客里找到标题带 MiniMax 的那一集，看清完整标题，再到小红书发一篇笔记，正文里带上 MiniMax。",
        ["broadcast", "redbook"],
        [],
        ["redbook.notes"],
        [],
        tags=("bench", "social_see", "content"),
        max_steps=45,
    ),
    spec(
        "social_weibo_cal",
        "我想在微博看台风巴威的预警说的是哪里登陆，再到日历明天新建一个全天日程「台风巴威」，说明里写上登陆地。",
        ["weibo", "calendar"],
        [goal("calendar_new_event", title="台风巴威", startTs=_TYPHOON_DAY, allDay=True, description_contains=["浙江"])],
        ["apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "social_see", "social"),
        max_steps=45,
    ),
    spec(
        "content_reading_redbook",
        "我想在微信读书热搜里看清第 1 名是哪本书，再到小红书发一篇笔记，正文里带上「亏成首富」。",
        ["wechat_reading", "redbook"],
        [],
        ["redbook.notes"],
        [],
        tags=("bench", "social_see", "content"),
        max_steps=45,
    ),
    spec(
        "shop_pdd_buy_kapi",
        "耳机坏了，我想在拼多多把百亿补贴里那副华为 FreeBuds 买下来，付完后按实付在卡皮总账本购物分类记一笔。",
        ["pinduoduo", "kapi"],
        [],
        ["apps.pinduoduo.orders", "kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "intent_compose", "shopping"),
        max_steps=55,
    ),
    spec(
        "shop_vip_kapi",
        "唯品会购物车里那几件女装我想用专享券结掉，付完后按实付在卡皮总账本购物分类记一笔。",
        ["vipshop", "kapi"],
        [],
        ["apps.vipshop.orders", "kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "intent_compose", "shopping"),
        max_steps=55,
    ),
    spec(
        "shop_suning_kapi",
        "夏天到了，我想买台预算 1600 以内、能走补贴的 1.5 匹一级空调，先在苏宁看清统帅那台现在标价多少，按这个价在卡皮总账本购物分类记一笔。",
        ["suning", "kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "intent_compose", "shopping"),
        max_steps=45,
    ),
    spec(
        "local_cake_cal",
        "朋友生日想订 PangPang·熊(仙林万达店) 的手绘蛋糕，看好那张 6 寸动物奶油券，再到日历本周六新建全天「取蛋糕」。",
        ["dianping", "calendar"],
        [goal("calendar_new_event", title="取蛋糕", startTs=_SATURDAY, allDay=True)],
        ["apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "intent_compose", "local"),
        max_steps=45,
    ),
    spec(
        "work_boss_cal_day",
        "这周六和阚云舟有线下面试，想在 BOSS 里记下来，再到日历本周六新建全天「线下面试」。",
        ["boss", "calendar"],
        [goal("calendar_new_event", title="线下面试", startTs=_SATURDAY, allDay=True)],
        ["apps.calendar.events"],
        ["calendar__prepare_event_draft"],
        tags=("bench", "intent_compose", "work"),
        max_steps=45,
    ),
    spec(
        "content_spotify_wyy",
        "今天在 Spotify 听到许嵩的《有何不可》，想去网易云搜到这首，新建一个歌单收进去，歌单名里带上有何不可。",
        ["spotify", "wangyiyun"],
        [],
        ["apps.wangyiyun.playlists"],
        [],
        tags=("bench", "intent_compose", "content"),
        max_steps=45,
    ),
    spec(
        "work_nimbus_flomo",
        "Nimbus 那笔 200 块付款失败了，想在 flomo 记一条，带上 Nimbus 和金额。",
        ["mail", "flomo"],
        [],
        ["apps.flomo.memos"],
        [],
        tags=("bench", "intent_compose", "work"),
        max_steps=40,
    ),
    spec(
        "content_fanqie_flomo",
        "《心动过缓》读完了，想在 flomo 记一条，带上书名。",
        ["fanqiexiaoshuo", "flomo"],
        [],
        ["apps.flomo.memos"],
        [],
        tags=("bench", "intent_compose", "content"),
        max_steps=40,
    ),
    spec(
        "content_baicizhan_flomo",
        "百词斩收藏本里排在最前面的那个词，想在 flomo 记一条，英文和中文意思都写上。",
        ["baicizhan", "flomo"],
        [],
        ["apps.flomo.memos"],
        [],
        tags=("bench", "intent_compose", "content"),
        max_steps=45,
    ),
    spec(
        "content_youku_fanqietodo",
        "优酷里《寻妖记》第一部的豆瓣评分，想在番茄 ToDo 建一条待办，名称里带上这个分数。",
        ["youku", "fanqietodo"],
        [],
        ["apps.fanqietodo.todos"],
        [],
        tags=("bench", "intent_compose", "content"),
        max_steps=50,
    ),
    spec(
        "shop_xianyu_xiaorichang",
        "闲鱼那台暗紫 iPhone 14 Pro 的电池健康，想在小日常建一条待办，标题里带上这个百分比。",
        ["xianyu", "xiaorichang"],
        [],
        ["apps.xiaorichang.todos"],
        [],
        tags=("bench", "intent_compose", "shopping"),
        max_steps=45,
    ),
    spec(
        "work_slack_meet_friday",
        "Slack 教育频道里订场地那条，看清是周几，去腾讯会议约一场，主题带上那天。",
        ["slack", "tencent_meeting"],
        [],
        ["apps.tencent_meeting.scheduledMeetings"],
        ["tencent_meeting__prepare_schedule"],
        tags=("bench", "intent_compose", "work"),
        max_steps=50,
    ),
    spec(
        "shop_xianyu_a7_buy",
        "闲鱼那台索尼 A7M4，看清现在标价，支付宝余额够就买下来。",
        ["xianyu", "alipay"],
        [],
        ["apps.xianyu.orders"],
        [],
        tags=("bench", "intent_compose", "shopping"),
        max_steps=50,
    ),
    spec(
        "work_boss_greet",
        "今日活跃的硕士实习岗里排第一个，点进去沟通，发一句表达兴趣的话。",
        ["boss"],
        [],
        ["apps.boss.sessions"],
        [],
        tags=("bench", "closed_loop", "work"),
        max_steps=40,
    ),
    spec(
        "social_weibo_fav",
        "微博那条说火锅毛肚绝了的探店，去点评把王和李·海鲜火锅大排档收藏上。",
        ["weibo", "dianping"],
        [],
        ["apps.dianping.favoriteShopIds"],
        [],
        tags=("bench", "intent_compose", "local"),
        max_steps=40,
    ),
    spec(
        "kapi_dinner_shaxian",
        "晚饭沙县小吃花了 45.5，想记到卡皮总账本餐饮。",
        ["kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "ready_unrun", "finance"),
        max_steps=40,
    ),
    spec(
        "kapi_travel_two",
        "旅行账本记两笔：机场大巴 58、机场午餐 32。",
        ["kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "ready_unrun", "finance"),
        max_steps=45,
    ),
    spec(
        "kapi_budget",
        "月度总预算改 3000，餐饮单独 1200。",
        ["kapi"],
        [],
        ["kapi.budget"],
        [],
        tags=("bench", "ready_unrun", "finance"),
        max_steps=35,
    ),
    spec(
        "kapi_uniqlo_reimburse",
        "总账本里优衣库那笔要报销。",
        ["kapi"],
        [],
        ["kapi.bills"],
        [],
        tags=("bench", "ready_unrun", "finance"),
        max_steps=35,
    ),
    spec(
        "kapi_meituan_rule",
        "美团开头的账单自动归到餐饮。",
        ["kapi"],
        [],
        ["kapi.rules"],
        [],
        tags=("bench", "ready_unrun", "finance"),
        max_steps=35,
    ),
    spec(
        "kapi_company_income",
        "我想在卡皮里已有的公司账本记一笔经营收入 5000，备注项目回款，不要新建账本。",
        ["kapi"],
        [],
        ["kapi.bills"],
        ["kapi__prepare_bill_draft"],
        tags=("bench", "ready_unrun", "finance"),
        max_steps=40,
    ),
    spec(
        "alipay_zhengzhong_50",
        "给正中转 50 请客。",
        ["alipay"],
        [],
        ["alipay.transferRecords"],
        ["alipay__prepare_transfer"],
        tags=("bench", "ready_unrun", "finance"),
        max_steps=40,
    ),
    spec(
        "alipay_zhengzhong_30",
        "我想在支付宝给正中转 30 还钱。",
        ["alipay"],
        [],
        ["alipay.transferRecords"],
        ["alipay__prepare_transfer"],
        tags=("bench", "ready_unrun", "finance"),
        max_steps=40,
    ),
    spec(
        "wechat_hike_moment",
        "周末想找人一起爬山，发一条朋友圈。正文自己写，至少二十个字，并带上话题 #周末计划#。",
        ["wechat"],
        [goal("wechat_moment", contains=["爬山", "周末计划"])],
        ["wechat.moments"],
        [],
        tags=("bench", "thicken", "social"),
        max_steps=35,
    ),
    spec(
        "railway_huning_two",
        "下周三我想在12306买上海到南京的高铁，给赵宇轩买学生票、给王思雨买成人票各一张二等座，提交到待支付即可。",
        ["railway12306"],
        [],
        ["apps.railway12306.orders"],
        [],
        tags=("bench", "thicken", "travel"),
        max_steps=50,
    ),
    spec(
        "railway_g7002_jiang",
        "下周三我想在12306买上海到南京的 G7002，给蒋明辉买一张学生票二等座，提交到待支付即可。",
        ["railway12306"],
        [],
        ["apps.railway12306.orders"],
        [],
        tags=("bench", "thicken", "travel"),
        max_steps=50,
    ),
    spec(
        "railway_huning_earliest",
        "下周三我想在12306买上海到南京最早一趟高铁，给李博文、刘嘉怡各买一张二等座，提交到待支付即可。",
        ["railway12306"],
        [],
        ["apps.railway12306.orders"],
        [],
        tags=("bench", "thicken", "travel"),
        max_steps=50,
    ),
]


def _kapi_travel_two(input: JudgeInput) -> list[dict[str, Any]]:
    new_bills = [row for row in _new_rows(input, "kapi", "bills") if row.get("ledgerId") == "l_travel"]
    bus = any(
        abs(float(row.get("amount") or 0) - 58) < 0.51 and row.get("type") == "expense"
        for row in new_bills
    )
    lunch = any(
        abs(float(row.get("amount") or 0) - 32) < 0.51 and row.get("type") == "expense"
        for row in new_bills
    )
    return [{
        "field": "kapi_travel_two",
        "expected": "l_travel expense 58 and 32",
        "actual": [
            {"amount": row.get("amount"), "categoryName": row.get("categoryName"), "note": row.get("note")}
            for row in new_bills
        ],
        "passed": bus and lunch,
    }]


def _kapi_budget(input: JudgeInput) -> list[dict[str, Any]]:
    budget = (input.apps.get("kapi") or {}).get("budget") or {}
    monthly = float(budget.get("monthly") or 0)
    food = next(
        (
            float(row.get("amount") or 0)
            for row in (budget.get("categories") or [])
            if isinstance(row, dict) and row.get("categoryId") == "c_food"
        ),
        None,
    )
    return [{
        "field": "kapi_budget",
        "expected": {"monthly": 3000, "c_food": 1200},
        "actual": {"monthly": monthly, "c_food": food},
        "passed": abs(monthly - 3000) < 0.51 and food is not None and abs(food - 1200) < 0.51,
    }]


def _kapi_uniqlo_reimburse(input: JudgeInput) -> list[dict[str, Any]]:
    bills = (input.apps.get("kapi") or {}).get("bills") or []
    row = next((item for item in bills if isinstance(item, dict) and str(item.get("id")) == "b005"), None)
    return [{
        "field": "kapi_uniqlo_reimburse",
        "expected": "b005 reimburse true",
        "actual": {"id": (row or {}).get("id"), "payee": (row or {}).get("payee"), "reimburse": (row or {}).get("reimburse")},
        "passed": bool(row) and bool(row.get("reimburse")),
    }]


def _kapi_meituan_rule(input: JudgeInput) -> list[dict[str, Any]]:
    init_ids = {
        str(row.get("id"))
        for row in ((input.apps_init.get("kapi") or {}).get("rules") or [])
        if isinstance(row, dict)
    }
    created = [
        row
        for row in ((input.apps.get("kapi") or {}).get("rules") or [])
        if isinstance(row, dict) and str(row.get("id")) not in init_ids
    ]
    passed = any(
        "美团" in str(row.get("keyword") or "")
        and (row.get("categoryId") == "c_food" or row.get("categoryName") == "餐饮")
        for row in created
    )
    return [{
        "field": "kapi_meituan_rule",
        "expected": "new rule 美团 → 餐饮",
        "actual": created,
        "passed": passed,
    }]


def _wechat_hike_thick(input: JudgeInput) -> list[dict[str, Any]]:
    init_ids = {
        str(row.get("id"))
        for row in ((input.apps_init.get("wechat") or {}).get("moments") or [])
        if isinstance(row, dict)
    }
    created = [
        row
        for row in ((input.apps.get("wechat") or {}).get("moments") or [])
        if isinstance(row, dict) and str(row.get("id")) not in init_ids
    ]
    texts = [str(row.get("content") or "") for row in created]
    passed = any(
        "爬山" in text
        and "周末计划" in text
        and len(text.replace(" ", "").replace("\n", "")) >= 20
        for text in texts
    )
    return [{
        "field": "wechat_hike_thick",
        "expected": "new moment ≥20 chars containing 爬山 and 周末计划",
        "actual": texts,
        "passed": passed,
    }]


def _railway_new_order(passengers: list[str], train_no: str | None = None, ticket_types: dict[str, str] | None = None):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        matches = []
        for row in _new_rows(input, "railway12306", "orders"):
            tickets = [t for t in (row.get("tickets") or []) if isinstance(t, dict)]
            names = {str(ticket.get("passengerName") or "") for ticket in tickets}
            seats = " ".join(str(ticket.get("seatType") or "") for ticket in tickets)
            by_name = {
                str(ticket.get("passengerName") or ""): str(ticket.get("ticketType") or "")
                for ticket in tickets
            }
            route = f"{row.get('fromStation') or ''} {row.get('toStation') or ''}"
            if not all(name in names for name in passengers):
                continue
            if "二等" not in seats:
                continue
            if "上海" not in route or "南京" not in route:
                continue
            if train_no and str(row.get("trainNo") or "") != train_no:
                continue
            if row.get("status") in {"cancelled", "canceled"}:
                continue
            if ticket_types:
                ok_types = True
                for name, expected in ticket_types.items():
                    actual = by_name.get(name, "")
                    if expected not in actual:
                        ok_types = False
                        break
                if not ok_types:
                    continue
            matches.append(row)
        return [{
            "field": "railway_new_order",
            "expected": {"passengers": passengers, "route": "上海-南京", "seat": "二等座", "trainNo": train_no, "ticketTypes": ticket_types},
            "actual": [
                {
                    "trainNo": row.get("trainNo"),
                    "fromStation": row.get("fromStation"),
                    "toStation": row.get("toStation"),
                    "status": row.get("status"),
                    "tickets": row.get("tickets"),
                }
                for row in _new_rows(input, "railway12306", "orders")
            ],
            "passed": bool(matches),
        }]
    return _check


def _kapi_company_income(input: JudgeInput) -> list[dict[str, Any]]:
    matches = [
        row
        for row in _new_rows(input, "kapi", "bills")
        if row.get("ledgerId") == "l_company"
        and row.get("type") == "income"
        and abs(float(row.get("amount") or 0) - 5000) < 0.51
    ]
    note_ok = any("回款" in str(row.get("note") or "") for row in matches)
    return [{
        "field": "kapi_company_income",
        "expected": "l_company income 5000 项目回款",
        "actual": [
            {"amount": row.get("amount"), "note": row.get("note"), "categoryName": row.get("categoryName")}
            for row in matches
        ],
        "passed": bool(matches) and note_ok,
    }]


EXTRA_CHECKS = {
    "social_weibo_meituan": _meituan_haidilao_tripe(),
    "local_keep_dumbbell_kapi": lambda input: _kapi_expense(39.9, category="购物")(input) + [{
        "field": "kapi_note_dumbbell",
        "expected": "哑铃",
        "actual": [row.get("note") for row in _new_rows(input, "kapi", "bills")],
        "passed": any("哑铃" in str(row.get("note") or "") for row in _new_rows(input, "kapi", "bills")),
    }],
    "local_keep_whey_kapi": lambda input: _kapi_expense(299.0, category="购物")(input) + [{
        "field": "kapi_note_whey",
        "expected": "蛋白粉",
        "actual": [row.get("note") for row in _new_rows(input, "kapi", "bills")],
        "passed": any("蛋白" in str(row.get("note") or "") for row in _new_rows(input, "kapi", "bills")),
    }],
    "work_nimbus_slack": lambda input: [{
        "field": "slack_nimbus",
        "expected": "#general contains Nimbus and 200",
        "actual": [
            {"text": r.get("text")}
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general"
        ],
        "passed": any(
            "200" in str(r.get("text") or "") and "nimbus" in str(r.get("text") or "").lower()
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general" and not r.get("deleted")
        ),
    }],
    "work_wangsiyu_slack": lambda input: [{
        "field": "slack_wangsiyu",
        "expected": "#general contains 王思雨",
        "actual": [
            {"text": r.get("text")}
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general"
        ],
        "passed": any(
            "王思雨" in str(r.get("text") or "")
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general" and not r.get("deleted")
        ),
    }],
    "content_broadcast_slack": lambda input: [{
        "field": "slack_minimax",
        "expected": "#general contains MiniMax",
        "actual": [
            {"text": r.get("text")}
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general"
        ],
        "passed": any(
            "minimax" in str(r.get("text") or "").lower()
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general" and not r.get("deleted")
        ),
    }],
    "content_reading_dida": lambda input: [{
        "field": "dida_reading",
        "expected": "todo title contains 亏成首富",
        "actual": [r.get("title") for r in _new_rows(input, "dida", "tasks")],
        "passed": any("亏成首富" in str(r.get("title") or "") for r in _new_rows(input, "dida", "tasks")),
    }],
    "local_maoyan_dida": lambda input: [{
        "field": "dida_kungfu",
        "expected": "看功夫女足",
        "actual": [r.get("title") for r in _new_rows(input, "dida", "tasks")],
        "passed": any("功夫女足" in str(r.get("title") or "") for r in _new_rows(input, "dida", "tasks")),
    }],
    "travel_qunaer_kapi": _kapi_expense(588.0, category="住房"),
    "social_weibo_dida": lambda input: [{
        "field": "dida_typhoon",
        "expected": "todo contains 巴威 and 浙江",
        "actual": [r.get("title") for r in _new_rows(input, "dida", "tasks")],
        "passed": any(
            "巴威" in str(r.get("title") or "") and "浙江" in str(r.get("title") or "")
            for r in _new_rows(input, "dida", "tasks")
        ),
    }],
    "local_cainiao_slack": lambda input: [{
        "field": "slack_pickup",
        "expected": "#general contains 583920",
        "actual": [
            {"text": r.get("text")}
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general"
        ],
        "passed": any(
            "583920" in str(r.get("text") or "")
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general" and not r.get("deleted")
        ),
    }],
    "work_boss_slack": lambda input: [{
        "field": "slack_kan",
        "expected": "#general contains 阚云舟",
        "actual": [
            {"text": r.get("text")}
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general"
        ],
        "passed": any(
            "阚云舟" in str(r.get("text") or "")
            for r in _new_rows(input, "slack", "messages")
            if r.get("convId") == "c_general" and not r.get("deleted")
        ),
    }],
    "shop_pdd_kapi": _kapi_expense(202.0, category="购物"),
    "content_broadcast_redbook": lambda input: [{
        "field": "redbook_minimax",
        "expected": "new redbook note contains MiniMax",
        "actual": _new_redbook_blobs(input),
        "passed": any("minimax" in blob.lower() for blob in _new_redbook_blobs(input)),
    }],
    "content_reading_redbook": lambda input: [{
        "field": "redbook_reading",
        "expected": "new redbook note contains 亏成首富",
        "actual": _new_redbook_blobs(input),
        "passed": any("亏成首富" in blob for blob in _new_redbook_blobs(input)),
    }],
    "shop_pdd_buy_kapi": lambda input: _pdd_earbuds_paid()(input) + _kapi_matches_source(_pdd_earbuds_amount, category="购物")(input),
    "shop_vip_kapi": lambda input: _vip_new_paid()(input) + _kapi_matches_source(_vip_paid_amount, category="购物")(input),
    "shop_suning_kapi": _kapi_expense(1529.15, category="购物"),
    "content_spotify_wyy": _wangyiyun_added("s_005"),
    "work_nimbus_flomo": lambda input: [{
        "field": "flomo_nimbus",
        "expected": "new flomo memo contains Nimbus and 200",
        "actual": [row.get("content") for row in _new_rows(input, "flomo", "memos")],
        "passed": any(
            "200" in str(row.get("content") or "") and "nimbus" in str(row.get("content") or "").lower()
            for row in _new_rows(input, "flomo", "memos")
            if not row.get("deleted")
        ),
    }],
    "content_fanqie_flomo": lambda input: [{
        "field": "flomo_fanqie",
        "expected": "new flomo memo contains 心动过缓",
        "actual": [row.get("content") for row in _new_rows(input, "flomo", "memos")],
        "passed": any(
            "心动过缓" in str(row.get("content") or "")
            for row in _new_rows(input, "flomo", "memos")
            if not row.get("deleted")
        ),
    }],
    "content_baicizhan_flomo": lambda input: [{
        "field": "flomo_baicizhan",
        "expected": "new flomo memo contains prudent and 谨慎",
        "actual": [row.get("content") for row in _new_rows(input, "flomo", "memos")],
        "passed": any(
            "prudent" in str(row.get("content") or "").lower()
            and ("谨慎" in str(row.get("content") or "") or "精明" in str(row.get("content") or ""))
            for row in _new_rows(input, "flomo", "memos")
            if not row.get("deleted")
        ),
    }],
    "content_youku_fanqietodo": lambda input: [{
        "field": "fanqietodo_youku",
        "expected": "new todo name contains 8.3",
        "actual": [row.get("name") for row in _new_rows(input, "fanqietodo", "todos")],
        "passed": any("8.3" in str(row.get("name") or "") for row in _new_rows(input, "fanqietodo", "todos")),
    }],
    "shop_xianyu_xiaorichang": lambda input: [{
        "field": "xiaorichang_battery",
        "expected": "new xiaorichang todo title contains 92",
        "actual": [row.get("title") for row in _new_rows(input, "xiaorichang", "todos")],
        "passed": any("92" in str(row.get("title") or "") for row in _new_rows(input, "xiaorichang", "todos")),
    }],
    "work_slack_meet_friday": lambda input: [{
        "field": "tencent_friday",
        "expected": "new meeting title contains 周五",
        "actual": [
            row.get("title") or row.get("subject")
            for row in _new_rows(input, "tencent_meeting", "scheduledMeetings")
        ],
        "passed": any(
            "周五" in str(row.get("title") or row.get("subject") or "")
            for row in _new_rows(input, "tencent_meeting", "scheduledMeetings")
        ),
    }],
    "shop_xianyu_a7_buy": lambda input: [{
        "field": "xianyu_a7_paid",
        "expected": "new paid A7M4 order",
        "actual": [
            {"id": row.get("id"), "itemId": row.get("itemId"), "title": row.get("title"), "status": row.get("status")}
            for row in _new_rows(input, "xianyu", "orders")
        ],
        "passed": any(
            (
                str(row.get("itemId") or "") == "i1"
                or "A7M4" in str(row.get("title") or "")
                or "a7m4" in str(row.get("title") or "").lower()
            )
            and row.get("status") not in {"pendingPayment", "cancelled"}
            for row in _new_rows(input, "xianyu", "orders")
        ),
    }],
    "social_weibo_fav": lambda input: [{
        "field": "dianping_wangheli_fav",
        "expected": "wangheli in favoriteShopIds",
        "actual": (input.apps.get("dianping") or {}).get("favoriteShopIds"),
        "passed": "wangheli" in ((input.apps.get("dianping") or {}).get("favoriteShopIds") or []),
    }],
    "kapi_dinner_shaxian": lambda input: _kapi_expense(45.5, category="餐饮")(input) + [{
        "field": "kapi_note_shaxian",
        "expected": "沙县",
        "actual": [row.get("note") or row.get("payee") for row in _new_rows(input, "kapi", "bills")],
        "passed": any(
            "沙县" in str(row.get("note") or "") or "沙县" in str(row.get("payee") or "")
            for row in _new_rows(input, "kapi", "bills")
        ),
    }],
    "kapi_travel_two": _kapi_travel_two,
    "kapi_budget": _kapi_budget,
    "kapi_uniqlo_reimburse": _kapi_uniqlo_reimburse,
    "kapi_meituan_rule": _kapi_meituan_rule,
    "kapi_company_income": _kapi_company_income,
    "alipay_zhengzhong_50": _alipay_new_transfer("正中", 50),
    "alipay_zhengzhong_30": _alipay_new_transfer("正中", 30),
    "wechat_hike_moment": _wechat_hike_thick,
    "railway_huning_two": _railway_new_order(["赵宇轩", "王思雨"], train_no=None, ticket_types={"赵宇轩": "学生", "王思雨": "成人"}),
    "railway_g7002_jiang": _railway_new_order(["蒋明辉"], train_no="G7002", ticket_types={"蒋明辉": "学生"}),
    "railway_huning_earliest": _railway_new_order(["李博文", "刘嘉怡"], train_no="G7032"),
    "work_boss_cal_day": lambda input: [{
        "field": "boss_saturday_offline",
        "expected": {"bossId": "b1", "type": "offline", "date": "7月18日"},
        "actual": list((input.apps.get("boss") or {}).get("interviews") or []),
        "passed": any(
            row.get("bossId") == "b1"
            and row.get("type") == "offline"
            and "18" in str(row.get("date") or "")
            for row in ((input.apps.get("boss") or {}).get("interviews") or [])
        ),
    }],
    "work_boss_greet": lambda input: [{
        "field": "boss_new_greet",
        "expected": "new boss session initiated by me with a text message",
        "actual": [
            {
                "id": row.get("id"),
                "initiatedByMe": row.get("initiatedByMe"),
                "jobId": row.get("jobId"),
                "texts": [
                    msg.get("text")
                    for msg in (row.get("messages") or [])
                    if isinstance(msg, dict) and msg.get("from") == "me"
                ],
            }
            for row in _new_rows(input, "boss", "sessions")
        ],
        "passed": any(
            row.get("initiatedByMe")
            and any(
                isinstance(msg, dict)
                and msg.get("from") == "me"
                and str(msg.get("text") or "").strip()
                for msg in (row.get("messages") or [])
            )
            for row in _new_rows(input, "boss", "sessions")
        ),
    }],
}

build_task_classes(
    SPECS,
    EXTRA_CHECKS,
    module_globals=globals(),
    module_name=__name__,
)
