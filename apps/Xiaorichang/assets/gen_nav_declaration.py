#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从冻结的 spec.json 生成 navigation.declaration.ts。

保证 spec 里每个 nav transitionId 都成为 transition,每个 state/wontfix actionId 都成为
对应 uiState 的 action —— 覆盖率 gate 的 id 完整性由此保证。
返回/关闭(gesture=back, transitionId=system.back)不声明,由 bindBack 处理。

路由建模规则(与 FanqieTodo 的差异,见 README 注释):
  - 只有**唯一父页**的弹层/菜单 → 该父路由上的 searchParams 离散态(AGENTS.md 默认约定)
  - 有 **≥2 个父页**的菜单/弹层 → 独立 pathname 路由
    理由:DIALOG_ON 只能绑一个父路径;若强行绑一个,从另一个父页打开时
    transition.from 会指错页,build_nav_artifacts 会报 ERROR。
    独立 pathname 同样是 URL 驱动、同样能被 back() 弹出,不违反返回键合同。
"""
import json
from pathlib import Path

APP = "xiaorichang"
SPEC = Path(__file__).parents[5] / "docs/xiaorichang-replication/spec.json"
OUT = Path(__file__).parents[1] / "navigation.declaration.ts"

# 节点 -> 整页路由(pathname)
ROUTE_OF = {
    # --- 五个 tab 根 ---
    "today.main": ("/", "TodayPage"),
    "habit.manage": ("/habits", "HabitManagePage"),
    "focus.main": ("/focus", "FocusPage"),
    "stats.main": ("/stats", "StatsPage"),
    "profile.main": ("/me", "ProfilePage"),
    # --- 今日 ---
    "today.card": ("/today/card", "TodayCardPage"),
    "checkin.tutorial": ("/checkin/tutorial", "CheckinTutorialPage"),
    "checkin.noteFull": ("/checkin/note", "CheckinNotePage"),
    # --- 习惯 ---
    "habit.create": ("/habits/edit", "HabitEditPage"),
    "habit.iconPicker": ("/habits/edit/icon", "IconPickerPage"),
    "habit.reminder": ("/habits/reminder", "ReminderPage"),
    "habit.reminderAdd": ("/habits/reminder/add", "ReminderAddPage"),
    "habit.groupCreate": ("/habits/group/new", "GroupCreatePage"),
    "habit.groupPick": ("/habits/group/pick", "GroupHabitPickerPage"),
    "habit.contextManage": ("/habits/contexts", "ContextManagePage"),
    "habit.archived": ("/habits/archived", "ArchivedPage"),
    "habit.pickTemplate": ("/habits/templates", "TemplatePage"),
    "habit.detail": ("/habit", "HabitDetailPage"),
    "habit.detail.logs": ("/habit/logs", "HabitLogsPage"),
    # --- 光芒与心愿 ---
    "glow.wishlist": ("/glow", "GlowPage"),
    "glow.wishCreate": ("/glow/new", "WishCreatePage"),
    # --- 专注 ---
    "focus.records": ("/focus/records", "FocusRecordsPage"),
    "focus.pickTarget": ("/focus/target", "FocusTargetPage"),
    "focus.customDuration": ("/focus/duration", "FocusDurationPage"),
    # --- 笔记 / 小事 ---
    "note.list": ("/notes", "NoteListPage"),
    "note.editor": ("/notes/editor", "NoteEditorPage"),
    "note.cardMenu": ("/notes/cardmenu", "NoteCardMenuPage"),
    "note.sectionMenu": ("/notes/sectionmenu", "NoteSectionMenuPage"),
    "todo.list": ("/todos", "TodoListPage"),
    "todo.quickAdd": ("/todos/quickadd", "TodoQuickAddPage"),
    "todo.itemMenu": ("/todos/itemmenu", "TodoItemMenuPage"),
    "todo.listMenu": ("/todos/menu", "TodoListMenuPage"),
    "todo.sortMenu": ("/todos/menu/sort", "TodoSortMenuPage"),
    # --- 统计 / 时间线 ---
    "stats.aiReview": ("/stats/review", "AiReviewPage"),
    "stats.glowBalls": ("/stats/balls", "GlowBallsPage"),
    "timeline.main": ("/timeline", "TimelinePage"),
    # --- 我的 ---
    "account.main": ("/me/account", "AccountPage"),
    "data.manage": ("/me/data", "DataManagePage"),
    "settings.main": ("/settings", "SettingsPage"),
    "personalize.main": ("/settings/personalize", "PersonalizePage"),
    "export.main": ("/settings/export", "ExportPage"),
    "module.manage": ("/settings/modules", "ModuleManagePage"),
    "widget.settings": ("/settings/widget", "WidgetPage"),
    "lab.main": ("/settings/lab", "LabPage"),
    "lab.shortcuts": ("/settings/lab/shortcuts", "LabShortcutsPage"),
    "lab.cards": ("/settings/lab/cards", "LabCardsPage"),
    "lab.chime": ("/settings/lab/chime", "LabChimePage"),
    "ai.planner": ("/ai/planner", "AiPlannerPage"),
    "support.menu": ("/support", "SupportPage"),
    "support.faq": ("/support/faq", "FaqPage"),
}

# 对话/面板节点 -> (父路由, 静态 search)。仅限**唯一父页**的弹层。
DIALOG_ON = {
    "today.addMenu": ("/", {"sheet": "addmenu"}),
    "today.allDone": ("/", {"dialog": "alldone"}),
    "checkin.sheet": ("/", {"sheet": "checkin"}),
    "checkin.timePicker": ("/", {"sheet": "checkintime"}),
    "checkin.moreMenu": ("/", {"sheet": "checkinmore"}),
    "habit.rowMenu": ("/habits", {"sheet": "rowmenu"}),
    "habit.detailMenu": ("/habit", {"sheet": "moremenu"}),
    "focus.musicSheet": ("/focus", {"sheet": "music"}),
    "focus.loopSheet": ("/focus", {"sheet": "loop"}),
    "focus.complete": ("/focus", {"dialog": "complete"}),
    "stats.menu": ("/stats", {"sheet": "menu"}),
}

spec = json.loads(SPEC.read_text(encoding="utf-8"))
if not spec.get("frozen"):
    raise SystemExit("拒绝生成:spec 未冻结(frozen != true)。先过阶段② Gate。")
nodes = spec["chrome"] + spec["nodes"]
by_id = {n["id"]: n for n in nodes}

# 一致性自检:spec 的每个节点都必须被分类
unmapped = [n["id"] for n in nodes
            if n["id"] != "chrome.tabbar" and n["id"] not in ROUTE_OF and n["id"] not in DIALOG_ON]
if unmapped:
    raise SystemExit(f"以下 spec 节点未映射到路由或弹层,拒绝生成:{unmapped}")

TAB_ROOTS = {"/", "/habits", "/focus", "/stats", "/me"}


def node_path(nid):
    if nid in ROUTE_OF:
        return ROUTE_OF[nid][0]
    if nid in DIALOG_ON:
        return DIALOG_ON[nid][0]
    return None


def esc(s):
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


def behavior_of(aid):
    if aid.endswith(".toggle") or aid.endswith("Toggle"):
        return "toggle"
    if ".select." in aid:
        return "select"
    if aid.endswith(".input"):
        return "input"
    if aid.endswith(".commit") or aid.endswith(".submit"):
        return "submit"
    return "other"


def actions_for(node):
    """该节点的 state/wontfix 交互 -> ActionDeclaration 列表"""
    out, seen = [], set()
    for it in node.get("interactions", []):
        if it.get("effect") != "state":
            continue
        aid = it.get("actionId")
        if not aid or aid in seen:
            continue
        seen.add(aid)
        beh = behavior_of(aid)
        is_wontfix = it.get("priority") == "wontfix"
        label = esc(it.get("element", aid))
        idents = list(it.get("params", []) or [])
        ps = {p: "string" for p in idents}
        if beh == "input":
            ps["value"] = "string"
        a = {"id": aid, "label": label + (" (暂未开放)" if is_wontfix else ""), "behavior": beh}
        if idents:
            a["scope"] = "item"
            a["paramsSchema"] = ps
        elif ps:
            a["paramsSchema"] = ps
        out.append(a)
    return out


# ---- routes ----
routes = []
for nid, (path, comp) in ROUTE_OF.items():
    rnode = by_id[nid]
    ui_states = [{
        "id": f"{APP}.{nid}.base",
        "search": {},
        "description": esc(rnode.get("title", nid)),
        "actions": actions_for(rnode),
    }]
    for dnid, (dpath, dsearch) in DIALOG_ON.items():
        if dpath != path:
            continue
        ui_states.append({
            "id": f"{APP}.{dnid}",
            "search": dict(dsearch),
            "description": esc(by_id[dnid].get("title", dnid)),
            "actions": actions_for(by_id[dnid]),
        })
    # 动态参数键:本路由 + 其弹层上所有交互的 params
    query_keys = {}
    scope_nodes = [rnode] + [by_id[d] for d, (dp, _) in DIALOG_ON.items() if dp == path]
    for sn in scope_nodes:
        for it in sn.get("interactions", []):
            for p in it.get("params", []) or []:
                query_keys[p] = "string"
    routes.append({
        "path": path, "component": comp, "params": {},
        "entryPoint": "home" if path == "/" else "none",
        "scrollContainers": [{"name": "main", "direction": "vertical", "description": "主滚动区"}],
        "uiStates": ui_states,
        "queryParams": query_keys,
        "description": esc(rnode.get("title", nid)),
    })

# ---- transitions ----
transitions = []
seen_t = set()
for n in nodes:
    src = n["id"]
    from_path = "*" if src == "chrome.tabbar" else node_path(src)
    for it in n.get("interactions", []):
        if it.get("effect") != "nav" or it.get("gesture") == "back":
            continue
        tid, tgt = it.get("transitionId"), it.get("target")
        if not tid or not tgt or tid in seen_t:
            continue
        if tgt in ROUTE_OF:
            to, search = ROUTE_OF[tgt][0], {}
        elif tgt in DIALOG_ON:
            to, search = DIALOG_ON[tgt][0], dict(DIALOG_ON[tgt][1])
        else:
            raise SystemExit(f"transition {tid} 指向未映射节点 {tgt}")
        seen_t.add(tid)
        # tab 切换 与 tab 根之间的横跳用 replace;其余 push
        mode = "replace" if tid.startswith("tabbar.") else "push"
        transitions.append({
            "id": tid, "from": from_path or "*", "to": to, "search": search,
            "searchParams": {p: "string" for p in it.get("params", []) or []},
            "mode": mode, "params": {},
            "label": esc(it.get("element", tid)),
            "ui": {"placement": "none", "icon": "chevronRight",
                   "gesture": "longPress" if it.get("gesture") == "long-press" else "tap"},
        })


def _prim(x):
    return isinstance(x, (str, int, float, bool))


def js(v, ind=0):
    pad = "  " * ind
    if isinstance(v, dict):
        if not v:
            return "{}"

        def kf(k):
            return k if str(k).isidentifier() else f"'{esc(k)}'"

        if all(_prim(val) for val in v.values()):
            return "{ " + ", ".join(f"{kf(k)}: {js(val)}" for k, val in v.items()) + " }"
        lines = [f"{pad}  {kf(k)}: {js(val, ind + 1)}" for k, val in v.items()]
        return "{\n" + ",\n".join(lines) + f"\n{pad}}}"
    if isinstance(v, list):
        if not v:
            return "[]"
        return "[\n" + ",\n".join(f"{pad}  {js(x, ind + 1)}" for x in v) + f"\n{pad}]"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return f"'{esc(v)}'"


header = f"""// AUTO-GENERATED by assets/gen_nav_declaration.py from
// docs/xiaorichang-replication/spec.json (frozen v{spec['specVersion']}).
// 覆盖率 gate 依赖此文件包含 spec 全部 transitionId/actionId。改交互请先改 spec 再重跑本脚本。
import type {{ NavigationDeclaration }} from './navigation.types';

