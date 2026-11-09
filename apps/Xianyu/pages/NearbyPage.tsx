import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { ItemCard } from '../components/ItemCard';
import { useToast } from '../components/ui';
import { IcLocation, IcArrowDown } from '../res/icons';

/** 服务金刚区(Q3 wontfix) */
const NEARBY_SERVICES = [
  { id: 'usedCar', label: '二手车', emoji: '🚗' },
  { id: 'rent', label: '租房', emoji: '🏠' },
  { id: 'lease', label: '租赁', emoji: '📦' },
  { id: 'moto', label: '摩托车', emoji: '🏍️' },
];

/** 品类 tab */
const NEARBY_TABS = ['全部', '数码', '手机', '家电', '家具', '图书'] as const;

export default function NearbyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const items = useXianyuStore((s) => s.items);

  const tab = searchParams.get('tab') ?? '全部';

  const nearby = items
    .filter((i) => typeof i.distanceKm === 'number' && (i.distanceKm as number) > 0)
    .filter((i) => tab === '全部' || i.category === tab)
    .sort((a, b) => (a.distanceKm as number) - (b.distanceKm as number));

  const col = (mod: number) => nearby.filter((_, idx) => idx % 2 === mod);

  const renderCard = (it: (typeof nearby)[number]) => (
    <div key={it.id} className="relative">
      <span className="absolute left-1.5 top-1.5 z-10 bg-black/55 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
        <IcLocation size={10} /> {it.distanceKm}km
      </span>
      <ItemCard item={it} />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      {/* 自绘标题栏 */}
      <div className="bg-white shrink-0 h-11 flex items-center px-3">
        <button
          onClick={() => showToast('该功能暂未开放')}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[16px] font-semibold text-[#1A1A1A]"
        >
          <IcLocation size={18} className="text-[#FF8A00]" />
          同城 · 上海
          <IcArrowDown size={16} className="text-[#999999]" />
        </button>
      </div>

      {/* 服务金刚区 */}
      <div className="bg-white shrink-0 grid grid-cols-4 gap-1 px-2 py-3 border-t border-[#F4F4F4]">
        {NEARBY_SERVICES.map((s) => (
          <button
            key={s.id}
            onClick={() => showToast('该功能暂未开放')}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1"
          >
            <span className="w-11 h-11 rounded-full bg-[#F4F4F4] flex items-center justify-center text-[20px]">{s.emoji}</span>
            <span className="text-[12px] text-[#333333]">{s.label}</span>
          </button>
        ))}
      </div>

      {/* 品类 tab */}
      <div
        className="bg-white shrink-0 flex items-center gap-4 px-3 border-b border-[#EEEEEE] overflow-x-auto"
        data-scroll-container="nearby-tabs" data-scroll-direction="horizontal"
      >
        {NEARBY_TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              {...bindTap(
                { kind: 'action', id: 'nearby.tab.select.target' },
                {
                  params: { target: t },
                  onTrigger: () =>
                    setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
                },
              )}
              className={`bg-transparent border-none cursor-pointer py-2 text-[14px] whitespace-nowrap relative ${
                active ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {t}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FFE411]" />}
            </button>
          );
        })}
      </div>

      {/* 同城商品流(双列) */}
      <div className="flex-1 overflow-y-auto p-2" data-scroll-container="NearbyPage-main" data-scroll-direction="vertical">
        {nearby.length === 0 ? (
          <div className="text-center text-[#999999] text-[13px] pt-16">附近暂无该品类闲置</div>
        ) : (
          <div className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">{col(0).map(renderCard)}</div>
            <div className="flex-1 min-w-0">{col(1).map(renderCard)}</div>
          </div>
        )}
      </div>
      {toast}
    </div>
  );
}
