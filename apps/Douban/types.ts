// apps/Douban/types.ts —— FOUNDATION 完整数据模型(spec v0.1.0 92节点)。
// 页面簇 agent 原则上不改本文件;新增字段先查这里是否已有。

export type SubjectType = 'movie' | 'tv' | 'book' | 'music' | 'podcast';
export type MarkStatus = 'wish' | 'doing' | 'done';
/** DetailFive(5子tab详情模板)覆盖的四类内容 */
export type DetailTargetType = 'broadcast' | 'groupPost' | 'discussion' | 'review' | 'comment' | 'subject';

// ---------------------------------------------------------------- 用户/影人

export interface DoubanUser {
  id: string;
  name: string;
  avatar: string;
  ipLocation: string;
  isSelf?: boolean;
  signature?: string;
  followers: number;
  following: number;
  /** 徽章数(徽章墙入口计数) */
  badges: number;
  /** 三档隐私:公开 / 相册不可见 / 全主页不可见 */
  privacy: 'public' | 'albumHidden' | 'allHidden';
  /** 书影音档案计数(看过/读过/听过) */
  stats: { movieDone: number; bookDone: number; musicDone: number };
  /** 小豆余额(当前用户恒 0,送礼判「余额不足」qa:Q10) */
  beans?: number;
  /** 豆米余额(钱包充值写入) */
  doumi?: number;
  /** 加入豆瓣年份文案,如「2019年加入」 */
  joinedText?: string;
}

export interface DoubanCelebrity {
  id: string;
  name: string;
  avatar: string;
  /** 职业,如「导演 / 编剧」「演员」 */
  role: string;
  followers: number;
  /** 代表作 subjectIds */
  works: string[];
  desc?: string;
}

// ---------------------------------------------------------------- 条目

export interface SubjectCredit {
  name: string;
  /** 导演 / 编剧 / 饰 xxx */
  role: string;
  celebrityId?: string;
  avatar?: string;
}

export interface PodcastChapter {
  /** mm:ss 或 h:mm:ss */
  time: string;
  title: string;
}

export interface DoubanSubject {
  id: string;
  type: SubjectType;
  title: string;
  cover: string;
  /** null = 暂无评分 */
  rating: number | null;
  ratingCount: number;
  year?: string;
  /** 一行副信息(地区/类型/作者·出版社/艺人·发行) */
  info?: string;
  intro?: string;
  /** 5星→1星 百分比(和≈100),有评分时给 */
  ratingDist?: number[];
  friendRating?: { count: number; score: number | null };
  genres?: string[];
  duration?: string;
  credits?: SubjectCredit[];
  photosCount?: number;
  /** markSheet 预置标签 chips(图书有预置;音乐无;电影「为电影打标签」) */
  presetTags?: string[];
  /** 如「NO.1 热门电影」;图书用「NO.1|每月热门图书榜」竖线分隔格式 */
  hotLabel?: string;
  top250Rank?: number;
  /** 想看/在看/看过 计数(评分卡「x人看过 y人在看 z人想看」;regen 按 ratingCount 固定比例派生) */
  wishCount?: number;
  doingCount?: number;
  doneCount?: number;
  // ---- book ----
  author?: string;
  press?: string;
  toc?: string[];
  buyPrice?: number;
  /** 划线原价(恒 > buyPrice,商品价旁删除线展示) */
  origPrice?: number;
  // ---- music ----
  artist?: string;
  tracks?: string[];
  // ---- tv ----
  episodes?: number;
  onAir?: boolean;
  // ---- podcast(单集) ----
  showName?: string;
  episodeCount?: number;
  durationText?: string;
  chapters?: PodcastChapter[];
  guests?: string[];
  dateText?: string;
}

/** 标记(想看/在看/看过…) — 书影音档案时间线即按 createdAt 渲染 */
export interface DoubanMark {
  id: string;
  subjectId: string;
  status: MarkStatus;
  rating: number | null;
  tags: string[];
  comment: string;
  createdAt: number;
  syncToFeed?: boolean;
}

/** 短评 */
export interface DoubanComment {
  id: string;
  subjectId: string;
  authorId: string;
  rating: number | null;
  text: string;
  likes: number;
  createdAt: number;
  ipLocation: string;
  isHot?: boolean;
}

