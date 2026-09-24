# -*- coding: utf-8 -*-
"""用 OpenAI gpt-image-2 API 重新生成 100 张专辑封面 + 61 张主播头像。
需要梯子:代理 http://127.0.0.1:7890
强制覆盖:先删除所有旧 .png 再重新生成。
并发 4,每张约 30-60 秒,总计约 30-40 分钟。"""
import os, json, base64, time, concurrent.futures as cf
import requests

# ============ OpenAI API 配置 ============
API_KEY = "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"
MODEL = "gpt-image-2"
BASE_URL = "https://api.openai.com/v1/images/generations"
PROXIES = {"http": "http://127.0.0.1:7890", "https": "http://127.0.0.1:7890"}
TIMEOUT = 300

HERE = os.path.dirname(__file__)
COVERS_DIR = os.path.join(HERE, "covers")
AVATARS_DIR = os.path.join(HERE, "avatars")
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(AVATARS_DIR, exist_ok=True)

COVER_SUFFIX = ",方形专辑封面配图,高质量插画,画面中不要出现任何文字、字母、数字、水印或logo"
AVA_SUFFIX = ",圆形头像照片风格,高质量人像,画面中不要出现任何文字、字母、数字、水印或logo"

# ====================================================================
# 100 张封面 prompt
# ====================================================================
COVERS = {
 "a_novel":  "奇幻星河宇宙,深蓝紫色星空与光带,玄幻小说封面插画",
 "nv01":     "混沌漩涡与神秘符文,暗紫色光芒,修仙玄幻封面插画",
 "nv02":     "古老传送门与万界光门,蓝绿色能量,异界玄幻封面插画",
 "nv03":     "上古神魔对峙,金红色天际,神魔玄幻封面插画",
 "nv04":     "九天云霄与帝座宫殿,深蓝色苍穹,热血玄幻封面插画",
 "nv05":     "浮空岛屿与灵气光晕,青紫色天空,玄幻封面插画",
 "a_myst":   "迷雾森林与神秘档案,幽暗绿色调,悬疑推理封面插画",
 "nm01":     "暗夜城市与追凶剪影,深蓝黑色调,犯罪悬疑封面插画",
 "nm02":     "密室机关与谜题线索,暖黄暗色调,推理悬疑封面插画",
 "nm03":     "心理迷宫与破碎镜面,紫灰色调,心理悬疑封面插画",
 "nm04":     "老旧电台与诡异信号波,暗绿冷色调,灵异悬疑封面插画",
 "nd01":     "现代都市天际线与写字楼,蓝灰色调,职场都市封面插画",
 "nd02":     "玻璃幕墙与商务人群,蓝绿色调,商战都市封面插画",
 "nd03":     "医院走廊与白衣医生,浅蓝白色调,医疗都市封面插画",
 "nd04":     "法庭法槌与法律书籍,深棕暖色调,律政都市封面插画",
 "nd05":     "校园操场与青春剪影,暖黄绿色调,校园都市封面插画",
 "nr01":     "古典园林与桃花扇,粉红色调,古代言情封面插画",
 "nr02":     "时空漩涡与双人剪影,紫粉色调,穿越言情封面插画",
 "nr03":     "现代咖啡厅与情侣剪影,暖橙粉色调,现代言情封面插画",
 "nr04":     "夏日花海与青春背影,粉黄色调,青春言情封面插画",
 "nw01":     "江湖夜雨与油纸伞,水墨深蓝色调,武侠封面插画",
 "nw02":     "西风骏马与长剑,苍茫黄褐色调,武侠封面插画",
 "nw03":     "山间古道与侠客剪影,青灰褐色调,武侠封面插画",
 "ns01":     "银河舰队与星云,深蓝青色调,太空科幻封面插画",
 "ns02":     "赛博城市与霓虹电路,紫蓝霓虹色调,赛博科幻封面插画",
 "ns03":     "时间齿轮与钟表迷宫,金蓝色调,时间科幻封面插画",
 "ns04":     "星际飞船与未知星球,深蓝紫色色调,探险科幻封面插画",
 "ne01":     "废墟城市与丧尸剪影,灰绿色调,丧尸末世封面插画",
 "ne02":     "荒芜废土与独行者,黄沙褐色调,废土末世封面插画",
 "ne03":     "变异生物与黎明微光,暗绿黄色调,变异末世封面插画",
 "a_cross":  "传统相声舞台,红色喜庆折扇与醒木,暖色调,曲艺封面插画",
 "xs01":     "长衫相声演员与折扇,红色暖色调,传统相声封面插画",
 "xs02":     "单口相声舞台与聚光灯,暖黄棕色调,单口相声封面插画",
 "xs03":     "群口相声多人剪影,红金色调,群口相声封面插画",
 "xs04":     "现代相声舞台与灯光,蓝红撞色,新派相声封面插画",
 "xs05":     "相声名家肖像剪影与醒木,金红色调,名家相声封面插画",
 "xs06":     "笑脸与相声道具,明快橙红色调,爆笑相声封面插画",
 "xs07":     "春晚舞台与红色灯笼,喜庆红金色调,相声春晚封面插画",
 "a_story":  "古典评书场景,说书人惊堂木与卷轴,深棕暖色,传统曲艺封面插画",
 "ps01":     "三国战场与战旗,金红色调,三国评书封面插画",
 "ps02":     "水浒梁山好汉剪影,深绿棕色调,水浒评书封面插画",
 "ps03":     "西游取经路与祥云,金蓝绿色调,西游评书封面插画",
 "ps04":     "大观园与红楼梦境,粉紫色调,红楼评话封面插画",
 "ps05":     "隋唐英雄与战马,金棕色调,隋唐评书封面插画",
 "ps06":     "封神榜与神仙斗法,金紫色调,封神评书封面插画",
 "a_qyu":    "戏曲脸谱与水袖,红金色传统戏曲,曲艺封面插画",
 "xq01":     "京剧脸谱与蟒袍,红黑金色调,京剧封面插画",
 "xq02":     "越剧水袖与江南园林,粉绿色调,越剧封面插画",
 "xq03":     "黄梅戏舞台与田园风光,黄绿色调,黄梅戏封面插画",
 "xq04":     "豫剧花脸与中原大地,红黄色调,豫剧封面插画",
 "a_kid":    "可爱小熊与月亮星星,温暖橙色卡通,儿童睡前故事封面插画",
 "kd01":     "格林童话城堡与森林,彩色卡通,儿童童话封面插画",
 "kd02":     "安徒生童话海的女儿与城堡,蓝绿色卡通,儿童童话封面插画",
 "kd03":     "阿拉伯宫殿与神灯,金紫色卡通,一千零一夜封面插画",
 "kd04":     "月亮摇篮与星星,柔和蓝紫色调,宝宝睡前音乐封面插画",
 "kd05":     "可爱动物群与森林,明亮彩色卡通,动物寓言封面插画",
 "kd06":     "森林探险与树屋,绿色调卡通,儿童冒险封面插画",
 "kd07":     "海底珊瑚与热带鱼,蓝色调卡通,海底世界封面插画",
 "kd08":     "阳光校园与快乐儿童,暖黄绿色调,儿童成长封面插画",
 "kd09":     "英文字母与彩虹,蓝绿色调卡通,儿童英语封面插画",
 "kd10":     "自然森林与花草蝴蝶,绿色调卡通,自然百科封面插画",
 "kd11":     "科学实验瓶与齿轮,蓝绿色调卡通,科学实验封面插画",
 "kd12":     "人体器官卡通与骨骼,粉蓝色调,人体科普封面插画",
 "kd13":     "历史画卷与古装小人,暖棕黄色调,历史故事封面插画",
 "kd14":     "毛笔竹简与成语卷轴,暖黄棕色调,成语故事封面插画",
 "a_cul":    "中国传统文化,水墨山水与古籍卷轴,青绿色调,国风知识课封面插画",
 "a_biz":    "现代商业城市天际线,简约几何,蓝绿色调,商业课程封面插画",
 "ms01":     "论语竹简与孔子讲学,青褐色调,国学封面插画",
 "ms02":     "唐诗宋词与水墨山水,青绿淡雅色调,诗词鉴赏封面插画",
 "ms03":     "中国画卷与毛笔,水墨淡彩,书画艺术封面插画",
 "ms04":     "茶具与禅意盆景,青绿色调,茶道美学封面插画",
 "ms05":     "创业路标与城市,蓝绿色调,创业课程封面插画",
 "ms06":     "金币与增长曲线,蓝金色调,投资理财封面插画",
 "ms07":     "品牌灯泡与营销图谱,蓝紫色调,品牌营销封面插画",
 "ms08":     "古代中国地图与竹简,褐黄色调,古代史封面插画",
 "ms09":     "近代建筑与变革风云,灰蓝褐色调,近代史封面插画",
 "ms10":     "世界地图与文明遗迹,蓝绿色调,世界文明封面插画",
 "ms11":     "原子粒子与物理公式,深蓝色调,物理学封面插画",
 "ms12":     "DNA双螺旋与细胞,蓝绿色调,生命科学封面插画",
 "ms13":     "星系与望远镜,深紫蓝色调,天文宇宙封面插画",
 "a_cast":   "深夜电台氛围,城市夜景与耳机麦克风,深蓝暗调,播客封面插画",
 "pk01":     "双人对话与心形图案,粉紫色调,恋爱心理封面插画",
 "pk02":     "家庭温馨与双手相握,暖橙色调,婚姻经营封面插画",
 "pk03":     "情绪色块与脑波,蓝紫色调,情绪心理封面插画",
 "pk04":     "互联网网络与数据流,蓝绿色调,互联网观察封面插画",
 "pk05":     "AI芯片与电路脑,蓝紫科技色调,AI封面插画",
 "pk06":     "数码产品与科技元素,蓝灰色调,数码生活封面插画",
 "pk07":     "美食与餐具,暖黄橙色调,美食播客封面插画",
 "pk08":     "旅行背包与世界地图,绿蓝色调,旅行播客封面插画",
 "pk09":     "对话桌与麦克风,深蓝灰色调,访谈播客封面插画",
 "a_hist":   "古代历史场景,青铜器与竹简,暖褐色调,历史知识封面插画",
 "hi01":     "中国历代王朝更迭卷轴,金棕色调,中国通史封面插画",
 "hi02":     "近代炮火与变革旗帜,灰红褐色调,近代风云封面插画",
 "hi03":     "世界地图与古文明遗迹,蓝金色调,世界通史封面插画",
 "hi04":     "秦汉宫殿与兵马俑,赭石色调,秦汉帝国封面插画",
 "hi05":     "唐宋繁华街市与宫阙,金红色调,唐宋繁华封面插画",
 "hi06":     "明清紫禁城与龙纹,红金色调,明清兴衰封面插画",
 "hi07":     "民国街景与老上海,灰黄褐色调,民国往事封面插画",
 "hi08":     "古战场与城墙,灰褐色调,战争文明封面插画",
 "hi09":     "历史人物剪影与卷轴,暖棕色调,历史人物封面插画",
}

