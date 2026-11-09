import React from 'react';
import { GoogleMap } from '../../Map/components/GoogleMap';
import { MapMarker } from '../../Map/components/MapMarker';
import { selectGoogle, useMapStore } from '../../Map/state';
import { ensureGoogleMapsRuntime } from '../../Map/utils/googleMapsRuntime';
import { GOOGLE_MAP_VECTOR_MAP_ID } from '../../Map/constants';
import offlineMapFallbackUrl from '../../Map/sw/files/4c8e4360b2976be3.png';
import {
  DIDI_OFFLINE_MAP_MAX_ZOOM,
  DIDI_OFFLINE_MAP_MIN_ZOOM,
  DIDI_OFFLINE_MAP_CENTER,
  distanceBetweenMapPoints,
  getDidiOfflineMapPanRadius,
} from '../data/mapPlaces';

export type DidiGeoMarker = {
  id: string;
  label: string;
  detail?: string;
  position: { lat: number; lng: number };
  recommended?: boolean;
};

type DidiGoogleMapProps = {
  height: number;
  center: { lat: number; lng: number };
  initialZoom?: number;
  markers?: DidiGeoMarker[];
  selectedMarkerId?: string;
  markerColor?: string;
  interactive?: boolean;
  showSelectionLabel?: boolean;
  recenterToken?: number;
  onMarkerSelect?: (markerId: string) => void;
  onInteractionStateChange?: (moving: boolean) => void;
  onViewportSettled?: (
    center: { lat: number; lng: number },
    zoom: number,
  ) => void;
};

function revealOfflineMapFallback(map: google.maps.Map) {
  const mapDiv = map.getDiv();
  mapDiv.style.setProperty('background-color', 'transparent', 'important');
  if (mapDiv.firstElementChild instanceof HTMLElement) {
    mapDiv.firstElementChild.style.setProperty('background-color', 'transparent', 'important');
  }
}

