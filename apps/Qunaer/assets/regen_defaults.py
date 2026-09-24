#!/usr/bin/env python3
"""Generate Qunaer's small mutable runtime seed data."""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "defaults.json"
I = lambda name: f"/@app-assets/Qunaer/images/{name}.png"

hotels = [
    {"id": f"h{i}", "name": name, "score": score, "reviews": reviews, "distance": distance, "price": price, "image": I(f"hotel_{i}")}
    for i, (name, score, reviews, distance, price) in enumerate(
        [
            ("汉庭酒店(烟台火车站烟台港客运站店)", 4.9, 1243, "距中心12.7公里", 368),
            ("美豪酒店(烟台大学迎春大街店)", 4.5, 734, "距市中心8.2公里", 305),
            ("烟台迎宾丽呈酒店", 4.8, 8851, "距市中心6.1公里", 229),
            ("南京金陵饭店", 4.9, 9602, "新街口地铁站旁", 588),
            ("南京维景国际大酒店", 4.8, 7231, "近明故宫地铁站", 498),
            ("烟台青年旅舍", 4.6, 891, "火车站步行8分钟", 99),
        ],
        start=1,
    )
]

scenics = [
    {"id": f"s{i}", "name": name, "score": score, "distance": distance, "price": price, "image": I(f"scenic_{i}")}
    for i, (name, score, distance, price) in enumerate(
        [
            ("南京欢乐谷", 4.6, "116条点评", 153.7),
            ("阳山碑材", 4.6, "4.9km·汤山温泉", 29.6),
            ("江苏园博园", 4.4, "5.1km·园博园度假区", 37.4),
            ("明孝陵景区", 4.8, "钟山风景区", 60),
            ("南京海底世界", 4.7, "中山陵附近", 158),
            ("秦淮河画舫", 4.6, "夫子庙景区", 78),
        ],
        start=1,
    )
]

world = [
    {"id": f"w{i}", "title": title, "author": author, "likes": likes, "image": I(f"world_{i}")}
    for i, (title, author, likes) in enumerate(
        [
            ("在烟台看一场橘子海日落", "小驼去旅行", 328),
            ("江南古镇两天一夜慢游路线", "度假研究所", 1290),
            ("公路尽头是雪山与草原", "出发吧阿北", 886),
            ("南京夜市必吃清单", "咕噜旅行家", 732),
            ("带孩子走进夏日森林", "亲子旅行局", 421),
            ("暑假海岛浮潜攻略", "看世界编辑部", 2359),
        ],
        start=1,
    )
]

orders = [
    {"id": "o_ticket", "kind": "门票", "title": "灵谷景区门票成人票", "status": "待支付", "amount": 65.2, "date": "2026-08-12"},
    {"id": "o_hotel", "kind": "酒店", "title": "汉庭酒店(烟台火车站店)", "status": "待出行", "amount": 368, "date": "2026-08-26"},
    {"id": "o_flight", "kind": "机票", "title": "广州 → 长沙 CZ3308", "status": "待支付", "amount": 318, "date": "2026-08-26"},
    {"id": "o_train", "kind": "火车票", "title": "南京 → 鞍山 G1234", "status": "待出行", "amount": 244, "date": "2026-08-12"},
    {"id": "o_tour", "kind": "跟团游", "title": "云南昆明大理6日5晚", "status": "已完成", "amount": 3280, "date": "2026-06-18"},
]

data = {
    "session": {"loggedIn": True, "name": "去哪儿用户", "level": "V4 铂金会员", "phone": "139****0000", "avatar": I("avatar_1_v2")},
    "search": {"fromCity": "广州", "toCity": "长沙", "hotelCity": "烟台", "trainFrom": "南京", "trainTo": "鞍山", "departDate": "2026-08-26", "returnDate": "2026-08-28"},
    "passengers": [
        {"id": "p1", "name": "骆小驼", "type": "成人票", "idNo": "110101********0011", "phone": "139****0000"},
        {"id": "p2", "name": "骆小雨", "type": "学生票", "idNo": "110101********0022", "phone": "139****0001"},
    ],
    "hotels": hotels,
    "scenics": scenics,
    "world": world,
    "orders": orders,
    "favorites": [],
    "actionLog": [],
    "selected": {},
    "lastFeedback": "",
    "lastOrderId": "o_ticket",
    "settings": {"language": "system", "tripSync": True},
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
