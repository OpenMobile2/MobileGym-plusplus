# MobileGym App Tool Catalog

This catalog records the v1 capability surface implemented by the browser-side App Tool layer.
It is the review checklist for Agent, task, and verifier developers; it is not a model prompt.

All handlers use existing app store actions or normal app routes. No handler calls
`__SIM__.setState()`, reads task ground truth, or performs hidden GUI clicks.

## WeChat (`wechat`, 10 tools)

| Tool | Kind | Contract |
| --- | --- | --- |
| `wechat__search_contacts` | query | Resolve compact recipient candidates by name, alias, ID, or memo. |
| `wechat__list_recent_chats` | query | Return sorted visible conversations and short last-message previews. |
| `wechat__search_messages` | query | Search text snippets globally or in one conversation. |
| `wechat__get_message_context` | query | Return a bounded context window around a search hit. |
| `wechat__open_contact` | navigation | Open the normal friend profile page. |
| `wechat__open_chat` | navigation | Open the normal chat page. |
| `wechat__open_chat_search` | navigation | Open the in-chat search UI. |
| `wechat__open_moments` | navigation | Open Moments without returning feed contents. |
| `wechat__send_text_message` | write | Send one text message through `sendMessage`; no UI navigation. |
| `wechat__prepare_moment_draft` | draft | Prefill a text-only Moment and leave publishing to GUI. |

Not exposed: payments, transfers, red packets, deleting messages, changing privacy,
posting Moments directly, arbitrary media/file access, and task-level contact selection plus sending.

## Taobao Instant (`tbsg`, 10 tools)

| Tool | Kind | Contract |
| --- | --- | --- |
| `tbsg__search_shops` | query | Search compact shop candidates. |
| `tbsg__search_items` | query | Search item candidates across shops. |
| `tbsg__get_shop_menu` | query | Return one compact menu and valid SKU option labels. |
| `tbsg__open_shop` | navigation | Open the delivery or pickup shop GUI. |
| `tbsg__get_cart` | query | Return cart lines grouped by shop without changing selection. |
| `tbsg__add_item_to_cart` | write | Resolve price/SKU from catalog state and call `addToCart`. |
| `tbsg__open_cart` | navigation | Open the normal cart page. |
| `tbsg__list_orders` | query | Return compact order status summaries. |
| `tbsg__open_order` | navigation | Open order detail; sensitive actions stay in GUI. |
| `tbsg__prepare_checkout` | draft | Build normal checkout state and open it without creating an order. |

Not exposed: payment, placing or canceling orders, refund, review, coupon claiming,
address mutation, direct cart deletion, and automatic product choice or checkout optimization.

## Days Matter (`daysmatter`, 9 tools)

| Tool | Kind | Contract |
| --- | --- | --- |
| `daysmatter__search_events` | query | Search active top-level events by title. |
| `daysmatter__list_upcoming_events` | query | Return upcoming events in a bounded horizon. |
| `daysmatter__get_event_countdown` | query | Return current future/today/past count semantics. |
| `daysmatter__list_notebooks` | query | Return notebooks and active event counts. |
| `daysmatter__open_event` | navigation | Open an event detail page. |
| `daysmatter__open_notebook` | navigation | Apply a notebook filter and open home. |
| `daysmatter__calculate_date_difference` | query | Perform the app's date-range calculation. |
| `daysmatter__prepare_event_draft` | draft | Prefill a normal event form without saving. |
| `daysmatter__archive_event` | write | Apply the GUI's reversible archive action. |

Not exposed: delete, notebook mutation, direct event creation/update, widget settings,
account actions, or automatic recurrence/reminder selection.

## Clock (`clock`, 9 tools)

| Tool | Kind | Contract |
| --- | --- | --- |
| `clock__list_alarms` | query | List configured alarms. |
| `clock__get_next_alarm` | query | Resolve the next enabled trigger from simulated time. |
| `clock__create_alarm` | write | Save an enabled alarm and publish it to the alarm manager. |
| `clock__set_alarm_enabled` | write | Idempotently request enabled/disabled state. |
| `clock__open_alarms` | navigation | Open the alarm tab. |
| `clock__search_world_cities` | query | Search available city IDs by city/country/GMT. |
| `clock__get_world_times` | query | Read current city times using simulated device time. |
| `clock__add_world_city` | write | Idempotently add one world-clock city. |
| `clock__open_timer` | navigation | Open timer; duration and start remain GUI operations. |

Not exposed: deleting alarms/cities, editing alarm details, starting/stopping timers or
stopwatch, bulk actions, and arbitrary timezone offsets.

## Notes (`notes`, 10 tools)

| Tool | Kind | Contract |
| --- | --- | --- |
| `notes__search_notes` | query | Search visible note title/content snippets. |
| `notes__list_recent_notes` | query | List recent visible note summaries. |
| `notes__open_note` | navigation | Open a visible note in the normal editor. |
| `notes__list_folders` | query | Return folders and visible note counts. |
| `notes__open_folder` | navigation | Apply a folder filter and open the list. |
| `notes__create_note` | write | Create one note through the editor's `addNote` action. |
| `notes__search_todos` | query | Search to-dos with optional completion filtering. |
| `notes__create_todo` | write | Create one incomplete to-do. |
| `notes__set_todo_completed` | write | Idempotently request completion state. |
| `notes__open_todos` | navigation | Open the to-do tab. |

Private and trashed notes are deliberately outside query/open capabilities. Not exposed:
delete/restore, private-note access, permanent deletion, folder mutation, pin/lock/reminder
changes, bulk operations, or arbitrary note updates.

