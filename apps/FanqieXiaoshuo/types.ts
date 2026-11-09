/** 番茄免费小说 — 应用级类型(对齐 docs/fanqiexiaoshuo-replication/spec.json v1.0-frozen) */

export type BookGender = 'female' | 'male' | 'publish';
export type BookStatus = '已完结' | '连载中';

export interface FanqieBook {
  id: string;
  title: string;
  authorId: string;
  gender: BookGender;
  category: string;
  tags: string[];
  status: BookStatus;
  /** 万字数(如 286 = 286万字;出版书为 31 = 31万字) */
  words: number;
  /** 在读人数(万) */
  readersWan: number;
  rating: number;
  /** 章节总数 */
  chapters: number;
  /** 热度(万) */
  hotWan: number;
  /** 徽章:巅峰榜 / 细糠 / 出版 / '' */
  badge: string;
  intro: string;
  /** 封面资源路径(PNG 优先,SVG 回落) */
  cover: string;
}

export interface FanqieAuthor {
  id: string;
  name: string;
  badge: string;
  fansWan: number;
  works: number;
  likesWan: number;
  saved: number;
  sign: string;
  avatar: string;
}

export interface FanqieUser {
  id: string;
  name: string;
  avatar: string;
}

export interface FanqieReview {
  id: string;
  bookId: string;
  userId: string;
  stars: number;
  text: string;
  topic?: string;
  /** 绝对 Unix 毫秒 */
  timestamp: number;
  likes: number;
  /** 阅读时长文案,如「阅读5小时后点评」 */
  readNote: string;
  /** 是否当前用户发布(带「我」角标) */
  mine?: boolean;
}

export interface ShelfEntry {
  bookId: string;
  /** 已读到章节下标(0-based) */
  chapterIdx: number;
  addedAt: number;
}

export interface HistoryEntry {
  bookId: string;
  chapterIdx: number;
  /** 仅浏览过详情未进正文时为 -1(显示「书封页」) */
  viewedAt: number;
}

export interface WelfareTask {
  id: string;
  title: string;
  coins: string;
  sub: string;
  btn: string;
  /** 唯一真实实现的任务 */
  isSignin?: boolean;
  done?: boolean;
}

export interface HotSearchItem {
  word: string;
  tag: string;
  heat: string;
}

/** 阅读器主题档(索引对应设置面板 7 圆) */
export interface ReaderTheme {
  id: string;
  bg: string;
  text: string;
  /** 是否夜间档 */
  night: boolean;
}

export interface ReaderSettings {
  /** 字号档 15~32,默认 23(视觉映射见 constants) */
  fontSize: number;
  /** 主题档下标 0~6 */
  themeIdx: number;
  pageMode: 'cover' | 'scroll';
}

export interface CoinRecord {
  title: string;
  timestamp: number;
  delta: number;
}

export interface FanqieState {
  user: FanqieUser & { follows: number; fans: number; likes: number; rescued: number; readBooks: number; readMinutes: number };
  books: FanqieBook[];
  authors: FanqieAuthor[];
  users: FanqieUser[];
  paraBank: Record<string, string[]>;
  chapterTitleBank: Record<string, string[]>;
  reviews: FanqieReview[];
  shelf: ShelfEntry[];
  history: HistoryEntry[];
  searchHistory: string[];
  hotSearch: HotSearchItem[];
  guessWords: string[];
  placeholderWords: string[];
  welfareTasks: WelfareTask[];
  coins: number;
  coinRecords: CoinRecord[];
  signinDone: boolean;
  /** 今日已看读分钟数 */
  todayReadMinutes: number;
  followedAuthors: string[];
  likedReviews: string[];
  readerSettings: ReaderSettings;
  /** 每本书的阅读进度 bookId -> chapterIdx */
  progress: Record<string, number>;
  /** 已购实体书(走系统收银台 ACTION_PAY 返回 OK 后写入) */
  purchasedBooks: string[];
  taskAudit: {
    reviewsFilter?: { bookId: string; filter: string };
    rankView?: { category: string; sub: string };
    shelfFilter?: string;
    welfareView?: { coins: number; todayReadMinutes: number };
    readerView?: { bookId: string; chapterIdx: number };
    readerRating?: { bookId: string; stars: number };
    catalogOrder?: { bookId: string; order: 'asc' | 'desc' };
    tagResult?: { tag: string; sort: string };
  };
}

export interface FanqieActions {
  addSearchHistory: (word: string) => void;
  clearSearchHistory: () => void;
  addToShelf: (bookId: string) => void;
  removeFromShelf: (bookIds: string[]) => void;
  recordHistory: (bookId: string, chapterIdx: number) => void;
  saveProgress: (bookId: string, chapterIdx: number) => void;
  setFontSize: (delta: number) => void;
  setTheme: (idx: number) => void;
  /** 夜间模式开关(阅读器工具栏 / 「我的」月亮共用同一状态) */
  setNightMode: (on: boolean) => void;
  setPageMode: (mode: 'cover' | 'scroll') => void;
  submitReview: (bookId: string, stars: number, text: string, topic?: string) => void;
  toggleReviewLike: (reviewId: string) => void;
  toggleFollowAuthor: (authorId: string) => void;
  doSignin: () => void;
  creditReadingCoins: (coins: number) => void;
  addReadMinutes: (mins: number) => void;
  /** 系统收银台支付成功回调后记账 */
  markBookPurchased: (bookId: string) => void;
  /** 从系统相册选到的图设为头像 */
  setAvatar: (uri: string) => void;
  recordTaskAudit: (patch: Partial<FanqieState['taskAudit']>) => void;
}
