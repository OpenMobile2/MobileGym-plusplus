"""Kapi (卡皮记账) hybrid GUI+Tools tasks -- tool-boundary probe (services).

Every fact/number referenced below was independently recomputed from
``apps/Kapi/data/defaults.json`` (18 seeded bills, all on ledger ``l_main``,
all dated 2026-06-01..2026-06-12) -- see the docstring of
``tasklib/defs/specs_kapi.py`` for the same base-fact set.
This file deliberately avoids repeating any task_id/scenario already covered
by v1's 12 Kapi tasks, v2's ``multiconstraint_01_kapi_midrange_categories``,
or v3's ``state_02_kapi_bill_multifield``.

Four categories (see ``services/__init__.py`` for the overall
suite rationale):

1. ``idinhand`` (2 tasks) -- the agent locates one concrete bill via
   ``search_bills`` (by note keyword), then must use ``get_category_summary``
   (and, in one task, ``open_bill``) to answer a question about the bill's
   *category*, rather than re-deriving the number by hand or conflating the
   single bill's own amount with the category aggregate.
2. ``state_direct`` (3 tasks) -- new ``prepare_bill_draft`` write tasks with
   category/amount/note/date combinations disjoint from v3's 购物/128.5 case,
   including one income-type draft (tests that the agent remembers to pass
   ``type: 'income'``, since the tool defaults to ``'expense'``) and one that
   uses the top-level category "火锅", which is easy to confuse with the
   *note text* "火锅 AA" recorded under the unrelated "餐饮" category (b016).
3. ``field_mismatch`` (3 tasks) -- ``get_category_summary`` (confirmed by
   reading ``app_tools/apps/kapi/index.ts``'s ``expenseByCategory`` call)
   aggregates strictly by top-level ``categoryId``; it has no notion of the
   ``subs`` sub-category names shown on the category drill-down page. "餐饮"
   is the only category with declared subs (早餐/午餐/晚餐/水果/放纵餐), and
   none of the 4 "餐饮" bills' notes literally match "放纵餐", while "水果"
   is *also* a separate top-level category name with its own real bill
   (b012, 23.8, "水果" 类目) -- a genuine homonym trap. These tasks ask for a
   specific 二级子类目's exact spend, which no tool call can produce; the
   correct answer requires recognizing that "餐饮" 类目下 no bill matches
   the sub-category text (answer: 0) and that the top-level "水果" total is
   a different question entirely -- versus confidently reporting the
   category-level aggregate (168.4) or the unrelated top-level total (23.8).
4. ``query_scan_mismatch`` (2 tasks) -- ``search_bills``'s ``query`` param is
   actually optional (confirmed in ``definitions.ts``/``index.ts``) and its
   ``limit`` cap (50) comfortably covers all 18 seeded bills, so there is no
   genuine "must supply a keyword, can't list everything" wall here (unlike
   the Dianping/multiconstraint case this suite's docstring cites). What *is*
   missing is any amount-range or category filter parameter: ``search_bills``
   can only filter by free-text query / type / date / ledger, so a
   full-catalog numeric-threshold scan still requires dumping the whole
   result set and filtering client-side rather than a single precise call.
   Flagged as a softer/uncertain instance of this category in the final
   report -- see the task-authoring note below.
"""

from __future__ import annotations

import datetime
from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
KAPI_BILL_CHANGES = ["kapi.bills"]


def _seed_bill(
    bid: str, category_id: str, category_name: str, icon: str, color: str,
    amount: float, note: str, day: int, hour: int, minute: int,
    *, type_: str = "expense", payee: str = "",
) -> dict[str, Any]:
    # This suite intentionally uses its own reproducible June profile.  The
    # default Kapi app dataset is a richer multi-month profile and must not be
    # silently mixed with the verifier expectations below.
    date = datetime.datetime(2026, 6, day, hour, minute, tzinfo=datetime.timezone.utc)
    return {
        "id": bid, "type": type_, "categoryId": category_id,
        "categoryName": category_name, "icon": icon, "color": color,
        "amount": amount, "note": note, "date": date.timestamp() * 1000,
        "ledgerId": "l_main", "accountId": None, "payee": payee,
        "tags": [], "discount": None, "refund": None, "reimburse": False,
        "excludeFlow": False, "excludeBudget": False,
    }


