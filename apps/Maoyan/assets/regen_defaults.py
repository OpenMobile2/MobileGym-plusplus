# -*- coding: utf-8 -*-
"""
猫眼 defaults.json 种子生成(Playbook §5.2/§5.7:永远用脚本生成,多样性是硬指标)。
图片:有 assets/gen/<id>.png 用 PNG,缺失回落内联 SVG 占位。
运行:python apps/Maoyan/assets/regen_defaults.py
"""
import json
from pathlib import Path
from urllib.parse import quote

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "data" / "defaults.json"
GEN = HERE / "gen"

BASE_TS = 1783958400000  # 2026-07-13 08:00 UTC+8 附近的固定基准
DAY = 86400000


def img(asset_id: str, label: str, color: str = "#DDD") -> str:
    """有生成 PNG 用 PNG,否则内联 SVG 占位(色块+首字)。"""
    if (GEN / f"{asset_id}.png").exists():
        return f"/@app-assets/Maoyan/gen/{asset_id}.png"
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 128'>"
           f"<rect width='96' height='128' fill='{color}'/>"
           f"<text x='48' y='70' font-size='28' text-anchor='middle' fill='#fff'>{label[:2]}</text></svg>")
    return "data:image/svg+xml;utf8," + quote(svg)


CAST_POOL = [
    ("阚卫平", "导演", "cast_1"), ("吕小雨", "饰: 姜小米", "cast_2"), ("谢承泽", "饰: 舒言", "cast_3"),
    ("张小斐", "饰: 铁娘子", "cast_4"), ("迪丽热巴", "饰: 前锋", "cast_6"), ("王凯", "饰: 曹操", "cast_5"),
    ("魏超", "饰: 关羽", "cast_7"), ("李绍哲", "导演", "cast_8"), ("汤姆·汉克斯", "配音: 警长", "cast_5"),
    ("杨紫琼", "饰: 魔方小姐", "cast_4"), ("李思潼", "饰: 阿嬷", "cast_4"), ("郑恺", "饰: 失踪者", "cast_3"),
]


def cast(*idx):
    return [{"name": n, "role": r, "avatar": img(a, n)} for n, r, a in (CAST_POOL[i] for i in idx)]


MOVIES = [
    # id, title, en, poster, theme, status, score, prev, wish, genres, dur, date, formats, presale, cn, sn
    ("m_kungfu", "功夫女足", "Kung Fu Soccer", "poster_kungfu_soccer", "#5A1E12", "hot", 9.4, 0, 479021,
     ["喜剧", "运动"], 106, "2026-07-11", ["IMAX 2D", "CINITY 2D"], False, 38, 708,
     "神仙功夫接住足球,还是熟悉的喜剧配方,笑里藏刀的女足故事。少林师姐妹重组县城女足队,一路踢进全国决赛。"),
    ("m_backroom", "后室", "The Backrooms", "poster_backroom", "#4A4426", "hot", 0, 0, 126000,
     ["惊悚", "悬疑"], 98, "2026-06-26", ["IMAX 2D", "CINITY 2D"], False, 27, 71,
     "一模一样泛黄墙纸的无尽走廊,永远嗡嗡作响的荧光灯。误入夹层空间的四人,寻找出口的规则逐渐失控。"),
    ("m_minion", "小黄人与大怪兽", "Minions & Monsters", "poster_minion_monster", "#3A2450", "hot", 0, 0, 219000,
     ["动画", "喜剧", "科幻"], 90, "2026-07-03", ["IMAX 2D", "CINITY 2D"], False, 37, 148,
     "小黄人们意外唤醒了沉睡千年的大怪兽,一场横跨城市的爆笑追逐就此展开。"),
    ("m_sanguo", "三国第一部:争洛阳", "Three Kingdoms: The Beginning", "poster_sanguo", "#4A1410", "hot", 9.5, 9.5, 43493,
     ["动画", "历史"], 137, "2026-07-10", ["IMAX 2D", "CINITY 2D"], False, 35, 108,
     "追光动画「三国三部曲」!三部曲讲述东汉末年群雄逐鹿,烽于赤壁一战,天下三分。从盛唐诗篇到汉末风云。"),
    ("m_sidu", "四渡", "Four Crossings", "poster_sidu", "#3A1A14", "hot", 0, 0, 88000,
     ["战争", "历史"], 122, "2026-07-05", ["IMAX 2D", "CINITY 2D"], False, 26, 47,
     "以四渡赤水为背景,讲述一支侦察小队在绝境中掩护主力转移的故事。"),
    ("m_toystory", "玩具总动员5", "Toy Story 5", "poster_toystory", "#1E3A50", "hot", 9.6, 0, 152000,
     ["动画", "冒险"], 104, "2026-06-20", ["IMAX 2D", "CINITY 2D"], False, 18, 28,
     "玩具们迎来了最强对手——一块会说话的平板电脑。胡迪和巴斯光年必须重新定义什么是玩具。"),
    ("m_cube", "魔方小姐", "Miss Cube", "poster_cube_lady", "#3A2044", "hot", 9.6, 0, 96000,
     ["奇幻", "剧情"], 111, "2026-07-04", ["CINITY 2D"], False, 1, 1,
     "转动魔方就能回到十分钟前,直到她转出了一个不属于自己的世界。"),
    ("m_maverick", "特立独行", "Maverick", "poster_maverick", "#2E2A20", "hot", 0, 0, 134000,
     ["喜剧"], 121, "2026-07-08", ["IMAX 2D", "CINITY 2D"], False, 33, 88,
     "真实敢拍,笑里藏刀。一位过气导演决定拍一部没有投资人敢投的电影。"),
    ("m_grandma", "给阿嬷的情书", "Dear You", "poster_grandma_letter", "#2A3A28", "hot", 9.7, 0, 181510,
     ["剧情", "家庭"], 97, "2026-04-30", ["IMAX 2D", "CINITY 2D"], False, 20, 39,
     "潮汕阿嬷叶淑美一直守着平淡的日子,安享晚年。孙子晓伟因债务缠身,瞒着家人远赴异国,寻找传闻中的转机。"),
    ("m_vanishing", "消失的人", "Vanishing Point", "poster_vanishing", "#1E2830", "hot", 9.5, 0, 147028,
     ["悬疑", "犯罪"], 118, "2026-05-01", ["CINITY 2D", "中国巨幕 2D"], False, 2, 9,
     "五一看高口碑烧脑悬疑片!郑恺刘浩存邱泽指纹字间的死环疑案,凶手竟近在眼前,人性良知泯灭?"),
    # 待映
    ("m_baxian", "八仙!", "Eight Immortals!", "poster_baxian", "#3A2810", "upcoming", 0, 9.7, 53148,
     ["动画", "神话", "喜剧"], 108, "2026-07-24", ["IMAX 2D", "CINITY 2D"], True, 0, 0,
     "神仙喜剧动画,点映评分9.7,嗨翻暑期。八仙组团来送福,各显神通闹东海。"),
    ("m_spider", "蜘蛛侠:崭新之日", "Spider: A Brand New Day", "poster_spiderman", "#20242E", "upcoming", 0, 0, 568000,
     ["动画", "动作"], 118, "2026-07-29", ["IMAX 2D"], False, 0, 0,
     "好笑!蜘蛛侠变异自产蜘蛛丝,崭新之日面对崭新的敌人。"),
    ("m_missyou", "想你了", "Miss You", "poster_missyou", "#503A28", "upcoming", 0, 0, 126427,
     ["剧情", "友情"], 105, "2026-07-17", ["CINITY 2D"], True, 0, 0,
     "章若楠金靖任彬主演。毕业十年,一场同学会让所有人重新想起那个夏天。"),
    ("m_cruise", "恐怖游轮", "Terror Cruise", "poster_cruise", "#26322E", "upcoming", 0, 0, 22000,
     ["悬疑", "惊悚"], 99, "2026-07-17", ["IMAX 2D"], True, 0, 0,
     "无限循环的邮轮,每一次靠岸都是同一场噩梦的开始。"),
    ("m_linhouse", "林家宅37号", "The Haunting at Lin Family House 37", "poster_linhouse", "#2E1E1A", "upcoming", 0, 0, 3610,
     ["恐怖", "惊悚", "悬疑"], 98, "2026-07-17", ["CINITY 2D"], True, 0, 0,
     "邪祟让人头皮发麻。女主人林思雨温顺本分,丈夫陶多余却是个混不吝的酒鬼,一夜暴雨后,宅子里多了一位客人。"),
    ("m_shangbao", "上堡之恋", "Shangbao Love Story", "poster_shangbao", "#204040", "upcoming", 0, 0, 221,
     ["剧情"], 93, "2026-07-15", ["2D"], False, 0, 0,
     "姜小米和姜小辣是一对淳朴的客家双胞胎姐妹,姐姐姜小米经营一家民宿,为游客们提供便利。妹妹姜小辣在外闯荡。"),
    # gate4轮2:搜索热词对应真实电影(女孩/初步举证),已下映=classic(可搜可看不可购票)
    ("m_girl", "女孩", "Girl", "poster_girl", "#3A2A22", "classic", 8.2, 0, 26800,
     ["剧情"], 108, "2025-11-01", ["2D"], False, 0, 0,
     "舒淇导演首作。一个在重男轻女家庭长大的女孩,如何在压抑与误解中,慢慢寻回自我、与母亲和解的成长故事。"),
    ("m_prima", "初步举证", "National Theatre Live: Prima Facie", "poster_prima", "#2A1418", "classic", 9.1, 0, 45000,
     ["剧情"], 100, "2025-02-28", ["NTLive 2D"], False, 0, 0,
     "英国国家剧院现场·独角戏舞台纪录电影。精英女律师专为性侵案被告辩护,直到自己成为受害者,一夜之间信念崩塌重建。"),
]

