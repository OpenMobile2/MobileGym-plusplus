# -*- coding: utf-8 -*-
"""
16:9 剧照批量裁切:没有独立剧照的内容,从它自己的 2:3 竖版海报里裁一条 16:9 横带出来。

为什么裁而不是生图:剧照只是装饰位,复刻验收看的是外观骨架/状态流转/数据一致性,
不值得为 64 张装饰图去烧生图额度(主线程与用户确认过)。裁切保证每部片的剧照与海报
同源同色调,列表页与详情页看起来是同一部片。

裁切口径:海报 480x720,取 width 全宽、height = width*9/16 = 270 的横带,
纵向落点在 40% 处(海报主体一般偏上,居中裁会切到下半部的空档),再按边界夹紧。
依赖 macOS 自带 sips,不引第三方库。幂等:已存在的 still 跳过。

运行:python3 apps/Tencentvideo/assets/crop_stills.py
"""
import json
import subprocess
from pathlib import Path

APP = Path(__file__).parent.parent
IMG = APP / "res" / "img"
DEFAULTS = APP / "data" / "defaults.json"

VERTICAL_ANCHOR = 0.40


def size_of(path: Path):
    out = subprocess.run(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    w = h = 0
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("pixelWidth:"):
            w = int(line.split(":")[1])
        elif line.startswith("pixelHeight:"):
            h = int(line.split(":")[1])
    return w, h


def crop_16_9(src: Path, dst: Path):
    w, h = size_of(src)
    crop_h = round(w * 9 / 16)
    if crop_h > h:  # 海报本来就够扁,退化成居中裁满高
        crop_h = h
    offset_y = round(h * VERTICAL_ANCHOR - crop_h / 2)
    offset_y = max(0, min(offset_y, h - crop_h))
    subprocess.run(
        ["sips", "-c", str(crop_h), str(w), "--cropOffset", str(offset_y), "0",
         str(src), "--out", str(dst)],
        capture_output=True, check=True,
    )


def main():
    data = json.loads(DEFAULTS.read_text(encoding="utf-8"))
    made, skipped, no_poster = 0, 0, []
    for c in data["contents"]:
        if c.get("still"):
            skipped += 1
            continue
        poster = c.get("poster")
        src = IMG / poster if poster else None
        if src is None or not src.exists():
            no_poster.append(c["id"])
            continue
        name = f"still_{c['id']}.png"
        dst = IMG / name
        if not dst.exists():
            crop_16_9(src, dst)
        c["still"] = name
        made += 1
    DEFAULTS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"cropped={made} already_had_still={skipped} no_poster={no_poster}")


if __name__ == "__main__":
    main()
