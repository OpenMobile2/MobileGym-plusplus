"""Generate the human-readable v2 task catalog."""

from __future__ import annotations

from collections import Counter
from pathlib import Path

# Importing tasks materializes official wrapper specs.
from bench_env.task.steps import tasks as _tasks  # noqa: F401
from bench_env.task.steps.specs import TASK_SPECS


def render_catalog() -> str:
    tools = Counter(tool for spec in TASK_SPECS for tool in spec.candidate_tools)
    rows = [
        "# Hybrid Tools V2 Task Catalog",
        "",
        "V2 is a fixed 50-task challenge suite. Instructions express user intent; source values",
        "remain in simulator state. Official-derived cases retain their upstream semantic verifier.",
        "",
        f"- Tasks: {len(TASK_SPECS)}",
        f"- Official L3/L4 verifier wrappers: {sum(spec.source_task is not None for spec in TASK_SPECS)}",
        f"- New hybrid dependency tasks: {sum(spec.source_task is None for spec in TASK_SPECS)}",
        f"- Distinct candidate App Tools: {len(tools)}",
        "",
        "| ID | Difficulty | Apps | Source verifier | Instruction |",
        "| --- | --- | --- | --- | --- |",
    ]
    for spec in TASK_SPECS:
        instruction = spec.instruction.replace("|", "\\|")
        source = f"`{spec.source_task}`" if spec.source_task else "v2 state goals"
        rows.append(
            f"| `{spec.task_id}` | {spec.difficulty} | {', '.join(spec.apps)} | "
            f"{source} | {instruction} |"
        )
    rows.extend(["", "## Candidate Tool Coverage", "", "| Tool | Tasks |", "| --- | ---: |"])
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

