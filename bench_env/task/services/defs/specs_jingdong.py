"""Jingdong App-Tool boundary probes (services).

Unlike tasklib (which just exercises every Jingdong tool once),
this batch is designed to answer a narrower question: *are the Jingdong App
Tools actually useful, and where do they break down?* Four lenses, each backed
by facts verified against ``apps/Jingdong/data/defaults.json``:

- ``idinhand``: the agent already holds a concrete ``item_id``/``order_id``
  from a non-search surface (cart / favorites / footprints / orders list) and
  should call ``get_item_summary`` / ``compare_items`` / ``get_order_summary``
  to fetch fields that surface is *not* rendering on-screen (confirmed by
  reading ``CartPage.tsx`` / ``FavoritesPage.tsx`` / ``FootprintPage.tsx`` /
  ``OrdersPage.tsx`` — none of them show ``guobu``/``payMethod``/``item_total``)
  instead of re-searching by name.
- ``state_direct``: a concrete add-to-cart / prepare-checkout task, judged by
  diffing ``input.apps["jingdong"]`` directly (no Notes artifact).
- ``field_mismatch``: Jingdong's price stack is genuinely layered (原价 /
  国补到手价 / 国补已减金额 / 白条分期期数列表), so ``get_item_summary`` returns
  several adjacent-looking numeric fields for one item; the task asks for one
  specific field and the note must NOT contain the other plausible-looking
  fields for the very same item.
- ``query_scan_mismatch``: ``search_items`` requires a non-empty ``query``
  (see ``requireString`` in ``app_tools/core/errors.ts`` — this is enforced at
  runtime even though the JSON Schema does not mark it required for
  ``search_life_shops``), so there is no single call that lists the whole
  catalog. Both tasks here pick a numeric threshold that happens to span items
  with no shared category/tag token, so no clever single query shortcuts the
  scan either — the agent must either issue many queries or fall back to
  browsing every category in the GUI.
"""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
JINGDONG_CART_CHANGES = ["jingdong.cart"]


def _cart_line_added(item_id: str, sku_contains: str, min_qty: int = 1):
    """State-diff check: cart now has >= min_qty of item_id with a matching SKU."""

    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        cart_after = (input.apps.get("jingdong") or {}).get("cart") or []
        lines = [row for row in cart_after if isinstance(row, dict) and row.get("itemId") == item_id]
        qty = sum(int(row.get("qty") or 0) for row in lines)
        sku_ok = any(sku_contains in str(row.get("skuDesc") or "") for row in lines)
        return [{
            "field": "jingdong_cart_line_added",
            "expected": f"{item_id} qty>={min_qty}, sku_description contains '{sku_contains}'",
            "actual": lines,
            "passed": qty >= min_qty and sku_ok,
        }]
    return _check


def _cart_checked_state(expected: dict[str, bool]):
    """State-diff check: final cart lines' checked flags match exactly for the given itemIds."""

    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        cart_after = (input.apps.get("jingdong") or {}).get("cart") or []
        actual = {
            str(row.get("itemId")): bool(row.get("checked"))
            for row in cart_after
            if isinstance(row, dict)
        }
        passed = all(actual.get(item_id) == checked for item_id, checked in expected.items())
        return [{
            "field": "jingdong_cart_checked_state",
            "expected": expected,
            "actual": actual,
            "passed": passed,
        }]
    return _check


