"""Frozen App Tool names used only for V3 coverage metadata."""

APP_TOOLS: dict[str, tuple[str, ...]] = {
    "alipay": (
        "alipay__get_balance_summary", "alipay__get_bill_summary",
        "alipay__list_bank_cards", "alipay__list_conversations",
        "alipay__open_bill", "alipay__open_bills", "alipay__open_contact",
        "alipay__open_scan", "alipay__prepare_transfer", "alipay__search_bills",
        "alipay__search_contacts", "alipay__send_chat_message",
        "alipay__summarize_bills",
    ),
    "bilibili": (
        "bilibili__add_video_to_folder", "bilibili__follow_author",
        "bilibili__get_ranking", "bilibili__get_video_summary",
        "bilibili__get_video_tags", "bilibili__list_favorite_folders",
        "bilibili__open_author", "bilibili__open_ranking",
        "bilibili__open_search", "bilibili__open_video",
        "bilibili__search_authors", "bilibili__search_videos",
    ),
    "calendar": (
        "calendar__get_busy_intervals", "calendar__open_date",
        "calendar__open_event", "calendar__prepare_event_draft",
        "calendar__search_events",
    ),
    "clock": (
        "clock__add_world_city", "clock__create_alarm", "clock__get_next_alarm",
        "clock__get_world_times", "clock__list_alarms", "clock__open_alarms",
        "clock__open_timer", "clock__search_world_cities",
        "clock__set_alarm_enabled",
    ),
    "daysmatter": (
        "daysmatter__archive_event", "daysmatter__calculate_date_difference",
        "daysmatter__get_event_countdown", "daysmatter__list_notebooks",
        "daysmatter__list_upcoming_events", "daysmatter__open_event",
        "daysmatter__open_notebook", "daysmatter__prepare_event_draft",
        "daysmatter__search_events",
    ),
    "ebay": (
        "ebay__compare_products", "ebay__get_product_summary",
        "ebay__list_recent_searches", "ebay__open_cart", "ebay__open_product",
        "ebay__open_search", "ebay__save_search", "ebay__search_products",
    ),
    "file_manager": (
        "file_manager__copy_file", "file_manager__create_folder",
        "file_manager__get_metadata", "file_manager__list_directory",
        "file_manager__list_recent", "file_manager__open_containing_folder",
        "file_manager__open_path", "file_manager__open_recent",
        "file_manager__read_text", "file_manager__search",
        "file_manager__summarize_storage",
    ),
    "map": (
        "map__compare_places", "map__find_nearby", "map__get_current_location",
        "map__get_navigation_preferences", "map__list_recent_searches",
        "map__open_navigation_settings", "map__open_place",
        "map__open_route_planner", "map__open_search",
        "map__open_search_results", "map__open_settings", "map__save_search",
        "map__search_places", "map__set_route_avoidance",
    ),
    "notes": (
        "notes__create_note", "notes__create_todo", "notes__list_folders",
        "notes__list_recent_notes", "notes__open_folder", "notes__open_note",
        "notes__open_todos", "notes__search_notes", "notes__search_todos",
        "notes__set_todo_completed",
    ),
    "railway12306": (
        "railway12306__get_account_summary", "railway12306__get_order_summary",
        "railway12306__get_train_summary", "railway12306__list_orders",
        "railway12306__list_passengers", "railway12306__open_invoice",
        "railway12306__open_order", "railway12306__open_passengers",
        "railway12306__open_query_form", "railway12306__open_query_results",
        "railway12306__open_train_for_booking", "railway12306__query_trains",
        "railway12306__query_transfer_plans", "railway12306__search_stations",
    ),
    "redbook": (
        "redbook__get_note_summary", "redbook__list_chat_threads",
        "redbook__list_saved_notes", "redbook__open_chat", "redbook__open_note",
        "redbook__open_search", "redbook__open_user",
        "redbook__prepare_text_post", "redbook__search_chat_messages",
        "redbook__search_notes", "redbook__search_users",
    ),
    "reddit": (
        "reddit__get_post_summary", "reddit__join_community",
        "reddit__list_communities", "reddit__list_saved_posts",
        "reddit__open_chat", "reddit__open_post", "reddit__open_search",
        "reddit__search_chat", "reddit__search_posts",
    ),
    "spotify": (
        "spotify__add_to_playlist", "spotify__add_to_queue",
        "spotify__get_track_summary", "spotify__list_liked_songs",
        "spotify__list_playlists", "spotify__list_recent_plays",
        "spotify__open_artist", "spotify__open_playlist", "spotify__open_queue",
        "spotify__open_search", "spotify__search_artists",
        "spotify__search_tracks",
    ),
    "taobao": (
        "taobao__add_to_cart", "taobao__compare_items", "taobao__get_cart",
        "taobao__get_item_summary", "taobao__get_order_summary",
        "taobao__list_coupons", "taobao__list_orders", "taobao__open_cart",
        "taobao__open_item", "taobao__open_search_results",
        "taobao__open_shop", "taobao__prepare_checkout",
        "taobao__search_items", "taobao__search_shops",
    ),
    "tbsg": (
        "tbsg__add_item_to_cart", "tbsg__get_cart", "tbsg__get_shop_menu",
        "tbsg__list_orders", "tbsg__open_cart", "tbsg__open_order",
        "tbsg__open_shop", "tbsg__prepare_checkout", "tbsg__search_items",
        "tbsg__search_shops",
    ),
    "tencent_meeting": (
        "tencent_meeting__calculate_participation",
        "tencent_meeting__get_meeting_summary", "tencent_meeting__list_history",
        "tencent_meeting__list_scheduled", "tencent_meeting__mark_message_read",
        "tencent_meeting__open_history", "tencent_meeting__open_join_form",
        "tencent_meeting__open_meeting", "tencent_meeting__prepare_schedule",
        "tencent_meeting__search_contacts", "tencent_meeting__search_meetings",
    ),
    "weather": (
        "weather__add_saved_city", "weather__find_days_by_condition",
        "weather__get_air_quality", "weather__get_current_weather",
        "weather__get_daily_forecast", "weather__list_saved_cities",
        "weather__open_air_quality", "weather__open_city",
        "weather__open_daily_forecast", "weather__search_cities",
    ),
    "wechat": (
        "wechat__get_message_context", "wechat__list_recent_chats",
        "wechat__open_chat", "wechat__open_chat_search", "wechat__open_contact",
        "wechat__open_moments", "wechat__prepare_moment_draft",
        "wechat__search_contacts", "wechat__search_messages",
        "wechat__send_text_message",
    ),
    "wechat_reading": (
        "wechat_reading__add_to_bookshelf", "wechat_reading__compare_books",
        "wechat_reading__get_book_summary", "wechat_reading__get_hot_search",
        "wechat_reading__get_reading_stats", "wechat_reading__list_bookshelf",
        "wechat_reading__open_book", "wechat_reading__open_bookshelf",
        "wechat_reading__open_reader", "wechat_reading__open_search",
        "wechat_reading__search_books",
    ),
}


def tools_for(apps: list[str] | tuple[str, ...]) -> list[str]:
    return [tool for app in apps for tool in APP_TOOLS.get(app, ())]

