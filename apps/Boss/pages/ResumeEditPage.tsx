import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { PageHeader, PrimaryButton } from '../components/common';

const SECTION_TITLES: Record<string, string> = {
  advantage: '个人优势',
  status: '求职状态',
  work: '工作/实习经历',
  project: '项目经历',
  education: '教育经历',
  custom: '自定义内容',
};

/** 简历各段编辑器(Q5:多行自由文本;保存为显式动作)。 */
const ResumeEditPage: React.FC = () => {
  const { action, back } = useBossGestures();
  const [searchParams] = useSearchParams();
  const store = useBossStore();
  const section = searchParams.get('section') ?? 'advantage';
  const sectionTitle = section.startsWith('custom:') ? section.slice('custom:'.length) : (SECTION_TITLES[section] ?? '编辑');
  const sections = useBossStore((s) => s.resume.sections);
  const dateRanges = useBossStore((s) => s.resume.dateRanges);
  const [text, setText] = useState(sections[section] ?? '');
  const [dateOpen, setDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState(dateRanges[section] ?? '');

  const isExperience = ['work', 'project', 'education'].includes(section);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={sectionTitle} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {isExperience && (
          <button
            {...action('resumeedit.select.date', () => setDateOpen(true), { params: { value: dateRange } })}
            className="flex w-full items-center justify-between border-b border-gray-100 py-4"
          >
            <span className="text-[15px] text-gray-800">起止日期</span>
            <span className={`text-[15px] ${dateRange ? 'text-gray-900' : 'text-gray-300'}`}>{dateRange || '请选择'}</span>
          </button>
        )}
        <textarea
          {...({ 'data-action': 'resumeedit.field.input', 'data-action-type': 'input' } as object)}
          data-keep-keyboard="true"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`填写${sectionTitle},让Boss更了解你`}
          className="mt-2 h-56 w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-gray-300"
        />
      </div>
      <div className="shrink-0 px-4 pb-6" data-keep-keyboard="true">
        <PrimaryButton
          {...action('resumeedit.save.commit', () => {
            store.saveResumeSection(section, text.trim(), dateRange);
            store.showToast('已保存');
            back();
          })}
        >
          保存
        </PrimaryButton>
      </div>

      {/* 起止日期选择弹层(Q4:弹选择器) */}
      {dateOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40" onClick={() => setDateOpen(false)}>
          <div className="rounded-t-2xl bg-white pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <button className="text-[14px] text-gray-400" onClick={() => setDateOpen(false)}>取消</button>
              <span className="text-[15px] font-semibold">选择起止日期</span>
              <button className="text-[14px] text-[#119FA4]" onClick={() => setDateOpen(false)}>确定</button>
            </div>
            <div className="max-h-64 overflow-y-auto px-4" data-scroll-container="date-picker" data-scroll-direction="vertical">
              {['2024.07 - 2024.09', '2024.09 - 2025.01', '2025.03 - 2025.06', '2025.07 - 至今'].map((r) => (
                <button key={r} onClick={() => { setDateRange(r); setDateOpen(false); }} className="block w-full py-3 text-center text-[16px] text-gray-800 active:bg-gray-50">
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEditPage;
