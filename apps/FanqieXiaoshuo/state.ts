import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import {
  DATA_VERSION, DAY_THEME_IDX, FONT_SIZE_MAX, FONT_SIZE_MIN, NIGHT_THEME_IDX, READER_THEMES,
} from './constants';
import { FANQIE_CONFIG } from './data';
import type { FanqieActions, FanqieState } from './types';

const initialState: FanqieState = JSON.parse(JSON.stringify(FANQIE_CONFIG));
initialState.taskAudit = {};

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

export const useFanqieStore = createAppStoreWithActions<FanqieState, FanqieActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    recordTaskAudit: (patch) => set((s) => ({ taskAudit: { ...s.taskAudit, ...patch } })),
    // ---------- 搜索 ----------
    addSearchHistory: (word) => {
      const w = word.trim();
      if (!w) return;
      set((s) => ({
        searchHistory: [w, ...s.searchHistory.filter((x) => x !== w)].slice(0, 10),
      }));
    },
    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    // ---------- 书架 ----------
    addToShelf: (bookId) => {
      set((s) => (s.shelf.some((e) => e.bookId === bookId)
        ? {}
        : { shelf: [{ bookId, chapterIdx: s.progress[bookId] ?? 0, addedAt: TimeService.now() }, ...s.shelf] }));
    },
    removeFromShelf: (bookIds) => {
      // 删除后浏览历史保留(spec shelf.edit.delete)
      set((s) => ({ shelf: s.shelf.filter((e) => !bookIds.includes(e.bookId)) }));
    },

    // ---------- 历史/进度 ----------
    recordHistory: (bookId, chapterIdx) => {
      set((s) => ({
        history: [
          { bookId, chapterIdx, viewedAt: TimeService.now() },
          ...s.history.filter((h) => h.bookId !== bookId),
        ].slice(0, 50),
      }));
    },
    saveProgress: (bookId, chapterIdx) => {
      set((s) => ({
        progress: { ...s.progress, [bookId]: chapterIdx },
        shelf: s.shelf.map((e) => (e.bookId === bookId ? { ...e, chapterIdx } : e)),
      }));
    },

    // ---------- 阅读器设置 ----------
    setFontSize: (delta) => {
      set((s) => ({
        readerSettings: {
          ...s.readerSettings,
          fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, s.readerSettings.fontSize + delta)),
        },
      }));
    },
    setTheme: (idx) => {
      const clamped = Math.min(READER_THEMES.length - 1, Math.max(0, idx));
      set((s) => ({ readerSettings: { ...s.readerSettings, themeIdx: clamped } }));
    },
    // 夜间模式只有这一处真源:阅读器工具栏和「我的」右上角月亮都走这里(走查轮3 #2)
    setNightMode: (on) => {
      set((s) => {
        const isNight = READER_THEMES[s.readerSettings.themeIdx]?.night ?? false;
        if (isNight === on) return {};
        return {
          readerSettings: {
            ...s.readerSettings,
            themeIdx: on ? NIGHT_THEME_IDX : DAY_THEME_IDX,
          },
        };
      });
    },
    setPageMode: (mode) => {
      set((s) => ({ readerSettings: { ...s.readerSettings, pageMode: mode } }));
    },

    // ---------- 书评 ----------
    submitReview: (bookId, stars, text, topic) => {
      const me = get().user;
      set((s) => ({
        reviews: [
          {
            id: genId('rv'), bookId, userId: me.id, stars,
            text: text.trim() || '好看!', topic, timestamp: TimeService.now(), likes: 0,
            readNote: '阅读不足30分钟后点评', mine: true,
          },
          ...s.reviews.filter((r) => !(r.bookId === bookId && r.mine)),
        ],
      }));
    },
    toggleReviewLike: (reviewId) => {
      set((s) => {
        const liked = s.likedReviews.includes(reviewId);
        return {
          likedReviews: liked ? s.likedReviews.filter((x) => x !== reviewId) : [...s.likedReviews, reviewId],
          reviews: s.reviews.map((r) => (r.id === reviewId ? { ...r, likes: Math.max(0, r.likes + (liked ? -1 : 1)) } : r)),
        };
      });
    },

    // ---------- 作者 ----------
    toggleFollowAuthor: (authorId) => {
      set((s) => ({
        followedAuthors: s.followedAuthors.includes(authorId)
          ? s.followedAuthors.filter((x) => x !== authorId)
          : [...s.followedAuthors, authorId],
      }));
    },

    // ---------- 福利/金币 ----------
    doSignin: () => {
      if (get().signinDone) return;
      set((s) => ({
        signinDone: true,
        coins: s.coins + 3828,
        coinRecords: [{ title: '签到', timestamp: TimeService.now(), delta: 3828 }, ...s.coinRecords],
        welfareTasks: (() => {
          const done = s.welfareTasks.map((t) => (t.isSignin ? { ...t, done: true, title: '明日签到', btn: '已完成' } : t));
          // 已完成签到项沉底(r6@16 帧证)
          return [...done.filter((t) => !t.isSignin), ...done.filter((t) => t.isSignin)];
        })(),
      }));
    },
    creditReadingCoins: (coins) => {
      set((s) => ({
        coins: s.coins + coins,
        coinRecords: [{ title: '阅读奖励', timestamp: TimeService.now(), delta: coins }, ...s.coinRecords].slice(0, 30),
      }));
    },
    addReadMinutes: (mins) => {
      set((s) => ({ todayReadMinutes: s.todayReadMinutes + mins }));
    },

    // ---------- 系统能力回写 ----------
    // 实体书购买:走 __OS__ 收银台(ACTION_PAY),支付 App 回 OK 才落这一条
    markBookPurchased: (bookId) => {
      set((s) => (s.purchasedBooks.includes(bookId)
        ? {}
        : { purchasedBooks: [bookId, ...s.purchasedBooks] }));
    },
    // 头像:系统相册选图(albumBridge.pickImages)返回的 uri/path
    setAvatar: (uri) => {
      if (!uri) return;
      set((s) => ({ user: { ...s.user, avatar: uri } }));
    },
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<FanqieState>;
    },
  },
);
