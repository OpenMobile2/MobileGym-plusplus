# -*- coding: utf-8 -*-
"""
视觉比对(第六道机器 gate)—— 美柚

对每个页面用 Playwright 截图(360×800),存到 docs/meiyou-replication/visual-diff/,
生成 index.html:左=模拟版截图,右=真机证据(meiyou_images/)。交给用户做阶段⑥ 逐页走查。

Meiyou 的 openApp(route) 不能可靠深链(route 不生效,总落首页),故一律**从 home 点击导航**到目标页
后截图(与 runtime_walkthrough 同法)。全程监听 console/page error,零容忍。

用法:模拟器跑在 :3000 时执行
    python apps/Meiyou/assets/visual_diff.py
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

URL = "http://localhost:3000"
ROOT = Path(__file__).resolve().parents[5]
OUT = ROOT / "docs" / "meiyou-replication" / "visual-diff"
EVID_DIR = "meiyou_images"

# (name, 点击链[selector...], 真机证据文件名或 None)
# 点击链从 home 根出发;每步点一个 data-trigger/data-action。
PAGES = [
    ("home", [], "微信图片_20260712183109_105_4.jpg"),
    ("record", ['[data-trigger="meiyou.tab.record"]'], "微信图片_20260712183110_106_4.jpg"),
    ("year", ['[data-trigger="meiyou.tab.record"]', '[data-trigger="meiyou.yearview-open"]'], "微信图片_20260712183112_107_4.jpg"),
    ("analysis", ['[data-trigger="meiyou.tab.record"]', '[data-trigger="meiyou.analysis-open"]'], "微信图片_20260712183114_109_4.jpg"),
    ("daily-report", ['[data-trigger="meiyou.dailyreport-open"]'], "微信图片_20260712210407_169_4.jpg"),
    ("search", ['[data-trigger="meiyou.search-open"]'], "微信图片_20260712204716_146_4.jpg"),
    ("message", ['[data-trigger="meiyou.tab.message"]'], None),
    ("interact", ['[data-trigger="meiyou.tab.message"]', '[data-trigger="meiyou.interact-open"]'], None),
    ("system-chat", ['[data-trigger="meiyou.tab.message"]', '[data-trigger="meiyou.syschat-open"]'], None),
    ("ai-chat", ['[data-trigger="meiyou.tab.message"]', '[data-trigger="meiyou.aichat-open"]'], None),
    ("me", ['[data-trigger="meiyou.tab.me"]'], "微信图片_20260712183117_113_4.jpg"),
    ("profile", ['[data-trigger="meiyou.tab.me"]', '[data-trigger="meiyou.profile-open"]'], None),
    ("circle", ['[data-trigger="meiyou.tab.me"]', '[data-trigger="meiyou.circle-open"]'], "微信图片_20260712183115_110_4.jpg"),
    ("post-detail", ['[data-trigger="meiyou.postdetail-open"]'], "微信图片_20260712183116_111_4.jpg"),
    ("publish", ['[data-trigger="meiyou.publish-open"]'], "微信图片_20260712183116_112_4.jpg"),
    ("cycle-settings", ['[data-trigger="meiyou.tab.me"]', '[data-trigger="meiyou.cyclesettings-open"]'], "微信图片_20260712183121_116_4.jpg"),
    ("settings", ['[data-trigger="meiyou.tab.me"]', '[data-trigger="meiyou.settings-open"]'], None),
    ("notif-settings", ['[data-trigger="meiyou.tab.me"]', '[data-trigger="meiyou.settings-open"]', '[data-trigger="meiyou.notifsettings-open"]'], "微信图片_20260712204722_152_4.jpg"),
    ("prep-intro", ['[data-trigger="meiyou.tab.me"]', '[data-trigger="meiyou.prepintro-open"]'], "微信图片_20260712183118_114_4.jpg"),
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    page_errors: dict[str, list[str]] = {}
    cur = {"name": "boot"}
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 360, "height": 800}, device_scale_factor=2)
        page.on("pageerror", lambda e: page_errors.setdefault(cur["name"], []).append(f"pageerror: {str(e)[:120]}"))
        page.on("console", lambda m: page_errors.setdefault(cur["name"], []).append(f"console: {m.text[:120]}")
                if m.type == "error" and all(x not in m.text for x in ("404", "WMR", "favicon", "React DevTools")) else None)
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1800)

        async def on_tab_root():
            return await page.evaluate("() => !!document.querySelector('[data-trigger=\"meiyou.tab.home\"]')")

        async def reset_home():
            # 回到 home 根:先 back 出所有子页,再点 home tab
            for _ in range(8):
                if await on_tab_root():
                    break
                await page.evaluate("window.__OS__.handleBack()")
                await page.wait_for_timeout(250)
            try:
                await page.locator('[data-trigger="meiyou.tab.home"]').first.click(timeout=2500)
                await page.wait_for_timeout(400)
            except Exception:
                await page.evaluate("window.__OS__.openApp('meiyou')")
                await page.wait_for_timeout(800)

        await page.evaluate("window.__OS__.openApp('meiyou')")
        await page.wait_for_timeout(1600)

        done = []
        for name, chain, evid in PAGES:
            cur["name"] = name
            try:
                await reset_home()
                for sel in chain:
                    await page.locator(sel).first.click(timeout=3000)
                    await page.wait_for_timeout(500)
                shot = OUT / f"{name}.png"
                await page.screenshot(path=str(shot))
                done.append((name, evid, shot.name))
                print(f"  [OK] {name:16s} <- {' > '.join(chain) or 'home'}")
            except Exception as e:
                print(f"  [ERR] {name:16s} {str(e)[:90]}")
        await browser.close()

    rows = []
    for name, evid, shot in done:
        real = f"../../{EVID_DIR}/{evid}" if evid else ""
        real_cell = f'<img src="{real}"/>' if evid else '<div class="noev">(无对应真机证据 / 见 review.html)</div>'
        rows.append(f"""
        <div class="row">
          <div class="meta"><b>{name}</b></div>
          <div class="pair">
            <figure><figcaption>模拟版</figcaption><img src="{shot}"/></figure>
            <figure><figcaption>真机</figcaption>{real_cell}</figure>
          </div>
        </div>""")
    html = f"""<!doctype html><meta charset="utf-8"><title>美柚 视觉比对</title>
