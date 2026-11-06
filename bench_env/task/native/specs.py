"""V6 suite membership and contract decisions."""

from __future__ import annotations

from dataclasses import fields

from bench_env.task.prior.specs import CASES as V5_CASES
from bench_env.task.prior.specs import SIMULATED_TIME
from bench_env.task.native.model import HybridV6Case


EXCLUDED_CASES = {45}
REPAIRED_CASES = {11, 20, 25, 33, 54}

INSTRUCTION_OVERRIDES = {
    1: "打开支付宝。找到交易记录里支出金额最大的那笔，写进系统笔记 App，提醒自己控制开支。",
    2: "打开eBay。搜最便宜的全新电风扇，按价格从低到高排，找到最便宜那个，再去支付宝看看余额，买了之后还剩多少钱写进系统笔记 App，连商品名和价格一起记上。",
    3: "打开支付宝，看一下我的余额，写进系统笔记 App（Notes，不要用 Flomo）。再打开 eBay，搜电脑，按价格从低到高排，把最便宜那个的商品名和价格也写进去；再搜电视，同样最便宜的商品名和价格写进去，最后算出都买之后余额还剩多少，一起记在笔记里。",
    8: "打开支付宝。我想对比一下2026年1月和2025年12月的总花销，把两个月各自花了多少、哪个月花得更多、差多少，写进系统笔记 App，标题叫「月度花销对比」。",
    9: "打开支付宝。查一下最近30天（含今天）的支出记录，找出金额最大的3笔，把交易标题和金额发微信给黄勇，最后加上\"我最近得省着点了\"。",
    13: "打开哔哩哔哩。找到全站排行榜第1名，给它一键三连，再打开微信发个纯文字朋友圈推荐这个视频，朋友圈里要带上这个视频的完整标题。",
    14: "打开 Spotify。找到今天最早播放的那首歌，记住歌名。再打开微信读书，看一下热搜第 1 名是什么。写进系统笔记 App，新建一篇叫「今日文化清单」，把这首歌和热搜第 1 名都记进去。再打开小红书，发一篇笔记，把这两个都写进去分享出去。",
    16: "打开 eBay。搜电风扇，找到最便宜的那款，记住完整商品标题。再打开小红书，发一篇商品推荐笔记，把那个完整标题写进去。",
    22: "打开 Spotify。找到今天按实际播放时间从早到晚排第3首的歌，记住歌名和歌手，加入新歌单「今天爱听」。再打开小红书，发一篇推荐，正文里带上这首歌的歌名和歌手。",
    25: "打开微信读书。我想看最近7天的阅读记录，找出读得最久的那天。再打开Spotify，找今天听过而且点赞了的歌，歌名和歌手都要。把这些写进一条朋友圈发出去：先写小标题「最近阅读最投入的一天」再写下那天；再写小标题「今天在听的歌」再写下这些歌的歌名和歌手。",
    27: "在小红书搜索“旅行”，把前 10 篇帖子中点赞最多的两篇的完整标题写到备忘录 Notes（不要写 flomo），一行一条。",
    28: "把小红书用户“铁铁健身日记”发过的全部帖子看完，点赞数最高的那篇和收藏数最低的那篇的完整标题都写到备忘录 Notes（不要写 flomo），一行一条。",
    32: "打开12306。我想找从北京出发的高铁，日期我要看天气和日历——从明天起的14天里，第一个上海不下雨、日历也没安排的那天，订当天最早的一班，用当前登录账号本人信息提交订单。订完给我设一个出发前一小时的闹钟。",
    41: "打开天气。查一下上海未来3天的天气，找到从明天起第一个不下雨的日期。再打开12306，用当前登录的账号买那天从北京到上海的高铁票。",
    48: "打开文件管理器。在 Download/日志导出 里新建文件夹\"保留-已汇总\"，然后把 raw_login.log、raw_payment.log、raw_sync.log 这三个文件删掉，其他文件别动。",
    51: "打开日历。看看明天03:30有没有空——如果有空，去腾讯会议预约主题「临时协调会」的会议，再在日历建同名日程，开始时间和会议一致，加一个提前15分钟的提醒；会议号微信发给陈静、短信发给张三。如果那个时间已经有安排，就微信告诉陈静那个时间不行，不要新建腾讯会议，也不要发短信。",
    53: "打开腾讯会议。创建一个会议，把会议号复制好，发给微信里的张伟，再用短信发给张三。",
    54: "打开腾讯会议。查一下我下一场会议几点开始，再打开高德地图搜步行到故宫要多久，然后发微信告诉陈静我还有多久到、以及会议时间。",
    55: "打开天气。看北京明天的天气，如果有雨，去腾讯会议取消主题为「项目例会」的会议；如果不下雨，保留那个会议，并设一个会议开始前半小时的闹钟。",
    57: "打开微信。找到老板的聊天，看看他最近让我补交什么材料，然后去文件管理里把 Download/待提交 里对应的文件移动到 Documents/submission，再把文件名发给老板。",
    58: "打开腾讯会议。找一下历史会议里名称包含「快速会议」的，数一数有几场，把数量和其中参会时长最长的那场会议名一起写进系统笔记 App。",
    59: "打开腾讯会议。找历史会议里预定时长最长的那场，把会议名称和主持人姓名发给微信联系人陈静。",
    62: "打开腾讯会议。查一下我2月3日一共开了多久的会，把总时长发给微信好友陈静。",
    63: "打开腾讯会议。找到2月3日历史会议里预定时长最长的那场，把会议号和主题发微信给陈静。",
    68: "打开淘宝。把购物车里的「蓝鲸 真无线蓝牙耳机 主动降噪 超长续航」移入收藏，删掉「清风山 葵花沐浴露 500mL 身体乳套装 温和清洁」，再把「桔子 每日坚果礼盒 30包混合装 孕妇零食」的数量改成 3。",
    69: "打开淘宝。我想买「简木 焖烧保温杯 316不锈钢 大容量」，收货地址选标着「学校」的那个，用花呗分期付款。",
    73: "打开 Days Matter。找到最早到期且还没归档的工作事项，提前一周在日历建一个同名的全天准备日。把原截止日期和准备日期发微信给 Mia Wang。",
    74: "打开笔记 App，找到\"Office pantry\"那条记录，记住里面缺货的东西。再打开淘宝闪购 App，把清单里每样缺货的商品各加一件到购物车，不结算。",
    75: "打开 Days Matter。找到 Mia 的生日，在生日前一周的 19:00 给我创建一个 30 分钟的「准备 Mia 生日礼物」日程，提前一天提醒，打开闹钟提醒。然后微信告诉 Alice Chen 我准备礼物的具体日期。",
}

