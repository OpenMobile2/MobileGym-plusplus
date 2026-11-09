# Cross-App Launch and Task Lifecycle

This page documents the behavior that matters when one app opens another app: `startActivity`, `startActivityForResult`, `openApp`, Task lifetime, and BackDispatcher fallthrough. For the lower-level Intent API and matching rules, start with [intent-system.md](intent-system.md).

## Design Boundaries

MobileGym follows the AOSP model where it is useful for benchmark transfer, but the simulator is not a process-accurate Android runtime.

| Dimension | Android / AOSP | MobileGym |
|---|---|---|
| App component model | One app can declare many Activities, each with launch mode and task affinity. | One app entry component, with one or more OS Activity instances wrapping React Router routes. |
| In-app navigation | Activities, fragments, Navigation Component. | `MemoryRouter`; route history is the app-local back stack. |
| Process model | Apps run in separate processes. | One browser JavaScript process hosts all apps. |
| Lifecycle | `onCreate` / `onStart` / `onResume` / `onPause` / `onStop` / `onDestroy`. | App lifecycle events plus mounted/backgrounded React trees. |

OEM-specific behavior such as split-screen, freeform windows, background task eviction, splash timing, and vendor-specific notification stack synthesis is out of scope. When behavior differs across devices, align to AOSP first.

## Receiver Manifest

`AppIntentFilter` lives in `os/types/manifest.ts` and is declared in each receiving app's `manifest.ts`.

| Field | Required | Meaning |
|---|---:|---|
| `action` | Yes | Intent action, e.g. `ACTION_VIEW`, `ACTION_SEND`, `ACTION_PAY`. |
| `type` | No | MIME type filter. Supports exact match and wildcards such as `image/*`. |
| `scheme` | No | URL scheme filter such as `sms`, `weixin`, `alipays`. |
| `route` | Yes | App route where the receiver lands when the filter matches. |
| `launchMode` | No | `'standard'` or `'singleTask'`; default is `'standard'`. |
| `params` | No | Documentation metadata for expected extras / data. Not enforced at runtime. |
| `description` | No | Label text used by the chooser when multiple apps match. |

`launchMode` is modeled per intent filter rather than per Activity. In MobileGym, a filter acts like the receiving Activity boundary in Android.

## Caller APIs

### `startActivity(intent, options?)`

Use this when app A wants app B to perform an action or show a piece of data.

```ts
window.__OS__.startActivity(
  {
    action: 'ACTION_VIEW',
    scheme: 'sms',
    data: { address: '12306', body: '999' },
  },
  { newTask: true },
);
```

`{ newTask: true }` maps to the useful part of `FLAG_ACTIVITY_NEW_TASK`: the receiver enters or reuses its own Task. Without it, a `standard` receiver is pushed onto the caller's current Task.

Unsupported caller flags include `CLEAR_TOP`, `SINGLE_TOP`, `NO_HISTORY`, `MULTIPLE_TASK`, and `FORWARD_RESULT`. Model those behaviors explicitly with route state or app logic instead.

### `startActivityForResult(intent | appId, callback)`

Use this when the caller needs a result from the callee.

```ts
window.__OS__.startActivityForResult(
  { action: 'ACTION_PAY', scheme: 'alipays', data: { amount: 99 } },
  (result) => {
    if (result.resultCode === 'OK') {
      // read result.data
    }
  },
);
```

The receiver calls:

```ts
window.__OS__.setResult({ resultCode: 'OK', data: { transactionId } });
```

The OS stores the result, finishes the result Activity, and invokes the caller callback. If the user backs out before a result is set, the callback receives `resultCode: 'CANCELED'`.

### `openApp(appId, route?)`

Use this for explicit app launches, launcher actions, and notification/deep-link routing.

```ts
window.__OS__.openApp('wechat', '/chat/wxid_123');
```

`openApp` skips intent matching. When a route is provided, it always pushes the route into the app's `MemoryRouter` history:

| App state | Behavior |
|---|---|
| App Task does not exist | Create the app Task at `/`, mark it externally routed, then push `route`, producing `['/', route]`. |
| App Task already exists | Keep the user's current in-app route and push `route` on top. |

This intentionally differs from Android `TaskStackBuilder` warm-task behavior, which can rebuild the Task. MobileGym keeps the user's current page so notification taps are less destructive.

Do not use `openApp` for "borrow this other app briefly and return to me" flows such as Settings opening FileManager. Use `startActivity` so Back can pop the borrowed Activity or return to the caller Task.

## Route Priority

When both the caller and receiver specify a route, caller intent wins:

```ts
const baseRoute = intent.route ?? targetFilter?.route ?? '/';
```

This is a MobileGym abstraction. Android has no route field; the caller would pass extras, and the receiving Activity would interpret them in `onCreate` / `onNewIntent`. MobileGym allows `intent.route` to express that target subpage directly and avoid a two-step "filter route, then app reroute" race.

Example:

```ts
window.__OS__.startActivity({
  action: 'ACTION_VIEW',
  type: 'inode/directory',
  route: '/category/images',
});
```

The FileManager filter can default to `/`, but this caller lands on `/category/images`.

## Launch Modes

### `standard`

`standard` is the default.

| Caller option | Behavior |
|---|---|
| No `{ newTask: true }` | Push a new Activity instance onto the caller's current Task. |
| `{ newTask: true }` and target Task absent | Create target Task, set `launchedByTaskId` to the caller Task, and navigate to the base route. |
| `{ newTask: true }` and target Task exists | Push a new Activity for the target app onto the target Task. |

Use `standard` for one-off actions such as payment confirmation, document/category viewing, compose screens, and result pickers.

### `singleTask`

`singleTask` is receiver-controlled. It promotes the launch into the receiver's own Task even when the caller omitted `{ newTask: true }`.

| Target Task state | Behavior |
|---|---|
| Task absent | Create the target Task with root MemoryRouter history `['/']`, then push `baseRoute` — final history `['/', baseRoute]`. `/` stays at the bottom of the back stack so the user backs through it before exiting the Task. |
| Task exists | Pop Activities above root, deliver the intent to the root Activity, activate the Task, then `popToRoot('/')` + `navigate(baseRoute, { replace: false })` — same final history `['/', baseRoute]`. |

Use `singleTask` for receiver entry points that should behave as a singleton, such as a share target that should leave the user in the receiving app after the flow.

### Replace vs. push: the OS decides

The receiving app's navigator does not choose between replace and push — the OS passes the right mode through `onNavigate(path, { replace })`:

- **Cold start to `baseRoute`** (newly created Task): `replace: true` on the first navigateToActivity call, so history is just `[baseRoute]` (or `['/', baseRoute]` for `singleTask`).
- **Warm `singleTask` re-entry**: `replace: false` after `popToRoot`, producing `['/', baseRoute]`.
- **`openApp` into an existing Task**: `replace: false` — push the new route on top of whatever the user was looking at.
- **`startActivity({ newTask: true })`**: a new Activity is pushed onto the Task; the new Activity gets its own initial history.

App-side `onNavigate` handlers should forward `replace` to the React Router `navigate(path, { replace })` call without overriding it.

## Task Lifetime

`Task.launchedByTaskId` is a one-shot pointer back to the caller Task. It is set when a new Task is created from another active Task, and consumed the first time Back returns to that caller.

The one-shot rule matters:

1. App A opens app B in B's own Task.
2. User backs out at B's root.
3. OS reactivates A and clears B's `launchedByTaskId`.
4. Later, user opens B from Recents.
5. Back from B now goes home, not back to the old A Task.

Tasks are **never destroyed by Back**. Even when only one Activity remains and there's no `launchedByTaskId`, the OS calls `goHome()` rather than `closeTask()`. This matches Android: root Back leaves the Task in Recents. Destruction is explicit — Recents swipe-away or `__OS__.closeApp(appId)`. Earlier versions of the simulator did destroy Tasks via `wasExternallyRouted`; that branch has been removed.

`wasExternallyRouted` is still set when `openApp` creates a Task, but its only remaining role is **subtler**: when a `LAUNCH_APP` reactivates the Task from the Launcher with no caller (i.e. user tapped the app icon), the reducer clears `launchedByTaskId` only if `!wasExternallyRouted`. For tasks created via `openApp(id, route)`, the original caller relationship is preserved across Launcher reactivations.

Before returning to a caller Task, the OS resets the current app's route to `/`. That prevents a transient bridge route such as SMS compose or payment confirmation from being the screen shown when the user later reopens the Task from Recents.

### finishActivity

`finishActivity()` (and the back-stack equivalents `os.returnToLauncherTask` / `os.goHomeFallback`) closes the **current Activity**, not the Task:

- **Stack > 1**: pop the top Activity. If it had `launchedByTaskId`, activate that caller Task and consume the pointer.
- **Stack == 1, has `launchedByTaskId`**: activate the caller, consume the pointer. The closed Task stays in Recents.
- **Stack == 1, no `launchedByTaskId`**: call `goHome()`. The Task stays in Recents.

No branch calls `closeTask`. Apps that need a Task gone must call `__OS__.closeApp(appId)` explicitly.

### Active-task gate for back

Back handlers registered by `useAppNavigationHandler` apply an **active-task gate** in two places:

```ts
// inside AppNavigator.back closure
const state = TaskManager.getState();
if (taskId && state.activeTaskId !== taskId) return false;

// inside the BackDispatcher registration
BackDispatcher.register(`app.back.${appId}`, () => {
  if (!isForegroundRef.current) return false;
  const state = TaskManager.getState();
  if (taskId && state.activeTaskId !== taskId) return false;
  // …
}, 100);
```

