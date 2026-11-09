"""V5 decisions for audited and post-run repaired task contracts."""

from __future__ import annotations

from bench_env.task.clocked.specs import CASES as V4_CASES
from bench_env.task.clocked.specs import SIMULATED_TIME
from bench_env.task.prior.model import HybridV5Case


P1_CASES = {3, 9, 14, 17, 21, 22, 25, 36, 40, 41, 47, 73, 74, 75}
P2_CASES = {2, 5, 6, 7, 15, 23, 32, 38, 42, 44, 46, 53, 63}
SEMANTIC_REPAIR_CASES = {
    1, 8, 9, 10, 15, 16, 18, 23, 24, 29,
    30, 33, 34, 37, 40, 51, 57, 70, 72, 73, 75,
}
REPAIRED_CASES = P1_CASES | P2_CASES | SEMANTIC_REPAIR_CASES


INSTRUCTION_OVERRIDES: dict[int, str] = {
    14: "查看 Spotify 最近播放页中今天按实际播放时间最早的一首歌，再查看微信读书热搜第1名；在笔记新建“今日文化清单”记录两项结果，并在小红书发一篇同时包含这两项结果的分享笔记。",
    15: "按更新时间找出笔记中最新的两条，简单汇总后发一条朋友圈，记得包含这两条笔记的标题。",
    16: "帮我在 eBay 看看电风扇里最便宜的那款，然后发一篇小红书商品推荐笔记，推荐内容中要包含完整商品标题。",
    17: "查看微信读书书架中所有已有阅读进度且尚未读完的书，并在笔记里制定一份包含这些书的本周阅读计划。",
    18: "给小红书上我关注的‘西柚慢行’发私信‘你好呀’，然后在微信把博主昵称发给陈静，并告诉她已经联系他了。",
    21: "查看今天在 Spotify 按实际播放时间从早到晚的第1首歌，在小红书发一篇推荐笔记，标题或正文包含歌名和艺人。",
    22: "查看今天在 Spotify 按实际播放时间从早到晚的第3首歌，在小红书发一篇正文包含歌名和歌手的推荐；再把同一首歌加入新歌单“今天爱听”。",
    38: "新建歌单《双艺人精选》，搜索周杰伦和林俊杰，恰好各加入2首歌，不加入其他歌曲，然后播放这个歌单。",
    63: "查看2月3日腾讯会议历史中预定时长最长的一场，把该会议的会议号和主题微信告诉陈静。",
    75: "查看 Days Matter 中 Mia 的生日，在生日一周前19:00创建30分钟的“准备 Mia 生日礼物”日程，设置提前一天提醒并打开闹钟提醒，再微信把完整准备日期（年月日）告诉 Alice Chen。",
}


REPAIR_REASONS: dict[int, str] = {
    1: "Match transfer type, recipient and amount independently instead of requiring one exact label layout.",
    2: "Normalize harmless whitespace and punctuation in eBay product-title verification.",
    3: "Repair the observed eBay product-title whitespace false negative.",
    5: "Normalize the eBay title copied into Notes.",
    6: "Normalize the eBay title copied into WeChat.",
    7: "Normalize the eBay title in both durable outputs.",
    8: "Accept equivalent year-month formats for the winning month.",
    9: "Require all three transaction title/amount pairs and the requested closing while accepting adjacent-line layouts.",
    10: "Check recipient, count and spending without requiring the redundant literal word 订单.",
    14: "Expose seeded playback timestamps consistently in GUI, tool output and wording.",
    15: "Make the Notes GUI order agree with the verifier and explicitly request both source-note titles.",
    16: "Explicitly request the full product title already required by the verifier.",
    17: "Define the intended set as all in-progress unfinished shelf books.",
    18: "Explicitly request the blogger nickname already required in the WeChat report.",
    21: "Define chronological order and make playback timestamps observable.",
    22: "Define chronological order, expose timestamps and remove benchmark leakage from the tool.",
    23: "Rank by recommendedValue and compare equivalent percentage formatting numerically.",
    24: "Compare equivalent reading-duration expressions in total minutes.",
    25: "Require the reading day, both headings, every liked-today song/artist and no unliked-today song.",
    29: "Compare equivalent Redbook author-stat abbreviations numerically.",
    30: "Compare equivalent Redbook author-stat abbreviations numerically.",
    32: "Require a newly created enabled departure alarm.",
    33: "Normalize address formatting while preserving POI name, rating and address identity.",
    34: "Accept a safely normalized address from any legitimate 故宫 candidate.",
    36: "Render newly saved cities from the same offline weather library used by App Tools.",
    37: "Keep address/weather/temperature tied to one candidate while matching semantic display variants.",
    38: "Require exactly four tracks with an alias-normalized two-plus-two artist multiset.",
    40: "Reject rainy dates and parse equivalent weekday, 号 and Chinese-numeral date forms.",
    41: "Require a high-speed order and make an empty forecast candidate a contract failure.",
    42: "Require a newly created enabled 08:00 alarm.",
    44: "Normalize harmless address formatting while retaining the exact nearest-place identity.",
    46: "Require the SMS to contain an explicit running invitation as well as date and weather.",
    47: "Pin the task date to 2026-07-14 independently of host time.",
    51: "Accept natural busy-time wording while preserving all no-side-effect checks.",
    53: "Accept only a newly scheduled meeting or a newly active meeting, never an initial active meeting.",
    57: "Accept native move and copy-then-delete as equivalent final file-system outcomes while preserving file metadata.",
    63: "Clarify that the ranking field is planned duration.",
    70: "Require quantity one and the actual default SKU in the paid order.",
    72: "Match note times semantically while keeping note title, version and alarm state strict.",
    73: "Require both exact dates, remove the unstated title requirement and accept equivalent date forms.",
    74: "Seed exact pantry SKUs and require an exact cart delta with no checkout or order change.",
    75: "Require the exact preparation date with a year while accepting equivalent full-date forms.",
}


CASES: list[HybridV5Case] = []
for _v4 in V4_CASES:
    _severity = (
        "P1" if _v4.index in P1_CASES
        else "P2" if _v4.index in P2_CASES
        else "semantic" if _v4.index in SEMANTIC_REPAIR_CASES
        else "OK"
    )
    CASES.append(
        HybridV5Case(
            index=_v4.index,
            v3_index=_v4.v3_index,
            source_task=_v4.source_task,
            original_instruction=_v4.instruction,
            instruction=INSTRUCTION_OVERRIDES.get(_v4.index, _v4.instruction),
            group=_v4.group,
            rationale=_v4.rationale,
            revision="contract_repaired" if _v4.index in REPAIRED_CASES else "retained_v4",
            audit_reason=REPAIR_REASONS.get(_v4.index, "V4 contract retained unchanged."),
            simulated_time=SIMULATED_TIME,
            tags=_v4.tags,
            contract_severity=_severity,
            contract_repair=REPAIR_REASONS.get(_v4.index, "Unchanged from V4."),
        )
    )


assert len(CASES) == 76
assert set(REPAIR_REASONS) == REPAIRED_CASES

del _severity, _v4
