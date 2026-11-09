/** 美柚 App 类型定义。所有 timestamp 均为绝对 Unix 毫秒(TimeService 时间系)。 */

export type MeiyouMode = 'period' | 'prep';

export interface CycleConfig {
  periodLen: number;   // 经期长度(天)
  cycleLen: number;    // 周期长度(天)
  smartPredict: boolean;
  showPregProb: boolean;
}

/** 一段经期。日期用 'YYYY-MM-DD'(本地日),end 为 null 表示进行中 */
export interface PeriodSpan {
  start: string;
  end: string | null;
}

export interface PoopRecord { feel: string; time: string; count: number }
export interface LoveRecord { count: number; measure: string; time: string }

export interface DayRecord {
  flow?: string;
  color?: string;
  pain?: string;
  mood?: string;
  poop?: PoopRecord;
  weight?: number;        // 公斤
  temperature?: number;   // ℃
  love?: LoveRecord;
  symptoms?: string[];
  leukorrhea?: string;
  startTime?: string;     // 经期开始具体时间 HH:mm
}

export interface PostAuthor {
  name: string;
  avatar: string;
  tag?: string;           // 身份标签:备孕 / 孕29周5天 / 宝宝1岁+ …
}

export interface Post {
  id: string;
  author: PostAuthor;
  circleId: string;
  text: string;
  images: string[];
  topics: string[];
  likes: number;
  commentCount: number;
  replyPreview?: string;  // 「姐妹回复」摘要条
  createdAt: number;
  region: string;
  isAd?: boolean;
  adBrand?: string;
  adCta?: string;
}

export interface Comment {
  id: string;
  author: PostAuthor;
  text: string;
  createdAt: number;
  region: string;
  likes: number;
  replies: Comment[];
  hiddenReplies?: number; // 「展开N条回复」
  isAuthor?: boolean;
}

export interface Circle {
  id: string;
  name: string;
  icon: string;
  members: string;       // 如 '4971.3万'
  discussions: string;   // 如 '14.1亿'
  headerColor: string;
}

export interface InteractNotice {
  id: string;
  kind: 'like' | 'reply' | 'fan';
  user: PostAuthor;
  text: string;
  postId?: string;
  createdAt: number;
}

export interface SysNotice { id: string; title: string; body: string; createdAt: number }

export interface AiMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  refBadges?: boolean;    // 「结合健康档案/参考资料」折叠条
  createdAt: number;
}

export interface AiSession { id: string; title: string; messages: AiMessage[] }

export interface NotifSettings { master: boolean; night: boolean; sound: boolean; vibrate: boolean }

export interface MeiyouUser {
  id: string;
  nick: string;
  avatar: string;
  ipRegion: string;
  wechatMask: string;
  stats: { follows: number; fans: number; likes: number; favs: number };
}

export interface MeiyouState {
  user: MeiyouUser;
  loggedIn: boolean;
  mode: MeiyouMode;
  prepEnabled: boolean;   // 备孕模式是否开启过(开启流程只走一次)
  cycle: CycleConfig;
  periods: PeriodSpan[];
  dayRecords: Record<string, DayRecord>;
  posts: Post[];
  comments: Record<string, Comment[]>;
  circles: Circle[];
  joinedCircles: string[];
  myPostIds: string[];
  likedPostIds: string[];
  likedCommentIds: string[];
  favPostIds: string[];
  followedAuthors: string[];
  dismissedAds: string[];
  notices: InteractNotice[];
  sysNotices: SysNotice[];
  aiSessions: AiSession[];
  aiCurrentSession: string;
  aiSuggested: string[];
  searchHot: string[];
  searchGuess: string[];
  searchHistory: string[];
  notifSettings: NotifSettings;
  unread: { interact: number; sysChat: number; aiChat: number };  // 消息未读:进会话清零
  analysisBadge: number;      // 「分析」红点角标
  publishBanner: null | { state: 'progress' | 'done'; pct: number };
  taskAudit: {
    dailyReportDay?: 'yesterday' | 'today' | 'tomorrow';
    pregnancyProbabilityViewedOnTomorrow?: boolean;
    openedNoticeId?: string;
  };
  _temp?: unknown;
}

export interface MeiyouActions {
  // 记录
  saveRecord: (date: string, patch: Partial<DayRecord>) => void;
  toggleSymptom: (date: string, symptom: string) => void;
  confirmPeriodStart: (date: string, rec: Partial<DayRecord>) => void;
  confirmPeriodEnd: (date: string) => void;
  bumpAnalysisBadge: () => void;
  clearAnalysisBadge: () => void;
  // 周期设置
  setCycleLen: (n: number) => void;
  setPeriodLen: (n: number) => void;
  toggleSmartPredict: () => void;
  togglePregProb: () => void;
  // 模式
  enablePrepMode: () => void;
  switchMode: (m: MeiyouMode) => void;
  // 社区
  likePost: (postId: string) => void;
  likeComment: (commentId: string) => void;
  favPost: (postId: string) => void;
  followAuthor: (name: string) => void;
  joinCircle: (circleId: string) => void;
  dismissAd: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  publishPost: (text: string, topics: string[], images: string[], circleId: string) => void;
  setPublishBanner: (b: MeiyouState['publishBanner']) => void;
  // 搜索
  submitSearch: (q: string) => void;
  // 消息 / AI
  aiAsk: (q: string) => void;
  aiNewSession: () => void;
  aiSwitchSession: (id: string) => void;
  // 账号
  logout: () => void;
  login: () => void;
  // 通知设置
  toggleNotif: (key: keyof NotifSettings) => void;
  recordDailyReportView: (day: 'yesterday' | 'today' | 'tomorrow', pregnancyProbabilityVisible: boolean) => void;
  recordNoticeOpened: (noticeId: string) => void;
  // 消息已读
  markRead: (key: 'interact' | 'sysChat' | 'aiChat') => void;
}
