# App Data Layering

This page is the app-author entry point for deciding what belongs in `constants.ts`, `data/defaults.json`, world data files, and runtime state. The full state model is in [../state/model.md](../state/model.md).

## Files

| File | Owns |
|---|---|
| `constants.ts` | Static app structure: tabs, service grids, feature flags, layout constants. |
| `data/defaults.json` | Replaceable initial user/content/settings state. |
| `data/index.ts` | Merge point that exports `<APPNAME>_CONFIG`. |
| `state.ts` / context store | Mutable runtime overlay exposed through `__SIM__.getState()`. |
| Large data files / loaders | Read-mostly world data that should not bloat snapshots. |

## Constants vs. Defaults

Use `constants.ts` for app-inherent structure:

- Tab definitions.
- Fixed service catalogs.
- Feature flags.
- Layout constants.

Use `data/defaults.json` for replaceable user/runtime seed data:

- Current user profile.
- Messages, posts, bills, history.
- User settings.
- User-configurable home layout or ordering.

Do not put raw Lucide icon names in either file; data-driven icon names must use app `Ic*` aliases.

## World Data vs. Runtime Overlay

| Layer | Example | Snapshot behavior |
|---|---|---|
| World data | Products, posts, songs, map places, stations. | Usually outside `__SIM__.getState()`; loaded by app helpers. |
| Runtime overlay | Current user, drafts, likes, settings, sent messages, per-entity overrides. | Included under `apps.<appId>` and used by state-mode judges. |

Views compose both layers at render time. Store semantic fields, not display strings that tests later need to parse.

## Bench-Facing Accessors

If bench tasks need to judge a view, provide stable accessors or shared helper logic so the app and task code resolve the same user-visible state. Do not duplicate display derivation in a way that can drift.

## Related Docs

- Full state model → [../state/model.md](../state/model.md)
- App state snapshots → [../state/app-state.md](../state/app-state.md)
- Bench snapshots and diffs → [../state/bench-snapshots.md](../state/bench-snapshots.md)
