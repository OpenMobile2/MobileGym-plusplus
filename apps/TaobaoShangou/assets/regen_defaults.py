# -*- coding: utf-8 -*-
"""
淘宝闪购 defaults.json 生成器(唯一数据源;手改 JSON 禁止)。
固定伪随机种子,输出确定性。运行:python apps/TaobaoShangou/assets/regen_defaults.py
同时输出 assets/asset_prompts.json(批量生图清单,gen_images.py 消费)。
"""
import json
import random
from pathlib import Path

from seed_pools import DISH_POOLS, KINGKONG, REVIEWERS, REVIEW_TEXTS, SHOPS, SKU_TEMPLATES

rng = random.Random(20260708)
HERE = Path(__file__).parent
OUT = HERE.parent / "data" / "defaults.json"
PROMPTS_OUT = HERE / "asset_prompts.json"

# 基准模拟时间:2026-07-08 12:00 (UTC+8)
BASE_TS = 1783569600000
H = 3600_000
D = 24 * H
A = lambda p: f"/@app-assets/TaobaoShangou/{p}"
r2 = lambda n: round(n + 1e-9, 2)

DRINK_CATS = {"milktea", "coffee"}
RETAIL_REVIEW = {"convenience", "supermarket", "fruitshop", "pharmacy", "flowershop", "snackshop"}

# 每个品类的菜单分组规则:(分组名, 池内起止索引);超出部分归入最后一组
MENU_CATS = {
    "seafood": [("超抢手", 0, 3), ("双人套餐", 3, 6), ("单点海鲜", 6, 10), ("主食小吃", 10, 11), ("餐具选择", 11, 12)],
    "cnfast": [("招牌鸡汤拿手菜", 0, 2), ("下饭好菜", 2, 8), ("汤/主食", 8, 10)],
    "skewer": [("疯狂星期二", 0, 3), ("炸串小吃", 3, 8), ("主食饮料", 8, 10)],
    "friedchicken": [("超值套餐", 0, 2), ("人气炸鸡", 2, 6), ("小食饮品", 6, 10)],
    "milktea": [("招牌必点", 0, 3), ("鲜果茶", 3, 8), ("经典奶茶", 8, 10)],
    "coffee": [("人气咖啡", 0, 4), ("特调/黑咖", 4, 6), ("烘焙甜点", 6, 8)],
    "dessert": [("镇店招牌", 0, 3), ("冰品甜汤", 3, 8)],
    "hotpot": [("招牌锅物", 0, 5), ("主食饮品", 5, 8)],
    "malatang": [("人气主食", 0, 5), ("小吃饮品", 5, 8)],
    "noodleshop": [("招牌粉面", 0, 4), ("经典面食", 4, 8), ("小菜饮品", 8, 10)],
    "dumpling": [("招牌云吞", 0, 2), ("现包水饺", 2, 5), ("福利小菜", 5, 9)],
    "guotie": [("招牌锅贴", 0, 3), ("包点汤品", 3, 6), ("粥饮", 6, 8)],
    "bbqshop": [("肉串招牌", 0, 3), ("素菜海鲜", 3, 6), ("夜宵酒饮", 6, 8)],
    "japanese": [("刺身寿司", 0, 3), ("主食热菜", 3, 6), ("小食甜品", 6, 8)],
    "salad": [("能量碗", 0, 3), ("轻食小食", 3, 8)],
    "burger": [("人气汉堡", 0, 3), ("披萨", 3, 5), ("小食饮品", 5, 8)],
    "congee": [("招牌粥品", 0, 3), ("广式点心", 3, 8)],
    "cake": [("生日蛋糕", 0, 3), ("烘焙点心", 3, 8)],
    "convenience": [("冷藏乳饮", 0, 3), ("深夜食堂", 3, 6), ("热食便当", 6, 8), ("零食饮料", 8, 12), ("日用应急", 12, 14)],
    "supermarket": [("爆好价", 0, 4), ("日用家清", 4, 6), ("乳品酸奶", 6, 8), ("方便速食", 8, 10), ("生鲜水果", 10, 12)],
    "fruitshop": [("果切现做", 0, 3), ("当季鲜果", 3, 8), ("随心拼", 8, 10)],
    "pharmacy": [("家庭常备", 0, 5), ("消毒防护", 5, 8), ("夏季专区", 8, 10)],
    "flowershop": [("人气花束", 0, 4), ("礼盒绿植", 4, 8)],
    "snackshop": [("网红爆款", 0, 4), ("卤味坚果", 4, 7), ("饼干果冻", 7, 10)],
}


