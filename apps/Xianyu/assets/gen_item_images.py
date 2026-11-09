# -*- coding: utf-8 -*-
"""闲鱼 商品主图生成器(pipeline §5.3 资产工具)。

用中转生图服务(gen_image.py 的 relay,Cloudflare tunnel)为 defaults.json 的商品
生成电商风格主图,替换 SVG 占位。
- 幂等:已存在的 PNG 跳过,失败的下次重跑补齐
- 并发 4 线程,503/429 自动重试
- key/endpoint 从环境变量读,**禁止硬编码/提交 key**

运行(PowerShell):
  $env:RELAY_BASE_URL='https://xxxx.trycloudflare.com'
  $env:RELAY_KEY='...'
  py trial_apps/mobilegym/apps/Xianyu/assets/gen_item_images.py
"""
import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

OUT_DIR = Path(__file__).parent / "items"
OUT_DIR.mkdir(exist_ok=True)

BASE = (os.environ.get("RELAY_BASE_URL") or os.environ.get("IMAGE_GEN_BASE_URL") or "").rstrip("/")
KEY = os.environ.get("RELAY_KEY") or os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
if not BASE or not KEY:
    print("错误: 需设置 RELAY_BASE_URL 与 RELAY_KEY 环境变量", file=sys.stderr)
    sys.exit(1)
URL = f"{BASE}/images/generations" if BASE.endswith("/v1") else f"{BASE}/v1/images/generations"

STYLE = ("电商二手商品主图,真实产品摄影,浅色干净背景,柔和自然打光,商品居中占主体,"
         "高清细节,无任何文字、无水印、无logo")

PROMPTS = {
    "i1": "一台黑色索尼全画幅微单相机机身,配一枚标准变焦镜头,放在浅灰背景上,45度角",
    "i2": "一个蓝绿长发动漫少女景品手办,站姿,精致涂装,摆在浅色背景上",
    "i3": "一双黑白熊猫配色低帮运动板鞋,侧面45度摆放,干净白色鞋底",
    "i4": "一部深紫色直角边框智能手机,背面三摄,竖直立在浅色背景",
    "i5": "一套三本文艺小说平装书,略有阅读痕迹,整齐叠放,浅色木桌",
    "i6": "一把68配列客制化机械键盘,PBT键帽,侧面微俯拍,深灰白撞色",
    "i7": "一把浅木色框架布艺单人扶手椅,北欧风格,浅色房间背景",
    "i8": "一台紫色手持无绳吸尘器,配透明尘杯,竖直立在浅色地面",
    "i9": "一台深空灰平板电脑,配一支触控笔,斜放在浅色桌面",
    "i10": "一只黑色轻薄智能运动手环,亮屏显示,浅色背景特写",
    "i11": "一台黑色电子墨水阅读器,配深灰保护套,平放在浅色桌面",
}


def gen_one(item_id: str, prompt: str) -> str:
    out = OUT_DIR / f"{item_id}.png"
    if out.exists() and out.stat().st_size > 5000:
        return f"skip {item_id}"
    payload = json.dumps({"prompt": f"{prompt},{STYLE}", "size": "1024x1024", "n": 1}).encode()
    for attempt in range(1, 5):
        try:
            req = urllib.request.Request(URL, data=payload, method="POST",
                headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read().decode())
            items = data.get("data", [])
            if items and items[0].get("b64_json"):
                out.write_bytes(base64.b64decode(items[0]["b64_json"]))
                return f"OK {item_id} ({out.stat().st_size // 1024}KB)"
            return f"FAIL {item_id}: no b64 {json.dumps(data)[:120]}"
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:120]
            if e.code in (503, 502, 500, 429):
                time.sleep(6 * attempt); continue
            return f"FAIL {item_id}: HTTP {e.code} {body}"
        except Exception as e:  # noqa: BLE001
            time.sleep(6 * attempt); continue
    return f"FAIL {item_id}: retries exhausted"


def main():
    print(f"endpoint {URL}  items {len(PROMPTS)}")
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen_one, k, v): k for k, v in PROMPTS.items()}
        for f in as_completed(futs):
            print(" ", f.result())
    done = sum(1 for k in PROMPTS if (OUT_DIR / f"{k}.png").exists())
    print(f"完成: {done}/{len(PROMPTS)} 张 PNG 在 {OUT_DIR}")


if __name__ == "__main__":
    main()
