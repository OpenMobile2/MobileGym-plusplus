#!/usr/bin/env python3
"""生成秒送门店 logo 贴图(离线,不依赖生图 API)。

真实 App 里门店头像多为「品牌色底 + 品牌字」的方形标,用 PIL 直接绘制即可,
不需要走 pipeline §5.3 的批量生图(那条链路留给商品实拍图)。

用法: python3 apps/Jingdong/assets/gen_shop_logos.py
输出: apps/Jingdong/assets/logos/l_<key>.png  (512x512)
幂等:已存在则跳过,加 --force 覆盖。
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logos")
SIZE = 512
FONT_CANDIDATES = [
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Supplemental/Songti.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
]

# key, 主字, 副字(拉丁/说明), 背景色, 副字色
LOGOS = [
    ("hema", "盒马", "鲜生 FRESHIPPO", "#1B62E0", "#CFE0FF"),
    ("qixian", "七鲜", "京东自营 SEVEN FRESH", "#0BA05A", "#CDEFDD"),
    ("yonghui", "永辉", "超市 YONGHUI", "#E1251B", "#FFD6D2"),
    ("family", "全家", "FamilyMart", "#1E8C3A", "#D6F0DC"),
    ("watsons", "屈臣氏", "WATSONS", "#00A551", "#CFF0DF"),
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    raise SystemExit("错误: 找不到可用的中文字体,请在 FONT_CANDIDATES 里补一个路径")


def draw_logo(main: str, sub: str, bg: str, sub_color: str) -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), bg)
    d = ImageDraw.Draw(img)

    # 主字:按字数自适应,居中偏上
    main_size = 190 if len(main) <= 2 else 140
    f_main = load_font(main_size)
    box = d.textbbox((0, 0), main, font=f_main)
    d.text(
        ((SIZE - (box[2] - box[0])) / 2 - box[0], SIZE * 0.30 - (box[3] - box[1]) / 2 - box[1]),
        main,
        font=f_main,
        fill="#FFFFFF",
    )

    # 分隔细线
    d.rectangle([SIZE * 0.32, SIZE * 0.55, SIZE * 0.68, SIZE * 0.55 + 4], fill=sub_color)

    # 副字:小号,自动缩到一行
    sub_size = 52
    while sub_size > 18:
        f_sub = load_font(sub_size)
        box = d.textbbox((0, 0), sub, font=f_sub)
        if box[2] - box[0] <= SIZE * 0.86:
            break
        sub_size -= 4
    box = d.textbbox((0, 0), sub, font=f_sub)
    d.text(
        ((SIZE - (box[2] - box[0])) / 2 - box[0], SIZE * 0.70 - (box[3] - box[1]) / 2 - box[1]),
        sub,
        font=f_sub,
        fill=sub_color,
    )
    return img


def main() -> None:
    force = "--force" in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)
    for key, main_txt, sub_txt, bg, sub_color in LOGOS:
        path = os.path.join(OUT_DIR, f"l_{key}.png")
        if os.path.exists(path) and not force:
            print(f"skip  {path}")
            continue
        draw_logo(main_txt, sub_txt, bg, sub_color).save(path)
        print(f"saved {path}")


if __name__ == "__main__":
    main()