REVIEW_ROWS = [
    ("m_backroom", "猫眼用户", "avatar_1", 2, 10, "夯爆了 全程心惊肉跳的 真的建议去看看", 3808, 72, 17 * DAY, "重庆", True),
    ("m_backroom", "小月", "avatar_2", 4, 10, "看完最大的后遗症是看自家储藏室都觉得下一秒要穿墙,太邪乎了,这片聪明在没靠一惊一乍吓人,全凭那种日常空间变异的诡异感折磨你。", 2070, 26, 17 * DAY, "江苏", True),
    ("m_backroom", "百合和雪花", "avatar_4", 4, 10, "“后室”最吸引人的地方,是它的开放性和可延展性:你只知道那里巨大、空旷、危险、会变化,但你并不知道它究竟怎么来的,里面到底藏着什么。", 1494, 22, 17 * DAY, "上海", True),
    ("m_backroom", "babe", "avatar_6", 3, 10, "音乐的氛围真的很棒!导演最后的结尾真的让我越来越好奇后室的世界观到底是怎么样的了。太会拿捏观众了。", 448, 11, 17 * DAY, "重庆", True),
    ("m_grandma", "雨后初霁", "avatar_3", 5, 10, "他们那代人,什么都没有。木生没有钱,没有文化,没有一天好日子,三十几岁死在异国的海里。", 24507, 991, 61 * DAY, "湖南", True),
    ("m_grandma", "军戈", "avatar_8", 5, 10, "我的天,这是潮汕人的电影吗?真的没想到,如此成熟,拍的这么好!情节反转,感情层层递进,解构完整。", 744, 12, 60 * DAY, "陕西", True),
    ("m_vanishing", "愤怒的雏菊", "avatar_5", 4, 9, "怀疑导演是拍恐怖片出身的", 1, 33, 2 * DAY, "广东", True),
    ("m_vanishing", "衔头银雕", "avatar_7", 4, 9, "特别好看,然后刘浩存特别美,剧情periodt", 0, 3, 3 * DAY, "河北", True),
    ("m_vanishing", "serendipity", "avatar_9", 4, 9, "剧情不错,就是有点吓人,只适合成年人。", 0, 3, 3 * DAY, "辽宁", True),
    ("m_vanishing", "神秘的西瓜", "avatar_1", 4, 10, "挺好的,各方面的很均衡的悬疑片,有几处明显唱哏节奏设置障碍我居然也入坑了", 0, 3, 3 * DAY, "甘肃", True),
    ("m_shangbao", "Alexander De Paiva", "avatar_6", 1, 6, "上海堡垒之上堡之恋", 9, 1, 12 * DAY, "安徽", False),
    ("m_shangbao", "海上金童", "avatar_8", 3, 4, "看完小作文,立省一张票钱!祝主创们“人生开门红”,票房不好,导演可以自己直播带货!", 5, 0, 1 * DAY, "上海", False),
]


def reviews():
    out = []
    for i, (mid, user, av, lv, stars, text, likes, replies, ago, region, bought) in enumerate(REVIEW_ROWS):
        out.append({
            "id": f"rv_{i+1:02d}", "movieId": mid, "user": user, "avatar": img(av, user),
            "level": lv, "stars": stars, "text": text, "likes": likes, "replies": replies,
            "timestamp": BASE_TS - ago, "region": region, "bought": bought, "mine": False,
        })
    return out


