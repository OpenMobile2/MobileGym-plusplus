// 京东运行时走查(pipeline v3 阶段3 第五道 gate)—— puppeteer 版(本机无 playwright 浏览器,复用 Chrome for Testing)。
// 静态 gate 证明"声明了的都写了";本 gate 证明"写了的真的会动"+ 无运行时崩溃 + 返回可达(§5.2/§11)。
// 用法: node apps/Jingdong/assets/runtime_walkthrough.mjs   (需 vite dev 跑在 :5173)
import puppeteer from 'puppeteer';

const URL = process.env.JD_URL || 'http://localhost:5173';
const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // 或用 CHROME_BIN 指定

const results = [];
const rec = (name, ok, detail = '') => { results.push([name, ok, detail]); console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? '  ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function st(page, expr) { return page.evaluate((e) => window.__SIM__.getState().apps.jingdong?.[e], expr); }
async function stPath(page, expr) { return page.evaluate((e) => { const o = window.__SIM__.getState().apps.jingdong; return e.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }, expr); }
async function click(page, sel) { const el = await page.$(sel); if (!el) throw new Error('no element ' + sel); await el.click(); await sleep(550); }
async function has(page, sel) { return (await page.$(sel)) != null; }
async function sig(page) { return page.evaluate(() => (document.querySelector('.flex-1')?.innerText || document.body.innerText || '').replace(/\s+/g, '').slice(0, 120)); }
async function tabbarVisible(page) { return page.evaluate(() => { const b = document.querySelector('[data-trigger="tabbar.home-open"]'); if (!b) return false; const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); }

async function main() {
  const errors = [];
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 240)));
  page.on('console', async (m) => {
    if (m.type() !== 'error') return;
    if (/404|favicon|Download the React|\[WMR\]/.test(m.text())) return; // [WMR]=桌面小组件引擎,非本app
    let extra = '';
    try { const args = await Promise.all(m.args().map((a) => a.evaluate((x) => (x && x.message) ? x.message + (x.stack ? ' @ ' + String(x.stack).split('\n')[1] : '') : String(x)).catch(() => '')));
      extra = args.filter(Boolean).join(' :: '); } catch { /* ignore */ }
    errors.push('console: ' + (m.text() + ' ' + extra).slice(0, 300));
  });

  async function reset() { // 连按 back 直到 tab 根(tabbar 可见)
    for (let i = 0; i < 8; i++) { if (await tabbarVisible(page)) return; await page.evaluate(() => window.__OS__.handleBack()); await sleep(400); }
  }

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await page.evaluate(() => window.__OS__.openApp('jingdong'));
  await sleep(2200);

  rec('W0 应用启动无崩溃 + 首页渲染', await has(page, '[data-trigger="home.item-open"]'), '');

  // W1 首页商品卡 → 详情页(不崩)
  try {
    await click(page, '[data-trigger="home.item-open"]');
    rec('W1 首页→商品详情', await has(page, '[data-action="detail.sku.show"]') || await has(page, '[data-trigger="detail.cart-open"]'));
  } catch (e) { rec('W1 首页→商品详情', false, String(e).slice(0, 80)); }

  // W2 加入购物车 → SKU弹层 → 确定加购 → cart+1
  try {
    const c0 = (await st(page, 'cart'))?.length ?? 0;
    await click(page, '[data-action="detail.sku.show"]');
    const panelOpen = await has(page, '[data-action="sku.confirm.addcart"]');
    if (panelOpen) await click(page, '[data-action="sku.confirm.addcart"]');
    const c1 = (await st(page, 'cart'))?.length ?? 0;
    rec('W2 SKU加购 cart+1', c1 === c0 + 1, `cart ${c0}->${c1}`);
  } catch (e) { rec('W2 SKU加购 cart+1', false, String(e).slice(0, 80)); }

  // W3 购物车Tab → 去结算 → 确认订单 → 立即支付(建待付款) → 输密码 → orders+1
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.cart-open"]');
    const onCart = await has(page, '[data-trigger="cart.checkout-open"]');
    rec('W3 进入购物车Tab', onCart);
    const o0 = (await st(page, 'orders'))?.length ?? 0;
    if (onCart) {
      await click(page, '[data-trigger="cart.checkout-open"]');
      const onConfirm = await has(page, '[data-action="confirm.pay.open"]');
      if (onConfirm) {
        await click(page, '[data-action="confirm.pay.open"]');
        // 支付密码弹层:任意点 6 位数字完成支付
        for (let i = 0; i < 6; i++) {
          const digit = page.locator('[data-action="pay.password.input"] button:has-text("1")').first();
          if (await digit.count()) await digit.click();
        }
      }
      const o1 = (await st(page, 'orders'))?.length ?? 0;
      rec('W4 结算下单 orders+1', o1 === o0 + 1, `orders ${o0}->${o1}`);
    } else rec('W4 结算下单 orders+1', false, '未进确认订单页');
  } catch (e) { rec('W4 结算下单 orders+1', false, String(e).slice(0, 80)); }

  // W5 每日签到 → 京豆+10
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.mine-open"]');
    const j0 = await stPath(page, 'user.jingdou');
    if (await has(page, '[data-trigger="mine.jingdou-open"]')) {
      await click(page, '[data-trigger="mine.jingdou-open"]');
      if (await has(page, '[data-action="jingdou.signin.claim"]')) await click(page, '[data-action="jingdou.signin.claim"]');
    }
    const j1 = await stPath(page, 'user.jingdou');
    rec('W5 签到京豆+10', j1 === j0 + 10, `jingdou ${j0}->${j1}`);
  } catch (e) { rec('W5 签到京豆+10', false, String(e).slice(0, 80)); }

  // W6 领券中心领取 → coupons+1
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    if (await has(page, '[data-trigger="home.couponcenter-open"]')) {
      const cc0 = (await st(page, 'coupons'))?.length ?? 0;
      await click(page, '[data-trigger="home.couponcenter-open"]');
      const claimBtn = await page.$('[data-action="couponcenter.item.claim"]');
      if (claimBtn) { await claimBtn.click(); await sleep(500); }
      const cc1 = (await st(page, 'coupons'))?.length ?? 0;
      rec('W6 领券 coupons+1', cc1 === cc0 + 1, `coupons ${cc0}->${cc1}`);
    } else rec('W6 领券 coupons+1', false, '首页无领券中心入口');
  } catch (e) { rec('W6 领券 coupons+1', false, String(e).slice(0, 80)); }

  // W7 返回可达性(§11):深入若干页 → 连续 system.back → 必回到某 tab 根,途中无环
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.item-open"]');           // /item
    if (await has(page, '[data-trigger="detail.shop-open"]')) await click(page, '[data-trigger="detail.shop-open"]'); // /shop
    if (await has(page, '[data-trigger="shop.item-open"]')) await click(page, '[data-trigger="shop.item-open"]');     // /item again (deeper)
    const seen = [];
    let reachedRoot = false;
    for (let i = 0; i < 8; i++) {
      if (await tabbarVisible(page)) { reachedRoot = true; break; }
      seen.push(await sig(page));
      await page.evaluate(() => window.__OS__.handleBack());
      await sleep(500);
    }
    if (await tabbarVisible(page)) reachedRoot = true;
    // 死循环振荡:同一页签名出现 ≥3 次(A→B→A→B 打转);单纯重访同类页(≤2)不算
    const counts = {}; seen.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
    const oscillate = Object.values(counts).some((n) => n >= 3);
    rec('W7 返回可达(连按back≤8回tab根)', reachedRoot, reachedRoot ? '' : `backs used, sigs=${seen.length}`);
    rec('W7b 返回无死循环振荡(URL无环)', !oscillate);
  } catch (e) { rec('W7 返回可达', false, String(e).slice(0, 80)); }

  // W8 秒送门店商品「+」加购 → cart+1(菜品不在 items 里,曾静默失效)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    const onMiaosong = await has(page, '[data-action="miaosong.item.addcart"]');
    const c0 = (await st(page, 'cart'))?.length ?? 0;
    if (onMiaosong) await click(page, '[data-action="miaosong.item.addcart"]');
    const c1 = (await st(page, 'cart'))?.length ?? 0;
    rec('W8 秒送加购 cart+1', onMiaosong && c1 === c0 + 1, `cart ${c0}->${c1}`);
  } catch (e) { rec('W8 秒送加购 cart+1', false, String(e).slice(0, 80)); }

  // W9 搜索结果页 地址切换弹层:URL 驱动 + back 可关 + 选中落库
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.search-open"]');
    await click(page, '[data-trigger="search.suggest-open"]');
    const onResult = await has(page, '[data-action="result.address.show"]');
    await click(page, '[data-action="result.address.show"]');
    const opened = await has(page, '[data-action="result.address.select.addr"]');
    const a0 = await st(page, 'selectedAddressId');
    const opts = await page.$$('[data-action="result.address.select.addr"]');
    if (opts[1]) { await opts[1].click(); await sleep(550); }
    const a1 = await st(page, 'selectedAddressId');
    const closed = !(await has(page, '[data-action="result.address.select.addr"]'));
    rec('W9 地址弹层可开/可选/自动关', onResult && opened && closed && a1 !== a0, `${a0}->${a1}`);
  } catch (e) { rec('W9 地址弹层可开/可选/自动关', false, String(e).slice(0, 80)); }

  // W10 筛选抽屉:筛选项可点(曾是死的 span)+ 系统返回键可关
  try {
    await click(page, '[data-action="result.filter.show"]');
    const drawerOpen = await has(page, '[data-action="result.filteroption.toggle"]');
    if (drawerOpen) await click(page, '[data-action="result.filteroption.toggle"]');
    await page.evaluate(() => window.__OS__.handleBack());
    await sleep(500);
    const drawerClosed = !(await has(page, '[data-action="result.filteroption.toggle"]'));
    rec('W10 筛选抽屉可点+返回键可关', drawerOpen && drawerClosed);
  } catch (e) { rec('W10 筛选抽屉可点+返回键可关', false, String(e).slice(0, 80)); }

  // W12 秒送定位地址弹层:可开 / 可选 / 选中落库 + 自动关(曾是写死文案,点不动)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    const canOpen = await has(page, '[data-action="miaosong.address.show"]');
    await click(page, '[data-action="miaosong.address.show"]');
    const opened = await has(page, '[data-action="miaosong.address.select.addr"]');
    const a0 = await st(page, 'selectedAddressId');
    // 选一个与当前不同的地址(弹层按 addresses 顺序渲染,索引对齐),避免误点已选项
    const addrIds = await page.evaluate(() => window.__SIM__.getState().apps.jingdong.addresses.map((a) => a.id));
    const targetIdx = Math.max(0, addrIds.findIndex((id) => id !== a0));
    const opts = await page.$$('[data-action="miaosong.address.select.addr"]');
    if (opts[targetIdx]) { await opts[targetIdx].click(); await sleep(550); }
    const a1 = await st(page, 'selectedAddressId');
    const closed = !(await has(page, '[data-action="miaosong.address.select.addr"]'));
    rec('W12 秒送地址弹层可开/可选/自动关', canOpen && opened && closed && a1 !== a0, `${a0}->${a1}`);
  } catch (e) { rec('W12 秒送地址弹层可开/可选/自动关', false, String(e).slice(0, 80)); }

  // W13 外卖确认页:预约送时间弹层可开可选 + 下单实付>0(曾因空 lines 使订单金额=0)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');           // 门店(SuperShopPage)
    const addB13 = await page.$('[data-action="supershop.item.addcart"]');
    if (addB13) { await addB13.click(); await sleep(400); }             // 空车结算已被拦截,需先加购
    await click(page, '[data-trigger="supershop.checkout-open"]');       // 去结算 → /waimai/confirm
    const onConfirm = await has(page, '[data-action="waimaiconfirm.schedule.show"]');
    // 预约送时间弹层
    await click(page, '[data-action="waimaiconfirm.schedule.show"]');
    const sheetOpen = await has(page, '[data-action="waimaiconfirm.schedule.select.slot"]');
    const slots = await page.$$('[data-action="waimaiconfirm.schedule.select.slot"]');
    if (slots[1]) { await slots[1].click(); await sleep(550); }
    const sheetClosed = !(await has(page, '[data-action="waimaiconfirm.schedule.select.slot"]'));
    // 下单 → 校验最新订单实付>0
    const o0 = (await st(page, 'orders'))?.length ?? 0;
    if (await has(page, '[data-trigger="waimaiconfirm.pay-submit"]')) await click(page, '[data-trigger="waimaiconfirm.pay-submit"]');
    const orders = await st(page, 'orders');
    const newest = orders && orders.length > o0 ? orders[0] : null;
    const paidOk = !!newest && newest.paidAmount > 0 && newest.lines.length > 0;
    rec('W13 外卖预约时间弹层+下单实付>0', onConfirm && sheetOpen && sheetClosed && paidOk, newest ? `paid=${newest.paidAmount} lines=${newest.lines.length}` : '未生成订单');
  } catch (e) { rec('W13 外卖预约时间弹层+下单实付>0', false, String(e).slice(0, 80)); }

  // W14 商品详情→客服会话:发送后消息入库(曾「会话不存在」且发送静默失效)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.item-open"]');
    await click(page, '[data-trigger="detail.cs-open"]');                // 底栏客服 → /message/:chatId
    const notMissing = !(await page.evaluate(() => (document.body.innerText || '').includes('会话不存在')));
    const sumMsgs = () => page.evaluate(() => window.__SIM__.getState().apps.jingdong.chats.reduce((n, c) => n + c.messages.length, 0));
    const m0 = await sumMsgs();
    if (await has(page, '[data-action="chat.message.send"]')) await click(page, '[data-action="chat.message.send"]');
    const m1 = await sumMsgs();
    rec('W14 客服会话可发送(消息入库)', notMissing && m1 > m0, `msgs ${m0}->${m1}`);
  } catch (e) { rec('W14 客服会话可发送(消息入库)', false, String(e).slice(0, 80)); }

  // W16 外卖结算显示的是「真实加购商品」,不是写死的饺子(下单后订单行 == 购物车行)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');          // 超市门店
    const addBtn = await page.$('[data-action="supershop.item.addcart"]');
    if (addBtn) { await addBtn.click(); await sleep(500); }
    const cartTitle = await page.evaluate(() => { const c = window.__SIM__.getState().apps.jingdong.cart.find((x) => x.channel === 'miaosong'); return c ? c.title : null; });
    await click(page, '[data-trigger="supershop.checkout-open"]');      // → /waimai/confirm
    const o0 = (await st(page, 'orders'))?.length ?? 0;
    if (await has(page, '[data-trigger="waimaiconfirm.pay-submit"]')) await click(page, '[data-trigger="waimaiconfirm.pay-submit"]');
    const orders = await st(page, 'orders');
    const newest = orders && orders.length > o0 ? orders[0] : null;
    const ok = !!newest && !!cartTitle && newest.lines.some((l) => l.title === cartTitle) && newest.paidAmount > 0;
    rec('W16 外卖结算=真实加购商品(非写死饺子)', ok, newest ? `line0=${newest.lines[0]?.title} paid=${newest.paidAmount}` : '未生成订单');
  } catch (e) { rec('W16 外卖结算=真实加购商品(非写死饺子)', false, String(e).slice(0, 80)); }

  // W17 外卖预约时间弹层:左日期列 + 右时段列(两列可选)+ 选中回填
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');
    const addB17 = await page.$('[data-action="supershop.item.addcart"]');
    if (addB17) { await addB17.click(); await sleep(400); }             // 先加购再结算(空车已拦截)
    await click(page, '[data-trigger="supershop.checkout-open"]');
    await click(page, '[data-action="waimaiconfirm.schedule.show"]');
    const hasDay = await has(page, '[data-action="waimaiconfirm.schedule.select.day"]');
    const hasSlot = await has(page, '[data-action="waimaiconfirm.schedule.select.slot"]');
    const days = await page.$$('[data-action="waimaiconfirm.schedule.select.day"]');
    if (days[1]) { await days[1].click(); await sleep(300); }            // 选第2个日期
    const slots = await page.$$('[data-action="waimaiconfirm.schedule.select.slot"]');
    if (slots[1]) { await slots[1].click(); await sleep(500); }          // 选时段 → 关闭
    const closed = !(await has(page, '[data-action="waimaiconfirm.schedule.select.slot"]'));
    rec('W17 预约时间双列(日期+时段)可选', hasDay && hasSlot && closed);
  } catch (e) { rec('W17 预约时间双列(日期+时段)可选', false, String(e).slice(0, 80)); }

  // W18 外卖备注·口味偏好弹层:可开 / 口味可选 / 确定关闭
  try {
    await click(page, '[data-action="waimaiconfirm.remark.show"]');
    const remarkOpen = await has(page, '[data-action="waimaiconfirm.remark.toggle.flavor"]');
    if (remarkOpen) await click(page, '[data-action="waimaiconfirm.remark.toggle.flavor"]');
    if (await has(page, '[data-action="waimaiconfirm.remark.confirm"]')) await click(page, '[data-action="waimaiconfirm.remark.confirm"]');
    const remarkClosed = !(await has(page, '[data-action="waimaiconfirm.remark.toggle.flavor"]'));
    rec('W18 备注口味偏好可开/可选/确定关', remarkOpen && remarkClosed);
  } catch (e) { rec('W18 备注口味偏好可开/可选/确定关', false, String(e).slice(0, 80)); }

  // W19 头部返回键在状态栏「下方」(pt-10 与 h-11 已分层,不再被状态栏遮挡):订单详情 TopBar 返回键 y≥30
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.mine-open"]');
    if (await has(page, '[data-trigger="mine.orders-open"]')) await click(page, '[data-trigger="mine.orders-open"]');
    const anyOrder = await page.$('[data-trigger="orders.detail-open"]');
    if (anyOrder) { await anyOrder.click(); await sleep(500); }
    const backBox = await page.evaluate(() => {
      const b = document.querySelector('[data-trigger="system.back"]');
      if (!b) return null; const r = b.getBoundingClientRect(); return { y: r.y, h: r.height };
    });
    rec('W19 详情返回键在状态栏下方(y≥30)', !!backBox && backBox.y >= 30, backBox ? `y=${Math.round(backBox.y)}` : '无返回键');
  } catch (e) { rec('W19 详情返回键在状态栏下方(y≥30)', false, String(e).slice(0, 80)); }

  // W21 秒送搜索 → 门店(秒送)结果页,与首页商品结果不同(出现门店卡/门店加购,而非商品tab)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.search-open"]');           // 带 from=miaosong
    await click(page, '[data-trigger="search.suggest-open"]');            // → /search-result?from=miaosong
    const foodLayout = await has(page, '[data-action="result.food.item.addcart"]') || await has(page, '[data-trigger="result.lifeshop-open"]');
    const productLayout = await has(page, '[data-action="result.tab.select.type"]');
    rec('W21 秒送搜索→门店结果页(非商品页)', foodLayout && !productLayout);
  } catch (e) { rec('W21 秒送搜索→门店结果页(非商品页)', false, String(e).slice(0, 80)); }

  // W22 超市门店购物车弹层:底部购物车图标点开 → 从下弹出 + 返回键可关
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');
    const addBtn = await page.$('[data-action="supershop.item.addcart"]');
    if (addBtn) { await addBtn.click(); await sleep(400); }
    await click(page, '[data-action="supershop.cart.show"]');
    const cartOpen = await has(page, '[data-action="supershop.cart.item.qtystep"]');
    await page.evaluate(() => window.__OS__.handleBack()); await sleep(500);
    const cartClosed = !(await has(page, '[data-action="supershop.cart.item.qtystep"]'));
    rec('W22 超市门店购物车弹层可开+返回可关', cartOpen && cartClosed);
  } catch (e) { rec('W22 超市门店购物车弹层可开+返回可关', false, String(e).slice(0, 80)); }

  // W23 门店购物车「离开再回来不丢」:加购→去结算→返回门店→购物车仍有货
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');
    const addBtn = await page.$('[data-action="supershop.item.addcart"]');
    if (addBtn) { await addBtn.click(); await sleep(400); }
    await click(page, '[data-trigger="supershop.checkout-open"]');        // → /waimai/confirm
    await page.evaluate(() => window.__OS__.handleBack()); await sleep(500); // 返回门店
    const backOnShop = await has(page, '[data-action="supershop.cart.show"]');
    await click(page, '[data-action="supershop.cart.show"]');
    const stillHasItems = await has(page, '[data-action="supershop.cart.item.qtystep"]');
    rec('W23 门店购物车返回后不丢', backOnShop && stillHasItems);
  } catch (e) { rec('W23 门店购物车返回后不丢', false, String(e).slice(0, 80)); }

  // W24 外卖下单成功后「返回回到门店」,不再回到已清空的确认页(pay-submit=replace)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');
    const addBtn = await page.$('[data-action="supershop.item.addcart"]');
    if (addBtn) { await addBtn.click(); await sleep(400); }
    await click(page, '[data-trigger="supershop.checkout-open"]');
    await click(page, '[data-trigger="waimaiconfirm.pay-submit"]');        // → /waimai/success(replace confirm)
    const onSuccess = await has(page, '[data-trigger="waimaisuccess.detail-open"]');
    await page.evaluate(() => window.__OS__.handleBack()); await sleep(500);
    const backOnShop = await has(page, '[data-action="supershop.cart.show"]') || await has(page, '[data-trigger="supershop.checkout-open"]');
    const notConfirm = !(await has(page, '[data-trigger="waimaiconfirm.pay-submit"]'));
    rec('W24 外卖下单后返回到门店(非确认页)', onSuccess && backOnShop && notConfirm);
  } catch (e) { rec('W24 外卖下单后返回到门店(非确认页)', false, String(e).slice(0, 80)); }

  // W25 外卖订单详情=配送态版式(有「联系商家」,与快递订单不同)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');
    const addBtn = await page.$('[data-action="supershop.item.addcart"]');
    if (addBtn) { await addBtn.click(); await sleep(400); }
    await click(page, '[data-trigger="supershop.checkout-open"]');
    await click(page, '[data-trigger="waimaiconfirm.pay-submit"]');
    await click(page, '[data-trigger="waimaisuccess.detail-open"]');       // → 外卖订单详情
    const deliveryLayout = await has(page, '[data-action="orderdetail.contact.action"]');
    rec('W25 外卖订单详情=配送态(联系商家)', deliveryLayout);
  } catch (e) { rec('W25 外卖订单详情=配送态(联系商家)', false, String(e).slice(0, 80)); }

  // W27 每店独立购物车:从某店结算,订单只含该店商品(order.shopId==该店)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');
    const addBtn = await page.$('[data-action="supershop.item.addcart"]');
    if (addBtn) { await addBtn.click(); await sleep(400); }
    const shopIdOfCart = await page.evaluate(() => { const c = window.__SIM__.getState().apps.jingdong.cart.find((x) => x.channel === 'miaosong'); return c ? c.shopId : null; });
    await click(page, '[data-trigger="supershop.checkout-open"]');       // 带 shopId
    const o0 = (await st(page, 'orders'))?.length ?? 0;
    if (await has(page, '[data-trigger="waimaiconfirm.pay-submit"]')) await click(page, '[data-trigger="waimaiconfirm.pay-submit"]');
    const orders = await st(page, 'orders');
    const newest = orders && orders.length > o0 ? orders[0] : null;
    rec('W27 每店独立购物车(订单归属本店)', !!newest && !!shopIdOfCart && newest.shopId === shopIdOfCart, newest ? `order.shopId=${newest.shopId}` : '未生成订单');
  } catch (e) { rec('W27 每店独立购物车(订单归属本店)', false, String(e).slice(0, 80)); }

  // W28 空购物车点「去结算」无反应(不再跳到兜底饺子结算页)
  try {
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    await click(page, '[data-trigger="home.miaosong-open"]');
    await click(page, '[data-trigger="miaosong.shop-open"]');
    // 清空本店购物车
    if (await has(page, '[data-action="supershop.cart.show"]')) {
      await click(page, '[data-action="supershop.cart.show"]');
      if (await has(page, '[data-action="supershop.cart.clear"]')) await click(page, '[data-action="supershop.cart.clear"]');
      await page.evaluate(() => window.__OS__.handleBack()); await sleep(400);
    }
    // 空车时结算按钮不再是导航触发(无 data-trigger),点了不跳转
    const hasCheckoutTrigger = await has(page, '[data-trigger="supershop.checkout-open"]');
    const stillOnShop = await has(page, '[data-action="supershop.item.addcart"]');
    rec('W28 空车结算无反应(不跳饺子页)', !hasCheckoutTrigger && stillOnShop);
  } catch (e) { rec('W28 空车结算无反应(不跳饺子页)', false, String(e).slice(0, 80)); }

  // W29 国补页头部不再「双份 pt-10 下沉」:其 TopBar 返回键 y 应与「单份 pt-10 的订单详情页」基本一致
  // (双份会比单份多出约一个状态栏高度)。用同一 run 内的订单详情作参照,避免 CSS zoom 带来的绝对像素漂移。
  try {
    const backY = async () => page.evaluate(() => { const b = document.querySelector('[data-trigger="system.back"]'); return b ? b.getBoundingClientRect().y : null; });
    await reset();
    await click(page, '[data-trigger="tabbar.mine-open"]');
    if (await has(page, '[data-trigger="mine.orders-open"]')) await click(page, '[data-trigger="mine.orders-open"]');
    const od = await page.$('[data-trigger="orders.detail-open"]');
    if (od) { await od.click(); await sleep(500); }
    const refY = await backY();                                          // 单份 pt-10 参照(订单详情)
    await reset();
    await click(page, '[data-trigger="tabbar.home-open"]');
    if (await has(page, '[data-trigger="home.guobu-open"]')) await click(page, '[data-trigger="home.guobu-open"]');
    const gY = await backY();
    const ok = refY != null && gY != null && Math.abs(gY - refY) <= 12;  // 与参照同高=单份,不是双份
    rec('W29 国补页头部与单份pt-10页等高(非双份)', ok, `guobu=${gY && Math.round(gY)} ref=${refY && Math.round(refY)}`);
  } catch (e) { rec('W29 国补页头部与单份pt-10页等高(非双份)', false, String(e).slice(0, 80)); }

  rec('W30 全程无 console error / pageerror', errors.length === 0, errors.slice(0, 4).join(' | '));

  await browser.close();
  const failed = results.filter((r) => !r[1]);
  console.log(`\n结果: ${results.length - failed.length}/${results.length} 通过`);
  if (failed.length) { console.log('失败:', failed.map((f) => f[0]).join(', ')); process.exit(1); }
}
main().catch((e) => { console.error('走查异常:', e); process.exit(1); });
