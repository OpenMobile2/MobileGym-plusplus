import asyncio
import json

from bench_env.env.base import ActionType, Observation, StepResult
from bench_env.hybrid_agent.artifacts import HybridArtifactRecorder
from bench_env.hybrid_agent.modes import (
    QWEN35_SESSION_RUNTIME,
    QWEN35_THOUGHT_SESSION_RUNTIME,
)
from bench_env.hybrid_agent.qwen35_session import (
    COLLAPSED_SCREENSHOT_TEXT,
    GEMINI_SESSION_SYSTEM_PROMPT,
    GLM_HYBRID_SESSION_ADDENDUM,
    GLM_SESSION_SYSTEM_PROMPT,
    HYBRID_SESSION_ADDENDUM,
    KIMI_K3_SESSION_SYSTEM_PROMPT,
    QWEN35_SESSION_SYSTEM_PROMPT_NATIVE,
    QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT,
    QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT_HYBRID,
    Qwen35SessionAgent,
    format_app_switch_user_text,
    normalize_thought_session_content,
    parse_session_tool_call,
    session_family,
    session_tools_with_app_tools,
    stable_session_tools,
    transform_mobile_use,
)
from bench_env.hybrid_agent.runtime import HybridAgentRuntime
from bench_env.hybrid_benchmark.cli import create_parser
from bench_env.hybrid_benchmark.runner import HybridBenchmarkConfig, _create_agent
from bench_env.llm import ChatResult


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


def _native(name: str, arguments: dict, call_id: str = "c1") -> ChatResult:
    return ChatResult(
        content="",
        raw={
            "choices": [
                {
                    "message": {
                        "content": None,
                        "tool_calls": [
                            {
                                "id": call_id,
                                "type": "function",
                                "function": {
                                    "name": name,
                                    "arguments": json.dumps(arguments),
                                },
                            }
                        ],
                    }
                }
            ]
        },
    )


class _SessionLlm:
    def __init__(self, responses):
        self.messages = []
        self.args = []
        self.responses = iter(responses)

    def chat(self, *, messages, args):
        self.messages.append(messages)
        self.args.append(args)
        return next(self.responses)


class _FakePage:
    def __init__(self, env):
        self.env = env
        self.calls = []

    async def evaluate(self, script, argument=None):
        if "resolveForegroundApp" in script:
            return str(self.env.route.get("app") or "")
        if "systemSurfaceVisible" in script:
            app = str(self.env.route.get("app") or "")
            return {
                "app": app,
                "tools": [CALENDAR_OPEN_DATE] if app == "calendar" else [],
            }
        if "callTool" in script:
            self.calls.append(argument)
            self.env.route = {"app": "calendar", "path": "/?date=2026-07-14&view=month"}
            return {
                "callId": "tool_call_1",
                "name": argument["name"],
                "ok": True,
                "output": {"date": "2026-07-14"},
            }
        raise AssertionError(script)


class _FakeEnv:
    def __init__(self):
        self.route = {}
        self.page = _FakePage(self)
        self.agent_answer = None
        self.agent_message = None

    async def get_observation(self):
        return Observation(screenshot_bytes=b"\xff\xd8fake", route=dict(self.route))

    async def step(self, action):
        done = False
        info = {}
        if action.action_type == ActionType.AWAKE:
            self.route = {"app": "calendar", "path": "/"}
        elif action.action_type == ActionType.COMPLETE:
            done = True
            self.agent_message = action.data.get("return", "")
            info = {"stop_reason": ActionType.COMPLETE, "message": self.agent_message}
        return StepResult(await self.get_observation(), done=done, info=info)


def test_parse_xml_and_click_transform():
    parsed = parse_session_tool_call(
        "<tool_call><function=mobile_use>"
        "<parameter=action>click</parameter>"
        "<parameter=coordinate>[163, 718]</parameter>"
        "</function></tool_call>"
    )
    assert parsed["name"] == "mobile_use"
    action = transform_mobile_use("click", parsed["arguments"], 1080, 2400)
    assert action["action_type"] == "click"
    assert round(action["x"]) == round(163 / 1000 * 1080)


def test_app_switch_user_text_lists_foreground_tools():
    text = format_app_switch_user_text("calendar", [CALENDAR_OPEN_DATE])
    assert "calendar__open_date" in text
    inner = text.split("<tools>")[1].split("</tools>")[0].strip()
    dumped = json.loads(inner)
    assert dumped["function"]["name"] == "calendar__open_date"
    api_text = format_app_switch_user_text(
        "calendar", [CALENDAR_OPEN_DATE], expose_in_api=True
    )
    assert "`calendar__open_date`" in api_text
    assert "<tools>" not in api_text
    assert "native function" in api_text


