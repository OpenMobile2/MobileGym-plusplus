# -*- coding: utf-8 -*-
"""生成 data/defaults.json(优酷复刻种子数据,对齐 spec.json v1.0.0 各节点所需)。

硬约定:
- 片名/人名/节目名全部虚构化(风格可类似真实作品,不用真实片名/明星);
- 时间一律 {dayOffset, hm} 相对描述,state.ts 初始化经 utils/appTime.seedTs 映射到模拟「今天」;
- 图片字段统一 asset key:/@app-assets/Youku/<dir>/<id>.png,素材缺失由 components/Img.tsx 回落 SVG 占位;
- 运行本脚本会同时输出 assets/image_manifest.json(全部需要生成的图片清单+prompt 提示,
  对齐 docs/youku-replication/design-tokens.md「批量生图需求清单」)。

运行: python apps/Youku/assets/regen_defaults.py
改动 defaults.json 结构后必须递增 constants.ts 的 DATA_VERSION。
"""
import json
from pathlib import Path

OUT = Path(__file__).parents[1] / "data" / "defaults.json"
MANIFEST_OUT = Path(__file__).parent / "image_manifest.json"
OUT.parent.mkdir(exist_ok=True)

A = lambda f: f"/@app-assets/Youku/{f}"  # noqa: E731

_manifest = []  # (path, category, prompt_hint)


def img(path, category, hint):
    _manifest.append({"file": f"apps/Youku/assets/{path}", "category": category, "prompt": hint})
    return A(path)


def poster(cid, hint):
    return img(f"posters/{cid}.png", "poster_2x3", hint)


def still(cid, hint):
    return img(f"stills/{cid}.png", "still_16x9", hint)


def cover(sid, hint):
    return img(f"shorts/{sid}.png", "shorts_cover_16x9", hint)


def avatar(uid, hint):
    return img(f"avatars/{uid}.png", "avatar_round", hint)


def at(day_offset, hm):
    return {"dayOffset": day_offset, "hm": hm}


# ---------------------------------------------------------------- 片库(≥30,全部虚构)
def item(cid, title, ctype, channel, rec, desc, poster_hint, still_hint=None, **kw):
    d = {
        "id": cid, "title": title, "type": ctype, "channel": channel,
        "poster": poster(cid, poster_hint),
        "still": still(cid, still_hint or poster_hint),
        "recTitle": rec, "desc": desc,
        "heat": kw.pop("heat", 5000),
        "badge": kw.pop("badge", ""),
        "rating": kw.pop("rating", 8.0),
        "year": kw.pop("year", 2024),
        "region": kw.pop("region", "中国大陆"),
        "tags": kw.pop("tags", []),
        "director": kw.pop("director", ""),
        "actors": kw.pop("actors", []),
        "durationSec": kw.pop("durationSec", 2700),
    }
    d.update(kw)  # douban / episodeCount / updatedTo / freeUpTo / trialEp / vipFrom / seriesId / languages / broadcastDay / boxOffice / ages
    return d


