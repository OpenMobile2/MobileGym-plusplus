import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Price, BottomSheet, usePanel, EmptyState } from '../components/ui';
import { routeStationMatches } from '../utils/searchCity';
import { flightPriceOn, isFlightAvailableOn, nearbyFlightDates } from '../utils/flightAvailability';
import { systemMonthDay } from '../utils/travelDate';

/** 航班列表：按 URL from/to 过滤。 */
export default function FlightListPage() {
  const s = useCtripStrings();
  const SORTS = [{ id: 'recommend', label: s.t('推荐排序') }, { id: 'direct', label: s.t('直飞优先') }, { id: 'time', label: s.t('出发时间') }, { id: 'price', label: s.t('价格最低') }];
  const { bindTap, go } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [sp] = useSearchParams();
  const from = sp.get('from') || '上海';
  const to = sp.get('to') || '潍坊';
  const date = sp.get('date') || systemMonthDay();
  const preferDirect = sp.get('direct') === '1';
  const flights = useCtripStore((st) => st.flights);
  const recordTaskAudit = useCtripStore((st) => st.recordTaskAudit);
  const [sort, setSort] = React.useState('recommend');
  const [directOnly, setDirectOnly] = React.useState(preferDirect);
  const [period, setPeriod] = React.useState<string | null>(null);

  const setDirectFilter = React.useCallback((enabled: boolean) => {
    setDirectOnly(enabled);
    recordTaskAudit('flightDirectOnly', { from, to, enabled });
  }, [from, recordTaskAudit, to]);

  React.useEffect(() => {
    if (preferDirect) recordTaskAudit('flightDirectOnly', { from, to, enabled: true });
  }, [from, preferDirect, recordTaskAudit, to]);

  const list = React.useMemo(() => {
    let arr = flights.filter((f) => routeStationMatches(f.from, from) && routeStationMatches(f.to, to) && isFlightAvailableOn(f, date));
    if (directOnly) arr = arr.filter((f) => !f.transfer);
    if (period === s.t('上午')) arr = arr.filter((f) => Number(f.depart.split(':')[0]) < 12);
    if (period === s.t('下午')) arr = arr.filter((f) => { const h = Number(f.depart.split(':')[0]); return h >= 12 && h < 18; });
    if (period === s.t('晚上')) arr = arr.filter((f) => Number(f.depart.split(':')[0]) >= 18);
    arr = [...arr];
    if (sort === 'price') arr.sort((a, b) => flightPriceOn(a, date) - flightPriceOn(b, date));
    else if (sort === 'direct') arr.sort((a, b) => (a.transfer ? 1 : 0) - (b.transfer ? 1 : 0));
    else if (sort === 'time') arr.sort((a, b) => a.depart.localeCompare(b.depart));
    return arr;
  }, [flights, from, to, date, sort, directOnly, period, s]);

  const dateTabs = nearbyFlightDates(date);
  const routeHasFlights = flights.some((f) => routeStationMatches(f.from, from) && routeStationMatches(f.to, to));
  const lowestPrice = (candidateDate: string) => {
    const available = flights.filter((f) => routeStationMatches(f.from, from) && routeStationMatches(f.to, to) && isFlightAvailableOn(f, candidateDate));
    return available.length ? Math.min(...available.map((f) => flightPriceOn(f, candidateDate))) : null;
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title={<span className="text-[15px]">{from} → {to}</span>}
        backTo={`/flight/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`}
        rightContent={<button {...bindTap('flightList.toAlert', { params: { from, to } })} className="text-[#0086F6] text-[12px] bg-transparent border-none cursor-pointer">{s.t('低价提醒')}</button>}
      />

      <div className="shrink-0 bg-white flex overflow-x-auto border-b border-[#F0F0F0]">
        {dateTabs.map((d) => (
          <button
            key={d}
            type="button"
            {...bindTap({ kind: 'action', id: 'flightSearch.query' }, { params: { from, to, date: d }, onTrigger: () => go('flightSearch.query', { from, to, date: d }, { mode: 'replace' }) })}
            className={`flex-1 min-w-[64px] text-center py-2 border-none cursor-pointer ${d === date ? 'bg-[#EAF4FF]' : 'bg-transparent'}`}
          >
            <div className="text-[12px] text-[#333333]">{d}</div>
            <div className="text-[11px] text-[#FF6A2C]">{lowestPrice(d) === null ? (routeHasFlights ? '售罄' : '无航班') : `¥${lowestPrice(d)}`}</div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-14" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={`${from}→${to} 暂无航班`} hint={s.t('可改回上海→潍坊，或切换其它城市重试')} />
        ) : list.map((f) => (
          <div key={f.id} {...bindTap('flightList.toDetail', { params: { no: f.id } })} className="bg-white mx-2 mt-2 rounded-xl p-3 cursor-pointer">
            <div className="flex items-center">
              <div className="text-center"><div className="text-[20px] font-bold">{f.depart}</div><div className="text-[11px] text-[#999999]">{f.fromAirport}</div></div>
              <div className="flex-1 text-center px-2">
                <div className="text-[11px] text-[#999999]">{f.transfer ? `中转${f.transfer}` : s.t('直飞')}</div>
                <div className="text-[11px] text-[#999999] border-t border-[#E5E5E5] mt-1 pt-1">{f.duration}</div>
              </div>
              <div className="text-center"><div className="text-[20px] font-bold">{f.arrive}</div><div className="text-[11px] text-[#999999]">{f.toAirport}</div></div>
              <div className="text-right ml-3 pointer-events-none"><Price value={flightPriceOn(f, date)} size="m" /><div className="text-[11px] text-[#999999]">起</div></div>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#F5F5F5] text-[11px] text-[#666666]">
              <span>{f.airline} {f.flightNo}</span><span>{f.cabin}</span>
              {f.petFriendly && <span className="text-[#38A169]">{s.t('可托运宠物')}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex text-[13px] text-[#333333]">
        <button {...bindTap({ kind: 'action', id: 'flightList.sort.select.recommend' }, { onTrigger: () => open('sort') })} className="flex-1 py-3 bg-transparent border-none cursor-pointer">{SORTS.find((x) => x.id === sort)?.label} ▾</button>
        <button {...bindTap({ kind: 'action', id: 'flightList.filter.open' }, { onTrigger: () => open('filter') })} className={`flex-1 py-3 bg-transparent border-none cursor-pointer ${directOnly || period ? 'text-[#0086F6]' : ''}`}>筛选 ▾</button>
      </div>

      {panel === 'sort' && (
        <BottomSheet title={s.t('排序')} onClose={close}>
          {SORTS.map((item) => (
            <button key={item.id} {...bindTap({ kind: 'action', id: 'flightList.sort.select.recommend' }, { params: { sort: item.id }, onTrigger: () => { setSort(item.id); close(); } })} className={`w-full text-left px-5 py-3 bg-transparent border-none cursor-pointer text-[14px] ${sort === item.id ? 'text-[#0086F6] font-semibold' : 'text-[#333333]'}`}>{item.label}</button>
          ))}
        </BottomSheet>
      )}
      {panel === 'filter' && (
        <BottomSheet title={s.t('筛选')} onClose={close}>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-[13px] text-[#999999] mb-2">{s.t('航段')}</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" {...bindTap({ kind: 'action', id: 'flightList.filter.open' }, { params: { direct: '1' }, onTrigger: () => setDirectFilter(true) })} className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${directOnly ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{s.t('直飞')}</button>
                <button type="button" {...bindTap({ kind: 'action', id: 'flightList.filter.open' }, { params: { direct: '0' }, onTrigger: () => setDirectFilter(false) })} className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${!directOnly ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{s.t('全部')}</button>
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#999999] mb-2">{s.t('时段')}</div>
              <div className="flex flex-wrap gap-2">
                {[s.t('上午'), s.t('下午'), s.t('晚上')].map((o) => (
                  <button key={o} type="button" {...bindTap({ kind: 'action', id: 'flightList.filter.open' }, { params: { period: o }, onTrigger: () => setPeriod((x) => (x === o ? null : o)) })} className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${period === o ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{o}</button>
                ))}
              </div>
            </div>
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('确定')}</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
