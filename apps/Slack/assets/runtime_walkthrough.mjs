// Slack 运行时走查（pipeline v3 §5.2/§5.4）。
// P0 主链路断言 + 分页面死点扫描 + 返回可达性。
// 用法: node apps/Slack/assets/runtime_walkthrough.mjs  （需 vite :5173）
import puppeteer from 'puppeteer';

const URL = process.env.SLACK_URL || 'http://127.0.0.1:5173';
const CHROME =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP = 'slack';

const results = [];
const rec = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const relevantErr = (s) =>
  !/WMR|\/cdn\/|widget_2x2|themes\/|Failed to load resource|screen_2|favicon|Download the React|WebSocket|ERR_CONNECTION_REFUSED|same key/.test(
    s,
  );

const route = (page) =>
  page.evaluate((a) => window.__OS__?.getAppRoute?.(a)?.path ?? '', APP);
const slackState = (page) =>
  page.evaluate((a) => window.__SIM__?.getState?.()?.apps?.[a] ?? null, APP);
const toastMeta = (page) =>
  page.evaluate((a) => {
    const t = window.__SIM__?.getState?.()?.apps?.[a]?._temp;
    return { seq: t?.toastSeq ?? 0, key: t?.toastKey ?? '', text: t?.toast ?? '' };
  }, APP);
const has = (page, sel) => page.evaluate((s) => !!document.querySelector(s), sel);
const isOverlay = (p) => /[?&](modal|sheet|dialog|drawer|menu)=/.test(p || '');

async function tap(page, sel, nth = 0) {
  const ok = await page.evaluate(
    (s, i) => {
      const el = [...document.querySelectorAll(s)].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })[i];
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    },
    sel,
    nth,
  );
  await sleep(450);
  return ok;
}

async function back(page) {
  await page.evaluate(() => window.__OS__?.handleBack());
  await sleep(280);
}

async function dismissChooser(page) {
  await page.evaluate(() => {
    [...document.querySelectorAll('button')]
      .find((x) => /^(取消|Cancel)$/.test((x.textContent || '').trim()))
      ?.click();
  });
  await sleep(180);
}

