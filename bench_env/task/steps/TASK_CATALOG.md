# Hybrid Tools V2 Task Catalog

V2 is a fixed 50-task challenge suite. Instructions express user intent; source values
remain in simulator state. Official-derived cases retain their upstream semantic verifier.

- Tasks: 50
- Official L3/L4 verifier wrappers: 40
- New hybrid dependency tasks: 10
- Distinct candidate App Tools: 53

| ID | Difficulty | Apps | Source verifier | Instruction |
| --- | --- | --- | --- | --- |
| `official_01` | L4 | alipay, wechat | `crossapp_commerce.AlipayLargestExpenseToMoments` | 翻翻支付宝账单，找到花钱最多的那笔，发条朋友圈吐槽一下。 |
| `official_02` | L4 | alipay, notes | `crossapp_commerce.AlipayLargestExpenseToNotes` | 查清支付宝里金额最大的支出，把交易对象和金额记到笔记（Notes）App，提醒自己控制开支。 |
| `official_03` | L3 | alipay, notes, wechat | `crossapp_commerce.AlipayMonthlyToNotesAndWechat` | 核算支付宝本月总支出，在笔记（Notes）App 留一份记录，并把同一个金额告诉微信里的陈静。 |
| `official_04` | L4 | alipay, notes, wechat | `crossapp_commerce.AlipayThankTopIncomeTransfer` | 统计支付宝收到的转账笔数，找出金额最高的一笔；把笔数和最高金额分行记到笔记（Notes）App，再去微信感谢转账人。 |
| `official_05` | L4 | alipay, wechat | `crossapp_commerce.BillTypeYearSummaryToWechat` | 统计支付宝今年“订单”类型账单的笔数和总支出，并微信告诉陈静。 |
| `official_06` | L4 | ebay, alipay, notes | `crossapp_commerce.EbayDualItemBalanceToNotes` | 分别找出 eBay 上最便宜的电脑和电视，算出都买下后支付宝余额还剩多少，把商品名、各自价格和余额记到笔记（Notes）App。 |
| `official_07` | L4 | ebay, alipay, notes, wechat | `crossapp_commerce.FullShoppingDecisionFlow` | 在 eBay 找到最便宜的全新电风扇，核算购买后的支付宝余额，在笔记（Notes）App 留一份记录，再问微信里的陈静是否一起买。 |
| `official_08` | L4 | alipay, notes | `crossapp_commerce.MonthCompareThenExplainToNote` | 比较支付宝 2026 年 1 月和 2025 年 12 月的总花销，在笔记（Notes）App 新建“月度花销对比”，写清各月金额、较高月份和差额。 |
| `official_09` | L4 | alipay, wechat | `crossapp_commerce.Top3ExpenseSummaryToWechat` | 把支付宝最近 30 天金额最大的三笔支出按交易标题和金额汇总给微信里的黄勇，末尾提醒自己最近要省一点。 |
| `official_10` | L4 | ebay, wechat | `crossapp_commerce.EbayProductShareToWechat` | 找出 eBay 上含运费后最便宜的全新电风扇，把商品名称和总价发给微信里的陈静，问问他的意见。 |
| `official_11` | L3 | bilibili, wechat | `crossapp_content.BilibiliRankAuthorLastNovToWechat` | 查看 B 站舞蹈分区排行榜第 10 名作者去年 11 月的投稿，向微信联系人陈静汇报粉丝数、当月投稿数和其中播放量最高的视频名。 |
| `official_12` | L4 | bilibili, wechat | `crossapp_content.BilibiliRankTop3FolderAndWechat` | 从 B 站娱乐分区前 20 名中找出播放量最高的三个视频，收藏到新建的“热门视频”收藏夹，并把第一名的标题和播放量微信发给陈静。 |
| `official_13` | L4 | spotify, wechat_reading, notes, redbook | `crossapp_content.CulturalChecklistToRedbook` | 整理今天的文化清单：包括 Spotify 今天最早听的歌和微信读书热搜第一本书；保存到笔记（Notes）App，并在小红书分享。 |
| `official_14` | L4 | notes, wechat | `crossapp_content.DailyLogToMoments` | 把笔记（Notes）App 里最新两条内容整理成一条简短的朋友圈动态。 |
| `official_15` | L4 | file_manager, wechat | `crossapp_content.FileManagerSendFileToWechatContact` | 找出文件系统中内容相同但位于不同目录、文件名不同的那两张图片，把两个文件名微信发给陈静。 |
| `official_16` | L4 | redbook, wechat | `crossapp_content.RedbookAuthorTopCollectToWechat` | 在小红书搜索旅行，从前十篇中先找到点赞最多帖子，再到其作者主页找到收藏最多的帖子，把该标题、作者昵称及作者获赞与收藏数微信发给陈静。 |
| `official_17` | L4 | redbook, notes | `crossapp_content.RedbookTopLikedToNotes` | 在小红书搜索旅行，把前十篇中点赞最多的两篇标题分行写进笔记（Notes）App。 |
| `official_18` | L4 | redbook, notes | `crossapp_content.RedbookUserBestWorstToNotes` | 比较小红书用户“铁铁健身日记”的全部帖子，把点赞最高和收藏最低的帖子标题分行记到笔记（Notes）App。 |
| `official_19` | L4 | wechat_reading, wechat | `crossapp_content.WechatReadingStatsToWechat` | 找出微信读书最近一周阅读最久的一天及阅读时长，告诉微信好友陈静。 |
| `official_20` | L4 | wechat_reading, spotify, wechat | `crossapp_content.WeeklyReadingAndLikedSpotifySongsToMoment` | 发一条朋友圈，汇总微信读书最近一周阅读最投入的一天，以及 Spotify 今天听过且已点赞的歌曲名称和作者。 |
| `official_21` | L3 | calendar, weather, wechat | `crossapp_life.CalendarFreeWeatherInvite` | 结合日历和北京天气，判断下周末是否有既没安排又不下雨的一天；有的话微信约陈静出去玩。 |
| `official_22` | L4 | weather, railway12306, calendar, clock | `crossapp_life.FullTripPlanWeatherDriven` | 为上海出差选择未来两周第一个不下雨且日历无安排的日期，提交当天从北京出发的最早高铁订单，并设出发前一小时的闹钟。 |
| `official_23` | L4 | map, wechat | `crossapp_life.MapNearbyBestToWechat` | 在地图中找两公里内评分最高的咖啡馆，同分时选更近的，把名称、评分和地址微信发给陈静。 |
| `official_24` | L4 | wechat, gallery | `crossapp_life.OpenedFridgeFoodsToMom` | 根据相册里的冰箱照片，找出已经开封但尚未吃完的食物，微信提醒妈妈记得吃；不要把未开封或只是调料的东西算进去。 |
| `official_25` | L4 | railway12306, alipay, wechat | `crossapp_life.RailwayBalanceConditionalBuyNotify` | 查明天北京到上海最便宜的高铁票并核对支付宝余额；够的话提交订单并微信告诉陈静要去上海，不够则告诉她余额不足。 |
| `official_26` | L3 | railway12306, weather, notes, wechat | `crossapp_life.RealisticTrip001` | 为后天从杭州去上海的出差查最早高铁和当地天气，在笔记（Notes）App 整理为“上海出差备忘”；微信告知陈静到达时间，下雨时还要提醒她带伞。 |
| `official_27` | L4 | railway12306, calendar, clock, wechat | `crossapp_life.TripClosedLoopNotify` | 查明天上海到南京最早的高铁，把行程同步到日历和出发前一小时的闹钟，并将车次信息微信发给陈静。 |
| `official_28` | L4 | weather, calendar, clock | `crossapp_life.WeatherFirstSunnyDayCalendarAlarm` | 找出北京未来两周第一个不下雨的日期，在当天创建户外运动日程，并设置早上八点的闹钟。 |
| `official_29` | L4 | railway12306, weather, calendar, clock, notes, wechat | `crossapp_life.WeekendShanghaiTripIfClearAndFree` | 规划下周六北京到成都的周末行：只有天气非雨且上午日历不冲突时，才把最早高铁、天气和出发时间写入笔记（Notes）App 的“周末成都计划”，设出发前一小时闹钟并微信询问陈静是否方便见面。 |
| `official_30` | L3 | weather, map, calendar, wechat | `crossapp_life.WeekendTripFullPlan` | 如果下周六北京不下雨，就查开车去颐和园的时间，在日历安排“出游”，并微信邀请陈静同行。 |
| `official_31` | L4 | file_manager, wechat | `crossapp_work.CountCurrentLogErrorsToWechat` | 统计 Download/排障包 中所有当前日志文件里 ERROR 的总出现次数，微信报告给老板。 |
| `official_32` | L4 | calendar, tencent_meeting, wechat, sms | `crossapp_work.FullMeetingConflictCheckBroadcast` | 确认明天 03:30 是否空闲；空闲则预约“临时协调会”，创建同时间且提前 15 分钟提醒的日程，并把会议号分别微信给陈静、短信给张三；冲突则只微信告知陈静。 |
| `official_33` | L4 | tencent_meeting, calendar, wechat | `crossapp_work.MeetingFullFlowToWechat` | 预约明天 10:00 的项目周会，同步到日历并提前 15 分钟提醒，最后把会议号微信发给陈静。 |
| `official_34` | L4 | tencent_meeting, notes | `crossapp_work.MeetingReminderToNotes` | 把腾讯会议中下一场待开始会议的主题和开始时间记到笔记（Notes）App；没有待开始会议时改记正在进行的会议。 |
| `official_35` | L4 | calendar, file_manager, wechat | `crossapp_work.OrganizeMeetingMaterialsToWechat` | 根据日历里最近需要补资料的会议，从 Download/会议资料 找到对应材料，整理到 Documents/meeting_pack，并把移动的文件名微信发给老板。 |
| `official_36` | L4 | file_manager, wechat | `crossapp_work.OrganizePdfReportsToWechat` | 把 Documents 下的所有 PDF 报告整理到其 final_reports 子目录，并把移动的文件名微信发给老板。 |
| `official_37` | L4 | tencent_meeting, notes, wechat, sms | `crossapp_work.ScheduleReleaseMeetingAndNotifyViaNotesWechatSms` | 预约明天 9:00、时长 15 分钟、密码 123456 的“版本发布会”，把会议信息同时保存到笔记（Notes）App、微信发给陈静并短信发给张三。 |
| `official_38` | L3 | wechat, file_manager | `crossapp_work.SubmitRequestedAttachmentsToBoss` | 根据老板最近在微信要求补交的材料，从 Download/待提交 找出对应文件并移到 Documents/submission，再微信回复实际提交的文件名。 |
| `official_39` | L4 | tencent_meeting, notes | `crossapp_work.TencentMeetingKeywordLongestParticipationToNotes` | 统计腾讯会议历史中名称含“快速会议”的会议数量，并把其中参会时长最长的一场名称和数量一起写入笔记（Notes）App。 |
| `official_40` | L3 | weather, tencent_meeting, clock | `crossapp_work.WeatherConditionalCancelMeeting` | 根据北京明天天气处理“项目例会”：有雨则取消会议；无雨则保留并设置会前半小时闹钟。 |
| `transfer_01` | L4 | calendar, wechat | v2 state goals | 找出日历中持续时间最长的工作会议，在它结束半小时后安排一场 30 分钟的“最长会议跟进”，备注保留原会议地点并提前 15 分钟提醒；再把跟进时间和地点微信告诉 Alice Chen。 |
| `transfer_02` | L4 | notes, calendar, wechat | v2 state goals | 根据笔记（Notes）App 的发布清单确认负责人、候选版本和评审地点，并在该地点对应的原会议结束半小时后安排 30 分钟的“发布确认跟进”；备注写清候选版本和地点，提前 30 分钟提醒，同时微信通知清单中的负责人。 |
| `transfer_03` | L4 | wechat, clock, notes | v2 state goals | 从工程师最近的发布消息中找出候选版本和通知截止时间，在截止前 10 分钟设一个一次性闹钟，并在笔记（Notes）App 新建“发布通知准备”记录版本、截止时间和闹钟时间。 |
| `transfer_04` | L4 | daysmatter, calendar, wechat | v2 state goals | 找出 Days Matter 中最早到期且尚未归档的工作事项，提前一周在日历建立同名全天准备日，并把原截止日期和准备日期微信告诉 Mia Wang。 |
| `transfer_05` | L4 | notes, tbsg | v2 state goals | 按笔记（Notes）App 中“Office pantry”列出的缺货补齐独立的淘宝闪购 App 购物车，每种只加一件；不要进入淘宝 App 内的闪购入口，不要加入清单之外的商品，也不要结算或下单。 |
| `transfer_06` | L4 | clock, notes | v2 state goals | 找出时钟里时间最早的已关闭闹钟，重新启用它，并在笔记（Notes）App 创建一条未完成待办，文字格式为“<闹钟原标签> <HH:MM>”。不要改动其他闹钟。 |
| `transfer_07` | L4 | notes, calendar | v2 state goals | 核对笔记（Notes）App 发布清单中的评审地点与日历里的对应会议；一致时把该会议改为提前 30 分钟提醒，并在 Notes 创建未完成待办“Project Atlas review - <已核实地点> 已核实”。若不一致则不要改日历，只记录冲突。 |
| `transfer_08` | L4 | daysmatter, calendar, wechat | v2 state goals | 查看 Days Matter 里 Mia 的生日，在生日一周前晚上七点安排 30 分钟的“准备 Mia 生日礼物”，提前一天提醒，并微信把准备日期告诉 Alice Chen。 |
| `transfer_09` | L4 | notes, calendar, wechat | v2 state goals | 把笔记（Notes）App 的供应商通话记录里的备用联系方式按“Backup phone: <号码>”追加到匹配的视频会议日程原说明末尾，保留其他设置；随后把会议代码和备用联系方式微信发给 Engineer Chen。 |
| `transfer_10` | L4 | wechat, notes | v2 state goals | 交叉核对工程师最近的发布消息和笔记（Notes）App 中的发布清单；若候选版本一致，就新建“候选版本已核对”笔记，写明版本、负责人和评审地点，并发一条包含同样三项信息的纯文字朋友圈。 |

