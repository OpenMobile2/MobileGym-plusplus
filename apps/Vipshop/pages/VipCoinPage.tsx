import React from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, useToast, NOT_OPEN, VIP } from '../components/ui';
import { IcCoins } from '../res/icons';

export default function VipCoinPage() {
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();
  const session = useVipshopStore((s) => s.session);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="唯品币" />

      <div className="flex-1">
        {/* 余额卡 */}
        <div
          className="mx-3 mt-3 rounded-2xl px-5 py-6 text-white"
          style={{ background: 'linear-gradient(135deg,#3a2a1a,#141414)' }}
        >
          <div className="flex items-center gap-1.5 text-[13px]" style={{ color: VIP.gold }}>
            <IcCoins size={16} />我的唯品币
          </div>
          <div className="mt-3 font-bold leading-none" style={{ color: VIP.gold }}>
            <span className="text-[44px]">{session.vipcoin}</span>
            <span className="text-[14px] ml-1">币</span>
          </div>
          <div className="text-[11px] mt-2 opacity-70">100唯品币 = 1元,下单可抵扣</div>
        </div>

        <button
          {...bindTap({ kind: 'action', id: 'vipcoin.earn.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="mx-3 mt-4 w-[calc(100%-24px)] h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer text-white"
          style={{ background: VIP.primary }}
        >
          去做任务赚币
        </button>

        <div className="text-center text-[12px] text-[#BBBBBB] mt-4 px-6 leading-relaxed">
          唯品币可用于下单抵扣,签到、购物均可获得。
        </div>
      </div>
      {toast}
    </div>
  );
}
