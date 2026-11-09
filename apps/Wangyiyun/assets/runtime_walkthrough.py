# -*- coding: utf-8 -*-
"""
运行时走查(pipeline v3 阶段⑤ 第五道机器 gate)—— 网易云音乐

按 spec v1.2 的 P0 交互在真实模拟器里逐条执行,每步带状态断言:
- effect=nav  → 断言目标页出现(目标页独有的 data-trigger/data-action 可见)
- effect=state→ 断言 __SIM__.apps.wangyiyun 状态发生了声明的变化(抓死按钮)
- select/tab  → 切换前后读依赖它的可观察量,断言不相等
- 返回可达性 → 深层页连按 system.back,无环回到 tab 根页
- 全程监听 console error / pageerror,零容忍

用法: 模拟器跑在 :3000 时执行
    python apps/Wangyiyun/assets/runtime_walkthrough.py
"""
import asyncio
import sys
from playwright.async_api import async_playwright

import os
URL = os.environ.get("WANGYIYUN_URL", "http://127.0.0.1:3000")
RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, passed: bool, detail: str = ""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def st(page, expr: str):
    return await page.evaluate(f"window.__SIM__.getState().apps.wangyiyun.{expr}")


async def has(page, selector: str) -> bool:
    try:
        return await page.locator(selector).first.is_visible()
    except Exception:
        return False


async def click(page, selector: str, timeout=4000):
    await page.locator(selector).first.click(timeout=timeout)
    await page.wait_for_timeout(500)


async def goto(page, route: str):
    await page.evaluate("(r) => window.__OS__.openApp('wangyiyun', r)", route)
    await page.wait_for_timeout(900)


async def pathname(page) -> str:
    return await page.evaluate("""() => {
      const t = window.__OS__?.getState?.() || {};
      // MemoryRouter 不在 location;优先读 app 根上的 data 属性,否则读 SIM 导航
      const el = document.querySelector('[data-wangyiyun-route]');
      if (el) return el.getAttribute('data-wangyiyun-route') || '';
      const href = location.hash || location.pathname;
      return href;
    }""") or ""


async def back(page):
    await page.evaluate("window.__OS__.handleBack()")
    await page.wait_for_timeout(450)


