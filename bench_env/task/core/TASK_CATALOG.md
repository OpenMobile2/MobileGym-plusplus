# Hybrid Tools V1 Task Catalog

This file is generated from `specs.py`; the Python records are authoritative.

- Fixed tasks: 90
- Tasks with a GUI-only stage: 51
- Distinct candidate App Tools: 53
- All tasks start from the launcher and are also solvable through pure GUI interaction.

## Calendar

| Dataset ID | Runner task ID | GUI required | Instruction |
| --- | --- | ---: | --- |
| `cal_01` | `core.HTV1Cal01` | yes | Find the Project Atlas review in Calendar, read its location, then create an event on July 14, 2026 from 18:30 to 19:00 titled 'Organize Atlas review minutes'. Put 'Original location: Cedar Room' in the description, enable the alarm, set a 30-minute reminder, and save it. |
| `cal_02` | `core.HTV1Cal02` | yes | In Calendar, locate the Vendor sync event and use its meeting code to create a follow-up on July 15, 2026 from 11:30 to 12:00. Title it 'Vendor action review', include 'V-4821' in the description, set a 15-minute reminder with alarm enabled, and save. |
| `cal_03` | `core.HTV1Cal03` | yes | In Calendar, find the Design critique event, then create 'Design critique follow-up' on July 16, 2026 from 18:00 to 18:30. Mention Maple Room in the description, use a 30-minute reminder, enable its alarm, and save it. |
| `cal_04` | `core.HTV1Cal04` | yes | Check Calendar's busy intervals on July 14, 2026 between 13:00 and 17:00. Schedule 'Atlas decision log' in the free slot from 15:30 to 16:00, set a 15-minute reminder with alarm enabled, and save. |
| `cal_05` | `core.HTV1Cal05` | yes | In Calendar, check whether July 15, 2026 from 14:00 to 15:00 is free, then create 'Vendor document review' in that slot with a 30-minute reminder and alarm enabled. |
| `cal_06` | `core.HTV1Cal06` | yes | Open Calendar on July 17, 2026 and create 'Weekly planning' from 09:00 to 09:45 with a 5-minute reminder and alarm enabled. |
| `cal_07` | `core.HTV1Cal07` | yes | Open July 18, 2026 in Calendar and add an all-day event titled 'Team offsite'. Save the event without an alarm. |
| `cal_08` | `core.HTV1Cal08` | yes | In Calendar, create 'Release readiness check' on July 19, 2026 from 17:00 to 17:30. Add the description 'Confirm RC-204', enable the alarm, choose a 60-minute reminder, and save. |
| `cal_09` | `core.HTV1Cal09` | yes | In Calendar, find Project Atlas review and edit it so its alarm is enabled and its reminder is 30 minutes before the event. |
| `cal_10` | `core.HTV1Cal10` | yes | In Calendar, find Design critique and change its title to 'Design critique - final', keeping the rest of the event intact. |
| `cal_11` | `core.HTV1Cal11` | yes | In Calendar, find the event titled Project Atlas review, open its details, and answer with the meeting location only. |
| `cal_12` | `core.HTV1Cal12` | yes | In Calendar, find the Vendor sync event, inspect its details, and answer with the video room code only. |

## WeChat

