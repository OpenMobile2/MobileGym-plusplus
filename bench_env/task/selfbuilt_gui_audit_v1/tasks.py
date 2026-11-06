"""One real GUI exploration episode per self-built App.

These are audit trajectories, not business-SR tasks.  PASS only means the
agent reached a non-home route after visiting the UI; screenshots/actions are
used to identify broken navigation, blank pages, fake controls and crashes.
"""

from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput


APPS = {
    "Baicizhan": ("baicizhan", "百词斩"), "Boss": ("boss", "BOSS直聘"),
    "Broadcast": ("broadcast", "播客"), "Cainiao": ("cainiao", "菜鸟"),
    "Ctrip": ("ctrip", "携程"), "Daysmatter": ("daysmatter", "倒数日"),
    "Dianping": ("dianping", "大众点评"), "Dida": ("dida", "滴答清单"),
    "Didi": ("didi", "滴滴"), "Douban": ("douban", "豆瓣"),
    "Fanqietodo": ("fanqietodo", "番茄Todo"), "Fanqiexiaoshuo": ("fanqiexiaoshuo", "番茄小说"),
    "Flomo": ("flomo", "Flomo"), "Googledrive": ("googledrive", "Google Drive"),
    "Jingdong": ("jingdong", "京东"), "Kapi": ("kapi", "Kapi记账"),
    "Keep": ("keep", "Keep"), "Luckin": ("luckin", "瑞幸咖啡"),
    "Mail": ("mail", "邮箱"), "Maoyan": ("maoyan", "猫眼"),
    "Meiyou": ("meiyou", "美柚"), "Pinduoduo": ("pinduoduo", "拼多多"),
    "Suning": ("suning", "苏宁易购"), "Taobao": ("taobao", "淘宝"),
    "Tbsg": ("tbsg", "淘宝闪购"), "Tencentvideo": ("tencentvideo", "腾讯视频"),
    "Vipshop": ("vipshop", "唯品会"), "Wechat": ("wechat", "微信"),
    "Weibo": ("weibo", "微博"), "Xianyu": ("xianyu", "闲鱼"),
    "Xiaorichang": ("xiaorichang", "小日常"), "Ximalaya": ("ximalaya", "喜马拉雅"),
    "Youku": ("youku", "优酷"),
}


def _check(input: JudgeInput) -> list[dict[str, Any]]:
    path = str((input.route or {}).get("path") or "")
    return [{"field": "final_non_home_route", "expected": "非首页列表/详情/功能页", "actual": path,
             "passed": path not in {"", "/"}}]


for class_name, (app_id, display_name) in APPS.items():
    globals()[f"Audit{class_name}"] = type(
        f"Audit{class_name}",
        (BaseTask,),
        {
            "__module__": __name__,
            "templates": [f"在{display_name}中做一次完整GUI巡检：浏览首页并下滑，依次打开主要底部栏目，再进入一个列表项或功能入口的详情页；不要执行支付、删除、发布或发送消息。最后停留在你打开的非首页页面。"],
            "apps": [app_id],
            "scope": "S1", "objective": "query", "composition": "sequential",
            "difficulty": "L2", "capabilities": ["nav", "browse"], "max_steps": 30,
            "check_goals": _check,
        },
    )

