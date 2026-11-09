"""Merge a complete V3 run with audited partial reruns."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
from typing import Any

from bench_env.hybrid_benchmark.runner import _build_summary, _task_payload
from bench_env.task.registry import TaskRegistry


def _read_rows(run: Path) -> dict[str, dict[str, Any]]:
    rows: dict[str, dict[str, Any]] = {}
    for line in (run / "results.jsonl").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        rows[str(row["task_id"])] = row
    return rows


def merge_runs(base: Path, repairs: list[Path], output: Path, reason: str) -> None:
    if output.exists():
        raise FileExistsError(f"Output already exists: {output}")

    registry = TaskRegistry()
    tasks = [
        registry.create_task(f"drafts.{name}")
        for name in registry.list_tasks("drafts")
    ]
    payloads = {_task_payload(task)["task_id"]: _task_payload(task) for task in tasks}
    if len(payloads) != 80:
        raise ValueError(f"Expected 80 current V3 tasks, found {len(payloads)}")

    rows = _read_rows(base)
    if set(rows) != set(payloads):
        raise ValueError("Base run does not contain the complete current V3 task ID set")
    sources = {task_id: str(base) for task_id in rows}
    repair_rows: list[tuple[Path, dict[str, dict[str, Any]]]] = []
    for repair in repairs:
        selected = _read_rows(repair)
        unknown = set(selected) - set(payloads)
        if unknown:
            raise ValueError(f"Unknown task IDs in {repair}: {sorted(unknown)}")
        rows.update(selected)
        sources.update({task_id: str(repair) for task_id in selected})
        repair_rows.append((repair, selected))

    for task_id, row in rows.items():
        expected = payloads[task_id]
        if row.get("instruction") != expected["instruction"]:
            raise ValueError(
                f"Stale instruction for {task_id} from {sources[task_id]}: "
                f"{row.get('instruction')!r} != {expected['instruction']!r}"
            )

    shutil.copytree(base, output)
    for repair, selected in repair_rows:
        for task_id in selected:
            destination = output / "episodes" / task_id
            shutil.rmtree(destination)
            shutil.copytree(repair / "episodes" / task_id, destination)

    ordered = [rows[task_id] for task_id in sorted(rows)]
    for row in ordered:
        row["artifact_dir"] = str(output / "episodes" / row["task_id"])
    (output / "results.jsonl").write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in ordered),
        encoding="utf-8",
    )
    (output / "summary.json").write_text(
        json.dumps(_build_summary(ordered), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output / "tasks.json").write_text(
        json.dumps(list(payloads.values()), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    meta = json.loads((base / "meta.json").read_text(encoding="utf-8"))
    meta["output_dir"] = str(output)
    meta["merged_from_audited_reruns"] = True
    (output / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    provenance = {
        "base_run": str(base),
        "repair_runs_in_precedence_order": [str(path) for path in repairs],
        "reason": reason,
        "task_sources": dict(sorted(sources.items())),
    }
    (output / "repair_provenance.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--repair", type=Path, action="append", default=[])
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--reason", required=True)
    args = parser.parse_args()
    merge_runs(args.base, args.repair, args.output, args.reason)
    print(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