export const NAVIGATION_DECLARATION = {{
  app: '{APP}',
  routes: {js(routes, 1)},
  transitions: {js(transitions, 1)},
  capabilities: {{ historyBack: true }},
}} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
"""

OUT.write_text(header, encoding="utf-8")
n_actions = sum(len(u.get("actions", [])) for r in routes for u in r["uiStates"])
print(f"OK: {OUT.name}  routes={len(routes)} transitions={len(transitions)} actions={n_actions}")

# ---- 覆盖率自检:spec 的 id 是否 100% 落进声明 ----
spec_t = {it["transitionId"] for n in nodes for it in n.get("interactions", [])
          if it.get("effect") == "nav" and it.get("gesture") != "back" and it.get("transitionId")}
spec_a = {it["actionId"] for n in nodes for it in n.get("interactions", [])
          if it.get("effect") == "state" and it.get("actionId")}
decl_t = {t["id"] for t in transitions}
decl_a = {a["id"] for r in routes for u in r["uiStates"] for a in u.get("actions", [])}
miss_t, miss_a = spec_t - decl_t, spec_a - decl_a
print(f"   transition 覆盖 {len(decl_t)}/{len(spec_t)}", "✓" if not miss_t else f"✗ 漏 {sorted(miss_t)}")
print(f"   action     覆盖 {len(decl_a)}/{len(spec_a)}", "✓" if not miss_a else f"✗ 漏 {sorted(miss_a)}")
if miss_t or miss_a:
    raise SystemExit(1)
