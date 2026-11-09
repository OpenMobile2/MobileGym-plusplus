// apps/Tencentvideo/constants.ts —— 结构常量 + 设计令牌色值(docs/tencentvideo-replication/design-tokens.md)
/** OS 宿主约束 —— 来源:os/data/simulatorConfig.ts。OS 层更新时同步。 */
export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 52,
} as const;

/**
 * DATA_VERSION —— 每次修改 data/defaults.json 必须递增。
 * state.ts 的 persistName = `tencentvideo_v${DATA_VERSION}`,版本变化清空 localStorage。
 */
export const DATA_VERSION = 16;

/**
 * 频道 tab 的去向分组(证据 832 顶部频道条 + spec home.feed 三条频道 transition)。
 * 完整频道 8 个走 home.channel.full;浏览版 5 个走 home.channel.lite;短视频独立竖流页。
 * 「首页」= 首页自身,不跳转。
 */
export const CHANNEL_FULL_TABS = ['电视剧', '电影', '综艺', '动漫', '少儿', 'NBA', '追番', '纪录片'];
export const CHANNEL_LITE_TABS = ['体育', '播客', '游戏', '好物', '爱玩'];
export const CHANNEL_SHORTVIDEO_TAB = '短视频';
export const CHANNEL_HOME_TAB = '首页';

/**
 * 首页滚动态 / 回到顶部请求的 store.ui 键(证据 827:长列表滚动后底栏首位变「返回顶部」)。
 * TabBar 与 HomeFeedPage 是兄弟组件,借 store.ui 通信。
 */
export const HOME_SCROLLED_KEY = 'home.feed.scrolled';
export const HOME_TOTOP_REQUEST_KEY = 'home.feed.totopRequest';

/**
 * 沉浸态顶色(store.ui):首页/频道页未滚动时,banner 取色要一直铺到状态栏底下(证据 832),
 * 而状态栏占位由 AppShell 渲染 —— 故页面把色值写进 ui,由 AppShell 统一上色 +
 * 同步 data-status-bar-foreground(保真 A2:顶栏前景色与页面明暗匹配)。空串 = 无沉浸态。
 */
export const CHROME_TOP_COLOR_KEY = 'chrome.topColor';

/**
 * 播放器当前朝向。播放器面板 /player/sheets 一个路由承载 7 种弹层,
 * 横屏时是右侧抽屉、竖屏时是底部半屏(spec player.sheets regions),
 * 但 sheet 类型本身分不出朝向(更多/倍速/分享两种朝向都有),所以由
 * 播放页在挂载时把朝向写进 ui,面板读它决定外壳形态。
 */
export const PLAYER_ORIENTATION_KEY = 'player.orientation';

/**
 * VIP 金框提示的存续秒数。证据 825 拍到金框(刚切到 VIP 集),证据 820/824 同一部剧
 * 同一集却是正常顶栏 —— 说明金框只在该集开头出现一小会儿,之后让位给 icon 组。
 */
export const VIP_FRAME_SECONDS = 8;

/**
 * 详情页榜单标签的榜名前缀:content.category -> 榜单口径
 * (证据 824「电视剧热播榜第2名」—— 分类叫「剧集」,榜单叫「电视剧」;
 *  短剧的 rankNote 自带「竖屏」前缀,所以映射到空串。)
 */
export const RANK_BOARD_BY_CATEGORY: Record<string, string> = {
  剧集: '电视剧',
  电影: '电影',
  综艺: '综艺',
  动漫: '动漫',
  少儿: '少儿',
  纪录片: '纪录片',
  短剧: '',
};

/** 底部 TabBar(证据:832/736/754;spec chrome.tabbar)。label 走 strings。 */
export const TABS = [
  { id: 'home', route: '/', labelKey: 'tabHome', icon: 'IcTabHome' },
  { id: 'shortdrama', route: '/shortdrama', labelKey: 'tabShortdrama', icon: 'IcTabShortdrama' },
  { id: 'vipzone', route: '/vipzone', labelKey: 'tabVipzone', icon: 'IcTabVipzone' },
  { id: 'haopian', route: '/haopian', labelKey: 'tabHaopian', icon: 'IcTabHaopian' },
  { id: 'me', route: '/me', labelKey: 'tabMe', icon: 'IcTabMe' },
] as const;

