# MobileGym App Tools

This directory contains the environment-side app tool layer. It is independent from model or MCP adapters.

See [TOOLS_DESIGN.md](./TOOLS_DESIGN.md) for the design, implementation, verification, and Agent integration guide.
See [TOOL_CATALOG.md](./TOOL_CATALOG.md) for the complete per-app capability catalog and intentional omissions.
See [VALIDATION.md](./VALIDATION.md) for the latest exhaustive real-browser audit and reproduction command.

Browser API:

```js
window.__MOBILE_GYM_TOOLS__.listTools({ app: 'calendar' });
await window.__MOBILE_GYM_TOOLS__.callTool('calendar__open_date', {
  date: '2026-07-13',
});
```

`callTool` always resolves to a structured result:

```js
{ callId, name, ok: true, output }
{ callId, name, ok: false, error: { code, message, details? } }
```

App tools must call existing domain/store actions or open normal app UI. They must not use `__SIM__.setState()` or verifier-only data. Direct data writes require a shared validated business operation used by both the GUI and the tool.

Calendar v1 intentionally exposes only compact search, event/date navigation, free/busy lookup, and a non-persisted event draft. The draft is saved only after the normal Calendar GUI submit action.

The current environment exposes 203 tools across 19 apps: the original 53-tool surface
plus 150 tools for Map, Weather, Railway 12306, Alipay, File Manager, Tencent Meeting,
Bilibili, RedBook, WeChat Reading, Spotify, eBay, Reddit, and Taobao. Runtime discovery
still exposes only the foreground app's tools to the model.

Production bootstrap imports only passive tool definitions. Tool handlers and App stores
are loaded lazily after an actual `callTool`, so standard MobileGym benchmark runs that do
not use App Tools do not execute tool business logic.

Available Calendar tools:

| Tool | Behavior |
| --- | --- |
| `calendar__search_events` | Returns compact matching candidates. |
| `calendar__open_event` | Opens an existing event detail route. |
| `calendar__open_date` | Opens a date in the Calendar month/agenda UI. |
| `calendar__get_busy_intervals` | Returns merged busy intervals without event content. |
| `calendar__prepare_event_draft` | Prefills the normal create-event form without saving. |

Example draft call:

```js
await window.__MOBILE_GYM_TOOLS__.callTool('calendar__prepare_event_draft', {
  title: 'Project review',
  date: '2026-07-15',
  start_time: '14:00',
  end_time: '15:30',
  description: 'Review weekly progress',
});
```
