"""
Taobao task judge correctness tests (offline).

Negative cases each name a failure pattern from TASK_TESTING_GUIDE §4.3.3.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest

from bench_env.tests.conftest import make_judge_input

from bench_env.task.taobao.defs.AddItemToCart import AddItemToCart
from bench_env.task.taobao.defs.AddNewAddress import AddNewAddress
from bench_env.task.taobao.defs.BuyThenRefund import BuyThenRefund
from bench_env.task.taobao.defs.BuyToSchoolHuabei import BuyToSchoolHuabei
from bench_env.task.taobao.defs.CheapestInShop import CheapestInShop
from bench_env.task.taobao.defs.CheckoutCartItem import CheckoutCartItem
from bench_env.task.taobao.defs.ClearAllUnread import ClearAllUnread
from bench_env.task.taobao.defs.ConfirmReceipt import ConfirmReceipt
from bench_env.task.taobao.defs.CurateCart import CurateCart
from bench_env.task.taobao.defs.FollowShop import FollowShop
from bench_env.task.taobao.defs.RefundOrder import RefundOrder
from bench_env.task.taobao.defs.SearchAndBuyNow import SearchAndBuyNow
from bench_env.task.taobao.defs.SetDefaultAddress import SetDefaultAddress

ALL_TASK_NAMES = {
    "AddItemToCart", "AddNewAddress", "BuyThenRefund", "BuyToSchoolHuabei",
    "CheapestInShop", "CheckoutCartItem", "ClearAllUnread", "ConfirmReceipt",
    "CurateCart", "FollowShop", "RefundOrder", "SearchAndBuyNow", "SetDefaultAddress",
}

TEST_OS_STATE = {"time": {"timestamp": 1781049600000}}
DEFAULT_ROUTE = {"app": "taobao", "path": "/"}


def _load_defaults() -> dict[str, Any]:
    p = Path(__file__).resolve().parents[3] / "apps" / "Taobao" / "data" / "defaults.json"
    return json.loads(p.read_text(encoding="utf-8"))


DEFAULTS = _load_defaults()
SCHOOL_ADDR = next(a for a in DEFAULTS["addresses"] if a.get("tag") == "学校")
DEFAULT_ADDR = next(a for a in DEFAULTS["addresses"] if a.get("isDefault"))


def _inp(init_state, curr_state, *, answer=None):
    return make_judge_input(
        {"apps": {"taobao": init_state}, "os": TEST_OS_STATE},
        {"apps": {"taobao": curr_state}, "os": TEST_OS_STATE},
        route=DEFAULT_ROUTE,
        answer=answer,
    )


# ── State builders ──────────────────────────────────────────────────

def _addr_full(addr: dict[str, Any]) -> str:
    return addr["region"].replace(" ", "") + addr["detail"]


def _item(state: dict[str, Any], item_id: str) -> dict[str, Any]:
    return next(i for i in state["items"] if i["id"] == item_id)


def _with_cart_added(state, item_id, *, cart_id="c_new1", qty=1):
    nxt = copy.deepcopy(state)
    item = _item(nxt, item_id)
    nxt["cart"] = [
        {"id": cart_id, "itemId": item_id, "skuDesc": "默认", "qty": qty,
         "price": item["price"], "selected": False, "invalid": False,
         "addedAt": TEST_OS_STATE["time"]["timestamp"]},
        *nxt["cart"],
    ]
    return nxt


def _with_followed(state, shop_id):
    nxt = copy.deepcopy(state)
    nxt["followedShops"] = [shop_id, *nxt["followedShops"]]
    return nxt


def _with_member(state, shop_id):
    nxt = copy.deepcopy(state)
    nxt["memberShops"] = [*nxt["memberShops"], shop_id]
    return nxt


def _with_unread_cleared(state, *chat_ids):
    nxt = copy.deepcopy(state)
    targets = set(chat_ids) if chat_ids else {c["id"] for c in nxt["chats"]}
    for c in nxt["chats"]:
        if c["id"] in targets:
            c["unread"] = 0
    return nxt


def _with_default_addr(state, addr_id):
    nxt = copy.deepcopy(state)
    for a in nxt["addresses"]:
        a["isDefault"] = a["id"] == addr_id
    return nxt


def _with_search(state, kw):
    nxt = copy.deepcopy(state)
    nxt["searchHistory"] = [kw, *nxt["searchHistory"]]
    return nxt


def _with_new_order(
    state, item_id, *, order_id="o_new1", status="pendingShip",
    pay_method="支付宝", paid=True, address=None, qty=1, extra_item_id=None,
):
    nxt = copy.deepcopy(state)
    item = _item(nxt, item_id)
    addr = address or DEFAULT_ADDR
    lines = [{"itemId": item_id, "title": item["title"], "image": item["image"],
              "skuDesc": "默认", "price": item["price"], "qty": qty}]
    if extra_item_id:
        extra = _item(nxt, extra_item_id)
        lines.append({"itemId": extra_item_id, "title": extra["title"], "image": extra["image"],
                      "skuDesc": "默认", "price": extra["price"], "qty": 1})
    ts = TEST_OS_STATE["time"]["timestamp"]
    nxt["orders"] = [
        {"id": order_id, "orderNo": "33test001", "shopId": item["shopId"],
         "shopName": "测试店铺", "shopBadge": "tmall", "lines": lines,
         "itemTotal": item["price"] * qty, "shopDiscount": 0, "shippingFee": 0,
         "paidAmount": item["price"] * qty, "status": status,
         "addressSnapshot": {"name": addr["name"],
                             "phone": addr["phone"][:3] + "****" + addr["phone"][-4:],
                             "full": _addr_full(addr)},
         "payMethod": pay_method if paid else None,
         "createdAt": ts, "paidAt": ts if paid else None,
         "shippedAt": None, "completedAt": None, "payDeadline": None,
         "autoConfirmAt": None,
         "logistics": {"noLogistics": False, "company": None, "trackingNo": None, "nodes": []},
         "reviewed": False, "gift": None},
        *nxt["orders"],
    ]
    return nxt


def _with_refund(state, order_id, reason, *, refund_id="rf_new1"):
    nxt = copy.deepcopy(state)
    order = next(o for o in nxt["orders"] if o["id"] == order_id)
    nxt["refunds"] = [
        {"id": refund_id, "orderId": order_id, "line": order["lines"][0],
         "shopName": order["shopName"], "shopBadge": order["shopBadge"],
         "refundType": "退货/退款", "reason": reason, "amount": order["paidAmount"],
         "status": "success", "createdAt": TEST_OS_STATE["time"]["timestamp"]},
        *nxt["refunds"],
    ]
    order["status"] = "refunded"
    return nxt


def _with_order_status(state, order_id, status):
    nxt = copy.deepcopy(state)
    next(o for o in nxt["orders"] if o["id"] == order_id)["status"] = status
    return nxt


def _without_cart(state, *cart_ids):
    nxt = copy.deepcopy(state)
    nxt["cart"] = [c for c in nxt["cart"] if c["id"] not in set(cart_ids)]
    return nxt


def _with_favorite(state, item_id):
    nxt = copy.deepcopy(state)
    nxt["favorites"] = [item_id, *nxt["favorites"]]
    return nxt


def _with_cart_qty(state, cart_id, qty):
    nxt = copy.deepcopy(state)
    next(c for c in nxt["cart"] if c["id"] == cart_id)["qty"] = qty
    return nxt


def _with_new_address(state, profile):
    nxt = copy.deepcopy(state)
    nxt["addresses"] = [
        *nxt["addresses"],
        {"id": "addr_new1", "name": profile["addr_name"], "phone": profile["addr_phone"],
         "region": profile["addr_region"], "detail": profile["addr_detail"],
         "tag": profile["addr_tag"], "isDefault": False},
    ]
    return nxt


PROFILE = {
    "addr_name": "林晓彤", "addr_phone": "13912340001",
    "addr_region": "浙江省 杭州市 西湖区", "addr_detail": "文三路199号创业大厦5楼",
    "addr_tag": "公司",
}

# 完整链路正确终态:买保温杯寄学校 + 花呗分期
_school_paid = lambda: _with_new_order(
    DEFAULTS, "i_bottle", pay_method="花呗分期", address=SCHOOL_ADDR)

# CurateCart 三步全对的终态
def _curated() -> dict[str, Any]:
    s = _without_cart(DEFAULTS, "c2", "c1")        # A 移走 + B 删除
    s = _with_favorite(s, "i_earbuds")             # A 进收藏
    return _with_cart_qty(s, "c4", 3)              # C 数量改 3


# ── Cases ───────────────────────────────────────────────────────────

OFFLINE_JUDGE_POSITIVE_CASES = [
    ("AddItemToCart", lambda: (
        AddItemToCart(item_id="i_alarm", item_title="蓝鲸 智能闹钟 多种内置闹铃 睡眠监测 桌面时钟"),
        _inp(copy.deepcopy(DEFAULTS), _with_cart_added(DEFAULTS, "i_alarm")))),
    ("FollowShop", lambda: (
        FollowShop(shop_id="s_lanjing", shop_name="蓝鲸数码旗舰店"),
        _inp(copy.deepcopy(DEFAULTS), _with_followed(DEFAULTS, "s_lanjing")))),
    ("ClearAllUnread", lambda: (
        ClearAllUnread(),
        _inp(copy.deepcopy(DEFAULTS), _with_unread_cleared(DEFAULTS)))),
    ("SetDefaultAddress", lambda: (
        SetDefaultAddress(address_id="addr2", address_detail="七莘路765弄东苑新天地公寓207"),
        _inp(copy.deepcopy(DEFAULTS), _with_default_addr(DEFAULTS, "addr2")))),
    ("SearchAndBuyNow", lambda: (
        SearchAndBuyNow(item_id="i_handcream",
                        item_title="清风山 山雾香氛护手霜 75mL 保湿滋润 生日礼物",
                        search_kw="清风山"),
        _inp(copy.deepcopy(DEFAULTS),
             _with_new_order(_with_search(DEFAULTS, "清风山 山雾香氛护手霜"), "i_handcream")))),
    ("CheckoutCartItem", lambda: (
        CheckoutCartItem(cart_id="c3", item_id="i_hoodie",
                         item_title="云裳 华夫格卫衣 白灰色 宽松显瘦 开衫外套女"),
        _inp(copy.deepcopy(DEFAULTS),
             _without_cart(_with_new_order(DEFAULTS, "i_hoodie"), "c3")))),
    ("ConfirmReceipt", lambda: (
        ConfirmReceipt(order_id="o_ship1",
                       order_item_title="蓝鲸 智能闹钟 多种内置闹铃 睡眠监测 桌面时钟"),
        _inp(copy.deepcopy(DEFAULTS), _with_order_status(DEFAULTS, "o_ship1", "completed")))),
    ("RefundOrder", lambda: (
        RefundOrder(order_id="o_done1",
                    order_item_title="清风山 焕活精华液 30mL 紧致修护", reason="不想要了"),
        _inp(copy.deepcopy(DEFAULTS), _with_refund(DEFAULTS, "o_done1", "不想要了")))),
    ("AddNewAddress", lambda: (
        AddNewAddress(**PROFILE),
        _inp(copy.deepcopy(DEFAULTS), _with_new_address(DEFAULTS, PROFILE)))),
    ("CheapestInShop", lambda: (
        CheapestInShop(shop_id="s_qfs", shop_name="清风山旗舰店"),
        _inp(copy.deepcopy(DEFAULTS), copy.deepcopy(DEFAULTS),
             answer="清风山旗舰店里最便宜的是山雾香氛护手霜,128元"))),
    ("BuyThenRefund", lambda: (
        BuyThenRefund(item_id="i_lamp",
                      item_title="简木 护眼台灯 无极调光 学习阅读床头灯", reason="不想要了"),
        _inp(copy.deepcopy(DEFAULTS),
             _with_refund(_with_new_order(DEFAULTS, "i_lamp"), "o_new1", "不想要了")))),
    ("CurateCart", lambda: (
        CurateCart(cart_a_id="c2", item_a_id="i_earbuds",
                   item_a_title="蓝鲸 真无线蓝牙耳机 主动降噪 超长续航",
                   cart_b_id="c1", item_b_title="清风山 葵花沐浴露 500mL 身体乳套装 温和清洁",
                   cart_c_id="c4", item_c_title="桔子 每日坚果礼盒 30包混合装 孕妇零食",
                   item_c_qty=3),
        _inp(copy.deepcopy(DEFAULTS), _curated()))),
    ("BuyToSchoolHuabei", lambda: (
        BuyToSchoolHuabei(item_id="i_bottle", item_title="简木 焖烧保温杯 316不锈钢 大容量"),
        _inp(copy.deepcopy(DEFAULTS), _school_paid()))),
]

OFFLINE_JUDGE_NEGATIVE_CASES = [
    # 操作错误目标:加购了别的商品
    ("AddItemToCart", lambda: (
        AddItemToCart(item_id="i_alarm", item_title="蓝鲸 智能闹钟 多种内置闹铃 睡眠监测 桌面时钟"),
        _inp(copy.deepcopy(DEFAULTS), _with_cart_added(DEFAULTS, "i_lamp")))),
    # 做反操作:点成了入会,没关注
    ("FollowShop", lambda: (
        FollowShop(shop_id="s_lanjing", shop_name="蓝鲸数码旗舰店"),
        _inp(copy.deepcopy(DEFAULTS), _with_member(DEFAULTS, "s_lanjing")))),
    # 部分完成:只读了一个会话,另一个未读还在
    ("ClearAllUnread", lambda: (
        ClearAllUnread(),
        _inp(copy.deepcopy(DEFAULTS), _with_unread_cleared(DEFAULTS, "ch_sys_logi")))),
    # 操作错误目标:把另一个地址设成了默认
    ("SetDefaultAddress", lambda: (
        SetDefaultAddress(address_id="addr2", address_detail="七莘路765弄东苑新天地公寓207"),
        _inp(copy.deepcopy(DEFAULTS), _with_default_addr(DEFAULTS, "addr3")))),
    # 部分完成:搜了、下了单,但没支付(待付款)
    ("SearchAndBuyNow", lambda: (
        SearchAndBuyNow(item_id="i_handcream",
                        item_title="清风山 山雾香氛护手霜 75mL 保湿滋润 生日礼物",
                        search_kw="清风山"),
        _inp(copy.deepcopy(DEFAULTS),
             _with_new_order(_with_search(DEFAULTS, "清风山"), "i_handcream",
                             status="pendingPayment", paid=False)))),
    # 违反核心约束:走立即购买,购物车条目没消掉
    ("CheckoutCartItem", lambda: (
        CheckoutCartItem(cart_id="c3", item_id="i_hoodie",
                         item_title="云裳 华夫格卫衣 白灰色 宽松显瘦 开衫外套女"),
        _inp(copy.deepcopy(DEFAULTS), _with_new_order(DEFAULTS, "i_hoodie")))),
    # 操作错误目标:确认了另一单
    ("ConfirmReceipt", lambda: (
        ConfirmReceipt(order_id="o_ship1",
                       order_item_title="蓝鲸 智能闹钟 多种内置闹铃 睡眠监测 桌面时钟"),
        _inp(copy.deepcopy(DEFAULTS), _with_order_status(DEFAULTS, "o_ship2", "completed")))),
    # 值接近但不对:原因选错
    ("RefundOrder", lambda: (
        RefundOrder(order_id="o_done1",
                    order_item_title="清风山 焕活精华液 30mL 紧致修护", reason="不想要了"),
        _inp(copy.deepcopy(DEFAULTS), _with_refund(DEFAULTS, "o_done1", "质量问题")))),
    # 部分完成:手机号填错一位
    ("AddNewAddress", lambda: (
        AddNewAddress(**PROFILE),
        _inp(copy.deepcopy(DEFAULTS),
             _with_new_address(DEFAULTS, {**PROFILE, "addr_phone": "13912340009"})))),
    # 值接近但不对
    ("CheapestInShop", lambda: (
        CheapestInShop(shop_id="s_qfs", shop_name="清风山旗舰店"),
        _inp(copy.deepcopy(DEFAULTS), copy.deepcopy(DEFAULTS),
             answer="最便宜的大概130元"))),
    # 操作错误目标:买了也付了,但退掉的是旧订单
    ("BuyThenRefund", lambda: (
        BuyThenRefund(item_id="i_lamp",
                      item_title="简木 护眼台灯 无极调光 学习阅读床头灯", reason="不想要了"),
        _inp(copy.deepcopy(DEFAULTS),
             _with_refund(_with_new_order(DEFAULTS, "i_lamp"), "o_done1", "不想要了")))),
    # 部分完成:前两步做了,数量没改
    ("CurateCart", lambda: (
        CurateCart(cart_a_id="c2", item_a_id="i_earbuds",
                   item_a_title="蓝鲸 真无线蓝牙耳机 主动降噪 超长续航",
                   cart_b_id="c1", item_b_title="清风山 葵花沐浴露 500mL 身体乳套装 温和清洁",
                   cart_c_id="c4", item_c_title="桔子 每日坚果礼盒 30包混合装 孕妇零食",
                   item_c_qty=3),
        _inp(copy.deepcopy(DEFAULTS),
             _with_favorite(_without_cart(DEFAULTS, "c2", "c1"), "i_earbuds")))),
    # 部分完成:忘了改地址(用默认地址付了花呗)
    ("BuyToSchoolHuabei", lambda: (
        BuyToSchoolHuabei(item_id="i_bottle", item_title="简木 焖烧保温杯 316不锈钢 大容量"),
        _inp(copy.deepcopy(DEFAULTS),
             _with_new_order(DEFAULTS, "i_bottle", pay_method="花呗分期")))),
]

# §4.3.4 边界用例(独立列表,不破坏矩阵完整性)
EXTRA_NEGATIVE_CASES = [
    # 空回答
    ("CheapestInShop_empty_answer", lambda: (
        CheapestInShop(shop_id="s_qfs", shop_name="清风山旗舰店"),
        _inp(copy.deepcopy(DEFAULTS), copy.deepcopy(DEFAULTS), answer=None))),
    # 多数字干扰:没有 128
    ("CheapestInShop_number_noise", lambda: (
        CheapestInShop(shop_id="s_qfs", shop_name="清风山旗舰店"),
        _inp(copy.deepcopy(DEFAULTS), copy.deepcopy(DEFAULTS),
             answer="店里有4件商品,最贵的345元,销量2000+"))),
    # 多买了一件(lines 不止目标商品)
    ("CheckoutCartItem_extra_line", lambda: (
        CheckoutCartItem(cart_id="c3", item_id="i_hoodie",
                         item_title="云裳 华夫格卫衣 白灰色 宽松显瘦 开衫外套女"),
        _inp(copy.deepcopy(DEFAULTS),
             _without_cart(_with_new_order(DEFAULTS, "i_hoodie", extra_item_id="i_nuts"), "c3")))),
    # 未操作
    ("CurateCart_untouched", lambda: (
        CurateCart(cart_a_id="c2", item_a_id="i_earbuds",
                   item_a_title="蓝鲸 真无线蓝牙耳机 主动降噪 超长续航",
                   cart_b_id="c1", item_b_title="清风山 葵花沐浴露 500mL 身体乳套装 温和清洁",
                   cart_c_id="c4", item_c_title="桔子 每日坚果礼盒 30包混合装 孕妇零食",
                   item_c_qty=3),
        _inp(copy.deepcopy(DEFAULTS), copy.deepcopy(DEFAULTS)))),
]

EXTRA_POSITIVE_CASES = [
    # 数字带尾零格式
    ("CheapestInShop_trailing_zero", lambda: (
        CheapestInShop(shop_id="s_qfs", shop_name="清风山旗舰店"),
        _inp(copy.deepcopy(DEFAULTS), copy.deepcopy(DEFAULTS),
             answer="全店最低 128.00 元(山雾香氛护手霜)"))),
]


class TestTaskJudgeMatrixOffline:
    def test_offline_judge_matrix_complete(self):
        positive = {name for name, _ in OFFLINE_JUDGE_POSITIVE_CASES}
        negative = {name for name, _ in OFFLINE_JUDGE_NEGATIVE_CASES}
        assert positive == ALL_TASK_NAMES
        assert negative == ALL_TASK_NAMES

    @pytest.mark.parametrize("task_name,builder", OFFLINE_JUDGE_POSITIVE_CASES,
                             ids=[n for n, _ in OFFLINE_JUDGE_POSITIVE_CASES])
    def test_positive_case(self, task_name, builder):
        task, inp = builder()
        result = task.evaluate(inp)
        assert result.success, f"{task_name} positive failed: issues={result.issues}"

    @pytest.mark.parametrize("task_name,builder", OFFLINE_JUDGE_NEGATIVE_CASES,
                             ids=[n for n, _ in OFFLINE_JUDGE_NEGATIVE_CASES])
    def test_negative_case(self, task_name, builder):
        task, inp = builder()
        result = task.evaluate(inp)
        assert not result.success, f"{task_name} negative unexpectedly passed"

    @pytest.mark.parametrize("task_name,builder", EXTRA_NEGATIVE_CASES,
                             ids=[n for n, _ in EXTRA_NEGATIVE_CASES])
    def test_extra_negative_case(self, task_name, builder):
        task, inp = builder()
        result = task.evaluate(inp)
        assert not result.success, f"{task_name} extra negative unexpectedly passed"

    @pytest.mark.parametrize("task_name,builder", EXTRA_POSITIVE_CASES,
                             ids=[n for n, _ in EXTRA_POSITIVE_CASES])
    def test_extra_positive_case(self, task_name, builder):
        task, inp = builder()
        result = task.evaluate(inp)
        assert result.success, f"{task_name} extra positive failed: issues={result.issues}"
