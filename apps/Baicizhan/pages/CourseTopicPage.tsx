import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcArrowLeft } from '../res/icons';
import { LearningCover } from '../components/common';
import { COURSE_TOPICS } from '../data/courses';

export default function CourseTopicPage() {
  const s = useStrings();
  const { action, bindBack, bindTap } = useBaicizhanGestures();
  const [sp] = useSearchParams();
  const topic = COURSE_TOPICS[sp.get('id') ?? 'practical'] ?? COURSE_TOPICS.practical;
  const [tab, setTab] = useState(0);
  const visibleCourses = tab === 0
    ? topic.courses
    : topic.courses.filter((_, index) => index % Math.max(1, topic.tabs.length - 1) === tab - 1);

  return (
    <div className="flex h-full flex-col bg-[#EFF1F5]" data-status-bar-foreground="dark">
      <div className="px-3 pt-12"><button {...bindBack()}><IcArrowLeft size={22} color="#33405C" /></button></div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center gap-3 px-5 pb-4">
          <LearningCover id={topic.title} title={topic.title} subtitle="主题学习" icon={topic.icon} className="h-20 w-28 shrink-0 rounded-xl" />
          <div><div className="text-lg font-bold text-[#212121]">{topic.title}</div><div className="mt-1 text-xs text-[#7B88A0]">{topic.desc}</div><div className="mt-1 text-xs text-[#9AA5B1]">👥 {topic.learners} 人在学</div></div>
        </div>
        <div className="min-h-full rounded-t-3xl bg-white px-4 pt-3">
          <div className="flex gap-4 overflow-x-auto text-sm">
            {topic.tabs.map((label, index) => (
              <button key={label} {...action('course.topic.tab.pick', () => setTab(index), { params: { tab: index } })} className="shrink-0 pb-2" style={{ color: tab === index ? colors.primary : '#9AA5B1', fontWeight: tab === index ? 700 : 400, borderBottom: tab === index ? `2px solid ${colors.primary}` : 'none' }}>{label}</button>
            ))}
          </div>
          <div className="pt-3">
            {visibleCourses.map((course) => (
              <div key={course.id} className="mb-3 flex items-center gap-3 rounded-2xl bg-[#F7F8FA] p-3">
                <LearningCover id={course.id} title={course.name} icon={course.icon} compact className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#33405C]">{course.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1">{course.tags.map((label) => <span key={label} className="rounded bg-[#EAF0FF] px-1.5 py-0.5 text-[10px] text-[#5B78C8]">{label}</span>)}</div>
                  <div className="mt-1 text-xs font-bold" style={{ color: course.available ? '#E8912D' : '#9AA5B1' }}>{course.price}</div>
                </div>
                {course.available ? (
                  <button {...bindTap('course.topic.lesson.open', { params: { courseId: course.id } })} className="shrink-0 rounded-full bg-[#FF6B4A] px-4 py-1.5 text-xs text-white">去学习</button>
                ) : (
                  <span className="shrink-0 rounded-full bg-[#ECEFF3] px-3 py-1.5 text-xs text-[#9AA5B1]">{s.courseUnavailable}</span>
                )}
              </div>
            ))}
            {visibleCourses.length === 0 && <div className="py-12 text-center text-sm text-[#9AA5B1]">当前分类暂无课程</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
