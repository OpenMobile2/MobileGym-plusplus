import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const MAP_TOOL_DEFINITIONS = defineAppTools('map', [
  { name: 'search_places', description: 'Search places by name or category near the current map location. Returns compact candidates; use the GUI for full details.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'find_nearby', description: 'Find nearby places in a category and return distance, rating, and open status when available. Common English category aliases such as cafe, restaurant, hotel, and kfc are accepted.', properties: { category: STRING, radius_meters: { type: 'integer', minimum: 100, maximum: 50000, default: 5000 }, limit: LIMIT }, required: ['category'] },
  { name: 'compare_places', description: 'Search and rank matching places by rating or distance. This returns candidate summaries, not a final recommendation.', properties: { query: STRING, sort_by: { type: 'string', enum: ['rating', 'distance'] }, limit: LIMIT }, required: ['query', 'sort_by'] },
  { name: 'get_current_location', description: 'Return the simulated current coordinates. It does not reveal task setup or hidden place data.' },
  { name: 'list_recent_searches', description: 'List recent map search labels and place identifiers.', properties: { limit: LIMIT } },
  { name: 'get_navigation_preferences', description: 'Read route avoidance and map-orientation preferences.' },
  { name: 'open_search', description: 'Open the normal map search page. Continue entering or selecting a place through the GUI.', kind: 'navigation' },
  { name: 'open_search_results', description: 'Run a place search and open the normal result sheet. Inspect and choose a result through the GUI.', properties: { query: STRING }, required: ['query'], kind: 'navigation' },
  { name: 'open_place', description: 'Open a place candidate already returned by a map search on the normal map surface.', properties: { place_id: ID }, required: ['place_id'], kind: 'navigation' },
  { name: 'open_route_planner', description: 'Open the route-planning surface. Origin, destination, travel mode, and confirmation remain GUI operations.', kind: 'navigation' },
  { name: 'open_settings', description: 'Open the normal Map settings page for continued GUI configuration.', kind: 'navigation' },
  { name: 'open_navigation_settings', description: 'Open Map navigation settings.', kind: 'navigation' },
  { name: 'save_search', description: 'Save one query in recent map searches without opening a result.', properties: { query: STRING }, required: ['query'], kind: 'write' },
  { name: 'set_route_avoidance', description: 'Set one low-risk route preference. It affects later GUI route calculations.', properties: { option: { type: 'string', enum: ['tolls', 'highways', 'ferries'] }, enabled: { type: 'boolean' } }, required: ['option', 'enabled'], kind: 'write' },
]);
