# -*- coding: utf-8 -*-
"""去哪儿旅行阶段⑤ coverage / route 机器 gate。"""
import json
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
ROOT = APP.parents[3]
SPEC = ROOT / "docs" / "qunaer-replication" / "spec.json"

spec = json.loads(SPEC.read_text(encoding="utf-8"))
required: dict[str, str] = {}
rank = {"P0": 0, "P1": 1, "P2": 2}
for node in [*spec.get("chrome", []), *spec.get("nodes", [])]:
    for interaction in node.get("interactions", []):
        if interaction.get("wontfix"):
            continue
        interaction_id = interaction.get("transitionId") or interaction.get("actionId")
        if not interaction_id or interaction_id == "system.back":
            continue
        priority = interaction.get("priority", "P2")
        if interaction_id not in required or rank[priority] < rank[required[interaction_id]]:
            required[interaction_id] = priority

declaration = (APP / "navigation.declaration.ts").read_text(encoding="utf-8")
code = "\n".join(
    path.read_text(encoding="utf-8")
    for path in [*APP.rglob("*.ts"), *APP.rglob("*.tsx")]
    if path.name != "navigation.declaration.ts"
)
declared = set(re.findall(r"""id:\s*["']([^"']+\.(?:open|other))["']""", declaration))
bound = set(re.findall(r"""(?:bind(?:Tap|LongPress|DoubleTap)\(\s*|id:\s*)["']([^"']+\.(?:open|other))["']""", code))

errors: list[str] = []
warnings: list[str] = []
for interaction_id, priority in sorted(required.items()):
    missing = []
    if interaction_id not in declared:
        missing.append("declaration")
    if interaction_id not in bound:
        missing.append("code")
    if missing:
        message = f"spec[{priority}] {interaction_id} 缺少: {','.join(missing)}"
        (errors if priority in {"P0", "P1"} else warnings).append(message)
for interaction_id in sorted(bound - declared):
    errors.append(f"代码绑定了未声明的 id: {interaction_id}")
for interaction_id in sorted(declared - bound):
    warnings.append(f"声明了但代码未绑定: {interaction_id}")

route_decl = set(re.findall(r"""path:\s*["']([^"']+)["']""", declaration))
route_impl = set(re.findall(r"""<Route path=["']([^"']+)["']""", (APP / "components" / "GeneratedRoutes.tsx").read_text(encoding="utf-8")))
for route in sorted(route_decl - route_impl):
    errors.append(f"声明路由未实现: {route}")
for route in sorted(route_impl - route_decl):
    errors.append(f"实现路由未声明: {route}")

covered = sum(item in declared and item in bound for item in required)
print(f"spec 可执行交互: {len(required)} | 已覆盖: {covered} | coverage={covered / max(len(required), 1) * 100:.1f}%")
print(f"declaration ids={len(declared)} | code ids={len(bound)} | routes={len(route_decl)}/{len(route_impl)}")
if warnings:
    print(f"WARN ({len(warnings)}):")
    for warning in warnings:
        print("  -", warning)
if errors:
    print(f"ERROR ({len(errors)}):")
    for error in errors:
        print("  -", error)
    sys.exit(1)
print("OK: coverage / route gate 通过")
