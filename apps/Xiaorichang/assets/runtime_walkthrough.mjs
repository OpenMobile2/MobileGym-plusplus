// 小日常 运行时走查(pipeline v3 §5.2 第五道 gate)。
// 监听 console/pageerror(零容忍);P0 状态断言(坑四:绑定了但不生效);
// 返回可达性断言(§11:深页连续 back → 回 tab 根,签名序列无环)。
// 用法: node apps/Xiaorichang/assets/runtime_walkthrough.mjs  (需先 npm run dev)
import puppeteer from 'puppeteer';

const URL = process.env.XIAORICHANG_WALKTHROUGH_URL ?? 'http://127.0.0.1:3000';
const APP = 'xiaorichang';

const results = [];
const rec = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stateSlice = (page, k) => page.evaluate((a, key) => window.__SIM__.getState().apps[a]?.[key], APP, k).catch(() => undefined);
const count = async (page, sel) => (await page.$$(sel)).length;
const has = async (page, sel) => (await count(page, sel)) > 0;
// 用坐标点击(而非 el.click() 的 DOM 派发),这样被悬浮 TabBar 遮住的控件会**点不中**,
// 从而暴露真实的遮挡问题 —— 先滚进视野,再点。
const tap = async (page, id, i = 0, kind = 'trigger') => {
  const els = await page.$$(`[data-${kind}="${id}"]`);
  if (!els[i]) throw new Error(`no element [data-${kind}="${id}"] #${i}`);
  await els[i].evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await sleep(150);
  await els[i].click();
  await sleep(500);
};
const back = async (page) => { await page.evaluate(() => window.__OS__.handleBack()); await sleep(400); };
// ⚠ tabbar.today 这个按钮在**五个 tab 根上都存在**,所以它只能判断「在某个 tab 根」,
// 不能判断「在今日页」。判断今日页要看今日页独有的元素。
const atTabRoot = (page) => has(page, '[data-trigger="tabbar.today"]');
const atTodayPage = (page) => has(page, '[data-trigger="today.quick.todo"]');
const gotoHome = async (page) => {
  for (let i = 0; i < 8; i++) { if (await atTabRoot(page)) break; await back(page); }
  if (!(await atTabRoot(page))) { await page.evaluate((a) => window.__OS__.openApp(a), APP); await sleep(700); }
  if (!(await atTodayPage(page))) { await tap(page, 'tabbar.today'); }
};
const sig = (page) => page.evaluate(() => (document.querySelector('[data-adjust-resize]') || document.body).innerText.replace(/\s+/g, '').slice(0, 60));
const chooseIntentApp = async (page, label) => {
  const chosen = await page.evaluate((text) => {
    const chooserTitle = [...document.querySelectorAll('div')]
      .find((el) => el.textContent?.trim() === '选择应用');
    if (!chooserTitle) return false;
    const button = [...document.querySelectorAll('button')]
      .find((el) => el.textContent?.trim() === text);
    button?.click();
    return !!button;
  }, label);
  await sleep(700);
  return chosen;
};
const selectFirstSystemImage = async (page) => {
  const opened = await has(page, '.fixed.inset-0.z-\\[9999\\]');
  const tile = await page.$('.fixed.inset-0.z-\\[9999\\] .grid.grid-cols-4 > div');
  if (!tile) throw new Error('system album has no selectable image');
  await tile.click();
  await sleep(300);
  await page.evaluate(() => {
    const picker = document.querySelector('.fixed.inset-0.z-\\[9999\\]');
    const done = [...(picker?.querySelectorAll('button') ?? [])]
      .find((button) => button.textContent?.trim().startsWith('完成'));
    done?.click();
  });
  await sleep(600);
  return opened;
};

