# -*- coding: utf-8 -*-
"""阶段⑤ AI 静态自检(pipeline v3 §5.4)—— 微博。
三类扫描:①空回调(点了没反应) ②假 toast 回调(非 stub 动作只弹提示) ③随机 id(Math.random)。
运行: python apps/Weibo/assets/static_selfcheck.py
"""
import re
import sys
from pathlib import Path

APP = Path(__file__).parent.parent
errors, warns = [], []

STUB_HINT = re.compile(r"stub|dismiss|close|expand|jump|insert|toggle|scrollTop|resend|refresh")

for f in sorted(list(APP.rglob("*.tsx")) + list(APP.rglob("*.ts"))):
    if f.name.startswith("navigation.") or "assets" in f.parts:
        continue
    text = f.read_text(encoding="utf-8")
    rel = f.relative_to(APP)

    # ① 空回调:onTrigger: () => {} / onClick={() => {}}
    for m in re.finditer(r"on(?:Trigger|Click)[:=]\s*\{?\(\)\s*=>\s*\{\}\}?", text):
        line = text[: m.start()].count("\n") + 1
        errors.append(f"[空回调] {rel}:{line} {m.group(0)[:50]}")

    # ② 假 toast:onTrigger 里只有 toast(...) 且动作 id 不含 stub 语义
    for m in re.finditer(
        r"id:\s*'([^']+)'\s*\}\s*,\s*\{\s*onTrigger:\s*\(\)\s*=>\s*toast\([^)]*\)\s*\}", text
    ):
        aid = m.group(1)
        if not STUB_HINT.search(aid):
            line = text[: m.start()].count("\n") + 1
            errors.append(f"[假toast] {rel}:{line} 非stub动作 {aid} 只弹提示")

    # ③ 随机 id
    for m in re.finditer(r"Math\.random\(\)", text):
        line = text[: m.start()].count("\n") + 1
        errors.append(f"[随机id] {rel}:{line} Math.random()")

    # 附:Date.now / new Date(eslint 已禁,双保险)
    for m in re.finditer(r"(?<!TimeService\.realNow\(\) // )(?:\bDate\.now\(\)|new Date\()", text):
        line = text[: m.start()].count("\n") + 1
        errors.append(f"[时间] {rel}:{line} 未走 TimeService")

if warns:
    print(f"WARN ({len(warns)}):")
    for w in warns:
        print(f"  - {w}")
if errors:
    print(f"ERROR ({len(errors)}):")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print("OK: 静态自检通过(空回调/假toast/随机id/时间 四类均未发现)")
