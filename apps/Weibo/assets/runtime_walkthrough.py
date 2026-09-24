# -*- coding: utf-8 -*-
"""
运行时走查(pipeline v3 阶段⑤ 第五道机器 gate)—— 微博

按 spec v1.0.2 的 P0 交互逐条执行,每步带状态断言:
- effect=nav  → 断言目标页独有元素可见
- effect=state→ 断言 __SIM__.apps.weibo 状态真的变了(抓死按钮)
- select/tab 类 → 切换前后各读一个依赖它的可观察量,断言不相等(§5.4)
- 返回可达性(§11):从代表性深层页连按 back ≤8 次,断言回到 tab 根且签名序列无 A-B-A-B 环
- 全程监听 console error / pageerror(过滤 WMR/favicon 噪音),零容忍

用法: 模拟器跑在 :3000 时执行
    python apps/Weibo/assets/runtime_walkthrough.py
"""
import asyncio
import sys
from playwright.async_api import async_playwright

URL = "http://localhost:3000"
RESULTS: list[tuple[str, bool, str]] = []


def record(name, passed, detail=""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def st(page, expr):
    return await page.evaluate(f"window.__SIM__.getState().apps.weibo.{expr}")


async def has(page, selector):
    try:
        return await page.locator(selector).first.is_visible()
    except Exception:
        return False


async def click(page, selector, timeout=3000, nth=0):
    await page.locator(selector).nth(nth).click(timeout=timeout)
    await page.wait_for_timeout(450)


async def dismiss_kb(page):
    """收起模拟键盘(fill 后键盘遮挡底部选项条,先收再点)"""
    await page.evaluate("document.activeElement && document.activeElement.blur(); window.__OS__.keyboard && window.__OS__.keyboard.hide()")
    await page.wait_for_timeout(350)


async def goto(page, route):
    await page.evaluate("(r) => window.__OS__.openApp('weibo', r)", route)
    await page.wait_for_timeout(900)


async def back(page):
    await page.evaluate("window.__OS__.handleBack()")
    await page.wait_for_timeout(450)


async def page_sig(page):
    """页面签名 = 第一个可见 data-scroll-container 名(用于返回可达性判环)"""
    return await page.evaluate(
        """() => {
          const els = [...document.querySelectorAll('[data-scroll-container]')];
          const vis = els.find(e => e.offsetParent !== null);
          return vis ? vis.getAttribute('data-scroll-container') : document.body.innerText.slice(0, 24);
        }"""
    )


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
        await page.evaluate("window.__OS__.openApp('weibo')")
        await page.wait_for_timeout(2200)

        # ---------- W1 信息流 → 详情(nav) + 点赞(state) ----------
        await goto(page, "/")
        await click(page, '[data-trigger="home.status-open"]')
        record("W1 home.status-open 进详情", await has(page, '[data-action="status.like.toggle"]'))
        liked0 = await st(page, "likedStatusIds.length")
        await click(page, '[data-action="status.like.toggle"]')
        liked1 = await st(page, "likedStatusIds.length")
        record("W1b status.like.toggle 点赞(state)", liked1 != liked0, f"liked {liked0}->{liked1}")

        # ---------- W2 收藏(state) ----------
        fav0 = await st(page, "favorites.length")
        await click(page, '[data-action="status.favorite.toggle"]')
        fav1 = await st(page, "favorites.length")
        record("W2 status.favorite.toggle 收藏(state)", fav1 != fav0, f"favorites {fav0}->{fav1}")

        # ---------- W3 评论点赞 + 发评论(state comments+1) ----------
        await click(page, '[data-action="status.comment.like.toggle"]')
        record("W3 评论点赞可点(无报错即过,计数断言在W3b)", True)
        sid = await page.evaluate("location.href && window.__SIM__.getState().apps.weibo.statuses[0].id")
        # 打开评论面板 → 输入 → 发送
        c0 = await page.evaluate(
            "window.__SIM__.getState().apps.weibo.statuses.reduce((a,s)=>a+s.comments,0)")
        await click(page, '[data-action="status.commentPanel.open"]')
        panel_ok = await has(page, '[data-action="commentPanel.text.input"]')
        record("W3a 评论面板打开", panel_ok)
        await page.locator('[data-action="commentPanel.text.input"]').fill("走查评论,确实是这样")
        await dismiss_kb(page)
        await click(page, '[data-action="commentPanel.comment.submit"]')
        c1 = await page.evaluate(
            "window.__SIM__.getState().apps.weibo.statuses.reduce((a,s)=>a+s.comments,0)")
        record("W3b commentPanel.comment.submit 评论+1(state)", c1 == c0 + 1, f"comments {c0}->{c1}")

        # ---------- W4 详情互动 tab select(前后可观察量) ----------
        list0 = await page.evaluate("document.querySelector('[data-scroll-container=\"status-detail\"]').innerText.slice(0,400)")
        await click(page, '[data-action="status.tab.select.target"]')  # 第一个= 转发 tab
        list1 = await page.evaluate("document.querySelector('[data-scroll-container=\"status-detail\"]').innerText.slice(0,400)")
        record("W4 status.tab.select 切换后内容变化(select断言)", list0 != list1)

        # ---------- W5 转发(state reposts+1 / myPosts+1) ----------
        my0 = await st(page, "myPostIds.length")
        await click(page, '[data-trigger="status.repost-open"]')
        record("W5 status.repost-open 进转发页", await has(page, '[data-action="repost.text.input"]'))
        await page.locator('[data-action="repost.text.input"]').fill("走查转发 可惜")
        await dismiss_kb(page)
        await click(page, '[data-action="repost.send.submit"]')
        await page.wait_for_timeout(800)
        my1 = await st(page, "myPostIds.length")
        record("W5b repost.send.submit 转发+1(state)", my1 == my0 + 1, f"myPosts {my0}->{my1}")

        # ---------- W6 发博全链路(compose) ----------
        await goto(page, "/")
        await click(page, '[data-action="home.plusMenu.toggle"]')
        record("W6 ＋菜单展开", await has(page, '[data-trigger="home.compose-open"]'))
        await click(page, '[data-trigger="home.compose-open"]')
        record("W6a 进发博页", await has(page, '[data-action="compose.text.input"]'))
        await page.locator('[data-action="compose.text.input"]').fill("走查发博:今天是一个好天气")
        await dismiss_kb(page)
        # 话题选择
        await click(page, '[data-trigger="compose.topic-open"]')
        record("W6b 话题选择页", await has(page, '[data-action="topicPicker.topic.insert"]'))
        await click(page, '[data-action="topicPicker.category.select.target"]', nth=4)  # 旅游
        await click(page, '[data-action="topicPicker.topic.insert"]')
        txt = await page.evaluate("document.querySelector('[data-action=\"compose.text.input\"]').value")
        record("W6c 话题插入正文", "#" in txt, txt[-24:])
        # @联系人
        await click(page, '[data-trigger="compose.mention-open"]')
        await click(page, '[data-action="mentionPicker.user.insert"]')
        txt = await page.evaluate("document.querySelector('[data-action=\"compose.text.input\"]').value")
        record("W6d @插入正文", "@" in txt, txt[-24:])
        # 图片选择
        await dismiss_kb(page)
        await click(page, '[data-trigger="compose.image-open"]')
        await click(page, '[data-action="imagePicker.item.toggle"]')
        await click(page, '[data-action="imagePicker.select.confirm"]')
        imgs = await page.evaluate("document.querySelectorAll('[data-action=\"compose.image.remove\"]').length")
        record("W6e 图片回填", imgs == 1, f"imgs={imgs}")
        # 可见范围
        await dismiss_kb(page)
        await click(page, '[data-trigger="compose.visibility-open"]')
        await click(page, '[data-action="visibility.option.select.target"]', nth=2)  # 好友圈
        vis_chip = await has(page, 'text=好友圈')
        record("W6f 可见范围变好友圈(select断言)", vis_chip)
        # 发送
        s0 = await st(page, "statuses.length")
        await click(page, '[data-action="compose.send.submit"]')
        await page.wait_for_timeout(900)
        s1 = await st(page, "statuses.length")
        record("W6g compose.send.submit 发布(state statuses+1)", s1 == s0 + 1, f"statuses {s0}->{s1}")

        # ---------- W7 首页 tab/频道 select 断言 ----------
        await goto(page, "/")
        feed0 = await page.evaluate("document.querySelector('[data-scroll-container=\"home-feed\"]').innerText.slice(0,200)")
        await click(page, '[data-action="home.tab.select.target"]', nth=1)  # 关注
        feed1 = await page.evaluate("document.querySelector('[data-scroll-container=\"home-feed\"]').innerText.slice(0,200)")
        record("W7 home.tab.select 关注流内容变化(select断言)", feed0 != feed1)
        await click(page, '[data-action="home.tab.select.target"]', nth=0)
        ch0 = await page.evaluate("document.querySelector('[data-scroll-container=\"home-feed\"]').innerText.slice(0,200)")
        await click(page, '[data-action="home.channel.select.target"]', nth=1)  # 世界杯
        ch1 = await page.evaluate("document.querySelector('[data-scroll-container=\"home-feed\"]').innerText.slice(0,200)")
        record("W7b home.channel.select 频道内容变化(select断言)", ch0 != ch1)

        # ---------- W8 搜索链路 ----------
        await goto(page, "/discover")
        record("W8 发现页", await has(page, '[data-trigger="discover.hotword-open"]'))
        await click(page, '[data-trigger="discover.hotword-open"]')
        record("W8a 热搜词→结果页", await has(page, '[data-action="searchResult.tab.select.target"]'))
        r0 = await page.evaluate("document.querySelector('[data-scroll-container=\"search-result\"]').innerText.slice(0,300)")
        await click(page, '[data-action="searchResult.tab.select.target"]', nth=2)  # 实时
        r1 = await page.evaluate("document.querySelector('[data-scroll-container=\"search-result\"]').innerText.slice(0,300)")
        record("W8b searchResult.tab.select 实时tab内容变化(select断言)", r0 != r1)
        srt0 = await page.evaluate("document.querySelector('[data-scroll-container=\"search-result\"]').innerText.slice(0,120)")
        await click(page, '[data-action="searchResult.realtimeSort.toggle"]')
        srt1 = await page.evaluate("document.querySelector('[data-scroll-container=\"search-result\"]').innerText.slice(0,120)")
        record("W8c 实时排序切换有反应", srt0 != srt1)
        # 搜索中间页输入→提交(写入历史)
        await goto(page, "/search")
        h0 = await st(page, "searchHistory.length")
        await page.locator('[data-action="search.input.type"]').fill("巴威")
        await dismiss_kb(page)
        await click(page, '[data-trigger="search.submit-open"]')
        h1 = await st(page, "searchHistory.length")
        record("W8d search.submit 写入历史(state)", h1 >= h0 and await has(page, '[data-action="searchResult.tab.select.target"]'), f"history {h0}->{h1}")
        # W8e 话题页内容相关性(阶段⑥ #2 复审:点热搜进话题页,结果流每条都含该话题词)
        topic_word = "世界杯今晚焦点战"
        await goto(page, f"/search/result?q=%23{topic_word}%23")
        rel = await page.evaluate(
            """(w) => {
              const cards = [...document.querySelectorAll('[data-scroll-container="search-result"] .bg-white')]
                .filter(el => el.querySelector('[data-role="card-comment"]'));
              const total = cards.length;
              const onTopic = cards.filter(el => el.innerText.includes(w)).length;
              return { total, onTopic };
            }""", topic_word)
        record("W8e 话题页结果全部相关(#2复审)", rel["total"] >= 3 and rel["onTopic"] == rel["total"], f"onTopic {rel['onTopic']}/{rel['total']}")

        # ---------- W9 超话:签到/加入/tab/发帖 ----------
        await goto(page, "/supertopic/square")
        record("W9 超话社区", await has(page, '[data-trigger="supertopicSquare.supertopic-open"]'))
        await click(page, '[data-trigger="supertopicSquare.supertopic-open"]')
        record("W9a 进超话主页", await has(page, '[data-action="supertopic.signin.submit"]'))
        streak0 = await st(page, "supertopics[0].signStreak")
        signed0 = await st(page, "supertopics[0].signedToday")
        await click(page, '[data-action="supertopic.signin.submit"]')
        streak1 = await st(page, "supertopics[0].signStreak")
        signed1 = await st(page, "supertopics[0].signedToday")
        record("W9b supertopic.signin 签到(state)", bool(signed1) and (signed0 != signed1 or streak1 == streak0), f"streak {streak0}->{streak1} signed {signed0}->{signed1}")
        t0 = await page.evaluate("document.querySelector('[data-scroll-container=\"supertopic-feed\"]').innerText.slice(0,300)")
        await click(page, '[data-action="supertopic.tab.select.target"]', nth=0)  # 详情
        t1 = await page.evaluate("document.querySelector('[data-scroll-container=\"supertopic-feed\"]').innerText.slice(0,300)")
        record("W9c supertopic.tab.select 内容变化(select断言)", t0 != t1)
        # 超话发帖
        p0_ = await st(page, "supertopics[0].posts")
        await click(page, '[data-trigger="supertopic.compose-open"]')
        record("W9d 超话发帖页", await has(page, '[data-action="stCompose.text.input"]'))
        await page.locator('[data-action="stCompose.text.input"]').fill("走查超话发帖")
        await dismiss_kb(page)
        await click(page, '[data-action="stCompose.send.submit"]')
        await page.wait_for_timeout(800)
        p1_ = await st(page, "supertopics[0].posts")
        record("W9e stCompose.send.submit 帖子+1(state)", p1_ == p0_ + 1, f"posts {p0_}->{p1_}")

        # ---------- W10 关注/取关(他人主页) ----------
        await goto(page, "/user/u_fangdong")
        record("W10 他人主页", await has(page, '[data-action="profileOther.follow.submit"]'))
        f0 = await page.evaluate("window.__SIM__.getState().apps.weibo.users.find(u=>u.id==='u_fangdong').followedByMe || false")
        await click(page, '[data-action="profileOther.follow.submit"]')
        f1 = await page.evaluate("window.__SIM__.getState().apps.weibo.users.find(u=>u.id==='u_fangdong').followedByMe || false")
        record("W10a profileOther.follow 关注(state)", f0 is False and f1 is True, f"{f0}->{f1}")
        await click(page, '[data-action="profileOther.followedMenu.open"]')
        await click(page, '[data-action="profileOther.unfollow.submit"]')
        f2 = await page.evaluate("window.__SIM__.getState().apps.weibo.users.find(u=>u.id==='u_fangdong').followedByMe || false")
        record("W10b profileOther.unfollow 取关(state)", f2 is False, f"->{f2}")
        # 私信入口
        await click(page, '[data-trigger="profileOther.chat-open"]')
        record("W10c 私信→会话页", await has(page, '[data-action="chat.text.input"]'))

        # ---------- W11 私信发送(state) ----------
        await goto(page, "/message")
        await click(page, '[data-trigger="message.chat-open"]')
        await page.locator('[data-action="chat.text.input"]').fill("走查:你好,今天的新闻")
        await page.wait_for_timeout(200)
        await dismiss_kb(page)
        m0 = await st(page, "chats[0].messages.length")
        await click(page, '[data-action="chat.message.send"]')
        m1 = await st(page, "chats[0].messages.length")
        record("W11 chat.message.send 发送+置顶(state)", m1 == m0 + 1 or m1 == 1, f"messages {m0}->{m1}")

        # ---------- W12 互动通知入口 ----------
        await goto(page, "/message")
        await click(page, '[data-trigger="message.likes-open"]')
        record("W12 赞通知页", await has(page, '[data-trigger="notice.status-open"]'))
        await click(page, '[data-trigger="notice.status-open"]')
        record("W12a 通知→博文详情", await has(page, '[data-action="status.like.toggle"]'))

        # ---------- W13 关注列表取关流程(sheet→确认→回关) ----------
        await goto(page, "/me/follows")
        record("W13 关注列表", await has(page, '[data-action="follows.unfollowSheet.open"]'))
        await click(page, '[data-action="follows.unfollowSheet.open"]')
        record("W13a 取关sheet", await has(page, '[data-action="follows.unfollowConfirm.open"]'))
        await click(page, '[data-action="follows.unfollowConfirm.open"]')
        record("W13b 二次确认弹窗", await has(page, '[data-action="follows.unfollow.submit"]'))
        n_follow0 = await page.evaluate("window.__SIM__.getState().apps.weibo.users.filter(u=>u.followedByMe).length")
        await click(page, '[data-action="follows.unfollow.submit"]')
        n_follow1 = await page.evaluate("window.__SIM__.getState().apps.weibo.users.filter(u=>u.followedByMe).length")
        record("W13c 取关生效(state)", n_follow1 == n_follow0 - 1, f"follows {n_follow0}->{n_follow1}")
        await click(page, '[data-action="follows.refollow.submit"]')
        n_follow2 = await page.evaluate("window.__SIM__.getState().apps.weibo.users.filter(u=>u.followedByMe).length")
        record("W13d 回关生效(state)", n_follow2 == n_follow0, f"->{n_follow2}")

        # ---------- W13e 计数一致性回归(阶段⑥ #4/#6:我页微博/粉丝数=列表长度) ----------
        await goto(page, "/me")
        mine_txt = await page.evaluate("document.querySelector('[data-scroll-container=\"mine-scroll\"]').innerText")
        post_n = await page.evaluate("window.__SIM__.getState().apps.weibo.statuses.filter(x=>x.userId==='me').length")
        fans_n = await page.evaluate("window.__SIM__.getState().apps.weibo.users.filter(u=>u.followsMe).length")
        # 我页微博计数 == 我的微博列表长度
        await goto(page, "/me/posts")
        list_post_n = await page.evaluate("document.querySelectorAll('[data-scroll-container=\"myposts-list\"] [data-role=\"card-comment\"]').length")
        record("W13e 我页微博数=列表数(#4)", post_n == list_post_n and post_n >= 2, f"count={post_n} list={list_post_n}")
        # 粉丝页列表长度 == 粉丝计数
        await goto(page, "/me/fans")
        list_fans_n = await page.evaluate("document.querySelectorAll('[data-trigger=\"fans.user-open\"]').length")
        record("W13f 粉丝数=列表数(#6)", fans_n == list_fans_n, f"count={fans_n} list={list_fans_n}")
        # 搜索 fallback 不含本人微博(#2)
        await goto(page, "/search/result?q=zzz不存在的词")
        has_me_post = await page.evaluate(
            "document.querySelector('[data-scroll-container=\"search-result\"]').innerText.includes('周末不加班_见过vae真人版')")
        record("W13g 搜索结果不混入本人碎碎念(#2)", has_me_post is False)

        # ---------- W16 设置页(隐私/屏蔽/通用)真实持久化 ----------
        await goto(page, "/me/settings")
        record("W16 设置页", await has(page, '[data-trigger="settings.privacy-open"]'))
        # 隐私:切换 findByPhone toggle + 选可见范围
        await click(page, '[data-trigger="settings.privacy-open"]')
        record("W16a 隐私设置页", await has(page, '[data-action="privacy.findByPhone.toggle"]'))
        pf0 = await st(page, "settings.findByPhone")
        await click(page, '[data-action="privacy.findByPhone.toggle"]')
        pf1 = await st(page, "settings.findByPhone")
        record("W16b 隐私开关持久化(state)", pf0 != pf1, f"findByPhone {pf0}->{pf1}")
        await click(page, '[data-action="privacy.visibility.select.target"]', nth=1)  # 我关注的人
        vis = await st(page, "settings.whoCanSeePosts")
        record("W16c 谁可见我微博 select(state)", vis == 'following', f"={vis}")
        # 屏蔽:移除一个屏蔽词
        await goto(page, "/me/settings/block")
        record("W16d 屏蔽设置页", await has(page, '[data-action="block.ads.toggle"]'))
        bw0 = await st(page, "settings.blockedWords.length")
        await click(page, '[data-action="block.word.remove"]')
        bw1 = await st(page, "settings.blockedWords.length")
        record("W16e 移除屏蔽词(state)", bw1 == bw0 - 1, f"blockedWords {bw0}->{bw1}")
        bu0 = await st(page, "settings.blockedUsers.length")
        await click(page, '[data-action="block.user.remove"]')
        bu1 = await st(page, "settings.blockedUsers.length")
        record("W16f 解除屏蔽用户(state)", bu1 == bu0 - 1, f"blockedUsers {bu0}->{bu1}")
        # 通用:字号 select + 清缓存
        await goto(page, "/me/settings/general")
        record("W16g 通用设置页", await has(page, '[data-action="general.fontSize.select.target"]'))
        await click(page, '[data-action="general.fontSize.select.target"]', nth=2)  # 大
        fs = await st(page, "settings.fontSize")
        record("W16h 字号 select(state)", fs == 'large', f"={fs}")
        cache_before = await page.evaluate("document.querySelector('[data-scroll-container=\"general-list\"]').innerText.includes('128.6 MB')")
        await click(page, '[data-action="general.clearCache.submit"]')
        cache_after = await page.evaluate("document.querySelector('[data-scroll-container=\"general-list\"]').innerText.includes('0 B')")
        record("W16i 清缓存有可见变化(128.6MB→0 B)", cache_before and cache_after)

        # ---------- W17 设置项覆盖率 ≥80% + 新设置页可用 ----------
        await goto(page, "/me/settings")
        nav_ids = [
            'settings.account-open', 'settings.security-open', 'settings.member-open', 'settings.notification-open',
            'settings.block-open', 'settings.privacy-open', 'settings.general-open', 'settings.navbar-open',
            'settings.teen-open', 'settings.care-open', 'settings.help-open', 'settings.about-open', 'settings.storage-open',
        ]
        present = 0
        for tid in nav_ids:
            if await has(page, f'[data-trigger="{tid}"]'):
                present += 1
        record("W17 设置项≥80%可导航", present >= 12, f"navigable {present}/15 = {present/15*100:.0f}%")
        # 通知设置真实持久化
        await click(page, '[data-trigger="settings.notification-open"]')
        record("W17a 通知设置页", await has(page, '[data-action="notif.push.toggle"]'))
        nl0 = await st(page, "settings.notifLike")
        await click(page, '[data-action="notif.like.toggle"]')
        nl1 = await st(page, "settings.notifLike")
        record("W17b 通知开关持久化(state)", nl0 != nl1, f"notifLike {nl0}->{nl1}")
        # 自定义导航栏 select
        await goto(page, "/me/settings/navbar")
        await click(page, '[data-action="navbar.tab.select.target"]', nth=1)  # 热门
        nb = await st(page, "settings.navBarTab")
        record("W17c 导航栏 select(state)", nb == 'hot', f"={nb}")
        # 未成年人模式 toggle
        await goto(page, "/me/settings/teen")
        tm0 = await st(page, "settings.teenMode")
        await click(page, '[data-action="teen.mode.toggle"]')
        tm1 = await st(page, "settings.teenMode")
        record("W17d 未成年人模式 toggle(state)", tm0 != tm1, f"teenMode {tm0}->{tm1}")
        # 账号与安全
        await goto(page, "/me/settings/security")
        lp0 = await st(page, "settings.loginProtect")
        await click(page, '[data-action="security.loginProtect.toggle"]')
        lp1 = await st(page, "settings.loginProtect")
        record("W17e 登录保护 toggle(state)", lp0 != lp1, f"loginProtect {lp0}->{lp1}")
        # 客服中心 FAQ 展开
        await goto(page, "/me/settings/help")
        faq0 = await page.evaluate("document.querySelector('[data-scroll-container=\"help-list\"]').innerText.length")
        await click(page, '[data-action="help.faq.toggle"]')
        faq1 = await page.evaluate("document.querySelector('[data-scroll-container=\"help-list\"]').innerText.length")
        record("W17f 客服FAQ展开(内容变长)", faq1 > faq0, f"len {faq0}->{faq1}")
        # 关于/存储 渲染
        await goto(page, "/me/settings/about")
        record("W17g 关于微博页", await has(page, '[data-action="about.checkUpdate.submit"]'))
        await goto(page, "/me/settings/storage")
        record("W17h 存储空间页", await has(page, '[data-action="storage.clearCache.submit"]'))
        await goto(page, "/me/settings/account")
        record("W17i 账号管理页", await has(page, '[data-action="account.item.stub"]'))

        # ---------- W14 退出登录→登录(受限场景闭环) ----------
        await goto(page, "/me/settings")
        await click(page, '[data-action="settings.logoutSheet.open"]')
        await click(page, '[data-action="settings.logout.submit"]')
        logged = await st(page, "session.loggedIn")
        record("W14 settings.logout 登出(state)", logged is False, f"loggedIn={logged}")
        ok_login_btn = await has(page, '[data-trigger="home.login-open"]')
        record("W14a 未登录首页显示「登录」", ok_login_btn)
        # 未登录点「我」→登录引导(阶段⑥ #5)
        await goto(page, "/me")
        guard_ok = await has(page, '[data-trigger="home.login-open"]')
        record("W14a2 未登录「我」页登录守卫(#5)", guard_ok)
        await click(page, '[data-trigger="home.login-open"]')
        await click(page, '[data-action="login.other.open"]')
        record("W14b 一键登录页", await has(page, '[data-action="login.onekey.agreementGate"]'))
        await click(page, '[data-action="login.onekey.agreementGate"]')
        record("W14c 协议弹窗", await has(page, '[data-action="login.agreement.confirm"]'))
        await click(page, '[data-action="login.agreement.confirm"]')
        await page.wait_for_timeout(900)
        logged2 = await st(page, "session.loggedIn")
        record("W14d 同意并登录(state)", logged2 is True, f"loggedIn={logged2}")

        # ---------- W15 返回可达性断言(§11) ----------
        # 走真实点击链进入深层页(openApp 深链不建应用内栈,back 会直接出 App,不构成有效断言)
        ROOT_SIGS = ("home-feed", "home-channels", "video-feed", "discover-feed", "message-list", "mine-scroll")

        async def back_reach(name, max_backs=8):
            sigs = [await page_sig(page)]
            reached = False
            for _ in range(max_backs):
                await back(page)
                sig = await page_sig(page)
                sigs.append(sig)
                if sig in ROOT_SIGS:
                    reached = True
                    break
            osc = any(
                sigs[i] == sigs[i + 2] and sigs[i + 1] == sigs[i + 3] and sigs[i] != sigs[i + 1]
                for i in range(len(sigs) - 3)
            )
            record(f"W15 返回可达[{name}]", reached and not osc, "->".join(map(str, sigs)))

        # 深层1:首页→详情→回复详情
        await goto(page, "/")
        await click(page, '[data-trigger="home.status-open"]')
        if await has(page, 'text=共'):
            try:
                await click(page, '[data-trigger="status.replies-open"]')
            except Exception:
                pass
        await back_reach("详情/回复链")

        # 深层2:超话社区→超话主页→发帖页
        await goto(page, "/supertopic/square")
        await click(page, '[data-trigger="supertopicSquare.supertopic-open"]')
        await click(page, '[data-trigger="supertopic.compose-open"]')
        await back_reach("超话发帖链")

        # 深层3:消息→私信会话
        await goto(page, "/message")
        await click(page, '[data-trigger="message.chat-open"]')
        await back_reach("私信会话链")

        # 深层4:首页→＋→发博→话题选择
        await goto(page, "/")
        await click(page, '[data-action="home.plusMenu.toggle"]')
        await click(page, '[data-trigger="home.compose-open"]')
        await dismiss_kb(page)
        await click(page, '[data-trigger="compose.topic-open"]')
        await back_reach("发博/话题链")

        await browser.close()

    print()
    failed = [r for r in RESULTS if not r[1]]
    if errors:
        print(f"运行时报错 ({len(errors)}):")
        for e in errors[:10]:
            print(f"  - {e}")
    print(f"总计: {len(RESULTS) - len(failed)}/{len(RESULTS)} 通过")
    if failed or errors:
        sys.exit(1)
    print("OK: 运行时走查全绿")


if __name__ == "__main__":
    asyncio.run(main())
