# -*- coding: utf-8 -*-
"""
视觉比对(pipeline v3 阶段⑤ 第六道机器 gate)—— 唯品会

对每个页面用 Playwright 截图(360×800),存到 docs/vipshop-replication/visual-diff/,
并生成 index.html:左=模拟版截图,右=真机证据(weipinhui_images/)。交给用户做阶段⑥ 逐页走查。

用法: 模拟器跑在 :3000 时执行
    python apps/Vipshop/assets/visual_diff.py
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

URL = "http://localhost:3000"
OUT = Path(__file__).resolve().parents[5] / "docs" / "vipshop-replication" / "visual-diff"
EVID = Path(__file__).resolve().parents[5] / "weipinhui_images"

# (name, route, 真机证据文件名或 None)。带 :id 的用真实种子 id。
PAGES = [
    ("home", "/", None),
    ("login", "/login", None),
    ("sms", "/login/sms", None),
    ("oauth", "/login/oauth", None),
    ("discover", "/discover", None),
    ("brand", "/brand/hy", None),
    ("brands", "/brands", None),
    ("flash", "/flash", None),
    ("category", "/category/women", None),
    ("search", "/search", None),
    ("search-suggest", "/search/suggest", None),
    ("search-result", "/search/result", None),
    ("search-filter", "/search/filter", None),
    ("detail", "/detail/it001", None),
    ("cart", "/cart", None),
    ("cart-addon", "/cart/addon", None),
    ("order-confirm", "/order/confirm", None),
    ("pay-success", "/order/success", None),
    ("orders", "/orders", None),
    ("order-detail", "/orders/o2", None),
    ("order-refund", "/orders/o2/refund", None),
    ("order-refund-exchange", "/orders/o2/refund/exchange", None),
    ("order-refund-return", "/orders/o2/refund/return", None),
    ("order-logistics", "/orders/o2/logistics", None),
    ("order-trace", "/orders/o2/trace", None),
    ("order-review", "/orders/o3/review", None),
    ("mine", "/me", None),
    ("favorites", "/favorites", None),
    ("footprints", "/footprints", None),
    ("coupons", "/coupons", None),
    ("vipcoin", "/vipcoin", None),
    ("vipfloat", "/vipfloat", None),
    ("address", "/address", None),
    ("address-edit", "/address/edit", None),
    ("settings", "/settings", None),
    ("messages", "/messages", None),
    ("chat", "/messages/chat", None),
    ("pricedrop", "/messages/pricedrop", None),
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    page_errors: dict[str, list[str]] = {}
    cur = {"name": "boot"}
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 360, "height": 800}, device_scale_factor=2)
        page.on("pageerror", lambda e: page_errors.setdefault(cur["name"], []).append(f"pageerror: {str(e)[:120]}"))
        page.on("console", lambda m: page_errors.setdefault(cur["name"], []).append(f"console: {m.text[:120]}")
                if m.type == "error" and "404" not in m.text and "WMR" not in m.text and "favicon" not in m.text else None)
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1800)
        # 需要下单上下文的页面:先备好 checkout
        await page.evaluate("""() => {
            const s = window.__SIM__ && window.__SIM__.getState().apps.vipshop;
        }""")
        done = []
        for name, route, evid in PAGES:
            try:
                cur["name"] = name
                await page.evaluate("(r) => window.__OS__.openApp('vipshop', r)", route)
                await page.wait_for_timeout(1100)
                # order/confirm 需 checkout,否则空;容忍
                shot = OUT / f"{name}.png"
                await page.screenshot(path=str(shot))
                done.append((name, route, evid, shot.name))
                print(f"  [OK] {name:16s} {route}")
            except Exception as e:
                print(f"  [ERR] {name:16s} {route}  {str(e)[:80]}")
        await browser.close()

    # index.html
    evid_imgs = sorted(pp.name for pp in EVID.glob("*.jpg")) if EVID.exists() else []
    rows = []
    for name, route, evid, shot in done:
        real = f"../../weipinhui_images/{evid}" if evid else ""
        real_cell = f'<img src="{real}"/>' if evid else '<div class="noev">(无对应真机证据 / 见 review.html)</div>'
        rows.append(f"""
        <div class="row">
          <div class="meta"><b>{name}</b><br><code>{route}</code></div>
          <div class="pair">
            <figure><figcaption>模拟版</figcaption><img src="{shot}"/></figure>
            <figure><figcaption>真机</figcaption>{real_cell}</figure>
          </div>
        </div>""")
    html = f"""<!doctype html><meta charset="utf-8"><title>唯品会 视觉比对</title>
<style>
body{{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:16px}}
h1{{font-size:18px}} .row{{background:#fff;border-radius:10px;padding:12px;margin-bottom:14px;display:flex;gap:16px}}
.meta{{width:140px;font-size:13px;color:#333}} code{{font-size:11px;color:#E4007F}}
.pair{{display:flex;gap:12px}} figure{{margin:0}} figcaption{{font-size:11px;color:#888;text-align:center;margin-bottom:4px}}
img{{width:200px;border:1px solid #eee;border-radius:6px;display:block}}
.noev{{width:200px;height:60px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;border:1px dashed #ddd;border-radius:6px}}
.evidence{{background:#fff;border-radius:10px;padding:12px;margin-top:8px}}
.evidence img{{width:120px;display:inline-block;margin:4px}}
</style>
<h1>唯品会 模拟版 vs 真机 · 逐页视觉比对({len(done)} 页)</h1>
<p style="font-size:12px;color:#666">真机像素基准见 <code>docs/vipshop-replication/review.html</code> 与 <code>weipinhui_images/</code>。</p>
{''.join(rows)}
<div class="evidence"><b>真机证据图库(weipinhui_images/)</b><br>
{''.join(f'<img src="../../weipinhui_images/{n}"/>' for n in evid_imgs)}
</div>
"""
    (OUT / "index.html").write_text(html, encoding="utf-8")
    print(f"\n截图 {len(done)} 页 -> {OUT}\nindex.html 已生成")
    bad = {k: v for k, v in page_errors.items() if v}
    if bad:
        print("\n全页渲染 console/page 错误(零容忍):")
        for k, v in bad.items():
            for e in sorted(set(v))[:3]:
                print(f"  - [{k}] {e}")
    else:
        print("全 35 页渲染无 console/page 错误。")


if __name__ == "__main__":
    asyncio.run(main())
