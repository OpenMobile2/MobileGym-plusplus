// apps/Tencentvideo/assets/runtime_walkthrough.mjs —— 阶段⑤运行时走查(puppeteer,360x800)。
// 与 shots.mjs 的区别:不看外观,只验「每个声明过的 action 在运行时真的能点到、且点完有可观测变化」。
// 场景表不是手写的,是读 public/tencentvideo_action_tasks.json(由 scripts/build_nav_artifacts.mjs 产出)
// 里 351 条 action 任务的最短轨迹自动重放。
//
// 运行(需先起 dev server:npm run dev):
//   node apps/Tencentvideo/assets/runtime_walkthrough.mjs                 # 全量
//   node apps/Tencentvideo/assets/runtime_walkthrough.mjs search detail   # 只跑 actionId 含关键字的
//   node apps/Tencentvideo/assets/runtime_walkthrough.mjs --limit=40      # 只跑前 40 条
//   TV_CONCURRENCY=6 node apps/Tencentvideo/assets/runtime_walkthrough.mjs
// 产出:docs/tencentvideo-replication/runtime_walkthrough.json + 终端汇总
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const TASKS_FILE = resolve(ROOT, 'public/tencentvideo_action_tasks.json');
const GRAPH_FILE = resolve(ROOT, 'public/tencentvideo_nav_graph.json');
const OUT_DIR = resolve(ROOT, '../../docs/tencentvideo-replication');
const URL = process.env.TV_URL || 'http://127.0.0.1:3000';
const APP_ID = 'tencentvideo';
const CONCURRENCY = Number(process.env.TV_CONCURRENCY || 4);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const limit = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0);
const keywords = args.filter((a) => !a.startsWith('--'));

/**
 * 前置 action:导航图只记录「跨页」跳转,页内浮层(反馈菜单、表情条…)不算 transition,
 * 于是藏在浮层里的 action 直接找不到元素。这里补上「先点谁才能看见它」。
 */
const PREREQ = {
  // 明星维度只有综艺分类才有,且要先「展开 ∨」(证据 794/807)
  'filter.page.star.select': ['filter.page.category.switch$2', 'filter.page.dims.expand'],
  // 截图后的二级操作,先得截一张
  'player.fullscreen.screenshotExtra.wontfix': ['player.fullscreen.screenshot.take'],
  // 表情要先展开表情条
  'detail.discuss.emoji.react': ['detail.discuss.emojiBar.open'],
  // 「找片」分页上的筛选项
  'search.hub.findfilter.select': ['search.hub.tab.switch$last'],
  // 「猜你在追」是历史页的第二个 tab
  'me.history.guess.follow': ['me.history.tab.switch$last'],
  // 短剧竖屏播放器的选集面板里才有分段/选集/周边;解锁 CTA 要先选到付费集
  'shortdrama.player.segment.switch': ['shortdrama.player.episodes.open'],
  'shortdrama.player.peripheral.open': ['shortdrama.player.episodes.open'],
  'shortdrama.player.unlock.wontfix': ['shortdrama.player.episodes.open', 'shortdrama.player.episode.select$last'],
  'shortdrama.player.comment.post': ['shortdrama.player.comments.open'],
  // 屏蔽词输入框要先点「屏蔽词」行展开(同 actionId 挂在行上)
  'player.sheets.danmaku.blockword.add': ['player.sheets.danmaku.blockword.add'],
  // 系统通知的卡片要先进这条会话
  'msg.system.card.wontfix': ['msg.session.system.open'],
  // 下载音画设置藏在「下载音画设置」抽屉里
  'download.select.avCustom.wontfix': ['download.select.avsheet.open'],
  // 编辑态里的勾选/删除/退出
  'download.mine.edit.select': ['download.mine.edit.enter'],
  'download.mine.edit.delete': ['download.mine.edit.enter', 'download.mine.edit.select'],
  'download.mine.edit.exit': ['download.mine.edit.enter'],
  'download.running.edit.delete': ['download.running.edit.enter'],
  // 一键登录只在退出登录后的「我的」页出现,而退出按钮在设置页 —— 跨页,靠 OVERRIDE_PATH 走
};

/** 需要先打字才有内容可提交的 action(空输入点了本来就该没反应)。 */
const TYPE_BEFORE = {
  'detail.comments.post.submit': '写得真好',
  'shortdrama.player.comment.post': '这段好看',
  'player.fullscreen.danmaku.send': '这段封神',
  'player.sheets.danmaku.blockword.add': '剧透',
};

/** 挂在输入框上的 action:得先点中它再敲字才看得到变化(联想列表随输入刷新)。 */
const TYPE_AFTER = { 'search.suggest.refresh': '动人' };

/** 点之前要等的毫秒数:进页就在 loading 的页面,不等它扫完,点刷新前后一模一样。 */
const WAIT_BEFORE = { 'cast.search.refresh': 3000 };
/**
 * 付款成功弹窗 / 挽留弹窗都得先把它们打开。收银台一进来就弹的红包不用列在这里 ——
 * dismissBlockers 每跳一步都会把它请走。
 * 勾协议是「有购买意图」的开关:没勾时返回键就是普通返回,勾了才弹挽留;付款也要求先勾。
 */
