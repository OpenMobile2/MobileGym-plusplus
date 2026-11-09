# -*- coding: utf-8 -*-
"""
腾讯视频 L0 脚手架生成器:spec.json -> navigation.declaration.ts + 缺失页 stub + 路由表。
- 单一事实源 = docs/tencentvideo-replication/spec.json(v1.0.0 冻结)。
- kind ∈ {page, sheet, dialog, overlay} 均生成路由(sheet/overlay 渲染为弹层样式路由,URL 驱动,back 关闭)。
- effect=back 的交互不生成 transition(§11:返回一律 bindBack=system.back)。
- chrome.tabbar 的 tabbar.switch 展开为 5 条字面量 TAB transition(tab.home/tab.shortdrama/
  tab.vipzone/tab.haopian/tab.me,from=五 tab 根,mode=replace)——照 Keep 的 TAB 模式。
- chrome.resumebar 的 nav + state 交互并入 shortdrama.home(from=/shortdrama);
  chrome.tabbar 的 tabbar.backtop.tap 与 home.feed.scroll.totop 是同一元素(滚动态首页位)的
  重复建模,只申报后者。
- 申报 action 的口径 = 带 actionId 且 effect ∈ {state, none}。effect=none 是 wontfix 入口
  (toast「该功能暂未开放」),按铁律① 同样要能点,必须申报。
- chrome.toast 为全局组件,不生成路由。
- 5 个 tab 根路由覆盖 spec route:/ /shortdrama /vipzone /haopian /me;
  /short-drama/* → /shortdrama/*、/vip-zone/* → /vipzone/* 前缀归一。
- 已存在页面不覆盖;改 spec 后重跑(spec-first 纪律)。
运行: python3 apps/Tencentvideo/assets/scaffold_l0.py
"""
import json
import re
from pathlib import Path

APP = Path(__file__).parent.parent
SPEC = APP.parents[3] / "docs" / "tencentvideo-replication" / "spec.json"
spec = json.loads(SPEC.read_text(encoding="utf-8"))

nodes = list(spec.get("nodes", []))
chrome_nodes = list(spec.get("chrome", []))
nmap = {n["id"]: n for n in nodes}

# ---- 路由覆盖:5 个 tab 根 + 前缀归一(主线程指定;spec route 其余照抄) ----
ROUTE_OVERRIDES = {
    "home.feed": "/",
    "shortdrama.home": "/shortdrama",
    "vip.zone.rights": "/vipzone",
    "haopian.home": "/haopian",
    "me.home": "/me",
}
PREFIX_REWRITES = [("/short-drama", "/shortdrama"), ("/vip-zone", "/vipzone")]

# ---- 路由的 URL 查询参数 ----
# 只给「store 里没有天然当前值」的页面加参数,避免和 store 形成双事实源:
#   · 详情族/选集/下载选集:没有 currentDetailId 这种槽位,必须靠 URL 说清打开的是哪部片;
#   · 频道页/筛选页:同一个组件渲染 8 个完整频道 / 5 个浏览版频道,靠 channel 区分;
#   · 榜单页:入口(首页角标/频道金刚位)决定初始榜单分类。
# 播放器族不带参:playback.* 就是 store 里的当前播放上下文(openPlayback 在跳转时写入)。
# 搜索族不带参:search.input/submitted 已是单一事实源。
ROUTE_QUERY_PARAMS = {
    "/detail/series": {"contentId": "string"},
    "/detail/movie": {"contentId": "string"},
    "/detail/special": {"contentId": "string"},
    "/detail/sports": {"contentId": "string"},
    "/detail/ugc": {"contentId": "string"},
    "/detail/discuss": {"contentId": "string"},
    "/detail/comments": {"contentId": "string"},
    "/detail/episode-panel": {"contentId": "string"},
    "/download/select": {"contentId": "string"},
    "/download/series": {"contentId": "string"},
    "/home/channel-full": {"channel": "string"},
    "/home/channel-lite": {"channel": "string"},
    "/filter": {"channel": "string"},
    "/rank": {"rank": "string"},
    # 单路由多形态:/player/sheets 一个路由承载 7 种弹层,/settings/sub 承载 6 个设置分组。
    # 用动态参数(而非按 transitionId 派生静态 search)是为了让导航图里仍是一个可达节点
    # `/player/sheets?sheet=:sheet`;若写成静态 search,会和 queryParams 模板拼出
    # `?sheet=share&sheet=:sheet` 这种对不上的目标 id,导致 target_missing。
    "/player/sheets": {"sheet": "string"},
    "/settings/sub": {"section": "string"},
}

