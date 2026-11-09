import React from 'react';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, useToast, NOT_OPEN, VIP } from '../components/ui';
import { IcWallet } from '../res/icons';

export default function VipFloatPage() {
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="唯品花" />

      <div className="flex-1">
        {/* 额度卡 */}
        <div
          className="mx-3 mt-3 rounded-2xl px-5 py-6 text-white"
          style={{ background: 'linear-gradient(135deg,#FF7A00,#E4007F)' }}
        >
          <div className="flex items-center gap-1.5 text-[13px] opacity-90">
            <IcWallet size={16} />可用额度(元)
          </div>
          <div className="mt-2 font-bold leading-none">
            <span className="text-[40px]">0.00</span>
          </div>
          <div className="flex gap-6 mt-4 text-[12px] opacity-90">
            <div>
              <div className="text-[16px] font-semibold">0.00</div>
              <div className="opacity-80">已用额度</div>
            </div>
            <div>
              <div className="text-[16px] font-semibold">15000</div>
              <div className="opacity-80">预估总额度</div>
            </div>
          </div>
        </div>

        <button
          {...bindTap({ kind: 'action', id: 'vipfloat.apply.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="mx-3 mt-4 w-[calc(100%-24px)] h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer text-white"
          style={{ background: VIP.primary }}
        >
          立即开通
        </button>

        {/* 关于唯品花:纯静态文案,不绑定任何 handler */}
        <div className="mx-3 mt-5 bg-white rounded-lg p-3">
          <div className="text-[14px] font-semibold text-[#222222] mb-2">关于唯品花</div>
          <div className="text-[12px] text-[#888888] leading-relaxed">
            唯品花是唯品会提供的信用支付服务,先享后付、灵活分期。开通后可在结算时选择唯品花支付,
            享受最长可达 50 天的免息期。具体额度以系统评估为准。
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}
