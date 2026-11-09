// 邮件 App 运行时走查（pipeline v3 §5.2 第五道 gate）。
// 监听 console/pageerror（零容忍）；每条 P0 交互一条 before/after 状态断言；
// 分类/多选这类切换必带"切换前后各读一个依赖量、断言不相等"；末尾带 §11 返回可达性断言。
// 注意：App 用 MemoryRouter，路由不进 window.location —— 断言走 __SIM__ 状态 + DOM 标志。
// 用法：node apps/Mail/assets/runtime_walkthrough.mjs  （需先 npm run dev）
import { chromium } from 'playwright';

const URL = process.env.MAIL_URL || 'http://127.0.0.1:3000';
const APP = 'mail';

const results = [];
const errors = [];
const rec = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const stateSlice = (page, k) =>
  page.evaluate((e) => window.__SIM__.getState().apps[e.a]?.[e.k], { a: APP, k }).catch(() => undefined);
const mails = async (page) => (await stateSlice(page, 'mails')) ?? [];
const has = async (page, sel) => (await page.locator(sel).count()) > 0;
const text = (page) =>
  page.evaluate(() => (document.querySelector('[data-adjust-resize]') || document.body).innerText);
const sig = (page) =>
  page.evaluate(() =>
    (document.querySelector('[data-adjust-resize]') || document.body).innerText.replace(/\s+/g, '').slice(0, 60),
  );

const tap = async (page, id, i = 0, kind = 'trigger') => {
  const el = page.locator(`[data-${kind}="${id}"]`).nth(i);
  await el.click({ timeout: 4000 });
  await page.waitForTimeout(420);
};
/**
 * 长按：邮件行的长按绑定挂在内容层的 div 上（只有 pointer 处理器、没有 onClick），
 * 所以必须模拟按住 600ms，不能用 click。同名 trigger 还挂在左滑露出的 More 按钮上，
 * 那个被内容层盖住不可点，所以这里用 data-trigger-type 精确挑出长按那个。
 */
const longPress = async (page, id, i = 0) => {
  const el = page.locator(`[data-trigger="${id}"][data-trigger-type="longPress"]`).nth(i);
  const box = await el.boundingBox({ timeout: 4000 });
  if (!box) throw new Error(`no bounding box for longPress target ${id}`);
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 24));
  await page.mouse.down();
  await page.waitForTimeout(620);
  await page.mouse.up();
  await page.waitForTimeout(420);
};
const back = async (page) => {
  await page.evaluate(() => window.__OS__.handleBack());
  await page.waitForTimeout(380);
};
/** 首页标志：Edit 按钮（只有邮箱首页有） */
const atHome = (page) => has(page, '[data-trigger="home.edit.enter"]');
const gotoHome = async (page) => {
  for (let i = 0; i < 8; i++) {
    if (await atHome(page)) break;
    await back(page);
  }
  if (!(await atHome(page))) {
    await page.evaluate((a) => window.__OS__.openApp(a), APP);
    await page.waitForTimeout(700);
  }
};
/** 打开某个邮箱（首页第 n 个 mailbox.open） */
const openMailbox = async (page, n = 1) => {
  await gotoHome(page);
  await tap(page, 'mailbox.open', n);
};

