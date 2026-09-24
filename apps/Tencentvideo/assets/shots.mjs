// apps/Tencentvideo/assets/shots.mjs —— 走查截图器(puppeteer,360x800 = 手机屏原尺寸)。
// 用途:阶段⑤自查与阶段⑥ visual-diff 的「我方」素材,避免靠 IDE 浏览器人眼截图。
// 运行(需先起 dev server:npm run dev):
//   node apps/Tencentvideo/assets/shots.mjs                    # 跑全部场景
//   node apps/Tencentvideo/assets/shots.mjs detail vip         # 只跑名字含关键字的场景
// 产出:docs/tencentvideo-replication/shots/<场景名>.png
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../../../../../docs/tencentvideo-replication/shots');
const URL = 'http://127.0.0.1:3000';
const APP_ID = 'tencentvideo';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** 冷启动:清干净 localStorage 再进 app,保证每个场景种子态一致。 */
async function fresh(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.__SIM__?.resetState?.();
    localStorage.clear();
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__OS__?.openApp), { timeout: 15000 });
  await page.evaluate((id) => window.__OS__.openApp(id), APP_ID);
  await wait(700);
}

/** 点 data-trigger / data-action;nth 从 0 开始。缺元素直接抛,场景标红。 */
async function click(page, selector, nth = 0) {
  const els = await page.$$(selector);
  if (!els[nth]) throw new Error(`未找到元素 ${selector} [${nth}]`);
  await els[nth].click();
  await wait(260);
}

const trigger = (id) => `[data-trigger="${id}"]`;
const action = (id) => `[data-action="${id}"]`;
/** 按 params 精确挑一个 trigger(例:同一个 detail.series.open.fromFeed 有十几张卡)。 */
const triggerWith = (id, needle) => `[data-trigger="${id}"][data-trigger-params*="${needle}"]`;

/** 往页面里第一个真输入框敲字(搜索联想这类没有可点的元素,只能靠键盘)。 */
async function typeInto(page, text) {
  for (const h of await page.$$('input, textarea')) {
    const box = await h.boundingBox();
    if (!box || box.width < 2 || box.height < 2) continue;
    await h.click();
    await page.keyboard.type(text);
    await wait(400);
    return;
  }
  throw new Error('页面上没有可输入的框');
}

/** 键盘搜索键提交(联想页只有 Enter 能提交)。 */
async function pressEnter(page) {
  await page.keyboard.press('Enter');
  await wait(400);
}

/** 滚到指定位置(app 内部滚动容器,不是 window)。 */
async function scrollTo(page, top) {
  await page.evaluate((y) => {
    const el = document.querySelector('[data-scroll-container="main"]') ?? document.scrollingElement;
    el.scrollTop = y;
  }, top);
  await wait(400);
}

/** 常用前置链路,免得每个场景重抄一遍 */
const toSeriesDetail = [
  async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'zheyikexindong')),
  async (page) => click(page, action('detail.series.guide.dismiss')),
];
const toPortraitPlayer = [
  ...toSeriesDetail,
  async (page) => click(page, trigger('player.portrait.open.fromSeries')),
];
const toFullscreen = [
  ...toPortraitPlayer,
  async (page) => click(page, trigger('player.fullscreen.open.fromPortrait')),
];

/**
 * 场景表:name 用于文件名,steps 顺序执行。
 * landscape: true 的场景多出一张 <name>-flat.png(横屏画面摆正后的原尺寸图)。
 */