const EXTRA_PREREQ = {
  // 未勾协议时 pay 只 toast「请先勾选」,走查会当成「点了有变化」但业务未开通 —— 先勾再付
  'vip.cashier.pay': ['vip.cashier.agreement.toggle'],
  'vip.cashier.paysuccess.close': ['vip.cashier.agreement.toggle', 'vip.cashier.pay'],
  'vip.cashier.retain.open': ['vip.cashier.agreement.toggle'],
  'vip.cashier.retain.stay': ['vip.cashier.agreement.toggle', 'vip.cashier.retain.open'],
  'vip.cashier.compare.swipe': ['vip.cashier.compare.open'],
};
const prereqOf = (id) => EXTRA_PREREQ[id] ?? PREREQ[id] ?? [];

/**
 * 有些页面必须先把数据「攒」出来才存在:种子里下载列表是空的(真机账号也是 0B),
 * 「下载中」入口只有真下过一集才出现。这类节点手写一条含 action 的到达路径(@ 前缀 = action)。
 */
const OVERRIDE_PATH = [
  {
    // 开屏是 deepLink 入口,从首页图上不可达;任务表默认丢弃,手工注入路径
    match: /^splash\.ad\.wontfix$/,
    steps: ['<goto:/splash>'],
  },
  {
    // 一键登录:先去设置退出登录,再回「我的」
    match: /^auth\.login\.mock$/,
    steps: ['tab.me', 'settings.home.open.fromMe', '@auth.logout.mock', '<back'],
  },
  {
    // 推送开关在「设置 → 通知设置 → 推送通知设置」第三层,名字对不上,靠 token 排序猜不到
    match: /^settings\.push\./,
    steps: ['tab.me', 'settings.home.open.fromMe', 'settings.sub.open.notify', '@settings.notify.push.open'],
  },
  {
    // 33 集的剧一屏就摊完了,选集面板滚不动;挑《吞星纪元》(180 集)才滚得起来
    match: /^detail\.episodePanel\.list\.scroll$/,
    steps: ['detail.series.open.fromFeed~tunxingjiyuan', 'detail.episodePanel.open.fromDetail'],
  },
  {
    // 季/子tab/期卡只有《冲鸭吧10》这种多季综艺才有,它在观看历史里
    match: /^detail\.series\.(season|subTab|episodeCard)\./,
    steps: ['tab.me', 'me.history.open.fromMe', 'detail.series.open.fromHistory~chongyaba'],
  },
  {
    // 体育详情挂在 NBA 频道的赛程/专题上(~ 后面是要匹配的 data-trigger-params 片段)
    match: /^detail\.sports\./,
    steps: ['home.channel.full.switch.fromFeed~NBA', 'detail.sports.open.fromChannel'],
  },
  {
    // 剧场版详情只在搜索结果里露头,且只有《沪上花开·剧场版》走这条 transition,得搜它
    match: /^detail\.special\./,
    steps: [
      'search.hub.open.fromHome',
      'search.suggest.open.fromInput#沪上花开',
      'search.result.open.fromSuggest',
      'detail.special.open.fromResult',
    ],
  },
  {
    // 空结果页:输入框一敲就跳联想页,联想页里只有键盘搜索键(Enter)能提交
    match: /^search\.empty\./,
    steps: ['search.hub.open.fromHome', 'search.suggest.open.fromInput#这个片名根本不存在', '<enter'],
  },
  {
    // 短剧竖屏播放页:从短剧频道首页进最稳(榜单页要先切到短剧榜)
    match: /^shortdrama\.player\./,
    steps: ['tab.shortdrama', 'shortdrama.player.open.fromHome'],
  },
  {
    // 画质抽屉:画质/音质/滤镜三段都在同一个抽屉里
    match: /^player\.sheets\.(quality|audioQuality|filter|qualityCustom)\./,
    steps: [
      'detail.series.open.fromFeed',
      'player.portrait.open.fromSeries',
      'player.fullscreen.open.fromPortrait',
      'player.sheets.open.quality',
    ],
  },
  {
    // 选集面板的季/子tab 同理只有多季综艺才有
    match: /^player\.sheets\.(season|subtab)\./,
    steps: [
      'tab.me',
      'me.history.open.fromMe',
      'detail.series.open.fromHistory~chongyaba',
      'player.portrait.open.fromSeries',
      'player.fullscreen.open.fromPortrait',
      'player.sheets.open.episodes',
    ],
  },
  {
    // 选集面板里的分段/选集
    match: /^player\.sheets\.(segment|episode)\./,
    steps: [
      'detail.series.open.fromFeed',
      'player.portrait.open.fromSeries',
      'player.fullscreen.open.fromPortrait',
      'player.sheets.open.episodes',
    ],
  },
  {
    // 音频模式的退出键和两枚 chip 长在竖屏播放器上:先在「更多」里进音频播放
    match: /^player\.sheets\.(audioMode\.exit|audioExtra\.wontfix)$/,
    steps: [
      'detail.series.open.fromFeed',
      'player.portrait.open.fromSeries',
      'player.sheets.open.more.fromPortrait',
      '@player.sheets.audioMode.enter',
    ],
  },
  {
    match: /^download\.(running|series|mine\.edit|mine\.tab|mine\.feedback|mine\.rec)\./,
    steps: [
      'detail.series.open.fromFeed',
      'download.select.open.fromDetail',
      '@download.select.all.add',
      'download.mine.open.fromSelect',
    ],
    // 种子里已有 done 任务,编辑/单剧卡进页即有;「正在下载」仍走下载全部攒进行中任务
    then: {
      'download.running.': 'download.running.open.fromMine',
      'download.series.': 'download.series.open.fromMine',
    },
  },
];

