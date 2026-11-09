"""Named scenario patches for demo / training diversity.

Uses existing env.set_state ↔ __SIM__.setState. Meeting docs called this
inject_state; no second API is required.

Usage:
    from bench_env.scenarios import load_scenario, apply_scenario
    await apply_scenario(env, "taobao/empty_cart")
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_SCENARIO_ROOT = Path(__file__).resolve().parent


def list_scenarios() -> list[str]:
    """Return scenario ids like 'kapi/empty_bills'."""
    ids: list[str] = []
    for path in sorted(_SCENARIO_ROOT.rglob("*.json")):
        rel = path.relative_to(_SCENARIO_ROOT).with_suffix("")
        ids.append(rel.as_posix())
    return ids


def load_scenario(scenario_id: str) -> dict[str, Any]:
    """Load a scenario JSON. `scenario_id` is e.g. 'kapi/empty_bills'."""
    path = _SCENARIO_ROOT / f"{scenario_id}.json"
    if not path.is_file():
        known = ", ".join(list_scenarios()) or "(none)"
        raise FileNotFoundError(f"scenario '{scenario_id}' not found; known: {known}")
    data = json.loads(path.read_text(encoding="utf-8"))
    # Strip authoring metadata before sending to __SIM__.setState
    return {k: v for k, v in data.items() if not k.startswith("_")}


async def apply_scenario(
    env: Any,
    scenario_id: str,
    *,
    deep: bool = True,
    reload: bool = False,
) -> dict[str, Any]:
    """Apply a named scenario via env.set_state. Returns the patch used."""
    patch = load_scenario(scenario_id)
    await env.set_state(patch, deep=deep, reload=reload)
    return patch
