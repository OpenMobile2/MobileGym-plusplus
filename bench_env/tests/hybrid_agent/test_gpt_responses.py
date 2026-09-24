from bench_env.hybrid_agent.gpt_responses import (
    _computer_action_to_mobile_use,
    _function_tool,
)


def test_gpt_click_uses_original_pixels():
    assert _computer_action_to_mobile_use(
        {"type": "click", "x": 991, "y": 2223, "button": "left"}
    ) == {"action": "click", "coordinate": [991, 2223]}


def test_gpt_positive_vertical_scroll_becomes_finger_swipe_up():
    action = _computer_action_to_mobile_use(
        {"type": "scroll", "x": 540, "y": 1200, "scroll_y": 650, "scroll_x": 0}
    )
    assert action["action"] == "swipe"
    assert action["coordinate"][1] > action["coordinate2"][1]


def test_responses_function_tool_is_not_chat_completions_shape():
    tool = _function_tool(
        "open_app",
        "Open an app",
        {"type": "object", "properties": {"app": {"type": "string"}}},
    )
    assert tool["name"] == "open_app"
    assert "function" not in tool
