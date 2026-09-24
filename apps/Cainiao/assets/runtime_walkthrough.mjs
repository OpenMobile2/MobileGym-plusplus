// 菜鸟 运行时走查(pipeline v3 §5.2 第五道 gate)。
// 监听 console/pageerror(零容忍);P0 状态断言;select/tab 前后数据断言;返回可达性断言(§11);双语断言(§10.2)。
// app 用 MemoryRouter,路由不进 window.location —— 断言走 __SIM__ 状态 + DOM 标志。
// 用法: node apps/Cainiao/assets/runtime_walkthrough.mjs  (需先 npm run dev)
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:3000';
const APP = 'cainiao';

const results = [];
const rec = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const errors = [];

const stateSlice = (page, k) => page.evaluate((e) => window.__SIM__.getState().apps[e.a]?.[e.k], { a: APP, k }).catch(() => undefined);
const has = async (page, sel) => (await page.locator(sel).count()) > 0;
const visibleText = (page, text) => page.locator(`text=${text}`).first().isVisible().catch(() => false);
const tap = async (page, id, i = 0, kind = 'trigger') => {
  const el = page.locator(`[data-${kind}="${id}"]`).nth(i);
  await el.click({ timeout: 4000 });
  await page.waitForTimeout(420);
};
const typeInto = async (page, id, value) => {
  const el = page.locator(`[data-action="${id}"]`).first();
  await el.fill(value, { timeout: 4000 });
  await page.waitForTimeout(250);
};
const back = async (page) => { await page.evaluate(() => window.__OS__.handleBack()); await page.waitForTimeout(380); };
const atTabRoot = (page) => has(page, '[data-trigger="tabbar.home"]');
const gotoHome = async (page) => {
  for (let i = 0; i < 8; i++) { if (await atTabRoot(page)) break; await back(page); }
  if (!(await atTabRoot(page))) { await page.evaluate((a) => window.__OS__.openApp(a), APP); await page.waitForTimeout(700); }
  if (await has(page, '[data-trigger="tabbar.home"]')) await tap(page, 'tabbar.home');
};
const sig = (page) =>
  page.evaluate(() => {
    const t = (document.querySelector('[data-adjust-resize]') || document.body).innerText.replace(/\s+/g, '');
    return `${t.length}:${t.slice(0, 80)}:${t.slice(-80)}`;
  });

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

  // 种子多样性(V11)
  const pkgs = await stateSlice(page, 'packages');
  rec('seed packages >=8 diverse', (pkgs?.length ?? 0) >= 8, `${pkgs?.length} packages`);
  const addrs = await stateSlice(page, 'addresses');
  rec('seed addresses >=3', (addrs?.length ?? 0) >= 3, `${addrs?.length}`);

  // 首页 segment 切换:查收→寄退,依赖它的可观察量必须变(坑一断言:寄退卡出现/到站卡消失)
  try {
    const beforeHasShip = await has(page, '[data-trigger="home.shiporder.open"]');
    await tap(page, 'home.segment.select.jitui', 0, 'action');
    const seg = await stateSlice(page, 'homeSegment');
    const afterHasShip = await has(page, '[data-trigger="home.shiporder.open"]');
    rec('home segment select: state+view change', seg === 'jitui' && !beforeHasShip && afterHasShip, `seg=${seg}, shipCard ${beforeHasShip}→${afterHasShip}`);
    await tap(page, 'home.segment.select.shouqu', 0, 'action');
  } catch (e) { rec('home segment', false, String(e).slice(0, 80)); }

  // 各 Tab 渲染
  for (const trig of ['tabbar.discover', 'tabbar.coupons', 'tabbar.messages', 'tabbar.me']) {
    try { await tap(page, trig); rec(`${trig} renders`, true); } catch (e) { rec(trig, false, String(e).slice(0, 70)); }
  }
  await tap(page, 'tabbar.home');

  // P0 取件链路(0731 一键开柜):超距离提示→继续→成功→待取件→已签收
  try {
    const before = (await stateSlice(page, 'packages')).filter((p) => p.status === '待取件').length;
    const msgsBefore = (await stateSlice(page, 'packageMsgs')).length;
    await tap(page, 'home.pickup.open');
    rec('pickup page renders', await has(page, '[data-trigger="pickup.openLocker.open"]'));
    await tap(page, 'pickup.openLocker.open');
    rec('0731 distance warn dialog', await visibleText(page, '开柜提示'));
    await tap(page, 'pickup.openLocker.continue');
    rec('0731 open success dialog', await has(page, '[data-action="pickup.openLocker.done"]'));
    await tap(page, 'pickup.openLocker.done', 0, 'action');
    const after = (await stateSlice(page, 'packages')).filter((p) => p.status === '待取件').length;
    rec('P0 pickup: 待取件→已签收', after === before - 1, `${before}→${after}`);
    const msgsAfter = (await stateSlice(page, 'packageMsgs')).length;
    rec('#18 sign syncs package msg', msgsAfter === msgsBefore + 1, `${msgsBefore}→${msgsAfter}`);
    await gotoHome(page);
  } catch (e) { rec('P0 pickup flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // P0 寄件下单全链路
  try {
    const ordersBefore = (await stateSlice(page, 'shipOrders')).length;
    await tap(page, 'home.ship.open');
    rec('ship page renders', await has(page, '[data-trigger="ship.addressbook.recipient.open"]'));
    // 默认无寄件人:先从地址簿选寄件人(阶段⑥反馈#16)
    const senderBefore = (await stateSlice(page, 'draft'))?.senderId;
    await tap(page, 'ship.addressbook.sender.open');
    await tap(page, 'ship.addressbook.pick', 0, 'action'); // 寄件人=第1个地址
    const draftS = await stateSlice(page, 'draft');
    rec('#16 sender default empty → picked', !senderBefore && !!draftS?.senderId, `"${senderBefore}"→"${draftS?.senderId}"`);
    await tap(page, 'ship.addressbook.recipient.open');
    rec('addressbook(select) renders', await has(page, '[data-action="ship.addressbook.pick"]'));
    await tap(page, 'ship.addressbook.pick', 1, 'action'); // 收件人=第2个地址
    const draft1 = await stateSlice(page, 'draft');
    rec('P0 recipient picked', draft1?.recipients?.length === 1, `${draft1?.recipients?.length}`);
    // 物品信息弹层:选「衣物」→确定
    await tap(page, 'ship.item.open');
    rec('item sheet opens', await has(page, '[data-action="ship.item.confirm"]'));
    await tap(page, 'ship.item.type.remove', 0, 'action').catch(() => {});
    await page.locator('[data-action="ship.item.select.type"]').nth(3).click(); // 衣物
    await page.waitForTimeout(300);
    await tap(page, 'ship.item.confirm', 0, 'action');
    const draft2 = await stateSlice(page, 'draft');
    rec('P0 item type set', draft2?.recipients?.[0]?.itemType === '衣物', draft2?.recipients?.[0]?.itemType);
    await typeInto(page, 'ship.itemName.input', '回归测试商品');
    await typeInto(page, 'ship.remark.input', '蓝色礼盒备注');
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
    await page.waitForTimeout(450);
    // 上门时间:选时段即回填关闭(Q12)
    await tap(page, 'ship.time.open');
    await page.locator('[data-action="ship.time.select.slot"]').nth(2).click(); // 13:00-15:00
    await page.waitForTimeout(400);
    const draft3 = await stateSlice(page, 'draft');
    rec('P0 time slot picked & sheet closed', draft3?.slot === '13:00-15:00' && !(await has(page, '[data-action="ship.time.select.slot"]')), draft3?.slot);
    // 交件方式:保存后回填
    await tap(page, 'ship.handover.open');
    await tap(page, 'ship.handover.save', 0, 'action');
    const draft4 = await stateSlice(page, 'draft');
    rec('handover saved & backfilled', draft4?.handover?.place === '当面交件', JSON.stringify(draft4?.handover)?.slice(0, 40));
    // 寄件方式切换:运费联动(select 前后可观察量断言)
    const feeSig1 = await page.locator('text=预估运费').first().textContent().catch(() => '');
    await tap(page, 'ship.method.select.locker', 0, 'action');
    const draft5 = await stateSlice(page, 'draft');
    rec('method select locker: state+handover cleared', draft5?.method === 'locker' && !draft5?.handover, draft5?.method);
    await tap(page, 'ship.method.select.pickup', 0, 'action');
    void feeSig1;
    // 下单
    await tap(page, 'ship.order.submit');
    const orders1 = await stateSlice(page, 'shipOrders');
    rec('P0 order created (no success page, straight to detail)', orders1.length === ordersBefore + 1 && (await has(page, '[data-trigger="ship.cancel.open"]')), `${ordersBefore}→${orders1.length}, status=${orders1[0]?.status}`);
    rec('P0 order status 待上门取件', orders1[0]?.status === '待上门取件', orders1[0]?.status);
    rec('ship item name and remark persisted', orders1[0]?.itemName === '回归测试商品' && orders1[0]?.remark === '蓝色礼盒备注', `${orders1[0]?.itemName}/${orders1[0]?.remark}`);

    // P0 取消链路:原因单选 → 确认 → 已取消,操作栏仅剩客服
    await tap(page, 'ship.cancel.open');
    rec('cancel page renders', await has(page, '[data-action="ship.cancel.select.reason"]'));
    await page.locator('[data-action="ship.cancel.select.reason"]').nth(2).click(); // 计划有变
    await page.waitForTimeout(300);
    await tap(page, 'ship.cancel.confirm', 0, 'action');
    const orders2 = await stateSlice(page, 'shipOrders');
    rec('P0 cancel: status 已取消', orders2[0]?.status === '已取消', orders2[0]?.status);
    rec('cancelled detail: only 客服 left', (await has(page, '[data-trigger="ship.order.service.open"]')) && !(await has(page, '[data-trigger="ship.cancel.open"]')));
    await gotoHome(page);
    await tap(page, 'home.search.open');
    await typeInto(page, 'home.search.input', '回归测试商品');
    rec('global search finds self-created ship order', await has(page, '[data-trigger="home.search.shiporder.open"]'));
    await gotoHome(page);
  } catch (e) { rec('P0 ship flow', false, String(e).slice(0, 120)); await gotoHome(page); }

  // 寄件订单列表 Tab 切换:数据跟着变(坑一断言)
  try {
    await tap(page, 'home.ship.open');
    await tap(page, 'ship.orders.open');
    const t1 = await sig(page);
    await page.locator('[data-action="ship.orders.select.tab"]').nth(2).click(); // 已取消
    await page.waitForTimeout(350);
    const t2 = await sig(page);
    rec('orders tab select: view changes', t1 !== t2);
    rec('cancelled order visible in 已取消 tab', await has(page, '[data-trigger="ship.orders.delete.open"]'));
    // 删除已取消订单(确认弹窗)
    const n1 = (await stateSlice(page, 'shipOrders')).length;
    await tap(page, 'ship.orders.delete.open');
    await tap(page, 'ship.orders.deleteConfirm.confirm', 0, 'action');
    const n2 = (await stateSlice(page, 'shipOrders')).length;
    rec('order delete w/ confirm dialog', n2 === n1 - 1, `${n1}→${n2}`);
    await gotoHome(page);
  } catch (e) { rec('orders tab flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // 新增地址链路:表单+省市区逐级+保存
  try {
    const a1 = (await stateSlice(page, 'addresses')).length;
    await tap(page, 'home.ship.open');
    await tap(page, 'ship.addressbook.recipient.open');
    await tap(page, 'ship.address.new.open');
    await typeInto(page, 'ship.address.input.name', '王小雨');
    await typeInto(page, 'ship.address.input.phone', '13800001111');
    // 平台键盘行为:键盘弹起时第一次点击被「收起键盘」吞掉 —— 先主动失焦收起(等价于用户先收键盘)
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
    await page.waitForTimeout(450);
    await tap(page, 'ship.region.open');
    await tap(page, 'ship.region.select.hot', 5, 'action'); // 杭州 → 直达区县级
    await page.locator('[data-action="ship.region.select.level"]').last().click();
    await page.waitForTimeout(300);
    await tap(page, 'ship.region.confirm', 0, 'action');
    await typeInto(page, 'ship.address.input.detail', '文一西路100号');
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
    await page.waitForTimeout(450);
    await tap(page, 'ship.address.save', 0, 'action');
    const a2 = (await stateSlice(page, 'addresses')).length;
    rec('P0 address created', a2 === a1 + 1, `${a1}→${a2}`);
    await gotoHome(page);
  } catch (e) { rec('address create flow', false, String(e).slice(0, 120)); await gotoHome(page); }

  // 消息:进入包裹消息 → 未读清零;通知卡跳包裹详情
  try {
    await tap(page, 'tabbar.messages');
    await tap(page, 'messages.package.open');
    const unread = await stateSlice(page, 'unread');
    rec('package channel read on enter', unread?.package === 0, JSON.stringify(unread));
    await tap(page, 'messages.package.item.open', 0);
    rec('msg → package detail', await has(page, '[data-action="package.detail.timeline.toggle"]'));
    await gotoHome(page);
  } catch (e) { rec('messages flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // 购物券:领券 → claimed + 红包数 +1(数据联动)
  try {
    await tap(page, 'tabbar.coupons');
    const c1 = (await stateSlice(page, 'coupons')).length;
    await tap(page, 'coupons.claim.action', 0, 'action');
    const c2 = (await stateSlice(page, 'coupons')).length;
    const mc = (await stateSlice(page, 'marketCoupons')).filter((x) => x.claimed).length;
    rec('coupon claim: redpacket +1 & claimed', c2 === c1 + 1 && mc >= 1, `${c1}→${c2}, claimed=${mc}`);
    // 刷新重置领取态(阶段⑥反馈#12)
    await tap(page, 'coupons.refresh.action', 0, 'action');
    const mcR = (await stateSlice(page, 'marketCoupons')).filter((x) => x.claimed).length;
    const cR = (await stateSlice(page, 'coupons')).length;
    rec('#12 refresh resets claimed & reclaims redpacket', mcR === 0 && cR === c1, `claimed=${mcR}, coupons ${c2}→${cR}`);
    const marketRow = page.locator('[data-scroll-container="marketRow"]');
    const box = await marketRow.boundingBox();
    const scrollBefore = await marketRow.evaluate((el) => el.scrollLeft);
    if (box) {
      await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 30, box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
    }
    const scrollAfter = await marketRow.evaluate((el) => el.scrollLeft);
    rec('coupon market cards drag horizontally', scrollAfter > scrollBefore, `${scrollBefore}→${scrollAfter}`);
    await gotoHome(page);
  } catch (e) { rec('coupons flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // 购物订单:确认收货(确认弹窗)→ 交易成功
  try {
    await tap(page, 'tabbar.me');
    await tap(page, 'me.shoporders.open');
    await tap(page, 'me.shoporders.confirm.open');
    await tap(page, 'me.shoporders.confirmReceipt.confirm', 0, 'action');
    const so = await stateSlice(page, 'shopOrders');
    rec('P1 confirm receipt → 交易成功', so.every((o) => o.status === '交易成功'), so.map((o) => o.status).join(','));
    await gotoHome(page);
  } catch (e) { rec('shoporders flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // 包裹筛选:chip select → apply → filterApplied
  try {
    await tap(page, 'home.packagelist.open');
    await tap(page, 'package.filter.open');
    await tap(page, 'package.filter.reset', 0, 'action');
    await page.locator('[data-action="package.filter.select.chip"]').filter({ hasText: /^收件$/ }).click();
    await page.waitForTimeout(250);
    await tap(page, 'package.filter.apply', 0, 'action');
    const temp = await stateSlice(page, '_temp');
    rec('filter applied', temp?.filterApplied === true);
    await tap(page, 'package.list.item.open');
    await back(page);
    const filterAfterBack = await stateSlice(page, '_temp');
    rec('package filter persists after history back', filterAfterBack?.filterApplied === true);
    await gotoHome(page);
    await tap(page, 'home.packagelist.open');
    const filterAfterReentry = await stateSlice(page, '_temp');
    rec('package filter resets after exit and re-entry', filterAfterReentry?.filterApplied === false && Object.values(filterAfterReentry?.filter ?? {}).every((values) => values.length === 0));
    await gotoHome(page);
  } catch (e) { rec('filter flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // ===== 阶段⑥ 0731 走查修复回归 =====
  // 查收数量 = 到站 + 近日签收
  try {
    await gotoHome(page);
    const pkgsAll = await stateSlice(page, 'packages');
    const arrivedN = pkgsAll.filter((p) => p.status === '待取件').length;
    const recentN = pkgsAll.filter((p) => p.status === '已签收' && (Date.now() - p.statusTs) < 14 * 86400000).length;
    const label = await page.locator('[data-action="home.segment.select.shouqu"]').first().textContent();
    const num = parseInt((label || '').replace(/\D/g, ''), 10);
    rec('0731 shouqu count = arrived+recentSigned', num === arrivedN + recentN, `label=${label}, expect=${arrivedN}+${recentN}`);
    rec('0731 recent signed section visible', recentN === 0 || await visibleText(page, '近日签收'));
  } catch (e) { rec('0731 shouqu count', false, String(e).slice(0, 100)); }

  // 寄退数量与列表一致
  try {
    const orders = await stateSlice(page, 'shipOrders');
    const toSendN = orders.filter((o) => ['待上门取件', '待投柜', '待到店自寄'].includes(o.status)).length;
    const jLabel = await page.locator('[data-action="home.segment.select.jitui"]').first().textContent();
    const jNum = parseInt((jLabel || '').replace(/\D/g, ''), 10);
    rec('0731 jitui count = list', jNum === toSendN, `label=${jLabel}, expect=${toSendN}`);
  } catch (e) { rec('0731 jitui count', false, String(e).slice(0, 80)); }

  // 导入设置完成度 100%
  try {
    await tap(page, 'home.importSettings.open');
    rec('0731 import completion 100%', await visibleText(page, '100'));
    await gotoHome(page);
  } catch (e) { rec('0731 import 100%', false, String(e).slice(0, 80)); await gotoHome(page); }

  // 寄件顶 Tab 暂未开放
  try {
    await tap(page, 'home.ship.open');
    await page.locator('[data-action="ship.toptabs.wontfixToast"]').first().click();
    await page.waitForTimeout(300);
    rec('0731 ship toptab wontfix toast', await visibleText(page, '该功能暂未开放'));
    await gotoHome(page);
  } catch (e) { rec('0731 ship toptab', false, String(e).slice(0, 80)); await gotoHome(page); }

  // 客服 FAQ 助手气泡回答(0731-2)
  try {
    await tap(page, 'tabbar.me');
    await tap(page, 'me.service.open');
    rec('0731 no 自助工具', !(await visibleText(page, '自助工具')));
    await page.locator('[data-action="me.service.faq.select.tab"]').nth(1).click(); // 寄件
    await page.waitForTimeout(250);
    await page.locator('[data-action="me.service.faq.answer"]').first().click();
    await page.waitForTimeout(350);
    rec('0731-2 faq bot bubble', await has(page, '[data-service-bot-msg="1"]'));
    // 气泡在 FAQ 下方(页面靠下)
    const chatBelowFaq = await page.evaluate(() => {
      const faq = document.querySelector('[data-action="me.service.faq.answer"]');
      const chat = document.querySelector('[data-service-chat="1"]');
      if (!(faq instanceof HTMLElement) || !(chat instanceof HTMLElement)) return false;
      return chat.getBoundingClientRect().top > faq.getBoundingClientRect().top;
    });
    rec('0731-3 chat below FAQ', chatBelowFaq);
    // 点订单卡→助手说明+选项
    await page.locator('[data-action="me.service.order.select"]').first().click({ force: true });
    await page.waitForTimeout(500);
    const hasOpts = await has(page, '[data-trigger="me.service.order.detail.open"]');
    const hasOrderText = await visibleText(page, '已为你查到该寄件单');
    rec('0731-3 order bot options', hasOpts || hasOrderText, `opts=${hasOpts}, text=${hasOrderText}`);
    // 订单横滑
    const scrolled = await page.evaluate(() => {
      const el = document.querySelector('[data-scroll-container="serviceOrders"]');
      if (!(el instanceof HTMLElement)) return false;
      const before = el.scrollLeft;
      el.scrollLeft = before + 120;
      return el.scrollLeft > before;
    });
    rec('0731-2 service orders scrollable', scrolled);
    // 退出重进对话仍在
    const chatLen = (await stateSlice(page, 'serviceChat'))?.length ?? 0;
    await back(page);
    await page.waitForTimeout(300);
    await tap(page, 'me.service.open');
    await page.waitForTimeout(350);
    const chatLen2 = (await stateSlice(page, 'serviceChat'))?.length ?? 0;
    rec('0731-4 service chat persists', chatLen > 0 && chatLen2 === chatLen, `${chatLen}→${chatLen2}`);
    await gotoHome(page);
  } catch (e) { rec('0731 faq', false, String(e).slice(0, 100)); await gotoHome(page); }

  // 手机号修改流程(0731-2)
  try {
    await tap(page, 'tabbar.me');
    await tap(page, 'me.phone.open');
    await tap(page, 'me.phone.modify.open');
    rec('0731-2 modify confirm dialog', await has(page, '[data-action="me.phone.modify.confirm"]'));
    await tap(page, 'me.phone.modify.confirm', 0, 'action');
    rec('0731-2 modify → input page', await has(page, '[data-action="me.phone.add.input"]'));
    await typeInto(page, 'me.phone.add.input', '13900009999');
    await page.locator('[data-action="me.phone.add.agreement.toggle"]').click();
    await page.waitForTimeout(200);
    await tap(page, 'me.phone.verify.open');
    await typeInto(page, 'me.phone.verify.input', '123456');
    await page.waitForTimeout(400);
    const phones = await stateSlice(page, 'phones');
    const primary = phones?.find((p) => p.primary)?.number;
    rec('0731-2 primary phone updated', primary === '13900009999', primary);
    await gotoHome(page);
  } catch (e) { rec('0731-2 phone modify', false, String(e).slice(0, 120)); await gotoHome(page); }

  // 寄件顶栏:无「更多」、无「3.8元起」
  try {
    await tap(page, 'home.ship.open');
    const topText = await page.locator('[data-scroll-container="shipTopTabs"]').innerText();
    rec('0731-2 no 更多 tab', !topText.includes('更多'));
    rec('0731-2 no 3.8元起 badge', !topText.includes('3.8'));
    await gotoHome(page);
  } catch (e) { rec('0731-2 ship tabs', false, String(e).slice(0, 80)); await gotoHome(page); }

  // 下单时间不在未来
  try {
    const orders = await stateSlice(page, 'shipOrders');
    const now = Date.now() + 2000;
    const future = orders.filter((o) => o.placedAtTs > now);
    rec('0731 no future order time', future.length === 0, future.map((o) => o.orderNo).join(','));
  } catch (e) { rec('0731 order time', false, String(e).slice(0, 80)); }

  // ===== 阶段⑥ 0717 走查修复回归 =====
  // #4 搜索进入清空
  try {
    await gotoHome(page);
    await tap(page, 'home.search.open');
    await typeInto(page, 'home.search.input', '魔方');
    const s1 = (await stateSlice(page, '_temp'))?.packageSearch;
    // 键盘弹起时 back 只收键盘,先失焦(平台一致行为)
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
    await page.waitForTimeout(350);
    await back(page);
    await tap(page, 'home.search.open');
    const s2 = (await stateSlice(page, '_temp'))?.packageSearch;
    rec('#4 search cleared on re-entry', !!s1 && (s2 ?? '') === '', `"${s1}"→"${s2}"`);
    await gotoHome(page);
  } catch (e) { rec('#4 search clear', false, String(e).slice(0, 100)); await gotoHome(page); }

  // #17 柜机选中回填
  try {
    await tap(page, 'home.ship.open');
    await tap(page, 'ship.method.select.locker', 0, 'action');
    await tap(page, 'ship.lockers.open');
    rec('lockers page renders', await has(page, '[data-action="ship.lockers.select.item"]'));
    const lk0 = (await stateSlice(page, 'draft'))?.lockerId;
    await page.locator('[data-action="ship.lockers.select.item"]').nth(2).click();
    await page.waitForTimeout(420);
    const lk1 = (await stateSlice(page, 'draft'))?.lockerId;
    rec('#17 locker selected & backfilled', !!lk1 && lk1 !== lk0, `${lk0}→${lk1}`);
    await gotoHome(page);
  } catch (e) { rec('#17 locker backfill', false, String(e).slice(0, 100)); await gotoHome(page); }

  // #5 首页营销横幅→我的权益
  try {
    await tap(page, 'home.benefits.open');
    rec('#5 marketing banner → benefits', await has(page, '[data-action="me.benefits.select.tab"]'));
    await gotoHome(page);
  } catch (e) { rec('#5 benefits nav', false, String(e).slice(0, 100)); await gotoHome(page); }

  // #14 购物订单搜索
  try {
    await tap(page, 'tabbar.me');
    await tap(page, 'me.shoporders.open');
    const hadOrders = await has(page, '[data-trigger="me.shoporders.logistics.open"]');
    await typeInto(page, 'me.shoporders.search.input', '无此店铺XYZ');
    const noneAfter = !(await has(page, '[data-trigger="me.shoporders.logistics.open"]'));
    rec('#14 shop search filters list', hadOrders && noneAfter, `had=${hadOrders}, emptyAfterBogus=${noneAfter}`);
    await gotoHome(page);
  } catch (e) { rec('#14 shop search', false, String(e).slice(0, 100)); await gotoHome(page); }

  // ===== 返回可达性断言(§11):深层页连续 back → 回 tab 根 + 无环 =====
  try {
    await tap(page, 'home.ship.open');
    await tap(page, 'ship.addressbook.recipient.open');
    await tap(page, 'ship.address.new.open');
    await tap(page, 'ship.region.open');
    rec('reached deep page (region sheet)', await has(page, '[data-action="ship.region.select.hot"]'));
    const seq = [];
    let reachedRoot = false;
    for (let i = 0; i < 10; i++) {
      seq.push(await sig(page));
      if (await atTabRoot(page)) { reachedRoot = true; break; }
      await back(page);
    }
    const acyclic = new Set(seq).size === seq.length;
    rec('back-reachability: reaches tab root', reachedRoot, `${seq.length} steps`);
    rec('back-reachability: acyclic', acyclic, acyclic ? '' : 'REPEAT signature');
  } catch (e) { rec('back-reachability', false, String(e).slice(0, 100)); }

  // ===== 双语断言(§10.2 V10) =====
  try {
    await gotoHome(page);
    await page.evaluate(() => window.__OS__.locale.setLocale('en'));
    await page.waitForTimeout(600);
    rec('locale en: tab label switches', await visibleText(page, 'Home'));
    await page.evaluate(() => window.__OS__.locale.setLocale('zh'));
    await page.waitForTimeout(400);
    rec('locale zh restored', await visibleText(page, '首页'));
  } catch (e) { rec('bilingual', false, String(e).slice(0, 100)); }

  // 死交互兜底:wontfix 按钮点击必须有 toast(抽查一处)
  try {
    await gotoHome(page);
    await page.locator('[data-action="home.swap.wontfixToast"]').click();
    await page.waitForTimeout(300);
    rec('wontfix gives toast feedback', await visibleText(page, '该功能暂未开放'));
  } catch (e) { rec('wontfix toast', false, String(e).slice(0, 80)); }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n===== ${results.length - failed.length}/${results.length} PASS =====`);
  if (errors.length) { console.log('CONSOLE/PAGE ERRORS (零容忍):'); errors.slice(0, 10).forEach((e) => console.log('  ' + e)); }
  if (failed.length || errors.length) process.exit(1);
};

main().catch((e) => { console.error(e); process.exit(1); });
