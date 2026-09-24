"""Generate the reviewable V3 task and candidate-tool catalog."""

from __future__ import annotations

from collections import Counter
from pathlib import Path

from bench_env.task.drafts.tasks import RUNTIME_CASES


def render_catalog() -> str:
    tools = Counter(tool for spec in RUNTIME_CASES for tool in spec.candidate_tools)
    groups = Counter(spec.group for spec in RUNTIME_CASES)
    rows = [
        "# Hybrid Tools V3 Task Catalog",
        "",
        "V3 freezes each instruction together with its source setup and verifier.",
        "Official-derived instructions are verbatim default instances, not rewrites.",
        "",
        f"- Tasks: {len(RUNTIME_CASES)}",
        f"- Official test-split tasks: {sum(spec.group in {'commerce', 'content', 'life', 'work'} for spec in RUNTIME_CASES)}",
        f"- Taobao source tasks: {groups['taobao']}",
        f"- Deterministic transfer tasks: {groups['transfer']}",
        f"- Distinct candidate App Tools: {len(tools)}",
        "",
        "| ID | Group | Difficulty | Apps | Source | Instruction |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for spec in RUNTIME_CASES:
        instruction = spec.instruction.replace("|", "\\|")
        rows.append(
            f"| `{spec.task_id}` | {spec.group} | {spec.difficulty} | "
            f"{', '.join(spec.apps)} | `{spec.source_task}` | {instruction} |"
        )
    rows.extend([
        "",
        "## Candidate Tool Coverage",
        "",
        "Candidate coverage means the tool can become available while solving the task;",
        "it does not imply that a trajectory must or should call every listed tool.",
        "",
        "| Tool | Candidate tasks |",
        "| --- | ---: |",
    ])
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
