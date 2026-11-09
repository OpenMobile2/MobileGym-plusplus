from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class SearchAndBuyNow(BaseTask):
    """Verdict: search trace contains the keyword AND a new single-line paid
    order for {item} exists. Purchase path inside the app is free (buy-now or
    via cart both end in a paid order) — per design review, only the search
    trace and the paid outcome are binding."""

    templates = [
        "搜索「{search_kw}」,购买「{item_title}」并完成支付(数量1,规格默认)",
        "在淘宝搜「{search_kw}」,把「{item_title}」买下来,付款完成为止",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "sequential"
    difficulty = "L3"
    capabilities = ["search", "finance"]

    parameters = {
        "_item": {
            "sampler": Taobao.sample_buyable_item,
            "fields": {"item_id": "item_id", "item_title": "item_title",
                       "search_kw": "search_kw"},
        },
        "item_id": {"type": "string", "default": "i_handcream", "description": "商品 id"},
        "item_title": {"type": "string",
                       "default": "清风山 山雾香氛护手霜 75mL 保湿滋润 生日礼物",
                       "description": "商品标题"},
        "search_kw": {"type": "string", "default": "清风山", "description": "搜索词"},
    }

    # 立即购买不动 cart;经购物车结算会动 → cart 列入宽路径
    expected_changes = ["taobao.orders[+1]", "taobao.cart", *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [
            taobao.check_search_history_contains(self.p.search_kw),
            taobao.check_new_paid_order(self.p.item_id, self.p.item_title),
        ]
