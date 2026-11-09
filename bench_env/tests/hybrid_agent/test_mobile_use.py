import pytest

from bench_env.env.base import ActionType
from bench_env.hybrid_agent.mobile_use import (
    MobileUseArgumentError,
    mobile_use_function,
    to_mobilegym_action,
)
from bench_env.hybrid_agent.prompt import build_system_prompt


@pytest.mark.parametrize(
    "arguments,action_type,data",
    [
        ({"action": "click", "coordinate": [10, 20]}, ActionType.CLICK, {"point": [10.0, 20.0]}),
        (
            {"action": "swipe", "coordinate": [1, 2], "coordinate2": [3, 4]},
            ActionType.SWIPE,
            {"point1": [1.0, 2.0], "point2": [3.0, 4.0]},
        ),
        (
            {"action": "type", "text": "hello", "clear": True},
            ActionType.TYPE,
            {"value": "hello", "clear": True},
        ),
        ({"action": "system_button", "button": "Back"}, ActionType.BACK, {}),
        ({"action": "open_app", "app": "calendar"}, ActionType.AWAKE, {"value": "calendar"}),
        ({"action": "answer", "text": "42"}, ActionType.ANSWER, {"value": "42"}),
        (
            {"action": "terminate", "status": "success", "text": "done"},
            ActionType.COMPLETE,
            {"return": "done"},
        ),
    ],
)
def test_maps_to_mobilegym_action_space(arguments, action_type, data):
    action = to_mobilegym_action(arguments)
    assert action.action_type == action_type
    assert action.data == data


def test_rejects_out_of_range_coordinate():
    with pytest.raises(MobileUseArgumentError, match="0-1000"):
        to_mobilegym_action({"action": "click", "coordinate": [10, 1001]})


def test_physical_coordinate_mode_uses_original_screenshot_pixels():
    action = to_mobilegym_action(
        {"action": "click", "coordinate": [540, 1200]},
        coord_space="physical",
        physical_size=(1080, 2400),
    )
    assert action.data == {"point": [540.0, 1200.0]}

    with pytest.raises(MobileUseArgumentError, match="1080x2400"):
        to_mobilegym_action(
            {"action": "click", "coordinate": [1081, 1200]},
            coord_space="physical",
            physical_size=(1080, 2400),
        )


def test_physical_coordinate_mode_updates_tool_schema_and_prompt():
    function = mobile_use_function("physical", (1080, 2400))
    assert "1080x2400" in function["function"]["description"]
    prompt, _ = build_system_prompt(
        [], "launcher", "gui_only", "physical", (1080, 2400)
    )
    assert "original screenshot pixel coordinates" in prompt
    assert "x ranges from 0 to 1080, y ranges from 0 to 2400" in prompt
    assert "[176, 1723]" in prompt
    assert "normalized screenshot coordinates from 0 to 1000" not in prompt