function overridePathFor(actionId) {
  const hit = OVERRIDE_PATH.find((o) => o.match.test(actionId));
  if (!hit) return null;
  // then 里可以用 | 串多步(例:先干等下载跑完,再进单剧页)
  const tail = Object.entries(hit.then ?? {}).find(([p]) => actionId.startsWith(p))?.[1];
  return [...hit.steps, ...(tail ? tail.split('|') : [])];
}

/** 冷启动:清 localStorage,保证每条任务从同一颗种子出发。 */
async function fresh(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.__SIM__?.resetState?.();
    localStorage.clear();
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__OS__?.openApp), { timeout: 15000 });
  await page.evaluate((id) => window.__OS__.openApp(id), APP_ID);
  // 等 app 首屏真的渲染出来再动手,否则并发下会误判成「缺元素」。
  await page.waitForSelector('[data-trigger],[data-action]', { timeout: 15000 });
  await wait(400);
}

/**
 * 一次点击后的可观测快照:app store + 可见文案 + 当前页面上挂了哪些 action。
 * 三者任一变化,就说明这次点击不是死区。
 */
async function snapshot(page) {
  return page.evaluate((appId) => {
    const store = window.__SIM__?.getState?.().apps?.[appId];
    const root = document.querySelector('[data-adjust-resize]') || document.body;
    const actions = Array.from(document.querySelectorAll('[data-action]'))
      .map((el) => el.getAttribute('data-action'))
      .sort()
      .join(',');
    const scrolls = Array.from(document.querySelectorAll('[data-scroll-container]'))
      .map((el) => `${el.getAttribute('data-scroll-container')}:${Math.round(el.scrollTop)}/${Math.round(el.scrollLeft)}`)
      .join(',');
    return {
      store: JSON.stringify(store ?? null),
      text: (root.innerText || '').replace(/\s+/g, '').slice(0, 4000),
      actions,
      scrolls,
    };
  }, APP_ID);
}

const diffKind = (a, b) => {
  const parts = [];
  if (a.store !== b.store) parts.push('store');
  if (a.actions !== b.actions) parts.push('route/ui');
  else if (a.text !== b.text) parts.push('text');
  if (a.scrolls !== b.scrolls) parts.push('scroll');
  return parts;
};

const scrollMainTo = (page, top) =>
  page.evaluate((y) => {
    const el = document.querySelector('[data-scroll-container="main"]') ?? document.scrollingElement;
    if (el) el.scrollTop = y;
  }, top);

/** 元素可能在首屏之外:把页面里所有滚动容器都往下推一遍再放弃(有的页主容器不叫 main)。 */
async function findScrolling(page, selector) {
  const bringIntoView = async (handle) => {
    if (!handle) return null;
    await handle.evaluate((el) => {
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      // 抽屉/半屏 sheet 自己滚,祖先 overflow 容器也推一把
      let p = el.parentElement;
      while (p) {
        const style = window.getComputedStyle(p);
        const oy = style.overflowY;
        if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 4) {
          const er = el.getBoundingClientRect();
          const pr = p.getBoundingClientRect();
          if (er.top < pr.top || er.bottom > pr.bottom) {
            p.scrollTop += er.top - pr.top - pr.height / 2 + er.height / 2;
          }
        }
        p = p.parentElement;
      }
    });
    await wait(60);
    return handle;
  };
  let handle = await page.$(selector);
  if (handle) return bringIntoView(handle);
  for (let y = 400; y <= 6000; y += 400) {
    await page.evaluate((top) => {
      for (const el of document.querySelectorAll('[data-scroll-container]')) el.scrollTop = top;
      if (document.scrollingElement) document.scrollingElement.scrollTop = top;
    }, y);
    await wait(90);
    handle = await page.$(selector);
    if (handle) return bringIntoView(handle);
  }
  await scrollMainTo(page, 0);
  return null;
}

/**
 * 找不到元素时的两种自救,对应真机里两类「它本来就藏着」:
 * 1) 播放器控件条会自动隐藏 —— 点一下画面把它唤回来;
 * 2) 入口藏在页内浮层里(如 xxx.open.fromTypemenu 要先展开类型菜单)——
 *    从当前页已挂的 action 里找名字对得上的开关先点开。
 */
