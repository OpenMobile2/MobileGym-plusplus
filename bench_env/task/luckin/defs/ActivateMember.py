from __future__ import annotations

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.luckin.app import Luckin


class ActivateMember(BaseTask):
    templates = ["在瑞幸会员页面开通连续包月 9.90 元月卡"]
    apps = ["luckin"]
    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L2"
    capabilities = ["modify"]
    expected_changes = ["luckin.memberActive"]

    def check_goals(self, input: JudgeInput) -> list[dict]:
        app = Luckin(input.apps["luckin"], init=input.apps_init["luckin"])
        return [app.check_member_active()]
