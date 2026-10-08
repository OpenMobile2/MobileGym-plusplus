"""Qwen3.5 session protocol: prompts, ``tools=[mobile_use]`` schema, and agent.

Mirrors the official ``qwen35_session`` conversation shape: system prompt and task
query are sent once, follow-up observations carry only the new screenshot, and the
API tool list stays ``mobile_use`` for Qwen / Gemini / Kimi / DeepSeek. Extra App
Tool schemas are dumped into the app-switch user turn instead of mutating
``tools=``. GLM is the exception: it only emits native function calls, so the
current app's extra tools are merged into API ``tools=`` on every hybrid turn.

``qwen35_thought_session`` keeps the same multi-turn packing but writes reasoning
as a ``Thought:`` paragraph, dumps ``mobile_use`` into the system prompt, and
never sends API ``tools=`` / native thinking. GUI-only uses
``QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT``; hybrid uses
``QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT_HYBRID`` and lists extra app tools inside
the ``role=tool`` observation.
"""

from __future__ import annotations

import copy
import json
import re
from dataclasses import dataclass, field
from typing import Any

from bench_env.env.base import Observation
from bench_env.hybrid_agent.modes import (
    GUI_ONLY_MODE,
    HYBRID_MODE,
    QWEN35_SESSION_RUNTIME,
    QWEN35_THOUGHT_SESSION_RUNTIME,
)
from bench_env.hybrid_agent.types import FunctionCall, ParsedModelResponse, StepFeedback
from bench_env.hybrid_agent.xml_protocol import ToolCallParseError, _extract_thought

COLLAPSED_SCREENSHOT_TEXT = "This screenshot has been collapsed."

QWEN35_SESSION_USER_PROMPT = "The user query: {instruction}\n"
GEMINI_SESSION_USER_PROMPT = "The user query: {instruction}\n"
KIMI_K3_SESSION_USER_PROMPT = "The user query: {instruction}\n"
DEEPSEEK_V4_SESSION_USER_PROMPT = "The user query: {instruction}\n"
GLM_SESSION_USER_PROMPT = "The user query: {instruction}\n"

# Gemini / generic JSON session (official QWEN3VL-shaped prompt). Follow-up
# observations are image-only user messages; thinking comes from the API.
GEMINI_SESSION_SYSTEM_PROMPT = """
# Tools

You may call one or more functions to assist with the user query.

You are provided with function signatures within <tools></tools> XML tags:
<tools>
{"type": "function", "function": {"name": "mobile_use", "description": "Use a touchscreen to interact with a mobile device, and take screenshots.\\n* This is an interface to a mobile device with touchscreen. You can perform actions like clicking, typing, swiping, etc.\\n* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions.\\n* The screen's resolution is 999x999.\\n* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. Don't click boxes on their edges unless asked.", "parameters": {"properties": {"action": {"description": "The action to perform. The available actions are:\\n* `click`: Click the point on the screen with coordinate (x, y).\\n* `long_press`: Press the point on the screen with coordinate (x, y) for specified seconds.\\n* `swipe`: Swipe from the starting point with coordinate (x, y) to the end point with coordinates2 (x2, y2).\\n* `type`: Input the specified text into the activated input box.\\n* `answer`: Output the answer.\\n* `system_button`: Press the system button.\\n* `wait`: Wait specified seconds for the change to happen.\\n* `terminate`: Terminate the current task and report its completion status.", "enum": ["click", "long_press", "swipe", "type", "answer", "system_button", "wait", "terminate"], "type": "string"}, "coordinate": {"description": "(x, y): The x (pixels from the left edge) and y (pixels from the top edge) coordinates to move the mouse to. The coordinates should be values from 0 to 999. Required only by `action=click`, `action=long_press`, and `action=swipe`.", "type": "array"}, "coordinate2": {"description": "(x, y): The x (pixels from the left edge) and y (pixels from the top edge) coordinates to move the mouse to. Required only by `action=swipe`.", "type": "array"}, "text": {"description": "Required only by `action=type` and `action=answer`.", "type": "string"}, "time": {"description": "The seconds to wait. Required only by `action=long_press` and `action=wait`.", "type": "number"}, "button": {"description": "Back means returning to the previous interface, Home means returning to the desktop, Menu means opening the application background menu, and Enter means pressing the enter. Required only by `action=system_button`", "enum": ["Back", "Home", "Menu", "Enter"], "type": "string"}, "status": {"description": "The status of the task. Required only by `action=terminate`.", "type": "string", "enum": ["success", "failure"]}}, "required": ["action"], "type": "object"}}}
</tools>

For each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:
<tool_call>
{"name": <function-name>, "arguments": <args-json-object>}
</tool_call>

# Session interaction

- The task query is provided only once in the first user message, together with the initial screenshot(s).
- After each tool call, the next user message contains only the resulting screenshot(s).
- All previous assistant responses remain available as the response history.
- On each turn, inspect the currently provided screenshot(s) and the complete response history, then choose exactly one next action.
- Do not invent screenshot placeholders; they are inserted by the caller.
- Continue until the task is complete or cannot be completed, then call terminate with the appropriate status.

# Response format

Response format for every assistant turn:
- A single <tool_call>...</tool_call> block containing only the JSON: {"name": <function-name>, "arguments": <args-json-object>}.

Rules:
- Output exactly one <tool_call> per turn.
- Do not output anything after </tool_call>.
- If finishing, use action=terminate in the tool call.

# Visual context

- Only the most recent screenshot(s) are kept as images (controlled by last_n); older screenshot slots are replaced with "This screenshot has been collapsed.", but the complete textual response history is still retained.
- Always base the next action on the currently available screenshots and the response history.
- Do not assume access to screenshots that are not currently provided.

# Robustness rules

- If the response history suggests you are stuck repeating similar actions without progress, try a different action.
- Use the complete response history to avoid repeating actions that have already been performed.
- Base each action on the currently available screenshots; never assume that an earlier action succeeded without checking its result.
"""

KIMI_K3_SESSION_SYSTEM_PROMPT = """
You are a mobile GUI agent. Call the mobile_use tool to interact with the device touchscreen.

# Session interaction

- The task query is provided only once in the first user message, together with the initial screenshot(s).
- After each tool call, the environment returns a tool message containing the resulting screenshot(s).
- All previous assistant responses (including reasoning) remain in the conversation history.
- On each turn, inspect the currently provided screenshot(s) and history, then choose exactly one next action.
- Continue until the task is complete or cannot be completed, then call terminate with the appropriate status.

# Visual context

- Only the most recent screenshot(s) are kept as images (controlled by last_n); older screenshot slots are replaced with "This screenshot has been collapsed.", but the complete reasoning and response history is retained.
- Base each action on the currently available screenshots and prior turns.
"""

GLM_SESSION_SYSTEM_PROMPT = """
You are a mobile GUI agent. Use the provided tools to complete the task.

# Session

- The task query is provided only once in the first user message, together with the initial screenshot.
- After each tool call, the environment returns a tool message containing the resulting screenshot.
- Previous assistant reasoning and tool calls remain in the conversation history.
- Each turn: look at the screenshot(s) still provided as images, plus the full history, then make exactly one tool call.
- When the task is complete or cannot be completed, call terminate with status=success or status=failure.

# Tool call

- Call tools through the API function-calling interface. Do not emit Qwen XML or a raw JSON object in the assistant text.
- `mobile_use` operates the touchscreen (click, type, swipe, open_app, terminate, ...).
- Extra app tools, when present in `tools=`, query or mutate the current foreground app.
- Emit exactly one function call per turn.

# Visual context

- Only the most recent screenshot slots remain as images. Older slots are replaced with the text "This screenshot has been collapsed."
- Act only on images that are actually present. Do not recover pixels from collapsed slots.

# Robustness

- If the history shows repeated similar actions without progress, try a different action.
- Never assume an earlier action succeeded without checking the latest screenshot.
"""

