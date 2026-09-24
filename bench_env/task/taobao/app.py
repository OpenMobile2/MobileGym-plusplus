"""
Taobao app state accessor.

State schema: apps/Taobao/types.ts (TaobaoState); seeded from apps/Taobao/data/defaults.json.
Spec (interaction-level judge anchors): docs/taobao-replication/spec.json.
"""

from __future__ import annotations

from typing import Any

from bench_env.task.base import BaseApp

# ---------------------------------------------------------------------------
# expected_changes constants
# ---------------------------------------------------------------------------
# Browsing side effects: visiting any item detail appends to `footprints`
# (recordFootprint on mount); searching appends to `searchHistory`; the buy
# flow writes/clears the transient `checkout` field. Declare these on every
# task whose solution plausibly opens a detail page or the search box.
TAOBAO_BROWSE_CHANGES = [
    "taobao.footprints",
    "taobao.searchHistory",
    "taobao.checkout",
]

TAOBAO_REFUND_REASONS = [
    "不想要了",
    "空包裹",
    "未按约定时间发货",
    "快递/物流一直未送达",
    "货物破损已拒签",
    "质量问题",
    "与商品描述不符",
]

# Address-form sampling pools for AddNewAddress (value domain unrelated to env
# data by design: the task must create a *new* address).
TAOBAO_NEW_ADDRESS_PROFILES = [
    {"addr_name": "林晓彤", "addr_phone": "13912340001", "addr_region": "浙江省 杭州市 西湖区",
     "addr_detail": "文三路199号创业大厦5楼", "addr_tag": "公司"},
    {"addr_name": "周子墨", "addr_phone": "13712340002", "addr_region": "江苏省 苏州市 姑苏区",
     "addr_detail": "平江路88号2幢301", "addr_tag": "家"},
    {"addr_name": "陈一帆", "addr_phone": "15812340003", "addr_region": "上海市 上海市 静安区",
     "addr_detail": "南京西路1601号802室", "addr_tag": "朋友"},
]


