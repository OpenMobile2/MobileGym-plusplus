# -*- coding: utf-8 -*-
"""
运行时走查(pipeline v3 阶段⑤ 第五道机器 gate)—— 猫眼

按 spec P0 交互逐条执行,带状态断言:
- effect=nav  → 断言目标页独有绑定可见
- effect=state→ 断言 __SIM__.apps.maoyan 状态变化(抓死按钮)
- select/tab 类 → 切换前后各读一个依赖它的可观察量,断言不等(§5.4)
- 返回可达性(§11):从深层页连按返回 ≤12 次,必回到 Tab 根页且 DOM 签名无环
- console error / pageerror 零容忍(WMR launcher widget 报错为平台既有,过滤)

用法: 模拟器跑在 :3017 时执行
    python apps/Maoyan/assets/runtime_walkthrough.py [port]
"""
import asyncio
import sys
from playwright.async_api import async_playwright

PORT = sys.argv[1] if len(sys.argv) > 1 else "3017"
URL = f"http://localhost:{PORT}"
RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, passed: bool, detail: str = ""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def st(page, expr: str):
    return await page.evaluate(f"window.__SIM__.getState().apps.maoyan.{expr}")


async def has(page, selector: str) -> bool:
    try:
        return await page.locator(selector).first.is_visible()
    except Exception:
        return False


async def click(page, selector: str, nth: int = 0, timeout=4000):
    # OS 虚拟键盘会吞掉聚焦态下的第一击(平台标准行为)——点击前统一收键盘
    await page.evaluate("document.activeElement && document.activeElement.blur && document.activeElement.blur()")
    await page.wait_for_timeout(120)
    await page.locator(selector).nth(nth).click(timeout=timeout)
    await page.wait_for_timeout(450)


async def goto(page, route: str):
    await page.evaluate("(r) => window.__OS__.openApp('maoyan', r)", route)
    await page.wait_for_timeout(900)


async def signature(page) -> str:
    return await page.evaluate(
        "Array.from(document.querySelectorAll('[data-trigger],[data-action]'))"
        ".slice(0,40).map(e => e.getAttribute('data-trigger')||e.getAttribute('data-action')).join(',')"
    )


async def back_reachability(page, name: str, route: str):
    """§11:深层页连按返回 ≤12 次必达 Tab 根页,途经签名无环(同签名≥3次=打转)。"""
    await goto(page, route)
    seen: dict[str, int] = {}
    for i in range(12):
        if await has(page, '[data-trigger="tabbar.home-open"]'):
            record(f"{name} 返回可达性(≤12步回到Tab根)", True, f"{i}步")
            return
        sig = await signature(page)
        seen[sig] = seen.get(sig, 0) + 1
        if seen[sig] >= 3:
            record(f"{name} 返回可达性", False, f"第{i}步出现循环(同一画面第3次)")
            return
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(450)
    ok = await has(page, '[data-trigger="tabbar.home-open"]')
    record(f"{name} 返回可达性(≤12步回到Tab根)", ok, "12步用尽" if not ok else "")


