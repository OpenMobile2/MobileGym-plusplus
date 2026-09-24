import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { TopBar, C } from '../components/ui';
import { Img } from '../res/images';
import { IcPlus } from '../res/icons';
import { courseIdsOnDate } from '../store/scheduleHelpers';

/** 管理日程(AI推断简版:周历+已排课程,左滑移除)—— 节点 schedule.manage(锁定Q16A) */
export default function ScheduleManagePage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const schedule = useKeepStore((st) => st.schedule);
  const courses = useKeepStore((st) => st.courses);
  const removeScheduledCourse = useKeepStore((st) => st.removeScheduledCourse);

  const today = TimeService.getToday();
  const todayInSeed = schedule.weekDays.some((d) => d.date === today)
    ? today
    : schedule.weekDays[1]?.date ?? schedule.weekDays[0]?.date;
  const selectedDate = searchParams.get('d') ?? todayInSeed;

  const dayIds = courseIdsOnDate(schedule, selectedDate, todayInSeed);
  const dayCourses = dayIds
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // 左滑露出「移除」(PointerEvent,平台规范)
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const dragStartX = useRef<number | null>(null);
  const onRowPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
  };
  const onRowPointerUp = (id: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (delta < -30) setRevealedId(id);
    else if (delta > 30) setRevealedId((cur) => (cur === id ? null : cur));
  };

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title={s.manageSchedule} />
      {/* 周历 */}
      <div className="flex px-3 py-2 shrink-0 bg-app-surface border-b border-app-border">
        {schedule.weekDays.map((d) => {
          const sel = d.date === selectedDate;
          const isTodayCell = d.date === todayInSeed;
          return (
            <button
              key={d.date}
              {...bindTap(
                { kind: 'action', id: 'schedule.manage.date.switch' },
                {
                  params: { date: d.date },
                  onTrigger: () =>
                    setSearchParams((p) => { p.set('d', d.date); return p; }, { replace: true }),
                },
              )}
              className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none py-1"
            >
              <span className="text-[11px]" style={{ color: sel ? '#1A1A1A' : '#9AA0A8' }}>
                {isTodayCell ? s.todayShort : d.label}
              </span>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px]"
                style={sel ? { background: '#3B3A44', color: '#fff', fontWeight: 600 } : { color: '#6B6F78' }}
              >
                {Number(d.date.slice(8))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[13px] text-app-text-muted mb-2">
          {Number(selectedDate.slice(5, 7))}月{Number(selectedDate.slice(8))}日 · 已排 {dayCourses.length} 节
        </div>
        {dayCourses.length > 0 ? (
          <div className="flex flex-col gap-3">
            {dayCourses.map((c) => (
              <div
                key={c.id}
                className="relative overflow-hidden rounded-2xl"
                onPointerDown={onRowPointerDown}
                onPointerUp={onRowPointerUp(c.id)}
                onPointerCancel={() => { dragStartX.current = null; }}
              >
                <div
                  className="flex items-center transition-transform"
                  style={{ transform: revealedId === c.id ? 'translateX(-72px)' : 'translateX(0)' }}
                >
                  <button
                    {...bindTap('course.detail.open.fromManage', {
                      params: { courseId: c.id },
                      beforeTrigger: () => setCurrent('courseId', c.id),
                    })}
                    className="flex items-center gap-3 w-full bg-app-surface border-none p-3 text-left rounded-2xl"
                  >
                    <Img id={c.cover} className="w-16 h-12 rounded-lg object-cover shrink-0" alt={c.title} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-app-text truncate">{c.title}</div>
                      <div className="text-[12px] text-app-text-muted mt-0.5">{c.level} · {c.minutes} 分钟</div>
                    </div>
                    <span className="text-[11px] text-app-text-muted shrink-0">{s.swipeToRemove}</span>
                  </button>
                </div>
                {/* 左滑露出的移除按钮 */}
                <button
                  {...bindTap(
                    { kind: 'action', id: 'schedule.manage.item.remove' },
                    {
                      params: { courseId: c.id },
                      onTrigger: () => { removeScheduledCourse(c.id, selectedDate); setRevealedId(null); },
                    },
                  )}
                  className="absolute right-0 top-0 bottom-0 w-18 border-none text-white text-[13px]"
                  style={{ width: 72, background: C.red, display: revealedId === c.id ? 'block' : 'none' }}
                >
                  {s.remove}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-app-surface py-10 text-center text-[13px] text-app-text-muted">
            {s.noScheduleToday}
          </div>
        )}

        {/* +添加训练 */}
        <button
          {...bindTap('schedule.mycourses.open.fromManage', { params: { date: selectedDate } })}
          className="flex items-center justify-center gap-1.5 w-full mt-4 py-3 rounded-2xl bg-app-surface border border-dashed border-app-border text-app-text text-[14px]"
        >
          <IcPlus size={16} /> {s.addTraining}
        </button>
        <div className="h-6" />
      </div>
    </div>
  );
}
