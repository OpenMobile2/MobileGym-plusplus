// apps/Tencentvideo/types.ts —— 应用级类型:状态形状的单一事实源。
// 种子部分与 data/defaults.json 一一对应;运行时部分(playback/cast/cashier/ui 等)
// 覆盖 spec v1.1.0 全部 220 个已申报 actionId 所需状态。
// 图片字段存图片引用 id(poster_*/still_*/avatar_*/actor_*/goods_*/banner_*,
// 可带 .png/.svg 后缀;components/Img.tsx 的 imgSrc 解析)。

/* ============ 基础字面量 ============ */

/** 会员态:全局单一来源 = user.membership(收银台 mock 支付成功后 vip→svip) */
export type TvMembership = 'vip' | 'svip';
/** 清晰度/音质档位的会员门槛 */
export type TvTier = 'free' | 'vip' | 'svip';
/** 弹幕三态(spec/defaults 用 selected 表示「精选」) */
export type TvDanmakuMode = 'full' | 'selected' | 'off';
/** 下载任务状态 */
export type TvDownloadStatus = 'queued' | 'downloading' | 'paused' | 'done';
/** 投屏状态 */
export type TvCastStatus = 'idle' | 'searching' | 'connected';

/* ============ 用户 ============ */

export interface TvUser {
  id: string;
  nickname: string;
  avatar: string;
  membership: TvMembership;
  vipLevel: number;
  vipLevelLabel: string;
  vipExpire: string;
  points: number;
  vPower: number;
  diamonds: number;
  coins: number;
  following: number;
  followers: number;
  interactions: number;
  achievements: { films: number; days: number; medalCount: number };
  profileTabs: string[];
  deviceLoginTip: string;
}

/* ============ 内容库 ============ */

export interface TvCastMember {
  name: string;
  role: string;
}

/** 单季内容的真实可用集数；不同子栏目不再通过季差公式推算。 */
export interface TvSeasonEpisodeConfig {
  /** 本季正片总集数。 */
  total: number;
  /** 本季正片当前已上线集数；完结季可省略。 */
  updatedTo?: number;
  /** 纯享/直播回放/特辑等栏目各自真实可用条数。 */
  subTabs?: Record<string, number>;
}

/** 内容条目(剧集/电影/综艺/动漫/少儿/短剧/短视频统一形状) */
export interface TvContent {
  id: string;
  title: string;
  category: string;
  tags: string[];
  year?: number;
  region?: string;
  /** 总集数(电影为 1 或缺省) */
  episodes?: number;
  /** 已更新至第 N 集 */
  updatedTo?: number;
  rating?: number;
  heat?: number;
  /** 角标文案:VIP/独播/上新/4K|60帧/结局点映 等 */
  badge?: string;
  /** 从第 N 集起为 VIP 集(缺省 = 全免费) */
  vipFrom?: number;
  followText?: string;
  discussText?: string;
  danmakuText?: string;
  /** 榜单角标(「热播榜第2」→ 详情/信息流 chip,点击进榜单页) */
  rankNote?: string;
  /** 更新节奏文案(「追剧日历·每周三四五20点更新2集」) */
  updateNote?: string;
  /** 综艺季列表(证据 845 第9~14季横滑) */
  seasons?: number[];
  /** 按季保存真实总集数、更新进度和各子栏目条数。 */
  seasonEpisodes?: Record<string, TvSeasonEpisodeConfig>;
  /** 综艺子 tab(正片/纯享/直播回放/特辑) */
  subTabs?: string[];
  /** 信息流一句话推荐语 */
  recommend?: string;
  poster?: string;
  still?: string;
  director?: string;
  cast?: TvCastMember[];
  desc?: string;
  [k: string]: unknown;
}

export interface TvSeriesGroup {
  title: string;
  ids: string[];
}

/* ============ 频道配置(heterogeneous,按需可选字段) ============ */

export interface TvChannelBanner {
  img?: string;
  title?: string;
  subtitle?: string;
  contentId?: string;
  rating?: number;
  tag?: string;
}

export interface TvChannelFloor {
  title: string;
  ids: string[];
}

