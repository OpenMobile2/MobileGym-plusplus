# -*- coding: utf-8 -*-
"""
Douban 装饰位图批量生图(pipeline v3 §5.3)。
- key 只从环境变量读,绝不写进代码/git:IMAGE_GEN_API_KEY(兼容 TOKENHUB_API_KEY)、
  IMAGE_GEN_BASE_URL、IMAGE_GEN_MODEL。
- 清单来自 image_manifest.json(prompt_zh 原样使用;全部合成主体、无文字无水印无logo)。
- 幂等:已存在且非空的 PNG 跳过;失败可重跑只补缺失。4 并发,单张 3 次重试。
- 安全:只发送文字 prompt,绝不上传任何真机截图(douban_images/)。
运行(由 AI 配好环境变量后执行):
  IMAGE_GEN_API_KEY=... IMAGE_GEN_BASE_URL=... IMAGE_GEN_MODEL=gpt-image-2 \
  python3 apps/Douban/assets/gen_images.py
"""
import base64, json, os, sys, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ASSETS_DIR = Path(__file__).parent          # apps/Douban/assets
APP = ASSETS_DIR.parent                     # apps/Douban
KEY = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
BASE = (os.environ.get("IMAGE_GEN_BASE_URL") or "").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL") or "gpt-image-2"
SIZE = os.environ.get("IMAGE_GEN_SIZE") or "1024x1024"
if not KEY or not BASE:
    sys.exit("缺少 IMAGE_GEN_API_KEY / IMAGE_GEN_BASE_URL 环境变量;未配置则跳过生图(用 SVG 占位)。")

URL = f"{BASE}/images/generations" if BASE.endswith("/v1") else f"{BASE}/v1/images/generations"
MANIFEST = ASSETS_DIR / "image_manifest.json"


def post_json(url, payload, timeout=300):
    """stdlib HTTP POST,返回 (status, body_text)。"""
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def get_bytes(url, timeout=120):
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return resp.read()


def gen(entry):
    rel = entry["file"]                     # 相对 apps/Douban 的路径,如 assets/images/xx.png
    out = APP / rel
    if out.exists() and out.stat().st_size > 0:
        return (rel, "skip")
    out.parent.mkdir(parents=True, exist_ok=True)
    prompt = entry["prompt_zh"]             # 原样使用,清单已含 无文字无水印 约束
    for attempt in range(3):
        try:
            status, body = post_json(URL, {"model": MODEL, "prompt": prompt, "size": SIZE, "n": 1})
            if status != 200:
                if attempt == 2:
                    return (rel, f"HTTP {status}: {body[:120]}")
                time.sleep(3 * (attempt + 1)); continue
            items = json.loads(body).get("data", [])
            if items and items[0].get("b64_json"):
                out.write_bytes(base64.b64decode(items[0]["b64_json"]))
                return (rel, f"ok {out.stat().st_size}B")
            if items and items[0].get("url"):
                out.write_bytes(get_bytes(items[0]["url"]))
                return (rel, f"ok(url) {out.stat().st_size}B")
            if attempt == 2:
                return (rel, "no image in response")
            time.sleep(3)
        except Exception as e:
            if attempt == 2:
                return (rel, f"EXC {e}")
            time.sleep(3 * (attempt + 1))
    return (rel, "failed")


def main():
    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))["images"]
    print(f"api={URL} model={MODEL} size={SIZE} | {len(entries)} assets")
    ok = skip = 0
    failed = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen, e): e["file"] for e in entries}
        for f in as_completed(futs):
            rel, status = f.result()
            print(f"  {rel}: {status}", flush=True)
            if status == "skip":
                skip += 1
            elif status.startswith("ok"):
                ok += 1
            else:
                failed.append((rel, status))
    print(f"done. ok={ok} skip={skip} fail={len(failed)}")
    for rel, status in failed:
        print(f"  FAIL {rel}: {status}")
    if failed:
        sys.exit(1)
    print("全部就绪。重跑 regen_defaults.py 让种子数据指向 PNG。")


if __name__ == "__main__":
    main()
