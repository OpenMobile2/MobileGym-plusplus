from __future__ import annotations

from typing import Any

from bench_env.scenarios import apply_scenario
from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.luckin.app import Luckin


class AddToCart(BaseTask):
    """Add one drink to cart on empty cart; success = cart length +1."""

    templates = ["在瑞幸菜单里加购任意一杯咖啡"]
    apps = ["luckin"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L1"
    capabilities = ["create"]

    expected_changes = ["luckin.cart"]

    async def _prepare(self, env: Any) -> None:
        await apply_scenario(env, "luckin/empty_cart")

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        app = Luckin(input.apps["luckin"], init=input.apps_init["luckin"])
        return [app.check_cart_count_increased(1)]