# ====================================================================
# 61 张主播头像 prompt
# ====================================================================
AVATARS = {
 # 小说主播
 "an_yh":   "神秘银河系男声主播肖像,深蓝色调,专业麦克风",
 "an_cq":   "儒雅中年男说书人肖像,深紫色背景,沉稳气质",
 "an_mj":   "水墨画风中年男士肖像,青灰色调,文人气质",
 "an_jg":   "古风青年男子肖像,金红色调,九歌风格",
 "an_tx":   "干练青年男声主播肖像,深蓝色调,天行风格",
 "an_yy":   "飘逸长发男子肖像,青紫色调,云隐气质",
 "an_yx":   "戴帽子的夜行者剪影肖像,暗绿色调,悬疑气质",
 "an_bl":   "白鹿意象与青年男子肖像,暖灰色调",
 "an_sj2":  "戴眼镜的心理学男主播肖像,紫灰色调",
 "an_yy2":  "一位声音低沉的悬疑故事男主播,短发,穿深色高领毛衣,坐在专业麦克风前,暗绿色调电台录音室背景,柔和暖光侧面照明,表情神秘沉稳,半身肖像,专业摄影质感",
 "an_lc2":  "都市白领男主播肖像,蓝灰色调",
 "an_qx":   "清新青年女医生肖像,浅蓝白色调",
 "an_mz":   "干练律师男主播肖像,深棕暖色调",
 "an_nk":   "阳光校园男生肖像,暖黄绿色调",
 "an_ws":   "古典美人女子肖像,粉红色调,晚霜气质",
 "an_qq":   "甜美青年女子肖像,暖橙粉色调",
 "an_xm2":  "侠客装扮男子肖像,水墨深蓝色调",
 "an_fy":   "风衣侠客男子剪影,青灰褐色调",
 "an_xy":   "太空人剪影肖像,深蓝青色调",
 "an_hg":   "黑洞科学家男子肖像,深紫色色调",
 "an_hh":   "废土幸存者男子剪影,灰绿色调",
 "an_jy":   "末日战士男子剪影,暗绿黄色调",
 # 相声评书戏曲主播
 "an_dg":   "穿长衫的相声演员肖像,红色暖色调,喜庆",
 "an_ly":   "圆润幽默中年男相声演员肖像,暖黄棕色调",
 "an_xp":   "年轻新派相声演员肖像,蓝红撞色",
 "an_xm":   "醒木先生评书艺术家肖像,深棕暖色调",
 "an_zx":   "知性中年男评书主播肖像,金蓝色调",
 "an_yd":   "远帆评书主播肖像,金棕色调",
 "an_lm":   "梨园客戏曲爱好者肖像,红金色调",
 "an_ly2":  "柳吟越剧女角肖像,粉绿色调",
 "an_zz":   "中原韵豫剧花脸肖像,红黄色调",
 # 儿童主播
 "an_hp":   "慈祥老奶奶讲故事肖像,温暖橙色调",
 "an_yy3":  "温柔年轻女子肖像,柔和蓝紫色调",
 "an_tt":   "活泼卡通虎角色头像,明亮彩色",
 "an_hl":   "海螺意象与海洋风格女子肖像,蓝色调",
 "an_mm":   "可爱年轻幼师女子肖像,暖黄绿色调",
 "an_em":   "专业英语女教师肖像,蓝绿色调",
 "an_zr":   "自然风格年轻女子肖像,绿色调",
 "an_kx":   "戴眼镜的科学少年卡通头像,蓝绿色调",
 "an_ls":   "中年历史教师男子肖像,暖棕黄色调",
 # 大师课主播
 "an_wy":   "国学大师白须老者肖像,青绿色调,文渊先生",
 "an_lc":   "商业精英中年男子肖像,蓝绿色调",
 "an_sy":   "优雅茶道女子肖像,青绿色调",
 "an_yl":   "商业策略师男子肖像,蓝紫色调",
 "an_gz":   "历史学者中年男子肖像,褐黄色调",
 "an_lk":   "白发科学爷爷肖像,深蓝色调",
 "an_xk":   "天文爱好者年轻男子肖像,深紫蓝色调",
 # 播客主播
 "an_yh2":  "深夜电台男主播肖像,深蓝暗调",
 "an_xn":   "温暖心理咨询师女子肖像,粉紫色调",
 "an_qx2":  "情绪研究所年轻男子肖像,蓝紫色调",
 "an_wg":   "互联网观察者男子肖像,蓝绿色调",
 "an_sm":   "数码评测博主男子肖像,蓝灰色调",
 "an_ms":   "美食家中年男子肖像,暖黄橙色调",
 "an_lx":   "旅行背包客男子肖像,绿蓝色调",
 "an_ft":   "专业访谈主持人男子肖像,深蓝灰色调",
 # 历史主播
 "an_sj":   "历史学者儒雅男子肖像,暖褐色调",
 "an_sj3":  "世界史专家男子肖像,蓝金色调",
 "an_gh":   "古代史学者男子肖像,赭石色调",
 "an_mg":   "民国风文人男子肖像,灰黄褐色调",
 "an_zh":   "军事历史专家男子肖像,灰褐色调",
 # 用户头像
 "u_me":    "年轻男子听书爱好者肖像,温暖中性色调",
}

