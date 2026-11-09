import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img, Price, usePanel } from '../components/ui';
import { IcTrain } from '../res/icons';

/** 酒店地图：只展示当前城市酒店，回列表保留 city。 */
export default function HotelMapPage() {
  const s = useCtripStrings();
  const { bindTap, backOr } = useCtripGestures();
  const { value: panel, open, close } = usePanel('pin');
  const [sp] = useSearchParams();
  const storeCity = useCtripStore((st) => st.hotelCity);
  const city = (sp.get('city') || storeCity || '上海').trim();
  const listParams = new URLSearchParams(sp);
  listParams.delete('panel');
  listParams.set('city', city);
  const hotels = useCtripStore((st) => st.hotels).filter((h) => h.city === city);
  const recordTaskAudit = useCtripStore((st) => st.recordTaskAudit);
  const active = hotels.find((h) => h.id === panel) ?? null;
  const pins = hotels.slice(0, 5).map((h, i) => ({ h, top: 20 + (i % 3) * 22, left: 18 + i * 15 }));

  return (
    <div className="flex flex-col h-full bg-[#E8EEF5] relative">
      <TopBar
        title={`${city} · ${s.t('地图找酒店')}`}
        backTo={`/hotel/list?${listParams.toString()}`}
        rightContent={
          <button {...bindTap('hotelMap.toList', { params: { city }, onTrigger: () => backOr(`/hotel/list?${listParams.toString()}`) })} className="text-[#0086F6] text-[13px] bg-transparent border-none cursor-pointer">{s.t('列表')}</button>
        }
      />
      <div className="flex-1 relative overflow-hidden">
        <Img src="/@app-assets/Ctrip/gen/map_shanghai.svg" className="w-full h-full object-cover opacity-95" />
        <span className="absolute top-3 left-3 bg-white/90 rounded-full px-2 py-1 text-[11px] text-[#0086F6] shadow flex items-center gap-1">
          <IcTrain size={13} /> {city}站 周边
        </span>
        {pins.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[14px] text-[#666] bg-white/50">{city}暂无地图酒店</div>
        ) : pins.map(({ h, top, left }) => (
          <button
            key={h.id}
            {...bindTap({ kind: 'action', id: 'hotelMap.pin.open' }, { params: { id: h.id }, onTrigger: () => {
              recordTaskAudit('hotelMapPin', { city, hotelId: h.id });
              open(h.id);
            } })}
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
                <button {...bindTap('hotelList.toDetail', { params: { id: active.id } })} className="text-[13px] text-white bg-[#0086F6] rounded-full px-4 py-1.5 border-none cursor-pointer">{s.t('查看详情')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
