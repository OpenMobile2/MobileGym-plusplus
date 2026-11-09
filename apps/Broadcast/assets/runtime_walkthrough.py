# -*- coding: utf-8 -*-
"""Broadcast(苹果播客)运行时走查 + 截图。
- 打开 app,逐条走 P0 链路,监听 console error / pageerror(零容忍)
- 关键交互后断言 __SIM__ 状态真的变了(effect=state 的交互不能是死交互)
- 同时把每屏截图存到 docs/broadcast-replication/run-screens/

用法:先 `npm run dev`(:3000),再 `python apps/Broadcast/assets/runtime_walkthrough.py`
"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright

import os
URL = os.environ.get("BC_URL", "http://localhost:3007")
OUT = Path("D:/mobilegym-mock/docs/broadcast-replication/run-screens")
OUT.mkdir(parents=True, exist_ok=True)

errors = []
shots = []

async def shot(page, name):
    p = OUT / f"{name}.png"
    await page.screenshot(path=str(p))
    shots.append(name)
    print(f"  shot {name}")

async def click_sel(page, sel, label, wait=400):
    el = page.locator(sel).first
    try:
        await el.click(timeout=2500)
        await page.wait_for_timeout(wait)
        print(f"  clicked {label}")
        return True
    except Exception as e:
        print(f"  !! could not click {label} ({sel}): {e}")
        return False

async def state(page):
    return await page.evaluate("window.__SIM__ && window.__SIM__.getState().apps.broadcast")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 412, "height": 915})
        def is_app_error(text):
            # 过滤 OS 桌面/小组件噪音(非本 app)
            noise = ("WMR", "cdn/themes", "widget", "<Clock>", "favicon")
            return not any(n in text for n in noise)
        page.on("console", lambda m: (errors.append(f"console.error: {m.text}") if (m.type == "error" and is_app_error(m.text)) else None))
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}") if is_app_error(str(e)) else None)
        page.on("response", lambda r: print(f"  [404] {r.url}") if r.status == 404 else None)

        await page.goto(URL, wait_until="networkidle")
        await page.evaluate("window.__OS__.openApp('broadcast')")
        await page.wait_for_timeout(900)
        await shot(page, "01-home")

        st0 = await state(page)
        assert st0 is not None, "broadcast app state not found"

        # 主页 → 节目详情(点最爱节目方块)
        await click_sel(page, '[data-trigger="broadcast.show-open"]', "show tile")
        await shot(page, "02-show")

        # 节目详情 → 播放(断言 isPlaying / currentEpisode 变化)
        await click_sel(page, '[data-action="broadcast.show.play"]', "show.play")
        after = await state(page)
        play_ok = bool(after and after.get("player", {}).get("isPlaying"))
        print(f"  [assert] show.play → isPlaying={after.get('player',{}).get('isPlaying')}")

        # 节目详情 → 单集详情(点节目页"单集"列表里的一行,进真实单集页)
        await click_sel(page, '[data-trigger="broadcast.episode-open"]', "episode row")
        await shot(page, "03-episode")

        # 单集 → 收藏(断言 savedEpisodeIds 变化)
        s_before = (await state(page)).get("savedEpisodeIds", [])
        await click_sel(page, '[data-action="broadcast.episode.save"]', "episode.save")
        s_after = (await state(page)).get("savedEpisodeIds", [])
        save_ok = (len(s_after) != len(s_before))
        print(f"  [assert] episode.save → saved {len(s_before)}→{len(s_after)}")

        # 打开正在播放(迷你播放器,从单集子页 → 验证 from 约束已修)
        await click_sel(page, '[data-trigger="broadcast.nowplaying-open"]', "mini-player → now playing")
        await shot(page, "05-nowplaying")
        # 播放/暂停断言
        p_before = (await state(page)).get("player", {}).get("isPlaying")
        await click_sel(page, '[data-action="broadcast.player.playpause.toggle"]', "playpause")
        p_after = (await state(page)).get("player", {}).get("isPlaying")
        toggle_ok = (p_before != p_after)
        print(f"  [assert] playpause → {p_before}→{p_after}")
        # 队列视图
        await click_sel(page, '[data-trigger="broadcast.playerQueue-open"]', "queue")
        await shot(page, "06-queue")

        # 回主页,走其余三个 Tab
        await page.evaluate("window.__OS__.handleBack()")
        await page.wait_for_timeout(300)
        for tab, name in [("broadcast.browse-open","07-browse"),("broadcast.library-open","08-library"),("broadcast.search-open","09-search")]:
            await click_sel(page, f'[data-trigger="{tab}"]', tab)
            await shot(page, name)

        await browser.close()

    print("\n==== RESULT ====")
    print(f"screens: {len(shots)}  ->  {OUT}")
    print(f"console/page errors: {len(errors)}")
    for e in errors[:20]:
        print("  ", e)
    asserts = {"show.play→isPlaying": play_ok, "episode.save→changed": save_ok, "playpause→toggled": toggle_ok}
    print("asserts:", asserts)
    bad = [k for k, v in asserts.items() if not v]
    if errors or bad:
        print("FAIL:", "errors" if errors else "", bad)
        sys.exit(1)
    print("OK: no runtime errors, P0 state assertions passed")

if __name__ == "__main__":
    asyncio.run(main())
