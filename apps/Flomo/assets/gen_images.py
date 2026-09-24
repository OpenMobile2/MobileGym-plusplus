# -*- coding: utf-8 -*-
"""
flomo 装饰位图批量生图(pipeline v3 §5.3)。
- key 只从环境变量读,绝不写进代码/git:IMAGE_GEN_API_KEY(兼容 TOKENHUB_API_KEY)、
  IMAGE_GEN_BASE_URL、IMAGE_GEN_MODEL。
- 幂等:已存在的 PNG 跳过;失败可重跑只补缺失。4 并发。
- 安全:prompt 只描述合成主体,绝不上传真机截图。
运行(由 AI 配好环境变量后执行):
  IMAGE_GEN_API_KEY=... IMAGE_GEN_BASE_URL=... IMAGE_GEN_MODEL=gpt-image-2 \
  python apps/Flomo/assets/gen_images.py
"""
import base64, os, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests

APP = Path(__file__).parent.parent
KEY = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
BASE = (os.environ.get("IMAGE_GEN_BASE_URL") or "").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL") or "gpt-image-2"
SIZE = os.environ.get("IMAGE_GEN_SIZE") or "1024x1024"
if not KEY or not BASE:
    sys.exit("缺少 IMAGE_GEN_API_KEY / IMAGE_GEN_BASE_URL 环境变量;未配置则跳过生图(用 SVG 占位)。")

URL = f"{BASE}/images/generations" if BASE.endswith("/v1") else f"{BASE}/v1/images/generations"
SUFFIX = ",扁平极简插画/生活方式摄影风格,柔和自然光,干净留白背景,无任何文字、无水印、无logo"

# 待生成清单:(相对 assets 的路径, prompt 主体)
ASSETS = [
    ("avatars/me.png", "一个极简圆形头像,墨绿主色,中心是一片抽象的叶子或笔尖符号"),
    ("images/memo_cat.png", "一只可爱的英国短毛猫安静地坐在木地板上,生活随手拍"),
    ("images/memo_note.png", "一本翻开的空白笔记本和一支钢笔,俯拍,温暖晨光"),
    ("images/memo_book.png", "几本书整齐叠放在窗边,清晨柔光的静物"),
    ("images/memo_coffee.png", "一杯热咖啡和一本摊开的书放在原木桌上"),
]


def gen(rel, subject):
    out = APP / "assets" / rel
    if out.exists() and out.stat().st_size > 0:
        return (rel, "skip")
    out.parent.mkdir(parents=True, exist_ok=True)
    prompt = subject + SUFFIX
    for attempt in range(3):
        try:
            r = requests.post(URL, headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
                              json={"model": MODEL, "prompt": prompt, "size": SIZE, "n": 1}, timeout=300)
            if not r.ok:
                if attempt == 2:
                    return (rel, f"HTTP {r.status_code}: {r.text[:120]}")
                time.sleep(3); continue
            items = r.json().get("data", [])
            if items and items[0].get("b64_json"):
                out.write_bytes(base64.b64decode(items[0]["b64_json"]))
                return (rel, f"ok {out.stat().st_size}B")
            if items and items[0].get("url"):
                img = requests.get(items[0]["url"], timeout=120)
                out.write_bytes(img.content)
                return (rel, f"ok(url) {out.stat().st_size}B")
            return (rel, "no image in response")
        except Exception as e:
            if attempt == 2:
                return (rel, f"EXC {e}")
            time.sleep(3)
    return (rel, "failed")


def main():
    print(f"api={URL} model={MODEL} size={SIZE} | {len(ASSETS)} assets")
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen, rel, subj): rel for rel, subj in ASSETS}
        for f in as_completed(futs):
            rel, status = f.result()
            print(f"  {rel}: {status}")
    print("done. 重跑 regen_defaults.py 让种子数据指向 PNG。")


if __name__ == "__main__":
    main()
