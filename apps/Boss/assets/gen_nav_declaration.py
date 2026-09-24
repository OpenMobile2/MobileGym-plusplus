#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从冻结的 spec.json 生成 navigation.declaration.ts(BOSS直聘)。

保证 spec 里每个 nav transitionId 都成为 transition,每个 state actionId 都成为
对应路由 uiState 的 action —— 覆盖率 gate 的 id 完整性由此保证。
返回/关闭(transitionId=system.back)不声明,由 bindBack 处理。

jobs.dismissReason 是 URL 弹层(search dismiss=open),不占独立路由;
其余节点一节点一路由,参数走 queryParams(扁平 path)。
"""
import json
from pathlib import Path

APP = "boss"
SPEC = Path(__file__).parents[5] / "docs/boss-replication/spec.json"
OUT = Path(__file__).parents[1] / "navigation.declaration.ts"

# 节点 -> (pathname, 组件名)
ROUTE_OF = {
    "jobs.list": ("/", "JobsPage"),
    "city.filter": ("/city", "CityFilterPage"),
    "filter.panel": ("/filter", "FilterPanelPage"),
    "expect.manage": ("/expect", "ExpectManagePage"),
    "expect.add": ("/expect/edit", "ExpectEditPage"),
    "search.landing": ("/search", "SearchLandingPage"),
    "search.result": ("/search/result", "SearchResultPage"),
    "job.detail": ("/job", "JobDetailPage"),
    "company.detail": ("/company", "CompanyDetailPage"),
    "map.view": ("/map", "MapViewPage"),
    "favorites.jobs": ("/favorites", "FavoritesPage"),
    "messages.list": ("/messages", "MessagesPage"),
    "chat.session": ("/chat", "ChatSessionPage"),
    "quickreply.manage": ("/chat/quickreply", "QuickreplyManagePage"),
    "quickreply.add": ("/chat/quickreply/edit", "QuickreplyEditPage"),
    "feed.main": ("/feed", "FeedPage"),
    "feed.detail": ("/feed/post", "FeedDetailPage"),
    "feed.comments": ("/feed/comments", "FeedCommentsPage"),
    "feed.compose": ("/feed/compose", "FeedComposePage"),
    "feed.answer": ("/feed/answer", "FeedAnswerPage"),
    "feed.ask": ("/feed/ask", "FeedAskPage"),
    "boss.profile": ("/boss", "BossProfilePage"),
    "mine.main": ("/me", "MinePage"),
    "resume.online": ("/resume", "ResumeOnlinePage"),
    "resume.edit": ("/resume/edit", "ResumeEditPage"),
    "resume.attach": ("/resume/attach", "ResumeAttachPage"),
    "resume.verify": ("/resume/verify", "ResumeVerifyPage"),
    "profile.home": ("/profile", "ProfileHomePage"),
    "profile.follow": ("/profile/follow", "ProfileFollowPage"),
    "profile.edit": ("/profile/edit", "ProfileEditPage"),
    "interview.schedule": ("/interview", "InterviewSchedulePage"),
    "interview.add": ("/interview/add", "InterviewAddPage"),
    "records.main": ("/records", "RecordsPage"),
    "assessment.list": ("/assessment", "AssessmentListPage"),
    "assessment.mbti": ("/assessment/mbti", "AssessmentMbtiPage"),
    "competitiveness.buy": ("/competitiveness/buy", "CompetitivenessBuyPage"),
    "competitiveness.detail": ("/competitiveness/detail", "CompetitivenessDetailPage"),
    "vip.member": ("/vip", "VipMemberPage"),
    "internship.zone": ("/internship", "InternshipPage"),
    "guidance.antelope": ("/guidance", "GuidancePage"),
    "support.chat": ("/support", "SupportPage"),
    "settings.main": ("/settings", "SettingsPage"),
}

# URL 弹层节点:transition 指向宿主路由 + search 标记(平台合同:弹窗 URL 驱动)
DIALOG_TRANSITIONS = {
    # transitionId -> (to, static search)
    "jobs.dismiss-open": ("/", {"dismiss": "open"}),
    "searchresult.dismiss-open": ("/search/result", {"dismiss": "open"}),
    "feed.publish-open": ("/feed", {"publish": "open"}),
}
DIALOG_NODES = {"jobs.dismissReason", "feed.publishPanel"}

spec = json.loads(SPEC.read_text(encoding="utf-8"))
if not spec.get("frozen"):
    raise SystemExit("拒绝生成:spec 未冻结(frozen != true)。先过阶段④ Gate。")
nodes = list(spec.get("chrome", [])) + spec["nodes"]
by_id = {n["id"]: n for n in nodes}
CHROME_IDS = {n["id"] for n in spec.get("chrome", [])}

unmapped = [n["id"] for n in spec["nodes"] if n["id"] not in ROUTE_OF and n["id"] not in DIALOG_NODES]
if unmapped:
    raise SystemExit(f"以下 spec 节点未映射到路由,拒绝生成:{unmapped}")


def esc(s):
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


def behavior_of(aid, it):
    parts = aid.split(".")
    if aid.endswith(".toggle"):
        return "toggle"
    if "select" in parts:
        return "select"
    if aid.endswith(".input") or it.get("gesture") == "type":
        return "input"
    if aid.endswith(".commit") or aid.endswith(".send") or aid.endswith(".submit"):
        return "submit"
    return "other"


def param_keys(it):
    out = []
    for src in ("params", "paramsSchema"):
        d = it.get(src)
        if isinstance(d, dict):
            out += [k for k in d.keys() if k not in ("value",)]
    return sorted(set(out))


def actions_for(node):
    out, seen = [], set()
    for it in node.get("interactions", []):
        if it.get("effect") != "state":
            continue
        aid = it.get("actionId")
        if not aid or aid in seen:
            continue
        seen.add(aid)
        beh = behavior_of(aid, it)
        idents = param_keys(it)
        ps = {p: "string" for p in idents}
        if beh == "input" or (isinstance(it.get("paramsSchema"), dict) and "value" in it["paramsSchema"]):
            ps["value"] = "string"
        a = {"id": aid, "label": esc(it.get("element", aid)), "behavior": beh}
        if idents:
            a["scope"] = "item"
        if ps:
            a["paramsSchema"] = ps
        out.append(a)
    return out


# 弹层节点的 actions 归并进宿主路由
HOST_OF_DIALOG = {"jobs.dismissReason": "jobs.list", "feed.publishPanel": "feed.main"}

routes = []
for nid, (path, comp) in ROUTE_OF.items():
    rnode = by_id[nid]
    acts = actions_for(rnode)
    for dnid, host in HOST_OF_DIALOG.items():
        if host == nid:
            acts += actions_for(by_id[dnid])
    query_keys = {}
    for it in rnode.get("interactions", []):
        if it.get("effect") == "nav":
            continue
        for p in param_keys(it):
            if p.endswith("Id") or p in ("kw", "section", "date"):
                query_keys[p] = "string"
    # 入参(别的节点跳进来带的参数)
    for n2 in nodes:
        for it in n2.get("interactions", []):
            if it.get("effect") == "nav" and it.get("target") == nid:
                for p in param_keys(it):
                    query_keys[p] = "string"
    ui_states = [{
        "id": f"{APP}.{nid}.base",
        "search": {},
        "description": esc(rnode.get("title", nid)),
        "actions": acts,
    }]
    routes.append({
        "path": path, "component": comp, "params": {},
        "entryPoint": "home" if path == "/" else "none",
        "scrollContainers": [{"name": "main", "direction": "vertical", "description": "主滚动区"}],
        "uiStates": ui_states,
        "queryParams": query_keys,
        "description": esc(rnode.get("title", nid)),
    })

transitions = []
seen_t = set()
for n in nodes:
    src = n["id"]
    if src in CHROME_IDS:
        from_path = "*"
    elif src in DIALOG_NODES:
        from_path = ROUTE_OF[HOST_OF_DIALOG[src]][0]
    else:
        from_path = ROUTE_OF[src][0]
    for it in n.get("interactions", []):
        if it.get("effect") != "nav":
            continue
        tid, tgt = it.get("transitionId"), it.get("target")
        if not tid or tid == "system.back" or tid in seen_t:
            continue
        if tid in DIALOG_TRANSITIONS:
            to, search = DIALOG_TRANSITIONS[tid]
        elif tgt in ROUTE_OF:
            to, search = ROUTE_OF[tgt][0], {}
        else:
            raise SystemExit(f"transition {tid} 指向未映射节点 {tgt}")
        seen_t.add(tid)
        mode = "replace" if tid.startswith("tabbar.") else "push"
        transitions.append({
            "id": tid, "from": from_path, "to": to, "search": search,
            "searchParams": {p: "string" for p in param_keys(it)},
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
// docs/boss-replication/spec.json (frozen {spec['specVersion']}).
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

spec_t = {it["transitionId"] for n in nodes for it in n.get("interactions", [])
          if it.get("effect") == "nav" and it.get("transitionId") and it["transitionId"] != "system.back"}
spec_a = {it["actionId"] for n in nodes for it in n.get("interactions", [])
          if it.get("effect") == "state" and it.get("actionId")}
decl_t = {t["id"] for t in transitions}
decl_a = {a["id"] for r in routes for u in r["uiStates"] for a in u.get("actions", [])}
miss_t, miss_a = spec_t - decl_t, spec_a - decl_a
print(f"   transition 覆盖 {len(decl_t)}/{len(spec_t)}", "✓" if not miss_t else f"✗ 漏 {sorted(miss_t)}")
print(f"   action     覆盖 {len(decl_a)}/{len(spec_a)}", "✓" if not miss_a else f"✗ 漏 {sorted(miss_a)}")
if miss_t or miss_a:
    raise SystemExit(1)
