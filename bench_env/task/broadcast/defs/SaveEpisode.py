from __future__ import annotations

from typing import Any

from bench_env.scenarios import apply_scenario
from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.broadcast.app import Broadcast


class SaveEpisode(BaseTask):
    """Save one episode; success = savedEpisodeIds length +1."""

    templates = ["在播客里收藏任意一集"]
    apps = ["broadcast"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L1"
    capabilities = ["create"]

    expected_changes = ["broadcast.savedEpisodeIds"]

    async def _prepare(self, env: Any) -> None:
        await apply_scenario(env, "broadcast/empty_saved")

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        app = Broadcast(input.apps["broadcast"], init=input.apps_init["broadcast"])
        return [app.check_saved_count_increased(1)]
