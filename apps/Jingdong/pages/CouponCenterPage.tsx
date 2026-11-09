import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, EmptyState, showToast, wontfix } from '../components/ui';
import { IcClock } from '../res/icons';

// 领券中心 — 可领券列表(面额+满减+领取按钮),领取写入我的券。
export function CouponCenterPage() {
  const { bindTap } = useJingdongGestures();
  const couponCenter = useJingdongStore((s) => s.couponCenter);
  const claimCoupon = useJingdongStore((s) => s.claimCoupon);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar title="领券中心" />

      {/* 定时抢券 banner */}
      <button
        {...bindTap({ kind: 'action', id: 'couponcenter.timed.wontfix' }, { onTrigger: wontfix })}
        className="shrink-0 mx-3 mt-2 bg-gradient-to-r from-[#FF6A3D] to-[#E1251B] rounded-lg px-4 h-12 flex items-center justify-between text-white"
      >
        <span className="flex items-center gap-1.5 text-[14px] font-medium"><IcClock size={16} />定时抢券 · 整点开抢</span>
        <span className="text-[12px] bg-white/25 rounded-full px-2.5 py-1">立即预约</span>
      </button>

      <div className="flex-1 overflow-y-auto px-3 pt-2" data-scroll-container="couponcenter-list" data-scroll-direction="vertical">
        {couponCenter.length === 0 ? (
          <EmptyState text="暂无可领优惠券" />
        ) : (
          <div className="space-y-2.5 pb-3">
            {couponCenter.map((c) => (
              <div key={c.id} className="bg-white rounded-lg flex overflow-hidden">
                <div className="w-[112px] shrink-0 flex flex-col items-center justify-center py-4 text-[#E1251B]">
                  <div className="leading-none">
                    <span className="text-[15px]">¥</span>
                    <span className="text-[34px] font-bold align-middle">{c.amount}</span>
                  </div>
                  <div className="text-[11px] mt-1">满{c.threshold}可用</div>
                </div>
                <div className="flex-1 min-w-0 px-1 py-3 flex flex-col justify-center border-l border-dashed border-[#EEE]">
                  <div className="text-[15px] font-medium text-[#1A1A1A] truncate">{c.scope}</div>
                  <div className="text-[11px] text-[#999] mt-1">{c.channel === 'miaosong' ? '京东秒送外卖' : '京东商城'}</div>
                  <div className="text-[11px] text-[#999] mt-0.5">有效期：{c.expire}</div>
                </div>
                <div className="flex items-center pr-3">
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'couponcenter.item.claim' },
                      { onTrigger: () => { if (!c.claimed) { claimCoupon(c.id); showToast('领取成功'); } } },
                    )}
                    disabled={c.claimed}
                    className={`px-4 h-8 rounded-full text-[13px] font-medium ${
                      c.claimed ? 'bg-[#F2F2F2] text-[#BBB]' : 'bg-[#E1251B] text-white'
                    }`}
                  >
                    {c.claimed ? '已领取' : '领取'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
