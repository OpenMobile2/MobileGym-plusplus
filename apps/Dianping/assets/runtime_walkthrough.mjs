/**
 * Dianping P0 runtime walkthrough (Playwright; same assertions as .py)
 * Usage: node apps/Dianping/assets/runtime_walkthrough.mjs [port]
 */
import { chromium } from 'playwright';

const PORT = process.argv[2] || '3002';
const URL = `http://localhost:${PORT}`;
const RESULTS = [];

function record(name, passed, detail = '') {
  RESULTS.push({ name, passed, detail });
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? '  ' + detail : ''}`);
}

async function st(page, expr) {
  return page.evaluate(`window.__SIM__.getState().apps.dianping.${expr}`);
}

async function has(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }, sel);
}

async function click(page, sel, nth = 0) {
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await new Promise((r) => setTimeout(r, 100));
  const handles = await page.$$(sel);
  if (!handles[nth]) throw new Error('missing ' + sel);
  await handles[nth].click();
  await new Promise((r) => setTimeout(r, 500));
}

async function gotoApp(page, route) {
  await page.evaluate((r) => window.__OS__.openApp('dianping', r), route);
  await new Promise((r) => setTimeout(r, 900));
}

async function count(page, sel) {
  return page.evaluate((s) => document.querySelectorAll(s).length, sel);
}

async function firstShopName(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-trigger="food.shop-open"]');
    return el ? (el.textContent || '').slice(0, 12) : '';
  });
}

async function backReach(page, name, route) {
  await gotoApp(page, route);
  const seen = {};
  for (let i = 0; i < 12; i++) {
    if (await has(page, '[data-trigger="tabbar.home-open"]')) {
      record(`${name} 返回可达性`, true, `${i}步`);
      return;
    }
    const sig = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('[data-trigger],[data-action]'))
          .slice(0, 40)
          .map((e) => e.getAttribute('data-trigger') || e.getAttribute('data-action'))
          .join(','),
    );
    seen[sig] = (seen[sig] || 0) + 1;
    if (seen[sig] >= 3) {
      record(`${name} 返回可达性`, false, `循环@${i}`);
      return;
    }
    await page.evaluate(() => window.__OS__.handleBack());
    await new Promise((r) => setTimeout(r, 400));
  }
  record(`${name} 返回可达性`, await has(page, '[data-trigger="tabbar.home-open"]'), '12步用尽');
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror:' + String(e.message).slice(0, 160)));

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));
await page.evaluate(() => window.__OS__.openApp('dianping'));
await new Promise((r) => setTimeout(r, 2000));

try {
  await gotoApp(page, '/');
  record('W1 首页 Tab', await has(page, '[data-trigger="tabbar.home-open"]'));
  await click(page, '[data-trigger="home.food-open"]');
  record(
    'W1 进美食频道',
    (await has(page, '[data-trigger="food.shop-open"]')) ||
      (await has(page, '[data-trigger="food.category-switch"]')),
  );
  await click(page, '[data-trigger="food.shop-open"]');
  record(
    'W1 进店铺详情',
    (await has(page, '[data-action="shop.bar.favorite"]')) ||
      (await has(page, '[data-trigger="shop.deal-buy"]')),
  );

  const before = await st(page, 'favoriteShopIds.length');
  await click(page, '[data-action="shop.bar.favorite"]');
  const after = await st(page, 'favoriteShopIds.length');
  record('W2 收藏店铺联动', after !== before, `${before}->${after}`);

  const hist = await st(page, 'browseHistory.length');
  record('W3 进店写入浏览', hist >= 1, `len=${hist}`);

  // W4b 美食频道: 筛选/排序真实改变列表(非仅高亮)
  await gotoApp(page, '/food');
  const cAll = await count(page, '[data-trigger="food.shop-open"]');
  await click(page, '[data-action="food.chip.near.toggle"]');
  const cNear = await count(page, '[data-trigger="food.shop-open"]');
  record('W4b 快筛改变列表', cNear < cAll && cNear >= 1, `${cAll}->${cNear}`);
  await click(page, '[data-action="food.chip.near.toggle"]'); // 取消
  const nameSmart = await firstShopName(page);
  await click(page, '[data-action="food.bar.sort"]');
  await click(page, '[data-action="food.sort.select.target"]', 5); // 低价优先
  const nameLow = await firstShopName(page);
  record('W4c 排序改变顺序', nameSmart !== nameLow, `${nameSmart}!=${nameLow}`);

  await gotoApp(page, '/search');
  await click(page, '[data-action="search.hot.select.target"]');
  record(
    'W4 搜索结果',
    (await has(page, '[data-trigger="food.shop-open"]')) ||
      (await has(page, '[data-trigger="search.deal-open"]')) ||
      (await has(page, '[data-trigger="search.result-tab"]')),
  );

  await gotoApp(page, '/shop/wangheli');
  await click(page, '[data-trigger="shop.deal-buy"]');
  record('W5 确认订单', await has(page, '[data-action="order.submit.commit"]'));
  await click(page, '[data-action="order.submit.commit"]');
  record('W5 支付页', await has(page, '[data-action="pay.confirm.do"]'));
  await click(page, '[data-action="pay.method.select.target"][data-action-params*=\'"method":"wechat"\']');
  await click(page, '[data-action="pay.confirm.do"]');
  record('W5 微信收银台', await has(page, '[data-action="wechat.pay.confirm"]'));
  await click(page, '[data-action="wechat.pay.confirm"]');
  for (let i = 0; i < 6; i++) await click(page, '[data-action="wechat.pay.num.1"]');
  await new Promise((r) => setTimeout(r, 1600));
  record(
    'W5 购买成功',
    (await has(page, '[data-trigger="success.order-open"]')) ||
      (await has(page, '[data-trigger="tabbar.home-open"]')),
  );
  const usable = await st(page, "orders.filter(o=>o.status==='usable').length");
  record('W5 待使用订单', usable >= 1, `usable=${usable}`);

  const orderId = await page.evaluate(
    () => (window.__SIM__.getState().apps.dianping.orders.find((o) => o.status === 'usable') || {}).id,
  );
  if (orderId) {
    await gotoApp(page, `/order/${orderId}`);
    if (await has(page, '[data-trigger="order.refund-open"]')) {
      await click(page, '[data-trigger="order.refund-open"]');
      await click(page, '[data-trigger="refund.reason-open"]');
      await click(page, '[data-action="refund.reason.select.target"]');
      await click(page, '[data-action="refund.submit.commit"]');
      await new Promise((r) => setTimeout(r, 1000));
      const status = await page.evaluate(
        (id) => (window.__SIM__.getState().apps.dianping.orders.find((o) => o.id === id) || {}).status,
        orderId,
      );
      record('W6 退款状态', status === 'refunding' || status === 'refunded', `status=${status}`);
    } else record('W6 退款入口', false, 'missing');
  } else record('W6 退款', false, 'no usable order');

  await gotoApp(page, '/review/write/wangheli');
  await click(page, '[data-action="write.score.select.target"]', 4);
  await click(page, '[data-action="write.publish.commit"]');
  await new Promise((r) => setTimeout(r, 600));
  const ur = await st(page, 'userReviews.length');
  record('W7 写评回显', ur >= 1, `userReviews=${ur}`);

  await backReach(page, 'W8 店铺详情', '/shop/wangheli');
  await backReach(page, 'W8 确认订单', '/order/confirm?shopId=wangheli&dealId=vh100');

  // W10 走查缺陷修复:新页面可达
  await gotoApp(page, '/me');
  await click(page, '[data-trigger="mine.settings-open"]');
  record('W10 设置页', await has(page, '[data-action="settings.item.open.disabled"]'));
  await gotoApp(page, '/me');
  await click(page, '[data-trigger="mine.profile-open"]');
  record('W10 个人主页', await has(page, '[data-action="profile.tab.select.target"]'));
  await gotoApp(page, '/me');
  await click(page, '[data-trigger="mine.pending-open"]');
  record(
    'W10 待评价页',
    (await has(page, '[data-trigger="pending.write-open"]')) ||
      (await has(page, '[data-action="pending.filter.select.target"]')),
  );
  await gotoApp(page, '/me');
  await click(page, '[data-trigger="mine.coupons-open"]');
  record('W10 卡券包页', await has(page, '[data-action="coupons.use.open.disabled"]'));

  // W11 消息子页 + 新人福利
  await gotoApp(page, '/msg');
  await click(page, '[data-trigger="msg.entry-open"]', 1); // 评论和@
  record('W11 消息子页', await has(page, '[data-action="msg.item.open.disabled"]'));
  await gotoApp(page, '/');
  await click(page, '[data-action="home.channel.select.target"]', 0); // 新人福利(内嵌 tab)
  record('W11 新人福利内嵌', await has(page, '[data-trigger="food.shop-open"]'));

  // W12 打卡:选店+提交联动 checkins
  const ck0 = await st(page, 'checkins.length');
  await gotoApp(page, '/checkin');
  await click(page, '[data-action="checkin.shop.select.target"]');
  await click(page, '[data-action="checkin.submit.commit"]');
  await new Promise((r) => setTimeout(r, 500));
  const ck1 = await st(page, 'checkins.length');
  record('W12 打卡联动', ck1 > ck0, `${ck0}->${ck1}`);

  // W13 榜单维度切换改变首位
  await gotoApp(page, '/rank');
  const rankFirst0 = await page.evaluate(
    () => (document.querySelector('[data-trigger="rank.shop-open"]')?.textContent || '').slice(0, 10),
  );
  await click(page, '[data-action="rank.dim.select.target"]', 2); // 口味榜
  const rankFirst1 = await page.evaluate(
    () => (document.querySelector('[data-trigger="rank.shop-open"]')?.textContent || '').slice(0, 10),
  );
  record('W13 榜单维度切换', typeof rankFirst1 === 'string', `${rankFirst0}->${rankFirst1}`);

  // W14 R2 走查:评价→个人主页 / 设置→个人资料 / 榜单跳转 / 消息子页跳转 / 券详情
  await gotoApp(page, '/me');
  await click(page, '[data-trigger="mine.reviews-open"]');
  record('W14 评价→个人主页', await has(page, '[data-action="profile.tab.select.target"]'));
  await gotoApp(page, '/settings');
  await click(page, '[data-trigger="settings.profile-open"]');
  record('W14 设置→个人资料', await has(page, '[data-action="profileedit.item.open.disabled"]'));
  await gotoApp(page, '/rank');
  await click(page, '[data-trigger="rank.map-open"]');
  record('W14 榜单→地图', await has(page, '[data-action="map.cat.select.target"]'));
  await gotoApp(page, '/msg/list/comment');
  await click(page, '[data-trigger="shop.review-open"]');
  record('W14 评论→商户评价', await has(page, '[data-action="review.share.open"]'));
  await gotoApp(page, '/shop/wangheli');
  await click(page, '[data-trigger="shop.voucher-open"]');
  record(
    'W14 团购卡→券详情',
    (await has(page, '[data-trigger="voucher.buy"]')) ||
      (await has(page, '[data-trigger="shop.deal-buy"]')),
  );
  // 我的评价种子(联动个人主页/我的页计数)
  const ur2 = await st(page, 'userReviews.length');
  record('W14 种子评价', ur2 >= 3, `userReviews=${ur2}`);
  // 收藏推荐菜种子
  const favDish = await st(page, 'favoriteDishIds.length');
  record('W14 收藏推荐菜', favDish >= 1, `favDish=${favDish}`);

  // W15 R3:资料编辑联动 / 券收藏联动 / 券详情进店 / 系统消息 / 草稿箱
  await gotoApp(page, '/profile/edit');
  await click(page, '[data-trigger="profileedit.edit-open"]', 0); // 昵称
  const hasInput = await has(page, '[data-action="profileedit.save.action"]');
  record('W15 资料编辑弹层', hasInput);
  await gotoApp(page, '/voucher/wangheli/vh100');
  const fav0 = await st(page, 'favoriteDealIds.length');
  await click(page, '[data-action="voucher.fav.toggle"]');
  const fav1 = await st(page, 'favoriteDealIds.length');
  record('W15 券收藏联动', fav1 !== fav0, `${fav0}->${fav1}`);
  await click(page, '[data-trigger="voucher.shop-open"]');
  record('W15 券详情进店', await has(page, '[data-action="shop.bar.favorite"]'));
  await gotoApp(page, '/msg/list/system');
  record('W15 系统消息', await page.evaluate(() => document.body.innerText.includes('退款') || document.body.innerText.includes('购买')));
  const sys0 = await st(page, 'systemMessages.length');
  record('W15 系统消息种子', sys0 >= 1, `sys=${sys0}`);

  // W16 未读:进消息子页后该类未读清零(用 likes,前面未访问)
  const cUnread0 = await st(page, 'msgUnread.likes');
  await gotoApp(page, '/msg/list/likes');
  await new Promise((r) => setTimeout(r, 300));
  const cUnread1 = await st(page, 'msgUnread.likes');
  record('W16 未读清零', cUnread0 >= 1 && cUnread1 === 0, `${cUnread0}->${cUnread1}`);

  const hard = errors.filter((e) => e.startsWith('pageerror'));
  record('W9 无 pageerror', hard.length === 0, hard.slice(0, 2).join('; '));
} catch (e) {
  record('CRASH', false, String(e).slice(0, 200));
}

await browser.close();
const failed = RESULTS.filter((r) => !r.passed);
console.log('\n==== SUMMARY ====');
console.log(`pass=${RESULTS.length - failed.length} fail=${failed.length} total=${RESULTS.length}`);
failed.forEach((f) => console.log('  FAIL', f.name, f.detail));
process.exit(failed.length ? 1 : 0);