DEEPSEEK_V4_SESSION_SYSTEM_PROMPT = """
You are a mobile GUI agent. Call the mobile_use tool to interact with the device touchscreen.

# Session

- The task query is provided only once in the first user message, together with the initial screenshot.
- After each tool call, the environment returns a tool message containing the resulting screenshot.
- Previous assistant reasoning and tool calls remain in the conversation history.
- Each turn: look at the screenshot(s) still provided as images, plus the full history, then make exactly one tool call.
- When the task is complete or cannot be completed, call terminate with status=success or status=failure.

# Visual context

- Only the most recent screenshot slots remain as images. Older slots are replaced with the text "This screenshot has been collapsed."
- Act only on images that are actually present. Do not recover pixels from collapsed slots.

# Robustness

- If the history shows repeated similar actions without progress, try a different action.
- Never assume an earlier action succeeded without checking the latest screenshot.
"""

# Native tools= for Qwen3.5/3.6 session (SGLang --tool-call-parser qwen3_coder).
# Schema is injected by chat_template from tools=; do not dump <tools> JSON here.
QWEN35_SESSION_SYSTEM_PROMPT_NATIVE = """
You are a mobile GUI agent. Use the mobile_use tool to interact with the device touchscreen.

# Session

- The task query is provided only once in the first user message, together with the initial screenshot.
- After each tool call, the environment returns a tool message containing the resulting screenshot.
- Previous assistant reasoning and tool calls remain in the conversation history.
- Each turn: look at the screenshot(s) still provided as images, plus the full history, then make exactly one tool call.
- When the task is complete or cannot be completed, call terminate with status=success or status=failure.

# Tool call

- Emit Qwen XML: <tool_call><function=mobile_use><parameter=...>...</parameter></function></tool_call>
- Do not emit a JSON object such as {"action":"click","coordinate":[x,y]} or {"name":"...","arguments":{...}}.
- One <parameter> block per argument. Arrays/objects must be valid JSON inside the block (e.g. [163, 718]).
- Do not output anything after </tool_call>.

# Visual context

- Only the most recent screenshot slots remain as images. Older slots are replaced with the text "This screenshot has been collapsed."
- Act only on images that are actually present. Do not recover pixels from collapsed slots.

# Robustness

- If the history shows repeated similar actions without progress, try a different action.
- Never assume an earlier action succeeded without checking the latest screenshot.
"""

QWEN35_SESSION_SYSTEM_PROMPT_NO_THINK = """
# Tools

You have access to the following functions:

<tools>
{"type": "function", "function": {"name": "mobile_use", "description": "Use a touchscreen to interact with a mobile device and take screenshots.\\n* This is an interface to a mobile device with touchscreen. You can perform actions like clicking, typing, swiping, etc.\\n* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions.\\n* The screen's resolution is 999x999.\\n* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. Don't click boxes on their edges unless asked.", "parameters": {"properties": {"action": {"description": "The action to perform. The available actions are:\\n* `click`: Click the point on the screen with coordinate (x, y).\\n* `long_press`: Press the point on the screen with coordinate (x, y) for specified seconds.\\n* `swipe`: Swipe from the starting point with coordinate (x, y) to the end point with coordinates2 (x2, y2).\\n* `type`: Input the specified text into the activated input box.\\n* `answer`: Output the answer.\\n* `system_button`: Press the system button.\\n* `wait`: Wait specified seconds for the change to happen.\\n* `terminate`: Terminate the current task and report its completion status.", "enum": ["click", "long_press", "swipe", "type", "answer", "system_button", "wait", "terminate"], "type": "string"}, "coordinate": {"description": "(x, y): The x and y coordinates. Required only by `action=click`, `action=long_press`, and `action=swipe`.", "type": "array"}, "coordinate2": {"description": "(x, y): The end coordinates. Required only by `action=swipe`.", "type": "array"}, "text": {"description": "Required only by `action=type` and `action=answer`.", "type": "string"}, "time": {"description": "The seconds to wait. Required only by `action=long_press` and `action=wait`.", "type": "number"}, "button": {"description": "Required only by `action=system_button`.", "enum": ["Back", "Home", "Menu", "Enter"], "type": "string"}, "status": {"description": "Required only by `action=terminate`.", "enum": ["success", "failure"], "type": "string"}}, "required": ["action"], "type": "object"}}}
</tools>

Each response must include exactly one function call in the following XML format:

<tool_call>
<function=mobile_use>
<parameter=action>
click
</parameter>
<parameter=coordinate>
[163, 718]
</parameter>
</function>
</tool_call>

# Session interaction

- The task query is provided only once in the first user message, together with the initial screenshot(s).
- After each tool call, the environment returns a tool message containing the resulting screenshot(s).
- All previous assistant responses remain available as the response history.
- On each turn, inspect the currently provided screenshot(s) and the complete response history, then choose exactly one next action.
- Do not invent tool messages or screenshot placeholders; they are inserted by the caller.
- Continue until the task is complete or cannot be completed, then call terminate with the appropriate status.

# Response format

Response format for every assistant turn:
1) A single <tool_call>...</tool_call> block in the Qwen3.5 XML function-call format.

Rules:
- Function calls MUST use <tool_call><function=...><parameter=...>...</parameter></function></tool_call>.
- Put each argument in its own <parameter=...>...</parameter> block.
- For array/object arguments, write valid JSON inside the parameter block.
- Do not output anything after </tool_call>.
- If finishing, use action=terminate in the tool call.

# Visual context

- Only the most recent screenshot(s) are kept as images (controlled by last_n); older screenshot slots are replaced with "This screenshot has been collapsed.", but the complete textual response history is still retained.
- Always base the next action on the currently provided screenshots and the response history.
- Do not assume access to screenshots that are not currently provided.

# Robustness rules

- If the response history suggests you are stuck repeating similar actions without progress, try a different action.
- Use the complete response history to avoid repeating actions that have already been performed.
- Base each action on the currently available screenshots; never assume that an earlier action succeeded without checking its result.
"""

