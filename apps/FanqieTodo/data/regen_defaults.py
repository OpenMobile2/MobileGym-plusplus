#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 apps/FanqieTodo/data/defaults.json。改动后须递增 constants.ts 的 DATA_VERSION。
隐私:不含真实个人数据。种子刻意铺开多样性(类型/计时/时长/进度各异)。"""
import json
from pathlib import Path

OUT = Path(__file__).parent / "defaults.json"

# 基准时间:2026-07-06 (与真机截图一致),绝对 Unix 毫秒(UTC+8 记为本地墙钟)
DAY = 86400000
BASE = 1783699200000  # 2026-07-06 00:00
T = lambda h, m=0: BASE + h * 3600000 + m * 60000

# 6 条种子待办(取自真机首页 s60,多样:类型/计时/时长/背景/进度各异)
todos = [
    dict(id="t_doc", name="文档写作", type="normal", timing="countdown",
         durationMin=25, bgKey="confetti", bgColor="#2AA6A0", order=0,
         todayFocusCount=0, todayDoneCount=0),
    dict(id="t_paper", name="论文阅读", type="habit", timing="countup",
         durationMin=0, bgKey="night", bgColor="#3B417A", order=1,
         todayFocusCount=0, todayDoneCount=0, habitTodayMin=0, habitTargetMin=60),
    dict(id="t_code", name="代码", type="normal", timing="countup",
         durationMin=0, bgKey="starlight", bgColor="#E8A0AE", order=2,
         todayFocusCount=2, todayDoneCount=0),
    dict(id="t_agent", name="mobile agent调研", type="normal", timing="countup",
         durationMin=0, bgKey="birds", bgColor="#C79A6B", order=3,
         todayFocusCount=2, todayDoneCount=0),
    dict(id="t_express", name="取快递", type="normal", timing="none",
         durationMin=0, bgKey="dawn", bgColor="#BFC6CE", order=4,
         todayFocusCount=0, todayDoneCount=1),
    dict(id="t_goal", name="备考计划", type="goal", timing="countdown",
         durationMin=25, bgKey="snow", bgColor="#9FB2C4", order=5,
         todayFocusCount=0, todayDoneCount=0,
         goalDate=BASE + 40 * DAY, goalHours=60),
]

# 专注记录(时间轴 s80),多样时长/百分比
records = [
    dict(id="r1", todoId="t_express", todoName="取快递", startTs=T(18, 54),
         endTs=T(18, 54), durationMin=0, status="done"),
    dict(id="r2", todoId="t_code", todoName="代码", startTs=T(18, 53),
         endTs=T(18, 53), durationMin=0, status="done"),
    dict(id="r3", todoId="t_paper", todoName="论文阅读", startTs=T(17, 40),
         endTs=T(18, 6), durationMin=26, status="done", percent=100),
    dict(id="r4", todoId="t_code", todoName="代码", startTs=T(14, 32),
         endTs=T(17, 30), durationMin=178, status="done", percent=100,
         reflection="今天状态不错,一口气写完了核心模块。"),
]

# 未来倒计时(多样),真机首次为空;这里给内置示例便于展示
futures = [
    dict(id="f1", name="考研", remark="上岸心仪的学校", targetDate=BASE + 180 * DAY),
    dict(id="f2", name="毕业", remark="顺利答辩", targetDate=BASE + 320 * DAY),
    dict(id="f3", name="生日", remark="又长大一岁", targetDate=BASE + 52 * DAY),
]

data = dict(
    user=dict(name="Chenn", signature="千里之行,始于足下",
              avatarKey="user", account="oirUauA4-n5tbwK7xAiEfn4xfWlY"),
    todos=todos,
    records=records,
    futures=futures,
    settings=dict(restDurationMin=0, studyMode=False, strictMode=False,
                  midnightMode=True, noStrikethrough=True, fixedOrder=False,
                  pullSearch=True, focusVisible=True, wakeVisible=True,
                  lockCountStats=True, themeColor="blue"),
    stats=dict(totalCount=108, totalMinutes=6817, streakDays=1, totalDays=43,
               monthlyLockExit=0),
)

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK: defaults.json ({OUT.stat().st_size} bytes, {len(todos)} todos, "
      f"{len(records)} records, {len(futures)} futures)")
