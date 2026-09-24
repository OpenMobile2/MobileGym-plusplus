import React from 'react';
import {
  collectRoadSegments,
  ensureRoadNetwork,
  isRoadNetworkReady,
  routeBounds,
  type RoadSegment,
} from '../routing';
import { MAP_PLACES, getPlaceLatLng, isAnchoredPlace } from '../data/mapPlaces';
import type { DidiLatLng, DidiRouteOption } from '../types';

/**
 * 行程地图：底图用路网图里的真实道路几何自绘。
 *
 * 之前这里叠的是共享离线 Google 地图，但快照里能用的真实底图只有一张 z17、约
 * 330×680m 的静态图，画 10km 的路线时尺度差三十倍，折线看着就在楼里穿行。
 * 路网图(apps/Didi/data/roadGraph.json)本身就是 Google 驾车折线的真实道路形状，
 * 覆盖中心 52km，直接拿它画底图，底图和路线共用一套投影，任何比例尺都对得上。
 */
const LAT_METERS = 111_194.9;

const COLORS = {
  land: '#eef1f4',
  minorCasing: '#dfe4e9',
  minorFill: '#ffffff',
  majorCasing: '#d6dde4',
  majorFill: '#ffffff',
  alternate: '#9aa7b4',
  remaining: '#13b879',
  traveled: '#a8e6c8',
  origin: '#13b879',
  dest: '#ff6a3d',
  label: '#7b8794',
};
/** 长直段按主干道画：Google 折线在直路上顶点稀疏，长度是可用的道路等级近似。 */
const MAJOR_ROAD_METERS = 200;
/** 视口跨度除以此值得到细支路的最小长度，避免小比例尺下整屏糊成一片。 */
const DETAIL_DIVISOR = 320;
/** 小地图上标注多了就成了噪音。 */
const MAX_LABELS = 7;
const ANCHORED_PLACES = MAP_PLACES.filter(isAnchoredPlace);

type RoadNetworkMapProps = {
  height: number;
  routes: DidiRouteOption[];
  selectedRouteId: string;
  /** 已驶过的折线片段，传入后与剩余路段分色显示 */
  traveled?: DidiLatLng[];
  carPosition?: DidiLatLng | null;
  originLabel?: string;
  destLabel?: string;
  /** 变化时重新把路线装进视口 */
  fitToken?: number;
  onRouteSelect?: (routeId: string) => void;
  children?: React.ReactNode;
};

type View = {
  width: number;
  height: number;
  centerLat: number;
  centerLng: number;
  /** 像素/米 */
  scale: number;
  lngMeters: number;
  spanMeters: number;
};

function projectTo(view: View, point: DidiLatLng) {
  return {
    x: view.width / 2 + (point.lng - view.centerLng) * view.lngMeters * view.scale,
    y: view.height / 2 - (point.lat - view.centerLat) * LAT_METERS * view.scale,
  };
}

