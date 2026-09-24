// 针对自查修掉的 bug 做行为断言（不是截图，而是判定对错）
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3001/';
const results = [];
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
// 每轮从干净状态起（store 会持久化到 localStorage）
await page.evaluate(() => { window.localStorage.clear(); });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.evaluate(() => window.__OS__.openApp('googledrive'));
await page.waitForTimeout(1500);

const vis = sel => page.locator(sel + ':visible');
// 主 Tab 页常驻挂载（display:none），按文本定位必须过滤可见性
const byText = (t, exact = false) => page.getByText(t, { exact }).locator('visible=true');
const tap = async sel => { await vis(sel).first().click({ timeout: 4000 }); await page.waitForTimeout(450); };
const back = async () => { await page.evaluate(() => window.__OS__.handleBack()); await page.waitForTimeout(350); };
const overlays = () => page.locator('[data-gd-overlay]:visible').count();
const state = () => page.evaluate(() => window.__SIM__.getState().apps.googledrive);

function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

async function toRoot() {
  for (let i = 0; i < 10; i++) {
    if ((await overlays()) === 0 && (await page.locator('[data-trigger="googledrive.tab.files"]:visible').count()) > 0) return;
    await back();
  }
}

// ── 1. 从 ⋮ 菜单进对话框，取消后不该把菜单又弹出来 ──
await tap('[data-trigger="googledrive.home.filemenu.open"]');
const menuOpen = await overlays();
await vis('[data-trigger="googledrive.home.rename.open"]').first().scrollIntoViewIfNeeded();
await tap('[data-trigger="googledrive.home.rename.open"]');
await back();               // 关键盘
await back();               // 关对话框
const afterCancel = await overlays();
check('取消重命名后菜单不再弹出', menuOpen > 0 && afterCancel === 0, `浮层数 ${afterCancel}`);
await toRoot();

// ── 2. 移除文件后不该回到那个已删文件的菜单 ──
const before = await state();
await tap('[data-trigger="googledrive.home.filemenu.open"]');
await vis('[data-trigger="googledrive.home.confirm.trash"]').first().scrollIntoViewIfNeeded();
await tap('[data-trigger="googledrive.home.confirm.trash"]');
await tap('[data-action="googledrive.confirm.submit"]');
const afterRemove = await state();
check('移除后回到列表（不回菜单）', (await overlays()) === 0, `浮层数 ${await overlays()}`);
check('移除确实进了回收站', afterRemove.trashedIds.length === before.trashedIds.length + 1,
  `${before.trashedIds.length} → ${afterRemove.trashedIds.length}`);
await toRoot();

// ── 3. 从抽屉进子页，返回后抽屉应当仍是打开的 ──
//    阶段⑥ 操作者核对真机：「点击叉号返回后，在主页面中，侧边栏应该是打开的」。
//    自查阶段我曾把它当成 bug 改成关闭，方向错了，这条断言随之反过来。
//    注意这与 ⋮ 菜单是故意不同的：菜单选完一项就该消失，抽屉是导航容器、留在返回栈里。
await tap('[data-trigger="googledrive.tab.files"]');
await tap('[data-trigger="googledrive.files.drawer.open"]');
await tap('[data-trigger="googledrive.drawer.trash"]');
const onTrash = await page.locator('[data-trigger="googledrive.trash.itemmenu.open"]:visible').count();
await back();
const drawerStillOpen = await page.locator('[data-trigger="googledrive.drawer.trash"]:visible').count();
check('从抽屉进回收站再返回，抽屉仍打开', onTrash > 0 && drawerStillOpen > 0, `抽屉项可见=${drawerStillOpen}`);
await toRoot();

// ── 4. 在文件夹里新建文件夹，应该建在该文件夹下而不是根目录 ──
await tap('[data-trigger="googledrive.tab.files"]');
await byText('Colab Notebooks').first().click();
await page.waitForTimeout(500);
const folderId = await page.evaluate(() => {
  const el = document.querySelector('[data-app-root="googledrive"]');
  return el ? 'in-folder' : 'unknown';
});
await tap('[data-trigger="googledrive.folder.create.open"]');
await tap('[data-trigger="googledrive.folder.newfolder.open"]');
await vis('[data-action="googledrive.newfolder.input"]').first().fill('自查用子文件夹');
await tap('[data-action="googledrive.newfolder.submit"]');
await page.screenshot({ path: '/tmp/gd_shots/reg-newfolder.png' });
const afterNew = await state();
const created = Object.values(afterNew.items).find(i => i.name === '自查用子文件夹');
check('文件夹内新建的文件夹父级正确', Boolean(created) && created.parentId === 'f_colab',
  `parentId=${created?.parentId ?? '(没建出来)'} (${folderId})`);
