#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从冻结的 spec.json(v1.0.0)生成 apps/Suning/navigation.declaration.ts。

- spec 每个 effect=nav/sheet/dialog 且带 transitionId 的交互 → transition
- effect=state 且带 actionId 的交互 → 宿主路由 uiState 的 action
- effect=toast(wontfix/轻提示)→ 每节点合并为一个 `<node>.wontfix.toast` action
- effect=back 不声明(bindBack / system.back)
- sheet/dialog 目标(`node?sheet=x` / `?dialog=x`)→ 宿主路由的离散 uiState(search 键)
- spec uiStates 若带显式 "search" 对象(如 shopGroup {sort:shop})→ 同样产离散 uiState;
  无 search 键的非 base uiState(如 search.entry 的 suggest,输入驱动非 URL)不产节点
- --nodes a,b,c 只生成子集(分层实现期保持 gate 绿)
- --stub a,b,c:占位节点,只生成 route+base uiState(无 actions/无 outgoing transitions/
  无 wontfix 合并 action),供其他节点的 transition 目标存在(gate 绿);占位页仅 bindBack
- --stub-allow t1,t2:白名单放行占位节点的个别 nav transition(占位页照样只渲染这几个入口)。
  用于「入口在未实现的占位页上、但目标页本批要实现」的情况(如 me.main 占位期放行
  me.main.aftersale.open / me.main.invoice.open),否则目标页在导航图上不可达、
  其 action 任务会被判 unreachable
- queryParams/paramsSchema 的值形如 "string(说明)"/"number(说明)"/"a|b|c" → 归一化为
  'string'/'number'(RouteDeclaration 类型要求字面量)
- sheet/dialog 自指 transition 自动带 preserveParams=宿主 queryParams 键(保住 keyword 等)
- 交互可带 "host": "sheet=x"/"dialog=x" 显式指定 action 归属的离散 uiState
- actionId 支持 <a|b|c> 紧凑写法(如 shop.main.select.<default|sales|newest|price>),
  展开为多个独立 action(共用 label/behavior 逐 id 计算)——M2 升级(spec v1.2.0 注记)
