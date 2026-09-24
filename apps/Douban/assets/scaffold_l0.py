# -*- coding: utf-8 -*-
"""
豆瓣 L0 脚手架生成器:冻结的 spec.json -> navigation.declaration.ts + 占位页 + 路由表 + chrome 组件。
- 单一事实源 = docs/douban-replication/spec.json(frozen v1.0.0,2 chrome + 90 nodes)。
- 生成物一律不手改;改 spec 后重跑本生成器(spec-first 纪律)。
- 占位页除标题外,把节点声明的全部 nav/action 交互渲染成打了
  data-trigger / data-action 标签的按钮(id 全部字符串字面量,checker 契约)。
- 特殊处理:
  * kind:"sheet"(subject.markSheet / subject.toc)与 media.imageViewer(共享全屏组件)
    -> 独立浮层路由(Flomo 把菜单做成 bottom-sheet 路由的同款策略)。
  * chrome.tabbar -> components/ChromeTabbar.tsx,常驻五个一级 Tab 路由;
    transitions from = 其余四个 Tab 路由,mode replace,placement tabbar。
  * chrome.drawer -> components/ChromeDrawer.tsx,URL 驱动浮层(?drawer=open);
    宿主 = spec 中所有 nav->chrome.drawer 的页面;抽屉内 transitions 的 from 用
    FromConstraint {path, search:{drawer:'open'}}(FROM_OVERRIDE 的结构化版本);
    抽屉动作只在主页 '/' 的 drawer uiState 里声明一次(actionId 全局唯一)。
运行: python3 apps/Douban/assets/scaffold_l0.py
"""
import json
import re
from pathlib import Path

APP = Path(__file__).parent.parent
SPEC = APP.parents[3] / "docs" / "douban-replication" / "spec.json"
spec = json.loads(SPEC.read_text(encoding="utf-8"))

CHROME_TABBAR = "chrome.tabbar"
CHROME_DRAWER = "chrome.drawer"
# sheet/共享组件 -> 浮层路由(不与既有 spec 路由冲突)
OVERLAY_ROUTES = {
    "subject.markSheet": "/subject/markSheet",
    "subject.toc": "/subject/toc",
    "media.imageViewer": "/media/imageViewer",
}

chrome_nodes = {c["id"]: c for c in spec.get("chrome", [])}
nodes = list(spec.get("nodes", []))
nmap = {n["id"]: n for n in nodes}
nmap.update(chrome_nodes)


def comp_name(nid: str) -> str:
    return "".join(w.capitalize() for w in re.split(r"[.\-]", nid)) + "Page"


def route_of(nid: str) -> str:
    if nid in OVERLAY_ROUTES:
        return OVERLAY_ROUTES[nid]
    n = nmap[nid]
    r = n.get("route")
    if not r:
        raise SystemExit(f"节点缺少 route 且不在 OVERLAY_ROUTES: {nid}")
    return r


def path_params(path: str):
    return re.findall(r":(\w+)", path)


def js(s: str) -> str:
    return str(s).replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ")


# ---- 路由节点 = 全部 page 节点 + 浮层化的 sheet/component 节点 ----
route_nodes = [n for n in nodes if n.get("kind") == "page" or n["id"] in OVERLAY_ROUTES]

paths_seen = {}
routes = []
for n in route_nodes:
    nid = n["id"]
    path = route_of(nid)
    if path in paths_seen:
        raise SystemExit(f"路由冲突 {path}: {nid} vs {paths_seen[path]}")
    paths_seen[path] = nid
    routes.append({"node": n, "path": path, "component": comp_name(nid), "params": path_params(path)})

# ---- chrome 布局推导 ----
tabbar_items = []  # [{tid, to, label}]
for it in chrome_nodes[CHROME_TABBAR]["interactions"]:
    assert it.get("effect") == "nav", "tabbar 只应有 nav 交互"
    tabbar_items.append({
        "tid": it["transitionId"],
        "to": route_of(it["target"]),
        "label": it["element"].replace(" Tab", ""),
    })
TAB_ROUTES = [t["to"] for t in tabbar_items]