/** 影评/书评/乐评(长评) */
export interface DoubanReview {
  id: string;
  subjectId: string;
  authorId: string;
  title: string;
  text: string;
  rating: number;
  useful: number;
  useless: number;
  replyCount: number;
  likeCount: number;
  repostCount: number;
  collectCount: number;
  giftCount: number;
  createdAt: number;
  ipLocation: string;
}

// ---------------------------------------------------------------- 广播/回复/详情记录

export interface DoubanBroadcast {
  id: string;
  authorId: string;
  text: string;
  images: string[];
  topicId: string | null;
  /** 正文中的《条目》绿链卡 */
  subjectCard: string | null;
  likeCount: number;
  repostCount: number;
  collectCount: number;
  replyCount: number;
  giftCount: number;
  createdAt: number;
  ipLocation: string;
  /** 转发型动态 */
  isRepost?: boolean;
  origType?: DetailTargetType;
  origId?: string | null;
  views?: number;
  /** 由「标记/评分」同步生成的动态,值=被标记条目 id(用于再次标记时更新同一条,取消标记时移除) */
  fromMarkSubjectId?: string;
}

export interface DoubanReply {
  id: string;
  targetType: DetailTargetType;
  targetId: string;
  authorId: string;
  text: string;
  images: string[];
  likeCount: number;
  createdAt: number;
  ipLocation: string;
  /** 楼中楼引用 */
  quoteReplyId: string | null;
  /** [该回复已被删除] 占位 */
  deleted: boolean;
  /** 楼主本人回复(「作者」筛选/徽章) */
  isAuthor?: boolean;
  /** 「楼主赞过」徽章 */
  authorLiked?: boolean;
  isHot?: boolean;
}

export interface DoubanLikeRecord {
  id: string;
  targetType: DetailTargetType;
  targetId: string;
  userId: string;
  createdAt: number;
}

export interface DoubanRepostRecord {
  id: string;
  targetType: DetailTargetType;
  targetId: string;
  userId: string;
  comment: string;
  createdAt: number;
  /** 转发生成的独立动态 id */
  broadcastId?: string;
}

export interface DoubanCollectRecord {
  id: string;
  targetType: DetailTargetType;
  targetId: string;
  userId: string;
  doulistId: string;
  createdAt: number;
}

export interface DoubanGiftRecord {
  id: string;
  targetType: DetailTargetType | 'user';
  targetId: string;
  userId: string;
  giftId: string;
  note: string;
  createdAt: number;
}

// ---------------------------------------------------------------- 豆列/收藏

export interface DoulistItem {
  kind: 'subject' | 'broadcast' | 'groupPost' | 'review';
  refId: string;
}

export interface DoubanDoulist {
  id: string;
  ownerId: string;
  title: string;
  cover: string;
  intro: string;
  isPrivate: boolean;
  items: DoulistItem[];
  /** 「听过 0/2」类进度 */
  doneCount: number;
  createdAt: number;
  /** 榜单/片单/书单标记(我的关注-片单书单 tab 用) */
  kindLabel?: '片单' | '书单' | '榜单' | '播单' | '豆列';
}

/** 我的收藏(抽屉-收藏,筛选 全部/内容/影视/图书/音乐) */
export interface DoubanCollectionItem {
  id: string;
  kind: 'content' | 'movie' | 'book' | 'music';
  refType: DetailTargetType | 'subject';
  refId: string;
  createdAt: number;
}

// ---------------------------------------------------------------- 小组

export interface GroupQuizQuestion {
  question: string;
  options: string[];
  /** 正确选项下标 */
  answer: number;
}

export interface DoubanGroup {
  id: string;
  name: string;
  icon: string;
  members: number;
  desc: string;
  rules: string;
  joinType: 'direct' | 'quiz' | 'apply' | 'followOnly';
  joined: boolean;
  /** 申请制:none | applied(申请中) */
  applyStatus: 'none' | 'applied';
  followed: boolean;
  /** per-group 主题色(组头着色):A组橙/B组棕/C组红… */
  themeColor: string;
  /** 子板块 tabs(不含「全部」) */
  tabs: string[];
  quiz?: GroupQuizQuestion[];
  /** 答题失败次数(重答不换题 qa:Q6) */
  quizAttempts: number;
  /** 本组成员称谓(虚构原创词,如「观察员」;成员行「157754 观察员」格式) */
  memberNoun?: string;
}

