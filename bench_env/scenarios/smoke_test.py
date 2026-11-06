"""Smoke-test named scenarios against a live MobileGymEnv.

Proves: apply_scenario → getState reflects patch (delivery multi-data path).

Requires simulator already running (default http://localhost:3000):

    npm run dev   # in trial_apps/mobilegym (vite port 3000)
    python -m bench_env.scenarios.smoke_test --sim-url http://localhost:3000
    python -m bench_env.scenarios.smoke_test --scenario kapi/empty_bills
"""

from __future__ import annotations

import argparse
import asyncio
import sys


async def _run(scenario_id: str, sim_url: str) -> int:
    from bench_env.env.mobile_gym import MobileGymEnv
    from bench_env.scenarios import apply_scenario, load_scenario

    patch = load_scenario(scenario_id)
    apps = list((patch.get("apps") or {}).keys())
    if not apps:
        print(f"FAIL: scenario {scenario_id} has no apps.* patch", file=sys.stderr)
        return 2
    app_id = apps[0]

    env = MobileGymEnv(
        url=sim_url,
        headless=True,
        verbose=True,
        viewport_size=(360, 800),
        physical_size=(1080, 2400),
        device_scale_factor=3,
        delay_after_action=0.3,
    )
    try:
        await env.start()
        await env.reset(app_ids=apps)
        await env.open_app(app_id, wait_stable=True)

        before = await env.get_state(required_apps=apps)
        app_before = (before.get("apps") or {}).get(app_id) or {}

        await apply_scenario(env, scenario_id)
        await asyncio.sleep(0.3)

        after = await env.get_state(required_apps=apps)
        app_after = (after.get("apps") or {}).get(app_id) or {}

        expected = patch["apps"][app_id]
        ok = True
        for key, want in expected.items():
            got = app_after.get(key)
            if got != want:
                print(f"FAIL: apps.{app_id}.{key}: want={want!r} got={got!r}")
                ok = False
            else:
                print(f"OK:   apps.{app_id}.{key} matched injected value")
                prev = app_before.get(key)
                if prev == want:
                    print("NOTE: before was already equal (less dramatic demo)")
                else:
                    prev_desc = (
                        f"len={len(prev)}" if hasattr(prev, "__len__") else repr(prev)
                    )
                    print(f"DIFF: before.{key} was {type(prev).__name__} {prev_desc}")

        if ok:
            print(f"PASS scenario={scenario_id}")
            return 0
        print(f"FAIL scenario={scenario_id}")
        return 1
    finally:
        await env.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", default="taobao/empty_cart")
    parser.add_argument("--sim-url", default="http://localhost:3000")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(_run(args.scenario, args.sim_url)))


if __name__ == "__main__":
    main()
