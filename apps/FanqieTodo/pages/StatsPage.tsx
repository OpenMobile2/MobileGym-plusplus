import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import {
  DAY_MS,
  dayStartMs,
  formatDashDate,
  getAppTodayMs,
  monthRangeContaining,
  sameDay,
  weekRangeContaining,
} from '../utils/appTime';
import { IcClock } from '../res/icons';
import type { FocusRecord } from '../types';

const RANGES: [string, string, string][] = [
  ['day', '日', 'stats.range.select.day'],
  ['week', '周', 'stats.range.select.week'],
  ['month', '月', 'stats.range.select.month'],
  ['custom', '自定义', 'stats.range.select.custom'],
];

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 rounded-2xl bg-[var(--app-surface)] p-4 shadow-sm">{children}</div>;
}

function filterByRange(records: FocusRecord[], range: string, anchorMs: number): FocusRecord[] {
  if (range === 'day') {
    return records.filter((r) => sameDay(r.startTs, anchorMs));
  }
  if (range === 'week') {
    const { start, end } = weekRangeContaining(anchorMs);
    return records.filter((r) => {
      const d = dayStartMs(r.startTs);
      return d >= start && d <= end;
    });
  }
  if (range === 'month') {
    const { start, end } = monthRangeContaining(anchorMs);
    return records.filter((r) => {
      const d = dayStartMs(r.startTs);
      return d >= start && d <= end;
    });
  }
  return records.filter((r) => sameDay(r.startTs, anchorMs));
}

/** 按当前周期单位前移/后移锚点(日±1 / 周±7 / 月±1),不越过今天 */
function shiftAnchor(anchorMs: number, range: string, dir: -1 | 1): number {
  const today = getAppTodayMs();
  if (range === 'week') {
    return Math.min(today, anchorMs + dir * 7 * DAY_MS);
  }
  if (range === 'month') {
    const d = TimeService.fromTimestamp(anchorMs);
    const next = TimeService.fromLocalParts(d.getFullYear(), d.getMonth() + dir, 1).getTime();
    return next > today ? today : next;
  }
  return Math.min(today, anchorMs + dir * DAY_MS);
}