## Candidate Tool Coverage

| Tool | Tasks |
| --- | ---: |
| `calendar__get_busy_intervals` | 15 |
| `calendar__open_date` | 15 |
| `calendar__open_event` | 15 |
| `calendar__prepare_event_draft` | 15 |
| `calendar__search_events` | 15 |
| `clock__add_world_city` | 7 |
| `clock__create_alarm` | 7 |
| `clock__get_next_alarm` | 7 |
| `clock__get_world_times` | 7 |
| `clock__list_alarms` | 7 |
| `clock__open_alarms` | 7 |
| `clock__open_timer` | 7 |
| `clock__search_world_cities` | 7 |
| `clock__set_alarm_enabled` | 7 |
| `daysmatter__archive_event` | 2 |
| `daysmatter__calculate_date_difference` | 2 |
| `daysmatter__get_event_countdown` | 2 |
| `daysmatter__list_notebooks` | 2 |
| `daysmatter__list_upcoming_events` | 2 |
| `daysmatter__open_event` | 2 |
| `daysmatter__open_notebook` | 2 |
| `daysmatter__prepare_event_draft` | 2 |
| `daysmatter__search_events` | 2 |
| `notes__create_note` | 22 |
| `notes__create_todo` | 22 |
| `notes__list_folders` | 22 |
| `notes__list_recent_notes` | 22 |
| `notes__open_folder` | 22 |
| `notes__open_note` | 22 |
| `notes__open_todos` | 22 |
| `notes__search_notes` | 22 |
| `notes__search_todos` | 22 |
| `notes__set_todo_completed` | 22 |
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
| `wechat__get_message_context` | 36 |
| `wechat__list_recent_chats` | 36 |
| `wechat__open_chat` | 36 |
| `wechat__open_chat_search` | 36 |
| `wechat__open_contact` | 36 |
| `wechat__open_moments` | 36 |
| `wechat__prepare_moment_draft` | 36 |
| `wechat__search_contacts` | 36 |
| `wechat__search_messages` | 36 |
| `wechat__send_text_message` | 36 |
