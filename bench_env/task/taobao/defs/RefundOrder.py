from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import (
    Taobao,
    TAOBAO_BROWSE_CHANGES,
    TAOBAO_REFUND_REASONS,
)


class RefundOrder(BaseTask):
    """Verdict: one new refund for the target order with the required reason,
    and the order ends refunded. Refund record + status flip happen in one
    submit → one semantic goal, one check."""

    templates = [
        "给「{order_item_title}」的订单申请退款,原因选「{reason}」",
        "「{order_item_title}」那单不想要了,走退款,原因填「{reason}」",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "sequential"
    difficulty = "L3"
    capabilities = ["nav", "edit"]

    parameters = {
        "_order": {
            "sampler": Taobao.sample_refundable_order,
            "fields": {"order_id": "order_id", "order_item_title": "order_item_title"},
        },
        "order_id": {"type": "string", "default": "o_done1", "description": "订单 id"},
        "order_item_title": {"type": "string",
                             "default": "清风山 焕活精华液 30mL 紧致修护",
                             "description": "订单商品标题"},
        "reason": {"type": "enum",
                   "values": list(TAOBAO_REFUND_REASONS),
                   "default": "不想要了"},
    }

    expected_changes = ["taobao.refunds[+1]", "taobao.orders[id={order_id}]",
                        *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [taobao.check_new_refund(self.p.reason, order_id=self.p.order_id)]
