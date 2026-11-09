/** 微博 App 类型。所有 timestamp 均为绝对 Unix 毫秒。 */

export interface WbUser {
  id: string;
  name: string;
  avatar: string;          // /@app-assets/Weibo/...
  verified?: 'person' | 'org';   // 橙V/蓝V
  vipLevel?: number;       // 会员皇冠等级
  intro?: string;
  fans: number;
  follows: number;
  interactions?: number;   // 转评赞总数(他人主页计数条)
  headerImage?: string;    // 主页头图
  followedByMe?: boolean;
  followsMe?: boolean;     // 对方关注我(互相关注/回关判断)
  frequentInfo?: string;   // 经常访问行为chip(今天互动1次)
}

export interface WbComment {
  id: string;
  userId: string;
  text: string;
  timestamp: number;       // 绝对 Unix 毫秒
  region: string;          // 来自XX
  likes: number;
  likedByMe?: boolean;
  hot?: boolean;           // 热评标
  fanBadge?: string;       // 粉丝等级牌
  replies: WbComment[];    // 嵌套回复
  replyTo?: string;        // 回复@昵称
}

export interface WbStatus {
  id: string;
  userId: string;
  text: string;            // 含 #话题# @人 ◇超话 富文本标记
  timestamp: number;
  source: string;          // 来自 xx
  images: string[];        // 0/1/3/9 宫格
  reposts: number;
  comments: number;
  likes: number;
  likedByMe?: boolean;
  favoritedByMe?: boolean;
  hotComment?: { text: string; likes: number };  // 热评引用条
  edited?: boolean;
  channel?: string;        // 频道归属(热门/世界杯/同城/实时/榜单/热点/星品/热转/V发布)
  fromFollow?: boolean;    // 关注流
  supertopicId?: string;   // 超话帖
  repostOf?: string;       // 转发引用的原博 id
  visibility?: 'public' | 'fans' | 'friends' | 'private';
  isVideo?: boolean;
  searchTopic?: string;    // 该帖所属热搜话题(bare 词);话题页/搜索结果按此聚合
  searchOnly?: boolean;    // 仅在搜索/话题页出现,不进首页/发现信息流
  commentList: WbComment[];
}

export interface WbHotWord {
  word: string;
  tag?: '沸' | '热' | '新' | '娱' | '荐' | '公益';
  heat: number;            // 热度值(完整榜单)
  topic?: boolean;         // 点击后按 #word# 话题态
  reads?: number;          // 阅读量(话题头卡)
  discuss?: number;
  host?: string;           // 主持人
  rank?: string;           // 热搜TOPn 徽章
}

export interface WbSupertopic {
  id: string;
  name: string;
  cover: string;
  posts: number;           // 帖子数(万)
  fans: number;
  fanName: string;         // 个性粉丝名(嵩鼠)
  category: string;
  followed?: boolean;
  signedToday?: boolean;
  signStreak: number;      // 连签N天
  todaySigned: number;     // 今日签到N人
  badge?: string;          // 明星超话/银超
}

export interface WbChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
}

export interface WbChat {
  id: string;              // 对应 userId 或官方号 id
  name: string;
  avatar: string;
  verified?: 'person' | 'org';
  summary: string;
  timestamp: number;
  unread: number;
  stranger?: boolean;      // 陌生人留言限制态
  messages: WbChatMessage[];
}

export interface WbNotice {
  id: string;
  type: 'atMe' | 'comments' | 'likes';
  userId: string;
  text: string;            // 动作文案
  statusId: string;
  timestamp: number;
}

export interface WbDraft {
  id: string;
  text: string;
  images: string[];
  visibility: string;
  timestamp: number;
}

export interface WbTopicSuggest {
  name: string;            // 不带#
  category: string;
  discuss: string;         // 讨论N万
  cover: string;
}

export interface WeiboState {
  session: { loggedIn: boolean; phone: string };
  me: WbUser & { visitors: number };
  users: WbUser[];
  statuses: WbStatus[];
  hotWords: WbHotWord[];
  supertopics: WbSupertopic[];
  chats: WbChat[];
  notices: WbNotice[];
  drafts: WbDraft[];
  topics: WbTopicSuggest[];
  contacts: string[];          // @联系人 userId 列表(最近使用序)
  searchHistory: string[];
  galleryImages: string[];     // 图片选择页素材库
  locations: string[];         // 位置推荐chips
  favorites: string[];         // 收藏的 statusId
  likedStatusIds: string[];
  myPostIds: string[];
  unreadTotal: number;
  settings: WbSettings;
  taskAudit: {
    realtimeSearch?: { query: string; sort: 'interaction' | 'time' };
    viewedNoticeType?: string;
  };
  /** 运行时临时(不持久) */
  _temp?: Record<string, unknown>;
}

export interface WbSettings {
  // 隐私设置
  whoCanSeePosts: 'all' | 'following' | 'fans';
  findByPhone: boolean;
  showLikes: boolean;
  allowStrangerDM: boolean;
  showRegion: boolean;
  publicFollowing: boolean;
  // 屏蔽设置
  blockAds: boolean;
  filterComments: boolean;
  blockedWords: string[];
  blockedUsers: string[];   // userId 列表
  // 通用设置
  fontSize: 'small' | 'normal' | 'large';
  darkMode: 'system' | 'on' | 'off';
  videoAutoplay: 'wifi' | 'always' | 'off';
  trafficReminder: boolean;
  // 通知设置
  pushEnabled: boolean;
  notifComment: boolean;
  notifLike: boolean;
  notifAt: boolean;
  notifDM: boolean;
  notifFans: boolean;
  dndEnabled: boolean;
  // 账号与安全
  loginProtect: boolean;
  accountProtect: boolean;
  // 自定义导航栏(第4个 tab)
  navBarTab: 'video' | 'hot' | 'game' | 'local';
  // 未成年人 / 关爱
  teenMode: boolean;
  careMode: boolean;
}

export interface WeiboActions {
  login: (via: string) => void;
  logout: () => void;
  toggleLikeStatus: (statusId: string) => void;
  toggleFavorite: (statusId: string) => void;
  toggleLikeComment: (statusId: string, commentId: string, inReply?: boolean) => void;
  addComment: (statusId: string, text: string, replyToCommentId?: string, alsoRepost?: boolean) => void;
  submitRepost: (statusId: string, text: string, alsoComment?: boolean) => void;
  publishStatus: (p: { text: string; images: string[]; visibility: string; location?: string; supertopicId?: string }) => void;
  saveDraft: (d: { text: string; images: string[]; visibility: string }) => void;
  deleteDraft: (draftId: string) => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  followSupertopic: (stId: string) => void;
  signSupertopic: (stId: string) => void;
  signAllSupertopics: () => void;
  postToSupertopic: (stId: string, text: string, syncWeibo: boolean) => void;
  sendChatMessage: (chatId: string, text: string) => void;
  openChatWith: (userId: string) => void;
  markChatRead: (chatId: string) => void;
  clearAllUnread: () => void;
  submitSearch: (q: string) => void;
  clearSearchHistory: () => void;
  removeDeletedLike: (statusId: string) => void;
  refreshFeed: () => void;
  setSetting: <K extends keyof WbSettings>(key: K, value: WbSettings[K]) => void;
  removeBlockedWord: (word: string) => void;
  removeBlockedUser: (userId: string) => void;
  recordRealtimeSearch: (query: string, sort: 'interaction' | 'time') => void;
  recordNoticeViewed: (type: string) => void;
}