export function DidiGoogleMap({
  height,
  center,
  initialZoom = 17,
  markers = [],
  selectedMarkerId,
  markerColor = '#13b879',
  interactive = true,
  showSelectionLabel = true,
  recenterToken = 0,
  onMarkerSelect,
  onInteractionStateChange,
  onViewportSettled,
}: DidiGoogleMapProps) {
  const effectiveInitialZoom = Math.min(
    Math.max(initialZoom, DIDI_OFFLINE_MAP_MIN_ZOOM),
    DIDI_OFFLINE_MAP_MAX_ZOOM,
  );
  const google = useMapStore(selectGoogle);
  const [mapInstance, setMapInstance] = React.useState<google.maps.Map | null>(null);
  const [moving, setMoving] = React.useState(false);
  const [zoom, setZoom] = React.useState(effectiveInitialZoom);
  const [viewportCenter, setViewportCenter] = React.useState(center);
  const [viewportSpanMeters, setViewportSpanMeters] = React.useState(0);
  const centerLat = center.lat;
  const centerLng = center.lng;
  const updateMoving = React.useCallback((nextMoving: boolean) => {
    setMoving(nextMoving);
    onInteractionStateChange?.(nextMoving);
  }, [onInteractionStateChange]);

  React.useEffect(() => {
    void ensureGoogleMapsRuntime('zh-Hans').catch((error) => {
      console.error('[DiDi] 离线地图资源加载失败', error);
    });
  }, []);

  React.useEffect(() => {
    if (!mapInstance) return;
    mapInstance.panTo({ lat: centerLat, lng: centerLng });
    mapInstance.setZoom(effectiveInitialZoom);
  }, [centerLat, centerLng, effectiveInitialZoom, mapInstance, recenterToken]);

  React.useEffect(() => {
    if (!mapInstance) return;
    revealOfflineMapFallback(mapInstance);
  }, [mapInstance]);

  const mapOptions = React.useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    scaleControl: true,
    clickableIcons: false,
    keyboardShortcuts: interactive,
    gestureHandling: interactive ? 'greedy' : 'none',
    draggable: interactive,
    draggableCursor: interactive ? 'grab' : undefined,
    draggingCursor: interactive ? 'grabbing' : undefined,
    minZoom: DIDI_OFFLINE_MAP_MIN_ZOOM,
    maxZoom: DIDI_OFFLINE_MAP_MAX_ZOOM,
    mapId: GOOGLE_MAP_VECTOR_MAP_ID,
  }), [interactive]);

  const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId);
  const settleViewport = React.useCallback((map: google.maps.Map) => {
    revealOfflineMapFallback(map);
    const mapCenter = map.getCenter();
    if (!mapCenter) return;
    const nextCenter = { lat: mapCenter.lat(), lng: mapCenter.lng() };
    const rawZoom = map.getZoom() ?? effectiveInitialZoom;
    const nextZoom = Math.min(
      Math.max(rawZoom, DIDI_OFFLINE_MAP_MIN_ZOOM),
      DIDI_OFFLINE_MAP_MAX_ZOOM,
    );

    if (rawZoom !== nextZoom) {
      map.setZoom(nextZoom);
      return;
    }

    const distanceFromSnapshotCenter = distanceBetweenMapPoints(
      nextCenter,
      DIDI_OFFLINE_MAP_CENTER,
    );

    const panRadius = getDidiOfflineMapPanRadius(nextZoom);
    if (distanceFromSnapshotCenter > panRadius) {
      const ratio = panRadius / distanceFromSnapshotCenter;
      map.panTo({
        lat: DIDI_OFFLINE_MAP_CENTER.lat
          + (nextCenter.lat - DIDI_OFFLINE_MAP_CENTER.lat) * ratio,
        lng: DIDI_OFFLINE_MAP_CENTER.lng
          + (nextCenter.lng - DIDI_OFFLINE_MAP_CENTER.lng) * ratio,
      });
      return;
    }

    const mapDiv = map.getDiv();
    const metersPerPixel = (
      156_543.03392
      * Math.cos((nextCenter.lat * Math.PI) / 180)
      / 2 ** nextZoom
    );
    const viewportSpan = Math.hypot(
      mapDiv.clientWidth,
      mapDiv.clientHeight,
    ) * metersPerPixel;

    updateMoving(false);
    setZoom(nextZoom);
    setViewportCenter(nextCenter);
    setViewportSpanMeters(viewportSpan);
    onViewportSettled?.(
      nextCenter,
      nextZoom,
    );
  }, [effectiveInitialZoom, onViewportSettled, updateMoving]);

  const moveToMarker = (marker: DidiGeoMarker) => {
    if (!interactive) return;
    updateMoving(true);
    mapInstance?.panTo(marker.position);
    onMarkerSelect?.(marker.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !mapInstance) return;
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [-64, 0],
      ArrowRight: [64, 0],
      ArrowUp: [0, -64],
      ArrowDown: [0, 64],
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    updateMoving(true);
    mapInstance.panBy(offset[0], offset[1]);
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-[#e8edf3]"
      style={{
        height,
        touchAction: interactive ? 'none' : 'auto',
        backgroundImage: `url(${offlineMapFallbackUrl})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
      role={interactive ? 'application' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? '可拖动和双指缩放的离线上车点地图' : '离线地图预览'}
      data-testid="didi-google-map"
      data-map-provider="shared-google-offline"
      data-map-selectable={interactive ? 'true' : undefined}
      data-map-zoom={zoom.toFixed(1)}
      data-map-min-zoom={DIDI_OFFLINE_MAP_MIN_ZOOM}
      data-map-max-zoom={DIDI_OFFLINE_MAP_MAX_ZOOM}
      data-map-visible-span-meters={Math.round(viewportSpanMeters)}
      data-map-center-lat={viewportCenter.lat.toFixed(6)}
      data-map-center-lng={viewportCenter.lng.toFixed(6)}
      onKeyDown={handleKeyDown}
    >
      <GoogleMap
        center={center}
        zoom={effectiveInitialZoom}
        className="h-full w-full"
        onMapLoad={setMapInstance}
        onInteractionStart={() => updateMoving(true)}
        onIdle={settleViewport}
        options={mapOptions}
      />

      {mapInstance && google && (
        <>
          <MapMarker
            map={mapInstance}
            position={DIDI_OFFLINE_MAP_CENTER}
            title="当前位置"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285f4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2.5,
            }}
            zIndex={700}
          />
          {markers.map((marker) => {
            const selected = marker.id === selectedMarkerId;
            return (
              <MapMarker
                key={marker.id}
                map={mapInstance}
                position={marker.position}
                title={marker.label}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: selected ? 7.5 : 5.5,
                  fillColor: markerColor,
                  fillOpacity: selected ? 1 : 0.78,
                  strokeColor: '#ffffff',
                  strokeWeight: selected ? 2.5 : 2,
                }}
                onClick={() => moveToMarker(marker)}
                zIndex={selected ? 900 : marker.recommended ? 800 : 500}
              />
            );
          })}
        </>
      )}

      {interactive && showSelectionLabel && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[3] flex -translate-x-1/2 -translate-y-full flex-col items-center">
          <div
            className="max-w-[245px] rounded-t-md px-3 py-1 text-[11px] font-semibold text-white shadow"
            style={{ background: markerColor }}
          >
            {moving ? '正在识别附近地点…' : selectedMarker?.recommended ? '官方推荐' : '附近可上车'}
          </div>
          <div className="max-w-[245px] truncate rounded-b-md bg-white px-3 py-1.5 text-[12px] font-medium text-app-text shadow">
            {moving ? '移动地图或双指缩放' : selectedMarker?.label ?? '移动地图选择位置'}
          </div>
          <div className="h-3 w-0.5" style={{ background: markerColor }} />
          <div
            className="h-2.5 w-2.5 rounded-full border-2 border-white shadow"
            style={{ background: markerColor }}
          />
        </div>
      )}

    </div>
  );
}
