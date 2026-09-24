import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.env.LUCKIN_URL || 'http://127.0.0.1:3007';
const OUT = path.resolve('../..', 'docs/luckin-replication/run-screens');
await fs.mkdir(OUT, { recursive: true });

console.log('launch browser');
const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  timeout: 120000,
});
const page = await browser.newPage();
page.setDefaultTimeout(12000);
await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error' && !/favicon|WMR|cdn\/themes|Failed to load resource.*404/i.test(message.text())) errors.push(`console: ${message.text()}`);
});

async function appState() {
  return page.evaluate(() => window.__SIM__?.getState()?.apps?.luckin ?? null);
}

async function click(selector, index = 0) {
  await page.waitForSelector(selector, { visible: true, timeout: 8000 });
  const nodes = await page.$$(selector);
  if (!nodes[index]) throw new Error(`missing selector ${selector}[${index}]`);
  await nodes[index].click();
  await new Promise((resolve) => setTimeout(resolve, 280));
}

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

try {
  console.log('open simulator');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  console.log('open luckin');
  await page.evaluate(() => window.__OS__.openApp('luckin'));
  await page.waitForSelector('[data-app-root="luckin"]', { timeout: 15000 });
  await shot('01-menu');
  console.log('menu ready');
  const initial = await appState();
  if (!initial) throw new Error('luckin store was not registered');

  // Observable select state: pickup -> delivery.
  await click('[data-action="menu.mode.select.target"]', 1);
  const delivery = await appState();
  if (delivery.mode !== 'delivery') throw new Error(`menu.mode select failed: ${delivery.mode}`);
  await click('[data-action="menu.mode.select.target"]', 0);

  // Product customization and cart mutation.
  await click('[data-trigger="menu.product-open"]', 0);
  console.log('product ready');
  await shot('02-product');
  const cartBefore = (await appState()).cart.reduce((sum, item) => sum + item.quantity, 0);
  await click('[data-action="product.cart.add"]');
  const cartAfter = (await appState()).cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartAfter <= cartBefore) throw new Error(`cart mutation failed: ${cartBefore} -> ${cartAfter}`);
  await page.evaluate(() => window.__OS__.handleBack());
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Checkout -> order detail. Assert order list mutation.
  await click('[data-trigger="menu.checkout-open"]');
  console.log('order confirm ready');
  await shot('03-order-confirm');
  await click('[data-action="order.storeConfirm.panel.open"]');
  await page.waitForSelector('[data-action="storeConfirm.store.accept"]', { visible: true });
  await click('[data-action="storeConfirm.mute.toggle"]');
  await click('[data-action="storeConfirm.store.accept"]');
  const ordersBefore = (await appState()).orders.length;
  await click('[data-trigger="order.submit-open"]');
  const ordersAfter = (await appState()).orders.length;
  if (ordersAfter !== ordersBefore + 1) throw new Error(`order submit failed: ${ordersBefore} -> ${ordersAfter}`);
  await shot('04-order-detail');

  // Open cashier and input any 6 digits -> success.
  await click('[data-trigger="orderDetail.pay-open"]');
  console.log('pay panel ready');
  await shot('05-pay');
  for (const digit of ['1', '2', '3', '4', '5', '6']) {
    const handle = await page.evaluateHandle((d) => [...document.querySelectorAll('[data-action="pay.password.input"]')].find((el) => el.textContent === d), digit);
    const element = handle.asElement();
    if (!element) throw new Error(`missing pay key ${digit}`);
    await element.click();
    await handle.dispose();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await page.waitForSelector('[data-trigger="success.home-open"]', { timeout: 8000 });
  await shot('06-success');

  // Return to root and verify membership redemption state.
  await click('[data-trigger="success.home-open"]');
  await click('[data-trigger="tabbar.member-open"]');
  console.log('member ready');
  await click('[data-action="member.redeem.open"]');
  await page.type('[data-action="memberRedeem.code.input"]', 'LUCKIN2026');
  await new Promise((resolve) => setTimeout(resolve, 250));
  let memberDraft = await appState();
  await shot('07-member-redeem');
  if (!memberDraft.flags.memberAgree) {
    await page.$eval('[data-action="memberRedeem.agree.toggle"]', (element) => element.click());
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  memberDraft = await appState();
  if (memberDraft.inputs.redeem !== 'LUCKIN2026' || !memberDraft.flags.memberAgree) {
    throw new Error(`member draft invalid: code=${memberDraft.inputs.redeem} agree=${memberDraft.flags.memberAgree}`);
  }
  await page.$eval('[data-action="memberRedeem.form.submit"]', (element) => element.click());
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (!(await appState()).memberActive) throw new Error('member redemption did not activate member');
  await shot('07-member');

  // Instant cart mutation.
  await click('[data-trigger="tabbar.instant-open"]');
  console.log('instant ready');
  await click('[data-trigger="instant.detail-open"]', 0);
  const instantBefore = (await appState()).instantCart.reduce((sum, item) => sum + item.quantity, 0);
  await click('[data-action="instantDetail.cart.add"]');
  const instantAfter = (await appState()).instantCart.reduce((sum, item) => sum + item.quantity, 0);
  if (instantAfter <= instantBefore) throw new Error('instant cart add did not mutate state');
  await shot('08-instant-detail');

  // Back reachability: details -> instant root -> previous root.
  await page.evaluate(() => window.__OS__.handleBack());
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (!(await page.$('[data-trigger="instant.detail-open"]'))) throw new Error('back did not reach instant root');

  // Newly added orphan-page entrances are all reachable from Mine.
  await click('[data-trigger="tabbar.mine-open"]');
  for (const trigger of ['mine.giftCard-open', 'mine.alliance-open']) {
    await click(`[data-trigger="${trigger}"]`);
    await page.evaluate(() => window.__OS__.handleBack());
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await click('[data-trigger="mine.calendar-open"]');
  await click('[data-trigger="calendar.gift-open"]');
  await page.evaluate(() => window.__OS__.handleBack());
  await new Promise((resolve) => setTimeout(resolve, 250));
  await page.evaluate(() => window.__OS__.handleBack());
  await new Promise((resolve) => setTimeout(resolve, 250));

  console.log('OK runtime: select state, cart, store confirm, order, payment, member, instant cart, orphan-page entrances, and back reachability passed');
  console.log(`screens=${OUT}`);
  if (errors.length) throw new Error(`runtime console errors:\n${errors.join('\n')}`);
} finally {
  await browser.close();
}
