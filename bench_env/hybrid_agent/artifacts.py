"""Human-readable artifacts for standalone hybrid-agent episodes."""

from __future__ import annotations

import html
import io
import json
from pathlib import Path
from typing import Any

from bench_env.env.base import Observation
from bench_env.hybrid_agent.xml_protocol import _extract_thought
from bench_env.hybrid_agent.types import (
    FunctionCall,
    HybridRunResult,
    HybridStepRecord,
    StepFeedback,
)

_APP_ZH = {
    "taobao": "淘宝",
    "wechat": "微信",
    "kapi": "卡皮记账",
    "jingdong": "京东",
    "ctrip": "携程",
    "dianping": "点评",
    "launcher": "桌面",
}
_GUI_ZH = {
    "click": "点击",
    "double_tap": "双击",
    "long_press": "长按",
    "type": "输入",
    "swipe": "滑动",
    "drag": "拖动",
    "wait": "等待",
    "terminate": "结束任务",
    "answer": "作答",
}


def format_live_action(call: dict[str, Any] | FunctionCall | None, spoken: str = "") -> str:
    """Human-readable left-console line for one GUI or App Tool call."""
    if call is None:
        return spoken.strip()
    if isinstance(call, FunctionCall):
        name = call.name
        args = call.arguments
    else:
        name = str(call.get("name") or "")
        args = call.get("arguments") or {}
    if name and name != "mobile_use":
        return f"{name}({json.dumps(args, ensure_ascii=False)})"
    act = str(args.get("action") or "").lower()
    if act == "open_app":
        return f"GUI 打开应用（捷径）{args.get('app') or ''}".strip()
    if act == "system_button":
        button = str(args.get("button") or "")
        labels = {"Home": "回桌面", "Back": "返回", "Recent": "多任务", "Enter": "回车"}
        return f"GUI {labels.get(button, button)}"
    spoken = spoken.strip()
    if spoken:
        return f"GUI {spoken}"
    return f"GUI {_GUI_ZH.get(act, act or '操作')}"


def format_live_cli(call: dict[str, Any] | FunctionCall | None) -> str:
    """Shell-like line for the live console terminal drawer."""
    if call is None:
        return ""
    if isinstance(call, FunctionCall):
        name = call.name
        args = call.arguments
    else:
        name = str(call.get("name") or "")
        args = call.get("arguments") or {}
    if not name or name == "mobile_use":
        return ""
    flags: list[str] = []
    for key, value in (args or {}).items():
        if isinstance(value, (dict, list)):
            rendered = json.dumps(value, ensure_ascii=False)
        else:
            rendered = str(value)
        if " " in rendered or rendered.startswith("{") or rendered.startswith("["):
            rendered = json.dumps(rendered, ensure_ascii=False)
        flags.append(f"--{key} {rendered}")
    if flags:
        return f"$ {name} \\\n    " + " \\\n    ".join(flags)
    return f"$ {name}"


def _thought_from_record(record: HybridStepRecord) -> str:
    return _extract_thought(record.response or "")


def format_screen(route: dict[str, Any] | None) -> str:
    route = route or {}
    app_id = str(route.get("app") or "")
    app = _APP_ZH.get(app_id, app_id or "桌面")
    path = str(route.get("path") or "/")
    if not app_id:
        return "现在在桌面"
    if path in {"", "/"}:
        return f"现在在{app}首页"
    if "/chat/" in path:
        return f"现在在{app}聊天页"
    if "/item/" in path:
        return f"现在在{app}商品页"
    if "/shop/" in path:
        return f"现在在{app}店铺页"
    if "/hotel/" in path and "/booking" in path:
        return f"现在在{app}填单页"
    if "/hotel/" in path:
        return f"现在在{app}酒店详情"
    return f"现在在{app} {path}"


