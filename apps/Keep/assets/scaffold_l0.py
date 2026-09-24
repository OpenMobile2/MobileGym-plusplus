# -*- coding: utf-8 -*-
"""
Keep L0 脚手架生成器:spec.json -> navigation.declaration.ts + 缺失页 stub + 路由表。
- 单一事实源 = docs/keep-replication/spec.json(v1.0.0 冻结)。
- kind ∈ {page, sheet, dialog, overlay} 均生成路由(sheet/dialog 渲染为弹层样式路由,URL 驱动,back 关闭)。
- gesture=back 的交互不生成 transition(§11:返回一律 bindBack=system.back)。
- 已存在页面不覆盖;改 spec 后重跑(spec-first 纪律)。
运行: python3 apps/Keep/assets/scaffold_l0.py
"""
import json
import re
from pathlib import Path

APP = Path(__file__).parent.parent
SPEC = APP.parents[3] / "docs" / "keep-replication" / "spec.json"
spec = json.loads(SPEC.read_text(encoding="utf-8"))

allnodes = list(spec.get("chrome", [])) + list(spec.get("nodes", []))
nmap = {n["id"]: n for n in allnodes}

TAB_ROUTES = {"/", "/schedule", "/sport", "/discover", "/me"}
TAB_SOURCE_ROUTES = TAB_ROUTES | {"/search", "/search/results"}
TAB_TIDS = {"tab.course", "tab.schedule", "tab.sport", "tab.discover", "tab.me"}
ROUTE_KINDS = {"page", "sheet", "dialog", "overlay"}


def comp_name(nid):
    return "".join(w.capitalize() for w in re.split(r"[.\-]", nid)) + "Page"


def route_of(nid):
    n = nmap.get(nid)
    r = (n or {}).get("route") or ""
    if r.startswith("/"):
        return r
    return "/" + nid.replace(".", "/")


route_nodes = [n for n in allnodes if n.get("kind") in ROUTE_KINDS]

paths_seen = {}
routes = []
for n in route_nodes:
    nid = n["id"]
    path = route_of(nid)
    if path in paths_seen:
        raise SystemExit(f"路由冲突 {path}: {nid} vs {paths_seen[path]}")
    paths_seen[path] = nid
    routes.append({"node": n, "path": path, "component": comp_name(nid)})


def behavior_of(it):
    g = it.get("gesture")
    aid = it.get("actionId", "")
    if g in ("type", "type+tap"):
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

trans = {}
for n in allnodes:
    if n.get("kind") == "chrome":
        src_routes = list(TAB_SOURCE_ROUTES)
    else:
        src_routes = [route_of(n["id"])]
    for it in n.get("interactions", []):
        if it.get("effect") != "nav":
            continue
        if it.get("gesture") == "back":
            continue  # §11 返回走 system.back
        tid = it.get("transitionId")
        if not tid or tid == "system.back":
            continue
        tgt = it.get("target")
        if tgt in nmap and nmap[tgt].get("kind") == "chrome":
            continue  # tab 切换由 chrome 节点的 tab.* 统一承载,避免重复边
        to = route_of(tgt) if tgt in nmap else "/"
        t = trans.get(tid)
        if t is None:
            trans[tid] = {"id": tid, "from": set(src_routes), "to": to,
                          "label": it.get("element", tid),
                          "search": it.get("search", {}),
                          "searchParams": it.get("searchParams", {}),
                          "mode": it.get("mode"),
                          "gesture": it.get("gesture", "tap"),
                          "fromSearch": {route: it.get("fromSearch") for route in src_routes if it.get("fromSearch")}}
        else:
            t["from"].update(src_routes)
            for route in src_routes:
                if it.get("fromSearch"):
                    t.setdefault("fromSearch", {})[route] = it["fromSearch"]

for tid in TAB_TIDS:
    if tid in trans:
        trans[tid]["from"] = set(TAB_SOURCE_ROUTES)


def js(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def jsx_text(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("{", "&#123;").replace("}", "&#125;"))


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
          id: 'keep.{nid}.base', search: {{}}, description: '{js(n.get('title', nid))}',{actions_ts(acts)}
        }},
      ],
      queryParams: {{}},
      description: '{js(n.get('title', nid))}',
    }},""")


def from_ts(froms, from_search=None):
    from_search = from_search or {}
    fs = sorted(froms)
    rendered = []
    for route in fs:
        if route in from_search:
            search = json.dumps(from_search[route], ensure_ascii=False).replace('"', "'")
            rendered.append(f"{{ path: '{route}', search: {search} }}")
        else:
            rendered.append(f"'{route}'")
    if len(fs) == 1:
        return rendered[0]
    return "[" + ", ".join(rendered) + "]"


trans_blocks = []
for tid, t in trans.items():
    mode = t.get("mode") or ("replace" if t["to"] in TAB_ROUTES else "push")
    search = json.dumps(t.get("search", {}), ensure_ascii=False).replace('"', "'")
    search_params = json.dumps(t.get("searchParams", {}), ensure_ascii=False).replace('"', "'")
    gesture = "longPress" if t.get("gesture") == "long-press" else "tap"
    trans_blocks.append(
        f"    {{ id: '{js(tid)}', from: {from_ts(t['from'], t.get('fromSearch'))}, to: '{t['to']}', "
        f"search: {search}, searchParams: {search_params}, mode: '{mode}', params: {{}}, "
        f"label: '{js(t['label'])}', ui: {{ placement: 'content', icon: 'arrow', gesture: '{gesture}' }} }},")

out = f"""// AUTO-GENERATED from docs/keep-replication/spec.json (v{spec.get('specVersion')}) by assets/scaffold_l0.py
// 不要手改;改 spec 后重跑生成器(spec-first 纪律)。
import type {{ NavigationDeclaration }} from './navigation.types';

export const NAVIGATION_DECLARATION = {{
  app: 'keep',
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
            and it.get("transitionId") and it.get("transitionId") != "system.back"
            and it.get("gesture") != "back"
            and not (it.get("target") in nmap and nmap[it["target"]].get("kind") == "chrome")]
    btns = []
    seen_tid = set()
    for it in outs:
        tid = it["transitionId"]
        if tid in seen_tid:
            continue
        seen_tid.add(tid)
        label = jsx_text(it.get("element", tid))
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
import {{ useKeepGestures }} from '../hooks/useKeepGestures';
import {{ useKeepStore }} from '../state';
import {{ TopBar }} from '../components/ui';

// 占位页(L0 脚手架自动生成)—— 待按证据实现。节点: {nid}
export default function {r['component']}() {{
  const {{ bindTap }} = useKeepGestures();
  const toast = useKeepStore((s) => s.toast);
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
