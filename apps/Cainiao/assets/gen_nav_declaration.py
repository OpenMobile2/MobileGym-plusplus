#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从冻结的 spec.json 生成 navigation.declaration.ts(照 FanqieTodo 同名脚本改造)。
- spec 里每个 nav transitionId → transition;每个 state/wontfix actionId → uiState action
- effect=back 且带 actionId 的「提交后返回」交互也进 actions(commit)
- 返回/关闭(gesture back 无 actionId)不声明,由 bindBack 处理
运行: python apps/Cainiao/assets/gen_nav_declaration.py
"""
import json
from pathlib import Path

APP = "cainiao"
SPEC = Path(__file__).parents[5] / "docs/cainiao-replication/spec.json"
OUT = Path(__file__).parents[1] / "navigation.declaration.ts"

ROUTE_OF = {
    "home.main": ("/", "HomePage"),
    "home.search": ("/home/search", "HomeSearchPage"),
    "home.importSettings": ("/home/import-settings", "ImportSettingsPage"),
    "package.list": ("/package/list", "PackageListPage"),
    "package.detail": ("/package/detail", "PackageDetailPage"),
    "pickup.main": ("/pickup", "PickupPage"),
    "ship.main": ("/ship", "ShipPage"),
    "ship.addressbook": ("/ship/addressbook", "AddressBookPage"),
    "ship.address.edit": ("/ship/address/edit", "AddressEditPage"),
    "ship.lockers": ("/ship/lockers", "LockersPage"),
    "ship.pricing": ("/ship/pricing", "PricingPage"),
    "ship.pricing.rules": ("/ship/pricing/rules", "PricingRulesPage"),
    "ship.prohibited": ("/ship/prohibited", "ProhibitedPage"),
    "ship.orders": ("/ship/orders", "ShipOrdersPage"),
    "ship.order.detail": ("/ship/order/detail", "ShipOrderDetailPage"),
    "ship.cancel": ("/ship/cancel", "ShipCancelPage"),
    "discover.main": ("/discover", "DiscoverPage"),
    "coupons.main": ("/coupons", "CouponsPage"),
    "messages.main": ("/messages", "MessagesPage"),
    "messages.package": ("/messages/package", "MessagesPackagePage"),
    "messages.wenwen": ("/messages/wenwen", "MessagesWenwenPage"),
    "messages.channel": ("/messages/channel", "MessagesChannelPage"),
    "me.main": ("/me", "MePage"),
    "me.idcode": ("/me/idcode", "IdCodePage"),
    "me.benefits": ("/me/benefits", "BenefitsPage"),
    "me.phone": ("/me/phone", "PhonePage"),
    "me.phone.add": ("/me/phone/add", "PhoneAddPage"),
    "me.phone.verify": ("/me/phone/verify", "PhoneVerifyPage"),
    "me.shoporders": ("/me/shoporders", "ShopOrdersPage"),
    "me.settings": ("/me/settings", "SettingsPage"),
    "me.service": ("/me/service", "ServicePage"),
}
DIALOG_ON = {
    "home.confirm.dialog": ("/", {"dialog": "confirmTaken"}),
    "pickup.confirm.dialog": ("/pickup", {"dialog": "confirmTaken"}),
    "pickup.openLocker.warn": ("/pickup", {"dialog": "openLocker"}),
    "pickup.openLocker.ok": ("/pickup", {"dialog": "openLockerOk"}),
    "package.filter.sheet": ("/package/list", {"sheet": "filter"}),
    "ship.item.sheet": ("/ship", {"sheet": "item"}),
    "ship.time.sheet": ("/ship", {"sheet": "time"}),
    "ship.handover.sheet": ("/ship", {"sheet": "handover"}),
    "ship.insurance.custom.sheet": ("/ship", {"sheet": "insuranceCustom"}),
    "ship.fee.sheet": ("/ship", {"sheet": "fee"}),
    "ship.locker.cell.sheet": ("/ship", {"sheet": "lockerCell"}),
    "ship.region.sheet": ("/ship/address/edit", {"sheet": "region"}),
    "ship.address.tags.sheet": ("/ship/address/edit", {"sheet": "tags"}),
    "ship.addressbook.deleteConfirm.dialog": ("/ship/addressbook", {"dialog": "deleteConfirm"}),
    "ship.orders.deleteConfirm.dialog": ("/ship/orders", {"dialog": "deleteConfirm"}),
    "me.phone.confirm.dialog": ("/me/phone", {"dialog": "modifyConfirm"}),
    "me.shoporders.confirm.dialog": ("/me/shoporders", {"dialog": "confirmReceipt"}),
}

spec = json.loads(SPEC.read_text(encoding="utf-8"))
nodes = spec["chrome"] + spec["nodes"]
by_id = {n["id"]: n for n in nodes}
assert spec.get("frozen"), "spec 未冻结,禁止生成"

missing_map = [n["id"] for n in nodes if n["id"] not in ROUTE_OF and n["id"] not in DIALOG_ON and n["id"] != "chrome.tabbar"]
assert not missing_map, f"spec 节点缺路由映射: {missing_map}"


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
    if aid.endswith((".commit", ".confirm", ".submit", ".save", ".apply")):
        return "submit"
    return "other"


def actions_for(node):
    out, seen = [], set()
    for it in node.get("interactions", []):
        eff = it.get("effect")
        aid = it.get("actionId")
        if not aid or aid in seen:
            continue
        if eff not in ("state", "back"):
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
        dnode = by_id[dnid]
        ui_states.append({
            "id": f"{APP}.{dnid}",
            "search": dict(dsearch),
            "description": esc(dnode.get("title", dnid)),
            "actions": actions_for(dnode),
        })
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

transitions, seen_t = [], set()
for n in nodes:
    src = n["id"]
    from_path = "*" if src == "chrome.tabbar" else node_path(src)
    for it in n.get("interactions", []):
        if it.get("effect") != "nav" or it.get("gesture") == "back":
            continue
        tid = it.get("transitionId")
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
        mode = "replace" if tid.startswith("tabbar.") else "push"
        transitions.append({
            "id": tid, "from": from_path or "*", "to": to, "search": search,
            "searchParams": sp, "mode": mode, "params": {},
            "label": esc(it.get("element", tid)),
            "ui": {"placement": "none", "icon": "chevronRight", "gesture": "tap"},
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
// docs/cainiao-replication/spec.json (frozen v{spec['specVersion']}).
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
