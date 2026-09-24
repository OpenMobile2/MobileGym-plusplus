"""Frozen source tasks and verbatim instructions selected for Hybrid Tools V3."""

from __future__ import annotations

from bench_env.task.drafts.model import HybridV3Case


_GROUP_RATIONALE = {
    "commerce": "Multi-app retrieval, comparison or aggregation followed by a durable output.",
    "content": "Content discovery or ranking with a GUI-only publish, collect, DM or playlist step.",
    "life": "Conditional planning across weather, map, railway, calendar and messaging state.",
    "work": "Meeting or file evidence must be transferred into multiple durable work outputs.",
    "taobao": "Tools can locate the entity or prepare checkout, while the sensitive final action remains GUI-only.",
    "transfer": "A deterministic cross-app dependency with a V2-owned setup and structured state verifier.",
}


# Official-derived rows preserve the source task's first template rendered with
# its declared defaults. They intentionally do not rewrite or simplify it.
_ROWS: list[tuple[str, str, str, tuple[str, ...]]] = [
    ("crossapp_commerce.AlipayLargestExpenseToNotes", "查查支付宝交易记录里支出金额最大的一笔是什么、花了多少钱，在笔记里记录下来，提醒自己控制开支", "commerce", ("ranking", "state_transfer")),
    ("crossapp_commerce.EbayBalanceDiffToNotes", "在eBay查一下最便宜的全新电风扇，看看我用支付宝余额买的话还剩多少钱，在笔记把这个商品、价格和剩余余额写下来", "commerce", ("minimum", "arithmetic", "state_transfer")),
    ("crossapp_commerce.EbayDualItemBalanceToNotes", "分别在eBay搜电脑和电视最便宜的，看看都买的话支付宝还剩多少钱，在笔记里记下两个商品名、各自价格和剩余余额", "commerce", ("multi_query", "arithmetic", "state_transfer")),
    ("crossapp_commerce.EbayDualItemCompareToNotes", "分别在eBay搜电脑和电视的最低价，在笔记里记下哪个更便宜、便宜多少", "commerce", ("comparison", "arithmetic")),
    ("crossapp_commerce.EbayLowestPriceToNotes", "在eBay搜电风扇，找到最便宜的那个，把标题和价格记到笔记里", "commerce", ("minimum", "state_transfer")),
    ("crossapp_commerce.EbayProductShareToWechat", "帮我在eBay找最便宜的全新电风扇，把商品名称和价格(包含运费)微信发给陈静，问问他觉得怎么样", "commerce", ("minimum", "shipping", "message")),
    ("crossapp_commerce.FullShoppingDecisionFlow", "帮我在eBay找最便宜的全新电风扇，看购买后支付宝余额还剩下多少，在笔记记录下商品和余额，然后给微信陈静发消息看他要不要一起买这款商品", "commerce", ("minimum", "arithmetic", "multi_output")),
    ("crossapp_commerce.MonthCompareThenExplainToNote", "你去支付宝看一下，2026年1月和2025年12月哪个月总花销更高，顺便把差额也算出来。然后在笔记新建一条\"月度花销对比\"，写上两个月的各自花销、哪个月花得更多、差多少。", "commerce", ("aggregation", "comparison", "arithmetic")),
    ("crossapp_commerce.Top3ExpenseSummaryToWechat", "去支付宝看看最近30天里金额最大的3笔支出分别是什么，把交易标题和金额发微信告诉黄勇，最后一句加上\"我最近得省着点了\"。", "commerce", ("time_filter", "ranking", "format_constraint")),
    ("crossapp_commerce.BillTypeYearSummaryToWechat", "去支付宝账单里查一下\"订单\"类型今年一共有多少笔，花了多少钱，微信告诉陈静。", "commerce", ("filter", "aggregation", "message")),
    ("crossapp_commerce.AlipayYearCompareTopExpenseToWechat", "比较我支付宝去年支出最高的一笔和今年支出最高的一笔，哪个金额更大，把较大的金额和交易对象名称微信发给“陈静”。", "commerce", ("time_filter", "ranking", "comparison")),

    ("crossapp_content.BilibiliRankingToWechat", "看看B站全站区排行榜第1名是什么视频，把标题微信发给陈静", "content", ("ranking", "message")),
    ("crossapp_content.BilibiliTripleLikeThenMoments", "在B站全站排行榜找到第1名给它一键三连，然后发个纯文字朋友圈推荐这个视频", "content", ("ranking", "gui_write", "publish")),
    ("crossapp_content.BilibiliRankTop3FolderAndWechat", "把 B 站“娱乐”分区排行榜前 20 名中播放量最多的三个视频收藏到名叫热门视频的新建收藏夹里面，然后把其中播放量最高的视频名称和播放量微信发给“陈静”。", "content", ("ranking", "multi_entity", "gui_write")),
    ("crossapp_content.CulturalChecklistToRedbook", "看看Spotify我今天最早听的那首歌是什么，再看看微信读书热搜第一本书叫什么，在笔记里记一份'今日文化清单'，然后在小红书发一篇笔记分享", "content", ("join", "multi_output", "publish")),
    ("crossapp_content.DailyLogToMoments", "把我笔记里最新两条笔记简单汇总一下，发一条朋友圈。", "content", ("summarization", "publish")),
    ("crossapp_content.EbayCheapToRedbook", "帮我在 eBay 看看电风扇里最便宜的那款，然后发一篇小红书商品推荐笔记。", "content", ("minimum", "publish")),
    ("crossapp_content.ReadingPlanToNotes", "看看微信读书里我正在读的书，然后在笔记里制定一个本周的阅读计划。", "content", ("state_transfer", "generation")),
    ("crossapp_content.RedbookDmThenWechatReport", "给小红书上我关注的'西柚慢行'发私信'你好呀'，然后在微信告诉陈静已经联系他了", "content", ("gui_write", "multi_output")),
    ("crossapp_content.RedbookFollowingNoteCountToSms", "查小红书我关注的'西柚慢行'发了多少篇笔记，发短信告诉张三", "content", ("aggregation", "gui_only_target")),
    ("crossapp_content.RedbookSearchTitleToWechat", "在小红书搜'数分'，把第一篇笔记的标题微信发给陈静", "content", ("search", "state_transfer")),
    ("crossapp_content.SpotifyTodayNthPlayToRedbook", "查看我今天在 Spotify 听的第一首歌，在小红书发一篇推荐笔记，标题或正文包含歌名和艺人", "content", ("history", "publish")),
    ("crossapp_content.ThirdSpotifyPlayRecommendOnRedbookAndPlaylist", "看一下我今天在Spotify听的第三首歌是什么，然后去小红书发一条推荐，正文里带上歌名和歌手；发完以后再把这首歌加进一个新歌单\"今天爱听\"。", "content", ("history", "publish", "multi_output")),
    ("crossapp_content.WechatReadingBestBookToWechat", "帮我在微信读书历史分类下找推荐值最高的书，把书名和推荐值微信发给陈静", "content", ("filter", "ranking", "message")),
    ("crossapp_content.WechatReadingStatsToWechat", "查微信读书最近一周内阅读时长最多的一天是哪天读了多久，告诉微信好友陈静", "content", ("aggregation", "ranking", "message")),
    ("crossapp_content.WeeklyReadingAndLikedSpotifySongsToMoment", "帮我看微信读书最近一周哪天读得最久，再把Spotify今天听过且已经点赞的歌的歌名和作者汇总一下，最后发条朋友圈，把\"最近阅读最投入的一天\"和\"现在在听的歌\"都带上。", "content", ("join", "aggregation", "publish")),
    ("crossapp_content.XLatestPostToReddit_WithTitleFormat", "把 X 用户 elonmusk 最新一条推文的文字内容，以\"elonmusk:\"开头发到 Reddit 的 r/China_irl。", "content", ("gui_only_source", "format_constraint", "publish")),
    ("crossapp_content.RedbookTopLikedToNotes", "在小红书搜索“旅行”，把前 10 篇帖子中点赞最多的两篇的标题写到笔记，一行一条。", "content", ("ranking", "multi_entity", "format_constraint")),
    ("crossapp_content.RedbookUserBestWorstToNotes", "把小红书用户“铁铁健身日记”发过的帖子里，点赞数最高的那篇帖子和收藏数最低的那篇帖子的标题都写到笔记里，一行一条。", "content", ("ranking", "multi_metric", "format_constraint")),
    ("crossapp_content.RedbookAuthorTopCollectToWechat", "在小红书搜索“旅行”，把前 10 篇帖子中点赞最多的一个帖子的作者主页发过的收藏最多的帖子的标题和这个作者的昵称和获赞与收藏数微信发给“陈静”。", "content", ("nested_ranking", "join", "message")),
    ("crossapp_content.RedbookUserTopCollectToWechat", "查看小红书用户“铁铁健身日记”的主页，找到点赞数最高的那篇帖子，收藏它，把它的标题和作者的获赞与收藏数微信发给“陈静”。", "content", ("ranking", "gui_write", "message")),

    ("crossapp_life.CalendarFreeWeatherInvite", "看看日历下周末哪天没安排，查那天北京天气，有一天没有安排而且不下雨就给陈静发消息约出去玩", "life", ("conditional", "calendar_join", "message")),
    ("crossapp_life.FullTripPlanWeatherDriven", "我想去上海出差，查未来两周里第一个不下雨且日历没有安排的日期，给我买从北京出发的最早高铁提交订单即可，并设一个出发前一小时的闹钟", "life", ("conditional", "search_horizon", "purchase", "time_arithmetic")),
    ("crossapp_life.MapNearbyBestToWechat", "在地图搜2公里内评分最高的咖啡馆，把名字、评分和地址微信发给陈静，评分一样的话优先最近的", "life", ("geo_filter", "tie_break", "message")),
    ("crossapp_life.MapPlaceToWechat", "帮我在地图上搜一下故宫的地址，发给微信好友陈静", "life", ("place_lookup", "message")),
    ("crossapp_life.MapRatingConditionBuyTicket", "帮我在地图看看故宫的评分，如果超过4分就买明天从上海过去的最早高铁，提交订单即可。", "life", ("conditional", "route_inference", "purchase")),
    ("map.NearestInRadiusRatingRank", "最近的有评分的咖啡馆在附近2公里内同类评分里排第几", "life", ("geo_filter", "ranking", "answer")),
    ("weather.AddCityAndFindWarmestDay", "把南京加到天气里，然后看看那边未来一周哪天最暖和", "life", ("reversible_write", "ranking", "answer")),
    ("map.FindBestRatedAndRoute", "附近2公里内评分最高且最近的咖啡馆是哪家，开车过去大概多远", "life", ("geo_filter", "tie_break", "gui_route", "answer")),
    ("crossapp_life.TravelPlanToWechat", "帮我查一下中国国家博物馆的详细地址和那边城市的当前天气，一起微信发给陈静。", "life", ("route_inference", "join", "message")),
    ("spotify.BuildPlaylistFromTwoArtists", "建一个叫《双艺人精选》的歌单，搜周杰伦和林俊杰各加2首歌进去，然后播放", "life", ("multi_query", "playlist_write", "playback")),
    ("redbook.CollectFeedNoteAndDMAuthor", "收藏推荐页标题含\"分享\"的笔记，给作者发一句\"这篇内容很有启发，谢谢分享\"", "life", ("content_filter", "collect", "direct_message")),
    ("crossapp_life.WeatherFilterNonRainyDays", "查北京未来五天天气，把不下雨的日期记在笔记里，标题写'适合出行的日子'", "life", ("filter", "multi_entity", "note_write")),
    ("crossapp_life.WeatherFirstNonRainyDayBuyTicket", "查上海未来三天天气，找到第一个不下雨的天，帮我买那天从北京到上海的高铁票,提交订单即可。", "life", ("filter", "ranking", "purchase")),
    ("crossapp_life.WeatherFirstSunnyDayCalendarAlarm", "查北京未来两周的天气，找到第一个不下雨的天，在那天日历建个户外运动日程，设个早上8点的闹钟", "life", ("search_horizon", "multi_output", "time_reasoning")),
    ("crossapp_life.WeatherShareMetric", "查一下北京的温度和体感，把结果微信发给陈静", "life", ("metric_lookup", "message")),
    ("crossapp_life.WechatFoodExtractMapSms", "看看陈静在微信里最近说想吃什么，搜附近最近的那家，把地址用短信发给张三", "life", ("context_extraction", "nearest", "gui_only_target")),
    ("wechat_reading.OrganizeShelfByRecommendation", "整理微信读书书架，把推荐值不高于95.0%的书都删掉", "life", ("filter", "multi_entity", "gui_write")),
    ("crossapp_life.WeatherFirstNonRainyToCalendarAndSms", "在“北京”未来一周里找第一个不下雨的日期，在日历上新建“户外跑步”事件，并短信告知“张三”这一天的日期和天气，约他一起跑步。", "life", ("search_horizon", "calendar_write", "gui_only_target")),
    ("calendar.CreateEventWithAlarmAndConfirm", "7月14号的晚上6点半到8点，帮我在日历里安排一个日程叫\"面试\"，再顺手加个提前30分钟提醒，闹钟提醒打开。", "life", ("calendar_write", "reminder", "gui_confirmation")),
    ("file_manager.CreateKeepFolderAndDeleteRawLogs", "打开文件里的 Download/日志导出，新建一个名叫「保留-已汇总」的文件夹，然后删除 raw_ 开头的原始日志。", "life", ("prefix_filter", "create", "gui_delete", "preservation")),
    ("crossapp_life.RailwayMyAccountToWechat", "把我的 12306 账号微信发给陈静", "life", ("account_lookup", "message")),

    ("tencent_meeting.ScheduleMeeting", "帮我预约一个会议，主题是预算评审会，时长60分钟，密码设为2468，然后告诉我会议号", "work", ("meeting_create", "settings", "answer")),
    ("crossapp_work.FullMeetingConflictCheckBroadcast", "检查日历上明天03:30有没有安排，如果有空就在腾讯会议预约主题为「临时协调会」的会议，日历创建同名日程（开始时间与会议一致，设提前15分钟的提醒闹钟），会议号微信发给陈静，短信发给张三；有安排的话微信告诉陈静那个时间不行", "work", ("conditional", "meeting_create", "multi_output")),
    ("crossapp_work.MeetingFullFlowToWechat", "帮我在腾讯会议预约明天10:00的项目周会，在日历上加个日程提醒，日程设一个提前15分钟的闹钟，最后把会议号微信发给陈静", "work", ("meeting_create", "calendar_write", "message")),
    ("crossapp_work.MeetingMultiChannelNotify", "帮我在腾讯会议创建一个会议，然后把会议号通过微信发给张伟，通过短信发给张三", "work", ("meeting_create", "multi_channel")),
    ("crossapp_work.MeetingRouteEtaToWechat", "查一下我下一场腾讯会议几点开始，搜一下走到故宫要多久，发微信告诉陈静我还有多久到和会议时间", "work", ("ranking", "route", "join")),
    ("crossapp_work.WeatherConditionalCancelMeeting", "看北京明天天气，如果有雨就在腾讯会议取消主题为'项目例会'的会议；如果不下雨就保留该会议并设置一个该会议开始前半小时的闹钟", "work", ("conditional", "gui_write", "time_arithmetic")),
    ("crossapp_work.ScheduleReleaseMeetingAndNotifyViaNotesWechatSms", "帮我建一个明天早上 9 点的 版本发布会 ，时长15分钟，密码123456；建好以后把会议信息记进笔记，再微信发给陈静，短信发给张三。", "work", ("meeting_create", "multi_output", "format_constraint")),
    ("crossapp_work.SubmitRequestedAttachmentsToBoss", "在微信看看老板最近让我补交的材料，然后在 Download/待提交 里找到对应文件，移动到 Documents/submission，并把文件名微信回复给老板。", "work", ("context_extraction", "file_move", "preservation")),
    ("crossapp_work.TencentMeetingKeywordLongestParticipationToNotes", "统计腾讯会议历史里名称包含“快速会议”的会议数量，并把这些会议里参会时长最长的那场会议名一起写到笔记里。", "work", ("filter", "aggregation", "ranking")),
    ("crossapp_work.TencentMeetingLongestPlannedToWechat", "在腾讯会议历史会议里，找预定时长最长的一场，把会议名称和主持人姓名发给微信联系人“陈静”。", "work", ("ranking", "message")),
    ("crossapp_work.CountCurrentLogErrorsToWechat", "打开文件管理器，查看 Download/排障包 里的所有当前日志文件，统计这些日志里 ERROR 一共出现了多少次，把次数微信发给老板。", "work", ("recursive_read", "aggregation", "message")),
    ("crossapp_work.InspectionReportToWechat", "打开文件里的 Download/巡检记录，查看昨天的巡检情况。如果还有没处理的异常，把设备编号和异常项微信发给老板，同时也同步给今天的巡检人；如果都已处理或正常，就微信告诉今天的巡检人昨天巡检正常。", "work", ("recursive_read", "conditional", "multi_recipient")),
    ("crossapp_work.MeetingDurationToWechat", "查看腾讯会议2月3日这天我一共开了多久的会，把总时长发给微信好友陈静", "work", ("date_filter", "aggregation", "message")),
    ("crossapp_work.MeetingLongestInfoToWechat", "帮我看看2月3日腾讯会议哪场开得最久，把那场的会议号和主题用微信告诉陈静", "work", ("date_filter", "ranking", "message")),
    ("crossapp_work.MeetingJoinAndNotifySms", "加入'老王的快速会议'会议，把昵称改成访客小王，然后发短信给张三告知已入会", "work", ("meeting_join", "gui_only_target")),

    ("taobao.FollowShop", "关注「蓝鲸数码旗舰店」", "taobao", ("entity_resolution", "gui_write")),
    ("taobao.AddNewAddress", "新增一个收货地址:林晓彤,13912340001,浙江省 杭州市 西湖区文三路199号创业大厦5楼,标签选「公司」", "taobao", ("form_fill", "gui_write")),
    ("taobao.SetDefaultAddress", "把收货地址「七莘路765弄东苑新天地公寓207」设为默认地址", "taobao", ("entity_resolution", "gui_write")),
    ("taobao.CheckoutCartItem", "把购物车里的「云裳 华夫格卫衣 白灰色 宽松显瘦 开衫外套女」结算掉,只买这一件,完成支付", "taobao", ("cart_filter", "purchase", "negative_constraint")),
    ("taobao.CurateCart", "整理一下购物车:把「蓝鲸 真无线蓝牙耳机 主动降噪 超长续航」移入收藏,删掉「清风山 葵花沐浴露 500mL 身体乳套装 温和清洁」,再把「桔子 每日坚果礼盒 30包混合装 孕妇零食」的数量改成3", "taobao", ("multi_entity", "preservation", "gui_write")),
    ("taobao.BuyToSchoolHuabei", "购买「简木 焖烧保温杯 316不锈钢 大容量」,收货地址选标着「学校」的那个,支付方式用花呗分期,完成支付", "taobao", ("purchase", "address_selection", "payment_selection")),
    ("taobao.SearchAndBuyNow", "搜索「清风山」,购买「清风山 山雾香氛护手霜 75mL 保湿滋润 生日礼物」并完成支付(数量1,规格默认)", "taobao", ("search", "purchase", "format_constraint")),
    ("taobao.RefundOrder", "给「清风山 焕活精华液 30mL 紧致修护」的订单申请退款,原因选「不想要了」", "taobao", ("order_lookup", "refund", "reason_selection")),

    ("steps.HTV2Transfer03", "从工程师最近的发布消息中找出候选版本和通知截止时间，在截止前 10 分钟设一个一次性闹钟，并在笔记（Notes）App 新建“发布通知准备”记录版本、截止时间和闹钟时间。", "transfer", ("context_extraction", "time_arithmetic", "multi_output")),
    ("steps.HTV2Transfer04", "找出 Days Matter 中最早到期且尚未归档的工作事项，提前一周在日历建立同名全天准备日，并把原截止日期和准备日期微信告诉 Mia Wang。", "transfer", ("filter", "date_arithmetic", "multi_output")),
    ("steps.HTV2Transfer05", "按笔记（Notes）App 中“Office pantry”列出的缺货补齐独立的淘宝闪购 App 购物车，每种只加一件；不要进入淘宝 App 内的闪购入口，不要加入清单之外的商品，也不要结算或下单。", "transfer", ("list_extraction", "multi_entity", "negative_constraint")),
    ("steps.HTV2Transfer08", "查看 Days Matter 里 Mia 的生日，在生日一周前晚上七点安排 30 分钟的“准备 Mia 生日礼物”，提前一天提醒，并微信把准备日期告诉 Alice Chen。", "transfer", ("date_arithmetic", "calendar_write", "message")),
    ("steps.HTV2Transfer10", "交叉核对工程师最近的发布消息和笔记（Notes）App 中的发布清单；若候选版本一致，就新建“候选版本已核对”笔记，写明版本、负责人和评审地点，并发一条包含同样三项信息的纯文字朋友圈。", "transfer", ("cross_check", "conditional", "publish")),
]


CASES = [
    HybridV3Case(
        index=index,
        source_task=source,
        instruction=instruction,
        group=group,
        rationale=_GROUP_RATIONALE[group],
        tags=tags,
    )
    for index, (source, instruction, group, tags) in enumerate(_ROWS, start=1)
]

assert len(CASES) == 80
