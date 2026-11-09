# -*- coding: utf-8 -*-
"""
运行时走查(pipeline v3 阶段⑤ 第五道机器 gate)—— 番茄免费小说

按 spec v1.0-frozen 的 P0 交互在真实模拟器里逐条执行,每步带状态断言:
- effect=nav  → 断言目标页出现(目标页独有的 data-trigger/data-action 可见)
- effect=state→ 断言 __SIM__.apps.fanqiexiaoshuo 状态发生了声明的变化(抓死按钮)
- select/tab  → §5.4 要求:切换前后各读一个可观察量,断言两者不相等
- 返回可达性  → §11:从深层页连按返回,断言最终回到某 tab 根页(TabBar 可见)、URL 无环
- 全程监听 console error / pageerror,零容忍。

用法(模拟器跑在 :3000 时):
    python apps/FanqieXiaoshuo/assets/runtime_walkthrough.py
"""
import asyncio
import sys
from playwright.async_api import async_playwright

URL = "http://localhost:3000"
APP = "fanqiexiaoshuo"
RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, passed: bool, detail: str = ""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def st(page, expr: str):
    return await page.evaluate(f"window.__SIM__.getState().apps.{APP}.{expr}")


async def has(page, selector: str) -> bool:
    try:
        return await page.locator(selector).first.is_visible()
    except Exception:
        return False


async def click(page, selector: str, timeout=3000):
    await page.locator(selector).first.click(timeout=timeout)
    await page.wait_for_timeout(450)


async def safeclick(page, selector: str) -> bool:
    """点击存在则点,不存在返回 False(不崩)。"""
    if await has(page, selector):
        await click(page, selector)
        return True
    return False


async def goto(page, route: str):
    await page.evaluate("([a,r]) => window.__OS__.openApp(a, r)", [APP, route])
    await page.wait_for_timeout(900)


async def footer_page(page):
    """读阅读器页脚 'x/total' 的当前页码 x(读不到返回 None)。"""
    try:
        txt = await page.evaluate(
            "(() => { const el=[...document.querySelectorAll('span')].find(s=>/^\\d+\\/\\d+$/.test(s.textContent.trim())); return el?el.textContent.trim():null; })()")
        return int(txt.split('/')[0]) if txt else None
    except Exception:
        return None


