# OS Platform Docs

Use these docs when working on the simulated Android host: Tasks, Activities, Back, Intents, shell behavior, services, providers, and app lifecycle.

| Need | Read |
|---|---|
| OS layer overview: TaskManager, BackDispatcher, SystemShell, providers, globals | [`overview.md`](overview.md) |
| Task and Activity lifetime, Back fallback, Recents persistence | [`task-lifecycle.md`](task-lifecycle.md) |
| Intent matching, filters, chooser, `startActivityForResult` | [`intent-system.md`](intent-system.md) |
| Cross-app launch traces: `newTask`, `openApp`, `launchedByTaskId`, Back fallthrough | [`cross-app-launch.md`](cross-app-launch.md) |
| Services: Time, Location, Network, SMS, FileSystem, Clipboard, Broadcast | [`services/`](services/) |
| Keyboard, IME, pointer events, `adjustResize` | [`services/input-keyboard.md`](services/input-keyboard.md) |
| Display and font scaling | [`services/display-scaling.md`](services/display-scaling.md) |

App-facing conventions live under [`../app/`](../app/).
