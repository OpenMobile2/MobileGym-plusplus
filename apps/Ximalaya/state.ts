import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { XIMALAYA_CONFIG } from './data';
import type { XmlyState, XmlyActions, Comment } from './types';

const initialState: XmlyState = JSON.parse(JSON.stringify(XIMALAYA_CONFIG));

let seq = 0;
const genId = (p: string) => `${p}_${TimeService.now()}_${seq++}`;

const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter((x) => x !== id) : [id, ...arr];

export const useXimalayaStore = createAppStoreWithActions<XmlyState, XmlyActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    toggleSubscribe: (albumId) =>
      set((s) => ({ subscribedAlbumIds: toggle(s.subscribedAlbumIds, albumId) })),

    toggleCollect: (trackId) =>
      set((s) => ({ collectedTrackIds: toggle(s.collectedTrackIds, trackId) })),

    toggleFollow: (anchorId) =>
      set((s) => ({ followedAnchorIds: toggle(s.followedAnchorIds, anchorId) })),

    toggleLikeTrack: (trackId) =>
      set((s) => ({ likedTrackIds: toggle(s.likedTrackIds, trackId) })),

    toggleLikeComment: (commentId) =>
      set((s) => ({ likedCommentIds: toggle(s.likedCommentIds, commentId) })),

    playTrack: (albumId, trackId) =>
      set((s) => {
        const rest = s.history.filter((h) => h.trackId !== trackId);
        const next = [
          { albumId, trackId, remainSec: 0, listenedAt: TimeService.now(), kind: 'play' as const },
          ...rest,
        ];
        return {
          player: { ...s.player, currentAlbumId: albumId, currentTrackId: trackId, playing: true, progressSec: 0 },
          history: next.slice(0, 50),
        };
      }),

    togglePlay: () => set((s) => ({ player: { ...s.player, playing: !s.player.playing } })),
    setSpeed: (speed) => set((s) => ({ player: { ...s.player, speed } })),
    setQuality: (quality) => set((s) => ({ player: { ...s.player, quality } })),
    setTimer: (label) => set((s) => ({ player: { ...s.player, timerLabel: label } })),
    applySkin: (skinId) => set(() => ({ appliedSkinId: skinId })),

    addComment: (albumId, trackId, content, timePoint) =>
      set((s) => {
        const c: Comment = {
          id: genId('c'), albumId, trackId, userName: s.user.name, avatar: s.user.avatar,
          content, createdAt: TimeService.now(), region: '本地', likeCount: 0, timePoint, replyCount: 0,
        };
        return { comments: [c, ...s.comments] };
      }),

    openVip: () =>
      set((s) => ({ user: { ...s.user, isVip: true, vipExpireAt: TimeService.now() + 365 * 86400000 } })),

    removeHistory: (trackId) =>
      set((s) => ({ history: s.history.filter((h) => h.trackId !== trackId) })),

    addSearchHistory: (word) =>
      set((s) => {
        const w = word.trim();
        if (!w) return {};
        return { searchHistory: [w, ...s.searchHistory.filter((h) => h !== w)].slice(0, 20) };
      }),

    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    markThreadRead: (threadId) =>
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === threadId ? { ...m, unread: 0 } : m,
        ),
      })),

    markAllThreadsRead: () =>
      set((s) => ({
        messages: s.messages.map((m) => ({ ...m, unread: 0 })),
      })),
  }),
  { persistName: `${manifest.id}_v${DATA_VERSION}` },
);
