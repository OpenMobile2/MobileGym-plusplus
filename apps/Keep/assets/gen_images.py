# -*- coding: utf-8 -*-
"""
Keep 装饰位图批量生图(参考 Didi/Flomo gen_images.py 模式)。
- key 只从环境变量读,绝不写进代码/git:IMAGE_GEN_API_KEY(必填)、
  IMAGE_GEN_BASE_URL(必填且必须为 HTTPS)、IMAGE_GEN_MODEL(默认 gpt-image-2)。
- 幂等:已存在的 PNG 跳过;失败可重跑只补缺失。4 线程并发。
- 安全:prompt 只描述合成主体,绝不上传真机截图;不出现真实人物肖像。
- 产出:apps/Keep/assets/img/<id>.png,id 与 data/defaults.json 中
  cover/avatar/images 字段引用一一对应(res/images.ts 的 imgUrl/Img 消费)。
运行:
  IMAGE_GEN_API_KEY=... python apps/Keep/assets/gen_images.py
"""
import base64, json, os, sys, tempfile, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


def _require_https(url, label):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError(f"{label} 必须使用有效 HTTPS URL")


class _SameOriginHTTPSRedirect(urllib.request.HTTPRedirectHandler):
    """只允许 HTTPS 同源重定向，避免 Authorization 被带往其他主机。"""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        _require_https(newurl, "重定向地址")
        before = urllib.parse.urlsplit(req.full_url)
        after = urllib.parse.urlsplit(newurl)
        if (before.hostname, before.port) != (after.hostname, after.port):
            raise urllib.error.HTTPError(
                newurl, code, "拒绝跨源重定向", headers, fp
            )
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_HTTPS_OPENER = urllib.request.build_opener(_SameOriginHTTPSRedirect())


def _post_json(url, payload, headers, timeout=300):
    _require_https(url, "生图 API")
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={**headers, "Content-Type": "application/json"}, method="POST")
    with _HTTPS_OPENER.open(req, timeout=timeout) as resp:
        _require_https(resp.geturl(), "生图 API 最终响应")
        return resp.status, resp.read().decode()


def _get_bytes(url, timeout=120):
    _require_https(url, "图片下载地址")
    with _HTTPS_OPENER.open(url, timeout=timeout) as resp:
        _require_https(resp.geturl(), "图片下载最终响应")
        return resp.read()


IMG_DIR = Path(__file__).parent / "img"
KEY = os.environ.get("IMAGE_GEN_API_KEY")
BASE = (os.environ.get("IMAGE_GEN_BASE_URL") or "").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL") or "gpt-image-2"
SIZE = os.environ.get("IMAGE_GEN_SIZE") or "1024x1024"
if not KEY:
    sys.exit("缺少 IMAGE_GEN_API_KEY 环境变量;未配置则跳过生图(页面用 Img 渐变占位)。")
if not BASE:
    sys.exit("缺少 IMAGE_GEN_BASE_URL 环境变量;为避免 Key 被发送到错误地址,不提供默认端点。")
try:
    _require_https(BASE, "IMAGE_GEN_BASE_URL")
except ValueError as exc:
    sys.exit(str(exc))

URL = f"{BASE}/images/generations" if BASE.endswith("/v1") else f"{BASE}/v1/images/generations"
NO_TEXT = ",无任何文字,无水印,无logo"
PRODUCT = ",电商商品主图,专业产品摄影,浅色干净背景"


def _write_private(path, content):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(path.parent, 0o700)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=f".{path.name}.", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        try:
            os.chmod(tmp_path, 0o600)
            tmp.write(content)
            tmp.flush()
            os.fsync(tmp.fileno())
        except Exception:
            tmp_path.unlink(missing_ok=True)
            raise
    tmp_path.replace(path)
    os.chmod(path, 0o600)

