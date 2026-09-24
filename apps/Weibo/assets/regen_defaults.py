# -*- coding: utf-8 -*-
"""生成 data/defaults.json(§10.3:每主列表≥5条且多样;绝对 Unix 毫秒时间戳)。"""
import json
import re
from pathlib import Path

OUT = Path(__file__).parent.parent / "data" / "defaults.json"
BASE_TS = 1783950000000  # 2026-07-13 11:00 UTC+8 前后
H = lambda h, m=0: BASE_TS - int(h * 3600000) - m * 60000  # H(2)=2小时前
A = lambda f: f"/@app-assets/Weibo/gen/{f}.png"

users = [
    # id, name, avatar, verified, vip, intro, fans, follows, inter, header, followedByMe, followsMe, frequent
    ("u_xinlangent", "新浪娱乐", "av17", "org", 1, "新浪娱乐官方微博", 32150000, 512, 89000000, "hd03", True, False, "互动1次"),
    ("u_fangdong", "房东的猫语", "av07", "person", 3, "情感博主", 3106000, 183, 28038000, "hd01", False, False, None),
    ("u_ganfan", "干饭达子", "av01", "person", 2, "美食博主 干饭第一名", 1250000, 320, 5600000, "hd04", True, False, "看博文1次"),
    ("u_sichuan", "一个四川人说爱我", "av05", None, 1, "日常碎碎念", 88000, 456, 230000, "hd02", True, False, None),
    ("u_weather", "weather爱好者", "av18", "person", 2, "科技博主 超话主持人", 2340000, 89, 12000000, "hd06", False, False, None),
    ("u_gdtv", "广东广播电视台", "av20", "org", 2, "广东广播电视台官方账号", 8900000, 156, 45000000, "hd03", False, False, None),
    ("u_xinduo", "心动半盏茶", "av08", "person", 1, "电视剧博主", 560000, 780, 1200000, "hd05", True, True, "看视频1次"),
    ("u_yulu", "屿鹿", "av03", None, None, "摄影记录生活", 12000, 233, 56000, "hd02", True, True, "看视频1次"),
    ("u_shiyidui", "是一对三舞吖", "av06", None, None, "舞见 | 约稿私信", 4500, 189, 12000, "hd04", True, True, None),
    ("u_xusong", "许嵩", "av13", "person", 6, "音乐人", 12800000, 45, 156000000, "hd05", True, False, "互动1次"),
    ("u_tiyusheng", "体育生爱咋咋地", "av04", "person", 2, "体育博主", 890000, 340, 3400000, "hd06", False, False, None),
    ("u_moli", "模特-邢晴", "av02", "person", 1, "时尚模特", 460000, 120, 890000, "hd01", False, False, None),
    ("u_stage", "stage1st宅社区", "av19", "org", 3, "游戏博主", 1100000, 67, 8900000, "hd03", False, False, None),
    ("u_liszt", "演员李思潼", "av09", "person", 1, "青年演员", 230000, 98, 450000, "hd02", False, False, None),
    ("u_paopao", "泡泡的syq", "av10", None, None, "学生党", 890, 445, 3400, "hd04", False, True, None),
    ("u_keji", "科技小辛", "av11", "person", 2, "数码博主", 1780000, 220, 9800000, "hd06", False, False, None),
    ("u_maomao", "猫猫观察日记", "av12", None, 1, "萌宠博主", 340000, 156, 780000, "hd01", True, False, "今天访问1次"),
    ("u_jianshen", "撸铁教练老王", "av14", "person", None, "健身教练", 156000, 89, 340000, "hd05", False, False, None),
    ("u_lvxing", "在路上的阿真", "av15", None, 1, "旅行博主", 78000, 267, 190000, "hd02", False, False, None),
    ("u_shuma", "复古胶片馆", "av16", None, None, "胶片摄影爱好者", 23000, 340, 45000, "hd04", False, False, None),
]

def U(i):
    (uid, name, av, ver, vip, intro, fans, fol, inter, hd, fbm, fm, freq) = users[i]
    d = {"id": uid, "name": name, "avatar": A(av), "intro": intro, "fans": fans,
         "follows": fol, "interactions": inter, "headerImage": A(hd)}
    if ver: d["verified"] = ver
    if vip: d["vipLevel"] = vip
    if fbm: d["followedByMe"] = True
    if fm: d["followsMe"] = True
    if freq: d["frequentInfo"] = freq
    return d

C = lambda cid, uid, text, h, region, likes, hot=False, badge=None, replies=None, replyTo=None: {
    "id": cid, "userId": uid, "text": text, "timestamp": H(h), "region": region,
    "likes": likes, "hot": hot, **({"fanBadge": badge} if badge else {}),
    **({"replyTo": replyTo} if replyTo else {}), "replies": replies or []}