TAB_ROUTES = ["/", "/shortdrama", "/vipzone", "/haopian", "/me"]
TAB_TRANSITIONS = [
    ("tab.home", "/", "首页"),
    ("tab.shortdrama", "/shortdrama", "短剧"),
    ("tab.vipzone", "/vipzone", "会员专区"),
    ("tab.haopian", "/haopian", "好片"),
    ("tab.me", "/me", "个人中心"),
]
ROUTE_KINDS = {"page", "sheet", "dialog", "overlay"}


def comp_name(nid):
    return "".join(w[:1].upper() + w[1:] for w in re.split(r"[.\-]", nid)) + "Page"


def route_of(nid):
    if nid in ROUTE_OVERRIDES:
        return ROUTE_OVERRIDES[nid]
    n = nmap.get(nid)
    r = (n or {}).get("route") or ""
    if not r.startswith("/"):
        r = "/" + nid.replace(".", "/")
    for old, new in PREFIX_REWRITES:
        if r == old or r.startswith(old + "/"):
            r = new + r[len(old):]
    return r


# ---- chrome.resumebar 的 nav 交互并入 shortdrama.home ----
for cn in chrome_nodes:
    if cn["id"] != "chrome.resumebar":
        continue
    host = nmap["shortdrama.home"]
    for it in cn.get("interactions", []):
        # nav(续播条进播放器)与 state(关闭×)都并入宿主页申报;
        # chrome.tabbar 的 tabbar.backtop.tap 是 home.feed.scroll.totop 的同元素重复建模,不再重复申报。
        if it.get("effect") in ("nav", "state"):
            host.setdefault("interactions", []).append(dict(it))

route_nodes = [n for n in nodes if n.get("kind") in ROUTE_KINDS]

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
# effect=none 且带 actionId 的交互 = wontfix 入口(stateChange 为 toast「该功能暂未开放」):
# 必须一并申报,否则页面按铁律① 接线时会触发 missingInDeclaration。
ACTION_EFFECTS = ("state", "none")
for n in route_nodes:
    host = route_of(n["id"])
    for it in n.get("interactions", []):
        if it.get("effect") not in ACTION_EFFECTS:
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
tabbar_hosts = set()
for n in route_nodes:
    src = route_of(n["id"])
    for it in n.get("interactions", []):
        if it.get("effect") != "nav":
            continue
        if it.get("effect") == "back" or it.get("gesture") == "back":
            continue  # §11 返回走 system.back
        tid = it.get("transitionId")
        if not tid or tid == "system.back":
            continue
        tgt = it.get("target")
        if tgt == "tabbar":
            # tabbar.switch 由 5 条字面量 tab.* transition 承载(TAB 模式);
            # 该节点记为 tabbar 宿主路由(from 集合 + TabBar 可见页)。
            tabbar_hosts.add(src)
            continue
        if tgt not in nmap:
            raise SystemExit(f"未知 target {tgt}(transition {tid} @ {n['id']})")
        to = route_of(tgt)
        t = trans.get(tid)
        if t is None:
            trans[tid] = {"id": tid, "from": {src}, "to": to,
                          "label": it.get("element", tid)}
        else:
            if t["to"] != to:
                raise SystemExit(f"transition {tid} 目标冲突: {t['to']} vs {to}")
            t["from"].add(src)