CINEMAS = [
    ("c_wenyue", "文悦国际影城(空港店)", "渭城区空港新城腾霄一街空港花园里商业步行街", "渭城区", "空港新城", "空港站", "文悦", 4.6, 28.9,
     ["可退票", "可改签", "小吃", "3D眼镜免费"], ["激光厅", "儿童厅"], "限定萌趣主题陈设,购票领限量周边"),
    ("c_maple", "CineMaple红叶影城(咸阳奥特莱斯)", "渭城区周陵街道秦汉大道周陵新兴产业园区", "渭城区", "奥特莱斯", "周陵站", "红叶", 5.6, 33,
     ["可退票", "可改签", "可领2元券", "券包4折起", "小吃", "3D眼镜免费"], ["4K厅"], ""),
    ("c_wenyuan", "文苑国际影城", "渭城区文林路海棠苑海棠商业街4楼", "渭城区", "文林路", "文林路站", "文苑", 10.5, 33,
     ["可退票", "可改签", "可领2元券", "券包4折起", "小吃", "3D眼镜免费"], ["巨幕厅"], ""),
    ("c_warner", "时代华纳影城凤凰城店(原凤凰数字)", "渭城区渭城北门口十字西南角凤凰生活广场", "渭城区", "北门口", "凤凰广场站", "华纳", 11.9, 19.9,
     ["热闹一夏", "可退票", "可改签", "券包4折起", "小吃", "3D眼镜免费"], ["杜比全景声"], ""),
    ("c_datang", "泾阳大唐国际影城", "泾阳县大唐购物中心五楼", "泾阳县", "大唐购物中心", "泾阳站", "大唐", 11.9, 38,
     ["可退票", "可改签", "券包4折起", "小吃", "3D眼镜免费"], ["激光厅"], ""),
    ("c_wanda", "万达影城(丽彩广场店)", "秦都区玉泉东路10号万达广场5楼", "秦都区", "玉泉路", "丽彩广场站", "万达", 12.7, 29.9,
     ["热闹一夏", "可退票", "可改签", "券包4折起", "小吃", "3D眼镜免费"], ["激光厅", "CGS中国巨幕"], "影城相册免费拍摄,为您的观影留下纪念"),
    ("c_hengying", "横影电影城(世茂杜比全景声影院)", "秦都区人民中路(505广场)世茂中心商业一楼", "秦都区", "人民路", "505广场站", "横影", 12.2, 19.9,
     ["可退票", "可改签", "可领2元券", "券包4折起", "小吃", "3D眼镜免费", "杜比全景声厅"], ["杜比全景声"], ""),
    ("c_xingyi", "星轶影城(沣西吾悦广场旗舰店)", "秦都区钓台街道吾悦广场4楼", "秦都区", "吾悦广场", "钓台站", "星轶", 15.7, 39.9,
     ["开卡特惠", "首single张影票立减4元", "可退票", "可改签", "小吃", "3D眼镜免费"], ["激光厅", "IMAX"], "开卡特惠,首单1张影票立减4元"),
]

# 其余城市影院(gate4轮2:各城市真实影院,取自操作者补拍截图 181~189;切城市影院列表随之变)
# 精简元组:(id, name, addr, district, zone, brand, dist, minprice, hallTypes)。services 统一给常见集。
DEF_SVC = ["可退票", "可改签", "小吃", "3D眼镜免费"]


def _c(cid, name, addr, district, zone, brand, dist, minp, halls):
    metro = f"{zone}站"
    return (cid, name, addr, district, zone, metro, brand, dist, minp, DEF_SVC, halls, "")


