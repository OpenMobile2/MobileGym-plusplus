import { useMapStore } from '@/apps/Map/state';
import { searchPlacesByText, placeSearchResultToSearchRecord } from '@/apps/Map/utils/placeSearch';
import { assertAllowedKeys, requireBoolean, requireEnum, requireInteger, ToolExecutionError } from '../../core/errors';
import { compactResult, getLimit, getQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { MAP_TOOL_DEFINITIONS } from './definitions';

const placeCache = new Map<string, Awaited<ReturnType<typeof search>>[number]>();
const categoryAliases: Record<string, string> = {
  cafe: '咖啡馆', coffee: '咖啡馆', 'coffee shop': '咖啡馆',
  restaurant: '餐厅', hotel: '酒店', kfc: '肯德基',
};

function categoryQuery(value: string) {
  return categoryAliases[value.trim().toLocaleLowerCase()] ?? value;
}

async function search(query: string, limit: number) {
  const state = useMapStore.getState();
  const center = { lat: state.currentLocation.latitude, lng: state.currentLocation.longitude };
  const results = (await searchPlacesByText({ textQuery: query, searchCenter: center, distanceOrigin: center, pageSize: limit })).results;
  results.forEach((place) => placeCache.set(place.placeId, place));
  return results;
}

async function searchAll(query: string) {
  const state = useMapStore.getState();
  const center = { lat: state.currentLocation.latitude, lng: state.currentLocation.longitude };
  const results: Awaited<ReturnType<typeof search>> = [];
  const seen = new Set<string>();
  const seenPageTokens = new Set<string>();
  let pageToken: string | undefined;

  do {
    const page = await searchPlacesByText({
      textQuery: query,
      searchCenter: center,
      distanceOrigin: center,
      pageSize: 20,
      pageToken,
    });
    for (const place of page.results) {
      if (seen.has(place.placeId)) continue;
      seen.add(place.placeId);
      placeCache.set(place.placeId, place);
      results.push(place);
    }
    const nextPageToken = page.nextPageToken;
    if (nextPageToken && seenPageTokens.has(nextPageToken)) {
      throw new ToolExecutionError('MAP_PAGINATION_ERROR', 'Map search returned a repeated page token.');
    }
    if (nextPageToken) seenPageTokens.add(nextPageToken);
    pageToken = nextPageToken;
  } while (pageToken);

  return results;
}

const summary = (place: Awaited<ReturnType<typeof search>>[number]) => ({
  place_id: place.placeId,
  name: place.name,
  address: place.formattedAddress,
  rating: place.rating,
  review_count: place.userRatingCount,
  distance_meters: place.distanceMeters == null ? undefined : Math.round(place.distanceMeters),
  open_now: place.openNow,
  category: place.primaryTypeDisplayName ?? place.primaryType,
});

function displayedDistanceMeters(distance: number) {
  if (distance >= 1000) return Math.floor(distance / 100 + 0.5) * 100;
  return Math.min(1000, Math.max(50, Math.floor(distance / 50 + 0.5) * 50));
}

const handlers: Record<string, ToolHandler> = {
  map__search_places: async (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const limit = getLimit(input, 30);
    const results = await search(getQuery(input), limit);
    return compactResult(results.map(summary), limit);
  },
  map__find_nearby: async (input) => {
    assertAllowedKeys(input, ['category', 'radius_meters', 'limit']);
    const radius = requireInteger({ radius_meters: input.radius_meters ?? 5000 }, 'radius_meters', { min: 100, max: 50000 });
    const limit = getLimit(input, 50);
    const results = (await searchAll(categoryQuery(getQuery(input, 'category'))))
      .filter((p) => p.distanceMeters != null && displayedDistanceMeters(p.distanceMeters) <= radius)
      .sort((left, right) => (left.distanceMeters ?? Infinity) - (right.distanceMeters ?? Infinity));
    return compactResult(results.map(summary), limit);
  },
  map__compare_places: async (input) => {
    assertAllowedKeys(input, ['query', 'sort_by', 'limit']);
    const sortBy = requireEnum(input, 'sort_by', ['rating', 'distance'] as const);
    const limit = getLimit(input, 20);
    const results = await search(getQuery(input), 30);
    results.sort((a, b) => sortBy === 'rating'
      ? (b.rating ?? -1) - (a.rating ?? -1)
      : (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    return { sort_by: sortBy, ...compactResult(results.map(summary), limit) };
  },
  map__get_current_location: () => {
    const { currentLocation } = useMapStore.getState();
    return { latitude: currentLocation.latitude, longitude: currentLocation.longitude };
  },
  map__list_recent_searches: (input) => {
    assertAllowedKeys(input, ['limit']);
    const limit = getLimit(input);
    return compactResult(useMapStore.getState().searchHistory.slice(0, limit).map((h) => ({
      kind: h.kind, label: h.text, place_id: h.placeId, subtitle: h.subtitle,
    })), limit);
  },
  map__get_navigation_preferences: () => {
    const nav = useMapStore.getState().settings.navigation;
    return { avoid_tolls: nav.avoidTolls, avoid_highways: nav.avoidHighways, avoid_ferries: nav.avoidFerries, keep_map_north_up: nav.keepMapNorthUp, distance_units: nav.distanceUnits };
  },
  map__open_search: async () => { await openAppRoute('map', '/search'); return { route: '/search' }; },
  map__open_search_results: async (input) => {
    assertAllowedKeys(input, ['query']);
    const query = getQuery(input);
    const results = await search(query, 20);
    const records = results.map(placeSearchResultToSearchRecord);
    await openAppRoute('map', '/');
    useMapStore.getState().setSearchResults(records);
    useMapStore.getState().setPlaceResultsSheetOpen(true);
    useMapStore.getState().addSearchHistory({ kind: 'query', text: query });
    return { route: '/', query, result_count: results.length };
  },
  map__open_place: async (input) => {
    assertAllowedKeys(input, ['place_id']);
    const placeId = getQuery(input, 'place_id');
    const cached = placeCache.get(placeId);
    const candidate = useMapStore.getState().currentView.searchResults.find((p) => String(p.place_id ?? p.id) === placeId)
      ?? (cached ? placeSearchResultToSearchRecord(cached) : undefined);
    const resolved = requireFound(candidate, 'PLACE_NOT_FOUND', 'Place ID was not returned by a recent map search.');
    await openAppRoute('map', '/');
    useMapStore.getState().setActivePoi(resolved);
    useMapStore.getState().setPlaceResultsSheetOpen(true);
    return { route: '/', place_id: placeId };
  },
  map__open_route_planner: async () => {
    await openAppRoute('map', '/');
    useMapStore.getState().setRouteSetupOpen(true);
    return { route: '/', prefilled: false };
  },
  map__open_settings: async () => { await openAppRoute('map', '/settings'); return { route: '/settings' }; },
  map__open_navigation_settings: async () => { await openAppRoute('map', '/settings/nav'); return { route: '/settings/nav' }; },
  map__save_search: (input) => {
    assertAllowedKeys(input, ['query']);
    const query = getQuery(input);
    useMapStore.getState().addSearchHistory({ kind: 'query', text: query });
    return { query, saved: true };
  },
  map__set_route_avoidance: (input) => {
    assertAllowedKeys(input, ['option', 'enabled']);
    const option = requireEnum(input, 'option', ['tolls', 'highways', 'ferries'] as const);
    const enabled = requireBoolean(input, 'enabled');
    const key = option === 'tolls' ? 'avoidTolls' : option === 'highways' ? 'avoidHighways' : 'avoidFerries';
    useMapStore.getState().updateNavPrefs(key, enabled);
    return { option, enabled };
  },
};

export function executeMapTool(name: string, input: JsonObject) { return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Map tool: ${name}`)(input); }
export { MAP_TOOL_DEFINITIONS } from './definitions';
