# -*- coding: utf-8 -*-
"""
淘宝闪购 运行时走查(pipeline v3 第五道 gate)
- P0 链路逐条执行+状态断言(点单/券/支付/订单状态机/退款/取消/评价/多店/待支付/自取/地址/聊天)
- 返回可达性断言(pipeline §11:连按返回必须回到 tab 根,签名序列无环)
- console error / pageerror 零容忍
用法: 模拟器跑在 URL(默认 :3001)时执行
    /Users/user/opt/anaconda3/envs/osworld/bin/python apps/TaobaoShangou/assets/runtime_walkthrough.py [url]
"""
import asyncio
import sys

from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3001"
RESULTS: list[tuple[str, bool, str]] = []


def record(name, passed, detail=""):
    RESULTS.append((name, bool(passed), detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


import re as _re

_STATE_HEADS = r"\b(coupons|cart|orders|checkoutDraft|user|addresses|chats)\b"


async def st(page, expr):
    expr2 = _re.sub(_STATE_HEADS, r"S.\1", expr)
    return await page.evaluate(
        "(() => { const S = window.__SIM__.getState().apps.tbsg; return (" + expr2 + "); })()")


async def click_loc(page, loc, wait=250):
    await loc.scroll_into_view_if_needed(timeout=8000)
    await loc.dispatch_event("click")
    await page.wait_for_timeout(wait)


async def tap(page, sel, nth=0, wait=600):
    """CSS zoom 下 Playwright 合成点击坐标不准,改用 dispatch_event('click')(直接派发到DOM元素,免坐标)。"""
    loc = page.locator(sel).nth(nth)
    await loc.scroll_into_view_if_needed(timeout=8000)
    await loc.dispatch_event("click")
    await page.wait_for_timeout(wait)


async def visible(page, sel):
    return await page.locator(sel).count() > 0


async def back(page, wait=500):
    await page.evaluate("window.__OS__.handleBack()")
    await page.wait_for_timeout(wait)


async def sig(page):
    return await page.evaluate(
        "document.querySelector('[data-adjust-resize]') ? document.querySelector('[data-adjust-resize]').innerText.slice(0,160) : document.body.innerText.slice(0,160)")


async def to_root(page):
    """回到 tab 根页:见到 TabBar 即停;若误退到 launcher 则重开 app"""
    for _ in range(10):
        if await visible(page, '[data-trigger="tabbar.home-open"]'):
            return
        await back(page, 350)
    await page.evaluate("window.__OS__.openApp('tbsg')")
    await page.wait_for_timeout(1200)


async def main():
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 420, "height": 900})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:200]}"))
        page.on("console", lambda m: errors.append(f"console: {m.text[:200]}")
                if m.type == "error" and "404" not in m.text else None)

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.evaluate("window.localStorage.clear()")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.evaluate("window.__OS__.openApp('tbsg')")
        await page.wait_for_timeout(2500)

        # ---------- W1 首页渲染 + 进入美食频道 + 一键领红包 ----------
        home_ok = await visible(page, '[data-trigger="home.channel.food-open"]')
        record("W1a 首页渲染(金刚区)", home_ok)
        await tap(page, '[data-trigger="home.channel.food-open"]', wait=900)
        n0 = await st(page, "coupons.filter(c=>c.status==='claimed').length")
        await tap(page, '[data-action="channel.redpacket.claimAll"]')
        n1 = await st(page, "coupons.filter(c=>c.status==='claimed').length")
        record("W1b 夜市红包一键领取 claimed+3", n1 == n0 + 3, f"{n0}->{n1}")

        # ---------- W2 进店(乡味鸡:cnfast 起送20 无必选品) ----------
        await page.evaluate("window.__OS__.navigateApp ? null : null")
        # 频道列表点乡味鸡:通过品类过滤保证可见——直接点第一家,然后校验店铺页框架
        await tap(page, '[data-trigger="channel.shop-open"]', wait=1100)
        on_shop = await visible(page, '[data-action="shop.category.select"]')
        record("W2 频道→店铺页(分类栏渲染)", on_shop)

        # ---------- W3 单规格加购(点到出现去结算) ----------
        c0 = await st(page, "cart.length")
        adds = page.locator('[data-action="shop.item.add"]')
        cnt = await adds.count()
        for i in range(min(cnt, 4)):
            await click_loc(page, adds.nth(i))
            await page.wait_for_timeout(250)
        # 再补几次第一个(冲起送价)
        for _ in range(6):
            if await visible(page, '[data-trigger="shop.checkout-open"]'):
                break
            if cnt:
                await click_loc(page, adds.first)
                await page.wait_for_timeout(250)
        c1 = await st(page, "cart.length")
        record("W3 单规格加购 cart增行", c1 > c0, f"cart {c0}->{c1}")

        # ---------- W4 SKU 弹层加购 ----------
        if await visible(page, '[data-action="shop.skuSheet.open"]'):
            q0 = await st(page, "cart.reduce((a,l)=>a+l.qty,0)")
            await tap(page, '[data-action="shop.skuSheet.open"]')
            await tap(page, '[data-action="shop.sku.confirm"]', wait=700)
            q1 = await st(page, "cart.reduce((a,l)=>a+l.qty,0)")
            record("W4 SKU弹层选好了 qty+1", q1 == q0 + 1, f"{q0}->{q1}")
        else:
            record("W4 SKU弹层选好了 qty+1", False, "无选规格按钮")

        # ---------- W5 店铺领券(关注领券) ----------
        await tap(page, '[data-action="shop.couponSheet.open"]')
        if await visible(page, '[data-action="shop.coupon.followClaim"]'):
            k0 = await st(page, "coupons.length")
            await tap(page, '[data-action="shop.coupon.followClaim"]')
            k1 = await st(page, "coupons.length")
            record("W5 关注领券 coupons+1", k1 == k0 + 1, f"{k0}->{k1}")
        else:
            record("W5 关注领券 coupons+1", False, "弹层无领券按钮")
        await back(page)  # 关弹层

        # ---------- W6 去结算 → 选券 → 合计联动 ----------
        ok_btn = await visible(page, '[data-trigger="shop.checkout-open"]')
        record("W6a 满起送出现去结算", ok_btn)
        await tap(page, '[data-trigger="shop.checkout-open"]', wait=1000)
        on_checkout = await visible(page, '[data-action="checkout.pay.open"]')
        record("W6b 确认订单页渲染", on_checkout)
        draft_coupon0 = await st(page, "checkoutDraft && checkoutDraft.platformCouponId")
        await tap(page, '[data-trigger="checkout.platformcoupon-open"]', wait=800)
        if await visible(page, '[data-action="checkout.coupon.select"]'):
            await tap(page, '[data-action="checkout.coupon.select"]')
        await tap(page, '[data-trigger="checkout.coupon.confirm"]', wait=800)
        record("W6c 选券页往返回结算页", await visible(page, '[data-action="checkout.pay.open"]'))

        # ---------- W7 支付 → 支付成功页 → 新订单 preparing + 用券 ----------
        o0 = await st(page, "orders.length")
        await tap(page, '[data-action="checkout.pay.open"]')
        await tap(page, '[data-trigger="checkout.pay.success"]', wait=1200)
        o1 = await st(page, "orders.length")
        new_status = await st(page, "orders[0] && orders[0].status")
        record("W7a 支付生成订单(preparing)", o1 == o0 + 1 and new_status == "preparing", f"orders {o0}->{o1} status={new_status}")
        used = await st(page, "coupons.some(c=>c.status==='used')")
        record("W7b 所选券状态变used", bool(used))
        on_success = await visible(page, '[data-trigger="paysuccess.order-open"]')
        record("W7c 支付成功页渲染", on_success)
        new_oid = await st(page, "orders[0].id")

        # ---------- W8 订单详情 preparing 态 + 65s 推进 delivering(qa:Q2) ----------
        await tap(page, '[data-trigger="paysuccess.order-open"]', wait=1000)
        has_cancel = await visible(page, '[data-trigger="order.cancel.confirm"]')
        record("W8a 详情preparing态(可取消)", has_cancel)
        print("  ... 等待75s 订单自动推进(preparing→delivering)", flush=True)
        await page.wait_for_timeout(75000)
        s2 = await st(page, f"orders.find(o=>o.id==='{new_oid}').status")
        record("W8b 75s后自动推进delivering", s2 == "delivering", f"status={s2}")

        # ---------- W9 取消订单 → cancelSurvey → canceled+极速退 ----------
        await tap(page, '[data-trigger="order.cancel.confirm"]', wait=1000)
        s3 = await st(page, f"orders.find(o=>o.id==='{new_oid}').status")
        rf = await st(page, f"(orders.find(o=>o.id==='{new_oid}').refund||{{}}).status")
        record("W9a 取消订单→canceled+极速退done", s3 == "canceled" and rf == "done", f"status={s3} refund={rf}")
        if await visible(page, '[data-action="cancel.survey.select"]'):
            await tap(page, '[data-action="cancel.survey.select"]')
        await tap(page, '[data-trigger="cancel.survey.submit"]', wait=900)
        record("W9b 调研提交回详情(已取消)", await visible(page, '[data-trigger="order.detail.refund-open"]'))

        # ---------- W10 退款全链路(预置已送达单 o1001) ----------
        await to_root(page)
        await tap(page, '[data-trigger="tabbar.mine-open"]', wait=700)
        await tap(page, '[data-trigger="mine.orders-open"]', wait=900)
        await tap(page, '[data-trigger="order.list.detail-open"]', nth=0, wait=900)
        # 列表第一单可能不是o1001,直接找申请售后按钮;若无则返回换一单
        for attempt in range(3):
            if await visible(page, '[data-action="order.refundReason.open"]'):
                break
            await back(page, 500)
            await tap(page, '[data-trigger="order.list.detail-open"]', nth=attempt + 1, wait=900)
        await tap(page, '[data-action="order.refundReason.open"]')
        await tap(page, '[data-action="refund.reason.select"]', nth=1)  # 选"少了/错了"
        await tap(page, '[data-trigger="refund.reason.next"]', wait=900)
        on_form = await visible(page, '[data-action="refund.form.item.toggle"]')
        record("W10a 售后原因→表单页", on_form)
        # 勾选第一个商品
        await tap(page, '[data-action="refund.form.item.toggle"]', nth=0, wait=400)
        await tap(page, '[data-trigger="refund.form.submit"]', wait=1000)
        rid = await st(page, "orders.find(o=>o.status==='refunding') && orders.find(o=>o.status==='refunding').id")
        record("W10b 提交→订单refunding", bool(rid), f"id={rid}")
        on_progress = await visible(page, '[data-action="refund.progress.timeline.expand"]')
        record("W10c 退款进度页渲染", on_progress)
        print("  ... 等待75s 退款自动推进(processing→done)", flush=True)
        await page.wait_for_timeout(75000)
        rstat = await st(page, f"orders.find(o=>o.id==='{rid}').status" if rid else "'skip'")
        record("W10d 75s后退款成功refunded", rstat == "refunded", f"status={rstat}")

        # ---------- W11 评价(待评价单) ----------
        await to_root(page)
        await tap(page, '[data-trigger="tabbar.mine-open"]', wait=700)
        beans0 = await st(page, "user.beans")
        rv_oid = await st(page, "(orders.find(o=>o.status==='delivered'&&!o.reviewed)||{}).id")
        if rv_oid:
            await tap(page, '[data-trigger="mine.orders-open"]', wait=900)
            # 找到评价按钮
            if await visible(page, '[data-trigger="order.list.review-open"]'):
                await tap(page, '[data-trigger="order.list.review-open"]', wait=900)
                await tap(page, '[data-action="review.stars.set"]', nth=4)
                await tap(page, '[data-trigger="review.submit"]', wait=1000)
                reviewed = await st(page, f"orders.find(o=>o.id==='{rv_oid}').reviewed")
                beans1 = await st(page, "user.beans")
                record("W11 评价提交 reviewed+豆", bool(reviewed) and beans1 > beans0, f"beans {beans0}->{beans1}")
            else:
                record("W11 评价提交 reviewed+豆", False, "列表无评价按钮")
        else:
            record("W11 评价提交 reviewed+豆", False, "无待评价单")

        # ---------- W12 多店一键结算(qa:Q7 拆单) ----------
        await to_root(page)
        await tap(page, '[data-trigger="tabbar.cart-open"]', wait=800)
        await page.evaluate("""(() => { /* 全选 */ })()""")
        if await visible(page, '[data-action="cart.checkall.toggle"]'):
            await tap(page, '[data-action="cart.checkall.toggle"]')
        shops_sel = await st(page, "new Set(cart.filter(l=>l.selected).map(l=>l.shopId)).size")
        if await visible(page, '[data-trigger="cart.checkout-open"]'):
            oo0 = await st(page, "orders.length")
            await tap(page, '[data-trigger="cart.checkout-open"]', wait=1000)
            groups = await st(page, "checkoutDraft && checkoutDraft.shopGroups.length")
            record("W12a 多店结算分组", groups == shops_sel and (groups or 0) >= 2, f"groups={groups} shops={shops_sel}")
            await tap(page, '[data-action="checkout.pay.open"]')
            await tap(page, '[data-trigger="checkout.pay.success"]', wait=1200)
            oo1 = await st(page, "orders.length")
            record("W12b 支付拆成多订单", oo1 == oo0 + (groups or 0), f"orders {oo0}->{oo1}")
        else:
            record("W12a 多店结算分组", False, "购物车无结算按钮")
            record("W12b 支付拆成多订单", False, "skip")

        # ---------- W13 待支付(收银台×) ----------
        await to_root(page)
        await tap(page, '[data-trigger="tabbar.home-open"]', wait=700)
        await tap(page, '[data-trigger="home.shop-open"]', nth=0, wait=1100)
        adds = page.locator('[data-action="shop.item.add"]')
        for _ in range(8):
            if await visible(page, '[data-trigger="shop.checkout-open"]'):
                break
            if await adds.count():
                await click_loc(page, adds.first)
                await page.wait_for_timeout(250)
        await tap(page, '[data-trigger="shop.checkout-open"]', wait=1000)
        await tap(page, '[data-action="checkout.pay.open"]')
        u0 = await st(page, "orders.filter(o=>o.status==='unpaid').length")
        await tap(page, '[data-trigger="checkout.pay.abandon"]', wait=1200)
        u1 = await st(page, "orders.filter(o=>o.status==='unpaid').length")
        has_repay = await visible(page, '[data-action="order.repay.open"]')
        record("W13a 收银台×→待支付订单(qa:R4)", u1 == u0 + 1 and has_repay, f"unpaid {u0}->{u1}")
        await tap(page, '[data-action="order.repay.open"]')
        await tap(page, '[data-trigger="checkout.pay.success"]', wait=1200)
        paid = await st(page, "orders.filter(o=>o.status==='unpaid').length")
        record("W13b 去支付→转preparing", paid == u0, f"unpaid={paid}")

        # ---------- W14 自取模式(qa:Q8) ----------
        await to_root(page)
        await tap(page, '[data-trigger="home.shop-open"]', nth=1, wait=1100)
        if await page.locator('[data-action="shop.pickup.toggle"]').count() >= 2:
            await tap(page, '[data-action="shop.pickup.toggle"]', nth=1)
            adds = page.locator('[data-action="shop.item.add"]')
            for _ in range(8):
                if await visible(page, '[data-trigger="shop.checkout-open"]'):
                    break
                if await adds.count():
                    await click_loc(page, adds.first)
                    await page.wait_for_timeout(250)
            await tap(page, '[data-trigger="shop.checkout-open"]', wait=1000)
            mode = await st(page, "checkoutDraft && checkoutDraft.mode")
            record("W14 自取模式进结算", mode == "pickup", f"mode={mode}")
        else:
            record("W14 自取模式进结算", False, "无自取切换")

        # ---------- W15 地址新增 ----------
        await to_root(page)
        await tap(page, '[data-trigger="tabbar.mine-open"]', wait=700)
        await tap(page, '[data-trigger="mine.address-open"]', wait=800)
        a0 = await st(page, "addresses.length")
        await tap(page, '[data-trigger="address.list.add-open"]', wait=800)
        await tap(page, '[data-action="address.edit.poi.open"]')
        # POI 面板选第一项
        await click_loc(page, page.locator("text=阳光花园小区").last, wait=500)
        await page.wait_for_timeout(500)
        await page.get_by_placeholder("填写详细地址,例:1层102室").fill("8栋301")
        await page.get_by_placeholder("填写收货人姓名").fill("测试员")
        await page.get_by_placeholder("填写正确的收货人号码").fill("13912345678")
        # 收起模拟键盘再点保存(真实用户行为;键盘覆盖下方按钮属正常)
        await page.evaluate("document.activeElement && document.activeElement.blur()")
        await page.wait_for_timeout(500)
        if await visible(page, '[data-trigger="address.edit.save"]'):
            await tap(page, '[data-trigger="address.edit.save"]', wait=900)
        a1 = await st(page, "addresses.length")
        record("W15 新增地址 addresses+1", a1 == a0 + 1, f"{a0}->{a1}")

        # ---------- W16 商家聊天自动回复(qa:Q9) ----------
        await to_root(page)
        await tap(page, '[data-trigger="tabbar.message-open"]', wait=700)
        if await visible(page, '[data-trigger="message.shop-open"]'):
            await tap(page, '[data-trigger="message.shop-open"]', wait=900)
            key0 = await st(page, "Object.values(chats).reduce((a,v)=>a+v.length,0)")
            await tap(page, '[data-action="shopchat.quickq.send"]', wait=2500)
            key1 = await st(page, "Object.values(chats).reduce((a,v)=>a+v.length,0)")
            record("W16 聊天发送+自动回复(+2)", key1 == key0 + 2, f"{key0}->{key1}")
        else:
            record("W16 聊天发送+自动回复(+2)", False, "无商家会话")

        # ---------- W-BACK 返回可达性断言(pipeline §11) ----------
        # 从深层页出发:券包页(经我的进入)
        for depth_start in ("coupons", "refund"):
            if depth_start == "coupons":
                await to_root(page)
                await tap(page, '[data-trigger="tabbar.mine-open"]', wait=600)
                await tap(page, '[data-trigger="mine.coupons-open"]', wait=700)
            else:
                await to_root(page)
                await tap(page, '[data-trigger="tabbar.mine-open"]', wait=600)
                await tap(page, '[data-trigger="mine.orders-open"]', wait=700)
                if await visible(page, '[data-trigger="order.list.refund-open"]'):
                    await tap(page, '[data-trigger="order.list.refund-open"]', wait=800)
            sigs = []
            reached_root = False
            for i in range(12):
                s_now = await sig(page)
                if sigs.count(s_now) >= 2:
                    break  # 打转
                sigs.append(s_now)
                # tab 根判定:底部tab栏存在
                if await visible(page, '[data-trigger="tabbar.home-open"]'):
                    reached_root = True
                    break
                await back(page, 400)
            loop_detected = any(sigs.count(x) >= 2 for x in sigs)
            record(f"W-BACK({depth_start}) 连按返回回到tab根且无环", reached_root and not loop_detected,
                   f"steps={len(sigs)} loop={loop_detected}")

        # ---------- 控制台错误 ----------
        uniq = list(dict.fromkeys(errors))[:8]
        record("W-ERR 控制台零错误", len(errors) == 0, f"{len(errors)}条: " + " | ".join(uniq[:3]))

        await browser.close()

    failed = [r for r in RESULTS if not r[1]]
    print(f"\n===== 走查结果: {len(RESULTS) - len(failed)}/{len(RESULTS)} PASS =====")
    if failed:
        for name, _, detail in failed:
            print(f"  FAIL: {name}  {detail}")
        sys.exit(1)


asyncio.run(main())
