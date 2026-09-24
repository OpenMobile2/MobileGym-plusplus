// 喜马拉雅 App 级类型。时间戳一律绝对 Unix 毫秒(走 TimeService)。

export interface Track {
  id: string;
  albumId: string;
  title: string;
  durationSec: number;
  playCount: number;
  updatedAt: number;      // 绝对 Unix ms
  isVip: boolean;
  free: boolean;
  transcript?: string;    // AI 文稿(节选)
}

export interface Album {
  id: string;
  title: string;
  cover: string;          // /@app-assets/Ximalaya/covers/xxx.png
  anchorId: string;
  anchorName: string;
  category: string;       // 有声书/播客/相声评书/大师课/儿童...
  intro: string;
  playCount: number;
  monthlyTicket: number;
  trackCount: number;
  finished: boolean;      // 完结/连载
  isVip: boolean;
  tags: string[];
  recommendPct?: number;  // 推荐值 %
  themeColor: string;     // 播放页动态主题色(封面取色暗化版)
  trackIds: string[];
}

export interface Anchor {
  id: string;
  name: string;
  avatar: string;
  desc: string;
  fansCount: number;
  albumCount: number;
  albumIds: string[];
}

export interface Comment {
  id: string;
  albumId: string;
  trackId?: string;
  userName: string;
  avatar: string;
  content: string;
  createdAt: number;
  region: string;
  likeCount: number;
  timePoint?: number;     // 标记时间点(秒),可点跳转
  replyCount: number;
}

export interface HistoryItem {
  albumId: string;
  trackId: string;
  remainSec: number;      // 剩余 X 分钟
  listenedAt: number;
  kind: 'play' | 'browse';
}

export interface LocalItem {
  albumId: string;
  downloadedCount: number;
  totalCount: number;
  sizeMB: number;
  kind: 'album' | 'sound' | 'video' | 'book';
}

export interface ListenList {
  id: string;
  name: string;
  isPrivate: boolean;
  trackIds: string[];
}

export interface MessageThread {
  id: string;
  kind: 'interactive' | 'system' | 'anchor' | 'survey' | 'tingjian';
  name: string;
  preview: string;
  unread: number;
  updatedAt: number;
  items: { id: string; title: string; body: string; createdAt: number }[];
}

export interface MemberPlan {
  id: string;
  name: string;          // 连续包月/买12送2/连续包年
  tier: 'vip' | 'platinum' | 'svip';
  price: number;
  originPrice: number;
  badge?: string;        // 倒计时/限时
}

export interface RankEntry {
  albumId: string;
  rank: number;
}

export interface Skin {
  id: string;
  name: string;
  category: string;      // 全部/经典IP/哈利波特/影视原著/玄幻奇幻
  isVip: boolean;
  owned: boolean;
  themeColor: string;
}

export interface PurchasedItem {
  albumId: string;
  purchasedCount: number;
  kind: 'album' | 'anchorVip' | 'package';
}

export interface Badge {
  id: string;
  title: string;
  group: string;         // 收听成就/频道粉丝成就/限定成就
  date: string;
  earned: boolean;
}

export interface XmlyUser {
  id: string;
  name: string;
  avatar: string;
  level: number;
  listenHours: number;
  fans: number;
  follows: number;
  isVip: boolean;
  vipExpireAt: number;
}

export interface PlayerState {
  currentAlbumId: string;
  currentTrackId: string;
  playing: boolean;
  progressSec: number;
  speed: number;         // 倍速
  quality: string;       // 音质
  timerLabel: string;    // 已设置的定时(模拟态)
}

export interface XmlyState {
  user: XmlyUser;
  albums: Album[];
  tracks: Track[];
  anchors: Anchor[];
  comments: Comment[];
  history: HistoryItem[];
  local: LocalItem[];
  listenLists: ListenList[];
  messages: MessageThread[];
  memberPlans: MemberPlan[];
  ranks: Record<string, RankEntry[]>;   // 榜单key -> 排名
  skins: Skin[];
  purchased: PurchasedItem[];
  badges: Badge[];
  quickListenTrackIds: string[];         // 快听沉浸流内容池
  hotSearch: string[];
  searchHistory: string[];

  // —— 运行时写入 ——
  subscribedAlbumIds: string[];
  collectedTrackIds: string[];           // 我收藏的声音
  followedAnchorIds: string[];
  likedTrackIds: string[];
  likedCommentIds: string[];
  appliedSkinId: string | null;
  player: PlayerState;
}

export interface XmlyActions {
  toggleSubscribe: (albumId: string) => void;
  toggleCollect: (trackId: string) => void;
  toggleFollow: (anchorId: string) => void;
  toggleLikeTrack: (trackId: string) => void;
  toggleLikeComment: (commentId: string) => void;
  playTrack: (albumId: string, trackId: string) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setQuality: (quality: string) => void;
  setTimer: (label: string) => void;
  applySkin: (skinId: string) => void;
  addComment: (albumId: string, trackId: string | undefined, content: string, timePoint?: number) => void;
  openVip: () => void;
  removeHistory: (trackId: string) => void;
  addSearchHistory: (word: string) => void;
  clearSearchHistory: () => void;
  markThreadRead: (threadId: string) => void;
  markAllThreadsRead: () => void;
}