export const TAB_ROUTES: string[] = TABS.map((t) => t.route);

/**
 * TabBar 可见路由(= spec 中带 tabbar.switch 交互的 12 个节点;scaffold_l0.py 输出的 tabbar_hosts)。
 * navRules:二级页(筛选/榜单/详情/播放)无 tabbar。
 */
export const TABBAR_VISIBLE_ROUTES: string[] = [
  '/', '/home/channel-full', '/home/channel-lite', '/home/short-video',
  '/shortdrama', '/shortdrama/kids',
  '/vipzone', '/vipzone/points',
  '/haopian', '/me',
];

/** 路由 -> 高亮 tab(前缀匹配;/home/* 归首页) */
export function activeTabOf(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/home')) return 'home';
  if (pathname.startsWith('/shortdrama')) return 'shortdrama';
  if (pathname.startsWith('/vipzone')) return 'vipzone';
  if (pathname.startsWith('/haopian')) return 'haopian';
  if (pathname.startsWith('/me')) return 'me';
  return '';
}

/**
 * 设计令牌色值 —— 全部取自 docs/tencentvideo-replication/design-tokens.md(真机取色,禁止沿用其他 app)。
 */
export const TV_COLORS = {
  // 品牌青绿
  primary: '#06BFB8',        // 选中态文字/图标(已追、剧集tab、集数选中)
  primarySoft: '#4CC0BE',    // 进度条已播段
  primaryBg: '#E6F8F8',      // 选中 chip / 选中集数卡填充底

  // VIP 金色体系
  vipBadgeBg: '#FEDF8B',     // VIP/SVIP 角标底
  vipBadgeText: '#573500',   // 角标深棕文字
  goldBtnFrom: '#FDECBA',    // 金色 CTA 渐变浅端
  goldBtnTo: '#EDC34D',      // 金色 CTA 渐变深端
  goldBtnText: '#512F00',    // 金底深棕文字
  svipBarBg: '#17140D',      // 黑金运营条底
  svipBarText: '#E8E4AB',    // 黑底运营条浅金文案
  svipCapsule: '#F6DA88',    // 播放器「升级SVIP」金胶囊
  memberCardBg: '#F3DB9B',   // 个人中心会员卡米金
  memberLevel: '#703E07',    // 会员卡「V1」深棕金

  // 橙红 / 红色体系
  badgeOrange: '#FF6510',    // 独播/上新/高清修复角标
  redDot: '#F96058',         // 未读红点、热度红字
  unlockRed: '#E82C40',      // 短剧「解锁本集」CTA / 关注标

  // 全局中性色(浅色页)
  pageBg: '#FFFFFF',
  chipGray: '#F5F5F5',       // 未选 chip / 集数卡 / 圆形图标底
  text: '#000000',
  textSub: '#6E6E6E',
  textTertiary: '#77777A',   // 已追态文字
  divider: '#D2D2D4',        // 已追胶囊底、细描边
  rankChipBg: '#F7F2E9',     // 榜单 chip 底
  rankChipText: '#AC7036',   // 榜单 chip 文字
  premiereYellow: '#F8DE95', // 结局点映角标底
  premiereText: '#4B2C00',   // 结局点映角标文字

  // 半透明浮层
  toastBg: 'rgba(0,0,0,0.80)',
  maskBadge: 'rgba(0,0,0,0.55)',   // 图上信息角标(最近在看/4K|60帧)
  playerMask: 'rgba(0,0,0,0.45)',  // 播放器渐变遮罩起点
  progressRest: 'rgba(255,255,255,0.30)', // 进度条未播段

  // 深色页变体(好片 tab / 竖屏短剧流)
  darkBg: '#000000',
  darkCard: '#161616',
  darkText: '#FFFFFF',
  darkTextSub: '#9F9F9F',
  darkBadgeOrange: '#FF5801',
  darkEpisodeBar: '#2A2A2A', // 竖屏流底部「选集」栏
} as const;
