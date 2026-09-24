"""Broadcast (Apple Podcasts clone) hybrid GUI+Tools tasks (tasklib)."""

from __future__ import annotations

from typing import Any

from bench_env.task.tasklib.base import build_task_classes, goal, spec
from bench_env.task.judge import JudgeInput

NOTES_CHANGES = ["notes.notes"]
QUEUE_CHANGES = ["broadcast.queueIds"]


def _queue_added(*episode_ids: str):
    def _check(input: JudgeInput) -> list[dict[str, Any]]:
        initial = list((input.apps_init.get("broadcast") or {}).get("queueIds") or [])
        final = list((input.apps.get("broadcast") or {}).get("queueIds") or [])
        missing = [eid for eid in episode_ids if eid in initial or eid not in final]
        return [{
            "field": "broadcast_queue_added",
            "expected": f"{list(episode_ids)} newly present",
            "actual": final,
            "passed": not missing,
        }]
    return _check


SPECS = [
    spec(
        "broadcast_01_gv101_top_rating",
        "比较播客「42章经」「晚点聊 LateTalk」「硅谷101」三个节目的评分，找出评分最高的一个，"
        "在笔记中新建标题为「播客评分对比」的笔记，记录该节目名称与评分。",
        ["broadcast", "notes"],
        [goal("notes_note", title="播客评分对比", contains=["硅谷101", "4.8"])],
        NOTES_CHANGES,
        ["broadcast__search_shows", "broadcast__get_show_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "broadcast_02_halflatte_top",
        "比较播客「半拿铁｜商业沉浮录」「无聊斋」「忽左忽右」三个节目的评分，找出评分最高的一个，"
        "在笔记中新建标题为「商业播客对比」的笔记，记录该节目名称与评分。",
        ["broadcast", "notes"],
        [goal("notes_note", title="商业播客对比", contains=["半拿铁", "4.9"])],
        NOTES_CHANGES,
        ["broadcast__search_shows", "broadcast__get_show_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "broadcast_03_bubble_addqueue",
        "在播客「42章经」中找到标题包含「泡沫」的那一期节目，将它加入播放队列（Up Next），"
        "并在笔记中新建标题为「稍后收听」的笔记，记录该期完整标题与所属节目名称。",
        ["broadcast", "notes"],
        [goal("notes_note", title="稍后收听", contains=["泡沫", "42章经"])],
        NOTES_CHANGES + QUEUE_CHANGES,
        ["broadcast__search_episodes", "broadcast__get_episode_summary", "broadcast__add_to_queue"],
        tags=("query_then_action", "queue"),
    ),
    spec(
        "broadcast_04_bubble_chapter_notool",
        "打开播客「42章经」里标题包含「泡沫」的那一期节目的详情页，在章节列表中找到同时提到「β」和「α」的那个小节，"
        "在笔记中新建标题为「章节核实」的笔记，记录该小节的完整标题。",
        ["broadcast", "notes"],
        [goal("notes_note", title="章节核实", contains=["β", "α"])],
        NOTES_CHANGES,
        ["broadcast__search_episodes", "broadcast__get_episode_summary", "broadcast__open_episode"],
        tags=("no_tool_gui_fallback", "browse"),
    ),
    spec(
        "broadcast_05_lowest_rating",
        "比较播客「天真不天真」「屠龙之术」「CEO 来信」三个节目的评分，找出评分最低的一个，"
        "在笔记中新建标题为「待改进榜」的笔记，记录该节目名称与评分。",
        ["broadcast", "notes"],
        [goal("notes_note", title="待改进榜", contains=["屠龙之术", "4.3"])],
        NOTES_CHANGES,
        ["broadcast__search_shows", "broadcast__get_show_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "broadcast_06_agent_episode_summary",
        "在播客「42章经」中找到标题包含「Agent 动力学」的那一期节目，"
        "在笔记中新建标题为「Agent 节目」的笔记，记录该期节目的完整标题。",
        ["broadcast", "notes"],
        [goal("notes_note", title="Agent 节目", contains=["Agent", "动力学", "40", "Agents"])],
        NOTES_CHANGES,
        ["broadcast__search_episodes", "broadcast__get_episode_summary"],
        tags=("query",),
    ),
    spec(
        "broadcast_07_ratingcount_top",
        "比较播客「组织进化论」「打工谈」「自由职业之后」三个节目的评分人数(ratingCount)，找出评分人数最多的一个，"
        "在笔记中新建标题为「热度对比」的笔记，记录该节目名称与评分人数。",
        ["broadcast", "notes"],
        [goal("notes_note", title="热度对比", contains=["打工谈", "315"])],
        NOTES_CHANGES,
        ["broadcast__search_shows", "broadcast__get_show_summary"],
        tags=("browse", "compare"),
    ),
    spec(
        "broadcast_08_openclaw_addqueue",
        "在播客「42章经」中找到标题包含「OpenClaw」的那一期节目，将它加入播放队列（Up Next），"
        "并在笔记中新建标题为「OpenClaw待听」的笔记，记录该期完整标题。",
        ["broadcast", "notes"],
        [goal("notes_note", title="OpenClaw待听", contains=["OpenClaw", "Sheet0"])],
        NOTES_CHANGES + QUEUE_CHANGES,
        ["broadcast__search_episodes", "broadcast__get_episode_summary", "broadcast__add_to_queue"],
        tags=("query_then_action", "queue"),
    ),
    spec(
        "broadcast_09_minimax_dual_addqueue",
        "分别在播客「晚点聊 LateTalk」和「十字路口 Crossing」中找到关于 MiniMax 创始人闫俊杰的那期节目，"
        "把这两期节目都加入播放队列（Up Next），并在笔记中新建标题为「MiniMax 双档」的笔记，记录这两期节目各自所属的节目名称。",
        ["broadcast", "notes"],
        [goal("notes_note", title="MiniMax 双档", contains=["晚点聊", "十字路口", "MiniMax"])],
        NOTES_CHANGES + QUEUE_CHANGES,
        ["broadcast__search_episodes", "broadcast__get_episode_summary", "broadcast__add_to_queue"],
        tags=("query_then_action", "queue"),
        max_steps=50,
    ),
    spec(
        "broadcast_10_sleep_vs_blackcat",
        "比较播客「一夜好眠」和「黑猫侦探社」的评分与评分人数，在笔记中新建标题为「晚间播客对比」的笔记，"
        "记录两个节目名称、评分、评分人数，并指出综合更受欢迎的一个。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="晚间播客对比",
            contains=["一夜好眠", "4.7", "903", "黑猫侦探社", "4.6", "528"],
        )],
        NOTES_CHANGES,
        ["broadcast__search_shows", "broadcast__get_show_summary"],
        tags=("browse", "compare"),
    ),
]

EXTRA_CHECKS = {
    "broadcast_03_bubble_addqueue": _queue_added("e_42_bubble"),
    "broadcast_08_openclaw_addqueue": _queue_added("e_42_openclaw"),
    "broadcast_09_minimax_dual_addqueue": _queue_added("e_latetalk_minimax", "e_crossing_minimax"),
}

# The app's seeded defaults already have "e_42_bubble" in queueIds, which would make
# the "newly added" diff check for broadcast_03 trivially pass without any agent
# action. Clear the queue before the episode starts so the check is meaningful.
PREPARE_STATE = {
    "broadcast_03_bubble_addqueue": {"broadcast": {"queueIds": []}},
}

build_task_classes(
    SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__, prepare_states=PREPARE_STATE
)
