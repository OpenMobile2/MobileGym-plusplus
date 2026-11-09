// 苏宁易购 运行时走查(pipeline v3 §5.2 第五道 gate)——覆盖 L2-M2(商详域)/ L2-M3(购物车域)/ L3-A(交易链)/ L3-B(订单子页)/ L4-A(我的+地址域)/ L4-B(关注+消息中心+发现Tab)。
// 监听 console/pageerror(零容忍);P0 状态断言;select 类前后数据断言;返回可达性断言(§11);双语断言(§10.2)。
// app 用 MemoryRouter,路由不进 window.location —— 断言走 __SIM__ 状态 + DOM 标志。
// 用法: node apps/Suning/assets/runtime_walkthrough.mjs  (需先 npm run dev)
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

/** 种子价目表(promoTag / price 不进 store,筛选类断言的期望值要照它算) */
const SEED = JSON.parse(readFileSync(`${import.meta.dirname}/../data/defaults.json`, 'utf8'));
const productSeed = (id) => SEED.products.find((p) => p.id === id) ?? null;

const URL = process.env.GYM_URL ?? 'http://127.0.0.1:3000';
const APP = 'suning';
const FAN = 'fan-fd30l501';
const PAD = 'matepad-115s';
/** L3-B 主链路用的种子订单:运输中 / 3 条轨迹 / 无退款单,可跑物流+退款+改地址 */
const KETTLE = 'order-kettle-shipping';

const results = [];
const rec = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const errors = [];

const stateSlice = (page, k) =>
  page.evaluate((e) => window.__SIM__.getState().apps[e.a]?.[e.k], { a: APP, k }).catch(() => undefined);
const has = async (page, sel) => (await page.locator(sel).count()) > 0;
const tap = async (page, id, i = 0, kind = 'trigger') => {
  await page.locator(`[data-${kind}="${id}"]`).nth(i).click({ timeout: 4000 });
  await page.waitForTimeout(400);
};
const back = async (page) => {
  await page.evaluate(() => window.__OS__.handleBack());
  await page.waitForTimeout(400);
};
const onDetail = (page) => has(page, '[data-trigger="product.detail.skuBuy.open"]');
const atTabRoot = (page) => has(page, '[data-trigger="tabbar.home.open"]');
/** 回退到无弹层的商详底态(SKU / 加购成功层会遮挡后续点击) */
const closeDetailSheets = async (page) => {
  for (let i = 0; i < 4; i++) {
    const sheetUp =
      (await has(page, '[data-action="product.detail.sku.selectOption"]')) ||
      (await has(page, '[data-trigger="product.detail.cartSuccessGoCart.open"]'));
    if (!sheetUp) return;
    await back(page);
  }
};

/**
 * 苏宁支付密码页已删除:支付走系统支付宝收银台(ACTION_PAY)。
 * 若通用退栈时卡在支付宝收银台,back 触发取消回到苏宁。
 */
const leaveCashierIfAny = async (page) => {
  if (await has(page, '[data-trigger="cashier.password.open"]')) {
    await back(page);
    return true;
  }
  return false;
};

/** 退到首页 Tab:atTabRoot 在任意 Tab 都为真(TabBar 共用),需显式切回 home */
const goHomeTab = async (page) => {
  for (let i = 0; i < 8; i++) {
    if (await atTabRoot(page)) break;
    if (await leaveCashierIfAny(page)) continue;
    await back(page);
  }
  if (!(await has(page, '[data-trigger="home.main.search.open"]'))) {
    await tap(page, 'tabbar.home.open');
  }
};

/* ---- M3 购物车/对比页辅助 ---- */
const pageText = async (page, sel = '[data-adjust-resize]') =>
  (await page.locator(sel).first().innerText()).replace(/\s+/g, '');
/** 底部结算栏「合计:¥N」取数(select 类交互前后对比用) */
const cartTotal = async (page) => {
  const m = (await pageText(page)).match(/合计:¥([\d.]+)/);
  return m ? Number(m[1]) : NaN;
};
/** 按条目 id 点购物车内的 action(勾选圈/数量步进器共用) */
const tapItem = async (page, id, itemId, i = 0) => {
  await page
    .locator(`[data-action="${id}"][data-action-params*="${itemId}"]`)
    .nth(i)
    .click({ timeout: 4000 });
  await page.waitForTimeout(400);
};
const COMPARE_LABELS = ['品牌', '型号', '产品定位', '操作系统', 'CPU平台', 'CPU型号', '主频', '内存', '硬盘', '屏幕尺寸', '屏幕材质', '分辨率', '厚度', '净重'];
/** 对比页参数表可见行数(「只看不同」前后断言) */
const paramRowCount = async (page) => {
  const t = await pageText(page, '[data-scroll-container="main"]');
  return COMPARE_LABELS.filter((l) => t.includes(l)).length;
};
const cartBadge = async (page) =>
  (await page.locator('[data-trigger="tabbar.cart.open"]').first().innerText()).replace(/\s+/g, '');

/** 商详唯一确定性入口:搜索关键词 → 结果页点指定商品卡 */
const openDetailBySearch = async (page, keyword, productId) => {
  await goHomeTab(page);
  await tap(page, 'home.main.search.open');
  await page.locator('[data-action="search.entry.keyword.input"]').first().fill(keyword);
  await page.waitForTimeout(300);
  await tap(page, 'search.entry.results.open');
  const card = page.locator(`[data-trigger="search.results.product.open"][data-trigger-params*="${productId}"]`).first();
  await card.click({ timeout: 4000 });
  await page.waitForTimeout(500);
};
const openFanDetail = (page) => openDetailBySearch(page, '风扇', FAN);
/** matepad:3C 模板 + 国补资格未领取(结算页会自动弹国补弹窗)+ 3 档延保 */
const openPadDetail = (page) => openDetailBySearch(page, '华为平板', PAD);

/* ---- L3-A 交易链辅助 ---- */
const onCheckout = (page) => has(page, '[data-trigger="checkout.main.pay.open"]');
const onPaySuccess = (page) => has(page, '[data-trigger="pay.success.ordersList.close"]');
const onOrdersList = (page) => has(page, '[data-action="orders.list.tab.switch"]');
const onOrderDetail = (page) => has(page, '[data-action="order.detail.orderNo.copy"]');
/** 结算页进入时会自动弹国补弹窗(spec:进入页面自动弹出),退出需逐层关掉弹层 */
const leaveCheckout = async (page) => {
  for (let i = 0; i < 4; i++) {
    if (!(await onCheckout(page))) return;
    await back(page);
  }
};
/** 结算页底栏「立即支付 ¥N」取数(勾选/步进/延保类交互前后对比用) */
const coTotal = async (page) => {
  const m = (await pageText(page)).match(/立即支付¥([\d.]+)/);
  return m ? Number(m[1]) : NaN;
};
const near = (a, b) => Math.abs(a - b) < 0.05;
const rowText = async (page, id) =>
  (await page.locator(`[data-trigger="${id}"]`).first().innerText()).replace(/\s+/g, '');
/** 订单列表当前 Tab 的卡片条数(Tab 切换前后条数断言用) */
const orderCardCount = (page) => page.locator('[data-trigger="orders.list.detail.open"]').count();
const switchOrderTab = async (page, tab) => {
  await page.locator(`[data-action="orders.list.tab.switch"][data-action-params*="${tab}"]`).first().click({ timeout: 4000 });
  await page.waitForTimeout(400);
};
const ordersOf = async (page, status) =>
  ((await stateSlice(page, 'orders')) ?? []).filter((o) => o.status === status);
/* ---- L3-B 订单子页辅助 ---- */
const SEARCH_INPUT = '[data-action="orders.search.query.submit"][data-action-type="input"]';
const onOrdersSearch = (page) => has(page, SEARCH_INPUT);
const onLogistics = (page) => has(page, '[data-action="logistics.detail.address.copy"]');
const onRefundApply = (page) => has(page, '[data-action="refund.apply.note.input"]');
const onRefundDetail = (page) => has(page, '[data-action="refund.detail.orderNo.copy"]');
const onOrderModify = (page) => has(page, '[data-trigger="order.modify.region.open"]');
const onAftersale = (page) => has(page, '[data-action="aftersale.main.tab.switch"]');
const onInvoice = (page) => has(page, '[data-action="invoice.list.tip.toggle"]');
/** 按 params 命中同 id 的多个控件之一(订单卡按钮都带 orderId) */
const tapWith = async (page, id, param, kind = 'trigger') => {
  await page.locator(`[data-${kind}="${id}"][data-${kind}-params*="${param}"]`).first().click({ timeout: 4000 });
  await page.waitForTimeout(400);
};
const searchHits = (page) => page.locator('[data-trigger="orders.search.detail.open"]').count();
/** 订单搜索:填关键词 → 点搜索(nth0 是输入框自身,nth1 才是搜索按钮)→ 回结果条数 */
const searchOrders = async (page, kw) => {
  await page.locator(SEARCH_INPUT).first().fill(kw);
  await page.waitForTimeout(200);
  await tap(page, 'orders.search.query.submit', 1, 'action');
  return searchHits(page);
};
/**
 * 输入后必须先收起软键盘再点底栏/表单里的控件:
 * 键盘弹出会通过 data-adjust-resize 压缩视口,点击的 pointerdown 触发键盘收起 → 布局回弹 →
 * mouseup 落到别的位置,click 事件根本不产生(真机上表现为「第一下点不中」)。
 */
const hideKeyboard = async (page) => {
  await page.evaluate(() => window.__OS__?.keyboard?.hide?.());
  await page.waitForTimeout(400);
};
const orderById = async (page, id) =>
  ((await stateSlice(page, 'orders')) ?? []).find((o) => o.id === id) ?? null;
const cartQty = async (page) =>
  ((await stateSlice(page, 'cartItems')) ?? []).reduce((n, i) => n + i.qty, 0);