# Matches OpenMobile ``QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT``: XML tools in the
# system prompt, ``Thought:`` in assistant content, no native thinking / tools=.
QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT = """
# Tools

You have access to the following functions:

<tools>
{"type": "function", "function": {"name": "mobile_use", "description": "Use a touchscreen to interact with a mobile device, and take screenshots.\\n* This is an interface to a mobile device with touchscreen. You can perform actions like clicking, typing, swiping, etc.\\n* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions.\\n* The screen's resolution is 999x999.\\n* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. Don't click boxes on their edges unless asked.", "parameters": {"properties": {"action": {"description": "The action to perform. The available actions are:\\n* `click`: Click the point on the screen with coordinate (x, y).\\n* `long_press`: Press the point on the screen with coordinate (x, y) for specified seconds.\\n* `swipe`: Swipe from the starting point with coordinate (x, y) to the end point with coordinates2 (x2, y2).\\n* `type`: Input the specified text into the activated input box.\\n* `answer`: Output the answer.\\n* `system_button`: Press the system button.\\n* `wait`: Wait specified seconds for the change to happen.\\n* `terminate`: Terminate the current task and report its completion status.", "enum": ["click", "long_press", "swipe", "type", "answer", "system_button", "wait", "terminate"], "type": "string"}, "coordinate": {"description": "(x, y): The x and y coordinates. Required only by `action=click`, `action=long_press`, and `action=swipe`.", "type": "array"}, "coordinate2": {"description": "(x, y): The end coordinates. Required only by `action=swipe`.", "type": "array"}, "text": {"description": "Required only by `action=type` and `action=answer`.", "type": "string"}, "time": {"description": "The seconds to wait. Required only by `action=long_press` and `action=wait`.", "type": "number"}, "button": {"description": "Required only by `action=system_button`.", "enum": ["Back", "Home", "Menu", "Enter"], "type": "string"}, "status": {"description": "Required only by `action=terminate`.", "enum": ["success", "failure"], "type": "string"}}, "required": ["action"], "type": "object"}}}
</tools>

If you choose to call a function ONLY reply in the following format with NO suffix:

<tool_call>
<function=example_function_name>
<parameter=example_parameter_1>
value_1
</parameter>
<parameter=example_parameter_2>
This is the value for the second parameter
that can span
multiple lines
</parameter>
</function>
</tool_call>

<IMPORTANT>
Reminder:
- Function calls MUST follow the specified format: an inner <function=...></function> block must be nested within <tool_call></tool_call> XML tags
- Required parameters MUST be specified
- Put reasoning after `Thought:` BEFORE the function call, and do not write anything after </tool_call>
- Every assistant turn MUST include exactly one mobile_use function call. Do not answer the user in plain text.
</IMPORTANT>

You are a mobile GUI agent. Use the mobile_use tool to interact with the device touchscreen.

# Session

- The task query is provided only once in the first user message, together with the initial screenshot.
- After each tool call, the environment returns a tool message containing the resulting screenshot.
- Previous assistant reasoning and tool calls remain in the conversation history.
- Each turn: look at the screenshot(s) still provided as images, plus the full history, then make exactly one tool call.
- When the task is complete or cannot be completed, call terminate with status=success or status=failure.

# Tool call

- Every assistant turn must be exactly: a `Thought:` paragraph, then one <tool_call>...</tool_call> block.
- Emit Qwen XML: <tool_call><function=mobile_use><parameter=...>...</parameter></function></tool_call>
- Do not emit a JSON object such as {"action":"click","coordinate":[x,y]} or {"name":"...","arguments":{...}}.
- One <parameter> block per argument. Arrays/objects must be valid JSON inside the block (e.g. [163, 718]).
- Do not output anything after </tool_call>.

# Visual context

- Only the most recent screenshot slots remain as images. Older slots are replaced with the text "This screenshot has been collapsed."
- Act only on images that are actually present. Do not recover pixels from collapsed slots.

# Robustness

- If the history shows repeated similar actions without progress, try a different action.
- Never assume an earlier action succeeded without checking the latest screenshot.
"""

# GUI+MCP Thought template: same packing as ``QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT``,
# but extra foreground-app tools may appear in later ``role=tool`` observations.
QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT_HYBRID = """
# Tools

You have access to the following functions:

<tools>
{"type": "function", "function": {"name": "mobile_use", "description": "Use a touchscreen to interact with a mobile device, and take screenshots.\\n* This is an interface to a mobile device with touchscreen. You can perform actions like clicking, typing, swiping, etc.\\n* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions.\\n* The screen's resolution is 999x999.\\n* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. Don't click boxes on their edges unless asked.", "parameters": {"properties": {"action": {"description": "The action to perform. The available actions are:\\n* `click`: Click the point on the screen with coordinate (x, y).\\n* `long_press`: Press the point on the screen with coordinate (x, y) for specified seconds.\\n* `swipe`: Swipe from the starting point with coordinate (x, y) to the end point with coordinates2 (x2, y2).\\n* `type`: Input the specified text into the activated input box.\\n* `answer`: Output the answer.\\n* `system_button`: Press the system button.\\n* `wait`: Wait specified seconds for the change to happen.\\n* `terminate`: Terminate the current task and report its completion status.", "enum": ["click", "long_press", "swipe", "type", "answer", "system_button", "wait", "terminate"], "type": "string"}, "coordinate": {"description": "(x, y): The x and y coordinates. Required only by `action=click`, `action=long_press`, and `action=swipe`.", "type": "array"}, "coordinate2": {"description": "(x, y): The end coordinates. Required only by `action=swipe`.", "type": "array"}, "text": {"description": "Required only by `action=type` and `action=answer`.", "type": "string"}, "time": {"description": "The seconds to wait. Required only by `action=long_press` and `action=wait`.", "type": "number"}, "button": {"description": "Required only by `action=system_button`.", "enum": ["Back", "Home", "Menu", "Enter"], "type": "string"}, "status": {"description": "Required only by `action=terminate`.", "enum": ["success", "failure"], "type": "string"}}, "required": ["action"], "type": "object"}}}
</tools>

If you choose to call a function ONLY reply in the following format with NO suffix:

<tool_call>
<function=example_function_name>
<parameter=example_parameter_1>
value_1
</parameter>
<parameter=example_parameter_2>
This is the value for the second parameter
that can span
multiple lines
</parameter>
</function>
</tool_call>

<IMPORTANT>
Reminder:
- Function calls MUST follow the specified format: an inner <function=...></function> block must be nested within <tool_call></tool_call> XML tags
- Required parameters MUST be specified
- Put reasoning after `Thought:` BEFORE the function call, and do not write anything after </tool_call>
- Every assistant turn MUST include exactly one function call. Do not answer the user in plain text.
- The always-available GUI tool is `mobile_use`. When a tool message lists extra app tools inside `<tools>...</tools>`, you may call one of those tools with the same XML format while that app stays in the foreground. Do not call tools from a previous app, and do not invent tool names.
</IMPORTANT>

You are a mobile GUI agent. Prefer `mobile_use` for touchscreen interaction; use extra app tools only when they are currently listed and clearly help the task.

# Session

- The task query is provided only once in the first user message, together with the initial screenshot.
- After each tool call, the environment returns a tool message containing the resulting screenshot, and may also attach a foreground-app tool catalog.
- Previous assistant reasoning and tool calls remain in the conversation history.
- Each turn: look at the screenshot(s) still provided as images, plus the full history (including any currently listed extra tools), then make exactly one tool call.
- When the task is complete or cannot be completed, call `mobile_use` with action=terminate and status=success or status=failure.

# Tool call

- Every assistant turn must be exactly: a `Thought:` paragraph, then one <tool_call>...</tool_call> block.
- Emit Qwen XML: <tool_call><function=NAME><parameter=...>...</parameter></function></tool_call>
- Do not emit a JSON object such as {"action":"click","coordinate":[x,y]} or {"name":"...","arguments":{...}}.
- One <parameter> block per argument. Arrays/objects must be valid JSON inside the block (e.g. [163, 718]).
- Do not output anything after </tool_call>.

# Visual context

- Only the most recent screenshot slots remain as images. Older slots are replaced with the text "This screenshot has been collapsed."
- Act only on images that are actually present. Do not recover pixels from collapsed slots.

# Robustness

- If the history shows repeated similar actions without progress, try a different action.
- Never assume an earlier action succeeded without checking the latest screenshot.
"""

