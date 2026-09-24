"""Broadcast (Apple Podcasts clone) App-Tool-quality probe tasks (services).

See ``services/__init__.py`` for the four-lens design rationale
(``idinhand`` / ``state_direct`` / ``field_mismatch`` / ``query_scan_mismatch``).
Every number/title/id below was read directly from
``apps/Broadcast/data/defaults.json`` — key facts used across this file:

- ``followedShowIds`` (10): s_42(4.5/68/两周一更), s_gv101(4.8/530/两周一更),
  s_crossing(4.6/240/一周一更), s_espresso(4.6/410/每日更新),
  s_whatsnext(4.6/320/两周一更), s_dragon(4.3/64/不定期更新),
  s_yaoyao(4.5/96/不定期更新), s_zhangxj(4.7/280/一周一更),
  s_latetalk(4.7/152/一周一更), s_gv101cn(4.5/88/一周一更).
- ``savedEpisodeIds`` (5): e_crossing_minimax(2280s), e_zhangxj_business(4500s),
  e_42_bubble(4260s), e_42_vanity(4080s), e_latetalk_minimax(3600s).
- ``upNextIds`` (5): e_42_albert(2460s), e_yaoyao_y27(3420s), e_dragon_ai(2520s),
  e_whatsnext_s10(3480s), e_crossing_minimax(2280s).
- ``queueIds`` initial: same 5 ids as ``upNextIds`` (待播/队列双写；泡沫单集不在初态队列里).
- ``s_42`` (42章经) is the only show with >1 episode (5): e_42_albert(2460s,
  2026-05-16), e_42_vanity(4080s, 2026-05-23), e_42_bubble(4260s, 2026-06-13,
  latest), e_42_agent(3960s, 2026-04-23), e_42_openclaw(3420s, 2026-03-14,
  earliest). Sum of durations = 18180s = 303 minutes.
"""

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
    # ---------------------------------------------------------------- idinhand
    spec(
        "broadcast_v4_01_idinhand_followed_min_ratingcount",
        "打开播客App『资料库』页面里的『节目』列表（也就是你关注的10个节目），"
        "逐一核实清单里每个节目的评分人数(不是评分本身，是打分的人数)，"
        "找出评分人数最少的那一个节目，记录该节目名称、评分人数与更新频率(cadence)。"
        "在笔记中新建标题为「关注节目最低热度核实」的笔记，记录这三项信息。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="关注节目最低热度核实",
            contains=["屠龙之术", "64", "不定期更新"],
            not_contains=["42章经", "68", "遥遥有期", "96", "硅谷101", "4.8"],
        )],
        NOTES_CHANGES,
        ["broadcast__get_show_summary"],
        tags=("idinhand", "nonsearch_id_source", "followed_list"),
        max_steps=45,
    ),
    spec(
        "broadcast_v4_02_idinhand_saved_longest_episode",
        "打开播客App『资料库』页面里的『已保存』单集列表（一共5期已保存的单集），"
        "逐一核实清单里每期单集的时长，找出其中时长最长的那一期，"
        "记录它的完整标题以及所属节目名称。"
        "在笔记中新建标题为「已保存最长单集核实」的笔记，记录该单集完整标题与所属节目名称。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="已保存最长单集核实",
            contains=["当软件容易被创作", "张小珺商业访谈录"],
            not_contains=["42章经", "对谈 Albert", "泡沫的四个必要不充分条件", "虚荣心", "MiniMax"],
        )],
        NOTES_CHANGES,
        ["broadcast__get_episode_summary"],
        tags=("idinhand", "nonsearch_id_source", "saved_list"),
        max_steps=40,
    ),
    spec(
        "broadcast_v4_03_idinhand_upnext_shortest_episode",
        "打开播客App的『待播清单』(Up Next)，里面一共有5期排队等待播放的单集，"
        "逐一核实清单里每期单集的时长，找出其中时长最短的那一期，"
        "记录它的完整标题以及所属节目名称。"
        "在笔记中新建标题为「待播清单最短单集核实」的笔记，记录该单集完整标题与所属节目名称。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="待播清单最短单集核实",
            contains=["对话 MiniMax 闫俊杰", "十字路口 Crossing"],
            not_contains=["42章经", "遥遥有期", "屠龙之术", "科技早知道"],
        )],
        NOTES_CHANGES,
        ["broadcast__get_episode_summary"],
        tags=("idinhand", "nonsearch_id_source", "up_next_list"),
        max_steps=40,
    ),
    # ------------------------------------------------------------- state_direct
    spec(
        "broadcast_v4_04_state_add_shortest_followed_episode",
        "在你已关注的所有节目里(资料库-节目列表，共10个)，找出这些节目全部单集中时长最短的那一期，"
        "把它加入播放队列（添加到队列）。这个任务不需要记笔记。",
        ["broadcast"],
        [],
        QUEUE_CHANGES,
        ["broadcast__get_show_summary", "broadcast__get_episode_summary", "broadcast__add_to_queue"],
        tags=("state_direct", "no_notes", "followed_list"),
        max_steps=50,
    ),
    spec(
        "broadcast_v4_05_state_add_highcount_lowrating",
        "在播客App的全部节目中，找出所有评分(rating)低于4.6的节目，在这些节目里找出评分人数(ratingCount)"
        "最多的那一个，把它唯一一期单集加入播放队列（添加到队列）。这个任务不需要记笔记。",
        ["broadcast"],
        [],
        QUEUE_CHANGES,
        ["broadcast__search_shows", "broadcast__get_show_summary", "broadcast__get_episode_summary", "broadcast__add_to_queue"],
        tags=("state_direct", "no_notes", "global_filter", "no_tool_gui_fallback"),
        max_steps=55,
    ),
    spec(
        "broadcast_v4_06_state_add_saved_inprogress",
        "在你已保存的单集列表里(共5期)，找到唯一一期播放进度(progress)大于0、但还没有播完的单集，"
        "把它加入播放队列（添加到队列）。这个任务不需要记笔记。",
        ["broadcast"],
        [],
        QUEUE_CHANGES,
        ["broadcast__get_episode_summary", "broadcast__add_to_queue"],
        tags=("state_direct", "no_notes", "saved_list"),
        max_steps=40,
    ),
    # ------------------------------------------------------------ field_mismatch
    spec(
        "broadcast_v4_07_field_mismatch_cadence_vs_actual_dates",
        "播客『42章经』节目页面上显示的更新频率(cadence)是「两周一更」——这只是一个大致的更新节奏描述，"
        "并不直接等于任何一期的具体发布时间。请你逐一核实该节目全部5期单集的发布时间，"
        "找出其中发布时间最新（最近发布）的一期，以及发布时间最早（最先发布）的一期。"
        "在笔记中新建标题为「42章经发布时间核实」的笔记，记录：①该节目的更新频率描述文字，"
        "②发布时间最新一期的完整标题，③发布时间最早一期的完整标题。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="42章经发布时间核实",
            contains=["两周一更", "泡沫的四个必要不充分条件", "OpenClaw"],
            not_contains=["当软件容易被创作", "虚荣心", "Agent 动力学"],
        )],
        NOTES_CHANGES,
        ["broadcast__get_episode_summary"],
        tags=("field_mismatch", "aggregate_vs_specific", "cadence_vs_date"),
        max_steps=45,
    ),
    spec(
        "broadcast_v4_08_field_mismatch_ratingcount_vs_rating",
        "核实播客『无聊斋』的评分人数(ratingCount)具体是多少——注意「评分人数」和「评分」是两个不同的字段，"
        "评分人数指的是打分的人数，不是星级分数本身，不要把两者弄混。"
        "在笔记中新建标题为「无聊斋评分人数核实」的笔记，只记录该节目的评分人数这一个数字。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="无聊斋评分人数核实",
            contains=["2100"],
            not_contains=["4.7", "1650", "1340", "1200", "1180"],
        )],
        NOTES_CHANGES,
        ["broadcast__search_shows", "broadcast__get_show_summary"],
        tags=("field_mismatch", "adjacent_fields", "rating_vs_ratingcount"),
        max_steps=30,
    ),
    spec(
        "broadcast_v4_09_field_mismatch_total_duration_vs_episodecount",
        "播客『42章经』的节目详情只会告诉你它总共有几期单集，并不会直接告诉你这些单集加起来一共"
        "有多长。请你把该节目全部5期单集的时长分别核实清楚，计算总时长一共是多少分钟。"
        "在笔记中新建标题为「42章经总时长核算」的笔记，记录该节目的单集总数，以及全部单集加起来的"
        "总时长（换算成分钟，取整数）。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="42章经总时长核算",
            contains=["5", "303"],
            not_contains=["246", "262"],
        )],
        NOTES_CHANGES,
        ["broadcast__get_episode_summary"],
        tags=("field_mismatch", "aggregate_vs_specific", "duration_sum"),
        max_steps=45,
    ),
    # ------------------------------------------------------- query_scan_mismatch
    spec(
        "broadcast_v4_10_query_scan_irregular_highcount",
        "在播客App的**全部**节目中（不限定在某几个具体节目名单里，需要你自己从全部节目列表中筛选），"
        "找出所有同时满足『更新频率标注为「不定期更新」』且『评分人数超过100』这两个条件的节目。"
        "在笔记中新建标题为「不定期更新高热度筛选」的笔记，记录符合条件的每个节目名称与评分人数，"
        "以及总共有多少个节目符合条件。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="不定期更新高热度筛选",
            contains=["自由职业之后", "141", "Blow Your Mind", "782", "2"],
            not_contains=["遥遥有期", "屠龙之术", "晚点对谈"],
        )],
        NOTES_CHANGES,
        [],
        tags=("query_scan_mismatch", "global_filter", "no_tool_gui_fallback"),
        max_steps=55,
    ),
    spec(
        "broadcast_v4_11_query_scan_weekly_lowcount",
        "在播客App的**全部**节目中（不限定在某几个具体节目名单里，需要你自己从全部节目列表中筛选），"
        "找出所有同时满足『更新频率标注为「每周更新」』（注意这与「一周一更」是两种不同的文字表述，"
        "请仔细核对每个节目页面上更新频率的原文）且『评分人数低于600』这两个条件的节目。"
        "在笔记中新建标题为「每周更新低热度筛选」的笔记，记录符合条件的每个节目名称与评分人数，"
        "以及总共有多少个节目符合条件。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="每周更新低热度筛选",
            contains=["打工谈", "315", "黑猫侦探社", "528", "2"],
            not_contains=["忽左忽右", "肥话连篇"],
        )],
        NOTES_CHANGES,
        [],
        tags=("query_scan_mismatch", "global_filter", "no_tool_gui_fallback"),
        max_steps=55,
    ),
    spec(
        "broadcast_v4_12_query_scan_duration_unsaved_episodes",
        "在播客App的**全部**单集中（不限定在某几期节目名单里，需要你自己从全部单集列表中筛选），"
        "找出所有同时满足『时长(单位:秒)在3900到4300之间，含两端』且『尚未被收藏(即不在「已保存」列表里)』"
        "这两个条件的单集。在笔记中新建标题为「时长区间未收藏单集筛选」的笔记，记录符合条件的每期单集"
        "完整标题、所属节目名称，以及总共有多少期单集符合条件。",
        ["broadcast", "notes"],
        [goal(
            "notes_note", title="时长区间未收藏单集筛选",
            contains=["Agent 动力学", "42章经", "选择太多", "Blow Your Mind", "夏天最狼狈的十个瞬间", "无聊斋", "3"],
            not_contains=["泡沫的四个必要不充分条件", "虚荣心"],
        )],
        NOTES_CHANGES,
        [],
        tags=("query_scan_mismatch", "global_filter", "no_tool_gui_fallback"),
        max_steps=60,
    ),
]

EXTRA_CHECKS = {
    "broadcast_v4_04_state_add_shortest_followed_episode": _queue_added("e_espresso_today"),
    "broadcast_v4_05_state_add_highcount_lowrating": _queue_added("e_zhenbu_career"),
    "broadcast_v4_06_state_add_saved_inprogress": _queue_added("e_42_vanity"),
}

build_task_classes(SPECS, EXTRA_CHECKS, module_globals=globals(), module_name=__name__)
