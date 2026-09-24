"""Case-by-case V3 audit decisions used to build Hybrid Tools V4."""

from __future__ import annotations

from bench_env.task.drafts.specs import CASES as V3_CASES
from bench_env.task.clocked.model import HybridV4Case


# Sunday makes the verifier's rolling seven-day window identical to the
# Monday-Sunday week rendered by WeChat Reading's GUI.
SIMULATED_TIME = "2026-07-12 09:00:00"


DROP_REASONS: dict[int, str] = {
    14: "Bilibili's new-favorite-folder page entered a persistent loading/black state after valid GUI actions.",
    36: "The selected railway date exposes only an unimplemented waitlist branch, while the verifier requires a normal pending order.",
    39: "The Map route planner did not produce a route after repeated valid interactions, so pure-GUI solvability is not established.",
    67: "Tencent Meeting accepts the edited nickname visually but commits the old nickname to participant state.",
}


INSTRUCTION_OVERRIDES: dict[int, str] = {
    9: '查看支付宝截至今天（包含今天）的最近30天，找出金额最大的3笔支出，把交易标题和金额发微信给黄勇，最后一句加上“我最近得省着点了”。',
    13: "在B站全站排行榜找到第1名给它一键三连，然后发个包含该视频完整标题的纯文字朋友圈推荐这个视频。",
    25: "查看微信读书从今天起往前7天（包含今天）的记录，找出阅读时长最多的一天及当天总时长，告诉微信好友陈静。",
    26: '查看微信读书从今天起往前7天（包含今天）的记录，找出阅读最久的一天；再汇总Spotify今天听过且已点赞的歌曲名称和作者，发一条朋友圈，同时包含“最近阅读最投入的一天”和“现在在听的歌”。',
    33: "从明天开始的未来14天中，找出上海第一个不下雨且日历无安排的日期，为12306当前登录账号本人提交当天从北京出发的最早高铁订单，并设置出发前一小时的闹钟。",
    38: "把南京添加到天气 App，并找出从明天开始的未来7天中最高温最高的日期。",
    40: "在地图中查询中国国家博物馆显示的完整详细地址，并查询该地址所在城市的当前天气，把地址、天气和温度一起微信发给陈静。",
    43: "查看北京从明天开始的未来5天天气，把其中所有不下雨的日期记到标题为“适合出行的日子”的笔记中。",
    44: "查看上海从明天开始的未来3天天气，为12306当前登录账号本人提交第一个不下雨日期从北京到上海的高铁订单。",
    45: "查看北京从明天开始的未来14天天气，在第一个不下雨的日期创建“户外运动”日程，并设置一个早上8点的闹钟。",
    46: "查询天气 App 城市列表中的“北京”（不是当前定位的海淀）的当前温度和体感温度，把两项结果微信发给陈静。",
    49: "找出北京从明天开始的未来7天中第一个不下雨的日期，创建“户外跑步”日程，并短信告诉张三该日期和天气，约他一起跑步。",
    51: "在文件管理器的 Download/日志导出中新建“保留-已汇总”文件夹，只删除 raw_login.log、raw_payment.log 和 raw_sync.log，保留目录中的其他文件。",
    59: "预约明天09:00、时长15分钟、密码123456的“版本发布会”；创建成功后，把生成的会议号和密码同时记入笔记、微信发给陈静并短信发给张三。",
    79: "查看 Days Matter 中 Mia 的生日，在生日一周前19:00创建30分钟的“准备 Mia 生日礼物”日程，设置提前一天提醒并打开闹钟提醒，再微信把准备日期告诉 Alice Chen。",
}


VERIFIER_FIX_REASONS: dict[int, str] = {
    42: "Match the full scrollable recommendation feed instead of a helper permanently capped at the first 20 cards.",
    79: "Remove the inherited calendar-description requirement because the instruction never asks the agent to set a description.",
}


CLARIFICATION_REASONS: dict[int, str] = {
    9: "Define the inclusive boundary of the rolling 30-day verifier window.",
    13: "Require the Moments post to identify the recommended video by its full title, matching the verifier.",
    25: "Replace ambiguous 'recent week' wording with the verifier's inclusive rolling seven-day window.",
    26: "Use the same explicit rolling seven-day reading window as case 25.",
    33: "Expose the verifier's tomorrow-based horizon and current-account passenger constraint.",
    38: "Expose that the seven forecast days begin tomorrow.",
    40: "Name the canonical map address source and require every field checked by the verifier.",
    43: "Expose that the five forecast days begin tomorrow.",
    44: "Expose the tomorrow-based horizon and current-account passenger constraint.",
    45: "Exclude today explicitly, matching forecast offsets 1 through 14.",
    46: "Disambiguate the saved Beijing city record from the current-location Haidian card.",
    49: "Expose that the seven forecast days begin tomorrow.",
    51: "Resolve the contradiction between the raw_ prefix wording and files the verifier requires preserving.",
    59: "Make the generated meeting ID and password requirements visible for all three outputs.",
    79: "Distinguish the ordinary reminder value from the separate alarm-reminder toggle.",
}


def _revision(v3_index: int) -> tuple[str, str]:
    if v3_index in VERIFIER_FIX_REASONS:
        return "verifier_fix", VERIFIER_FIX_REASONS[v3_index]
    if v3_index in INSTRUCTION_OVERRIDES:
        return "instruction_clarified", CLARIFICATION_REASONS[v3_index]
    return "retained", "V3 instruction, setup, environment behavior and verifier remained aligned in the trajectory audit."


CASES: list[HybridV4Case] = []
for _v3 in V3_CASES:
    if _v3.index in DROP_REASONS:
        continue
    _revision_name, _audit_reason = _revision(_v3.index)
    CASES.append(
        HybridV4Case(
            index=len(CASES) + 1,
            v3_index=_v3.index,
            source_task=_v3.source_task,
            original_instruction=_v3.instruction,
            instruction=INSTRUCTION_OVERRIDES.get(_v3.index, _v3.instruction),
            group=_v3.group,
            rationale=_v3.rationale,
            revision=_revision_name,
            audit_reason=_audit_reason,
            simulated_time=SIMULATED_TIME,
            tags=_v3.tags,
        )
    )


assert len(CASES) == 76
assert {case.v3_index for case in CASES}.isdisjoint(DROP_REASONS)

del _audit_reason, _revision_name, _v3