statuses = [
    {
        "id": "s_typhoon", "userId": "u_weather",
        "text": "#台风巴威路径又开始摇摆了# 【巴威路径北调】最新的预报看,中央气象台将台风巴威的移动路径北抬,不考虑登陆台湾北部,明天夜间将直接在浙江南部附近沿海登陆。大家防范准备要做足!#台风巴威#",
        "timestamp": H(15), "source": "微博网页版", "images": [A("po01"), A("po02"), A("po03")],
        "reposts": 66, "comments": 190, "likes": 1239, "channel": "热点", "edited": True,
        "hotComment": {"text": "大家一定要记住这种乳状云,预兆特大暴雨在酝酿了", "likes": 5954},
        "commentList": [
            C("c_ty1", "u_sichuan", "浙江的朋友注意安全!", 14, "来自浙江", 589, True, "铁粉Ⅱ",
              [C("c_ty1r1", "u_weather", "会持续更新路径", 13, "来自北京", 364, replyTo="一个四川人说爱我"),
               C("c_ty1r2", "u_paopao", "回复@weather爱好者:辛苦了!", 12, "来自江苏", 12, replyTo="weather爱好者")]),
            C("c_ty2", "u_ganfan", "已经开始囤菜了", 11, "来自上海", 230, True),
            C("c_ty3", "u_yulu", "今天的云确实很奇怪", 9, "来自福建", 88),
            C("c_ty4", "u_keji", "AI模型和传统模式又打架了", 7, "来自广东", 45),
            C("c_ty5", "u_lvxing", "航班已取消,改签中…", 3, "来自浙江", 21),
        ],
    },
    {
        "id": "s_xusong", "userId": "u_xusong",
        "text": "「安泊猜想」07 一见如故 08 出雨林记 09 忽略不计 QQ音乐: ▷安泊猜想… 全文",
        "timestamp": H(300), "source": "iPhone 17 Pro", "images": [A("po06"), A("po04"), A("po05")],
        "reposts": 41000, "comments": 33000, "likes": 61000, "likedByMe": False, "channel": "热门", "fromFollow": True,
        "hotComment": {"text": "夜阑时分惊起听雨声:新专不是9首吗,有一首忽略不计,然后还有一…", "likes": 2605},
        "commentList": [
            C("c_xs1", "u_shiyidui", "词还是那么绝!", 290, "来自江苏", 1200, True, "嵩鼠Ⅳ"),
            C("c_xs2", "u_sichuan", "循环一整天了", 280, "来自四川", 890, True),
            C("c_xs3", "u_yulu", "演唱会门票蹲一张", 260, "来自江苏", 456),
            C("c_xs4", "u_paopao", "前奏一响就泪目", 240, "来自安徽", 234),
            C("c_xs5", "u_maomao", "猫都听入迷了", 220, "来自浙江", 78),
        ],
    },
    {
        "id": "s_ganfan", "userId": "u_ganfan",
        "text": "看到金靖化的网红妆才明白,原来氛围感美女真的存在 #美食探店# 顺便安利这家火锅,毛肚绝了!",
        "timestamp": H(20), "source": "荣耀400 Pro", "images": [A("po14"), A("po13"), A("po15"), A("po16"), A("po17"), A("po18")],
        "reposts": 6, "comments": 72, "likes": 1948, "channel": "热门", "fromFollow": True,
        "commentList": [
            C("c_gf1", "u_sichuan", "这家店在哪!求地址", 19, "来自四川", 156, True),
            C("c_gf2", "u_maomao", "深夜放毒举报了", 18, "来自浙江", 89),
            C("c_gf3", "u_jianshen", "热量警告⚠️", 15, "来自北京", 67),
            C("c_gf4", "u_lvxing", "下周去打卡", 12, "来自江苏", 23),
            C("c_gf5", "u_shuma", "拍得真好", 10, "来自上海", 11),
        ],
    },
    {
        "id": "s_graduate", "userId": "u_liszt",
        "text": "很多次想过 我毕业的场景会是怎么样的呢 想过自己会不舍 会感慨 可能还会抱着舍友哭 但今天站在台上面对大家的时候 心只是有点砰砰的跳 为我 也为大家的校园时光的落幕… 全文 #毕业季#",
        "timestamp": H(400), "source": "iPhone客户端", "images": [A("po07"), A("po08"), A("po09")],
        "reposts": 120, "comments": 46, "likes": 2127, "channel": "星品",
        "commentList": [
            C("c_gr1", "u_moli", "毕业快乐!前程似锦", 390, "来自北京", 445, True),
            C("c_gr2", "u_paopao", "我也刚毕业,共勉!", 380, "来自江苏", 120),
            C("c_gr3", "u_xinduo", "青春真好", 360, "来自湖南", 89),
            C("c_gr4", "u_yulu", "照片拍得很有故事感", 340, "来自江苏", 34),
            C("c_gr5", "u_shiyidui", "泪目了", 320, "来自江苏", 12),
        ],
    },
    {
        "id": "s_cat", "userId": "u_maomao",
        "text": "当◇哈兰德 拥有完美脸型比例会怎么样 我家主子睡觉的第108种姿势,这也太治愈了吧 #萌宠日常# @复古胶片馆 帮拍的",
        "timestamp": H(28), "source": "微博视频号", "images": [A("po19"), A("po20"), A("po21")],
        "reposts": 477, "comments": 4681, "likes": 93000, "channel": "热门",
        "hotComment": {"text": "这猫比我睡得都好", "likes": 3200},
        "commentList": [
            C("c_ct1", "u_ganfan", "已保存,当壁纸了", 27, "来自上海", 890, True),
            C("c_ct2", "u_sichuan", "哈哈哈哈第二张笑死", 26, "来自四川", 456, True),
            C("c_ct3", "u_lvxing", "求猫粮链接", 24, "来自云南", 123),
            C("c_ct4", "u_jianshen", "撸猫使我快乐", 20, "来自北京", 45),
            C("c_ct5", "u_keji", "像素感人,用什么拍的?", 18, "来自广东", 33),
        ],
    },
    {
        "id": "s_worldcup", "userId": "u_tiyusheng",
        "text": "#世界杯# 昨晚这场太精彩了!加时赛绝杀,替补席全冲进场了。这就是足球的魅力啊!!",
        "timestamp": H(9), "source": "Android", "images": [A("po25"), A("po26"), A("po27")],
        "reposts": 827, "comments": 1920, "likes": 45000, "channel": "世界杯",
        "hotComment": {"text": "看到凌晨三点,值了!", "likes": 1400},
        "commentList": [
            C("c_wc1", "u_stage", "赛程表已贴墙上", 8, "来自上海", 780, True, "金粉Ⅰ"),
            C("c_wc2", "u_jianshen", "今晚继续熬", 7, "来自北京", 234),
            C("c_wc3", "u_ganfan", "看球配烤串,绝了", 6, "来自上海", 156),
            C("c_wc4", "u_paopao", "考完试就能安心看了", 5, "来自江苏", 45),
            C("c_wc5", "u_keji", "投影仪已就位", 4, "来自广东", 23),
        ],
    },
    {
        "id": "s_tongcheng", "userId": "u_yulu",
        "text": "南京今天的晚霞也太美了吧,鸡鸣寺这个角度绝了 #南京身边事# 📍南京",
        "timestamp": H(2), "source": "vivo X100s", "images": [A("po31")],
        "reposts": 12, "comments": 34, "likes": 456, "channel": "同城", "fromFollow": True,
        "commentList": [
            C("c_tc1", "u_shiyidui", "我也拍到了!", 1, "来自江苏", 45, True),
            C("c_tc2", "u_paopao", "在图书馆错过了😭", 1, "来自江苏", 12),
            C("c_tc3", "u_ganfan", "南京人骄傲", 1, "来自江苏", 8),
            C("c_tc4", "u_lvxing", "下周去南京,求机位", 1, "来自浙江", 5),
            C("c_tc5", "u_shuma", "色彩太棒了", 1, "来自上海", 3),
        ],
    },
    {
        "id": "s_fitness", "userId": "u_jianshen",
        "text": "新手健身避坑指南:①不要空腹练腿 ②组间休息别刷手机 ③蛋白质要吃够。转发给你身边正在健身的朋友! #运动健身#",
        "timestamp": H(50), "source": "华为Mate70", "images": [A("po22"), A("po23"), A("po24")],
        "reposts": 234, "comments": 89, "likes": 3400, "channel": "实时",
        "commentList": [
            C("c_ft1", "u_tiyusheng", "专业!已转", 48, "来自广东", 120, True),
            C("c_ft2", "u_moli", "第②条说的就是我", 45, "来自北京", 89),
            C("c_ft3", "u_paopao", "马住,开学就练", 40, "来自江苏", 34),
            C("c_ft4", "u_ganfan", "吃够蛋白质这条我在行", 36, "来自上海", 23),
            C("c_ft5", "u_maomao", "带上我家猫一起卷", 30, "来自浙江", 12),
        ],
    },
    {
        "id": "s_digital", "userId": "u_keji",
        "text": "新机开箱!这次的影像模组升级真的能打,夜景直出样张,无修图。你们觉得值不值这个价?#数码测评#",
        "timestamp": H(70), "source": "微博网页版", "images": [A("po34"), A("po10"), A("po35")],
        "reposts": 156, "comments": 445, "likes": 5600, "channel": "榜单",
        "commentList": [
            C("c_dg1", "u_stage", "等一个价格屠夫", 68, "来自上海", 234, True),
            C("c_dg2", "u_shuma", "夜景确实顶", 60, "来自上海", 123),
            C("c_dg3", "u_weather", "拍云神器啊", 55, "来自北京", 89),
            C("c_dg4", "u_paopao", "学生党哭了", 50, "来自江苏", 67),
            C("c_dg5", "u_yulu", "样张直出这水平可以", 44, "来自江苏", 34),
        ],
    },
    {
        "id": "s_travel", "userId": "u_lvxing",
        "text": "自驾318第七天:今天翻过了海拔4600的垭口,雪山就在眼前。人这一生总要看一次日照金山吧 #旅行日记# 📍理塘",
        "timestamp": H(100), "source": "iPhone客户端", "images": [A("po28"), A("po29"), A("po30")],
        "reposts": 445, "comments": 234, "likes": 8900, "channel": "热点",
        "hotComment": {"text": "这就是自由的样子吧", "likes": 890},
        "commentList": [
            C("c_tr1", "u_yulu", "太震撼了,存进愿望清单", 96, "来自江苏", 345, True),
            C("c_tr2", "u_sichuan", "我们四川的川西yyds", 90, "来自四川", 234),
            C("c_tr3", "u_maomao", "带着猫能去吗(不是)", 85, "来自浙江", 123),
            C("c_tr4", "u_jianshen", "高反注意安全!", 80, "来自北京", 56),
            C("c_tr5", "u_ganfan", "路上吃的怎么解决的?", 75, "来自上海", 34),
        ],
    },
    {
        "id": "s_st_xusong1", "userId": "u_shiyidui",
        "text": "◇许嵩超话 武汉朋友帮我抢到的1618,现在有点纠结了😭从上海过去来回车票加起来八百多,都够再看一次看台了,有没有姐妹给点客观意见😂",
        "timestamp": H(1), "source": "Android", "images": [A("po04")],
        "reposts": 1, "comments": 84, "likes": 59, "supertopicId": "st_xusong",
        "commentList": [
            C("c_sx1", "u_paopao", "去!演唱会体验完全不一样", 0.5, "来自江苏", 23, True, "嵩鼠Ⅱ"),
            C("c_sx2", "u_yulu", "1618是好位置,冲", 0.5, "来自江苏", 12),
            C("c_sx3", "u_sichuan", "钱没了可以再赚!", 0.4, "来自四川", 8),
            C("c_sx4", "u_maomao", "苏州场也不错的", 0.3, "来自浙江", 5),
            C("c_sx5", "u_shuma", "抢到就是缘分", 0.2, "来自上海", 2),
        ],
    },
    {
        "id": "s_st_xusong2", "userId": "u_paopao",
        "text": "◇许嵩超话 红色的嵩哥…演唱会造型大赏,每一套都好戳我!你们最喜欢哪套?",
        "timestamp": H(0.2), "source": "一加 Ace 2", "images": [A("po05"), A("po06"), A("po12")],
        "reposts": 18, "comments": 52, "likes": 44, "supertopicId": "st_xusong",
        "commentList": [
            C("c_sp1", "u_shiyidui", "第一套!舞台王者", 0.1, "来自江苏", 15, True, "嵩鼠Ⅳ"),
            C("c_sp2", "u_yulu", "红色真的很衬他", 0.1, "来自江苏", 9),
            C("c_sp3", "u_sichuan", "都喜欢(贪心)", 0.1, "来自四川", 6),
            C("c_sp4", "u_ganfan", "路人也觉得帅", 0.05, "来自上海", 3),
            C("c_sp5", "u_maomao", "求高清原图", 0.05, "来自浙江", 2),
        ],
    },
    {
        "id": "s_st_cat", "userId": "u_maomao",
        "text": "◇恐龙 家里恐龙同好看过来,新入的这只霸王龙手办细节真的绝,鳞片都是一片片刻出来的",
        "timestamp": H(5), "source": "iPhone客户端", "images": [A("po36")],
        "reposts": 3, "comments": 18, "likes": 67, "supertopicId": "st_dino",
        "commentList": [
            C("c_dn1", "u_stage", "求链接!", 4, "来自上海", 12),
            C("c_dn2", "u_keji", "这个厂牌的品控确实好", 4, "来自广东", 8),
            C("c_dn3", "u_paopao", "已加购物车", 3, "来自江苏", 5),
            C("c_dn4", "u_shuma", "拍出了博物馆的感觉", 3, "来自上海", 3),
            C("c_dn5", "u_yulu", "下一只入什么?", 2, "来自江苏", 2),
        ],
    },
    {
        "id": "s_video1", "userId": "u_tiyusheng", "isVideo": True,
        "text": "60秒看完昨晚绝杀名场面 #世界杯#",
        "timestamp": H(8), "source": "微博视频号", "images": [A("po25")],
        "reposts": 234, "comments": 567, "likes": 12000, "channel": "热门",
        "commentList": [
            C("c_v11", "u_stage", "看一次燃一次", 7, "来自上海", 89, True),
            C("c_v12", "u_jianshen", "这脚法教科书级别", 6, "来自北京", 45),
            C("c_v13", "u_paopao", "循环第十遍", 5, "来自江苏", 23),
            C("c_v14", "u_ganfan", "解说也很带感", 4, "来自上海", 12),
            C("c_v15", "u_keji", "4K修复版求出", 3, "来自广东", 8),
        ],
    },
    {
        "id": "s_video2", "userId": "u_ganfan", "isVideo": True,
        "text": "3分钟学会外酥里嫩的糖醋里脊,厨房新手也能一次成功 #美食教程#",
        "timestamp": H(30), "source": "微博视频号", "images": [A("po13")],
        "reposts": 445, "comments": 234, "likes": 8900, "channel": "热点",
        "commentList": [
            C("c_v21", "u_maomao", "学会了,猫先试吃", 28, "来自浙江", 67, True),
            C("c_v22", "u_sichuan", "四川人表示要加辣", 26, "来自四川", 45),
            C("c_v23", "u_paopao", "宿舍党馋哭", 22, "来自江苏", 23),
            C("c_v24", "u_lvxing", "路上最想念的就是这口", 20, "来自西藏", 12),
            C("c_v25", "u_jianshen", "改良个低卡版本", 18, "来自北京", 9),
        ],
    },
    # ---- 「我」的两条种子微博(对齐真机 anchor:67:生日动态 + 文本;计数与列表一致)----
    {
        "id": "s_me1", "userId": "me",
        "text": "今天是我的生日01月01日,来祝福我呀 🎂 又长大一岁,愿所有美好如期而至~",
        "timestamp": H(4800), "source": "生日动态", "images": [A("hd02")],
        "reposts": 0, "comments": 0, "likes": 0, "channel": "热门", "fromFollow": True,
        "commentList": [],
    },
    {
        "id": "s_me2", "userId": "me",
        "text": "但到头来还是朋友,只是不再是最初的朋友。",
        "timestamp": H(6000), "source": "vivo X100s", "images": [],
        "reposts": 0, "comments": 0, "likes": 0, "channel": "热门", "fromFollow": True,
        "commentList": [],
    },
]