def test_session_tools_with_app_tools_keeps_mobile_use_first():
    tools = session_tools_with_app_tools([CALENDAR_OPEN_DATE])
    assert [row["function"]["name"] for row in tools] == [
        "mobile_use",
        "calendar__open_date",
    ]


def test_stable_tools_are_only_mobile_use():
    tools = stable_session_tools()
    assert [row["function"]["name"] for row in tools] == ["mobile_use"]
    assert "open_app" in tools[0]["function"]["parameters"]["properties"]["action"]["enum"]


def test_session_agent_keeps_system_once_and_collapses_old_images():
    llm = _SessionLlm(
        [
            _native("mobile_use", {"action": "click", "coordinate": [10, 10]}, "c1"),
            _native("mobile_use", {"action": "click", "coordinate": [20, 20]}, "c2"),
            _native("mobile_use", {"action": "terminate", "status": "success"}, "c3"),
        ]
    )
    agent = Qwen35SessionAgent(llm, last_n=1, verbose=False, interaction_mode="gui_only")
    obs = Observation(screenshot_bytes=b"\xff\xd8fake", route={})
    agent.set_turn_tools(stable_session_tools())
    agent.step("tap something", obs)
    agent.step("tap something", obs)
    third = agent.step("tap something", obs)
    assert llm.messages[0][0]["role"] == "system"
    system_text = llm.messages[0][0]["content"][0]["text"]
    assert "Use the mobile_use tool" in system_text
    assert llm.messages[1][0]["content"][0]["text"] == system_text
    assert llm.messages[0][1]["role"] == "user"
    assert "The user query:" in llm.messages[0][1]["content"][0]["text"]
    collapsed = json.dumps(llm.messages[2], ensure_ascii=False)
    assert COLLAPSED_SCREENSHOT_TEXT in collapsed
    assert llm.messages[2][-1]["role"] == "tool"
    assert all(args.get("tools")[0]["function"]["name"] == "mobile_use" for args in llm.args)
    assert third.done is True


def test_session_runtime_hybrid_injects_app_tools_on_switch_not_in_tools_param():
    async def scenario():
        env = _FakeEnv()
        llm = _SessionLlm(
            [
                _native("mobile_use", {"action": "open_app", "text": "calendar"}, "c1"),
                _native("calendar__open_date", {"date": "2026-07-14"}, "c2"),
                _native("mobile_use", {"action": "terminate", "status": "success"}, "c3"),
            ]
        )
        agent = Qwen35SessionAgent(llm, last_n=3, verbose=False, interaction_mode="hybrid")
        result = await HybridAgentRuntime(env, agent, interaction_mode="hybrid").run(
            "Open July 14", max_steps=5
        )
        return env, llm, result, agent

    env, llm, result, agent = asyncio.run(scenario())
    assert "COMPLETE" in str(result.stop_reason)
    assert env.page.calls == [
        {"name": "calendar__open_date", "arguments": {"date": "2026-07-14"}}
    ]
    second = llm.messages[1]
    observation_texts = [
        part.get("text", "")
        for msg in second
        if msg["role"] in {"user", "tool"}
        for part in (msg["content"] if isinstance(msg["content"], list) else [])
        if isinstance(part, dict)
    ]
    assert any("calendar__open_date" in text for text in observation_texts)
    roles = [msg["role"] for msg in second]
    assert all(left != right for left, right in zip(roles, roles[1:]))
    assert HYBRID_SESSION_ADDENDUM.strip() in agent._system_prompt
    assert all(len(args["tools"]) == 1 for args in llm.args)


def test_gui_only_session_does_not_execute_app_tools():
    async def scenario():
        env = _FakeEnv()
        llm = _SessionLlm(
            [
                _native("mobile_use", {"action": "open_app", "text": "calendar"}, "c1"),
                _native("calendar__open_date", {"date": "2026-07-14"}, "c2"),
            ]
        )
        agent = Qwen35SessionAgent(llm, verbose=False, interaction_mode="gui_only")
        result = await HybridAgentRuntime(env, agent, interaction_mode="gui_only").run(
            "Open July 14", max_steps=2
        )
        return env, result

    env, result = asyncio.run(scenario())
    assert env.page.calls == []
    assert result.trace[1].feedback.result["code"] == "TOOL_NOT_AVAILABLE"


