"""Ctrip hybrid GUI+Tools tasks (tasklib).

Ctrip's tool surface is query/navigation only (no writes), so most tasks here
naturally skew toward the "no dedicated write tool, GUI still required to
finish" category. Every task's checkable artifact is a Notes entry.
"""

from __future__ import annotations

from bench_env.task.tasklib.base import build_task_classes, goal, spec

NOTES_CHANGES = ["notes.notes"]

SPECS = [
    spec(
        "ctrip_01_hangzhou_hotel_range",
        "比较携程杭州的云栖酒店(杭州西湖湖滨中山北路)、青禾酒店(杭州西湖湖滨解放路店)、杭州西湖湖光饭店三家酒店的价格，找出最贵和最便宜的一家，"
        "在笔记中新建标题为「杭州酒店比价」的笔记，记录两家酒店名称、价格与价格差。",
        ["ctrip", "notes"],
        [goal("notes_note", title="杭州酒店比价", contains=["西湖湖光饭店", "888", "青禾酒店", "310", "578"])],
        NOTES_CHANGES,
        ["ctrip__search_hotels", "ctrip__get_hotel_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "ctrip_02_atour_review_notool",
        "打开携程云栖酒店(杭州西湖湖滨中山北路)详情页，查看用户评价，找到提到「面巾浴巾都是独立包装」的那条评价。"
        "在笔记中新建标题为「云栖评价核实」的笔记，记录该评价的用户名与评价核心内容。",
        ["ctrip", "notes"],
        [goal("notes_note", title="云栖评价核实", contains=["M312128", "独立包装"])],
        NOTES_CHANGES,
        ["ctrip__search_hotels", "ctrip__get_hotel_summary", "ctrip__open_hotel"],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "ctrip_03_cheapest_2nd_class_train",
        "查看携程上海到潍坊（或潍坊北）方向的所有车次，找出二等座价格最便宜的那个车次，"
        "在笔记中新建标题为「省钱车次」的笔记，记录车次号与该车次二等座价格。",
        ["ctrip", "notes"],
        [goal("notes_note", title="省钱车次", contains=["D2922", "480"])],
        NOTES_CHANGES,
        ["ctrip__search_trains"],
        tags=("query",),
    ),
    spec(
        "ctrip_04_priciest_business_train",
        "查看携程上海到潍坊方向所有车次的商务座价格，找出商务座价格最高的那个车次，"
        "在笔记中新建标题为「商务座比价」的笔记，记录车次号与该车次商务座价格。",
        ["ctrip", "notes"],
        [goal("notes_note", title="商务座比价", contains=["G826", "1870"])],
        NOTES_CHANGES,
        ["ctrip__search_trains"],
        tags=("query",),
    ),
    spec(
        "ctrip_05_direct_flight",
        "查看携程上海到潍坊方向的所有航班，找出唯一一个直飞（无中转）的航班，"
        "在笔记中新建标题为「直飞航班」的笔记，记录该航班号、航空公司与价格。",
        ["ctrip", "notes"],
        [goal("notes_note", title="直飞航班", contains=["MU2890", "东方航空", "610"])],
        NOTES_CHANGES,
        ["ctrip__search_flights"],
        tags=("query",),
    ),
    spec(
        "ctrip_06_petfriendly_flight",
        "查看携程上海到潍坊方向的所有航班，找出唯一一个允许携带宠物的航班，"
        "在笔记中新建标题为「宠物出行」的笔记，记录该航班号与价格。",
        ["ctrip", "notes"],
        [goal("notes_note", title="宠物出行", contains=["9C8809", "989"])],
        NOTES_CHANGES,
        ["ctrip__search_flights"],
        tags=("query",),
    ),
    spec(
        "ctrip_07_cheap_attraction_good_score",
        "查看携程上海迪士尼度假区、上海海昌海洋公园、东方明珠、豫园四个景点的门票价格与评分，"
        "找出评分不低于4.7且门票价格最便宜的那个景点，在笔记中新建标题为「性价比景点」的笔记，记录景点名称、评分与成人票价格。",
        ["ctrip", "notes"],
        [goal("notes_note", title="性价比景点", contains=["豫园", "4.7", "30"])],
        NOTES_CHANGES,
        ["ctrip__search_attractions"],
        tags=("browse", "compare"),
    ),
    spec(
        "ctrip_08_disney_yuyuan_diff",
        "查看携程上海迪士尼度假区成人票和豫园成人票的价格，在笔记中新建标题为「门票价格差」的笔记，"
        "记录两个景点名称、各自票价，以及两者的价格差。",
        ["ctrip", "notes"],
        [goal("notes_note", title="门票价格差", contains=["上海迪士尼度假区", "579", "豫园", "30", "549"])],
        NOTES_CHANGES,
        ["ctrip__search_attractions"],
        tags=("browse", "compare"),
    ),
    spec(
        "ctrip_09_seaview_vs_homestay",
        "比较携程「Sea·观海栖宿海景民宿」（连云港）与「《泉汐》儿科医院附近600米精品民宿」（上海）的价格与评分，"
        "在笔记中新建标题为「民宿对比」的笔记，记录两家民宿名称、价格、评分，并指出性价比更高的一家。",
        ["ctrip", "notes"],
        [goal(
            "notes_note", title="民宿对比",
            contains=["观海栖宿", "111", "5", "泉汐", "370", "4.6"],
        )],
        NOTES_CHANGES,
        ["ctrip__search_hotels", "ctrip__get_hotel_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "ctrip_10_refund_order_notool",
        "打开携程我的订单，找到状态为「已退款」的那笔酒店订单，查看其退款详情，"
        "在笔记中新建标题为「退款核对」的笔记，记录该酒店名称与积分抵扣的金额。",
        ["ctrip", "notes"],
        [goal("notes_note", title="退款核对", contains=["维纳国际酒店", "55"])],
        NOTES_CHANGES,
        ["ctrip__list_orders", "ctrip__open_orders"],
        tags=("no_tool_gui_fallback", "query"),
    ),
    spec(
        "ctrip_11_atour_double_breakfast_room_notool",
        "打开携程云栖酒店(杭州西湖湖滨中山北路)详情页，在房型列表中找到「雅致大床房」系列里含「双早」的那个房型，"
        "在笔记中新建标题为「双早房型」的笔记，记录该房型名称与价格。",
        ["ctrip", "notes"],
        [goal("notes_note", title="双早房型", contains=["雅致大床房", "含双早", "508"])],
        NOTES_CHANGES,
        ["ctrip__search_hotels", "ctrip__get_hotel_summary", "ctrip__open_hotel"],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "ctrip_12_car_rental_notool",
        "打开携程用车/租车页面，比较特斯拉Model Y、小米YU7、别克GL8三款车型的租车总价，找出总价最低的一款，"
        "在笔记中新建标题为「租车比价」的笔记，记录该车型名称与总价。",
        ["ctrip", "notes"],
        [goal("notes_note", title="租车比价", contains=["别克GL8", "294"])],
        NOTES_CHANGES,
        [],
        tags=("no_tool_gui_fallback", "browse"),
    ),
]

build_task_classes(SPECS, None, module_globals=globals(), module_name=__name__)
