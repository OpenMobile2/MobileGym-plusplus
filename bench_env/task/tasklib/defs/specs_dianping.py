"""Dianping (大众点评 / local-life review & deal-voucher app) hybrid GUI+Tools tasks
(tasklib).

Tools already exist (app_tools/apps/dianping). Verification follows the
newapps_v1 pattern: every task's primary artifact is a Notes entry
(``notes_note`` goal), plus inline state-diff checks for the two low-risk
write actions (favorite a shop / prepare a voucher checkout draft).
"""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
FAVORITE_CHANGES = ["dianping.favoriteShopIds"]
CHECKOUT_CHANGES = ["dianping.pendingCheckout"]


def _favorite_added(shop_id: str):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        initial = list((input.apps_init.get("dianping") or {}).get("favoriteShopIds") or [])
        final = list((input.apps.get("dianping") or {}).get("favoriteShopIds") or [])
        passed = shop_id not in initial and shop_id in final
        return [{
            "field": "dianping_favorite_added",
            "expected": f"{shop_id} newly favorited",
            "actual": final,
            "passed": passed,
        }]
    return _check


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
    spec(
        "dianping_01_dessert_score_top",
        "比较大众点评上瑞幸咖啡(南大仙林店)、野人先生现做冰淇淋、PangPang·熊(仙林万达店)三家店的评分，"
        "找出评分最高的一家，在笔记中新建标题为「甜品店评分对比」的笔记，记录该店铺名称与评分。",
        ["dianping", "notes"],
        [goal("notes_note", title="甜品店评分对比", contains=["PangPang", "4.8"])],
        NOTES_CHANGES,
        ["dianping__search_shops", "dianping__get_shop_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "dianping_02_price_lowest",
        "比较大众点评上王和李·海鲜火锅大排档(万达茂店)、一绪に寿喜烧(新街口店)、烤匠·炭火烤肉三家店的人均消费，"
        "找出人均最低的一家，在笔记中新建标题为「人均消费对比」的笔记，记录该店铺名称与人均价格。",
        ["dianping", "notes"],
        [goal("notes_note", title="人均消费对比", contains=["烤匠", "85"])],
        NOTES_CHANGES,
        ["dianping__search_shops", "dianping__get_shop_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "dianping_03_nearest_distance",
        "比较大众点评上瑞幸咖啡(南大仙林店)、杨国福麻辣烫(仙林店)、王和李·海鲜火锅大排档(万达茂店)三家店与当前位置的距离，"
        "找出距离最近的一家，在笔记中新建标题为「最近店铺」的笔记，记录该店铺名称与距离(米)。",
        ["dianping", "notes"],
        [goal("notes_note", title="最近店铺", contains=["瑞幸", "180"])],
        NOTES_CHANGES,
        ["dianping__search_shops", "dianping__get_shop_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "dianping_04_dish_recommend_pk",
        "在大众点评中分别查看王和李·海鲜火锅大排档(万达茂店)和烤匠·炭火烤肉两家店推荐菜榜首(推荐人数最多的菜品)，"
        "比较两者的推荐人数，在笔记中新建标题为「推荐菜PK」的笔记，记录被推荐次数更多的那道菜的名称、所属店铺与推荐人数。",
        ["dianping", "notes"],
        [goal("notes_note", title="推荐菜PK", contains=["大生蚝", "王和李", "131"])],
        NOTES_CHANGES,
        ["dianping__search_shops", "dianping__list_recommended_dishes"],
        tags=("browse", "compare"),
    ),
    spec(
        "dianping_05_favorite_night_snack",
        "在大众点评中找到带有「夜宵」标签的店铺，把这家店收藏，"
        "并在笔记中新建标题为「夜宵收藏」的笔记，记录该店铺名称与人均消费。",
        ["dianping", "notes"],
        [goal("notes_note", title="夜宵收藏", contains=["五月四", "76"])],
        NOTES_CHANGES + FAVORITE_CHANGES,
        ["dianping__search_shops", "dianping__get_shop_summary", "dianping__add_favorite_shop"],
        tags=("query_then_action", "favorite"),
    ),
    spec(
        "dianping_06_coffee_voucher_draft",
        "在大众点评的瑞幸咖啡(南大仙林店)店铺页中找到「生椰拿铁兑换券」，准备购买3张（无需完成支付），"
        "并在笔记中新建标题为「咖啡券待付」的笔记，记录券名称、单价与准备购买的数量。",
        ["dianping", "notes"],
        [goal("notes_note", title="咖啡券待付", contains=["生椰拿铁兑换券", "9.9", "3"])],
        NOTES_CHANGES + CHECKOUT_CHANGES,
        ["dianping__search_shops", "dianping__list_shop_deals", "dianping__prepare_voucher_checkout"],
        tags=("query_then_action", "checkout_draft"),
    ),
    spec(
        "dianping_07_bbq_party_voucher_draft",
        "在大众点评的烤匠·炭火烤肉店铺团购中找到「三人烤肉欢聚餐」，准备下单购买2份（无需完成支付），"
        "在笔记中新建标题为「烤肉聚会计划」的笔记，记录套餐名称、售价与准备购买的份数。",
        ["dianping", "notes"],
        [goal("notes_note", title="烤肉聚会计划", contains=["三人烤肉欢聚餐", "219", "2"])],
        NOTES_CHANGES + CHECKOUT_CHANGES,
        ["dianping__search_shops", "dianping__list_shop_deals", "dianping__prepare_voucher_checkout"],
        tags=("query_then_action", "checkout_draft"),
    ),
    spec(
        "dianping_08_favorite_top_score_pick",
        "在大众点评中比较杨国福麻辣烫(仙林店)、烤匠·炭火烤肉、一绪に寿喜烧(新街口店)三家店的评分，"
        "找出评分最高的一家，将其收藏，并在笔记中新建标题为「优选收藏」的笔记，记录该店铺名称与评分。",
        ["dianping", "notes"],
        [goal("notes_note", title="优选收藏", contains=["一绪に寿喜烧", "4.5"])],
        NOTES_CHANGES + FAVORITE_CHANGES,
        ["dianping__search_shops", "dianping__get_shop_summary", "dianping__add_favorite_shop"],
        tags=("query_then_action", "favorite"),
    ),
    spec(
        "dianping_09_malatang_review_fulltext",
        "在大众点评杨国福麻辣烫(仙林店)的评价中，找到标签为「推荐」的那一条评价，打开查看完整评价内容，"
        "在笔记中新建标题为「麻辣烫好评」的笔记，记录该评价的评价人昵称和完整评价原文。",
        ["dianping", "notes"],
        [goal("notes_note", title="麻辣烫好评", contains=["辣度挑战", "微辣刚刚好"])],
        NOTES_CHANGES,
        ["dianping__search_shops", "dianping__search_reviews", "dianping__open_review"],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "dianping_10_note_fulltext",
        "在大众点评首页信息流中找到笔记「手绘蛋糕也太精致了」，打开查看完整内容，"
        "在笔记中新建标题为「蛋糕笔记摘录」的笔记，记录该笔记作者昵称与正文内容。",
        ["dianping", "notes"],
        [goal("notes_note", title="蛋糕笔记摘录", contains=["甜品日记", "生日预定冲"])],
        NOTES_CHANGES,
        [],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "dianping_11_merchant_reply",
        "在大众点评「我的」个人主页的评价列表中找到你在一绪に寿喜烧(新街口店)发布的评价，"
        "打开该评价查看商家回复，在笔记中新建标题为「商家回复记录」的笔记，记录商家回复的完整内容。",
        ["dianping", "notes"],
        [goal("notes_note", title="商家回复记录", contains=["真心感谢您带给一绪的鼓励"])],
        NOTES_CHANGES,
        [],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "dianping_12_rank_top1",
        "打开大众点评榜单页默认的「热门榜」，找出排名第一(TOP01)的店铺，"
        "在笔记中新建标题为「热门榜TOP1」的笔记，记录该店铺名称。",
        ["dianping", "notes"],
        [goal("notes_note", title="热门榜TOP1", contains=["杨国福麻辣烫"])],
        NOTES_CHANGES,
        [],
        tags=("no_tool_gui_fallback", "browse"),
    ),
]

EXTRA_CHECKS = {
    "dianping_05_favorite_night_snack": _favorite_added("wuyuesi"),
    "dianping_06_coffee_voucher_draft": _voucher_prepared("luckin", "lk1", 3),
    "dianping_07_bbq_party_voucher_draft": _voucher_prepared("bbqking", "bb1", 2),
    "dianping_08_favorite_top_score_pick": _favorite_added("sushiya"),
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
