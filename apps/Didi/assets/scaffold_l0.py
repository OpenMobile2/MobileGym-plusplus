# -*- coding: utf-8 -*-
"""
L0 脚手架生成器:spec.json -> navigation.declaration.ts(routes+transitions+actions)
+ 缺失页 stub + 路由表。
- 单一事实源 = docs/didi-replication/spec.json(v0.3.0-draft)。
- actions(effect=state)声明进对应路由 uiStates[0].actions(官方 checker 只读 uiStates[].actions)。
- 已存在页面不覆盖;改 spec 后重跑(spec-first 纪律)。
运行: python apps/Didi/assets/scaffold_l0.py
"""
import json
import re
from pathlib import Path

APP = Path(__file__).parent.parent
SPEC = APP.parents[3] / "docs" / "didi-replication" / "spec.json"
spec = json.loads(SPEC.read_text(encoding="utf-8"))

allnodes = list(spec.get("chrome", [])) + list(spec.get("nodes", []))
nmap = {n["id"]: n for n in allnodes}

TAB_ROUTES = {"/", "/messages", "/trips", "/me"}
TAB_TIDS = {"home.tab", "messages.tab", "trips.tab", "me.tab"}


def comp_name(nid):
    return "".join(w.capitalize() for w in re.split(r"[.\-]", nid)) + "Page"


def route_of(nid):
    n = nmap.get(nid)
    if n and n.get("route") and not n["route"].startswith("/chrome/"):
        return n["route"]
    return "/" + nid.replace(".", "/")


route_nodes = [n for n in allnodes if n.get("kind") in ("page", "overlay")]

paths_seen = {}
routes = []
for n in route_nodes:
    nid = n["id"]
    path = route_of(nid)
    if path in paths_seen:
        raise SystemExit(f"路由冲突 {path}: {nid} vs {paths_seen[path]}")
    paths_seen[path] = nid
    routes.append({"node": n, "path": path, "component": comp_name(nid)})

# ---- actions(effect=state)----
def behavior_of(it):
    g = it.get("gesture")
    aid = it.get("actionId", "")
    if g == "type":
        return ("input", True)
    if aid.endswith(".toggle"):
        return ("toggle", False)
    return ("submit", False)


actions_by_route = {r["path"]: [] for r in routes}
seen_actions = set()
for n in route_nodes:
    host = route_of(n["id"])
    for it in n.get("interactions", []):
        if it.get("effect") != "state":
            continue
        aid = it.get("actionId")
        if not aid or aid in seen_actions:
            continue
        seen_actions.add(aid)
        beh, needs_schema = behavior_of(it)
        entry = {"id": aid, "label": it.get("element", aid), "behavior": beh}
        if needs_schema:
            entry["paramsSchema"] = {"value": "string"}
        actions_by_route.setdefault(host, []).append(entry)

# ---- transitions(effect=nav,按 id 去重合并 from)----
trans = {}
for n in allnodes:
    if n.get("kind") == "component":
        src_routes = list(TAB_ROUTES)
    else:
        src_routes = [route_of(n["id"])]
    for it in n.get("interactions", []):
        if it.get("effect") != "nav":
            continue
        tid = it.get("transitionId")
        if not tid or tid == "system.back":
            continue
        tgt = it.get("target")
        to = route_of(tgt) if tgt in nmap else "/"
        t = trans.get(tid)
        if t is None:
            trans[tid] = {"id": tid, "from": set(src_routes), "to": to,
                          "label": it.get("element", tid), "mode": it.get("mode")}
        else:
            t["from"].update(src_routes)
            if it.get("mode") is not None and t.get("mode") not in (None, it["mode"]):
                raise SystemExit(f"transition mode 冲突 {tid}: {t['mode']} vs {it['mode']}")
            if it.get("mode") is not None:
                t["mode"] = it["mode"]

for tid in TAB_TIDS:
    if tid in trans:
        trans[tid]["from"] = set(TAB_ROUTES)


