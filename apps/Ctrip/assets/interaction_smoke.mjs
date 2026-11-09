import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.env.CTRIP_URL || 'http://127.0.0.1:3007';
const ROOT = path.resolve('../..');
const OUT = path.join(ROOT, 'docs/ctrip-replication');
const cases = [
  { action: 'carBooking.driver.toggle', route: '/car/c_tesla/booking', index: 1 },
  { action: 'carHome.tab.select.pickup', route: '/car/home', index: 1 },
  { action: 'flightCalendar.direct.toggle', route: '/flight/calendar', index: 0 },
  { action: 'flightDetail.addon.toggle', route: '/flight/f_ho1167', index: 1 },
  { action: 'flightSearch.trip.select.oneway', route: '/flight/search', index: 1 },
  { action: 'home.ai.wontfix', route: '/', index: 0 },
  { action: 'home.ops.wontfix', route: '/', index: 0 },
  { action: 'hotelBooking.req.select.elevator', route: '/hotel/h_atour/booking', index: 0 },
  { action: 'hotelReview.filter.select.withpic', route: '/hotel/h_atour/review', index: 1 },
  { action: 'hotelRoom.filter.select.twinbed', route: '/hotel/h_atour/rooms', index: 1 },
  { action: 'hotelSearch.tab.select.domestic', route: '/hotel/search', index: 1 },
  { action: 'orderCancel.reason.select.changed', route: '/orders/o1/cancel', index: 1 },
  { action: 'ticketList.tab.select.tickets', route: '/ticket/list', index: 1 },
];

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  timeout: 120000,
});
const page = await browser.newPage();
page.setDefaultTimeout(20000);
await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((resolve) => setTimeout(resolve, 1000));

const results = [];
for (const item of cases) {
  await page.evaluate(() => window.__OS__.closeApp('ctrip'));
  await new Promise((resolve) => setTimeout(resolve, 80));
  await page.evaluate((route) => window.__OS__.openApp('ctrip', route), item.route);
  await page.waitForSelector('[data-app-root="ctrip"]');
  await new Promise((resolve) => setTimeout(resolve, 350));
  const selector = `[data-action="${item.action}"]`;
  const handles = await page.$$(selector);
  const target = handles[item.index] ?? handles[0];
  const before = await page.$eval('[data-app-root="ctrip"]', (root) => root.innerHTML);
  const errorStart = pageErrors.length;
  if (target) {
    await target.click();
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
  const after = await page.$eval('[data-app-root="ctrip"]', (root) => root.innerHTML);
  const errors = pageErrors.slice(errorStart);
  const changed = before !== after;
  const ok = Boolean(target) && changed && errors.length === 0;
  results.push({
    ...item,
    elements: handles.length,
    targetFound: Boolean(target),
    changed,
    errors,
    ok,
  });
  console.log(`${ok ? 'OK' : 'FAIL'} ${item.action} elements=${handles.length} changed=${changed}`);
}

await browser.close();
const failed = results.filter((result) => !result.ok);
const report = {
  generatedAt: new Date().toISOString(),
  actions: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results,
};
await fs.writeFile(path.join(OUT, 'interaction-smoke.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(
  path.join(OUT, 'interaction-smoke.md'),
  [
    '# Ctrip interaction smoke',
    '',
    `- Historical NO_EFFECT actions checked: ${report.actions}`,
    `- Passed: ${report.passed}`,
    `- Failed: ${report.failed}`,
    '',
    ...results.map((item) => `- ${item.ok ? '✅' : '❌'} \`${item.action}\`: elements=${item.elements}, DOM changed=${item.changed}`),
    '',
  ].join('\n'),
  'utf8',
);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exit(1);
}
console.log(`OK interaction smoke: ${results.length}/${results.length}`);
process.exit(0);
