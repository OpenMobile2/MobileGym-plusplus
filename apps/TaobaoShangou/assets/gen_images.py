# -*- coding: utf-8 -*-
"""
淘宝闪购 批量生图(pipeline §5.3)。
读 asset_prompts.json(relpath→prompt),生成到 assets/ 对应子目录:
1024x1024 生成 → 512x512 JPEG q82 落盘(控制仓库体积)。
幂等:已存在且>5KB 跳过;失败重试3次;4并发。
运行: python apps/TaobaoShangou/assets/gen_images.py [--only items/ ...]
环境变量: IMAGE_GEN_API_KEY / IMAGE_GEN_BASE_URL / IMAGE_GEN_MODEL
"""
import base64
import io
import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image

_REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(_REPO_ROOT / "tools"))
from image_gen_client import image_gen_model, make_image_client  # noqa: E402

HERE = Path(__file__).parent
PROMPTS = json.loads((HERE / "asset_prompts.json").read_text(encoding="utf-8"))
MAX_RETRY = 3
client = make_image_client()
MODEL = image_gen_model()


def gen_one(relpath: str, prompt: str) -> str:
    out = HERE / relpath
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 5_000:
        return f"skip {relpath}"
    last_err = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            result = client.images.generate(model=MODEL, prompt=prompt, n=1, size="1024x1024", timeout=180)
            item = result.data[0]
            if getattr(item, "b64_json", None):
                raw = base64.b64decode(item.b64_json)
            elif getattr(item, "url", None):
                with urllib.request.urlopen(item.url, timeout=60) as resp:
                    raw = resp.read()
            else:
                raise RuntimeError("no b64_json/url in response")
            img = Image.open(io.BytesIO(raw)).convert("RGB").resize((512, 512), Image.LANCZOS)
            img.save(out, "JPEG", quality=82)
            return f"OK   {relpath}"
        except Exception as e:  # noqa: BLE001
            last_err = e
    return f"FAIL {relpath}: {type(last_err).__name__}: {last_err}"


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    todo = {k: v for k, v in PROMPTS.items()
            if (not only or any(k.startswith(p) for p in only))}
    todo = {k: v for k, v in todo.items()
            if not ((HERE / k).exists() and (HERE / k).stat().st_size > 5_000)}
    print(f"total {len(PROMPTS)} images, to generate: {len(todo)}", flush=True)
    ok = fail = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen_one, k, v): k for k, v in todo.items()}
        for i, f in enumerate(as_completed(futs), 1):
            msg = f.result()
            if msg.startswith("FAIL"):
                fail += 1
                print(f"[{i}/{len(todo)}] {msg}", flush=True)
            else:
                ok += 1
                if i % 10 == 0 or i == len(todo):
                    print(f"[{i}/{len(todo)}] progress ok={ok} fail={fail}", flush=True)
    print(f"DONE ok={ok} fail={fail} (重跑可补齐失败项)", flush=True)


if __name__ == "__main__":
    main()