# 抽屉宿主 = 所有 nav->chrome.drawer 的页面节点
# 书影音二级频道 Tab:spec 把它建模为每页一条"代表性"transition
# (如 bm.movie.channelTab-open -> bm.tv,desc「同构切换至其余 bm.* 兄弟频道」)。
# 若照抄,bm.book/music/podcast/city 将成为不可达孤岛;按 declaration.md
# 「Tab switching with cases」把每条 channelTab transition 展开成 cases 多目标切换。
BM_CHANNELS = [
    ("movie", "/bm/movie", "电影"),
    ("tv", "/bm/tv", "电视"),
    ("book", "/bm/book", "读书"),
    ("music", "/bm/music", "音乐"),
    ("podcast", "/bm/podcast", "播客"),
    ("city", "/bm/city", "同城"),
]
BM_ROUTE_TO_KEY = {r: k for k, r, _ in BM_CHANNELS}


def is_channel_tab(tid: str) -> bool:
    return tid.endswith(".channelTab-open")


drawer_hosts = []  # [(nid, route)]
for n in nodes:
    for it in n.get("interactions", []):
        if it.get("effect") == "nav" and it.get("target") == CHROME_DRAWER:
            drawer_hosts.append((n["id"], route_of(n["id"])))
            break
DRAWER_HOST_ROUTES = [r for _, r in drawer_hosts]
HOME_NID = "home.feed"

# ---- actions(effect != nav,全部有 actionId;actionId 全局唯一已在 spec 校验) ----
def behavior_of(it):
    aid = it.get("actionId", "")
    g = it.get("gesture")
    if g in ("type", "input"):
        return ("input", True)
    if aid.endswith(".toggle"):
        return ("toggle", False)
    if re.search(r"\.select\.[A-Za-z0-9]+$", aid):
        return ("select", False)
    if aid.endswith(".close"):
        return ("close", False)
    return ("submit", False)


actions_by_route = {r["path"]: [] for r in routes}
drawer_state_actions = []  # chrome.drawer 的动作,挂主页 drawer uiState
seen_actions = set()
for n in list(chrome_nodes.values()) + nodes:
    nid = n["id"]
    for it in n.get("interactions", []):
        if it.get("effect") == "nav":
            continue
        aid = it.get("actionId")
        if not aid:
            continue
        if aid in seen_actions:
            raise SystemExit(f"actionId 重复(spec 应全局唯一): {aid} @ {nid}")
        seen_actions.add(aid)
        beh, needs_schema = behavior_of(it)
        entry = {"id": aid, "label": it.get("element", aid), "behavior": beh,
                 "schema": needs_schema}
        if nid == CHROME_DRAWER:
            drawer_state_actions.append(entry)
        elif nid == CHROME_TABBAR:
            actions_by_route["/"].append(entry)
        else:
            actions_by_route[route_of(nid)].append(entry)

# ---- transitions ----
trans = {}          # tid -> decl
page_nav = {}       # nid -> [{tid, label, params:{k:v}}](占位页要渲染的跳转按钮,按 tid 去重)

# 占位页跳转按钮的样例参数(与 regen_defaults.py 的种子 id 对齐)
PARAM_SAMPLE = {
    "id": "b1", "userId": "u2", "itemId": "m1", "celebrityId": "c1",
    "subjectId": "bk1", "reviewId": "r1", "discussionId": "d1", "episodeId": "p1",
    "listId": "l1", "doulistId": "dl1", "groupId": "g1", "topicId": "gt1",
    "essaySetId": "e1", "productId": "pd1", "orderId": "o1", "courseId": "co1",
}
TARGET_PARAM_OVERRIDE = {
    ("topic.page", "id"): "tp1",
    ("subject.music", "subjectId"): "mu1",
    ("reviews.short", "subjectId"): "m1",
}


def sample_params(target_nid: str, to_path: str):
    out = {}
    for p in path_params(to_path):
        out[p] = TARGET_PARAM_OVERRIDE.get((target_nid, p)) or PARAM_SAMPLE.get(p) or "1"
    return out


