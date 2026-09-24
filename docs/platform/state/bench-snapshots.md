# Bench Snapshots

Bench state-mode judges consume `__SIM__.getState()` snapshots. They should judge semantic state, not pixels or hidden implementation details.

## Snapshot Shape

```ts
{
  os: { ... },
  apps: {
    [appId]: { ...runtimeOverlay }
  }
}
```

The generated live schema is [../../api/app-state-schema.md](../../api/app-state-schema.md).

## Rules

| Rule | Reason |
|---|---|
| Keep snapshots small. | Large world data makes cloning and diffing expensive. |
| Store semantic fields. | Judges should not parse display strings. |
| Ignore transient `_temp` unless a task explicitly needs it. | `_temp` is visible but meant for ephemeral UI/runtime details. |
| Use shared accessors for derived views. | Prevent app and bench logic from drifting. |

## Reset / Inject / Clone

`__SIM__.reset()` resets runtime state to defaults. `__SIM__.setState(patch)` injects benchmark setup state. Parallel RL uses snapshot/clone semantics, so app state must be serializable and deterministic.

## Related Docs

- Full state model → [model.md](model.md)
- OS state → [os-state.md](os-state.md)
- App state → [app-state.md](app-state.md)
