import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { useMapStore } from '../state';
import { googleLangCode } from './placeUtils';
import { getGoogleMapsApiKey } from './googleMapsConfig';
import { ensureMapServiceWorkerControlling, registerMapServiceWorker } from './registerMapServiceWorker';

let runtimePromise: Promise<typeof google> | null = null;

/** Load the shared offline-capable Google Maps runtime for Map and consumer apps. */
export function ensureGoogleMapsRuntime(locale: 'zh-Hans' | 'en'): Promise<typeof google> {
  if (window.google?.maps?.Map) return Promise.resolve(window.google);
  if (runtimePromise) return runtimePromise;

  const apiKey = getGoogleMapsApiKey() || 'OFFLINE_NO_KEY';
  runtimePromise = (async () => {
    await registerMapServiceWorker();
    await ensureMapServiceWorkerControlling();
    setOptions({ key: apiKey, v: 'weekly', language: googleLangCode(locale), region: 'CN' });
    await Promise.all([
      importLibrary('maps'),
      importLibrary('places'),
      importLibrary('geometry'),
      importLibrary('marker'),
      importLibrary('routes'),
    ]);
    useMapStore.getState().setGoogleLoaded(window.google);
    return window.google;
  })().catch((error) => {
    const normalized = error instanceof Error ? error : new Error(String(error));
    useMapStore.getState().setGoogleLoadError(normalized);
    runtimePromise = null;
    throw normalized;
  });

  return runtimePromise;
}
