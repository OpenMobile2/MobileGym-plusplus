import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { TopBar, C } from '../components/ui';
import { Img } from '../res/images';
import { IcArrowRight, IcPlay } from '../res/icons';
import * as TimeService from '@/os/TimeService';
import { allScheduledCourseIds } from '../store/scheduleHelpers';

/** 我的课程=想练/最近列表(AI推断简版)—— 节点 schedule.mycourses(锁定Q16A) */
export default function ScheduleMycoursesPage() {
  const { bindTap, back } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const courses = useKeepStore((st) => st.courses);
  const schedule = useKeepStore((st) => st.schedule);
  const wishCourses = useKeepStore((st) => st.wishCourses);
  const wishCourseIds = useKeepStore((st) => st.wishCourseIds);
  const addScheduledCourse = useKeepStore((st) => st.addScheduledCourse);

  const pickMode = searchParams.get('pick') === '1';
  const targetDate = searchParams.get('date') ?? TimeService.getToday();
  const tab = searchParams.get('tab') === 'recent' ? 'recent' : 'wish';
  const wishIds = Array.from(new Set([...(wishCourses ?? []), ...(wishCourseIds ?? [])]));
  const listIds = tab === 'wish' ? wishIds : allScheduledCourseIds(schedule, TimeService.getToday());
  const list = (pickMode ? courses.map((course) => course.id) : listIds)
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title={pickMode ? '添加训练' : s.myCourses} />
      {/* tab切换:想练 / 最近 */}
      {!pickMode && <div className="flex px-4 pt-2 pb-1 gap-6 shrink-0 bg-app-surface border-b border-app-border">
        {([
          { key: 'wish', label: s.wish },
          { key: 'recent', label: s.recent },
        ] as const).map((t) => (
          <button
            key={t.key}
            {...bindTap(
              { kind: 'action', id: 'schedule.mycourses.tab.switch' },
              {
                params: { tab: t.key },
                onTrigger: () =>
                  setSearchParams((p) => { p.set('tab', t.key); return p; }, { replace: true }),
              },
            )}
            className="bg-transparent border-none px-0 pb-2 relative"
          >
            <span
              className="text-[15px]"
              style={{ color: tab === t.key ? '#1A1A1A' : '#9AA0A8', fontWeight: tab === t.key ? 700 : 400 }}
            >
              {t.label}
            </span>
            {tab === t.key && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-0.5 rounded-full" style={{ background: C.dark }} />
            )}
          </button>
        ))}
      </div>}

      {pickMode && (
        <div className="px-4 py-2 bg-emerald-50 text-[12px] text-emerald-700">
          选择一节课程，加入 {Number(targetDate.slice(5, 7))}月{Number(targetDate.slice(8))}日
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-3" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length > 0 ? (
          <div className="flex flex-col gap-3">
            {list.map((c) => (
              <button
                key={c.id}
                {...(pickMode
                  ? bindTap(
                      { kind: 'action', id: 'schedule.mycourses.course.add' },
                      {
                        params: { courseId: c.id, date: targetDate },
                        onTrigger: () => { addScheduledCourse(c.id, targetDate); back(); },
                      },
                    )
                  : bindTap('course.detail.open.fromMycourses', {
                      params: { courseId: c.id },
                      beforeTrigger: () => setCurrent('courseId', c.id),
                    }))}
                className="flex items-center gap-3 w-full bg-app-surface rounded-2xl border-none p-3 text-left"
              >
                <Img id={c.cover} className="w-20 h-14 rounded-lg object-cover shrink-0" alt={c.title} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-app-text truncate">{c.title}</div>
                  <div className="text-[12px] text-app-text-muted mt-1">
                    {c.level} · {c.minutes} 分钟 · {c.practiced}人练过
                  </div>
                  {!pickMode && tab === 'wish' && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#EDFBF4', color: C.greenDeep }}>
                      {s.wished}
                    </span>
                  )}
                </div>
                {pickMode
                  ? <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[12px]">添加</span>
                  : <IcArrowRight size={16} className="text-app-text-muted" />}
              </button>
            ))}
          </div>
        ) : (
          /* 空态:去找课程 */
          <div className="flex flex-col items-center pt-20">
            <span className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: '#EDFBF4' }}>
              <IcPlay size={34} style={{ color: C.green }} />
            </span>
            <div className="text-[15px] text-app-text font-medium mt-4">
              {tab === 'wish' ? s.noWishedCourses : s.noRecentCourses}
            </div>
            <div className="text-[12px] text-app-text-muted mt-1">{s.chooseCourseHint}</div>
            <button
              {...bindTap('course.all.open.fromMycourses')}
              className="mt-6 px-10 py-3 rounded-full border-none text-white text-[15px] font-medium"
              style={{ background: C.green }}
            >
              {s.findCourses}
            </button>
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}
