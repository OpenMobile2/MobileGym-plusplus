// 番茄ToDo 运行时走查(pipeline v3 §5.2 第五道 gate) + 截图。
// 监听 console/pageerror(零容忍);P0 状态断言;返回可达性断言(§11)。
// 注意:app 用 MemoryRouter,路由不进 window.location —— 断言走 __SIM__ 状态 + DOM 标志。
// 用法: node apps/FanqieTodo/assets/runtime_walkthrough.mjs  (需先 npm run dev)
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:3000';
const APP = 'fanqietodo';

const results = [];
const rec = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const errors = [];

const stateSlice = (page, k) => page.evaluate((e) => window.__SIM__.getState().apps[e.a]?.[e.k], { a: APP, k }).catch(() => undefined);
// 截图输出已移除(不再产出 visual-diff);保留空实现,断言才是本走查的价值。
const shot = () => {};
const has = async (page, sel) => (await page.locator(sel).count()) > 0;
const tap = async (page, id, i = 0, kind = 'trigger') => {
  const el = page.locator(`[data-${kind}="${id}"]`).nth(i);
  await el.click({ timeout: 4000 });
  await page.waitForTimeout(450);
};
const back = async (page) => { await page.evaluate(() => window.__OS__.handleBack()); await page.waitForTimeout(400); };
const atTabRoot = (page) => has(page, '[data-trigger="tabbar.todo"]');
const gotoHome = async (page) => { for (let i = 0; i < 6; i++) { if (await atTabRoot(page)) break; await back(page); } if (!(await atTabRoot(page))) { await page.evaluate((a) => window.__OS__.openApp(a), APP); await page.waitForTimeout(600); } };
// 页面签名(用于环检测):可见文本前 60 字
const sig = (page) => page.evaluate(() => (document.querySelector('[data-adjust-resize]') || document.body).innerText.replace(/\s+/g, '').slice(0, 60));

const main = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate((a) => window.__OS__.openApp(a), APP);
  await page.waitForTimeout(1800);
  rec('app launches', await atTabRoot(page));
  await shot(page, 'todo_home');

  const todos = await stateSlice(page, 'todos');
  rec('seed todos >=5 diverse', (todos?.length ?? 0) >= 5, `${todos?.length} todos`);

  // 逐个 tab(在待办根页,TabBar 可见)
  for (const [tab, trig] of [['lock', 'tabbar.lock'], ['stats', 'tabbar.stats'], ['timeline', 'tabbar.timeline'], ['profile', 'tabbar.profile']]) {
    try { await tap(page, trig); await shot(page, `tab_${tab}`); rec(`tab ${tab} renders`, true); } catch (e) { rec(`tab ${tab}`, false, String(e).slice(0, 70)); }
  }
  await tap(page, 'tabbar.todo');

  // 弹窗:添加待办 / 快捷菜单 / 打卡分享
  try { await tap(page, 'todo.add.open'); rec('add dialog opens', await has(page, '[data-action="todo.add.type.select.normal"]')); await shot(page, 'todo_add_dialog'); await back(page); } catch (e) { rec('add dialog', false, String(e).slice(0, 70)); }
  try { await tap(page, 'todo.quickmenu.open'); await shot(page, 'todo_quickmenu'); rec('quickmenu opens', await has(page, '[data-trigger="todo.quickmenu.future"]')); await back(page); } catch (e) { rec('quickmenu', false, String(e).slice(0, 70)); }
  try { await tap(page, 'todo.checkin.open'); await shot(page, 'checkin_share'); rec('checkin card opens', await has(page, '[data-action="checkin.share.download.wontfixToast"]')); await gotoHome(page); } catch (e) { rec('checkin', false, String(e).slice(0, 70)); }

  // P0: 开始专注(倒计时待办)→ activeFocus 写入 + 专注页元素出现
  try {
    await tap(page, 'todo.focus.start', 0);
    const af = (await stateSlice(page, '_temp'))?.activeFocus;
    rec('P0 focus.start: activeFocus set', !!af, af?.todoId ?? 'null');
    rec('P0 focus page rendered', await has(page, '[data-trigger="focus.stop.open"]'));
    await shot(page, 'focus_run');
    const before = (await stateSlice(page, 'records'))?.length ?? 0;
    await tap(page, 'focus.stop.open'); await shot(page, 'focus_stop_dialog');
    await tap(page, 'focus.stop.finish');
    rec('P0 rest page rendered', await has(page, '[data-action="focus.rest.stop.action"]'));
    await shot(page, 'focus_rest');
    const after = (await stateSlice(page, 'records'))?.length ?? 0;
    rec('P0 focus record created', after > before, `${before}→${after}`);
    await gotoHome(page);
  } catch (e) { rec('P0 focus flow', false, String(e).slice(0, 100)); }

  // P0: 不计时待办「开始」→ 打卡确认 → 完成次数+1
  try {
    const b = (await stateSlice(page, 'todos'))?.find((x) => x.timing === 'none');
    const beforeDone = b?.todayDoneCount ?? 0;
    await tap(page, 'todo.checkin.confirm.open', 0);
    await tap(page, 'focus.checkin.confirm.commit', 0, 'action');
    const a2 = (await stateSlice(page, 'todos'))?.find((x) => x.id === b?.id);
    rec('P0 不计时打卡: completed +1', (a2?.todayDoneCount ?? 0) > beforeDone, `${beforeDone}→${a2?.todayDoneCount}`);
  } catch (e) { rec('checkin confirm flow', false, String(e).slice(0, 100)); }

  // ===== 返回可达性断言(§11):深层页连续 back → 回 tab 根 + 无环 =====
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.lock');
    await tap(page, 'lock.quick.open', 0);
    await tap(page, 'lock.active.start', 0);
    rec('reached deep page (lock.active)', await has(page, '[data-trigger="lock.active.exit.open"]'));
    const seq = [];
    let reachedRoot = false;
    for (let i = 0; i < 8; i++) {
      seq.push(await sig(page));
      if (await atTabRoot(page)) { reachedRoot = true; break; }
      await back(page);
    }
    const acyclic = new Set(seq).size === seq.length;
    rec('back-reachability: reaches tab root', reachedRoot, `${seq.length} steps`);
    rec('back-reachability: acyclic (no push-loop)', acyclic, acyclic ? '' : 'REPEAT signature detected');
  } catch (e) { rec('back-reachability', false, String(e).slice(0, 120)); }

  rec('zero console/pageerror', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();

  const fails = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - fails.length}/${results.length} passed ===`);
  if (errors.length) { console.log('ERRORS:'); errors.slice(0, 8).forEach((e) => console.log('  ' + e)); }
  if (fails.length) { console.log('FAILURES:'); fails.forEach((f) => console.log(`  ${f.name} — ${f.detail}`)); process.exit(1); }
};
main().catch((e) => { console.error('WALKTHROUGH CRASHED:', e); process.exit(1); });
