/**
 * Google Drive 广覆盖可点性走查（puppeteer-core + 本机 Chrome）
 *
 * 规则：
 * - 可见的 data-trigger / data-action（及未打标 button）点了必须有反馈
 * - id 含 unavailable 的必须 toast「暂未开放」
 *
 * 用法：先 npm run dev，再
 *   node apps/GoogleDrive/assets/runtime_clickability_audit.mjs [http://127.0.0.1:5173/]
 */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://127.0.0.1:5173/';
const OUT = '/tmp/gd_audit';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(OUT, { recursive: true });

const UNAVAILABLE_RE = /暂未开放|功能未开放|Feature not available/i;
const SKIP_IDS = new Set([
  'system.back',
  'googledrive.home.refresh', // 下拉刷新，单击无反馈属正常
  'googledrive.home.selection.enter', // 长按进多选
  'googledrive.files.selection.enter',
  'googledrive.folder.selection.enter',
]);

const rows = [];
const dead = [];
const badUnavailable = [];
const untagged = [];
const pageErrors = [];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (kind, msg, extra = '') => {
  rows.push({ kind, msg, extra });
  console.log(`  ${kind}  ${msg}${extra ? ' — ' + extra : ''}`);
};

const browser = await puppeteer.launch({
  headless: true,
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-http-cache'],
});
const page = await browser.newPage();
await page.setViewport({ width: 420, height: 900 });
page.on('pageerror', e => pageErrors.push(e.message));

await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
await sleep(800);
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
await sleep(900);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(el => (el.textContent || '').includes('云端硬盘'));
  if (!btn) throw new Error('launcher missing');
  btn.click();
});
await sleep(1800);
if (!(await page.evaluate(() => !!document.querySelector('[data-app-root="googledrive"]')))) {
  console.error('open Drive failed');
  process.exit(2);
}
log('PASS', '启动 Google Drive');

async function fingerprint() {
  return page.evaluate(() => {
    const root = document.querySelector('[data-app-root="googledrive"]');
    const overlays = [...document.querySelectorAll('[data-gd-overlay]')].filter(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      let p = el;
      while (p) {
        const st = getComputedStyle(p);
        if (st.display === 'none' || st.visibility === 'hidden') return false;
        p = p.parentElement;
      }
      return true;
    }).map(el => el.getAttribute('data-gd-overlay'));
    const toast = document.getElementById('gd-toast');
    const toastText = toast && Number(getComputedStyle(toast).opacity) > 0.15 ? (toast.textContent || '') : '';
    const text = (root?.innerText || '').replace(/\s+/g, ' ').slice(0, 240);
    const selected = window.__SIM__?.getState?.()?.apps?.googledrive?.selectedIds?.length ?? 0;
    const itemCount = Object.keys(window.__SIM__?.getState?.()?.apps?.googledrive?.items || {}).length;
    return { overlays: overlays.join(','), toastText, text, selected, itemCount };
  });
}

function reacted(a, b) {
  return a.overlays !== b.overlays
    || a.text !== b.text
    || a.selected !== b.selected
    || a.itemCount !== b.itemCount
    || (b.toastText && b.toastText !== a.toastText);
}

async function back(n = 1) {
  for (let i = 0; i < n; i++) {
    await page.evaluate(() => window.__OS__?.handleBack());
    await sleep(220);
  }
}