REPAIR_REASONS = {
    11: (
        "Accept the full Alipay counterparty label, its visible nickname, or the "
        "real name in parentheses while keeping the winning amount strict."
    ),
    20: (
        "Match the complete title content while ignoring optional punctuation, "
        "spacing, and decorative emoji."
    ),
    25: (
        "Clarify that the two quoted phrases are section headings and rename the "
        "Spotify heading to avoid implying the current unliked track."
    ),
    33: (
        "Treat equal-rating POIs whose distances collapse to the same GUI-visible "
        "distance label as tied best candidates."
    ),
    54: (
        "Accept natural exact-hour expressions such as '11点开始' when the "
        "expected meeting time is 11:00."
    ),
}


def _materialize_case(case) -> HybridV6Case:
    payload = {
        field.name: getattr(case, field.name)
        for field in fields(HybridV6Case)
    }
    if case.index in REPAIRED_CASES:
        payload.update(
            revision="v6_contract_repaired",
            audit_reason=REPAIR_REASONS[case.index],
            contract_severity="V6",
            contract_repair=REPAIR_REASONS[case.index],
        )
    if case.index in INSTRUCTION_OVERRIDES:
        payload["instruction"] = INSTRUCTION_OVERRIDES[case.index]
    return HybridV6Case(**payload)


CASES = [
    _materialize_case(case)
    for case in V5_CASES
    if case.index not in EXCLUDED_CASES
]


assert len(CASES) == 75
assert {case.index for case in CASES} == set(range(1, 77)) - EXCLUDED_CASES
assert all(case.simulated_time == SIMULATED_TIME for case in CASES)

del _materialize_case
