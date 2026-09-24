import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { C } from '../components/ui';
import {
  IcBriefcase,
  IcBuilding,
  IcClose,
  IcHome,
  IcHospital,
  IcHotel,
  IcLandmark,
  IcMapSelect,
  IcMic,
  IcNavBack,
  IcPark,
  IcPin,
  IcPlane,
  IcSchool,
  IcShopping,
  IcStar,
  IcStore,
  IcTrain,
} from '../res/icons';
import {
  MAP_PLACES,
  findMapPlaceByName,
  searchMapPlaces,
  type DidiMapPlace,
  type DidiPlaceCategory,
} from '../data/mapPlaces';

const CATEGORY_ICON: Record<DidiPlaceCategory, React.ComponentType<{ size?: number; color?: string }>> = {
  residence: IcHome,
  station: IcTrain,
  airport: IcPlane,
  mall: IcShopping,
  office: IcBuilding,
  park: IcPark,
  hotel: IcHotel,
  hospital: IcHospital,
  school: IcSchool,
  landmark: IcLandmark,
  restaurant: IcStore,
};

function distanceText(distanceKm: number) {
  if (distanceKm < 1) return `${Math.max(36, Math.round(distanceKm * 1000))}m`;
  return `${distanceKm.toFixed(distanceKm >= 100 ? 0 : 1)}km`;
}

function SearchSkeleton({ label }: { label: string }) {
  return (
    <div className="px-3 py-2" aria-label={label}>
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-app-border px-1 py-3.5">
          <div className="h-5 w-5 animate-pulse rounded bg-[#edf0f3]" />
          <div className="flex-1">
            <div className="h-3.5 w-[58%] animate-pulse rounded bg-[#e9ecef]" />
            <div className="mt-2 h-3 w-[78%] animate-pulse rounded bg-[#f0f2f4]" />
          </div>
          <div className="h-3 w-9 animate-pulse rounded bg-[#edf0f3]" />
        </div>
      ))}
    </div>
  );
}

