import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LearningCover, PageHeader } from '../components/common';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { findCourse } from '../data/courses';
import { colors } from '../res/colors';
import { useBaicizhanStore } from '../state';

export default function CourseLessonPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const [sp] = useSearchParams();
  const st = useBaicizhanStore();
  const course = findCourse(sp.get('courseId'));
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const completed = st.courseProgress[course.id] ?? [];

  const lessons = useMemo(() => [
    { title: `先学会：${course.tags[0] ?? '核心方法'}`, phrase: 'Build a small habit, then keep it every day.', note: '先抓关键词，再结合语境判断句意。' },
    { title: `跟着练：${course.tags[1] ?? '场景表达'}`, phrase: 'Practice turns knowledge into a skill.', note: '读一遍、遮住提示复述一遍，再核对表达。' },
    { title: '完成一次小测', phrase: 'A clear goal makes progress easier to see.', note: '用今天的三个核心表达完成 1 分钟复盘。' },
  ], [course]);
  const current = lessons[chapter];
  const progress = Math.round((completed.length / lessons.length) * 100);

  const completeCurrent = () => {
    setPlaying(false);
    st.completeCourseLesson(course.id, chapter);
    if (chapter < lessons.length - 1) setChapter(chapter + 1);
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F7FB]" data-status-bar-foreground="dark">
      <PageHeader title={course.name} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <LearningCover id={course.id} title={course.name} subtitle={course.tags.join(' · ')} icon={course.icon} className="h-40 w-full rounded-3xl shadow-sm" />

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center text-sm"><span className="font-semibold text-[#33405C]">体验课进度</span><span className="ml-auto text-[#2F58E8]">{completed.length}/{lessons.length}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7EBF3]"><div className="h-full rounded-full bg-[#2F58E8] transition-all" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {lessons.map((lesson, index) => (
            <button key={lesson.title} {...action('course.lesson.chapter.select', () => { setChapter(index); setPlaying(false); }, { params: { chapter: index } })}
              className="rounded-2xl px-2 py-3 text-left" style={{ background: chapter === index ? '#EAF0FF' : '#FFFFFF', boxShadow: '0 2px 8px rgba(48,64,92,0.05)' }}>
              <div className="text-[10px] text-[#9AA5B1]">第 {index + 1} 节 {completed.includes(index) ? '✓' : ''}</div>
              <div className="mt-1 line-clamp-2 text-xs font-semibold text-[#33405C]">{lesson.title}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-[#2F58E8]">LESSON {chapter + 1}</div>
          <div className="mt-2 text-lg font-bold text-[#212121]">{current.title}</div>
          <div className="mt-4 rounded-2xl bg-[#F2F6FF] p-4 text-base leading-7 text-[#33405C]">{current.phrase}</div>
          <div className="mt-3 text-sm leading-6 text-[#7B88A0]">学习提示：{current.note}</div>
          {playing && <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E7F5EF] px-3 py-2 text-xs text-[#2C7A6B]"><span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#2C7A6B]" />正在学习本节内容</div>}
          <button {...action('course.lesson.play.toggle', () => setPlaying((value) => !value))} className="mt-5 w-full rounded-full py-3 text-sm font-semibold text-white" style={{ background: colors.primary }}>{playing ? s.coursePause : s.courseStart}</button>
          <button {...action('course.lesson.complete', completeCurrent)} className="mt-2 w-full rounded-full bg-[#EAF0FF] py-3 text-sm font-semibold text-[#2F58E8]">{completed.includes(chapter) && chapter === lessons.length - 1 ? s.done : (chapter < lessons.length - 1 ? `${s.completeLesson} · ${s.nextLesson}` : s.completeLesson)}</button>
        </div>
      </div>
    </div>
  );
}
