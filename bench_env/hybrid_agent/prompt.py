"""System and user prompt construction for the XML hybrid agent."""

from __future__ import annotations

import json
from typing import Any

from bench_env.hybrid_agent.mobile_use import mobile_use_function
from bench_env.hybrid_agent.modes import (
    GUI_ONLY_MODE,
    HYBRID_MODE,
    validate_interaction_mode,
)
from bench_env.hybrid_agent.xml_protocol import model_function_definition, render_tools_xml


def build_system_prompt(
    app_tool_definitions: list[dict[str, Any]],
    current_app: str,
    interaction_mode: str = HYBRID_MODE,
    coord_space: str = "norm_0_1000",
    physical_size: tuple[int, int] = (1080, 2400),
) -> tuple[str, dict[str, dict[str, Any]]]:
    """Build the dynamic prompt and parser schema table for one turn."""

    interaction_mode = validate_interaction_mode(interaction_mode)
    functions = [mobile_use_function(coord_space, physical_size)]
    if interaction_mode != GUI_ONLY_MODE:
        functions.extend(model_function_definition(item) for item in app_tool_definitions)
    schemas_by_name = {
        str(item["function"]["name"]): item["function"]["parameters"]
        for item in functions
    }
    app_context = current_app or "launcher/system UI"

    if interaction_mode == GUI_ONLY_MODE:
        opening = (
            "You are a mobile agent operating the MobileGym simulator through GUI actions."
        )
        runtime_policy = f"""- `mobile_use` is the only available function and exactly matches MobileGym's supported GUI action space.
- App-provided business tools are disabled. Complete the task entirely through `mobile_use` and the visible UI.
- The current foreground context is `{app_context}`.
- Never invent or call any function that is not listed in this turn.
- After every call, use the returned result and the next screenshot to decide what to do."""
    else:
        opening = (
            "You are a mobile agent operating the MobileGym simulator through GUI actions "
            "and sparse app-provided tools."
        )
        runtime_policy = f"""- `mobile_use` is always available and exactly matches MobileGym's supported GUI action space.
- App tools are selected at runtime from the foreground app. The current foreground context is `{app_context}`.
- Only functions listed in this turn are callable. Never invent or call a tool from another app.
- App tools may return structured data or navigate/prefill UI. After every call, use the returned result and the next screenshot to decide what to do."""

    if coord_space == "physical":
        width, height = physical_size
        coordinate_policy = (
            f"Use original screenshot pixel coordinates for `mobile_use`: "
            f"x ranges from 0 to {width}, y ranges from 0 to {height}."
        )
        example_coordinate = [176, 1723]
    else:
        coordinate_policy = (
            "Use normalized screenshot coordinates from 0 to 1000 for `mobile_use`."
        )
        example_coordinate = [163, 718]

    prompt = f"""{opening}

# Runtime tool policy

{runtime_policy}
- Execute exactly one function call per turn. Never emit parallel calls.
- {coordinate_policy}
- When a task names an app, prefer `mobile_use(action="open_app")` with its exact name or id instead of guessing a launcher icon.
- In MobileGym benchmark instructions, “笔记” or “Notes” means the system Notes app (`notes`), never Flomo unless Flomo is named explicitly.
- `mobile_use` action `answer` records an answer but does not terminate. After all task requirements are satisfied, call `mobile_use` with action `terminate` and status `success`.
- Use terminate/failure only when the task genuinely cannot be completed, not for a recoverable tool or formatting error.

# Tools

{render_tools_xml(functions)}

If you choose to call a function, reply with exactly one function call in this XML format:

<tool_call>
<function=mobile_use>
<parameter=action>
click
</parameter>
<parameter=coordinate>
{json.dumps(example_coordinate)}
</parameter>
</function>
</tool_call>

# Response format

Response format for every step:
1. `Thought:` one concise sentence explaining the next move.
2. `Action:` one short imperative describing the action.
3. One `<tool_call>...</tool_call>` block in the Qwen XML function-call format.

Rules:
- Output exactly in the order Thought, Action, tool_call.
- Put every argument in its own `<parameter=name>...</parameter>` block.
- Write valid JSON for array, object, number, and boolean arguments.
- Do not output anything after `</tool_call>`.
"""
    return prompt, schemas_by_name


def build_user_text(
    task: str,
    step: int,
    previous_feedback: dict[str, Any] | None,
) -> str:
    rows = [f"[Task]\n{task}", f"[Step {step}] Inspect the current screenshot."]
    if previous_feedback is not None:
        payload = json.dumps(previous_feedback, ensure_ascii=False, separators=(",", ":"))
        rows.append(f"[Previous tool result]\n<tool_result>{payload}</tool_result>")
    return "\n\n".join(rows)
