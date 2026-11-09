#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""BOSS直聘 装饰位图生成器(pipeline v3 §5.3)。

生成:Boss/用户/有了作者头像、公司 logo、有了帖子配图、公司相册。
组件在缺图时回落到 CSS 色块占位,本脚本失败不阻塞功能 gate。

安全红线(§5.3):prompt 只描述合成主体;**不得**把 boss_images/ 真机截图
或含个人信息的照片作为生图输入。key 走环境变量,不写进代码/git。

- 幂等:已存在的 PNG 跳过;失败重跑补齐;并发 4;指数退避重试;生成后压到 512×512
运行: IMAGE_GEN_API_KEY=... python3 apps/Boss/assets/gen_assets.py
"""
import base64
import io
import random
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(_REPO_ROOT / "tools"))
from image_gen_client import make_image_client, image_gen_model  # noqa: E402

BASE = Path(__file__).parent
MAX_RETRY = 3
client = None

AVATAR = "职业感人物头像插画,胸像,扁平矢量风,柔和纯色背景,居中构图,无任何文字、无水印、无logo"
LOGO = "极简抽象几何科技公司logo图标,扁平设计,纯白背景,居中,无任何文字、无字母、无水印"
PHOTO = "真实摄影风格,明亮自然光,居中构图,无任何文字、无水印、无logo"

# Boss 头像(12 位,人设与 defaults.json bosses 对应,全部虚构)
BOSS_AVATARS = {
    "b1": "35岁男性技术负责人,短发,深色圆领衫,自信微笑",
    "b2": "28岁女性AI工程师,黑色中长发,戴细框眼镜,白衬衫",
    "b3": "38岁男性算法负责人,寸头,灰色套头衫",
    "b4": "32岁男性招聘经理,商务休闲西装,亲和笑容",
    "b5": "30岁女性HRBP,马尾,米色西装外套",
    "b6": "40岁男性研发主管,黑框眼镜,蓝色衬衫",
    "b7": "36岁男性技术研发负责人,微卷短发,墨绿色polo衫",
    "b8": "27岁女性HR主管,齐肩短发,浅蓝衬衫",
    "b9": "33岁男性招聘者,清爽短发,深蓝夹克",
    "b10": "29岁女性HR,长直发,白色圆领上衣",
    "b11": "31岁女性招聘专家,盘发,驼色针织衫",
    "b12": "34岁女性招聘HR,波浪卷发,酒红色上衣",
    "b13": "30岁女性招聘官,利落短发,橙色针织衫,自信",
    "b14": "37岁男性技术总监,方框眼镜,灰色衬衫",
    "b15": "29岁男性游戏主程,微长卷发,黑色T恤,随性",
    "b16": "31岁男性创始人,利落短发,深灰高领毛衣,目光坚定",
    "b17": "39岁男性算法总监,平头,藏青色夹克",
    "b18": "36岁女性HRD,及肩直发,白色西装",
    "b19": "34岁男性技术合伙人,圆框眼镜,墨绿开衫",
    "b20": "41岁男性招聘经理,短发微白,浅蓝衬衫",
    "b_sz2": "男性招聘负责人,职业装,亲和",
    "b_nc": "男性招聘负责人,职业装,亲和",
    "b_bj": "男性招聘负责人,职业装,亲和",
    "b_sz": "男性招聘负责人,职业装,亲和",
    "b_hz": "男性招聘负责人,职业装,亲和",
    "b_gz": "男性招聘负责人,职业装,亲和",
    "b_cd": "男性招聘负责人,职业装,亲和",
    "b_wh": "男性招聘负责人,职业装,亲和",
    "b_cq": "男性招聘负责人,职业装,亲和",
    "b_jn": "男性招聘负责人,职业装,亲和",
    "b_zz": "男性招聘负责人,职业装,亲和",
    "b_nb": "男性招聘负责人,职业装,亲和",
    "b_dg": "男性招聘负责人,职业装,亲和",
    "b_nj": "男性招聘负责人,职业装,亲和",
    "b_hf": "男性招聘负责人,职业装,亲和",
    "b_xa": "男性招聘负责人,职业装,亲和",
    "b_fz": "男性招聘负责人,职业装,亲和",
    "b_cs": "男性招聘负责人,职业装,亲和",
}

# 有了 tab 帖子作者头像(6 位,虚构)
FEED_AVATARS = {
    "f1": "25岁女性职场博主,甜美长发,粉色背景",
    "f2": "一个可爱的白色圆脸卡通形象,简笔画风格",
    "f3": "32岁女性部门主管,干练短发,浅灰西装",
    "f4": "30岁男性职场博主,西装领带,深蓝背景",
    "f5": "26岁女性博主,黑长直发,暖黄背景",
    "f6": "29岁男性求职辅导博主,休闲衬衫,青色背景",
    "f7": "24岁阳光男生,短发圆脸,浅蓝卫衣,米色背景",
    "f8": "35岁干练职场女性,低马尾,深灰西装,浅紫背景",
    "f9": "45岁男性技术面试官,络腮胡,黑框眼镜,深蓝背景",
}

# 公司 logo(12 家,全部虚构)
COMPANY_LOGOS = {
    "c_xinglian": "四角星与圆环组合,青绿色",
    "c_yunshan": "三棵抽象杉树三角形,深绿色",
    "c_huitu": "重叠的六边形蜂窝,蓝紫色",
    "c_tuojie": "向外扩张的箭头方块,橙色",
    "c_lanzhou": "一叶扁舟波浪线,深蓝色",
    "c_qiming": "启明星与电路线条,金黄色",
    "c_lanjing": "极简鲸鱼尾鳍曲线,蓝色",
    "c_shanhai": "山峰与海浪叠影,青色",
    "c_chixing": "疾驰车轮动感线条,红色",
    "c_nuofang": "圆角十字与叶片,薄荷绿",
    "c_qinghe": "破土禾苗两片叶,草绿色",
    "c_lingyun": "穿云箭头与云朵,天蓝色",
    "c_juzhou": "三瓣橘子切片圆形图标,橙色",
    "c_linli": "圆角房屋轮廓中嵌一颗爱心,珊瑚红",
    "c_xingchen": "星星与游戏手柄轮廓融合,紫色",
    "c_manyu": "对话气泡与新芽组合,青绿色",
    "c_fengchao": "六边形蜂巢与箭头,琥珀黄",
    "c_xinhe": "芯片引脚方形与圆环,深蓝色",
    "c_yunqi": "两片云朵咬合如齿轮,天青色",
    "c_lvchao": "海浪与叶片组成的圆,翠绿色",
    "c_gusu": "园林漏窗几何,扁平几何,纯白背景,无文字",
    "c_ganjiang": "滕王阁飞檐线条,扁平几何,纯白背景,无文字",
    "c_jinghua": "故宫角楼剪影与电路,扁平几何,纯白背景,无文字",
    "c_pengrui": "展翅大鹏几何,扁平几何,纯白背景,无文字",
    "c_qiantang": "钱塘潮水波纹,扁平几何,纯白背景,无文字",
    "c_zhujiang": "珠江塔曲线,扁平几何,纯白背景,无文字",
    "c_rongcheng2": "芙蓉花瓣几何,扁平几何,纯白背景,无文字",
    "c_jiangcheng": "长江大桥拱线,扁平几何,纯白背景,无文字",
    "c_shancheng": "山城阶梯错落方块,扁平几何,纯白背景,无文字",
    "c_quancheng": "趵突泉三股水纹,扁平几何,纯白背景,无文字",
    "c_zhongyuan": "黄河九曲线条,扁平几何,纯白背景,无文字",
    "c_yongjiang": "三江汇流曲线,扁平几何,纯白背景,无文字",
    "c_wanyi": "齿轮与叶片,扁平几何,纯白背景,无文字",
    "c_jinling": "城墙垛口几何,扁平几何,纯白背景,无文字",
    "c_luzhou": "芯片与徽派马头墙,扁平几何,纯白背景,无文字",
    "c_changan": "古城墙方形环,扁平几何,纯白背景,无文字",
    "c_rongcheng": "榕树气根网络,扁平几何,纯白背景,无文字",
    "c_xingcheng2": "橘子洲头水纹,扁平几何,纯白背景,无文字",
}

# 有了帖子配图(5 张,场景合成,不含可读文字)
FEED_IMAGES = {
    "p1": f"都市地铁车厢里的年轻上班族望向窗外,通勤纪实感,{PHOTO}",
    "p2": f"办公桌上的劳动合同文件与钢笔特写,冷色调,{PHOTO}",
    "p4": f"一只慵懒的柴犬趴在办公桌上睡觉,旁边有键盘,表情包风格,{PHOTO}",
    "p5": f"咖啡店里打开的笔记本电脑与一杯拿铁,俯拍,{PHOTO}",
    "p6": f"一叠简历纸放在办公桌角落被冷落,顶视角,{PHOTO}",
    "p7": f"书桌前笔记本电脑开着视频会议界面,戴耳机的人的背影虚化,{PHOTO}",
    "p11": f"摊开的手帐日历与荧光笔,标注着重点日期,俯拍,{PHOTO}",
    "p12": f"深夜地铁站台,一个提电脑包的上班族背影,冷暖光对比,{PHOTO}",
    "p14": f"人体工学椅与办公桌一角,阳光洒落,温馨,{PHOTO}",
    "p18": f"清晨地铁车窗外的城市天际线,车厢内乘客剪影,{PHOTO}",
}

# 公司相册(4 张通用办公环境)
COMPANY_PHOTOS = {
    "env1": f"现代开放式办公区,绿植与暖光,{PHOTO}",
    "env2": f"科技公司前台接待区,原木与灰色调,{PHOTO}",
    "env3": f"明亮的玻璃会议室,长桌与投屏,{PHOTO}",
    "env4": f"办公室休闲角,沙发咖啡机绿植,{PHOTO}",
}

TASKS = []
TASKS.append((BASE / "avatars" / "u_me.png", f"23岁研究生男生卡通头像,戴绿框眼镜,深蓝上衣,暖黄背景,扁平插画,无任何文字无水印"))
for k, v in BOSS_AVATARS.items():
    TASKS.append((BASE / "avatars" / f"{k}.png", f"{v},{AVATAR}"))
for k, v in FEED_AVATARS.items():
    TASKS.append((BASE / "avatars" / f"{k}.png", f"{v},{AVATAR}"))
for k, v in COMPANY_LOGOS.items():
    TASKS.append((BASE / "logos" / f"{k}.png", f"{v},{LOGO}"))
for k, v in FEED_IMAGES.items():
    TASKS.append((BASE / "feed" / f"{k}.png", v))
for k, v in COMPANY_PHOTOS.items():
    TASKS.append((BASE / "company" / f"{k}.png", v))


def _shrink(raw: bytes, size=512) -> bytes:
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        im.thumbnail((size, size))
        out = io.BytesIO()
        im.save(out, "PNG", optimize=True)
        return out.getvalue()
    except Exception:
        return raw


def gen(path: Path, prompt: str) -> str:
    if path.exists():
        return f"skip  {path.name}"
    path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(MAX_RETRY):
        try:
            r = client.images.generate(model=image_gen_model(), prompt=prompt, size="1024x1024", n=1)
            path.write_bytes(_shrink(base64.b64decode(r.data[0].b64_json)))
            return f"ok    {path.name}  ({path.stat().st_size // 1024} KB)"
        except Exception as e:
            if attempt == MAX_RETRY - 1:
                return f"FAIL  {path.name}: {type(e).__name__} {str(e)[:80]}"
            time.sleep(2 ** attempt + random.random())
    return f"FAIL  {path.name}"


def main():
    global client
    client = make_image_client()
    todo = [(p, pr) for p, pr in TASKS if not p.exists()]
    print(f"model={image_gen_model()}  待生成 {len(todo)}/{len(TASKS)} 张")
    ok = fail = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(gen, p, pr) for p, pr in TASKS]
        for f in as_completed(futs):
            res = f.result()
            print(" ", res)
            if res.startswith("ok"):
                ok += 1
            elif res.startswith("FAIL"):
                fail += 1
    print(f"\n生成 {ok} 张,失败 {fail} 张(失败下次重跑补齐)")


if __name__ == "__main__":
    main()
