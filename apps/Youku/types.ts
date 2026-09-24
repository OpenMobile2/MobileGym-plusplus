import type { ContentType } from './utils/openContent';

/** 片库条目(catalog,只读配置;电影无 episodeCount) */
export interface CatalogItem {
  id: string;
  title: string;
  type: ContentType | string;
  channel: string;
  poster: string;
  still: string;
  recTitle: string;
  desc: string;
  heat: number;
  badge: string;
  rating: number;
  year: number;
  region: string;
  tags: string[];
  director: string;
  actors: string[];
  durationSec: number;
  douban?: number;
  episodeCount?: number;
  updatedTo?: number;
  /** 免费可看到第 N 集 */
  freeUpTo?: number;
  /** 试看角标所在集 */
  trialEp?: number;
  /** 从第 N 集起需要 VIP */
  vipFrom?: number;
  seriesId?: string;
  /** 语言选择行(部分影片) */
  languages?: string[];
  /** 每日放送:周几更新(0=周日) */
  broadcastDay?: number;
  boxOffice?: string;
  ages?: string;
}

export interface ShortVideo {
  id: string;
  type: 'short' | string;
  title: string;
  creatorId: string;
  linkedContentId: string | null;
  durationSec: number;
  cover: string;
  likes: number;
  commentsCount: number;
  favs: number;
  playsText: string;
}

export interface ShortDrama {
  id: string;
  type: 'drama' | string;
  title: string;
  episodeCount: number;
  updatedTo: number;
  cover: string;
  heat: number;
  likes: number;
  follows: number;
  freeUpTo: number;
  vipFrom: number;
  desc: string;
  commentsCount: number;
}

export interface CreatorDynamic {
  id: string;
  text: string;
  shortId: string | null;
  at: { dayOffset: number; hm: string };
  likes: number;
  comments: number;
  shares: number;
}

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  fansText: string;
  likesTotal: string;
  verify: string;
  ipRegion: string;
  bio: string;
  videoIds: string[];
  likeShortIds: string[];
  collections: Array<{ name: string; count: number }>;
  dynamics: CreatorDynamic[];
}

export interface CommentReply {
  id: string;
  user: string;
  text: string;
  ts: number;
  ip: string;
  likes: number;
}

export interface CommentItem {
  id: string;
  user: string;
  avatar: string;
  vip: boolean;
  text: string;
  ts: number;
  ip: string;
  likes: number;
  likedByMe: boolean;
  replies: CommentReply[];
  isReview: boolean;
  /** 本人发布(用于自赞生成通知,spec msg.likes) */
  byMe?: boolean;
}

/** 历史条目 key = `${id}#${episode ?? 0}` */
export interface HistoryEntry {
  id: string;
  ctype: ContentType | string;
  episode?: number;
  progressSec: number;
  durationSec: number;
  ts: number;
}

export interface LibraryEntry {
  id: string;
  ctype: ContentType | string;
  ts: number;
  progressText?: string;
  perk?: string;
}

export interface LikeEntry {
  id: string;
  ctype: ContentType | string;
  ts: number;
}

export interface DownloadEntry {
  id: string;
  ctype: ContentType | string;
  episode?: number;
  sizeMB: number;
  ts: number;
}

export interface RatingEntry {
  score: number;
  review: string;
  ts: number;
}

export interface FanEntry {
  userId: string;
  name: string;
  avatar: string;
  sign: string;
  followedBack: boolean;
}

/** 个人主页-互动tab 条目(我发布的评论) */
export interface InteractionEntry {
  id: string;
  text: string;
  contentId: string;
  episode?: number;
  ts: number;
  liked: boolean;
}

/** 个人主页-动态tab 条目(发布动态) */
export interface MomentEntry {
  id: string;
  text: string;
  images: string[];
  topicName: string | null;
  showId: string | null;
  showTitle: string | null;
  aiDeclared: boolean;
  ts: number;
  likes: number;
}

export interface NoticeEntry {
  id: string;
  user: string;
  action: string;
  contentId: string;
  episode?: number;
  commentId?: string;
  text?: string;
  quote?: string;
  ts: number;
}

export interface ConvMsg {
  id: string;
  ts: number;
  text: string;
}

export interface OrderEntry {
  id: string;
  title: string;
  priceText: string;
  paidText: string;
  ts: number;
  status: string;
}