## Expanded Capability Surface (150 tools)

The following apps were selected from the official 256-task benchmark capability graph.
Names are grouped by contract to keep this review document scannable; each definition in
`apps/<app>/definitions.ts` contains the complete parameter schema and model description.

| App | Query tools | UI and draft tools | Direct writes | Total |
| --- | --- | --- | --- | ---: |
| Map | `search_places`, `find_nearby`, `compare_places`, `get_current_location`, `list_recent_searches`, `get_navigation_preferences` | `open_search`, `open_search_results`, `open_place`, `open_route_planner`, `open_settings`, `open_navigation_settings` | `save_search`, `set_route_avoidance` | 14 |
| Weather | `search_cities`, `get_current_weather`, `get_daily_forecast`, `find_days_by_condition`, `get_air_quality`, `list_saved_cities` | `open_city`, `open_daily_forecast`, `open_air_quality` | `add_saved_city` | 10 |
| Railway 12306 | `search_stations`, `query_trains`, `query_transfer_plans`, `get_train_summary`, `list_orders`, `get_order_summary`, `list_passengers`, `get_account_summary` | `open_query_form` (draft), `open_query_results`, `open_order`, `open_passengers`, `open_train_for_booking`, `open_invoice` | none | 14 |
| Alipay | `search_bills`, `summarize_bills`, `get_bill_summary`, `search_contacts`, `get_balance_summary`, `list_bank_cards`, `list_conversations` | `open_bills`, `open_bill`, `open_contact`, `prepare_transfer` (draft), `open_scan` | `send_chat_message` | 13 |
| File Manager | `search`, `list_directory`, `get_metadata`, `read_text`, `list_recent`, `summarize_storage` | `open_path`, `open_recent`, `open_containing_folder` | `create_folder`, `copy_file` | 11 |
| Tencent Meeting | `search_meetings`, `list_scheduled`, `list_history`, `get_meeting_summary`, `search_contacts`, `calculate_participation` | `open_meeting`, `open_history`, `open_join_form` (draft), `prepare_schedule` (draft) | `mark_message_read` | 11 |
| Bilibili | `search_videos`, `get_ranking`, `get_video_summary`, `get_video_tags`, `search_authors`, `list_favorite_folders` | `open_search`, `open_video`, `open_author`, `open_ranking` | `add_video_to_folder`, `follow_author` | 12 |
| RedBook | `search_notes`, `get_note_summary`, `search_users`, `list_chat_threads`, `search_chat_messages`, `list_saved_notes` | `open_search`, `open_note`, `open_user`, `open_chat`, `prepare_text_post` (draft) | none | 11 |
| WeChat Reading | `search_books`, `get_book_summary`, `get_hot_search`, `list_bookshelf`, `get_reading_stats`, `compare_books` | `open_search`, `open_book`, `open_reader`, `open_bookshelf` | `add_to_bookshelf` | 11 |
| Spotify | `search_tracks`, `search_artists`, `get_track_summary`, `list_liked_songs`, `list_recent_plays`, `list_playlists` | `open_search`, `open_artist`, `open_playlist`, `open_queue` | `add_to_queue`, `add_to_playlist` | 12 |
| eBay | `search_products`, `compare_products`, `get_product_summary`, `list_recent_searches` | `open_search`, `open_product`, `open_cart` | `save_search` | 8 |
| Reddit | `search_posts`, `get_post_summary`, `list_communities`, `list_saved_posts`, `search_chat` | `open_search`, `open_post`, `open_chat` | `join_community` | 9 |
| Taobao | `search_items`, `search_shops`, `get_item_summary`, `compare_items`, `get_cart`, `list_orders`, `get_order_summary`, `list_coupons` | `open_search_results`, `open_item`, `open_shop`, `open_cart`, `prepare_checkout` (draft) | `add_to_cart` | 14 |
| Broadcast (Apple Podcasts) | `search_shows`, `search_episodes`, `get_show_summary`, `get_episode_summary`, `list_up_next` | `open_show`, `open_episode` | `add_to_queue` | 8 |
| Ctrip | `search_hotels`, `get_hotel_summary`, `search_trains`, `search_flights`, `search_attractions`, `list_orders` | `open_hotel`, `open_orders` | none | 8 |
| Luckin | `search_products`, `list_stores`, `list_coupons`, `get_cart` | `open_product`, `open_cart` | `add_to_cart` | 7 |

Sensitive final actions remain deliberately absent: direct payment, transfer confirmation,
ticket purchase, refund, deletion, public publishing, and order creation. The corresponding
tools only query, navigate, or prepare normal GUI state.

## Capability Totals

| App | Query | Navigation | Draft | Direct write | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| WeChat | 4 | 4 | 1 | 1 | 10 |
| Taobao Instant | 5 | 3 | 1 | 1 | 10 |
| Days Matter | 5 | 2 | 1 | 1 | 9 |
| Clock | 4 | 2 | 0 | 3 | 9 |
| Notes | 4 | 3 | 0 | 3 | 10 |
| First expansion | 22 | 14 | 3 | 9 | 48 |
| 13-app expansion | 80 | 49 | 6 | 15 | 150 |
| New App expansion (Broadcast, Ctrip, Luckin) | 15 | 6 | 0 | 2 | 23 |
| **All non-Calendar tools** | **117** | **69** | **9** | **26** | **221** |

Calendar's existing five tools bring the complete environment total to 226.
