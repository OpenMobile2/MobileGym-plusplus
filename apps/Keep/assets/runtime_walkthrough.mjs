import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const URL = 'http://127.0.0.1:3000';
const results = [];

function record(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? `  ${detail}` : ''}`);
}

async function state(page, expr) {
  return page.evaluate((code) => Function('s', `return (${code})`)(window.__SIM__.getState().apps.keep), expr);
}

async function fresh(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__OS__.openApp('keep'));
  await page.waitForTimeout(650);
}

async function clickTrigger(page, trigger, first = false) {
  const loc = page.locator(`[data-trigger="${trigger}"]`);
  await (first ? loc.first() : loc).click();
  await page.waitForTimeout(180);
}

const errors = [];
const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch(
  existsSync(systemChrome) ? { executablePath: systemChrome } : undefined,
);
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 200)}`));
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('WMR') && !message.text().includes('404')) {
    errors.push(`console: ${message.text().slice(0, 200)}`);
  }
});

try {
  await fresh(page);
  const courses = await state(page, 's.courses.length');
  const homeOk = await page.locator('[data-trigger="course.detail.open.fromRecent"]').count() >= 3;
  record('W1 Keep 首页渲染与种子课程', homeOk && courses >= 6, `courses=${courses}`);

  await clickTrigger(page, 'course.detail.open.fromRecent', true);
  const courseId = await state(page, 's.current.courseId');
  const wish0 = await state(page, '(s.wishCourses || []).includes(s.current.courseId)');
  await page.locator('[data-action="course.detail.wish.toggle"]').click();
  await page.waitForTimeout(120);
  const wish1 = await state(page, '(s.wishCourses || []).includes(s.current.courseId)');
  record('W2 课程详情想练开关', Boolean(courseId) && wish1 !== wish0, `${wish0}->${wish1}`);

  await clickTrigger(page, 'course.comments.open');
  const comments0 = await state(page, 's.courses.find(c=>c.id===s.current.courseId).comments.length');
  await page.getByRole('textbox', { name: '说点什么' }).fill('runtime walkthrough');
  await page.locator('[data-action="course.comments.publish"]').click();
  await page.waitForTimeout(160);
  const comments1 = await state(page, 's.courses.find(c=>c.id===s.current.courseId).comments.length');
  record('W3 课程评论发布', comments1 === comments0 + 1, `comments ${comments0}->${comments1}`);

  const signatures = ['course.comments'];
  for (let i = 0; i < 6; i += 1) {
    if (await page.locator('[data-trigger="course.detail.open.fromRecent"]').count()) break;
    const backButton = page.locator('button[data-trigger-type="back"]');
    if (!await backButton.count()) break;
    await backButton.first().click({ force: true });
    await page.waitForTimeout(300);
    const next = await page.locator('[data-trigger="course.detail.open.fromRecent"]').count()
      ? 'course.home'
      : await page.getByText(/全部评论/).count()
        ? 'course.comments'
        : 'course.detail';
    if (signatures.at(-1) !== next) signatures.push(next);
  }
  const reachedHome = await page.locator('[data-trigger="course.detail.open.fromRecent"]').count() > 0;
  record('W4 深层页返回可达且无环', reachedHome && signatures.length === new Set(signatures).size, JSON.stringify(signatures));

  await fresh(page);
  await clickTrigger(page, 'course.detail.open.fromRecent', true);
  await clickTrigger(page, 'course.training.open');
  await page.locator('[data-action="course.training.orientation.toggle"]').click();
  await page.waitForTimeout(180);
  const landscapeStage = page.locator('.training-landscape-stage');
  const landscapeLayout = await landscapeStage.evaluate((element) => ({
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
    rectWidth: Math.round(element.getBoundingClientRect().width),
    rectHeight: Math.round(element.getBoundingClientRect().height),
  }));
  const landscapeOk = landscapeLayout.offsetWidth === 800
    && landscapeLayout.offsetHeight === 360
    && landscapeLayout.rectWidth >= 350
    && landscapeLayout.rectHeight >= 790;
  const status0 = await state(page, 's.trainingSession.status');
  await page.locator('[data-action="course.training.pause"]').click();
  await page.waitForTimeout(100);
  const status1 = await state(page, 's.trainingSession.status');
  await page.locator('[data-action="course.training.resume"]').click();
  await page.waitForTimeout(100);
  const status2 = await state(page, 's.trainingSession.status');
  await page.locator('[data-action="course.training.orientation.toggle"]').click();
  await page.waitForTimeout(100);
  await clickTrigger(page, 'course.complete.open');
  const completeOk = await page.getByText('完成得漂亮！', { exact: true }).count() === 1;
  record('W5 训练真横屏、暂停/继续/完成', landscapeOk && status0 === 'running' && status1 === 'paused' && status2 === 'running' && completeOk,
    `${status0}->${status1}->${status2}, ${JSON.stringify(landscapeLayout)}`);

  await fresh(page);
  await clickTrigger(page, 'tab.me');
  const beforeText = await page.locator('body').innerText();
  await page.getByText('运动记录', { exact: true }).click();
  await page.waitForTimeout(160);
  const afterText = await page.locator('body').innerText();
  record('W6 我的数据 tab 切换内容变化', beforeText !== afterText && afterText.includes('最新记录') && afterText.includes('运动数据同步'));

  const pending0 = await state(page, 's.runRecords.filter(r=>!r.uploaded).length');
  const minutes0 = await state(page, 's.user.totalMinutes');
  const runKm0 = await state(page, 's.user.totalRunKm');
  const pendingKm = await state(page, 's.runRecords.find(r=>!r.uploaded)?.km || 0');
  const pendingDuration = await state(page, 's.runRecords.find(r=>!r.uploaded)?.durationSec || 0');
  const pendingKcal = await state(page, 's.runRecords.find(r=>!r.uploaded)?.kcal || 0');
  await page.locator('[data-action="me.main.record.upload"]').click();
  await page.waitForTimeout(1350);
  const pending1 = await state(page, 's.runRecords.filter(r=>!r.uploaded).length');
  const minutes1 = await state(page, 's.user.totalMinutes');
  const runKm1 = await state(page, 's.user.totalRunKm');
  await clickTrigger(page, 'record.detail.open.fromMe', true);
  const detailOk = await page.locator('[data-action="record.detail.share.submit"]').count() === 1;
  await page.locator('[data-trigger-type="back"]').last().click();
  await page.waitForTimeout(120);
  await clickTrigger(page, 'records.sync.open.fromMe');
  if (await page.getByRole('button', { name: '开启自动上传', exact: true }).count()) {
    await page.getByRole('button', { name: '开启自动上传', exact: true }).click();
    await page.waitForTimeout(100);
  }
  const syncEmpty = await page.getByText('暂无待上传记录', { exact: false }).count() === 1;
  const accountingOk = pending1 === pending0 - 1
    && pendingDuration === 1985
    && pendingKcal === 226
    && minutes0 === 5280
    && minutes1 === 5313
    && minutes1 - minutes0 === 33
    && Math.abs((runKm1 - runKm0) - pendingKm) < 0.01;
  record('W7 我的记录上传、跑量账本与同步页一致', detailOk && accountingOk && syncEmpty,
    JSON.stringify({ pending: `${pending0}->${pending1}`, minutes: `${minutes0}->${minutes1}`, runKm: `${runKm0}->${runKm1}` }));

  await fresh(page);
  await clickTrigger(page, 'tab.discover');
  await clickTrigger(page, 'mall.home.open.fromFollow');
  await clickTrigger(page, 'mall.detail.open.fromMallHome', true);
  await clickTrigger(page, 'mall.sku.open.buyMode');
  const selected0 = await page.locator('[data-action="mall.sku.spec.select"]').first().getAttribute('class');
  await page.locator('[data-action="mall.sku.spec.select"]').nth(1).click();
  await page.waitForTimeout(100);
  const selected1 = await page.locator('[data-action="mall.sku.spec.select"]').first().getAttribute('class');
  record('W8 SKU 规格切换内容变化', selected0 !== selected1);

  const orders0 = await state(page, 's.orders.length');
  await clickTrigger(page, 'order.confirm.open');
  const draftOk = await state(page, '!!s.orderDraft && s.orderDraft.items.length > 0');
  await clickTrigger(page, 'order.pay.open');
  await page.locator('[data-action="order.pay.confirm"]').click();
  await page.waitForTimeout(100);
  await clickTrigger(page, 'order.detail.open.fromPay');
  const orders1 = await state(page, 's.orders.length');
  const detailVisible = await page.getByText('订单详情', { exact: true }).count() === 1;
  record('W9 支付成功并生成订单', draftOk && orders1 === orders0 + 1 && detailVisible, `orders ${orders0}->${orders1}`);

  await fresh(page);
  await clickTrigger(page, 'tab.me');
  await clickTrigger(page, 'records.hub.open');
  const totalRunCard = page.locator('[data-action="records.hub.metricCard.select"]').filter({ hasText: '总跑步' });
  await totalRunCard.click();
  await page.waitForTimeout(120);
  const metricSelected = (await totalRunCard.getAttribute('class'))?.includes('border-2') ?? false;
  const expectedTotalRun = await state(page, 's.user.totalRunKm.toFixed(2)');
  const totalRunValueVisible = await page.getByText(expectedTotalRun, { exact: true }).count() > 0;
  const daySegment = page.locator('[data-action="records.hub.segment.switch"]').filter({ hasText: '日' });
  await daySegment.click();
  await page.waitForTimeout(120);
  const dayEmpty = await page.getByText('无运动记录', { exact: true }).count() === 1;
  await page.locator('[data-action="records.hub.pager.flip"]').filter({ hasText: '‹' }).click();
  await page.waitForTimeout(120);
  await page.locator('[data-action="records.hub.pager.flip"]').filter({ hasText: '‹' }).click();
  await page.waitForTimeout(120);
  await page.locator('[data-action="records.hub.pager.flip"]').filter({ hasText: '‹' }).click();
  await page.waitForTimeout(120);
  const previousDayVisible = await page.getByText('7月11日运动', { exact: true }).count() === 1;
  const previousDayHasRecord = await page.getByText('无运动记录', { exact: true }).count() === 0;
  record('W10 记录指标、粒度与周期翻页驱动真实内容', metricSelected && totalRunValueVisible && dayEmpty && previousDayVisible && previousDayHasRecord, JSON.stringify({ metricSelected, totalRunValueVisible, dayEmpty, previousDayVisible, previousDayHasRecord, expectedTotalRun }));

  await fresh(page);
  await clickTrigger(page, 'course.detail.open.fromRecent', true);
  await clickTrigger(page, 'course.calendar.open');
  const calendarDays = page.locator('[data-action="course.calendar.date.toggle"]');
  const calendarDayCount = await calendarDays.count();
  const calendarLabelsValid = await page.evaluate(() => Array.from(document.querySelectorAll('[data-action="course.calendar.date.toggle"] span')).every((node) => node.textContent === '今' || Number(node.textContent) <= 31));
  const calendarLastParams = JSON.parse(await calendarDays.last().getAttribute('data-action-params'));
  const calendarLastBefore = await state(page, '(s.trainingDays || []).includes("2026-08-12")');
  await calendarDays.last().click();
  const calendarLastAfter = await state(page, '(s.trainingDays || []).includes("2026-08-12")');
  const calendarStateValid = calendarLastParams.date === '2026-08-12' && calendarLastBefore !== calendarLastAfter;
  record('W11 日历连续30天跨月且无非法日期', calendarDayCount === 30 && calendarLabelsValid && calendarStateValid, `days=${calendarDayCount}`);

  await fresh(page);
  await clickTrigger(page, 'course.detail.open.fromRecent', true);
  await clickTrigger(page, 'course.community.open');
  await clickTrigger(page, 'mall.detail.open.fromCommunity');
  const communityProductId = await state(page, 's.current.productId');
  const communityProductVisible = await page.getByText('Keep Watch Pilot 1 智能运动手表', { exact: true }).count() === 1;
  record('W12 课程社区手表入口使用有效商品实体', communityProductId === 'pr_watch' && communityProductVisible, String(communityProductId));

  await fresh(page);
  await clickTrigger(page, 'tab.discover');
  await clickTrigger(page, 'mall.home.open.fromFollow');
  const mallCategoryCount = await page.locator('[data-trigger="mall.category.open"]').count();
  await clickTrigger(page, 'tab.me');
  const mallBottomTabOk = await page.getByText('全部數據', { exact: true }).count() === 1;
  await fresh(page);
  await clickTrigger(page, 'tab.discover');
  await clickTrigger(page, 'mall.home.open.fromFollow');
  await clickTrigger(page, 'mall.detail.open.fromMallHome', true);
  const galleryCounter = page.locator('[data-action="mall.detail.gallery.page"] + span');
  const galleryBefore = await galleryCounter.innerText();
  await page.locator('[data-action="mall.detail.gallery.page"]').first().click();
  await page.waitForTimeout(120);
  const galleryAfter = await galleryCounter.innerText();
  const detailTab = page.locator('[data-action="mall.detail.tab.anchor"]').filter({ hasText: '详情' });
  await detailTab.click();
  await page.waitForTimeout(180);
  const detailTabSelected = (await detailTab.getAttribute('class'))?.includes('font-bold') ?? false;
  const detailScrollTop = await page.locator('[data-scroll-container="main"]').evaluate((element) => element.scrollTop);
  record('W13 商城15分类、底栏导航、图集翻页与详情锚点', mallCategoryCount === 15 && mallBottomTabOk && galleryBefore !== galleryAfter && detailTabSelected && detailScrollTop > 0, `${mallCategoryCount} cats, tab=${mallBottomTabOk}, ${galleryBefore}->${galleryAfter}`);

  await fresh(page);
  await clickTrigger(page, 'tab.discover');
  await clickTrigger(page, 'medal.home.open.fromFollow');
  const popupClose = page.locator('[data-action="medal.home.popup.close"]');
  if (await popupClose.count()) await popupClose.click();
  await clickTrigger(page, 'medal.detail.open.fromMedalHome', true);
  await page.locator('[data-trigger-type="back"]').first().click();
  await page.waitForTimeout(160);
  const medalBackOk = await page.locator('[data-trigger="medal.detail.open.fromMedalHome"]').count() > 0;
  await clickTrigger(page, 'medal.detail.open.fromMedalHome', true);
  const medalStates = [];
  for (const [tabName, marker] of [['款式', '奖牌款式'], ['赛制', '完赛任务'], ['晒奖品', 'Keepers 晒奖品']]) {
    await page.locator('[data-action="medal.detail.tab.switch"]').filter({ hasText: tabName }).click();
    await page.waitForTimeout(100);
    medalStates.push(await page.getByText(marker, { exact: true }).count() > 0);
  }
  const pauseBefore = await page.getByRole('button', { name: '暂停活动视频', exact: true }).count();
  await page.locator('[data-action="medal.detail.video.toggle"]').click();
  await page.waitForTimeout(100);
  const playAfter = await page.getByRole('button', { name: '播放活动视频', exact: true }).count();
  record('W14 奖牌返回、四Tab内容与视频状态独立变化', medalBackOk && medalStates.every(Boolean) && pauseBefore === 1 && playAfter === 1, JSON.stringify({ medalBackOk, medalStates, pauseBefore, playAfter }));

  await fresh(page);
  await clickTrigger(page, 'course.all.open');
  await page.locator('[data-action="course.all.category.switch"]').filter({ hasText: 'HIIT训练' }).click();
  await page.waitForTimeout(120);
  await clickTrigger(page, 'coach.profile.open', true);
  const coachName = await state(page, 's.coaches.find(c=>c.id===s.current.coachId)?.name');
  await page.locator('[data-action="coach.profile.tab.switch"]').filter({ hasText: '动态' }).click();
  await page.waitForTimeout(120);
  const feedCards = page.locator('[data-trigger="post.detail.open.fromCoach"]');
  const feedTexts = await feedCards.allInnerTexts();
  await page.locator('[data-action="coach.profile.feedChips.switch"]').filter({ hasText: '视频' }).click();
  await page.waitForTimeout(120);
  const videoFeedCount = await page.locator('[data-trigger="post.detail.open.fromCoach"]').count();
  await clickTrigger(page, 'chat.detail.open.fromCoach');
  const currentThread = await state(page, 's.messages.threads.find(t=>t.id===s.current.threadId)?.name');
  const chatTitleVisible = await page.getByText(coachName, { exact: true }).count() > 0;
  record('W15 达人动态严格归属本人且私信对象正确',
    feedTexts.length > 0 && feedTexts.every((text) => text.includes(coachName)) && videoFeedCount === 1
      && currentThread === coachName && chatTitleVisible,
    JSON.stringify({ coachName, feedCount: feedTexts.length, videoFeedCount, currentThread }));

  await fresh(page);
  await clickTrigger(page, 'action.hub.open');
  const templates = page.locator('[data-trigger="template.detail.open"]');
  await templates.nth(1).click();
  await page.waitForTimeout(120);
  const pyramidVisible = await page.getByText('金字塔模板', { exact: true }).count() >= 2;
  await page.locator('[data-trigger-type="back"]').first().click();
  await page.waitForTimeout(120);
  await clickTrigger(page, 'action.detail.open.fromHub', true);
  await clickTrigger(page, 'action.goal.open');
  await page.locator('[data-action="action.goal.scale.slide"]').filter({ hasText: /^10次$/ }).click();
  await page.locator('[data-action="action.goal.mode.switch"]').filter({ hasText: '计时' }).click();
  await page.waitForTimeout(100);
  const goalMode = await state(page, 's.actionGoal.mode');
  const goalValue = await state(page, 's.actionGoal.value');
  const timingOptionVisible = await page.locator('[data-action="action.goal.scale.slide"]').filter({ hasText: /^90秒$/ }).count() === 1;
  record('W16 模板选择与动作目标模式不串状态', pyramidVisible && goalMode === '计时' && goalValue === null && timingOptionVisible,
    JSON.stringify({ pyramidVisible, goalMode, goalValue, timingOptionVisible }));

  await fresh(page);
  await clickTrigger(page, 'tab.me');
  await clickTrigger(page, 'wallet.home.open');
  await clickTrigger(page, 'order.list.open.fromWallet');
  await page.locator('[data-action="order.list.tab.switch"]').filter({ hasText: '售后' }).click();
  await page.waitForTimeout(100);
  const orderCards = page.locator('[data-trigger="order.detail.open.fromList"]');
  const refundVisible = await orderCards.getByText('退款中', { exact: true }).count() > 0;
  await page.locator('[data-action="order.list.tab.switch"]').filter({ hasText: '晒单' }).click();
  await page.waitForTimeout(100);
  const completedVisible = await orderCards.getByText('已完成', { exact: true }).count() > 0;
  const wrongStatusVisible = await orderCards.getByText('待发货', { exact: true }).count() > 0;
  record('W17 订单售后与晒单标签映射真实状态', refundVisible && completedVisible && !wrongStatusVisible,
    JSON.stringify({ refundVisible, completedVisible, wrongStatusVisible }));

  await fresh(page);
  await clickTrigger(page, 'tab.discover');
  await clickTrigger(page, 'mall.home.open.fromFollow');
  await page.locator('[data-trigger="mall.category.open"]').filter({ hasText: '运动装备' }).click();
  await page.waitForTimeout(120);
  await page.locator('[data-trigger="mall.detail.open.fromCategory"]').filter({ hasText: '浸塑哑铃' }).click();
  await clickTrigger(page, 'mall.sku.open.buyMode');
  await page.locator('[data-action="mall.sku.bundle.toggle"]').click();
  await clickTrigger(page, 'order.confirm.open');
  await page.waitForTimeout(120);
  const bundle0 = await state(page, 's.orderDraft.addonIds.length');
  const coupon0 = await state(page, 's.orderDraft.couponAmount');
  const addonButton = page.locator('[data-action="order.confirm.addon.toggle"]');
  const checked0 = (await addonButton.innerText()).includes('✓');
  await addonButton.click();
  await page.waitForTimeout(100);
  const bundle1 = await state(page, 's.orderDraft.addonIds.length');
  const coupon1 = await state(page, 's.orderDraft.couponAmount');
  await addonButton.click();
  await page.waitForTimeout(100);
  const coupon2 = await state(page, 's.orderDraft.couponAmount');
  record('W18 SKU组合购贯穿确认页且优惠门槛实时重算',
    bundle0 === 1 && checked0 && coupon0 === 47 && bundle1 === 0 && coupon1 === 0 && coupon2 === 47,
    JSON.stringify({ bundle0, checked0, coupon0, bundle1, coupon1, coupon2 }));

  await page.locator('[data-action="order.confirm.back.retain"]').click();
  await page.waitForTimeout(100);
  const retainOpen = await page.getByText('好货错过不再有，真的要离开吗？', { exact: true }).count() === 1;
  await page.locator('[data-action="order.confirm.retain.stay"]').click();
  await page.waitForTimeout(120);
  const retainClosed = await page.getByText('好货错过不再有，真的要离开吗？', { exact: true }).count() === 0;
  const confirmStillVisible = await page.getByText('确认订单', { exact: true }).count() === 1;
  record('W19 确认订单挽留弹窗按历史栈关闭', retainOpen && retainClosed && confirmStillVisible,
    JSON.stringify({ retainOpen, retainClosed, confirmStillVisible }));

  await addonButton.click();
  await page.waitForTimeout(120);
  const standaloneCoupon = await state(page, 's.orderDraft.couponAmount');
  const standalonePayable = await state(page, '(() => { const d=s.orderDraft; const p=s.products.find(x=>x.id===d.items[0].productId); return Math.round((p.price*d.items[0].count-d.couponAmount-(d.coinChecked?p.coinDeduct:0))*100)/100; })()');
  const standalonePriceVisible = await page.getByText('¥34.90', { exact: true }).count() > 0;
  record('W20 哑铃单品成交价与运动币抵扣按 Evidence 计算',
    standaloneCoupon === 0 && standalonePayable === 34.9 && standalonePriceVisible,
    JSON.stringify({ standaloneCoupon, standalonePayable, standalonePriceVisible }));
} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.passed);
console.log(`\n断言: ${results.length - failed.length}/${results.length} 通过, 运行时错误: ${errors.length}`);
for (const error of errors.slice(0, 10)) console.log(`  - ${error}`);
if (failed.length || errors.length) process.exit(1);
console.log('OK: Keep runtime walkthrough 全绿');
