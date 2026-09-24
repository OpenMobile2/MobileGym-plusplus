import React from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { TopBar, C } from '../components/ui';
import { Img } from '../res/images';
import { IcArrowRight, IcCalendar } from '../res/icons';
import * as TimeService from '@/os/TimeService';
import { courseIdsOnDate } from '../store/scheduleHelpers';

/** 我的计划(AI推断简版)—— 节点 schedule.myplan(锁定Q16A) */
export default function ScheduleMyplanPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const schedule = useKeepStore((st) => st.schedule);
  const plans = useKeepStore((st) => st.plans);
  const courses = useKeepStore((st) => st.courses);

  const activePlan = plans.find((p) => p.id === schedule.activePlanId) ?? null;
  const planDay = Math.max(1, schedule.planDay ?? 1);
  const todayKey = TimeService.getToday();
  const todayCourses = courseIdsOnDate(schedule, todayKey, todayKey)
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar
        title="我的计划"
        right={
          <button
            {...bindTap({ kind: 'action', id: 'schedule.myplan.more.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
            className="bg-transparent border-none text-app-text text-[18px] px-1"
          >
            ···
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 pt-3" data-scroll-container="main" data-scroll-direction="vertical">
        {activePlan ? (
          <>
            {/* 当前计划卡 */}
            <button
              {...bindTap('plan.result.open.fromMyplan', {
                beforeTrigger: () => setCurrent('planId', activePlan.id),
              })}
              className="w-full rounded-2xl border-none text-left p-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3B3450, #221F2E)' }}
            >
              <div className="px-4 pt-4 pb-4">
                <div className="flex items-center">
                  <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'rgba(216,177,115,.2)', color: C.gold }}>
                    进行中
                  </span>
                  <div className="flex-1" />
                  <IcArrowRight size={16} className="text-white/60" />
                </div>
                <div className="text-[18px] font-bold text-white mt-2">{activePlan.title}</div>
                <div className="text-[12px] text-white/60 mt-1">
                  第 {planDay} 天 / {activePlan.days} 天
                  {(schedule.leaveDays ?? 0) > 0 ? ` · 请假顺延${schedule.leaveDays}天` : ''}
                  {' · '}每周{activePlan.daysPerWeek}天
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, Math.min(100, Math.round((planDay / activePlan.days) * 100)))}%`,
                      background: C.gold,
                    }}
                  />
                </div>
              </div>
            </button>

            {/* 今日课程 */}
            <div className="text-[15px] font-semibold text-app-text mt-4 mb-2">今日课程</div>
            <div className="rounded-2xl bg-app-surface px-4 py-1">
              {todayCourses.map((c, i) => (
                <button
                  key={c.id}
                  {...bindTap('course.detail.open.fromMyplan', {
                    params: { courseId: c.id },
                    beforeTrigger: () => setCurrent('courseId', c.id),
                  })}
                  className={`flex items-center gap-3 w-full bg-transparent border-none p-0 py-3 text-left ${
                    i < todayCourses.length - 1 ? 'border-b border-app-border' : ''
                  }`}
                >
                  <Img id={c.cover} className="w-16 h-12 rounded-lg object-cover shrink-0" alt={c.title} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-app-text truncate">{c.title}</div>
                    <div className="text-[12px] text-app-text-muted mt-0.5">
                      {c.level} · {c.minutes} 分钟 · {c.kcalRange}
                    </div>
                  </div>
                  <IcArrowRight size={16} className="text-app-text-muted" />
                </button>
              ))}
            </div>
          </>
        ) : (
          /* 空态:引导去定制 */
          <div className="flex flex-col items-center pt-20">
            <span className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: '#EFEAFB' }}>
              <IcCalendar size={36} style={{ color: C.purple }} />
            </span>
            <div className="text-[15px] text-app-text font-medium mt-4">还没有进行中的计划</div>
            <div className="text-[12px] text-app-text-muted mt-1">定制一套专属智能计划,每天跟着练</div>
            <button
              {...bindTap('quiz.flow.open.fromMyplan')}
              className="mt-6 px-10 py-3 rounded-full border-none text-white text-[15px] font-medium"
              style={{ background: C.green }}
            >
              去定制计划
            </button>
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}
