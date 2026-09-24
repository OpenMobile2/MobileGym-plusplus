# -*- coding: utf-8 -*-
"""生成 apps/Xianyu/data/defaults.json(种子数据)。
永远用本脚本生成,不手写 JSON(PowerShell 读写 UTF-8 会损坏中文)。
图片:有 items/*.png 用 PNG,缺失回落逻辑路径(组件 onError 兜底为分类 SVG)。
运行: py trial_apps/mobilegym/apps/Xianyu/assets/regen_defaults.py
"""
import json
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parent / "data" / "defaults.json"

# 基准时间 2026-07-20 08:00 UTC+8
BASE = 1784592000000
DAY = 86400000
HOUR = 3600000
def T(days=0, hours=0): return BASE + days * DAY + hours * HOUR

# 商品主图指向 gen_item_images.py 产出的 PNG(缺失时组件 onError 回落分类 SVG)
def IMG(f): return f"/@app-assets/Xianyu/items/{f}"
# 头像/圈子图标保持 SVG 占位(design-tokens §5:头像用 SVG 字母)——组件按 seed 生成,路径仅占位
def AV(f): return f"/@app-assets/Xianyu/avatars/{f}"

# ---------------- 卖家(含 me) ----------------
sellers = [
    {"id": "me", "name": "闲鱼小张", "avatar": AV("me.jpg"), "shopLevel": 0, "isShop": False, "goodRate": 100, "fishScore": 426},
    {"id": "s1", "name": "数码优选鱼小铺", "avatar": AV("s1.jpg"), "shopLevel": 4, "isShop": True, "goodRate": 99, "fishScore": 1893},
    {"id": "s2", "name": "手办退坑仓", "avatar": AV("s2.jpg"), "shopLevel": 2, "isShop": True, "goodRate": 98, "fishScore": 762},
    {"id": "s3", "name": "球鞋阿哲", "avatar": AV("s3.jpg"), "shopLevel": 0, "isShop": False, "goodRate": 97, "fishScore": 231},
    {"id": "s4", "name": "文艺女青年", "avatar": AV("s4.jpg"), "shopLevel": 0, "isShop": False, "goodRate": 100, "fishScore": 588},
    {"id": "s5", "name": "键盘定制工房", "avatar": AV("s5.jpg"), "shopLevel": 3, "isShop": True, "goodRate": 99, "fishScore": 1204},
    {"id": "s6", "name": "北欧家居闲置", "avatar": AV("s6.jpg"), "shopLevel": 1, "isShop": True, "goodRate": 96, "fishScore": 402},
]