CATALOG = [
    # ---- 电影 ≥10(含「寻妖记」三部曲种子片:完整简介/评分/系列/语言选择)----
    item("m_xunyao1", "寻妖记", "movie", "movie", "人妖共存的爆笑奇幻冒险",
         "深山客栈老板阿澄意外捡到一只会撒娇的小妖『团团』,从此被卷入人妖两界的追捕风暴。护妖师、赏妖客、天师府势力接连登场,一场笑泪交织的护送之旅就此展开。",
         "奇幻喜剧电影海报,古装青年与毛茸茸小妖同框,竹林客栈背景,电影质感",
         heat=9126, badge="帧享60帧", rating=9.1, douban=8.3, year=2015, tags=["奇幻", "喜剧", "合家欢"],
         director="荀嘉树", actors=["白一舟", "宋知夏", "团团"], seriesId="xunyao",
         languages=["普通话", "粤语", "英语"], durationSec=7080, boxOffice="票房破24亿"),
    item("m_xunyao2", "寻妖记2", "movie", "movie", "团团走丢了!全城寻妖大作战",
         "小妖团团与阿澄失散,流落天音镇。赌坊老板娘、退隐护妖师与神秘面具人各怀心思,一场围绕团团的夺妖大战笑闹升级,亲情线更加催泪。",
         "奇幻喜剧电影海报续集,小妖在灯笼夜市中奔跑,暖色调",
         heat=8320, badge="独播", rating=8.6, douban=7.1, year=2018, tags=["奇幻", "喜剧"],
         director="荀嘉树", actors=["白一舟", "凌慕青"], seriesId="xunyao",
         languages=["普通话", "粤语", "英语"], durationSec=6900, boxOffice="票房破22亿"),
    item("m_xunyao3", "寻妖记3·灵界之门", "movie", "movie", "灵界之门开启,妖界大乱斗",
         "灵界之门意外洞开,妖界四灵闯入人间。阿澄一家携团团踏上封门之旅,最终章集齐前作全员,笑点与泪点双双拉满。",
         "奇幻电影海报,发光的巨大石门与群妖剪影,史诗感",
         heat=8890, badge="限免中", rating=8.9, douban=7.8, year=2024, tags=["奇幻", "冒险"],
         director="荀嘉树", actors=["白一舟", "宋知夏", "陆迟"], seriesId="xunyao",
         languages=["普通话", "粤语", "英语"], durationSec=7320),
    item("m_xueshan3", "雪山熊师3", "movie", "movie", "笨熊也能成为大师",
         "贪吃的棕熊阿墩终于当上雪山武馆代理馆长,却迎来失散多年的亲生族群与神秘反派『白狼王』的双重考验。动作与笑料齐飞的合家欢动画。",
         "3D动画电影海报,胖棕熊摆武术招式,雪山背景,明亮色彩",
         heat=7460, badge="VIP", rating=9.3, douban=8.0, year=2016, region="美国", tags=["动画", "喜剧", "合家欢"],
         director="J·库珀", actors=["配音:金啸白", "配音:严露"],
         languages=["英语", "普通话", "法语"], durationSec=5700),
    item("m_yueguang", "月光宝殿", "movie", "movie", "笑着笑着就哭了的东方奇幻",
         "山贼头子洛小星意外获得可回溯时光的月光宝殿,为救挚爱一次次穿回过去,却在宿命轮回里读懂了爱与遗憾。华语奇幻喜剧不朽经典。",
         "复古奇幻电影海报,月光下古装侠客侧影与宫殿,蓝紫色调",
         heat=9530, badge="帧享4K", rating=9.7, douban=9.0, year=1995, region="中国香港", tags=["奇幻", "爱情", "喜剧"],
         director="纪初原", actors=["洛长风", "叶紫凝"], durationSec=6180, boxOffice="重映票房破3亿"),
    item("m_weicheng", "危城迷案", "movie", "movie", "雨夜连环案背后的真相",
         "台风夜,滨海旧城连发三起密室命案。刑警程野与法医搭档抽丝剥茧,发现所有线索都指向二十年前的一场大火。",
         "犯罪悬疑电影海报,雨夜霓虹街道上的侦探背影,冷色调",
         heat=7210, badge="独播", rating=8.4, douban=7.6, year=2023, tags=["犯罪", "悬疑"],
         director="麦振声", actors=["程野", "邵敏"], durationSec=6480),
    item("m_langchao", "致命浪潮", "movie", "movie", "巨浪之下,谁能生还",
         "深海钻井平台遭遇史诗级风暴,幸存者被困于不断倒塌的钢铁迷宫。工程师林拓带领众人绝地求生,人性在极限中显影。",
         "灾难电影海报,巨浪吞没钻井平台,压迫感构图",
         heat=6890, badge="VIP", rating=8.1, year=2024, tags=["灾难", "动作"],
         director="韩承宇", actors=["林拓", "祁蔓"], durationSec=6600),
    item("m_gansidui", "十面敢死队", "movie", "movie", "十位老兵,最后一战",
         "退役特种兵被旧日战友召集,深入金三角营救人质。十人小队各怀绝技,硬桥硬马的动作盛宴。",
         "动作电影海报,十人小队持械列队剪影,火光背景",
         heat=6540, rating=8.0, year=2022, tags=["动作", "战争"],
         director="唐铁生", actors=["霍震", "曹一刀"], durationSec=6360),
    item("m_kuangben", "末路狂奔", "movie", "movie", "一路向西,笑到失控",
         "落魄司机老包接了单跨省代驾,乘客竟是携款潜逃的会计。一场横跨三省的公路狂欢,笑料与温情齐飞。",
         "公路喜剧电影海报,破旧轿车扬尘飞驰,黄昏色调",
         heat=7020, badge="上新榜TOP1", rating=8.7, year=2025, tags=["喜剧", "公路"],
         director="毕仲文", actors=["包大有", "钟小婉"], durationSec=6240),
    item("m_menfeng", "门缝里的光", "movie", "movie", "原著党认证,年度悬疑黑马",
         "独居女孩总觉得对门住户行迹诡异,报警无果后她决定自己调查,却在门缝里看见了不该看见的东西。改编自同名高分小说。",
         "心理悬疑电影海报,门缝透出一线光,极简高对比",
         heat=7770, badge="独播", rating=8.8, douban=8.5, year=2024, tags=["悬疑", "惊悚"],
         director="戚文澜", actors=["安小鱼", "沈迦"], durationSec=6300),
    item("m_xunbao", "寻宝奇兵", "movie", "movie", "宝藏地图开启夺宝之旅",
         "考古系毕业生误得残缺藏宝图,与古董商、雇佣兵三方竞逐大漠深处的失落古城。轻松诙谐的冒险爽片。",
         "冒险电影海报,沙漠古城与探险者,金色调",
         heat=6380, badge="限免中", rating=8.2, year=2023, tags=["冒险", "动作"],
         director="鲁大河", actors=["方一勺", "麦朵"], durationSec=6420),
    item("m_tonghua", "童话镇大冒险", "movie", "movie", "孩子们的暑期首选",
         "被吸入立体童话书的兄妹俩,要在午夜前集齐三枚故事之钥才能回家。合家欢奇幻冒险动画。",
         "儿童动画电影海报,发光的立体童话书与小兄妹,糖果色",
         heat=5960, rating=8.9, year=2025, tags=["动画", "少儿"],
         director="桂圆", actors=["配音:小澈", "配音:豆丁"], durationSec=5400),

    # ---- 剧集 ≥8(含 37 集《新笑傲山河》种子剧)----
    item("s_xiaoao", "新笑傲山河", "series", "drama", "快意恩仇,武侠新经典",
         "少年游侠令狐苏卷入五岳剑派纷争,与魔教圣女曲盈盈相知相惜。江湖棋局环环相扣,一曲山河笑傲尽侠骨柔情。",
         "武侠剧海报,持剑侠客立于山巅,水墨风",
         heat=9126, badge="独播", rating=9.0, douban=8.1, year=2026, tags=["武侠", "古装"],
         director="程一鹤", actors=["纪云舟", "孟晚棠", "谢东流"],
         episodeCount=37, updatedTo=37, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2700),
    item("s_anxiang", "暗香令", "series", "drama", "古偶天花板,甜虐交织",
         "调香世家孤女沈暗香身负灭门之仇,入宫为香师,与冷面摄政王互相试探又彼此沉沦。以香为引的权谋爱情大戏。",
         "古装偶像剧海报,红衣女子执香炉,烟雾缭绕",
         heat=8930, badge="限免中", rating=8.7, year=2026, tags=["古偶", "权谋"],
         director="慕容澈", actors=["沈今瑶", "厉北辰"],
         episodeCount=33, updatedTo=33, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2520),
    item("s_xuanan", "悬案十三宗", "series", "drama", "每一宗都不敢快进",
         "重案组组长秦沉重启十三宗积年悬案,每一宗背后都藏着人性深渊。单元剧结构,尺度与深度并存。",
         "刑侦剧海报,案卷与放大镜特写,冷峻蓝灰",
         heat=8450, badge="热度榜TOP1", rating=8.9, douban=8.4, year=2025, tags=["悬疑", "刑侦"],
         director="裴钊", actors=["秦沉", "陶乐"],
         episodeCount=24, updatedTo=24, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2760),
    item("s_boyi", "夫妻博弈论", "series", "drama", "婚姻是场无限游戏",
         "金牌离婚律师夫妇分属对立律所,法庭上唇枪舌剑,回家后共享一个冰箱。都市轻喜剧解构现代婚姻。",
         "都市剧海报,西装男女背靠背,明快撞色",
         heat=7830, badge="豆瓣8.2", rating=8.5, douban=8.2, year=2025, tags=["都市", "喜剧"],
         director="尹思齐", actors=["顾衡", "苏迩"],
         episodeCount=30, updatedTo=30, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2640),
    item("s_shengong", "深宫岁月", "series", "drama", "N刷不腻的宫斗鼻祖",
         "小官之女柳青芜入宫为嫔,从谨小慎微到执掌六宫,数十年深宫浮沉写尽人心。经典宫斗长剧。",
         "宫斗剧海报,凤冠女子回眸,暗金色调",
         heat=8710, badge="经典", rating=9.4, douban=9.1, year=2012, tags=["古装", "宫斗"],
         director="郑楚桥", actors=["柳青芜", "萧统"],
         episodeCount=76, updatedTo=76, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2700),
    item("s_chunnuan", "春暖花溪3", "series", "drama", "治愈系乡村喜剧回归",
         "花溪村迎来乡村振兴新项目,村主任马春花带着一村活宝折腾出新花样。轻松下饭的田园群像喜剧第三季。",
         "乡村喜剧海报,油菜花田里的欢乐村民群像,明亮暖色",
         heat=6920, badge="每周五更新", rating=8.3, year=2026, tags=["喜剧", "乡村"],
         director="费大同", actors=["马春花", "牛结实"],
         episodeCount=40, updatedTo=16, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2460),
    item("s_qiaochu", "翘楚风云", "series", "drama", "商战传奇,大女主爽剧",
         "民国船运世家养女程翘楚临危受命执掌家业,在乱世商海与各方枭雄博弈,步步为营成就一代传奇。",
         "民国商战剧海报,旗袍女子立于码头,复古色调",
         heat=8110, badge="独播", rating=8.6, year=2025, tags=["传奇", "商战"],
         director="骆明川", actors=["程翘楚", "霍聿深"],
         episodeCount=38, updatedTo=38, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2700),
    item("s_ruqingyun", "入青云道", "series", "drama", "仙侠虐恋,飞升之路",
         "凡人少女姜小满误吞青云珠,被仙门收留修行,与冷傲师尊之间横亘着三世因果。高燃仙侠古偶。",
         "仙侠剧海报,白衣仙人与少女御剑,云海仙山",
         heat=7690, badge="独播", rating=8.4, year=2026, tags=["仙侠", "古偶"],
         director="花无咎", actors=["姜小满", "玄一真君"],
         episodeCount=28, updatedTo=28, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2580),
    item("s_zhulou", "朱楼旧梦", "series", "drama", "百看不厌的古典名著改编",
         "簪缨世族朱府由盛转衰,少年公子与表妹的旷世情缘随家族命运浮沉。古典美学巅峰之作。",
         "古典名著剧海报,雕梁画栋中的古装少年少女,工笔画风",
         heat=8260, badge="经典", rating=9.5, douban=9.3, year=1998, tags=["古装", "经典"],
         director="沈鹤龄", actors=["朱瑾玉", "林潇湘"],
         episodeCount=45, updatedTo=45, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2700),

    # ---- 综艺 ----
    item("v_benpao", "奔跑少年第十季", "variety", "variety", "十年陪伴,快乐依旧",
         "国民户外竞技综艺十周年季,固定班底重聚,撕名牌大战再度升级。",
         "户外真人秀海报,多人奔跑欢乐场景,高饱和撞色",
         heat=8640, badge="独播", rating=8.2, year=2026, tags=["综艺", "户外"],
         episodeCount=12, updatedTo=8, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=5400),
    item("v_baichu", "百厨争霸", "variety", "variety", "美食界的巅峰对决",
         "一百位民间厨神同台竞技,每期一道命题菜,评审团盲品打分,决出本季食神。",
         "美食竞技综艺海报,炉火与颠勺瞬间,热烈红金",
         heat=8020, rating=8.6, year=2026, tags=["综艺", "美食"],
         episodeCount=10, updatedTo=10, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=5100),
    item("v_xiyou", "我的西行记", "variety", "variety", "每周五更新·文化实景漫游",
         "六位艺人重走西行古道,实景任务+文化访谈,笑点与知识点齐飞。",
         "文化旅行综艺海报,大漠驼队与嘉宾合影,落日金色",
         heat=7480, badge="每周五更新", rating=8.4, year=2026, tags=["综艺", "文化"],
         episodeCount=16, updatedTo=8, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=4800),
    item("v_shengxia", "少年盛夏", "variety", "variety", "少年们的夏日成长记",
         "十二位少年在海岛完成一个夏天的共居挑战,记录友谊、汗水与成长。",
         "青春成长综艺海报,海岛沙滩上的少年群像,清新蓝绿",
         heat=6870, rating=8.1, year=2026, tags=["综艺", "成长"],
         episodeCount=12, updatedTo=12, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=4500),

    # ---- 动漫 ----
    item("a_canglan", "沧澜图", "anime", "anime", "国漫巅峰,年更大作",
         "凡人少年孟舟得上古沧澜图认主,踏上逆天修行路。顶级3D国漫,打斗帧帧壁纸。",
         "修仙国漫海报,持图少年御空,蓝金粒子特效",
         heat=8890, badge="独播", rating=9.2, year=2026, tags=["国漫", "修仙"],
         episodeCount=52, updatedTo=30, freeUpTo=2, trialEp=3, vipFrom=4, broadcastDay=6, durationSec=1380),
    item("a_shenzhong", "神冢年番", "anime", "anime", "年番霸榜,墓中修行",
         "被封印神冢万年的少年重见天日,携上古神通搅动九州风云。热血年番持续更新。",
         "玄幻国漫海报,古冢中睁眼的少年,紫金光效",
         heat=8560, badge="SVIP提前看1集", rating=9.0, year=2025, tags=["国漫", "玄幻"],
         episodeCount=78, updatedTo=62, freeUpTo=2, trialEp=3, vipFrom=4, broadcastDay=0, durationSec=1320),
    item("a_shixiong", "师兄且慢", "anime", "anime", "搞笑修仙,全程高能",
         "穿越成炮灰大师兄的李长寿苟道修行,表面淡定实则疯狂囤后手。喜剧修仙国漫。",
         "搞笑修仙国漫海报,摇扇淡定的白衣师兄,轻快色调",
         heat=7940, rating=8.8, year=2026, tags=["国漫", "喜剧"],
         episodeCount=40, updatedTo=24, freeUpTo=2, trialEp=3, vipFrom=4, broadcastDay=3, durationSec=1260),
    item("a_gaowu", "高武学院", "anime", "anime", "热血高武,校园争锋",
         "灵气复苏时代,普通少年段风考入顶级高武学院,以凡人之躯比肩天才。",
         "热血校园国漫海报,武装少年跃起挥拳,红蓝对撞",
         heat=7350, badge="加更礼", rating=8.5, year=2026, tags=["国漫", "热血"],
         episodeCount=26, updatedTo=12, freeUpTo=2, trialEp=3, vipFrom=4, broadcastDay=5, durationSec=1320),
    item("a_tuili", "推理学园事件簿", "anime", "anime", "每集一案,烧脑推理",
         "天才少年侦探团在学园内外破解离奇案件,本格推理番剧,伏笔回收极爽。",
         "推理日漫风海报,放大镜下的少年侦探,悬疑紫",
         heat=6980, rating=8.7, year=2025, region="日本", tags=["动漫", "推理"],
         episodeCount=24, updatedTo=20, freeUpTo=2, trialEp=3, vipFrom=4, broadcastDay=2, durationSec=1380),

    # ---- 少儿 ----
    item("k_lele", "超级宝贝乐乐", "kids", "kids", "0-3岁启蒙首选",
         "萌娃乐乐和伙伴们在游乐镇学习颜色、数字与礼貌,寓教于乐的启蒙动画。",
         "幼儿启蒙动画海报,大头萌娃与彩色积木,糖果色3D",
         heat=6540, rating=8.8, year=2024, tags=["少儿", "启蒙"], ages="0-3岁",
         episodeCount=60, updatedTo=60, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=480),
    item("k_pike", "小猪皮克全集", "kids", "kids", "全球小朋友都爱的粉红小猪",
         "小猪皮克一家的日常趣事,每集一个温馨小故事,轻松幽默适合亲子共看。",
         "低幼动画海报,粉色小猪一家野餐,明亮扁平风",
         heat=7860, badge="VIP", rating=9.1, year=2020, region="英国", tags=["少儿", "亲子"], ages="3-6岁",
         episodeCount=104, updatedTo=104, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=300),
    item("k_feigou", "飞狗莫可", "kids", "kids", "会飞的狗狗来啦",
         "拥有飞行能力的小狗莫可和小主人环游世界,科普与冒险兼备。",
         "儿童冒险动画海报,戴飞行镜的小狗翱翔云端,天蓝色",
         heat=6210, rating=8.6, year=2023, tags=["少儿", "冒险"], ages="3-6岁",
         episodeCount=52, updatedTo=52, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=660),
    item("k_caoyuan", "草原小羊历险记", "kids", "kids", "羊村伙伴智斗大灰狼",
         "机灵的小羊团队用智慧一次次化解草原危机,经典国产少儿动画。",
         "少儿动画海报,可爱羊群在草原冒险,明亮糖果色3D",
         heat=6890, badge="独播", rating=8.9, year=2022, tags=["少儿", "冒险"], ages="6岁+",
         episodeCount=48, updatedTo=48, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=780),

    # ---- 长尾频道内容(纪录片/人文/游戏)----
    item("d_diqiu", "地球重生纪", "series", "documentary", "帧享画质,自然史诗",
         "跟随镜头见证灾后生态系统的自我修复,8K 拍摄的自然纪录大片。",
         "自然纪录片海报,破土新芽与远山云海,帧享质感",
         heat=6720, badge="帧享", rating=9.4, year=2025, region="英国", tags=["纪录片", "自然"],
         episodeCount=8, updatedTo=8, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=3000),
    item("d_xiongmao", "竹林熊猫日记", "series", "documentary", "滚滚的日常也太治愈了",
         "深入保护区记录大熊猫幼崽成长全过程,萌态百出的治愈系纪录片。",
         "动物纪录片海报,竹林里打滚的熊猫幼崽,自然绿",
         heat=6350, rating=9.2, year=2024, tags=["纪录片", "动物"],
         episodeCount=6, updatedTo=6, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2700),
    item("d_shuixia", "水下秘境", "series", "documentary", "潜入深蓝,探索未知",
         "深海摄影团队探访全球七大水下奇观,揭开海底世界的神秘面纱。",
         "海洋纪录片海报,深蓝海底光柱与鱼群,神秘蓝",
         heat=5980, badge="VIP", rating=9.0, year=2023, tags=["纪录片", "海洋"],
         episodeCount=5, updatedTo=5, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2880),
    item("h_yizuoqiao", "一座桥", "series", "humanities", "独播人文力作",
         "以一座百年古桥为线索,串起桥畔三代人的悲欢与时代变迁。",
         "人文纪录片海报,晨雾中的石拱桥与行人,水墨灰",
         heat=5720, badge="独播", rating=9.1, year=2025, tags=["人文", "纪实"],
         episodeCount=12, updatedTo=12, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2640),
    item("h_yuanzhuo", "圆桌夜话第八季", "series", "humanities", "深夜围炉,聊点真的",
         "文化名人围坐圆桌,就热点话题展开松弛而锋利的漫谈。第八季全新回归。",
         "谈话节目海报,深夜圆桌与暖黄台灯,复古质感",
         heat=6480, rating=9.0, year=2026, tags=["人文", "谈话"],
         episodeCount=24, updatedTo=18, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=3600),
    item("g_dianjing", "电竞大师赛纪实", "series", "game", "见证电竞高光时刻",
         "跟拍职业战队征战大师赛全程,还原赛场内外的热血与泪水。",
         "电竞纪实海报,选手背影面向璀璨主舞台,霓虹紫蓝",
         heat=6150, rating=8.5, year=2026, tags=["游戏", "纪实"],
         episodeCount=10, updatedTo=10, freeUpTo=2, trialEp=3, vipFrom=4, durationSec=2400),
]

