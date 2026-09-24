from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class SetDefaultAddress(BaseTask):
    """Verdict: {address} is the unique default (Modify; the old default flips
    off too, hence the wide addresses expected_changes)."""

    templates = ["把收货地址「{address_detail}」设为默认地址"]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L2"
    capabilities = ["settings"]

    parameters = {
        "_addr": {
            "sampler": Taobao.sample_nondefault_address,
            "fields": {"address_id": "address_id", "address_detail": "address_detail"},
        },
        "address_id": {"type": "string", "default": "addr2", "description": "地址 id"},
        "address_detail": {"type": "string", "default": "七莘路765弄东苑新天地公寓207",
                           "description": "地址详细描述"},
    }

    expected_changes = ["taobao.addresses", *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [taobao.check_default_address(self.p.address_id, self.p.address_detail)]
