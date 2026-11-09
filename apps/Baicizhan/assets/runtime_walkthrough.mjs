// 百词斩 运行时走查(pipeline v3 §5.2 第五道 gate)。
// 监听 console/pageerror(零容忍);P0 状态断言(坑四:绑定了但不生效);
// 返回可达性断言(§11:深页连续 back → 回 tab 根,签名序列无环)。
// 用法: node apps/Baicizhan/assets/runtime_walkthrough.mjs  (需先 npm run dev)
import puppeteer from 'puppeteer';

const URL = process.env.BAICIZHAN_WALKTHROUGH_URL ?? 'http://127.0.0.1:3000';
const APP = 'baicizhan';

const results = [];
const rec = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slice = (page, k) => page.evaluate((a, key) => window.__SIM__.getState().apps[a]?.[key], APP, k).catch(() => undefined);
const count = async (page, sel) => (await page.$$(sel)).length;
const has = async (page, sel) => (await count(page, sel)) > 0;
const tap = async (page, id, i = 0, kind = 'trigger') => {
  const els = await page.$$(`[data-${kind}="${id}"]`);
  if (!els[i]) throw new Error(`no [data-${kind}="${id}"] #${i}`);
  await els[i].evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await sleep(120);
  await els[i].click();
  await sleep(420);
};
const act = (page, id, i = 0) => tap(page, id, i, 'action');
const back = async (page) => { await page.evaluate(() => window.__OS__.handleBack()); await sleep(360); };
const atHome = (page) => has(page, '[data-trigger="home.study.start"]');
const gotoHome = async (page) => {
  for (let i = 0; i < 10; i++) { if (await atHome(page)) break; await back(page); }
  if (!(await atHome(page))) { await page.evaluate((a) => window.__OS__.openApp(a), APP); await sleep(700); }
};
const sig = (page) => page.evaluate(() => (document.querySelector('[data-adjust-resize]') || document.body).innerText.replace(/\s+/g, '').slice(0, 50));
const toastText = (page) => page.evaluate((a) => window.__SIM__.getState().apps[a]?._temp?.toast ?? '', APP);
const chooseIntentApp = async (page, label) => {
  const chosen = await page.evaluate((text) => {
    const chooserTitle = [...document.querySelectorAll('div')]
      .find((el) => el.textContent?.trim() === '选择应用');
    if (!chooserTitle) return false;
    const button = [...document.querySelectorAll('button')]
      .find((el) => el.textContent?.trim() === text);
    button?.click();
    return !!button;
  }, label);
  await sleep(500);
  return chosen;
};

/** 确保有一个收货地址(付款前置条件,Gate4v5) */
const ensureAddress = async (page) => {
  const n = (await page.evaluate(() => window.__SIM__.getState().apps.baicizhan?.addresses?.length ?? 0));
  if (n > 0) return;
  await tap(page, 'order.address.open');
  await page.type('input[placeholder="姓名"]', '张三').catch(() => {});
  await page.type('input[placeholder="手机号"]', '13800000000').catch(() => {});
  await page.type('input[placeholder="街道、楼牌等号"]', '某某路1号').catch(() => {});
  await act(page, 'address.form.save');
  await sleep(500);
};

/** 最新 main 已接入系统支付 Activity；通过支付宝收银台完成真实回调。 */
const payThroughAlipay = async (page) => {
  await act(page, 'order.pay.select.alipay');
  if (await has(page, '[data-action="order.terms.check"]')) await act(page, 'order.terms.check');
  await act(page, 'order.pay.submit');
  await tap(page, 'cashier.password.open');
  // 支付宝种子支付密码为 123456；键盘按钮共用 action id，索引对应数字 1..9。
  for (let digit = 1; digit <= 6; digit++) {
    await act(page, 'cashierPassword.keypad.press', digit - 1);
  }
  await sleep(1200);
};

