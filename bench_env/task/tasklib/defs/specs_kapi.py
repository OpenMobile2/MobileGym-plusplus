"""Kapi (卡皮记账) hybrid GUI+Tools tasks (tasklib).

Facts referenced in instructions/notes all come from apps/Kapi/data/defaults.json:
all 18 seeded bills fall within 2026-06-01..2026-06-12 on ledger l_main, so every
query/compare task pins that explicit date range rather than relying on the
app's "current month" (which drifts with real wall-clock time).
"""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
KAPI_BILL_CHANGES = ["kapi.bills"]


def _bill_added(category_id: str, amount: float, min_count: int = 1):
    def _matches(bill: Any) -> bool:
        return (
            isinstance(bill, dict)
            and bill.get("type") == "expense"
            and bill.get("categoryId") == category_id
            and abs(float(bill.get("amount") or 0) - amount) < 0.01
        )

    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        init_bills = (input.apps_init.get("kapi") or {}).get("bills") or []
        init_ids = {str(b.get("id")) for b in init_bills if _matches(b)}
        cur_bills = (input.apps.get("kapi") or {}).get("bills") or []
        new_matches = [b for b in cur_bills if _matches(b) and str(b.get("id")) not in init_ids]
        passed = len(new_matches) >= min_count
        return [{
            "field": "kapi_bill_added",
            "expected": f"{category_id} amount=={amount} count>={min_count}",
            "actual": new_matches,
            "passed": passed,
        }]
    return _check


SPECS = [
    spec(
        "kapi_01_food_vs_transport_diff",
        "查看卡皮记账2026年6月1日至6月12日期间「餐饮」和「交通」两个类目的支出总额，计算两者的差额，"
        "在笔记中新建标题为「餐饮交通对比」的笔记，记录这两个类目各自的支出总额与差额。",
        ["kapi", "notes"],
        [goal("notes_note", title="餐饮交通对比", contains=["餐饮", "168.4", "交通", "40.5", "127.9"])],
        NOTES_CHANGES,
        ["kapi__get_category_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "kapi_02_expense_category_extremes",
        "查看卡皮记账2026年6月1日至6月12日期间各类目的支出汇总，找出支出金额最高与最低的两个类目，"
        "在笔记中新建标题为「支出类目极值」的笔记，记录这两个类目的名称与金额。",
        ["kapi", "notes"],
        [goal("notes_note", title="支出类目极值", contains=["住房", "1500", "奶茶", "18"])],
        NOTES_CHANGES,
        ["kapi__get_category_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "kapi_03_june_net_balance",
        "统计卡皮记账2026年6月1日至6月12日期间的总收入与总支出，计算净结余金额，"
        "在笔记中新建标题为「六月结余」的笔记，记录总收入、总支出与净结余三个数字。",
        ["kapi", "notes"],
        [goal("notes_note", title="六月结余", contains=["12600", "2379.2", "10220.8"])],
        NOTES_CHANGES,
        ["kapi__get_category_summary"],
        tags=("browse",),
    ),
    spec(
        "kapi_04_coffee_vs_milktea",
        "比较卡皮记账中「咖啡」和「奶茶」两个类目在2026年6月1日至6月12日期间的支出金额，找出更贵的一项，"
        "在笔记中新建标题为「咖啡奶茶对比」的笔记，记录两个类目各自的金额，并指出哪一项更贵。",
        ["kapi", "notes"],
        [goal("notes_note", title="咖啡奶茶对比", contains=["咖啡", "32", "奶茶", "18"])],
        NOTES_CHANGES,
        ["kapi__get_category_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "kapi_05_budget_limits_overview",
        "查看卡皮记账的预算设置，记录月度预算总额，以及「餐饮」和「交通」两个类目各自的预算限额，"
        "在笔记中新建标题为「预算速览」的笔记记录这些数字。",
        ["kapi", "notes"],
        [goal("notes_note", title="预算速览", contains=["9000", "餐饮", "1500", "交通", "400"])],
        NOTES_CHANGES,
        ["kapi__get_budget_status"],
        tags=("query",),
    ),
    spec(
        "kapi_06_fruit_rebuy_addbill",
        "在卡皮记账中查找备注包含「车厘子」的账单，确认它的金额，然后按相同类目和金额新增一笔支出账单，"
        "备注写「车厘子复购」并保存，再在笔记中新建标题为「水果复购」的笔记，记录新增账单的类目、金额与备注。",
        ["kapi", "notes"],
        [goal("notes_note", title="水果复购", contains=["水果", "23.8", "车厘子复购"])],
        NOTES_CHANGES + KAPI_BILL_CHANGES,
        ["kapi__search_bills", "kapi__prepare_bill_draft"],
        tags=("query_then_action",),
        max_steps=40,
    ),
    spec(
        "kapi_07_transport_cheaper_rebill",
        "在卡皮记账中查看「交通」类目下的所有账单，找出金额较低的一笔，然后按相同类目和金额新增一笔支出账单，"
        "备注写「地铁通勤」并保存，再在笔记中新建标题为「交通补记」的笔记，记录新增账单的类目、金额与备注。",
        ["kapi", "notes"],
        [goal("notes_note", title="交通补记", contains=["交通", "12.5", "地铁通勤"])],
        NOTES_CHANGES + KAPI_BILL_CHANGES,
        ["kapi__search_bills", "kapi__prepare_bill_draft"],
        tags=("query_then_action",),
        max_steps=40,
    ),
    spec(
        "kapi_08_shopping_bill_payee",
        "在卡皮记账中找到金额为268元的「购物」类目账单，打开它的详情页，查看该笔账单的商家（收款方）名称，"
        "在笔记中新建标题为「购物账单核实」的笔记，记录商家名称与账单备注内容。",
        ["kapi", "notes"],
        [goal("notes_note", title="购物账单核实", contains=["优衣库", "夏季T恤两件"])],
        NOTES_CHANGES,
        ["kapi__search_bills", "kapi__open_bill"],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "kapi_09_ai_tomorrow_budget",
        "打开卡皮记账的AI助手（胖咪）对话，找到其中提到明日预算预测的那条回复，"
        "在笔记中新建标题为「明日预算预测」的笔记，记录该回复中提到的明日可用预算金额。",
        ["kapi", "notes"],
        [goal("notes_note", title="明日预算预测", contains=["344.72"])],
        NOTES_CHANGES,
        [],
        tags=("no_tool_gui_fallback",),
    ),
    spec(
        "kapi_10_food_subcategories",
        "打开卡皮记账「餐饮」类目详情页，查看该类目下包含的所有子类目名称，"
        "在笔记中新建标题为「餐饮子类目」的笔记，记录其中「放纵餐」和「早餐」这两个子类目的名称。",
        ["kapi", "notes"],
        [goal("notes_note", title="餐饮子类目", contains=["放纵餐", "早餐"])],
        NOTES_CHANGES,
        ["kapi__open_category"],
        tags=("no_tool_gui_fallback",),
    ),
]

EXTRA_CHECKS = {
    "kapi_06_fruit_rebuy_addbill": _bill_added("c_fruit", 23.8),
    "kapi_07_transport_cheaper_rebill": _bill_added("c_transport", 12.5),
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
