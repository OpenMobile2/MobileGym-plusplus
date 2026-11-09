// Deterministic DiDi monkey walkthrough.
// Run while Vite is serving the simulator:
//   DIDI_URL=http://127.0.0.1:5193 node apps/Didi/assets/monkey_walkthrough.mjs
import fs from 'node:fs';
import puppeteer from 'puppeteer';

const URL = process.env.DIDI_URL || 'http://127.0.0.1:5193';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STEPS = Number(process.env.DIDI_MONKEY_STEPS || 260);
const SEEDS = (process.env.DIDI_MONKEY_SEEDS || '20260725,731')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter(Number.isFinite);
const REPORT_PATH = process.env.DIDI_MONKEY_REPORT || '';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isNavigationRace = (error) => /Execution context was destroyed|Cannot find context/i.test(String(error));
const IDEMPOTENT_IDS = new Set([
  'home.tab',
  'messages.tab',
  'trips.tab',
  'me.tab',
  'car.select.category.pick',
  'hitch.home.order.filter',
  'trips.list.section',
]);

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function sampleInput(id, type) {
  if (type === 'email' || id.includes('email')) return 'tester@example.invalid';
  if (type === 'tel' || id.includes('phone')) return '00000000000';
  if (id.includes('code')) return '123456';
  if (id.includes('tax')) return '91310000TEST123456';
  if (id.includes('title')) return '测试科技有限公司';
  if (id.includes('name')) return '测试乘客';
  if (id.includes('dest') || id.includes('place')) return '云江东站';
  if (id.includes('support') || id.includes('chat')) return '如何取消订单';
  return '测试内容';
}

async function appSnapshot(page, retries = 2) {
  try {
    return await page.evaluate(() => {
    const root = document.querySelector('[data-app-id="didi"]');
    if (!root) return null;
    const rootStyle = window.getComputedStyle(root);
    const rootRect = root.getBoundingClientRect();
    if (
      rootStyle.display === 'none'
      || rootStyle.visibility === 'hidden'
      || rootRect.width < 2
      || rootRect.height < 2
      || rootRect.bottom <= 0
      || rootRect.top >= window.innerHeight
    ) return null;
    const controls = [...root.querySelectorAll(
      'button,input,textarea,select,[role="button"],[data-action],[data-trigger]',
    )];
    const seen = new Set();
    const items = [];
    controls.forEach((node) => {
      if (seen.has(node)) return;
      seen.add(node);
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (
        style.display === 'none'
        || style.visibility === 'hidden'
        || rect.width < 2
        || rect.height < 2
        || rect.bottom <= 0
        || rect.top >= window.innerHeight
        || rect.right <= 0
        || rect.left >= window.innerWidth
      ) return;
      const action = node.getAttribute('data-action');
      const trigger = node.getAttribute('data-trigger');
      if (!action && !trigger && node.closest("[data-map-provider]")) {
        return;
      }
      const label = (
        node.getAttribute('aria-label')
        || node.getAttribute('placeholder')
        || node.textContent
        || node.tagName
      ).replace(/\s+/g, ' ').trim().slice(0, 70);
      const id = action || trigger || '';
      items.push({
        index: items.length,
        key: id
          ? `${action ? 'action' : 'trigger'}:${id}`
          : `visible:${node.tagName.toLowerCase()}:${label}`,
        id,
        label,
        tag: node.tagName,
        type: node.getAttribute('type') || '',
        gesture: node.getAttribute('data-action-type')
          || node.getAttribute('data-trigger-type')
          || 'tap',
        disabled: Boolean(node.disabled) || node.getAttribute('aria-disabled') === 'true',
      });
    });
    const state = window.__SIM__?.getState?.().apps?.didi;
    return {
      items,
      text: (root.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 1200),
      state: state ? JSON.stringify(state) : '',
      form: JSON.stringify(
        [...root.querySelectorAll('input,textarea,select')].map((node) => ({
          value: node.value,
          checked: Boolean(node.checked),
          selectedIndex: node.selectedIndex,
        })),
      ),
    };
    });
  } catch (error) {
    if (!isNavigationRace(error) || retries === 0) throw error;
    await sleep(120);
    return appSnapshot(page, retries - 1);
  }
}

async function ensureDidi(page) {
  let snapshot = await appSnapshot(page);
  if (snapshot) return snapshot;

  const osReady = await page.evaluate(() => Boolean(window.__OS__?.openApp)).catch(() => false);
  if (!osReady) {
    await page.goto(URL, { waitUntil: 'networkidle0' });
  }
  await page.waitForFunction(() => Boolean(window.__OS__?.openApp), { timeout: 5000 });
  await page.evaluate(() => window.__OS__.openApp('didi'));
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-app-id="didi"]');
    if (!root || window.__OS__?.state.activeAppId !== 'didi') return false;
    const rect = root.getBoundingClientRect();
    const style = window.getComputedStyle(root);
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width >= 2
      && rect.height >= 2
      && rect.bottom > 0
      && rect.top < window.innerHeight;
  }, { timeout: 5000 });
  snapshot = await appSnapshot(page);
  if (!snapshot) throw new Error('DiDi app shell did not render');
  return snapshot;
}