export interface DoubanGroupPost {
  id: string;
  /** 移出小组后为 null */
  groupId: string | null;
  /** 所属子板块(空=全部) */
  tab: string;
  authorId: string;
  title: string;
  content: string;
  images: string[];
  replyCount: number;
  likeCount: number;
  repostCount: number;
  collectCount: number;
  giftCount: number;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  digest?: boolean;
}

/** 条目讨论 */
export interface DoubanDiscussion {
  id: string;
  subjectId: string;
  authorId: string;
  title: string;
  content: string;
  replyCount: number;
  likeCount: number;
  repostCount: number;
  collectCount: number;
  giftCount: number;
  createdAt: number;
}

// ---------------------------------------------------------------- 话题/文集/TOP10/榜单

export interface DoubanTopic {
  id: string;
  name: string;
  views: number;
  postCount: number;
  desc?: string;
}

export interface DoubanEssaySet {
  id: string;
  ownerId: string;
  title: string;
  cover: string;
  articles: { title: string; date: string }[];
}

export interface DoubanTop10 {
  id: string;
  ownerId: string;
  kind: 'movie' | 'book' | 'music' | 'all';
  title: string;
  subjectIds: string[];
}

export interface DoubanRanking {
  id: string;
  title: string;
  subtitle?: string;
  kind: 'movie' | 'tv' | 'book' | 'music';
  items: { subjectId: string; note?: string }[];
}

// ---------------------------------------------------------------- 消息/提醒

export interface DoubanMessage {
  id: string;
  peerId: string;
  fromSelf: boolean;
  text: string;
  createdAt: number;
}

export interface DoubanNotification {
  id: string;
  kind: 'follow' | 'like' | 'reply' | 'system';
  text: string;
  userId?: string;
  /** 点击跳转目标:like/reply → 内容详情;reply 另带 replyId(那一楼) */
  targetType?: DetailTargetType;
  targetId?: string;
  replyId?: string;
  createdAt: number;
  read: boolean;
}

// ---------------------------------------------------------------- 市集

export interface DoubanProduct {
  id: string;
  title: string;
  cover: string;
  images: string[];
  price: number;
  origPrice?: number;
  shop: string;
  skuOptions: { name: string; values: string[] }[];
  soldText?: string;
  tag?: string;
  freight: number;
  /** 「豆友说」引用的广播 */
  buyerBroadcastIds?: string[];
  category?: string;
}

export interface DoubanCartItem {
  id: string;
  productId: string;
  sku: string;
  count: number;
  checked: boolean;
}

export interface DoubanOrderItem {
  productId: string;
  sku: string;
  count: number;
  price: number;
}

export interface DoubanOrder {
  id: string;
  items: DoubanOrderItem[];
  amount: number;
  freight: number;
  status: 'unpaid' | 'toShip' | 'shipped' | 'done' | 'closed';
  createdAt: number;
  addressId: string | null;
  couponId: string | null;
}