HYBRID_SESSION_ADDENDUM = """
# Extra app tools

The API `tools=` list is only `mobile_use` for the entire session; it does not change
when you open another app.
When the foreground app changes, that turn's user message lists extra tools for the
new app inside `<tools></tools>`. Those extra tools stay valid only while that app
remains in the foreground. A later user message with a new app's tools replaces them.
Never invent a tool from another app. On the launcher / recents / control center,
only `mobile_use` is available — open the app first (`mobile_use` action `open_app`
with its name or id, or click the icon).
Call extra app tools with the same `<tool_call>` XML as `mobile_use`.
After a non-`mobile_use` call, the next user/tool message contains a JSON result and
a new screenshot.
"""

GLM_HYBRID_SESSION_ADDENDUM = """
# Extra app tools

`mobile_use` is always in the API `tools=` list. When an app is in the foreground,
that app's extra tools are also in `tools=` for that turn. Call them as native
function calls, the same way you call `mobile_use`. They stay valid only while that
app remains in the foreground. When the app changes, the extra tools are replaced.
Never invent a tool from another app. On the launcher / recents / control center,
only `mobile_use` is available — open the app first (`mobile_use` action `open_app`
with its name or id, or click the icon).
After a non-`mobile_use` call, the next tool message contains a JSON result and a
new screenshot.
"""

QWEN35_TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "mobile_use",
            "description": (
                "Use a touchscreen to interact with a mobile device, and take screenshots.\n"
                "* This is an interface to a mobile device with touchscreen. You can perform actions like clicking, typing, swiping, etc.\n"
                "* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions.\n"
                "* The screen's resolution is 999x999.\n"
                "* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. Don't click boxes on their edges unless asked."
            ),
            "parameters": {
                "properties": {
                    "action": {
                        "description": (
                            "The action to perform. The available actions are:\n"
                            "* `click`: Click the point on the screen with coordinate (x, y).\n"
                            "* `long_press`: Press the point on the screen with coordinate (x, y) for specified seconds.\n"
                            "* `swipe`: Swipe from the starting point with coordinate (x, y) to the end point with coordinates2 (x2, y2).\n"
                            "* `type`: Input the specified text into the activated input box.\n"
                            "* `answer`: Output the answer.\n"
                            "* `system_button`: Press the system button.\n"
                            "* `wait`: Wait specified seconds for the change to happen.\n"
                            "* `terminate`: Terminate the current task and report its completion status."
                        ),
                        "enum": [
                            "click",
                            "long_press",
                            "swipe",
                            "type",
                            "answer",
                            "system_button",
                            "wait",
                            "terminate",
                        ],
                        "type": "string",
                    },
                    "coordinate": {
                        "description": "(x, y): The x and y coordinates. Required only by `action=click`, `action=long_press`, and `action=swipe`.",
                        "type": "array",
                        "items": {"type": "number"},
                    },
                    "coordinate2": {
                        "description": "(x, y): The end coordinates. Required only by `action=swipe`.",
                        "type": "array",
                        "items": {"type": "number"},
                    },
                    "text": {
                        "description": "Required only by `action=type` and `action=answer`.",
                        "type": "string",
                    },
                    "time": {
                        "description": "The seconds to wait. Required only by `action=long_press` and `action=wait`.",
                        "type": "number",
                    },
                    "button": {
                        "description": "Required only by `action=system_button`.",
                        "enum": ["Back", "Home", "Menu", "Enter"],
                        "type": "string",
                    },
                    "status": {
                        "description": "Required only by `action=terminate`.",
                        "enum": ["success", "failure"],
                        "type": "string",
                    },
                },
                "required": ["action"],
                "type": "object",
            },
        },
    }
]


def _fill_array_items(node: Any, key: str | None = None) -> Any:
    if isinstance(node, dict):
        if node.get("type") == "array" and "items" not in node:
            node["items"] = (
                {"type": "number"}
                if key in {"coordinate", "coordinate2"}
                else {"type": "string"}
            )
        for child_key, value in node.items():
            _fill_array_items(value, child_key if isinstance(child_key, str) else key)
    elif isinstance(node, list):
        for value in node:
            _fill_array_items(value, key)
    return node


def mobile_use_tool(*, include_open_app: bool = True) -> dict[str, Any]:
    """Official ``mobile_use`` schema, with MobileGym ``open_app`` on ``text``."""

    tool = _fill_array_items(copy.deepcopy(QWEN35_TOOLS[0]))
    if not include_open_app:
        return tool
    action = tool["function"]["parameters"]["properties"]["action"]
    enum = list(action.get("enum") or [])
    if "open_app" not in enum:
        enum.append("open_app")
        action["enum"] = enum
        action["description"] = (
            str(action.get("description") or "")
            + "\n* `open_app`: Open an installed app. Put its display name or id in `text` (e.g. 微信 / wechat / calendar). Unknown names return APP_NOT_FOUND; retry with another installed name or tap the launcher."
        )
        text = tool["function"]["parameters"]["properties"]["text"]
        text["description"] = (
            "Required by `type`, `answer`, and `open_app` (app name or id)."
        )
    return tool


def stable_session_tools() -> list[dict[str, Any]]:
    return [mobile_use_tool()]


def session_family(model_name: str | None) -> str:
    """Match official backends plus GLM: deepseek / kimi-k3 / gemini / glm / qwen."""

    name = (model_name or "").lower().replace("_", "-")
    if "deepseek" in name:
        return "deepseek"
    if "kimi-k3" in name:
        return "kimi_k3"
    if "gemini" in name:
        return "gemini"
    # ``autoglm-phone`` must stay on the Qwen default; only Zhipu GLM ids.
    if name.startswith("glm-") or "/glm-" in name or name.startswith("chatglm"):
        return "glm"
    return "qwen"


def session_user_prompt_template(family: str) -> str:
    if family == "gemini":
        return GEMINI_SESSION_USER_PROMPT
    if family == "kimi_k3":
        return KIMI_K3_SESSION_USER_PROMPT
    if family == "deepseek":
        return DEEPSEEK_V4_SESSION_USER_PROMPT
    if family == "glm":
        return GLM_SESSION_USER_PROMPT
    return QWEN35_SESSION_USER_PROMPT


def session_uses_api_tools(family: str, tool_call_mode: str = "native") -> bool:
    if family == "gemini":
        return False
    if family in {"kimi_k3", "deepseek", "glm"}:
        return True
    return tool_call_mode == "native"


def session_exposes_app_tools_in_api(family: str) -> bool:
    """GLM cannot call text-injected XML tools; put current-app tools in ``tools=``."""

    return family == "glm"


def session_observation_role(family: str) -> str:
    return "user" if family == "gemini" else "tool"