CITY_CINEMAS = {
    "咸阳": CINEMAS,
    "南京": [
        _c("c_nj_jinying", "中影国际影城(仙林金鹰店)", "栖霞区仙林大道9号金鹰购物中心5楼", "栖霞区", "仙林", "中影", 3.2, 32.9, ["激光厅", "CGS中国巨幕"]),
        _c("c_nj_xiaozhuang", "晓庄国际影城", "栖霞区文苑路9号晓庄国际广场4楼", "栖霞区", "晓庄", "晓庄", 4.1, 26.9, ["杜比全景声"]),
        _c("c_nj_lumi", "卢米埃影城(金鹰仙林世界城店)", "栖霞区仙林大道88号世界城6楼", "栖霞区", "仙林", "卢米埃", 5.5, 38.9, ["激光厅", "IMAX"]),
        _c("c_nj_wanda", "万达影城(建邺万达广场店)", "建邺区江东中路222号万达广场4楼", "建邺区", "江东中路", "万达", 8.3, 29.9, ["激光厅", "杜比全景声"]),
        _c("c_nj_hengda", "恒大嘉凯影城(南京南站店)", "雨花台区玉兰路99号南京南站商业区3楼", "雨花台区", "南京南站", "恒大嘉凯", 11.8, 24.9, ["巨幕厅"]),
    ],
    "广州": [
        _c("c_gz_dy", "中影DY影城(金滙城店)", "从化区江埔街道环市东路688号金汇城4楼", "从化区", "江埔", "中影", 6.3, 34.9, ["杜比全景声"]),
        _c("c_gz_yxx", "影天下国际影城", "从化区从城大道欣荣宏国际商贸城3楼", "从化区", "从城大道", "影天下", 7.1, 38, ["杜比全景声"]),
        _c("c_gz_jinyi", "金逸影城(从化远达汇聚IMAX店)", "从化区从城大道107号远达汇聚广场四楼", "从化区", "远达汇聚", "金逸", 7.3, 38, ["IMAX厅"]),
        _c("c_gz_baina", "百纳影城(挂绿广场店)", "增城区挂绿路2号挂绿广场F5层", "增城区", "挂绿广场", "百纳", 9.7, 24.9, ["3D眼镜收费"]),
        _c("c_gz_fun", "FUN范影城(增城·杜比巨幕)", "增城区增江街增江大道南30号增江商业中心", "增城区", "增江", "FUN范", 10.5, 24.8, ["杜比全景声", "4K厅"]),
    ],
    "北京": [
        _c("c_bj_xingkong", "中影星空影城(榆垡店)", "大兴区康泰街26号院1号楼地下一层B101号", "大兴区", "榆垡", "中影", 8.6, 49.9, ["3D眼镜免费"]),
        _c("c_bj_baoli", "保利万和影城采育店(全激光影厅VIP)", "大兴区采育镇采平路1号院1号楼彩悦缤纷城", "大兴区", "采育", "保利万和", 8.7, 43, ["激光厅"]),
        _c("c_bj_wanmei", "完美世界影城(天宫院凯德MALL店)", "大兴区华佗路2号L6-11", "大兴区", "天宫院", "完美世界", 8.8, 45, ["3D眼镜免费"]),
        _c("c_bj_sfc", "SFC上影影城(北京大兴龙湖天街IMAX店)", "大兴区生物医药基地龙湖天街商场3层", "大兴区", "生物医药基地", "SFC上影", 8.8, 37.9, ["IMAX厅", "60帧厅"]),
        _c("c_bj_zhonghuan", "中影欢乐影城(马驹桥合生店)", "通州区马驹桥镇新南聚彩荟商场1层", "通州区", "马驹桥", "中影", 8.8, 39.9, ["杜比全景声", "儿童厅"]),
    ],
    "上海": [
        _c("c_sh_cgv", "CGV影城(安亭店)", "嘉定区安亭镇墨玉南路1055号嘉亭荟城市广场", "嘉定区", "安亭", "CGV", 226.4, 55, ["3D眼镜免费"]),
        _c("c_sh_zhongying", "中影国际影城(青浦富绅时代CINITY店)", "青浦区盈港路1616弄18号", "青浦区", "盈港路", "中影", 226.9, 39.9, ["杜比全景声", "4K厅"]),
        _c("c_sh_wanda", "万达影城(青浦万达茂IMAX店)", "青浦区淀山湖大道1059弄1-45号A区4楼", "青浦区", "淀山湖大道", "万达", 227.0, 38.5, ["IMAX厅", "RealD厅"]),
        _c("c_sh_chuntian", "春天国际影城(蛙城激光巨幕店)", "青浦区东渡蛙城3楼(上海市淀山湖大道98号)", "青浦区", "淀山湖大道", "春天", 227.0, 35, ["激光厅"]),
        _c("c_sh_xingyinghui", "星映汇国际影城(青浦吾悦广场店)", "青浦区淀山湖大道286弄15号501室-4", "青浦区", "吾悦广场", "星映汇", 227.6, 38.9, ["3D眼镜免费"]),
    ],
    "武汉": [
        _c("c_wh_moer", "新洲摩尔影城", "新洲区邾城街新洲摩尔城5楼", "新洲区", "邾城", "摩尔", 417.8, 33, ["3D眼镜免费"]),
        _c("c_wh_wenjia", "文嘉映国际影城(阳逻潮花里店)", "新洲区阳逻街道阳逻街余泊大道7号", "新洲区", "阳逻", "文嘉映", 444.0, 19.9, ["3D眼镜免费"]),
        _c("c_wh_tianhe", "阳逻天河国际影城", "新洲区阳逻街阳光大道389号阳逻广场3楼", "新洲区", "阳逻", "天河", 445.6, 33, ["3D眼镜免费"]),
        _c("c_wh_mile", "米乐斯巨幕影城", "新洲区阳逻街道平江西路199号华中贸易城", "新洲区", "阳逻", "米乐斯", 446.1, 19.9, ["巨幕厅"]),
        _c("c_wh_xingyue", "星悦国际影城", "洪山区东湖高新技术开发区左岭大道华星城", "洪山区", "东湖高新", "星悦", 448.2, 33, ["3D眼镜收费"]),
    ],
    "天津": [
        _c("c_tj_wanmei", "完美世界影城(幸福广场店)", "滨海新区大港油田幸福路与开发区交口幸福广场", "滨海新区", "大港", "完美世界", 749.1, 39.9, ["3D眼镜免费"]),
        _c("c_tj_jinyi", "金逸影城(大港IMAX店)", "滨海新区世纪大道东305号易品商业广场A座", "滨海新区", "大港", "金逸", 762.9, 33.9, ["IMAX厅", "杜比全景声"]),
        _c("c_tj_xingyu", "星宇国际影城(舜新城市广场店)", "津南区舜新城市广场三楼", "津南区", "舜新", "星宇", 771.8, 38, ["3D眼镜免费"]),
        _c("c_tj_zhongying", "中影华臣影城(滨海IMAX店)", "滨海新区新村街道自贸试验区新华路3678号", "滨海新区", "自贸区", "中影华臣", 776.7, 29.9, ["IMAX厅"]),
        _c("c_tj_wanda", "万达影城(滨海CINITY店)", "滨海新区自贸试验区中心商务区洞庭路4号", "滨海新区", "中心商务区", "万达", 778.7, 31.5, ["4DX厅", "儿童厅"]),
    ],
    "杭州": [
        _c("c_hz_fangzheng", "芳正影城(芳正广场激光巨幕店)", "余杭区芳正广场2幢301芳正影城", "余杭区", "芳正广场", "芳正", 210.3, 35.9, ["激光厅"]),
        _c("c_hz_pingyao", "瓶窑时代电影大世界", "余杭区华兴路199号恒德·瓶窑广场F2层", "余杭区", "瓶窑", "时代", 211.9, 33, ["3D眼镜免费"]),
        _c("c_hz_xingxin", "瓶窑星鑫国际影城(原嘉凯城店)", "余杭区瓶窑镇瓶仓大道2号新耀城市客厅3楼", "余杭区", "瓶窑", "星鑫", 212.8, 33, ["3D眼镜免费"]),
        _c("c_hz_guangying", "光影之间电影院(塘栖店)", "临平区塘栖镇致和堂街54号2-3层", "临平区", "塘栖", "光影之间", 213.3, 33, ["3D眼镜免费"]),
        _c("c_hz_zhongying", "中影国际影城(良渚永旺CINITY店)", "余杭区古墩路1888号T301", "余杭区", "良渚", "中影", 218.3, 44.9, ["CGS中国巨幕厅", "杜比全景声"]),
    ],
    "成都": [
        _c("c_cd_wanda", "万达影城(淮口甘御兰广场店)", "金堂县淮口街道州城大道66号", "金堂县", "淮口", "万达", 1375.5, 33, ["杜比全景声"]),
        _c("c_cd_taipingyang", "太平洋影城(金堂店)", "金堂县学府大道655号希望未来城商业楼", "金堂县", "金堂", "太平洋", 1381.0, 20.8, ["杜比全景声"]),
        _c("c_cd_dadi", "大地开元影城", "简阳市新民街108号王府景熙园B座2楼", "简阳市", "新民街", "大地", 1382.2, 33.9, ["3D眼镜免费"]),
        _c("c_cd_taipingyang2", "太平洋影城CINITY LED(东来印象店)", "简阳市射洪坝街道铁堰社区东来印象商场", "简阳市", "射洪坝", "太平洋", 1382.3, 33.9, ["CINITY厅", "杜比全景声"]),
        _c("c_cd_wanda2", "万达影城(简阳旭海广场IMAX店)", "简阳市射洪坝街道雄州大道南段389号旭海广场", "简阳市", "射洪坝", "万达", 1382.5, 38.4, ["IMAX厅"]),
    ],
    "重庆": [
        _c("c_cq_shiji", "世纪影城(巫溪店)", "巫溪县柏杨北路92号新世纪百货三楼外租", "巫溪县", "柏杨", "世纪", 890.5, 38, ["3D眼镜免费"]),
        _c("c_cq_baoli", "保利万和国际影城(奉节海成金街店)", "奉节县海成金街二区2-08号滨江国际C5座", "奉节县", "海成金街", "保利万和", 906.9, 33.9, ["3D眼镜免费"]),
        _c("c_cq_wanda", "万达影城(重庆奉节万达广场店)", "奉节县夔州街道夔州西路520号4F", "奉节县", "夔州", "万达", 912.4, 38, ["3D眼镜免费"]),
        _c("c_cq_shangying", "上影国际影城(云阳店)", "云阳县迎宾大道588号云阳天地3楼", "云阳县", "迎宾大道", "上影", 978.7, 33.9, ["杜比全景声"]),
        _c("c_cq_huaxia", "华夏影城(云阳店·原万达影城)", "云阳县青龙街道滨江大道333号城中城广场", "云阳县", "青龙", "华夏", 978.8, 38.9, ["杜比全景声"]),
    ],
    "西安": [
        _c("c_xa_lumi", "卢米埃影城(西安大悦城店)", "碑林区长乐西路22号大悦城7楼", "碑林区", "大悦城", "卢米埃", 3.4, 39.9, ["激光厅", "IMAX"]),
        _c("c_xa_zhongying", "中影国际影城(西安赛格店)", "雁塔区小寨西路赛格国际购物中心7楼", "雁塔区", "小寨", "中影", 5.1, 42, ["CGS中国巨幕", "杜比全景声"]),
        _c("c_xa_aomen", "奥斯卡国际影城(钟楼店)", "碑林区东大街钟楼商圈骡马市步行街", "碑林区", "钟楼", "奥斯卡", 6.2, 35, ["激光厅"]),
        _c("c_xa_wanda", "万达影城(西安大兴新区店)", "莲湖区大兴东路万达广场4楼", "莲湖区", "大兴新区", "万达", 8.4, 33.9, ["IMAX厅"]),
    ],
    "深圳": [
        _c("c_sz_bailao", "百老汇影城(深圳COCOPark店)", "福田区福华三路COCOPark购物中心3楼", "福田区", "购物公园", "百老汇", 2.3, 45, ["激光厅", "杜比全景声"]),
        _c("c_sz_jinyi", "金逸影城(深圳壹方城IMAX店)", "宝安区新湖路99号壹方城5楼", "宝安区", "壹方城", "金逸", 6.8, 42.9, ["IMAX厅"]),
        _c("c_sz_bona", "博纳国际影城(深圳卓悦汇店)", "罗湖区人民南路2028号卓悦汇购物中心4楼", "罗湖区", "卓悦汇", "博纳", 9.1, 39.9, ["杜比全景声"]),
        _c("c_sz_zhongying", "中影国际影城(深圳龙华壹城中心店)", "龙华区民治大道展滕大厦壹城中心5楼", "龙华区", "龙华", "中影", 11.5, 36.9, ["4K厅"]),
    ],
}