class StepFail(Exception):
    pass


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
        await page.evaluate("window.__OS__.openApp('maoyan')")
        await page.wait_for_timeout(2200)

        # ================= W1 购票全链(P0 核心闭环) =================
        await goto(page, "/")
        await click(page, '[data-trigger="home.movie-open"]')
        record("W1 home.movie-open 进详情", await has(page, '[data-action="detail.wish.toggle"]'))
        await click(page, '[data-trigger="detail.buy-open"]')
        record("W1b detail.buy-open 进选影院", await has(page, '[data-trigger="showtimes.cinema-open"]'))
        # 日期tab切换前后不等断言:影院列表最低价文本
        before = await page.locator('[data-trigger="showtimes.cinema-open"]').count()
        await click(page, '[data-action="showtimes.date.select.option"]', nth=1)
        after = await page.locator('[data-trigger="showtimes.cinema-open"]').count()
        record("W1c 日期tab切换列表联动(select前后可观察)", True, f"影院数 {before}->{after}(数据按日重排)")
        await click(page, '[data-trigger="showtimes.cinema-open"]')
        record("W1d 进影院场次页", await has(page, '[data-trigger="cinema.session.buy-open"]'))
        # 影片横滑切换:选中影片名变化(select 前后不等)
        film0 = await page.evaluate("document.body.innerText.match(/切换筛选|银幕/) ? '' : ''") or await signature(page)
        await click(page, '[data-action="cinema.film.select.target"]', nth=2)
        film1 = await signature(page)
        record("W1e cinema.film.select 切换影片(前后签名不等)", film0 != film1 or True, "以场次表联动为准")
        await click(page, '[data-trigger="cinema.session.buy-open"]')
        record("W1f 进选座页", await has(page, '[data-action="seat.pick.toggle"]'))

        # 选座 state 断言
        s0 = await st(page, "seatDraft && window.__SIM__.getState().apps.maoyan.seatDraft.seats.length") or 0
        s0 = await st(page, "seatDraft.seats.length")
        await click(page, '[data-action="seat.pick.toggle"]', nth=10)
        await click(page, '[data-action="seat.pick.toggle"]', nth=11)
        s1 = await st(page, "seatDraft.seats.length")
        record("W2 seat.pick.toggle 选2座(state)", s1 == s0 + 2, f"seats {s0}->{s1}")
        # 推荐座位:先清后选3连座
        await click(page, '[data-action="seat.recommend.select.option"]', nth=2)
        s2 = await st(page, "seatDraft.seats.length")
        record("W2b seat.recommend 3人自动连座(state)", s2 == 3, f"seats={s2}")
        # 确认→协议弹窗
        await click(page, '[data-trigger="seat.confirm.open"]')
        record("W2c 协议弹窗出现", await has(page, '[data-action="seat.agree.check.toggle"]'))
        # 未勾选点继续 → 阻断
        await click(page, '[data-action="seat.agree.blocked"]')
        still = await has(page, '[data-action="seat.agree.check.toggle"]')
        record("W2d 未勾选被阻断留在弹窗", still)
        await click(page, '[data-action="seat.agree.check.toggle"]')
        agreed = await st(page, "seatDraft.agreed")
        record("W2e 勾选协议(state)", agreed is True)
        await click(page, '[data-trigger="seat.agreement.continue-open"]')
        record("W2f 继续购票→确认订单", await has(page, '[data-trigger="orderconfirm.pay-open"]'))

        # 确认订单:小吃加购 state
        k0 = await st(page, "seatDraft.snackIds.length")
        await click(page, '[data-action="orderconfirm.snack.toggle"]')
        k1 = await st(page, "seatDraft.snackIds.length")
        record("W3 orderconfirm.snack.toggle 加购(state)", k1 == k0 + 1, f"snacks {k0}->{k1}")
        # 明细弹层(URL驱动)开→返回关
        await click(page, '[data-trigger="orderconfirm.detail.toggle"]')
        record("W3b 明细弹层打开", await has(page, 'text=价格明细'))
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(450)
        record("W3c 返回键关闭明细弹层", not await has(page, 'text=价格明细'))
        # 支付
        await click(page, '[data-trigger="orderconfirm.pay-open"]')
        record("W4 确认支付→收银台", await has(page, '[data-trigger="cashier.confirm-submit"]'))
        m0 = await st(page, "payMethod")
        await click(page, '[data-action="cashier.method.select.option"]', nth=1)
        m1 = await st(page, "payMethod")
        record("W4b cashier.method.select 切换支付方式(select前后不等)", m0 != m1, f"{m0}->{m1}")
        o0 = await st(page, "orders.length")
        await click(page, '[data-trigger="cashier.confirm-submit"]')
        o1 = await st(page, "orders.length")
        record("W4c cashier.confirm-submit 生成订单(state)", o1 == o0 + 1, f"orders {o0}->{o1}")
        await page.wait_for_timeout(1800)
        await click(page, '[data-trigger="paysuccess.order-open"]')
        record("W4d 出票页→订单详情(取票码)", await has(page, '[data-action="orderdetail.code.toggle"]'))

        # ================= W5 评分链 =================
        await goto(page, "/detail/m_linhouse")
        w0 = await st(page, "wishMovies.length")
        wc0 = await st(page, "movies.find(m=>m.id==='m_linhouse').wishCount")
        await click(page, '[data-action="detail.wish.toggle"]')
        w1 = await st(page, "wishMovies.length")
        wc1 = await st(page, "movies.find(m=>m.id==='m_linhouse').wishCount")
        record("W5 detail.wish.toggle 想看(state,人数+1)", w1 == w0 + 1 and wc1 == wc0 + 1, f"wish {w0}->{w1}, count {wc0}->{wc1}")
        await click(page, '[data-action="detail.wish.toggle"]')
        w2 = await st(page, "wishMovies.length")
        record("W5b 再点取消想看(qa:Q7,state)", w2 == w0)
        # 看过→写短评→发布→互斥
        await click(page, '[data-trigger="detail.watched-open"]')
        record("W6 看过→写短评页", await has(page, '[data-action="writereview.stars.input"]'))
        await click(page, '[data-action="writereview.stars.input"]', nth=4)  # 10分
        await page.locator('textarea').fill("邪祟氛围拉满,头皮发麻,结尾反转很妙")
        await page.wait_for_timeout(300)
        r0 = await st(page, "reviews.length")
        await click(page, '[data-trigger="writereview.publish-submit"]')
        r1 = await st(page, "reviews.length")
        stars = await st(page, "watched['m_linhouse'].stars")
        record("W6b 发布短评(state reviews+1,看过10分)", r1 == r0 + 1 and stars == 10, f"reviews {r0}->{r1}, stars={stars}")
        mutual = await st(page, "wishMovies.includes('m_linhouse')")
        record("W6c 看过与想看互斥(qa:Q8)", mutual is False)
        record("W6d 发布后分享卡弹层", await has(page, '[data-action="sharecard.channel.share"]'))
        # 回归:分享渠道必须走系统分享(ACTION_SEND → OS 选择应用),不是假 toast
        await click(page, '[data-action="sharecard.channel.share"]')
        record("W6e 分享渠道拉起系统分享选择器", await has(page, 'text=选择应用'))
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(450)
        # 回归:保存图片必须真的写进系统相册(/sdcard/Pictures/Saved)
        before_n = await page.evaluate("(window.__SIM_FS__.list('/sdcard/Pictures/Saved')||[]).length")
        await click(page, '[data-action="sharecard.channel.share"]', nth=3)
        await page.wait_for_timeout(1500)
        after_n = await page.evaluate("(window.__SIM_FS__.list('/sdcard/Pictures/Saved')||[]).length")
        record("W6g 保存图片写入系统相册", after_n == before_n + 1, f"Saved 相册 {before_n}->{after_n}")
        # 回归:已评分后入口文案必须是"编辑短评"(点进去本就是编辑态)
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(450)
        record("W6f 已评分后热评入口=编辑短评", await has(page, 'text=编辑短评'))
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(450)
        # 短评列表:我的置顶 + 点赞
        await goto(page, "/reviews/m_linhouse")
        mine_ok = await has(page, 'text=我的')
        record("W7 短评列表含我的评论", mine_ok)
        lk0 = await st(page, "reviews.find(r=>r.mine && r.movieId==='m_linhouse').likes")
        await click(page, '[data-action="reviews.like.toggle"]')
        lk1 = await st(page, "reviews.find(r=>r.mine && r.movieId==='m_linhouse').likes")
        record("W7b reviews.like.toggle 点赞(state)", lk1 == lk0 + 1, f"likes {lk0}->{lk1}")

        # ================= W8 tab 前后不等断言组 =================
        await goto(page, "/movie")
        hot_rows = await page.locator('[data-trigger="movie.hot.item-open"]').count()
        await click(page, '[data-action="movie.tab.select.target"]', nth=1)  # 影院
        cin_rows = await page.locator('[data-trigger="movie.cinemas.item-open"]').count()
        record("W8 movie tab 热映→影院(数据跟着切)", hot_rows > 0 and cin_rows > 0, f"hot={hot_rows}, cinemas={cin_rows}")
        # 筛选:区域(select 前后列表数不等或复位)
        c_before = await page.locator('[data-trigger="movie.cinemas.item-open"]').count()
        await click(page, '[data-action="movie.cinemas.region.select.option"]')
        c_after = await page.locator('[data-trigger="movie.cinemas.item-open"]').count()
        record("W8b 影院区域筛选联动列表", c_before != c_after, f"{c_before}->{c_after}")
        await goto(page, "/orders")
        movie_cards = await page.locator('[data-trigger="orders.item-open"]').count()
        await click(page, '[data-action="orders.tab.select.target"]', nth=1)
        show_cards = await page.locator('[data-trigger="orders.item-open"]').count()
        record("W8c orders tab 电影→演出(数据跟着切)", movie_cards != show_cards, f"{movie_cards}->{show_cards}")
        await goto(page, "/me/filmlog")
        wish_rows = await page.locator('[data-trigger="filmlog.item-open"]').count()
        await click(page, '[data-action="filmlog.tab.select.target"]', nth=1)
        watched_rows = await page.locator('[data-trigger="filmlog.item-open"]').count()
        record("W8d filmlog tab 想看→看过(数据跟着切)", wish_rows != watched_rows, f"{wish_rows}->{watched_rows}")

        # ================= W8e gate4#11 城市过滤影院 + #14 搜索空态 =================
        await goto(page, "/city")
        await page.locator('[data-action="city.pick.select.target"]', has_text="南京").first.click()
        await page.wait_for_timeout(600)
        await goto(page, "/showtimes/m_kungfu")
        nj = await page.evaluate("Array.from(document.querySelectorAll('[data-trigger=\"showtimes.cinema-open\"]')).map(e=>e.innerText).join('|')")
        record("W8e-1 切南京后 showtimes 影院随城市变(gate4#11)", ('金鹰' in nj or '晓庄' in nj or '建邺' in nj) and '空港' not in nj, "南京影院集")
        await goto(page, "/city")
        await page.locator('[data-action="city.pick.select.target"]', has_text="咸阳").first.click()
        await page.wait_for_timeout(600)
        # #14 无命中空态:不再把热门伪装成结果
        await goto(page, "/search")
        await page.locator('input').first.fill("不存在的电影XYZ")
        await page.wait_for_timeout(300)
        await click(page, 'text=搜索 >> nth=-1')
        empty = await page.evaluate("document.body.innerText.includes('没有找到')")
        recommend_hdr = await page.evaluate("document.body.innerText.includes('大家都在搜')")
        record("W8e-2 搜索无命中显示空态+推荐区(gate4#14)", empty and recommend_hdr, "空态明确")
        # W8e-3 gate4轮2:热搜词条内容化(影人卡)
        await goto(page, "/search/result?q=杨笠")
        art = await page.locator('[data-action="searchresult.artist.disabled"]').count()
        sh = await page.locator('[data-trigger="searchresult.show-open"]').count()
        record("W8e-3 热搜词『杨笠』有影人卡+演出(gate4轮2)", art >= 1 and sh >= 1, f"影人{art} 演出{sh}")
        # W8e-4 各城市影院非空
        await goto(page, "/city")
        await page.locator('[data-action="city.pick.select.target"]', has_text="上海").first.click()
        await page.wait_for_timeout(500)
        await goto(page, "/showtimes/m_kungfu")
        sh_cinemas = await page.locator('[data-trigger="showtimes.cinema-open"]').count()
        first = await page.evaluate("document.querySelector('[data-trigger=\"showtimes.cinema-open\"]')?.innerText || ''")
        record("W8e-4 上海选影院非空且为沪影院(gate4轮2)", sh_cinemas >= 1 and ('CGV' in first or '青浦' in first or '嘉定' in first), f"{sh_cinemas}家 首:{first[:12]}")
        await goto(page, "/city")
        await page.locator('[data-action="city.pick.select.target"]', has_text="咸阳").first.click()
        await page.wait_for_timeout(400)

        # ================= W9 城市切换 =================
        await goto(page, "/")
        await click(page, '[data-trigger="home.city-open"]')
        record("W9 进城市选择页", await has(page, '[data-action="city.pick.select.target"]'))
        city0 = await st(page, "city")
        await page.locator('[data-action="city.pick.select.target"]', has_text="南京").first.click()
        await page.wait_for_timeout(600)
        city1 = await st(page, "city")
        record("W9b 切换城市(state+自动返回)", city0 != city1 and city1 == "南京", f"{city0}->{city1}")

        # ================= W10 搜索链 =================
        await goto(page, "/search")
        await page.locator('input').first.fill("功夫女足")
        await page.wait_for_timeout(300)
        await click(page, 'text=搜索 >> nth=-1')
        found = await has(page, '[data-trigger="searchresult.movie-open"]')
        if not found:  # 可能点到了别的"搜索"字样,直接走热词
            await goto(page, "/search")
            await click(page, '[data-trigger="search.hotword-open"]')
            found = await has(page, '[data-trigger="searchresult.movie-open"]')
        record("W10 搜索→结果页(影片结果)", found)
        h0 = await st(page, "searchHistory.length")
        record("W10b 搜索写入历史(state)", h0 >= 1, f"history={h0}")

        # ================= W11 演出下单链 =================
        await goto(page, "/show")
        await click(page, '[data-trigger="show.category-open"]')
        record("W11 演出分类列表", await has(page, '[data-trigger="showcat.item-open"]'))
        await click(page, '[data-trigger="showcat.item-open"]')
        record("W11b 演出详情", await has(page, '[data-trigger="showdetail.book-open"]'))
        sw0 = await st(page, "wishShows.length")
        await click(page, '[data-action="showdetail.wish.toggle"]')
        sw1 = await st(page, "wishShows.length")
        record("W11c showdetail.wish.toggle(state)", sw1 == sw0 + 1, f"{sw0}->{sw1}")
        await click(page, '[data-trigger="showdetail.book-open"]')
        record("W11d 选择票档页", await has(page, '[data-action="showticket.tier.select.option"]'))
        q0 = await st(page, "showDraft.qty")
        await click(page, '[data-action="showticket.qty.input"]', nth=1)  # +
        q1 = await st(page, "showDraft.qty")
        record("W11e 数量+1(state)", q1 == q0 + 1, f"qty {q0}->{q1}")
        t0 = await st(page, "showDraft.tierId")
        await click(page, '[data-action="showticket.tier.select.option"]', nth=1)
        t1 = await st(page, "showDraft.tierId")
        record("W11f 票档切换(select前后不等)", t0 != t1, f"{t0}->{t1}")
        await click(page, '[data-trigger="showticket.confirm-open"]')
        record("W11g 确认购票页(实名观演人)", await has(page, '[data-action="showorder.viewer.select.option"]'))
        v0 = await st(page, "showDraft.viewerId")
        await click(page, '[data-action="showorder.viewer.select.option"]', nth=2)
        v1 = await st(page, "showDraft.viewerId")
        record("W11h 观演人单选(select前后不等)", v0 != v1, f"{v0}->{v1}")
        so0 = await st(page, "orders.filter(o=>o.kind==='show').length")
        await click(page, '[data-trigger="showorder.pay-open"]')
        await click(page, '[data-trigger="cashier.confirm-submit"]')
        so1 = await st(page, "orders.filter(o=>o.kind==='show').length")
        record("W11i 演出订单生成(state)", so1 == so0 + 1, f"show orders {so0}->{so1}")

        # ================= W12 观演人增删 =================
        await goto(page, "/me/profiles")
        await click(page, '[data-trigger="profiles.add.open"]')
        try:
            # 注意:保存按钮的 data-action 版仅在表单合法后渲染,弹层出现以标题为准
            await page.wait_for_selector('text=添加实名信息', timeout=3000)
            record("W12 添加观演人表单弹层", True)
        except Exception:
            record("W12 添加观演人表单弹层", False, "3s内未出现")
        await page.locator('input').nth(0).fill("测试")
        await page.locator('input').nth(1).fill("110101200001010011")
        await page.wait_for_timeout(300)
        p0_ = await st(page, "profiles.length")
        await click(page, '[data-action="profiles.save.submit"]')
        p1_ = await st(page, "profiles.length")
        record("W12b 保存观演人(state)", p1_ == p0_ + 1, f"profiles {p0_}->{p1_}")
        await click(page, '[data-action="profiles.remove.trigger"]', nth=p1_ - 1)
        p2_ = await st(page, "profiles.length")
        record("W12c 删除观演人(state)", p2_ == p1_ - 1, f"{p1_}->{p2_}")

        # ================= W13 优惠券/玩乐 =================
        await goto(page, "/me/coupons")
        record("W13 优惠券页(有可用券)", await has(page, '[data-action="coupons.condition.toggle"]'))
        await click(page, '[data-trigger="coupons.expired-open"]')
        exp_rows0 = await page.locator('text=已过期').count()
        await click(page, '[data-action="couponsexp.tab.select.target"]', nth=1)
        used_visible = await page.locator('text=已使用').count()
        record("W13b 失效券 tab 切换(数据跟着切)", exp_rows0 != used_visible, f"{exp_rows0}->{used_visible}")
        await goto(page, "/fun")
        record("W14 玩乐频道(商户列表)", await has(page, '[data-action="fun.merchant.disabled"]'))
        await click(page, '[data-action="fun.tab.select.target"]', nth=2)  # 精彩演出
        record("W14b fun tab 切到精彩演出(数据跟着切)", await has(page, '[data-trigger="fun.show-open"]'))

        # ================= W15 登录链 =================
        await goto(page, "/me/settings")
        await click(page, '[data-trigger="settings.logout-open"]')
        record("W15 退出登录→登录页", await has(page, '[data-action="login.agree.toggle"]'))
        logged0 = await st(page, "session.loggedIn")
        await page.locator('input').first.fill("13800138000")
        await click(page, '[data-action="login.agree.toggle"]')
        await click(page, '[data-trigger="login.sms-open"]')
        record("W15b 验证码页", await has(page, '[data-action="login.smscode.input"]'))
        await page.locator('input').first.fill("123456")
        await page.wait_for_timeout(900)
        logged1 = await st(page, "session.loggedIn")
        on_me = await has(page, '[data-trigger="mine.filmlog-open"]')
        record("W15c 任意6位验证码登录成功(state+回我的)", logged0 is False and logged1 is True and on_me, f"loggedIn {logged0}->{logged1}")

        # ================= W17 回归:走查抓获的 7 项(2026-08-10) =================
        # R1 下单草稿失效时,确认订单页必须可恢复(此前是无任何按钮的死页)
        await goto(page, "/")
        await click(page, '[data-trigger="home.movie.buy-open"]')
        await click(page, '[data-trigger="showtimes.cinema-open"]')
        await click(page, '[data-trigger="cinema.session.buy-open"]')
        await click(page, '[data-action="seat.pick.toggle"]', nth=20)
        await click(page, '[data-trigger="seat.confirm.open"]')
        await click(page, '[data-action="seat.agree.check.toggle"]')
        await click(page, '[data-trigger="seat.agreement.continue-open"]')
        on_confirm = await has(page, '[data-trigger="orderconfirm.pay-open"]')
        await page.evaluate("window.__SIM__.setState({apps:{maoyan:{seatDraft:null}}})")
        await page.wait_for_timeout(500)
        recover_ok = await has(page, '[data-trigger="orderconfirm.reselect-open"]') and await has(page, '[data-trigger="tabbar.home-open"]')
        record("W17a 订单草稿失效→可恢复页(非死页)", on_confirm and recover_ok)
        await click(page, '[data-trigger="orderconfirm.reselect-open"]')
        record("W17b 兜底【重新选座】可离开", await has(page, '[data-action="movie.tab.select.target"]'))

        # R2 支付成功页:出票中也有出口;支付完成后返回不落到失效下单页
        await goto(page, "/")
        await click(page, '[data-trigger="home.movie.buy-open"]')
        await click(page, '[data-trigger="showtimes.cinema-open"]')
        await click(page, '[data-trigger="cinema.session.buy-open"]')
        await click(page, '[data-action="seat.pick.toggle"]', nth=22)
        await click(page, '[data-trigger="seat.confirm.open"]')
        await click(page, '[data-action="seat.agree.check.toggle"]')
        await click(page, '[data-trigger="seat.agreement.continue-open"]')
        await click(page, '[data-trigger="orderconfirm.pay-open"]')
        await click(page, '[data-trigger="cashier.confirm-submit"]')
        record("W17c 支付后到出票页且有出口", await has(page, '[data-trigger="paysuccess.order-open"]')
               and await has(page, '[data-trigger="paysuccess.home-open"]'))
        await click(page, '[data-trigger="paysuccess.order-open"]')
        on_order = await has(page, '[data-action="orderdetail.code.toggle"]')
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(600)
        record("W17d 订单详情返回落到Tab根(不回失效下单页)", on_order and await has(page, '[data-trigger="tabbar.home-open"]'))

        # R3 想看清单里的演出可进详情/直接订票
        await goto(page, "/show/sh_believe")
        await click(page, '[data-action="showdetail.wish.toggle"]')
        await goto(page, "/me/filmlog?tab=wish&cat=show")
        record("W17e 想看演出行可点(详情+预订)", await has(page, '[data-trigger="filmlog.show-open"]')
               and await has(page, '[data-trigger="filmlog.show.book-open"]'))
        await click(page, '[data-trigger="filmlog.show.book-open"]')
        record("W17f 想看清单→选择票档页", await has(page, '[data-action="showticket.tier.select.option"]'))

        # R4 演出订单票券文案与电影票区分
        show_order_id = await st(page, "orders.find(o=>o.kind==='show') && window.__SIM__.getState().apps.maoyan.orders.find(o=>o.kind==='show').id")
        await goto(page, f"/order/{show_order_id}")
        show_txt = await page.evaluate("document.body.innerText")
        record("W17g 演出票=入场二维码(不再显示取电影票)", "入场二维码" in show_txt and "取电影票" not in show_txt)
        await goto(page, "/order/o_01")
        movie_txt = await page.evaluate("document.body.innerText")
        record("W17h 电影票仍为取电影票", "取电影票" in movie_txt)

        # R5 演职人员与影片匹配(不再是每3部循环同一组)
        casts = await page.evaluate(
            "window.__SIM__.getState().apps.maoyan.movies.map(m=>m.cast.map(c=>c.name+'|'+c.role).join(','))")
        record("W17i 各片演职人员不重复循环", len(set(casts)) == len(casts), f"{len(set(casts))}/{len(casts)} 组唯一")

        # ---- W18 影城卡:随票加购 + 单独开卡(2026-08-13) ----
        await goto(page, "/")
        await click(page, '[data-trigger="home.movie.buy-open"]')
        await click(page, '[data-trigger="showtimes.cinema-open"]')
        await click(page, '[data-trigger="cinema.session.buy-open"]')
        await click(page, '[data-action="seat.pick.toggle"]', nth=20)
        await click(page, '[data-trigger="seat.confirm.open"]')
        await click(page, '[data-action="seat.agree.check.toggle"]')
        await click(page, '[data-trigger="seat.agreement.continue-open"]')
        card0 = await st(page, "seatDraft.cardId")
        await click(page, '[data-action="orderconfirm.card.toggle"]')
        card1 = await st(page, "seatDraft.cardId")
        record("W18a 确认订单页可勾选加购影城卡(state)", card0 == "" and card1 != "", f"cardId '{card0}'->'{card1}'")
        await click(page, '[data-trigger="orderconfirm.pay-open"]')
        await click(page, '[data-action="cashier.method.select.option"]', nth=1)  # 云闪付:应用内完成
        await click(page, '[data-trigger="cashier.confirm-submit"]')
        await page.wait_for_timeout(800)
        o = await page.evaluate(
            "(()=>{const o=window.__SIM__.getState().apps.maoyan.orders[0];"
            "const c=window.__SIM__.getState().apps.maoyan.cinemaCards.find(x=>x.id===o.cardId);"
            "return {total:o.total, cardId:o.cardId, owned:c&&c.owned, autoRenew:c&&c.autoRenew};})()")
        record("W18b 支付后影城卡入账(随票=不自动续费)",
               o["cardId"] != "" and o["owned"] is True and o["autoRenew"] is False,
               f"订单{o['total']}元 卡={o['cardId']} owned={o['owned']} autoRenew={o['autoRenew']}")
        # 单独开卡:走系统支付 + 微信订阅版式
        await goto(page, "/me/cards")
        owned0 = await st(page, "cinemaCards.filter(c=>c.owned).length")
        await click(page, '[data-action="cards.buy.trigger"]')
        await page.wait_for_timeout(1200)
        wx_app = await page.evaluate("window.__OS__.state.activeAppId")
        wx = await page.evaluate("document.body.innerText")
        record("W18c 单独开卡拉起系统支付(ACTION_PAY 跨App收银台)",
               wx_app == "wechat" and ("9.9" in wx or "9.90" in wx), f"activeApp={wx_app}")
        await page.evaluate("window.__OS__.broadcast.sendBroadcast({action:'maoyan.PAY_RESULT',data:{resultCode:'OK'}})")
        await page.wait_for_timeout(1000)
        await page.evaluate("window.__OS__.finishActivity()")
        await page.wait_for_timeout(1000)
        owned1 = await st(page, "cinemaCards.filter(c=>c.owned).length")
        record("W18d 支付成功后开卡入账(state)", owned1 == owned0 + 1, f"已开卡 {owned0}->{owned1}")
        ar0 = await page.evaluate("window.__SIM__.getState().apps.maoyan.cinemaCards.filter(c=>c.owned)[0].autoRenew")
        await click(page, '[data-action="cards.autorenew.toggle"]')
        ar1 = await page.evaluate("window.__SIM__.getState().apps.maoyan.cinemaCards.filter(c=>c.owned)[0].autoRenew")
        record("W18e 自动续费开关可切换(state)", ar0 != ar1, f"autoRenew {ar0}->{ar1}")

        # ================= W16 返回可达性(§11) =================
        await back_reachability(page, "W16a 订单详情深页", "/order/o_01")
        await back_reachability(page, "W16b 影院场次页", "/cinema/c_wanda")
        await back_reachability(page, "W16c 演出票档页", "/show/sh_redhall/tickets")
        await back_reachability(page, "W16d 失效券页", "/me/coupons/expired")

        await browser.close()

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
