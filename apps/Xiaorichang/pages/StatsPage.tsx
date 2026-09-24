import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useLocalizedContent } from '../hooks/useLocalizedContent';
import { colors } from '../res/colors';
import { IconRenderer, IcSparkles, IcMoreH, IcRight, IcCalendar, IcClock, IcDot, IcCard, IcSun, IcList, IcPlus } from '../res/icons';
import { Sheet } from '../components/Sheet';
import { MenuRow, MissingContent, PageHeader, Switch } from '../components/common';
import { toDateKey, daysInMonth } from '../utils/appTime';
import type { Habit } from '../types';

const DAY_MS = 86400000;

/**
 * 统计(s75/s89/s90/s91 + Gate4 补拍 s254/s255/s256)。
 * ⚠ 周 / 月 / 年 是**三套结构完全不同的视图**,不是同一张表换数据:
 *   周 = 习惯 × 星期 表格;月 = 每习惯一张月历卡;年 = 每习惯一张 12 月柱状卡。
 *   第一版把三档糊成了一个周表格,这是实现偷懒,不是 spec 没写。
 * ⚠ 坑一:任一分段切换都必须换数据源。
 */
export default function StatsPage() {
  const [sp] = useSearchParams();
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const { isEnglish } = useLocalizedContent();
  const scopedHabitId = sp.get('habitId');
  const scopedHabit = scopedHabitId ? st.habits.find((h) => h.id === scopedHabitId) : undefined;
  const [domain, setDomain] = useState<'habit' | 'focus'>('habit');
  // ⚠ s257:『天』这一档**只有番茄专注域有**,且是它的默认档;习惯打卡域只有 周/月/年。
  //    切域时必须把 range 重置到该域的默认档,否则会出现「习惯打卡 · 天」这种不存在的组合。
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>(scopedHabitId ? 'year' : 'week');
  const [offset, setOffset] = useState(0);
  const switchDomain = (d: 'habit' | 'focus') => {
    setDomain(d);
    setRange(d === 'focus' ? 'day' : 'week');
    setOffset(0);
  };
  const sheet = sp.get('sheet');

  if (scopedHabitId && !scopedHabit) return <MissingContent />;

  const habits = scopedHabit
    ? [scopedHabit]
    : st.habits.filter((h) => st.settings.showArchived || !h.archived);
  const now = TimeService.getDate();

  // ---- 当前周期的边界(offset=0 是本期)----
  const monStart = (d: Date) => {
    const back = st.settings.weekStart === 'mon' ? (d.getDay() + 6) % 7 : d.getDay();
    return TimeService.fromTimestamp(d.getTime() - back * DAY_MS);
  };
  const weekStart = TimeService.fromTimestamp(monStart(now).getTime() + offset * 7 * DAY_MS);
  const weekDays = Array.from({ length: 7 }, (_, i) => TimeService.fromTimestamp(weekStart.getTime() + i * DAY_MS));
  const [mYear, mMonth] = (() => {
    const m = now.getMonth() + offset;
    return [now.getFullYear() + Math.floor(m / 12), ((m % 12) + 12) % 12];
  })();
  const year = now.getFullYear() + offset;

  const theDay = TimeService.fromTimestamp(now.getTime() + offset * DAY_MS);
  const weekday = new Intl.DateTimeFormat(isEnglish ? 'en' : 'zh-CN', { weekday: 'long' }).format(theDay);
  const rangeLabel = range === 'day'
    ? { top: offset === 0 ? s.statsToday : '', main: `${fmtMD(theDay)} ${weekday}` }
    : range === 'week'
      ? { top: offset === 0 ? s.statsThisWeek : '', main: `${fmtMD(weekDays[0])} → ${fmtMD(weekDays[6])}` }
      : range === 'month'
        ? { top: offset === 0 ? s.statsThisMonth : '', main: `${pad(mMonth + 1)}/01 → ${pad(mMonth + 1)}/${daysInMonth(mYear, mMonth)}` }
        : { top: '', main: isEnglish ? `${year}` : `${year} 年` };

  // 收集习惯小球:本月完成打卡次数(Q9=A)
  const ballPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-`;
  const balls = st.logs.filter((l) => l.date.startsWith(ballPrefix) && l.status === 'done')
    .map((l) => habits.find((h) => h.id === l.habitId)).filter(Boolean) as Habit[];

  const RangeChip = ({ k, label, icon }: { k: typeof range; label: string; icon: React.ReactNode }) => (
    <button
      {...(k === 'day' ? action('stats.range.select.day', () => { setRange('day'); setOffset(0); })
        : k === 'week' ? action('stats.range.select.week', () => { setRange('week'); setOffset(0); })
          : k === 'month' ? action('stats.range.select.month', () => { setRange('month'); setOffset(0); })
            : action('stats.range.select.year', () => { setRange('year'); setOffset(0); }))}
      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
      style={range === k ? { background: colors.inkStrong, color: '#fff' } : { background: '#fff', color: '#424242' }}>
      {icon}{label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      {scopedHabit ? <PageHeader title={`${scopedHabit.name} · ${s.statsYear}${s.statsTitle}`} /> : <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-10">
        <button {...bindTap('stats.aireview.open')} aria-label="智能复盘"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F6F7]"><IcSparkles size={18} /></button>
        <div className="text-lg font-bold text-[#212121]">{s.statsTitle}</div>
        <button {...bindTap('stats.menu.open')} aria-label="菜单"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F6F7]"><IcMoreH size={18} /></button>
      </div>}

      {/* 领域分段:居中文字 + 浅灰药丸,不是全宽 Segmented */}
      {!scopedHabit && <div className="flex shrink-0 justify-center gap-2 py-2">
        <button {...action('stats.domain.select.habit', () => switchDomain('habit'))}
          className="rounded-full px-5 py-2 text-[15px] font-semibold"
          style={domain === 'habit' ? { background: '#F2F3F5', color: '#212121' } : { color: '#B9BEC7' }}>
          {s.statsHabitDomain}
        </button>
        <button {...action('stats.domain.select.focus', () => switchDomain('focus'))}
          className="rounded-full px-5 py-2 text-[15px] font-semibold"
          style={domain === 'focus' ? { background: '#F2F3F5', color: '#212121' } : { color: '#B9BEC7' }}>
          {s.statsFocusDomain}
        </button>
      </div>}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 范围卡。『天』只在番茄专注域出现(s257) */}
        <div className="rounded-3xl bg-[#F8F8F8] p-3">
          <div className="flex justify-center gap-2">
            {scopedHabit ? <RangeChip k="year" label={s.statsYear} icon={<IcDot size={14} />} /> : <>
              {domain === 'focus' && <RangeChip k="day" label={s.statsDay} icon={<IcSun size={14} />} />}
              <RangeChip k="week" label={s.statsWeek} icon={<IcClock size={14} />} />
              <RangeChip k="month" label={s.statsMonth} icon={<IcCalendar size={14} />} />
              <RangeChip k="year" label={s.statsYear} icon={<IcDot size={14} />} />
            </>}
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <button {...action('stats.range.nav', () => setOffset((o) => o - 1), { params: { delta: -1 } })}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-[#424242]">‹</button>
            <div className="text-center">
              {rangeLabel.top && <div className="text-xs text-[#C9CDD3]">{rangeLabel.top}</div>}
              <div className="text-xl font-semibold text-[#424242]">{rangeLabel.main}</div>
            </div>
            <button {...action('stats.range.nav', () => setOffset((o) => o + 1), { params: { delta: 1 } })}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-[#424242]">›</button>
          </div>
        </div>

        {/* 收集习惯小球 */}
        <button {...bindTap('stats.glowballs.open')}
          className="mt-3 w-full rounded-3xl bg-[#F8F8F8] p-4 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EDEEF0] text-[#9AA5B1]">
              <IcCard size={20} />
            </span>
            <span className="flex-1">
              <span className="block text-base font-bold text-[#212121]">{s.statsGlowBalls}</span>
              <span className="text-xs text-[#9AA5B1]">{s.statsBallsCollected}: {balls.length}</span>
            </span>
            <IcRight size={18} className="text-[#C9CDD3]" />
          </div>
          <div className="mt-3 flex h-24 flex-wrap items-end justify-center gap-1 rounded-2xl border border-[#EEE] p-2">
            {balls.slice(0, 30).map((h, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: `${h.color}44`, color: h.color, marginBottom: i % 3 === 0 ? 10 : 0 }}>
                <IconRenderer name={h.icon} size={13} />
              </span>
            ))}
          </div>
        </button>

        {domain === 'focus' ? <FocusStats day={theDay} range={range} />
          : range === 'month' ? <MonthCards habits={habits} year={mYear} month={mMonth} />
            : range === 'year' ? <YearCards habits={habits} year={year} />
              : <WeekTable habits={habits} days={weekDays} />}
      </div>

      {sheet === 'menu' && (
        <Sheet>
          <MenuRow label={s.showArchived}
            trailing={<Switch on={st.settings.showArchived}
              {...action('stats.menu.showArchived', () => st.updateSettings({ showArchived: !st.settings.showArchived }))} />}
            {...{}} />
        </Sheet>
      )}
    </div>
  );
}

const pad = (n: number) => `${n}`.padStart(2, '0');
const fmtMD = (d: Date) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

/** 周视图:习惯 × 星期 表格。完成 = 该习惯色的圆角方块 + ✓;失败 = 斜杠;未打卡 = 空心圆。 */
function WeekTable({ habits, days }: { habits: Habit[]; days: Date[] }) {
  const st = useXiaorichangStore();
  const { bindTap } = useXiaorichangGestures();
  const s = useStrings();
  const { isEnglish, text } = useLocalizedContent();
  const heads = st.settings.weekStart === 'mon'
    ? (isEnglish ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['一', '二', '三', '四', '五', '六', '日'])
    : (isEnglish ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['日', '一', '二', '三', '四', '五', '六']);
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-[#F0F0F0]">
      <div className="grid items-center bg-[#FAFAFA] text-center text-sm text-[#9AA5B1]"
        style={{ gridTemplateColumns: `minmax(96px,1.5fr) repeat(7, 1fr)` }}>
        <div className="py-3 text-left pl-3 text-[#424242]">☰ {s.statsAll}</div>
        {heads.map((w, i) => (
          <div key={`${w}-${i}`} className="py-3" style={{ color: i >= 5 ? '#D5D8DC' : '#9AA5B1' }}>{w}</div>
        ))}
      </div>
      {habits.map((h) => (
        <div key={h.id} className="grid items-center border-t border-[#F5F5F5]"
          style={{ gridTemplateColumns: `minmax(96px,1.5fr) repeat(7, 1fr)` }}>
          <div className="flex items-center gap-1.5 truncate py-3 pl-3 text-left text-sm text-[#212121]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center" style={{ color: h.color }}>
              <IconRenderer name={h.icon} size={15} />
            </span>
            <span className="truncate">{text(h.name)}</span>
          </div>
          {days.map((d, i) => {
            const log = st.logs.find((l) => l.habitId === h.id && l.date === toDateKey(d));
            return (
              <div key={i} className="flex justify-center border-l border-[#F5F5F5] py-2.5">
                <button {...bindTap('stats.week.cell.open', { params: { habitId: h.id, date: toDateKey(d) } })}
                  className="flex h-7 w-7 items-center justify-center text-sm"
                  style={log?.status === 'done'
                    ? { background: `${h.color}66`, color: '#4A4A4A', borderRadius: 8 }
                    : log?.status === 'failed'
                      ? { color: colors.stateFail, border: `1.5px solid ${colors.stateFail}`, borderRadius: 999 }
                      : { border: '1.5px solid #E3E5E8', borderRadius: 999, color: 'transparent' }}>
                  {log?.status === 'done' ? '✓' : log?.status === 'failed' ? '／' : '·'}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** 月视图:每个习惯一张卡 —— 左侧圆形图标 + 名称 + 总计/光芒值,右侧整月月历,完成日为色块。 */
function MonthCards({ habits, year, month }: { habits: Habit[]; year: number; month: number }) {
  const st = useXiaorichangStore();
  const s = useStrings();
  const { isEnglish, text } = useLocalizedContent();
  const heads = st.settings.weekStart === 'mon'
    ? (isEnglish ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['一', '二', '三', '四', '五', '六', '日'])
    : (isEnglish ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['日', '一', '二', '三', '四', '五', '六']);
  const first = TimeService.fromLocalParts(year, month, 1);
  const startCol = st.settings.weekStart === 'mon' ? (first.getDay() + 6) % 7 : first.getDay();
  const n = daysInMonth(year, month);

  return (
    <div className="mt-3 space-y-3">
      {habits.map((h) => {
        const mine = st.logs.filter((l) => l.habitId === h.id && l.date.startsWith(`${year}-${pad(month + 1)}-`));
        const doneDays = mine.filter((l) => l.status === 'done').length;
        return (
          <div key={h.id} className="flex gap-3 rounded-2xl bg-[#FAFAFA] p-4">
            <div className="w-24 shrink-0">
              <span className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ border: `2px dashed ${h.color}66`, color: h.color }}>
                <IconRenderer name={h.icon} size={22} />
              </span>
              <div className="mt-2 truncate text-sm font-semibold text-[#212121]">{text(h.name)}</div>
              <div className="mt-3 text-xs text-[#C9CDD3]">{s.statsTotal} {doneDays}</div>
              <div className="text-xs text-[#C9CDD3]">{s.statGlow} {doneDays * h.reward}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#C9CDD3]">
                {heads.map((w, i) => <div key={`${w}-${i}`}>{w}</div>)}
                {Array.from({ length: startCol }).map((_, i) => <div key={`p${i}`} />)}
                {Array.from({ length: n }, (_, i) => i + 1).map((day) => {
                  const key = `${year}-${pad(month + 1)}-${pad(day)}`;
                  const done = mine.some((l) => l.date === key && l.status === 'done');
                  return (
                    <div key={day} className="rounded py-1 text-[11px]"
                      style={done ? { background: `${h.color}88`, color: '#4A4A4A' } : { background: '#fff', color: '#9AA5B1' }}>
                      {pad(day)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 年视图:每个习惯一张卡 —— 右侧 12 个月柱状图,柱顶标数字,空月为浅灰短横。 */
function YearCards({ habits, year }: { habits: Habit[]; year: number }) {
  const st = useXiaorichangStore();
  const s = useStrings();
  const { text } = useLocalizedContent();
  return (
    <div className="mt-3 space-y-3">
      {habits.map((h) => {
        const perMonth = Array.from({ length: 12 }, (_, m) =>
          st.logs.filter((l) => l.habitId === h.id && l.status === 'done'
            && l.date.startsWith(`${year}-${pad(m + 1)}-`)).length);
        const total = perMonth.reduce((a, b) => a + b, 0);
        const max = Math.max(1, ...perMonth);
        return (
          <div key={h.id} className="rounded-2xl bg-[#FAFAFA] p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ border: `2px dashed ${h.color}66`, color: h.color }}>
              <IconRenderer name={h.icon} size={22} />
            </span>
            <div className="mt-2 text-sm font-semibold text-[#212121]">{text(h.name)}</div>
            <div className="mt-3 flex gap-4">
              <div className="w-20 shrink-0 self-end pb-5">
                <div className="text-xs text-[#C9CDD3]">{s.statsTotal} {total}</div>
                <div className="text-xs text-[#C9CDD3]">{s.statGlow} {total * h.reward}</div>
              </div>
              <div className="flex min-w-0 flex-1 items-end gap-1" style={{ height: 110 }}>
                {perMonth.map((v, m) => (
                  <div key={m} className="flex flex-1 flex-col items-center justify-end gap-1">
                    {v > 0 && <span className="text-[10px] text-[#9AA5B1]">{v}</span>}
                    <div className="w-full rounded-t"
                      style={v > 0
                        ? { height: `${(v / max) * 80}px`, background: `${h.color}99` }
                        : { height: '4px', background: '#EDEEF0', borderRadius: 4 }} />
                    <span className="text-[10px] text-[#C9CDD3]">{m + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 番茄专注(补拍 s257,关闭阶段② 就挂着的 A3 缺口)。
 * 『天』档:累积时长卡 + 被中断卡 / 两个入口行 / 今日时间线(0~24 时刻轴,红线标当前时间)。
 * 周·月·年 三档真机没拍到,沿用日聚合柱状图并标 inferred。
 */
function FocusStats({ day, range }: { day: Date; range: 'day' | 'week' | 'month' | 'year' }) {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const now = TimeService.getDate();

  const dayKey = toDateKey(day);
  const dayRecords = st.records.filter((r) => toDateKey(TimeService.fromTimestamp(r.startTs)) === dayKey);
  const totalMin = dayRecords.reduce((a, r) => a + r.minutes, 0);
  // 「被中断」= 低于一个完整番茄(<25min)的记录。真机口径未拍到,标 inferred。
  const interrupted = dayRecords.filter((r) => r.minutes < 25).length;
  const nowFrac = (now.getHours() * 60 + now.getMinutes()) / 1440;

  if (range !== 'day') {
    return (
      <div className="mt-3 rounded-2xl bg-[#FAFAFA] p-4">
        <div className="text-sm font-semibold text-[#424242]">{s.statsDuration}</div>
        <div className="mt-3 flex h-32 items-end gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const d = TimeService.fromTimestamp(now.getTime() - (6 - i) * DAY_MS);
            const min = st.records.filter((r) => toDateKey(TimeService.fromTimestamp(r.startTs)) === toDateKey(d))
              .reduce((a, r) => a + r.minutes, 0);
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t"
                  style={{ height: `${Math.max(4, Math.min(100, min))}px`, background: min ? colors.focusStop : '#EDEEF0' }} />
                <span className="text-[10px] text-[#9AA5B1]">{d.getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-[#C9CDD3]">{s.statsInferredNote}</div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 flex gap-3">
        <div className="flex-1 rounded-2xl bg-[#FAFAFA] p-4">
          <div className="text-xs text-[#C9CDD3]">{s.statsAccumulated}</div>
          <div className="mt-1 text-2xl font-bold text-[#212121]">{totalMin} {s.minutesUnit}</div>
          <div className="mt-2 flex items-center gap-1 text-sm text-[#9AA5B1]">
            <span style={{ color: colors.focusStop }}>●</span> x {dayRecords.length}
          </div>
        </div>
        <div className="w-28 rounded-2xl bg-[#FAFAFA] p-4 text-center">
          <span className="mx-auto block h-6 w-6 rounded-full bg-[#8ECDE6]" />
          <div className="mt-2 text-sm font-bold text-[#212121]">{s.statsInterrupted}</div>
          <div className="text-sm text-[#C9CDD3]">{interrupted} {s.countUnit}</div>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <button {...bindTap('stats.focus.records.open')}
          className="flex flex-1 items-center gap-2 rounded-2xl bg-[#FAFAFA] px-3 py-3.5 text-sm font-semibold text-[#212121]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#212121] text-white"><IcList size={14} /></span>
          <span className="flex-1 text-left">{s.statsViewFocusRecords}</span>
          <IcRight size={15} className="text-[#C9CDD3]" />
        </button>
        <button {...action('stats.focus.manualAdd', () => { st.addRecordManual(25); st.showToast('已补记 25 分钟专注'); })}
          className="flex flex-1 items-center gap-2 rounded-2xl bg-[#FAFAFA] px-3 py-3.5 text-sm font-semibold text-[#212121]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#212121] text-white"><IcPlus size={14} /></span>
          <span className="flex-1 text-left">{s.statsAddFocus}</span>
          <IcRight size={15} className="text-[#C9CDD3]" />
        </button>
      </div>

      {/* 今日时间线:0~24 时刻轴,红线标当前时间 */}
      <div className="mt-3 rounded-2xl bg-[#FAFAFA] p-4">
        <div className="flex items-center justify-between">
          <div className="text-base font-bold text-[#212121]">{s.statsToday} {s.timelineTitle}</div>
          <button {...bindTap('stats.focus.timeline.open')}
            className="flex items-center gap-1 text-sm text-[#C9CDD3]">{s.statsViewDetails} <IcRight size={14} /></button>
        </div>
        <div className="relative mt-3" style={{ height: 260 }}>
          {Array.from({ length: 9 }, (_, i) => i * 3).map((h) => (
            <div key={h} className="absolute inset-x-0 flex items-center gap-2"
              style={{ top: `${(h / 24) * 100}%` }}>
              <span className="w-6 text-right text-[10px] text-[#C9CDD3]">{h}</span>
              <span className="h-px flex-1 bg-[#F0F0F0]" />
            </div>
          ))}
          {/* 专注区段 */}
          {dayRecords.map((r) => {
            const sd = TimeService.fromTimestamp(r.startTs);
            const top = ((sd.getHours() * 60 + sd.getMinutes()) / 1440) * 100;
            return (
              <div key={r.id} className="absolute rounded"
                style={{
                  top: `${top}%`, left: 34, right: 0,
                  height: `${Math.max(1.2, (r.minutes / 1440) * 100)}%`,
                  background: `${colors.focusStop}55`,
                }} />
            );
          })}
          {/* 当前时间红线 */}
          <div className="absolute flex items-center" style={{ top: `${nowFrac * 100}%`, left: 30, right: 0 }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#E88A85' }} />
            <span className="h-px flex-1" style={{ background: '#E88A85' }} />
          </div>
        </div>
      </div>
    </>
  );
}