# (城市, 影院元组) —— 全量影院,cinemas()/sessions() 统一按此生成
ALL_CINEMAS = [(city, c) for city, lst in CITY_CINEMAS.items() for c in lst]


def cinemas():
    out = []
    for city, (cid, name, addr, district, zone, metro, brand, dist, minp, services, halls, promo) in ALL_CINEMAS:
        out.append({
            "id": cid, "city": city, "name": name, "address": addr, "district": district, "zone": zone,
            "metro": metro, "brand": brand, "distanceKm": dist, "minPrice": minp,
            "services": [s for s in services if "single" not in s], "hallTypes": halls,
            "favorite": False, "promo": promo,
        })
    return out


def sessions():
    """确定性排片:热映前6部 × 全部影院(咸阳8+南京5) × 3天 × 3~5场。无随机。"""
    out = []
    hot = [m for m in MOVIES if m[5] == "hot"][:6]
    slots = ["10:15", "11:45", "13:15", "14:30", "15:50", "17:20", "18:45", "19:30", "20:20", "22:55"]
    langs = ["国语", "国语", "英语"]
    dims = ["2D", "3D", "IMAX 2D", "2D", "2D"]
    n = 0
    for ci, (_city, (cid, *_rest)) in enumerate(ALL_CINEMAS):
        base_price = _rest[7]
        for mi, m in enumerate(hot):
            dur = m[10]
            for day in range(3):
                count = 3  # 固定3场/天(53影院×6片×3天,控制种子体积)
                for k in range(count):
                    slot = slots[(ci * 2 + mi + k * 2 + day) % len(slots)]
                    h, mm = int(slot[:2]), int(slot[3:])
                    em, eh = (mm + dur) % 60, h + (mm + dur) // 60
                    price = round(base_price + (k * 3 + mi * 2) % 14, 1)
                    n += 1
                    out.append({
                        "id": f"s_{cid[2:]}_{m[0][2:]}_{day}_{k}",
                        "cinemaId": cid, "movieId": m[0], "dayOffset": day,
                        "start": slot, "end": f"{eh % 24:02d}:{em:02d}",
                        "lang": langs[(ci + k) % 3], "dim": dims[(mi + k) % 5],
                        "hall": f"{(ci + k) % 9 + 1}号{'激光' if k % 3 == 0 else ''}厅",
                        "price": price, "origPrice": round(price + 10.1, 1),
                        "tag": "特惠" if (k + mi) % 4 == 0 else "",
                    })
    return out


SNACKS = [
    ("sn_popcorn", "推荐 | 46oz爆米花/薯条1份+16oz机打饮料2杯", "snack_popcorn_cola", 25.5, 30.0, "销量最高", "snack"),
    ("sn_couple", "双人餐 | 85oz爆米花1桶+22oz可乐1杯/雀巢热饮1杯(2选2)", "snack_couple_set", 53.9, 59.0, "超值", "snack"),
    ("sn_single", "单人餐 | 32oz爆米花1桶+16oz可乐1杯/雀巢热饮1杯(2选1)", "snack_coffee_set", 30.8, 33.0, "", "snack"),
    ("sn_hotdrink", "热饮双杯 | 12oz雀巢热饮2杯", "snack_hotdrink", 19.9, 24.0, "", "snack"),
    ("mc_badge", "小黄人与大怪兽系列徽章盲盒 环球官方授权正版周边", "merch_badge_box", 19.0, 29.0, "快递发货", "merch"),
    ("mc_cup", "造型杯 | 电影联名收藏杯", "merch_cup", 82.0, 89.0, "立省7元", "merch"),
    ("mc_doll", "TUAYA涂丫丫搪胶玩偶", "merch_doll", 69.0, 79.0, "", "merch"),
    ("mc_card", "镭射纪念票卡两张装", "merch_ticket_card", 15.0, 15.0, "", "merch"),
]

