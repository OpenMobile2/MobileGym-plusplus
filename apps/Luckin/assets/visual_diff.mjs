import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.env.LUCKIN_URL || 'http://127.0.0.1:3007';
const ROOT = path.resolve('../..');
const OUT = path.join(ROOT, 'docs/luckin-replication/visual-diff');
await fs.mkdir(OUT, { recursive: true });

const pages = [
  ['menu', '/', 'IMG_318.jpg'], ['home', '/home', 'IMG_342.jpg'], ['search', '/search', null], ['product', '/product/orange-c', 'IMG_319.jpg'],
  ['order-confirm', '/order/confirm', 'IMG_334.jpg'], ['order-detail', '/order/o26071301', 'IMG_399.jpg'], ['order-success', '/order/o26071301/success', null], ['orders', '/orders', 'IMG_369.jpg'],
  ['store-picker', '/store/picker', 'IMG_335.jpg'], ['address', '/address', 'IMG_331.jpg'], ['address-edit', '/address/edit', 'IMG_332.jpg'],
  ['member', '/member', 'IMG_365.jpg'], ['member-level', '/member/level', 'IMG_362.jpg'], ['member-beans', '/member/beans', 'IMG_363.jpg'],
  ['coupons', '/coupons', 'IMG_375.jpg'], ['coupon-center', '/coupons/center', 'IMG_325.jpg'], ['coffee-card', '/card/coffee', 'IMG_368.jpg'], ['gift-card', '/card/gift', 'IMG_358.jpg'],
  ['alliance', '/alliance', 'IMG_352.jpg'], ['calendar', '/calendar', 'IMG_353.jpg'], ['instant', '/instant', 'IMG_348.jpg'], ['instant-detail', '/instant/instant-01', 'IMG_354.jpg'],
  ['instant-cart', '/instant/cart', null], ['instant-service', '/instant/service', 'IMG_359.jpg'], ['instant-purchases', '/instant/purchases', 'IMG_366.jpg'],
  ['mine', '/mine', 'IMG_367.jpg'], ['profile', '/mine/profile', 'IMG_368.jpg'], ['messages', '/messages', 'IMG_386.jpg'], ['wallet', '/wallet', null], ['invoice', '/invoice', null], ['settings', '/settings', null],
];

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
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((resolve) => setTimeout(resolve, 1200));
const completed = [];
for (const [name, route, evidence] of pages) {
  await page.evaluate((target) => window.__OS__.openApp('luckin', target), route);
  await new Promise((resolve) => setTimeout(resolve, name === 'menu' ? 4000 : 900));
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-app-root="luckin"]');
    if (!root) return false;
    return [...root.querySelectorAll('img')].every((image) => image.complete && image.naturalWidth > 0);
  }, { timeout: 20000 });
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  completed.push([name, route, evidence]);
  console.log(`OK ${name} ${route}`);
}
await browser.close();

const rows = completed.map(([name, route, evidence]) => `<section><header><b>${name}</b><code>${route}</code></header><div class="pair"><figure><figcaption>模拟版</figcaption><img src="${name}.png"></figure><figure><figcaption>真机证据</figcaption>${evidence ? `<img src="../../../luckin_images/${evidence}">` : '<div class="none">inferred / 无直接截图</div>'}</figure></div></section>`).join('');
const html = `<!doctype html><meta charset="utf-8"><title>Luckin visual diff</title><style>body{font-family:system-ui;background:#f3f4f6;margin:0;padding:16px;color:#222}h1{font-size:20px}section{background:#fff;border-radius:12px;padding:12px;margin:12px 0}header{display:flex;gap:16px;align-items:center}code{color:#1c2e9c}.pair{display:flex;gap:12px;margin-top:10px;overflow:auto}figure{margin:0}figcaption{text-align:center;font-size:12px;color:#777;margin-bottom:4px}img,.none{width:260px;border:1px solid #eee;border-radius:8px;display:block}.none{height:120px;display:flex;align-items:center;justify-content:center;color:#aaa}</style><h1>瑞幸逐页视觉对照 · ${completed.length} routes</h1><p>左侧为 360×800 模拟器截图，右侧为对应真机证据；inferred 页面按 design-tokens 生成。</p>${rows}`;
await fs.writeFile(path.join(OUT, 'index.html'), html, 'utf8');
if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
console.log(`OK visual diff: ${completed.length} pages -> ${OUT}`);
