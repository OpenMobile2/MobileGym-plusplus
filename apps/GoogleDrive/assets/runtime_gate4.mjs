// 验证阶段⑥ Gate-4 三条反馈是否修好
import { chromium } from 'playwright';

const errors = [];
const results = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => {
  const t = m.text();
  if (m.type() === 'error' && !t.includes('WMR') && !t.includes('404')) errors.push(t);
});

await page.goto(process.argv[2], { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.evaluate(() => window.localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.evaluate(() => window.__OS__.openApp('googledrive'));
await page.waitForTimeout(1500);

const vis = s => page.locator(s + ':visible');
const byText = (t, exact = false) => page.getByText(t, { exact }).locator('visible=true');
const tap = async s => { await vis(s).first().click({ timeout: 4000 }); await page.waitForTimeout(450); };
const back = async () => { await page.evaluate(() => window.__OS__.handleBack()); await page.waitForTimeout(350); };
const state = () => page.evaluate(() => window.__SIM__.getState().apps.googledrive);
const overlays = () => page.locator('[data-gd-overlay]:visible').count();
function check(name, pass, detail = '') {
  results.push({ name, pass });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
async function toRoot() {
  for (let i = 0; i < 10; i++) {
    if ((await overlays()) === 0 && (await page.locator('[data-trigger="googledrive.tab.files"]:visible').count()) > 0) return;
    await back();
  }
}

// ── 反馈 1：上传要能真选文件，且落在当前所在文件夹 ──
await tap('[data-trigger="googledrive.tab.files"]');
await byText('Colab Notebooks').first().click();
await page.waitForTimeout(500);
await tap('[data-trigger="googledrive.folder.create.open"]');
await tap('[data-trigger="googledrive.create.upload"]');
const dirCount = await page.locator('[data-action="googledrive.upload.pick.enterDir"]:visible').count();
check('上传先进本机文件选择器', dirCount > 0, `列出 ${dirCount} 个目录`);

await tap('[data-action="googledrive.upload.pick.enterDir"]');   // 进 Documents
const fileCount = await page.locator('[data-trigger="googledrive.upload.picked"]:visible').count();
check('选择器里列出真实本机文件', fileCount > 0, `${fileCount} 个文件`);
const pickedName = (await vis('[data-trigger="googledrive.upload.picked"]').first().textContent() || '').trim().split('\n')[0];
await tap('[data-trigger="googledrive.upload.picked"]');
const st1 = await state();
check('待上传文件就是我选的那个', st1.pendingUpload?.name && pickedName.includes(st1.pendingUpload.name),
  `pending=${st1.pendingUpload?.name}`);
check('默认上传位置是当前文件夹', st1.pendingUpload?.parentId === 'f_colab', `parentId=${st1.pendingUpload?.parentId}`);

await tap('[data-action="googledrive.upload.submit"]');
const st2 = await state();
const uploaded = Object.values(st2.items).find(i => i.name === st1.pendingUpload?.name && i.parentId === 'f_colab');
check('上传后文件真的落进了那个文件夹', Boolean(uploaded), uploaded ? `id=${uploaded.id}` : '没找到');

// 阶段⑥第 4 条：上传完成应回到刚才那一页（而不是跳上传记录页），并 Toast
const backOnFolder = await page.locator('[data-trigger="googledrive.folder.create.open"]:visible').count();
const onUploadsPage = await page.locator('[data-trigger="googledrive.uploads.pickFile"]:visible').count();
check('上传完成回到刚才那个文件夹页', backOnFolder > 0 && onUploadsPage === 0,
  `文件夹页=${backOnFolder} 上传记录页=${onUploadsPage}`);
const toastText = (await page.locator('#gd-toast').textContent().catch(() => '') || '');
check('上传完成有「已上传」Toast', toastText.includes('已上传'), toastText.trim() || '(无)');
// 新文件应当就在当前文件夹的列表里
const nameInList = await page.getByText(st1.pendingUpload?.name ?? '@@').locator('visible=true').count();
check('新文件出现在当前文件夹列表里', nameInList > 0, `命中 ${nameInList}`);

// ── 反馈 3：从抽屉进子页，按 ✕ 返回后抽屉仍应打开 ──
await toRoot();
await tap('[data-trigger="googledrive.files.drawer.open"]');
await tap('[data-trigger="googledrive.drawer.recent"]');
const onRecent = await page.locator('[data-trigger="googledrive.recent.filemenu.open"]:visible').count();
await back();
const drawerBack = await page.locator('[data-trigger="googledrive.drawer.trash"]:visible').count();
check('从抽屉进「最近使用」，返回后抽屉仍打开', onRecent > 0 && drawerBack > 0,
  `抽屉项可见=${drawerBack}`);

// 存储弹层同理：关掉后应回到抽屉
await tap('[data-trigger="googledrive.files.storage.open"]');
const onStorage = await page.locator('[data-action="googledrive.storage.cleanup.unavailable"]:visible').count();
await back();
const drawerBack2 = await page.locator('[data-trigger="googledrive.drawer.trash"]:visible').count();
check('关掉存储弹层后回到抽屉', onStorage > 0 && drawerBack2 > 0, `抽屉项可见=${drawerBack2}`);

// ── 反馈 2：文件点进去要有真实内容 ──
await toRoot();
await tap('[data-trigger="googledrive.tab.home"]');
await byText('_ACL_2026__MUR.pdf').first().click();
await page.waitForTimeout(700);
const pdfText = (await page.locator('[data-scroll-container="main"]:visible').first().textContent() || '');
check('PDF 预览有真实正文', pdfText.includes('多跳') || pdfText.includes('摘要'), `正文 ${pdfText.trim().length} 字`);
await page.screenshot({ path: '/tmp/gd_shots/g4-pdf.png' });

await toRoot();
await tap('[data-trigger="googledrive.tab.home"]');
await byText('主题：').first().click();
await page.waitForTimeout(700);
const sheetHasTable = await page.locator('table:visible').count();
check('表格文件预览画出了表格', sheetHasTable > 0, `${sheetHasTable} 个 table`);
await page.screenshot({ path: '/tmp/gd_shots/g4-sheet.png' });

await toRoot();
await tap('[data-trigger="googledrive.tab.files"]');
await byText('移动项目测试 bert 可行性.ipynb').first().click();
await page.waitForTimeout(700);
const codeText = (await page.locator('pre:visible').first().textContent().catch(() => '') || '');
check('notebook 预览有代码内容', codeText.includes('import torch'), `${codeText.trim().length} 字`);
await page.screenshot({ path: '/tmp/gd_shots/g4-code.png' });

await browser.close();
const failed = results.filter(r => !r.pass);
console.log(`\n通过 ${results.length - failed.length}/${results.length}`);
console.log('=== console errors ===');
console.log(errors.length ? errors.slice(0, 10).join('\n') : '(none)');
process.exit(failed.length ? 1 : 0);