def session_system_prompt(
    *,
    tool_call_mode: str = "native",
    require_think_tags: bool = False,
    interaction_mode: str = "gui_only",
    model_name: str | None = None,
    extra_policy: str = "",
    thought_session: bool = False,
) -> str:
    del require_think_tags
    family = session_family(model_name)
    if thought_session:
        family = "qwen"
        prompt = (
            QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT_HYBRID
            if interaction_mode != "gui_only"
            else QWEN35_SESSION_SYSTEM_PROMPT_THOUGHT
        )
    elif family == "gemini":
        prompt = GEMINI_SESSION_SYSTEM_PROMPT
    elif family == "kimi_k3":
        prompt = KIMI_K3_SESSION_SYSTEM_PROMPT
    elif family == "deepseek":
        prompt = DEEPSEEK_V4_SESSION_SYSTEM_PROMPT
    elif family == "glm":
        prompt = GLM_SESSION_SYSTEM_PROMPT
    elif tool_call_mode == "native":
        prompt = QWEN35_SESSION_SYSTEM_PROMPT_NATIVE
    else:
        prompt = QWEN35_SESSION_SYSTEM_PROMPT_NO_THINK
    if interaction_mode != "gui_only" and not thought_session:
        addendum = (
            GLM_HYBRID_SESSION_ADDENDUM if family == "glm" else HYBRID_SESSION_ADDENDUM
        )
        prompt = prompt.rstrip() + "\n" + addendum
    extra = str(extra_policy or "").strip()
    if extra:
        prompt = prompt.rstrip() + "\n\n# Demo policy\n" + extra + "\n"
    return prompt


def app_tool_to_openai(definition: dict[str, Any]) -> dict[str, Any]:
    description = str(definition.get("description") or "")
    annotations = definition.get("annotations") or {}
    ui_effect = str(annotations.get("uiEffect") or "none")
    if ui_effect == "none":
        description += " This tool does not promise to change the current UI."
    else:
        description += (
            " When this call returns, its target UI is rendered. "
            "Inspect the next screenshot before continuing with GUI actions."
        )
    return {
        "type": "function",
        "function": {
            "name": str(definition["name"]),
            "description": description.strip(),
            "parameters": definition.get("inputSchema")
            or {"type": "object", "properties": {}},
        },
    }


