# -*- coding: utf-8 -*-
"""Compile Luckin navigation declaration from the frozen pipeline-v3 spec."""
from __future__ import annotations

import json
import re
from collections import OrderedDict
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

ROOT = Path(__file__).resolve().parents[5]
SPEC = ROOT / "docs" / "luckin-replication" / "spec.json"
OUT = Path(__file__).resolve().parents[1] / "navigation.declaration.ts"

spec = json.loads(SPEC.read_text(encoding="utf-8"))


def split_route(route: str) -> tuple[str, dict[str, str]]:
    parts = urlsplit(route)
    return parts.path or "/", dict(parse_qsl(parts.query, keep_blank_values=True))


def component_name(node_id: str) -> str:
    return "".join(part[:1].upper() + part[1:] for part in re.split(r"[.\-]", node_id)) + "Page"


def action_behavior(item: dict) -> str:
    aid = item.get("actionId", "")
    if ".select." in aid:
        return "select"
    if aid.endswith(".input") or item.get("gesture") == "input":
        return "input"
    if ".toggle" in aid:
        return "toggle"
    if aid.endswith(".open"):
        return "open"
    if any(part in aid for part in (".step", ".add", ".delete", ".clear")):
        return "modify"
    if any(part in aid for part in (".submit", ".confirm", ".save", ".claim", ".run")):
        return "submit"
    return "other"


nodes = spec["nodes"]
node_by_id = {node["id"]: node for node in nodes}
groups: OrderedDict[str, list[dict]] = OrderedDict()
for node in nodes:
    path, _ = split_route(node["route"])
    groups.setdefault(path, []).append(node)

seen_actions: set[str] = set()
routes = []
for path, group in groups.items():
    primary = next((node for node in group if node.get("kind") == "page"), group[0])
    ui_states = []
    for node in group:
        _, base_search = split_route(node["route"])
        actions = []
        for item in node.get("interactions", []):
            aid = item.get("actionId")
            if not aid or aid in seen_actions:
                continue
            seen_actions.add(aid)
            action = {"id": aid, "label": item["element"], "behavior": action_behavior(item)}
            if action["behavior"] == "input":
                action["paramsSchema"] = {"value": "string"}
            actions.append(action)

        state_id = f"luckin.{node['id']}.base" if not base_search else f"luckin.{node['id']}"
        descriptions = node.get("uiStates") or []
        ui_states.append({
            "id": state_id,
            "search": base_search,
            "description": descriptions[0]["desc"] if descriptions else node["title"],
            "actions": actions,
        })
        for state in descriptions[1:]:
            search = dict(base_search)
            search["view"] = state["id"]
            safe_state = re.sub(r"[^a-zA-Z0-9]+", ".", state["id"]).strip(".")
            ui_states.append({
                "id": f"luckin.{node['id']}.{safe_state}",
                "search": search,
                "description": state["desc"],
                "actions": [],
            })

    params = {name: "string" for name in re.findall(r":(\w+)", path)}
    routes.append({
        "path": path,
        "component": component_name(primary["id"]),
        "params": params,
        "entryPoint": "home" if path == "/" else "none",
        "uiStates": ui_states,
        "description": primary["title"],
    })

transitions_by_id: OrderedDict[str, dict] = OrderedDict()


def add_transition(item: dict, source_node: dict | None) -> None:
    tid = item.get("transitionId")
    if not tid or tid == "system.back" or item.get("effect") not in ("nav", None):
        return
    target = node_by_id.get(item.get("target"))
    if not target:
        return
    to_path, target_search = split_route(target["route"])
    if source_node is None:
        source: str | dict = "*"
    else:
        from_path, from_search = split_route(source_node["route"])
        source = {"path": from_path, "search": from_search} if from_search else from_path
    params = {name: "string" for name in re.findall(r":(\w+)", to_path)}
    if tid not in transitions_by_id:
        transitions_by_id[tid] = {
            "id": tid,
            "from": source,
            "to": to_path,
            "search": target_search,
            "searchParams": {},
            "mode": "push",
            "params": params,
            "label": item["element"],
            "placement": "tabbar" if tid.startswith("tabbar.") else "content",
        }
    else:
        old = transitions_by_id[tid]["from"]
        if old != "*" and source != old:
            values = old if isinstance(old, list) else [old]
            if source not in values:
                values.append(source)
            transitions_by_id[tid]["from"] = values


for chrome in spec.get("chrome", []):
    for item in chrome.get("interactions", []):
        add_transition(item, None)
for node in nodes:
    for item in node.get("interactions", []):
        add_transition(item, node)


def js(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))


lines = [
    "/**",
    f" * Luckin navigation FSM — generated from docs/luckin-replication/spec.json v{spec['specVersion']}.",
    " * Change the spec first, then rerun assets/gen_declaration.py.",
    " */",
    "import type { NavigationDeclaration } from './navigation.types';",
    "",
    "export const NAVIGATION_DECLARATION = {",
    "  app: 'luckin',",
    "  routes: [",
]
for route in routes:
    lines.extend([
        "    {",
        f"      path: {js(route['path'])}, component: {js(route['component'])},",
        f"      params: {js(route['params'])}, entryPoint: {js(route['entryPoint'])},",
        "      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],",
        "      uiStates: [",
    ])
    for state in route["uiStates"]:
        lines.append("        {")
        lines.append(f"          id: {js(state['id'])}, search: {js(state['search'])}, description: {js(state['description'])},")
        lines.append("          actions: [")
        for action in state["actions"]:
            extra = f", paramsSchema: {js(action['paramsSchema'])}" if "paramsSchema" in action else ""
            lines.append(f"            {{ id: {js(action['id'])}, label: {js(action['label'])}, behavior: {js(action['behavior'])}{extra} }},")
        lines.append("          ],")
        lines.append("        },")
    lines.extend([
        "      ],",
        "      queryParams: {},",
        f"      description: {js(route['description'])},",
        "    },",
    ])
lines.append("  ],")
lines.append("  transitions: [")
for transition in transitions_by_id.values():
    lines.extend([
        "    {",
        f"      id: {js(transition['id'])}, from: {js(transition['from'])}, to: {js(transition['to'])},",
        f"      search: {js(transition['search'])}, searchParams: {js(transition['searchParams'])}, mode: {js(transition['mode'])}, params: {js(transition['params'])},",
        f"      label: {js(transition['label'])}, ui: {{ placement: {js(transition['placement'])}, icon: 'forward', gesture: 'tap' }},",
        "    },",
    ])
lines.extend([
    "  ],",
    "  capabilities: { historyBack: true },",
    "} as const satisfies NavigationDeclaration;",
    "",
    "export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];",
    "",
])

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"OK: routes={len(routes)} transitions={len(transitions_by_id)} actions={len(seen_actions)} -> {OUT}")