# 《新笑傲山河》37 集分集剧情(选集面板「分集剧情」tab)
_plots = [
    "令狐苏下山历练,初入江湖便卷入镖局劫案", "五岳剑派华金城大会暗流涌动", "曲盈盈抚琴退敌,二人不打不相识",
    "剑谱失窃,令狐苏蒙冤被逐", "魔教夜袭药王谷,盈盈出手相救", "思过崖面壁,巧遇隐世前辈授剑",
    "独孤九式初成,剑挑十三连环坞", "师妹别嫁,令狐苏醉卧长亭", "查案入洛阳,金刀门旧案浮出水面",
    "琴箫合奏笑傲曲,知音之约定终身", "五仙教设局,盈盈身世成谜", "并肩夜战黑木崖外围",
]
EPISODE_SYNOPSIS = {
    "s_xiaoao": [f"第{i}集 {_plots[(i - 1) % len(_plots)]}" for i in range(1, 38)],
    "s_anxiang": [f"第{i}集 沈暗香以香入局,步步为营" for i in range(1, 34)],
}

# ---------------------------------------------------------------- 创作者(≥5 关注种子 + 推荐)
CREATORS = [
    {"id": "c_xianyuzai", "name": "闲鱼仔剪辑", "avatar": avatar("c_xianyuzai", "卡通咸鱼形象头像,蓝色背景"),
     "fansText": "128.6万", "likesTotal": "3892.5万", "verify": "影视领域优质博主", "ipRegion": "IP属地:广东",
     "bio": "带你三分钟看完一部好片,更新不定期,催更请点关注"},
    {"id": "c_taotao", "name": "滔滔影视", "avatar": avatar("c_taotao", "话筒卡通形象头像,橙色背景"),
     "fansText": "89.3万", "likesTotal": "2201.7万", "verify": "影视领域创作者", "ipRegion": "IP属地:浙江",
     "bio": "只讲值得看的电影,滔滔不绝但绝不剧透关键"},
    {"id": "c_pala", "name": "啪啦酱", "avatar": avatar("c_pala", "卡通少女侧脸头像,粉色背景"),
     "fansText": "542.1万", "likesTotal": "1.2亿", "verify": "优酷创作学院讲师", "ipRegion": "IP属地:上海",
     "bio": "生活吐槽+观剧闲聊,每周三五更新"},
    {"id": "c_yueshiji", "name": "月食记", "avatar": avatar("c_yueshiji", "月亮与餐盘组合卡通头像,深蓝背景"),
     "fansText": "310.8万", "likesTotal": "8672.4万", "verify": "美食视频自媒体", "ipRegion": "IP属地:四川",
     "bio": "治愈系深夜食堂,看完记得去吃饭"},
    {"id": "c_lizisran", "name": "栗子染", "avatar": avatar("c_lizisran", "田园少女卡通头像,浅绿背景"),
     "fansText": "720.4万", "likesTotal": "2.6亿", "verify": "田园生活记录者", "ipRegion": "IP属地:云南",
     "bio": "山里的四季,慢慢拍给你看"},
    {"id": "c_chenxiang7", "name": "晨响七点半", "avatar": avatar("c_chenxiang7", "闹钟卡通形象头像,黄色背景"),
     "fansText": "186.9万", "likesTotal": "9203.1万", "verify": "搞笑短剧团队", "ipRegion": "IP属地:湖南",
     "bio": "每天七点半,准时开饭(短剧)"},
    {"id": "c_saixiya", "name": "赛西娅", "avatar": avatar("c_saixiya", "赛博风少女头像,紫色背景"),
     "fansText": "9.7万", "likesTotal": "312.8万", "verify": "", "ipRegion": "IP属地:北京",
     "bio": "海外新片速报,一手情报站"},
]
SEED_FOLLOWING = ["c_pala", "c_yueshiji", "c_lizisran", "c_taotao", "c_xianyuzai"]
RECOMMEND_CREATORS = ["c_saixiya", "c_chenxiang7"]

