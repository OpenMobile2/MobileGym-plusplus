#!/usr/bin/env python3
"""
网易云复刻 — 批量生成封面(pipeline §5.3)。
读 data/defaults.json,为每个 song/playlist/album/artist/rank/podcast/note 的 seed 生成 <seed>.png 到 assets/gen/。

用法:
  export IMAGE_GEN_API_KEY=sk-...        # 必填(或 TOKENHUB_API_KEY)
  export IMAGE_GEN_BASE_URL=...          # 可选,默认见下
  python3 assets/gen_covers.py           # 断点续跑:已存在的 <seed>.png 跳过
  python3 assets/gen_covers.py --only s_001,anpo   # 只生成指定 seed

无 key 时报错退出;不硬编码 key。
"""
import base64, json, os, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULTS = os.path.join(HERE, "..", "data", "defaults.json")
OUT = os.path.join(HERE, "gen")
SIZE = "1024x1024"
WORKERS = 4
MODEL = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
# OpenAI 兼容端点；自定义网关通过 IMAGE_GEN_BASE_URL 覆盖。
BASE = os.environ.get("IMAGE_GEN_BASE_URL", "https://api.openai.com").rstrip("/")
KEY = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")


def url():
    return f"{BASE}/images/generations" if BASE.endswith("/v1") else f"{BASE}/v1/images/generations"


def mood(tags):
    t = " ".join(tags)
    if "国风" in t or "古" in t:
        return "chinese ink-wash aesthetic, misty mountains, elegant"
    if "民谣" in t:
        return "warm folk, sunset field, acoustic mood"
    return "moody cinematic lighting, soft gradient, artistic"


def build_items():
    d = json.load(open(DEFAULTS, encoding="utf-8"))
    items = {}
    for s in d["songs"]:
        items[s["seed"]] = f"album cover art for a Chinese pop song, {mood(s.get('tags',[]))}, abstract, high quality, NO TEXT no letters no words"
    for a in d["albums"]:
        items[a["seed"]] = f"music album cover, contemporary Chinese, artistic photography, {mood([])}, NO TEXT"
    for p in d["playlists"]:
        items[p["seed"]] = f"music playlist cover, themed collage, {mood([p.get('tag','')])}, vibrant, NO TEXT"
    for ar in d["artists"]:
        items[ar["seed"]] = "artistic portrait of an Asian musician, studio lighting, moody, editorial photography, NO TEXT"
    for r in d["ranks"]:
        items[r["seed"]] = f"music chart cover art, bold gradient, dynamic, {mood([])}, NO TEXT"
    for pod in d["podcasts"]:
        items[pod["seed"]] = "podcast cover art, minimal, microphone motif, warm tones, NO TEXT"
    for e in d["episodes"]:
        items[e["seed"]] = "podcast episode cover, cinematic still, warm nostalgic tone, NO TEXT"
    for n in d["notes"]:
        seed = n.get("coverSeed") or n["seed"]
        items[seed] = "lifestyle photo, concert or music moment, film grain, atmospheric, NO TEXT"
    return items


def gen_one(seed, prompt):
    path = os.path.join(OUT, f"{seed}.png")
    if os.path.exists(path):
        return seed, "skip"
    for attempt in range(3):
        try:
            r = requests.post(url(), headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
                              json={"model": MODEL, "prompt": prompt, "size": SIZE, "n": 1}, timeout=300)
            if r.status_code == 401:
                return seed, "AUTH_FAIL"
            r.raise_for_status()
            data = r.json().get("data", [])
            b64 = data[0].get("b64_json") if data else None
            if not b64 and data and data[0].get("url"):
                img = requests.get(data[0]["url"], timeout=120)
                open(path, "wb").write(img.content)
                return seed, "ok(url)"
            if not b64:
                return seed, "no_image"
            open(path, "wb").write(base64.b64decode(b64))
            return seed, "ok"
        except Exception as e:
            if attempt == 2:
                return seed, f"ERR:{type(e).__name__}"
            time.sleep(2 * (attempt + 1))
    return seed, "ERR"


def main():
    if not KEY:
        print("错误: 未设置 IMAGE_GEN_API_KEY(或 TOKENHUB_API_KEY)。", file=sys.stderr)
        sys.exit(1)
    os.makedirs(OUT, exist_ok=True)
    items = build_items()
    only = None
    if len(sys.argv) > 2 and sys.argv[1] == "--only":
        only = set(sys.argv[2].split(","))
        items = {k: v for k, v in items.items() if k in only}
    print(f"endpoint={url()} model={MODEL} items={len(items)}")
    results = {}
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(gen_one, s, p): s for s, p in items.items()}
        for f in as_completed(futs):
            seed, status = f.result()
            results[seed] = status
            print(f"  {seed}: {status}")
            if status == "AUTH_FAIL":
                print("!! 令牌不可用(401),中止。请更新 IMAGE_GEN_API_KEY。", file=sys.stderr)
                ex.shutdown(wait=False, cancel_futures=True)
                sys.exit(2)
    ok = sum(1 for v in results.values() if v.startswith("ok"))
    skip = sum(1 for v in results.values() if v == "skip")
    manifest = {"generated": sorted([s for s, v in results.items() if v.startswith("ok") or v == "skip"]), "model": MODEL}
    json.dump(manifest, open(os.path.join(HERE, "asset_manifest.json"), "w"), ensure_ascii=False, indent=1)
    print(f"done: ok={ok} skip={skip} total={len(results)}")


if __name__ == "__main__":
    main()
