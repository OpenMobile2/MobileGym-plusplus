"""Ctrip (携程) app state accessor."""

from __future__ import annotations

from typing import Any

from bench_env.task.base import BaseApp


class Ctrip(BaseApp):
    @property
    def favorite_hotels(self) -> list[str]:
        value = self.get("favoriteHotels")
        if not isinstance(value, list):
            raise ValueError("ctrip.favoriteHotels is not a list")
        return [str(x) for x in value]

    @property
    def orders(self) -> list[dict[str, Any]]:
        value = self.get("orders")
        if not isinstance(value, list):
            raise ValueError("ctrip.orders is not a list")
        return value

    def check_favorite_count_increased(self, delta: int = 1) -> dict[str, Any]:
        before = len(self.init.favorite_hotels)
        after = len(self.favorite_hotels)
        return {
            "field": "ctrip.favoriteHotels.length",
            "expected": before + delta,
            "actual": after,
            "passed": after == before + delta,
        }

    def check_orders_count_increased(self, delta: int = 1) -> dict[str, Any]:
        before = len(self.init.orders)
        after = len(self.orders)
        return {
            "field": "ctrip.orders.length",
            "expected": before + delta,
            "actual": after,
            "passed": after == before + delta,
        }
