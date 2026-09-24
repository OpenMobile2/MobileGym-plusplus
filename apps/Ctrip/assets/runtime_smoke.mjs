import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.env.CTRIP_URL || 'http://127.0.0.1:3007';
const ROOT = path.resolve('../..');
const APP_ROOT = path.join(ROOT, 'trial_apps/mobilegym/apps/Ctrip');
const OUT = path.join(ROOT, 'docs/ctrip-replication');
const declarations = JSON.parse(
  await fs.readFile(path.join(APP_ROOT, 'assets/_routes.json'), 'utf8'),
);

const sampleRoute = (nodeId, template) => {
  if (nodeId.startsWith('hotel.')) return template.replace(':id', 'h_atour');
  if (nodeId.startsWith('ticket.')) return template.replace(':id', 'a_disney');
  if (nodeId.startsWith('car.')) return template.replace(':id', 'c_tesla');
  if (nodeId.startsWith('train.')) return template.replace(':no', 't_g986');
  if (nodeId.startsWith('flight.')) return template.replace(':no', 'f_ho1167');
  if (nodeId.startsWith('orders.')) return template.replace(':id', 'o1');
  return template.replace(':city', encodeURIComponent('上海'));
};

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  timeout: 120000,
});
const page = await browser.newPage();
page.setDefaultTimeout(20000);
await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });
let activeNode = 'boot';
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push({ nodeId: activeNode, error: error.message }));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((resolve) => setTimeout(resolve, 1000));

const results = [];
for (const [nodeId, template] of declarations) {
  activeNode = nodeId;
  const route = sampleRoute(nodeId, template);
  const errorStart = pageErrors.length;
  await page.evaluate((target) => window.__OS__.openApp('ctrip', target), route);
  try {
    await page.waitForSelector('[data-app-root="ctrip"]', { timeout: 15000 });
  } catch {
    // The state snapshot below records root=false with route context.
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  const state = await page.evaluate(() => {
    const root = document.querySelector('[data-app-root="ctrip"]');
    if (!root) return { root: false, textLength: 0, brokenImages: -1, errorBoundary: false };
    const images = [...root.querySelectorAll('img')];
    return {
      root: true,
      textLength: (root.textContent || '').trim().length,
      brokenImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
      errorBoundary: /出错|failed to load|application error/i.test(root.textContent || ''),
    };
  });
  const errors = pageErrors.slice(errorStart);
  const ok = state.root && state.textLength > 0 && state.brokenImages === 0 && !state.errorBoundary && errors.length === 0;
  results.push({ nodeId, route, ok, ...state, errors });
  console.log(`${ok ? 'OK' : 'FAIL'} ${nodeId} ${route}`);
}

await browser.close();
const failed = results.filter((result) => !result.ok);
const report = {
  generatedAt: new Date().toISOString(),
  url: URL,
  routes: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results,
};
await fs.writeFile(path.join(OUT, 'runtime-smoke.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(
  path.join(OUT, 'runtime-smoke.md'),
  [
    '# Ctrip runtime smoke',
    '',
    `- Routes: ${report.routes}`,
    `- Passed: ${report.passed}`,
    `- Failed: ${report.failed}`,
    '',
    ...(failed.length
      ? failed.map((item) => `- ❌ \`${item.nodeId}\` \`${item.route}\`: ${JSON.stringify(item)}`)
      : ['- ✅ 所有声明路由均挂载成功、无运行时异常、无破图。']),
    '',
  ].join('\n'),
  'utf8',
);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exit(1);
}
console.log(`OK runtime smoke: ${results.length}/${results.length}`);
process.exit(0);
