"""Luckin Coffee hybrid GUI+Tools tasks (tasklib)."""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
CART_CHANGES = ["luckin.cart"]


def _cart_qty(*product_ids: str, min_qty: int = 1):
    def _qty(apps, product_id):
        cart = (apps.get("luckin") or {}).get("cart") or []
        return sum(int(row.get("quantity") or 0) for row in cart if row.get("productId") == product_id)

    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        results = {
            pid: (_qty(input.apps_init, pid), _qty(input.apps, pid))
            for pid in product_ids
        }
        passed = all(after >= before + min_qty for before, after in results.values())
        return [{
            "field": "luckin_cart_qty",
            "expected": {pid: f">= {before + min_qty}" for pid, (before, _) in results.items()},
            "actual": {pid: after for pid, (_, after) in results.items()},
            "passed": passed,
        }]
    return _check


SPECS = [
    spec(
        "luckin_01_cheapest_classic_addcart",
        "在瑞幸经典菜单中找出价格最便宜的一款饮品，将其以默认规格加入购物车（数量1），"
        "并在笔记中新建标题为「今日省钱单」的笔记，记录该饮品名称与单价。",
        ["luckin", "notes"],
        [goal("notes_note", title="今日省钱单", contains=["青柠冰茶", "9.9"])],
        NOTES_CHANGES + CART_CHANGES,
        ["luckin__search_products", "luckin__add_to_cart"],
        tags=("query_then_action", "cart"),
    ),
    spec(
        "luckin_02_fruit_compare",
        "比较瑞幸「橙C美式」和「缤纷C美式」两款果咖的价格，找出更便宜的一款，"
        "在笔记中新建标题为「果咖比价」的笔记，记录两款饮品名称、价格，并指出更便宜的一款。",
        ["luckin", "notes"],
        [goal("notes_note", title="果咖比价", contains=["橙", "美式", "12.9", "缤纷", "13.9"])],
        NOTES_CHANGES,
        ["luckin__search_products"],
        tags=("browse", "compare"),
    ),
    spec(
        "luckin_03_nearest_store",
        "查看瑞幸门店列表，找出距离最近的门店，在笔记中新建标题为「最近门店」的笔记，"
        "记录门店名称与距离。",
        ["luckin", "notes"],
        [goal("notes_note", title="最近门店", contains=["星河世纪广场店", "509"])],
        NOTES_CHANGES,
        ["luckin__list_stores"],
        tags=("query",),
    ),
    spec(
        "luckin_04_unclaimed_coupon",
        "查看瑞幸我的卡券列表，找出唯一一张尚未领取的优惠券，在笔记中新建标题为「待领券」的笔记，"
        "记录该券名称与使用门槛。",
        ["luckin", "notes"],
        [goal("notes_note", title="待领券", contains=["周一能量", "15"])],
        NOTES_CHANGES,
        ["luckin__list_coupons"],
        tags=("query",),
    ),
    spec(
        "luckin_05_instant_cheaper",
        "比较瑞幸零售商品「经典浓缩咖啡液 32杯」和「晨曦拼配咖啡豆 500g」的价格，找出更便宜的一款，"
        "在笔记中新建标题为「零售比价」的笔记，记录两款商品名称、价格，并指出更便宜的一款。",
        ["luckin", "notes"],
        [goal("notes_note", title="零售比价", contains=["经典浓缩咖啡液", "76", "晨曦拼配咖啡豆", "88"])],
        NOTES_CHANGES,
        ["luckin__search_products"],
        tags=("browse", "compare"),
    ),
    spec(
        "luckin_06_unpaid_order",
        "查看瑞幸我的订单，找出状态为「待支付」的那笔订单，在笔记中新建标题为「待支付核对」的笔记，"
        "记录该订单的商品名称与金额。",
        ["luckin", "notes"],
        [goal("notes_note", title="待支付核对", contains=["橙", "美式", "12.9"])],
        NOTES_CHANGES,
        [],
        tags=("no_tool_gui_fallback", "query"),
    ),
    spec(
        "luckin_07_done_orders_total",
        "查看瑞幸我的订单，找出所有状态为「已完成」的订单，在笔记中新建标题为「已完成订单汇总」的笔记，"
        "记录这些订单各自的商品名称、金额，以及金额总和。",
        ["luckin", "notes"],
        [goal("notes_note", title="已完成订单汇总", contains=["青柠冰茶", "9.9", "缤纷", "27.8", "37.7"])],
        NOTES_CHANGES,
        [],
        tags=("no_tool_gui_fallback", "query"),
    ),
    spec(
        "luckin_08_addcart_two_items",
        "把瑞幸经典菜单中的「生椰拿铁」和「云朵厚乳拿铁」都以默认规格加入购物车（各1杯），"
        "并在笔记中新建标题为「拿铁双拼」的笔记，记录这两款饮品名称与单价。",
        ["luckin", "notes"],
        [goal("notes_note", title="拿铁双拼", contains=["生椰拿铁", "10.9", "云朵厚乳拿铁", "11.9"])],
        NOTES_CHANGES + CART_CHANGES,
        ["luckin__search_products", "luckin__add_to_cart"],
        tags=("query_then_action", "cart"),
    ),
    spec(
        "luckin_09_grape_latte_custom_addcart_notool",
        "打开瑞幸「葡萄丝绒拿铁」商品详情页，在 GUI 中选择一个具体规格（大杯或去冰任选）并加入购物车，"
        "并在笔记中新建标题为「新品试喝」的笔记，记录该饮品名称与选择的规格。",
        ["luckin", "notes"],
        [goal("notes_note", title="新品试喝", contains=["葡萄丝绒拿铁"])],
        NOTES_CHANGES + CART_CHANGES,
        ["luckin__search_products", "luckin__open_product"],
        tags=("no_tool_gui_fallback", "cart"),
    ),
    spec(
        "luckin_10_farthest_store",
        "查看瑞幸门店列表，找出距离最远的门店，在笔记中新建标题为「较远门店」的笔记，"
        "记录门店名称与距离。",
        ["luckin", "notes"],
        [goal("notes_note", title="较远门店", contains=["南岸里店", "2.3"])],
        NOTES_CHANGES,
        ["luckin__list_stores"],
        tags=("query",),
    ),
]

EXTRA_CHECKS = {
    "luckin_01_cheapest_classic_addcart": _cart_qty("lemon-tea", min_qty=1),
    "luckin_08_addcart_two_items": _cart_qty("coconut-latte", "cloud-latte"),
    "luckin_09_grape_latte_custom_addcart_notool": _cart_qty("grape-latte"),
}

# The app's seeded default cart already contains one ``coconut-latte`` (see
# apps/Luckin/state.ts), which would make "add 1 cup each" trivially ambiguous
# for luckin_08 (an agent that leaves the pre-existing line untouched still
# "has" 1 in cart). Clear the cart before this episode so both target items
# genuinely start at qty 0.
PREPARE_STATE = {
    "luckin_08_addcart_two_items": {"luckin": {"cart": []}},
}

build_task_classes(
    SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__, prepare_states=PREPARE_STATE
)