export interface Membership {
  active: boolean;
  tier: 'vip' | 'svip' | null;
  sinceTs: number | null;
  /** 到期时间戳;续费在此基础上叠加包月/季/年天数 */
  expireTs: number | null;
  /** 今日是否已打卡 */
  checkedIn: boolean;
}

export interface UserProfile {
  nickname: string;
  gender: string;
  birthday: string;
  bio: string;
  ip: string;
  avatar: string;
  likeCount: number;
  coinText: string;
}

export interface PlaybackPrefs {
  /** '1.0X' 等,或自定义 '1.7X' */
  speed: string;
  /** 'off' | 'current' | '30:00' | '60:00' */
  timer: string;
  danmakuOn: boolean;
  dataTipDismissed: boolean;
  /** videoId → 已选语言 */
  languages: Record<string, string>;
}

export interface EpisodePanelAudit {
  viewedTabs: Array<'episodes' | 'synopsis'>;
  titlesEnabled: boolean;
  selectedEpisode: number | null;
}

export interface PublishDraft {
  text: string;
  images: string[];
  topicName: string | null;
  showId: string | null;
  showTitle: string | null;
  aiDeclared: boolean;
}

/** 非持久化临时态(persist 时剔除) */
export interface TempState {
  toast: string;
  toastSeq: number;
  /** 搜索页输入草稿(suggest 联想态) */
  searchInput: string;
  /** 发布动态草稿(话题/节目选择页跨页回填) */
  publishDraft: PublishDraft;
  /** 编辑资料草稿(null=未在编辑) */
  profileDraft: { nickname: string; gender: string; birthday: string; bio: string } | null;
  /** 历史/收藏编辑态勾选集合(key = `${id}#${episode ?? 0}` 或条目 id) */
  editSelect: string[];
  /** 发布成功后个人主页落地 tab(消费后清空) */
  profileTabHint: 'video' | 'moments' | 'interact' | 'likes' | null;
}

/** App 外观三档(默认 dark) */
export type AppearanceMode = 'dark' | 'light' | 'system';

export interface FullState {
  _dataVersion: number;
  user: UserProfile;
  membership: Membership;
  /** 在追(加追行为,含剧集/综艺/动漫/短剧/电影) */
  libFollowing: LibraryEntry[];
  /** 预约(未上线影片 upcomingId) */
  reservations: string[];
  /** 收藏(feed 收藏行为) */
  favorites: LibraryEntry[];
  /** 点赞(个人主页-喜欢tab) */
  likes: LikeEntry[];
  history: HistoryEntry[];
  downloads: DownloadEntry[];
  /** contentId → 我的评分 */
  ratings: Record<string, RatingEntry>;
  /**
   * 评论区(可变部分),key 约定:电影/短视频/短剧=contentId;剧集=`${showId}:${ep}`。
   * 初始只含 seedComments 的 key;其余 key 首次交互时从 defaultComments 惰性落库(getComments helper)。
   */
  commentsByKey: Record<string, CommentItem[]>;
  /** 我发送的弹幕(展示时与 config seedDanmaku/defaultDanmaku 合并) */
  userDanmakuByKey: Record<string, string[]>;
  /** 已关注创作者 userId 列表 */
  followingCreators: string[];
  fans: FanEntry[];
  interactions: InteractionEntry[];
  moments: MomentEntry[];
  /** 已点赞的创作者动态 id */
  likedDynamics: string[];
  /** 解说 feed 投票:shortId → option */
  votes: Record<string, string>;
  notices: { likes: NoticeEntry[]; comments: NoticeEntry[]; danmu: NoticeEntry[]; fans: NoticeEntry[] };
  conversations: { vip: ConvMsg[]; system: ConvMsg[]; assistant: ConvMsg[] };
  unread: { likes: number; comments: number; danmu: number; fans: number; vip: number; system: number };
  orders: OrderEntry[];
  /** 订单列表当前展示条数(点击加载更多) */
  ordersShown: number;
  searchHistory: string[];
  /** 搜索发现当前批次(换一批) */
  discoverBatch: number;
  settings: Record<string, boolean>;
  /**
   * App 外观:dark=深色(默认) / light=浅色 / system=跟随系统。
   * 与 OS QuickSettings 解耦,仅影响本 App CSS token。
   */
  appearanceMode: AppearanceMode;
  playback: PlaybackPrefs;
  /** 剧集选集面板的可验收只读交互记录；按 showId 保存。 */
  episodePanelAudit: Record<string, EpisodePanelAudit>;
  _temp: TempState;
}