| Dataset ID | Runner task ID | GUI required | Instruction |
| --- | --- | ---: | --- |
| `wx_01` | `core.HTV1Wx01` | no | Search WeChat for the message containing the Atlas handoff code and send that code to Mia Wang. |
| `wx_02` | `core.HTV1Wx02` | no | Find the vendor meeting code in Mia Wang's WeChat messages and send it to Engineer Chen with the prefix 'Vendor code:'. |
| `wx_03` | `core.HTV1Wx03` | no | In WeChat, find the release candidate identifier in Engineer Chen's recent messages and send Alice Chen the message 'Release candidate <identifier> passed smoke testing'. |
| `wx_04` | `core.HTV1Wx04` | no | Read the context around the WeChat message about the backup contact and send Boss a message containing both the vendor meeting code and backup phone number. |
| `wx_05` | `core.HTV1Wx05` | yes | Find Alice Chen in WeChat, open her profile, and mark her as a starred contact. |
| `wx_06` | `core.HTV1Wx06` | yes | Find Mia Wang in WeChat, open her profile, and change her friend permission to Chat Only. |
| `wx_07` | `core.HTV1Wx07` | yes | Open the WeChat chat with Engineer Chen and mute notifications for that conversation. |
| `wx_08` | `core.HTV1Wx08` | yes | Open Alice Chen's WeChat conversation and pin it to the top of the chat list. |
| `wx_09` | `core.HTV1Wx09` | yes | Post a text-only WeChat Moment saying 'Atlas review complete - action items assigned.' Set the location to 北京国科大国际会议中心 and publish it. |
| `wx_10` | `core.HTV1Wx10` | yes | Publish a text-only WeChat Moment that says 'RC-204 passed smoke testing.' Do not attach images. |
| `wx_11` | `core.HTV1Wx11` | yes | In WeChat, find the message about the vendor meeting code, then publish a text Moment saying 'Vendor sync confirmed: V-4821'. |
| `wx_12` | `core.HTV1Wx12` | no | Use WeChat's recent conversations to determine which of Alice Chen, Mia Wang, and Engineer Chen has the most recent seeded message, then answer with that contact's name. |

## Taobao Instant

| Dataset ID | Runner task ID | GUI required | Instruction |
| --- | --- | ---: | --- |
| `tb_01` | `core.HTV1Tb01` | no | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, find 烟台红富士苹果5斤 and add two bags to the cart. |
| `tb_02` | `core.HTV1Tb02` | yes | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, find 每日鲜语4.0鲜牛奶250ml from 卢森便利店, add one to the cart, open the cart, and make sure that line is selected. |
| `tb_03` | `core.HTV1Tb03` | no | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, find 招牌老母鸡汤套餐 at 乡味鸡 and add one large, mildly spicy portion with an extra fried egg to the cart. |
| `tb_04` | `core.HTV1Tb04` | no | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, find 周期鲜花·随机混搭 at 花语觅花艺 and add one gift-box package with a blank greeting card to the cart. |
| `tb_05` | `core.HTV1Tb05` | yes | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, add one 冷萃罐装咖啡 from 卢森便利店 to the cart, prepare a delivery checkout, and set the order remark to 'Call on arrival'. Do not place or pay for the order. |
| `tb_06` | `core.HTV1Tb06` | no | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, add one 每日鲜语4.0鲜牛奶250ml from 卢森便利店 and prepare the order for pickup. Leave it on the checkout screen without paying. |
| `tb_07` | `core.HTV1Tb07` | yes | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, add one standard, non-spicy 招牌老母鸡汤套餐 from 乡味鸡, prepare delivery checkout, and request tableware according to the meal quantity. Do not submit payment. |
| `tb_08` | `core.HTV1Tb08` | yes | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, add one 每日鲜语4.0鲜牛奶250ml from 卢森便利店, prepare a delivery checkout, and choose the first available scheduled delivery slot. Stop before placing or paying for the order. |
| `tb_09` | `core.HTV1Tb09` | yes | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, find delivered order o1001, open it, and message the rider: 'Please leave future orders at the front desk'. |
| `tb_10` | `core.HTV1Tb10` | yes | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, find order o1002, open its shop, and message the shop: 'Please include a care card next time'. |
| `tb_11` | `core.HTV1Tb11` | yes | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, find Huayu flower shop, open it, and add the shop to favorites. |
| `tb_12` | `core.HTV1Tb12` | no | In the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, look up order o1005 and answer with its current order status. |

## Days Matter

