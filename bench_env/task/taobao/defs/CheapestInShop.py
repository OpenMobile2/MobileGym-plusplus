from __future__ import annotations

from typing import Any

from bench_env.task.common_tasks import AnswerTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class CheapestInShop(AnswerTask):
    """Verdict: the Agent reports the lowest item price in {shop} (Query →
    read from init; sampler guarantees a unique minimum)."""

    templates = [
        "「{shop_name}」店里最便宜的商品是多少钱?",
        "去「{shop_name}」看看,告诉我全店最低价(元)",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "query"
    composition = "deep_dive"
    difficulty = "L3"
    capabilities = ["extract", "reasoning"]

    parameters = {
        "_shop": {
            "sampler": Taobao.sample_shop_for_cheapest,
            "fields": {"shop_id": "shop_id", "shop_name": "shop_name"},
        },
        "shop_id": {"type": "string", "default": "s_qfs", "description": "店铺 id"},
        "shop_name": {"type": "string", "default": "清风山旗舰店", "description": "店铺名"},
    }

    answer_fields = [{"type": "number", "label": "最低价(元)"}]

    expected_changes = TAOBAO_BROWSE_CHANGES

    def get_answer(self, input: JudgeInput) -> Any:
        return Taobao(input.apps_init["taobao"]).cheapest_price_in_shop(self.p.shop_id)
