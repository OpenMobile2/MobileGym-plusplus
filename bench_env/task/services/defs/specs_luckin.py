"""Luckin Coffee (瑞幸咖啡) hybrid GUI+Tools tasks -- tool-boundary probe (services).

See ``services/__init__.py`` for the four-lens design rationale
(``idinhand`` / ``state_direct`` / ``field_mismatch`` / ``query_scan_mismatch``).
Every product/store/coupon/address name, price and id below was read directly
from ``apps/Luckin/res/data.zh.ts`` (6 classic products, 5 instant/retail
products, 5 stores, 5 addresses, 5 coupons, 5 orders) and cross-checked against
``app_tools/apps/luckin/index.ts`` -- not recalled from memory. Names with an
internal full-width space (e.g. "缤纷 C 美式", "橙 C 美式（首创）") are matched
via single-word tokens ("缤纷"/"美式"/"橙") rather than the full literal string,
per the space-collapsing behaviour of ``core/verifier.py``'s
``_norm()`` (collapses runs of whitespace but does not delete a lone space, and
is fragile to authoring the exact glyph/width of that space by hand).

This file avoids repeating any task_id/scenario already covered by v1's 10
Luckin tasks (``specs_luckin.py`` under ``tasklib``): cheapest/
farthest/nearest lookups, fruit/instant price comparisons, unclaimed coupon,
unpaid/completed order queries, and the two add-to-cart tasks.

Key boundary findings that shaped this batch (see final report to the user for
full detail):

- ``luckin__add_to_cart`` takes only ``product_id`` -- there is no custom-spec
  parameter at all, and critically, even the **GUI** "加入购物车" button on the
  product customization page (``ProductCustomizePage`` / ``product.cart.add``)
  never writes the chosen size/temperature/sweetness/bubble/add-on into the
  cart line; ``CartItem.spec`` is always the literal string ``'coffee.default'``
  regardless of path. So a "select an exact spec combo, diff the cart's spec
  field" ``state_direct`` task (the pattern used successfully in
  ``an earlier draft``'s Taobao/kapi/daysmatter examples) is not
  buildable for Luckin today -- there is no state field that would ever record
  it. ``state_direct`` tasks here instead target the address form (multi-field,
  no tool at all), coupon "膨胀" (inflate, numeric transform, no tool), and
  retail-product favoriting (list-membership diff, no tool).
- ``luckin__search_products`` only searches ``state().products`` (the 6
  classic-menu items); the 5 ``instantProducts`` (retail/即享 goods) are not
  reachable through *any* tool (no search, no cart read, no favorite read).
  ``luckin__get_cart`` already inlines full product detail (name, both price
  fields, category, badge, favorite) for every cart line via ``productSummary``,
  so there is no genuine "have an ID, need a dedicated detail tool" gap for
  cart-sourced classic items -- the single ``idinhand`` task below is
  deliberately a *weak* instance that exercises this (get_cart doubles as the
  ID-source and the detail resolver) rather than skipping the category
  entirely, per the user's explicit fallback instruction.
- ``luckin__search_products``'s ``query`` argument is ``required`` (see
  ``definitions.ts`` + ``core/errors.ts``'s ``requireString``, which throws on
  an empty string) -- there is no way to list all 6 classic products in one
  call. With only 6 items this is a mild version of the boundary (GUI shows
  the whole classic menu on one screen already), so the ``query_scan_mismatch``
  tasks below use precise numeric thresholds (incl. a from-below boundary case
  at exactly ¥13) to make the "must scan/compare every item" requirement
  concrete rather than trivially glanceable.
"""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
ADDRESS_CHANGES = ["luckin.addresses"]
COUPON_CHANGES = ["luckin.coupons"]
FAVORITE_CHANGES = ["luckin.favorites"]


def _new_address_matches(input: JudgeInput) -> list[dict[str, Any]]:
    init_ids = {
        str(row.get("id")) for row in ((input.apps_init.get("luckin") or {}).get("addresses") or [])
        if isinstance(row, dict)
    }
    final = [row for row in ((input.apps.get("luckin") or {}).get("addresses") or []) if isinstance(row, dict)]
    matches = [
        row for row in final
        if str(row.get("id")) not in init_ids
        and row.get("name") == "王芳"
        and str(row.get("phone")) == "13800001111"
        and row.get("region") == "海蓝市 高新区"
        and "智谷科技园" in str(row.get("detail") or "")
        and row.get("tag") == "公司"
        and row.get("isDefault") is False
    ]
    return [{
        "field": "luckin_address_multifield",
        "expected": "new address: name=王芳, phone=13800001111, region=海蓝市 高新区, "
                    "detail contains 智谷科技园, tag=公司, isDefault=False",
        "actual": final,
        "passed": bool(matches),
    }]


