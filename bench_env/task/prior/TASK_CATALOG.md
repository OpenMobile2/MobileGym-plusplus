# Hybrid Tools V5 Task Catalog

- Scored tasks: 76
- Contracts repaired: 42
- V4 contracts inherited unchanged: 34
- Distinct candidate App Tools: 203
- Simulated time: `2026-07-12 09:00:00`
- Primary metric: task success rate (SR)

| V5 ID | V4 ID | Contract | Difficulty | Apps | Source | Instruction |
| --- | --- | --- | --- | --- | --- | --- |
| `case_01` | `HTV4Case01` | semantic | L4 | alipay, notes | `crossapp_commerce.AlipayLargestExpenseToNotes` | 查查支付宝交易记录里支出金额最大的一笔是什么、花了多少钱，在笔记里记录下来，提醒自己控制开支 |
| `case_02` | `HTV4Case02` | P2 | L4 | ebay, alipay, notes | `crossapp_commerce.EbayBalanceDiffToNotes` | 在eBay查一下最便宜的全新电风扇，看看我用支付宝余额买的话还剩多少钱，在笔记把这个商品、价格和剩余余额写下来 |
| `case_03` | `HTV4Case03` | P1 | L4 | ebay, alipay, notes | `crossapp_commerce.EbayDualItemBalanceToNotes` | 分别在eBay搜电脑和电视最便宜的，看看都买的话支付宝还剩多少钱，在笔记里记下两个商品名、各自价格和剩余余额 |
| `case_04` | `HTV4Case04` | unchanged | L3 | ebay, notes | `crossapp_commerce.EbayDualItemCompareToNotes` | 分别在eBay搜电脑和电视的最低价，在笔记里记下哪个更便宜、便宜多少 |
| `case_05` | `HTV4Case05` | P2 | L3 | ebay, notes | `crossapp_commerce.EbayLowestPriceToNotes` | 在eBay搜电风扇，找到最便宜的那个，把标题和价格记到笔记里 |
| `case_06` | `HTV4Case06` | P2 | L4 | ebay, wechat | `crossapp_commerce.EbayProductShareToWechat` | 帮我在eBay找最便宜的全新电风扇，把商品名称和价格(包含运费)微信发给陈静，问问他觉得怎么样 |
| `case_07` | `HTV4Case07` | P2 | L4 | ebay, alipay, notes, wechat | `crossapp_commerce.FullShoppingDecisionFlow` | 帮我在eBay找最便宜的全新电风扇，看购买后支付宝余额还剩下多少，在笔记记录下商品和余额，然后给微信陈静发消息看他要不要一起买这款商品 |
| `case_08` | `HTV4Case08` | semantic | L4 | alipay, notes | `crossapp_commerce.MonthCompareThenExplainToNote` | 你去支付宝看一下，2026年1月和2025年12月哪个月总花销更高，顺便把差额也算出来。然后在笔记新建一条"月度花销对比"，写上两个月的各自花销、哪个月花得更多、差多少。 |
| `case_09` | `HTV4Case09` | P1 | L4 | alipay, wechat | `crossapp_commerce.Top3ExpenseSummaryToWechat` | 查看支付宝截至今天（包含今天）的最近30天，找出金额最大的3笔支出，把交易标题和金额发微信给黄勇，最后一句加上“我最近得省着点了”。 |
| `case_10` | `HTV4Case10` | semantic | L4 | alipay, wechat | `crossapp_commerce.BillTypeYearSummaryToWechat` | 去支付宝账单里查一下"订单"类型今年一共有多少笔，花了多少钱，微信告诉陈静。 |
| `case_11` | `HTV4Case11` | unchanged | L3 | alipay, wechat | `crossapp_commerce.AlipayYearCompareTopExpenseToWechat` | 比较我支付宝去年支出最高的一笔和今年支出最高的一笔，哪个金额更大，把较大的金额和交易对象名称微信发给“陈静”。 |
| `case_12` | `HTV4Case12` | unchanged | L3 | bilibili, wechat | `crossapp_content.BilibiliRankingToWechat` | 看看B站全站区排行榜第1名是什么视频，把标题微信发给陈静 |
| `case_13` | `HTV4Case13` | unchanged | L3 | bilibili, wechat | `crossapp_content.BilibiliTripleLikeThenMoments` | 在B站全站排行榜找到第1名给它一键三连，然后发个包含该视频完整标题的纯文字朋友圈推荐这个视频。 |
| `case_14` | `HTV4Case14` | P1 | L4 | spotify, wechat_reading, notes, redbook | `crossapp_content.CulturalChecklistToRedbook` | 查看 Spotify 最近播放页中今天按实际播放时间最早的一首歌，再查看微信读书热搜第1名；在笔记新建“今日文化清单”记录两项结果，并在小红书发一篇同时包含这两项结果的分享笔记。 |
| `case_15` | `HTV4Case15` | P2 | L4 | notes, wechat | `crossapp_content.DailyLogToMoments` | 按更新时间找出笔记中最新的两条，简单汇总后发一条朋友圈，记得包含这两条笔记的标题。 |
| `case_16` | `HTV4Case16` | semantic | L3 | ebay, redbook | `crossapp_content.EbayCheapToRedbook` | 帮我在 eBay 看看电风扇里最便宜的那款，然后发一篇小红书商品推荐笔记，推荐内容中要包含完整商品标题。 |
| `case_17` | `HTV4Case17` | P1 | L4 | wechat_reading, notes | `crossapp_content.ReadingPlanToNotes` | 查看微信读书书架中所有已有阅读进度且尚未读完的书，并在笔记里制定一份包含这些书的本周阅读计划。 |
| `case_18` | `HTV4Case18` | semantic | L3 | redbook, wechat | `crossapp_content.RedbookDmThenWechatReport` | 给小红书上我关注的‘西柚慢行’发私信‘你好呀’，然后在微信把博主昵称发给陈静，并告诉她已经联系他了。 |
| `case_19` | `HTV4Case19` | unchanged | L4 | redbook, sms | `crossapp_content.RedbookFollowingNoteCountToSms` | 查小红书我关注的'西柚慢行'发了多少篇笔记，发短信告诉张三 |
| `case_20` | `HTV4Case20` | unchanged | L3 | redbook, wechat | `crossapp_content.RedbookSearchTitleToWechat` | 在小红书搜'数分'，把第一篇笔记的标题微信发给陈静 |
| `case_21` | `HTV4Case21` | P1 | L4 | spotify, redbook | `crossapp_content.SpotifyTodayNthPlayToRedbook` | 查看今天在 Spotify 按实际播放时间从早到晚的第1首歌，在小红书发一篇推荐笔记，标题或正文包含歌名和艺人。 |
| `case_22` | `HTV4Case22` | P1 | L4 | spotify, redbook | `crossapp_content.ThirdSpotifyPlayRecommendOnRedbookAndPlaylist` | 查看今天在 Spotify 按实际播放时间从早到晚的第3首歌，在小红书发一篇正文包含歌名和歌手的推荐；再把同一首歌加入新歌单“今天爱听”。 |
| `case_23` | `HTV4Case23` | P2 | L3 | wechat_reading, wechat | `crossapp_content.WechatReadingBestBookToWechat` | 帮我在微信读书历史分类下找推荐值最高的书，把书名和推荐值微信发给陈静 |
| `case_24` | `HTV4Case24` | semantic | L4 | wechat_reading, wechat | `crossapp_content.WechatReadingStatsToWechat` | 查看微信读书从今天起往前7天（包含今天）的记录，找出阅读时长最多的一天及当天总时长，告诉微信好友陈静。 |
| `case_25` | `HTV4Case25` | P1 | L4 | wechat_reading, spotify, wechat | `crossapp_content.WeeklyReadingAndLikedSpotifySongsToMoment` | 查看微信读书从今天起往前7天（包含今天）的记录，找出阅读最久的一天；再汇总Spotify今天听过且已点赞的歌曲名称和作者，发一条朋友圈，同时包含“最近阅读最投入的一天”和“现在在听的歌”。 |
| `case_26` | `HTV4Case26` | unchanged | L4 | x, reddit | `crossapp_content.XLatestPostToReddit_WithTitleFormat` | 把 X 用户 elonmusk 最新一条推文的文字内容，以"elonmusk:"开头发到 Reddit 的 r/China_irl。 |
| `case_27` | `HTV4Case27` | unchanged | L4 | redbook, notes | `crossapp_content.RedbookTopLikedToNotes` | 在小红书搜索“旅行”，把前 10 篇帖子中点赞最多的两篇的标题写到笔记，一行一条。 |
| `case_28` | `HTV4Case28` | unchanged | L4 | redbook, notes | `crossapp_content.RedbookUserBestWorstToNotes` | 把小红书用户“铁铁健身日记”发过的帖子里，点赞数最高的那篇帖子和收藏数最低的那篇帖子的标题都写到笔记里，一行一条。 |
| `case_29` | `HTV4Case29` | semantic | L4 | redbook, wechat | `crossapp_content.RedbookAuthorTopCollectToWechat` | 在小红书搜索“旅行”，把前 10 篇帖子中点赞最多的一个帖子的作者主页发过的收藏最多的帖子的标题和这个作者的昵称和获赞与收藏数微信发给“陈静”。 |
| `case_30` | `HTV4Case30` | semantic | L3 | redbook, wechat | `crossapp_content.RedbookUserTopCollectToWechat` | 查看小红书用户“铁铁健身日记”的主页，找到点赞数最高的那篇帖子，收藏它，把它的标题和作者的获赞与收藏数微信发给“陈静”。 |
| `case_31` | `HTV4Case31` | unchanged | L3 | calendar, weather, wechat | `crossapp_life.CalendarFreeWeatherInvite` | 看看日历下周末哪天没安排，查那天北京天气，有一天没有安排而且不下雨就给陈静发消息约出去玩 |
| `case_32` | `HTV4Case32` | P2 | L4 | weather, railway12306, calendar, clock | `crossapp_life.FullTripPlanWeatherDriven` | 从明天开始的未来14天中，找出上海第一个不下雨且日历无安排的日期，为12306当前登录账号本人提交当天从北京出发的最早高铁订单，并设置出发前一小时的闹钟。 |
| `case_33` | `HTV4Case33` | semantic | L4 | map, wechat | `crossapp_life.MapNearbyBestToWechat` | 在地图搜2公里内评分最高的咖啡馆，把名字、评分和地址微信发给陈静，评分一样的话优先最近的 |
| `case_34` | `HTV4Case34` | semantic | L3 | map, wechat | `crossapp_life.MapPlaceToWechat` | 帮我在地图上搜一下故宫的地址，发给微信好友陈静 |
| `case_35` | `HTV4Case35` | unchanged | L3 | map | `map.NearestInRadiusRatingRank` | 最近的有评分的咖啡馆在附近2公里内同类评分里排第几 |
| `case_36` | `HTV4Case36` | P1 | L2 | weather | `weather.AddCityAndFindWarmestDay` | 把南京添加到天气 App，并找出从明天开始的未来7天中最高温最高的日期。 |
| `case_37` | `HTV4Case37` | semantic | L3 | map, weather, wechat | `crossapp_life.TravelPlanToWechat` | 在地图中查询中国国家博物馆显示的完整详细地址，并查询该地址所在城市的当前天气，把地址、天气和温度一起微信发给陈静。 |
| `case_38` | `HTV4Case38` | P2 | L2 | spotify | `spotify.BuildPlaylistFromTwoArtists` | 新建歌单《双艺人精选》，搜索周杰伦和林俊杰，恰好各加入2首歌，不加入其他歌曲，然后播放这个歌单。 |
| `case_39` | `HTV4Case39` | unchanged | L2 | redbook | `redbook.CollectFeedNoteAndDMAuthor` | 收藏推荐页标题含"分享"的笔记，给作者发一句"这篇内容很有启发，谢谢分享" |
| `case_40` | `HTV4Case40` | P1 | L2 | weather, notes | `crossapp_life.WeatherFilterNonRainyDays` | 查看北京从明天开始的未来5天天气，把其中所有不下雨的日期记到标题为“适合出行的日子”的笔记中。 |
| `case_41` | `HTV4Case41` | P1 | L4 | weather, railway12306 | `crossapp_life.WeatherFirstNonRainyDayBuyTicket` | 查看上海从明天开始的未来3天天气，为12306当前登录账号本人提交第一个不下雨日期从北京到上海的高铁订单。 |
| `case_42` | `HTV4Case42` | P2 | L4 | weather, calendar, clock | `crossapp_life.WeatherFirstSunnyDayCalendarAlarm` | 查看北京从明天开始的未来14天天气，在第一个不下雨的日期创建“户外运动”日程，并设置一个早上8点的闹钟。 |
| `case_43` | `HTV4Case43` | unchanged | L4 | weather, wechat | `crossapp_life.WeatherShareMetric` | 查询天气 App 城市列表中的“北京”（不是当前定位的海淀）的当前温度和体感温度，把两项结果微信发给陈静。 |
| `case_44` | `HTV4Case44` | P2 | L4 | wechat, map, sms | `crossapp_life.WechatFoodExtractMapSms` | 看看陈静在微信里最近说想吃什么，搜附近最近的那家，把地址用短信发给张三 |
| `case_45` | `HTV4Case45` | unchanged | L4 | wechat_reading | `wechat_reading.OrganizeShelfByRecommendation` | 整理微信读书书架，把推荐值不高于95.0%的书都删掉 |
| `case_46` | `HTV4Case46` | P2 | L3 | weather, calendar, sms | `crossapp_life.WeatherFirstNonRainyToCalendarAndSms` | 找出北京从明天开始的未来7天中第一个不下雨的日期，创建“户外跑步”日程，并短信告诉张三该日期和天气，约他一起跑步。 |
| `case_47` | `HTV4Case47` | P1 | L4 | calendar | `calendar.CreateEventWithAlarmAndConfirm` | 7月14号的晚上6点半到8点，帮我在日历里安排一个日程叫"面试"，再顺手加个提前30分钟提醒，闹钟提醒打开。 |
| `case_48` | `HTV4Case48` | unchanged | L4 | file_manager | `file_manager.CreateKeepFolderAndDeleteRawLogs` | 在文件管理器的 Download/日志导出中新建“保留-已汇总”文件夹，只删除 raw_login.log、raw_payment.log 和 raw_sync.log，保留目录中的其他文件。 |
| `case_49` | `HTV4Case49` | unchanged | L4 | railway12306, wechat | `crossapp_life.RailwayMyAccountToWechat` | 把我的 12306 账号微信发给陈静 |
| `case_50` | `HTV4Case50` | unchanged | L4 | tencent_meeting | `tencent_meeting.ScheduleMeeting` | 帮我预约一个会议，主题是预算评审会，时长60分钟，密码设为2468，然后告诉我会议号 |
| `case_51` | `HTV4Case51` | semantic | L4 | calendar, tencent_meeting, wechat, sms | `crossapp_work.FullMeetingConflictCheckBroadcast` | 检查日历上明天03:30有没有安排，如果有空就在腾讯会议预约主题为「临时协调会」的会议，日历创建同名日程（开始时间与会议一致，设提前15分钟的提醒闹钟），会议号微信发给陈静，短信发给张三；有安排的话微信告诉陈静那个时间不行 |
| `case_52` | `HTV4Case52` | unchanged | L4 | tencent_meeting, calendar, wechat | `crossapp_work.MeetingFullFlowToWechat` | 帮我在腾讯会议预约明天10:00的项目周会，在日历上加个日程提醒，日程设一个提前15分钟的闹钟，最后把会议号微信发给陈静 |
| `case_53` | `HTV4Case53` | P2 | L4 | tencent_meeting, wechat, sms | `crossapp_work.MeetingMultiChannelNotify` | 帮我在腾讯会议创建一个会议，然后把会议号通过微信发给张伟，通过短信发给张三 |
| `case_54` | `HTV4Case54` | unchanged | L3 | tencent_meeting, map, wechat | `crossapp_work.MeetingRouteEtaToWechat` | 查一下我下一场腾讯会议几点开始，搜一下走到故宫要多久，发微信告诉陈静我还有多久到和会议时间 |
| `case_55` | `HTV4Case55` | unchanged | L3 | weather, tencent_meeting, clock | `crossapp_work.WeatherConditionalCancelMeeting` | 看北京明天天气，如果有雨就在腾讯会议取消主题为'项目例会'的会议；如果不下雨就保留该会议并设置一个该会议开始前半小时的闹钟 |
| `case_56` | `HTV4Case56` | unchanged | L4 | tencent_meeting, notes, wechat, sms | `crossapp_work.ScheduleReleaseMeetingAndNotifyViaNotesWechatSms` | 预约明天09:00、时长15分钟、密码123456的“版本发布会”；创建成功后，把生成的会议号和密码同时记入笔记、微信发给陈静并短信发给张三。 |
| `case_57` | `HTV4Case57` | semantic | L3 | wechat, file_manager | `crossapp_work.SubmitRequestedAttachmentsToBoss` | 在微信看看老板最近让我补交的材料，然后在 Download/待提交 里找到对应文件，移动到 Documents/submission，并把文件名微信回复给老板。 |
| `case_58` | `HTV4Case58` | unchanged | L4 | tencent_meeting, notes | `crossapp_work.TencentMeetingKeywordLongestParticipationToNotes` | 统计腾讯会议历史里名称包含“快速会议”的会议数量，并把这些会议里参会时长最长的那场会议名一起写到笔记里。 |
| `case_59` | `HTV4Case59` | unchanged | L4 | tencent_meeting, wechat | `crossapp_work.TencentMeetingLongestPlannedToWechat` | 在腾讯会议历史会议里，找预定时长最长的一场，把会议名称和主持人姓名发给微信联系人“陈静”。 |
| `case_60` | `HTV4Case60` | unchanged | L4 | file_manager, wechat | `crossapp_work.CountCurrentLogErrorsToWechat` | 打开文件管理器，查看 Download/排障包 里的所有当前日志文件，统计这些日志里 ERROR 一共出现了多少次，把次数微信发给老板。 |
| `case_61` | `HTV4Case61` | unchanged | L4 | file_manager, wechat | `crossapp_work.InspectionReportToWechat` | 打开文件里的 Download/巡检记录，查看昨天的巡检情况。如果还有没处理的异常，把设备编号和异常项微信发给老板，同时也同步给今天的巡检人；如果都已处理或正常，就微信告诉今天的巡检人昨天巡检正常。 |
| `case_62` | `HTV4Case62` | unchanged | L3 | tencent_meeting, wechat | `crossapp_work.MeetingDurationToWechat` | 查看腾讯会议2月3日这天我一共开了多久的会，把总时长发给微信好友陈静 |
| `case_63` | `HTV4Case63` | P2 | L2 | tencent_meeting, wechat | `crossapp_work.MeetingLongestInfoToWechat` | 查看2月3日腾讯会议历史中预定时长最长的一场，把该会议的会议号和主题微信告诉陈静。 |
| `case_64` | `HTV4Case64` | unchanged | L2 | taobao | `taobao.FollowShop` | 关注「蓝鲸数码旗舰店」 |
| `case_65` | `HTV4Case65` | unchanged | L3 | taobao | `taobao.AddNewAddress` | 新增一个收货地址:林晓彤,13912340001,浙江省 杭州市 西湖区文三路199号创业大厦5楼,标签选「公司」 |
| `case_66` | `HTV4Case66` | unchanged | L2 | taobao | `taobao.SetDefaultAddress` | 把收货地址「七莘路765弄东苑新天地公寓207」设为默认地址 |
| `case_67` | `HTV4Case67` | unchanged | L3 | taobao | `taobao.CheckoutCartItem` | 把购物车里的「云裳 华夫格卫衣 白灰色 宽松显瘦 开衫外套女」结算掉,只买这一件,完成支付 |
| `case_68` | `HTV4Case68` | unchanged | L4 | taobao | `taobao.CurateCart` | 整理一下购物车:把「蓝鲸 真无线蓝牙耳机 主动降噪 超长续航」移入收藏,删掉「清风山 葵花沐浴露 500mL 身体乳套装 温和清洁」,再把「桔子 每日坚果礼盒 30包混合装 孕妇零食」的数量改成3 |
| `case_69` | `HTV4Case69` | unchanged | L4 | taobao | `taobao.BuyToSchoolHuabei` | 购买「简木 焖烧保温杯 316不锈钢 大容量」,收货地址选标着「学校」的那个,支付方式用花呗分期,完成支付 |
| `case_70` | `HTV4Case70` | semantic | L3 | taobao | `taobao.SearchAndBuyNow` | 搜索「清风山」,购买「清风山 山雾香氛护手霜 75mL 保湿滋润 生日礼物」并完成支付(数量1,规格默认) |
| `case_71` | `HTV4Case71` | unchanged | L3 | taobao | `taobao.RefundOrder` | 给「清风山 焕活精华液 30mL 紧致修护」的订单申请退款,原因选「不想要了」 |
| `case_72` | `HTV4Case72` | semantic | L4 | wechat, clock, notes | `steps.HTV2Transfer03` | 从工程师最近的发布消息中找出候选版本和通知截止时间，在截止前 10 分钟设一个一次性闹钟，并在笔记（Notes）App 新建“发布通知准备”记录版本、截止时间和闹钟时间。 |
| `case_73` | `HTV4Case73` | P1 | L4 | daysmatter, calendar, wechat | `steps.HTV2Transfer04` | 找出 Days Matter 中最早到期且尚未归档的工作事项，提前一周在日历建立同名全天准备日，并把原截止日期和准备日期微信告诉 Mia Wang。 |
| `case_74` | `HTV4Case74` | P1 | L4 | notes, tbsg | `steps.HTV2Transfer05` | 按笔记（Notes）App 中“Office pantry”列出的缺货补齐独立的淘宝闪购 App 购物车，每种只加一件；不要进入淘宝 App 内的闪购入口，不要加入清单之外的商品，也不要结算或下单。 |
| `case_75` | `HTV4Case75` | P1 | L4 | daysmatter, calendar, wechat | `steps.HTV2Transfer08` | 查看 Days Matter 中 Mia 的生日，在生日一周前19:00创建30分钟的“准备 Mia 生日礼物”日程，设置提前一天提醒并打开闹钟提醒，再微信把完整准备日期（年月日）告诉 Alice Chen。 |
| `case_76` | `HTV4Case76` | unchanged | L4 | wechat, notes | `steps.HTV2Transfer10` | 交叉核对工程师最近的发布消息和笔记（Notes）App 中的发布清单；若候选版本一致，就新建“候选版本已核对”笔记，写明版本、负责人和评审地点，并发一条包含同样三项信息的纯文字朋友圈。 |

