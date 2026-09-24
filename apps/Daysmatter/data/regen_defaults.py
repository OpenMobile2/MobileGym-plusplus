# -*- coding: utf-8 -*-
"""
倒数日 defaults.json 生成器(中性示例数据)。

隐私红线:绝不写入真机截图中的任何个人事件/日期/自建本子。
所有事件均为通用演示主题,日期为 UTC 零点绝对毫秒(与 App 内 UTC 零点基准一致,
保证按天数差为整数)。修改本文件后请同步 DATA_VERSION。

运行: python apps/Daysmatter/data/regen_defaults.py
"""
import json
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).parent / "defaults.json"


def ms(y, m, d):
    return int(datetime(y, m, d, tzinfo=timezone.utc).timestamp() * 1000)


notebooks = [
    {"id": "nb_life", "name": "生活", "icon": "📔", "cover": "cover_life", "isSystem": True, "order": 0},
    {"id": "nb_work", "name": "工作", "icon": "💼", "cover": "cover_work", "isSystem": True, "order": 1},
    {"id": "nb_anniv", "name": "纪念日", "icon": "🎂", "cover": "cover_anniv", "isSystem": True, "order": 2},
    {"id": "nb_study", "name": "学习", "icon": "🎯", "cover": "cover_green", "isSystem": False, "order": 3},
]


def ev(eid, title, y, m, d, nb, **kw):
    base = {
        "id": eid,
        "title": title,
        "targetDate": ms(y, m, d),
        "notebookId": nb,
        "calendar": "solar",
        "pinned": False,
        "showOnHome": True,
        "repeat": "none",
        "reminder": "none",
        "plusOne": False,
        "hasEndDate": False,
        "archived": False,
        "createdAt": ms(2026, 1, 1),
    }
    base.update(kw)
    return base


# 通用演示事件(无任何个人信息)
events = [
    ev("e_launch", "项目上线", 2026, 9, 15, "nb_work", pinned=True, reminder="weekly"),
    ev("e_trip", "旅行出发", 2026, 8, 1, "nb_life", repeat="none"),
    ev("e_report", "提交季度报告", 2026, 7, 10, "nb_work", reminder="daily"),
    ev("e_record", "开始记录", 2026, 1, 1, "nb_life", plusOne=True),  # 过去→正数
    ev("e_anniv", "重要纪念日", 2026, 11, 11, "nb_anniv", repeat="year", reminder="yearly"),
    ev("e_exam", "结课考试", 2026, 12, 20, "nb_study"),
    ev("e_old", "旧活动(已归档)", 2025, 10, 1, "nb_life", archived=True, showOnHome=False),
]

config = {
    "user": {"loggedIn": False, "name": "倒数日用户"},
    "notebooks": notebooks,
    "events": events,
    "settings": {
        "bigFont": False,
        "cardAnim": True,
        "autoPin": False,
        "hideAffix": False,
        "sortBy": "eventTime",
        "adsHidden": False,
    },
    "filter": {"kind": "home"},
    "widgetEventId": "e_launch",
}

OUT.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {OUT} ({len(events)} events, {len(notebooks)} notebooks)")
