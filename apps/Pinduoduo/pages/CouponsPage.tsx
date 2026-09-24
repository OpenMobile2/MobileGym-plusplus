import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { TopBar, EmptyState } from '../components/ui';
import type { Coupon } from '../types';

const COUPON_TABS = [
  { key: 'platform', label: '平台券' },
  { key: 'expiring', label: '即将过期' },
  { key: 'all', label: '全部' },
] as const;

function CouponCard({ c, useBind }: { c: Coupon; useBind: React.HTMLAttributes<HTMLElement> }) {
  return (
    <div className="flex bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white rounded-lg overflow-hidden mb-2.5">
      {/* 左:面额 */}
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
      {/* 右:说明 */}
      <div className="flex-1 min-w-0 flex items-center justify-between px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[14px] font-medium truncate">{c.desc}</div>
          <div className="text-[11px] opacity-90 mt-0.5 truncate">{c.scope}</div>
          <div className="text-[11px] opacity-80 mt-0.5">{c.expire}</div>
        </div>
        <button {...useBind} className="shrink-0 ml-2 px-3 h-7 rounded-full bg-white text-[#E22E1F] text-[12px] font-medium">
          立即使用
        </button>
      </div>
    </div>
  );
}

export function CouponsPage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const coupons = usePinduoduoStore((st) => st.coupons);
  const [tab, setTab] = useState<'platform' | 'expiring' | 'all'>('all');

  const list = coupons.filter((c) => {
    if (tab === 'expiring') return c.expire.includes('即将');
    return true;
  });

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar
        title={s.title_coupons}
        className="bg-white"
        right={
          <button {...bindTap('coupon.center-open')} className="text-[13px] text-[#E22E1F] px-1">
            领券中心
          </button>
        }
      />

      {/* Tab */}
      <div className="shrink-0 bg-white flex px-3 border-b border-[#EEE]">
        {COUPON_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'coupon.tab.select.type' }, { params: { tab: t.key }, onTrigger: () => setTab(t.key) })}
              className="relative py-2.5 mr-6 text-[14px]"
            >
              <span className={active ? 'text-[#E22E1F] font-medium' : 'text-[#666]'}>{t.label}</span>
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded-full bg-[#E22E1F]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-2.5" data-scroll-container data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={s.empty_coupons} />
        ) : (
          list.map((c) => (
            <CouponCard
              key={c.id}
              c={c}
              useBind={bindTap('coupon.use-open', { params: { q: c.scope || '全场' } })}
            />
          ))
        )}
      </div>
    </div>
  );
}
