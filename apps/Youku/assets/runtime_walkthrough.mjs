// 优酷 运行时走查(pipeline v3 §5.2 第五道 gate / §5.4 AI 生成断言脚本)。
// 监听 console/pageerror(零容忍);P0 状态断言;select/tab 前后可观察量断言;
// 返回可达性断言(§11:深层页连按 back ≤10 次回 tab 根且签名无环);双语抽验。
// app 用 MemoryRouter,路由不进 window.location —— 断言走 __SIM__ 状态 + DOM [data-trigger]/[data-action]。
// 用法: node apps/Youku/assets/runtime_walkthrough.mjs  (需先 npm run dev,127.0.0.1:3000)
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:3000';
const APP = 'youku';

const results = [];
const rec = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const errors = [];

const state = (page) => page.evaluate((a) => window.__SIM__.getState().apps[a], APP).catch(() => undefined);
const slice = async (page, k) => (await state(page))?.[k];
const has = async (page, sel) => (await page.locator(sel).count()) > 0;
const visibleText = (page, text) => page.locator(`text=${text}`).first().isVisible().catch(() => false);
const tap = async (page, id, i = 0, kind = 'trigger') => {
  await page.locator(`[data-${kind}="${id}"]`).nth(i).click({ timeout: 4000 });
  await page.waitForTimeout(420);
};
const typeInto = async (page, id, value) => {
  await page.locator(`[data-action="${id}"]`).first().fill(value, { timeout: 4000 });
  await page.waitForTimeout(250);
};
// 平台键盘行为:键盘弹起时第一次点击被「收起键盘」吞掉 —— 输入后主动失焦收起
const blurKb = async (page) => {
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.waitForTimeout(450);
};
const completeAlipayPay = async (page) => {
  await tap(page, 'cashier.password.open');
  const password = await page.evaluate(() => window.__SIM__.getState().apps.alipay?.userInfo?.paymentPassword ?? '123456');
  for (const digit of String(password)) {
    await page.locator(`[data-action="cashierPassword.keypad.press"][data-action-params*='"digit":"${digit}"']`).first().click({ timeout: 5000 });
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(900);
};
const back = async (page) => { await page.evaluate(() => window.__OS__.handleBack()); await page.waitForTimeout(400); };
const atTabRoot = (page) => has(page, '[data-trigger="chrome.tabbar.home.open"]');
const gotoHome = async (page) => {
  for (let i = 0; i < 10; i++) { if (await atTabRoot(page)) break; await back(page); }
  if (!(await atTabRoot(page))) { await page.evaluate((a) => window.__OS__.openApp(a), APP); await page.waitForTimeout(800); }
  if (await atTabRoot(page)) await tap(page, 'chrome.tabbar.home.open');
};
const sig = (page) =>
  page.evaluate(() => {
    const t = (document.querySelector('[data-adjust-resize]') || document.body).innerText.replace(/\s+/g, '');
    return `${t.length}:${t.slice(0, 90)}:${t.slice(-90)}`;
  });
/** §11 返回可达性:从当前(深层)页连按 back ≤10 次,断言回 tab 根且途经签名无环 */
const backReach = async (page, label) => {
  const seq = [];
  let reached = false;
  for (let i = 0; i < 10; i++) {
    if (await atTabRoot(page)) { reached = true; break; }
    seq.push(await sig(page));
    await back(page);
  }
  if (!reached) reached = await atTabRoot(page);
  const acyclic = new Set(seq).size === seq.length;
  rec(`back-reach: ${label} → tab root, acyclic`, reached && acyclic, `${seq.length} steps${acyclic ? '' : ', CYCLE'}`);
};

const main = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate((a) => window.__OS__.openApp(a), APP);
  await page.waitForTimeout(1800);
  rec('app launches to tab root', await atTabRoot(page));

  // 种子多样性
  const hist0 = await slice(page, 'history');
  rec('seed history >=8 diverse', (hist0?.length ?? 0) >= 8, `${hist0?.length}`);
  const lib0 = await slice(page, 'libFollowing');
  rec('seed libFollowing >=3', (lib0?.length ?? 0) >= 3, `${lib0?.length}`);
  const nick0 = (await slice(page, 'user'))?.nickname;
  rec('g4 default nickname', nick0 === '酷友_GROWH', `nick=${nick0}`);

  // 各 Tab 渲染
  for (const trig of ['chrome.tabbar.shorts.open', 'chrome.tabbar.vip.open', 'chrome.tabbar.taohaopian.open', 'chrome.tabbar.me.open']) {
    try { await tap(page, trig); rec(`${trig} renders`, true); } catch (e) { rec(trig, false, String(e).slice(0, 70)); }
  }
  await tap(page, 'chrome.tabbar.home.open');

  // ===== 首页 → 频道切换(select 前后可观察量断言) =====
  try {
    const s0 = await sig(page);
    await tap(page, 'home.main.channel.open');
    const onChannel = await has(page, '[data-trigger="home.channel.switch.open"]');
    const s1 = await sig(page);
    rec('home → channel: view+data change', onChannel && s0 !== s1);
    await tap(page, 'home.channel.switch.open');
    const s2 = await sig(page);
    rec('channel switch: data follows', s1 !== s2 && (await has(page, '[data-trigger="home.channel.switch.open"]')));
    if ((await page.locator('[data-action="home.channel.filter.select.tag"]').count()) > 1) {
      const f1 = await sig(page);
      await tap(page, 'home.channel.filter.select.tag', 1, 'action');
      const f2 = await sig(page);
      rec('channel filter select: list changes', f1 !== f2);
    }
    await gotoHome(page);
  } catch (e) { rec('channel flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // ===== P0 电影播放页(焦点海报第1张 m_yueguang) =====
  try {
    await tap(page, 'home.main.focus.player.open');
    rec('movie player opens', await has(page, '[data-action="player.playback.toggle"]'));
    // 播放/暂停(底部控制键 aria-label pause↔play)
    const ctl = page.locator('[data-action="player.playback.toggle"]').nth(1);
    const a1 = await ctl.getAttribute('aria-label');
    await ctl.click(); await page.waitForTimeout(350);
    const a2 = await ctl.getAttribute('aria-label');
    rec('playback toggle pauses', a1 === 'pause' && a2 === 'play', `${a1}→${a2}`);
    await ctl.click(); await page.waitForTimeout(300);
    // 拖进度写历史
    const bar = page.locator('[data-action="player.progress.seek"]').first();
    const box = await bar.boundingBox();
    await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
    await page.waitForTimeout(500);
    const hSeek = (await slice(page, 'history')).find((h) => h.id === 'm_yueguang' && (h.episode ?? 0) === 0);
    rec('P0 seek writes history', (hSeek?.progressSec ?? 0) > 4000, `progressSec=${hSeek?.progressSec}`);
    // +追入在追
    await tap(page, 'player.follow.toggle', 0, 'action');
    rec('P0 follow → libFollowing', (await slice(page, 'libFollowing')).some((e) => e.id === 'm_yueguang'));
    // 点赞入喜欢(种子已含则先翻转再加回,终态=已点赞)
    const likedBefore = (await slice(page, 'likes')).some((e) => e.id === 'm_yueguang');
    await tap(page, 'player.like.toggle', 0, 'action');
    let likedAfter = (await slice(page, 'likes')).some((e) => e.id === 'm_yueguang');
    rec('P0 like toggle flips state', likedAfter !== likedBefore, `${likedBefore}→${likedAfter}`);
    if (!likedAfter) { await tap(page, 'player.like.toggle', 0, 'action'); likedAfter = (await slice(page, 'likes')).some((e) => e.id === 'm_yueguang'); }
    rec('P0 like final in likes', likedAfter);
    // 假下载入 downloads
    await tap(page, 'player.download.fakeStart', 0, 'action');
    rec('P0 fake download → downloads', (await slice(page, 'downloads')).some((d) => d.id === 'm_yueguang'));
    // 发弹幕上屏
    await typeInto(page, 'player.danmaku.send', '走查弹幕123');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
    rec('P0 danmaku sent', ((await slice(page, 'userDanmakuByKey'))['m_yueguang'] ?? []).includes('走查弹幕123'));
    await blurKb(page);
    // tab 切换(视频→讨论,内容跟着变)
    const tv = await sig(page);
    await tap(page, 'player.tab.select.discuss', 0, 'action');
    const td = await sig(page);
    rec('player tab select: view changes', tv !== td && (await has(page, '[data-action="player.comment.publish"]')));
    // 发评论上屏
    await typeInto(page, 'player.comment.publish', '走查评论:这片子真不错');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const cms = (await slice(page, 'commentsByKey'))['m_yueguang'] ?? [];
    rec('P0 comment published on top', cms[0]?.byMe === true && cms[0]?.text === '走查评论:这片子真不错');
    await blurKb(page);
    // 评分页:打分→已评
    await tap(page, 'player.rating.open');
    rec('rating page opens', await has(page, '[data-action="player.rating.submit"]'));
    await tap(page, 'player.rating.stars.select.value', 3, 'action');
    await tap(page, 'player.rating.submit', 0, 'action');
    const rt = (await slice(page, 'ratings'))['m_yueguang'];
    rec('P0 rating submitted', (rt?.score ?? 0) > 0, `score=${rt?.score}`);
    await gotoHome(page);
  } catch (e) { rec('P0 movie flow', false, String(e).slice(0, 120)); await gotoHome(page); }

  // ===== P0 剧集播放页(焦点轮播第2张 s_xiaoao) =====
  try {
    await tap(page, 'home.main.focus.swipe', 0, 'action');
    await tap(page, 'home.main.focus.player.open', 1);
    rec('series player opens', await has(page, '[data-trigger="player.series.episodes.open"]'));
    // 切集:讨论数变化 + 历史按集写入
    const dc1 = await page.locator('[data-action="player.series.tab.select.option"]').nth(1).innerText();
    await tap(page, 'player.series.episode.select.option', 1, 'action');
    await page.waitForTimeout(600);
    const dc2 = await page.locator('[data-action="player.series.tab.select.option"]').nth(1).innerText();
    rec('ep switch: discuss count changes', dc1 !== dc2, `"${dc1}"→"${dc2}"`);
    rec('ep switch: history per-episode', (await slice(page, 'history')).some((h) => h.id === 's_xiaoao' && h.episode === 2));
    // 选集面板:tab 切换 + 面板切集回填
    await tap(page, 'player.series.episodes.open');
    rec('episodes sheet opens', await has(page, '[data-action="player.episodes.tab.select.option"]'));
    const e1 = await sig(page);
    await tap(page, 'player.episodes.tab.select.option', 1, 'action');
    const e2 = await sig(page);
    rec('episodes sheet tab select: view changes', e1 !== e2);
    await tap(page, 'player.episodes.tab.select.option', 0, 'action');
    await tap(page, 'player.series.episode.select.option', 2, 'action');
    await page.waitForTimeout(600);
    rec('sheet ep select → history ep3', (await slice(page, 'history')).some((h) => h.id === 's_xiaoao' && h.episode === 3));
    await back(page);
    rec('sheet back → series page', await has(page, '[data-trigger="player.series.episodes.open"]'));
    // 分享面板 + 倍速/定时(选中持久)
    await tap(page, 'player.series.share.open');
    rec('share sheet opens', await has(page, '[data-action="player.share.channel.copiedToast"]'));
    const chooserTargets = await page.evaluate(() =>
      new Set(window.__OS__.resolveActivity({ action: 'ACTION_SEND', type: 'text/plain' })).size,
    );
    const shareEntries = await page.locator('[data-action="player.share.channel.copiedToast"]').count();
    rec('share apps match system chooser (+ copy link)', shareEntries === chooserTargets + 1, `${shareEntries} vs ${chooserTargets}+1`);
    await tap(page, 'player.share.speed.open');
    await tap(page, 'player.speed.select.option', 3, 'action');
    const pb1 = await slice(page, 'playback');
    rec('speed select persists', pb1?.speed !== '1.0X', `speed=${pb1?.speed}`);
    if (!(await has(page, '[data-trigger="player.share.timer.open"]'))) await back(page);
    if (!(await has(page, '[data-trigger="player.share.timer.open"]'))) await tap(page, 'player.series.share.open');
    await tap(page, 'player.share.timer.open');
    await tap(page, 'player.timer.select.option', 1, 'action');
    const pb2 = await slice(page, 'playback');
    rec('timer select persists', pb2?.timer !== 'off', `timer=${pb2?.timer}`);
    await gotoHome(page);
  } catch (e) { rec('P0 series flow', false, String(e).slice(0, 120)); await gotoHome(page); }

  // ===== 搜索:联想→搜索→历史→结果tab切换→下载→VIP蒙层 =====
  try {
    await tap(page, 'home.main.search.open');
    await typeInto(page, 'search.entry.input.change', '雪山');
    const suggests = await page.locator('[data-trigger="search.entry.results.open"]').count();
    rec('search suggest candidates', suggests > 1, `${suggests} rows`);
    await typeInto(page, 'search.entry.input.change', '雪山熊师3');
    await blurKb(page);
    await tap(page, 'search.entry.results.open', 0);
    rec('search → results page', await has(page, '[data-action="search.results.select.tab"]'));
    rec('search history written', (await slice(page, 'searchHistory')).includes('雪山熊师3'));
    const r1 = await sig(page);
    await tap(page, 'search.results.select.tab', 3, 'action');
    const r2 = await sig(page);
    rec('results tab select: result set changes', r1 !== r2);
    await tap(page, 'search.results.select.tab', 0, 'action');
    if (await has(page, '[data-action="search.results.download.add"]')) {
      await tap(page, 'search.results.download.add', 0, 'action');
      rec('results download → downloads', (await slice(page, 'downloads')).some((d) => d.id === 'm_xueshan3'));
    } else rec('results download button present', false, 'no exact-match card');
    // VIP 蒙层(未开通)→ 假开通 → 蒙层消失
    await tap(page, 'search.results.player.open', 0);
    rec('vip movie mask before activation', await has(page, '[data-trigger="player.vipMask.open"]'));
    await tap(page, 'player.vipMask.open');
    rec('mask → vip page', await has(page, '[data-action="vip.activate.confirm"]'));
    rec('membership initially inactive', (await slice(page, 'membership'))?.active === false);
    const ordBefore = (await slice(page, 'orders')).length;
    await tap(page, 'vip.plantab.select.svip', 0, 'action');
    await tap(page, 'vip.plan.select.year', 0, 'action');
    await tap(page, 'vip.activate.confirm', 0, 'action');
    await completeAlipayPay(page);
    const mem = await slice(page, 'membership');
    const ordAfter = (await slice(page, 'orders')).length;
    rec('P0 vip fake activation', mem?.active === true && mem?.tier === 'svip' && ordAfter === ordBefore + 1,
      `tier=${mem?.tier}, orders ${ordBefore}→${ordAfter}`);
    await back(page);
    rec('mask gone after activation', !(await has(page, '[data-trigger="player.vipMask.open"]')) && (await has(page, '[data-action="player.playback.toggle"]')));
    await gotoHome(page);
    await tap(page, 'chrome.tabbar.me.open');
    rec('me banner shows activated', await visibleText(page, '已开通SVIP会员'));
    await tap(page, 'chrome.tabbar.home.open');
  } catch (e) { rec('search/vip flow', false, String(e).slice(0, 120)); await gotoHome(page); }

  // ===== 短剧/短视频 feed:滑动切条 + 收藏/点赞/关注联动 =====
  try {
    await tap(page, 'chrome.tabbar.shorts.open');
    rec('shorts feed renders', await has(page, '[data-action="shorts.feed.switch"]'));
    const feedBox = await page.locator('[data-action="shorts.feed.switch"]').first().boundingBox();
    const cx = feedBox.x + feedBox.width / 2; const cy = feedBox.y + feedBox.height / 2;
    await page.mouse.move(cx, cy); await page.mouse.down();
    await page.mouse.move(cx, cy - 250, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(600);
    rec('shorts swipe switches item (history)', (await slice(page, 'history')).some((h) => h.id === 'sv02'));
    const favB = (await slice(page, 'favorites')).some((e) => e.id === 'sv02');
    await tap(page, 'shorts.fav.toggle', 0, 'action');
    let favA = (await slice(page, 'favorites')).some((e) => e.id === 'sv02');
    rec('shorts fav toggle flips', favA !== favB, `${favB}→${favA}`);
    if (!favA) { await tap(page, 'shorts.fav.toggle', 0, 'action'); favA = (await slice(page, 'favorites')).some((e) => e.id === 'sv02'); }
    rec('shorts fav final in favorites (library 联动)', favA);
    await tap(page, 'shorts.like.toggle', 0, 'action');
    rec('shorts like → likes', (await slice(page, 'likes')).some((e) => e.id === 'sv02'));
    const folB = (await slice(page, 'followingCreators')).length;
    await tap(page, 'shorts.follow.toggle', 0, 'action');
    const folA = (await slice(page, 'followingCreators')).length;
    rec('shorts follow toggle changes count', Math.abs(folA - folB) === 1, `${folB}→${folA}`);
  } catch (e) { rec('shorts flow', false, String(e).slice(0, 120)); }

  // ===== 淘好片-解说 feed:切条/投票/发布讨论 =====
  try {
    await tap(page, 'chrome.tabbar.taohaopian.open');
    await tap(page, 'taohaopian.hot.jieshuo.open');
    rec('jieshuo feed renders', await has(page, '[data-action="taohaopian.jieshuo.feed.switch"]'));
    const j1 = await sig(page);
    const jb = await page.locator('[data-action="taohaopian.jieshuo.feed.switch"]').first().boundingBox();
    const jx = jb.x + jb.width / 2; const jy = jb.y + jb.height / 2;
    await page.mouse.move(jx, jy); await page.mouse.down();
    await page.mouse.move(jx, jy - 250, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(600);
    const j2 = await sig(page);
    rec('jieshuo swipe switches item', j1 !== j2);
    await tap(page, 'taohaopian.jieshuo.discussion.toggle', 0, 'action');
    rec('discussion opens with vote card', await has(page, '[data-action="taohaopian.jieshuo.vote.select.youyisi"]'));
    const votesB = Object.keys((await slice(page, 'votes')) ?? {}).length;
    await tap(page, 'taohaopian.jieshuo.vote.select.youyisi', 0, 'action');
    const votes = (await slice(page, 'votes')) ?? {};
    rec('vote recorded once', Object.keys(votes).length === votesB + 1 && Object.values(votes).includes('youyisi'));
    await tap(page, 'taohaopian.jieshuo.publish.open');
    rec('publish sheet opens', await has(page, '[data-action="taohaopian.publish.comment.submit"]'));
    await typeInto(page, 'taohaopian.publish.comment.input', '走查讨论:结尾反转绝了');
    await blurKb(page);
    await tap(page, 'taohaopian.publish.comment.submit', 0, 'action');
    const allCms = (await slice(page, 'commentsByKey')) ?? {};
    const found = Object.values(allCms).some((list) => list.some((c) => c.byMe && c.text === '走查讨论:结尾反转绝了'));
    rec('P0 jieshuo comment published', found);
    // 新片预告:排序切换可观察 + 预约联动(选一个未预约条目,断言 +1)
    await tap(page, 'taohaopian.jieshuo.upcoming.open');
    const u1 = await sig(page);
    await tap(page, 'taohaopian.upcoming.sort.select.recommend', 0, 'action');
    const u2 = await sig(page);
    rec('upcoming sort select: order changes', u1 !== u2);
    const resList = await slice(page, 'reservations');
    const btns = page.locator('[data-action="taohaopian.upcoming.reserve.toggle"]');
    const n = await btns.count();
    let idx = -1;
    for (let i = 0; i < n; i++) {
      const p = JSON.parse((await btns.nth(i).getAttribute('data-action-params')) ?? '{}');
      if (p.upcomingId && !resList.includes(p.upcomingId)) { idx = i; break; }
    }
    await btns.nth(idx).click(); await page.waitForTimeout(420);
    const resA = (await slice(page, 'reservations')).length;
    rec('upcoming reserve toggle adds', idx >= 0 && resA === resList.length + 1, `${resList.length}→${resA}`);
    await gotoHome(page);
  } catch (e) { rec('jieshuo flow', false, String(e).slice(0, 120)); await gotoHome(page); }

  // ===== 我的:编辑资料/关注计数/library 编辑删除/预约双向/收藏联动/历史续播 =====
  try {
    await tap(page, 'chrome.tabbar.me.open');
    await tap(page, 'me.profile.open');
    await tap(page, 'me.profile.edit.open');
    await typeInto(page, 'me.profileEdit.nickname.input', '走查昵称WT');
    await blurKb(page);
    await tap(page, 'me.profileEdit.save.commit', 0, 'action');
    rec('P0 profile save', (await slice(page, 'user'))?.nickname === '走查昵称WT');
    rec('profile page backfills nickname', await visibleText(page, '走查昵称WT'));
    // 关注/取关计数
    await tap(page, 'me.profile.following.open');
    const fB = (await slice(page, 'followingCreators')).length;
    await tap(page, 'me.following.recommend.follow.toggle', 0, 'action');
    const fA = (await slice(page, 'followingCreators')).length;
    rec('following follow/unfollow count', Math.abs(fA - fB) === 1, `${fB}→${fA}`);
    await back(page); await back(page);
    // library 编辑多选删除
    await tap(page, 'me.library.zhui.open');
    const zB = (await slice(page, 'libFollowing')).length;
    await tap(page, 'me.library.edit.enter', 0, 'action');
    await tap(page, 'me.library.edit.select.toggle', 0, 'action');
    await tap(page, 'me.library.edit.delete.commit', 0, 'action');
    const zA = (await slice(page, 'libFollowing')).length;
    rec('P0 library edit delete', zA === zB - 1 && (await has(page, '[data-action="me.library.edit.enter"]')), `${zB}→${zA}`);
    // 预约tab与 reservations 双向
    await tap(page, 'me.library.tab.select.yuyue', 0, 'action');
    const resN = (await slice(page, 'reservations')).length;
    const rows = await page.locator('[data-action="me.library.reserve.cancel"]').count();
    rec('library yuyue rows == reservations', rows === resN, `${rows} vs ${resN}`);
    if (rows > 0) {
      await tap(page, 'me.library.reserve.cancel', 0, 'action');
      rec('library reserve cancel syncs', (await slice(page, 'reservations')).length === resN - 1);
    }
    // 收藏tab条数与 favorites 联动
    await tap(page, 'me.library.tab.select.fav', 0, 'action');
    const favN = (await slice(page, 'favorites')).length;
    const favRows =
      (await page.locator('[data-trigger="me.library.favItem.open"]').count()) +
      (await page.locator('[data-trigger="me.library.favItem.movie.open"]').count()) +
      (await page.locator('[data-trigger="me.library.favItem.series.open"]').count());
    rec('library fav rows == favorites', favRows === favN, `${favRows} vs ${favN}`);
    await back(page);
    // 历史续播:进入历史卡续上次进度而非清零
    const target = (await slice(page, 'history')).find((h) => h.ctype === 'series');
    await tap(page, 'me.history.card.series.open', 0);
    await page.waitForTimeout(1200);
    const cont = (await slice(page, 'history')).find((h) => h.id === target.id && h.episode === target.episode);
    rec('P0 history resume keeps progress', (cont?.progressSec ?? 0) >= target.progressSec,
      `${target.id}#${target.episode}: ${target.progressSec}→${cont?.progressSec}`);
    await gotoHome(page);
  } catch (e) { rec('me flow', false, String(e).slice(0, 120)); await gotoHome(page); }

  // ===== 消息:一键已读角标清零 =====
  try {
    await tap(page, 'chrome.tabbar.me.open');
    await tap(page, 'me.msg.open');
    const uB = Object.values((await slice(page, 'unread')) ?? {}).reduce((a, b) => a + b, 0);
    await tap(page, 'msg.center.readAll.clear', 0, 'action');
    const uA = Object.values((await slice(page, 'unread')) ?? {}).reduce((a, b) => a + b, 0);
    rec('P0 read-all clears badges', uB > 0 && uA === 0, `${uB}→${uA}`);
    await gotoHome(page);
  } catch (e) { rec('messages flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // ===== 发布:发动态 → 个人主页动态tab置顶 =====
  try {
    await tap(page, 'chrome.tabbar.me.open');
    await tap(page, 'me.profile.open');
    await tap(page, 'me.profile.publish.open');
    await page.evaluate(async () => {
      const MediaService = await import('/os/MediaService.ts');
      const poster = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#4b8cff"/></svg>',
      )}`;
      await MediaService.saveToGallery(poster, {
        album: 'Saved', fileName: 'youku-first-pick-regression.svg', mimeType: 'image/svg+xml',
      });
    });
    await tap(page, 'publish.editor.image.add', 0, 'action');
    const picker = page.locator('.fixed.inset-0.z-\\[9999\\]');
    await picker.locator('.grid.grid-cols-4 > div').first().click();
    await picker.locator('button').nth(2).click();
    await page.waitForTimeout(300);
    const firstPickedUri = (await slice(page, '_temp'))?.publishDraft?.images?.[0] ?? '';
    rec('first gallery pick resolves displayable URI', firstPickedUri.startsWith('blob:'), firstPickedUri.slice(0, 32));
    rec('first gallery thumbnail avoids Youku placeholder', await has(page, 'img[src^="blob:"]'));
    await typeInto(page, 'publish.editor.body.input', '第一条走查动态~');
    await blurKb(page);
    await tap(page, 'publish.editor.submit', 0, 'action');
    const mm = await slice(page, 'moments');
    rec('P0 moment published', mm?.[0]?.text === '第一条走查动态~');
    await tap(page, 'me.profile.tab.select.moments', 0, 'action');
    rec('moments tab shows new post on top', await visibleText(page, '第一条走查动态~'));
    rec('my moment has bottom-left share', await has(page, '[data-action="me.profile.moment.share.open"]'));
    const momentId = mm?.[0]?.id;
    await tap(page, 'me.profile.moment.comment.open', 0, 'action');
    await typeInto(page, 'me.profile.moment.comment.input', '动态回复只保留我发的');
    await blurKb(page);
    await tap(page, 'me.profile.moment.comment.publish', 0, 'action');
    const momentComments = (await slice(page, 'commentsByKey'))?.[`mm:${momentId}`] ?? [];
    rec('moment reply does not inject default comments', momentComments.length === 1 && momentComments[0]?.text === '动态回复只保留我发的');
    const commentPools = Object.values((await slice(page, 'commentsByKey')) ?? {}).flat();
    rec('seed comment avatars are populated', commentPools.length > 0 && commentPools.every((c) => Boolean(c.avatar)));
    await gotoHome(page);
  } catch (e) { rec('publish flow', false, String(e).slice(0, 100)); await gotoHome(page); }

  // ===== 双语抽验(§10.2):tabbar/主按钮文案切换 =====
  try {
    await gotoHome(page);
    await page.evaluate(() => window.__OS__.locale.setLocale('en'));
    await page.waitForTimeout(600);
    rec('locale en: tab labels switch', (await visibleText(page, 'Home')) && (await visibleText(page, 'Picks')));
    await tap(page, 'home.main.search.open');
    rec('locale en: main button switches', await visibleText(page, 'Search'));
    await back(page);
    await page.evaluate(() => window.__OS__.locale.setLocale('zh'));
    await page.waitForTimeout(500);
    rec('locale zh restored', await visibleText(page, '首页'));
  } catch (e) { rec('bilingual', false, String(e).slice(0, 100)); }

  // ===== 返回可达性(§11):≥6 个深层页 =====
  try { // 1 选集面板
    await gotoHome(page);
    await tap(page, 'home.main.focus.swipe', 0, 'action');
    await tap(page, 'home.main.focus.player.open', 1);
    await tap(page, 'player.series.episodes.open');
    await backReach(page, 'episodes sheet');
  } catch (e) { rec('back-reach: episodes sheet', false, String(e).slice(0, 90)); await gotoHome(page); }
  try { // 2 评分页
    await gotoHome(page);
    await tap(page, 'home.main.focus.player.open');
    await tap(page, 'player.tab.select.discuss', 0, 'action');
    await tap(page, 'player.rating.open');
    await backReach(page, 'rating page');
  } catch (e) { rec('back-reach: rating page', false, String(e).slice(0, 90)); await gotoHome(page); }
  try { // 3 倍速面板(播放页→更多→分享面板→倍速)
    await gotoHome(page);
    await tap(page, 'home.main.focus.player.open');
    await tap(page, 'player.more.share.open');
    await tap(page, 'player.share.speed.open');
    await backReach(page, 'speed sheet');
  } catch (e) { rec('back-reach: speed sheet', false, String(e).slice(0, 90)); await gotoHome(page); }
  try { // 4 创作者主页
    await tap(page, 'chrome.tabbar.shorts.open');
    await tap(page, 'shorts.feed.author.open');
    await backReach(page, 'creator profile');
  } catch (e) { rec('back-reach: creator profile', false, String(e).slice(0, 90)); await gotoHome(page); }
  try { // 5 设置页
    await gotoHome(page);
    await tap(page, 'chrome.tabbar.me.open');
    await tap(page, 'me.settings.open');
    await backReach(page, 'settings page');
  } catch (e) { rec('back-reach: settings page', false, String(e).slice(0, 90)); await gotoHome(page); }
  try { // 6 发布编辑页(我的→个人主页→发布)
    await gotoHome(page);
    await tap(page, 'chrome.tabbar.me.open');
    await tap(page, 'me.profile.open');
    await tap(page, 'me.profile.publish.open');
    await backReach(page, 'publish editor');
  } catch (e) { rec('back-reach: publish editor', false, String(e).slice(0, 90)); await gotoHome(page); }
  try { // 7 搜索结果页
    await gotoHome(page);
    await tap(page, 'home.main.search.open');
    await typeInto(page, 'search.entry.input.change', '暗香令');
    await blurKb(page);
    await tap(page, 'search.entry.results.open', 0);
    await backReach(page, 'search results');
  } catch (e) { rec('back-reach: search results', false, String(e).slice(0, 90)); await gotoHome(page); }

  // 死交互兜底:wontfix 必有 toast 反馈(抽查一处)
  try {
    await gotoHome(page);
    await tap(page, 'home.main.plusMenu.open', 0, 'action');
    await tap(page, 'home.main.plusMenu.scan.wontfixToast', 0, 'action');
    await page.waitForTimeout(350);
    rec('wontfix gives toast feedback', await visibleText(page, '该功能暂未开放'));
  } catch (e) { rec('wontfix toast', false, String(e).slice(0, 80)); }

  // ===== 阶段⑥ gate4-0731 回归断言 =====
  try {
    await gotoHome(page);
    await tap(page, 'home.main.channel.open', 0); // 剧集
    rec('g4 channel home chip bound', await has(page, '[data-trigger="home.channel.home.open"]'));
    await tap(page, 'home.channel.home.open');
    rec('g4 channel → home', await has(page, '[data-trigger="home.main.channel.open"]'));
    await tap(page, 'home.main.channel.open', 0);
    const noGang = !(await visibleText(page, '港剧'));
    rec('g4 港剧 filter removed', noGang);
    await gotoHome(page);
    await tap(page, 'chrome.tabbar.vip.open');
    await tap(page, 'vip.checkin.wontfixToast', 0, 'action');
    rec('g4 vip checkin flips', (await slice(page, 'membership'))?.checkedIn === true);
    rec('g4 vip checkin coupon sheet', await has(page, '[data-action="vip.checkin.coupon.claim"]'));
    if (await has(page, '[data-action="vip.checkin.coupon.claim"]')) {
      await tap(page, 'vip.checkin.coupon.claim', 0, 'action');
    }
    await tap(page, 'vip.plantab.select.svip', 0, 'action');
    await tap(page, 'vip.plan.select.year', 0, 'action');
    const expBefore = (await slice(page, 'membership'))?.expireTs ?? 0;
    await tap(page, 'vip.activate.confirm', 0, 'action');
    await completeAlipayPay(page);
    const mid = (await slice(page, 'membership'))?.expireTs ?? 0;
    await tap(page, 'vip.activate.confirm', 0, 'action');
    await completeAlipayPay(page);
    const mem2 = await slice(page, 'membership');
    rec(
      'g4 vip year expire + renew stacks',
      mem2?.active === true && mid > expBefore && mem2.expireTs > mid,
      `exp ${expBefore}→${mid}→${mem2?.expireTs}`,
    );
    const vipConv = (await slice(page, 'conversations'))?.vip ?? [];
    rec('g4 vip syncs vip msg', typeof vipConv[0]?.text === 'string' && vipConv[0].text.includes('会员'));
    await gotoHome(page);
    await tap(page, 'chrome.tabbar.taohaopian.open');
    await tap(page, 'taohaopian.hot.filter.select.heibang', 0, 'action');
    await page.waitForTimeout(200);
    const gangSig = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-trigger="taohaopian.hot.player.open"]'))
        .slice(0, 4)
        .map((el) => (el.textContent || '').replace(/\s+/g, ' ').slice(0, 24))
        .join('|'),
    );
    await tap(page, 'taohaopian.hot.filter.select.hot', 0, 'action');
    await page.waitForTimeout(200);
    const hotSig2 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-trigger="taohaopian.hot.player.open"]'))
        .slice(0, 4)
        .map((el) => (el.textContent || '').replace(/\s+/g, ' ').slice(0, 24))
        .join('|'),
    );
    rec('g4 tao hot filter changes list', hotSig2 !== gangSig && hotSig2.length > 0, `${gangSig} vs ${hotSig2}`);
    await gotoHome(page);
    const moments = await slice(page, 'moments');
    rec('g4 seed moment present', Array.isArray(moments) && moments.length >= 1);
    const notices = await slice(page, 'notices');
    rec(
      'g4 notices seeded',
      (notices?.likes?.length ?? 0) >= 2 &&
        (notices?.comments?.length ?? 0) >= 2 &&
        (notices?.danmu?.length ?? 0) >= 2 &&
        (notices?.fans?.length ?? 0) >= 2,
    );
  } catch (e) { rec('gate4-0731 regressions', false, String(e).slice(0, 140)); await gotoHome(page); }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n===== ${results.length - failed.length}/${results.length} PASS =====`);
  if (errors.length) {
    console.log(`CONSOLE/PAGE ERRORS (零容忍) x${errors.length}:`);
    [...new Set(errors)].slice(0, 12).forEach((e) => console.log('  ' + e));
  }
  if (failed.length || errors.length) process.exit(1);
};

main().catch((e) => { console.error(e); process.exit(1); });
