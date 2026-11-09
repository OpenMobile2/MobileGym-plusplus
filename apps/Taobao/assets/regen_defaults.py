# -*- coding: utf-8 -*-
"""
Taobao 种子数据生成器。
- 生成 data/defaults.json(全部合成数据,无真实个人信息)
- 生成 assets/ 下的合成 SVG 图片(商品图/头像/店铺logo/地图占位)
运行: python apps/Taobao/assets/regen_defaults.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
ASSETS = ROOT / "assets"
OUT = ROOT / "data" / "defaults.json"

# 基准时间:2026-06-08 08:00 UTC+8
BASE_TS = 1780876800000
HOUR = 3600_000
DAY = 24 * HOUR
T = lambda d=0, h=0, m=0: BASE_TS + d * DAY + h * HOUR + m * 60_000

A = lambda f: f"/@app-assets/Taobao/{f}"

def ITEM_IMG(iid: str) -> str:
    """商品主图:优先 gen_item_images.py 生成的 PNG,缺失时回落 SVG 占位"""
    if (ASSETS / "items" / f"{iid}.png").exists():
        return A(f"items/{iid}.png")
    return A(f"items/{iid}.svg")

# ---------------- SVG 资产 ----------------
PALETTE = ["#FDE8E0", "#E0EFFD", "#E5FDE0", "#FDF6E0", "#F0E0FD", "#E0FDF6", "#FDE0EE", "#ECEFF1"]
INK = ["#C2410C", "#1D4ED8", "#15803D", "#A16207", "#7E22CE", "#0F766E", "#BE185D", "#475569"]

def svg_card(path: Path, text: str, idx: int, w=400, h=400):
    bg, fg = PALETTE[idx % 8], INK[idx % 8]
    label = text if len(text) <= 6 else text[:6]
    path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
        f'<rect width="{w}" height="{h}" fill="{bg}"/>'
        f'<circle cx="{w*0.78}" cy="{h*0.22}" r="{h*0.3}" fill="{fg}" opacity="0.12"/>'
        f'<circle cx="{w*0.2}" cy="{h*0.85}" r="{h*0.22}" fill="{fg}" opacity="0.10"/>'
        f'<text x="50%" y="54%" text-anchor="middle" font-size="{h//8}" fill="{fg}" '
        f'font-family="sans-serif" font-weight="bold">{label}</text></svg>',
        encoding="utf-8")

def svg_avatar(path: Path, ch: str, idx: int):
    bg, fg = INK[idx % 8], "#FFFFFF"
    path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        f'<rect width="100" height="100" rx="22" fill="{bg}"/>'
        f'<text x="50%" y="62%" text-anchor="middle" font-size="44" fill="{fg}" '
        f'font-family="sans-serif" font-weight="bold">{ch}</text></svg>',
        encoding="utf-8")

def svg_map(path: Path):
    path.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">'
        '<rect width="400" height="160" fill="#EAF0EA"/>'
        '<path d="M0 60 L400 40" stroke="#FFFFFF" stroke-width="14"/>'
        '<path d="M120 0 L160 160" stroke="#FFFFFF" stroke-width="10"/>'
        '<path d="M0 120 L400 130" stroke="#FFFFFF" stroke-width="8"/>'
        '<circle cx="210" cy="78" r="10" fill="#FF5000"/>'
        '<circle cx="210" cy="78" r="18" fill="#FF5000" opacity="0.25"/></svg>',
        encoding="utf-8")

# ---------------- 店铺 ----------------
shops = [
    {"id": "s_qfs", "name": "清风山旗舰店", "badge": "tmall", "rating": 4.9, "fans": "46.8万",
     "positiveRate": "98%", "certifiedText": "天猫官方认证的清风山旗舰店"},
    {"id": "s_lanjing", "name": "蓝鲸数码旗舰店", "badge": "tmall", "rating": 4.8, "fans": "120万",
     "positiveRate": "97%", "certifiedText": "天猫官方认证的蓝鲸数码旗舰店"},
    {"id": "s_yunshang", "name": "云裳女装", "badge": "taobao", "rating": 4.7, "fans": "11万",
     "positiveRate": "96%", "certifiedText": "金牌卖家"},
    {"id": "s_juzi", "name": "桔子食品旗舰店", "badge": "tmall", "rating": 4.9, "fans": "88万",
     "positiveRate": "99%", "certifiedText": "天猫官方认证的桔子食品旗舰店"},
    {"id": "s_jianmu", "name": "简木家居专营店", "badge": "tmall", "rating": 4.8, "fans": "23万",
     "positiveRate": "97%", "certifiedText": "天猫官方认证的简木家居专营店"},
    {"id": "s_jixing", "name": "极星运动专营店", "badge": "tmall", "rating": 4.8, "fans": "65万",
     "positiveRate": "98%", "certifiedText": "天猫官方认证的极星运动专营店"},
]

# ---------------- 商品 ----------------
def item(iid, shop, title, short, price, origin, sold, tags, specs, cat,
         limit=None, fav=300, rev=2000, ai=None, ship=True):
    return {
        "id": iid, "shopId": shop, "title": title, "image": ITEM_IMG(iid),
        "detailImages": [ITEM_IMG(iid)] + (
            [A(f"items/{iid}_d.png")] if (ASSETS / "items" / f"{iid}_d.png").exists()
            else [A(f"items/{iid}_d.svg")]),
        "price": price, "originPrice": origin, "sold": sold, "tags": tags,
        "specs": specs, **({"limitPerOrder": limit} if limit else {"limitPerOrder": None}),
        "favCount": fav, "reviewCount": rev,
        "reviewAiTags": ai or ["质量好", "物流快", "性价比高"],
        "gallery": [ITEM_IMG(iid)] + (
            [A(f"items/{iid}_2.png")] if (ASSETS / "items" / f"{iid}_2.png").exists() else []),
        "freeShipping": ship, "category": cat, "_short": short,
    }

items = [
    item("i_handcream", "s_qfs", "清风山 山雾香氛护手霜 75mL 保湿滋润 生日礼物", "护手霜", 128, 168,
         "2000+人付款", ["618品类周", "退货宝", "48小时内发货"], [
             {"name": "香味", "options": ["山雾", "青柑", "雪松", "白茶", "桂语", "深林"]},
             {"name": "规格", "options": ["75mL 单支", "75mL×2 礼盒"]},
         ], "美妆", limit=5, fav=4800, rev=2000, ai=["包装精美", "味道好闻", "滋润不油"]),
    item("i_bodywash", "s_qfs", "清风山 葵花沐浴露 500mL 身体乳套装 温和清洁", "沐浴露", 217, 268,
         "600+人付款", ["官方立减", "天猫超市"], [{"name": "规格", "options": ["500mL", "500mL×2"]}], "美妆",
         fav=1200, rev=860),
    item("i_serum", "s_qfs", "清风山 焕活精华液 30mL 紧致修护", "精华液", 345, 420, "1000+人付款",
         ["新品上市"], [{"name": "规格", "options": ["30mL", "50mL"]}], "美妆", fav=900, rev=520),
    item("i_alarm", "s_lanjing", "蓝鲸 智能闹钟 多种内置闹铃 睡眠监测 桌面时钟", "智能闹钟", 249, 299,
         "300+人付款", ["国补15%", "以旧换新"], [{"name": "颜色", "options": ["曜石黑", "云朵白", "蜜桃粉"]}],
         "数码", fav=300, rev=248, ai=["闹铃丰富", "做工精致", "屏幕清晰"]),
    item("i_earbuds", "s_lanjing", "蓝鲸 真无线蓝牙耳机 主动降噪 超长续航", "蓝牙耳机", 399, 499,
         "5000+人付款", ["百亿补贴", "国补15%"], [{"name": "颜色", "options": ["黑色", "白色"]}], "数码",
         fav=8000, rev=12000),
    item("i_cable", "s_lanjing", "蓝鲸 快充数据线 1.5m 双头Type-C", "数据线", 19.9, 29.9,
         "10万+人付款", ["秒杀价"], [{"name": "长度", "options": ["1m", "1.5m", "2m"]}], "数码",
         fav=20000, rev=50000),
    item("i_hoodie", "s_yunshang", "云裳 华夫格卫衣 白灰色 宽松显瘦 开衫外套女", "卫衣", 96.9, 129.9,
         "300+人付款", ["618品类周", "消费券", "7天无理由"], [
             {"name": "颜色", "options": ["白灰色", "燕麦色", "雾蓝色"]},
             {"name": "尺码", "options": ["S", "M", "L", "XL"]},
         ], "服饰", fav=1500, rev=320, ai=["显瘦", "面料舒服", "百搭"]),
    item("i_jeans", "s_yunshang", "云裳 直筒牛仔裤 高腰垂感 阔腿裤女", "牛仔裤", 279, 329,
         "2000+人付款", ["优惠后", "热销爆款"], [
             {"name": "颜色", "options": ["黑色", "浅蓝"]},
             {"name": "尺码", "options": ["S", "M", "L"]},
         ], "服饰", fav=3200, rev=2100),
    item("i_tee", "s_yunshang", "云裳 印花短袖T恤 纯棉 情侣款", "T恤", 59, 89, "8000+人付款",
         ["天猫618", "晚上架"], [{"name": "尺码", "options": ["S", "M", "L", "XL"]}], "服饰",
         fav=5000, rev=6000),
    item("i_nuts", "s_juzi", "桔子 每日坚果礼盒 30包混合装 孕妇零食", "坚果礼盒", 75.2, 99,
         "5万+人付款", ["天猫超市", "聚划算"], [{"name": "规格", "options": ["30包", "60包"]}], "食品",
         fav=2058, rev=9000, ai=["新鲜", "分量足", "包装好"]),
    item("i_tea", "s_juzi", "桔子 冷泡茶组合 12种口味 水果茶包", "冷泡茶", 39.9, 59.9,
         "3万+人付款", ["拍二件"], [{"name": "口味", "options": ["混合装", "白桃乌龙", "青提茉莉"]}], "食品",
         fav=1800, rev=4200),
    item("i_lamp", "s_jianmu", "简木 护眼台灯 无极调光 学习阅读床头灯", "护眼台灯", 159, 219,
         "1000+人付款", ["国补", "退货宝"], [{"name": "颜色", "options": ["原木色", "白色"]}], "家居",
         fav=2200, rev=1500),
    item("i_tissue", "s_jianmu", "简木 雪融山茶花有香手帕纸 24包", "手帕纸", 12.9, 19.9,
         "10万+人付款", ["破损包退", "极速退款"], [{"name": "规格", "options": ["24包", "48包"]}], "家居",
         fav=900, rev=30000),
    item("i_bottle", "s_jianmu", "简木 焖烧保温杯 316不锈钢 大容量", "保温杯", 89, 129,
         "6000+人付款", ["顺手买"], [{"name": "颜色", "options": ["奶白", "雾灰", "黛蓝"]}], "家居",
         fav=3100, rev=4800),
    item("i_sneaker", "s_jixing", "极星 轻量跑步鞋 透气缓震 运动鞋男女同款", "跑步鞋", 317, 399,
         "2000+人付款", ["618品类周", "会员价"], [
             {"name": "颜色", "options": ["黑武士", "云白", "荧光绿"]},
             {"name": "尺码", "options": ["38", "39", "40", "41", "42", "43"]},
         ], "运动", fav=4100, rev=3300),
    item("i_yogamat", "s_jixing", "极星 加厚瑜伽垫 防滑静音 健身垫", "瑜伽垫", 69, 99,
         "1万+人付款", ["拍下立减"], [{"name": "厚度", "options": ["8mm", "10mm", "15mm"]}], "运动",
         fav=2600, rev=7100),
    item("i_jacket", "s_jixing", "极星 防晒皮肤衣 UPF50+ 轻薄透气外套", "防晒衣", 113, 159,
         "5000+人付款", ["入会省", "热销爆款"], [
             {"name": "颜色", "options": ["浅杏", "薄雾蓝"]},
             {"name": "尺码", "options": ["S", "M", "L"]},
         ], "运动", fav=6300, rev=5800),
    item("i_giftbox", "s_qfs", "清风山 周年礼盒 护手霜+香氛蜡烛套装", "周年礼盒", 260, 345,
         "1000+人付款", ["新年礼物", "爆款好物"], [{"name": "款式", "options": ["经典", "梦境"]}], "美妆",
         fav=1100, rev=1000),
]

# ---------------- 评价 ----------------
REVIEWERS = [("发才", "金"), ("夕阳西下", "夕"), ("豆豆龙", "豆"), ("清晨小鹿", "鹿"), ("白桃气泡", "白")]
review_texts = [
    "除了日期不太理想其他都好,发货快顺丰给力,次日达。辛苦你们啦,谢谢!",
    "好用,香味很好闻,整体很好,吸收快,会回购的。",
    "包装很严实,收到时一点没漏,很棒。",
    "质量不错,和描述一致,家人很喜欢。",
    "第二次购买了,品质稳定,推荐!",
]
reviews = []
ridx = 0
for it in items[:8]:
    for k in range(3):
        nick, ch = REVIEWERS[(ridx) % len(REVIEWERS)]
        reviews.append({
            "id": f"r_{it['id']}_{k}", "itemId": it["id"], "userNick": nick,
            "userAvatar": A(f"avatars/u{ridx % 5}.svg"),
            "vipTag": "88VIP" if ridx % 3 == 0 else None,
            "skuDesc": it["specs"][0]["name"] + ":" + it["specs"][0]["options"][k % len(it["specs"][0]["options"])],
            "content": review_texts[(ridx + k) % len(review_texts)],
            "images": [ITEM_IMG(it["id"])] if k == 0 else [],
            "timestamp": T(-3 - k, 10),
        })
        ridx += 1

# ---------------- 地址(合成) ----------------
addresses = [
    {"id": "addr1", "name": "沈青", "phone": "13800000152", "region": "江苏省 无锡市 新吴区 梅村街道",
     "detail": "云溪正荣玺樾16幢602", "tag": None, "isDefault": True},
    {"id": "addr2", "name": "沈青", "phone": "13800000152", "region": "上海市 上海市 闵行区 莘庄镇",
     "detail": "七莘路765弄东苑新天地公寓207", "tag": "家", "isDefault": False},
    {"id": "addr3", "name": "沈青", "phone": "13800000152", "region": "吉林省 长春市 朝阳区 双德街道",
     "detail": "前进大街2699号吉林大学前卫南区南苑七舍", "tag": None, "isDefault": False},
    {"id": "addr4", "name": "沈青", "phone": "13800000152", "region": "江苏省 无锡市 滨湖区 太湖街道",
     "detail": "南湖家园8号1302", "tag": None, "isDefault": False},
    {"id": "addr5", "name": "顾一鸣", "phone": "15800000055", "region": "上海市 上海市 闵行区 江川路街道",
     "detail": "东川路800号上海交通大学闵行校区东22宿舍", "tag": "学校", "isDefault": False},
]
ADDR_FULL = lambda a: f"{a['region'].replace(' ', '')}{a['detail']}"
addr_snap = lambda a: {"name": a["name"], "phone": a["phone"][:3] + "****" + a["phone"][-4:], "full": ADDR_FULL(a)}

# ---------------- 购物车 ----------------
cart = [
    {"id": "c1", "itemId": "i_bodywash", "skuDesc": "规格:500mL×2", "qty": 1, "price": 217,
     "selected": False, "invalid": False, "addedAt": T(-1, 9)},
    {"id": "c2", "itemId": "i_earbuds", "skuDesc": "颜色:白色", "qty": 1, "price": 399,
     "selected": False, "invalid": False, "addedAt": T(-2, 14)},
    {"id": "c3", "itemId": "i_hoodie", "skuDesc": "颜色:白灰色;尺码:M", "qty": 1, "price": 96.9,
     "selected": False, "invalid": False, "addedAt": T(-2, 20)},
    {"id": "c4", "itemId": "i_nuts", "skuDesc": "规格:30包", "qty": 2, "price": 75.2,
     "selected": False, "invalid": False, "addedAt": T(-5, 11)},
    {"id": "c5", "itemId": "i_tissue", "skuDesc": "规格:24包", "qty": 1, "price": 12.9,
     "selected": False, "invalid": True, "addedAt": T(-20, 8)},
]

# ---------------- 订单 ----------------
def line(iid, sku, qty=1, price=None):
    it = next(x for x in items if x["id"] == iid)
    return {"itemId": iid, "title": it["title"], "image": it["image"],
            "skuDesc": sku, "price": price if price is not None else it["price"], "qty": qty}

orders = [
    {"id": "o_pend", "orderNo": "3307249273297013984", "shopId": "s_qfs", "shopName": "清风山旗舰店",
     "shopBadge": "tmall", "lines": [line("i_handcream", "香味:山雾;规格:75mL 单支", 1, 280)],
     "itemTotal": 280, "shopDiscount": 0, "shippingFee": 0, "paidAmount": 280,
     "status": "pendingPayment", "addressSnapshot": addr_snap(addresses[0]), "payMethod": None,
     "createdAt": T(2, 10, 41), "paidAt": None, "shippedAt": None, "completedAt": None,
     "payDeadline": T(2, 12, 41), "autoConfirmAt": None,
     "logistics": {"noLogistics": False, "company": None, "trackingNo": None, "nodes": []},
     "reviewed": False, "gift": None},
    {"id": "o_ship1", "orderNo": "3306457095190013984", "shopId": "s_lanjing", "shopName": "蓝鲸数码旗舰店",
     "shopBadge": "tmall", "lines": [line("i_alarm", "颜色:曜石黑", 1, 110)],
     "itemTotal": 110, "shopDiscount": 0, "shippingFee": 0, "paidAmount": 110,
     "status": "shipped", "addressSnapshot": addr_snap(addresses[0]), "payMethod": "微信支付",
     "createdAt": T(0, 12, 37), "paidAt": T(0, 12, 37), "shippedAt": T(0, 12, 38), "completedAt": None,
     "payDeadline": None, "autoConfirmAt": T(8, 12, 38),
     "logistics": {"noLogistics": True, "company": None, "trackingNo": None, "nodes": []},
     "reviewed": False, "gift": None},
    {"id": "o_ship2", "orderNo": "3306458800210013984", "shopId": "s_jianmu", "shopName": "简木家居专营店",
     "shopBadge": "tmall", "lines": [line("i_lamp", "颜色:原木色", 1, 159)],
     "itemTotal": 159, "shopDiscount": 10, "shippingFee": 0, "paidAmount": 149,
     "status": "shipped", "addressSnapshot": addr_snap(addresses[0]), "payMethod": "支付宝",
     "createdAt": T(-2, 9, 12), "paidAt": T(-2, 9, 13), "shippedAt": T(-1, 16, 30), "completedAt": None,
     "payDeadline": None, "autoConfirmAt": T(7, 16, 30),
     "logistics": {"noLogistics": False, "company": "菜鸟速递", "trackingNo": "CN8861736605",
                   "nodes": [
                       {"status": "派送中", "desc": "快件正在派送途中,请保持电话畅通", "timestamp": T(0, 9, 5)},
                       {"status": "运输中", "desc": "快件已到达【无锡新吴分拨中心】", "timestamp": T(0, 2, 40)},
                       {"status": "已发货", "desc": "快件已从【杭州转运中心】发出", "timestamp": T(-1, 18, 2)},
                       {"status": "已揽收", "desc": "菜鸟速递已揽收快件", "timestamp": T(-1, 16, 35)},
                   ]},
     "reviewed": False, "gift": None},
    {"id": "o_done1", "orderNo": "2701804440017059993", "shopId": "s_qfs", "shopName": "清风山旗舰店",
     "shopBadge": "tmall", "lines": [line("i_serum", "规格:30mL【尝鲜装】", 1, 239)],
     "itemTotal": 282, "shopDiscount": 43, "shippingFee": 0, "paidAmount": 239,
     "status": "completed", "addressSnapshot": addr_snap(addresses[0]), "payMethod": "支付宝",
     "createdAt": T(-68, 14, 2), "paidAt": T(-68, 14, 3), "shippedAt": T(-67, 9, 0),
     "completedAt": T(-64, 11, 20), "payDeadline": None, "autoConfirmAt": None,
     "logistics": {"noLogistics": False, "company": "圆通速递", "trackingNo": "YT7723910044",
                   "nodes": [{"status": "已签收", "desc": "快件已签收,签收人:丰巢快递柜", "timestamp": T(-64, 11, 18)}]},
     "reviewed": False, "gift": "新客小样×1"},
    {"id": "o_done2", "orderNo": "3306455066805013984", "shopId": "s_juzi", "shopName": "桔子食品旗舰店",
     "shopBadge": "tmall", "lines": [line("i_nuts", "规格:30包", 1, 75.2)],
     "itemTotal": 75.2, "shopDiscount": 0, "shippingFee": 0, "paidAmount": 75.2,
     "status": "completed", "addressSnapshot": addr_snap(addresses[1]), "payMethod": "支付宝",
     "createdAt": T(-9, 10, 0), "paidAt": T(-9, 10, 1), "shippedAt": T(-8, 8, 0),
     "completedAt": T(-6, 12, 0), "payDeadline": None, "autoConfirmAt": None,
     "logistics": {"noLogistics": False, "company": "中通快递", "trackingNo": "ZT4456120098",
                   "nodes": [{"status": "已签收", "desc": "已签收,感谢使用中通快递", "timestamp": T(-6, 11, 58)}]},
     "reviewed": True, "gift": None},
]

refunds = [
    {"id": "rf1", "orderId": "o_refd", "line": line("i_tee", "尺码:M", 1, 62.1),
     "shopName": "云裳女装", "shopBadge": "taobao", "refundType": "退货/退款",
     "reason": "不想要了", "amount": 62.1, "status": "success", "createdAt": T(-15, 13, 0)},
]

# ---------------- 消息 ----------------
chats = [
    {"id": "ch_sys_logi", "kind": "system", "shopId": None, "name": "交易物流", "avatar": A("avatars/sys_logi.svg"),
     "unread": 1, "isSticky": False, "messages": [
         {"id": "m1", "sender": "peer", "type": "text",
          "content": "您的订单【简木 护眼台灯】已由菜鸟速递揽收,正在派送途中。", "timestamp": T(0, 9, 6)}]},
    {"id": "ch_juzi", "kind": "shop", "shopId": "s_juzi", "name": "桔子食品旗舰店", "avatar": A("avatars/s_juzi.svg"),
     "unread": 1, "isSticky": False, "messages": [
         {"id": "m1", "sender": "peer", "type": "addressConfirm",
          "content": "请确认收货地址", "timestamp": T(-8, 14, 52), "confirmed": False},
         {"id": "m2", "sender": "peer", "type": "text",
          "content": "欢迎光临桔子食品旗舰店,请问有什么可以帮到宝的呢【0元入会】入会享1元无门槛券和100-10元优惠~",
          "timestamp": T(0, 10, 40)}]},
    {"id": "ch_qfs", "kind": "shop", "shopId": "s_qfs", "name": "清风山旗舰店", "avatar": A("avatars/s_qfs.svg"),
     "unread": 0, "isSticky": False, "messages": [
         {"id": "m1", "sender": "me", "type": "text", "content": "你好,请问礼盒可以写贺卡吗?", "timestamp": T(-3, 19, 2)},
         {"id": "m2", "sender": "peer", "type": "text", "content": "亲亲可以的哦,下单备注贺卡内容即可~", "timestamp": T(-3, 19, 3)}]},
    {"id": "ch_ai", "kind": "ai", "shopId": None, "name": "AI购物助手", "avatar": A("avatars/ai.svg"),
     "unread": 0, "isSticky": False, "messages": [
         {"id": "m1", "sender": "peer", "type": "text",
          "content": "我是你的 AI 购物助手,可以帮你找商品、查订单、比价格,试试问我「有什么好用的护手霜」~",
          "timestamp": T(-1, 10, 0)}]},
]

coupons = [
    {"id": "cp1", "title": "消费券", "amount": 250, "thresholdText": "满500可用", "scope": "购物",
     "validText": "6.10-6.18 可用", "used": False},
    {"id": "cp2", "title": "门票新人券", "amount": 30, "thresholdText": "封顶减30元", "scope": "飞猪",
     "validText": "距失效仅剩2天13小时", "used": False},
    {"id": "cp3", "title": "国内机票家庭礼包券", "amount": 35, "thresholdText": "满36元可用", "scope": "飞猪",
     "validText": "限飞猪旅行指定商品可用", "used": False},
    {"id": "cp4", "title": "爆品通吃券", "amount": 1.9, "thresholdText": "券倍价", "scope": "外卖",
     "validText": "仅剩最后13:39:00", "used": False},
    {"id": "cp5", "title": "美妆加补券", "amount": 200, "thresholdText": "满990可用", "scope": "购物",
     "validText": "618品类周专享", "used": False},
    {"id": "cp6", "title": "服装加补券", "amount": 12, "thresholdText": "满120可用", "scope": "购物",
     "validText": "618品类周专享", "used": False},
]

data = {
    "user": {"id": "u_self", "nick": "tb_lakeside_99", "avatar": A("avatars/me.svg"),
             "level": "青铜会员", "is88Vip": False, "savedTotal": 1128,
             "redPacketAmount": 314, "tmallPoints": 609, "rechargeBalance": 0},
    "shops": [{k: v for k, v in s.items()} | {"logo": A(f"avatars/{s['id']}.svg")} for s in shops],
    "items": [{k: v for k, v in it.items() if k != "_short"} for it in items],
    "reviews": reviews,
    "cart": cart,
    "addresses": addresses,
    "orders": orders,
    "refunds": refunds,
    "chats": chats,
    "coupons": coupons,
    "favorites": ["i_giftbox", "i_nuts"],
    "footprints": [
        {"itemId": "i_handcream", "date": T(0)}, {"itemId": "i_alarm", "date": T(-1)},
        {"itemId": "i_sneaker", "date": T(-1)}, {"itemId": "i_hoodie", "date": T(-5)},
        {"itemId": "i_lamp", "date": T(-7)},
    ],
    "followedShops": ["s_qfs"],
    "memberShops": [],
    "searchHistory": ["护手霜", "智能闹钟", "卫衣女", "瑜伽垫", "坚果礼盒"],
    "searchDiscover": ["清风山护手霜", "智能闹钟", "白灰卫衣", "冷泡茶", "护眼台灯", "防晒衣",
                        "跑步鞋男", "保温杯", "每日坚果", "蓝牙耳机降噪"],
    "hotSearch": ["618开门红", "防晒衣UPF50", "蓝牙耳机", "每日坚果", "护手霜礼盒", "瑜伽垫加厚"],
    "myReviews": [{"orderId": "o_done2", "itemId": "i_nuts",
                   "content": "坚果很新鲜,分量足,回购第三次了。", "timestamp": T(-5, 9, 30)}],
    "priceAlerts": [],
    "claimedCenterCoupons": [],
    "homeCouponClaimed": False,
    "checkout": None,
}

# ---------------- 生成资产 ----------------
(ASSETS / "items").mkdir(parents=True, exist_ok=True)
(ASSETS / "avatars").mkdir(parents=True, exist_ok=True)
(ASSETS / "misc").mkdir(parents=True, exist_ok=True)

for i, it in enumerate(items):
    svg_card(ASSETS / "items" / f"{it['id']}.svg", it["_short"], i)
    svg_card(ASSETS / "items" / f"{it['id']}_d.svg", it["_short"] + "·详情", i, h=560)
for i, s in enumerate(shops):
    svg_avatar(ASSETS / "avatars" / f"{s['id']}.svg", s["name"][0], i)
for i in range(5):
    svg_avatar(ASSETS / "avatars" / f"u{i}.svg", REVIEWERS[i][1], i + 2)
svg_avatar(ASSETS / "avatars" / "me.svg", "淘", 0)
svg_avatar(ASSETS / "avatars" / "sys_logi.svg", "递", 1)
svg_avatar(ASSETS / "avatars" / "ai.svg", "AI", 4)
svg_map(ASSETS / "misc" / "map.svg")

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK defaults.json ({OUT.stat().st_size} bytes), items={len(items)}, orders={len(orders)}")
