# -*- coding: utf-8 -*-
"""小日常 装饰位图生成器(pipeline v3 §5.3)。

⚠ 与淘宝/番茄ToDo 不同:小日常 **几乎不需要位图**。
   - 习惯图标 = Lucide 线条图标 + 色块(res/icons.tsx),不是图片
   - 心愿单 = 纯文字条目(真机 s219 无封面图)
   - 笔记卡 = 纯色点 + 文字
   真正需要位图的只有**用户头像**。为跑通 §5.3 而凭空造几十张图,
   只会让复刻偏离真机,不做。

安全红线(pipeline §5.3):prompt 只描述合成主体;
**不得**把 xiaorichang_images/ 的真机截图或含个人信息的照片作为生图输入。

- 幂等:已存在的 PNG 跳过,失败下次重跑补齐;并发 4;指数退避重试
运行: python apps/Xiaorichang/assets/gen_assets.py
环境变量: IMAGE_GEN_API_KEY(推荐,兼容 TOKENHUB_API_KEY)
          可选 IMAGE_GEN_BASE_URL / IMAGE_GEN_MODEL
"""
import base64
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

STYLE = "扁平插画风格头像,柔和奶油色背景,居中构图,无任何文字、无水印、无logo"

# 种子用户为虚构人物(spec §四:真机头像含个人信息,一律替换)
AVATARS = {
    "user": f"一个微笑的短发年轻人的半身插画,暖黄色调,{STYLE}",
    "alt1": f"一只戴围巾的柴犬的可爱插画,浅米色背景,{STYLE}",
    "alt2": f"一株小小的绿色盆栽植物的插画,极简,{STYLE}",
}

# 今日卡片的竖版风景图(s213/s242:卡片左侧一张竖构图风景照)
CARD_PHOTO = "干净的摄影风格竖构图风景照,柔和自然光,低饱和,静谧,无任何文字、无水印、无logo"
CARDS = {
    "card_city": f"清晨的老城街景,建筑立面与远处塔楼,前景有初春枝条,{CARD_PHOTO}",
    "card_sea": f"平静海面上的柔和日出,暖金色晨光,极简地平线,{CARD_PHOTO}",
    "card_forest": f"晨雾中的针叶林小径,光束穿过树梢,{CARD_PHOTO}",
}

TASKS = ([(BASE / "avatars" / f"{k}.png", p) for k, p in AVATARS.items()]
         + [(BASE / "cards" / f"{k}.png", p) for k, p in CARDS.items()])


def gen(path: Path, prompt: str) -> str:
    if path.exists():
        return f"skip  {path.name}"
    path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(MAX_RETRY):
        try:
            r = client.images.generate(model=image_gen_model(), prompt=prompt, size="1024x1024", n=1)
            path.write_bytes(base64.b64decode(r.data[0].b64_json))
            return f"ok    {path.name}  ({path.stat().st_size // 1024} KB)"
        except Exception as e:  # 网关偶发 404/超时
            if attempt == MAX_RETRY - 1:
                return f"FAIL  {path.name}: {type(e).__name__} {str(e)[:80]}"
            time.sleep(2 ** attempt + random.random())
    return f"FAIL  {path.name}"


def main():
    global client
    client = make_image_client()
    print(f"model={image_gen_model()}  待生成 {len(TASKS)} 张")
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(gen, p, pr) for p, pr in TASKS]
        for f in as_completed(futs):
            print(" ", f.result())


if __name__ == "__main__":
    main()
