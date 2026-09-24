# -*- coding: utf-8 -*-
"""
微博装饰位图批量生成(pipeline v3 §5.3)。
- key/endpoint 从环境变量读取:IMAGE_GEN_API_KEY(必填)/ IMAGE_GEN_BASE_URL / IMAGE_GEN_MODEL
- 幂等:已存在的 PNG 跳过;429/5xx 指数退避重试;可反复重跑补缺
- 输出:apps/Weibo/assets/gen/<name>.png(路径相对本文件,cwd 无关)
- 安全:prompt 仅合成描述,禁止真机截图输入
运行: python apps/Weibo/assets/gen_weibo_images.py [--only prefix]
"""
import base64
import json
import os
import sys
import time
from pathlib import Path

import requests

API_KEY = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
BASE_URL = os.environ.get("IMAGE_GEN_BASE_URL", "http://15.204.107.114:3009")
MODEL = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
SIZE = "1024x1024"  # gpt-image-2 拒绝 256x256
OUT = Path(__file__).parent / "gen"
OUT.mkdir(exist_ok=True)

if not API_KEY:
    sys.exit("缺 IMAGE_GEN_API_KEY 环境变量(勿写进代码)")

NO_TEXT = ",无任何文字无水印无logo,no text no watermark"
STYLE_PHOTO = ",真实摄影感,自然光" + NO_TEXT
STYLE_AVATAR = ",社交媒体头像,居中构图,简洁背景" + NO_TEXT

# name -> prompt
MANIFEST: dict[str, str] = {}

# ---- 头像 20(个人多样 + 媒体/机构风) ----
_AV = [
    "年轻女性微笑侧脸,咖啡店背景", "戴眼镜的年轻男性程序员", "扎马尾的运动女孩", "中年男性教师温和微笑",
    "染栗色短发的时尚女性", "戴棒球帽的少年", "长发文艺女性抱着吉他", "健身房里的强壮男性",
    "戴耳机的电竞少女", "穿西装的商务男士", "可爱橘猫特写当头像", "柴犬歪头特写",
    "动漫风格粉发少女插画头像", "水彩风格山水插画头像", "宇航员头盔反光插画", "复古胶片风女性背影",
    "红色圆形媒体机构标志感抽象图形,扁平设计", "蓝色科技感抽象球体,扁平设计",
    "橙色音符抽象图形,扁平设计", "绿色树叶环保抽象图形,扁平设计",
]
for i, p in enumerate(_AV, 1):
    MANIFEST[f"av{i:02d}"] = p + STYLE_AVATAR

# ---- 微博配图 36(信息流/详情/相册,多品类) ----
_PO = [
    "台风来临前的乳状云铺满天空", "城市暴雨中的街道行人撑伞", "海边巨浪拍打礁石",
    "演唱会现场舞台灯光海洋", "音乐节人群挥舞荧光棒", "录音棚里的黑胶唱片机",
    "大学毕业典礼学生抛学士帽", "图书馆自习的青年", "校园樱花大道",
    "深夜城市天际线霓虹", "胡同里的老茶馆", "高铁窗外掠过的稻田",
    "精致的日式早餐摆盘", "重庆火锅沸腾特写", "手冲咖啡拉花特写",
    "奶茶和甜品下午茶", "夜市烤串摊烟火气", "刚出炉的法式牛角包",
    "橘猫趴在窗台晒太阳", "金毛犬在草地上奔跑", "仓鼠捧着瓜子",
    "健身房撸铁剪影", "清晨公园跑步的人", "瑜伽垫上的拉伸",
    "足球场夜赛俯拍", "篮球擦板入筐瞬间", "羽毛球扣杀慢门",
    "雪山日照金山", "沙漠公路孤独直线", "森林晨雾光束",
    "手机拍摄的晚霞天空", "阳台多肉植物", "书桌上的机械键盘和绿植",
    "新款手机开箱平铺", "电竞房间RGB灯效", "复古胶片相机静物",
]
for i, p in enumerate(_PO, 1):
    MANIFEST[f"po{i:02d}"] = p + STYLE_PHOTO

# ---- 超话头图 8 ----
_ST = [
    "舞台上手持麦克风的歌手剪影,紫色灯光", "古装电视剧场景亭台楼阁", "电竞比赛场馆蓝色灯光",
    "足球场草坪和球门特写", "一排可爱猫咪插画", "美食拼盘俯拍",
    "股票K线图抽象蓝色背景", "旅行地图和护照相机平铺",
]
for i, p in enumerate(_ST, 1):
    MANIFEST[f"st{i:02d}"] = p + STYLE_PHOTO

# ---- 话题头卡缩略图 8 ----
_TP = [
    "台风卫星云图艺术化渲染", "城市内涝救援皮划艇", "红毯闪光灯剪影",
    "新闻发布会话筒特写", "世界杯奖杯金色特写", "电影院银幕光影",
    "考场文具平铺", "股市大屏红绿数字虚化",
]
for i, p in enumerate(_TP, 1):
    MANIFEST[f"tp{i:02d}"] = p + STYLE_PHOTO

# ---- 主页头图 6(横幅感) ----
_HD = [
    "海滩日落全景横幅", "森林公路航拍横幅", "城市夜景车流横幅",
    "薰衣草花田横幅", "极简渐变蓝紫色横幅", "山顶云海横幅",
]
for i, p in enumerate(_HD, 1):
    MANIFEST[f"hd{i:02d}"] = p + STYLE_PHOTO


def images_url() -> str:
    b = BASE_URL.rstrip("/")
    return f"{b}/images/generations" if b.endswith("/v1") else f"{b}/v1/images/generations"


def gen_one(name: str, prompt: str) -> bool:
    dst = OUT / f"{name}.png"
    if dst.exists() and dst.stat().st_size > 10_000:
        return True
    payload = {"model": MODEL, "prompt": prompt, "n": 1, "size": SIZE}
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    delay = 5
    for attempt in range(5):
        try:
            r = requests.post(images_url(), headers=headers, json=payload, timeout=300)
            if r.status_code == 200:
                d = r.json()["data"][0]
                if d.get("b64_json"):
                    dst.write_bytes(base64.b64decode(d["b64_json"]))
                elif d.get("url"):
                    dst.write_bytes(requests.get(d["url"], timeout=120).content)
                else:
                    raise RuntimeError(f"响应无图: {json.dumps(d)[:200]}")
                return True
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(delay)
                delay = min(delay * 2, 60)
                continue
            print(f"  FAIL {name}: HTTP {r.status_code} {r.text[:150]}")
            return False
        except Exception as e:  # noqa: BLE001
            print(f"  RETRY {name}: {e}")
            time.sleep(delay)
            delay = min(delay * 2, 60)
    return False


def main() -> None:
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else ""
    todo = {k: v for k, v in MANIFEST.items() if k.startswith(only)}
    done = fail = 0
    for i, (name, prompt) in enumerate(sorted(todo.items()), 1):
        ok = gen_one(name, prompt)
        done += ok
        fail += (not ok)
        if (OUT / f"{name}.png").exists():
            print(f"[{i}/{len(todo)}] {name} ok")
        time.sleep(0.5)
    print(f"完成: {done} ok / {fail} fail / 共 {len(todo)}(重跑可补缺)")


if __name__ == "__main__":
    main()
