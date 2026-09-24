# Intent System

How one app calls another. MobileGym implements an Intent system modeled on AOSP — close enough that cross-app benchmark tasks transfer to real devices, with some simplifications enumerated below.

> 🎯 **Mental model.** An app emits an **Intent** (intention) — "open this URL", "share this text", "pick a contact." The OS's `IntentResolver` matches the intent against every app's declared `intentFilters`. One match dispatches directly; multiple matches show a chooser sheet. The callee can return a result via `startActivityForResult`.

## Posting an intent

```ts
window.__OS__.startActivity({
  action: 'ACTION_SEND',
  type: 'text/plain',
  extras: { text: 'Hello world' },
});
```

For "I need a result back":

```ts
const launched = window.__OS__.startActivityForResult(
  {
    action: 'ACTION_PICK',
    type: 'contact',
  },
  (result) => {
    if (result.resultCode === 'OK') {
      const { name, phone } = result.data;
      // …
    }
  },
);
```

For "open this specific app's route" (explicit intent):

```ts
__OS__.openApp('alipay', '/pay?amount=99.00');
```

## Declaring filters (on the receiving side)

In your `manifest.ts`:

```ts
intentFilters: [
  {
    action: 'ACTION_SEND',
    type: 'text/plain',
    route: '/share',
    launchMode: 'standard',
    description: 'Receive shared text',
    params: [                        // optional schema documentation
      { key: 'text', type: 'string', required: true },
    ],
  },
  {
    action: 'ACTION_VIEW',
    scheme: 'weixin',
    route: '/deeplink',
    launchMode: 'singleTask',
  },
],
```

| Field | Meaning |
|---|---|
| `action` | The intent's action string. AOSP-style: `ACTION_VIEW`, `ACTION_SEND`, `ACTION_PICK`, custom strings. |
| `type` | Optional MIME type. Matches the intent's `type`. |
| `scheme` | Optional URL scheme. Matches when the intent carries a `data: '<scheme>://…'` URL. |
| `route` | **Required.** Where in your app the intent should land. The resolver pushes the user into your app at this route. |
| `launchMode` | `'standard'` (default) or `'singleTask'` — see below. |
| `description` | Free-text label, shown in the chooser when multiple apps match. |
| `params` | Optional documentation of expected extras. Metadata, not enforced at runtime. |

Also in the manifest, **declare your outbound queries** so the OS knows your app's emission surface (this powers static analysis):

```ts
queries: [
  { action: 'ACTION_VIEW',  scheme: 'https' },
  { action: 'ACTION_PICK',  type: 'contact' },
],
```

## Matching algorithm

`IntentResolver` matches an intent against every installed app's filters by:

1. **Action match** — the intent's action must equal a filter's action exactly.
2. **Type match** (if filter declares `type`) — exact or wildcard (`image/*`, `*/*`). Without a type on the filter, types are not considered.
3. **Scheme match** (if filter declares `scheme`) — exact string match against the intent data's URL scheme.

All matches collected. If zero, the intent is unhandled (logs a warning, no chooser). If one, dispatch directly. If multiple, the OS renders an in-OS `IntentChooserSheet` showing each candidate's app name, icon, and the filter `description`. The user picks one; the choice is dispatched.

Explicit intents (`openApp(appId, route)`) skip matching — they go straight to the named app and route, even if the app has no matching filter. Use them when you have a hard reference to the destination (e.g., a notification deep-link).

## Launch modes

This is where MobileGym diverges from AOSP. AOSP supports four launch modes per Activity (`standard`, `singleTop`, `singleTask`, `singleInstance`). MobileGym models **two** at the filter level (not per Activity):

### `standard` (default)

Each Intent dispatch creates a new Activity instance pushed onto the current Task (or a new Task if appropriate). The user can have multiple "instances" of the receiving app's entry pages, one per dispatch.

Typical use: SMS compose (one per recipient), share targets, document viewers.

### `singleTask`

The OS finds an existing instance of this app's Task (by `rootAppId`) and:

- Activates that Task.
- Clears any Activities above the matching route.
- Delivers the intent's extras to the existing instance via an `onNewIntent`-style hook.

Typical use: main entry points that should be singletons (the WeChat home page, the launcher itself).

> ⚠️ Unmodeled AOSP launchModes are `singleTop` and `singleInstance`. If you reach for them, you probably want either (a) declarative URL parameters within an app, or (b) explicit `__OS__.openApp(id, route)`.

## Result protocol (`startActivityForResult`)

```ts
// Caller
window.__OS__.startActivityForResult(
  {
    action: 'ACTION_PICK',
    type: 'contact',
  },
  (result) => {
    // result: { resultCode: 'OK' | 'CANCELED', data?: any }
  },
);

// Callee — sets the result and the OS finishes the result Activity
function onPickContact(contact: Contact) {
  window.__OS__.setResult({
    resultCode: 'OK',
    data: { name: contact.name, phone: contact.phone },
  });
}
```

`requestCode` allocation, lifecycle, and isolation are handled by the OS. From the caller's perspective, `startActivityForResult` returns `true` if the launch was dispatched and later invokes the callback. The callee calls `setResult({ resultCode, data })`; this stores the result and pops the result Activity. If the user hits back without setting a result, the caller receives `resultCode: 'CANCELED'`.

## How Task stacks behave with intents

