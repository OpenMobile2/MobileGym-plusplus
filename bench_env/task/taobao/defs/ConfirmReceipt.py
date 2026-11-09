from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class ConfirmReceipt(BaseTask):
    """Verdict: the shipped order (identified from init) ends completed
    (Modify). Confirm from list or detail page — both fine."""

    templates = [
        "「{order_item_title}」的订单到了,确认收货",
        "把「{order_item_title}」那单确认收货",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L3"
    capabilities = ["nav"]

    parameters = {
        "_order": {
            "sampler": Taobao.sample_shipped_order,
            "fields": {"order_id": "order_id", "order_item_title": "order_item_title"},
        },
        "order_id": {"type": "string", "default": "o_ship1", "description": "订单 id"},
        "order_item_title": {"type": "string",
                             "default": "蓝鲸 智能闹钟 多种内置闹铃 睡眠监测 桌面时钟",
                             "description": "订单商品标题"},
    }

    expected_changes = ["taobao.orders[id={order_id}]", *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [taobao.check_order_status(self.p.order_id, "completed", self.p.order_item_title)]