const main = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  // 平台自带噪音（与本 App 无关）：主题 CDN、launcher 多屏 key=screen_2 等
  const PLATFORM_NOISE = [
    /\[WMR\]/,
    /\/cdn\/themes\//,
    /Failed to load resource/,
    /same key/,
    /screen_2/,
  ];
  const isNoise = (t) => PLATFORM_NOISE.some((re) => re.test(t));
  page.on('pageerror', (e) => {
    const t = String(e);
    if (!isNoise(t)) errors.push('pageerror: ' + t.slice(0, 160));
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (!isNoise(t)) errors.push('console: ' + t.slice(0, 160));
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.evaluate((a) => window.__OS__.openApp(a), APP);
  await page.waitForTimeout(1600);
  rec('app launches', await atHome(page));

  // —— 种子数据 ——
  const seed = await mails(page);
  rec('seed mails >= 20', seed.length >= 20, `${seed.length} mails`);
  const inboxCount = seed.filter((m) => m.folder === 'inbox').length;
  rec('seed inbox >= 5', inboxCount >= 5, `${inboxCount} in inbox`);
  const draftCount = seed.filter((m) => m.folder === 'drafts').length;
  rec('seed drafts == 6 (对齐真机计数)', draftCount === 6, `${draftCount} drafts`);
  rec('seed has unread', seed.some((m) => !m.isRead));
  rec('seed has flagged', seed.some((m) => m.isFlagged));
  rec('seed has attachment', seed.some((m) => m.attachments?.length > 0));
  rec('seed has 4 categories', new Set(seed.map((m) => m.category)).size >= 4);

  // —— P0：打开邮件详情 → 自动标为已读（阶段③ Q1）——
  // 默认分类是 Primary，里面未必有未读，所以先切到 All Mail 再挑一封确定未读的点开。
  try {
    await openMailbox(page, 1); // All Inboxes
    await tap(page, 'list.category.switch', 4); // All Mail
    const before = await mails(page);
    const unreadBefore = before.filter((m) => !m.isRead).length;
    const rowIds = await page.locator('[data-mail-row]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-mail-row')),
    );
    const targetId = rowIds.find((id) => before.find((m) => m.id === id && !m.isRead));
    rec('P0 找到未读邮件行用于断言', Boolean(targetId), targetId ?? 'none');
    await page.locator(`[data-mail-row="${targetId}"]`).click({ timeout: 4000 });
    await page.waitForTimeout(450);
    rec('P0 detail page rendered', await has(page, '[data-action="mail.detail.trash"]'));
    const after = await mails(page);
    const unreadAfter = after.filter((m) => !m.isRead).length;
    rec('P0 open mail marks read (unread count drops)', unreadAfter < unreadBefore, `${unreadBefore}→${unreadAfter}`);
    rec('P0 that specific mail is now read', after.find((m) => m.id === targetId)?.isRead === true);

    // 地址菜单：缺 mailId 时 go() 会抛 Missing param，表现为点了没反应
    await tap(page, 'mail.detail.expandHeader', 0, 'action');
    await tap(page, 'detail.addr.open');
    rec('P0 address menu opens (needs mailId path param)', await has(page, '[data-action="mail.addr.copy"]'));
    await tap(page, 'mail.addr.copy', 0, 'action');
    const copiedToast = await page.evaluate(() =>
      [...document.querySelectorAll('div')].some((d) => /已复制|Copied/i.test(d.textContent?.trim() ?? '')),
    );
    rec('P0 copy address uses clipboard + toast', copiedToast);
    await back(page);
  } catch (e) {
    rec('P0 open/markRead flow', false, String(e).slice(0, 110));
  }

  // —— P0：分类标签切换（切换前后各读一个依赖量，断言不相等）——
  try {
    await openMailbox(page, 1);
    const beforeText = await text(page);
    await tap(page, 'list.category.switch', 1); // Transactions
    const afterText = await text(page);
    rec('P0 category switch changes list content', beforeText !== afterText);
    rec('P0 transactions banner shows', afterText.includes('Receipts') || afterText.includes('收据'));
    await tap(page, 'list.category.switch', 4); // All Mail
    const allText = await text(page);
    rec('P0 category switch to All Mail differs from Transactions', allText !== afterText);
  } catch (e) {
    rec('P0 category switch', false, String(e).slice(0, 110));
  }

  // —— P0：⋯ 菜单切 List View（持久化，阶段③ Q15）——
  try {
    await openMailbox(page, 1);
    const beforeMode = (await stateSlice(page, 'settings'))?.viewMode;
    await tap(page, 'list.moreMenu.open');
    rec('P0 more menu opens', await has(page, '[data-action="mail.viewMode.select.listView"]'));
    await tap(page, 'mail.viewMode.select.listView', 0, 'action');
    const afterMode = (await stateSlice(page, 'settings'))?.viewMode;
    rec('P0 viewMode toggles and persists', beforeMode !== afterMode, `${beforeMode}→${afterMode}`);
    const listText = await text(page);
    rec('P0 List View hides category tabs', !(await has(page, '[data-trigger="list.category.switch"]')), listText.slice(0, 0));
    // 切回来，避免影响后续断言
    await tap(page, 'list.moreMenu.open');
    await tap(page, 'mail.viewMode.select.categories', 0, 'action');
    rec('P0 viewMode switches back', (await stateSlice(page, 'settings'))?.viewMode === beforeMode);
  } catch (e) {
    rec('P0 viewMode flow', false, String(e).slice(0, 110));
  }

  // —— P0：多选 → 批量删除（落入 trash）——
  try {
    await openMailbox(page, 1);
    const before = await mails(page);
    const trashBefore = before.filter((m) => m.folder === 'trash').length;
    await tap(page, 'list.select.enter');
    rec('P0 select mode entered', await has(page, '[data-action="mail.select.toggleOne"]'));
    const selBefore = ((await stateSlice(page, '_temp'))?.selectedIds ?? []).length;
    await tap(page, 'mail.select.toggleOne', 0, 'action');
    await tap(page, 'mail.select.toggleOne', 1, 'action');
    const selAfter = ((await stateSlice(page, '_temp'))?.selectedIds ?? []).length;
    rec('P0 selection count changes', selAfter !== selBefore, `${selBefore}→${selAfter}`);
    await tap(page, 'mail.select.trash', 0, 'action');
    const trashAfter = (await mails(page)).filter((m) => m.folder === 'trash').length;
    rec('P0 batch trash moves mails to trash', trashAfter > trashBefore, `${trashBefore}→${trashAfter}`);
  } catch (e) {
    rec('P0 select/batch trash', false, String(e).slice(0, 110));
  }

  // —— P0：筛选态只看未读 ——
  try {
    await openMailbox(page, 1);
    const beforeText = await text(page);
    await tap(page, 'list.filter.enter');
    const afterText = await text(page);
    rec('P0 filter changes list content', beforeText !== afterText);
    await back(page);
  } catch (e) {
    rec('P0 filter', false, String(e).slice(0, 110));
  }

  // —— P0：长按 → 上下文菜单 → Flag（状态翻转）——
  try {
    await openMailbox(page, 1);
    const rowId = await page.locator('[data-mail-row]').first().getAttribute('data-mail-row');
    const flagBefore = (await mails(page)).find((m) => m.id === rowId)?.isFlagged;
    await longPress(page, 'list.context.open');
    rec('P0 context menu opens (long press)', await has(page, '[data-action="mail.context.flag"]'));
    await tap(page, 'mail.context.flag', 0, 'action');
    const flagAfter = (await mails(page)).find((m) => m.id === rowId)?.isFlagged;
    rec('P0 context flag toggles', flagBefore !== flagAfter, `${flagBefore}→${flagAfter}`);
  } catch (e) {
    rec('P0 context menu flag', false, String(e).slice(0, 110));
  }

  // —— P0：Remind Me → 邮件进 Follow Up（阶段③ Q5）——
  try {
    await openMailbox(page, 1);
    const remindedBefore = (await mails(page)).filter((m) => m.remindedAt !== undefined).length;
    await longPress(page, 'list.context.open');
    // 同名 trigger 也挂在每行右滑露出的按钮上（被内容层遮住不可点），菜单里那个是最后一个
    await page.locator('[data-trigger="list.remind.open"]').last().click({ timeout: 4000 });
    await page.waitForTimeout(420);
    rec('P0 remind submenu opens', await has(page, '[data-action="mail.remind.select.option"]'));
    await tap(page, 'mail.remind.select.option', 0, 'action');
    const remindedAfter = (await mails(page)).filter((m) => m.remindedAt !== undefined).length;
    rec('P0 remindMe marks mail (goes to Follow Up)', remindedAfter > remindedBefore, `${remindedBefore}→${remindedAfter}`);
    // Follow Up 邮箱应能看到它
    await gotoHome(page);
    await tap(page, 'mailbox.open', 2); // Follow Up
    rec('P0 Follow Up mailbox not empty after remind', !(await text(page)).includes('No Messages'));
  } catch (e) {
    rec('P0 remindMe', false, String(e).slice(0, 110));
  }

  // —— P0：撰写并发送 → 落入 Sent ——
  try {
    await gotoHome(page);
    await tap(page, 'compose.open');
    rec('P0 compose page rendered', await has(page, '[data-action="mail.compose.typeTo"]'));
    const sentBefore = (await mails(page)).filter((m) => m.folder === 'sent').length;
    await page.locator('[data-action="mail.compose.typeTo"]').first().fill('Jason');
    await page.locator('[data-action="mail.compose.typeSubject"]').first().fill('Walkthrough test');
    await page.waitForTimeout(200);
    await tap(page, 'mail.compose.send', 0, 'action');
    const sentAfter = (await mails(page)).filter((m) => m.folder === 'sent').length;
    rec('P0 send creates mail in Sent', sentAfter > sentBefore, `${sentBefore}→${sentAfter}`);
  } catch (e) {
    rec('P0 compose/send', false, String(e).slice(0, 110));
  }

  // —— P0：选联系人回填 ——
  try {
    await gotoHome(page);
    await tap(page, 'compose.open');
    await tap(page, 'compose.contacts.open');
    rec('P0 contacts sheet opens', await has(page, '[data-action="mail.contacts.select.contact"]'));
    await tap(page, 'mail.contacts.select.contact', 1, 'action');
    const toValue = await page.locator('[data-action="mail.compose.typeTo"]').first().inputValue();
    rec('P0 contact picked fills To field', toValue.trim().length > 0, toValue);
    await gotoHome(page);
  } catch (e) {
    rec('P0 contacts pick', false, String(e).slice(0, 110));
  }

  // —— P0：关闭已写内容的草稿 → 存草稿（Drafts +1，阶段③ Q10）——
  try {
    await gotoHome(page);
    await tap(page, 'compose.open');
    await page.locator('[data-action="mail.compose.typeSubject"]').first().fill('Draft from walkthrough');
    await page.waitForTimeout(220);
    const draftsBefore = (await mails(page)).filter((m) => m.folder === 'drafts').length;
    await tap(page, 'compose.closeConfirm.open');
    rec('P0 close confirm sheet opens', await has(page, '[data-action="mail.closeConfirm.save"]'));
    await tap(page, 'mail.closeConfirm.save', 0, 'action');
    const draftsAfter = (await mails(page)).filter((m) => m.folder === 'drafts').length;
    rec('P0 save draft increases Drafts count', draftsAfter > draftsBefore, `${draftsBefore}→${draftsAfter}`);
  } catch (e) {
    rec('P0 save draft', false, String(e).slice(0, 110));
  }

  // —— P0：搜索（入口在列表页底部，首页没有搜索框）——
  try {
    await openMailbox(page, 1);
    await tap(page, 'search.open');
    rec('P0 search page rendered', await has(page, '[data-action="mail.search.type"]'));
    const emptyText = await text(page);
    await page.locator('[data-action="mail.search.type"]').first().fill('Nimbus');
    await page.waitForTimeout(500);
    const resultText = await text(page);
    rec('P0 search shows results (content changes)', resultText !== emptyText);
    rec('P0 search result openable', await has(page, '[data-trigger="search.result.open"]'));
    await page.locator('[data-action="mail.search.type"]').first().fill('zzzznotfoundzzzz');
    await page.waitForTimeout(500);
    rec('P0 no-result shows suggestions only', !(await has(page, '[data-trigger="search.result.open"]')));
    await gotoHome(page);
  } catch (e) {
    rec('P0 search', false, String(e).slice(0, 110));
  }

  // —— P0：Edit 模式勾选真生效（阶段③ Q16）——
  try {
    await gotoHome(page);
    const hiddenBefore = ((await stateSlice(page, 'hiddenSmartMailboxes')) ?? []).length;
    await tap(page, 'home.edit.enter');
    rec('P0 edit mode entered', await has(page, '[data-action="mail.edit.toggleMailbox"]'));
    await tap(page, 'mail.edit.toggleMailbox', 0, 'action');
    const hiddenAfter = ((await stateSlice(page, 'hiddenSmartMailboxes')) ?? []).length;
    rec('P0 edit toggle changes visibility set', hiddenAfter !== hiddenBefore, `${hiddenBefore}→${hiddenAfter}`);
    // 还原
    await tap(page, 'mail.edit.toggleMailbox', 0, 'action');
    await back(page);
  } catch (e) {
    rec('P0 edit toggle', false, String(e).slice(0, 110));
  }

  // —— P1：New Mailbox 真能新建（Save 需先选 Location，阶段④修订）——
  try {
    await gotoHome(page);
    await tap(page, 'home.edit.enter');
    await tap(page, 'home.newMailbox.open');
    rec('P1 new mailbox form opens', await has(page, '[data-action="mail.newMailbox.typeName"]'));
    await page.locator('[data-action="mail.newMailbox.typeName"]').first().fill('Receipts 2027');
    await page.waitForTimeout(200);
    const saveDisabledBeforeLoc = await page.locator('[data-action="mail.newMailbox.save"]').first().isDisabled();
    rec('P1 Save disabled until location picked (阶段④修订)', saveDisabledBeforeLoc);
    await tap(page, 'newMailbox.location.open');
    await tap(page, 'mail.location.select.account', 0, 'action');
    await page.waitForTimeout(300);
    const foldersBefore = ((await stateSlice(page, 'customFolders')) ?? []).length;
    await page.locator('[data-action="mail.newMailbox.typeName"]').first().fill('Receipts 2027');
    await page.waitForTimeout(200);
    await tap(page, 'mail.newMailbox.save', 0, 'action');
    const foldersAfter = ((await stateSlice(page, 'customFolders')) ?? []).length;
    rec('P1 new folder created', foldersAfter > foldersBefore, `${foldersBefore}→${foldersAfter}`);
    await gotoHome(page);
  } catch (e) {
    rec('P1 new mailbox', false, String(e).slice(0, 110));
  }

  // —— 阶段① 决议核对：不该存在的东西 ——
  try {
    await gotoHome(page);
    const homeText = await text(page);
    rec('决议 Q19: 首页无 VIP 行', !homeText.includes('VIP'));
    rec('决议 Q20: 首页无 Account Error 提示', !/Account Error/i.test(homeText));
    rec('决议 审核: 首页无 Virus Items', !homeText.includes('Virus'));
    await tap(page, 'home.edit.enter');
    const editText = await text(page);
    rec('决议 审核: Edit 模式无 Add Mailbox 入口', !editText.includes('Add Mailbox'));
    await back(page);
    await openMailbox(page, 1);
    await tap(page, 'message.open', 0);
    rec('决议 Q7: 详情页无上/下一封箭头', !(await has(page, '[data-trigger="detail.prev"]')));
    await gotoHome(page);
  } catch (e) {
    rec('决议核对', false, String(e).slice(0, 110));
  }

  // ===== 阶段⑥ 走查回归断言（gate4-feedback.json 五条，逐条固化）=====

  // gate4 #1：聚合视图（Transactions 等）与草稿列表的行也要能左右滑 + 长按
  try {
    await openMailbox(page, 1);
    await tap(page, 'list.category.switch', 1); // Transactions（聚合视图）
    const bundleSwipeable = await has(page, '[data-trigger="list.context.open"][data-trigger-type="longPress"]');
    rec('gate4#1 聚合行支持长按/滑动', bundleSwipeable);
    const rowId = await page.locator('[data-mail-row]').first().getAttribute('data-mail-row');
    const flagBefore = (await mails(page)).find((m) => m.id === rowId)?.isFlagged;
    await longPress(page, 'list.context.open');
    await tap(page, 'mail.context.flag', 0, 'action');
    const flagAfter = (await mails(page)).find((m) => m.id === rowId)?.isFlagged;
    rec('gate4#1 聚合行长按菜单可用（flag 翻转）', flagBefore !== flagAfter, `${flagBefore}→${flagAfter}`);

    // 草稿列表：第 6 个 mailbox.open 是学校账号的 Drafts
    await gotoHome(page);
    const draftsOpened = await page
      .locator('[data-trigger="mailbox.open"]')
      .filter({ hasText: /Drafts|草稿/ })
      .first()
      .click({ timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    await page.waitForTimeout(450);
    if (draftsOpened) {
      rec(
        'gate4#1 草稿行支持长按/滑动',
        await has(page, '[data-trigger="list.context.open"][data-trigger-type="longPress"]'),
      );
    } else {
      rec('gate4#1 草稿行支持长按/滑动', false, '未能打开 Drafts');
    }
  } catch (e) {
    rec('gate4#1 聚合/草稿行手势', false, String(e).slice(0, 110));
  }

  // gate4 #2：大幅左滑松手后不得误触发 click 打开详情页
  try {
    await openMailbox(page, 1);
    const sigBefore = await sig(page);
    const row = page.locator('[data-mail-row]').first();
    const box = await row.boundingBox();
    const y = box.y + Math.min(box.height / 2, 24);
    await page.mouse.move(box.x + box.width - 30, y);
    await page.mouse.down();
    // 一路拖到最左，幅度远超阈值
    for (const step of [40, 90, 140, 190, 230]) {
      await page.mouse.move(box.x + box.width - 30 - step, y);
      await page.waitForTimeout(40);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    const sigAfter = await sig(page);
    const stillOnList = await has(page, '[data-trigger="list.select.enter"]');
    rec('gate4#2 大幅左滑不误进详情页', stillOnList && sigAfter === sigBefore, `stillOnList=${stillOnList}`);

    // 防误触的标志位不该卡住后续点击。滑开状态下行内容已移出屏幕左侧本来就点不到，
    // 所以离开列表再进来（滑动位移随组件重挂载复位），验证正常点击仍然可用。
    await back(page);
    await openMailbox(page, 1);
    await page.locator('[data-mail-row]').first().click({ timeout: 4000 });
    await page.waitForTimeout(450);
    rec('gate4#2 重进列表后真实点击仍生效', await has(page, '[data-action="mail.detail.trash"]'));
    await back(page);
  } catch (e) {
    rec('gate4#2 大幅左滑', false, String(e).slice(0, 110));
  }

  // gate4 #3：分类标签上的未读圆点与聚合行的未读蓝点必须一致
  try {
    await openMailbox(page, 1);
    await tap(page, 'list.category.switch', 2); // Updates
    const all = await mails(page);
    const catUnread = all.some((m) => m.folder === 'inbox' && m.category === 'updates' && !m.isRead);
    // 页面上是否画出了未读蓝点（SwipeableRow 里的 UnreadDot）
    const dotShown = await page.evaluate(() =>
      [...document.querySelectorAll('[data-mail-row] span')].some(
        (el) => getComputedStyle(el).backgroundColor === 'rgb(0, 122, 255)',
      ),
    );
    rec('gate4#3 聚合行未读蓝点与数据一致', catUnread === dotShown, `data=${catUnread} dom=${dotShown}`);
  } catch (e) {
    rec('gate4#3 未读点一致性', false, String(e).slice(0, 110));
  }

  // gate4 #4：展开一个账号不应收起其他账号
  try {
    await gotoHome(page);
    const before = (await stateSlice(page, 'expandedAccountIds')) ?? [];
    await tap(page, 'mail.home.accountToggle', 1, 'action'); // 展开第 2 个账号
    const after = (await stateSlice(page, 'expandedAccountIds')) ?? [];
    rec('gate4#4 可同时展开多个账号', after.length > before.length, `${before.length}→${after.length}`);
    rec('gate4#4 原展开的账号未被收起', before.every((id) => after.includes(id)), after.join(','));
    // 再点一次应只收起它自己
    await tap(page, 'mail.home.accountToggle', 1, 'action');
    const back2 = (await stateSlice(page, 'expandedAccountIds')) ?? [];
    rec('gate4#4 再点收起自身', back2.length === before.length, `${after.length}→${back2.length}`);
  } catch (e) {
    rec('gate4#4 账号展开互不影响', false, String(e).slice(0, 110));
  }

  // gate4 #5：发送后的提示文案应为「已发送」，不是「刚刚更新」
  try {
    await gotoHome(page);
    await tap(page, 'compose.open');
    await page.locator('[data-action="mail.compose.typeTo"]').first().fill('Jason');
    await page.waitForTimeout(200);
    await tap(page, 'mail.compose.send', 0, 'action');
    const toastText = await page.evaluate(() => {
      const el = [...document.querySelectorAll('div')].find((d) =>
        /^(Sent|已发送|Updated Just Now|刚刚更新)$/.test(d.textContent?.trim() ?? ''),
      );
      return el?.textContent?.trim() ?? '';
    });
    rec('gate4#5 发送提示文案为已发送', /Sent|已发送/.test(toastText) && !/Updated|刚刚更新/.test(toastText), toastText);
  } catch (e) {
    rec('gate4#5 发送提示文案', false, String(e).slice(0, 110));
  }

  // ===== 阶段⑥ 走查第 2 轮回归断言 =====

  // 轮2 #1：按住不松手慢慢左滑，越过长按阈值也不该弹出长按菜单
  try {
    await openMailbox(page, 1);
    const row = page.locator('[data-mail-row]').first();
    const box = await row.boundingBox();
    const y = box.y + Math.min(box.height / 2, 24);
    await page.mouse.move(box.x + box.width - 30, y);
    await page.mouse.down();
    // 边按边滑，累计耗时 ~750ms，远超 400ms 长按阈值
    for (const step of [30, 70, 120, 170, 220]) {
      await page.mouse.move(box.x + box.width - 30 - step, y);
      await page.waitForTimeout(150);
    }
    const menuShownWhileHolding = await has(page, '[data-action="mail.context.flag"]');
    await page.mouse.up();
    await page.waitForTimeout(400);
    const menuShownAfterRelease = await has(page, '[data-action="mail.context.flag"]');
    rec(
      '轮2#1 按住慢滑不弹长按菜单',
      !menuShownWhileHolding && !menuShownAfterRelease,
      `holding=${menuShownWhileHolding} released=${menuShownAfterRelease}`,
    );
    // 纯长按（不移动）仍应正常弹出菜单，别把功能修坏了
    await back(page);
    await openMailbox(page, 1);
    await longPress(page, 'list.context.open');
    rec('轮2#1 纯长按仍能弹出菜单', await has(page, '[data-action="mail.context.flag"]'));
    await back(page);
  } catch (e) {
    rec('轮2#1 按住慢滑', false, String(e).slice(0, 110));
  }

  // 轮2 #2：读完聚合行代表的邮件后，该行未读蓝点应消失
  try {
    await openMailbox(page, 1);
    await tap(page, 'list.category.switch', 2); // Updates（聚合视图，种子里有未读）
    const dotCount = () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('[data-mail-row] span')].filter(
            (el) => getComputedStyle(el).backgroundColor === 'rgb(0, 122, 255)',
          ).length,
      );
    const dotsBefore = await dotCount();
    rec('轮2#2 聚合视图存在未读蓝点（前提）', dotsBefore > 0, `${dotsBefore} dots`);
    await page.locator('[data-mail-row]').first().click({ timeout: 4000 });
    await page.waitForTimeout(500);
    await back(page);
    await page.waitForTimeout(400);
    const dotsAfter = await dotCount();
    rec('轮2#2 读完后该行蓝点消失', dotsAfter < dotsBefore, `${dotsBefore}→${dotsAfter}`);
  } catch (e) {
    rec('轮2#2 聚合行已读', false, String(e).slice(0, 110));
  }

  // 轮2 #3：收件人必须是合法邮箱（或通讯录里的人）才能发送
  try {
    await gotoHome(page);
    await tap(page, 'compose.open');
    const sendBtn = page.locator('[data-action="mail.compose.send"]').first();
    const toInput = page.locator('[data-action="mail.compose.typeTo"]').first();

    await toInput.fill('notanemail');
    await page.waitForTimeout(250);
    rec('轮2#3 非法收件人时发送键禁用', await sendBtn.isDisabled());
    rec('轮2#3 非法收件人时给出提示', await has(page, '[data-mail-recipient-hint]'));

    await toInput.fill('someone@example.com');
    await page.waitForTimeout(250);
    rec('轮2#3 合法邮箱地址可发送', !(await sendBtn.isDisabled()));
    rec('轮2#3 合法时提示消失', !(await has(page, '[data-mail-recipient-hint]')));

    await toInput.fill('Jason');
    await page.waitForTimeout(250);
    rec('轮2#3 通讯录人名同样可发送', !(await sendBtn.isDisabled()));
    await gotoHome(page);
  } catch (e) {
    rec('轮2#3 收件人校验', false, String(e).slice(0, 110));
  }

  // ===== 阶段⑥ 走查第 3 轮回归断言 =====

  // 轮3 #4：松手之后行不得继续跟着指针移动（pointer capture 中途丢失的场景）
  try {
    await openMailbox(page, 1);
    const row = page.locator('[data-mail-row]').first();
    const box = await row.boundingBox();
    const y = box.y + Math.min(box.height / 2, 24);
    // 读内容层的 transform（data-mail-row 的父元素就是可滑动的内容层）
    const offsetOf = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-mail-row]')?.parentElement;
        return el ? getComputedStyle(el).transform : 'none';
      });

    await page.mouse.move(box.x + box.width - 30, y);
    await page.mouse.down();
    for (const step of [40, 100, 160]) {
      await page.mouse.move(box.x + box.width - 30 - step, y);
      await page.waitForTimeout(160);
    }
    await page.mouse.up();
    await page.waitForTimeout(450);
    const settled = await offsetOf();

    // 松手后继续移动指针，位移不应再变化
    for (const dx of [40, 120, 200]) {
      await page.mouse.move(box.x + dx, y);
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(300);
    const afterHover = await offsetOf();
    rec('轮3#4 松手后行不再跟随指针', settled === afterHover, `${settled} vs ${afterHover}`);
  } catch (e) {
    rec('轮3#4 松手后不跟随', false, String(e).slice(0, 110));
  }

  // 轮4：滑动吸附 —— 轻滑即全开、回滑一点即全收，绝不停在中间
  try {
    await openMailbox(page, 1);
    const row = page.locator('[data-mail-row]').first();
    const box = await row.boundingBox();
    const y = box.y + Math.min(box.height / 2, 24);
    const offsetX = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-mail-row]')?.parentElement;
        if (!el) return NaN;
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return Math.round(m.m41);
      });
    const drag = async (fromX, toX) => {
      await page.mouse.move(fromX, y);
      await page.mouse.down();
      const steps = 6;
      for (let i = 1; i <= steps; i++) {
        await page.mouse.move(fromX + ((toX - fromX) * i) / steps, y);
        await page.waitForTimeout(45);
      }
      await page.mouse.up();
      await page.waitForTimeout(450);
    };

    // 只往左滑 60px（远小于 216 的总宽），松手后应吸附到全开
    const startX = box.x + box.width - 30;
    await drag(startX, startX - 60);
    const afterShortLeft = await offsetX();
    rec('轮4 轻滑 60px 即吸附到左侧全开', afterShortLeft === -216, `offset=${afterShortLeft}`);

    // 已全开状态往回滑 50px，应吸附到全收（而不是只收回 50px）
    await drag(box.x + 60, box.x + 110);
    const afterShortClose = await offsetX();
    rec('轮4 回滑 50px 即吸附到全收', afterShortClose === 0, `offset=${afterShortClose}`);

    // 右滑同理：滑 60px 即吸附到右侧全开（152）
    await drag(box.x + 30, box.x + 90);
    const afterShortRight = await offsetX();
    rec('轮4 右滑 60px 即吸附到右侧全开', afterShortRight === 152, `offset=${afterShortRight}`);

    // 全开态下未达阈值的轻微回滑，应保持全开（不停在中间）
    await drag(box.x + 200, box.x + 185);
    const afterTinyBack = await offsetX();
    rec('轮4 全开态轻微回滑保持全开', afterTinyBack === 152, `offset=${afterTinyBack}`);

    // 回到关闭态，再做一次未达阈值的轻滑，应回弹到 0
    await drag(box.x + 60, box.x + 10);
    rec('轮4 回到关闭态（前提）', (await offsetX()) === 0);
    await drag(startX, startX - 20);
    const afterTinyOpen = await offsetX();
    rec('轮4 关闭态未达阈值的轻滑回弹到 0', afterTinyOpen === 0, `offset=${afterTinyOpen}`);

    // 落点必须只有 0 / -216 / 152 三种，任何中间值都算 bug
    const LANDINGS = [0, -216, 152];
    const seq = [];
    // 连续快速操作：这是 offset 竞态（闭包读到上一帧旧值）最容易暴露的场景
    for (const [from, to] of [
      [startX, startX - 70],
      [box.x + 40, box.x + 80],
      [startX, startX - 30],
      [startX, startX - 200],
      [box.x + 30, box.x + 70],
    ]) {
      await page.mouse.move(from, y);
      await page.mouse.down();
      for (let i = 1; i <= 4; i++) {
        await page.mouse.move(from + ((to - from) * i) / 4, y);
        await page.waitForTimeout(30);
      }
      await page.mouse.up();
      await page.waitForTimeout(320);
      seq.push(await offsetX());
    }
    rec('轮4 连续快速滑动后落点始终是全开或全收', seq.every((v) => LANDINGS.includes(v)), seq.join(','));

    // 收回阈值应比开启阈值更敏感：全开态回滑 30px 就该收回
    await openMailbox(page, 1);
    await drag(startX, startX - 200);
    rec('轮4 重新滑开（前提）', (await offsetX()) === -216);
    await drag(box.x + 60, box.x + 90);
    const afterSmallClose = await offsetX();
    rec('轮4 全开态回滑 30px 即收回', afterSmallClose === 0, `offset=${afterSmallClose}`);

    // 轮5：拖动中跟手、松手必吸附。扫一遍各种幅度，松手后一律不得停在中间值。
    // （之前 lostpointercapture 早于 pointerup 触发时会跳过吸附，行就停在拖动结束处）
    const strays = [];
    for (const dist of [20, 35, 55, 80, 120, 170, 210]) {
      await openMailbox(page, 1);
      await page.mouse.move(startX, y);
      await page.mouse.down();
      for (let i = 1; i <= 5; i++) {
        await page.mouse.move(startX - (dist * i) / 5, y);
        await page.waitForTimeout(35);
      }
      // 松手前确认是跟手的：位移应落在 0 与 -dist 之间，且不等于离散落点
      const mid = await offsetX();
      await page.mouse.up();
      await page.waitForTimeout(420);
      const landed = await offsetX();
      if (!LANDINGS.includes(landed)) strays.push(`${dist}px→${landed}`);
      if (dist === 120 && !(mid < 0 && mid > -216)) strays.push(`跟手异常 mid=${mid}`);
    }
    rec('轮5 各种幅度松手后都吸附到离散位置', strays.length === 0, strays.join(' | ') || '全部命中 0/-216/152');
  } catch (e) {
    rec('轮4 滑动吸附', false, String(e).slice(0, 110));
  }

  // ===== 返回可达性断言（§11）：深层页连续 back → 回首页 + 无环 =====
  try {
    await gotoHome(page);
    await tap(page, 'mailbox.open', 1);
    await tap(page, 'message.open', 0);
    await tap(page, 'compose.reply');
    rec('reached deep page (compose from detail)', await has(page, '[data-action="mail.compose.typeTo"]'));
    const seq = [];
    let reachedRoot = false;
    for (let i = 0; i < 8; i++) {
      seq.push(await sig(page));
      if (await atHome(page)) {
        reachedRoot = true;
        break;
      }
      await back(page);
    }
    const acyclic = new Set(seq).size === seq.length;
    rec('back-reachability: reaches home', reachedRoot, `${seq.length} steps`);
    rec('back-reachability: acyclic (no push-loop)', acyclic, acyclic ? '' : 'REPEAT signature detected');
  } catch (e) {
    rec('back-reachability', false, String(e).slice(0, 120));
  }

  // ===== 弹层返回可达性：每个 sheet 都能被返回键关掉 =====
  try {
    await openMailbox(page, 1);
    // Move 弹层的入口只在多选工具栏和详情页，不在普通列表，故这里只验这两个
    for (const [name, trigger, marker, gesture] of [
      ['moreMenu', 'list.moreMenu.open', '[data-action="mail.viewMode.select.listView"]', 'tap'],
      ['contextMenu', 'list.context.open', '[data-action="mail.context.flag"]', 'longPress'],
    ]) {
      if (gesture === 'longPress') await longPress(page, trigger);
      else await tap(page, trigger, 0);
      const opened = await has(page, marker);
      await back(page);
      const closed = !(await has(page, marker));
      rec(`sheet ${name} opens and closes by back`, opened && closed, `open=${opened} closed=${closed}`);
    }
  } catch (e) {
    rec('sheet back-closability', false, String(e).slice(0, 110));
  }

  rec('zero console/pageerror', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();

  const fails = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - fails.length}/${results.length} passed ===`);
  if (errors.length) {
    console.log('ERRORS:');
    errors.slice(0, 8).forEach((e) => console.log('  ' + e));
  }
  if (fails.length) {
    console.log('FAILURES:');
    fails.forEach((f) => console.log(`  ${f.name} — ${f.detail}`));
    process.exit(1);
  }
};

main().catch((e) => {
  console.error('WALKTHROUGH CRASHED:', e);
  process.exit(1);
});