def test_create_agent_selects_session_runtime():
    agent = _create_agent(
        HybridBenchmarkConfig(
            env_url="http://127.0.0.1:4173",
            model_base_url="http://127.0.0.1:18000/v1",
            model_name="Qwen3.5-9B",
            model_api_key="EMPTY",
            runtime=QWEN35_SESSION_RUNTIME,
            quiet=True,
        )
    )
    assert isinstance(agent, Qwen35SessionAgent)
    assert QWEN35_SESSION_SYSTEM_PROMPT_NATIVE.strip() in agent._system_prompt


def test_cli_exposes_runtime_flag():
    args = create_parser().parse_args(["--runtime", "qwen35_session", "--list"])
    assert args.runtime == "qwen35_session"
    assert args.last_n == 3
    assert args.enable_thinking == "true"
    assert args.qwen35_tool_call_mode == "native"


def test_session_family_matches_official_backends():
    assert session_family("Qwen3.5-9B-0820-ep3") == "qwen"
    assert session_family("gemini-3.1-pro-preview") == "gemini"
    assert session_family("kimi-k3") == "kimi_k3"
    assert session_family("deepseek-v4-flash-vision-exp") == "deepseek"
    assert session_family("glm-5.3-flash-b") == "glm"
    assert session_family("zai-org/glm-4.6") == "glm"
    assert session_family("autoglm-phone-9b") == "qwen"


def _xml_json(name: str, arguments: dict) -> ChatResult:
    payload = json.dumps({"name": name, "arguments": arguments}, ensure_ascii=False)
    return ChatResult(content=f"<tool_call>\n{payload}\n</tool_call>")


def test_gemini_uses_json_prompt_and_user_screenshot_followups():
    llm = _SessionLlm(
        [
            _xml_json("mobile_use", {"action": "click", "coordinate": [10, 10]}),
            _xml_json("mobile_use", {"action": "terminate", "status": "success"}),
        ]
    )
    agent = Qwen35SessionAgent(
        llm,
        verbose=False,
        interaction_mode="gui_only",
        model_name="gemini-3.1-pro-preview",
    )
    obs = Observation(screenshot_bytes=b"\xff\xd8fake", route={})
    agent.step("tap something", obs)
    agent.step("tap something", obs)
    assert agent.session_family == "gemini"
    assert GEMINI_SESSION_SYSTEM_PROMPT.strip() in agent._system_prompt
    assert '{"name": <function-name>' in agent._system_prompt or "<function-name>" in agent._system_prompt
    assert llm.messages[1][-1]["role"] == "user"
    assert llm.messages[1][-1].get("role") == "user"
    assert "tools" not in llm.args[0]
    assert llm.args[0].get("tool_choice") == "none"
    google = (llm.args[0].get("extra_body") or {}).get("extra_body", {}).get("google", {})
    assert google["thinking_config"]["include_thoughts"] is True


def test_session_recorder_writes_screenshot_files(tmp_path):
    async def scenario():
        env = _FakeEnv()
        llm = _SessionLlm(
            [
                _native("mobile_use", {"action": "click", "coordinate": [10, 10]}, "c1"),
                _native("mobile_use", {"action": "terminate", "status": "success"}, "c2"),
            ]
        )
        agent = Qwen35SessionAgent(llm, last_n=3, verbose=False, interaction_mode="gui_only")
        recorder = HybridArtifactRecorder(tmp_path)
        return await HybridAgentRuntime(
            env, agent, recorder=recorder, interaction_mode="gui_only"
        ).run("tap", max_steps=5)

    asyncio.run(scenario())
    assert (tmp_path / "step_001_before.jpg").is_file()
    assert (tmp_path / "screenshot_step0.png").is_file()
    assert (tmp_path / "session.json").is_file()
    prompt = (tmp_path / "step_001_prompt.json").read_text(encoding="utf-8")
    assert "data:image" not in prompt


def test_kimi_k3_and_deepseek_use_family_prompts():
    kimi = Qwen35SessionAgent(
        _SessionLlm([]), verbose=False, model_name="kimi-k3-preview"
    )
    deepseek = Qwen35SessionAgent(
        _SessionLlm([]), verbose=False, model_name="deepseek-v4-flash-vision-exp"
    )
    assert kimi.session_family == "kimi_k3"
    assert KIMI_K3_SESSION_SYSTEM_PROMPT.strip() in kimi._system_prompt
    assert deepseek.session_family == "deepseek"
    assert "Call the mobile_use tool" in deepseek._system_prompt


