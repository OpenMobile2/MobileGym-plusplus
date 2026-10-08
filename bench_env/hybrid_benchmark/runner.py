"""Parallel, state-judged execution for the independent hybrid XML agent."""

from __future__ import annotations

import asyncio
from collections import Counter
from dataclasses import asdict, dataclass, replace
import json
from pathlib import Path
import time
from typing import Any

from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.agent import HybridAgentConfig, HybridXmlAgent
from bench_env.hybrid_agent.gpt_responses import (
    GptResponsesAgent,
    GptResponsesAgentConfig,
)
from bench_env.hybrid_agent.kimi_k2_6 import (
    KIMI_COORD_SPACE,
    KIMI_K2_6_PROTOCOL,
    KimiK26Agent,
    KimiK26AgentConfig,
    kimi_k2_6_model_args,
)
from bench_env.hybrid_agent.artifacts import HybridArtifactRecorder
from bench_env.hybrid_agent.modes import (
    HYBRID_MODE,
    HYBRID_XML_RUNTIME,
    QWEN35_SESSION_RUNTIME,
    QWEN35_THOUGHT_SESSION_RUNTIME,
    is_session_runtime,
    validate_interaction_mode,
    validate_runtime,
)
from bench_env.hybrid_agent.qwen35_session import Qwen35SessionAgent
from bench_env.hybrid_agent.runtime import HybridAgentRuntime
from bench_env.llm import LLMClient
from bench_env.task.judge import JudgeInput
from bench_env.task.registry import TaskRegistry


@dataclass(frozen=True)
class HybridBenchmarkConfig:
    env_url: str
    model_base_url: str
    model_name: str
    model_api_key: str = ""
    model_extra_body: dict[str, Any] | None = None
    interaction_mode: str = HYBRID_MODE
    suite: str = "core"
    task_ids: tuple[str, ...] = ()
    limit: int | None = None
    parallel: int = 1
    output_dir: Path = Path("runs/core")
    max_tokens: int = 8192
    max_steps: int | None = None
    temperature: float = 0.1
    top_p: float = 0.95
    infer_timeout: float = 300.0
    delay_after_action: float = 0.8
    coord_space: str = "norm_0_1000"
    browser_type: str = "chromium"
    browser_proxy: str | None = None
    headless: bool = False
    stream: bool = False
    quiet: bool = False
    agent_protocol: str = "xml"
    reasoning_effort: str = "medium"
    kimi_thinking: bool = True
    kimi_history_images: int = 3
    start_delay: float = 0.0
    runtime: str = QWEN35_SESSION_RUNTIME
    last_n: int = 3
    enable_thinking: bool = True
    require_think_tags: bool = False
    qwen35_tool_call_mode: str = "native"


def _split_suites(suite: str) -> list[str]:
    return [item.strip() for item in str(suite).split(",") if item.strip()]


def _load_tasks(config: HybridBenchmarkConfig) -> list[Any]:
    registry = TaskRegistry()
    tasks: list[Any] = []
    for suite in _split_suites(config.suite):
        names = registry.list_tasks(suite)
        tasks.extend(registry.create_task(f"{suite}.{name}") for name in names)
    if config.task_ids:
        wanted = set(config.task_ids)
        tasks = [task for task in tasks if task.id in wanted or task.name in wanted]
        missing = wanted - {task.id for task in tasks} - {task.name for task in tasks}
        if missing:
            raise ValueError(f"Unknown task ids: {sorted(missing)}")
    if config.limit is not None:
        tasks = tasks[: max(0, config.limit)]
    if not tasks:
        raise ValueError("No hybrid benchmark tasks selected")
    return tasks


def _jsonable_config(config: HybridBenchmarkConfig) -> dict[str, Any]:
    payload = asdict(config)
    payload["interaction_mode"] = validate_interaction_mode(config.interaction_mode)
    payload["output_dir"] = str(config.output_dir)
    payload["model_api_key"] = "<redacted>" if config.model_api_key else ""
    return payload