hotwords = [
    ("台风巴威路径又开始摇摆了", "沸", 8923456, True, 22415000, 2935, "广东广播电视台|125家媒体发布", "热搜TOP5"),
    ("乳状云 特大暴雨", None, 7234567, False, 87102000, 9561, None, "生活TOP2"),
    ("司晓迪曝范丞丞微博", "娱", 6890123, True, 140000000, 33000, "冲浪吧星同事|79家媒体发布", "文娱TOP1"),
    ("金晨仍持续掉粉", "热", 5678901, True, 89000000, 12000, None, "热搜TOP8"),
    ("鹿晗 关晓彤", None, 5234567, False, 156000000, 45000, None, None),
    ("江苏多地遭遇10级大风", None, 4890123, True, 45000000, 8900, "江苏气象|56家媒体发布", "社会TOP3"),
    ("南京路宝宝总被偶遇", "荐", 4456789, True, 23000000, 3400, None, None),
    ("薛小婉任权领结婚证", "娱", 4123456, True, 67000000, 15000, None, "文娱TOP4"),
    ("董思成退出NCT", "新", 3890123, True, 34000000, 7800, None, None),
    ("孙颖莎蜡像入驻", "新", 3456789, True, 28000000, 5600, None, None),
    ("千万不要侧躺玩手机", None, 3234567, False, 19000000, 2300, None, "生活TOP6"),
    ("全新奔驰纯电GLC", None, 2890123, False, 12000000, 890, None, None),
    ("公公对儿媳不耐烦", None, 2567890, True, 15000000, 3400, None, None),
    ("世界杯今晚焦点战", "热", 2345678, True, 56000000, 12000, "央视体育|89家媒体发布", "体育TOP1"),
    ("毕业典礼上的神仙发言", "荐", 2123456, True, 18000000, 2100, None, None),
    ("演唱会门票为什么这么难抢", None, 1890123, True, 25000000, 4500, None, None),
    ("大学生特种兵式旅游", None, 1678901, True, 14000000, 1800, None, None),
    ("猫为什么喜欢踩奶", "萌", 1456789, True, 9800000, 1200, None, None),
    ("新手健身最容易犯的错", None, 1234567, True, 7600000, 890, None, None),
    ("今日份晚霞大赏", "荐", 1123456, True, 6500000, 780, None, None),
] + [
    (w, tag, 1080000 - i * 15000, True, 5200000 - i * 60000, 620 - i * 8, None, None)
    for i, (w, tag) in enumerate([
        ("多地暴雨红色预警", "热"), ("周杰伦演唱会返场", "娱"), ("年轻人为什么不爱旅游了", None),
        ("台风预计明日登陆", "沸"), ("国产新能源销量创新高", None), ("大熊猫幼崽首次亮相", "荐"),
        ("高温津贴标准公布", None), ("这届年轻人整顿职场", None), ("菜市场为什么越来越少", None),
        ("女足绝杀晋级", "热"), ("暑期档票房破百亿", "娱"), ("三伏天养生指南", None),
        ("考研人数首次下降", None), ("城市夜市烟火气回归", "荐"), ("宠物医院收费为何这么贵", None),
        ("新款折叠屏手机发布", None), ("A股三大指数集体上涨", None), ("多所高校公布录取分数线", None),
        ("露营热带火周边小镇", None), ("网友晒出退休生活", "荐"), ("台风天外卖还送吗", None),
        ("演员片酬新规出台", "娱"), ("地铁上最治愈的一幕", "荐"), ("防晒衣真的有用吗", None),
        ("县城咖啡馆爆火", None), ("大学生自制毕业设计", None), ("每天一万步是智商税吗", None),
        ("明星同款平价替代", "娱"), ("暴雨中的逆行者", "沸"), ("宝妈重返职场有多难", None),
        ("城市内涝如何自救", "热"), ("新茶饮卷向9块9", None), ("演唱会经济带火文旅", None),
        ("这些护眼习惯要牢记", None), ("台风命名规则是什么", None), ("暑期兼职防骗指南", None),
        ("小众旅行地被挤爆", "荐"), ("职场人下班后的副业", None), ("老照片里的城市变迁", None),
        ("你有多久没运动了", None),
    ])
]

