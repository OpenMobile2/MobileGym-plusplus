import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { JOB_STATUS_OPTIONS } from '../constants';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcChevronRight, IcPlus, IcClose } from '../res/icons';
import type { JobStatus } from '../types';

/** 求职期望管理「想找什么工作?」(IMG_8500/8502)。求职状态弹层 URL 驱动(?status=open)。 */
const ExpectManagePage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useBossStore();
  const { expects, user } = store;
  const statusOpen = searchParams.get('status') === 'open';

  return (
    <div className="flex h-full flex-col" style={{ background: 'linear-gradient(180deg, #DFF3F2 0%, #F5F6F7 200px)' }}>
      <PageHeader transparent />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-end justify-between">
          <div className="text-[24px] font-bold text-gray-900">想找什么工作?</div>
          <div className="text-[15px] text-gray-500"><span style={{ color: COLORS.accent }}>{expects.length}</span>/10</div>
        </div>
        <div className="mt-1 text-[13px] text-gray-500">添加多个求职期望,可获得更多精准工作机会</div>

        <div className="mt-4 rounded-2xl bg-white p-4">
          {expects.map((e) => (
            <button
              key={e.id}
              {...bindTap('expect.edit-open', { params: { expectId: e.id } })}
              className="flex w-full items-center justify-between py-2"
            >
              <span className="min-w-0 text-left">
                <span className="block truncate text-[17px] font-semibold text-gray-900">{e.position} [{e.city}]</span>
                <span className="mt-0.5 block text-[13px] text-gray-400">{e.salary}|{e.industry}</span>
              </span>
              <IcChevronRight size={18} className="shrink-0 text-gray-300" />
            </button>
          ))}
          <button
            {...bindTap('expect.add-open')}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-4 text-[15px] font-medium"
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
          >
            <IcPlus size={18} /> 继续添加求职期望
          </button>
        </div>

        <button
          {...action('expect.status.open', () => setSearchParams((p) => { p.set('status', 'open'); return p; }))}
          className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4"
        >
          <span className="text-[16px] font-semibold text-gray-900">求职状态</span>
          <span className="flex items-center gap-1 text-[14px] text-gray-500">{user.jobStatus}<IcChevronRight size={16} className="text-gray-300" /></span>
        </button>
      </div>

      {/* 求职状态底部弹层(IMG_8502) */}
      {statusOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-[18px] font-semibold text-gray-900">求职状态</div>
              <button onClick={() => navigate(-1)} className="p-1 text-gray-500" aria-label="关闭"><IcClose size={20} /></button>
            </div>
            <div className="mt-1 text-[13px] text-gray-500">求职状态会影响你被推荐的频率,以及Boss的决策</div>
            {JOB_STATUS_OPTIONS.map((opt) => {
              const on = user.jobStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  {...action('expect.select.status', () => { store.setJobStatus(opt.value as JobStatus); navigate(-1); }, { params: { value: opt.value } })}
                  className="flex w-full items-center justify-between border-b border-gray-50 py-4"
                >
                  <span className="flex items-center gap-2 text-[16px]" style={on ? { color: COLORS.primary, fontWeight: 600 } : { color: '#1F2937' }}>
                    {opt.value}
                    {opt.recommended && <span className="rounded bg-[#E6F5F4] px-1.5 py-0.5 text-[11px]" style={{ color: COLORS.primary }}>优先推荐</span>}
                  </span>
                  {on && <span style={{ color: COLORS.primary }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpectManagePage;
