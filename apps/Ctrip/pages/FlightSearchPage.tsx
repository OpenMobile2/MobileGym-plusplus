import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { useCtripStore } from '../state';
import { Img, PrimaryBtn, BottomSheet, usePanel, useToast } from '../components/ui';
import { FLIGHT_TRIP_TYPES, WONTFIX_TOAST } from '../constants';
import { systemMonthDay } from '../utils/travelDate';

/** 机票搜索：城市选择写入 from/to，查询带参进列表。 */
export default function FlightSearchPage() {
  const s = useCtripStrings();
  const { bindTap, bindBack, go } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [sp] = useSearchParams();
  const direct = sp.get('direct') || '0';
  const fromParam = sp.get('from');
  const toParam = sp.get('to');
  const dateParam = sp.get('date');
  const passengersFromUrl = sp.get('passengers');
  const [from, setFrom] = React.useState(fromParam || '上海');
  const [to, setTo] = React.useState(toParam || '潍坊');
  const [date, setDate] = React.useState(dateParam || systemMonthDay());
  const [trip, setTrip] = React.useState('oneway');
  const [cityTarget, setCityTarget] = React.useState<'from' | 'to'>('from');
  const travelers = useCtripStore((state) => state.travelers);
  const [selectedPassengers, setSelectedPassengers] = React.useState<string[]>(
    () => (passengersFromUrl || '').split(',').filter(Boolean),
  );
  const [toast, showToast] = useToast();

  React.useEffect(() => {
    if (fromParam) setFrom(fromParam);
    if (toParam) setTo(toParam);
    if (dateParam) setDate(dateParam);
    if (passengersFromUrl !== null) setSelectedPassengers(passengersFromUrl.split(',').filter(Boolean));
  }, [fromParam, toParam, dateParam, passengersFromUrl]);

  const swap = () => { setFrom(to); setTo(from); };
  const pickCity = (c: string) => {
    if (cityTarget === 'from') setFrom(c);
    else setTo(c);
    close();
  };
  const togglePassenger = (id: string) => {
    setSelectedPassengers((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  };
  const passengerSummary = selectedPassengers.length > 0
    ? `${selectedPassengers.length}${s.passengerCountSuffix}`
    : s.selectPassengerPlaceholder;
  const passengersParam = selectedPassengers.join(',');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="relative h-[160px] overflow-hidden bg-[#F4472E]">
          <Img src="/@app-assets/Ctrip/gen/banner_flight.jpg" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#C92820]/75 to-transparent" />
          <button {...bindBack({ onTrigger: () => go('tabbar.home-open') })} className="absolute left-3 top-4 h-9 w-9 rounded-full border-none bg-black/20 text-[28px] text-white">‹</button>
          <div className="absolute left-7 top-12 text-white drop-shadow">
            <div className="text-[24px] font-black italic">{s.t('暑期订机票')}</div>
            <div className="text-[18px] font-black text-[#FFE458]">{s.t('特价折上折')}</div>
            <div className="mt-2 inline-block rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-[#E8492D]">{s.t('限时福利专区 ›')}</div>
          </div>
        </div>

        <div className="relative -mt-4 rounded-t-[18px] bg-white">
          <div className="flex px-2">
            {[{ id: 'flight', label: '机票' }, { id: 'special', label: s.t('特价机票') }].map((t) => (
              <button
                key={t.id}
                type="button"
                {...bindTap({ kind: 'action', id: 'flightSearch.trip.select.oneway' }, {
                  params: { tab: t.id },
                  onTrigger: () => { if (t.id === 'special') showToast(WONTFIX_TOAST); },
                })}
                className={`flex-1 border-x-0 border-t-0 bg-transparent py-3 text-center text-[15px] ${t.id === 'flight' ? 'border-b-[3px] border-[#0086F6] font-bold text-[#0086F6]' : 'border-b-0 text-[#555]'}`}
              >{s.t(t.label)}</button>
            ))}
          </div>
        </div>

        <div className="bg-white mx-2 rounded-b-xl p-3">
          <div className="flex gap-4 mb-2">
            {FLIGHT_TRIP_TYPES.map((t) => (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'flightSearch.trip.select.oneway' }, { params: { trip: t.id }, onTrigger: () => setTrip(t.id) })}
                className={`text-[13px] bg-transparent border-none cursor-pointer ${trip === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
              >{s.t(t.label)}</button>
            ))}
          </div>

          <div className="flex items-center">
            <button {...bindTap({ kind: 'action', id: 'flightSearch.city.open' }, { onTrigger: () => { setCityTarget('from'); open('city'); } })} className="flex-1 text-left bg-transparent border-none cursor-pointer">
              <div className="text-[11px] text-[#999999]">{s.t('出发')}</div><div className="text-[25px] font-bold">{from}</div>
            </button>
            <button {...bindTap({ kind: 'action', id: 'flightSearch.swap' }, { onTrigger: swap })} className="w-9 h-9 rounded-full bg-[#F2F4F7] border-none cursor-pointer text-[#0086F6]">⇄</button>
            <button {...bindTap({ kind: 'action', id: 'flightSearch.city.open' }, { onTrigger: () => { setCityTarget('to'); open('city'); } })} className="flex-1 text-right bg-transparent border-none cursor-pointer">
              <div className="text-[11px] text-[#999999]">{s.t('到达')}</div><div className="text-[25px] font-bold">{to}</div>
            </button>
          </div>

          <button {...bindTap('flightSearch.toCalendar', { params: { from, to, passengers: passengersParam } })} className="w-full flex items-center justify-between py-3 mt-2 border-t border-[#F2F2F2] bg-transparent border-x-0 border-b-0 cursor-pointer">
            <span className="text-[13px] text-[#666666]">{s.t('出发日期')}</span>
            <span className="text-[15px] font-semibold">{date} ›</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'flightSearch.passenger.open' }, { onTrigger: () => open('passenger') })}
            className="flex w-full items-center justify-between border-x-0 border-b-0 border-t border-[#F2F2F2] bg-transparent py-2 text-[13px] text-[#666666]"
          >
            <span>{s.t('乘机人')}</span><span className={selectedPassengers.length ? 'text-[#333333]' : 'text-[#FF6A2C]'}>{passengerSummary} ›</span>
          </button>
          <div className="flex items-center justify-between py-2 text-[13px] text-[#666666]">
            <span>{s.t('舱位')}</span><span className="text-[#333333]">{s.t('经济舱')}</span>
          </div>

          <PrimaryBtn
            binding={bindTap({ kind: 'action', id: 'flightSearch.query' }, {
              params: { from, to, date, passengers: passengersParam },
              onTrigger: () => {
                if (!selectedPassengers.length) { showToast(s.selectPassengerToast); return; }
                go('flightSearch.query', { from, to, date, passengers: passengersParam, direct });
              },
            })}
            className="w-full mt-3 h-12 text-[18px]"
          >{s.t('查询')}</PrimaryBtn>
        </div>

        <div className="mx-2 mt-2 grid grid-cols-3 gap-2">
          {[s.t('低价日历'), s.t('低价提醒'), s.t('机票攻略')].map((item, index) => (
            <button key={item} {...bindTap('flightSearch.toCalendar', { params: { from, to, passengers: passengersParam } })} className="h-[74px] rounded-xl border-none bg-white p-2 text-left shadow-sm">
              <div className="text-[14px] font-bold">{item}</div>
              <div className={`mt-1 text-[11px] ${index === 1 ? 'text-[#FF7138]' : 'text-[#1687EA]'}`}>{index === 0 ? s.t('一眼看低价') : index === 1 ? s.t('降价早知道') : s.t('出行不踩坑')}</div>
            </button>
          ))}
        </div>
      </div>

      {panel === 'city' && (
        <BottomSheet title={`选择${cityTarget === 'from' ? '出发' : '到达'}城市`} onClose={close}>
          <div className="p-4 flex flex-wrap gap-2">
            {['上海', '北京', '长春', '无锡', '潍坊', '广州', '成都', '大连', '深圳', '杭州', '重庆'].map((c) => (
              <button key={c} {...bindTap({ kind: 'action', id: 'flightSearch.city.pick' }, { params: { city: c, target: cityTarget }, onTrigger: () => pickCity(c) })} className={`rounded-full px-4 py-1.5 text-[13px] border-none cursor-pointer ${(cityTarget === 'from' ? from : to) === c ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{c}</button>
            ))}
          </div>
        </BottomSheet>
      )}
      {panel === 'passenger' && (
        <BottomSheet title={s.selectPassengerTitle} onClose={close}>
          <div className="p-2">
            {travelers.map((passenger) => (
              <button
                key={passenger.id}
                {...bindTap({ kind: 'action', id: 'flightSearch.passenger.toggle' }, { params: { id: passenger.id }, onTrigger: () => togglePassenger(passenger.id) })}
                className="flex w-full items-center justify-between border-x-0 border-t-0 border-b border-[#F2F2F2] bg-transparent px-3 py-3 text-left"
              >
                <div><div className="text-[14px] text-[#222222]">{passenger.name}</div><div className="mt-0.5 text-[11px] text-[#999999]">{passenger.idCard}</div></div>
                <span className={`h-5 w-5 rounded-full border text-center text-[12px] leading-4 ${selectedPassengers.includes(passenger.id) ? 'border-[#0086F6] bg-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
              </button>
            ))}
            <button
              {...bindTap({ kind: 'action', id: 'flightSearch.passenger.confirm' }, { onTrigger: close })}
              className="mt-3 w-full rounded-full border-none bg-[#0086F6] py-3 text-[15px] text-white"
            >{s.t('确定')}</button>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