SHOWS = [
    ("sh_redhall", "陈靖霎《红霞影剧院》(夏日版)2026巡回演唱会-西安站", "show_redhall", "concert", "陈靖霎",
     "西溪SPACE-寨斯拾陆", "西安", ["西安站", "温州站"], "2026-07-26 周日 20:00", 280, 525, 26.7,
     ["重要演出", "不支持退", "官方直营", "凭证件入场", "电子票"],
     [("t_full", "全价票", 380), ("t_vip", "VIP单人票", 525)], "",
     "2025年起,陈靖霎带着《红霞影剧院》巡回演唱会重新出发。夏日版将经典曲目重新编排,营造仲夏夜的浪漫剧场。"),
    ("sh_believe", "【西安】汪峰《相信未来》巡回演唱会", "show_believe", "concert", "汪峰",
     "西安奥体中心体育场", "西安", ["西安站"], "2026-08-22(SAT) 19:00", 399, 1699, 18.2,
     ["实名制", "官方直营", "凭证件入场"], [("t_a", "看台A", 399), ("t_b", "内场", 899)], "07:53后抢",
     "摇滚老炮全新巡演,唱响相信未来。"),
    ("sh_liang", "梁静茹巡回演唱会 西安站", "show_liang", "concert", "梁静茹",
     "西安国际会展中心", "西安", ["西安站", "南昌站"], "2026-09-05 周六 19:30", 380, 1280, 21.4,
     ["官方直营", "凭证件入场"], [("t_a", "看台", 380), ("t_b", "内场", 980)], "",
     "「Best,茹果我不唱情歌」巡回演唱会,唱尽情歌岁月。"),
    ("sh_talkshow", "8月7日 一支麦全国巡演《爆梗之夜》咸阳站", "show_talkshow", "talkshow", "一支麦",
     "咸阳大剧院小剧场", "咸阳", ["咸阳站"], "2026-08-07 19:30 周五", 88, 220, 5.2,
     ["电子票", "不支持退"], [("t_a", "普通票", 88), ("t_b", "前排票", 168)], "8.8折",
     "全国高分口碑演员专场巡演:哪嗬大奇专场|约会、脱单、相亲局爆笑现场。"),
    ("sh_crosstalk", "郭德纲于谦相声专场 西安站", "show_crosstalk", "crosstalk", "郭德纲于谦",
     "唐香玉演艺中心", "西安", ["西安站"], "2026-08-14 19:30 周五", 380, 1080, 19.8,
     ["凭证件入场", "不支持退"], [("t_a", "普通座", 380), ("t_b", "贵宾座", 680)], "",
     "8月14日-8月16日,唐香玉演艺中心连演三天。"),
    ("sh_dance", "舞蹈诗剧《只此青绿》巡演咸阳站", "show_dance", "drama", "中国东方演艺集团",
     "咸阳市民文化中心大剧院", "咸阳", ["咸阳站"], "2026-08-20 19:30 周四", 70, 880, 7.9,
     ["官方直营"], [("t_a", "C档", 70), ("t_b", "A档", 480)], "4.6折",
     "舞绘《千里江山图》,展卷、问篆、唱丝、寻石、习笔、淬墨。"),
    ("sh_musicfest", "【榆林】2026“清爽榆林”第二届长城音乐季", "show_musicfest", "musicfest", "群星",
     "榆林长城景区露天舞台", "榆林", ["榆林站"], "2026-07-18 13:30 周六", 129, 399, 480.0,
     ["有优惠", "电子票"], [("t_a", "单日票", 129), ("t_b", "双日票", 239)], "",
     "城市文旅促消费活动,雀斑乐队、陈鸿宇、野孩子乐队、苏诗丁。"),
    ("sh_voice", "【咸阳】《天赐的声音》巅峰演唱会咸阳站", "show_voice", "concert", "群星",
     "咸阳奥体中心", "咸阳", ["咸阳站"], "2026-08-07 20:00 周五", 188, 888, 9.6,
     ["有优惠", "官方直营"], [("t_a", "看台", 188), ("t_b", "内场", 588)], "",
     "《天赐的声音》原班人马巅峰合唱,金曲连唱。"),
    # gate4轮2:搜索热词对应真实演出(许嵩/杨笠/周杰伦/初步举证话剧),避免点进空白
    ("sh_xusong", "许嵩2026「安泊猜想」巡回演唱会", "show_xusong", "concert", "许嵩",
     "武汉体育中心", "武汉", ["武汉站", "广州站", "杭州站"], "2026-07-31 周五 19:30", 380, 1280, 445.0,
     ["官方直营", "凭证件入场", "电子票"], [("t_a", "看台", 380), ("t_b", "内场", 980)], "",
     "许嵩「安泊猜想」全新巡演,3城市巡演中。代表作《断桥残雪》《有何不可》《山水之间》现场重现。"),
    ("sh_yangli", "厦门 杨笠专场里的演员｜卓然脱口秀专场《就好了》单口喜剧·大咖秀", "show_yangli", "talkshow", "杨笠",
     "帽子新空间剧场", "厦门", ["厦门站"], "2026-08-23 周日 19:30", 68, 204, 668.0,
     ["电子票", "不支持退"], [("t_a", "普通票", 68), ("t_b", "套票98×2", 168)], "8.5折",
     "帽子喜剧·古地脱口秀大咖秀,杨笠等高分口碑演员联合专场。"),
    ("sh_zhou", "周杰伦嘉年华世界巡回演唱会", "show_zhou", "concert", "周杰伦",
     "上海体育场", "上海", ["上海站", "北京站"], "2026-09-12 周六 19:30", 555, 2280, 226.0,
     ["重要演出", "官方直营", "实名制", "凭证件入场"], [("t_a", "看台", 555), ("t_b", "内场", 1580)], "火热开抢",
     "周杰伦嘉年华世界巡演,金曲连唱。代表作《七里香》《晴天》《稻香》。"),
    ("sh_chubu", "陈昊宇主演话剧《初步举证》2026巡演", "show_chubu", "drama", "陈昊宇",
     "天津大剧院", "天津", ["天津站", "成都站", "深圳站", "南京站"], "2026-09-04 - 2026-09-06", 180, 680, 778.0,
     ["话剧音乐剧热销榜NO.1", "官方直营", "凭证件入场"], [("t_a", "普通票", 180), ("t_b", "VIP票", 480)], "",
     "陈昊宇主演独角话剧《初步举证》,7个城市巡演中。舞台上的强烈独白,叩问司法与人性。"),
]


def shows():
    out = []
    for sid, title, poster, cat, artist, venue, city, stops, date, pmin, pmax, dist, tags, tiers, disc, intro in SHOWS:
        out.append({
            "id": sid, "title": title, "poster": img(poster, title), "category": cat, "artist": artist,
            "venue": venue, "city": city, "cityStops": stops, "dateDesc": date, "sessionDesc": date,
            "priceMin": pmin, "priceMax": pmax, "distanceKm": dist, "tags": tags,
            "tiers": [{"id": t[0], "name": t[1], "price": t[2]} for t in tiers],
            "discount": disc, "intro": intro, "wished": False, "artistFollowed": False,
            "notices": ["限购说明:每笔订单限购6张", "退票/换票政策:本演出不支持退换", "入场方式说明:凭本人身份证原件入场",
                        "儿童购票:一人一票,儿童全价", "购票证件说明:购票时填写的证件为入场凭证",
                        "实名观演须知:一张身份证对应一张门票"],
        })
    return out


