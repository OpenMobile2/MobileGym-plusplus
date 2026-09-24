# -*- coding: utf-8 -*-
"""
Coverage 校验器(pipeline v3 阶段3 机器 gate)—— flomo。

比对三方:
  A. spec.json 声明的 interactions(transitionId / actionId)
  B. navigation.declaration.ts 声明的 transitions + ACTIONS
  C. 代码中实际出现的 data-trigger / data-action 绑定(bindTap('id') / {kind:'action', id:'id'})

规则:spec P0/P1 必须在 B 和 C 中出现(P2/wontfix 缺失仅 WARN)。

运行: python apps/Flomo/assets/validate_coverage.py
"""
import json
import re
import sys
from pathlib import Path

APP = Path(__file__).parent.parent
REPO = APP.parent.parent          # trial_apps/mobilegym
SPEC = REPO.parent.parent / "docs" / "flomo-replication" / "spec.json"

spec = json.loads(SPEC.read_text(encoding="utf-8"))

# ---- A: spec interactions ----
spec_ids = {}  # id -> priority
for node in list(spec.get("chrome", [])) + list(spec.get("nodes", [])):
    for it in node.get("interactions", []):
        tid = it.get("transitionId") or it.get("actionId")
        if not tid:
            continue
        prio = it.get("priority", "P2")
        cur = spec_ids.get(tid)
        order = {"P0": 0, "P1": 1, "P2": 2, "wontfix": 3}
        if cur is None or order.get(prio, 2) < order.get(cur, 2):
            spec_ids[tid] = prio

spec_ids.pop("system.back", None)

# ---- B: declaration ----
decl_text = (APP / "navigation.declaration.ts").read_text(encoding="utf-8")
declared = set(re.findall(r"id:\s*'([^']+)'", decl_text))
declared = {d for d in declared if not d.startswith("flomo.") and d not in ("string", "number")}

# ---- C: 代码绑定 ----
code_ids = set()
for f in list(APP.rglob("*.tsx")) + list(APP.rglob("*.ts")):
    if f.name in ("navigation.declaration.ts",):
        continue
    text = f.read_text(encoding="utf-8")
    # 任意单引号 dotted-id 字面量:覆盖 bindTap('x') / {kind:'action',id:'x'} / go('x')
    # 以及 helper 传参(act('x',...) / filterBind('x',...) / openTid="x" 等),不受绑定写法限制。
    code_ids |= set(re.findall(r"'([a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)+)'", text))
    code_ids |= set(re.findall(r'"([a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)+)"', text))
code_ids.discard("system.back")

errors, warns = [], []

for tid, prio in sorted(spec_ids.items()):
    if prio == "wontfix":
        continue
    miss = []
    if tid not in declared:
        miss.append("declaration")
    if tid not in code_ids:
        miss.append("code")
    if miss:
        msg = f"spec[{prio}] {tid} 缺少: {','.join(miss)}"
        (errors if prio in ("P0", "P1") else warns).append(msg)

# 未声明的 id 由 build_nav 一致性检查权威把关(此处仅提示,避免宽松字面量扫描误报)
for tid in sorted(code_ids - declared):
    if tid in spec_ids:
        warns.append(f"代码出现但 declaration 未声明: {tid}")

for tid in sorted(declared - code_ids):
    if tid in spec_ids and spec_ids[tid] == "wontfix":
        continue
    warns.append(f"声明了但代码未绑定: {tid}")

total = len([p for p in spec_ids.values() if p != 'wontfix'])
covered = len([t for t, p in spec_ids.items() if p != 'wontfix' and t in code_ids and t in declared])
print(f"spec 可执行交互: {total} | 已覆盖: {covered} | coverage = {covered}/{total} = {covered/total*100:.1f}%")
print(f"declaration ids: {len(declared)} | 代码绑定 ids: {len(code_ids)}")

if warns:
    print(f"\nWARN ({len(warns)}):")
    for w in warns:
        print(f"  - {w}")
if errors:
    print(f"\nERROR ({len(errors)}):")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print("\nOK: coverage gate 通过")
