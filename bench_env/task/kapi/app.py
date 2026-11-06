"""Kapi (卡皮记账) app state accessor."""

from __future__ import annotations

from typing import Any

from bench_env.task.base import BaseApp


class Kapi(BaseApp):
    def _list_of(self, key: str) -> list[dict[str, Any]]:
        value = self.get(key)
        if not isinstance(value, list):
            raise ValueError(f"kapi.{key} is not a list")
        return value

    @property
    def bills(self) -> list[dict[str, Any]]:
        return self._list_of("bills")

    def find_bill(self, bill_id: str) -> dict[str, Any]:
        for bill in self.bills:
            if str(bill.get("id")) == str(bill_id):
                return bill
        raise ValueError(f"Kapi bill '{bill_id}' not found")

    def check_bill_reimburse(self, bill_id: str, expected: bool) -> dict[str, Any]:
        bill = self.find_bill(bill_id)
        actual = bool(bill.get("reimburse"))
        return {
            "field": f"kapi.bills[{bill_id}].reimburse",
            "expected": expected,
            "actual": actual,
            "passed": actual is expected,
        }

    def check_bills_count_increased(self, delta: int = 1) -> dict[str, Any]:
        before = len(self.init.bills)
        after = len(self.bills)
        return {
            "field": "kapi.bills.length",
            "expected": before + delta,
            "actual": after,
            "passed": after == before + delta,
        }