# ---------------------------------------------------------------- 短视频(解说/UGC ≥12)
def short(sid, title, creator, linked, dur, likes, cmts, favs, plays, hint):
    return {"id": sid, "type": "short", "title": title, "creatorId": creator,
            "linkedContentId": linked, "durationSec": dur, "cover": cover(sid, hint),
            "likes": likes, "commentsCount": cmts, "favs": favs, "playsText": plays}


SHORTS = [
    short("sv01", "三分钟看懂《月光宝殿》的三重结局", "c_xianyuzai", "m_yueguang", 214, 128000, 3421, 20956, "890万",
          "短视频封面,古装奇幻电影解说画面拼图"),
    short("sv02", "《寻妖记》里你没注意到的12个细节", "c_xianyuzai", "m_xunyao1", 356, 96500, 2210, 15230, "620万",
          "短视频封面,毛茸小妖特写与字幕条"),
    short("sv03", "盘点《新笑傲山河》五场封神打戏", "c_taotao", "s_xiaoao", 428, 88200, 1980, 11480, "540万",
          "短视频封面,武侠剑气对决高光帧"),
    short("sv04", "《门缝里的光》结局到底谁是凶手?", "c_taotao", "m_menfeng", 384, 105600, 4620, 18770, "730万",
          "短视频封面,悬疑门缝光线画面"),
    short("sv05", "深夜复刻《百厨争霸》冠军菜", "c_yueshiji", "v_baichu", 297, 76800, 1520, 9860, "410万",
          "短视频封面,深夜厨房炒锅火焰"),
    short("sv06", "山里的春天,从一碗野菜饭开始", "c_lizisran", None, 325, 213000, 5230, 30125, "1200万",
          "短视频封面,田园少女采野菜"),
    short("sv07", "《暗香令》甜疯了!高糖名场面混剪", "c_pala", "s_anxiang", 246, 158000, 6890, 24568, "980万",
          "短视频封面,古偶剧甜蜜对视混剪"),
    short("sv08", "吐槽:今年最下饭的三部剧", "c_pala", "s_boyi", 302, 92400, 3105, 12890, "560万",
          "短视频封面,弹幕吐槽风拼图"),
    short("sv09", "《沧澜图》最新一集炸了,帧帧壁纸", "c_taotao", "a_canglan", 268, 134000, 4230, 21050, "820万",
          "短视频封面,3D国漫高光打斗帧"),
    short("sv10", "海外新片速报:《零日风暴》前瞻", "c_saixiya", "m_langchao", 233, 45200, 890, 5620, "230万",
          "短视频封面,海外大片预告画面"),
    short("sv11", "七点半短剧:老板的秘密(上)", "c_chenxiang7", None, 187, 187000, 7820, 26890, "1100万",
          "短视频封面,搞笑短剧办公室场景"),
    short("sv12", "《雪山熊师3》幕后配音名场面", "c_xianyuzai", "m_xueshan3", 275, 68900, 1420, 8930, "380万",
          "短视频封面,动画配音棚趣味画面"),
    short("sv13", "一口气看完《悬案十三宗》第一案", "c_taotao", "s_xuanan", 512, 99800, 3680, 14520, "610万",
          "短视频封面,刑侦剧案卷解说画面"),
    short("sv14", "村里办了场厨神大赛", "c_lizisran", None, 341, 156000, 4210, 19870, "760万",
          "短视频封面,乡村坝坝宴烹饪"),
]

# 创作者主页补充视频(保证每人视频≥4,可在 feed 播放)
_extra = []
_extra_defs = {
    "c_xianyuzai": ["《危城迷案》全解析(上)", "《危城迷案》全解析(下)"],
    "c_taotao": ["《翘楚风云》大结局速看"],
    "c_pala": ["观剧闲聊:古偶为什么上头", "开箱:我的追剧装备"],
    "c_yueshiji": ["深夜食堂:一人食火锅", "复刻宫廷点心失败实录", "早餐摊蹲点记"],
    "c_lizisran": ["山中晒秋", "给奶奶做一件新棉袄"],
    "c_chenxiang7": ["七点半短剧:老板的秘密(下)", "七点半短剧:相亲奇遇", "七点半短剧:年会惊魂"],
    "c_saixiya": ["海外剧集周报Vol.12", "颁奖季前瞻:黑马在哪", "预告解帧:深空来客"],
}
_n = 15
for cid, titles in _extra_defs.items():
    for t in titles:
        sid = f"sv{_n:02d}"
        _n += 1
        _extra.append(short(sid, t, cid, None, 200 + _n * 7, 30000 + _n * 811, 500 + _n * 13,
                            3000 + _n * 97, f"{100 + _n * 9}万", "短视频封面,自媒体日常内容"))
SHORTS += _extra

# 创作者主页 tab 数据(视频≥4/动态≥2/喜欢≥4)
_by_creator = {}
for s in SHORTS:
    _by_creator.setdefault(s["creatorId"], []).append(s["id"])
_all_ids = [s["id"] for s in SHORTS]
for c in CREATORS:
    vids = _by_creator.get(c["id"], [])
    c["videoIds"] = vids
    others = [i for i in _all_ids if i not in vids]
    c["likeShortIds"] = others[:4]
    c["collections"] = [{"name": f"{c['name']}精选合集", "count": len(vids)}]
    c["dynamics"] = [
        {"id": f"dyn_{c['id']}_1", "text": "新片刚出炉,快去看!评论区聊聊你的看法~",
         "shortId": vids[0] if vids else None, "at": at(-1, "19:30"), "likes": 4213, "comments": 386, "shares": 129},
        {"id": f"dyn_{c['id']}_2", "text": "感谢大家陪伴,粉丝福利安排中,蹲一个下期预告。",
         "shortId": vids[1] if len(vids) > 1 else None, "at": at(-4, "12:05"), "likes": 2876, "comments": 214, "shares": 87},
    ]

# ---------------------------------------------------------------- 短剧 ≥4(多集)
SHORT_DRAMAS = [
    {"id": "sd_nixi", "type": "drama", "title": "逆袭小厨娘", "episodeCount": 80, "updatedTo": 80,
     "cover": cover("sd_nixi", "竖屏短剧封面,厨房里的元气少女"), "heat": 8210, "likes": 326000, "follows": 45200,
     "freeUpTo": 8, "vipFrom": 9, "desc": "被赶出豪门的私厨少女靠一手绝活逆风翻盘。", "commentsCount": 12800},
    {"id": "sd_guanjia", "type": "drama", "title": "首富的临时管家", "episodeCount": 60, "updatedTo": 60,
     "cover": cover("sd_guanjia", "竖屏短剧封面,西装管家与豪宅"), "heat": 7860, "likes": 289000, "follows": 39800,
     "freeUpTo": 8, "vipFrom": 9, "desc": "落魄小伙误入首富家当管家,身份反转不断。", "commentsCount": 10400},
    {"id": "sd_chuanshu", "type": "drama", "title": "穿书自救指南", "episodeCount": 45, "updatedTo": 45,
     "cover": cover("sd_chuanshu", "竖屏短剧封面,少女被卷入发光书本"), "heat": 7420, "likes": 245000, "follows": 33100,
     "freeUpTo": 8, "vipFrom": 9, "desc": "社畜少女穿进狗血小说,誓要改写炮灰命运。", "commentsCount": 9200},
    {"id": "sd_yinlong", "type": "drama", "title": "隐龙归来", "episodeCount": 52, "updatedTo": 52,
     "cover": cover("sd_yinlong", "竖屏短剧封面,雨夜都市中的神秘男子"), "heat": 8020, "likes": 301000, "follows": 41700,
     "freeUpTo": 8, "vipFrom": 9, "desc": "隐退战神重回都市,只为查清当年真相。", "commentsCount": 11600},
]

