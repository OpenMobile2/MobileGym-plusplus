"""CLI entrypoint for the fixed hybrid-tools benchmark."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path
import time

from bench_env.hybrid_agent.modes import HYBRID_MODE, INTERACTION_MODES
from bench_env.hybrid_benchmark.runner import HybridBenchmarkConfig, run_benchmark
from bench_env.task.registry import TaskRegistry


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a state-judged MobileGym hybrid-tools suite")
    parser.add_argument("--env-url")
    parser.add_argument("--model-base-url")
    parser.add_argument("--model-name")
    parser.add_argument("--model-api-key", default=None)
    parser.add_argument(
        "--model-extra-body-json",
        default=None,
        help="Optional JSON object forwarded as OpenAI-compatible extra_body",
    )
    parser.add_argument(
        "--interaction-mode",
        choices=INTERACTION_MODES,
        default=HYBRID_MODE,
        help="hybrid exposes foreground App Tools; gui_only exposes only mobile_use",
    )
    parser.add_argument("--suite", default="core")
    parser.add_argument("--task-ids", default="", help="Comma-separated full task IDs or class names")
    parser.add_argument("--task-ids-file", default=None, help="File containing one task ID per line")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--parallel", type=int, default=1)
    parser.add_argument("--max-steps", type=int, default=None)
    parser.add_argument("--max-tokens", type=int, default=8192)
    parser.add_argument("--temperature", type=float, default=0.1)
    parser.add_argument("--top-p", type=float, default=0.95)
    parser.add_argument("--infer-timeout", type=float, default=300.0)
    parser.add_argument("--delay-after-action", type=float, default=0.8)
    parser.add_argument("--coord-space", default="norm_0_1000")
    parser.add_argument("--browser-type", default="chromium")
    parser.add_argument("--browser-proxy", default=None)
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--stream", action="store_true")
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument(
        "--agent-protocol",
        choices=["xml", "venus", "gpt_responses", "kimi_k2_6"],
        default="xml",
        help="Model protocol: Qwen-style XML, Venus session, GPT Responses, or Kimi K2.6 JSON",
    )
    parser.add_argument(
        "--reasoning-effort",
        choices=["none", "low", "medium", "high", "xhigh"],
        default="medium",
        help="Reasoning effort for --agent-protocol gpt_responses",
    )
    parser.add_argument(
        "--kimi-thinking",
        choices=["enabled", "disabled"],
        default="enabled",
        help="Thinking mode for --agent-protocol kimi_k2_6",
    )
    parser.add_argument(
        "--kimi-history-images",
        type=int,
        default=3,
        help="Number of recent screenshots retained for Kimi K2.6",
    )
    parser.add_argument("--list", action="store_true", help="List fixed tasks without starting browsers or the model")
    parser.add_argument("--output-dir", type=Path, default=None)
    return parser


def _list_tasks(suite: str) -> int:
    registry = TaskRegistry()
    rows = []
    for name in registry.list_tasks(suite):
        task = registry.create_task(f"{suite}.{name}")
        rows.append({
            "task_id": task.id,
            "instruction": task.description,
            "apps": task.apps,
            "candidate_tools": task.candidate_tools,
            "gui_required": task.gui_required,
        })
    print(json.dumps(rows, ensure_ascii=False, indent=2))
    return 0


async def async_main(args: argparse.Namespace) -> int:
    missing = [
        name
        for name, value in (
            ("--env-url", args.env_url),
            ("--model-base-url", args.model_base_url),
            ("--model-name", args.model_name),
        )
        if not value
    ]
    if missing:
        raise SystemExit(f"required for execution: {', '.join(missing)}")
    output_dir = args.output_dir or Path("runs/core") / time.strftime("%Y%m%d-%H%M%S")
    api_key = args.model_api_key
    if api_key is None:
        api_key = os.environ.get("OPENAI_API_KEY", "")
    model_extra_body = None
    if args.model_extra_body_json:
        try:
            model_extra_body = json.loads(args.model_extra_body_json)
        except json.JSONDecodeError as error:
            raise SystemExit(f"invalid --model-extra-body-json: {error}") from error
        if not isinstance(model_extra_body, dict):
            raise SystemExit("--model-extra-body-json must decode to a JSON object")
    config = HybridBenchmarkConfig(
        env_url=args.env_url,
        model_base_url=args.model_base_url,
        model_name=args.model_name,
        model_api_key=api_key,
        model_extra_body=model_extra_body,
        interaction_mode=args.interaction_mode,
        suite=args.suite,
        task_ids=tuple(
            line.strip()
            for line in (
                Path(args.task_ids_file).read_text(encoding="utf-8").splitlines()
                if args.task_ids_file
                else args.task_ids.split(",")
            )
            if line.strip() and not line.lstrip().startswith("#")
        ),
        limit=args.limit,
        parallel=args.parallel,
        output_dir=output_dir,
        max_tokens=args.max_tokens,
        max_steps=args.max_steps,
        temperature=args.temperature,
        top_p=args.top_p,
        infer_timeout=args.infer_timeout,
        delay_after_action=args.delay_after_action,
        coord_space=args.coord_space,
        browser_type=args.browser_type,
        browser_proxy=args.browser_proxy,
        headless=args.headless,
        stream=args.stream,
        quiet=args.quiet,
        agent_protocol=args.agent_protocol,
        reasoning_effort=args.reasoning_effort,
        kimi_thinking=args.kimi_thinking == "enabled",
        kimi_history_images=args.kimi_history_images,
    )
    results = await run_benchmark(config)
    summary = json.loads((output_dir / "summary.json").read_text(encoding="utf-8"))
    print(
        f"[Hybrid benchmark] mode={summary['interaction_mode']} "
        f"SR={summary['sr']:.3f} ({summary['successful']}/{summary['total']}) "
        f"output={output_dir}"
    )
    return 0 if not any(row["error"] for row in results) else 2


def main() -> int:
    args = create_parser().parse_args()
    if args.list:
        return _list_tasks(args.suite)
    return asyncio.run(async_main(args))
