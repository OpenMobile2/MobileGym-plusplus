export function makeLatLngLike(lat: number, lng: number): google.maps.LatLng {
  return {
    lat: () => lat,
    lng: () => lng,
    equals: (other: google.maps.LatLng) => other.lat() === lat && other.lng() === lng,
    toJSON: () => ({ lat, lng }),
    toString: () => `(${lat}, ${lng})`,
    toUrlValue: (precision?: number) => {
      const p = typeof precision === 'number' ? precision : 6;
      return `${lat.toFixed(p)},${lng.toFixed(p)}`;
    },
  } as google.maps.LatLng;
}

export function readLatLngLike(
  loc: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined,
): google.maps.LatLngLiteral | null {
  if (!loc) return null;
  const record = loc as unknown as {
    lat?: number | (() => number);
    lng?: number | (() => number);
  };
  const lat = typeof record.lat === 'function' ? record.lat() : record.lat;
  const lng = typeof record.lng === 'function' ? record.lng() : record.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
