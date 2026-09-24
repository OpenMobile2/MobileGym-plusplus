# -*- coding: utf-8 -*-
"""
滴滴 装饰位图批量生图(pipeline v3 §5.3)。
- key 只从环境变量读,绝不写进代码/git:IMAGE_GEN_API_KEY(兼容 TOKENHUB_API_KEY)、
  IMAGE_GEN_BASE_URL、IMAGE_GEN_MODEL。
- 幂等:已存在的 PNG 跳过;失败可重跑只补缺失。4 并发。
- 安全:prompt 只描述合成主体,绝不上传真机截图;不出现真实人物/品牌。
运行(由 AI 配好环境变量后执行):
  IMAGE_GEN_API_KEY=... IMAGE_GEN_BASE_URL=... python apps/Didi/assets/gen_images.py
"""
import base64, json, os, sys, tempfile, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlsplit

os.umask(0o077)
MAX_RESPONSE_BYTES = 20 * 1024 * 1024
FORBIDDEN_PROMPT_TOKENS = (
    "didi_images",
    "evidence/",
    "微信图片",
    "真机截图",
    "reference_image",
)


def _read_limited(resp, limit=MAX_RESPONSE_BYTES):
    body = resp.read(limit + 1)
    if len(body) > limit:
        raise ValueError(f"响应超过安全上限 {limit} bytes")
    return body


