# -*- coding: utf-8 -*-
"""
商品图生成器(pipeline 资产工具,可复用到其他 app)

用 gpt-image-2 为 defaults.json 中的商品生成电商风格主图,替换 SVG 占位。
- 幂等:已存在的 PNG 跳过,失败的下次重跑补齐
- 并发 4 线程,单张超时 120s
运行: python apps/Taobao/assets/gen_item_images.py
环境变量: IMAGE_GEN_API_KEY(推荐) 或 TOKENHUB_API_KEY; 可选 IMAGE_GEN_BASE_URL / IMAGE_GEN_MODEL
"""
import base64
import random
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(_REPO_ROOT / "tools"))
from image_gen_client import make_image_client  # noqa: E402

OUT_DIR = Path(__file__).parent / "items"
OUT_DIR.mkdir(exist_ok=True)

client = None

STYLE = (
    "电商商品主图,专业产品摄影,浅色干净背景,柔和棚拍打光,商品居中占画面主体,"
    "高清细节,无任何文字、无水印、无logo"
)

# 商品 id → 主体描述(与 defaults.json 的商品一一对应)
PROMPTS = {
    "i_handcream": "一支奶白色磨砂质感的高端护手霜软管,旁边放置山雾色调的简约纸盒包装,自然植物点缀",
    "i_bodywash": "一瓶500mL琥珀棕色玻璃质感沐浴露,黑色泵头,极简标签设计,浴室石材台面",
    "i_serum": "一瓶30mL棕色玻璃精华液滴管瓶,高级护肤品质感,水珠点缀",
    "i_alarm": "一台曜石黑色的方形智能闹钟,圆角设计,LED屏显示07:12,放在木质床头柜上",
    "i_earbuds": "一副白色真无线蓝牙耳机和充电盒,开盖摆放,简约科技感",
    "i_cable": "一根编织材质的Type-C快充数据线,整齐盘绕,深灰色",
    "i_hoodie": "一件白灰色华夫格面料宽松卫衣,平铺拍摄,质感细腻",
    "i_jeans": "一条浅蓝色高腰直筒牛仔裤,平铺拍摄,版型挺括",
    "i_tee": "一件纯棉白色短袖T恤,胸前简约小印花,平铺拍摄",
    "i_nuts": "一盒每日坚果礼盒,打开展示30个独立小包装,腰果核桃巴旦木散落点缀",
    "i_tea": "一盒冷泡茶组合装,彩色三角茶包整齐排列,旁边一杯泡好的水果茶",
    "i_lamp": "一盏原木色护眼台灯,圆形灯头,极简北欧风,书桌场景",
    "i_tissue": "一提24包装的有香手帕纸,山茶花图案包装,白绿色调",
    "i_bottle": "一只奶白色316不锈钢焖烧保温杯,哑光质感,旁边放杯盖",
    "i_sneaker": "一双黑色轻量跑步鞋,侧面45度角拍摄,流线型鞋身,白色缓震底",
    "i_yogamat": "一卷半展开的雾紫色加厚瑜伽垫,表面纹理清晰",
    "i_jacket": "一件浅杏色轻薄防晒皮肤衣外套,带帽,平铺拍摄,面料轻盈",
    "i_giftbox": "一个高端护肤品周年礼盒,打开展示护手霜和香氛蜡烛,丝带点缀,节日氛围",
}


MAX_RETRY = 3


def gen_one(item_id: str, desc: str) -> str:
    out = OUT_DIR / f"{item_id}.png"
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {item_id}(已存在)"
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            result = client.images.generate(
                model="gpt-image-2",
                prompt=f"{desc},{STYLE}",
                n=1,
                size="1024x1024",
                timeout=120,
            )
            item = result.data[0]
            if getattr(item, "b64_json", None):
                image_bytes = base64.b64decode(item.b64_json)
            elif getattr(item, "url", None):
                with urllib.request.urlopen(item.url, timeout=60) as resp:
                    image_bytes = resp.read()
            else:
                raise RuntimeError("API 既没返回 b64_json 也没返回 url")
            out.write_bytes(image_bytes)
            return f"ok   {item_id}({len(image_bytes)//1024}KB, 第{attempt}次)"
        except Exception as e:  # noqa: BLE001
            last_err = e
            # 网关偶发 404/限流:指数退避 + 抖动后重试
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"重试{MAX_RETRY}次仍失败: {str(last_err)[:140]}")


DETAIL_STYLE = (
    "电商详情页场景图,竖版构图,商品在真实使用场景中,生活方式摄影,"
    "自然光,氛围感,无任何文字、无水印、无logo"
)


def gen_detail(item_id: str, desc: str) -> str:
    out = OUT_DIR / f"{item_id}_d.png"
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {item_id}_d(已存在)"
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            result = client.images.generate(
                model="gpt-image-2",
                prompt=f"{desc},{DETAIL_STYLE}",
                n=1,
                size="1024x1536",
                timeout=120,
            )
            item = result.data[0]
            if getattr(item, "b64_json", None):
                image_bytes = base64.b64decode(item.b64_json)
            elif getattr(item, "url", None):
                with urllib.request.urlopen(item.url, timeout=60) as resp:
                    image_bytes = resp.read()
            else:
                raise RuntimeError("API 既没返回 b64_json 也没返回 url")
            out.write_bytes(image_bytes)
            return f"ok   {item_id}_d({len(image_bytes)//1024}KB, 第{attempt}次)"
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"重试{MAX_RETRY}次仍失败: {str(last_err)[:140]}")


ANGLE_STYLE = (
    "电商商品图,产品另一角度或细节特写,专业产品摄影,浅色干净背景,"
    "与主图同一商品同一风格,无任何文字、无水印、无logo"
)


def gen_angle(item_id: str, desc: str) -> str:
    out = OUT_DIR / f"{item_id}_2.png"
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {item_id}_2(已存在)"
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            result = client.images.generate(
                model="gpt-image-2", prompt=f"{desc},{ANGLE_STYLE}",
                n=1, size="1024x1024", timeout=120)
            item = result.data[0]
            if getattr(item, "b64_json", None):
                image_bytes = base64.b64decode(item.b64_json)
            elif getattr(item, "url", None):
                with urllib.request.urlopen(item.url, timeout=60) as resp:
                    image_bytes = resp.read()
            else:
                raise RuntimeError("API 既没返回 b64_json 也没返回 url")
            out.write_bytes(image_bytes)
            return f"ok   {item_id}_2({len(image_bytes)//1024}KB, 第{attempt}次)"
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"重试{MAX_RETRY}次仍失败: {str(last_err)[:140]}")


def main():
    global client
    client = make_image_client()

    failed = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(gen_one, iid, d): iid for iid, d in PROMPTS.items()}
        futs |= {ex.submit(gen_detail, iid, d): f"{iid}_d" for iid, d in PROMPTS.items()}
        futs |= {ex.submit(gen_angle, iid, d): f"{iid}_2" for iid, d in PROMPTS.items()}
        for fut in as_completed(futs):
            iid = futs[fut]
            try:
                print(fut.result(), flush=True)
            except Exception as e:  # noqa: BLE001
                failed.append(iid)
                print(f"FAIL {iid}: {str(e)[:160]}", flush=True)
    done = len([f for f in OUT_DIR.glob('*.png') if f.stat().st_size > 10_000])
    print(f"\n完成: {done}/{len(PROMPTS)}", flush=True)
    if failed:
        print(f"失败(重跑本脚本可补齐): {failed}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
