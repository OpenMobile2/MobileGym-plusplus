"""Model adapter for dynamic GUI + App Tools XML prompting."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from bench_env.env.base import Observation
from bench_env.hybrid_agent.modes import HYBRID_MODE
from bench_env.hybrid_agent.prompt import build_system_prompt, build_user_text
from bench_env.hybrid_agent.types import ParsedModelResponse, StepFeedback
from bench_env.hybrid_agent.xml_protocol import parse_tool_call_response


@dataclass
class HybridAgentConfig:
    model_args: dict[str, Any] = field(
        default_factory=lambda: {"temperature": 0.1, "top_p": 0.95, "max_tokens": 8192}
    )
    stream: bool = False
    verbose: bool = True
    coord_space: str = "norm_0_1000"
    physical_size: tuple[int, int] = (1080, 2400)


@dataclass(frozen=True)
class _ConversationTurn:
    user_text: str
    assistant_text: str


class HybridXmlAgent:
    """Stateful model protocol adapter; it never executes app business logic."""

    def __init__(self, llm: Any, config: HybridAgentConfig | None = None):
        self.llm = llm
        self.config = config or HybridAgentConfig()
        self._task = ""
        self._history: list[_ConversationTurn] = []
        self.last_messages: list[dict[str, Any]] = []
        self.last_response: str = ""

    @property
    def name(self) -> str:
        return "HybridXmlAgent"

    def reset(self, task: str) -> None:
        self._task = task
        self._history = []
        self.last_messages = []
        self.last_response = ""

    def act(
        self,
        obs: Observation,
        app_tool_definitions: list[dict[str, Any]],
        previous_feedback: StepFeedback | None,
        foreground_app: str | None = None,
        interaction_mode: str = HYBRID_MODE,
    ) -> ParsedModelResponse:
        current_app = obs.current_app if foreground_app is None else foreground_app
        system_prompt, schemas_by_name = build_system_prompt(
            app_tool_definitions,
            current_app,
            interaction_mode,
            self.config.coord_space,
            self.config.physical_size,
        )
        user_text = build_user_text(
            self._task,
            len(self._history) + 1,
            previous_feedback.to_dict() if previous_feedback else None,
        )
        messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]
        for turn in self._history:
            messages.append(
                {
                    "role": "user",
                    "content": turn.user_text + "\n\n[The screenshot from this past turn is omitted.]",
                }
            )
            messages.append({"role": "assistant", "content": turn.assistant_text})
        messages.append(
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": obs.image_data_url}},
                    {"type": "text", "text": user_text},
                ],
            }
        )
        self.last_messages = messages

        response = self.llm.chat(
            messages=messages,
            args={
                **self.config.model_args,
                "stream": self.config.stream,
                "stream_print": self.config.stream and self.config.verbose,
            },
        )
        response_text = str(response.content or "")
        self.last_response = response_text
        self._history.append(_ConversationTurn(user_text, response_text))
        if self.config.verbose and not self.config.stream:
            print(f"\n[HybridXmlAgent response]\n{response_text}\n")
        return parse_tool_call_response(response_text, schemas_by_name)
