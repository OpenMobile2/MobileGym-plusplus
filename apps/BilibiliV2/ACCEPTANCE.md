# BilibiliV2 Acceptance

| Item | Acceptance Standard | Status |
|---|---|---|
| V1 Top bar visible | AppShell has `h-10` status-bar spacer; page TopBar is not covered | ✅ |
| V2 Back works | Subpages use app-level `back()` and OS handler is mounted inside `MemoryRouter` | ✅ |
| V3 Visual media | Video cards and player areas render local visual cover art without network images | ✅ |
| V4 Home data | Home shows channel tabs, hero video and at least six videos | ✅ |
| V5 Detail data | Video detail shows author, stats, tags, comments and related videos | ✅ |
| V6 Tab switching | Home, Hot, Dynamic, Message, Me are reachable through bottom TabBar | ✅ |
| V7 P0 paths | P0 rows in `docs/bilibili-replication/03-interaction-matrix.md` are implemented | ✅ |
| V8 Store snapshot | State uses `createAppStoreWithActions` with `manifest.id` and `DATA_VERSION` | ✅ |
| V9 Keyboard contract | Bottom TabBar wrapper has `data-hide-on-keyboard`; no fixed bottom bar | ✅ |
| V10 Interaction markers | Primary controls have `data-trigger` or `data-action` markers | ✅ |
