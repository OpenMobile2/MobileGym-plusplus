import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const BROADCAST_TOOL_DEFINITIONS = defineAppTools('broadcast', [
  { name: 'search_shows', description: 'Search podcast shows by title, author, genre, or description. Returns compact candidates; use the GUI to inspect full show details.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'search_episodes', description: 'Search podcast episodes by title, show title, or description. Returns stable episode and show identifiers.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'get_show_summary', description: 'Return compact public metadata for one podcast show without changing the current page.', properties: { show_id: ID }, required: ['show_id'] },
  { name: 'get_episode_summary', description: 'Return compact public metadata and playback status for one podcast episode without changing the current page.', properties: { episode_id: ID }, required: ['episode_id'] },
  { name: 'list_up_next', description: 'List the current Up Next episodes in playback order.', properties: { limit: LIMIT } },
  { name: 'open_show', description: 'Open the normal podcast show page for visual inspection. A fresh screenshot should be read after this call.', properties: { show_id: ID }, required: ['show_id'], kind: 'navigation' },
  { name: 'open_episode', description: 'Open the normal episode page for visual inspection and GUI playback controls. A fresh screenshot should be read after this call.', properties: { episode_id: ID }, required: ['episode_id'], kind: 'navigation' },
  { name: 'add_to_queue', description: 'Add one known episode to the end of the playback queue. This does not start playback or open the player.', properties: { episode_id: ID }, required: ['episode_id'], kind: 'write', idempotent: true },
]);
