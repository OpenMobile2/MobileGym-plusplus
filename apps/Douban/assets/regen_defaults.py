# -*- coding: utf-8 -*-
"""
豆瓣种子数据生成器(Playbook §5.2,FOUNDATION 版)。
- 永远用本脚本生成 data/defaults.json,不手写、不手改生成物。
- 数据主线:docs/douban-replication/00c-recording-catalog.md「种子数据主线」;
  形状 = apps/Douban/types.ts DoubanConfig(改形状先改 types 再改这里)。
- 图片:PNG 存在则优先 PNG(assets/image_manifest.json 批量生图落盘后自动切换),
  否则生成 SVG 占位(IMG/AV helper,与 Flomo 同款)。
- 修改本文件后:重跑本脚本 + 递增 constants.ts DATA_VERSION。
运行: python3 apps/Douban/assets/regen_defaults.py
"""
import json
from pathlib import Path

APP = Path(__file__).parent.parent
OUT = APP / "data" / "defaults.json"
IMAGES = APP / "assets" / "images"
AVATARS = APP / "assets" / "avatars"
IMAGES.mkdir(parents=True, exist_ok=True)
AVATARS.mkdir(parents=True, exist_ok=True)

BASE_TS = 1782000000000  # 固定基准点(绝对 Unix 毫秒,约 2026-06)
T = lambda d, h=0, m=0: BASE_TS - d * 86400000 + h * 3600000 + m * 60000

A = lambda f: f"/@app-assets/Douban/avatars/{f}"
I = lambda f: f"/@app-assets/Douban/images/{f}"

INK = ["#00B51D", "#5B8DEF", "#E8923C", "#9B6BDF", "#E0608A", "#3FB6B6", "#7A8A99", "#C7913C"]


def svg_avatar(name: str, ch: str, idx: int):
    bg = INK[idx % len(INK)]
    (AVATARS / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        f'<rect width="100" height="100" rx="50" fill="{bg}"/>'
        f'<text x="50%" y="63%" text-anchor="middle" font-size="42" fill="#fff" '
        f'font-family="sans-serif">{ch}</text></svg>', encoding="utf-8")


def svg_image(name: str, label: str, idx: int, w=300, h=420):
    bg = INK[idx % len(INK)]
    (IMAGES / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
        f'<rect width="{w}" height="{h}" fill="{bg}" opacity="0.18"/>'
        f'<rect width="{w}" height="{h}" fill="none" stroke="{bg}" stroke-width="2"/>'
        f'<text x="50%" y="52%" text-anchor="middle" font-size="24" fill="{bg}" '
        f'font-family="sans-serif">{label}</text></svg>', encoding="utf-8")


_img_idx = 0


def IMG(stem: str, label: str, w=300, h=420) -> str:
    """图片引用:有 PNG 优先 PNG,否则生成 SVG 占位。"""
    global _img_idx
    _img_idx += 1
    png = IMAGES / f"{stem}.png"
    if png.exists():
        return I(f"{stem}.png")
    svg_image(f"{stem}.svg", label, _img_idx, w, h)
    return I(f"{stem}.svg")


def AV(stem: str, ch: str, idx: int) -> str:
    png = AVATARS / f"{stem}.png"
    if png.exists():
        return A(f"{stem}.png")
    svg_avatar(f"{stem}.svg", ch, idx)
    return A(f"{stem}.svg")


# =============================================================== 用户
# ---------------------------------------------------------------------------
# §1 隐私脱敏:所有真实/敏感数据一律替换为虚构值,真实昵称/ID/手机号/IP 不得出现在仓库任何文件。
#   当前用户固定虚构身份:豆友_墨鱼仔 / ID 100200300 / 手机 138****2046 / IP属地 江苏;
#   私信对象为虚构用户 甜筒不加糖(留言文本为中性占位);
#   真实卡司/导演 → 虚构影人名。所有长文正文均为原创中性填充,不复刻任何真实文本。
# ---------------------------------------------------------------------------
SELF_ID = "100200300"
current_user = {
    "id": SELF_ID, "name": "豆友_墨鱼仔", "avatar": AV("me", "墨", 0),
    "ipLocation": "江苏", "isSelf": True, "signature": "书影音随手记",
    "followers": 3, "following": 18, "badges": 1, "privacy": "public",
    "stats": {"movieDone": 4, "bookDone": 3, "musicDone": 1},
    "beans": 0, "joinedText": "2026年加入",
}

USERS_SPEC = [
    # (id, name, avatar_ch, ip, signature, followers, following, badges, privacy, stats)
    # 私信对象(虚构):甜筒不加糖
    ("u_shasitian", "甜筒不加糖", "甜", "河南", "郑州养猫人", 208, 77, 3, "public", (312, 45, 12)),
    ("u_lilith", "夜航西行", "夜", "江西", "写作中/女性主义", 1024, 156, 8, "public", (876, 402, 33)),
    ("u_lixinyuan", "林洄野", "林", "辽宁", "看片如吃饭", 420, 266, 15, "public", (3923, 130, 87)),
    ("u_jiegeng", "薄荷凉茶", "薄", "浙江", "", 96, 88, 2, "public", (193, 61, 20)),
    ("u_shan", "记事簿君", "记", "北京", "记录 610 天", 771, 145, 26, "public", (426, 68, 152)),
    ("u_yezi", "海鸥与浪", "鸥", "广东", "海边长大", 318, 266, 6, "public", (540, 92, 41)),
    ("u_qiye", "第七片叶", "叶", "山东", "", 1893, 74, 72, "albumHidden", (1204, 233, 96)),
    ("u_touming", "隔壁的柜子", "柜", "日本", "", 55, 12, 1, "allHidden", (0, 0, 0)),
    ("u_god", "耳朵挑食", "耳", "四川", "音乐杂食动物", 233, 190, 4, "public", (77, 12, 460)),
    ("u_wushan", "山中长评客", "山", "重庆", "长文爱好者", 2087, 63, 19, "public", (1520, 388, 74)),
    ("u_jinse", "旧船票客", "旧", "辽宁", "", 866, 120, 9, "public", (610, 55, 30)),
    ("u_chendanqi", "微光观察员C", "观", "上海", "微光观察员", 1543, 89, 11, "public", (233, 18, 5)),
    # ---- §2 扩充友邻(新增,均虚构 + 头像引用)----
    ("u_mubai", "沐白读诗", "沐", "云南", "读诗，也写诗", 640, 210, 5, "public", (120, 880, 33)),
    ("u_tangwei", "汤圆没有馅", "汤", "湖南", "厨房与书桌", 302, 133, 4, "public", (410, 260, 88)),
    ("u_qingzhu", "青竹听雨", "青", "福建", "民谣与旷野", 512, 200, 7, "public", (233, 90, 512)),
    ("u_luli", "路过的鹿", "鹿", "内蒙古", "", 178, 260, 3, "public", (330, 120, 40)),
    ("u_anke", "暗刻推理社", "暗", "江苏", "本格推理爱好者", 990, 88, 12, "public", (760, 640, 22)),
    ("u_xiaman", "夏满不满", "夏", "海南", "冲浪和电影", 421, 300, 6, "public", (612, 88, 70)),
    ("u_beihai", "北海有鲸", "鲸", "山东", "科幻迷", 1330, 95, 14, "public", (940, 700, 55)),
    ("u_shiyou", "拾光邮局", "拾", "陕西", "", 260, 140, 2, "albumHidden", (188, 96, 30)),
]
users = [current_user] + [
    {
        "id": uid, "name": name, "avatar": AV(f"av_{uid[2:]}", ch, i + 1),
        "ipLocation": ip, "signature": sig, "followers": fo, "following": fi,
        "badges": bd, "privacy": pv,
        "stats": {"movieDone": st[0], "bookDone": st[1], "musicDone": st[2]},
    }
    for i, (uid, name, ch, ip, sig, fo, fi, bd, pv, st) in enumerate(USERS_SPEC)
]

# =============================================================== 影人(全部虚构)
celebrities = [
    {"id": "cel_xuzhanxiong", "name": "顾长临", "avatar": AV("cel_xuzhanxiong", "顾", 3),
     "role": "导演 / 编剧", "followers": 1268, "works": ["m1"], "desc": "《赤水长歌》导演"},
    {"id": "cel_liuye", "name": "沈默之", "avatar": AV("cel_liuye", "沈", 4),
     "role": "演员", "followers": 21843, "works": ["m1"], "desc": "虚构男演员"},
    {"id": "cel_yushi", "name": "程屿", "avatar": AV("cel_yushi", "程", 5),
     "role": "演员", "followers": 18730, "works": ["m1"], "desc": ""},
    {"id": "cel_wangzhifei", "name": "陆知非", "avatar": AV("cel_wangzhifei", "陆", 6),
     "role": "演员", "followers": 3405, "works": ["m1"], "desc": ""},
    {"id": "cel_wanglei", "name": "雷子川", "avatar": AV("cel_wanglei", "雷", 7),
     "role": "演员", "followers": 2960, "works": ["m1"], "desc": ""},
    {"id": "cel_wangyaoqing", "name": "耀之朗", "avatar": AV("cel_wangyaoqing", "耀", 0),
     "role": "演员", "followers": 8812, "works": ["m1"], "desc": ""},
    {"id": "cel_zhangli", "name": "章曼俪", "avatar": AV("cel_zhangli", "章", 1),
     "role": "演员", "followers": 5127, "works": ["m1"], "desc": ""},
    # ---- §2 扩充影人(虚构)----
    {"id": "cel_hejingwen", "name": "何静文", "avatar": AV("cel_hejingwen", "何", 2),
     "role": "导演", "followers": 7420, "works": ["m8", "m9"], "desc": "《雾港》《暮色渡口》导演"},
    {"id": "cel_baiqingyu", "name": "白清羽", "avatar": AV("cel_baiqingyu", "白", 3),
     "role": "演员", "followers": 33120, "works": ["m8", "tv4"], "desc": ""},
    {"id": "cel_qiaoye", "name": "乔野", "avatar": AV("cel_qiaoye", "乔", 4),
     "role": "演员", "followers": 15980, "works": ["m9", "m10"], "desc": ""},
    {"id": "cel_wenxi", "name": "温晞", "avatar": AV("cel_wenxi", "温", 5),
     "role": "演员", "followers": 9210, "works": ["m10", "tv5"], "desc": ""},
    {"id": "cel_luoshen", "name": "洛沈", "avatar": AV("cel_luoshen", "洛", 6),
     "role": "导演 / 编剧", "followers": 4880, "works": ["m11"], "desc": "《回声之城》导演"},
]

# =============================================================== 条目
DIST = lambda a, b, c, d, e: [a, b, c, d, e]  # 5星→1星 百分比

movies = [
    {"id": "m1", "type": "movie", "title": "赤水长歌", "cover": IMG("subject_m1", "赤水长歌"),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "中国大陆 / 剧情 / 战争 / 历史",
     "intro": "以一支行军队伍数次横渡大河为背景的战争史诗,用群像视角还原一段惊心动魄的战略转移。",
     "genres": ["剧情", "战争", "历史"], "duration": "142分钟", "hotLabel": "NO.1 热门电影",
     "friendRating": {"count": 0, "score": None}, "photosCount": 174,
     "presetTags": ["战争", "历史", "国产"],
     "credits": [
         {"name": "顾长临", "role": "导演", "celebrityId": "cel_xuzhanxiong"},
         {"name": "程屿", "role": "饰 战士甲", "celebrityId": "cel_yushi"},
         {"name": "陆知非", "role": "饰 指挥员", "celebrityId": "cel_wangzhifei"},
         {"name": "雷子川", "role": "饰 参谋长", "celebrityId": "cel_wanglei"},
         {"name": "耀之朗", "role": "饰 军需官", "celebrityId": "cel_wangyaoqing"},
         {"name": "章曼俪", "role": "饰 卫生员", "celebrityId": "cel_zhangli"},
         {"name": "沈默之", "role": "特别出演", "celebrityId": "cel_liuye"},
     ]},
    {"id": "m2", "type": "movie", "title": "寻宝奇缘", "cover": IMG("subject_m2", "寻宝奇缘"),
     "rating": 5.0, "ratingCount": 268435, "year": "2024", "info": "中国大陆 / 喜剧 / 动作",
     "intro": "考古学家携手异国学者踏上寻宝之旅的贺岁动作喜剧。",
     "genres": ["喜剧", "动作"], "duration": "107分钟",
     "ratingDist": DIST(6, 10, 30, 32, 22), "friendRating": {"count": 1, "score": 6.0},
     "presetTags": ["喜剧", "动作", "贺岁片"]},
    {"id": "m3", "type": "movie", "title": "无尽回廊", "cover": IMG("subject_m3", "无尽回廊"),
     "rating": 6.6, "ratingCount": 8421, "year": "2025", "info": "美国 / 惊悚 / 恐怖",
     "intro": "误入无尽房间的少年,在潮湿地毯与日光灯的嗡鸣里寻找出口。",
     "genres": ["惊悚", "恐怖"], "duration": "96分钟",
     "ratingDist": DIST(8, 22, 43, 20, 7), "presetTags": ["惊悚", "都市传说"]},
    {"id": "m4", "type": "movie", "title": "复仇名单", "cover": IMG("subject_m4", "复仇名单"),
     "rating": 8.4, "ratingCount": 512340, "year": "2021", "info": "美国 / 动作 / 犯罪",
     "intro": "一位女杀手从昏迷中醒来,踏上复仇名单上的最后一个名字。",
     "genres": ["动作", "犯罪"], "duration": "111分钟",
     "ratingDist": DIST(46, 38, 13, 2, 1), "presetTags": ["动作", "复仇", "邪典"]},
    {"id": "m5", "type": "movie", "title": "追光少年", "cover": IMG("subject_m5", "追光少年"),
     "rating": 9.2, "ratingCount": 1892000, "year": "2019", "info": "印度 / 喜剧 / 剧情",
     "intro": "两个好友寻找失踪多年的天才同窗,笑泪交织的大学往事。",
     "genres": ["喜剧", "剧情", "励志"], "duration": "171分钟", "top250Rank": 12,
     "ratingDist": DIST(72, 22, 5, 1, 0), "presetTags": ["励志", "教育"]},
    {"id": "m6", "type": "movie", "title": "家宴", "cover": IMG("subject_m6", "家宴"),
     "rating": 9.2, "ratingCount": 730120, "year": "2014", "info": "中国台湾 / 剧情 / 家庭",
     "intro": "老父亲的一桌好菜,端出一个家庭的聚散离合。",
     "genres": ["剧情", "家庭"], "duration": "124分钟", "top250Rank": 38,
     "ratingDist": DIST(68, 26, 5, 1, 0), "presetTags": ["家庭", "美食"]},
    {"id": "m7", "type": "movie", "title": "雨夜追凶", "cover": IMG("subject_m7", "雨夜追凶"),
     "rating": 8.9, "ratingCount": 921500, "year": "2018", "info": "韩国 / 犯罪 / 悬疑",
     "intro": "连环凶案笼罩雨夜小城,两名刑警在泥泞中追索真相。",
     "genres": ["犯罪", "悬疑"], "duration": "131分钟", "top250Rank": 71,
     "ratingDist": DIST(58, 33, 8, 1, 0), "presetTags": ["犯罪", "悬疑", "韩国"]},
    # ---- §2 扩充电影(虚构)----
    {"id": "m8", "type": "movie", "title": "雾港", "cover": IMG("subject_m8", "雾港"),
     "rating": 8.7, "ratingCount": 64210, "year": "2025", "info": "中国大陆 / 剧情 / 犯罪",
     "intro": "一座常年被雾笼罩的港口小城,一桩旧案把三个陌生人的命运缠在了一起。",
     "genres": ["剧情", "犯罪", "悬疑"], "duration": "128分钟",
     "ratingDist": DIST(52, 36, 9, 2, 1), "friendRating": {"count": 2, "score": 8.5},
     "presetTags": ["文艺", "悬疑", "国产"],
     "credits": [
         {"name": "何静文", "role": "导演", "celebrityId": "cel_hejingwen"},
         {"name": "白清羽", "role": "饰 林港", "celebrityId": "cel_baiqingyu"},
     ]},
    {"id": "m9", "type": "movie", "title": "暮色渡口", "cover": IMG("subject_m9", "暮色渡口"),
     "rating": 7.9, "ratingCount": 22140, "year": "2024", "info": "中国大陆 / 剧情 / 爱情",
     "intro": "摆渡人与考古系学生在黄昏渡口的一段无疾而终的相遇。",
     "genres": ["剧情", "爱情"], "duration": "116分钟",
     "ratingDist": DIST(34, 42, 18, 4, 2), "presetTags": ["爱情", "文艺"],
     "credits": [{"name": "何静文", "role": "导演", "celebrityId": "cel_hejingwen"},
                 {"name": "乔野", "role": "饰 阿渡", "celebrityId": "cel_qiaoye"}]},
    {"id": "m10", "type": "movie", "title": "星海拾遗", "cover": IMG("subject_m10", "星海拾遗"),
     "rating": 8.2, "ratingCount": 41880, "year": "2026", "info": "中国大陆 / 科幻 / 剧情",
     "intro": "近未来的深空打捞船上,一名工程师捡到一段来历不明的信号。",
     "genres": ["科幻", "剧情"], "duration": "134分钟",
     "ratingDist": DIST(44, 38, 14, 3, 1), "presetTags": ["科幻", "太空"],
     "credits": [{"name": "乔野", "role": "饰 工程师", "celebrityId": "cel_qiaoye"},
                 {"name": "温晞", "role": "饰 领航员", "celebrityId": "cel_wenxi"}]},
    {"id": "m11", "type": "movie", "title": "回声之城", "cover": IMG("subject_m11", "回声之城"),
     "rating": 7.4, "ratingCount": 12030, "year": "2025", "info": "美国 / 悬疑 / 惊悚",
     "intro": "一位声音设计师发现城市的回声里藏着不该存在的第二个声音。",
     "genres": ["悬疑", "惊悚"], "duration": "104分钟",
     "ratingDist": DIST(26, 40, 26, 6, 2), "presetTags": ["悬疑", "心理"],
     "credits": [{"name": "洛沈", "role": "导演", "celebrityId": "cel_luoshen"}]},
]

