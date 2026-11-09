#!/usr/bin/env python3
"""Idempotent batch generator for Qunaer decorative bitmap assets.

Prompts contain synthetic subjects only. Real screenshots and recordings are
never uploaded, per pipeline §5.3.
"""
from __future__ import annotations

import base64
import random
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(REPO_ROOT / "tools"))

from image_gen_client import image_gen_model, make_image_client  # noqa: E402

OUT = Path(__file__).parent / "images"
OUT.mkdir(parents=True, exist_ok=True)
CLIENT = None
MAX_RETRY = 3

PROMPTS = {
    "hotel_1": "现代城市五星级酒店高层塔楼，蓝调傍晚，入口灯光温暖，正面广角",
    "hotel_2": "典雅中式城市酒店外观，金色室内灯光，整洁街景，傍晚",
    "hotel_3": "精品设计酒店客房，大床，原木与米白软装，落地窗自然光",
    "hotel_4": "高层酒店豪华客房，双床，城市天际线窗景，干净明亮",
    "hotel_5": "江南园林风度假酒店，白墙黛瓦，庭院水景，晴朗夏日",
    "hotel_6": "青年旅舍现代多人公共空间，原木家具，明亮整洁，无人物特写",
    "scenic_1": "中国城市大型欢乐主题乐园入口，色彩活泼的游乐设施，晴天",
    "scenic_2": "南京风格古典园林景区，红墙绿树，石板路，清晨柔光",
    "scenic_3": "宏伟山岳自然景区，云雾松林，夏日绿色，航拍广角",
    "scenic_4": "中国历史文化景区石牌坊与古建筑群，蓝天，游客稀少",
    "scenic_5": "现代海洋馆蓝色水族隧道，鱼群，沉浸式灯光",
    "scenic_6": "湖畔城市夜景游船，灯光倒影，宁静蓝紫色夜幕",
    "world_1": "年轻旅行者在海边悬崖眺望碧蓝海湾，夏日自然光，背影",
    "world_2": "江南古镇河道与乌篷船，白墙黛瓦，清晨薄雾",
    "world_3": "西北草原公路穿过辽阔群山，旅行摄影，晴朗高云",
    "world_4": "城市夜市小吃摊暖色灯光，人群虚化，纪实旅行摄影",
    "world_5": "亲子旅行家庭在森林步道散步，远景，柔和阳光",
    "world_6": "热带海岛白沙滩与透明海水，俯拍，度假旅行摄影",
    "homestay_1": "海边现代白色民宿，露台和落地窗，清晨阳光",
    "homestay_2": "山林木屋民宿，露台面对绿色峡谷，自然光",
    "homestay_3": "城市高级公寓民宿客厅，奶油风软装，整洁明亮",
    "homestay_4": "古镇庭院民宿，木门石阶和绿植，安静雅致",
    "car_1": "白色紧凑型轿车，三分之二前视角，干净浅灰摄影棚背景",
    "car_2": "蓝色新能源小型车，三分之二前视角，干净浅灰摄影棚背景",
    "car_3": "黑色豪华商务MPV，三分之二前视角，干净浅灰摄影棚背景",
    "car_4": "银灰色中型SUV，三分之二前视角，干净浅灰摄影棚背景",
    "tour_1": "云南雪山湖泊旅行线路风光，蓝天白云，明亮旅行摄影",
    "tour_2": "新疆草原与雪山公路旅行风光，广角，夏季",
    "tour_3": "北京历史古建筑红墙金瓦旅行风光，晴天",
    "tour_4": "东南亚热带海岛长尾船与碧蓝海水，度假摄影",
    "scenic_7": "南京城市大型主题乐园夜场灯光秀，摩天轮与彩灯，蓝紫夜幕，人气热闹",
    "scenic_8": "南京古典园林湖景公园，绿柳石桥，晴朗夏日，游人稀少",
    "world_7": "亲子家庭在主题乐园玩耍的旅行纪实，暖色调，欢乐氛围，背影为主",
    "world_8": "江南水乡古镇夜市小吃街，暖色灯笼倒影河面，纪实旅行摄影",
    "avatar_1_v2": "友善的年轻亚洲女性客服头像，纯浅色背景，自然光，真实摄影，仅头肩构图，穿纯色无标识上衣，不拿任何物品",
    "avatar_2": "友善的年轻亚洲男性旅行者头像，浅色背景，自然光，真实摄影",
    "avatar_3": "活泼的亚洲年轻女性游客头像，户外柔光，真实摄影",
    "avatar_4": "亲切的亚洲民宿房东头像，浅色背景，自然光，真实摄影",
}

STYLE = (
    "，用于中国旅行 App 的高质量列表缩略图，真实自然摄影，构图清晰，"
    "主体完整，色彩明快但不过度饱和，无任何文字、无水印、无 logo、无商标"
)


def generate_one(asset_id: str, subject: str) -> str:
    path = OUT / f"{asset_id}.png"
    if path.exists() and path.stat().st_size > 10_000:
        return f"skip {asset_id}"
    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            result = CLIENT.images.generate(
                model=image_gen_model(),
                prompt=f"{subject}{STYLE}",
                n=1,
                size="1024x1024",
                timeout=180,
            )
            item = result.data[0]
            if getattr(item, "b64_json", None):
                content = base64.b64decode(item.b64_json)
            elif getattr(item, "url", None):
                with urllib.request.urlopen(item.url, timeout=90) as response:
                    content = response.read()
            else:
                raise RuntimeError("image API returned neither b64_json nor url")
            path.write_bytes(content)
            return f"ok   {asset_id} ({len(content) // 1024}KB)"
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(2 ** attempt + random.uniform(0, 1.5))
    raise RuntimeError(f"{asset_id}: {str(last_error)[:160]}")


def main() -> None:
    global CLIENT
    CLIENT = make_image_client()
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {
            pool.submit(generate_one, asset_id, prompt): asset_id
            for asset_id, prompt in PROMPTS.items()
        }
        for future in as_completed(futures):
            asset_id = futures[future]
            try:
                print(future.result(), flush=True)
            except Exception as exc:  # noqa: BLE001
                failures.append(asset_id)
                print(f"FAIL {exc}", flush=True)
    done = sum(1 for path in OUT.glob("*.png") if path.stat().st_size > 10_000)
    print(f"done {done}/{len(PROMPTS)}", flush=True)
    if failures:
        print(f"retry by rerunning; failed={failures}", flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
