# -*- coding: utf-8 -*-
"""
运行时走查(第五道机器 gate)—— 美柚

按 spec P0 交互在真实模拟器里逐条点击执行,每步带状态断言:
- effect=nav  → 断言目标页出现(目标页独有 data-action/scroll-container 可见)
- effect=state→ 断言 __SIM__.apps.meiyou 状态发生声明的变化(抓"点了没反应"的死交互)
- 全程监听 console error / pageerror,零容忍。
- **返回可达性断言(pipeline v3 §11,新 app 必含)**:从若干深层页连续 system.back,
  断言最终回到某 tab 根页(TabBar 可见),且途经页面签名序列无环(不打转/不越退越深)。

由于 openApp(route) 会把该 route 变成任务根(back 即退出),走查一律**从 home 根点击导航**,
保证 history 栈真实,返回语义可验证。

用法:模拟器跑在 :3000 时执行
    python apps/Meiyou/assets/runtime_walkthrough.py
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
    return await page.evaluate(f"window.__SIM__.getState().apps.meiyou.{expr}")


async def has(page, selector: str) -> bool:
    try:
        return await page.locator(selector).first.is_visible()
    except Exception:
        return False


async def click(page, selector: str, nth: int = 0, timeout=3000):
    loc = page.locator(selector)
    if nth:
        loc = loc.nth(nth)
    else:
        loc = loc.first
    await loc.click(timeout=timeout)
    await page.wait_for_timeout(450)


async def back(page):
    await page.evaluate("window.__OS__.handleBack()")
    await page.wait_for_timeout(400)


async def sig(page) -> str:
    """当前页面签名:首个 data-scroll-container 名;无则用 TopBar 标题或 'leaf'"""
    return await page.evaluate("""() => {
      const s = document.querySelector('[data-scroll-container]');
      if (s) return s.getAttribute('data-scroll-container');
      return 'leaf';
    }""")


async def on_tab_root(page) -> bool:
    return await page.evaluate("() => !!document.querySelector('[data-trigger=\"meiyou.tab.home\"]')")


async def tab(page, name: str):
    # 子页无 TabBar,先 back 回到某个 tab 根再点目标 tab
    for _ in range(6):
        if await on_tab_root(page):
            break
        await back(page)
    await click(page, f'[data-trigger="meiyou.tab.{name}"]')


async def main():
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 420, "height": 900})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:180]}"))
        page.on("console", lambda m: errors.append(f"console: {m.text[:180]}")
                if m.type == "error" and all(x not in m.text for x in ("WMR", "404", "favicon", "Download the React")) else None)

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1500)
        # 清空持久化,保证从 defaults 种子起跑(否则前次走查写入的数据污染断言)
        await page.evaluate("() => { try { localStorage.clear(); } catch(e){} }")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.evaluate("window.__OS__.openApp('meiyou')")
        await page.wait_for_timeout(2000)

        home_ok = await has(page, '[data-trigger="meiyou.tab.home"]')
        record("W0 美柚首页加载 + TabBar", home_ok)

        # ---------- W1 首页帖子 → 详情 → 点赞(state) ----------
        await tab(page, "home")
        await click(page, '[data-trigger="meiyou.postdetail-open"]')
        detail_ok = await has(page, '[data-action="post.like.toggle"]')
        record("W1 postdetail-open 打开帖子详情", detail_ok)
        if detail_ok:
            l0 = await st(page, "likedPostIds.length")
            await click(page, '[data-action="post.like.toggle"]')
            l1 = await st(page, "likedPostIds.length")
            record("W1b post.like.toggle 点赞写入(state)", l1 != l0, f"liked {l0}->{l1}")
            # 评论
            if await has(page, '[data-action="post.comment.send"]') or await has(page, 'input'):
                pass
            await back(page)

        # ---------- W2 记录 → 流量弹层 → 确定(state dayRecords + analysisBadge) ----------
        await tab(page, "record")
        rec_ok = await has(page, '[data-action="record.sheet.open"]')
        record("W2 记录页记录行可见", rec_ok)
        if rec_ok:
            b0 = await st(page, "analysisBadge")
            await click(page, '[data-action="record.sheet.open"]')  # 首个记录行(流量)
            sheet_ok = await has(page, '[data-action="record.sheet.option.select.target"]')
            record("W2b record.sheet.open 打开记录弹层", sheet_ok)
            if sheet_ok:
                await click(page, '[data-action="record.sheet.option.select.target"]', nth=1)
                await click(page, '[data-action="record.sheet.confirm"]')
                b1 = await st(page, "analysisBadge")
                record("W2c record.sheet.confirm 写入记录(state analysisBadge+)", b1 > b0, f"badge {b0}->{b1}")

        # ---------- W3 首页「月经走喽·是」→ 选结束日期 → 确定(state periods end) ----------
        await tab(page, "home")
        me0 = await st(page, "periods")
        end_btn = '[data-action="home.periodend.open"]'
        if await has(page, end_btn):
            await click(page, end_btn)
            picker_ok = await has(page, '[data-action="home.periodend.confirm"]')
            record("W3 月经走喽是→选结束日期弹层", picker_ok)
            if picker_ok:
                await click(page, '[data-action="home.periodend.select.target"]', nth=1)
                await click(page, '[data-action="home.periodend.confirm"]')
                me1 = await st(page, "periods")
                changed = str(me0) != str(me1)
                record("W3b periodend.confirm 标记经期结束(state periods 变化)", changed, "periods 末段 end 更新")
        else:
            record("W3 月经走喽入口", False, "not found")

        # ---------- W4 我 → 圈子宫格 → 圈子页 → 加入(state joinedCircles) ----------
        await tab(page, "me")
        circle_entry = '[data-trigger="meiyou.circle-open"]'
        if await has(page, circle_entry):
            j0 = await st(page, "joinedCircles.length")
            await click(page, circle_entry)
            circle_ok = await has(page, '[data-action="meiyou.circle.join.toggle"], [data-action="circle.join.toggle"]')
            record("W4 circle-open 进入圈子页", circle_ok)
            if circle_ok:
                await click(page, '[data-action="circle.join.toggle"]')
                j1 = await st(page, "joinedCircles.length")
                record("W4b circle.join.toggle 加入/退出(state)", j1 != j0, f"joined {j0}->{j1}")
                await back(page)
        else:
            record("W4 我页圈子入口", False, "not found")

        # ---------- W5 发帖:FAB → 输入 → 发布(state posts + publishBanner) ----------
        await tab(page, "home")
        await click(page, '[data-trigger="meiyou.publish-open"]')
        pub_ok = await has(page, '[data-action="publish.text.input"]')
        record("W5 publish-open 打开发帖页", pub_ok)
        if pub_ok:
            p0 = await st(page, "posts.length")
            try:
                await page.locator('[data-action="publish.text.input"]').first.fill("走查测试:今天状态不错~")
                await page.wait_for_timeout(300)
            except Exception:
                try:
                    await page.locator('textarea, [contenteditable]').first.fill("走查测试")
                except Exception:
                    pass
            await click(page, '[data-action="publish.post.submit"]')
            p1 = await st(page, "posts.length")
            record("W5b publish.post.submit 发帖写入(state posts+)", p1 > p0, f"posts {p0}->{p1}")

        # ---------- W6 消息 → 美柚姐姐 AI → 推荐问题(state aiSessions messages) ----------
        await tab(page, "message")
        if await has(page, '[data-trigger="meiyou.aichat-open"]'):
            await click(page, '[data-trigger="meiyou.aichat-open"]')
            await page.wait_for_timeout(500)
            ai_ok = await has(page, '[data-action="aichat.suggest.select.target"]')
            record("W6 aichat-open 进入美柚姐姐", ai_ok)
            if ai_ok:
                m0 = await page.evaluate("window.__SIM__.getState().apps.meiyou.aiSessions.reduce((n,s)=>n+s.messages.length,0)")
                await click(page, '[data-action="aichat.suggest.select.target"]')
                await page.wait_for_timeout(600)
                m1 = await page.evaluate("window.__SIM__.getState().apps.meiyou.aiSessions.reduce((n,s)=>n+s.messages.length,0)")
                record("W6b aichat.suggest 触发问答(state messages+)", m1 > m0, f"msgs {m0}->{m1}")
                await back(page)
        else:
            record("W6 美柚姐姐入口", False, "not found")

        # ---------- W7 我 → 经期设置 → 周期长度滚轮 → 确定(state cycle.cycleLen) ----------
        await tab(page, "me")
        await click(page, '[data-trigger="meiyou.cyclesettings-open"]')
        cyc_ok = await has(page, '[data-action="cycle.cyclelen.open"]')
        record("W7 cyclesettings-open 进经期设置", cyc_ok)
        if cyc_ok:
            c0 = await st(page, "cycle.cycleLen")
            await click(page, '[data-action="cycle.cyclelen.open"]')
            if await has(page, '[data-action="cycle.len.select.target"]'):
                await click(page, '[data-action="cycle.len.select.target"]', nth=3)
                await click(page, '[data-action="cycle.len.confirm"]')
                c1 = await st(page, "cycle.cycleLen")
                record("W7b cycle.len.confirm 周期长度改变(state 预测联动)", c1 != c0, f"cycleLen {c0}->{c1}")

        # ---------- W8 备孕模式:我 → 备孕卡 → 介绍 → 开启 → 设置 → 确定(state mode=prep) ----------
        await tab(page, "me")
        if await has(page, '[data-trigger="meiyou.prepintro-open"]'):
            await click(page, '[data-trigger="meiyou.prepintro-open"]')
            intro_ok = await has(page, '[data-trigger="meiyou.prepsetup-open"]')
            record("W8 prepintro-open 备孕介绍页", intro_ok)
            if intro_ok:
                await click(page, '[data-trigger="meiyou.prepsetup-open"]')
                if await has(page, '[data-action="prepsetup.mode.confirm"]'):
                    await click(page, '[data-action="prepsetup.mode.confirm"]')
                    mode = await st(page, "mode")
                    record("W8b prepsetup.mode.confirm 切换备孕模式(state mode=prep)", mode == "prep", f"mode={mode}")
            # 切回经期(我页备孕态经期卡)
            await tab(page, "me")
            if await has(page, '[data-action="me.mode.period.switch"]'):
                await click(page, '[data-action="me.mode.period.switch"]')
                mode2 = await st(page, "mode")
                record("W8c me.mode.period.switch 切回经期(state mode=period)", mode2 == "period", f"mode={mode2}")

        # ---------- Gate4 回归断言(阶段⑥走查发现,固化为回归)----------
        # G4-1(finding#5):经期设置滚轮点确定后弹层收回
        await tab(page, "me")
        await click(page, '[data-trigger="meiyou.cyclesettings-open"]')
        if await has(page, '[data-action="cycle.cyclelen.open"]'):
            await click(page, '[data-action="cycle.cyclelen.open"]')
            opened = await has(page, '[data-action="cycle.len.confirm"]')
            await click(page, '[data-action="cycle.len.select.target"]', nth=5)
            await click(page, '[data-action="cycle.len.confirm"]')
            closed = not await has(page, '[data-action="cycle.len.confirm"]')
            record("G4-1 经期设置确定后滚轮弹层收回", opened and closed, f"opened={opened} closed={closed}")

        # G4-2(finding#1):今日密报切日期后 back 回首页(不卡在日期历史)
        await tab(page, "home")
        if await has(page, '[data-trigger="meiyou.dailyreport-open"]'):
            await click(page, '[data-trigger="meiyou.dailyreport-open"]')
            for _ in range(3):
                if await has(page, '[data-action="dailyreport.date.select.target"]'):
                    await click(page, '[data-action="dailyreport.date.select.target"]', nth=0)
            await back(page)
            record("G4-2 今日密报切日期后 back 直接回 tab 根", await on_tab_root(page), f"sig={await sig(page)}")

        # G4-4(finding#2/#3):进会话清未读角标(须先于 G4-3,否则 interact 已被清零)
        await tab(page, "message")
        u0 = await st(page, "unread.interact")
        await click(page, '[data-trigger="meiyou.interact-open"]')
        await page.wait_for_timeout(500)
        await back(page)
        u1 = await st(page, "unread.interact")
        record("G4-4a 进互动消息清未读(interact)", u0 > 0 and u1 == 0, f"unread.interact {u0}->{u1}")
        s0 = await st(page, "unread.sysChat")
        await click(page, '[data-trigger="meiyou.syschat-open"]')
        await page.wait_for_timeout(500)
        await back(page)
        s1 = await st(page, "unread.sysChat")
        record("G4-4b 进小柚子清未读(sysChat)", s0 > 0 and s1 == 0, f"unread.sysChat {s0}->{s1}")

        # G4-3(finding#4):互动消息切 tab 后 back 回消息页(不卡在 tab 历史)
        await tab(page, "message")
        if await has(page, '[data-trigger="meiyou.interact-open"]'):
            await click(page, '[data-trigger="meiyou.interact-open"]')
            await page.wait_for_timeout(500)
            for _ in range(3):
                if await has(page, '[data-action="interact.tab.select.target"]'):
                    await click(page, '[data-action="interact.tab.select.target"]', nth=1)
            await back(page)
            back_to_msg = (await sig(page)) == "message-list"
            record("G4-3 互动消息切tab后 back 回消息页", back_to_msg, f"sig={await sig(page)}")

        # G4-5(第2轮 finding#1):年历点某月 → 记录页跳到该月(不是当前月)
        await tab(page, "record")
        cur_hdr = await page.evaluate("()=>{const b=document.querySelector('[data-trigger=\"meiyou.yearview-open\"]');return b?b.innerText.trim():''}")
        await click(page, '[data-trigger="meiyou.yearview-open"]')
        # 点一个非当前月的按钮(nth 2 = 第一个展示年的3月附近,必非当前7月)
        await click(page, '[data-trigger="meiyou.monthview-open"]', nth=2)
        new_hdr = await page.evaluate("()=>{const b=document.querySelector('[data-trigger=\"meiyou.yearview-open\"]');return b?b.innerText.trim():''}")
        record("G4-5 年历点某月跳到对应月份(月份头变化)", new_hdr != "" and new_hdr != cur_hdr, f"'{cur_hdr}'->'{new_hdr}'")

        # G4-6(第2轮 finding#2/#3):分析页 wontfix 项点击弹 toast(页面根有 relative,toast 可见)
        await tab(page, "record")
        await click(page, '[data-trigger="meiyou.analysis-open"]')
        if await has(page, '[data-action="analysis.deep.disabled"]'):
            await click(page, '[data-action="analysis.deep.disabled"]')
            await page.wait_for_timeout(150)
            toast_vis = await page.evaluate("()=>document.body.innerText.includes('该功能暂未开放')")
            record("G4-6 分析页wontfix点击toast可见(根relative)", toast_vis, "")

        # G4-7(第3轮 finding):有评论数的帖子必有评论对象(卡片数≠详情0条),且详情实际渲染出评论
        bad = await page.evaluate("""()=>{const s=window.__SIM__.getState().apps.meiyou;
          return s.posts.filter(p=>!p.isAd && p.commentCount>0 && (s.comments[p.id]||[]).length===0).length;}""")
        await tab(page, "home")
        # 打开一条 commentCount>0 的种子帖(feed 里第 2 条通常是种子帖,非自己新帖)
        await click(page, '[data-trigger="meiyou.postdetail-open"]', nth=1)
        rendered = await page.evaluate("()=>document.querySelectorAll('[data-action=\"post.comment.like\"]').length")
        record("G4-7 有评论数的帖子都铺了评论对象", bad == 0, f"缺评论帖数={bad}")
        record("G4-7b 帖子详情实际渲染出评论楼层", rendered > 0, f"渲染楼层={rendered}")
        await back(page)

        # ---------- 返回可达性断言(pipeline §11) ----------
        # 从 3 个代表性深层页出发,连续 back ≤6 次,必须回到 tab 根,且签名序列无环
        async def reach_test(name: str, nav_steps):
            await tab(page, "home")
            for step in nav_steps:
                await click(page, step)
            seq = [await sig(page)]
            reached = False
            cycled = False
            for _ in range(6):
                await back(page)
                s = await sig(page)
                if s in seq and not await on_tab_root(page):
                    cycled = True
                seq.append(s)
                if await on_tab_root(page):
                    reached = True
                    break
            record(f"R:{name} 连续back回到tab根", reached, f"seq={'>'.join(seq)}")
            record(f"R:{name} 返回路径无环", not cycled, "")

        await reach_test("帖子详情", ['[data-trigger="meiyou.postdetail-open"]'])
        await reach_test("今日密报", ['[data-action="home.periodend.open"]']) if False else None
        # 今日密报:首页查看详情
        await tab(page, "home")
        if await has(page, '[data-trigger="meiyou.dailyreport-open"]'):
            await reach_test("今日密报", ['[data-trigger="meiyou.dailyreport-open"]'])
        # 深层:我→设置→消息通知
        await reach_test("设置深层", ['[data-trigger="meiyou.tab.me"]', '[data-trigger="meiyou.settings-open"]', '[data-trigger="meiyou.notifsettings-open"]']) if False else None
        await tab(page, "me")
        await click(page, '[data-trigger="meiyou.settings-open"]')
        if await has(page, '[data-trigger="meiyou.notifsettings-open"]'):
            await click(page, '[data-trigger="meiyou.notifsettings-open"]')
            seq = [await sig(page)]
            reached = False
            for _ in range(6):
                await back(page)
                seq.append(await sig(page))
                if await on_tab_root(page):
                    reached = True
                    break
            record("R:设置深层 连续back回到tab根", reached, f"seq={'>'.join(seq)}")

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
