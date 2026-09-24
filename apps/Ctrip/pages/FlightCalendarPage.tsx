import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Switch } from '../components/ui';

/** 机票日历(spec flight.calendar)。仅看直飞开关;按月铺价;日期格→list。 */
export default function FlightCalendarPage() {
  const { bindTap } = useCtripGestures();
  const [direct, setDirect] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState(5);

  // 铺价:每天一个价格(演示)
  const priceOf = (d: number) => 480 + ((d * 37) % 520);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="选择出发日期" />
      <div className="shrink-0 bg-white flex items-center justify-between px-4 py-2.5 border-b border-[#F0F0F0]">
        <span className="text-[14px] text-[#333333]">仅看直飞</span>
        <Switch on={direct} onToggle={() => setDirect((v) => !v)} binding={bindTap({ kind: 'action', id: 'flightCalendar.direct.toggle' }, { onTrigger: () => setDirect((v) => !v) })} />
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-center text-[15px] font-semibold py-3">2026年7月</div>
        <div className="grid grid-cols-7 text-center text-[11px] text-[#999999] pb-1">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 px-1">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
            const p = priceOf(d);
            const low = p < 620;
            const sel = d === selectedDay;
            const dateStr = `07-${String(d).padStart(2, '0')}`;
            return (
              <button
                key={d}
                {...bindTap('flightCalendar.pick', {
                  params: { date: dateStr },
                  beforeTrigger: () => setSelectedDay(d),
                })}
                className={`flex flex-col items-center py-1.5 rounded border-none cursor-pointer ${sel ? 'bg-[#0086F6] text-white' : 'bg-transparent'}`}
              >
                <span className={`text-[14px] ${sel ? 'text-white' : 'text-[#222222]'}`}>{d}</span>
                <span className={`text-[10px] ${sel ? 'text-white' : low ? 'text-[#38A169]' : 'text-[#FF6A2C]'}`}>¥{p}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
