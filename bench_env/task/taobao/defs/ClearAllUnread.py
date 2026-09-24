from __future__ import annotations

from bench_env.task.common_tasks import CriteriaTask
from bench_env.task.taobao.app import TAOBAO_BROWSE_CHANGES


class ClearAllUnread(CriteriaTask):
    """Verdict: every chat's unread is 0. Path-free: the「清除未读」button
    and opening each chat one by one are both legitimate."""

    templates = ["把消息里的未读全部清掉"]
    apps = ["taobao"]

    scope = "S1"
    objective = "operate"
    composition = "atomic"
    difficulty = "L2"
    capabilities = ["nav"]

    criteria = {
        "chats": lambda chats: isinstance(chats, list)
        and all(int(c.get("unread", 0)) == 0 for c in chats),
    }

    expected_changes = ["taobao.chats", *TAOBAO_BROWSE_CHANGES]
