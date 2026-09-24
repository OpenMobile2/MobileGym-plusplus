/** BOSS直聘(牛人端)类型定义。数据全部虚构,不含真机截图中的真实公司/人名/联系方式。 */

export type JobType = 'fulltime' | 'intern' | 'parttime';
export type SortMode = 'recommend' | 'nearby' | 'latest';
export type MessagesTab = 'all' | 'newGreeting' | 'chatOnly';
export type RecordsTab = 'viewed' | 'chatted' | 'applied' | 'exchanged' | 'interviewed';
export type JobStatus = '离校-随时到岗' | '在校-月内到岗' | '在校-考虑机会' | '在校-暂不考虑';

export interface Company {
  id: string;
  name: string;
  stage: string;
  scale: string;
  industry: string;
  /** logos/<id>.png 键 */
  logo: string;
  workHours: string;
  restDays: string;
  overtime: string;
  welfare: string[];
  district: string;
  address: string;
  intro: string;
  photos: string[];
}

export interface BossUser {
  id: string;
  name: string;
  title: string;
  companyId: string;
  /** avatars/<key>.png */
  avatar: string;
  activity: string;
  /** BOSS活跃状态筛选档位(刚刚活跃/今日活跃/3日内活跃/本周活跃/本月活跃) */
  activeTier: string;
  online: boolean;
}

export interface Job {
  id: string;
  title: string;
  salary: string;
  jobType: JobType;
  campus: boolean;
  hotBadge?: string;
  companyId: string;
  bossId: string;
  city: string;
  district: string;
  address: string;
  eduReq: string;
  expReq: string;
  tags: string[];
  skills: string[];
  desc: string[];
  reqs: string[];
  gradYear?: string;
  deadline?: string;
  /** 距家 km,附近排序用 */
  distanceKm: number;
  /** 发布距今天数,最新排序用 */
  publishedDaysAgo: number;
  /** 实习/兼职:如 ["4天/周","6个月"] */
  duration?: string[];
  /** 兼职页分类，可同时属于多个分类。 */
  parttimeCategories?: string[];
  highlight?: string;
}

export interface ExpectItem {
  id: string;
  position: string;
  city: string;
  salary: string;
  industry: string;
}

export interface ChatMessage {
  id: string;
  from: 'me' | 'boss' | 'system';
  kind: 'text' | 'jobcard' | 'resume' | 'exchange' | 'image';
  text: string;
  timeLabel: string;
  imageUri?: string;
  /** typed = keyboard; quickreply = 常用语面板发送 */
  source?: 'typed' | 'quickreply';
}

export interface ChatSession {
  id: string;
  bossId: string;
  jobId: string;
  /** 新招呼 = Boss 主动发起 */
  isGreeting: boolean;
  unread: number;
  lastTimeLabel: string;
  initiatedByMe: boolean;
  messages: ChatMessage[];
  /** Boss 已自动回复的轮数(Q7:3-5 轮封顶) */
  replyRounds: number;
  pinned: boolean;
  blocked: boolean;
  disliked: boolean;
  remark: string;
  phoneExchanged: boolean;
  wechatExchanged: boolean;
  resumeSent: boolean;
}

export interface FeedAuthor {
  name: string;
  avatar: string;
  tag?: string;
  title?: string;
}

export interface FeedPost {
  id: string;
  /** 用户自己发布的帖 = 'me',用于头像与"我的动态" */
  mine?: boolean;
  author: FeedAuthor;
  text: string;
  fullText: string;
  img?: string;
  /** 用户通过系统相册选择的图片。 */
  imageUris?: string[];
  aiDeclared?: boolean;
  topics: string[];
  qaCard?: string;
  comments: number;
  stars: number;
  likes: number;
}

export interface FeedComment {
  id: string;
  postId: string;
  author: string;
  authorTag?: string;
  text: string;
  likes: number;
  hot: boolean;
  timeLabel: string;
  replies: { author: string; text: string; likes: number; timeLabel: string }[];
  moreReplies: number;
}

export interface InterviewItem {
  id: string;
  bossId: string;
  jobId: string;
  type: 'online' | 'offline';
  date: string;
  time: string;
}

export interface RecordEntry {
  jobId: string;
  dateLabel: string;
  timeLabel: string;
}

export interface AutoReplyRule {
  keywords: string[];
  replies: string[];
}

export interface QuickReply {
  id: string;
  text: string;
}

export interface GreetSample {
  id: string;
  category: string;
  role: string;
  avatar: string;
  text: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Settings {
  language: 'zh' | 'en';
  notifyMsg: boolean;
  notifySys: boolean;
  soundOn: boolean;
  resumeVisible: boolean;
}

export interface TempState {
  toast: string;
  toastSeq: number;
  notice: string;
  noticeSeq: number;
}

export interface FullState {
  _dataVersion: number;
  user: {
    nickname: string;
    role: string;
    age: number;
    gradLabel: string;
    degree: string;
    school: string;
    schoolYears: string;
    major: string;
    schoolTag: string;
    phoneMasked: string;
    wechatFilled: boolean;
    advantage: string;
    skills: string;
    jobStatus: JobStatus;
    ipLocation: string;
    intro: string;
    communityNick: string;
    followCount: number;
    fansCount: number;
    birthday: string;
    industry: string;
    workCity: string;
    tags: string;
  };
  expects: ExpectItem[];
  city: string;
  /** 最近访问城市，按最新在前保存；当前城市不重复写入。 */
  cityHistory: string[];
  jobType: JobType;
  sortMode: SortMode;
  /** 已通过原因弹层移除的职位 */
  dismissedJobIds: string[];
  filter: Record<string, string[]>;
  searchHistory: string[];
  favoriteJobIds: string[];
  favoriteCompanyIds: string[];
  sessions: ChatSession[];
  quickReplies: QuickReply[];
  feedTab: 'recommend' | 'follow';
  /** 当前选中的期望岗位(职位列表过滤);'' = 综合(全部) */
  selectedExpect: string;
  /** 当前兼职分类；空字符串表示展示全部兼职。 */
  parttimeCategory: string;
  /** 用户发布的动态(置于有了流顶部) */
  myPosts: FeedPost[];
  /** 用户对种子评论的回复:commentId → 回复列表 */
  commentReplies: Record<string, { author: string; text: string; likes: number; timeLabel: string }[]>;
  likedPostIds: string[];
  favoritePostIds: string[];
  followedAuthors: string[];
  likedCommentIds: string[];
  myComments: FeedComment[];
  records: Record<RecordsTab, RecordEntry[]>;
  interviews: InterviewItem[];
  interviewHistory: InterviewItem[];
  resume: {
    sections: Record<string, string>;
    dateRanges: Record<string, string>;
  };
  verifySubmitted: boolean;
  verificationReportImage: string;
  taskAudit: Record<string, unknown>;
  purchases: {
    vipCard: '' | 'card30' | 'card60';
    vipDays: number;
    competitivenessPlan: string;
    competitivenessDays: number;
    mbtiEdition: '' | 'std' | 'full';
  };
  cacheSizeMb: number;
  settings: Settings;
  _temp: TempState;
}
