// 临时探针:按给定的 trigger/action 序列走一遍,打印每步之后页面上挂的 data-action / data-trigger。
// 用法:node apps/Tencentvideo/assets/_probe.mjs detail.series.open.fromFeedBanner detail.discuss.open.fromTab
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const steps = process.argv.slice(2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const p = await b.newPage();
await p.setViewport({ width: 360, height: 800 });
await p.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => {
  window.__SIM__?.resetState?.();
  localStorage.clear();
});
await p.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => Boolean(window.__OS__?.openApp));
await p.evaluate(() => window.__OS__.openApp('tencentvideo'));
await p.waitForSelector('[data-trigger],[data-action]');
await wait(500);

const dump = (tag) =>
  p
    .evaluate(() => ({
      actions: [...new Set(Array.from(document.querySelectorAll('[data-action]')).map((e) => e.getAttribute('data-action')))],
      triggers: [...new Set(Array.from(document.querySelectorAll('[data-trigger]')).map((e) => e.getAttribute('data-trigger')))],
      text: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 200),
    }))
    .then((d) => console.log(`\n[${tag}]\n  text: ${d.text}\n  actions: ${d.actions.join(', ')}\n  triggers: ${d.triggers.join(', ')}`));

await dump('start');
for (const raw of steps) {
  // 语法:id / id~参数片段(按 data-trigger-params 挑实例)/ id#文字(点完再敲字)/ <back
  if (raw === '<back') {
    await p.evaluate(() => window.__OS__.handleBack());
    await wait(500);
    await dump(raw);
    continue;
  }
  // +文字:往页面里第一个输入框敲字(输入即联想这类跳转没有可点的元素)
  if (raw.startsWith('+')) {
    const input = await p.$('input');
    await input.click();
    await p.keyboard.type(raw.slice(1));
    await wait(600);
    await dump(raw);
    continue;
  }
  const [head, typeText] = raw.split('#');
  const [step, param] = head.split('~');
  const base = step.startsWith('@') ? `[data-action="${step.slice(1)}"]` : `[data-trigger="${step}"]`;
  const sel = param ? `${base}[data-trigger-params*="${param}"]` : base;
  const el = await p.$(sel);
  if (!el) {
    console.log(`\n!! 找不到 ${sel}`);
    break;
  }
  await el.click();
  if (typeText) await p.keyboard.type(typeText);
  await wait(500);
  await dump(raw);
}
await b.close();
