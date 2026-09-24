# -*- coding: utf-8 -*-
"""Three-way coverage gate: spec ↔ declaration ↔ actual DOM bindings."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[3]
SPEC = ROOT / "docs" / "luckin-replication" / "spec.json"

spec = json.loads(SPEC.read_text(encoding="utf-8"))
spec_ids: dict[str, str] = {}
rank = {"P0": 0, "P1": 1, "P2": 2, "wontfix": 3}
for node in [*spec.get("chrome", []), *spec.get("nodes", [])]:
    for item in node.get("interactions", []):
        for key in ("transitionId", "actionId"):
            value = item.get(key)
            if not value or value == "system.back":
                continue
            priority = item.get("priority", "P2")
            if value not in spec_ids or rank[priority] < rank[spec_ids[value]]:
                spec_ids[value] = priority

declaration = (APP / "navigation.declaration.ts").read_text(encoding="utf-8")
declared = set(re.findall(r"\bid:\s*['\"]([^'\"]+)['\"]", declaration)) & set(spec_ids)

bound: set[str] = set()
for file in [*APP.rglob("*.ts"), *APP.rglob("*.tsx")]:
    if file.name == "navigation.declaration.ts":
        continue
    text = file.read_text(encoding="utf-8")
    bound.update(re.findall(r"bind(?:Tap|LongPress|DoubleTap|Action)\(\s*['\"]([^'\"]+)['\"]", text))
    bound.update(re.findall(r"\bgo\(\s*['\"]([^'\"]+)['\"]", text))
    bound.update(re.findall(r"data-(?:action|trigger)=['\"]([^'\"]+)['\"]", text))
    bound.update(re.findall(r"\bactionId=['\"]([^'\"]+)['\"]", text))

errors: list[str] = []
warnings: list[str] = []
for item_id, priority in sorted(spec_ids.items()):
    missing = []
    if item_id not in declared:
        missing.append("declaration")
    if item_id not in bound:
        missing.append("code")
    if missing:
        message = f"spec[{priority}] {item_id} missing: {','.join(missing)}"
        (errors if priority in ("P0", "P1") else warnings).append(message)

for item_id in sorted(bound - declared - {"system.back"}):
    errors.append(f"code binds undeclared id: {item_id}")
for item_id in sorted(declared - bound):
    warnings.append(f"declared but not bound: {item_id}")

covered = sum(item_id in declared and item_id in bound for item_id in spec_ids)
print(f"spec ids={len(spec_ids)} declared={len(declared)} bound={len(bound - {'system.back'})}")
print(f"coverage={covered}/{len(spec_ids)} ({covered / len(spec_ids) * 100:.1f}%)")
for warning in warnings:
    print(f"WARN: {warning}")
for error in errors:
    print(f"ERROR: {error}")
if errors:
    sys.exit(1)
print("OK: coverage gate passed")
