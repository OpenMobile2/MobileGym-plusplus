import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import {
  DAY_MS,
  dayStartMs,
  formatDashDate,
  getAppTodayMs,
  sameDay,
  weekRangeContaining,
} from '../utils/appTime';
import { weekDecoUrl } from '../assets';
import { IcBack, IcChevronRight, IcShare } from '../res/icons';

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function WeekSummaryPage() {
  const { bindBack, bindTap, action } = useFanqieTodoGestures();
  const records = useFanqieTodoStore((s) => s.records);
  const recordTaskAudit = useFanqieTodoStore((s) => s.recordTaskAudit);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const deco = weekDecoUrl('focus_glow');

  const todayMs = getAppTodayMs();
  const anchor = todayMs + weekOffset * 7 * DAY_MS;
  const { start, end } = weekRangeContaining(anchor);
  React.useEffect(() => {
    recordTaskAudit({ weekSummary: { offset: weekOffset, start, end } });
  }, [end, recordTaskAudit, start, weekOffset]);
  const weekRecords = records.filter((r) => {
    const d = dayStartMs(r.startTs);
    return d >= start && d <= end;
  });
  const totalMin = weekRecords.reduce((a, r) => a + r.durationMin, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const ms = start + i * DAY_MS;
    const d = TimeService.fromTimestamp(ms);
    const dayRecs = weekRecords.filter((r) => sameDay(r.startTs, ms));
    const min = dayRecs.reduce((a, r) => a + r.durationMin, 0);
    return {
      ms,
      label: WEEK_LABELS[i],
      day: d.getDate(),
      isToday: sameDay(ms, todayMs),
      min,
      count: dayRecs.length,
    };
  });

  const totalText =
    totalMin >= 60
      ? `${Math.floor(totalMin / 60)} 小时 ${totalMin % 60} 分钟`
      : `${totalMin} 分钟`;

  // 真机布局:2 列 × 4 行,[专注时长]占左上格,其余 7 格为周一~周日
  const cells: Array<{ kind: 'summary' } | { kind: 'day'; data: (typeof days)[number] }> = [
    { kind: 'summary' },
    ...days.map((d) => ({ kind: 'day' as const, data: d })),
  ];

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex items-center justify-between px-3 pb-3 pt-10">
        <button {...bindBack()} aria-label="返回" className="text-[#333]"><IcBack size={24} /></button>
        <span className="text-[17px] font-semibold text-[#222]">一周总结</span>
        <button {...bindTap('timeline.week.share.open')} aria-label="分享" className="text-[#333]">
          <IcShare size={20} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1 py-1 text-[15px] text-[#333]">
        <button {...action('timeline.week.prev.action', () => setWeekOffset((o) => o - 1))} aria-label="上一周" className="px-2 text-[#AAA]">
          <IcBack size={16} />
        </button>
        <span className="min-w-[210px] text-center tracking-wide">
          {formatDashDate(start)} ~ {formatDashDate(end)}
        </span>
        <button {...action('timeline.week.next.action', () => setWeekOffset((o) => Math.min(0, o + 1)))} aria-label="下一周" className="px-2 text-[#AAA]">
          <IcChevronRight size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2 grid grid-cols-2 border-t border-[#E8E8E8]">
          {cells.map((cell, idx) => {
            const borderCls = `min-h-[118px] border-b border-[#E8E8E8] ${idx % 2 === 0 ? 'border-r' : ''}`;
            if (cell.kind === 'summary') {
              return (
                <div key="summary" className={`relative overflow-hidden p-4 ${borderCls}`}>
                  {deco ? (
                    <img
                      src={deco}
                      alt=""
                      className="pointer-events-none absolute -right-2 top-2 h-[100px] w-[100px] object-contain opacity-55"
                    />
                  ) : (
                    <div className="pointer-events-none absolute -right-4 top-0 h-28 w-28 rounded-full bg-[#EEF2F7] opacity-80" />
                  )}
                  <div className="relative z-[1]">
                    <div className="text-[14px] text-[#666]">专注时长</div>
                    <div className="mt-2 text-[28px] font-semibold leading-snug text-[#222]">{totalText}</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-[#9AA0A8]">
                      {totalMin === 0 ? '今天就是最好的开始!' : '继续保持,每一分钟都算数。'}
                    </div>
                  </div>
                </div>
              );
            }
            const d = cell.data;
            return (
              <div key={d.ms} className={`p-4 ${borderCls}`}>
                <div className="flex items-center gap-1.5 text-[15px]">
                  <span className={d.isToday ? 'font-medium text-[#4A90D9]' : 'text-[#555]'}>{d.label}</span>
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center text-[15px] ${
                      d.isToday ? 'rounded-full bg-[#4A90D9] font-semibold text-white' : 'text-[#555]'
                    }`}
                  >
                    {String(d.day).padStart(2, '0')}
                  </span>
                </div>
                {d.min > 0 ? (
                  <div className="mt-3 text-xs leading-relaxed text-[#9AA0A8]">
                    {d.min >= 60 ? `${Math.floor(d.min / 60)}小时${d.min % 60}分` : `${d.min}分钟`}
                    <br />
                    {d.count} 次专注
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