tvs = [
    {"id": "tv1", "type": "tv", "title": "微光恋综 第五季", "cover": IMG("subject_tv1", "微光恋综"),
     "rating": 6.5, "ratingCount": 12408, "year": "2026", "info": "中国大陆 / 真人秀 / 恋爱",
     "intro": "都市轻熟龄男女的恋爱观察真人秀第五季。", "genres": ["真人秀", "爱情"],
     "episodes": 12, "onAir": True, "ratingDist": DIST(10, 22, 41, 19, 8),
     "presetTags": ["恋综", "真人秀"]},
    {"id": "tv2", "type": "tv", "title": "开庭", "cover": IMG("subject_tv2", "开庭"),
     "rating": 8.6, "ratingCount": 45120, "year": "2025", "info": "中国大陆 / 剧情 / 律政",
     "intro": "基层法庭里的小案件,照见普通人的难与暖。", "genres": ["剧情", "律政"],
     "episodes": 24, "onAir": False, "ratingDist": DIST(45, 40, 12, 2, 1),
     "presetTags": ["律政", "现实主义"]},
    {"id": "tv3", "type": "tv", "title": "老农场的一年 第五季", "cover": IMG("subject_tv3", "农场S5"),
     "rating": 9.6, "ratingCount": 88230, "year": "2026", "info": "英国 / 纪录片 / 喜剧",
     "intro": "话痨主持人的农场经营第五年,依旧鸡飞狗跳。", "genres": ["纪录片", "喜剧", "真人秀"],
     "episodes": 8, "onAir": True, "ratingDist": DIST(82, 15, 2, 1, 0),
     "presetTags": ["纪录片", "英剧"]},
    # ---- §2 扩充剧集(虚构)----
    {"id": "tv4", "type": "tv", "title": "长夜将尽", "cover": IMG("subject_tv4", "长夜将尽"),
     "rating": 8.9, "ratingCount": 133200, "year": "2025", "info": "中国大陆 / 悬疑 / 犯罪",
     "intro": "一名退休刑警重启十年前的悬案,层层线索指向意想不到的真相。",
     "genres": ["悬疑", "犯罪", "剧情"], "episodes": 16, "onAir": False,
     "ratingDist": DIST(56, 33, 8, 2, 1), "presetTags": ["悬疑", "犯罪", "国产剧"]},
    {"id": "tv5", "type": "tv", "title": "山海食堂", "cover": IMG("subject_tv5", "山海食堂"),
     "rating": 8.1, "ratingCount": 29400, "year": "2026", "info": "中国大陆 / 剧情 / 美食",
     "intro": "海边小城一家深夜食堂,每一道菜背后都是一段人间故事。",
     "genres": ["剧情", "家庭"], "episodes": 20, "onAir": True,
     "ratingDist": DIST(40, 42, 14, 3, 1), "presetTags": ["治愈", "美食"]},
    {"id": "tv6", "type": "tv", "title": "旷野之诗", "cover": IMG("subject_tv6", "旷野之诗"),
     "rating": 9.2, "ratingCount": 54100, "year": "2024", "info": "英国 / 纪录片 / 历史",
     "intro": "一支摄制组用四季时间,记录北方旷野上一座小镇的日常与传说。",
     "genres": ["纪录片", "历史"], "episodes": 6, "onAir": False,
     "ratingDist": DIST(70, 24, 4, 1, 1), "presetTags": ["纪录片", "英剧"]},
]

books = [
    {"id": "bk1", "type": "book", "title": "小镇上的知更鸟", "cover": IMG("subject_bk1", "知更鸟"),
     "author": "[美] 珂拉·薇恩", "press": "南岭译文出版社", "buyPrice": 39.5, "top250Rank": 25,
     "rating": 9.3, "ratingCount": 130192, "year": "2016", "info": "[美] 珂拉·薇恩 / 南岭译文出版社",
     "intro": "三个孩子的成长,一场审判,一座南方小镇的良心。",
     "genres": ["文学", "成长", "外国文学", "经典"],
     "presetTags": ["文学", "成长", "外国文学"],
     "toc": ["第一部", "第一章", "第二章", "第三章", "第二部", "第十二章", "第十三章"],
     "ratingDist": DIST(74, 21, 4, 1, 0)},
    {"id": "bk2", "type": "book", "title": "她乡纪年", "cover": IMG("subject_bk2", "她乡纪年"),
     "author": "[美] 玛雅·柯林斯", "press": "西岭文艺出版社", "buyPrice": 68.0,
     "rating": 9.3, "ratingCount": 8342, "year": "2024", "info": "[美] 玛雅·柯林斯 / 西岭文艺出版社",
     "intro": "跨越时空的女性乌托邦想象,一部关于分工与自由的思想实验。",
     "hotLabel": "NO.2|每月热门图书榜",
     "genres": ["文学", "女性主义", "科幻", "外国文学"],
     "presetTags": ["文学", "女性主义", "科幻"],
     "toc": ["第一章", "第二章", "第三章", "第四章"],
     "ratingDist": DIST(70, 24, 5, 1, 0)},
    {"id": "bk3", "type": "book", "title": "沉默的抄写员", "cover": IMG("subject_bk3", "抄写员"),
     "author": "[美] 赫伯特·梅林", "press": "北岸文艺出版社", "buyPrice": 32.0,
     "rating": 8.2, "ratingCount": 15230, "year": "2017", "info": "[美] 赫伯特·梅林 / 北岸文艺出版社",
     "intro": "「我宁愿不。」一位办公室抄写员用沉默进行的温柔抵抗。",
     "genres": ["文学", "中篇", "外国文学"], "presetTags": ["文学", "中篇", "外国文学"],
     "toc": ["沉默的抄写员", "译后记"],
     "ratingDist": DIST(38, 42, 17, 2, 1)},
    {"id": "bk4", "type": "book", "title": "锦园旧梦", "cover": IMG("subject_bk4", "锦园旧梦"),
     "author": "[清] 沈砚秋", "press": "华夏古籍出版社", "buyPrice": 59.7, "top250Rank": 1,
     "rating": 9.7, "ratingCount": 512300, "year": "1998", "info": "[清] 沈砚秋 / 华夏古籍出版社",
     "intro": "一座钟鸣鼎食之家的兴衰,满纸旧梦,一把辛酸泪。",
     "genres": ["古典文学", "文学", "历史"], "presetTags": ["古典", "文学"],
     "toc": ["第一回", "第二回", "第三回", "第四回", "第五回"],
     "ratingDist": DIST(87, 10, 2, 1, 0)},
    {"id": "bk5", "type": "book", "title": "余生", "cover": IMG("subject_bk5", "余生"),
     "author": "沈砚白", "press": "长风作家出版社", "buyPrice": 20.0, "top250Rank": 6,
     "rating": 9.4, "ratingCount": 802340, "year": "2015", "info": "沈砚白 / 长风作家出版社",
     "intro": "一个人如何在时代的洪流里,只为活着本身而活着。",
     "genres": ["文学", "当代文学", "小说"], "presetTags": ["文学", "当代"],
     "toc": ["中文版自序", "余生"], "ratingDist": DIST(78, 18, 3, 1, 0)},
    {"id": "bk6", "type": "book", "title": "四兄弟", "cover": IMG("subject_bk6", "四兄弟"),
     "author": "[俄] 陀里亚·科夫", "press": "北岸文艺出版社", "buyPrice": 88.0, "top250Rank": 8,
     "rating": 9.6, "ratingCount": 98420, "year": "2016", "info": "[俄] 陀里亚·科夫 / 北岸文艺出版社",
     "intro": "一桩命案,四个性情迥异的兄弟,一部关于信仰与人性的灵魂之书。",
     "genres": ["文学", "俄国文学", "外国文学", "经典"],
     "presetTags": ["文学", "俄国文学"], "toc": ["第一部", "第二部", "第三部", "第四部", "尾声"],
     "ratingDist": DIST(84, 13, 2, 1, 0)},
    {"id": "bk7", "type": "book", "title": "各奔前程", "cover": IMG("subject_bk7", "各奔前程"),
     "author": "淡青", "press": "近海人民出版社", "buyPrice": 49.0,
     "rating": 8.0, "ratingCount": 3210, "year": "2023", "info": "淡青 / 近海人民出版社",
     "intro": "九个关于当代生活的短篇,写尽都市人的疏离与温情。",
     "genres": ["文学", "短篇集", "当代文学"], "presetTags": ["文学", "短篇集"],
     "toc": ["山河", "旅行家", "养生"], "ratingDist": DIST(30, 45, 20, 4, 1)},
    {"id": "bk8", "type": "book", "title": "流量工厂", "cover": IMG("subject_bk8", "流量工厂"),
     "author": "程野", "press": "启明出版社", "buyPrice": 58.0,
     "rating": 7.6, "ratingCount": 1890, "year": "2025", "info": "程野 / 启明出版社",
     "intro": "一场深入 MCN 内部的田野调查:一个网络红人是怎样被制造出来的。",
     "hotLabel": "NO.1|每月热门图书榜",
     "genres": ["社科", "传媒", "纪实"], "presetTags": ["社科", "传媒"],
     "toc": ["序章", "孵化", "人设", "塌房"],
     "ratingDist": DIST(22, 40, 30, 6, 2)},
    # ---- §2 扩充图书(虚构,类型标签尤其丰富)----
    {"id": "bk9", "type": "book", "title": "雪落无声的午后", "cover": IMG("subject_bk9", "雪落"),
     "author": "[日] 樋口澪", "press": "北岸文艺出版社", "buyPrice": 46.0,
     "rating": 8.4, "ratingCount": 24100, "year": "2024", "info": "[日] 樋口澪 / 北岸文艺出版社",
     "intro": "北国小镇的一场大雪,把一对多年未见的姐妹重新困在了同一个屋檐下。",
     "genres": ["文学", "日本文学", "外国文学", "治愈"], "presetTags": ["日本文学", "治愈"],
     "toc": ["初雪", "旧屋", "融雪"], "ratingDist": DIST(42, 40, 15, 2, 1)},
    {"id": "bk10", "type": "book", "title": "第十三位客人", "cover": IMG("subject_bk10", "第十三位"),
     "author": "[英] 亚瑟·芬威克", "press": "南岭译文出版社", "buyPrice": 52.0,
     "rating": 8.8, "ratingCount": 61200, "year": "2023", "info": "[英] 亚瑟·芬威克 / 南岭译文出版社",
     "intro": "暴风雪之夜,别墅里的十三位客人接连遇害,凶手就在其中。",
     "genres": ["推理", "悬疑", "外国文学", "本格"], "presetTags": ["推理", "悬疑"],
     "toc": ["受邀", "第一夜", "第二夜", "谜底"], "ratingDist": DIST(50, 38, 9, 2, 1)},
    {"id": "bk11", "type": "book", "title": "群星的低语", "cover": IMG("subject_bk11", "群星"),
     "author": "[美] 内森·柯尔", "press": "西岭文艺出版社", "buyPrice": 78.0,
     "rating": 8.6, "ratingCount": 33400, "year": "2025", "info": "[美] 内森·柯尔 / 西岭文艺出版社",
     "intro": "人类首次接收到跨越千光年的信号,而破译它需要付出意想不到的代价。",
     "genres": ["科幻", "硬科幻", "外国文学"], "presetTags": ["科幻", "太空歌剧"],
     "toc": ["信号", "解码", "回音"], "ratingDist": DIST(46, 40, 11, 2, 1)},
    {"id": "bk12", "type": "book", "title": "被折叠的历史", "cover": IMG("subject_bk12", "折叠历史"),
     "author": "顾行之", "press": "启明出版社", "buyPrice": 88.0,
     "rating": 9.0, "ratingCount": 18700, "year": "2024", "info": "顾行之 / 启明出版社",
     "intro": "从一封家书出发,重新打捞一段被主流叙事折叠起来的近代往事。",
     "genres": ["历史", "社科", "纪实", "传记"], "presetTags": ["历史", "社科"],
     "toc": ["缘起", "档案", "重访", "余音"], "ratingDist": DIST(58, 32, 8, 1, 1)},
    {"id": "bk13", "type": "book", "title": "夜里的向日葵", "cover": IMG("subject_bk13", "向日葵"),
     "author": "林晚", "press": "长风作家出版社", "buyPrice": 42.0,
     "rating": 8.2, "ratingCount": 9800, "year": "2026", "info": "林晚 / 长风作家出版社",
     "intro": "一部写给所有在深夜里独自撑着的人的散文诗集。",
     "genres": ["诗歌", "散文", "文学"], "presetTags": ["诗歌", "散文"],
     "toc": ["卷一 · 夜", "卷二 · 光", "卷三 · 向"], "ratingDist": DIST(40, 38, 18, 3, 1)},
    {"id": "bk14", "type": "book", "title": "她们如何书写", "cover": IMG("subject_bk14", "她们"),
     "author": "苏黎", "press": "启明出版社", "buyPrice": 62.0,
     "rating": 8.9, "ratingCount": 14200, "year": "2025", "info": "苏黎 / 启明出版社",
     "intro": "一部梳理二十世纪女性写作者精神谱系的思想随笔。",
     "genres": ["女性主义", "社科", "文学评论"], "presetTags": ["女性主义", "社科"],
     "toc": ["导言", "先声", "同代", "余绪"], "ratingDist": DIST(54, 34, 9, 2, 1)},
]

