// 广覆盖探针：Mail 内可见可点控件点一次后必须有效果，或 toast「暂未开放」。
// 用法：MAIL_URL=http://127.0.0.1:5173 node apps/Mail/assets/dead_button_probe.mjs
import { chromium } from 'playwright';

const URL = process.env.MAIL_URL || 'http://127.0.0.1:5173';
const APP = 'mail';
const UNAVAILABLE_RE = /该功能暂未开放|This feature is not available yet|暂未开放|not available yet/;

const results = [];
const rec = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

async function appSig(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-adjust-resize]') || document.body;
    const text = (root.innerText || '').replace(/\s+/g, ' ').slice(0, 280);
    const triggers = [...root.querySelectorAll('[data-trigger],[data-action]')]
      .map((el) => el.getAttribute('data-trigger') || el.getAttribute('data-action'))
      .slice(0, 50)
      .join('|');
    const state = window.__SIM__?.getState?.()?.apps?.mail;
    const stateSig = state
      ? JSON.stringify({
          mails: state.mails?.length,
          unread: state.mails?.filter((m) => !m.isRead).length,
          selected: state._temp?.selectedIds?.length,
          viewMode: state.settings?.viewMode,
          expanded: state.expandedAccountIds,
          folders: state.customFolders?.length,
          hidden: state.hiddenSmartMailboxes?.length,
          reminded: state.mails?.filter((m) => m.remindedAt != null).length,
          flagged: state.mails?.filter((m) => m.isFlagged).length,
        })
      : '';
    const toast =
      [...document.querySelectorAll('div')]
        .map((d) => d.textContent?.trim() || '')
        .find((t) =>
          /已发送|已复制|已存入草稿|暂未开放|Sent|Copied|Saved|not available|Updated Just Now|刚刚更新/i.test(t),
        ) || '';
    return { text, triggers, stateSig, toast };
  });
}

