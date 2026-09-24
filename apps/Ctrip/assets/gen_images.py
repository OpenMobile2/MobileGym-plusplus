# -*- coding: utf-8 -*-
"""
携程 资产生成器(pipeline §5.3,gpt-image-2)。禁用 emoji 占位 → 全部真实生图。
幂等:已存在的 PNG(>10KB)跳过;失败重跑补齐。8 并发。
运行: python apps/Ctrip/assets/gen_images.py
"""
import base64, os, random, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from openai import OpenAI

OUT = Path(__file__).parent / "gen"
OUT.mkdir(exist_ok=True)

client = OpenAI(
    base_url="https://example.invalid/v1",
    api_key=os.environ.get("TOKENHUB_API_KEY", "REDACTED"),
)

HOTEL_STYLE = "酒店实拍摄影,真实建筑/客房,自然光,无任何文字、无水印、无logo"
SCENE_STYLE = "旅游风光摄影,真实景点,明亮通透,高清,无任何文字、无水印、无logo"
BANNER_STYLE = "旅游App运营横幅背景图,明亮鲜艳,留白适合叠加文字,无文字、无水印、无logo"
AVATAR_STYLE = "社交头像,真实人物或卡通风格,居中,干净背景,无文字、无水印"
CAR_STYLE = "汽车产品图,白色干净背景,45度侧前方角度,无文字、无水印、无logo"

# id -> (尺寸, 主体描述, 风格)
JOBS = {
    # 酒店主图(列表/详情/房型)
    "hotel_atour": ("1024x1024", "杭州西湖边亚朵品牌商务酒店外观,现代玻璃幕墙,傍晚暖光", HOTEL_STYLE),
    "hotel_atour_room": ("1024x1024", "亚朵酒店雅致大床房,1.8米大床,木质暖色调,落地窗采光", HOTEL_STYLE),
    "hotel_atour_lobby": ("1024x1024", "亚朵酒店大堂,弧形落地窗,米色沙发,黑色弧形落地灯,鲜花茶几", HOTEL_STYLE),
    "hotel_seaview": ("1024x1024", "连云港连岛海景民宿客房,大落地窗正对壮阔海景,双床,蓝灰色调", HOTEL_STYLE),
    "hotel_quanji": ("1024x1024", "杭州全季酒店外观,简约白色建筑,商务连锁风格", HOTEL_STYLE),
    "hotel_hanting": ("1024x1024", "汉庭酒店门头,蓝色灯箱招牌,现代简约入口,夜景", HOTEL_STYLE),
    "hotel_dahua": ("1024x1024", "杭州西湖大华饭店,五星园林式酒店,湖景与中式建筑", HOTEL_STYLE),
    "hotel_quanji_room": ("1024x1024", "全季酒店标准双床房,简约现代,浅木色", HOTEL_STYLE),
    "hotel_hanting_room": ("1024x1024", "汉庭酒店大床房,温馨简约,智能电视", HOTEL_STYLE),
    "hotel_homestay": ("1024x1024", "上海市区精致民宿一居室,北欧风,绿植点缀,温馨", HOTEL_STYLE),
    # 景点风光
    "scene_disney": ("1024x1024", "上海迪士尼度假区城堡,蓝天白云,梦幻", SCENE_STYLE),
    "scene_disney_toy": ("1024x1024", "主题乐园卡通玩偶巡游表演,彩色气球与花车,欢乐氛围,无具体IP角色", SCENE_STYLE),
    "scene_haichang": ("1024x1024", "上海海昌海洋公园,虎鲸表演水池,亲子海洋主题", SCENE_STYLE),
    "scene_pearl": ("1024x1024", "上海东方明珠电视塔,陆家嘴夜景,黄浦江", SCENE_STYLE),
    "scene_bund": ("1024x1024", "上海外滩万国建筑群,黄浦江畔,黄昏暖光", SCENE_STYLE),
    "scene_yuyuan": ("1024x1024", "上海豫园,中式古典园林,亭台楼阁,红灯笼", SCENE_STYLE),
    "scene_westlake": ("1024x1024", "杭州西湖风景区,断桥残雪,远山如黛,游船", SCENE_STYLE),
    "scene_huangshan": ("1024x1024", "黄山风景区,云海奇松怪石,日出金光", SCENE_STYLE),
    "scene_qiankucheng": ("1024x1024", "上海千古情景区,仿古商业街,夜晚灯火,人文风情", SCENE_STYLE),
    # banner / 运营
    "banner_summer": ("1536x1024", "夏日亲子家庭在泳池嬉水,阳光沙滩棕榈树,欢乐度假氛围", BANNER_STYLE),
    "banner_train": ("1536x1024", "夏日列车旅行,年轻女孩戴帽望向窗外青山,惬意", BANNER_STYLE),
    "banner_flight": ("1536x1024", "暑期机票促销背景,蓝天白云飞机,年轻情侣举手欢呼", BANNER_STYLE),
    "banner_car": ("1536x1024", "暑期自驾游,白色SUV载一家人行驶在风景公路,蓝天", BANNER_STYLE),
    "banner_disney_hot": ("1536x1024", "主题乐园暑期庆典,彩色城堡与烟花,游客欢乐合影,无具体IP角色", BANNER_STYLE),
    # 城市/目的地封面
    "city_shanghai": ("1024x1024", "上海陆家嘴天际线夜景,东方明珠与摩天楼,黄浦江倒影", SCENE_STYLE),
    "city_sanya": ("1024x1024", "三亚海岛海景公路,碧海蓝天椰林,度假", SCENE_STYLE),
    "city_chengdu": ("1024x1024", "成都川西环线雪山风光,壮丽自然", SCENE_STYLE),
    "city_chongqing": ("1024x1024", "重庆洪崖洞夜景,层叠吊脚楼灯火,8D魔幻都市", SCENE_STYLE),
    # 头像 / 点评配图
    "avatar_1": ("1024x1024", "年轻女性社交头像,微笑,简约", AVATAR_STYLE),
    "avatar_2": ("1024x1024", "戴帽子卡通企鹅旅行头像,可爱", AVATAR_STYLE),
    "avatar_cs": ("1024x1024", "在线客服女性头像,职业微笑,蓝色工服", AVATAR_STYLE),
    "review_room": ("1024x1024", "用户晒图:酒店房间整洁床铺与窗外景色,手机随手拍质感", SCENE_STYLE),
    "review_breakfast": ("1024x1024", "用户晒图:酒店自助早餐丰盛摆盘,手机随手拍", SCENE_STYLE),
    # 租车车型
    "car_tesla": ("1024x1024", "黑色特斯拉Model Y纯电SUV", CAR_STYLE),
    "car_xiaomi": ("1024x1024", "绿色小米SU7/YU7纯电轿跑", CAR_STYLE),
    "car_buick": ("1024x1024", "白色别克GL8商务MPV七座", CAR_STYLE),
}

