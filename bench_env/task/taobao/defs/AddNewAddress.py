from __future__ import annotations

from typing import Any

from bench_env.task import BaseTask
from bench_env.task.judge import JudgeInput
from bench_env.task.taobao.app import Taobao, TAOBAO_BROWSE_CHANGES


class AddNewAddress(BaseTask):
    """Verdict: one new address whose five fields all match (Create → diff;
    one semantic goal '新地址填对了' → one check)."""

    templates = [
        "新增一个收货地址:{addr_name},{addr_phone},{addr_region}{addr_detail},标签选「{addr_tag}」",
        "帮我加个收货地址,收件人{addr_name},电话{addr_phone},地址{addr_region}{addr_detail},打上「{addr_tag}」标签",
    ]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L3"
    capabilities = ["create"]

    parameters = {
        "_profile": {
            "sampler": Taobao.sample_new_address_profile,
            "fields": {
                "addr_name": "addr_name", "addr_phone": "addr_phone",
                "addr_region": "addr_region", "addr_detail": "addr_detail",
                "addr_tag": "addr_tag",
            },
        },
        "addr_name": {"type": "string", "default": "林晓彤", "description": "收件人"},
        "addr_phone": {"type": "string", "default": "13912340001", "description": "手机号"},
        "addr_region": {"type": "string", "default": "浙江省 杭州市 西湖区", "description": "省市区"},
        "addr_detail": {"type": "string", "default": "文三路199号创业大厦5楼", "description": "详细地址"},
        "addr_tag": {"type": "string", "default": "公司", "description": "地址标签"},
    }

    expected_changes = ["taobao.addresses[+1]", *TAOBAO_BROWSE_CHANGES]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        return [taobao.check_new_address(
            self.p.addr_name, self.p.addr_phone, self.p.addr_region,
            self.p.addr_detail, self.p.addr_tag,
        )]
