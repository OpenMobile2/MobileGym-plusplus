# -*- coding: utf-8 -*-
"""
从冻结的 spec.json 编译 navigation.declaration.ts(保证与 spec 的 coverage 100% 对齐)。
- 每个 spec 节点 -> 一条 route(component=PascalCase(id 末段));
- effect=nav 且有 transitionId 的交互 -> 一条 transition;
- 有 actionId 的交互 -> 内联进该 route base uiState 的 actions(behavior 由 effect/手势推断);
- uiStates 多态 -> 额外 uiState 条目(panel 走 searchParams)。
运行: python apps/Ctrip/assets/gen_declaration.py
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
SPEC = ROOT / "docs/ctrip-replication/spec.json"
OUT = Path(__file__).resolve().parents[1] / "navigation.declaration.ts"
spec = json.loads(SPEC.read_text(encoding="utf-8"))
APP = spec["app"]

def comp(node):
    # 组件名:取 id 末段 + 节点类别后缀。如 hotel.search -> HotelSearchPage
    parts = re.split(r"[.\-]", node["id"])
    name = "".join(p[:1].upper() + p[1:] for p in parts)
    return name + "Page"

# behavior 推断
def behavior_of(it):
    aid = it.get("actionId", "")
    if aid.endswith(".open"): return "open"
    if aid.endswith(".toggle") or ".toggle." in aid: return "toggle"
    if ".select." in aid or aid.endswith(".select"): return "select"
    if aid.endswith(".value") or it.get("gesture","").startswith("type"): return "input"
    if aid.endswith(".step") or aid.endswith(".edit"): return "modify"
    if aid.endswith(".submit") or aid.endswith(".confirm") or aid.endswith(".pay"): return "submit"
    if aid.endswith(".expand"): return "open"
    if aid.endswith(".wontfix"): return "submit"  # toast 类按 submit 占位(无状态变更但需可触达)
    return "submit"

routes, transitions = [], []
# 收集所有 nav target 用于校验
node_ids = {n["id"] for n in spec["nodes"]}

for n in spec["nodes"]:
    acts = []
    for it in n["interactions"]:
        aid = it.get("actionId")
        if aid:
            a = {"id": aid, "label": it["element"], "behavior": behavior_of(it)}
            b = a["behavior"]
            if b == "input":
                a["paramsSchema"] = {"value": "string"}
            if b == "select":
                # select 须 <prefix>.select.<option> 三段;已在 spec 命名保证
                pass
            acts.append(a)
        tid = it.get("transitionId")
        if tid and it.get("effect") == "nav":
            transitions.append({
                "id": tid, "from": None, "to": None,
                "target": it["target"], "label": it["element"],
                "srcRoute": n["route"],   # 触发该 transition 的来源页(用于收窄 from)
            })
    # uiStates
    ui = []
    states = n.get("uiStates", ["base"])
    if states == ["base"] or not states:
        ui.append({"id": f"{APP}.{n['id']}.base", "search": {}, "actions": acts, "desc": n["title"]})
    else:
        # 空 search 的 base 态 id 必须以 .base 结尾(module-contract 校验);
        # 默认展示 states[0](如 domestic/list/oneway),其余为 panel/筛选态走 searchParams。
        ui.append({"id": f"{APP}.{n['id']}.base", "search": {}, "actions": acts,
                   "desc": f"{n['title']}·{states[0]}"})
        for s in states[1:]:
            ui.append({"id": f"{APP}.{n['id']}.{s}", "search": {"state": s}, "actions": [], "desc": f"{n['title']}·{s}"})
    routes.append({"node": n, "component": comp(n), "ui": ui})

def spec_route(target):
    for n in spec["nodes"]:
        if n["id"] == target: return n["route"]
    return "/"

# 回填 transition.to
for t in transitions:
    t["to"] = spec_route(t["target"])

# chrome tabbar transitions(全局可达,from:'*')
for it in spec["chrome"][0]["interactions"]:
    transitions.append({"id": it["transitionId"], "from": "*", "to": spec_route(it["target"]),
                        "target": it["target"], "label": it["element"], "srcRoute": None})

# 按 id 聚合来源路由:同 id 多处触发 -> from 收窄为这些来源页的集合;tabbar/无来源 -> '*'
from_map = {}
for t in transitions:
    src = t.get("srcRoute")
    if src is None:
        from_map[t["id"]] = "*"
    elif from_map.get(t["id"]) != "*":
        cur = from_map.setdefault(t["id"], [])
        if isinstance(cur, list) and src not in cur:
            cur.append(src)

# 实现层跨页复用:某些 spec 声明的通用导航在其它页也作为入口触发(如详情页「更多」快捷面板、
# 地图卡→详情)。此表把这些额外来源页并入 from,保证 from 与代码触发点一致(gate 通过)。
# tabbar.* 默认 from:'*',但被详情页「更多」浮层复用为消息入口时,需把 '*' 展开为显式路径集合
# (含 4 个 tab 根 + 详情页),否则 consistency 的 path-only 校验无法匹配 '*'。
TAB_ROOTS = ["/", "/message", "/trip", "/mine"]
FORCE_FROM = {
    "tabbar.message-open": TAB_ROOTS + ["/hotel/:id"],
}
EXTRA_FROM = {
    "paySuccess.toHome": ["/hotel/:id"],   # 详情页「更多」浮层·首页
    "mine.toOrders": ["/hotel/:id"],       # 详情页「更多」浮层·订单
    "hotelList.toDetail": ["/hotel/map"],  # 地图气泡卡·查看详情
}
for tid, paths in FORCE_FROM.items():
    from_map[tid] = list(paths)
for tid, extra in EXTRA_FROM.items():
    if from_map.get(tid) == "*":
        continue
    cur = from_map.setdefault(tid, [])
    for p in extra:
        if p not in cur:
            cur.append(p)

# 去重 transition(同 id 取首个;from 用聚合结果)
seen, uniq = set(), []
for t in transitions:
    if t["id"] in seen: continue
    seen.add(t["id"]); uniq.append(t)

# ---- emit TS ----
def js(s): return json.dumps(s, ensure_ascii=False)

lines = [
    "/**",
    " * Ctrip 声明式导航 —— 由 docs/ctrip-replication/spec.json v1.0.0 自动编译(gen_declaration.py)。",
    " * 改导航请改 spec 后重跑生成器,勿手改本文件(spec-first 纪律)。",
    " * 弹层/筛选态走 searchParams(state=xxx),符合 module-contract「URL 驱动 UI」。",
    " */",
    "import type { NavigationDeclaration } from './navigation.types';",
    "",
    "export const NAVIGATION_DECLARATION = {",
    f"  app: {js(APP)},",
    "  routes: [",
]
for r in routes:
    n = r["node"]
    entry = "home" if n["route"] == "/" else "none"
    lines.append("    {")
    lines.append(f"      path: {js(n['route'])},")
    lines.append(f"      component: {js(r['component'])},")
    lines.append("      params: {},")
    lines.append(f"      entryPoint: {js(entry)},")
    lines.append("      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],")
    lines.append("      uiStates: [")
    for u in r["ui"]:
        lines.append("        {")
        lines.append(f"          id: {js(u['id'])}, search: {js(u['search']).replace(': ', ': ')}, description: {js(u['desc'])},")
        if u["actions"]:
            lines.append("          actions: [")
            for a in u["actions"]:
                extra = f", paramsSchema: {{ value: 'string' }}" if a.get("paramsSchema") else ""
                lines.append(f"            {{ id: {js(a['id'])}, label: {js(a['label'])}, behavior: {js(a['behavior'])}{extra} }},")
            lines.append("          ],")
        else:
            lines.append("          actions: [],")
        lines.append("        },")
    lines.append("      ],")
    # queryParams: 多态用离散 uiState 的 search(state=xxx)表达,不再声明为动态 queryParam
    # (否则 consistency 校验把 state 当动态键排除,离散态退化成 base)。
    lines.append(f"      queryParams: {{}},")
    lines.append(f"      description: {js(n['title'])},")
    lines.append("    },")
lines.append("  ],")
lines.append("  transitions: [")
for t in uniq:
    frm = from_map.get(t["id"], "*")
    if frm == "*" or not frm:
        from_ts = "'*'"
    elif len(frm) == 1:
        from_ts = js(frm[0])
    else:
        from_ts = "[" + ", ".join(js(p) for p in frm) + "]"
    lines.append("    {")
    lines.append(f"      id: {js(t['id'])}, from: {from_ts}, to: {js(t['to'])},")
    lines.append(f"      search: {{}}, searchParams: {{}}, mode: 'push', params: {{}},")
    lines.append(f"      label: {js(t['label'])}, ui: {{ placement: 'none', icon: 'forward', gesture: 'tap' }},")
    lines.append("    },")
lines.append("  ],")
lines.append("  capabilities: { historyBack: true },")
lines.append("} as const satisfies NavigationDeclaration;")
lines.append("")
lines.append("export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];")
lines.append("")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"OK: {OUT}")
print(f"   routes={len(routes)} transitions={len(uniq)} actions={sum(len(u['actions']) for r in routes for u in r['ui'])}")
# 导出组件名清单供 App.tsx 用
comps = [(r['node']['id'], r['node']['route'], r['component']) for r in routes]
(Path(__file__).resolve().parents[1] / "assets" / "_routes.json").write_text(
    json.dumps(comps, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"   wrote _routes.json ({len(comps)} components)")
