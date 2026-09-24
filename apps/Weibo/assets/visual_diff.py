# -*- coding: utf-8 -*-
"""
视觉比对(pipeline v3 阶段⑤ 第六道机器 gate)—— 微博

对每个页面用 Playwright 截图,存到 docs/weibo-replication/visual-diff/,
并生成 index.html:左=模拟版截图,右=真机证据(docs/weibo-replication/evidence/)。
同时全页渲染监听 console/page 错误(零容忍)。

用法: 模拟器跑在 :3000 时执行
    python apps/Weibo/assets/visual_diff.py
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

URL = "http://localhost:3000"
OUT = Path(__file__).resolve().parents[5] / "docs" / "weibo-replication" / "visual-diff"
EVID = Path(__file__).resolve().parents[5] / "docs" / "weibo-replication" / "evidence"

# (name, route, 真机证据文件)
PAGES = [
    ("home", "/", "anchor_56.jpg"),
    ("home-follow", "/?tab=follow", "r1_003.png"),
    ("login", "/login", None),
    ("login-onekey", "/login?view=onekey", "anchor_69.jpg"),
    ("login-sms", "/login/sms", "r8_028.png"),
    ("video", "/video", "r1_016.png"),
    ("discover", "/discover", "anchor_61.jpg"),
    ("hot-full", "/discover/hot", None),
    ("search", "/search", "R9_005.png"),
    ("search-result", "/search/result?q=%23台风巴威路径又开始摇摆了%23", "anchor_62.jpg"),
    ("search-result-kw", "/search/result?q=巴威", "R9_018.png"),
    ("status-detail", "/status/s_typhoon", "anchor_57.jpg"),
    ("reply-detail", "/status/s_typhoon/replies/c_ty1", "r2_025.png"),
    ("repost", "/repost/s_typhoon", "r2_034.png"),
    ("image-viewer", "/status/s_typhoon/image/0", None),
    ("compose", "/compose", "anchor_60.jpg"),
    ("topic-picker", "/compose/topic", "r4_015.png"),
    ("mention-picker", "/compose/mention", "r3_053.png"),
    ("supertopic-picker", "/compose/supertopic", "r4_030.png"),
    ("image-picker", "/compose/images", "r4_023.png"),
    ("visibility", "/compose/visibility", "r3_062.png"),
    ("supertopic-square", "/supertopic/square", "R10_003.png"),
    ("supertopic", "/supertopic/st_xusong", "anchor_64.jpg"),
    ("supertopic-compose", "/supertopic/st_xusong/compose", "R10_050.png"),
    ("message", "/message", "anchor_65.jpg"),
    ("notice-likes", "/message/notice/likes", "r6_022.png"),
    ("chat", "/message/chat/ch_xinlang", "frame:r6_006.png"),
    ("message-settings", "/message/settings", "r6_037.png"),
    ("new-chat", "/message/new", "r6_041.png"),
    ("profile-other", "/user/u_fangdong", "anchor_68.jpg"),
    ("profile-self", "/me/profile", "anchor_67.jpg"),
    ("follows", "/me/follows", "r7_011.png"),
    ("fans", "/me/fans", "r7_036.png"),
    ("mine", "/me", "anchor_66.jpg"),
    ("my-posts", "/me/posts", "r7_005.png"),
    ("my-likes", "/me/likes", "r7_041.png"),
    ("history", "/me/history", None),
    ("drafts", "/me/drafts", None),
    ("settings", "/me/settings", "r8_007.png"),
    ("settings-privacy", "/me/settings/privacy", None),
    ("settings-block", "/me/settings/block", None),
    ("settings-general", "/me/settings/general", None),
    ("settings-account", "/me/settings/account", None),
    ("settings-security", "/me/settings/security", None),
    ("settings-notification", "/me/settings/notification", None),
    ("settings-navbar", "/me/settings/navbar", None),
    ("settings-teen", "/me/settings/teen", None),
    ("settings-care", "/me/settings/care", None),
    ("settings-help", "/me/settings/help", None),
    ("settings-about", "/me/settings/about", None),
    ("settings-storage", "/me/settings/storage", None),
    ("member", "/member", None),
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    page_errors: dict[str, list[str]] = {}
    done = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 420, "height": 900})
        cur = {"k": "_boot"}
        page.on("pageerror", lambda e: page_errors.setdefault(cur["k"], []).append(f"pageerror: {str(e)[:140]}"))
        page.on("console", lambda m: page_errors.setdefault(cur["k"], []).append(f"console: {m.text[:140]}")
                if m.type == "error" and "WMR" not in m.text and "404" not in m.text and "favicon" not in m.text else None)

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(2200)
        await page.evaluate("window.__OS__.openApp('weibo')")
        await page.wait_for_timeout(2200)

        for name, route, evid in PAGES:
            cur["k"] = name
            await page.evaluate("(r) => window.__OS__.openApp('weibo', r)", route)
            await page.wait_for_timeout(1300)
            await page.screenshot(path=str(OUT / f"{name}.png"))
            done.append((name, route, evid))
            print(f"  shot {name}", flush=True)

        await browser.close()

    rows = []
    for name, route, evid in done:
        evfile = (evid or "").replace("frame:", "")
        real_cell = (
            f'<img src="../evidence/{evfile}"/>' if evfile and (EVID / evfile).exists()
            else '<div class="noev">无对应真机图(inferred 页)</div>'
        )
        rows.append(f"""
        <div class="row">
          <div class="meta"><b>{name}</b><br><code>{route}</code></div>
          <div class="pair">
            <figure><figcaption>模拟版</figcaption><img src="{name}.png"/></figure>
            <figure><figcaption>真机</figcaption>{real_cell}</figure>
          </div>
        </div>""")
    html = f"""<!doctype html><meta charset="utf-8"><title>微博 视觉比对</title>
<style>
body{{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:16px}}
h1{{font-size:18px}} .row{{background:#fff;border-radius:10px;padding:12px;margin-bottom:14px;display:flex;gap:16px}}
.meta{{width:150px;font-size:13px;color:#333}} code{{font-size:11px;color:#FF8200;word-break:break-all}}
.pair{{display:flex;gap:12px}} figure{{margin:0}} figcaption{{font-size:11px;color:#888;text-align:center;margin-bottom:4px}}
img{{width:210px;border:1px solid #eee;border-radius:6px;display:block}}
.noev{{width:210px;height:60px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;border:1px dashed #ddd;border-radius:6px}}
</style>
<h1>微博 模拟版 vs 真机 · 逐页视觉比对({len(done)} 页)</h1>
<p style="font-size:12px;color:#666">真机基准见 <code>docs/weibo-replication/review.html</code> 与 <code>weibo_images/</code>(深色帧来自补拍,仅作行为参照)。</p>
{''.join(rows)}
"""
    (OUT / "index.html").write_text(html, encoding="utf-8")
    print(f"\n截图 {len(done)} 页 -> {OUT}\nindex.html 已生成")
    bad = {k: v for k, v in page_errors.items() if v}
    if bad:
        print("\n全页渲染 console/page 错误(零容忍):")
        for k, v in bad.items():
            for e in sorted(set(v))[:3]:
                print(f"  - [{k}] {e}")
        raise SystemExit(1)
    print(f"全 {len(done)} 页渲染无 console/page 错误。")


if __name__ == "__main__":
    asyncio.run(main())
