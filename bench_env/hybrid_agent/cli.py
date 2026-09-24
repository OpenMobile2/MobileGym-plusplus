"""Standalone CLI for exercising the GUI + App Tools runtime without a verifier."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import time
from pathlib import Path

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.agent import HybridAgentConfig, HybridXmlAgent
from bench_env.hybrid_agent.artifacts import HybridArtifactRecorder
from bench_env.hybrid_agent.kimi_k2_6 import (
    KIMI_COORD_SPACE,
    KIMI_K2_6_PROTOCOL,
    KimiK26Agent,
    KimiK26AgentConfig,
    kimi_k2_6_model_args,
)
from bench_env.hybrid_agent.modes import HYBRID_MODE, INTERACTION_MODES
from bench_env.hybrid_agent.runtime import HybridAgentRuntime
from bench_env.hybrid_agent.setups import setup_calendar_demo
from bench_env.llm import LLMClient


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a MobileGym GUI + App Tools agent")
    parser.add_argument("--instruction", required=True)
    parser.add_argument("--env-url", required=True)
    parser.add_argument("--model-base-url", required=True)
    parser.add_argument("--model-name", required=True)
    parser.add_argument("--model-api-key", default=None)
    parser.add_argument(
        "--interaction-mode",
        choices=INTERACTION_MODES,
        default=HYBRID_MODE,
        help="hybrid exposes foreground App Tools; gui_only exposes only mobile_use",
    )
    parser.add_argument("--max-steps", type=int, default=30)
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
        choices=["xml", KIMI_K2_6_PROTOCOL],
        default="xml",
        help="Model protocol: Qwen-style XML or Kimi K2.6 Thought/Action JSON",
    )
    parser.add_argument(
        "--kimi-thinking",
        choices=["enabled", "disabled"],
        default="enabled",
    )
    parser.add_argument("--kimi-history-images", type=int, default=3)
    parser.add_argument(
        "--calendar-demo-setup",
        action="store_true",
        help="Inject the deterministic Project Review Calendar event before the first agent turn",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Artifact directory; defaults to a timestamped directory under runs/hybrid_agent",
    )
    parser.add_argument(
        "--trace-output",
        type=Path,
        default=None,
        help="Optional additional path for a copy of trace.json",
    )
    return parser


async def async_main(args: argparse.Namespace) -> int:
    api_key = args.model_api_key
    if api_key is None:
        api_key = os.environ.get("OPENAI_API_KEY", "")
    llm = LLMClient(
        base_url=args.model_base_url,
        api_key=api_key,
        model=args.model_name,
        total_timeout_s=args.infer_timeout,
    )
    if args.agent_protocol == KIMI_K2_6_PROTOCOL:
        if args.coord_space != KIMI_COORD_SPACE:
            raise SystemExit(
                f"--agent-protocol {KIMI_K2_6_PROTOCOL} requires "
                f"--coord-space {KIMI_COORD_SPACE}"
            )
        agent = KimiK26Agent(
            llm,
            KimiK26AgentConfig(
                model_args=kimi_k2_6_model_args(
                    max_tokens=args.max_tokens,
                    thinking_enabled=args.kimi_thinking == "enabled",
                ),
                stream=args.stream,
                verbose=not args.quiet,
                history_n_images=args.kimi_history_images,
            ),
        )
    else:
        agent = HybridXmlAgent(
            llm,
            HybridAgentConfig(
                model_args={
                    "temperature": args.temperature,
                    "top_p": args.top_p,
                    "max_tokens": args.max_tokens,
                },
                stream=args.stream,
                verbose=not args.quiet,
                coord_space=args.coord_space,
                physical_size=(1080, 2400),
            ),
        )
    env = MobileGymEnv(
        url=args.env_url,
        headless=args.headless,
        browser_type=args.browser_type,
        proxy=args.browser_proxy,
        coord_space=args.coord_space,
        delay_after_action=args.delay_after_action,
        verbose=not args.quiet,
        viewport_size=(360, 800),
        physical_size=(1080, 2400),
        device_scale_factor=3,
    )

    await env.start()
    try:
        await env.reset(app_ids=[])
        output_dir = args.output_dir or (
            Path("runs/hybrid_agent") / time.strftime("%Y%m%d-%H%M%S")
        )
        recorder = HybridArtifactRecorder(output_dir)
        if args.calendar_demo_setup:
            event = await setup_calendar_demo(env)
            (output_dir / "setup.json").write_text(
                json.dumps(
                    {"name": "calendar_demo", "calendar_event": event},
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )
        runtime = HybridAgentRuntime(
            env,
            agent,
            recorder=recorder,
            interaction_mode=args.interaction_mode,
        )
        result = await runtime.run(args.instruction, max_steps=args.max_steps)
        if args.trace_output:
            args.trace_output.parent.mkdir(parents=True, exist_ok=True)
            args.trace_output.write_text(
                json.dumps(result.to_dict(), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        print(
            f"[Hybrid result] mode={result.interaction_mode}, "
            f"stop_reason={result.stop_reason}, "
            f"steps={len(result.trace)}, artifacts={output_dir}, "
            f"viewer={output_dir / 'index.html'}"
        )
        return 0
    finally:
        await env.close()


def main() -> int:
    return asyncio.run(async_main(create_parser().parse_args()))