def _post_json(url, payload, headers, timeout=300):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={**headers, "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        final_url = urlsplit(resp.geturl())
        final_is_local = final_url.hostname in {"127.0.0.1", "localhost", "::1"}
        if final_url.scheme not in ({"http", "https"} if final_is_local else {"https"}):
            raise ValueError("生图 API 重定向到了不安全地址")
        if final_url.username or final_url.password:
            raise ValueError("生图 API 最终地址不得包含凭据")
        return resp.status, _read_limited(resp).decode()


def _get_bytes(url, timeout=120):
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.username or parsed.password:
        raise ValueError("生图结果下载地址必须是不含凭据的 HTTPS URL")
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        final_url = urlsplit(resp.geturl())
        if final_url.scheme != "https" or final_url.username or final_url.password:
            raise ValueError("生图结果重定向到了不安全地址")
        content_type = (resp.headers.get("Content-Type") or "").lower()
        if not content_type.startswith("image/"):
            raise ValueError(f"生图结果 Content-Type 非图片: {content_type or 'missing'}")
        return _read_limited(resp)


def _validate_image(data):
    signatures = (
        b"\x89PNG\r\n\x1a\n",
        b"\xff\xd8\xff",
        b"RIFF",
    )
    if not any(data.startswith(signature) for signature in signatures):
        raise ValueError("生图响应缺少受支持的 PNG/JPEG/WebP 文件签名")
    if data.startswith(b"RIFF") and data[8:12] != b"WEBP":
        raise ValueError("RIFF 响应不是 WebP 图片")


def _safe_output_path(rel):
    root = (APP / "assets").resolve()
    output = (root / rel).resolve()
    if output != root and root not in output.parents:
        raise ValueError(f"输出路径越界: {rel}")
    return output


def _atomic_write_image(output, data):
    _validate_image(data)
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
    with tempfile.NamedTemporaryFile(dir=output.parent, prefix=f".{output.name}.",
                                     suffix=".tmp", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        tmp.write(data)
        tmp.flush()
        os.fsync(tmp.fileno())
    try:
        os.replace(tmp_path, output)
        output.chmod(0o644)
    finally:
        tmp_path.unlink(missing_ok=True)

APP = Path(__file__).parent.parent
KEY = os.environ.get("IMAGE_GEN_API_KEY") or os.environ.get("TOKENHUB_API_KEY")
BASE = (os.environ.get("IMAGE_GEN_BASE_URL") or "").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL") or "gpt-image-2"
SIZE = os.environ.get("IMAGE_GEN_SIZE") or "1024x1024"
if not KEY or not BASE:
    sys.exit("缺少 IMAGE_GEN_API_KEY / IMAGE_GEN_BASE_URL 环境变量;未配置则跳过生图(用 SVG 占位)。")

base_parts = urlsplit(BASE)
is_local = base_parts.hostname in {"127.0.0.1", "localhost", "::1"}
if base_parts.scheme not in ({"http", "https"} if is_local else {"https"}):
    sys.exit("IMAGE_GEN_BASE_URL 必须使用 HTTPS；仅 localhost 可使用 HTTP。")
if base_parts.username or base_parts.password or base_parts.query or base_parts.fragment:
    sys.exit("IMAGE_GEN_BASE_URL 不得包含用户名、密码、查询参数或片段。")

URL = f"{BASE}/images/generations" if BASE.endswith("/v1") else f"{BASE}/v1/images/generations"
NO_TEXT = ",无任何文字、无水印、无logo"

# 待生成清单:(相对 assets 的路径, prompt 主体)
ASSETS = [
    # 司机/用户头像(虚拟人物,证件照风格)
    ("avatars/driver_ke.png",  "中年男性网约车司机正面免冠头像,和蔼微笑,浅蓝色衬衫,纯浅灰背景,证件照风格,写实摄影" + NO_TEXT),
    ("avatars/driver_cai.png", "年轻男性网约车司机正面免冠头像,自信微笑,深色polo衫,纯浅灰背景,证件照风格,写实摄影" + NO_TEXT),
    ("avatars/driver_chen.png","四十岁男性司机正面免冠头像,平和表情,灰色夹克,纯浅灰背景,证件照风格,写实摄影" + NO_TEXT),
    ("avatars/driver_li.png",  "三十岁男性司机正面免冠头像,微笑,白色衬衫,纯浅灰背景,证件照风格,写实摄影" + NO_TEXT),
    ("avatars/user_me.png",    "极简圆形应用头像插画,橙色渐变背景,中心一个抽象白色人形剪影,扁平设计" + NO_TEXT),
    # 车型小图(侧视 45 度,电商产品图风格,白底)
    ("cars/car_economy.png", "一辆白色紧凑型轿车,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    ("cars/car_thrift.png",  "一辆白色紧凑型轿车带橙色车贴,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    ("cars/car_express.png", "一辆银色三厢轿车,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    ("cars/car_fast.png",    "一辆蓝白色新能源轿车,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    ("cars/car_pool.png",    "一辆绿色小型拼车面包车,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    ("cars/car_taxi.png",    "一辆黄绿色出租车,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    ("cars/car_premier.png", "一辆黑色行政级轿车,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    ("cars/car_luxury.png",  "一辆黑色豪华轿车,车身修长,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    ("cars/car_six.png",     "一辆黑色七座商务MPV,45度侧前视角,专业汽车产品摄影,纯白背景" + NO_TEXT),
    # 旅行页酒店缩略图
    ("images/hotel_1.png", "现代城市商务酒店大堂,暖色灯光,酒店宣传照风格" + NO_TEXT),
    ("images/hotel_2.png", "简约风酒店客房,大床和落地窗,自然采光,酒店宣传照" + NO_TEXT),
    ("images/hotel_3.png", "高层酒店外观夜景,玻璃幕墙,城市灯光,酒店宣传照" + NO_TEXT),
    # 皮肤预览图(插画)
    ("images/skin_star.png",     "梦幻星空主题横幅插画,紫色渐变夜空和流星,扁平插画风" + NO_TEXT),
    ("images/skin_football.png", "夏日足球主题横幅插画,绿茵场草地和足球,明快扁平插画风" + NO_TEXT),
    # 活动 banner 插画
    ("images/banner_gift.png",    "橙色主题礼盒和优惠券飘落的庆祝插画,活动横幅风格,扁平插画" + NO_TEXT),
    ("images/banner_savings.png", "橙色钱袋和金币的省钱主题小插画,扁平可爱风" + NO_TEXT),
]


def gen(rel, prompt):
    if any(token.lower() in prompt.lower() for token in FORBIDDEN_PROMPT_TOKENS):
        return (rel, "prompt rejected: contains private-source token")
    out = _safe_output_path(rel)
    if out.exists() and out.stat().st_size > 0:
        return (rel, "skip")
    for attempt in range(3):
        try:
            status, body = _post_json(URL, {"model": MODEL, "prompt": prompt, "size": SIZE, "n": 1},
                                      {"Authorization": f"Bearer {KEY}"})
            if status != 200:
                if attempt == 2:
                    return (rel, f"HTTP {status}")
                time.sleep(3); continue
            items = json.loads(body).get("data", [])
            if items and items[0].get("b64_json"):
                _atomic_write_image(out, base64.b64decode(items[0]["b64_json"], validate=True))
                return (rel, f"ok {out.stat().st_size}B")
            if items and items[0].get("url"):
                _atomic_write_image(out, _get_bytes(items[0]["url"]))
                return (rel, f"ok(url) {out.stat().st_size}B")
            return (rel, "no image in response")
        except Exception as e:
            if attempt == 2:
                return (rel, f"EXC {e}")
            time.sleep(3)
    return (rel, "failed")


def main():
    print(f"api={URL} model={MODEL} size={SIZE} | {len(ASSETS)} assets")
    ok = skip = fail = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen, rel, p): rel for rel, p in ASSETS}
        for f in as_completed(futs):
            rel, status = f.result()
            print(f"  {rel}: {status}")
            if status.startswith("ok"): ok += 1
            elif status == "skip": skip += 1
            else: fail += 1
    print(f"done: ok={ok} skip={skip} fail={fail}")
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