async function recover(page, selector) {
  const id = selector.match(/"([^"]+)"/)?.[1] ?? '';
  const openers = await page.$$eval('[data-action]', (nodes) =>
    nodes.map((n) => n.getAttribute('data-action')),
  );
  // 只用后半截词做匹配:前两段是页面名(shortdrama.player…),拿它去比会命中同页任何按钮
  const parts = id.split('.').map((w) => w.replace(/^from/, '').toLowerCase());
  const tokens = (parts.length > 3 ? parts.slice(2) : parts).filter((w) => w.length > 3);
  const pick =
    openers.find((o) => /controls\.toggle$/.test(o)) && /player\./.test(id)
      ? openers.find((o) => /controls\.toggle$/.test(o))
      : openers.find(
          (o) => tokens.some((t) => o.toLowerCase().includes(t)) && /\.(toggle|open|expand|switch|select)$/.test(o),
        );
  if (!pick) return null;
  // 点两次:控件条这类开关本来是开着的话,第一下等于关掉,第二下才是我们要的「露出来」
  for (let i = 0; i < 2; i += 1) {
    const opener = await page.$(`[data-action="${pick}"]`);
    if (!opener) return null;
    await opener.click();
    await wait(260);
    const found = await findScrolling(page, selector);
    if (found) return found;
  }
  return null;
}

/**
 * 首见引导气泡、开屏红包这类全屏浮层会把点击全吃掉(点下去看着"点到了",其实点的是蒙层)。
 * 每跳一步都先把它们请走 —— 除了当前正要验的那个 action 本身。
 */
const BLOCKERS = [/guide\.dismiss$/, /guide\.close$/, /redpacket\.close$/, /popup\.close$/, /bubble\.dismiss$/];
async function dismissBlockers(page, keep) {
  const ids = await page.$$eval('[data-action]', (nodes) => nodes.map((n) => n.getAttribute('data-action')));
  for (const id of new Set(ids)) {
    // 要验的 action 就长在这个浮层里(红包上的「领取」和「关闭」是一对)—— 关了它就没得点了
    const sameOverlay = keep?.startsWith(`${id.split('.').slice(0, -1).join('.')}.`);
    if (id === keep || sameOverlay || !BLOCKERS.some((r) => r.test(id))) continue;
    const el = await page.$(`[data-action="${id}"]`);
    if (!el) continue;
    await el.click();
    await wait(200);
  }
}

/**
 * 内容池里只有一部分片子备齐了讨论/评论/演员表 —— 进详情时优先挑这部,
 * 否则一路点第 0 张卡会落到数据最少的片子上,把「页面没做」和「这部片没数据」混为一谈。
 */
const PREFERRED_CONTENT = 'zheyikexindong';

/** 靠打字发生的跳转:值就是要敲进搜索框的词(搜不到的词会落到空结果页)。 */
const TYPED = {
  'search.suggest.open.fromInput': '心动',
  'search.suggest.open.fromResult': '心动',
  'search.result.open.fromHub': '沪上花开',
  'search.empty.open.fromHub': '这个片名根本不存在',
};

/** 点一个选择器;元素不可见(0 宽高 / display:none)也算失败,避免「接了但用户点不到」。 */
async function clickVisible(page, selector, nth = 0) {
  const found = (await findScrolling(page, selector)) ?? (await recover(page, selector));
  if (!found) throw new Error(`缺元素 ${selector}`);
  const nodes = await page.$$(selector);
  let handle = nodes[nth];
  if (nth === 0) {
    const preferred = await page.$(`${selector}[data-trigger-params*="${PREFERRED_CONTENT}"]`);
    if (preferred) handle = preferred;
  }
  if (!handle) throw new Error(`同名入口不够 ${selector}[${nth}]`);
  const box = await handle.boundingBox();
  if (!box || box.width < 2 || box.height < 2) throw new Error(`元素不可见 ${selector}`);
  await pressBy(page, handle, box);
  await wait(220);
}

/**
 * 页面上「用户真能敲字」的输入框。模拟器外壳(通知栏、其它 app 的残留 DOM)也有 input,
 * 直接取 document 里第一个/最后一个会敲到壳子上,所以只留有实际尺寸的。
 */
async function visibleInputs(page) {
  const out = [];
  for (const h of await page.$$('input, textarea')) {
    const visible = await h.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (
        box.width <= 2 ||
        box.height <= 2 ||
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number(style.opacity) === 0
      ) {
        return false;
      }
      // range/checkbox 等不是「敲字」输入框
      if (el instanceof HTMLInputElement) {
        const t = (el.type || 'text').toLowerCase();
        if (['checkbox', 'radio', 'range', 'color', 'file', 'button', 'submit', 'hidden'].includes(t)) {
          return false;
        }
      }
      return true;
    });
    if (visible) out.push(h);
  }
  return out;
}

/**
 * 往受控输入框写入文本。横屏 rotate + 模拟器软键盘下 page.keyboard.type 对中文经常落不了地,
 * 优先走 __SIM_INPUT__.type(setNativeValue + input 事件)。
 */