export interface TvResumeBar {
  contentId: string;
  text: string;
}

export interface TvScheduleItem {
  home: string;
  away: string;
  league?: string;
  status: string;
  score?: string;
  time?: string;
  [k: string]: unknown;
}

export interface TvPodcastItem {
  title: string;
  eps: string;
  followText: string;
  cover: string;
}

export interface TvShortVideoItem {
  id: string;
  title: string;
  author: string;
  avatar: string;
  likesText: string;
  comments: number;
  cover: string;
  linkedFilm?: string;
  topic?: string;
}

export interface TvFeedCard {
  contentId: string;
  note?: string;
  btn?: string;
}

/** 单频道配置(home/tv/movie/…/haopian/shortdrama 共用一个宽松形状) */
export interface TvChannelConfig {
  searchPlaceholder?: string;
  theme?: string;
  banner?: TvChannelBanner;
  grid?: string[];
  feed?: TvFeedCard[];
  kingKong?: string[];
  chips?: string[];
  floors?: TvChannelFloor[];
  subBoards?: TvChannelFloor[];
  resumeBar?: TvResumeBar;
  filters?: string[];
  swapBtn?: string;
  schedule?: TvScheduleItem[];
  topic?: string;
  entries?: string[];
  items?: TvPodcastItem[] | TvShortVideoItem[];
  promo?: { title: string; btn: string; img: string };
  topActions?: string[];
  subTabs?: string[];
  itemIds?: string[];
  buttons?: string[];
  filterTabs?: string[];
  actorRow?: string[];
  toggles?: { highScoreFirst: boolean; freeOnly: boolean };
  genreSecondRow?: string[];
  results?: Record<string, string[]>;
  modes?: string[];
  switchToast?: string;
  guideBubble?: string;
  filter?: { sorts: string[]; dims: Record<string, string[]> };
  [k: string]: unknown;
}

/* ============ 榜单 / 搜索 ============ */

export interface TvRankEntry {
  id: string;
  heat?: number;
  note?: string;
}

export interface TvRankings {
  tv: { hot: TvRankEntry[]; search: string[]; rising: string[]; expect: string[]; nshua: string[] };
  anime: { tabOrder: string[]; hot: TvRankEntry[]; search: string[] };
  shortdrama: { tabOrder: string[]; verticalHot: TvRankEntry[]; verticalSearch: string[] };
  kids: { hot: string[] };
}

export interface TvHotSearchItem {
  rank: number;
  keyword: string;
  tag?: string;
}

export interface TvSearchSuggest {
  text: string;
  type: string;
}

export interface TvSearchHub {
  placeholder: string;
  history: string[];
  midTabs: string[];
  boards: Record<string, string[]>;
  suggests: Record<string, TvSearchSuggest[]>;
  resultTabs: string[];
  noResult: { text: string; sub: string };
}

export interface TvPickFilm {
  title: string;
  buttons: string[];
  queue: string[];
}

export interface TvYearHotActivity {
  theme: string;
  title: string;
  banner: string;
  groups: { year: string | number; ids: string[] }[];
}

/* ============ 弹幕 / 评论 / 讨论 ============ */

export interface TvDanmakuSeed {
  t: string;
}

export interface TvCommentReply {
  id: string;
  author: string;
  avatar: string;
  badges: string[];
  region: string;
  date: string;
  likes: number;
  content: string;
}

export interface TvComment extends TvCommentReply {
  replies: TvCommentReply[];
  moreReplies?: number;
}

export interface TvCommentThread {
  total: number;
  items: TvComment[];
}

/** 讨论帖五档表情计数键:awesome/angry/heartbroken/melon/worship */
export type TvReactionKey = 'awesome' | 'angry' | 'heartbroken' | 'melon' | 'worship';

export interface TvDiscussion {
  id: string;
  contentId: string;
  author: string;
  avatar: string;
  badge: string;
  region: string;
  date: string;
  title: string;
  content: string;
  reactions: Record<TvReactionKey, number>;
  comments: number;
  shares: number;
}

/* ============ 会员 / 收银台配置 ============ */

