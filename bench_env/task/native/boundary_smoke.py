"""Focused real-browser regression probes for V6 environment fixes."""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.task.native.specs import SIMULATED_TIME
from bench_env.task.clocked.time_control import simulated_time_bootstrap_url
from bench_env.task.registry import TaskRegistry


async def _open_route(env: MobileGymEnv, app_id: str, route: str) -> None:
    await env.page.evaluate(
        "([appId, path]) => window.__OS__.openApp(appId, path)",
        [app_id, route],
    )
    await env.page.wait_for_timeout(300)


async def _select_bill_month(
    env: MobileGymEnv,
    *,
    open_label: str,
    year_scroll_top: int,
    month_scroll_top: int,
    expected_month_key: str,
) -> None:
    await env.page.get_by_role("button", name=open_label, exact=True).first.click()
    confirm = env.page.get_by_role("button", name="确定", exact=True).last
    await confirm.wait_for(state="visible")
    modal = confirm.locator("xpath=ancestor::div[contains(@class, 'fixed')][1]")
    wheels = modal.locator(".w-24.overflow-y-auto.no-scrollbar")
    wheel_count = await wheels.count()
    assert wheel_count == 2, {
        "wheel_count": wheel_count,
        "modal_text": (await modal.inner_text())[:500],
        "modal_html": (await modal.inner_html())[:1000],
    }
    await wheels.nth(0).evaluate(
        "(node, top) => { node.scrollTop = top; node.dispatchEvent(new Event('scroll')); }",
        year_scroll_top,
    )
    await wheels.nth(1).evaluate(
        "(node, top) => { node.scrollTop = top; node.dispatchEvent(new Event('scroll')); }",
        month_scroll_top,
    )
    await env.page.wait_for_timeout(200)
    await confirm.click()
    await env.page.wait_for_timeout(200)
    assert await env.page.locator(
        f'[data-month-key="{expected_month_key}"]'
    ).count() == 1


async def run(env_url: str, *, headless: bool) -> dict:
    registry = TaskRegistry()
    env = MobileGymEnv(
        url=simulated_time_bootstrap_url(env_url, SIMULATED_TIME),
        headless=headless,
        coord_space="norm_0_1000",
        delay_after_action=0.05,
        verbose=False,
        viewport_size=(360, 800),
        physical_size=(1080, 2400),
        device_scale_factor=3,
    )
    report = {}
    await env.start()
    try:
        weather_task = registry.create_task("native.HTV6Case36")
        await weather_task.setup(env)
        await env.open_app("weather", wait_stable=True)
        await env.page.get_by_label("城市管理").click()
        await env.page.get_by_label("搜索位置").click()
        search = env.page.locator("#act_find_city_key")
        await search.fill("南京")
        result = env.page.get_by_role("button").filter(has_text="南京").first
        await result.click()
        add = env.page.get_by_role("button", name="添加", exact=True)
        await add.wait_for(state="visible")
        await add.click()
        await env.page.wait_for_timeout(400)

        state = await env.get_state(required_apps=["weather"])
        weather = state["apps"]["weather"]
        assert weather["selectedCityId"] == "nanjing"
        assert any(city["id"] == "nanjing" for city in weather["savedCities"])
        assert weather["bundlesByCityId"]["nanjing"]["bundle"]["now"]["temp"] == "18"
        body = await env.page.locator("body").inner_text()
        assert "南京" in body and "18" in body and "--°" not in body

        await env.page.get_by_label("城市管理").click()
        manager_body = await env.page.locator("body").inner_text()
        assert "南京" in manager_body and "--°" not in manager_body
        report["case36_weather_gui"] = {
            "gui_add_succeeded": True,
            "selected_city": weather["selectedCityId"],
            "bundle_temperature": weather["bundlesByCityId"]["nanjing"]["bundle"]["now"]["temp"],
            "manager_card_rendered": True,
        }

        alipay_task = registry.create_task("native.HTV6Case08")
        await alipay_task.setup(env)
        await _open_route(env, "alipay", "/bill")
        await _select_bill_month(
            env,
            open_label="7月",
            year_scroll_top=72,
            month_scroll_top=0,
            expected_month_key="2026-01",
        )
        await _select_bill_month(
            env,
            open_label="1月",
            year_scroll_top=36,
            month_scroll_top=396,
            expected_month_key="2025-12",
        )
        report["case08_alipay_wheel"] = {
            "2026_01_confirmed": True,
            "2025_12_confirmed": True,
            "stale_selection_rollback": False,
        }
    finally:
        await env.close()
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-url", default="http://127.0.0.1:4181")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()
    report = asyncio.run(run(args.env_url, headless=args.headless))
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
