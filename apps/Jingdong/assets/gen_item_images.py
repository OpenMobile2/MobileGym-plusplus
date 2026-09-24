# -*- coding: utf-8 -*-
"""
京东商品图批量生成器(pipeline v3 §5.3 资产管线)。
用 gpt-image-2 为 defaults.json 商品生成电商风格图,替换 SVG 占位。
- 幂等:已存在且 >10KB 的 PNG 跳过,失败下次重跑补齐
- 每商品 2 变体:主图 / _d 详情场景图(竖版)
- 并发 8,指数退避重试;自包含(raw requests)
环境变量:IMAGE_GEN_API_KEY(必填)、IMAGE_GEN_BASE_URL、IMAGE_GEN_MODEL
安全红线:prompt 只描述合成主体,禁止上传真机截图;key 只从环境变量读。
"""
import base64, os, random, sys, time, urllib.request
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
DETAIL_STYLE = ("电商详情页场景图,竖版构图,商品在真实使用场景中,生活方式摄影,自然光,氛围感,"
                "无任何文字、无水印、无logo")

# 京东品类:3C数码/家电为核心,兼顾食品生鲜/日用/服饰,与真机截图品类一致。
PROMPTS = {
    "i_thinkbook":  "一台银灰色联想ThinkBook轻薄笔记本电脑,金属机身,屏幕点亮显示蓝色壁纸,商务办公风",
    "i_phone_v":    "一部深绿色vivo旗舰智能手机,后置三摄大圆环,正反面摆放,科技质感",
    "i_phone_honor":"一部白色荣耀旗舰手机,后置圆形四摄,细窄边框全面屏,时尚科技",
    "i_earbuds":    "一副白色真无线蓝牙耳机和充电盒,开盖摆放,简约科技感",
    "i_keyboard":   "一把黑色机械键盘,RGB背光,PBT键帽,游戏电竞风",
    "i_mouse":      "一只玫红色轻量化无线游戏鼠标,人体工学造型,电竞外设",
    "i_monitor":    "一台27寸黑色高清显示器,窄边框,屏幕显示彩色抽象壁纸,桌面办公",
    "i_powerbank":  "一个白色大容量充电宝,数显屏,双USB口,便携移动电源",
    "i_watch":      "一块黑色智能手表,方形大屏,硅胶表带,运动健康风",
    "i_hairdryer":  "一台粉色高速电吹风,负离子护发,圆筒机身,家用美发电器",
    "i_kettle":     "一台白色不锈钢电热水壶,1.7L,圆润机身,厨房台面场景",
    "i_fridge":     "一台白色对开门大冰箱,家用电器,简约现代厨房场景",
    "i_wangzai":    "一箱旺仔牛奶,红色卡通儿童牛奶利乐包整箱装,夏日清凉",
    "i_watermelon": "一个切开的红瓤大西瓜,新鲜多汁,水果生鲜,竹篮衬托",
    "i_dumpling":   "一盘热腾腾的白菜猪肉水饺,晶莹饱满,配蘸料,中式家常美食",
    "i_coffee":     "一杯冰美式咖啡,透明杯装,冰块和咖啡液分层,清爽饮品",
    "i_zhacai":     "一袋乌江榨菜,红色小包装脆口榨菜丝组合装,佐餐开胃",
    "i_water":      "一箱怡宝纯净水,350mL塑料瓶整箱透明包装,清澈饮用水",
    "i_tissue":     "一提抽纸巾,家用软抽面巾纸多包装,柔软亲肤,居家日用",
    "i_slippers":   "一双灰色居家踩屎感拖鞋,EVA软底,舒适简约",
    "i_backpack":   "一个灰色大容量双肩旅行背包,多隔层,回力风格学生书包",
    "i_cup":        "一个便携保温咖啡杯,不锈钢内胆,哑光机身,随行杯",
    "i_hairoil":    "一瓶护发精油,琥珀色透明滴管瓶,顺滑柔顺,美发护理",
    "i_toothpaste": "一支抗敏感牙膏,蓝白配色软管配纸盒,口腔护理,清新",
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
        except Exception as e:
            last = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"{out.name} 重试{MAX_RETRY}次失败: {str(last)[:120]}")

def main():
    if not API_KEY:
        print("错误: 未设置 IMAGE_GEN_API_KEY", file=sys.stderr); sys.exit(1)
    print(f"endpoint: {URL}  model: {MODEL}  商品数: {len(PROMPTS)}")
    jobs = []
    for iid, desc in PROMPTS.items():
        jobs.append((iid, desc, "", STYLE, "1024x1024"))
        jobs.append((iid, desc, "_d", DETAIL_STYLE, "1024x1536"))
    failed = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(_gen, *j): f"{j[0]}{j[2]}" for j in jobs}
        for fut in as_completed(futs):
            try:
                print(fut.result(), flush=True)
            except Exception as e:
                failed.append(futs[fut]); print(f"FAIL {futs[fut]}: {str(e)[:140]}", flush=True)
    done = len([f for f in OUT_DIR.glob("*.png") if f.stat().st_size > 10_000])
    print(f"\n完成: {done}/{len(jobs)} 张", flush=True)
    if failed:
        print(f"失败(重跑补齐): {failed}", flush=True); sys.exit(1)

if __name__ == "__main__":
    main()
