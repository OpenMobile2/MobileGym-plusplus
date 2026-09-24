"""Playwright bridge to the browser-side MobileGym App Tool registry."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


class BrowserToolUnavailableError(RuntimeError):
    """Raised when the simulator does not expose the App Tool API."""


@dataclass(frozen=True)
class BrowserToolContext:
    """App tools available on the currently visible foreground surface."""

    app: str
    tools: list[dict[str, Any]]


class BrowserToolClient:
    """A worker-local client bound to exactly one simulator page."""

    def __init__(self, page: Any):
        self._page = page

    async def list_tools(self, app: str | None = None) -> list[dict[str, Any]]:
        result = await self._page.evaluate(
            """(app) => {
                const api = window.__MOBILE_GYM_TOOLS__;
                if (!api?.listTools) return null;
                return api.listTools(app ? {app} : undefined);
            }""",
            app,
        )
        if result is None:
            raise BrowserToolUnavailableError(
                "window.__MOBILE_GYM_TOOLS__ is unavailable; rebuild/restart the simulator"
            )
        if not isinstance(result, list):
            raise BrowserToolUnavailableError("listTools() returned an invalid payload")
        return result

    async def list_tools_for_current_app(self, current_app: str) -> list[dict[str, Any]]:
        if not current_app:
            return []
        return await self.list_tools(app=current_app)

    async def resolve_foreground_app(self, route_app_hint: str = "") -> str:
        """Resolve the visible app without reading the App Tool registry."""

        result = await self._page.evaluate(
            """(routeAppHint) => {
                // resolveForegroundApp: intentionally independent of App Tools.
                const os = window.__OS__;
                const state = os?.getState?.() || os?.state || {};
                const systemSurfaceVisible = Boolean(
                    state.isLauncherVisible ||
                    state.isRecentsVisible ||
                    os?.shade?.isOpen?.()
                );
                return systemSurfaceVisible
                    ? ''
                    : String(state.activeAppId || routeAppHint || '');
            }""",
            route_app_hint,
        )
        return str(result or "")

    async def discover_tools(self, route_app_hint: str = "") -> BrowserToolContext:
        """Resolve the visible app and tools, hiding them behind system surfaces."""

        result = await self._page.evaluate(
            """(routeAppHint) => {
                const os = window.__OS__;
                const state = os?.getState?.() || os?.state || {};
                const systemSurfaceVisible = Boolean(
                    state.isLauncherVisible ||
                    state.isRecentsVisible ||
                    os?.shade?.isOpen?.()
                );
                const app = systemSurfaceVisible
                    ? ''
                    : String(state.activeAppId || routeAppHint || '');
                if (!app) return {app: '', tools: []};
                const api = window.__MOBILE_GYM_TOOLS__;
                if (!api?.listTools) return null;
                return {app, tools: api.listTools({app})};
            }""",
            route_app_hint,
        )
        if result is None:
            raise BrowserToolUnavailableError(
                "window.__MOBILE_GYM_TOOLS__ is unavailable; rebuild/restart the simulator"
            )
        if not isinstance(result, dict) or not isinstance(result.get("tools"), list):
            raise BrowserToolUnavailableError("dynamic tool discovery returned an invalid payload")
        return BrowserToolContext(app=str(result.get("app") or ""), tools=result["tools"])

    async def call_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        result = await self._page.evaluate(
            """async ({name, arguments}) => {
                const api = window.__MOBILE_GYM_TOOLS__;
                if (!api?.callTool) return null;
                return await api.callTool(name, arguments);
            }""",
            {"name": name, "arguments": arguments},
        )
        if result is None:
            raise BrowserToolUnavailableError(
                "window.__MOBILE_GYM_TOOLS__ is unavailable during tool execution"
            )
        if not isinstance(result, dict):
            raise BrowserToolUnavailableError("callTool() returned an invalid payload")
        return result
