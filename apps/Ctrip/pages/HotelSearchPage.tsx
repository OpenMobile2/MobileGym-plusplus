import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { Img, PrimaryBtn, BottomSheet, usePanel, Stepper, useToast } from '../components/ui';
import { HOTEL_TABS } from '../constants';
import * as TimeService from '@/os/TimeService';
import { addSystemDays, daysInMonth, startOfSystemDay } from '../utils/travelDate';

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function fmtMd(d: Date) {
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function addDays(base: Date, n: number) {
  const d = TimeService.fromTimestamp(base.getTime());
  d.setDate(d.getDate() + n);
  return d;
}
function nightsBetween(a: Date, b: Date) {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

/**
 * 酒店搜索(spec hotel.search)。
 * 城市→cityPicker;日期/人数→弹层(searchParams);tab 切换;查询→list;周边探索副tab。
 */
export default function HotelSearchPage() {
  const s = useCtripStrings();
  const { bindTap, bindBack, go } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [sp] = useSearchParams();
  const [toast, showToast] = useToast();
  const storeCity = useCtripStore((st) => st.hotelCity);
  const setHotelCity = useCtripStore((st) => st.setHotelCity);
  const initialTab = sp.get('state') === 'homestay' ? 'homestay' : 'domestic';
  const [tab, setTab] = React.useState(initialTab);
  const [city, setCity] = React.useState(sp.get('city') || storeCity || '上海');
  const [rooms, setRooms] = React.useState(1);
  const [adults, setAdults] = React.useState(2);
  const [children, setChildren] = React.useState(0);
  const today = React.useMemo(() => startOfSystemDay(), []);
  const [checkIn, setCheckIn] = React.useState(() => startOfSystemDay());
  const [checkOut, setCheckOut] = React.useState(() => addSystemDays(1));
  const [picking, setPicking] = React.useState<'in' | 'out'>('in');
  const nights = nightsBetween(checkIn, checkOut);

  React.useEffect(() => {
    const c = sp.get('city') || storeCity;
    if (c) setCity(c);
    if (sp.get('state') === 'homestay') setTab('homestay');
  }, [sp, storeCity]);

  const hotels = useCtripStore((st) => st.hotels);
  const chipOptions = React.useMemo(() => {
    const districts = [...new Set(hotels.filter((h) => h.city === city).map((h) => h.district).filter(Boolean))];
    const tags = ['双床房', '4.5分以上', '新开业'];
    return [...districts.slice(0, 2), ...tags].slice(0, 5);
  }, [hotels, city]);

  const queryWith = (q?: string) => {
    setHotelCity(city);
    const params: Record<string, string> = {
      city,
      checkIn: fmtMd(checkIn),
      checkOut: fmtMd(checkOut),
    };
    if (q) params.q = q;
    if (tab === 'homestay') params.q = [params.q, '民宿'].filter(Boolean).join(' ');
    go('hotelSearch.query', params);
  };

  const queryBind = bindTap({ kind: 'action', id: 'hotelSearch.query' }, {
    params: { city, checkIn: fmtMd(checkIn), checkOut: fmtMd(checkOut) },
    onTrigger: () => queryWith(),
  });

  const pickDay = (day: number) => {
    const cand = TimeService.fromLocalParts(today.getFullYear(), today.getMonth(), day);
    if (picking === 'in') {
      setCheckIn(cand);
      const nextOut = addDays(cand, 1);
      if (checkOut <= cand) setCheckOut(nextOut);
      setPicking('out');
      return;
    }
    if (cand <= checkIn) {
      setCheckIn(cand);
      setCheckOut(addDays(cand, 1));
      setPicking('out');
      return;
    }
    setCheckOut(cand);
    setPicking('in');
  };

  const selectTab = (id: string) => {
    if (id === 'hour' || id === 'intl') {
      showToast(s.t('该频道示例数据未接入，请用国内/民宿查询'));
      return;
    }
    setTab(id);
  };

  const bottomItems: Array<{ label: string; icon: string; binding: ReturnType<typeof bindTap> }> = [
    { label: '推荐', icon: '⌂', binding: bindTap({ kind: 'action', id: 'hotelSearch.explore.open' }, { onTrigger: () => showToast(s.t('当前已在推荐')) }) },
    { label: s.t('购物车/收藏'), icon: '♡', binding: bindTap('mine.toFavorites', { params: { mode: 'fav' } }) },
    { label: s.t('我的权益'), icon: '◇', binding: bindTap('mine.toMember') },
    { label: s.t('我的点评'), icon: '☆', binding: bindTap('mine.toOrders', { params: { state: 'review' } }) },
    { label: s.t('我的订单'), icon: '▤', binding: bindTap('mine.toOrders', { params: { state: 'all' } }) },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="relative h-[172px] overflow-hidden bg-[#087FCF]">
          <Img src="/@app-assets/Ctrip/gen/banner_summer.png" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />
          <button
            {...bindBack({ onTrigger: () => go('tabbar.home-open') })}
            className="absolute left-3 top-4 flex h-9 w-9 items-center justify-center rounded-full border-none bg-black/20 text-[30px] leading-none text-white"
            aria-label={s.t('返回')}
          >
            ‹
          </button>
          <div className="absolute left-7 top-12 text-white drop-shadow">
            <div className="text-[25px] font-black italic tracking-tight">{s.t('共赴一场')}</div>
            <div className="text-[31px] font-black italic leading-none text-[#FFF65C]">{s.t('夏日狂欢')}</div>
            <div className="mt-2 inline-flex rounded-full bg-white/85 px-3 py-1 text-[12px] font-bold text-[#0786DA]">
              酒店 <span className="mx-1 text-[#FF702F]">{s.t('7折')}</span>{s.t('起 ›')}</div>
          </div>
        </div>

        <div className="relative -mt-5 rounded-t-[18px] bg-white pt-1 shadow-[0_-3px_12px_rgba(0,0,0,0.04)]">
        <div className="flex px-2 pt-2">
          {HOTEL_TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'hotelSearch.tab.select.domestic' }, { params: { tab: t.id }, onTrigger: () => selectTab(t.id) })}
                className={`relative flex-1 bg-transparent py-3 border-none cursor-pointer text-[15px] ${on ? 'text-[#087FE8] font-bold' : 'text-[#222222]'}`}
              >{s.t(t.label)}</button>
            );
          })}
        </div>

        <div className="mx-3 rounded-xl bg-white px-1 pb-3">
          <button {...bindTap('hotelSearch.city-open')} className="w-full flex items-center justify-between py-2.5 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
            <span className="text-[19px] font-bold text-[#111111]">{city}⌄</span>
            <span className="flex-1 border-l border-[#E5E5E5] pl-3 text-left text-[15px] text-[#B8B8B8]">{s.t('位置 / 品牌 / 酒店')}</span>
            <span className="text-[19px] text-[#0786E8]">⌾</span>
          </button>

          <button
            {...bindTap({ kind: 'action', id: 'hotelSearch.date.open' }, { onTrigger: () => { setPicking('in'); open('date'); } })}
            className="w-full flex items-center py-3 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer"
          >
            <div className="flex-1 text-left">
              <div className="text-[11px] text-[#999999]">{s.t('入住')}</div>
              <div className="text-[19px] font-bold">{fmtMd(checkIn)}</div>
            </div>
            <span className="text-[11px] text-[#999999] px-2">{s.t('共')}{nights}{s.t('晚')}</span>
            <div className="flex-1 text-right">
              <div className="text-[11px] text-[#999999]">{s.t('离店')}</div>
              <div className="text-[19px] font-bold">{fmtMd(checkOut)}</div>
            </div>
          </button>

          <button
            {...bindTap({ kind: 'action', id: 'hotelSearch.guests.open' }, { onTrigger: () => open('guests') })}
            className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer"
          >
            <span className="text-[17px] font-semibold text-[#111111]">{rooms}间房&nbsp; {adults}成人&nbsp; {children}儿童⌄</span>
            <span className="text-[15px] text-[#BBBBBB]">{s.t('价格 / 星级')}</span>
          </button>

          <div className="flex gap-1.5 overflow-x-auto pt-1">
            {chipOptions.map((c) => (
              <button
                key={c}
                type="button"
                {...bindTap({ kind: 'action', id: 'hotelSearch.query' }, { params: { city, q: c }, onTrigger: () => queryWith(c) })}
                className="whitespace-nowrap rounded-md bg-[#F7F7F7] px-2.5 py-1.5 text-[11px] text-[#333333] border-none cursor-pointer"
              >{c}</button>
            ))}
          </div>

          <PrimaryBtn binding={queryBind} className="w-full mt-3 h-11 text-[17px]">{s.t('查询')}</PrimaryBtn>
        </div>
        </div>

        <div className="mx-2 mt-3 rounded-xl border border-[#FFD5DD] bg-gradient-to-r from-[#FFF3F5] to-[#FFE8EC] p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-bold text-[#E62E52]">{s.t('一起订 · 90天内订过机票专享')}</span>
            <button type="button" {...bindTap({ kind: 'action', id: 'hotelSearch.explore.open' }, { onTrigger: () => showToast(s.t('一起订：机票+酒店同订可享折扣，请先查询酒店')) })} className="bg-transparent border-none cursor-pointer text-[#E62E52] font-semibold p-0">{s.t('查看详情 ›')}</button>
          </div>
          <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-lg border border-[#FF9BAE] bg-white text-center">
            <div className="border-r border-dashed border-[#FF9BAE] px-2 py-3">
              <div className="font-bold text-[#E72E55]">最高 <span className="text-[22px]">6</span> 折</div>
              <div className="mt-1 text-[10px] text-[#444]">{s.t('标有一起订专享的房型可用')}</div>
            </div>
            <div className="px-2 py-3">
              <div className="font-bold text-[#E72E55]">{s.t('酒店免费取消')}</div>
              <div className="mt-1 text-[10px] text-[#444]">{s.t('如遇机票航变')}</div>
            </div>
          </div>
        </div>

        <div className="mx-2 mt-3 grid grid-cols-3 gap-2">
          {[s.t('携程榜单'), s.t('特价套餐'), s.t('超值低价')].map((item, index) => (
            <button
              key={item}
              {...bindTap({ kind: 'action', id: 'hotelSearch.explore.open' }, { onTrigger: () => showToast(`${item}（演示）`) })}
              className="h-[70px] rounded-xl border-none bg-gradient-to-br from-white to-[#F2F7FF] p-2 text-left shadow-sm"
            >
              <div className="text-[14px] font-bold">{item}</div>
              <div className={`mt-1 text-[11px] ${index === 1 ? 'text-[#E94C77]' : 'text-[#1687EA]'}`}>{index === 0 ? s.t('城市精选') : index === 1 ? s.t('爆款直降') : s.t('7折起')}</div>
            </button>
          ))}
        </div>

        <button
          {...bindTap({ kind: 'action', id: 'hotelSearch.explore.open' }, { onTrigger: () => showToast(s.t('周边探索:出发地/探索多远/玩什么(演示)')) })}
          className="mx-2 mt-2 w-[calc(100%-1rem)] bg-white rounded-xl p-3 text-left border-none cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-[15px] font-semibold text-[#111111]">{s.t('周边探索')}</div>
            <div className="text-[12px] text-[#999999] mt-0.5">{s.t('不知道去哪?按距离找目的地')}</div>
          </div>
          <span className="text-[#CCCCCC]">›</span>
        </button>
      </div>

      <div data-hide-on-keyboard className="grid h-[52px] shrink-0 grid-cols-5 border-t border-[#EEEEEE] bg-white">
        {bottomItems.map((item, index) => (
          <button
            key={item.label}
            {...item.binding}
            className={`border-none bg-white py-1 text-[9px] ${index === 0 ? 'font-semibold text-[#087FE8]' : 'text-[#555]'}`}
          >
            <div className="text-[17px]">{item.icon}</div>{item.label}
          </button>
        ))}
      </div>

      {panel === 'date' && (
        <BottomSheet title={s.t('选择入住/离店日期')} onClose={close}>
          <div className="p-4">
            <div className="mb-3 flex gap-2 text-[13px]">
              <button
                type="button"
                onClick={() => setPicking('in')}
                className={`flex-1 rounded-lg border-none py-2 cursor-pointer ${picking === 'in' ? 'bg-[#0086F6] text-white' : 'bg-[#F7F8FA] text-[#333]'}`}
              >
                {s.t('入住')} {fmtMd(checkIn)}
              </button>
              <button
                type="button"
                onClick={() => setPicking('out')}
                className={`flex-1 rounded-lg border-none py-2 cursor-pointer ${picking === 'out' ? 'bg-[#0086F6] text-white' : 'bg-[#F7F8FA] text-[#333]'}`}
              >
                {s.t('离店')} {fmtMd(checkOut)}
              </button>
            </div>
            <div className="mb-2 text-[12px] text-[#999]">{today.getMonth() + 1}月 · 共{nights}晚</div>
            <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
              {Array.from({ length: daysInMonth(today) }, (_, i) => i + 1).map((d) => {
                const cand = TimeService.fromLocalParts(today.getFullYear(), today.getMonth(), d);
                const disabled = cand < today;
                const isIn = fmtMd(cand) === fmtMd(checkIn);
                const isOut = fmtMd(cand) === fmtMd(checkOut);
                const inRange = cand > checkIn && cand < checkOut;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={disabled}
                    {...bindTap({ kind: 'action', id: 'hotelSearch.date.open' }, {
                      params: { day: d, picking },
                      onTrigger: () => pickDay(d),
                    })}
                    className={`py-2 rounded border-none cursor-pointer ${
                      disabled ? 'bg-[#F0F0F0] text-[#CCC]'
                        : isIn || isOut ? 'bg-[#0086F6] text-white'
                          : inRange ? 'bg-[#CFE6FF] text-[#0086F6]'
                            : 'bg-[#F7F8FA] text-[#333333]'
                    }`}
                  >{d}</button>
                );
              })}
            </div>
            <PrimaryBtn onClick={close} className="w-full mt-4">{s.t('确定')}</PrimaryBtn>
          </div>
        </BottomSheet>
      )}

      {panel === 'guests' && (
        <BottomSheet title={s.t('房间及住客')} onClose={close}>
          <div className="p-4">
            {([
              { label: s.t('房间数'), v: rooms, set: setRooms, min: 1 },
              { label: s.t('成人'), v: adults, set: setAdults, min: 1 },
              { label: s.t('儿童'), v: children, set: setChildren, min: 0 },
            ] as const).map((r) => (
              <div key={r.label} className="flex items-center justify-between py-3 border-b border-[#F2F2F2]">
                <span className="text-[15px] text-[#222222]">{r.label}</span>
                <Stepper value={r.v} min={r.min} max={9} onChange={(d) => r.set((x) => Math.max(r.min, x + d))} />
              </div>
            ))}
            <PrimaryBtn onClick={close} className="w-full mt-4">{s.t('确定')}</PrimaryBtn>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
