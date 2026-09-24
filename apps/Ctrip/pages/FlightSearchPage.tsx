import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { Img, PrimaryBtn, BottomSheet, usePanel } from '../components/ui';
import { FLIGHT_TRIP_TYPES } from '../constants';

/** 机票搜索(spec flight.search)。城市弹层;出发日期→calendar;单程/往返/多程;查询→list。 */
export default function FlightSearchPage() {
  const { bindTap, bindBack } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [from, setFrom] = React.useState('上海');
  const [to, setTo] = React.useState('潍坊');
  const [trip, setTrip] = React.useState('oneway');
  const [editingField, setEditingField] = React.useState<'from' | 'to'>('from');

  const swap = () => { setFrom(to); setTo(from); };

  const openCityPicker = (field: 'from' | 'to') => {
    setEditingField(field);
    open('city');
  };

  const selectCity = (city: string) => {
    if (editingField === 'from') setFrom(city);
    else setTo(city);
    close();
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="relative h-[160px] overflow-hidden bg-[#F4472E]">
          <Img src="/@app-assets/Ctrip/gen/banner_flight.png" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#C92820]/75 to-transparent" />
          <button {...bindBack()} className="absolute left-3 top-4 h-9 w-9 rounded-full border-none bg-black/20 text-[28px] text-white">‹</button>
          <div className="absolute left-7 top-12 text-white drop-shadow">
            <div className="text-[24px] font-black italic">暑期订机票</div>
            <div className="text-[18px] font-black text-[#FFE458]">特价折上折</div>
            <div className="mt-2 inline-block rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-[#E8492D]">限时福利专区 ›</div>
          </div>
        </div>

        <div className="relative -mt-4 rounded-t-[18px] bg-white">
          <div className="flex px-2">
            {[{ id: 'flight', label: '机票' }, { id: 'special', label: '特价机票' }].map((t) => (
              <div key={t.id} className={`flex-1 text-center py-3 text-[15px] ${t.id === 'flight' ? 'text-[#0086F6] font-bold border-b-[3px] border-[#0086F6]' : 'text-[#555]'}`}>{t.label}</div>
            ))}
          </div>
        </div>

        <div className="bg-white mx-2 rounded-b-xl p-3">
          {/* 行程类型 */}
          <div className="flex gap-4 mb-2">
            {FLIGHT_TRIP_TYPES.map((t) => (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'flightSearch.trip.select.oneway' }, { params: { trip: t.id }, onTrigger: () => setTrip(t.id) })}
                className={`text-[13px] bg-transparent border-none cursor-pointer ${trip === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
              >{t.label}</button>
            ))}
          </div>

          <div className="flex items-center">
            <button {...bindTap({ kind: 'action', id: 'flightSearch.city.open' }, { onTrigger: () => openCityPicker('from') })} className="flex-1 text-left bg-transparent border-none cursor-pointer">
              <div className="text-[11px] text-[#999999]">出发</div><div className="text-[25px] font-bold">{from}</div>
            </button>
            <button onClick={swap} className="w-9 h-9 rounded-full bg-[#F2F4F7] border-none cursor-pointer text-[#0086F6]">⇄</button>
            <button {...bindTap({ kind: 'action', id: 'flightSearch.city.open' }, { onTrigger: () => openCityPicker('to') })} className="flex-1 text-right bg-transparent border-none cursor-pointer">
              <div className="text-[11px] text-[#999999]">到达</div><div className="text-[25px] font-bold">{to}</div>
            </button>
          </div>

          <button {...bindTap('flightSearch.toCalendar')} className="w-full flex items-center justify-between py-3 mt-2 border-t border-[#F2F2F2] bg-transparent border-x-0 border-b-0 cursor-pointer">
            <span className="text-[13px] text-[#666666]">出发日期</span>
            <span className="text-[15px] font-semibold">07-05 周六 ›</span>
          </button>
          <div className="flex items-center justify-between py-2 border-t border-[#F2F2F2] text-[13px] text-[#666666]">
            <span>乘机人</span><span className="text-[#333333]">成人1</span>
          </div>
          <div className="flex items-center justify-between py-2 text-[13px] text-[#666666]">
            <span>舱位</span><span className="text-[#333333]">经济舱</span>
          </div>

          <PrimaryBtn binding={bindTap('flightSearch.query')} className="w-full mt-3 h-12 text-[18px]">查询</PrimaryBtn>
        </div>

        <div className="mx-2 mt-2 grid grid-cols-3 gap-2">
          {['低价日历', '低价提醒', '机票攻略'].map((item, index) => (
            <button key={item} {...bindTap('flightSearch.toCalendar')} className="h-[74px] rounded-xl border-none bg-white p-2 text-left shadow-sm">
              <div className="text-[14px] font-bold">{item}</div>
              <div className={`mt-1 text-[11px] ${index === 1 ? 'text-[#FF7138]' : 'text-[#1687EA]'}`}>{index === 0 ? '一眼看低价' : index === 1 ? '降价早知道' : '出行不踩坑'}</div>
            </button>
          ))}
        </div>
      </div>

      {panel === 'city' && (
        <BottomSheet title={editingField === 'from' ? '选择出发城市' : '选择到达城市'} onClose={close}>
          <div className="p-4 flex flex-wrap gap-2">
            {['上海', '北京', '潍坊', '广州', '成都', '大连', '深圳', '杭州', '武汉', '厦门'].map((c) => (
              <button key={c} onClick={() => selectCity(c)} className={`bg-[#F2F4F7] rounded-full px-4 py-1.5 text-[13px] border-none cursor-pointer ${(editingField === 'from' ? from : to) === c ? 'bg-[#E6F3FF] text-[#0086F6]' : ''}`}>{c}</button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
