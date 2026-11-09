from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class CurateCart(BaseTask):
    """Verdict (three independent goals): ① {itemA} moved to favorites
    (cart entry gone AND item favorited); ② {itemB} deleted; ③ {itemC}
    qty changed to the target. Swipe actions and manage mode are both
    legitimate paths."""

    templates = [
        "整理一下购物车:把「{item_a_title}」移入收藏,删掉「{item_b_title}」,再把「{item_c_title}」的数量改成{item_c_qty}",
        "购物车三件事:「{item_a_title}」移入收藏;「{item_b_title}」不要了直接删;「{item_c_title}」买{item_c_qty}件",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "sequential"
    difficulty = "L4"
    capabilities = ["edit", "delete"]

    parameters = {
        "_trio": {
            "sampler": Taobao.sample_cart_trio,
            "fields": {
                "cart_a_id": "cart_a_id", "item_a_id": "item_a_id", "item_a_title": "item_a_title",
                "cart_b_id": "cart_b_id", "item_b_title": "item_b_title",
                "cart_c_id": "cart_c_id", "item_c_title": "item_c_title",
                "item_c_qty": "item_c_qty",
            },
        },
        "cart_a_id": {"type": "string", "default": "c2", "description": "条目A id"},
        "item_a_id": {"type": "string", "default": "i_earbuds", "description": "商品A id"},
        "item_a_title": {"type": "string", "default": "蓝鲸 真无线蓝牙耳机 主动降噪 超长续航",
                         "description": "商品A 标题"},
        "cart_b_id": {"type": "string", "default": "c1", "description": "条目B id"},
        "item_b_title": {"type": "string", "default": "清风山 葵花沐浴露 500mL 身体乳套装 温和清洁",
                         "description": "商品B 标题"},
        "cart_c_id": {"type": "string", "default": "c4", "description": "条目C id"},
        "item_c_title": {"type": "string", "default": "桔子 每日坚果礼盒 30包混合装 孕妇零食",
                         "description": "商品C 标题"},
        "item_c_qty": {"type": "int", "default": 3, "min": 3, "max": 4},
    }

    expected_changes = ["taobao.cart", "taobao.favorites[+={item_a_id}]",
                        *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [
            taobao.check_cart_moved_to_favorites(
                self.p.cart_a_id, self.p.item_a_id, self.p.item_a_title),
            taobao.check_cart_entry_removed(
                self.p.cart_b_id, self.p.item_b_title, field="cart_b_deleted"),
            taobao.check_cart_entry_qty(
                self.p.cart_c_id, self.p.item_c_qty, self.p.item_c_title),
        ]
