# -*- coding: utf-8 -*-
"""
大众点评 §5.3 批量生图。

调用方式对齐 tools/test_api_imggen.py:
  POST {BASE_URL}/v1/images/generations
  model=gpt-image-2, 返回 b64_json

环境变量:
  IMAGE_GEN_API_KEY 或 OPENAI_API_KEY(必填)
  IMAGE_GEN_BASE_URL 默认 https://api.openai.com
  IMAGE_GEN_MODEL 默认 gpt-image-2
  FORCE_REGEN=1 强制覆盖已有图

禁止真机截图作生图输入。
运行: python apps/Dianping/assets/gen_assets.py
"""
from __future__ import annotations

import base64
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

OUT = Path(__file__).parent
SHOPS_DIR = OUT / "shops"
DISHES_DIR = OUT / "dishes"
AVATARS_DIR = OUT / "avatars"
ICONS_DIR = OUT / "icons"
NOTES_DIR = OUT / "notes"
for d in (SHOPS_DIR, DISHES_DIR, AVATARS_DIR, ICONS_DIR, NOTES_DIR):
    d.mkdir(exist_ok=True)

DEFAULTS = Path(__file__).resolve().parents[1] / "data" / "defaults.json"

API_KEY = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("OPENAI_API_KEY") or ""
BASE_URL = os.environ.get("IMAGE_GEN_BASE_URL", "https://api.openai.com").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
FORCE = os.environ.get("FORCE_REGEN", "") in ("1", "true", "yes")
SIZE = "1024x1024"
TIMEOUT = 300
MAX_WORKERS = 3
MAX_RETRY = 3

STYLE_FOOD = (
    "photorealistic food photography for Dianping lifestyle app, appetizing, natural soft light, "
    "shallow depth of field, no text, no watermark, no logo, no UI"
)
STYLE_ICON = (
    "mobile app category icon, cute 3D illustrated style like Chinese super-app icons, "
    "centered subject, soft rounded shapes, vibrant colors, plain light background, "
    "no text, no watermark, no logo"
)
STYLE_AVATAR = (
    "simple friendly avatar portrait illustration, soft colors, circular-friendly crop, "
    "no text, no watermark"
)
STYLE_NOTE = (
    "lifestyle photo for social feed card, food or city dining scene, natural light, "
    "no text, no watermark, no logo"
)

SHOP_PROMPTS = {
    "wangheli": "Chinese seafood hotpot feast with oysters shrimp and red sour soup on restaurant table",
    "pangpang": "cute hand-drawn animal cream birthday cake in bakery display",
    "wuyuesi": "Korean style creative BBQ grilled meats and skewers at night restaurant",
    "luckin": "iced coconut latte coffee in clear cup on cafe table",
    "yeren": "two scoops artisanal ice cream in paper cup close-up",
    "sushiya": "Japanese sukiyaki hot pot with thinly sliced wagyu beef and egg",
    "malatang": "spicy Chinese mala tang soup with wide noodles vegetables and beef",
    "bbqking": "charcoal grilled pork belly BBQ dinner with side dishes",
}

# 店铺额外顶图(item4 顶图多张):g1=门店/环境,g2=招牌菜特写
SHOP_GALLERY = {
    "wangheli": ["cozy Chinese seafood hotpot restaurant interior with tables and warm lights",
                 "fresh live seafood platter oysters and big shrimp on ice close-up"],
    "pangpang": ["bright bakery shop interior with cake display counter",
                 "cute hand-drawn animal cream cake decorated with fruit close-up"],
    "wuyuesi": ["Korean style BBQ restaurant interior at night with grills on tables",
                "sizzling grilled pork belly and skewers on charcoal grill close-up"],
    "luckin": ["modern minimal coffee shop interior with seating",
               "iced coconut latte with milk swirl in clear cup close-up"],
    "yeren": ["small artisanal ice cream shop counter with display",
              "colorful gelato scoops pistachio and mango in cup close-up"],
    "sushiya": ["warm Japanese sukiyaki restaurant interior with wooden tables",
                "sukiyaki hot pot with marbled wagyu beef and raw egg close-up"],
    "malatang": ["clean fast casual mala tang shop interior with ingredient bar",
                 "steaming bowl of spicy mala tang with noodles beef vegetables close-up"],
    "bbqking": ["charcoal BBQ restaurant interior warm ambiance groups dining",
                "charcoal grilled lamb ribs and pork belly with side dishes close-up"],
}

