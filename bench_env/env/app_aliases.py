"""Resolve open_app names from app manifests, not a stale hardcoded subset.

Launcher / PackageManagerService already know displayName + aliases
(BOSS直聘, 闲鱼, 菜鸟, …). Python APP_NAME_MAP used to list only the original
system apps, so Venus Launch(中文名) returned APP_NOT_FOUND without calling
__OS__.openApp. 0904 Qwen/Gemini mostly clicked launcher icons and never hit this.
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

_MOBILEGYM_ROOT = Path(__file__).resolve().parents[2]

# Names that existed before manifests grew aliases. Keep them so old prompts
# (备忘录, B站, 高德地图, …) still resolve even if a manifest omitted them.
LEGACY_ALIASES: dict[str, str] = {
    "设置": "settings",
    "Settings": "settings",
    "相册": "gallery",
    "Gallery": "gallery",
    "文件": "file_manager",
    "文件管理": "file_manager",
    "File Manager": "file_manager",
    "计算器": "calculator",
    "Calculator": "calculator",
    "计算器2": "calculator2",
    "时钟": "clock",
    "Clock": "clock",
    "通讯录": "contacts",
    "联系人": "contacts",
    "Contacts": "contacts",
    "笔记": "notes",
    "备忘录": "notes",
    "Notes": "notes",
    "指南针": "compass",
    "Compass": "compass",
    "电话": "phone",
    "Phone": "phone",
    "浏览器": "browser",
    "Browser": "browser",
    "相机": "camera",
    "Camera": "camera",
    "微信": "wechat",
    "WeChat": "wechat",
    "天气": "weather",
    "Weather": "weather",
    "微信读书": "wechat_reading",
    "WeChat Reading": "wechat_reading",
    "哔哩哔哩": "bilibili",
    "B站": "bilibili",
    "Bilibili": "bilibili",
    "腾讯会议": "tencent_meeting",
    "Tencent Meeting": "tencent_meeting",
    "QQ音乐": "qqmusic",
    "QQMusic": "qqmusic",
    "QQ Music": "qqmusic",
    "支付宝": "alipay",
    "Alipay": "alipay",
    "地图": "map",
    "高德地图": "map",
    "高德": "map",
    "Map": "map",
    "Maps": "map",
    "AMap": "map",
    "Amap": "map",
    "谷歌地图": "map",
    "Google Maps": "map",
    "百度地图": "map",
    "小红书": "redbook",
    "RedNote": "redbook",
    "Spotify": "spotify",
    "X": "x",
    "Twitter": "x",
    "Reddit": "reddit",
    "短信": "sms",
    "SMS": "sms",
    "日历": "calendar",
    "Calendar": "calendar",
    "主题商店": "theme_store",
    "Theme Store": "theme_store",
    "铁路12306": "railway12306",
    "12306": "railway12306",
    "eBay": "ebay",
    "Ebay": "ebay",
    "淘宝": "taobao",
    "淘宝网": "taobao",
    "Taobao": "taobao",
    "taobao": "taobao",
    "答题卡": "answer_sheet",
    "Answer Sheet": "answer_sheet",
    "AnswerSheet": "answer_sheet",
}

# Agent-facing nicknames that are the same installed app, not a different product.
# Do not add 小宇宙 / Nimbus Mail / 周末听读 — those are wrong-app names (ability).
EXTRA_AGENT_ALIASES: dict[str, str] = {
    "卡皮总账本": "kapi",
}

_ID_RE = re.compile(r"""\bid\s*:\s*['"]([^'"]+)['"]""")
_DISPLAY_RE = re.compile(r"""\bdisplayName\s*:\s*['"]([^'"]+)['"]""")
_DISPLAY_EN_RE = re.compile(r"""\bdisplayNameEn\s*:\s*['"]([^'"]+)['"]""")
_ALIASES_RE = re.compile(r"""\baliases\s*:\s*\[(.*?)\]""", re.S)
_STR_RE = re.compile(r"""['"]([^'"]+)['"]""")


def _parse_manifest(text: str) -> tuple[str, list[str]] | None:
    id_match = _ID_RE.search(text)
    if not id_match:
        return None
    app_id = id_match.group(1).strip()
    if not app_id:
        return None
    names: list[str] = [app_id]
    display = _DISPLAY_RE.search(text)
    if display:
        names.append(display.group(1).strip())
    display_en = _DISPLAY_EN_RE.search(text)
    if display_en:
        names.append(display_en.group(1).strip())
    aliases = _ALIASES_RE.search(text)
    if aliases:
        names.extend(item.strip() for item in _STR_RE.findall(aliases.group(1)) if item.strip())
    return app_id, names


def load_manifest_aliases(root: Path | None = None) -> dict[str, str]:
    gym_root = root or _MOBILEGYM_ROOT
    mapping: dict[str, str] = {}
    paths = sorted(gym_root.glob("apps/*/manifest.ts")) + sorted(
        gym_root.glob("system/*/manifest.ts")
    )
    for path in paths:
        parsed = _parse_manifest(path.read_text(encoding="utf-8"))
        if parsed is None:
            continue
        app_id, names = parsed
        mapping.setdefault(app_id, app_id)
        for name in names:
            mapping.setdefault(name, app_id)
    return mapping


@lru_cache(maxsize=1)
def build_app_name_map() -> dict[str, str]:
    mapping = dict(LEGACY_ALIASES)
    mapping.update(load_manifest_aliases())
    for name, app_id in EXTRA_AGENT_ALIASES.items():
        mapping.setdefault(name, app_id)
    return mapping


def known_app_ids(app_name_map: dict[str, str] | None = None) -> frozenset[str]:
    mapping = app_name_map if app_name_map is not None else build_app_name_map()
    return frozenset(mapping.values())


def resolve_app_id(
    app_name: str,
    app_name_map: dict[str, str] | None = None,
    known_ids: frozenset[str] | set[str] | None = None,
) -> str | None:
    name = str(app_name or "").strip()
    if not name:
        return None
    mapping = app_name_map if app_name_map is not None else build_app_name_map()
    if name in mapping:
        return mapping[name]
    lowered = name.lower()
    ids = known_ids if known_ids is not None else known_app_ids(mapping)
    if lowered in ids:
        return lowered
    for alias, app_id in mapping.items():
        if alias.lower() == lowered:
            return app_id
    return None
