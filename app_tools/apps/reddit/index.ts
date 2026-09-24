import { REDDIT_COMMUNITIES } from '@/apps/Reddit/data';
import { useRedditStore } from '@/apps/Reddit/state';
import * as TimeService from '@/os/TimeService';
import { assertAllowedKeys } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { REDDIT_TOOL_DEFINITIONS } from './definitions';

function posts() { return Object.values(useRedditStore.getState().posts).filter(Boolean); }
function post(id: string) { return requireFound(useRedditStore.getState().posts[id], 'POST_NOT_FOUND', `Reddit post not found: ${id}`); }
function communities() {
  const represented = [...new Set(posts().map((item) => item!.subreddit))];
  return represented.map((name) => REDDIT_COMMUNITIES.find((item) =>
    item.name.toLowerCase() === name.toLowerCase() || item.id === name,
  ) ?? { id: name, name, members: 'unknown' });
}
const summary = (item: NonNullable<ReturnType<typeof post>>) => ({
  post_id: item.id, title: item.title, author: item.author, community: item.subreddit,
  upvotes: item.upvotes, comments: item.comments, is_ad: item.isAd,
});

const handlers: Record<string, ToolHandler> = {
  reddit__search_posts: (input) => { assertAllowedKeys(input, ['query', 'limit']); const query = getQuery(input); const limit = getLimit(input, 50); return compactResult(posts().filter((item) => includesQuery([item!.title, item!.content, item!.author, item!.subreddit], query)).map((item) => summary(item!)), limit); },
  reddit__get_post_summary: (input) => { assertAllowedKeys(input, ['post_id']); return summary(post(getQuery(input, 'post_id'))); },
  reddit__list_communities: (input) => { assertAllowedKeys(input, ['limit']); const limit = getLimit(input, 50); const joined = useRedditStore.getState().user.joinedCommunityIds; return compactResult(communities().map((item) => ({ community_id: item.id, name: item.name, members: item.members, joined: joined.includes(item.id) })), limit); },
  reddit__list_saved_posts: (input) => { assertAllowedKeys(input, ['limit']); const limit = getLimit(input, 50); return compactResult(useRedditStore.getState().user.savedPostIds.map((id) => useRedditStore.getState().posts[id]).filter(Boolean).map((item) => summary(item!)), limit); },
  reddit__search_chat: (input) => { assertAllowedKeys(input, ['username', 'query', 'limit']); const username = getQuery(input, 'username'); const query = getQuery(input); const limit = getLimit(input); const rows = requireFound(useRedditStore.getState().chatThreads[username], 'CHAT_NOT_FOUND', `Reddit chat not found: ${username}`); return compactResult(rows.filter((message) => includesQuery([message.body], query)).map((message) => ({ message_id: message.id, from: message.from, body: message.body, created_at: TimeService.fromTimestamp(message.created_utc * 1000).toISOString() })), limit); },
  reddit__open_search: async () => { await openAppRoute('reddit', '/search'); return { route: '/search' }; },
  reddit__open_post: async (input) => { assertAllowedKeys(input, ['post_id']); const id = post(getQuery(input, 'post_id')).id; const route = `/post/${encodeURIComponent(id)}`; await openAppRoute('reddit', route); return { route, post_id: id }; },
  reddit__open_chat: async (input) => { assertAllowedKeys(input, ['username']); const username = getQuery(input, 'username'); requireFound(useRedditStore.getState().chatThreads[username], 'CHAT_NOT_FOUND', `Reddit chat not found: ${username}`); const route = `/chat/${encodeURIComponent(username)}`; await openAppRoute('reddit', route); return { route, username }; },
  reddit__join_community: (input) => { assertAllowedKeys(input, ['community_id']); const id = getQuery(input, 'community_id'); requireFound(communities().find((item) => item.id === id), 'COMMUNITY_NOT_FOUND', `Reddit community not found: ${id}`); if (!useRedditStore.getState().user.joinedCommunityIds.includes(id)) useRedditStore.getState().toggleJoinCommunity(id); return { community_id: id, joined: true }; },
};

export function executeRedditTool(name: string, input: JsonObject) { return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Reddit tool: ${name}`)(input); }
export { REDDIT_TOOL_DEFINITIONS } from './definitions';
