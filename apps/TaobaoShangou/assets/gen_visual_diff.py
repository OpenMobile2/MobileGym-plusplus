# -*- coding: utf-8 -*-
"""
视觉比对(pipeline v3 第六道 gate):Playwright 截 mock 各页 → 与真机截图并排拼图
输出 docs/elema-replication/visual-diff/*.jpg + index.html
用法: /Users/user/opt/anaconda3/envs/seeact/bin/python apps/TaobaoShangou/assets/gen_visual_diff.py [url]
"""
import asyncio
import io
import sys
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3001"
REPO = Path(__file__).resolve().parents[5]
EVID = REPO / "elema_images"
OUT = REPO / "docs/elema-replication/visual-diff"
OUT.mkdir(exist_ok=True)

# (名称, 路由 或 flow:xxx, 证据图)
PAIRS = [
    ("home", "/", "IMG_6004.PNG"),
    ("channel-food", "/channel/food", "IMG_6005.PNG"),
    ("channel-food-sort", "/channel/food?panel=sort", "IMG_6010.PNG"),
    ("channel-food-filter", "/channel/food?panel=filter", "IMG_6011.PNG"),
    ("channel-market", "/channel/market", "IMG_6007.PNG"),
    ("channel-fruit", "/channel/fruit", "IMG_6009.PNG"),
    ("channel-medicine", "/channel/medicine", "IMG_6008.PNG"),
    ("medicine-category", "/channel/medicine/cat?cat=%E6%84%9F%E5%86%92%E5%8F%91%E7%83%A7", "chemist/IMG_6090 2.PNG"),
    ("drug-detail", "/drug/taino", "chemist/IMG_6095 2.PNG"),
    ("pharmacy-shop", "/retail/p_gaoji", "chemist/IMG_6097 2.PNG"),
    ("hotdeals", "/hotdeals", "IMG_6004.PNG"),
    ("daily-redpacket", "/daily-redpacket", "IMG_6067.PNG"),
    ("search-entry", "/search", "IMG_6025.PNG"),
    ("search-result", "/search/result?q=%E9%85%B8%E5%A5%B6", "IMG_6069.PNG"),
    ("shop-restaurant", "/shop/s_qimei", "IMG_6012.PNG"),
    ("shop-sku", "/shop/s_qimei?panel=sku&item=s_qimei__sf_crab_combo", "IMG_6014.PNG"),
    ("shop-coupons", "/shop/s_xijie?panel=coupons", "IMG_6049.PNG"),
    ("shop-foodcard", "/shop/s_qimei?panel=foodcard", "IMG_6022.PNG"),
    ("shop-reviews", "/shop/s_qimei?tab=reviews", "IMG_6016.PNG"),
    ("shop-merchant", "/shop/s_qimei?tab=merchant", "IMG_6017.PNG"),
    ("shop-retail", "/retail/s_lusen", "IMG_6050.PNG"),
    ("shop-retail-goods", "/retail/s_lusen?tab=goods", "IMG_6073.PNG"),
    ("group-order", "/shop/s_xiangweiji/group", "IMG_6045.PNG"),
    ("cart", "/cart", "IMG_6053.PNG"),
    ("orders", "/orders", "IMG_6033.PNG"),
    ("order-delivered", "/order/o1001", "IMG_6055.PNG"),
    ("order-canceled", "/order/o1004", "IMG_6079.PNG"),
    ("refund-reason", "/order/o1001?panel=refund-reason", "IMG_6072.PNG"),
    ("refund-progress", "/order/o1005/refund", "IMG_6070.PNG"),
    ("review-write", "/order/o1001/review", "IMG_6035.PNG"),
    ("review-center", "/review-center", "IMG_6046.PNG"),
    ("service-agent", "/service?orderId=o1001", "IMG_6047.PNG"),
    ("messages", "/messages", "IMG_6027.PNG"),
    ("shop-chat", "/chat/shop/s_qimei", "IMG_6023.PNG"),
    ("rider-chat", "/chat/rider/o1001", "IMG_6028.PNG"),
    ("coupons-wallet", "/coupons", "IMG_6042.PNG"),
    ("mine", "/mine", "IMG_6032.PNG"),
    ("settings", "/settings", "IMG_6036.PNG"),
    ("address-list", "/settings/address", "IMG_6037.PNG"),
    ("address-edit", "/address/edit", "IMG_6038.PNG"),
    ("address-select", "/address/select", "IMG_6060.PNG"),
    ("security", "/settings/security", "IMG_6040.PNG"),
    ("payment-settings", "/settings/payment", "IMG_6041.PNG"),
    ("notif-settings", "/settings/notifications", "IMG_6029.PNG"),
    # 交易流(UI驱动)
    ("checkout", "flow:checkout", "IMG_6020.PNG"),
    ("pay-sheet", "flow:paysheet", "IMG_R045.PNG"),
    ("coupon-select", "flow:couponselect", "IMG_R032.PNG"),
    ("pay-success", "flow:paysuccess", "IMG_6074.PNG"),
]


