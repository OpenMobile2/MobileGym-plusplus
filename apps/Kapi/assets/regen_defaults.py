# -*- coding: utf-8 -*-
"""卡皮记账 种子数据生成器。数据为合成,不含真实个人信息(2026-06 用户强调)。"""
import json
from pathlib import Path

OUT = Path(__file__).parent.parent / "data" / "defaults.json"

# 基准:2026-06。绝对 Unix 毫秒(UTC+8)。
# 2026-06-01 00:00:00 UTC+8 = 1780243200000
JUNE1 = 1780243200000
DAY = 86400000


def D(day, hour=12, minute=0):
    return JUNE1 + (day - 1) * DAY + hour * 3600000 + minute * 60000


A = lambda f: f"/@app-assets/Kapi/avatars/{f}"

EXPENSE_CATS = [
    ("c_food", "餐饮", "IcCatFood", "#FFB23E",
     [{"id": "cs_break", "name": "早餐"}, {"id": "cs_lunch", "name": "午餐"},
      {"id": "cs_dinner", "name": "晚餐"}, {"id": "cs_fruit", "name": "水果"},
      {"id": "cs_indulge", "name": "放纵餐"}]),
    ("c_shopping", "购物", "IcCatShopping", "#5B8CFF", None),
    ("c_transport", "交通", "IcCatTransport", "#FF8A3D", None),
    ("c_housing", "住房", "IcCatHousing", "#FF7A59", None),
    ("c_fastfood", "快餐", "IcCatFastFood", "#FFC24B", None),
    ("c_bbq", "烧烤", "IcCatBBQ", "#FF6B4A", None),
    ("c_hotpot", "火锅", "IcCatHotpot", "#FF5C5C", None),
    ("c_milktea", "奶茶", "IcCatMilkTea", "#C58BFF", None),
    ("c_coffee", "咖啡", "IcCatCoffee", "#B07A4F", None),
    ("c_drink", "饮品", "IcCatDrink", "#46C7E8", None),
    ("c_dessert", "甜品", "IcCatDessert", "#FF9BC4", None),
    ("c_fruit", "水果", "IcCatFruit", "#6FCF6B", None),
    ("c_snack", "零食", "IcCatSnack", "#FFB661", None),
    ("c_grocery", "做饭食材", "IcCatGrocery", "#7BC86C", None),
    ("c_leisure", "休闲娱乐", "IcCatLeisure", "#7C8BFF", None),
    ("c_medical", "医疗健康", "IcCatMedical", "#5AD0C0", None),
    ("c_study", "学习办公", "IcCatStudy", "#5B9BFF", None),
    ("c_pet", "宠物", "IcCatPet", "#FFA552", None),
    ("c_baby", "母婴", "IcCatBaby", "#FF96B0", None),
    ("c_transfer", "资金往来", "IcCatTransfer", "#9AA4B2", None),
    ("c_insurance", "保险理财", "IcCatInsurance", "#4FB7F0", None),
    ("c_other", "其他支出", "IcCatOther", "#AAB2C0", None),
]

INCOME_CATS = [
    ("i_salary", "职业收入", "IcCatSalary", "#FF8A3D"),
    ("i_business", "经营收入", "IcCatBusiness", "#FFB23E"),
    ("i_invest", "投资收益", "IcCatInvest", "#6FCF6B"),
    ("i_parttime", "兼职收入", "IcCatPartTime", "#5B8CFF"),
    ("i_gift", "人情收入", "IcCatGift", "#FF9BC4"),
    ("i_prize", "中奖收入", "IcCatPrize", "#FFC24B"),
    ("i_windfall", "意外收入", "IcCatWindfall", "#C58BFF"),
    ("i_other", "其他收入", "IcCatOtherIncome", "#AAB2C0"),
]


def cat(cid):
    for c in EXPENSE_CATS:
        if c[0] == cid:
            return {"id": c[0], "name": c[1], "icon": c[2], "color": c[3]}
    for c in INCOME_CATS:
        if c[0] == cid:
            return {"id": c[0], "name": c[1], "icon": c[2], "color": c[3]}
    raise KeyError(cid)


def bill(bid, cid, amount, note, day, hour, minute, btype="expense", payee=""):
    c = cat(cid)
    return {
        "id": bid, "type": btype, "categoryId": c["id"], "categoryName": c["name"],
        "icon": c["icon"], "color": c["color"], "amount": amount, "note": note,
        "date": D(day, hour, minute), "ledgerId": "l_main", "accountId": None,
        "payee": payee, "tags": [], "discount": None, "refund": None,
        "reimburse": False, "excludeFlow": False, "excludeBudget": False,
    }