def build_items_and_shops():
    shops, items = [], []
    for (sid, name, branch, cat, stype, color, rating, msales, minOrder,
         feeOrig, fee, minutes, km, feats) in SHOPS:
        pool = DISH_POOLS[cat]
        shop_items = []
        for slug, iname, desc, price, orig, sales, tags, sku in pool:
            jitter = 1 + (rng.random() - 0.5) * 0.08
            p = r2(max(0.3, price * (1 if price < 2 else jitter)))
            it = {
                "id": f"{sid}__{slug}",
                "slug": slug,
                "shopId": sid,
                "name": iname,
                "desc": desc,
                "price": p,
                "origPrice": r2(orig * jitter) if orig else None,
                "monthlySales": int(sales * (0.7 + rng.random() * 0.6)),
                "tags": tags,
                "skuGroups": SKU_TEMPLATES[sku] and [
                    {"name": g["name"], "type": g["type"],
                     "options": [{"label": o[0], "delta": o[1]} for o in g["options"]]}
                    for g in SKU_TEMPLATES[sku]
                ] if sku else None,
                "image": A(f"items/{slug}.jpg"),
            }
            items.append(it)
            shop_items.append(it)
        menu = []
        rules = MENU_CATS[cat]
        for cname, lo, hi in rules:
            ids = [x["id"] for x in shop_items[lo:hi]]
            if ids:
                menu.append({"cat": cname, "itemIds": ids})
        promos = []
        if rng.random() < 0.8:
            base = int(30 + rng.random() * 60)
            promos = [{"full": base, "off": max(1, base // 30)}, {"full": base * 2 + 8, "off": max(2, base // 12)}]
        shop = {
            "id": sid, "name": name, "branch": branch, "fullName": f"{name}({branch})",
            "category": cat, "type": stype, "brandColor": color, "menu": menu,
            "logo": A(f"logos/{sid}.jpg"),
            "rating": rating, "monthlySales": msales,
            "minOrder": minOrder, "deliveryFee": fee, "deliveryFeeOrig": feeOrig,
            "deliveryMinutes": minutes, "distanceKm": km,
            "features": feats, "promos": promos,
            "shopCoupon": {"id": f"sc_{sid}", "amount": 1 + int(rng.random() * 3), "threshold": 30,
                           "name": "关注有礼", "claimed": False},
            "burstCoupon": {"amount": 13 if rng.random() < 0.5 else int(5 + rng.random() * 15), "threshold": 49},
            "mustPickCat": "餐具选择" if cat == "seafood" else None,
            "notice": f"欢迎光临{name},本店食材当日新鲜采购,如需餐具请在下单时备注。",
            "address": f"仙林大道{int(10 + rng.random() * 180)}号{branch}",
            "hours": "09:30-次日04:00" if cat in ("seafood", "bbqshop", "skewer") else "08:00-22:00",
            "phone": f"025-8{int(1000000 + rng.random() * 8999999)}",
            "supportsPickup": True,
            "ratingTaste": r2(rating - 0.1), "ratingPack": r2(min(5.0, rating + 0.2)),
        }
        shops.append(shop)
    return shops, items


def build_reviews(shops, items_by_shop):
    reviews = {}
    all_texts_used = 0
    for shop in shops:
        cat = shop["category"]
        pool = (REVIEW_TEXTS["drink"] if cat in DRINK_CATS
                else REVIEW_TEXTS["retail"] if cat in RETAIL_REVIEW
                else REVIEW_TEXTS["food"])
        texts = pool + REVIEW_TEXTS["generic"]
        n = 5 + int(rng.random() * 3)
        lst = []
        for i in range(n):
            rev = REVIEWERS[(all_texts_used + i) % len(REVIEWERS)]
            stars = 5 if rng.random() < 0.72 else (4 if rng.random() < 0.8 else 2)
            item = rng.choice(items_by_shop[shop["id"]])
            lst.append({
                "id": f"rv_{shop['id']}_{i}",
                "userId": rev[0], "userName": rev[1],
                "avatar": A(f"avatars/{rev[0]}.jpg"),
                "stars": stars, "tasteStars": stars, "packStars": min(5, stars + (1 if stars < 5 else 0)),
                "ts": BASE_TS - int(rng.random() * 45) * D - int(rng.random() * 12) * H,
                "text": texts[(all_texts_used + i) % len(texts)],
                "itemName": item["name"],
                "images": [item["image"]] if rng.random() < 0.4 else [],
                "reply": "感谢亲的支持,期待再次光临~" if rng.random() < 0.35 else None,
                "hasContent": True,
            })
            all_texts_used += 1
        reviews[shop["id"]] = lst
    return reviews


def money(lines):
    return r2(sum(li["price"] * li["qty"] for li in lines))


def build_orders(items):
    idx = {i["id"]: i for i in items}

    def line(iid, qty=1, sku=None, paid=None):
        it = idx[iid]
        return {"itemId": iid, "name": it["name"], "image": it["image"],
                "skuDesc": sku, "qty": qty,
                "price": paid if paid is not None else it["price"],
                "origPrice": it["origPrice"] or it["price"]}

    orders = [
        {   # 已送达·待评价(证据 6055/6059 蓝本)
            "id": "o1001", "shopId": "s_feishu", "status": "delivered",
            "createdAt": BASE_TS - 1 * D - 5 * H, "statusChangedAt": BASE_TS - 1 * D - 4 * H,
            "lines": [line("s_feishu__gt_beef_rice", 1, "中辣", 18.47), line("s_feishu__gt_guotie", 1, None, 6.33)],
            "packFee": 3.0, "deliveryFee": 2.8, "deliveryFeeOrig": 6.5,
            "couponDiscount": 14.0, "totalPaid": 30.6, "totalDiscount": 17.7,
            "mode": "delivery", "remark": "1/依据餐量提供餐具", "tableware": "1份",
            "reviewed": False, "riderName": "骑士小赵",
            "timeline": [["下单", -1 * D - 5 * H], ["商家接单", -1 * D - 5 * H + 3 * 60000],
                         ["骑士取餐", -1 * D - 4 * H - 30 * 60000], ["已送达", -1 * D - 4 * H]],
        },
        {   # 已送达·待评价(花店)
            "id": "o1002", "shopId": "s_huayu", "status": "delivered",
            "createdAt": BASE_TS - 2 * D - 20 * H, "statusChangedAt": BASE_TS - 2 * D - 19 * H,
            "lines": [line("s_huayu__fl_coral_rose", 1, "韩式雾面纸", 52.0)],
            "packFee": 0.0, "deliveryFee": 5.0, "deliveryFeeOrig": 8.0,
            "couponDiscount": 8.0, "totalPaid": 57.0, "totalDiscount": 11.0,
            "mode": "delivery", "remark": None, "tableware": None,
            "reviewed": False, "riderName": "骑士小陈",
            "timeline": [["下单", -2 * D - 20 * H], ["已送达", -2 * D - 19 * H]],
        },
        {   # 已送达·待评价(炸鸡)
            "id": "o1003", "shopId": "s_bopai", "status": "delivered",
            "createdAt": BASE_TS - 3 * D - 6 * H, "statusChangedAt": BASE_TS - 3 * D - 5 * H,
            "lines": [line("s_bopai__fc_tastebox", 1, "小份/香辣", 27.9)],
            "packFee": 2.0, "deliveryFee": 4.0, "deliveryFeeOrig": 7.5,
            "couponDiscount": 6.0, "totalPaid": 27.9, "totalDiscount": 9.5,
            "mode": "delivery", "remark": None, "tableware": "无需餐具",
            "reviewed": False, "riderName": "骑士老周",
            "timeline": [["下单", -3 * D - 6 * H], ["已送达", -3 * D - 5 * H]],
        },
        {   # 已取消(用户取消,已退款;证据 6065/6079 蓝本)
            "id": "o1004", "shopId": "s_yuanji", "status": "canceled",
            "createdAt": BASE_TS - 12 * H, "statusChangedAt": BASE_TS - 12 * H + 8 * 60000,
            "lines": [line("s_yuanji__dp_sauce_gift", 1, "红油包", 0.3),
                      line("s_yuanji__dp_shrimp_wonton", 1, "小份10个/网红混酱干拌/加1个卤蛋(分装)", 35.56)],
            "packFee": 2.0, "deliveryFee": 2.1, "deliveryFeeOrig": 8.7,
            "couponDiscount": 10.0, "totalPaid": 39.96, "totalDiscount": 18.2,
            "mode": "delivery", "remark": "1/依据餐量提供餐具", "tableware": "商家依据餐量提供",
            "reviewed": False, "cancelReason": "我不想要了",
            "refund": {"status": "done", "amount": 39.96, "couponsBack": 1,
                       "timeline": [["订单已取消", -12 * H + 8 * 60000], ["打款成功", -12 * H + 9 * 60000]]},
            "timeline": [["下单", -12 * H], ["订单已取消", -12 * H + 8 * 60000]],
        },
        {   # 退款成功(药房,证据 6070 蓝本)
            "id": "o1005", "shopId": "s_yifeng", "status": "refunded",
            "createdAt": BASE_TS - 8 * D, "statusChangedAt": BASE_TS - 8 * D + 40 * 60000,
            "lines": [line("s_yifeng__ph_mosquito", 1, None, 20.44),
                      line("s_yifeng__ph_mask", 1, None, 19.9),
                      line("s_yifeng__ph_vitamin_c", 1, None, 15.46)],
            "packFee": 1.0, "deliveryFee": 3.0, "deliveryFeeOrig": 6.0,
            "couponDiscount": 6.0, "totalPaid": 57.3, "totalDiscount": 9.0,
            "mode": "delivery", "remark": None, "tableware": None,
            "reviewed": False, "refundReason": "收到的商品少了/错了",
            "refund": {"status": "done", "amount": 57.3, "couponsBack": 1,
                       "timeline": [["申请已提交", -8 * D + 20 * 60000], ["商家处理中", -8 * D + 25 * 60000],
                                    ["打款成功", -8 * D + 40 * 60000]]},
            "timeline": [["下单", -8 * D], ["已送达", -8 * D + 30 * 60000], ["退款成功", -8 * D + 40 * 60000]],
        },
        {   # 已送达·已评价
            "id": "o1006", "shopId": "s_liwo", "status": "delivered",
            "createdAt": BASE_TS - 6 * D, "statusChangedAt": BASE_TS - 6 * D + 35 * 60000,
            "lines": [line("s_liwo__fc_soy_chicken", 1, "小份/原味", 31.3)],
            "packFee": 1.5, "deliveryFee": 3.5, "deliveryFeeOrig": 6.0,
            "couponDiscount": 5.0, "totalPaid": 31.3, "totalDiscount": 7.5,
            "mode": "delivery", "remark": None, "tableware": "1份",
            "reviewed": True, "riderName": "骑士小陈",
            "timeline": [["下单", -6 * D], ["已送达", -6 * D + 35 * 60000]],
        },
        {   # 已送达·已评价(便利店,自取)
            "id": "o1007", "shopId": "s_lusen", "status": "delivered",
            "createdAt": BASE_TS - 10 * D, "statusChangedAt": BASE_TS - 10 * D + 25 * 60000,
            "lines": [line("s_lusen__cv_fresh_milk", 2, None, 8.9), line("s_lusen__cv_icecup", 1, None, 3.5)]
            if False else [line("s_lusen__cv_fresh_milk", 2, None, 8.9), line("s_lusen__cv_soda_water", 1, None, 5.5)],
            "packFee": 0.0, "deliveryFee": 0.0, "deliveryFeeOrig": 0.0,
            "couponDiscount": 3.0, "totalPaid": 23.3, "totalDiscount": 5.0,
            "mode": "pickup", "remark": None, "tableware": None,
            "reviewed": True,
            "timeline": [["下单", -10 * D], ["已自取", -10 * D + 25 * 60000]],
        },
        {   # 已送达·待评价(米粉)
            "id": "o1008", "shopId": "s_xinhuaxi", "status": "delivered",
            "createdAt": BASE_TS - 4 * D - 3 * H, "statusChangedAt": BASE_TS - 4 * D - 2 * H,
            "lines": [line("s_xinhuaxi__nd_beef_rice_noodle", 1, "标准份/中辣/加卤蛋", 24.5)],
            "packFee": 1.5, "deliveryFee": 2.3, "deliveryFeeOrig": 5.0,
            "couponDiscount": 4.0, "totalPaid": 24.3, "totalDiscount": 6.7,
            "mode": "delivery", "remark": "不要香菜", "tableware": "1份",
            "reviewed": False, "riderName": "骑士小赵",
            "timeline": [["下单", -4 * D - 3 * H], ["已送达", -4 * D - 2 * H]],
        },
    ]
    for o in orders:
        o["timeline"] = [[t, BASE_TS + d] for t, d in o["timeline"]]
        if o.get("refund"):
            o["refund"]["timeline"] = [[t, BASE_TS + d] for t, d in o["refund"]["timeline"]]
    return orders


def build_coupons():
    def c(cid, name, ctype, amount, threshold, expire_h, status="claimed", burst=False):
        return {"id": cid, "name": name, "type": ctype, "amount": amount, "threshold": threshold,
                "expireAt": BASE_TS + expire_h * H, "status": status, "burstable": burst,
                "scope": "全平台外卖商家可用" if ctype == "platform" else name}
    return [
        c("cp1", "购物爆红包", "burst", 3, 3, 12, burst=True),
        c("cp2", "购物爆红包", "burst", 6, 10, 12, burst=True),
        c("cp3", "购物爆红包", "burst", 8, 19, 12, burst=True),
        c("cp4", "购物爆红包", "burst", 12, 29, 12, burst=True),
        c("cp5", "购物爆红包", "burst", 22, 59, 12, burst=True),
        c("cp6", "水果爆红包", "item", 5, 15, 36, burst=True),
        c("cp7", "个护家清日联合券", "item", 6, 29, 30, status="unclaimed"),
        # 夜市红包(频道页一键领取)
        c("night1", "夜市红包", "platform", 30, 100, 10, status="unclaimed"),
        c("night2", "夜市红包", "platform", 20, 58, 10, status="unclaimed"),
        c("night3", "夜市红包", "platform", 15, 38, 10, status="unclaimed"),
    ]


def build_messages():
    return [
        {"id": "m_banner", "kind": "banner", "title": "烧烤配冰啤,香迷糊了", "closable": True},
        {"id": "m_n1", "kind": "notice", "title": "订单已送达", "sub": "肥叔锅贴·面饭(东流佳苑店)的订单已送达,记得及时取餐",
         "ts": BASE_TS - 1 * D - 4 * H, "icon": "delivered", "orderId": "o1001"},
        {"id": "m_n2", "kind": "notice", "title": "食无忧保障已生效", "sub": "本单已享食品安全保障,如遇问题可极速理赔",
         "ts": BASE_TS - 1 * D - 5 * H, "icon": "shield", "orderId": "o1001"},
        {"id": "m_rider", "kind": "rider", "title": "骑士小赵", "sub": "骑士:您好,您的订单已经放在指定地点,请您尽快取用,谢谢!",
         "ts": BASE_TS - 1 * D - 4 * H, "orderId": "o1001", "unread": 0},
        {"id": "m_shop1", "kind": "shop", "shopId": "s_xijie", "title": "喜姐炸串·酸辣粉(广志路店)",
         "sub": "[优惠券]会员日专属红包已到账,今晚炸串5折起!", "ts": BASE_TS - 7 * H, "unread": 1},
        {"id": "m_shop2", "kind": "shop", "shopId": "s_huayu", "title": "花语觅花艺",
         "sub": "感谢惠顾,晒图评价可领3元店铺券~", "ts": BASE_TS - 2 * D - 18 * H, "unread": 1},
        {"id": "m_shop3", "kind": "shop", "shopId": "s_feishu", "title": "肥叔锅贴粉丝群",
         "sub": "群公告:每周三锅贴买十送二", "ts": BASE_TS - 2 * D, "unread": 0},
    ]


def build_addresses():
    return [
        {"id": "a1", "poi": "阳光花园小区", "detail": "3栋2单元502", "name": "李明", "gender": "先生",
         "phone": "13800001234", "tag": "家", "isDefault": True, "pinned": True},
        {"id": "a2", "poi": "紫金学府", "detail": "7栋1单元301", "name": "李明", "gender": "先生",
         "phone": "13800001234", "tag": "父母", "isDefault": False, "pinned": False},
        {"id": "a3", "poi": "万达茂公寓B座", "detail": "1208室", "name": "王小雨", "gender": "女士",
         "phone": "13900005678", "tag": "朋友", "isDefault": False, "pinned": False},
        {"id": "a4", "poi": "东城汇写字楼", "detail": "12F前台代收", "name": "李明", "gender": "先生",
         "phone": "13800001234", "tag": "公司", "isDefault": False, "pinned": False},
        {"id": "a5", "poi": "仙林大学城学生公寓", "detail": "4栋520", "name": "李阳", "gender": "先生",
         "phone": "13700009012", "tag": "学校", "isDefault": False, "pinned": False},
        {"id": "a6", "poi": "和园小区", "detail": "22栋101", "name": "李明", "gender": "先生",
         "phone": "13800001234", "tag": "家", "isDefault": False, "pinned": False},
    ]


def build_asset_prompts(shops, seen_slugs):
    style_food = "外卖美食摄影,俯拍45度,浅色餐桌背景,自然光,食物特写诱人,高清,无任何文字无水印无logo"
    style_retail = "电商商品主图,专业产品摄影,浅色干净背景,商品居中,高清,无任何文字无水印无logo"
    prompts = {}
    for cat, pool in DISH_POOLS.items():
        retail = cat in RETAIL_REVIEW
        for slug, name, desc, *_ in pool:
            if slug not in seen_slugs:
                continue
            style = style_retail if retail else style_food
            prompts[f"items/{slug}.jpg"] = f"{name},{desc},{style}"
    cat_desc = {
        "seafood": "海鲜餐厅,深蓝色调,螃蟹元素", "cnfast": "中式快餐,绿色清新,鸡汤碗元素",
        "skewer": "炸串小吃,红色热闹", "friedchicken": "炸鸡店,橙黄活泼",
        "milktea": "奶茶店,粉色可爱,奶茶杯元素", "coffee": "咖啡店,棕色质感,咖啡杯元素",
        "dessert": "甜品店,暖棕甜美", "hotpot": "麻辣香锅店,红色火辣",
        "malatang": "麻辣烫店,橙红温暖", "noodleshop": "米粉面馆,面碗元素",
        "dumpling": "饺子店,青色亲切,饺子元素", "guotie": "锅贴老店,烟火气",
        "bbqshop": "烧烤店,深色夜宵风,烤串元素", "japanese": "日料店,深蓝极简,寿司元素",
        "salad": "轻食沙拉店,绿色健康", "burger": "汉堡店,紫色美式",
        "congee": "广式粥点店,青绿温润", "cake": "烘焙蛋糕店,粉色浪漫",
        "convenience": "便利店,蓝色简洁", "supermarket": "超市,红色实惠",
        "fruitshop": "水果店,橙色新鲜,水果元素", "pharmacy": "药房,青绿十字元素",
        "flowershop": "花店,粉色浪漫,花束元素", "snackshop": "零食铺,黄色欢快",
    }
    for s in shops:
        prompts[f"logos/{s['id']}.jpg"] = (
            f"餐饮商家品牌logo头像,{cat_desc[s['category']]},扁平插画风,圆角方形底,居中构图,简洁现代,无任何文字无字母无水印"
        )
    for rid, _, gender in REVIEWERS:
        g = "女生" if gender == "f" else "男生"
        prompts[f"avatars/{rid}.jpg"] = f"卡通头像,{g},圆脸微笑,纯色背景,扁平插画风格,居中特写,无文字"
    prompts["avatars/u_me.jpg"] = "卡通汉堡拟人头像,黄色暖色调,圆润可爱,纯色背景,扁平插画,无文字"
    prompts["avatars/rider.jpg"] = "卡通外卖骑手头像,橙色头盔,微笑,纯色背景,扁平插画,无文字"
    prompts["avatars/agent.jpg"] = "专业客服管家形象,黑金色调,西装,亲切微笑,半身卡通插画,无文字"
    kk_desc = {
        "kk_food": "一碗热气腾腾的面条和筷子", "kk_market": "蓝色购物篮装满商品",
        "kk_medicine": "白色药盒和绿十字胶囊", "kk_fruit": "西瓜草莓等新鲜水果堆",
        "kk_flower": "粉色花束", "kk_student": "学士帽和礼物盒", "kk_hot": "燃烧的火焰和抢购标签",
        "kk_dessert": "冰淇淋和奶茶杯", "kk_beans": "金色豆子硬币堆", "kk_group": "两个购物袋碰在一起",
        "kk_midnight": "深夜灯光下的烤串", "kk_breakfast": "豆浆油条", "kk_pet": "猫粮碗和爪印", "kk_convenience": "24小时便利店门头",
    }
    for kid, _name, _r in KINGKONG:
        prompts[f"kingkong/{kid}.jpg"] = f"3D立体图标,{kk_desc[kid]},C4D渲染,糖果质感,浅色背景,居中,无文字"
    banners = {
        "banner_night": "夜宵烧烤拼团促销banner插画,深蓝紫夜色,烤串啤酒,热闹氛围,无文字",
        "banner_summer": "盛夏狂欢超市促销banner插画,蓝色天空,商品堆头,清爽,无文字",
        "banner_ice": "冰品冷饮促销banner插画,冰块西瓜冰淇淋,蓝白清凉,无文字",
        "banner_fruit": "缤纷水果节banner插画,西瓜蜜瓜果切,橙黄新鲜,无文字",
        "banner_redpacket": "红包雨促销banner插画,红色喜庆,金色红包,无文字",
        "banner_member": "会员日促销banner插画,黑金质感,VIP卡片,无文字",
    }
    for k, v in banners.items():
        prompts[f"banners/{k}.jpg"] = v
    return prompts


def main():
    shops, items = build_items_and_shops()
    items_by_shop = {}
    for it in items:
        items_by_shop.setdefault(it["shopId"], []).append(it)
    reviews = build_reviews(shops, items_by_shop)
    orders = build_orders(items)

    data = {
        "baseTs": BASE_TS,
        "user": {
            "id": "u_me", "nickname": "闪购用户", "signature": "",
            "avatar": A("avatars/u_me.jpg"), "phoneMasked": "138****1234",
            "beans": 0, "svip": True, "svipExpire": "2026.08.31",
        },
        "city": "南京", "locationPoi": "阳光花园小区",
        "kingkong": [{"id": k, "label": n, "route": r} for k, n, r in KINGKONG],
        "shops": shops,
        "items": items,
        "reviews": reviews,
        "orders": orders,
        "cart": [
            {"id": "c1", "shopId": "s_xianyuxian", "itemId": "s_xianyuxian__ds_tofu_pudding",
             "skuDesc": "中杯/正常冰/标准糖", "qty": 1, "price": 29.0, "selected": True},
            {"id": "c2", "shopId": "s_qimei", "itemId": "s_qimei__sf_chopsticks",
             "skuDesc": None, "qty": 1, "price": 0.5, "selected": True},
            {"id": "c3", "shopId": "s_qimei", "itemId": "s_qimei__sf_crab_combo",
             "skuDesc": "1人份/1份米饭/稀垄红薯1份(150g)/选1听米露", "qty": 1, "price": 111.3, "selected": False},
        ],
        "coupons": build_coupons(),
        "foodCard": {"owned": False, "count": 0},
        "messages": build_messages(),
        "addresses": build_addresses(),
        "favorites": ["s_xiasummer"],
        "recentShops": ["s_qimei", "s_feishu", "s_xiangweiji", "s_huayu", "s_lusen"],
        "frequentShops": [{"shopId": "s_xiangweiji", "times": 46}],
        "searchHistory": ["酸奶", "桂林米粉", "炸鸡", "西瓜", "咖啡"],
        "searchDiscover": ["七梅香辣蟹", "烤鱼", "牛蛙", "小龙虾", "三文鱼", "奶茶", "螺蛳粉", "轻食"],
        "settings": {
            "bannerNotify": True, "aliNoPwdPay": False, "balanceNoPwdPay": False,
            "imgQuality": "high", "cacheMB": 128, "defaultRemark": "", "alwaysTableware": False,
        },
        "monthSpend": {"month": "7月", "amount": 400.36},
        "reviewStats": {"viewed": 1, "liked": 0, "quality": 0},
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    seen_slugs = {i["slug"] for i in items}
    prompts = build_asset_prompts(shops, seen_slugs)
    PROMPTS_OUT.write_text(json.dumps(prompts, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK defaults.json: shops={len(shops)} items={len(items)} "
          f"skuItems={sum(1 for i in items if i['skuGroups'])} orders={len(orders)} "
          f"reviews={sum(len(v) for v in reviews.values())}")
    print(f"OK asset_prompts.json: {len(prompts)} images")


if __name__ == "__main__":
    main()