<style>
body{{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:16px}}
h1{{font-size:18px}} .row{{background:#fff;border-radius:10px;padding:12px;margin-bottom:14px;display:flex;gap:16px;align-items:flex-start}}
.meta{{width:120px;font-size:13px;color:#333}}
.pair{{display:flex;gap:12px}} figure{{margin:0}} figcaption{{font-size:11px;color:#888;text-align:center;margin-bottom:4px}}
.pair img{{width:200px;border:1px solid #eee;border-radius:6px;display:block}}
.noev{{width:200px;height:60px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;border:1px dashed #ddd;border-radius:6px}}
</style>
<h1>美柚 模拟版 vs 真机 · 逐页视觉比对({len(done)} 页)</h1>
<p style="font-size:12px;color:#666">真机像素基准另见 <code>docs/meiyou-replication/review.html</code> 与 <code>meiyou_images/</code>。</p>
{''.join(rows)}
"""
    (OUT / "index.html").write_text(html, encoding="utf-8")
    print(f"\n截图 {len(done)}/{len(PAGES)} 页 -> {OUT}\nindex.html 已生成")
    bad = {k: v for k, v in page_errors.items() if v}
    if bad:
        print("\n渲染 console/page 错误(零容忍):")
        for k, v in bad.items():
            for e in sorted(set(v))[:3]:
                print(f"  - [{k}] {e}")
        return 1
    print(f"全 {len(done)} 页渲染无 console/page 错误。")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))