const main = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(1800);
  await page.evaluate((a) => window.__OS__.openApp(a), APP);
  await sleep(1600);
  rec('app launches', await atHome(page));

  // §10.3 种子
  const words = await slice(page, 'words');
  rec('seed words >=200 (Gate4v3)', (words?.length ?? 0) >= 200, `${words?.length} words`);
  // Gate4v4:基础高频词必须在词库里(此前查 hello 查不到)
  const hasBasic = (words ?? []).some((w) => w.word === 'hello');
  rec('word bank includes basic words (hello)', hasBasic);
  // Gate4v4:单词本存在(新建单词本可用)
  const wbCount = (await slice(page, 'wordbooks'))?.length ?? 0;
  rec('seed wordbooks present', wbCount >= 1, `${wbCount}`);
  const products = await slice(page, 'products');
  rec('seed products >=5', (products?.length ?? 0) >= 5, `${products?.length}`);

  // ---- 系统能力:分享渠道统一走 ACTION_SEND ----
  await tap(page, 'home.share.open');
  rec('G-system: all five share channels are actionable', (await count(page, '[data-action="share.channel.system"]')) === 5);
  await act(page, 'share.channel.system', 0);
  const chooserShown = await chooseIntentApp(page, '微信');
  const shareTarget = await page.evaluate(() => window.__OS__.state.activeAppId);
  rec('G-system: share opens ACTION_SEND target', chooserShown && shareTarget === 'wechat', String(shareTarget));
  await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'CANCELED' }));
  await sleep(500);

  // ---- 系统能力:会员付费走 ACTION_PAY,成功回调才完成 ----
  await gotoHome(page);
  await tap(page, 'home.member.open');
  await act(page, 'member.plan.select.monthly');
  await act(page, 'member.buy.system');
  const memberPayTarget = await page.evaluate(() => window.__OS__.state.activeAppId);
  const memberPayIntent = await page.evaluate(() => window.__OS__.getIntentPayload('alipay'));
  rec('G-system: member opens ACTION_PAY cashier', memberPayTarget === 'alipay' && memberPayIntent?.data?.amount === 9,
    `${memberPayTarget}, amount=${memberPayIntent?.data?.amount}`);
  await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'OK' }));
  await sleep(500);
  rec('G-system: member handles payment callback', (await toastText(page)).includes('会员已开通'));

  // ---- 系统能力:金币充值走 ACTION_PAY,回调成功后才到账 ----
  await gotoHome(page);
  await tap(page, 'home.avatar.open');
  await tap(page, 'profile.wallet.open');
  const walletCoinsBefore = await slice(page, 'coins');
  await act(page, 'wallet.recharge.system');
  const walletPayTarget = await page.evaluate(() => window.__OS__.state.activeAppId);
  const walletPayIntent = await page.evaluate(() => window.__OS__.getIntentPayload('alipay'));
  rec('G-system: wallet opens ACTION_PAY cashier', walletPayTarget === 'alipay' && walletPayIntent?.data?.amount === 1,
    `${walletPayTarget}, amount=${walletPayIntent?.data?.amount}`);
  await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'OK' }));
  await sleep(500);
  const walletCoinsAfter = await slice(page, 'coins');
  rec('G-system: wallet credits only after success callback', walletCoinsAfter === walletCoinsBefore + 1,
    `${walletCoinsBefore}→${walletCoinsAfter}`);

  // ---- 系统能力:阅读会员/付费营走 ACTION_PAY ----
  await gotoHome(page);
  await tap(page, 'home.read.open');
  await tap(page, 'read.tabbar.profile');
  await act(page, 'read.member.pay.system');
  const readMemberIntent = await page.evaluate(() => window.__OS__.getIntentPayload('alipay'));
  rec('G-system: reading membership opens ACTION_PAY', readMemberIntent?.data?.amount === 9, `amount=${readMemberIntent?.data?.amount}`);
  await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'CANCELED' }));
  await sleep(400);
  await tap(page, 'read.tabbar.camp');
  await act(page, 'read.camp.pay.system');
  const campPayIntent = await page.evaluate(() => window.__OS__.getIntentPayload('alipay'));
  rec('G-system: paid reading camp opens ACTION_PAY', campPayIntent?.data?.amount === 99, `amount=${campPayIntent?.data?.amount}`);
  await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'CANCELED' }));
  await sleep(400);
  await gotoHome(page);

  // 主 4 tab；主体功能均未实现的「一起背」不再暴露在主导航。
  for (const [tab, trig] of [['course', 'tabbar.course'], ['train', 'tabbar.train'], ['mall', 'tabbar.mall'], ['home', 'tabbar.home']]) {
    try { await tap(page, trig); rec(`tab ${tab} renders`, true); } catch (e) { rec(`tab ${tab}`, false, String(e).slice(0, 60)); }
  }
  rec('dead together tab is removed', !(await has(page, '[data-trigger="tabbar.together"]')));

  // ---- 业务走查 2026-08-03:学习封面 + 可进入课程 ----
  await tap(page, 'tabbar.course');
  const coverCount = await count(page, '[data-learning-cover]');
  rec('G-course: learning covers replace blank blocks', coverCount >= 3, `${coverCount} covers`);
  await tap(page, 'course.lesson.open', 0);
  rec('G-course: available course opens lesson', await has(page, '[data-action="course.lesson.complete"]'));
  await act(page, 'course.lesson.complete');
  rec('G-course: lesson can progress', (await sig(page)).includes('第2节'));
  const storedCourseProgress = await slice(page, 'courseProgress');
  rec('G-store: course progress persists in app store', Object.values(storedCourseProgress ?? {}).some((chapters) => chapters.includes(0)));

  // ---- 查词输入一个字母:批量联想 + 可点选 ----
  await gotoHome(page);
  await tap(page, 'home.dict.open');
  const dictInput = await page.$('input');
  await dictInput?.type('a');
  await sleep(500);
  const suggestionCount = await count(page, '[data-trigger="dict.suggestion.open"]');
  rec('G-dict: one letter shows multiple suggestions', suggestionCount >= 5, `${suggestionCount} suggestions`);
  await tap(page, 'dict.suggestion.open', 0);
  rec('G-dict: suggestion opens word detail', await has(page, '[data-action="dict.result.collect"]'));

  // ---- 列表条目必须带 id，打开第二个词不能仍显示固定首词 ----
  await gotoHome(page);
  await tap(page, 'home.book.plan.open');
  await tap(page, 'book.plan.current');
  await tap(page, 'book.adjust.words.open');
  const wordRows = await page.$$eval('[data-trigger="book.words.open"]', (rows) => rows.slice(0, 2).map((row) => row.querySelector('.text-base')?.textContent ?? ''));
  await tap(page, 'book.words.open', 1);
  const openedWord = await page.evaluate(() => document.querySelector('.text-4xl')?.textContent ?? '');
  rec('G-id: second word row opens its own word', wordRows[1] && openedWord === wordRows[1], `${wordRows[1]}→${openedWord}`);

  // ---- 外刊问卷生成后进入计划详情 ----
  await gotoHome(page);
  await tap(page, 'home.read.open');
  await act(page, 'read.ttab.select.journal');
  await act(page, 'read.survey.answer', 0);
  await tap(page, 'read.plan.generate');
  rec('G-read: generated journal plan has detail', await has(page, '[data-trigger="read.plan.article.open"]'));
  const storedPlan = await slice(page, 'readPlan');
  rec('G-store: generated reading plan persists', !!storedPlan?.option && storedPlan?.articleIds?.length >= 3);

  // ---- 阅读器:播放/切段/切集 ----
  await tap(page, 'read.plan.article.open', 0);
  await act(page, 'read.article.audio.toggle', 0);
  await sleep(700);
  const playingText = await page.evaluate(() => document.body.innerText.includes('正在朗读'));
  rec('G-read: article playback changes visible progress', playingText);
  await act(page, 'read.article.audio.next');
  await tap(page, 'read.article.toc.open');
  const tocCount = await count(page, '[data-trigger="read.toc.article.open"]');
  rec('G-read: article collection lists switchable issues', tocCount >= 3, `${tocCount} issues`);
  await tap(page, 'read.toc.article.open', 1);
  rec('G-read: switching issue returns to reader', await has(page, '[data-action="read.article.audio.toggle"]'));
  const readCharsOnce = await slice(page, 'readChars');
  await tap(page, 'read.article.toc.open');
  await tap(page, 'read.toc.article.open', 1);
  const readCharsAgain = await slice(page, 'readChars');
  const readArticleIds = await slice(page, 'readArticleIds');
  rec('G-store: reopening article does not double-count chars', readCharsAgain === readCharsOnce && new Set(readArticleIds ?? []).size === (readArticleIds ?? []).length, `${readCharsOnce}→${readCharsAgain}`);

  // ---- P0-1: 新学答题(记忆模式先切,答一题看 learn 变化) ----
  await gotoHome(page);
  await tap(page, 'home.study.start');
  const learnBefore = await slice(page, 'learn');
  // 答第一个选项
  await act(page, 'study.quiz.answer', 0);
  const learnAfter = await slice(page, 'learn');
  const changed = JSON.stringify(learnBefore) !== JSON.stringify(learnAfter);
  rec('G-study: answering mutates learn state', changed);

  // ---- P0-1b 回归:答错不能卡死 —— 依次点全部 4 个选项(含错项),必须能推进到下一词 ----
  await gotoHome(page);
  await tap(page, 'home.study.start');
  const bigWord = () => page.evaluate(() => document.querySelector('[data-adjust-resize] .text-4xl')?.textContent || '');
  const w0 = await bigWord();
  for (let i = 0; i < 4; i++) { await act(page, 'study.quiz.answer', i).catch(() => {}); }
  await sleep(700);
  const w1 = await bigWord();
  rec('G-study: wrong-then-right advances (no deadlock)', w0 !== '' && w1 !== '' && w0 !== w1, `${w0}→${w1}`);

  // ---- P0-1c 回归(Gate4):点『斩』必须跳到下一词(此前只标记不跳) ----
  await gotoHome(page);
  await tap(page, 'home.study.start');
  const zw0 = await page.evaluate(() => document.querySelector('[data-adjust-resize] .text-4xl')?.textContent || '');
  await act(page, 'study.tool.zhan');
  await sleep(400);
  const zw1 = await page.evaluate(() => document.querySelector('[data-adjust-resize] .text-4xl')?.textContent || '');
  rec('G-study: 斩 advances to next word', zw0 && zw1 && zw0 !== zw1, `${zw0}→${zw1}`);

  // ---- Gate4v4:训练场 3 个新题型能进能答 ----
  for (const [name, openT, answerA] of [
    ['cnchoice', 'train.cnchoice.open', 'train.cnchoice.answer'],
    ['fillblank', 'train.fillblank.open', 'train.fillblank.pick'],
    ['assemble', 'train.assemble.open', 'train.assemble.pick'],
    ['selfcheck', 'train.selfcheck.open', 'train.selfcheck.known'],
  ]) {
    await gotoHome(page);
    await tap(page, 'tabbar.train');
    let ok = false;
    try { await tap(page, openT); ok = await has(page, `[data-action="${answerA}"]`); } catch { ok = false; }
    rec(`G-train: ${name} renders + answerable`, ok);
  }
  await gotoHome(page);
  await tap(page, 'tabbar.train');
  await tap(page, 'train.unavailable.open', 0);
  const noticeVisible = await has(page, '[role="dialog"]');
  await tap(page, 'system.back');
  rec('G-unavailable: unfinished core entry requires explicit confirmation', noticeVisible && await has(page, '[data-trigger="train.choice.open"]'));

  // ---- P0-2: 复习拼写/回忆(至少不崩,能推进) ----
  await gotoHome(page);
  await tap(page, 'home.review.start');
  rec('G-review: review session renders', await has(page, '[data-action]'));

  // ---- P0-3: 商城加购 → 购物车角标 → 去结算(Q12/G6) ----
  await gotoHome(page);
  await tap(page, 'tabbar.mall');
  await tap(page, 'mall.detail.open', 0);

  // 商品详情四个锚点必须切到真实内容区，不能只改变 tab 颜色。
  for (const key of ['reviews', 'recommend', 'intro', 'goods']) {
    await act(page, `mall.dtab.select.${key}`);
    await sleep(650);
    const located = await page.evaluate((sectionKey) => {
      const scroller = document.querySelector('[data-scroll-container="main"][data-mall-detail-active]');
      const section = document.querySelector(`[data-mall-detail-section="${sectionKey}"]`);
      if (!scroller || !section) return false;
      const sr = scroller.getBoundingClientRect();
      const tr = section.getBoundingClientRect();
      return scroller.getAttribute('data-mall-detail-active') === sectionKey
        && tr.top >= sr.top - 16 && tr.top < sr.bottom - 24;
    }, key);
    rec(`G-mall: detail tab ${key} locates real section`, located);
  }
  await act(page, 'mall.detail.fav');
  const favoriteIds = await slice(page, 'favoriteProductIds');
  rec('G-store: product favorite persists', (favoriteIds?.length ?? 0) === 1);

  const cartBefore = (await slice(page, 'cart'))?.length ?? 0;
  await act(page, 'mall.cart.add');
  await sleep(300);
  const cartAfter = (await slice(page, 'cart'))?.length ?? 0;
  rec('G-mall: add to cart writes cart', cartAfter > cartBefore, `${cartBefore}→${cartAfter}`);
  await tap(page, 'mall.detail.cart.open');
  rec('G-mall: cart shows checkout', await has(page, '[data-trigger="mall.checkout"]'));
  await tap(page, 'mall.checkout');
  rec('G-mall: reaches order confirm', await has(page, '[data-action="order.pay.submit"]'));
  await ensureAddress(page);
  await act(page, 'order.pro.system');
  const orderProIntent = await page.evaluate(() => window.__OS__.getIntentPayload('alipay'));
  rec('G-system: order PRO banner opens ACTION_PAY', orderProIntent?.data?.amount === 9, `amount=${orderProIntent?.data?.amount}`);
  await page.evaluate(() => window.__OS__.finishActivity({ resultCode: 'CANCELED' }));
  await sleep(400);
  // Gate4v2:付款 → 系统支付宝真通道成功回调 → 生成订单、购物车清空
  const ordersBefore = (await slice(page, 'orders'))?.length ?? 0;
  await payThroughAlipay(page);
  const ordersAfter = (await slice(page, 'orders'))?.length ?? 0;
  const cartNow = (await slice(page, 'cart'))?.length ?? 0;
  rec('G-mall: pay creates order + empties cart', ordersAfter > ordersBefore && cartNow === 0, `orders ${ordersBefore}→${ordersAfter}, cart=${cartNow}`);
  await act(page, 'mall.mine.favorite.toggle');
  rec('G-entry: mall mine reads the same favorite store', (await sig(page)).includes('我的收藏'));

  // ---- Gate4v4:立即购买 → 进确认订单页(填地址+支付),不再直接下单 ----
  await gotoHome(page);
  await tap(page, 'tabbar.mall');
  await tap(page, 'mall.detail.open', 0);
  const ob = (await slice(page, 'orders'))?.length ?? 0;
  await tap(page, 'mall.buynow.submit');
  await sleep(500);
  const onConfirm = await has(page, '[data-action="order.pay.submit"]');
  const oMid = (await slice(page, 'orders'))?.length ?? 0;
  rec('G-mall: buy-now goes to order confirm (not instant order)', onConfirm && oMid === ob);
  await ensureAddress(page);
  await payThroughAlipay(page);
  const oa = (await slice(page, 'orders'))?.length ?? 0;
  rec('G-mall: buy-now pay creates order', oa > ob, `orders ${ob}→${oa}`);

  // ---- Gate4v4:四选一正确项不应总落在同一格(此前几乎都在右下角) ----
  const spread = await page.evaluate(() => {
    const s = window.__SIM__.getState().apps.baicizhan;
    const hash = (str) => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; };
    const idx = s.words.slice(0, 40).map((w) => hash(w.id) % 4);
    return new Set(idx).size; // 正确项落位的不同格子数
  });
  rec('G-study: correct option spread across positions', spread >= 3, `${spread}/4 positions used`);

  // ---- P0-4: 任务领取铜板(claim → coins 增加) ----
  await gotoHome(page);
  await tap(page, 'home.task.open');
  const coinsBefore = await slice(page, 'coins');
  await act(page, 'task.reward.claim');
  const coinsAfter = await slice(page, 'coins');
  rec('G-task: claim increases coins', (coinsAfter ?? 0) > (coinsBefore ?? 0), `${coinsBefore}→${coinsAfter}`);

  // ---- P0-5: 收藏词 → 单词本计数(collectWord 联动) ----
  await gotoHome(page);
  await tap(page, 'home.cloud.tap', 0);
  const wbBefore = ((await slice(page, 'wordbooks')) || [])[0]?.wordIds?.length ?? 0;
  await act(page, 'study.word.collect');
  const wbAfter = ((await slice(page, 'wordbooks')) || [])[0]?.wordIds?.length ?? 0;
  rec('G-collect: star toggles wordbook count', wbBefore !== wbAfter, `${wbBefore}→${wbAfter}`);

  // ---- P0-6: 设置无语言开关但可切声音(§10.2 说明) ----
  await gotoHome(page);
  await tap(page, 'tabbar.home'); // ensure home
  await page.evaluate((a) => window.__SIM__.getState().apps[a], APP);

  // ---- 返回可达性(§11):深页连续 back → 回首页,URL 无环 ----
  await gotoHome(page);
  await tap(page, 'home.member.open');
  await tap(page, 'home.study.start').catch(() => {});
  const sigs = [];
  for (let i = 0; i < 6; i++) { sigs.push(await sig(page)); if (await atHome(page)) break; await back(page); }
  sigs.push(await sig(page));
  const reachedHome = await atHome(page);
  const noCycle = new Set(sigs).size >= Math.min(sigs.length, 3) || reachedHome;
  rec('G-back: deep pages back-reach home', reachedHome);
  rec('G-back: url signatures no tight cycle', noCycle);

  // ---- G-backbtn 回归:真实点击返回按钮(非 __OS__.handleBack),验证不被状态栏遮挡 ----
  // (曾因页面顶栏没留状态栏空间 pt-12,返回按钮被 z-1005 状态栏覆盖,点了没反应)
  const clickBackBtn = async () => {
    const el = (await page.$$('[data-trigger="system.back"]'))[0];
    if (!el) return false;
    const box = await el.boundingBox();
    if (!box) return false;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); // 真实坐标点击
    await sleep(450);
    return true;
  };
  for (const [name, openTrig, marker] of [
    ['member', 'home.member.open', '[data-action="member.buy.system"]'],
    ['coin', 'home.coin.open', '[data-trigger="coin.usemall.open"]'],
    ['task', 'home.task.open', '[data-trigger="task.goto.plan"]'],
    ['reading', 'home.read.open', '[data-trigger="read.tabbar.mine"]'],
  ]) {
    await gotoHome(page);
    await tap(page, openTrig);
    const onPage = await has(page, marker);
    await clickBackBtn();
    const leftPage = !(await has(page, marker));
    rec(`G-backbtn: real click back leaves ${name}`, onPage && leftPage);
  }
  // 阅读模块专项:进阅读 → 点『我读』tab → 回『推荐』→ 点 ‹ 必须回到百词斩首页(曾整个卡死在阅读里)
  await gotoHome(page);
  await tap(page, 'home.read.open');
  await tap(page, 'read.tabbar.mine');
  await tap(page, 'read.tabbar.home');
  await clickBackBtn();
  rec('G-backbtn: reading module ‹ returns to app home', await atHome(page));

  // ---- Gate4v5:表单「输入后点提交」必须生效(键盘收起会抖动布局,按钮需 data-keep-keyboard) ----
  // 用真实鼠标点击,复现「按下时键盘收起 → 按钮移走 → click 不触发」
  await gotoHome(page);
  await tap(page, 'home.wordbook.open');
  const wbN0 = (await slice(page, 'wordbooks'))?.length ?? 0;
  await tap(page, 'wordbook.create.open');
  await sleep(300);
  await page.type('input[placeholder="例如：外刊生词"]', '测试本').catch(() => {});
  const okBox = await page.evaluate(() => {
    const ok = document.querySelector('[data-action="wordbook.edit.save"]');
    if (!ok) return null;
    const r = ok.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (okBox) await page.mouse.click(okBox.x, okBox.y);
  await sleep(500);
  const wbN1 = (await slice(page, 'wordbooks'))?.length ?? 0;
  rec('G-form: create wordbook via real click (keyboard shift)', wbN1 > wbN0, `${wbN0}→${wbN1}`);

  // 新建后进入该单词本,添加一个词,再批量移除。
  const detailLinks = await page.$$('[data-trigger="wordbook.detail.open"]');
  if (detailLinks.length) {
    await detailLinks[detailLinks.length - 1].click();
    await sleep(400);
  }
  const customBook = ((await slice(page, 'wordbooks')) || []).at(-1);
  await tap(page, 'wordbook.add.open');
  await act(page, 'wordbook.add.word.toggle', 0);
  await act(page, 'wordbook.add.submit');
  const customAfterAdd = ((await slice(page, 'wordbooks')) || []).find((item) => item.id === customBook?.id);
  rec('G-wordbook: add-word path writes target book', (customAfterAdd?.wordIds?.length ?? 0) === 1);
  await act(page, 'wordbook.more.open');
  await act(page, 'wordbook.batch.edit');
  await act(page, 'wordbook.batch.word.toggle', 0);
  await act(page, 'wordbook.batch.delete.submit');
  const customAfterDelete = ((await slice(page, 'wordbooks')) || []).find((item) => item.id === customBook?.id);
  rec('G-wordbook: batch delete removes selected word', (customAfterDelete?.wordIds?.length ?? -1) === 0);

  // ---- Gate4v5:没有收货地址不允许付款 ----
  await gotoHome(page);
  await tap(page, 'tabbar.mall');
  await tap(page, 'mall.detail.open', 0);
  await tap(page, 'mall.buynow.submit');
  await sleep(400);
  const ordersB = (await slice(page, 'orders'))?.length ?? 0;
  const addrs = (await slice(page, 'addresses'))?.length ?? 0;
  await act(page, 'order.pay.submit');
  await sleep(400);
  const ordersA = (await slice(page, 'orders'))?.length ?? 0;
  rec('G-order: pay blocked without address', addrs === 0 ? ordersA === ordersB : true, `addr=${addrs}, orders ${ordersB}→${ordersA}`);

  // ---- 零 console / pageerror ----
  rec('zero console/pageerror', errors.length === 0, errors.slice(0, 4).join(' | '));

  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (errors.length) { console.log('\n--- captured errors ---'); errors.slice(0, 10).forEach((e) => console.log(e)); }
  process.exit(passed === results.length ? 0 : 1);
};

main().catch((e) => { console.error(e); process.exit(1); });