def add_transition(tid, src_from, to, search, mode, placement, label, params):
    t = trans.get(tid)
    if t is None:
        trans[tid] = {"id": tid, "from": list(src_from), "to": to, "search": search,
                      "mode": mode, "placement": placement, "label": label, "params": params}
    else:
        # spec 内同 tid 仅在 home.feed 重复出现一次;合并 from,首个定义优先
        for f in src_from:
            if f not in t["from"]:
                t["from"].append(f)


for n in list(chrome_nodes.values()) + nodes:
    nid = n["id"]
    for it in n.get("interactions", []):
        if it.get("effect") != "nav":
            continue
        tid = it.get("transitionId")
        if not tid or tid == "system.back":
            continue
        tgt = it["target"]
        label = it.get("element", tid)

        if nid == CHROME_TABBAR:
            to = route_of(tgt)
            add_transition(tid, [r for r in TAB_ROUTES if r != to], to, {}, "replace",
                           "tabbar", label, {})
        elif nid == CHROME_DRAWER:
            to = route_of(tgt)
            froms = [{"path": r, "search": {"drawer": "open"}} for r in DRAWER_HOST_ROUTES]
            # mode=replace:抽屉里点条目进入目标页时,替换掉 ?drawer=open 这条历史,
            # 于是从目标页按返回键直接回到干净的宿主页(如主页),而不是又弹出抽屉。
            add_transition(tid, froms, to, {}, "replace", "content", label,
                           {p: "string" for p in path_params(to)})
        elif tgt == CHROME_DRAWER:
            # 打开抽屉 = 当前路由 + ?drawer=open(URL 驱动浮层,back 关闭)
            src = route_of(nid)
            add_transition(tid, [src], src, {"drawer": "open"}, "push", "content", label, {})
            page_nav.setdefault(nid, [])
            if tid not in [x["tid"] for x in page_nav[nid]]:
                page_nav[nid].append({"tid": tid, "label": label, "params": {}})
            continue
        elif is_channel_tab(tid):
            # cases 多目标频道切换(mode replace,不进返回栈)
            src = route_of(nid)
            to = route_of(tgt)
            add_transition(tid, [src], to, {}, "replace", "content", label, {})
            trans[tid]["channel_src"] = src
            page_nav.setdefault(nid, [])
            for key, croute, cname in BM_CHANNELS:
                if croute == src:
                    continue
                page_nav[nid].append({"tid": tid, "label": f"频道Tab:{cname}",
                                      "params": {"channel": key}})
            continue
        else:
            src = route_of(nid)
            to = route_of(tgt)
            mode = "replace" if to == "/" else "push"
            add_transition(tid, [src], to, it.get("search", {}), mode, "content", label,
                           {p: "string" for p in path_params(to)})

        if it.get("preserveParams"):
            trans[tid]["preserveParams"] = list(it["preserveParams"])
        if it.get("searchParams"):
            trans[tid]["searchParams"] = dict(it["searchParams"])

        if nid not in chrome_nodes:
            page_nav.setdefault(nid, [])
            if tid not in [x["tid"] for x in page_nav[nid]]:
                page_nav[nid].append({"tid": tid, "label": label,
                                      "params": sample_params(tgt, route_of(tgt) if tgt not in (CHROME_DRAWER,) else "")})

# ---- emit navigation.declaration.ts ----
def actions_ts(acts, indent="          "):
    if not acts:
        return ""
    lines = []
    for a in acts:
        ps = ", paramsSchema: { value: 'string' }" if a["schema"] else ""
        lines.append(f"{indent}  {{ id: '{js(a['id'])}', label: '{js(a['label'])}', behavior: '{a['behavior']}'{ps} }},")
    return f"\n{indent}actions: [\n" + "\n".join(lines) + f"\n{indent}],"


def params_ts(params: dict) -> str:
    if not params:
        return "{}"
    return "{ " + ", ".join(f"{k}: '{v}'" for k, v in params.items()) + " }"


