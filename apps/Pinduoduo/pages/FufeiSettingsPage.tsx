import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { TopBar } from '../components/ui';

// 先用后付设置
export function FufeiSettingsPage() {
  const { bindTap } = usePinduoduoGestures();
  const fufeiEnabled = usePinduoduoStore((s) => s.settings.fufeiEnabled);
  const setFufeiEnabled = usePinduoduoStore((s) => s.setFufeiEnabled);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="先用后付设置" />

      {/* 开关行 */}
      <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'fufei.switch.toggle' }, { onTrigger: () => setFufeiEnabled(!fufeiEnabled) })}
          className="w-full flex items-center px-4 py-3.5 text-left"
        >
          <div className="flex-1">
            <div className="text-[15px] text-[#333]">先用后付</div>
            <div className="text-[12px] text-[#20B010] mt-0.5">0元下单,确认收货后自动付款</div>
          </div>
          <span
            className={`relative w-11 h-6 rounded-full transition-colors ${fufeiEnabled ? 'bg-[#20B010]' : 'bg-[#DDD]'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${fufeiEnabled ? 'left-[22px]' : 'left-0.5'}`}
            />
          </span>
        </button>
      </div>

      {/* 说明 */}
      <div className="mx-3 mt-3 text-[12px] leading-relaxed text-[#999]">
        <div className="mb-1 text-[#666] font-medium">什么是先用后付</div>
        0元下单 → 等待收货 → 确认收货后自动付款;单笔超500元需手动确认。开通后下单免密、不占用支付额度,支持随时关闭。
      </div>
    </div>
  );
}
