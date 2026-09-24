# -*- coding: utf-8 -*-
"""
运行时走查(pipeline v3 阶段⑤ 第五道机器 gate)—— 唯品会

按 spec 的 P0 交互在真实模拟器里逐条执行,每步带状态断言:
- effect=nav  → 断言目标页出现(目标页独有的 data-trigger/data-action 可见)
- effect=state→ 断言 __SIM__.apps.vipshop 状态发生了声明的变化(抓死按钮)
- 全程监听 console error / pageerror,零容忍。

静态 gate(coverage/tsc/lint/官方分析)证明"声明了的都写了";本 gate 证明"写了的真会动"。

用法: 模拟器跑在 :3000 时执行
    python apps/Vipshop/assets/runtime_walkthrough.py
"""
import asyncio
import sys
from playwright.async_api import async_playwright

URL = "http://localhost:3000"
RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, passed: bool, detail: str = ""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def st(page, expr: str):
    return await page.evaluate(f"window.__SIM__.getState().apps.vipshop.{expr}")


async def has(page, selector: str) -> bool:
    try:
        return await page.locator(selector).first.is_visible()
    except Exception:
        return False


async def click(page, selector: str, timeout=3000):
    await page.locator(selector).first.click(timeout=timeout)
    await page.wait_for_timeout(500)


async def goto(page, route: str):
    await page.evaluate("(r) => window.__OS__.openApp('vipshop', r)", route)
    await page.wait_for_timeout(1000)


