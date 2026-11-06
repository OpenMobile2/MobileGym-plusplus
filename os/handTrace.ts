/**
 * 手点采集：点击 [data-action]/[data-trigger] 时自动记动作 + getState diff。
 * URL 带 ?handtrace=1 自动开启；也可 __SIM__.handTrace.enable()。
 */
export type HandTraceEvent = {
  seq: number;
  t: number;
  appId: string | null;
  actionId: string;
  actionKind: 'action' | 'trigger' | 'unknown';
  gesture: string | null;
  params: unknown;
  path: string;
  stateChanged: boolean;
  changedPaths: string[];
  /** 仅变化路径的前后值（便于任务断言） */
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

type GetState = () => { os: Record<string, unknown>; apps: Record<string, unknown> };

const MAX_PATHS = 48;
const MAX_STR = 200;
const SETTLE_MS = 60;

let enabled = false;
let seq = 0;
const events: HandTraceEvent[] = [];
let getStateFn: GetState | null = null;
let badgeEl: HTMLDivElement | null = null;
let listening = false;

function truncate(v: unknown): unknown {
  if (typeof v === 'string' && v.length > MAX_STR) return `${v.slice(0, MAX_STR)}…`;
  if (Array.isArray(v)) return { __type: 'array', length: v.length, head: v.slice(0, 3).map(truncate) };
  if (v && typeof v === 'object') {
    const keys = Object.keys(v as object);
    if (keys.length > 12) return { __type: 'object', keys: keys.slice(0, 12), keyCount: keys.length };
  }
  return v;
}

function snapshotInteresting(state: { os: Record<string, unknown>; apps: Record<string, unknown> }) {
  const os = state.os || {};
  return {
    activeAppId: os.activeAppId ?? null,
    clipboard: os.clipboard ?? null,
    apps: state.apps || {},
  };
}

function walkDiff(
  before: unknown,
  after: unknown,
  path: string,
  out: { paths: string[]; before: Record<string, unknown>; after: Record<string, unknown> },
) {
  if (out.paths.length >= MAX_PATHS) return;
  if (Object.is(before, after)) return;
  const bObj = before && typeof before === 'object';
  const aObj = after && typeof after === 'object';
  if (!bObj || !aObj || Array.isArray(before) || Array.isArray(after)) {
    out.paths.push(path || '(root)');
    out.before[path || '(root)'] = truncate(before);
    out.after[path || '(root)'] = truncate(after);
    return;
  }
  const bk = new Set([...Object.keys(before as object), ...Object.keys(after as object)]);
  for (const k of bk) {
    if (typeof (before as any)[k] === 'function' || typeof (after as any)[k] === 'function') continue;
    walkDiff(
      (before as any)[k],
      (after as any)[k],
      path ? `${path}.${k}` : k,
      out,
    );
    if (out.paths.length >= MAX_PATHS) return;
  }
}

function findActionTarget(el: EventTarget | null): HTMLElement | null {
  if (!(el instanceof Element)) return null;
  return el.closest('[data-action],[data-trigger]') as HTMLElement | null;
}

function parseParams(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function updateBadge() {
  if (!badgeEl) return;
  const changed = events.filter((e) => e.stateChanged).length;
  badgeEl.textContent = `手点采集 · ${events.length} 击 / ${changed} 改数 · 点此下载`;
}

function ensureBadge() {
  if (badgeEl || typeof document === 'undefined') return;
  badgeEl = document.createElement('div');
  badgeEl.id = '__hand_trace_badge';
  Object.assign(badgeEl.style, {
    position: 'fixed',
    right: '8px',
    bottom: '8px',
    zIndex: '2147483646',
    padding: '6px 10px',
    fontSize: '12px',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    background: 'rgba(20,20,20,0.82)',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    userSelect: 'none',
    maxWidth: '240px',
    lineHeight: '1.3',
  } as CSSStyleDeclaration);
  badgeEl.title = '点击下载 JSON；控制台: __SIM__.handTrace';
  badgeEl.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    download();
  };
  document.body.appendChild(badgeEl);
  updateBadge();
}

function removeBadge() {
  badgeEl?.remove();
  badgeEl = null;
}

function captureClick(ev: Event) {
  if (!enabled || !getStateFn) return;
  const target = findActionTarget(ev.target);
  if (!target) return;

  const actionId =
    target.getAttribute('data-action') ||
    target.getAttribute('data-trigger') ||
    '(untagged)';
  const actionKind: HandTraceEvent['actionKind'] = target.hasAttribute('data-action')
    ? 'action'
    : target.hasAttribute('data-trigger')
      ? 'trigger'
      : 'unknown';
  const gesture =
    target.getAttribute('data-action-type') ||
    target.getAttribute('data-trigger-type');
  const params = parseParams(
    target.getAttribute('data-action-params') || target.getAttribute('data-trigger-params'),
  );

  let beforeSnap: ReturnType<typeof snapshotInteresting>;
  try {
    beforeSnap = snapshotInteresting(getStateFn());
  } catch {
    return;
  }

  const finish = () => {
    if (!getStateFn) return;
    let afterSnap: ReturnType<typeof snapshotInteresting>;
    try {
      afterSnap = snapshotInteresting(getStateFn());
    } catch {
      return;
    }
    const out = { paths: [] as string[], before: {} as Record<string, unknown>, after: {} as Record<string, unknown> };
    walkDiff(beforeSnap, afterSnap, '', out);
    seq += 1;
    events.push({
      seq,
      t: Date.now(),
      appId: (afterSnap.activeAppId as string | null) ?? (beforeSnap.activeAppId as string | null),
      actionId,
      actionKind,
      gesture,
      params,
      path: typeof location !== 'undefined' ? location.pathname + location.search : '',
      stateChanged: out.paths.length > 0,
      changedPaths: out.paths,
      before: out.before,
      after: out.after,
    });
    updateBadge();
    // 控制台一行摘要，不打断手点
    if (out.paths.length > 0) {
      console.log(
        `%c[handTrace] #${seq} ${actionId} → ${out.paths.slice(0, 5).join(', ')}${out.paths.length > 5 ? '…' : ''}`,
        'color:#0a7',
      );
    } else {
      console.log(`%c[handTrace] #${seq} ${actionId} (无 store/OS 变化)`, 'color:#888');
    }
  };

  // 等 React setState / 导航落稳
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(finish, SETTLE_MS);
    });
  });
}

