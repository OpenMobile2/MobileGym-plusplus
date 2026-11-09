"""Render the checked-in human-readable task catalog from TASK_SPECS."""

from __future__ import annotations

from collections import Counter
from pathlib import Path

from bench_env.task.core.specs import TASK_SPECS


def render_catalog() -> str:
    groups = [
        ("Calendar", "cal_"),
        ("WeChat", "wx_"),
        ("Taobao Instant", "tb_"),
        ("Days Matter", "dm_"),
        ("Clock", "clk_"),
        ("Notes", "note_"),
        ("Cross App", "cross_"),
    ]
    tools = Counter(tool for spec in TASK_SPECS for tool in spec.candidate_tools)
    rows = [
        "# Hybrid Tools V1 Task Catalog",
        "",
        "This file is generated from `specs.py`; the Python records are authoritative.",
        "",
        f"- Fixed tasks: {len(TASK_SPECS)}",
        f"- Tasks with a GUI-only stage: {sum(spec.gui_required for spec in TASK_SPECS)}",
        f"- Distinct candidate App Tools: {len(tools)}",
        "- All tasks start from the launcher and are also solvable through pure GUI interaction.",
        "",
    ]
    for title, prefix in groups:
        rows.extend([f"## {title}", "", "| Dataset ID | Runner task ID | GUI required | Instruction |", "| --- | --- | ---: | --- |"])
        for spec in TASK_SPECS:
            if not spec.task_id.startswith(prefix):
                continue
            instruction = spec.instruction.replace("|", "\\|")
            rows.append(f"| `{spec.task_id}` | `core.{spec.class_name}` | {'yes' if spec.gui_required else 'no'} | {instruction} |")
        rows.append("")
    rows.extend(["## Candidate Tool Coverage", "", "| Tool | Eligible tasks |", "| --- | ---: |"]) 
    rows.extend(f"| `{name}` | {count} |" for name, count in sorted(tools.items()))
    rows.append("")
    return "\n".join(rows)


def main() -> int:
    target = Path(__file__).with_name("TASK_CATALOG.md")
    target.write_text(render_catalog(), encoding="utf-8")
    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

