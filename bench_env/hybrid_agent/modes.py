"""Interaction policies supported by the XML mobile agent runtime."""

from __future__ import annotations


HYBRID_MODE = "hybrid"
GUI_ONLY_MODE = "gui_only"
INTERACTION_MODES = (HYBRID_MODE, GUI_ONLY_MODE)


def validate_interaction_mode(value: str) -> str:
    """Return a normalized interaction mode or reject an unknown policy."""

    mode = str(value or "").strip().lower()
    if mode not in INTERACTION_MODES:
        choices = ", ".join(INTERACTION_MODES)
        raise ValueError(f"unsupported interaction mode {value!r}; choose one of: {choices}")
    return mode
