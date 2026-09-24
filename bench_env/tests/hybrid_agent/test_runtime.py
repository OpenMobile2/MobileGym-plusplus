import asyncio
from dataclasses import dataclass

from bench_env.env.base import ActionType, Observation, StepResult
from bench_env.hybrid_agent import (
    HybridAgentConfig,
    HybridAgentRuntime,
    HybridArtifactRecorder,
    HybridXmlAgent,
)
from bench_env.hybrid_agent.types import FunctionCall


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
    "annotations": {
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "uiEffect": "navigation",
    },
}


@dataclass
class _ChatResult:
    content: str


class _FakeLlm:
    def __init__(self):
        self.messages = []
        self.responses = iter(
            [
                """Thought: Open Calendar first.
Action: Launch Calendar.
<tool_call><function=mobile_use>
<parameter=action>open_app</parameter><parameter=app>calendar</parameter>
</function></tool_call>""",
                """Thought: Use the date navigation tool now available.
Action: Open the requested date.
<tool_call><function=calendar__open_date>
<parameter=date>2026-07-14</parameter>
</function></tool_call>""",
                """Thought: The requested date is open.
Action: Finish the task.
<tool_call><function=mobile_use>
<parameter=action>terminate</parameter><parameter=status>success</parameter>
</function></tool_call>""",
            ]
        )

    def chat(self, *, messages, args):
        self.messages.append(messages)
        return _ChatResult(next(self.responses))


class _FakePage:
    def __init__(self, env):
        self.env = env
        self.calls = []
        self.foreground_resolutions = 0
        self.tool_discoveries = 0

    async def evaluate(self, script, argument=None):
        if "resolveForegroundApp" in script:
            self.foreground_resolutions += 1
            return str(self.env.route.get("app") or "")
        if "systemSurfaceVisible" in script:
            self.tool_discoveries += 1
            app = str(self.env.route.get("app") or "")
            return {
                "app": app,
                "tools": [CALENDAR_OPEN_DATE] if app == "calendar" else [],
            }
        if "listTools" in script:
            return [CALENDAR_OPEN_DATE] if argument == "calendar" else []
        if "callTool" in script:
            self.calls.append(argument)
            self.env.route = {"app": "calendar", "path": "/?date=2026-07-14&view=month"}
            return {
                "callId": "tool_call_1",
                "name": argument["name"],
                "ok": True,
                "output": {"date": "2026-07-14", "route": self.env.route["path"]},
            }
        raise AssertionError(f"Unexpected evaluate script: {script}")


class _FakeEnv:
    def __init__(self):
        self.route = {}
        self.page = _FakePage(self)
        self.agent_answer = None
        self.agent_message = None

    async def get_route(self):
        return dict(self.route)

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


def test_open_app_returns_app_not_found_without_executing_unknown_app():
    async def scenario():
        env = _FakeEnv()
        env.APP_NAME_MAP = {"Calendar": "calendar"}
        env._KNOWN_APP_IDS = frozenset({"calendar"})
        env.route = {"app": "notes", "path": "/note/example"}
        agent = HybridXmlAgent(
            _FakeLlm(), HybridAgentConfig(stream=False, verbose=False)
        )
        runtime = HybridAgentRuntime(env, agent)
        return await runtime._execute_mobile_use(
            FunctionCall(
                name="mobile_use",
                arguments={"action": "open_app", "app": "淘宝闪购"},
            )
        )

    feedback, observation, done = asyncio.run(scenario())

    assert feedback.ok is False
    assert feedback.result["code"] == "APP_NOT_FOUND"
    assert observation.current_app == "notes"
    assert done is False


