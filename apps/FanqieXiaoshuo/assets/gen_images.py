# -*- coding: utf-8 -*-
"""
番茄免费小说 mock — 装饰位图生成器(pipeline §5.3)

按 catalog.py 生成:书封(竖版 1024x1536,不支持时回退 1024x1024)→ covers/、头像(1024x1024)→ avatars/
- 直连 OpenAI 兼容 /v1/images/generations(requests;该网关与 openai SDK 不兼容)
- 幂等:已存在且 >10KB 的 PNG 跳过;并发 4;单张超时 300s
运行: python apps/FanqieXiaoshuo/assets/gen_images.py
环境变量: IMAGE_GEN_API_KEY(推荐) 或 TOKENHUB_API_KEY;可选 IMAGE_GEN_BASE_URL / IMAGE_GEN_MODEL
"""
import base64
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

_HERE = Path(__file__).resolve().parent
_REPO_ROOT = _HERE.parents[4]
sys.path.insert(0, str(_REPO_ROOT / "tools"))
sys.path.insert(0, str(_HERE))
from image_gen_client import require_image_gen_config, image_gen_model  # noqa: E402
from catalog import BOOKS, AUTHORS, USERS  # noqa: E402

COVER_DIR = _HERE / "covers"
AVATAR_DIR = _HERE / "avatars"
COVER_DIR.mkdir(exist_ok=True)
AVATAR_DIR.mkdir(exist_ok=True)

COVER_STYLE = "网络小说竖版封面插画,构图完整,色彩氛围强,高清细节,无任何文字、无水印、无logo、无边框"
AVATAR_STYLE = "社交App圆形头像用图,居中构图,简洁背景,高清,无任何文字、无水印"

JOBS = []
for b in BOOKS:
    JOBS.append((COVER_DIR / f"{b['id']}.png", f"{b['cover']},{COVER_STYLE}", "1024x1536"))
for aid, a in AUTHORS.items():
    JOBS.append((AVATAR_DIR / f"{aid}.png", f"{a['avatar']},{AVATAR_STYLE}", "1024x1024"))
for uid, u in USERS.items():
    JOBS.append((AVATAR_DIR / f"{uid}.png", f"{u['avatar']},{AVATAR_STYLE}", "1024x1024"))

BASE_URL, API_KEY = require_image_gen_config()
MODEL = image_gen_model()
GEN_URL = BASE_URL.rstrip("/")
GEN_URL = GEN_URL + "/images/generations" if GEN_URL.endswith("/v1") else GEN_URL + "/v1/images/generations"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
MAX_RETRY = 3


def call_api(prompt: str, size: str) -> bytes:
    r = requests.post(GEN_URL, headers=HEADERS, timeout=300,
                      json={"model": MODEL, "prompt": prompt, "n": 1, "size": size})
    r.raise_for_status()
    item = r.json()["data"][0]
    if item.get("b64_json"):
        return base64.b64decode(item["b64_json"])
    if item.get("url"):
        return requests.get(item["url"], timeout=60).content
    raise RuntimeError("API 既没返回 b64_json 也没返回 url")


def gen_one(out: Path, prompt: str, size: str) -> str:
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {out.name}(已存在)"
    last_err = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            try:
                image_bytes = call_api(prompt, size)
            except requests.HTTPError as he:
                # 竖版尺寸不支持时回退方图
                if size != "1024x1024" and he.response is not None and he.response.status_code == 400:
                    image_bytes = call_api(prompt, "1024x1024")
                else:
                    raise
            out.write_bytes(image_bytes)
            return f"OK   {out.name} ({len(image_bytes)//1024}KB)"
        except Exception as e:  # noqa: BLE001
            last_err = e
    return f"FAIL {out.name}: {last_err}"


def main():
    todo = [(o, p, s) for o, p, s in JOBS if not (o.exists() and o.stat().st_size > 10_000)]
    print(f"total={len(JOBS)} todo={len(todo)} model={MODEL} url={GEN_URL}")
    ok = fail = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen_one, o, p, s): o for o, p, s in todo}
        for fut in as_completed(futs):
            msg = fut.result()
            print(msg, flush=True)
            if msg.startswith("FAIL"):
                fail += 1
            else:
                ok += 1
    print(f"done: ok={ok} fail={fail} (失败可重跑补齐)")


if __name__ == "__main__":
    main()