await toRoot();

// ── 5. 搜索筛选条件要真的作用于结果 ──
await tap('[data-trigger="googledrive.search.open"]');
await vis('[data-action="googledrive.search.input"]').first().fill('a');
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
const allHits = await page.locator('[data-trigger="googledrive.results.filemenu.open"]:visible').count();
await tap('[data-trigger="googledrive.results.filter.type"]');
await tap('[data-action="googledrive.search.select.type"][data-action-params*="pdfs"]');
await page.waitForTimeout(400);
const pdfHits = await page.locator('[data-trigger="googledrive.results.filemenu.open"]:visible').count();
check('回车能提交搜索', allHits > 0, `命中 ${allHits} 条`);
check('筛选「PDF」后结果变少', pdfHits > 0 && pdfHits < allHits, `${allHits} → ${pdfHits}`);
await toRoot();

// ── 6. 多选移动要移动全部选中项，并退出多选态 ──
await tap('[data-trigger="googledrive.tab.files"]');
const row = byText('Colab Notebooks').first();
const box = await row.boundingBox();
await page.mouse.move(box.x + box.width - 30, box.y + 10);
await page.mouse.down();
await page.waitForTimeout(900);
await page.mouse.up();
await page.waitForTimeout(500);
// 再点一行，凑成 2 项
await byText('Google in Studio').first().click();
await page.waitForTimeout(400);
const sel = (await state()).selectedIds;
await tap('[data-trigger="googledrive.files.selection.menu"]');
await tap('[data-trigger="googledrive.selection.move.open"]');
await byText('论文', true).first().click();
await page.waitForTimeout(400);
await tap('[data-action="googledrive.move.submit"]');
const afterMove = await state();
const movedAll = sel.length >= 1 && sel.every(id => afterMove.items[id]?.parentId === 'f_papers');
check('多选移动移动了全部选中项', sel.length >= 1 && movedAll, `选中 ${sel.length} 项，落位 ${sel.map(i => afterMove.items[i]?.parentId).join(',')}`);
check('多选移动后退出了多选态',
  (await page.locator('[data-action="googledrive.selection.selectAll"]:visible').count()) === 0);

// ── 7. 带路径参数的路由上，浮层也要能开（原先 go() 会抛 Missing param "id"）──
await toRoot();
await tap('[data-trigger="googledrive.tab.files"]');
await byText('论文', true).first().click();   // 第 6 步刚把两个文件夹移进来，必然非空
await page.waitForTimeout(500);
const errBefore = errors.length;
await tap('[data-trigger="googledrive.folder.foldermenu.open"]');
check('文件夹页能打开文件夹 ⋮ 菜单', (await overlays()) > 0 && errors.length === errBefore,
  errors.length > errBefore ? errors[errors.length - 1].slice(0, 60) : '');
await back();
await tap('[data-trigger="googledrive.folder.sortmenu.open"]');
check('文件夹页能打开排序菜单', (await overlays()) > 0);
await toRoot();

await tap('[data-trigger="googledrive.tab.home"]');
await byText('resume_transcript.pdf').first().click();
await page.waitForTimeout(600);
const errBefore2 = errors.length;
await tap('[data-trigger="googledrive.preview.menu.open"]');
check('预览页能打开 ⋮ 菜单', (await overlays()) > 0 && errors.length === errBefore2,
  errors.length > errBefore2 ? errors[errors.length - 1].slice(0, 60) : '');

// ── 8. 点当前已选中的 Tab / 页内标签不该抛异常 ──
await toRoot();
const errBefore3 = errors.length;
await tap('[data-trigger="googledrive.tab.files"]');
await tap('[data-trigger="googledrive.tab.files"]');      // 已在 Files 上再点一次
await tap('[data-trigger="googledrive.files.tabMyDrive"]'); // 已在「我的云端硬盘」上再点一次
await tap('[data-trigger="googledrive.tab.home"]');
await tap('[data-trigger="googledrive.home.tabSuggested"]');
check('重复点击当前 Tab / 标签不抛异常', errors.length === errBefore3,
  errors.slice(errBefore3).map(e => e.slice(0, 70)).join(' | '));

await browser.close();
const failed = results.filter(r => !r.pass);
console.log(`\n通过 ${results.length - failed.length}/${results.length}`);
console.log('=== console errors ===');
console.log(errors.length ? errors.slice(0, 10).join('\n') : '(none)');
process.exit(failed.length ? 1 : 0);
