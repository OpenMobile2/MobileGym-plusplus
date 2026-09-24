# -*- coding: utf-8 -*-
"""生成 apps/Ximalaya/data/defaults.json。100 专辑 / 700+ 集 / 35+ 主播。
每主列表 >=5 条且多样(品类/播放量/完结状态/VIP 各异)。图片走 /@app-assets/Ximalaya/covers/*.png,
缺图时 <Img> 组件回落 SVG。"""
import json, os, random

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "defaults.json")
BASE = 1782000000000  # 绝对 Unix ms(~2026-06),T() 派生
def T(days=0, h=0):
    return BASE + days * 86400000 + h * 3600000
def COVER(x): return f"/@app-assets/Ximalaya/covers/{x}.png"
def AVA(x):   return f"/@app-assets/Ximalaya/avatars/{x}.png"

random.seed(20260704)  # 可复现

# ====================================================================
# 100 专辑 (id, 标题, 品类, 主播id, 主播名, 播放量, 月票, 集数, 完结, VIP, 标签, 推荐值, 主题色)
# ====================================================================
ALB = [
 # ---- 小说 (30) ----
 # 玄幻 (6)
 ("a_novel", "星河纪元",         "小说", "an_yh",  "银河之声",   210000000, 5600, 800, False, True,  ["玄幻","热播"],   97, "#2E4A6E"),
 ("nv01",    "混沌天尊",         "小说", "an_cq",  "苍穹说书",   180000000, 4800, 600, False, True,  ["玄幻","修仙"],   95, "#3A2E6E"),
 ("nv02",    "万界之门",         "小说", "an_mj",  "墨玄居士",    95000000, 2200, 450, False, False, ["玄幻","异界"],   94, "#2E3A5A"),
 ("nv03",    "上古神魔录",       "小说", "an_jg",  "九歌",       130000000, 3100, 520, True,  True,  ["玄幻","神魔"],   96, "#4A2E5E"),
 ("nv04",    "九天玄帝",         "小说", "an_tx",  "天行",        88000000, 1900, 380, False, False, ["玄幻","热血"],   93, "#1E3A4E"),
 ("nv05",    "灵域苍穹",         "小说", "an_yy",  "云隐",        72000000, 1600, 420, False, True,  ["玄幻","连载"],   92, "#3E2A6E"),
 # 悬疑 (5)
 ("a_myst",  "迷雾档案馆",       "小说", "an_yx",  "夜行者",     156000000, 4200, 420, False, True,  ["悬疑","精品"],   96, "#33403A"),
 ("nm01",    "暗夜追凶",         "小说", "an_yx",  "夜行者",      89000000, 2100, 360, False, True,  ["悬疑","犯罪"],   94, "#2A3040"),
 ("nm02",    "第七重密室",       "小说", "an_bl",  "白鹿",        56000000, 1200, 280, True,  False, ["悬疑","推理"],   93, "#3A3340"),
 ("nm03",    "心理罪档案",       "小说", "an_sj2", "深镜",        78000000, 1800, 320, False, True,  ["悬疑","心理"],   94, "#332A40"),
 ("nm04",    "幽灵电台",         "小说", "an_yy2","夜语",         34000000,  760, 240, False, False, ["悬疑","灵异"],   91, "#2A3340"),
 # 都市 (5)
 ("nd01",    "浮城往事",         "小说", "an_lc2","临川",        67000000, 1500, 300, False, False, ["都市","职场"],   93, "#4A4E2E"),
 ("nd02",    "商海沉浮",         "小说", "an_lc2","临川",        45000000,  980, 260, False, True,  ["都市","商战"],   92, "#3E4A2E"),
 ("nd03",    "白衣江湖",         "小说", "an_qx",  "青溪",        38000000,  820, 220, False, False, ["都市","医疗"],   91, "#2E4A4E"),
 ("nd04",    "律政锋芒",         "小说", "an_mz",  "明哲",        31000000,  680, 200, True,  False, ["都市","律政"],   90, "#4A3E2E"),
 ("nd05",    "青春不散场",       "小说", "an_nk",  "南柯",        52000000, 1100, 180, False, False, ["都市","校园"],   92, "#4A2E4E"),
 # 言情 (4)
 ("nr01",    "锦绣良缘",         "小说", "an_ws",  "晚霜",        82000000, 1800, 320, True,  False, ["言情","古言"],   93, "#7A3A5A"),
 ("nr02",    "穿越时空的爱恋",   "小说", "an_ws",  "晚霜",        61000000, 1300, 280, False, False, ["言情","穿越"],   92, "#6A2E5E"),
 ("nr03",    "余生请多指教",     "小说", "an_qq",  "青衿",        94000000, 2200, 240, False, True,  ["言情","现言"],   94, "#8A3A4A"),
 ("nr04",    "花开半夏",         "小说", "an_qq",  "青衿",        47000000,  980, 200, True,  False, ["言情","青春"],   91, "#7A4A3E"),
 # 武侠 (3)
 ("nw01",    "江湖夜雨十年灯",   "小说", "an_xm2","萧鸣",        58000000, 1200, 400, True,  False, ["武侠","江湖"],   93, "#5A3A2E"),
 ("nw02",    "剑啸西风",         "小说", "an_xm2","萧鸣",        36000000,  760, 320, False, False, ["武侠","侠义"],   91, "#4A2E2E"),
 ("nw03",    "侠骨柔情",         "小说", "an_fy",  "风影",        28000000,  580, 260, False, False, ["武侠","门派"],   90, "#6E3A2E"),
 # 科幻 (4)
 ("ns01",    "银河舰队",         "小说", "an_xy",  "星渊",        72000000, 1600, 380, False, True,  ["科幻","太空"],   93, "#1E3A5A"),
 ("ns02",    "赛博深渊",         "小说", "an_xy",  "星渊",        48000000,  980, 300, False, False, ["科幻","赛博"],   92, "#2A1E4A"),
 ("ns03",    "时间囚徒",         "小说", "an_hg",  "黑洞",        39000000,  820, 240, True,  True,  ["科幻","时间"],   91, "#3A2E5E"),
 ("ns04",    "星际拓荒",         "小说", "an_hg",  "黑洞",        31000000,  620, 280, False, False, ["科幻","探险"],   90, "#2E3A4E"),
 # 末世 (3)
 ("ne01",    "丧尸纪元",         "小说", "an_hh",  "灰烬",        54000000, 1100, 320, False, True,  ["末世","丧尸"],   92, "#3A3A2E"),
 ("ne02",    "废土行者",         "小说", "an_hh",  "灰烬",        38000000,  760, 280, False, False, ["末世","废土"],   91, "#4A3E2E"),
 ("ne03",    "变异黎明",         "小说", "an_jy",  "惊蛰",        29000000,  540, 220, False, False, ["末世","变异"],   90, "#3A4A2E"),

 # ---- 相声评书 (20) ----
 # 相声 (8)
 ("a_cross", "欢乐相声大会",     "相声评书", "an_dg", "逗哏堂",   356000000, 8100, 240, False, False, ["相声","经典"],   96, "#8A3A32"),
 ("xs01",    "传统相声精选",     "相声评书", "an_dg", "逗哏堂",   128000000, 3200, 180, True,  False, ["相声","传统"],   94, "#7A3A2E"),
 ("xs02",    "爆笑单口集",       "相声评书", "an_ly", "老于",      89000000, 2100, 150, False, False, ["相声","单口"],   93, "#6E3A2A"),
 ("xs03",    "群口相声专场",     "相声评书", "an_ly", "老于",      56000000, 1200, 120, True,  False, ["相声","群口"],   92, "#8A4A32"),
 ("xs04",    "新派相声秀",       "相声评书", "an_xp", "新芽",      72000000, 1800, 160, False, False, ["相声","新派"],   93, "#7A4E3A"),
 ("xs05",    "相声名家名段",     "相声评书", "an_dg", "逗哏堂",   165000000, 3800, 200, True,  False, ["相声","名家"],   95, "#8A3A3A"),
 ("xs06",    "逗你笑翻天",       "相声评书", "an_xp", "新芽",      43000000,  980, 130, False, False, ["相声","爆笑"],   91, "#6E4A3A"),
 ("xs07",    "相声春晚",         "相声评书", "an_dg", "逗哏堂",   210000000, 5600, 100, True,  False, ["相声","晚会"],   95, "#9A3A2E"),
 # 评书 (7)
 ("a_story", "英雄评书演义",     "相声评书", "an_xm", "醒木先生",  89000000, 2100, 360, True,  False, ["评书","连载"],   95, "#7A4B2E"),
 ("ps01",    "三国演义",         "相声评书", "an_xm", "醒木先生",  450000000, 9800, 480, True,  False, ["评书","古典"],   98, "#7A3A2E"),
 ("ps02",    "水浒英雄传",       "相声评书", "an_xm", "醒木先生",  280000000, 6200, 420, True,  False, ["评书","古典"],   97, "#6E3A2E"),
 ("ps03",    "西游记评书",       "相声评书", "an_zx", "知闲",     190000000, 4500, 360, True,  False, ["评书","神话"],   96, "#5A3A2E"),
 ("ps04",    "红楼梦评话",       "相声评书", "an_zx", "知闲",     120000000, 2800, 300, True,  False, ["评书","古典"],   95, "#7A3A4A"),
 ("ps05",    "隋唐风云",         "相声评书", "an_yd", "远帆",      76000000, 1800, 320, True,  False, ["评书","历史"],   93, "#6E4A2E"),
 ("ps06",    "封神演义",         "相声评书", "an_yd", "远帆",      98000000, 2400, 380, True,  False, ["评书","神话"],   94, "#5A4A2E"),
 # 戏曲 (5)
 ("a_qyu",   "戏曲名段赏析",     "相声评书", "an_lm", "梨园客",    21000000,  520,  96, True,  False, ["戏曲","传统"],   91, "#7A3A4A"),
 ("xq01",    "京剧经典",         "相声评书", "an_lm", "梨园客",    34000000,  820, 120, True,  False, ["戏曲","京剧"],   92, "#8A2A3A"),
 ("xq02",    "越剧名段",         "相声评书", "an_ly2","柳吟",      18000000,  420,  80, True,  False, ["戏曲","越剧"],   90, "#7A2A4A"),
 ("xq03",    "黄梅戏精选",       "相声评书", "an_ly2","柳吟",      15000000,  360,  72, True,  False, ["戏曲","黄梅"],   90, "#6E3A5A"),
 ("xq04",    "豫剧大观",         "相声评书", "an_zz", "中原韵",    12000000,  280,  64, True,  False, ["戏曲","豫剧"],   89, "#8A3A4A"),

 # ---- 儿童 (15) ----
 ("a_kid",   "小熊童话晚安",     "儿童", "an_hp",  "花婆婆",      67000000, 1500, 200, False, False, ["儿童","睡前"],   94, "#C77D3E"),
 ("kd01",    "格林童话精选",     "儿童", "an_hp",  "花婆婆",      89000000, 2200, 150, True,  False, ["儿童","童话"],   95, "#D48A4A"),
 ("kd02",    "安徒生故事集",     "儿童", "an_hp",  "花婆婆",      72000000, 1800, 180, True,  False, ["儿童","童话"],   94, "#C78A3E"),
 ("kd03",    "一千零一夜",       "儿童", "an_yy3","夜莺",         54000000, 1300, 160, True,  False, ["儿童","故事"],   93, "#B87A3E"),
 ("kd04",    "宝宝睡前音乐",     "儿童", "an_yy3","夜莺",         38000000,  820, 120, False, False, ["儿童","安抚"],   92, "#A86A3E"),
 ("kd05",    "动物寓言故事",     "儿童", "an_tt",  "跳跳虎",      45000000,  980, 140, False, False, ["儿童","寓言"],   92, "#D49A4A"),
 ("kd06",    "森林冒险记",       "儿童", "an_tt",  "跳跳虎",      32000000,  680, 100, False, False, ["儿童","冒险"],   91, "#C78A4A"),
 ("kd07",    "海底世界探秘",     "儿童", "an_hl",  "海螺",        28000000,  580,  90, False, False, ["儿童","科普"],   90, "#4A8A9A"),
 ("kd08",    "成长不烦恼",       "儿童", "an_mm",  "米米",        24000000,  520,  80, False, False, ["儿童","成长"],   90, "#9A7A4A"),
 ("kd09",    "少儿英语启蒙",     "儿童", "an_em",  "Emily",       56000000, 1200, 100, False, True,  ["儿童","英语"],   93, "#3A8A9A"),
 ("kd10",    "趣味自然百科",     "儿童", "an_zr",  "自然姐姐",    36000000,  760, 120, False, False, ["儿童","科普"],   91, "#4A9A6A"),
 ("kd11",    "科学小实验",       "儿童", "an_kx",  "科科",        22000000,  460,  60, False, False, ["儿童","科学"],   90, "#4A6A9A"),
 ("kd12",    "人体大揭秘",       "儿童", "an_kx",  "科科",        18000000,  380,  50, False, False, ["儿童","科普"],   89, "#6A4A9A"),
 ("kd13",    "历史故事连环画",   "儿童", "an_ls",  "历史叔叔",    26000000,  540,  80, False, False, ["儿童","历史"],   90, "#9A6A4A"),
 ("kd14",    "中华成语故事",     "儿童", "an_ls",  "历史叔叔",    34000000,  720, 100, True,  False, ["儿童","国学"],   91, "#8A6A3A"),

 # ---- 大师课 (15) ----
 ("a_cul",   "华夏文明通识课",   "大师课", "an_wy", "文渊先生",   128000000, 3520, 120, True,  True,  ["文化","精品课"], 98, "#618B8A"),
 ("a_biz",   "商业思维三十讲",   "大师课", "an_lc", "洞见学长",    34000000,  760,  30, True,  True,  ["商业","干货"],   92, "#2E5E5A"),
 ("ms01",    "国学精读论语",     "大师课", "an_wy", "文渊先生",    56000000, 1200,  60, True,  True,  ["文化","国学"],   94, "#5A8B7A"),
 ("ms02",    "唐诗宋词鉴赏",     "大师课", "an_wy", "文渊先生",    72000000, 1800,  80, True,  True,  ["文化","诗词"],   95, "#4A7B8A"),
 ("ms03",    "中国书画艺术",     "大师课", "an_sy", "舒雅",        28000000,  580,  40, True,  False, ["文化","艺术"],   91, "#6A8B7A"),
 ("ms04",    "茶道与生活美学",   "大师课", "an_sy", "舒雅",        19000000,  420,  30, True,  False, ["文化","生活"],   90, "#5A7B6A"),
 ("ms05",    "创业实战课",       "大师课", "an_lc", "洞见学长",    42000000,  980,  45, False, True,  ["商业","创业"],   92, "#3E6E5A"),
 ("ms06",    "投资理财入门",     "大师课", "an_lc", "洞见学长",    58000000, 1300,  50, True,  True,  ["商业","理财"],   93, "#2E5E4E"),
 ("ms07",    "品牌营销策略",     "大师课", "an_yl", "远略",        31000000,  680,  35, False, False, ["商业","营销"],   91, "#4A6E5E"),
 ("ms08",    "中国古代史",       "大师课", "an_gz", "古舟",        48000000, 1100,  60, True,  False, ["历史","通史"],   93, "#6E5A3A"),
 ("ms09",    "近代中国变革",     "大师课", "an_gz", "古舟",        36000000,  820,  45, True,  False, ["历史","近代"],   92, "#5E4A3A"),
 ("ms10",    "世界文明史",       "大师课", "an_gz", "古舟",        52000000, 1200,  70, True,  True,  ["历史","世界"],   93, "#6E5A4A"),
 ("ms11",    "物理学的奥秘",     "大师课", "an_lk", "理科爷爷",    34000000,  760,  40, True,  True,  ["科学","物理"],   92, "#3A4A8A"),
 ("ms12",    "生命科学探秘",     "大师课", "an_lk", "理科爷爷",    28000000,  620,  35, False, True,  ["科学","生物"],   91, "#3A6A8A"),
 ("ms13",    "天文宇宙观",       "大师课", "an_xk", "星客",        39000000,  880,  40, False, False, ["科学","天文"],   92, "#2A3A6E"),

 # ---- 播客 (10) ----
 ("a_cast",  "深夜漫谈电台",     "播客", "an_yh2","夜航员",       42000000,  980, 156, False, False, ["播客","情感"],   93, "#3A3A5A"),
 ("pk01",    "恋爱心理学",       "播客", "an_xn", "小暖",         38000000,  820,  80, False, False, ["播客","情感"],   92, "#5A3A5A"),
 ("pk02",    "婚姻经营课",       "播客", "an_xn", "小暖",         24000000,  520,  60, False, False, ["播客","情感"],   90, "#4A3A5A"),
 ("pk03",    "情绪研究所",       "播客", "an_qx2","情绪君",       31000000,  680,  70, False, False, ["播客","心理"],   91, "#3A4A5A"),
 ("pk04",    "互联网观察",       "播客", "an_wg", "网观",         45000000,  980, 100, False, False, ["播客","科技"],   92, "#2A4A6A"),
 ("pk05",    "AI前线",           "播客", "an_wg", "网观",         58000000, 1300, 120, False, False, ["播客","科技"],   93, "#1E3A5A"),
 ("pk06",    "数码生活馆",       "播客", "an_sm", "数码叔",       22000000,  460,  50, False, False, ["播客","科技"],   90, "#3A4A5E"),
 ("pk07",    "舌尖上的故事",     "播客", "an_ms", "美食家",       28000000,  580,  60, False, False, ["播客","生活"],   91, "#6E5A3A"),
 ("pk08",    "旅行日记",         "播客", "an_lx", "行者",         19000000,  380,  45, False, False, ["播客","生活"],   90, "#3A6E5A"),
 ("pk09",    "行业对话录",       "播客", "an_ft", "访谈录",       34000000,  720,  80, False, False, ["播客","访谈"],   91, "#4A4A5A"),

 # ---- 历史 (10) ----
 ("a_hist",  "如果历史会说话",   "历史", "an_sj", "史家笔谈",     78000000, 1900, 168, True,  False, ["历史","知识"],   95, "#6E5A3A"),
 ("hi01",    "中国通史",         "历史", "an_sj", "史家笔谈",    120000000, 3200, 200, True,  False, ["历史","通史"],   96, "#5E4A2A"),
 ("hi02",    "近代百年风云",     "历史", "an_sj", "史家笔谈",     68000000, 1500, 150, True,  False, ["历史","近代"],   94, "#6E4A3A"),
 ("hi03",    "世界通史",         "历史", "an_sj3","世界说",       89000000, 2100, 180, True,  True,  ["历史","世界"],   95, "#4A3A5A"),
 ("hi04",    "秦汉帝国",         "历史", "an_gh", "故瀚",         42000000,  880,  80, True,  False, ["历史","断代"],   92, "#5E3A2A"),
 ("hi05",    "唐宋繁华",         "历史", "an_gh", "故瀚",         58000000, 1200, 100, True,  False, ["历史","断代"],   93, "#6E3A2A"),
 ("hi06",    "明清兴衰",         "历史", "an_gh", "故瀚",         46000000,  980,  90, True,  False, ["历史","断代"],   92, "#5E4A3A"),
 ("hi07",    "民国往事",         "历史", "an_mg", "民国客",       38000000,  820,  85, True,  False, ["历史","民国"],   91, "#6E5A4A"),
 ("hi08",    "战争与文明",       "历史", "an_zh", "战史堂",       52000000, 1100, 110, False, False, ["历史","战争"],   92, "#4A3A3A"),
 ("hi09",    "历史人物志",       "历史", "an_zh", "战史堂",       34000000,  720,  95, False, False, ["历史","人物"],   91, "#5A3A4A"),
]

