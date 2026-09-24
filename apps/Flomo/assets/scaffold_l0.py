# -*- coding: utf-8 -*-
"""
L0 脚手架生成器:冻结的 spec.json -> navigation.declaration.ts + 占位页 + 路由表。
- 单一事实源 = docs/flomo-replication/spec.json(frozen v1.0)。
- 不覆盖已存在的页面文件(只补缺失的占位)。
运行: python apps/Flomo/assets/scaffold_l0.py
"""
import json, re
from pathlib import Path

APP = Path(__file__).parent.parent
SPEC = APP.parents[3] / "docs" / "flomo-replication" / "spec.json"
spec = json.loads(SPEC.read_text(encoding="utf-8"))

allnodes = list(spec.get("chrome", [])) + list(spec.get("nodes", []))
# 面板节点:不作为独立路由,而是主页 '/' 上的 searchParam 浮层(背后主页可见)。
PANEL_NODES = {"home.titleMenu": "titleMenu"}
def comp_name(nid): return "".join(w.capitalize() for w in re.split(r"[.\-]", nid)) + "Page"
def route_of(nid):
    if nid in PANEL_NODES: return "/"
    if nid == "home.feed": return "/"
    n = nmap[nid]
    return n.get("route") or ("/" + nid.replace(".", "/"))

nmap = {n["id"]: n for n in allnodes}
route_nodes = [n for n in allnodes if n.get("kind") in ("page", "overlay") and n["id"] not in PANEL_NODES]

# ---- routes ----
paths_seen = {}
routes = []
for n in route_nodes:
    nid = n["id"]; path = route_of(nid)
    if path in paths_seen:
        raise SystemExit(f"路由冲突 {path}: {nid} vs {paths_seen[path]}")
    paths_seen[path] = nid
    routes.append({"node": n, "path": path, "component": comp_name(nid)})

# ---- actions(effect != nav 且有 actionId) ----
def behavior_of(it):
    g = it.get("gesture"); aid = it.get("actionId", "")
    if g == "type": return ("input", True)
    if aid.endswith(".toggle"): return ("toggle", False)
    if ".select." in aid: return ("select", False)
    return ("submit", False)

actions_by_route = {r["path"]: [] for r in routes}
panel_actions = {}  # panel_id -> [action entries]
seen_actions = set()
for n in allnodes:
    is_panel = n["id"] in PANEL_NODES
    host = route_of(n["id"]) if n.get("kind") in ("page", "overlay") else "/"
    for it in n.get("interactions", []):
        if it.get("effect") == "nav":
            continue
        aid = it.get("actionId")
        if not aid or aid in seen_actions:
            continue
        seen_actions.add(aid)
        beh, needs_schema = behavior_of(it)
        entry = {"id": aid, "label": it.get("element", aid), "behavior": beh}
        if needs_schema:
            entry["paramsSchema"] = {"value": "string"}
        if is_panel:
            panel_actions.setdefault(n["id"], []).append(entry)
        else:
            actions_by_route.setdefault(host, []).append(entry)

# 跨页复用的全局触发点:from 必须列出实际触发它们的页面路由(consistency checker 做字面匹配,不展开 '*')。
FROM_OVERRIDE = {
    "tag.drawer.open": ["/", "/tag/filter", "/filter/byType"],
    "tag.filter.open": ["/", "/memo/detail", "/review/daily", "/review/random"],
    # 日期筛选页点日期 → 进热力图/日历详情页
    "stats.heatmap.open": ["/", "/filter/byType"],
}

# ---- transitions(effect == nav 且 transitionId != system.back),按 id 去重合并 from ----
trans = {}
for n in allnodes:
    # chrome 组件(顶栏/FAB)渲染在主页,from 落到主页 '/'
    src = route_of(n["id"]) if n.get("kind") in ("page", "overlay") else "/"
    for it in n.get("interactions", []):
        if it.get("effect") != "nav":
            continue
        tid = it.get("transitionId")
        if not tid or tid == "system.back":
            continue
        tgt = it.get("target")
        sp = {}
        if tgt in PANEL_NODES:
            to = "/"; sp = {PANEL_NODES[tgt]: "open"}
        else:
            to = route_of(tgt) if tgt in nmap else "/"
        t = trans.get(tid)
        if t is None:
            trans[tid] = {"id": tid, "from": {src}, "to": to, "sp": sp,
                          "panel": tgt in PANEL_NODES, "label": it.get("element", tid)}
        else:
            t["from"].add(src)
            # to 取首个;若冲突,保留首个(spec 内同 id 应一致)

# ---- emit TS ----
def js(s): return s.replace("\\", "\\\\").replace("'", "\\'")
def actions_ts(acts):
    if not acts: return ""
    lines = []
    for a in acts:
        ps = f", paramsSchema: {{ value: 'string' }}" if "paramsSchema" in a else ""
        lines.append(f"            {{ id: '{js(a['id'])}', label: '{js(a['label'])}', behavior: '{a['behavior']}'{ps} }},")
    return "\n          actions: [\n" + "\n".join(lines) + "\n          ],"

