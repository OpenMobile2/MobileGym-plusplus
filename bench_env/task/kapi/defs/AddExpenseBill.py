from __future__ import annotations

from typing import Any

from bench_env.scenarios import apply_scenario
from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.kapi.app import Kapi


class AddExpenseBill(BaseTask):
    """Add one expense bill on an empty ledger; success = bills length +1 in store."""

    templates = ["记一笔支出，随便记一笔餐饮即可"]
    apps = ["kapi"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L2"
    capabilities = ["create"]

    expected_changes = ["kapi.bills"]

    async def _prepare(self, env: Any) -> None:
        # Empty ledger makes the create effect unambiguous for demos.
        await apply_scenario(env, "kapi/empty_bills")

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        kapi = Kapi(input.apps["kapi"], init=input.apps_init["kapi"])
        checks = [kapi.check_bills_count_increased(1)]
        # Soft exclude: budget object should still exist (not wiped).
        budget = input.apps["kapi"].get("budget")
        checks.append({
            "field": "kapi.budget",
            "expected": "object",
            "actual": type(budget).__name__,
            "passed": isinstance(budget, dict),
        })
        return checks