music = [
    {"id": "mu1", "type": "music", "title": "星野信笺", "cover": IMG("subject_mu1", "星野", 300, 300),
     "rating": 8.1, "ratingCount": 20841, "year": "2025", "info": "苏野 / 流行 / 专辑",
     "artist": "苏野", "intro": "少年心气与星空意象的概念专辑。",
     "genres": ["流行", "华语"], "tracks": ["星野信笺", "夏夜标本", "光年信", "回声花园", "尾奏:降落"],
     "presetTags": [], "ratingDist": DIST(40, 35, 18, 5, 2)},
    {"id": "mu2", "type": "music", "title": "Watch It Burn", "cover": IMG("subject_mu2", "Burn", 300, 300),
     "rating": 7.2, "ratingCount": 5320, "year": "2025", "info": "Nova Lane / 流行 / 专辑",
     "artist": "Nova Lane", "intro": "回归舞曲的第七张录音室专辑。",
     "genres": ["流行", "电子", "舞曲"], "tracks": ["Watch It Burn", "Neon Rain", "Gravity", "Afterglow"],
     "presetTags": [], "ratingDist": DIST(22, 34, 30, 10, 4)},
    {"id": "mu3", "type": "music", "title": "RIDE OR DIE", "cover": IMG("subject_mu3", "RIDE", 300, 300),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "阿川 / 说唱 / EP",
     "artist": "阿川", "intro": "新人说唱歌手首张 EP。",
     "genres": ["说唱", "嘻哈"], "tracks": ["RIDE OR DIE", "夜行", "反光镜"], "presetTags": []},
    {"id": "mu4", "type": "music", "title": "安泊猜想", "cover": IMG("subject_mu4", "安泊", 300, 300),
     "rating": 8.6, "ratingCount": 31240, "year": "2024", "info": "沈迟 / 流行 / 专辑",
     "artist": "沈迟", "intro": "以「猜想」为题的第九张专辑。",
     "genres": ["流行", "华语", "民谣"], "tracks": ["安泊猜想", "纸鸢误", "晚风叙", "无解方程", "候鸟返航"],
     "presetTags": [], "ratingDist": DIST(52, 30, 13, 3, 2)},
    {"id": "mu5", "type": "music", "title": "双生记", "cover": IMG("subject_mu5", "双生", 300, 300),
     "rating": 7.8, "ratingCount": 2140, "year": "2026", "info": "星屿少女 / K-Pop / 迷你专辑",
     "artist": "星屿少女", "intro": "女团迷你专辑。",
     "genres": ["流行", "K-Pop", "舞曲"], "tracks": ["双生记", "Bubble Up", "Sugar Rush"], "presetTags": [],
     "ratingDist": DIST(30, 38, 24, 6, 2)},
    {"id": "mu6", "type": "music", "title": "On Wires", "cover": IMG("subject_mu6", "Wires", 300, 300),
     "rating": 8.3, "ratingCount": 980, "year": "2023", "info": "Marlowe Vane / 独立 / 专辑",
     "artist": "Marlowe Vane", "intro": "电线杆与旷野之间的独立民谣。",
     "genres": ["民谣", "独立", "摇滚"], "tracks": ["On Wires", "Static Field", "Pylon Song"], "presetTags": [],
     "ratingDist": DIST(42, 36, 17, 4, 1)},
    # ---- §2 扩充音乐(虚构)----
    {"id": "mu7", "type": "music", "title": "潮汐手记", "cover": IMG("subject_mu7", "潮汐", 300, 300),
     "rating": 8.8, "ratingCount": 12600, "year": "2025", "info": "青竹乐队 / 民谣 / 专辑",
     "artist": "青竹乐队", "intro": "一张关于海、旷野与远行的民谣专辑。",
     "genres": ["民谣", "独立", "华语"], "tracks": ["潮汐手记", "灯塔", "候鸟", "回南天", "退潮"],
     "presetTags": [], "ratingDist": DIST(58, 30, 9, 2, 1)},
    {"id": "mu8", "type": "music", "title": "午夜霓虹", "cover": IMG("subject_mu8", "霓虹", 300, 300),
     "rating": 8.0, "ratingCount": 7400, "year": "2024", "info": "River Kwan / 电子 / 专辑",
     "artist": "River Kwan", "intro": "复古合成器铺满整张夜色的电子专辑。",
     "genres": ["电子", "合成器", "独立"], "tracks": ["午夜霓虹", "地下轨道", "像素雨", "上行"],
     "presetTags": [], "ratingDist": DIST(44, 38, 14, 3, 1)},
    {"id": "mu9", "type": "music", "title": "旷野回声", "cover": IMG("subject_mu9", "旷野", 300, 300),
     "rating": 8.5, "ratingCount": 5100, "year": "2026", "info": "北岸巡演 / 摇滚 / 专辑",
     "artist": "北岸巡演", "intro": "一支北方摇滚乐队献给公路与青春的现场专辑。",
     "genres": ["摇滚", "独立", "现场"], "tracks": ["旷野回声", "夜行列车", "尘土飞扬", "散场"],
     "presetTags": [], "ratingDist": DIST(50, 34, 12, 3, 1)},
]

podcasts = [
    {"id": "pc1", "type": "podcast", "title": "大厂小民", "cover": IMG("subject_pc1", "工牌局", 300, 300),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "工牌局 / 单集",
     "showName": "工牌局", "episodeCount": 212, "durationText": "1小时56分",
     "dateText": "06-18", "guests": ["老钱", "一位不愿具名的大厂产品经理"],
     "intro": "从工牌聊到期权:大厂螺丝钉的十年账本。",
     "genres": ["商业", "职场"],
     "chapters": [
         {"time": "00:00", "title": "开场:为什么聊大厂小民"},
         {"time": "12:30", "title": "入职:第一份工牌的幻觉"},
         {"time": "38:45", "title": "晋升:向上管理的性价比"},
         {"time": "1:02:10", "title": "期权:纸面财富过山车"},
         {"time": "1:31:00", "title": "离开:落地时的姿势"},
         {"time": "1:48:20", "title": "彩蛋:听友提问"},
     ]},
    {"id": "pc2", "type": "podcast", "title": "重听一位作曲家:异步之后", "cover": IMG("subject_pc2", "读音", 300, 300),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "读音doin' / 单集",
     "showName": "读音doin'", "episodeCount": 87, "durationText": "40分钟",
     "dateText": "05-30", "guests": ["乐评人河生"],
     "intro": "重听一张实验专辑:声音、病痛与时间的交错。",
     "genres": ["音乐", "文化"],
     "chapters": [
         {"time": "00:00", "title": "开场曲:行板"},
         {"time": "09:15", "title": "这张专辑的诞生"},
         {"time": "27:40", "title": "尾声:满月"},
     ]},
    {"id": "pc3", "type": "podcast", "title": "掰头掰头:年度激辩", "cover": IMG("subject_pc3", "掰头", 300, 300),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "掰头掰头 / 单集",
     "showName": "掰头掰头", "episodeCount": 156, "durationText": "2小时54分",
     "dateText": "06-25", "guests": ["主播A", "主播B"],
     "intro": "三小时马拉松:今年我们吵过的十件小事。",
     "genres": ["闲聊", "文化"],
     "chapters": [
         {"time": "00:00", "title": "热场"},
         {"time": "24:00", "title": "议题一:早餐吃不吃"},
         {"time": "1:12:00", "title": "议题二:猫派狗派"},
         {"time": "2:30:00", "title": "终局投票"},
     ]},
    {"id": "pc4", "type": "podcast", "title": "怡楽播客", "cover": IMG("subject_pc4", "怡楽", 300, 300),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "怡楽播客 / 播客主页",
     "showName": "怡楽播客", "episodeCount": 1423, "durationText": "",
     "dateText": "", "guests": [], "intro": "共1423集的日更闲聊播客。",
     "genres": ["闲聊", "生活"], "chapters": []},
    # ---- §2 扩充播客(虚构)----
    {"id": "pc5", "type": "podcast", "title": "读一本冷门好书", "cover": IMG("subject_pc5", "读书", 300, 300),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "翻页之声 / 单集",
     "showName": "翻页之声", "episodeCount": 64, "durationText": "58分钟",
     "dateText": "06-20", "guests": ["书评人白桥"],
     "intro": "这期我们聊一本被严重低估的短篇集,以及它为什么值得被重读。",
     "genres": ["读书", "文化"],
     "chapters": [
         {"time": "00:00", "title": "开场:今天这本书"},
         {"time": "15:20", "title": "作者其人"},
         {"time": "42:00", "title": "为什么被低估"},
     ]},
    {"id": "pc6", "type": "podcast", "title": "深夜电台:失眠者请听", "cover": IMG("subject_pc6", "深夜", 300, 300),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "月亮频率 / 单集",
     "showName": "月亮频率", "episodeCount": 301, "durationText": "1小时12分",
     "dateText": "06-28", "guests": [],
     "intro": "为睡不着的人准备的低语电台,这期读几封听友来信。",
     "genres": ["情感", "闲聊"],
     "chapters": [
         {"time": "00:00", "title": "开场白"},
         {"time": "20:00", "title": "第一封来信"},
         {"time": "50:00", "title": "晚安曲"},
     ]},
]

# ---- §2 再扩充条目(全部虚构、原创中性,补足 ~60 条目、丰富 genres)----
extra_movies = [
    {"id": "m12", "type": "movie", "title": "候鸟旅馆", "cover": IMG("subject_m12", "候鸟旅馆"),
     "rating": 8.0, "ratingCount": 9800, "year": "2024", "info": "中国大陆 / 剧情 / 喜剧",
     "intro": "一家淡季海边旅馆里,几位素不相识的旅客共度了一个漫长的雨季。",
     "genres": ["剧情", "喜剧", "治愈"], "duration": "112分钟",
     "ratingDist": DIST(38, 40, 18, 3, 1), "presetTags": ["治愈", "群像"]},
    {"id": "m13", "type": "movie", "title": "纸上山河", "cover": IMG("subject_m13", "纸上山河"),
     "rating": 8.5, "ratingCount": 15600, "year": "2023", "info": "中国大陆 / 动画 / 奇幻",
     "intro": "一名爱画画的少年,某天发现自己笔下的山河会在夜里悄悄活过来。",
     "genres": ["动画", "奇幻", "冒险"], "duration": "98分钟",
     "ratingDist": DIST(50, 36, 11, 2, 1), "presetTags": ["动画", "国漫"]},
    {"id": "m14", "type": "movie", "title": "最后一班末班车", "cover": IMG("subject_m14", "末班车"),
     "rating": 7.7, "ratingCount": 8300, "year": "2025", "info": "日本 / 剧情 / 爱情",
     "intro": "每晚坐同一班末班车的两个陌生人,在城市的终点站慢慢靠近。",
     "genres": ["剧情", "爱情", "日本"], "duration": "106分钟",
     "ratingDist": DIST(32, 42, 20, 4, 2), "presetTags": ["爱情", "文艺", "日本"]},
]
extra_tvs = [
    {"id": "tv7", "type": "tv", "title": "岛屿来信", "cover": IMG("subject_tv7", "岛屿来信"),
     "rating": 8.6, "ratingCount": 41200, "year": "2025", "info": "中国大陆 / 剧情 / 家庭",
     "intro": "一封寄错地址的信,把一座小岛上三户人家的旧事重新牵到了一起。",
     "genres": ["剧情", "家庭", "治愈"], "episodes": 18, "onAir": False,
     "ratingDist": DIST(48, 40, 9, 2, 1), "presetTags": ["治愈", "家庭"]},
    {"id": "tv8", "type": "tv", "title": "极地厨房", "cover": IMG("subject_tv8", "极地厨房"),
     "rating": 9.0, "ratingCount": 22300, "year": "2026", "info": "英国 / 纪录片 / 美食",
     "intro": "摄制组跟随一支考察队,在极地站点记录他们如何用有限食材做出一日三餐。",
     "genres": ["纪录片", "美食"], "episodes": 6, "onAir": True,
     "ratingDist": DIST(66, 28, 4, 1, 1), "presetTags": ["纪录片", "美食"]},
]
extra_books = [
    {"id": "bk15", "type": "book", "title": "城市观察笔记", "cover": IMG("subject_bk15", "城市观察"),
     "author": "闻笛", "press": "启明出版社", "buyPrice": 55.0,
     "rating": 8.3, "ratingCount": 6200, "year": "2025", "info": "闻笛 / 启明出版社",
     "intro": "一位城市规划师用两年时间,记录一条老街从热闹到安静的日常变化。",
     "genres": ["社科", "纪实", "城市"], "presetTags": ["社科", "纪实"],
     "toc": ["清晨", "正午", "黄昏", "深夜"], "ratingDist": DIST(40, 42, 15, 2, 1)},
    {"id": "bk16", "type": "book", "title": "深海邮差", "cover": IMG("subject_bk16", "深海邮差"),
     "author": "[美] 埃拉·蒙罗", "press": "西岭文艺出版社", "buyPrice": 72.0,
     "rating": 8.7, "ratingCount": 28900, "year": "2024", "info": "[美] 埃拉·蒙罗 / 西岭文艺出版社",
     "intro": "近未来的海底城市里,一名邮差负责把最后一批纸质信件送往每一个孤独的舱室。",
     "genres": ["科幻", "外国文学", "反乌托邦"], "presetTags": ["科幻", "外国文学"],
     "toc": ["下潜", "投递", "回信"], "ratingDist": DIST(48, 38, 11, 2, 1)},
    {"id": "bk17", "type": "book", "title": "祖母的菜谱", "cover": IMG("subject_bk17", "祖母菜谱"),
     "author": "苏晚棠", "press": "长风作家出版社", "buyPrice": 48.0,
     "rating": 8.9, "ratingCount": 11400, "year": "2026", "info": "苏晚棠 / 长风作家出版社",
     "intro": "作者从一本泛黄的手写菜谱出发,写下三代女性厨房里的家常与心事。",
     "genres": ["散文", "美食", "女性主义"], "presetTags": ["散文", "美食"],
     "toc": ["春膳", "夏羹", "秋点", "冬藏"], "ratingDist": DIST(54, 34, 9, 2, 1)},
    {"id": "bk18", "type": "book", "title": "无人认领的车站", "cover": IMG("subject_bk18", "车站"),
     "author": "[日] 三上悠介", "press": "北岸文艺出版社", "buyPrice": 50.0,
     "rating": 8.5, "ratingCount": 33200, "year": "2023", "info": "[日] 三上悠介 / 北岸文艺出版社",
     "intro": "一座早已废弃的小站,却总在深夜收到无人认领的行李,站长决定弄清缘由。",
     "genres": ["推理", "日本文学", "悬疑", "外国文学"], "presetTags": ["推理", "日本文学"],
     "toc": ["到站", "遗失", "认领"], "ratingDist": DIST(46, 40, 11, 2, 1)},
    {"id": "bk19", "type": "book", "title": "帝国的边角料", "cover": IMG("subject_bk19", "边角料"),
     "author": "郑怀安", "press": "华夏古籍出版社", "buyPrice": 92.0,
     "rating": 9.1, "ratingCount": 8700, "year": "2024", "info": "郑怀安 / 华夏古籍出版社",
     "intro": "从被正史忽略的账簿、路引与告示出发,拼出一段普通人视角的古代生活史。",
     "genres": ["历史", "社科", "传记"], "presetTags": ["历史", "社科"],
     "toc": ["度量", "赋税", "行路", "市井"], "ratingDist": DIST(58, 32, 8, 1, 1)},
]
extra_music = [
    {"id": "mu10", "type": "music", "title": "晚风编年", "cover": IMG("subject_mu10", "晚风", 300, 300),
     "rating": 8.4, "ratingCount": 9100, "year": "2025", "info": "云杪 / 民谣 / 专辑",
     "artist": "云杪", "intro": "把四季晚风写成十首歌的一张民谣专辑。",
     "genres": ["民谣", "华语", "独立"], "tracks": ["晚风编年", "旧巷", "南墙", "候车", "归途"],
     "presetTags": [], "ratingDist": DIST(50, 34, 12, 3, 1)},
    {"id": "mu11", "type": "music", "title": "纸鸢余音", "cover": IMG("subject_mu11", "纸鸢", 300, 300),
     "rating": 7.9, "ratingCount": 4200, "year": "2026", "info": "Coral Tide / 独立 / 专辑",
     "artist": "Coral Tide", "intro": "轻盈梦幻的独立流行专辑。",
     "genres": ["流行", "独立", "梦幻"], "tracks": ["纸鸢余音", "Slow Tide", "Blue Hour"],
     "presetTags": [], "ratingDist": DIST(36, 40, 18, 4, 2)},
]
extra_podcasts = [
    {"id": "pc7", "type": "podcast", "title": "一周电影闲谈", "cover": IMG("subject_pc7", "影谈", 300, 300),
     "rating": None, "ratingCount": 0, "year": "2026", "info": "散场之后 / 单集",
     "showName": "散场之后", "episodeCount": 128, "durationText": "1小时08分",
     "dateText": "06-27", "guests": ["影迷阿柯"],
     "intro": "这期聊聊本周上映的几部新片,以及为什么好电影越来越难被看见。",
     "genres": ["电影", "文化"],
     "chapters": [
         {"time": "00:00", "title": "开场:本周片单"},
         {"time": "18:00", "title": "推荐与劝退"},
         {"time": "46:00", "title": "听友信箱"},
     ]},
]
movies += extra_movies
tvs += extra_tvs
books += extra_books
music += extra_music
podcasts += extra_podcasts

subjects = movies + tvs + books + music + podcasts

