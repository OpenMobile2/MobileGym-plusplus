from __future__ import annotations

from typing import Any

from bench_env.scenarios import apply_scenario
from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.kapi.app import Kapi


class ToggleReimburse(BaseTask):
    """Flip reimburse flag on a seeded bill; judges store truth, not UI chrome.

    Uses scenario ``kapi/reimburse_mix`` so the target bill id is stable.
    """

    templates = ["把「{bill_note}」这笔账单标记为报销"]
    apps = ["kapi"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L2"
    capabilities = ["modify"]

    parameters = {
        "bill_id": {"type": "string", "default": "b_demo_off", "description": "账单 id"},
        "bill_note": {"type": "string", "default": "午餐不报销", "description": "账单备注"},
    }

    expected_changes = ["kapi.bills"]

    async def _prepare(self, env: Any) -> None:
        await apply_scenario(env, "kapi/reimburse_mix")

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        kapi = Kapi(input.apps["kapi"], init=input.apps_init["kapi"])
        return [kapi.check_bill_reimburse(self.p.bill_id, True)]
