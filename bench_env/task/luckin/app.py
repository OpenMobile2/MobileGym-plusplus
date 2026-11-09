"""Luckin (瑞幸) app state accessor."""

from __future__ import annotations

from typing import Any

from bench_env.task.base import BaseApp


class Luckin(BaseApp):
    @property
    def cart(self) -> list[dict[str, Any]]:
        value = self.get("cart")
        if not isinstance(value, list):
            raise ValueError("luckin.cart is not a list")
        return value

    def check_cart_count_increased(self, delta: int = 1) -> dict[str, Any]:
        before = len(self.init.cart)
        after = len(self.cart)
        return {
            "field": "luckin.cart.length",
            "expected": before + delta,
            "actual": after,
            "passed": after == before + delta,
        }

    @property
    def orders(self) -> list[dict[str, Any]]:
        value = self.get("orders")
        if not isinstance(value, list):
            raise ValueError("luckin.orders is not a list")
        return value

    def check_order_count_increased(self, delta: int = 1) -> dict[str, Any]:
        expected = len(self.init.orders) + delta
        actual = len(self.orders)
        return {"field": "luckin.orders.length", "expected": expected, "actual": actual, "passed": actual == expected}

    def check_submitted_order_matches_cart(self) -> list[dict[str, Any]]:
        initial_items = [item for item in self.init.cart if item.get("checked")]
        new_order = self.orders[0] if self.orders else {}
        actual_items = new_order.get("items") or []
        expected_lines = sorted((item.get("productId"), item.get("quantity")) for item in initial_items)
        actual_lines = sorted((item.get("productId"), item.get("quantity")) for item in actual_items)
        purchased_ids = {item.get("productId") for item in initial_items}
        remaining_ids = {item.get("productId") for item in self.cart}

        products = self.init.get("products") or []
        product_prices = {item.get("id"): item.get("price", 0) for item in products}
        selections = self.init.get("selections") or {}
        subtotal = sum(
            (6.9 if selections.get("exchangeProduct") == item.get("productId") else product_prices.get(item.get("productId"), 0))
            * item.get("quantity", 0)
            for item in initial_items
        )
        coupons = self.init.get("coupons") or []
        coupon = next((item for item in coupons if item.get("id") == selections.get("orderCoupon")), None)
        expected_amount = round(max(0, subtotal - min(coupon.get("amount", 0), subtotal) if coupon else subtotal), 1)
        actual_amount = new_order.get("amount")

        return [
            {"field": "luckin.orders[0].items", "expected": expected_lines, "actual": actual_lines, "passed": actual_lines == expected_lines},
            {"field": "luckin.orders[0].amount", "expected": expected_amount, "actual": actual_amount, "passed": actual_amount == expected_amount},
            {"field": "luckin.cart.purchased_removed", "expected": True, "actual": purchased_ids.isdisjoint(remaining_ids), "passed": purchased_ids.isdisjoint(remaining_ids)},
        ]

    def check_selection(self, key: str, expected: str) -> dict[str, Any]:
        selections = self.get("selections") or {}
        actual = selections.get(key) if isinstance(selections, dict) else None
        return {"field": f"luckin.selections.{key}", "expected": expected, "actual": actual, "passed": actual == expected}

    def check_member_active(self) -> dict[str, Any]:
        actual = self.get("memberActive")
        return {"field": "luckin.memberActive", "expected": True, "actual": actual, "passed": actual is True}