const SCENARIOS = [
  {
    name: '01-home-feed-immersive',
    steps: [],
  },
  {
    name: '02-home-feed-scrolled',
    steps: [async (page) => scrollTo(page, 420)],
  },
  // 03~06 对标证据 824/825/826:连载剧「这一刻心动」(热播榜第2、更新至15/全33、VIP从第10集起)
  {
    name: '03-detail-series-guide',
    steps: [async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'zheyikexindong'))],
  },
  {
    name: '04-detail-series-main',
    steps: [
      async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'zheyikexindong')),
      async (page) => click(page, action('detail.series.guide.dismiss')),
    ],
  },
  {
    name: '05-detail-series-scrolled',
    steps: [
      async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'zheyikexindong')),
      async (page) => click(page, action('detail.series.guide.dismiss')),
      async (page) => scrollTo(page, 520),
    ],
  },
  {
    name: '06-detail-series-finished',
    steps: [
      async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'hezugongyu4')),
      async (page) => click(page, action('detail.series.guide.dismiss')),
    ],
  },
  // 07~10 播放器族:详情 → 竖屏播放 → 全屏
  {
    name: '07-player-portrait',
    steps: [
      async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'zheyikexindong')),
      async (page) => click(page, action('detail.series.guide.dismiss')),
      async (page) => click(page, trigger('player.portrait.open.fromSeries')),
    ],
  },
  {
    name: '08-player-portrait-paused-ad',
    steps: [
      async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'zheyikexindong')),
      async (page) => click(page, action('detail.series.guide.dismiss')),
      async (page) => click(page, trigger('player.portrait.open.fromSeries')),
      async (page) => click(page, action('player.portrait.play.toggle')),
    ],
  },
  {
    name: '09-player-fullscreen',
    landscape: true,
    steps: [
      async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'zheyikexindong')),
      async (page) => click(page, action('detail.series.guide.dismiss')),
      async (page) => click(page, trigger('player.portrait.open.fromSeries')),
      async (page) => click(page, trigger('player.fullscreen.open.fromPortrait')),
    ],
  },
  {
    name: '10-player-fullscreen-screenshot',
    landscape: true,
    steps: [
      async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'zheyikexindong')),
      async (page) => click(page, action('detail.series.guide.dismiss')),
      async (page) => click(page, trigger('player.portrait.open.fromSeries')),
      async (page) => click(page, trigger('player.fullscreen.open.fromPortrait')),
      async (page) => click(page, action('player.fullscreen.screenshot.take')),
    ],
  },
  // 11~18 播放器弹层组:竖屏半屏(更多/倍速)+ 横屏抽屉(弹幕/画质/选集/分享)
  {
    name: '11-sheets-more-portrait',
    steps: [...toPortraitPlayer, async (page) => click(page, trigger('player.sheets.open.more.fromPortrait'))],
  },
  {
    name: '12-sheets-speed-portrait',
    steps: [
      ...toPortraitPlayer,
      async (page) => click(page, trigger('player.sheets.open.more.fromPortrait')),
      async (page) => click(page, action('player.sheets.more.toSpeed')),
    ],
  },
  {
    name: '13-sheets-timer-portrait',
    steps: [
      ...toPortraitPlayer,
      async (page) => click(page, trigger('player.sheets.open.more.fromPortrait')),
      async (page) => click(page, action('player.sheets.timer.set')),
    ],
  },
  {
    name: '14-player-portrait-audiomode',
    steps: [
      ...toPortraitPlayer,
      async (page) => click(page, trigger('player.sheets.open.more.fromPortrait')),
      async (page) => click(page, action('player.sheets.audioMode.enter')),
    ],
  },
  {
    name: '15-sheets-danmaku-landscape',
    landscape: true,
    steps: [...toFullscreen, async (page) => click(page, trigger('player.sheets.open.danmakuToolbox'))],
  },
  {
    name: '16-sheets-quality-landscape',
    landscape: true,
    steps: [...toFullscreen, async (page) => click(page, trigger('player.sheets.open.quality'))],
  },
  {
    name: '17-sheets-episodes-landscape',
    landscape: true,
    steps: [...toFullscreen, async (page) => click(page, trigger('player.sheets.open.episodes'))],
  },
  {
    name: '18-sheets-share-landscape',
    landscape: true,
    steps: [...toFullscreen, async (page) => click(page, trigger('player.sheets.open.sharePoster'))],
  },
  {
    name: '19-sheets-speed-landscape',
    landscape: true,
    steps: [...toFullscreen, async (page) => click(page, trigger('player.sheets.open.speed'))],
  },
  // 20 综艺形态选集面板(证据 853:季行 + 子tab + 分段 + 期卡)
  {
    name: '20-sheets-episodes-variety',
    landscape: true,
    steps: [
      async (page) => click(page, triggerWith('detail.series.open.fromFeed', 'chongyaba10')),
      async (page) => click(page, action('detail.series.guide.dismiss')),
      async (page) => click(page, trigger('player.portrait.open.fromSeries')),
      async (page) => click(page, trigger('player.fullscreen.open.fromPortrait')),
      async (page) => click(page, trigger('player.sheets.open.episodes')),
    ],
  },
  // 21~26 会员族:权益墙 + 收银台各 uiState
  {
    name: '21-vip-wall',
    landscape: true,
    steps: [
      ...toFullscreen,
      async (page) => click(page, trigger('player.sheets.open.quality')),
      async (page) => click(page, trigger('vip.wall.open.fromQuality')),
    ],
  },
  {
    name: '22-vip-cashier-redpacket',
    steps: [...toSeriesDetail, async (page) => click(page, trigger('vip.cashier.open.fromDetail'))],
  },
  {
    name: '23-vip-cashier-vip-tab',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('vip.cashier.open.fromDetail')),
      async (page) => click(page, action('vip.cashier.redpacket.claim')),
    ],
  },
  {
    name: '24-vip-cashier-svip-tab-scrolled',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('vip.cashier.open.fromDetail')),
      async (page) => click(page, action('vip.cashier.redpacket.close')),
      async (page) => click(page, action('vip.cashier.tab.switch'), 1),
      async (page) => scrollTo(page, 620),
    ],
  },
  {
    name: '25-vip-cashier-compare',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('vip.cashier.open.fromDetail')),
      async (page) => click(page, action('vip.cashier.redpacket.close')),
      async (page) => click(page, action('vip.cashier.compare.open')),
    ],
  },
  {
    name: '26-vip-cashier-paysuccess',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('vip.cashier.open.fromDetail')),
      async (page) => click(page, action('vip.cashier.redpacket.close')),
      async (page) => click(page, action('vip.cashier.tab.switch'), 1),
      async (page) => click(page, action('vip.cashier.agreement.toggle')),
      async (page) => click(page, action('vip.cashier.pay')),
    ],
  },
  // 27~32 首页衍生态 + 榜单 / 筛选 / 以片找片
  { name: '27-home-channel-full', steps: [async (page) => click(page, trigger('home.channel.full.switch.fromFeed'))] },
  { name: '28-home-channel-lite', steps: [async (page) => click(page, trigger('home.channel.lite.switch.fromFeed'))] },
  { name: '29-home-shortvideo', steps: [async (page) => click(page, trigger('home.shortvideo.switch.fromFeed'))] },
  { name: '30-rank-page', steps: [async (page) => click(page, trigger('rank.page.open.fromFeedBadge'))] },
  { name: '31-filter-page', steps: [async (page) => click(page, trigger('filter.page.open.fromSearchbar'))] },
  {
    name: '32-findfilm-page',
    steps: [
      async (page) => click(page, trigger('filter.page.open.fromSearchbar')),
      async (page) => click(page, trigger('findfilm.page.open.fromFilter')),
    ],
  },
  // 33~37 好物 / 年度活动 / 短剧族
  { name: '33-haopian', steps: [async (page) => click(page, trigger('tab.haopian'))] },
  {
    name: '34-activity-yearly',
    steps: [
      async (page) => click(page, trigger('tab.haopian')),
      async (page) => click(page, trigger('activity.yearly.open.fromHaopian')),
    ],
  },
  { name: '35-shortdrama-home', steps: [async (page) => click(page, trigger('tab.shortdrama'))] },
  {
    name: '36-shortdrama-player',
    steps: [
      async (page) => click(page, trigger('tab.shortdrama')),
      async (page) => click(page, trigger('shortdrama.player.open.fromHome')),
    ],
  },
  {
    name: '37-shortdrama-player-episodes',
    steps: [
      async (page) => click(page, trigger('tab.shortdrama')),
      async (page) => click(page, trigger('shortdrama.player.open.fromHome')),
      async (page) => click(page, action('shortdrama.player.episodes.open')),
    ],
  },
  // 38~41 搜索族(联想/结果/空结果都靠键盘进)
  { name: '38-search-hub', steps: [async (page) => click(page, trigger('search.hub.open.fromHome'))] },
  {
    name: '39-search-suggest',
    steps: [
      async (page) => click(page, trigger('search.hub.open.fromHome')),
      async (page) => typeInto(page, '心动'),
    ],
  },
  {
    name: '40-search-result',
    steps: [
      async (page) => click(page, trigger('search.hub.open.fromHome')),
      async (page) => click(page, trigger('search.result.open.fromHotword')),
    ],
  },
  {
    name: '41-search-empty',
    steps: [
      async (page) => click(page, trigger('search.hub.open.fromHome')),
      async (page) => typeInto(page, '这个片名根本不存在'),
      async (page) => pressEnter(page),
    ],
  },
  // 42~45 其余详情形态(电影 / 剧场版 / 体育 / 选集面板)
  { name: '42-detail-movie', steps: [async (page) => click(page, trigger('detail.movie.open.fromFeed'))] },
  {
    name: '43-detail-special',
    steps: [
      async (page) => click(page, trigger('search.hub.open.fromHome')),
      async (page) => typeInto(page, '沪上花开'),
      async (page) => pressEnter(page),
      async (page) => click(page, trigger('detail.special.open.fromResult')),
    ],
  },
  {
    name: '44-detail-sports',
    steps: [
      async (page) => click(page, triggerWith('home.channel.full.switch.fromFeed', 'NBA')),
      async (page) => click(page, trigger('detail.sports.open.fromChannel')),
    ],
  },
  {
    name: '45-detail-episode-panel',
    steps: [...toSeriesDetail, async (page) => click(page, trigger('detail.episodePanel.open.fromDetail'))],
  },
  // 46~48 详情内页(评论 / 讨论 / 二创)
  {
    name: '46-detail-comments',
    steps: [...toSeriesDetail, async (page) => click(page, trigger('detail.comments.open.fromSeries'))],
  },
  {
    name: '47-detail-discuss',
    steps: [...toSeriesDetail, async (page) => click(page, trigger('detail.discuss.open.fromTab'))],
  },
  {
    name: '48-detail-ugc',
    steps: [...toSeriesDetail, async (page) => click(page, trigger('detail.ugc.open.fromTab'))],
  },
  { name: '49-star-page', steps: [...toSeriesDetail, async (page) => click(page, trigger('star.page.open.fromSeries'))] },
  // 50~51 投屏族(搜索态要等扫描转圈结束)
  {
    name: '50-cast-search',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('cast.search.open.fromDetail')),
      async () => wait(3000),
    ],
  },
  {
    name: '51-cast-control',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('cast.search.open.fromDetail')),
      async (page) => click(page, trigger('cast.control.open.airplay')),
    ],
  },
  // 52~56 下载族:种子里下载列表是空的,先真下一集才有「下载中/剧集组」
  {
    name: '52-download-select',
    steps: [...toSeriesDetail, async (page) => click(page, trigger('download.select.open.fromDetail'))],
  },
  {
    name: '53-download-mine-empty',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('download.mine.open.fromMe'))],
  },
  {
    name: '54-download-mine',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('download.select.open.fromDetail')),
      async (page) => click(page, action('download.select.all.add')),
      async (page) => click(page, trigger('download.mine.open.fromSelect')),
    ],
  },
  {
    name: '55-download-running',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('download.select.open.fromDetail')),
      async (page) => click(page, action('download.select.all.add')),
      async (page) => click(page, trigger('download.mine.open.fromSelect')),
      async (page) => click(page, trigger('download.running.open.fromMine')),
    ],
  },
  {
    name: '56-download-series',
    steps: [
      ...toSeriesDetail,
      async (page) => click(page, trigger('download.select.open.fromDetail')),
      async (page) => click(page, action('download.select.all.add')),
      async (page) => click(page, trigger('download.mine.open.fromSelect')),
      async (page) => click(page, trigger('download.series.open.fromMine')),
    ],
  },
  // 57~58 会员频道族（未接通的领会员/联合会员页已移除）
  { name: '57-vipzone', steps: [async (page) => click(page, trigger('tab.vipzone'))] },
  {
    name: '58-vipzone-points',
    steps: [
      async (page) => click(page, trigger('tab.vipzone')),
      async (page) => click(page, trigger('vip.zone.points.open.fromTab')),
    ],
  },
  // 61~72 「我的」族
  { name: '61-me-home', steps: [async (page) => click(page, trigger('tab.me'))] },
  {
    name: '62-me-drawer',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('me.drawer.open.fromMe'))],
  },
  {
    name: '63-coin-center',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('coin.center.open.fromMe'))],
  },
  {
    name: '64-me-profile',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('me.profile.open.fromMe'))],
  },
  {
    name: '65-me-favorites',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('me.favorites.open.fromMe'))],
  },
  {
    name: '66-me-follows',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('me.follows.open.fromMe'))],
  },
  {
    name: '67-me-history',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('me.history.open.fromMe'))],
  },
  {
    name: '68-msg-center',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('msg.center.open.fromMe'))],
  },
  {
    name: '69-settings',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('settings.home.open.fromMe'))],
  },
  {
    name: '70-settings-sub',
    steps: [
      async (page) => click(page, trigger('tab.me')),
      async (page) => click(page, trigger('settings.home.open.fromMe')),
      async (page) => click(page, trigger('settings.sub.open.appearance')),
    ],
  },
  {
    name: '71-device-manage',
    steps: [async (page) => click(page, trigger('tab.me')), async (page) => click(page, trigger('device.manage.open.fromMe'))],
  },
];