DIAMOND_PROMPTS = {
    "food": "roast chicken and drink, food category",
    "waimai": "brown paper takeout bag with cute face",
    "fun": "karaoke microphone and popcorn",
    "scenic": "palm tree and beach ball travel",
    "movie": "orange cat face and film reel cinema",
    "medical": "blue medical cross and toothbrush dental",
    "photo": "camera and flower photography studio",
    "hotel": "blue bed hotel room icon",
    "massage": "person lying for spa massage pink tones",
    "beauty": "woman silhouette hair salon beauty",
}


def images_url() -> str:
    if BASE_URL.endswith("/v1"):
        return f"{BASE_URL}/images/generations"
    return f"{BASE_URL}/v1/images/generations"


def should_skip(path: Path) -> bool:
    if FORCE:
        return False
    return path.exists() and path.stat().st_size > 8000


def generate_one(path: Path, prompt: str) -> str:
    if should_skip(path):
        return f"skip {path.name}"
    if not API_KEY:
        raise RuntimeError("缺少 IMAGE_GEN_API_KEY / OPENAI_API_KEY")

    url = images_url()
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    payload = {"model": MODEL, "prompt": prompt, "size": SIZE, "n": 1}
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
            if not resp.ok:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:240]}")
            data = resp.json()
            items = data.get("data") or []
            if not items or not items[0].get("b64_json"):
                raise RuntimeError(f"no b64_json: keys={list(data.keys())}")
            path.write_bytes(base64.b64decode(items[0]["b64_json"]))
            kb = path.stat().st_size // 1024
            return f"ok   {path.name} ({kb}KB try{attempt})"
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(1.5 * attempt)
    raise RuntimeError(f"{path.name}: {last_err}")


def build_jobs():
    data = json.loads(DEFAULTS.read_text(encoding="utf-8"))
    jobs: list[tuple[Path, str]] = []

    for shop in data["shops"]:
        sid = shop["id"]
        jobs.append(
            (
                SHOPS_DIR / f"{sid}.png",
                f"{SHOP_PROMPTS.get(sid, shop['category'] + ' restaurant food')}, {STYLE_FOOD}",
            )
        )
        for d in shop.get("dishes", []):
            jobs.append(
                (
                    DISHES_DIR / f"{sid}_{d['id']}.png",
                    f"Chinese dish close-up photo of {d['name']}, delicious plating, {STYLE_FOOD}",
                )
            )
        for gi, gp in enumerate(SHOP_GALLERY.get(sid, []), start=1):
            jobs.append((SHOPS_DIR / f"{sid}_g{gi}.png", f"{gp}, {STYLE_FOOD}"))

    for i in range(1, 9):
        jobs.append((AVATARS_DIR / f"u{i}.png", f"young Asian person avatar style variant {i}, {STYLE_AVATAR}"))

    for kid, desc in DIAMOND_PROMPTS.items():
        jobs.append((ICONS_DIR / f"{kid}.png", f"{desc}, {STYLE_ICON}"))

    for note in data.get("notes", []):
        jobs.append(
            (
                NOTES_DIR / f"{note['id']}.png",
                f"instagram-like dining photo matching theme '{note['title']}', {STYLE_NOTE}",
            )
        )

    # 新人礼圆形入口
    jobs.append(
        (
            ICONS_DIR / "newbie_gift.png",
            f"red gift envelope and coin for newcomer reward app icon, {STYLE_ICON}",
        )
    )
    return jobs


def main() -> None:
    print(f"api: {images_url()}")
    print(f"model: {MODEL}")
    print(f"force: {FORCE}")
    if not API_KEY:
        print("ERROR: set IMAGE_GEN_API_KEY", file=sys.stderr)
        sys.exit(1)

    jobs = build_jobs()
    print(f"jobs: {len(jobs)}")
    ok = fail = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futs = {ex.submit(generate_one, p, prompt): p for p, prompt in jobs}
        for fut in as_completed(futs):
            path = futs[fut]
            try:
                msg = fut.result()
                print(msg, flush=True)
                ok += 1
            except Exception as e:  # noqa: BLE001
                print(f"FAIL {path.name}: {e}", flush=True)
                fail += 1
    print(f"done ok={ok} fail={fail} total={len(jobs)}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
