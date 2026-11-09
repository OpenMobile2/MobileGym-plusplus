from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import (
    Taobao,
    TAOBAO_BROWSE_CHANGES,
    TAOBAO_REFUND_REASONS,
)


class BuyThenRefund(BaseTask):
    """Verdict (two independent goals): ① a new order for {item} exists and
    was paid (final status refunded after the chain); ② a new refund record
    referencing that *new* order with the required reason. Refunding an old
    order fails ② (for_new_order=True)."""

    templates = [
        "购买「{item_title}」并完成支付,然后马上对这笔订单申请退款,原因选「{reason}」",
        "先把「{item_title}」买了(付款完成),紧接着把刚下的这单退掉,退款原因「{reason}」",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "sequential"
    difficulty = "L4"
    capabilities = ["finance", "edit"]

    parameters = {
        "_item": {
            "sampler": Taobao.sample_buyable_item,
            "fields": {"item_id": "item_id", "item_title": "item_title"},
        },
        "item_id": {"type": "string", "default": "i_lamp", "description": "商品 id"},
        "item_title": {"type": "string",
                       "default": "简木 护眼台灯 无极调光 学习阅读床头灯",
                       "description": "商品标题"},
        "reason": {"type": "enum", "values": list(TAOBAO_REFUND_REASONS),
                   "default": "不想要了"},
    }

    expected_changes = ["taobao.orders[+1]", "taobao.refunds[+1]", "taobao.cart",
                        *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [
            taobao.check_new_paid_order(
                self.p.item_id, self.p.item_title,
                expect_status="refunded", field="new_order_bought",
            ),
            taobao.check_new_refund(self.p.reason, for_new_order=True),
        ]
