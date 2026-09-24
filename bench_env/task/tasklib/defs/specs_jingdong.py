"""Jingdong hybrid GUI+Tools tasks (tasklib).

Tools already exist (app_tools/apps/jingdong). Verification follows the
newapps_v1 pattern: every task's primary artifact is a Notes entry
(``notes_note`` goal), plus an inline cart-diff check for add-to-cart tasks.
"""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
JINGDONG_CART_CHANGES = ["jingdong.cart"]


def _cart_added(item_id: str, min_qty: int = 1):
    def _qty_for(cart: list[Any], target_item_id: str) -> int:
        return sum(
            int(row.get("qty") or 0)
            for row in cart
            if isinstance(row, dict) and row.get("itemId") == target_item_id
        )

    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        before = _qty_for((input.apps_init.get("jingdong") or {}).get("cart") or [], item_id)
        after = _qty_for((input.apps.get("jingdong") or {}).get("cart") or [], item_id)
        return [{
            "field": "jingdong_cart_added",
            "expected": f"{item_id} qty>={before + min_qty}",
            "actual": after,
            "passed": after >= before + min_qty,
        }]
    return _check


SPECS = [
    spec(
        "jingdong_01_phone_guobu_compare",
        "比较京东vivo X300和荣耀Magic两款手机的国家补贴已减金额,找出补贴金额更大的一款。"
        "在笔记中新建标题为「手机国补对比」的笔记,记录两款手机名称、国补已减金额,并指出补贴更大的一款。",
        ["jingdong", "notes"],
        [goal("notes_note", title="手机国补对比", contains=["vivo X300", "900", "荣耀Magic", "860"])],
        NOTES_CHANGES,
        ["jingdong__search_items", "jingdong__compare_items", "jingdong__get_item_summary"],
        tags=("browse", "compare"),
        max_steps=32,
    ),
    spec(
        "jingdong_02_miaosong_eta_compare",
        "比较京东秒送盒马鲜生(示范广场店)、京东七鲜(示范科技园店)、永辉超市(示范广场店)三家门店的送达时间,找出送达最快的一家。"
        "在笔记中新建标题为「秒送门店比价」的笔记,记录三家门店名称及送达时间,并指出最快的一家。",
        ["jingdong", "notes"],
        [goal("notes_note", title="秒送门店比价", contains=["盒马鲜生", "33分钟达", "京东七鲜", "29分钟达", "永辉超市", "35分钟达"])],
        NOTES_CHANGES,
        ["jingdong__search_life_shops"],
        tags=("browse", "compare"),
        max_steps=32,
    ),
    spec(
        "jingdong_03_coupon_lowest_threshold",
        "查看京东我的优惠券列表,找出使用门槛(满多少元可用)金额最低的一张。"
        "在笔记中新建标题为「优惠券速览」的笔记,记录该券的使用范围与门槛金额。",
        ["jingdong", "notes"],
        [goal("notes_note", title="优惠券速览", contains=["京东秒送", "6.01"])],
        NOTES_CHANGES,
        ["jingdong__list_coupons"],
        tags=("query",),
        max_steps=28,
    ),
    spec(
        "jingdong_04_done_orders_total",
        "查看京东我的订单中所有状态为「已完成」的订单,在笔记中新建标题为「已完成订单汇总」的笔记,"
        "记录这些订单的店铺名称、实付金额,以及金额总和。",
        ["jingdong", "notes"],
        [goal("notes_note", title="已完成订单汇总", contains=["七鲜小厨", "47.1", "368.8", "415.9"])],
        NOTES_CHANGES,
        ["jingdong__list_orders"],
        tags=("query", "compare"),
        max_steps=34,
    ),
    spec(
        "jingdong_05_appliance_guobu_addcart",
        "在京东「家电」分类下找出唯一一款享受国家补贴且价格低于1000元的商品,将其加入购物车(数量1,颜色选粉色),"
        "并在笔记中新建标题为「家电国补下单」的笔记,记录商品名称、到手价与国补已减金额。",
        ["jingdong", "notes"],
        [goal("notes_note", title="家电国补下单", contains=["电吹风", "329", "80"])],
        NOTES_CHANGES + JINGDONG_CART_CHANGES,
        ["jingdong__search_items", "jingdong__compare_items", "jingdong__get_item_summary", "jingdong__add_to_cart"],
        tags=("query_then_action", "cart"),
        max_steps=40,
    ),
    spec(
        "jingdong_06_xianyonghoufu_cheapest_addcart",
        "在京东商城中找出商品标签含「先用后付」的两款商品,选出价格较低的一款并加入购物车(数量1,规格选默认),"
        "并在笔记中新建标题为「先用后付甄选」的笔记,记录商品名称与价格。",
        ["jingdong", "notes"],
        [goal("notes_note", title="先用后付甄选", contains=["黄桃罐头", "39.9"])],
        NOTES_CHANGES + JINGDONG_CART_CHANGES,
        ["jingdong__search_items", "jingdong__compare_items", "jingdong__add_to_cart"],
        tags=("query_then_action", "cart"),
        max_steps=40,
    ),
    spec(
        "jingdong_07_phone_cheap_unique_addcart",
        "在京东「手机」分类下找出唯一一款价格低于100元的商品,将其加入购物车(数量2,容量选20000mAh),"
        "并在笔记中新建标题为「手机配件补货」的笔记,记录商品名称、单价与加购数量。",
        ["jingdong", "notes"],
        [goal("notes_note", title="手机配件补货", contains=["充电宝", "89", "2"])],
        NOTES_CHANGES + JINGDONG_CART_CHANGES,
        ["jingdong__search_items", "jingdong__compare_items", "jingdong__add_to_cart"],
        tags=("query_then_action", "cart"),
        max_steps=40,
    ),
    spec(
        "jingdong_08_cup_prepare_checkout",
        "将京东「山头林村 保温咖啡杯」加入购物车(数量1,颜色选白色),然后只勾选该商品行进入结算页面(不要提交支付),"
        "并在笔记中新建标题为「水杯下单准备」的笔记,记录商品名称与单价。",
        ["jingdong", "notes"],
        [goal("notes_note", title="水杯下单准备", contains=["保温咖啡杯", "14.78"])],
        NOTES_CHANGES + JINGDONG_CART_CHANGES,
        ["jingdong__search_items", "jingdong__add_to_cart", "jingdong__get_cart", "jingdong__prepare_checkout"],
        tags=("query_then_action", "cart", "checkout"),
        max_steps=50,
    ),
    spec(
        "jingdong_09_milk_order_logistics_first",
        "查看京东我的订单中订单号为355142001050744的物流详情页,找出其中最早一条物流记录的时间和内容。"
        "在笔记中新建标题为「牛奶订单物流」的笔记,记录下来。",
        ["jingdong", "notes"],
        [goal("notes_note", title="牛奶订单物流", contains=["07-06 14:43", "您提交了订单", "请等待系统确认"])],
        NOTES_CHANGES,
        ["jingdong__list_orders", "jingdong__get_order_summary"],
        tags=("no_tool_gui_fallback", "query"),
        max_steps=38,
    ),
    spec(
        "jingdong_10_vivo_review_gui",
        "打开京东vivo X300 12GB+256GB商品详情页的大家评,找到唯一一条评价,记录评价人昵称和完整评价内容原文。"
        "在笔记中新建标题为「手机评价核实」的笔记记录下来。",
        ["jingdong", "notes"],
        [goal("notes_note", title="手机评价核实", contains=["数***控", "影像旗舰名不虚传", "国补到手价格香", "京东物流次日达"])],
        NOTES_CHANGES,
        ["jingdong__search_items", "jingdong__get_item_summary", "jingdong__open_item"],
        tags=("no_tool_gui_fallback", "browse"),
        max_steps=38,
    ),
    spec(
        "jingdong_11_miaosong_dish_price_gui",
        "打开京东秒送盒马鲜生(示范广场店)门店,找到「乌江 脆口榨菜丝 佐餐开胃组合装」这款商品,"
        "在笔记中新建标题为「秒送榨菜比价」的笔记,记录其到手价格和原价。",
        ["jingdong", "notes"],
        [goal("notes_note", title="秒送榨菜比价", contains=["脆口榨菜丝", "7.9", "12.9"])],
        NOTES_CHANGES,
        ["jingdong__search_life_shops"],
        tags=("no_tool_gui_fallback", "browse"),
        max_steps=38,
    ),
    spec(
        "jingdong_12_couponcenter_digital_gui",
        "查看京东领券中心,找出适用范围为「手机数码」类目的优惠券(不要领取),"
        "在笔记中新建标题为「数码券核实」的笔记,记录其适用范围、面额和使用门槛。",
        ["jingdong", "notes"],
        [goal("notes_note", title="数码券核实", contains=["手机数码", "100", "1000"])],
        NOTES_CHANGES,
        [],
        tags=("no_tool_gui_fallback", "query"),
        max_steps=30,
    ),
]

EXTRA_CHECKS = {
    "jingdong_05_appliance_guobu_addcart": _cart_added("i_hairdryer", 1),
    "jingdong_06_xianyonghoufu_cheapest_addcart": _cart_added("i_huangtao", 1),
    "jingdong_07_phone_cheap_unique_addcart": _cart_added("i_powerbank", 2),
    "jingdong_08_cup_prepare_checkout": _cart_added("i_cup", 1),
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
