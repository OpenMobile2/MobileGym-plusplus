"""Social/drive facts must be consumed by a second-app business write."""

from __future__ import annotations

from typing import Any

from bench_env.task.flow.defs.specs_flow import _new_rows
from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput


def _dianping_wangheli_voucher():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        orders = [
            row for row in _new_rows(input, "dianping", "orders")
            if row.get("shopId") == "wangheli"
            and str(row.get("dealId") or "") in {"vh100", "vh2"}
            and row.get("status") != "pending_pay"
        ]
        return [{
            "field": "dianping_wangheli_paid",
            "expected": "paid wangheli voucher or setmeal",
            "actual": [
                {"id": r.get("id"), "dealId": r.get("dealId"), "status": r.get("status"), "dealTitle": r.get("dealTitle")}
                for r in _new_rows(input, "dianping", "orders")
            ],
            "passed": bool(orders),
        }]
    return _check


def _taobao_yogamat_paid():
    def _amount(input: JudgeInput) -> float | None:
        init = {str(row.get("id")) for row in ((input.apps_init.get("taobao") or {}).get("orders") or [])}
        for row in ((input.apps.get("taobao") or {}).get("orders") or []):
            if str(row.get("id")) in init:
                continue
            blob = str(row.get("title") or "") + " ".join(
                str(x.get("title") or "") for x in (row.get("lines") or []) if isinstance(x, dict)
            )
            if "瑜伽垫" not in blob and "健身垫" not in blob:
                continue
            if row.get("status") == "pendingPayment":
                continue
            paid = float(row.get("paidAmount") or row.get("actualPay") or row.get("total") or 0)
            return paid if paid > 0.01 else float(row.get("itemTotal") or row.get("price") or 69)
        return None

    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        amount = _amount(input)
        return [{
            "field": "taobao_yogamat_paid",
            "expected": "极星瑜伽垫 paid",
            "actual": amount,
            "passed": amount is not None,
        }]
    return _check


def _slack_general_sbst():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        msgs = [
            row for row in _new_rows(input, "slack", "messages")
            if row.get("convId") == "c_general" and not row.get("deleted")
        ]
        hit = any(
            "SBST" in str(row.get("text") or "") and "标注" in str(row.get("text") or "")
            for row in msgs
        )
        return [{
            "field": "slack_sbst_share",
            "expected": "#general contains SBST and 标注",
            "actual": [{"text": r.get("text")} for r in msgs],
            "passed": hit,
        }]
    return _check


def _tencent_sbst_meeting():
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        init = {
            str(row.get("id"))
            for row in ((input.apps_init.get("tencent_meeting") or {}).get("scheduledMeetings") or [])
        }
        new = [
            row for row in ((input.apps.get("tencent_meeting") or {}).get("scheduledMeetings") or [])
            if str(row.get("id")) not in init
        ]
        hit = any("组会" in str(row.get("title") or row.get("subject") or "") for row in new)
        return [{
            "field": "tencent_sbst_meeting",
            "expected": "scheduled meeting title contains 组会",
            "actual": [{"title": r.get("title") or r.get("subject")} for r in new],
            "passed": hit,
        }]
    return _check


SPECS = [
    spec(
        "social_weibo_voucher",
        "我想在微博找到那条说火锅毛肚绝了的探店，再去点评打开王和李·海鲜火锅大排档，买一张【马到大吉】100元代金券并完成支付。",
        ["weibo", "dianping"],
        [],
        ["apps.dianping.orders"],
        [],
        tags=("bench", "social_see", "local"),
        max_steps=55,
    ),
    spec(
        "social_keep_yogamat",
        "我想在 Keep 商城看清加厚健身垫这款，再去淘宝搜瑜伽垫，买下极星加厚那款并完成支付。",
        ["keep", "taobao"],
        [],
        ["apps.taobao.orders"],
        ["taobao__open_item"],
        tags=("bench", "social_see", "shopping"),
        max_steps=55,
    ),
    spec(
        "work_drive_slack",
        "我想打开谷歌云盘里的「SBST 组会汇报」，看清本周进展第一点，再到 Slack 全员频道发一条消息，带上 SBST 和这条进展里的「标注规范」。",
        ["googledrive", "slack"],
        [],
        ["apps.slack.messages"],
        [],
        tags=("bench", "social_see", "work"),
        max_steps=45,
    ),
    spec(
        "work_drive_meet",
        "我想打开谷歌云盘「SBST 组会汇报」看清本周进展，先在 Slack 全员频道发一条带 SBST 和标注规范的消息，再去腾讯会议预约一场主题为「SBST 组会」的会议。",
        ["googledrive", "slack", "tencent_meeting"],
        [],
        ["apps.slack.messages", "apps.tencent_meeting.scheduledMeetings"],
        ["tencent_meeting__prepare_schedule"],
        tags=("bench", "social_see", "work"),
        max_steps=55,
    ),
    spec(
        "work_drive_dida",
        "我想打开谷歌云盘「SBST 组会汇报」，看清本周进展里的标注规范，再到 Slack 的 education 频道发一条带「标注规范 v2」的消息，并在滴答清单新建待办「整理标注规范 v2 文档」。",
        ["googledrive", "slack", "dida"],
        [],
        ["apps.slack.messages", "apps.dida.tasks"],
        [],
        tags=("bench", "social_see", "work"),
        max_steps=50,
    ),
]

EXTRA_CHECKS = {
    "social_weibo_voucher": _dianping_wangheli_voucher(),
    "social_keep_yogamat": _taobao_yogamat_paid(),
    "work_drive_slack": _slack_general_sbst(),
    "work_drive_meet": lambda input: _slack_general_sbst()(input) + _tencent_sbst_meeting()(input),
    "work_drive_dida": lambda input: (
        [{
            "field": "slack_edu_spec",
            "expected": "#education contains 标注规范 v2",
            "actual": [
                {"text": r.get("text")}
                for r in _new_rows(input, "slack", "messages")
                if r.get("convId") == "c_education"
            ],
            "passed": any(
                "标注规范 v2" in str(r.get("text") or "")
                for r in _new_rows(input, "slack", "messages")
                if r.get("convId") == "c_education" and not r.get("deleted")
            ),
        }]
        + [{
            "field": "dida_spec_todo",
            "expected": "整理标注规范 v2 文档",
            "actual": [r.get("title") for r in _new_rows(input, "dida", "tasks")],
            "passed": any(
                "标注规范 v2" in str(r.get("title") or "")
                for r in _new_rows(input, "dida", "tasks")
            ),
        }]
    ),
}

build_task_classes(
    SPECS,
    EXTRA_CHECKS,
    module_globals=globals(),
    module_name=__name__,
)