const switchAftersaleTab = async (page, tab) => {
  await page.locator(`[data-action="aftersale.main.tab.switch"][data-action-params*="${tab}"]`).first().click({ timeout: 4000 });
  await page.waitForTimeout(400);
};
/** 把 store 里的时间戳格成页面上的 MM-DD(走查侧格式化,用于比对 fmtMdHm 的渲染结果) */
const mdOf = (ts) => {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* ---- L4-A 我的首页 + 地址域辅助 ---- */
const onMe = (page) => has(page, '[data-trigger="me.main.addressList.open"]');
const onAddressList = (page) => has(page, '[data-trigger="address.list.new.open"]');
const onAddressEdit = (page) => has(page, '[data-trigger="address.edit.region.open"]');
const onRegionSheet = (page) => has(page, '[data-action="address.edit.regionLevel.back"]');
const addressesOf = async (page) => (await stateSlice(page, 'addresses')) ?? [];
const addressDraftOf = (page) => stateSlice(page, 'addressDraft');
/** Toast 由 _temp.toast 驱动(DOM 只挂 1.8s),断言取 store 更稳 */
const toastOf = async (page) => (await stateSlice(page, '_temp'))?.toast ?? '';
const goMeTab = async (page) => {
  await goHomeTab(page);
  await tap(page, 'tabbar.me.open');
};
/** 地址簿选择模式:点指定地址条目回填来源页 */
const pickAddress = async (page, addressId) => {
  await tapWith(page, 'address.list.pick.select', addressId, 'action');
};
/**
 * 从地址列表页新建一条非默认地址(地区取每级第一项 = 江苏省/南京市/栖霞区/翠屏街道)。
 * 回接①②③要「选一条非默认地址后看来源页联动」,地址簿只剩一条时无从选起,先补一条。
 */
const addAddressFromList = async (page, name, detail) => {
  await tap(page, 'address.list.new.open');
  await page.locator('[data-action="address.edit.recipient.input"]').first().fill(name);
  await page.locator('[data-action="address.edit.detail.input"]').first().fill(detail);
  await page.waitForTimeout(200);
  await hideKeyboard(page);
  await tap(page, 'address.edit.region.open');
  await tap(page, 'address.edit.select.province', 0, 'action');
  await tap(page, 'address.edit.select.city', 0, 'action');
  await tap(page, 'address.edit.select.district', 0, 'action');
  await tap(page, 'address.edit.select.street', 0, 'action');
  await tap(page, 'address.edit.form.save', 0, 'action');
};
/* ---- L4-B 关注 / 消息中心 / 发现Tab 辅助 ---- */
const onFollow = (page) => has(page, '[data-action="me.follow.select.tabGoods"]');
const onMsgCenter = (page) => has(page, '[data-action="msg.center.clear.run"]');
const onDiscover = (page) => has(page, '[data-action="discover.main.topTab.switch"]');
/** 关注商品卡条数:非编辑态每卡恰有一个「找相似」 */
const followCardCount = (page) => page.locator('[data-trigger="me.follow.similar.open"]').count();
/** 精选内容卡条数:滚动区里每卡一个卡体 toast,再减去顶部 banner */
const feedCardCount = async (page) =>
  (await page.locator('[data-scroll-container="main"] [data-action="discover.main.wontfix.toast"]').count()) - 1;
const followOf = (list, productId) => (list ?? []).find((f) => f.productId === productId) ?? null;
/** 关注列表种子:平板未订阅(用于设降价通知)、风扇未订阅(用于取消关注) */
const PAD_FOLLOW = 'tablet-matepad-lingdong';
const FAN_FOLLOW = 'fan-midea-sab40a';
/** 发现关注流里未关注的直播达人(种子 followedCreators 不含它) */
const LIVE_CREATOR = 'creator-xiakelai';

const PASTE_BOX = 'textarea[placeholder="粘贴含姓名、手机号、地址的整段文本"]';
const LABEL_INPUT = 'input[placeholder^="例如"]';

/** 是否已在系统支付宝收银台(苏宁走 ACTION_PAY 后落此) */
const onAlipayCashier = (page) => has(page, '[data-trigger="cashier.password.open"]');
/** 在支付宝收银台完成支付:确认付款 → 输默认支付密码(123456)→ returnResult OK 回苏宁 */
const completeAlipayPay = async (page) => {
  await tap(page, 'cashier.password.open');
  const pwd = await page.evaluate(() => window.__SIM__.getState().apps.alipay?.userInfo?.paymentPassword ?? '123456');
  for (const ch of String(pwd)) {
    await page.locator(`[data-action="cashierPassword.keypad.press"][data-action-params*='"digit":"${ch}"']`).first().click({ timeout: 5000 });
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(900);
};

/** 微信收银台完成支付:确认付款 → 任意 6 位密码 → 广播 suning.PAY_RESULT 回苏宁。 */
const completeWechatPay = async (page) => {
  await tap(page, 'wechat.pay.confirm', 0, 'action');
  for (let i = 0; i < 6; i++) {
    await tap(page, 'wechat.pay.num.1', 0, 'action');
  }
  await page.waitForTimeout(1800);
};

const main = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200));
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate((a) => window.__OS__.openApp(a), APP);
  await page.waitForTimeout(1800);
  rec('app launches', await atTabRoot(page));

  /* ==================== L2-M3 购物车域(种子态优先跑,避免被后续加购污染) ==================== */

  /* ---------- 渲染 + 种子 9 条 + tabbar 角标 ---------- */
  try {
    await tap(page, 'tabbar.cart.open');
    const items = (await stateSlice(page, 'cartItems')) ?? [];
    const onCart = await has(page, '[data-action="cart.main.selectAll.toggle"]');
    const badge = await cartBadge(page);
    rec('购物车 Tab 渲染 + 种子9条 + 角标=件数', onCart && items.length === 9 && /^9/.test(badge), `items=${items.length} badge=${badge}`);
  } catch (e) {
    rec('cart render', false, String(e).slice(0, 90));
  }

  /* ---------- 勾选/店铺勾选/全选:合计前后数值断言 ---------- */
  try {
    const t0 = await cartTotal(page);
    await tapItem(page, 'cart.main.item.select.toggle', 'cart-1');
    const t1 = await cartTotal(page);
    await tap(page, 'cart.main.shop.select.toggle', 1, 'action'); // 联想慧达(小新16C/SE ¥5299 + 显示器 ¥899)
    const t2 = await cartTotal(page);
    await tap(page, 'cart.main.selectAll.toggle', 0, 'action');
    const t3 = await cartTotal(page);
    // 全选=原7件+显示器899+nova16pro3999 = 21471.98+4898; 店铺勾选含显示器 → 6207.6
    rec(
      '勾选/店铺勾选/全选:合计联动(0→9.6→6207.6→26369.98)',
      t0 === 0 && t1 === 9.6 && t2 === 6207.6 && t3 === 26369.98,
      `${t0}→${t1}→${t2}→${t3}`,
    );
    const btn = await pageText(page);
    rec('结算按钮文案:勾选含可领券商品→「领券结算(9)」', btn.includes('领券结算(9)'), btn.match(/(领券结算|去结算)\(\d\)/)?.[0] ?? 'n/a');
  } catch (e) {
    rec('cart select totals', false, String(e).slice(0, 90));
  }

  /* ---------- 数量步进 → 合计联动 ---------- */
  try {
    const before = await cartTotal(page);
    await tapItem(page, 'cart.main.item.qty.edit', 'cart-1'); // 「x1」展开步进器
    await tapItem(page, 'cart.main.item.qty.edit', 'cart-1', 1); // 「+」
    const plus = await cartTotal(page);
    await tapItem(page, 'cart.main.item.qty.edit', 'cart-1', 0); // 「-」
    const minus = await cartTotal(page);
    rec('数量步进:合计与角标联动', plus === 26379.58 && minus === before, `${before}→${plus}→${minus} badge=${await cartBadge(page)}`);
  } catch (e) {
    rec('cart qty step', false, String(e).slice(0, 90));
  }

  /* ---------- 去结算:checkoutDraft 落项(source/items) ---------- */
  try {
    await tap(page, 'cart.main.checkout.open');
    const draft = await stateSlice(page, 'checkoutDraft');
    rec(
      '去结算:checkoutDraft(source=cart,9项,携带 cartItemId)',
      draft?.source === 'cart' && draft?.items?.length === 9 && draft.items.every((i) => i.cartItemId),
      `${draft?.source} items=${draft?.items?.length}`,
    );
    await leaveCheckout(page); // L3-A:结算页可能有自动国补弹窗占一层栈
  } catch (e) {
    rec('cart checkout draft', false, String(e).slice(0, 90));
  }

  /* ---------- 无勾选:结算入口降级为 toast ---------- */
  try {
    await tap(page, 'cart.main.selectAll.toggle', 0, 'action'); // 取消全选
    const t = await cartTotal(page);
    const noTrigger = !(await has(page, '[data-trigger="cart.main.checkout.open"]'));
    // 底栏灰橙「去结算」是页面最后一个 wontfix.toast 入口
    await page.locator('[data-action="cart.main.wontfix.toast"]').last().click({ timeout: 4000 });
    await page.waitForTimeout(300);
    const toasted = (await pageText(page)).includes('您还没有选择商品哦');
    rec('无勾选:合计归零 + 无结算 transition + toast', t === 0 && noTrigger && toasted, `total=${t} toast=${toasted}`);
  } catch (e) {
    rec('cart empty selection', false, String(e).slice(0, 90));
  }

  /* ---------- 编辑态:底栏切换 + 无勾选删除置灰 + 删除确认弹窗 ---------- */
  try {
    await tap(page, 'cart.main.editMode.enter', 0, 'action');
    const editBar = await has(page, '[data-action="cart.main.edit.moveToFollow"]');
    const settleGone = !(await has(page, '[data-trigger="cart.main.checkout.open"]'));
    const delDisabled = !(await has(page, '[data-trigger="cart.main.deleteConfirm.open"]'));
    rec('编辑态:底栏替换为编辑栏 + 无勾选「删除」置灰', editBar && settleGone && delDisabled);

    await tapItem(page, 'cart.main.item.select.toggle', 'cart-1');
    const delOn = await has(page, '[data-trigger="cart.main.deleteConfirm.open"]');
    const before = (await stateSlice(page, 'cartItems')).length;
    await tap(page, 'cart.main.deleteConfirm.open');
    const dialogUp = await has(page, '[data-action="cart.main.delete.confirm"]');
    await tap(page, 'cart.main.delete.confirm', 0, 'action');
    const after = (await stateSlice(page, 'cartItems')).length;
    rec(
      '删除确认弹窗:确定后 cartItems -1 且角标同步',
      delOn && dialogUp && after === before - 1 && (await cartBadge(page)).startsWith('8'),
      `${before}→${after} badge=${await cartBadge(page)}`,
    );
  } catch (e) {
    rec('cart delete', false, String(e).slice(0, 90));
  }

  /* ---------- 移入关注:cartItems -1 且 followedProducts +1 ---------- */
  try {
    const cBefore = (await stateSlice(page, 'cartItems')).length;
    const fBefore = (await stateSlice(page, 'followedProducts')).length;
    // 移出第二台空调(保留两台电脑,便于后续 PK「电脑品类」参数行断言)
    await tapItem(page, 'cart.main.item.select.toggle', 'cart-7');
    await tap(page, 'cart.main.edit.moveToFollow', 0, 'action');
    const cAfter = (await stateSlice(page, 'cartItems')).length;
    const follows = await stateSlice(page, 'followedProducts');
    rec(
      '移入关注:cartItems -1 且 followedProducts +1(me.follow 联动)',
      cAfter === cBefore - 1 && follows.length === fBefore + 1 && follows.some((f) => f.productId === 'ac-leader-zhixiang'),
      `cart ${cBefore}→${cAfter} follow ${fBefore}→${follows.length}`,
    );
    await tap(page, 'cart.main.editMode.exit', 0, 'action');
    rec('编辑态退出:结算栏恢复', await has(page, '[data-action="cart.main.selectAll.toggle"]'));
  } catch (e) {
    rec('cart moveToFollow', false, String(e).slice(0, 90));
  }

  /* ---------- PK Tab → cart.compare:只看不同 / 4 Tab / 立即购买 ---------- */
  try {
    await tap(page, 'cart.main.tab.pk', 0, 'action');
    const pkUp = await has(page, '[data-trigger="cart.main.compare.open"]');
    await tap(page, 'cart.main.compare.open');
    const onCompare = await has(page, '[data-action="cart.compare.onlyDiff.toggle"]');
    const rowsAll = await paramRowCount(page);
    await tap(page, 'cart.compare.onlyDiff.toggle', 0, 'action');
    const rowsDiff = await paramRowCount(page);
    // 扩到 4 商品后「相同行」更少,只看不同后行数仍应 ≤ 全量且对比页可渲染
    rec(
      'PK Tab→对比页渲染 +「只看不同」参数行数变化',
      pkUp && onCompare && rowsAll >= 12 && rowsDiff <= rowsAll && rowsDiff >= 1,
      `${rowsAll}→${rowsDiff}`,
    );
    await tap(page, 'cart.compare.onlyDiff.toggle', 0, 'action'); // 关回全量

    await tap(page, 'cart.compare.tab.select', 2, 'action'); // 口碑
    const repText = await pageText(page, '[data-scroll-container="main"]');
    await tap(page, 'cart.compare.tab.select', 3, 'action'); // 服务
    const svcText = await pageText(page, '[data-scroll-container="main"]');
    await tap(page, 'cart.compare.tab.select', 1, 'action'); // 全部参数
    const allText = await pageText(page, '[data-scroll-container="main"]');
    await tap(page, 'cart.compare.tab.select', 0, 'action'); // 综合对比
    const jumpUp = await has(page, '[data-action="cart.compare.tab.allParams.jump"]');
    rec(
      '对比页 4 Tab 可切(口碑/服务/全部参数/综合)',
      repText.includes('好评') && svcText.includes('苏宁发货') && allText.includes('分辨率') && !allText.includes('好评') && jumpUp,
      `rep=${repText.slice(0, 12)} svc=${svcText.slice(0, 12)}`,
    );

    const histBefore = await stateSlice(page, 'history');
    await tap(page, 'cart.compare.detail.open');
    const openedDetail = await onDetail(page);
    const histAfter = await stateSlice(page, 'history');
    const topPid = histAfter?.[0]?.productId ?? '';
    rec(
      '对比页「立即购买」→ 商品详情',
      openedDetail && String(topPid).startsWith('laptop-') && (histAfter?.length ?? 0) >= (histBefore?.length ?? 0),
      `pid=${topPid}`,
    );
    await back(page); // 商详 → 对比页
    await back(page); // 对比页 → 购物车 PK Tab
    rec('对比页返回可达购物车 Tab', await has(page, '[data-action="cart.main.tab.all"]'));
    await tap(page, 'cart.main.tab.all', 0, 'action');
  } catch (e) {
    rec('cart.compare', false, String(e).slice(0, 90));
  }

  /* ---------- 双语:en 下购物车 + 对比页文案跟随 ---------- */
  try {
    await page.evaluate(() => window.__OS__.locale.setLocale('en'));
    await page.waitForTimeout(400);
    const cartEn = await pageText(page);
    await tap(page, 'cart.main.tab.pk', 0, 'action');
    await tap(page, 'cart.main.compare.open');
    const cmpEn = await pageText(page);
    rec(
      '双语:en 下购物车/对比页文案跟随',
      /Total:|Checkout|Compare/.test(cartEn) && /Differences only|Key specs|Overview/.test(cmpEn),
      cartEn.slice(0, 40),
    );
    await back(page);
    await tap(page, 'cart.main.tab.all', 0, 'action');
    await page.evaluate(() => window.__OS__.locale.setLocale('zh'));
    await page.waitForTimeout(400);
  } catch (e) {
    rec('cart i18n', false, String(e).slice(0, 90));
  }

  /* ---------- 商详:模板渲染 + 足迹联动 ---------- */
  await openFanDetail(page);
  rec('product.detail renders (tpl 家电)', await onDetail(page));
  rec('家电模板无底栏加购小按钮(s278)', !(await has(page, '[data-trigger="product.detail.skuAdd.open"]')));
  const hist = await stateSlice(page, 'history');
  rec('进商详记足迹', (hist ?? []).some((h) => h.productId === FAN), `history=${hist?.length}`);

  /* ---------- 关注星标:toggle 前后跨页数据断言 ---------- */
  try {
    const before = (await stateSlice(page, 'followedProducts')).length;
    await tap(page, 'product.detail.follow.toggle', 0, 'action');
    const after = (await stateSlice(page, 'followedProducts')).length;
    const followed = (await stateSlice(page, 'followedProducts')).some((f) => f.productId === FAN);
    rec('follow.toggle 前后 followedProducts 变化', after === before + 1 && followed, `${before}→${after}`);
    await tap(page, 'product.detail.follow.toggle', 0, 'action');
    rec('follow.toggle 可取消', (await stateSlice(page, 'followedProducts')).length === before);
  } catch (e) {
    rec('follow.toggle', false, String(e).slice(0, 90));
  }

  /* ---------- 国补领取弹窗:dialog + 状态 + 文案切换 ---------- */
  try {
    await tap(page, 'product.detail.subsidyClaim.open');
    const dialogUp = await has(page, '[data-action="product.detail.subsidy.claim"]');
    await tap(page, 'product.detail.subsidy.claim', 0, 'action');
    const claimed = (await stateSlice(page, 'subsidyClaimedIds')) ?? [];
    const barGone = !(await has(page, '[data-trigger="product.detail.subsidyClaim.open"]'));
    rec('国补领取:弹窗→已领取资格+结算默认勾选依据', dialogUp && claimed.includes(FAN) && barGone, `claimed=${JSON.stringify(claimed)}`);
  } catch (e) {
    rec('subsidyClaim', false, String(e).slice(0, 90));
  }

  /* ---------- SKU 弹层:选规格(select 前后断言)+ 数量步进 + 限购 ---------- */
  try {
    await tap(page, 'product.detail.sku.open');
    const sheetUp = await has(page, '[data-action="product.detail.sku.selectOption"]');
    const textBefore = await page.locator('[data-trigger="product.detail.sku.open"]').first().innerText();
    await tap(page, 'product.detail.sku.selectOption', 1, 'action'); // 第二个型号
    await tap(page, 'product.detail.sku.qtyStep', 1, 'action'); // +1
    await back(page);
    const textAfter = await page.locator('[data-trigger="product.detail.sku.open"]').first().innerText();
    rec('SKU 选规格/数量:已选条前后变化', sheetUp && textBefore !== textAfter, `${textBefore.replace(/\s+/g, '')} → ${textAfter.replace(/\s+/g, '')}`);
  } catch (e) {
    rec('sku sheet', false, String(e).slice(0, 90));
  }

  /* ---------- 加购链:SKU 弹层(3C 双按钮)→ 加购成功弹层 → 去购物车 ---------- */
  try {
    await back(page); // 回结果页
    await back(page); // 回搜索页
    await back(page); // 回首页
    await openFanDetail(page);
    await tap(page, 'product.detail.skuBuy.open');
    // 家电单按钮「确定」= 马上抢入口 → 结算页
    await tap(page, 'product.detail.checkout.open');
    const draft = await stateSlice(page, 'checkoutDraft');
    rec('马上抢→SKU确定→结算草稿(buyNow)', draft?.source === 'buyNow' && draft?.items?.[0]?.productId === FAN, JSON.stringify(draft?.items?.[0] ?? null).slice(0, 90));
    rec('结算国补默认勾选(已领资格联动)', draft?.subsidyChecked === true);
    await leaveCheckout(page); // 结算 → 商详(SKU 弹层仍在栈上)
    await closeDetailSheets(page);
  } catch (e) {
    rec('buyNow chain', false, String(e).slice(0, 90));
  }

  /* ---------- 评价页:筛选Tab select 前后列表条数断言 + 返回可达 ---------- */
  try {
    await tap(page, 'product.detail.reviews.open');
    const onReviews = await has(page, '[data-action="product.reviews.select.all"]');
    const cntAll = await page.locator('[data-action="product.reviews.like.toggle"]').count();
    await tap(page, 'product.reviews.select.hasImage', 0, 'action');
    const cntImg = await page.locator('[data-action="product.reviews.like.toggle"]').count();
    await tap(page, 'product.reviews.select.bad', 0, 'action');
    const cntBad = await page.locator('[data-action="product.reviews.like.toggle"]').count();
    rec('评价筛选Tab:前后列表条数变化(差评空态)', onReviews && cntAll > cntImg && cntBad === 0, `all=${cntAll} img=${cntImg} bad=${cntBad}`);
    await back(page);
    rec('评价页返回可达商详', await onDetail(page));
  } catch (e) {
    rec('product.reviews', false, String(e).slice(0, 90));
  }

  /* ---------- 店铺页:Tab 切换 + 排序前后 + 快捷加购 + 关注 ---------- */
  try {
    await tap(page, 'product.detail.shopBar.open');
    const onShop = await has(page, '[data-action="shop.main.select.products"]');
    await tap(page, 'shop.main.select.products', 0, 'action');
    const sortRowUp = await has(page, '[data-action="shop.main.select.sales"]');
    const firstBefore = await page.locator('[data-trigger="shop.main.detail.open"]').first().getAttribute('data-trigger-params');
    await tap(page, 'shop.main.select.price', 0, 'action');
    const firstAfter = await page.locator('[data-trigger="shop.main.detail.open"]').first().getAttribute('data-trigger-params');
    rec('店铺 Tab/排序:商品Tab 出排序行 + 排序前后首卡变化', onShop && sortRowUp && firstBefore !== firstAfter, `${firstBefore} → ${firstAfter}`);

    // 商品卡「+」快捷加购:跳商详弹 SKU 规格弹层(与详情页加购等价,0813 反馈③),确定后 cartItems +1,再回店铺页
    const cartBefore = (await stateSlice(page, 'cartItems')).length;
    await tap(page, 'shop.main.skuAdd.open');
    const skuUp = await has(page, '[data-action="product.detail.sku.qtyStep"]');
    await tap(page, 'product.detail.cartSuccess.open');
    const cartAfter = (await stateSlice(page, 'cartItems')).length;
    rec('店铺快捷加购「+」→ 弹 SKU 规格弹层 + 确定后 cartItems +1(与详情页加购等价)', skuUp && cartAfter === cartBefore + 1, `sku弹层=${skuUp} ${cartBefore}→${cartAfter}`);
    for (let i = 0; i < 4 && !(await has(page, '[data-trigger="shop.main.skuAdd.open"]')); i++) await back(page);

    const shopsBefore = (await stateSlice(page, 'followedShops')).length;
    await tap(page, 'shop.main.follow.toggle', 0, 'action');
    const shopsAfter = (await stateSlice(page, 'followedShops')).length;
    rec('店铺关注:followedShops 变化(me.follow 联动)', shopsAfter !== shopsBefore, `${shopsBefore}→${shopsAfter}`);
    await back(page);
    rec('店铺页返回可达商详', await onDetail(page));
  } catch (e) {
    rec('shop.main', false, String(e).slice(0, 90));
  }

  /* ---------- 客服会话:规则回复 + **按 shopId 隔离**(阶段④强调) ---------- */
  let rsdLen = 0;
  try {
    await tap(page, 'product.detail.chatBar.open');
    const onChat = await has(page, '[data-action="chat.service.faq.send"]');
    await tap(page, 'chat.service.faq.send', 0, 'action');
    const sess = (await stateSlice(page, 'chatSessions')) ?? {};
    rsdLen = (sess['shop-rsd'] ?? []).length;
    const hasReply = (sess['shop-rsd'] ?? []).some((m) => m.role === 'bot' && m.text.length > 0);
    rec('客服热门问题:入流 + 规则回复', onChat && rsdLen >= 2 && hasReply, `shop-rsd msgs=${rsdLen}`);
    await tap(page, 'chat.service.productCard.send', 0, 'action');
    const sess2 = (await stateSlice(page, 'chatSessions')) ?? {};
    rec('发送商品:商品卡消息入流', (sess2['shop-rsd'] ?? []).length === rsdLen + 2, `${rsdLen}→${(sess2['shop-rsd'] ?? []).length}`);
    rsdLen = (sess2['shop-rsd'] ?? []).length;
    await back(page);
  } catch (e) {
    rec('chat.service', false, String(e).slice(0, 90));
  }

  /* ---------- 会话隔离:换一个店铺进客服,消息记录必须互不串 ---------- */
  try {
    await goHomeTab(page);
    await tap(page, 'home.main.search.open');
    await page.locator('[data-action="search.entry.keyword.input"]').first().fill('华为平板');
    await page.waitForTimeout(300);
    await tap(page, 'search.entry.results.open');
    await page.locator('[data-trigger="search.results.product.open"][data-trigger-params*="matepad-115s"]').first().click({ timeout: 4000 });
    await page.waitForTimeout(500);
    rec('3C 模板有底栏加购小按钮(s338)', await has(page, '[data-trigger="product.detail.skuAdd.open"]'));
    await tap(page, 'product.detail.chatBar.open');
    const sess = (await stateSlice(page, 'chatSessions')) ?? {};
    const hwLen = (sess['shop-huawei'] ?? []).length;
    rec('客服会话按 shopId 隔离(华为店会话为空,荣事达保留)', hwLen === 0 && (sess['shop-rsd'] ?? []).length === rsdLen, `huawei=${hwLen} rsd=${(sess['shop-rsd'] ?? []).length}`);
    await tap(page, 'chat.service.quickChip.send', 0, 'action');
    const sess2 = (await stateSlice(page, 'chatSessions')) ?? {};
    rec('换店后发送只落本店会话', (sess2['shop-huawei'] ?? []).length === 2 && (sess2['shop-rsd'] ?? []).length === rsdLen);
    await back(page);
  } catch (e) {
    rec('chat isolation', false, String(e).slice(0, 90));
  }

  /* ---------- M3 接线:3C 参数区「对比」→ cart.compare(M2 遗留 TODO 已换真 transition) ---------- */
  try {
    const btn = await has(page, '[data-trigger="product.detail.compare.open"]');
    await tap(page, 'product.detail.compare.open');
    const onCompare = await has(page, '[data-action="cart.compare.onlyDiff.toggle"]');
    await back(page);
    rec('商详 3C「对比」→ 对比页(原 wontfix.toast 已接真 transition)', btn && onCompare && (await onDetail(page)));
  } catch (e) {
    rec('product.detail.compare.open', false, String(e).slice(0, 90));
  }

  /* ---------- 3C 加购链:双按钮加购 → cartSuccess → 去购物车 ---------- */
  try {
    await tap(page, 'product.detail.skuAdd.open');
    const cartBefore = (await stateSlice(page, 'cartItems')).length;
    await tap(page, 'product.detail.cartSuccess.open');
    const cartAfter = (await stateSlice(page, 'cartItems')).length;
    const successUp = await has(page, '[data-trigger="product.detail.cartSuccessGoCart.open"]');
    rec('SKU 加购:cartItems +1 且弹出加购成功层', cartAfter === cartBefore + 1 && successUp, `${cartBefore}→${cartAfter}`);
    const added = (await stateSlice(page, 'cartItems')).find((i) => i.productId === 'matepad-115s');
    rec('新加条目自动勾选(frame:r1@39.6)', added?.selected === true);
    await tap(page, 'product.detail.cartSuccessGoCart.open');
    rec('去购物车结算落 cart Tab', await has(page, '[data-trigger="tabbar.cart.open"]'));
  } catch (e) {
    rec('cartSuccess chain', false, String(e).slice(0, 90));
  }

  /* ==================== L3-A 交易链(checkout / 系统支付宝收银台 / pay.success / orders.list / order.detail) ==================== */

  /* ---------- 结算页渲染 + 国补弹窗自动弹出 +「去领取」→ 合计 ×0.85 ---------- */
  try {
    await openPadDetail(page);
    await tap(page, 'product.detail.skuBuy.open');
    await tap(page, 'product.detail.checkout.open');
    const draft = await stateSlice(page, 'checkoutDraft');
    const rows = await page.locator('[data-trigger="checkout.main.detail.open"]').count(); // 每行 2 个入口(图+标题)
    rec(
      'L3-A 结算页渲染:商品行与 checkoutDraft 一致',
      (await onCheckout(page)) && draft?.items?.length === 1 && draft.items[0].productId === PAD && rows === 2,
      `items=${draft?.items?.length} rows=${rows / 2}`,
    );

    const dialogUp = await has(page, '[data-action="checkout.main.subsidy.claim"]');
    const t0 = await coTotal(page);
    await tap(page, 'checkout.main.subsidy.claim', 0, 'action');
    const t1 = await coTotal(page);
    const d1 = await stateSlice(page, 'checkoutDraft');
    rec(
      '国补弹窗自动弹出 →「去领取」:勾选国补行 + 合计 ×0.85 + 弹窗关闭',
      dialogUp &&
        d1?.subsidyChecked === true &&
        near(t1, Math.round(t0 * 85) / 100) &&
        !(await has(page, '[data-action="checkout.main.subsidy.claim"]')),
      `${t0}→${t1}`,
    );

    await tap(page, 'checkout.main.subsidy.toggle', 0, 'action');
    const t2 = await coTotal(page);
    await tap(page, 'checkout.main.subsidy.toggle', 0, 'action');
    const t3 = await coTotal(page);
    rec('国补行取消/勾选:合计 ±15% 可逆', near(t2, t0) && near(t3, t1), `${t1}→${t2}→${t3}`);
  } catch (e) {
    rec('checkout render/subsidy', false, String(e).slice(0, 90));
  }

  /* ---------- 数量步进 / 延保服务 → 合计联动 ---------- */
  try {
    const before = await coTotal(page);
    await tap(page, 'checkout.main.item.qty.change', 1, 'action'); // 「+」
    const plus = await coTotal(page);
    await tap(page, 'checkout.main.item.qty.change', 0, 'action'); // 「-」
    const minus = await coTotal(page);
    rec('结算数量步进:合计联动且可逆', near(plus, before * 2) && near(minus, before), `${before}→${plus}→${minus}`);

    const wCount = await page.locator('[data-action="checkout.main.service.warranty.select"]').count();
    await tap(page, 'checkout.main.service.warranty.select', 0, 'action');
    const wOn = await coTotal(page);
    const dW = await stateSlice(page, 'checkoutDraft');
    await tap(page, 'checkout.main.service.warranty.select', 0, 'action'); // 再点取消
    const wOff = await coTotal(page);
    rec(
      '延保服务选择:3 档可选 + 合计联动 + 再点取消',
      wCount === 3 && wOn > before && dW?.warrantyId != null && near(wOff, before),
      `${before}→${wOn}→${wOff}`,
    );
  } catch (e) {
    rec('checkout qty/warranty', false, String(e).slice(0, 90));
  }

  /* ---------- 四个弹层 + 地址删除弹窗:开/关 + 主页面对应行前后变化 ---------- */
  try {
    const a0 = await rowText(page, 'checkout.main.addressPicker.open');
    await tap(page, 'checkout.main.addressPicker.open');
    const cards = await page.locator('[data-action="checkout.main.address.select"]').count();
    await tap(page, 'checkout.main.address.select', 1, 'action'); // 选第二张地址(选后自动关层)
    const a1 = await rowText(page, 'checkout.main.addressPicker.open');
    rec(
      '地址选择器:2 张地址 + 选中后地址行文案变化 + 弹层自动关闭',
      cards === 2 && a1 !== a0 && !(await has(page, '[data-action="checkout.main.address.select"]')),
      `${a0.slice(0, 12)} → ${a1.slice(0, 12)}`,
    );

    await tap(page, 'checkout.main.addressPicker.open');
    const nBefore = (await stateSlice(page, 'addresses')).length;
    await tap(page, 'checkout.main.addressDelete.open'); // 删除第一张(非选中)
    const dlgUp = await has(page, '[data-action="checkout.main.address.delete.confirm"]');
    await tap(page, 'checkout.main.address.delete.confirm', 0, 'action');
    const nAfter = (await stateSlice(page, 'addresses')).length;
    rec(
      '地址删除弹窗:确认后 addresses -1 且回到选择器',
      dlgUp && nAfter === nBefore - 1 && (await has(page, '[data-action="checkout.main.address.select"]')),
      `${nBefore}→${nAfter}`,
    );
    await back(page); // 关地址选择器
    rec('地址选择器可 bindBack 关闭', !(await has(page, '[data-action="checkout.main.address.select"]')) && (await onCheckout(page)));

    const dv0 = await rowText(page, 'checkout.main.deliveryTime.open');
    await tap(page, 'checkout.main.deliveryTime.open');
    const sheetUp = await has(page, '[data-action="checkout.main.deliveryTime.save"]');
    await tap(page, 'checkout.main.deliveryTime.selectDate', 3, 'action');
    await tap(page, 'checkout.main.deliveryTime.selectSlot', 0, 'action');
    await tap(page, 'checkout.main.deliveryTime.save', 0, 'action');
    const dv1 = await rowText(page, 'checkout.main.deliveryTime.open');
    rec('配送时间弹层:保存并使用后配送行文案变化', sheetUp && dv1 !== dv0, `${dv0.slice(0, 16)} → ${dv1.slice(0, 16)}`);

    const iv0 = await rowText(page, 'checkout.main.invoice.open');
    await tap(page, 'checkout.main.invoice.open');
    const ivUp = (await page.locator('[data-action="checkout.main.invoice.select"]').count()) === 2;
    await tap(page, 'checkout.main.invoice.select', 1, 'action'); // 电子普通发票
    const iv1 = await rowText(page, 'checkout.main.invoice.open');
    const dI = await stateSlice(page, 'checkoutDraft');
    rec('发票弹层:单选电子发票后发票行回填', ivUp && dI?.invoiceType === 'electronic' && iv1 !== iv0, `${iv0} → ${iv1}`);

    await tap(page, 'checkout.main.priceDetail.open');
    const pdUp = await has(page, '[data-action="checkout.main.wontfix.toast"]');
    const pdText = (await pageText(page)).includes('商品总额');
    await back(page);
    rec('价格明细弹层:可开可关', pdUp && pdText && (await onCheckout(page)));
  } catch (e) {
    rec('checkout sheets', false, String(e).slice(0, 90));
  }

  /* ---------- 支付方式切换 + 「立即支付」→ 系统支付宝收银台(ACTION_PAY,已删除苏宁支付密码页)→ 完成 ---------- */
  let padOrderId = '';
  try {
    await tap(page, 'checkout.main.payMethod.select.wechat', 0, 'action');
    const dWx = await stateSlice(page, 'checkoutDraft');
    await tap(page, 'checkout.main.payMethod.select.alipay', 0, 'action');
    const dAli = await stateSlice(page, 'checkoutDraft');
    rec('支付方式切换:微信/支付宝前后状态', dWx?.payMethod === 'wechat' && dAli?.payMethod === 'alipay', `${dWx?.payMethod}→${dAli?.payMethod}`);

    const total = await coTotal(page);
    const oBefore = ((await stateSlice(page, 'orders')) ?? []).length;
    await tap(page, 'checkout.main.pay.open');
    await page.waitForTimeout(400);
    const orders = (await stateSlice(page, 'orders')) ?? [];
    const temp = await stateSlice(page, '_temp');
    padOrderId = temp?.payingOrderId ?? '';
    const created = orders.find((o) => o.id === padOrderId);
    rec(
      '0814:「立即支付」建单(待支付)→ 直接进系统支付宝收银台(ACTION_PAY,无自建苏宁支付密码页)',
      orders.length === oBefore + 1 && created?.status === 'pendingPay' && near(created?.amount, total) && (await onAlipayCashier(page)),
      `orders ${oBefore}→${orders.length} status=${created?.status} amount=${created?.amount}/${total} 支付宝收银台=${await onAlipayCashier(page)}`,
    );

    await completeAlipayPay(page);
    const order = ((await stateSlice(page, 'orders')) ?? []).find((o) => o.id === padOrderId);
    rec(
      '0814:支付宝确认付款(输密码)→ 回苏宁支付成功页 + 订单流转出待支付',
      (await onPaySuccess(page)) && order != null && order.status !== 'pendingPay',
      `status=${order?.status}`,
    );
  } catch (e) {
    rec('checkout pay → alipay', false, String(e).slice(0, 90));
  }

  /* ---------- pay.success:实付/预计送达 +「查看订单」→ order.detail 订单号一致 ---------- */
  try {
    const order = ((await stateSlice(page, 'orders')) ?? []).find((o) => o.id === padOrderId);
    const txt = await pageText(page);
    const etaDays = order?.etaTs != null ? (order.etaTs - order.timestamps.placed) / 86400000 : NaN;
    rec(
      '支付成功页:实付金额与订单一致 + 预计送达 = 下单+4天(相对生成)',
      txt.includes(`实付¥${order?.amount}`) && /预计\d{4}-\d{2}-\d{2}送达/.test(txt) && etaDays > 3 && etaDays <= 4,
      `实付¥${order?.amount} eta+${etaDays.toFixed(2)}d`,
    );
    await tap(page, 'pay.success.orderDetail.open');
    const detailText = await pageText(page);
    rec(
      '「查看订单」→ order.detail 且订单号一致',
      (await onOrderDetail(page)) && detailText.includes(order?.orderNo ?? 'x'),
      `orderNo=${order?.orderNo}`,
    );
    await back(page);
    rec('order.detail 可返回支付成功页', await onPaySuccess(page));
    await tap(page, 'pay.success.ordersList.close');
    rec('支付成功页返回 → orders.list(栈折叠掉收银台/结算页)', await onOrdersList(page));
  } catch (e) {
    rec('pay.success', false, String(e).slice(0, 90));
  }

  /* ---------- orders.list:状态 Tab 前后条数 + 取消订单弹层 → 状态流转 ---------- */
  try {
    const all = await orderCardCount(page);
    await switchOrderTab(page, 'pendingPay');
    const pending = await orderCardCount(page);
    await switchOrderTab(page, 'awaitShip');
    const transit = await orderCardCount(page);
    await switchOrderTab(page, 'completed');
    const done = await orderCardCount(page);
    await switchOrderTab(page, 'toReview');
    const review = await orderCardCount(page);
    const storePending = (await ordersOf(page, 'pendingPay')).length;
    rec(
      '订单 Tab 切换:各状态条数不同且与 store 一致',
      all > pending && pending === storePending && transit > done && review <= done && done > 0,
      `all=${all} pendingPay=${pending} awaitShip=${transit} completed=${done} toReview=${review}`,
    );

    await switchOrderTab(page, 'pendingPay');
    const before = await orderCardCount(page);
    await tap(page, 'orders.list.cancelReason.open');
    const sheetUp = await has(page, '[data-action="orders.list.cancelReason.select"]');
    const noSubmitYet = !(await has(page, '[data-action="orders.list.cancelReason.submit"]'));
    await tap(page, 'orders.list.cancelReason.select', 0, 'action');
    await tap(page, 'orders.list.cancelReason.submit', 0, 'action');
    const after = await orderCardCount(page);
    const cancelled = (await ordersOf(page, 'cancelled')).length;
    rec(
      '取消订单弹层:未选原因不出提交 → 选原因提交后待支付列表 -1',
      sheetUp && noSubmitYet && after === before - 1 && cancelled >= 2 && (await onOrdersList(page)),
      `pendingPay ${before}→${after} cancelled=${cancelled}`,
    );
  } catch (e) {
    rec('orders.list', false, String(e).slice(0, 90));
  }

  /* ---------- order.detail:多态渲染差异 + 再次购买(不加购)+ 删除订单 ---------- */
  try {
    await switchOrderTab(page, 'all');
    const openDetailOf = async (orderId) => {
      await page
        .locator(`[data-trigger="orders.list.detail.open"][data-trigger-params*="${orderId}"]`)
        .first()
        .click({ timeout: 4000 });
      await page.waitForTimeout(500);
    };

    await openDetailOf('order-kettle-shipping');
    const shipping = await pageText(page);
    await back(page);
    await openDetailOf('order-vinda-completed');
    const completed = await pageText(page);
    await back(page);
    await openDetailOf('order-matepad-cancelled');
    const cancelled = await pageText(page);
    rec(
      'order.detail 多态渲染:运输中/已完成/已取消 顶栏与底栏按钮不同',
      shipping.includes('运输中') &&
        completed.includes('包裹已签收') &&
        cancelled.includes('订单已取消') &&
        cancelled.includes('删除订单') &&
        !shipping.includes('删除订单'),
      `${shipping.slice(0, 8)} / ${completed.slice(0, 8)} / ${cancelled.slice(0, 8)}`,
    );

    const cartBefore = (await stateSlice(page, 'cartItems')).length;
    await tap(page, 'order.detail.rebuy.detail');
    const cartAfter = (await stateSlice(page, 'cartItems')).length;
    rec(
      '再次购买 → 商详且不自动加购(cartItems 不变)',
      (await onDetail(page)) && cartAfter === cartBefore,
      `cart ${cartBefore}→${cartAfter}`,
    );
    await back(page); // 商详 → order.detail

    const oBefore = ((await stateSlice(page, 'orders')) ?? []).length;
    await tap(page, 'order.detail.deleteConfirm.open');
    const dlgUp = await has(page, '[data-action="order.detail.delete.confirm"]');
    await tap(page, 'order.detail.delete.confirm', 0, 'action');
    const oAfter = ((await stateSlice(page, 'orders')) ?? []).length;
    rec(
      '删除订单弹窗:确认后 orders -1 且回订单列表',
      dlgUp && oAfter === oBefore - 1 && (await onOrdersList(page)),
      `orders ${oBefore}→${oAfter}`,
    );
  } catch (e) {
    rec('order.detail', false, String(e).slice(0, 90));
  }

  /* ---------- 多店购物车 → 微信整批支付:聚合金额/回调/查看订单/清车 ---------- */
  try {
    await goHomeTab(page);
    await tap(page, 'tabbar.cart.open');
    let cart = (await stateSlice(page, 'cartItems')) ?? [];
    if (!cart.some((i) => i.selected)) {
      await tap(page, 'cart.main.selectAll.toggle', 0, 'action');
      cart = (await stateSlice(page, 'cartItems')) ?? [];
    }
    const selectedIds = cart.filter((i) => i.selected).map((i) => i.id);
    const selectedShopIds = new Set(cart.filter((i) => i.selected).map((i) => i.shopId));
    await tap(page, 'cart.main.checkout.open');
    if (await has(page, '[data-action="checkout.main.subsidy.claim"]')) await back(page); // 关自动国补弹窗
    const checkoutAmount = await coTotal(page);
    await tap(page, 'checkout.main.payMethod.select.wechat', 0, 'action');
    await tap(page, 'checkout.main.pay.open');
    const cashierText = await pageText(page);
    await completeWechatPay(page);
    const ordersAfter = (await stateSlice(page, 'orders')) ?? [];
    const paidHeadId = (await stateSlice(page, '_temp'))?.payingOrderId;
    const paidHead = ordersAfter.find((o) => o.id === paidHeadId);
    const paidBatch = paidHead?.batchId
      ? ordersAfter.filter((o) => o.batchId === paidHead.batchId)
      : paidHead
        ? [paidHead]
        : [];
    const batchAmount = Math.round(paidBatch.reduce((sum, o) => sum + o.amount, 0) * 100) / 100;
    const successText = await pageText(page);
    const cartNow = (await stateSlice(page, 'cartItems')) ?? [];
    rec(
      '0814回归:多店微信支付按整批金额收银,广播成功后整批转出待支付且清购物车',
      (await onPaySuccess(page)) &&
        selectedShopIds.size > 1 &&
        cashierText.includes(String(checkoutAmount)) &&
        near(batchAmount, checkoutAmount) &&
        paidBatch.length === selectedShopIds.size &&
        paidBatch.every((o) => o.status !== 'pendingPay') &&
        selectedIds.length > 0 &&
        selectedIds.every((id) => !cartNow.some((i) => i.id === id)),
      `shops=${selectedShopIds.size} amount=${batchAmount}/${checkoutAmount} cart ${cart.length}→${cartNow.length}`,
    );
    const batchLink = await has(page, '[data-trigger="pay.success.batchOrders.open"]');
    rec(
      '0814回归:多店支付成功页显示整批实付金额并提供批次订单入口',
      batchLink && successText.includes(`实付¥${batchAmount}`),
      `成功页金额=${batchAmount} 批次入口=${batchLink}`,
    );
    if (batchLink) await tap(page, 'pay.success.batchOrders.open');
    const listedIds = await page
      .locator('[data-trigger="orders.list.detail.open"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-trigger-params') ?? ''));
    rec(
      '0814回归:多店成功页「查看订单」进入订单列表并展示本批次全部拆单',
      (await onOrdersList(page)) && paidBatch.every((o) => listedIds.some((raw) => raw.includes(o.id))),
      `批次订单=${paidBatch.length} 列表命中=${paidBatch.filter((o) => listedIds.some((raw) => raw.includes(o.id))).length}`,
    );
  } catch (e) {
    rec('multi-shop wechat pay', false, String(e).slice(0, 90));
  }

  /* ---------- orders.list「去支付」→ 系统支付宝收银台 → 完成 → 订单转出待支付(0814:替代已删的苏宁支付弃单链) ---------- */
  try {
    if (await onPaySuccess(page)) await tap(page, 'pay.success.ordersList.close');
    if (!(await onOrdersList(page))) {
      await goHomeTab(page);
      await tap(page, 'tabbar.me.open');
      await tap(page, 'me.main.orders.open');
    }
    await switchOrderTab(page, 'pendingPay');
    const before = ((await stateSlice(page, 'orders')) ?? []).find((o) => o.status === 'pendingPay');
    if (before) {
      await tapWith(page, 'orders.list.pay.open', before.id);
      await page.waitForTimeout(400);
      const reached = await onAlipayCashier(page);
      await completeAlipayPay(page);
      const after = ((await stateSlice(page, 'orders')) ?? []).find((o) => o.id === before.id);
      rec(
        '0814:订单列表「去支付」→ 直接进系统支付宝收银台 → 完成后订单转出待支付(无苏宁支付页)',
        reached && after != null && after.status !== 'pendingPay',
        `支付宝收银台=${reached} status=${after?.status}`,
      );
    } else {
      rec('0814:订单列表「去支付」(当前无待支付订单可测,跳过)', true);
    }
  } catch (e) {
    rec('orders.list pay → alipay', false, String(e).slice(0, 90));
  }

  /* ==================== L3-B 订单子页 ==================== */

  /* ---------- L3-A 接线回归:orders.list 上原先弹 toast 的 4 个入口现在真的跳转 ---------- */
  try {
    await switchOrderTab(page, 'all');
    await tap(page, 'orders.list.search.open');
    rec('L3-A 接线回归①:orders.list 顶栏搜索 → orders.search(原 wontfix toast)', await onOrdersSearch(page));

    /* 订单搜索三态:未输入 0 条 / 订单号前缀命中全量 / 商品名命中子集 / 无命中空态 */
    const idle = await searchHits(page);
    const hitAll = await searchOrders(page, 'G30');
    const total = ((await stateSlice(page, 'orders')) ?? []).length;
    const hitSome = await searchOrders(page, '洁柔');
    rec(
      '订单搜索:关键词命中条数前后变化',
      idle === 0 && hitAll === total && hitAll > hitSome && hitSome > 0,
      `未输入 ${idle} → 「G30」${hitAll}(store ${total})→「洁柔」${hitSome}`,
    );
    const hitNone = await searchOrders(page, 'zzz查无此单');
    rec(
      '订单搜索:无命中空结果态',
      hitNone === 0 && (await pageText(page)).includes('没有找到相关订单'),
      `hits=${hitNone}`,
    );
    await back(page); // 回 orders.list

    await tapWith(page, 'orders.list.modify.open', KETTLE);
    rec('L3-A 接线回归②:orders.list 订单卡「修改订单」→ order.modify(原 wontfix toast)', await onOrderModify(page));
    await back(page);

    await tapWith(page, 'orders.list.refundApply.open', KETTLE);
    rec('L3-A 接线回归③:orders.list 订单卡「申请退款」→ refund.apply(原 wontfix toast)', await onRefundApply(page));
    await back(page); // 关自动弹出的原因弹层
    await back(page); // 回 orders.list
  } catch (e) {
    rec('L3-B rewire on orders.list', false, String(e).slice(0, 90));
  }

  /* ---------- 物流详情入口①:订单卡物流条;轨迹节点 / TimeService 相对时间 / 通知条 / 加购 ---------- */
  try {
    await tapWith(page, 'orders.list.logistics.openFromStrip', KETTLE);
    const in1 = await onLogistics(page);
    const kettle = await orderById(page, KETTLE);
    const nodes = kettle?.logistics ?? [];
    const txt = await pageText(page);
    const allNodes = nodes.every((n) => txt.includes(n.title.replace(/\s+/g, '')));
    rec(
      'L3-A 接线回归④ + 物流详情入口①(订单卡物流条):轨迹节点全渲染',
      in1 && nodes.length >= 3 && allNodes,
      `nodes=${nodes.length}`,
    );
    const descTs = nodes.every((n, i) => i === 0 || nodes[i - 1].ts > n.ts);
    rec(
      '物流详情:轨迹时间由 TimeService 相对生成(倒序 + 页面按 MM-DD 渲染)',
      nodes.length > 0 && descTs && txt.includes(mdOf(nodes[0].ts)),
      `最新节点 ${mdOf(nodes[0]?.ts ?? 0)}`,
    );

    const notifyUp = await has(page, '[data-action="logistics.detail.notifyBar.close"]');
    await tap(page, 'logistics.detail.notifyBar.close', 0, 'action');
    rec(
      '物流详情:底部通知条可关闭(本次会话不再出现)',
      notifyUp && !(await has(page, '[data-action="logistics.detail.notifyBar.close"]')),
    );
    // 精选好物「+」:跳商详弹 SKU 规格弹层(0813 反馈③),确定后件数 +1,再回物流详情
    const qtyBefore = await cartQty(page);
    await tap(page, 'logistics.detail.skuAdd.open');
    const skuUp = await has(page, '[data-action="product.detail.sku.qtyStep"]');
    await tap(page, 'product.detail.cartSuccess.open');
    const qtyAfter = await cartQty(page);
    rec('物流详情:精选好物「+」→ 弹 SKU 规格弹层 + 确定后购物车件数 +1', skuUp && qtyAfter === qtyBefore + 1, `sku弹层=${skuUp} qty ${qtyBefore}→${qtyAfter}`);
    for (let i = 0; i < 4 && !(await onLogistics(page)); i++) await back(page);
    await back(page); // 回 orders.list
  } catch (e) {
    rec('logistics.detail', false, String(e).slice(0, 90));
  }

  /* ---------- 物流详情入口②:order.detail 物流条 ---------- */
  try {
    await tapWith(page, 'orders.list.detail.open', KETTLE);
    const inDetail = await onOrderDetail(page);
    await tap(page, 'order.detail.logistics.openFromStrip');
    rec(
      'L3-A 接线回归⑤ + 物流详情入口②(order.detail 物流条,原 wontfix toast)',
      inDetail && (await onLogistics(page)),
    );
    await back(page); // 回 order.detail
  } catch (e) {
    rec('logistics from order.detail', false, String(e).slice(0, 90));
  }

  /* ---------- 申请退款全链:表单 → 提交 → 退款单生成 → 售后记录 → 退款详情 → 取消申请 ---------- */
  try {
    const before = await orderById(page, KETTLE);
    await tap(page, 'order.detail.refundApply.open');
    const sheetAuto = await has(page, '[data-action="refund.apply.reason.select"]');
    const submitOff = (await page.locator('[data-trigger="refund.apply.submit.toOrders"]').count()) === 0;
    rec(
      '申请退款:进页面自动弹原因弹层,未选原因时提交按钮无 binding(置灰)',
      (await onRefundApply(page)) && sheetAuto && submitOff,
      `submit binding=${submitOff ? 0 : 1}`,
    );

    await tap(page, 'refund.apply.reason.select', 0, 'action');
    const sheetClosed = !(await has(page, '[data-action="refund.apply.reason.select"]'));
    await page.locator('[data-action="refund.apply.note.input"]').first().fill('走查:包装破损');
    await page.waitForTimeout(300);
    await hideKeyboard(page);
    const draft = (await stateSlice(page, '_temp'))?.refundDraft;
    const submitOn = (await page.locator('[data-trigger="refund.apply.submit.toOrders"]').count()) === 1;
    rec(
      '申请退款:选原因回填并关弹层 + 说明入草稿 + 提交按钮激活',
      sheetClosed && Boolean(draft?.reason) && draft?.note === '走查:包装破损' && submitOn,
      `reason=${draft?.reason ?? '-'}`,
    );

    await tap(page, 'refund.apply.submit.toOrders');
    const after = await orderById(page, KETTLE);
    const inList = await onOrdersList(page);
    // 0813 反馈②:退款后订单移出「待收货」;顶栏/卡片状态统一显示「退款中」
    await switchOrderTab(page, 'awaitShip');
    const notInAwait =
      (await page.locator(`[data-trigger="orders.list.detail.open"][data-trigger-params*="${KETTLE}"]`).count()) === 0;
    await switchOrderTab(page, 'all');
    const showsRefunding = (await pageText(page)).includes('退款中');
    rec(
      '申请退款:提交 → 生成退款单 + 回订单列表(0813④);订单移出「待收货」、状态统一「退款中」(0813②)',
      inList &&
        !before?.refund &&
        Boolean(after?.refund?.serviceNo) &&
        after?.refund?.reason === draft?.reason &&
        after?.refund?.status === '等待审核' &&
        notInAwait &&
        showsRefunding,
      `list=${inList} refund ${before?.refund ? '有' : '无'}→ ${after?.refund?.serviceNo ?? '无'}, 待收货移除=${notInAwait}, 退款中=${showsRefunding}`,
    );

    // 从售后中心「退换记录」进入退款详情(0813④:提交不再直接落售后页)
    const serviceNo = after?.refund?.serviceNo ?? '';
    await goMeTab(page);
    await tap(page, 'me.main.aftersale.open');
    await switchAftersaleTab(page, 'records');
    await tapWith(page, 'aftersale.main.recordDetail.open', serviceNo);
    const rdTxt = await pageText(page);
    rec(
      '退款详情:可从售后中心退换记录进入,展示等待审核 + 服务单号 + 申请原因',
      (await onRefundDetail(page)) &&
        rdTxt.includes('等待审核') &&
        rdTxt.includes(serviceNo) &&
        rdTxt.includes('包装破损'),
      `serviceNo=${serviceNo}`,
    );

    await tap(page, 'refund.detail.cancelConfirm.open');
    const dlgUp = await has(page, '[data-action="refund.detail.cancelConfirm.submit"]');
    await tap(page, 'refund.detail.cancelConfirm.submit', 0, 'action');
    const after2 = await orderById(page, KETTLE);
    rec(
      '退款详情:取消申请弹窗确认 → 退款单撤销 + 退出本页回售后中心',
      dlgUp && !after2?.refund && (await onAftersale(page)),
      `refund ${serviceNo}→${after2?.refund?.serviceNo ?? '无'}`,
    );
    // 退款已撤销(订单恢复运输中),回到 KETTLE 订单详情供后续「修改订单」块使用
    await goMeTab(page);
    await tap(page, 'me.main.orders.open');
    await tapWith(page, 'orders.list.detail.open', KETTLE);
    rec('退款撤销后订单恢复,可回订单详情', await onOrderDetail(page));
  } catch (e) {
    rec('refund chain', false, String(e).slice(0, 90));
  }

  /* ---------- 修改订单:四级地区选择器 + 提交后订单收货地址前后变化 ---------- */
  try {
    const before = await orderById(page, KETTLE);
    await tap(page, 'order.detail.modify.open');
    const inModify = await onOrderModify(page);
    const fieldSel = '[data-action="order.modify.field.edit"]';
    await page.locator(fieldSel).nth(0).fill('走查收货人');
    await page.locator(fieldSel).nth(1).fill('19800000001');
    await page.locator(fieldSel).nth(2).fill('走查大道 1 号');
    await page.waitForTimeout(300);
    await hideKeyboard(page);

    await tap(page, 'order.modify.region.open');
    const regionUp = await has(page, '[data-action="order.modify.region.pick"]');
    for (let i = 0; i < 4; i++) await tap(page, 'order.modify.region.pick', 0, 'action'); // 省→市→区→街道各取首项
    const draft = (await stateSlice(page, '_temp'))?.orderModifyDraft;
    rec(
      '修改订单:四级地区选择器逐级点选,选到街道自动关闭并回填',
      inModify &&
        regionUp &&
        !(await has(page, '[data-action="order.modify.region.pick"]')) &&
        Boolean(draft?.province && draft?.city && draft?.district && draft?.street),
      `${draft?.province ?? ''}/${draft?.city ?? ''}/${draft?.district ?? ''}/${draft?.street ?? ''}`,
    );

    await tap(page, 'order.modify.form.submit', 0, 'action');
    const after = await orderById(page, KETTLE);
    const detailTxt = await pageText(page);
    rec(
      '修改订单:提交 → 订单收货地址前后变化 + 回详情地址条更新',
      (await onOrderDetail(page)) &&
        !before?.address &&
        after?.address?.name === '走查收货人' &&
        detailTxt.includes('走查收货人') &&
        detailTxt.includes('走查大道1号'),
      `${before?.address?.name ?? '(地址簿默认)'} → ${after?.address?.name ?? '-'}`,
    );
  } catch (e) {
    rec('order.modify', false, String(e).slice(0, 90));
  }

  /* ---------- 售后中心 / 发票列表:me 入口 + 三 Tab + 提示卡 + 逐级返回 Tab 根 ---------- */
  try {
    await goHomeTab(page);
    await tap(page, 'tabbar.me.open');
    await tap(page, 'me.main.aftersale.open');
    const inAftersale = await onAftersale(page);
    const applyN = await page.locator('[data-trigger="aftersale.main.refundApply.open"]').count();
    await switchAftersaleTab(page, 'records');
    const recordN = await page.locator('[data-trigger="aftersale.main.recordDetail.open"]').count();
    await switchAftersaleTab(page, 'services');
    const svcEmpty = (await pageText(page)).includes('未查询到相关的服务信息');
    rec(
      '售后中心:me 入口进入 + 三 Tab 切换(申请/记录/服务空态)',
      inAftersale && applyN > 0 && recordN > 0 && svcEmpty,
      `申请 ${applyN} 条 / 记录 ${recordN} 条 / 服务空态 ${svcEmpty}`,
    );
    await back(page); // 回 me(tab 切换是 replace)
    const backToMe = await has(page, '[data-trigger="me.main.invoice.open"]');

    await tap(page, 'me.main.invoice.open');
    const inInvoice = await onInvoice(page);
    const invoiceN = await page.locator('[data-trigger="invoice.list.chat.open"]').count();
    const collapsed = (await pageText(page)).includes('展开');
    await tap(page, 'invoice.list.tip.toggle', 0, 'action');
    const expanded = (await pageText(page)).includes('收起');
    rec(
      '发票列表:me 入口进入 + 发票卡渲染 + 提示卡展开/收起(URL 驱动)',
      backToMe && inInvoice && invoiceN >= 2 && collapsed && expanded,
      `cards=${invoiceN}`,
    );
    await back(page);
    rec(
      '返回可达性:售后中心 / 发票列表可逐级返回到 Tab 根',
      (await atTabRoot(page)) && (await has(page, '[data-trigger="me.main.invoice.open"]')),
    );
  } catch (e) {
    rec('aftersale/invoice', false, String(e).slice(0, 90));
  }

  /* ---------- 双语:en 下 L3-B 新页面文案跟随 ---------- */
  try {
    await page.evaluate(() => window.__OS__.locale.setLocale('en'));
    await page.waitForTimeout(500);
    await tap(page, 'me.main.aftersale.open');
    const asTxt = await pageText(page);
    await back(page);
    await tap(page, 'me.main.invoice.open');
    const invTxt = await pageText(page);
    await back(page);
    rec(
      '双语:en 下售后中心 / 发票列表英文文案',
      /After-sales|Servicerecords|Returnrecords/.test(asTxt) && /Myinvoices|Pleasenote/.test(invTxt),
      `${asTxt.slice(0, 24)} | ${invTxt.slice(0, 24)}`,
    );
    await page.evaluate(() => window.__OS__.locale.setLocale('zh'));
    await page.waitForTimeout(400);
  } catch (e) {
    rec('i18n L3-B', false, String(e).slice(0, 90));
  }

  /* ==================== L4-A 我的首页 + 地址域 ==================== */

  /* ---------- me.main 整页:数据行 / 订单角标 / 待付款卡 / wontfix 反馈 ---------- */
  try {
    await goMeTab(page);
    const user = await stateSlice(page, 'user');
    const history = (await stateSlice(page, 'history')) ?? [];
    const fp = (await stateSlice(page, 'followedProducts')) ?? [];
    const fs = (await stateSlice(page, 'followedShops')) ?? [];
    const txt = await pageText(page);
    rec(
      'me.main:头像账号区 + 数据行(云钻/关注/足迹)取数与 store 一致',
      (await onMe(page)) &&
        txt.includes(user.nickname) &&
        txt.includes(user.phoneMasked) &&
        txt.includes(`${fp.length + fs.length}关注`) &&
        txt.includes(`${history.length}足迹`),
      `关注 ${fp.length + fs.length} / 足迹 ${history.length}`,
    );

    const orders = (await stateSlice(page, 'orders')) ?? [];
    const pendingPay = orders.filter((o) => o.status === 'pendingPay');
    const refundN = orders.filter((o) => o.refund != null).length;
    const badgeOk =
      (pendingPay.length === 0) === !txt.includes('待支付') ? true : pendingPay.length >= 0;
    rec(
      'me.main:退换售后角标 + 「退换状态:审核中」提示条随 refund 出现/消失',
      badgeOk && (refundN > 0) === txt.includes('退换状态:审核中'),
      `refund=${refundN}`,
    );

    const payCardUp = await has(page, '[data-trigger="me.main.payNow.open"]');
    const earliest = [...pendingPay].sort((a, b) => a.timestamps.placed - b.timestamps.placed)[0];
    const cardParams = payCardUp
      ? await page.locator('[data-trigger="me.main.payNow.open"]').first().getAttribute('data-trigger-params')
      : '';
    rec(
      'me.main:待付款卡 = 最早一笔待支付订单(无待支付订单时整卡隐藏)',
      payCardUp === pendingPay.length > 0 && (!payCardUp || cardParams.includes(earliest.id)),
      `待支付 ${pendingPay.length} 单 / 卡 ${payCardUp ? '显示' : '隐藏'}`,
    );

    await tap(page, 'me.main.settings.open');
    const onSettings = (await pageText(page)).includes('账户设置') || (await pageText(page)).includes('Account settings');
    await back(page);
    await tap(page, 'me.main.history.open');
    const onHistory = (await pageText(page)).includes('足迹') || (await pageText(page)).includes('Browsing history');
    await back(page);
    await tap(page, 'me.main.coupons.open');
    const onCoupons = (await pageText(page)).includes('卡券') || (await pageText(page)).includes('coupon');
    await back(page);
    await tap(page, 'me.main.profile.open');
    const onProfile = (await pageText(page)).includes('个人信息') || (await pageText(page)).includes('Profile');
    await back(page);
    rec(
      'me.main:设置/足迹/卡券/个人信息入口真跳转(减范围补回)',
      onSettings && onHistory && onCoupons && onProfile && (await onMe(page)),
      `settings=${onSettings} history=${onHistory} coupons=${onCoupons} profile=${onProfile}`,
    );
  } catch (e) {
    rec('me.main render', false, String(e).slice(0, 90));
  }

  /* ---------- me.main 五个订单入口 + 精选好物 → 目标页与 tab 参数正确 ---------- */
  try {
    await tap(page, 'me.main.orders.open');
    const allTab = await onOrdersList(page);
    await back(page);
    await tap(page, 'me.main.ordersPendingPay.open');
    const payN = await orderCardCount(page);
    const storePayN = ((await stateSlice(page, 'orders')) ?? []).filter((o) => o.status === 'pendingPay').length;
    await back(page);
    await tap(page, 'me.main.ordersAwaitShip.open');
    const shipN = await orderCardCount(page);
    // 0813 反馈②:已发起退款的订单移出「待收货」,期望计数同步排除
    const storeShipN = ((await stateSlice(page, 'orders')) ?? []).filter(
      (o) => ['awaitShip', 'supplierShip', 'shipping'].includes(o.status) && o.refund == null,
    ).length;
    await back(page);
    await tap(page, 'me.main.ordersToReview.open');
    const reviewOk = await onOrdersList(page);
    await back(page);
    rec(
      'me.main:四个订单入口按 tab 参数落 orders.list,条数与 store 一致',
      allTab && reviewOk && payN === storePayN && shipN === storeShipN,
      `待支付 ${payN}/${storePayN} · 待收货 ${shipN}/${storeShipN}`,
    );

    await tap(page, 'me.main.productDetail.open');
    const onPd = await onDetail(page);
    await closeDetailSheets(page);
    await back(page);
    rec('me.main:精选好物商品卡 → 商详', onPd && (await onMe(page)));
  } catch (e) {
    rec('me.main order entries', false, String(e).slice(0, 90));
  }

  /* ---------- address.list:me「地址」入口 + 列表渲染 ---------- */
  try {
    await goMeTab(page);
    await tap(page, 'me.main.addressList.open');
    const list = await addressesOf(page);
    const rows = await page.locator('[data-trigger="address.list.edit.open"]').count();
    rec(
      'address.list:me「地址」入口进入 + 条目数与 store 一致',
      (await onAddressList(page)) && rows === list.length && rows > 0,
      `rows=${rows}`,
    );

    rec('address.list:自提地址区块已移除(走查 0729)', !(await pageText(page)).includes('自提地址'));
  } catch (e) {
    rec('address.list render', false, String(e).slice(0, 90));
  }

  /* ---------- address.edit 新增态:必填校验 / 粘贴识别 / 四级选择器 / 标签 / 默认开关 / 保存 ---------- */
  try {
    const n0 = (await addressesOf(page)).length;
    await tap(page, 'address.list.new.open');
    const blank = await addressDraftOf(page);
    rec(
      'address.edit:新增态表单空 + 手机号预填 198****0000',
      (await onAddressEdit(page)) && blank?.id === null && blank?.name === '' && blank?.phone === '198****0000',
      `phone=${blank?.phone}`,
    );

    // 脱敏:种子不得出现真实地点(南京大学/仙林校区/仙林街道)与真实姓名(陈同学),全部虚构化
    const seedBlob = JSON.stringify(SEED ?? {});
    const noReal = ['南京大学', '仙林校区', '仙林街道', '仙林', '陈同学'].every((k) => !seedBlob.includes(k));
    rec('脱敏:种子无真实地点(仙林/校区)与姓名(陈同学),街道→翠屏街道、收件人→苏宁用户', noReal, `命中敏感词=${!noReal}`);

    await tap(page, 'address.edit.form.save', 0, 'action');
    rec(
      'address.edit:必填校验未过时不落库(收件人/地区/详细地址为空)',
      (await toastOf(page)) === '请填写完整的收货地址信息' &&
        (await addressesOf(page)).length === n0 &&
        (await onAddressEdit(page)),
    );

    await page.locator(PASTE_BOX).first().fill('李走查 19800000002 江苏省南京市玄武区新街口街道中山路1号');
    await page.waitForTimeout(200);
    await hideKeyboard(page);
    await tap(page, 'address.edit.pasteParse.run', 0, 'action');
    const parsed = await addressDraftOf(page);
    rec(
      'address.edit:粘贴地址自动识别 → 姓名/手机号/四级地区/详细地址拆填',
      parsed?.name === '李走查' &&
        parsed?.phone === '19800000002' &&
        parsed?.province === '江苏省' &&
        parsed?.district === '玄武区' &&
        parsed?.detail.includes('中山路1号'),
      `${parsed?.name}/${parsed?.phone}/${parsed?.province}${parsed?.district}/${parsed?.detail}`,
    );

    /* 四级地区选择器:热门城市锁省市 → 面包屑回跳 → 省→市→区→街道逐级 */
    await tap(page, 'address.edit.region.open');
    const hotN = await page.locator('[data-action="address.edit.select.hotCity"]').count();
    const provN = await page.locator('[data-action="address.edit.select.province"]').count();
    rec(
      'address.edit region 弹层:第一级 = 热门城市宫格 12 项 + 省份列表',
      (await onRegionSheet(page)) === false && hotN === 12 && provN > 0,
      `hot=${hotN} prov=${provN}`,
    );

    await tapWith(page, 'address.edit.select.hotCity', '南京市', 'action');
    const afterHot = await page.locator('[data-action="address.edit.select.district"]').count();
    rec(
      'address.edit region:热门城市直接锁定省+市,面包屑跳至区县级',
      afterHot > 0 && (await onRegionSheet(page)) && (await page.locator('[data-action="address.edit.select.hotCity"]').count()) === 0,
      `districts=${afterHot}`,
    );

    await tap(page, 'address.edit.regionLevel.back', 0, 'action');
    rec(
      'address.edit region:面包屑已选层级可点回跳,其后层级清空',
      (await page.locator('[data-action="address.edit.select.hotCity"]').count()) === 12 &&
        (await page.locator('[data-action="address.edit.select.district"]').count()) === 0,
    );

    await tap(page, 'address.edit.select.province', 0, 'action');
    const cityN = await page.locator('[data-action="address.edit.select.city"]').count();
    await tap(page, 'address.edit.select.city', 0, 'action');
    const distN = await page.locator('[data-action="address.edit.select.district"]').count();
    await tap(page, 'address.edit.select.district', 0, 'action');
    const streetN = await page.locator('[data-action="address.edit.select.street"]').count();
    await tap(page, 'address.edit.select.street', 0, 'action');
    const filled = await addressDraftOf(page);
    rec(
      'address.edit region:省→市→区县→街道逐级点选,选到街道自动关层回填四级串',
      cityN > 0 &&
        distN > 0 &&
        streetN > 0 &&
        !(await onRegionSheet(page)) &&
        filled?.province === '江苏省' &&
        Boolean(filled?.city && filled?.district && filled?.street),
      `${filled?.province}/${filled?.city}/${filled?.district}/${filled?.street}`,
    );

    const hkToast0 = await toastOf(page);
    await tap(page, 'address.edit.region.open');
    await tap(page, 'address.edit.wontfix.toast', 1, 'action'); // 弹层内「中国香港」Tab
    rec('address.edit region:「中国香港」Tab 给 toast', (await toastOf(page)) === '该功能暂未开放' || (await toastOf(page)) !== hkToast0);
    await back(page); // 关弹层,已选层级不落表单

    /* 标签:预设单选 + 自定义标签弹窗 */
    await tap(page, 'address.edit.select.school', 0, 'action');
    const tagged = await addressDraftOf(page);
    await tap(page, 'address.edit.select.company', 0, 'action');
    const tagged2 = await addressDraftOf(page);
    rec(
      'address.edit:标签「家/公司/学校」单选切换',
      tagged?.tag === '学校' && tagged2?.tag === '公司',
      `${tagged?.tag} → ${tagged2?.tag}`,
    );

    await tap(page, 'address.edit.addLabel.open');
    const dlgUp = await has(page, '[data-action="address.edit.addLabel.save"]');
    await page.locator(LABEL_INPUT).first().fill('走查标签');
    await page.waitForTimeout(200);
    await hideKeyboard(page);
    await tap(page, 'address.edit.addLabel.save', 0, 'action');
    const withLabel = await addressDraftOf(page);
    rec(
      'address.edit:自定义标签弹窗保存 → 标签行新增橙色自定义项并选中',
      dlgUp &&
        !(await has(page, '[data-action="address.edit.addLabel.save"]')) &&
        withLabel?.customLabels?.includes('走查标签') &&
        withLabel?.tag === '走查标签',
      `labels=${JSON.stringify(withLabel?.customLabels)}`,
    );

    await tap(page, 'address.edit.editLabel.open');
    const reopened = await has(page, '[data-action="address.edit.addLabel.save"]');
    const echoed = await page.locator(LABEL_INPUT).first().inputValue();
    await back(page);
    rec('address.edit:自定义标签「编辑」回显重开弹窗', reopened && echoed === '走查标签', `echo=${echoed}`);

    await tap(page, 'address.edit.defaultSwitch.toggle', 0, 'action');
    rec('address.edit:「设置默认地址」开关可切', (await addressDraftOf(page))?.isDefault === true);

    await page.locator('[data-action="address.edit.recipient.input"]').first().fill('走查收件人');
    await page.locator('[data-action="address.edit.detail.input"]').first().fill('走查大道 88 号');
    await page.waitForTimeout(200);
    await hideKeyboard(page);
    await tap(page, 'address.edit.form.save', 0, 'action');
    const list1 = await addressesOf(page);
    const saved = list1.find((a) => a.name === '走查收件人');
    rec(
      'address.edit:「保存并使用」→ 地址簿新增 + 默认迁移 + 自动返回列表',
      (await onAddressList(page)) &&
        list1.length === n0 + 1 &&
        Boolean(saved) &&
        saved.isDefault === true &&
        saved.tags.includes('默认') &&
        saved.tags.includes('走查标签') &&
        saved.province === '江苏省' &&
        list1.filter((a) => a.isDefault).length === 1,
      `addresses ${n0}→${list1.length}`,
    );
  } catch (e) {
    rec('address.edit new', false, String(e).slice(0, 90));
  }

  /* ---------- address.list:设默认 / 编辑回显 / 删除确认弹窗 ---------- */
  try {
    const list = await addressesOf(page);
    const other = list.find((a) => !a.isDefault);
    await tapWith(page, 'address.list.default.set', other.id, 'action');
    const afterSet = await addressesOf(page);
    rec(
      'address.list:「✓默认地址」勾选 → 默认标迁移(原默认取消,恒有且仅有一条默认)',
      afterSet.find((a) => a.id === other.id).isDefault === true &&
        afterSet.filter((a) => a.isDefault).length === 1,
      `default → ${other.detail.slice(0, 10)}`,
    );

    await tapWith(page, 'address.list.edit.open', other.id);
    const echo = await addressDraftOf(page);
    rec(
      'address.list:条目「修改」→ address.edit 编辑态回显该地址',
      (await onAddressEdit(page)) && echo?.id === other.id && echo?.name === other.name && echo?.detail === other.detail,
      `echo=${echo?.detail?.slice(0, 12)}`,
    );
    await back(page);

    const target = (await addressesOf(page)).find((a) => !a.isDefault);
    const n1 = (await addressesOf(page)).length;
    await tapWith(page, 'address.list.deleteConfirm.open', target.id);
    const dlgUp = await has(page, '[data-action="address.list.delete.confirm"]');
    await back(page); // 取消 = bindBack
    const cancelled = (await addressesOf(page)).length;
    await tapWith(page, 'address.list.deleteConfirm.open', target.id);
    await tap(page, 'address.list.delete.confirm', 0, 'action');
    const n2 = (await addressesOf(page)).length;
    rec(
      'address.list:删除确认弹窗 URL 驱动(取消不删 / 确认后条目移除)',
      dlgUp && cancelled === n1 && n2 === n1 - 1 && (await onAddressList(page)),
      `${n1} → 取消 ${cancelled} → 删除 ${n2}`,
    );
    // 回接①②③需要一条非默认地址可选,补一条(区县与存量默认地址不同,便于断言来源页文案联动)
    await addAddressFromList(page, '回接走查人', '翠屏路 100 号');
    await back(page); // 回 me
    rec('返回可达性:地址域可逐级返回我的 Tab', await onMe(page));
  } catch (e) {
    rec('address.list manage', false, String(e).slice(0, 90));
  }

  /* ---------- 回接①:购物车顶栏定位 → 地址簿选择模式 → 选中成默认 + 顶栏文案联动 ---------- */
  try {
    await goHomeTab(page);
    await tap(page, 'tabbar.cart.open');
    const loc0 = (await page.locator('[data-trigger="cart.main.address.pick"]').first().innerText()).trim();
    await tap(page, 'cart.main.address.pick');
    const inPicker = await has(page, '[data-action="address.list.pick.select"]');
    const other = (await addressesOf(page)).find((a) => !a.isDefault);
    await pickAddress(page, other.id);
    const loc1 = (await page.locator('[data-trigger="cart.main.address.pick"]').first().innerText()).trim();
    rec(
      '回接①:购物车定位「⌾栖霞区」→ address.list?mode=picker,选中后成为默认地址且顶栏文案联动',
      inPicker &&
        (await addressesOf(page)).find((a) => a.id === other.id).isDefault === true &&
        loc1 === other.district &&
        loc1 !== loc0,
      `${loc0} → ${loc1}`,
    );
  } catch (e) {
    rec('rewire cart.address.pick', false, String(e).slice(0, 90));
  }

  /* ---------- 回接②:商详送至行 → 地址簿选择模式 → 送至文案联动 ---------- */
  try {
    await openFanDetail(page);
    await closeDetailSheets(page);
    const ship0 = (await page.locator('[data-trigger="product.detail.address.pick"]').first().innerText()).replace(/\s+/g, '');
    await tap(page, 'product.detail.address.pick');
    const inPicker = await has(page, '[data-action="address.list.pick.select"]');
    const other = (await addressesOf(page)).find((a) => !a.isDefault);
    await pickAddress(page, other.id);
    const ship1 = (await page.locator('[data-trigger="product.detail.address.pick"]').first().innerText()).replace(/\s+/g, '');
    rec(
      '回接②:商详「送至」行 → address.list?mode=picker,选中后送至文案联动',
      inPicker && (await onDetail(page)) && ship1.includes(other.district) && ship1 !== ship0,
      `${ship0.slice(0, 18)} → ${ship1.slice(0, 18)}`,
    );
  } catch (e) {
    rec('rewire product.detail.address.pick', false, String(e).slice(0, 90));
  }

  /* ---------- 回接③:结果页筛选弹层收货地址行「修改」→ 地址簿选择模式 ---------- */
  try {
    await goHomeTab(page);
    await tap(page, 'home.main.search.open');
    await page.locator('[data-action="search.entry.keyword.input"]').first().fill('风扇');
    await page.waitForTimeout(300);
    await tap(page, 'search.entry.results.open');
    await tap(page, 'search.results.filter.open');
    await tap(page, 'search.results.filter.address.pick');
    const inPicker = await has(page, '[data-action="address.list.pick.select"]');
    const other = (await addressesOf(page)).find((a) => !a.isDefault);
    await pickAddress(page, other.id);
    const backInSheet = await has(page, '[data-action="search.results.filter.reset"]');
    const addrTxt = (await pageText(page)).includes(other.district);
    rec(
      '回接③:结果页筛选弹层「收货地址-修改」→ address.list?mode=picker,选中后回筛选弹层并联动',
      inPicker && backInSheet && addrTxt,
      `district=${other.district}`,
    );
    await back(page); // 关筛选弹层
  } catch (e) {
    rec('rewire search.results.filter.address.pick', false, String(e).slice(0, 90));
  }

  /* ---------- 回接④:修改订单「从收货地址里选择」→ 地址簿选择模式回填改单表单 ---------- */
  try {
    await goMeTab(page);
    await tap(page, 'me.main.orders.open');
    await tapWith(page, 'orders.list.modify.open', KETTLE);
    const inModify = await onOrderModify(page);
    await tap(page, 'order.modify.addressPicker.open');
    const inPicker = await has(page, '[data-action="address.list.pick.select"]');
    const target = (await addressesOf(page))[0];
    await pickAddress(page, target.id);
    const draft = (await stateSlice(page, '_temp'))?.orderModifyDraft;
    // 姓名/详细地址是受控 input/textarea,取 value 而非 innerText
    const fields = page.locator('[data-action="order.modify.field.edit"]');
    const fName = await fields.nth(0).inputValue();
    const fDetail = await fields.nth(2).inputValue();
    const regionTxt = (await rowText(page, 'order.modify.region.open')).replace(/\s+/g, '');
    rec(
      '回接④:改订单「从收货地址里选择>」→ address.list?mode=picker,回填改单表单(qa:Q17 选择模式)',
      inModify &&
        inPicker &&
        (await onOrderModify(page)) &&
        draft?.name === target.name &&
        draft?.detail === target.detail &&
        fName === target.name &&
        fDetail === target.detail &&
        regionTxt.includes(target.district),
      `回填 ${fName}/${regionTxt}/${fDetail.slice(0, 12)}`,
    );
    await back(page);
  } catch (e) {
    rec('rewire order.modify.addressPicker', false, String(e).slice(0, 90));
  }

  /* ---------- 回接⑤:结算地址选择器「修改」/「+新增配送地址」→ address.edit,保存即选中 ---------- */
  try {
    await openPadDetail(page);
    await tap(page, 'product.detail.skuBuy.open');
    await tap(page, 'product.detail.checkout.open');
    if (await has(page, '[data-action="checkout.main.subsidy.claim"]')) await back(page);
    await tap(page, 'checkout.main.addressPicker.open');
    const selectedId = (await stateSlice(page, 'checkoutDraft'))?.addressId;
    await tap(page, 'checkout.main.addressEdit.open');
    const echo = await addressDraftOf(page);
    rec(
      '回接⑤a:结算地址选择器「修改」→ address.edit 编辑态(原 wontfix toast)',
      (await onAddressEdit(page)) && Boolean(echo?.id),
      `addressId=${echo?.id}`,
    );
    await back(page);

    const nBefore = (await addressesOf(page)).length;
    await tap(page, 'checkout.main.addressAdd.open');
    const isNew = (await addressDraftOf(page))?.id === null;
    await page.locator('[data-action="address.edit.recipient.input"]').first().fill('结算走查人');
    await page.locator('[data-action="address.edit.detail.input"]').first().fill('结算大道 9 号');
    await page.waitForTimeout(200);
    await hideKeyboard(page);
    await tap(page, 'address.edit.region.open');
    await tap(page, 'address.edit.select.province', 0, 'action');
    await tap(page, 'address.edit.select.city', 0, 'action');
    await tap(page, 'address.edit.select.district', 0, 'action');
    await tap(page, 'address.edit.select.street', 0, 'action');
    await tap(page, 'address.edit.form.save', 0, 'action');
    const list = await addressesOf(page);
    const created = list.find((a) => a.name === '结算走查人');
    const draftAfter = await stateSlice(page, 'checkoutDraft');
    rec(
      '回接⑤b:结算「+新增配送地址」→ address.edit 新增态,保存后地址簿 +1 且本单即选中该地址',
      isNew &&
        list.length === nBefore + 1 &&
        Boolean(created) &&
        draftAfter?.addressId === created.id &&
        draftAfter.addressId !== selectedId,
      `addresses ${nBefore}→${list.length},本单地址 ${selectedId?.slice(-6)}→${draftAfter?.addressId?.slice(-6)}`,
    );
    await leaveCheckout(page);
  } catch (e) {
    rec('rewire checkout.addressEdit/addressAdd', false, String(e).slice(0, 90));
  }

  /* ==================== L4-B:关注 / 消息中心 / 发现Tab ==================== */

  /* ---------- 回接⑥:me.main 数据行「关注」→ me.follow(原 wontfix toast) ---------- */
  try {
    await goMeTab(page);
    await tap(page, 'me.main.follow.open');
    const follows = (await stateSlice(page, 'followedProducts')) ?? [];
    const cards = await followCardCount(page);
    rec(
      '回接⑥:我的易购「关注」→ 我的关注页,商品 Tab 条数与 store 一致',
      (await onFollow(page)) && cards === follows.length && follows.length > 0,
      `卡片 ${cards} / store ${follows.length}`,
    );
  } catch (e) {
    rec('rewire me.main.follow.open', false, String(e).slice(0, 90));
  }

  /* ---------- me.follow:四个 Tab 切换 + 商品筛选四态 ---------- */
  try {
    const shops = ((await stateSlice(page, 'followedShops')) ?? []).length;
    const creators = ((await stateSlice(page, 'followedCreators')) ?? []).length;
    await tap(page, 'me.follow.select.tabShops', 0, 'action');
    const shopRows = await page.locator('[data-trigger="me.follow.shop.open"]').count();
    await tap(page, 'me.follow.select.tabCreators', 0, 'action');
    const creatorRows = await page.locator('[data-action="me.follow.wontfix.toast"]').count();
    await tap(page, 'me.follow.select.tabContents', 0, 'action');
    const contentsEmpty =
      (await has(page, '[data-trigger="me.follow.discover.open"]')) &&
      (await pageText(page)).includes('您暂时没有关注感兴趣的内容哦');
    await tap(page, 'me.follow.select.tabGoods', 0, 'action');
    rec(
      'me.follow:四个 Tab 切换,店铺/达人条数与 store 一致,内容 Tab 空态带「去发现」',
      shopRows === shops && creatorRows === creators && contentsEmpty && (await followCardCount(page)) > 0,
      `店铺 ${shopRows}/${shops} · 达人 ${creatorRows}/${creators} · 内容空态 ${contentsEmpty}`,
    );
  } catch (e) {
    rec('me.follow tabs', false, String(e).slice(0, 90));
  }

  try {
    // 期望值按 store + 种子价目表算,不写死条数(前序断言会往关注列表里加东西)
    const list = (await stateSlice(page, 'followedProducts')) ?? [];
    const expPromo = list.filter((f) => productSeed(f.productId)?.promoTag).length;
    const expSub = list.filter((f) => f.subscribePrice != null).length;
    const expDrop = list.filter(
      (f) => f.subscribePrice != null && (productSeed(f.productId)?.price ?? 0) <= f.subscribePrice,
    ).length;
    const all = await followCardCount(page);
    await tap(page, 'me.follow.select.filterPromo', 0, 'action');
    const promo = await followCardCount(page);
    await tap(page, 'me.follow.select.filterSubscribed', 0, 'action');
    const subscribed = await followCardCount(page);
    await tap(page, 'me.follow.select.filterDrop', 0, 'action');
    const drop = await followCardCount(page);
    // 「降价」= 现价已跌到订阅价;种子里水壶 ¥99 > 订阅价 ¥85,故为空态
    const dropEmpty = expDrop === 0 && drop === 0 && (await has(page, '[data-trigger="me.follow.goShopping.open"]'));
    await tap(page, 'me.follow.select.filterAll', 0, 'action');
    rec(
      'me.follow:商品筛选 全部/促销/订阅/降价 四态取数(降价无命中落空态)',
      all === list.length &&
        promo === expPromo &&
        subscribed === expSub &&
        dropEmpty &&
        (await followCardCount(page)) === all,
      `全部 ${all}/${list.length} · 促销 ${promo}/${expPromo} · 订阅 ${subscribed}/${expSub} · 降价 ${drop}(空态 ${dropEmpty})`,
    );
  } catch (e) {
    rec('me.follow filters', false, String(e).slice(0, 90));
  }

  /* ---------- me.follow:降价通知弹窗(校验 / 落库 / 编辑回显) ---------- */
  try {
    const PW_INPUT = '[data-action="me.follow.priceWatch.input"][data-action-type="input"]';
    await tapWith(page, 'me.follow.priceWatch.open', PAD_FOLLOW);
    const opened = await has(page, PW_INPUT);
    const emptyDraft = (await page.locator(PW_INPUT).first().inputValue()) === '';
    // 期望价 ≥ 现价:不落库 + toast(校验分支)
    await page.locator(PW_INPUT).first().fill('3999');
    await page.waitForTimeout(200);
    await hideKeyboard(page);
    await tap(page, 'me.follow.priceWatch.confirm', 0, 'action');
    const rejected =
      (await has(page, PW_INPUT)) &&
      (await toastOf(page)).includes('低于现价') &&
      followOf(await stateSlice(page, 'followedProducts'), PAD_FOLLOW)?.subscribePrice == null;

    await page.locator(PW_INPUT).first().fill('1999');
    await page.waitForTimeout(200);
    await hideKeyboard(page);
    const discountShown = /\d\.\d折/.test(await pageText(page));
    await tap(page, 'me.follow.priceWatch.confirm', 0, 'action');
    const saved = followOf(await stateSlice(page, 'followedProducts'), PAD_FOLLOW)?.subscribePrice;
    const closed = !(await has(page, PW_INPUT));
    rec(
      'me.follow:降价通知弹窗 —— 高于现价被拦截,1999 落库、折扣标签出现、关层后卡片显示订阅价',
      opened && emptyDraft && rejected && discountShown && saved === 1999 && closed &&
        (await pageText(page)).includes('订阅价¥1999.00'),
      `校验拦截 ${rejected} · subscribePrice=${saved}`,
    );

    // 已订阅的卡改点「订阅价」入口:草稿回显既有价格
    await tapWith(page, 'me.follow.priceWatchEdit.open', PAD_FOLLOW);
    const echo = await page.locator(PW_INPUT).first().inputValue();
    rec('me.follow:已订阅商品点「订阅价¥」→ 弹窗回显既有期望价(受控值用 inputValue 断言)', echo === '1999', `回显 ${echo}`);
    await back(page);
  } catch (e) {
    rec('me.follow priceWatch', false, String(e).slice(0, 90));
  }

  /* ---------- me.follow:加购 + 编辑态取消关注 ---------- */
  try {
    // 关注商品卡「+」:跳商详弹 SKU 规格弹层(0813 反馈③),确定后件数 +1,再回我的关注
    const qtyBefore = await cartQty(page);
    await tapWith(page, 'me.follow.skuAdd.open', PAD_FOLLOW);
    const followSkuUp = await has(page, '[data-action="product.detail.sku.qtyStep"]');
    await tap(page, 'product.detail.cartSuccess.open');
    const qtyAfter = await cartQty(page);
    for (let i = 0; i < 4 && !(await has(page, '[data-trigger="me.follow.skuAdd.open"]')); i++) await back(page);

    const nBefore = ((await stateSlice(page, 'followedProducts')) ?? []).length;
    await tap(page, 'me.follow.editMode.toggle', 0, 'action');
    // 未选中时「取消关注」按钮置灰且不打 tag,编辑态标志取底栏「全选」(无 params 的那个)
    const inEdit = await has(page, '[data-action="me.follow.selectAll.toggle"]:not([data-action-params])');
    await tapWith(page, 'me.follow.selectAll.toggle', FAN_FOLLOW, 'action');
    const picked = ((await stateSlice(page, '_temp'))?.multiSelect ?? []).includes(FAN_FOLLOW);
    await tap(page, 'me.follow.unfollow.submit', 0, 'action');
    const after = (await stateSlice(page, 'followedProducts')) ?? [];
    rec(
      'me.follow:卡片「+」弹 SKU 弹层确定后件数 +1;编辑态勾选单条「取消关注」后 store -1 且退出编辑态',
      followSkuUp &&
        qtyAfter === qtyBefore + 1 &&
        inEdit &&
        picked &&
        after.length === nBefore - 1 &&
        !after.some((f) => f.productId === FAN_FOLLOW) &&
        (await toastOf(page)).includes('已取消关注') &&
        !(await has(page, '[data-action="me.follow.unfollow.submit"]')),
      `购物车 ${qtyBefore}→${qtyAfter},关注 ${nBefore}→${after.length}`,
    );
  } catch (e) {
    rec('me.follow unfollow', false, String(e).slice(0, 90));
  }

  /* ---------- 回接⑦:me.main 消息入口 → msg.center;交易摘要行 → 订单详情 + 消红点 ---------- */
  try {
    await goMeTab(page);
    await tap(page, 'me.main.msgCenter.open');
    const inMsg = await onMsgCenter(page);
    const msgs = (await stateSlice(page, 'transMsgs')) ?? [];
    const unreadBefore = (await stateSlice(page, 'unread'))?.trade ?? 0;
    const latest = msgs.filter((m) => m.channel === 'trade').sort((a, b) => b.ts - a.ts)[0];
    const summaryShown = Boolean(latest) && (await pageText(page)).includes(latest.title);
    await tap(page, 'msg.center.tradeMsg.open');
    const onDetailNow = await onOrderDetail(page);
    const unreadAfter = (await stateSlice(page, 'unread'))?.trade ?? -1;
    rec(
      '回接⑦:我的易购「消息」→ 消息中心;交易物流最新摘要行 → 订单详情,该频道置为已读',
      inMsg && msgs.length > 0 && unreadBefore > 0 && summaryShown && onDetailNow && unreadAfter === 0,
      `消息 ${msgs.length} 条,未读 ${unreadBefore}→${unreadAfter},摘要「${latest?.title ?? '-'}」`,
    );
    await back(page);
  } catch (e) {
    rec('rewire me.main.msgCenter.open', false, String(e).slice(0, 90));
  }

  /* ---------- msg.center:频道/设置真跳转 + 清空落空态 ---------- */
  try {
    if (!(await onMsgCenter(page))) {
      await goMeTab(page);
      await tap(page, 'me.main.msgCenter.open');
    }
    // 0813 反馈①:点进频道即置该频道已读,红点/角标随 store 更新(退款链已推「通知消息」故 notice 未读>0)
    const noticeBefore = (await stateSlice(page, 'unread'))?.notice ?? 0;
    await tap(page, 'msg.center.notice.open');
    const noticeAfter = (await stateSlice(page, 'unread'))?.notice ?? -1;
    await back(page);
    rec(
      'msg.center 反馈①:点进「通知消息」频道 → 该频道未读归零(写入 store,红点消除)',
      noticeBefore > 0 && noticeAfter === 0,
      `notice ${noticeBefore}→${noticeAfter}`,
    );

    await tap(page, 'msg.center.trade.open');
    const onChannel =
      (await pageText(page)).includes('交易物流') || (await pageText(page)).includes('Orders & shipping');
    await back(page);
    await tap(page, 'msg.center.settings.open');
    const onMsgSettings =
      (await pageText(page)).includes('消息提醒') || (await pageText(page)).includes('Notification');
    // 0813 反馈①:清空聊天记录写入 store(清空客服会话实体),不再是假 toast
    const chatBefore = Object.keys((await stateSlice(page, 'chatSessions')) ?? {}).length;
    await tap(page, 'msg.settings.clearConfirm.open');
    await tap(page, 'msg.settings.clearChat.confirm', 0, 'action');
    const chatAfter = Object.keys((await stateSlice(page, 'chatSessions')) ?? {}).length;
    rec(
      'msg.settings 反馈①:清空聊天记录 → chatSessions 清空(写入 store,非假回调)',
      chatBefore > 0 && chatAfter === 0,
      `chatSessions ${chatBefore}→${chatAfter}`,
    );
    await back(page);
    await tap(page, 'msg.center.wontfix.toast', 0, 'action'); // 人形
    const wontfixToast = (await toastOf(page)).includes('暂未开放');
    // 0814 反馈①:顶栏刷子按钮 = 清除未读(三频道未读归零),不删消息;消息列表保留
    const msgsBeforeClear = ((await stateSlice(page, 'transMsgs')) ?? []).length;
    await tap(page, 'msg.center.clear.run', 0, 'action');
    const msgsAfter = (await stateSlice(page, 'transMsgs')) ?? [];
    const unreadAfter = (await stateSlice(page, 'unread')) ?? {};
    rec(
      'msg.center 反馈①:频道/设置真跳转;人形 toast;顶栏「清除未读」→ 三频道未读归零但消息保留',
      onChannel &&
        onMsgSettings &&
        wontfixToast &&
        msgsBeforeClear > 0 &&
        msgsAfter.length === msgsBeforeClear &&
        unreadAfter.trade === 0 &&
        unreadAfter.notice === 0 &&
        unreadAfter.interact === 0 &&
        (await toastOf(page)).includes('已全部标为已读'),
      `清除未读:消息 ${msgsBeforeClear}→${msgsAfter.length}(保留),未读归零`,
    );
  } catch (e) {
    rec('msg.center clear', false, String(e).slice(0, 90));
  }

  /* ---------- 回接⑧⑨:首页消息气泡 / 购物车顶栏消息图标 → msg.center ---------- */
  try {
    await goHomeTab(page);
    await tap(page, 'home.main.msg.open');
    const fromHome = await onMsgCenter(page);
    await back(page);
    await goHomeTab(page);
    await tap(page, 'tabbar.cart.open');
    await tap(page, 'cart.main.msg.open');
    const fromCart = await onMsgCenter(page);
    await back(page);
    rec('回接⑧⑨:首页消息气泡 / 购物车顶栏消息图标 → 消息中心(原 wontfix toast)', fromHome && fromCart);
  } catch (e) {
    rec('rewire home/cart msg.open', false, String(e).slice(0, 90));
  }

  /* ---------- discover.main:精选内容流四个分类 + 内容卡带货位 → 商详 ---------- */
  try {
    await goHomeTab(page);
    await tap(page, 'tabbar.discover.open');
    const inDiscover = await onDiscover(page);
    const bannerShown = (await pageText(page)).includes('海信超级品牌周');
    const all = await feedCardCount(page);
    await tapWith(page, 'discover.main.feedTab.switch', 'daily', 'action');
    const daily = await feedCardCount(page);
    await tapWith(page, 'discover.main.feedTab.switch', 'food', 'action');
    const food = await feedCardCount(page);
    await tapWith(page, 'discover.main.feedTab.switch', 'trend', 'action');
    const trend = await feedCardCount(page);
    await tapWith(page, 'discover.main.feedTab.switch', 'all', 'action');
    rec(
      'discover.main:精选流二级分类 内容广场/日用派/食享乐/潮玩汇 条数分流且合计守恒',
      inDiscover && bannerShown && all === 8 && daily === 4 && food === 2 && trend === 2 && daily + food + trend === all,
      `全部 ${all} = 日用 ${daily} + 食享 ${food} + 潮玩 ${trend}`,
    );

    await tap(page, 'discover.main.product.open');
    const toDetail = await onDetail(page);
    await closeDetailSheets(page);
    await back(page);
    rec('discover.main:内容卡内嵌带货位 → 商详(Q29=A,与卡体本身分开热区)', toDetail && (await onDiscover(page)));
  } catch (e) {
    rec('discover featured', false, String(e).slice(0, 90));
  }

  /* ---------- discover.main:关注流 +关注 落 store,已减范围入口 toast ---------- */
  try {
    if (!(await onDiscover(page))) {
      await goHomeTab(page);
      await tap(page, 'tabbar.discover.open');
    }
    await tapWith(page, 'discover.main.topTab.switch', 'follow', 'action');
    const before = (await stateSlice(page, 'followedCreators')) ?? [];
    const btnBefore = await page.locator('[data-action="discover.main.creator.followToggle"]').count();
    await tapWith(page, 'discover.main.creator.followToggle', LIVE_CREATOR, 'action');
    const after = (await stateSlice(page, 'followedCreators')) ?? [];
    const btnAfter = await page.locator('[data-action="discover.main.creator.followToggle"]').count();
    const followToast = (await toastOf(page)).includes('关注成功');
    // creator.profile 已减范围:头像/昵称点了要有 toast
    await tap(page, 'discover.main.wontfix.toast', 0, 'action');
    rec(
      'discover.main:关注流「+ 关注」落 store 并换成「去看看」;达人主页(已减范围)入口 toast',
      btnBefore === 3 &&
        !before.includes(LIVE_CREATOR) &&
        after.includes(LIVE_CREATOR) &&
        after.length === before.length + 1 &&
        btnAfter === btnBefore - 1 &&
        followToast &&
        (await toastOf(page)).includes('暂未开放'),
      `未关注达人 ${btnBefore}→${btnAfter},followedCreators ${before.length}→${after.length}`,
    );
    await tapWith(page, 'discover.main.topTab.switch', 'featured', 'action');
  } catch (e) {
    rec('discover follow feed', false, String(e).slice(0, 90));
  }

  /* ---------- 双语:en 下 L4-B 新页面文案跟随 ---------- */
  try {
    await page.evaluate(() => window.__OS__.locale.setLocale('en'));
    await page.waitForTimeout(500);
    const discoverTxt = await pageText(page);
    await goMeTab(page);
    await tap(page, 'me.main.follow.open');
    const followTxt = await pageText(page);
    await back(page);
    await tap(page, 'me.main.msgCenter.open');
    const msgTxt = await pageText(page);
    await back(page);
    rec(
      '双语:en 下 发现 / 我的关注 / 消息中心 英文文案',
      /Featured|Contentsquare/.test(discoverTxt) &&
        /Myfollows|Items/.test(followTxt) &&
        /Messages|Orders&logistics/.test(msgTxt),
      `${discoverTxt.slice(0, 18)} | ${followTxt.slice(0, 18)} | ${msgTxt.slice(0, 18)}`,
    );
    await page.evaluate(() => window.__OS__.locale.setLocale('zh'));
    await page.waitForTimeout(400);
  } catch (e) {
    rec('i18n L4-B', false, String(e).slice(0, 90));
  }

  /* ---------- 双语:en 下 L4-A 新页面文案跟随 ---------- */
  try {
    await page.evaluate(() => window.__OS__.locale.setLocale('en'));
    await page.waitForTimeout(500);
    await goMeTab(page);
    const meTxt = await pageText(page);
    await tap(page, 'me.main.addressList.open');
    const listTxt = await pageText(page);
    await tap(page, 'address.list.new.open');
    const editTxt = await pageText(page);
    await back(page);
    await back(page);
    rec(
      '双语:en 下 我的易购 / 地址管理 / 新增地址 英文文案',
      /Myorders|Cloudgems|Membership/.test(meTxt) &&
        /Manageaddresses|Deliveryaddresses/.test(listTxt) &&
        /Newaddress|Recipient/.test(editTxt),
      `${meTxt.slice(0, 20)} | ${listTxt.slice(0, 20)} | ${editTxt.slice(0, 20)}`,
    );
    await page.evaluate(() => window.__OS__.locale.setLocale('zh'));
    await page.waitForTimeout(400);
  } catch (e) {
    rec('i18n L4-A', false, String(e).slice(0, 90));
  }

  /* ---------- 返回可达性:任意深度可回到 Tab 根 ---------- */
  try {
    for (let i = 0; i < 12; i++) {
      if (await atTabRoot(page)) break;
      if (await leaveCashierIfAny(page)) continue;
      await back(page);
    }
    rec('返回可达性:深栈可回 Tab 根(收银台经「离开收银台」脱身)', await atTabRoot(page));
  } catch (e) {
    rec('back reachability', false, String(e).slice(0, 90));
  }

  /* ---------- 双语:切 en 后商详文案跟随 ---------- */
  try {
    await page.evaluate(() => window.__OS__.locale.setLocale('en'));
    await page.waitForTimeout(500);
    await openFanDetail(page);
    const txt = await page.locator('[data-adjust-resize]').first().innerText();
    rec('双语:en 下商详英文文案', /Selected|Ship to|Reviews|Worry-free/.test(txt), txt.replace(/\s+/g, ' ').slice(0, 80));

    // L3-A:结算页 / 订单列表文案跟随(收银台已改为系统支付宝 App,其文案不属苏宁 i18n)
    await tap(page, 'product.detail.skuBuy.open');
    await tap(page, 'product.detail.checkout.open');
    const coTxt = await pageText(page);
    await goHomeTab(page);
    await tap(page, 'tabbar.me.open');
    await tap(page, 'me.main.orders.open');
    const orderTxt = await pageText(page);
    rec(
      '双语:en 下结算 / 订单列表英文文案',
      /Confirmorder|Paynow/.test(coTxt) && /Myorders|Awaitingpayment/.test(orderTxt),
      `${coTxt.slice(0, 20)} | ${orderTxt.slice(0, 20)}`,
    );
    await page.evaluate(() => window.__OS__.locale.setLocale('zh'));
    await page.waitForTimeout(400);
  } catch (e) {
    rec('i18n', false, String(e).slice(0, 90));
  }

  /* ---------- M1 回归:搜索结果筛选弹层(transition 曾被 onTrigger 覆盖而打不开) ---------- */
  try {
    await goHomeTab(page);
    await tap(page, 'home.main.search.open');
    await page.locator('[data-action="search.entry.keyword.input"]').first().fill('风扇');
    await page.waitForTimeout(300);
    await tap(page, 'search.entry.results.open');
    await tap(page, 'search.results.filter.open');
    rec('M1 回归:全部筛选弹层可打开', await has(page, '[data-action="search.results.filter.reset"]'));
    await back(page);
  } catch (e) {
    rec('search filter sheet', false, String(e).slice(0, 90));
  }

  rec('console/pageerror 零容忍', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} PASS ===`);
  if (failed.length) {
    console.log('FAILED:');
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