# =============================================================== 条目派生字段(确定性,不用随机)
# 1) wish/doing/done 计数:由 ratingCount 按固定比例派生(评分卡「x人看过 y人在看 z人想看」/
#    图书「x人读过 y人在读 z人想读」);无评分条目用 id 的稳定散列给 wishCount。
# 2) 图书划线价 origPrice:凡有 buyPrice 的图书补 origPrice(恒 > buyPrice)。
# 3) 演职员补全:每部 movie/tv 至少 4 位影人(导演1 + 主演3),全部复用上方虚构影人,
#    字段形状与 SubjectMoviePage 读取的 subject.credits[{name, role, celebrityId}] 完全一致。
_DIRECTORS = [c for c in celebrities if "导演" in c["role"]]
_ACTORS = [c for c in celebrities if "导演" not in c["role"]]
for _i, _s in enumerate(subjects):
    _rcnt = _s.get("ratingCount") or 0
    if _rcnt > 0:
        _s["doneCount"] = _rcnt * 7 // 4
        _s["doingCount"] = _rcnt * 4 // 25
        _s["wishCount"] = _rcnt * 17 // 20
    else:
        _h = sum(ord(_ch) for _ch in _s["id"])
        _s["doneCount"] = 0
        _s["doingCount"] = 0
        _s["wishCount"] = 800 + (_h * 37) % 9000
    if _s["type"] == "book" and _s.get("buyPrice") is not None:
        _s["origPrice"] = float(int(_s["buyPrice"] * 1.35))
    if _s["type"] in ("movie", "tv"):
        _crs = _s.setdefault("credits", [])
        _have = {_c.get("celebrityId") for _c in _crs}
        if not any("导演" in _c["role"] for _c in _crs):
            _d = _DIRECTORS[_i % len(_DIRECTORS)]
            _crs.insert(0, {"name": _d["name"], "role": "导演", "celebrityId": _d["id"]})
            _have.add(_d["id"])
        _n_act = sum(1 for _c in _crs if "导演" not in _c["role"])
        _k = 0
        while _n_act < 3 and _k < len(_ACTORS) * 2:
            _a = _ACTORS[(_i * 3 + _k) % len(_ACTORS)]
            _k += 1
            if _a["id"] in _have:
                continue
            _crs.append({"name": _a["name"], "role": "主演", "celebrityId": _a["id"]})
            _have.add(_a["id"])
            _n_act += 1
        # 影人代表作 works 回填(保持 celebrity → subject 双向可导航)
        for _c in _crs:
            for _cel in celebrities:
                if _cel["id"] == _c.get("celebrityId") and _s["id"] not in _cel["works"]:
                    _cel["works"].append(_s["id"])

# =============================================================== 标记(书影音档案时间线)
marks = [
    {"id": "mk1", "subjectId": "m2", "status": "done", "rating": 3, "tags": ["喜剧"],
     "comment": "贺岁片图一乐。", "createdAt": T(2, 21, 15), "syncToFeed": True},
    {"id": "mk2", "subjectId": "bk1", "status": "done", "rating": 4, "tags": ["文学"],
     "comment": "正义与成长的教科书。", "createdAt": T(5, 20, 2), "syncToFeed": True},
    {"id": "mk3", "subjectId": "bk2", "status": "done", "rating": 4, "tags": ["女性主义"],
     "comment": "", "createdAt": T(8, 19, 40), "syncToFeed": True},
    {"id": "mk4", "subjectId": "m1", "status": "wish", "rating": None, "tags": [],
     "comment": "", "createdAt": T(1, 10, 5), "syncToFeed": True},
    {"id": "mk5", "subjectId": "mu3", "status": "wish", "rating": None, "tags": ["新说唱"],
     "comment": "等正式版。", "createdAt": T(3, 22, 8), "syncToFeed": True},
    {"id": "mk6", "subjectId": "m5", "status": "done", "rating": 5, "tags": [],
     "comment": "", "createdAt": T(30, 12, 0), "syncToFeed": True},
]

# =============================================================== 短评(热门/最新,带IP)
comments = [
    {"id": "c1", "subjectId": "m1", "authorId": "u_lixinyuan", "rating": None,
     "text": "点映场出来,战争戏调度确实生猛,等公映二刷。", "likes": 1204,
     "createdAt": T(2, 20, 10), "ipLocation": "辽宁", "isHot": True},
    {"id": "c2", "subjectId": "m1", "authorId": "u_qiye", "rating": None,
     "text": "群像有点散,但渡江那场戏值回票价。", "likes": 866,
     "createdAt": T(1, 22, 41), "ipLocation": "山东", "isHot": True},
    {"id": "c3", "subjectId": "m1", "authorId": "u_god", "rating": None,
     "text": "期待值拉满,首映礼见。", "likes": 92, "createdAt": T(0, 9, 12),
     "ipLocation": "四川", "isHot": False},
    {"id": "c4", "subjectId": "m2", "authorId": "u_yezi", "rating": 2,
     "text": "毫无灵魂的流水线喜剧。", "likes": 2310, "createdAt": T(40, 18, 0),
     "ipLocation": "广东", "isHot": True},
    {"id": "c5", "subjectId": "m2", "authorId": "u_jiegeng", "rating": 3,
     "text": "春节陪家人看,图个热闹。", "likes": 187, "createdAt": T(20, 21, 30),
     "ipLocation": "浙江", "isHot": False},
    {"id": "c6", "subjectId": "bk1", "authorId": "u_lilith", "rating": 5,
     "text": "每个成年人都该重读一遍的成长小说。", "likes": 3407,
     "createdAt": T(60, 14, 0), "ipLocation": "江西", "isHot": True},
    {"id": "c7", "subjectId": "tv3", "authorId": "u_shan", "rating": 5,
     "text": "第五季依然是电子榨菜天花板。", "likes": 940, "createdAt": T(4, 23, 5),
     "ipLocation": "北京", "isHot": True},
    {"id": "c8", "subjectId": "mu4", "authorId": "u_god", "rating": 4,
     "text": "沈迟的词还是稳。", "likes": 356, "createdAt": T(15, 19, 20),
     "ipLocation": "四川", "isHot": True},
    # ---- §2 扩充短评 ----
    {"id": "c9", "subjectId": "m8", "authorId": "u_beihai", "rating": 4,
     "text": "雾气用得很有心思,结尾那场戏收得漂亮。", "likes": 512,
     "createdAt": T(6, 21, 0), "ipLocation": "山东", "isHot": True},
    {"id": "c10", "subjectId": "m8", "authorId": "u_anke", "rating": 5,
     "text": "近年国产悬疑里少见的克制,推荐。", "likes": 388,
     "createdAt": T(5, 20, 0), "ipLocation": "江苏", "isHot": True},
    {"id": "c11", "subjectId": "bk10", "authorId": "u_anke", "rating": 5,
     "text": "暴风雪山庄的味道很正,诡计不算新但节奏一流。", "likes": 721,
     "createdAt": T(7, 19, 0), "ipLocation": "江苏", "isHot": True},
    {"id": "c12", "subjectId": "bk11", "authorId": "u_beihai", "rating": 4,
     "text": "设定硬核,后半程有点赶,但还是推荐给科幻迷。", "likes": 430,
     "createdAt": T(8, 18, 30), "ipLocation": "山东", "isHot": True},
    {"id": "c13", "subjectId": "bk9", "authorId": "u_mubai", "rating": 4,
     "text": "很安静的一本书,适合下雪天读。", "likes": 210,
     "createdAt": T(9, 20, 0), "ipLocation": "云南", "isHot": False},
    {"id": "c14", "subjectId": "mu7", "authorId": "u_qingzhu", "rating": 5,
     "text": "整张专辑像一次退潮,后劲很大。", "likes": 305,
     "createdAt": T(4, 22, 0), "ipLocation": "福建", "isHot": True},
    {"id": "c15", "subjectId": "tv4", "authorId": "u_lixinyuan", "rating": 5,
     "text": "国产悬疑剧终于有一部不烂尾的了。", "likes": 1560,
     "createdAt": T(3, 21, 30), "ipLocation": "辽宁", "isHot": True},
    {"id": "c16", "subjectId": "tv5", "authorId": "u_tangwei", "rating": 4,
     "text": "深夜看容易饿,但很治愈。", "likes": 288,
     "createdAt": T(2, 23, 10), "ipLocation": "湖南", "isHot": True},
    {"id": "c17", "subjectId": "m10", "authorId": "u_beihai", "rating": 4,
     "text": "太空场景做得很扎实,信号那条线可以再展开。", "likes": 402,
     "createdAt": T(1, 20, 0), "ipLocation": "山东", "isHot": True},
    {"id": "c18", "subjectId": "bk12", "authorId": "u_shiyou", "rating": 5,
     "text": "从一封家书写起,越读越沉,史料扎实。", "likes": 356,
     "createdAt": T(10, 19, 0), "ipLocation": "陕西", "isHot": True},
    {"id": "c19", "subjectId": "bk13", "authorId": "u_mubai", "rating": 4,
     "text": "有几首诗抄下来贴在了墙上。", "likes": 178,
     "createdAt": T(6, 22, 40), "ipLocation": "云南", "isHot": False},
    {"id": "c20", "subjectId": "m9", "authorId": "u_xiaman", "rating": 3,
     "text": "画面很美,故事稍淡,适合安静的午后。", "likes": 96,
     "createdAt": T(5, 21, 0), "ipLocation": "海南", "isHot": False},
]

# =============================================================== 长评(影评/书评)
reviews = [
    {"id": "rv1", "subjectId": "m1", "authorId": "u_wushan", "title": "别急着封神,也别急着扣帽子",
     "text": "看完点映,想聊聊《赤水长歌》的叙事结构问题。导演选择了多线群像的写法,好处是气象开阔,坏处是每条线都浅尝辄止,情感的落点被稀释了。我理解主创想要一幅长卷,但长卷也需要一两个真正立得住的人物做锚点，否则观众只会记住场面，记不住人。(以下省略若干段落)",
     "rating": 1, "useful": 579, "useless": 128, "replyCount": 326,
     "likeCount": 412, "repostCount": 37, "collectCount": 88, "giftCount": 0,
     "createdAt": T(2, 16, 30), "ipLocation": "重庆"},
    {"id": "rv2", "subjectId": "m1", "authorId": "u_lilith", "title": "山河为幕:一次值得尊敬的笨功夫",
     "text": "实景拍摄的诚意写在每一帧里。渡河段落那个长镜头,水声、口令、脚步的节奏被剪得极稳,能感到剧组是真的下过苦功。它也许不完美,但这种老老实实的笨功夫,如今已经不多见了。(以下省略若干段落)",
     "rating": 5, "useful": 346, "useless": 42, "replyCount": 58,
     "likeCount": 290, "repostCount": 21, "collectCount": 66, "giftCount": 0,
     "createdAt": T(1, 21, 18), "ipLocation": "江西"},
    {"id": "rv3", "subjectId": "m2", "authorId": "u_yezi", "title": "当喜剧只剩下配方",
     "text": "从剧本工业的角度拆解这部片为什么不好笑:每个笑点都能被拆成一条公式,可观众早就吃腻了同一份配方。真正的喜剧靠的是意外,而这里没有任何意外。(以下省略若干段落)",
     "rating": 1, "useful": 1893, "useless": 240, "replyCount": 402,
     "likeCount": 1204, "repostCount": 96, "collectCount": 210, "giftCount": 0,
     "createdAt": T(38, 10, 0), "ipLocation": "广东"},
    # ---- §2 扩充长评(原创中性填充)----
    {"id": "rv4", "subjectId": "m8", "authorId": "u_anke", "title": "雾里看人:一部被低估的悬疑片",
     "text": "把一座常年起雾的港口城市当成第二主角,是这部片最聪明的选择。雾遮住的不只是视线,还有每个人的动机。案子本身不算复杂,难得的是它愿意慢下来,让人物先站住,再让真相浮出水面。(以下省略若干段落)",
     "rating": 5, "useful": 640, "useless": 55, "replyCount": 120,
     "likeCount": 480, "repostCount": 30, "collectCount": 96, "giftCount": 0,
     "createdAt": T(5, 15, 0), "ipLocation": "江苏"},
    {"id": "rv5", "subjectId": "bk11", "authorId": "u_beihai", "title": "当信号抵达,我们准备好了吗",
     "text": "作者最打动我的地方,不是那些华丽的太空设定,而是它一直在问一个朴素的问题:如果宇宙真的回应了我们,人类配得上这份回应吗?硬核的部分足够扎实,柔软的部分也没有丢。(以下省略若干段落)",
     "rating": 4, "useful": 420, "useless": 60, "replyCount": 88,
     "likeCount": 360, "repostCount": 22, "collectCount": 70, "giftCount": 0,
     "createdAt": T(8, 14, 0), "ipLocation": "山东"},
    {"id": "rv6", "subjectId": "bk14", "authorId": "u_lilith", "title": "一份迟到的精神谱系",
     "text": "这本书把散落在不同年代的女性写作者放在同一张地图上,你会突然看清,许多今天被当作个人挣扎的东西,其实早有回声。它不提供答案,但它让提问变得更有底气。(以下省略若干段落)",
     "rating": 5, "useful": 560, "useless": 40, "replyCount": 96,
     "likeCount": 500, "repostCount": 45, "collectCount": 130, "giftCount": 0,
     "createdAt": T(9, 16, 0), "ipLocation": "江西"},
    {"id": "rv7", "subjectId": "tv4", "authorId": "u_lixinyuan", "title": "长夜之所以将尽,是因为有人不肯放手",
     "text": "退休刑警重启旧案这个母题并不新鲜,但这部剧胜在人物。它没有把破案拍成智力炫技,而是让每一次接近真相,都伴随一次代价。十六集看下来,竟然舍不得结束。(以下省略若干段落)",
     "rating": 5, "useful": 890, "useless": 70, "replyCount": 210,
     "likeCount": 760, "repostCount": 66, "collectCount": 188, "giftCount": 0,
     "createdAt": T(3, 20, 0), "ipLocation": "辽宁"},
]

# =============================================================== 广播
BC_PHOTO1 = IMG("bc_photo1", "山城夜景", 400, 300)
BC_PHOTO2 = IMG("bc_photo2", "书摘", 400, 300)
BC_PHOTO3 = IMG("bc_photo3", "猫", 400, 300)
BC_PHOTO4 = IMG("bc_photo4", "剧照", 400, 300)
BC_PHOTO5 = IMG("bc_photo5", "奶茶", 400, 300)

