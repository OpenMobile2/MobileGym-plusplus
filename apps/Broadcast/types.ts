// apps/Broadcast/types.ts — 苹果播客领域模型
// 时间戳一律绝对 Unix 毫秒(例:1747900800000),禁止负相对偏移。

export interface Chapter {
  timeSec: number;   // 章节起点秒
  title: string;
}

export interface Episode {
  id: string;
  showId: string;
  title: string;
  date: number;          // 发布时间,绝对 Unix 毫秒
  durationSec: number;
  progressSec: number;   // 已播放进度秒(0 未开始)
  desc: string;
  played: boolean;
  chapters?: Chapter[];
}

export interface Show {
  id: string;
  title: string;
  author: string;
  artworkColor: string;  // 封面底色(无真实图,用色块+文字合成)
  artworkText?: string;  // 封面上显示的短文字(默认取 title)
  desc: string;
  rating: number;        // 0~5
  ratingCount: number;
  genreId: string;
  cadence: string;       // 更新频率,如「两周一更」
  episodeIds: string[];
  channelId?: string;
  premium?: boolean;
  website?: string;
}

export interface Channel {
  id: string;
  name: string;
  artworkColor: string;
  showIds: string[];
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  icon: string;          // Ic* 名或 emoji
  showIds: string[];
}

export interface Review {
  id: string;
  showId: string;
  title: string;
  stars: number;
  author: string;
  date: number;
  body: string;
}

export interface PlayerState {
  currentEpisodeId: string | null;
  isPlaying: boolean;
  speed: number;
  sleepMinutes: number;  // 0=关闭
}

export interface BroadcastUser {
  name: string;
  phone: string;
  avatarColor: string;
}

export interface BroadcastState {
  user: BroadcastUser;
  shows: Record<string, Show>;
  episodes: Record<string, Episode>;
  channels: Record<string, Channel>;
  genres: Record<string, Genre>;
  reviews: Review[];

  followedShowIds: string[];
  favoriteShowIds: string[];     // 你的最爱节目
  favoriteGenreIds: string[];
  favoriteChannelIds: string[];
  savedEpisodeIds: string[];
  downloadedEpisodeIds: string[];
  upNextIds: string[];           // 待播清单
  queueIds: string[];            // 播放队列(正在播放下面排队)
  notifications: Record<string, boolean>;   // showId -> 新单集通知开关
  myRatings: Record<string, number>;        // showId -> 我打的星级

  player: PlayerState;

  // 首页/发现的编排(只读结构性 id 列表)
  newShowIds: string[];
  topShowIds: string[];
  featuredShowId: string;
}

export interface BroadcastActions {
  // 播放(不出真声:仅切状态/进度)
  playEpisode: (episodeId: string) => void;
  togglePlay: () => void;
  skip: (deltaSec: number) => void;
  seek: (sec: number) => void;
  setSpeed: (speed: number) => void;
  setSleep: (minutes: number) => void;
  // 待播/队列
  playNext: (episodeId: string) => void;
  addToQueue: (episodeId: string) => void;
  removeFromUpNext: (episodeId: string) => void;
  clearQueue: () => void;
  markPlayed: (episodeId: string) => void;
  reorderQueue: (fromIdx: number, toIdx: number) => void;
  // 收藏/下载/关注
  toggleSave: (episodeId: string) => void;
  toggleDownload: (episodeId: string) => void;
  toggleFollow: (showId: string) => void;
  toggleFavoriteGenre: (genreId: string) => void;
  toggleChannelFavorite: (channelId: string) => void;
  rateShow: (showId: string, stars: number) => void;
  submitReview: (showId: string, title: string, body: string, stars: number) => void;
  toggleNotification: (showId: string) => void;
}
