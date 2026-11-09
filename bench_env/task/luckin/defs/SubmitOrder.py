from __future__ import annotations

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.luckin.app import Luckin


class SubmitOrder(BaseTask):
    templates = ["在瑞幸把购物车里已有的饮品去结算并提交订单，进入新订单详情页"]
    apps = ["luckin"]
    scope = "S1"
    objective = "operate"
    composition = "sequential"
    difficulty = "L2"
    capabilities = ["create"]
    expected_changes = ["luckin.orders[+1]", "luckin.cart"]

    def check_goals(self, input: JudgeInput) -> list[dict]:
        app = Luckin(input.apps["luckin"], init=input.apps_init["luckin"])
        return [app.check_order_count_increased(1), *app.check_submitted_order_matches_cart()]
