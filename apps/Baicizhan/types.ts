// 百词斩 状态模型。种子见 data/defaults.json,由 state.ts 物化。

/** 一个单词(GRE3000 种子词) */
export interface Word {
  id: string;
  word: string;
  phonetic: string;        // 美音音标
  pos: string;             // 词性 adj./n./v.
  meaning: string;         // 正确释义(短)
  options: string[];       // 四选一的另外 3 个干扰释义(不含正确项)
  sentence: string;        // 英文例句
  sentenceCn: string;      // 例句中译
  image: string;           // 配图资源路径
  examFreq?: number;       // 近5年真题出现次数
  roots?: string;          // 词根词缀拆解说明
}

export type WordStatus = 'new' | 'learning' | 'known' | 'zhan';

/** 每个词的学习状态(运行时写入) */
export interface LearnState {
  status: WordStatus;
  nextReviewDay: number;   // 距今多少天后复习(0=今天)
  collected: boolean;      // 是否加入单词本『收藏的单词』
}

/** 词书 */
export interface Book {
  id: string;
  name: string;
  cover: string;           // 封面主色
  total: number;
  added: boolean;          // 是否已加入我的计划
  tag?: string;            // 分类标签(热门/大学…)
  desc?: string;
}

/** 收藏单词本 */
export interface Wordbook {
  id: string;
  name: string;
  wordIds: string[];
}

/** 商品 */
export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  coinPrice?: number;      // 铜板购到手价
  image: string;
  sold?: number;
  specs?: string[];        // 规格分类
}

export interface CartItem {
  productId: string;
  qty: number;
  spec: string;
  checked: boolean;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

/** 阅读文章 */
export interface Article {
  id: string;
  title: string;
  titleCn: string;
  wordCount: number;
  level: string;           // 中阶+ / 高阶
  cover: string;
  body: { en: string; cn: string }[];  // 段落
  tag: string;             // 时事/商业…
}

export type PushKey = 'challenge' | 'together' | 'daily' | 'review';

export interface Settings {
  sound: boolean;
  vibrate: boolean;
  pushMaster: boolean;
  push: Record<PushKey, boolean>;
  personalizePush: boolean;
  accent: 'us' | 'uk';                 // 单词本切换英/美音
  wordSort: 'timeAsc' | 'timeDesc' | 'alphaAsc' | 'alphaDesc' | 'random';
  identity: string;                    // 身份(工作党…)
  studyMode: 'recognize' | 'memory';   // 认识模式 / 记忆模式
}

export interface Profile {
  name: string;
  bczId: string;
  avatar: string;
  listenVocab: number;
  readVocab: number;
  learnedCount: number;
}

/** 今日计划进度(组为单位) */
export interface TodayProgress {
  newDone: number;
  reviewDone: number;
  newTarget: number;    // 组数
  reviewTarget: number; // 组数
}

export interface Order {
  payMethod: 'wechat' | 'alipay';
  useCoin: boolean;
  note: string;
}

/** 已下单(付款后从购物车转入,商城『我的』展示) */
export interface PlacedOrder {
  id: string;
  items: { productId: string; qty: number; spec: string }[];
  total: number;
  status: 'pending'; // 模拟版统一『待发货』
}

export interface MembershipState {
  proPlan: 'trial' | 'monthly' | 'yearly' | null;
  readActive: boolean;
}

export interface ReadPlan {
  option: string;
  minutes: number;
  articleIds: string[];
}

export interface TempState {
  toast: string;
  toastSeq: number;
  /** 顶部奖励气泡:连对/不断电到账 */
  reward: { seq: number; text: string } | null;
  /** 记忆模式连对连击(会话内,不持久化) */
  combo: number;
  /** 本会话是否已加过不断电天数(当日首次学习 +1) */
  streakBumped: boolean;
  /** 查词当前关键词(查词页 → 结果页传递) */
  dictQuery: string;
  /** 立即购买:绕过购物车的直购项(确认订单页据此结算) */
  directBuy: { productId: string; spec: string; qty: number } | null;
}

export interface FullState {
  _dataVersion: number;
  profile: Profile;
  words: Word[];
  learn: Record<string, LearnState>;
  books: Book[];
  currentBookId: string;
  dailyGroups: number;
  today: TodayProgress;
  coins: number;
  streakDays: number;
  protectEquipped: number;      // 断电保护卡已装备(0-2)
  stars: number;                // 任务星星罐(0-3)
  claimedTasks: string[];
  wordbooks: Wordbook[];
  products: Product[];
  cart: CartItem[];
  addresses: Address[];
  order: Order;
  orders: PlacedOrder[];
  favoriteProductIds: string[];
  memberships: MembershipState;
  courseProgress: Record<string, number[]>;
  articles: Article[];
  shelf: string[];              // 我读书架(articleId)
  readChars: number;
  readArticleIds: string[];
  readPlan: ReadPlan | null;
  readCampLevel: 'basic' | 'mid' | 'high' | null;
  settings: Settings;
  studyDetailAudit: Record<string, {
    viewedTabs: string[];
    pronounced: boolean;
    continued: boolean;
  }>;
  _temp: TempState;
}
