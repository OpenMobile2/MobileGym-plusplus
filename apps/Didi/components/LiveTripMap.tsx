import React from 'react';
import { realNow } from '@/os/TimeService';
import { MapCanvas } from './MapCanvas';
import { RoadNetworkMap } from './RoadNetworkMap';
import { pickupProgressToRoute, tripProgressToRoute } from './tripRoute';
import { formatMeters } from '../pricing';
import { buildPickupApproachRoute, pointAtProgress } from '../routing';
import { useDidiStore } from '../state';

export type LiveTripPhase = 'waiting' | 'driver' | 'ongoing';

/** 进度步进：约 12fps，够顺滑又不会让地图覆盖物疲于更新。 */
const PROGRESS_STEP = 1 / 120;

type LiveTripMapProps = {
  phase: LiveTripPhase;
  height?: number;
  /** 接驾初始距上车点米数 / 行程总里程米数 */
  totalMeters: number;
  /** 接驾初始分钟 / 行程总分钟 */
  totalMinutes: number;
  pinStart?: string;
  pinEnd?: string;
  children?: React.ReactNode;
  onEtaChange?: (eta: { meters: number; minutes: number; progress: number }) => void;
};

/**
 * 呼叫后实时地图：车辆沿真实路网折线移动，ETA 随进度回传。
 * waiting — 附近巡航找车；driver — 沿接驾路径驶向上车点；ongoing — 沿选中路线驶向目的地。
 */
export function LiveTripMap({
  phase,
  height = 230,
  totalMeters,
  totalMinutes,
  pinStart,
  pinEnd,
  children,
  onEtaChange,
}: LiveTripMapProps) {
  const trip = useDidiStore((s) => s.trip);
  const [progress, setProgress] = React.useState(0);
  const startedAtRef = React.useRef(realNow());
  const onEtaChangeRef = React.useRef(onEtaChange);
  onEtaChangeRef.current = onEtaChange;

  const durationMs = phase === 'waiting'
    ? 12_000
    : phase === 'driver'
      ? Math.max(10_000, Math.min(22_000, totalMinutes * 3_500))
      : Math.max(14_000, Math.min(36_000, totalMinutes * 2_800));

  React.useEffect(() => {
    startedAtRef.current = realNow();
    setProgress(0);
    let frame = 0;
    const tick = () => {
      const elapsed = realNow() - startedAtRef.current;
      const next = Math.min(phase === 'waiting' ? 1 : 0.97, elapsed / durationMs);
      // 地图覆盖物按进度更新，60fps 重渲染没有意义；量化到约 12fps 的步进。
      setProgress((current) => (
        Math.abs(next - current) >= PROGRESS_STEP || next >= 0.97 || next >= 1 ? next : current
      ));
      const remainRatio = phase === 'waiting' ? 1 : Math.max(0.03, 1 - next);
      const meters = Math.max(20, Math.round(totalMeters * remainRatio));
      const minutes = Math.max(1, Math.round(totalMinutes * remainRatio));
      onEtaChangeRef.current?.({ meters, minutes, progress: next });
      if (next < (phase === 'waiting' ? 1 : 0.97)) {
        frame = window.requestAnimationFrame(tick);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [phase, durationMs, totalMeters, totalMinutes]);

  const tripRoute = trip.routeOptions.find((route) => route.id === trip.routeId)
    ?? trip.routeOptions[0]
    ?? null;
  // 接驾/等待阶段走真实接驾路径（司机从附近驶来），行程中走用户选中的路线。
  const pickupRoute = React.useMemo(
    () => (phase === 'ongoing' || !trip.fromLatLng
      ? null
      : buildPickupApproachRoute(trip.fromLatLng)),
    [phase, trip.fromLatLng],
  );
  const activeRoute = phase === 'ongoing' ? tripRoute : (pickupRoute ?? tripRoute);

  // waiting：在上车点附近来回巡航
  const waitingRouteProgress = 0.6 + 0.25 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 4));
  const routeProgress = phase === 'waiting'
    ? waitingRouteProgress
    : phase === 'driver'
      ? progress
      : progress;

  const remainMeters = Math.max(
    20,
    Math.round(totalMeters * (phase === 'waiting' ? 1 : (1 - progress))),
  );
  const statusLabel = phase === 'waiting'
    ? '正在通知附近司机…'
    : phase === 'driver'
      ? `司机赶来中 · 剩余 ${formatMeters(remainMeters)}`
      : `前往目的地 · 剩余 ${formatMeters(remainMeters)}`;

  const carState = activeRoute
    ? pointAtProgress(activeRoute.points, routeProgress)
    : null;

  const statusBadge = (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
      <div
        className="rounded-full px-3 py-1 text-[11px] text-white shadow"
        style={{ background: 'rgba(30,34,40,.72)' }}
        data-testid="didi-live-map-status"
      >
        {statusLabel}
      </div>
    </div>
  );

  if (activeRoute && carState) {
    return (
      <div
        className="relative w-full"
        data-testid="didi-live-trip-map"
        data-live-phase={phase}
        data-live-progress={progress.toFixed(3)}
        data-live-geometry="road-network"
      >
        <RoadNetworkMap
          height={height}
          routes={[activeRoute]}
          selectedRouteId={activeRoute.id}
          traveled={phase === 'ongoing' ? carState.traveled : undefined}
          carPosition={carState.position}
          originLabel={pinStart}
          destLabel={pinEnd}
          fitToken={phase === 'ongoing' ? 2 : 1}
        >
          {statusBadge}
        </RoadNetworkMap>
        {children}
      </div>
    );
  }

  // 路网未就绪或还没有终点坐标时退回示意图，保证呼叫链路不中断。
  const fallbackCarProgress = phase === 'waiting'
    ? 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 4))
    : phase === 'driver'
      ? pickupProgressToRoute(progress)
      : tripProgressToRoute(progress);

  return (
    <div
      className="relative w-full"
      data-testid="didi-live-trip-map"
      data-live-phase={phase}
      data-live-progress={progress.toFixed(3)}
      data-live-geometry="schematic"
    >
      <MapCanvas
        height={height}
        route={phase !== 'waiting'}
        car
        carProgress={fallbackCarProgress}
        traveledProgress={phase === 'ongoing' ? fallbackCarProgress : undefined}
        pinStart={pinStart}
        pinEnd={pinEnd}
      />
      {statusBadge}
      {children}
    </div>
  );
}
