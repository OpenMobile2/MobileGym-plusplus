/**
 * 无 rebuild 时的兜底：控制台执行
 *   const s=document.createElement('script');s.src='/hand_trace.js';document.head.appendChild(s);
 * 或打开任意页后粘贴本文件内容。
 * 正常开发请用 ?handtrace=1（os/handTrace.ts）。
 */
(function () {
  if (window.__SIM__ && window.__SIM__.handTrace && window.__SIM__.handTrace.isEnabled) {
    window.__SIM__.handTrace.enable();
    console.log('[hand_trace.js] 已有内置 handTrace，已 enable');
    return;
  }

  const MAX_PATHS = 48;
  const MAX_STR = 200;
  const SETTLE_MS = 60;
  let enabled = false;
  let seq = 0;
  const events = [];
  let badgeEl = null;
  let listening = false;

  function truncate(v) {
    if (typeof v === 'string' && v.length > MAX_STR) return v.slice(0, MAX_STR) + '…';
    if (Array.isArray(v)) return { __type: 'array', length: v.length, head: v.slice(0, 3).map(truncate) };
    if (v && typeof v === 'object') {
      const keys = Object.keys(v);
      if (keys.length > 12) return { __type: 'object', keys: keys.slice(0, 12), keyCount: keys.length };
    }
    return v;
  }

  function snap() {
    const st = window.__SIM__.getState();
    const os = st.os || {};
    return { activeAppId: os.activeAppId ?? null, clipboard: os.clipboard ?? null, apps: st.apps || {} };
  }

  function walkDiff(before, after, path, out) {
    if (out.paths.length >= MAX_PATHS) return;
    if (Object.is(before, after)) return;
    const bObj = before && typeof before === 'object';
    const aObj = after && typeof after === 'object';
    if (!bObj || !aObj || Array.isArray(before) || Array.isArray(after)) {
      const p = path || '(root)';
      out.paths.push(p);
      out.before[p] = truncate(before);
      out.after[p] = truncate(after);
      return;
    }
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const k of keys) {
      if (typeof before[k] === 'function' || typeof after[k] === 'function') continue;
      walkDiff(before[k], after[k], path ? path + '.' + k : k, out);
      if (out.paths.length >= MAX_PATHS) return;
    }
  }

  function captureClick(ev) {
    if (!enabled || !window.__SIM__?.getState) return;
    const el = ev.target && ev.target.closest && ev.target.closest('[data-action],[data-trigger]');
    if (!el) return;
    const actionId = el.getAttribute('data-action') || el.getAttribute('data-trigger') || '(untagged)';
    const actionKind = el.hasAttribute('data-action') ? 'action' : el.hasAttribute('data-trigger') ? 'trigger' : 'unknown';
    const gesture = el.getAttribute('data-action-type') || el.getAttribute('data-trigger-type');
    let params = el.getAttribute('data-action-params') || el.getAttribute('data-trigger-params');
    try { params = params ? JSON.parse(params) : null; } catch (_) {}
    let beforeSnap;
    try { beforeSnap = snap(); } catch (_) { return; }
    const finish = () => {
      let afterSnap;
      try { afterSnap = snap(); } catch (_) { return; }
      const out = { paths: [], before: {}, after: {} };
      walkDiff(beforeSnap, afterSnap, '', out);
      seq += 1;
      events.push({
        seq, t: Date.now(),
        appId: afterSnap.activeAppId ?? beforeSnap.activeAppId,
        actionId, actionKind, gesture, params,
        path: location.pathname + location.search,
        stateChanged: out.paths.length > 0,
        changedPaths: out.paths,
        before: out.before, after: out.after,
      });
      if (badgeEl) {
        const changed = events.filter((e) => e.stateChanged).length;
        badgeEl.textContent = '手点采集 · ' + events.length + ' 击 / ' + changed + ' 改数 · 点此下载';
      }
      console.log('[handTrace] #' + seq, actionId, out.paths.length ? out.paths.slice(0, 5) : '(无变化)');
    };
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(finish, SETTLE_MS)));
  }

  function download() {
    const blob = new Blob([JSON.stringify({
      exportedAt: new Date().toISOString(),
      count: events.length,
      changedCount: events.filter((e) => e.stateChanged).length,
      events: events.slice(),
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'handtrace-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const api = {
    enable() {
      enabled = true;
      if (!listening) {
        document.addEventListener('click', captureClick, true);
        listening = true;
      }
      if (!badgeEl) {
        badgeEl = document.createElement('div');
        Object.assign(badgeEl.style, {
          position: 'fixed', right: '8px', bottom: '8px', zIndex: '2147483646',
          padding: '6px 10px', fontSize: '12px', background: 'rgba(20,20,20,0.82)',
          color: '#fff', borderRadius: '8px', cursor: 'pointer',
        });
        badgeEl.onclick = (e) => { e.stopPropagation(); download(); };
        document.body.appendChild(badgeEl);
        badgeEl.textContent = '手点采集 · 0 击 / 0 改数 · 点此下载';
      }
      console.log('[handTrace] ON');
    },
    disable() {
      enabled = false;
      if (listening) {
        document.removeEventListener('click', captureClick, true);
        listening = false;
      }
      if (badgeEl) { badgeEl.remove(); badgeEl = null; }
    },
    clear() { events.length = 0; seq = 0; },
    dump() { return { events: events.slice(), count: events.length }; },
    download,
    summary() { console.table(events.map((e) => ({ seq: e.seq, app: e.appId, id: e.actionId, changed: e.stateChanged, paths: e.changedPaths.slice(0, 3).join(';') }))); },
    isEnabled() { return enabled; },
    getEvents() { return events.slice(); },
  };

  window.__HAND_TRACE__ = api;
  if (window.__SIM__) window.__SIM__.handTrace = api;
  api.enable();
})();