# 资产清单 {图片id: prompt};覆盖 defaults.json 引用的全部图片 id。
ASSETS = {
    # ---- 课程封面(健身场景) ----
    "course_bigweight":   "微胖体型男性在明亮客厅进行低冲击原地训练,健身课程封面,活力光线,运动摄影",
    "course_belly":       "健身垫上进行站姿核心训练的人物,腹部训练课程封面,室内健身场景,专业运动摄影",
    "course_sweat40":     "高强度间歇训练场景,年轻人挥汗训练,深色健身房,强烈光影,课程封面风格",
    "course_live":        "直播健身课场景,教练面向镜头示范动作,环形补光灯,现代直播间,明亮色调",
    "course_fartlek":     "城市跑道上变速奔跑的跑者,清晨光线,跑步课程封面,运动摄影",
    "course_assault":     "壶铃摆动训练的健身人物,硬核健身房环境,课程封面,运动摄影",
    "course_rope":        "跳绳训练中的年轻人,动感跳跃姿态,明亮健身空间,运动摄影",
    "course_run_outdoor": "公园绿道上慢跑的跑者背影,傍晚暖色光线,户外跑步课程封面,运动摄影",
    "course_slowrun":     "河畔步道轻松超慢跑的人,清晨薄雾,舒缓氛围,运动摄影",
    "course_dance1":      "明亮客厅里跟跳健身操的年轻女性,活力舞蹈动作,健身操课程封面,运动摄影",
    "course_dance2":      "复古霓虹灯光背景的燃脂舞课堂,多人齐跳,港风配色,课程封面",
    "course_hiit":        "波比跳训练瞬间,深色调健身房,汗水飞溅,强烈光影,HIIT课程封面",
    "course_health":      "瑜伽垫上舒展拉伸的人物,柔和晨光,健康改善课程封面,温和色调",
    # ---- 教练 / 达人头像(虚拟人物) ----
    "coach_maoshu":  "戴棒球帽的中年男性跑步教练头像,和蔼微笑,运动服,纯浅色背景,写实摄影",
    "coach_pamela":  "金发年轻女性健身博主头像,自信微笑,运动背心,纯浅色背景,写实摄影",
    "coach_cheng33": "扎马尾的年轻女性健身教练头像,活力微笑,运动上衣,纯浅色背景,写实摄影",
    "coach_ouyang":  "短发年轻女性舞蹈教练头像,明快笑容,时尚运动装,纯浅色背景,写实摄影",
    "coach_keepjun": "绿色渐变背景的极简官方账号头像,中心白色抽象哑铃图形,扁平设计",
    "coach_yujie":   "长发女性健身达人头像,温柔微笑,浅色运动装,纯浅色背景,写实摄影",
    # ---- 用户头像 ----
    "avatar_me":      "深紫色渐变极简应用头像,中心白色抽象人形剪影,扁平设计",
    "avatar_xiaoa":   "戴圆框眼镜的年轻女性卡通风头像,圆脸微笑,扁平插画",
    "avatar_jinan":   "戴骑行头盔的年轻男性头像,骑行服,户外背景虚化,写实摄影",
    "avatar_beibei":  "戴运动墨镜的男性骑行爱好者头像,阳光户外,写实摄影",
    "avatar_swimmer": "戴泳镜泳帽的年轻女性头像,泳池背景虚化,写实摄影",
    # ---- 商品主图(电商主图规范) ----
    "product_dumbbell":    "一对粉色浸塑六角小哑铃" + PRODUCT,
    "product_scale":       "白色圆角智能体脂秤,钢化玻璃面板" + PRODUCT,
    "product_carnitine":   "一排便携小瓶装运动纤维饮品" + PRODUCT,
    "product_band_b6":     "黑色智能运动手环,彩色屏幕点亮" + PRODUCT,
    "product_band_b5":     "深灰色智能运动手环,窄屏设计" + PRODUCT,
    "product_band_b4":     "黑色简约智能手环,黑白屏幕" + PRODUCT,
    "product_watch":       "黑色圆表盘智能运动手表,硅胶表带" + PRODUCT,
    "product_rope":        "黑绿配色智能计数跳绳,带显示屏手柄" + PRODUCT,
    "product_abroller":    "黑绿色自动回弹健腹轮" + PRODUCT,
    "product_mat":         "卷起的墨绿色加厚健身垫" + PRODUCT,
    "product_dbset":       "黑色包胶快拆杠铃哑铃两用套装" + PRODUCT,
    "product_whey":        "大罐装乳清蛋白粉,白色简约包装罐" + PRODUCT,
    "product_electrolyte": "一管电解质气泡片,亮色管状包装" + PRODUCT,
    "product_chicken":     "真空袋装即食鸡胸肉" + PRODUCT,
    "product_fishoil":     "透明瓶装金黄色鱼油软胶囊" + PRODUCT,
    "product_gummy":       "一瓶红色水果味软糖" + PRODUCT,
    "product_smith":       "黑色史密斯综合训练架健身器械" + PRODUCT,
    "product_bra":         "灰紫色高强度运动内衣平铺" + PRODUCT,
    "product_yeast":       "浅色简约包装的蛋白粉罐" + PRODUCT,
    "product_steak":       "袋装烘烤牛排肉脆零食,零食袋包装" + PRODUCT,
    "product_board":       "紫色软硅胶金字塔纹按摩指压板" + PRODUCT,
    "product_puller":      "粉色猫咪造型八字拉力器" + PRODUCT,
    "product_hoop":        "粉紫渐变可拆卸健身呼啦圈" + PRODUCT,
    # ---- 计划封面 ----
    "plan_bigweight": "微胖人群全身燃脂训练场景插画,活力橙绿色调,健身计划封面,扁平插画",
    "plan_student":   "青春校园风瘦身训练插画,清爽蓝绿色调,计划封面,扁平插画",
    "plan_abs":       "腹肌训练主题深色计划封面,力量感光影,健身摄影",
    "plan_chest":     "女性哑铃胸背塑形训练场景,明亮健身房,计划封面,运动摄影",
    "plan_summer":    "夏日操场训练插画,阳光渐变色,青春活力,计划封面",
    "plan_muscle":    "杠铃力量训练剪影,深色调增肌主题计划封面,运动摄影",
    "plan_run":       "户外慢跑计划封面,晨光公路与跑鞋剪影,清新绿色调",
    "plan_run_advance": "进阶间歇跑计划封面,田径场跑道与速度感线条,深绿色调",
    # ---- 动作库条目图(与 actionsLib.id 对齐) ----
    "act_pushup":  "俯卧撑动作示意摄影,瑜伽垫地面视角,明亮简洁",
    "act_bicycle": "空中蹬车仰卧卷腹动作示意,核心训练,明亮简洁",
    "act_crunch":  "卷腹动作示意摄影,腹部训练,明亮简洁",
    "act_squat":   "标准深蹲动作示意,下肢训练,明亮简洁",
    "act_plank":   "平板支撑动作示意,核心稳定,明亮简洁",
    "act_jump":    "开合跳动作示意,有氧燃脂,明亮简洁",
    "act_lunge":   "弓步后转体动作示意,功能性训练,明亮简洁",
    # ---- 奖牌 / IP 活动图(卡通挂饰) ----
    "medal_kitty":    "粉色卡通猫咪主题圆形奖牌挂饰,粉色丝带,可爱风,浅色背景",
    "medal_dog":      "简笔线条小狗主题白色奖牌挂饰,蓝色丝带,极简线条风,浅色背景",
    "medal_ruyuan":   "国风飞鸢主题金属奖牌挂饰,红金配色,祥云底纹,浅色背景",
    "medal_pingpong": "乒乓球拍主题金色奖牌挂饰,动感线条设计,浅色背景",
    "medal_conan":    "侦探主题深蓝色奖牌挂饰,放大镜与礼帽元素,卡通风,浅色背景",
    "medal_jianwang": "古风武侠主题奖牌挂饰,青铜质感,宝剑与流苏元素,浅色背景",
    "medal_koi":      "锦鲤主题红金色奖牌挂饰,水波纹样,国潮风,浅色背景",
    # ---- 赛事封面 ----
    "race_fruit":    "热带水果与跑步结合的线上赛活动插画,明快色彩,活动横幅风格",
    "race_kma":      "城市马拉松赛事插画,山城天际线剪影与奔跑人群,活动海报风",
    "race_cycling":  "绿色茶园间公路骑行队伍,清新自然光,户外运动摄影",
    "race_football": "足球射门瞬间剪影与红包金币飘落插画,红色喜庆主题,活动横幅",
    "race_duanwu":   "端午龙舟与城市跑步结合的国风插画,青绿色调,活动海报",
    # ---- 社区帖子照片 ----
    "post_cycling": "傍晚滨江公路骑行第一视角,车把与夕阳,户外运动摄影",
    "post_ride2":   "山路上骑公路自行车的骑手,清晨光线,运动摄影",
    "post_swim":    "室内泳池清澈泳道,蓝色水面波光,摄影",
    "post_pamela":  "瑜伽垫上哑铃毛巾水壶俯拍平铺,居家健身氛围照,明亮色调",
    # ---- banner 底图 ----
    "banner_newuser": "红色礼盒与优惠券飘落的新人礼庆祝插画,电商横幅风格,喜庆红金配色",
    "banner_aw":      "秋冬跑步新品服饰横幅,跑者剪影,冷色调时尚运动摄影",
    "banner_concert": "演唱会舞台灯光与欢呼人群剪影插画,紫色调横幅",
    # ---- App 内地图底图 ----
    "map_city":  "简约风格化城市街区地图俯视图,浅色底,淡绿路网,无文字无标注",
    "map_route": "简约风格化城市地图俯视图,浅色底,淡绿路网,一条深绿色环形路线标注,无文字无标注",
}


