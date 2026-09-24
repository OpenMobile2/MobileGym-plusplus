import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';
export const REDDIT_TOOL_DEFINITIONS = defineAppTools('reddit', [
  { name:'search_posts', description:'Search visible Reddit posts by title, content, author, or community.', properties:{query:STRING,limit:LIMIT}, required:['query'] },
  { name:'get_post_summary', description:'Return compact public metadata for one post.', properties:{post_id:ID}, required:['post_id'] },
  { name:'list_communities', description:'List communities represented in the current feed and membership status.', properties:{limit:LIMIT} },
  { name:'list_saved_posts', description:'List posts saved by the current user.', properties:{limit:LIMIT} },
  { name:'search_chat', description:'Search messages in one Reddit chat thread.', properties:{username:STRING,query:STRING,limit:LIMIT}, required:['username','query'] },
  { name:'open_search', description:'Open the normal Reddit search page for continued GUI filtering.', kind:'navigation' },
  { name:'open_post', description:'Open a post and its comments.', properties:{post_id:ID}, required:['post_id'], kind:'navigation' },
  { name:'open_chat', description:'Open a Reddit chat thread.', properties:{username:STRING}, required:['username'], kind:'navigation' },
  { name:'join_community', description:'Join a visible community if not already joined.', properties:{community_id:ID}, required:['community_id'], kind:'write', idempotent:true },
]);
