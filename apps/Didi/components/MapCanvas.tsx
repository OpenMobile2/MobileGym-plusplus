import React, { useId, useRef, useState } from 'react';
import { poseAlongRoute, routePathD } from './tripRoute';

export type MapPanPosition = { x: number; y: number };
export type MapMarker = {
  id: string;
  label: string;
  detail?: string;
  x: number;
  y: number;
  recommended?: boolean;
};

const SELECTABLE_SCALE = 1.5;
const PAN_LIMIT = { x: 76, y: 58 } as const;
const ROUTE_PATH = routePathD();
/** 行程中：剩余路程（未驶） */
const ROUTE_REMAINING = '#13b879';
/** 行程中：已驶路程（浅绿色） */
const ROUTE_TRAVELED = '#A8E6C8';
/** 非实时静态整段路线 */
const ROUTE_SOLID = '#13b879';

type MapCanvasProps = {
  height?: number;
  route?: boolean;
  car?: boolean;
  /** 0–1，沿主路线的车辆进度；传入后覆盖默认静止车标 */
  carProgress?: number;
  /** 已行驶路段高亮截止进度（0–1） */
  traveledProgress?: number;
  pinStart?: string;
  pinEnd?: string;
  children?: React.ReactNode;
  dim?: boolean;
  selectable?: boolean;
  onPositionChange?: (position: MapPanPosition, settled: boolean) => void;
  markers?: MapMarker[];
  selectedMarkerId?: string;
  onMarkerSelect?: (markerId: string) => void;
  markerColor?: string;
};

/**
 * Deterministic offline city map. The geometry is intentionally richer than a
 * decorative backdrop so ride, pickup and route screens read as map surfaces.
 */
