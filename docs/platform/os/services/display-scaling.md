# Display Scaling

MobileGym models three different scaling concerns. They sound similar, but they are intentionally separate because they map to different Android behaviors and different implementation tradeoffs.

| Concern | Android analogue | Scope | Current status |
|---|---|---|---|
| System display size | `Settings > Display > Display size`, implemented by changing display metrics / density | Layout, text, icons, spacing | Static shell zoom via `SIMULATOR_CONFIG.display.scale`; `displaySizePct` is stored and exposed as `--os-display-scale`, but the shell does not yet consume it dynamically. |
| System font size | `Settings > Display > Font size`, implemented by `fontScale` for `sp` text | Text only | Approximate: `fontSizePct` changes the root `font-size`, so rem-based text changes, but Tailwind rem-based layout also changes. This is not a strict Android `sp`/`dp` split. |
| App design viewport | No direct Android analogue; simulator compatibility layer | Per-app layout anchor | Implemented with per-activity CSS `zoom` from `manifest.designViewportWidth`. |

## Android Model

Android separates:

| Layer | What changes | What stays fixed |
|---|---|---|
| Font size (`fontScale`) | `sp` text metrics | Logical viewport and `dp` layout dimensions |
| Display size / density | Logical viewport size; all `dp` and `sp` content appears larger or smaller | Physical resolution |
| App-local zoom | Whatever the app chooses | System metrics |

Examples:

```text
fontScale = 1.30
16sp text becomes larger, but a 48dp row stays 48dp.

display density increases
The physical screen is unchanged, but the app sees fewer logical dp, so the whole UI appears larger.
```

Android apps do not declare a single "design width" and ask the OS to scale them. Normal Android apps adapt with responsive layouts (`match_parent`, weights, constraint layout, resource qualifiers such as `layout-sw600dp`). MobileGym's `designViewportWidth` is a pragmatic compatibility layer for web app modules that were built against a fixed design width.

## MobileGym Implementation

### Static System Display Scale

`SystemShell` reads `SIMULATOR_CONFIG.display.scale` and applies CSS `zoom` to the simulated OS root:

```tsx
const displayScale: number = SIMULATOR_CONFIG.display.scale ?? 1;

<div
  className="relative w-full h-full"
  style={displayScale !== 1 ? { zoom: displayScale } : undefined}
>
  ...
</div>
```

This is the closest simulator equivalent to Android display-size / density scaling because it affects the layout flow. A larger zoom makes the same physical viewport behave like a smaller logical viewport.

Current limitation: `DisplayManager.setDisplaySizePct()` stores the setting and `DeviceEffects` publishes `--os-display-scale`, but `SystemShell` does not yet bind root zoom to that runtime setting. Settings UI and benchmark state can observe the value; the live shell does not resize from it yet.

### Approximate System Font Scale

`DisplayManager.fontScaleFromPct()` maps `fontSizePct` to `0.85..1.30`. `DeviceEffects` applies it by changing the root font size:

```ts
document.documentElement.style.fontSize = `${16 * fontScale}px`;
```

This is intentionally described as approximate, not Android-accurate. Tailwind uses rem units for both text and layout:

| Tailwind class | CSS unit | Android-equivalent intent |
|---|---|---|
| `text-sm` | `0.875rem` | Text; should respond to font scale |
| `p-4` | `1rem` | Layout; should not respond to font scale |
| `h-10` | `2.5rem` | Layout; should not respond to font scale |
| `gap-2` | `0.5rem` | Layout; should not respond to font scale |

Changing `html { font-size }` therefore changes more than text. It is useful as a low-risk approximation, but it is not a true `sp`/`dp` separation.

### Per-App Design Viewport

Apps can declare:

```ts
export const manifest: AppManifest = {
  id: 'example',
  designViewportWidth: 412,
  ...
};
```

`SystemShell` computes:

```text
zoom = SIMULATOR_CONFIG.framework.viewportWidth / manifest.designViewportWidth
```

and applies that zoom around the app Activity content. For a 360px simulator viewport and a 412px app design width, the app is rendered with `zoom = 360 / 412`.

`SystemShell` only injects the `zoom` style when `manifest.designViewportWidth !== framework.viewportWidth` — when the two are equal there is no wrapper zoom and the page renders at native pixel density (zero-overhead path). The same short-circuit applies to system display scale: `displayScale === 1` skips the `style={{ zoom }}` entirely.