| Scenario | Resulting Task layout |
|---|---|
| Launcher → WeChat | New Task A, root = WeChat |
| In WeChat, `startActivity(SMS)` — `launchMode: 'standard'` | New Task B, root = SMS, `launchedByTaskId = A` (one-shot pointer back to WeChat) |
| In WeChat, `startActivityForResult(Alipay)` — `launchMode: 'standard'` | Same Task A; Alipay's Activity is **pushed onto A's stack**. Foreign-task isolation activates (see [`../app/module-contract.md`](../app/module-contract.md)). |
| In WeChat, `startActivity(SMS)` — `launchMode: 'singleTask'`, SMS Task exists | Activates the existing SMS Task; clears any Activities above SMS's root |
| Back from B in callee-finish scenario | B closes, `launchedByTaskId` consumed, A is reactivated |

The framework's contract: **Tasks persist on recents by default** — back doesn't destroy them unless `wasExternallyRouted` says they were created solely from an external `openApp(id, route)` call. Closing a Task is opt-in (`closeApp`).

## Deep links (URL schemes)

Apps can register custom schemes:

```ts
intentFilters: [
  { action: 'ACTION_VIEW', scheme: 'weixin', route: '/deeplink' },
],
```

External code (other apps, the benchmark, a notification payload) can post:

```ts
startActivity({
  action: 'ACTION_VIEW',
  data: 'weixin://chat/1234567',     // URL with scheme + path
});
```

The resolver matches the scheme; the receiving app sees the full URL in its intent extras and routes internally to the appropriate page.

## Working with the broadcast bus

Distinct from Intent dispatch (which targets a specific app), the **broadcast bus** lets one app fire-and-forget a message that any number of registered receivers can pick up.

```ts
// Sender
__OS__.broadcast.sendBroadcast({
  action: 'SMS_RECEIVED',
  extras: { from: '+1234567', body: 'Code: 123456' },
});

// Receiver (registered in state.ts or a startup hook)
__OS__.broadcast.registerReceiver(
  'SMS_RECEIVED',
  (intent) => { /* ... */ },
);
```

Use broadcasts for **system events** (SMS arrived, battery low, settings changed). Use Intent dispatch for **user-initiated cross-app calls** (open this URL, pick a contact, share this text).

## What's not modeled

A short list of AOSP behavior MobileGym deliberately omits, plus the workaround:

| Not modeled | Workaround |
|---|---|
| Per-Activity `launchMode` | Model at filter level (per-Intent-target). |
| `singleTop`, `singleInstance` | Use `singleTask` plus careful route design. |
| Process-level isolation (one app per process) | Single JS process; foreign-task isolation handles same-app double-mount. |
| AndroidManifest `<receiver>` static registration | Receivers registered in `state.ts` or a startup hook; same effect. |
| ContentProvider URIs | Apps use `ContentResolver.query / insert / update / delete` against shared providers in `os/providers/`. |
| Sticky broadcasts | Use the OsStateStore for persistent system state; broadcasts are fire-and-forget only. |
| Explicit pending intents (notification payloads) | Notifications take a `route` field; tapping the notification calls `openApp(notification.appId, notification.route)`. |

## Scenario traces

These traces are intentionally short. They document the observable Task/back-stack behavior that app authors and task authors rely on.

### Caller opens SMS in a new Task

Example: Railway opens the SMS app to compose or inspect a verification message.

1. Caller invokes `startActivity(intent, { newTask: true })`.
2. `IntentResolver` matches a `standard` filter and creates or activates the SMS Task.
3. The SMS Task receives `launchedByTaskId` pointing back to the caller Task.
4. If the user backs out at SMS root, app-level back returns false, Activity-level back returns false, and `os.returnToLauncherTask` reactivates the caller Task.
5. The one-shot `launchedByTaskId` pointer is consumed. A later return from recents goes home instead of bouncing back to the original caller.

### Share target with `singleTask`

Example: Gallery shares an image into WeChat.

1. Caller sends `ACTION_SEND image/*`.
2. WeChat's matching filter declares `launchMode: 'singleTask'`, so the intent is promoted into WeChat's own Task.
3. If WeChat is not running, a new WeChat Task is created and navigates from `/` to the share route.
4. If WeChat already exists, Activities above the root are cleared and the share route is pushed from the root route.
5. After the share flow completes, WeChat remains in recents. Back from the final chat usually returns to WeChat home, then to the caller only if the one-shot caller pointer is still present.

### Same-Task document/viewer push

Example: Settings opens FileManager for a storage category without `newTask`.

1. Caller invokes `startActivity(intent)` without `newTask`.
2. `IntentResolver` matches a `standard` filter.
3. The target Activity is pushed onto the caller's current Task instead of creating the target app's own Task.
4. Back at the target route root falls through to `os.finishTopActivity`, popping the borrowed Activity and revealing the caller Activity underneath.
5. No standalone target Task is left in recents.

### Notification route

Notifications do not model Android `PendingIntent` objects directly. They store `appId` plus `route`.

1. User taps a notification.
2. The notification handler calls `openApp(appId, route)`.
3. If the app is cold, a Task is created and the route is pushed from `/`.
4. If the app is already running, the route is pushed on top of the app's current MemoryRouter history.
5. Back pops to the previous in-app route; when the app root is reached, normal Task fallback rules apply.

## Where to go next

- 📱 The full app contract that declares `intentFilters` → [`../app/module-contract.md`](../app/module-contract.md)
- 🧭 Full cross-app Task/back-stack traces → [`cross-app-launch.md`](cross-app-launch.md)
- 🧠 How `BackDispatcher` interacts with Task stacks during intent flows → [`overview.md`](overview.md)
- 🤖 AOSP → MobileGym translation table → [`../android-mapping.md`](../android-mapping.md)
- 🧪 Cross-app benchmark tasks (and what they validate) → [`../../../bench_env/docs/task/TASK_CODE_SPEC.md`](../../../bench_env/docs/task/TASK_CODE_SPEC.md)
