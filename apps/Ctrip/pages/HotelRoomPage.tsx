import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price } from '../components/ui';

/** 房型选择(spec hotel.room)。房型筛选chip;房型方案「订」→booking。 */
const FILTERS = ['不限', '大床', '双床', '家庭房', '含早', '可取消'];

export default function HotelRoomPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const hotels = useCtripStore((s) => s.hotels);
  const hotel = hotels.find((h) => h.id === id) ?? hotels[0];
  const [filter, setFilter] = React.useState('不限');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={<span className="text-[15px] line-clamp-1">{hotel.name}</span>} />
      <div className="shrink-0 bg-white px-2 py-2 flex gap-2 overflow-x-auto border-b border-[#F0F0F0]">
        {FILTERS.map((f) => (
          <button
            key={f}
            {...bindTap({ kind: 'action', id: 'hotelRoom.filter.select.twinbed' }, { params: { filter: f }, onTrigger: () => setFilter(f) })}
            className={`shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer ${filter === f ? 'bg-[#E6F3FF] text-[#0086F6] border-[#0086F6]' : 'bg-[#F7F8FA] text-[#555555] border-transparent'}`}
          >{f}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {hotel.rooms.map((r) => (
          <div key={r.id} className="bg-white mx-2 mt-2 rounded-xl overflow-hidden">
            <div className="flex gap-2.5 p-2.5">
              <Img src={r.image} className="w-24 h-24 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-[#111111] line-clamp-2">{r.name}</div>
                <div className="text-[11px] text-[#999999] mt-1">{r.area} · {r.bed} · {r.occupancy}</div>
                <div className="text-[11px] text-[#999999] mt-0.5">{r.breakfast}</div>
              </div>
            </div>
            <div className="flex items-center justify-between px-2.5 py-2 border-t border-[#F5F5F5]">
              <div>
                <div className="text-[11px] text-[#38A169]">{r.cancelPolicy}</div>
                <div className="text-[11px] text-[#FF6A2C]">仅剩{r.remaining}间</div>
              </div>
              <div className="flex items-center gap-2">
                <Price value={r.price} size="m" />
                <button {...bindTap('hotelRoom.toBooking', { params: { id: hotel.id } })} className="text-[13px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-4 py-1.5 border-none cursor-pointer">订</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