export interface TvVipPlan {
  id: string;
  label: string;
  price: number;
  origPrice: number;
  /** 副标题:首月 / 16.7元每月 / 已减60元(证据 b06fd5 逐档抄录) */
  note: string;
  /** 左上角标:送10天SVIP权益体验 / 限时 / 新用户专享 */
  tag: string;
  /** 开通说明行(随档位变):开通得XXV力值,XX积分;之后XX元/月续费… */
  desc: string;
  /** 限时倒计时(空串=不展示) */
  countdown: string;
}

/** 顺手带一件的附加项(随选中档位切换) */
export interface TvAddOnItem {
  id: string;
  name: string;
  price: number;
  origPrice: number;
}

export interface TvJointCard {
  id: string;
  name: string;
  price: number;
  origPrice: string;
  btn: string;
}

export type TvCashierTabId = 'vip' | 'svip';

export interface TvMembershipConfig {
  status: TvMembership;
  levelLabel: string;
  expire: string;
  upsell: string;
  redPacket: {
    amount: number;
    countdown: string;
    note: string;
    title: string;
    claim: string;
    usableNote: string;
    claimedNote: string;
  };
  cashierTabs: { id: TvCashierTabId; label: string; sub: string }[];
  vipPlans: TvVipPlan[];
  svipPlans: TvVipPlan[];
  payAgreement: string;
  agreement: { prefix: string; links: string[]; uncheckedToast: string };
  paySuccess: { title: string; note: string; btn: string };
  retainDialog: { title: string; note: string; confirm: string; stay: string };
  addOn: { title: string; byPlan: Record<string, TvAddOnItem[]> };
  benefitsCompare: { item: string; vip: string; svip: string }[];
  compareMore: string;
  compareMoreCards: string[];
  levelUpCard: {
    title: string;
    current: { level: string; label: string; items: number; value: number; tagline: string };
    next: { level: string; label: string; items: number; value: number; tagline: string };
    gapNote: string;
    btn: string;
  };
  helpCenter: {
    title: string;
    service: string;
    giftCards: { title: string; note: string }[];
    grid: string[];
  };
  moreTab: { title: string; cards: { id: string; name: string; note: string; price: number; btn: string }[] };
  wall: { title: string; items: string[]; btn: string; note: string };
  accountBar: { pointsLabel: string; assetLabel: string; msgBadge: number };
  familyCard: { name: string; note: string; deviceNote: string };
  jointCards: TvJointCard[];
  jointCardsByTab: { vip: TvJointCard[]; svip: TvJointCard[] };
  jointMore: string;
  vPower: {
    value: number;
    current: string;
    next: string;
    nextNeed: number;
    levels: { level: string; threshold: number; perk: string }[];
    [k: string]: unknown;
  };
  pointsMall: Record<string, unknown>;
  freeVip: Record<string, unknown>;
}

export interface TvGoodsItem {
  id: string;
  name: string;
  price: number;
  tag: string;
  img: string;
  sales: string | number;
}

/* ============ 明星页 ============ */

export interface TvActor {
  id: string;
  name: string;
  avatar: string;
  fans: number;
  followed: boolean;
  followToast: string;
  intro: string;
  tabs: string[];
  workCounts: Record<string, number>;
  workIds: string[];
}

/* ============ 观看历史 / 追·藏·约 ============ */

export interface TvHistoryEntry {
  id: string;
  contentId?: string;
  /** 聚合卡类型(看过的短视频) */
  type?: string;
  title?: string;
  count?: number;
  cover?: string;
  episode?: string;
  season?: number;
  subTab?: string;
  progressPct?: number;
  device?: string;
  date?: string;
  group: string;
  rating?: number;
}

export interface TvFavorite {
  contentId: string;
  badge: string;
  progressText: string;
}

export interface TvChasing {
  contentId: string;
  updateBadge: string;
  progressText: string;
}

export interface TvReservation {
  contentId: string;
  note: string;
  status: 'waiting' | 'online';
}

/* ============ 消息 ============ */

export interface TvMsgEntry {
  id: string;
  label: string;
  unread: number;
  messages?: TvConversationMsg[];
}

