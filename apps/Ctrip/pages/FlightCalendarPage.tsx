import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Switch } from '../components/ui';
import { useCtripStore } from '../state';
import { flightPriceOn, isFlightAvailableOn } from '../utils/flightAvailability';
import { routeStationMatches } from '../utils/searchCity';
import { daysInMonth, startOfSystemDay } from '../utils/travelDate';

/** 机票日历：选日期时带上 from/to/date/direct。 */
export default function FlightCalendarPage() {
  const s = useCtripStrings();
  const { bindTap, go } = useCtripGestures();
  const [sp] = useSearchParams();
  const from = sp.get('from') || '上海';
  const to = sp.get('to') || '潍坊';
  const passengers = sp.get('passengers') || '';
  const [direct, setDirect] = React.useState(false);
  const flights = useCtripStore((st) => st.flights);
  const recordTaskAudit = useCtripStore((st) => st.recordTaskAudit);
  const today = React.useMemo(() => startOfSystemDay(), []);
  const routeFlights = flights.filter((f) => routeStationMatches(f.from, from) && routeStationMatches(f.to, to));
  const priceOf = (date: string) => {
    const available = routeFlights.filter((f) => isFlightAvailableOn(f, date) && (!direct || !f.transfer));
    return available.length ? Math.min(...available.map((f) => flightPriceOn(f, date))) : null;
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={`${from} → ${to}`} backTo={`/flight/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`} />
      <div className="shrink-0 bg-white flex items-center justify-between px-4 py-2.5 border-b border-[#F0F0F0]">
        <span className="text-[14px] text-[#333333]">{s.t('仅看直飞')}</span>
        <Switch on={direct} onToggle={() => setDirect((v) => !v)} binding={bindTap({ kind: 'action', id: 'flightCalendar.direct.toggle' }, { onTrigger: () => setDirect((v) => {
          const next = !v;
          recordTaskAudit('flightDirectOnly', { from, to, enabled: next });
          return next;
        }) })} />
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-center text-[15px] font-semibold py-3">{today.getFullYear()}年{today.getMonth() + 1}月</div>
        <div className="grid grid-cols-7 text-center text-[11px] text-[#999999] pb-1">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 px-1">
          {Array.from({ length: daysInMonth(today) }, (_, i) => i + 1).map((d) => {
            const date = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const p = priceOf(date);
            const low = p !== null && p < 620;
            const selected = d === today.getDate();
            return (
              <button
                key={d}
                {...bindTap({ kind: 'action', id: 'flightCalendar.pick' }, {
                  params: { from, to, date, passengers, direct: direct ? '1' : '0' },
                  onTrigger: () => go('flightCalendar.pick', { from, to, date, passengers, direct: direct ? '1' : '0' }),
                })}
                className={`flex flex-col items-center py-1.5 rounded border-none cursor-pointer ${selected ? 'bg-[#0086F6] text-white' : 'bg-transparent'}`}
              >
                <span className={`text-[14px] ${selected ? 'text-white' : 'text-[#222222]'}`}>{d}</span>
                <span className={`text-[10px] ${selected ? 'text-white' : low ? 'text-[#38A169]' : 'text-[#FF6A2C]'}`}>{p === null ? (routeFlights.length ? '售罄' : '无航班') : `¥${p}`}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
