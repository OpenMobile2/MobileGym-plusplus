import type { WeatherBundle } from '../types';
import type { WeatherCity, WeatherStateV1 } from './weatherStore';
import { materializeBundle } from './weatherLibrary';
import { setSelectedCityId, setStoredBundle, upsertSavedCity } from './weatherStore';

function coordinatesMatch(left: string, city: WeatherCity): boolean {
  const [lon, lat] = String(left || '').split(',').map(Number);
  return Number.isFinite(lon)
    && Number.isFinite(lat)
    && Math.abs(lon - city.lon) < 0.01
    && Math.abs(lat - city.lat) < 0.01;
}

export function resolveSavedCityBundle(
  state: WeatherStateV1,
  city: WeatherCity,
): WeatherBundle | null {
  const stored = state.bundlesByCityId[city.id]?.bundle;
  if (stored) return stored;

  const library = state.weatherLibrary ?? {};
  const byId = library[city.id]?.bundle;
  if (byId) return materializeBundle(byId);

  const byCoordinates = Object.values(library).find((entry) => (
    entry?.bundle && coordinatesMatch(entry.lonLat, city)
  ));
  return byCoordinates?.bundle ? materializeBundle(byCoordinates.bundle) : null;
}

export function ensureSavedCityBundle(
  state: WeatherStateV1,
  city: WeatherCity,
  bundle?: WeatherBundle | null,
): WeatherStateV1 {
  if (state.bundlesByCityId[city.id]?.bundle) return state;
  const resolved = bundle ?? resolveSavedCityBundle(state, city);
  if (!resolved) return state;
  return setStoredBundle(state, city.id, {
    lonLat: `${city.lon},${city.lat}`,
    bundle: resolved,
  });
}

export function addSavedCityWithBundle(
  state: WeatherStateV1,
  city: WeatherCity,
  bundle?: WeatherBundle | null,
): WeatherStateV1 {
  let next = upsertSavedCity(state, city);
  next = ensureSavedCityBundle(next, city, bundle);
  return setSelectedCityId(next, city.id);
}