def _coupon_inflate_c02(input: JudgeInput) -> list[dict[str, Any]]:
    final = [row for row in ((input.apps.get("luckin") or {}).get("coupons") or []) if isinstance(row, dict)]
    row = next((r for r in final if str(r.get("id")) == "c02"), None)
    passed = (
        row is not None
        and bool(row.get("claimed"))
        and abs(float(row.get("amount") or 0) - 11.0) <= 0.15
    )
    return [{
        "field": "luckin_coupon_c02_inflated",
        "expected": "coupon c02 (满 20 减 8 元): amount ~= 11.0 (8 + 3, capped at 13.9), claimed=True",
        "actual": row,
        "passed": passed,
    }]


def _favorites_added(*product_ids: str):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        final = set((input.apps.get("luckin") or {}).get("favorites") or [])
        missing = [pid for pid in product_ids if pid not in final]
        return [{
            "field": "luckin_favorites_added",
            "expected": f"{list(product_ids)} present in favorites",
            "actual": sorted(final),
            "passed": not missing,
        }]
    return _check


SPECS = [
    # ---------------------------------------------------------------- idinhand
    # Weak instance (see module docstring): luckin__get_cart already inlines full
    # product detail for cart lines, so there's no separate "ID in hand -> needs
    # a dedicated detail tool" gap to exercise for Luckin's own toolset. This task
    # instead checks that the agent identifies the app's default-seeded cart item
    # (coconut-latte) via get_cart rather than re-searching it by name, then uses
    # search_products only for the second (non-cart) comparison item.
    spec(
        "luckin_v4_01_idinhand_cart_item_price_compare",
        "瑞幸购物车里已经有一杯饮品（不要用search_products去搜索它的名称，"
        "直接查看购物车确认它是什么、现价多少），再搜索「青柠冰茶」查询它的现价，"
        "比较这两款饮品的现价，指出哪一款更贵。"
        "在笔记中新建标题为「购物车饮品比价」的笔记，记录两款饮品的名称、现价，并指出更贵的一款。",
        ["luckin", "notes"],
        [goal(
            "notes_note", title="购物车饮品比价",
            contains=["生椰拿铁", "10.9", "青柠冰茶", "9.9"],
            not_contains=["橙", "12.9", "缤纷", "13.9"],
        )],
        NOTES_CHANGES,
        ["luckin__get_cart", "luckin__search_products"],
        tags=("idinhand", "nonsearch_id_source", "cart_source", "weak_instance"),
        max_steps=35,
    ),
    # ------------------------------------------------------------- state_direct
    spec(
        "luckin_v4_02_state_new_address_multifield",
        "打开瑞幸『地址管理』页面，新增一个收货地址：联系人姓名填「王芳」，手机号填「13800001111」，"
        "所在地区选择「海蓝市 高新区」，详细地址填「智谷科技园3号楼502室」，地址标签选择「公司」，"
        "不要把它设为默认地址（注意默认表单可能预选了默认地址开关，需要检查并关闭）。"
        "完成保存后，这个任务不需要记笔记。",
        ["luckin"],
        [],
        ADDRESS_CHANGES,
        [],
        tags=("state_direct", "no_notes", "multi_field", "no_tool_gui_fallback"),
        max_steps=40,
    ),
    spec(
        "luckin_v4_03_state_coupon_inflate",
        "打开瑞幸『我的卡券』（饮品券分类下），找到标题为「满 20 减 8 元」的这张优惠券，"
        "点击它的『膨胀』按钮执行一次膨胀操作（只操作这一张券，只点一次，"
        "膨胀后金额会提高，最高不超过13.9元）。完成后这个任务不需要记笔记。",
        ["luckin"],
        [],
        COUPON_CHANGES,
        ["luckin__list_coupons"],
        tags=("state_direct", "no_notes", "numeric_transform", "no_tool_gui_fallback"),
        max_steps=30,
    ),
    spec(
        "luckin_v4_04_state_favorite_instant_products",
        "打开瑞幸『即享』商城，收藏（点击心形/收藏按钮）「深烘冻干咖啡 12颗」和「山野挂耳咖啡 10袋」"
        "这两款零售商品。完成后这个任务不需要记笔记。",
        ["luckin"],
        [],
        FAVORITE_CHANGES,
        [],
        tags=("state_direct", "no_notes", "no_tool_gui_fallback", "instant_goods"),
        max_steps=35,
    ),
    # ----------------------------------------------------------- field_mismatch
    spec(
        "luckin_v4_05_field_mismatch_velvet_c_original_price",
        "查一下瑞幸经典菜单里「缤纷 C 美式」的门市价（也叫原价，即划线价，不是现在的活动价/现价）。"
        "在笔记中新建标题为「缤纷美式门市价核实」的笔记，记录饮品名称与门市价这一个数字，不要写现价。",
        ["luckin", "notes"],
        [goal(
            "notes_note", title="缤纷美式门市价核实",
            contains=["缤纷", "美式", "20"],
            not_contains=["13.9"],
        )],
        NOTES_CHANGES,
        ["luckin__search_products"],
        tags=("field_mismatch", "adjacent_fields", "price_vs_original_price"),
        max_steps=30,
    ),
    spec(
        "luckin_v4_06_field_mismatch_orange_c_original_price",
        "查一下瑞幸经典菜单里「橙 C 美式」的门市价（也叫原价，即划线价，不是现在的活动价/现价）。"
        "在笔记中新建标题为「橙美式门市价核实」的笔记，记录饮品名称与门市价这一个数字，不要写现价。",
        ["luckin", "notes"],
        [goal(
            "notes_note", title="橙美式门市价核实",
            contains=["橙", "美式", "20"],
            not_contains=["12.9"],
        )],
        NOTES_CHANGES,
        ["luckin__search_products"],
        tags=("field_mismatch", "adjacent_fields", "price_vs_original_price"),
        max_steps=30,
    ),
    spec(
        "luckin_v4_07_field_mismatch_grape_latte_current_price",
        "查一下瑞幸经典菜单里「葡萄丝绒拿铁」当前用户下单实际要付的价格（现价/售价，不是门市价/原价/划线价）。"
        "在笔记中新建标题为「葡萄丝绒拿铁现价核实」的笔记，记录饮品名称与现价这一个数字，不要写门市价。",
        ["luckin", "notes"],
        [goal(
            "notes_note", title="葡萄丝绒拿铁现价核实",
            contains=["葡萄丝绒拿铁", "14.9"],
            not_contains=["22"],
        )],
        NOTES_CHANGES,
        ["luckin__search_products"],
        tags=("field_mismatch", "adjacent_fields", "price_vs_original_price"),
        max_steps=30,
    ),
    # ------------------------------------------------------- query_scan_mismatch
    spec(
        "luckin_v4_08_query_scan_under12_classic",
        "在瑞幸经典菜单的**全部**6款饮品中（不限定名单，需要你自己逐一核对每一款的价格），"
        "找出所有单价低于12元的饮品。在笔记中新建标题为「12元以下饮品清单」的笔记，"
        "逐一记录符合条件的每款饮品名称与单价，并记录总共有多少款符合条件。",
        ["luckin", "notes"],
        [goal(
            "notes_note", title="12元以下饮品清单",
            contains=["生椰拿铁", "10.9", "云朵厚乳拿铁", "11.9", "青柠冰茶", "9.9", "3"],
            not_contains=["12.9", "13.9", "14.9"],
        )],
        NOTES_CHANGES,
        ["luckin__search_products"],
        tags=("query_scan_mismatch", "required_query_param", "global_filter"),
        max_steps=45,
    ),
    spec(
        "luckin_v4_09_query_scan_original20_classic",
        "在瑞幸经典菜单的**全部**6款饮品中（不限定名单，需要你自己逐一核对每一款的门市价/原价），"
        "找出所有门市价（原价）恰好为20元的饮品。在笔记中新建标题为「门市价20元清单」的笔记，"
        "逐一记录符合条件的每款饮品名称，并记录总共有多少款符合条件。",
        ["luckin", "notes"],
        [goal(
            "notes_note", title="门市价20元清单",
            contains=["橙", "美式", "生椰拿铁", "缤纷", "20", "3"],
            not_contains=["葡萄丝绒拿铁", "云朵厚乳拿铁", "青柠冰茶"],
        )],
        NOTES_CHANGES,
        ["luckin__search_products"],
        tags=("query_scan_mismatch", "required_query_param", "global_filter"),
        max_steps=45,
    ),
    spec(
        "luckin_v4_10_query_scan_atleast13_classic",
        "在瑞幸经典菜单的**全部**6款饮品中（不限定名单，需要你自己逐一核对每一款的价格），"
        "找出所有单价不低于13元（即大于或等于13元）的饮品。在笔记中新建标题为「13元及以上饮品清单」的笔记，"
        "逐一记录符合条件的每款饮品名称与单价，并记录总共有多少款符合条件。",
        ["luckin", "notes"],
        [goal(
            "notes_note", title="13元及以上饮品清单",
            contains=["缤纷", "美式", "13.9", "葡萄丝绒拿铁", "14.9", "2"],
            not_contains=["生椰拿铁", "云朵厚乳拿铁", "青柠冰茶"],
        )],
        NOTES_CHANGES,
        ["luckin__search_products"],
        tags=("query_scan_mismatch", "required_query_param", "global_filter", "boundary_value"),
        max_steps=45,
    ),
]

EXTRA_CHECKS = {
    "luckin_v4_02_state_new_address_multifield": _new_address_matches,
    "luckin_v4_03_state_coupon_inflate": _coupon_inflate_c02,
    "luckin_v4_04_state_favorite_instant_products": _favorites_added("instant-02", "instant-03"),
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