| Dataset ID | Runner task ID | GUI required | Instruction |
| --- | --- | ---: | --- |
| `dm_01` | `core.HTV1Dm01` | yes | Find Contract renewal in Days Matter, open it, and pin it. |
| `dm_02` | `core.HTV1Dm02` | yes | In Days Matter, find Contract renewal and change its recurring reminder to weekly. |
| `dm_03` | `core.HTV1Dm03` | no | Find Contract renewal in Days Matter and archive it. |
| `dm_04` | `core.HTV1Dm04` | yes | Create a Days Matter event titled 'Atlas retrospective' for October 1, 2026 in the Work notebook. Pin it, show it on the home page, set a monthly reminder, and save. |
| `dm_05` | `core.HTV1Dm05` | yes | Open the Work notebook in Days Matter and add 'Security review deadline' for October 8, 2026 with a weekly reminder. |
| `dm_06` | `core.HTV1Dm06` | no | List upcoming Days Matter events and answer with the title of the earliest one among Contract renewal, Atlas public launch, and Mia birthday. |
| `dm_07` | `core.HTV1Dm07` | no | In Days Matter, inspect the countdown for Atlas public launch and answer whether it is a future, today, or past event. |
| `dm_08` | `core.HTV1Dm08` | no | Use Days Matter's notebook list to determine which notebook contains Atlas public launch, then answer with that notebook's name. |
| `dm_09` | `core.HTV1Dm09` | yes | In Days Matter, find Atlas public launch, open it, and turn off 'Show on Home'. |
| `dm_10` | `core.HTV1Dm10` | no | Use Days Matter's date calculator to find the number of days from July 14, 2026 to July 20, 2026 without including the start date, and answer with the number only. |
| `dm_11` | `core.HTV1Dm11` | yes | Create 'Annual compliance renewal' in Days Matter for December 5, 2026, set it to repeat yearly with a yearly reminder, and save it in the Work notebook. |
| `dm_12` | `core.HTV1Dm12` | no | In Days Matter, open the Work notebook, find Contract renewal, and archive it. |

## Clock

| Dataset ID | Runner task ID | GUI required | Instruction |
| --- | --- | ---: | --- |
| `clk_01` | `core.HTV1Clk01` | yes | Find the 09:15 Daily standup alarm and change its label to 'Atlas daily standup'. |
| `clk_02` | `core.HTV1Clk02` | yes | Find the 09:40 Vendor prep alarm, change it to repeat on workdays, and enable it. |
| `clk_03` | `core.HTV1Clk03` | no | Disable the enabled 17:30 Release check alarm. |
| `clk_04` | `core.HTV1Clk04` | no | Create an enabled alarm for 18:00 labeled 'Send Atlas update', repeating on workdays with vibration enabled. |
| `clk_05` | `core.HTV1Clk05` | no | Check the next enabled alarm and answer with its label. |
| `clk_06` | `core.HTV1Clk06` | no | Search the world clock city catalog for 东京 (Tokyo) and add it to World Clock. |
| `clk_07` | `core.HTV1Clk07` | no | Search for 悉尼 (Sydney) in World Clock and add it to the selected cities. |
| `clk_08` | `core.HTV1Clk08` | no | Add 东京 (Tokyo) to World Clock, then read the current times for Tokyo and 伦敦 (London). Finish after both cities are visible in World Clock. |
| `clk_09` | `core.HTV1Clk09` | yes | Open the alarm list and delete the disabled 09:40 Vendor prep alarm. |
| `clk_10` | `core.HTV1Clk10` | no | Open the Timer screen in Clock and leave the app on that screen. |
| `clk_11` | `core.HTV1Clk11` | no | Create an enabled one-time alarm for 19:20 labeled 'Review vendor notes' with vibration disabled. |
| `clk_12` | `core.HTV1Clk12` | yes | Read the world times for currently selected cities, then remove New York from World Clock using the app interface. |

## Notes