async function collectTargets(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-adjust-resize]') || document.body;
    const nodes = [...root.querySelectorAll('button, [role="button"], [data-trigger], [data-action]')];
    const out = [];
    for (const el of nodes) {
      const style = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') continue;
      if (r.width < 4 || r.height < 4) continue;
      const cx = r.left + r.width / 2;
      const cy = r.top + Math.min(r.height / 2, 20);
      const top = document.elementFromPoint(cx, cy);
      if (!top || (!el.contains(top) && !top.contains(el))) continue;
      const id =
        el.getAttribute('data-trigger') ||
        el.getAttribute('data-action') ||
        el.getAttribute('aria-label') ||
        (el.textContent || '').trim().slice(0, 40);
      const kind = el.getAttribute('data-trigger')
        ? 'trigger'
        : el.getAttribute('data-action')
          ? 'action'
          : 'button';
      const disabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
      out.push({
        id: id || '(unnamed)',
        kind,
        disabled,
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48),
      });
    }
    const seen = new Set();
    return out.filter((t) => {
      const k = `${t.kind}:${t.id}:${t.text}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });
}

const SKIP_IDS = new Set([
  'mail.compose.typeTo',
  'mail.compose.typeSubject',
  'mail.compose.typeBody',
  'mail.search.type',
  'mail.newMailbox.typeName',
  'mail.contacts.search', // input：点击只聚焦键盘，不算死按钮
]);

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const args = m.args?.() ?? [];
    // React key 警告里 %s 需要取 arg
    Promise.all(args.map((a) => a.jsonValue().catch(() => null)))
      .then((vals) => {
        const t = m.text();
        const extra = vals.filter((v) => v != null && String(v) !== t).map(String).join(' | ');
        consoleErrors.push(extra ? `${t} :: ${extra}` : t);
      })
      .catch(() => consoleErrors.push(m.text()));
  });
  page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));

  const back = async () => {
    await page.evaluate(() => window.__OS__.handleBack());
    await page.waitForTimeout(320);
  };
  const goHome = async () => {
    for (let i = 0; i < 8; i++) {
      if ((await page.locator('[data-trigger="home.edit.enter"]').count()) > 0) return;
      await back();
    }
    await page.evaluate((a) => window.__OS__.openApp(a), APP);
    await page.waitForTimeout(700);
  };

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.evaluate((a) => window.__OS__.openApp(a), APP);
  await page.waitForTimeout(1000);

  const scenes = [
    {
      name: 'home',
      setup: async () => {
        await goHome();
      },
    },
    {
      name: 'home-edit',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="home.edit.enter"]').first().click({ timeout: 4000 });
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'mailbox-list',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="mailbox.open"]').nth(1).click({ timeout: 4000 });
        await page.waitForTimeout(450);
      },
    },
    {
      name: 'mailbox-more-menu',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="mailbox.open"]').nth(1).click({ timeout: 4000 });
        await page.waitForTimeout(400);
        await page.locator('[data-trigger="list.moreMenu.open"]').first().click({ timeout: 4000 });
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'mailbox-select',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="mailbox.open"]').nth(1).click({ timeout: 4000 });
        await page.waitForTimeout(400);
        await page.locator('[data-trigger="list.select.enter"]').first().click({ timeout: 4000 });
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'message-detail',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="mailbox.open"]').nth(1).click({ timeout: 4000 });
        await page.waitForTimeout(400);
        const cat = page.locator('[data-trigger="list.category.switch"]');
        if ((await cat.count()) > 0) await cat.nth(4).click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(300);
        await page.locator('[data-mail-row]').first().click({ timeout: 4000 });
        await page.waitForTimeout(450);
      },
    },
    {
      name: 'address-menu',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="mailbox.open"]').nth(1).click({ timeout: 4000 });
        await page.waitForTimeout(400);
        const cat = page.locator('[data-trigger="list.category.switch"]');
        if ((await cat.count()) > 0) await cat.nth(4).click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(300);
        await page.locator('[data-mail-row]').first().click({ timeout: 4000 });
        await page.waitForTimeout(400);
        const expand = page.locator('[data-action="mail.detail.expandHeader"]');
        if ((await expand.count()) > 0) await expand.first().click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(280);
        const addr = page.locator('[data-trigger="detail.addr.open"]');
        if ((await addr.count()) > 0) await addr.first().click({ timeout: 3000 });
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'compose',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="compose.open"]').first().click({ timeout: 4000 });
        await page.waitForTimeout(450);
      },
    },
    {
      name: 'compose-contacts',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="compose.open"]').first().click({ timeout: 4000 });
        await page.waitForTimeout(350);
        await page.locator('[data-trigger="compose.contacts.open"]').first().click({ timeout: 4000 });
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'search',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="mailbox.open"]').nth(1).click({ timeout: 4000 });
        await page.waitForTimeout(400);
        await page.locator('[data-trigger="search.open"]').first().click({ timeout: 4000 });
        await page.waitForTimeout(450);
      },
    },
    {
      name: 'context-menu',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="mailbox.open"]').nth(1).click({ timeout: 4000 });
        await page.waitForTimeout(400);
        const el = page.locator('[data-trigger="list.context.open"][data-trigger-type="longPress"]').first();
        const box = await el.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 24));
        await page.mouse.down();
        await page.waitForTimeout(620);
        await page.mouse.up();
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'detail-attachment',
      setup: async () => {
        await goHome();
        await page.locator('[data-trigger="mailbox.open"]').nth(1).click({ timeout: 4000 });
        await page.waitForTimeout(400);
        const cat = page.locator('[data-trigger="list.category.switch"]');
        if ((await cat.count()) > 0) await cat.nth(4).click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(300);
        const subject = await page.evaluate(() => {
          const m = window.__SIM__.getState().apps.mail.mails.find(
            (x) => x.attachments?.length > 0 && x.folder !== 'trash',
          );
          return m?.subject?.slice(0, 24) || '';
        });
        await page.locator('[data-trigger="search.open"]').first().click({ timeout: 4000 });
        await page.waitForTimeout(350);
        if (subject) {
          await page.locator('[data-action="mail.search.type"]').first().fill(subject);
          await page.waitForTimeout(500);
          const hit = page.locator('[data-trigger="search.result.open"]').first();
          if ((await hit.count()) > 0) await hit.click({ timeout: 4000 });
          await page.waitForTimeout(450);
        }
      },
    },
  ];

  const dead = [];
  const okHits = [];
  const unavailableHits = [];

  for (const scene of scenes) {
    try {
      await scene.setup();
    } catch (e) {
      rec(`scene:${scene.name}:setup`, false, String(e).slice(0, 120));
      continue;
    }
    const targets = await collectTargets(page);
    rec(`scene:${scene.name}:targets`, targets.length > 0, `${targets.length} clickables`);

    const ordered = [
      ...targets.filter((t) => t.kind !== 'button' && !t.disabled),
      ...targets.filter((t) => t.kind === 'button' && !t.disabled),
    ]
      .filter((t) => !SKIP_IDS.has(t.id))
      .slice(0, 20);

    for (const t of ordered) {
      try {
        await scene.setup();
      } catch {
        continue;
      }
      const before = await appSig(page);
      const kbBefore = await page.evaluate(() => !!window.__OS__?.keyboard?.isVisible?.());
      // 用坐标点击，避免 page.evaluate(el.click) 偶发点不到 React 合成事件
      const box = await page.evaluate((target) => {
        const root = document.querySelector('[data-adjust-resize]') || document.body;
        const nodes = [...root.querySelectorAll('button, [role="button"], [data-trigger], [data-action]')];
        const match = nodes.find((el) => {
          const id =
            el.getAttribute('data-trigger') ||
            el.getAttribute('data-action') ||
            el.getAttribute('aria-label') ||
            (el.textContent || '').trim().slice(0, 40);
          if (id !== target.id) return false;
          const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48);
          if (target.text && text !== target.text) return false;
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) return false;
          const style = getComputedStyle(el);
          if (style.pointerEvents === 'none' || style.display === 'none') return false;
          return true;
        });
        if (!match) return null;
        const r = match.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 18) };
      }, t);
      if (!box) continue;
      await page.mouse.click(box.x, box.y);
      await page.waitForTimeout(600);
      const after = await appSig(page);
      const kbAfter = await page.evaluate(() => !!window.__OS__?.keyboard?.isVisible?.());
      const toast = after.toast || '';
      // 返回键先关键盘再退页，属 OS 正常优先级，算有效果
      const kbDismissed = t.id === 'system.back' && kbBefore && !kbAfter;
      const changed =
        before.text !== after.text ||
        before.triggers !== after.triggers ||
        before.stateSig !== after.stateSig ||
        Boolean(toast) ||
        kbDismissed;
      const isUnavailable = UNAVAILABLE_RE.test(toast);
      const label = `${scene.name} :: ${t.kind}:${t.id}`;
      if (!changed) {
        dead.push({ ...t, scene: scene.name, label });
        console.log(`DEAD  ${label}  text="${t.text}"`);
      } else if (isUnavailable) {
        unavailableHits.push(label);
        console.log(`OK(unavailable)  ${label}`);
      } else {
        okHits.push(label);
        console.log(`OK  ${label}${kbDismissed ? ' (dismiss keyboard)' : ''}`);
      }
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`OK effects: ${okHits.length}`);
  console.log(`OK unavailable toast: ${unavailableHits.length}`);
  console.log(`DEAD (no effect): ${dead.length}`);
  if (dead.length) {
    console.log('DEAD LIST:');
    for (const d of dead) console.log(`  - ${d.label} | "${d.text}"`);
  }
  // 等 console handler 的 Promise 刷完
  await page.waitForTimeout(300);
  const keyErrs = consoleErrors.filter((e) => /same key|unique/i.test(e));
  console.log(`console errors: ${consoleErrors.length} (duplicate-key: ${keyErrs.length})`);
  keyErrs.slice(0, 6).forEach((e) => console.log('  KEY: ' + e));
  consoleErrors
    .filter((e) => !/same key|unique|WMR|cdn\/themes/i.test(e))
    .slice(0, 6)
    .forEach((e) => console.log('  ERR: ' + e));

  rec('no dead buttons', dead.length === 0, dead.map((d) => d.label).slice(0, 15).join(' ; '));
  await browser.close();
  const fails = results.filter((r) => !r.ok);
  console.log(`\n=== probe assertions ${results.length - fails.length}/${results.length} ===`);
  process.exit(dead.length || fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
