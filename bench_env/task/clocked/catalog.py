"""Generate reviewable V4 task and V3-to-V4 audit tables."""

from __future__ import annotations

from collections import Counter
from pathlib import Path

from bench_env.task.drafts.specs import CASES as V3_CASES
from bench_env.task.clocked.specs import CASES, DROP_REASONS
from bench_env.task.clocked.tasks import RUNTIME_CASES


def render_catalog() -> str:
    tools = Counter(tool for spec in RUNTIME_CASES for tool in spec.candidate_tools)
    revisions = Counter(spec.revision for spec in RUNTIME_CASES)
    rows = [
        "# Hybrid Tools V4 Task Catalog",
        "",
        "V4 is a case-by-case audit of V3. Every task freezes the simulator at",
        f"`{RUNTIME_CASES[0].simulated_time}` before app warming and setup.",
        "",
        f"- Scored tasks: {len(RUNTIME_CASES)}",
        f"- Retained without wording changes: {revisions['retained']}",
        f"- Clarification-only revisions: {revisions['instruction_clarified']}",
        f"- Repaired verifier contracts: {revisions['verifier_fix']}",
        f"- Dropped V3 cases: {len(DROP_REASONS)}",
        f"- Distinct candidate App Tools: {len(tools)}",
        "- Primary metric: task success rate (SR)",
        "",
        "| V4 ID | V3 ID | Revision | Difficulty | Apps | Source | Instruction |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for spec in RUNTIME_CASES:
        instruction = spec.instruction.replace("|", "\\|")
        rows.append(
            f"| `{spec.task_id}` | `{spec.v3_index:02d}` | {spec.revision} | "
            f"{spec.difficulty} | {', '.join(spec.apps)} | `{spec.source_task}` | {instruction} |"
        )
    rows.extend([
        "",
        "## Candidate Tool Coverage",
        "",
        "Candidate coverage means a tool can be exposed when its app is foregrounded;",
        "it does not require a trajectory to call that tool.",
        "",
        "| Tool | Candidate tasks |",
        "| --- | ---: |",
    ])
    rows.extend(f"| `{name}` | {count} |" for name, count in sorted(tools.items()))
    rows.append("")
    return "\n".join(rows)


def render_audit() -> str:
    kept = {case.v3_index: case for case in CASES}
    rows = [
        "# V3 to V4 Case Audit",
        "",
        "Every V3 task received an explicit retain, clarify, repair, or drop decision.",
        "Instruction edits expose only constraints already enforced by the verifier;",
        "they do not prescribe a step-by-step solution.",
        "",
        "| V3 | Decision | Reason |",
        "| --- | --- | --- |",
    ]
    for source in V3_CASES:
        if source.index in DROP_REASONS:
            decision = "drop"
            reason = DROP_REASONS[source.index]
        else:
            case = kept[source.index]
            decision = case.revision
            reason = case.audit_reason
        rows.append(f"| `{source.index:02d}` | {decision} | {reason} |")
    rows.extend([
        "",
        "## Reference Trajectory Policy",
        "",
        "A hand-authored reference trajectory is not mandatory for every long task.",
        "The V3 Gemini run supplies historical execution evidence for all retained",
        "cases and successful evidence for 63 of them, but changed wording/time means",
        "those artifacts are not represented as exact V4 reference trajectories.",
        "V4 instead gates inclusion on deterministic setup, an initially negative",
        "verifier, dynamic tool exposure, explicit contract review, and targeted",
        "browser replay for repaired boundaries.",
        "",
    ])
    return "\n".join(rows)


def main() -> int:
    root = Path(__file__).parent
    (root / "TASK_CATALOG.md").write_text(render_catalog(), encoding="utf-8")
    (root / "V3_TO_V4_AUDIT.md").write_text(render_audit(), encoding="utf-8")
    print(root / "TASK_CATALOG.md")
    print(root / "V3_TO_V4_AUDIT.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