# ---------------- 商品(多样:品类/价格/成色/想要/地域/包邮/验货宝/鱼小铺等级) ----------------
items = [
    {"id": "i1", "title": "索尼 A7M4 全画幅微单 快门2千 99新带原包装", "desc": "自用机,快门数2100,无拆修无进水,配原厂电池2块、充电器、原装背带,诚心出。",
     "images": [IMG("i1.jpg")], "price": 12800, "originalPrice": 16999, "wantCount": 43, "viewCount": 1290,
     "condition": "99新", "category": "数码", "brand": "索尼", "model": "A7M4", "sellerId": "s1",
     "location": "上海·浦东新区", "distanceKm": 3.2, "freeShipping": True, "inspected": True,
     "marketLowPct": 12, "tags": ["验货宝", "包邮"]},
    {"id": "i2", "title": "初音未来 手办 景品 全新未拆 附特典", "desc": "退坑处理,全新未拆盒,附赠亚克力立牌,不议价,秒拍秒发。",
     "images": [IMG("i2.jpg")], "price": 268, "originalPrice": 399, "wantCount": 87, "viewCount": 2033,
     "condition": "全新", "category": "二次元", "brand": "手办", "sellerId": "s2",
     "location": "广州·天河区", "distanceKm": 1120, "freeShipping": True, "inspected": False,
     "marketLowPct": 33, "tags": ["包邮", "急出"]},
    {"id": "i3", "title": "Nike Dunk Low 熊猫配色 US9 轻微磨损 走一次", "desc": "上脚一次,鞋盒全,原鞋垫,尺码US9/42.5,脚感很好,便宜出。",
     "images": [IMG("i3.jpg")], "price": 459, "originalPrice": 899, "wantCount": 25, "viewCount": 640,
     "condition": "9成新", "category": "运动鞋", "brand": "Nike", "model": "Dunk Low", "sellerId": "s3",
     "location": "北京·朝阳区", "distanceKm": 980, "freeShipping": False, "inspected": False,
     "tags": []},
    {"id": "i4", "title": "iPhone 14 Pro 256G 暗紫色 电池92% 无拆修", "desc": "国行双卡,电池健康92%,面容正常,已贴膜带壳,充电口无氧化,支持验机。",
     "images": [IMG("i4.jpg")], "price": 4299, "originalPrice": 8999, "wantCount": 156, "viewCount": 5120,
     "condition": "95新", "category": "手机", "brand": "Apple", "model": "iPhone 14 Pro", "sellerId": "s1",
     "location": "上海·徐汇区", "distanceKm": 6.8, "freeShipping": True, "inspected": True,
     "marketLowPct": 8, "tags": ["验货宝", "包邮"]},
    {"id": "i5", "title": "村上春树《挪威的森林》全套二手书 8成新", "desc": "读过一遍,无笔记无划线,书角轻微磨损,不影响阅读,适合收藏党。",
     "images": [IMG("i5.jpg")], "price": 28, "wantCount": 12, "viewCount": 210,
     "condition": "8成新", "category": "图书", "brand": "上海译文", "sellerId": "s4",
     "location": "杭州·西湖区", "distanceKm": 175, "freeShipping": False, "inspected": False,
     "tags": ["低价"]},
    {"id": "i6", "title": "客制化机械键盘 68配列 Gateron轴 热插拔 自组", "desc": "自组一把,客制化外壳+卫星轴调教过,手感一流,包含PBT键帽,原包装。",
     "images": [IMG("i6.jpg")], "price": 680, "originalPrice": 1280, "wantCount": 64, "viewCount": 1580,
     "condition": "几乎全新", "category": "数码", "brand": "客制化", "model": "68配列", "sellerId": "s5",
     "location": "深圳·南山区", "distanceKm": 1420, "freeShipping": True, "inspected": True,
     "marketLowPct": 20, "tags": ["验货宝", "包邮"]},
    {"id": "i7", "title": "宜家 POÄNG 单人扶手椅 自提 8成新", "desc": "搬家处理,坐感舒适,桦木框架无损,布套可拆洗,仅限同城自提。",
     "images": [IMG("i7.jpg")], "price": 150, "originalPrice": 599, "wantCount": 8, "viewCount": 320,
     "condition": "8成新", "category": "家具", "brand": "宜家", "sellerId": "s6",
     "location": "上海·浦东新区", "distanceKm": 2.1, "freeShipping": False, "inspected": False,
     "tags": ["自提", "同城"]},
    {"id": "i8", "title": "戴森 V8 无绳吸尘器 三档吸力 换新出", "desc": "用了一年,吸力正常,配全套刷头,电池续航约30分钟,换新了便宜出。",
     "images": [IMG("i8.jpg")], "price": 899, "originalPrice": 2690, "wantCount": 38, "viewCount": 970,
     "condition": "9成新", "category": "家电", "brand": "戴森", "model": "V8", "sellerId": "s6",
     "location": "上海·长宁区", "distanceKm": 9.4, "freeShipping": True, "inspected": False,
     "marketLowPct": 15, "tags": ["包邮"]},
    # 我发布的在卖商品
    {"id": "i9", "title": "自用 iPad Air5 64G 深空灰 9成新 带 Apple Pencil", "desc": "上网课用的,屏幕无划痕,配二代笔和保护壳,毕业了出掉。",
     "images": [IMG("i9.jpg")], "price": 2680, "originalPrice": 4799, "wantCount": 19, "viewCount": 430,
     "condition": "9成新", "category": "数码", "brand": "Apple", "model": "iPad Air5", "sellerId": "me",
     "location": "上海·浦东新区", "distanceKm": 0, "freeShipping": True, "inspected": True,
     "tags": ["验货宝", "包邮"]},
    {"id": "i10", "title": "全新未拆 小米手环8 学生党闲置", "desc": "抽奖中的,全新未拆封,不需要便宜转,支持验货。",
     "images": [IMG("i10.jpg")], "price": 149, "originalPrice": 239, "wantCount": 6, "viewCount": 88,
     "condition": "全新", "category": "数码", "brand": "小米", "model": "手环8", "sellerId": "me",
     "location": "上海·浦东新区", "distanceKm": 0, "freeShipping": True, "inspected": False,
     "tags": ["包邮", "全新"]},
    # 我已下架
    {"id": "i11", "title": "闲置 Kindle Paperwhite 4 送保护套", "desc": "吃灰了出,功能正常,送原装保护套。",
     "images": [IMG("i11.jpg")], "price": 380, "wantCount": 4, "viewCount": 60,
     "condition": "9成新", "category": "数码", "brand": "Kindle", "sellerId": "me",
     "location": "上海·浦东新区", "distanceKm": 0, "freeShipping": True, "inspected": False, "tags": []},
    {"id": "i12", "title": "露营折叠桌椅套装 铝合金轻量化 九成新", "desc": "两把椅子加蛋卷桌,只用过三次,收纳袋齐全,上海可自提。",
     "images": [IMG("i7.jpg")], "price": 320, "originalPrice": 699, "wantCount": 31, "viewCount": 722,
     "condition": "9成新", "category": "户外", "brand": "牧高笛", "sellerId": "s6",
     "location": "上海·杨浦区", "distanceKm": 8.6, "freeShipping": False, "inspected": False, "tags": ["同城", "自提"]},
    {"id": "i13", "title": "任天堂 Switch OLED 白色 续航版 含双人成行", "desc": "日版机器,无漂移,屏幕已贴膜,附原装底座和游戏卡。",
     "images": [IMG("i4.jpg")], "price": 1680, "originalPrice": 2399, "wantCount": 118, "viewCount": 3460,
     "condition": "95新", "category": "数码", "brand": "Nintendo", "model": "Switch OLED", "sellerId": "s1",
     "location": "上海·静安区", "distanceKm": 5.4, "freeShipping": True, "inspected": True, "tags": ["验货宝", "包邮"]},
    {"id": "i14", "title": "乐高城市系列警察局 60316 零件齐全带说明书", "desc": "孩子拼过一次,已按步骤分袋,人仔和贴纸都在,盒子略有压痕。",
     "images": [IMG("i2.jpg")], "price": 299, "originalPrice": 699, "wantCount": 46, "viewCount": 890,
     "condition": "9成新", "category": "玩具", "brand": "LEGO", "model": "60316", "sellerId": "s2",
     "location": "苏州·工业园区", "distanceKm": 92, "freeShipping": True, "inspected": False, "tags": ["包邮"]},
    {"id": "i15", "title": "富士拍立得 mini 12 奶油白 含相纸20张", "desc": "旅行用过一次,成色很新,镜头和闪光灯正常,送两盒相纸。",
     "images": [IMG("i1.jpg")], "price": 499, "originalPrice": 799, "wantCount": 73, "viewCount": 1320,
     "condition": "几乎全新", "category": "数码", "brand": "富士", "model": "mini 12", "sellerId": "s1",
     "location": "杭州·拱墅区", "distanceKm": 168, "freeShipping": True, "inspected": True, "tags": ["验货宝", "包邮"]},
    {"id": "i16", "title": "雅诗兰黛小棕瓶精华 50ml 未拆封 有小票", "desc": "朋友送的重复了,专柜购入可提供小票,有效期到2028年。",
     "images": [IMG("i2.jpg")], "price": 520, "originalPrice": 935, "wantCount": 52, "viewCount": 1011,
     "condition": "全新", "category": "美妆", "brand": "雅诗兰黛", "sellerId": "s4",
     "location": "南京·鼓楼区", "distanceKm": 285, "freeShipping": True, "inspected": False, "tags": ["全新", "包邮"]},
    {"id": "i17", "title": "婴儿推车轻便可登机 双向高景观 灰色", "desc": "使用半年,车架稳固,布套已清洗,折叠顺滑,同城优先。",
     "images": [IMG("i7.jpg")], "price": 460, "originalPrice": 1299, "wantCount": 22, "viewCount": 506,
     "condition": "8成新", "category": "母婴", "brand": "好孩子", "sellerId": "s6",
     "location": "上海·闵行区", "distanceKm": 14.2, "freeShipping": False, "inspected": False, "tags": ["同城"]},
    {"id": "i18", "title": "小米空气净化器4 Lite 滤芯余量82%", "desc": "办公室搬迁闲置,功能正常,机身无磕碰,支持现场试机。",
     "images": [IMG("i8.jpg")], "price": 430, "originalPrice": 699, "wantCount": 18, "viewCount": 377,
     "condition": "9成新", "category": "家电", "brand": "小米", "model": "空气净化器4 Lite", "sellerId": "s6",
     "location": "上海·徐汇区", "distanceKm": 7.1, "freeShipping": False, "inspected": False, "tags": ["自提", "同城"]},
    {"id": "i19", "title": "张爱玲作品全集 10册 精装珍藏版", "desc": "搬家出书,书页干净无写画,书脊完好,整套不拆卖。",
     "images": [IMG("i5.jpg")], "price": 168, "originalPrice": 398, "wantCount": 35, "viewCount": 612,
     "condition": "9成新", "category": "图书", "brand": "北京十月文艺", "sellerId": "s4",
     "location": "杭州·滨江区", "distanceKm": 181, "freeShipping": True, "inspected": False, "tags": ["包邮"]},
    {"id": "i20", "title": "迪卡侬公路自行车 RC120 碟刹 M码", "desc": "通勤骑行约800公里,按时保养,变速顺畅,仅限同城面交。",
     "images": [IMG("i3.jpg")], "price": 1890, "originalPrice": 2999, "wantCount": 67, "viewCount": 1544,
     "condition": "9成新", "category": "运动", "brand": "迪卡侬", "model": "RC120", "sellerId": "s3",
     "location": "上海·浦东新区", "distanceKm": 4.7, "freeShipping": False, "inspected": False, "tags": ["同城", "自提"]},
  ]

