# -*- coding: utf-8 -*-
"""
拼多多站内批量商品/店铺配图生成器(pipeline v3 §5.3 资产管线)。

读 ./prompts.json(gen_catalog.py 产出:id→中文主体),为 980 商品 × 3 变体(主图/详情/角度)
+ 92 店铺 logo 生成唯一电商风图,替换占位。

- 幂等:已存在且 >8KB 的 PNG 跳过,失败下次重跑补齐
- 并发 6,指数退避重试;自包含(raw requests)
- 下采样:主图/角度 ≤480px,详情 ≤720px 高,PNG 优化,控制磁盘(~50-90KB/张)

环境变量(必设):
  IMAGE_GEN_API_KEY   —— 生图 key(禁止硬编码/提交)
  IMAGE_GEN_BASE_URL  —— 如 http://host:port(自动补 /v1/images/generations)
  IMAGE_GEN_MODEL     —— 如 gpt-image-2

安全红线(§5.3):prompt 只描述合成主体,禁止上传真机截图;key 只从 env 读。
"""
import base64
import io
import json
import os
import random
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

try:
    from PIL import Image
    HAS_PIL = True
except Exception:  # noqa: BLE001
    HAS_PIL = False

HERE = Path(__file__).parent
ITEMS_DIR = HERE / "items"
AVATARS_DIR = HERE / "avatars"
ITEMS_DIR.mkdir(exist_ok=True)
AVATARS_DIR.mkdir(exist_ok=True)

API_KEY = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
BASE_URL = os.environ.get("IMAGE_GEN_BASE_URL", "https://example.invalid/v1").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
URL = BASE_URL + ("/images/generations" if BASE_URL.endswith("/v1") else "/v1/images/generations")

STYLE = ("电商商品主图,专业产品摄影,浅色干净背景,柔和棚拍打光,商品居中占画面主体,"
         "高清细节,无任何文字、无水印、无logo")
DETAIL_STYLE = ("电商详情页场景图,竖版构图,商品在真实使用场景中,生活方式摄影,自然光,"
                "氛围感,无任何文字、无水印、无logo")
ANGLE_STYLE = ("电商商品图,产品另一角度或细节特写,专业产品摄影,浅色干净背景,与主图同款同风格,"
               "无任何文字、无水印、无logo")
LOGO_STYLE = "简约扁平品牌logo图标,电商店铺标识,纯色背景,居中构图,无多余文字"

MAX_RETRY = 3
MIN_BYTES = 8_000


def _post(prompt, size):
    payload = {"model": MODEL, "prompt": prompt, "size": size, "n": 1}
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    r = requests.post(URL, headers=headers, json=payload, timeout=180)
    r.raise_for_status()
    data = r.json()["data"][0]
    if data.get("b64_json"):
        return base64.b64decode(data["b64_json"])
    if data.get("url"):
        with urllib.request.urlopen(data["url"], timeout=60) as resp:
            return resp.read()
    raise RuntimeError("API 未返回 b64_json/url")


def _downscale(raw, max_edge):
    if not HAS_PIL:
        return raw
    try:
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        w, h = im.size
        scale = min(1.0, max_edge / max(w, h))
        if scale < 1.0:
            im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, format="PNG", optimize=True)
        return buf.getvalue()
    except Exception:  # noqa: BLE001
        return raw


def _gen(out_path, subject, style, size, max_edge):
    if out_path.exists() and out_path.stat().st_size > MIN_BYTES:
        return f"skip {out_path.name}"
    last = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            raw = _post(f"{subject},{style}", size)
            raw = _downscale(raw, max_edge)
            out_path.write_bytes(raw)
            return f"ok   {out_path.name} ({out_path.stat().st_size // 1024}KB, 第{attempt}次)"
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"{out_path.name} 重试{MAX_RETRY}次失败: {str(last)[:120]}")


def build_jobs():
    prompts = json.loads((HERE / "prompts.json").read_text(encoding="utf-8"))
    jobs = []  # (out_path, subject, style, size, max_edge)
    for key, subject in prompts.items():
        if key.startswith("__shop__"):
            sid = key[len("__shop__"):]
            jobs.append((AVATARS_DIR / f"{sid}.png", subject, LOGO_STYLE, "1024x1024", 200))
        else:
            jobs.append((ITEMS_DIR / f"{key}.png", subject, STYLE, "1024x1024", 400))
            jobs.append((ITEMS_DIR / f"{key}_2.png", subject, ANGLE_STYLE, "1024x1024", 400))
            jobs.append((ITEMS_DIR / f"{key}_d.png", subject, DETAIL_STYLE, "1024x1536", 560))
    return jobs


def main():
    if not API_KEY:
        print("错误: 未设置 IMAGE_GEN_API_KEY", file=sys.stderr)
        sys.exit(1)
    if not HAS_PIL:
        print("警告: 未装 Pillow,图片不下采样(磁盘会很大),建议 pip install pillow", file=sys.stderr)
    jobs = build_jobs()
    todo = [j for j in jobs if not (j[0].exists() and j[0].stat().st_size > MIN_BYTES)]
    print(f"endpoint: {URL}  model: {MODEL}")
    print(f"总任务 {len(jobs)} 张,待生成 {len(todo)} 张(已存在 {len(jobs) - len(todo)} 跳过)", flush=True)
    failed = []
    done = 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(_gen, *j): j[0].name for j in todo}
        for fut in as_completed(futs):
            try:
                res = fut.result()
                done += 1
                if done % 25 == 0 or res.startswith("ok"):
                    print(f"[{done}/{len(todo)}] {res}", flush=True)
            except Exception as e:  # noqa: BLE001
                failed.append(futs[fut])
                print(f"FAIL {futs[fut]}: {str(e)[:140]}", flush=True)
    have = len([p for p in ITEMS_DIR.glob('*.png') if p.stat().st_size > MIN_BYTES])
    have_logo = len([p for p in AVATARS_DIR.glob('s_g*.png') if p.stat().st_size > MIN_BYTES])
    print(f"\n完成本轮 {done} 张。items 现有 {have} 张,店铺logo {have_logo} 张。", flush=True)
    if failed:
        print(f"失败 {len(failed)} 张(重跑本脚本自动补齐)", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