assert len(ALB) == 100, f"专辑数应为 100,实际 {len(ALB)}"

# ====================================================================
# 生成 Tracks(每专辑 6-10 集,标题多样)
# ====================================================================
TRACK_TITLES = [
    "开篇·缘起", "第二章·风云初动", "第三章·暗流涌动", "第四章·转折之夜",
    "第五章·高潮迭起", "第六章·余韵未散", "第七章·新章开启", "第八章·变局将至",
    "第九章·破局", "第十章·终章", "番外·前传", "番外·后记",
    "特别篇·访谈", "特别篇·答疑", "完结篇·告别",
]
TRANSCRIPT_TEMPLATES = [
    "本集围绕{theme}展开,讲述了{phase}的过程,深入剖析了{aspect}的细节。",
    "本期聚焦{theme},从{angle}角度切入,带听众走进{scene}的世界。",
    "这一集探讨了{theme}的核心,{phase}与{aspect}交织,引人入胜。",
    "本集是{theme}的关键转折,{scene}的描写尤为精彩,值得反复品味。",
]
TRANSCRIPT_THEMES = ["起源", "发展", "冲突", "升华", "结局", "番外", "前传", "后记"]
TRANSCRIPT_PHASES = ["萌芽", "成长", "对峙", "和解", "蜕变"]
TRANSCRIPT_ASPECTS = ["人物", "情节", "背景", "主题", "情感"]
TRANSCRIPT_ANGLES = ["历史", "文化", "心理", "社会", "哲学"]
TRANSCRIPT_SCENES = ["幻想", "现实", "回忆", "梦境", "未来"]