async function safeBack(page) {
  const handled = await page.evaluate(() => {
    if (!window.__OS__?.handleBack) return false;
    window.__OS__.handleBack();
    return true;
  }).catch(() => false);
  if (!handled) await page.goto(URL, { waitUntil: 'networkidle0' });
}

async function selectTarget(page, item) {
  return page.evaluate((target) => {
    document.querySelectorAll('[data-monkey-target]').forEach((node) => {
      node.removeAttribute('data-monkey-target');
    });
    const root = document.querySelector('[data-app-id="didi"]');
    if (!root) return false;
    const controls = [...root.querySelectorAll(
      'button,input,textarea,select,[role="button"],[data-action],[data-trigger]',
    )];
    const seen = new Set();
    const visible = [];
    controls.forEach((node) => {
      if (seen.has(node)) return;
      seen.add(node);
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (
        style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.width >= 2
        && rect.height >= 2
        && rect.bottom > 0
        && rect.top < window.innerHeight
        && rect.right > 0
        && rect.left < window.innerWidth
      ) {
        const action = node.getAttribute('data-action');
        const trigger = node.getAttribute('data-trigger');
        if (!action && !trigger && node.closest("[data-map-provider]")) {
          return;
        }
        visible.push(node);
      }
    });
    const node = visible[target.index];
    if (!node) return false;
    node.setAttribute('data-monkey-target', 'true');
    return true;
  }, item);
}

