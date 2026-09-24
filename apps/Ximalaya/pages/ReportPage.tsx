import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { TopBar, showToast, wontfix } from '../components/ui';
import { REPORT_REASONS } from '../constants';
import { IcCheck, IcPlus } from '../res/icons';

export function ReportPage() {
  const { bindTap, back } = useXimalayaGestures();
  const [reason, setReason] = useState<string>('');
  const [detail, setDetail] = useState('');

  const submit = () => { showToast('已提交'); back(); };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="声音举报" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 举报原因单选列表 */}
        <div className="bg-white mt-2">
          <div className="px-4 pt-3 pb-1 text-[13px] text-[#999]">请选择举报原因</div>
          {REPORT_REASONS.map((r) => {
            const active = reason === r;
            return (
              <button
                key={r}
                {...bindTap({ kind: 'action', id: 'report.reason.select.opt' }, { params: { reason: r }, onTrigger: () => setReason(r) })}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5] text-left"
              >
                <span className={'text-[14px] ' + (active ? 'text-[#FE4543]' : 'text-[#333]')}>{r}</span>
                {active && <IcCheck size={18} className="text-[#FE4543]" />}
              </button>
            );
          })}
        </div>

        {/* 举报理由输入 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="text-[15px] text-[#333] font-medium mb-2">举报理由(选填)</div>
          <textarea
            value={detail}
            maxLength={300}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="请补充详细说明,便于核实处理"
            className="w-full h-24 rounded-lg bg-[#F5F5F5] p-3 text-[14px] text-[#333] resize-none outline-none"
          />
          <div className="text-right text-[12px] text-[#BBB] mt-1">{detail.length}/300</div>
        </div>

        {/* 上传证明材料(wontfix) */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="text-[15px] text-[#333] font-medium mb-2">上传证明材料</div>
          <button
            {...bindTap({ kind: 'action', id: 'report.upload.wontfix' }, { onTrigger: wontfix })}
            className="w-20 h-20 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#BBB]"
            aria-label="上传"
          ><IcPlus size={28} /></button>
        </div>
      </div>

      {/* 提交 */}
      <div className="shrink-0 p-3 bg-white border-t border-[#F2F2F2]">
        <button
          {...bindTap({ kind: 'action', id: 'report.submit.submit' }, { onTrigger: submit })}
          className="w-full h-11 rounded-full bg-[#FE4543] text-white text-[16px] font-medium"
        >提交</button>
      </div>
    </div>
  );
}