def js(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def jsx_text(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("{", "&#123;").replace("}", "&#125;"))


def obj_ts(d):
    """{'contentId': 'string'} -> "{ contentId: 'string' }" """
    if not d:
        return "{}"
    return "{ " + ", ".join(f"{k}: '{js(str(v))}'" for k, v in d.items()) + " }"


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
    # /splash 是冷启动才出现的开屏页,app 内没有任何入口指向它 —— 声明成 deepLink 入口,
    # 否则可达性分析会把它当成孤岛报警。
    entry = "home" if path == "/" else "deepLink" if path == "/splash" else "none"
    acts = actions_by_route.get(path, [])
    route_blocks.append(f"""    {{
      path: '{path}',
      component: '{r['component']}',
      params: {{}},
      entryPoint: '{entry}',
      scrollContainers: [{{ name: 'main', direction: 'vertical', description: '主滚动区' }}],
      uiStates: [
        {{
          id: 'tencentvideo.{nid}.base', search: {{}}, description: '{js(n.get('title', nid))}',{actions_ts(acts)}
        }},
      ],
      queryParams: {obj_ts(ROUTE_QUERY_PARAMS.get(path, {}))},
      description: '{js(n.get('title', nid))}',
    }},""")


def from_ts(froms):
    fs = sorted(froms)
    if len(fs) == 1:
        return f"'{fs[0]}'"
    return "[" + ", ".join(f"'{f}'" for f in fs) + "]"


tabbar_hosts.update(TAB_ROUTES)

trans_blocks = []
for tid, to, label in TAB_TRANSITIONS:
    trans_blocks.append(
        f"    {{ id: '{tid}', from: {from_ts(tabbar_hosts)}, to: '{to}', "
        f"search: {{}}, searchParams: {{}}, mode: 'replace', params: {{}}, "
        f"label: '{label}', ui: {{ placement: 'tabbar', icon: 'tab', gesture: 'tap' }} }},")
for tid, t in trans.items():
    mode = "replace" if t["to"] in TAB_ROUTES else "push"
    # searchParams 决定 go() 时哪些运行时参数会写进 URL —— 漏了参数就会被静默丢弃
    trans_blocks.append(
        f"    {{ id: '{js(tid)}', from: {from_ts(t['from'])}, to: '{t['to']}', "
        f"search: {{}}, "
        f"searchParams: {obj_ts(ROUTE_QUERY_PARAMS.get(t['to'], {}))}, mode: '{mode}', params: {{}}, "
        f"label: '{js(t['label'])}', ui: {{ placement: 'content', icon: 'arrow', gesture: 'tap' }} }},")

out = f"""// AUTO-GENERATED from docs/tencentvideo-replication/spec.json (v{spec.get('specVersion')}) by assets/scaffold_l0.py
// 不要手改;改 spec 后重跑生成器(spec-first 纪律)。
import type {{ NavigationDeclaration }} from './navigation.types';

export const NAVIGATION_DECLARATION = {{
  app: 'tencentvideo',
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
pages_dir.mkdir(exist_ok=True)
created = 0
for r in routes:
    f = pages_dir / f"{r['component']}.tsx"
    if f.exists():
        continue
    n = r["node"]
    nid = n["id"]
    title = n.get("title", nid)
    path = r["path"]
    is_tab = path in tabbar_hosts
    outs = [it for it in n.get("interactions", []) if it.get("effect") == "nav"
            and it.get("transitionId") and it.get("transitionId") != "system.back"
            and it.get("gesture") != "back" and it.get("target") != "tabbar"]
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
import {{ useTencentvideoGestures }} from '../hooks/useTencentvideoGestures';
import {{ useTencentvideoStore }} from '../state';
import {{ TopBar }} from '../components/ui';

// 占位页(L0 脚手架自动生成)—— 待按证据实现。节点: {nid}
export default function {r['component']}() {{
  const {{ bindTap }} = useTencentvideoGestures();
  const toast = useTencentvideoStore((s) => s.toast);
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

print(f"routes={len(routes)} transitions={len(trans) + len(TAB_TRANSITIONS)} "
      f"actions={sum(len(a) for a in actions_by_route.values())} stub_pages_created={created}")
print(f"tabbar_hosts={sorted(tabbar_hosts)}")
