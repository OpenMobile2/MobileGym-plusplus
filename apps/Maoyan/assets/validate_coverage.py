# -*- coding: utf-8 -*-
"""
Coverage 校验器(pipeline v3 机器 gate)—— 猫眼。

比对三方:
  A. docs/maoyan-replication/spec.json 声明的 interactions(transitionId / actionId;wontfix 项跳过)
  B. navigation.declaration.ts 声明的 transitions + actions
  C. 代码中实际绑定(bindTap / bindLongPress / bindDoubleTap / {kind:'action',id} / go('id'))

规则:
  - spec P0/P1 条目必须在 B 和 C 中出现(P2 缺失 WARN)
  - C 绑定但 B 未声明 → ERROR;B 声明但 C 未绑定 → WARN
  - system.back(bindBack)由 OS 统一处理,不参与比对

运行: python apps/Maoyan/assets/validate_coverage.py
"""
import json
import re
import sys
from pathlib import Path

APP = Path(__file__).parent.parent
REPO = APP.parent.parent
SPEC = REPO.parent.parent / "docs" / "maoyan-replication" / "spec.json"

spec = json.loads(SPEC.read_text(encoding="utf-8"))

# ---- A: spec interactions ----
spec_ids = {}
for node in list(spec.get("chrome", [])) + list(spec.get("nodes", [])):
    for it in node.get("interactions", []):
        if it.get("wontfix"):
            continue  # wontfix 项在实现里是 *.disabled action,行为=toast,不按 id 对齐
        tid = it.get("transitionId") or it.get("actionId")
        if not tid:
            continue
        prio = it.get("priority", "P2")
        order = {"P0": 0, "P1": 1, "P2": 2}
        cur = spec_ids.get(tid)
        if cur is None or order.get(prio, 2) < order.get(cur, 2):
            spec_ids[tid] = prio
spec_ids.pop("system.back", None)

# ---- B: declaration ----
decl_text = (APP / "navigation.declaration.ts").read_text(encoding="utf-8")
declared = set(re.findall(r"id:\s*'([^']+)'", decl_text))
declared = {d for d in declared if not d.startswith("maoyan.") and d not in ("string", "number")}

# ---- C: 代码绑定 ----
code_ids = set()
for f in list(APP.rglob("*.tsx")) + list(APP.rglob("*.ts")):
    if f.name in ("navigation.declaration.ts",):
        continue
    text = f.read_text(encoding="utf-8")
    code_ids |= set(re.findall(r"bind(?:Tap|LongPress|DoubleTap)\(\s*'([^']+)'", text))
    code_ids |= set(re.findall(r"kind:\s*'action',\s*id:\s*'([^']+)'", text))
    code_ids |= set(re.findall(r"\bgo\(\s*'([^']+)'", text))
code_ids.discard("system.back")

errors, warns = [], []

for tid, prio in sorted(spec_ids.items()):
    miss = []
    if tid not in declared:
        miss.append("declaration")
    if tid not in code_ids:
        miss.append("code")
    if miss:
        msg = f"spec[{prio}] {tid} 缺少: {','.join(miss)}"
        (errors if prio in ("P0", "P1") else warns).append(msg)

for tid in sorted(code_ids - declared):
    errors.append(f"代码绑定了未声明的 id: {tid}")

for tid in sorted(declared - code_ids):
    warns.append(f"声明了但代码未绑定: {tid}")

total = len(spec_ids)
covered = len([t for t in spec_ids if t in code_ids and t in declared])
print(f"spec 可执行交互: {total} | 已覆盖: {covered} | coverage = {covered}/{total} = {covered / max(total,1) * 100:.1f}%")
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
