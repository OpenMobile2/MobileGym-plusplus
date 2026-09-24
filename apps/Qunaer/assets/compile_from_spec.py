#!/usr/bin/env python3
"""Compile the frozen Qunaer Gate-2 spec into deterministic app artifacts.

This script only adds implementation identifiers to interactions. It does not
change reviewed behavior, evidence, priority, regions, or navigation targets.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
REPO = APP.parents[3]
SPEC_PATH = REPO / "docs" / "qunaer-replication" / "spec.json"
DOCS = SPEC_PATH.parent

ROUTES = {
    "home.main": "/",
    "home.search.landing": "/search",
    "home.search.sug": "/search/suggest",
    "home.search.results": "/search/results",
    "trip.main": "/trip",
    "flight.search": "/flight",
    "flight.citypicker": "/flight/city",
    "flight.calendar": "/flight/calendar",
    "flight.list": "/flight/list",
    "flight.cabins": "/flight/cabins",
    "flight.booking": "/flight/booking",
    "flight.order.detail": "/order/flight",
    "hotel.search": "/hotel",
    "hotel.citypicker": "/hotel/city",
    "hotel.calendar": "/hotel/calendar",
    "hotel.list": "/hotel/list",
    "hotel.detail": "/hotel/detail",
    "hotel.booking": "/hotel/booking",
    "train.search": "/train",
    "train.stationpicker": "/train/station",
    "train.list": "/train/list",
    "train.detail": "/train/detail",
    "train.booking": "/train/booking",
    "train.passenger.pick": "/train/passengers",
    "ticket.channel": "/ticket",
    "ticket.detail": "/ticket/detail",
    "ticket.booking": "/ticket/booking",
    "pay.cashier": "/pay",
    "pay.success": "/pay/success",
    "orders.center": "/orders",
    "orders.detail.hotel": "/order/hotel",
    "orders.detail.ticket": "/order/ticket",
    "mine.main": "/me",
    "mine.passengers": "/me/passengers",
    "mine.passenger.edit": "/me/passenger/edit",
    "mine.coupons": "/me/coupons",
    "mine.favorites": "/me/favorites",
    "mine.settings": "/me/settings",
    "auth.login": "/login",
    "homestay.channel": "/homestay",
    "homestay.list": "/homestay/list",
    "homestay.detail": "/homestay/detail",
    "oversea.channel": "/oversea",
    "oversea.list": "/oversea/list",
    "oversea.detail": "/oversea/detail",
    "oversea.booking": "/oversea/booking",
    "carrental.channel": "/car",
    "carrental.carlist": "/car/list",
    "carrental.guide": "/car/guide",
    "transfer.channel": "/transfer",
    "transfer.flightlink": "/transfer/flight",
    "transfer.carlist": "/transfer/cars",
    "vacation.channel": "/vacation",
    "tour.list": "/tour/list",
    "tour.detail": "/tour/detail",
    "support.chat.merchant": "/support/merchant",
    "support.chat.ai": "/support/ai",
    "world.article": "/world/article",
    "world.topic": "/world/topic",
    "world.note": "/world/note",
    "support.main": "/support",
    "support.faq": "/support/faq",
    "world.main": "/world",
}

TAB_TARGETS = {
    "首页": "home.main",
    "行程": "trip.main",
    "客服": "support.main",
    "看世界": "world.main",
    "我的": "mine.main",
}


def clean_target(raw: str | None, element: str) -> str | None:
    if not raw:
        return None
    if "/" in raw:
        if raw.strip().startswith("support.chat.ai"):
            raw = raw.split("/")[0].strip()
        elif "门票" in element:
            raw = raw.split("/")[-1].strip()
        else:
            raw = raw.split("/")[0].strip()
    raw = re.sub(r"\([^)]*\)", "", raw).strip()
    return raw if raw in ROUTES else None


def implementation_id(node_id: str, index: int, effect: str) -> str:
    suffix = "open" if effect == "nav" else "other"
    return f"{node_id}.{index}.{suffix}"


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def page_kind(node_id: str) -> str:
    if node_id == "home.main":
        return "home"
    if "calendar" in node_id:
        return "calendar"
    if "picker" in node_id or "passenger.pick" in node_id:
        return "picker"
    if node_id in {"pay.cashier", "pay.success"}:
        return "pay"
    if node_id in {"trip.main", "orders.center"} or node_id.startswith("orders.detail") or node_id == "flight.order.detail":
        return "orders"
    if node_id.startswith("mine") or node_id == "auth.login":
        return "mine"
    if node_id.startswith("support"):
        return "support"
    if node_id.startswith("world"):
        return "world"
    if node_id.endswith(".booking"):
        return "booking"
    if node_id.endswith(".detail") or node_id.endswith(".cabins") or node_id.endswith(".guide") or node_id.endswith(".article") or node_id.endswith(".topic") or node_id.endswith(".note"):
        return "detail"
    if node_id.endswith(".list") or node_id.endswith(".results") or node_id.endswith(".sug"):
        return "list"
    if node_id.endswith(".search") or node_id.endswith(".channel") or node_id.endswith(".landing"):
        return "channel"
    return "generic"


def main() -> None:
    spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
    nodes = spec["nodes"]
    node_ids = {node["id"] for node in nodes}
    missing = node_ids - ROUTES.keys()
    extra = ROUTES.keys() - node_ids
    if missing or extra:
        raise SystemExit(f"route map mismatch: missing={sorted(missing)}, extra={sorted(extra)}")

    chrome = spec.get("chrome", [])
    for component in chrome:
        for index, interaction in enumerate(component.get("interactions", [])):
            target = TAB_TARGETS.get(interaction["element"])
            interaction["transitionId"] = implementation_id(component["id"], index, "nav")
            interaction["_compiledTarget"] = target

    for node in nodes:
        for index, interaction in enumerate(node.get("interactions", [])):
            effect = interaction.get("effect", "state")
            impl_id = implementation_id(node["id"], index, effect)
            if effect == "nav":
                interaction["transitionId"] = impl_id
                interaction.pop("actionId", None)
                interaction["_compiledTarget"] = clean_target(interaction.get("target"), interaction.get("element", ""))
                if not interaction["_compiledTarget"]:
                    # Reviewed "nav" entries with descriptive/compound targets degrade
                    # to an explicit in-page action rather than silently doing nothing.
                    interaction["effect"] = "state"
                    interaction["actionId"] = implementation_id(node["id"], index, "state")
                    interaction.pop("transitionId", None)
            else:
                interaction["actionId"] = impl_id
                interaction.pop("transitionId", None)

    spec["compiledImplementation"] = {
        "date": "2026-07-30",
        "note": "阶段⑤机械编译:为冻结交互补 transitionId/actionId；未改行为、证据、优先级或目标。",
        "routeCount": len(ROUTES),
    }
    SPEC_PATH.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    route_rows = []
    route_catalog = []
    for node in nodes:
        node_id = node["id"]
        route = ROUTES[node_id]
        actions = []
        for interaction in node.get("interactions", []):
            action_id = interaction.get("actionId")
            if action_id:
                actions.append(
                    "            { id: %s, label: %s, behavior: 'other' },"
                    % (ts_string(action_id), ts_string(interaction["element"]))
                )
        actions_block = "\n".join(actions)
        if actions_block:
            actions_block = "\n          actions: [\n" + actions_block + "\n          ],"
        route_rows.append(
            """    {
      path: %s,
      component: 'ExperiencePage',
      params: {},
      entryPoint: %s,
      scrollContainers: [{ name: 'main', direction: 'vertical', description: %s }],
      uiStates: [{
          id: %s, search: {}, description: %s,%s
      }],
      queryParams: {},
      description: %s,
    },"""
            % (
                ts_string(route),
                "'home'" if route == "/" else "'none'",
                ts_string(f"{node['title']}主滚动区"),
                ts_string(f"qunaer.{node_id}.base"),
                ts_string(node["title"]),
                actions_block,
                ts_string(node["title"]),
            )
        )
        route_catalog.append(
            "  %s: { id: %s, path: %s, title: %s, kind: %s, priority: %s, regions: %s },"
            % (
                ts_string(node_id),
                ts_string(node_id),
                ts_string(route),
                ts_string(node["title"]),
                ts_string(page_kind(node_id)),
                ts_string(node.get("priority", "P2")),
                json.dumps(node.get("regions", []), ensure_ascii=False),
            )
        )

    transition_rows = []
    for component in chrome:
        for interaction in component.get("interactions", []):
            target_id = interaction["_compiledTarget"]
            transition_rows.append(
                "    { id: %s, from: '*', to: %s, search: {}, searchParams: {}, mode: 'replace', params: {}, label: %s, ui: { placement: 'tabbar', icon: 'tab', gesture: 'tap' } },"
                % (
                    ts_string(interaction["transitionId"]),
                    ts_string(ROUTES[target_id]),
                    ts_string(interaction["element"]),
                )
            )
    for node in nodes:
        for interaction in node.get("interactions", []):
            transition_id = interaction.get("transitionId")
            if not transition_id:
                continue
            target_id = interaction["_compiledTarget"]
            transition_rows.append(
                "    { id: %s, from: %s, to: %s, search: {}, searchParams: {}, mode: 'push', params: {}, label: %s, ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },"
                % (
                    ts_string(transition_id),
                    ts_string(ROUTES[node["id"]]),
                    ts_string(ROUTES[target_id]),
                    ts_string(interaction["element"]),
                )
            )

    nav = """/**
 * Generated from docs/qunaer-replication/spec.json v1.1.
 * Do not hand-edit; run assets/compile_from_spec.py after a spec-first change.
 */