async function typeInto(page, input, text) {
  await input.evaluate((el) => {
    el.focus();
    el.click?.();
  });
  await wait(80);
  const landed = await page.evaluate(async (t) => {
    const el = document.activeElement;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false;
    if (window.__SIM_INPUT__?.type) {
      await window.__SIM_INPUT__.type(t, { clear: true });
      return String(el.value ?? '').includes(t);
    }
    const proto = Object.getPrototypeOf(el);
    const desc =
      Object.getOwnPropertyDescriptor(proto, 'value') ||
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value') ||
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    desc?.set?.call(el, t);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return String(el.value ?? '').includes(t);
  }, text);
  return landed;
}

/**
 * 挑一个「点下去确实点在它身上」的坐标。横滑榜卡这类元素高达 800px,几何中心落在软键盘上,
 * 照着中心点一下点的是键盘的 g 键;这里从中心往上找,直到 elementFromPoint 命中它自己或它的子节点。
 */
function hittablePoint(handle) {
  return handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const xs = [r.x + r.width / 2, r.x + r.width * 0.25, r.x + r.width * 0.75];
    const ys = [r.y + r.height / 2, r.y + r.height * 0.3, r.y + r.height * 0.12, r.y + 6];
    for (const y of ys) {
      for (const x of xs) {
        if (x < 2 || y < 2 || x > window.innerWidth - 2 || y > window.innerHeight - 2) continue;
        const top = document.elementFromPoint(x, y);
        if (top && (top === el || el.contains(top))) return { x, y };
      }
    }
    return null;
  });
}

/** 按元素声明的手势去操作:长按要真按住,不然长按菜单永远出不来。 */
async function pressBy(page, handle, box) {
  // 平台把手势写成 longPress / doubleTap 驼峰,统一压成小写再比
  const kind = await handle.evaluate((el) =>
    (el.getAttribute('data-action-type') || el.getAttribute('data-trigger-type') || 'tap').toLowerCase(),
  );
  const spot = await hittablePoint(handle);
  if (kind !== 'longpress' && kind !== 'doubletap') {
    if (spot) await page.mouse.click(spot.x, spot.y);
    else await handle.click();
    return;
  }
  const x = spot?.x ?? box.x + box.width / 2;
  const y = spot?.y ?? box.y + box.height / 2;
  if (kind === 'doubletap') {
    await page.mouse.click(x, y, { clickCount: 2, delay: 40 });
    return;
  }
  await page.mouse.move(x, y);
  await page.mouse.down();
  await wait(700);
  await page.mouse.up();
}

/** 从导航图现算最短路,任务文件里只留了最短的那条,常常不是能进对变体的那条。 */
function buildGraph() {
  const g = JSON.parse(readFileSync(GRAPH_FILE, 'utf8'));
  const out = new Map();
  for (const e of g.edges) {
    if (!out.has(e.source)) out.set(e.source, []);
    out.get(e.source).push(e);
  }
  // BFS:每个节点到达它的最短 transition-id 序列
  const pathTo = new Map([['/', []]]);
  const queue = ['/'];
  while (queue.length) {
    const cur = queue.shift();
    for (const e of out.get(cur) ?? []) {
      if (pathTo.has(e.target)) continue;
      pathTo.set(e.target, [...pathTo.get(cur), e.id]);
      queue.push(e.target);
    }
  }
  return { edges: g.edges, pathTo };
}

/**
 * 一个节点常有多种变体(同一个 /player/sheets,?sheet=share 和 ?sheet=speed 上挂的 action 完全不同),
 * 而 action_tasks 只保留了最短路。这里枚举「所有能进这个节点的入口」,
 * 按入口 id 与 action id 的词重合度排序(player.sheets.open.quality 对 player.sheets.quality.select 重合最多),
 * 重合多的先试。
 */
/**
 * 有些节点有「短但残」的到达方式:/player/fullscreen 从短视频流两步就到,但那是短视频形态,
 * 没有倍速/画质/选集这些长视频控件。这里给出「完整形态」的到达路线,优先走它。
 */
const PREFERRED_PATH_TO = {
  // banner 那部是综艺,讨论/评论/选集都少;走 feed 卡片进「这一刻心动」才是数据最全的详情页
  '/detail/series?contentId=:contentId': ['detail.series.open.fromFeed'],
  // 搜索结果页:「搜索 xxx」那一行要先打字才出现,直接点热搜词更稳
  '/search/result': ['search.hub.open.fromHome', 'search.result.open.fromHotword'],
  '/player/portrait': ['detail.series.open.fromFeed', 'player.portrait.open.fromSeries'],
  '/player/fullscreen': [
    'detail.series.open.fromFeed',
    'player.portrait.open.fromSeries',
    'player.fullscreen.open.fromPortrait',
  ],
};