/** 地点搜索 —— 证据 recB、recE、recH、m06 */
export default function DestSearchPage() {
  const { bindTap, back } = useDidiGestures();
  const s = useDidiStrings();
  const toast = useDidiStore((state) => state.toast);
  const destQuery = useDidiStore((state) => state.destQuery);
  const setDestQuery = useDidiStore((state) => state.setDestQuery);
  const setMapPickerSource = useDidiStore((state) => state.setMapPickerSource);
  const setMapPickerMode = useDidiStore((state) => state.setMapPickerMode);
  const chooseDest = useDidiStore((state) => state.chooseDest);
  const choosePickupPlace = useDidiStore((state) => state.choosePickupPlace);
  const selectMapDestination = useDidiStore((state) => state.selectMapDestination);
  const placeSearchTarget = useDidiStore((state) => state.placeSearchTarget);
  const placeSearchFromMap = useDidiStore((state) => state.placeSearchFromMap);
  const addresses = useDidiStore((state) => state.addresses);
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  const home = addresses.find((address) => address.label === '家');
  const work = addresses.find((address) => address.label === '公司');

  React.useEffect(() => {
    if (!destQuery.trim()) {
      setIsSearching(false);
      return undefined;
    }
    setIsSearching(true);
    const timer = window.setTimeout(() => setIsSearching(false), 260);
    return () => window.clearTimeout(timer);
  }, [destQuery]);

  const results = React.useMemo(() => {
    const matched = favoritesOnly
      ? MAP_PLACES.filter((place) => place.favorite)
      : searchMapPlaces(destQuery, 40);
    if (destQuery.trim() || favoritesOnly) return matched;

    const recentIds = addresses
      .filter((address) => address.label === '历史')
      .map((address) => findMapPlaceByName(address.name)?.id)
      .filter((id): id is string => Boolean(id));
    return [...matched].sort((left, right) => {
      const leftRecent = recentIds.indexOf(left.id);
      const rightRecent = recentIds.indexOf(right.id);
      if (leftRecent >= 0 || rightRecent >= 0) {
        if (leftRecent < 0) return 1;
        if (rightRecent < 0) return -1;
        return leftRecent - rightRecent;
      }
      return Number(Boolean(right.recommended)) - Number(Boolean(left.recommended))
        || left.distanceKm - right.distanceKm;
    });
  }, [addresses, destQuery, favoritesOnly]);

  const groupedResults = React.useMemo(() => {
    const groups = new Map<string, DidiMapPlace[]>();
    results.forEach((place) => {
      const group = groups.get(place.city) ?? [];
      group.push(place);
      groups.set(place.city, group);
    });
    return Array.from(groups.entries());
  }, [results]);

  const pickupTarget = placeSearchTarget === 'pickup';
  const returnToMap = pickupTarget || placeSearchFromMap;
  const closeSearchBind = returnToMap
    ? bindTap('pickup.search.close')
    : bindTap({ kind: 'action', id: 'dest.search.close' }, { onTrigger: () => back() });

  const selectPlaceBind = (place: DidiMapPlace) => (
    pickupTarget
      ? bindTap<HTMLButtonElement>('pickup.search.close', {
          beforeTrigger: () => choosePickupPlace(place.id),
        })
      : returnToMap
        ? bindTap<HTMLButtonElement>('pickup.search.close', {
            beforeTrigger: () => selectMapDestination(place.id),
          })
        : bindTap<HTMLButtonElement>('car.select.open', {
            // Preserve an exact saved-address query (for example a specific
            // gate) instead of collapsing it to the broader parent POI.
            beforeTrigger: () => {
              const query = destQuery.trim();
              const exactAddress = addresses.find((address) => address.name === query);
              const exactPlace = exactAddress ? findMapPlaceByName(exactAddress.name) : null;
              chooseDest(exactPlace?.id === place.id ? exactAddress!.name : place.name);
            },
          })
  );

  const selectAddressBind = (name: string) => {
    const place = findMapPlaceByName(name) ?? MAP_PLACES[0];
    return pickupTarget
      ? bindTap<HTMLButtonElement>('pickup.search.close', {
          beforeTrigger: () => choosePickupPlace(place.id),
        })
      : returnToMap
        ? bindTap<HTMLButtonElement>('pickup.search.close', {
            beforeTrigger: () => selectMapDestination(place.id),
          })
        : bindTap<HTMLButtonElement>('car.select.open', {
            beforeTrigger: () => chooseDest(name),
          });
  };

  return (
    <div className="relative flex h-full flex-col bg-app-bg">
      <div className="flex shrink-0 items-center gap-2 bg-app-surface px-2 py-2">
        <button
          {...closeSearchBind}
          className="border-none bg-transparent p-1 text-app-text"
          aria-label={s.back}
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex flex-1 items-center rounded-lg bg-[#f5f6fa] px-3 py-2">
          <span className="mr-2 h-2 w-2 shrink-0 rounded-full" style={{ background: C.green }} />
          <input
            data-action="dest.search.input"
            data-action-type="input"
            autoFocus
            value={destQuery}
            onChange={(event) => {
              setFavoritesOnly(false);
              setDestQuery(event.target.value);
            }}
            placeholder={pickupTarget ? s.searchPickupPlaceholder : s.searchDestinationPlaceholder}
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-app-text outline-none"
            data-testid="didi-place-search-input"
          />
          {destQuery && (
            <button
              {...bindTap(
                { kind: 'action', id: 'dest.search.clear' },
                { onTrigger: () => setDestQuery('') },
              )}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border-none bg-[#dfe3e8] text-white"
              aria-label={s.searchClear}
            >
              <IcClose size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-2 bg-app-surface px-3 pb-2.5 pt-1">
        {home && (
          <button
            {...selectAddressBind(home.name)}
            className="flex items-center justify-center gap-1 rounded-md border-none bg-[#f7f8fa] py-2 text-[13px] text-app-text"
          >
            <IcHome size={14} />{s.searchHome}
          </button>
        )}
        {work && (
          <button
            {...selectAddressBind(work.name)}
            className="flex items-center justify-center gap-1 rounded-md border-none bg-[#f7f8fa] py-2 text-[13px] text-app-text"
          >
            <IcBriefcase size={14} />{s.searchWork}
          </button>
        )}
        <button
          {...bindTap(
            { kind: 'action', id: 'dest.search.favorite.toggle' },
            { onTrigger: () => setFavoritesOnly((value) => !value) },
          )}
          aria-pressed={favoritesOnly}
          className="flex items-center justify-center gap-1 rounded-md border-none py-2 text-[13px]"
          style={{
            color: favoritesOnly ? C.orangeDeep : C.dark,
            background: favoritesOnly ? '#fff0e8' : '#f7f8fa',
          }}
        >
          <IcStar size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />{s.searchFavorites}
        </button>
        {returnToMap ? (
          <button
            {...bindTap('pickup.search.close')}
            className="flex items-center justify-center gap-1 rounded-md border-none bg-[#f7f8fa] py-2 text-[13px] text-app-text"
          >
            <IcMapSelect size={14} />{s.searchMapPick}
          </button>
        ) : (
          <button
            {...bindTap('pickup.confirm.open', {
              beforeTrigger: () => {
                setMapPickerSource('destination');
                setMapPickerMode('destination');
              },
            })}
            className="flex items-center justify-center gap-1 rounded-md border-none bg-[#f7f8fa] py-2 text-[13px] text-app-text"
          >
            <IcMapSelect size={14} />{s.searchMapPick}
          </button>
        )}
      </div>

      <div
        className="mt-2 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        data-testid="didi-place-results"
      >
        {isSearching ? (
          <div className="bg-app-surface">
            <SearchSkeleton label={s.searchLoading} />
          </div>
        ) : (
          <>
            {groupedResults.map(([city, places]) => (
              <section key={city} className="mb-2 bg-app-surface">
                <div className="px-4 pb-1 pt-3 text-[13px] font-semibold text-app-text">{city}</div>
                {places.map((place) => {
                  const CategoryIcon = CATEGORY_ICON[place.category] ?? IcPin;
                  return (
                    <button
                      key={place.id}
                      {...selectPlaceBind(place)}
                      data-testid={`didi-place-result-${place.id}`}
                      className="flex w-full items-center overflow-hidden border-none border-b border-app-border bg-transparent px-4 py-3 text-left"
                    >
                      <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center text-app-text-muted">
                        <CategoryIcon size={18} color={place.recommended ? C.green : '#8b949f'} />
                      </span>
                      <span className="min-w-0 flex-1 overflow-hidden pr-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-app-text" title={place.name}>
                            {place.name}
                          </span>
                          {place.metro && (
                            <span
                              className="max-w-[72px] shrink-0 truncate rounded border px-1 text-[10px]"
                              style={{ color: C.green, borderColor: C.green }}
                              title={place.metro}
                            >
                              {place.metro}
                            </span>
                          )}
                        </span>
                        <span
                          className="mt-1 block max-w-full truncate text-[11px] leading-4 text-app-text-muted"
                          title={place.address}
                        >
                          {place.address}
                        </span>
                      </span>
                      <span className="ml-2 flex w-11 shrink-0 flex-col items-end gap-1 text-[11px] text-app-text-muted">
                        <span>{distanceText(place.distanceKm)}</span>
                        {place.favorite && <IcStar size={13} color="#9aa2ab" />}
                      </span>
                    </button>
                  );
                })}
              </section>
            ))}

            {groupedResults.length === 0 && (
              <div className="bg-app-surface px-4 py-10 text-center">
                <IcMapSelect size={28} color="#a2aab4" className="mx-auto" />
                <div className="mt-3 text-[14px] font-medium text-app-text">{s.searchEmptyTitle}</div>
                <div className="mt-1 text-[12px] text-app-text-muted">{s.searchEmptyHint}</div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center">
        <button
          {...bindTap(
            { kind: 'action', id: 'dest.search.voice' },
            { onTrigger: () => toast(s.searchVoiceUnavailable) },
          )}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border-none bg-[#ffefe9] px-4 py-2 text-[13px] text-app-text shadow"
        >
          <IcMic size={16} />{s.searchVoicePrompt}
        </button>
      </div>
    </div>
  );
}