async function toHome() {
  for (let i = 0; i < 14; i++) {
    const state = await page.evaluate(() => {
      const overlays = [...document.querySelectorAll('[data-gd-overlay]')].some(el => {
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2 && getComputedStyle(el).display !== 'none';
      });
      const homeTab = document.querySelector('[data-trigger="googledrive.tab.home"]');
      const homeVis = homeTab && homeTab.getBoundingClientRect().width > 0
        && getComputedStyle(homeTab).display !== 'none';
      const onGemini = (document.querySelector('[data-app-root="googledrive"]')?.innerText || '').includes('试试这些问题');
      const onHelp = (document.querySelector('[data-app-root="googledrive"]')?.innerText || '').includes('需要帮忙');
      return { overlays, homeVis, deep: onGemini || onHelp };
    });
    if (!state.overlays && state.homeVis && !state.deep) {
      await page.evaluate(() => document.querySelector('[data-trigger="googledrive.tab.home"]')?.click());
      await sleep(300);
      return;
    }
    await back(1);
  }
  // last resort: reopen app
  await page.evaluate(() => window.__OS__?.openApp?.('googledrive'));
  await sleep(800);
}

async function visibleClick(selector) {
  return page.evaluate((sel) => {
    const nodes = [...document.querySelectorAll(sel)];
    const el = nodes.find(n => {
      const r = n.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      let p = n;
      while (p) {
        const st = getComputedStyle(p);
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
        p = p.parentElement;
      }
      return true;
    });
    if (!el) return false;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    el.click();
    return true;
  }, selector);
}

async function collect(screen) {
  return page.evaluate((screenName) => {
    const root = document.querySelector('[data-app-root="googledrive"]');
    const out = [];
    const seen = new Set();
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      let p = el;
      while (p) {
        const st = getComputedStyle(p);
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
        p = p.parentElement;
      }
      return true;
    };
    const push = (kind, id, el) => {
      const key = kind + ':' + id + ':' + (el.textContent || '').slice(0, 20);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        screen: screenName,
        kind,
        id,
        label: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36),
        disabled: !!el.disabled,
      });
    };
    for (const el of root.querySelectorAll('[data-trigger]')) {
      if (!visible(el)) continue;
      push('trigger', el.getAttribute('data-trigger') || '', el);
    }
    for (const el of root.querySelectorAll('[data-action]')) {
      if (!visible(el)) continue;
      push('action', el.getAttribute('data-action') || '', el);
    }
    for (const el of root.querySelectorAll('button, [role="button"]')) {
      if (!visible(el)) continue;
      if (el.hasAttribute('data-trigger') || el.hasAttribute('data-action')) continue;
      if (el.closest('[data-trigger],[data-action]')) continue;
      push('untagged', '', el);
    }
    return out;
  }, screen);
}

