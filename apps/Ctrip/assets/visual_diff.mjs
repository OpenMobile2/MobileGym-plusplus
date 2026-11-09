import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.env.CTRIP_URL || 'http://127.0.0.1:3007';
const ROOT = path.resolve('../..');
const OUT = path.join(ROOT, 'docs/ctrip-replication/visual-diff');
await fs.mkdir(OUT, { recursive: true });

const pages = [
  ['home', '/', '微信图片_20260630111351_418_1.jpg'],
  ['hotel-search', '/hotel/search', '微信图片_20260630111355_420_1.jpg'],
  ['hotel-list', '/hotel/list', '微信图片_20260630111402_426_1.jpg'],
  ['hotel-detail', '/hotel/h_atour', '微信图片_20260630111420_452_1.jpg'],
  ['train-search', '/train/search', '微信图片_20260630111430_466_1.jpg'],
  ['flight-search', '/flight/search', '微信图片_20260630111441_484_1.jpg'],
  ['ticket-list', '/ticket/list', '微信图片_20260630111429_465_1.jpg'],
  ['orders', '/orders', '微信图片_20260630111508_523_1.jpg'],
  ['mine', '/mine', 'added/微信图片_20260630131034_530_1.jpg'],
  ['messages', '/message', '微信图片_20260630111414_443_1.jpg'],
];
const requested = new Set(
  (process.env.CTRIP_PAGES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);
const selectedPages = requested.size
  ? pages.filter(([name]) => requested.has(name))
  : pages;

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  timeout: 120000,
});
const page = await browser.newPage();
page.setDefaultTimeout(20000);
await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((resolve) => setTimeout(resolve, 1500));

const completed = [];
for (const [name, route, evidence] of selectedPages) {
  await page.evaluate(
    (target) => window.__OS__.openApp('ctrip', target),
    route,
  );
  await new Promise((resolve) => setTimeout(resolve, name === 'home' ? 2500 : 900));
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-app-root="ctrip"]');
    if (!root) return false;
    return [...root.querySelectorAll('img')].every(
      (image) => image.complete && image.naturalWidth > 0,
    );
  });
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  completed.push([name, route, evidence]);
  console.log(`OK ${name} ${route}`);
}
await browser.close();

const rows = completed
  .map(
    ([name, route, evidence]) => `
      <section>
        <header><b>${name}</b><code>${route}</code></header>
        <div class="pair">
          <figure><figcaption>模拟 App</figcaption><img src="${name}.png"></figure>
          <figure><figcaption>携程真机证据</figcaption><img src="../../../ctrip_images/${evidence}"></figure>
        </div>
      </section>`,
  )
  .join('');
const html = `<!doctype html>
<meta charset="utf-8">
<title>Ctrip visual diff</title>
<style>
  body{font-family:system-ui;background:#f3f4f6;margin:0;padding:16px;color:#222}
  h1{font-size:20px}
  section{background:#fff;border-radius:12px;padding:12px;margin:12px 0}
  header{display:flex;gap:16px;align-items:center}
  code{color:#0066cc}
  .pair{display:flex;gap:12px;margin-top:10px;overflow:auto}
  figure{margin:0}
  figcaption{text-align:center;font-size:12px;color:#777;margin-bottom:4px}
  img{width:360px;border:1px solid #eee;border-radius:8px;display:block}
</style>
<h1>携程旅行核心页面视觉对照 · ${completed.length} routes</h1>
<p>左侧为 360×800 模拟器截图，右侧为对应真机证据。</p>
${rows}`;
await fs.writeFile(path.join(OUT, 'index.html'), html, 'utf8');
if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
console.log(`OK visual diff: ${completed.length} pages -> ${OUT}`);
process.exit(0);
