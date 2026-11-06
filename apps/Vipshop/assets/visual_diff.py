# -*- coding: utf-8 -*-
"""
视觉比对(pipeline v3 阶段⑤ 第六道机器 gate)—— 唯品会

对每个页面用 Playwright 截图(360×800),存到 docs/vipshop-replication/visual-diff/,
并生成 index.html:左=模拟版截图,右=真机证据(weipinhui_images/ / vipshop_images/)。

用法: 模拟器跑在 :3000 时执行
    python apps/Vipshop/assets/visual_diff.py
"""
from __future__ import annotations

import asyncio
import re
from pathlib import Path

from playwright.async_api import async_playwright

URL = "http://localhost:3000"
REPO = Path(__file__).resolve().parents[5]
OUT = REPO / "docs" / "vipshop-replication" / "visual-diff"
EVID_CANDIDATES = [
    REPO / "vipshop_images",
    REPO / "weipinhui_images",
]


def resolve_evid_root() -> Path:
    for p in EVID_CANDIDATES:
        if p.exists():
            return p.resolve()
    return EVID_CANDIDATES[-1]


EVID = resolve_evid_root()


def build_img_map(root: Path) -> dict[int, str]:
    mapping: dict[int, str] = {}
    if not root.exists():
        return mapping
    for f in root.iterdir():
        if f.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        m = re.search(r"_(\d+)_4\.", f.name)
        if m:
            mapping[int(m.group(1))] = f.name
    return mapping


IMG_MAP = build_img_map(EVID)


def evid_file(img_no: int | None) -> str | None:
    if img_no is None:
        return None
    return IMG_MAP.get(img_no)


