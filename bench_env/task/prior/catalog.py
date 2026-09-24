"""Generate the reviewable V5 task catalog."""

from __future__ import annotations

from collections import Counter
from pathlib import Path

from bench_env.task.prior.specs import REPAIRED_CASES
from bench_env.task.prior.tasks import RUNTIME_CASES


def render_catalog() -> str:
    tools = Counter(tool for spec in RUNTIME_CASES for tool in spec.candidate_tools)
    rows = [
        "# Hybrid Tools V5 Task Catalog",
        "",
        f"- Scored tasks: {len(RUNTIME_CASES)}",
        f"- Contracts repaired: {len(REPAIRED_CASES)}",
        f"- V4 contracts inherited unchanged: {len(RUNTIME_CASES) - len(REPAIRED_CASES)}",
        f"- Distinct candidate App Tools: {len(tools)}",
        f"- Simulated time: `{RUNTIME_CASES[0].simulated_time}`",
        "- Primary metric: task success rate (SR)",
        "",
        "| V5 ID | V4 ID | Contract | Difficulty | Apps | Source | Instruction |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for spec in RUNTIME_CASES:
        instruction = spec.instruction.replace("|", "\\|")
        contract = spec.contract_severity if spec.index in REPAIRED_CASES else "unchanged"
        rows.append(
            f"| `{spec.task_id}` | `HTV4Case{spec.index:02d}` | {contract} | "
            f"{spec.difficulty} | {', '.join(spec.apps)} | `{spec.source_task}` | "
            f"{instruction} |"
        )
    rows.extend([
        "",
        "## Candidate Tool Coverage",
        "",
        "Candidate coverage means a tool can be exposed when its app is foregrounded;",
        "it does not imply that a reference trajectory must call it.",
        "",
        "| Tool | Candidate tasks |",
        "| --- | ---: |",
    ])
    rows.extend(f"| `{name}` | {count} |" for name, count in sorted(tools.items()))
    rows.append("")
    return "\n".join(rows)


def main() -> int:
    output = Path(__file__).with_name("TASK_CATALOG.md")
    output.write_text(render_catalog(), encoding="utf-8")
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
