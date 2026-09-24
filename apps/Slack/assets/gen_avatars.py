#!/usr/bin/env python3
"""生成 Slack 团队成员圆角方形头像 SVG（pipeline §5.3，无需外部 API）。"""
from pathlib import Path

OUT = Path(__file__).parent / "avatars"
OUT.mkdir(parents=True, exist_ok=True)

# 底色与装饰色（对齐 res/colors AVATAR_COLORS）
SPECS = [
    ("u_me", "#611E68", "#E8B4F0", "H"),
    ("u_lin", "#1264A3", "#B8D4F0", "林"),
    ("u_chen", "#007A5A", "#B8E8D4", "陈"),
    ("u_su", "#C01343", "#F0B8C8", "苏"),
    ("u_wu", "#E01E5A", "#F0C0D0", "吴"),
    ("u_mei", "#0D7C6B", "#B8E0D8", "梅"),
    ("u_slackbot", "#4A154B", "#D8C8E0", "S"),
]


def svg(user_id: str, bg: str, accent: str, label: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{accent};stop-opacity:0.85" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#g)" />
  <circle cx="100" cy="78" r="32" fill="rgba(255,255,255,0.35)" />
  <ellipse cx="100" cy="155" rx="52" ry="38" fill="rgba(255,255,255,0.28)" />
  <text x="100" y="108" text-anchor="middle" font-size="42" font-weight="600"
        fill="rgba(255,255,255,0.9)" font-family="system-ui,sans-serif">{label}</text>
</svg>
"""


def main():
    for uid, bg, accent, label in SPECS:
        path = OUT / f"{uid}.svg"
        path.write_text(svg(uid, bg, accent, label), encoding="utf-8")
        print(f"ok {path.name}")


if __name__ == "__main__":
    main()
