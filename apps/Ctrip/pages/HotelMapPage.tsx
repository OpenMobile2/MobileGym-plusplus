import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, usePanel } from '../components/ui';
import { IcTrain } from '../res/icons';

/** 酒店地图(spec hotel.map)。静态地图近似;点气泡→底部弹卡;返回列表。 */
export default function HotelMapPage() {
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel('pin');
  const hotels = useCtripStore((s) => s.hotels);
  const active = hotels.find((h) => h.id === panel) ?? null;

  // 气泡近似坐标(百分比)
  const pins = hotels.slice(0, 5).map((h, i) => ({ h, top: 20 + (i % 3) * 22, left: 18 + i * 15 }));

  return (
    <div className="flex flex-col h-full bg-[#E8EEF5] relative">
      <TopBar
        title="地图找酒店"
        rightContent={
          <button {...bindTap('hotelMap.toList')} className="text-[#0086F6] text-[13px] bg-transparent border-none cursor-pointer">列表</button>
        }
      />
      <div className="flex-1 relative overflow-hidden">
        <Img src="/@app-assets/Ctrip/gen/city_shanghai.png" className="w-full h-full object-cover opacity-90" />
        {/* 火车可达标签 */}
        <span className="absolute top-3 left-3 bg-white/90 rounded-full px-2 py-1 text-[11px] text-[#0086F6] shadow flex items-center gap-1">
          <IcTrain size={13} /> 上海站 步行可达
        </span>
        {pins.map(({ h, top, left }) => (
          <button
            key={h.id}
            {...bindTap({ kind: 'action', id: 'hotelMap.pin.open' }, { params: { id: h.id }, onTrigger: () => open(h.id) })}
            className="absolute -translate-x-1/2 bg-[#0086F6] text-white text-[12px] font-semibold rounded-full px-2 py-1 shadow border-none cursor-pointer whitespace-nowrap"
            style={{ top: `${top}%`, left: `${left}%` }}
          >¥{h.price}</button>
        ))}
      </div>

      {active && (
        <div className="absolute left-0 right-0 bottom-0 z-40">
          <div className="absolute inset-0 -top-[100vh]" onClick={close} />
          <div className="relative bg-white rounded-t-2xl p-3 flex gap-3">
            <Img src={active.image} className="w-24 h-24 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold line-clamp-1">{active.name}</div>
              <div className="text-[12px] text-[#999999] mt-1">{active.score}分 · {active.district}</div>
              <div className="flex items-end justify-between mt-3">
                <Price value={active.price} size="m" />
                <button {...bindTap('hotelList.toDetail', { params: { id: active.id } })} className="text-[13px] text-white bg-[#0086F6] rounded-full px-4 py-1.5 border-none cursor-pointer">查看详情</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