This keeps the declaration in one place and avoids each app hand-rolling its own wrapper.

## Why CSS `zoom`

MobileGym uses CSS `zoom` for display and design-viewport scaling because it changes layout metrics instead of only painting a scaled bitmap.

| Choice | Behavior | Why it matters |
|---|---|---|
| `zoom` | Reflows layout under a scaled coordinate space | Closer to Android density/display-size changes; text remains crisp; most DOM coordinate APIs account for it. |
| `transform: scale()` | Scales the painted result after layout | Layout still uses the unscaled viewport; coordinate math and hit testing need more compensation; fractional text can blur. |

CSS `zoom` is not a web standards purist choice, but this simulator targets Chromium/Playwright and browser-based evaluation, where it gives the behavior the OS layer needs.

## Nested Scaling

Zoom layers multiply:

```text
final scale =
  static system display scale
  * (framework viewport width / manifest.designViewportWidth)
  * any app-local zoom the app applies internally
```

For example:

```text
1.15 system display scale * (360 / 412) app design zoom ~= 1.005
```

Use this rule when debugging pointer math, bottom sheets, map canvases, or keyboard-attached UI.

## App-Local Scaling

Some real apps expose their own display or font settings. Those are app behavior, not OS behavior.

| Strategy | Typical app behavior | Simulator approach |
|---|---|---|
| Whole-app or section zoom | Text, icons, bubbles, and spacing grow together | App-owned wrapper with CSS `zoom`, driven by app state. |
| Text-only scaling | Only text grows; layout stays fixed | App-owned font-size tokens or CSS variables. |
| Visual-content zoom | Maps, photos, canvas content zoom independently | Domain-specific rendering logic, e.g. map zoom or image transform. |

The OS should not guess which policy an app wants. App-local scaling belongs in the app's own store/context and UI contract.

## Styling Rules

Use fixed pixel values or CSS variables for any layout that is also used in JavaScript pixel math:

```tsx
// Good: JS and CSS share the same pixel unit.
<div className="h-(--app-row-height)" style={{ '--app-row-height': '48px' } as React.CSSProperties} />

// Risky: Tailwind rem changes when root font size changes.
<div className="h-12" />
```

This matters for code such as:

```ts
container.scrollTop = index * rowHeightPx;
```

If the DOM row uses rem but `rowHeightPx` is a fixed number, font scaling and zoom can create cumulative drift.

Keyboard-attached UI should use flex layout and `adjustResize`; avoid `position: fixed; bottom: keyboardHeight`. CSS zoom from `designViewportWidth` changes the coordinate space — the OS resizes the `data-adjust-resize` Activity wrapper in screen pixels, but a `fixed` element computes `bottom` in the wrapper's *scaled* CSS pixels, so the input bar drifts off the resized bounds and the keyboard ends up covering it. Wrap the input area in a normal flex column (`flex-shrink-0 bg-app-surface border-t`) so the wrapper's height change reflows it naturally.

### Keyboard data attributes (zoom-mode behavior)

The OS wraps each Activity in `data-adjust-resize`. When the soft keyboard is visible the wrapper gains `data-keyboard-active`, and global CSS keys off those attributes:

| Attribute | Where to put it | Effect |
|---|---|---|
| `data-hide-on-keyboard` | On a bottom TabBar, FAB, or anything that should disappear while typing | Global CSS rule `[data-keyboard-active] [data-hide-on-keyboard] { display: none }` hides the element when the keyboard is up. Better than letting it get pushed above the keyboard. |
| `data-keep-keyboard="true"` | On the send button / inline action buttons inside a chat composer | `KeyboardOverlay` checks for this attribute on the element receiving the down event and **does not blur** the active input. The composer stays focused and the keyboard doesn't dismiss. |

Both attributes work identically in the zoomed-app path — `data-adjust-resize` is the wrapper that owns the keyboard reflow, so its `data-keyboard-active` flag propagates through the zoom scope.

## Future Work

To make system font size Android-accurate, the project would need a real text/layout unit split:

| Requirement | Consequence |
|---|---|
| Text sizes use rem/em or font tokens | Text can respond to `fontScale`. |
| Layout sizes use px/CSS variables | Padding, heights, gaps, and radii stay stable under font scale. |
| App components stop relying on Tailwind rem spacing where JS pixel math exists | Scroll and gesture calculations stay deterministic. |

That migration touches many app files, so it should be done incrementally and only where tasks or UX actually require strict text-only scaling.