# ---------------------------------------------------------------- 待上线(预约位/新片预告)
UPCOMING = [
    {"id": "u_jiumen", "title": "九门风云", "type": "series", "poster": poster("u_jiumen", "民国探墓题材剧集海报,九扇古门"),
     "dateText": "7月25日上线", "dayOffset": 7, "reserveCount": 32000, "desc": "九大家族守护的秘密即将揭开", "region": "中国大陆", "genre": "悬疑/民国"},
    {"id": "u_zhuisu", "title": "追诉", "type": "series", "poster": poster("u_zhuisu", "检察题材剧海报,法徽与卷宗"),
     "dateText": "7月29日上线", "dayOffset": 11, "reserveCount": 18000, "desc": "十年悬案重启追诉时效倒计时", "region": "中国大陆", "genre": "法治/悬疑"},
    {"id": "u_gongzhu", "title": "公主前传", "type": "series", "poster": poster("u_gongzhu", "古装公主题材剧海报,宫廷红墙"),
     "dateText": "8月2日上线", "dayOffset": 15, "reserveCount": 26000, "desc": "和亲公主的成长与复仇", "region": "中国大陆", "genre": "古装/权谋"},
    {"id": "u_shanhai", "title": "山海来客", "type": "movie", "poster": poster("u_shanhai", "科幻电影海报,巨型飞船降临群山"),
     "dateText": "明日上线", "dayOffset": 1, "reserveCount": 41000, "desc": "山海异兽降临现代都市", "region": "中国大陆", "genre": "科幻/冒险"},
    {"id": "u_yehai", "title": "夜海潜行", "type": "movie", "poster": poster("u_yehai", "潜艇军事电影海报,深海探照灯"),
     "dateText": "8月1日上映", "dayOffset": 14, "reserveCount": 15000, "desc": "深海军事动作巨制", "region": "中国大陆", "genre": "军事/动作"},
    {"id": "u_xingchen", "title": "星尘之约", "type": "anime", "poster": poster("u_xingchen", "唯美科幻动画电影海报,星空下少年少女"),
     "dateText": "8月8日上线", "dayOffset": 21, "reserveCount": 22000, "desc": "跨越星海的约定", "region": "日本", "genre": "动画/爱情"},
]

# ---------------------------------------------------------------- 评论种子(种子片≥6条/部,多样:长评/回复/会员/配图占位)
COMMENT_AVATARS = [
    avatar("comment_01", "参考粉丝头像的可爱吉祥物风格,笑脸小橘子精灵,黄绿色背景,大眼睛,简洁圆润造型"),
    avatar("comment_02", "参考粉丝头像的可爱吉祥物风格,戴蓝色围巾的白色小兔,天蓝色背景,大眼睛,简洁圆润造型"),
    avatar("comment_03", "参考粉丝头像的可爱吉祥物风格,抱爆米花桶的棕色小熊,奶油黄色背景,大眼睛,简洁圆润造型"),
    avatar("comment_04", "参考粉丝头像的可爱吉祥物风格,戴耳机的圆滚滚小企鹅,淡紫色背景,大眼睛,简洁圆润造型"),
    avatar("comment_05", "参考粉丝头像的可爱吉祥物风格,绿色恐龙宝宝,薄荷绿色背景,大眼睛,简洁圆润造型"),
    avatar("comment_06", "参考粉丝头像的可爱吉祥物风格,戴星星帽的小狐狸,橙粉色背景,大眼睛,简洁圆润造型"),
    avatar("comment_07", "参考粉丝头像的可爱吉祥物风格,草莓牛奶盒精灵,浅粉色背景,大眼睛,简洁圆润造型,包装上无文字"),
    avatar("comment_08", "参考粉丝头像的可爱吉祥物风格,云朵造型的小绵羊,浅蓝色背景,大眼睛,简洁圆润造型"),
]


def cm(i, user, text, day, hm, ip, likes, **kw):
    default_avatar = COMMENT_AVATARS[sum(ord(ch) for ch in i) % len(COMMENT_AVATARS)]
    d = {"id": i, "user": user, "avatar": kw.pop("avatar", default_avatar), "vip": kw.pop("vip", False),
         "text": text, "at": at(day, hm), "ip": ip, "likes": likes,
         "replies": kw.pop("replies", []), "isReview": kw.pop("isReview", False)}
    d.update(kw)
    return d


def rp(i, user, text, day, hm, ip, likes):
    return {"id": i, "user": user, "text": text, "at": at(day, hm), "ip": ip, "likes": likes}


SEED_COMMENTS = {
    "m_yueguang": [
        cm("cmt_yg_1", "白衣胜雪", "三十年了,每次看到月光下那句告白还是会泪崩。", -2, "21:14", "IP:北京", 8213, vip=True),
        cm("cmt_yg_2", "阿呆看片", "帧享4K修复版的画质太顶了,燃烧的晚霞每一帧都能当壁纸。", -2, "22:40", "IP:广东", 5120,
           replies=[rp("cmt_yg_2r1", "路过的风", "同感,修复组立大功", -1, "08:12", "IP:江苏", 231)]),
        cm("cmt_yg_3", "只看结局", "长评:洛小星戴上金箍的那一刻,其实他已经放下了所有执念。这部片子讲的从来不是穿越,而是遗憾本身……(展开)", -1, "23:05", "IP:四川", 9876, isReview=True),
        cm("cmt_yg_4", "巷口老猫", "00:42:10 这段配乐一起,鸡皮疙瘩就下来了。", -1, "19:32", "IP:上海", 2310),
        cm("cmt_yg_5", "Momo不吃鱼", "带爸妈二刷,他们居然也看哭了。", 0, "10:21", "IP:浙江", 1420),
        cm("cmt_yg_6", "键盘侠克星", "有一说一,经典就是经典,新片学着点。", 0, "12:44", "IP:山东", 987),
    ],
    "m_xunyao1": [
        cm("cmt_xy1_1", "团团后援会", "团团也太可爱了吧!!谁能拒绝一只会撒娇的小妖!", -3, "20:11", "IP:福建", 6321),
        cm("cmt_xy1_2", "特效考究党", "毛发特效在2015年算天花板了,现在看也不过时。", -3, "21:47", "IP:北京", 3211, vip=True),
        cm("cmt_xy1_3", "影评人老周", "影评:合家欢外壳下藏着关于偏见与接纳的表达,完成度极高。", -2, "09:30", "IP:湖北", 7654, isReview=True),
        cm("cmt_xy1_4", "爆米花星人", "客栈打戏笑死我了,前排的妖都看呆了哈哈哈哈", -2, "14:02", "IP:江苏", 2109,
           replies=[rp("cmt_xy1_4r1", "楼上的妖", "谢谢,有被内涵到", -2, "15:00", "IP:江苏", 456),
                    rp("cmt_xy1_4r2", "爆米花星人", "回复 楼上的妖:哈哈哈哈对不住", -2, "15:20", "IP:江苏", 120)]),
        cm("cmt_xy1_5", "粤语原声党", "粤语版配音更有味道,推荐切换语言再刷一遍。", -1, "18:25", "IP:广东", 1876),
        cm("cmt_xy1_6", "路人甲乙丙", "陪娃看的,结果自己入坑了,已三刷。", 0, "11:11", "IP:安徽", 890),
    ],
    "m_xunyao2": [
        cm("cmt_xy2_1", "团团后援会", "团团走丢那段哭死我了,导演你赔我眼泪!", -4, "20:30", "IP:福建", 4521),
        cm("cmt_xy2_2", "夜市小贩", "灯笼夜市那场戏美术满分,想去实地打卡。", -4, "21:10", "IP:云南", 2311),
        cm("cmt_xy2_3", "冷静观影员", "剧情比第一部弱一点,但笑点密度更高,值回票价。", -3, "10:05", "IP:北京", 3450),
        cm("cmt_xy2_4", "赌坊常客", "老板娘一出场我就知道稳了,气场两米八。", -2, "22:18", "IP:上海", 1980, vip=True),
        cm("cmt_xy2_5", "细节控", "01:12:33 面具人摘面具前手抖了一下,细节绝了。", -1, "20:47", "IP:浙江", 1654),
        cm("cmt_xy2_6", "隔壁老王", "合家欢首选,全家笑成一团。", 0, "09:58", "IP:河南", 760),
    ],
    "m_xunyao3": [
        cm("cmt_xy3_1", "灵界导游", "四灵设定超带感!每只妖的设计都能单独出手办。", -2, "19:22", "IP:广东", 5230),
        cm("cmt_xy3_2", "十年老粉", "从第一部追到第三部,全员回归这波爷青回。", -2, "20:15", "IP:江苏", 4870, vip=True),
        cm("cmt_xy3_3", "影评人老周", "影评:三部曲收官之作,把『家』的主题落到了实处,配乐尤其出彩。", -1, "09:41", "IP:湖北", 6120, isReview=True),
        cm("cmt_xy3_4", "限免冲鸭", "限免中!快喊朋友来看,不亏!", -1, "12:30", "IP:四川", 2540),
        cm("cmt_xy3_5", "石门吐槽君", "封门大战特效经费在燃烧,IMAX 感拉满。", 0, "15:12", "IP:北京", 1930),
        cm("cmt_xy3_6", "泪点低选手", "结尾团团回头那一眼,直接破防。", 0, "21:05", "IP:上海", 3210,
           replies=[rp("cmt_xy3_6r1", "同为泪点低", "+1,纸巾不够用", 0, "21:30", "IP:天津", 210)]),
    ],
    "m_xueshan3": [
        cm("cmt_xs3_1", "熊孩子他爸", "带娃三刷,阿墩憨得可爱,配音也灵。", -3, "10:12", "IP:北京", 3120),
        cm("cmt_xs3_2", "法语区留子", "法语配音意外地搭,切语言玩出了新花样。", -2, "22:01", "IP:上海", 1450),
        cm("cmt_xs3_3", "武术指导路过", "白狼王的招式设计有讲究,不是乱打。", -2, "16:44", "IP:河北", 2210, vip=True),
        cm("cmt_xs3_4", "雪山编外人员", "长评:三部曲把『天赋与努力』讲透了,阿墩从来不是天才……(展开)", -1, "20:33", "IP:江苏", 4310, isReview=True),
        cm("cmt_xs3_5", "爆米花星人", "打戏爽,笑点密,合家欢标杆。", 0, "13:20", "IP:浙江", 980),
        cm("cmt_xs3_6", "阿墩嘴替", "看完好想吃包子,谁懂。", 0, "18:09", "IP:四川", 1230),
    ],
    "s_xiaoao:1": [
        cm("cmt_xa1_1", "剑气纵横", "第一集打戏就这么舍得下本,武侠魂回来了!", -1, "20:05", "IP:北京", 5320, vip=True),
        cm("cmt_xa1_2", "原著十级学者", "改编很尊重原著气质,令狐苏的痞气拿捏住了。", -1, "20:40", "IP:江苏", 4210,
           replies=[rp("cmt_xa1_2r1", "路人书粉", "选角确实神了", -1, "21:00", "IP:浙江", 312)]),
        cm("cmt_xa1_3", "配乐雷达", "主题曲一响 DNA 动了,笛声绝美。", -1, "21:15", "IP:广东", 2980),
        cm("cmt_xa1_4", "武侠考据党", "镖局的规矩、切口都有考据,剧组用心了。", 0, "09:12", "IP:山西", 1870),
        cm("cmt_xa1_5", "追剧特种兵", "一口气看完试看集,果断开会员追了。", 0, "12:30", "IP:上海", 1540),
        cm("cmt_xa1_6", "弹幕搬运工", "满屏『侠气拉满』,大家眼睛雪亮。", 0, "14:44", "IP:四川", 920),
    ],
    "s_xiaoao:2": [
        cm("cmt_xa2_1", "剑气纵横", "华金城大会群像戏调度太强,每个门派都有戏。", 0, "20:10", "IP:北京", 3120),
        cm("cmt_xa2_2", "五岳观察员", "各派掌门的心思全写在脸上又不点破,高级。", 0, "20:35", "IP:湖南", 2210),
        cm("cmt_xa2_3", "追剧特种兵", "节奏丝毫不拖,第二集就埋了三条线。", 0, "21:02", "IP:上海", 1890, vip=True),
        cm("cmt_xa2_4", "路见不平君", "反派声优太带感了,起鸡皮疙瘩。", 0, "21:30", "IP:辽宁", 1320),
        cm("cmt_xa2_5", "盈盈护卫队", "预告里盈盈要出场了!蹲第三集!", 0, "22:00", "IP:江苏", 2760),
        cm("cmt_xa2_6", "冷静观影员", "打斗实拍比例很高,慢镜头用得克制,好评。", 0, "22:41", "IP:北京", 980),
    ],
    "s_anxiang:1": [
        cm("cmt_ax1_1", "香料铺掌柜", "以香入局的设定太新了,每种香方都有出处。", -2, "20:20", "IP:江苏", 4520),
        cm("cmt_ax1_2", "古偶质检员", "服化道在线,女主眼神里有戏,不是花瓶。", -2, "21:05", "IP:浙江", 3890, vip=True),
        cm("cmt_ax1_3", "摄政王发言人", "厉北辰出场三分钟,弹幕全在刷『锁死』。", -1, "19:30", "IP:广东", 5120,
           replies=[rp("cmt_ax1_3r1", "已锁死", "锁死+1", -1, "19:45", "IP:福建", 640)]),
        cm("cmt_ax1_4", "考据小分队", "调香手法请了非遗顾问,片尾字幕有写。", -1, "20:10", "IP:北京", 2130),
        cm("cmt_ax1_5", "甜党代表", "限免真香,已安利全宿舍。", 0, "12:15", "IP:上海", 1760),
        cm("cmt_ax1_6", "只嗑这一对", "好耶", 0, "13:01", "IP:江苏", 45),
    ],
    "sd_nixi:1": [
        cm("cmt_nx1_1", "干饭第一名", "小厨娘手速太爽了,解压神剧!", -1, "12:20", "IP:湖南", 3210),
        cm("cmt_nx1_2", "短剧品鉴官", "反转密度合格,一集一个巴掌,期待后面。", -1, "13:05", "IP:北京", 2140),
        cm("cmt_nx1_3", "路过吃瓜", "女主翻锅那下是真功夫吧?", 0, "10:11", "IP:广东", 1320,
           replies=[rp("cmt_nx1_3r1", "剧组场务", "实拍,练了俩月", 0, "10:40", "IP:横店", 890)]),
        cm("cmt_nx1_4", "熬夜冠军", "一口气刷到 20 集,根本停不下来。", 0, "11:30", "IP:江苏", 1980),
        cm("cmt_nx1_5", "美食雷达", "每道菜都想吃,深夜勿看!", 0, "14:22", "IP:四川", 1120),
        cm("cmt_nx1_6", "短剧考古学家", "这题材去年就火,但这部拍得最细。", 0, "15:40", "IP:上海", 760),
    ],
}

