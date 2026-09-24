"""Ctrip hybrid GUI+Tools tasks (services, tool-boundary probe).

Four categories probing ``app_tools/apps/ctrip`` specifically (see
``services/__init__.py`` for the suite-level rationale):

- ``idinhand`` (2 tasks): the agent must resolve a hotel by a name/price fact it
  picked up from ``list_orders``/the Orders GUI (a non-search source), not by
  searching a name it already remembers. Caveat (see the report back to the
  user): ``CtripOrder`` has no ``hotel_id`` field, so a *pure* ID-only path
  (order -> hotel_id -> ``get_hotel_summary`` with zero name lookup) is not
  literally possible with the current tool/data shape -- these two tasks get as
  close as the data allows (order-derived exact name/price, then a precise
  resolve + verify step, with decoys that share a price or a similarly-worded
  address with the real target).
- ``field_mismatch`` (5 tasks): ``search_hotels``/``get_hotel_summary`` only
  expose ``starting_price``/``room_price_min`` (aggregates), never a specific
  room type's price or its remaining-count; ``search_attractions`` only
  exposes ``ticket_price_min`` (not a named ticket type); ``search_trains``
  never exposes ``stops`` at all. Each task asks for exactly the sub-item the
  tool cannot give, mirroring (but not reusing) ``ctrip_08_disney_yuyuan_diff``.
- ``query_scan_mismatch`` (5 tasks): ``search_hotels``/``search_trains``/
  ``search_flights``/``search_attractions`` all require a non-empty ``query``
  and cannot list an entire catalog in one call; each task requires a
  full-catalog numeric-range scan that no single keyword cleanly captures.
- ``state_direct``: intentionally 0 tasks. Every Ctrip tool is read-only or
  navigation-only (no ``prepare_xxx_draft``-style write tool exists), so this
  axis cannot be instantiated for this app. Per the task brief this was
  compensated by adding extra ``field_mismatch``/``query_scan_mismatch`` tasks
  instead (5 each here, vs. the ">=2" floor).
"""

from __future__ import annotations

from bench_env.task.tasklib.base import build_task_classes, goal, spec

NOTES_CHANGES = ["notes.notes"]