route_blocks = []
for r in routes:
    n = r["node"]; nid = n["id"]; path = r["path"]
    ui_id = f"flomo.{nid}.base"
    acts = actions_by_route.get(path, [])
    entry = "home" if nid == "home.feed" else "none"
    scroll = ("[{ name: 'feed', direction: 'vertical', description: '主滚动区' }]" if nid == "home.feed"
              else "[{ name: 'main', direction: 'vertical', description: '主滚动区' }]")
    # 主页 '/' 是面板宿主:追加 panel uiStates + queryParams
    extra_states = ""; qp = "{}"
    if path == "/":
        ps_blocks = []
        for pid, key in PANEL_NODES.items():
            pn = nmap[pid]
            ps_blocks.append(
                f"        {{ id: 'flomo.{pid}.open', search: {{ {key}: 'open' }}, "
                f"description: '{js(pn.get('title', pid))}',{actions_ts(panel_actions.get(pid, []))} }},")
        if ps_blocks:
            extra_states = "\n" + "\n".join(ps_blocks)
        # 离散面板键(titleMenu)只声明在 uiState.search 里,不能进 queryParams
        # (checker 会把 queryParams 键从离散态里剔除,导致 panel uiState 退化为 base 报错)。
        qp = "{}"
    route_blocks.append(f"""    {{
      path: '{path}',
      component: '{r['component']}',
      params: {{}},
      entryPoint: '{entry}',
      scrollContainers: {scroll},
      uiStates: [
        {{
          id: '{ui_id}', search: {{}}, description: '{js(n.get('title', nid))}',{actions_ts(acts)}
        }},{extra_states}
      ],
      queryParams: {qp},
      description: '{js(n.get('title', nid))}',
    }},""")

def from_ts(froms):
    fs = sorted(froms)
    if fs == ["*"] or "*" in fs:
        return "'*'"
    if len(fs) == 1:
        return f"'{fs[0]}'"
    return "[" + ", ".join(f"'{f}'" for f in fs) + "]"

trans_blocks = []
for tid, t in trans.items():
    mode = "push" if t.get("panel") else ("replace" if t["to"] == "/" else "push")
    froms = set(FROM_OVERRIDE[tid]) if tid in FROM_OVERRIDE else t["from"]
    sp = t.get("sp") or {}
    sp_ts = "{ " + ", ".join(f"{k}: '{v}'" for k, v in sp.items()) + " }" if sp else "{}"
    trans_blocks.append(
        f"    {{ id: '{js(tid)}', from: {from_ts(froms)}, to: '{t['to']}', "
        f"search: {sp_ts}, searchParams: {{}}, mode: '{mode}', params: {{}}, "
        f"label: '{js(t['label'])}', ui: {{ placement: 'content', icon: 'arrow', gesture: 'tap' }} }},")

out = f"""// AUTO-GENERATED from docs/flomo-replication/spec.json (frozen v1.0) by assets/scaffold_l0.py
// 不要手改;改 spec 后重跑生成器(spec-first 纪律)。
import type {{ NavigationDeclaration }} from './navigation.types';

export const NAVIGATION_DECLARATION = {{
  app: 'flomo',
  routes: [
{chr(10).join(route_blocks)}
  ],
  transitions: [
{chr(10).join(trans_blocks)}
  ],
  capabilities: {{
    historyBack: true,
  }},
}} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
"""
(APP / "navigation.declaration.ts").write_text(out, encoding="utf-8")

# ---- stub pages(只补缺失) ----
pages_dir = APP / "pages"
created = 0
for r in routes:
    f = pages_dir / f"{r['component']}.tsx"
    if f.exists():
        continue
    nid = r["node"]["id"]; title = r["node"].get("title", nid)
    is_home = nid == "home.feed"
    back = "" if is_home else "<button {...bindBack()} className=\"w-12 text-left text-app-primary text-xl\">‹</button>"
    f.write_text(f"""import React from 'react';
import {{ useFlomoGestures }} from '../hooks/useFlomoGestures';

// 占位页(L0 脚手架自动生成)—— 后续分层实现替换。节点: {nid}
export default function {r['component']}() {{
  const {{ bindBack }} = useFlomoGestures();
  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-2 border-b border-app-border shrink-0">
        {back}
        <div className="flex-1 text-center font-semibold text-app-text">{title}</div>
        <div className="w-12" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 text-app-text-secondary text-sm">
        「{title}」占位页 · 节点 {nid}
      </div>
    </div>
  );
}}
""", encoding="utf-8")
    created += 1

# ---- routes.generated.tsx ----
imports = "\n".join(f"import {r['component']} from './{r['component']}';" for r in routes)
elems = "\n".join(f"  {{ path: '{r['path']}', element: <{r['component']} /> }}," for r in routes)
(pages_dir / "routes.generated.tsx").write_text(
    f"""// AUTO-GENERATED by assets/scaffold_l0.py — 路由表(path -> 页面组件)
import React from 'react';
{imports}

export const ROUTES: {{ path: string; element: React.ReactNode }}[] = [
{elems}
];
""", encoding="utf-8")

print(f"routes={len(routes)} transitions={len(trans)} actions={sum(len(a) for a in actions_by_route.values())} stub_pages_created={created}")
print(f"navigation.declaration.ts + routes.generated.tsx written")