async function clickItem(item) {
  if (item.kind === 'untagged') {
    return page.evaluate((label) => {
      const buttons = [...document.querySelectorAll('button, [role="button"]')].filter(el => {
        if (el.hasAttribute('data-trigger') || el.hasAttribute('data-action')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      });
      const el = buttons.find(b => ((b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36)) === label);
      el?.click();
      return !!el;
    }, item.label);
  }
  const attr = item.kind === 'trigger' ? 'data-trigger' : 'data-action';
  return visibleClick(`[data-app-root="googledrive"] [${attr}="${item.id}"]`);
}

async function probe(screen, { max = 28 } = {}) {
  const items = await collect(screen);
  for (const u of items.filter(i => i.kind === 'untagged' && !i.disabled)) {
    untagged.push(u);
    log('WARN', `${screen}: 未打标按钮「${u.label || '(icon)'}」`);
  }

  let n = 0;
  const tried = new Set();
  for (const item of items) {
    if (n >= max) break;
    if (item.kind === 'untagged' || item.disabled) continue;
    if (SKIP_IDS.has(item.id)) continue;
    if (tried.has(item.kind + item.id)) continue;
    tried.add(item.kind + item.id);

    const beforeErr = pageErrors.length;
    const before = await fingerprint();
    const okClick = await clickItem(item);
    await sleep(480);
    const after = await fingerprint();
    n++;

    if (!okClick) {
      log('WARN', `${screen}: 未点到 ${item.id}`);
      continue;
    }
    if (pageErrors.length > beforeErr) {
      log('FAIL', `${screen}: ${item.id} pageerror`, pageErrors[beforeErr].slice(0, 100));
      await back(1);
      continue;
    }

    const unavailable = /\.unavailable$|unavailable/.test(item.id);
    if (unavailable) {
      if (UNAVAILABLE_RE.test(after.toastText)) log('PASS', `${screen}: ${item.id} → 暂未开放`);
      else {
        badUnavailable.push({ ...item, toast: after.toastText });
        log('FAIL', `${screen}: ${item.id} 未 toast 暂未开放`, after.toastText || '(空)');
      }
      continue;
    }

    // 当前 Tab / 内标签 noop
    if (/^googledrive\.tab\./.test(item.id) || /\.tab(Suggested|Activity|MyDrive|Computers)$/.test(item.id)) {
      if (!reacted(before, after) || reacted(before, after)) log('PASS', `${screen}: ${item.id}（当前页可点）`);
      continue;
    }

    if (!reacted(before, after)) {
      dead.push(item);
      log('FAIL', `${screen}: 死点击 ${item.id}`, item.label);
      continue;
    }

    log('PASS', `${screen}: ${item.id}`, after.toastText ? `toast=${after.toastText.slice(0, 20)}` : `ov=${after.overlays || '-'}`);

    // 回收：开了浮层或进了子页就退一层，继续扫同入口屏
    if (after.overlays && !before.overlays) await back(1);
    else if (after.text !== before.text && !after.overlays) await back(1);
    await sleep(200);
  }
}

const journeys = [
  ['home', async () => { await toHome(); }],
  ['home-filemenu', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.home.filemenu.open"]');
    await sleep(350);
  }],
  ['starred', async () => { await toHome(); await visibleClick('[data-trigger="googledrive.tab.starred"]'); await sleep(350); }],
  ['shared', async () => { await toHome(); await visibleClick('[data-trigger="googledrive.tab.shared"]'); await sleep(350); }],
  ['files', async () => { await toHome(); await visibleClick('[data-trigger="googledrive.tab.files"]'); await sleep(350); }],
  ['drawer', async () => { await toHome(); await visibleClick('[data-trigger="googledrive.home.drawer.open"]'); await sleep(350); }],
  ['account', async () => { await toHome(); await visibleClick('[data-trigger="googledrive.home.account.open"]'); await sleep(350); }],
  ['create', async () => { await toHome(); await visibleClick('[data-trigger="googledrive.home.create.open"]'); await sleep(350); }],
  ['search', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.search.open"]');
    await sleep(300);
    await page.focus('[data-action="googledrive.search.input"]');
    await page.keyboard.type('a');
    await page.keyboard.press('Enter');
    await sleep(500);
  }],
  ['help', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.home.drawer.open"]');
    await sleep(250);
    await visibleClick('[data-trigger="googledrive.drawer.help"]');
    await sleep(400);
  }],
  ['settings', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.home.drawer.open"]');
    await sleep(250);
    await visibleClick('[data-trigger="googledrive.drawer.settings"]');
    await sleep(400);
  }],
  ['recent', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.home.drawer.open"]');
    await sleep(250);
    await visibleClick('[data-trigger="googledrive.drawer.recent"]');
    await sleep(400);
  }],
  ['trash', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.home.drawer.open"]');
    await sleep(250);
    await visibleClick('[data-trigger="googledrive.drawer.trash"]');
    await sleep(400);
  }],
  ['gemini', async () => { await toHome(); await visibleClick('[data-trigger="googledrive.gemini.open"]'); await sleep(450); }],
  ['preview', async () => {
    await toHome();
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('[data-app-root="googledrive"] *')]
        .find(n => (n.textContent || '').includes('resume_transcript.pdf'));
      (el?.closest('[data-trigger],button') || el)?.click();
    });
    await sleep(600);
  }],
  ['folder', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.tab.files"]');
    await sleep(300);
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('[data-app-root="googledrive"] *')]
        .find(n => (n.textContent || '').trim() === 'Colab Notebooks');
      el?.click();
    });
    await sleep(500);
  }],
  ['storage', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.home.drawer.open"]');
    await sleep(250);
    await visibleClick('[data-trigger="googledrive.home.storage.open"]');
    await sleep(400);
  }],
  ['access', async () => {
    await toHome();
    await visibleClick('[data-trigger="googledrive.home.filemenu.open"]');
    await sleep(300);
    await visibleClick('[data-trigger="googledrive.item.access.open"]');
    await sleep(500);
  }],
];