function attachListener() {
  if (listening || typeof document === 'undefined') return;
  document.addEventListener('click', captureClick, true);
  listening = true;
}

function detachListener() {
  if (!listening || typeof document === 'undefined') return;
  document.removeEventListener('click', captureClick, true);
  listening = false;
}

export function dump() {
  return {
    exportedAt: new Date().toISOString(),
    count: events.length,
    changedCount: events.filter((e) => e.stateChanged).length,
    events: events.slice(),
  };
}

export function summary() {
  const lines = [
    `# 手点采集摘要 ${new Date().toISOString()}`,
    '',
    `| # | App | 动作 | 改数? | 变化路径 |`,
    `|---|-----|------|-------|----------|`,
    ...events.map((e) =>
      `| ${e.seq} | ${e.appId ?? '-'} | \`${e.actionId}\` | ${e.stateChanged ? 'Y' : '.'} | ${e.changedPaths.slice(0, 4).join('; ') || '-'} |`,
    ),
    '',
    `有状态变化 ${events.filter((e) => e.stateChanged).length} / 总点击 ${events.length}`,
  ];
  const text = lines.join('\n');
  console.log(text);
  return text;
}

export function download() {
  const blob = new Blob([JSON.stringify(dump(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = URL.createObjectURL(blob);
  a.download = `handtrace-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  summary();
}

export function clear() {
  events.length = 0;
  seq = 0;
  updateBadge();
}

export function enable() {
  enabled = true;
  attachListener();
  ensureBadge();
  console.log('[handTrace] ON — 正常点；结束点角标或 __SIM__.handTrace.download()');
}

export function disable() {
  enabled = false;
  detachListener();
  removeBadge();
  console.log('[handTrace] OFF');
}

export function isEnabled() {
  return enabled;
}

export function getEvents() {
  return events.slice();
}

export type HandTraceApi = {
  enable: typeof enable;
  disable: typeof disable;
  clear: typeof clear;
  dump: typeof dump;
  download: typeof download;
  summary: typeof summary;
  isEnabled: typeof isEnabled;
  getEvents: typeof getEvents;
};

export function installHandTrace(getState: GetState): HandTraceApi {
  getStateFn = getState;

  if (!(installHandTrace as unknown as { _api?: HandTraceApi })._api) {
    const api: HandTraceApi = {
      enable,
      disable,
      clear,
      dump,
      download,
      summary,
      isEnabled,
      getEvents,
    };
    (installHandTrace as unknown as { _api?: HandTraceApi })._api = api;

    const shouldAuto =
      typeof location !== 'undefined' &&
      (new URLSearchParams(location.search).get('handtrace') === '1' ||
        localStorage.getItem('__hand_trace__') === '1');

    if (shouldAuto) {
      if (document.body) enable();
      else document.addEventListener('DOMContentLoaded', () => enable(), { once: true });
    }
  }

  return (installHandTrace as unknown as { _api: HandTraceApi })._api;
}