ORDERS = [
    ("o_01", "movie", "finished", "还有明天", "poster_missyou", "中影国际影城(仙林金鹰店)", "m_missyou",
     "2025-03-23 19:45~21:44 原版2D", "2号激光厅1区 特惠区 1排10座", 1, 39.9,
     {"qrToken": "MY-TICKET-o01-8f2e", "phone": "139 4621 4313", "verify": "0504 70 2 3819 4"},
     [], "", "", "", 1742727900000, True),
    ("o_02", "movie", "changed", "好东西", "poster_grandma_letter", "晓庄国际影城", "m_grandma",
     "2024-11-30 12:15 国语2D", "1号厅 1排1座 4排5座", 2, 55.6,
     {"qrToken": "MY-TICKET-o02-b31c", "phone": "139 4621 4313", "verify": "1130 55 6 7212 8"},
     [], "", "", "", 1732939500000, True),
    ("o_03", "movie", "finished", "蜡笔小新:我们的恐龙日记", "poster_baxian", "晓庄国际影城", "m_baxian",
     "2024-11-23 13:40 国语2D", "4号厅 1排12座", 1, 18.7,
     {"qrToken": "MY-TICKET-o03-77aa", "phone": "139 4621 4313", "verify": "1123 18 7 3341 2"},
     [], "", "", "", 1732340400000, True),
    ("o_04", "movie", "finished", "蓦然回首", "poster_shangbao", "晓庄国际影城", "m_shangbao",
     "2024-11-03 13:35 日语2D", "4号厅 1排12座 4排7座", 2, 45.6,
     {"qrToken": "MY-TICKET-o04-c9d0", "phone": "139 4621 4313", "verify": "1103 45 6 0917 6"},
     [], "", "", "", 1730612100000, True),
    ("o_05", "movie", "finished", "熊猫计划", "poster_kungfu_soccer", "晓庄国际影城", "m_kungfu",
     "2024-10-15 14:40 国语2D", "4号厅 1排12座", 1, 14.8,
     {"qrToken": "MY-TICKET-o05-e412", "phone": "139 4621 4313", "verify": "1015 14 8 5520 3"},
     [], "", "", "", 1728974400000, True),
    ("o_06", "movie", "finished", "毒液:最后一舞", "poster_vanishing", "中影国际影城(仙林金鹰店)", "m_vanishing",
     "2024-10-23 16:10 英语2D", "2号激光厅 1排9座", 1, 19.9,
     {"qrToken": "MY-TICKET-o06-19fb", "phone": "139 4621 4313", "verify": "1023 19 9 8804 1"},
     [], "", "", "", 1729671000000, False),
]


def orders():
    out = []
    for (oid, kind, status, title, poster, venue, mid, sess, hall, cnt, total, code, snacks_, shid, tier, viewer, ts, rated) in ORDERS:
        out.append({
            "id": oid, "kind": kind, "status": status, "title": title, "poster": img(poster, title),
            "cinemaOrVenue": venue, "movieId": mid, "sessionDesc": sess, "hallSeats": hall,
            "count": cnt, "total": total, "code": code, "snacks": snacks_,
            "showId": shid, "tierDesc": tier, "viewerName": viewer, "timestamp": ts, "rated": rated,
        })
    return out


FUN = [
    ("f_billiard", "星动台球(南信科技园店)", "fun_billiard", 4.9, "台球", "仙林大学城", 0.762, 0,
     ["团 ¥19.9 5.3折 ¥38 【上午11至15点】中八台球1小时", "团 ¥26.9 7.1折 ¥38 【全天可用】中八台球1小时"]),
    ("f_wangka", "踏浪(盈禾店)", "fun_esports", 4.5, "网吧/电竞", "仙林大学城", 2.0, 24,
     ["团 ¥9.85 1.7折 ¥58 【考生专享】9.8元大厅3小时", "团 ¥10 4.2折 ¥24 【大厅包早】3小时"]),
    ("f_esports", "炫风电竞网咖(高科荣境店)", "fun_esports", 4.3, "网吧/电竞", "高科荣境", 2.1, 0,
     ["特惠 ¥16.9 1.7折 ¥100 新会员|100网费", "特惠 ¥26 4.9折 ¥54 网咖大厅5小时畅玩"]),
    ("f_gamehouse", "小埋游戏屋(南大和园店)", "fun_gamehouse", 4.2, "主机游戏", "南大和园", 2.0, 49,
     ["团 ¥1 0.1折 ¥199 聚会团建咨询", "团 ¥26.8 3.1折 ¥88 一小时麻将全天场"]),
    ("f_billiard8", "星期捌台球俱乐部(南邮广场店)", "fun_billiard", 4.7, "台球", "南邮广场", 2.5, 0,
     ["团 ¥19.9 5.1折 ¥39 中八台球1小时", "团 ¥29.9 7.7折 ¥39 【周一至周日通用】"]),
    ("f_kuyou", "酷游台球(文宗路店)", "fun_billiard", 4.3, "台球", "仙林大学城", 2.0, 20,
     ["团 ¥18.9 5折 ¥38 【早10至晚5】新客专享"]),
    ("f_ktv", "纯K·量贩KTV(万达店)", "fun_ktv", 4.6, "KTV", "万达广场", 3.1, 66,
     ["团 ¥58 4.8折 欢唱3小时小包", "团 ¥98 5.6折 欢唱3小时中包+果盘"]),
    ("f_escape", "谜城密室逃脱(旗舰店)", "fun_escape", 4.8, "密室逃脱", "吾悦广场", 4.4, 88,
     ["团 ¥68 6.9折 单人恐怖主题场", "团 ¥120 7.5折 双人任选主题"]),
]

SCENICS = [
    ("sc_amuse", "丝路欢乐世界", "scenic_amusement", 79),
    ("sc_water", "乐华城·88℃温泉乐园", "scenic_waterpark", 80),
    ("sc_museum", "陕西历史博物馆·特色展馆", "scenic_museum", 60),
    ("sc_castle", "张裕瑞那城堡酒庄", "scenic_castle", 60),
]

# gate4轮2:影人(搜索热词的人名 → 影人卡 + 关联演出/作品),避免点进空白
# (id, name, en, avatar, role, works[], showIds[], movieIds[])
ARTISTS = [
    ("ar_yangli", "杨笠", "Li Yang", "artist_yangli", "演员", ["鸣龙少年", "七时吉祥", "脱口秀大会第五季"], ["sh_yangli"], []),
    ("ar_xusong", "许嵩", "Song Xu", "artist_xusong", "歌手 / 音乐制作", ["跑出一片天", "我的音乐你听吗", "山水之间"], ["sh_xusong"], []),
    ("ar_zhoujielun", "周杰伦", "Jay Chou", "artist_zhoujielun", "歌手 / 演员", ["七里香", "晴天", "稻香"], ["sh_zhou"], []),
    ("ar_wangfeng", "汪峰", "Feng Wang", "artist_wangfeng", "歌手", ["相信未来", "怒放的生命", "北京北京"], ["sh_believe"], []),
    ("ar_liangjingru", "梁静茹", "Fish Leong", "artist_liangjingru", "歌手", ["勇气", "宁夏", "可惜不是你"], ["sh_liang"], []),
    ("ar_chenjingxia", "陈靖霎", "Jingxia Chen", "artist_chenjingxia", "歌手", ["红霞影剧院", "仲夏夜", "浪漫剧场"], ["sh_redhall"], []),
    ("ar_guodegang", "郭德纲于谦", "Guo & Yu", "artist_guodegang", "相声演员", ["我要幸福", "你要高雅", "西征梦"], ["sh_crosstalk"], []),
    ("ar_shuqi", "舒淇", "Shu Qi", "artist_shuqi", "导演 / 演员", ["女孩", "刺客聂隐娘", "最好的时光"], [], ["m_girl"]),
    ("ar_chenhaoyu", "陈昊宇", "Haoyu Chen", "artist_shuqi", "演员", ["初步举证", "乘风破浪的姐姐", "话剧演员"], ["sh_chubu"], ["m_prima"]),
]


