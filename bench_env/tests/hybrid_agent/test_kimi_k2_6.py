from dataclasses import dataclass

import pytest

from bench_env.env.base import Observation
from bench_env.env.mobile_gym import MobileGymEnv
from bench_env.hybrid_agent.kimi_k2_6 import (
    KIMI_COORD_SPACE,
    KimiK26Agent,
    KimiK26AgentConfig,
    build_kimi_k2_6_system_prompt,
    kimi_k2_6_model_args,
    parse_kimi_k2_6_response,
)
from bench_env.hybrid_agent.mobile_use import to_mobilegym_action
from bench_env.hybrid_agent.types import StepFeedback
from bench_env.hybrid_agent.xml_protocol import ToolCallParseError
from bench_env.hybrid_benchmark.runner import HybridBenchmarkConfig, _create_agent


CALENDAR_OPEN_DATE = {
    "name": "calendar__open_date",
    "app": "calendar",
    "description": "Open Calendar on a date.",
    "inputSchema": {
        "type": "object",
        "properties": {"date": {"type": "string"}},
        "required": ["date"],
        "additionalProperties": False,
    },
    "annotations": {"uiEffect": "navigation"},
}


def test_kimi_click_is_normalized_and_reaches_expected_physical_pixel():
    parsed = parse_kimi_k2_6_response(
        """Thought: Open the visible app.
Action: {"action_type":"click","coordinate":[0.151,0.535]}""",
        {},
    )
    action = to_mobilegym_action(
        parsed.call.arguments,
        coord_space=KIMI_COORD_SPACE,
    )
    env = MobileGymEnv(
        url="http://example.invalid",
        coord_space=KIMI_COORD_SPACE,
        physical_size=(1080, 2400),
    )

    assert action.data == {"point": [0.151, 0.535]}
    x, y = env._parse_point(action.data["point"])
    assert x == pytest.approx(163.08)
    assert y == pytest.approx(1284.0)


@pytest.mark.parametrize(
    "coordinate",
    [[-0.01, 0.5], [0.5, 1.01], [151, 535]],
)
def test_kimi_rejects_coordinates_outside_zero_to_one(coordinate):
    with pytest.raises(ToolCallParseError, match="0-1 range"):
        parse_kimi_k2_6_response(
            "Thought: Tap.\nAction: "
            + '{"action_type":"click","coordinate":'
            + str(coordinate)
            + "}",
            {},
        )


def test_kimi_app_tool_call_uses_only_current_dynamic_schema():
    prompt, schemas = build_kimi_k2_6_system_prompt(
        [CALENDAR_OPEN_DATE], "calendar", "hybrid"
    )
    parsed = parse_kimi_k2_6_response(
        """<think>I should navigate with the app tool.</think>
Thought: Open the requested date.
Action: {"action_type":"app_tool","name":"calendar__open_date","arguments":{"date":"2026-07-14"}}""",
        schemas,
    )

    assert parsed.call.name == "calendar__open_date"
    assert parsed.call.arguments == {"date": "2026-07-14"}
    assert "inspect the next screenshot" in prompt.lower()
    assert "calendar__open_date" in prompt

    with pytest.raises(ToolCallParseError, match="not available"):
        parse_kimi_k2_6_response(
            """Thought: Call a stale tool.
Action: {"action_type":"app_tool","name":"notes__create_note","arguments":{}}""",
            schemas,
        )


def test_kimi_gui_only_prompt_excludes_app_tools():
    prompt, schemas = build_kimi_k2_6_system_prompt(
        [CALENDAR_OPEN_DATE], "calendar", "gui_only"
    )
    assert schemas == {}
    assert "App-provided business tools are disabled" in prompt
    assert "calendar__open_date" not in prompt


def test_kimi_accepts_mobileworld_scroll_alias_and_maps_direction():
    parsed = parse_kimi_k2_6_response(
        """Thought: Scroll down to inspect lower content.
Action: {"action_type":"scroll","direction":"down"}""",
        {},
    )
    assert parsed.call.arguments == {
        "action": "swipe",
        "coordinate": [0.5, 0.8],
        "coordinate2": [0.5, 0.2],
    }