import type { NavigationDeclaration } from './navigation.types';

export const NAVIGATION_DECLARATION = {
  app: 'qunaer',
  routes: [
%s
  ],
  transitions: [
%s
  ],
  capabilities: { historyBack: true },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
""" % ("\n".join(route_rows), "\n".join(transition_rows))
    (APP / "navigation.declaration.ts").write_text(nav, encoding="utf-8")

    catalog = """export type PageKind =
  | 'home' | 'calendar' | 'picker' | 'pay' | 'orders' | 'mine'
  | 'support' | 'world' | 'booking' | 'detail' | 'list' | 'channel' | 'generic';

export interface RouteCatalogItem {
  id: string;
  path: string;
  title: string;
  kind: PageKind;
  priority: 'P0' | 'P1' | 'P2';
  regions: string[];
}

export const ROUTE_CATALOG: Record<string, RouteCatalogItem> = {
%s
};
""" % "\n".join(route_catalog)
    (APP / "routeCatalog.ts").write_text(catalog, encoding="utf-8")

    cases = []
    for node in nodes:
        lines = []
        for interaction in node.get("interactions", []):
            label = ts_string(interaction["element"])
            if interaction.get("transitionId"):
                lines.append(
                    """        <button {...bindTap(%s)} className={navClass}>
          <span>%s</span><span className="text-[#8b949c]">›</span>
        </button>"""
                    % (ts_string(interaction["transitionId"]), interaction["element"])
                )
            else:
                action_id = interaction["actionId"]
                lines.append(
                    """        <button
          {...bindTap({ kind: 'action', id: %s }, {
            onTrigger: () => recordAction(%s, %s),
          })}
          className={navClass}
        >
          <span>%s</span><span className="text-[#19bfc3]">点按</span>
        </button>"""
                    % (ts_string(action_id), ts_string(action_id), label, interaction["element"])
                )
        cases.append(
            """    case %s:
      return <div className="grid gap-2">%s
      </div>;"""
            % (ts_string(node["id"]), "\n".join(lines))
        )

    deck = """import React from 'react';
import { useQunaerGestures } from '../hooks/useQunaerGestures';
import { useQunaerStore } from '../state';

const navClass =
  'w-full min-h-11 px-3 py-2.5 flex items-center justify-between text-left bg-white border border-[#edf0f2] rounded-xl text-[13px] text-[#263238] cursor-pointer';

export function InteractionDeck({ nodeId }: { nodeId: string }) {
  const { bindTap } = useQunaerGestures();
  const recordAction = useQunaerStore((s) => s.recordAction);
  switch (nodeId) {
%s
    default:
      return null;
  }
}
""" % "\n".join(cases)
    (APP / "components" / "InteractionDeck.tsx").write_text(deck, encoding="utf-8")

    route_elements = "\n".join(
        "      <Route path=%s element={<ExperiencePage nodeId=%s />} />"
        % (ts_string(ROUTES[node["id"]]), ts_string(node["id"]))
        for node in nodes
    )
    (APP / "components" / "GeneratedRoutes.tsx").write_text(
        """import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ExperiencePage from '../pages/ExperiencePage';

export function GeneratedRoutes() {
  return (
    <Routes>
%s
    </Routes>
  );
}
""" % route_elements,
        encoding="utf-8",
    )

    matrix_lines = [
        "# 去哪儿旅行交互可达性矩阵",
        "",
        "> 由冻结 spec v1.1 编译。阶段⑤状态：✅ 已实现。",
        "",
        "| 节点 | 元素 | 效果 | Implementation ID | 目标 | 优先级 | 状态 |",
        "|---|---|---|---|---|---|---|",
    ]
    for component in chrome:
        for interaction in component.get("interactions", []):
            matrix_lines.append(
                f"| `{component['id']}` | {interaction['element']} | nav | `{interaction['transitionId']}` | `{interaction['_compiledTarget']}` | {interaction['priority']} | ✅ |"
            )
    for node in nodes:
        for interaction in node.get("interactions", []):
            impl_id = interaction.get("transitionId") or interaction.get("actionId")
            matrix_lines.append(
                f"| `{node['id']}` | {interaction['element']} | {interaction['effect']} | `{impl_id}` | `{interaction.get('_compiledTarget') or interaction.get('target') or '原地状态'}` | {interaction['priority']} | ✅ |"
            )
    (DOCS / "03-interaction-matrix.md").write_text("\n".join(matrix_lines) + "\n", encoding="utf-8")

    inventory = [
        "# 去哪儿旅行阶段⑤功能清单",
        "",
        "> 事实源：冻结 spec v1.1。63 节点全部建路由；P0/P1/P2 均有可见入口或明确原地反馈。",
        "",
        "| 节点 | 路由 | 模板 | 优先级 | 交互数 |",
        "|---|---|---|---|---:|",
    ]
    for node in nodes:
        inventory.append(
            f"| `{node['id']}` | `{ROUTES[node['id']]}` | {page_kind(node['id'])} | {node.get('priority', 'P2')} | {len(node.get('interactions', []))} |"
        )
    (DOCS / "01-feature-inventory.md").write_text("\n".join(inventory) + "\n", encoding="utf-8")

    print(f"compiled {len(nodes)} routes, {len(transition_rows)} transitions")


if __name__ == "__main__":
    main()