broadcasts = [
    {"id": "b_wushan", "authorId": "u_wushan",
     "text": "很毒,很喜欢。\n\n关于「评论区考古学」:我一直觉得,一条广播的生命力不在正文,而在回复区的化学反应。今天翻到三年前自己写的长文,底下的争论比正文精彩十倍……(长文继续)",
     "images": [BC_PHOTO1], "topicId": "tp_kaihuai", "subjectCard": None,
     "likeCount": 190, "repostCount": 12, "collectCount": 18, "replyCount": 25,
     "giftCount": 0, "createdAt": T(1, 8, 33), "ipLocation": "重庆", "views": 23800},
    {"id": "b_lilith", "authorId": "u_lilith",
     "text": "把《她乡纪年》的读书笔记整理进文集了,第二篇谈生育分工的想象。《她乡纪年》",
     "images": [BC_PHOTO2], "topicId": None, "subjectCard": "bk2",
     "likeCount": 45, "repostCount": 6, "collectCount": 9, "replyCount": 9,
     "giftCount": 0, "createdAt": T(2, 20, 2), "ipLocation": "江西", "views": 5600},
    {"id": "b_jinse", "authorId": "u_jinse",
     "text": "今天在旧硬盘里翻到十年前写的观影笔记,那时候的自己下笔又冲又天真,现在读起来居然有点想笑。原来我们都是被自己的旧文档考古着长大的。",
     "images": [BC_PHOTO4], "topicId": "tp_kaihuai", "subjectCard": None,
     "likeCount": 3543, "repostCount": 73, "collectCount": 181, "replyCount": 168,
     "giftCount": 0, "createdAt": T(16, 8, 33), "ipLocation": "辽宁", "views": 2380000},
    {"id": "b_god", "authorId": "u_god",
     "text": "安利一期播客:工牌局《大厂小民》,1小时56分,通勤刚好听完上半场。",
     "images": [], "topicId": None, "subjectCard": "pc1",
     "likeCount": 28, "repostCount": 3, "collectCount": 7, "replyCount": 5,
     "giftCount": 0, "createdAt": T(0, 7, 45), "ipLocation": "四川", "views": 1900},
    {"id": "b_own1", "authorId": SELF_ID,
     "text": "test 发条广播试试水。",
     "images": [], "topicId": "tp_test", "subjectCard": None,
     "likeCount": 1, "repostCount": 0, "collectCount": 0, "replyCount": 2,
     "giftCount": 0, "createdAt": T(3, 12, 10), "ipLocation": "江苏", "views": 45},
    {"id": "b_own2", "authorId": SELF_ID,
     "text": "标记了想看《赤水长歌》,等首映。《赤水长歌》",
     "images": [], "topicId": None, "subjectCard": "m1",
     "likeCount": 0, "repostCount": 0, "collectCount": 0, "replyCount": 0,
     "giftCount": 0, "createdAt": T(1, 10, 6), "ipLocation": "江苏", "views": 12},
    {"id": "b_yezi", "authorId": "u_yezi",
     "text": "今天的奶茶是奶茶小组推荐的隐藏菜单,三分糖去冰,好喝到跺脚。",
     "images": [BC_PHOTO5], "topicId": None, "subjectCard": None,
     "likeCount": 66, "repostCount": 2, "collectCount": 11, "replyCount": 14,
     "giftCount": 0, "createdAt": T(0, 13, 20), "ipLocation": "广东", "views": 4100},
    # ---- §2 扩充广播(友邻 + 自己,均原创中性)----
    {"id": "b_own3", "authorId": SELF_ID,
     "text": "读完《雪落无声的午后》,合上书窗外正好在下雨,气氛刚刚好。《雪落无声的午后》",
     "images": [], "topicId": None, "subjectCard": "bk9",
     "likeCount": 3, "repostCount": 0, "collectCount": 1, "replyCount": 1,
     "giftCount": 0, "createdAt": T(6, 21, 20), "ipLocation": "江苏", "views": 60},
    {"id": "b_own4", "authorId": SELF_ID,
     "text": "把《潮汐手记》单曲循环了一整个下午,推荐给同样想要安静一会儿的人。《潮汐手记》",
     "images": [], "topicId": None, "subjectCard": "mu7",
     "likeCount": 2, "repostCount": 0, "collectCount": 0, "replyCount": 0,
     "giftCount": 0, "createdAt": T(4, 22, 30), "ipLocation": "江苏", "views": 38},
    {"id": "b_mubai", "authorId": "u_mubai",
     "text": "抄了《夜里的向日葵》里的一段,贴在书桌前。有些句子读一遍就想记住。《夜里的向日葵》",
     "images": [BC_PHOTO2], "topicId": None, "subjectCard": "bk13",
     "likeCount": 120, "repostCount": 8, "collectCount": 22, "replyCount": 16,
     "giftCount": 0, "createdAt": T(6, 20, 0), "ipLocation": "云南", "views": 9800},
    {"id": "b_anke", "authorId": "u_anke",
     "text": "本格推理年度私心榜更新:《第十三位客人》暂列第一,暴风雪山庄永不过时。《第十三位客人》",
     "images": [], "topicId": None, "subjectCard": "bk10",
     "likeCount": 340, "repostCount": 20, "collectCount": 88, "replyCount": 41,
     "giftCount": 0, "createdAt": T(7, 19, 30), "ipLocation": "江苏", "views": 21000},
    {"id": "b_beihai", "authorId": "u_beihai",
     "text": "科幻迷的一天:早上看《星海拾遗》,晚上读《群星的低语》,现在满脑子都是深空信号。",
     "images": [BC_PHOTO4], "topicId": "tp_kaihuai", "subjectCard": None,
     "likeCount": 560, "repostCount": 33, "collectCount": 96, "replyCount": 58,
     "giftCount": 0, "createdAt": T(8, 18, 0), "ipLocation": "山东", "views": 44000},
    {"id": "b_qingzhu", "authorId": "u_qingzhu",
     "text": "今晚的 livehouse 全场跟着《旷野回声》大合唱,散场时街上还在下雨,值得。",
     "images": [BC_PHOTO1], "topicId": None, "subjectCard": "mu9",
     "likeCount": 210, "repostCount": 12, "collectCount": 30, "replyCount": 22,
     "giftCount": 0, "createdAt": T(5, 23, 0), "ipLocation": "福建", "views": 15600},
    {"id": "b_tangwei", "authorId": "u_tangwei",
     "text": "跟着《山海食堂》学做了一道深夜面,失败了,但很快乐。厨房与书桌,是我一天里最踏实的两个角落。",
     "images": [BC_PHOTO5], "topicId": None, "subjectCard": "tv5",
     "likeCount": 188, "repostCount": 6, "collectCount": 25, "replyCount": 30,
     "giftCount": 0, "createdAt": T(2, 22, 40), "ipLocation": "湖南", "views": 8300},
    {"id": "b_luli", "authorId": "u_luli",
     "text": "周末去草原走了走,回来发现手机里全是天和云,一张人都没有。",
     "images": [BC_PHOTO3], "topicId": None, "subjectCard": None,
     "likeCount": 96, "repostCount": 2, "collectCount": 8, "replyCount": 12,
     "giftCount": 0, "createdAt": T(3, 16, 0), "ipLocation": "内蒙古", "views": 5200},
    {"id": "b_xiaman", "authorId": "u_xiaman",
     "text": "《暮色渡口》的画面太美了,截了二十张图当壁纸,轮着换。",
     "images": [BC_PHOTO4], "topicId": None, "subjectCard": "m9",
     "likeCount": 142, "repostCount": 5, "collectCount": 18, "replyCount": 9,
     "giftCount": 0, "createdAt": T(5, 20, 30), "ipLocation": "海南", "views": 6700},
    {"id": "b_shiyou", "authorId": "u_shiyou",
     "text": "整理旧信的时候读到《被折叠的历史》,突然更能理解自己家里那些没人讲完的故事了。《被折叠的历史》",
     "images": [], "topicId": None, "subjectCard": "bk12",
     "likeCount": 233, "repostCount": 15, "collectCount": 44, "replyCount": 20,
     "giftCount": 0, "createdAt": T(10, 19, 30), "ipLocation": "陕西", "views": 12800},
    {"id": "b_god2", "authorId": "u_god",
     "text": "深夜歌单又更新了:《午夜霓虹》配上台灯,像坐进了一列开往凌晨的地铁。《午夜霓虹》",
     "images": [], "topicId": None, "subjectCard": "mu8",
     "likeCount": 88, "repostCount": 4, "collectCount": 12, "replyCount": 6,
     "giftCount": 0, "createdAt": T(1, 23, 40), "ipLocation": "四川", "views": 3300},
    {"id": "b_lixinyuan2", "authorId": "u_lixinyuan",
     "text": "一天两部片打卡:《雾港》和《回声之城》。前者靠气氛,后者靠脑洞,都很上头。",
     "images": [], "topicId": "tp_diary", "subjectCard": None,
     "likeCount": 420, "repostCount": 18, "collectCount": 55, "replyCount": 34,
     "giftCount": 0, "createdAt": T(4, 21, 0), "ipLocation": "辽宁", "views": 28000},
    # ---- §2 再补广播(友邻 + 自己)----
    {"id": "b_mubai2", "authorId": "u_mubai",
     "text": "在《祖母的菜谱》里读到一段关于灶台的描写,忽然很想家。有些味道是写不出来的,但作者尽力了。《祖母的菜谱》",
     "images": [], "topicId": None, "subjectCard": "bk17",
     "likeCount": 156, "repostCount": 9, "collectCount": 30, "replyCount": 18,
     "giftCount": 0, "createdAt": T(3, 20, 0), "ipLocation": "云南", "views": 11200},
    {"id": "b_qingzhu2", "authorId": "u_qingzhu",
     "text": "新专辑《晚风编年》循环了一路,适合黄昏的公路。分享给同样喜欢在路上听歌的人。《晚风编年》",
     "images": [], "topicId": None, "subjectCard": "mu10",
     "likeCount": 133, "repostCount": 7, "collectCount": 24, "replyCount": 15,
     "giftCount": 0, "createdAt": T(2, 19, 30), "ipLocation": "福建", "views": 8900},
    {"id": "b_anke2", "authorId": "u_anke",
     "text": "《无人认领的车站》看得我一晚上没敢关灯,叙述性诡计玩得很漂亮,推理迷不要错过。《无人认领的车站》",
     "images": [BC_PHOTO2], "topicId": None, "subjectCard": "bk18",
     "likeCount": 288, "repostCount": 16, "collectCount": 66, "replyCount": 32,
     "giftCount": 0, "createdAt": T(6, 21, 0), "ipLocation": "江苏", "views": 19800},
    {"id": "b_beihai2", "authorId": "u_beihai",
     "text": "《深海邮差》把科幻写得很温柔,原来最孤独的地方也需要有人送信。《深海邮差》",
     "images": [], "topicId": None, "subjectCard": "bk16",
     "likeCount": 210, "repostCount": 12, "collectCount": 48, "replyCount": 20,
     "giftCount": 0, "createdAt": T(5, 20, 0), "ipLocation": "山东", "views": 14300},
    {"id": "b_own5", "authorId": SELF_ID,
     "text": "看完《候鸟旅馆》,很适合下雨天窝在沙发里看的一部片,气氛很松弛。《候鸟旅馆》",
     "images": [], "topicId": "tp_diary", "subjectCard": "m12",
     "likeCount": 4, "repostCount": 0, "collectCount": 1, "replyCount": 0,
     "giftCount": 0, "createdAt": T(2, 21, 0), "ipLocation": "江苏", "views": 52},
    {"id": "b_own6", "authorId": SELF_ID,
     "text": "标记想看《极地厨房》,冲着在极端环境里做饭这个点就很好奇。《极地厨房》",
     "images": [], "topicId": None, "subjectCard": "tv8",
     "likeCount": 2, "repostCount": 0, "collectCount": 0, "replyCount": 1,
     "giftCount": 0, "createdAt": T(1, 12, 0), "ipLocation": "江苏", "views": 33},
]

# =============================================================== 回复(楼中楼/热门/已删除占位)
replies = [
    # 长文 广播
    {"id": "r1", "targetType": "broadcast", "targetId": "b_wushan", "authorId": "u_lixinyuan",
     "text": "回复区化学反应+1,豆瓣最迷人的就是这个。", "images": [], "likeCount": 89,
     "createdAt": T(1, 9, 2), "ipLocation": "辽宁", "quoteReplyId": None, "deleted": False,
     "isHot": True, "authorLiked": True},
    {"id": "r2", "targetType": "broadcast", "targetId": "b_wushan", "authorId": "u_qiye",
     "text": "考古自己的旧帖确实像开盲盒。", "images": [], "likeCount": 41,
     "createdAt": T(1, 9, 30), "ipLocation": "山东", "quoteReplyId": None, "deleted": False,
     "isHot": True},
    {"id": "r3", "targetType": "broadcast", "targetId": "b_wushan", "authorId": "u_jiegeng",
     "text": "所以说删回复区等于删历史(狗头)", "images": [], "likeCount": 12,
     "createdAt": T(1, 10, 15), "ipLocation": "浙江", "quoteReplyId": "r1", "deleted": False},
    {"id": "r4", "targetType": "broadcast", "targetId": "b_wushan", "authorId": "u_wushan",
     "text": "对,而且楼中楼的引用关系本身就是叙事。", "images": [], "likeCount": 30,
     "createdAt": T(1, 11, 0), "ipLocation": "重庆", "quoteReplyId": "r1", "deleted": False,
     "isAuthor": True},
    {"id": "r5", "targetType": "broadcast", "targetId": "b_wushan", "authorId": "u_touming",
     "text": "(已删除的内容)", "images": [], "likeCount": 0,
     "createdAt": T(1, 12, 40), "ipLocation": "日本", "quoteReplyId": None, "deleted": True},
    {"id": "r6", "targetType": "broadcast", "targetId": "b_wushan", "authorId": "u_god",
     "text": "路过学习。", "images": [], "likeCount": 2,
     "createdAt": T(0, 20, 5), "ipLocation": "四川", "quoteReplyId": None, "deleted": False},
    # 自己的 test 广播
    {"id": "r7", "targetType": "broadcast", "targetId": "b_own1", "authorId": "u_shasitian",
     "text": "你好呀~", "images": [], "likeCount": 0,
     "createdAt": T(3, 13, 0), "ipLocation": "河南", "quoteReplyId": None, "deleted": False},
    {"id": "r8", "targetType": "broadcast", "targetId": "b_own1", "authorId": SELF_ID,
     "text": "test 回复。", "images": [], "likeCount": 0,
     "createdAt": T(3, 13, 5), "ipLocation": "江苏", "quoteReplyId": "r7", "deleted": False,
     "isAuthor": True},
    # 小组帖
    {"id": "r9", "targetType": "groupPost", "targetId": "gp_chendanqi", "authorId": "u_yezi",
     "text": "前排,丹姐观察太细了。", "images": [], "likeCount": 55,
     "createdAt": T(2, 14, 20), "ipLocation": "广东", "quoteReplyId": None, "deleted": False,
     "isHot": True, "authorLiked": True},
    {"id": "r10", "targetType": "groupPost", "targetId": "gp_chendanqi", "authorId": "u_jiegeng",
     "text": "同意,这一季嘉宾明显更敢说了。", "images": [], "likeCount": 23,
     "createdAt": T(2, 15, 1), "ipLocation": "浙江", "quoteReplyId": None, "deleted": False},
    {"id": "r11", "targetType": "groupPost", "targetId": "gp_chendanqi", "authorId": "u_chendanqi",
     "text": "楼上说到点子上了,下集见分晓。", "images": [], "likeCount": 40,
     "createdAt": T(2, 16, 45), "ipLocation": "上海", "quoteReplyId": "r10", "deleted": False,
     "isAuthor": True},
    # 影评 rv1
    {"id": "r12", "targetType": "review", "targetId": "rv1", "authorId": "u_lixinyuan",
     "text": "一星是不是过了,论据我认,结论不认。", "images": [], "likeCount": 132,
     "createdAt": T(2, 18, 0), "ipLocation": "辽宁", "quoteReplyId": None, "deleted": False,
     "isHot": True},
    {"id": "r13", "targetType": "review", "targetId": "rv1", "authorId": "u_wushan",
     "text": "打分是态度,文章是论证,分开看。", "images": [], "likeCount": 77,
     "createdAt": T(2, 19, 30), "ipLocation": "重庆", "quoteReplyId": "r12", "deleted": False,
     "isAuthor": True},
    # 条目讨论
    {"id": "r14", "targetType": "discussion", "targetId": "dc1", "authorId": "u_god",
     "text": "点映场的杜比厅效果确实值。", "images": [], "likeCount": 8,
     "createdAt": T(1, 20, 10), "ipLocation": "四川", "quoteReplyId": None, "deleted": False},
]

# =============================================================== 详情互动记录
likes = [
    {"id": "lk1", "targetType": "broadcast", "targetId": "b_wushan", "userId": "u_lixinyuan", "createdAt": T(1, 9, 0)},
    {"id": "lk2", "targetType": "broadcast", "targetId": "b_wushan", "userId": "u_qiye", "createdAt": T(1, 9, 20)},
    {"id": "lk3", "targetType": "broadcast", "targetId": "b_wushan", "userId": "u_jiegeng", "createdAt": T(1, 10, 0)},
    {"id": "lk4", "targetType": "broadcast", "targetId": "b_wushan", "userId": "u_god", "createdAt": T(0, 21, 0)},
    {"id": "lk5", "targetType": "broadcast", "targetId": "b_own1", "userId": "u_shasitian", "createdAt": T(3, 13, 2)},
    {"id": "lk6", "targetType": "review", "targetId": "rv1", "userId": "u_yezi", "createdAt": T(2, 17, 0)},
    {"id": "lk7", "targetType": "groupPost", "targetId": "gp_chendanqi", "userId": "u_yezi", "createdAt": T(2, 14, 30)},
]

reposts = [
    {"id": "rp1", "targetType": "broadcast", "targetId": "b_wushan", "userId": "u_lilith",
     "comment": "回复区社会学,转需。", "createdAt": T(1, 10, 30), "broadcastId": None},
    {"id": "rp2", "targetType": "broadcast", "targetId": "b_wushan", "userId": "u_yezi",
     "comment": "", "createdAt": T(1, 12, 0), "broadcastId": None},
    {"id": "rp3", "targetType": "review", "targetId": "rv1", "userId": "u_qiye",
     "comment": "争议影评,自己判断。", "createdAt": T(2, 20, 0), "broadcastId": None},
]

collects = [
    {"id": "cl1", "targetType": "broadcast", "targetId": "b_wushan", "userId": "u_jiegeng",
     "doulistId": "dl_other", "createdAt": T(1, 11, 30)},
    {"id": "cl2", "targetType": "broadcast", "targetId": "b_jinse", "userId": SELF_ID,
     "doulistId": "dl_new1", "createdAt": T(10, 9, 0)},
]

gifts = []  # qa:Q10 送礼恒「余额不足」,礼物记录保持空(礼物tab显示空态)

# =============================================================== 豆列/收藏
DL_COVER1 = IMG("doulist_new1", "新1", 300, 300)
DL_COVER2 = IMG("doulist_top", "最爱影视", 300, 300)
DL_COVER3 = IMG("doulist_music", "歌单", 300, 300)

