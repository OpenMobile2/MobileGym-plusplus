#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""百词斩 装饰位图生成器(pipeline v3 §5.3)。

生成:单词配图(每词一张,呼应词义的具象场景)/ 商品图 / 文章题图 / 用户头像。
组件在缺图时回落到 CSS 色块(components/common.tsx),所以本脚本失败不阻塞功能。

安全红线(§5.3):prompt 只描述合成主体;**不得**把 baicizhan_images/ 真机截图
或含个人信息的照片作为生图输入。key 走环境变量,不写进代码/git。

- 幂等:已存在的 PNG 跳过;失败重跑补齐;并发 4;指数退避重试;生成后压到 512×512
运行: IMAGE_GEN_API_KEY=... python3 apps/Baicizhan/assets/gen_assets.py
"""
import base64
import io
import json
import random
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(_REPO_ROOT / "tools"))
from image_gen_client import make_image_client, image_gen_model  # noqa: E402

BASE = Path(__file__).parent
DEFAULTS = json.loads((BASE.parent / "data" / "defaults.json").read_text(encoding="utf-8"))
MAX_RETRY = 3
client = None

PHOTO = "真实摄影风格,明亮自然光,浅色干净背景,居中构图,无任何文字、无水印、无logo"
PRODUCT = "电商商品主图,专业产品摄影,纯净浅灰背景,无任何文字、无水印、无logo"

# 单词配图:用词义的具象场景(取每词的英文例句情境作主体)
WORD_SCENE = {
    "prudent": "一只环尾狐猴警惕地蹲守看家", "arid": "干裂龟壳般的旱地与远处枯湖",
    "appropriate": "一个戴着头盔骑自行车的孩子", "brim": "斟到杯口满满的一杯啤酒",
    "monarch": "坐在王座上戴王冠的君主", "cascade": "山间层叠而下的小瀑布",
    "dissolve": "一片泡腾片在水杯中溶解冒泡", "default": "一台电脑屏幕上的默认设置界面",
    "badger": "一只獾在栅栏下挖洞", "tackle": "两个人合力搬动一个大箱子处理问题",
    "cameo": "一枚精致的侧面浮雕玉石胸针", "acknowledge": "一个人点头确认收到文件",
    "dilemma": "一个人站在两条岔路前犹豫", "potential": "一株破土而出的嫩芽",
    "resident": "一栋公寓楼前的几位居民", "departure": "机场里旅客拖着行李启程",
    "blossom": "春天盛开的樱花枝", "famine": "干旱龟裂土地上枯萎的庄稼",
    "ethics": "天平与一本伦理书", "feast": "摆满佳肴的节日盛宴长桌",
    "precisely": "精密卡尺测量一个零件", "fortnight": "翻到两周后的日历页",
    "fragrant": "一束芬芳的玫瑰花", "genuine": "两人真诚握手",
    "melancholy": "雨天窗边独坐忧郁的人", "critical": "手术室里紧张的关键时刻",
    "renowned": "一位著名科学家在实验室", "coordinate": "团队围桌协调合作",
    "merchandise": "货架上琳琅满目的商品", "dialogue": "两位领导人隔桌对话",
    "abundant": "堆满的丰收果实", "candid": "一个人坦率地讲述",
    "deficit": "红色下滑的财务赤字曲线图表", "elaborate": "一件精雕细琢的复杂工艺品",
    "hostile": "一群人对峙充满敌意", "inevitable": "不可阻挡的巨浪扑来",
    "lucrative": "一叠钞票与上涨的生意", "notorious": "破败的犯罪高发街区",
    "obscure": "浓雾中模糊难辨的景物", "plausible": "看似合理的图纸方案",
    "reluctant": "一个人勉强不情愿的表情", "scrutiny": "放大镜下仔细审查文件",
    "tangible": "手中可触摸的实体证据", "vigorous": "清晨精力充沛地晨跑",
}

PRODUCT_SCENE = {
    "p_max": "复古掌机造型的电子背单词机,大屏,薄荷绿",
    "p_std": "便携式电子背单词机,经典白",
    "p_pen": "白色扫描词典笔",
    "p_ruler": "带凹槽的小直尺文具",
    "p_cet4book": "一本英语四级词汇书",
    "p_cet6pack": "一套英语六级真题备考试卷",
    "p_board": "A4蓝色多功能方格板夹",
    "p_notebook": "康奈尔笔记法方格笔记本",
    "p_clip": "一袋玫瑰金色水滴形金属回形针书签",
    "p_tape": "一卷透明双面圆点胶带",
    "p_earphone": "白色有线入耳式耳机",
    "p_pencase": "猫窝造型的大容量毛绒笔袋",
}

ARTICLE_SCENE = {
    "a_711": "一双撞色三条纹运动球鞋摆在便利店门口,新闻图风格,无任何文字、无水印",
    "a_tencent": "科技公司数据中心与AI芯片概念图,冷色调,无任何文字、无水印",
    "a_choc": "情人节心形巧克力礼盒与玫瑰,暖色调,无任何文字、无水印",
}

TASKS = []
for w in DEFAULTS["words"]:
    scene = WORD_SCENE.get(w["word"], f"{w['meaning']}的具象场景")
    TASKS.append((BASE / "words" / f"{w['word']}.png", f"{scene},{PHOTO}"))
for p in DEFAULTS["products"]:
    scene = PRODUCT_SCENE.get(p["id"], p["title"][:12])
    TASKS.append((BASE / "products" / f"{p['id']}.png", f"{scene},{PRODUCT}"))
for a in DEFAULTS["articles"]:
    TASKS.append((BASE / "articles" / f"{a['id']}.png", ARTICLE_SCENE.get(a["id"], a["titleCn"])))
TASKS.append((BASE / "avatars" / "user.png", f"一只戴眼镜的柴犬卡通头像,扁平插画风,奶油色背景,{PHOTO}"))


def _shrink(raw: bytes, size=512) -> bytes:
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        im.thumbnail((size, size))
        out = io.BytesIO()
        im.save(out, "PNG", optimize=True)
        return out.getvalue()
    except Exception:
        return raw


def gen(path: Path, prompt: str) -> str:
    if path.exists():
        return f"skip  {path.name}"
    path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(MAX_RETRY):
        try:
            r = client.images.generate(model=image_gen_model(), prompt=prompt, size="1024x1024", n=1)
            path.write_bytes(_shrink(base64.b64decode(r.data[0].b64_json)))
            return f"ok    {path.name}  ({path.stat().st_size // 1024} KB)"
        except Exception as e:
            if attempt == MAX_RETRY - 1:
                return f"FAIL  {path.name}: {type(e).__name__} {str(e)[:80]}"
            time.sleep(2 ** attempt + random.random())
    return f"FAIL  {path.name}"


def main():
    global client
    client = make_image_client()
    todo = [(p, pr) for p, pr in TASKS if not p.exists()]
    print(f"model={image_gen_model()}  待生成 {len(todo)}/{len(TASKS)} 张")
    ok = fail = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(gen, p, pr) for p, pr in TASKS]
        for f in as_completed(futs):
            res = f.result()
            print(" ", res)
            if res.startswith("ok"):
                ok += 1
            elif res.startswith("FAIL"):
                fail += 1
    print(f"\n生成 {ok} 张,失败 {fail} 张(失败下次重跑补齐)")


if __name__ == "__main__":
    main()
