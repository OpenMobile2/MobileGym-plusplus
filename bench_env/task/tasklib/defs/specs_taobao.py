"""Taobao hybrid GUI+Tools tasks (tasklib).

Tools already exist (app_tools/apps/taobao). Verification follows the
newapps_v1 pattern: every task's primary artifact is a Notes entry
(``notes_note`` goal), plus an inline cart-diff check for add-to-cart tasks.
"""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
TAOBAO_CART_CHANGES = ["taobao.cart"]


def _cart_added(item_id: str, min_qty: int = 1):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        init_lines = [
            row for row in ((input.apps_init.get("taobao") or {}).get("cart") or [])
            if isinstance(row, dict) and row.get("itemId") == item_id
        ]
        init_ids = {str(row.get("id")) for row in init_lines}
        cur_lines = [
            row for row in ((input.apps.get("taobao") or {}).get("cart") or [])
            if isinstance(row, dict) and row.get("itemId") == item_id
        ]
        new_lines = [row for row in cur_lines if str(row.get("id")) not in init_ids]
        qty = sum(int(row.get("qty") or 0) for row in new_lines)
        return [{
            "field": "taobao_cart_added",
            "expected": f"{item_id} qty>={min_qty}",
            "actual": cur_lines,
            "passed": qty >= min_qty,
        }]
    return _check


