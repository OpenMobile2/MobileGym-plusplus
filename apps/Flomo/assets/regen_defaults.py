# -*- coding: utf-8 -*-
"""
flomo 种子数据生成器(Playbook §5.2)。
- 永远用本脚本生成 defaults.json,不手写。
- 合成数据:不使用真机截图里的真实用户信息(YanZ/手机号/真实笔记原文)。
- 图片:无生图 key 时生成 SVG 占位;有 PNG 则优先用 PNG(IMG helper)。
运行: python apps/Flomo/assets/regen_defaults.py
"""
import json
from pathlib import Path

APP = Path(__file__).parent.parent
OUT = APP / "data" / "defaults.json"
IMAGES = APP / "assets" / "images"
AVATARS = APP / "assets" / "avatars"
IMAGES.mkdir(parents=True, exist_ok=True)
AVATARS.mkdir(parents=True, exist_ok=True)

BASE_TS = 1782000000000  # 固定基准点(绝对 Unix 毫秒,约 2026-06)
T = lambda d, h=0, m=0: BASE_TS - d * 86400000 + h * 3600000 + m * 60000

A = lambda f: f"/@app-assets/Flomo/avatars/{f}"
I = lambda f: f"/@app-assets/Flomo/images/{f}"

INK = ["#33B679", "#5B8DEF", "#E8923C", "#9B6BDF", "#E0608A", "#3FB6B6", "#7A8A99", "#C7913C"]

def svg_avatar(name: str, ch: str, idx: int):
    bg = INK[idx % len(INK)]
    (AVATARS / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        f'<rect width="100" height="100" rx="26" fill="{bg}"/>'
        f'<text x="50%" y="63%" text-anchor="middle" font-size="46" fill="#fff" '
        f'font-family="sans-serif">{ch}</text></svg>', encoding="utf-8")

def svg_image(name: str, label: str, idx: int):
    bg = INK[idx % len(INK)]
    (IMAGES / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">'
        f'<rect width="400" height="300" fill="{bg}" opacity="0.18"/>'
        f'<rect width="400" height="300" fill="none" stroke="{bg}" stroke-width="2"/>'
        f'<text x="50%" y="52%" text-anchor="middle" font-size="22" fill="{bg}" '
        f'font-family="sans-serif">{label}</text></svg>', encoding="utf-8")

def IMG(stem: str, label: str, idx: int) -> str:
    png = IMAGES / f"{stem}.png"
    if png.exists():
        return I(f"{stem}.png")
    svg_image(f"{stem}.svg", label, idx)
    return I(f"{stem}.svg")

def AV(stem: str, ch: str, idx: int) -> str:
    png = AVATARS / f"{stem}.png"
    if png.exists():
        return A(f"{stem}.png")
    svg_avatar(f"{stem}.svg", ch, idx)
    return A(f"{stem}.svg")

# ---- 头像 ----
ME_AVATAR = AV("me", "墨", 0)

# ---- 标签树(自创标签,含层级) ----
tags = [
    {"id": "t_welcome", "name": "欢迎", "parentId": None, "count": 3},
    {"id": "t_welcome_intro", "name": "欢迎/简介", "parentId": "t_welcome", "count": 2},
    {"id": "t_welcome_list", "name": "欢迎/列表", "parentId": "t_welcome", "count": 1},
    {"id": "t_if", "name": "如果", "parentId": None, "count": 2},
    {"id": "t_memory", "name": "记忆", "parentId": None, "count": 2},
    {"id": "t_read", "name": "读书", "parentId": None, "count": 2},
]