function rankTrajectories(graph, task, actionId) {
  const override = overridePathFor(actionId);
  if (override) return [{ steps: override, score: 999 }];
  const words = actionId.split('.');
  const nodeId = task.target?.nodeId;
  // 前缀匹配而非全等:open.episodes 要能对上 episode.select,open.quality 对上 quality.select
  const near = (a, b) => a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a)));
  const score = (id) => id.split('.').filter((w) => words.some((v) => near(v, w))).length;
  const cands = graph.edges
    .filter((e) => e.target === nodeId && graph.pathTo.has(e.source))
    .flatMap((e) => {
      const out = [{ steps: [...graph.pathTo.get(e.source), e.id], score: score(e.id) }];
      const preferred = PREFERRED_PATH_TO[e.source];
      if (preferred) out.unshift({ steps: [...preferred, e.id], score: score(e.id) + 1 });
      return out;
    })
    .concat((task.trajectories ?? []).map((t) => ({ steps: t.transitions ?? [], score: -1 })));
  // action 本身就挂在「有完整形态要求」的节点上时,直接把那条路摆第一位
  if (PREFERRED_PATH_TO[nodeId]) cands.unshift({ steps: PREFERRED_PATH_TO[nodeId], score: 1000 });
  if (graph.pathTo.get(nodeId)?.length === 0) cands.push({ steps: [], score: 99 }); // 首页自己
  const seen = new Set();
  return cands
    .filter((c) => {
      const key = c.steps.join('>');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score || a.steps.length - b.steps.length)
    .slice(0, 4);
}

/**
 * @param lastIdx 最后一跳点第几个同名入口。同一个入口 id 往往是一排卡/一排频道 chip
 *   (home.channel.full.switch.fromFeed 有十几个),不同 param 落到的页面变体不一样,
 *   点第 0 个进的是「电视剧」,而「年龄档」只有「少儿」频道才有。
 */