def js(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def actions_ts(acts):
    if not acts:
        return ""
    lines = []
    for a in acts:
        ps = ", paramsSchema: { value: 'string' }" if "paramsSchema" in a else ""
        lines.append(f"            {{ id: '{js(a['id'])}', label: '{js(a['label'])}', "
                     f"behavior: '{a['behavior']}'{ps} }},")
    return "\n          actions: [\n" + "\n".join(lines) + "\n          ],"


route_blocks = []
for r in routes:
    n = r["node"]
    nid = n["id"]
    path = r["path"]
    entry = "home" if path == "/" else "none"
    acts = actions_by_route.get(path, [])
    route_blocks.append(f"""    {{
      path: '{path}',
      component: '{r['component']}',
      params: {{}},
      entryPoint: '{entry}',
      scrollContainers: [{{ name: 'main', direction: 'vertical', description: '主滚动区' }}],
      uiStates: [
        {{
          id: 'didi.{nid}.base', search: {{}}, description: '{js(n.get('title', nid))}',{actions_ts(acts)}
        }},
      ],
      queryParams: {{}},
      description: '{js(n.get('title', nid))}',
    }},""")


def from_ts(froms):
    fs = sorted(froms)
    if len(fs) == 1:
        return f"'{fs[0]}'"
    return "[" + ", ".join(f"'{f}'" for f in fs) + "]"


trans_blocks = []
for tid, t in trans.items():
    mode = t.get("mode") or ("replace" if t["to"] in TAB_ROUTES else "push")
    trans_blocks.append(
        f"    {{ id: '{js(tid)}', from: {from_ts(t['from'])}, to: '{t['to']}', "
        f"search: {{}}, searchParams: {{}}, mode: '{mode}', params: {{}}, "
        f"label: '{js(t['label'])}', ui: {{ placement: 'content', icon: 'arrow', gesture: 'tap' }} }},")

out = f"""// AUTO-GENERATED from docs/didi-replication/spec.json (v0.3.0-draft) by assets/scaffold_l0.py
// 不要手改;改 spec 后重跑生成器(spec-first 纪律)。
import type {{ NavigationDeclaration }} from './navigation.types';

export const NAVIGATION_DECLARATION = {{
  app: 'didi',
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

# ---- stub pages(只补缺失)----
pages_dir = APP / "pages"
created = 0
for r in routes:
    f = pages_dir / f"{r['component']}.tsx"
    if f.exists():
        continue
    n = r["node"]
    nid = n["id"]
    title = n.get("title", nid)
    path = r["path"]
    is_tab = path in TAB_ROUTES
    outs = [it for it in n.get("interactions", []) if it.get("effect") == "nav"
            and it.get("transitionId") and it.get("transitionId") != "system.back"]
    btns = []
    for it in outs:
        tid = it["transitionId"]
        label = js(it.get("element", tid))
        btns.append(
            f'        <button {{...bindTap(\'{js(tid)}\')}} '
            f'className="flex items-center justify-between w-full px-4 py-3 rounded-xl '
            f'bg-app-surface border border-app-border text-app-text text-sm">'
            f'<span>{label}</span><span className="text-app-text-muted">›</span></button>'
        )
    body = "\n".join(btns) if btns else (
        '        <div className="text-app-text-muted text-sm">此页内容待实现。</div>'
    )
    show_back = "false" if is_tab else "true"
    f.write_text(f"""import React from 'react';
import {{ useDidiGestures }} from '../hooks/useDidiGestures';
import {{ useDidiStore }} from '../state';
import {{ TopBar }} from '../components/ui';

// 占位页(L0 脚手架自动生成)—— 待按证据实现。节点: {nid}
export default function {r['component']}() {{
  const {{ bindTap }} = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  void bindTap; void toast;
  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="{js(title)}" showBack={{{show_back}}} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-[11px] text-app-text-muted mb-3">占位页 · 节点 {nid}</div>
        <div className="flex flex-col gap-2">
{body}
        </div>
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

print(f"routes={len(routes)} transitions={len(trans)} "
      f"actions={sum(len(a) for a in actions_by_route.values())} stub_pages_created={created}")