SPECS = [
    # ---------------------------------------------------------------- idinhand
    spec(
        "ctrip_v4_01_hotel_order_idinhand",
        "打开携程「我的订单」，找到状态为「待支付」的那笔酒店订单，记下订单里的酒店名称与订单价格。"
        "再核实这家民宿当前的评分是否有4.5分以上、目前的挂牌起价是多少。"
        "在笔记中新建标题为「待付订单核实」的笔记，记录：民宿名称、订单价格、当前评分、当前起价。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="待付订单核实",
            contains=["泉汐", "370", "4.6"],
            not_contains=["青禾酒店(上海虹桥枢纽店)", "368"],
        )],
        NOTES_CHANGES,
        ["ctrip__list_orders", "ctrip__open_orders", "ctrip__search_hotels", "ctrip__get_hotel_summary"],
        tags=("idinhand",),
    ),
    spec(
        "ctrip_v4_02_changchun_order_idinhand",
        "打开携程「我的订单」，找到状态为「已完成」的那笔酒店订单，记下订单里的酒店名称与订单价格。"
        "再搜索「长春」目前在售的酒店，确认订单里这家酒店的名字能不能在当前长春的搜索结果里原样找到，"
        "并记录当前长春评分最高的一家酒店的名称、评分与价格。"
        "在笔记中新建标题为「长春订单核对」的笔记，记录：①订单里的酒店名称与订单价格，"
        "②当前长春评分最高的那家酒店的名称、评分与价格。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="长春订单核对",
            contains=["云栖酒店", "246", "长春香麓大酒店", "4.8", "780"],
            not_contains=["逸途酒店", "成都九眼桥"],
        )],
        NOTES_CHANGES,
        ["ctrip__list_orders", "ctrip__open_orders", "ctrip__search_hotels"],
        tags=("idinhand",),
        max_steps=50,
    ),

    # ----------------------------------------------------------- field_mismatch
    spec(
        "ctrip_v4_03_chongqing_deluxe_room_price",
        "查一下携程重庆解放碑云栖酒店的「豪华套房-含双早」这个具体房型多少钱一晚——不是酒店主页展示的起价，"
        "是这个房型自己的价格。在笔记中新建标题为「豪华套房核实」的笔记，记录酒店名称与该房型的价格。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="豪华套房核实",
            contains=["重庆解放碑云栖酒店", "豪华套房", "469"],
            not_contains=["389", "城景大床房"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_hotels", "ctrip__get_hotel_summary", "ctrip__open_hotel"],
        tags=("field_mismatch",),
    ),
    spec(
        "ctrip_v4_04_haichang_senior_ticket",
        "我父母年满55周岁，打算去携程上的上海海昌海洋公园玩，请查一下「1日票老人票(55周岁以上)」这个具体票种"
        "多少钱——不是普通成人票价格。在笔记中新建标题为「海昌老人票核实」的笔记，记录票价。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="海昌老人票核实",
            contains=["上海海昌海洋公园", "老人票", "230"],
            not_contains=["199"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_attractions"],
        tags=("field_mismatch",),
    ),
    spec(
        "ctrip_v4_05_g986_train_stop_arrival",
        "查看携程G986次列车（上海到潍坊方向）的经停站信息，找出这趟车到达「南京南」站的具体时间"
        "（不是从上海出发或到达潍坊的时间，是经停南京南这一站的到站时间）。"
        "在笔记中新建标题为「南京南到站时间」的笔记，记录车次号与到达南京南的时间。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="南京南到站时间",
            contains=["G986", "南京南", "08:26"],
            not_contains=["08:28"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_trains"],
        tags=("field_mismatch", "no_tool_gui_fallback"),
    ),
    spec(
        "ctrip_v4_06_sanya_family_room_price",
        "查一下携程三亚海棠湾开维假日酒店的「家庭亲子房-亲子」这个具体房型多少钱一晚——不是酒店主页展示的起价。"
        "在笔记中新建标题为「亲子房价格核实」的笔记，记录酒店名称与该房型的价格。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="亲子房价格核实",
            contains=["三亚海棠湾开维假日酒店", "家庭亲子房", "870"],
            not_contains=["680", "无早特惠大床"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_hotels", "ctrip__get_hotel_summary", "ctrip__open_hotel"],
        tags=("field_mismatch",),
    ),
    spec(
        "ctrip_v4_07_dahua_suite_remaining",
        "查一下携程杭州西湖湖光饭店的「豪华套房-含双早」这个房型现在还剩几间可订，以及这个房型的价格。"
        "在笔记中新建标题为「湖光饭店套房库存」的笔记，记录酒店名称、房型价格与剩余间数。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="湖光饭店套房库存",
            contains=["杭州西湖湖光饭店", "豪华套房", "968", "2间"],
            not_contains=["848", "无早特惠大床"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_hotels", "ctrip__get_hotel_summary", "ctrip__open_hotel"],
        tags=("field_mismatch", "no_tool_gui_fallback"),
    ),

    # ------------------------------------------------------- query_scan_mismatch
    spec(
        "ctrip_v4_08_hotel_scan_cheap_highscore",
        "在携程**全部**酒店中（不限定城市，也不给候选名单，需要你自己从全部酒店里筛选），"
        "找出同时满足『价格低于300元』且『评分不低于4.7』这两个条件的所有酒店。"
        "在笔记中新建标题为「高性价比酒店筛选」的笔记，记录每一家符合条件酒店的名称、所在城市、价格与评分。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="高性价比酒店筛选",
            contains=["观海栖宿", "连云港", "111", "5", "逸途酒店", "成都", "246", "4.7"],
            not_contains=["锦程客栈(成都宽窄巷子店)", "如家酒店(重庆洪崖洞店)", "三亚天涯海角快捷酒店", "如家酒店(北京南锣鼓巷店)", "青禾酒店(长春净月潭店)"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_hotels"],
        tags=("query_scan_mismatch",),
        max_steps=55,
    ),
    spec(
        "ctrip_v4_09_train_scan_cheap_secondclass",
        "在携程**全部**列车中（不限定出发/到达城市，需要你自己从全部车次里筛选），"
        "找出二等座价格低于100元的所有车次。在笔记中新建标题为「全网低价二等座」的笔记，"
        "记录每个符合条件车次的车次号、起止站与二等座价格（注意：有两趟车都叫G7501，"
        "分别开往不同的目的地、价格也不同，要看清楚具体是哪一趟）。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="全网低价二等座",
            contains=["G7301", "73", "G7305", "G7065", "G7501", "苏州", "39"],
            not_contains=["530", "144", "154"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_trains"],
        tags=("query_scan_mismatch",),
        max_steps=55,
    ),
    spec(
        "ctrip_v4_10_flight_scan_cheap",
        "在携程**全部**航班中（不限定航线，需要你自己从全部航班里筛选），"
        "找出价格低于600元的所有航班。在笔记中新建标题为「平价航班筛选」的笔记，"
        "记录每个符合条件航班的航班号、航空公司与价格。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="平价航班筛选",
            contains=["3U8899", "390", "四川航空", "HU7605", "560", "海南航空"],
            not_contains=["610", "东方航空", "MU2890"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_flights"],
        tags=("query_scan_mismatch",),
        max_steps=50,
    ),
    spec(
        "ctrip_v4_11_hotel_scan_expensive_highscore",
        "在携程**全部**酒店中（不限定城市，需要你自己从全部酒店里筛选），"
        "找出价格超过900元的所有酒店。在笔记中新建标题为「高价酒店筛选」的笔记，"
        "记录每一家符合条件酒店的名称、价格与评分。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="高价酒店筛选",
            contains=["重庆解放碑威斯汀酒店", "960", "4.9", "北京王府井希尔顿酒店", "1100", "4.8"],
            not_contains=["杭州西湖湖光饭店", "888", "上海外滩望江大酒店", "880"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_hotels"],
        tags=("query_scan_mismatch",),
        max_steps=55,
    ),
    spec(
        "ctrip_v4_12_attraction_scan_reviewcount",
        "在携程**全部**景点中（不限定城市，需要你自己从全部景点里筛选），"
        "找出点评数超过10万条的所有景点。在笔记中新建标题为「高热度景点筛选」的笔记，"
        "记录每个符合条件景点的名称、所在城市与点评数。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="高热度景点筛选",
            contains=["上海迪士尼度假区", "30.5万", "东方明珠", "17.7万", "净月潭国家森林公园", "长春", "30.5万"],
            not_contains=["上海海昌海洋公园", "5.5万", "豫园", "5.4万"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_attractions"],
        tags=("query_scan_mismatch",),
        max_steps=50,
    ),
]

SPECS = [item for item in SPECS if item.task_id != "ctrip_v4_09_train_scan_cheap_secondclass"]

build_task_classes(SPECS, None, module_globals=globals(), module_name=__name__)
