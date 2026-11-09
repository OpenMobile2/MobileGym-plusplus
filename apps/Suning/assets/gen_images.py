# -*- coding: utf-8 -*-
"""苏宁批量生图(pipeline §5.3):读 assets/image_manifest.json 一次性生成全部位图。

- 幂等:已存在且 >10KB 的 PNG 跳过,失败下次重跑补齐
- 并发 4 线程,单张重试 3 次
运行: python apps/Suning/assets/gen_images.py [--only prefix]
环境变量: IMAGE_GEN_API_KEY(必填); IMAGE_GEN_BASE_URL(本项目用 https://api.openai.com/v1); IMAGE_GEN_MODEL(默认 gpt-image-2)
安全红线: prompt 只含合成主体描述,禁止上传真机截图。
"""
import base64
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(_REPO_ROOT / "tools"))
from image_gen_client import make_image_client, image_gen_model  # noqa: E402

HERE = Path(__file__).parent
MANIFEST = HERE / "image_manifest.json"
MAX_RETRY = 3

client = None


def gen_one(entry: dict) -> str:
    rel = entry["file"]
    out = HERE / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {rel}"
    last_err = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            result = client.images.generate(
                model=image_gen_model(),
                prompt=entry["prompt"],
                n=1,
                size=entry.get("size", "1024x1024"),
            )
            b64 = result.data[0].b64_json
            out.write_bytes(base64.b64decode(b64))
            return f"ok   {rel}"
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(2 * attempt)
    return f"FAIL {rel}: {last_err}"


def main() -> None:
    global client
    only = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]
    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if only:
        entries = [e for e in entries if e["file"].startswith(only)]
    client = make_image_client()
    print(f"待生成 {len(entries)} 张(幂等,已存在自动跳过)")
    fails = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(gen_one, e) for e in entries]
        for i, fut in enumerate(as_completed(futures), 1):
            msg = fut.result()
            if msg.startswith("FAIL"):
                fails += 1
            print(f"[{i}/{len(entries)}] {msg}")
    print(f"完成,失败 {fails} 张" + ("(重跑本脚本补齐)" if fails else ""))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
