import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { TopBar, showToast, wontfix } from '../components/ui';
import { IcClock } from '../res/icons';

export function CouponCenterPage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const couponCenter = usePinduoduoStore((st) => st.couponCenter);
  const claimCoupon = usePinduoduoStore((st) => st.claimCoupon);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title={s.title_coupon_center} className="bg-white" />

      <div className="flex-1 overflow-y-auto p-2.5" data-scroll-container data-scroll-direction="vertical">
        {couponCenter.map((c) => (
          <div key={c.id} className="flex bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white rounded-lg overflow-hidden mb-2.5">
            <div className="w-24 shrink-0 flex flex-col items-center justify-center py-4 border-r border-dashed border-white/40">
              {c.kind === 'cut' ? (
                <div className="flex items-baseline">
                  <span className="text-[15px]">¥</span>
                  <span className="text-[30px] font-bold leading-none">{c.amount}</span>
                </div>
              ) : (
                <div className="flex items-baseline">
                  <span className="text-[30px] font-bold leading-none">{c.amount}</span>
                  <span className="text-[15px]">折</span>
                </div>
              )}
              <span className="text-[11px] mt-1 opacity-90">
                {c.threshold > 0 ? `满${c.threshold}可用` : '无门槛'}
              </span>
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[14px] font-medium truncate">{c.desc}</div>
                <div className="text-[11px] opacity-90 mt-0.5 truncate">{c.scope}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{c.expire}</div>
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'couponcenter.item.claim' }, { onTrigger: () => { if (!c.claimed) { claimCoupon(c.id); showToast('领取成功'); } } })}
                disabled={c.claimed}
                className={`shrink-0 ml-2 px-3 h-7 rounded-full text-[12px] font-medium ${c.claimed ? 'bg-white/40 text-white' : 'bg-white text-[#E22E1F]'}`}
              >
                {c.claimed ? '已领取' : '立即领取'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 整点抢券入口 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] p-3">
        <button
          {...bindTap({ kind: 'action', id: 'couponcenter.timed.wontfix' }, { onTrigger: wontfix })}
          className="w-full h-11 rounded-full bg-[#FFF0E8] text-[#E22E1F] font-medium flex items-center justify-center gap-1.5"
        >
          <IcClock size={18} /> 整点抢券
        </button>
      </div>
    </div>
  );
}
