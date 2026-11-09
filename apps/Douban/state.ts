// apps/Douban/state.ts —— FOUNDATION 完整 store(页面簇 agent 原则上只消费、不改)。
// Zustand 纪律:组件端订阅原始数组/原始字段,用 useMemo 派生;
// 禁止在 selector 里返回新数组/新对象(pipeline §5.2 运行时崩溃类)。
import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { DOUBAN_CONFIG } from './data';
import type {
  DetailTargetType,
  DoubanActions,
  DoubanBroadcast,
  DoubanMark,
  DoubanReply,
  DoubanState,
  DoubanSubject,
  DoubanUser,
  MarkStatus,
  SubjectType,
} from './types';

const initialState: DoubanState = {
  ...JSON.parse(JSON.stringify(DOUBAN_CONFIG)),
  searchQuery: '',
  composeTitle: '',
  composeDraft: '',
  composeCtx: { kind: 'broadcast', subjectId: null },
  replyDraft: '',
  lastToast: null,
  payFlow: { orderId: null, stage: 'idle' },
  player: null,
  ranklistFilter: null,
  followedRankingIds: [],
  reviewVotes: {},
};

let seq = 0;
const newId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

/** 5子tab 详情实体的计数字段增减(broadcast/groupPost/discussion/review 同构) */
type CountField = 'likeCount' | 'repostCount' | 'collectCount' | 'replyCount' | 'giftCount';
function bumpTarget(
  s: DoubanState,
  targetType: DetailTargetType,
  targetId: string,
  field: CountField,
  delta: number,
): Partial<DoubanState> {
  const bump = <T extends { id: string } & Partial<Record<CountField, number>>>(arr: T[]): T[] =>
    arr.map((it) =>
      it.id === targetId ? { ...it, [field]: Math.max(0, (it[field] ?? 0) + delta) } : it,
    );
  if (targetType === 'broadcast') return { broadcasts: bump(s.broadcasts) };
  if (targetType === 'groupPost') return { groupPosts: bump(s.groupPosts) };
  if (targetType === 'discussion') return { discussions: bump(s.discussions) };
  if (targetType === 'review') return { reviews: bump(s.reviews) };
  if (targetType === 'comment' && field === 'likeCount') {
    return {
      comments: s.comments.map((c) =>
        c.id === targetId ? { ...c, likes: Math.max(0, c.likes + delta) } : c,
      ),
    };
  }
  // subject：仅写入 likes 记录，条目本身无 likeCount 字段
  return {};
}

/** 标记动词:按条目类型 + 状态(想看/在看/看过 · 想读/在读/读过 · 想听/在听/听过) */
const MARK_VERBS: Record<SubjectType, Record<MarkStatus, string>> = {
  movie: { wish: '想看', doing: '在看', done: '看过' },
  tv: { wish: '想看', doing: '在看', done: '看过' },
  book: { wish: '想读', doing: '在读', done: '读过' },
  music: { wish: '想听', doing: '在听', done: '听过' },
  podcast: { wish: '想听', doing: '在听', done: '听过' },
};
/** 由标记/评分合成一条动态正文:「看过《标题》 ★★★★ 短评」 */
function composeMarkText(
  subject: DoubanSubject,
  status: MarkStatus,
  rating: number | null,
  comment: string,
): string {
  const verb = (MARK_VERBS[subject.type] ?? MARK_VERBS.movie)[status];
  const stars = status !== 'wish' && rating && rating > 0 ? ` ${'★'.repeat(rating)}` : '';
  const c = comment && comment.trim() ? `  ${comment.trim()}` : '';
  return `${verb}《${subject.title}》${stars}${c}`;
}

/** 从当前标记表重算个人书影音档案，避免更新标记后主页仍显示旧统计。 */
function profileStatsFromMarks(
  subjects: DoubanSubject[],
  marks: DoubanMark[],
): DoubanUser['stats'] {
  const typeById = new Map(subjects.map((subject) => [subject.id, subject.type]));
  const stats: DoubanUser['stats'] = { movieDone: 0, bookDone: 0, musicDone: 0 };
  marks.forEach((mark) => {
    if (mark.status !== 'done') return;
    const type = typeById.get(mark.subjectId);
    if (type === 'movie' || type === 'tv') stats.movieDone += 1;
    if (type === 'book') stats.bookDone += 1;
    if (type === 'music' || type === 'podcast') stats.musicDone += 1;
  });
  return stats;
}