## Candidate Tool Coverage

Candidate coverage means a tool can be exposed when its app is foregrounded;
it does not imply that a reference trajectory must call it.

| Tool | Candidate tasks |
| --- | ---: |
| `alipay__get_balance_summary` | 8 |
| `alipay__get_bill_summary` | 8 |
| `alipay__list_bank_cards` | 8 |
| `alipay__list_conversations` | 8 |
| `alipay__open_bill` | 8 |
| `alipay__open_bills` | 8 |
| `alipay__open_contact` | 8 |
| `alipay__open_scan` | 8 |
| `alipay__prepare_transfer` | 8 |
| `alipay__search_bills` | 8 |
| `alipay__search_contacts` | 8 |
| `alipay__send_chat_message` | 8 |
| `alipay__summarize_bills` | 8 |
| `bilibili__add_video_to_folder` | 2 |
| `bilibili__follow_author` | 2 |
| `bilibili__get_ranking` | 2 |
| `bilibili__get_video_summary` | 2 |
| `bilibili__get_video_tags` | 2 |
| `bilibili__list_favorite_folders` | 2 |
| `bilibili__open_author` | 2 |
| `bilibili__open_ranking` | 2 |
| `bilibili__open_search` | 2 |
| `bilibili__open_video` | 2 |
| `bilibili__search_authors` | 2 |
| `bilibili__search_videos` | 2 |
| `calendar__get_busy_intervals` | 9 |
| `calendar__open_date` | 9 |
| `calendar__open_event` | 9 |
| `calendar__prepare_event_draft` | 9 |
| `calendar__search_events` | 9 |
| `clock__add_world_city` | 4 |
| `clock__create_alarm` | 4 |
| `clock__get_next_alarm` | 4 |
| `clock__get_world_times` | 4 |
| `clock__list_alarms` | 4 |
| `clock__open_alarms` | 4 |
| `clock__open_timer` | 4 |
| `clock__search_world_cities` | 4 |
| `clock__set_alarm_enabled` | 4 |
| `daysmatter__archive_event` | 2 |
| `daysmatter__calculate_date_difference` | 2 |
| `daysmatter__get_event_countdown` | 2 |
| `daysmatter__list_notebooks` | 2 |
| `daysmatter__list_upcoming_events` | 2 |
| `daysmatter__open_event` | 2 |
| `daysmatter__open_notebook` | 2 |
| `daysmatter__prepare_event_draft` | 2 |
| `daysmatter__search_events` | 2 |
| `ebay__compare_products` | 7 |
| `ebay__get_product_summary` | 7 |
| `ebay__list_recent_searches` | 7 |
| `ebay__open_cart` | 7 |
| `ebay__open_product` | 7 |
| `ebay__open_search` | 7 |
| `ebay__save_search` | 7 |
| `ebay__search_products` | 7 |
| `file_manager__copy_file` | 4 |
| `file_manager__create_folder` | 4 |
| `file_manager__get_metadata` | 4 |
| `file_manager__list_directory` | 4 |
| `file_manager__list_recent` | 4 |
| `file_manager__open_containing_folder` | 4 |
| `file_manager__open_path` | 4 |
| `file_manager__open_recent` | 4 |
| `file_manager__read_text` | 4 |
| `file_manager__search` | 4 |
| `file_manager__summarize_storage` | 4 |
| `map__compare_places` | 6 |
| `map__find_nearby` | 6 |
| `map__get_current_location` | 6 |
| `map__get_navigation_preferences` | 6 |
| `map__list_recent_searches` | 6 |
| `map__open_navigation_settings` | 6 |
| `map__open_place` | 6 |
| `map__open_route_planner` | 6 |
| `map__open_search` | 6 |
| `map__open_search_results` | 6 |
| `map__open_settings` | 6 |
| `map__save_search` | 6 |
| `map__search_places` | 6 |
| `map__set_route_avoidance` | 6 |
| `notes__create_note` | 18 |
| `notes__create_todo` | 18 |
| `notes__list_folders` | 18 |
| `notes__list_recent_notes` | 18 |
| `notes__open_folder` | 18 |
| `notes__open_note` | 18 |
| `notes__open_todos` | 18 |
| `notes__search_notes` | 18 |
| `notes__search_todos` | 18 |
| `notes__set_todo_completed` | 18 |
| `railway12306__get_account_summary` | 3 |
| `railway12306__get_order_summary` | 3 |
| `railway12306__get_train_summary` | 3 |
| `railway12306__list_orders` | 3 |
| `railway12306__list_passengers` | 3 |
| `railway12306__open_invoice` | 3 |
| `railway12306__open_order` | 3 |
| `railway12306__open_passengers` | 3 |
| `railway12306__open_query_form` | 3 |
| `railway12306__open_query_results` | 3 |
| `railway12306__open_train_for_booking` | 3 |
| `railway12306__query_trains` | 3 |
| `railway12306__query_transfer_plans` | 3 |
| `railway12306__search_stations` | 3 |
| `redbook__get_note_summary` | 12 |
| `redbook__list_chat_threads` | 12 |
| `redbook__list_saved_notes` | 12 |
| `redbook__open_chat` | 12 |
| `redbook__open_note` | 12 |
| `redbook__open_search` | 12 |
| `redbook__open_user` | 12 |
| `redbook__prepare_text_post` | 12 |
| `redbook__search_chat_messages` | 12 |
| `redbook__search_notes` | 12 |
| `redbook__search_users` | 12 |
| `reddit__get_post_summary` | 1 |
| `reddit__join_community` | 1 |
| `reddit__list_communities` | 1 |
| `reddit__list_saved_posts` | 1 |
| `reddit__open_chat` | 1 |
| `reddit__open_post` | 1 |
| `reddit__open_search` | 1 |
| `reddit__search_chat` | 1 |
| `reddit__search_posts` | 1 |
| `spotify__add_to_playlist` | 5 |
| `spotify__add_to_queue` | 5 |
| `spotify__get_track_summary` | 5 |
| `spotify__list_liked_songs` | 5 |
| `spotify__list_playlists` | 5 |
| `spotify__list_recent_plays` | 5 |
| `spotify__open_artist` | 5 |
| `spotify__open_playlist` | 5 |
| `spotify__open_queue` | 5 |
| `spotify__open_search` | 5 |
| `spotify__search_artists` | 5 |
| `spotify__search_tracks` | 5 |
| `taobao__add_to_cart` | 8 |
| `taobao__compare_items` | 8 |
| `taobao__get_cart` | 8 |
| `taobao__get_item_summary` | 8 |
| `taobao__get_order_summary` | 8 |
| `taobao__list_coupons` | 8 |
| `taobao__list_orders` | 8 |
| `taobao__open_cart` | 8 |
| `taobao__open_item` | 8 |
| `taobao__open_search_results` | 8 |
| `taobao__open_shop` | 8 |
| `taobao__prepare_checkout` | 8 |
| `taobao__search_items` | 8 |
| `taobao__search_shops` | 8 |
| `tbsg__add_item_to_cart` | 1 |
| `tbsg__get_cart` | 1 |
| `tbsg__get_shop_menu` | 1 |
| `tbsg__list_orders` | 1 |
| `tbsg__open_cart` | 1 |
| `tbsg__open_order` | 1 |
| `tbsg__open_shop` | 1 |
| `tbsg__prepare_checkout` | 1 |
| `tbsg__search_items` | 1 |
| `tbsg__search_shops` | 1 |
| `tencent_meeting__calculate_participation` | 11 |
| `tencent_meeting__get_meeting_summary` | 11 |
| `tencent_meeting__list_history` | 11 |
| `tencent_meeting__list_scheduled` | 11 |
| `tencent_meeting__mark_message_read` | 11 |
| `tencent_meeting__open_history` | 11 |
| `tencent_meeting__open_join_form` | 11 |
| `tencent_meeting__open_meeting` | 11 |
| `tencent_meeting__prepare_schedule` | 11 |
| `tencent_meeting__search_contacts` | 11 |
| `tencent_meeting__search_meetings` | 11 |
| `weather__add_saved_city` | 10 |
| `weather__find_days_by_condition` | 10 |
| `weather__get_air_quality` | 10 |
| `weather__get_current_weather` | 10 |
| `weather__get_daily_forecast` | 10 |
| `weather__list_saved_cities` | 10 |
| `weather__open_air_quality` | 10 |
| `weather__open_city` | 10 |
| `weather__open_daily_forecast` | 10 |
| `weather__search_cities` | 10 |
| `wechat__get_message_context` | 37 |
| `wechat__list_recent_chats` | 37 |
| `wechat__open_chat` | 37 |
| `wechat__open_chat_search` | 37 |
| `wechat__open_contact` | 37 |
| `wechat__open_moments` | 37 |
| `wechat__prepare_moment_draft` | 37 |
| `wechat__search_contacts` | 37 |
| `wechat__search_messages` | 37 |
| `wechat__send_text_message` | 37 |
| `wechat_reading__add_to_bookshelf` | 6 |
| `wechat_reading__compare_books` | 6 |
| `wechat_reading__get_book_summary` | 6 |
| `wechat_reading__get_hot_search` | 6 |
| `wechat_reading__get_reading_stats` | 6 |
| `wechat_reading__list_bookshelf` | 6 |
| `wechat_reading__open_book` | 6 |
| `wechat_reading__open_bookshelf` | 6 |
| `wechat_reading__open_reader` | 6 |
| `wechat_reading__open_search` | 6 |
| `wechat_reading__search_books` | 6 |
