from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class CheckoutCartItem(BaseTask):
    """Verdict: a new paid order containing exactly the cart item, AND the
    cart entry is gone. '从购物车结算' is the task's core constraint (template
    explicit), so buy-now leaving the entry in the cart fails check 2."""

    templates = [
        "把购物车里的「{item_title}」结算掉,只买这一件,完成支付",
        "去购物车勾选「{item_title}」(其他都不要勾),结算并付款",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "sequential"
    difficulty = "L3"
    capabilities = ["finance"]

    parameters = {
        "_entry": {
            "sampler": Taobao.sample_valid_cart_entry,
            "fields": {"cart_id": "cart_id", "item_id": "item_id", "item_title": "item_title"},
        },
        "cart_id": {"type": "string", "default": "c3", "description": "购物车条目 id"},
        "item_id": {"type": "string", "default": "i_hoodie", "description": "商品 id"},
        "item_title": {"type": "string",
                       "default": "云裳 华夫格卫衣 白灰色 宽松显瘦 开衫外套女",
                       "description": "商品标题"},
    }

    expected_changes = ["taobao.orders[+1]", "taobao.cart", *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [
            taobao.check_new_paid_order(self.p.item_id, self.p.item_title),
            taobao.check_cart_entry_removed(self.p.cart_id, self.p.item_title),
        ]
