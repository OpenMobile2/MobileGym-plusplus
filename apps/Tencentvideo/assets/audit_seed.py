# -*- coding: utf-8 -*-
"""
种子数据一致性自检:跨页引用同一部片时,集数/进度/角标/图片引用必须对得上。

复刻验收里「数据一致性」是硬项:首页卡片说「更新至15集」、详情页却按 33 集画选集,
或者观看历史停在第 20 集而该片只更新到 15 集,都会被一眼看穿。这个脚本把这类矛盾
在构建期抓出来,而不是等走查时靠人眼。

运行:python3 apps/Tencentvideo/assets/audit_seed.py
退出码非 0 = 有 ERROR。
"""
import json
import os
import re
from pathlib import Path

APP = Path(__file__).parent.parent
DEFAULTS = APP / "data" / "defaults.json"
IMG = APP / "res" / "img"

d = json.loads(DEFAULTS.read_text(encoding="utf-8"))
imgs = set(os.listdir(IMG))
contents = {c["id"]: c for c in d["contents"]}

errors: list[str] = []
warns: list[str] = []


def ref(where: str, cid: str) -> None:
    if cid not in contents:
        errors.append(f"[未知 contentId] {where} -> {cid}")


def img_ref(where: str, name) -> None:
    if not name or not isinstance(name, str):
        return
    if name.endswith((".png", ".svg")) and name not in imgs:
        errors.append(f"[缺图] {where} -> {name}")


# ---- 1. 内容自洽 ----
for cid, c in contents.items():
    eps, upto, vip = c.get("episodes"), c.get("updatedTo"), c.get("vipFrom")
    if eps and upto and upto > eps:
        errors.append(f"[集数矛盾] {cid} 更新至{upto} > 全{eps}集")
    if eps and vip and vip > eps:
        errors.append(f"[VIP起始集越界] {cid} vipFrom={vip} > 全{eps}集")
    if c.get("rating") is not None and not (0 <= c["rating"] <= 10):
        errors.append(f"[评分越界] {cid} {c['rating']}")
    img_ref(f"contents[{cid}].poster", c.get("poster"))
    img_ref(f"contents[{cid}].still", c.get("still"))


