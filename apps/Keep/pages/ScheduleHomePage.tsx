import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { Img } from '../res/images';
import {
  IcArrowDown, IcZap, IcWatch, IcSettings, IcCalendar, IcPlay, IcLock, IcComment, IcMenu,
} from '../res/icons';
import { courseIdsOnDate } from '../store/scheduleHelpers';

/** 日程tab(AI卡卡教练)—— 证据 s054/s055 */
export default function ScheduleHomePage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const user = useKeepStore((st) => st.user);
  const member = useKeepStore((st) => st.member);
  const schedule = useKeepStore((st) => st.schedule);
  const plans = useKeepStore((st) => st.plans);
  const courses = useKeepStore((st) => st.courses);
  const startPlan = useKeepStore((st) => st.startPlan);
  const dismissRecommendedPlan = useKeepStore((st) => st.dismissRecommendedPlan);
  const restoreRecommendedPlan = useKeepStore((st) => st.restoreRecommendedPlan);
  const recordScheduleHomeView = useKeepStore((st) => st.recordScheduleHomeView);
  const goalScroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    recordScheduleHomeView();
  }, [recordScheduleHomeView]);

  const today = TimeService.getToday();
  const seedToday = schedule.weekDays.some((d) => d.date === today) ? today : null;
  const selectedDate = searchParams.get('day') ?? seedToday ?? schedule.weekDays[1]?.date ?? schedule.weekDays[0]?.date;
  const isToday = seedToday ? selectedDate === seedToday : selectedDate === (schedule.weekDays[1]?.date ?? schedule.weekDays[0]?.date);

  const recPlanId = schedule.recommendedPlanId ?? 'p_abs';
  const recPlan = plans.find((p) => p.id === recPlanId) ?? plans[0];
  const activePlan = plans.find((p) => p.id === schedule.activePlanId) ?? null;
  const recommendHidden = Boolean(schedule.recommendHidden) && !activePlan;
  const planDay = Math.max(1, schedule.planDay ?? 1);
  const todayKey = seedToday ?? TimeService.getToday();
  const dayCourses = courseIdsOnDate(schedule, selectedDate, todayKey)
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  return (
    <div
      className="flex flex-col h-full relative"
      style={{ background: 'linear-gradient(160deg, #F2EFFA 0%, #F8F4F0 40%, #F5F6F8 100%)' }}
      data-status-bar-foreground="dark"
    >
      {/* 顶栏:卡卡教练▼ / 能量 / 手表 / 设置 */}
      <div className="flex items-center px-4 h-12 shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'schedule.home.coach.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
          className="flex items-center gap-1.5 bg-transparent border-none p-0"
        >
          <span
            className="w-6 h-6 rounded-full inline-block"
            style={{ background: 'conic-gradient(#7A5AF8, #3C7CFC, #7A5AF8)' }}
          />
          <span className="text-[18px] font-bold text-app-text">卡卡教练</span>
          <IcArrowDown size={16} className="text-app-text" />
        </button>
        <div className="flex-1" />
        <button
          {...wontfix('schedule.home.energy.wontfix')}
          className="flex items-center gap-0.5 px-2.5 h-7 rounded-full bg-white/70 border border-app-border text-[13px] text-app-text mr-2"
        >
          <IcZap size={14} className="text-app-text-muted" />1
        </button>
        <button {...wontfix('schedule.home.watch.wontfix')} className="p-1.5 bg-transparent border-none text-app-text mr-1">
          <IcWatch size={20} />
        </button>
        <button {...bindTap('settings.main.open.fromSchedule')} className="p-1.5 bg-transparent border-none text-app-text">
          <IcSettings size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 问候语 */}
        <div className="px-4 pt-1 pb-3">
          <div className="text-[13px] text-app-text-muted">Hi,{user.nickname}</div>
          {!isToday && (
            <div className="text-[20px] font-bold text-app-text mt-1.5 leading-snug">
              从零开始的话,试试这套腹肌计划呀
            </div>
          )}
        </div>

        {/* 目标卡横滑 */}
        <div
          ref={goalScroller}
          {...bindTap(
            { kind: 'action', id: 'schedule.home.goalcards.swipe' },
            {
              onTrigger: () => {
                const el = goalScroller.current;
                if (el) el.scrollBy({ left: el.scrollLeft > 10 ? -180 : 180, behavior: 'smooth' });
              },
            },
          )}
          className="flex gap-2.5 overflow-x-auto px-4 pb-1"
          data-scroll-container="goals"
          data-scroll-direction="horizontal"
        >
          {schedule.goals.map((g) => (
            <button
              key={g.id}
              {...bindTap(
                { kind: 'action', id: 'schedule.home.goalcard.wontfix' },
                { params: { id: g.id }, onTrigger: () => toast(s.notOpen), stopPropagation: true },
              )}
              className="shrink-0 w-42 rounded-2xl bg-white/80 border-none text-left px-4 py-3.5"
              style={{ width: 168 }}
            >
              <div className="text-[12px] text-app-text-muted">{g.label}</div>
              <div className="flex items-end justify-between mt-1.5">
                <div className="text-[22px] font-bold text-app-text leading-none">
                  {g.current ?? '--'}
                  <span className="text-app-text-muted font-normal text-[16px]"> / {g.target ?? '--'}</span>
                  <span className="text-[11px] text-app-text-muted font-normal ml-1">{g.unit}</span>
                </div>
                <span className="w-8 h-8 rounded-full border-4 border-gray-100 inline-block" />
              </div>
            </button>
          ))}
        </div>

        {/* 我的日程 · 周日期条 */}
        <div className="flex items-center px-4 mt-3">
          <span className="text-[15px] font-semibold text-app-text">我的日程</span>
          {(schedule.leaveDays ?? 0) > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px]" style={{ background: '#FFF3E0', color: C.orange }}>
              请假中·计划顺延{schedule.leaveDays}天
            </span>
          )}
          <div className="flex-1" />
          <button {...wontfix('schedule.home.more.wontfix')} className="bg-transparent border-none text-app-text-muted text-[16px] px-1">
            ···
          </button>
        </div>
        <div className="flex px-3 mt-2">
          {schedule.weekDays.map((d) => {
            const sel = d.date === selectedDate;
            const isTodayCell = seedToday != null && d.date === seedToday;
            const hasPlan = courseIdsOnDate(schedule, d.date, todayKey).length > 0;
            return (
              <button
                key={d.date}
                {...bindTap(
                  { kind: 'action', id: 'schedule.home.date.switch' },
                  {
                    params: { date: d.date },
                    onTrigger: () =>
                      setSearchParams((p) => { p.set('day', d.date); return p; }, { replace: true }),
                  },
                )}
                className="flex-1 flex flex-col items-center gap-1.5 bg-transparent border-none py-1"
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] relative"
                  style={sel
                    ? { background: '#3B3A44', color: '#fff' }
                    : { border: '1px solid #E2E3E8', color: '#6B6F78', background: 'rgba(255,255,255,0.6)' }}
                >
                  {isTodayCell ? '今' : d.label}
                  {hasPlan && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: sel ? '#fff' : C.green }}
                    />
                  )}
                </span>
                <span className="text-[13px]" style={{ color: sel ? '#1A1A1A' : '#9AA0A8', fontWeight: sel ? 600 : 400 }}>
                  {Number(d.date.slice(8))}
                </span>
              </button>
            );
          })}
        </div>

        {/* 智能计划推荐卡 / 已开启计划 / 暂不推荐收起态 */}
        {recommendHidden ? (
          <div className="mx-4 mt-3 rounded-2xl bg-white px-4 py-4 flex items-center gap-3">
            <span style={{ color: C.purple }}>✦</span>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-app-text">智能计划推荐已收起</div>
              <div className="text-[12px] text-app-text-muted mt-0.5 truncate">下一套：{recPlan.title}</div>
            </div>
            <button
              {...bindTap(
                { kind: 'action', id: 'schedule.home.plan.dismiss' },
                { onTrigger: () => restoreRecommendedPlan() },
              )}
              className="shrink-0 px-3 py-1.5 rounded-full border-none text-[13px] text-white"
              style={{ background: C.purple }}
            >
              重新看看
            </button>
          </div>
        ) : (
          <div className="mx-4 mt-3 rounded-2xl bg-white px-4 pt-4 pb-4">
            <div className="flex items-center gap-1.5">
              <span style={{ color: C.purple }}>✦</span>
              <span className="text-[16px] font-semibold" style={{ color: C.purple }}>
                {activePlan ? '我的智能计划' : '智能计划推荐'}
              </span>
              {activePlan && (
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#EDFBF4', color: C.greenDeep }}>
                  已开启 · 第 {planDay} 天
                </span>
              )}
            </div>
            {(() => {
              const shown = activePlan ?? recPlan;
              return (
                <>
                  <div className="flex mt-3">
                    <div className="flex-1">
                      <div className="text-[12px] text-app-text-muted">预计消耗</div>
                      <div className="text-[20px] font-bold text-app-text mt-0.5">
                        {shown.kcal} <span className="text-[12px] font-normal">千卡</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] text-app-text-muted">训练难度</div>
                      <div className="text-[20px] font-bold text-app-text mt-0.5">
                        {shown.level} <span className="text-[12px] font-normal">难度</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] text-app-text-muted">计划天数</div>
                      <div className="text-[20px] font-bold text-app-text mt-0.5">
                        {shown.days} <span className="text-[12px] font-normal">天</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-app-border mt-3 pt-3 text-[13px] text-app-text-muted">{shown.title}</div>
                </>
              );
            })()}

            <div className="flex flex-col gap-3 mt-3">
              {dayCourses.map((c) => (
                <button
                  key={c.id}
                  {...bindTap('course.detail.open.fromScheduleHome', {
                    params: { courseId: c.id },
                    beforeTrigger: () => setCurrent('courseId', c.id),
                  })}
                  className="flex items-center gap-3 bg-transparent border-none p-0 text-left"
                >
                  <Img id={c.cover} className="w-16 h-13 rounded-lg object-cover shrink-0" alt={c.title} />
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-app-text truncate">{c.title}</div>
                    <div className="text-[12px] text-app-text-muted mt-1">
                      {c.level} 零基础 · {c.minutes} 分钟 · {c.kcalRange.split('-')[0].replace('千卡', '')} 千卡
                    </div>
                  </div>
                </button>
              ))}
              <button
                {...wontfix('schedule.home.bodyeval.wontfix')}
                className="flex items-center gap-3 bg-transparent border-none p-0 text-left"
              >
                <span className="w-16 h-13 rounded-lg shrink-0 flex items-center justify-center" style={{ background: '#FCEDEE' }}>
                  <span className="w-6 h-9 rounded-full" style={{ background: '#E8A2A8' }} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold text-app-text">身材体型评估</div>
                  <div className="text-[12px] text-app-text-muted mt-1">告别脂肪堆积,精准雕刻体型</div>
                </div>
              </button>
            </div>

            {!activePlan && (
              <>
                {member.active ? (
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'schedule.home.plan.join' },
                      { onTrigger: () => startPlan(recPlan.id) },
                    )}
                    className="w-full mt-4 py-3 rounded-full border-none text-[16px] font-semibold text-white"
                    style={{ background: 'linear-gradient(90deg, #E4C088, #C9A05E)' }}
                  >
                    开启计划 跟着练
                  </button>
                ) : (
                  <button
                    {...bindTap('member.center.open.fromSchedule')}
                    className="w-full mt-4 py-3 rounded-full border-none text-[16px] font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(90deg, #E4C088, #C9A05E)' }}
                  >
                    <IcLock size={16} /> 开启计划 跟着练
                  </button>
                )}
                <button
                  {...bindTap(
                    { kind: 'action', id: 'schedule.home.plan.dismiss' },
                    { onTrigger: () => dismissRecommendedPlan() },
                  )}
                  className="w-full mt-2 py-2 bg-transparent border-none text-[14px] text-app-text-muted"
                >
                  暂不推荐
                </button>
              </>
            )}
          </div>
        )}

        {/* 四快捷入口 */}
        <div className="mx-4 mt-3 mb-4 rounded-2xl bg-white flex py-4">
          {[
            { label: '我的计划', tid: 'schedule.myplan.open' as const, icon: <IcMenu size={20} /> },
            { label: '我的课程', tid: 'schedule.mycourses.open.fromSchedule' as const, icon: <IcPlay size={20} /> },
            { label: '管理日程', tid: 'schedule.manage.open' as const, icon: <IcCalendar size={20} /> },
            { label: '请假', tid: 'schedule.leave.open' as const, icon: <IcLock size={20} /> },
          ].map((e, i) => (
            <button
              key={e.tid}
              {...(e.tid === 'schedule.myplan.open'
                ? bindTap('schedule.myplan.open')
                : e.tid === 'schedule.mycourses.open.fromSchedule'
                  ? bindTap('schedule.mycourses.open.fromSchedule')
                  : e.tid === 'schedule.manage.open'
                    ? bindTap('schedule.manage.open')
                    : bindTap('schedule.leave.open'))}
              className={`flex-1 flex flex-col items-center gap-1.5 bg-transparent border-none text-app-text ${
                i > 0 ? 'border-l border-app-border' : ''
              }`}
            >
              {e.icon}
              <span className="text-[12px]">{e.label}</span>
            </button>
          ))}
        </div>
        <div className="h-16" />
      </div>

      {/* AI 对话浮球 */}
      <button
        {...wontfix('schedule.home.aifab.wontfix')}
        className="absolute right-4 bottom-6 w-13 h-13 rounded-full border-none flex items-center justify-center text-white"
        style={{ width: 52, height: 52, background: '#3B3A44', boxShadow: '0 4px 12px rgba(0,0,0,.25)' }}
      >
        <IcComment size={22} />
      </button>
    </div>
  );
}
