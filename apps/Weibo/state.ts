import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { WEIBO_CONFIG } from './data';
import type {
  WeiboState, WeiboActions, WbComment, WbStatus, WbChat, WbDraft,
} from './types';

const initialState: WeiboState = JSON.parse(JSON.stringify(WEIBO_CONFIG));
initialState.taskAudit ??= {};

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

const newComment = (text: string, replyTo?: string): WbComment => ({
  id: genId('c_my'),
  userId: 'me',
  text,
  timestamp: TimeService.now(),
  region: '来自江苏',
  likes: 0,
  replies: [],
  ...(replyTo ? { replyTo } : {}),
});

/** 在评论树里切换点赞(顶层或嵌套一层) */
function toggleCommentLike(list: WbComment[], commentId: string): WbComment[] {
  return list.map((c) => {
    if (c.id === commentId) {
      return { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) };
    }
    if (c.replies.some((r) => r.id === commentId)) {
      return { ...c, replies: toggleCommentLike(c.replies, commentId) };
    }
    return c;
  });
}

export const useWeiboStore = createAppStoreWithActions<WeiboState, WeiboActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    // ---------- 登录 ----------
    login: () => set((s) => ({ session: { ...s.session, loggedIn: true } })),
    logout: () => set((s) => ({ session: { ...s.session, loggedIn: false } })),

    // ---------- 博文互动 ----------
    toggleLikeStatus: (statusId) =>
      set((s) => {
        const liked = s.likedStatusIds.includes(statusId);
        return {
          likedStatusIds: liked
            ? s.likedStatusIds.filter((id) => id !== statusId)
            : [...s.likedStatusIds, statusId],
          statuses: s.statuses.map((st) =>
            st.id === statusId
              ? { ...st, likedByMe: !liked, likes: st.likes + (liked ? -1 : 1) }
              : st,
          ),
        };
      }),

    toggleFavorite: (statusId) =>
      set((s) => {
        const fav = s.favorites.includes(statusId);
        return {
          favorites: fav ? s.favorites.filter((id) => id !== statusId) : [...s.favorites, statusId],
          statuses: s.statuses.map((st) =>
            st.id === statusId ? { ...st, favoritedByMe: !fav } : st,
          ),
        };
      }),

    toggleLikeComment: (statusId, commentId) =>
      set((s) => ({
        statuses: s.statuses.map((st) =>
          st.id === statusId
            ? { ...st, commentList: toggleCommentLike(st.commentList, commentId) }
            : st,
        ),
      })),

    addComment: (statusId, text, replyToCommentId, alsoRepost) =>
      set((s) => {
        const st = s.statuses.find((x) => x.id === statusId);
        if (!st || !text.trim()) return {};
        let commentList: WbComment[];
        if (replyToCommentId) {
          commentList = st.commentList.map((c) => {
            const isTarget = c.id === replyToCommentId;
            const inReplies = c.replies.some((r) => r.id === replyToCommentId);
            if (!isTarget && !inReplies) return c;
            const parentUser = s.users.find((u) => u.id === (isTarget ? c.userId : c.replies.find((r) => r.id === replyToCommentId)?.userId));
            return { ...c, replies: [newComment(text, parentUser?.name), ...c.replies] };
          });
        } else {
          commentList = [newComment(text), ...st.commentList];
        }
        const statuses = s.statuses.map((x) =>
          x.id === statusId ? { ...x, commentList, comments: x.comments + 1 } : x,
        );
        if (alsoRepost) {
          const repost: WbStatus = {
            id: genId('s_rp'), userId: 'me', text, timestamp: TimeService.now(),
            source: 'vivo X100s', images: [], reposts: 0, comments: 0, likes: 0,
            repostOf: statusId, commentList: [], fromFollow: true,
          };
          return {
            statuses: [repost, ...statuses.map((x) => (x.id === statusId ? { ...x, reposts: x.reposts + 1 } : x))],
            myPostIds: [repost.id, ...s.myPostIds],
          };
        }
        return { statuses };
      }),

    submitRepost: (statusId, text, alsoComment) =>
      set((s) => {
        const repost: WbStatus = {
          id: genId('s_rp'), userId: 'me', text: text || '转发微博', timestamp: TimeService.now(),
          source: 'vivo X100s', images: [], reposts: 0, comments: 0, likes: 0,
          repostOf: statusId, commentList: [], fromFollow: true,
        };
        let statuses = s.statuses.map((x) =>
          x.id === statusId ? { ...x, reposts: x.reposts + 1 } : x,
        );
        if (alsoComment && text.trim()) {
          statuses = statuses.map((x) =>
            x.id === statusId
              ? { ...x, comments: x.comments + 1, commentList: [newComment(text), ...x.commentList] }
              : x,
          );
        }
        return { statuses: [repost, ...statuses], myPostIds: [repost.id, ...s.myPostIds] };
      }),

    publishStatus: ({ text, images, visibility, location, supertopicId }) =>
      set((s) => {
        const post: WbStatus = {
          id: genId('s_my'), userId: 'me',
          text: location ? `${text} 📍${location}` : text,
          timestamp: TimeService.now(), source: 'vivo X100s',
          images, reposts: 0, comments: 0, likes: 0,
          visibility: visibility as WbStatus['visibility'],
          channel: '热门', fromFollow: true, commentList: [],
          ...(supertopicId ? { supertopicId } : {}),
        };
        return {
          statuses: [post, ...s.statuses],
          myPostIds: [post.id, ...s.myPostIds],
          me: { ...s.me, fans: s.me.fans },
        };
      }),

    saveDraft: (d) =>
      set((s) => {
        const draft: WbDraft = { id: genId('d'), ...d, timestamp: TimeService.now() };
        return { drafts: [draft, ...s.drafts] };
      }),

    deleteDraft: (draftId) =>
      set((s) => ({ drafts: s.drafts.filter((d) => d.id !== draftId) })),

    // ---------- 关注 ----------
    followUser: (userId) =>
      set((s) => ({
        users: s.users.map((u) =>
          u.id === userId ? { ...u, followedByMe: true, fans: u.fans + 1 } : u,
        ),
        me: { ...s.me, follows: s.me.follows + 1 },
      })),

    unfollowUser: (userId) =>
      set((s) => ({
        users: s.users.map((u) =>
          u.id === userId ? { ...u, followedByMe: false, fans: Math.max(0, u.fans - 1) } : u,
        ),
        me: { ...s.me, follows: Math.max(0, s.me.follows - 1) },
      })),

    // ---------- 超话 ----------
    followSupertopic: (stId) =>
      set((s) => ({
        supertopics: s.supertopics.map((t) =>
          t.id === stId ? { ...t, followed: !t.followed, fans: t.fans + (t.followed ? -1 : 1) } : t,
        ),
      })),

    signSupertopic: (stId) =>
      set((s) => ({
        supertopics: s.supertopics.map((t) =>
          t.id === stId && !t.signedToday
            ? { ...t, signedToday: true, signStreak: t.signStreak + 1, todaySigned: t.todaySigned + 1 }
            : t,
        ),
      })),

    signAllSupertopics: () =>
      set((s) => ({
        supertopics: s.supertopics.map((t) =>
          t.followed && !t.signedToday
            ? { ...t, signedToday: true, signStreak: t.signStreak + 1, todaySigned: t.todaySigned + 1 }
            : t,
        ),
      })),

    postToSupertopic: (stId, text, syncWeibo) =>
      set((s) => {
        const st = s.supertopics.find((t) => t.id === stId);
        const post: WbStatus = {
          id: genId('s_st'), userId: 'me',
          text: `◇${st?.name ?? '超话'} ${text}`,
          timestamp: TimeService.now(), source: 'vivo X100s',
          images: [], reposts: 0, comments: 0, likes: 0,
          supertopicId: stId, commentList: [], fromFollow: syncWeibo,
        };
        return {
          statuses: [post, ...s.statuses],
          supertopics: s.supertopics.map((t) => (t.id === stId ? { ...t, posts: t.posts + 1 } : t)),
          ...(syncWeibo ? { myPostIds: [post.id, ...s.myPostIds] } : {}),
        };
      }),

    // ---------- 消息 ----------
    sendChatMessage: (chatId, text) =>
      set((s) => {
        const msg = { id: genId('m'), fromMe: true, text, timestamp: TimeService.now() };
        const target = s.chats.find((c) => c.id === chatId);
        if (!target) return {};
        const updated = { ...target, messages: [...target.messages, msg], summary: text, timestamp: msg.timestamp };
        return { chats: [updated, ...s.chats.filter((c) => c.id !== chatId)] };
      }),

    openChatWith: (userId) =>
      set((s) => {
        if (s.chats.some((c) => c.id === userId)) return {};
        const u = s.users.find((x) => x.id === userId);
        if (!u) return {};
        const chat: WbChat = {
          id: userId, name: u.name, avatar: u.avatar,
          ...(u.verified ? { verified: u.verified } : {}),
          summary: '', timestamp: TimeService.now(), unread: 0,
          stranger: !u.followedByMe && !u.followsMe,
          messages: [],
        };
        return { chats: [chat, ...s.chats] };
      }),

    markChatRead: (chatId) =>
      set((s) => {
        const target = s.chats.find((c) => c.id === chatId);
        if (!target || target.unread === 0) return {};
        return {
          chats: s.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)),
          unreadTotal: Math.max(0, s.unreadTotal - target.unread),
        };
      }),

    clearAllUnread: () =>
      set((s) => ({
        chats: s.chats.map((c) => ({ ...c, unread: 0 })),
        unreadTotal: 0,
      })),

    // ---------- 搜索 ----------
    submitSearch: (q) => {
      const word = q.trim();
      if (!word) return;
      set((s) => ({
        searchHistory: [word, ...s.searchHistory.filter((w) => w !== word)].slice(0, 10),
      }));
    },

    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    removeDeletedLike: (statusId) =>
      set((s) => ({ likedStatusIds: s.likedStatusIds.filter((id) => id !== statusId) })),

    refreshFeed: () =>
      set((s) => ({
        // 洗牌推荐流首屏顺序,模拟「热门微博已更新」
        statuses: [...s.statuses.slice(1), s.statuses[0]].filter(Boolean) as WbStatus[],
      })),

    // ---------- 设置(隐私/屏蔽/通用,持久化)----------
    setSetting: (key, value) =>
      set((s) => ({ settings: { ...s.settings, [key]: value } })),

    removeBlockedWord: (word) =>
      set((s) => ({ settings: { ...s.settings, blockedWords: s.settings.blockedWords.filter((w) => w !== word) } })),

    removeBlockedUser: (userId) =>
      set((s) => ({ settings: { ...s.settings, blockedUsers: s.settings.blockedUsers.filter((u) => u !== userId) } })),
    recordRealtimeSearch: (query, sort) =>
      set((s) => ({ taskAudit: { ...s.taskAudit, realtimeSearch: { query, sort } } })),
    recordNoticeViewed: (type) =>
      set((s) => ({ taskAudit: { ...s.taskAudit, viewedNoticeType: type } })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const { _temp, ...rest } = state as WeiboState & Partial<WeiboActions>;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<WeiboState>;
    },
  },
);
