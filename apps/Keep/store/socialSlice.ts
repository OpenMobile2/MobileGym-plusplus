// apps/Keep/store/socialSlice.ts —— Social 域 actions(簇C:发现feed/社区/动态详情/发布动态)
import * as TimeService from '@/os/TimeService';
import type { KeepSet, KeepGet, KeepComment, KeepPost, KeepPostSportData } from '../types';
import { followingCountOf } from './profileHelpers';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function nowDateTime(): string {
  const d = TimeService.getDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function nowDate(): string {
  const d = TimeService.getDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export interface SocialActions {
  /** 加油 toggle:计数 ±1,图标点亮/熄灭 */
  cheerPost: (postId: string) => void;
  /** 收藏 toggle:计数 ±1 */
  favPost: (postId: string) => void;
  /** 表情回应 toggle:对应表情计数 ±1 并高亮 */
  reactPostEmoji: (postId: string, emoji: string) => void;
  /** 发布评论:插入评论列表顶部,评论数 +1 */
  postComment: (postId: string, content: string) => void;
  /** 发布动态:新动态插入 feedFollow 顶部(锁定决策 Q12),toast「发布成功」 */
  publishPost: (content: string) => void;
  /** 关注/取关(推荐关注卡、帖子作者、推荐博主) */
  toggleFollowUser: (name: string) => void;
  /** 关闭广告卡/promo横幅/首入弹窗(closedCards 记录) */
  closePromoCard: (cardId: string) => void;
  /** 社区瀑布流下拉刷新:卡片重排 */
  refreshCommunityFeed: () => void;
}

export function createSocialSlice(set: KeepSet, get: KeepGet): SocialActions {
  return {
    cheerPost: (postId) =>
      set((s) => {
        const cheered = s.cheeredPosts ?? [];
        const on = cheered.includes(postId);
        return {
          cheeredPosts: on ? cheered.filter((id) => id !== postId) : [...cheered, postId],
          posts: s.posts.map((p) => (p.id === postId ? { ...p, cheers: Math.max(0, p.cheers + (on ? -1 : 1)) } : p)),
        };
      }),

    favPost: (postId) =>
      set((s) => {
        const faved = s.favedPosts ?? [];
        const on = faved.includes(postId);
        return {
          favedPosts: on ? faved.filter((id) => id !== postId) : [...faved, postId],
          posts: s.posts.map((p) => (p.id === postId ? { ...p, collects: Math.max(0, p.collects + (on ? -1 : 1)) } : p)),
        };
      }),

    reactPostEmoji: (postId, emoji) =>
      set((s) => {
        const reactedMap = s.emojiReacted ?? {};
        const reacted = reactedMap[postId] ?? [];
        const on = reacted.includes(emoji);
        return {
          emojiReacted: {
            ...reactedMap,
            [postId]: on ? reacted.filter((e) => e !== emoji) : [...reacted, emoji],
          },
          posts: s.posts.map((p) =>
            p.id === postId
              ? { ...p, emojis: { ...p.emojis, [emoji]: Math.max(0, (p.emojis[emoji] ?? 0) + (on ? -1 : 1)) } }
              : p,
          ),
        };
      }),

    postComment: (postId, content) => {
      const text = content.trim();
      if (!text) return;
      set((s) => {
        const post = s.posts.find((p) => p.id === postId);
        const comment: KeepComment = {
          id: `pc_new_${postId}_${(post?.comments.length ?? 0) + 1}`,
          author: s.user.nickname,
          avatar: s.user.avatar,
          content: text,
          time: nowDate(),
          region: '云江',
          likes: 0,
          replies: [],
        };
        return {
          posts: s.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: [comment, ...p.comments], commentsCount: p.commentsCount + 1 }
              : p,
          ),
          lastToast: '评论发布成功',
        };
      });
    },

    publishPost: (content) => {
      const text = content.trim();
      if (!text) return;
      set((s) => {
        // 从结算页进入时自动带入运动数据卡(current.recordId)
        const record = s.runRecords.find((r) => r.id === s.current.recordId);
        const sportData: KeepPostSportData | undefined = record
          ? {
              type: record.type,
              km: record.km ?? undefined,
              duration: fmtDuration(record.durationSec),
              kcal: record.kcal,
            }
          : undefined;
        const post: KeepPost = {
          id: `post_me_${s.posts.length + 1}`,
          authorId: null,
          author: s.user.nickname,
          avatar: s.user.avatar,
          time: nowDateTime(),
          region: 'IP 示例区',
          type: sportData ? '运动记录' : '图文',
          content: text,
          images: [],
          ...(sportData ? { sportData } : {}),
          cheers: 0,
          commentsCount: 0,
          comments: [],
          collects: 0,
          emojis: {},
        };
        return {
          posts: [post, ...s.posts],
          feedFollow: [post.id, ...s.feedFollow],
          lastToast: '发布成功',
        };
      });
    },

    toggleFollowUser: (name) =>
      set((s) => {
        const followedUsers = s.followedUsers ?? [];
        const followedNames = s.followedNames ?? [];
        const followedCoaches = s.followedCoaches ?? [];
        const coach = s.coaches.find((item) => item.name === name);
        const wasOn = followedUsers.includes(name)
          || followedNames.includes(name)
          || Boolean(coach && followedCoaches.includes(coach.id));
        const on = !wasOn;
        const withMembership = (list: string[], value: string, enabled: boolean) => (
          enabled
            ? (list.includes(value) ? list : [...list, value])
            : list.filter((item) => item !== value)
        );
        const nextUsers = withMembership(followedUsers, name, on);
        const nextNames = withMembership(followedNames, name, on);
        const nextCoaches = coach
          ? withMembership(followedCoaches, coach.id, on)
          : followedCoaches;
        return {
          followedUsers: nextUsers,
          followedNames: nextNames,
          followedCoaches: nextCoaches,
          user: {
            ...s.user,
            following: followingCountOf({
              ...s,
              followedUsers: nextUsers,
              followedNames: nextNames,
              followedCoaches: nextCoaches,
            }),
          },
        };
      }),

    closePromoCard: (cardId) =>
      set((s) => {
        const closed = s.closedCards ?? [];
        if (closed.includes(cardId)) return {};
        return { closedCards: [...closed, cardId] };
      }),

    refreshCommunityFeed: () => {
      const feed = get().feedCommunity;
      if (feed.length < 2) return;
      set(() => ({ feedCommunity: [...feed.slice(1), feed[0]] }));
    },
  };
}