| Dataset ID | Runner task ID | GUI required | Instruction |
| --- | --- | ---: | --- |
| `note_01` | `core.HTV1Note01` | yes | Find the note titled Atlas release checklist, open it, and append a new line: 'Status: ready for release'. |
| `note_02` | `core.HTV1Note02` | yes | Find Vendor call notes and append 'Follow-up owner: Mia' to the note. |
| `note_03` | `core.HTV1Note03` | yes | Open the most recent note named Atlas release checklist and pin it. |
| `note_04` | `core.HTV1Note04` | no | List Notes folders, open Unfiled, and create a note titled 'Atlas handoff' containing 'Owner: Alice Chen' and 'Code: ATLAS-731'. |
| `note_05` | `core.HTV1Note05` | no | Create a note titled 'Vendor access' with the content 'Room code: V-4821' in Notes. |
| `note_06` | `core.HTV1Note06` | no | Find the to-do 'Organize Atlas review minutes' and mark it completed. |
| `note_07` | `core.HTV1Note07` | no | Create a new to-do in Notes: 'Send Atlas status to Boss'. |
| `note_08` | `core.HTV1Note08` | no | Open the Notes to-do list, find 'Confirm vendor meeting', and mark it completed. |
| `note_09` | `core.HTV1Note09` | no | Search Notes for the vendor meeting code and answer with the code only. |
| `note_10` | `core.HTV1Note10` | no | List recent Notes and answer with the title of the most recently updated seeded Atlas note. |
| `note_11` | `core.HTV1Note11` | no | Find the incomplete to-do about Atlas review minutes and create a note titled 'Review follow-up' containing that to-do text. |
| `note_12` | `core.HTV1Note12` | no | Find the completed to-do 'Archive old launch files' and mark it incomplete again. |

## Cross App

| Dataset ID | Runner task ID | GUI required | Instruction |
| --- | --- | ---: | --- |
| `cross_01` | `core.HTV1Cross01` | yes | Find the Project Atlas review in Calendar and read its location. Create 'Organize Atlas review minutes' on the same date from 18:30 to 19:00 with a 30-minute reminder and alarm enabled, then send Alice Chen a WeChat message containing the original location and the new event time. |
| `cross_02` | `core.HTV1Cross02` | yes | Find the Vendor sync event in Calendar, read its code, and create a Notes entry titled 'Vendor sync access' containing the event date, meeting code, and owner Mia. |
| `cross_03` | `core.HTV1Cross03` | yes | Find Alice Chen's WeChat message containing the Atlas handoff code. Create a Calendar event titled 'Atlas handoff checkpoint' on July 20, 2026 from 10:00 to 10:30, include the code in the description, enable the alarm, and set a 15-minute reminder. |
| `cross_04` | `core.HTV1Cross04` | no | Find the release candidate identifier in Engineer Chen's WeChat messages and create a note titled 'Smoke test result' containing the identifier and the words 'passed smoke testing'. |
| `cross_05` | `core.HTV1Cross05` | yes | Read the Atlas release checklist note and send Boss a WeChat summary containing the owner, build identifier, and review room. |
| `cross_06` | `core.HTV1Cross06` | yes | Read Vendor call notes and create a Calendar event titled 'Call vendor backup' on July 21, 2026 from 15:00 to 15:20. Put the backup phone number in the description and set a 5-minute reminder with alarm enabled. |
| `cross_07` | `core.HTV1Cross07` | no | Find the Atlas public launch countdown in Days Matter and send Alice Chen a WeChat message containing the event title and target date September 15, 2026. |
| `cross_08` | `core.HTV1Cross08` | yes | Find Contract renewal in Days Matter and create a Calendar event titled 'Contract renewal review' on August 20, 2026 from 09:00 to 09:30 with a 30-minute reminder and alarm enabled. |
| `cross_09` | `core.HTV1Cross09` | no | Find Mia birthday in Days Matter and create a note titled 'Mia birthday plan' containing its date November 8 and the reminder type. |
| `cross_10` | `core.HTV1Cross10` | no | Find the enabled alarm labeled Release check and send Engineer Chen a WeChat message containing its time and label. |
| `cross_11` | `core.HTV1Cross11` | no | Read the next enabled alarm in Clock and create a note titled 'Next alarm' containing the returned time and label. |
| `cross_12` | `core.HTV1Cross12` | yes | Create an enabled 08:45 workday alarm labeled 'Contract review', then create a Calendar event titled 'Contract review' on August 20, 2026 from 09:00 to 09:30 with a 15-minute reminder and alarm enabled. |
| `cross_13` | `core.HTV1Cross13` | yes | In the regular Taobao app, find the cheapest item sold by 蓝鲸数码旗舰店. Create a note titled 'Blue Whale price check' containing the item name and price. |
| `cross_14` | `core.HTV1Cross14` | yes | In the regular Taobao app, find the price of 清风山 山雾香氛护手霜 75mL. Send Alice Chen a WeChat message containing the product name and its price. |
| `cross_15` | `core.HTV1Cross15` | yes | Read the Office pantry note. Then, in the standalone 淘宝闪购 (Taobao Instant) app, not the regular Taobao app, add one 烟台红富士苹果5斤, one 每日鲜语4.0鲜牛奶250ml from 卢森便利店, and one 冷萃罐装咖啡 from the same shop to the cart. |
| `cross_16` | `core.HTV1Cross16` | yes | Find Atlas public launch in Days Matter and create a matching all-day Calendar event titled 'Atlas public launch' on September 15, 2026 without an alarm. |
| `cross_17` | `core.HTV1Cross17` | no | Find Engineer Chen's WeChat request to notify the team before 18:00, then create an enabled one-time alarm for 17:50 labeled 'Notify release team'. |
| `cross_18` | `core.HTV1Cross18` | yes | Find Mia Wang's vendor meeting message in WeChat and create a Days Matter event titled 'Vendor sync V-4821' for July 15, 2026 in the Work notebook with a weekly reminder. |