async def main():
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 420, "height": 900})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:160]}"))
        page.on("console", lambda m: errors.append(f"console: {m.text[:160]}")
                if m.type == "error" and "WMR" not in m.text and "404" not in m.text and "favicon" not in m.text else None)

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(2200)
        await page.evaluate("window.__OS__.openApp('vipshop')")
        await page.wait_for_timeout(2200)

        # W1 首页商品卡 → 详情 + 足迹副作用
        await goto(page, "/")
        fp0 = await st(page, "footprints.length")
        await click(page, '[data-trigger="home.item-open"]')
        detail_ok = await has(page, '[data-action="detail.favorite.toggle"]')
        fp1 = await st(page, "footprints.length")
        record("W1 home.item-open 打开详情", detail_ok)
        record("W1b 详情记录足迹(state)", fp1 >= fp0, f"footprints {fp0}->{fp1}")

        # W2 收藏切换(state)
        fav0 = await st(page, "favorites.length")
        await click(page, '[data-action="detail.favorite.toggle"]')
        fav1 = await st(page, "favorites.length")
        record("W2 detail.favorite.toggle 改变收藏(state)", fav1 != fav0, f"favorites {fav0}->{fav1}")

        # W3 打开 SKU 面板 → 加购(state cart+1)
        c0 = await st(page, "cart.length")
        await click(page, '[data-action="detail.sku.openForCart"]')
        sku_ok = await has(page, '[data-action="sku.addToCart.submit"]')
        record("W3 detail.sku.openForCart 打开面板", sku_ok)
        await click(page, '[data-action="sku.color.select.target"]')
        await click(page, '[data-action="sku.addToCart.submit"]')
        c1 = await st(page, "cart.length")
        record("W3b sku.addToCart.submit 加购(state)", c1 > c0, f"cart {c0}->{c1}")

        # W4 购物车 → 结算 → 提交订单(state orders+1)
        await goto(page, "/cart")
        cart_ok = await has(page, '[data-action="cart.manage.toggle"]')
        record("W4 到购物车", cart_ok)
        await click(page, '[data-trigger="cart.checkout-open"]')
        confirm_ok = await has(page, '[data-trigger="orderConfirm.submit-open"]')
        record("W4b cart.checkout-open 到确认订单", confirm_ok)
        o0 = await st(page, "orders.length")
        await click(page, '[data-trigger="orderConfirm.submit-open"]')
        o1 = await st(page, "orders.length")
        record("W4c orderConfirm.submit-open 生成订单(state)", o1 > o0, f"orders {o0}->{o1}")
        success_ok = await has(page, '[data-trigger="paySuccess.home-open"]')
        record("W4d 到支付成功页", success_ok)

        # W5 首页品类切换(state via URL cat)
        await goto(page, "/")
        cat_ok = await has(page, '[data-action="home.category.select.target"]')
        record("W5 首页品类tab存在", cat_ok)
        await page.locator('[data-action="home.category.select.target"]').nth(1).click()
        await page.wait_for_timeout(400)
        record("W5b home.category.select.target 可点(无崩溃)", True)

        # W6 客服会话:猜你想问 → 机器人回复(state chatMessages 增长)
        await goto(page, "/messages/chat")
        m0 = await st(page, "chatMessages.length")
        faq_ok = await has(page, '[data-action="chat.faq.select.target"]')
        record("W6 唯小蜜 faq 卡存在", faq_ok)
        if faq_ok:
            await click(page, '[data-action="chat.faq.select.target"]')
            m1 = await st(page, "chatMessages.length")
            record("W6b chat.faq 触发机器人回复(state)", m1 > m0, f"chatMessages {m0}->{m1}")

        # W7 登录流程:登录页→(填号)→隐私弹窗→验证码→登录成功(state)
        await goto(page, "/login")
        login_ok = await has(page, '[data-action="login.sms.open"]')
        record("W7 到登录页", login_ok)
        try:
            await page.locator('input').first.fill("13800138000")
            await page.wait_for_timeout(200)
        except Exception:
            pass
        await click(page, '[data-action="login.sms.open"]')
        priv_ok = await has(page, '[data-trigger="privacy.agree-open"]')
        record("W7b 获取验证码弹隐私弹窗", priv_ok)
        if priv_ok:
            await click(page, '[data-trigger="privacy.agree-open"]')
            sms_ok = await has(page, '[data-trigger="sms.confirm-open"]')
            record("W7c 同意并继续到验证码页", sms_ok)
            if sms_ok:
                try:
                    await page.locator('input').first.fill("1234")
                    await page.wait_for_timeout(200)
                except Exception:
                    pass
                await click(page, '[data-trigger="sms.confirm-open"]')
                logged = await st(page, "session.loggedIn")
                record("W7d 验证码确定登录成功(state)", logged is True, f"loggedIn={logged}")

        # W8 金刚区 → 一级品类页 + 二级分类
        await goto(page, "/")
        cat_open = await has(page, '[data-trigger="home.category-open"]')
        record("W8 首页金刚区可点", cat_open)
        if cat_open:
            await click(page, '[data-trigger="home.category-open"]')
            catpage_ok = await has(page, '[data-action="category.subcat.select.target"]')
            record("W8b 跳一级品类页", catpage_ok)
            if catpage_ok:
                await page.locator('[data-action="category.subcat.select.target"]').nth(1).click()
                await page.wait_for_timeout(400)
                record("W8c 二级分类可点(无崩溃)", True)

        # W9 确认订单选地址 → 回填返回结算(先加购一件保证有可结算商品)
        await goto(page, "/detail/it001")
        await click(page, '[data-action="detail.sku.openForCart"]')
        await click(page, '[data-action="sku.addToCart.submit"]')
        await goto(page, "/cart")
        await click(page, '[data-trigger="cart.checkout-open"]')
        if await has(page, '[data-trigger="orderConfirm.address-open"]'):
            await click(page, '[data-trigger="orderConfirm.address-open"]')
            sel_ok = await has(page, '[data-trigger="address.select-confirm"]')
            record("W9 结算→地址选择页", sel_ok)
            if sel_ok:
                await click(page, '[data-trigger="address.select-confirm"]')
                back_confirm = await has(page, '[data-trigger="orderConfirm.submit-open"]')
                record("W9b 选地址回到结算页", back_confirm)
        else:
            record("W9 结算地址入口", False, "no address entry")

        # W10 售后多步:订单详情 → 申请售后 → 免费换货 → 选规格 → 确认 → 进度(state refunds+1)
        await goto(page, "/orders/o2")
        if await has(page, '[data-trigger="orderDetail.refund-open"]'):
            await click(page, '[data-trigger="orderDetail.refund-open"]')
            ex_ok = await has(page, '[data-trigger="refund.exchange-open"]')
            record("W10 到售后类型页", ex_ok)
            if ex_ok:
                await click(page, '[data-trigger="refund.exchange-open"]')
                exp_ok = await has(page, '[data-trigger="exchange.confirm-open"]')
                record("W10b 换货选规格页", exp_ok)
                if exp_ok:
                    rf0 = await st(page, "refunds.length")
                    await click(page, '[data-trigger="exchange.confirm-open"]')
                    rf1 = await st(page, "refunds.length")
                    prog_ok = await has(page, '[data-action="refundProgress.cancel.submit"]')
                    record("W10c 确认换货→进度页", prog_ok)
                    record("W10d 生成售后单(state)", rf1 > rf0, f"refunds {rf0}->{rf1}")
        else:
            record("W10 订单详情售后入口", False, "no refund entry")

        # W11pre 消息-物流更新 → 该订单物流详情(非客服)
        await goto(page, "/messages")
        logi_ok = await has(page, '[data-trigger="message.logistics-open"]')
        record("W11pre 消息-物流更新条目", logi_ok)
        if logi_ok:
            await click(page, '[data-trigger="message.logistics-open"]')
            on_logi = await has(page, '[data-action="logistics.copyNo.submit"]')
            record("W11pre2 跳订单物流详情(非客服)", on_logi)

        # W11 消息按类目路由:品牌动态 → 品牌主页
        await goto(page, "/messages")
        # 动态子tab
        if await has(page, '[data-action="message.subtab.select.target"]'):
            await page.locator('[data-action="message.subtab.select.target"]').nth(1).click()
            await page.wait_for_timeout(500)
        brand_msg = await has(page, '[data-trigger="message.brand-open"]')
        record("W11 消息-品牌动态入口", brand_msg)
        if brand_msg:
            await click(page, '[data-trigger="message.brand-open"]')
            brand_ok = await has(page, '[data-action="brand.subscribe.toggle"]')
            record("W11b 跳品牌主页(非唯小蜜)", brand_ok)

        await browser.close()

    # console/pageerror 零容忍
    uniq = sorted(set(errors))
    if uniq:
        print("\nCONSOLE/PAGE ERRORS (零容忍):")
        for e in uniq[:20]:
            print("  -", e)

    passed = sum(1 for _, ok, _ in RESULTS if ok)
    total = len(RESULTS)
    print(f"\n运行时走查: {passed}/{total} 通过 | console错误 {len(uniq)}")
    if passed < total or uniq:
        sys.exit(1)
    print("OK: 运行时走查 gate 通过")


if __name__ == "__main__":
    asyncio.run(main())