def test_glm_hybrid_puts_app_tools_in_api_tools_param():
    async def scenario():
        env = _FakeEnv()
        llm = _SessionLlm(
            [
                _native("mobile_use", {"action": "open_app", "text": "calendar"}, "c1"),
                _native("calendar__open_date", {"date": "2026-07-14"}, "c2"),
                _native("mobile_use", {"action": "terminate", "status": "success"}, "c3"),
            ]
        )
        agent = Qwen35SessionAgent(
            llm,
            last_n=3,
            verbose=False,
            interaction_mode="hybrid",
            model_name="glm-5.3-flash-b",
        )
        result = await HybridAgentRuntime(env, agent, interaction_mode="hybrid").run(
            "Open July 14", max_steps=5
        )
        return env, llm, result, agent

    env, llm, result, agent = asyncio.run(scenario())
    assert "COMPLETE" in str(result.stop_reason)
    assert env.page.calls == [
        {"name": "calendar__open_date", "arguments": {"date": "2026-07-14"}}
    ]
    assert agent.session_family == "glm"
    assert GLM_SESSION_SYSTEM_PROMPT.strip() in agent._system_prompt
    assert GLM_HYBRID_SESSION_ADDENDUM.strip() in agent._system_prompt
    assert "Do not emit a JSON object" not in agent._system_prompt
    assert HYBRID_SESSION_ADDENDUM.strip() not in agent._system_prompt
    names_by_turn = [
        [row["function"]["name"] for row in args["tools"]] for args in llm.args
    ]
    assert names_by_turn[0] == ["mobile_use"]
    assert names_by_turn[1] == ["mobile_use", "calendar__open_date"]
    assert names_by_turn[2] == ["mobile_use", "calendar__open_date"]
    second_texts = [
        part.get("text", "")
        for msg in llm.messages[1]
        if msg["role"] in {"user", "tool"}
        for part in (msg["content"] if isinstance(msg["content"], list) else [])
        if isinstance(part, dict)
    ]
    assert any("`calendar__open_date`" in text for text in second_texts)
    assert not any("<tools>" in text for text in second_texts)
    thinking = (llm.args[0].get("extra_body") or {}).get("thinking") or {}
    assert thinking.get("type") == "enabled"


def _thought_xml(name: str, arguments: dict, thought: str = "Do the next action.") -> ChatResult:
    params = []
    for key, value in arguments.items():
        dumped = json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value
        params.append(f"<parameter={key}>\n{dumped}\n</parameter>")
    inner = "".join(params)
    return ChatResult(
        content=(
            f"Thought: {thought}\n"
            f"<tool_call>\n<function={name}>\n{inner}\n</function>\n</tool_call>"
        )
    )


def test_thought_session_ignores_tools_and_native_thinking():
    llm = _SessionLlm(
        [
            _thought_xml("mobile_use", {"action": "click", "coordinate": [10, 10]}),
            _thought_xml("mobile_use", {"action": "terminate", "status": "success"}),
        ]
    )
    agent = Qwen35SessionAgent(
        llm,
        last_n=3,
        verbose=False,
        interaction_mode="gui_only",
        enable_thinking=True,
        tool_call_mode="native",
        thought_session=True,
        model_name="gemini-3.1-pro-preview",
    )
    obs = Observation(screenshot_bytes=b"\xff\xd8fake", route={})
    first = agent.step("tap something", obs)
    agent.step("tap something", obs)
    assert agent.thought_session is True
    assert agent.enable_thinking is False
    assert agent.tool_call_mode == "xml"
    assert agent.session_family == "qwen"
    assert agent._system_prompt.strip() == QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT.strip()
    assert "Put reasoning after `Thought:`" in agent._system_prompt
    assert "exactly one mobile_use function call" in agent._system_prompt
    assert "tools" not in llm.args[0]
    kwargs = (llm.args[0].get("extra_body") or {}).get("chat_template_kwargs") or {}
    assert kwargs.get("enable_thinking") is False
    assert first.response.startswith("Thought:")
    dumped = agent.export_session_record(episode_id="ep", goal="tap something")
    assert dumped["runtime"] == QWEN35_THOUGHT_SESSION_RUNTIME
    assert llm.messages[1][-1]["role"] == "tool"


