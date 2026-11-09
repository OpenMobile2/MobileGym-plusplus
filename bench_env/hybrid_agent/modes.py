"""Interaction policies supported by the XML mobile agent runtime."""

from __future__ import annotations


HYBRID_MODE = "hybrid"
GUI_ONLY_MODE = "gui_only"
INTERACTION_MODES = (HYBRID_MODE, GUI_ONLY_MODE)

HYBRID_XML_RUNTIME = "hybrid_xml"
QWEN35_SESSION_RUNTIME = "qwen35_session"
QWEN35_THOUGHT_SESSION_RUNTIME = "qwen35_thought_session"
SESSION_RUNTIMES = (QWEN35_SESSION_RUNTIME, QWEN35_THOUGHT_SESSION_RUNTIME)
BENCHMARK_RUNTIMES = (HYBRID_XML_RUNTIME, *SESSION_RUNTIMES)


def is_session_runtime(value: str) -> bool:
    return str(value or "").strip().lower() in SESSION_RUNTIMES


def validate_interaction_mode(value: str) -> str:
    """Return a normalized interaction mode or reject an unknown policy."""

    mode = str(value or "").strip().lower()
    if mode not in INTERACTION_MODES:
        choices = ", ".join(INTERACTION_MODES)
        raise ValueError(f"unsupported interaction mode {value!r}; choose one of: {choices}")
    return mode


def validate_runtime(value: str) -> str:
    runtime = str(value or "").strip().lower()
    if runtime not in BENCHMARK_RUNTIMES:
        choices = ", ".join(BENCHMARK_RUNTIMES)
        raise ValueError(f"unsupported runtime {value!r}; choose one of: {choices}")
    return runtime
