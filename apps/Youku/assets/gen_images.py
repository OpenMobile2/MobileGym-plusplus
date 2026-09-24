# -*- coding: utf-8 -*-
"""
优酷复刻批量生图(pipeline §5.3 资产管线)

读取同目录 image_manifest.json(131 张:id/类别/描述),按类别套 design-tokens.md
的 prompt 范式,调用 OpenAI images/generations 兼容 API 批量生成 PNG。

- 幂等:已存在且 >10KB 的 PNG 跳过,失败项下次重跑补齐
- 并发 4 线程,单张超时 300s,失败指数退避重试 3 次
- key/base_url 从环境变量 IMAGE_GEN_API_KEY / IMAGE_GEN_BASE_URL 读取;
  未设置时运行期回落到 tools/test_api_imggen.py 中的配置(key 不写入本文件)

运行: python apps/Youku/assets/gen_images.py  (在 trial_apps/mobilegym 下)
"""
from __future__ import annotations

import base64
import json
import os
import random
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

_HERE = Path(__file__).resolve().parent
_PROJECT_ROOT = _HERE.parents[2]          # trial_apps/mobilegym(manifest 路径的基准)
_REPO_ROOT = _HERE.parents[4]             # mobilegym-mock

MANIFEST = _HERE / "image_manifest.json"


def _load_api_config() -> tuple[str, str, str]:
    """返回 (base_url, api_key, model)。优先环境变量,回落 tools/test_api_imggen.py。"""
    api_key = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
    base_url = os.environ.get("IMAGE_GEN_BASE_URL")
    model = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
    if not api_key or not base_url:
        sys.path.insert(0, str(_REPO_ROOT / "tools"))
        try:
            import test_api_imggen as _t  # noqa: PLC0415
            api_key = api_key or _t.API_KEY
            base_url = base_url or _t.BASE_URL
            model = os.environ.get("IMAGE_GEN_MODEL", getattr(_t, "MODEL", model))
        except Exception:  # noqa: BLE001
            pass
    if not api_key or not base_url:
        print("错误: 未设置 IMAGE_GEN_API_KEY / IMAGE_GEN_BASE_URL,且找不到回落配置", file=sys.stderr)
        sys.exit(1)
    base_url = base_url.rstrip("/")
    url = f"{base_url}/images/generations" if base_url.endswith("/v1") else f"{base_url}/v1/images/generations"
    return url, api_key, model


API_URL, API_KEY, MODEL = _load_api_config()

# 类别 → (尺寸, prompt 前缀, prompt 后缀)。gpt-image 支持 1024x1024 / 1024x1536 / 1536x1024
CATEGORY_STYLE = {
    "poster_2x3": (
        "1024x1536",
        "一张电影海报风格插画,",
        ",竖版构图,电影质感打光,适合深色UI展示,电影海报风格插画,无任何文字无水印无logo,不含真实明星肖像",
    ),
    "still_16x9": (
        "1536x1024",
        "一张影视剧照风格画面,",
        ",横版宽幅构图,写实电影感,适合深色UI展示,无任何文字无水印无logo,不含真实明星肖像",
    ),
    "shorts_cover_16x9": (
        "1536x1024",
        "一张手机短视频封面画面,",
        ",色彩饱和,抓拍瞬间感,横版构图,无任何文字无水印无logo,不含真实明星肖像",
    ),
    "avatar_round": (
        "1024x1024",
        "圆形头像插画,",
        ",扁平卡通风格,居中构图,纯色背景,方图,无任何文字无水印无logo,不含真实明星肖像",
    ),
}

MAX_RETRY = 3
TIMEOUT = 300
MIN_BYTES = 10_000


def build_prompt(category: str, desc: str) -> tuple[str, str]:
    size, prefix, suffix = CATEGORY_STYLE[category]
    return size, f"{prefix}{desc}{suffix}"


def gen_one(entry: dict) -> str:
    rel = entry["file"]                      # e.g. apps/Youku/assets/posters/x.png
    out = _PROJECT_ROOT / rel
    if out.exists() and out.stat().st_size > MIN_BYTES:
        return f"skip {rel}(已存在)"
    out.parent.mkdir(parents=True, exist_ok=True)
    size, prompt = build_prompt(entry["category"], entry["prompt"])
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            resp = requests.post(
                API_URL,
                headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
                json={"model": MODEL, "prompt": prompt, "size": size, "n": 1},
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            item = (data.get("data") or [{}])[0]
            if item.get("b64_json"):
                image_bytes = base64.b64decode(item["b64_json"])
            elif item.get("url"):
                with urllib.request.urlopen(item["url"], timeout=60) as r:
                    image_bytes = r.read()
            else:
                raise RuntimeError("API 既没返回 b64_json 也没返回 url")
            if len(image_bytes) < MIN_BYTES:
                raise RuntimeError(f"返回图片过小({len(image_bytes)}B)")
            out.write_bytes(image_bytes)
            return f"ok   {rel}({len(image_bytes)//1024}KB, 第{attempt}次)"
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"重试{MAX_RETRY}次仍失败: {str(last_err)[:140]}")


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    images = manifest["images"]
    print(f"清单共 {len(images)} 张,输出基准目录: {_PROJECT_ROOT}", flush=True)

    failed = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen_one, e): e["file"] for e in images}
        for fut in as_completed(futs):
            rel = futs[fut]
            try:
                print(fut.result(), flush=True)
            except Exception as e:  # noqa: BLE001
                failed.append(rel)
                print(f"FAIL {rel}: {str(e)[:160]}", flush=True)

    done = sum(
        1 for e in images
        if (_PROJECT_ROOT / e["file"]).exists() and (_PROJECT_ROOT / e["file"]).stat().st_size > MIN_BYTES
    )
    print(f"\n完成: {done}/{len(images)}", flush=True)
    if failed:
        print(f"失败(重跑本脚本可补齐): {failed}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
