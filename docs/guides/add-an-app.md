# Add a New App

This guide walks you through adding a brand-new app to the MobileGym simulator.  Plan on an hour for a minimal app, longer for one with rich features.

> 📐 For the formal contract and edge cases, see [`../platform/app/module-contract.md`](../platform/app/module-contract.md). Layered state and snapshots are in [`../platform/state/model.md`](../platform/state/model.md). Navigation grammar is in [`../platform/navigation/declaration.md`](../platform/navigation/declaration.md).

## Where apps live

| Kind                | Directory          | Examples                        |
| ------------------- | ------------------ | ------------------------------- |
| Daily / third-party | `apps/<Name>/`   | WeChat, Alipay, Bilibili        |
| System              | `system/<Name>/` | Settings, Contacts, AnswerSheet |

The OS auto-discovers both with Vite glob patterns for `apps/*/manifest.ts`, `system/*/manifest.ts`, `apps/*/*App.tsx`, and `system/*/*App.tsx`. **You never edit any registry file.**

## Step 1 — Create the directory and manifest

```bash
mkdir -p apps/Habits/{pages,res,data,hooks}
```

Write `apps/Habits/manifest.ts`:

Create `apps/Habits/res/icons.tsx` first (or copy an existing app's icon file and rename the exports) so the manifest can import an app-owned launcher icon:

```tsx
import { CheckCircle2 } from 'lucide-react';

export const IcLauncher = CheckCircle2;
```

```ts
import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'habits',                       // appId — must be unique, also the localStorage key
  packageName: 'com.example.habits',
  displayName: '习惯',                // user-facing zh name
  displayNameEn: 'Habits',            // user-facing en name (auto-injected into OS i18n)
  aliases: ['habit tracker'],         // searchable aliases (auto-injected into OS lookup)
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',                     // 'plugin' for daily/third-party apps, 'system' for system apps
  icon: IcLauncher,
  iconBackground: '#10b981',
  iconForeground: '#ffffff',
  designViewportWidth: 360,           // CSS zoom anchor; 360 matches a typical phone
  theme: {
    colors: {
      primary: '#10b981',
      background: '#f6f7f9',
      surface: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [
    // Optional: deep-link or share-handling routes
  ],
};
```

The `id` field is your **appId** — it's the localStorage key, the URL anchor, and the only handle other code uses to refer to your app.

## Step 2 — Add the entry component

`apps/Habits/HabitsApp.tsx`:

```tsx
import { useCallback, useContext, useEffect, useRef } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import HomePage from './pages/HomePage';
import NewHabitPage from './pages/NewHabitPage';

function HabitsNavigationHandler() {
  const location = useLocation();
  const { back, go } = useAppNavigate();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const memoryNavigator = navigator as { index?: number };
    if (typeof memoryNavigator.index === 'number') {
      historyIndexRef.current = memoryNavigator.index;
    }
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const memoryNavigator = navigator as { index?: number };
    const currentIndex =
      typeof memoryNavigator.index === 'number'
        ? memoryNavigator.index
        : historyIndexRef.current;

    if (currentIndex > 0) {
      back();
      return true;
    }

    if (location.pathname !== '/') {
      go('habits.home-open', {}, { mode: 'replace' });
      return true;
    }

    return false;
  }, [back, go, location.pathname, navigator]);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

function HabitsAppInner() {
  return (
    <>
      <HabitsNavigationHandler />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewHabitPage />} />
      </Routes>
    </>
  );
}

export default function HabitsApp() {
  return (
    <MemoryRouter>
      <HabitsAppInner />
    </MemoryRouter>
  );
}
```

> ⚠️ **The file name must match `*App.tsx`** and the component must be `export default`. That's how the OS discovers it.

> 🚫 **Business pages should never call `useNavigate()` from `react-router`.** Keep raw router access inside `navigation.ts` and the app-level navigation handler; pages should use your app's own `go()` / `back()` helpers.

## Step 3 — Declare the navigation FSM

Every route, transition, and discrete UI state must be declared. This file is the source of truth for static analysis, graph generation, and task authoring.

Every app keeps its own `navigation.types.ts` next to the declaration (each app re-declares the type to keep apps decoupled from each other and from the OS layer). Start by copying `apps/Wechat/navigation.types.ts` into `apps/Habits/navigation.types.ts` — the type shape is shared across apps even though the file is per-app.

`apps/Habits/navigation.declaration.ts` (sketch):

```ts
import type { NavigationDeclaration, ScrollContainerDeclaration } from './navigation.types';

const MAIN_SCROLL: ScrollContainerDeclaration[] = [
  { name: 'main', direction: 'vertical', description: 'Main content' },
];

export const NAVIGATION_DECLARATION = {
  app: 'habits',
  routes: [
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'habits.home.base', search: {}, description: 'Habit list' }],
      queryParams: {},
      description: 'Habit list',
    },
    {
      path: '/new',
      component: 'NewHabitPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'habits.new.base', search: {}, description: 'New habit form' }],
      queryParams: {},
      description: 'New habit form',
    },
  ],
  transitions: [
    {
      id: 'habits.home-open',
      from: '*',
      to: '/',
      search: {},
      searchParams: {},
      mode: 'replace',
      params: {},
      label: 'Return to habit list',
      ui: { placement: 'none', icon: 'back', gesture: 'back' },
    },
    {
      id: 'habits.open-new',
      from: '/',
      to: '/new',
      search: {},
      searchParams: {},
      mode: 'push',
      params: {},
      label: 'Open the new-habit form',
      ui: { placement: 'fab', icon: 'add', gesture: 'tap' },
    },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
```

The matching `apps/Habits/navigation.ts` exposes `useAppNavigate` with `go()` / `back()` (copy the pattern from any existing app — the implementations are nearly identical).

> 💡 Use **string literals** for `transition.id` and `action.id` at every bind site. The consistency check scans your source for these literals — variable interpolation breaks it.

## Step 4 — Build the pages

Write your pages under `apps/Habits/pages/`. Three rules to keep you out of trouble:

1. **Reserve the status bar.** Every page's outermost container needs `pt-10` and (if it's not dark) a `data-status-bar-foreground="dark|light"` attribute.
2. **Drive every discrete UI state through the URL.** Tabs, modals, sheets — push them through `go()` with `searchParams`. Never use `useState` for visibility, the back key will betray you.
3. **Tag the controls.** Use the gesture hooks from `useTriggerGestures` so every transition / action emits `data-trigger="..."` and `data-action="..."` attributes. These are how the static analyzer matches code against the declaration.

