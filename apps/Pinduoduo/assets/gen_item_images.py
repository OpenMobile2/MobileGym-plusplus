# -*- coding: utf-8 -*-
"""
拼多多商品图批量生成器(pipeline v3 §5.3 资产管线)。

用 gpt-image-2 为 defaults.json 中的商品生成电商风格图,替换 SVG 占位。
- 幂等:已存在且 >10KB 的 PNG 跳过,失败下次重跑补齐
- 每商品 3 变体:主图 / _d 详情场景图(竖版)/ _2 另一角度
- 并发 8,指数退避重试;自包含(raw requests,不依赖 openai SDK)

环境变量:IMAGE_GEN_API_KEY(必填)、IMAGE_GEN_BASE_URL、IMAGE_GEN_MODEL
运行:  IMAGE_GEN_API_KEY=... IMAGE_GEN_BASE_URL=http://host:port/v1 python apps/Pinduoduo/assets/gen_item_images.py

安全红线(§5.3):prompt 只描述合成主体,禁止上传真机截图。key 只从环境变量读,禁止硬编码/提交。
"""
import base64
import os
import random
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

OUT_DIR = Path(__file__).parent / "items"
OUT_DIR.mkdir(exist_ok=True)

API_KEY = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
BASE_URL = os.environ.get("IMAGE_GEN_BASE_URL", "https://example.invalid/v1").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL", "gpt-image-2")
URL = BASE_URL + ("/images/generations" if BASE_URL.endswith("/v1") else "/v1/images/generations")

STYLE = ("电商商品主图,专业产品摄影,浅色干净背景,柔和棚拍打光,商品居中占画面主体,"
         "高清细节,无任何文字、无水印、无logo")
DETAIL_STYLE = ("电商详情页场景图,竖版构图,商品在真实使用场景中,生活方式摄影,自然光,"
                "氛围感,无任何文字、无水印、无logo")
ANGLE_STYLE = ("电商商品图,产品另一角度或细节特写,专业产品摄影,浅色干净背景,与主图同款同风格,"
               "无任何文字、无水印、无logo")

# 商品 id → 主体描述(与 data/defaults.json 商品一一对应)。拼多多低价百货风,品类多样。
PROMPTS = {
    "i_tissue":     "一提大粗卷卫生纸,18卷无芯本色卷纸,家用厕纸,塑料提袋包装,居家场景",
    "i_toycar":     "一辆黄色儿童工程玩具卡车,可拆装塑料玩具,配小工具零件,明亮童趣",
    "i_earbuds":    "一副白色真无线蓝牙耳机和充电盒,开盖摆放,简约科技感",
    "i_bodywash":   "一瓶250mL蓝绿色三合一沐浴露洗发水,泵头瓶,清爽运动风包装",
    "i_soap":       "一块檀香味传统香皂,米黄色皂体配复古花纹纸盒包装,温润质感",
    "i_shirt":      "一件浅蓝色男士短袖衬衫,平铺拍摄,棉麻质感,版型清爽",
    "i_adidas_wash":"一瓶运动品牌男士沐浴露,深蓝色大容量泵瓶,健身清爽风",
    "i_photoframe": "一个7寸原木色相框,内嵌简约风景照,竖放桌面,温馨家居",
    "i_catplush":   "一只圆润可爱的橘色胖猫毛绒玩偶,大眼睛,治愈潮玩公仔",
    "i_titanbowl":  "一只奶白色纯钛保温饭碗,哑光金属质感,配碗盖,轻量便携",
    "i_luggage":    "一个银灰色铝框拉杆行李箱,带密码指纹锁,24寸旅行箱,商务质感",
    "i_kettle":     "一台白色不锈钢电热水壶,1.7L容量,圆润机身,厨房台面场景",
    "i_scream":     "一瓶运动功能饮料,绿色透明瓶身运动盖,清凉饮品,水珠点缀",
    "i_pulse":      "一瓶蓝色维生素运动饮料,大容量塑料瓶,活力清爽",
    "i_kvass":      "一瓶琥珀色格瓦斯麦芽发酵饮料,玻璃瓶身,复古俄式风味饮品",
    "i_toothpaste": "一支抗敏感牙膏,蓝白配色软管配纸盒,口腔护理,清新",
    "i_polo":       "一件黑色男士polo翻领短袖,拼接设计,平铺拍摄,商务休闲",
    "i_freeclip":   "一副开放式耳夹蓝牙耳机,银白色C形夹式设计,配充电盒,时尚科技",
    "i_yogurt":     "一大桶原味老酸奶,4斤方桶装,乳白色,新疆风味,家庭装",
    "i_frog":       "一只绿色青蛙毛绒玩偶,戴条纹背带,搞怪可爱潮玩公仔",
}

MAX_RETRY = 3


def _post(prompt, size):
    payload = {"model": MODEL, "prompt": prompt, "size": size, "n": 1}
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    r = requests.post(URL, headers=headers, json=payload, timeout=180)
    r.raise_for_status()
    data = r.json()["data"][0]
    if data.get("b64_json"):
        return base64.b64decode(data["b64_json"])
    if data.get("url"):
        with urllib.request.urlopen(data["url"], timeout=60) as resp:
            return resp.read()
    raise RuntimeError("API 未返回 b64_json/url")


def _gen(item_id, desc, suffix, style, size):
    out = OUT_DIR / f"{item_id}{suffix}.png"
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {out.name}"
    last = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            out.write_bytes(_post(f"{desc},{style}", size))
            return f"ok   {out.name} ({out.stat().st_size // 1024}KB, 第{attempt}次)"
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"{out.name} 重试{MAX_RETRY}次失败: {str(last)[:120]}")


def main():
    if not API_KEY:
        print("错误: 未设置 IMAGE_GEN_API_KEY", file=sys.stderr)
        sys.exit(1)
    print(f"endpoint: {URL}  model: {MODEL}  商品数: {len(PROMPTS)}")
    jobs = []
    for iid, desc in PROMPTS.items():
        jobs.append((iid, desc, "", STYLE, "1024x1024"))
        jobs.append((iid, desc, "_d", DETAIL_STYLE, "1024x1536"))
        jobs.append((iid, desc, "_2", ANGLE_STYLE, "1024x1024"))
    failed = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(_gen, *j): f"{j[0]}{j[2]}" for j in jobs}
        for fut in as_completed(futs):
            try:
                print(fut.result(), flush=True)
            except Exception as e:  # noqa: BLE001
                failed.append(futs[fut])
                print(f"FAIL {futs[fut]}: {str(e)[:140]}", flush=True)
    done = len([f for f in OUT_DIR.glob("*.png") if f.stat().st_size > 10_000])
    print(f"\n完成: {done}/{len(jobs)} 张", flush=True)
    if failed:
        print(f"失败(重跑补齐): {failed}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
