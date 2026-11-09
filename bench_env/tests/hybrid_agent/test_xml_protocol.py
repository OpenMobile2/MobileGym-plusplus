import pytest

from bench_env.hybrid_agent.mobile_use import MOBILE_USE_FUNCTION
from bench_env.hybrid_agent.xml_protocol import ToolCallParseError, parse_tool_call_response


SCHEMAS = {
    "mobile_use": MOBILE_USE_FUNCTION["function"]["parameters"],
    "calendar__open_date": {
        "type": "object",
        "properties": {"date": {"type": "string"}},
        "required": ["date"],
        "additionalProperties": False,
    },
}


def test_parses_qwen_xml_and_json_arguments():
    response = """Thought: Open the requested day.
Action: Navigate with the Calendar tool.
<tool_call>
<function=calendar__open_date>
<parameter=date>
2026-07-14
</parameter>
</function>
</tool_call>"""

    parsed = parse_tool_call_response(response, SCHEMAS)

    assert parsed.thought == "Open the requested day."
    assert parsed.action == "Navigate with the Calendar tool."
    assert parsed.call.name == "calendar__open_date"
    assert parsed.call.arguments == {"date": "2026-07-14"}


def test_parses_mobile_coordinates_as_json_array():
    response = """Thought: Tap Calendar.
Action: Tap the icon.
<tool_call><function=mobile_use>
<parameter=action>click</parameter>
<parameter=coordinate>[120, 340]</parameter>
</function></tool_call>"""

    parsed = parse_tool_call_response(response, SCHEMAS)

    assert parsed.call.arguments == {"action": "click", "coordinate": [120, 340]}


@pytest.mark.parametrize(
    "body,error",
    [
        ("", "empty model response"),
        (
            "<tool_call><function=missing></function></tool_call>",
            "not available",
        ),
        (
            "<tool_call><function=calendar__open_date></function></tool_call>",
            "missing required",
        ),
        (
            "<tool_call><function=calendar__open_date><parameter=extra>x</parameter></function></tool_call>",
            "unknown parameter",
        ),
    ],
)
def test_rejects_invalid_or_unavailable_calls(body, error):
    with pytest.raises(ToolCallParseError, match=error):
        parse_tool_call_response(body, SCHEMAS)
