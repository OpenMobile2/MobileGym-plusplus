"""Taobao tool-boundary probe tasks (services).

See ``services/__init__.py`` for the four-category rationale.
All product/order/cart facts below were read directly from
``apps/Taobao/data/defaults.json`` (never guessed from memory). Notable
implementation quirks discovered while authoring these tasks (relevant to the
tool-design validation goal of this suite, not just to grading):

* ``get_item_summary``/``search_items``/``compare_items`` never expose
  ``favCount``, and the UI never renders it either -- it is a fully dead
  field on both sides. Avoided as a task criterion.
* ``ItemDetailPage`` caps the on-screen review-count text at ``"2000+"`` for
  any item with ``reviewCount > 999`` (see ``itemDetailReviewCountFmt``
  usage), so exact review counts above 999 are only obtainable through the
  tools, never through the GUI. This is the *opposite* of the intended
  ``query_scan_mismatch`` shape (tool worse than GUI), so review-count
  thresholds were intentionally avoided for that category and only used in
  ``idinhand`` tasks where "tool is the correct path" is exactly the point.
* ``originPrice`` is likewise never rendered anywhere in the Taobao UI (no
  strike-through price on cards or detail page), so it is a tool-only field.
  Used as a same-tool-call decoy field in a ``field_mismatch`` task instead of
  as a GUI-comparison task.
* ``get_order_summary``'s ``latest_logistics`` field is computed as
  ``entry.logistics.nodes.at(-1)``, but ``logistics.nodes`` is stored
  newest-first (``LogisticsPage`` renders ``nodes[0]`` at the top as the
  current status). So ``latest_logistics`` actually returns the *oldest*
  tracking node, not the latest one -- a real naming/implementation bug in
  the tool, not a contrived example. Exploited directly in
  ``taobao_v4_09_lamp_latest_logistics_field_mismatch``.
"""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]


def _taobao(input: JudgeInput) -> dict[str, Any]:
    return input.apps.get("taobao") or {}


# ---------------------------------------------------------------------------
# Category 2 (state_direct) extra_check helpers -- no Notes relay, diff the
# taobao app state directly (cart / checkout draft).
# ---------------------------------------------------------------------------

def _jacket_exact_sku_addcart(input: JudgeInput) -> list[dict[str, Any]]:
    init_ids = {
        str(row.get("id")) for row in (input.apps_init.get("taobao") or {}).get("cart") or []
        if isinstance(row, dict)
    }
    final = [row for row in (_taobao(input).get("cart") or []) if isinstance(row, dict)]
    new_lines = [
        row for row in final
        if str(row.get("id")) not in init_ids
        and row.get("itemId") == "i_jacket"
        and "薄雾蓝" in str(row.get("skuDesc") or "")
        and "尺码:L" in str(row.get("skuDesc") or "")
    ]
    qty = sum(int(row.get("qty") or 0) for row in new_lines)
    return [{
        "field": "taobao_jacket_exact_sku_addcart",
        "expected": "new cart line: i_jacket, sku contains 薄雾蓝 + 尺码:L, qty=3",
        "actual": final,
        "passed": qty >= 3,
    }]


def _lanjing_single_line_checkout(input: JudgeInput) -> list[dict[str, Any]]:
    checkout = _taobao(input).get("checkout")
    lines = list((checkout or {}).get("lines") or [])
    source_ids = list((checkout or {}).get("sourceCartLineIds") or [])
    shop_ok = bool(checkout) and checkout.get("shopId") == "s_lanjing"
    lines_ok = (
        len(lines) == 1
        and lines[0].get("itemId") == "i_earbuds"
        and float(lines[0].get("price") or 0) == 399
        and int(lines[0].get("qty") or 0) == 1
    )
    source_ok = source_ids == ["c2"]
    return [{
        "field": "taobao_lanjing_single_line_checkout",
        "expected": "checkout draft: shopId=s_lanjing, lines=[i_earbuds price=399 qty=1], sourceCartLineIds=[c2]",
        "actual": checkout,
        "passed": bool(checkout) and shop_ok and lines_ok and source_ok,
    }]