# ---------------- 圈子 ----------------
circles = [
    {"id": "c1", "name": "钱币收藏圈", "icon": AV("c1.jpg"), "desc": "纸币硬币纪念币交流", "memberCount": 128000, "tag": "HOT", "category": "收藏"},
    {"id": "c2", "name": "摄影器材二手", "icon": AV("c2.jpg"), "desc": "相机镜头交易行情", "memberCount": 96000, "tag": "HOT", "category": "数码"},
    {"id": "c3", "name": "机械键盘定制", "icon": AV("c3.jpg"), "desc": "客制化键盘轴体键帽", "memberCount": 54000, "tag": "NEW", "category": "数码"},
    {"id": "c4", "name": "球鞋收藏交流", "icon": AV("c4.jpg"), "desc": "AJ椰子鉴定交易", "memberCount": 210000, "tag": "HOT", "category": "潮流"},
    {"id": "c5", "name": "手办模型退坑", "icon": AV("c5.jpg"), "desc": "手办景品谷子交流", "memberCount": 73000, "tag": "", "category": "二次元"},
    {"id": "c6", "name": "北欧家居美学", "icon": AV("c6.jpg"), "desc": "旧物改造家居闲置", "memberCount": 31000, "tag": "NEW", "category": "生活"},
]

# ---------------- 订单(买到的 + 卖出的,覆盖各状态) ----------------
orders = [
    # 买到的
    {"id": "o1", "orderNo": "2607200001", "role": "buyer", "itemId": "i5", "title": items[4]["title"], "image": items[4]["images"][0],
     "price": 28, "sellerId": "s4", "sellerName": "文艺女青年", "buyerName": "闲鱼小张",
     "status": "pendingPayment", "addressSnapshot": {"name": "张三", "phone": "138****0000", "full": "上海市浦东新区世纪大道100号"},
     "payMethod": None, "inspected": False, "reviewed": False,
     "createdAt": T(-0, -1), "paidAt": None, "shippedAt": None, "completedAt": None, "payDeadline": T(0, 1)},
    {"id": "o2", "orderNo": "2607190002", "role": "buyer", "itemId": "i3", "title": items[2]["title"], "image": items[2]["images"][0],
     "price": 459, "sellerId": "s3", "sellerName": "球鞋阿哲", "buyerName": "闲鱼小张",
     "status": "pendingShip", "addressSnapshot": {"name": "张三", "phone": "138****0000", "full": "上海市浦东新区世纪大道100号"},
     "payMethod": "支付宝", "inspected": False, "reviewed": False,
     "createdAt": T(-1), "paidAt": T(-1, 1), "shippedAt": None, "completedAt": None, "payDeadline": None},
    {"id": "o3", "orderNo": "2607170003", "role": "buyer", "itemId": "i2", "title": items[1]["title"], "image": items[1]["images"][0],
     "price": 268, "sellerId": "s2", "sellerName": "手办退坑仓", "buyerName": "闲鱼小张",
     "status": "pendingReceipt", "addressSnapshot": {"name": "张三", "phone": "138****0000", "full": "上海市浦东新区世纪大道100号"},
     "payMethod": "支付宝", "inspected": False, "reviewed": False,
     "createdAt": T(-3), "paidAt": T(-3, 1), "shippedAt": T(-2), "completedAt": None, "payDeadline": None},
    {"id": "o4", "orderNo": "2607100004", "role": "buyer", "itemId": "i6", "title": items[5]["title"], "image": items[5]["images"][0],
     "price": 680, "sellerId": "s5", "sellerName": "键盘定制工房", "buyerName": "闲鱼小张",
     "status": "pendingReview", "addressSnapshot": {"name": "张三", "phone": "138****0000", "full": "上海市浦东新区世纪大道100号"},
     "payMethod": "余额", "inspected": True, "reviewed": False,
     "createdAt": T(-10), "paidAt": T(-10, 1), "shippedAt": T(-9), "completedAt": T(-7), "payDeadline": None},
    {"id": "o5", "orderNo": "2606280005", "role": "buyer", "itemId": "i8", "title": items[7]["title"], "image": items[7]["images"][0],
     "price": 899, "sellerId": "s6", "sellerName": "北欧家居闲置", "buyerName": "闲鱼小张",
     "status": "completed", "addressSnapshot": {"name": "张三", "phone": "138****0000", "full": "上海市浦东新区世纪大道100号"},
     "payMethod": "支付宝", "inspected": False, "reviewed": True,
     "createdAt": T(-22), "paidAt": T(-22, 1), "shippedAt": T(-21), "completedAt": T(-19), "payDeadline": None},
    # 卖出的
    {"id": "o6", "orderNo": "2607180006", "role": "seller", "itemId": "i11", "title": items[10]["title"], "image": items[10]["images"][0],
     "price": 380, "sellerId": "me", "sellerName": "闲鱼小张", "buyerName": "爱看书的猫",
     "status": "pendingShip", "addressSnapshot": {"name": "李四", "phone": "159****8888", "full": "北京市海淀区中关村大街1号"},
     "payMethod": "支付宝", "inspected": False, "reviewed": False,
     "createdAt": T(-2), "paidAt": T(-2, 1), "shippedAt": None, "completedAt": None, "payDeadline": None},
    {"id": "o7", "orderNo": "2607050007", "role": "seller", "itemId": "i10", "title": items[9]["title"], "image": items[9]["images"][0],
     "price": 149, "sellerId": "me", "sellerName": "闲鱼小张", "buyerName": "跑步的鱼",
     "status": "completed", "addressSnapshot": {"name": "王五", "phone": "137****6666", "full": "广州市天河区体育西路2号"},
     "payMethod": "支付宝", "inspected": False, "reviewed": True,
     "createdAt": T(-15), "paidAt": T(-15, 1), "shippedAt": T(-14), "completedAt": T(-12), "payDeadline": None},
]