SPECS = [
    spec(
        "taobao_01_alarm_88vip_review",
        "打开淘宝蓝鲸数码旗舰店的「智能闹钟」商品详情，找到评价中标有「88VIP」标签的那条评价。"
        "在笔记中新建一条标题为「闹钟评价核实」的笔记，记录该评价的评价人昵称和完整评价内容原文。",
        ["taobao", "notes"],
        [goal("notes_note", title="闹钟评价核实", contains=["白桃气泡", "第二次购买了", "品质稳定", "推荐"])],
        NOTES_CHANGES,
        ["taobao__search_items", "taobao__get_item_summary", "taobao__open_item"],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "taobao_02_qfs_skincare_compare",
        "比较淘宝清风山旗舰店的护手霜、沐浴露、精华液三款商品的价格，并找出评价关键词标签中提到「滋润」的那一款。"
        "在笔记中新建标题为「清风山产品对比」的笔记，记录三款商品名称与价格，并指出哪一款主打滋润。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="清风山产品对比",
            contains=["护手霜", "128", "沐浴露", "217", "精华液", "345"],
        )],
        NOTES_CHANGES,
        ["taobao__search_items", "taobao__compare_items", "taobao__get_item_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "taobao_03_yunshang_cheap_addcart",
        "在淘宝云裳女装店铺中，找出价格低于100元的两款商品，把价格更低的一款加入购物车（数量1，任选一个尺码），"
        "并在笔记中新建标题为「云裳补货」的笔记，记录该商品名称与加购数量。",
        ["taobao", "notes"],
        [goal("notes_note", title="云裳补货", contains=["印花短袖T恤", "1"])],
        NOTES_CHANGES + TAOBAO_CART_CHANGES,
        ["taobao__search_items", "taobao__get_item_summary", "taobao__add_to_cart"],
        tags=("query_then_action", "cart"),
    ),
    spec(
        "taobao_04_juzi_snack_total",
        "查看淘宝桔子食品旗舰店的「每日坚果礼盒」和「冷泡茶组合」两款商品的价格，"
        "在笔记中新建标题为「零食甄选」的笔记，记录两款商品名称、单价，以及两者价格之和。",
        ["taobao", "notes"],
        [goal("notes_note", title="零食甄选", contains=["每日坚果礼盒", "75.2", "冷泡茶组合", "39.9", "115.1"])],
        NOTES_CHANGES,
        ["taobao__search_items", "taobao__compare_items", "taobao__get_item_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "taobao_05_coupon_lowest_threshold",
        "查看淘宝我的优惠券列表中所有未使用的优惠券，找出使用门槛（满多少元可用）金额最低的一张。"
        "在笔记中新建标题为「优惠券速览」的笔记，记录该券的名称与使用门槛金额。",
        ["taobao", "notes"],
        [goal("notes_note", title="优惠券速览", contains=["国内机票家庭礼包券", "36"])],
        NOTES_CHANGES,
        ["taobao__list_coupons"],
        tags=("query",),
    ),
    spec(
        "taobao_06_jianmu_price_range",
        "查看淘宝简木家居专营店的护眼台灯、手帕纸、焖烧保温杯三款商品的价格，找出价格最高与最低的两款，"
        "在笔记中新建标题为「简木家居选购」的笔记，记录这两款商品名称、价格，以及两者的价格差。",
        ["taobao", "notes"],
        [goal("notes_note", title="简木家居选购", contains=["护眼台灯", "159", "手帕纸", "12.9", "146.1"])],
        NOTES_CHANGES,
        ["taobao__search_items", "taobao__compare_items", "taobao__get_item_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "taobao_07_cheapest_item_addcart",
        "在淘宝全部商品中，找出唯一一款价格低于20元的商品，将其加入购物车（数量2，任选一个规格），"
        "并在笔记中新建标题为「平价加购」的笔记，记录商品名称、单价与加购数量。",
        ["taobao", "notes"],
        [goal("notes_note", title="平价加购", contains=["快充数据线", "19.9", "2"])],
        NOTES_CHANGES + TAOBAO_CART_CHANGES,
        ["taobao__search_items", "taobao__compare_items", "taobao__get_item_summary", "taobao__add_to_cart"],
        tags=("query_then_action", "cart"),
        max_steps=40,
    ),
    spec(
        "taobao_08_hoodie_88vip_review",
        "打开淘宝云裳女装店铺的「华夫格卫衣」商品详情，找到评价中标有「88VIP」标签的那条评价。"
        "在笔记中新建标题为「卫衣评价核实」的笔记，记录该评价的评价人昵称和完整评价内容原文。",
        ["taobao", "notes"],
        [goal("notes_note", title="卫衣评价核实", contains=["清晨小鹿", "质量不错", "和描述一致", "家人很喜欢"])],
        NOTES_CHANGES,
        ["taobao__search_items", "taobao__get_item_summary", "taobao__open_item"],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "taobao_09_jixing_price_span",
        "比较淘宝极星运动专营店的跑步鞋、瑜伽垫、防晒皮肤衣三款商品的价格，找出最贵和最便宜的两款，"
        "在笔记中新建标题为「极星运动选购」的笔记，记录这两款商品名称、价格，以及价格差。",
        ["taobao", "notes"],
        [goal("notes_note", title="极星运动选购", contains=["轻量跑步鞋", "317", "加厚瑜伽垫", "69", "248"])],
        NOTES_CHANGES,
        ["taobao__search_items", "taobao__compare_items", "taobao__get_item_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "taobao_10_nuts_order_signing",
        "查看淘宝订单列表中状态为「已完成」、商品为「每日坚果礼盒」的那笔订单的物流详情，"
        "在笔记中新建标题为「坚果订单核对」的笔记，记录该订单的商品名称、物流公司名称与快递单号。",
        ["taobao", "notes"],
        [goal("notes_note", title="坚果订单核对", contains=["每日坚果礼盒", "中通快递", "ZT4456120098"])],
        NOTES_CHANGES,
        ["taobao__list_orders", "taobao__get_order_summary"],
        tags=("no_tool_gui_fallback", "query"),
    ),
    spec(
        "taobao_11_beauty_coupon_threshold_check",
        "计算淘宝清风山旗舰店护手霜、沐浴露、精华液三款商品的总价，并对照「美妆加补券」满990元可用的门槛，"
        "在笔记中新建标题为「补贴券核算」的笔记，记录三款商品总价、门槛金额，以及是否已达到门槛的结论。",
        ["taobao", "notes"],
        [goal("notes_note", title="补贴券核算", contains=["690", "990"])],
        NOTES_CHANGES,
        ["taobao__search_items", "taobao__compare_items", "taobao__list_coupons"],
        tags=("browse", "reasoning"),
    ),
    spec(
        "taobao_12_giftbox_addcart",
        "在淘宝清风山旗舰店中找到「周年礼盒」商品，将其加入购物车（数量1，任选一个款式），"
        "并在笔记中新建标题为「礼盒加购」的笔记，记录商品名称与单价。",
        ["taobao", "notes"],
        [goal("notes_note", title="礼盒加购", contains=["周年礼盒", "260"])],
        NOTES_CHANGES + TAOBAO_CART_CHANGES,
        ["taobao__search_items", "taobao__get_item_summary", "taobao__add_to_cart"],
        tags=("query_then_action", "cart"),
    ),
]

EXTRA_CHECKS = {
    "taobao_03_yunshang_cheap_addcart": _cart_added("i_tee", 1),
    "taobao_07_cheapest_item_addcart": _cart_added("i_cable", 2),
    "taobao_12_giftbox_addcart": _cart_added("i_giftbox", 1),
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
