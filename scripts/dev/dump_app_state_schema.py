#!/usr/bin/env python3
"""
dump_app_state_schema.py

Fetch the live __SIM__.getState() structure from localhost:3000 and generate
the Markdown state schema reference.

前提：
  - 先运行 `npm run dev` 启动服务
  - 已安装 Python 包 `playwright`，并已执行 `python -m playwright install chromium`（首次）

采样前会 **`await __SIM__.preloadAllAppStores()`**：用与构建时一致的 glob 预加载全部
`apps/*/state.ts`、`system/*/state.ts`，让各 App 的 Zustand 在 storeRegistry 里注册。
仅靠 `warmUpAllApps` 时，lazy  chunk 在 headless 里往往来不及在固定等待时间内加载完，
所以 `getState().apps` 会远少于你在浏览器里手动点开过的 App。

可选 `--warm-ui`：在预加载之后再调用 `warmUpAllApps()`（挂载各 Task，较重）。

用法：
    python scripts/dev/dump_app_state_schema.py
    python scripts/dev/dump_app_state_schema.py --url http://localhost:3000
    python scripts/dev/dump_app_state_schema.py --out docs/api/app-state-schema.md
    python scripts/dev/dump_app_state_schema.py --settle-ms 2000
    python scripts/dev/dump_app_state_schema.py --warm-ui
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]

from playwright.sync_api import sync_playwright

# preload（及可选 warmUp）之后再等待 persist 等收尾的时间（毫秒）
DEFAULT_SETTLE_MS = 1200

# App 显示名称
APP_DISPLAY_NAMES = {
    "wechat": "微信",
    "bilibili": "哔哩哔哩",
    "x": "X (Twitter)",
    "redbook": "小红书",
    "map": "地图",
    "notes": "备忘录",
    "qqmusic": "QQ音乐",
    "wechat_reading": "微信读书",
    "tencent_meeting": "腾讯会议",
    "weather": "天气",
    "calculator": "计算器",
    "browser": "浏览器",
}


def fetch_state_from_server(url: str, settle_ms: int, warm_ui: bool) -> Dict[str, Any]:
    """从运行中的服务获取 __SIM__.getState()（先 preload 全部 state.ts，可选再 warmUp UI）"""
    print(f"🌐 连接到 {url}...\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=90_000)
            page.wait_for_function(
                "() => window.__SIM__ && typeof window.__SIM__.getState === 'function'",
                timeout=30_000,
            )
            page.wait_for_function(
                "() => typeof window.__SIM__.preloadAllAppStores === 'function'",
                timeout=10_000,
            )

            n_stores = page.evaluate(
                """async () => {
                  await window.__SIM__.preloadAllAppStores();
                  return Object.keys(window.__SIM__.getState().apps || {}).length;
                }"""
            )
            print(f"📦 已 preloadAllAppStores()，当前 getState().apps 含 {n_stores} 个条目")

            if warm_ui:
                n_installed = page.evaluate(
                    """() => {
                      const n = window.__SIM__.getState().os.installedApps.length;
                      window.__SIM__.warmUpAllApps();
                      return n;
                    }"""
                )
                print(f"📲 已 warmUpAllApps()（{n_installed} 个已安装包）")

            print(f"⏳ 再等待 {settle_ms}ms（persist / 渲染收尾）…\n")
            page.wait_for_timeout(settle_ms)

            state = page.evaluate("() => window.__SIM__.getState()")
            print("✅ 成功获取 __SIM__.getState()\n")
            return state
        finally:
            browser.close()


def analyze_structure(obj: Any, prefix: str = "", max_depth: int = 5, current_depth: int = 0) -> List[Dict]:
    """分析对象结构，返回路径列表"""
    paths = []
    
    if current_depth >= max_depth or obj is None:
        return paths
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            full_path = f"{prefix}.{key}" if prefix else key
            
            if isinstance(value, dict):
                paths.append({"path": full_path, "type": "object"})
                paths.extend(analyze_structure(value, full_path, max_depth, current_depth + 1))
            elif isinstance(value, list):
                if len(value) > 0 and isinstance(value[0], dict):
                    paths.append({"path": full_path, "type": "array<object>", "count": len(value)})
                    paths.extend(analyze_structure(value[0], f"{full_path}[]", max_depth, current_depth + 1))
                elif len(value) > 0:
                    item_type = type(value[0]).__name__
                    paths.append({"path": full_path, "type": f"array<{item_type}>", "count": len(value)})
                else:
                    paths.append({"path": full_path, "type": "array", "count": 0})
            else:
                value_type = type(value).__name__
                example = ""
                if isinstance(value, str) and len(value) > 0:
                    # 将换行符替换为空格，然后截断
                    clean_value = value.replace('\n', ' ').replace('\r', '').strip()
                    # 移除连续空格
                    while '  ' in clean_value:
                        clean_value = clean_value.replace('  ', ' ')
                    # 转义 Markdown 表格特殊字符
                    clean_value = clean_value.replace('|', '\\|')
                    if len(clean_value) < 50:
                        example = clean_value
                    else:
                        example = clean_value[:47] + "..."
                elif isinstance(value, (int, float, bool)):
                    example = str(value)
                paths.append({"path": full_path, "type": value_type, "example": example})
    
    return paths


def generate_markdown(state: Dict[str, Any]) -> str:
    """Generate the Markdown schema reference."""
    lines = []
    today = datetime.now().strftime("%Y-%m-%d")
    
    lines.append("# App State Schema")
    lines.append("")
    lines.append(
        f"> Generated by `scripts/dev/dump_app_state_schema.py` on {today} "
        "from a running simulator via `__SIM__.getState()`."
    )
    lines.append("")
    lines.append("> Do not edit this file by hand. Regenerate it with:")
    lines.append(">")
    lines.append("> ```bash")
    lines.append("> python scripts/dev/dump_app_state_schema.py")
    lines.append("> ```")
    lines.append("")
    lines.append("This document describes the live structure returned by `__SIM__.getState()`.")
    lines.append("")
    
    # OS state
    lines.append("## OS State")
    lines.append("")
    lines.append("```javascript")
    lines.append("const os = __SIM__.getState().os;")
    lines.append("```")
    lines.append("")
    
    if state.get("os"):
        os_paths = analyze_structure(state["os"], "", 3)
        lines.append("| Path | Type | Example |")
        lines.append("|------|------|------|")
        for item in os_paths:
            example = f"`{item['example']}`" if item.get("example") else (f"({item['count']} items)" if "count" in item else "")
            item_type = item['type'].replace('<', '&lt;').replace('>', '&gt;')
            lines.append(f"| `os.{item['path']}` | {item_type} | {example} |")
        lines.append("")
    
    # Apps overview
    lines.append("## Apps Overview")
    lines.append("")
    lines.append("```javascript")
    lines.append("const apps = __SIM__.getState().apps;")
    lines.append("```")
    lines.append("")
    
    apps = state.get("apps", {})
    app_ids = list(apps.keys())
    
    lines.append("| App ID | Display name | Top-level fields |")
    lines.append("|--------|------|----------|")
    
    for app_id in app_ids:
        display_name = APP_DISPLAY_NAMES.get(app_id, app_id)
        app_state = apps.get(app_id, {})
        top_fields = ", ".join(app_state.keys()) if app_state else "-"
        lines.append(f"| `{app_id}` | {display_name} | `{top_fields}` |")
    lines.append("")
    
    # Per-app fields
    lines.append("## Per-App State Fields")
    lines.append("")
    
    for app_id in app_ids:
        display_name = APP_DISPLAY_NAMES.get(app_id, app_id)
        app_state = apps.get(app_id, {})
        
        lines.append(f"### {display_name} (`{app_id}`)")
        lines.append("")
        lines.append("**Access:**")
        lines.append("```javascript")
        lines.append(f"const state = __SIM__.getState().apps.{app_id};")
        lines.append("```")
        lines.append("")
        
        if not app_state:
            lines.append("> This app currently exposes no state data.")
            lines.append("")
            continue
        
        paths = analyze_structure(app_state, "", 5)
        
        if paths:
            lines.append("**Fields:**")
            lines.append("")
            lines.append("| Path | Type | Example / count |")
            lines.append("|------|------|----------|")
            
            for item in paths:
                extra = ""
                if item.get("example"):
                    extra = f"`{item['example']}`"
                elif "count" in item:
                    extra = f"({item['count']} items)"
                # 转义类型中的 < > 防止被当作 HTML 标签
                item_type = item['type'].replace('<', '&lt;').replace('>', '&gt;')
                lines.append(f"| `{item['path']}` | {item_type} | {extra} |")
            lines.append("")
    
    # Usage examples
    lines.append("## Usage Examples")
    lines.append("")
    lines.append("### JavaScript: Read State")
    lines.append("```javascript")
    lines.append("// Read the full snapshot.")
    lines.append("const state = __SIM__.getState();")
    lines.append("")
    lines.append("// Read OS state.")
    lines.append("console.log(state.os.activeAppId);       // Current app")
    lines.append("console.log(state.os.runningApps);       // Running apps")
    lines.append("")
    lines.append("// Read WeChat user state.")
    lines.append("console.log(state.apps.wechat.user.name);")
    lines.append("console.log(state.apps.wechat.user.settings.privacy);")
    lines.append("```")
    lines.append("")
    lines.append("### Python (eval_state.py / judger.py)")
    lines.append("```python")
    lines.append("def check_task(input):")
    lines.append('    # input comes from _build_judge_input()')
    lines.append('    route = input["route"]')
    lines.append('    apps = input["apps"]')
    lines.append('    os_state = input["os"]')
    lines.append("    ")
    lines.append("    # Check the route.")
    lines.append('    if route.get("path") != "/settings":')
    lines.append("        return False")
    lines.append("    ")
    lines.append("    # Check WeChat user settings.")
    lines.append('    wechat = apps.get("wechat", {})')
    lines.append('    privacy = wechat.get("user", {}).get("settings", {}).get("privacy", {})')
    lines.append('    return privacy.get("momentsRange") == "最近三天"')
    lines.append("```")
    lines.append("")
    
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Dump the live app state schema from a running simulator")
    parser.add_argument("--url", default="http://localhost:3000", help="Simulator URL")
    parser.add_argument(
        "--out",
        default=str(REPO_ROOT / "docs" / "api" / "app-state-schema.md"),
        help="Output Markdown path",
    )
    parser.add_argument(
        "--settle-ms",
        type=int,
        default=DEFAULT_SETTLE_MS,
        help=f"preload（及可选 warmUp）之后等待稳定的毫秒数（默认 {DEFAULT_SETTLE_MS}）",
    )
    parser.add_argument(
        "--warm-ui",
        action="store_true",
        help="预加载 store 后再调用 warmUpAllApps()（创建全部 Task，较慢）",
    )
    args = parser.parse_args()
    
    print("🔍 从运行中的服务获取 __SIM__.getState()...\n")
    
    try:
        state = fetch_state_from_server(args.url, args.settle_ms, args.warm_ui)
        
        # 生成 Markdown
        markdown = generate_markdown(state)
        
        # 写入文件
        output_path = Path(args.out).resolve()
        output_path.write_text(markdown, encoding="utf-8")
        
        print(f"✅ 已生成: {output_path}\n")
        
        # 显示摘要
        apps = state.get("apps", {})
        print("📊 摘要:")
        print(f"   - OS 状态: {len(state.get('os', {}))} 个字段")
        print(f"   - Apps: {len(apps)} 个")
        for app_id, app_state in apps.items():
            field_count = len(app_state) if app_state else 0
            print(f"     - {app_id}: {field_count} 个顶层字段")
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        print("\n请确保:")
        print("  1. 已运行 `npm run dev` 启动服务")
        print(f"  2. 服务运行在 {args.url}")
        sys.exit(1)


if __name__ == "__main__":
    main()