export interface TvConversationMsg {
  id: string;
  title: string;
  text: string;
  time: string;
  action?: string;
  contentId?: string;
}

export interface TvConversation {
  id: string;
  name: string;
  avatar: string;
  lastText: string;
  time: string;
  unread: number;
  messages: TvConversationMsg[];
}

export interface TvMessages {
  entries: TvMsgEntry[];
  conversations: TvConversation[];
  emptyText: string;
}

/* ============ 金币 ============ */

export interface TvSignDay {
  day: number;
  coins: number;
  signed: boolean;
}

export interface TvCoins {
  balance: number;
  cashText: string;
  withdrawChannels: string[];
  signDays: TvSignDay[];
  adTask: { label: string; progress: string; per: number };
  videoRedPackets: { label: string; count: number; per: number };
  browseTask: { label: string; per: number };
  gameTask: { label: string; per: number };
  drawerTasks: string[];
  /** 运行时:签到提醒开关(coin.signin.remind.toggle) */
  remindOn?: boolean;
}

export interface TvDrawer {
  moreServices: string[];
  welfareCenter: string;
  freeData: string;
}

export interface TvVipCard {
  id: string;
  label: string;
  note: string;
  highlight: boolean;
}

export interface TvDevices {
  list: { name: string; city: string; status: string; date: string }[];
  accountStatus: string;
  quota: { vip: string; svip: string };
  svipBanner: string;
}

/* ============ 设置 ============ */

export interface TvSettings {
  appearance: {
    colorMode: string;
    colorModeOptions: string[];
    navSkin: boolean;
    iconSkin: boolean;
  };
  privacy: Record<string, boolean>;
  notifications: {
    pushMaster: boolean;
    interestTags: string[];
    reactionSound: boolean;
    calendarRemind: boolean;
  };
  download: {
    forbidAutoLock: boolean;
    quality: string;
    concurrent: number;
    mobileNetworkDownload: boolean;
    mobileNetworkAutoDownload: boolean;
    carrierUpload: boolean;
  };
  play: Record<string, boolean>;
  storage: { cacheSize: string; videoDownload: string; novelDownload: string; remaining: string };
  teenMode: boolean;
  childGuard: boolean;
}

/** settings 下允许通用 set/toggle 的分组名 */
export type TvSettingsGroup = 'appearance' | 'privacy' | 'notifications' | 'download' | 'play';

/* ============ 下载 ============ */

export interface TvDownloadTask {
  /** `${contentId}#${episode}` */
  id: string;
  contentId: string;
  /** 第几集(电影=1) */
  episode: number;
  /** 展示名(如「第3集」/影片名) */
  label: string;
  qualityLabel: string;
  sizeText: string;
  progressPct: number;
  status: TvDownloadStatus;
}

export interface TvDownloads {
  remaining: string;
  speedText: string;
  accelText: string;
  offlineToast: string;
  vipToast: string;
  items: TvDownloadTask[];
  novelItems: unknown[];
  recommendations: string[];
}

/* ============ 播放器配置(种子) ============ */

export interface TvQualityOption {
  id: string;
  label: string;
  tier: TvTier;
  desc?: string;
  default?: boolean;
}

export interface TvAudioQualityOption {
  id: string;
  label: string;
  tier: TvTier;
  desc?: string;
  default?: boolean;
}

export interface TvDanmakuSettings {
  mode: TvDanmakuMode;
  modes: string[];
  rows: string;
  opacity: number;
  speed: string;
  fontSize: string;
  colorDanmaku: boolean;
  skinDanmaku: boolean;
  roleDanmaku: boolean;
  topDanmaku: boolean;
  effectDanmaku: boolean;
  keywordEgg: boolean;
  smartAntiSpoiler: boolean;
  faceProtect: boolean;
  blockWordsCount: number;
  blockWordsMax: number;
  placeholder: string;
  /** 工具箱标题右侧的「恢复默认设置」(证据 849) */
  resetLabel: string;
  displayTitle: string;
  modeTitle: string;
  modeLabels: Record<TvDanmakuMode, string>;
  /** 弹幕展示区 4 根竖滑杆(行数/不透明度/速度/字号,证据 849);当前值 = options 中的下标 */
  sliders: TvDanmakuSlider[];
  /** 开关组三段:弹幕类型 / 特殊弹幕 / 通用工具(证据 850-851) */
  switchGroups: TvDanmakuSwitchGroup[];
  blockWordTitle: string;
  blockWordPlaceholder: string;
  blockWordAdd: string;
  /** 证据 851 的两行「仅展示」入口(spec note:此刻弹幕列表不建交互) */
  nowListRow: { label: string; value: string };
  interactRow: { label: string; value: string };
}