async function attempt(page, actionId, steps, errors, lastIdx = 0) {
  {
    await fresh(page);
    for (const [i, t] of steps.entries()) {
      const isLast = i === steps.length - 1;
      await dismissBlockers(page, actionId);
      // 打字触发的跳转(输入即联想、搜不到进空结果):没有可点的元素,得真敲键盘。
      // 步骤可以写 id#要敲的词 覆盖默认词。
      const [stepId, typedOverride] = t.split('#');
      const typeText = typedOverride ?? TYPED[stepId];
      if (typeText !== undefined) {
        const [input] = await visibleInputs(page);
        if (input) {
          await typeInto(page, input, typeText);
          await wait(400);
        }
        const el = await page.$(`[data-trigger="${stepId}"]`);
        if (el) {
          await el.click();
          await wait(260);
        }
        continue;
      }
      if (t === '<back') {
        await page.evaluate(() => window.__OS__.handleBack());
        await wait(260);
        continue;
      }
      // deepLink / 开屏:冷启动直接带 initialRoute(已开着再 push 有时竞态落到首页)
      if (t.startsWith('<goto:')) {
        // '<goto:/splash>' → '/splash'(必须去掉尾部 '>',否则路由对不上)
        const path = t.slice(6).replace(/>$/, '');
        await page.goto(URL, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
          window.__SIM__?.resetState?.();
          localStorage.clear();
        });
        await page.goto(URL, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(window.__OS__?.openApp), { timeout: 15000 });
        await page.evaluate(
          ({ appId, p }) => {
            window.__OS__.openApp(appId, p);
          },
          { appId: APP_ID, p: path },
        );
        // 开屏 5s 会自动跳首页,必须在倒计时内等到 action 挂上
        await page.waitForSelector(`[data-action="${actionId}"]`, { timeout: 4000 }).catch(() => {});
        await wait(200);
        continue;
      }
      // <wait:12000 = 干等一会儿:下载进度靠每秒 tick 推进,不等它跑完就没有「已下载」分组
      if (t.startsWith('<wait:')) {
        await wait(Number(t.slice(6)));
        continue;
      }
      // 键盘搜索键提交:页面上没有对应元素,只有输入框的 Enter
      if (t === '<enter') {
        const [input] = await visibleInputs(page);
        if (input) {
          await input.click();
          await page.keyboard.press('Enter');
          await wait(300);
        }
        continue;
      }
      // id~片段:同名入口里挑 data-trigger-params 含该片段的那个(例:体育频道 chip)
      const [id, paramHint] = t.split('~');
      const base = id.startsWith('@') ? `[data-action="${id.slice(1)}"]` : `[data-trigger="${id}"]`;
      const selector = paramHint ? `${base}[data-trigger-params*="${paramHint}"]` : base;
      await clickVisible(page, selector, isLast ? lastIdx : 0);
    }
    await dismissBlockers(page, actionId);
    // 同一页里被浮层/菜单挡住的 action,先点开它的入口(入口本身也是 action,自己会被单独跑一遍)。
    for (const raw of prereqOf(actionId)) {
      // 语法:id / id$last(点最后一个同名元素)/ id$2(点第 3 个)/ id~片段(按 params 挑)
      const [head, pick] = raw.split('$');
      const [openerId, paramHint] = head.split('~');
      const base = `[data-action="${openerId}"]`;
      const selector = paramHint ? `${base}[data-action-params*="${paramHint}"]` : base;
      const count = (await page.$$(selector)).length;
      const nth = pick === 'last' ? count - 1 : pick ? Number(pick) : 0;
      // 尽力而为:前置条件可能早就满足了(浮层已被 dismissBlockers 关掉、tab 本来就选中),
      // 缺了它不算错;真缺的话下面验 action 时自然会红,报错也更贴题。
      await clickVisible(page, selector, Math.max(nth, 0)).catch(() => {});
    }
    // 回顶类 action 在页面本来就在顶部时点了等于没点,先滚下去再验。
    if (/totop|回顶/.test(actionId)) await scrollMainTo(page, 900);
    // 发评论这类得先有内容
    if (TYPE_BEFORE[actionId]) {
      // 取最后一个输入框:评论输入框通常在浮层里,DOM 上排在页面自带搜索框之后
      const inputs = await visibleInputs(page);
      const input = inputs.pop();
      if (!input) throw new Error(`缺可见输入框 ${actionId}`);
      // CSS zoom / LandscapeStage rotate 下 keyboard.type 对中文常失效,走模拟器输入 API
      const ok = await typeInto(page, input, TYPE_BEFORE[actionId]);
      await wait(200);
      if (!ok) throw new Error(`输入未落地 ${actionId}`);
    }

    // 同一个 action 常挂在一排同类元素上(档位卡、tab…),第一个往往就是当前选中项,点了当然没变化。
    // 从后往前挨个试,任一元素点出变化就算通过。
    const selector = `[data-action="${actionId}"]`;
    if (!(await findScrolling(page, selector)) && !(await recover(page, selector))) {
      throw new Error(`缺元素 ${selector}`);
    }
    const total = (await page.$$(selector)).length;
    const order = [...new Set([total - 1, Math.floor(total / 2), 0])].filter((i) => i >= 0);
    if (WAIT_BEFORE[actionId]) await wait(WAIT_BEFORE[actionId]);
    let before = await snapshot(page);
    let changed = [];
    for (const idx of order) {
      const nodes = await page.$$(selector);
      const el = nodes[idx];
      if (!el) continue;
      const box = await el.boundingBox();
      if (!box || box.width < 2 || box.height < 2) continue;
      await pressBy(page, el, box);
      if (TYPE_AFTER[actionId]) await page.keyboard.type(TYPE_AFTER[actionId]);
      // 滚动/轮播是 smooth 动画,220ms 时 scrollLeft 还没落位,会被误判成死区
      await wait(/\.(swipe|scroll)$/.test(actionId) ? 800 : 220);
      const mid = await snapshot(page);
      changed = diffKind(before, mid);
      if (actionId === 'shortdrama.player.comment.post') {
        const posted = await page.evaluate((text) => {
          const app = window.__SIM__?.getState?.().apps?.tencentvideo;
          return Object.values(app?.comments ?? {}).some((thread) =>
            thread?.items?.some((item) => item.content === text),
          );
        }, TYPE_BEFORE[actionId]);
        // 播放器计时器也会持续写 store，不能把它误判成“评论发布成功”。
        changed = posted ? ['store'] : [];
      }
      if (actionId === 'player.fullscreen.danmaku.send') {
        const posted = await page.evaluate((text) => {
          const app = window.__SIM__?.getState?.().apps?.tencentvideo;
          return (app?.playback?.sentDanmaku ?? []).some((d) => d.text === text);
        }, TYPE_BEFORE[actionId]);
        changed = posted ? ['store'] : [];
      }
      if (actionId === 'player.sheets.danmaku.blockword.add') {
        const added = await page.evaluate((text) => {
          const app = window.__SIM__?.getState?.().apps?.tencentvideo;
          return (app?.danmakuBlockWords ?? []).includes(text);
        }, TYPE_BEFORE[actionId]);
        changed = added ? ['store'] : [];
      }
      if (changed.length) break;
      before = mid;
    }
    if (!changed.length) {
      // 滚动/轮播/自动进度这类,内容不够长时本来就没得动 —— 归软失败,不算死区
      const soft = /\.(scroll|swipe|autoprogress)$/.test(actionId);
      return {
        actionId,
        ok: false,
        soft,
        reason: soft
          ? '接线在,但当前内容不足以产生可见滚动/轮播变化'
          : `点了没有任何可观测变化(死区,试了 ${order.length} 个同名元素)`,
        path: steps,
        errors,
      };
    }
    if (errors.length) {
      return { actionId, ok: false, reason: `运行时报错:${errors[0]}`, path: steps, errors };
    }
    return { actionId, ok: true, changed: changed.join('+'), path: steps };
  }
}

async function runTask(page, graph, task) {
  const actionId = task.taskId.replace(/^tencentvideo:/, '');
  const errors = [];
  const onError = (e) => errors.push(String(e).slice(0, 160));
  page.on('pageerror', onError);
  let best = null;
  try {
    for (const cand of rankTrajectories(graph, task, actionId)) {
      // lastIdx:换最后一跳的入口实例(第几张卡 / 第几个频道 chip),进节点的另一个变体
      for (let lastIdx = 0; lastIdx < (cand.steps.length ? 10 : 1); lastIdx += 1) {
        errors.length = 0;
        let r;
        try {
          r = await attempt(page, actionId, cand.steps, errors, lastIdx);
        } catch (e) {
          r = { actionId, ok: false, reason: String(e.message || e).slice(0, 160), path: cand.steps, errors: [...errors] };
        }
        if (r.ok) {
          rmSync(resolve(OUT_DIR, 'walkthrough_fail', `${actionId}.png`), { force: true });
          return r;
        }
        // 失败时报最优轨迹的原因,末位轨迹的报错通常没参考价值。
        best ??= r;
        // 换实例只对「元素不在这个变体上」有意义;入口本身就没有、或点了没反应,再换也一样。
        if (!new RegExp(`缺元素 \\[data-action="${actionId}"\\]`).test(r.reason)) break;
      }
      if (!/缺元素|不可见/.test(best.reason)) break;
    }
    // 红条留一张「点完之后的样子」,不然只看 reason 猜不出是没到页面还是点了没反应
    if (best && !best.ok) {
      const dir = resolve(OUT_DIR, 'walkthrough_fail');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, `${actionId}.png`) }).catch(() => {});
    }
    return best ?? { actionId, ok: false, reason: '无可用轨迹', path: [], errors };
  } finally {
    page.off('pageerror', onError);
  }
}

