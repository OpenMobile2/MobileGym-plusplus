"""Dianping (大众点评) hybrid GUI+Tools tasks -- tool-boundary probe (services).

Every fact/number below was read directly out of ``apps/Dianping/data/defaults.json``
(8 seeded shops) and cross-checked against ``app_tools/apps/dianping/index.ts`` (the
actual handler implementations), not recalled from memory. This file deliberately
avoids repeating any task_id / scenario already covered by v1's 12 Dianping tasks
(``tasklib/defs/specs_dianping.py``), v2's
``multiconstraint_04_dianping_global_filter``, or v3's
``recovery_01_dianping_my_reviews``.

Key seed facts used across this file (shop_id: name / category / district / avgPrice
/ score / taste / env / service / reviewCount / distanceM):

- ``wangheli``: 王和李·海鲜火锅大排档(万达茂店) / 海鲜火锅 / 万达茂 / 94 / 4.4 / 4.4 / 4.4
  / 4.4 / 387 / 540. Already favorited. Dish "贵州红酸汤锅底" price 48, recommendCount
  12 (rank 7 of 7 by recommendCount -- outside ``get_shop_summary``'s top-5 slice, only
  visible via ``list_recommended_dishes``). Deal ``vh2`` "多人嗨聚海鲜火锅双人餐" price 139.
- ``pangpang``: PangPang·熊(仙林万达店) / 蛋糕甜品 / 仙林万达 / 88 / 4.8 / 4.9 / 4.7 / 4.8
  / 256 / 620. Already favorited. Deal ``pp1`` "6英寸动物奶油蛋糕" price 198.
- ``wuyuesi``: 五月四·创意烤肉店 / 烤肉 / 新街口 / 76 / 4.2 / 4.3 / 4.0 / 4.1 / 128 / 3200.
- ``luckin``: 瑞幸咖啡(南大仙林店) / 咖啡 / 仙林 / 18 / 4.1 / 4.0 / 4.2 / 4.1 / 520 / 180.
- ``yeren``: 野人先生现做冰淇淋 / 冰淇淋 / 仙林 / 25 / 4.6 / 4.7 / 4.5 / 4.5 / 89 / 450.
- ``sushiya``: 一绪に寿喜烧(新街口店) / 日料 / 新街口 / 128 / 4.5 / 4.6 / 4.4 / 4.5 / 210
  / 3500. Deal ``su1`` "双人寿喜烧套餐" price 199.
- ``malatang``: 杨国福麻辣烫(仙林店) / 小吃简餐 / 仙林 / 32 / 3.9 / 4.0 / 3.6 / 3.8 / 640
  / 260.
- ``bbqking``: 烤匠·炭火烤肉 / 烧烤 / 河西 / 85 / 4.3 / 4.4 / 4.1 / 4.2 / 176 / 7800.

Four categories (see ``services/__init__.py`` for the overall suite
rationale):

1. ``idinhand`` (2 tasks) -- ``favoriteShopIds`` seeds exactly 2 shops (``wangheli``,
   ``pangpang``), reachable only via the "我的收藏" GUI list (Dianping has no
   ``list_favorite_shops`` read tool). Each task asks the agent to verify a
   favorited shop's current rating/avg-price via ``get_shop_summary(shop_id)``
   rather than re-searching its name -- the exact "ID-in-hand, not from search"
   gap flagged as never-exercised in the 104-run audit (``dianping__get_shop_summary``
   had 0 real calls despite being a candidate tool in 5 v1 tasks).
2. ``state_direct`` (3 tasks) -- new ``prepare_voucher_checkout`` write tasks with
   shop/deal/quantity combinations disjoint from v1's two (``luckin``/``lk1``/3 and
   ``bbqking``/``bb1``/2): ``wangheli``/``vh2``/2, ``pangpang``/``pp1``/2,
   ``sushiya``/``su1``/3. Graded purely by diffing ``dianping.pendingCheckout``; no
   Notes relay.
3. ``field_mismatch`` (3 tasks) -- two real "aggregate rating vs. one specific
   dimension" gaps confirmed by reading ``index.ts``: ``search_shops``'s
   ``shopSummary()`` only ever returns the overall ``score`` field, never
   ``taste``/``env``/``service`` -- those three sub-scores are exclusive to
   ``get_shop_summary``. For ``pangpang`` and ``luckin``, the overall ``score``
   and the ``taste`` sub-score are different numbers (4.8 vs 4.9, and 4.1 vs 4.0
   respectively) and in opposite directions, so an agent that reads ``score`` off
   ``search_shops`` and reports it as "口味评分" will be caught. The third task
   uses a real aggregation gap in ``get_shop_summary``'s ``top_dishes``: it is
   hard-capped to the top 5 dishes by ``recommendCount``
   (``[...shop.dishes].sort(...).slice(0, 5)``); ``wangheli``'s "贵州红酸汤锅底"
   (recommendCount 12) is ranked 7th of 7 and is therefore invisible to
   ``get_shop_summary`` -- only the uncapped ``list_recommended_dishes`` returns
   its price (48), which also sits suspiciously close to the shop's unrelated
   ``avg_price`` (94) and its most-prominent dish "帝王蟹脚" (128).
4. ``query_scan_mismatch`` (3 tasks) -- new full-catalog AND-filter tasks over all
   8 shops, each with a genuine unique answer and at least one shop that satisfies
   only one of the two conditions (a partial-match trap), using three different
   field pairs disjoint from v2's ``multiconstraint_04`` (score>=4.5 AND
   avgPrice<50 -> 野人先生): reviewCount+avgPrice -> 瑞幸, avgPrice+score ->
   杨国福, distanceM+score -> 一绪に寿喜烧. ``dianping__search_shops`` requires a
   non-empty ``query`` and cannot list all 8 shops in one call, so -- exactly like
   ``multiconstraint_04`` -- there is no single-call shortcut; tagged
   ``no_tool_gui_fallback``.
"""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
CHECKOUT_CHANGES = ["dianping.pendingCheckout"]