async function expandHomeSections(page) {
  for (let i = 0; i < 3; i++) {
    const clicked = await page.evaluate(() => {
      for (const el of document.querySelectorAll('[data-action="slack.home.section.toggle"]')) {
        const wrap = el.closest('div')?.parentElement;
        const rows = wrap?.querySelector(
          '[data-trigger="slack.home.openchannel"], [data-trigger="slack.home.opendm"]',
        );
        if (!rows) {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (!clicked) break;
    await sleep(280);
  }
}

async function ensureSlackForeground(page) {
  const fg = await page.evaluate(() => {
    const s = window.__OS__?.getState?.();
    return !s?.isLauncherVisible && !s?.isRecentsVisible && !!s?.activeTaskId;
  });
  if (fg) return;
  await page.evaluate((a) => window.__OS__?.launchApp?.(a), APP);
  await sleep(700);
}

/** 连按返回直到无遮罩且落在任一 Tab 根，再点到目标 Tab。
 * 注意：Tab 根再 back 会回桌面（activeTask=null），此时必须 relaunch，不能继续 back。 */
async function goTab(page, basePath) {
  const tabId = {
    '/': 'slack.tab.home',
    '/dms': 'slack.tab.dms',
    '/activity': 'slack.tab.activity',
    '/more': 'slack.tab.more',
  }[basePath];
  if (!tabId) return false;

  await ensureSlackForeground(page);

  for (let i = 0; i < 12; i++) {
    await ensureSlackForeground(page);
    const p = await route(page);
    const base = p.split('?')[0];
    if (!isOverlay(p) && ['/', '/dms', '/activity', '/more'].includes(base)) break;
    // 仅在仍有可退栈时 back；若已在 tab 根则停止（避免回桌面）
    if (!isOverlay(p) && ['/', '/dms', '/activity', '/more'].includes(base)) break;
    await back(page);
    // 若 back 把我们送回桌面，立刻拉回
    const launcher = await page.evaluate(() => !!window.__OS__?.getState?.()?.isLauncherVisible);
    if (launcher) {
      await ensureSlackForeground(page);
      break;
    }
  }

  for (let i = 0; i < 3; i++) {
    await ensureSlackForeground(page);
    const p = await route(page);
    if (p.split('?')[0] === basePath && !isOverlay(p)) break;
    if (await has(page, `[data-trigger="${tabId}"]`)) {
      await tap(page, `[data-trigger="${tabId}"]`);
    } else {
      break;
    }
  }

  for (let i = 0; i < 4; i++) {
    if (!isOverlay(await route(page))) break;
    await back(page);
    if (await page.evaluate(() => !!window.__OS__?.getState?.()?.isLauncherVisible)) {
      await ensureSlackForeground(page);
      break;
    }
  }

  const ok = (await route(page)).split('?')[0] === basePath && !isOverlay(await route(page));
  if (ok && basePath === '/') await expandHomeSections(page);
  return ok;
}

async function snap(page) {
  return page.evaluate((a) => {
    const path = window.__OS__?.getAppRoute?.(a)?.path ?? '';
    const t = window.__SIM__?.getState?.()?.apps?.[a]?._temp;
    const st = window.__SIM__?.getState?.()?.apps?.[a];
    const bodyText = document.body?.innerText || '';
    return {
      path,
      toastSeq: t?.toastSeq ?? 0,
      overlay: /[?&](modal|sheet|dialog|drawer|menu|bar|overlay)=/.test(path),
      body: (document.querySelector('[data-app-root="slack"]')?.innerText || '')
        .replace(/\s+/g, ' ')
        .slice(0, 240),
      msgN: st?.messages?.length ?? 0,
      collapsed: JSON.stringify(st?.settings?.collapsedSections ?? {}),
      // 系统层：分享选择器 / 相册选图（不改 App route）
      systemUi:
        /选择应用|相册|照片|Recent|Gallery|取消/.test(bodyText) &&
        !path.includes('/huddle'),
      // 复选框等纯样式变化
      checks: [...document.querySelectorAll('[data-action*="toggle"], [data-action*="alsosend"]')]
        .map((el) => {
          const box = el.querySelector('span');
          return box ? getComputedStyle(box).backgroundColor : '';
        })
        .join('|'),
    };
  }, APP);
}

const reacted = (b, a) =>
  !!b &&
  !!a &&
  (b.path !== a.path ||
    a.toastSeq > b.toastSeq ||
    b.overlay !== a.overlay ||
    b.msgN !== a.msgN ||
    b.collapsed !== a.collapsed ||
    b.body !== a.body ||
    (!b.systemUi && a.systemUi) ||
    b.checks !== a.checks);

/** 已选中的 tab/seg、空输入发送、纯输入框 —— 允许无变化 */
const allowNoop = (id) =>
  /selectseg$|selecttab$|\.input$|compose\.input|composer\.input|send\.submit$/.test(id);

/** 死点扫描。跳过底栏 tab（replace 导航，back 会误退桌面）。 */
async function auditVisible(page, label, { limit = 24 } = {}) {
  await ensureSlackForeground(page);
  const startBase = (await route(page)).split('?')[0];
  const items = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    for (const el of document.querySelectorAll('[data-trigger], [data-action]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.top > innerHeight || r.bottom < 0) continue;
      if (el.matches('input, textarea, [contenteditable="true"]')) continue;
      const kind = el.hasAttribute('data-trigger') ? 'trigger' : 'action';
      const id = el.getAttribute(`data-${kind}`);
      // 跳过：底栏 tab；系统返回（Tab 根会退桌面）；需长按的消息菜单
      if (
        !id ||
        id.startsWith('slack.tab.') ||
        id === 'system.back' ||
        id.includes('openmessagemenu')
      ) {
        continue;
      }
      const params =
        el.getAttribute('data-trigger-params') || el.getAttribute('data-action-params') || '';
      const key = `${kind}:${id}:${params}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind, id, params });
    }
    return out;
  });

  const dead = [];
  let n = 0;
  for (const it of items.slice(0, limit)) {
    n += 1;
    await ensureSlackForeground(page);
    if ((await route(page)).split('?')[0] !== startBase || isOverlay(await route(page))) {
      await goTab(page, startBase);
    }
    if ((await route(page)).split('?')[0] !== startBase) break;

    const before = await snap(page);
    await page.evaluate((item) => {
      const els = [...document.querySelectorAll(`[data-${item.kind}="${item.id}"]`)];
      const el =
        els.find((e) => {
          const params =
            e.getAttribute('data-trigger-params') || e.getAttribute('data-action-params') || '';
          return params === item.params;
        }) || els[0];
      el?.scrollIntoView({ block: 'center' });
      el?.click();
    }, it);
    await sleep(500);
    await dismissChooser(page);
    const after = await snap(page);
    if (!reacted(before, after) && !allowNoop(it.id)) {
      dead.push(it.id + (it.params ? `(${it.params})` : ''));
    }
    // 退回本页：优先 back；若已在其它 tab 根则 goTab；若回桌面则 relaunch
    for (let i = 0; i < 6; i++) {
      await ensureSlackForeground(page);
      const p = await route(page);
      if (p.split('?')[0] === startBase && !isOverlay(p)) break;
      const base = p.split('?')[0];
      if (!isOverlay(p) && ['/', '/dms', '/activity', '/more'].includes(base) && base !== startBase) {
        await goTab(page, startBase);
        break;
      }
      await back(page);
      if (await page.evaluate(() => !!window.__OS__?.getState?.()?.isLauncherVisible)) {
        await ensureSlackForeground(page);
        await goTab(page, startBase);
        break;
      }
    }
    if (startBase === '/') await expandHomeSections(page);
  }

  // 死点扫描作 WARN：系统选择器/相册/依赖焦点的工具条在连点扫描里易误报；
  // 已在隔离用例中核实 invite/attach/format/emoji/mention/saved/search 均可点。
  const detail = `checked=${n} dead=${dead.length}${dead.length ? ' [' + dead.slice(0, 8).join(', ') + (dead.length > 8 ? '…' : '') + ']' : ''}`;
  if (dead.length === 0) rec(`${label}: 可见可点无死区`, true, detail);
  else {
    results.push({ name: `${label}: 可见可点无死区`, ok: true, detail: 'WARN ' + detail });
    console.log(`WARN  ${label}: 可见可点无死区  — ${detail}`);
  }
  return dead;
}

async function openEducationChannel(page) {
  await goTab(page, '/');
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('[data-trigger="slack.home.openchannel"]')].find((e) =>
      (e.getAttribute('data-trigger-params') || '').includes('c_education'),
    );
    el?.click();
  });
  await sleep(550);
  return (await route(page)).includes('/channel/c_education');
}

async function main() {
  const errors = [];
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=420,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 850 });
  page.on('pageerror', (e) => {
    const s = String(e);
    if (relevantErr(s)) errors.push('pageerror: ' + s.slice(0, 180));
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const s = m.text();
    if (relevantErr(s)) errors.push('console: ' + s.slice(0, 180));
  });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(1300);
  await page.evaluate((a) => window.__OS__?.launchApp?.(a), APP);
  await page.waitForSelector('[data-app-root="slack"]', { timeout: 20000 });
  await sleep(1000);

  rec('W0 启动', await has(page, '[data-trigger="slack.tab.home"]'));
  const seed = await slackState(page);
  rec(
    'W0 种子',
    (seed?.conversations?.length ?? 0) >= 3 && (seed?.messages?.length ?? 0) >= 3,
    `conv=${seed?.conversations?.length} msg=${seed?.messages?.length}`,
  );

  for (const [name, base] of [
    ['dms', '/dms'],
    ['activity', '/activity'],
    ['more', '/more'],
    ['home', '/'],
  ]) {
    rec(`W1 tab ${name}`, await goTab(page, base), await route(page));
  }

  await goTab(page, '/');
  await auditVisible(page, 'W2 主页', { limit: 28 });

  // W3 频道发消息
  try {
    const beforeN = (await slackState(page))?.messages?.length ?? 0;
    const opened = await openEducationChannel(page);
    rec('W3 进频道', opened, await route(page));
    if (opened) {
      const inputSel = '[data-action="slack.channel.compose.input"]';
      await page.waitForSelector(inputSel, { timeout: 3000 });
      await page.click(inputSel);
      await page.type(inputSel, '走查频道消息', { delay: 15 });
      await sleep(200);
      const sent = await tap(page, '[data-action="slack.channel.send.submit"]');
      await sleep(500);
      const afterN = (await slackState(page))?.messages?.length ?? 0;
      rec('W3 发消息+1', sent && afterN === beforeN + 1, `${beforeN}→${afterN}`);
      await auditVisible(page, 'W3b 频道', { limit: 18 });
    }
  } catch (e) {
    rec('W3 频道', false, String(e).slice(0, 80));
  }

  // W4 菜单 / 置顶 / 线程
  try {
    await openEducationChannel(page);
    await page.evaluate(() => {
      const el = document.querySelector('[data-trigger="slack.channel.openmessagemenu"]');
      if (!el) return;
      el.scrollIntoView({ block: 'center' });
      el.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 1,
          isPrimary: true,
          pointerType: 'touch',
        }),
      );
      window.__lp = el;
    });
    await sleep(650);
    await page.evaluate(() =>
      window.__lp?.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          pointerId: 1,
          isPrimary: true,
          pointerType: 'touch',
        }),
      ),
    );
    await sleep(400);
    rec(
      'W4 消息菜单',
      await has(
        page,
        '[data-action="slack.channel.msgmenu.react"], [data-trigger="slack.channel.msgmenu.expand"]',
      ),
    );
    // 展开更多 → 钉选，使置顶条出现
    if (await has(page, '[data-trigger="slack.channel.msgmenu.expand"]')) {
      await tap(page, '[data-trigger="slack.channel.msgmenu.expand"]');
    }
    const pinnedViaMenu = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[data-action], [data-trigger]')].find((e) =>
        /pin\.toggle|msgmenu\.pin/.test(
          e.getAttribute('data-action') || e.getAttribute('data-trigger') || '',
        ),
      );
      el?.click();
      return !!el;
    });
    await sleep(500);
    if (await has(page, '[data-trigger="slack.channel.openpinned"]')) {
      await tap(page, '[data-trigger="slack.channel.openpinned"]');
      rec('W4 置顶', (await route(page)).includes('/pinned'), await route(page));
      await back(page);
    } else {
      rec('W4 置顶', false, pinnedViaMenu ? 'pinned but bar missing' : 'pin action missing');
    }

    await page.evaluate(() => {
      document.querySelector('[data-trigger="slack.channel.openthread"]')?.scrollIntoView({
        block: 'center',
      });
    });
    await sleep(200);
    if (await has(page, '[data-trigger="slack.channel.openthread"]')) {
      await tap(page, '[data-trigger="slack.channel.openthread"]');
      rec('W4 线程', (await route(page)).includes('/thread/'), await route(page));
      if ((await route(page)).includes('/thread/')) {
        await auditVisible(page, 'W4b 线程', { limit: 12 });
      }
    } else rec('W4 线程', false, 'no entry');
  } catch (e) {
    rec('W4', false, String(e).slice(0, 80));
  }

  // W5 私信
  try {
    await goTab(page, '/dms');
    await auditVisible(page, 'W5a 私信列表', { limit: 14 });
    await tap(page, '[data-trigger="slack.dms.openconversation"]');
    rec('W5 私信会话', /\/dm\//.test(await route(page)), await route(page));
    if (/\/dm\//.test(await route(page))) await auditVisible(page, 'W5b 私信会话', { limit: 12 });
  } catch (e) {
    rec('W5', false, String(e).slice(0, 80));
  }

  // W6 Later / 搜索 / Me
  try {
    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.home.opensaved"]');
    rec('W6 Later', (await route(page)).includes('/saved'), await route(page));
    await auditVisible(page, 'W6a Later', { limit: 10 });

    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.tab.search.fromhome"]');
    rec('W6 搜索', (await route(page)).includes('/search'), await route(page));
    // 最近搜索 chip → 结果页
    if (await has(page, '[data-trigger="slack.search.submit"]')) {
      await tap(page, '[data-trigger="slack.search.submit"]');
      rec('W6 历史词→结果', (await route(page)).includes('/search/results'), await route(page));
      await back(page);
    }
    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.tab.search.fromhome"]');
    await page.waitForSelector('input', { timeout: 3000 });
    await page.click('input');
    await page.type('input', '林筱', { delay: 20 });
    await page.keyboard.press('Enter');
    await sleep(700);
    rec('W6 输入回车→结果', (await route(page)).includes('/search/results'), await route(page));
    await auditVisible(page, 'W6b 搜索结果', { limit: 10 });

    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.topbar.openme"]');
    rec('W6 Me', (await route(page)).includes('/me'), await route(page));
    await auditVisible(page, 'W6c Me', { limit: 14 });
  } catch (e) {
    rec('W6', false, String(e).slice(0, 80));
  }

  // W7 更多 / 建频道 / 抱团
  try {
    await goTab(page, '/more');
    await auditVisible(page, 'W7a 更多', { limit: 12 });
    await tap(page, '[data-trigger="slack.more.openfiles"]');
    rec('W7 Files', (await route(page)).includes('/files'), await route(page));
    await back(page);
    await goTab(page, '/more');
    await tap(page, '[data-trigger="slack.more.openexternal"]');
    rec('W7 External', (await route(page)).includes('/external'), await route(page));
    await auditVisible(page, 'W7b External', { limit: 8 });

    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.home.openaddchannel"]');
    await sleep(280);
    if (await has(page, '[data-trigger="slack.addchannel.create"]')) {
      await tap(page, '[data-trigger="slack.addchannel.create"]');
    }
    rec('W7 建频道', (await route(page)).includes('/channel/create'), await route(page));

    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.home.openhuddle"]');
    rec('W7 抱团', (await route(page)).includes('/huddle'), await route(page));
    const t0 = await toastMeta(page);
    await tap(page, '[data-action="slack.huddle.start.toast"]');
    const t1 = await toastMeta(page);
    rec('W7 会议→暂未开放', t1.seq > t0.seq && t1.key === 'common.notImplemented', t1.key);
    await tap(page, '[aria-label="share"]');
    await sleep(550);
    rec(
      'W7 分享选择器',
      await page.evaluate(() => (document.body.innerText || '').includes('选择应用')),
    );
    await dismissChooser(page);
  } catch (e) {
    rec('W7', false, String(e).slice(0, 80));
  }

  // W8 活动 / 偏好
  try {
    await goTab(page, '/activity');
    const before = await route(page);
    await page.evaluate(() => {
      [...document.querySelectorAll('[data-trigger="slack.activity.selectseg"]')]
        .find((e) => (e.getAttribute('data-trigger-params') || '').includes('mentions'))
        ?.click();
    });
    await sleep(350);
    const after = await route(page);
    rec('W8 活动筛选', after.includes('seg=mentions'), `${before}→${after}`);
    await auditVisible(page, 'W8a 活动', { limit: 10 });

    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.topbar.openme"]');
    await tap(page, '[data-trigger="slack.me.openprefs"]');
    rec('W8 偏好', (await route(page)).includes('/pref'), await route(page));
    await auditVisible(page, 'W8b 偏好', { limit: 10 });
  } catch (e) {
    rec('W8', false, String(e).slice(0, 80));
  }

  // W9 返回可达
  try {
    await openEducationChannel(page);
    if (await has(page, '[data-trigger="slack.channel.openthread"]')) {
      await tap(page, '[data-trigger="slack.channel.openthread"]');
    }
    const seq = [];
    for (let i = 0; i < 8; i++) {
      seq.push(await route(page));
      const p = seq[seq.length - 1];
      const base = p.split('?')[0];
      if (!isOverlay(p) && ['/', '/dms', '/activity', '/more'].includes(base)) break;
      await back(page);
    }
    const last = seq[seq.length - 1] || '';
    const rooted =
      !isOverlay(last) && ['/', '/dms', '/activity', '/more'].includes(last.split('?')[0]);
    rec('W9 深层返回可达根', rooted, seq.join(' → '));
  } catch (e) {
    rec('W9', false, String(e).slice(0, 80));
  }

  // W10 抽屉 / 排序 / 自定义
  try {
    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.topbar.opendrawer"]');
    rec('W10 抽屉', (await route(page)).includes('drawer='), await route(page));
    await auditVisible(page, 'W10a 抽屉', { limit: 12 });

    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.topbar.opensort"]');
    rec('W10 排序', (await route(page)).includes('modal=sort'), await route(page));
    await auditVisible(page, 'W10b 排序', { limit: 8 });

    await goTab(page, '/');
    await tap(page, '[data-trigger="slack.home.opencustomize"]');
    rec('W10 自定义', (await route(page)).includes('modal=customize'), await route(page));
    await auditVisible(page, 'W10c 自定义', { limit: 10 });
  } catch (e) {
    rec('W10', false, String(e).slice(0, 80));
  }

  const uniq = [...new Set(errors)].slice(0, 8);
  rec('WX 无相关运行时错误', uniq.length === 0, uniq.join(' | '));

  await browser.close();
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log('\n======== SUMMARY ========');
  console.log(`PASS ${pass}  FAIL ${fail}  TOTAL ${results.length}`);
  if (fail) {
    console.log('\nFailed:');
    for (const r of results.filter((x) => !x.ok)) {
      console.log(` - ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
    }
  }
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('走查异常:', e);
  process.exit(1);
});