function strokePath(
  ctx: CanvasRenderingContext2D,
  view: View,
  points: DidiLatLng[],
  color: string,
  width: number,
) {
  if (points.length < 2) return;
  ctx.beginPath();
  points.forEach((point, index) => {
    const { x, y } = projectTo(view, point);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawRoads(
  ctx: CanvasRenderingContext2D,
  view: View,
  segments: RoadSegment[],
) {
  ctx.fillStyle = COLORS.land;
  ctx.fillRect(0, 0, view.width, view.height);

  const major = segments.filter((segment) => segment.meters >= MAJOR_ROAD_METERS);
  const minor = segments.filter((segment) => segment.meters < MAJOR_ROAD_METERS);
  // 先描边再填白，两遍画法让路口自然连成一片，看起来接近真实地图的道路层。
  const passes: Array<[RoadSegment[], string, number]> = [
    [minor, COLORS.minorCasing, 3.2],
    [major, COLORS.majorCasing, 6],
    [minor, COLORS.minorFill, 1.8],
    [major, COLORS.majorFill, 4],
  ];
  for (const [group, color, width] of passes) {
    ctx.beginPath();
    for (const segment of group) {
      const from = projectTo(view, segment.a);
      const to = projectTo(view, segment.b);
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function drawPlaceLabels(
  ctx: CanvasRenderingContext2D,
  view: View,
  endpoints: DidiLatLng[],
) {
  ctx.font = '500 10px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // 起终点自带标记，卡片上也写了地名，这里再标一次只会被圆点压住。
  const placed = endpoints.map((point) => projectTo(view, point));
  let drawn = 0;
  for (const place of ANCHORED_PLACES) {
    if (drawn >= MAX_LABELS) break;
    const point = getPlaceLatLng(place);
    const { x, y } = projectTo(view, point);
    if (x < 30 || x > view.width - 30 || y < 12 || y > view.height - 12) continue;
    if (placed.some((taken) => Math.abs(taken.x - x) < 64 && Math.abs(taken.y - y) < 15)) continue;
    placed.push({ x, y });
    drawn += 1;
    // 白色描边打底，标签压在道路上也读得清。
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 3;
    ctx.strokeText(place.name, x, y);
    ctx.fillStyle = COLORS.label;
    ctx.fillText(place.name, x, y);
  }
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  view: View,
  point: DidiLatLng,
  color: string,
) {
  const { x, y } = projectTo(view, point);
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawCar(ctx: CanvasRenderingContext2D, view: View, point: DidiLatLng) {
  const { x, y } = projectTo(view, point);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - 8, y - 8, 16, 16, 5);
  ctx.fillStyle = '#1e2228';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function RoadNetworkMap({
  height,
  routes,
  selectedRouteId,
  traveled,
  carPosition,
  originLabel,
  destLabel,
  fitToken = 0,
  onRouteSelect,
  children,
}: RoadNetworkMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  /** 底图只在视图变化时重画，行车动画每帧只贴一次它，避免每帧重绘上万条道路。 */
  const basemapRef = React.useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = React.useState(0);
  const [networkReady, setNetworkReady] = React.useState(isRoadNetworkReady);

  const selected = routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? null;
  const origin = selected?.points[0] ?? null;
  const destination = selected?.points[selected.points.length - 1] ?? null;

  React.useEffect(() => {
    if (networkReady) return;
    let active = true;
    void ensureRoadNetwork().then(() => {
      if (active) setNetworkReady(isRoadNetworkReady());
    });
    return () => { active = false; };
  }, [networkReady]);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const sync = () => setWidth(node.clientWidth);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const view = React.useMemo<View | null>(() => {
    if (!width || !selected?.points.length) return null;
    const box = routeBounds(selected.points);
    if (!box) return null;
    const centerLat = (box.north + box.south) / 2;
    const centerLng = (box.east + box.west) / 2;
    const lngMeters = Math.cos((centerLat * Math.PI) / 180) * LAT_METERS;
    // 单点或极短路线也要有可看的范围，给个 400m 底。
    const spanX = Math.max((box.east - box.west) * lngMeters, 400);
    const spanY = Math.max((box.north - box.south) * LAT_METERS, 400);
    const padding = 0.12;
    const scale = Math.min(
      (width * (1 - padding * 2)) / spanX,
      (height * (1 - padding * 2)) / spanY,
    );
    return {
      width,
      height,
      centerLat,
      centerLng,
      scale,
      lngMeters,
      spanMeters: Math.max(width / scale, height / scale),
    };
    // fitToken 变化时重新装视口（换页面/换路线数量）。
  }, [width, height, selected, fitToken]);

  // 底图：视图或路网数据变化时重绘到离屏 canvas。
  React.useEffect(() => {
    if (!view || !networkReady) {
      basemapRef.current = null;
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.round(view.width * dpr);
    offscreen.height = Math.round(view.height * dpr);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    // 视口外多取一圈，平移/取整时边缘不会露白。
    const marginLat = (view.height / view.scale / LAT_METERS) * 0.6;
    const marginLng = (view.width / view.scale / view.lngMeters) * 0.6;
    const segments = collectRoadSegments({
      south: view.centerLat - marginLat,
      north: view.centerLat + marginLat,
      west: view.centerLng - marginLng,
      east: view.centerLng + marginLng,
    }, view.spanMeters / DETAIL_DIVISOR);
    drawRoads(ctx, view, segments);
    drawPlaceLabels(ctx, view, [origin, destination].filter(Boolean) as DidiLatLng[]);
    basemapRef.current = offscreen;
  }, [view, networkReady, origin, destination]);

  // 路线层：每次进度更新只贴底图 + 重画折线与标记。
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(view.width * dpr);
    canvas.height = Math.round(view.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);
    if (basemapRef.current) {
      ctx.drawImage(basemapRef.current, 0, 0, view.width, view.height);
    } else {
      ctx.fillStyle = COLORS.land;
      ctx.fillRect(0, 0, view.width, view.height);
    }

    routes
      .filter((route) => route.id !== selected?.id)
      .forEach((route) => strokePath(ctx, view, route.points, COLORS.alternate, 4));
    if (selected) strokePath(ctx, view, selected.points, COLORS.remaining, 5);
    if (traveled && traveled.length > 1) {
      strokePath(ctx, view, traveled, COLORS.traveled, 5);
    }
    if (origin) drawMarker(ctx, view, origin, COLORS.origin);
    if (destination) drawMarker(ctx, view, destination, COLORS.dest);
    if (carPosition) drawCar(ctx, view, carPosition);
  }, [view, routes, selected, traveled, carPosition, origin, destination, networkReady]);

  const handleClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!onRouteSelect || !view || routes.length < 2) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let bestId: string | null = null;
    let bestDistance = Infinity;
    for (const route of routes) {
      for (const point of route.points) {
        const projected = projectTo(view, point);
        const distance = Math.hypot(projected.x - x, projected.y - y);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = route.id;
        }
      }
    }
    if (bestId && bestDistance <= 18) onRouteSelect(bestId);
  }, [onRouteSelect, view, routes]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height, background: COLORS.land }}
      onClick={handleClick}
      data-testid="didi-route-map"
      data-map-provider="didi-road-network"
      data-route-count={routes.length}
      data-selected-route={selected?.id ?? ''}
      data-route-distance-km={selected?.distanceKm ?? ''}
      data-route-points={selected?.points.length ?? 0}
      data-route-origin={origin ? `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}` : ''}
      data-route-dest={destination ? `${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}` : ''}
      data-map-span-meters={view ? Math.round(view.spanMeters) : 0}
      data-basemap={networkReady ? 'road-network' : 'loading'}
      aria-label={`${originLabel ?? '起点'} 到 ${destLabel ?? '终点'} 的真实路线地图`}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ width: '100%', height }}
      />
      {children}
    </div>
  );
}
