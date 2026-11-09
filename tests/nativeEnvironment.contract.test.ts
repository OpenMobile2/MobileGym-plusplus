import { afterEach, describe, expect, it } from 'vitest';

import { executeWeatherTool } from '../app_tools/apps/weather';
import { WEATHER_CITY_BY_ID } from '../apps/Weather/data';
import { useWeatherStore } from '../apps/Weather/state';
import { addSavedCityWithBundle, resolveSavedCityBundle } from '../apps/Weather/utils/savedCityState';
import { wheelScrollTop, wheelValueAtScroll } from '../apps/Alipay/utils/wheelPicker';


const initialWeather = useWeatherStore.getState();

afterEach(() => {
  useWeatherStore.setState(initialWeather, true);
});

describe('Hybrid Tools V6 environment contracts', () => {
  it('adds a Weather city with the same durable state and bundle for GUI and tools', async () => {
    useWeatherStore.setState({
      ...initialWeather,
      savedCities: initialWeather.savedCities.filter((city) => city.id !== 'nanjing'),
      selectedCityId: 'located',
      bundlesByCityId: Object.fromEntries(
        Object.entries(initialWeather.bundlesByCityId).filter(([id]) => id !== 'nanjing'),
      ),
    }, true);

    const result: any = await executeWeatherTool('weather__add_saved_city', {
      city_id: 'nanjing',
    });
    const state = useWeatherStore.getState();

    expect(result).toMatchObject({ city_id: 'nanjing', saved: true });
    expect(state.savedCities.some((city) => city.id === 'nanjing')).toBe(true);
    expect(state.selectedCityId).toBe('nanjing');
    expect(state.bundlesByCityId.nanjing?.bundle.now.temp).toBe('18');
    expect(resolveSavedCityBundle(state, WEATHER_CITY_BY_ID.nanjing)?.now.temp).toBe('18');
  });

  it('gives the GUI add path the same offline fallback as the tool path', () => {
    const city = WEATHER_CITY_BY_ID.nanjing;
    const state = addSavedCityWithBundle({
      ...initialWeather,
      savedCities: initialWeather.savedCities.filter((item) => item.id !== city.id),
      selectedCityId: 'located',
      bundlesByCityId: {},
    }, city);

    expect(state.savedCities.some((item) => item.id === city.id)).toBe(true);
    expect(state.selectedCityId).toBe(city.id);
    expect(state.bundlesByCityId[city.id]?.bundle.daily.length).toBeGreaterThanOrEqual(7);
  });

  it('maps wheel scroll positions to stable options without stale-state rollback', () => {
    const years = [2024, 2025, 2026];
    const months = Array.from({ length: 12 }, (_, index) => index + 1);

    expect(wheelScrollTop(years, 2026)).toBe(72);
    expect(wheelValueAtScroll(years, 72, 2024)).toBe(2026);
    expect(wheelValueAtScroll(months, 0, 7)).toBe(1);
    expect(wheelValueAtScroll(months, 36 * 11, 1)).toBe(12);
    expect(wheelValueAtScroll(months, -100, 7)).toBe(1);
    expect(wheelValueAtScroll(months, 9999, 7)).toBe(12);
  });
});
