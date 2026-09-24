# -*- coding: utf-8 -*-
"""
视觉比对(pipeline v3 阶段⑤ 第六道机器 gate)—— 网易云音乐

对每个页面用 Playwright 截图(360×800),存到 docs/wangyiyun-replication/visual-diff/,
并生成 index.html:左=模拟版截图,右=真机证据(wangyiyun_images/)。

用法: 模拟器跑在 :3000 时执行
    python apps/Wangyiyun/assets/visual_diff.py
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

URL = "http://localhost:3000"
ROOT = Path(__file__).resolve().parents[5]
OUT = ROOT / "docs" / "wangyiyun-replication" / "visual-diff"
EVID = ROOT / "wangyiyun_images"

# (name, route, 真机证据文件名或 None)
PAGES = [
    ("home", "/", "微信图片_20260721171721_200_4.jpg"),
    ("daily", "/daily", "微信图片_20260721171723_201_4.jpg"),
    ("search", "/search", "微信图片_20260722115141_247_4.jpg"),
    ("player", "/player", "微信图片_20260721171735_208_4.jpg"),
    ("mine", "/me", "微信图片_20260721171737_209_4.jpg"),
    ("liked", "/me/liked", None),
    ("playlist", "/playlist/pl_radar", "微信图片_20260721171728_203_4.jpg"),
    ("rank", "/rank", None),
    ("album", "/album/al_anpo", None),
    ("artist", "/artist/ar_xusong", None),
    ("comments", "/song/s_001/comments", "微信图片_20260721171739_211_4.jpg"),
    ("notes", "/notes", None),
    ("recognize", "/recognize", "微信图片_20260721171742_214_4.jpg"),
    ("login", "/login", None),
    ("podcast", "/podcast", None),
    ("settings", "/settings", None),
    ("messages", "/messages", None),
    ("square", "/playlist-square", None),
    ("heart", "/home/heart", None),
    ("music", "/home/music", None),
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    page_errors: dict[str, list[str]] = {}
    cur = {"name": "boot"}
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 360, "height": 800}, device_scale_factor=2)
        page.on(
            "pageerror",
            lambda e: page_errors.setdefault(cur["name"], []).append(f"pageerror: {str(e)[:120]}"),
        )
        page.on(
            "console",
            lambda m: page_errors.setdefault(cur["name"], []).append(f"console: {m.text[:120]}")
            if m.type == "error" and "404" not in m.text and "WMR" not in m.text and "favicon" not in m.text
            else None,
        )
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1800)
        # 预置播放态,方便截播放页
        await page.evaluate("""() => {
          try {
            const store = window.__SIM__;
            // 打开 app 后再设状态
          } catch (e) {}
        }""")
        await page.evaluate("window.__OS__.openApp('wangyiyun')")
        await page.wait_for_timeout(1200)
        await page.evaluate("""() => {
          const app = window.__SIM__?.getState?.()?.apps?.wangyiyun;
          // 通过 UI 副作用不够时,至少保证有 currentSong
        }""")
        # 用 openApp 进首页后点一首歌进入播放态
        try:
            await page.locator('[data-action="play.song.inline"],[data-action="play.song.fromlist"]').first.click(timeout=2000)
            await page.wait_for_timeout(400)
        except Exception:
            pass

        done = []
        for name, route, evid in PAGES:
            cur["name"] = name
            try:
                await page.evaluate("(r) => window.__OS__.openApp('wangyiyun', r)", route)
                await page.wait_for_timeout(900)
                out = OUT / f"{name}.png"
                await page.screenshot(path=str(out), full_page=False)
                evid_path = None
                if evid and (EVID / evid).exists():
                    evid_path = evid
                done.append((name, route, evid_path, page_errors.get(name, [])))
                print(f"  ok {name} → {out.name}", flush=True)
            except Exception as e:
                done.append((name, route, evid, [f"capture: {e}"]))
                print(f"  FAIL {name}: {e}", flush=True)

        await browser.close()

    # index.html
    rows = []
    for name, route, evid, errs in done:
        left = f"{name}.png"
        right = f"../../wangyiyun_images/{evid}" if evid else ""
        err_html = ("<div style='color:#c00;font-size:12px'>" + "<br>".join(errs) + "</div>") if errs else ""
        right_cell = (
            f"<img src='{right}' style='width:180px;border:1px solid #ddd'/>"
            if evid
            else "<div style='width:180px;color:#999;font-size:12px'>无锚定证据</div>"
        )
        rows.append(
            f"<tr><td style='vertical-align:top'><b>{name}</b><br><code>{route}</code>{err_html}<br>"
            f"<img src='{left}' style='width:180px;border:1px solid #ddd'/></td>"
            f"<td style='vertical-align:top'>{right_cell}</td></tr>"
        )
    html = (
        "<!doctype html><meta charset=utf-8><title>Wangyiyun visual-diff</title>"
        "<style>body{font-family:sans-serif;padding:16px} table{border-collapse:collapse}"
        "td{padding:12px;border-bottom:1px solid #eee}</style>"
        "<h1>网易云音乐 · 视觉比对</h1><p>左=模拟版 · 右=真机证据</p>"
        "<table>" + "".join(rows) + "</table>"
    )
    (OUT / "index.html").write_text(html, encoding="utf-8")
    print(f"wrote {OUT / 'index.html'} ({len(done)} pages)")


if __name__ == "__main__":
    asyncio.run(main())
