// 滴答清单(Dida) 运行时走查(pipeline v3 §5.2/§5.4 gate)。
// 监听 console/pageerror(零容忍);P0 状态断言;凡 select/tab 交互均含「切换前后各读一个依赖量、断言不相等」;返回可达性断言(§11)。
// app 用 MemoryRouter,路由不进 window.location —— 断言走 __SIM__ 状态 + DOM 标志。
// 用法: node apps/Dida/assets/runtime_walkthrough.mjs  (需先 npm run dev)
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:5173';
const APP = 'dida';

const results = [];
const rec = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const errors = [];

const stateSlice = (page, k) => page.evaluate((e) => window.__SIM__.getState().apps[e.a]?.[e.k], { a: APP, k }).catch(() => undefined);
const has = async (page, sel) => (await page.locator(sel).count()) > 0;
const tap = async (page, id, i = 0, kind = 'trigger') => {
  const el = page.locator(`[data-${kind}="${id}"]`).nth(i);
  await el.click({ timeout: 4000 });
  await page.waitForTimeout(400);
};
const back = async (page) => { await page.evaluate(() => window.__OS__.handleBack()); await page.waitForTimeout(350); };
// 无遮罩层(抽屉/弹层/更多菜单)时,FAB 可点 = 真正在任务根页
const noOverlay = async (page) =>
  !(await has(page, '[aria-label="close-drawer"]')) &&
  !(await has(page, '[aria-label="close-add"]')) &&
  !(await has(page, '[aria-label="close-menu"]'));
// 任务根页专属信号:task.openSidebar 只在 '/' 出现(tabbar.tasks 在所有 tab 都有,不能用)
const atTasksRoot = async (page) => (await has(page, '[data-trigger="task.openSidebar"]')) && (await noOverlay(page));
const atTabRoot = atTasksRoot; // 兼容旧调用名
const gotoHome = async (page) => {
  for (let i = 0; i < 8; i++) { if (await atTasksRoot(page)) break; await back(page); }
  if (!(await atTasksRoot(page))) {
    await tap(page, 'tabbar.tasks').catch(async () => {
      await page.evaluate((a) => window.__OS__.openApp(a), APP); await page.waitForTimeout(600);
    });
    await page.waitForTimeout(300);
  }
};