def tracks_for(aid, n, vipmix=False):
    out = []
    for i in range(1, n + 1):
        vip = vipmix and i > 2
        title = TRACK_TITLES[(i - 1) % len(TRACK_TITLES)].replace("第X章", f"第{i}章").replace("第_章", f"第{i}章")
        # 用数字替换标题序号
        if "第" in title and "章" in title:
            title = f"第{i}集 " + title.split("·", 1)[-1] if "·" in title else f"第{i}集"
        else:
            title = f"第{i}集 " + title
        theme = TRANSCRIPT_THEMES[i % len(TRANSCRIPT_THEMES)]
        phase = TRANSCRIPT_PHASES[i % len(TRANSCRIPT_PHASES)]
        aspect = TRANSCRIPT_ASPECTS[i % len(TRANSCRIPT_ASPECTS)]
        angle = TRANSCRIPT_ANGLES[i % len(TRANSCRIPT_ANGLES)]
        scene = TRANSCRIPT_SCENES[i % len(TRANSCRIPT_SCENES)]
        tmpl = TRANSCRIPT_TEMPLATES[i % len(TRANSCRIPT_TEMPLATES)]
        transcript = f"【AI 文稿·节选】{tmpl.format(theme=theme, phase=phase, aspect=aspect, angle=angle, scene=scene)}(文稿由 AI 生成,仅供参考)"
        out.append({
            "id": f"{aid}_t{i}", "albumId": aid,
            "title": title,
            "durationSec": 480 + (i % 7) * 120 + (hash(aid) % 60),
            "playCount": max(10000, 5000000 // (i + 1) + (hash(aid) % 100000)),
            "updatedAt": T(-i, -(i % 24)),
            "isVip": vip, "free": not vip,
            "transcript": transcript,
        })
    return out

albums, tracks = [], []
for (aid, title, cat, anid, anname, pc, mt, tc, fin, vip, tags, rec, theme) in ALB:
    n = 8 if tc > 100 else (6 if tc > 30 else 5)  # 大专辑生成更多集
    ts = tracks_for(aid, n, vipmix=vip)
    tracks.extend(ts)
    albums.append({
        "id": aid, "title": title, "cover": COVER(aid), "anchorId": anid, "anchorName": anname,
        "category": cat,
        "intro": f"《{title}》——{cat}精品内容,{'已完结' if fin else '持续更新中'},共 {tc} 集。合成简介,保留品类与体量结构。",
        "playCount": pc, "monthlyTicket": mt, "trackCount": tc, "finished": fin, "isVip": vip,
        "tags": tags, "recommendPct": rec, "themeColor": theme, "trackIds": [t["id"] for t in ts],
    })

# ====================================================================
# 主播(从专辑聚合,>=5)
# ====================================================================
ANCH = {}
for (aid, title, cat, anid, anname, *_ ) in ALB:
    a = ANCH.setdefault(anid, {"id": anid, "name": anname, "avatar": AVA(anid),
        "desc": f"{anname},{cat}领域主播。", "fansCount": 0, "albumCount": 0, "albumIds": []})
    a["albumIds"].append(aid); a["albumCount"] += 1
    a["fansCount"] = 88000 + a["albumCount"] * 56000 + (hash(anid) % 50000)
anchors = list(ANCH.values())

# ====================================================================
# 评论(>=20,多样:地域/时间/赞/时间戳,覆盖多专辑)
# ====================================================================
COMMENT_DATA = [
    ("a_cul","听风者_h9","讲得深入浅出,受益匪浅,已三刷。","北京",328,69),
    ("a_cross","乐呵老王","太逗了哈哈哈,通勤路上笑出声。","天津",156,None),
    ("a_novel","追更少年","更新太慢了,催更!剧情越来越精彩。","广东",92,215),
    ("a_myst","夜猫子77","悬念拉满,主播声音超有代入感。","四川",204,None),
    ("a_kid","果果妈妈","孩子每晚必听,睡得可香了。","浙江",88,30),
    ("a_hist","史海钩沉","史料扎实,观点新颖,长知识。","陕西",147,None),
    ("ps01","三国迷","三国演义评书版绝了,醒木一拍就入戏。","河北",312,45),
    ("ps02","水浒粉","一百零八将各有风采,听得停不下来。","山东",268,None),
    ("nv01","修仙党","混沌天尊的设定太牛了,世界观宏大。","江苏",198,120),
    ("nm01","推理控","密室设计精妙,反转没想到。","上海",176,88),
    ("kd01","宝妈群","格林童话讲得生动,孩子超爱。","湖南",145,None),
    ("ms02","诗词客","唐诗宋词鉴赏,文渊先生讲得真雅。","福建",132,None),
    ("pk05","AI观察者","AI前线紧跟热点,干货满满。","北京",189,None),
    ("hi01","历史君","中国通史听了三遍,每次都有新收获。","河南",224,None),
    ("xs01","相声粉","传统相声精选,全是经典段子。","天津",168,None),
    ("a_biz","创业者","商业思维三十讲,实战性强。","广东",98,None),
    ("nr03","言情党","余生请多指教,甜到心里了。","四川",156,60),
    ("ns01","科幻迷","银河舰队,硬科幻的浪漫。","湖北",134,200),
    ("kd09","英语妈","少儿英语启蒙,发音标准孩子跟读。","上海",112,None),
    ("hi05","宋史粉","唐宋繁华讲得生动,仿佛穿越。","浙江",143,None),
    ("xs07","春晚粉","相声春晚,年味十足。","辽宁",201,None),
    ("pk07","吃货","舌尖上的故事,听饿了。","广东",128,None),
]
comments = [
 {"id":f"c{i+1}","albumId":alb,"userName":un,"avatar":AVA(f"u{i+1}"),
  "content":ct,"createdAt":T(-(i*2+1), -(i%12)),"region":rg,
  "likeCount":lc,"timePoint":tp,"replyCount":(lc//20)}
 for i,(alb,un,ct,rg,lc,tp) in enumerate(COMMENT_DATA)
]

# ====================================================================
# 历史(>=10,今天/更早,剩余分钟)
# ====================================================================
history = [
    {"albumId":"a_novel","trackId":"a_novel_t3","remainSec":540,"listenedAt":T(0,-1),"kind":"play"},
    {"albumId":"a_cul","trackId":"a_cul_t1","remainSec":120,"listenedAt":T(0,-4),"kind":"play"},
    {"albumId":"a_cross","trackId":"a_cross_t2","remainSec":0,"listenedAt":T(-1,-2),"kind":"play"},
    {"albumId":"a_myst","trackId":"a_myst_t1","remainSec":300,"listenedAt":T(-2,-5),"kind":"play"},
    {"albumId":"a_hist","trackId":"a_hist_t4","remainSec":720,"listenedAt":T(-3,-8),"kind":"browse"},
    {"albumId":"ps01","trackId":"ps01_t1","remainSec":420,"listenedAt":T(-1,-6),"kind":"play"},
    {"albumId":"nv01","trackId":"nv01_t2","remainSec":180,"listenedAt":T(-2,-3),"kind":"play"},
    {"albumId":"kd01","trackId":"kd01_t1","remainSec":60,"listenedAt":T(0,-9),"kind":"play"},
    {"albumId":"pk05","trackId":"pk05_t1","remainSec":240,"listenedAt":T(-4,-1),"kind":"play"},
    {"albumId":"hi05","trackId":"hi05_t3","remainSec":360,"listenedAt":T(-5,-7),"kind":"browse"},
]

# ====================================================================
# 本地/下载(>=8,不同类型/容量)
# ====================================================================
local = [
    {"albumId":"a_cul","downloadedCount":12,"totalCount":120,"sizeMB":86.4,"kind":"album"},
    {"albumId":"a_novel","downloadedCount":30,"totalCount":800,"sizeMB":210.0,"kind":"album"},
    {"albumId":"a_cross","downloadedCount":8,"totalCount":240,"sizeMB":54.2,"kind":"sound"},
    {"albumId":"a_kid","downloadedCount":20,"totalCount":200,"sizeMB":120.5,"kind":"album"},
    {"albumId":"a_myst","downloadedCount":5,"totalCount":420,"sizeMB":38.1,"kind":"sound"},
    {"albumId":"ps01","downloadedCount":15,"totalCount":480,"sizeMB":98.7,"kind":"album"},
    {"albumId":"kd01","downloadedCount":10,"totalCount":150,"sizeMB":62.3,"kind":"album"},
    {"albumId":"pk05","downloadedCount":6,"totalCount":120,"sizeMB":28.5,"kind":"sound"},
]

# ====================================================================
# 听单
# ====================================================================
listenLists = [
    {"id":"ll_fav","name":"我收藏的声音","isPrivate":True,"trackIds":["a_cul_t1","a_novel_t3","a_myst_t1","ps01_t1","hi05_t2"]},
    {"id":"ll_night","name":"深夜助眠单","isPrivate":False,"trackIds":["a_cast_t1","a_kid_t2","kd04_t1","pk03_t1"]},
    {"id":"ll_kid","name":"宝宝故事单","isPrivate":False,"trackIds":["a_kid_t1","kd01_t1","kd02_t1","kd05_t1","kd14_t1"]},
    {"id":"ll_history","name":"历史长河单","isPrivate":False,"trackIds":["a_hist_t1","hi01_t1","hi04_t1","hi05_t1","ms08_t1"]},
]

# ====================================================================
# 消息(>=5 会话)
# ====================================================================
messages = [
    {"id":"m_inter","kind":"interactive","name":"互动消息","preview":"有人赞了你的评论","unread":3,"updatedAt":T(0,-2),
     "items":[{"id":"mi1","title":"点赞","body":"乐呵老王 赞了你的评论","createdAt":T(0,-2)},
              {"id":"mi2","title":"评论","body":"追更少年 回复了你","createdAt":T(-1,-3)}]},
    {"id":"m_sys","kind":"system","name":"系统通知","preview":"你的会员即将到期","unread":1,"updatedAt":T(-1,-1),
     "items":[{"id":"ms1","title":"会员提醒","body":"你的 VIP 会员将于 3 天后到期,续费享 8 折。","createdAt":T(-1,-1)}]},
    {"id":"m_anchor","kind":"anchor","name":"主播消息","preview":"文渊先生 更新了专辑","unread":0,"updatedAt":T(-2,-4),
     "items":[{"id":"ma1","title":"更新","body":"你订阅的《华夏文明通识课》更新了第 120 集。","createdAt":T(-2,-4)}]},
    {"id":"m_survey","kind":"survey","name":"官方调研","preview":"参与调研得积分","unread":0,"updatedAt":T(-3,-6),
     "items":[{"id":"msu1","title":"调研","body":"新版播放页体验调研,诚邀你参与。","createdAt":T(-3,-6)}]},
    {"id":"m_tj","kind":"tingjian","name":"听见","preview":"本周话题投票","unread":0,"updatedAt":T(-4,-2),
     "items":[{"id":"mt1","title":"投票","body":"你最爱的有声书类型是?(单选)","createdAt":T(-4,-2)}]},
]

# ====================================================================
# 会员套餐
# ====================================================================
memberPlans = [
    {"id":"p_month","name":"连续包月","tier":"vip","price":18,"originPrice":25,"badge":"限时"},
    {"id":"p_12","name":"买12个月送2个月","tier":"vip","price":198,"originPrice":298,"badge":"超值"},
    {"id":"p_year","name":"连续包年","tier":"vip","price":168,"originPrice":298,"badge":"倒计时"},
    {"id":"p_plat","name":"白金连续包年","tier":"platinum","price":298,"originPrice":488,"badge":"尊享"},
    {"id":"p_svip","name":"大师课SVIP包年","tier":"svip","price":388,"originPrice":588,"badge":None},
]

# ====================================================================
# 榜单(每榜 10 条,覆盖多品类)
# ====================================================================
def rank_list(ids):
    return [{"albumId": a, "rank": i + 1} for i, a in enumerate(ids)]

ranks = {
    "hot":  rank_list(["a_cross","a_novel","a_myst","a_cul","a_hist","ps01","ps02","nv01","xs01","kd01"]),
    "new":  rank_list(["a_biz","a_myst","a_cast","a_qyu","a_kid","pk05","ns01","ms13","hi07","kd09"]),
    "free": rank_list(["a_cross","a_story","a_cast","a_hist","a_qyu","xs02","xs06","pk08","hi09","kd08"]),
    "word": rank_list(["ps01","ps02","ps03","ps04","ps05","ps06","a_story","nw01","nw02","nw03"]),
    "kid":  rank_list(["a_kid","kd01","kd02","kd03","kd05","kd09","kd10","kd14","kd06","kd13"]),
}

# ====================================================================
# 皮肤(>=5,分类/VIP/已购)
# ====================================================================
skins = [
    {"id":"sk_def","name":"经典默认","category":"全部","isVip":False,"owned":True,"themeColor":"#333333"},
    {"id":"sk_ink","name":"国风水墨","category":"经典IP","isVip":False,"owned":True,"themeColor":"#4A5A5A"},
    {"id":"sk_star","name":"星空幻境","category":"玄幻奇幻","isVip":True,"owned":False,"themeColor":"#2E3A6E"},
    {"id":"sk_forest","name":"密林晨曦","category":"影视原著","isVip":True,"owned":True,"themeColor":"#33403A"},
    {"id":"sk_magic","name":"魔法学院","category":"哈利波特","isVip":True,"owned":False,"themeColor":"#5A3A2E"},
    {"id":"sk_aurora","name":"极光之夜","category":"玄幻奇幻","isVip":True,"owned":False,"themeColor":"#2A4E4A"},
    {"id":"sk_retro","name":"复古留声","category":"经典IP","isVip":False,"owned":True,"themeColor":"#6E4A2E"},
]

# ====================================================================
# 已购
# ====================================================================
purchased = [
    {"albumId":"a_cul","purchasedCount":120,"kind":"album"},
    {"albumId":"a_biz","purchasedCount":30,"kind":"album"},
    {"albumId":"a_novel","purchasedCount":0,"kind":"anchorVip"},
    {"albumId":"ms02","purchasedCount":80,"kind":"album"},
    {"albumId":"ps01","purchasedCount":480,"kind":"album"},
]

# ====================================================================
# 勋章(>=6)
# ====================================================================
badges = [
    {"id":"b27","title":"第27周收听之星","group":"收听成就","date":"2026.07.05","earned":True},
    {"id":"b09","title":"第9周收听之星","group":"收听成就","date":"2026.02.27","earned":True},
    {"id":"b1000","title":"累计收听1000天","group":"限定成就","date":"2024.07.01","earned":True},
    {"id":"b500","title":"累计收听500天","group":"限定成就","date":"2024.07.01","earned":True},
    {"id":"bfan","title":"铁杆粉丝","group":"频道粉丝成就","date":"2025.11.20","earned":True},
    {"id":"b2000","title":"累计收听2000天","group":"限定成就","date":"待获得","earned":False},
    {"id":"b_explorer","title":"百专辑探索者","group":"限定成就","date":"待获得","earned":False},
    {"id":"b_listener","title":"万小时听书","group":"收听成就","date":"待获得","earned":False},
]

# ====================================================================
# 快听沉浸流(从多专辑抽第 1 集)
# ====================================================================
quickListenTrackIds = [
    "a_novel_t1","a_cross_t1","a_myst_t1","a_cast_t1","a_kid_t1","a_hist_t1",
    "ps01_t1","nv01_t1","nm01_t1","kd01_t1","pk05_t1","hi01_t1",
    "xs01_t1","ms02_t1","nr03_t1","ns01_t1",
]

# ====================================================================
# 热搜 / 搜索历史
# ====================================================================
hotSearch = [
    "玄幻小说","相声大会","睡前故事","历史揭秘","悬疑推理","商业思维","戏曲名段","儿童英语",
    "修仙","评书","三国","唐诗宋词","AI","科幻","末世","心理学",
    "育儿","投资","世界通史","相声春晚",
]
searchHistory = ["星河纪元","相声","评书","文明通识","三国演义"]

# ====================================================================
# 组装
# ====================================================================
data = {
    "user": {"id":"u_me","name":"听风者_h9","avatar":AVA("u_me"),"level":18,"listenHours":1268,
             "fans":42,"follows":36,"isVip":False,"vipExpireAt":T(30)},
    "albums": albums, "tracks": tracks, "anchors": anchors, "comments": comments,
    "history": history, "local": local, "listenLists": listenLists, "messages": messages,
    "memberPlans": memberPlans, "ranks": ranks, "skins": skins, "purchased": purchased, "badges": badges,
    "quickListenTrackIds": quickListenTrackIds,
    "hotSearch": hotSearch, "searchHistory": searchHistory,
    # 运行时写入(初始态)
    "subscribedAlbumIds": ["a_novel","a_cul","a_cross","ps01","hi01"],
    "collectedTrackIds": ["a_cul_t1","a_novel_t3","a_myst_t1","ps01_t1","hi05_t2"],
    "followedAnchorIds": ["an_wy","an_xm","an_dg"],
    "likedTrackIds": [], "likedCommentIds": [], "appliedSkinId": "sk_def",
    "player": {"currentAlbumId":"a_novel","currentTrackId":"a_novel_t3","playing":False,
               "progressSec":300,"speed":1.0,"quality":"标准","timerLabel":""},
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

# 统计
cats = {}
for a in albums:
    cats[a["category"]] = cats.get(a["category"], 0) + 1
print(f"OK: defaults.json {os.path.getsize(OUT)} bytes")
print(f"  albums: {len(albums)} | tracks: {len(tracks)} | anchors: {len(anchors)}")
print(f"  categories: {cats}")
print(f"  comments: {len(comments)} | history: {len(history)} | local: {len(local)}")
