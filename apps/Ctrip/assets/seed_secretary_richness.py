#!/usr/bin/env python3
"""Insert foil Shanghai–Hangzhou trains and ICC hotels into Ctrip defaults.

Keeps existing gold rows (G7301, h_qinghe_icc). New second-class prices stay
>=100 so ctrip_v4_09's <100 scan is unchanged. New hotel prices stay >=398
or score <4.7 so ctrip_v4_08's <300 AND >=4.7 scan is unchanged.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "data" / "defaults.json"

IMGS = {
    "atour": "/@app-assets/Ctrip/gen/hotel_atour.png",
    "atour_lobby": "/@app-assets/Ctrip/gen/hotel_atour_lobby.png",
    "atour_room": "/@app-assets/Ctrip/gen/hotel_atour_room.png",
    "quanji": "/@app-assets/Ctrip/gen/hotel_quanji.png",
    "quanji_room": "/@app-assets/Ctrip/gen/hotel_quanji_room.png",
    "hanting": "/@app-assets/Ctrip/gen/hotel_hanting.png",
}


def room(hid: str, suffix: str, name: str, price: int, breakfast: str, bed="1张1.8米大床") -> dict:
    return {
        "id": f"{hid}_{suffix}",
        "name": name,
        "image": IMGS["atour_room"],
        "bed": bed,
        "area": "24㎡",
        "occupancy": "2人入住",
        "breakfast": breakfast,
        "price": price,
        "cancelPolicy": "入住当天18:00前可免费取消",
        "remaining": 3,
    }


def hotel(
    hid: str,
    name: str,
    *,
    star: int,
    score: float,
    reviews: int,
    price: int,
    old: int,
    rank: str,
    cover: str,
    rooms: list[dict],
) -> dict:
    return {
        "id": hid,
        "name": name,
        "image": cover,
        "gallery": [cover, IMGS["atour_room"]],
        "star": star,
        "score": score,
        "reviewCount": reviews,
        "city": "杭州",
        "district": "西湖国际会议中心",
        "tags": ["会议中心", "含早", "免费停车场"],
        "price": price,
        "oldPrice": old,
        "rankLabel": rank,
        "openYear": "2022年开业",
        "facilities": ["免费停车场", "会议室", "含早"],
        "rooms": rooms,
    }


def review(hid: str, user: str, content: str) -> list[dict]:
    return [{
        "id": f"{hid}_r0",
        "user": user,
        "avatar": "/@app-assets/Ctrip/gen/avatar_1.png",
        "level": "铂金贵宾",
        "score": 4.6,
        "date": "2026年06月入住",
        "roomType": "大床房",
        "content": content,
        "images": ["/@app-assets/Ctrip/gen/review_room.png"],
    }]


def train(tid: str, no: str, frm: str, to: str, depart: str, arrive: str, duration: str, typ: str, second: int) -> dict:
    first = int(second * 1.6)
    biz = int(second * 3.2)
    return {
        "id": tid,
        "trainNo": no,
        "from": frm,
        "to": to,
        "depart": depart,
        "arrive": arrive,
        "duration": duration,
        "type": typ,
        "seats": [
            {"name": "二等座", "price": second, "status": "有票"},
            {"name": "一等座", "price": first, "status": "有票"},
            {"name": "商务座", "price": biz, "status": "有票"},
        ],
        "stops": [
            {"station": frm, "arrive": "--", "depart": depart, "stay": "--"},
            {"station": to, "arrive": arrive, "depart": arrive, "stay": "--"},
        ],
    }


BEFORE_QINGHE = [
    hotel(
        "h_icc_junlan", "君澜度假酒店(杭州西湖国际会议中心店)",
        star=5, score=4.9, reviews=2100, price=798, old=880,
        rank="西湖国际会议中心豪华酒店热卖 No.1", cover=IMGS["atour"],
        rooms=[room("h_icc_junlan", "deluxe", "豪华湖景大床房", 798, "2份早餐"), room("h_icc_junlan", "suite", "行政套房", 980, "2份早餐")],
    ),
    hotel(
        "h_icc_marriott", "万怡酒店(杭州西湖国际会议中心店)",
        star=4, score=4.8, reviews=1680, price=568, old=620,
        rank="西湖国际会议中心高档酒店热卖 No.2", cover=IMGS["atour"],
        rooms=[room("h_icc_marriott", "deluxe", "豪华大床房", 568, "2份早餐"), room("h_icc_marriott", "twin", "豪华双床房", 598, "2份早餐", "2张1.2米单人床")],
    ),
    hotel(
        "h_icc_hilton", "希尔顿酒店(杭州西湖国际会议中心店)",
        star=5, score=4.8, reviews=940, price=688, old=760,
        rank="西湖国际会议中心豪华酒店热卖 No.3", cover=IMGS["atour"],
        rooms=[room("h_icc_hilton", "deluxe", "豪华大床房", 688, "2份早餐"), room("h_icc_hilton", "suite", "行政套房", 860, "2份早餐")],
    ),
    hotel(
        "h_icc_yunqi_east", "云栖酒店(杭州西湖国际会议中心东门店)",
        star=4, score=4.7, reviews=1120, price=458, old=520,
        rank="西湖国际会议中心高档酒店热卖 No.4", cover=IMGS["atour"],
        rooms=[room("h_icc_yunqi_east", "deluxe", "雅致大床房", 458, "1份早餐"), room("h_icc_yunqi_east", "twin", "舒适双床房", 498, "1份早餐", "2张1.2米单人床")],
    ),
    hotel(
        "h_icc_qinghe_north", "青禾酒店(杭州西湖国际会议中心北门店)",
        star=3, score=4.6, reviews=880, price=398, old=430,
        rank="西湖国际会议中心舒适型酒店热卖 No.5", cover=IMGS["quanji"],
        rooms=[room("h_icc_qinghe_north", "deluxe", "雅致大床房", 398, "1份早餐"), room("h_icc_qinghe_north", "twin", "舒适双床房", 428, "1份早餐", "2张1.2米单人床")],
    ),
    hotel(
        "h_icc_homeinn", "如家酒店(杭州西湖国际会议中心店)",
        star=2, score=4.4, reviews=2100, price=398, old=428,
        rank="西湖国际会议中心经济型热卖 No.6", cover=IMGS["hanting"],
        rooms=[room("h_icc_homeinn", "deluxe", "大床房", 398, "1份早餐"), room("h_icc_homeinn", "twin", "双床房", 418, "1份早餐", "2张1.2米单人床")],
    ),
    hotel(
        "h_icc_hanting", "汉庭酒店(杭州西湖国际会议中心店)",
        star=2, score=4.3, reviews=1540, price=428, old=458,
        rank="西湖国际会议中心经济型热卖 No.7", cover=IMGS["hanting"],
        rooms=[room("h_icc_hanting", "deluxe", "大床房", 428, "1份早餐"), room("h_icc_hanting", "twin", "双床房", 448, "1份早餐", "2张1.2米单人床")],
    ),
]

AFTER_YUNQI = [
    hotel(
        "h_icc_quanji", "全季酒店(杭州西湖国际会议中心店)",
        star=3, score=4.5, reviews=990, price=438, old=468,
        rank="西湖国际会议中心舒适型酒店热卖 No.8", cover=IMGS["quanji"],
        rooms=[room("h_icc_quanji", "deluxe", "雅致大床房", 438, "1份早餐"), room("h_icc_quanji", "twin", "舒适双床房", 468, "1份早餐", "2张1.2米单人床")],
    ),
    hotel(
        "h_icc_garden", "花园酒店(杭州西湖国际会议中心店)",
        star=4, score=4.6, reviews=760, price=528, old=580,
        rank="西湖国际会议中心高档酒店热卖 No.9", cover=IMGS["atour"],
        rooms=[room("h_icc_garden", "deluxe", "豪华大床房", 528, "2份早餐"), room("h_icc_garden", "suite", "行政套房", 628, "2份早餐")],
    ),
]

# Earliest-first GUI list: first screen is 04:xx 普速. Suitable noon G trains
# (G7367 11:10 and later) sit several scrolls down — not tappable on page 1.
# Second-class >=118 so v4_09 (<100) still only hits the original cheap set.
NEW_TRAINS = [
    train("t_k810_shhz", "K810", "上海", "杭州", "04:10", "09:02", "4时52分", "普速", 118),
    train("t_k812_shhz", "K812", "上海", "杭州", "04:22", "09:18", "4时56分", "普速", 118),
    train("t_t111_shhz", "T111", "上海", "杭州", "04:35", "08:22", "3时47分", "普速", 128),
    train("t_k814_shhz", "K814", "上海", "杭州", "04:42", "09:55", "5时13分", "普速", 118),
    train("t_k808_shhz", "K808", "上海", "杭州", "04:52", "09:40", "4时48分", "普速", 118),
    train("t_k1236_shhz", "K1236", "上海", "杭州", "05:00", "10:08", "5时8分", "普速", 118),
    train("t_k1234_shhz", "K1234", "上海", "杭州", "05:08", "10:15", "5时7分", "普速", 118),
    train("t_t109_shhz", "T109", "上海", "杭州", "05:20", "09:05", "3时45分", "普速", 128),
    train("t_k5680_shhz", "K5680", "上海", "杭州", "05:28", "10:40", "5时12分", "普速", 118),
    train("t_g7303_shhz", "G7303", "上海", "杭州", "05:15", "06:12", "57分", "高铁", 128),
    train("t_g7321_shhz", "G7321", "上海虹桥", "杭州东", "05:40", "06:38", "58分", "高铁", 128),
    train("t_k5678_shhz", "K5678", "上海", "杭州", "05:36", "10:48", "5时12分", "普速", 118),
    train("t_g7335_shhz", "G7335", "上海", "杭州", "06:02", "06:58", "56分", "高铁", 136),
    train("t_g7349_shhz", "G7349", "上海虹桥", "杭州东", "06:18", "07:16", "58分", "高铁", 136),
    train("t_g7361_shhz", "G7361", "上海", "杭州", "06:35", "07:32", "57分", "高铁", 148),
    train("t_g7377_shhz", "G7377", "上海虹桥", "杭州东", "06:52", "07:50", "58分", "高铁", 148),
    train("t_g7389_shhz", "G7389", "上海", "杭州", "07:05", "08:02", "57分", "高铁", 166),
    train("t_g7393_shhz", "G7393", "上海", "杭州", "07:38", "08:36", "58分", "高铁", 118),
    train("t_g7311_shhz", "G7311", "上海虹桥", "杭州东", "07:55", "08:52", "57分", "高铁", 128),
    train("t_g7317_shhz", "G7317", "上海", "杭州", "08:12", "09:08", "56分", "高铁", 128),
    train("t_g7325_shhz", "G7325", "上海", "杭州", "08:40", "09:38", "58分", "高铁", 136),
    train("t_t113_shhz", "T113", "上海", "杭州", "05:48", "09:35", "3时47分", "普速", 128),
    train("t_k820_shhz", "K820", "上海", "杭州", "06:08", "11:15", "5时7分", "普速", 118),
    train("t_k822_shhz", "K822", "上海", "杭州", "06:22", "11:40", "5时18分", "普速", 118),
    train("t_t115_shhz", "T115", "上海", "杭州", "06:42", "10:20", "3时38分", "普速", 128),
    train("t_k824_shhz", "K824", "上海", "杭州", "07:12", "12:05", "4时53分", "普速", 118),
    train("t_k826_shhz", "K826", "上海", "杭州", "07:42", "12:38", "4时56分", "普速", 118),
    train("t_t117_shhz", "T117", "上海", "杭州", "08:05", "11:50", "3时45分", "普速", 128),
    train("t_k828_shhz", "K828", "上海", "杭州", "08:28", "13:10", "4时42分", "普速", 118),
    train("t_g7355_shhz", "G7355", "上海虹桥", "杭州东", "10:28", "11:22", "54分", "高铁", 136),
    train("t_g7367_shhz", "G7367", "上海", "杭州", "11:10", "12:05", "55分", "高铁", 148),
    train("t_g7371_shhz", "G7371", "上海虹桥", "杭州东", "11:32", "12:29", "57分", "高铁", 136),
    train("t_g7381_shhz", "G7381", "上海", "杭州", "11:48", "12:45", "57分", "高铁", 148),
    train("t_g7399_shhz", "G7399", "上海虹桥", "杭州东", "12:06", "13:03", "57分", "高铁", 136),
    train("t_g7401_shhz", "G7401", "上海", "杭州", "12:22", "13:19", "57分", "高铁", 148),
    train("t_d2288_shhz", "D2288", "上海", "杭州", "13:15", "15:40", "2时25分", "动车", 118),
    train("t_g7403_shhz", "G7403", "上海虹桥", "杭州东", "14:22", "15:18", "56分", "高铁", 148),
    train("t_g7419_shhz", "G7419", "上海", "杭州", "16:05", "17:02", "57分", "高铁", 166),
    train("t_g7433_shhz", "G7433", "上海虹桥", "杭州东", "17:48", "18:45", "57分", "高铁", 136),
    train("t_g7451_shhz", "G7451", "上海", "杭州", "19:10", "20:08", "58分", "高铁", 148),
    train("t_g7469_shhz", "G7469", "上海虹桥", "杭州东", "20:35", "21:32", "57分", "高铁", 166),
    train("t_k902_shhz", "K902", "上海", "杭州", "21:18", "02:10", "4时52分", "普速", 118),
]


def main() -> None:
    data = json.loads(ROOT.read_text())
    hotels = data["hotels"]
    existing = {h["id"] for h in hotels}
    new_hotels = [h for h in BEFORE_QINGHE + AFTER_YUNQI if h["id"] not in existing]
    if new_hotels:
        qinghe_i = next(i for i, h in enumerate(hotels) if h["id"] == "h_qinghe_icc")
        before = [h for h in BEFORE_QINGHE if h["id"] not in existing]
        after = [h for h in AFTER_YUNQI if h["id"] not in existing]
        hotels[qinghe_i:qinghe_i] = before
        yunqi_i = next(i for i, h in enumerate(hotels) if h["id"] == "h_yunqi_icc")
        hotels[yunqi_i + 1:yunqi_i + 1] = after

    reviews = data["hotelReviews"]
    for h in BEFORE_QINGHE + AFTER_YUNQI:
        reviews.setdefault(h["id"], review(h["id"], "林可", "就在西湖国际会议中心附近，开会方便，房价要看清楚。"))

    trains = data["trains"]
    existing_t = {t["id"] for t in trains}
    to_add = [t for t in NEW_TRAINS if t["id"] not in existing_t]
    if to_add:
        g7301_i = next(i for i, t in enumerate(trains) if t["id"] == "t_g7301")
        trains[g7301_i:g7301_i] = to_add

    ROOT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"hotels +{len(new_hotels)} (now {len(hotels)}), trains +{len(to_add)} (now {len(trains)})")


if __name__ == "__main__":
    main()