KAPI_JUNE_V4_BILLS = [
    _seed_bill("v4_b001", "c_food", "餐饮", "IcCatFood", "#FFB23E", 70, "午餐 黄焖鸡米饭", 12, 12, 47, payee="老乡鸡"),
    _seed_bill("v4_b002", "c_food", "餐饮", "IcCatFood", "#FFB23E", 31.2, "晚餐 麻辣烫", 11, 19, 5, payee="杨国福"),
    _seed_bill("v4_b003", "c_milktea", "奶茶", "IcCatMilkTea", "#C58BFF", 18, "奶茶 葡萄冰沙", 11, 15, 30, payee="喜茶"),
    _seed_bill("v4_b004", "c_transport", "交通", "IcCatTransport", "#FF8A3D", 12.5, "地铁通勤", 10, 8, 40),
    _seed_bill("v4_b005", "c_shopping", "购物", "IcCatShopping", "#5B8CFF", 268, "夏季T恤两件", 9, 21, 12, payee="优衣库"),
    _seed_bill("v4_b006", "c_food", "餐饮", "IcCatFood", "#FFB23E", 25.2, "早餐 包子豆浆", 9, 8, 10),
    _seed_bill("v4_b007", "c_grocery", "做饭食材", "IcCatGrocery", "#7BC86C", 88.6, "周末买菜", 8, 10, 30, payee="盒马"),
    _seed_bill("v4_b008", "c_coffee", "咖啡", "IcCatCoffee", "#B07A4F", 32, "拿铁 大杯", 8, 14, 0, payee="瑞幸"),
    _seed_bill("v4_b009", "c_leisure", "休闲娱乐", "IcCatLeisure", "#7C8BFF", 45, "电影票", 7, 20, 0, payee="万达影城"),
    _seed_bill("v4_b010", "c_housing", "住房", "IcCatHousing", "#FF7A59", 1500, "六月房租分摊", 5, 9, 0),
    _seed_bill("v4_b011", "c_medical", "医疗健康", "IcCatMedical", "#5AD0C0", 56, "感冒药", 5, 18, 20, payee="老百姓大药房"),
    _seed_bill("v4_b012", "c_fruit", "水果", "IcCatFruit", "#6FCF6B", 23.8, "车厘子半斤", 4, 19, 30, payee="百果园"),
    _seed_bill("v4_b013", "c_snack", "零食", "IcCatSnack", "#FFB661", 39.9, "零食大礼包", 3, 16, 45, payee="良品铺子"),
    _seed_bill("v4_b014", "c_transport", "交通", "IcCatTransport", "#FF8A3D", 28, "打车回家", 3, 23, 10, payee="滴滴出行"),
    _seed_bill("v4_b015", "c_study", "学习办公", "IcCatStudy", "#5B9BFF", 99, "在线课程", 2, 13, 0),
    _seed_bill("v4_b016", "c_food", "餐饮", "IcCatFood", "#FFB23E", 42, "火锅 AA", 1, 19, 30, payee="海底捞"),
    _seed_bill("v4_b017", "i_salary", "职业收入", "IcCatSalary", "#FF8A3D", 12000, "五月工资", 10, 10, 0, type_="income"),
    _seed_bill("v4_b018", "i_parttime", "兼职收入", "IcCatPartTime", "#5B8CFF", 600, "周末兼职", 6, 10, 0, type_="income"),
]


def _day_window(year: int, month: int, day: int) -> tuple[float, float]:
    target = datetime.datetime(year, month, day, tzinfo=datetime.timezone.utc)
    lo = (target - datetime.timedelta(days=1)).timestamp() * 1000
    hi = (target + datetime.timedelta(days=2)).timestamp() * 1000
    return lo, hi


def _bill_written(
    *,
    type_: str = "expense",
    category_name: str,
    amount: float,
    amount_tol: float,
    note_contains: str,
    date_ymd: tuple[int, int, int],
):
    lo, hi = _day_window(*date_ymd)

    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        init_ids = {str(row.get("id")) for row in ((input.apps_init.get("kapi") or {}).get("bills") or [])}
        final = list((input.apps.get("kapi") or {}).get("bills") or [])
        matches = [
            row for row in final
            if str(row.get("id")) not in init_ids
            and row.get("type") == type_
            and row.get("categoryName") == category_name
            and abs(float(row.get("amount") or 0) - amount) <= amount_tol
            and note_contains in str(row.get("note") or "")
            and lo <= float(row.get("date") or -1) <= hi
        ]
        return [{
            "field": "kapi_bill_written",
            "expected": (
                f"new bill: type={type_}, category={category_name}, amount~={amount}, "
                f"note contains '{note_contains}', date~={date_ymd[0]}-{date_ymd[1]:02d}-{date_ymd[2]:02d}"
            ),
            "actual": final,
            "passed": bool(matches),
        }]

    return _check


