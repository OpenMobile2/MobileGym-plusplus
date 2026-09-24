# Time Service

Use `TimeService` for all app-visible and judge-relevant time.

| Need | API |
|---|---|
| Display current simulated time | `TimeService.now()` / `TimeService.getDate()` |
| Persist a judge-relevant timestamp | `TimeService.now()` |
| Measure real elapsed time for animation/debounce/cache TTL | `TimeService.realNow()` |
| Replace `new Date(timestamp)` | `TimeService.fromTimestamp(ts)` |
| Replace `new Date(year, monthIndex, day, ...)` | `TimeService.fromLocalParts(...)` — `monthIndex` is 0-based, matching JS `Date` |
| Parse date text | `TimeService.parseToTimestamp(str)` |

Do not use bare `Date.now()` or `new Date(...)` in runtime code. ESLint enforces this for `os/`, `apps/`, and `system/`.

Benchmarks can control simulated time through `__SIM_TIME__`; app code should not bypass it.

See the service index for broader context: [README.md](README.md).