def compose(name, mock_bytes, evid_path):
    mock = Image.open(io.BytesIO(mock_bytes)).convert("RGB")
    real = Image.open(evid_path).convert("RGB")
    h = 900
    mw = int(mock.width * h / mock.height)
    rw = int(real.width * h / real.height)
    mock = mock.resize((mw, h), Image.LANCZOS)
    real = real.resize((rw, h), Image.LANCZOS)
    pad, header = 12, 34
    canvas = Image.new("RGB", (mw + rw + pad * 3, h + header + pad * 2), "#f5f5f5")
    d = ImageDraw.Draw(canvas)
    d.text((pad, 10), f"{name}   MOCK(左) vs REAL(右)", fill="#333")
    canvas.paste(mock, (pad, header + pad))
    canvas.paste(real, (mw + pad * 2, header + pad))
    canvas.save(OUT / f"{name}.jpg", "JPEG", quality=80)


async def open_route(page, route):
    await page.evaluate(f"window.__OS__.openApp('tbsg', {route!r})")
    await page.wait_for_timeout(1400)


async def shot(page):
    el = page.locator('[data-adjust-resize]').first
    return await el.screenshot()


async def drive_flow(page, flow):
    """交易流:进乡味鸡加购到满起送→(couponselect/paysheet/paysuccess)"""
    await page.evaluate("window.__OS__.openApp('tbsg', '/shop/s_xiangweiji')")
    await page.wait_for_timeout(1400)
    adds = page.locator('[data-action="shop.item.add"]')
    for _ in range(10):
        if await page.locator('[data-trigger="shop.checkout-open"]').count():
            break
        if await adds.count():
            await adds.first.dispatch_event("click")
            await page.wait_for_timeout(200)
    await page.locator('[data-trigger="shop.checkout-open"]').dispatch_event("click")
    await page.wait_for_timeout(1200)
    if flow == "checkout":
        return
    if flow == "couponselect":
        await page.locator('[data-trigger="checkout.platformcoupon-open"]').dispatch_event("click")
        await page.wait_for_timeout(900)
        return
    await page.locator('[data-action="checkout.pay.open"]').dispatch_event("click")
    await page.wait_for_timeout(900)
    if flow == "paysheet":
        return
    await page.locator('[data-trigger="checkout.pay.success"]').dispatch_event("click")
    await page.wait_for_timeout(1400)  # paysuccess


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 420, "height": 900})
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1800)
        await page.evaluate("window.localStorage.clear()")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1800)
        await page.evaluate("window.__OS__.openApp('tbsg')")
        await page.wait_for_timeout(2200)

        rows = []
        for name, route, evid in PAIRS:
            try:
                if route.startswith("flow:"):
                    await drive_flow(page, route[5:])
                else:
                    await open_route(page, route)
                img = await shot(page)
                compose(name, img, EVID / evid)
                rows.append((name, True))
                print(f"OK   {name}", flush=True)
            except Exception as e:  # noqa: BLE001
                rows.append((name, False))
                print(f"FAIL {name}: {str(e)[:120]}", flush=True)
        await browser.close()

    html = ["<html><meta charset='utf-8'><body style='font-family:sans-serif;background:#eee'>",
            f"<h2>淘宝闪购 视觉比对({sum(1 for _, ok in rows if ok)}/{len(rows)})</h2>"]
    for name, ok in rows:
        if ok:
            html.append(f"<h3>{name}</h3><img src='{name}.jpg' style='max-width:100%'>")
        else:
            html.append(f"<h3>{name} — 截图失败</h3>")
    html.append("</body></html>")
    (OUT / "index.html").write_text("\n".join(html), encoding="utf-8")
    print(f"\n索引: {OUT / 'index.html'}")


asyncio.run(main())
