#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从冻结的 spec.json 生成 navigation.declaration.ts。
保证 spec 里每个 nav transitionId 都成为 transition,每个 state/wontfix actionId 都成为
对应 uiState 的 action —— 覆盖率 gate 的 id 完整性由此保证。
返回/关闭(gesture=back, transitionId=system.back)不声明,由 bindBack 处理。"""
import json
from pathlib import Path

APP = "fanqietodo"
SPEC = Path(__file__).parents[5] / "docs/fanqietodo-replication/spec.json"
OUT = Path(__file__).parents[1] / "navigation.declaration.ts"

# 节点 -> 整页路由
ROUTE_OF = {
    "todo.main": ("/", "TodoPage"),
    "focus.run": ("/focus", "FocusPage"),
    "focus.rest": ("/focus/rest", "FocusRestPage"),
    "lock.main": ("/lock", "LockPage"),
    "lock.active": ("/lock/active", "LockActivePage"),
    "lock.breath": ("/lock/breath", "BreathPage"),
    "stats.main": ("/stats", "StatsPage"),
    "timeline.main": ("/timeline", "TimelinePage"),
    "profile.main": ("/profile", "ProfilePage"),
    "profile.account": ("/profile/account", "AccountPage"),
    "settings.focus": ("/settings", "SettingsPage"),
    "future.list": ("/future", "FuturePage"),
    "future.add": ("/future/add", "FutureAddPage"),
    "future.detail": ("/future/detail", "FutureDetailPage"),
    "checkin.share": ("/checkin", "CheckinPage"),
}
# 对话/面板节点 -> (父路由, 静态 search)
DIALOG_ON = {
    "todo.add.dialog": ("/", {"sheet": "add"}),
    "todo.add.advanced.dialog": ("/", {"sheet": "addadv"}),
    "todo.edit.dialog": ("/", {"sheet": "edit"}),
    "todo.card.menu": ("/", {"sheet": "cardmenu"}),
    "todo.studymode.dialog": ("/", {"sheet": "studymode"}),
    "todo.quickmenu.dialog": ("/", {"sheet": "quickmenu"}),
    "todo.reorder.dialog": ("/", {"sheet": "reorder"}),
    "todo.help.dialog": ("/", {"sheet": "help"}),
    "focus.checkin.confirm": ("/", {"dialog": "checkin"}),
    "focus.pause.dialog": ("/focus", {"dialog": "pause"}),
    "focus.stop.dialog": ("/focus", {"dialog": "stop"}),
    "lock.quick.dialog": ("/lock", {"sheet": "quick"}),
    "lock.exit.confirm": ("/lock/active", {"dialog": "exit"}),
    "timeline.record.detail": ("/timeline", {"sheet": "record"}),
    "timeline.note.dialog": ("/timeline", {"sheet": "note"}),
}

spec = json.loads(SPEC.read_text(encoding="utf-8"))
nodes = spec["chrome"] + spec["nodes"]
by_id = {n["id"]: n for n in nodes}


def node_path(nid):
    if nid in ROUTE_OF:
        return ROUTE_OF[nid][0]
    if nid in DIALOG_ON:
        return DIALOG_ON[nid][0]
    return None


def esc(s):
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


def behavior_of(aid):
    if aid.endswith(".toggle"):
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
    out = []
    seen = set()
    for it in node.get("interactions", []):
        if it.get("effect") != "state":
            continue
        # 打开对话框的 state 交互改由 transition 承载(URL 驱动),不进 actions;
        # 但 commit/submit(提交后返回)仍是 action,不转 transition。
        _aid = it.get("actionId") or ""
        if it.get("target") in DIALOG_ON and not _aid.endswith((".commit", ".commit.action", ".submit")):
            continue
        aid = it.get("actionId")
        if not aid or aid in seen:
            continue
        seen.add(aid)
        beh = behavior_of(aid)
        is_wontfix = it.get("priority") == "wontfix"
        label = esc(it.get("element", aid))
        idents = list(it.get("params", []) or [])  # 标识字段(todoId/recordId/minutes...)
        ps = {p: "string" for p in idents}
        if beh == "input":
            ps["value"] = "string"
        a = {"id": aid, "label": label + (" (暂未开放)" if is_wontfix else ""), "behavior": beh}
        if idents:  # 仅当有真实标识字段时才是 item 作用域
            a["scope"] = "item"
            a["paramsSchema"] = ps
        elif ps:  # 页面级 input:只有 value,无 scope
            a["paramsSchema"] = ps
        out.append(a)
    return out


# ---- routes ----
routes = []
route_nodes = [(p, c, nid) for nid, (p, c) in ROUTE_OF.items()]
for path, comp, rnid in route_nodes:
    rnode = by_id[rnid]
    ui_states = [{
        "id": f"{APP}.{rnid}.base",
        "search": {},
        "description": esc(rnode.get("title", rnid)),
        "actions": actions_for(rnode),
    }]
    query_keys = {}
    # dialogs on this route
    for dnid, (dpath, dsearch) in DIALOG_ON.items():
        if dpath != path:
            continue
        dnode = by_id[dnid]
        ui_states.append({
            "id": f"{APP}.{dnid}",
            "search": dict(dsearch),
            "description": esc(dnode.get("title", dnid)),
            "actions": actions_for(dnode),
        })
        # NOTE: sheet/dialog 是离散态键,必须只出现在 search、不进 queryParams
        # (checker 把 queryParams 键当动态参数,会从离散键中剔除)。
    # param query keys from interactions on this route + its dialogs
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
        "description": esc(rnode.get("title", rnid)),
    })

# ---- transitions ----
transitions = []
seen_t = set()
for n in nodes:
    src = n["id"]
    from_path = "*" if src == "chrome.tabbar" else node_path(src)
    for it in n.get("interactions", []):
        eff = it.get("effect")
        _aid = it.get("actionId") or ""
        is_dialog_open = (eff == "state" and it.get("target") in DIALOG_ON
                          and not _aid.endswith((".commit", ".commit.action", ".submit")))
        if eff != "nav" and not is_dialog_open:
            continue
        if it.get("gesture") == "back":
            continue
        tid = it.get("transitionId") or it.get("actionId")  # 对话框 state 交互用 actionId 作转换 id
        tgt = it.get("target")
        if not tid or tid in seen_t or not tgt:
            continue
        seen_t.add(tid)
        if tgt in ROUTE_OF:
            to, search = ROUTE_OF[tgt][0], {}
        elif tgt in DIALOG_ON:
            to, search = DIALOG_ON[tgt][0], dict(DIALOG_ON[tgt][1])
        else:
            continue
        sp = {p: "string" for p in it.get("params", []) or []}
        gesture = "longPress" if it.get("gesture") == "longpress" else "tap"
        mode = "replace" if tid.startswith("tabbar.") else "push"
        transitions.append({
            "id": tid, "from": from_path or "*", "to": to, "search": search,
            "searchParams": sp, "mode": mode, "params": {},
            "label": esc(it.get("element", tid)),
            "ui": {"placement": "none", "icon": "chevronRight", "gesture": gesture},
        })


def _prim(x):
    return isinstance(x, (str, int, float, bool))


def js(v, ind=0):
    """emit JS/TS literal with single quotes. Leaf dicts(全原始值)单行,便于 checker 解析。"""
    pad = "  " * ind
    if isinstance(v, dict):
        if not v:
            return "{}"

        def kf(k):
            return k if str(k).isidentifier() else f"'{esc(k)}'"

        if all(_prim(val) for val in v.values()):  # 单行
            inner = ", ".join(f"{kf(k)}: {js(val)}" for k, val in v.items())
            return "{ " + inner + " }"
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
// docs/fanqietodo-replication/spec.json (frozen v{spec['specVersion']}).
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
print(f"OK: {OUT.name}  routes={len(routes)} transitions={len(transitions)} "
      f"actions={sum(len(u.get('actions', [])) for r in routes for u in r['uiStates'])}")
