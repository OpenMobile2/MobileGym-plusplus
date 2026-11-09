import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C, OrangeBtn } from '../components/ui';
import { RoadNetworkMap } from '../components/RoadNetworkMap';
import { MapCanvas } from '../components/MapCanvas';
import { IcNavBack, IcCheck } from '../res/icons';

const ROUTE_PREFS = [
  { id: 'smart', label: '智能推荐', desc: '默认,综合时间与价格' },
  { id: 'time', label: '时间优先', desc: '优先选择用时最短路线' },
  { id: 'cheap', label: '低价优先', desc: '优先选择费用最低路线' },
];

/** 选择路线(多方案+偏好)—— 证据 s24,s25 */
export default function RouteSelectPage() {
  const { bindTap, bindBack, back } = useDidiGestures();
  const trip = useDidiStore((s) => s.trip);
  const setRoute = useDidiStore((s) => s.setRoute);
  const setRoutePref = useDidiStore((s) => s.setRoutePref);
  // 候选路线来自真实路网算路（apps/Didi/routing.ts），条数随起终点变化。
  const routePlans = trip.routeOptions;

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* ① 地图：真实路网折线，灰色为其他候选，可直接点选 */}
      <div className="relative shrink-0">
        {trip.routeOptions.length > 0 ? (
          <RoadNetworkMap
            height={300}
            routes={trip.routeOptions}
            selectedRouteId={trip.routeId}
            originLabel={trip.from}
            destLabel={trip.to || '目的地'}
            fitToken={trip.routeOptions.length}
            onRouteSelect={setRoute}
          />
        ) : (
          <MapCanvas route height={300} pinStart={trip.from} pinEnd={trip.to || '目的地'} />
        )}
        <button
          {...bindBack()}
          className="absolute left-3 top-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center border-none text-app-text"
          aria-label="返回"
        >
          <IcNavBack size={20} />
        </button>
      </div>

      {/* ② 路线选择卡 */}
      <div
        className="flex-1 overflow-y-auto bg-app-surface rounded-t-2xl -mt-3 relative px-4 pt-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="text-[17px] font-bold text-app-text mb-3">🛣️ 路线选择</div>
        <div className="flex gap-2 mb-4" data-testid="didi-route-plans" data-route-count={routePlans.length}>
          {routePlans.map((p) => {
            const active = trip.routeId === p.id;
            const detail = `${p.distanceKm}公里 红绿灯${p.trafficLights}${p.tollFee > 0 ? ` 高速¥${p.tollFee}` : ''}`;
            return (
              <button
                key={p.id}
                {...bindTap({ kind: 'action', id: 'route.select.pick' }, { onTrigger: () => setRoute(p.id) })}
                className="flex-1 rounded-xl px-2.5 py-3 text-left"
                style={{
                  background: active ? '#FFF4EC' : '#F5F6FA',
                  border: active ? `1.5px solid ${C.orange}` : '1.5px solid transparent',
                }}
                data-testid={`didi-route-plan-${p.id}`}
                data-route-selected={active ? 'true' : 'false'}
                data-route-distance-km={p.distanceKm}
                data-automation-label={p.label}
              >
                <div className="text-[12px] truncate" style={{ color: active ? C.orangeDeep : '#6B7079' }}>
                  {p.label}{p.recommended && <span className="ml-1">·推荐</span>}
                </div>
                <div
                  className="text-[18px] font-bold mt-1"
                  style={{ color: active ? C.orangeDeep : C.dark }}
                >
                  {p.durationMin}<span className="text-[12px] font-normal">分钟</span>
                </div>
                <div className="text-[10px] text-app-text-muted mt-0.5 truncate">{detail}</div>
              </button>
            );
          })}
        </div>
        {trip.routeOptions.length === 0 && (
          <div className="mb-4 text-[12px] text-app-text-muted" data-testid="didi-route-plans-empty">
            正在按真实路网计算候选路线…
          </div>
        )}

        {/* ③ 路线偏好设置 */}
        <div className="text-[15px] font-semibold text-app-text mb-1">路线偏好设置</div>
        <div className="mb-4">
          {ROUTE_PREFS.map((p, i) => {
            const active = trip.routePref === p.id;
            return (
              <button
                key={p.id}
                {...bindTap({ kind: 'action', id: 'route.select.pref' }, { onTrigger: () => setRoutePref(p.id) })}
                className={`flex items-center w-full py-3 bg-transparent border-none text-left ${
                  i === ROUTE_PREFS.length - 1 ? '' : 'border-b border-app-border'
                }`}
              >
                <span className="flex-1">
                  <span className="block text-[15px]" style={{ color: active ? C.orangeDeep : undefined }}>
                    <span className={active ? '' : 'text-app-text'}>{p.label}</span>
                    {p.id === 'smart' && <span className="text-[11px] text-app-text-muted ml-1.5">默认</span>}
                  </span>
                  <span className="block text-[12px] text-app-text-muted mt-0.5">{p.desc}</span>
                </span>
                {active && <IcCheck size={18} color={C.orangeDeep} />}
              </button>
            );
          })}
        </div>

        <div className="pb-4">
          <OrangeBtn
            bind={bindTap({ kind: 'action', id: 'route.select.done' }, { onTrigger: () => back() })}
          >
            完成设置
          </OrangeBtn>
        </div>
      </div>
    </div>
  );
}
