from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class FollowShop(BaseTask):
    """Verdict: {shop} id newly appears in followedShops (Create → diff)."""

    templates = ["关注「{shop_name}」"]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L2"
    capabilities = ["social"]

    parameters = {
        "_shop": {
            "sampler": Taobao.sample_unfollowed_shop,
            "fields": {"shop_id": "shop_id", "shop_name": "shop_name"},
        },
        "shop_id": {"type": "string", "default": "s_lanjing", "description": "店铺 id"},
        "shop_name": {"type": "string", "default": "蓝鲸数码旗舰店", "description": "店铺名"},
    }

    expected_changes = ["taobao.followedShops[+={shop_id}]", *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [taobao.check_shop_followed(self.p.shop_id, self.p.shop_name)]