const main = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await page.evaluate((a) => window.__OS__.openApp(a), APP);
  await sleep(1800);
  rec('app launches', await atTabRoot(page));

  // §10.3 种子数据
  const habits = await stateSlice(page, 'habits');
  rec('seed habits >=5 diverse', (habits?.length ?? 0) >= 5, `${habits?.length} habits`);

  // 逐个 tab
  for (const [tab, trig] of [['habits', 'tabbar.habits'], ['focus', 'tabbar.focus'], ['stats', 'tabbar.stats'], ['profile', 'tabbar.profile']]) {
    try { await tap(page, trig); rec(`tab ${tab} renders`, true); } catch (e) { rec(`tab ${tab}`, false, String(e).slice(0, 70)); }
  }
  await tap(page, 'tabbar.today');

  // P0 坑四检查:一键打卡 → logs+1 且 glow.cumulative += reward(数据必须真变)
  try {
    const g0 = (await stateSlice(page, 'glow'))?.cumulative ?? 0;
    const l0 = ((await stateSlice(page, 'logs')) ?? []).length;
    await tap(page, 'today.habit.oneTapDone', 0, 'action');
    const g1 = (await stateSlice(page, 'glow'))?.cumulative ?? 0;
    const l1 = ((await stateSlice(page, 'logs')) ?? []).length;
    rec('P0 oneTapDone: log appended', l1 === l0 + 1, `${l0}→${l1}`);
    rec('P0 oneTapDone: glow += reward', g1 > g0, `${g0}→${g1}`);
  } catch (e) { rec('P0 oneTapDone', false, String(e).slice(0, 100)); }

  // P0:已打卡习惯 → 打卡弹层;标记失败 → glow 扣分(R1 计分模型)
  // ⚠ 必须先关掉「隐藏已完成」:默认开启时,刚完成的图标 1.2s 后就消失,
  //    直接去点会拿到 detached node(这是 R4 那条 grace 逻辑的副作用,不是 bug)。
  try {
    await tap(page, 'today.hideDone.toggle', 0, 'action');
    await tap(page, 'today.checkin.open', 0);
    rec('checkin sheet opens', await has(page, '[data-action="checkin.state.select.fail"]'));
    const g0 = (await stateSlice(page, 'glow'))?.cumulative ?? 0;
    await tap(page, 'checkin.state.select.fail', 0, 'action');
    await tap(page, 'checkin.sheet.commit', 0, 'action');
    const g1 = (await stateSlice(page, 'glow'))?.cumulative ?? 0;
    rec('P0 fail = -reward (R1)', g1 < g0, `${g0}→${g1}`);
    await gotoHome(page);
    await tap(page, 'today.hideDone.toggle', 0, 'action'); // 复原成默认的「隐藏已完成」
  } catch (e) { rec('P0 checkin fail flow', false, String(e).slice(0, 100)); }

  // P0:习惯详情日历点空格 = 就地补打卡(s231→s233,无弹层)
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.habits');
    await tap(page, 'habits.detail.open', 0);
    rec('habit detail renders', await has(page, '[data-action="habit.detail.calendar.checkinOn"]'));
    const l0 = ((await stateSlice(page, 'logs')) ?? []).length;
    // 点一个未打卡的格子:直接选第 2 个格(1 号大概率无记录;若已有记录则该动作幂等不加)
    const cells = await page.$$('[data-action="habit.detail.calendar.checkinOn"]');
    let bumped = false;
    for (let i = 0; i < Math.min(cells.length, 5); i++) {
      await cells[i].click();
      await sleep(350);
      const ln = ((await stateSlice(page, 'logs')) ?? []).length;
      if (ln === l0 + 1) { bumped = true; break; }
    }
    rec('P0 calendar cell = in-place checkin (s231)', bumped);
    rec('no sheet popped by calendar cell', !(await has(page, '[data-action="checkin.sheet.commit"]')));
  } catch (e) { rec('P0 calendar checkin', false, String(e).slice(0, 100)); }

  // P0:专注 start → activeFocus 写入;立即 stop(<1min)→ 作废,不写记录(R3)
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.focus');
    const r0 = ((await stateSlice(page, 'records')) ?? []).length;
    await tap(page, 'focus.timer.start', 0, 'action');
    const af = (await stateSlice(page, '_temp'))?.activeFocus;
    rec('P0 focus.start: activeFocus set', !!af);
    await tap(page, 'focus.timer.stop.discard', 0, 'action');
    const r1 = ((await stateSlice(page, 'records')) ?? []).length;
    rec('P0 focus <1min discarded (R3)', r1 === r0, `${r0}→${r1}`);
  } catch (e) { rec('P0 focus flow', false, String(e).slice(0, 100)); }

  // ===== Gate4 反馈的回归断言(每条标注 → 一条自动检查)=====

  // G4-2:小事快捷输入曾经进去就出不来(遮罩没绑返回、也没有取消键)
  // 注意:输入框 autoFocus 会唤起键盘,而 OS 的 BackDispatcher 里键盘优先级(700)高于 App(100),
  // 所以第一次 back 是关键盘 —— 这是正确的 Android 行为,断言需要允许多按几次。
  try {
    await gotoHome(page);
    await tap(page, 'today.quick.todo');
    const opened = await has(page, '[data-action="todo.quick.commit"]');
    let escaped = false;
    for (let i = 0; i < 3; i++) { await back(page); if (await atTodayPage(page)) { escaped = true; break; } }
    rec('G4-2 todo.quickAdd escapable by back', opened && escaped);
  } catch (e) { rec('G4-2 todo.quickAdd escapable by back', false, String(e).slice(0, 90)); }

  // G4-2b:同一个弹层必须还有一个可见的「取消」出口(不能只靠系统返回键)
  try {
    await gotoHome(page);
    await tap(page, 'today.quick.todo');
    const cancels = await count(page, '[data-trigger-type="back"]');
    rec('G4-2b todo.quickAdd has visible cancel affordance', cancels >= 2, `${cancels} back affordances`);
    await gotoHome(page);
  } catch (e) { rec('G4-2b cancel affordance', false, String(e).slice(0, 90)); }

  // G4-8:统计周视图格子应跳到习惯详情,不是弹 toast
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.stats');
    await tap(page, 'stats.week.cell.open', 0);
    rec('G4-8 stats cell → habit detail', await has(page, '[data-action="habit.detail.calendar.checkinOn"]'));
  } catch (e) { rec('G4-8 stats cell → habit detail', false, String(e).slice(0, 90)); }

  // G4-6:习惯提醒『新增提醒』应打开添加提醒弹层,并能真的写入一条
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.habits');
    await tap(page, 'habits.rowmenu.open', 0);
    await tap(page, 'habits.rowmenu.reminder');
    const before = ((await stateSlice(page, 'habits')) ?? []).flatMap((h) => h.reminders ?? []).length;
    await tap(page, 'habit.reminder.add.open');
    rec('G4-6 reminder sheet opens', await has(page, '[data-action="reminder.add.commit"]'));
    await tap(page, 'reminder.add.commit', 0, 'action');
    const after = ((await stateSlice(page, 'habits')) ?? []).flatMap((h) => h.reminders ?? []).length;
    rec('G4-6 reminder actually written', after === before + 1, `${before}→${after}`);
  } catch (e) { rec('G4-6 reminder flow', false, String(e).slice(0, 90)); }

  // G4-12/13/14:实验室三页从 wontfix 翻案成真页面
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.lab');
    await tap(page, 'lab.chime.open');
    const c0 = ((await stateSlice(page, 'settings')) ?? {}).chimeHours?.length ?? 0;
    await tap(page, 'lab.chime.hour.toggle', 8, 'action');
    const c1 = ((await stateSlice(page, 'settings')) ?? {}).chimeHours?.length ?? 0;
    rec('G4-14 chime hour toggles (real page)', c1 === c0 + 1, `${c0}→${c1}`);
    await back(page);
    await tap(page, 'lab.shortcuts.open');
    rec('G4-12 shortcuts is a real page', await has(page, '[data-trigger="lab.shortcuts.todo"]'));
    await back(page);
    await tap(page, 'lab.cards.open');
    rec('G4-13 card pack is a real page', await has(page, '[data-action="lab.cards.viewAll"]'));
  } catch (e) { rec('G4 lab pages', false, String(e).slice(0, 90)); }

  // 回归:新建习惯跨图标/提醒页后草稿不能丢,情境与 N 天规则必须按选择落库。
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.habits');
    await tap(page, 'habits.create');
    await page.type('[data-action="habit.create.name.input"]', '跨页习惯测试');
    await tap(page, 'habit.create.context.select.wakeup', 0, 'action');
    await tap(page, 'habit.create.recurrence.select.weeklyCount', 0, 'action');
    await tap(page, 'habit.create.recurrence.count.step', 1, 'action'); // 3 → 4
    await tap(page, 'habit.create.iconpicker.open');
    await tap(page, 'habit.icon.pick', 1, 'action');
    await tap(page, 'habit.icon.commit', 0, 'action');
    const restoredName = await page.$eval('[data-action="habit.create.name.input"]', (el) => el.value);
    rec('G6 habit draft survives icon roundtrip', restoredName === '跨页习惯测试', restoredName);
    await tap(page, 'habit.create.reminder.open');
    await tap(page, 'habit.reminder.add.open');
    await tap(page, 'reminder.add.commit', 0, 'action');
    const draftReminderShown = (await count(page, '[data-action="habit.reminder.remove"]')) === 1;
    rec('G6 new habit reminder writes draft', draftReminderShown);
    await back(page);
    await tap(page, 'habit.create.commit', 0, 'action');
    const created = ((await stateSlice(page, 'habits')) ?? []).find((h) => h.name === '跨页习惯测试');
    const contexts = (await stateSlice(page, 'contexts')) ?? [];
    const contextName = contexts.find((c) => c.id === created?.contextId)?.name;
    rec('G6 habit context saved exactly', contextName === '起床', contextName ?? 'missing');
    rec('G6 weekly-count saved distinctly', created?.recurrence?.kind === 'weeklyCount' && created.recurrence.count === 4,
      JSON.stringify(created?.recurrence));
    rec('G6 reminder persists with created habit', created?.reminders?.length === 1, `${created?.reminders?.length ?? 0}`);
  } catch (e) { rec('G6 habit create roundtrip', false, String(e).slice(0, 110)); }

  // 回归:习惯组必须保留名称/时段并真正多选成员。
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.habits');
    await tap(page, 'habits.filter.select.groups', 0, 'action');
    await tap(page, 'habits.group.create');
    await page.type('[data-action="habits.group.name.input"]', '两项晨练');
    await tap(page, 'habits.group.context.select.wakeup', 0, 'action');
    await tap(page, 'habits.group.pickHabits');
    await tap(page, 'habits.group.pick.toggle', 0, 'action');
    await tap(page, 'habits.group.pick.toggle', 1, 'action');
    await tap(page, 'habits.group.pick.commit', 0, 'action');
    const groupName = await page.$eval('[data-action="habits.group.name.input"]', (el) => el.value);
    rec('G6 group draft survives picker roundtrip', groupName === '两项晨练', groupName);
    await tap(page, 'habits.group.commit', 0, 'action');
    const groups = (await stateSlice(page, 'groups')) ?? [];
    const group = groups.find((g) => g.name === '两项晨练');
    const contexts = (await stateSlice(page, 'contexts')) ?? [];
    rec('G6 group stores selected members', group?.habitIds?.length === 2, `${group?.habitIds?.length ?? 0}`);
    rec('G6 group stores context', contexts.find((c) => c.id === group?.contextId)?.name === '起床');
  } catch (e) { rec('G6 group create flow', false, String(e).slice(0, 110)); }

  // 回归:删除非空情境后习惯必须迁移,不能从今日页永久消失。
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.habits');
    await tap(page, 'habits.create');
    await tap(page, 'habit.create.context.manage');
    const contextsBefore = (await stateSlice(page, 'contexts')) ?? [];
    const wakeupIndex = contextsBefore.findIndex((c) => c.name === '起床');
    await tap(page, 'context.select.mode', 0, 'action');
    await tap(page, 'context.row.check', wakeupIndex, 'action');
    await tap(page, 'context.select.delete', 0, 'action');
    await page.evaluate(() => {
      const confirm = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '确定');
      confirm?.click();
    });
    await sleep(450);
    const state = await page.evaluate(() => window.__SIM__.getState().apps.xiaorichang);
    const contextIds = new Set(state.contexts.map((c) => c.id));
    rec('G6 deleting context leaves no orphan habits', state.habits.every((h) => contextIds.has(h.contextId)));
    rec('G6 migrated habit remains stored', state.habits.some((h) => h.name === '跨页习惯测试'));
  } catch (e) { rec('G6 context deletion migration', false, String(e).slice(0, 110)); }

  // G4-1 + 卡包联动:今日卡片『存进卡包』从 wontfix 改真动作 → cards +1
  try {
    await gotoHome(page);
    await tap(page, 'today.quick.card');
    const n0 = ((await stateSlice(page, 'cards')) ?? []).length;
    await tap(page, 'today.card.save', 0, 'action');
    const n1 = ((await stateSlice(page, 'cards')) ?? []).length;
    rec('G4-1 saveCard writes to card pack', n1 === n0 + 1, `${n0}→${n1}`);
  } catch (e) { rec('G4-1 saveCard', false, String(e).slice(0, 90)); }

  // 必修回归 1:编辑打卡后回到今日页,滚动容器要定位到刚编辑的条目,不能跳回顶部。
  try {
    await gotoHome(page);
    await tap(page, 'today.hideDone.toggle', 0, 'action'); // 显示全部,保证可选择靠后的条目
    const target = await page.$$(
      '[data-trigger="today.checkin.open"], [data-trigger="today.checkin.open.noOneTap"]',
    );
    if (!target.length) throw new Error('no editable checkin tile');
    const tile = target[target.length - 1];
    const habitId = await tile.evaluate((el) => JSON.parse(el.getAttribute('data-trigger-params') ?? '{}').habitId);
    await tile.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await sleep(150);
    await tile.click();
    await sleep(500);
    await tap(page, 'checkin.habit.edit');
    await tap(page, 'habit.create.commit', 0, 'action');
    const placement = await page.evaluate((id) => {
      const scroller = document.querySelector('[data-scroll-container="main"]');
      const edited = [...(scroller?.querySelectorAll('[data-habit-id]') ?? [])]
        .find((el) => el.getAttribute('data-habit-id') === id);
      if (!scroller || !edited) return null;
      const sr = scroller.getBoundingClientRect();
      const er = edited.getBoundingClientRect();
      return {
        scrollTop: scroller.scrollTop,
        visible: er.top >= sr.top && er.bottom <= sr.bottom,
      };
    }, habitId);
    rec('required edit keeps today scroll context', !!placement?.visible && placement.scrollTop > 0,
      JSON.stringify(placement));
    await back(page); // 关闭打卡弹层
    await tap(page, 'today.hideDone.toggle', 0, 'action'); // 恢复默认
  } catch (e) { rec('required edit keeps today scroll context', false, String(e).slice(0, 110)); }

  // 必修回归 2:笔记/小事的 ⋯ 菜单不能与 TabBar 同时出现,且底部菜单项可以坐标点击。
  try {
    await gotoHome(page);
    await tap(page, 'today.note.cardmenu.open', 0);
    const noteMenuVisible = await page.evaluate(() => {
      const item = document.querySelector('[data-action="note.cardmenu.copy"]');
      const frame = document.querySelector('[data-adjust-resize]') ?? document.body;
      if (!item) return false;
      const ir = item.getBoundingClientRect();
      const fr = frame.getBoundingClientRect();
      return ir.top >= fr.top && ir.bottom <= fr.bottom;
    });
    const noteTabHidden = !(await has(page, '[data-trigger="tabbar.today"]'));
    await tap(page, 'note.cardmenu.copy', 0, 'action');
    rec('required note menu is visible and clickable', noteMenuVisible && noteTabHidden && await atTodayPage(page));
    const copiedNote = await page.evaluate(() => window.__OS__.clipboard.getText());
    const noteBodies = ((await stateSlice(page, 'notes')) ?? []).map((note) => note.body);
    rec('system clipboard receives note content', noteBodies.includes(copiedNote));

    await tap(page, 'today.todo.item.menu.open', 0);
    const todoMenuVisible = await page.evaluate(() => {
      const item = document.querySelector('[data-action="todo.itemmenu.edit"]');
      const frame = document.querySelector('[data-adjust-resize]') ?? document.body;
      if (!item) return false;
      const ir = item.getBoundingClientRect();
      const fr = frame.getBoundingClientRect();
      return ir.top >= fr.top && ir.bottom <= fr.bottom;
    });
    const todoTabHidden = !(await has(page, '[data-trigger="tabbar.today"]'));
    await tap(page, 'todo.itemmenu.edit', 0, 'action');
    const todoEditOpened = await has(page, 'input');
    rec('required todo menu is visible and clickable', todoMenuVisible && todoTabHidden && todoEditOpened);
    await page.evaluate(() => {
      const cancel = [...document.querySelectorAll('button')]
        .find((button) => ['取消', 'Cancel'].includes(button.textContent?.trim() ?? ''));
      cancel?.click();
    });
    await sleep(300);
    await back(page);
  } catch (e) { rec('required note/todo menus', false, String(e).slice(0, 110)); }

  // 必修回归 3:下载卡片必须通过系统相册通道新增一张 PNG,不能再弹「功能未开放」。
  try {
    await gotoHome(page);
    await tap(page, 'today.quick.card');
    const before = await page.evaluate(() => (window.__SIM_FS__?.getMedia() ?? [])
      .filter((item) => item.mimeType?.startsWith('image/')).length);
    await tap(page, 'today.card.download', 0, 'action');
    await sleep(1800);
    const gallery = await page.evaluate(() => (window.__SIM_FS__?.getMedia() ?? [])
      .filter((item) => item.mimeType?.startsWith('image/')));
    const saved = gallery.find((item) => item.name?.startsWith('xiaorichang_card_'));
    rec('required card download writes system album', gallery.length === before + 1 && saved?.mimeType === 'image/png',
      `${before}→${gallery.length}, ${saved?.name ?? 'missing'}`);
  } catch (e) { rec('required card download writes system album', false, String(e).slice(0, 110)); }

  // 四类系统能力回归:文本分享、图片分享、第二个剪切板入口、系统选图、系统收银台。
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.timeline');
    await tap(page, 'timeline.view.select.text', 0, 'action');
    const expected = await page.$eval('pre', (el) => el.textContent ?? '');
    await tap(page, 'timeline.text.copy', 0, 'action');
    const copied = await page.evaluate(() => window.__OS__.clipboard.getText());
    rec('system clipboard receives timeline text', copied === expected);

    await tap(page, 'timeline.share.open', 0, 'action');
    const chooserShown = await chooseIntentApp(page, '微信');
    const shareTarget = await page.evaluate(() => window.__OS__.state.activeAppId);
    rec('text share opens system ACTION_SEND target', chooserShown && shareTarget === 'wechat', String(shareTarget));
    await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'CANCELED' }));
    await sleep(600);
  } catch (e) { rec('system text share/clipboard', false, String(e).slice(0, 110)); }

  try {
    await gotoHome(page);
    await tap(page, 'today.note.cardmenu.open', 0);
    await tap(page, 'note.cardmenu.shareImage', 0, 'action');
    const chooserShown = await chooseIntentApp(page, '微信');
    const shareTarget = await page.evaluate(() => window.__OS__.state.activeAppId);
    rec('image share opens system ACTION_SEND target', chooserShown && shareTarget === 'wechat', String(shareTarget));
    await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'CANCELED' }));
    await sleep(600);
  } catch (e) { rec('system image share', false, String(e).slice(0, 110)); }

  try {
    await gotoHome(page);
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.account.open');
    const avatarBefore = (await stateSlice(page, 'user'))?.avatar;
    await tap(page, 'account.avatar.edit', 0, 'action');
    const pickerOpened = await selectFirstSystemImage(page);
    const avatarAfter = (await stateSlice(page, 'user'))?.avatar;
    rec('system album picker updates avatar', pickerOpened && avatarAfter?.startsWith('/sdcard/') && avatarAfter !== avatarBefore,
      `${avatarBefore ?? ''}→${avatarAfter ?? ''}`);
  } catch (e) { rec('system album picker', false, String(e).slice(0, 110)); }

  try {
    await gotoHome(page);
    await tap(page, 'tabbar.habits');
    await tap(page, 'habits.create');
    await tap(page, 'habit.create.iconstyle.select.album', 0, 'action');
    const pickerOpened = await selectFirstSystemImage(page);
    const draft = (await stateSlice(page, '_temp'))?.draft?.habitForm;
    rec('habit icon picker stores system image', pickerOpened && draft?.icon?.startsWith('/sdcard/'));
  } catch (e) { rec('habit icon system picker', false, String(e).slice(0, 110)); }

  try {
    await gotoHome(page);
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.personalize');
    await tap(page, 'personalize.theme.custom.pick', 0, 'action');
    const pickerOpened = await selectFirstSystemImage(page);
    const settings = await stateSlice(page, 'settings');
    const previewShown = !!(await page.waitForSelector('img[alt="自定义主题预览"]', { timeout: 3000 }).catch(() => null));
    rec('custom theme picker stores and previews system image',
      pickerOpened && settings?.customThemeImage?.startsWith('/sdcard/') && previewShown);
  } catch (e) { rec('custom theme system picker', false, String(e).slice(0, 110)); }

  try {
    await gotoHome(page);
    await tap(page, 'today.upgrade.pay', 0, 'action');
    const payTarget = await page.evaluate(() => window.__OS__.state.activeAppId);
    const payIntent = await page.evaluate(() => window.__OS__.getIntentPayload('alipay'));
    rec('premium entry opens system ACTION_PAY cashier', payTarget === 'alipay' && payIntent?.data?.amount === 18,
      `${payTarget}, amount=${payIntent?.data?.amount}`);
    await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'OK' }));
    await sleep(700);
    rec('payment result activates premium', (await stateSlice(page, 'user'))?.vip === true);
  } catch (e) { rec('system payment cashier', false, String(e).slice(0, 110)); }

  // G4-15:AI 规划师是真页面,只有生成按钮 wontfix
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.aiplanner');
    const real = await has(page, '[data-action="ai.planner.sample.pick"]');
    rec('G4-15 AI planner is a real page', real);
  } catch (e) { rec('G4-15 AI planner', false, String(e).slice(0, 90)); }

  // G4-11:个性化色板 tab 不再是死占位
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.personalize');
    await tap(page, 'personalize.tab.select.palette', 0, 'action');
    rec('G4-11 palette tab implemented', await has(page, '[data-action="personalize.palette.pick"]'));
  } catch (e) { rec('G4-11 palette tab', false, String(e).slice(0, 90)); }

  // G4-10:不得再出现浏览器原生 confirm/prompt(它们会阻塞并让走查卡死)
  try {
    await gotoHome(page);
    await page.evaluate(() => {
      window.__nativeDialogUsed = false;
      for (const k of ['confirm', 'prompt', 'alert']) {
        window[k] = () => { window.__nativeDialogUsed = true; return false; };
      }
    });
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.contexts');
    await tap(page, 'context.create.open', 0, 'action');
    const inApp = await has(page, 'input[placeholder="情境名称"]');
    const used = await page.evaluate(() => window.__nativeDialogUsed);
    rec('G4-10 no native prompt; in-app dialog shown', inApp && !used);
  } catch (e) { rec('G4-10 in-app dialogs', false, String(e).slice(0, 90)); }

  // G4b-1(R4 录屏):完成打卡后,该习惯先停留 ~1.2s,然后从今日页消失(hideCompleted 默认 true)
  // ⚠ 不能用 [data-trigger="today.checkin.open"] 来数「已完成」—— 它对 done/failed/pending
  //   三种非空状态都绑定,前面的失败用例会污染计数。改数「今日页习惯格子总数」。
  const tileCount = async (page) => (await count(page, '[data-action="today.habit.oneTapDone"]'))
    + (await count(page, '[data-trigger="today.checkin.open"]'))
    + (await count(page, '[data-trigger="today.checkin.open.noOneTap"]'));
  try {
    await gotoHome(page);
    const before = await tileCount(page);
    const undoneBefore = await count(page, '[data-action="today.habit.oneTapDone"]');
    await tap(page, 'today.habit.oneTapDone', 0, 'action');
    rec('G4b-1a done tile lingers (~1.2s grace)', (await tileCount(page)) === before, `${before} tiles still shown`);
    await sleep(1500);
    const after = await tileCount(page);
    const undoneAfter = await count(page, '[data-action="today.habit.oneTapDone"]');
    rec('G4b-1b completed habit hidden after grace', after === before - 1 && undoneAfter === undoneBefore - 1,
      `tiles ${before}→${after}`);
  } catch (e) { rec('G4b-1 hide-after-done', false, String(e).slice(0, 90)); }

  // G4b-1c:关掉「隐藏已完成」后,已完成的图标重新出现,且点它开的是打卡弹层(R2 与 R4 在此汇合)
  try {
    await tap(page, 'today.hideDone.toggle', 0, 'action');
    const shown = await count(page, '[data-trigger="today.checkin.open"]');
    rec('G4b-1c toggling hideDone reveals done habits', shown >= 1, `${shown} visible`);
    if (shown) {
      await tap(page, 'today.checkin.open', 0);
      rec('G4b-1d done tile opens checkin sheet (R2)', await has(page, '[data-action="checkin.state.select.fail"]'));
      await back(page);
    }
    await tap(page, 'today.hideDone.toggle', 0, 'action'); // 复原
  } catch (e) { rec('G4b-1c/d hideDone toggle', false, String(e).slice(0, 90)); }

  // G4b-2(s254/255/256):统计的周/月/年是三套结构不同的视图,不是一张表换数据
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.stats');
    const weekCells = await count(page, '[data-trigger="stats.week.cell.open"]');
    rec('G4b-2a week view = habit×weekday table', weekCells > 0, `${weekCells} cells`);
    await tap(page, 'stats.range.select.month', 0, 'action');
    const monthCells = await count(page, '[data-trigger="stats.week.cell.open"]');
    rec('G4b-2b month view is NOT the week table', monthCells === 0);
    await tap(page, 'stats.range.select.year', 0, 'action');
    const yearCells = await count(page, '[data-trigger="stats.week.cell.open"]');
    rec('G4b-2c year view is NOT the week table', yearCells === 0);
    await tap(page, 'stats.range.select.week', 0, 'action');
    rec('G4b-2d week view restored', (await count(page, '[data-trigger="stats.week.cell.open"]')) > 0);
  } catch (e) { rec('G4b-2 three distinct stats views', false, String(e).slice(0, 90)); }

  // G5-1(s259 版式):选中态变了,今日页列数必须真的跟着变(坑一同型)
  try {
    await gotoHome(page);
    const colsOf = () => page.evaluate(() => {
      const el = document.querySelector('[data-ctx-drop] > div:last-child');
      return el ? getComputedStyle(el).gridTemplateColumns.split(' ').length : 0;
    });
    const before = await colsOf();
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.personalize');
    await tap(page, 'personalize.tab.select.layout', 0, 'action');
    rec('G5-1a layout tab implemented', await has(page, '[data-action="personalize.layout.select.tight"]'));
    await tap(page, 'personalize.layout.select.tight', 0, 'action');
    await gotoHome(page);
    const after = await colsOf();
    rec('G5-1b 版式 actually changes today grid', before === 4 && after === 5, `${before} cols → ${after} cols`);
  } catch (e) { rec('G5-1 layout density', false, String(e).slice(0, 100)); }

  // G5-2(s258 边框):图标形状必须真的从圆形变圆角矩形
  try {
    const radiusOf = () => page.evaluate(() => {
      const el = document.querySelector('[data-action^="today.habit.oneTapDone"], [data-trigger^="today.checkin.open"]');
      return el ? getComputedStyle(el).borderRadius : '';
    });
    const before = await radiusOf();
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.personalize');
    await tap(page, 'personalize.tab.select.border', 0, 'action');
    rec('G5-2a border tab implemented', await has(page, '[data-action="personalize.border.select.squircle"]'));
    await tap(page, 'personalize.border.select.squircle', 0, 'action');
    await gotoHome(page);
    const after = await radiusOf();
    const wasRound = parseFloat(before) > 100 || before.includes('9999');
    rec('G5-2b 边框 actually changes icon shape', wasRound && !!after && after !== before, `${before} → ${after}`);
  } catch (e) { rec('G5-2 icon shape', false, String(e).slice(0, 100)); }

  // G5-3(s257):『天』档只属于番茄专注;切域必须重置 range,不能出现「习惯打卡 · 天」
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.stats');
    rec('G5-3a habit domain has no 天 chip', !(await has(page, '[data-action="stats.range.select.day"]')));
    await tap(page, 'stats.domain.select.focus', 0, 'action');
    rec('G5-3b focus domain shows 天 chip', await has(page, '[data-action="stats.range.select.day"]'));
    rec('G5-3c focus day view rendered', await has(page, '[data-trigger="stats.focus.timeline.open"]'));
    const r0 = ((await stateSlice(page, 'records')) ?? []).length;
    await tap(page, 'stats.focus.manualAdd', 0, 'action');
    const r1 = ((await stateSlice(page, 'records')) ?? []).length;
    rec('G5-3d 补记专注 writes a record', r1 === r0 + 1, `${r0}→${r1}`);
    // 切回习惯打卡:天 chip 必须消失(否则会停在不存在的「习惯打卡·天」)
    await tap(page, 'stats.domain.select.habit', 0, 'action');
    const dayGone = !(await has(page, '[data-action="stats.range.select.day"]'));
    const backToWeek = await has(page, '[data-trigger="stats.week.cell.open"]');
    rec('G5-3e switching domain resets range', dayGone && backToWeek);
  } catch (e) { rec('G5-3 focus stats domain/range', false, String(e).slice(0, 100)); }

  // G4b-3:**升级路径**。走查每次都是全新浏览器,盖不到「装过旧版的用户」。
  // 塞一份 _dataVersion 过期的旧存档(hideCompleted:false),刷新后必须被迁移钩子重置。
  try {
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('xiaorichang'));
      raw.state._dataVersion = 0;                 // 假装是旧版本
      raw.state.settings.hideCompleted = false;   // 旧版本的错误默认值
      localStorage.setItem('xiaorichang', JSON.stringify(raw));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.evaluate((a) => window.__OS__.openApp(a), APP);
    await sleep(1500);
    const settings = await stateSlice(page, 'settings');
    const dv = await stateSlice(page, '_dataVersion');
    rec('G4b-3 stale save is migrated (DATA_VERSION)', settings?.hideCompleted === true && dv !== 0,
      `hideCompleted=${settings?.hideCompleted} _dataVersion=${dv}`);
  } catch (e) { rec('G4b-3 stale save migration', false, String(e).slice(0, 100)); }

  // §11 返回可达性:深页(设置→小组件)连续 back → 回 tab 根,无环
  try {
    await gotoHome(page);
    await tap(page, 'tabbar.profile');
    await tap(page, 'profile.grid.widget', 0);
    rec('reached deep page (widget)', await has(page, '[data-action="widget.settings.commit"]'));
    const seq = [];
    let reachedRoot = false;
    for (let i = 0; i < 8; i++) {
      seq.push(await sig(page));
      if (await atTabRoot(page)) { reachedRoot = true; break; }
      await back(page);
    }
    const acyclic = new Set(seq).size === seq.length;
    rec('back-reachability: reaches tab root', reachedRoot, `${seq.length} steps`);
    rec('back-reachability: acyclic', acyclic, acyclic ? '' : 'REPEAT signature');
  } catch (e) { rec('back-reachability', false, String(e).slice(0, 120)); }

  rec('zero console/pageerror', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();

  const fails = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - fails.length}/${results.length} passed ===`);
  if (errors.length) { console.log('ERRORS:'); errors.slice(0, 8).forEach((e) => console.log('  ' + e)); }
  if (fails.length) { console.log('FAILURES:'); fails.forEach((f) => console.log(`  ${f.name} — ${f.detail}`)); process.exit(1); }
};
main().catch((e) => { console.error('WALKTHROUGH CRASHED:', e); process.exit(1); });
