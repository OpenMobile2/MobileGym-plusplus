from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class AddItemToCart(BaseTask):
    """Verdict: a new cart entry for {item} appears (Create → diff;
    sampler excludes items already in cart so qty-merge can't mask it)."""

    templates = ["把「{item_title}」加入购物车"]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L2"
    capabilities = ["create"]

    parameters = {
        "_item": {
            "sampler": Taobao.sample_item_not_in_cart,
            "fields": {"item_id": "item_id", "item_title": "item_title"},
        },
        "item_id": {"type": "string", "default": "i_alarm", "description": "商品 id"},
        "item_title": {"type": "string",
                       "default": "蓝鲸 智能闹钟 多种内置闹铃 睡眠监测 桌面时钟",
                       "description": "商品标题"},
    }

    expected_changes = ["taobao.cart[+1]", *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [taobao.check_cart_added(self.p.item_id, self.p.item_title)]
