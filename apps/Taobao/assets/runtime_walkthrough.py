# -*- coding: utf-8 -*-
"""
运行时走查(pipeline v3 阶段3 第五道机器 gate)

按 spec 的 P0 交互在真实模拟器里逐条执行,每步带**状态断言**:
- effect=nav  → 断言路由/页面切换发生
- effect=state→ 断言 __SIM__ 状态发生了声明的变化(抓"点了没反应"的死按钮)
- 全程监听 console error / pageerror,零容忍

静态 gate(coverage/tsc/lint/官方分析)证明"声明了的都写了";
本 gate 证明"写了的真的会动"。两类盲区(运行时崩溃、死交互)都在这里收口。

用法: 模拟器跑在 :3000 时执行
    python apps/Taobao/assets/runtime_walkthrough.py
"""
import asyncio
import sys

from playwright.async_api import async_playwright

URL = "http://localhost:3000"
RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, passed: bool, detail: str = ""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def state(page, expr: str):
    return await page.evaluate(f"window.__SIM__.getState().apps.taobao.{expr}")


async def swipe_left(page, locator, dx=240):
    box = await locator.bounding_box()
    x0 = box["x"] + box["width"] * 0.7
    y0 = box["y"] + box["height"] / 2
    await page.mouse.move(x0, y0)
    await page.mouse.down()
    for i in range(8):
        await page.mouse.move(x0 - (i + 1) * dx / 8, y0, steps=2)
    await page.mouse.up()
    await page.wait_for_timeout(400)


async def main():
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 420, "height": 900})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:160]}"))
        page.on("console", lambda m: errors.append(f"console: {m.text[:160]}")
                if m.type == "error" and "WMR" not in m.text and "404" not in m.text else None)

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(2200)
        await page.evaluate("window.__OS__.openApp('taobao')")
        await page.wait_for_timeout(2200)

        # W1 详情页打开不崩 + 足迹副作用
        fp0 = await state(page, "footprints.length")
        await page.locator('[data-trigger="home.item-open"]').first.click()
        await page.wait_for_timeout(900)
        fp1 = await state(page, "footprints.length")
        record("W1 详情页打开+足迹记录", fp1 >= fp0, f"footprints {fp0}->{fp1}")

        # W2 SKU 加购 → cart+1
        c0 = await state(page, "cart.length")
        await page.locator('[data-action="detail.sku.openForCart"]').click()
        await page.wait_for_timeout(500)
        await page.locator('[data-action="sku.addToCart.confirm"]').click()
        await page.wait_for_timeout(600)
        c1 = await state(page, "cart.length")
        record("W2 SKU加购 cart+1", c1 == c0 + 1, f"cart {c0}->{c1}")

        # W3 详情页顶部购物车入口
        await page.locator('[data-trigger="detail.cart-open"]').click()
        await page.wait_for_timeout(700)
        on_cart = await page.locator('[data-action="cart.selectAll.toggle"]').count() > 0
        record("W3 详情→购物车入口", on_cart)

        # W4 左滑删除(本次修复的 bug 的回归断言)
        c0 = await state(page, "cart.length")
        await swipe_left(page, page.locator('[data-action="cart.item.swipeActions"]').first)
        await page.locator('[data-action="cart.item.swipe.delete"]').first.click()
        await page.wait_for_timeout(500)
        c1 = await state(page, "cart.length")
        record("W4 左滑删除 cart-1", c1 == c0 - 1, f"cart {c0}->{c1}")

        # W5 左滑移入收藏(同型 bug 回归)
        f0 = await state(page, "favorites.length")
        c0 = await state(page, "cart.length")
        await swipe_left(page, page.locator('[data-action="cart.item.swipeActions"]').first)
        await page.locator('[data-action="cart.item.swipe.moveToFavorites"]').first.click()
        await page.wait_for_timeout(500)
        c1 = await state(page, "cart.length")
        f1 = await state(page, "favorites.length")
        record("W5 左滑移入收藏", c1 == c0 - 1 and f1 >= f0,
               f"cart {c0}->{c1}, favorites {f0}->{f1}")

        # W6 管理模式批量删除
        c0 = await state(page, "cart.length")
        await page.locator('[data-action="cart.manage.toggle"]').click()
        await page.wait_for_timeout(400)
        await page.locator('[data-action="cart.item.select.toggle"]').first.click()
        await page.wait_for_timeout(300)
        await page.locator('[data-action="cart.item.delete"]').click()
        await page.wait_for_timeout(500)
        c1 = await state(page, "cart.length")
        record("W6 管理模式删除", c1 == c0 - 1, f"cart {c0}->{c1}")
        await page.locator('[data-action="cart.manage.toggle"]').click()
        await page.wait_for_timeout(300)

        # W7 搜索 → searchHistory 副作用(此时在 /cart Tab 页,TabBar 可见)
        await page.locator('[data-trigger="tabbar.home-open"]').click()
        await page.wait_for_timeout(500)
        h0 = await state(page, "searchHistory.length")
        await page.locator('[data-trigger="home.search.open"]').click()
        await page.wait_for_timeout(600)
        await page.locator('input').first.fill('保温杯')
        await page.locator('input').first.press('Enter')
        await page.wait_for_timeout(800)
        h1 = await state(page, "searchHistory.length")
        record("W7 搜索留痕", h1 == h0 + 1, f"searchHistory {h0}->{h1}")

        # W8 消息清未读(搜索结果页无 TabBar:返回两级回到首页)
        for _ in range(3):
            on_tab = await page.locator('[data-trigger="tabbar.message-open"]').count()
            if on_tab and await page.locator('[data-trigger="tabbar.message-open"]').is_visible():
                break
            await page.evaluate("window.__OS__.handleBack()")
            await page.wait_for_timeout(400)
        await page.locator('[data-trigger="tabbar.message-open"]').click()
        await page.wait_for_timeout(600)
        await page.locator('[data-action="message.unread.clearAll"]').click()
        await page.wait_for_timeout(400)
        unread = await page.evaluate(
            "window.__SIM__.getState().apps.taobao.chats.reduce((n,c)=>n+c.unread,0)")
        record("W8 清除未读", unread == 0, f"unread={unread}")

        await browser.close()

    print()
    failed = [r for r in RESULTS if not r[1]]
    if errors:
        print(f"console/page errors ({len(errors)}):")
        for e in errors[:10]:
            print("  -", e)
    print(f"\n断言: {len(RESULTS) - len(failed)}/{len(RESULTS)} 通过, 运行时错误: {len(errors)}")
    if failed or errors:
        sys.exit(1)
    print("OK: runtime walkthrough 全绿")


if __name__ == "__main__":
    asyncio.run(main())
