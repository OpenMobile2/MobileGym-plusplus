import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/ui';
import { IcShield } from '../res/icons';
import { useXianyuStore } from '../state';

const CONDITIONS = ['全新', '99新', '95新', '9成新', '8成新及以下'] as const;
const CAPACITIES = ['128G', '256G', '512G', '1T'] as const;

/** 浏览壳:纯本地估算,不真回收 */
const COND_MUL = [1, 0.9, 0.8, 0.68, 0.52];
const CAP_ADD = [0, 400, 900, 1600];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function RecycleEstimatePage() {
  const [searchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const recordTaskAudit = useXianyuStore((s) => s.recordTaskAudit);

  const model = searchParams.get('model') ?? 'iPhone 15 Pro Max';

  const [condIdx, setCondIdx] = useState(1);
  const [capIdx, setCapIdx] = useState(1);

  const base = 2600 + (hashStr(model) % 4000);
  const estimate = Math.round(base * COND_MUL[condIdx]) + CAP_ADD[capIdx];
  const low = estimate - 150;
  const high = estimate + 150;

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="回收估价" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="RecycleEstimatePage-main" data-scroll-direction="vertical">
        {/* 估价头 */}
        <div className="mx-3 mt-3 rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#1CB854,#0E9E48)' }}>
          <div className="text-[13px] text-white/90">{model} · 预估回收价</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[15px] font-bold">¥</span>
            <span className="text-[30px] font-bold leading-none">{low}</span>
            <span className="text-[18px] font-bold mx-1">~</span>
            <span className="text-[30px] font-bold leading-none">{high}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-white/90">
            <IcShield size={14} /> 实际以质检结果为准
          </div>
        </div>

        {/* 成色 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-3">
          <div className="text-[14px] font-semibold text-[#111111] mb-2">机身成色</div>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c, i) => {
              const active = i === condIdx;
              return (
                <button
                  key={c}
                  {...bindTap(
                    { kind: 'action', id: 'recycle.spec.select.target' },
                    { params: { target: c }, onTrigger: () => { setCondIdx(i); recordTaskAudit('recycleEstimate', { model, condition: c, capacity: CAPACITIES[capIdx] }); } },
                  )}
                  className={`px-3 h-8 rounded-lg text-[13px] border cursor-pointer ${
                    active ? 'bg-[#EAF8EF] text-[#1CB854] border-[#1CB854] font-medium' : 'bg-[#F4F4F4] text-[#666666] border-[#F4F4F4]'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* 容量 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-3">
          <div className="text-[14px] font-semibold text-[#111111] mb-2">存储容量</div>
          <div className="flex flex-wrap gap-2">
            {CAPACITIES.map((c, i) => {
              const active = i === capIdx;
              return (
                <button
                  key={c}
                  {...bindTap(
                    { kind: 'action', id: 'recycle.spec.select.target' },
                    { params: { target: c }, onTrigger: () => { setCapIdx(i); recordTaskAudit('recycleEstimate', { model, condition: CONDITIONS[condIdx], capacity: c }); } },
                  )}
                  className={`px-3 h-8 rounded-lg text-[13px] border cursor-pointer ${
                    active ? 'bg-[#EAF8EF] text-[#1CB854] border-[#1CB854] font-medium' : 'bg-[#F4F4F4] text-[#666666] border-[#F4F4F4]'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* 底部预约上门/确认回收 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-[12px] text-[#999999]">预估价</span>
          <div className="text-[#1CB854] font-bold text-[18px]"><span className="text-[12px]">¥</span>{low}~{high}</div>
        </div>
        <button
          onClick={() => showToast('该功能暂未开放')}
          className="shrink-0 h-10 px-6 rounded-full text-white font-semibold text-[15px] border-none cursor-pointer"
          style={{ background: '#1CB854' }}
        >
          预约上门 · 确认回收
        </button>
      </div>
      {toast}
    </div>
  );
}