The gate runs in the handler body — not as a "don't register" filter — so the same App rendered in a foreign Task (e.g. Alipay pushed onto a 12306 Task for payment) silently defers and lets the foreground Activity handle Back via the priority-50 `os.activityBack` chain. Skipping registration would leave the foreground unable to recover the handler.

### Intent payload delivery is poll-based

When a `singleTask` warm re-entry delivers a new intent to an already-mounted Activity, the OS writes the payload via `TaskManager.setActivityIntent(activityId, payload)`. Apps read it back with `os.getIntentPayload(activityId)`. **There is no `onNewIntent`-style event callback** — pages that need to react to a redelivered intent must call `getIntentPayload` in an effect (or on render) and diff against the previous payload themselves.

## BackDispatcher Chain

During cross-app flows, Back falls through this effective order:

| Priority | Handler | Cross-app role |
|---:|---|---|
| 1000 | `permission.dialog` | Dismiss permission UI before app routing. |
| 900 | `os.intentChooser` | Dismiss chooser before changing Tasks. |
| 800 | `shade.dismiss` | Close notification shade. |
| 700 | `keyboard.dismiss` | Hide keyboard. |
| 600 | `os.mediaPicker` | Close media picker. |
| 100 | `app.back.<appId>` / `os.appBack` | Let the visible app route back first. |
| 50 | `os.activityBack` | Let the top Activity's own navigator back out. |
| 25 | `os.finishTopActivity` | If the current Task stack has more than one Activity, pop the top Activity. |
| 12 | `os.returnToLauncherTask` | If only one Activity remains and `launchedByTaskId` exists, reactivate caller and consume the pointer. |
| 0 | `os.goHomeFallback` | Return home while keeping the Task in Recents. |

Foreign-task isolation prevents background instances of the same app from consuming Back. When app B is mounted both in its own Task and borrowed on app A's Task, `useAppNavigationHandler` skips app-level registration in the foreign Task (`task.rootAppId !== appId`) and relies on the Activity-level navigator for the foreground borrowed instance.

## Scenario Traces

### Caller opens SMS in a new Task

1. Caller invokes `startActivity(intent, { newTask: true })`.
2. `IntentResolver` matches a `standard` SMS filter.
3. The SMS Task is created or activated with `launchedByTaskId` pointing to the caller Task.
4. If the SMS route cannot handle Back itself, `os.returnToLauncherTask` reactivates the caller and consumes the pointer.
5. SMS remains in Recents. Reopening SMS later and pressing Back goes home.

### Share target with `singleTask`

1. Gallery sends `ACTION_SEND image/*`.
2. WeChat's matching filter declares `launchMode: 'singleTask'`.
3. If WeChat is cold, a WeChat Task is created and navigates from `/` to the share route.
4. If WeChat already exists, Activities above root are popped, the intent payload is delivered to root, and the share route is pushed from `/`.
5. After send, app code can replace the share route with the final chat route so Back returns to WeChat home.

### Same-Task viewer push

1. Settings invokes `startActivity(intent)` without `{ newTask: true }`.
2. FileManager's `standard` filter matches.
3. A FileManager Activity is pushed onto the Settings Task.
4. Back at FileManager route root falls through to `os.finishTopActivity`, popping FileManager and revealing Settings.
5. No standalone FileManager Task is left in Recents.

### Notification route

1. User taps a notification.
2. Notification handler calls `openApp(appId, route)`.
3. If cold, the app Task is created at `/` and `route` is pushed.
4. If warm, `route` is pushed above the current page.
5. Back pops to the previous in-app route; root Back follows normal caller-return or home fallback rules.

## Known Differences from AOSP

| AOSP concept | MobileGym behavior | Decision |
|---|---|---|
| Per-Activity `launchMode` | Per-filter `launchMode`. | Architectural simplification. |
| `singleTop` | Not modeled. | Use route state or explicit `openApp`. |
| `singleInstance` | Not modeled. | Out of scope for benchmark flows. |
| `FLAG_ACTIVITY_CLEAR_TOP` | Not modeled as a caller flag. | Use `singleTask` or explicit route reset. |
| `FLAG_ACTIVITY_NO_HISTORY` | Not modeled. | Back fallback resets transient routes where needed. |
| `FLAG_ACTIVITY_MULTIPLE_TASK` | Not modeled. | One Task per app root unless same-task push is used. |
| `FLAG_ACTIVITY_FORWARD_RESULT` | Not modeled. | Result callbacks are direct. |
| `Activity.onNewIntent` callback | No callback — payload is written via `setActivityIntent` and apps **poll** it via `getIntentPayload(activityId)` in their own effect / render. | Close enough for current flows; pages that need to react to same-route redelivery must observe explicitly. |
| Cross-app `taskAffinity` | Not modeled. | App affinity is effectively `manifest.id` — one Task per app root. |
| `TaskStackBuilder` full parent chain | Cold `openApp(route)` synthesizes `['/', route]` (just app home + target); warm `openApp(route)` preserves current history and pushes. | Intentional UX-friendly divergence — no full reconstruction of an inferred parent chain. |