/** currentUser 是当前用户的主数据，同时保持 users 中的本人副本一致。 */
function syncSelfUser(
  s: DoubanState,
  patch: Partial<DoubanUser>,
): Pick<DoubanState, 'currentUser' | 'users'> {
  const currentUser = { ...s.currentUser, ...patch };
  return {
    currentUser,
    users: s.users.map((user) =>
      user.isSelf || user.id === s.currentUser.id ? { ...user, ...patch } : user,
    ),
  };
}

export const useDoubanStore = createAppStoreWithActions<DoubanState, DoubanActions>(
  manifest.id,
  initialState,
  (set) => ({
    // ---------------------------------------------------------------- 通用
    toast: (msg) => set(() => ({ lastToast: msg })),
    setRanklistFilter: (filter) => set(() => ({ ranklistFilter: filter })),
    toggleFollowRanking: (rankingId) =>
      set((s) => ({
        followedRankingIds: s.followedRankingIds.includes(rankingId)
          ? s.followedRankingIds.filter((id) => id !== rankingId)
          : [...s.followedRankingIds, rankingId],
      })),
    voteReview: (reviewId, vote) =>
      set((s) => {
        const prev = s.reviewVotes[reviewId] ?? null;
        const next = prev === vote ? null : vote;
        return {
          reviewVotes: next
            ? { ...s.reviewVotes, [reviewId]: next }
            : Object.fromEntries(Object.entries(s.reviewVotes).filter(([id]) => id !== reviewId)),
          reviews: s.reviews.map((r) => {
            if (r.id !== reviewId) return r;
            let useful = r.useful;
            let useless = r.useless;
            if (prev === 'useful') useful -= 1;
            if (prev === 'useless') useless -= 1;
            if (next === 'useful') useful += 1;
            if (next === 'useless') useless += 1;
            return { ...r, useful, useless };
          }),
        };
      }),
    setSearchQuery: (q) => set(() => ({ searchQuery: q })),
    addSearchHistory: (q) =>
      set((s) => ({
        searchHistory: [q, ...s.searchHistory.filter((h) => h !== q)].slice(0, 10),
      })),
    clearSearchHistory: () => set(() => ({ searchHistory: [] })),
    setComposeTitle: (t) => set(() => ({ composeTitle: t })),
    setComposeDraft: (text) => set(() => ({ composeDraft: text })),
    setComposeCtx: (ctx) => set(() => ({ composeCtx: ctx })),
    clearCompose: () => set(() => ({ composeTitle: '', composeDraft: '' })),
    setReplyDraft: (text) => set(() => ({ replyDraft: text })),

    // ---------------------------------------------------------------- 草稿
    saveDraft: (title, text, groupId = null) =>
      set((s) => ({
        drafts: [
          { id: newId('df'), title, text, groupId, savedAt: TimeService.now() },
          ...s.drafts,
        ],
      })),
    deleteDrafts: (ids) =>
      set((s) => ({ drafts: s.drafts.filter((d) => !ids.includes(d.id)) })),

    // ---------------------------------------------------------------- 标记/评分
    markSubject: (subjectId, status, opts) =>
      set((s) => {
        const me = s.currentUser.id;
        const patch = {
          status,
          rating: opts?.rating ?? null,
          tags: opts?.tags ?? [],
          comment: opts?.comment ?? '',
          syncToFeed: opts?.syncToFeed ?? true,
        };
        const existing = s.marks.find((m) => m.subjectId === subjectId);
        const marks = existing
          ? s.marks.map((m) =>
              m.subjectId === subjectId ? { ...m, ...patch, createdAt: TimeService.now() } : m,
            )
          : [
              { id: newId('mk'), subjectId, ...patch, createdAt: TimeService.now() } as DoubanMark,
              ...s.marks,
            ];

        // 同步到动态:根据 syncToFeed 对「标记/评分」广播做 upsert(再次标记更新同一条,取消勾选则移除)
        const subject = s.subjects.find((x) => x.id === subjectId);
        const prevFeed = s.broadcasts.find((b) => b.authorId === me && b.fromMarkSubjectId === subjectId);
        let broadcasts = s.broadcasts;
        if (patch.syncToFeed && subject) {
          const text = composeMarkText(subject, status, patch.rating, patch.comment);
          if (prevFeed) {
            broadcasts = s.broadcasts.map((b) =>
              b.id === prevFeed.id
                ? { ...b, text, subjectCard: subjectId, createdAt: TimeService.now() }
                : b,
            );
          } else {
            const feed: DoubanBroadcast = {
              id: newId('b'),
              authorId: me,
              text,
              images: [],
              topicId: null,
              subjectCard: subjectId,
              likeCount: 0,
              repostCount: 0,
              collectCount: 0,
              replyCount: 0,
              giftCount: 0,
              createdAt: TimeService.now(),
              ipLocation: s.currentUser.ipLocation,
              fromMarkSubjectId: subjectId,
            };
            broadcasts = [feed, ...s.broadcasts];
          }
        } else if (!patch.syncToFeed && prevFeed) {
          broadcasts = s.broadcasts.filter((b) => b.id !== prevFeed.id);
        }
        return {
          marks,
          broadcasts,
          ...syncSelfUser(s, { stats: profileStatsFromMarks(s.subjects, marks) }),
        };
      }),
    unmarkSubject: (subjectId) =>
      set((s) => {
        const marks = s.marks.filter((m) => m.subjectId !== subjectId);
        return {
          marks,
          // 连带移除该标记同步出的动态
          broadcasts: s.broadcasts.filter(
            (b) => !(b.authorId === s.currentUser.id && b.fromMarkSubjectId === subjectId),
          ),
          ...syncSelfUser(s, { stats: profileStatsFromMarks(s.subjects, marks) }),
        };
      }),

    // ---------------------------------------------------------------- 详情互动(DetailFive)
    toggleLike: (targetType, targetId) =>
      set((s) => {
        const me = s.currentUser.id;
        const existing = s.likes.find(
          (l) => l.targetType === targetType && l.targetId === targetId && l.userId === me,
        );
        if (existing) {
          return {
            likes: s.likes.filter((l) => l.id !== existing.id),
            ...bumpTarget(s, targetType, targetId, 'likeCount', -1),
          };
        }
        return {
          likes: [
            { id: newId('lk'), targetType, targetId, userId: me, createdAt: TimeService.now() },
            ...s.likes,
          ],
          ...bumpTarget(s, targetType, targetId, 'likeCount', 1),
        };
      }),

    repostTarget: (targetType, targetId, comment) =>
      set((s) => {
        const bcId = newId('b');
        const repostFeed: DoubanBroadcast = {
          id: bcId,
          authorId: s.currentUser.id,
          text: comment,
          images: [],
          topicId: null,
          subjectCard: null,
          likeCount: 0,
          repostCount: 0,
          collectCount: 0,
          replyCount: 0,
          giftCount: 0,
          createdAt: TimeService.now(),
          ipLocation: s.currentUser.ipLocation,
          isRepost: true,
          origType: targetType,
          origId: targetId,
        };
        // 先算目标计数+1;若目标本身是广播,bumpTarget 会返回 { broadcasts },
        // 必须在其之后再挂载转发动态,否则会被覆盖丢失(转发广播时动态不显示的根因)。
        const bumped = bumpTarget(s, targetType, targetId, 'repostCount', 1);
        return {
          reposts: [
            {
              id: newId('rp'),
              targetType,
              targetId,
              userId: s.currentUser.id,
              comment,
              createdAt: TimeService.now(),
              broadcastId: bcId,
            },
            ...s.reposts,
          ],
          ...bumped,
          broadcasts: [repostFeed, ...(bumped.broadcasts ?? s.broadcasts)],
        };
      }),

    collectTarget: (targetType, targetId, doulistId) =>
      set((s) => {
        const me = s.currentUser.id;
        if (
          s.collects.some(
            (c) =>
              c.targetType === targetType &&
              c.targetId === targetId &&
              c.userId === me &&
              c.doulistId === doulistId,
          )
        ) {
          return {};
        }
        return {
          collects: [
            {
              id: newId('cl'),
              targetType,
              targetId,
              userId: me,
              doulistId,
              createdAt: TimeService.now(),
            },
            ...s.collects,
          ],
          collections: [
            {
              id: newId('cn'),
              kind: 'content' as const,
              refType: targetType,
              refId: targetId,
              createdAt: TimeService.now(),
            },
            ...s.collections,
          ],
          doulists: s.doulists.map((d) =>
            d.id === doulistId
              ? {
                  ...d,
                  items: [{
                    kind: (
                      targetType === 'review' ? 'review'
                      : targetType === 'groupPost' ? 'groupPost'
                      : targetType === 'subject' || targetType === 'comment' ? 'subject'
                      : 'broadcast'
                    ) as 'broadcast' | 'review' | 'groupPost' | 'subject',
                    refId: targetId,
                  }, ...d.items],
                }
              : d,
          ),
          ...bumpTarget(s, targetType, targetId, 'collectCount', 1),
        };
      }),

    uncollectTarget: (targetType, targetId, doulistId) =>
      set((s) => {
        const me = s.currentUser.id;
        const rec = s.collects.find(
          (c) =>
            c.targetType === targetType &&
            c.targetId === targetId &&
            c.userId === me &&
            c.doulistId === doulistId,
        );
        if (!rec) return {};
        return {
          collects: s.collects.filter((c) => c.id !== rec.id),
          collections: (() => {
            const col = s.collections.find((c) => c.refId === targetId && c.kind === 'content');
            return col ? s.collections.filter((c) => c.id !== col.id) : s.collections;
          })(),
          doulists: s.doulists.map((d) =>
            d.id === doulistId
              ? { ...d, items: d.items.filter((it) => it.refId !== targetId) }
              : d,
          ),
          ...bumpTarget(s, targetType, targetId, 'collectCount', -1),
        };
      }),

    sendGift: (targetType, targetId, giftId) =>
      set((s) => ({
        gifts: [
          {
            id: newId('gf'),
            targetType,
            targetId,
            userId: s.currentUser.id,
            giftId,
            note: '',
            createdAt: TimeService.now(),
          },
          ...s.gifts,
        ],
        ...(targetType === 'user' ? {} : bumpTarget(s, targetType, targetId, 'giftCount', 1)),
      })),
    rechargeDoumi: (amount) =>
      set((s) => syncSelfUser(s, { doumi: (s.currentUser.doumi ?? 0) + amount })),

    addReply: (targetType, targetId, text, opts) =>
      set((s) => {
        const now = TimeService.now();
        const reply: DoubanReply = {
          id: newId('r'),
          targetType,
          targetId,
          authorId: s.currentUser.id,
          text,
          images: opts?.images ?? [],
          likeCount: 0,
          createdAt: now,
          ipLocation: s.currentUser.ipLocation,
          quoteReplyId: opts?.quoteReplyId ?? null,
          deleted: false,
        };
        const base = {
          replies: [...s.replies, reply],
          replyDraft: '',
          ...bumpTarget(s, targetType, targetId, 'replyCount', 1),
        };
        // 「转发到动态」未勾选:只加回复
        if (!opts?.syncToFeed) return base;
        // 勾选了「转发到动态」:同时把被回复的内容转发到我的动态(生成一条转发动态 + 转发记录)
        const bcId = newId('b');
        const repostFeed: DoubanBroadcast = {
          id: bcId,
          authorId: s.currentUser.id,
          text,
          images: [],
          topicId: null,
          subjectCard: null,
          likeCount: 0,
          repostCount: 0,
          collectCount: 0,
          replyCount: 0,
          giftCount: 0,
          createdAt: now,
          ipLocation: s.currentUser.ipLocation,
          isRepost: true,
          origType: targetType,
          origId: targetId,
        };
        // 先在「回复数已 +1」的状态上继续计算「转发数 +1」，否则广播作为
        // 被回复目标时，两次基于旧数组的更新会互相覆盖。
        const repliedState = { ...s, ...base } as DoubanState;
        const repostBumped = bumpTarget(
          repliedState,
          targetType,
          targetId,
          'repostCount',
          1,
        );
        const baseBroadcasts = repostBumped.broadcasts ?? repliedState.broadcasts;
        return {
          ...base,
          ...repostBumped,
          broadcasts: [repostFeed, ...baseBroadcasts],
          reposts: [
            { id: newId('rp'), targetType, targetId, userId: s.currentUser.id, comment: text, createdAt: now, broadcastId: bcId },
            ...s.reposts,
          ],
        };
      }),

    deleteReply: (replyId) =>
      set((s) => {
        const target = s.replies.find((r) => r.id === replyId);
        if (!target || target.deleted) return {};
        return {
          replies: s.replies.map((r) => (r.id === replyId ? { ...r, deleted: true } : r)),
          ...bumpTarget(s, target.targetType, target.targetId, 'replyCount', -1),
        };
      }),

    // ---------------------------------------------------------------- 豆列
    createDoulist: (title, intro, isPrivate) =>
      set((s) => ({
        doulists: [
          {
            id: newId('dl'),
            ownerId: s.currentUser.id,
            title,
            cover: '',
            intro,
            isPrivate,
            items: [],
            doneCount: 0,
            createdAt: TimeService.now(),
            kindLabel: '豆列' as const,
          },
          ...s.doulists,
        ],
      })),

    // ---------------------------------------------------------------- 关注
    followUser: (userId) =>
      set((s) =>
        s.follows.users.includes(userId)
          ? {}
          : {
              follows: { ...s.follows, users: [userId, ...s.follows.users] },
              ...syncSelfUser(s, { following: s.currentUser.following + 1 }),
            },
      ),
    unfollowUser: (userId) =>
      set((s) =>
        s.follows.users.includes(userId)
          ? {
              follows: { ...s.follows, users: s.follows.users.filter((u) => u !== userId) },
              ...syncSelfUser(s, {
                following: Math.max(0, s.currentUser.following - 1),
              }),
            }
          : {},
      ),
    toggleFollowCelebrity: (celebrityId) =>
      set((s) => ({
        follows: {
          ...s.follows,
          celebrities: s.follows.celebrities.includes(celebrityId)
            ? s.follows.celebrities.filter((c) => c !== celebrityId)
            : [celebrityId, ...s.follows.celebrities],
        },
      })),
    toggleFollowTopic: (topicId) =>
      set((s) => ({
        follows: {
          ...s.follows,
          topics: s.follows.topics.includes(topicId)
            ? s.follows.topics.filter((t) => t !== topicId)
            : [topicId, ...s.follows.topics],
        },
      })),
    toggleFollowDoulist: (doulistId) =>
      set((s) => ({
        follows: {
          ...s.follows,
          doulists: s.follows.doulists.includes(doulistId)
            ? s.follows.doulists.filter((d) => d !== doulistId)
            : [doulistId, ...s.follows.doulists],
        },
      })),
    toggleFollowGroup: (groupId) =>
      set((s) => ({
        groups: s.groups.map((g) => (g.id === groupId ? { ...g, followed: !g.followed } : g)),
      })),

    // ---------------------------------------------------------------- 小组
    joinGroupDirect: (groupId) =>
      set((s) => ({
        groups: s.groups.map((g) =>
          g.id === groupId && !g.joined ? { ...g, joined: true, members: g.members + 1 } : g,
        ),
      })),
    applyGroup: (groupId, _reason) =>
      set((s) => ({
        groups: s.groups.map((g) =>
          g.id === groupId ? { ...g, applyStatus: 'applied' as const, followed: true } : g,
        ),
      })),
    submitGroupQuiz: (groupId, passed) =>
      set((s) => ({
        groups: s.groups.map((g) => {
          if (g.id !== groupId) return g;
          if (passed) return { ...g, joined: true, members: g.members + 1 };
          return { ...g, quizAttempts: g.quizAttempts + 1 };
        }),
      })),
    quitGroup: (groupId) =>
      set((s) => ({
        groups: s.groups.map((g) =>
          g.id === groupId && g.joined
            ? { ...g, joined: false, members: Math.max(0, g.members - 1) }
            : g,
        ),
      })),
    deleteGroupPost: (postId) =>
      set((s) => ({ groupPosts: s.groupPosts.filter((p) => p.id !== postId) })),
    detachGroupPost: (postId) =>
      set((s) => ({
        groupPosts: s.groupPosts.map((p) => (p.id === postId ? { ...p, groupId: null } : p)),
      })),

    // ---------------------------------------------------------------- 发布
    publishBroadcast: (text, opts) =>
      set((s) => {
        const bc: DoubanBroadcast = {
          id: newId('b'),
          authorId: s.currentUser.id,
          text,
          images: opts?.images ?? [],
          topicId: opts?.topicId ?? null,
          subjectCard: opts?.subjectCard ?? null,
          likeCount: 0,
          repostCount: 0,
          collectCount: 0,
          replyCount: 0,
          giftCount: 0,
          createdAt: TimeService.now(),
          ipLocation: s.currentUser.ipLocation,
        };
        return { broadcasts: [bc, ...s.broadcasts], composeTitle: '', composeDraft: '' };
      }),
    publishGroupPost: (groupId, title, content, opts) =>
      set((s) => ({
        groupPosts: [
          {
            id: newId('gp'),
            groupId,
            tab: opts?.tab ?? '',
            authorId: s.currentUser.id,
            title,
            content,
            images: opts?.images ?? [],
            replyCount: 0,
            likeCount: 0,
            repostCount: 0,
            collectCount: 0,
            giftCount: 0,
            createdAt: TimeService.now(),
            updatedAt: TimeService.now(),
          },
          ...s.groupPosts,
        ],
        composeTitle: '',
        composeDraft: '',
      })),

    // 条目内容发布:短评→comments / 影评·剧评→reviews / 讨论→discussions(评分带上我的标记评分)
    publishSubjectContent: (kind, subjectId, title, text) =>
      set((s) => {
        const me = s.currentUser.id;
        const now = TimeService.now();
        const myRating = s.marks.find((m) => m.subjectId === subjectId)?.rating ?? null;
        const cleared = { composeTitle: '', composeDraft: '' };
        if (kind === 'comment') {
          return {
            comments: [
              { id: newId('c'), subjectId, authorId: me, rating: myRating, text, likes: 0, createdAt: now, ipLocation: s.currentUser.ipLocation },
              ...s.comments,
            ],
            ...cleared,
          };
        }
        if (kind === 'review') {
          return {
            reviews: [
              { id: newId('rv'), subjectId, authorId: me, title: title || text.slice(0, 20), text, rating: myRating ?? 0, useful: 0, useless: 0, replyCount: 0, likeCount: 0, repostCount: 0, collectCount: 0, giftCount: 0, createdAt: now, ipLocation: s.currentUser.ipLocation },
              ...s.reviews,
            ],
            ...cleared,
          };
        }
        return {
          discussions: [
            { id: newId('d'), subjectId, authorId: me, title: title || text.slice(0, 20), content: text, replyCount: 0, likeCount: 0, repostCount: 0, collectCount: 0, giftCount: 0, createdAt: now },
            ...s.discussions,
          ],
          ...cleared,
        };
      }),

    // ---------------------------------------------------------------- 消息
    sendMessage: (peerId, text) =>
      set((s) => ({
        messages: [
          ...s.messages,
          { id: newId('msg'), peerId, fromSelf: true, text, createdAt: TimeService.now() },
        ],
      })),
    markNotificationsRead: () =>
      set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

    // ---------------------------------------------------------------- 市集
    addToCart: (productId, sku, count = 1) =>
      set((s) => {
        const item = s.cart.find((c) => c.productId === productId && c.sku === sku);
        if (item) {
          return {
            cart: s.cart.map((c) => (c.id === item.id ? { ...c, count: c.count + count } : c)),
          };
        }
        return {
          cart: [...s.cart, { id: newId('ct'), productId, sku, count, checked: true }],
        };
      }),
    beginDirectBuy: (productId, sku, count = 1) =>
      set((s) => {
        const rest = s.cart.map((c) => ({ ...c, checked: false }));
        const idx = rest.findIndex((c) => c.productId === productId && c.sku === sku);
        if (idx >= 0) {
          return { cart: rest.map((c, i) => (i === idx ? { ...c, count, checked: true } : c)) };
        }
        return { cart: [...rest, { id: newId('ct'), productId, sku, count, checked: true }] };
      }),
    setCartItemCount: (cartItemId, count) =>
      set((s) => ({
        cart:
          count <= 0
            ? s.cart.filter((c) => c.id !== cartItemId)
            : s.cart.map((c) => (c.id === cartItemId ? { ...c, count } : c)),
      })),
    removeCartItems: (ids) =>
      set((s) => ({ cart: s.cart.filter((c) => !ids.includes(c.id)) })),
    toggleCartItemChecked: (id) =>
      set((s) => ({
        cart: s.cart.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
      })),
    addAddress: (addr) =>
      set((s) => ({
        addresses: [
          ...s.addresses,
          { id: newId('ad'), ...addr, isDefault: s.addresses.length === 0 },
        ],
      })),
    redeemCoupon: (couponId) =>
      set((s) => ({
        coupons: s.coupons.map((c) => (c.id === couponId ? { ...c, owned: true } : c)),
      })),
    submitOrder: (addressId, couponId = null) =>
      set((s) => {
        const checked = s.cart.filter((c) => c.checked);
        const src = checked.map((c) => {
          const p = s.products.find((pp) => pp.id === c.productId);
          return { productId: c.productId, sku: c.sku, count: c.count, price: p?.price ?? 0, freight: p?.freight ?? 0 };
        });
        if (src.length === 0) return {};
        const items = src.map(({ productId, sku, count, price }) => ({ productId, sku, count, price }));
        const freight = Math.max(...src.map((it) => it.freight), 0);
        const amount = items.reduce((sum, it) => sum + it.price * it.count, 0) + freight;
        const order = {
          id: newId('o'),
          items,
          amount,
          freight,
          status: 'unpaid' as const,
          createdAt: TimeService.now(),
          addressId,
          couponId,
        };
        return {
          orders: [order, ...s.orders],
          cart: s.cart.filter((c) => !c.checked),
          payFlow: { orderId: order.id, stage: 'verifying' as const },
        };
      }),
    payVerifyFail: () =>
      set((s) =>
        s.payFlow.stage === 'verifying' ? { payFlow: { ...s.payFlow, stage: 'failed' } } : {},
      ),
    repayOrder: (orderId) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId && o.status === 'unpaid' ? { ...o, status: 'toShip' as const } : o,
        ),
        payFlow: { orderId, stage: 'success' as const },
      })),
    cancelOrder: (orderId) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId && o.status === 'unpaid' ? { ...o, status: 'closed' as const } : o,
        ),
      })),
    closePayFlow: () => set(() => ({ payFlow: { orderId: null, stage: 'idle' } })),

    // ---------------------------------------------------------------- 豆瓣时间/播放器
    checkinToday: () =>
      set((s) => ({
        checkin: {
          ...s.checkin,
          streak: s.checkin.streak + 1,
          total: s.checkin.total + 1,
          lastCheckinAt: TimeService.now(),
        },
      })),
    togglePodcastSubscription: (showSubjectId) =>
      set((s) => ({
        podcastSubscriptions: s.podcastSubscriptions.includes(showSubjectId)
          ? s.podcastSubscriptions.filter((p) => p !== showSubjectId)
          : [showSubjectId, ...s.podcastSubscriptions],
      })),
    startPlayer: (player) => set(() => ({ player })),
    togglePlayer: () =>
      set((s) => (s.player ? { player: { ...s.player, playing: !s.player.playing } } : {})),
    closePlayer: () => set(() => ({ player: null })),

    // ---------------------------------------------------------------- 历史/设置/资料
    addHistory: (kind, refId) =>
      set((s) => ({
        history: [
          { id: newId('h'), kind, refId, viewedAt: TimeService.now() },
          ...s.history.filter((h) => !(h.kind === kind && h.refId === refId)),
        ],
      })),
    clearHistory: (ids) =>
      set((s) => ({
        history: ids ? s.history.filter((h) => !ids.includes(h.id)) : [],
      })),
    updateSettings: (section, patch) =>
      set((s) => ({
        settings: { ...s.settings, [section]: { ...s.settings[section], ...patch } },
      })),
    updateProfile: (patch) =>
      set((s) => syncSelfUser(s, patch)),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<DoubanState>;
    },
  },
);
