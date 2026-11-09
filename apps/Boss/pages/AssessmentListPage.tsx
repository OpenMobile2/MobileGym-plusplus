import React from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { ASSESSMENT_LIST } from '../constants';
import { PageHeader } from '../components/common';
import { IcChevronRight } from '../res/icons';

const ICONS = ['🧩', '💗', '📘', '🗂'];

/** 职业测评列表(IMG_8445):16型可进,其余 wontfix */
const AssessmentListPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const store = useBossStore();

  return (
    <div className="flex h-full flex-col" style={{ background: 'linear-gradient(180deg, #D9F1F3 0%, #F5F6F7 220px)' }}>
      <PageHeader transparent />
      <div className="px-4">
        <div className="text-[26px] font-bold text-gray-900">职业测评</div>
        <div className="mt-1 text-[14px] text-gray-500">科学分析自我,助力求职不迷茫</div>
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {ASSESSMENT_LIST.map((a, i) => (
          <button
            key={a.id}
            {...(a.open
              ? bindTap('assessment.mbti-open')
              : action('assessment.other.toast', () => store.showNotice('该测评暂未开放，请点击“我知道了”返回。'), { params: {} }))}
            className="mb-3 flex w-full items-center justify-between rounded-2xl bg-white p-4"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F6FF] text-[22px]">{ICONS[i]}</span>
              <span className="text-left">
                <span className="block text-[16px] font-semibold text-gray-900">{a.name}</span>
                <span className="mt-0.5 block text-[12px] text-gray-400">{a.desc}</span>
              </span>
            </span>
            <IcChevronRight size={18} className="shrink-0 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default AssessmentListPage;