/** 图生成器丢弃的 deepLink-only action,手工补进任务表(配合 OVERRIDE_PATH)。 */
const EXTRA_TASKS = [
  {
    app: 'tencentvideo',
    taskId: 'tencentvideo:splash.ad.wontfix',
    start: { nodeId: 'tencentvideo.home.feed.base' },
    target: { nodeId: 'tencentvideo.splash.screen.base', routePath: '/splash' },
    trajectoryCount: 1,
    shortestLength: 1,
    trajectories: [{ nodes: ['goto'], transitions: [], length: 1 }],
    action: { id: 'splash.ad.wontfix', label: '广告画面/翻转跳转', behavior: 'submit' },
  },
];

async function main() {
  let tasks = JSON.parse(readFileSync(TASKS_FILE, 'utf8'));
  // 合并手工任务(按 action id 去重)
  {
    const have = new Set(tasks.map((t) => (t.action?.id || t.taskId || '').replace(/^tencentvideo:/, '')));
    for (const extra of EXTRA_TASKS) {
      const id = extra.action?.id || extra.taskId.replace(/^tencentvideo:/, '');
      if (!have.has(id)) tasks.push(extra);
    }
  }
  const prev = (() => {
    try {
      return JSON.parse(readFileSync(resolve(OUT_DIR, 'runtime_walkthrough.json'), 'utf8')).results;
    } catch {
      return [];
    }
  })();
  if (keywords.length) tasks = tasks.filter((t) => keywords.some((k) => t.taskId.includes(k)));
  // --failed:只重跑上一轮报告里红的那些,改完一处不用等全量 45 分钟
  if (args.includes('--failed')) {
    const red = new Set(prev.filter((r) => !r.ok).map((r) => r.actionId));
    tasks = tasks.filter((t) => red.has(t.taskId.replace(/^tencentvideo:/, '')));
  }
  if (limit) tasks = tasks.slice(0, limit);
  // 只跑子集时把上一轮其余条目原样带过来,免得报告被一次小范围重跑截断成 6 条
  const running = new Set(tasks.map((t) => t.taskId.replace(/^tencentvideo:/, '')));
  const carried = prev.filter((r) => !running.has(r.actionId));
  // dev server 挂了的话 351 条会全红,先探一下,省得白跑
  const probe = await fetch(URL).catch(() => null);
  if (!probe?.ok) {
    console.error(`起不来:${URL} 没响应,请先 npm run dev`);
    process.exit(2);
  }
  console.log(`共 ${tasks.length} 条 action 任务,并发 ${CONCURRENCY}`);
  const graph = buildGraph();

  const browser = await puppeteer.launch({
    headless: 'new',
    // 沙箱里 PUPPETEER_CACHE_DIR 被改到临时目录、下载的 Chrome 找不着,退回系统 Chrome。
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const queue = [...tasks];
  const results = [];

  const worker = async () => {
    // 每个 worker 一个独立上下文:同源页面共享 localStorage,不隔离的话并发跑会互相清对方的种子态。
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
    while (queue.length) {
      const task = queue.shift();
      const r = await runTask(page, graph, task);
      results.push(r);
      const n = results.length;
      if (!r.ok || n % 25 === 0) {
        console.log(`${r.ok ? 'PASS' : 'FAIL'} [${n}/${tasks.length}] ${r.actionId}${r.ok ? ` (${r.changed})` : ` - ${r.reason}`}`);
      }
    }
    await page.close();
    await ctx.close();
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();

  results.push(...carried);
  results.sort((a, b) => a.actionId.localeCompare(b.actionId));
  const failed = results.filter((r) => !r.ok);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    resolve(OUT_DIR, 'runtime_walkthrough.json'),
    `${JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2)}\n`,
    'utf8',
  );

  const soft = failed.filter((r) => r.soft);
  console.log(
    `\n通过 ${results.length - failed.length}/${results.length},失败 ${failed.length}(其中 ${soft.length} 条是内容不足导致的软失败)`,
  );
  const byPrefix = new Map();
  for (const f of failed) {
    const p = f.actionId.split('.').slice(0, 2).join('.');
    byPrefix.set(p, (byPrefix.get(p) || 0) + 1);
  }
  for (const [p, n] of [...byPrefix].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${p}.*`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