SPECS = [
    # ---------------------------------------------------------------- idinhand
    spec(
        "kapi_v4_01_transport_topbill_category_summary",
        "在卡皮记账中查看「交通」类目下的所有账单，找出其中金额最高的一笔，打开该笔账单的详情页确认商家（收款方）名称；"
        "再查询2026年6月1日至6月12日期间「交通」类目的汇总支出总额。"
        "在笔记中新建标题为「交通账单核实」的笔记，记录该笔账单的商家名称，以及交通类目在这段时间内的汇总支出总额。",
        ["kapi", "notes"],
        [goal(
            "notes_note", title="交通账单核实",
            contains=["滴滴出行", "交通", "40.5"],
            not_contains=["12.5"],
        )],
        NOTES_CHANGES,
        ["kapi__search_bills", "kapi__open_bill", "kapi__get_category_summary"],
        tags=("idinhand", "query_then_action"),
        max_steps=40,
    ),
    spec(
        "kapi_v4_02_dinner_bill_category_summary",
        "在卡皮记账中找到备注为「晚餐 麻辣烫」的账单，确认它所属的一级消费类目，"
        "再查询2026年6月1日至6月12日期间该类目的汇总支出总额，以及该类目占当期总支出的百分比。"
        "在笔记中新建标题为「晚餐账单类目核实」的笔记，记录该账单所属类目名称、该类目区间汇总支出金额与占比。",
        ["kapi", "notes"],
        [goal(
            "notes_note", title="晚餐账单类目核实",
            contains=["餐饮", "168.4", "7.1"],
            not_contains=["31.2"],
        )],
        NOTES_CHANGES,
        ["kapi__search_bills", "kapi__get_category_summary"],
        tags=("idinhand", "query_then_action"),
        max_steps=35,
    ),
    # ------------------------------------------------------------- state_direct
    spec(
        "kapi_v4_03_bbq_bill_multifield",
        "打开卡皮记账，手动记一笔支出：类目选择「烧烤」，金额填156元，备注写「朋友聚会烧烤」，"
        "日期设置为2026年6月18日，完成保存。这个任务不需要记笔记。",
        ["kapi"],
        [],
        KAPI_BILL_CHANGES,
        ["kapi__prepare_bill_draft"],
        tags=("state_direct", "no_notes", "multi_field"),
        max_steps=35,
    ),
    spec(
        "kapi_v4_04_hotpot_category_bill",
        "打开卡皮记账，手动记一笔支出：类目选择「火锅」，金额填88元，备注写「和同事聚餐」，"
        "日期设置为2026年6月20日，完成保存。这个任务不需要记笔记。",
        ["kapi"],
        [],
        KAPI_BILL_CHANGES,
        ["kapi__prepare_bill_draft"],
        tags=("state_direct", "no_notes", "multi_field", "category_trap"),
        max_steps=35,
    ),
    spec(
        "kapi_v4_05_invest_income_bill",
        "打开卡皮记账，手动记一笔收入：类目选择「投资收益」，金额填350元，备注写「基金分红」，"
        "日期设置为2026年6月22日，完成保存。这个任务不需要记笔记。",
        ["kapi"],
        [],
        KAPI_BILL_CHANGES,
        ["kapi__prepare_bill_draft"],
        tags=("state_direct", "no_notes", "multi_field", "income_type"),
        max_steps=35,
    ),
    # ----------------------------------------------------------- field_mismatch
    spec(
        "kapi_v4_06_indulge_meal_subcategory",
        "卡皮记账「餐饮」类目下设有二级子类目「放纵餐」。请核实2026年6月1日至6月12日期间"
        "「放纵餐」这个二级子类目的具体支出总额。在笔记中新建标题为「放纵餐支出核实」的笔记，"
        "记录该子类目在这段时间内的具体支出金额；如果没有找到相关支出记录，请记录为0元。",
        ["kapi", "notes"],
        [goal(
            "notes_note", title="放纵餐支出核实",
            contains=["放纵餐", "0元"],
            not_contains=["168.4"],
        )],
        NOTES_CHANGES,
        ["kapi__open_category", "kapi__search_bills", "kapi__get_category_summary"],
        tags=("field_mismatch", "no_tool_gui_fallback"),
        max_steps=40,
    ),
    spec(
        "kapi_v4_07_food_fruit_subcategory_collision",
        "卡皮记账「餐饮」类目下设有二级子类目「水果」。请核实2026年6月1日至6月12日期间，"
        "「餐饮」类目下「水果」这个二级子类目的具体支出总额（注意这与独立的「水果」一级类目不是一回事）。"
        "在笔记中新建标题为「餐饮水果支出核实」的笔记，记录该数值；如果没有找到相关支出记录，请记录为0元。",
        ["kapi", "notes"],
        [goal(
            "notes_note", title="餐饮水果支出核实",
            contains=["水果", "0元"],
            not_contains=["23.8"],
        )],
        NOTES_CHANGES,
        ["kapi__open_category", "kapi__search_bills", "kapi__get_category_summary"],
        tags=("field_mismatch", "no_tool_gui_fallback"),
        max_steps=40,
    ),
    spec(
        "kapi_v4_08_breakfast_subcategory_amount",
        "卡皮记账「餐饮」类目下设有二级子类目「早餐」。请核实2026年6月1日至6月12日期间"
        "「早餐」这个二级子类目的具体支出总额。在笔记中新建标题为「早餐支出核实」的笔记，记录该数值。",
        ["kapi", "notes"],
        [goal(
            "notes_note", title="早餐支出核实",
            contains=["早餐", "25.2"],
            not_contains=["168.4"],
        )],
        NOTES_CHANGES,
        ["kapi__open_category", "kapi__search_bills", "kapi__get_category_summary"],
        tags=("field_mismatch", "no_tool_gui_fallback"),
        max_steps=35,
    ),
    # ------------------------------------------------------- query_scan_mismatch
    spec(
        "kapi_v4_09_large_expense_fullscan",
        "在卡皮记账中，找出2026年6月1日至6月12日期间所有金额超过50元的支出账单（不限类目），"
        "按金额从高到低在笔记中记录每一笔账单所属的类目名称与金额，并记录符合条件的账单总数。"
        "笔记标题为「大额支出清单」。",
        ["kapi", "notes"],
        [goal(
            "notes_note", title="大额支出清单",
            contains=[
                "住房", "1500", "购物", "268", "学习办公", "99",
                "做饭食材", "88.6", "餐饮", "70", "医疗健康", "56", "6",
            ],
            not_contains=["休闲娱乐", "45"],
        )],
        NOTES_CHANGES,
        ["kapi__search_bills"],
        tags=("query_scan_mismatch", "global_filter"),
        max_steps=45,
    ),
    spec(
        "kapi_v4_10_small_expense_exclude_transport",
        "在卡皮记账中，找出2026年6月1日至6月12日期间除「交通」类目外，金额低于30元的所有支出账单，"
        "在笔记中记录每笔账单所属的类目名称、金额与备注内容，并记录符合条件的账单总数。"
        "笔记标题为「小额消费清单」。",
        ["kapi", "notes"],
        [goal(
            "notes_note", title="小额消费清单",
            contains=[
                "奶茶", "18", "奶茶 葡萄冰沙",
                "餐饮", "25.2", "早餐 包子豆浆",
                "水果", "23.8", "车厘子半斤",
                "3",
            ],
            not_contains=["交通", "12.5", "28"],
        )],
        NOTES_CHANGES,
        ["kapi__search_bills"],
        tags=("query_scan_mismatch", "global_filter"),
        max_steps=45,
    ),
]

EXTRA_CHECKS = {
    "kapi_v4_03_bbq_bill_multifield": _bill_written(
        category_name="烧烤", amount=156.0, amount_tol=0.5,
        note_contains="烧烤", date_ymd=(2026, 6, 18),
    ),
    "kapi_v4_04_hotpot_category_bill": _bill_written(
        category_name="火锅", amount=88.0, amount_tol=0.5,
        note_contains="聚餐", date_ymd=(2026, 6, 20),
    ),
    "kapi_v4_05_invest_income_bill": _bill_written(
        type_="income", category_name="投资收益", amount=350.0, amount_tol=0.5,
        note_contains="分红", date_ymd=(2026, 6, 22),
    ),
}

PREPARE_STATE = {
    item.task_id: {"kapi": {"bills": KAPI_JUNE_V4_BILLS}}
    for item in SPECS
}

build_task_classes(
    SPECS,
    EXTRA_CHECKS,
    module_globals=globals(),
    module_name=__name__,
    prepare_states=PREPARE_STATE,
)
