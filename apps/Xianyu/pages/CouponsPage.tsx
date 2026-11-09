import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { EmptyState, useToast } from '../components/ui';
import type { XyCoupon } from '../types';

const TABS = [
  { id: 'redpacket', label: '红包' },
  { id: 'coupon', label: '卡券' },
  { id: 'other', label: '其他' },
  { id: 'lottery', label: '抽奖' },
] as const;

export default function CouponsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const coupons = useXianyuStore((s) => s.coupons);

  const tab = searchParams.get('tab') ?? 'redpacket';
  const list: XyCoupon[] =
    tab === 'lottery' ? [] : coupons.filter((c) => c.kind === tab);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="卡券红包" />

      {/* tab 行 */}
      <div className="bg-white shrink-0 flex items-center px-2 border-b border-[#EEEEEE]">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'coupons.tab.select.target' },
                {
                  params: { tab: t.id },
                  onTrigger: () =>
                    setSearchParams((p) => {
                      if (t.id === 'redpacket') p.delete('tab');
                      else p.set('tab', t.id);
                      return p;
                    }, { replace: true }),
                },
              )}
              className={`flex-1 bg-transparent border-none cursor-pointer py-2.5 text-[14px] relative ${
                active ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {t.label}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-0.5 rounded bg-[#FFE411]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3" data-scroll-container="CouponsPage-main" data-scroll-direction="vertical">
        {tab === 'lottery' ? (
          <button
            onClick={() => showToast('该功能暂未开放')}
            className="w-full bg-white rounded-xl p-6 flex flex-col items-center gap-2 border-none cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFF3B0] to-[#FFE411] flex items-center justify-center text-[28px]">🎁</div>
            <div className="text-[15px] font-semibold text-[#111]">幸运抽奖</div>
            <div className="text-[12px] text-[#999]">每日一次,好礼抽不停</div>
            <span className="mt-1 text-[13px] text-white bg-[#FF3B30] px-5 py-1.5 rounded-full">去抽奖</span>
          </button>
        ) : list.length === 0 ? (
          <EmptyState text="暂无可用券" hint="逛逛闲鱼领取更多优惠" />
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((c) => (
              <div key={c.id} className="bg-white rounded-xl overflow-hidden flex">
                {/* 左金额 */}
                <div className="w-24 shrink-0 flex flex-col items-center justify-center py-4 bg-[#FFF7F5]">
                  <div className={`font-bold leading-none ${c.kind === 'redpacket' ? 'text-[#FF3B30]' : 'text-[#FF6A00]'}`}>
                    <span className="text-[14px]">¥</span>
                    <span className="text-[28px]">{c.amount}</span>
                  </div>
                  <div className="text-[11px] text-[#999] mt-1">{c.scope}</div>
                </div>
                {/* 右信息 */}
                <div className="flex-1 min-w-0 flex items-center px-3 py-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-[#111] truncate">{c.title}</div>
                    <div className="text-[12px] text-[#666] mt-1 truncate">{c.thresholdText}</div>
                    <div className="text-[11px] text-[#999] mt-1">{c.validText}</div>
                  </div>
                  {c.used ? (
                    <span className="shrink-0 text-[12px] text-[#BBB] border border-[#EEE] rounded-full px-3 py-1">已使用</span>
                  ) : (
                    <button
                      onClick={() => showToast('该功能暂未开放')}
                      className="shrink-0 text-[12px] text-[#3A2E00] font-semibold bg-[#FFE411] rounded-full px-3 py-1 border-none cursor-pointer"
                    >
                      去使用
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast}
    </div>
  );
}