export default function StatsPage() {
  const { bindTap, action } = useFanqieTodoGestures();
  const { t } = useI18n();
  const stats = useFanqieTodoStore((s) => s.stats);
  const records = useFanqieTodoStore((s) => s.records);
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const toast = () => showToast(t('toast.unavailable'));
  const [range, setRange] = React.useState<string>('day');
  const [anchorMs, setAnchorMs] = React.useState(() => getAppTodayMs());

  const dayRecords = React.useMemo(
    () => records.filter((r) => sameDay(r.startTs, anchorMs)),
    [records, anchorMs],
  );
  const dayMin = dayRecords.reduce((a, r) => a + r.durationMin, 0);
  const hh = Math.floor(stats.totalMinutes / 60);
  const mm = stats.totalMinutes % 60;

  const ranged = React.useMemo(
    () => (range === 'custom' ? dayRecords : filterByRange(records, range, anchorMs)),
    [records, range, anchorMs, dayRecords],
  );

  const PIE_COLORS = ['#FF8FA0', '#7FD4C4', '#F7C77E', '#8FB7F0', '#C3A6E0'];
  const dist = React.useMemo(() => {
    const byName = new Map<string, number>();
    let total = 0;
    for (const r of ranged) {
      const m = Math.max(1, r.durationMin);
      byName.set(r.todoName, (byName.get(r.todoName) ?? 0) + m);
      total += m;
    }
    const entries = [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { entries, total: total || 1, empty: ranged.length === 0 };
  }, [ranged]);
  const pieGradient = (() => {
    if (dist.empty) return '#E5E5E5';
    let acc = 0;
    const stops = dist.entries.map(([, v], i) => {
      const start = (acc / dist.total) * 100;
      acc += v;
      const end = (acc / dist.total) * 100;
      return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(', ') || '#E5E5E5 0 100%'})`;
  })();

  const rangeLabel =
    range === 'week'
      ? (() => {
          const { start, end } = weekRangeContaining(anchorMs);
          return `${formatDashDate(start)} ~ ${formatDashDate(end)}`;
        })()
      : range === 'month'
        ? (() => {
            const d = TimeService.fromTimestamp(monthRangeContaining(anchorMs).start);
            return `${d.getFullYear()}年${d.getMonth() + 1}月`;
          })()
        : formatDashDate(anchorMs);

  const periodTitle =
    range === 'month' ? '当月专注' : range === 'week' ? '当周专注' : t('stats.todayFocus');
  const periodCount = ranged.length;
  const periodMin = ranged.reduce((a, r) => a + r.durationMin, 0);

  const goPrev = () => setAnchorMs((a) => shiftAnchor(a, range === 'custom' ? 'day' : range, -1));
  const goNext = () => setAnchorMs((a) => shiftAnchor(a, range === 'custom' ? 'day' : range, 1));

  return (
    <div className="flex h-full flex-col bg-[var(--app-c-page-tint)]" data-status-bar-foreground="dark">
      <div className="flex items-center justify-between px-4 pb-2 pt-10">
        <span className="text-lg font-bold text-[var(--app-primary)]">{t('stats.title')}</span>
        <button {...bindTap('stats.checkin.open')} aria-label="打卡" className="text-[var(--app-primary)]"><IcClock size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <Card>
          <div className="mb-2 text-sm font-semibold text-[var(--app-primary)]">{t('stats.totalFocus')}</div>
          <div className="flex justify-between">
            <div><div className="text-xs text-[var(--app-text-muted)]">{t('stats.count')}</div><div className="text-2xl font-bold text-[var(--app-primary)]">{stats.totalCount}</div></div>
            <div><div className="text-xs text-[var(--app-text-muted)]">{t('stats.duration')}</div><div className="text-2xl font-bold text-[var(--app-primary)]">{hh}<span className="text-sm">小时</span>{mm}<span className="text-sm">分</span></div></div>
            <div><div className="text-xs text-[var(--app-text-muted)]">连续</div><div className="text-2xl font-bold text-[var(--app-primary)]">{stats.streakDays}天</div></div>
          </div>
        </Card>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#4A90D9]">{periodTitle} {rangeLabel}</span>
            <div className="flex gap-3 text-[#8A8F99]">
              <button {...action('stats.date.prev.action', goPrev)}>◀</button>
              <button {...action('stats.date.next.action', goNext)}>▶</button>
            </div>
          </div>
          <div className="mb-1 text-[11px] text-[#8A8F99]">
            {range === 'month' ? '◀▶ 按月切换,可查看更早月份' : range === 'week' ? '◀▶ 按周切换' : '◀▶ 按日切换'}
          </div>
          <div className="flex justify-between">
            <div><div className="text-xs text-[#8A8F99]">{t('stats.count')}</div><div className="text-xl font-bold text-[#4A90D9]">{range === 'day' ? dayRecords.length : periodCount}</div></div>
            <div><div className="text-xs text-[#8A8F99]">{t('stats.duration')}</div><div className="text-xl font-bold text-[#4A90D9]">{Math.floor((range === 'day' ? dayMin : periodMin) / 60)}小时{(range === 'day' ? dayMin : periodMin) % 60}分</div></div>
          </div>
        </Card>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#4A90D9]">专注时长分布</span>
            <button {...bindTap('stats.share.open')} className="text-xs text-[#4A90D9]">分享</button>
          </div>
          <div className="mb-1 text-[11px] text-[#8A8F99]">{rangeLabel}</div>
          <div className="mb-3 flex gap-1 rounded-lg bg-[#F1F3F5] p-1 text-xs">
            {RANGES.map(([r, label, id]) => (
              <button key={r} {...action(id, () => {
                if (r === 'custom') {
                  showToast('自定义范围功能暂未开放');
                  return;
                }
                setRange(r);
              })}
                className={`flex-1 rounded-md py-1 ${range === r ? 'bg-white font-semibold text-[#4A90D9]' : 'text-[#8A8F99]'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full" style={{ background: pieGradient }}>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center">
              <span className="text-[11px] text-[#8A8F99]">总计</span>
              <span className="text-lg font-bold text-[#4A90D9]">
                {dist.empty ? 0 : Math.round(dist.total)}
                <span className="text-xs">分</span>
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {dist.entries.map(([name, v], i) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#555]">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {name}
                </span>
                <span className="text-[#8A8F99]">{Math.round((v / dist.total) * 100)}%</span>
              </div>
            ))}
            {dist.empty && <div className="text-center text-xs text-[#8A8F99]">该周期暂无专注记录</div>}
          </div>
          <button {...bindTap('stats.records.open')} className="mt-3 block w-full rounded-full bg-[#EAF2FB] py-2 text-sm text-[#4A90D9]">{t('stats.viewRecords')}</button>
        </Card>

        <Card>
          <div className="mb-2 text-sm font-semibold text-[#4A90D9]">App前台运行时间</div>
          <button {...action('stats.appUsage.wontfixToast', toast)} className="text-xs text-[#8A8F99]">点击配置权限来查看App使用情况</button>
        </Card>

        <button {...action('stats.chartSettings.wontfixToast', toast)} className="mx-auto block rounded-full bg-white px-6 py-2 text-sm text-[#4A90D9] shadow-sm">统计图表设置</button>
      </div>
    </div>
  );
}
