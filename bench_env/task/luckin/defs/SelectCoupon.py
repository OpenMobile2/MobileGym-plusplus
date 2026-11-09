from __future__ import annotations

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.luckin.app import Luckin


class SelectCoupon(BaseTask):
    templates = ["在瑞幸把购物车已有饮品去结算，选择『满 20 减 8 元』优惠券并确认，先不要提交订单"]
    apps = ["luckin"]
    scope = "S1"
    objective = "operate"
    composition = "sequential"
    difficulty = "L2"
    capabilities = ["modify"]
    expected_changes = ["luckin.selections.orderCoupon"]

    def check_goals(self, input: JudgeInput) -> list[dict]:
        app = Luckin(input.apps["luckin"], init=input.apps_init["luckin"])
        return [app.check_selection("orderCoupon", "c02")]
