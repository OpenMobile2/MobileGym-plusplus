# -*- coding: utf-8 -*-
"""
菜鸟复刻 — 装饰位图批量生成(pipeline §5.3)。

- 幂等:已存在 PNG 跳过,失败重跑补齐
- 并发 4,单张超时 300s
运行: python apps/Cainiao/assets/gen_assets.py
环境变量: IMAGE_GEN_API_KEY(必填) / IMAGE_GEN_BASE_URL / IMAGE_GEN_MODEL — 禁止写进代码或 git
"""
import base64
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(_REPO_ROOT / "tools"))

# 环境变量未设时,从用户提供的未入库参考脚本读取配置(tools/test_api_imggen.py,
# 该文件在 .gitignore 之外但从不提交;key 不进命令行、不进本仓库任何提交文件)
import os  # noqa: E402

if not (os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")):
    try:
        import test_api_imggen as _ref  # noqa: E402

        os.environ["IMAGE_GEN_API_KEY"] = _ref.API_KEY
        os.environ.setdefault("IMAGE_GEN_BASE_URL", _ref.BASE_URL.rstrip("/") + "/v1")
        os.environ.setdefault("IMAGE_GEN_MODEL", _ref.MODEL)
    except Exception:  # noqa: BLE001
        pass

from image_gen_client import make_image_client  # noqa: E402

OUT = Path(__file__).parent
client = None

STYLE_PRODUCT = (
    "电商商品主图,专业产品摄影,浅色干净背景,柔和棚拍打光,商品居中,"
    "高清细节,无任何文字、无水印、无logo、无品牌标识"
)
STYLE_ILLO = "扁平风矢量插画,圆润可爱,蓝白主色调,干净纯色背景,无任何文字无水印"

# 输出相对路径 → prompt
ASSETS = {
    # 商品图(包裹/购物订单/瀑布流/购物券)
    "products/doupi_roll.png": f"四包彩色包装的即食鸡胸肉豆皮卷代餐零食组合平铺,{STYLE_PRODUCT}",
    "products/chili_sauce.png": f"一瓶玻璃罐装红油辣椒酱,金属旋盖,酱色浓郁,{STYLE_PRODUCT}",
    "products/corn_sausage.png": f"一排玉米味火腿肠,金黄色包装,整齐排列,{STYLE_PRODUCT}",
    "products/berry_cake.png": f"盒装蓝莓夹心小蛋糕,巧克力涂层,独立小包装散落,{STYLE_PRODUCT}",
    "products/magic_cube.png": f"一个炫彩三阶魔方,45度角拍摄,{STYLE_PRODUCT}",
    "products/veg_snack.png": f"一袋手撕素肉豆干零食,棕红色透明包装,{STYLE_PRODUCT}",
    "products/hand_fan.png": f"一台星云白色手持小风扇,便携圆柱形,{STYLE_PRODUCT}",
    "products/plant_lucky.png": f"迷你富贵竹盆栽,青绿色陶瓷圆盆,桌面绿植,{STYLE_PRODUCT}",
    "products/plant_persimmon.png": f"柿柿如意小盆栽,橙色陶盆,圆叶绿植,{STYLE_PRODUCT}",
    "products/plant_fortune.png": f"发财树水培小盆栽,透明玻璃瓶,室内绿植,{STYLE_PRODUCT}",
    "products/hdd.png": f"一块黑色移动硬盘,磨砂质感,斜角拍摄,{STYLE_PRODUCT}",
    "products/ear_cushion.png": f"多彩头戴式耳机海绵替换套配件,几只不同颜色排列,{STYLE_PRODUCT}",
    # 地图占位
    "maps/map_station.png": "简化城市街区地图插画,浅灰底色白色道路,几处浅蓝水系和浅绿绿地,一条绿色虚线路径连接两个地点,扁平风格,无任何文字无水印无图钉",
    "maps/map_route.png": "中国区域简化地图插画,浅灰蓝配色,一条蓝色曲线路线从西南延伸到东部沿海,扁平地图风格,无任何文字无水印",
    "maps/map_campus.png": "大学校园简化地图插画,浅色底,绿地湖泊教学楼色块,白色道路,扁平风格,无任何文字无水印",
    # 插画/头像/横幅
    "misc/courier.png": f"卡通快递员插画,穿蓝色制服戴蓝帽,双手抱着纸箱,正面站立,{STYLE_ILLO}",
    "misc/mascot_bird.png": f"圆润的白色小鸟机器人吉祥物,黑色圆形屏幕脸带蓝色微笑表情,绿色小脚,{STYLE_ILLO}",
    "misc/avatar_user.png": f"极简用户头像插画,浅蓝灰色调,抽象人物剪影上半身,圆形构图,{STYLE_ILLO}",
    "misc/banner_member.png": "橙色到珊瑚色渐变的会员权益横幅背景,右侧礼盒和优惠券飘散元素,扁平插画风,无任何文字无水印",
    "misc/activity_redpacket.png": f"红包乐园主题插画,红色礼包金币和小房子,喜庆红色调,{STYLE_ILLO}",
    "misc/activity_win.png": f"赢红包主题插画,红色拼图块和金币红包,{STYLE_ILLO}",
    "misc/activity_treasure.png": f"地图寻宝主题插画,打开的礼盒和藏宝地图放大镜,{STYLE_ILLO}",
}


def gen_one(rel, prompt):
    out = OUT / rel
    if out.exists():
        return rel, "skip"
    out.parent.mkdir(parents=True, exist_ok=True)
    resp = client.images.generate(model=_model, prompt=prompt, size="1024x1024", n=1)
    b64 = resp.data[0].b64_json
    out.write_bytes(base64.b64decode(b64))
    return rel, "ok"


def main():
    global client, _model
    from image_gen_client import image_gen_model
    client = make_image_client()
    _model = image_gen_model()
    todo = {r: p for r, p in ASSETS.items() if not (OUT / r).exists()}
    print(f"total={len(ASSETS)} todo={len(todo)}")
    fails = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen_one, r, p): r for r, p in todo.items()}
        for f in as_completed(futs):
            r = futs[f]
            try:
                _, st = f.result()
                print(f"[{st}] {r}", flush=True)
            except Exception as e:  # noqa: BLE001
                fails.append(r)
                print(f"[FAIL] {r}: {e}", flush=True)
    print(f"done. fail={len(fails)}")
    if fails:
        print("重跑本脚本补齐失败项:", fails)
        sys.exit(1)


if __name__ == "__main__":
    main()
