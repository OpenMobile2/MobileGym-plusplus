# Generated Artifacts

Generated artifacts are files produced by scripts from source declarations or live simulator state. Do not hand-edit generated output unless the generator explicitly says it is a seed file.

## Common Artifacts

| Artifact | Generator | Output |
|---|---|---|
| Schema navigation graph | `node scripts/build_nav_artifacts.mjs <AppName>` | `public/<app>_nav_graph.json` + `_nav_graph_simplified.json` |
| Data navigation graph | `node scripts/build_nav_artifacts.mjs <AppName> --data data/index.ts` | `public/<app>_data_graph.json` |
| Action tasks | `node scripts/build_nav_artifacts.mjs <AppName>` | `public/<app>_action_tasks.json` (and `_action_tasks_data.json` in data mode) |
| App state schema | `python scripts/dev/dump_app_state_schema.py` | `docs/api/app-state-schema.md` |
| IME pinyin dictionary | `node scripts/ime/build_pinyin_dict.mjs` | `os/keyboard/pinyinData.ts` |

## Rules

- Change the source declaration or generator, then regenerate.
- Include exact warnings/errors when generation reports them.
- For navigation changes, run `node scripts/build_nav_artifacts.mjs <AppName>`.

### Do not hand-edit generated files

The output side of every row above is generated. Specifically:

- **`os/keyboard/pinyinData.ts`** — the IME pinyin dictionary is a several-thousand-line generated object literal. Update the source dictionaries in `all_dicts/` (or change the generator's logic), then re-run `node scripts/ime/build_pinyin_dict.mjs`. Hand-editing `pinyinData.ts` causes duplicate keys, bundle bloat, and unreviewable diffs.
- **`public/*_nav_graph*.json` / `*_action_tasks*.json`** — regenerated from `navigation.declaration.ts` on every build. Hand edits will be silently overwritten the next time `build_nav_artifacts.mjs` runs.
- **`docs/api/app-state-schema.md`** — dumped from a running simulator; the snapshot it describes is the bench's source of truth for state shapes.

## Related Docs

- Build tooling overview → [build.md](build.md)
- Navigation graph generation → [../navigation/graph-generation.md](../navigation/graph-generation.md)
- Live app state schema → [../../api/app-state-schema.md](../../api/app-state-schema.md)