SPECS = [
    # ---------------------------------------------------------------- idinhand
    spec(
        "jingdong_v4_01_cart_unique_guobu",
        "打开京东购物车，购物车里目前一共有4件商品（不论是否勾选）。购物车页面本身不会显示商品是否参加国家补贴，"
        "请用工具查询这4件商品，找出其中唯一一款参加国家补贴（国补）的商品。"
        "在笔记中新建标题为「购物车国补核查」的笔记，记录该商品的完整名称与国补已减金额。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="购物车国补核查",
            contains=["联想ThinkBook", "1169.85"],
            not_contains=["旺仔牛奶", "湾仔码头", "抗敏感牙膏"],
        )],
        NOTES_CHANGES,
        ["jingdong__get_cart", "jingdong__get_item_summary", "jingdong__compare_items"],
        tags=("idinhand", "cart"),
        max_steps=36,
    ),
    spec(
        "jingdong_v4_02_footprints_guobu_compare",
        "打开京东『我的足迹』，查看『今天』分组下浏览过的商品（足迹卡片只显示名称和价格，不显示是否参加国家补贴）。"
        "用工具查询这些商品中参加国家补贴的都有哪些，并找出国补优惠金额更大的一款。"
        "在笔记中新建标题为「足迹国补对比」的笔记，记录参加国补的商品名称、各自的国补优惠金额。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="足迹国补对比",
            contains=["联想ThinkBook", "1169.85", "vivo X300", "900"],
            not_contains=["漫步者", "黑爵"],
        )],
        NOTES_CHANGES,
        ["jingdong__compare_items", "jingdong__get_item_summary"],
        tags=("idinhand", "footprints"),
        max_steps=38,
    ),
    spec(
        "jingdong_v4_03_favorites_price_gap",
        "打开京东『我的收藏』，收藏夹中共有6件商品。用工具比较这6件商品的价格，找出价格最高和价格最低的两件，"
        "计算两者的价格差。在笔记中新建标题为「收藏夹价差核算」的笔记，记录这6件商品的总数量、最贵和最便宜的两件商品名称"
        "与价格，以及两者的价格差。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="收藏夹价差核算",
            contains=["6", "联想ThinkBook", "6629.15", "湾仔码头", "29.8", "6599.35"],
            not_contains=["329", "248", "69.1"],
        )],
        NOTES_CHANGES,
        ["jingdong__compare_items"],
        tags=("idinhand", "favorites", "compare"),
        max_steps=38,
    ),
    spec(
        "jingdong_v4_04_baitiao_orders_diff",
        "打开京东『我的订单』列表，找到商品为『联想ThinkBook』笔记本电脑的那笔订单，以及商品为『vivo X300』手机的那笔订单"
        "（订单列表卡片不会显示商品总价，只有已付金额——其中笔记本电脑那笔还未付款，已付金额是0，不能直接当作商品总价用）。"
        "用工具查询这两笔订单各自的商品总价（item_total），计算两者的差值。"
        "在笔记中新建标题为「白条订单差价」的笔记，记录两笔订单对应的商品名称、各自的商品总价，以及差值。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="白条订单差价",
            contains=["联想ThinkBook", "6629.15", "vivo X300", "4099", "2530.15"],
            not_contains=["368.8", "46.24", "47.1"],
        )],
        NOTES_CHANGES,
        ["jingdong__list_orders", "jingdong__get_order_summary"],
        tags=("idinhand", "orders", "compare"),
        max_steps=42,
    ),
    # ------------------------------------------------------------ state_direct
    spec(
        "jingdong_v4_05_monitor_guobu_addcart",
        "在京东『电脑办公』这个品类下，找出到手价格低于1000元、并且享受国家补贴的唯一一款商品"
        "（该品类下另一款享受国补的商品价格远高于1000元），将其加入购物车：尺寸选27寸，数量1件。",
        ["jingdong"],
        [],
        JINGDONG_CART_CHANGES,
        ["jingdong__search_items", "jingdong__compare_items", "jingdong__add_to_cart"],
        tags=("state_direct", "guobu", "cart"),
        max_steps=32,
    ),
    spec(
        "jingdong_v4_06_cart_checkout_select",
        "打开京东购物车，购物车里当前有4行商品：『旺旺 旺仔牛奶』『联想ThinkBook』『湾仔码头 白菜猪肉水饺』『抗敏感牙膏』，"
        "其中『联想ThinkBook』这一行目前是未勾选状态，其余3行都是已勾选状态。"
        "请只勾选『旺旺 旺仔牛奶』和『抗敏感牙膏』这两行进入结算页面（取消其余所有行的勾选，包括原本已勾选的"
        "『湾仔码头 白菜猪肉水饺』），不要提交支付。",
        ["jingdong"],
        [],
        JINGDONG_CART_CHANGES,
        ["jingdong__get_cart", "jingdong__prepare_checkout"],
        tags=("state_direct", "checkout"),
        max_steps=32,
    ),
    spec(
        "jingdong_v4_07_keyboard_addcart",
        "把京东『黑爵 机械键盘 RGB背光 电竞游戏有线键盘』加入购物车，轴体选青轴，数量3件。",
        ["jingdong"],
        [],
        JINGDONG_CART_CHANGES,
        ["jingdong__search_items", "jingdong__add_to_cart"],
        tags=("state_direct", "cart"),
        max_steps=28,
    ),
    # ----------------------------------------------------------- field_mismatch
    spec(
        "jingdong_v4_08_thinkbook_original_price",
        "查询京东『联想ThinkBook 14+』这款笔记本电脑，找出它不叠加国家补贴时的划线原价（不是国补后的到手价）。"
        "在笔记中新建标题为「笔记本原价核实」的笔记，记录商品名称与原价。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="笔记本原价核实",
            contains=["联想ThinkBook", "7799"],
            not_contains=["6629", "6629.15", "4999", "3999"],
        )],
        NOTES_CHANGES,
        ["jingdong__search_items", "jingdong__get_item_summary"],
        tags=("field_mismatch", "price"),
        max_steps=30,
    ),
    spec(
        "jingdong_v4_09_fridge_guobu_off",
        "查询京东『海尔 对开门大冰箱』，找出国家补贴一共帮它减免了多少钱，也就是国补优惠金额本身"
        "（不是到手价，也不是原价）。在笔记中新建标题为「冰箱国补优惠核实」的笔记，记录商品名称与国补优惠金额。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="冰箱国补优惠核实",
            contains=["海尔", "720"],
            not_contains=["2879", "3599", "80元", "200元"],
        )],
        NOTES_CHANGES,
        ["jingdong__search_items", "jingdong__get_item_summary"],
        tags=("field_mismatch", "price", "guobu"),
        max_steps=30,
    ),
    spec(
        "jingdong_v4_10_phonev_baitiao_longest",
        "查询京东『vivo X300』这款手机支持的京东白条免息分期期数选项，找出其中最长的免息期数（不是最短的那个）。"
        "在笔记中新建标题为「白条期数核实」的笔记，记录商品名称与最长免息期数。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="白条期数核实",
            contains=["vivo X300", "12"],
            not_contains=["6期"],
        )],
        NOTES_CHANGES,
        ["jingdong__search_items", "jingdong__get_item_summary"],
        tags=("field_mismatch", "baitiao"),
        max_steps=30,
    ),
    # ------------------------------------------------------- query_scan_mismatch
    spec(
        "jingdong_v4_11_scan_price_under20",
        "在京东商城全场（不限分类）范围内，找出目前到手价格低于20元的商品，一共有几款？分别是什么名称，价格多少？"
        "在笔记中新建标题为「全场低价普查」的笔记，记录商品总数量，以及每款商品的名称与价格。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="全场低价普查",
            contains=["4", "乌江", "9.9", "山头林村", "14.78", "抗敏感牙膏", "19.9", "原生木浆本色卷纸"],
            not_contains=["23.9", "24.9", "29.9", "怡宝", "麒麟西瓜"],
        )],
        NOTES_CHANGES,
        ["jingdong__search_items"],
        tags=("query_scan_mismatch", "browse"),
        max_steps=50,
    ),
    spec(
        "jingdong_v4_12_scan_reviews_over20k",
        "在京东商城全场（不限分类）范围内，找出评价数量（评价条数，不是好评率）超过2万条的商品，一共有几款？"
        "分别是什么名称，评价数量多少？在笔记中新建标题为「评价大户普查」的笔记，记录商品总数量，"
        "以及每款商品的名称与评价数量。",
        ["jingdong", "notes"],
        [goal(
            "notes_note", title="评价大户普查",
            contains=["2", "原生木浆本色卷纸", "25100", "农夫山泉", "31200"],
            not_contains=["12800", "9600", "8600"],
        )],
        NOTES_CHANGES,
        ["jingdong__search_items"],
        tags=("query_scan_mismatch", "browse"),
        max_steps=50,
    ),
]

EXTRA_CHECKS = {
    "jingdong_v4_05_monitor_guobu_addcart": _cart_line_added("i_monitor", "27寸", 1),
    "jingdong_v4_06_cart_checkout_select": _cart_checked_state({
        "i_wangzai": True,
        "i_toothpaste": True,
        "i_dumpling": False,
        "i_thinkbook": False,
    }),
    "jingdong_v4_07_keyboard_addcart": _cart_line_added("i_keyboard", "青轴", 3),
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