class HybridArtifactRecorder:
    """Persist screenshots and model/tool records without the benchmark recorder."""

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._screenshots: dict[int, tuple[str, str]] = {}
        self._live_history: list[dict[str, Any]] = []
        self._live_current: dict[str, Any] = {}

    def publish_live(self, payload: dict[str, Any]) -> None:
        """Write the current thinking/acting frame so a side console can animate."""
        task = {}
        task_path = self.output_dir / "task.json"
        if task_path.exists():
            try:
                task = json.loads(task_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                task = {}
        if payload.get("step") != self._live_current.get("step"):
            self._live_current = {}
        self._live_current.update({k: v for k, v in payload.items() if v or k == "phase"})
        body = {
            "running": True,
            "title": str(task.get("task_id") or self.output_dir.name),
            "instruction": str(task.get("instruction") or ""),
            "meta": f"{len(self._live_history)} 步已完成 · 正在第 {self._live_current.get('step')} 步",
            "history": list(self._live_history),
            "current": self._live_current,
        }
        (self.output_dir / "live.json").write_text(
            json.dumps(body, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def record_step(
        self,
        record: HybridStepRecord,
        before: Observation,
        after: Observation,
        messages: list[dict[str, Any]],
    ) -> None:
        prefix = f"step_{record.step:03d}"
        before_name = self._write_screenshot(f"{prefix}_before", before)
        after_name = self._write_screenshot(f"{prefix}_after", after)
        self._screenshots[record.step] = (before_name, after_name)
        # Official qwen35_session dumps also expect screenshot_step{N}.png.
        _write_session_screenshot(self.output_dir, record.step - 1, before)
        prompt = _replace_image_data(messages, before_name)

        (self.output_dir / f"{prefix}_prompt.json").write_text(
            json.dumps(prompt, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        (self.output_dir / f"{prefix}_response.txt").write_text(
            record.response,
            encoding="utf-8",
        )
        step_payload = record.to_dict()
        step_payload["screenshot_before"] = before_name
        step_payload["screenshot_after"] = after_name
        (self.output_dir / f"{prefix}_result.json").write_text(
            json.dumps(step_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        call = step_payload.get("call") or {}
        name = str(call.get("name") or "")
        is_tool = bool(name) and name != "mobile_use"
        one = format_live_action(call)
        self._live_history.append({
            "step": record.step,
            "kind": "tool" if is_tool else "gui",
            "kind_label": "App Tool" if is_tool else "GUI",
            "summary": one,
        })
        feedback = step_payload.get("feedback") or {}
        self.publish_live({
            "step": record.step,
            "phase": "returned",
            "kind": "tool" if is_tool else "gui",
            "kind_label": "App Tool" if is_tool else "GUI",
            "app": record.current_app or "launcher",
            "thought": _thought_from_record(record),
            "action": one,
            "cli": format_live_cli(call),
            "screenshot": after_name,
            "tool_return": (
                json.dumps(feedback.get("output", feedback.get("error")), ensure_ascii=False, indent=2)
                if is_tool
                else format_screen(record.route_after)
            ),
        })

    def finish(self, result: HybridRunResult) -> None:
        payload = result.to_dict()
        (self.output_dir / "trace.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        (self.output_dir / "index.html").write_text(
            _build_html(result, self._screenshots),
            encoding="utf-8",
        )

    def _write_screenshot(self, stem: str, observation: Observation) -> str:
        image = observation.get_screenshot_bytes()
        suffix = ".jpg" if image[:2] == b"\xff\xd8" else ".png"
        name = stem + suffix
        (self.output_dir / name).write_bytes(image)
        return name


def _observation_bytes(obs: Any) -> bytes:
    if obs is None:
        return b""
    getter = getattr(obs, "get_screenshot_bytes", None)
    if callable(getter):
        return getter() or b""
    return getattr(obs, "screenshot_bytes", b"") or b""


def _write_session_screenshot(output_dir: Path, index: int, obs: Any) -> str:
    """Match official session dumps: screenshot_step{N}.png next to session.json."""

    data = _observation_bytes(obs)
    if not data:
        return ""
    name = f"screenshot_step{index}.png"
    path = output_dir / name
    try:
        from PIL import Image

        Image.open(io.BytesIO(data)).convert("RGB").save(path, format="PNG")
    except Exception:
        path.write_bytes(data)
    return name


def _replace_image_data(value: Any, screenshot_name: str) -> Any:
    if isinstance(value, list):
        return [_replace_image_data(item, screenshot_name) for item in value]
    if isinstance(value, dict):
        if value.get("type") == "image_url":
            image_url = value.get("image_url") or {}
            url = image_url.get("url") if isinstance(image_url, dict) else None
            if not str(url or "").startswith("data:image/"):
                return value
            return {"type": "image_url", "image_url": {"url": f"<{screenshot_name}>"}}
        if value.get("type") == "input_image":
            return {
                **value,
                "image_url": f"<{screenshot_name}>",
            }
        if value.get("type") == "computer_screenshot":
            return {
                **value,
                "image_url": f"<{screenshot_name}>",
            }
        return {key: _replace_image_data(item, screenshot_name) for key, item in value.items()}
    return value


def _build_html(
    result: HybridRunResult,
    screenshots: dict[int, tuple[str, str]],
) -> str:
    sections = []
    for record in result.trace:
        prefix = f"step_{record.step:03d}"
        before, after = screenshots[record.step]
        call = (
            json.dumps(
                {"name": record.call.name, "arguments": record.call.arguments},
                ensure_ascii=False,
                indent=2,
            )
            if record.call
            else "No valid call parsed"
        )
        feedback = (
            json.dumps(record.feedback.to_dict(), ensure_ascii=False, indent=2)
            if record.feedback
            else "No feedback"
        )
        tool_return = (
            json.dumps(record.feedback.result, ensure_ascii=False, indent=2)
            if record.feedback
            else "No return value"
        )
        status = "SUCCESS" if record.feedback and record.feedback.ok else "ERROR"
        status_class = "success" if record.feedback and record.feedback.ok else "error"
        call_id = record.feedback.call_id if record.feedback else "-"
        sections.append(
            f"""
            <section>
              <header>
                <h2>Step {record.step}</h2>
                <span>{html.escape(record.current_app or 'launcher/system UI')}</span>
                <span>UI effect: {html.escape(record.ui_effect)}</span>
              </header>
              <div class="screens">
                <figure><img src="{before}" alt="Before step {record.step}"><figcaption>Before</figcaption></figure>
                <figure><img src="{after}" alt="After step {record.step}"><figcaption>After</figcaption></figure>
              </div>
              <div class="tool-io">
                <div class="tool-panel">
                  <h3>Tool call</h3>
                  <pre>{html.escape(call)}</pre>
                </div>
                <div class="tool-panel tool-return {status_class}">
                  <h3>Tool return <span class="status">{status}</span></h3>
                  <div class="call-id">Call ID: {html.escape(call_id)}</div>
                  <pre>{html.escape(tool_return)}</pre>
                </div>
              </div>
              <details><summary>Full execution envelope</summary><pre>{html.escape(feedback)}</pre></details>
              <details><summary>Model response</summary><pre>{html.escape(record.response)}</pre></details>
              <details><summary>Available tools</summary><pre>{html.escape(json.dumps(record.available_tools, ensure_ascii=False, indent=2))}</pre></details>
              <details><summary>Routes</summary><pre>{html.escape(json.dumps({'before': record.route_before, 'after': record.route_after}, ensure_ascii=False, indent=2))}</pre></details>
              <p class="files">Prompt: <a href="{prefix}_prompt.json">JSON</a> &middot; Result: <a href="{prefix}_result.json">JSON</a> &middot; Response: <a href="{prefix}_response.txt">text</a></p>
            </section>
            """
        )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MobileGym Agent Trace ({html.escape(result.interaction_mode)})</title>
  <style>
    body {{ margin: 0; background: #f4f5f7; color: #20242a; font: 14px/1.5 system-ui, sans-serif; }}
    main {{ width: min(1120px, calc(100% - 32px)); margin: 24px auto 64px; }}
    h1 {{ margin-bottom: 4px; font-size: 28px; }}
    .summary {{ margin-bottom: 24px; color: #59616d; }}
    section {{ margin: 16px 0; padding: 18px; border: 1px solid #d8dde5; border-radius: 6px; background: white; }}
    header {{ display: flex; align-items: baseline; gap: 16px; border-bottom: 1px solid #e6e9ee; }}
    header h2 {{ margin: 0 8px 12px 0; }}
    header span {{ color: #59616d; }}
    .screens {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 16px 0; }}
    .tool-io {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 18px 0; }}
    .tool-panel {{ min-width: 0; padding: 14px; border: 1px solid #d8dde5; border-radius: 6px; background: #fafbfc; }}
    .tool-panel h3 {{ margin: 0 0 8px; font-size: 15px; }}
    .tool-panel pre {{ margin-bottom: 0; }}
    .tool-return.success {{ border-left: 4px solid #16803c; }}
    .tool-return.error {{ border-left: 4px solid #c52a2a; }}
    .status {{ float: right; padding: 2px 7px; border-radius: 4px; color: white; background: #16803c; font-size: 11px; }}
    .error .status {{ background: #c52a2a; }}
    .call-id {{ color: #68717e; font: 12px ui-monospace, monospace; }}
    figure {{ margin: 0; text-align: center; }}
    img {{ width: min(100%, 360px); border: 1px solid #c8ced8; background: #111; }}
    figcaption {{ margin-top: 6px; font-weight: 600; }}
    details {{ margin-top: 10px; }}
    summary {{ cursor: pointer; font-weight: 600; }}
    pre {{ overflow: auto; padding: 12px; border-radius: 4px; background: #f5f7fa; white-space: pre-wrap; }}
    .files {{ margin-bottom: 0; color: #59616d; }}
    a {{ color: #075fc2; }}
    @media (max-width: 720px) {{ .screens, .tool-io {{ grid-template-columns: 1fr; }} header {{ display: block; }} header span {{ margin-right: 12px; }} }}
  </style>
</head>
<body>
  <main>
    <h1>MobileGym Agent Trace</h1>
    <p class="summary">Interaction mode: {html.escape(result.interaction_mode)} &middot; Stop reason: {html.escape(result.stop_reason)} &middot; Steps: {len(result.trace)}</p>
    <p>{html.escape(result.task)}</p>
    {''.join(sections)}
  </main>
</body>
</html>
"""


def rerender_trace(output_dir: Path) -> Path:
    """Regenerate ``index.html`` from an existing standalone trace directory."""

    data = json.loads((output_dir / "trace.json").read_text(encoding="utf-8"))
    records: list[HybridStepRecord] = []
    screenshots: dict[int, tuple[str, str]] = {}
    for row in data.get("trace") or []:
        call_data = row.get("call")
        feedback_data = row.get("feedback")
        call = (
            FunctionCall(call_data["name"], call_data.get("arguments") or {})
            if call_data
            else None
        )
        feedback = None
        if feedback_data:
            ok = bool(feedback_data.get("ok"))
            feedback = StepFeedback(
                call_id=str(feedback_data.get("call_id") or ""),
                name=str(feedback_data.get("name") or ""),
                ok=ok,
                result=feedback_data.get("output" if ok else "error"),
            )
        record = HybridStepRecord(
            step=int(row["step"]),
            current_app=str(row.get("current_app") or ""),
            available_tools=list(row.get("available_tools") or []),
            response=str(row.get("response") or ""),
            call=call,
            feedback=feedback,
            ui_effect=str(row.get("ui_effect") or "none"),
            route_before=dict(row.get("route_before") or {}),
            route_after=dict(row.get("route_after") or {}),
            started_at=row.get("started_at"),
            finished_at=row.get("finished_at"),
        )
        records.append(record)
        screenshots[record.step] = (
            _existing_screenshot(output_dir, f"step_{record.step:03d}_before"),
            _existing_screenshot(output_dir, f"step_{record.step:03d}_after"),
        )

    result = HybridRunResult(
        trace=records,
        stop_reason=str(data.get("stop_reason") or ""),
        task=str(data.get("task") or ""),
        interaction_mode=str(data.get("interaction_mode") or "hybrid"),
        agent_answer=data.get("agent_answer"),
        agent_message=data.get("agent_message"),
    )
    target = output_dir / "index.html"
    target.write_text(_build_html(result, screenshots), encoding="utf-8")
    return target


def _existing_screenshot(output_dir: Path, stem: str) -> str:
    for suffix in (".jpg", ".png"):
        candidate = output_dir / f"{stem}{suffix}"
        if candidate.is_file():
            return candidate.name
    raise FileNotFoundError(f"Missing screenshot: {stem}.jpg/.png")