## Candidate Tool Coverage

| Tool | Eligible tasks |
| --- | ---: |
| `calendar__get_busy_intervals` | 2 |
| `calendar__open_date` | 2 |
| `calendar__open_event` | 9 |
| `calendar__prepare_event_draft` | 14 |
| `calendar__search_events` | 9 |
| `clock__add_world_city` | 3 |
| `clock__create_alarm` | 4 |
| `clock__get_next_alarm` | 2 |
| `clock__get_world_times` | 2 |
| `clock__list_alarms` | 5 |
| `clock__open_alarms` | 4 |
| `clock__open_timer` | 1 |
| `clock__search_world_cities` | 3 |
| `clock__set_alarm_enabled` | 2 |
| `daysmatter__archive_event` | 2 |
| `daysmatter__calculate_date_difference` | 1 |
| `daysmatter__get_event_countdown` | 5 |
| `daysmatter__list_notebooks` | 6 |
| `daysmatter__list_upcoming_events` | 1 |
| `daysmatter__open_event` | 3 |
| `daysmatter__open_notebook` | 2 |
| `daysmatter__prepare_event_draft` | 4 |
| `daysmatter__search_events` | 11 |
| `notes__create_note` | 8 |
| `notes__create_todo` | 1 |
| `notes__list_folders` | 1 |
| `notes__list_recent_notes` | 2 |
| `notes__open_folder` | 1 |
| `notes__open_note` | 7 |
| `notes__open_todos` | 2 |
| `notes__search_notes` | 6 |
| `notes__search_todos` | 4 |
| `notes__set_todo_completed` | 3 |
| `tbsg__add_item_to_cart` | 9 |
| `tbsg__get_cart` | 2 |
| `tbsg__get_shop_menu` | 3 |
| `tbsg__list_orders` | 3 |
| `tbsg__open_cart` | 2 |
| `tbsg__open_order` | 3 |
| `tbsg__open_shop` | 3 |
| `tbsg__prepare_checkout` | 4 |
| `tbsg__search_items` | 8 |
| `tbsg__search_shops` | 2 |
| `wechat__get_message_context` | 7 |
| `wechat__list_recent_chats` | 2 |
| `wechat__open_chat` | 2 |
| `wechat__open_chat_search` | 1 |
| `wechat__open_contact` | 2 |
| `wechat__open_moments` | 3 |
| `wechat__prepare_moment_draft` | 3 |
| `wechat__search_contacts` | 9 |
| `wechat__search_messages` | 9 |
| `wechat__send_text_message` | 9 |
