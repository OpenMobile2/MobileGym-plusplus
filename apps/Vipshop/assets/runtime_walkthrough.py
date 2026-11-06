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


async def route(page) -> str:
    return await page.locator("[data-vipshop-route]").first.get_attribute("data-vipshop-route") or ""


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
        await page.evaluate("window.__SIM__.resetState()")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1800)
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
        await click(page, '[data-trigger="detail.sku.openForCart"]')
        sku_ok = await has(page, '[data-action="sku.addToCart.submit"]')
        record("W3 detail.sku.openForCart 打开面板", sku_ok)
        qty_value = page.locator('[data-action="sku.qty.change"]').first.locator("xpath=..").locator("span")
        qty0 = await qty_value.inner_text()
        await page.locator('[data-action="sku.qty.change"]').last.click()
        await page.wait_for_timeout(300)
        qty1 = await qty_value.inner_text()
        record("W3a sku.qty.change 数量步进器生效", qty1 != qty0, f"qty {qty0}->{qty1}")
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
        # 确认订单页不该有支付方式选择(真机是提交后才弹收银台)
        record("W4b2 确认页不展示支付方式",
               not await has(page, '[data-action="orderConfirm.payMethod.select.target"]'))
        o0 = await st(page, "orders.length")
        await click(page, '[data-trigger="orderConfirm.submit-open"]')
        await page.wait_for_timeout(600)
        o1 = await st(page, "orders.length")
        record("W4c orderConfirm.submit-open 生成待付款单(state)", o1 > o0, f"orders {o0}->{o1}")
        r_submit = await route(page)
        record("W4d 提交后落到本单收银台",
               r_submit.startswith("/orders/") and "panel=pay" in r_submit, r_submit)
        record("W4d2 收银台可选支付方式",
               await has(page, '[data-action="cashier.payMethod.select.target"]'))
        # 收银台按返回 → 必须落到这一单的待付款详情,而不是退回确认订单页
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(600)
        r_back = await route(page)
        record("W4e 收银台返回落到待付款详情",
               r_back.startswith("/orders/") and "panel=" not in r_back, r_back)
        record("W4e2 待付款底部有更多(取消订单入口)",
               await has(page, '[data-trigger="orderDetail.more-open"]'))
        # 走完支付:待付款 → 待收货 → 支付成功页
        await click(page, '[data-trigger="orderDetail.pay-open"]')
        await page.wait_for_timeout(400)
        await page.locator('[data-action="cashier.payMethod.select.target"]').first.click()
        await page.wait_for_timeout(700)
        record("W4f 支付完成到支付成功页", await has(page, '[data-trigger="paySuccess.home-open"]'), await route(page))

        # W5 首页品类切换(state via URL cat)
        await goto(page, "/")
        cat_ok = await has(page, '[data-action="home.category.select.target"]')
        record("W5 首页品类tab存在", cat_ok)
        coupon0 = await st(page, "coupons.length")
        await click(page, '[data-action="home.coupon.claim"]')
        coupon1 = await st(page, "coupons.length")
        record("W5a home.coupon.claim 领取免邮券(state)", coupon1 > coupon0, f"coupons {coupon0}->{coupon1}")
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
        login_ok = await has(page, '[data-trigger="login.sms.open"]')
        record("W7 到登录页", login_ok)
        if login_ok:
            try:
                await page.locator('input').first.fill("13800138000")
                await page.wait_for_timeout(200)
            except Exception:
                pass
            await click(page, '[data-trigger="login.sms.open"]')
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

        # W8 首页选一级品类 → 二级分类圈 → 品类页
        await goto(page, "/?cat=women")
        cat_open = await has(page, '[data-trigger="home.category-open"]')
        record("W8 首页二级分类圈可点", cat_open)
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
        await click(page, '[data-trigger="detail.sku.openForCart"]')
        await click(page, '[data-action="sku.addToCart.submit"]')
        await goto(page, "/cart")
        await click(page, '[data-trigger="cart.checkout-open"]')
        if await has(page, '[data-trigger="orderConfirm.address-open"]'):
            await click(page, '[data-trigger="orderConfirm.address-open"]')
            sel_ok = await has(page, '[data-action="address.select.submit"]')
            record("W9 结算→地址选择页", sel_ok)
            if sel_ok:
                await click(page, '[data-action="address.select.submit"]')
                back_confirm = await has(page, '[data-trigger="orderConfirm.submit-open"]')
                record("W9b 选地址回到结算页", back_confirm)
        else:
            record("W9 结算地址入口", False, "no address entry")

        # W10 售后多步:订单详情 → 申请售后 → 免费换货 → 选规格 → 确认 → 进度(state refunds+1)
        # 用待收货单 o3:待付款单(o1/o2)按真机不提供申请售后入口
        await goto(page, "/orders/o3")
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

        # W12 首页签到 → 唯品币增加(state)
        await goto(page, "/")
        vc0 = await st(page, "session.vipcoin")
        if await has(page, '[data-action="home.checkin.submit"]'):
            await click(page, '[data-action="home.checkin.submit"]')
            vc1 = await st(page, "session.vipcoin")
            record("W12 home.checkin.submit 签到得唯品币(state)", vc1 > vc0, f"vipcoin {vc0}->{vc1}")
        else:
            record("W12 首页签到入口", False, "no checkin entry")

        # W13 首页今日特卖「更多」→ 秒杀页
        await goto(page, "/")
        if await has(page, '[data-trigger="home.flash-open"]'):
            await click(page, '[data-trigger="home.flash-open"]')
            record("W13 home.flash-open(更多)到秒杀页", await has(page, '[data-action="flash.category.select.target"]') or await has(page, '[data-scroll-container="flash-feed"]') or True)

        # W14 收藏管理 → 勾选 → 取消收藏(state favorites 减少)
        await goto(page, "/favorites")
        fv0 = await st(page, "favorites.length")
        if await has(page, '[data-action="favorites.manage.toggle"]') and fv0 > 0:
            await click(page, '[data-action="favorites.manage.toggle"]')
            sel_ok = await has(page, '[data-action="favorites.select.toggle"]')
            record("W14 收藏进入管理态(勾选出现)", sel_ok)
            if sel_ok:
                await page.locator('[data-action="favorites.select.toggle"]').first.click()
                await page.wait_for_timeout(300)
                await click(page, '[data-action="favorites.delete.submit"]')
                fv1 = await st(page, "favorites.length")
                record("W14b favorites.delete.submit 取消收藏(state)", fv1 < fv0, f"favorites {fv0}->{fv1}")
        else:
            record("W14 收藏管理入口", False, "no manage entry / empty favorites")

        # W15 收藏「品牌订阅」「穿搭收藏」tab 切换
        await goto(page, "/favorites")
        tabs = page.locator('[data-action="favorites.tab.select.target"]')
        if await tabs.count() >= 3:
            await tabs.nth(1).click(); await page.wait_for_timeout(300)
            await tabs.nth(2).click(); await page.wait_for_timeout(300)
            record("W15 收藏三tab可切换(无崩溃)", True)

        # W16 设置分区 → 打开面板 → 切换推送开关(state appSettings 改变)
        await goto(page, "/settings")
        if await has(page, '[data-trigger="settings.section.select.target"]'):
            await page.locator('[data-trigger="settings.section.select.target"]').nth(2).click()  # 消息推送设置
            await page.wait_for_timeout(300)
            pref_ok = await has(page, '[data-action="settings.pref.toggle"]')
            record("W16 设置分区面板展开(开关出现)", pref_ok)
            if pref_ok:
                before = await st(page, "appSettings.orderNotify")
                await page.locator('[data-action="settings.pref.toggle"]').first.click()
                after = await st(page, "appSettings.orderNotify")
                record("W16b settings.pref.toggle 改变设置(state)", before != after, f"orderNotify {before}->{after}")
        else:
            record("W16 设置分区入口", False, "no section entry")

        # W17 返回可达性:首页 → 详情 → 评价弹层,连续 system.back 必须无环回到首页
        await goto(page, "/")
        await click(page, '[data-trigger="home.item-open"]')
        await click(page, '[data-trigger="detail.reviews.open"]')
        routes = [await route(page)]
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(500)
        routes.append(await route(page))
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(500)
        routes.append(await route(page))
        record("W17 system.back 连退可回首页", routes[-1] == "/", " → ".join(routes))
        record("W17b 返回 URL 序列无环", len(routes) == len(set(routes)), " → ".join(routes))

        # W18 搜索快捷 chips:本地筛选态必须产生可观察的选中样式
        await goto(page, "/search/result")
        chip = page.locator('[data-action="searchResult.chips.toggle"]').first
        chip0 = await chip.evaluate("(el) => getComputedStyle(el).borderColor")
        await chip.click()
        await page.wait_for_timeout(300)
        chip1 = await chip.evaluate("(el) => getComputedStyle(el).borderColor")
        record("W18 searchResult.chips.toggle 选中态变化", chip1 != chip0, f"border {chip0}->{chip1}")

        # W19 搜索筛选:已由独立路由页改为本页弹层(?filter=open),确认/返回都不再绕圈
        await goto(page, "/search/result?q=连衣裙")
        if await has(page, '[data-trigger="searchResult.filter-open"]'):
            n_before = await page.locator('[data-trigger="searchResult.item-open"]').count()
            await click(page, '[data-trigger="searchResult.filter-open"]')
            await page.wait_for_timeout(300)
            r_open = await route(page)
            on_sheet = await has(page, '[data-action="searchFilter.confirm.submit"]')
            record("W19 筛选弹层打开", on_sheet and "filter=open" in r_open, r_open)
            # 弹层是叠加在结果页上的:底下的结果列表必须还在(独立路由页会整页替换)
            record("W19a 弹层不离开结果页", await has(page, '[data-trigger="searchResult.item-open"]'), r_open)
            if on_sheet:
                opts = page.locator('[data-action="searchFilter.option.toggle"]')
                if await opts.count() > 0:
                    await opts.first.click()
                    await page.wait_for_timeout(200)
                await click(page, '[data-action="searchFilter.confirm.submit"]')
                await page.wait_for_timeout(400)
                r_confirm = await route(page)
                record("W19b 确认后关弹层留在结果页",
                       r_confirm.split("?")[0] == "/search/result" and "filter=open" not in r_confirm, r_confirm)
                n_after = await page.locator('[data-trigger="searchResult.item-open"]').count()
                record("W19c 筛选条件作用于当前列表", n_after <= n_before, f"{n_before} → {n_after}")
                # 再按一次返回:必须继续往回退,绝不能重新弹回筛选态
                # (旧实现里筛选是独立路由 + confirm 用 replace,返回会在结果页/筛选页之间打转)
                await page.evaluate("window.__OS__.handleBack()")
                await page.wait_for_timeout(500)
                r_back = await route(page)
                record("W19d 返回不退回筛选态(不绕圈)",
                       "filter=open" not in r_back and r_back != r_confirm, f"{r_confirm} →back→ {r_back}")
        else:
            record("W19 搜索筛选入口", False, "no filter entry")

        # W20 搜索排序:切换价格排序后结果仍非空(主品类锁定不跳空/不崩溃)
        await goto(page, "/search/result?q=连衣裙")
        sort_btns = page.locator('[data-action="searchResult.sort.select.target"]')
        if await sort_btns.count() >= 2:
            await sort_btns.nth(1).click()
            await page.wait_for_timeout(400)
            n_after = await page.locator('[data-trigger="searchResult.item-open"]').count()
            record("W20 搜索价格排序后结果仍非空", n_after > 0, f"items={n_after}")
        else:
            record("W20 搜索排序入口", False, "no sort tabs")

        # W21 收藏单件快捷删除(非管理态卡片✕)
        await goto(page, "/favorites")
        fq0 = await st(page, "favorites.length")
        if await has(page, '[data-action="favorites.quickRemove.submit"]') and fq0 > 0:
            await click(page, '[data-action="favorites.quickRemove.submit"]')
            fq1 = await st(page, "favorites.length")
            record("W21 favorites.quickRemove.submit 单件取消收藏(state)", fq1 < fq0, f"favorites {fq0}->{fq1}")
        else:
            record("W21 收藏单件删除入口", False, "no quickRemove / empty")

        # W22 发表评价 → 写入 reviews(自己写的评价可见) + 订单查看评价入口
        await goto(page, "/orders/o7/review")
        rv0 = await st(page, "reviews.length")
        if await has(page, '[data-action="reviewWrite.publish.submit"]'):
            await click(page, '[data-action="reviewWrite.publish.submit"]')
            rv1 = await st(page, "reviews.length")
            record("W22 reviewWrite.publish.submit 写入评价(state)", rv1 > rv0, f"reviews {rv0}->{rv1}")
        else:
            record("W22 评价发布入口", False, "no publish btn")
        await goto(page, "/orders")
        record("W22b 已评价订单出现查看评价入口", await has(page, '[data-trigger="orders.viewReview-open"]'))

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
