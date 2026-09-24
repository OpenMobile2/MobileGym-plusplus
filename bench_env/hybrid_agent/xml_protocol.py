"""Qwen-style XML function-call prompt rendering and response parsing."""

from __future__ import annotations

import json
import re
from typing import Any

from bench_env.hybrid_agent.types import FunctionCall, ParsedModelResponse


class ToolCallParseError(ValueError):
    """The model response does not contain one valid XML function call."""


_TOOL_CALL_RE = re.compile(r"<tool_call>(.*?)</tool_call>", re.IGNORECASE | re.DOTALL)
_FUNCTION_RE = re.compile(
    r"<function\s*=\s*([A-Za-z_][A-Za-z0-9_.:-]*)\s*>(.*?)</function>",
    re.IGNORECASE | re.DOTALL,
)
_PARAMETER_RE = re.compile(
    r"<parameter\s*=\s*([A-Za-z_][A-Za-z0-9_.:-]*)\s*>(.*?)</parameter>",
    re.IGNORECASE | re.DOTALL,
)


def model_function_definition(definition: dict[str, Any]) -> dict[str, Any]:
    """Convert a browser ToolDefinition to the prompt's function schema."""

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
            "parameters": definition.get("inputSchema") or {
                "type": "object",
                "properties": {},
            },
        },
    }


def render_tools_xml(functions: list[dict[str, Any]]) -> str:
    """Render function definitions inside the prompt's ``<tools>`` block."""

    rows = [json.dumps(item, ensure_ascii=False, separators=(",", ":")) for item in functions]
    return "<tools>\n" + "\n".join(rows) + "\n</tools>"


def parse_tool_call_response(
    response_text: str,
    schemas_by_name: dict[str, dict[str, Any]],
) -> ParsedModelResponse:
    """Parse exactly one Qwen-style XML call and coerce arguments by JSON schema."""

    raw = str(response_text or "").strip()
    if not raw:
        raise ToolCallParseError("empty model response")

    blocks = _TOOL_CALL_RE.findall(raw)
    if len(blocks) != 1:
        raise ToolCallParseError(f"expected exactly one <tool_call> block, got {len(blocks)}")

    function_match = _FUNCTION_RE.fullmatch(blocks[0].strip())
    if not function_match:
        raise ToolCallParseError("invalid <function=name> block")

    name = function_match.group(1).strip()
    if name not in schemas_by_name:
        raise ToolCallParseError(f"function is not available in this turn: {name}")

    schema = schemas_by_name[name]
    properties = schema.get("properties") or {}
    arguments: dict[str, Any] = {}
    function_body = function_match.group(2)
    matches = list(_PARAMETER_RE.finditer(function_body))
    residue = _PARAMETER_RE.sub("", function_body).strip()
    if residue:
        raise ToolCallParseError("unexpected text inside the function block")

    for match in matches:
        parameter_name = match.group(1).strip()
        if parameter_name in arguments:
            raise ToolCallParseError(f"duplicate parameter: {parameter_name}")
        if parameter_name not in properties and schema.get("additionalProperties") is False:
            raise ToolCallParseError(f"unknown parameter for {name}: {parameter_name}")
        arguments[parameter_name] = _decode_parameter(
            match.group(2).strip(), properties.get(parameter_name) or {}
        )

    missing = [item for item in schema.get("required") or [] if item not in arguments]
    if missing:
        raise ToolCallParseError(f"missing required parameters for {name}: {', '.join(missing)}")

    return ParsedModelResponse(
        thought=_extract_label(raw, "Thought"),
        action=_extract_label(raw, "Action"),
        call=FunctionCall(name=name, arguments=arguments),
        raw_response=raw,
    )


def _extract_label(text: str, label: str) -> str:
    match = re.search(
        rf"(?:^|\n)\s*{label}\s*:\s*(.*?)(?=\n\s*(?:Thought|Action)\s*:|\n\s*<tool_call>|$)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    return match.group(1).strip() if match else ""


def _decode_parameter(raw: str, schema: dict[str, Any]) -> Any:
    expected_type = schema.get("type")
    if expected_type == "string":
        try:
            decoded = json.loads(raw)
        except json.JSONDecodeError:
            return raw
        return decoded if isinstance(decoded, str) else raw

    try:
        return json.loads(raw)
    except json.JSONDecodeError as error:
        raise ToolCallParseError(
            f"parameter must contain valid JSON for type {expected_type or 'unknown'}: {raw}"
        ) from error
