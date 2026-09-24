#!/usr/bin/env python3
"""Overnight coverage runner for Apps owned by the replication project.

The runner deliberately reports two different layers:
1. every ``docs/*-replication`` App gets an actual browser launch check;
2. Apps with registered state-judged tasks get full GUI-agent episodes.

Credentials are read from MODEL_* environment variables and are never written
to the manifest or child command line.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import subprocess
import sys
import time


SCRIPT_ROOT = Path(__file__).resolve().parents[4]
INVENTORY_ROOT = Path(os.environ.get("MOBILEGYM_REPO_ROOT", SCRIPT_ROOT)).resolve()
MOBILEGYM = SCRIPT_ROOT / "trial_apps" / "mobilegym"
DOCS = INVENTORY_ROOT / "docs"


def selfbuilt_apps() -> list[str]:
    suffix = "-replication"
    aliases = {"elema": "tbsg"}  # 饿了么复刻已以“淘宝闪购”App ID 交付
    return sorted({
        aliases.get(p.name[: -len(suffix)], p.name[: -len(suffix)])
        for p in DOCS.glob(f"*{suffix}") if p.is_dir()
    })


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


async def launch_checks(env_url: str, apps: list[str], output: Path) -> list[dict[str, object]]:
    from playwright.async_api import async_playwright

    screenshots = output / "launch_screenshots"
    screenshots.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, object]] = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1080, "height": 2400})
        page_errors: list[str] = []
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        await page.goto(env_url, wait_until="domcontentloaded")
        await page.wait_for_function("window.__OS__ && window.__SIM__", timeout=30_000)
        for app_id in apps:
            started = time.monotonic()
            before = len(page_errors)
            error = None
            try:
                opened = await page.evaluate(
                    """appId => {
                      try { window.__OS__.openApp(appId); return true; }
                      catch (error) { return String(error); }
                    }""",
                    app_id,
                )
                await page.wait_for_timeout(1200)
                if opened is not True:
                    error = str(opened)
                active_app = await page.evaluate("window.__OS__.getState().activeAppId || null")
                if active_app != app_id:
                    error = f"foreground mismatch: expected={app_id}, actual={active_app}"
                await page.screenshot(path=str(screenshots / f"{app_id}.png"))
            except Exception as exc:  # keep the rest of the overnight matrix running
                error = f"{type(exc).__name__}: {exc}"
            new_page_errors = page_errors[before:]
            rows.append({
                "app": app_id,
                "opened": error is None and not new_page_errors,
                "error": error,
                "page_errors": new_page_errors,
                "seconds": round(time.monotonic() - started, 2),
            })
            write_json(output / "launch_status.json", rows)
        await browser.close()
    return rows


def task_inventory(apps: set[str]) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    from bench_env.task.registry import TaskRegistry

    registry = TaskRegistry()
    suites: dict[str, list[str]] = {}
    by_app = {app: [] for app in sorted(apps)}
    for suite in registry._all_suites:  # discovery is the registry's canonical suite list
        # Hybrid suites have a different task/spec protocol and are evaluated
        # separately by bench_env.hybrid_benchmark. This runner is GUI-only
        # environment evaluation and must not feed them to bench_env.run.
        if suite in {"workflows", "services", "native", "crossapp", "core", "tasklib", "prior", "clocked", "drafts", "steps"}:
            continue
        try:
            names = registry.list_tasks(suite)
        except Exception:
            continue
        selected: list[str] = []
        for name in names:
            try:
                task = registry.create_task(f"{suite}.{name}")
            except Exception:
                continue
            touched = sorted(set(task.apps) & apps)
            if not touched:
                continue
            full_id = task.id
            selected.append(full_id)
            for app in touched:
                by_app[app].append(full_id)
        if selected:
            suites[suite] = selected
    return suites, by_app


def run_suites(args: argparse.Namespace, suites: dict[str, list[str]], output: Path) -> list[dict[str, object]]:
    required = ["MODEL_BASE_URL", "MODEL_API_KEY", "MODEL_NAME"]
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise SystemExit("missing environment variables: " + ", ".join(missing))
    child_env = os.environ.copy()
    for key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        child_env.pop(key, None)
    child_env["NO_PROXY"] = "127.0.0.1,localhost"
    child_env["OPENAI_API_KEY"] = os.environ["MODEL_API_KEY"]

    rows: list[dict[str, object]] = []
    for suite, task_ids in suites.items():
        suite_output = output / "episodes" / suite
        completed_markers = list(suite_output.glob("*/summary.json"))
        if completed_markers:
            rows.append({"suite": suite, "task_count": len(task_ids), "status": "already_complete",
                         "output": str(suite_output)})
            write_json(output / "batch_status.json", rows)
            continue
        command = [
            sys.executable, "-m", "bench_env.run",
            "--task-ids", ",".join(task_ids),
            "--agent", "gelab",
            "--env-url", args.env_url,
            "--model-base-url", os.environ["MODEL_BASE_URL"],
            "--model-name", os.environ["MODEL_NAME"],
            "--parallel", str(args.parallel),
            "--headless", "--max-tokens", str(args.max_tokens),
            "--runs-dir", str(suite_output),
        ]
        started = datetime.now().isoformat(timespec="seconds")
        log_path = output / f"{suite}.log"
        completed = None
        for attempt in range(1, args.retries + 2):
            heartbeat = {"suite": suite, "attempt": attempt, "status": "running",
                         "updated_at": datetime.now().isoformat(timespec="seconds")}
            write_json(output / "heartbeat.json", heartbeat)
            with log_path.open("a", encoding="utf-8") as log:
                log.write(f"\n=== attempt {attempt} {heartbeat['updated_at']} ===\n")
                completed = subprocess.run(command, cwd=MOBILEGYM, env=child_env, stdout=log, stderr=subprocess.STDOUT)
            if completed.returncode == 0:
                break
            time.sleep(min(30 * attempt, 120))
        assert completed is not None
        row = {"suite": suite, "task_count": len(task_ids), "started_at": started,
               "finished_at": datetime.now().isoformat(timespec="seconds"), "exit_code": completed.returncode,
               "attempts": attempt, "status": "complete" if completed.returncode == 0 else "failed",
               "output": str(suite_output.relative_to(MOBILEGYM)) if suite_output.is_relative_to(MOBILEGYM) else str(suite_output)}
        rows.append(row)
        write_json(output / "batch_status.json", rows)
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-url", default="http://127.0.0.1:4182")
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--parallel", type=int, default=2)
    parser.add_argument("--max-tokens", type=int, default=8192)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--launch-only", action="store_true")
    args = parser.parse_args()
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output = args.output_dir or MOBILEGYM / "runs" / "selfbuilt-overnight" / stamp
    output.mkdir(parents=True, exist_ok=True)
    apps = selfbuilt_apps()
    sys.path.insert(0, str(MOBILEGYM))
    suites, by_app = task_inventory(set(apps))
    manifest = {
        "started_at": datetime.now().isoformat(timespec="seconds"),
        "env_url": args.env_url,
        "selfbuilt_apps": apps,
        "app_count": len(apps),
        "registered_tasks_by_app": by_app,
        "apps_without_registered_tasks": [app for app, tasks in by_app.items() if not tasks],
        "suites": suites,
        "reporting_note": "launch checks and state-judged GUI success rates are separate denominators",
    }
    write_json(output / "manifest.json", manifest)
    launch_rows = asyncio.run(launch_checks(args.env_url, apps, output))
    if not args.launch_only:
        run_suites(args, suites, output)
    manifest["finished_at"] = datetime.now().isoformat(timespec="seconds")
    manifest["launch_passed"] = sum(bool(row["opened"]) for row in launch_rows)
    write_json(output / "manifest.json", manifest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