## Step 5 — Add data and state

Two files:

`apps/Habits/data/defaults.json`:

```json
{
  "user": { "name": "你", "streak": 3 },
  "habits": [
    { "id": "h1", "title": "喝水", "doneToday": false },
    { "id": "h2", "title": "走 5000 步", "doneToday": true }
  ]
}
```

`apps/Habits/data/index.ts`:

```ts
import defaults from './defaults.json';
import { manifest } from '../manifest';

export const HABITS_CONFIG = {
  ...defaults,
  appId: manifest.id,
};
```

Then a Zustand store under `apps/Habits/state.ts` (auto-discovered like `manifest.ts`):

```ts
import { createAppStoreWithActions } from '@/os/createAppStore';
import { HABITS_CONFIG } from './data';

type Habit = (typeof HABITS_CONFIG.habits)[number];

interface HabitsState {
  habits: Habit[];
}

interface HabitsActions {
  toggleDay: (id: string) => void;
}

const initialState: HabitsState = {
  habits: HABITS_CONFIG.habits,
};

export const useHabitsStore = createAppStoreWithActions<HabitsState, HabitsActions>(
  'habits',
  initialState,
  (set) => ({
    toggleDay: (id: string) =>
      set((s) => ({
        habits: s.habits.map((h) =>
          h.id === id ? { ...h, doneToday: !h.doneToday } : h,
        ),
      })),
  }),
);
```

> ⚠️ **The first argument to `createAppStoreWithActions()` must equal `manifest.id`** — the OS uses it as the localStorage key, the store registry key, and the `__SIM__.getState().apps.<appId>` snapshot key.

## Step 6 — Validate

```bash
# Type check
npx tsc --noEmit

# Rebuild navigation artifacts (consistency check + graph + tasks)
node scripts/build_nav_artifacts.mjs Habits
```

The artifacts pipeline will fail if your declaration doesn't match the source — e.g. a `data-trigger="habits.open-new"` in the code but no matching transition in the declaration. Read the error log carefully; it points at the exact file and line.

## Step 7 — Smoke-test in the simulator

```bash
npm run dev
```

Open `http://localhost:3000`. Your app should appear in the launcher with the icon and theme you specified. Tap through every route, then in the DevTools console:

```js
__SIM__.getState().apps.habits
// → your runtime overlay snapshot, exactly as the benchmark will see it
```

## Common pitfalls

- **`data-trigger` is dynamic.** The analyzer can't follow `data-trigger={\`habits.${kind}\`}`. Hard-code the literal.
- **You used `useNavigate()` in a business page.** Replace it with the app's `go()` / `back()` helpers so navigation stays analyzable.
- **Dialog visibility from `useState`.** Press the back key and the dialog stays open — the OS's `BackDispatcher` doesn't know about your local state. Push a `searchParams` entry instead.
- **Imported `BackDispatcher` directly.** That's an OS-internal module. Apps interact with back through the URL/history.
- **`Date.now()` or `new Date()`.** Always go through `TimeService` (`TimeService.now()`, `TimeService.fromTimestamp(ts)`, …). The lint rule will reject the raw form.
- **Position-fixed bottom bars.** Forbidden — they break the keyboard's `adjustResize`. Use a flex layout with `flex-shrink-0`.

## Where to go next

- 🧪 Add tasks for your new app → [add-a-task.md](add-a-task.md)
- 📊 Want your app on the public leaderboard's task surface? Open a discussion issue with the proposed task set.
- 📐 Deep dives: [`app-module-contract.md`](../platform/app/module-contract.md) (file conventions, hooks, cross-cutting rules), [`state-model.md`](../platform/state/model.md) (layered state, snapshots), [`declarative-navigation.md`](../platform/navigation/declaration.md) (FSM grammar, graph generation), [`intent-system.md`](../platform/os/intent-system.md) (cross-app calls).