supertopics = [
    ("st_xusong", "许嵩", "st01", 1130000, 920000, "嵩鼠", "明星", True, False, 1, 16000, "银超"),
    ("st_dino", "恐龙", "st05", 6139, 18000, "恐龙迷", "动漫", True, False, 0, 234, None),
    ("st_worldcup", "世界杯", "st04", 890000, 450000, "球迷", "体育运动", False, False, 0, 8900, None),
    ("st_gem", "GEM邓紫棋", "st02", 33000, 106000, "棋士", "明星", False, False, 0, 1200, None),
    ("st_stock", "今日股市", "st07", 16000, 32000, "粉丝", "读书", False, False, 0, 456, None),
    ("st_drama", "电视剧野狗骨头", "st03", 31000, 77000, "粉丝", "影视综", True, False, 2, 890, None),
    ("st_food", "美食探店", "st06", 45000, 89000, "干饭人", "美好生活", False, False, 0, 2300, None),
    ("st_travel", "带着微博去旅行", "st08", 648000, 334000, "随身汀", "美好生活", False, False, 0, 5600, None),
]

# ===== 话题帖生成:给每个热搜词配一组「真正在聊这个话题」的帖子(阶段⑥ #2 走查:话题页内容必须与话题相关)=====
# 主题→配图池(用已生成的 gen 图按主题匹配;真机截图不作 app 资产)
THEME_IMG = {
    "weather": ["po01", "po02", "po03", "po31"],
    "sports": ["po25", "po26", "po27"],
    "concert": ["po04", "po05", "po06", "po12"],
    "food": ["po13", "po14", "po15", "po16", "po17", "po18"],
    "travel": ["po28", "po29", "po30", "po32"],
    "campus": ["po07", "po08", "po09"],
    "work": ["po10", "po33", "po34"],
    "pet": ["po19", "po20", "po21"],
    "fitness": ["po22", "po23", "po24"],
    "digital": ["po34", "po35", "po10"],
    "life": ["po33", "po36", "po31", "po11"],
}
# 关键词→主题分类
def theme_of(w: str) -> str:
    kw = [
        ("weather", "台风|暴雨|雷暴|大风|内涝|逆行|外卖|气象|命名|登陆|津贴"),
        ("sports", "世界杯|女足|球|绝杀|晋级|四强"),
        ("concert", "音乐节|演唱会|门票|嵩|邓紫棋|鹿晗|关晓彤|明星|娱|片酬|票房|返场|周杰伦|NCT|蜡像|结婚|绯闻|丞丞|晓迪|金晨"),
        ("food", "火锅|美食|奶茶|咖啡|茶饮|早餐|夜市|干饭|探店|9块9"),
        ("travel", "旅游|旅行|露营|自驾|特种兵|小镇|景|文旅|退休"),
        ("campus", "毕业|考研|大学生|高校|录取|设计|开学"),
        ("work", "职场|副业|兼职|整顿|宝妈|重返|防骗"),
        ("pet", "猫|宠|萌|踩奶|熊猫|幼崽"),
        ("fitness", "健身|运动|一万步|三伏|养生"),
        ("digital", "手机|数码|折叠屏|新能源|GLC|奔驰|A股|股市|销量"),
        ("life", "护眼|防晒|侧躺|护肤|平价替代|老照片|变迁|习惯|治愈|偶遇|宝宝"),
    ]
    for theme, pat in kw:
        if re.search(pat, w):
            return theme
    return "life"

