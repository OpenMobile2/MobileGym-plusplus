import { useBroadcastStore } from '@/apps/Broadcast/state';
import type { Episode, Show } from '@/apps/Broadcast/types';
import { assertAllowedKeys } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { BROADCAST_TOOL_DEFINITIONS } from './definitions';

const state = () => useBroadcastStore.getState();

function showById(id: string): Show {
  return requireFound(state().shows[id], 'SHOW_NOT_FOUND', `Podcast show not found: ${id}`);
}

function episodeById(id: string): Episode {
  return requireFound(state().episodes[id], 'EPISODE_NOT_FOUND', `Podcast episode not found: ${id}`);
}

const showSummary = (show: Show) => ({
  show_id: show.id,
  title: show.title,
  author: show.author,
  genre: state().genres[show.genreId]?.name,
  rating: show.rating,
  cadence: show.cadence,
  followed: state().followedShowIds.includes(show.id),
  episode_count: show.episodeIds.length,
});

const episodeSummary = (episode: Episode) => ({
  episode_id: episode.id,
  show_id: episode.showId,
  show_title: state().shows[episode.showId]?.title,
  title: episode.title,
  published_at_ms: episode.date,
  duration_sec: episode.durationSec,
  progress_sec: episode.progressSec,
  played: episode.played,
  saved: state().savedEpisodeIds.includes(episode.id),
  downloaded: state().downloadedEpisodeIds.includes(episode.id),
});

const handlers: Record<string, ToolHandler> = {
  broadcast__search_shows: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const rows = Object.values(state().shows).filter((show) => includesQuery([
      show.title, show.author, show.desc, state().genres[show.genreId]?.name,
    ], query));
    return compactResult(rows.map(showSummary), getLimit(input, 50));
  },
  broadcast__search_episodes: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const rows = Object.values(state().episodes).filter((episode) => includesQuery([
      episode.title, episode.desc, state().shows[episode.showId]?.title,
    ], query));
    return compactResult(rows.map(episodeSummary), getLimit(input, 50));
  },
  broadcast__get_show_summary: (input) => {
    assertAllowedKeys(input, ['show_id']);
    return showSummary(showById(getQuery(input, 'show_id')));
  },
  broadcast__get_episode_summary: (input) => {
    assertAllowedKeys(input, ['episode_id']);
    return episodeSummary(episodeById(getQuery(input, 'episode_id')));
  },
  broadcast__list_up_next: (input) => {
    assertAllowedKeys(input, ['limit']);
    return compactResult(state().upNextIds.map(episodeById).map(episodeSummary), getLimit(input, 50));
  },
  broadcast__open_show: async (input) => {
    assertAllowedKeys(input, ['show_id']);
    const show = showById(getQuery(input, 'show_id'));
    const route = `/show/${encodeURIComponent(show.id)}`;
    await openAppRoute('broadcast', route);
    return { route, show_id: show.id };
  },
  broadcast__open_episode: async (input) => {
    assertAllowedKeys(input, ['episode_id']);
    const episode = episodeById(getQuery(input, 'episode_id'));
    const route = `/episode/${encodeURIComponent(episode.id)}`;
    await openAppRoute('broadcast', route);
    return { route, episode_id: episode.id };
  },
  broadcast__add_to_queue: (input) => {
    assertAllowedKeys(input, ['episode_id']);
    const episode = episodeById(getQuery(input, 'episode_id'));
    state().addToQueue(episode.id);
    return { episode_id: episode.id, queued: true, queue_length: state().queueIds.length };
  },
};

export function executeBroadcastTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Broadcast tool: ${name}`)(input);
}

export { BROADCAST_TOOL_DEFINITIONS } from './definitions';
