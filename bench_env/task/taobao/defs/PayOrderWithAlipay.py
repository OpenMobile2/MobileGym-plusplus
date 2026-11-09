from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class PayOrderWithAlipay(BaseTask):
    """Checkout then pay via Alipay cross-app intent; judge store + exclude side effects.

    Demo value:
    - New-replica app uses startActivityForResult (not only old 12306 path)
    - Success = taobao order becomes pendingShip / paid
    - Exclude: wechat subscriptions untouched (did not pay via WeChat by mistake)
    """

    templates = [
        "在淘宝把购物车里已勾选的商品下单，并用支付宝完成支付",
    ]
    apps = ["taobao", "alipay"]

    scope = "S2"
    objective = "operate"
    composition = "composite"
    difficulty = "L3"
    capabilities = ["create", "cross_app"]

    expected_changes = [
        "taobao.orders",
        "taobao.cart",
        "taobao.checkout",
        "alipay.transferRecords",
        "alipay.balance",
        *TAOBAO_BROWSE_CHANGES,
    ]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        init_ids = {str(o["id"]) for o in taobao.init.orders}
        paid_new = [
            o for o in taobao.orders
            if str(o.get("id")) not in init_ids
            and o.get("status") in ("pendingShip", "shipped", "completed")
            and o.get("payMethod") == "支付宝"
        ]
        checks: list[dict[str, Any]] = [
            {
                "field": "taobao.orders[new].paid_via_alipay",
                "expected": ">=1",
                "actual": len(paid_new),
                "passed": len(paid_new) >= 1,
            },
        ]

        # exclude: wechat should not gain a new subscription from this flow
        wechat = (input.apps.get("wechat") or {})
        wechat_init = (input.apps_init.get("wechat") or {})
        subs = wechat.get("subscriptions") if isinstance(wechat, dict) else None
        subs_init = wechat_init.get("subscriptions") if isinstance(wechat_init, dict) else None
        if isinstance(subs, list) and isinstance(subs_init, list):
            checks.append({
                "field": "wechat.subscriptions.length (exclude)",
                "expected": len(subs_init),
                "actual": len(subs),
                "passed": len(subs) == len(subs_init),
            })

        return checks