route_blocks = []
for r in routes:
    n = r["node"]
    nid = n["id"]
    path = r["path"]
    title = n.get("title") or n.get("desc") or nid
    ui_id = f"douban.{nid}.base"
    acts = actions_by_route.get(path, [])
    entry = "home" if nid == HOME_NID else "none"
    scroll_name = "feed" if nid == HOME_NID else "main"
    extra_states = ""
    if path in DRAWER_HOST_ROUTES:
        drawer_acts = actions_ts(drawer_state_actions, "          ") if nid == HOME_NID else ""
        extra_states = (
            f"\n        {{ id: 'douban.{nid}.drawer', search: {{ drawer: 'open' }}, "
            f"description: '左侧抽屉菜单(chrome.drawer)',{drawer_acts} }},"
        )
    route_blocks.append(f"""    {{
      path: '{path}',
      component: '{r['component']}',
      params: {params_ts({p: 'string' for p in r['params']})},
      entryPoint: '{entry}',
      scrollContainers: [{{ name: '{scroll_name}', direction: 'vertical', description: '主滚动区' }}],
      uiStates: [
        {{
          id: '{ui_id}', search: {{}}, description: '{js(title)}',{actions_ts(acts)}
        }},{extra_states}
      ],
      queryParams: {params_ts(n.get('queryParams', {}))},
      description: '{js(title)}',
    }},""")


def from_ts(froms):
    def one(f):
        if isinstance(f, dict):
            search = ", ".join(f"{k}: '{v}'" for k, v in f["search"].items())
            return f"{{ path: '{f['path']}', search: {{ {search} }} }}"
        return f"'{f}'"
    if len(froms) == 1:
        return one(froms[0])
    return "[" + ", ".join(one(f) for f in froms) + "]"


trans_blocks = []
for tid, t in trans.items():
    search = t["search"]
    search_ts = "{ " + ", ".join(f"{k}: '{v}'" for k, v in search.items()) + " }" if search else "{}"
    icon = "tab" if t["placement"] == "tabbar" else "arrow"
    cases_ts = ""
    preserve_ts = (
        " preserveParams: ["
        + ", ".join(f"'{js(key)}'" for key in t.get("preserveParams", []))
        + "],"
        if t.get("preserveParams")
        else ""
    )
    if "channel_src" in t:
        branches = []
        for key, croute, _cname in BM_CHANNELS:
            # 跳过自身;跳过 spec 默认目标(由 always 兜底,避免重复边)
            if croute == t["channel_src"] or croute == t["to"]:
                continue
            branches.append(
                f"      {{ when: {{ op: 'eq', left: {{ ref: 'param', key: 'channel' }}, right: '{key}' }}, "
                f"to: '{croute}', search: {{}} }},")
        branches.append(f"      {{ when: {{ op: 'always' }}, to: '{t['to']}', search: {{}} }},")
        cases_ts = " cases: [\n" + "\n".join(branches) + "\n    ],"
    trans_blocks.append(
        f"    {{ id: '{js(tid)}', from: {from_ts(t['from'])}, to: '{t['to']}', "
        f"search: {search_ts}, searchParams: {params_ts(t.get('searchParams', {}))},{preserve_ts}{cases_ts} mode: '{t['mode']}', params: {params_ts(t['params'])}, "
        f"label: '{js(t['label'])}', ui: {{ placement: '{t['placement']}', icon: '{icon}', gesture: 'tap' }} }},"
    )

