// 打开模拟器、启动 Google 云端硬盘、走一遍主要链路并截图
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3001/';
const OUT = '/tmp/gd_shots';
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.on('console', m => {
  const t = m.text();
  if (m.type() === 'error' && !t.includes('WMR') && !t.includes('404')) errors.push(t);
});
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.evaluate(() => window.__OS__.openApp('googledrive'));
await page.waitForTimeout(1500);

async function shot(name, fn) {
  try {
    if (fn) await fn();
    await page.waitForTimeout(650);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log('  ok  ', name);
  } catch (e) {
    console.log('  FAIL', name, '-', e.message.split('\n')[0].slice(0, 90));
    await page.screenshot({ path: `${OUT}/${name}-FAIL.png` }).catch(() => {});
  }
}

const click = sel => async () => { await page.locator(sel + ':visible').first().click({ timeout: 2500 }); };
const back = async () => { await page.evaluate(() => window.__OS__.handleBack()); await page.waitForTimeout(300); };

/**
 * 退到「没有任何浮层、且主 Tab 栏可点」为止。
 * 不能只看 Tab 栏是否可见 —— 它在遮罩后面依然 visible，会导致误判。
 */
async function toRoot() {
  for (let i = 0; i < 10; i++) {
    const overlays = await page.locator('[data-gd-overlay]:visible').count();
    const onTab = await page.locator('[data-trigger="googledrive.tab.files"]:visible').count();
    if (overlays === 0 && onTab > 0) return;
    await back();
  }
  throw new Error('toRoot: 退不回主 Tab（浮层关不掉？）');
}

await shot('01-home');
await shot('02-filemenu', click('[data-trigger="googledrive.home.filemenu.open"]'));
await shot('03-rename', async () => {
  // 「重命名」在 16 项菜单的折叠区下方，先滚进可视范围
  const item = page.locator('[data-trigger="googledrive.home.rename.open"]:visible').first();
  await item.scrollIntoViewIfNeeded();
  await item.click({ timeout: 2500 });
});
await shot('04-back-to-root', toRoot);

await shot('05-files', click('[data-trigger="googledrive.tab.files"]'));
await shot('06-foldermenu', click('[data-trigger="googledrive.files.foldermenu.open"]'));
await shot('07-color', click('[data-trigger="googledrive.files.color.open"]'));
await shot('08-folder-enter', async () => {
  await toRoot();
  await page.getByText('Colab Notebooks').first().click();
});
await shot('09-grid', async () => {
  await toRoot();
  await page.locator('[data-action="googledrive.view.toggle"]:visible').first().click();
});
await shot('10-sortmenu', click('[data-trigger="googledrive.files.sortmenu.open"]'));

await shot('11-drawer', async () => {
  await toRoot();
  await page.locator('[data-action="googledrive.view.toggle"]:visible').first().click();
  await page.locator('[data-trigger="googledrive.files.drawer.open"]:visible').first().click();
});
await shot('12-storage', click('[data-trigger="googledrive.files.storage.open"]'));
await shot('13-trash', async () => {
  // 存储弹层用 replace 打开，关掉后回到列表而不是抽屉，所以要重新开抽屉
  await toRoot();
  await page.locator('[data-trigger="googledrive.files.drawer.open"]:visible').first().click();
  await page.waitForTimeout(400);
  await page.locator('[data-trigger="googledrive.drawer.trash"]:visible').first().click();
});
await shot('14-trashmenu', click('[data-trigger="googledrive.trash.itemmenu.open"]'));
await shot('15-deleteConfirm', click('[data-trigger="googledrive.trash.confirm.deleteForever"]'));

await shot('16-starred', async () => {
  await toRoot();
  await page.locator('[data-trigger="googledrive.tab.starred"]:visible').first().click();
});
await shot('17-shared', click('[data-trigger="googledrive.tab.shared"]'));
await shot('18-create', async () => {
  await page.locator('[data-trigger="googledrive.tab.home"]:visible').first().click();
  await page.waitForTimeout(400);
  await page.locator('[data-trigger="googledrive.home.create.open"]:visible').first().click();
});
await shot('19-longpress-select', async () => {
  await toRoot();
  const row = page.getByText('resume_transcript.pdf').first();
  const box = await row.boundingBox();
  await page.mouse.move(box.x + 60, box.y + 20);
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
});
await shot('20-selectmenu', click('[data-trigger="googledrive.home.selection.menu"]'));
await shot('21-preview-image', async () => {
  await toRoot();
  await page.getByText('ACL2026_logo').first().click();
});
await shot('22-details', async () => {
  await toRoot();
  await page.locator('[data-trigger="googledrive.home.filemenu.open"]:visible').first().click();
  await page.waitForTimeout(400);
  await page.locator('[data-trigger="googledrive.item.details.open"]:visible').first().click();
});
await shot('23-gemini', async () => {
  await toRoot();
  await page.locator('[data-trigger="googledrive.gemini.open"]:visible').first().click();
});
await shot('24-settings', async () => {
  await toRoot();
  await page.locator('[data-trigger="googledrive.tab.files"]:visible').first().click();
  await page.waitForTimeout(400);
  await page.locator('[data-trigger="googledrive.files.drawer.open"]:visible').first().click();
  await page.waitForTimeout(300);
  await page.locator('[data-trigger="googledrive.drawer.settings"]:visible').first().click();
});

await browser.close();
console.log('\n=== app console errors ===');
console.log(errors.length ? errors.slice(0, 12).join('\n') : '(none)');
