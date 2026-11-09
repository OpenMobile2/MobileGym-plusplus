// 网易云音乐 数据模型 —— 由 docs/wangyiyun-replication/spec.json v1.2 派生

export type PlayMode = 'order' | 'loop' | 'shuffle';

export interface Song {
  id: string;
  title: string;
  sub?: string;          // 影视来源等副标注
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  seed: string;          // 封面渐变 seed
  tags: string[];        // VIP/超清母带/沉浸声/十万红心 等
  durationSec: number;
  likeW: string;         // 红心数展示(如 "30w+")
  commentW: string;      // 评论数展示
  lyrics: string[];
  hasMv?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  seed: string;
  creator: string;
  desc: string;
  tag?: string;
  playCount: string;     // 展示("1044次" 或 "248.1亿")
  collectCount: number;
  songIds: string[];
  mine?: boolean;        // 自建
  isLiked?: boolean;     // 是"我喜欢的音乐"
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  seed: string;
  date: string;
  desc: string;
  songIds: string[];
  collectCount: number;
}

export interface Artist {
  id: string;
  name: string;
  alias?: string;
  seed: string;
  fans: string;
  followed: boolean;
  followedDays?: number;
  hotSongIds: string[];
  albumIds: string[];
  noteIds: string[];
  bio?: string;
}

export interface Comment {
  id: string;
  targetId: string;      // songId
  user: string;
  seed: string;
  badges: string[];      // VIP 等
  date: string;
  ip: string;
  text: string;
  likes: number;
  liked?: boolean;
  parentId?: string;     // 楼层内联回复
  mine?: boolean;
}

export interface Note {
  id: string;
  author: string;
  authorId: string;
  seed: string;
  coverSeed?: string;
  title?: string;
  body: string;
  songId?: string;
  topic?: string;
  date: string;
  ip?: string;
  likes: number;
  liked?: boolean;
  comments: number;
  shares: number;
  visibility: 'public' | 'fans' | 'mutual' | 'self';
  kind: 'rec' | 'follow';
  mine?: boolean;
}

export interface Episode {
  id: string;
  showId: string;
  showTitle: string;
  title: string;
  seed: string;
  desc: string;
  durationSec: number;
  likeW: string;
  timestamps: { at: number; song: string; artist: string }[];
}

export interface Podcast {
  id: string;
  title: string;
  host: string;
  seed: string;
  desc: string;
  episodeIds: string[];
  subscribed: boolean;
}

export interface Rank {
  id: string;
  name: string;
  seed: string;
  updateTime: string;
  desc: string;
  playW: string;
  songIds: string[];
  collectCount: number;
  official?: boolean;
}

export interface ChatMessage {
  from: 'me' | 'them';
  text: string;
  imageSeed?: string;
}

export interface Conversation {
  id: string;
  name: string;
  seed: string;
  summary: string;
  time: string;
  unread: number;
  official?: boolean;
  messages?: ChatMessage[];
}

export interface RecognizeResult {
  songId: string;
  vip?: boolean;
}

export interface Session {
  loggedIn: boolean;
  nick: string;
  seed: string;
  vip: string;           // "VIP·贰"
  follows: number;
  fans: number;
  level: number;
  hours: number;
}

export interface WangyiyunState {
  appId: string;
  session: Session;
  songs: Song[];
  playlists: Playlist[];
  albums: Album[];
  artists: Artist[];
  comments: Comment[];
  notes: Note[];
  episodes: Episode[];
  podcasts: Podcast[];
  ranks: Rank[];
  conversations: Conversation[];

  // 播放器
  currentSongId: string | null;
  queue: string[];
  historyQueue: string[];
  playMode: PlayMode;
  isPlaying: boolean;
  progressSec: number;
  playSource: string;    // 来源标题
  roamMode: boolean;
  quality: string;       // 音质
  playSpeed: number;     // 倍速
  sleepTimer: string;    // 定时关闭文案

  // 用户内容
  likedSongIds: string[];
  collectedPlaylistIds: string[];
  collectedAlbumIds: string[];
  subscribedShowIds: string[];
  searchHistory: string[];

  // 识曲
  recognizeCount: number;

  // 设置(简单功能)
  settings: Record<string, string | boolean>;
}

export interface WangyiyunActions {
  login: () => void;
  logout: () => void;
  playSong: (songId: string, queueIds?: string[], source?: string) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekTo: (sec: number) => void;
  cyclePlayMode: () => PlayMode;
  toggleHeart: (songId: string) => void;
  playFrom: (queueIds: string[], startId: string, source: string) => void;
  removeFromQueue: (songId: string) => void;
  insertNext: (songIds: string[]) => void;
  enterRoam: () => void;
  cycleQuality: () => string;
  cyclePlaySpeed: () => number;
  setSleepTimer: (label: string) => void;

  toggleCollectPlaylist: (playlistId: string) => void;
  toggleCollectAlbum: (albumId: string) => void;
  createPlaylist: (title: string, isPrivate: boolean) => string;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;

  toggleFollowArtist: (artistId: string) => void;
  subscribePodcast: (showId: string) => void;

  toggleCommentLike: (commentId: string) => void;
  publishComment: (songId: string, text: string, parentId?: string) => void;
  deleteComment: (commentId: string) => void;

  toggleNoteLike: (noteId: string) => void;
  publishNoteComment: (noteId: string, text: string) => void;
  publishNote: (title: string, body: string, songId?: string, coverSeed?: string) => string;
  deleteNote: (noteId: string) => void;

  submitSearch: (q: string) => void;
  clearSearchHistory: () => void;

  bumpRecognize: () => number;
  setSetting: (key: string, value: string | boolean) => void;
}