def _task_payload(task: Any) -> dict[str, Any]:
    spec = task.spec
    return {
        "task_id": task.id,
        "dataset_id": spec.task_id,
        "instruction": task.description,
        "apps": list(task.apps),
        "setup_profiles": list(spec.setup_profiles),
        "candidate_tools": list(spec.candidate_tools),
        "gui_required": bool(spec.gui_required),
        "tags": list(spec.tags),
        "difficulty": getattr(spec, "difficulty", getattr(task, "difficulty", None)),
        "scope": getattr(spec, "scope", getattr(task, "scope", None)),
        "composition": getattr(spec, "composition", getattr(task, "composition", None)),
        "source_task": getattr(spec, "source_task", None),
        "max_steps": task.max_steps,
    }


_FIXED_TIME_SUITES = {
    "additional",
    "clocked",
    "compose",
    "continued",
    "crossapp",
    "flow",
    "hybrid_demo_crossapp",
    "native",
    "prior",
    "services",
    "social",
    "workflows",
}


def _configured_env_url(config: HybridBenchmarkConfig) -> str:
    suites = _split_suites(config.suite)
    if not any(suite in _FIXED_TIME_SUITES for suite in suites):
        return config.env_url
    from bench_env.task.clocked.specs import SIMULATED_TIME
    from bench_env.task.clocked.time_control import simulated_time_bootstrap_url

    return simulated_time_bootstrap_url(config.env_url, SIMULATED_TIME)


def _create_env(config: HybridBenchmarkConfig, worker_id: int) -> MobileGymEnv:
    env = MobileGymEnv(
        url=_configured_env_url(config),
        headless=config.headless,
        browser_type=config.browser_type,
        proxy=config.browser_proxy,
        coord_space=config.coord_space,
        delay_after_action=config.delay_after_action,
        verbose=not config.quiet,
        viewport_size=(360, 800),
        physical_size=(1080, 2400),
        device_scale_factor=3,
    )
    env._log_prefix = f"[hybrid-worker-{worker_id}]"
    return env