def session_tools_with_app_tools(definitions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """``mobile_use`` plus the current foreground app's extra tools."""

    tools = stable_session_tools()
    seen = {"mobile_use"}
    for item in definitions:
        if not isinstance(item, dict) or not item.get("name"):
            continue
        name = str(item["name"])
        if name in seen:
            continue
        seen.add(name)
        tools.append(_fill_array_items(app_tool_to_openai(item)))
    return tools


def format_app_switch_user_text(
    app: str | None,
    definitions: list[dict[str, Any]],
    *,
    expose_in_api: bool = False,
    thought_session: bool = False,
) -> str:
    label = str(app or "").strip() or "launcher"
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in definitions:
        if not isinstance(item, dict) or not item.get("name"):
            continue
        name = str(item["name"])
        if name in seen or name == "mobile_use":
            continue
        seen.add(name)
        rows.append(_fill_array_items(app_tool_to_openai(item)))
    if not rows:
        later = "tool message" if thought_session else "user message"
        return (
            f"Foreground app changed to {label}. "
            "No extra app tools are available. Only call `mobile_use` until a later "
            f"{later} lists tools for a new app."
        )
    if expose_in_api:
        names = ", ".join(f"`{row['function']['name']}`" for row in rows)
        return (
            f"Foreground app changed to {label}. The API `tools=` list now includes "
            f"`mobile_use` plus the extra tools for this app: {names}. "
            "Call them as native function calls. They are valid only while this app "
            "stays in the foreground. Do not call tools from a previous app."
        )
    dumped = "\n".join(json.dumps(row, ensure_ascii=False) for row in rows)
    if thought_session:
        tools_note = (
            "There is no API `tools=` list; call these extra tools with the same "
            "`<tool_call>` XML as `mobile_use`."
        )
    else:
        tools_note = (
            "The API `tools=` list remains only `mobile_use`; call these extra tools "
            "with the same `<tool_call>` XML format."
        )
    return (
        f"Foreground app changed to {label}. Extra app tools for this app are listed "
        "below. They are valid only while this app stays in the foreground. "
        f"Do not call tools from a previous app. {tools_note}\n"
        "<tools>\n"
        f"{dumped}\n"
        "</tools>"
    )


_TOOL_CALL_RE = re.compile(r"<tool_call>\s*([\s\S]*?)\s*</tool_call>", re.IGNORECASE)
_FUNCTION_RE = re.compile(
    r"<function\s*=\s*([A-Za-z_][A-Za-z0-9_.:-]*)\s*>\s*([\s\S]*?)\s*</function>",
    re.IGNORECASE,
)
_PARAMETER_RE = re.compile(
    r"<parameter\s*=\s*([A-Za-z_][A-Za-z0-9_.:-]*)\s*>\s*([\s\S]*?)\s*</parameter>",
    re.IGNORECASE,
)
_THOUGHT_LINE_RE = re.compile(r"(?im)^\s*Thought\s*:")
_THOUGHT_RETRY_USER = (
    "Your previous reply was missing a Thought: paragraph. "
    "Output exactly: a Thought: paragraph, then one "
    "<tool_call>...</tool_call> block. Do not use <think> tags."
)


@dataclass
class Qwen35SessionAgentConfig:
    verbose: bool = True


@dataclass
class SessionStepResult:
    response: str
    parsed: dict[str, Any] | None
    done: bool
    summary: str = ""
    messages: list[dict[str, Any]] = field(default_factory=list)


class Qwen35SessionAgent:
    """Multi-turn session protocol adapter; the caller owns env.step / callTool."""

    def __init__(
        self,
        llm: Any,
        *,
        last_n: int = 3,
        enable_thinking: bool = True,
        require_think_tags: bool = False,
        tool_call_mode: str = "native",
        max_tokens: int = 8192,
        extra_body: dict[str, Any] | None = None,
        verbose: bool = True,
        interaction_mode: str = "gui_only",
        physical_size: tuple[int, int] = (1080, 2400),
        model_name: str | None = None,
        reasoning_effort: str = "max",
        extra_policy: str = "",
        thought_session: bool = False,
    ):
        thought_session = bool(thought_session)
        mode = "xml" if thought_session else str(tool_call_mode or "native").strip().lower()
        if mode not in {"native", "xml"}:
            raise ValueError(f"qwen35_tool_call_mode must be native|xml, got {tool_call_mode!r}")
        self.llm = llm
        self.last_n = max(1, int(last_n))
        self.thought_session = thought_session
        self.enable_thinking = False if thought_session else bool(enable_thinking)
        self.tool_call_mode = mode
        self.max_tokens = int(max_tokens)
        self.extra_body = dict(extra_body or {})
        self.verbose = bool(verbose)
        self.config = Qwen35SessionAgentConfig(verbose=self.verbose)
        self.physical_size = physical_size
        self.model_name = str(model_name or getattr(llm, "model", "") or "")
        self.session_family = "qwen" if thought_session else session_family(self.model_name)
        self.reasoning_effort = str(reasoning_effort or "max")
        self._user_prompt = session_user_prompt_template(self.session_family)
        self._system_prompt = session_system_prompt(
            tool_call_mode=mode,
            require_think_tags=False if thought_session else require_think_tags,
            interaction_mode=interaction_mode,
            model_name=self.model_name,
            extra_policy=extra_policy,
            thought_session=thought_session,
        )
        self._session_messages: list[dict[str, Any]] = []
        self._turn_tools: list[dict[str, Any]] | None = None
        self._next_observation_text: str | None = None
        self._next_user_text: str | None = None
        self._last_tool_name = "mobile_use"
        self._last_tool_call_id: str | None = None
        self._tool_call_counter = 0
        self._last_action_sig = ""
        self._repeat_time = 0
        self.last_messages: list[dict[str, Any]] = []
        self.last_response = ""
        self._task = ""
        self._previous_app: str | None = None
        self._last_call_name = "mobile_use"
        self._last_call_args: dict[str, Any] = {}

    def reset(self, task: str = "") -> None:
        self._task = task
        self._previous_app = None
        self._last_call_name = "mobile_use"
        self._last_call_args = {}
        self._session_messages = []
        self._turn_tools = None
        self._next_observation_text = None
        self._next_user_text = None
        self._last_tool_name = "mobile_use"
        self._last_tool_call_id = None
        self._tool_call_counter = 0
        self._last_action_sig = ""
        self._repeat_time = 0
        self.last_messages = []
        self.last_response = ""

    def set_turn_tools(self, tools: list[dict[str, Any]] | None) -> None:
        self._turn_tools = tools

    def set_next_observation_text(self, text: str | None) -> None:
        self._next_observation_text = text

    def set_next_user_text(self, text: str | None) -> None:
        self._next_user_text = text

    def act(
        self,
        obs: Observation,
        app_tool_definitions: list[dict[str, Any]],
        previous_feedback: StepFeedback | None,
        foreground_app: str | None = None,
        interaction_mode: str = HYBRID_MODE,
    ) -> ParsedModelResponse:
        current_app = obs.current_app if foreground_app is None else foreground_app
        expose_in_api = (
            not self.thought_session
            and interaction_mode != GUI_ONLY_MODE
            and session_exposes_app_tools_in_api(self.session_family)
        )
        if self.thought_session:
            self.set_turn_tools(None)
        elif expose_in_api:
            self.set_turn_tools(session_tools_with_app_tools(app_tool_definitions))
        else:
            self.set_turn_tools(stable_session_tools())
        app_key = str(current_app or "")
        if (
            interaction_mode != GUI_ONLY_MODE
            and self._previous_app is not None
            and app_key != self._previous_app
        ):
            self.set_next_user_text(
                format_app_switch_user_text(
                    current_app,
                    app_tool_definitions,
                    expose_in_api=expose_in_api,
                    thought_session=self.thought_session,
                )
            )
        if previous_feedback is not None and (
            previous_feedback.name != "mobile_use" or not previous_feedback.ok
        ):
            self.set_next_observation_text(
                json.dumps(previous_feedback.to_dict(), ensure_ascii=False)
            )
        self._previous_app = app_key
        result = self.step(self._task, obs)
        if not result.parsed:
            raise ToolCallParseError(result.summary or "No valid tool_call")
        name = self._last_call_name
        call = FunctionCall(
            name=name,
            arguments=_to_mobile_use_arguments(name, self._last_call_args),
        )
        return ParsedModelResponse(
            thought=_extract_thought(result.response),
            action=name,
            call=call,
            raw_response=result.response,
        )

    def _chat_args(self) -> dict[str, Any]:
        extra_body = dict(self.extra_body)
        if self.thought_session:
            extra_body.setdefault(
                "chat_template_kwargs", {"enable_thinking": False}
            )
            args: dict[str, Any] = {
                "temperature": 0,
                "max_tokens": self.max_tokens,
            }
            if extra_body:
                args["extra_body"] = extra_body
            return args
        family = self.session_family
        args: dict[str, Any] = {
            "temperature": 0,
            "max_tokens": self.max_tokens,
        }
        extra_body = dict(self.extra_body)
        tools = self._turn_tools if self._turn_tools is not None else stable_session_tools()
        if family == "gemini":
            args["tool_choice"] = "none"
            if self.enable_thinking:
                level = "low" if self.reasoning_effort.strip().lower() == "low" else "high"
                extra_body.setdefault(
                    "extra_body",
                    {
                        "google": {
                            "thinking_config": {
                                "include_thoughts": True,
                                "thinking_level": level,
                            }
                        }
                    },
                )
            if extra_body:
                args["extra_body"] = extra_body
            return args
        if family == "kimi_k3":
            args["tools"] = tools
            args["tool_choice"] = "auto"
            effort = self.reasoning_effort.strip().lower()
            if effort not in {"low", "high", "max"}:
                effort = "max"
            args["reasoning_effort"] = effort
            if extra_body:
                args["extra_body"] = extra_body
            return args
        if family == "deepseek":
            args["tools"] = tools
            args["tool_choice"] = "auto"
            thinking_type = "enabled" if self.enable_thinking else "disabled"
            extra_body.setdefault("thinking", {"type": thinking_type})
            args["extra_body"] = extra_body
            if self.enable_thinking:
                effort = {"low": "high", "high": "high"}.get(
                    self.reasoning_effort.strip().lower(), "max"
                )
                args["reasoning_effort"] = effort
            return args
        if family == "glm":
            args["tools"] = tools
            args["tool_choice"] = "auto"
            extra_body.setdefault(
                "thinking",
                {"type": "enabled" if self.enable_thinking else "disabled"},
            )
            if extra_body:
                args["extra_body"] = extra_body
            return args
        extra_body.setdefault(
            "chat_template_kwargs", {"enable_thinking": self.enable_thinking}
        )
        args["extra_body"] = extra_body
        if session_uses_api_tools(family, self.tool_call_mode):
            args["tools"] = tools
            args["tool_choice"] = "auto"
            return args

    def _chat_with_thought_retry(
        self, api_messages: list[dict[str, Any]], args: dict[str, Any]
    ) -> tuple[Any, str, Any]:
        messages = list(api_messages)
        result = None
        content = ""
        raw = None
        for attempt in range(4):
            result = self.llm.chat(messages=messages, args=args)
            raw = getattr(result, "raw", None)
            content = str(getattr(result, "content", "") or "")
            if not self.thought_session or _THOUGHT_LINE_RE.search(content):
                return result, content, raw
            if attempt >= 3:
                break
            if self.verbose:
                print(f"[qwen35_thought_session] missing Thought:; retrying ({attempt + 1}/4)")
            messages = list(api_messages) + [
                {"role": "user", "content": _THOUGHT_RETRY_USER}
            ]
        return result, content, raw

    def step(self, instruction: str, obs: Observation) -> SessionStepResult:
        screenshot = _image_part(obs)
        # Tool results and app-switch schemas travel inside the observation message
        # rather than a standalone user turn. Qwen's chat template folds a tool
        # message's text parts into the same <tool_response> block, while a bare user
        # turn would become its ``last_query_index`` and strip the thinking from every
        # earlier assistant turn.
        pending = [
            text for text in (self._next_observation_text, self._next_user_text) if text
        ]
        self._next_observation_text = None
        self._next_user_text = None
        content: list[dict[str, Any]] = [{"type": "text", "text": text} for text in pending]
        if not self._session_messages:
            content.insert(
                0,
                {"type": "text", "text": self._user_prompt.format(instruction=instruction)},
            )
            content.append(screenshot)
            self._session_messages = [
                {
                    "role": "system",
                    "content": [{"type": "text", "text": self._system_prompt}],
                },
                {"role": "user", "content": content},
            ]
        else:
            self._tool_call_counter += 1
            tool_call_id = self._last_tool_call_id or f"mobile_use_{self._tool_call_counter}"
            content.append(screenshot)
            if (
                not self.thought_session
                and session_observation_role(self.session_family) == "user"
            ):
                obs_msg: dict[str, Any] = {
                    "role": "user",
                    "_session_observation": True,
                    "content": content,
                }
            else:
                obs_msg = {
                    "role": "tool",
                    "name": self._last_tool_name,
                    "tool_call_id": tool_call_id,
                    "content": content,
                }
            self._session_messages.append(obs_msg)

        api_messages = _strip_internal(_collapse_old_images(self._session_messages, self.last_n))
        args = self._chat_args()
        result, content, raw = self._chat_with_thought_retry(api_messages, args)
        del result
        self.last_messages = api_messages
        tool_call, tool_call_id, assistant_record = _parse_model_output(
            raw, content, prefer_xml=self.thought_session
        )
        if self.thought_session:
            content = normalize_thought_session_content(content)
            assistant_record = {
                "role": "assistant",
                "content": content,
            }
            tool_call = parse_session_tool_call(content) or tool_call
        self.last_response = _assistant_text(assistant_record, content)
        if self.verbose:
            print(self.last_response)
            print("=" * 50)
        self._session_messages.append(assistant_record)
        if tool_call_id:
            self._last_tool_call_id = tool_call_id

        if not tool_call:
            return SessionStepResult(
                response=self.last_response,
                parsed=None,
                done=True,
                summary="No valid <tool_call> found in model output.",
                messages=list(self._session_messages),
            )

        name = str(tool_call.get("name") or "mobile_use")
        arguments = tool_call.get("arguments") if isinstance(tool_call.get("arguments"), dict) else {}
        self._last_tool_name = name
        self._last_call_name = name
        self._last_call_args = arguments
        width, height = self.physical_size
        if name != "mobile_use":
            parsed = {
                "action_type": "mcp_tool",
                "tool_name": name,
                "arguments": arguments,
            }
            return SessionStepResult(
                response=self.last_response,
                parsed=parsed,
                done=False,
                messages=list(self._session_messages),
            )

        action_name = str(arguments.get("action") or "")
        parsed = transform_mobile_use(action_name, arguments, width, height)
        try:
            action_sig = json.dumps(arguments, ensure_ascii=False, sort_keys=True)
        except TypeError:
            action_sig = str(arguments)
        if self._last_action_sig == action_sig:
            self._repeat_time += 1
        else:
            self._repeat_time = 0
        self._last_action_sig = action_sig
        done = parsed.get("action_type") in {"answer", "status"}
        summary = ""
        if self._repeat_time >= 10:
            done = True
            summary = "Terminated due to repeated identical actions."
        return SessionStepResult(
            response=self.last_response,
            parsed=parsed,
            done=done,
            summary=summary,
            messages=list(self._session_messages),
        )

    def export_session_record(self, *, episode_id: str, goal: str) -> dict[str, Any]:
        messages: list[dict[str, str]] = []
        images: list[str] = []
        img_i = 0
        for msg in self._session_messages:
            role = str(msg.get("role") or "")
            content = msg.get("content")
            n_img = _image_count(content)
            if role == "system":
                messages.append({"role": "system", "content": _text_content(content).strip()})
            elif role == "user":
                text = _text_content(content).rstrip()
                if msg.get("_session_observation"):
                    count = n_img if n_img > 0 else 1
                    payload = (text + "\n" if text else "") + ("<image>" * count)
                    messages.append({"role": "tool", "content": payload})
                    for _ in range(count):
                        images.append(f"screenshot_step{img_i}.png")
                        img_i += 1
                    continue
                if n_img:
                    if "<image>" not in text:
                        text = (text + "\n" if text else "") + ("<image>" * n_img)
                    for _ in range(n_img):
                        images.append(f"screenshot_step{img_i}.png")
                        img_i += 1
                messages.append({"role": "user", "content": text})
            elif role == "assistant":
                messages.append({"role": "assistant", "content": _assistant_text(msg, "")})
            elif role == "tool":
                count = n_img if n_img > 0 else 1
                text = _text_content(content)
                payload = (text + "\n" if text else "") + ("<image>" * count)
                messages.append({"role": "tool", "content": payload})
                for _ in range(count):
                    images.append(f"screenshot_step{img_i}.png")
                    img_i += 1
        return {
            "id": episode_id,
            "runtime": (
                QWEN35_THOUGHT_SESSION_RUNTIME
                if self.thought_session
                else QWEN35_SESSION_RUNTIME
            ),
            "goal": goal,
            "messages": messages,
            "images": images,
            "done": True,
        }


def _to_mobile_use_arguments(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Bridge the official session schema to ``bench_env.hybrid_agent.mobile_use``.

    The session prompt names the app in ``text`` and exposes a ``Menu`` button;
    mock's GUI tool expects ``app`` and only Back/Home/Recent/Enter.
    """

    result = dict(arguments)
    if name != "mobile_use":
        return result
    action = str(result.get("action") or "")
    if action == "open_app" and not str(result.get("app") or "").strip():
        result["app"] = str(result.get("text") or result.get("app_name") or "")
    elif action == "system_button" and str(result.get("button") or "").lower() == "menu":
        result["button"] = "Recent"
    return result


def transform_mobile_use(
    action: str, arguments: dict[str, Any], width: int, height: int
) -> dict[str, Any]:
    """Map official mobile_use arguments to the MCP parsed-action dict."""

    if action == "open_app":
        return {
            "action_type": "open_app",
            "app_name": str(arguments.get("text") or arguments.get("app_name") or arguments.get("app") or ""),
        }
    if action in {"click", "left_click"}:
        x, y = _coord(arguments.get("coordinate"), width, height)
        return {"action_type": "click", "x": x, "y": y}
    if action == "long_press":
        x, y = _coord(arguments.get("coordinate"), width, height)
        return {"action_type": "long_press", "x": x, "y": y}
    if action == "swipe":
        x, y = _coord(arguments.get("coordinate"), width, height)
        x2, y2 = _coord(arguments.get("coordinate2"), width, height)
        return {"action_type": "swipe", "x": x, "y": y, "x2": x2, "y2": y2}
    if action == "type":
        return {"action_type": "input_text", "text": str(arguments.get("text") or "")}
    if action == "system_button":
        button = str(arguments.get("button") or "").lower()
        mapping = {
            "home": "navigate_home",
            "back": "navigate_back",
            "enter": "keyboard_enter",
        }
        return {"action_type": mapping.get(button, "wait")}
    if action == "wait":
        return {"action_type": "wait"}
    if action == "answer":
        return {"action_type": "answer", "text": str(arguments.get("text") or "")}
    if action == "terminate":
        status = str(arguments.get("status") or "").lower()
        if status == "success":
            return {"action_type": "status", "goal_status": "complete", "text": str(arguments.get("text") or "")}
        if status == "failure":
            return {"action_type": "status", "goal_status": "infeasible", "text": str(arguments.get("text") or "")}
        raise ValueError(f"Unknown terminate status: {status}")
    return {"action_type": "wait"}


def parsed_to_action(parsed: dict[str, Any], width: int, height: int, raw: str = ""):
    from bench_env.env.base import Action, ActionType

    at = str(parsed.get("action_type") or "")
    kwargs = {"raw_response": raw}

    def _norm(x: float, y: float) -> list[int]:
        return [
            int(round(float(x) / max(int(width), 1) * 1000)),
            int(round(float(y) / max(int(height), 1) * 1000)),
        ]

    if at == "click":
        return Action.click(_norm(parsed["x"], parsed["y"]), **kwargs)
    if at == "long_press":
        return Action(ActionType.LONG_PRESS, {"point": _norm(parsed["x"], parsed["y"])}, **kwargs)
    if at == "swipe":
        return Action.swipe(
            _norm(parsed["x"], parsed["y"]),
            _norm(parsed.get("x2", parsed["x"]), parsed.get("y2", parsed["y"])),
            **kwargs,
        )
    if at == "input_text":
        return Action.type_text(str(parsed.get("text") or ""), **kwargs)
    if at == "navigate_home":
        return Action.home(**kwargs)
    if at == "navigate_back":
        return Action.back(**kwargs)
    if at == "keyboard_enter":
        return Action(ActionType.ENTER, {}, **kwargs)
    if at == "open_app":
        return Action.awake(str(parsed.get("app_name") or ""), **kwargs)
    if at == "wait":
        return Action.wait(1.0, **kwargs)
    if at == "answer":
        return Action.answer(str(parsed.get("text") or ""), **kwargs)
    if at == "status":
        if str(parsed.get("goal_status") or "") == "complete":
            return Action.complete(str(parsed.get("text") or ""), **kwargs)
        return Action.abort(str(parsed.get("goal_status") or "infeasible"), **kwargs)
    return Action.wait(0.5, **kwargs)


def parse_session_tool_call(text: str) -> dict[str, Any] | None:
    match = _TOOL_CALL_RE.search(text or "")
    if not match:
        return None
    payload = match.group(1).strip()
    if payload.startswith("{"):
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            data = None
        if isinstance(data, dict) and data.get("name"):
            arguments = data.get("arguments")
            return {
                "name": str(data["name"]),
                "arguments": arguments if isinstance(arguments, dict) else {},
            }
    func = _FUNCTION_RE.search(payload)
    if not func:
        return None
    arguments: dict[str, Any] = {}
    for name, raw_value in _PARAMETER_RE.findall(func.group(2)):
        value = raw_value.strip()
        try:
            arguments[name] = json.loads(value)
        except json.JSONDecodeError:
            arguments[name] = value
    return {"name": func.group(1).strip(), "arguments": arguments}


def _coord(value: Any, width: int, height: int) -> tuple[float, float]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        return 0.0, 0.0
    x, y = float(value[0]), float(value[1])
    return x / 1000 * width, y / 1000 * height


def _image_part(obs: Observation) -> dict[str, Any]:
    return {"type": "image_url", "image_url": {"url": obs.image_data_url}}


def _image_count(content: Any) -> int:
    if not isinstance(content, list):
        return 0
    return sum(1 for part in content if isinstance(part, dict) and part.get("type") == "image_url")


def _message_has_image(msg: dict[str, Any]) -> bool:
    return _image_count(msg.get("content")) > 0 or msg.get("role") == "tool"


def _collapse_old_images(messages: list[dict[str, Any]], last_n: int) -> list[dict[str, Any]]:
    indices = [i for i, msg in enumerate(messages) if _message_has_image(msg)]
    keep = set(indices[-max(1, last_n):]) if indices else set()
    out: list[dict[str, Any]] = []
    for i, msg in enumerate(messages):
        if i in keep or not _message_has_image(msg):
            out.append(msg)
            continue
        new_msg = dict(msg)
        content = msg.get("content")
        if isinstance(content, list):
            text_parts = [
                part
                for part in content
                if not (isinstance(part, dict) and part.get("type") == "image_url")
            ]
            n_images = max(_image_count(content), 1)
            text_parts.extend(
                {"type": "text", "text": COLLAPSED_SCREENSHOT_TEXT} for _ in range(n_images)
            )
            new_msg["content"] = text_parts
        else:
            new_msg["content"] = [{"type": "text", "text": COLLAPSED_SCREENSHOT_TEXT}]
        out.append(new_msg)
    return out


def _strip_internal(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{k: v for k, v in msg.items() if not str(k).startswith("_")} for msg in messages]


def _text_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            str(part.get("text") or "")
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        )
    return ""


def _assistant_text(record: dict[str, Any], fallback: str) -> str:
    text = record.get("content")
    if isinstance(text, str) and text.strip():
        return text
    if text is None or text == "":
        calls = record.get("tool_calls") or []
        if calls:
            function = (calls[0] or {}).get("function") or {}
            name = function.get("name") or "mobile_use"
            raw_args = function.get("arguments") or "{}"
            return f"<tool_call>\n{json.dumps({'name': name, 'arguments': _loads(raw_args)}, ensure_ascii=False)}\n</tool_call>"
    rendered = _text_content(text)
    return rendered or fallback


def _loads(value: Any) -> Any:
    if isinstance(value, dict):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return {}


def _parse_model_output(
    raw: Any, content: str, *, prefer_xml: bool = False
) -> tuple[dict[str, Any] | None, str | None, dict[str, Any]]:
    message = {}
    if isinstance(raw, dict):
        try:
            message = raw.get("choices", [{}])[0].get("message") or {}
        except (IndexError, AttributeError, TypeError):
            message = {}
    tool_calls = message.get("tool_calls") if isinstance(message, dict) else None
    native = None
    tool_call_id = None
    if tool_calls:
        call = tool_calls[0] if isinstance(tool_calls, list) else None
        if isinstance(call, dict):
            function = call.get("function") or {}
            native = {
                "name": str(function.get("name") or "mobile_use"),
                "arguments": _loads(function.get("arguments")),
            }
            tool_call_id = str(call.get("id") or "") or None
    xml = parse_session_tool_call(content)
    tool_call = xml if prefer_xml and xml else (native or xml)
    assistant: dict[str, Any] = {"role": "assistant", "content": content or None}
    if isinstance(message, dict) and message.get("reasoning_content"):
        assistant["reasoning_content"] = message["reasoning_content"]
    if tool_calls:
        assistant["tool_calls"] = tool_calls
        if not content:
            assistant["content"] = None
    return tool_call, tool_call_id, assistant


_THINK_BLOCK_RE = re.compile(r"<think>\s*([\s\S]*?)\s*</think>", re.IGNORECASE)
_THINKING_BLOCK_RE = re.compile(r"<thinking>\s*([\s\S]*?)\s*</thinking>", re.IGNORECASE)
_THINK_TAG_RE = re.compile(r"</?think(?:ing)?\s*>", re.IGNORECASE)
_TOOL_BLOCK_RE = re.compile(r"<tool_call\b[\s\S]*?</tool_call>", re.IGNORECASE)


def normalize_thought_session_content(response: str) -> str:
    """Keep ``Thought:`` + XML ``<tool_call>``; do not wrap the prefix in ``<think>``."""

    text = (response or "").strip()
    if not text:
        return text
    think_match = _THINK_BLOCK_RE.search(text) or _THINKING_BLOCK_RE.search(text)
    think = think_match.group(1).strip() if think_match else ""
    tool_match = _TOOL_BLOCK_RE.search(text)
    if not tool_match:
        prefix = think or _THINK_TAG_RE.sub("", text).strip()
        if prefix and not _THOUGHT_LINE_RE.search(prefix):
            return f"Thought: {prefix}"
        return prefix or text
    tool = tool_match.group(0).strip()
    prefix = text[: tool_match.start()].strip()
    prefix = _THINK_TAG_RE.sub("", prefix).strip()
    if think and not prefix:
        prefix = think
    if prefix and not _THOUGHT_LINE_RE.search(prefix):
        prefix = f"Thought: {prefix}"
    if prefix:
        return f"{prefix}\n{tool}"
    return tool