# ---------------- 私信会话 ----------------
chats = [
    {"id": "ch_s1", "sellerId": "s1", "name": "数码优选鱼小铺", "avatar": AV("s1.jpg"), "itemId": "i4",
     "unread": 2, "isSticky": False, "messages": [
        {"id": "m1", "sender": "peer", "type": "text", "content": "您好,这台14 Pro支持验货宝,可以放心拍~", "timestamp": T(-0, -2)},
        {"id": "m2", "sender": "me", "type": "text", "content": "电池健康度实际多少?", "timestamp": T(-0, -2)},
        {"id": "m3", "sender": "peer", "type": "text", "content": "92%,面容和信号都正常的,支持到付验机", "timestamp": T(-0, -1)},
        {"id": "m_coupon_cp2", "sender": "peer", "type": "system", "content": "优惠券:cp2", "timestamp": T(-0, -1)},
     ]},
    {"id": "ch_s3", "sellerId": "s3", "name": "球鞋阿哲", "avatar": AV("s3.jpg"), "itemId": "i3",
     "unread": 0, "isSticky": False, "messages": [
        {"id": "m4", "sender": "me", "type": "text", "content": "熊猫dunk还在吗,能小刀吗", "timestamp": T(-1, -3)},
        {"id": "m5", "sender": "peer", "type": "text", "content": "在的,诚心要给你抹个零头450", "timestamp": T(-1, -2)},
     ]},
    {"id": "ch_s2", "sellerId": "s2", "name": "手办退坑仓", "avatar": AV("s2.jpg"), "itemId": "i2",
     "unread": 1, "isSticky": False, "messages": [
        {"id": "m6", "sender": "peer", "type": "text", "content": "亲,初音这款是正版景品哦,已经发货啦", "timestamp": T(-2)},
     ]},
]

