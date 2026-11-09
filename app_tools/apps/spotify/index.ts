import { SPOTIFY_CONFIG } from '@/apps/Spotify/data';
import { loadSearchResults } from '@/apps/Spotify/data/loader';
import { useSpotifyStore } from '@/apps/Spotify/state';
import type { SpotifyTrack } from '@/apps/Spotify/types';
import { assertAllowedKeys } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { SPOTIFY_TOOL_DEFINITIONS } from './definitions';
import * as TimeService from '@/os/TimeService';

const discoveredTracks = new Map<string, SpotifyTrack>();

function stateTracks() {
  const config: any = SPOTIFY_CONFIG;
  const state = useSpotifyStore.getState();
  const arrays = [
    config.recommendedTracks, config.extraTracks, config.startListening,
    config.recentPlays, config.likedSongs, config.allNewMusic, config.hottestToday,
    state.queue, state.recentPlays, state.likedSongs,
  ];
  const tracks = new Map<string, SpotifyTrack>(discoveredTracks);
  for (const items of arrays) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (item?.id && item?.title && item?.artist) tracks.set(item.id, item);
    }
  }
  for (const playlist of state.customPlaylists) {
    for (const item of ((playlist as any).storedTracks ?? [])) tracks.set(item.id, item);
  }
  return [...tracks.values()];
}

async function track(id: string) {
  return requireFound(
    stateTracks().find((item) => item.id === id),
    'TRACK_NOT_FOUND',
    `Spotify track not found: ${id}`,
  );
}

const trackIdentity = (item: SpotifyTrack) =>
  `${item.title.trim().toLocaleLowerCase()}\u0000${item.artist.trim().toLocaleLowerCase()}`;

const trackSummary = (item: SpotifyTrack) => ({
  track_id: item.id,
  title: item.title,
  artist: item.artist,
  duration: item.duration,
  liked: useSpotifyStore.getState().likedSongs.some(
    (liked) => trackIdentity(liked) === trackIdentity(item),
  ),
});

const localTimestamp = (timestamp: number) => {
  const value = TimeService.fromTimestamp(timestamp);
  const pad = (part: number) => String(part).padStart(2, '0');
  return {
    played_at: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`,
    played_at_ms: timestamp,
    local_date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
  };
};

const handlers: Record<string, ToolHandler> = {
  spotify__search_tracks: async (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const limit = getLimit(input, 50);
    const offline = await loadSearchResults();
    const exact = offline[query.toLocaleLowerCase()]?.songs ?? [];
    const merged = new Map<string, SpotifyTrack>();
    for (const item of exact) merged.set(item.id, item);
    for (const item of stateTracks()) {
      if (includesQuery([item.title, item.artist], query)) merged.set(item.id, item);
    }
    for (const item of merged.values()) discoveredTracks.set(item.id, item);
    return compactResult([...merged.values()].map(trackSummary), limit);
  },
  spotify__search_artists: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const limit = getLimit(input, 50);
    const names = [...new Set(stateTracks().map((item) => item.artist))]
      .filter((artist) => includesQuery([artist], query));
    return compactResult(names.map((name) => ({
      name,
      followed: useSpotifyStore.getState().followedArtists.includes(name),
    })), limit);
  },
  spotify__get_track_summary: async (input) => {
    assertAllowedKeys(input, ['track_id']);
    return trackSummary(await track(getQuery(input, 'track_id')));
  },
  spotify__list_liked_songs: (input) => {
    assertAllowedKeys(input, ['limit']);
    return compactResult(useSpotifyStore.getState().likedSongs.map(trackSummary), getLimit(input, 50));
  },
  spotify__list_recent_plays: (input) => {
    assertAllowedKeys(input, ['limit']);
    const state = useSpotifyStore.getState();
    const recent = state.recentPlays;
    const timestamps = new Map<string, number>();
    for (const entry of state.playHistory) {
      if (!timestamps.has(entry.track.id)) timestamps.set(entry.track.id, entry.timestamp);
    }
    return compactResult(recent.map((item, index) => ({
      ...trackSummary(item),
      position_from_latest: index + 1,
      position_from_earliest: recent.length - index,
      ...(timestamps.has(item.id) ? localTimestamp(timestamps.get(item.id)!) : {}),
    })), getLimit(input, 50));
  },
  spotify__list_playlists: (input) => {
    assertAllowedKeys(input, ['limit']);
    const config: any = SPOTIFY_CONFIG;
    const rows = [
      ...(useSpotifyStore.getState().customPlaylists ?? []),
      ...(config.personalizedPlaylists ?? []),
    ];
    return compactResult(rows.map((playlist: any) => ({
      playlist_id: playlist.id,
      title: playlist.title ?? playlist.name,
      subtitle: playlist.subtitle,
      custom: Array.isArray(playlist.storedTracks),
    })), getLimit(input, 50));
  },
  spotify__open_search: async () => {
    await openAppRoute('spotify', '/search/input');
    return { route: '/search/input' };
  },
  spotify__open_artist: async (input) => {
    assertAllowedKeys(input, ['artist']);
    const artist = getQuery(input, 'artist');
    requireFound(
      stateTracks().find((item) => item.artist.toLocaleLowerCase() === artist.toLocaleLowerCase()),
      'ARTIST_NOT_FOUND',
      `Spotify artist not found: ${artist}`,
    );
    const route = `/artist/${encodeURIComponent(artist)}`;
    await openAppRoute('spotify', route);
    return { route, artist };
  },
  spotify__open_playlist: async (input) => {
    assertAllowedKeys(input, ['playlist_id']);
    const playlistId = getQuery(input, 'playlist_id');
    const route = `/playlist/${encodeURIComponent(playlistId)}`;
    await openAppRoute('spotify', route);
    return { route, playlist_id: playlistId };
  },
  spotify__open_queue: async () => {
    await openAppRoute('spotify', '/player');
    return { route: '/player' };
  },
  spotify__add_to_queue: async (input) => {
    assertAllowedKeys(input, ['track_id']);
    const item = await track(getQuery(input, 'track_id'));
    useSpotifyStore.getState().addToQueue(item);
    return { track_id: item.id, queued: true, queue_length: useSpotifyStore.getState().queue.length };
  },
  spotify__add_to_playlist: async (input) => {
    assertAllowedKeys(input, ['track_id', 'playlist_name']);
    const item = await track(getQuery(input, 'track_id'));
    const name = getQuery(input, 'playlist_name');
    useSpotifyStore.getState().addTrackToPlaylist(name, item);
    const playlist = useSpotifyStore.getState().customPlaylists
      .find((candidate) => ('title' in candidate ? candidate.title : candidate.name) === name);
    return { track_id: item.id, playlist_id: playlist?.id, playlist_name: name, added: true };
  },
};

export function executeSpotifyTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Spotify tool: ${name}`)(input);
}

export { SPOTIFY_TOOL_DEFINITIONS } from './definitions';
