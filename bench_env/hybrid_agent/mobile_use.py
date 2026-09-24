"""The XML model-facing GUI tool and its MobileGym action mapping."""

from __future__ import annotations

import copy
from typing import Any

from bench_env.env.base import Action, ActionType


MOBILE_USE_NAME = "mobile_use"

MOBILE_USE_FUNCTION: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": MOBILE_USE_NAME,
        "description": (
            "Use the MobileGym touchscreen and system controls. Each call performs one "
            "GUI action. The screenshot uses normalized coordinates from 0 to 1000 on "
            "both axes, with (0, 0) at the top-left."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": [
                        "click",
                        "double_tap",
                        "long_press",
                        "type",
                        "swipe",
                        "drag",
                        "system_button",
                        "open_app",
                        "wait",
                        "answer",
                        "terminate",
                    ],
                    "description": (
                        "GUI action. answer records an answer but does not end the task; "
                        "call terminate after all requested work is complete."
                    ),
                },
                "coordinate": {
                    "type": "array",
                    "items": {"type": "number"},
                    "minItems": 2,
                    "maxItems": 2,
                    "description": "[x, y], required for click/double_tap/long_press and optional for type.",
                },
                "coordinate2": {
                    "type": "array",
                    "items": {"type": "number"},
                    "minItems": 2,
                    "maxItems": 2,
                    "description": "End [x, y], required for swipe and drag.",
                },
                "text": {
                    "type": "string",
                    "description": "Required for type and answer.",
                },
                "clear": {
                    "type": "boolean",
                    "default": False,
                    "description": "For type: clear the focused field before entering text.",
                },
                "time": {
                    "type": "number",
                    "minimum": 0,
                    "description": "Seconds for long_press or wait.",
                },
                "button": {
                    "type": "string",
                    "enum": ["Back", "Home", "Recent", "Enter"],
                    "description": "Required for system_button.",
                },
                "app": {
                    "type": "string",
                    "description": "App name or app id, required for open_app.",
                },
                "status": {
                    "type": "string",
                    "enum": ["success", "failure"],
                    "description": "Required for terminate.",
                },
            },
            "required": ["action"],
            "additionalProperties": False,
        },
    },
}


class MobileUseArgumentError(ValueError):
    """Invalid arguments for ``mobile_use``."""


def mobile_use_function(
    coord_space: str = "norm_0_1000",
    physical_size: tuple[int, int] = (1080, 2400),
) -> dict[str, Any]:
    """Return the model-facing GUI function for the configured coordinate space."""

    function = copy.deepcopy(MOBILE_USE_FUNCTION)
    if coord_space == "physical":
        width, height = physical_size
        function["function"]["description"] = (
            "Use the MobileGym touchscreen and system controls. Each call performs one "
            f"GUI action. The screenshot is {width}x{height}; use original screenshot "
            "pixel coordinates with (0, 0) at the top-left."
        )
        properties = function["function"]["parameters"]["properties"]
        properties["coordinate"]["description"] = (
            f"Original screenshot pixel [x, y]; x is 0-{width}, y is 0-{height}. "
            "Required for click/double_tap/long_press and optional for type."
        )
        properties["coordinate2"]["description"] = (
            f"End pixel [x, y]; x is 0-{width}, y is 0-{height}. "
            "Required for swipe and drag."
        )
    return function


def to_mobilegym_action(
    arguments: dict[str, Any],
    *,
    coord_space: str = "norm_0_1000",
    physical_size: tuple[int, int] = (1080, 2400),
) -> Action:
    """Translate one ``mobile_use`` call to the exact MobileGym action space."""

    action = str(arguments.get("action") or "").strip().lower()
    if action == "click":
        return Action(ActionType.CLICK, {"point": _point(arguments, "coordinate", coord_space, physical_size)})
    if action == "double_tap":
        return Action(ActionType.DOUBLE_TAP, {"point": _point(arguments, "coordinate", coord_space, physical_size)})
    if action == "long_press":
        seconds = _number(arguments.get("time", 0.8), "time")
        return Action(
            ActionType.LONG_PRESS,
            {
                "point": _point(arguments, "coordinate", coord_space, physical_size),
                "duration": int(seconds * 1000),
            },
        )
    if action == "type":
        data: dict[str, Any] = {
            "value": _required_text(arguments, "text"),
            "clear": bool(arguments.get("clear", False)),
        }
        if "coordinate" in arguments:
            data["point"] = _point(arguments, "coordinate", coord_space, physical_size)
        return Action(ActionType.TYPE, data)
    if action in {"swipe", "drag"}:
        action_type = ActionType.SWIPE if action == "swipe" else ActionType.DRAG
        return Action(
            action_type,
            {
                "point1": _point(arguments, "coordinate", coord_space, physical_size),
                "point2": _point(arguments, "coordinate2", coord_space, physical_size),
            },
        )
    if action == "system_button":
        button = _required_text(arguments, "button").lower()
        mapping = {
            "back": ActionType.BACK,
            "home": ActionType.HOME,
            "recent": ActionType.RECENT,
            "enter": ActionType.ENTER,
        }
        if button not in mapping:
            raise MobileUseArgumentError(f"unsupported system button: {button}")
        return Action(mapping[button], {})
    if action == "open_app":
        return Action(ActionType.AWAKE, {"value": _required_text(arguments, "app")})
    if action == "wait":
        return Action(ActionType.WAIT, {"value": _number(arguments.get("time", 1), "time")})
    if action == "answer":
        return Action(ActionType.ANSWER, {"value": _required_text(arguments, "text")})
    if action == "terminate":
        status = _required_text(arguments, "status").lower()
        message = str(arguments.get("text") or "")
        if status == "success":
            return Action(ActionType.COMPLETE, {"return": message})
        if status == "failure":
            return Action(ActionType.ABORT, {"value": message})
        raise MobileUseArgumentError("terminate status must be success or failure")
    raise MobileUseArgumentError(f"unsupported mobile_use action: {action or '<empty>'}")


def _required_text(arguments: dict[str, Any], name: str) -> str:
    value = arguments.get(name)
    if value is None or not str(value).strip():
        raise MobileUseArgumentError(f"{name} is required")
    return str(value)


def _number(value: Any, name: str) -> float:
    if isinstance(value, bool):
        raise MobileUseArgumentError(f"{name} must be a number")
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise MobileUseArgumentError(f"{name} must be a number") from error
    if number < 0:
        raise MobileUseArgumentError(f"{name} must be non-negative")
    return number


def _point(
    arguments: dict[str, Any],
    name: str,
    coord_space: str,
    physical_size: tuple[int, int],
) -> list[float]:
    value = arguments.get(name)
    if not isinstance(value, list) or len(value) != 2:
        raise MobileUseArgumentError(f"{name} must be a two-item coordinate array")
    point = [_number(item, name) for item in value]
    if coord_space == "physical":
        width, height = physical_size
        if point[0] > width or point[1] > height:
            raise MobileUseArgumentError(
                f"{name} must be within the {width}x{height} screenshot"
            )
    elif any(item > 1000 for item in point):
        raise MobileUseArgumentError(f"{name} values must be in the 0-1000 range")
    return point
