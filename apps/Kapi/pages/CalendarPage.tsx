import React, { useMemo, useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, CategoryIcon } from '../components/ui';
import { toast } from '../components/toast';
import { money, dateKey, fmtTime, todayTs } from '../components/format';
import * as TimeService from '@/os/TimeService';
import { IcNavBack, IcArrowRight, IcPlus } from '../res/icons';
import { useStrings } from '../hooks/useStrings';

export default function CalendarPage() {
  const { bindBack, bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const bills = useKapiStore((st) => st.bills);
  const currentLedgerId = useKapiStore((st) => st.currentLedgerId);
  const [viewTs, setViewTs] = useState(todayTs());
  const [selKey, setSelKey] = useState(dateKey(todayTs()));

  const base = TimeService.fromTimestamp(viewTs);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = TimeService.fromLocalParts(year, month, 1).getDay();
  const daysInMonth = TimeService.fromLocalParts(year, month + 1, 0).getDate();

  const dayMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bills) {
      if (b.ledgerId !== currentLedgerId || b.type !== 'expense') continue;
      const k = dateKey(b.date);
      m.set(k, Math.round(((m.get(k) ?? 0) + b.amount) * 100) / 100);
    }
    return m;
  }, [bills, currentLedgerId]);

  const dayBills = useMemo(
    () => bills.filter((b) => b.ledgerId === currentLedgerId && dateKey(b.date) === selKey).sort((a, b) => b.date - a.date),
    [bills, currentLedgerId, selKey],
  );

  const shiftMonth = (d: number) => setViewTs(TimeService.fromLocalParts(year, month + d, 1, 12, 0).getTime());

  return (
    <div className="flex flex-col h-full">
      <TopBar title={s.allRecordsTitle} backBind={bindBack()} />
      <div className="flex items-center justify-center gap-6 py-2 shrink-0">
        <button {...bindAction('calendar.month.select.shift', () => shiftMonth(-1), { value: 'prev' })} className="bg-transparent border-none cursor-pointer"><IcNavBack size={20} className="text-app-text-muted" /></button>
        <span className="text-[15px] font-semibold text-app-text">{year}/{month + 1}</span>
        <button {...bindAction('calendar.month.select.shift', () => shiftMonth(1), { value: 'next' })} className="bg-transparent border-none cursor-pointer"><IcArrowRight size={20} className="text-app-text-muted" /></button>
        <button {...bindAction('calendar.today.select.reset', () => { setViewTs(todayTs()); setSelKey(dateKey(todayTs())); })} className="text-[13px] text-[#4B6EF5] bg-transparent border-none cursor-pointer">{s.backToTodayBtn}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="calendar" data-scroll-direction="vertical">
        <Card className="p-3">
          <div className="grid grid-cols-7 text-center text-[12px] text-app-text-muted mb-1">
            {[s.weekdaySun, s.weekdayMon, s.weekdayTue, s.weekdayWed, s.weekdayThu, s.weekdayFri, s.weekdaySat].map((w, i) => <span key={i}>{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ts = TimeService.fromLocalParts(year, month, day, 12, 0).getTime();
              const k = dateKey(ts);
              const spent = dayMap.get(k);
              const on = k === selKey;
              return (
                <button
                  key={day}
                  {...bindAction('calendar.day.select.date', () => setSelKey(k), { value: k })}
                  className={`flex flex-col items-center py-1 rounded-lg border-none cursor-pointer ${on ? 'bg-[#EAF0FE]' : 'bg-transparent'}`}
                >
                  <span className={`text-[13px] ${on ? 'text-[#4B6EF5] font-semibold' : 'text-app-text'}`}>{day}</span>
                  {spent ? <span className="text-[9px] text-[#3D6CF0]">-{money(spent)}</span> : <span className="text-[9px]">&nbsp;</span>}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="mt-3">
          {dayBills.length === 0 && <div className="text-center text-[13px] text-app-text-muted py-6">{s.noBillsThisDay}</div>}
          {dayBills.map((b) => (
            <Card key={b.id} className="mb-2">
              <button {...bindTap('calendar.bill.open', { params: { id: b.id } })} className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left">
                <CategoryIcon icon={b.icon} color={b.color} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-app-text truncate">{b.categoryName}{b.note ? ` · ${b.note}` : ''}</div>
                  <div className="text-[12px] text-app-text-muted">{fmtTime(b.date)}</div>
                </div>
                <span className={`text-[16px] font-semibold ${b.type === 'income' ? 'text-[#FF7B4A]' : 'text-[#3D6CF0]'}`}>{b.type === 'income' ? '+' : '-'}¥{money(b.amount)}</span>
              </button>
            </Card>
          ))}
        </div>

        <button {...bindAction('calendar.ad.noop', () => toast(s.featureNotAvailable))} className="w-full mt-2 rounded-2xl bg-gradient-to-r from-[#EAF0FE] to-[#F4F0FF] p-4 text-left border-none cursor-pointer">
          <div className="text-[13px] text-[#5A6172]">{s.dailyTipText}</div>
        </button>
      </div>

      <button
        {...bindTap('calendar.record.open')}
        className="absolute right-5 bottom-8 w-14 h-14 rounded-full bg-[#4B6EF5] flex items-center justify-center shadow-[0_4px_12px_rgba(75,110,245,0.4)] border-none cursor-pointer z-10"
      >
        <IcPlus size={28} className="text-white" />
      </button>
    </div>
  );
}