# (name, route, IMG_XX 编号或 None)
PAGES: list[tuple[str, str, int | None]] = [
    ("home", "/", 1),
    ("home-cat-women", "/?cat=women", 273),
    ("login", "/login", None),
    ("sms", "/login/sms", None),
    ("oauth", "/login/oauth", None),
    ("discover", "/discover", None),
    ("brand", "/brand/hy", 3),
    ("brands", "/brands", None),
    ("flash", "/flash", 2),
    ("category", "/category/women", None),
    ("search", "/search", None),
    ("search-suggest", "/search/suggest", None),
    ("search-result", "/search/result", 4),
    ("search-filter", "/search/result?q=连衣裙&filter=open", None),
    ("detail", "/detail/it001", 5),
    ("cart", "/cart", 6),
    ("cart-addon", "/cart/addon", None),
    ("order-confirm", "/order/confirm", 7),
    ("pay-success", "/order/success", None),
    ("orders", "/orders", 8),
    ("order-detail", "/orders/o2", 17),
    ("order-refund", "/orders/o2/refund", None),
    ("order-refund-exchange", "/orders/o2/refund/exchange", None),
    ("order-refund-return", "/orders/o2/refund/return", None),
    ("order-logistics", "/orders/o2/logistics", None),
    ("order-trace", "/orders/o2/trace", 17),
    ("order-review", "/orders/o3/review", None),
    ("mine", "/me", 278),
    ("favorites", "/favorites", 22),
    ("footprints", "/footprints", None),
    ("coupons", "/coupons", None),
    ("vipcoin", "/vipcoin", None),
    ("vipfloat", "/vipfloat", 20),
    ("address", "/address", None),
    ("address-edit", "/address/edit", 18),
    ("settings", "/settings", 19),
    ("messages", "/messages", None),
    ("chat", "/messages/chat", 21),
    ("pricedrop", "/messages/pricedrop", None),
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    page_errors: dict[str, list[str]] = {}
    cur = {"name": "boot"}
    evid_rel = EVID.name  # vipshop_images or weipinhui_images

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 360, "height": 800}, device_scale_factor=2)
        page.on(
            "pageerror",
            lambda e: page_errors.setdefault(cur["name"], []).append(f"pageerror: {str(e)[:120]}"),
        )

        def on_console(m):
            if m.type != "error":
                return
            if any(x in m.text for x in ("404", "WMR", "favicon")):
                return
            page_errors.setdefault(cur["name"], []).append(f"console: {m.text[:120]}")

        page.on("console", on_console)
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1800)

        done: list[tuple[str, str, str | None, str]] = []
        for name, route, img_no in PAGES:
            try:
                cur["name"] = name
                await page.evaluate("(r) => window.__OS__.openApp('vipshop', r)", route)
                await page.wait_for_timeout(1100)
                shot = OUT / f"{name}.png"
                await page.screenshot(path=str(shot))
                done.append((name, route, evid_file(img_no), shot.name))
                tag = f"IMG_{img_no:02d}" if img_no is not None else "-"
                print(f"  [OK] {name:22s} {route:32s} evid={tag}")
            except Exception as e:
                print(f"  [ERR] {name:22s} {route}  {str(e)[:80]}")
        await browser.close()

    rows = []
    for name, route, evid, shot in done:
        if evid:
            real_cell = f'<img src="../../{evid_rel}/{evid}"/>'
        else:
            real_cell = '<div class="noev">(无对应真机证据 / 见 review.html)</div>'
        rows.append(f"""
        <div class="row">
          <div class="meta"><b>{name}</b><br><code>{route}</code></div>
          <div class="pair">
            <figure><figcaption>模拟版</figcaption><img src="{shot}"/></figure>
            <figure><figcaption>真机</figcaption>{real_cell}</figure>
          </div>
        </div>""")

    evid_imgs = sorted(pp.name for pp in EVID.glob("*.jpg")) if EVID.exists() else []
    html = f"""<!doctype html><meta charset="utf-8"><title>唯品会 视觉比对</title>
<style>
body{{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:16px}}
h1{{font-size:18px}} .row{{background:#fff;border-radius:10px;padding:12px;margin-bottom:14px;display:flex;gap:16px}}
.meta{{width:160px;font-size:13px;color:#333}} code{{font-size:11px;color:#E4007F}}
.pair{{display:flex;gap:12px}} figure{{margin:0}} figcaption{{font-size:11px;color:#888;text-align:center;margin-bottom:4px}}
img{{width:200px;border:1px solid #eee;border-radius:6px;display:block;max-height:420px;object-fit:cover;object-position:top}}
.noev{{width:200px;height:60px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;border:1px dashed #ddd;border-radius:6px}}
.evidence{{background:#fff;border-radius:10px;padding:12px;margin-top:8px}}
.evidence img{{width:120px;display:inline-block;margin:4px;max-height:200px;object-fit:cover;object-position:top}}
</style>
<h1>唯品会 模拟版 vs 真机 · 逐页视觉比对({len(done)} 页)</h1>
<p style="font-size:12px;color:#666">真机像素基准: <code>{evid_rel}/</code>（与 <code>weipinhui_images/</code> 同源）。打开本页逐页对照。</p>
{''.join(rows)}
<div class="evidence"><b>真机证据图库({evid_rel}/)</b><br>
{''.join(f'<img src="../../{evid_rel}/{n}"/>' for n in evid_imgs)}
</div>
"""
    (OUT / "index.html").write_text(html, encoding="utf-8")
    paired = sum(1 for _, _, evid, _ in done if evid)
    print(f"\n截图 {len(done)} 页 -> {OUT}")
    print(f"真机证据配对: {paired}/{len(done)}（根目录 {EVID}）")
    print("index.html 已生成")
    bad = {k: v for k, v in page_errors.items() if v}
    if bad:
        print("\n全页渲染 console/page 错误(零容忍):")
        for k, v in bad.items():
            for e in sorted(set(v))[:3]:
                print(f"  - [{k}] {e}")
    else:
        print(f"全 {len(done)} 页渲染无 console/page 错误。")


if __name__ == "__main__":
    asyncio.run(main())