export interface DoubanAddress {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

export interface DoubanCoupon {
  id: string;
  title: string;
  amount: number;
  costBeans: number;
  validDays: number;
  owned: boolean;
}

/** 支付流(qa:Q7=C):提交→verifying→failed(订单待付款)→重新支付→success(待发货) */
export interface DoubanPayFlow {
  orderId: string | null;
  stage: 'idle' | 'verifying' | 'failed' | 'success';
}

// ---------------------------------------------------------------- 豆瓣时间

export interface DoubanCourse {
  id: string;
  title: string;
  cover: string;
  price: number;
  kind: 'video' | 'audio';
  episodeCount: number;
  trialCount: number;
  author: string;
  desc: string;
  purchased: boolean;
}

export interface DoubanCheckin {
  streak: number;
  goal: number;
  total: number;
  lastCheckinAt: number | null;
}

// ---------------------------------------------------------------- 杂项

export interface DoubanDraft {
  id: string;
  title: string;
  text: string;
  groupId: string | null;
  savedAt: number;
}

export interface DoubanHistoryItem {
  id: string;
  kind: 'subject' | 'broadcast' | 'groupPost' | 'group' | 'user' | 'review';
  refId: string;
  viewedAt: number;
}

export interface DoubanSettings {
  push: { master: boolean; reply: boolean; like: boolean; follow: boolean; chat: boolean };
  privacy: {
    homepageVisible: 'all' | 'self';
    hideGroups: boolean;
    dmPolicy: 'all' | 'follow';
    syncFeed: boolean;
    adPush: boolean;
  };
  /** 水印主开关(personal)联动隐藏子项 */
  watermark: { personal: boolean; saveWithWatermark: boolean };
  minor: { enabled: boolean };
}

export interface DoubanFollows {
  users: string[];
  celebrities: string[];
  topics: string[];
  doulists: string[];
}

/** 假迷你播放器(qa:Q1/Q2:进度不真走,跨页驻留) */
export interface DoubanPlayer {
  title: string;
  sub: string;
  cover: string;
  /** 剩余时长文案,如「剩余 1小时56分」,不倒数 */
  remainingText: string;
  playing: boolean;
  /** 由启动页以字面量对象传入,GlobalFakePlayerBar 内部转发绑定 */
  actions: { toggle: { id: string }; close: { id: string } };
}

// ---------------------------------------------------------------- Config / State / Actions

/** data/defaults.json 的形状(由 assets/regen_defaults.py 生成,勿手改) */
export interface DoubanConfig {
  currentUser: DoubanUser;
  users: DoubanUser[];
  celebrities: DoubanCelebrity[];
  subjects: DoubanSubject[];
  marks: DoubanMark[];
  comments: DoubanComment[];
  reviews: DoubanReview[];
  broadcasts: DoubanBroadcast[];
  replies: DoubanReply[];
  likes: DoubanLikeRecord[];
  reposts: DoubanRepostRecord[];
  collects: DoubanCollectRecord[];
  gifts: DoubanGiftRecord[];
  doulists: DoubanDoulist[];
  collections: DoubanCollectionItem[];
  groups: DoubanGroup[];
  groupPosts: DoubanGroupPost[];
  discussions: DoubanDiscussion[];
  topics: DoubanTopic[];
  essaySets: DoubanEssaySet[];
  top10s: DoubanTop10[];
  rankings: DoubanRanking[];
  follows: DoubanFollows;
  followers: string[];
  notifications: DoubanNotification[];
  messages: DoubanMessage[];
  products: DoubanProduct[];
  cart: DoubanCartItem[];
  orders: DoubanOrder[];
  addresses: DoubanAddress[];
  coupons: DoubanCoupon[];
  courses: DoubanCourse[];
  checkin: DoubanCheckin;
  podcastSubscriptions: string[];
  drafts: DoubanDraft[];
  history: DoubanHistoryItem[];
  searchHistory: string[];
  settings: DoubanSettings;
}

/** 发布器上下文:决定编辑器形态(短评无标题 / 影评·剧评·讨论带标题)+ 预挂条目 */
export type ComposeKind = 'comment' | 'review' | 'discussion' | 'broadcast';
export interface ComposeCtx {
  kind: ComposeKind;
  subjectId: string | null;
}

/** 运行时状态 = 种子数据 + 易失 UI 字段 */
export interface DoubanState extends DoubanConfig {
  searchQuery: string;
  composeTitle: string;
  composeDraft: string;
  composeCtx: ComposeCtx;
  replyDraft: string;
  lastToast: string | null;
  payFlow: DoubanPayFlow;
  player: DoubanPlayer | null;
  ranklistFilter: string | null;
  followedRankingIds: string[];
  reviewVotes: Record<string, 'useful' | 'useless'>;
}

export interface DoubanActions {
  // 通用
  toast: (msg: string | null) => void;
  setRanklistFilter: (filter: string | null) => void;
  toggleFollowRanking: (rankingId: string) => void;
  voteReview: (reviewId: string, vote: 'useful' | 'useless') => void;
  setSearchQuery: (q: string) => void;
  addSearchHistory: (q: string) => void;
  clearSearchHistory: () => void;
  setComposeTitle: (t: string) => void;
  setComposeDraft: (text: string) => void;
  setComposeCtx: (ctx: ComposeCtx) => void;
  clearCompose: () => void;
  setReplyDraft: (text: string) => void;
  // 草稿
  saveDraft: (title: string, text: string, groupId?: string | null) => void;
  deleteDrafts: (ids: string[]) => void;
  // 标记/评分
  markSubject: (
    subjectId: string,
    status: MarkStatus,
    opts?: { rating?: number | null; tags?: string[]; comment?: string; syncToFeed?: boolean },
  ) => void;
  unmarkSubject: (subjectId: string) => void;
  // 5子tab 详情互动
  toggleLike: (targetType: DetailTargetType, targetId: string) => void;
  repostTarget: (targetType: DetailTargetType, targetId: string, comment: string) => void;
  collectTarget: (targetType: DetailTargetType, targetId: string, doulistId: string) => void;
  uncollectTarget: (targetType: DetailTargetType, targetId: string, doulistId: string) => void;
  sendGift: (targetType: DetailTargetType | 'user', targetId: string, giftId: string) => void;
  rechargeDoumi: (amount: number) => void;
  addReply: (
    targetType: DetailTargetType,
    targetId: string,
    text: string,
    opts?: { images?: string[]; quoteReplyId?: string | null; syncToFeed?: boolean },
  ) => void;
  deleteReply: (replyId: string) => void;
  // 豆列
  createDoulist: (title: string, intro: string, isPrivate: boolean) => void;
  // 关注
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  toggleFollowCelebrity: (celebrityId: string) => void;
  toggleFollowTopic: (topicId: string) => void;
  toggleFollowDoulist: (doulistId: string) => void;
  toggleFollowGroup: (groupId: string) => void;
  // 小组
  joinGroupDirect: (groupId: string) => void;
  applyGroup: (groupId: string, reason: string) => void;
  submitGroupQuiz: (groupId: string, passed: boolean) => void;
  quitGroup: (groupId: string) => void;
  deleteGroupPost: (postId: string) => void;
  detachGroupPost: (postId: string) => void;
  // 发布
  publishBroadcast: (
    text: string,
    opts?: { images?: string[]; topicId?: string | null; subjectCard?: string | null },
  ) => void;
  publishGroupPost: (
    groupId: string,
    title: string,
    content: string,
    opts?: { images?: string[]; tab?: string },
  ) => void;
  /** 条目内容发布:按 kind 落到 comments/reviews/discussions(短评/影评·剧评/讨论) */
  publishSubjectContent: (
    kind: 'comment' | 'review' | 'discussion',
    subjectId: string,
    title: string,
    text: string,
  ) => void;
  // 消息
  sendMessage: (peerId: string, text: string) => void;
  markNotificationsRead: () => void;
  // 市集
  addToCart: (productId: string, sku: string, count?: number) => void;
  beginDirectBuy: (productId: string, sku: string, count?: number) => void;
  setCartItemCount: (cartItemId: string, count: number) => void;
  removeCartItems: (ids: string[]) => void;
  toggleCartItemChecked: (id: string) => void;
  addAddress: (addr: { name: string; phone: string; region: string; detail: string }) => void;
  redeemCoupon: (couponId: string) => void;
  submitOrder: (addressId: string, couponId?: string | null) => void;
  payVerifyFail: () => void;
  repayOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  closePayFlow: () => void;
  // 豆瓣时间/播客
  checkinToday: () => void;
  togglePodcastSubscription: (showSubjectId: string) => void;
  startPlayer: (player: DoubanPlayer) => void;
  togglePlayer: () => void;
  closePlayer: () => void;
  // 历史/设置/资料
  addHistory: (kind: DoubanHistoryItem['kind'], refId: string) => void;
  clearHistory: (ids?: string[]) => void;
  updateSettings: <K extends keyof DoubanSettings>(
    section: K,
    patch: Partial<DoubanSettings[K]>,
  ) => void;
  updateProfile: (patch: Partial<Pick<DoubanUser, 'name' | 'signature' | 'avatar'>>) => void;
}