def gen(img_id, prompt):
    out = IMG_DIR / f"{img_id}.png"
    if out.exists() and out.stat().st_size > 0:
        return (img_id, "skip")
    out.parent.mkdir(parents=True, exist_ok=True)
    full_prompt = prompt if prompt.endswith(NO_TEXT) else prompt + NO_TEXT
    for attempt in range(3):
        try:
            status, body = _post_json(URL, {"model": MODEL, "prompt": full_prompt, "size": SIZE, "n": 1},
                                      {"Authorization": f"Bearer {KEY}"})
            if status != 200:
                if attempt == 2:
                    return (img_id, f"HTTP {status}: {body[:120]}")
                time.sleep(3); continue
            items = json.loads(body).get("data", [])
            if items and items[0].get("b64_json"):
                _write_private(out, base64.b64decode(items[0]["b64_json"]))
                return (img_id, f"ok {out.stat().st_size}B")
            if items and items[0].get("url"):
                _write_private(out, _get_bytes(items[0]["url"]))
                return (img_id, f"ok(url) {out.stat().st_size}B")
            return (img_id, "no image in response")
        except Exception as e:
            if attempt == 2:
                return (img_id, f"EXC {e}")
            time.sleep(3)
    return (img_id, "failed")


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(IMG_DIR, 0o700)
    for existing in IMG_DIR.glob("*.png"):
        if existing.is_file() and not existing.is_symlink():
            os.chmod(existing, 0o600)
    print(f"api=https model={MODEL} size={SIZE} | {len(ASSETS)} assets -> {IMG_DIR}")
    ok = skip = fail = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen, img_id, p): img_id for img_id, p in ASSETS.items()}
        for f in as_completed(futs):
            img_id, status = f.result()
            print(f"  {img_id}: {status}")
            if status.startswith("ok"): ok += 1
            elif status == "skip": skip += 1
            else: fail += 1
    print(f"done: ok={ok} skip={skip} fail={fail}")
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
