import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { TopBar, showToast } from '../components/ui';

const TITLE_TYPES = [
  { key: 'personal', label: '个人' },
  { key: 'company', label: '企业' },
] as const;

export function InvoicePage() {
  const { bindTap, back } = usePinduoduoGestures();
  const [titleType, setTitleType] = useState<string>('personal');
  const [taxNo, setTaxNo] = useState('');

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="发票信息" className="bg-white" />

      <div className="flex-1 overflow-y-auto">
        {/* 抬头类型 */}
        <div className="mt-2 bg-white px-4 py-3">
          <div className="text-[13px] text-[#333] mb-3">抬头类型</div>
          <div className="flex gap-3">
            {TITLE_TYPES.map((t) => {
              const on = titleType === t.key;
              return (
                <button
                  key={t.key}
                  {...bindTap({ kind: 'action', id: 'invoice.title.select.type' }, {
                    params: { type: t.key },
                    onTrigger: () => setTitleType(t.key),
                  })}
                  className={`px-5 h-8 rounded-full text-[13px] border ${on ? 'border-[#E22E1F] text-[#E22E1F] bg-[#FFF0E8]' : 'border-[#DDD] text-[#666] bg-white'}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 抬头名称 */}
        <div className="mt-2 bg-white px-4">
          <div className="flex items-center py-3 border-b border-[#F5F5F5]">
            <span className="w-20 text-[13px] text-[#333]">发票抬头</span>
            <input
              className="flex-1 text-[13px] text-[#333] outline-none"
              placeholder={titleType === 'company' ? '请输入企业名称' : '请输入个人抬头'}
            />
          </div>
          {/* 企业税号 */}
          {titleType === 'company' && (
            <div className="flex items-center py-3">
              <span className="w-20 text-[13px] text-[#333]">企业税号</span>
              <input
                value={taxNo}
                onChange={(e) => setTaxNo(e.target.value)}
                className="flex-1 text-[13px] text-[#333] outline-none"
                placeholder="请输入纳税人识别号"
              />
            </div>
          )}
        </div>
      </div>

      {/* 底部提交 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] px-4 py-2.5" data-hide-on-keyboard>
        <button
          {...bindTap({ kind: 'action', id: 'invoice.form.submit' }, {
            onTrigger: () => { showToast('发票申请已提交'); back(); },
          })}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium"
        >
          提交
        </button>
      </div>
    </div>
  );
}
