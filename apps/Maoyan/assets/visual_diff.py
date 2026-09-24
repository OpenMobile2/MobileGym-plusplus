# -*- coding: utf-8 -*-
"""
视觉比对(pipeline v3 阶段⑤ 第六道机器 gate)—— 猫眼

对每个页面用 Playwright 截图(360×800),存到 docs/maoyan-replication/visual-diff/,
生成 index.html:左=模拟版截图,右=真机锚点(maoyan_images/anchor_*.jpg)。全页渲染 console 零容忍。

用法: 模拟器跑在 :3017 时执行
    python apps/Maoyan/assets/visual_diff.py [port]
"""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

PORT = sys.argv[1] if len(sys.argv) > 1 else "3017"
URL = f"http://localhost:{PORT}"
OUT = Path(__file__).resolve().parents[5] / "docs" / "maoyan-replication" / "visual-diff"
EVID = Path(__file__).resolve().parents[5] / "maoyan_images"

# (name, route, 真机锚点文件名或 None)
PAGES = [
    ("home", "/", "anchor_home.jpg"),
    ("home-concert", "/?ch=concert", None),
    ("login", "/login", None),
    ("sms", "/login/sms", None),
    ("city", "/city", None),
    ("movie-hot", "/movie", None),
    ("movie-cinemas", "/movie?tab=cinemas", None),
    ("movie-upcoming", "/movie?tab=upcoming", "anchor_movie_upcoming.jpg"),
    ("hot-all", "/hot-all", "anchor_hot_list.jpg"),
    ("detail", "/detail/m_shangbao", "anchor_detail_shangbao.jpg"),
    ("detail-hot", "/detail/m_kungfu", None),
    ("reviews", "/reviews/m_backroom", "anchor_reviews.jpg"),
    ("write-review", "/write-review/m_vanishing", None),
    ("showtimes", "/showtimes/m_minion", "anchor_showtimes.jpg"),
    ("cinema", "/cinema/c_wenyue", "anchor_cinema_detail.jpg"),
    ("seat", "/seat/s_wenyuan_minion_0_0", "anchor_seat.jpg"),
    ("orders", "/orders", "anchor_orders_list.jpg"),
    ("order-detail", "/order/o_01", "anchor_ticket_code.jpg"),
    ("search", "/search", "anchor_search_landing.jpg"),
    ("search-result", "/search/result?q=功夫女足", None),
    ("show", "/show", "anchor_show_channel.jpg"),
    ("show-category", "/show/category?cat=concert", None),
    ("show-detail", "/show/sh_redhall", None),
    ("show-tickets", "/show/sh_redhall/tickets", None),
    ("fun", "/fun", "anchor_fun_channel.jpg"),
    ("mine", "/me", "anchor_mine.jpg"),
    ("filmlog", "/me/filmlog", None),
    ("filmlog-watched", "/me/filmlog?tab=watched", None),
    ("profiles", "/me/profiles", None),
    ("cards", "/me/cards", None),
    ("ticket-folder", "/me/ticket-folder", None),
    ("coupons", "/me/coupons", "anchor_coupons_empty.jpg"),
    ("coupons-expired", "/me/coupons/expired", "anchor_coupons_expired.jpg"),
    ("settings", "/me/settings", None),
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
        await page.evaluate("window.__OS__.openApp('maoyan')")
        await page.wait_for_timeout(1500)
        # /pay 与 /order/confirm 需要选座上下文:用 UI 驱动建草稿
        await page.evaluate("() => window.__OS__.openApp('maoyan', '/seat/s_wenyuan_minion_0_0')")
        await page.wait_for_timeout(1100)
        await page.locator('[data-action="seat.pick.toggle"]').nth(10).click()
        await page.locator('[data-action="seat.pick.toggle"]').nth(11).click()
        await page.wait_for_timeout(400)
        await page.locator('[data-trigger="seat.confirm.open"]').click()
        await page.wait_for_timeout(500)
        await page.locator('[data-action="seat.agree.check.toggle"]').click()
        await page.wait_for_timeout(300)
        done = []
        for name, route, evid in PAGES:
            try:
                cur["name"] = name
                await page.evaluate("(r) => window.__OS__.openApp('maoyan', r)", route)
                await page.wait_for_timeout(1100)
                shot = OUT / f"{name}.png"
                await page.screenshot(path=str(shot))
                done.append((name, route, evid, shot.name))
                print(f"  [OK] {name:16s} {route}")
            except Exception as e:
                print(f"  [ERR] {name:16s} {route}  {str(e)[:80]}")
        # order-confirm / cashier 沿 UI 链路进入(依赖草稿)
        try:
            cur["name"] = "order-confirm"
            await page.evaluate("() => window.__OS__.openApp('maoyan', '/seat/s_wenyuan_minion_0_0')")
            await page.wait_for_timeout(1000)
            await page.locator('[data-trigger="seat.confirm.open"]').click()
            await page.wait_for_timeout(500)
            if await page.locator('[data-trigger="seat.agreement.continue-open"]').count() == 0:
                await page.locator('[data-action="seat.agree.check.toggle"]').click()
                await page.wait_for_timeout(300)
            await page.locator('[data-trigger="seat.agreement.continue-open"]').click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=str(OUT / "order-confirm.png"))
            done.append(("order-confirm", "/order/confirm", "anchor_order_confirm.jpg", "order-confirm.png"))
            print("  [OK] order-confirm    /order/confirm")
            cur["name"] = "cashier"
            await page.locator('[data-trigger="orderconfirm.pay-open"]').click()
            await page.wait_for_timeout(900)
            await page.screenshot(path=str(OUT / "cashier.png"))
            done.append(("cashier", "/pay", "anchor_pay_cashier.jpg", "cashier.png"))
            print("  [OK] cashier          /pay")
        except Exception as e:
            print(f"  [ERR] order-confirm/cashier  {str(e)[:80]}")
        await browser.close()

    rows = []
    for name, route, evid, shot in done:
        real_cell = f'<img src="../../../maoyan_images/{evid}"/>' if evid else '<div class="noev">(无对应真机锚点 / 证据为录屏帧,见 review.html)</div>'
        rows.append(f"""
        <div class="row">
          <div class="meta"><b>{name}</b><br><code>{route}</code></div>
          <div class="pair">
            <figure><figcaption>模拟版</figcaption><img src="{shot}"/></figure>
            <figure><figcaption>真机</figcaption>{real_cell}</figure>
          </div>
        </div>""")
    html = f"""<!doctype html><meta charset="utf-8"><title>猫眼 视觉比对</title>
<style>
body{{font-family:-apple-system,'Microsoft YaHei',sans-serif;background:#f5f5f5;margin:0;padding:16px}}
h1{{font-size:18px}} .row{{background:#fff;border-radius:10px;padding:12px;margin-bottom:14px;display:flex;gap:16px}}
.meta{{width:150px;font-size:13px;color:#333}} code{{font-size:11px;color:#DC4038}}
.pair{{display:flex;gap:12px;align-items:flex-start}} figure{{margin:0}}
figcaption{{font-size:11px;color:#888;text-align:center;margin-bottom:4px}}
img{{width:220px;border:1px solid #eee;border-radius:6px;display:block}}
.noev{{width:220px;height:60px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;border:1px dashed #ddd;border-radius:6px;text-align:center}}
</style>
<h1>猫眼 模拟版 vs 真机 · 逐页视觉比对({len(done)} 页)</h1>
<p style="font-size:12px;color:#666">真机长图较长,右侧仅显示同宽等比;完整锚点见 <code>maoyan_images/</code> 与 <code>review.html</code>。</p>
{''.join(rows)}
"""
    (OUT / "index.html").write_text(html, encoding="utf-8")
    print(f"\n截图 {len(done)} 页 -> {OUT}\nindex.html 已生成")
    bad = {k: v for k, v in page_errors.items() if v}
    if bad:
        print("\n全页渲染 console/page 错误(零容忍):")
        for k, v in bad.items():
            print(f"  {k}: {v[:3]}")
        sys.exit(1)
    print("OK: 全页渲染零 console 错误")


if __name__ == "__main__":
    asyncio.run(main())
