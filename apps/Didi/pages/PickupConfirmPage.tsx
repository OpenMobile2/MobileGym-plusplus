import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C, OrangeBtn } from '../components/ui';
import { DidiGoogleMap, type DidiGeoMarker } from '../components/DidiGoogleMap';
import {
  distanceBetweenMapPoints,
  getMapPlace,
  getNearbyPlaces,
  getPickupPointLatLng,
  getPickupPoints,
  getPlaceDistanceKm,
  getPlaceLatLng,
} from '../data/mapPlaces';
import { IcLocate, IcNavBack, IcSearch } from '../res/icons';

function nearestMarker(markers: DidiGeoMarker[], center: { lat: number; lng: number }) {
  return [...markers].sort((left, right) => (
    distanceBetweenMapPoints(left.position, center)
    - distanceBetweenMapPoints(right.position, center)
  ))[0];
}

/** 确认地图位置 —— 证据 s38、recE、recH */
export default function PickupConfirmPage() {
  const { bindTap, bindBack } = useDidiGestures();
  const mapPickerSource = useDidiStore((state) => state.mapPickerSource);
  const mapPickerMode = useDidiStore((state) => state.mapPickerMode);
  const mapAnchorId = useDidiStore((state) => state.mapAnchorId);
  const selectedMapPlaceId = useDidiStore((state) => state.selectedMapPlaceId);
  const selectedPickupId = useDidiStore((state) => state.selectedPickupId);
  const setPlaceSearchTarget = useDidiStore((state) => state.setPlaceSearchTarget);
  const focusMapPlace = useDidiStore((state) => state.focusMapPlace);
  const selectPickupCandidate = useDidiStore((state) => state.selectPickupCandidate);
  const selectMapDestination = useDidiStore((state) => state.selectMapDestination);
  const chooseDest = useDidiStore((state) => state.chooseDest);
  const [mapInstance, setMapInstance] = React.useState(0);

  const anchor = getMapPlace(mapAnchorId);
  const anchorPosition = getPlaceLatLng(anchor);
  const pickupCandidates = React.useMemo(() => getPickupPoints(anchor), [anchor]);
  const destinationCandidates = React.useMemo(() => getNearbyPlaces(anchor, 4), [anchor]);
  const pickupMode = mapPickerMode === 'pickup';
  const markers = React.useMemo<DidiGeoMarker[]>(
    () => pickupMode
      ? pickupCandidates.map((point) => ({
          id: point.id,
          label: point.name,
          detail: point.detail,
          position: getPickupPointLatLng(anchor, point),
          recommended: point.official,
        }))
      : destinationCandidates.map((place) => ({
          id: place.id,
          label: place.name,
          detail: place.address,
          position: getPlaceLatLng(place),
          recommended: place.id === anchor.id || place.recommended,
        })),
    [anchor, destinationCandidates, pickupCandidates, pickupMode],
  );
  const selectedMarkerId = pickupMode ? selectedPickupId : selectedMapPlaceId;
  const selectedDestination = getMapPlace(selectedMapPlaceId);

  const pickMarker = (markerId: string) => {
    if (pickupMode) {
      selectPickupCandidate(anchor.id, markerId);
    } else {
      selectMapDestination(markerId);
    }
  };

  const handleMapSettled = (center: { lat: number; lng: number }) => {
    const nearest = nearestMarker(markers, center);
    if (nearest) pickMarker(nearest.id);
  };

  const recenterMap = () => {
    setMapInstance((value) => value + 1);
    if (pickupMode) {
      selectPickupCandidate(anchor.id, getPickupPoints(anchor)[0].id);
    } else {
      focusMapPlace(anchor.id);
    }
  };

  const confirmBinding = pickupMode && mapPickerSource === 'home'
    ? bindBack<HTMLButtonElement>()
    : bindTap<HTMLButtonElement>('car.select.fromPickup', {
        beforeTrigger: () => {
          if (!pickupMode) chooseDest(selectedDestination.name);
        },
      });

  return (
    <div className="flex h-full flex-col bg-app-bg">
      <div className="flex shrink-0 items-center gap-2 bg-app-surface px-2 py-2">
        <button {...bindBack()} className="border-none bg-transparent p-1 text-app-text" aria-label="返回">
          <IcNavBack size={22} />
        </button>
        <button
          {...bindTap('pickup.search.open', {
            beforeTrigger: () => setPlaceSearchTarget(pickupMode ? 'pickup' : 'destination', true),
          })}
          className="flex flex-1 items-center rounded-lg border-none bg-[#f5f6fa] px-3 py-2 text-left"
          data-testid="didi-map-search"
        >
          <span
            className="mr-2 h-2 w-2 shrink-0 rounded-full"
            style={{ background: pickupMode ? C.green : C.orange }}
          />
          <span className="min-w-0 flex-1 truncate text-[14px] text-app-text-muted">
            {pickupMode ? `搜索起点 · ${anchor.name}` : `搜索目的地 · ${selectedDestination.name}`}
          </span>
          <IcSearch size={16} color="#8b949f" />
        </button>
      </div>

      <div className="relative shrink-0" data-action="pickup.confirm.pan">
        <DidiGoogleMap
          key={`${anchor.id}-${mapInstance}`}
          height={430}
          center={anchorPosition}
          initialZoom={17}
          markers={markers}
          selectedMarkerId={selectedMarkerId}
          onMarkerSelect={pickMarker}
          markerColor={pickupMode ? C.green : C.orange}
          recenterToken={mapInstance}
          onViewportSettled={handleMapSettled}
        />
        <button
          {...bindTap(
            { kind: 'action', id: 'pickup.confirm.locate' },
            { onTrigger: recenterMap },
          )}
          className="absolute bottom-3 right-3 z-[4] flex h-10 w-10 items-center justify-center rounded-full border-none bg-white text-app-text shadow"
          aria-label="回到当前区域"
        >
          <IcLocate size={20} />
        </button>
      </div>

      <div
        className="relative -mt-3 flex-1 overflow-y-auto rounded-t-xl bg-app-surface px-3 pb-4 pt-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-1 text-[20px] font-bold text-app-text">
          {pickupMode ? '请选择出发区域' : '请选择目的地'}
        </div>
        <div className="mb-3 mt-1 px-1 text-[12px] leading-5 text-app-text-muted">
          {pickupMode
            ? '单指移动、双指缩放地图；已自动识别中心附近可安全停靠的位置'
            : '单指移动、双指缩放或点击地图地点，确认后进入车型和路线预估'}
        </div>

        {pickupMode ? (
          pickupCandidates.map((point) => {
            const active = selectedPickupId === point.id;
            return (
              <button
                key={point.id}
                {...bindTap(
                  { kind: 'action', id: 'pickup.confirm.pick' },
                  { onTrigger: () => selectPickupCandidate(anchor.id, point.id) },
                )}
                aria-pressed={active}
                data-testid={`didi-pickup-option-${point.id}`}
                className="mb-2 flex w-full items-center rounded-md border px-3 py-3 text-left"
                style={{
                  background: active ? '#f0fbf6' : '#f6f7f9',
                  borderColor: active ? C.green : 'transparent',
                }}
              >
                <span
                  className="mr-2.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: active ? C.green : '#92a0ad' }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-app-text">{point.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-app-text-muted">{point.detail}</span>
                </span>
                <span className="ml-2 shrink-0 text-[11px]" style={{ color: active ? C.green : '#8b949f' }}>
                  {point.official ? '官方推荐' : `步行${point.walkMinutes}分钟`}
                </span>
              </button>
            );
          })
        ) : (
          destinationCandidates.map((place) => {
            const active = selectedMapPlaceId === place.id;
            return (
              <button
                key={place.id}
                {...bindTap(
                  { kind: 'action', id: 'pickup.confirm.pick' },
                  { onTrigger: () => selectMapDestination(place.id) },
                )}
                aria-pressed={active}
                data-testid={`didi-map-destination-${place.id}`}
                className="mb-2 flex w-full items-center rounded-md border px-3 py-3 text-left"
                style={{
                  background: active ? '#fff5ef' : '#f6f7f9',
                  borderColor: active ? C.orange : 'transparent',
                }}
              >
                <span
                  className="mr-2.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: active ? C.orange : '#92a0ad' }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-app-text">{place.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-app-text-muted">{place.address}</span>
                </span>
                <span className="ml-2 shrink-0 text-[11px] text-app-text-muted">
                  {getPlaceDistanceKm(place) < 1
                    ? `${Math.round(getPlaceDistanceKm(place) * 1000)}m`
                    : `${getPlaceDistanceKm(place).toFixed(1)}km`}
                </span>
              </button>
            );
          })
        )}

      </div>

      <div className="shrink-0 bg-app-surface px-3 pb-3 pt-2 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <OrangeBtn bind={confirmBinding}>
          {pickupMode ? (mapPickerSource === 'home' ? '确认定位' : '确认上车点') : '确认目的地'}
        </OrangeBtn>
      </div>
    </div>
  );
}