async function performItem(page, item) {
  if (!await selectTarget(page, item)) throw new Error('target disappeared');
  const handle = await page.$('[data-monkey-target="true"]');
  if (!handle) throw new Error('target handle missing');

  try {
    if (item.tag === 'INPUT' || item.tag === 'TEXTAREA') {
      if (item.type === 'checkbox' || item.type === 'radio') {
        await handle.click();
      } else {
        await handle.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
        await handle.type(sampleInput(item.id, item.type), { delay: 8 });
      }
    } else if (item.tag === 'SELECT') {
      await handle.evaluate((select) => {
        const options = [...select.options];
        if (options.length < 2) return;
        const current = options.findIndex((option) => option.value === select.value);
        select.value = options[(current + 1) % options.length].value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } else if (item.gesture === 'longPress') {
      const box = await handle.boundingBox();
      if (!box) throw new Error('long press target has no bounds');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await sleep(720);
      await page.mouse.up();
    } else if (item.gesture === 'doubleTap') {
      await handle.click({ clickCount: 2, delay: 90 });
    } else {
      await handle.click();
    }
  } finally {
    await page.evaluate(() => {
      document.querySelectorAll('[data-monkey-target]').forEach((node) => {
        node.removeAttribute('data-monkey-target');
      });
    });
  }
}

async function performMapDrag(page, random) {
  const map = await page.$('[data-map-selectable="true"]').catch((error) => {
    if (isNavigationRace(error)) return null;
    throw error;
  });
  const box = await map?.boundingBox();
  if (!box) return false;
  const start = {
    x: box.x + box.width * (0.42 + random() * 0.16),
    y: box.y + box.height * (0.40 + random() * 0.16),
  };
  const dx = (random() - 0.5) * Math.min(150, box.width * 0.5);
  const dy = (random() - 0.5) * Math.min(100, box.height * 0.35);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let index = 1; index <= 6; index += 1) {
    await page.mouse.move(start.x + dx * index / 6, start.y + dy * index / 6);
  }
  await page.mouse.up();
  return true;
}

async function closeKeyboard(page) {
  const keyboard = await page.$('[data-keyboard-active]').catch((error) => {
    if (isNavigationRace(error)) return null;
    throw error;
  });
  if (keyboard) {
    await safeBack(page);
    await sleep(120);
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME });
  const report = {
    url: URL,
    seeds: SEEDS,
    requestedSteps: STEPS,
    executedSteps: 0,
    clicks: 0,
    backs: 0,
    scrolls: 0,
    mapDrags: 0,
    appReopens: 0,
    covered: [],
    screens: 0,
    noEffect: [],
    unclickable: [],
    blankScreens: [],
    runtimeErrors: [],
  };
  const covered = new Set();
  const screenSignatures = new Set();
  const testedForEffect = new Set();

  try {
    for (const seed of SEEDS) {
      const page = await browser.newPage();
      const random = seededRandom(seed);
      await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });
      page.on('pageerror', (error) => {
        report.runtimeErrors.push(`pageerror: ${String(error).slice(0, 220)}`);
      });
      page.on('console', (message) => {
        const value = message.text();
        if (
          message.type() === 'error'
          && !value.includes('[WMR]')
          && !value.includes('404')
        ) {
          report.runtimeErrors.push(`console: ${value.slice(0, 180)}`);
        }
      });

      await page.goto(URL, { waitUntil: 'networkidle0' });
      await page.evaluate(() => window.__OS__.openApp('didi'));
      await sleep(500);

      for (let step = 0; step < STEPS; step += 1) {
        report.executedSteps += 1;
        await closeKeyboard(page);
        const before = await ensureDidi(page);
        if (before.text.length < 4 || before.items.length === 0) {
          report.blankScreens.push({ seed, step, text: before.text });
          await safeBack(page);
          await sleep(150);
          continue;
        }

        screenSignatures.add(before.items.map((item) => item.key).sort().join('|'));
        const roll = random();
        if (roll < 0.14) {
          await safeBack(page);
          report.backs += 1;
          await sleep(180);
          if (!await appSnapshot(page)) report.appReopens += 1;
          continue;
        }
        if (roll < 0.22 && await performMapDrag(page, random)) {
          report.mapDrags += 1;
          await sleep(300);
          continue;
        }
        if (roll < 0.30) {
          const scrolled = await page.evaluate((direction) => {
            const root = document.querySelector('[data-app-id="didi"]');
            const container = root?.querySelector('[data-scroll-container="main"]');
            if (!container) return false;
            container.scrollBy({ top: direction * 260, behavior: 'instant' });
            return true;
          }, random() < 0.72 ? 1 : -1);
          if (scrolled) report.scrolls += 1;
          await sleep(120);
          continue;
        }

        const enabled = before.items.filter((item) => !item.disabled);
        if (enabled.length === 0) {
          await safeBack(page);
          report.backs += 1;
          continue;
        }
        const unseen = enabled.filter((item) => !covered.has(item.key));
        const pool = unseen.length > 0 && random() < 0.78 ? unseen : enabled;
        const item = pool[Math.floor(random() * pool.length)];
        const firstEffectCheck = !testedForEffect.has(item.key) && !IDEMPOTENT_IDS.has(item.id);
        const errorsBefore = report.runtimeErrors.length;

        try {
          if (item.id.endsWith('.pan')) {
            if (!await performMapDrag(page, random)) throw new Error('map pan surface missing');
          } else {
            await performItem(page, item);
          }
          report.clicks += 1;
          covered.add(item.key);
          testedForEffect.add(item.key);
          await sleep(240);
          const after = await appSnapshot(page);
          if (!after) {
            report.appReopens += 1;
          } else if (
            firstEffectCheck
            && before.text === after.text
            && before.state === after.state
            && before.form === after.form
            && errorsBefore === report.runtimeErrors.length
          ) {
            report.noEffect.push({
              key: item.key,
              label: item.label,
              seed,
              step,
            });
          }
        } catch (error) {
          report.unclickable.push({
            key: item.key,
            label: item.label,
            seed,
            step,
            error: String(error).slice(0, 180),
          });
          await safeBack(page);
          await sleep(150);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  report.covered = [...covered].sort();
  report.screens = screenSignatures.size;
  report.runtimeErrors = [...new Set(report.runtimeErrors)];
  report.noEffect = report.noEffect.filter(
    (item, index, items) => items.findIndex((candidate) => candidate.key === item.key) === index,
  );
  report.unclickable = report.unclickable.filter(
    (item, index, items) => items.findIndex((candidate) => candidate.key === item.key) === index,
  );

  if (REPORT_PATH) fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    seeds: report.seeds,
    steps: report.executedSteps,
    clicks: report.clicks,
    backs: report.backs,
    scrolls: report.scrolls,
    mapDrags: report.mapDrags,
    appReopens: report.appReopens,
    covered: report.covered.length,
    screens: report.screens,
    noEffect: report.noEffect.length,
    unclickable: report.unclickable.length,
    blankScreens: report.blankScreens.length,
    runtimeErrors: report.runtimeErrors.length,
    report: REPORT_PATH || null,
  }, null, 2));
  if (report.noEffect.length) console.log('NO_EFFECT', report.noEffect);
  if (report.unclickable.length) console.log('UNCLICKABLE', report.unclickable);
  if (report.runtimeErrors.length) console.log('RUNTIME_ERRORS', report.runtimeErrors);

  const fatal = report.unclickable.length
    + report.blankScreens.length
    + report.runtimeErrors.length;
  process.exitCode = fatal > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error('MONKEY CRASHED', error);
  process.exitCode = 1;
});
