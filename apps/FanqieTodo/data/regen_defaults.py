#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 apps/FanqieTodo/data/defaults.json。改动后须递增 constants.ts 的 DATA_VERSION。
跨多日专注记录:相对叙事锚日(2026-07-06)的 dayOffset,加载时映射到模拟「今天」。"""
import json
from datetime import datetime
from pathlib import Path

OUT = Path(__file__).parent / "defaults.json"

DAY = 86400000
BASE = int(datetime(2026, 7, 6, 0, 0, 0).timestamp() * 1000)  # 叙事锚日 00:00
T = lambda day_off, h=0, m=0: BASE + day_off * DAY + h * 3600000 + m * 60000

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

# 覆盖「今天」所在整周 + 更早日期,保证日/周/月统计与时间轴月历均有可观察差异
records = [
    # day 0 今天(对齐真机截图当日 4 条)
    dict(id="r1", todoId="t_express", todoName="取快递", startTs=T(0, 18, 54),
         endTs=T(0, 18, 54), durationMin=0, status="done"),
    dict(id="r2", todoId="t_code", todoName="代码", startTs=T(0, 18, 53),
         endTs=T(0, 18, 53), durationMin=0, status="done"),
    dict(id="r3", todoId="t_paper", todoName="论文阅读", startTs=T(0, 17, 40),
         endTs=T(0, 18, 6), durationMin=26, status="done", percent=100),
    dict(id="r4", todoId="t_code", todoName="代码", startTs=T(0, 14, 32),
         endTs=T(0, 17, 30), durationMin=178, status="done", percent=100,
         reflection=""),
    # day -1 ~ -6: 铺满本周其余天
    dict(id="r5", todoId="t_agent", todoName="mobile agent调研", startTs=T(-1, 10, 0),
         endTs=T(-1, 11, 0), durationMin=60, status="done", percent=100),
    dict(id="r6", todoId="t_doc", todoName="文档写作", startTs=T(-1, 15, 10),
         endTs=T(-1, 15, 35), durationMin=25, status="done", percent=100),
    dict(id="r7", todoId="t_code", todoName="代码", startTs=T(-2, 9, 30),
         endTs=T(-2, 11, 0), durationMin=90, status="done", percent=100),
    dict(id="r8", todoId="t_paper", todoName="论文阅读", startTs=T(-3, 20, 0),
         endTs=T(-3, 20, 40), durationMin=40, status="done", percent=100),
    dict(id="r9", todoId="t_code", todoName="代码", startTs=T(-3, 14, 0),
         endTs=T(-3, 14, 30), durationMin=30, status="done", percent=100),
    dict(id="r15", todoId="t_doc", todoName="文档写作", startTs=T(-4, 11, 0),
         endTs=T(-4, 11, 45), durationMin=45, status="done", percent=100),
    dict(id="r10", todoId="t_doc", todoName="文档写作", startTs=T(-5, 16, 0),
         endTs=T(-5, 16, 50), durationMin=50, status="done", percent=100),
    dict(id="r16", todoId="t_agent", todoName="mobile agent调研", startTs=T(-6, 19, 0),
         endTs=T(-6, 19, 35), durationMin=35, status="done", percent=100),
    # 上周及更早(周视图不含或仅部分含,月视图含)——拉开日/周/月差异
    dict(id="r11", todoId="t_agent", todoName="mobile agent调研", startTs=T(-7, 11, 0),
         endTs=T(-7, 13, 0), durationMin=120, status="done", percent=100),
    dict(id="r12", todoId="t_code", todoName="代码", startTs=T(-10, 9, 0),
         endTs=T(-10, 9, 55), durationMin=55, status="done", percent=100),
    dict(id="r13", todoId="t_paper", todoName="论文阅读", startTs=T(-10, 21, 0),
         endTs=T(-10, 21, 35), durationMin=35, status="done", percent=100),
    dict(id="r14", todoId="t_doc", todoName="文档写作", startTs=T(-12, 13, 20),
         endTs=T(-12, 13, 45), durationMin=25, status="done", percent=100),
    dict(id="r17", todoId="t_code", todoName="代码", startTs=T(-14, 8, 30),
         endTs=T(-14, 9, 30), durationMin=60, status="done", percent=100),
    dict(id="r18", todoId="t_paper", todoName="论文阅读", startTs=T(-18, 21, 0),
         endTs=T(-18, 21, 50), durationMin=50, status="done", percent=100),
    # 上月及更早(时间轴切月份可见;月统计与本月拉开差距)
    dict(id="r19", todoId="t_code", todoName="代码", startTs=T(-25, 10, 15),
         endTs=T(-25, 11, 30), durationMin=75, status="done", percent=100),
    dict(id="r20", todoId="t_doc", todoName="文档写作", startTs=T(-28, 14, 0),
         endTs=T(-28, 14, 40), durationMin=40, status="done", percent=100),
    dict(id="r21", todoId="t_agent", todoName="mobile agent调研", startTs=T(-32, 9, 0),
         endTs=T(-32, 10, 20), durationMin=80, status="done", percent=100),
    dict(id="r22", todoId="t_paper", todoName="论文阅读", startTs=T(-35, 20, 30),
         endTs=T(-35, 21, 15), durationMin=45, status="done", percent=100),
    dict(id="r23", todoId="t_code", todoName="代码", startTs=T(-40, 15, 0),
         endTs=T(-40, 16, 30), durationMin=90, status="done", percent=100),
    dict(id="r24", todoId="t_doc", todoName="文档写作", startTs=T(-45, 11, 20),
         endTs=T(-45, 12, 0), durationMin=40, status="done", percent=100),
    dict(id="r25", todoId="t_paper", todoName="论文阅读", startTs=T(-52, 19, 0),
         endTs=T(-52, 19, 55), durationMin=55, status="done", percent=100),
    dict(id="r26", todoId="t_agent", todoName="mobile agent调研", startTs=T(-58, 10, 0),
         endTs=T(-58, 11, 10), durationMin=70, status="done", percent=100),
    dict(id="r27", todoId="t_code", todoName="代码", startTs=T(-65, 13, 40),
         endTs=T(-65, 14, 25), durationMin=45, status="done", percent=100),
    dict(id="r28", todoId="t_doc", todoName="文档写作", startTs=T(-72, 16, 0),
         endTs=T(-72, 16, 50), durationMin=50, status="done", percent=100),
    dict(id="r29", todoId="t_paper", todoName="论文阅读", startTs=T(-80, 21, 10),
         endTs=T(-80, 21, 45), durationMin=35, status="done", percent=100),
    dict(id="r30", todoId="t_code", todoName="代码", startTs=T(-90, 9, 30),
         endTs=T(-90, 11, 0), durationMin=90, status="done", percent=100),
]

futures = [
    dict(id="f1", name="考研", remark="上岸心仪的学校", targetDate=BASE + 180 * DAY),
    dict(id="f2", name="毕业", remark="顺利答辩", targetDate=BASE + 320 * DAY),
    dict(id="f3", name="生日", remark="又长大一岁", targetDate=BASE + 52 * DAY),
]

data = dict(
    user=dict(name="番茄用户", signature="千里之行,始于足下",
              avatarKey="user", account="oirUauA4-n5tbwK7xAiEfn4xfWlY"),
    todos=todos,
    records=records,
    futures=futures,
    settings=dict(restDurationMin=10, studyMode=False, strictMode=False,
                  midnightMode=True, noStrikethrough=True, fixedOrder=False,
                  pullSearch=True, focusVisible=True, wakeVisible=True,
                  lockCountStats=True, themeColor="blue", motto=""),
    stats=dict(totalCount=120, totalMinutes=7600, streakDays=7, totalDays=55,
               monthlyLockExit=0),
)

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
offs = sorted({(r["startTs"] - BASE) // DAY for r in records})
print(f"OK: defaults.json ({OUT.stat().st_size} bytes, {len(todos)} todos, "
      f"{len(records)} records, dayOffsets {offs[0]}..{offs[-1]})")