doulists = [
    {"id": "dl_new1", "ownerId": SELF_ID, "title": "新1", "cover": DL_COVER1,
     "intro": "随手收藏。", "isPrivate": False, "doneCount": 0, "createdAt": T(30),
     "kindLabel": "豆列",
     "items": [
         {"kind": "broadcast", "refId": "b_jinse"},
         {"kind": "broadcast", "refId": "b_wushan"},
         {"kind": "broadcast", "refId": "b_lilith"},
         {"kind": "groupPost", "refId": "gp_chendanqi"},
         {"kind": "review", "refId": "rv1"},
         {"kind": "subject", "refId": "bk1"},
         {"kind": "subject", "refId": "m4"},
         {"kind": "subject", "refId": "mu4"},
         {"kind": "broadcast", "refId": "b_yezi"},
     ]},
    {"id": "dl_top10", "ownerId": SELF_ID, "title": "我最爱的影视", "cover": DL_COVER2,
     "intro": "TOP10 素材源。", "isPrivate": False, "doneCount": 3, "createdAt": T(12),
     "kindLabel": "片单",
     "items": [
         {"kind": "subject", "refId": "m5"},
         {"kind": "subject", "refId": "m6"},
         {"kind": "subject", "refId": "m7"},
     ]},
    {"id": "dl_music", "ownerId": SELF_ID, "title": "深夜循环歌单", "cover": DL_COVER3,
     "intro": "耳朵怀孕系列。", "isPrivate": False, "doneCount": 0, "createdAt": T(8),
     "kindLabel": "豆列",
     "items": [
         {"kind": "subject", "refId": "mu1"},
         {"kind": "subject", "refId": "mu6"},
     ]},
    {"id": "dl_other", "ownerId": "u_jiegeng", "title": "值得反复读的帖子", "cover": "",
     "intro": "", "isPrivate": False, "doneCount": 0, "createdAt": T(50),
     "kindLabel": "豆列", "items": [{"kind": "broadcast", "refId": "b_wushan"}]},
    {"id": "dl_rank_global_tv", "ownerId": "u_official", "title": "全球口碑剧集榜", "cover": "",
     "intro": "每周更新。", "isPrivate": False, "doneCount": 1, "createdAt": T(90),
     "kindLabel": "榜单",
     "items": [
         {"kind": "subject", "refId": "tv3"},
         {"kind": "subject", "refId": "tv2"},
     ]},
]

# 我的收藏 23 条(内容9 / 影视7 / 图书4 / 音乐3)
_coll_content = [("broadcast", "b_jinse"), ("broadcast", "b_wushan"), ("broadcast", "b_lilith"),
                 ("broadcast", "b_yezi"), ("broadcast", "b_god"), ("groupPost", "gp_chendanqi"),
                 ("groupPost", "gp_danjie"), ("review", "rv1"), ("review", "rv3")]
_coll_movie = ["m1", "m4", "m5", "m6", "m7", "tv2", "tv3"]
_coll_book = ["bk1", "bk2", "bk4", "bk5"]
_coll_music = ["mu1", "mu3", "mu4"]
collections = (
    [{"id": f"cn_c{i+1}", "kind": "content", "refType": rt, "refId": rid, "createdAt": T(10 + i)}
     for i, (rt, rid) in enumerate(_coll_content)]
    + [{"id": f"cn_m{i+1}", "kind": "movie", "refType": "subject", "refId": rid, "createdAt": T(20 + i)}
       for i, rid in enumerate(_coll_movie)]
    + [{"id": f"cn_b{i+1}", "kind": "book", "refType": "subject", "refId": rid, "createdAt": T(28 + i)}
       for i, rid in enumerate(_coll_book)]
    + [{"id": f"cn_mu{i+1}", "kind": "music", "refType": "subject", "refId": rid, "createdAt": T(33 + i)}
       for i, rid in enumerate(_coll_music)]
)

# =============================================================== 小组
# 入组答题(题面与选项均为虚构剧目/虚构演员)
HANJU_QUIZ = [
    {"question": "《回到那年夏天》中,女主角最终和谁在一起?",
     "options": ["阿川", "小泽", "书宇", "东临"], "answer": 1},
    {"question": "「炸鸡配啤酒」这个梗出自本组常聊的哪部剧?",
     "options": ["来自远方的你", "阳光下的我们", "守夜人", "迫降之恋"], "answer": 0},
    {"question": "以下哪部不是「银河剧场」出品?",
     "options": ["机智的病房", "暗号", "我的解压日志", "边境王国"], "answer": 3},
    {"question": "《暗夜之光》的女主角由哪位虚构演员出演?",
     "options": ["宋乔乔", "全知妍", "金太熙", "孙艺荷"], "answer": 0},
    {"question": "小组规则:剧透内容应该?",
     "options": ["直接发标题", "标注剧透预警并折叠", "无所谓", "私信组长"], "answer": 1},
]

groups = [
    {"id": "g_banshu", "memberNoun": "观察员", "name": "微光恋综观察室", "icon": IMG("group_banshu", "微光", 200, 200),
     "members": 76113, "desc": "聊聊微光恋综里的心动瞬间,观察员上线。",
     "rules": "1. 友善讨论,不上升嘉宾;2. 剧透加预警;3. 二创注明出处。",
     "joinType": "direct", "joined": True, "applyStatus": "none", "followed": False,
     "themeColor": "#E8702A", "tabs": ["半糖嗑🍭", "半糖侦😼", "玩游戏🎮", "第五季"],
     "quizAttempts": 0},
    {"id": "g_eve", "memberNoun": "夜航员", "name": "谜案拼图社", "icon": IMG("group_eve", "谜案", 200, 200),
     "members": 21490, "desc": "悬疑追凶剧迷据点。",
     "rules": "1. 讨论区分季标注;2. 同人文发指定板块。",
     "joinType": "direct", "joined": True, "applyStatus": "none", "followed": False,
     "themeColor": "#8A6244", "tabs": ["剧情", "同人", "考古", "周边", "闲聊"],
     "quizAttempts": 0},
    {"id": "g_hanju", "memberNoun": "追更人", "name": "韩剧", "icon": IMG("group_hanju", "韩剧", 200, 200),
     "members": 460271, "desc": "韩剧同好大本营,新剧资讯/理性讨论。",
     "rules": "1. 入组需通过答题;2. 剧透预警;3. 禁站内引战。",
     "joinType": "quiz", "joined": False, "applyStatus": "none", "followed": False,
     "themeColor": "#C93B3B", "tabs": ["追剧", "资讯", "数据", "演员", "理讨"],
     "quiz": HANJU_QUIZ, "quizAttempts": 0},
    {"id": "g_naicha", "memberNoun": "品鉴员", "name": "豆瓣奶茶", "icon": IMG("group_naicha", "奶茶", 200, 200),
     "members": 157754, "desc": "全国奶茶雷达,隐藏菜单交流。",
     "rules": "1. 探店帖带城市 tag;2. 禁广告。",
     "joinType": "direct", "joined": True, "applyStatus": "none", "followed": False,
     "themeColor": "#E0608A", "tabs": ["探店", "自制", "避雷"], "quizAttempts": 0},
    {"id": "g_yuehou", "memberNoun": "过路人", "name": "阅后即焚", "icon": IMG("group_yuehou", "即焚", 200, 200),
     "members": 15973, "desc": "写下想说的,看过就忘。",
     "rules": "1. 不截图外传;2. 不评判他人。",
     "joinType": "direct", "joined": True, "applyStatus": "none", "followed": False,
     "themeColor": "#7A6BD6", "tabs": [], "quizAttempts": 0},
    {"id": "g_xiaoyuzhou", "memberNoun": "收听员", "name": "小宇宙播客", "icon": IMG("group_xyz", "播客", 200, 200),
     "members": 7975, "desc": "播客安利与自制交流。",
     "rules": "1. 安利帖附单集链接;2. 自制帖标注设备。",
     "joinType": "direct", "joined": True, "applyStatus": "none", "followed": False,
     "themeColor": "#3E7BF2", "tabs": ["安利", "自制"], "quizAttempts": 0},
    {"id": "g_agatha", "memberNoun": "拼图侠", "name": "古典推理研习社", "icon": IMG("group_agatha", "推理", 200, 200),
     "members": 2145, "desc": "古典本格推理宇宙研究所。",
     "rules": "1. 谜底折叠;2. 书影版本注明。",
     "joinType": "direct", "joined": False, "applyStatus": "none", "followed": True,
     "themeColor": "#2FA39A", "tabs": ["书讨", "影视化"], "quizAttempts": 0},
    {"id": "g_body", "memberNoun": "同行者", "name": "正视我们的身体", "icon": IMG("group_body", "身体", 200, 200),
     "members": 6735, "desc": "身体议题互助讨论,申请制入组。",
     "rules": "1. 尊重隐私;2. 申请需填写理由,审核后进组。",
     "joinType": "apply", "joined": False, "applyStatus": "none", "followed": False,
     "themeColor": "#3F5E9E", "tabs": ["互助", "科普"], "quizAttempts": 0},
]

groupPosts = [
    {"id": "gp_chendanqi", "groupId": "g_banshu", "tab": "第五季", "authorId": "u_chendanqi",
     "title": "E03观察:两位嘉宾的微表情说明了一切",
     "content": "逐帧看了今晚更新,第14分钟递水那一下,眼神躲闪+嘴角上扬,信息量巨大……",
     "images": [], "replyCount": 65, "likeCount": 233, "repostCount": 8,
     "collectCount": 41, "giftCount": 0, "createdAt": T(2, 13, 50), "updatedAt": T(0, 22, 10),
     "pinned": False, "digest": True},
    {"id": "gp_danjie", "groupId": "g_banshu", "tab": "半糖嗑🍭", "authorId": "u_chendanqi",
     "title": "丹姐五连问:你们磕的到底是哪一对?",
     "content": "1. 初印象CP还坚挺吗?2. 黑马是谁?3. 意难平?4. 下期预测?5. 本季BE美学担当?",
     "images": [], "replyCount": 128, "likeCount": 190, "repostCount": 5,
     "collectCount": 22, "giftCount": 0, "createdAt": T(5, 20, 0), "updatedAt": T(1, 9, 0),
     "pinned": False, "digest": False},
    {"id": "gp_zuwu", "groupId": "g_banshu", "tab": "", "authorId": "u_chendanqi",
     "title": "【组务】第五季分区已开,发帖规范看这里",
     "content": "第五季相关讨论请发「第五季」分区;剧透预警格式:【剧透】+折叠……",
     "images": [], "replyCount": 915, "likeCount": 402, "repostCount": 2,
     "collectCount": 130, "giftCount": 0, "createdAt": T(20, 10, 0), "updatedAt": T(0, 8, 0),
     "pinned": True, "digest": False},
    {"id": "gp_eve1", "groupId": "g_eve", "tab": "考古", "authorId": "u_qiye",
     "title": "重看S1E5:小V的西装线索",
     "content": "服装组的细节控程度令人发指,这套西装在S3还出现过一次……",
     "images": [], "replyCount": 34, "likeCount": 88, "repostCount": 1,
     "collectCount": 12, "giftCount": 0, "createdAt": T(6, 21, 30), "updatedAt": T(4, 10, 0),
     "pinned": False, "digest": False},
    {"id": "gp_naicha1", "groupId": "g_naicha", "tab": "探店", "authorId": "u_yezi",
     "title": "【广州】老城区宝藏柠檬茶合集(附隐藏点法)",
     "content": "跑了两周整理的清单,第3家的鸭屎香柠檬茶记得加冰博克……",
     "images": [BC_PHOTO5], "replyCount": 52, "likeCount": 140, "repostCount": 4,
     "collectCount": 66, "giftCount": 0, "createdAt": T(3, 15, 0), "updatedAt": T(1, 12, 0),
     "pinned": False, "digest": True},
    {"id": "gp_xyz1", "groupId": "g_xiaoyuzhou", "tab": "安利", "authorId": "u_god",
     "title": "本周安利:工牌局《大厂小民》",
     "content": "章节做得很细,通勤党友好,时间轴见楼下。",
     "images": [], "replyCount": 9, "likeCount": 21, "repostCount": 0,
     "collectCount": 5, "giftCount": 0, "createdAt": T(1, 19, 0), "updatedAt": T(0, 9, 30),
     "pinned": False, "digest": False},
    # ---- §2 扩充小组帖(全部原创中性)----
    {"id": "gp_banshu2", "groupId": "g_banshu", "tab": "半糖侦😼", "authorId": "u_xiaman",
     "title": "预测一下本季最后在一起的会是哪几对",
     "content": "凭直觉盲猜,欢迎大家来对赌,下期揭晓看谁猜得准。",
     "images": [], "replyCount": 88, "likeCount": 120, "repostCount": 3,
     "collectCount": 14, "giftCount": 0, "createdAt": T(3, 21, 0), "updatedAt": T(1, 10, 0),
     "pinned": False, "digest": False},
    {"id": "gp_banshu3", "groupId": "g_banshu", "tab": "玩游戏🎮", "authorId": "u_tangwei",
     "title": "用一句话形容你追这档节目的心情",
     "content": "我先来:又想磕又怕被虐,每周准时上线自讨苦吃。",
     "images": [], "replyCount": 156, "likeCount": 98, "repostCount": 1,
     "collectCount": 6, "giftCount": 0, "createdAt": T(4, 20, 30), "updatedAt": T(0, 22, 0),
     "pinned": False, "digest": False},
    {"id": "gp_eve2", "groupId": "g_eve", "tab": "同人", "authorId": "u_jinse",
     "title": "写了一篇平行时空的短篇,求轻拍",
     "content": "第一次在组里发同人,设定是两人在另一种人生里做了邻居,欢迎提意见。",
     "images": [], "replyCount": 22, "likeCount": 66, "repostCount": 2,
     "collectCount": 18, "giftCount": 0, "createdAt": T(5, 22, 0), "updatedAt": T(2, 11, 0),
     "pinned": False, "digest": False},
    {"id": "gp_eve3", "groupId": "g_eve", "tab": "闲聊", "authorId": "u_luli",
     "title": "重刷第几遍了报个数",
     "content": "又双叒开始从头看了,每次都能发现新的小细节,你们呢?",
     "images": [], "replyCount": 74, "likeCount": 52, "repostCount": 0,
     "collectCount": 3, "giftCount": 0, "createdAt": T(6, 19, 0), "updatedAt": T(1, 9, 0),
     "pinned": False, "digest": False},
    {"id": "gp_hanju1", "groupId": "g_hanju", "tab": "追剧", "authorId": "u_xiaman",
     "title": "最近有什么下饭又不费脑的剧推荐吗",
     "content": "想找一部轻松点的,睡前看两集刚好,谢谢各位。",
     "images": [], "replyCount": 133, "likeCount": 88, "repostCount": 4,
     "collectCount": 30, "giftCount": 0, "createdAt": T(2, 21, 30), "updatedAt": T(0, 20, 0),
     "pinned": False, "digest": True},
    {"id": "gp_hanju2", "groupId": "g_hanju", "tab": "理讨", "authorId": "u_lixinyuan",
     "title": "聊聊为什么很多剧后半程会崩",
     "content": "个人感觉多半是节奏问题,想听听大家从编剧角度的看法。",
     "images": [], "replyCount": 210, "likeCount": 176, "repostCount": 9,
     "collectCount": 45, "giftCount": 0, "createdAt": T(7, 20, 0), "updatedAt": T(1, 12, 0),
     "pinned": False, "digest": True},
    {"id": "gp_naicha2", "groupId": "g_naicha", "tab": "自制", "authorId": "u_tangwei",
     "title": "在家复刻招牌奶茶的踩坑记录",
     "content": "试了三次终于比较接近了,配方和比例整理在楼下,欢迎交流。",
     "images": [BC_PHOTO5], "replyCount": 41, "likeCount": 96, "repostCount": 3,
     "collectCount": 52, "giftCount": 0, "createdAt": T(4, 15, 0), "updatedAt": T(1, 10, 0),
     "pinned": False, "digest": False},
    {"id": "gp_naicha3", "groupId": "g_naicha", "tab": "避雷", "authorId": "u_yezi",
     "title": "这家的新品真的一般,慎入",
     "content": "冲着联名去的,结果甜到发齁,分享给大家避个雷。",
     "images": [], "replyCount": 63, "likeCount": 71, "repostCount": 1,
     "collectCount": 8, "giftCount": 0, "createdAt": T(3, 16, 30), "updatedAt": T(0, 21, 0),
     "pinned": False, "digest": False},
    {"id": "gp_yuehou1", "groupId": "g_yuehou", "tab": "", "authorId": "u_mubai",
     "title": "今天想说的一句话",
     "content": "有些心事写下来就轻了,看过就好,不必回复。",
     "images": [], "replyCount": 12, "likeCount": 33, "repostCount": 0,
     "collectCount": 2, "giftCount": 0, "createdAt": T(2, 23, 0), "updatedAt": T(2, 23, 0),
     "pinned": False, "digest": False},
    {"id": "gp_yuehou2", "groupId": "g_yuehou", "tab": "", "authorId": "u_qingzhu",
     "title": "记一件小事",
     "content": "今天路过菜市场,听见有人在哼一首很老的歌,忽然就觉得日子还行。",
     "images": [], "replyCount": 8, "likeCount": 27, "repostCount": 0,
     "collectCount": 1, "giftCount": 0, "createdAt": T(5, 22, 30), "updatedAt": T(5, 22, 30),
     "pinned": False, "digest": False},
    {"id": "gp_xyz2", "groupId": "g_xiaoyuzhou", "tab": "自制", "authorId": "u_qingzhu",
     "title": "我们几个做了一档聊民谣的播客",
     "content": "刚起步,录音设备很简陋,但聊得很开心,欢迎来提建议。",
     "images": [], "replyCount": 15, "likeCount": 40, "repostCount": 2,
     "collectCount": 11, "giftCount": 0, "createdAt": T(6, 20, 0), "updatedAt": T(1, 11, 0),
     "pinned": False, "digest": False},
    {"id": "gp_agatha1", "groupId": "g_agatha", "tab": "书讨", "authorId": "u_anke",
     "title": "谁能替我理一理封闭空间诡计的类型",
     "content": "最近连着读了几本暴风雪山庄题材,想系统整理一下手法,求同好补充。",
     "images": [], "replyCount": 96, "likeCount": 132, "repostCount": 6,
     "collectCount": 60, "giftCount": 0, "createdAt": T(8, 19, 0), "updatedAt": T(2, 10, 0),
     "pinned": False, "digest": True},
    {"id": "gp_agatha2", "groupId": "g_agatha", "tab": "影视化", "authorId": "u_jinse",
     "title": "你觉得哪种改编最难还原原著气质",
     "content": "个人觉得是叙述性诡计那一类,一旦影像化就很容易露馅,你们怎么看?",
     "images": [], "replyCount": 58, "likeCount": 77, "repostCount": 3,
     "collectCount": 24, "giftCount": 0, "createdAt": T(9, 18, 0), "updatedAt": T(2, 12, 0),
     "pinned": False, "digest": False},
    {"id": "gp_body1", "groupId": "g_body", "tab": "科普", "authorId": "u_mubai",
     "title": "整理了一份常见误区清单",
     "content": "把平时容易被搞混的几个概念列了出来,欢迎理性讨论和补充。",
     "images": [], "replyCount": 30, "likeCount": 88, "repostCount": 5,
     "collectCount": 40, "giftCount": 0, "createdAt": T(10, 20, 0), "updatedAt": T(3, 10, 0),
     "pinned": False, "digest": False},
]