def _create_agent(config: HybridBenchmarkConfig) -> Any:
    runtime = validate_runtime(config.runtime)
    if is_session_runtime(runtime):
        if config.agent_protocol not in {"xml", QWEN35_SESSION_RUNTIME, QWEN35_THOUGHT_SESSION_RUNTIME}:
            raise ValueError(
                f"--runtime {runtime} cannot be combined with "
                f"--agent-protocol {config.agent_protocol}"
            )
        llm = LLMClient(
            base_url=config.model_base_url,
            api_key=config.model_api_key,
            model=config.model_name,
            total_timeout_s=config.infer_timeout,
        )
        extra_body = dict(config.model_extra_body or {})
        thought = runtime == QWEN35_THOUGHT_SESSION_RUNTIME
        return Qwen35SessionAgent(
            llm,
            last_n=config.last_n,
            enable_thinking=False if thought else config.enable_thinking,
            require_think_tags=False if thought else config.require_think_tags,
            tool_call_mode="xml" if thought else config.qwen35_tool_call_mode,
            max_tokens=config.max_tokens,
            extra_body=extra_body,
            verbose=not config.quiet,
            interaction_mode=config.interaction_mode,
            model_name=config.model_name,
            reasoning_effort=config.reasoning_effort,
            thought_session=thought,
        )
    if config.runtime not in {"", HYBRID_XML_RUNTIME}:
        raise ValueError(f"unsupported runtime {config.runtime!r}")
    if config.agent_protocol == "venus":
        # Reuse the session-aware Venus adapter used by the SPA/OL runners.
        # Import lazily so the regular hybrid protocols do not require the
        # spabench adapter on their import path.
        from venus_adapter import VenusSessionAdapter

        llm = LLMClient(
            base_url=config.model_base_url,
            api_key=config.model_api_key,
            model=config.model_name,
            total_timeout_s=config.infer_timeout,
        )
        return VenusSessionAdapter(
            llm,
            physical_size=(1080, 2400),
            verbose=not config.quiet,
            last_n=3,
        )
    if config.agent_protocol == "gpt_responses":
        if config.coord_space != "physical":
            raise ValueError("gpt_responses requires --coord-space physical")
        return GptResponsesAgent(
            GptResponsesAgentConfig(
                base_url=config.model_base_url,
                api_key=config.model_api_key,
                model=config.model_name,
                max_output_tokens=config.max_tokens,
                reasoning_effort=config.reasoning_effort,
                timeout_s=config.infer_timeout,
                verbose=not config.quiet,
            )
        )
    if config.agent_protocol == KIMI_K2_6_PROTOCOL:
        if config.coord_space != KIMI_COORD_SPACE:
            raise ValueError(
                f"{KIMI_K2_6_PROTOCOL} requires --coord-space {KIMI_COORD_SPACE}"
            )
        llm = LLMClient(
            base_url=config.model_base_url,
            api_key=config.model_api_key,
            model=config.model_name,
            total_timeout_s=config.infer_timeout,
        )
        return KimiK26Agent(
            llm,
            KimiK26AgentConfig(
                model_args=kimi_k2_6_model_args(
                    max_tokens=config.max_tokens,
                    thinking_enabled=config.kimi_thinking,
                    extra_body=config.model_extra_body,
                ),
                stream=config.stream,
                verbose=not config.quiet,
                history_n_images=config.kimi_history_images,
            ),
        )
    if config.agent_protocol != "xml":
        raise ValueError(f"unsupported agent protocol: {config.agent_protocol}")
    llm = LLMClient(
        base_url=config.model_base_url,
        api_key=config.model_api_key,
        model=config.model_name,
        total_timeout_s=config.infer_timeout,
    )
    model_args: dict[str, Any] = {
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
    }
    # Anthropic-compatible gateways reject requests that set both sampling controls.
    if not config.model_name.casefold().startswith("claude"):
        model_args["top_p"] = config.top_p
    if config.model_extra_body is not None:
        model_args["extra_body"] = config.model_extra_body

    return HybridXmlAgent(
        llm,
        HybridAgentConfig(
            model_args=model_args,
            stream=config.stream,
            verbose=not config.quiet,
            coord_space=config.coord_space,
            physical_size=(1080, 2400),
        ),
    )


async def _run_one(
    env: MobileGymEnv,
    agent: Any,
    task: Any,
    config: HybridBenchmarkConfig,
    worker_id: int,
) -> dict[str, Any]:
    started = time.time()
    episode_dir = config.output_dir / "episodes" / task.id
    episode_dir.mkdir(parents=True, exist_ok=True)
    (episode_dir / "task.json").write_text(
        json.dumps(_task_payload(task), ensure_ascii=False, indent=2), encoding="utf-8"
    )
    initial_obs = None
    try:
        initial_obs = await task.setup(env)
        recorder = HybridArtifactRecorder(episode_dir)
        if config.start_delay > 0:
            await asyncio.sleep(config.start_delay)
        runtime = HybridAgentRuntime(
            env,
            agent,
            recorder=recorder,
            interaction_mode=config.interaction_mode,
        )
        max_steps = config.max_steps or task.max_steps or 45
        run_result = await runtime.run(
            task.description,
            max_steps=max_steps,
            initial_observation=initial_obs,
        )
        final_obs = await env.get_observation()
        final_state = await env.get_state(required_apps=list(task.apps))
        final_obs = replace(final_obs, state=final_state)
        judge = task.evaluate(
            JudgeInput(
                init_obs=initial_obs,
                last_obs=final_obs,
                answer=run_result.agent_answer,
            )
        )
        calls = [
            record.call.name
            for record in run_result.trace
            if record.call is not None
        ]
        return {
            **_task_payload(task),
            "worker_id": worker_id,
            "interaction_mode": config.interaction_mode,
            "success": judge.success,
            "clean": judge.clean,
            "progress": judge.progress,
            "issues": judge.issues,
            "warnings": judge.warnings,
            "judge_error": judge.judge_error,
            "stop_reason": run_result.stop_reason,
            "steps": len(run_result.trace),
            "agent_answer": run_result.agent_answer,
            "agent_message": run_result.agent_message,
            "tool_calls": calls,
            "app_tool_calls": [name for name in calls if name != "mobile_use"],
            "runtime_s": time.time() - started,
            "artifact_dir": str(episode_dir),
            "error": None,
        }
    except Exception as error:
        return {
            **_task_payload(task),
            "worker_id": worker_id,
            "interaction_mode": config.interaction_mode,
            "success": False,
            "clean": True,
            "progress": 0.0,
            "issues": [],
            "warnings": [],
            "judge_error": None,
            "stop_reason": "ERROR",
            "steps": 0,
            "agent_answer": None,
            "agent_message": None,
            "tool_calls": [],
            "app_tool_calls": [],
            "runtime_s": time.time() - started,
            "artifact_dir": str(episode_dir),
            "error": f"{type(error).__name__}: {error}",
        }
    finally:
        try:
            task.teardown(env)
        except Exception:
            pass


