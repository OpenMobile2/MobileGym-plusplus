# Vite Plugins

Vite plugin behavior is documented in full in [build.md](build.md). This page is the quick lookup for plugin-related platform work.

## Areas

| Area | Purpose |
|---|---|
| App discovery | `import.meta.glob` discovers manifests and app entry components. |
| Asset handling | App-owned assets are imported through Vite, not hard-coded from `public/<app>/...`. |
| CDN/data handling | Large data can be served through generated/public artifacts where appropriate. |
| Navigation artifacts | Scripts generate graph JSON and action tasks from declarations. |

New app files may require restarting `npm run dev`; Vite HMR handles edits but not always new glob entries.

## Related Docs

- Build tooling overview → [build.md](build.md)
- App contract → [../app/module-contract.md](../app/module-contract.md)