DEFAULT_COMMENTS = [
    cm("cmt_d1", "热心观众", "节奏很好,不知不觉就看完了。", -1, "20:00", "IP:北京", 320),
    cm("cmt_d2", "沙发管理员", "前排围观,画质在线。", -1, "20:30", "IP:上海", 210),
    cm("cmt_d3", "追剧日常", "已加追,蹲更新。", 0, "10:15", "IP:江苏", 180),
    cm("cmt_d4", "打分侠", "优酷评分不虚,值得一看。", 0, "12:40", "IP:广东", 150),
    cm("cmt_d5", "弹幕少年", "弹幕氛围太欢乐了哈哈哈", 0, "15:22", "IP:四川", 96),
    cm("cmt_d6", "理性讨论组", "有些桥段略套路,总体瑕不掩瑜。", 0, "18:05", "IP:浙江", 84),
]

SEED_DANMAKU = {
    "m_yueguang": ["名场面预警!", "这段封神", "泪目了家人们", "4K修复太清晰了", "考古成功", "前方高能", "BGM一响爷青回", "谁还没看过啊快来", "三十年后再看依然震撼"],
    "m_xunyao1": ["团团太可爱了", "哈哈哈哈哈哈", "特效经费在燃烧", "妖界颜值担当", "小妖举高高", "这里笑死", "全场最佳:团团", "护妖师帅炸"],
    "m_xunyao2": ["夜市美术满分", "老板娘气场全开", "泪点来了", "面具人是谁?!", "第二部更好笑", "团团别怕", "前方泪点预警", "美术组加鸡腿"],
    "m_xunyao3": ["四灵登场!", "灵界之门好震撼", "全员回归爷青回", "封门大战开始", "特效炸裂", "结局哭死", "三部曲完美收官", "团团回头杀"],
    "m_xueshan3": ["阿墩冲鸭", "白狼王好帅", "笑不活了", "配音好评", "打戏行云流水", "合家欢天花板", "想吃包子+1", "熊熊拳法!"],
    "s_xiaoao:1": ["侠气拉满", "打戏太顶了", "笛声一响DNA动了", "令狐苏好痞", "这选角绝了", "镖局规矩有考据", "第一集就高能", "武侠回来了"],
    "s_xiaoao:2": ["群像调度好强", "各派心思浮出水面", "反派声音好苏", "盈盈快出场!", "节奏丝滑", "三条线齐开", "掌门人修罗场", "下集更精彩"],
    "s_anxiang:1": ["香方好讲究", "厉北辰!!", "锁死这对", "服化道在线", "女主眼里有戏", "非遗顾问好评", "甜疯了", "限免冲!"],
    "sd_nixi:1": ["手速惊人", "一集一个巴掌", "解压神剧", "翻锅是真功夫", "根本停不下来", "深夜勿看会饿", "女主好飒", "蹲反转"],
}
DEFAULT_DANMAKU = ["前方高能", "哈哈哈哈哈", "画质太顶了", "已加追", "这里泪目", "名场面+1", "谁懂啊家人们", "进度条不多了", "二刷打卡", "弹幕护体"]

# ---------------------------------------------------------------- 榜单/搜索/话题/楼层
RANKS = {
    "hot": ["s_xiaoao", "m_yueguang", "s_anxiang", "a_canglan", "v_benpao", "m_xunyao3", "s_xuanan", "m_menfeng", "v_baichu", "sd_nixi"],
    "drama": ["s_xiaoao", "s_anxiang", "s_xuanan", "s_qiaochu", "s_boyi", "s_shengong", "s_ruqingyun", "s_chunnuan", "s_zhulou"],
    "variety": ["v_benpao", "v_baichu", "v_xiyou", "v_shengxia"],
    "movie": ["m_yueguang", "m_xunyao3", "m_kuangben", "m_menfeng", "m_xunyao1", "m_xueshan3", "m_weicheng", "m_xunbao", "m_langchao", "m_gansidui"],
    "anime": ["a_canglan", "a_shenzhong", "a_shixiong", "a_gaowu", "a_tuili"],
    "kids": ["k_pike", "k_caoyuan", "k_lele", "k_feigou"],
    "microdrama": ["sd_nixi", "sd_yinlong", "sd_guanjia", "sd_chuanshu"],
}