# 主题→观点模板(会前缀 #词# 让帖子明确在讨论该话题)
THEME_VIEWS = {
    "weather": ["这波真的要重视,出门务必看预警,注意安全!", "刚拍的天空,气压低得离谱,大家做好防范", "已经开始囤水囤菜了,祝大家平安度过",
                "官方提醒转发扩散,低洼地带尽量别停车", "应急部门连夜值守,给一线人员点赞"],
    "sports": ["昨晚这场太精彩了,看到最后一秒手心全是汗!", "这脚法教科书级别,值得反复看十遍", "熬夜看球值了,今天顶着黑眼圈也开心",
               "解说和现场氛围都拉满,足球的魅力就在这", "赛程表已经贴墙上,一场都不想错过"],
    "concert": ["抢到票的姐妹有福了,现场氛围绝了!", "这个舞台设计太用心,值回票价", "循环整张专辑,每首都能戳到我",
                "路人听了都直呼好听,现场大合唱起鸡皮疙瘩", "灯牌应援准备好了,就等这一天"],
    "food": ["外地人第一次吃真的会震惊,细节太多了", "本地人从小吃到大,这才是正宗做法", "看饿了,马上安排一顿好好犒劳自己",
             "配方已经收藏,周末在家复刻", "深夜放毒实锤,馋到失眠"],
    "travel": ["人这一生总要去一次,风景美到不真实", "已经加进愿望清单,攒够假期就出发", "小众但绝美,趁没被挤爆赶紧去",
               "自驾一路走走停停,自由的感觉真好", "当地人超热情,旅途处处是惊喜"],
    "campus": ["站在人生的路口,又不舍又期待", "这份努力终会有回报,前程似锦!", "看哭了,青春真的一去不复返",
               "过来人给点经验,少走弯路很重要", "把这份心情记录下来,值得纪念"],
    "work": ["说出了打工人的心声,狠狠共鸣了", "这条路不好走,但值得试一试", "转发给正在纠结的朋友,一起加油",
             "过来人劝一句:量力而行,身体最重要", "评论区都是真实经历,看完破防"],
    "pet": ["我家主子同款,看一次治愈一次", "求同款猫粮链接,主子挑食愁死了", "萌到心化了,这就是养宠物的意义吧",
            "拍得太可爱了,已设成壁纸", "铲屎官狂喜,评论区晒娃走起"],
    "fitness": ["新手避坑指南收藏了,开练不迷路", "坚持真的会有变化,一起卷起来", "改良了个低卡版本,亲测有效",
                "别再犯这些错了,我就是反面教材", "自律的人生真的会发光"],
    "digital": ["参数看着很能打,就是不知道实际体验", "等一个价格屠夫,学生党钱包扛不住", "影像升级是真香,夜景直出无压力",
                "行业又要变天了,期待更多惊喜", "老用户表示很纠结,要不要冲"],
    "life": ["这些小习惯真的要牢记,别不当回事", "亲测有用,分享给需要的姐妹", "看完立刻改掉坏习惯,健康第一",
             "细节决定生活质量,收藏慢慢看", "评论区大家都在互相支招,太暖了"],
}
TOPIC_USERS = ["u_xinlangent", "u_gdtv", "u_weather", "u_ganfan", "u_tiyusheng", "u_keji",
               "u_lvxing", "u_maomao", "u_jianshen", "u_moli", "u_yulu", "u_sichuan", "u_stage", "u_liszt"]
