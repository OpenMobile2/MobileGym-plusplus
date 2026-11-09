const PLACEHOLDER_KEYS = new Set(['YOUR_API_KEY_HERE', '']);

export function getGoogleMapsApiKey(): string {
  const raw = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';
  const key = raw.trim();
  return PLACEHOLDER_KEYS.has(key) ? '' : key;
}

export function hasGoogleMapsApiKey(): boolean {
  return getGoogleMapsApiKey().length > 0;
}