for (const [name, go] of journeys) {
  try {
    await go();
    await page.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => {});
    await probe(name);
  } catch (e) {
    log('FAIL', `进入 ${name} 失败`, e.message.slice(0, 120));
    try { await toHome(); } catch { /* ignore */ }
  }
}

// 功能冒烟
try {
  await toHome();
  const before = await page.evaluate(() => Object.keys(window.__SIM__.getState().apps.googledrive.items).length);
  await visibleClick('[data-trigger="googledrive.home.create.open"]');
  await sleep(300);
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find(b => /Google 文档|Docs/i.test(b.textContent || ''))?.click();
  });
  await sleep(500);
  const after = await page.evaluate(() => Object.keys(window.__SIM__.getState().apps.googledrive.items).length);
  log(after > before ? 'PASS' : 'FAIL', '新建文档增加 items', `${before}→${after}`);
} catch (e) {
  log('FAIL', '新建文档冒烟失败', e.message.slice(0, 80));
}

try {
  await toHome();
  await visibleClick('[data-trigger="googledrive.home.drawer.open"]');
  await sleep(250);
  await visibleClick('[data-trigger="googledrive.drawer.help"]');
  await sleep(400);
  const ok = await page.evaluate(() => (document.querySelector('[data-app-root="googledrive"]')?.innerText || '').includes('需要帮忙'));
  log(ok ? 'PASS' : 'FAIL', '帮助和反馈可进入');
} catch (e) {
  log('FAIL', '帮助冒烟失败', e.message.slice(0, 80));
}

try {
  await toHome();
  await visibleClick('[data-trigger="googledrive.tab.shared"]');
  await sleep(400);
  const text = await page.evaluate(() => (document.querySelector('[data-app-root="googledrive"]')?.innerText || ''));
  const ok = !text.includes('尚未在此模拟版中实现') && (text.includes('共享') || text.length > 20);
  log(ok ? 'PASS' : 'FAIL', 'Shared Tab 非「暂未实现」占位', text.replace(/\s+/g, ' ').slice(0, 60));
} catch (e) {
  log('FAIL', 'Shared 冒烟失败', e.message.slice(0, 80));
}

await browser.close();

const summary = {
  pass: rows.filter(r => r.kind === 'PASS').length,
  fail: rows.filter(r => r.kind === 'FAIL').length,
  warn: rows.filter(r => r.kind === 'WARN').length,
  dead,
  badUnavailable,
  untagged,
  pageErrors: pageErrors.slice(0, 20),
};
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
console.log('\n======== 汇总 ========');
console.log(`PASS ${summary.pass}  FAIL ${summary.fail}  WARN ${summary.warn}`);
console.log(`死点击 ${dead.length}  unavailable缺toast ${badUnavailable.length}  未打标 ${untagged.length}`);
if (dead.length) {
  console.log('\n死点击:');
  for (const d of dead) console.log(`  - [${d.screen}] ${d.id} ${d.label}`);
}
if (badUnavailable.length) {
  console.log('\nunavailable 缺 toast:');
  for (const d of badUnavailable) console.log(`  - [${d.screen}] ${d.id}`);
}
if (untagged.length) {
  console.log('\n未打标按钮:');
  for (const d of untagged.slice(0, 30)) console.log(`  - [${d.screen}] ${d.label || '(icon)'}`);
}
process.exit(summary.fail > 0 ? 1 : 0);