export function MapCanvas({
  height = 220,
  route = false,
  car = false,
  carProgress,
  traveledProgress,
  pinStart,
  pinEnd,
  children,
  dim = false,
  selectable = false,
  onPositionChange,
  markers = [],
  selectedMarkerId,
  onMarkerSelect,
  markerColor = '#13b879',
}: MapCanvasProps) {
  const id = useId().replace(/:/g, '');
  const mapShadow = `didi-map-shadow-${id}`;
  const locationGlow = `didi-map-location-${id}`;
  const [pan, setPan] = useState<MapPanPosition>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const panRef = useRef(pan);
  const suppressMarkerClickRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: MapPanPosition;
  } | null>(null);

  const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

  const updatePan = (next: MapPanPosition, settled: boolean) => {
    panRef.current = next;
    setPan(next);
    onPositionChange?.(next, settled);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectable) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: panRef.current,
    };
    suppressMarkerClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    onPositionChange?.(panRef.current, false);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!selectable || !drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) {
      suppressMarkerClickRef.current = true;
    }
    const next = {
      x: clamp(drag.origin.x + event.clientX - drag.startX, PAN_LIMIT.x),
      y: clamp(drag.origin.y + event.clientY - drag.startY, PAN_LIMIT.y),
    };
    updatePan(next, false);
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!selectable || !drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onPositionChange?.(panRef.current, true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selectable || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const step = 24;
    const next = {
      x: clamp(
        panRef.current.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
        PAN_LIMIT.x,
      ),
      y: clamp(
        panRef.current.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0),
        PAN_LIMIT.y,
      ),
    };
    updatePan(next, true);
  };

  const renderedMarkers = selectedMarkerId
    ? [...markers].sort(
        (left, right) => Number(left.id === selectedMarkerId) - Number(right.id === selectedMarkerId),
      )
    : markers;

  const liveCar = car && carProgress != null
    ? poseAlongRoute(carProgress)
    : null;
  const trailEnd = traveledProgress != null
    ? Math.max(0, Math.min(1, traveledProgress))
    : null;

  return (
    <div
      className="relative w-full select-none overflow-hidden bg-[#e7edf7]"
      style={{ height, touchAction: selectable ? 'none' : 'auto' }}
      role={selectable ? 'application' : undefined}
      tabIndex={selectable ? 0 : undefined}
      aria-label={selectable ? '可拖动的上车点地图' : '模拟城市地图'}
      data-map-selectable={selectable ? 'true' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onKeyDown={handleKeyDown}
    >
      <svg
        viewBox="0 0 360 260"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={route ? '云江市驾车路线图' : '云江市当前位置地图'}
        style={{
          transform: selectable
            ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${SELECTABLE_SCALE})`
            : undefined,
          transformOrigin: 'center',
          transition: selectable && !dragging ? 'transform 160ms ease-out' : 'none',
          cursor: selectable ? (dragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <defs>
          <filter id={mapShadow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#72839a" floodOpacity="0.34" />
          </filter>
          <radialGradient id={locationGlow} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#3887f7" stopOpacity="0.28" />
            <stop offset="0.58" stopColor="#3887f7" stopOpacity="0.14" />
            <stop offset="1" stopColor="#3887f7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Land, river and parks */}
        <rect width="360" height="260" fill="#e8eef8" />
        <path d="M-18 25 C42 42 80 52 122 82 C165 113 204 118 378 108 L378 132 C228 143 168 137 111 103 C66 76 28 68 -18 58Z" fill="#cfe5f5" />
        <path d="M-12 31 C40 48 81 60 119 86 C168 120 215 125 370 116" fill="none" stroke="#b7d4ea" strokeWidth="2" />
        <path d="M2 120 C47 105 77 109 111 132 C133 147 139 184 116 222 C91 263 29 271 -8 248Z" fill="#cdeecf" />
        <path d="M238 -6 C273 13 298 35 309 68 C320 101 303 122 267 123 C235 123 213 101 214 67 C215 34 223 10 238 -6Z" fill="#d3efd5" />
        <path d="M248 177 C280 157 329 163 370 190 L370 268 L259 268 C244 240 234 204 248 177Z" fill="#d8efd4" />

        {/* Building parcels */}
        <g fill="#e0e6ef" stroke="#d6dee9" strokeWidth="0.7">
          <path d="M8 5h54l8 28-49 9z" />
          <path d="M77 5h45l-7 34-36-4z" />
          <path d="M130 7h55l-3 40-55-9z" />
          <path d="M318 7h36v44l-28-8z" />
          <path d="M7 75l52 12-8 29-46-7z" />
          <path d="M70 76l38 19-10 25-39-12z" />
          <path d="M145 61l54 9-3 34-48-12z" />
          <path d="M314 89l40-7v37l-42 1z" />
          <path d="M145 150l46-5 7 30-51 8z" />
          <path d="M205 150l35-4 5 33-34 6z" />
          <path d="M132 198l55-9 4 37-62 8z" />
          <path d="M199 196l42-7 4 39-43 8z" />
          <path d="M22 231l48-8 7 35H18z" />
          <path d="M83 231l36-9 2 36H84z" />
          <path d="M275 225l35-13 15 43h-44z" />
          <path d="M323 208l31-4v51h-19z" />
        </g>

        {/* Neighborhood streets: blue-gray casings with white centers */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke="#d1dbe8" strokeWidth="5.5">
            <path d="M14 -8L65 272" />
            <path d="M126 -10L101 270" />
            <path d="M194 -10L205 270" />
            <path d="M293 -10L273 270" />
            <path d="M-10 68L370 184" />
            <path d="M-12 185L370 139" />
            <path d="M12 244L350 199" />
            <path d="M38 4L344 83" />
          </g>
          <g stroke="#ffffff" strokeWidth="3.2">
            <path d="M14 -8L65 272" />
            <path d="M126 -10L101 270" />
            <path d="M194 -10L205 270" />
            <path d="M293 -10L273 270" />
            <path d="M-10 68L370 184" />
            <path d="M-12 185L370 139" />
            <path d="M12 244L350 199" />
            <path d="M38 4L344 83" />
          </g>
          <g stroke="#ffffff" strokeWidth="2.2">
            <path d="M15 118C54 125 84 146 111 174" />
            <path d="M18 209C54 187 89 176 125 176" />
            <path d="M132 128C163 139 184 143 225 140" />
            <path d="M219 35C239 54 252 73 260 100" />
            <path d="M246 144C285 147 322 146 356 134" />
            <path d="M251 191C286 183 320 185 354 198" />
            <path d="M213 239C248 233 278 237 309 251" />
          </g>
        </g>

        {/* Expressway and interchange */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-18 166C46 154 89 142 136 112C182 82 230 69 378 55" stroke="#b9c6d8" strokeWidth="14" />
          <path d="M-18 166C46 154 89 142 136 112C182 82 230 69 378 55" stroke="#dbe3ed" strokeWidth="9" />
          <path d="M-18 166C46 154 89 142 136 112C182 82 230 69 378 55" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="7 7" />

          <path d="M242 -14C237 29 225 59 206 85C186 111 155 133 135 162C112 196 107 227 111 274" stroke="#aebdd0" strokeWidth="15" />
          <path d="M242 -14C237 29 225 59 206 85C186 111 155 133 135 162C112 196 107 227 111 274" stroke="#d6e0ec" strokeWidth="9.5" />
          <path d="M242 -14C237 29 225 59 206 85C186 111 155 133 135 162C112 196 107 227 111 274" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="1.5" strokeDasharray="7 7" />

          <path d="M130 115C103 88 103 62 125 48C148 33 184 42 201 65" stroke="#bdc9d9" strokeWidth="8" />
          <path d="M130 115C103 88 103 62 125 48C148 33 184 42 201 65" stroke="#e8edf4" strokeWidth="4.5" />
          <path d="M207 78C237 92 249 115 239 136C229 158 194 165 164 148" stroke="#bdc9d9" strokeWidth="8" />
          <path d="M207 78C237 92 249 115 239 136C229 158 194 165 164 148" stroke="#e8edf4" strokeWidth="4.5" />
          <path d="M169 95C184 111 190 130 184 149" stroke="#d9b979" strokeWidth="3.5" />
        </g>

        {/* Transit line and service boundary */}
        <path d="M328 -10C322 38 315 83 315 134C315 182 326 225 344 270" fill="none" stroke="#9caabc" strokeWidth="2.4" strokeDasharray="4 4" />
        {!route && !selectable && (
          <path d="M62 108L105 91L165 105L219 137L213 188L153 210L89 189L56 150Z" fill="#34bf87" fillOpacity="0.055" stroke="#34bf87" strokeWidth="2.2" strokeDasharray="7 6" />
        )}

        {/* Map labels and POIs */}
        <g fontFamily="system-ui, sans-serif" textAnchor="middle">
          <text x="71" y="164" fill="#9ba9ba" fontSize="15" fontWeight="600">云湾新区</text>
          <text x="71" y="180" fill="#a9b5c4" fontSize="11">云湾壹期</text>
          <text x="269" y="211" fill="#a3afbe" fontSize="12" fontWeight="600">春江里</text>
          <text x="280" y="93" fill="#7e8ea3" fontSize="9" transform="rotate(-6 280 93)">滨江快速路</text>
          <text x="118" y="222" fill="#8998ab" fontSize="9" transform="rotate(-75 118 222)">云江西路</text>
          <text x="322" y="152" fill="#8998ab" fontSize="9" transform="rotate(80 322 152)">地铁 6 号线</text>
          <text x="48" y="139" fill="#719376" fontSize="10">云湾湿地公园</text>
          <text x="270" y="36" fill="#719376" fontSize="10">滨江生态园</text>
        </g>

        <g fontFamily="system-ui, sans-serif" filter={`url(#${mapShadow})`}>
          <g transform="translate(153 73)">
            <circle r="8" fill="#92a9c6" stroke="#fff" strokeWidth="2" />
            <path d="M-3 2v-6h6v6M-1-4v2M1-4v2M-4 2h8" stroke="#fff" strokeWidth="1" fill="none" />
            <text x="0" y="20" textAnchor="middle" fill="#7f8fa4" fontSize="9">云江湾夏荷香</text>
          </g>
          <g transform="translate(308 173)">
            <circle r="7" fill="#8fa8c6" stroke="#fff" strokeWidth="2" />
            <path d="M-3-2h6v4h-6zM-2 2v2M2 2v2" stroke="#fff" strokeWidth="1" fill="none" />
            <text x="0" y="18" textAnchor="middle" fill="#7f8fa4" fontSize="9">云江东站</text>
          </g>
          <g transform="translate(103 197)">
            <circle r="6" fill="#93a9c4" stroke="#fff" strokeWidth="1.5" />
            <text x="0" y="2.5" textAnchor="middle" fill="#fff" fontSize="7">P</text>
            <text x="0" y="17" textAnchor="middle" fill="#7f8fa4" fontSize="8">邻里停车场</text>
          </g>
        </g>

        {/* Suggested pickup point on the home map */}
        {!route && !selectable && (
          <g filter={`url(#${mapShadow})`}>
            <circle cx="176" cy="146" r="5.5" fill="#20b978" stroke="#fff" strokeWidth="2" />
            <rect x="183" y="134" width="54" height="20" rx="5" fill="#34b982" />
            <text x="210" y="147.5" textAnchor="middle" fill="#fff" fontFamily="system-ui, sans-serif" fontSize="9.5">距离更近</text>
          </g>
        )}

        {selectable && renderedMarkers.map((marker) => {
          const selected = marker.id === selectedMarkerId;
          const bubbleX = Math.max(-marker.x + 8, Math.min(-66, 352 - marker.x - 132));
          const shortLabel = marker.label.length > 14
            ? `${marker.label.slice(0, 13)}…`
            : marker.label;
          return (
            <g
              key={marker.id}
              transform={`translate(${marker.x} ${marker.y})`}
              role="button"
              tabIndex={0}
              aria-label={`选择${marker.label}`}
              aria-pressed={selected}
              onClick={(event) => {
                event.stopPropagation();
                if (suppressMarkerClickRef.current) {
                  suppressMarkerClickRef.current = false;
                  return;
                }
                onMarkerSelect?.(marker.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                onMarkerSelect?.(marker.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              {selected && (
                <g filter={`url(#${mapShadow})`}>
                  <rect x={bubbleX} y="-51" width="132" height="18" rx="5" fill={markerColor} />
                  <text
                    x={bubbleX + 66}
                    y="-39"
                    textAnchor="middle"
                    fill="#fff"
                    fontFamily="system-ui, sans-serif"
                    fontSize="9"
                    fontWeight="700"
                  >
                    {marker.recommended ? '官方推荐' : '附近可上车'}
                  </text>
                  <rect x={bubbleX} y="-33" width="132" height="27" rx="5" fill="#fff" />
                  <text
                    x={bubbleX + 66}
                    y="-16"
                    textAnchor="middle"
                    fill="#27313d"
                    fontFamily="system-ui, sans-serif"
                    fontSize="8.5"
                    fontWeight="600"
                  >
                    {shortLabel}
                  </text>
                  <path d="M-1-6L0 0L7-6Z" fill="#fff" />
                </g>
              )}
              <circle
                r={selected ? 7 : 5.5}
                fill={markerColor}
                fillOpacity={selected ? 1 : 0.78}
                stroke="#fff"
                strokeWidth={selected ? 2.5 : 2}
                filter={`url(#${mapShadow})`}
              />
              {selected && <circle r="2" fill="#fff" />}
            </g>
          );
        })}

        {/* Route, start and destination markers */}
        {route && (
          <g filter={`url(#${mapShadow})`}>
            {/* 白色描边 */}
            <path d={ROUTE_PATH} stroke="#ffffff" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {trailEnd != null ? (
              <>
                {/* 底层：整段=剩余路程（绿色） */}
                <path
                  d={ROUTE_PATH}
                  stroke={ROUTE_REMAINING}
                  strokeWidth="5.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  data-testid="didi-route-remaining"
                />
                {/* 上层：起点→车标=已驶路程（浅绿色），盖住对应绿色段 */}
                <path
                  d={ROUTE_PATH}
                  stroke={ROUTE_TRAVELED}
                  strokeWidth="5.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={`${trailEnd} ${Math.max(0.001, 1 - trailEnd)}`}
                  data-testid="didi-route-traveled"
                  data-traveled-progress={trailEnd.toFixed(3)}
                />
              </>
            ) : (
              <path
                d={ROUTE_PATH}
                stroke={ROUTE_SOLID}
                strokeWidth="5.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <circle cx="76" cy="229" r="7" fill="#13b879" stroke="#fff" strokeWidth="2.5" />
            <circle cx="76" cy="229" r="2" fill="#fff" />
            <path d="M260 27c-8 0-14 6-14 14 0 10 14 22 14 22s14-12 14-22c0-8-6-14-14-14z" fill="#ff7046" stroke="#fff" strokeWidth="2" />
            <circle cx="260" cy="41" r="4" fill="#fff" />
          </g>
        )}

        {/* Current location */}
        {!route && (
          <g>
            <circle cx="190" cy="174" r="34" fill={`url(#${locationGlow})`} />
            <path d="M173 201L190 178L207 201Z" fill="#3887f7" fillOpacity="0.15" />
            <circle cx="190" cy="174" r="8" fill="#fff" filter={`url(#${mapShadow})`} />
            <circle cx="190" cy="174" r="5" fill="#3887f7" />
          </g>
        )}

        {/* Vehicle marker */}
        {car && (
          <g
            transform={
              liveCar
                ? `translate(${liveCar.x} ${liveCar.y}) rotate(${liveCar.angle})`
                : route
                  ? 'translate(153 109) rotate(-36)'
                  : 'translate(184 164) rotate(-18)'
            }
            filter={`url(#${mapShadow})`}
            data-testid="didi-live-car"
            data-car-progress={carProgress != null ? carProgress.toFixed(3) : undefined}
          >
            {liveCar && (
              <circle cx="0" cy="0" r="16" fill="#ff7d41" fillOpacity="0.18">
                <animate attributeName="r" values="12;18;12" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.35;0.08;0.35" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            <ellipse cx="0" cy="7" rx="13" ry="4" fill="#718096" fillOpacity="0.24" />
            <rect x="-12" y="-7" width="24" height="14" rx="5" fill="#ffffff" stroke="#293748" strokeWidth="1.4" />
            <path d="M-6-5L-3-9H5L9-5Z" fill="#86c8e8" stroke="#293748" strokeWidth="1" />
            <path d="M-8-1H8" stroke="#d8e1eb" strokeWidth="1.3" />
            <circle cx="-7" cy="7" r="2" fill="#263343" />
            <circle cx="7" cy="7" r="2" fill="#263343" />
          </g>
        )}
      </svg>

      {dim && <div className="absolute inset-0 bg-black/25" />}

      {pinStart && (
        <div className="absolute bottom-3 left-3 max-w-[75%]">
          <div className="rounded-md bg-white px-2.5 py-1.5 text-[12px] leading-tight text-app-text shadow">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#13b879] align-middle" />
            {pinStart}
          </div>
        </div>
      )}
      {pinEnd && (
        <div className="absolute right-3 top-3 max-w-[70%]">
          <div className="rounded-md bg-white px-2.5 py-1.5 text-[12px] leading-tight text-app-text shadow">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#ff7046] align-middle" />
            {pinEnd}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