export interface TvDanmakuSlider {
  key: 'rows' | 'opacity' | 'speed' | 'fontSize';
  label: string;
  options: string[];
}

export interface TvDanmakuSwitchGroup {
  title: string;
  items: {
    key:
      | 'colorDanmaku'
      | 'skinDanmaku'
      | 'roleDanmaku'
      | 'topDanmaku'
      | 'effectDanmaku'
      | 'keywordEgg'
      | 'smartAntiSpoiler'
      | 'faceProtect';
    label: string;
    sub?: string;
    icon?: string;
  }[];
}

/** 播放器滤镜款式(证据 ba6ce3@22:原片/质感(SVIP)) */
export interface TvFilterOption {
  id: string;
  label: string;
  tier: 'free' | 'vip' | 'svip';
}

export interface TvPlayerConfig {
  qualities: TvQualityOption[];
  audioQualities: TvAudioQualityOption[];
  speeds: number[];
  longPressSpeed: number;
  longPressLockSpeed: boolean;
  leftLongPressRewind: boolean;
  vipWatermarkTip: string;
  lockToast: string;
  danmakuModeToast: string;
  danmaku: TvDanmakuSettings;
  filters: TvFilterOption[];
  /** 更多面板「定时关闭」枚举 */
  timerOptions: string[];
  /** 画质面板顶部提示条(证据 854) */
  qualityTip: { text: string; button: string };
  moreMenu: string[];
  shareChannels: string[];
  screenshotActions: string[];
  castPage: {
    modes: string[];
    airplayDevice: string;
    phoneSpeaker: string;
    remoteCast: string;
    tvApp: string;
    controls: string[];
  };
}

/* ============ 运行时:播放 / 投屏 / 搜索 / 收银台 ============ */

/** 用户发送的弹幕(白框高亮胶囊上屏) */
export interface TvSentDanmaku {
  text: string;
  atSec: number;
}

export interface TvPlayback {
  /** 当前播放内容;null = 未在播 */
  contentId: string | null;
  /** 1-based 集序号 */
  episodeIndex: number;
  /** 综艺播放上下文；普通剧集为 null。 */
  season: number | null;
  subTab: string | null;
  playing: boolean;
  positionSec: number;
  durationSec: number;
  speed: number;
  qualityId: string;
  audioQualityId: string;
  /** 播放器滤镜(player.sheets.filter.select);null = 默认 */
  filterId: string | null;
  controlsVisible: boolean;
  locked: boolean;
  audioMode: boolean;
  pipOn: boolean;
  /** 定时关闭档位文案;null = 不开启 */
  sleepTimer: string | null;
  /** 截图气泡(player.fullscreen.screenshot.take) */
  screenshotBubble: boolean;
  sentDanmaku: TvSentDanmaku[];
}

export interface TvCast {
  status: TvCastStatus;
  device: string | null;
  localBoost: boolean;
}

export interface TvSearchRuntime {
  /** 输入框实时值 */
  input: string;
  /** 已提交检索词;null = 未提交 */
  submitted: string | null;
}

