import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, EmptyState } from '../components/ui';
import { IcTicket, IcChevronRight } from '../res/icons';
import type { Coupon } from '../types';

const TABS = [
  { key: 'usable', label: '可用' },
  { key: 'expiring', label: '即将过期' },
  { key: 'expired', label: '已失效' },
] as const;

// 我的优惠券 — 可用/即将过期/已失效 tab;券卡;领券中心入口。
export function CouponsPage() {
  const { bindTap } = useJingdongGestures();
  const coupons = useJingdongStore((s) => s.coupons);
  const [tab, setTab] = useState<string>('usable');

  const list: Coupon[] =
    tab === 'expiring'
      ? coupons.filter((c) => /今|到期/.test(c.expire) && c.expire.includes('今'))
      : tab === 'expired'
        ? []
        : coupons;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar title="我的优惠券" />

      {/* 领券中心入口 */}
      <button
        {...bindTap('coupon.center-open')}
        className="shrink-0 mx-3 mt-2 mb-1 bg-white rounded-lg px-4 h-11 flex items-center justify-between"
      >
        <span className="flex items-center gap-1.5 text-[14px] text-[#1A1A1A]">
          <IcTicket size={17} className="text-[#E1251B]" />领券中心
        </span>
        <span className="flex items-center text-[12px] text-[#999]">发现更多优惠<IcChevronRight size={14} /></span>
      </button>

      {/* Tab */}
      <div className="shrink-0 bg-white mx-3 rounded-t-lg flex items-center px-2 border-b border-[#F2F2F2]">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'coupon.tab.select.type' }, { onTrigger: () => setTab(t.key) })}
              className="relative flex-1 py-3"
            >
              <span className={`text-[14px] ${active ? 'text-[#E1251B] font-semibold' : 'text-[#666]'}`}>{t.label}</span>
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-6 h-[3px] rounded-full bg-[#E1251B]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2" data-scroll-container="coupons-list" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text="暂无可用优惠券" />
        ) : (
          <div className="space-y-2.5 pb-3">
            {list.map((c) => (
              <div key={c.id} className="bg-white rounded-lg flex overflow-hidden">
                <div className="w-[112px] shrink-0 bg-[#E1251B] text-white flex flex-col items-center justify-center py-4">
                  <div className="leading-none">
                    <span className="text-[15px]">¥</span>
                    <span className="text-[34px] font-bold align-middle">{c.amount}</span>
                  </div>
                  <div className="text-[11px] mt-1 opacity-90">满{c.threshold}可用</div>
                </div>
                <div className="flex-1 min-w-0 px-3 py-3 flex flex-col justify-center">
                  <div className="text-[15px] font-medium text-[#1A1A1A] truncate">{c.scope}</div>
                  <div className="text-[11px] text-[#999] mt-1">{c.channel === 'miaosong' ? '京东秒送' : '京东商城'}</div>
                  <div className="text-[11px] text-[#E1251B] mt-0.5">{c.expire}</div>
                </div>
                <div className="flex items-center pr-3">
                  <button
                    {...bindTap('coupon.use-open', { params: { q: c.scope } })}
                    className="px-3 h-7 rounded-full bg-[#E1251B] text-white text-[12px] font-medium"
                  >
                    立即使用
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