class Taobao(BaseApp):
    """
    Taobao state accessor.

    Usage:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        taobao.cart            # current
        taobao.init.cart       # initial
    """

    # ------------------------------------------------------------------
    # Typed collection properties
    # ------------------------------------------------------------------

    def _list_of(self, key: str) -> list[dict[str, Any]]:
        value = self.get(key)
        if not isinstance(value, list):
            raise ValueError(f"taobao.{key} is not a list")
        return value

    @property
    def items(self) -> list[dict[str, Any]]:
        return self._list_of("items")

    @property
    def cart(self) -> list[dict[str, Any]]:
        return self._list_of("cart")

    @property
    def orders(self) -> list[dict[str, Any]]:
        return self._list_of("orders")

    @property
    def refunds(self) -> list[dict[str, Any]]:
        return self._list_of("refunds")

    @property
    def addresses(self) -> list[dict[str, Any]]:
        return self._list_of("addresses")

    @property
    def shops(self) -> list[dict[str, Any]]:
        return self._list_of("shops")

    @property
    def chats(self) -> list[dict[str, Any]]:
        return self._list_of("chats")

    @property
    def favorites(self) -> list[str]:
        return [str(x) for x in self.get_list("favorites")]

    @property
    def followed_shops(self) -> list[str]:
        return [str(x) for x in self.get_list("followedShops")]

    # ------------------------------------------------------------------
    # Find / lookup
    # ------------------------------------------------------------------

    def find_item_by_id(self, item_id: str) -> dict[str, Any]:
        for item in self.items:
            if str(item["id"]) == str(item_id):
                return item
        raise ValueError(f"Taobao item '{item_id}' not found in state")

    def find_order_by_id(self, order_id: str) -> dict[str, Any] | None:
        for order in self.orders:
            if str(order["id"]) == str(order_id):
                return order
        return None

    def find_cart_entry_by_id(self, cart_id: str) -> dict[str, Any] | None:
        for entry in self.cart:
            if str(entry["id"]) == str(cart_id):
                return entry
        return None

    # ------------------------------------------------------------------
    # Diff primitives (Create / Delete strategies)
    # ------------------------------------------------------------------

    def new_orders(self) -> list[dict[str, Any]]:
        init_ids = {str(o["id"]) for o in self.init.orders}
        return [o for o in self.orders if str(o["id"]) not in init_ids]

    def new_refunds(self) -> list[dict[str, Any]]:
        init_ids = {str(r["id"]) for r in self.init.refunds}
        return [r for r in self.refunds if str(r["id"]) not in init_ids]

    def new_cart_entries(self) -> list[dict[str, Any]]:
        init_ids = {str(c["id"]) for c in self.init.cart}
        return [c for c in self.cart if str(c["id"]) not in init_ids]

    def new_addresses(self) -> list[dict[str, Any]]:
        init_ids = {str(a["id"]) for a in self.init.addresses}
        return [a for a in self.addresses if str(a["id"]) not in init_ids]

    def removed_cart_ids(self) -> set[str]:
        curr_ids = {str(c["id"]) for c in self.cart}
        return {str(c["id"]) for c in self.init.cart} - curr_ids

    # ------------------------------------------------------------------
    # Answer methods
    # ------------------------------------------------------------------

    def cheapest_price_in_shop(self, shop_id: str) -> float:
        """Judge-ready answer: lowest item price in the shop.

        Raises on a tie — a tie makes the query answer ambiguous, which is a
        data/sampler problem (judge_error), not an Agent failure.
        """
        prices = sorted(float(i["price"]) for i in self.items if str(i["shopId"]) == str(shop_id))
        if not prices:
            raise ValueError(f"Shop '{shop_id}' has no items in state")
        if len(prices) > 1 and prices[0] == prices[1]:
            raise ValueError(f"Shop '{shop_id}' has a tied lowest price {prices[0]}")
        return prices[0]

    # ------------------------------------------------------------------
    # Check methods
    # ------------------------------------------------------------------

    def check_cart_added(self, item_id: str, item_title: str) -> dict[str, Any]:
        """Create → diff: a new cart entry for item_id (sampler excludes
        items already in cart, so a qty-merge cannot mask the add)."""
        match = next((c for c in self.new_cart_entries() if str(c["itemId"]) == str(item_id)), None)
        return {
            "field": "cart_added",
            "expected": f"购物车新增「{item_title}」",
            "actual": f"新增条目 {match['skuDesc']} x{match['qty']}" if match else "无该商品的新增条目",
            "passed": match is not None,
        }

    def check_shop_followed(self, shop_id: str, shop_name: str) -> dict[str, Any]:
        """Create → diff on the followedShops id array."""
        added = self.contains_new("followedShops", str(shop_id))
        return {
            "field": "shop_followed",
            "expected": f"新关注店铺「{shop_name}」",
            "actual": f"followedShops 新增: {sorted(self.list_added('followedShops'))}" or "(无新增)",
            "passed": added,
        }

    def check_default_address(self, address_id: str, address_detail: str) -> dict[str, Any]:
        """Modify → identify by id from init (sampler guarantees presence and
        non-default), verify isDefault in current plus uniqueness."""
        target = next((a for a in self.addresses if str(a["id"]) == str(address_id)), None)
        defaults = [a["detail"] for a in self.addresses if a.get("isDefault")]
        passed = target is not None and bool(target.get("isDefault")) and len(defaults) == 1
        return {
            "field": "default_address",
            "expected": f"「{address_detail}」为唯一默认地址",
            "actual": f"当前默认: {defaults}",
            "passed": passed,
        }

    def check_search_history_contains(self, keyword: str) -> dict[str, Any]:
        """Create → diff: some newly-added search record contains keyword
        (agent may search the full title; substring match covers it)."""
        new_entries = [w for w in self.get_list("searchHistory")
                       if w not in self.init.get_list("searchHistory")]
        hit = any(keyword in w for w in new_entries)
        return {
            "field": "search_performed",
            "expected": f"搜索记录新增包含「{keyword}」",
            "actual": f"新增搜索词: {new_entries}" if new_entries else "(无新增搜索词)",
            "passed": hit,
        }

    def check_new_paid_order(
        self,
        item_id: str,
        item_title: str,
        *,
        expect_status: str = "pendingShip",
        pay_method: str | None = None,
        address_contains: str | None = None,
        single_line: bool = True,
        field: str = "new_paid_order",
    ) -> dict[str, Any]:
        """Create → diff: one new order for the item, paid (status flipped off
        pendingPayment by markOrderPaid), with optional payMethod / address
        snapshot constraints. One semantic goal: '买对并完成支付'."""
        candidates = [
            o for o in self.new_orders()
            if any(str(line["itemId"]) == str(item_id) for line in o["lines"])
        ]
        order = candidates[0] if candidates else None

        def describe(o: dict[str, Any]) -> str:
            return (f"{[line['itemId'] for line in o['lines']]} status={o['status']} "
                    f"pay={o.get('payMethod')} addr={o['addressSnapshot']['full'][:24]}…")

        ok = order is not None
        if ok:
            ok = ok and (not single_line or len(order["lines"]) == 1)
            ok = ok and str(order["status"]) == expect_status
            ok = ok and order.get("paidAt") is not None if expect_status != "pendingPayment" else ok
            if pay_method is not None:
                ok = ok and str(order.get("payMethod")) == pay_method
            if address_contains is not None:
                ok = ok and address_contains in str(order["addressSnapshot"]["full"])
        expected_bits = [f"新订单仅含「{item_title}」", f"状态 {expect_status}(已支付)"]
        if pay_method:
            expected_bits.append(f"支付方式 {pay_method}")
        if address_contains:
            expected_bits.append(f"收货地址含「{address_contains}」")
        return {
            "field": field,
            "expected": ",".join(expected_bits),
            "actual": describe(order) if order else "未找到包含该商品的新订单",
            "passed": bool(ok),
        }

    def check_cart_entry_removed(self, cart_id: str, item_title: str,
                                 *, field: str = "cart_removed") -> dict[str, Any]:
        """Delete → diff on cart entry ids."""
        removed = self.removed_cart_ids()
        return {
            "field": field,
            "expected": f"购物车条目「{item_title}」被移除",
            "actual": f"移除的条目: {sorted(removed)}" if removed else "(无条目被移除)",
            "passed": str(cart_id) in removed,
        }

    def check_cart_moved_to_favorites(self, cart_id: str, item_id: str,
                                      item_title: str) -> dict[str, Any]:
        """'移入收藏' = cart entry gone AND item now favorited. Sampler
        excludes items already in favorites, so membership-now is evidence
        of the move (pure delete would leave favorites unchanged)."""
        removed = str(cart_id) in self.removed_cart_ids()
        favorited = str(item_id) in self.favorites
        return {
            "field": "cart_moved_to_favorites",
            "expected": f"「{item_title}」移出购物车且进入收藏",
            "actual": f"移出购物车={removed}, 在收藏夹={favorited}",
            "passed": removed and favorited,
        }

    def check_cart_entry_qty(self, cart_id: str, qty: int, item_title: str) -> dict[str, Any]:
        """Modify → identify by id (from sampler/init), verify qty in current.
        Entry deleted by the agent → legitimate failure, not judge_error."""
        entry = self.find_cart_entry_by_id(cart_id)
        return {
            "field": "cart_qty",
            "expected": f"「{item_title}」数量为 {qty}",
            "actual": f"数量 {entry['qty']}" if entry else "条目已不存在",
            "passed": entry is not None and int(entry["qty"]) == int(qty),
        }

    def check_order_status(self, order_id: str, expected_status: str,
                           item_title: str, *, field: str = "order_status") -> dict[str, Any]:
        """Modify → order identified by id from init, status verified in current."""
        order = self.find_order_by_id(order_id)
        return {
            "field": field,
            "expected": f"「{item_title}」订单状态 {expected_status}",
            "actual": f"状态 {order['status']}" if order else "订单不存在",
            "passed": order is not None and str(order["status"]) == expected_status,
        }

    def check_new_refund(
        self,
        reason: str,
        *,
        order_id: str | None = None,
        for_new_order: bool = False,
        field: str = "refund",
    ) -> dict[str, Any]:
        """Create → diff on refunds; the matched refund must reference the
        target order (a fixed order_id, or — for buy-then-refund chains —
        an order that is itself new), with the required reason, and the
        referenced order must end refunded. One semantic goal: '退款成功'."""
        new_order_ids = {str(o["id"]) for o in self.new_orders()}
        match = None
        for r in self.new_refunds():
            rid = str(r["orderId"])
            if order_id is not None and rid != str(order_id):
                continue
            if for_new_order and rid not in new_order_ids:
                continue
            if str(r["reason"]) != reason:
                continue
            match = r
            break
        order_ok = False
        if match is not None:
            target = self.find_order_by_id(str(match["orderId"]))
            order_ok = target is not None and str(target["status"]) == "refunded"
        return {
            "field": field,
            "expected": f"新增退款记录(原因「{reason}」"
                        + ("、关联本次新订单" if for_new_order else "")
                        + "),订单状态 refunded",
            "actual": (f"退款 {match['orderId']} 原因「{match['reason']}」订单已退款={order_ok}"
                       if match else f"新增退款: {[r['orderId'] for r in self.new_refunds()]}"),
            "passed": match is not None and order_ok,
        }

    def check_new_address(self, name: str, phone: str, region: str,
                          detail: str, tag: str) -> dict[str, Any]:
        """Create → diff on addresses; all five fields on one new entry.
        One semantic goal: '新地址填对了'."""
        match = next(
            (a for a in self.new_addresses()
             if str(a["name"]) == name and str(a["phone"]) == phone
             and str(a["detail"]) == detail
             and str(a["region"]).replace(" ", "") == region.replace(" ", "")
             and str(a.get("tag") or "") == tag),
            None,
        )
        summary = [f"{a['name']}/{a['phone']}/{a['region']}/{a['detail']}/{a.get('tag')}"
                   for a in self.new_addresses()]
        return {
            "field": "address_created",
            "expected": f"{name}/{phone}/{region}/{detail}/标签{tag}",
            "actual": "; ".join(summary) if summary else "(无新增地址)",
            "passed": match is not None,
        }

    # ------------------------------------------------------------------
    # Samplers (raise on empty candidate pool → judge_error attribution)
    # ------------------------------------------------------------------

    @staticmethod
    def _tb(env_state: dict[str, Any]) -> dict[str, Any]:
        return env_state["apps"]["taobao"]

    @staticmethod
    def sample_item_not_in_cart(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        in_cart = {str(c["itemId"]) for c in tb["cart"]}
        candidates = [i for i in tb["items"] if str(i["id"]) not in in_cart]
        if not candidates:
            raise ValueError("No item outside the cart to sample")
        picked = rng.choice(candidates)
        return {"item_id": str(picked["id"]), "item_title": str(picked["title"])}

    @staticmethod
    def sample_buyable_item(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        if not tb["items"]:
            raise ValueError("No items to sample")
        picked = rng.choice(tb["items"])
        return {
            "item_id": str(picked["id"]),
            "item_title": str(picked["title"]),
            "search_kw": str(picked["title"]).split(" ")[0],
        }

    @staticmethod
    def sample_unfollowed_shop(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        followed = {str(s) for s in tb["followedShops"]}
        candidates = [s for s in tb["shops"] if str(s["id"]) not in followed]
        if not candidates:
            raise ValueError("No unfollowed shop to sample")
        picked = rng.choice(candidates)
        return {"shop_id": str(picked["id"]), "shop_name": str(picked["name"])}

    @staticmethod
    def sample_nondefault_address(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        candidates = [a for a in tb["addresses"] if not a.get("isDefault")]
        if not candidates:
            raise ValueError("No non-default address to sample")
        picked = rng.choice(candidates)
        return {"address_id": str(picked["id"]), "address_detail": str(picked["detail"])}

    @staticmethod
    def sample_valid_cart_entry(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        candidates = [c for c in tb["cart"] if not c.get("invalid")]
        if not candidates:
            raise ValueError("No valid cart entry to sample")
        picked = rng.choice(candidates)
        item = next(i for i in tb["items"] if str(i["id"]) == str(picked["itemId"]))
        return {
            "cart_id": str(picked["id"]),
            "item_id": str(picked["itemId"]),
            "item_title": str(item["title"]),
        }

    @staticmethod
    def sample_shipped_order(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        candidates = [o for o in tb["orders"] if o["status"] == "shipped"]
        if not candidates:
            raise ValueError("No shipped order to sample")
        picked = rng.choice(candidates)
        return {"order_id": str(picked["id"]), "order_item_title": str(picked["lines"][0]["title"])}

    @staticmethod
    def sample_refundable_order(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        refunded = {str(r["orderId"]) for r in tb["refunds"]}
        candidates = [
            o for o in tb["orders"]
            if o["status"] in ("shipped", "completed") and str(o["id"]) not in refunded
        ]
        if not candidates:
            raise ValueError("No refundable order to sample")
        picked = rng.choice(candidates)
        return {"order_id": str(picked["id"]), "order_item_title": str(picked["lines"][0]["title"])}

    @staticmethod
    def sample_cart_trio(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        """Three distinct valid cart entries: A (move to favorites — its item
        must not be pre-favorited, see check_cart_moved_to_favorites), B
        (delete), C (change qty to a value != initial)."""
        tb = Taobao._tb(env_state)
        valid = [c for c in tb["cart"] if not c.get("invalid")]
        favorites = {str(x) for x in tb["favorites"]}
        a_pool = [c for c in valid if str(c["itemId"]) not in favorites]
        if len(valid) < 3 or not a_pool:
            raise ValueError("Cart pool too small for trio sampling")
        entry_a = rng.choice(a_pool)
        rest = [c for c in valid if c["id"] != entry_a["id"]]
        entry_b, entry_c = rng.sample(rest, 2)
        titles = {str(i["id"]): str(i["title"]) for i in tb["items"]}
        qty_target = int(entry_c["qty"]) + rng.choice([1, 2])
        return {
            "cart_a_id": str(entry_a["id"]), "item_a_id": str(entry_a["itemId"]),
            "item_a_title": titles[str(entry_a["itemId"])],
            "cart_b_id": str(entry_b["id"]), "item_b_title": titles[str(entry_b["itemId"])],
            "cart_c_id": str(entry_c["id"]), "item_c_title": titles[str(entry_c["itemId"])],
            "item_c_qty": qty_target,
        }

    @staticmethod
    def sample_shop_for_cheapest(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        candidates = []
        for shop in tb["shops"]:
            prices = sorted(float(i["price"]) for i in tb["items"]
                            if str(i["shopId"]) == str(shop["id"]))
            if len(prices) >= 2 and prices[0] != prices[1]:
                candidates.append(shop)
        if not candidates:
            raise ValueError("No shop with a unique cheapest item")
        picked = rng.choice(candidates)
        return {"shop_id": str(picked["id"]), "shop_name": str(picked["name"])}

    @staticmethod
    def sample_new_address_profile(env_state: dict[str, Any], rng: Any) -> dict[str, Any]:
        tb = Taobao._tb(env_state)
        existing = {str(a["detail"]) for a in tb["addresses"]}
        candidates = [p for p in TAOBAO_NEW_ADDRESS_PROFILES if p["addr_detail"] not in existing]
        if not candidates:
            raise ValueError("All address profiles already exist in state")
        return dict(rng.choice(candidates))