def _build_summary(
    results: list[dict[str, Any]],
    interaction_mode: str | None = None,
) -> dict[str, Any]:
    successes = sum(bool(row["success"]) for row in results)
    tools = Counter(name for row in results for name in row["app_tool_calls"])
    summary = {
        "total": len(results),
        "successful": successes,
        "sr": successes / len(results) if results else 0.0,
        "errors": sum(bool(row["error"]) for row in results),
        "clean": sum(bool(row["clean"]) for row in results),
        "stop_reasons": dict(Counter(str(row["stop_reason"]) for row in results)),
        "app_tool_calls": sum(tools.values()),
        "distinct_app_tools_used": len(tools),
        "tool_usage": dict(sorted(tools.items())),
    }
    if interaction_mode is not None:
        summary["interaction_mode"] = validate_interaction_mode(interaction_mode)
    return summary


def _write_results(config: HybridBenchmarkConfig, tasks: list[Any], results: list[dict[str, Any]]) -> None:
    ordered = sorted(results, key=lambda row: row["task_id"])
    (config.output_dir / "results.jsonl").write_text(
        "".join(
            json.dumps(row, ensure_ascii=False, default=str) + "\n"
            for row in ordered
        ),
        encoding="utf-8",
    )
    (config.output_dir / "summary.json").write_text(
        json.dumps(
            _build_summary(ordered, getattr(config, "interaction_mode", None)),
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (config.output_dir / "tasks.json").write_text(
        json.dumps([_task_payload(task) for task in tasks], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


async def run_benchmark(config: HybridBenchmarkConfig) -> list[dict[str, Any]]:
    config = replace(
        config,
        interaction_mode=validate_interaction_mode(config.interaction_mode),
    )
    tasks = _load_tasks(config)
    config.output_dir.mkdir(parents=True, exist_ok=True)
    (config.output_dir / "meta.json").write_text(
        json.dumps(_jsonable_config(config), ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (config.output_dir / "tasks.json").write_text(
        json.dumps([_task_payload(task) for task in tasks], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    queue: asyncio.Queue[Any] = asyncio.Queue()
    for task in tasks:
        queue.put_nowait(task)
    results: list[dict[str, Any]] = []
    lock = asyncio.Lock()

    async def worker(worker_id: int) -> None:
        env = _create_env(config, worker_id)
        agent = _create_agent(config)
        await env.start()
        try:
            while True:
                try:
                    task = queue.get_nowait()
                except asyncio.QueueEmpty:
                    break
                row = await _run_one(env, agent, task, config, worker_id)
                async with lock:
                    results.append(row)
                    _write_results(config, tasks, results)
                    if not config.quiet:
                        status = "PASS" if row["success"] else "FAIL"
                        print(
                            f"[{len(results)}/{len(tasks)}] {status} {task.id} "
                            f"steps={row['steps']} stop={row['stop_reason']}"
                        )
                queue.task_done()
        finally:
            await env.close()

    workers = min(max(1, config.parallel), len(tasks))
    await asyncio.gather(*(worker(index + 1) for index in range(workers)))
    _write_results(config, tasks, results)
    return sorted(results, key=lambda row: row["task_id"])