decl = f"""// AUTO-GENERATED from docs/douban-replication/spec.json (frozen v1.0.0) by assets/scaffold_l0.py
// 不要手改;改 spec 后重跑生成器(spec-first 纪律)。
import type {{ NavigationDeclaration }} from './navigation.types';

export const NAVIGATION_DECLARATION = {{
  app: 'douban',
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
(APP / "navigation.declaration.ts").write_text(decl, encoding="utf-8")

# ---- stub pages(只补缺失,不覆盖) ----
pages_dir = APP / "pages"
pages_dir.mkdir(exist_ok=True)
created = 0
for r in routes:
    f = pages_dir / f"{r['component']}.tsx"
    if f.exists():
        continue
    n = r["node"]
    nid = n["id"]
    path = r["path"]
    title = n.get("title") or nid
    is_tab = path in TAB_ROUTES
    has_params = bool(r["params"])
    navs = page_nav.get(nid, [])
    acts = actions_by_route.get(path, [])

    gesture_binds = []
    if not is_tab:
        gesture_binds.append("bindBack")
    if navs or acts:
        gesture_binds.append("bindTap")

    imports = ["import React from 'react';"]
    if has_params:
        imports.append("import { useParams } from 'react-router-dom';")
    imports.append("import { useDoubanGestures } from '../hooks/useDoubanGestures';")
    if acts:
        imports.append("import { useDoubanStore } from '../state';")

    body_hooks = []
    if gesture_binds:
        body_hooks.append(f"  const {{ {', '.join(gesture_binds)} }} = useDoubanGestures();")
    if acts:
        body_hooks.append("  const toast = useDoubanStore((s) => s.toast);")
    if has_params:
        body_hooks.append("  const routeParams = useParams();")

    back_btn = ("" if is_tab else
                '<button {...bindBack()} className="w-12 text-left text-xl text-[#00B51D]">‹</button>')
    left_pad = '<div className="w-12" />' if is_tab else back_btn

    param_line = (' · 参数 {JSON.stringify(routeParams)}' if has_params else '')

    nav_btns = []
    for nv in navs:
        opts = ""
        if nv["params"]:
            pstr = ", ".join(f"{k}: '{js(v)}'" for k, v in nv["params"].items())
            opts = f", {{ params: {{ {pstr} }} }}"
        nav_btns.append(
            f"          <button {{...bindTap('{js(nv['tid'])}'{opts})}} "
            f"className=\"w-full text-left px-3 py-2 rounded-lg bg-white border border-[#EDEDED] text-sm text-[#1A1A1A]\">"
            f"{{'{js(nv['label'])}'}}</button>")
    nav_section = ""
    if nav_btns:
        nav_section = f"""
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#8A8F99]">跳转(transitions)</div>
{chr(10).join(nav_btns)}
        </div>"""

    act_btns = []
    for a in acts:
        wontfix = a["id"].endswith(".wontfix")
        msg = "该功能暂未开放" if wontfix else f"{a['label']}:L0 占位动作"
        act_btns.append(
            f"          <button {{...bindTap({{ kind: 'action', id: '{js(a['id'])}' }}, "
            f"{{ onTrigger: () => toast('{js(msg)}') }})}} "
            f"className=\"w-full text-left px-3 py-2 rounded-lg bg-white border border-dashed border-[#CBD2D9] text-sm text-[#52616B]\">"
            f"{{'{js(a['label'])}'}}</button>")
    act_section = ""
    if act_btns:
        act_section = f"""
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#8A8F99]">动作(actions)</div>
{chr(10).join(act_btns)}
        </div>"""

    f.write_text(f"""{chr(10).join(imports)}