def _qfs_multiline_checkout(input: JudgeInput) -> list[dict[str, Any]]:
    checkout = _taobao(input).get("checkout")
    lines = [row for row in (checkout or {}).get("lines") or [] if isinstance(row, dict)]
    shop_ok = bool(checkout) and checkout.get("shopId") == "s_qfs"
    by_item = {row.get("itemId"): row for row in lines}
    bodywash = by_item.get("i_bodywash")
    giftbox = by_item.get("i_giftbox")
    bodywash_ok = bool(bodywash) and float(bodywash.get("price") or 0) == 217 and int(bodywash.get("qty") or 0) == 1
    giftbox_ok = bool(giftbox) and float(giftbox.get("price") or 0) == 260 and int(giftbox.get("qty") or 0) == 1
    count_ok = len(lines) == 2
    total = sum(float(row.get("price") or 0) * int(row.get("qty") or 0) for row in lines)
    total_ok = abs(total - 477) < 0.01
    passed = shop_ok and bodywash_ok and giftbox_ok and count_ok and total_ok
    return [{
        "field": "taobao_qfs_multiline_checkout",
        "expected": "checkout draft: shopId=s_qfs, exactly 2 lines [i_bodywash price=217 qty=1, i_giftbox price=260 qty=1], total=477",
        "actual": checkout,
        "passed": passed,
    }]


