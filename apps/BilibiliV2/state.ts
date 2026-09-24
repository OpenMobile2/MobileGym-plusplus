import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { DATA_VERSION } from './constants';
import { BILIBILI_V2_CONFIG } from './data';
import { manifest } from './manifest';
import type {
  BiliComment,
  BiliDynamic,
  BilibiliActions,
  BilibiliState,
} from './types';

const initialState = BILIBILI_V2_CONFIG as unknown as BilibiliState;

function makeId(prefix: string) {
  return `${prefix}_${TimeService.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useBilibiliV2Store = createAppStoreWithActions<BilibiliState, BilibiliActions>(
  manifest.id,
  initialState,
  (set) => ({
    toggleVideoLike: (videoId) => {
      set((s) => {
        const liked = s.likedVideoIds.includes(videoId);
        return {
          likedVideoIds: liked
            ? s.likedVideoIds.filter(id => id !== videoId)
            : [...s.likedVideoIds, videoId],
          videos: s.videos.map(video =>
            video.id === videoId
              ? { ...video, likes: Math.max(0, video.likes + (liked ? -1 : 1)) }
              : video,
          ),
        };
      });
    },

    coinVideo: (videoId) => {
      set((s) => {
        if (s.coinedVideoIds.includes(videoId)) return {};
        return {
          coinedVideoIds: [...s.coinedVideoIds, videoId],
          videos: s.videos.map(video =>
            video.id === videoId ? { ...video, coins: video.coins + 1 } : video,
          ),
        };
      });
    },

    toggleFavorite: (videoId) => {
      set((s) => {
        const favored = s.favoriteVideoIds.includes(videoId);
        return {
          favoriteVideoIds: favored
            ? s.favoriteVideoIds.filter(id => id !== videoId)
            : [...s.favoriteVideoIds, videoId],
          videos: s.videos.map(video =>
            video.id === videoId
              ? { ...video, favorites: Math.max(0, video.favorites + (favored ? -1 : 1)) }
              : video,
          ),
        };
      });
    },

    submitComment: (videoId, content) => {
      const text = content.trim();
      if (!text) return;
      const comment: BiliComment = {
        id: makeId('comment'),
        videoId,
        userId: 'me',
        content: text,
        likes: 0,
        createdAt: TimeService.now(),
      };
      set((s) => ({
        comments: [comment, ...s.comments],
        videos: s.videos.map(video =>
          video.id === videoId ? { ...video, comments: video.comments + 1 } : video,
        ),
      }));
    },

    toggleFollow: (userId) => {
      set((s) => {
        const followed = s.followedUserIds.includes(userId);
        return {
          followedUserIds: followed
            ? s.followedUserIds.filter(id => id !== userId)
            : [...s.followedUserIds, userId],
          users: s.users.map(user =>
            user.id === userId
              ? { ...user, followers: Math.max(0, user.followers + (followed ? -1 : 1)) }
              : user,
          ),
        };
      });
    },

    toggleDynamicLike: (dynamicId) => {
      set((s) => {
        const liked = s.likedDynamicIds.includes(dynamicId);
        return {
          likedDynamicIds: liked
            ? s.likedDynamicIds.filter(id => id !== dynamicId)
            : [...s.likedDynamicIds, dynamicId],
          dynamics: s.dynamics.map(item =>
            item.id === dynamicId
              ? { ...item, likes: Math.max(0, item.likes + (liked ? -1 : 1)) }
              : item,
          ),
        };
      });
    },

    publishDynamic: (content) => {
      const text = content.trim();
      if (!text) return;
      const dynamic: BiliDynamic = {
        id: makeId('dynamic'),
        userId: 'me',
        content: text,
        likes: 0,
        comments: 0,
        createdAt: TimeService.now(),
      };
      set((s) => ({ dynamics: [dynamic, ...s.dynamics], draftDynamic: '' }));
    },

    markAllMessagesRead: () => {
      set((s) => ({ messages: s.messages.map(message => ({ ...message, unread: 0 })) }));
    },

    saveSignature: (sign) => {
      set((s) => ({ me: { ...s.me, sign: sign.trim() || s.me.sign } }));
    },

    recordSearch: (keyword) => {
      const text = keyword.trim();
      if (!text) return;
      set((s) => ({
        searchHistory: [text, ...s.searchHistory.filter(item => item !== text)].slice(0, 8),
      }));
    },
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(state)) {
        if (typeof value !== 'function') result[key] = value;
      }
      return result as Partial<BilibiliState>;
    },
  },
);

export const selectVideo = (videoId: string) => (s: BilibiliState & BilibiliActions) =>
  s.videos.find(video => video.id === videoId);

export const selectUser = (userId: string) => (s: BilibiliState & BilibiliActions) =>
  userId === 'me' ? s.me : s.users.find(user => user.id === userId);

export const selectUnreadCount = (s: BilibiliState & BilibiliActions) =>
  s.messages.reduce((sum, message) => sum + message.unread, 0);