export interface TvCashierRuntime {
  tab: TvCashierTabId;
  planId: string;
  /** 已勾选的「顺手带一件」附加项 id(仅视觉勾选,不并入金额) */
  addonIds: string[];
  agreementChecked: boolean;
  redPacketClaimed: boolean;
  /** 红包弹层是否已关掉(进页即弹,claim/× 都关) */
  redPacketDismissed: boolean;
  /** mock 支付成功弹层标志 */
  paySuccess: boolean;
  /** 已跳转到外部支付、等待结果回流的订单；null 表示没有待处理订单 */
  pendingOrder: { orderId: string; planId: string; amount: number } | null;
  /** 挽留弹窗(已勾协议未支付时点返回触发) */
  retainOpen: boolean;
  /** 权益对比全屏页 uiState */
  compareOpen: boolean;
  /** 对比全屏页横滑到第几张表头卡 */
  compareIndex: number;
}

/* ============ 详情页配置 ============ */

export interface TvDetailOpBanner {
  title: string;
  sub: string;
  button: string;
}

export interface TvDetailConfig {
  /** 剧集/电影形态 tab 行(证据 824) */
  tabs: string[];
  /** 综艺形态只有 详情/讨论(证据 845) */
  varietyTabs: string[];
  /** 选集区分组 chips */
  episodeGroups: string[];
  /** 推荐楼层子栏目 tab */
  recommendTabs: string[];
  /** 选集区标题里的日历入口文案(证据 824「选集 追剧日历 · 更新至15集 · 全33集 ›」) */
  calendarLabel: string;
  /** 当前播放集/期的标记文案(证据 845 期卡中央胶囊) */
  playingLabel: string;
  opBanner: TvDetailOpBanner;
  opBannerVariety: TvDetailOpBanner;
  adCard: { img: string; badge: string; title: string; button: string };
  /** 功能搬家引导气泡:深灰圆角浮层 + 向上箭头指向「下载」(证据 826) */
  guide: { text: string; text2: string; button: string };
  /** VIP 集金框提示文案(证据 825) */
  vipFrameNote: string;
  /** 贴片广告浮层文案(证据 824) */
  adOverlay: { badge: string; paused: string; button: string };
  commentEntry: string;
  commentsMore: string;
}

/* ============ 顶层 State ============ */

export interface TencentvideoState {
  /* ---- 种子(data/defaults.json 注入,DATA_VERSION 机制) ---- */
  user: TvUser;
  contents: TvContent[];
  series: Record<string, TvSeriesGroup>;
  channelTabs: string[];
  /** 「∨」展开面板里的长尾频道(证据 832;点击一律 toast 暂未开放) */
  channelPanelExtra: string[];
  channels: Record<string, TvChannelConfig>;
  rankings: TvRankings;
  hotSearch: TvHotSearchItem[];
  searchHub: TvSearchHub;
  pickFilm: TvPickFilm;
  yearHotActivity: TvYearHotActivity;
  danmakuPool: TvDanmakuSeed[];
  comments: Record<string, TvCommentThread>;
  discussions: TvDiscussion[];
  membership: TvMembershipConfig;
  goodsShop: { items: TvGoodsItem[] };
  actor: TvActor;
  watchHistory: TvHistoryEntry[];
  historyFilters: string[];
  guessYouFollow: string[];
  favorites: TvFavorite[];
  favoriteTabs: string[];
  chasing: TvChasing[];
  chasingFilters: string[];
  reservations: TvReservation[];
  chaseToast: string;
  messages: TvMessages;
  coins: TvCoins;
  drawer: TvDrawer;
  profileGrid: string[];
  profileTools: string[];
  profileServices: string[];
  vipCards: TvVipCard[];
  devices: TvDevices;
  settings: TvSettings;
  downloads: TvDownloads;
  player: TvPlayerConfig;
  unlockPage: { title: string; btn: string };
  /** 详情页共用文案/楼层配置(证据 824 剧集形态、845 综艺形态、826 引导弹窗) */
  detail: TvDetailConfig;
  wontfixToast: string;