# 6月账单(合成,支出为主),覆盖 1-12 日供日历/统计/分类下钻
BILLS = [
    bill("b001", "c_food", 70.00, "午餐 黄焖鸡米饭", 12, 12, 47, payee="老乡鸡"),
    bill("b002", "c_food", 31.20, "晚餐 麻辣烫", 11, 19, 5, payee="杨国福"),
    bill("b003", "c_milktea", 18.00, "奶茶 葡萄冰沙", 11, 15, 30, payee="喜茶"),
    bill("b004", "c_transport", 12.50, "地铁通勤", 10, 8, 40),
    bill("b005", "c_shopping", 268.00, "夏季T恤两件", 9, 21, 12, payee="优衣库"),
    bill("b006", "c_food", 25.20, "早餐 包子豆浆", 9, 8, 10),
    bill("b007", "c_grocery", 88.60, "周末买菜", 8, 10, 30, payee="盒马"),
    bill("b008", "c_coffee", 32.00, "拿铁 大杯", 8, 14, 0, payee="瑞幸"),
    bill("b009", "c_leisure", 45.00, "电影票", 7, 20, 0, payee="万达影城"),
    bill("b010", "c_housing", 1500.00, "六月房租分摊", 5, 9, 0),
    bill("b011", "c_medical", 56.00, "感冒药", 5, 18, 20, payee="老百姓大药房"),
    bill("b012", "c_fruit", 23.80, "车厘子半斤", 4, 19, 30, payee="百果园"),
    bill("b013", "c_snack", 39.90, "零食大礼包", 3, 16, 45, payee="良品铺子"),
    bill("b014", "c_transport", 28.00, "打车回家", 3, 23, 10, payee="滴滴出行"),
    bill("b015", "c_study", 99.00, "在线课程", 2, 13, 0),
    bill("b016", "c_food", 42.00, "火锅 AA", 1, 19, 30, btype="expense", payee="海底捞"),
    bill("b017", "i_salary", 12000.00, "五月工资", 10, 10, 0, btype="income"),
    bill("b018", "i_parttime", 600.00, "周末兼职", 6, 18, 0, btype="income"),
]

data = {
    "user": {
        "id": "u_self", "nick": "卡皮用户", "avatar": A("me.svg"),
        "gender": "保密", "phone": "188****0000", "appVersion": "1.0.0",
        "recordDays": 189, "totalRecords": 1143, "streakDays": 145,
    },
    "ledgers": [
        {"id": "l_main", "name": "总账本", "type": "personal", "cover": "📒", "includeInTotal": True},
        {"id": "l_travel", "name": "旅行账本", "type": "personal", "cover": "✈️", "includeInTotal": True},
    ],
    "currentLedgerId": "l_main",
    "accounts": [],
    "categories": {
        "expense": [
            {"id": c[0], "name": c[1], "icon": c[2], "color": c[3],
             **({"subs": c[4]} if c[4] else {})}
            for c in EXPENSE_CATS
        ],
        "income": [
            {"id": c[0], "name": c[1], "icon": c[2], "color": c[3]} for c in INCOME_CATS
        ],
    },
    "bills": BILLS,
    "budget": {
        "monthly": 9000,
        "daily": {},
        "categories": [
            {"categoryId": "c_food", "amount": 1500},
            {"categoryId": "c_transport", "amount": 400},
        ],
    },
    "rules": [
        {"id": "r1", "kind": "payee", "keyword": "肯德基", "categoryId": "c_food", "categoryName": "餐饮"},
        {"id": "r2", "kind": "payee", "keyword": "滴滴", "categoryId": "c_transport", "categoryName": "交通"},
        {"id": "r3", "kind": "content", "keyword": "电影", "categoryId": "c_leisure", "categoryName": "休闲娱乐"},
    ],
    "aiMessages": [
        {"id": "m1", "role": "ai",
         "text": "你好呀!我是胖咪~ 可以帮你记账、复盘消费、做趣味测试。试试点下面的灯泡或魔棒,或者直接问我。",
         "ts": D(12, 9, 0)},
        {"id": "m2", "role": "user", "text": "查看我的今日分析总结", "ts": D(12, 12, 47)},
        {"id": "m3", "role": "ai",
         "text": "由于今日剩余235.74元,预计明日预算可用344.72元(其中13.1元来自今日剩余分摊)。",
         "ts": D(12, 12, 48), "calendarCard": True},
    ],
    "searchHistory": ["餐饮", "奶茶", "房租"],
    "settings": {
        "monthStartDay": 1, "currency": "人民币 ¥", "catReplyStyle": "默认",
        "flags": {"autoScreenshot": False, "location": True, "coupon": True, "push": True},
        "pushItems": {"budgetAlert": True, "billRemind": True, "weeklyReport": False},
    },
    "amountVisible": True,
    "topCardView": "budget",
    "_activeBillId": None,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK: defaults.json 生成完毕 ({OUT.stat().st_size} bytes, {len(BILLS)} bills)")