assert len(COVERS) == 100, f"封面 prompt 数应为 100,实际 {len(COVERS)}"
assert len(AVATARS) == 61, f"头像 prompt 数应为 61,实际 {len(AVATARS)}"

def delete_old_files():
    """删除 covers/ 和 avatars/ 下所有 .png 文件"""
    for d in (COVERS_DIR, AVATARS_DIR):
        for f in os.listdir(d):
            if f.endswith(".png"):
                os.remove(os.path.join(d, f))

def fetch_image_openai(prompt, size="1024x1024"):
    """调用 OpenAI gpt-image-2 API 生成图片,返回 PNG 字节"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "size": size,
        "n": 1,
    }
    resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=TIMEOUT, proxies=PROXIES)
    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    items = data.get("data", [])
    if not items or not items[0].get("b64_json"):
        raise RuntimeError(f"no image in response: {json.dumps(data, ensure_ascii=False)[:300]}")
    return base64.b64decode(items[0]["b64_json"])

def gen_cover(item):
    cid, prompt = item
    path = os.path.join(COVERS_DIR, f"{cid}.png")
    if os.path.exists(path) and os.path.getsize(path) > 500000:
        return f"skip {cid} (已有 OpenAI 图)"
    try:
        data = fetch_image_openai(prompt + COVER_SUFFIX, "1024x1024")
        if len(data) < 5000:
            return f"FAIL {cid}: too small ({len(data)}B)"
        with open(path, "wb") as f:
            f.write(data)
        return f"OK cover {cid} ({len(data)//1024}KB)"
    except Exception as e:
        return f"FAIL cover {cid}: {e}"

def gen_avatar(item):
    aid, prompt = item
    path = os.path.join(AVATARS_DIR, f"{aid}.png")
    if os.path.exists(path) and os.path.getsize(path) > 500000:
        return f"skip {aid} (已有 OpenAI 图)"
    try:
        data = fetch_image_openai(prompt + AVA_SUFFIX, "1024x1024")
        if len(data) < 5000:
            return f"FAIL {aid}: too small ({len(data)}B)"
        with open(path, "wb") as f:
            f.write(data)
        return f"OK avatar {aid} ({len(data)//1024}KB)"
    except Exception as e:
        return f"FAIL avatar {aid}: {e}"

if __name__ == "__main__":
    total = len(COVERS) + len(AVATARS)
    print(f"OpenAI gpt-image-2 | 代理 127.0.0.1:7890 | 生成 {len(COVERS)} 封面 + {len(AVATARS)} 头像 = {total} 张", flush=True)
    print("跳过 >500KB 的已有 OpenAI 图,中途崩溃可重跑", flush=True)

    done = ok = fail = skip = 0
    # 封面(并发 4)
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        for res in ex.map(gen_cover, COVERS.items()):
            done += 1
            if res.startswith("OK"): ok += 1
            elif res.startswith("skip"): skip += 1
            else: fail += 1
            print(f"[{done}/{total}] {res}", flush=True)
    # 头像(并发 4)
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        for res in ex.map(gen_avatar, AVATARS.items()):
            done += 1
            if res.startswith("OK"): ok += 1
            elif res.startswith("skip"): skip += 1
            else: fail += 1
            print(f"[{done}/{total}] {res}", flush=True)

    print(f"\n=== 完成: OK={ok} skip={skip} FAIL={fail} ===", flush=True)
    if fail > 0:
        print("有失败项,可重跑脚本(会跳过已生成的)", flush=True)
