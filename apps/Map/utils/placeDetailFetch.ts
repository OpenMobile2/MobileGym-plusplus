import { PLACE_ABOUT_FIELDS, placeRequestedLanguage } from './placeUtils';
import { pickFormattedPhoneNumber, pickPlaceWebsite, type GooglePlaceContactFields } from '../types';
import { extractPlaceAboutData } from './placeUtils';
import { getLocale } from '../locale';
import { cachePlaceDetail, getPlaceDetailOffline, getOfflinePlaceRowName, type OfflinePlaceRow } from './offlinePlaceStore';
import { buildPlaceDetailResultFromOfflineRow } from './placeDetailFromOffline';
import { readLatLngLike } from './latLng';
import { hasGoogleMapsApiKey } from './googleMapsConfig';

/** 将 JS Place.fetchFields 结果序列化为与 REST GET / 快照 `details` 一致的缓存结构 */
function buildOfflinePlaceRowFromFetchedPlace(
  place: google.maps.places.Place & Record<string, unknown>,
): OfflinePlaceRow {
  const loc = place.location;
  if (!loc) {
    throw new Error('place.location missing');
  }
  const lat = loc.lat();
  const lng = loc.lng();
  const details: Record<string, unknown> = {
    displayName: place.displayName,
    formattedAddress: place.formattedAddress,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    businessStatus: place.businessStatus,
    types: place.types,
    primaryType: place.primaryType,
    primaryTypeDisplayName: place.primaryTypeDisplayName,
    internationalPhoneNumber: place.internationalPhoneNumber,
    nationalPhoneNumber: place.nationalPhoneNumber,
    websiteUri: place.websiteUri,
    regularOpeningHours: place.regularOpeningHours,
    currentOpeningHours: place.currentOpeningHours,
    editorialSummary: place.editorialSummary,
    plusCode: place.plusCode,
    accessibilityOptions: place.accessibilityOptions,
    paymentOptions: place.paymentOptions,
    parkingOptions: place.parkingOptions,
    hasDineIn: place.hasDineIn,
    hasTakeout: place.hasTakeout,
    hasDelivery: place.hasDelivery,
    isReservable: place.isReservable,
    servesBreakfast: place.servesBreakfast,
    servesLunch: place.servesLunch,
    servesDinner: place.servesDinner,
    servesBrunch: place.servesBrunch,
    servesBeer: place.servesBeer,
    servesWine: place.servesWine,
    servesCocktails: place.servesCocktails,
    servesCoffee: place.servesCoffee,
    servesDessert: place.servesDessert,
    servesVegetarianFood: place.servesVegetarianFood,
    hasRestroom: place.hasRestroom,
    allowsDogs: place.allowsDogs,
    hasOutdoorSeating: place.hasOutdoorSeating,
    hasLiveMusic: place.hasLiveMusic,
    isGoodForWatchingSports: place.isGoodForWatchingSports,
    isGoodForChildren: place.isGoodForChildren,
    isGoodForGroups: place.isGoodForGroups,
    hasMenuForChildren: place.hasMenuForChildren,
  };
  return {
    placeId: place.id as string,
    name: String(place.displayName ?? ''),
    lat,
    lng,
    rating: place.rating ?? undefined,
    userRatingCount: place.userRatingCount ?? undefined,
    types: (place.types as string[]) || [],
    primaryType: place.primaryType as string | undefined,
    formattedAddress: place.formattedAddress || '',
    internationalPhoneNumber: place.internationalPhoneNumber as string | undefined,
    details,
  };
}

function buildPlaceDetailResultFromFetchedPlace(
  place: google.maps.places.Place & Record<string, unknown>,
): Record<string, unknown> {
  return {
    place_id: place.id,
    name: place.displayName,
    formatted_address: place.formattedAddress,
    geometry: { location: place.location },
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    business_status: place.businessStatus,
    types: place.types,
    primaryType: place.primaryType,
    primaryTypeDisplayName: place.primaryTypeDisplayName,
    formatted_phone_number:
      (place as { nationalPhoneNumber?: string }).nationalPhoneNumber ||
      pickFormattedPhoneNumber(place as GooglePlaceContactFields),
    websiteURI: pickPlaceWebsite(place as GooglePlaceContactFields),
    regularOpeningHours:
      place.regularOpeningHours || (place as { currentOpeningHours?: unknown }).currentOpeningHours || null,
    editorialSummary: (place as { editorialSummary?: unknown }).editorialSummary,
    plusCode: (place as { plusCode?: { compoundCode?: string } }).plusCode?.compoundCode || null,
    _aboutData: extractPlaceAboutData(place),
  };
}