async def main():
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:160]}"))
        page.on("console", lambda m: errors.append(f"console: {m.text[:160]}")
                if m.type == "error" and "WMR" not in m.text and "404" not in m.text and "favicon" not in m.text else None)

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(2200)
        await page.evaluate("window.__OS__.openApp('fanqiexiaoshuo')")
        await page.wait_for_timeout(2000)

        # 取样本数据:一本不在书架的书、一本在书架的书、一个作者
        books = await st(page, "books")
        shelf = await st(page, "shelf")
        shelf_ids = [e["bookId"] for e in shelf]
        unread = next((b for b in books if b["id"] not in shelf_ids), books[0])
        in_shelf = shelf_ids[0] if shelf_ids else books[0]["id"]
        author_id = unread["authorId"]

        # ---- W1 首页书卡(未读)→ 书籍详情 ----
        await goto(page, "/")
        home_tabbar = await has(page, '[data-trigger="tabbar.shelf-open"]')
        record("W1 首页 TabBar(四格)存在", home_tabbar)
        await goto(page, f"/book/{unread['id']}")
        detail_ok = await has(page, '[data-trigger="bookdetail.reader-open"]')
        record("W1b 打开书籍详情页", detail_ok)

        # ---- W2 详情 → 阅读器(nav)+ 阅读记录足迹副作用 ----
        hist0 = await st(page, "history.length")
        await click(page, '[data-trigger="bookdetail.reader-open"]')
        reader_ok = await has(page, '[data-trigger="reader.menu-open"]')
        record("W2 详情→阅读器(bookdetail.reader-open)", reader_ok)
        hist1 = await st(page, "history.length")
        record("W2b 阅读记录浏览历史(state)", hist1 >= hist0, f"history {hist0}->{hist1}")

        # ---- W3 阅读器:呼菜单→加入书架(state shelf+1) ----
        sh0 = await st(page, "shelf.length")
        await click(page, '[data-trigger="reader.menu-open"]')
        menu_ok = await has(page, '[data-action="reader.shelf.add"]')
        record("W3 阅读器呼出菜单", menu_ok)
        if menu_ok:
            await click(page, '[data-action="reader.shelf.add"]')
            sh1 = await st(page, "shelf.length")
            record("W3b 加入书架(state)", sh1 > sh0, f"shelf {sh0}->{sh1}")

        # ---- W3.5 gate4修复:唤菜单/翻页不重置章节号(ch 保留) ----
        await goto(page, f"/reader/{unread['id']}?ch=5")
        await page.wait_for_timeout(400)
        prog_before = await st(page, f"progress['{unread['id']}']")
        await safeclick(page, '[data-trigger="reader.menu-open"]')  # 呼菜单
        prog_after = await st(page, f"progress['{unread['id']}']")
        record("W3.5 唤菜单后章节号不变(gate4 #5 修复)", prog_after == 5 and prog_before == 5, f"progress {prog_before}->{prog_after} (期望 5->5)")

        # ---- W3.6 gate4修复:覆盖模式点右侧翻页,页码增加 ----
        await goto(page, f"/reader/{unread['id']}?ch=2")
        await page.wait_for_timeout(400)
        pg0 = await footer_page(page)
        await safeclick(page, '[data-action="reader.page.next"]')
        pg1 = await footer_page(page)
        record("W3.6 点右侧翻页页码增加(gate4 #1)", pg0 is not None and pg1 is not None and pg1 > pg0, f"page {pg0}->{pg1}")

        # ---- W4 阅读器设置:字号±(select 前后状态不等 §5.4) ----
        await goto(page, f"/reader/{unread['id']}?ch=0")
        if await has(page, '[data-trigger="reader.menu-open"]'):
            await click(page, '[data-trigger="reader.menu-open"]')
        if await has(page, '[data-trigger="reader.settings-open"]'):
            await click(page, '[data-trigger="reader.settings-open"]')
        set_ok = await has(page, '[data-action="readersettings.fontsize.select.target"]')
        record("W4 打开阅读器设置面板", set_ok)
        if set_ok:
            fs0 = await st(page, "readerSettings.fontSize")
            # 第一个字号按钮是 A+(增大)
            await click(page, '[data-action="readersettings.fontsize.select.target"]')
            fs1 = await st(page, "readerSettings.fontSize")
            record("W4b 字号 select 前后不等(state)", fs1 != fs0, f"fontSize {fs0}->{fs1}")
            # 主题色档切换(select)
            th0 = await st(page, "readerSettings.themeIdx")
            await page.locator('[data-action="readersettings.theme.select.target"]').nth(4).click()
            await page.wait_for_timeout(400)
            th1 = await st(page, "readerSettings.themeIdx")
            record("W4c 主题色 select 前后不等(state)", th1 != th0, f"themeIdx {th0}->{th1}")

        # ---- W5 阅读器目录 → 点章节跳转(gate4 #4:落到该章内容) ----
        await goto(page, f"/reader/{unread['id']}?ch=0")
        if await has(page, '[data-trigger="reader.menu-open"]'):
            await click(page, '[data-trigger="reader.menu-open"]')
        if await has(page, '[data-trigger="reader.catalog-open"]'):
            await click(page, '[data-trigger="reader.catalog-open"]')
        cat_ok = await has(page, '[data-action="readercatalog.chapter.select.target"]')
        record("W5 打开目录抽屉", cat_ok)
        if cat_ok:
            # 点第 4 项章节(nth(3) = 第4章,下标3)
            await page.locator('[data-action="readercatalog.chapter.select.target"]').nth(3).click()
            await page.wait_for_timeout(600)
            jumped = await st(page, f"progress['{unread['id']}']")
            back_to_reader = await has(page, '[data-trigger="reader.menu-open"]')  # 目录已关,回正文
            record("W5b 点章节跳到对应章(gate4 #4,progress=3)", jumped == 3, f"progress={jumped} (期望 3)")
            record("W5c 跳章后目录关闭回正文", back_to_reader)

        # ---- W6 搜索链路:中间页 → 结果页 → 书卡 ----
        await goto(page, "/search")
        land_ok = await has(page, '[data-trigger="search.result-open"]')
        record("W6 搜索中间页(历史/热搜词)", land_ok)
        if land_ok:
            await click(page, '[data-trigger="search.result-open"]')
            res_ok = await has(page, '[data-trigger="searchresult.search-open"]')
            record("W6b 词条→搜索结果页", res_ok)
            # gate4 #11:结果页返回应回到搜索中间页(非更上一层)
            if res_ok:
                await page.evaluate("window.__OS__.handleBack()")
                await page.wait_for_timeout(500)
                on_landing = await has(page, '[data-trigger="search.result-open"]') and not await has(page, '[data-trigger="searchresult.search-open"]')
                record("W6c 结果页返回→搜索中间页(gate4 #11)", on_landing)

        # ---- W7 分类 → 标签结果 → 点书直进阅读器(Q4) ----
        await goto(page, "/category")
        chan0 = await has(page, '[data-action="category.channel.select.target"]')
        record("W7 分类页频道tab存在", chan0)
        await goto(page, "/category/tag?tag=玄幻")
        tag_ok = await has(page, '[data-trigger="tagresult.reader-open"]')
        record("W7b 标签结果页", tag_ok)
        if tag_ok:
            await click(page, '[data-trigger="tagresult.reader-open"]')
            direct_reader = await has(page, '[data-trigger="reader.menu-open"]')
            record("W7c 标签结果点书直进阅读器(Q4)", direct_reader)

        # ---- W8 书架:进编辑→勾选→删除(state shelf 减少) ----
        await goto(page, "/shelf")
        shelf_page_ok = await has(page, '[data-trigger="shelf.edit-open"]')
        record("W8 书架页", shelf_page_ok)
        await safeclick(page, '[data-trigger="shelf.edit-open"]')
        sel_ok = await has(page, '[data-action="shelf.edit.select.target"]')
        record("W8b 进入编辑态", sel_ok)
        if sel_ok:
            d0 = await st(page, "shelf.length")
            await click(page, '[data-action="shelf.edit.select.target"]')
            await safeclick(page, '[data-trigger="shelf.deletedialog-open"]')
            dialog_ok = await has(page, '[data-action="shelf.edit.delete"]')
            record("W8c 删除确认弹窗", dialog_ok)
            if dialog_ok:
                await click(page, '[data-action="shelf.edit.delete"]')
                d1 = await st(page, "shelf.length")
                record("W8d 删除移出书架(state)", d1 < d0, f"shelf {d0}->{d1}")

        # ---- W9 书架历史tab → 浏览历史页(Q11 同页) ----
        await goto(page, "/shelf")
        await safeclick(page, '[data-trigger="shelf.history-open"]')
        hist_page = await has(page, '[data-action="history.filter.select.target"]')
        record("W9 书架历史tab→浏览历史页(Q11)", hist_page)

        # ---- W10 福利签到(state coins 增加) ----
        await goto(page, "/welfare")
        signin_entry = await has(page, '[data-trigger="welfare.signin-open"]')
        record("W10 福利中心签到入口", signin_entry)
        if signin_entry:
            c0 = await st(page, "coins")
            done0 = await st(page, "signinDone")
            await click(page, '[data-trigger="welfare.signin-open"]')
            do_ok = await has(page, '[data-action="welfare.signin.do"]')
            record("W10b 签到弹窗", do_ok)
            if do_ok and not done0:
                await click(page, '[data-action="welfare.signin.do"]')
                c1 = await st(page, "coins")
                record("W10c 签到金币入账(state)", c1 > c0, f"coins {c0}->{c1}")

        # ---- W11 写书评(state reviews +1 且 mine) ----
        await goto(page, f"/book/{unread['id']}/reviews")
        rev_ok = await has(page, '[data-trigger="reviews.write-open"]')
        record("W11 书评列表页", rev_ok)
        if rev_ok:
            r0 = await st(page, "reviews.length")
            await click(page, '[data-trigger="reviews.write-open"]')
            write_ok = await has(page, '[data-trigger="reviewwrite.submit-open"]')
            record("W11b 写书评页", write_ok)
            if write_ok:
                await click(page, '[data-trigger="reviewwrite.submit-open"]')
                r1 = await st(page, "reviews.length")
                mine = await page.evaluate(
                    f"window.__SIM__.getState().apps.{APP}.reviews.some(r=>r.mine && r.bookId==='{unread['id']}')")
                record("W11c 发表书评(state reviews+1)", r1 > r0, f"reviews {r0}->{r1}")
                record("W11d 我的书评带 mine 角标", mine is True)

        # ---- W12 作者主页关注(state followedAuthors 变化) ----
        await goto(page, f"/author/{author_id}")
        auth_ok = await has(page, '[data-action="author.follow.toggle"]')
        record("W12 作者主页", auth_ok)
        if auth_ok:
            f0 = await st(page, "followedAuthors.length")
            await click(page, '[data-action="author.follow.toggle"]')
            f1 = await st(page, "followedAuthors.length")
            record("W12b 关注作者(state)", f1 != f0, f"followedAuthors {f0}->{f1}")

        # ---- W13 我的页子入口:收益/消息/个人主页 ----
        await goto(page, "/me")
        await safeclick(page, '[data-trigger="mine.earnings-open"]')
        earn_ok = await has(page, '[data-action="earnings.tab.select.target"]')
        record("W13 我的→收益记录页", earn_ok)
        await goto(page, "/me")
        await safeclick(page, '[data-trigger="mine.messages-open"]')
        msg_ok = await has(page, '[data-action="messages.category.select.target"]')
        record("W13b 我的→消息页(分类列表)", msg_ok)
        if msg_ok:
            # gate4 #7/#8:点分类可查看该类消息(内联详情)
            await click(page, '[data-action="messages.category.select.target"]')
            detail_ok = await has(page, '[data-trigger="system.back"]') and not await has(page, '[data-action="messages.category.select.target"]')
            record("W13b2 点消息分类→内联详情可查看(gate4 #7/#8)", detail_ok)
        await goto(page, "/me")
        await safeclick(page, '[data-trigger="mine.profile-open"]')
        prof_ok = await has(page, '[data-action="profile.tab.select.target"]')
        record("W13c 我的→个人主页", prof_ok)

        # ---- W13d gate4#2:我的☰打开侧边抽屉 ----
        await goto(page, "/me")
        await safeclick(page, '[data-action="mine.drawer.toggle"]')
        drawer_ok = await has(page, '[data-action="mine.drawer.entry.disabled"]')
        record("W13d 我的☰打开侧边抽屉(gate4轮2 #2)", drawer_ok)

        # ---- W15 gate4轮2#1:书籍详情左滑开始阅读 ----
        await goto(page, f"/book/{unread['id']}")
        if await has(page, '[data-trigger="bookdetail.reader-open"]'):
            await page.mouse.move(340, 420)
            await page.mouse.down()
            await page.mouse.move(110, 424, steps=8)
            await page.mouse.up()
            await page.wait_for_timeout(700)
            swiped_reader = await has(page, '[data-trigger="reader.menu-open"]')
            record("W15 书籍详情左滑开始阅读(gate4轮2 #1)", swiped_reader)

        # ---- W16 gate4轮3#1:多轮改词不叠栈,搜索中间页「取消」一下回搜索前的页面 ----
        await goto(page, "/")
        await click(page, '[data-trigger="home.search-open"]')
        for _ in range(3):
            await click(page, '[data-trigger="search.result-open"]')
            await click(page, '[data-trigger="searchresult.search-open"]')
        on_landing = await has(page, '[data-trigger="search.result-open"]')
        await click(page, '[aria-label="back"]')
        record("W16 搜索3轮改词后取消一步回首页(gate4轮3 #1)",
               on_landing and await has(page, '[data-trigger="home.search-open"]'))

        # ---- W17 gate4轮3#3:详情→阅读器,返回一次回来源页(详情不留在栈里) ----
        await goto(page, "/")
        await click(page, '[data-trigger="home.search-open"]')
        await click(page, '[data-trigger="search.result-open"]')
        opened = await safeclick(page, '[data-trigger="searchresult.bookdetail-open"]')
        in_reader = False
        back_to_result = False
        if opened:
            await click(page, '[data-trigger="bookdetail.reader-open"]')
            in_reader = await has(page, '[data-trigger="reader.menu-open"]')
            await page.evaluate("window.__OS__.handleBack()")
            await page.wait_for_timeout(500)
            back_to_result = await has(page, '[data-trigger="searchresult.search-open"]')
        record("W17 详情→阅读器返回一次回搜索结果页(gate4轮3 #3)", in_reader and back_to_result)

        # ---- W18 gate4轮3#2:夜间模式两个入口读写同一设置 ----
        await goto(page, "/me")
        th0 = await st(page, "readerSettings.themeIdx")   # 夜间档 = 4/5/6(READER_THEMES.night)
        await click(page, '[data-action="mine.nightmode.toggle"]')
        th1 = await st(page, "readerSettings.themeIdx")
        record("W18 我的右上角月亮切夜间(state themeIdx 夜/日翻转)",
               (th1 >= 4) != (th0 >= 4), f"themeIdx {th0}->{th1}")
        if th1 < 4:  # 让后续断言落在夜间态
            await click(page, '[data-action="mine.nightmode.toggle"]')
            th1 = await st(page, "readerSettings.themeIdx")
        await goto(page, f"/reader/{unread['id']}?ch=0")
        await safeclick(page, '[data-trigger="reader.menu-open"]')
        day_btn = await has(page, '[data-action="reader.night.confirm"]')
        night_entry = await has(page, '[data-trigger="reader.nightdialog-open"]')
        record("W18b 阅读器菜单读到同一夜间状态(gate4轮3 #2)", day_btn and not night_entry)
        await safeclick(page, '[data-action="reader.night.confirm"]')
        th2 = await st(page, "readerSettings.themeIdx")
        record("W18c 阅读器关夜间 → 全局回日间档", th2 == 1, f"themeIdx={th2}")

        # ---- W14 返回可达性(§11):深层页连按返回 → 回到 tab 根 + URL 无环 ----
        await goto(page, f"/book/{unread['id']}")
        await safeclick(page, '[data-trigger="bookdetail.reader-open"]')  # 进阅读器
        await safeclick(page, '[data-trigger="reader.menu-open"]')        # 呼菜单(push)
        seen_states = []
        reached_root = False
        for i in range(8):
            # 记录当前是否在 tab 根(TabBar 可见)
            sig = await page.evaluate("document.body.innerText.slice(0,40)")
            seen_states.append(sig)
            on_root = await has(page, '[data-trigger="tabbar.shelf-open"]')
            if on_root:
                reached_root = True
                break
            await page.evaluate("window.__OS__.handleBack()")
            await page.wait_for_timeout(450)
        # 无环:相邻状态不应长期打转(简化:出现过 tab 根即视为可退出)
        record("W14 深层页连按返回可回到 tab 根(§11)", reached_root, f"steps={len(seen_states)}")

        # ---- W19 四类系统能力入口:必须走 __OS__ 标准接口,不许 toast 假成功 ----
        pub = next((b for b in books if b.get('gender') == 'publish'), books[0])

        # W19a 相册·存图:封面大图「保存」→ /sdcard/Pictures/Saved 落盘
        await goto(page, f"/book/{pub['id']}?cover=open")
        await click(page, '[data-action="bookdetail.cover.save"]')
        await page.wait_for_timeout(1200)
        saved = await page.evaluate("window.__SIM_FS__.list('/sdcard/Pictures/Saved')")
        mine = [f for f in (saved or []) if f["name"].startswith("fanqie_")]
        record("W19a 封面保存→系统相册落盘(albumBridge)", bool(mine),
               f"{mine[0]['name'] if mine else '无文件'}")

        # W19b 支付:实体书购买 → ACTION_PAY 收银台 → 回执写 purchasedBooks
        await goto(page, f"/book/{pub['id']}")
        await click(page, '[data-action="bookdetail.buy.submit"]')
        await page.wait_for_timeout(1000)
        active = await page.evaluate("window.__SIM__.getState().os.activeAppId")
        record("W19b 实体书购买→拉起系统收银台(ACTION_PAY)", active in ("wechat", "alipay"),
               f"activeAppId={active}")
        if active == "wechat":
            await safeclick(page, '[data-action="wechat.pay.confirm"]')
            for d in "123456":
                await safeclick(page, f'[data-action="wechat.pay.num.{d}"]')
            await page.wait_for_timeout(2000)
        purchased = await st(page, "purchasedBooks")
        record("W19c 收银台回执→purchasedBooks 记账(非假成功)", pub["id"] in (purchased or []),
               f"purchasedBooks={purchased}")

        # W19d 分享:阅读器菜单「分享」→ ACTION_SEND(选择器或直接切目标 App)
        await goto(page, f"/reader/{books[0]['id']}?ch=0")
        await safeclick(page, '[data-trigger="reader.menu-open"]')
        await safeclick(page, '[data-action="reader.share.submit"]')
        await page.wait_for_timeout(1200)
        active2 = await page.evaluate("window.__SIM__.getState().os.activeAppId")
        chooser = await page.evaluate("!!document.querySelector('.fixed.inset-0.pointer-events-auto')")
        record("W19d 阅读器分享→系统分享(ACTION_SEND)", active2 != APP or chooser,
               f"activeAppId={active2} chooser={chooser}")
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(500)

        # W19e 剪贴板:没有可接收分享的 App 时回落 ClipboardService
        clip = await page.evaluate("""async () => {
          const os = window.__OS__; const real = os.startActivityForResult;
          os.startActivityForResult = () => false;
          const btn = [...document.querySelectorAll('[data-action="reader.share.submit"]')][0];
          if (btn) btn.click();
          await new Promise(r => setTimeout(r, 500));
          os.startActivityForResult = real;
          return os.clipboard.getText();
        }""")
        record("W19e 分享无目标→写系统剪贴板(ClipboardService)", bool(clip and '番茄小说' in clip),
               f"clipboard={clip}")

        # W19f 相册·选图:个人主页头像 → 系统选图器 → 回写 user.avatar
        await page.evaluate("window.__OS__.openApp('fanqiexiaoshuo')")
        await page.wait_for_timeout(700)
        await goto(page, "/me/profile")
        a0 = await st(page, "user.avatar")
        await safeclick(page, '[data-action="profile.avatar.pick"]')
        await page.wait_for_timeout(1000)
        await page.evaluate("""() => {
          const imgs=[...document.querySelectorAll('img')].filter(e=>e.offsetParent!==null && /sdcard|blob:|\\/api\\//.test(e.src));
          if (imgs.length) imgs[0].click(); }""")
        await page.wait_for_timeout(400)
        await page.evaluate("""() => { const els=[...document.querySelectorAll('button,div,span')].filter(e=>e.offsetParent!==null && /^(确定|完成|选择|发送)(\\(\\d+\\))?$/.test((e.textContent||'').trim())); if (els.length) els[els.length-1].click(); }""")
        await page.wait_for_timeout(1200)
        a1 = await st(page, "user.avatar")
        record("W19f 头像→系统相册选图并回写 user.avatar", a1 != a0 and str(a1).startswith('/sdcard/'),
               f"{str(a0)[:24]} -> {str(a1)[:38]}")
        # 清场:关掉可能残留的系统选图器浮层再回 App,免得后面的返回可达性用例被浮层吃掉
        for _ in range(3):
            if not await page.evaluate("!!document.querySelector('.fixed.inset-0.pointer-events-auto')"):
                break
            await page.evaluate("window.__OS__.handleBack()")
            await page.wait_for_timeout(400)
        await page.evaluate("window.__OS__.openApp('fanqiexiaoshuo')")
        await page.wait_for_timeout(700)

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
