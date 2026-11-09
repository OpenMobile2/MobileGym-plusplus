import type { KeepCoach, KeepPost } from '../types';

/** 帖子进主页用的 key：有达人 id 用 id，否则用昵称。 */
export function profileKeyOf(post: Pick<KeepPost, 'authorId' | 'author'>): string {
  return post.authorId || post.author;
}

function guestProfile(post: KeepPost): KeepCoach {
  return {
    id: post.authorId ?? post.author,
    name: post.author,
    avatar: post.avatar,
    fans: '--',
    monthly: '--',
    cheers: '--',
    following: 0,
    certs: [],
    achievements: [],
    courses: [],
    bio: 'Keep 用户',
  };
}

/** 按 id / 昵称解析主页；达人表没有时用帖子作者合成，避免空页或落到别人。 */
export function resolveKeepProfile(
  coaches: KeepCoach[],
  posts: KeepPost[],
  key: string | null | undefined,
): KeepCoach | undefined {
  if (!key) return undefined;
  const byId = coaches.find((c) => c.id === key);
  if (byId) return byId;
  const byName = coaches.find((c) => c.name === key);
  if (byName) return byName;
  const post = posts.find((p) => p.authorId === key || p.author === key);
  return post ? guestProfile(post) : undefined;
}

export function followedProfileList(
  coaches: KeepCoach[],
  posts: KeepPost[],
  followedCoaches: string[],
  followedUsers: string[],
  followedNames: string[],
): KeepCoach[] {
  const seen = new Set<string>();
  const list: KeepCoach[] = [];
  const push = (profile: KeepCoach) => {
    if (seen.has(profile.name)) return;
    seen.add(profile.name);
    list.push(profile);
  };
  for (const coach of coaches) {
    if (
      followedCoaches.includes(coach.id)
      || followedUsers.includes(coach.name)
      || followedNames.includes(coach.name)
    ) {
      push(coach);
    }
  }
  for (const name of [...followedUsers, ...followedNames]) {
    if (seen.has(name)) continue;
    const resolved = resolveKeepProfile(coaches, posts, name);
    if (resolved) push(resolved);
    else {
      push({
        id: name,
        name,
        avatar: 'avatar_me',
        fans: '--',
        monthly: '--',
        cheers: '--',
        following: 0,
        certs: [],
        achievements: [],
        courses: [],
        bio: 'Keep 用户',
      });
    }
  }
  return list;
}

/** 关注人数以去重后的博主列表为准，避免 id/昵称双写把计数加歪。 */
export function followingCountOf(state: {
  coaches: KeepCoach[];
  posts: KeepPost[];
  followedCoaches?: string[];
  followedUsers?: string[];
  followedNames?: string[];
}): number {
  return followedProfileList(
    state.coaches,
    state.posts,
    state.followedCoaches ?? [],
    state.followedUsers ?? [],
    state.followedNames ?? [],
  ).length;
}

export function isFollowedAuthor(
  post: Pick<KeepPost, 'author' | 'authorId'>,
  followedCoaches: string[],
  followedUsers: string[],
  followedNames: string[],
  myNickname?: string,
): boolean {
  if (myNickname && post.author === myNickname) return true;
  if (followedUsers.includes(post.author) || followedNames.includes(post.author)) return true;
  return Boolean(post.authorId && followedCoaches.includes(post.authorId));
}

/** 发现·关注 feed：自己的动态 + 已关注作者的动态；关注变化后立刻重算。 */
export function followFeedPosts(
  posts: KeepPost[],
  feedFollow: string[],
  followedCoaches: string[],
  followedUsers: string[],
  followedNames: string[],
  myNickname: string,
): KeepPost[] {
  const qualify = posts.filter((post) =>
    isFollowedAuthor(post, followedCoaches, followedUsers, followedNames, myNickname),
  );
  const byId = new Map(qualify.map((post) => [post.id, post]));
  const seen = new Set<string>();
  const ordered: KeepPost[] = [];
  for (const id of feedFollow) {
    const post = byId.get(id);
    if (!post) continue;
    ordered.push(post);
    seen.add(post.id);
  }
  for (const post of qualify) {
    if (!seen.has(post.id)) ordered.push(post);
  }
  return ordered;
}
