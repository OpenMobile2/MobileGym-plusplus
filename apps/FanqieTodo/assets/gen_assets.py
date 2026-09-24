# -*- coding: utf-8 -*-
"""番茄ToDo 装饰位图生成器(pipeline v3 §5.3)。
用 gpt-image-2 生成待办卡背景 / 打卡分享卡背景 / 头像等唯美意境图,替换 SVG/纯色占位。
- 幂等:已存在的 PNG 跳过,失败下次重跑补齐;4 并发;指数退避重试
- 只描述合成主体,禁止使用真机截图作为输入
运行: python apps/FanqieTodo/assets/gen_assets.py
环境变量: IMAGE_GEN_API_KEY(推荐);可选 IMAGE_GEN_BASE_URL / IMAGE_GEN_MODEL
"""
import base64
import random
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(_REPO_ROOT / "tools"))
from image_gen_client import make_image_client  # noqa: E402

BASE = Path(__file__).parent
client = None
MAX_RETRY = 3

WALL = "手机壁纸风格,唯美意境,柔和氛围,高清,无任何文字、无水印、无logo"

# 待办卡背景(对应 defaults.json 的 bgKey)—— 横向 banner,CSS cover 裁切
CARD_BG = {
    "confetti": "青绿色调背景,柔和虚化的彩色纸屑光斑,梦幻节日感",
    "night": "深靛蓝星空夜色,点点繁星,静谧极简",
    "starlight": "柔粉色天空,闪烁的细碎星光粒子,梦幻粉彩渐变",
    "birds": "暖金棕色黄昏天空,两只远处剪影的飞鸟,宁静极简",
    "dawn": "柔和粉彩黎明天空渐变,浅灰蓝过渡到暖奶白,平静",
    "snow": "静谧雪山山脉,柔和蓝天,极简风景",
}
# 打卡分享卡背景(竖版)
CHECKIN_BG = {
    "sleep": "黄昏雪原,一串脚印通向地平线,远处一个戴头灯的人,电影感宁静",
    "earlyrise": "平静海面上柔和日出,暖金色晨光,极简唯美",
    "focus": "冬日黄昏,光秃的树木剪影,紫粉色天空,静谧",
}
# 头像占位
AVATAR = {
    "user": "极简友好的圆形头像插画,圆内是柔和粉彩的山峦风景,干净",
}


def _fetch(item):
    if getattr(item, "b64_json", None):
        return base64.b64decode(item.b64_json)
    if getattr(item, "url", None):
        with urllib.request.urlopen(item.url, timeout=60) as resp:
            return resp.read()
    raise RuntimeError("API 既没返回 b64_json 也没返回 url")


def gen(out: Path, prompt: str, size: str) -> str:
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {out.name}"
    last = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            r = client.images.generate(model="gpt-image-2", prompt=f"{prompt},{WALL}",
                                       n=1, size=size, timeout=120)
            data = _fetch(r.data[0])
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(data)
            return f"ok   {out.name}({len(data)//1024}KB,第{attempt}次)"
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"重试{MAX_RETRY}次仍失败: {str(last)[:140]}")


def main():
    global client
    client = make_image_client()
    jobs = []
    for k, d in CARD_BG.items():
        jobs.append((BASE / "cardbg" / f"{k}.png", d, "1024x1024"))
    for k, d in CHECKIN_BG.items():
        jobs.append((BASE / "checkinbg" / f"{k}.png", d, "1024x1536"))
    for k, d in AVATAR.items():
        jobs.append((BASE / "avatars" / f"{k}.png", d, "1024x1024"))

    failed = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen, out, p, s): out.name for out, p, s in jobs}
        for fut in as_completed(futs):
            try:
                print(fut.result(), flush=True)
            except Exception as e:  # noqa: BLE001
                failed.append(futs[fut])
                print(f"FAIL {futs[fut]}: {str(e)[:160]}", flush=True)
    print(f"\n完成 {len(jobs) - len(failed)}/{len(jobs)}", flush=True)
    if failed:
        print(f"失败(重跑补齐): {failed}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