SPECS = [
    # ---------------------------------------------------------------
    # Category 1: idinhand -- ID already in hand from cart/orders, must be
    # used directly with an ID-based tool instead of re-searching by name.
    # ---------------------------------------------------------------
    spec(
        "taobao_v4_01_cart_review_compare_idinhand",
        "打开淘宝购物车，购物车中除了已经失效的商品之外，还有几件有效商品。"
        "直接用这些商品的ID比较（不要重新按名字搜索）它们的价格和评价数，找出评价数最多的一件。"
        "在笔记中新建标题为「购物车评价冠军」的笔记，记录该商品名称、价格与评价数。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="购物车评价冠军",
            contains=["真无线蓝牙耳机", "399", "12000"],
            not_contains=["沐浴露", "217", "860", "华夫格卫衣", "96.9", "320", "每日坚果礼盒", "75.2", "9000", "手帕纸", "12.9"],
        )],
        NOTES_CHANGES,
        ["taobao__get_cart", "taobao__compare_items"],
        tags=("idinhand",),
    ),
    spec(
        "taobao_v4_02_shipped_orders_logistics_idinhand",
        "查看淘宝订单列表中状态为「已发货」的订单，直接用这些订单的ID查询订单详情（不要重新按商品名字搜索），"
        "记录每笔订单对应的商品名称与物流公司名称（如果某笔订单的物流公司字段为空，请如实注明「暂无物流公司信息」，不要编造）。"
        "在笔记中新建标题为「已发货订单物流核对」的笔记，记录这些订单各自的商品名称与物流公司信息。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="已发货订单物流核对",
            contains=["智能闹钟", "暂无物流公司信息", "护眼台灯", "菜鸟速递"],
            not_contains=["山雾香氛护手霜", "圆通速递", "每日坚果礼盒", "中通快递", "焕活精华液"],
        )],
        NOTES_CHANGES,
        ["taobao__list_orders", "taobao__get_order_summary"],
        tags=("idinhand",),
    ),
    spec(
        "taobao_v4_03_cart_qty_item_detail_idinhand",
        "打开淘宝购物车，找到购物车中数量为2件的那个商品，直接用该商品的ID查询它的完整商品详情"
        "（不要重新按名字搜索），记录它全部的SKU规格名称与可选项。"
        "在笔记中新建标题为「购物车加购商品规格核查」的笔记，记录该商品名称、当前购物车中的数量，以及该商品所有规格的名称与全部可选项。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="购物车加购商品规格核查",
            contains=["每日坚果礼盒", "2", "规格", "30包", "60包"],
            not_contains=["沐浴露", "蓝牙耳机", "白色", "华夫格卫衣", "白灰色", "燕麦色", "雾蓝色", "手帕纸", "24包", "48包"],
        )],
        NOTES_CHANGES,
        ["taobao__get_cart", "taobao__get_item_summary"],
        tags=("idinhand",),
    ),

    # ---------------------------------------------------------------
    # Category 2: state_direct -- multi-field cart/checkout writes, graded by
    # diffing taobao state directly, no Notes relay.
    # ---------------------------------------------------------------
    spec(
        "taobao_v4_04_jacket_exact_sku_addcart_state_direct",
        "在淘宝极星运动专营店中找到「防晒皮肤衣」，选择颜色为「薄雾蓝」、尺码为「L」这个具体规格"
        "（不要选择其他颜色或尺码），加入购物车，数量为3件。这个任务不需要记笔记。",
        ["taobao"],
        [],
        ["taobao.cart"],
        ["taobao__search_items", "taobao__get_item_summary", "taobao__add_to_cart"],
        tags=("state_direct", "no_notes"),
        max_steps=35,
    ),
    spec(
        "taobao_v4_05_lanjing_single_line_checkout_state_direct",
        "打开淘宝购物车，选中购物车中属于蓝鲸数码旗舰店的那一件商品对应的购物车行，"
        "用 prepare_checkout 从该购物车行生成结算草稿，不要选择购物车中的其他商品行。这个任务不需要记笔记。",
        ["taobao"],
        [],
        ["taobao.checkout"],
        ["taobao__get_cart", "taobao__prepare_checkout"],
        tags=("state_direct", "no_notes"),
        max_steps=35,
    ),
    spec(
        "taobao_v4_06_qfs_multiline_checkout_state_direct",
        "在淘宝清风山旗舰店中找到「周年礼盒」商品，选择任意一个款式，加入购物车，数量为1件。"
        "加入之后，从购物车中选中属于清风山旗舰店的全部商品对应的购物车行（应包括刚加入的周年礼盒，以及购物车中原有的沐浴露），"
        "用 prepare_checkout 生成结算草稿，不要包含其他店铺的商品行。这个任务不需要记笔记。",
        ["taobao"],
        [],
        ["taobao.cart", "taobao.checkout"],
        ["taobao__search_items", "taobao__add_to_cart", "taobao__get_cart", "taobao__prepare_checkout"],
        tags=("state_direct", "no_notes"),
        max_steps=40,
    ),

    # ---------------------------------------------------------------
    # Category 3: field_mismatch -- tool field is honest but doesn't answer
    # the precise question asked; agent must notice and check the right
    # field/page instead of confidently reusing the wrong one.
    # ---------------------------------------------------------------
    spec(
        "taobao_v4_07_serum_order_total_vs_paid_field_mismatch",
        "查看淘宝已完成订单中商品为「焕活精华液」的那笔订单，打开订单详情页面，"
        "找出页面上显示的「商品总价」（即下单时的商品原价合计，不是实付款金额）具体是多少元，"
        "同时记录该订单的店铺优惠金额与实付款金额。在笔记中新建标题为「精华液订单金额核对」的笔记，"
        "记录商品总价、店铺优惠、实付款三个数字（三者互不相同，不能只记一个数字重复填三次）。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="精华液订单金额核对",
            contains=["282", "43", "239"],
            not_contains=["护眼台灯", "智能闹钟", "每日坚果礼盒", "山雾香氛护手霜", "149", "159", "280", "110", "75.2"],
        )],
        NOTES_CHANGES,
        ["taobao__list_orders", "taobao__get_order_summary"],
        tags=("field_mismatch",),
    ),
    spec(
        "taobao_v4_08_handcream_catalog_vs_order_price_field_mismatch",
        "淘宝待付款订单里有一笔购买了「山雾香氛护手霜」的订单，请分别查出：这款商品当前在商品详情/搜索结果中的标价"
        "（现价，不是划线原价），以及这笔订单里该商品实际的购买单价，这两个价格是否相同？"
        "在笔记中新建标题为「护手霜订单价格核对」的笔记，记录商品当前标价、订单实际购买单价，并说明两者是相同还是不同。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="护手霜订单价格核对",
            contains=["128", "280"],
            not_contains=["168", "239", "149", "75.2", "217"],
        )],
        NOTES_CHANGES,
        ["taobao__search_items", "taobao__get_item_summary", "taobao__list_orders", "taobao__get_order_summary"],
        tags=("field_mismatch",),
    ),
    spec(
        "taobao_v4_09_lamp_latest_logistics_field_mismatch",
        "打开淘宝订单列表中商品为「护眼台灯」的那笔已发货订单的物流详情页面，"
        "找出物流时间轴中时间最新（排在最上面）的一条物流节点，记录该节点的状态名称与描述文字原文。"
        "在笔记中新建标题为「台灯物流最新节点」的笔记，记录该状态名称与描述文字原文。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="台灯物流最新节点",
            contains=["派送中", "快件正在派送途中"],
            not_contains=["已揽收", "菜鸟速递已揽收快件", "运输中", "无锡新吴分拨中心", "杭州转运中心"],
        )],
        NOTES_CHANGES,
        ["taobao__list_orders", "taobao__get_order_summary"],
        tags=("field_mismatch",),
    ),

    # ---------------------------------------------------------------
    # Category 4: query_scan_mismatch -- search_items requires a non-empty
    # query and cannot list everything at once; these tasks need a full
    # catalog scan against a numeric/text filter instead of a keyword match.
    # ---------------------------------------------------------------
    spec(
        "taobao_v4_10_price_under_70_scan_query_scan_mismatch",
        "淘宝全部商品中，价格低于70元的商品有哪些？请找出全部符合条件的商品（搜索工具每次只能按关键词查询，"
        "无法一次性列出全部商品）。在笔记中新建标题为「70元以下商品清单」的笔记，"
        "记录所有符合条件的商品名称与价格，不能遗漏，也不能多写不符合条件的商品。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="70元以下商品清单",
            contains=["快充数据线", "19.9", "手帕纸", "12.9", "冷泡茶组合", "39.9", "印花短袖T恤", "59", "加厚瑜伽垫", "69"],
            not_contains=["每日坚果礼盒", "75.2", "华夫格卫衣", "96.9", "焖烧保温杯", "89"],
        )],
        NOTES_CHANGES,
        ["taobao__search_items"],
        tags=("query_scan_mismatch",),
        max_steps=50,
    ),
    spec(
        "taobao_v4_11_price_range_150_300_scan_query_scan_mismatch",
        "淘宝全部商品中，价格在150元到300元之间（包含边界）的商品有哪些？请找出全部符合条件的商品"
        "（搜索工具每次只能按关键词查询，无法一次性列出全部商品）。在笔记中新建标题为「中端商品清单」的笔记，"
        "记录所有符合条件的商品名称与价格，不能遗漏，也不能多写不符合条件的商品。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="中端商品清单",
            contains=["沐浴露", "217", "智能闹钟", "249", "直筒牛仔裤", "279", "护眼台灯", "159", "周年礼盒", "260"],
            not_contains=["山雾香氛护手霜", "128", "防晒皮肤衣", "113", "轻量跑步鞋", "317", "焕活精华液", "345", "真无线蓝牙耳机", "399"],
        )],
        NOTES_CHANGES,
        ["taobao__search_items"],
        tags=("query_scan_mismatch",),
        max_steps=50,
    ),
    spec(
        "taobao_v4_12_sold_over_10k_scan_query_scan_mismatch",
        "淘宝全部商品中，找出「已售」标注里带有「万」字样（即销量超过一万件）的商品"
        "（搜索工具每次只能按关键词查询，无法一次性列出全部商品）。在笔记中新建标题为「爆款销量清单」的笔记，"
        "记录所有符合条件的商品名称及其准确的销量标注文字（例如「10万+人付款」），不能遗漏，也不能把销量文字写错。",
        ["taobao", "notes"],
        [goal(
            "notes_note", title="爆款销量清单",
            contains=["快充数据线", "手帕纸", "10万+人付款", "每日坚果礼盒", "5万+人付款", "冷泡茶组合", "3万+人付款", "加厚瑜伽垫", "1万+人付款"],
            not_contains=["真无线蓝牙耳机", "焖烧保温杯", "印花短袖T恤", "防晒皮肤衣", "5000+人付款", "6000+人付款", "8000+人付款"],
        )],
        NOTES_CHANGES,
        ["taobao__search_items"],
        tags=("query_scan_mismatch",),
        max_steps=50,
    ),
]

REMOVED_AFTER_MANUAL_REVIEW = {
    "taobao_v4_01_cart_review_compare_idinhand",
    "taobao_v4_02_shipped_orders_logistics_idinhand",
}
SPECS = [item for item in SPECS if item.task_id not in REMOVED_AFTER_MANUAL_REVIEW]

EXTRA_CHECKS = {
    "taobao_v4_04_jacket_exact_sku_addcart_state_direct": _jacket_exact_sku_addcart,
    "taobao_v4_05_lanjing_single_line_checkout_state_direct": _lanjing_single_line_checkout,
    "taobao_v4_06_qfs_multiline_checkout_state_direct": _qfs_multiline_checkout,
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
