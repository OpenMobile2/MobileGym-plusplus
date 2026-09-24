# -*- coding: utf-8 -*-
"""
唯品会复刻 · 装饰位图批量生成(pipeline v3 §5.3)

在**你自己的机器上**运行(云沙箱连不通生图网关)。幂等:已存在的 PNG 自动跳过;
网关偶发 404/超时可重跑只补缺失项。真机截图不得作为生图输入。

用法:
    # 1) 配置环境变量(key 不要写进代码/不要提交 git)
    export IMAGE_GEN_API_KEY="sk-..."                       # 你的 key
    export IMAGE_GEN_BASE_URL="http://15.204.107.114:3009"  # 你 test_api_imggen.py 里的网关
    export IMAGE_GEN_MODEL="gpt-image-2"
    # 2) 在 mobilegym 仓库根目录运行
    python apps/Vipshop/assets/gen_item_images.py

依赖:pip install requests
"""
from __future__ import annotations
import base64, json, os, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent
MANIFEST = HERE / "asset_manifest.json"
CONCURRENCY = 4
TIMEOUT = 300
RETRIES = 3


def cfg():
    key = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
    if not key:
        sys.exit("错误: 未设置 IMAGE_GEN_API_KEY(或 TOKENHUB_API_KEY)。")
    base = os.environ.get("IMAGE_GEN_BASE_URL", "https://example.invalid/v1").rstrip("/")
    url = base + ("/images/generations" if base.endswith("/v1") else "/v1/images/generations")
    model = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
    return url, key, model


def gen_one(url, key, model, prompt, size, out: Path):
    if out.exists() and out.stat().st_size > 0:
        return f"skip  {out.name}"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": model, "prompt": prompt, "size": size, "n": 1}
    last = ""
    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
            if not r.ok:
                last = f"HTTP {r.status_code}: {r.text[:180]}"
                time.sleep(2 * attempt); continue
            data = r.json().get("data", [])
            b64 = data[0].get("b64_json") if data else None
            if not b64:
                last = "响应无 b64_json"; time.sleep(2 * attempt); continue
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(base64.b64decode(b64))
            return f"OK    {out.name}"
        except Exception as e:
            last = f"{type(e).__name__}: {e}"; time.sleep(2 * attempt)
    return f"FAIL  {out.name} — {last}"


def main():
    url, key, model = cfg()
    m = json.loads(MANIFEST.read_text(encoding="utf-8"))
    out_dir = Path(m["out_dir"])
    default_size = m.get("size", "768x1024")
    jobs = []
    for item in m.get("products", []):
        jobs.append((item["prompt"], item.get("size", default_size), out_dir / f"{item['id']}.png"))
    for item in m.get("avatars", []):
        jobs.append((item["prompt"], item.get("size", "256x256"), out_dir / f"{item['id']}.png"))

    print(f"生图网关: {url} | 模型: {model} | 待生成: {len(jobs)} 张 -> {out_dir}")
    ok = skip = fail = 0
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futs = {ex.submit(gen_one, url, key, model, p, s, o): o for (p, s, o) in jobs}
        for f in as_completed(futs):
            line = f.result(); print(" ", line)
            ok += line.startswith("OK"); skip += line.startswith("skip"); fail += line.startswith("FAIL")
    print(f"完成: 新生成 {ok} · 跳过 {skip} · 失败 {fail}(失败可重跑本脚本只补缺失)")
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
