export interface BiliUser {
  id: string;
  name: string;
  avatarTone: string;
  level: number;
  followers: number;
  following: number;
  sign: string;
  verified?: boolean;
}

export interface BiliVideo {
  id: string;
  bvid: string;
  title: string;
  channel: string;
  authorId: string;
  duration: string;
  views: number;
  danmaku: number;
  likes: number;
  coins: number;
  favorites: number;
  comments: number;
  publishedAt: number; // absolute Unix milliseconds
  paletteIndex: number;
  description: string;
  tags: string[];
}

export interface BiliComment {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  likes: number;
  createdAt: number; // absolute Unix milliseconds
}

export interface BiliDynamic {
  id: string;
  userId: string;
  content: string;
  videoId?: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt: number; // absolute Unix milliseconds
}

export interface BiliMessage {
  id: string;
  kind: 'reply' | 'at' | 'like' | 'system' | 'chat';
  title: string;
  body: string;
  unread: number;
  createdAt: number; // absolute Unix milliseconds
}

export interface BilibiliState {
  me: BiliUser;
  users: BiliUser[];
  videos: BiliVideo[];
  comments: BiliComment[];
  dynamics: BiliDynamic[];
  messages: BiliMessage[];
  likedVideoIds: string[];
  coinedVideoIds: string[];
  favoriteVideoIds: string[];
  followedUserIds: string[];
  likedDynamicIds: string[];
  searchHistory: string[];
  draftDynamic: string;
}

export interface BilibiliActions {
  toggleVideoLike: (videoId: string) => void;
  coinVideo: (videoId: string) => void;
  toggleFavorite: (videoId: string) => void;
  submitComment: (videoId: string, content: string) => void;
  toggleFollow: (userId: string) => void;
  toggleDynamicLike: (dynamicId: string) => void;
  publishDynamic: (content: string) => void;
  markAllMessagesRead: () => void;
  saveSignature: (sign: string) => void;
  recordSearch: (keyword: string) => void;
}