MAX_RETRY = 3

def gen(jid, size, desc, style):
    out = OUT / f"{jid}.png"
    if out.exists() and out.stat().st_size > 10_000:
        return f"skip {jid}"
    last = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            r = client.images.generate(model="gpt-image-2", prompt=f"{desc},{style}",
                                       n=1, size=size, timeout=120)
            it = r.data[0]
            if getattr(it, "b64_json", None):
                b = base64.b64decode(it.b64_json)
            elif getattr(it, "url", None):
                with urllib.request.urlopen(it.url, timeout=60) as resp:
                    b = resp.read()
            else:
                raise RuntimeError("no image payload")
            out.write_bytes(b)
            return f"ok   {jid}({len(b)//1024}KB)"
        except Exception as e:
            last = e
            time.sleep(2 ** attempt + random.uniform(0, 2))
    raise RuntimeError(f"{jid} failed: {str(last)[:120]}")

def main():
    failed = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(gen, jid, *spec): jid for jid, spec in JOBS.items()}
        for f in as_completed(futs):
            try:
                print(f.result(), flush=True)
            except Exception as e:
                failed.append(futs[f]); print(f"FAIL {futs[f]}: {str(e)[:140]}", flush=True)
    done = len([f for f in OUT.glob("*.png") if f.stat().st_size > 10_000])
    print(f"\n完成: {done}/{len(JOBS)}", flush=True)
    if failed:
        print(f"失败(重跑补齐): {failed}", flush=True); sys.exit(1)

if __name__ == "__main__":
    main()
