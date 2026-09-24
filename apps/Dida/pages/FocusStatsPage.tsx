import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { IcClose } from '../res/icons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PERIODS = ['Day', 'Week', 'Month', 'Custom'] as const;

const FocusStatsPage: React.FC = () => {
  const { t } = useI18n();
  const { action, bindBack } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const records = useDidaStore((s) => s.records);
  const stats = useDidaStore((s) => s.stats);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('Day');

  const now = TimeService.getDate();
  const isToday = (ts: number) => {
    const d = TimeService.fromTimestamp(ts);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };
  const inWeek = (ts: number) => TimeService.now() - ts <= 7 * 86400000;
  const inMonth = (ts: number) => {
    const d = TimeService.fromTimestamp(ts);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const filter = (ts: number) =>
    period === 'Day' ? isToday(ts) : period === 'Week' ? inWeek(ts) : period === 'Month' ? inMonth(ts) : true;

  const periodRecords = records.filter((r) => filter(r.startTs));
  const periodMin = periodRecords.reduce((a, r) => a + r.durationMin, 0);
  const todayRecords = records.filter((r) => isToday(r.startTs));
  const todayMin = todayRecords.reduce((a, r) => a + r.durationMin, 0);

  const fmtHM = (min: number) => ({ h: Math.floor(min / 60), m: min % 60 });
  const totalHM = fmtHM(stats.totalFocusMin);
  const todayHM = fmtHM(todayMin);

  // 分布饼图:按番茄/正计时拆分本周期时长
  const pomoMin = periodRecords.filter((r) => r.type === 'pomo').reduce((a, r) => a + r.durationMin, 0);
  const swMin = periodRecords.filter((r) => r.type === 'stopwatch').reduce((a, r) => a + r.durationMin, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  const pomoFrac = periodMin > 0 ? pomoMin / periodMin : 0;

  // 近 7 天柱状:每天专注分钟
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const dayTs = TimeService.now() - (6 - i) * 86400000;
    const d = TimeService.fromTimestamp(dayTs);
    const min = records
      .filter((r) => { const rd = TimeService.fromTimestamp(r.startTs); return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate(); })
      .reduce((a, r) => a + r.durationMin, 0);
    return { label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], min };
  });
  const maxBar = Math.max(1, ...weekBars.map((b) => b.min));

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
      <div className="flex items-center justify-between px-4 py-2">
        <button {...bindBack()} aria-label="close" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"><IcClose size={20} /></button>
        <span className="text-[17px] font-semibold">{t('focus.stats')}</span>
        <span className="w-10" />
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#1C1C1E] p-4">
            <div className="text-[15px] text-white">{t('focus.todayPomo')}</div>
            <div className="mt-3 text-[32px] font-bold" style={{ color: 'var(--dida-accent)' }}>{todayRecords.filter((r) => r.type === 'pomo').length}</div>
          </div>
          <div className="rounded-2xl bg-[#1C1C1E] p-4">
            <div className="text-[15px] text-white">{t('focus.todayFocus')}</div>
            <div className="mt-3 text-[28px] font-bold" style={{ color: 'var(--dida-accent)' }}>{todayHM.h}<span className="text-[16px]">h </span>{todayHM.m}<span className="text-[16px]">m</span></div>
          </div>
          <div className="rounded-2xl bg-[#1C1C1E] p-4">
            <div className="text-[15px] text-white">{t('focus.totalPomoLabel')}</div>
            <div className="mt-3 text-[32px] font-bold" style={{ color: 'var(--dida-accent)' }}>{stats.totalPomo}</div>
          </div>
          <div className="rounded-2xl bg-[#1C1C1E] p-4">
            <div className="text-[15px] text-white">{t('focus.totalFocus')}</div>
            <div className="mt-3 text-[28px] font-bold" style={{ color: 'var(--dida-accent)' }}>{totalHM.h}<span className="text-[16px]">h </span>{totalHM.m}<span className="text-[16px]">m</span></div>
          </div>
        </div>

        {/* Period switch */}
        <div className="mt-5 flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              {...action('stats.period.select.item', () => setPeriod(p))}
              className="rounded-full px-4 py-1.5 text-[14px]"
              style={{ background: period === p ? 'var(--dida-period-selected)' : 'transparent', color: period === p ? 'var(--dida-accent)' : '#8E8E93' }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* 分布饼图(番茄 vs 正计时) */}
        <div className="mt-4 flex items-center gap-5 rounded-2xl bg-[#1C1C1E] p-4">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--dida-divider)" strokeWidth="14" />
            {periodMin > 0 && (
              <>
                <circle cx="60" cy="60" r={R} fill="none" stroke="#F79A28" strokeWidth="14" strokeDasharray={`${C * pomoFrac} ${C}`} transform="rotate(-90 60 60)" strokeLinecap="butt" />
                <circle cx="60" cy="60" r={R} fill="none" stroke="#4E7EF3" strokeWidth="14" strokeDasharray={`${C * (1 - pomoFrac)} ${C}`} strokeDashoffset={`${-C * pomoFrac}`} transform="rotate(-90 60 60)" strokeLinecap="butt" />
              </>
            )}
            <text x="60" y="58" textAnchor="middle" fill="var(--dida-text)" fontSize="18" fontWeight="600">{periodMin}</text>
            <text x="60" y="76" textAnchor="middle" fill="#8E8E93" fontSize="11">min</text>
          </svg>
          <div className="flex flex-col gap-2 text-[13px]">
            {periodMin === 0 && <span className="text-[#8E8E93]">{t('focus.noData')}</span>}
            {periodMin > 0 && (
              <>
                <span className="flex items-center gap-2 text-white"><span className="h-3 w-3 rounded-sm" style={{ background: 'var(--dida-accent)' }} />{t('focus.pomo')} · {pomoMin}m</span>
                <span className="flex items-center gap-2 text-white"><span className="h-3 w-3 rounded-sm" style={{ background: '#4E7EF3' }} />{t('focus.stopwatch')} · {swMin}m</span>
              </>
            )}
          </div>
        </div>

        {/* 近 7 天柱状趋势 */}
        <div className="mt-4 rounded-2xl bg-[#1C1C1E] p-4">
          <div className="mb-3 text-[15px] font-medium">{t('focus.trend7')}</div>
          <div className="flex h-28 items-end justify-between gap-2">
            {weekBars.map((b, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" style={{ height: `${Math.round((b.min / maxBar) * 100)}%`, minHeight: b.min > 0 ? 4 : 0, background: 'var(--dida-accent)' }} />
                </div>
                <span className="text-[11px] text-[#8E8E93]">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Records */}
        <div className="mt-4 rounded-2xl bg-[#1C1C1E] p-4">
          <div className="mb-2 text-[15px] font-medium">{t('focus.record')} · {period} ({periodMin} min)</div>
          {periodRecords.length === 0 && <div className="py-4 text-center text-[13px] text-[#8E8E93]">{t('focus.noData')}</div>}
          {periodRecords.map((r) => {
            const d = TimeService.fromTimestamp(r.startTs);
            return (
              <div key={r.id} className="flex items-center justify-between py-2">
                <span className="text-[14px] text-white">{r.taskName}</span>
                <span className="text-[13px] text-[#8E8E93]">{MONTHS[d.getMonth()]} {d.getDate()} · {r.durationMin}m</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FocusStatsPage;