discussions = [
    {"id": "dc1", "subjectId": "m1", "authorId": "u_lixinyuan",
     "title": "点映场观感汇总(无剧透)",
     "content": "整理了各地点映场的第一波反馈,声效和摄影是共识优点……",
     "replyCount": 12, "likeCount": 45, "repostCount": 2, "collectCount": 8,
     "giftCount": 0, "createdAt": T(1, 18, 30)},
    {"id": "dc2", "subjectId": "tv1", "authorId": "u_chendanqi",
     "title": "第五季嘉宾资料楼",
     "content": "汇总本季嘉宾公开资料,持续更新。",
     "replyCount": 40, "likeCount": 90, "repostCount": 3, "collectCount": 30,
     "giftCount": 0, "createdAt": T(4, 12, 0)},
]

# =============================================================== 话题/文集/TOP10/榜单
topics = [
    {"id": "tp_test", "name": "test", "views": 1693, "postCount": 21, "desc": "测试话题。"},
    {"id": "tp_nvxiaozhang", "name": "百年前被文学暴力杀死的大学女校长", "views": 859000,
     "postCount": 859, "desc": "一段被重新打捞的历史。"},
    {"id": "tp_kaihuai", "name": "最近一次开怀大笑是因为什么?", "views": 2380000,
     "postCount": 4021, "desc": "收集一切触动过你的评论。"},
    {"id": "tp_diary", "name": "电影日记", "views": 5210000, "postCount": 88000,
     "desc": "记录每一次观影。"},
]

essaySets = [
    {"id": "es_lilith", "ownerId": "u_lilith", "title": "女性主义",
     "cover": IMG("essayset_lilith", "文集", 300, 200),
     "articles": [
         {"title": "从《她乡纪年》谈生育分工的想象", "date": "06-19"},
         {"title": "重读《她们如何书写》:被折叠的声音", "date": "05-02"},
     ]},
]

top10s = [
    {"id": "top10_me_movie", "ownerId": SELF_ID, "kind": "movie",
     "title": "我的影视 TOP10", "subjectIds": ["m5", "m6", "m7"]},
    {"id": "top10_shan_movie", "ownerId": "u_shan", "kind": "movie",
     "title": "影视 TOP10", "subjectIds": ["m7", "m4", "m6", "m5"]},
    {"id": "top10_shan_book", "ownerId": "u_shan", "kind": "book",
     "title": "图书 TOP10", "subjectIds": ["bk4", "bk6", "bk1"]},
    {"id": "top10_shan_music", "ownerId": "u_shan", "kind": "music",
     "title": "音乐 TOP10", "subjectIds": ["mu4", "mu1", "mu6"]},
]

rankings = [
    {"id": "rank_book_monthly", "title": "每月热门图书榜", "subtitle": "每月1日更新",
     "kind": "book",
     "items": [{"subjectId": "bk8", "note": "新上榜"}, {"subjectId": "bk2", "note": "↑2"},
               {"subjectId": "bk7", "note": "—"}, {"subjectId": "bk1", "note": "↓1"},
               {"subjectId": "bk5", "note": "—"}]},
    {"id": "rank_music_hot", "title": "热门单曲榜", "subtitle": "TOP 30 · 每周四更新",
     "kind": "music",
     "items": [{"subjectId": "mu1", "note": "NO.1"}, {"subjectId": "mu5", "note": "NO.2"},
               {"subjectId": "mu2", "note": "NO.3"}, {"subjectId": "mu4", "note": "NO.4"},
               {"subjectId": "mu3", "note": "新上榜"}]},
    {"id": "rank_top250", "title": "豆瓣电影 Top250", "subtitle": "豆瓣榜单",
     "kind": "movie",
     "items": [{"subjectId": "m5", "note": "No.12"}, {"subjectId": "m6", "note": "No.38"},
               {"subjectId": "m7", "note": "No.71"}, {"subjectId": "m4", "note": "No.109"}]},
    {"id": "rank_cn_tv", "title": "华语口碑剧集榜", "subtitle": "每周更新",
     "kind": "tv",
     "items": [{"subjectId": "tv2", "note": "NO.1"}, {"subjectId": "tv1", "note": "NO.5"}]},
    {"id": "rank_global_tv", "title": "全球口碑剧集榜", "subtitle": "每周更新",
     "kind": "tv",
     "items": [{"subjectId": "tv3", "note": "NO.1"}, {"subjectId": "tv2", "note": "NO.7"}]},
]

# =============================================================== 关注关系/消息
follows = {
    "users": ["u_shasitian", "u_lilith", "u_lixinyuan", "u_jiegeng", "u_shan", "u_yezi", "u_qiye"],
    "celebrities": ["cel_liuye"],
    "topics": ["tp_test", "tp_nvxiaozhang"],
    "doulists": ["dl_rank_global_tv"],
}
followers = ["u_lixinyuan"]  # 互相关注

# 提醒点击跳转:like/reply 带 targetType/targetId(→广播详情,默认落回复tab),reply 另带 replyId(那一楼);
# follow 用 userId(→他人主页);system 无跳转。targetId/replyId 均指向真实存在的 seed 记录。
notifications = [
    {"id": "n1", "kind": "follow", "text": "林洄野 关注了你", "userId": "u_lixinyuan",
     "createdAt": T(2, 9, 10), "read": False},
    {"id": "n2", "kind": "like", "text": "甜筒不加糖 赞了你的广播「test 发条广播试试水。」",
     "userId": "u_shasitian", "targetType": "broadcast", "targetId": "b_own1", "createdAt": T(3, 13, 2), "read": False},
    {"id": "n3", "kind": "reply", "text": "甜筒不加糖 回复了你的广播:你好呀~",
     "userId": "u_shasitian", "targetType": "broadcast", "targetId": "b_own1", "replyId": "r7", "createdAt": T(3, 13, 0), "read": True},
    {"id": "n4", "kind": "system", "text": "欢迎来到豆瓣,完善资料让友邻更了解你",
     "createdAt": T(15, 8, 0), "read": True},
    # ---- §2 扩充提醒 ----
    {"id": "n5", "kind": "like", "text": "北海有鲸 赞了你的广播「读完《雪落无声的午后》……」",
     "userId": "u_beihai", "targetType": "broadcast", "targetId": "b_own2", "createdAt": T(6, 21, 30), "read": False},
    {"id": "n6", "kind": "follow", "text": "沐白读诗 关注了你", "userId": "u_mubai",
     "createdAt": T(6, 20, 10), "read": True},
    {"id": "n7", "kind": "reply", "text": "暗刻推理社 回复了你的广播:同好握手~",
     "userId": "u_anke", "targetType": "broadcast", "targetId": "b_own5", "replyId": "grp_159", "createdAt": T(7, 19, 40), "read": True},
]

messages = [
    {"id": "msg1", "peerId": "u_shasitian", "fromSelf": False, "text": "在吗?",
     "createdAt": T(3, 13, 10)},
    {"id": "msg2", "peerId": "u_shasitian", "fromSelf": True, "text": "你好呀~",
     "createdAt": T(3, 13, 12)},
    {"id": "msg3", "peerId": "u_shasitian", "fromSelf": False, "text": "好的。",
     "createdAt": T(3, 13, 15)},
]

# =============================================================== 市集
products = [
    {"id": "pd_nightlight", "title": "童话小夜灯·蘑菇森林", "cover": IMG("product_nightlight", "小夜灯", 300, 300),
     "images": [IMG("product_nightlight", "小夜灯", 300, 300),
                IMG("product_nightlight_g2", "小夜灯2", 300, 300),
                IMG("product_nightlight_g3", "小夜灯3", 300, 300),
                IMG("product_nightlight_g4", "小夜灯4", 300, 300),
                IMG("product_nightlight_g5", "小夜灯5", 300, 300),
                IMG("product_nightlight_g6", "小夜灯6", 300, 300),
                IMG("product_nightlight_g7", "小夜灯7", 300, 300),
                IMG("product_nightlight_g8", "小夜灯8", 300, 300)],
     "price": 68.0, "origPrice": 88.0, "shop": "豆瓣豆品", "freight": 0,
     "skuOptions": [{"name": "款式", "values": ["蘑菇", "月亮", "星星"]}],
     "soldText": "459769人在逛", "tag": "限时立减", "category": "家居生活",
     "buyerBroadcastIds": ["b_yezi"]},
    {"id": "pd_pen", "title": "金属中性笔·三色套装", "cover": IMG("product_pen", "中性笔", 300, 300),
     "images": [IMG("product_pen", "中性笔", 300, 300)],
     "price": 39.0, "origPrice": None, "shop": "豆瓣豆品", "freight": 5,
     "skuOptions": [{"name": "颜色", "values": ["蓝", "白", "绿"]}],
     "soldText": "1.2万人已买", "tag": "", "category": "文具纸品",
     "buyerBroadcastIds": []},
    {"id": "pd_tshirt", "title": "「旷野与她」主题T恤", "cover": IMG("product_tshirt", "T恤", 300, 300),
     "images": [IMG("product_tshirt", "T恤", 300, 300)],
     "price": 78.0, "origPrice": 98.0, "shop": "豆瓣豆品", "freight": 0,
     "skuOptions": [{"name": "尺码", "values": ["S", "M", "L", "XL"]}],
     "soldText": "459769人在逛", "tag": "限时", "category": "服饰",
     "buyerBroadcastIds": []},
    {"id": "pd_stamp", "title": "六联印章·光敏套组", "cover": IMG("product_stamp", "印章", 300, 300),
     "images": [IMG("product_stamp", "印章", 300, 300)],
     "price": 25.0, "origPrice": 35.0, "shop": "豆瓣豆品", "freight": 5,
     "skuOptions": [{"name": "款式", "values": ["书影音", "猫咪"]}],
     "soldText": "8600人已买", "tag": "限时立减", "category": "文具纸品",
     "buyerBroadcastIds": []},
    {"id": "pd_badge", "title": "面包玫瑰·金属徽章", "cover": IMG("product_badge", "徽章", 300, 300),
     "images": [IMG("product_badge", "徽章", 300, 300)],
     "price": 28.0, "origPrice": None, "shop": "豆瓣豆品", "freight": 5,
     "skuOptions": [{"name": "款式", "values": ["面包", "玫瑰"]}],
     "soldText": "5300人已买", "tag": "", "category": "豆瓣经典",
     "buyerBroadcastIds": []},
    {"id": "pd_bag", "title": "豆瓣书店·帆布包", "cover": IMG("product_bag", "帆布包", 300, 300),
     "images": [IMG("product_bag", "帆布包", 300, 300)],
     "price": 98.0, "origPrice": None, "shop": "豆瓣豆品", "freight": 0,
     "skuOptions": [{"name": "颜色", "values": ["米白", "墨绿"]}],
     "soldText": "2.3万人已买", "tag": "经典", "category": "豆瓣经典",
     "buyerBroadcastIds": []},
    {"id": "pd_necklace", "title": "戏剧面具·银色项链", "cover": IMG("product_necklace", "项链", 300, 300),
     "images": [IMG("product_necklace", "项链", 300, 300)],
     "price": 89.0, "origPrice": 109.0, "shop": "豆瓣豆品", "freight": 0,
     "skuOptions": [{"name": "款式", "values": ["喜剧", "悲剧"]}],
     "soldText": "1900人已买", "tag": "限时", "category": "服饰",
     "buyerBroadcastIds": []},
    {"id": "pd_mug", "title": "「我们的精神角落」马克杯", "cover": IMG("product_mug", "马克杯", 300, 300),
     "images": [IMG("product_mug", "马克杯", 300, 300)],
     "price": 38.0, "origPrice": None, "shop": "豆瓣豆品", "freight": 5,
     "skuOptions": [{"name": "颜色", "values": ["白", "豆绿"]}],
     "soldText": "9800人已买", "tag": "", "category": "家居生活",
     "buyerBroadcastIds": []},
    # ---- §2 扩充市集商品(均虚构)----
    {"id": "pd_notebook", "title": "书影音手账·线装本", "cover": IMG("product_notebook", "手账", 300, 300),
     "images": [IMG("product_notebook", "手账", 300, 300)],
     "price": 45.0, "origPrice": 58.0, "shop": "豆瓣豆品", "freight": 5,
     "skuOptions": [{"name": "内页", "values": ["空白", "方格", "横线"]}],
     "soldText": "1.5万人已买", "tag": "限时立减", "category": "文具纸品",
     "buyerBroadcastIds": []},
    {"id": "pd_tote2", "title": "旷野巡演·限定托特包", "cover": IMG("product_tote2", "托特包", 300, 300),
     "images": [IMG("product_tote2", "托特包", 300, 300)],
     "price": 88.0, "origPrice": None, "shop": "豆瓣豆品", "freight": 0,
     "skuOptions": [{"name": "颜色", "values": ["原色", "藏青"]}],
     "soldText": "3200人已买", "tag": "", "category": "服饰",
     "buyerBroadcastIds": ["b_qingzhu"]},
    {"id": "pd_poster", "title": "《雾港》概念海报·裱框版", "cover": IMG("product_poster", "海报", 300, 300),
     "images": [IMG("product_poster", "海报", 300, 300)],
     "price": 128.0, "origPrice": 168.0, "shop": "豆瓣豆品", "freight": 0,
     "skuOptions": [{"name": "尺寸", "values": ["A3", "A2"]}],
     "soldText": "760人已买", "tag": "限时", "category": "家居生活",
     "buyerBroadcastIds": []},
    {"id": "pd_bookmark", "title": "黄铜书签·星海系列", "cover": IMG("product_bookmark", "书签", 300, 300),
     "images": [IMG("product_bookmark", "书签", 300, 300)],
     "price": 22.0, "origPrice": None, "shop": "豆瓣豆品", "freight": 5,
     "skuOptions": [{"name": "款式", "values": ["行星", "流星", "月相"]}],
     "soldText": "6400人已买", "tag": "", "category": "文具纸品",
     "buyerBroadcastIds": []},
    {"id": "pd_candle", "title": "旧书香氛蜡烛·图书馆", "cover": IMG("product_candle", "香薰", 300, 300),
     "images": [IMG("product_candle", "香薰", 300, 300)],
     "price": 69.0, "origPrice": 89.0, "shop": "豆瓣豆品", "freight": 0,
     "skuOptions": [{"name": "香型", "values": ["旧书", "雨后", "松木"]}],
     "soldText": "4100人已买", "tag": "限时立减", "category": "家居生活",
     "buyerBroadcastIds": []},
    {"id": "pd_socks", "title": "电影胶片·中筒袜三双装", "cover": IMG("product_socks", "袜子", 300, 300),
     "images": [IMG("product_socks", "袜子", 300, 300)],
     "price": 36.0, "origPrice": None, "shop": "豆瓣豆品", "freight": 5,
     "skuOptions": [{"name": "配色", "values": ["黑白", "彩色"]}],
     "soldText": "8800人已买", "tag": "", "category": "服饰",
     "buyerBroadcastIds": []},
]