# ---------------- 地址 ----------------
addresses = [
    {"id": "a1", "name": "张三", "phone": "13800000000", "region": "上海市 浦东新区 花木街道", "detail": "世纪大道100号环球金融中心", "tag": "家", "isDefault": True},
    {"id": "a2", "name": "张三", "phone": "13900000001", "region": "上海市 徐汇区 漕河泾街道", "detail": "宜山路700号科技绿洲3期", "tag": "公司", "isDefault": False},
    {"id": "a3", "name": "张小妹", "phone": "13700000002", "region": "浙江省 杭州市 西湖区", "detail": "文一西路969号海创园5号楼", "tag": "学校", "isDefault": False},
]
return_addresses = [
    {"id": "ra1", "name": "张三", "phone": "13800000000", "region": "上海市 浦东新区 花木街道", "detail": "世纪大道100号环球金融中心", "isDefault": True},
]

# ---------------- 卡券 / 红包 ----------------
coupons = [
    {"id": "cp1", "title": "回收加价券", "amount": 50, "thresholdText": "回收成交可用", "scope": "回收", "validText": "7天内有效", "used": False, "kind": "coupon"},
    {"id": "cp2", "title": "购物券", "amount": 10, "thresholdText": "满100可用", "scope": "闲鱼商品", "validText": "2026-08-01到期", "used": False, "kind": "coupon"},
    {"id": "cp3", "title": "新人红包", "amount": 5, "thresholdText": "无门槛", "scope": "全场", "validText": "3天内有效", "used": False, "kind": "redpacket"},
    {"id": "cp4", "title": "包邮券", "amount": 12, "thresholdText": "指定商品包邮", "scope": "同城", "validText": "2026-07-31到期", "used": True, "kind": "coupon"},
    {"id": "cp5", "title": "验货宝体验券", "amount": 20, "thresholdText": "验货宝服务抵扣", "scope": "验货宝", "validText": "15天内有效", "used": False, "kind": "other"},
]

