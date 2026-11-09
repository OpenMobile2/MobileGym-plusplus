import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const WEATHER_TOOL_DEFINITIONS = defineAppTools('weather', [
  { name: 'search_cities', description: 'Search the Weather city catalog by Chinese name, pinyin, or administrative area.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'get_current_weather', description: 'Return current conditions for a city. city_id accepts a search result ID or an exact city name.', properties: { city_id: ID }, required: ['city_id'] },
  { name: 'get_daily_forecast', description: 'Return compact daily forecasts for a city. Results include the current simulated date at day_offset=0; when a task asks for a future day, start from day_offset=1.', properties: { city_id: ID, days: { type: 'integer', minimum: 1, maximum: 15, default: 7 } }, required: ['city_id'] },
  { name: 'find_days_by_condition', description: 'Find forecast days whose day or night description contains a condition such as rain, clear, or snow. day_offset=0 is today and day_offset=1 is tomorrow.', properties: { city_id: ID, condition: STRING, days: { type: 'integer', minimum: 1, maximum: 15, default: 15 } }, required: ['city_id', 'condition'] },
  { name: 'get_air_quality', description: 'Return the current air-quality summary for a city.', properties: { city_id: ID }, required: ['city_id'] },
  { name: 'list_saved_cities', description: 'List cities currently saved in Weather.' },
  { name: 'open_city', description: 'Select a saved city and open its normal Weather home page.', properties: { city_id: ID }, required: ['city_id'], kind: 'navigation' },
  { name: 'open_daily_forecast', description: 'Open the 15-day forecast page for a city. Read detailed cards through the GUI.', properties: { city_id: ID }, required: ['city_id'], kind: 'navigation' },
  { name: 'open_air_quality', description: 'Open the air-quality details page for a city.', properties: { city_id: ID }, required: ['city_id'], kind: 'navigation' },
  { name: 'add_saved_city', description: 'Add a city to Weather and select it. This is a reversible, low-risk write.', properties: { city_id: ID }, required: ['city_id'], kind: 'write' },
]);
