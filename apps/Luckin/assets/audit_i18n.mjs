import puppeteer from 'puppeteer';

const URL = process.env.LUCKIN_URL || 'http://127.0.0.1:3007';
const routes = [
  '/', '/home', '/search', '/product/orange-c', '/order/confirm', '/order/o26071301',
  '/order/o26071301/success', '/orders', '/store/picker', '/address', '/address/edit',
  '/member', '/member/level', '/member/beans', '/coupons', '/coupons/center',
  '/card/coffee', '/card/gift', '/alliance', '/calendar', '/instant',
  '/instant/instant-01', '/instant/cart', '/instant/service', '/instant/purchases',
  '/mine', '/mine/profile', '/messages', '/wallet', '/invoice', '/settings',
];

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  timeout: 120000,
});
const page = await browser.newPage();
page.setDefaultTimeout(12000);
await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error' && !/favicon|Failed to load resource.*404/i.test(message.text())) {
    errors.push(`console: ${message.text()}`);
  }
});

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.__OS__?.locale));
  await page.evaluate(() => window.__OS__.locale.setLocale('en'));

  const failures = [];
  for (const route of routes) {
    await page.evaluate((target) => window.__OS__.openApp('luckin', target), route);
    await page.waitForSelector('[data-app-root="luckin"]');
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await page.evaluate(() => {
      const root = document.querySelector('[data-app-root="luckin"]');
      const text = root?.textContent ?? '';
      const chinese = text.match(/[\u3400-\u9fff]+/g) ?? [];
      const brokenImages = [...(root?.querySelectorAll('img') ?? [])]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute('alt') ?? '(no alt)');
      return { chinese: [...new Set(chinese)], brokenImages };
    });
    if (result.chinese.length || result.brokenImages.length) failures.push({ route, ...result });
  }

  if (failures.length || errors.length) {
    throw new Error(JSON.stringify({ failures, errors }, null, 2));
  }
  console.log(`OK English runtime audit: ${routes.length}/${routes.length} routes, 0 CJK fragments, 0 broken images`);
} finally {
  await page.evaluate(() => window.__OS__?.locale?.setLocale('zh-Hans')).catch(() => {});
  await browser.close();
}
