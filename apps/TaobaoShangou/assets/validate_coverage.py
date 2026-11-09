# -*- coding: utf-8 -*-
"""
coverage 校验(pipeline Gate3):
1. spec.json 的全部 transitionId/actionId 必须出现在 navigation.declaration.ts
2. declaration 中的 id 必须出现在 spec(防止实现期私加转换,spec-first)
3. --code:spec 全部 id 必须以字符串字面量出现在 pages/components 源码(data-trigger/data-action 绑定点)
用法: python validate_coverage.py [--code]
"""
import json
import re
import sys
from pathlib import Path

APP = Path(__file__).parent.parent
SPEC = json.loads((Path(__file__).resolve().parents[5] / "docs/elema-replication/spec.json").read_text(encoding="utf-8"))

spec_trans, spec_acts = set(), set()
for n in SPEC["chrome"] + SPEC["nodes"]:
    for it in n.get("interactions", []):
        if it.get("effect") == "nav":
            t = it.get("transitionId")
            if t and t != "system.back":
                spec_trans.add(t)
        elif it.get("actionId"):
            spec_acts.add(it["actionId"])

decl = (APP / "navigation.declaration.ts").read_text(encoding="utf-8")
decl_trans = set(re.findall(r"\{ id: '([^']+)', from:", decl))
decl_acts = set(re.findall(r"\{ id: '([^']+)', label:", decl)) - decl_trans

errs = []
for missing in sorted(spec_trans - decl_trans):
    errs.append(f"spec transition 未声明: {missing}")
for missing in sorted(spec_acts - decl_acts):
    errs.append(f"spec action 未声明: {missing}")
for extra in sorted(decl_trans - spec_trans):
    errs.append(f"declaration 多余 transition(spec-first 违规): {extra}")
for extra in sorted(decl_acts - spec_acts):
    errs.append(f"declaration 多余 action(spec-first 违规): {extra}")

if "--code" in sys.argv:
    src = ""
    for d in ("pages", "components", "hooks"):
        for f in (APP / d).rglob("*.tsx"):
            src += f.read_text(encoding="utf-8")
        for f in (APP / d).rglob("*.ts"):
            src += f.read_text(encoding="utf-8")
    src += (APP / f"{APP.name}App.tsx").read_text(encoding="utf-8") if (APP / f"{APP.name}App.tsx").exists() else ""
    for i in sorted(spec_trans | spec_acts):
        if f"'{i}'" not in src:
            errs.append(f"代码未绑定: {i}")

print(f"spec: {len(spec_trans)} transitions / {len(spec_acts)} actions; "
      f"declaration: {len(decl_trans)} transitions / {len(decl_acts)} actions")
if errs:
    print(f"ERROR x{len(errs)}:")
    for e in errs:
        print(" ", e)
    sys.exit(1)
print("OK: coverage 100%")