def _voucher_prepared(shop_id: str, deal_id: str, min_qty: int = 1):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        pending = (input.apps.get("dianping") or {}).get("pendingCheckout") or {}
        passed = (
            pending.get("shopId") == shop_id
            and pending.get("dealId") == deal_id
            and int(pending.get("qty") or 0) >= min_qty
        )
        return [{
            "field": "dianping_voucher_prepared",
            "expected": f"shopId={shop_id} dealId={deal_id} qty>={min_qty}",
            "actual": pending,
            "passed": passed,
        }]
    return _check


SPECS = [
    # ---------------------------------------------------------------- idinhand
    spec(
        "dianping_v4_01_idinhand_favorite_seafood_summary",
        "大众点评：打开「我的收藏」门店列表，找到里面做海鲜火锅的那一家，核实一下它当前的综合评分"
        "与人均消费。在笔记中新建标题为「收藏门店核实-海鲜火锅」的笔记，记录门店名称、综合评分与"
        "人均消费。",
        ["dianping", "notes"],
        [goal(
            "notes_note", title="收藏门店核实-海鲜火锅",
            contains=["王和李", "4.4", "94"],
            not_contains=["PangPang", "4.8", "88"],
        )],
        NOTES_CHANGES,
        ["dianping__get_shop_summary"],
        tags=("idinhand", "nonsearch_id_source", "favorites_source"),
        max_steps=35,
    ),
    spec(
        "dianping_v4_02_idinhand_favorite_dessert_summary",
        "大众点评：打开「我的收藏」门店列表，找到里面卖蛋糕甜品的那一家，核实一下它当前的综合评分、"
        "人均消费与评价数量。在笔记中新建标题为「收藏门店核实-蛋糕甜品」的笔记，记录门店名称、"
        "综合评分、人均消费与评价数量。",
        ["dianping", "notes"],
        [goal(
            "notes_note", title="收藏门店核实-蛋糕甜品",
            contains=["PangPang", "4.8", "88", "256"],
            not_contains=["王和李", "4.4", "94", "387"],
        )],
        NOTES_CHANGES,
        ["dianping__get_shop_summary"],
        tags=("idinhand", "nonsearch_id_source", "favorites_source"),
        max_steps=35,
    ),
    # ------------------------------------------------------------- state_direct
    spec(
        "dianping_v4_03_state_seafood_setmeal_checkout",
        "大众点评：在王和李·海鲜火锅大排档(万达茂店)的团购中找到「多人嗨聚海鲜火锅双人餐」，"
        "准备下单购买2份（无需完成支付）。这个任务不需要记笔记。",
        ["dianping"],
        [],
        CHECKOUT_CHANGES,
        ["dianping__search_shops", "dianping__list_shop_deals", "dianping__prepare_voucher_checkout"],
        tags=("state_direct", "no_notes", "checkout_draft"),
        max_steps=35,
    ),
    spec(
        "dianping_v4_04_state_dessert_cake_checkout",
        "大众点评：在PangPang·熊(仙林万达店)的团购中找到「6英寸动物奶油蛋糕」，"
        "准备下单购买2份（无需完成支付）。这个任务不需要记笔记。",
        ["dianping"],
        [],
        CHECKOUT_CHANGES,
        ["dianping__search_shops", "dianping__list_shop_deals", "dianping__prepare_voucher_checkout"],
        tags=("state_direct", "no_notes", "checkout_draft"),
        max_steps=35,
    ),
    spec(
        "dianping_v4_05_state_sukiyaki_setmeal_checkout",
        "大众点评：在一绪に寿喜烧(新街口店)的团购中找到「双人寿喜烧套餐」，"
        "准备下单购买3份（无需完成支付）。这个任务不需要记笔记。",
        ["dianping"],
        [],
        CHECKOUT_CHANGES,
        ["dianping__search_shops", "dianping__list_shop_deals", "dianping__prepare_voucher_checkout"],
        tags=("state_direct", "no_notes", "checkout_draft"),
        max_steps=35,
    ),
    # ----------------------------------------------------------- field_mismatch
    spec(
        "dianping_v4_06_field_dessert_taste_score",
        "大众点评：查一下PangPang·熊(仙林万达店)这家店「口味」这一项单独的评分具体是多少分"
        "（不是综合评分/总评分，就是口味这一个单项）。在笔记中新建标题为「甜品店口味单项评分」"
        "的笔记，记录门店名称与口味评分。",
        ["dianping", "notes"],
        [goal(
            "notes_note", title="甜品店口味单项评分",
            contains=["PangPang", "4.9"],
            not_contains=["4.8"],
        )],
        NOTES_CHANGES,
        ["dianping__search_shops", "dianping__get_shop_summary"],
        tags=("field_mismatch", "aggregate_vs_dimension"),
        max_steps=30,
    ),
    spec(
        "dianping_v4_07_field_coffee_taste_score",
        "大众点评：查一下瑞幸咖啡(南大仙林店)这家店「口味」这一项单独的评分具体是多少分"
        "（不是综合评分/总评分，就是口味这一个单项）。在笔记中新建标题为「咖啡店口味单项评分」"
        "的笔记，记录门店名称与口味评分。",
        ["dianping", "notes"],
        [goal(
            "notes_note", title="咖啡店口味单项评分",
            contains=["瑞幸", "4"],
            not_contains=["4.1", "4.2"],
        )],
        NOTES_CHANGES,
        ["dianping__search_shops", "dianping__get_shop_summary"],
        tags=("field_mismatch", "aggregate_vs_dimension"),
        max_steps=30,
    ),
    spec(
        "dianping_v4_08_field_hotpot_dish_price",
        "大众点评：查一下王和李·海鲜火锅大排档(万达茂店)菜单里「贵州红酸汤锅底」这道菜具体多少钱"
        "一份（不是人均消费，是这一道具体菜品的价格）。在笔记中新建标题为「火锅锅底价格核实」的"
        "笔记，记录菜品名称与价格。",
        ["dianping", "notes"],
        [goal(
            "notes_note", title="火锅锅底价格核实",
            contains=["贵州红酸汤锅底", "48"],
            not_contains=["94", "128", "20"],
        )],
        NOTES_CHANGES,
        ["dianping__search_shops", "dianping__list_recommended_dishes"],
        tags=("field_mismatch", "dish_price_outside_summary_top5"),
        max_steps=30,
    ),
    # ------------------------------------------------------- query_scan_mismatch
    spec(
        "dianping_v4_09_query_reviewcount_price_filter",
        "大众点评：在**全部**门店中（不限定在某几家具体店铺名单里，需要你自己从全部门店列表中"
        "筛选），找出唯一一家同时满足『评价数量超过500条』且『人均消费低于30元』这两个条件的门店。"
        "在笔记中新建标题为「评价数与人均筛选」的笔记，记录该门店名称、评价数量与人均消费。",
        ["dianping", "notes"],
        [goal(
            "notes_note", title="评价数与人均筛选",
            contains=["瑞幸", "520", "18"],
            not_contains=["杨国福", "640", "32"],
        )],
        NOTES_CHANGES,
        [],
        tags=("query_scan_mismatch", "multiconstraint", "global_filter", "no_tool_gui_fallback"),
        max_steps=45,
    ),
    spec(
        "dianping_v4_10_query_price_score_filter",
        "大众点评：在**全部**门店中（不限定在某几家具体店铺名单里，需要你自己从全部门店列表中"
        "筛选），找出唯一一家同时满足『人均消费低于40元』且『综合评分低于4.0分』这两个条件的门店。"
        "在笔记中新建标题为「低价低分筛选」的笔记，记录该门店名称、人均消费与综合评分。",
        ["dianping", "notes"],
        [goal(
            "notes_note", title="低价低分筛选",
            contains=["杨国福", "32", "3.9"],
            not_contains=["瑞幸", "18", "4.1"],
        )],
        NOTES_CHANGES,
        [],
        tags=("query_scan_mismatch", "multiconstraint", "global_filter", "no_tool_gui_fallback"),
        max_steps=45,
    ),
    spec(
        "dianping_v4_11_query_distance_score_filter",
        "大众点评：在**全部**门店中（不限定在某几家具体店铺名单里，需要你自己从全部门店列表中"
        "筛选），找出唯一一家同时满足『与当前位置的距离超过3000米』且『综合评分不低于4.4分』这两个"
        "条件的门店。在笔记中新建标题为「远距离高分筛选」的笔记，记录该门店名称、距离(米)与综合评分。",
        ["dianping", "notes"],
        [goal(
            "notes_note", title="远距离高分筛选",
            contains=["一绪", "3500", "4.5"],
            not_contains=["烤匠", "五月四", "4.3", "4.2", "7800", "3200"],
        )],
        NOTES_CHANGES,
        [],
        tags=("query_scan_mismatch", "multiconstraint", "global_filter", "no_tool_gui_fallback"),
        max_steps=45,
    ),
]

EXTRA_CHECKS = {
    "dianping_v4_03_state_seafood_setmeal_checkout": _voucher_prepared("wangheli", "vh2", 2),
    "dianping_v4_04_state_dessert_cake_checkout": _voucher_prepared("pangpang", "pp1", 2),
    "dianping_v4_05_state_sukiyaki_setmeal_checkout": _voucher_prepared("sushiya", "su1", 3),
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
