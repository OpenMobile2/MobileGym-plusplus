import { afterEach, describe, expect, it } from 'vitest';

import { executeSpotifyTool } from '../app_tools/apps/spotify';
import { useSpotifyStore } from '../apps/Spotify/state';
import { useWeatherStore } from '../apps/Weather/state';
import { findLibraryBundleById } from '../apps/Weather/utils/weatherLibrary';
import { compareNotesForList } from '../system/Notes/pages/NotesListPage';
import type { Note } from '../system/Notes/types';


const initialSpotify = useSpotifyStore.getState();
const initialWeather = useWeatherStore.getState();

afterEach(() => {
  useSpotifyStore.setState(initialSpotify, true);
  useWeatherStore.setState(initialWeather, true);
});

describe('Hybrid Tools V5 environment contracts', () => {
  it('orders the Notes list by pinned state and then updatedAt', () => {
    const note = (id: string, updatedAt: number, pinned = false) => ({
      id,
      title: id,
      content: '',
      updatedAt,
      pinned,
      folderId: 'all',
    }) as Note;
    const rows = [note('old', 1), note('new', 3), note('middle', 2), note('pinned', 0, true)];
    rows.sort(compareNotesForList);
    expect(rows.map((row) => row.id)).toEqual(['pinned', 'new', 'middle', 'old']);
  });

  it('returns neutral timestamp metadata for seeded recent plays', async () => {
    const track = initialSpotify.recentPlays[0];
    useSpotifyStore.setState({
      ...initialSpotify,
      recentPlays: [track],
      playHistory: [{
        sourceType: 'standalone',
        sourceId: 'standalone',
        sourceTitle: '',
        track,
        timestamp: 1783817700000,
      }],
    }, true);
    const result: any = await executeSpotifyTool('spotify__list_recent_plays', {});
    expect(result.items[0]).toMatchObject({
      track_id: track.id,
      played_at_ms: 1783817700000,
      local_date: '2026-07-12',
    });
    expect(result.items[0].played_at).toMatch(/^2026-07-12T\d{2}:\d{2}:\d{2}$/);
  });

  it('resolves a newly saved city from the offline library by stable city ID', () => {
    const bundle = findLibraryBundleById('nanjing');
    expect(bundle?.now.temp).toBe('18');
    expect(bundle?.daily.length).toBeGreaterThanOrEqual(7);
  });
});
