# -*- coding: utf-8 -*-
"""
defaults.json 图片引用落地脚本(幂等,可重复跑)。
- 扫描 defaults.json 中全部图片引用字段(形如 poster_*/still_*/avatar_*/actor_*/goods_*/banner_*,
  可带 .png/.svg 后缀);
- res/img/<id>.png 存在 → 引用改写为 "<id>.png";
- PNG 缺失 → 生成简洁 SVG 占位(品牌色渐变 + 引用名短标)到 res/img/<id>.svg,引用改写为 "<id>.svg";
- 跑完保证 defaults.json 所有图片字段都指向 res/img/ 下真实存在的文件。
运行:
  python apps/Tencentvideo/data/regen_defaults.py
"""
import json
import re
from pathlib import Path

DATA = Path(__file__).parent / "defaults.json"
IMG_DIR = Path(__file__).parent.parent / "res" / "img"

REF_RE = re.compile(r"^(poster|still|avatar|actor|goods|banner)_[a-z0-9_]+(\.(png|svg))?$")

# 按前缀给占位图定尺寸与配色(品牌色:主 #06BFB8 / VIP金 #FEDF8B / 角标橙红 #FF6510 / 深底 #010101)
STYLE = {
    "poster": (400, 600, "#06BFB8", "#0a4a52"),
    "still": (640, 360, "#0a4a52", "#010101"),
    "banner": (640, 360, "#FF6510", "#7a2400"),
    "avatar": (200, 200, "#06BFB8", "#FEDF8B"),
    "actor": (200, 200, "#FEDF8B", "#FF6510"),
    "goods": (400, 400, "#FEDF8B", "#06BFB8"),
}


def make_svg(img_id: str) -> str:
    prefix = img_id.split("_", 1)[0]
    w, h, c1, c2 = STYLE.get(prefix, (400, 400, "#06BFB8", "#0a4a52"))
    label = img_id.split("_", 1)[1] if "_" in img_id else img_id
    fs = max(12, w // 20)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
        f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>'
        f'<rect width="{w}" height="{h}" fill="url(#g)"/>'
        f'<circle cx="{w * 0.82:.0f}" cy="{h * 0.18:.0f}" r="{min(w, h) * 0.28:.0f}" fill="#ffffff" opacity="0.12"/>'
        f'<circle cx="{w * 0.16:.0f}" cy="{h * 0.85:.0f}" r="{min(w, h) * 0.2:.0f}" fill="#ffffff" opacity="0.08"/>'
        f'<text x="{w / 2:.0f}" y="{h / 2:.0f}" fill="#ffffff" opacity="0.85" font-size="{fs}" '
        f'font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle">{label}</text>'
        f'</svg>'
    )


def resolve(ref: str, stats: dict) -> str:
    img_id = re.sub(r"\.(png|svg)$", "", ref)
    if (IMG_DIR / f"{img_id}.png").exists() and (IMG_DIR / f"{img_id}.png").stat().st_size > 0:
        stats["png"] += 1
        return f"{img_id}.png"
    svg_path = IMG_DIR / f"{img_id}.svg"
    if not svg_path.exists():
        svg_path.parent.mkdir(parents=True, exist_ok=True)
        svg_path.write_text(make_svg(img_id), encoding="utf-8")
        stats["svg_new"] += 1
    stats["svg"] += 1
    return f"{img_id}.svg"


def walk(node, stats):
    if isinstance(node, dict):
        return {k: walk(v, stats) for k, v in node.items()}
    if isinstance(node, list):
        return [walk(v, stats) for v in node]
    if isinstance(node, str) and REF_RE.match(node):
        return resolve(node, stats)
    return node


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    stats = {"png": 0, "svg": 0, "svg_new": 0}
    data = walk(data, stats)
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # 校验:全部引用可解析为 res/img 下存在的文件
    missing = []

    def verify(node):
        if isinstance(node, dict):
            for v in node.values():
                verify(v)
        elif isinstance(node, list):
            for v in node:
                verify(v)
        elif isinstance(node, str) and REF_RE.match(node):
            if not (IMG_DIR / node).exists():
                missing.append(node)

    verify(data)
    print(f"refs -> png:{stats['png']} svg:{stats['svg']} (new svg:{stats['svg_new']}) missing:{len(missing)}")
    if missing:
        raise SystemExit(f"未解析引用: {missing[:10]}")


if __name__ == "__main__":
    main()