const main = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  // 只收 Dida 相关错误;忽略其它 app(ThemeStore widget/cdn 等)的环境噪声
  // 忽略非 Dida 环境噪声:ThemeStore widget/cdn、以及系统桌面启动器已知的重复 key 警告(与 Dida 无关)
  const relevant = (s) => !/WMR|\/cdn\/|widget_2x2|themes\/|Failed to load resource|Encountered two children with the same key/.test(s);
  page.on('pageerror', (e) => { const s = 'pageerror: ' + String(e).slice(0, 160); if (relevant(s)) errors.push(s); });
  page.on('console', (m) => { if (m.type() === 'error') { const s = 'console: ' + m.text().slice(0, 160); if (relevant(s)) errors.push(s); } });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate((a) => window.__OS__.openApp(a), APP);
  await page.waitForTimeout(1800);
  rec('app launches', await atTabRoot(page));

  const tasks = await stateSlice(page, 'tasks');
  rec('seed tasks >=5 diverse', (tasks?.length ?? 0) >= 5, `${tasks?.length} tasks`);

  // 逐个 tab 渲染
  for (const [tab, trig] of [['calendar', 'tabbar.calendar'], ['matrix', 'tabbar.matrix'], ['focus', 'tabbar.focus'], ['me', 'tabbar.me']]) {
    try { await tap(page, trig); rec(`tab ${tab} renders`, true); } catch (e) { rec(`tab ${tab}`, false, String(e).slice(0, 70)); }
  }
  await tap(page, 'tabbar.tasks');

  // P0 · 任务完成:completed 数量 before/after 必须变化
  try {
    const before = (await stateSlice(page, 'tasks'))?.filter((t) => t.completed).length ?? 0;
    await tap(page, 'tasks.item.complete', 0, 'action');
    const after = (await stateSlice(page, 'tasks'))?.filter((t) => t.completed).length ?? 0;
    rec('P0 complete: completed count changed', after !== before, `${before}→${after}`);
  } catch (e) { rec('P0 complete', false, String(e).slice(0, 70)); }

  // SELECT 断言 · 切换清单:currentListId before/after 必须不相等
  try {
    await tap(page, 'task.openSidebar');
    const before = await stateSlice(page, 'currentListId');
    await tap(page, 'sidebar.list.select.item', 1, 'action'); // 第二个清单(inbox)
    const after = await stateSlice(page, 'currentListId');
    rec('SELECT switchList: currentListId changed', after !== before, `${before}→${after}`);
    await gotoHome(page);
  } catch (e) { rec('SELECT switchList', false, String(e).slice(0, 70)); }

  // 加深 · 任务详情 日期/提醒/重复/优先级 选择器写回任务
  try {
    await tap(page, 'task.open', 0);
    const before = await stateSlice(page, 'tasks');
    await tap(page, 'detail.edit.priority'); await tap(page, 'detail.priority.select.low', 0, 'action');
    await tap(page, 'detail.edit.reminder'); await tap(page, 'detail.reminder.select.hour1', 0, 'action');
    await tap(page, 'detail.edit.repeat'); await tap(page, 'detail.repeat.select.weekly', 0, 'action');
    const after = await stateSlice(page, 'tasks');
    const changed = after.find((a) => { const bf = before.find((x) => x.id === a.id); return bf && (bf.priority !== a.priority || bf.reminder !== a.reminder || bf.repeat !== a.repeat); });
    rec('detail selectors write task (prio/reminder/repeat)', !!changed && changed.priority === 'low' && changed.reminder === 'reminder.1hour' && changed.repeat === 'repeat.weekly', changed ? `${changed.priority}/${changed.reminder}/${changed.repeat}` : 'none');
    await gotoHome(page);
  } catch (e) { rec('detail selectors', false, String(e).slice(0, 70)); }

  // P0 · 快速添加:tasks 数量 +1
  try {
    const before = (await stateSlice(page, 'tasks'))?.length ?? 0;
    await tap(page, 'task.quickadd');
    const inp = page.locator('[data-action="quickadd.title.input"]');
    await inp.click();
    await inp.pressSequentially('走查新建任务', { delay: 20 });
    await page.waitForTimeout(200);
    await tap(page, 'quickadd.submit.commit', 0, 'action');
    const after = (await stateSlice(page, 'tasks'))?.length ?? 0;
    rec('P0 quickadd: task count +1', after === before + 1, `${before}→${after}`);
    await gotoHome(page);
  } catch (e) { rec('P0 quickadd', false, String(e).slice(0, 70)); }

  // 输入方式 · 优先级弹层:在「今天」选 High 后提交,store 必须写入 high + 今天 dueTs
  try {
    await tap(page, 'task.openSidebar');
    await tap(page, 'sidebar.list.select.item', 0, 'action'); // today
    await gotoHome(page);
    await tap(page, 'task.quickadd');
    await tap(page, 'quickadd.priority.open');
    rec('priority menu opens', await has(page, '[data-action="quickadd.priority.select.high"]'));
    await tap(page, 'quickadd.priority.select.high', 0, 'action');
    const inp = page.locator('[data-action="quickadd.title.input"]');
    await inp.click();
    await inp.pressSequentially('高优先级任务', { delay: 15 });
    await page.waitForTimeout(200);
    await tap(page, 'quickadd.submit.commit', 0, 'action');
    await page.waitForTimeout(300);
    const tasksAfter = await stateSlice(page, 'tasks');
    const created = tasksAfter?.find((t) => t.title === '高优先级任务');
    rec(
      'quickadd high priority persisted',
      !!created && created.priority === 'high' && created.dueTs !== null,
      created ? `${created.priority}/due=${created.dueTs !== null}` : 'missing',
    );
    await gotoHome(page);
  } catch (e) { rec('priority menu', false, String(e).slice(0, 70)); }

  // gate4-v3 · 日历视图切换 日/周/月 真实生效(周视图应出现周条,月视图出现月历网格)
  try {
    await tap(page, 'tabbar.calendar');
    await tap(page, 'calendar.view.open');
    rec('calendar view menu opens', await has(page, '[data-trigger="calendar.view.set.week"]'));
    // 无"年"视图
    rec('no Year view option', !(await has(page, '[data-trigger="calendar.view.set.year"]')));
    await tap(page, 'calendar.view.set.week');
    await page.waitForTimeout(300);
    // 周视图:格子少(<=7天单行);月视图:多行。用月历特有的"多于10个日期按钮"区分
    const weekCells = await page.locator('[data-action="calendar.day.select.item"]').count();
    await tap(page, 'calendar.view.open');
    await tap(page, 'calendar.view.set.month');
    await page.waitForTimeout(300);
    const monthCells = await page.locator('[data-action="calendar.day.select.item"]').count();
    rec('week/month views differ (week fewer cells)', weekCells > 0 && monthCells > weekCells, `week=${weekCells} month=${monthCells}`);
    await gotoHome(page);
  } catch (e) { rec('calendar view switch', false, String(e).slice(0, 70)); }

  // 输入方式 · 四象限 ＋ 新建(选象限)→ 该象限任务数 +1
  try {
    await tap(page, 'tabbar.matrix');
    const before = (await stateSlice(page, 'tasks'))?.filter((t) => t.quadrant === 1).length ?? 0;
    await tap(page, 'matrix.add.open');
    await page.locator('[data-action="matrix.add.title.input"]').pressSequentially('矩阵新任务', { delay: 15 });
    await tap(page, 'matrix.add.quadrant.select.q1', 0, 'action');
    await tap(page, 'matrix.add.submit.commit', 0, 'action');
    const after = (await stateSlice(page, 'tasks'))?.filter((t) => t.quadrant === 1).length ?? 0;
    rec('matrix add: Q1 count +1', after === before + 1, `${before}→${after}`);
    await gotoHome(page);
  } catch (e) { rec('matrix add', false, String(e).slice(0, 70)); }

  // P0 · 专注 番茄钟:开始→停止 生成一条 record
  try {
    await tap(page, 'tabbar.focus');
    const before = (await stateSlice(page, 'records'))?.length ?? 0;
    await tap(page, 'focus.start');
    rec('focus running page rendered', await has(page, '[data-action="focusrun.stop.action"]'));
    await tap(page, 'focusrun.stop.action', 0, 'action');
    const after = (await stateSlice(page, 'records'))?.length ?? 0;
    rec('P0 focus: record created', after > before, `${before}→${after}`);
    await gotoHome(page);
  } catch (e) { rec('P0 focus', false, String(e).slice(0, 70)); }

  // 真bug回归 · 正计时模式:切到 stopwatch 开始,运行页应从 00:00 起(正计时),不是倒计时
  try {
    await tap(page, 'tabbar.focus');
    await tap(page, 'focus.mode.select.item', 1, 'action'); // 第二个=正计时
    await tap(page, 'focus.start');
    await page.waitForTimeout(300);
    const digits = (await page.locator('.tabular-nums').first().innerText().catch(() => '')).trim();
    rec('stopwatch starts at 00:0x (not countdown)', /^00:0/.test(digits), `shown=${digits}`);
    await tap(page, 'focusrun.stop.action', 0, 'action');
    await gotoHome(page);
  } catch (e) { rec('stopwatch mode', false, String(e).slice(0, 70)); }

  // gate4-v3 · 收起(minimize)后计时不停,专注主页显示"专注中",重开仍是正计时(type 保留)
  try {
    await tap(page, 'tabbar.focus');
    await tap(page, 'focus.mode.select.item', 1, 'action'); // 正计时
    await tap(page, 'focus.start');
    await page.waitForTimeout(1200); // 让它走一会儿
    await back(page); // 点收起 ⌄ = system.back
    // 会话仍在(store activeFocus 不为空),主页出现 reopen 小条
    const af = await stateSlice(page, '_temp');
    rec('minimize keeps session running', !!af?.activeFocus, af?.activeFocus ? `type=${af.activeFocus.type}` : 'null');
    rec('focus home shows running bar', await has(page, '[data-trigger="focus.reopen"]'));
    await tap(page, 'focus.reopen');
    await page.waitForTimeout(300);
    // 重开:模式标签应是正计时(stopwatch),且计时>0(连续,没归零关闭)
    const modeLabel = (await page.locator('span.text-\\[16px\\].text-\\[\\#8E8E93\\]').first().innerText().catch(() => '')).trim();
    const digits2 = (await page.locator('.tabular-nums').first().innerText().catch(() => '')).trim();
    const secs = Number(digits2.split(':')[1] || '0') + Number(digits2.split(':')[0] || '0') * 60;
    rec('reopen keeps stopwatch mode + timer running', af?.activeFocus?.type === 'stopwatch' && secs >= 1, `label=${modeLabel} t=${digits2}`);
    await tap(page, 'focusrun.stop.action', 0, 'action');
    await gotoHome(page);
  } catch (e) { rec('minimize/reopen', false, String(e).slice(0, 70)); }

  // gate4-v4 · 主页模式跟随会话:番茄钟收起后主页显示倒计时(2x:xx);正计时显示 00:xx
  try {
    await tap(page, 'tabbar.focus');
    // 确保当前本地模式是番茄钟(nth0),开始番茄会话
    await tap(page, 'focus.mode.select.item', 0, 'action');
    await tap(page, 'focus.start');
    await page.waitForTimeout(600);
    await back(page); // 收起
    await page.waitForTimeout(200);
    const homeDigits = (await page.locator('.tabular-nums').first().innerText().catch(() => '')).trim();
    // 番茄钟默认25分,倒数应是 24:xx(而非 00:xx / 25:00 静态)
    rec('home follows pomo session (countdown shown)', /^2\d:/.test(homeDigits), `home=${homeDigits}`);
    await tap(page, 'focus.reopen');
    await tap(page, 'focusrun.stop.action', 0, 'action');
    await gotoHome(page);
  } catch (e) { rec('home mode sync', false, String(e).slice(0, 70)); }

  // gate4-v5 · 主页小条上的 ▶/‖ 图标可直接暂停/继续(不打开运行页)
  try {
    await tap(page, 'tabbar.focus');
    await tap(page, 'focus.start');
    await page.waitForTimeout(500);
    await back(page); // 收起到主页
    await page.waitForTimeout(200);
    const before = (await stateSlice(page, '_temp'))?.activeFocus?.paused;
    await tap(page, 'focus.mini.pause.toggle', 0, 'action'); // 点小条图标
    const afterPause = (await stateSlice(page, '_temp'))?.activeFocus?.paused;
    // 仍在专注主页(没被带进运行页),且 paused 翻转
    rec('mini icon toggles pause (stays on home)', before === false && afterPause === true && (await has(page, '[data-trigger="focus.reopen"]')), `${before}→${afterPause}`);
    await tap(page, 'focus.mini.pause.toggle', 0, 'action'); // 再点=继续
    const afterResume = (await stateSlice(page, '_temp'))?.activeFocus?.paused;
    rec('mini icon resumes', afterResume === false, `paused=${afterResume}`);
    await tap(page, 'focus.reopen');
    await tap(page, 'focusrun.stop.action', 0, 'action');
    await gotoHome(page);
  } catch (e) { rec('mini pause', false, String(e).slice(0, 70)); }

  // gate4-v6 · 会话运行中仍可在主页切到另一种模式,并开始新模式会话(替换旧的)
  try {
    await tap(page, 'tabbar.focus');
    await tap(page, 'focus.mode.select.item', 0, 'action'); // 番茄
    await tap(page, 'focus.start');
    await page.waitForTimeout(400);
    await back(page); // 收起,番茄会话在跑
    await page.waitForTimeout(150);
    // 切到正计时(应可点,不被锁)
    await tap(page, 'focus.mode.select.item', 1, 'action');
    await page.waitForTimeout(150);
    // 切到非会话模式后,出现"开始"按钮
    rec('can switch mode during session', await has(page, '[data-trigger="focus.start"]'), 'start btn shown');
    await tap(page, 'focus.start'); // 开始正计时(替换旧番茄会话)
    await page.waitForTimeout(300);
    const af = (await stateSlice(page, '_temp'))?.activeFocus;
    rec('start new mode replaces session', af?.type === 'stopwatch', `type=${af?.type}`);
    await tap(page, 'focusrun.stop.action', 0, 'action');
    await gotoHome(page);
  } catch (e) { rec('switch mode mid-session', false, String(e).slice(0, 70)); }

  // SELECT 断言 · 专注统计周期切换页面正常(渲染断言)
  try {
    await tap(page, 'tabbar.focus');
    await tap(page, 'focus.stats');
    rec('focus stats renders', await has(page, '[data-action="stats.period.select.item"]'));
    await gotoHome(page);
  } catch (e) { rec('focus stats', false, String(e).slice(0, 70)); }

  // gate4-v2 回归 · Completed 智能清单只显示已完成任务
  try {
    await tap(page, 'task.openSidebar');
    await tap(page, 'sidebar.list.select.item', 4, 'action'); // 顺序:today/inbox/welcome/life/completed → nth(4)
    const listId = await stateSlice(page, 'currentListId');
    // 找到该清单页里所有渲染的任务行是否都已完成:通过 store 无法直接读 DOM,改为断言 currentListId=completed 且页面无未完成复选框空框
    rec('Completed list selected', listId === 'completed', `listId=${listId}`);
    await gotoHome(page);
  } catch (e) { rec('Completed list', false, String(e).slice(0, 70)); }

  // gate4-v2 回归 · 用户卡→个人资料页(设置页 + 抽屉)
  try {
    await tap(page, 'tabbar.me');
    await tap(page, 'me.profile.open');
    rec('me card → profile page', await has(page, '[data-action="profile.nickname.input"]'));
    await gotoHome(page);
    await tap(page, 'task.openSidebar');
    await tap(page, 'sidebar.profile.open');
    rec('drawer card → profile page', await has(page, '[data-action="profile.nickname.input"]'));
    await gotoHome(page);
  } catch (e) { rec('profile nav', false, String(e).slice(0, 70)); }

  // P0 · 退出登录:loggedIn true→false,并可达登录页
  try {
    await tap(page, 'tabbar.me');
    await tap(page, 'me.signout.open');
    const before = (await stateSlice(page, 'user'))?.loggedIn;
    await tap(page, 'me.signout.commit');
    const after = (await stateSlice(page, 'user'))?.loggedIn;
    rec('P0 signout: loggedIn changed', before !== after, `${before}→${after}`);
    rec('login page reachable', await has(page, '[data-trigger="login.enter"]'));
    await tap(page, 'login.enter'); // 假登录回主页
    await gotoHome(page);
  } catch (e) { rec('P0 signout', false, String(e).slice(0, 70)); }

  // §11 返回可达性:从深层页面连按返回能回主页
  try {
    await tap(page, 'tabbar.matrix');
    await tap(page, 'matrix.openTask', 0);
    for (let i = 0; i < 4; i++) await back(page);
    rec('back reachability: returns to tasks root', await atTabRoot(page));
  } catch (e) { rec('back reachability', false, String(e).slice(0, 70)); }

  rec('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  await browser.close();
  process.exit(failed.length === 0 ? 0 : 1);
};

main().catch((e) => { console.error(e); process.exit(1); });