export interface AppActions {
  showToast: (msg: string) => void;
  setTemp: (patch: Partial<TempState>) => void;
  /** 观看进度写入历史(播放/拖进度条/切集实时调用;同 id+episode 覆盖并置顶) */
  writeProgress: (e: { id: string; ctype: string; episode?: number; progressSec: number; durationSec: number }) => void;
  /** 删除历史(keys = `${id}#${episode ?? 0}`) */
  deleteHistory: (keys: string[]) => void;
  /** 加追/取消加追(播放页+追/运营位加追/短剧边栏加追,入 me.library 在追tab) */
  toggleZhui: (id: string, ctype: string) => void;
  /** 预约/取消预约(频道预约位/新片预告,入 me.library 预约tab,双向联动) */
  toggleReserve: (id: string) => void;
  /** 收藏/取消收藏(短视频/解说 feed 星标,入 me.library 收藏tab视频子tab) */
  toggleFavorite: (id: string, ctype: string) => void;
  /** 在追/收藏编辑态批量删除 */
  removeLibraryItems: (tab: 'zhui' | 'fav', ids: string[]) => void;
  /** 点赞/取消点赞(播放页/feed,入个人主页喜欢tab) */
  toggleLike: (id: string, ctype: string) => void;
  /** 评论点赞(byMe 评论被自己点赞时生成赞通知,spec msg.likes) */
  toggleCommentLike: (contentKey: string, commentId: string) => void;
  /** 发布评论(发后上屏置顶;replyTo 时挂为子回复;写入个人主页互动tab) */
  publishComment: (contentKey: string, text: string, opts?: { replyToCommentId?: string; isReview?: boolean; contentId?: string; episode?: number }) => void;
  /** 发弹幕(滚动上屏,拍板Q4) */
  sendDanmaku: (contentKey: string, text: string) => void;
  /** 优酷评分提交(感受非空时作为影评入讨论tab,a265) */
  submitRating: (contentId: string, score: number, review: string) => void;
  setLanguage: (videoId: string, lang: string) => void;
  setSpeed: (option: string) => void;
  setTimer: (option: string) => void;
  toggleDanmaku: () => void;
  dismissDataTip: () => void;
  recordEpisodePanel: (
    showId: string,
    patch: { viewedTab?: 'episodes' | 'synopsis'; titlesEnabled?: boolean; selectedEpisode?: number },
  ) => void;
  /** 关注/取关创作者(feed +关注/创作者主页/我的关注,计数联动) */
  toggleFollowCreator: (userId: string) => void;
  /** 粉丝回关 toggle */
  toggleFanFollowBack: (userId: string) => void;
  /** 假开通/续费会员(拍板Q7:状态翻转,按套餐叠加到期日,同步系统消息) */
  activateVip: (tier: 'vip' | 'svip', planId?: 'monthly' | 'quarter' | 'year') => void;
  /** 会员页打卡;返回是否本次新打卡成功 */
  checkinVip: () => boolean;
  /** 假下载(拍板Q8:入 me.downloads,无真实文件) */
  fakeDownload: (id: string, ctype: string, episode?: number) => void;
  /** 解说讨论区投票(单选一次) */
  voteJieshuo: (shortId: string, option: string) => void;
  /** 一键已读(Q13答案A:直接清零,无确认) */
  markAllRead: () => void;
  /** 进入子页清零对应未读 */
  markRead: (key: 'likes' | 'comments' | 'danmu' | 'fans' | 'vip' | 'system') => void;
  /** 发布动态(qa:Q15:返回个人主页动态tab置顶) */
  publishMoment: () => void;
  toggleDynamicLike: (dynamicId: string) => void;
  /** 个人主页互动tab评论卡-赞 */
  toggleInteractionLike: (id: string) => void;
  addSearchHistory: (word: string) => void;
  clearSearchHistory: () => void;
  /** 搜索发现换一批 */
  refreshDiscover: () => void;
  /** 保存个人资料(me.profileEdit.save.commit,联动主页/我的页) */
  saveProfile: (patch: { nickname?: string; gender?: string; birthday?: string; bio?: string; avatar?: string }) => void;
  toggleSetting: (key: string) => void;
  /** 设置外观模式 */
  setAppearanceMode: (mode: AppearanceMode) => void;
  /** 订单列表加载更多 */
  loadMoreOrders: () => void;
}