# ---------------- 评价 ----------------
reviews = [
    {"orderId": "o5", "itemId": "i8", "rating": 5, "content": "戴森吸力很足,卖家人很好,包装仔细,好评!", "images": [], "anonymous": False, "timestamp": T(-18)},
    {"orderId": "o7", "itemId": "i10", "rating": 5, "content": "全新未拆,发货快,靠谱卖家", "images": [], "anonymous": False, "timestamp": T(-11)},
]

# ---------------- 商品留言 ----------------
comments = {
    "i4": [
        {"id": "cm1", "user": "数码达人", "avatar": AV("u1.jpg"), "content": "电池92%还行,楼主能出到4000吗?", "likes": 12, "liked": False, "timestamp": T(-1)},
        {"id": "cm2", "user": "果粉一枚", "avatar": AV("u2.jpg"), "content": "有没有磕碰?想要", "likes": 3, "liked": False, "timestamp": T(-0, -5)},
    ],
    "i1": [
        {"id": "cm3", "user": "摄影小白", "avatar": AV("u3.jpg"), "content": "快门数2100是真的少,心动", "likes": 8, "liked": False, "timestamp": T(-2)},
    ],
}

# ---------------- 足迹 / 收藏 / 关注 / 已加圈 ----------------
footprints = [
    {"itemId": "i4", "date": T(0)}, {"itemId": "i1", "date": T(0)},
    {"itemId": "i6", "date": T(-1)}, {"itemId": "i3", "date": T(-1)},
    {"itemId": "i8", "date": T(-2)}, {"itemId": "i2", "date": T(-3)},
]
favorites = ["i4", "i6"]
followed_sellers = ["s5"]
joined_circles = ["c2", "c3"]

