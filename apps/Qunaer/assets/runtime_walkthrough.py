# -*- coding: utf-8 -*-
"""去哪儿旅行阶段⑤ P0 运行时走查。"""
import asyncio
import sys
from playwright.async_api import async_playwright

PORT = sys.argv[1] if len(sys.argv) > 1 else "3017"
URL = f"http://127.0.0.1:{PORT}"
RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, passed: bool, detail: str = ""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def state(page, expression: str):
    return await page.evaluate(f"window.__SIM__.getState().apps.qunaer.{expression}")


async def visible(page, selector: str) -> bool:
    try:
        return await page.locator(selector).first.is_visible()
    except Exception:
        return False


async def click(page, selector: str, nth: int = 0):
    await page.evaluate("document.activeElement && document.activeElement.blur && document.activeElement.blur()")
    await page.locator(selector).nth(nth).scroll_into_view_if_needed()
    await page.locator(selector).nth(nth).click(timeout=5000)
    await page.wait_for_timeout(350)


async def goto(page, route: str):
    await page.evaluate("(route) => window.__OS__.openApp('qunaer', route)", route)
    await page.wait_for_timeout(700)


async def assert_chain(page, name: str, steps: list[tuple[str, str]]):
    await goto(page, steps[0][1])
    for index, (trigger, expected_next) in enumerate(steps[1:], 1):
        await click(page, f'[data-trigger="{trigger}"]')
        ok = await visible(page, f'[data-trigger="{expected_next}"]') if expected_next else True
        record(f"{name}.{index} {trigger}", ok)


async def back_reachability(page, name: str):
    seen: dict[str, int] = {}
    for step in range(12):
        if await visible(page, '[data-trigger="chrome.tabbar.0.open"]'):
            record(f"{name} 返回根页", True, f"{step}步")
            return
        signature = await page.evaluate(
            "Array.from(document.querySelectorAll('[data-trigger],[data-action]'))"
            ".slice(0,30).map(e=>e.getAttribute('data-trigger')||e.getAttribute('data-action')).join(',')"
        )
        seen[signature] = seen.get(signature, 0) + 1
        if seen[signature] >= 3:
            record(f"{name} 返回根页", False, "出现画面循环")
            return
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(350)
    record(f"{name} 返回根页", await visible(page, '[data-trigger="chrome.tabbar.0.open"]'), "12步")


async def main():
    browser_errors: list[str] = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page(viewport={"width": 360, "height": 800}, device_scale_factor=2)
        page.on("pageerror", lambda error: browser_errors.append(f"pageerror: {str(error)[:180]}"))
        page.on(
            "console",
            lambda message: browser_errors.append(f"console: {message.text[:180]}")
            if message.type == "error" and all(token not in message.text for token in ("404", "favicon", "WMR"))
            else None,
        )
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await page.evaluate("window.__OS__.openApp('qunaer')")
        await page.wait_for_timeout(1200)

        record("启动首页", await visible(page, '[data-trigger="home.main.0.open"]'))
        for trigger, marker in [
            ("chrome.tabbar.1.open", "trip.main.0.open"),
            ("chrome.tabbar.2.open", "support.main.0.open"),
            ("chrome.tabbar.3.open", "world.main.0.open"),
            ("chrome.tabbar.4.open", "mine.main.0.open"),
            ("chrome.tabbar.0.open", "home.main.0.open"),
        ]:
            await click(page, f'[data-trigger="{trigger}"]')
            record(f"Tab {trigger}", await visible(page, f'[data-trigger="{marker}"]'))

        await goto(page, "/flight")
        before_from = await state(page, "search.fromCity")
        before_to = await state(page, "search.toCity")
        before_count = await state(page, "selected['flight.search.2.other'] || 0")
        await click(page, '[data-action="flight.search.2.other"]')
        after_from = await state(page, "search.fromCity")
        after_to = await state(page, "search.toCity")
        after_count = await state(page, "selected['flight.search.2.other']")
        record("机票城市换向 state", before_from == after_to and before_to == after_from and after_count == before_count + 1)

        await goto(page, "/")
        await click(page, '[data-trigger="home.main.0.open"]')
        await click(page, '[data-trigger="flight.search.4.open"]')
        await click(page, '[data-trigger="flight.list.0.open"]')
        await click(page, '[data-trigger="flight.cabins.1.open"]')
        await click(page, '[data-trigger="flight.booking.1.open"]')
        orders_before = await state(page, "orders.length")
        await click(page, '[data-trigger="pay.cashier.0.open"]')
        orders_after = await state(page, "orders.length")
        record("机票支付闭环生成订单", orders_after == orders_before + 1 and await visible(page, '[data-trigger="pay.success.0.open"]'))
        await click(page, '[data-trigger="pay.success.0.open"]')
        record("支付成功进入订单详情", await visible(page, '[data-action="flight.order.detail.0.other"]'))
        await back_reachability(page, "机票深链")

        flows = [
            ("酒店", "/", ["home.main.1.open", "hotel.search.2.open", "hotel.list.0.open", "hotel.detail.0.open", "hotel.booking.0.open"]),
            ("火车", "/", ["home.main.2.open", "train.search.2.open", "train.list.0.open", "train.detail.1.open", "train.booking.2.open"]),
            ("门票", "/", ["home.main.3.open", "ticket.channel.0.open", "ticket.detail.0.open", "ticket.booking.0.open"]),
        ]
        for name, route, triggers in flows:
            await goto(page, route)
            ok = True
            for trigger in triggers:
                try:
                    await click(page, f'[data-trigger="{trigger}"]')
                except Exception:
                    ok = False
                    break
            record(f"{name}预订至收银台", ok and await visible(page, '[data-trigger="pay.cashier.0.open"]'))

        await goto(page, "/me/settings")
        logged_before = await state(page, "session.loggedIn")
        await click(page, '[data-trigger="mine.settings.0.open"]')
        logged_out = await state(page, "session.loggedIn")
        await goto(page, "/login")
        await click(page, '[data-trigger="auth.login.0.open"]')
        logged_after = await state(page, "session.loggedIn")
        record("退出与重新登录 state", logged_before and not logged_out and logged_after)
        await browser.close()

    unique_errors = sorted(set(browser_errors))
    if unique_errors:
        print("CONSOLE/PAGE ERRORS:")
        for error in unique_errors[:20]:
            print("  -", error)
    passed = sum(ok for _, ok, _ in RESULTS)
    print(f"\n运行时走查: {passed}/{len(RESULTS)} 通过 | console错误 {len(unique_errors)}")
    if passed != len(RESULTS) or unique_errors:
        sys.exit(1)
    print("OK: P0 运行时走查 gate 通过")


if __name__ == "__main__":
    asyncio.run(main())
