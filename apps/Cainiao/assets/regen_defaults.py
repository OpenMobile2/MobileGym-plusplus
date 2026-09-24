# -*- coding: utf-8 -*-
"""生成 data/defaults.json(菜鸟种子数据,对齐 spec seed 节)。
所有姓名/电话/地址/商品名/单号/取件码均为虚构脱敏数据(阶段⑥ 用户要求)。
时间用 {dayOffset, hm} 相对描述,state.ts 初始化时经 utils/appTime.seedTs 映射到模拟今天。
包裹覆盖全部筛选维度:类型(收件/寄件/停滞件)/所属(我的/亲友)/物流(待取件/派送中/运输中/待发货/已签收)/
交易(退款成功/已确认收货)/快递公司(中通/圆通/申通/韵达/百世/顺丰/邮政/德邦)。
运行: python apps/Cainiao/assets/regen_defaults.py
"""
import json
from pathlib import Path

OUT = Path(__file__).parents[1] / "data" / "defaults.json"
OUT.parent.mkdir(exist_ok=True)

A = lambda f: f"/@app-assets/Cainiao/{f}"  # noqa: E731
IMG = {
    "meat": A("products/doupi_roll.png"),
    "sauce": A("products/chili_sauce.png"),
    "sausage": A("products/corn_sausage.png"),
    "cake": A("products/berry_cake.png"),
    "cube": A("products/magic_cube.png"),
    "snack": A("products/veg_snack.png"),
    "fan": A("products/hand_fan.png"),
    "ear": A("products/ear_cushion.png"),
    "hdd": A("products/hdd.png"),
    "plant_lucky": A("products/plant_lucky.png"),
    "plant_fortune": A("products/plant_fortune.png"),
    "plant_persimmon": A("products/plant_persimmon.png"),
    "bird": A("misc/mascot_bird.png"),
}


def tl(*nodes):
    """timeline: nodes = (dayOffset, hm, title, desc)"""
    return [{"at": {"dayOffset": d, "hm": hm}, "title": t, "desc": desc} for (d, hm, t, desc) in nodes]


# 通用脱敏轨迹片段
SIGNED = lambda d, hm: (d, hm, "已签收", "包裹已由代收点签收,签收人凭取货码签收。【来自代收点】")
ARRIVE = lambda d, hm, st: (d, hm, "待取件", f"您的快递已到【{st}】,请及时领取。如有问题请联系驿站。【来自代收点】")
DELIVER = lambda d, hm: (d, hm, "派送中", "快件正在派送中,请保持电话畅通,准备签收。")
TRANSIT = lambda d, hm, city: (d, hm, "运输中", f"快件离开【{city}转运中心】,正在发往下一站。")
PICKED = lambda d, hm, comp: (d, hm, "已揽件", f"{comp}已收取快件。")