def artists():
    out = []
    for aid, name, en, av, role, works, show_ids, movie_ids in ARTISTS:
        out.append({
            "id": aid, "name": name, "nameEn": en, "avatar": img(av, name), "role": role,
            "works": works, "showIds": show_ids, "movieIds": movie_ids, "followed": False,
        })
    return out


COUPONS = [
    ("cp_v1", 3, "无门槛", "新客电影代金券", "代金券", "2026-08-31 23:59", "valid"),
    ("cp_v2", 5, "30元以上可用", "周末观影红包", "代金券", "2026-07-31 23:59", "valid"),
    ("cp_e1", 5, "无门槛", "5元星轶影城专属券", "商家券", "2026-03-17 23:59", "expired"),
    ("cp_e2", 5.4, "30元以上可用", "5.4元万达影城专属红包", "代金券", "2026-02-16 23:59", "expired"),
    ("cp_e3", 5.4, "30元以上可用", "5.4元万达影城专属红包", "代金券", "2026-02-10 23:59", "expired"),
    ("cp_e4", 3, "无门槛", "星轶上影影城(仙林九霄…", "商家券", "2025-09-04 23:59", "expired"),
    ("cp_u1", 3, "无门槛", "星轶上影影城(仙林九霄…", "商家券", "2025-08-28 23:59", "used"),
]

data = {
    "session": {"loggedIn": True, "phone": "139 4621 4313", "nick": "xfQ992830335", "avatar": img("avatar_user", "我")},
    "city": "咸阳",
    "cities": [
        {"id": "ct_xy", "name": "咸阳", "hot": True}, {"id": "ct_xa", "name": "西安", "hot": True},
        {"id": "ct_nj", "name": "南京", "hot": True}, {"id": "ct_sh", "name": "上海", "hot": True},
        {"id": "ct_bj", "name": "北京", "hot": True}, {"id": "ct_gz", "name": "广州", "hot": True},
        {"id": "ct_sz", "name": "深圳", "hot": True}, {"id": "ct_wh", "name": "武汉", "hot": True},
        {"id": "ct_tj", "name": "天津", "hot": True}, {"id": "ct_hz", "name": "杭州", "hot": True},
        {"id": "ct_cd", "name": "成都", "hot": True}, {"id": "ct_cq", "name": "重庆", "hot": True},
    ],
    "movies": [
        {
            "id": mid, "title": t, "titleEn": en, "poster": img(poster, t), "themeColor": theme,
            "status": status, "score": score, "previewScore": prev, "wishCount": wish,
            "genres": genres, "duration": dur, "releaseDate": date,
            "releaseNote": f"{date} 中国大陆上映",
            "cast": cast(*(range((i * 3) % 9, (i * 3) % 9 + 3))),
            "synopsis": syn, "formats": fmts, "presale": presale,
            "cinemaCount": cn, "sessionCount": sn,
        }
        for i, (mid, t, en, poster, theme, status, score, prev, wish, genres, dur, date, fmts, presale, cn, sn, syn) in enumerate(MOVIES)
    ],
    "reviews": reviews(),
    "wishMovies": [],
    "watched": {
        "m_grandma": {"stars": 10, "text": "平淡又令人感动的故事", "timestamp": BASE_TS - 60 * DAY},
        "m_vanishing": {"stars": 0, "text": "", "timestamp": BASE_TS - 40 * DAY},
        "m_missyou": {"stars": 0, "text": "", "timestamp": BASE_TS - 112 * DAY},
        "m_kungfu": {"stars": 0, "text": "", "timestamp": BASE_TS - 271 * DAY},
        "m_baxian": {"stars": 0, "text": "", "timestamp": BASE_TS - 232 * DAY},
    },
    "wishShows": [],
    "cinemas": cinemas(),
    "sessions": sessions(),
    "snacks": [
        {"id": i, "name": n, "image": img(im, n), "price": p, "origPrice": op, "tag": tag, "kind": kind}
        for i, n, im, p, op, tag, kind in SNACKS
    ],
    "shows": shows(),
    "orders": orders(),
    "profiles": [
        {"id": "vp_1", "name": "*惠嘉", "idMasked": "230************426"},
        {"id": "vp_2", "name": "*舒适", "idMasked": "362************223"},
        {"id": "vp_3", "name": "*雨滴", "idMasked": "362************028"},
        {"id": "vp_4", "name": "*亿蕾", "idMasked": "110************625"},
        {"id": "vp_5", "name": "*靖雯", "idMasked": "230************324"},
    ],
    "coupons": [
        {"id": i, "amount": a, "threshold": th, "title": t, "kind": k, "expiry": e, "status": s}
        for i, a, th, t, k, e, s in COUPONS
    ],
    "funMerchants": [
        {"id": i, "name": n, "image": img(im, n), "rating": r, "category": c, "zone": z,
         "distanceKm": d, "perCapita": pc, "deals": deals}
        for i, n, im, r, c, z, d, pc, deals in FUN
    ],
    "scenics": [{"id": i, "name": n, "image": img(im, n), "priceFrom": p} for i, n, im, p in SCENICS],
    "artists": artists(),
    # gate4轮2:热搜/历史/想看榜词条全部映射到已种子化的电影/演出/影人,点进去有真实内容(不空白)
    "searchHistory": ["初步举证", "女孩", "杨笠", "许嵩", "功夫女足", "周杰伦", "三国第一部"],
    "hotSearch": ["功夫女足", "杨笠", "许嵩", "周杰伦", "汪峰", "三国第一部", "初步举证", "女孩", "梁静茹", "郭德纲于谦"],
    "wishRank": ["蜘蛛侠:崭新之日", "想你了", "恐怖游轮", "八仙!", "林家宅37号", "上堡之恋", "初步举证", "女孩", "功夫女足", "魔方小姐"],
    "miaoCoins": 20,
    "seatDraft": None,
    "showDraft": None,
    "payContext": "movie",
    "payMethod": "微信支付",
    "lastOrderId": "",
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK: defaults.json 生成完毕 ({OUT.stat().st_size} bytes; sessions={len(data['sessions'])})")
