import React from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { IcSearch, IcFootprints } from '../res/icons';

/** 开练吧同学 —— 锁定决策 Q17=B：暂未开放空态（AI 推断布局） */
export default function CourseBuddiesPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const hotwords = useKeepStore((st) => st.searchState.hotwords);

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      {/* 顶部搜索框 */}
      <div className="flex items-center gap-2 px-4 pt-1 pb-2 shrink-0">
        <button
          {...bindTap('course.search.open.fromBuddies')}
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

      {/* 子 tab：课程/计划/开练吧同学（选中） */}
      <div className="flex items-end gap-5 px-4 pb-1.5 shrink-0">
        <button {...bindTap('course.home.open.fromBuddies')} className="bg-transparent border-none p-0 text-[19px] text-app-text-muted">
          {s.courseSection}
        </button>
        <button {...bindTap('course.plan.open.fromBuddies')} className="bg-transparent border-none p-0 text-[19px] text-app-text-muted">
          {s.planSection}
        </button>
        <span
          className="text-[18px] font-bold"
          style={{ color: '#2B7BF3', fontStyle: 'italic', borderBottom: `3px solid ${C.green}` }}
        >
          {s.buddiesSection}
        </span>
      </div>

      {/* 空态 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex flex-col items-center pt-28">
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#F2F3F6' }}>
            <IcFootprints size={36} className="text-app-text-muted" />
          </div>
          <div className="text-[15px] text-app-text-muted mt-5">{s.notOpen}</div>
          <div className="text-[12px] text-app-text-muted mt-1.5">{s.courseBuddiesEmpty}</div>
        </div>
      </div>
    </div>
  );
}