  /* ---- 运行时 ---- */
  /** 全局 toast(chrome.toast);null = 不显示 */
  lastToast: string | null;
  /** 未实现能力的阻断式说明弹窗；null = 不显示。 */
  featureNotice: string | null;
  /** 登录态(auth.logout.mock → false;auth.login.mock → true) */
  loggedIn: boolean;
  playback: TvPlayback;
  cast: TvCast;
  search: TvSearchRuntime;
  cashier: TvCashierRuntime;
  /** 点赞内容 id 集合(短视频/短剧/二创 like.toggle) */
  likedContentIds: string[];
  /** 点赞评论 id 集合(detail.comments.like.toggle) */
  likedCommentIds: string[];
  /** 已一键点赞的讨论帖 id(detail.discuss.like.tap) */
  likedDiscussionIds: string[];
  /** 讨论帖表情回应:discussionId → 表情键 */
  discussReactions: Record<string, TvReactionKey>;
  /** 已关注创作者/作者名集合(follow.author) */
  followedAuthors: string[];
  /** 已推荐内容 id(detail.recommend.toggle) */
  recommendedIds: string[];
  /** 以片找片:想看 id 集合(findfilm.want.mark) */
  wantIds: string[];
  /** 以片找片:当前卡指针 + 预告播放态 */
  findfilm: { index: number; previewOn: boolean };
  /** 首页信息流已移除卡(home.feed.card.dismiss) */
  dismissedFeedIds: string[];
  /** 「换一换」种子:sectionKey → 已换次数(页面据此轮转切片) */
  shuffleSeeds: Record<string, number>;
  /** 弹幕屏蔽词(player.sheets.danmaku.blockword.add) */
  danmakuBlockWords: string[];
  /** 下载:已预约更新自动下载的集 key(`${contentId}#${ep}`) */
  downloadReserved: string[];
  /** 下载:全部暂停标志(download.running.pauseAll.toggle) */
  downloadPausedAll: boolean;
  /** 下载:VIP 集入队提示只 toast 一次 */
  downloadVipToastShown: boolean;
  /** 短剧续播条:最后短剧播放位;null = 无 */
  resume: { contentId: string; episodeIndex: number } | null;
  /** 推送兴趣标签选中集合(settings.push.tag.toggle) */
  selectedPushTags: string[];
  /**
   * 通用页面级离散 UI 态(chip/tab/sort/编辑态等 spec 定为 action 而非 URL 的开关)。
   * 约定 key = actionId 去掉动词尾段,如 ui['rank.page.category']='电视剧'、
   * ui['me.favorites.edit']=true。仅存原始值,selector 直接取 ui[key](硬规则6)。
   */
  ui: Record<string, string | number | boolean>;
}

/* ============ Actions ============ */

export type TvSet = (
  partial:
    | Partial<TencentvideoState & TencentvideoActions>
    | ((s: TencentvideoState & TencentvideoActions) => Partial<TencentvideoState & TencentvideoActions>),
) => void;
export type TvGet = () => TencentvideoState & TencentvideoActions;

export interface TencentvideoActions {
  /* ---- 通用 ---- */
  toast: (msg: string | null) => void;
  dismissFeatureNotice: () => void;
  /** 通用离散 UI 态写入(chip/tab/sort/filter/编辑态) */
  setUi: (key: string, value: string | number | boolean) => void;
  /** 通用布尔 UI 态翻转 */
  toggleUi: (key: string) => void;

  /* ---- 账号(auth.*.mock) ---- */
  loginMock: () => void;
  logoutMock: () => void;
  switchAccountMock: () => void;

  /* ---- 内容互动(follow/reserve/like/dismiss/shuffle) ---- */
  chaseToggle: (contentId: string) => void;
  reserveToggle: (contentId: string) => void;
  likeToggle: (contentId: string) => void;
  followAuthorToggle: (author: string) => void;
  starFollowToggle: () => void;
  recommendToggle: (contentId: string) => void;
  dismissFeedCard: (contentId: string) => void;
  shuffleRefresh: (sectionKey: string) => void;
  /* 以片找片 */
  findfilmNext: () => void;
  findfilmWantMark: () => void;
  findfilmPreviewToggle: () => void;
  /* 列表编辑删除 */
  removeHistoryEntries: (ids: string[]) => void;
  removeFavorites: (contentIds: string[]) => void;
  removeChasing: (contentIds: string[]) => void;

