from __future__ import annotations

from typing import Any

from bench_env.scenarios import apply_scenario
from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.ctrip.app import Ctrip


class FavoriteHotel(BaseTask):
    """Favorite one hotel; success = favoriteHotels length +1."""

    templates = ["在携程收藏任意一家酒店"]
    apps = ["ctrip"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L1"
    capabilities = ["create"]

    # 进详情会写 browseHistory；收藏是主目标，浏览副作用算预期
    expected_changes = ["ctrip.favoriteHotels", "ctrip.browseHistory"]

    async def _prepare(self, env: Any) -> None:
        await apply_scenario(env, "ctrip/empty_orders")

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        app = Ctrip(input.apps["ctrip"], init=input.apps_init["ctrip"])
        return [app.check_favorite_count_increased(1)]
