# -*- coding: utf-8 -*-
"""卡皮记账种子数据生成器。数据为合成，不含真实个人信息。"""
import json
from pathlib import Path

OUT = Path(__file__).parent.parent / "data" / "defaults.json"

# 基准：2026-05。绝对 Unix 毫秒（UTC+8）。
# 2026-05-01 00:00:00 UTC+8 = 1777564800000
MAY1 = 1777564800000
DAY = 86400000
MONTH_OFFSETS = {5: 0, 6: 31, 7: 61, 8: 92}


def D(month, day, hour=12, minute=0):
    return MAY1 + (MONTH_OFFSETS[month] + day - 1) * DAY + hour * 3600000 + minute * 60000


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


def bill(bid, cid, amount, note, month, day, hour, minute, btype="expense", payee=""):
    c = cat(cid)
    return {
        "id": bid, "type": btype, "categoryId": c["id"], "categoryName": c["name"],
        "icon": c["icon"], "color": c["color"], "amount": amount, "note": note,
        "date": D(month, day, hour, minute), "ledgerId": "l_main", "accountId": None,
        "payee": payee, "tags": [], "discount": None, "refund": None,
        "reimburse": False, "excludeFlow": False, "excludeBudget": False,
    }


# 连续四个月的合成账单，覆盖月历、月/年统计和分类下钻。
BILLS = [
    bill("b001", "c_food", 70.00, "午餐 黄焖鸡米饭", 8, 14, 12, 47, payee="老乡鸡"),
    bill("b002", "c_food", 31.20, "晚餐 麻辣烫", 8, 13, 19, 5, payee="杨国福"),
    bill("b003", "c_milktea", 18.00, "奶茶 葡萄冰沙", 8, 13, 15, 30, payee="喜茶"),
    bill("b004", "c_transport", 12.50, "地铁通勤", 8, 12, 8, 40),
    bill("b005", "c_shopping", 268.00, "夏季T恤两件", 8, 10, 21, 12, payee="优衣库"),
    bill("b006", "c_food", 25.20, "早餐 包子豆浆", 8, 10, 8, 10),
    bill("b007", "c_grocery", 88.60, "周末买菜", 8, 8, 10, 30, payee="盒马"),
    bill("b008", "c_coffee", 32.00, "拿铁 大杯", 8, 7, 14, 0, payee="瑞幸"),
    bill("b009", "c_leisure", 45.00, "电影票", 8, 6, 20, 0, payee="万达影城"),
    bill("b010", "c_housing", 1500.00, "八月房租分摊", 8, 5, 9, 0),
    bill("b011", "c_medical", 56.00, "感冒药", 8, 4, 18, 20, payee="老百姓大药房"),
    bill("b012", "c_fruit", 23.80, "周末水果", 8, 3, 19, 30, payee="百果园"),
    bill("b013", "c_transport", 28.00, "打车回家", 8, 2, 23, 10, payee="滴滴出行"),
    bill("b014", "i_salary", 12000.00, "七月工资", 8, 10, 10, 0, btype="income"),

    bill("b015", "c_housing", 1500.00, "七月房租分摊", 7, 5, 9, 0),
    bill("b016", "c_food", 46.00, "周五聚餐", 7, 31, 19, 20, payee="外婆家"),
    bill("b017", "c_transport", 12.50, "地铁通勤", 7, 29, 8, 35),
    bill("b018", "c_grocery", 126.40, "一周食材", 7, 26, 16, 10, payee="盒马"),
    bill("b019", "c_coffee", 29.00, "冰美式", 7, 23, 14, 15, payee="Manner"),
    bill("b020", "c_shopping", 399.00, "运动鞋", 7, 18, 20, 5, payee="耐克"),
    bill("b021", "c_food", 34.50, "工作日晚餐", 7, 15, 18, 50, payee="和府捞面"),
    bill("b022", "c_pet", 168.00, "猫粮", 7, 11, 12, 30, payee="宠物生活馆"),
    bill("b023", "c_leisure", 128.00, "音乐节门票", 7, 7, 21, 0),
    bill("b024", "i_salary", 12000.00, "六月工资", 7, 10, 10, 0, btype="income"),

    bill("b025", "c_housing", 1500.00, "六月房租分摊", 6, 5, 9, 0),
    bill("b026", "c_food", 42.00, "火锅 AA", 6, 28, 19, 30, payee="海底捞"),
    bill("b027", "c_study", 99.00, "在线课程", 6, 24, 13, 0),
    bill("b028", "c_transport", 28.00, "打车回家", 6, 20, 23, 10, payee="滴滴出行"),
    bill("b029", "c_snack", 39.90, "零食大礼包", 6, 17, 16, 45, payee="良品铺子"),
    bill("b030", "c_food", 70.00, "午餐 黄焖鸡米饭", 6, 12, 12, 47, payee="老乡鸡"),
    bill("b031", "c_medical", 56.00, "常用药", 6, 9, 18, 20, payee="老百姓大药房"),
    bill("b032", "c_milktea", 18.00, "葡萄冰沙", 6, 6, 15, 30, payee="喜茶"),
    bill("b033", "i_salary", 12000.00, "五月工资", 6, 10, 10, 0, btype="income"),

    bill("b034", "c_housing", 1500.00, "五月房租分摊", 5, 5, 9, 0),
    bill("b035", "c_food", 36.00, "晚餐盖饭", 5, 29, 19, 10, payee="食其家"),
    bill("b036", "c_transport", 12.50, "地铁通勤", 5, 26, 8, 40),
    bill("b037", "c_grocery", 96.80, "周末买菜", 5, 22, 10, 30, payee="盒马"),
    bill("b038", "c_leisure", 45.00, "电影票", 5, 17, 20, 0, payee="万达影城"),
    bill("b039", "c_shopping", 218.00, "床上四件套", 5, 12, 20, 10, payee="宜家"),
    bill("b040", "c_food", 24.00, "早餐", 5, 8, 8, 15, payee="全家"),
    bill("b041", "i_salary", 12000.00, "四月工资", 5, 10, 10, 0, btype="income"),
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
        {"id": "l_company", "name": "公司账本", "type": "shared", "cover": "🏢", "includeInTotal": False},
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
        "monthly": 2260,
        "daily": {},
        "categories": [
            {"categoryId": "c_food", "amount": 1500},
            {"categoryId": "c_transport", "amount": 400},
            {"categoryId": "c_housing", "amount": 360},
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
         "ts": D(8, 14, 9, 0)},
        {"id": "m2", "role": "user", "text": "查看我的今日分析总结", "ts": D(8, 14, 12, 47)},
        {"id": "m3", "role": "ai",
         "text": "由于今日剩余235.74元,预计明日预算可用344.72元(其中13.1元来自今日剩余分摊)。",
         "ts": D(8, 14, 12, 48), "calendarCard": True},
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