SEARCH_HOTWORDS = [
    {"word": "古董迷局", "tag": "飙升"},
    {"word": "月光宝殿", "tag": ""},
    {"word": "暗香令", "tag": "热"},
    {"word": "新笑傲山河", "tag": ""},
    {"word": "寻妖记3", "tag": ""},
    {"word": "百厨争霸", "tag": ""},
]
SEARCH_HISTORY = ["迷雾信标", "山河故人录", "世界杯集锦", "暗香令"]
DISCOVER_TAGS = [
    [{"word": "末路狂奔", "tag": "荐"}, {"word": "沧澜图", "tag": "热"}, {"word": "夏日限定甜剧", "tag": ""},
     {"word": "门缝里的光", "tag": "悬疑片"}, {"word": "百厨争霸", "tag": ""}, {"word": "深宫岁月", "tag": "历史片"},
     {"word": "雪山熊师3", "tag": "喜剧片"}, {"word": "隐龙归来", "tag": ""}, {"word": "竹林熊猫日记", "tag": ""}, {"word": "九门风云", "tag": ""}],
    [{"word": "悬案十三宗", "tag": "热"}, {"word": "翘楚风云", "tag": "荐"}, {"word": "我的西行记", "tag": ""},
     {"word": "入青云道", "tag": ""}, {"word": "水下秘境", "tag": ""}, {"word": "少年盛夏", "tag": ""},
     {"word": "朱楼旧梦", "tag": "经典"}, {"word": "逆袭小厨娘", "tag": "短剧"}, {"word": "一座桥", "tag": ""}, {"word": "电竞大师赛纪实", "tag": ""}],
]
TOPICS = [
    {"id": "tp1", "name": "二次元铁粉集结", "heatText": "178.1万次互动"},
    {"id": "tp2", "name": "今夏最上头古偶", "heatText": "152.6万次互动"},
    {"id": "tp3", "name": "武侠名场面考古", "heatText": "121.3万次互动"},
    {"id": "tp4", "name": "一句台词证明你看过", "heatText": "98.7万次互动"},
    {"id": "tp5", "name": "年度悬疑黑马", "heatText": "87.2万次互动"},
    {"id": "tp6", "name": "下饭综艺大赏", "heatText": "76.9万次互动"},
    {"id": "tp7", "name": "国漫名景截图大赛", "heatText": "65.4万次互动"},
    {"id": "tp8", "name": "短剧上头瞬间", "heatText": "54.8万次互动"},
    {"id": "tp9", "name": "带爸妈看什么", "heatText": "43.1万次互动"},
    {"id": "tp10", "name": "深夜美食番安利", "heatText": "38.6万次互动"},
    {"id": "tp11", "name": "被低估的宝藏纪录片", "heatText": "29.5万次互动"},
    {"id": "tp12", "name": "我的追剧仪式感", "heatText": "21.7万次互动"},
]

HOME = {
    "focusBanner": [
        {"id": "m_yueguang", "tagline": "帧享4K · 奇幻 爱情 · 经典重映"},
        {"id": "s_xiaoao", "tagline": "VIP · 武侠 古装 · 37集全"},
        {"id": "d_diqiu", "tagline": "帧享 · 自然 纪录 · 8集全"},
    ],
    "floors": [
        {"title": "今日给您的专属推荐", "style": "grid6", "ids": ["s_xiaoao", "m_xunyao3", "s_anxiang", "a_canglan", "v_baichu", "m_kuangben"]},
        {"title": "猜你喜欢", "style": "grid3", "ids": ["m_menfeng", "s_xuanan", "m_yueguang", "s_qiaochu", "a_shenzhong", "m_xueshan3"]},
        {"title": "险象丛生·国产冒险电影", "style": "row3", "ids": ["m_xunbao", "m_langchao", "m_gansidui"]},
        {"title": "热门国产悬疑电影", "style": "row3", "ids": ["m_menfeng", "m_weicheng", "s_xuanan"]},
        {"title": "寻宝之旅即刻启程", "style": "row3", "ids": ["m_xunbao", "m_xunyao1", "m_tonghua"]},
        {"title": "原著党别错过·悬疑好片", "style": "row3", "ids": ["m_menfeng", "s_xuanan", "m_weicheng"]},
    ],
}

CHANNELS = {
    "content": [
        {"id": "drama", "name": "剧集"}, {"id": "anime", "name": "动漫"}, {"id": "movie", "name": "电影"},
        {"id": "variety", "name": "综艺"}, {"id": "kids", "name": "少儿"},
    ],
    "lite": [
        {"id": "documentary", "name": "纪录片"}, {"id": "sports", "name": "体育"},
        {"id": "humanities", "name": "人文"}, {"id": "game", "name": "游戏"},
    ],
}
CHANNEL_CONFIG = {
    "drama": {"filters": ["全部", "排行榜", "爆款IP", "人间宝藏", "港剧"],
              "rankTabs": ["热度榜", "N刷榜", "必看榜", "7日畅销榜", "年度畅销榜"],
              "opFloor": {"showId": "s_chunnuan", "title": "春暖花溪3", "sub": "每周五更新"},
              "upcomingTitle": "135部新剧·即将上线", "upcomingIds": ["u_jiumen", "u_zhuisu", "u_gongzhu"]},
    "movie": {"filters": ["全部", "N刷榜", "功夫专场", "喜剧大师", "必得周边"],
              "rankTabs": ["热度榜", "高分榜", "热搜榜", "票房榜", "飙升榜", "院线榜"],
              "bannerId": "m_yueguang",
              "upcomingTitle": "104部新片·即将上线", "upcomingIds": ["u_shanhai", "u_yehai"]},
    "variety": {"filters": ["全部", "排行榜", "我的西行记", "百厨争霸"],
                "rankTabs": ["热度榜", "飙升榜"],
                "opFloor": {"showId": "v_xiyou", "title": "我的西行记", "sub": "每周五更新",
                            "episodes": ["EP8上", "EP8下", "EP7上", "EP7下"]}},
    "anime": {"filters": ["全部", "排行榜", "加更礼"], "rankTabs": ["热度榜", "N刷榜", "必看榜"],
              "upcomingTitle": "22部新番·即将上线", "upcomingIds": ["u_xingchen"]},
    "kids": {"entries": ["全部动画", "听音频", "趣互动", "乐学", "成长营"],
             "ages": ["0-3岁", "3-6岁", "6岁+"], "tags": ["推荐", "冒险", "益智", "汽车", "玩具"]},
    "documentary": {"chips": ["找片", "排行榜", "每月限免", "国宝档案"], "ids": ["d_diqiu", "d_xiongmao", "d_shuixia"]},
    "humanities": {"chips": ["全部", "思享剧场", "百家夜谈", "曲艺专场"], "ids": ["h_yizuoqiao", "h_yuanzhuo"]},
    "game": {"entries": ["全部", "荣耀战场", "趣味乐园", "元气世界", "求生行动", "游戏短剧", "即点即玩", "推理之夜", "竞速前线"], "ids": ["g_dianjing"]},
    "sports": {"note": "直播类整页 wontfix(00-scope),仅静态版面"},
}

FAV_TYPES = {
    "tabs": [{"id": "chuanqi", "name": "传奇"}, {"id": "guou", "name": "古偶"}, {"id": "nvxing", "name": "女性"},
             {"id": "youqing", "name": "友情"}, {"id": "guoman", "name": "国漫"}, {"id": "rexue", "name": "热血"}],
    "chuanqi": ["s_qiaochu", "s_shengong", "s_zhulou", "s_xiaoao"],
    "guou": ["s_anxiang", "s_ruqingyun", "s_zhulou", "s_shengong"],
    "nvxing": ["s_boyi", "s_qiaochu", "s_anxiang", "sd_nixi"],
    "youqing": ["v_shengxia", "s_chunnuan", "v_benpao", "m_kuangben"],
    "guoman": ["a_canglan", "a_shenzhong", "a_shixiong", "a_gaowu"],
    "rexue": ["a_gaowu", "a_canglan", "m_gansidui", "g_dianjing"],
}

VIP_PLANS = {
    "vip": [
        {"id": "monthly", "name": "连续包月", "price": 12, "origin": 25, "cornerTag": "首月特惠"},
        {"id": "quarter", "name": "连续包季", "price": 35, "origin": 68, "cornerTag": ""},
        {"id": "year", "name": "连续包年", "price": 118, "origin": 238, "cornerTag": ""},
    ],
    "svip": [
        {"id": "monthly", "name": "连续包月", "price": 12, "origin": 35, "cornerTag": "SVIP新用户专享"},
        {"id": "year", "name": "连续包年", "price": 228, "origin": 348, "cornerTag": "首年特惠"},
        {"id": "quarter", "name": "连续包季", "price": 98, "origin": 0, "cornerTag": ""},
    ],
}

