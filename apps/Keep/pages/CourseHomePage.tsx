import React from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { Img } from '../res/images';
import { IcSearch, IcArrowRight, IcMenu, IcPlay, IcScan, IcTabCourse, IcMapPin } from '../res/icons';
import type { KeepCourse } from '../types';

/** 课程 tab·课程子页 —— 证据 s002 / recE@00:00 / recC@00:00 */
export default function CourseHomePage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const courses = useKeepStore((st) => st.courses);
  const hotwords = useKeepStore((st) => st.searchState.hotwords);

  const pick = (ids: string[]): KeepCourse[] =>
    ids.map((id) => courses.find((c) => c.id === id)).filter((c): c is KeepCourse => Boolean(c));
  const recent = pick(['c_bigweight', 'c_backschool', 'c_live40']);
  const custom = pick(['c_belly1', 'c_easyburn', 'c_hiit20']);
  const recentTags = ['全程站立', '', '无跳跃'];
  const customTags = ['低噪音', '全程站立', ''];
  const levelLabel = (lv: string) => (lv === 'K1' ? '零基础' : lv === 'K3' ? '进阶' : lv === 'K4' ? '强化' : '初学');

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      {/* 顶部搜索框 */}
      <div className="flex items-center gap-2 px-4 pt-1 pb-2 shrink-0">
        <button
          {...bindTap('course.search.open')}
          className="flex-1 flex items-center gap-2 h-10 px-3.5 rounded-full border-none text-left"
          style={{ background: '#F2F3F6' }}
        >
          <IcSearch size={18} className="text-app-text-muted" />
          <span className="text-[14px] text-app-text-muted truncate">{hotwords[0]}</span>
        </button>
        <span
          className="w-8 h-8 rounded-full shrink-0"
          style={{ background: 'conic-gradient(from 20deg, #7A5AF8, #B5A2FF, #7A5AF8)' }}
        />
      </div>

      {/* 子 tab：课程（选中）/计划/开练吧同学 */}
      <div className="flex items-end gap-5 px-4 pb-1.5 shrink-0">
        <span className="text-[20px] font-bold text-app-text" style={{ borderBottom: `3px solid ${C.green}` }}>
          {s.courseSection}
        </span>
        <button {...bindTap('course.plan.open')} className="bg-transparent border-none p-0 text-[19px] text-app-text-muted">
          {s.planSection}
        </button>
        <button
          {...bindTap('course.buddies.open')}
          className="bg-transparent border-none p-0 text-[18px] font-bold"
          style={{ color: '#2B7BF3', fontStyle: 'italic' }}
        >
          {s.buddiesSection}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 金刚区五入口 */}
        <div className="flex gap-2 px-4 pt-3">
          <button
            {...bindTap('course.all.open', { beforeTrigger: () => setCurrent('courseCat', '全部课程') })}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border border-app-border bg-app-surface text-app-text"
          >
            <IcMenu size={22} />
            <span className="text-[12px]">{s.allCourses}</span>
          </button>
          <button
            {...bindTap('course.all.open.fromFree', { beforeTrigger: () => setCurrent('courseCat', '免费课') })}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border border-app-border bg-app-surface text-app-text"
          >
            <IcPlay size={22} />
            <span className="text-[12px]">{s.freeCourses}</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'course.home.live.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 rounded-lg border border-app-border bg-app-surface text-app-text-muted"
            aria-label={`${s.liveCourses}，${s.comingSoon}`}
          >
            <IcScan size={22} className="opacity-55" />
            <span className="text-[12px] text-app-text">{s.liveCourses}</span>
            <span className="text-[9px] leading-none" style={{ color: '#A0A4AD' }}>{s.comingSoon}</span>
          </button>
          <button
            {...bindTap('action.hub.open')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border border-app-border bg-app-surface text-app-text"
          >
            <IcTabCourse size={22} />
            <span className="text-[12px]">{s.actionLibrary}</span>
          </button>
          <button
            {...bindTap('route.list.open')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border border-app-border bg-app-surface text-app-text"
          >
            <IcMapPin size={22} />
            <span className="text-[12px]">{s.findRoutes}</span>
          </button>
        </div>

        {/* 最近常练 */}
        <div className="flex items-center px-4 mt-5 mb-2">
          <span className="text-[18px] font-bold text-app-text">最近常练</span>
          <div className="flex-1" />
          <IcArrowRight size={18} className="text-app-text-muted" />
        </div>
        <div className="flex flex-col gap-3 px-4">
          {recent.map((c, i) => (
            <button
              key={c.id}
              {...bindTap('course.detail.open.fromRecent', {
                params: { courseId: c.id },
                beforeTrigger: () => setCurrent('courseId', c.id),
              })}
              className="flex items-center gap-3 bg-transparent border-none p-0 text-left"
            >
              <Img id={c.cover} className="w-29 h-20 rounded-lg object-cover shrink-0" alt={c.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text leading-snug line-clamp-2">{c.title}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {recentTags[i] && (
                    <span className="px-1 py-0.5 rounded text-[10px] border" style={{ color: C.greenDeep, borderColor: C.green }}>
                      {recentTags[i]}
                    </span>
                  )}
                  <span className="text-[12px] text-app-text-muted">
                    {c.level} {levelLabel(c.level)} {c.minutes} 分钟
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 独属于你的定制课程 */}
        <div className="flex items-center px-4 mt-5 mb-2">
          <span className="text-[18px] font-bold text-app-text">⭐ 独属于你的定制课程 ⭐</span>
          <div className="flex-1" />
          <IcArrowRight size={18} className="text-app-text-muted" />
        </div>
        <div className="flex flex-col gap-3 px-4 pb-6">
          {custom.map((c, i) => (
            <button
              key={c.id}
              {...bindTap('course.detail.open.fromCustom', {
                params: { courseId: c.id },
                beforeTrigger: () => setCurrent('courseId', c.id),
              })}
              className="flex items-center gap-3 bg-transparent border-none p-0 text-left"
            >
              <Img id={c.cover} className="w-29 h-20 rounded-lg object-cover shrink-0" alt={c.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text leading-snug line-clamp-2">{c.title}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {customTags[i] && (
                    <span className="px-1 py-0.5 rounded text-[10px] border" style={{ color: C.greenDeep, borderColor: C.green }}>
                      {customTags[i]}
                    </span>
                  )}
                  <span className="text-[12px] text-app-text-muted">
                    {c.level} {levelLabel(c.level)} {c.minutes} 分钟
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