def test_thought_session_hybrid_uses_thought_addendum_not_api_tools():
    async def scenario():
        env = _FakeEnv()
        llm = _SessionLlm(
            [
                _thought_xml("mobile_use", {"action": "open_app", "text": "calendar"}),
                _thought_xml("calendar__open_date", {"date": "2026-07-14"}),
                _thought_xml("mobile_use", {"action": "terminate", "status": "success"}),
            ]
        )
        agent = Qwen35SessionAgent(
            llm, last_n=3, verbose=False, interaction_mode="hybrid", thought_session=True
        )
        result = await HybridAgentRuntime(env, agent, interaction_mode="hybrid").run(
            "Open July 14", max_steps=5
        )
        return llm, result, agent

    llm, result, agent = asyncio.run(scenario())
    assert "COMPLETE" in str(result.stop_reason)
    assert agent._system_prompt.strip() == QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT_HYBRID.strip()
    assert "exactly one function call" in agent._system_prompt
    assert "exactly one mobile_use function call" not in agent._system_prompt
    assert HYBRID_SESSION_ADDENDUM.strip() not in agent._system_prompt
    assert all("tools" not in args for args in llm.args)
    second_texts = [
        part.get("text", "")
        for msg in llm.messages[1]
        if msg["role"] in {"user", "tool"}
        for part in (msg["content"] if isinstance(msg["content"], list) else [])
        if isinstance(part, dict)
    ]
    assert any("calendar__open_date" in text for text in second_texts)
    assert any("There is no API `tools=` list" in text for text in second_texts)


def test_thought_session_retries_missing_thought_prefix():
    missing = ChatResult(
        content=(
            "<tool_call><function=mobile_use>"
            "<parameter=action>click</parameter>"
            "<parameter=coordinate>[10, 10]</parameter>"
            "</function></tool_call>"
        )
    )
    llm = _SessionLlm(
        [missing, _thought_xml("mobile_use", {"action": "click", "coordinate": [10, 10]})]
    )
    agent = Qwen35SessionAgent(llm, verbose=False, thought_session=True)
    obs = Observation(screenshot_bytes=b"\xff\xd8fake", route={})
    result = agent.step("tap something", obs)
    assert len(llm.messages) == 2
    assert "missing a Thought:" in json.dumps(llm.messages[1], ensure_ascii=False)
    assert result.response.startswith("Thought:")


def test_normalize_thought_session_content_wraps_prefix():
    raw = (
        "Open the app first.\n"
        "<tool_call><function=mobile_use>"
        "<parameter=action>open_app</parameter>"
        "<parameter=text>calendar</parameter>"
        "</function></tool_call>"
    )
    out = normalize_thought_session_content(raw)
    assert out.startswith("Thought: Open the app first.")
    assert "<tool_call>" in out


def test_create_agent_selects_thought_session_runtime():
    agent = _create_agent(
        HybridBenchmarkConfig(
            env_url="http://127.0.0.1:4173",
            model_base_url="http://127.0.0.1:18000/v1",
            model_name="Qwen3.5-27B-mcp-sft",
            model_api_key="EMPTY",
            runtime=QWEN35_THOUGHT_SESSION_RUNTIME,
            enable_thinking=True,
            qwen35_tool_call_mode="native",
            quiet=True,
        )
    )
    assert isinstance(agent, Qwen35SessionAgent)
    assert agent.thought_session is True
    assert agent.enable_thinking is False
    assert "tools" not in agent._chat_args()
    assert agent._system_prompt.strip() == QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT_HYBRID.strip()


def test_cli_exposes_thought_runtime_flag():
    args = create_parser().parse_args(["--runtime", "qwen35_thought_session", "--list"])
    assert args.runtime == QWEN35_THOUGHT_SESSION_RUNTIME


def test_qwen_session_receives_open_app_not_found_in_next_observation():
    async def scenario():
        env = _FakeEnv()
        env.APP_NAME_MAP = {"Calendar": "calendar"}
        env._KNOWN_APP_IDS = frozenset({"calendar"})
        env.route = {"app": "notes", "path": "/"}
        llm = _SessionLlm(
            [
                _native("mobile_use", {"action": "open_app", "text": "美团"}, "c1"),
                _native("mobile_use", {"action": "open_app", "text": "calendar"}, "c2"),
                _native("mobile_use", {"action": "terminate", "status": "success"}, "c3"),
            ]
        )
        agent = Qwen35SessionAgent(
            llm, last_n=3, verbose=False, interaction_mode="gui_only"
        )
        result = await HybridAgentRuntime(env, agent, interaction_mode="gui_only").run(
            "Open calendar", max_steps=5
        )
        return llm, result

    llm, result = asyncio.run(scenario())
    assert result.trace[0].feedback.ok is False
    assert result.trace[0].feedback.result["code"] == "APP_NOT_FOUND"
    second_turn = llm.messages[1][-1]
    parts = second_turn["content"] if isinstance(second_turn["content"], list) else []
    texts = [
        str(part.get("text") or "")
        for part in parts
        if isinstance(part, dict) and part.get("type") == "text"
    ]
    joined = "\n".join(texts)
    assert "APP_NOT_FOUND" in joined
    assert "美团" in joined
    assert result.stop_reason == "COMPLETE"

