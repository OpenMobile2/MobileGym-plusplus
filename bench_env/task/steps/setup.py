"""V2 setup adapters layered on the isolated v1 demo profiles."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bench_env.task.core.setup import apply_setup_profiles as apply_v1_profiles


def _utc_date(value: str) -> int:
    return int(datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp() * 1000)


DAYSMATTER_DATES = {
    "ht_dm_contract": _utc_date("2026-08-20"),
    "ht_dm_launch": _utc_date("2026-09-15"),
    "ht_dm_birthday": _utc_date("2026-11-08"),
}


async def apply_setup_profiles(env: Any, profiles: tuple[str, ...]) -> None:
    await apply_v1_profiles(env, profiles)
    if "daysmatter_work" not in profiles:
        return
    state = await env.get_state(required_apps=["daysmatter"])
    app = state.get("apps", {}).get("daysmatter", {})
    events = []
    for event in app.get("events") or []:
        target = DAYSMATTER_DATES.get(str(event.get("id")))
        events.append({**event, **({"targetDate": target} if target is not None else {})})
    await env.set_state({"apps": {"daysmatter": {"events": events}}}, deep=True, reload=False)

