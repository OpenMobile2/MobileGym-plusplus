"""Replace infrastructure-error rows with valid single-task reruns."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
from typing import Any

from bench_env.hybrid_benchmark.runner import _build_summary


def _read_rows(run_dir: Path) -> dict[str, dict[str, Any]]:
    rows: dict[str, dict[str, Any]] = {}
    for line in (run_dir / "results.jsonl").read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            rows[str(row["task_id"])] = row
    return rows


def replace_from_rerun(base: Path, rerun: Path) -> list[str]:
    """Replace matching rows and episode artifacts in ``base`` in place."""

    base_rows = _read_rows(base)
    rerun_rows = _read_rows(rerun)
    if not rerun_rows:
        raise ValueError(f"No rerun results found in {rerun}")

    replaced: list[str] = []
    for task_id, rerun_row in rerun_rows.items():
        if task_id not in base_rows:
            raise ValueError(f"Rerun task is absent from base run: {task_id}")
        source_episode = rerun / "episodes" / task_id
        if not (source_episode / "trace.json").exists():
            raise ValueError(f"Rerun has no complete trace: {source_episode}")

        destination = base / "episodes" / task_id
        backup = base / "episodes" / f"{task_id}.infrastructure-error"
        if backup.exists():
            raise FileExistsError(f"Backup already exists: {backup}")
        destination.rename(backup)
        shutil.copytree(source_episode, destination)

        row = dict(rerun_row)
        row["artifact_dir"] = str(destination)
        base_rows[task_id] = row
        replaced.append(task_id)

    ordered = [base_rows[task_id] for task_id in sorted(base_rows)]
    (base / "results.jsonl").write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in ordered),
        encoding="utf-8",
    )
    mode = json.loads((base / "meta.json").read_text(encoding="utf-8")).get(
        "interaction_mode"
    )
    (base / "summary.json").write_text(
        json.dumps(_build_summary(ordered, mode), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    provenance_path = base / "repair_provenance.json"
    provenance = (
        json.loads(provenance_path.read_text(encoding="utf-8"))
        if provenance_path.exists()
        else {"repairs": []}
    )
    provenance["repairs"].append(
        {
            "source_run": str(rerun),
            "task_ids": replaced,
            "reason": "Replace an infrastructure-error row with a valid rerun.",
        }
    )
    provenance_path.write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return replaced


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--rerun", type=Path, required=True)
    args = parser.parse_args()
    print("\n".join(replace_from_rerun(args.base, args.rerun)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