async function main() {
  const filters = process.argv.slice(2);
  const picked = filters.length
    ? SCENARIOS.filter((s) => filters.some((f) => s.name.includes(f)))
    : SCENARIOS;
  if (!picked.length) {
    console.error(`没有匹配的场景:${filters.join(' ')}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  // puppeteer 自带 chromium 在沙箱里常拿不到缓存目录,优先借系统 Chrome。
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    headless: true,
    ...(existsSync(systemChrome) ? { executablePath: systemChrome } : {}),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });

  const errors = [];
  const sceneErrors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`));
  page.on('console', (m) => {
    // WMR = 桌面小组件,不属于本 app 范围
    const text = m.text();
    if (m.type() === 'error' && !text.includes('404') && !text.includes('[WMR]')) {
      errors.push(`console: ${text.slice(0, 200)}`);
    }
  });

  let failed = 0;
  try {
    for (const scenario of picked) {
      try {
        await fresh(page);
        for (const step of scenario.steps) await step(page);
        await wait(200);
        const file = resolve(OUT_DIR, `${scenario.name}.png`);
        await page.screenshot({ path: file });
        // 横屏页额外出一张「摆正」图:把旋转舞台的 transform 去掉后单独截元素,
        // 得到 744x360 的横屏画面,才好和真机横屏证据(846 等)逐块对。
        if (scenario.landscape) {
          const box = await page.evaluate(() => {
            const el = document.querySelector('.tv-landscape-stage');
            if (!(el instanceof HTMLElement)) return null;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            // 摆正 + 脱离手机壳的 overflow 裁剪,才能整块截下来
            el.style.position = 'fixed';
            el.style.transform = 'none';
            el.style.left = '0';
            el.style.top = '0';
            el.style.zIndex = '9999';
            for (let p = el.parentElement; p; p = p.parentElement) p.style.overflow = 'visible';
            return { width: w, height: h };
          });
          if (box) {
            await wait(150);
            await page.screenshot({
              path: resolve(OUT_DIR, `${scenario.name}-flat.png`),
              clip: { x: 0, y: 0, ...box },
              captureBeyondViewport: true,
            });
          }
        }
        // 运行时错误按场景报,不然只知道「有 4 条」却不知道是哪个页面在报
        const mine = errors.splice(0);
        console.log(`  ok   ${scenario.name}.png${mine.length ? `  ⚠︎ ${mine.length} 条运行时错误` : ''}`);
        for (const e of mine) console.log(`       - ${e}`);
        sceneErrors.push(...mine.map((e) => `${scenario.name}: ${e}`));
      } catch (e) {
        failed += 1;
        console.log(`  FAIL ${scenario.name}: ${e.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n截图: ${picked.length - failed}/${picked.length} 成功 -> ${OUT_DIR}`);
  const allErrors = [...sceneErrors, ...errors];
  if (allErrors.length) {
    console.log(`运行时错误 ${allErrors.length} 条:`);
    for (const e of allErrors.slice(0, 10)) console.log(`  - ${e}`);
  }
  if (failed || allErrors.length) process.exit(1);
}

await main();