# ---------------- 我的发布 ----------------
listings = [
    {"itemId": "i9", "status": "onSale", "publishedAt": T(-5)},
    {"itemId": "i10", "status": "onSale", "publishedAt": T(-8)},
    {"itemId": "i11", "status": "offShelf", "publishedAt": T(-20)},
]
drafts = [
    {"id": "d1", "title": "闲置 AirPods Pro 2 左耳有点小问题", "desc": "", "price": 450, "condition": "8成新",
     "images": [], "inspected": False, "savedAt": T(-4)},
]

data = {
    "user": {"id": "me", "name": "闲鱼小张", "avatar": AV("me.jpg"), "fishScore": 426, "followers": 58, "following": 33},
    "sellers": sellers,
    "items": items,
    "circles": circles,
    "orders": orders,
    "chats": chats,
    "addresses": addresses,
    "returnAddresses": return_addresses,
    "coupons": coupons,
    "reviews": reviews,
    "comments": comments,
    "favorites": favorites,
    "footprints": footprints,
    "followedSellers": followed_sellers,
    "joinedCircles": joined_circles,
    "listings": listings,
    "drafts": drafts,
    "searchHistory": ["索尼微单", "熊猫dunk", "机械键盘", "iphone14"],
    "subscribedSearches": [],
    "hotSearches": ["iPhone 15", "Switch", "戴森吹风机", "AJ1", "拍立得", "显卡", "露营装备", "手办"],
    "checkout": None,
    "settings": {"darkMode": False, "language": "zh"},
    "taskAudit": {},
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK: {OUT} ({OUT.stat().st_size} bytes)  items={len(items)} orders={len(orders)} circles={len(circles)}")