// 占位页(L0 脚手架自动生成,勿手改;改 spec 后重跑 assets/scaffold_l0.py)。节点: {nid}
export default function {r['component']}() {{
{chr(10).join(body_hooks)}
  return (
    <div className="flex flex-col h-full bg-[#F7F7F7]" data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-2 border-b border-[#EDEDED] bg-white shrink-0">
        {left_pad}
        <div className="flex-1 text-center font-semibold text-[#1A1A1A] truncate">{{'{js(title)}'}}</div>
        <div className="w-12" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-scroll-container="{'feed' if nid == HOME_NID else 'main'}" data-scroll-direction="vertical">
        <div className="text-xs text-[#8A8F99]">节点 {nid} · 路由 {path}{param_line}</div>{nav_section}{act_section}
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
    f"""// AUTO-GENERATED by assets/scaffold_l0.py — 路由表(path -> 页面组件),勿手改
import React from 'react';
{imports}

export const ROUTES: {{ path: string; element: React.ReactNode }}[] = [
{elems}
];
""", encoding="utf-8")

# ---- components/ChromeTabbar.tsx(只补缺失) ----
comp_dir = APP / "components"
comp_dir.mkdir(exist_ok=True)
tabbar_file = comp_dir / "ChromeTabbar.tsx"
if not tabbar_file.exists():
    btns = []
    for t in tabbar_items:
        btns.append(
            f"      <button {{...bindTap('{js(t['tid'])}', pathname === '{t['to']}' ? {{ onTrigger: noop }} : undefined)}} "
            f"className={{tabCls('{t['to']}')}}>{{'{js(t['label'])}'}}</button>")
    tabbar_file.write_text(f"""import React from 'react';
import {{ useLocation }} from 'react-router-dom';
import {{ useDoubanGestures }} from '../hooks/useDoubanGestures';

// 底部 TabBar(L0 脚手架自动生成,勿手改;改 spec 后重跑 assets/scaffold_l0.py)。节点: chrome.tabbar
// 当前 Tab 再点为空操作(noop),避免 go() 抛 from 不匹配。
const noop = () => undefined;

export function ChromeTabbar() {{
  const {{ bindTap }} = useDoubanGestures();
  const {{ pathname }} = useLocation();
  const tabCls = (p: string) =>
    `flex-1 h-full flex items-center justify-center text-xs ${{pathname === p ? 'text-[#00B51D] font-semibold' : 'text-[#8A8F99]'}}`;
  return (
    <div className="h-12 shrink-0 flex border-t border-[#EDEDED] bg-white" data-hide-on-keyboard="true">
{chr(10).join(btns)}
    </div>
  );
}}
""", encoding="utf-8")

# ---- components/ChromeDrawer.tsx(只补缺失) ----
drawer_file = comp_dir / "ChromeDrawer.tsx"
if not drawer_file.exists():
    d = chrome_nodes[CHROME_DRAWER]
    nav_btns = []
    act_btns = []
    close_btn = None
    for it in d["interactions"]:
        label = js(it.get("element", ""))
        if it.get("effect") == "nav":
            nav_btns.append(
                f"          <button {{...bindTap('{js(it['transitionId'])}')}} "
                f"className=\"w-full text-left px-3 py-2 rounded-lg text-sm text-[#1A1A1A] bg-[#F7F7F7]\">{{'{label}'}}</button>")
        else:
            aid = it["actionId"]
            if aid == "drawer.panel.close":
                close_btn = (
                    f"<button {{...bindTap({{ kind: 'action', id: 'drawer.panel.close' }}, "
                    f"{{ onTrigger: () => back() }})}} className=\"w-8 h-8 flex items-center justify-center text-[#8A8F99]\">×</button>")
            else:
                msg = "该功能暂未开放" if aid.endswith(".wontfix") else f"{it.get('element', aid)}:L0 占位动作"
                act_btns.append(
                    f"          <button {{...bindTap({{ kind: 'action', id: '{js(aid)}' }}, "
                    f"{{ onTrigger: () => toast('{js(msg)}') }})}} "
                    f"className=\"w-full text-left px-3 py-2 rounded-lg text-sm text-[#52616B] border border-dashed border-[#CBD2D9]\">{{'{label}'}}</button>")
    drawer_file.write_text(f"""import React from 'react';
import {{ useSearchParams }} from 'react-router-dom';
import {{ useDoubanGestures }} from '../hooks/useDoubanGestures';
import {{ useDoubanStore }} from '../state';

// 左侧抽屉(L0 脚手架自动生成,勿手改;改 spec 后重跑 assets/scaffold_l0.py)。节点: chrome.drawer
// URL 驱动:?drawer=open 时可见;X/遮罩 = back() 弹栈关闭。
export function ChromeDrawer() {{
  const [searchParams] = useSearchParams();
  const {{ bindTap, bindBack, back }} = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  if (searchParams.get('drawer') !== 'open') return null;
  return (
    <div className="absolute inset-0 z-40 flex">
      <div className="w-72 h-full bg-white flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 h-11 shrink-0">
          <div className="text-sm font-semibold text-[#1A1A1A]">抽屉菜单(chrome.drawer)</div>
          {close_btn}
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2" data-scroll-container="drawer" data-scroll-direction="vertical">
{chr(10).join(nav_btns)}
{chr(10).join(act_btns)}
        </div>
      </div>
      <div className="flex-1 h-full bg-black/40" {{...bindBack()}} />
    </div>
  );
}}
""", encoding="utf-8")

n_actions = sum(len(a) for a in actions_by_route.values()) + len(drawer_state_actions)
print(f"routes={len(routes)} transitions={len(trans)} actions={n_actions} "
      f"stub_pages_created={created} tab_routes={TAB_ROUTES} drawer_hosts={DRAWER_HOST_ROUTES}")
print("navigation.declaration.ts + pages/routes.generated.tsx + chrome components written")
