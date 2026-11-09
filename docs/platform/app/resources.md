# App Resources

This page is the app-author entry point for resources under `apps/<App>/res/`. The complete app contract remains in [module-contract.md](module-contract.md).

## Directory Shape

```text
apps/<App>/
  res/
    strings.ts        # required: zh-Hans (default)
    strings.en.ts     # required: English translations (Partial allowed)
    icons.tsx         # required if the app uses any icons
    colors.ts         # optional — only for stable app resources, not one-off Tailwind colors
    dimens.ts         # optional — only when a dimension is reused or pinned to JS pixel math
```

Use `res/` for Android-like app resources: strings, semantic colors, reusable dimensions, and app-owned icon aliases.

In practice every shipped app has `strings.ts` + `strings.en.ts` + `icons.tsx`; the framework supports omitting them if an app truly has no localized text or icons (e.g. `AnswerSheet`), but treat the trio as the de-facto baseline.

## Icons

Rules:

| Rule | Why |
|---|---|
| Export icon aliases with an `Ic` prefix, e.g. `IcCard`, `IcBus`, `IcNavBack`. | Keeps data-driven icon names app-local and avoids leaking raw library names. |
| `ICON_REGISTRY` keys must exactly match exported `Ic*` names. | Enables deterministic data-driven rendering. |
| Do not add raw Lucide names to `ICON_REGISTRY`. | Fix the data layer instead of masking invalid data. |
| Import only icons the app actually uses. | Keeps bundles and code review small. |
| Pass `size` inline at the call site (`<IcCard size={22} />`). Don't define `icSize*` fields in `dimens.ts`. | Icon size is a render-site detail, not a shared dimension. |
| Use Tailwind text-color classes or CSS variables for icon color (`className="text-app-primary"`, `style={{ color: 'var(--app-c-foo)' }}`). | Hard-coded `color="#1677FF"` defeats theme overrides and dark-mode. |

Usage:

```tsx
<IcCard size={22} />
<IconRenderer name={item.icon} size={22} />
```

Data files should store `"IcCard"`, not `"CreditCard"`.

## Colors

Use `res/colors.ts` when a color is a stable app resource:

| Good fit | Poor fit |
|---|---|
| Brand colors, gradients, semantic tokens not covered by Tailwind. | One-off Tailwind colors such as `text-gray-800` or `bg-white`. |
| Dark-mode-aware component color maps. | Local one-use arbitrary values such as `bg-[#FF7D00]`. |

The manifest `theme.colors` owns Tier-1 shell colors such as `primary`, `background`, `surface`, `statusBarForeground`, and `navigationBarForeground`.

### CSS variable naming

Both color sources are injected as CSS variables by `os/utils/themeToCssVars.ts`:

| Source | CSS variable prefix | Example |
|---|---|---|
| `manifest.theme.colors` (Tier-1) | `--app-<key>` | `primary` → `--app-primary` |
| `res/colors.ts` (Tier-2 / component colors) | `--app-c-<key>` | `brand_orange` → `--app-c-brand-orange` |
| `res/colors.states.ts` (state colors) | `--app-cs-<key>` | `bg_pressed` → `--app-cs-bg-pressed` |
| `res/anim.ts` (animation tokens) | `--app-<key>` | (same family as Tier-1) |

The `_`-to-`-` transform is implicit; declare keys in snake_case TS, refer to them as kebab-case in CSS.

### Dark mode

`res/colors.ts` may export `colorsDark` to override individual keys in dark mode:

```ts
export const colors = { brand_orange: '#FF7D00', forest_green: '#2E7D32' };
export const colorsDark: Partial<typeof colors> = {
  forest_green: '#66BB6A',
};
```

The `Partial<typeof colors>` type is the contract — only declare the keys that change. The manifest's `theme.colorsDark` follows the same pattern. Most shipped apps currently export an empty `{}` to keep the type contract while postponing dark-mode work.

## Dimensions

Use `res/dimens.ts` only for dimensions that are reused or must stay in sync with JavaScript pixel math.

Dimensions are auto-injected as CSS variables (kebab-case + `px` suffix): `item_height: 56` becomes `--app-item-height: 56px`. The injection happens when the App entry mounts and calls `style={{ ...dimensToCssVars(dimens) }}`.

For JS pixel calculations, prefer CSS variables or pixel literals:

```tsx
<div
  className="h-(--app-row-height)"
  style={{ '--app-row-height': '48px' } as React.CSSProperties}
/>
```

Avoid Tailwind rem sizing such as `h-12` when JS calculates `scrollTop = index * 48`; root font-size and zoom can otherwise create drift.

## Strings

Use `res/strings.ts` for user-visible text. Keep structural IDs and feature config out of strings; those belong in `constants.ts` or `data/defaults.json`.

`res/strings.en.ts` provides English translations and is typed `Partial<Record<StringKey, string>>` — declare only the keys you've translated.

Apps consume strings through:

```ts
import { useAppStrings } from 'os/useAppStrings';
import { strings } from './res/strings';
import { stringsEn } from './res/strings.en';

const s = useAppStrings(strings, stringsEn);
return <button>{s.nav_back}</button>;
```

(Apps without a React-hooks context may use `resolveAppStrings(strings, stringsEn, locale)` instead — same contract, no hook.)

Do **not** scatter Chinese / English literals across JSX (`<span>返回</span>`). All user-visible text should resolve through the strings map so the locale switch covers it.

`displayNameEn` in `manifest.ts` is patched into OS i18n automatically, so new apps should not edit `os/i18n/en.ts` just to add their app name.

## Related Docs

- App file contract → [module-contract.md](module-contract.md)
- State and data placement → [data-layering.md](data-layering.md)
- Build-time asset handling → [../tooling/build.md](../tooling/build.md)
