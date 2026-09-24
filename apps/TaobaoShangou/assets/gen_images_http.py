# -*- coding: utf-8 -*-
"""
批量生图(直连 HTTP 版,兼容旧环境无新版 openai SDK)。
读 asset_prompts.json,生成到 assets/,1024→512 JPEG q82,幂等(>5KB 跳过),4并发。
运行: python gen_images_http.py [--only items/med_ logos/p_]
环境变量: IMAGE_GEN_API_KEY / IMAGE_GEN_BASE_URL / IMAGE_GEN_MODEL
"""
import base64
import io
import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from PIL import Image

HERE = Path(__file__).parent
PROMPTS = json.loads((HERE / "asset_prompts.json").read_text(encoding="utf-8"))
API_KEY = os.environ.get("IMAGE_GEN_API_KEY", "")
BASE_URL = os.environ.get("IMAGE_GEN_BASE_URL", "http://15.204.107.114:3009/v1").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
URL = f"{BASE_URL}/images/generations" if BASE_URL.endswith("/v1") else f"{BASE_URL}/v1/images/generations"
MAX_RETRY = 3


def gen_one(relpath: str, prompt: str) -> str:
    out = HERE / relpath
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 5_000:
        return f"skip {relpath}"
    last = None
    for _ in range(MAX_RETRY):
        try:
            r = requests.post(
                URL,
                headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
                json={"model": MODEL, "prompt": prompt, "size": "1024x1024", "n": 1},
                timeout=240,
            )
            r.raise_for_status()
            item = r.json()["data"][0]
            if item.get("b64_json"):
                raw = base64.b64decode(item["b64_json"])
            elif item.get("url"):
                with urllib.request.urlopen(item["url"], timeout=60) as resp:
                    raw = resp.read()
            else:
                raise RuntimeError("no b64_json/url")
            img = Image.open(io.BytesIO(raw)).convert("RGB").resize((512, 512), Image.LANCZOS)
            img.save(out, "JPEG", quality=82)
            return f"OK   {relpath}"
        except Exception as e:  # noqa: BLE001
            last = e
    return f"FAIL {relpath}: {type(last).__name__}: {last}"


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    todo = {k: v for k, v in PROMPTS.items() if (not only or any(k.startswith(p) for p in only))}
    print(f"todo={len(todo)} url={URL} model={MODEL}", flush=True)
    ok = fail = skip = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen_one, k, v): k for k, v in todo.items()}
        for f in as_completed(futs):
            res = f.result()
            print(res, flush=True)
            if res.startswith("OK"):
                ok += 1
            elif res.startswith("skip"):
                skip += 1
            else:
                fail += 1
    print(f"\nDONE ok={ok} skip={skip} fail={fail}", flush=True)


if __name__ == "__main__":
    main()
