import { searchCities, WEATHER_CITY_BY_ID } from '@/apps/Weather/data';
import { useWeatherStore } from '@/apps/Weather/state';
import { getWeatherBundle } from '@/apps/Weather/services/weatherService';
import { setSelectedCityId } from '@/apps/Weather/utils/weatherStore';
import { materializeBundle } from '@/apps/Weather/utils/weatherLibrary';
import { addSavedCityWithBundle } from '@/apps/Weather/utils/savedCityState';
import { assertAllowedKeys, optionalInteger } from '../../core/errors';
import { compactResult, getLimit, getQuery, normalized, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { WEATHER_TOOL_DEFINITIONS } from './definitions';

function city(id: string) {
  const candidates = [
    ...Object.values(WEATHER_CITY_BY_ID),
    ...useWeatherStore.getState().savedCities,
  ];
  const exact = candidates.filter((c) => c.id === id || c.name === id);
  return requireFound(exact[0], 'CITY_NOT_FOUND', `Weather city not found: ${id}`);
}
async function bundle(id: string) {
  const c = city(id);
  const state = useWeatherStore.getState();
  const stored = state.bundlesByCityId?.[c.id]?.bundle;
  if (stored) return stored;
  const library = state.weatherLibrary?.[c.id]?.bundle;
  if (library) return materializeBundle(library);
  return getWeatherBundle(`${c.lon},${c.lat}`);
}
const daySummary = (d: any, dayOffset?: number) => ({ date: d.fxDate, day_offset: dayOffset, day: d.textDay, night: d.textNight, high_c: Number(d.tempMax), low_c: Number(d.tempMin), precipitation: d.precip, humidity: d.humidity });

const handlers: Record<string, ToolHandler> = {
  weather__search_cities: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const limit = getLimit(input, 30);
    return compactResult(searchCities(getQuery(input)).slice(0, limit).map((c) => ({ city_id: c.id, name: c.name, province: c.adm1, prefecture: c.adm2 })), limit);
  },
  weather__get_current_weather: async (input) => {
    assertAllowedKeys(input, ['city_id']); const c = city(getQuery(input, 'city_id')); const b = await bundle(c.id);
    return { city_id: c.id, city: c.name, observed_at: b.now.obsTime, temperature_c: Number(b.now.temp), feels_like_c: Number(b.now.feelsLike), condition: b.now.text, humidity_percent: Number(b.now.humidity), precipitation_mm: Number(b.now.precip), wind: `${b.now.windDir}${b.now.windScale}` };
  },
  weather__get_daily_forecast: async (input) => {
    assertAllowedKeys(input, ['city_id', 'days']); const id = getQuery(input, 'city_id'); const days = optionalInteger(input, 'days', { min: 1, max: 15, defaultValue: 7 });
    return { city_id: id, days: (await bundle(id)).daily.slice(0, days).map((d, index) => daySummary(d, index)) };
  },
  weather__find_days_by_condition: async (input) => {
    assertAllowedKeys(input, ['city_id', 'condition', 'days']); const id = getQuery(input, 'city_id'); const condition = normalized(getQuery(input, 'condition')); const days = optionalInteger(input, 'days', { min: 1, max: 15, defaultValue: 15 });
    const matches = (await bundle(id)).daily.slice(0, days).map((d, index) => daySummary(d, index)).filter((d) => normalized(`${d.day} ${d.night}`).includes(condition));
    return { city_id: id, condition, days: matches };
  },
  weather__get_air_quality: async (input) => {
    assertAllowedKeys(input, ['city_id']); const id = getQuery(input, 'city_id'); const aq = (await bundle(id)).airQuality;
    return aq ? { city_id: id, aqi: Number(aq.aqi), category: aq.category, primary_pollutant: aq.primaryPollutant, pm2_5: Number(aq.pm2p5), pm10: Number(aq.pm10) } : { city_id: id, available: false };
  },
  weather__list_saved_cities: () => ({ cities: useWeatherStore.getState().savedCities.map((c) => ({ city_id: c.id, name: c.name })), selected_city_id: useWeatherStore.getState().selectedCityId }),
  weather__open_city: async (input) => { assertAllowedKeys(input, ['city_id']); const c = city(getQuery(input, 'city_id')); useWeatherStore.setState((s) => setSelectedCityId(s, c.id), true); await openAppRoute('weather', '/'); return { route: '/', city_id: c.id }; },
  weather__open_daily_forecast: async (input) => { assertAllowedKeys(input, ['city_id']); const id = city(getQuery(input, 'city_id')).id; await openAppRoute('weather', `/forecast/daily?cityId=${encodeURIComponent(id)}`); return { route: '/forecast/daily', city_id: id }; },
  weather__open_air_quality: async (input) => { assertAllowedKeys(input, ['city_id']); const id = city(getQuery(input, 'city_id')).id; await openAppRoute('weather', `/airquality?cityId=${encodeURIComponent(id)}`); return { route: '/airquality', city_id: id }; },
  weather__add_saved_city: (input) => { assertAllowedKeys(input, ['city_id']); const c = city(getQuery(input, 'city_id')); useWeatherStore.setState((s) => addSavedCityWithBundle(s, c), true); return { city_id: c.id, name: c.name, saved: true }; },
};

export function executeWeatherTool(name: string, input: JsonObject) { return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Weather tool: ${name}`)(input); }
export { WEATHER_TOOL_DEFINITIONS } from './definitions';
