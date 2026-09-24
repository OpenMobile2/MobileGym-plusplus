from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class BuyToSchoolHuabei(BaseTask):
    """Verdict: one new paid order for {item} whose address snapshot is the
    school-tagged address (resolved from init) and payMethod is 花呗分期.
    Address-change involves the confirm dialog (qa:Q10) — a genuinely long
    chain. Forgetting either constraint fails the single combined check."""

    templates = [
        "购买「{item_title}」,收货地址选标着「学校」的那个,支付方式用花呗分期,完成支付",
        "买一件「{item_title}」寄到学校地址,记得用花呗分期付款",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "sequential"
    difficulty = "L4"
    capabilities = ["finance", "settings"]

    parameters = {
        "_item": {
            "sampler": Taobao.sample_buyable_item,
            "fields": {"item_id": "item_id", "item_title": "item_title"},
        },
        "item_id": {"type": "string", "default": "i_bottle", "description": "商品 id"},
        "item_title": {"type": "string",
                       "default": "简木 焖烧保温杯 316不锈钢 大容量",
                       "description": "商品标题"},
    }

    expected_changes = ["taobao.orders[+1]", "taobao.cart", *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        school = next(a for a in taobao.init.addresses if a.get("tag") == "学校")
        return [taobao.check_new_paid_order(
            self.p.item_id, self.p.item_title,
            pay_method="花呗分期",
            address_contains=str(school["detail"]),
        )]