def test_kimi_official_request_parameters_follow_thinking_mode():
    enabled = kimi_k2_6_model_args(max_tokens=8192, thinking_enabled=True)
    disabled = kimi_k2_6_model_args(max_tokens=4096, thinking_enabled=False)
    proxy_style = kimi_k2_6_model_args(
        max_tokens=4096,
        thinking_enabled=True,
        extra_body={"enable_thinking": True},
    )

    assert enabled["temperature"] == 1.0
    assert enabled["top_p"] == 0.95
    assert enabled["extra_body"]["thinking"] == {"type": "enabled"}
    assert disabled["temperature"] == 0.6
    assert disabled["extra_body"]["thinking"] == {"type": "disabled"}
    assert proxy_style["extra_body"] == {"enable_thinking": True}


@dataclass
class _ChatResult:
    content: str


class _FakeLlm:
    def __init__(self):
        self.messages = []
        self.args = []

    def chat(self, *, messages, args):
        self.messages.append(messages)
        self.args.append(args)
        return _ChatResult(
            'Thought: Inspect the screen.\nAction: '
            '{"action_type":"click","coordinate":[0.5,0.5]}'
        )


def test_kimi_history_keeps_only_three_recent_screenshots():
    llm = _FakeLlm()
    agent = KimiK26Agent(
        llm,
        KimiK26AgentConfig(
            model_args=kimi_k2_6_model_args(max_tokens=1024),
            verbose=False,
            history_n_images=3,
        ),
    )
    agent.reset("Inspect the launcher")
    feedback = None
    for step in range(1, 5):
        obs = Observation(
            screenshot_bytes=b"\xff\xd8" + bytes([step]),
            route={"app": "calendar"},
        )
        agent.act(obs, [], feedback, "calendar", "hybrid")
        feedback = StepFeedback(
            f"call_{step}", "mobile_use", True, {"action_type": "CLICK"}
        )

    final_messages = llm.messages[-1]
    image_parts = [
        part
        for message in final_messages
        if message["role"] == "user" and isinstance(message["content"], list)
        for part in message["content"]
        if part.get("type") == "image_url"
    ]
    omitted = [
        part
        for message in final_messages
        if message["role"] == "user" and isinstance(message["content"], list)
        for part in message["content"]
        if "omitted" in str(part.get("text") or "")
    ]
    assert len(image_parts) == 3
    assert len(omitted) == 1
    assert all(
        part["image_url"]["url"].startswith("data:image/jpeg;base64,")
        for part in image_parts
    )
    artifact_urls = [
        part["image_url"]["url"]
        for message in agent.last_messages
        if isinstance(message.get("content"), list)
        for part in message["content"]
        if part.get("type") == "image_url"
    ]
    assert artifact_urls[-1].startswith("data:image/jpeg;base64,")
    assert all(url.startswith("<Kimi historical screenshot") for url in artifact_urls[:-1])


def test_benchmark_factory_selects_isolated_kimi_protocol(monkeypatch):
    captured = {}

    class _Llm:
        def __init__(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setattr("bench_env.hybrid_benchmark.runner.LLMClient", _Llm)
    config = HybridBenchmarkConfig(
        env_url="http://127.0.0.1:4181",
        model_base_url="https://api.moonshot.cn/v1",
        model_name="kimi-k2.6",
        agent_protocol="kimi_k2_6",
        coord_space="norm_0_1",
        max_tokens=8192,
        kimi_thinking=True,
        kimi_history_images=3,
    )
    agent = _create_agent(config)

    assert isinstance(agent, KimiK26Agent)
    assert captured["model"] == "kimi-k2.6"
    assert agent.config.history_n_images == 3
    assert agent.config.model_args["temperature"] == 1.0
    assert agent.config.model_args["extra_body"]["thinking"] == {"type": "enabled"}

    with pytest.raises(ValueError, match="requires --coord-space norm_0_1"):
        _create_agent(
            HybridBenchmarkConfig(
                env_url="http://127.0.0.1:4181",
                model_base_url="https://api.moonshot.cn/v1",
                model_name="kimi-k2.6",
                agent_protocol="kimi_k2_6",
                coord_space="norm_0_1000",
            )
        )