  /* ---- 搜索 ---- */
  setSearchInput: (value: string) => void;
  submitSearch: (keyword: string) => void;
  clearSearchInput: () => void;
  clearSearchHistory: () => void;

  /* ---- 播放器 ---- */
  openPlayback: (
    contentId: string,
    episodeIndex?: number,
    durationSec?: number,
    season?: number,
    subTab?: string,
  ) => void;
  playToggle: () => void;
  tickPlayback: (deltaSec: number) => void;
  seekPlayback: (positionSec: number) => void;
  selectEpisode: (episodeIndex: number) => void;
  nextEpisode: () => void;
  setSpeed: (speed: number, withToast?: boolean) => void;
  setLongPressSpeed: (speed: number) => void;
  toggleLongPressLockSpeed: () => void;
  toggleLeftLongPressRewind: () => void;
  selectQuality: (qualityId: string) => void;
  selectAudioQuality: (audioQualityId: string) => void;
  selectPlayerFilter: (filterId: string | null) => void;
  danmakuModeCycle: () => void;
  setDanmakuMode: (mode: TvDanmakuMode) => void;
  setDanmakuSetting: (key: keyof TvDanmakuSettings, value: string | number | boolean) => void;
  addDanmakuBlockword: (word: string) => void;
  removeDanmakuBlockword: (word: string) => void;
  sendDanmaku: (text: string) => void;
  controlsToggle: () => void;
  lockToggle: () => void;
  audioModeEnter: () => void;
  audioModeExit: () => void;
  pipOpen: () => void;
  pipClose: () => void;
  setSleepTimer: (label: string | null) => void;
  screenshotTake: () => void;
  screenshotDismiss: () => void;

  /* ---- 投屏 ---- */
  castSearchStart: () => void;
  castConnect: (device: string) => void;
  castDisconnect: () => void;
  castDeviceSwitch: (device: string) => void;
  castLocalBoostToggle: () => void;
  castSeekStep: (deltaSec: number) => void;

  /* ---- 下载 ---- */
  setDownloadQuality: (label: string) => void;
  setDownloadConcurrency: (n: number) => void;
  addDownload: (contentId: string, episode: number, label?: string) => void;
  addAllDownloads: (contentId: string, episodes: number[]) => void;
  reserveDownloadEpisode: (contentId: string, episode: number) => void;
  toggleDownloadTask: (taskId: string) => void;
  toggleDownloadPauseAll: () => void;
  deleteDownloads: (taskIds: string[]) => void;
  tickDownloads: () => void;
  dislikeDownloadRec: (contentId: string) => void;

  /* ---- 评论 / 讨论 ---- */
  commentLikeToggle: (commentId: string) => void;
  postComment: (threadKey: string, text: string) => void;
  discussLikeTap: (discussionId: string) => void;
  discussEmojiReact: (discussionId: string, emoji: TvReactionKey) => void;

  /* ---- 金币 / 签到 ---- */
  coinSigninDaily: () => void;
  coinSigninRemindToggle: () => void;

  /* ---- 消息 ---- */
  openMsgEntry: (entryId: string) => void;
  openMsgConversation: (convId: string) => void;

  /* ---- 收银台 ---- */
  cashierSetTab: (tab: TvCashierTabId) => void;
  cashierSelectPlan: (planId: string) => void;
  cashierAddonToggle: (addonId: string) => void;
  cashierAgreementToggle: () => void;
  cashierRedpacketClaim: () => void;
  cashierRedpacketClose: () => void;
  cashierPayMock: () => void;
  cashierPaymentBegin: (orderId: string, planId: string, amount: number) => void;
  cashierPaymentCancel: () => void;
  cashierPaySuccessClose: () => void;
  cashierRetainOpen: () => void;
  cashierRetainStay: () => void;
  cashierCompareToggle: (open: boolean) => void;
  cashierCompareSwipe: () => void;

  /* ---- 设置 ---- */
  setSetting: (group: TvSettingsGroup, key: string, value: string | number | boolean) => void;
  toggleSetting: (group: TvSettingsGroup, key: string) => void;
  togglePushTag: (tag: string) => void;
  storageClean: () => void;
}