data = {
    "user": {
        "nick": "tb****8842",
        "name": "林晓",
        "phone": "13800001234",
        "avatar": A("misc/avatar_user.png"),
        "idCode": "CN2026FAKE0007A1B2C3",
        "station": "阳光苑菜鸟驿站",
        "points": 3,
        "timeoutPerk": 0,
        "shipDiscountYuan": 9,
    },
    "addresses": [
        {"id": "addr_self", "name": "林晓", "phone": "13800001234", "phoneType": "mobile",
         "province": "江苏省", "city": "南京市", "district": "栖霞区",
         "detail": "文苑路9号阳光苑3栋2单元501", "isDefaultSender": True},
        {"id": "addr_zhou", "name": "周敏", "phone": "13900002345", "phoneType": "mobile",
         "province": "江苏省", "city": "宿迁市", "district": "沭阳县",
         "detail": "幸福路18号翠湖花园6栋2单元402", "tagRelation": "亲人"},
        {"id": "addr_zhao", "name": "赵磊", "phone": "15000003456", "phoneType": "mobile",
         "province": "浙江省", "city": "温州市", "district": "鹿城区",
         "detail": "书香路25号3号楼1单元702", "tagRelation": "朋友"},
        {"id": "addr_sun", "name": "孙悦", "phone": "18800004567", "phoneType": "mobile",
         "province": "广东省", "city": "东莞市", "district": "南城街道",
         "detail": "创业大道100号科技园A座1203", "tagRelation": "客户"},
    ],
    # 16 个包裹,覆盖全部筛选维度
    "packages": [
        # 待取件 · 收件 · 我的 · 极兔
        {"id": "pkg_meat", "title": "即食鸡胸肉卷 健身低脂代餐 4口味组合", "source": "天猫",
         "image": IMG["meat"], "company": "极兔速递", "trackingNo": "JT2026030815601",
         "status": "待取件", "kind": "收件", "owner": "我的", "pickupCode": "583920",
         "station": "阳光苑菜鸟驿站B区3号柜", "stationCell": "3号柜", "daysInStation": 1,
         "statusAt": {"dayOffset": -1, "hm": "11:26"},
         "timeline": tl(
             ARRIVE(-1, "11:26", "阳光苑菜鸟驿站"),
             DELIVER(-1, "09:52"),
             TRANSIT(-2, "05:34", "南京"),
             PICKED(-3, "15:03", "极兔速递"),
         )},
        # 已签收 · 收件 · 我的 · 邮政(消息联动主包裹,完整轨迹)
        {"id": "pkg_sauce", "title": "香辣下饭酱 牛肉风味 280g*1瓶", "source": "天猫",
         "image": IMG["sauce"], "company": "邮政快递", "trackingNo": "EMS2026047188322",
         "status": "已签收", "kind": "收件", "owner": "我的",
         "statusAt": {"dayOffset": -7, "hm": "18:04"},
         "timeline": tl(
             SIGNED(-7, "18:04"),
             ARRIVE(-7, "11:26", "阳光苑菜鸟驿站5号柜"),
             DELIVER(-7, "09:52"),
             TRANSIT(-8, "05:34", "南京"),
             TRANSIT(-9, "19:43", "贵阳"),
             PICKED(-9, "15:03", "中国邮政"),
         )},
        # 已签收 · 收件 · 我的 · 中通
        {"id": "pkg_sausage", "title": "玉米风味火腿肠 60g*10支装", "source": "天猫",
         "image": IMG["sausage"], "company": "中通快递", "trackingNo": "ZT2026073626201",
         "status": "已签收", "kind": "收件", "owner": "我的",
         "statusAt": {"dayOffset": -28, "hm": "18:25"},
         "timeline": tl(SIGNED(-28, "18:25"), TRANSIT(-29, "08:15", "南京"), PICKED(-30, "20:11", "中通快递"))},
        # 已签收 · 收件 · 我的 · 中通
        {"id": "pkg_cake", "title": "蓝莓夹心小蛋糕 涂层巧克力 零食", "source": "天猫",
         "image": IMG["cake"], "company": "中通快递", "trackingNo": "ZT2026073588754",
         "status": "已签收", "kind": "收件", "owner": "我的",
         "statusAt": {"dayOffset": -36, "hm": "17:59"},
         "timeline": tl(SIGNED(-36, "17:59"), PICKED(-38, "13:40", "中通快递"))},
        # 已签收 · 收件 · 我的 · 圆通
        {"id": "pkg_cube", "title": "三阶磁力魔方 竞速益智玩具", "source": "天猫",
         "image": IMG["cube"], "company": "圆通速递", "trackingNo": "YT2026075133226",
         "status": "已签收", "kind": "收件", "owner": "我的",
         "statusAt": {"dayOffset": -36, "hm": "17:59"},
         "timeline": tl(SIGNED(-36, "17:59"), PICKED(-38, "09:22", "圆通速递"))},
        # 已签收 · 收件 · 我的 · 圆通
        {"id": "pkg_snack", "title": "手撕素肉 休闲零食 小吃大礼包", "source": "天猫",
         "image": IMG["snack"], "company": "圆通速递", "trackingNo": "YT2026076012907",
         "status": "已签收", "kind": "收件", "owner": "我的",
         "statusAt": {"dayOffset": -36, "hm": "17:58"},
         "timeline": tl(SIGNED(-36, "17:58"), PICKED(-37, "22:05", "圆通速递"))},
        # 已签收 · 收件 · 我的 · 菜鸟(官方)
        {"id": "pkg_official", "title": "手机尾号1234的包裹", "source": "菜鸟速递",
         "image": IMG["bird"], "company": "菜鸟速递", "trackingNo": "CN2026778812901",
         "status": "已签收", "kind": "收件", "owner": "我的", "official": True,
         "statusAt": {"dayOffset": -7, "hm": "18:05"},
         "timeline": tl(SIGNED(-7, "18:05"), DELIVER(-7, "09:40"), TRANSIT(-8, "21:02", "南京"), PICKED(-9, "16:33", "菜鸟速递"))},
        # 已揽件 · 停滞件 · 我的 · 圆通(很久没更新)
        {"id": "pkg_fan", "title": "退货|手持小风扇 便携USB充电", "source": "天猫退货",
         "image": IMG["fan"], "company": "圆通速递", "trackingNo": "YT2026075619830",
         "status": "已揽件", "kind": "停滞件", "owner": "我的", "staleHint": True,
         "statusAt": {"dayOffset": -16, "hm": "10:12"},
         "timeline": tl(PICKED(-16, "10:12", "圆通速递"))},
        # 已签收 · 收件 · 我的 · 顺丰 · 退款成功
        {"id": "pkg_ear", "title": "耳机套 替换耳罩 通用款(已退货)", "source": "天猫",
         "image": IMG["ear"], "company": "顺丰速递", "trackingNo": "SF2026099820137",
         "status": "已签收", "kind": "收件", "owner": "我的", "tradeStatus": "退款成功",
         "statusAt": {"dayOffset": -20, "hm": "14:08"},
         "timeline": tl(SIGNED(-20, "14:08"), PICKED(-21, "09:15", "顺丰速递"))},
        # 待发货 · 收件 · 我的 · 德邦
        {"id": "pkg_hdd", "title": "移动硬盘 1T 高速加密 电脑外接", "source": "天猫",
         "image": IMG["hdd"], "company": "德邦快递", "trackingNo": "DB2026061200945",
         "status": "待发货", "kind": "收件", "owner": "我的",
         "statusAt": {"dayOffset": -1, "hm": "20:30"},
         "timeline": tl((-1, "20:30", "待发货", "商品已下单,等待商家发货。"))},
        # 派送中 · 收件 · 我的 · 韵达
        {"id": "pkg_plant1", "title": "富贵竹水培绿植 办公室桌面盆栽", "source": "天猫",
         "image": IMG["plant_lucky"], "company": "韵达速递", "trackingNo": "YD2026044517700",
         "status": "派送中", "kind": "收件", "owner": "我的",
         "statusAt": {"dayOffset": 0, "hm": "09:40"},
         "timeline": tl(DELIVER(0, "09:40"), TRANSIT(-1, "22:10", "杭州"), PICKED(-2, "10:05", "韵达速递"))},
        # 运输中 · 收件 · 我的 · 申通
        {"id": "pkg_plant2", "title": "发财树水培盆栽 办公室客厅绿植", "source": "天猫",
         "image": IMG["plant_fortune"], "company": "申通快递", "trackingNo": "STO2026038800112",
         "status": "运输中", "kind": "收件", "owner": "我的",
         "statusAt": {"dayOffset": -1, "hm": "08:20"},
         "timeline": tl(TRANSIT(-1, "08:20", "上海"), PICKED(-2, "18:30", "申通快递"))},
        # 已签收 · 收件 · 我的 · 百世 · 已确认收货
        {"id": "pkg_deco", "title": "柿柿如意摆件 室内办公桌面装饰", "source": "天猫",
         "image": IMG["plant_persimmon"], "company": "百世快递", "trackingNo": "BS2026052300880",
         "status": "已签收", "kind": "收件", "owner": "我的", "tradeStatus": "已确认收货",
         "statusAt": {"dayOffset": -14, "hm": "16:40"},
         "timeline": tl(SIGNED(-14, "16:40"), PICKED(-16, "11:20", "百世快递"))},
        # 已签收 · 收件 · 亲友 · 中通
        {"id": "pkg_friend1", "title": "亲友代收|香辣下饭酱 3瓶装", "source": "天猫",
         "image": IMG["sauce"], "company": "中通快递", "trackingNo": "ZT2026073699001",
         "status": "已签收", "kind": "收件", "owner": "亲友",
         "statusAt": {"dayOffset": -10, "hm": "19:12"},
         "timeline": tl(SIGNED(-10, "19:12"), PICKED(-12, "08:40", "中通快递"))},
        # 派送中 · 收件 · 亲友 · 韵达
        {"id": "pkg_friend2", "title": "亲友代收|玉米火腿肠礼盒", "source": "天猫",
         "image": IMG["sausage"], "company": "韵达速递", "trackingNo": "YD2026044588220",
         "status": "派送中", "kind": "收件", "owner": "亲友",
         "statusAt": {"dayOffset": 0, "hm": "10:15"},
         "timeline": tl(DELIVER(0, "10:15"), PICKED(-1, "20:00", "韵达速递"))},
        # 运输中 · 寄件 · 我的 · 顺丰
        {"id": "pkg_sent", "title": "我寄出的|同城文件资料", "source": "寄件",
         "image": IMG["snack"], "company": "顺丰速递", "trackingNo": "SF2026099876543",
         "status": "运输中", "kind": "寄件", "owner": "我的",
         "statusAt": {"dayOffset": 0, "hm": "13:20"},
         "timeline": tl(TRANSIT(0, "13:20", "南京"), PICKED(0, "10:40", "顺丰速递"))},
    ],
    # 寄件单:1 待寄出 + 1 已寄出
    "shipOrders": [
        {"id": "so_pending", "orderNo": "20260716880144730", "placedAt": {"dayOffset": -1, "hm": "20:45"},
         "typeLabel": "裹裹-标准寄", "shipCode": "6688", "status": "待上门取件", "method": "pickup",
         "fromName": "林晓", "fromCity": "南京市", "fromPhone": "13800001234",
         "fromDetail": "江苏省南京市栖霞区文苑路9号阳光苑3栋2单元501",
         "toName": "周敏", "toCity": "宿迁市", "toPhone": "13900002345",
         "toDetail": "江苏省宿迁市沭阳县幸福路18号翠湖花园6栋2单元402",
         "itemLabel": "日用品, 1kg", "feeYuan": 8, "slotText": "明天 09:00-11:00",
         "handoverText": "当面交件 | 需要打电话"},
        {"id": "so_shipped", "orderNo": "20260519770144730", "placedAt": {"dayOffset": -59, "hm": "05:39"},
         "typeLabel": "天猫-标准寄", "status": "已寄出", "method": "pickup",
         "fromName": "林晓", "fromCity": "南京市", "fromPhone": "13800001234",
         "fromDetail": "江苏省南京市栖霞区文苑路9号阳光苑3栋2单元501",
         "toName": "孙悦", "toCity": "东莞市", "toPhone": "18800004567",
         "toDetail": "广东省东莞市南城街道创业大道100号科技园A座1203",
         "itemLabel": "衣物, 1kg", "feeYuan": 9},
    ],
    "shopOrders": [
        {"id": "sho_sauce", "shop": "老张下饭酱旗舰店", "status": "卖家已发货",
         "itemTitle": "香辣下饭酱 牛肉风味 280g*1瓶", "image": IMG["sauce"], "paidYuan": 15.03, "packageId": "pkg_sauce"},
        {"id": "sho_meat", "shop": "轻食代餐旗舰店", "status": "交易成功",
         "itemTitle": "即食鸡胸肉卷 低脂代餐 4口味共11个", "image": IMG["meat"], "paidYuan": 25.80, "packageId": "pkg_meat"},
        {"id": "sho_sausage", "shop": "优选食品官方旗舰店", "status": "交易成功",
         "itemTitle": "玉米风味火腿肠 60g*10支装", "image": IMG["sausage"], "paidYuan": 27.10, "packageId": "pkg_sausage"},
    ],
    # 包裹消息(与 pkg_sauce/pkg_official 联动,≥6 条)
    "packageMsgs": [
        {"id": "pm1", "at": {"dayOffset": -9, "hm": "12:40"}, "title": "发货通知",
         "desc": "邮政快递包裹发来一条发货信息,请核对>>", "image": IMG["sauce"], "packageId": "pkg_sauce"},
        {"id": "pm2", "at": {"dayOffset": -9, "hm": "15:03"}, "title": "揽收通知",
         "desc": "快递员发来一条揽收提醒,查看到达时间>>", "image": IMG["sauce"], "packageId": "pkg_sauce"},
        {"id": "pm3", "at": {"dayOffset": -7, "hm": "09:53"}, "title": "派送通知",
         "desc": "快递员正在派送您的包裹,点击查看详情>>", "image": IMG["sauce"], "packageId": "pkg_sauce"},
        {"id": "pm4", "at": {"dayOffset": -7, "hm": "10:13"}, "title": "取件通知",
         "desc": "快递员发来一条取件提醒", "image": IMG["bird"], "packageId": "pkg_official"},
        {"id": "pm5", "at": {"dayOffset": -7, "hm": "11:26"}, "title": "取件通知",
         "desc": "快递员发来一条取件提醒", "image": IMG["sauce"], "packageId": "pkg_sauce"},
        {"id": "pm6", "at": {"dayOffset": -7, "hm": "18:09"}, "title": "签收通知",
         "desc": "您有2个包裹完成签收,立即点击核对>>", "image": IMG["sauce"], "packageId": "pkg_sauce"},
    ],
    # 菜鸟问问消息(7 条)
    "wenwenMsgs": [
        {"id": "ww%d" % i, "at": {"dayOffset": off, "hm": hm}, "title": "消息通知",
         "desc": "收到一条新的问问消息,点击查看>"}
        for i, (off, hm) in enumerate([(-6, "11:04"), (-5, "17:49"), (-4, "13:52"), (-3, "20:32"), (-2, "13:06"), (-1, "16:08"), (0, "16:08")], 1)
    ],
    "unread": {"wenwen": 8, "package": 12},
    # 我的权益:寄件券 6 + 红包 1
    "coupons": [
        {"id": "c1", "kind": "shipping", "discount": "1折", "title": "【APP专享】国际1折寄件券", "expiryText": "明天将过期"},
        {"id": "c2", "kind": "shipping", "discount": "1折", "title": "【APP专享】国际1折寄件券", "expiryText": "明天将过期"},
        {"id": "c3", "kind": "shipping", "discount": "1折", "title": "【APP专享】港澳台1折券", "expiryText": "有效期至: 2026/07/23"},
        {"id": "c4", "kind": "shipping", "discount": "8.8折", "title": "特惠大件折扣券", "expiryText": "有效期至: 2026/07/21"},
        {"id": "c5", "kind": "shipping", "discount": "9折", "title": "特惠大件折扣券", "expiryText": "有效期至: 2026/07/23"},
        {"id": "c6", "kind": "shipping", "discount": "¥8", "title": "港澳台&国际通用立减券", "expiryText": "后天将过期"},
        {"id": "r1", "kind": "redpacket", "discount": "¥0.5", "title": "菜鸟淘礼金红包", "expiryText": "2026-07-21 19:00 到期"},
    ],
    # 购物券 Tab 精选优惠
    "marketCoupons": [
        {"id": "mc1", "title": "办公室桌面风水竹 口碑好评100%", "image": IMG["plant_lucky"], "priceBefore": 10.9, "redpacket": 0.5, "claimed": False},
        {"id": "mc2", "title": "香辣下饭酱 牛肉风味大瓶装", "image": IMG["sauce"], "priceBefore": 8.8, "redpacket": 0.5, "claimed": False},
        {"id": "mc3", "title": "移动硬盘1T 电脑高速加密", "image": IMG["hdd"], "priceBefore": 399, "redpacket": 0.5, "claimed": False},
        {"id": "mc4", "title": "发财树水培植物 室内盆栽办公室", "image": IMG["plant_fortune"], "priceBefore": 13.5, "redpacket": 0.5, "claimed": False},
        {"id": "mc5", "title": "富贵竹室内植物 桌面绿植好养", "image": IMG["plant_lucky"], "priceBefore": 8.8, "redpacket": 0.5, "claimed": False},
        {"id": "mc6", "title": "通用耳机套 替换耳罩柔软亲肤", "image": IMG["ear"], "priceBefore": 19.9, "redpacket": 0.5, "claimed": False},
    ],
    # 首页瀑布流(纯装饰)
    "homeFeed": [
        {"id": "hf1", "title": "柿柿如意摆件 室内办公装饰", "price": 49, "sold": "10+人已付款", "image": IMG["plant_persimmon"]},
        {"id": "hf2", "title": "富贵竹迷你盆栽 桌面绿植", "price": 39, "sold": "50+人已付款", "image": IMG["plant_lucky"]},
        {"id": "hf3", "title": "发财树水培小盆栽 办公室绿植", "price": 29.9, "sold": "100+人已付款", "image": IMG["plant_fortune"]},
        {"id": "hf4", "title": "移动硬盘1T 高速加密", "price": 399, "sold": "30+人已付款", "image": IMG["hdd"]},
    ],
    "phones": [{"number": "13800001234", "primary": True}],
    # 服务点(自寄)与柜机(脱敏)
    "stations": [
        {"id": "st_north", "brand": "菜鸟驿站", "official": True, "name": "阳光苑北区驿站", "distance": "525m",
         "addr": "栖霞区文苑路9号阳光苑北区商业街", "hours": "08:30—19:30", "tags": ["免费包装", "随到随寄"], "price": "¥7起"},
        {"id": "st_market", "brand": "裹裹优选·兔喜", "official": False, "name": "阳光苑农贸市场店", "distance": "583m",
         "addr": "栖霞区文苑路阳光苑农贸市场快递驿站", "hours": "00:00—23:59", "tags": ["随到随寄"], "price": "¥7起"},
    ],
    "lockers": [
        {"id": "lk1", "name": "阳光苑东区1号丰巢柜", "addr": "江苏省南京市栖霞区文苑路9号", "distance": "339m", "nearest": True},
        {"id": "lk2", "name": "阳光苑东区2号丰巢柜", "addr": "江苏省南京市栖霞区文苑路9号", "distance": "339m"},
        {"id": "lk3", "name": "阳光苑南门3号丰巢柜", "addr": "江苏省南京市栖霞区文苑路11号", "distance": "412m"},
        {"id": "lk4", "name": "阳光苑西区1号丰巢柜", "addr": "江苏省南京市栖霞区文苑路7号", "distance": "455m"},
        {"id": "lk5", "name": "阳光苑北区5号丰巢柜", "addr": "江苏省南京市栖霞区文苑路9号", "distance": "520m"},
        {"id": "lk6", "name": "阳光苑室内2号丰巢柜", "addr": "江苏省南京市栖霞区文苑路9号商业街", "distance": "560m"},
    ],
    # 省市区(选择器数据,地理数据非隐私,保持不变)
    "regions": {
        "热门城市": ["北京", "上海", "广州", "深圳", "东莞", "杭州", "成都", "南京市"],
        "省份": {
            "北京": {"北京市": ["东城区", "西城区", "朝阳区", "海淀区", "丰台区"]},
            "上海": {"上海市": ["黄浦区", "徐汇区", "静安区", "浦东新区", "杨浦区"]},
            "江苏省": {
                "南京市": ["玄武区", "秦淮区", "鼓楼区", "栖霞区", "江宁区", "浦口区"],
                "苏州市": ["姑苏区", "虎丘区", "吴中区", "工业园区"],
                "宿迁市": ["宿城区", "宿豫区", "沭阳县", "泗阳县"],
                "无锡市": ["梁溪区", "锡山区", "惠山区"],
            },
            "浙江省": {
                "杭州市": ["上城区", "拱墅区", "西湖区", "滨江区", "萧山区"],
                "温州市": ["鹿城区", "龙湾区", "瓯海区", "洞头区", "永嘉县", "平阳县"],
                "宁波市": ["海曙区", "江北区", "鄞州区"],
            },
            "广东省": {
                "广州市": ["越秀区", "海珠区", "天河区", "白云区"],
                "深圳市": ["福田区", "罗湖区", "南山区", "宝安区"],
                "东莞市": ["南城街道", "东城街道", "莞城街道"],
            },
            "安徽省": {"合肥市": ["庐阳区", "蜀山区", "包河区"], "芜湖市": ["镜湖区", "弋江区"]},
            "山东省": {"济南市": ["历下区", "市中区"], "青岛市": ["市南区", "崂山区"]},
            "四川省": {"成都市": ["锦江区", "青羊区", "武侯区", "高新区"]},
            "湖北省": {"武汉市": ["江岸区", "武昌区", "洪山区"]},
            "河南省": {"郑州市": ["中原区", "金水区"]},
            "福建省": {"福州市": ["鼓楼区", "台江区"], "厦门市": ["思明区", "湖里区"]},
            "贵州省": {"贵阳市": ["南明区", "云岩区", "观山湖区"]},
        },
    },
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK: defaults.json ({OUT.stat().st_size} bytes, packages={len(data['packages'])})")
