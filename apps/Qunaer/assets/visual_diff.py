# -*- coding: utf-8 -*-
"""去哪儿旅行 360×800 逐页视觉比对。"""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

PORT = sys.argv[1] if len(sys.argv) > 1 else "3017"
URL = f"http://127.0.0.1:{PORT}"
ROOT = Path(__file__).resolve().parents[5]
OUT = ROOT / "docs" / "qunaer-replication" / "visual-diff"
EVIDENCE = ROOT / "qunaer_images"
PAGES = [
    ("home", "/", "微信图片_20260721194110_225_4.jpg"),
    ("flight", "/flight", "微信图片_20260721194111_226_4.jpg"),
    ("flight-list", "/flight/list", "微信图片_20260721194113_227_4.jpg"),
    ("flight-cabins", "/flight/cabins", "微信图片_20260721194114_228_4.jpg"),
    ("flight-booking", "/flight/booking", "微信图片_20260721194116_229_4.jpg"),
    ("calendar", "/flight/calendar", "微信图片_20260721194120_230_4.jpg"),
    ("hotel-list", "/hotel/list", "微信图片_20260721194126_231_4.jpg"),
    ("hotel-detail", "/hotel/detail", "微信图片_20260721194128_232_4.jpg"),
    ("hotel-booking", "/hotel/booking", "微信图片_20260721194129_233_4.jpg"),
    ("train-list", "/train/list", "微信图片_20260721194131_234_4.jpg"),
    ("ticket", "/ticket", "微信图片_20260721194132_235_4.jpg"),
    ("ticket-detail", "/ticket/detail", "微信图片_20260721194134_236_4.jpg"),
    ("ticket-booking", "/ticket/booking", "微信图片_20260721194135_237_4.jpg"),
    ("orders", "/orders", "微信图片_20260721194136_238_4.jpg"),
    ("mine", "/me", "微信图片_20260721194138_239_4.jpg"),
    ("search", "/search", "微信图片_20260722162202_263_4.jpg"),
    ("support", "/support", "微信图片_20260722162203_264_4.jpg"),
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    errors: dict[str, list[str]] = {}
    current = {"name": "boot"}
    completed = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page(viewport={"width": 360, "height": 800}, device_scale_factor=2)
        page.on("pageerror", lambda error: errors.setdefault(current["name"], []).append(f"pageerror: {str(error)[:140]}"))
        page.on(
            "console",
            lambda message: errors.setdefault(current["name"], []).append(f"console: {message.text[:140]}")
            if message.type == "error" and all(token not in message.text for token in ("404", "favicon", "WMR"))
            else None,
        )
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)
        for name, route, evidence in PAGES:
            current["name"] = name
            await page.evaluate("(route) => window.__OS__.openApp('qunaer', route)", route)
            await page.wait_for_timeout(750)
            shot = OUT / f"{name}.png"
            await page.screenshot(path=str(shot))
            completed.append((name, route, evidence, shot.name))
            print(f"  [OK] {name:16s} {route}")
        await browser.close()

    rows = []
    for name, route, evidence, shot in completed:
        rows.append(
            f'<section><h2>{name} <code>{route}</code></h2><div class="pair">'
            f'<figure><figcaption>模拟版</figcaption><img src="{shot}"></figure>'
            f'<figure><figcaption>真机锚点</figcaption><img src="../../../qunaer_images/{evidence}"></figure>'
            "</div></section>"
        )
    html = """<!doctype html><meta charset="utf-8"><title>去哪儿旅行视觉比对</title>
<style>body{font-family:-apple-system,"Microsoft YaHei",sans-serif;background:#f4f6f7;margin:0;padding:16px;color:#263238}
h1{font-size:20px}section{background:#fff;border-radius:12px;padding:12px;margin:0 0 14px}h2{font-size:14px}
code{color:#10aeb3;font-weight:400}.pair{display:flex;gap:12px;align-items:flex-start}figure{margin:0}
figcaption{text-align:center;color:#7b858a;font-size:11px;margin-bottom:5px}img{width:260px;border:1px solid #e5eaec;border-radius:8px;display:block}</style>
<h1>去哪儿旅行 · 模拟版 vs 真机（17 个锚点）</h1>""" + "".join(rows)
    (OUT / "index.html").write_text(html, encoding="utf-8")
    bad = {name: messages for name, messages in errors.items() if messages}
    print(f"\n截图 {len(completed)} 页 -> {OUT}")
    if bad:
        print("全页渲染 console/page 错误:")
        for name, messages in bad.items():
            print(f"  {name}: {messages[:3]}")
        sys.exit(1)
    print("OK: 全页 360×800 渲染零 console 错误")


if __name__ == "__main__":
    asyncio.run(main())
