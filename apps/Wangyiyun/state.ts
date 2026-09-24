import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { WANGYIYUN_CONFIG } from './data';
import { PLAY_MODE_ORDER } from './constants';
import type { WangyiyunState, WangyiyunActions, PlayMode, Comment, Note } from './types';

const initialState: WangyiyunState = JSON.parse(JSON.stringify(WANGYIYUN_CONFIG));

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

export const useWangyiyunStore = createAppStoreWithActions<WangyiyunState, WangyiyunActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    // ---------- 账号 ----------
    login: () => set((s) => ({ session: { ...s.session, loggedIn: true } })),
    logout: () => set((s) => ({ session: { ...s.session, loggedIn: false } })),

    // ---------- 播放 ----------
    playSong: (songId, queueIds, source) => set((s) => ({
      currentSongId: songId,
      queue: queueIds && queueIds.length ? queueIds : (s.queue.includes(songId) ? s.queue : [songId, ...s.queue]),
      isPlaying: true,
      progressSec: 0,
      playSource: source ?? s.playSource,
      roamMode: false,
      historyQueue: [songId, ...s.historyQueue.filter((x) => x !== songId)].slice(0, 50),
    })),
    playFrom: (queueIds, startId, source) => set((s) => ({
      queue: queueIds,
      currentSongId: startId,
      isPlaying: true,
      progressSec: 0,
      playSource: source,
      roamMode: false,
      historyQueue: [startId, ...s.historyQueue.filter((x) => x !== startId)].slice(0, 50),
    })),
    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
    seekTo: (sec) => set(() => ({ progressSec: Math.max(0, Math.floor(sec)) })),
    nextSong: () => {
      const s = get();
      const q = s.queue;
      if (!q.length || !s.currentSongId) return;
      const i = q.indexOf(s.currentSongId);
      const ni = s.playMode === 'shuffle'
        ? (i + 1 + (s.progressSec % Math.max(1, q.length - 1))) % q.length
        : (i + 1) % q.length;
      set({ currentSongId: q[ni], progressSec: 0, isPlaying: true });
    },
    prevSong: () => {
      const s = get();
      const q = s.queue;
      if (!q.length || !s.currentSongId) return;
      const i = q.indexOf(s.currentSongId);
      set({ currentSongId: q[(i - 1 + q.length) % q.length], progressSec: 0, isPlaying: true });
    },
    cyclePlayMode: () => {
      const cur = get().playMode;
      const next = PLAY_MODE_ORDER[(PLAY_MODE_ORDER.indexOf(cur) + 1) % PLAY_MODE_ORDER.length] as PlayMode;
      set({ playMode: next });
      return next;
    },
    toggleHeart: (songId) => set((s) => {
      const liked = s.likedSongIds.includes(songId);
      return {
        likedSongIds: liked ? s.likedSongIds.filter((x) => x !== songId) : [songId, ...s.likedSongIds],
        playlists: s.playlists.map((p) => p.isLiked
          ? { ...p, songIds: liked ? p.songIds.filter((x) => x !== songId) : [songId, ...p.songIds.filter((x) => x !== songId)] }
          : p),
      };
    }),
    removeFromQueue: (songId) => set((s) => ({ queue: s.queue.filter((x) => x !== songId) })),
    insertNext: (songIds) => set((s) => {
      if (!s.currentSongId) return { queue: [...songIds, ...s.queue] };
      const i = s.queue.indexOf(s.currentSongId);
      const rest = s.queue.filter((x) => !songIds.includes(x));
      const at = rest.indexOf(s.currentSongId);
      const out = [...rest.slice(0, at + 1), ...songIds, ...rest.slice(at + 1)];
      return { queue: out };
    }),
    enterRoam: () => {
      const s = get();
      const cur = s.currentSongId;
      const pool = s.songs
        .filter((x) => x.id !== cur)
        .sort((a, b) => {
          const sameArtist = (x: typeof a) => (s.songs.find((t) => t.id === cur)?.artistId === x.artistId ? 0 : 1);
          return sameArtist(a) - sameArtist(b);
        })
        .map((x) => x.id);
      const next = pool[0] || cur;
      if (!next) return;
      const rest = pool.filter((id) => id !== next);
      set({
        roamMode: true,
        playSource: '为你推荐的相似歌曲',
        isPlaying: true,
        currentSongId: next,
        progressSec: 0,
        queue: [next, ...rest, ...(cur ? [cur] : [])],
      });
    },
    cycleQuality: () => {
      const order = ['标准', '较高', '极高', '无损', 'Hi-Res'];
      const cur = get().quality || '极高';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      set({ quality: next });
      return next;
    },
    cyclePlaySpeed: () => {
      const order = [0.75, 1, 1.25, 1.5, 2];
      const cur = get().playSpeed || 1;
      const next = order[(order.indexOf(cur) + 1) % order.length];
      set({ playSpeed: next });
      return next;
    },
    setSleepTimer: (label) => set({ sleepTimer: label }),

    // ---------- 收藏 ----------
    toggleCollectPlaylist: (playlistId) => set((s) => {
      const has = s.collectedPlaylistIds.includes(playlistId);
      return {
        collectedPlaylistIds: has ? s.collectedPlaylistIds.filter((x) => x !== playlistId) : [playlistId, ...s.collectedPlaylistIds],
        playlists: s.playlists.map((p) => p.id === playlistId ? { ...p, collectCount: p.collectCount + (has ? -1 : 1) } : p),
      };
    }),
    toggleCollectAlbum: (albumId) => set((s) => {
      const has = s.collectedAlbumIds.includes(albumId);
      return {
        collectedAlbumIds: has ? s.collectedAlbumIds.filter((x) => x !== albumId) : [albumId, ...s.collectedAlbumIds],
        albums: s.albums.map((a) => a.id === albumId ? { ...a, collectCount: a.collectCount + (has ? -1 : 1) } : a),
      };
    }),
    createPlaylist: (title, isPrivate) => {
      const id = genId('pl');
      const coverSeeds = ['cover1', 'cover2', 'cover3', 'cover4', 'cover5', 'cover6', 'cover7', 'cover8'];
      set((s) => ({
        playlists: [
          {
            id, title, seed: coverSeeds[s.playlists.length % coverSeeds.length], creator: s.session.nick,
            desc: '', tag: isPrivate ? '隐私' : '', playCount: '0次', collectCount: 0, songIds: [], mine: true,
          },
          ...s.playlists,
        ],
      }));
      return id;
    },
    addSongToPlaylist: (playlistId, songId) => set((s) => ({
      playlists: s.playlists.map((p) => p.id === playlistId && !p.songIds.includes(songId)
        ? { ...p, songIds: [...p.songIds, songId] } : p),
    })),
    removeSongFromPlaylist: (playlistId, songId) => set((s) => ({
      playlists: s.playlists.map((p) => p.id === playlistId ? { ...p, songIds: p.songIds.filter((x) => x !== songId) } : p),
    })),

    // ---------- 关注/订阅 ----------
    toggleFollowArtist: (artistId) => set((s) => ({
      artists: s.artists.map((a) => a.id === artistId ? { ...a, followed: !a.followed } : a),
    })),
    subscribePodcast: (showId) => set((s) => {
      const has = s.subscribedShowIds.includes(showId);
      return {
        subscribedShowIds: has ? s.subscribedShowIds.filter((x) => x !== showId) : [showId, ...s.subscribedShowIds],
        podcasts: s.podcasts.map((p) => p.id === showId ? { ...p, subscribed: !has } : p),
      };
    }),

    // ---------- 评论 ----------
    toggleCommentLike: (commentId) => set((s) => ({
      comments: s.comments.map((c) => c.id === commentId
        ? { ...c, likes: c.likes + (c.liked ? -1 : 1), liked: !c.liked } : c),
    })),
    publishComment: (songId, text, parentId) => set((s) => {
      const c: Comment = {
        id: genId('c'), targetId: songId, user: s.session.nick, seed: s.session.seed,
        badges: [s.session.vip], date: '刚刚', ip: '江苏', text, likes: 0, parentId, mine: true,
      };
      return { comments: [c, ...s.comments] };
    }),
    deleteComment: (commentId) => set((s) => ({ comments: s.comments.filter((c) => c.id !== commentId) })),

    // ---------- 笔记 ----------
    toggleNoteLike: (noteId) => set((s) => ({
      notes: s.notes.map((n) => n.id === noteId
        ? { ...n, likes: n.likes + (n.liked ? -1 : 1), liked: !n.liked } : n),
    })),
    publishNoteComment: (noteId, text) => {
      if (!text.trim()) return;
      set((s) => ({
        notes: s.notes.map((n) => n.id === noteId ? { ...n, comments: n.comments + 1 } : n),
      }));
    },
    publishNote: (title, body, songId, coverSeed) => {
      const id = genId('n');
      set((s) => {
        const n: Note = {
          id, author: s.session.nick, authorId: 'me', seed: s.session.seed,
          coverSeed: coverSeed || s.songs.find((x) => x.id === (songId || s.currentSongId))?.seed || 'nc1',
          title, body, songId: songId || s.currentSongId || undefined, topic: '耳机常驻歌曲', date: '刚刚', ip: '江苏',
          likes: 0, comments: 0, shares: 0, visibility: 'fans', kind: 'rec', mine: true,
        };
        return { notes: [n, ...s.notes] };
      });
      return id;
    },
    deleteNote: (noteId) => set((s) => ({ notes: s.notes.filter((n) => n.id !== noteId) })),

    // ---------- 搜索 ----------
    submitSearch: (q) => {
      const w = q.trim();
      if (!w) return;
      set((s) => ({ searchHistory: [w, ...s.searchHistory.filter((x) => x !== w)].slice(0, 12) }));
    },
    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    // ---------- 识曲 ----------
    bumpRecognize: () => {
      const n = get().recognizeCount + 1;
      set({ recognizeCount: n });
      return n;
    },

    // ---------- 设置 ----------
    setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
  }),
);
