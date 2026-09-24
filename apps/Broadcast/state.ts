// apps/Broadcast/state.ts — 苹果播客运行时状态
import { createAppStoreWithActions } from '@/os/createAppStore';
import { BROADCAST_CONFIG } from './data';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import type { BroadcastState, BroadcastActions } from './types';

const C = BROADCAST_CONFIG as unknown as BroadcastState;

const initialState: BroadcastState = {
  user: C.user,
  shows: C.shows,
  episodes: C.episodes,
  channels: C.channels,
  genres: C.genres,
  reviews: C.reviews,
  followedShowIds: C.followedShowIds,
  favoriteShowIds: C.favoriteShowIds,
  favoriteGenreIds: C.favoriteGenreIds,
  favoriteChannelIds: C.favoriteChannelIds ?? [],
  savedEpisodeIds: C.savedEpisodeIds,
  downloadedEpisodeIds: C.downloadedEpisodeIds,
  upNextIds: C.upNextIds,
  queueIds: C.queueIds,
  notifications: C.notifications,
  myRatings: C.myRatings,
  player: C.player,
  newShowIds: C.newShowIds,
  topShowIds: C.topShowIds,
  featuredShowId: C.featuredShowId,
};

const without = (arr: string[], id: string) => arr.filter(x => x !== id);
const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? without(arr, id) : [...arr, id];

export const useBroadcastStore = createAppStoreWithActions<BroadcastState, BroadcastActions>(
  manifest.id,
  initialState,
  (set) => ({
    playEpisode: (episodeId) =>
      set((s) => ({
        player: { ...s.player, currentEpisodeId: episodeId, isPlaying: true },
        upNextIds: without(s.upNextIds, episodeId),
      })),

    togglePlay: () =>
      set((s) => ({ player: { ...s.player, isPlaying: !s.player.isPlaying } })),

    skip: (deltaSec) =>
      set((s) => {
        const cur = s.player.currentEpisodeId;
        if (!cur) return {};
        const e = s.episodes[cur];
        if (!e) return {};
        const next = Math.max(0, Math.min(e.durationSec, e.progressSec + deltaSec));
        return { episodes: { ...s.episodes, [cur]: { ...e, progressSec: next } } };
      }),

    seek: (sec) =>
      set((s) => {
        const cur = s.player.currentEpisodeId;
        if (!cur) return {};
        const e = s.episodes[cur];
        if (!e) return {};
        return { episodes: { ...s.episodes, [cur]: { ...e, progressSec: Math.max(0, Math.min(e.durationSec, sec)) } } };
      }),

    setSpeed: (speed) => set((s) => ({ player: { ...s.player, speed } })),
    setSleep: (minutes) => set((s) => ({ player: { ...s.player, sleepMinutes: minutes } })),

    playNext: (episodeId) =>
      set((s) => ({ queueIds: [episodeId, ...without(s.queueIds, episodeId)] })),
    addToQueue: (episodeId) =>
      set((s) => ({ queueIds: [...without(s.queueIds, episodeId), episodeId] })),
    removeFromUpNext: (episodeId) =>
      set((s) => ({ upNextIds: without(s.upNextIds, episodeId) })),
    clearQueue: () => set(() => ({ queueIds: [] })),

    markPlayed: (episodeId) =>
      set((s) => {
        const e = s.episodes[episodeId];
        return {
          upNextIds: without(s.upNextIds, episodeId),
          episodes: e ? { ...s.episodes, [episodeId]: { ...e, played: true, progressSec: e.durationSec } } : s.episodes,
        };
      }),

    reorderQueue: (fromIdx, toIdx) =>
      set((s) => {
        const q = [...s.queueIds];
        if (fromIdx < 0 || fromIdx >= q.length || toIdx < 0 || toIdx >= q.length) return {};
        const [m] = q.splice(fromIdx, 1);
        q.splice(toIdx, 0, m);
        return { queueIds: q };
      }),

    toggleSave: (episodeId) => set((s) => ({ savedEpisodeIds: toggle(s.savedEpisodeIds, episodeId) })),
    toggleDownload: (episodeId) => set((s) => ({ downloadedEpisodeIds: toggle(s.downloadedEpisodeIds, episodeId) })),
    toggleFollow: (showId) => set((s) => ({ followedShowIds: toggle(s.followedShowIds, showId) })),
    toggleFavoriteGenre: (genreId) => set((s) => ({ favoriteGenreIds: toggle(s.favoriteGenreIds, genreId) })),
    toggleChannelFavorite: (channelId) => set((s) => ({ favoriteChannelIds: toggle(s.favoriteChannelIds, channelId) })),
    rateShow: (showId, stars) => set((s) => ({ myRatings: { ...s.myRatings, [showId]: stars } })),
    submitReview: (showId, title, body, stars) =>
      set((s) => ({
        myRatings: { ...s.myRatings, [showId]: stars },
        reviews: [{
          id: `user_${showId}`,
          showId,
          title,
          body,
          stars,
          author: s.user.name,
          date: 1785024000000,
        }, ...s.reviews.filter(review => review.id !== `user_${showId}`)],
      })),
    toggleNotification: (showId) =>
      set((s) => ({ notifications: { ...s.notifications, [showId]: !s.notifications[showId] } })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<BroadcastState>;
    },
  },
);