type PlaceDetailFallback = {
  name?: string;
  formattedAddress?: string;
  location?: google.maps.LatLng | google.maps.LatLngLiteral | null;
  types?: string[];
};

function buildPlaceDetailFallbackResult(
  placeId: string,
  fallback: PlaceDetailFallback | undefined,
): Record<string, unknown> | null {
  if (!fallback) return null;
  const latLng = readLatLngLike(fallback.location);
  const name = fallback.name?.trim() || '';
  if (!name && !latLng) return null;
  return {
    place_id: placeId,
    name,
    formatted_address: fallback.formattedAddress || '',
    geometry: latLng ? { location: latLng } : undefined,
    types: fallback.types || [],
    _aboutData: extractPlaceAboutData({}),
  };
}

/**
 * 离线快照优先；无 key 或 SDK 详情失败时，尽量用调用方提供的点击/列表上下文兜底。
 * 当前 SW 快照覆盖 Maps JS/resources，不覆盖 places.googleapis.com 的详情 RPC。
 */
export async function fetchPlaceDetailWithOfflineFirst(options: {
  placeId: string;
  google?: typeof google | null;
  fallback?: PlaceDetailFallback;
}): Promise<Record<string, unknown>> {
  const { placeId, google, fallback } = options;
  const locale = getLocale();
  const offlineRow = await getPlaceDetailOffline(placeId);
  if (offlineRow) {
    const fromOffline = buildPlaceDetailResultFromOfflineRow(offlineRow, google, locale);
    if (fromOffline) {
      const hitKind = offlineRow.details ? '详情' : '基础信息';
      console.log(`[Map][离线] 地点${hitKind}: "${getOfflinePlaceRowName(offlineRow, locale)}" (${placeId.slice(0, 16)}...)`);
      return fromOffline as Record<string, unknown>;
    }
  }

  if (!google) {
    const fromFallback = buildPlaceDetailFallbackResult(placeId, fallback);
    if (fromFallback) {
      console.log(`[Map][离线未命中] 地点详情: ${placeId.slice(0, 16)}... Google SDK 不可用，使用点击上下文兜底`);
      return fromFallback;
    }
    console.log(`[Map][离线未命中] 地点详情: ${placeId.slice(0, 16)}... 未命中离线详情/兜底，Google SDK 不可用`);
    throw new Error(`Place detail missing from offline snapshot and Google Maps SDK is unavailable: ${placeId}`);
  }

  if (!hasGoogleMapsApiKey()) {
    const fromFallback = buildPlaceDetailFallbackResult(placeId, fallback);
    if (fromFallback) {
      console.log(`[Map][离线未命中] 地点详情: ${placeId.slice(0, 16)}... 未配置 key，跳过 Places 详情 RPC，使用点击上下文兜底`);
      return fromFallback;
    }
    console.log(`[Map][离线未命中] 地点详情: ${placeId.slice(0, 16)}... 未配置 key，跳过 Places 详情 RPC`);
    throw new Error(`Place detail missing from offline snapshot and Google Maps key is unavailable: ${placeId}`);
  }
  // 当前 SW 快照覆盖 Maps JS/resources，不覆盖 places.googleapis.com 详情 RPC。
  // 因此只有配置真实 key 时才进入 Place.fetchFields；无 key 离线未命中在上面降级。
  console.log(`[Map][SDK] 地点详情: ${placeId.slice(0, 16)}... 离线快照未命中，使用真实 key 调用 Place.fetchFields`);
  const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
  const place = new Place({ id: placeId, ...placeRequestedLanguage(locale) });
  try {
    await place.fetchFields({ fields: PLACE_ABOUT_FIELDS });
    const p = place as google.maps.places.Place & Record<string, unknown>;
    try {
      cachePlaceDetail(buildOfflinePlaceRowFromFetchedPlace(p));
    } catch {
      /* 缓存失败不影响主流程 */
    }
    return buildPlaceDetailResultFromFetchedPlace(p);
  } catch (error) {
    const fromFallback = buildPlaceDetailFallbackResult(placeId, fallback);
    if (fromFallback) {
      console.log(`[Map][离线未命中] 地点详情: ${placeId.slice(0, 16)}... SDK 详情请求失败，使用点击上下文兜底`);
      return fromFallback;
    }
    throw error;
  }
}

export { buildPlaceDetailResultFromFetchedPlace };

/** 从详情结果读取坐标（兼容 LatLng 与离线构造） */
export function getLatLngFromPlaceDetailResult(
  result: Record<string, unknown>,
): { lat: number; lng: number } | null {
  const g = result.geometry as { location?: google.maps.LatLng | google.maps.LatLngLiteral } | undefined;
  return readLatLngLike(g?.location);
}