# ---- 2. 各页引用的 contentId ----
def walk(node, path):
    """所有看起来是内容 id 的字符串都回查 contents(id 前缀白名单)。"""
    if isinstance(node, dict):
        for k, v in node.items():
            # 只有「指向某部片」的字段才回查;短视频/二创条目自带的 id 是它自己的主键,不是片 id
            if k in ("contentId", "linkedFilm") and isinstance(v, str):
                ref(f"{path}.{k}", v)
            elif k == "id":
                continue
            else:
                walk(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            if isinstance(v, str) and re.match(r"^(tv|mv|an|sd|sv|vs|doc|sp)_", v):
                ref(f"{path}[{i}]", v)
            else:
                walk(v, f"{path}[{i}]")
    elif isinstance(node, str):
        if node.endswith(".png"):
            img_ref(path, node)


for key in ("channels", "rankings", "searchHub", "pickFilm", "favorites", "chasing",
            "reservations", "watchHistory", "discussions", "downloads", "actor",
            "series", "guessYouFollow", "membership", "yearHotActivity", "goodsShop",
            "messages", "coins", "drawer", "vipCards", "detail", "player"):
    if key in d:
        walk(d[key], key)

for tid in d.get("comments", {}):
    ref(f"comments.{tid}", tid)

# ---- 3. 跨页数字口径 ----
for e in d.get("chasing", []):
    c = contents.get(e["contentId"])
    if not c:
        continue
    m = re.search(r"(\d+)", e.get("updateBadge", ""))
    if m and c.get("updatedTo") and int(m.group(1)) != c["updatedTo"]:
        errors.append(
            f"[追剧角标与内容不符] {e['contentId']} 追剧页「{e['updateBadge']}」 vs contents.updatedTo={c['updatedTo']}"
        )

for h in d.get("watchHistory", []):
    cid = h.get("contentId")
    c = contents.get(cid) if cid else None
    if not c:
        continue
    m = re.search(r"(\d+)", h.get("episode", "") or "")
    if m:
        watched = int(m.group(1))
        limit = c.get("updatedTo") or c.get("episodes")
        if limit and watched > limit:
            errors.append(
                f"[历史进度越界] {cid} 看到第{watched}集,但只更新到{limit}集"
            )
    pct = h.get("progressPct")
    if pct is not None and not (0 <= pct <= 100):
        errors.append(f"[历史进度百分比越界] {cid} {pct}")

for f in d.get("favorites", []):
    c = contents.get(f["contentId"])
    if not c:
        continue
    m = re.search(r"第(\d+)集", f.get("progressText", ""))
    if m:
        limit = c.get("updatedTo") or c.get("episodes")
        if limit and int(m.group(1)) > limit:
            errors.append(
                f"[收藏进度越界] {f['contentId']} 「{f['progressText']}」 > 更新至{limit}集"
            )

# 同一部片在「观看历史 / 收藏 / 追剧」三处的进度必须是同一个数
progress_by_source: dict[str, dict[str, int]] = {}


def note_progress(source: str, cid: str, text: str) -> None:
    m = re.search(r"第(\d+)[集期]", text or "")
    if not m:
        return
    progress_by_source.setdefault(cid, {})[source] = int(m.group(1))


for h in d.get("watchHistory", []):
    if h.get("contentId"):
        note_progress("观看历史", h["contentId"], h.get("episode", ""))
for f in d.get("favorites", []):
    note_progress("收藏", f["contentId"], f.get("progressText", ""))
for e in d.get("chasing", []):
    note_progress("追剧", e["contentId"], e.get("progressText", ""))
for cid, by in progress_by_source.items():
    if len(set(by.values())) > 1:
        detail = "、".join(f"{k}={v}" for k, v in by.items())
        errors.append(f"[跨页进度打架] {cid} {detail}")

# ---- 4. 会员口径 ----
mem, user = d["membership"], d["user"]
if mem["expire"] != user["vipExpire"]:
    errors.append(f"[会员到期日两处不一致] membership.expire={mem['expire']} vs user.vipExpire={user['vipExpire']}")
if mem["levelLabel"] != user["vipLevelLabel"]:
    errors.append(f"[会员等级两处不一致] {mem['levelLabel']} vs {user['vipLevelLabel']}")
if mem["status"] != user["membership"]:
    errors.append(f"[会员状态两处不一致] {mem['status']} vs {user['membership']}")
if mem["vPower"]["value"] != user["vPower"]:
    errors.append(f"[V力值两处不一致] {mem['vPower']['value']} vs {user['vPower']}")
if mem["pointsMall"]["points"] != user["points"]:
    errors.append(f"[积分两处不一致] {mem['pointsMall']['points']} vs {user['points']}")
if mem["coins"] if "coins" in mem else False:
    pass
if d["coins"]["balance"] != user["coins"]:
    errors.append(f"[金币两处不一致] coins.balance={d['coins']['balance']} vs user.coins={user['coins']}")

# 设备配额口径 vs 收银台权益对比表
quota_vip = mem_row = None
for row in mem["benefitsCompare"]:
    if row["item"] == "累计登录使用":
        mem_row = row
if mem_row:
    quota_vip = d["devices"]["quota"]["vip"]
    if mem_row["vip"].rstrip("台") not in quota_vip:
        warns.append(f"[设备配额口径存疑] 对比表 VIP {mem_row['vip']} vs devices.quota.vip {quota_vip}")
    if mem_row["svip"].rstrip("台") not in d["devices"]["quota"]["svip"]:
        warns.append(f"[设备配额口径存疑] 对比表 SVIP {mem_row['svip']} vs devices.quota.svip {d['devices']['quota']['svip']}")
if len(d["devices"]["list"]) != int(re.search(r"(\d+)", user["deviceLoginTip"]).group(1)):
    errors.append("[设备台数与提示文案不符] devices.list 与 user.deviceLoginTip")

# ---- 5. 收银台档位 ----
for p in mem["vipPlans"] + mem["svipPlans"]:
    if p["price"] > p["origPrice"]:
        errors.append(f"[划线价低于售价] {p['id']} {p['price']} > {p['origPrice']}")
    if p["id"] not in mem["addOn"]["byPlan"]:
        errors.append(f"[档位缺顺手带一件配置] {p['id']}")

print(f"contents={len(contents)} images={len(imgs)}")
for w in warns:
    print("WARN ", w)
for e in errors:
    print("ERROR", e)
print(f"\n{len(errors)} error / {len(warns)} warn")
raise SystemExit(1 if errors else 0)
