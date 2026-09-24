import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C, CheckCircle, CarImg } from '../components/ui';
import { RoadNetworkMap } from '../components/RoadNetworkMap';
import { MapCanvas } from '../components/MapCanvas';
import { IcNavBack, IcSafety } from '../res/icons';
import { scaleDiscount, scaleFare } from '../pricing';
import type { DidiCarType } from '../types';

/** 车型小图(白色轿车 SVG) */
function CarGlyph() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24">
      <rect x="4" y="10" width="32" height="9" rx="4" fill="#E8EAF0" />
      <path d="M10 11 C12 5, 27 5, 30 11 Z" fill="#F3F4F8" stroke="#D9DBE0" strokeWidth="1" />
      <circle cx="12" cy="19" r="3" fill="#5A5F6B" />
      <circle cx="28" cy="19" r="3" fill="#5A5F6B" />
    </svg>
  );
}

/** 车型选择/预估价 —— 证据 s22(主),s23,s39,frames/recB_carselect.jpg */
export default function CarSelectPage() {
  const { bindTap, bindBack } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const trip = useDidiStore((s) => s.trip);
  const selectedRoute = trip.routeOptions.find((route) => route.id === trip.routeId)
    ?? trip.routeOptions[0]
    ?? null;
  const carGroups = useDidiStore((s) => s.carGroups);
  const toggleCarType = useDidiStore((s) => s.toggleCarType);
  const callCars = useDidiStore((s) => s.callCars);

  const [activeRail, setActiveRail] = React.useState(carGroups[0]?.id ?? 'recommend');
  const groupRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const checkedCount = carGroups.flatMap((g) => g.types).filter((t) => t.checked).length;
  const estLabel = trip.estMin === trip.estMax
    ? `¥${trip.estMin}`
    : `¥${trip.estMin}-${trip.estMax}`;

  const scrollToGroup = (gid: string) => {
    setActiveRail(gid);
    groupRefs.current[gid]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* ① 地图 + 浮层 */}
      <div className="relative shrink-0">
        {selectedRoute ? (
          <RoadNetworkMap
            height={150}
            routes={[selectedRoute]}
            selectedRouteId={selectedRoute.id}
            originLabel={trip.from}
            destLabel={trip.to}
            fitToken={trip.routeOptions.length}
          />
        ) : (
          <MapCanvas route height={150} pinStart={trip.from} pinEnd={`${trip.to} 预计到达`} />
        )}
        <button
          {...bindBack()}
          className="absolute left-3 top-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center border-none text-app-text"
          aria-label="返回"
        >
          <IcNavBack size={20} />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 top-3 rounded-full px-3 py-1 text-[11px] text-white whitespace-nowrap" style={{ background: 'rgba(30,34,40,.78)' }}>
          {selectedRoute?.label ?? '无高速路桥费'} | {trip.distanceKm}公里 {trip.durationMin}分钟
        </div>
        <button
          onClick={() => toast('安全中心请从行程页进入')}
          className="absolute left-3 bottom-9 w-9 h-9 rounded-lg flex items-center justify-center border-none"
          style={{ background: C.blue }}
          aria-label="安全"
        >
          <IcSafety size={18} color="#fff" />
        </button>
        <div className="absolute right-2 bottom-2 flex flex-col gap-1.5">
          <button
            onClick={() => toast('该功能暂未开放')}
            className="bg-white rounded-lg shadow px-2 py-1 text-[11px] text-app-text border-none"
          >
            途经点
          </button>
          <button
            onClick={() => toast('该功能暂未开放')}
            className="bg-white rounded-lg shadow px-2 py-1 text-[11px] text-app-text border-none"
          >
            选路线
          </button>
        </div>
      </div>

      {/* ② 有车提示 */}
      <div className="px-4 py-2 bg-app-surface text-[15px] font-semibold shrink-0">
        <span style={{ color: C.green }}>5秒</span>
        <span className="text-app-text">内有车,附近车多马上走</span>
      </div>

      {/* ③ 分类栏 + 车型分组 */}
      <div className="flex-1 flex overflow-hidden bg-app-surface">
        {/* 左侧分类栏 */}
        <div className="w-14 shrink-0 overflow-y-auto flex flex-col items-center pt-1 gap-1" style={{ background: '#F5F6FA' }}>
          {carGroups.map((g) => (
            <button
              key={g.id}
              {...bindTap(
                { kind: 'action', id: 'car.select.category.pick' },
                { onTrigger: () => scrollToGroup(g.id) },
              )}
              className="relative w-full py-3 text-[13px] border-none"
              style={{
                background: activeRail === g.id ? '#FFFFFF' : 'transparent',
                color: activeRail === g.id ? C.dark : '#6B7079',
                fontWeight: activeRail === g.id ? 700 : 400,
                borderRadius: activeRail === g.id ? '10px 0 0 10px' : 0,
              }}
            >
              {g.rail}
              {g.id === 'special' && (
                <span
                  className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full text-[9px] leading-[14px] text-white"
                  style={{ background: C.red }}
                >
                  2
                </span>
              )}
            </button>
          ))}
          <button onClick={() => toast('该功能暂未开放')} className="w-full py-3 text-[13px] border-none bg-transparent" style={{ color: '#6B7079' }}>
            更多
          </button>
          <button onClick={() => toast('该功能暂未开放')} className="w-full py-3 text-[13px] border-none bg-transparent" style={{ color: '#6B7079' }}>
            快送
          </button>
        </div>

        {/* 右侧车型分组滚动区 */}
        <div
          className="flex-1 overflow-y-auto px-2 pt-1 pb-3"
          data-scroll-container="main"
          data-scroll-direction="vertical"
        >
          {carGroups.map((g) => (
            <div
              key={g.id}
              ref={(el) => { groupRefs.current[g.id] = el; }}
              className="rounded-xl border border-app-border mb-2 px-2.5 py-1"
            >
              {g.id !== 'recommend' && (
                <div className="text-[13px] font-semibold text-app-text px-1 pt-2 pb-1">{g.name}</div>
              )}
              {g.types.map((t, i) => (
                <TypeRow
                  key={t.id}
                  t={t}
                  distanceKm={trip.distanceKm}
                  last={i === g.types.length - 1}
                  toggleCarType={toggleCarType}
                  callCars={callCars}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ④ 底部功能行 */}
      <div className="flex items-center px-4 py-2 bg-app-surface border-t border-app-border shrink-0 text-[13px] text-app-text">
        <button {...bindTap('reserve.fromCarSelect')} className="flex-1 bg-transparent border-none text-app-text">
          预约出发 ›
        </button>
        <button onClick={() => toast('该功能暂未开放')} className="flex-1 bg-transparent border-none text-app-text">
          帮人叫车 ›
        </button>
        <button onClick={() => toast('该功能暂未开放')} className="flex-1 bg-transparent border-none text-app-text">
          偏好设置 ›
        </button>
        <button onClick={() => toast('该功能暂未开放')} className="flex-1 bg-transparent border-none text-app-text">
          行程预测 ›
        </button>
      </div>

      {/* ⑤ 底部深色胶囊 bar */}
      <div className="px-3 pb-2 pt-1 bg-app-surface shrink-0">
        <div className="flex items-center rounded-full overflow-hidden" style={{ background: '#1E2228' }}>
          <div className="flex-1 px-5 py-3.5 text-white">
            <span className="text-[13px]">预估</span>
            <span className="text-[18px] font-bold ml-1">{estLabel}</span>
          </div>
          {checkedCount > 0 ? (
            <button
              {...bindTap('call.waiting.open', { beforeTrigger: () => callCars() })}
              className="px-8 py-3.5 rounded-full text-white text-[17px] font-semibold border-none"
              style={{ background: C.orange }}
            >
              呼叫{checkedCount}种车型
            </button>
          ) : (
            <button
              onClick={() => toast('请先选择车型')}
              className="px-8 py-3.5 rounded-full text-white text-[17px] font-semibold border-none"
              style={{ background: '#FFC7A8' }}
            >
              呼叫车型
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 单个车型行:勾选同呼 / 「去呼叫」直呼 */
function TypeRow({
  t,
  distanceKm,
  last,
  toggleCarType,
  callCars,
}: {
  t: DidiCarType;
  distanceKm: number;
  last: boolean;
  toggleCarType: (id: string) => void;
  callCars: () => void;
}) {
  const { bindTap } = useDidiGestures();
  const price = scaleFare(t.price, distanceKm);
  const discount = scaleDiscount(t.discount, distanceKm, t.price);
  return (
    <button
      {...bindTap({ kind: 'action', id: 'car.select.type.toggle' }, { onTrigger: () => toggleCarType(t.id) })}
      className={`flex items-center w-full py-2.5 px-1 bg-transparent border-none text-left ${
        last ? '' : 'border-b border-app-border'
      }`}
    >
      <span className="relative shrink-0 mr-1.5">
        <CarImg typeId={t.id} className="w-10 h-6" />
        {t.tag && (
          <span
            className="absolute -top-1 -left-1 w-4 h-4 rounded text-[10px] leading-4 text-center text-white"
            style={{ background: t.tag === '折' ? C.red : C.orangeDeep }}
          >
            {t.tag}
          </span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-medium text-app-text truncate">{t.name}</span>
        {(t.etaSec != null || t.desc) && (
          <span className="block text-[11px] text-app-text-muted truncate mt-0.5">
            {t.etaSec != null ? `${t.etaSec}秒` : t.desc}
          </span>
        )}
      </span>
      <span className="text-right mr-2 shrink-0">
        <span className="block whitespace-nowrap">
          <span
            {...bindTap('fare.rules.open', { stopPropagation: true })}
            className="text-[12px] text-app-text-muted"
          >
            ⓘ 一口价
          </span>
          <span className="text-[17px] font-bold text-app-text">¥{price}</span>
          {t.priceSuffix && <span className="text-[11px] text-app-text-muted">{t.priceSuffix}</span>}
        </span>
        {discount > 0 && (
          <span className="block text-[11px]" style={{ color: C.red }}>已优惠¥{discount}</span>
        )}
      </span>
      {t.callDirect ? (
        <span
          {...bindTap('call.waiting.open', {
            stopPropagation: true,
            beforeTrigger: () => {
              if (!t.checked) toggleCarType(t.id);
              callCars();
            },
          })}
          className="shrink-0 rounded-full px-3 py-1 text-[13px] font-medium border"
          style={{ color: C.orangeDeep, borderColor: C.orangeDeep }}
        >
          去呼叫
        </span>
      ) : (
        <CheckCircle checked={t.checked} />
      )}
    </button>
  );
}
