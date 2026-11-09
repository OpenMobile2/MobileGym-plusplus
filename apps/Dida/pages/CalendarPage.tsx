import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { IcMatrix, IcPlus, IcCheck, IcBack, IcChevronRight } from '../res/icons';
import { priorityColor } from '../res/colors';
import { PRIORITY_META } from '../constants';
import type { Task } from '../types';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WD_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type DayRef = { y: number; m: number; d: number };

const CalendarPage: React.FC = () => {
  const [params] = useSearchParams();
  const { t, locale } = useI18n();
  const { action, bindTap, bindBack, back } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const tasks = useDidaStore((s) => s.tasks);
  const startOfWeek = useDidaStore((s) => s.settings.startOfWeek);
  const timeFormat = useDidaStore((s) => s.settings.timeFormat);
  const addTask = useDidaStore((s) => s.addTask);
  const toggleComplete = useDidaStore((s) => s.toggleComplete);
  const showToast = useDidaStore((s) => s.showToast);

  const today = TimeService.getDate();
  const [selDay, setSelDay] = useState(today.getDate());
  const [draftTitle, setDraftTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstWeekday = TimeService.fromLocalParts(year, month, 1).getDay();
  const startPad = (firstWeekday - startOfWeek + 7) % 7;
  const daysInMonth = TimeService.fromLocalParts(year, month + 1, 0).getDate();
  const weekLabels = Array.from({ length: 7 }, (_, i) => WD[(i + startOfWeek) % 7]);

  const calview = params.get('calview') || 'month';
  const viewOpen = params.get('view') === 'open';
  const addOpen = params.get('sheet') === 'add';
  const monthLabel = locale === 'en' ? MONTHS_EN[month] : `${month + 1}月`;

  const tasksOn = (y: number, m: number, d: number) =>
    tasks.filter((tk) => {
      if (tk.dueTs === null) return false;
      const dt = TimeService.fromTimestamp(tk.dueTs);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    });

  const dayTasks = tasksOn(year, month, selDay);
  const hasTask = (d: number) => tasksOn(year, month, d).length > 0;
  // 每天最多 2 条按优先级着色的小色块(整月视图密度,对齐真机)
  const dayBars = (d: number) =>
    tasksOn(year, month, d)
      .slice(0, 2)
      .map((tk) => ({ id: tk.id, color: priorityColor(PRIORITY_META[tk.priority].color) }));

  const monthCells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) monthCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthCells.push(d);

  // 选中日所在周的 7 天(可跨月)，周起始跟随设置
  const selDate = TimeService.fromLocalParts(year, month, selDay);
  const offsetFromWeekStart = (selDate.getDay() - startOfWeek + 7) % 7;
  const weekDays: (DayRef | null)[] = Array.from({ length: 7 }, (_, i) => {
    const dt = TimeService.fromLocalParts(year, month, selDay - offsetFromWeekStart + i);
    return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
  });

  const shiftDay = (delta: number) => {
    const next = selDay + delta;
    if (next < 1 || next > daysInMonth) return;
    setSelDay(next);
  };

  const submitAdd = () => {
    const title = (inputRef.current?.value ?? draftTitle).trim();
    if (!title) {
      showToast(t('common.titleRequired'));
      return;
    }
    const dueTs = TimeService.fromLocalParts(year, month, selDay).getTime();
    addTask({ title, dueTs, hasTime: false });
    setDraftTitle('');
    back();
  };

  const formatTaskTime = (tk: Task) => {
    if (!tk.hasTime || tk.dueTs === null) return t('calendar.allDay');
    const d = TimeService.fromTimestamp(tk.dueTs);
    const h = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (timeFormat === '12h') {
      const am = h < 12;
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${mm}${am ? ' AM' : ' PM'}`;
    }
    return `${String(h).padStart(2, '0')}:${mm}`;
  };

  const TaskRow = (tk: Task) => (
    <div key={tk.id} className="mb-2 flex w-full items-center gap-3 rounded-xl bg-[#1C1C1E] px-4 py-3">
      <span className="w-12 shrink-0 text-[12px] text-[#8E8E93]">{formatTaskTime(tk)}</span>
      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: priorityColor(PRIORITY_META[tk.priority].color) }} />
      <button
        {...action('calendar.item.complete', () => toggleComplete(tk.id), { params: { taskId: tk.id } })}
        aria-label="complete"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 bg-transparent"
        style={{ borderColor: tk.completed ? '#5A5A5E' : priorityColor(PRIORITY_META[tk.priority].color) }}
      >
        {tk.completed && <IcCheck size={12} color="#5A5A5E" />}
      </button>
      <button
        {...bindTap('cal.openTask', { params: { id: tk.id } })}
        className="min-w-0 flex-1 truncate bg-transparent text-left text-[16px]"
        style={{ color: tk.completed ? 'var(--dida-tertiary)' : 'var(--dida-text)', textDecoration: tk.completed ? 'line-through' : 'none' }}
      >
        {tk.title}
      </button>
    </div>
  );

  const weekdayLabel = locale === 'en' ? WD_EN[selDate.getDay()] : WD_ZH[selDate.getDay()];
  const dayHeroDate =
    locale === 'en' ? `${MONTHS_EN[month]} ${selDay}` : `${month + 1}月${selDay}日`;

  // 顶部标题:月/周=月份;日=Today/日期
  const headerTitle =
    calview === 'day'
      ? (selDay === today.getDate() ? t('common.today') : dayHeroDate)
      : monthLabel;

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page relative flex h-full flex-col pt-10">
      <div className="flex items-center justify-between px-4 py-2">
        <button {...bindTap('calendar.view.open')} aria-label="view" className="dida-card flex h-10 w-10 items-center justify-center rounded-full"><IcMatrix size={18} /></button>
        <span className="text-[17px] font-semibold">{headerTitle}</span>
        <span className="w-10" />
      </div>

      {/* 月视图:月历网格 */}
      {calview === 'month' && (
        <>
          <div className="dida-muted grid grid-cols-7 px-2 pt-2 text-center text-[12px]">
            {weekLabels.map((w, i) => <div key={i} className="py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-x-1 px-2 text-center">
            {monthCells.map((d, i) => (
              <div key={i} className="py-1">
                {d && (
                  <button
                    {...action('calendar.day.select.item', () => setSelDay(d), { params: { day: String(d) } })}
                    className="flex h-12 w-full flex-col items-center gap-0.5 rounded-lg pt-1"
                    style={{ background: d === selDay ? 'color-mix(in srgb, var(--dida-accent) 18%, transparent)' : 'transparent' }}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-[14px]" style={{ background: d === selDay ? 'var(--dida-accent)' : 'transparent', color: d === selDay ? '#fff' : d === today.getDate() ? 'var(--dida-accent)' : 'var(--dida-text)' }}>{d}</span>
                    <span className="flex w-full flex-col gap-0.5 px-1">
                      {dayBars(d).map((b) => <span key={b.id} className="h-1 w-full rounded-sm" style={{ background: b.color }} />)}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 周视图:7 列日程板(与日视图明显区分) */}
      {calview === 'week' && (
        <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-24 pt-1">
          <div className="grid min-h-full grid-cols-7 gap-1">
            {weekDays.map((ref, i) => {
              if (!ref) return <div key={i} />;
              const inMonth = ref.y === year && ref.m === month;
              const selected = inMonth && ref.d === selDay;
              const isToday = ref.y === today.getFullYear() && ref.m === today.getMonth() && ref.d === today.getDate();
              const colTasks = tasksOn(ref.y, ref.m, ref.d);
              return (
                <div
                  key={`${ref.y}-${ref.m}-${ref.d}`}
                  className="flex min-h-[280px] flex-col rounded-xl px-0.5 pb-2 pt-1"
                  style={{ background: selected ? 'rgba(247,154,40,0.12)' : 'var(--dida-day)' }}
                >
                  <button
                    {...(inMonth
                      ? action('calendar.day.select.item', () => setSelDay(ref.d), { params: { day: String(ref.d) } })
                      : {})}
                    disabled={!inMonth}
                    className="mb-1 flex flex-col items-center gap-0.5 bg-transparent"
                  >
                    <span className="dida-muted text-[10px]">{weekLabels[i]}</span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium"
                      style={{
                        background: selected ? 'var(--dida-accent)' : 'transparent',
                        color: selected ? '#fff' : !inMonth ? 'var(--dida-chip-off)' : isToday ? 'var(--dida-accent)' : 'var(--dida-text)',
                      }}
                    >
                      {ref.d}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col gap-1 overflow-hidden px-0.5">
                    {colTasks.slice(0, 6).map((tk) => (
                      <button
                        key={tk.id}
                        {...bindTap('cal.openTask', { params: { id: tk.id } })}
                        className="dida-on-color w-full truncate rounded px-1 py-1 text-left text-[10px] leading-tight text-white"
                        style={{
                          background: priorityColor(PRIORITY_META[tk.priority].color),
                          opacity: tk.completed ? 0.45 : 1,
                        }}
                      >
                        {tk.title}
                      </button>
                    ))}
                    {colTasks.length > 6 && (
                      <span className="text-center text-[10px] text-[#8E8E93]">+{colTasks.length - 6}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 日视图:单日英雄标题 + 议程列表(无 7 天条) */}
      {calview === 'day' && (
        <>
          <div className="flex items-center justify-between px-4 pb-2 pt-1">
            <button
              {...action('calendar.day.select.item', () => shiftDay(-1), { params: { day: String(Math.max(1, selDay - 1)) } })}
              aria-label="prev-day"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"
            >
              <IcBack size={18} />
            </button>
            <div className="text-center">
              <div className="text-[13px] text-[#8E8E93]">{weekdayLabel}</div>
              <div className="text-[28px] font-bold leading-tight">{selDay === today.getDate() ? t('common.today') : dayHeroDate}</div>
            </div>
            <button
              {...action('calendar.day.select.item', () => shiftDay(1), { params: { day: String(Math.min(daysInMonth, selDay + 1)) } })}
              aria-label="next-day"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"
            >
              <IcChevronRight size={18} />
            </button>
          </div>
          <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-3 pb-24 pt-1">
            {dayTasks.length === 0 && <div className="mt-10 text-center text-[14px] text-[#8E8E93]">{t('calendar.emptyDay')}</div>}
            {dayTasks.map(TaskRow)}
          </div>
        </>
      )}

      {/* 月视图下方:选中日任务列表 */}
      {calview === 'month' && (
        <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-3 pb-24 pt-3">
          {dayTasks.length === 0 && <div className="mt-10 text-center text-[14px] text-[#8E8E93]">{t('calendar.emptyDay')}</div>}
          {dayTasks.map(TaskRow)}
        </div>
      )}

      <button {...bindTap('calendar.add.open')} aria-label="add" className="absolute bottom-24 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ background: 'var(--dida-accent)' }}>
        <IcPlus size={26} color="#fff" />
      </button>

      {/* 视图切换菜单(日/周/月) — 顶栏按钮 → 上方弹出 */}
      {viewOpen && (
        <div className="absolute inset-0 z-40 flex flex-col">
          <div className="dida-card dida-popover mx-3 mt-14 overflow-hidden rounded-2xl px-1 py-1">
            <button {...bindTap('calendar.view.set.day')} className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[16px] text-white">
              {t('calendar.viewDay')}
              {calview === 'day' && <span style={{ color: 'var(--dida-accent)' }}><IcCheck size={18} /></span>}
            </button>
            <button {...bindTap('calendar.view.set.week')} className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[16px] text-white">
              {t('calendar.viewWeek')}
              {calview === 'week' && <span style={{ color: 'var(--dida-accent)' }}><IcCheck size={18} /></span>}
            </button>
            <button {...bindTap('calendar.view.set.month')} className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[16px] text-white">
              {t('calendar.viewMonth')}
              {calview === 'month' && <span style={{ color: 'var(--dida-accent)' }}><IcCheck size={18} /></span>}
            </button>
          </div>
          <div {...bindBack()} className="min-h-0 flex-1" aria-label="close-view" />
        </div>
      )}

      {/* 快速添加(带选中日期) */}
      {addOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" aria-label="close-add" />
          <div data-keep-keyboard="true" className="dida-popover rounded-t-2xl bg-[#1C1C1E] px-4 pb-6 pt-4">
            <input
              ref={inputRef}
              {...action('calendar.add.title.input', () => { /* onChange */ }, { params: { value: draftTitle } })}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder={t('tasks.addPlaceholder')}
              className="w-full bg-transparent text-[18px] text-white placeholder-[#8E8E93] outline-none"
            />
            <div className="mt-4 flex items-center justify-end">
              <button
                data-keep-keyboard="true"
                onPointerDown={(e) => e.preventDefault()}
                {...action('calendar.add.submit.commit', submitAdd)}
                className="rounded-full px-5 py-2 text-[15px] font-medium text-white"
                style={{ background: 'var(--dida-accent)', opacity: draftTitle.trim() ? 1 : 0.4 }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
