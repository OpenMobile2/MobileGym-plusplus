import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { GUIDANCE_PAGE } from '../constants';
import { Avatar, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcSearch } from '../res/icons';

/** 就业指导 羚羊计划(IMG_8444):分类 chips + 课程卡(课程 wontfix) */
const GuidancePage: React.FC = () => {
  const { action } = useBossGestures();
  const store = useBossStore();
  const [category, setCategory] = useState('');

  const courses = category ? GUIDANCE_PAGE.courses.filter((c) => c.category === category) : GUIDANCE_PAGE.courses;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="羚羊计划" />
      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="relative mx-0 h-40 bg-gradient-to-b from-[#3E4A3D] to-[#6B7A66] px-6 py-6">
          <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[12px] text-white">📄 规则说明</span>
          <div className="text-center text-[13px] tracking-widest text-white/70">—— 时间捐赠公益活动 ——</div>
          <div className="mt-1 text-center text-[30px] font-black tracking-wider text-white">羚羊计划</div>
          <p className="mt-2 text-center text-[12px] leading-relaxed text-white/80">{GUIDANCE_PAGE.banner}</p>
        </div>

        <div className="flex items-center justify-between px-4 pt-4">
          <span className="border-b-[3px] pb-1 text-[19px] font-bold text-gray-900" style={{ borderColor: COLORS.primary }}>课程列表</span>
          <span className="flex items-center gap-1 text-[14px] text-gray-500"><IcSearch size={15} /> 搜索</span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto px-4" data-scroll-container="categories" data-scroll-direction="horizontal">
          {GUIDANCE_PAGE.categories.map((cat) => (
            <button
              key={cat}
              {...action('guidance.select.category', () => setCategory(category === cat ? '' : cat), { params: { value: cat } })}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px]"
              style={category === cat ? { backgroundColor: '#E6F5F4', color: COLORS.primary } : { backgroundColor: '#F5F5F5', color: '#4B5563' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 px-4 pb-4">
          {courses.map((course) => (
            <button
              key={course.id}
              {...action('guidance.course.toast', () => store.showNotice('该课程暂未开放，请点击“我知道了”返回。'), { params: {} })}
              className="rounded-2xl bg-[#F8F9FA] p-3.5 text-left"
            >
              <span className="flex items-center gap-2">
                <Avatar imgKey={course.avatar} name={course.mentor} size={34} />
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-1 text-[14px] font-semibold text-gray-900">
                    <span className="truncate">{course.mentor}</span>
                    {course.badge && <span className="shrink-0 rounded bg-[#FBEFDD] px-1 py-0.5 text-[9px] text-[#B26418]">{course.badge}</span>}
                  </span>
                  <span className="block truncate text-[10px] text-gray-400">{course.mentorTitle}</span>
                </span>
              </span>
              <span className="mt-2 inline-block rounded bg-[#EEF0F2] px-1.5 py-0.5 text-[10px] text-gray-500">{course.category}</span>
              <span className="mt-1.5 block text-[15px] font-semibold leading-snug text-gray-900">{course.title}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-gray-500">{course.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuidancePage;