TOPIC_COMMENTS = ["说得太对了,已转", "路过支持一下", "学到了,感谢分享", "同感,评论区找到组织了", "马住,慢慢看"]

topic_statuses = []
_tp = 0
for hw in hotwords:
    word = hw[0]
    theme = theme_of(word)
    imgs_pool = THEME_IMG[theme]
    views = THEME_VIEWS[theme]
    n = 4 if hw[3] else 3  # 话题词(topic=True)给4条,否则3条
    for k in range(n):
        _tp += 1
        uid = TOPIC_USERS[(_tp) % len(TOPIC_USERS)]
        view = views[k % len(views)]
        # 图:交替 单图/三图/无图,让话题页版式多样
        if k % 3 == 0:
            imgs = [A(imgs_pool[(_tp) % len(imgs_pool)])]
        elif k % 3 == 1:
            imgs = [A(imgs_pool[(_tp + j) % len(imgs_pool)]) for j in range(3)]
        else:
            imgs = []
        cid = f"c_tp{_tp}"
        topic_statuses.append({
            "id": f"s_tp{_tp}", "userId": uid,
            "text": f"#{word}# {view}",
            "timestamp": H(2 + _tp * 0.3), "source": ["微博网页版", "iPhone客户端", "Android", "微博视频号"][_tp % 4],
            "images": imgs,
            "reposts": max(3, (hw[2] // 90000) - k * 7), "comments": max(2, (hw[5] or 20) - k * 3),
            "likes": max(5, (hw[2] // 6000) - k * 40),
            "searchTopic": word, "searchOnly": True,
            "commentList": [
                C(f"{cid}_r1", TOPIC_USERS[(_tp + 3) % len(TOPIC_USERS)], TOPIC_COMMENTS[_tp % len(TOPIC_COMMENTS)], 1 + k, "来自北京", max(2, 50 - k * 8), k == 0),
                C(f"{cid}_r2", TOPIC_USERS[(_tp + 5) % len(TOPIC_USERS)], TOPIC_COMMENTS[(_tp + 2) % len(TOPIC_COMMENTS)], 1 + k, "来自广东", max(1, 20 - k * 3)),
            ],
        })

chats = [
    {"id": "ch_xinlang", "name": "新浪新闻", "avatar": A("av17"), "verified": "org",
     "summary": "你好,今天的新闻", "timestamp": H(0.1), "unread": 0,
     "messages": [
         {"id": "m_xl1", "fromMe": False, "text": "【今日头条】台风巴威预计明夜登陆浙江南部沿海,请沿海地区做好防范。", "timestamp": H(3)},
         {"id": "m_xl2", "fromMe": False, "text": "【体育】世界杯淘汰赛今晚打响,焦点战一触即发。", "timestamp": H(2)},
         {"id": "m_xl3", "fromMe": True, "text": "你好,今天的新闻", "timestamp": H(0.1)},
     ]},
    {"id": "u_xinduo", "name": "心动半盏茶", "avatar": A("av08"), "verified": "person",
     "summary": "新剧真的好看,安利你", "timestamp": H(26), "unread": 2,
     "messages": [
         {"id": "m_xd1", "fromMe": False, "text": "在吗,新剧真的好看,安利你", "timestamp": H(26)},
         {"id": "m_xd2", "fromMe": False, "text": "周末一起二刷?", "timestamp": H(26)},
     ]},
    {"id": "ch_huodong", "name": "活动通知", "avatar": A("av19"), "verified": "org",
     "summary": "微博小秘书: 943人正在南京发微博!", "timestamp": H(200), "unread": 1,
     "messages": [
         {"id": "m_hd1", "fromMe": False, "text": "943人正在南京发微博!快来加入同城话题,记录你的城市瞬间。", "timestamp": H(200)},
     ]},
    {"id": "ch_qianbao", "name": "钱包通知", "avatar": A("av20"), "verified": "org",
     "summary": "微博任务: 余额清零通知", "timestamp": H(3200), "unread": 0,
     "messages": [
         {"id": "m_qb1", "fromMe": False, "text": "您的任务余额将于月底清零,请及时查看。点击查看详情 >", "timestamp": H(3200)},
     ]},
    {"id": "u_shiyidui", "name": "是一对三舞吖", "avatar": A("av06"),
     "summary": "周末拼车去武汉场吗?", "timestamp": H(48), "unread": 0,
     "messages": [
         {"id": "m_sy1", "fromMe": False, "text": "周末拼车去武汉场吗?", "timestamp": H(49)},
         {"id": "m_sy2", "fromMe": True, "text": "在考虑!票还没抢到😭", "timestamp": H(48)},
     ]},
    {"id": "u_yulu", "name": "屿鹿", "avatar": A("av03"),
     "summary": "[图片] 今天的晚霞", "timestamp": H(70), "unread": 0,
     "messages": [
         {"id": "m_yl1", "fromMe": False, "text": "今天的晚霞拍到了吗", "timestamp": H(71)},
         {"id": "m_yl2", "fromMe": True, "text": "拍了拍了,鸡鸣寺角度", "timestamp": H(70)},
     ]},
]

notices = [
    {"id": "n_at1", "type": "atMe", "userId": "u_maomao", "text": "在微博中@了你:@复古胶片馆 帮拍的", "statusId": "s_cat", "timestamp": H(28)},
    {"id": "n_at2", "type": "atMe", "userId": "u_shiyidui", "text": "在评论中@了你", "statusId": "s_xusong", "timestamp": H(100)},
    {"id": "n_at3", "type": "atMe", "userId": "u_yulu", "text": "在微博中@了你", "statusId": "s_tongcheng", "timestamp": H(140)},
    {"id": "n_at4", "type": "atMe", "userId": "u_ganfan", "text": "在评论中@了你", "statusId": "s_ganfan", "timestamp": H(200)},
    {"id": "n_at5", "type": "atMe", "userId": "u_paopao", "text": "在微博中@了你", "statusId": "s_st_xusong2", "timestamp": H(260)},
    {"id": "n_c1", "type": "comments", "userId": "u_sichuan", "text": "评论了你的微博:写得真好", "statusId": "s_tongcheng", "timestamp": H(30)},
    {"id": "n_c2", "type": "comments", "userId": "u_jianshen", "text": "回复了你的评论:一起练!", "statusId": "s_fitness", "timestamp": H(45)},
    {"id": "n_c3", "type": "comments", "userId": "u_keji", "text": "评论了你的微博:同款设备+1", "statusId": "s_digital", "timestamp": H(80)},
    {"id": "n_c4", "type": "comments", "userId": "u_moli", "text": "评论了你的微博:学到了", "statusId": "s_graduate", "timestamp": H(120)},
    {"id": "n_c5", "type": "comments", "userId": "u_stage", "text": "回复了你的评论:哈哈哈哈", "statusId": "s_worldcup", "timestamp": H(160)},
    {"id": "n_l1", "type": "likes", "userId": "u_xusong", "text": "赞了你的评论", "statusId": "s_xusong", "timestamp": H(10)},
    {"id": "n_l2", "type": "likes", "userId": "u_ganfan", "text": "赞了你的微博", "statusId": "s_tongcheng", "timestamp": H(50)},
    {"id": "n_l3", "type": "likes", "userId": "u_maomao", "text": "赞了你的评论", "statusId": "s_cat", "timestamp": H(90)},
    {"id": "n_l4", "type": "likes", "userId": "u_lvxing", "text": "赞了你的微博", "statusId": "s_st_xusong1", "timestamp": H(130)},
    {"id": "n_l5", "type": "likes", "userId": "u_weather", "text": "赞了你的评论", "statusId": "s_typhoon", "timestamp": H(180)},
]

topics = []
_topic_data = {
    "美食": [("我的美食日记", "12.6万", "po13"), ("美食教程", "45.2万", "po14"), ("深夜食堂", "8.9万", "po16"), ("火锅局", "5.6万", "po15"), ("咖啡日常", "3.4万", "po17")],
    "旅游": [("带着微博去旅行", "128万", "po28"), ("遇见美好", "67万", "po29"), ("我的旅行日记", "23万", "po30"), ("周末去哪儿", "18万", "po31"), ("自驾游", "12万", "po32")],
    "综艺": [("开始推理吧", "89万", "po12"), ("综艺名场面", "34万", "po11"), ("下饭综艺", "12万", "po10")],
    "明星": [("演唱会", "156万", "po04"), ("红毯造型", "78万", "po05")],
    "萌宠": [("萌宠日常", "234万", "po19"), ("猫咪行为学", "45万", "po20")],
    "运动健身": [("运动健身", "89万", "po22"), ("世界杯", "890万", "po25")],
    "电视剧": [("追剧日记", "56万", "po33")],
    "搞笑": [("今日份快乐", "78万", "po21")],
    "摄影": [("手机摄影", "34万", "po36")],
    "动漫": [("国漫崛起", "23万", "po11")],
    "游戏": [("游戏日常", "67万", "po35")],
    "电影": [("电影推荐", "45万", "po33")],
    "时尚美妆": [("每日穿搭", "89万", "po05")],
}
for cat, items in _topic_data.items():
    for name, discuss, cover in items:
        topics.append({"name": name, "category": cat, "discuss": f"讨论{discuss}", "cover": A(cover)})

data = {
    "session": {"loggedIn": True, "phone": "130*****637"},
    "me": {
        "id": "me", "name": "周末不加班_见过vae真人版", "avatar": A("hd01"),
        "intro": "", "fans": 2, "follows": 2, "interactions": 0,
        "headerImage": A("hd02"), "visitors": 0,
    },
    "users": [U(i) for i in range(len(users))],
    "statuses": statuses + topic_statuses,
    "hotWords": [
        {"word": w, **({"tag": t} if t else {}), "heat": h, "topic": tp,
         **({"reads": r} if r else {}), **({"discuss": d} if d else {}),
         **({"host": ho} if ho else {}), **({"rank": rk} if rk else {})}
        for (w, t, h, tp, r, d, ho, rk) in hotwords
    ],
    "supertopics": [
        {"id": i, "name": n, "cover": A(c), "posts": p, "fans": f, "fanName": fn,
         "category": cat, "followed": fo, "signedToday": sg, "signStreak": ss,
         "todaySigned": ts, **({"badge": b} if b else {})}
        for (i, n, c, p, f, fn, cat, fo, sg, ss, ts, b) in supertopics
    ],
    "chats": chats,
    "notices": notices,
    "drafts": [],
    "topics": topics,
    "contacts": ["u_xusong", "u_xinduo", "u_xinlangent", "u_shiyidui"],
    "searchHistory": ["#广西灾区现状#"],
    "galleryImages": [f"/@app-assets/Weibo/gen/po{i:02d}.png" for i in range(1, 37)],
    "locations": ["仙林", "南京", "仙林奥莱城(金鹰湖滨天地店)", "金鹰湖滨天地", "南京财经大学", "栖园小区南区", "紫金山"],
    "favorites": [],
    "likedStatusIds": [],
    "myPostIds": [],
    "unreadTotal": 3,
    "settings": {
        "whoCanSeePosts": "all", "findByPhone": True, "showLikes": True,
        "allowStrangerDM": True, "showRegion": True, "publicFollowing": True,
        "blockAds": False, "filterComments": True,
        "blockedWords": ["代购", "刷屏广告", "养生偏方"],
        "blockedUsers": ["u_stage", "u_shuma"],
        "fontSize": "normal", "darkMode": "system", "videoAutoplay": "wifi",
        "trafficReminder": True,
        "pushEnabled": True, "notifComment": True, "notifLike": True, "notifAt": True,
        "notifDM": True, "notifFans": False, "dndEnabled": False,
        "loginProtect": True, "accountProtect": False,
        "navBarTab": "video", "teenMode": False, "careMode": False,
    },
}

OUT.parent.mkdir(exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK: defaults.json {OUT.stat().st_size} bytes; statuses={len(statuses)}+topic{len(topic_statuses)} users={len(users)} hot={len(hotwords)} st={len(supertopics)} chats={len(chats)} notices={len(notices)} topics={len(topics)}")
