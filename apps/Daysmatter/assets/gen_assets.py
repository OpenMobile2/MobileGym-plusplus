# -*- coding: utf-8 -*-
"""
倒数日 Days Matter 装饰位图批量生成器(pipeline v3 §5.3)。

- 仅生成合成装饰图(本子封面/木纹背景/插画),真机截图绝不作为输入。
- 幂等:已存在且 >10KB 的 PNG 跳过;失败下次重跑补齐。
- 4 并发,指数退避重试。用标准库 urllib,无第三方依赖。

环境变量:
  IMAGE_GEN_API_KEY  生图 key(必填)
  IMAGE_GEN_BASE_URL endpoint(默认 https://example.invalid/v1)
  IMAGE_GEN_MODEL    模型(默认 gpt-image-2)
运行: python apps/Daysmatter/assets/gen_assets.py
"""
import base64
import json
import os
import random
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE = Path(__file__).parent
MODEL = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
MAX_RETRY = 5


def gen_url():
    base = os.environ.get("IMAGE_GEN_BASE_URL", "http://15.204.107.114:3009").rstrip("/")
    return base + ("/images/generations" if base.endswith("/v1") else "/v1/images/generations")


def api_key():
    k = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
    if not k:
        print("ERROR: 未设置 IMAGE_GEN_API_KEY", file=sys.stderr)
        sys.exit(1)
    return k


# id -> (子目录, 尺寸, 主体描述)
COVER_STYLE = "扁平极简手机 App 倒数本封面插画,居中构图,纯色干净背景,质感细腻,无任何文字、无水印、无logo"
ASSETS = {
    # 本子封面(竖版书本封面)
    "cover_life":    ("covers", "1024x1024", "棕色皮革质感的笔记本封面,温暖复古,系带装饰," + COVER_STYLE),
    "cover_work":    ("covers", "1024x1024", "深蓝色星空主题封面,点缀小星星与流星,夜空感," + COVER_STYLE),
    "cover_anniv":   ("covers", "1024x1024", "粉色背景,一个简约可爱的庆祝蛋糕图案,温馨节日主题," + COVER_STYLE),
    "cover_rocket":  ("covers", "1024x1024", "黑板风格深色封面,白色线描航天火箭涂鸦," + COVER_STYLE),
    "cover_travel":  ("covers", "1024x1024", "蓝绿色地球与旅行元素,世界地图轮廓,清新," + COVER_STYLE),
    "cover_warm":    ("covers", "1024x1024", "暖橙米色渐变极简封面,柔和光晕,温馨," + COVER_STYLE),
    "cover_green":   ("covers", "1024x1024", "墨绿色简约封面,植物叶片剪影,沉静," + COVER_STYLE),
    "cover_star":    ("covers", "1024x1024", "明黄色封面,一颗大星星图案,活泼可爱," + COVER_STYLE),
    # 背景木纹
    "bg_wood_light": ("bg", "1024x1024", "暖橙黄色木地板纹理,竖向木纹,温暖明亮"),
    "bg_wood_dark":  ("bg", "1024x1024", "深棕色胡桃木地板纹理,竖向木纹,温暖"),
    # 杂项装饰
    "discover_travel": ("misc", "1024x1024", "绿色山谷与远山自然风景,柔和晨光,治愈系,无任何文字、无水印、无logo"),
    "widget_sky":      ("misc", "1024x1024", "明亮蓝天与蓬松白云摄影,清新治愈,无任何文字、无水印"),
    "pro_hero":        ("misc", "1024x1024", "日历 App 高级版宣传插画,扁平风格,日历图标与星星彩带,浅色背景,无任何文字、无水印、无logo"),
}


def gen_one(key, asset_id, subdir, size, prompt):
    out = BASE / subdir / f"{asset_id}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {asset_id}(已存在)"
    url = gen_url()
    payload = json.dumps({"model": MODEL, "prompt": prompt, "size": size, "n": 1}).encode()
    last = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            req = urllib.request.Request(
                url, data=payload,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=200) as r:
                d = json.load(r)
            item = d.get("data", [{}])[0]
            if item.get("b64_json"):
                img = base64.b64decode(item["b64_json"])
            elif item.get("url"):
                with urllib.request.urlopen(item["url"], timeout=90) as resp:
                    img = resp.read()
            else:
                raise RuntimeError("无 b64_json/url")
            out.write_bytes(img)
            return f"ok   {asset_id}({len(img)//1024}KB,第{attempt}次)"
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"{asset_id} 重试{MAX_RETRY}次失败: {str(last)[:140]}")


def main():
    key = api_key()
    failed = []
    with ThreadPoolExecutor(max_workers=2) as ex:
        futs = {
            ex.submit(gen_one, key, aid, sub, size, prompt): aid
            for aid, (sub, size, prompt) in ASSETS.items()
        }
        for fut in as_completed(futs):
            aid = futs[fut]
            try:
                print(fut.result(), flush=True)
            except Exception as e:  # noqa: BLE001
                failed.append(aid)
                print(f"FAIL {aid}: {str(e)[:160]}", flush=True)
    done = sum(1 for sub, _, _ in {v[0]: v for v in ASSETS.values()}.values()
               for _ in [])
    total = len(ASSETS)
    have = sum(1 for aid, (sub, _, _) in ASSETS.items()
               if (BASE / sub / f"{aid}.png").exists())
    print(f"\n完成 {have}/{total}", flush=True)
    if failed:
        print(f"失败(重跑补齐): {failed}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
