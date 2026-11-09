import React, { useState } from 'react';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { LearningCover } from '../components/common';
import { COURSE_CATEGORIES, FEATURED_COURSES, MY_COURSE } from '../data/courses';

const TOPIC_ROWS: [string, string, string][] = [
  ['practical', '实用英语', '🧭'], ['abroad', '出国英语', '✈️'], ['exam', '大学考试', '🎓'], ['career', '职场技能', '💼'],
];

export default function CoursePage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const [tab, setTab] = useState('featured');
  const [mineTab, setMineTab] = useState('all');
  const showMyCourse = mineTab === 'all' || mineTab === 'paid';

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex items-center gap-4 px-4 pt-12">
        <button {...action('course.tab.select.featured', () => setTab('featured'))} className="text-lg" style={{ color: tab === 'featured' ? colors.ink : '#C9CDD3', fontWeight: tab === 'featured' ? 800 : 500 }}>精选</button>
        <button {...action('course.tab.select.mine', () => setTab('mine'))} className="text-lg" style={{ color: tab === 'mine' ? colors.ink : '#C9CDD3', fontWeight: tab === 'mine' ? 800 : 500 }}>我的</button>
        <span className="ml-auto rounded-full bg-[#F2F3F5] px-3 py-1 text-xs text-[#9AA5B1]">少儿版 · {s.courseUnavailable}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'featured' ? (
          <>
            <div className="mt-4 grid grid-cols-5 gap-y-4">
              {COURSE_CATEGORIES.map(([id, label, icon]) => (
                <button key={id} {...bindTap('course.topic.open', { params: { id } })} className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4FA] text-lg shadow-sm">{icon}</div>
                  <span className="text-[10px] text-[#5B6B85]">{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 text-base font-bold text-[#212121]">英语专项突破</div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {FEATURED_COURSES.map((course) => (
                <button key={course.id} {...bindTap('course.lesson.open', { params: { courseId: course.id } })} className="w-40 shrink-0 overflow-hidden rounded-2xl bg-[#F7F8FA] text-left shadow-sm">
                  <LearningCover id={course.id} title={course.name} subtitle={course.tags[0]} icon={course.icon} className="h-24 w-full" />
                  <div className="p-3">
                    <div className="text-sm font-semibold text-[#33405C]">{course.name}</div>
                    <div className="mt-1 text-xs font-semibold text-[#2F58E8]">{course.price} ›</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 text-base font-bold text-[#212121]">专题学习</div>
            {TOPIC_ROWS.map(([id, title, icon]) => (
              <button key={id} {...bindTap('course.topic.open', { params: { id } })} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-[#F4F6F9] p-3 text-left">
                <LearningCover id={id} title={title} icon={icon} compact className="h-14 w-20 rounded-xl" />
                <div><div className="text-sm font-semibold text-[#33405C]">{title} ›</div><div className="text-xs text-[#9AA5B1]">1.9w 人在学</div></div>
              </button>
            ))}

            <div className="mt-5 text-sm font-bold text-[#212121]">百词斩旗下其他学习 App</div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {['百职帮', '薄荷阅读', '薄荷英语外刊', '番茄'].map((title, index) => (
                <div key={title} className="w-24 shrink-0 rounded-2xl bg-[#F4F6F9] p-3 text-center">
                  <LearningCover id={`app-${index}`} title={title} icon={['💼', '📖', '📰', '🍅'][index]} compact className="mx-auto h-11 w-11 rounded-xl" />
                  <div className="mt-1 text-xs text-[#33405C]">{title}</div>
                  <div className="mt-1 text-[10px] text-[#9AA5B1]">{s.independentApp}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 flex gap-3 text-sm">
              <button {...action('course.mine.select.all', () => setMineTab('all'))} style={{ color: mineTab === 'all' ? colors.primary : '#9AA5B1' }}>全部</button>
              <button {...action('course.mine.select.paid', () => setMineTab('paid'))} style={{ color: mineTab === 'paid' ? colors.primary : '#9AA5B1' }}>付费类</button>
              <button {...action('course.mine.select.ended', () => setMineTab('ended'))} style={{ color: mineTab === 'ended' ? colors.primary : '#9AA5B1' }}>已结束</button>
            </div>
            {showMyCourse ? <button {...bindTap('course.mycourse.open', { params: { courseId: MY_COURSE.id } })} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-[#F4F6F9] p-3 text-left">
              <LearningCover id={MY_COURSE.id} title={MY_COURSE.name} icon={MY_COURSE.icon} compact className="h-14 w-14 rounded-xl" />
              <div><div className="text-sm font-semibold text-[#33405C]">{MY_COURSE.name}</div><div className="text-xs text-[#2F58E8]">长期有效 · 继续学习 ›</div></div>
            </button> : <div className="mt-12 text-center text-sm text-[#9AA5B1]">暂无已结束课程</div>}
            <button {...action('course.mine.gofeatured', () => setTab('featured'))} className="mt-6 w-full rounded-full bg-[#EAF0FF] py-2.5 text-sm text-[#5B78C8]">去看看精选课 ›</button>
          </>
        )}
      </div>
    </div>
  );
}
