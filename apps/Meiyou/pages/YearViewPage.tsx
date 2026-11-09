/** 年历总览页。spec: record.yearView */
import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY } from '../components/ui';
import { fmtDate, parseDate, dayInfo } from '../utils/cycle';
import { IcArrowRight } from '../res/icons';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function MiniMonth({ year, month, today, periods, cycle, bindMonth }: {
  year: number; month: number; today: string;
  periods: { start: string; end: string | null }[];
  cycle: { periodLen: number; cycleLen: number; smartPredict: boolean; showPregProb: boolean };
  bindMonth: (date: string) => object;
}) {
  const first = TimeService.fromLocalParts(year, month - 1, 1);
  const startWeekday = first.getDay();
  const daysInMonth = TimeService.fromLocalParts(year, month, 0).getDate();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <button
      {...bindMonth(`${year}-${String(month).padStart(2, '0')}-01`)}
      className="bg-transparent border-none cursor-pointer text-left p-1"
    >
      <div className="text-[12px] font-semibold text-[#1A1A1A] mb-1">{month}月</div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const info = dayInfo(ds, periods, cycle);
          const isToday = ds === today;
          let bg = 'transparent';
          let color = '#BBB';
          if (info.kind === 'period') { bg = MY.periodBlock; color = '#fff'; }
          else if (info.kind === 'predict') color = '#F27BA0';
          return (
            <div key={i} className="flex items-center justify-center" style={{ height: 12 }}>
              <span
                className="text-[8px] flex items-center justify-center rounded-full"
                style={{ width: 11, height: 11, background: bg, color, border: isToday ? `1px solid ${MY.primary}` : 'none' }}
              >
                {isToday ? '今' : d}
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}

export default function YearViewPage() {
  const { bindTap } = useMeiyouGestures();
  const periods = useMeiyouStore((s) => s.periods);
  const cycle = useMeiyouStore((s) => s.cycle);
  const today = fmtDate(TimeService.now());
  const curYear = TimeService.fromTimestamp(TimeService.now()).getFullYear();
  const years = [curYear - 1, curYear, curYear + 1, curYear + 2];

  const bindMonth = (date: string) => bindTap('meiyou.monthview-open', { params: { date } });

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-end h-11 px-4 shrink-0 gap-3">
        <span className="flex items-center gap-1 text-[12px] text-[#666]">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: MY.periodBlock }} />经期
        </span>
        <span className="flex items-center text-[13px]" style={{ color: MY.primary }}>回今天<IcArrowRight size={14} /></span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="year-body" data-scroll-direction="vertical">
        {years.map((y) => (
          <div key={y} className="mt-4">
            <div className="text-[15px] font-bold text-[#1A1A1A] mb-2">{y}年</div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 12 }, (_, i) => (
                <MiniMonth key={i} year={y} month={i + 1} today={today} periods={periods} cycle={cycle} bindMonth={bindMonth} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