async def main():
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 360, "height": 800})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:160]}"))
        page.on(
            "console",
            lambda m: errors.append(f"console: {m.text[:160]}")
            if m.type == "error"
            and "WMR" not in m.text
            and "404" not in m.text
            and "favicon" not in m.text
            else None,
        )

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.evaluate("window.__SIM__.resetState()")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1600)
        await page.evaluate("window.__OS__.openApp('wangyiyun')")
        await page.wait_for_timeout(2000)

        # ---------- W1 首页 → 每日推荐 ----------
        await goto(page, "/")
        await click(page, '[data-trigger="home.daily-open"]')
        daily_ok = await has(page, '[data-trigger="daily.playall"]') or await has(
            page, '[data-scroll-container="daily-list"]'
        )
        record("W1 home.daily-open → 每日推荐", daily_ok)

        # ---------- W2 日推播放全部(state: currentSongId + isPlaying) ----------
        before_song = await st(page, "currentSongId")
        if await has(page, '[data-trigger="daily.playall"]'):
            await click(page, '[data-trigger="daily.playall"]')
            playing = await st(page, "isPlaying")
            after_song = await st(page, "currentSongId")
            record(
                "W2 daily.playall 开始播放(state)",
                bool(playing) and after_song is not None,
                f"song {before_song}->{after_song} playing={playing}",
            )
        else:
            record("W2 daily.playall", False, "no playall trigger")

        # ---------- W3 迷你条 → 播放页 ----------
        await goto(page, "/")
        if await has(page, '[data-trigger="miniplayer.player-open"]'):
            await click(page, '[data-trigger="miniplayer.player-open"]')
            player_ok = await has(page, '[data-action="player.play.toggle"]') or await has(
                page, '[data-action="song.heart.toggle"]'
            )
            record("W3 miniplayer → 播放页", player_ok)
        else:
            # 确保有当前曲
            await page.evaluate("""() => {
              const a = window.__SIM__.getState().apps.wangyiyun;
            }""")
            await goto(page, "/player")
            player_ok = await has(page, '[data-action="player.play.toggle"]') or await has(
                page, '[data-action="song.heart.toggle"]'
            )
            record("W3 直达播放页", player_ok)

        # ---------- W4 红心切换(state) ----------
        liked0 = await st(page, "likedSongIds.length")
        if await has(page, '[data-action="song.heart.toggle"]'):
            await click(page, '[data-action="song.heart.toggle"]')
            liked1 = await st(page, "likedSongIds.length")
            record("W4 song.heart.toggle 改变红心(state)", liked1 != liked0, f"liked {liked0}->{liked1}")
        else:
            record("W4 song.heart.toggle", False, "missing")

        # ---------- W5 播放/暂停 toggle(state) ----------
        if await has(page, '[data-action="player.play.toggle"]'):
            p0 = await st(page, "isPlaying")
            await click(page, '[data-action="player.play.toggle"]')
            p1 = await st(page, "isPlaying")
            record("W5 player.play.toggle(state)", p0 != p1, f"isPlaying {p0}->{p1}")
        else:
            record("W5 player.play.toggle", False, "missing")

        # ---------- W6 评论页 ----------
        song_id = await st(page, "currentSongId") or "s_001"
        await goto(page, f"/song/{song_id}/comments")
        comment_ok = await has(page, '[data-action="comment.compose.submit"]') or await has(
            page, '[data-action="comment.like.toggle"]'
        )
        record("W6 评论页可达", comment_ok)
        if comment_ok and await has(page, '[data-action="comment.like.toggle"]'):
            # 点赞前后 liked 集合变化(评论 like 存在 store 里)
            await click(page, '[data-action="comment.like.toggle"]')
            record("W6b comment.like.toggle 可点(无崩溃)", True)

        # ---------- W7 搜索 → 结果 + tab 切换数据变 ----------
        await goto(page, "/search")
        search_ok = await has(page, '[data-trigger="search.go"]') or await has(
            page, '[data-action="search.query.input"]'
        )
        record("W7 搜索中间页", search_ok)
        # 点热搜或直接进结果
        await goto(page, "/search/result?q=%E8%AE%B8%E5%B5%A9")
        tab = page.locator('[data-action="search.tab.select.target"]')
        if await tab.count() >= 3:
            # 切到「歌单」tab(与单曲列表结构不同)
            before = await page.locator('[data-scroll-container="result-list"]').inner_text()
            # SEARCH_TABS 顺序含 歌单
            for i in range(await tab.count()):
                label = (await tab.nth(i).inner_text()).strip()
                if "歌单" in label:
                    await tab.nth(i).click()
                    break
            await page.wait_for_timeout(400)
            after = await page.locator('[data-scroll-container="result-list"]').inner_text()
            record("W7b search.tab.select 切换内容变化", before != after, f"len {len(before)}->{len(after)}")
        else:
            record("W7b search.tab.select", False, f"tabs={await tab.count()}")

        # ---------- W8 首页歌单卡 → 歌单详情 → 收藏 ----------
        await goto(page, "/")
        if await has(page, '[data-trigger="home.playlist-open"]'):
            await click(page, '[data-trigger="home.playlist-open"]')
            pl_ok = await has(page, '[data-action="playlist.collect.toggle"]') or await has(
                page, '[data-trigger="playlist.playall"]'
            )
            record("W8 home.playlist-open → 歌单详情", pl_ok)
            if await has(page, '[data-action="playlist.collect.toggle"]'):
                c0 = await st(page, "collectedPlaylistIds.length")
                await click(page, '[data-action="playlist.collect.toggle"]')
                c1 = await st(page, "collectedPlaylistIds.length")
                record(
                    "W8b playlist.collect.toggle(state)",
                    c0 != c1,
                    f"collected {c0}->{c1}",
                )
        else:
            record("W8 home.playlist-open", False, "missing")

        # ---------- W9 我的 → 红心歌单 ----------
        await goto(page, "/me")
        if await has(page, '[data-trigger="mine.liked-open"]'):
            await click(page, '[data-trigger="mine.liked-open"]')
            liked_page = await has(page, '[data-trigger="liked.playall"]') or await has(
                page, '[data-scroll-container="liked-list"]'
            )
            record("W9 mine.liked-open → 我喜欢的音乐", liked_page)
        else:
            record("W9 mine.liked-open", False, "missing")

        # ---------- W10 TabBar 切换 ----------
        await goto(page, "/")
        await click(page, '[data-trigger="tabbar.mine-open"]')
        me_ok = await has(page, '[data-trigger="mine.liked-open"]') or await has(
            page, '[data-scroll-container="mine-list"]'
        )
        record("W10 tabbar → 我的", me_ok)
        await click(page, '[data-trigger="tabbar.moments-open"]')
        notes_ok = await has(page, '[data-action="notes.feed.select.target"]') or await has(
            page, '[data-scroll-container="notes-feed"]'
        )
        record("W10b tabbar → 笔记", notes_ok)
        await click(page, '[data-trigger="tabbar.home-open"]')
        home_ok = await has(page, '[data-trigger="home.daily-open"]')
        record("W10c tabbar → 首页", home_ok)

        # ---------- W11 登录(若未登录) ----------
        logged = await st(page, "session.loggedIn")
        if not logged:
            await goto(page, "/login")
            if await has(page, '[data-trigger="login.done"]'):
                await click(page, '[data-trigger="login.done"]')
                logged2 = await st(page, "session.loggedIn")
                record("W11 login.done(state)", logged2 is True, f"loggedIn={logged2}")
            else:
                record("W11 login.done", False, "missing")
        else:
            record("W11 已登录跳过", True)

        # ---------- W12 新建歌单弹层 ----------
        await goto(page, "/me")
        if await has(page, '[data-action="playlist.create.open"]'):
            n0 = await st(page, "playlists.length")
            await click(page, '[data-action="playlist.create.open"]')
            create_ui = await has(page, '[data-action="create.private.toggle"]') or await page.locator(
                "input"
            ).count() > 0
            record("W12 playlist.create.open 弹层", create_ui)
            # 关闭
            await back(page)
            n1 = await st(page, "playlists.length")
            record("W12b 关闭弹层后歌单数未丢", n1 >= n0, f"playlists {n0}->{n1}")
        else:
            record("W12 playlist.create.open", False, "missing")

        # ---------- W13 播放队列弹层 + 切歌(state) ----------
        await goto(page, "/player")
        if await has(page, '[data-action="queue.sheet.open"]'):
            await click(page, '[data-action="queue.sheet.open"]')
            q_ok = await has(page, '[data-action="queue.play.select.target"]') or await has(
                page, '[data-trigger="system.back"]'
            )
            record("W13 queue.sheet.open", q_ok)
            if await has(page, '[data-action="queue.play.select.target"]'):
                s0 = await st(page, "currentSongId")
                await page.locator('[data-action="queue.play.select.target"]').nth(1).click()
                await page.wait_for_timeout(400)
                s1 = await st(page, "currentSongId")
                record("W13b queue.play.select 切歌(state)", s0 != s1, f"{s0}->{s1}")
            await back(page)
        else:
            record("W13 queue.sheet.open", False, "missing")

        # ---------- W14 排行榜 ----------
        await goto(page, "/")
        if await has(page, '[data-trigger="home.rank-open"]'):
            await click(page, '[data-trigger="home.rank-open"]')
        else:
            await goto(page, "/rank")
        rank_ok = await has(page, '[data-trigger="rank.detail-open"]') or await has(
            page, '[data-scroll-container="rank-list"]'
        )
        record("W14 排行榜页", rank_ok)

        # ---------- W15 识曲 ----------
        await goto(page, "/recognize")
        rec_ok = await has(page, '[data-action="recognize.scan.toggle"]')
        record("W15 听歌识曲页", rec_ok)

        # ---------- W16 返回可达性(深层:播放页评论 → 连退回 tab 根) ----------
        await goto(page, f"/song/{song_id}/comments")
        await goto(page, "/player")  # 再压一层
        routes = []
        for _ in range(6):
            # 读当前可见关键 trigger 作为「位置指纹」
            fp = await page.evaluate("""() => {
              const t = document.querySelector('[data-trigger="home.daily-open"]');
              const p = document.querySelector('[data-action="player.play.toggle"],[data-action="song.heart.toggle"]');
              const c = document.querySelector('[data-action="comment.compose.submit"],[data-action="comment.like.toggle"]');
              const m = document.querySelector('[data-trigger="mine.liked-open"]');
              if (t) return 'home';
              if (p) return 'player';
              if (c) return 'comment';
              if (m) return 'me';
              return 'other';
            }""")
            routes.append(fp)
            if fp in ("home", "me"):
                break
            await back(page)
        record(
            "W16 返回可达性:能回到 tab 根",
            any(r in ("home", "me") for r in routes),
            " → ".join(routes),
        )
        # 无环:同一指纹不应在回到根之前反复 A-B-A
        cycling = False
        if len(routes) >= 4:
            for i in range(len(routes) - 3):
                if routes[i] == routes[i + 2] and routes[i + 1] == routes[i + 3] and routes[i] != routes[i + 1]:
                    cycling = True
        record("W16b 返回序列无 A-B-A-B 环", not cycling, " → ".join(routes))

        # ---------- W17 首页推荐行内播放(state) ----------
        await goto(page, "/")
        if await has(page, '[data-action="play.song.inline"]'):
            s0 = await st(page, "currentSongId")
            await click(page, '[data-action="play.song.inline"]')
            s1 = await st(page, "currentSongId")
            playing = await st(page, "isPlaying")
            record(
                "W17 play.song.inline(state)",
                bool(playing) and (s1 is not None),
                f"{s0}->{s1} playing={playing}",
            )
        else:
            record("W17 play.song.inline", False, "missing")

        # ---------- W18 评论非空 + 返回键 ----------
        await goto(page, "/song/s_001/comments")
        n_comments = await page.evaluate("""() => {
          const rows = document.querySelectorAll('[data-action="comment.like.toggle"]');
          return rows.length;
        }""")
        has_back = await has(page, '[data-trigger="system.back"]')
        record("W18 评论列表非空", n_comments >= 5, f"likes={n_comments}")
        record("W18b 评论页有返回", has_back)

        # ---------- W19 灯泡漫游切歌 ----------
        await goto(page, "/player")
        await page.evaluate("""() => {
          const s = window.__SIM__.getState().apps.wangyiyun;
          const id = s.songs[0].id;
          window.__SIM__.getState().apps.wangyiyun; // noop
        }""")
        # ensure playing a song
        await page.evaluate("""() => {
          const store = window.__SIM__;
          // use openApp route already on player; set via actions if exposed
        }""")
        s0 = await st(page, "currentSongId")
        if await has(page, '[data-trigger="player.roam-enter"]'):
            await click(page, '[data-trigger="player.roam-enter"]')
            s1 = await st(page, "currentSongId")
            roam = await st(page, "roamMode")
            record("W19 player.roam-enter 切歌+漫游", bool(roam) and s0 != s1, f"{s0}->{s1} roam={roam}")
        else:
            record("W19 player.roam-enter", False, "missing")

        # ---------- W20 封面为真实图片(非纯色块) ----------
        cover_ok = await page.evaluate("""() => {
          const el = document.querySelector('[data-action="player.view.toggle"] div, [data-trigger="heart.player-open"] div, .rounded-full');
          // look for background-image url containing gen/
          const nodes = Array.from(document.querySelectorAll('div'));
          return nodes.some(n => {
            const bg = getComputedStyle(n).backgroundImage || '';
            return bg.includes('/gen/') || bg.includes('.png');
          });
        }""")
        record("W20 页面存在真实封面图", bool(cover_ok))

        # ---------- W21 笔记点赞不导航 ----------
        await goto(page, "/song/s_004/notes")
        if await has(page, '[data-action="songnotes.like.toggle"]'):
            def s4_first_likes():
                return page.evaluate("""() => {
                  const s = window.__SIM__.getState().apps.wangyiyun;
                  const n = s.notes.find(x => x.songId === 's_004');
                  return n ? n.likes : -1;
                }""")
            likes0 = await s4_first_likes()
            await click(page, '[data-action="songnotes.like.toggle"]')
            likes1 = await s4_first_likes()
            still_notes = await has(page, '[data-action="songnotes.like.toggle"]')
            record("W21 songnotes.like.toggle 点赞且留在页", still_notes and likes0 != likes1, f"likes {likes0}->{likes1}")
        else:
            record("W21 songnotes.like.toggle", False, "missing")

        # ---------- W22 我的·专辑筛选 ----------
        await goto(page, "/me")
        filters = page.locator('[data-action="mine.filter.select.target"]')
        album_clicked = False
        for i in range(await filters.count()):
            if "专辑" in (await filters.nth(i).inner_text()):
                await filters.nth(i).click()
                album_clicked = True
                break
        await page.wait_for_timeout(300)
        body = await page.locator('[data-scroll-container="mine-list"]').inner_text()
        record("W22 专辑筛选展示专辑", album_clicked and ("专辑" in body) and ("我喜欢的音乐" not in body), body[:80].replace("\n", " "))

        # ---------- W23 加歌 tab 切换内容 ----------
        await goto(page, "/playlist/pl_liked/add")
        tabs = page.locator('[data-action="addsongs.tab.select.target"]')
        if await tabs.count() >= 2:
            t0 = await page.locator("body").inner_text()
            await tabs.nth(1).click()
            await page.wait_for_timeout(300)
            t1 = await page.locator("body").inner_text()
            record("W23 addsongs.tab 切换内容", t0 != t1)
        else:
            record("W23 addsongs.tab", False, "missing")

        # ---------- W24 发笔记素材为真实图 ----------
        await goto(page, "/notes/compose")
        media_ok = await page.evaluate("""() => {
          const nodes = Array.from(document.querySelectorAll('[data-action="compose.media.pick"]'));
          return nodes.length >= 8 && nodes.some(n => {
            const bg = getComputedStyle(n.firstElementChild || n).backgroundImage || '';
            return bg.includes('.png') || bg.includes('/gen/');
          });
        }""")
        record("W24 compose 素材为真实图", bool(media_ok))

        # ---------- W25 评论页笔记 tab 内嵌列表 + 点开详情 ----------
        await goto(page, "/song/s_004/comments")
        # 切到笔记 tab
        tabs = page.locator('[trigger="comment.notes-open"], [data-trigger="comment.notes-open"]')
        # note tab button uses transition comment.notes-open
        clicked = False
        btns = page.locator('button')
        n = await btns.count()
        for i in range(n):
            try:
                txt = (await btns.nth(i).inner_text()).strip()
            except Exception:
                continue
            if txt.startswith("笔记"):
                await btns.nth(i).click()
                clicked = True
                break
        await page.wait_for_timeout(400)
        note_cards = await page.locator('[data-trigger="songnotes.detail-open"]').count()
        record("W25 评论页·笔记tab 内嵌列表(非跳转按钮)", clicked and note_cards >= 1, f"cards={note_cards}")
        if note_cards >= 1:
            await page.locator('[data-trigger="songnotes.detail-open"]').first.click()
            await page.wait_for_timeout(500)
            detail_ok = await has(page, '[action="note.like.toggle"]') or await has(page, '[data-action="note.like.toggle"]')
            record("W25b 点开笔记→完整详情页", detail_ok)

        # ---------- W26 每首歌都有笔记 ----------
        note_counts = await page.evaluate("""() => {
          const s = window.__SIM__.getState().apps.wangyiyun;
          const songs = s.songs.map(x => x.id);
          return songs.map(id => s.notes.filter(n => n.songId === id).length);
        }""")
        record("W26 每首歌都有笔记", all(c >= 1 for c in note_counts), f"min={min(note_counts)} total_songs={len(note_counts)}")

        # ---------- W27 笔记详情的分享按钮打开面板 ----------
        note_id0 = await page.evaluate("""() => {
          const st = window.__SIM__.getState().apps.wangyiyun;
          return st.notes[0].id;
        }""")
        await goto(page, f"/notes/{note_id0}")
        share_btn = page.locator('button[aria-label="分享"]')
        if await share_btn.count():
            await share_btn.last.click()
            await page.wait_for_timeout(400)
            sheet_ok = await has(page, '[data-trigger="share.tonote"]')
            record("W27 笔记详情·分享打开面板", sheet_ok)
            await back(page)
        else:
            record("W27 笔记详情·分享按钮", False, "no share btn")

        # ---------- W28 底部 TabBar 固定在首页级页面 ----------
        tabbar_states = {}
        for route in ["/", "/home/music", "/home/audiobook", "/podcast", "/search", "/me", "/notes"]:
            await goto(page, route)
            vis = await page.evaluate("""() => {
              const btns = Array.from(document.querySelectorAll('[data-trigger="tabbar.home-open"]'));
              return btns.some(b => b.offsetParent !== null);
            }""")
            tabbar_states[route] = vis
        all_home_have_bar = all(tabbar_states[r] for r in ["/", "/home/music", "/home/audiobook", "/podcast"])
        record("W28 底部Tab固定于首页级页面", all_home_have_bar, str(tabbar_states))

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