orders = [
    # 历史订单:交易关闭 ¥131(帆布包98 + 面包玫瑰徽章28 + 运费5)
    {"id": "o_closed131", "items": [
        {"productId": "pd_bag", "sku": "米白", "count": 1, "price": 98.0},
        {"productId": "pd_badge", "sku": "玫瑰", "count": 1, "price": 28.0}],
     "amount": 131.0, "freight": 5.0, "status": "closed", "createdAt": T(25, 15, 30),
     "addressId": "addr1", "couponId": None},
    # 已完成订单
    {"id": "o_done1", "items": [
        {"productId": "pd_notebook", "sku": "方格", "count": 1, "price": 45.0},
        {"productId": "pd_bookmark", "sku": "月相", "count": 2, "price": 22.0}],
     "amount": 94.0, "freight": 5.0, "status": "done", "createdAt": T(40, 11, 0),
     "addressId": "addr1", "couponId": None},
    # 待发货订单
    {"id": "o_toship1", "items": [
        {"productId": "pd_candle", "sku": "旧书", "count": 1, "price": 69.0}],
     "amount": 69.0, "freight": 0.0, "status": "toShip", "createdAt": T(2, 14, 20),
     "addressId": "addr2", "couponId": "cp_5yuan"},
]

addresses = [
    {"id": "addr1", "name": "墨鱼仔", "phone": "138****2046",
     "region": "北京市 北京市 顺义区", "detail": "示例小区1号楼2单元301", "isDefault": True},
    {"id": "addr2", "name": "墨鱼仔", "phone": "138****2046",
     "region": "江苏省 南京市 玄武区", "detail": "示例路88号文创园A座", "isDefault": False},
]

coupons = [
    {"id": "cp_5yuan", "title": "市集通用代金券", "amount": 5.0, "costBeans": 5,
     "validDays": 3, "owned": False},
    {"id": "cp_10yuan", "title": "新友邻满50减10券", "amount": 10.0, "costBeans": 12,
     "validDays": 7, "owned": True},
    {"id": "cp_book", "title": "图书专享代金券", "amount": 8.0, "costBeans": 8,
     "validDays": 14, "owned": False},
]

# =============================================================== 豆瓣时间
courses = [
    {"id": "crs_lian", "title": "大师镜头语言:立体电影十讲", "cover": IMG("course_lian", "镜头课", 300, 200),
     "price": 0.0, "kind": "video", "episodeCount": 10, "trialCount": 10,
     "author": "某影评人 等", "desc": "从家庭片到 120 帧,拆解一位名导的视听进化。",
     "purchased": True},
    {"id": "crs_sishu", "title": "品读四书:通往安顿之路", "cover": IMG("course_sishu", "四书课", 300, 200),
     "price": 99.0, "kind": "audio", "episodeCount": 25, "trialCount": 2,
     "author": "杨立华", "desc": "25期音频精讲,《论语》《孟子》《大学》《中庸》逐篇领读。",
     "purchased": False},
    {"id": "crs_qj", "title": "青椒学院:学术写作打包课", "cover": IMG("course_qj", "青椒课", 300, 200),
     "price": 199.0, "kind": "video", "episodeCount": 40, "trialCount": 3,
     "author": "青椒学院教研组", "desc": "选题-文献-投稿全流程,三门课打包价。",
     "purchased": False},
]

checkin = {"streak": 2, "goal": 5, "total": 2, "lastCheckinAt": T(1, 7, 30)}

podcastSubscriptions = ["pc4"]

# =============================================================== 草稿/历史/搜索
drafts = [
    {"id": "df1", "title": "", "text": "关于《四渡》点映的一些碎念,还没想好怎么展开……",
     "groupId": None, "savedAt": T(2, 23, 40)},
    {"id": "df2", "title": "求推荐:类似克拉克森农场的下饭综", "text": "要求:轻松、有梗、别太长。",
     "groupId": "g_banshu", "savedAt": T(6, 21, 15)},
]

history = [
    {"id": "h1", "kind": "broadcast", "refId": "b_jinse", "viewedAt": T(0, 10, 20)},
    {"id": "h2", "kind": "subject", "refId": "pc1", "viewedAt": T(0, 9, 50)},
    {"id": "h3", "kind": "groupPost", "refId": "gp_chendanqi", "viewedAt": T(0, 9, 30)},
    {"id": "h4", "kind": "subject", "refId": "m1", "viewedAt": T(1, 21, 10)},
    {"id": "h5", "kind": "group", "refId": "g_banshu", "viewedAt": T(1, 20, 40)},
    {"id": "h6", "kind": "user", "refId": "u_lilith", "viewedAt": T(2, 11, 0)},
]

searchHistory = ["赤水长歌", "极地厨房"]

settings = {
    "push": {"master": True, "reply": True, "like": True, "follow": True, "chat": True},
    "privacy": {"homepageVisible": "all", "hideGroups": False, "dmPolicy": "all",
                "syncFeed": True, "adPush": True},
    "watermark": {"personal": False, "saveWithWatermark": True},
    "minor": {"enabled": False},
}

# =============================================================== §3 批量随机生成:评价(短评/影评)+ 评论 + 楼中楼
# 目标:每个条目(书/影/音…)底部都有若干随机短评;每个帖子/广播/讨论/影评底部都有若干回复,
# 且包含「楼中楼」(quoteReplyId 指向同目标的某条主楼回复)。文案均为原创通用短句,不含任何受版权文本。
import random as _rnd

_R = _rnd.Random(20260705)
_IPS = ["北京", "上海", "广东", "浙江", "江苏", "四川", "甘肃", "山东", "福建", "湖南",
        "河南", "辽宁", "陕西", "重庆", "天津", "安徽", "云南", "日本", "美国", "未知"]
_ALL_UIDS = [u["id"] for u in users if u["id"] != SELF_ID]

_POS = ["节奏很稳,越看越入戏。", "细节处理得用心,值得二刷。", "氛围感拉满,画面很舒服。",
        "情绪铺垫到位,结尾意犹未尽。", "久违的好状态,真诚推荐。", "叙事克制,留白恰到好处。",
        "被角色打动到了。", "完成度超出预期。", "质感在线,细品有味道。", "看完心里暖暖的。"]
_MID = ["中规中矩,及格线之上。", "有亮点也有硬伤,见仁见智。", "前半段更好,后面稍平。",
        "题材不错,处理得中庸。", "还行,放松时看看。", "不功不过的一部。"]
_NEG = ["节奏偏慢,略显冗长。", "立意不错但落地一般。", "期待有点高了,略平。",
        "有点用力过猛,出戏。", "只能说见仁见智。"]

_REPLY = ["同感,楼主说到点上了。", "路过顶一下,写得真好。", "有不同看法,但尊重楼主。",
          "码住,慢慢看。", "这条太真实了。", "蹲一个后续更新。", "各有各的道理。",
          "长见识了。", "楼主分析得挺细。", "我倒觉得没那么夸张。", "先收藏再细看。", "说得在理。"]
_QUOTE = ["确实,补充得好。", "这点我不太同意。", "懂你意思了。", "所以才说见仁见智嘛。",
          "学到了,谢谢。", "那倒也是。", "有道理,受教。"]
_AUTHOR_REPLY = ["感谢关注~", "后面会补上的。", "是这样的。", "谢谢支持!", "收到,改天细聊。"]

_REVIEW_TITLES = ["一点碎碎念", "看完的即时感受", "写给同好", "不吐不快", "私人向短评", "随手记两句"]
_REVIEW_BODY = [
    "整体观感不错,几处细节尤其用心,情绪落点也稳。当然不是没有瑕疵,但瑕不掩瑜,值得静下心来看一遍。",
    "期待与落差并存。有让人眼前一亮的段落,也有明显拖沓的地方。总的来说见仁见智,看个人偏好。",
    "难得的诚意之作。叙事不炫技,靠人物和情绪推进,慢热但后劲足。推荐给愿意沉下来慢慢看的人。",
]


def _ip():
    return _R.choice(_IPS)


def _t():
    return T(_R.randint(0, 20), _R.randint(0, 23), _R.randint(0, 59))


# ---- 每个条目底部:随机短评 ----
_gc = 0
for _s in subjects:
    _r10 = _s.get("rating")
    for _ in range(_R.randint(4, 7)):
        _gc += 1
        _roll = _R.random()
        if _r10 and _r10 >= 8:
            _roll = min(_roll + 0.25, 0.99)
        if _roll > 0.6:
            _txt, _star = _R.choice(_POS), _R.choice([4, 5])
        elif _roll > 0.3:
            _txt, _star = _R.choice(_MID), 3
        else:
            _txt, _star = _R.choice(_NEG), _R.choice([1, 2])
        comments.append({
            "id": f"gc_{_gc}", "subjectId": _s["id"], "authorId": _R.choice(_ALL_UIDS),
            "rating": _star, "text": _txt, "likes": _R.randint(0, 320),
            "createdAt": _t(), "ipLocation": _ip(), "isHot": _R.random() < 0.25,
        })

# ---- 影视/图书条目:1 条随机影评/书评(自带回复楼) ----
_gvr = 0
for _s in subjects:
    if _s["type"] in ("movie", "book", "tv"):
        _gvr += 1
        reviews.append({
            "id": f"gvr_{_gvr}", "subjectId": _s["id"], "authorId": _R.choice(_ALL_UIDS),
            "title": _R.choice(_REVIEW_TITLES), "text": _R.choice(_REVIEW_BODY),
            "rating": _R.choice([3, 4, 5]), "useful": _R.randint(5, 400), "useless": _R.randint(0, 60),
            "replyCount": 0, "likeCount": _R.randint(0, 120), "repostCount": _R.randint(0, 20),
            "collectCount": _R.randint(0, 40), "giftCount": 0, "createdAt": _t(), "ipLocation": _ip(),
        })

# ---- 每个帖子/广播/讨论/影评底部:回复 + 楼中楼 ----
_grp = 0


def _add_replies(ttype, tid, author_id=None):
    global _grp
    tops = []
    for _ in range(_R.randint(3, 6)):
        _grp += 1
        rid = f"grp_{_grp}"
        is_auth = author_id is not None and _R.random() < 0.15
        replies.append({
            "id": rid, "targetType": ttype, "targetId": tid,
            "authorId": author_id if is_auth else _R.choice(_ALL_UIDS),
            "text": _R.choice(_AUTHOR_REPLY) if is_auth else _R.choice(_REPLY),
            "images": [], "likeCount": _R.randint(0, 200), "createdAt": _t(), "ipLocation": _ip(),
            "quoteReplyId": None, "deleted": _R.random() < 0.06,
            "isAuthor": is_auth, "authorLiked": _R.random() < 0.2, "isHot": _R.random() < 0.3,
        })
        tops.append(rid)
    # 楼中楼:引用某条主楼回复
    for _ in range(_R.randint(1, 3)):
        if not tops:
            break
        _grp += 1
        parent = _R.choice(tops)
        is_auth = author_id is not None and _R.random() < 0.3
        replies.append({
            "id": f"grp_{_grp}", "targetType": ttype, "targetId": tid,
            "authorId": author_id if is_auth else _R.choice(_ALL_UIDS),
            "text": ("楼主回复:" + _R.choice(_AUTHOR_REPLY)) if is_auth else ("回复楼上:" + _R.choice(_QUOTE)),
            "images": [], "likeCount": _R.randint(0, 80), "createdAt": _t(), "ipLocation": _ip(),
            "quoteReplyId": parent, "deleted": False,
            "isAuthor": is_auth, "authorLiked": _R.random() < 0.15, "isHot": False,
        })


for _b in broadcasts:
    _add_replies("broadcast", _b["id"], _b.get("authorId"))
for _gp in groupPosts:
    _add_replies("groupPost", _gp["id"], _gp.get("authorId"))
for _dc in discussions:
    _add_replies("discussion", _dc["id"], _dc.get("authorId"))
for _rv in list(reviews):
    _add_replies("review", _rv["id"], _rv.get("authorId"))

# ---- 回填各目标 replyCount = 实际非删除回复数 ----
_rc = {}
for _r in replies:
    if not _r.get("deleted"):
        _k = (_r["targetType"], _r["targetId"])
        _rc[_k] = _rc.get(_k, 0) + 1


def _fix_rc(_lst, _tt):
    for _it in _lst:
        _c = _rc.get((_tt, _it["id"]))
        if _c is not None:
            _it["replyCount"] = _c


_fix_rc(broadcasts, "broadcast")
_fix_rc(groupPosts, "groupPost")
_fix_rc(discussions, "discussion")
_fix_rc(reviews, "review")

# 补齐 赞/转发/收藏 记录:真机点进「赞/转发/收藏」tab 能看到具体的人。
# seed 聚合计数(likeCount 等)大但记录少 → tab 空。按计数确定性补记录(从虚构用户池轮询,
# 封顶合理列表长度;计数保持大数,列表展示一页的人,符合真机「N赞但列表分页」行为)。
def _topup_records(records, id_prefix, entities, ttype, count_field, cap):
    pool = [u["id"] for u in users if u["id"] != SELF_ID]
    for ent in entities:
        tid, cnt = ent["id"], ent.get(count_field, 0)
        if cnt <= 0:
            continue
        have = {r["userId"] for r in records if r["targetType"] == ttype and r["targetId"] == tid}
        want = min(cnt, cap)
        pi = sum(ord(c) for c in tid) % len(pool)  # 确定性起点
        for _ in range(len(pool)):
            if len(have) >= want:
                break
            uid = pool[pi % len(pool)]; pi += 1
            if uid in have:
                continue
            have.add(uid)
            n = len(records) + 1
            rec = {"id": f"{id_prefix}{n}", "targetType": ttype, "targetId": tid, "userId": uid,
                   "createdAt": T(1 + n % 20, n % 24, n % 60)}
            if id_prefix == "rpg":
                rec["comment"] = ""; rec["broadcastId"] = None
            if id_prefix == "clg":
                rec["doulistId"] = "dl_other"
            records.append(rec)

for _lst, _tt in ((broadcasts, "broadcast"), (discussions, "discussion"), (groupPosts, "groupPost"), (reviews, "review")):
    _topup_records(likes, "lkg", _lst, _tt, "likeCount", 18)
    _topup_records(reposts, "rpg", _lst, _tt, "repostCount", 10)
    _topup_records(collects, "clg", _lst, _tt, "collectCount", 8)

# =============================================================== 汇总输出
data = {
    "currentUser": current_user,
    "users": users,
    "celebrities": celebrities,
    "subjects": subjects,
    "marks": marks,
    "comments": comments,
    "reviews": reviews,
    "broadcasts": broadcasts,
    "replies": replies,
    "likes": likes,
    "reposts": reposts,
    "collects": collects,
    "gifts": gifts,
    "doulists": doulists,
    "collections": collections,
    "groups": groups,
    "groupPosts": groupPosts,
    "discussions": discussions,
    "topics": topics,
    "essaySets": essaySets,
    "top10s": top10s,
    "rankings": rankings,
    "follows": follows,
    "followers": followers,
    "notifications": notifications,
    "messages": messages,
    "products": products,
    "cart": [],
    "orders": orders,
    "addresses": addresses,
    "coupons": coupons,
    "courses": courses,
    "checkin": checkin,
    "podcastSubscriptions": podcastSubscriptions,
    "drafts": drafts,
    "history": history,
    "searchHistory": searchHistory,
    "settings": settings,
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(
    f"OK: defaults.json 生成 ({OUT.stat().st_size} bytes)\n"
    f"  subjects={len(subjects)} (movie={len(movies)} tv={len(tvs)} book={len(books)} "
    f"music={len(music)} podcast={len(podcasts)})\n"
    f"  users={len(users)} celebrities={len(celebrities)} groups={len(groups)} "
    f"groupPosts={len(groupPosts)} broadcasts={len(broadcasts)} replies={len(replies)}\n"
    f"  reviews={len(reviews)} comments={len(comments)} doulists={len(doulists)} "
    f"collections={len(collections)} products={len(products)} orders={len(orders)} "
    f"courses={len(courses)} rankings={len(rankings)}"
)