运行: python apps/Suning/assets/gen_nav_declaration.py --nodes home.main,... --stub product.detail,shop.main
"""
import json
import re
import sys
from pathlib import Path

APP = "suning"
SPEC = Path(__file__).parents[5] / "docs/suning-replication/spec.json"
OUT = Path(__file__).parents[1] / "navigation.declaration.ts"

# 节点 id → (path, 组件名);tab 节点 entryPoint=home 仅 home.main
ROUTE_OF = {
    "home.main": ("/", "HomePage"),
    "search.entry": ("/search", "SearchEntryPage"),
    "search.results": ("/search/results", "SearchResultsPage"),
    "search.similar": ("/search/similar", "SimilarPage"),
    "product.detail": ("/product/detail", "ProductDetailPage"),
    "product.reviews": ("/product/reviews", "ProductReviewsPage"),
    "shop.main": ("/shop", "ShopPage"),
    "chat.service": ("/chat", "ChatServicePage"),
    "cart.main": ("/cart", "CartPage"),
    "cart.compare": ("/cart/compare", "ComparePage"),
    "checkout.main": ("/checkout", "CheckoutPage"),
    "pay.success": ("/pay/success", "PaySuccessPage"),
    "orders.list": ("/orders", "OrdersListPage"),
    "orders.search": ("/orders/search", "OrdersSearchPage"),
    "order.detail": ("/order/detail", "OrderDetailPage"),
    "order.modify": ("/order/modify", "OrderModifyPage"),
    "refund.apply": ("/refund/apply", "RefundApplyPage"),
    "refund.detail": ("/refund/detail", "RefundDetailPage"),
    "logistics.detail": ("/logistics", "LogisticsPage"),
    "aftersale.main": ("/aftersale", "AftersalePage"),
    "invoice.list": ("/me/invoices", "InvoicePage"),
    "me.main": ("/me", "MePage"),
    "me.settings": ("/me/settings", "SettingsPage"),
    "me.profile": ("/me/profile", "ProfilePage"),
    "address.list": ("/me/addresses", "AddressListPage"),
    "address.edit": ("/me/addresses/edit", "AddressEditPage"),
    "me.follow": ("/me/follow", "FollowPage"),
    "me.history": ("/me/history", "HistoryPage"),
    "me.coupons": ("/me/coupons", "CouponsPage"),
    "msg.center": ("/messages", "MsgCenterPage"),
    "msg.channel": ("/messages/channel", "MsgChannelPage"),
    "msg.settings": ("/messages/settings", "MsgSettingsPage"),
    "promo.baibu": ("/promo/baibu", "BaibuPage"),
    "rank.hub": ("/rank", "RankHubPage"),
    "rank.detail": ("/rank/detail", "RankDetailPage"),
    "discover.main": ("/discover", "DiscoverPage"),
    "creator.profile": ("/creator", "CreatorProfilePage"),
    "promo.wanhuatong": ("/promo/wanhuatong", "WanhuatongPage"),
}

TAB_NODES = {"home.main", "discover.main", "cart.main", "me.main"}


def esc(s):
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


def behavior_of(aid: str) -> str:
    if aid.endswith(".toggle"):
        return "toggle"
    if ".select." in aid:
        return "select"
    if aid.endswith(".input") or ".input." in aid:
        return "input"
    if aid.endswith((".commit", ".confirm", ".submit", ".save", ".apply", ".claim", ".pay")):
        return "submit"
    return "other"


def ts_obj(d: dict) -> str:
    if not d:
        return "{}"
    parts = []
    for k, v in d.items():
        key = k if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", k) else f"'{esc(k)}'"
        parts.append(f"{key}: '{esc(v)}'")
    return "{ " + ", ".join(parts) + " }"


def ts_str_arr(items: list) -> str:
    return "[" + ", ".join(f"'{esc(x)}'" for x in items) + "]"


def norm_param_type(v):
    """'string(说明)'/'number(说明)'/'a|b|c' → 'string'/'number';其余字符串按 string 兜底。"""
    if not isinstance(v, str):
        return None
    if v.startswith("number"):
        return "number"
    return "string"


def norm_params(d):
    out = {}
    for k, v in (d or {}).items():
        t = norm_param_type(v)
        if t:
            out[k] = t
    return out


def main() -> None:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    assert spec.get("frozen"), "spec 未冻结,禁止生成"
    nodes = spec["chrome"] + spec["nodes"]

    want = None
    if "--nodes" in sys.argv:
        want = set(sys.argv[sys.argv.index("--nodes") + 1].split(","))
    stubs: set[str] = set()
    if "--stub" in sys.argv:
        stubs = set(sys.argv[sys.argv.index("--stub") + 1].split(","))
    stub_allow: set[str] = set()
    if "--stub-allow" in sys.argv:
        stub_allow = set(sys.argv[sys.argv.index("--stub-allow") + 1].split(","))
    included = [n for n in nodes if want is None or n["id"] in want or n["id"] == "tabbar"]
    inc_ids = {n["id"] for n in included}
    unknown_stubs = stubs - inc_ids
    if unknown_stubs:
        raise SystemExit(f"--stub 节点不在 --nodes 集合内: {sorted(unknown_stubs)}")

    by_id = {n["id"]: n for n in nodes}

    def spec_node(nid):
        return by_id[nid]

    # 收集每个宿主路由的离散态(spec uiStates 显式 search + sheet/dialog 目标)与 actions
    route_states: dict[str, dict] = {}
    transitions: list[dict] = []
    emitted_allow: set[str] = set()

    def route_entry(nid):
        path, comp = ROUTE_OF[nid]
        if nid not in route_states:
            route_states[nid] = {
                "path": path,
                "component": comp,
                "entry": "home" if nid == "home.main" else "none",
                "query": norm_params(spec_node(nid).get("queryParams")),
                "states": {},  # stateKey('k=v&…') -> {id, search, desc, actions[]}
                "desc": spec_node(nid).get("title", nid),
            }
            base_id = f"{APP}.{nid.replace('.', '_')}.base"
            route_states[nid]["states"]["__base"] = {
                "id": base_id, "search": {}, "desc": spec_node(nid).get("title", nid), "actions": [],
            }
            # spec uiStates 带显式 search 的离散态(stub 节点只保 base)
            if nid not in stubs:
                qkeys = set(route_states[nid]["query"].keys())
                for st in spec_node(nid).get("uiStates", []):
                    st_search = st.get("search")
                    if not st_search:
                        continue  # 无 URL search 键(如输入驱动的 suggest)不产节点
                    if set(st_search.keys()) <= qkeys:
                        # 平台约定:queryParams 键是动态参数,不作离散 uiState 键
                        # (checker 会把这种态视为第二个 base 报错),如 sort=shop
                        continue
                    skey = "&".join(f"{k}={v}" for k, v in st_search.items())
                    route_states[nid]["states"][skey] = {
                        "id": f"{APP}.{nid.replace('.', '_')}.{st['id']}",
                        "search": dict(st_search),
                        "desc": st.get("desc", st["id"]),
                        "actions": [],
                    }
        return route_states[nid]

    def state_key(search: dict) -> str:
        return "&".join(f"{k}={v}" for k, v in search.items())

    for n in included:
        nid = n["id"]
        if nid == "tabbar":
            continue
        if nid not in ROUTE_OF:
            raise SystemExit(f"缺路由映射: {nid}")
        entry = route_entry(nid)
        if nid in stubs:
            # 占位:route+base 已建,交互一律不声明(与占位页代码同步),
            # 仅 --stub-allow 白名单里的 nav transition 例外
            for it in n.get("interactions", []):
                tid = it.get("transitionId")
                if it.get("effect") != "nav" or tid not in stub_allow:
                    continue
                tgt = str(it.get("target", "")).split("?")[0]
                if tgt not in inc_ids or tgt not in ROUTE_OF:
                    raise SystemExit(f"--stub-allow {tid} 的目标 {tgt} 不在 --nodes 集合内")
                transitions.append({
                    "id": tid,
                    "from": ROUTE_OF[nid][0],
                    "to": ROUTE_OF[tgt][0],
                    "search": {},
                    "searchParams": norm_params(it.get("paramsSchema")),
                    "mode": it.get("mode", "push"),
                    "label": it.get("element", tid),
                })
                emitted_allow.add(tid)
            continue
        wontfix_used = False
        for it in n.get("interactions", []):
            eff = it.get("effect")
            if eff == "back":
                continue
            if eff in ("nav", "sheet", "dialog"):
                tid = it.get("transitionId")
                if not tid:
                    continue
                raw_target = str(it.get("target", ""))
                tgt_node = raw_target.split("?")[0]
                search: dict[str, str] = {}
                if "?" in raw_target:
                    for pair in raw_target.split("?", 1)[1].split("&"):
                        if "=" in pair:
                            k, v = pair.split("=", 1)
                            search[k] = v
                # sheet/dialog 的宿主离散态(spec uiStates 已建同 search 态则复用)
                if eff in ("sheet", "dialog") and search:
                    host = tgt_node
                    if host in inc_ids and host in ROUTE_OF and host not in stubs:
                        h = route_entry(host)
                        skey = state_key(search)
                        if skey not in h["states"]:
                            kind = "sheet" if "sheet" in search else "dialog"
                            sid = f"{APP}.{host.replace('.', '_')}.{list(search.values())[0]}.{kind}"
                            h["states"][skey] = {"id": sid, "search": dict(search), "desc": it.get("element", skey), "actions": []}
                if tgt_node not in inc_ids or tgt_node not in ROUTE_OF:
                    continue  # 目标未实现,transition 暂不声明(与代码同步)
                to_path = ROUTE_OF[tgt_node][0]
                search_params = norm_params(it.get("paramsSchema"))
                mode = it.get("mode", "push")
                t = {
                    "id": tid,
                    "from": "*" if n.get("kind") == "chrome" else ROUTE_OF[nid][0],
                    "to": to_path,
                    "search": search,
                    "searchParams": search_params,
                    "mode": mode,
                    "label": it.get("element", tid),
                }
                # sheet/dialog 自指弹层:保住宿主动态参数(keyword/sort 等)
                if eff in ("sheet", "dialog") and tgt_node == nid:
                    preserve = [k for k in route_entry(nid)["query"].keys() if k not in search]
                    if preserve:
                        t["preserveParams"] = preserve
                transitions.append(t)
            elif eff == "state":
                aid_raw = it.get("actionId")
                if not aid_raw:
                    continue
                # <a|b|c> 紧凑写法 → 展开为多个独立 actionId(spec v1.2.0 注记)
                m = re.fullmatch(r"(.*)<([^>]+)>(.*)", aid_raw)
                aids = (
                    [f"{m.group(1)}{tok}{m.group(3)}" for tok in m.group(2).split("|")]
                    if m
                    else [aid_raw]
                )
                for aid in aids:
                    a = {"id": aid, "label": it.get("element", aid), "behavior": behavior_of(aid)}
                    ps = norm_params(it.get("paramsSchema"))
                    if behavior_of(aid) == "input" and "value" not in ps:
                        ps = {**ps, "value": "string"}
                    if ps:
                        a["params"] = ps
                    # 归属:显式 host("sheet=x"/"dialog=x"/"base")优先;否则仅当 actionId 含
                    # ".{token}." 中缀才挂离散态(不做宽松子串/后缀匹配,避免
                    # quickFilter.toggle 误挂 filterSheet、select.shop 误挂 shopGroup),兜底挂 base
                    # host:"base" 用于中缀会误命中离散态但实际挂主态的场景
                    # (如 checkout.main.subsidy.toggle 与 .subsidy.claim 同含 .subsidy. 中缀)
                    host_key = it.get("host")
                    placed = False
                    if host_key == "base":
                        entry["states"]["__base"]["actions"].append(a)
                        placed = True
                    elif host_key and host_key in entry["states"]:
                        entry["states"][host_key]["actions"].append(a)
                        placed = True
                    if not placed:
                        for skey, st in entry["states"].items():
                            if skey == "__base":
                                continue
                            token = list(st["search"].values())[0]
                            if f".{token}." in aid:
                                st["actions"].append(a)
                                placed = True
                                break
                    if not placed:
                        entry["states"]["__base"]["actions"].append(a)
            elif eff == "toast":
                wontfix_used = True
        if wontfix_used:
            entry["states"]["__base"]["actions"].append({
                "id": f"{nid}.wontfix.toast",
                "label": "各「暂未开放」入口(合并声明)",
                "behavior": "other",
            })

    missing_allow = stub_allow - emitted_allow
    if missing_allow:
        raise SystemExit(f"--stub-allow 未命中(不是占位节点的 nav transition): {sorted(missing_allow)}")

    # tabbar transitions(chrome)
    tb = by_id.get("tabbar")
    if tb:
        for it in tb.get("interactions", []):
            if it.get("effect") != "nav":
                continue
            tid = it.get("transitionId")
            tgt = str(it.get("target", "")).split("?")[0]
            if not tid or tgt not in inc_ids or tgt not in ROUTE_OF:
                continue
            transitions.append({
                "id": tid, "from": "*", "to": ROUTE_OF[tgt][0], "search": {},
                "searchParams": {}, "mode": "replace", "label": it.get("element", tid),
            })

    # 输出 TS
    lines = []
    lines.append("// AUTO-GENERATED by assets/gen_nav_declaration.py from")
    lines.append(f"// docs/suning-replication/spec.json (frozen v{spec.get('specVersion')}).")
    lines.append("// 覆盖率 gate 依赖此文件;改交互先改 spec 再重跑本脚本。手改无效。")
    lines.append("import type { NavigationDeclaration } from './navigation.types';")
    lines.append("")
    lines.append("export const NAVIGATION_DECLARATION = {")
    lines.append(f"  app: '{APP}',")
    lines.append("  routes: [")
    route_chunks = []
    for nid, r in route_states.items():
        st_chunks = []
        for skey, st in r["states"].items():
            actions = ",\n".join(
                "          { id: '%s', label: '%s', behavior: '%s'%s }" % (
                    esc(a["id"]), esc(a["label"]), a["behavior"],
                    (", paramsSchema: %s" % ts_obj(a["params"])) if a.get("params") else "",
                )
                for a in st["actions"]
            )
            st_chunks.append(
                "        {\n          id: '%s',\n          search: %s,\n          description: '%s',\n          actions: [%s]\n        }" % (
                    esc(st["id"]), ts_obj(st["search"]), esc(st["desc"]),
                    ("\n" + actions + "\n        ") if actions else "",
                )
            )
        route_chunks.append(
            "    {\n      path: '%s',\n      component: '%s',\n      params: {},\n      entryPoint: '%s',\n"
            "      scrollContainers: [\n        { name: 'main', direction: 'vertical', description: '主滚动区' }\n      ],\n"
            "      uiStates: [\n%s\n      ],\n      queryParams: %s,\n      description: '%s'\n    }" % (
                r["path"], r["component"], r["entry"], ",\n".join(st_chunks), ts_obj(r["query"]), esc(r["desc"]),
            )
        )
    lines.append(",\n".join(route_chunks))
    lines.append("  ],")
    lines.append("  transitions: [")
    tr_chunks = []
    seen_tid = set()
    for t in transitions:
        if t["id"] in seen_tid:
            continue
        seen_tid.add(t["id"])
        preserve_line = (
            "      preserveParams: %s,\n" % ts_str_arr(t["preserveParams"]) if t.get("preserveParams") else ""
        )
        tr_chunks.append(
            "    {\n      id: '%s',\n      from: %s,\n      to: '%s',\n      search: %s,\n      searchParams: %s,\n"
            "%s      mode: '%s',\n      params: {},\n      label: '%s',\n      ui: { placement: 'none', icon: 'chevronRight', gesture: 'tap' }\n    }" % (
                esc(t["id"]),
                "'*'" if t["from"] == "*" else f"'{t['from']}'",
                t["to"], ts_obj(t["search"]), ts_obj(t["searchParams"]), preserve_line, t["mode"], esc(t["label"]),
            )
        )
    lines.append(",\n".join(tr_chunks))
    lines.append("  ],")
    lines.append("  capabilities: { historyBack: true },")
    lines.append("} as const satisfies NavigationDeclaration;")
    lines.append("")
    lines.append("export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"OK routes={len(route_states)} transitions={len(seen_tid)} -> {OUT}")


if __name__ == "__main__":
    main()
