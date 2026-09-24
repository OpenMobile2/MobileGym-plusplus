# -*- coding: utf-8 -*-
"""
大众点评运行时走查(pipeline v3 阶段⑤)

P0 断言:找店/进店/收藏/浏览/搜索/买券/退款/写评/返回可达性
用法:模拟器在 :3002 时
  node apps/Dianping/assets/runtime_walkthrough.mjs 3002
  # 或(需 playwright):
  python apps/Dianping/assets/runtime_walkthrough.py 3002
"""
import asyncio
import sys

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("playwright 未安装,请改用: node apps/Dianping/assets/runtime_walkthrough.mjs [port]")
    sys.exit(2)

PORT = sys.argv[1] if len(sys.argv) > 1 else "3002"
URL = f"http://localhost:{PORT}"
RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, passed: bool, detail: str = ""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def st(page, expr: str):
    return await page.evaluate(f"window.__SIM__.getState().apps.dianping.{expr}")


async def has(page, selector: str) -> bool:
    try:
        return await page.locator(selector).first.is_visible(timeout=1500)
    except Exception:
        return False


async def click(page, selector: str, nth: int = 0, timeout=5000):
    await page.evaluate("document.activeElement && document.activeElement.blur && document.activeElement.blur()")
    await page.wait_for_timeout(100)
    await page.locator(selector).nth(nth).click(timeout=timeout)
    await page.wait_for_timeout(500)


async def goto(page, route: str):
    await page.evaluate("(r) => window.__OS__.openApp('dianping', r)", route)
    await page.wait_for_timeout(900)


async def signature(page) -> str:
    return await page.evaluate(
        "Array.from(document.querySelectorAll('[data-trigger],[data-action]'))"
        ".slice(0,40).map(e => e.getAttribute('data-trigger')||e.getAttribute('data-action')).join(',')"
    )


async def back_reachability(page, name: str, route: str):
    await goto(page, route)
    seen: dict[str, int] = {}
    for i in range(12):
        if await has(page, '[data-trigger="tabbar.home-open"]'):
            record(f"{name} 返回可达性", True, f"{i}步")
            return
        sig = await signature(page)
        seen[sig] = seen.get(sig, 0) + 1
        if seen[sig] >= 3:
            record(f"{name} 返回可达性", False, f"循环@{i}")
            return
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(400)
    ok = await has(page, '[data-trigger="tabbar.home-open"]')
    record(f"{name} 返回可达性", ok, "12步用尽" if not ok else "")


async def main():
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 420, "height": 900})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:160]}"))
        page.on(
            "console",
            lambda m: errors.append(f"console: {m.text[:160]}")
            if m.type == "error" and "WMR" not in m.text and "favicon" not in m.text
            else None,
        )

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.evaluate("window.__OS__.openApp('dianping')")
        await page.wait_for_timeout(2000)

        # W1 首页 → 美食 → 店铺
        await goto(page, "/")
        record("W1 首页 Tab", await has(page, '[data-trigger="tabbar.home-open"]'))
        await click(page, '[data-trigger="home.food-open"]')
        record("W1 进美食频道", await has(page, '[data-trigger="food.shop-open"]') or await has(page, '[data-trigger="food.category-switch"]'))
        await click(page, '[data-trigger="food.shop-open"]')
        record("W1 进店铺详情", await has(page, '[data-action="shop.bar.favorite"]') or await has(page, '[data-trigger="shop.deal-buy"]'))

        # W2 收藏联动
        before = await st(page, "favoriteShopIds.length")
        await click(page, '[data-action="shop.bar.favorite"]')
        after = await st(page, "favoriteShopIds.length")
        record("W2 收藏店铺联动", after != before, f"{before}->{after}")

        # W3 浏览记录
        hist = await st(page, "browseHistory.length")
        record("W3 进店写入浏览", hist >= 1, f"len={hist}")

        # W4 搜索
        await goto(page, "/search")
        await click(page, '[data-action="search.hot.select.target"]')
        record("W4 搜索结果", await has(page, '[data-trigger="food.shop-open"]') or await has(page, '[data-trigger="search.deal-open"]') or await has(page, '[data-trigger="search.result-tab"]'))

        # W5 买券闭环
        await goto(page, "/shop/wangheli")
        await click(page, '[data-trigger="shop.deal-buy"]')
        record("W5 确认订单", await has(page, '[data-action="order.submit.commit"]'))
        await click(page, '[data-action="order.submit.commit"]')
        record("W5 支付页", await has(page, '[data-trigger="pay.confirm"]'))
        await click(page, '[data-trigger="pay.confirm"]')
        record("W5 密码页", await has(page, '[data-action="pay.password.digit.action"]'))
        for _ in range(6):
            await click(page, '[data-action="pay.password.digit.action"]')
        await page.wait_for_timeout(800)
        record("W5 购买成功", await has(page, '[data-trigger="success.order-open"]') or await has(page, '[data-trigger="tabbar.home-open"]'))
        usable = await st(page, "orders.filter(o=>o.status==='usable').length")
        record("W5 待使用订单", usable >= 1, f"usable={usable}")

        # W6 退款
        order_id = await page.evaluate(
            "() => (window.__SIM__.getState().apps.dianping.orders.find(o=>o.status==='usable')||{}).id"
        )
        if order_id:
            await goto(page, f"/order/{order_id}")
            if await has(page, '[data-trigger="order.refund-open"]'):
                await click(page, '[data-trigger="order.refund-open"]')
                await click(page, '[data-trigger="refund.reason-open"]')
                await click(page, '[data-action="refund.reason.select.target"]')
                await click(page, '[data-action="refund.submit.commit"]')
                await page.wait_for_timeout(1000)
                status = await page.evaluate(
                    f"() => (window.__SIM__.getState().apps.dianping.orders.find(o=>o.id==='{order_id}')||{{}}).status"
                )
                record("W6 退款状态", status in ("refunding", "refunded"), f"status={status}")
            else:
                record("W6 退款入口", False, "missing")
        else:
            record("W6 退款", False, "no usable order")

        # W7 写评
        await goto(page, "/review/write/wangheli")
        await click(page, '[data-action="write.score.select.target"]', nth=4)
        await click(page, '[data-action="write.publish.commit"]')
        await page.wait_for_timeout(600)
        ur = await st(page, "userReviews.length")
        record("W7 写评回显", ur >= 1, f"userReviews={ur}")

        # W8 返回可达性
        await back_reachability(page, "W8 店铺详情", "/shop/wangheli")
        await back_reachability(page, "W8 确认订单", "/order/confirm?shopId=wangheli&dealId=vh100")

        # console
        hard = [e for e in errors if "pageerror" in e]
        record("W9 无 pageerror", len(hard) == 0, "; ".join(hard[:3]))

        await browser.close()

    failed = [r for r in RESULTS if not r[1]]
    print("\n==== SUMMARY ====")
    print(f"pass={len(RESULTS)-len(failed)} fail={len(failed)} total={len(RESULTS)}")
    for name, ok, detail in failed:
        print(f"  FAIL {name} {detail}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    asyncio.run(main())