# ---- 笔记(合成内容) ----
memos = [
    {"id": "m_01", "content": "把今天读到的一句话记下来:做难而正确的事。 #读书", "tags": ["t_read"],
     "images": [], "hasLink": False, "hasAudio": False, "source": "app",
     "sourceMemoId": None, "pinned": False, "deleted": False,
     "createdAt": T(0, 12, 53), "updatedAt": T(0, 12, 53)},
    {"id": "m_02", "content": "关联自: 这条才是批注,补充一点我的想法。 #欢迎/简介", "tags": ["t_welcome_intro"],
     "images": [], "hasLink": False, "hasAudio": False, "source": "app",
     "sourceMemoId": "m_05", "pinned": False, "deleted": False,
     "createdAt": T(0, 12, 50), "updatedAt": T(0, 12, 50)},
    {"id": "m_03", "content": "- 我非常喜欢这个想法\n- 我有点犹豫\n- 再想想\n- 先记下来", "tags": ["t_welcome_list"],
     "images": [], "hasLink": False, "hasAudio": False, "source": "app",
     "sourceMemoId": None, "pinned": True, "deleted": False,
     "createdAt": T(0, 12, 39), "updatedAt": T(0, 12, 39)},
    {"id": "m_04", "content": "今天天气很好,拍了张照片。 #记忆",
     "tags": ["t_memory"], "images": [IMG("memo_cat", "照片", 0)], "hasLink": False,
     "hasAudio": False, "source": "app", "sourceMemoId": None, "pinned": False,
     "deleted": False, "createdAt": T(1, 9, 12), "updatedAt": T(1, 9, 12)},
    {"id": "m_05", "content": "Good morning. 这是一段比较长的英文笔记,用来测试详情页和折叠效果。"
     "I am learning how to take notes with flomo, and this memo is referenced by others. #欢迎/简介",
     "tags": ["t_welcome_intro"], "images": [IMG("memo_coffee", "咖啡", 4)], "hasLink": False, "hasAudio": False,
     "source": "app", "sourceMemoId": None, "pinned": False, "deleted": False,
     "createdAt": T(3, 12, 12), "updatedAt": T(3, 12, 12)},
    {"id": "m_06", "content": "一个有用的链接,稍后再看。 https://flomoapp.com #欢迎",
     "tags": ["t_welcome"], "images": [], "hasLink": True, "hasAudio": False,
     "source": "app", "sourceMemoId": None, "pinned": False, "deleted": False,
     "createdAt": T(4, 10, 30), "updatedAt": T(4, 10, 30)},
    {"id": "m_07", "content": "如果坚持每天记一条,一年后会怎样? #如果",
     "tags": ["t_if"], "images": [], "hasLink": False, "hasAudio": False,
     "source": "app", "sourceMemoId": None, "pinned": False, "deleted": False,
     "createdAt": T(5, 14, 14), "updatedAt": T(5, 14, 14)},
    {"id": "m_08", "content": "从微信输入的一条灵感:好的工具应该让人忘记工具本身。",
     "tags": [], "images": [], "hasLink": False, "hasAudio": False, "source": "wechat",
     "sourceMemoId": None, "pinned": False, "deleted": False,
     "createdAt": T(6, 22, 48), "updatedAt": T(6, 22, 48)},
    {"id": "m_09", "content": "如果只能留一个习惯,我希望是记录。 #如果",
     "tags": ["t_if"], "images": [], "hasLink": False, "hasAudio": False,
     "source": "app", "sourceMemoId": None, "pinned": False, "deleted": False,
     "createdAt": T(9, 8, 5), "updatedAt": T(9, 8, 5)},
    {"id": "m_10", "content": "记忆是会褪色的,所以才要写下来。 #记忆",
     "tags": ["t_memory"], "images": [IMG("memo_note", "手记", 3)], "hasLink": False,
     "hasAudio": False, "source": "app", "sourceMemoId": None, "pinned": False,
     "deleted": False, "createdAt": T(12, 19, 0), "updatedAt": T(12, 19, 0)},
    {"id": "m_11", "content": "读完一本书的最好方式,是把它讲给别人听。 #读书",
     "tags": ["t_read"], "images": [IMG("memo_book", "书", 2)], "hasLink": False, "hasAudio": False,
     "source": "app", "sourceMemoId": None, "pinned": False, "deleted": False,
     "createdAt": T(15, 11, 20), "updatedAt": T(15, 11, 20)},
    {"id": "m_12", "content": "欢迎使用 flomo,先从写下第一条想法开始。 #欢迎",
     "tags": ["t_welcome"], "images": [], "hasLink": False, "hasAudio": False,
     "source": "app", "sourceMemoId": None, "pinned": False, "deleted": False,
     "createdAt": T(40, 9, 0), "updatedAt": T(40, 9, 0)},
    {"id": "m_13", "content": "一条已删除的笔记,放在回收站里。",
     "tags": [], "images": [], "hasLink": False, "hasAudio": False, "source": "app",
     "sourceMemoId": None, "pinned": False, "deleted": True,
     "createdAt": T(2, 16, 0), "updatedAt": T(2, 16, 0)},
]

notifications = [
    {"id": "n_1",
     "text": "PRO 会员即将到期\n还有 3 天到期,如希望继续使用「AI 洞察」「相关笔记」「每日回顾」等 PRO 版功能,请点击续费。",
     "createdAt": T(0, 8, 0), "read": False},
    {"id": "n_2",
     "text": "查看6月记录统计\n这个月在 flomo 记录了多少东西呢?点此查看为你准备的报告吧,持续不断记录,意义自然浮现。",
     "createdAt": T(1, 9, 27), "read": True},
    {"id": "n_3",
     "text": "获得 2 天 PRO 时长\n目前 PRO 服务到期日为 2026-07-04 23:59:59。完成新手任务:在 App 写一条 MEMO。",
     "createdAt": T(2, 12, 42), "read": True},
    {"id": "n_4",
     "text": "获得 2 天 PRO 时长\n目前 PRO 服务到期日为 2026-07-02 23:59:59。完成新手任务:在网页端写一条 MEMO。",
     "createdAt": T(3, 12, 42), "read": True},
    {"id": "n_5",
     "text": "查看5月记录统计\n这个月在 flomo 记录了多少东西呢?点此查看为你准备的报告吧,持续不断记录,意义自然浮现。",
     "createdAt": T(31, 7, 20), "read": True},
]

data = {
    "user": {
        "id": "u_self", "name": "默墨", "avatar": ME_AVATAR, "pro": True,
        "proExpire": "2026/07/04", "phone": "188****0000",
        "memoCount": 284, "tagCount": 6, "days": 1408, "storageUsedMb": 24.0,
    },
    "memos": memos,
    "tags": tags,
    "notifications": notifications,
    "settings": {
        "theme": "light", "fontSize": 16, "foldLong": True, "foldQuote": True,
        "aiRelated": True, "aiInsight": True, "dailyReviewCount": 8, "dailyNotify": True,
    },
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK: defaults.json 生成 ({OUT.stat().st_size} bytes), "
      f"{len(memos)} memos / {len(tags)} tags / {len(notifications)} notifs; "
      f"SVG 占位图已生成(无生图 key)")