def test_runtime_exposes_only_foreground_app_tools_and_executes_sequentially():
    async def scenario():
        env = _FakeEnv()
        llm = _FakeLlm()
        agent = HybridXmlAgent(llm, HybridAgentConfig(stream=False, verbose=False))
        result = await HybridAgentRuntime(env, agent).run("Open July 14", max_steps=5)
        return env, llm, result

    env, llm, result = asyncio.run(scenario())

    assert result.stop_reason == "COMPLETE"
    assert result.trace[0].available_tools == ["mobile_use"]
    assert result.trace[1].available_tools == ["mobile_use", "calendar__open_date"]
    assert result.trace[1].ui_effect == "navigation"
    assert result.trace[1].route_after["path"].startswith("/?date=2026-07-14")
    assert env.page.calls == [
        {"name": "calendar__open_date", "arguments": {"date": "2026-07-14"}}
    ]

    first_system_prompt = llm.messages[0][0]["content"]
    second_system_prompt = llm.messages[1][0]["content"]
    assert "calendar__open_date" not in first_system_prompt
    assert "calendar__open_date" in second_system_prompt
    assert "tool_call_1" in llm.messages[2][-1]["content"][1]["text"]


class _GuiOnlyFakeLlm:
    def __init__(self):
        self.messages = []
        self.responses = iter(
            [
                """Thought: Open Calendar first.
Action: Launch Calendar.
<tool_call><function=mobile_use>
<parameter=action>open_app</parameter><parameter=app>calendar</parameter>
</function></tool_call>""",
                """Thought: Try an unavailable business tool.
Action: Open the date directly.
<tool_call><function=calendar__open_date>
<parameter=date>2026-07-14</parameter>
</function></tool_call>""",
                """Thought: Continue through the visible interface.
Action: Tap the date on screen.
<tool_call><function=mobile_use>
<parameter=action>click</parameter><parameter=coordinate>[500, 500]</parameter>
</function></tool_call>""",
                """Thought: The GUI interaction is complete.
Action: Finish the task.
<tool_call><function=mobile_use>
<parameter=action>terminate</parameter><parameter=status>success</parameter>
</function></tool_call>""",
            ]
        )

    def chat(self, *, messages, args):
        self.messages.append(messages)
        return _ChatResult(next(self.responses))


def test_gui_only_runtime_exposes_and_executes_only_mobile_use():
    async def scenario():
        env = _FakeEnv()
        llm = _GuiOnlyFakeLlm()
        agent = HybridXmlAgent(llm, HybridAgentConfig(stream=False, verbose=False))
        result = await HybridAgentRuntime(
            env,
            agent,
            interaction_mode="gui_only",
        ).run("Open July 14 through the GUI", max_steps=5)
        return env, llm, result

    env, llm, result = asyncio.run(scenario())

    assert result.stop_reason == "COMPLETE"
    assert result.interaction_mode == "gui_only"
    assert all(record.available_tools == ["mobile_use"] for record in result.trace)
    assert result.trace[1].call is None
    assert result.trace[1].feedback.result["code"] == "INVALID_TOOL_CALL"
    assert env.page.calls == []
    assert env.page.tool_discoveries == 0
    assert env.page.foreground_resolutions == 4
    for messages in llm.messages:
        system_prompt = messages[0]["content"]
        assert "calendar__open_date" not in system_prompt
        assert "App-provided business tools are disabled" in system_prompt


def test_artifact_recorder_saves_step_screenshots_and_viewer(tmp_path):
    async def scenario():
        env = _FakeEnv()
        agent = HybridXmlAgent(
            _FakeLlm(), HybridAgentConfig(stream=False, verbose=False)
        )
        recorder = HybridArtifactRecorder(tmp_path)
        return await HybridAgentRuntime(env, agent, recorder=recorder).run(
            "Open July 14", max_steps=5
        )

    result = asyncio.run(scenario())

    assert result.stop_reason == "COMPLETE"
    assert (tmp_path / "trace.json").is_file()
    assert (tmp_path / "index.html").is_file()
    assert (tmp_path / "step_001_before.jpg").is_file()
    assert (tmp_path / "step_001_after.jpg").is_file()
    assert (tmp_path / "step_002_prompt.json").is_file()
    assert (tmp_path / "step_002_response.txt").is_file()
    assert (tmp_path / "step_002_result.json").is_file()
    assert "data:image" not in (tmp_path / "step_002_prompt.json").read_text()
    viewer = (tmp_path / "index.html").read_text()
    assert "calendar__open_date" in viewer
    assert "step_002_before.jpg" in viewer
    assert "Interaction mode: hybrid" in viewer