# ---------------------------------------------------------------- 用户与个人数据种子
data = {
    "user": {
        "nickname": "Chenn_7890",
        "gender": "女",
        "birthday": "",
        "bio": "",
        "ip": "IP属地:江苏",
        "avatar": img("avatars/user_chenn.png", "avatar_round", "黄色连帽卡通小人默认头像(优酷吉祥物风)"),
        "likeCount": 12,
        "coinText": "酷金币:签到礼",
    },
    "membership": {"active": False, "tier": None},
    "catalog": CATALOG,
    "episodeSynopsis": EPISODE_SYNOPSIS,
    "shorts": SHORTS,
    "shortDramas": SHORT_DRAMAS,
    "creators": CREATORS,
    "recommendCreatorIds": RECOMMEND_CREATORS,
    "seedFollowingCreatorIds": SEED_FOLLOWING,
    "seedFans": [
        {"userId": "f_qingtian", "name": "晴天小柚", "avatar": avatar("f_qingtian", "柚子卡通头像,黄绿背景"),
         "sign": "爱看古偶的小柚子", "followedBack": False},
        {"userId": "f_muzi", "name": "木子有点忙", "avatar": avatar("f_muzi", "树苗卡通头像,绿色背景"),
         "sign": "悬疑片十级学者", "followedBack": False},
        {"userId": "f_dundun", "name": "炖炖不吃鱼", "avatar": avatar("f_dundun", "猫咪卡通头像,橘色背景"),
         "sign": "综艺下饭,谁懂", "followedBack": True},
    ],
    "commentAvatars": COMMENT_AVATARS,
    "seedComments": SEED_COMMENTS,
    "defaultComments": DEFAULT_COMMENTS,
    "seedDanmaku": SEED_DANMAKU,
    "defaultDanmaku": DEFAULT_DANMAKU,
    # 历史≥7:电影/剧集(带集数+进度)/短视频(合辑来源)/综艺/人文/少儿
    "seedHistory": [
        {"id": "m_yueguang", "ctype": "movie", "progressSec": 1520, "durationSec": 6180, "at": at(0, "21:40")},
        {"id": "s_xiaoao", "ctype": "series", "episode": 1, "progressSec": 2400, "durationSec": 2700, "at": at(0, "20:10")},
        {"id": "sv01", "ctype": "short", "progressSec": 214, "durationSec": 214, "at": at(0, "19:02")},
        {"id": "sv03", "ctype": "short", "progressSec": 120, "durationSec": 428, "at": at(0, "18:55")},
        {"id": "s_anxiang", "ctype": "series", "episode": 1, "progressSec": 50, "durationSec": 2520, "at": at(-1, "22:30")},
        {"id": "m_xueshan3", "ctype": "movie", "progressSec": 5700, "durationSec": 5700, "at": at(-1, "20:15")},
        {"id": "v_baichu", "ctype": "series", "episode": 2, "progressSec": 1800, "durationSec": 5100, "at": at(-1, "12:40")},
        {"id": "h_yuanzhuo", "ctype": "series", "episode": 2, "progressSec": 600, "durationSec": 3600, "at": at(-2, "23:05")},
        {"id": "k_pike", "ctype": "series", "episode": 12, "progressSec": 300, "durationSec": 300, "at": at(-2, "17:20")},
        {"id": "sd_nixi", "ctype": "drama", "episode": 21, "progressSec": 30, "durationSec": 120, "at": at(-2, "13:10")},
    ],
    # 在追(含新笑傲山河 + 1部短剧)
    "seedLibFollowing": [
        {"id": "s_xiaoao", "ctype": "series", "at": at(0, "19:40"), "progressText": "观看至3集", "perk": ""},
        {"id": "s_anxiang", "ctype": "series", "at": at(-1, "22:35"), "progressText": "观看至1集2%", "perk": "SVIP提前看1集"},
        {"id": "s_qiaochu", "ctype": "series", "at": at(-3, "20:00"), "progressText": "未观看", "perk": ""},
        {"id": "sd_nixi", "ctype": "drama", "at": at(-2, "13:12"), "progressText": "看到第21集", "perk": ""},
    ],
    # 收藏3(spec s242 均为短视频)
    "seedFavorites": [
        {"id": "sv02", "ctype": "short", "at": at(-1, "21:00"), "progressText": "观看至64%"},
        {"id": "sv05", "ctype": "short", "at": at(-2, "12:30"), "progressText": "观看至100%"},
        {"id": "sv07", "ctype": "short", "at": at(-3, "19:45"), "progressText": "观看至12%"},
    ],
    "seedReservations": ["u_jiumen"],
    # 喜欢tab种子(点赞行为联动 qa:Q7)
    "seedLikes": [
        {"id": "sv04", "ctype": "short", "at": at(-1, "20:20")},
        {"id": "sv06", "ctype": "short", "at": at(-2, "18:10")},
        {"id": "m_yueguang", "ctype": "movie", "at": at(-2, "21:50")},
    ],
    # 互动tab种子:在《暗香令 01》发布的评论「好耶」(s252)
    "seedInteractions": [
        {"id": "itc_1", "text": "好耶", "contentId": "s_anxiang", "episode": 1, "at": at(0, "22:30"), "liked": False},
    ],
    # 订单≥5(s249:VIP购买记录,实付款样式)
    "orders": [
        {"id": "od_1", "title": "1天VIP会员体验", "priceText": "¥1", "paidText": "¥1.00", "at": at(-2, "21:08"), "status": "交易成功"},
        {"id": "od_2", "title": "月度VIP会员", "priceText": "¥20", "paidText": "¥20.00", "at": at(-9, "10:32"), "status": "交易成功"},
        {"id": "od_3", "title": "VIP连续包月(首月特惠)", "priceText": "¥12", "paidText": "¥12.00", "at": at(-40, "22:15"), "status": "交易成功"},
        {"id": "od_4", "title": "酷金币兑换·观影券", "priceText": "¥0", "paidText": "¥0.00", "at": at(-55, "16:44"), "status": "交易成功"},
        {"id": "od_5", "title": "单点付费影片《危城迷案》", "priceText": "¥6", "paidText": "¥6.00", "at": at(-70, "20:03"), "status": "交易成功"},
        {"id": "od_6", "title": "1天SVIP会员体验", "priceText": "¥1", "paidText": "¥1.00", "at": at(-88, "09:21"), "status": "交易成功"},
    ],
    "upcoming": UPCOMING,
    # 消息:官方会话3(vip/system/assistant)/系统2条/赞1条
    "notices": {
        "likes": [
            {"id": "nt_like_1", "user": "剧荒终结者", "action": "赞了你的评论", "contentId": "s_anxiang", "episode": 1,
             "commentId": "cmt_ax1_6", "quote": "你在《暗香令 01》的评论: 好耶[哈哈]", "at": at(0, "22:32")},
        ],
        "comments": [
            {"id": "nt_cmt_1", "user": "滔滔影视", "action": "回复了你的评论", "contentId": "s_anxiang", "episode": 1,
             "commentId": "cmt_ax1_6", "text": "哈哈哈同感,这段真的好耶", "quote": "你在《暗香令 01》的评论: 好耶[哈哈]", "at": at(0, "22:40")},
        ],
        "danmu": [],
        "fans": [],
    },
    "conversations": {
        "vip": [
            {"id": "cv_vip_1", "at": at(0, "22:11"), "text": "尊敬的用户,您有一张VIP首月特惠券即将到期,首月仅12元畅享会员内容,可前往会员中心查阅。"},
        ],
        "system": [
            {"id": "cv_sys_1", "at": at(-25, "11:00"), "text": "【会员权益调整通知】自下月起,VIP会员新增『帧享60帧』专区权益,原有权益保持不变,详情可前往会员中心查阅。"},
            {"id": "cv_sys_2", "at": at(-92, "19:00"), "text": "【服务协议优化】我们更新了《会员服务协议》与《隐私政策》部分条款,以更清晰地说明数据使用方式。继续使用即代表您同意更新后的条款,感谢您的理解与支持。"},
        ],
        "assistant": [],
    },
    "unread": {"likes": 1, "comments": 1, "danmu": 0, "fans": 0, "vip": 1, "system": 1},
    "searchHistory": SEARCH_HISTORY,
    "searchHotwords": SEARCH_HOTWORDS,
    "discoverTags": DISCOVER_TAGS,
    "ranks": RANKS,
    "topics": TOPICS,
    "home": HOME,
    "channels": CHANNELS,
    "channelConfig": CHANNEL_CONFIG,
    "favTypes": FAV_TYPES,
    "vipPlans": VIP_PLANS,
    "settings": {
        "touchId": False, "skipIntro": True, "autoPlayNoWifi": False, "dataTip": True,
        "bgAutoPlay": False, "dataDownload": False, "downloadSound": True,
    },
    "storage": {"downloadedText": "0B", "freeText": "剩余260.3G空间"},
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
MANIFEST_OUT.write_text(json.dumps({
    "note": "优酷复刻图片素材清单(缺失时 UI 回落 components/Img.tsx 的深色 SVG 占位)。"
            "prompt 末尾统一追加『无任何文字无水印』;海报不得含真实明星肖像/真实片名(design-tokens.md 批量生图需求清单)。",
    "categories": {
        "poster_2x3": "影视海报·竖版 2:3",
        "still_16x9": "横版剧照 16:9",
        "shorts_cover_16x9": "短视频/短剧封面",
        "avatar_round": "圆形头像",
    },
    "images": _manifest,
}, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"defaults.json written: {OUT} ({OUT.stat().st_size} bytes)")
print(f"image manifest written: {MANIFEST_OUT} ({len(_manifest)} images)")
