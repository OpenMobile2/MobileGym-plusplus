import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, EmptyState, VIP } from '../components/ui';

const FILTERS = [
  { id: 'unused', label: '未使用' },
  { id: 'used', label: '已使用' },
  { id: 'expired', label: '已过期' },
] as const;

export default function CouponsPage() {
  const { bindTap } = useVipshopGestures();
  const [filter, setFilter] = useState<string>('unused');

  const coupons = useVipshopStore((s) => s.coupons);

  const shown = coupons.filter((c) => {
    if (filter === 'unused') return !c.used;
    if (filter === 'used') return c.used;
    return false; // 已过期:演示数据无过期券
  });

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="我的优惠券" />

      {/* 筛选 tab */}
      <div className="shrink-0 bg-white flex border-b border-[#F5F5F5]">
        {FILTERS.map((f) => {
          const on = f.id === filter;
          return (
            <button
              key={f.id}
              {...bindTap({ kind: 'action', id: 'coupons.filter.select.target' }, {
                params: { target: f.id },
                onTrigger: () => setFilter(f.id),
              })}
              className="flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer relative"
              style={on ? { color: VIP.primary, fontWeight: 600 } : { color: '#666666' }}
            >
              {f.label}
              {on && <span className="block h-0.5 w-6 mx-auto mt-1 rounded-full" style={{ background: VIP.primary }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="coupons-list" data-scroll-direction="vertical">
        {shown.length === 0 && <EmptyState text="暂无相关优惠券" />}
        <div className="p-2 flex flex-col gap-2">
          {shown.map((c) => (
            <div key={c.id} className="bg-white rounded-lg overflow-hidden flex" style={{ opacity: c.used ? 0.6 : 1 }}>
              {/* 左侧金额 */}
              <div
                className="w-24 shrink-0 flex flex-col items-center justify-center py-4"
                style={{ background: '#FDECF5' }}
              >
                <div style={{ color: VIP.price }} className="font-bold leading-none">
                  <span className="text-[14px]">¥</span>
                  <span className="text-[28px]">{c.amount}</span>
                </div>
                <div className="text-[10px] text-[#888888] mt-1">{c.thresholdText}</div>
              </div>
              {/* 右侧信息 */}
              <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                <div className="text-[14px] font-semibold text-[#222222] truncate">{c.title}</div>
                <div className="text-[11px] text-[#888888] mt-1">适用范围:{c.scope}</div>
                <div className="text-[11px] text-[#BBBBBB] mt-0.5">{c.validText}</div>
              </div>
              {/* 去使用 */}
              {!c.used && (
                <div className="flex items-center pr-3">
                  <button
                    {...bindTap('coupons.use-open', { params: { q: '连衣裙' } })}
                    className="text-[12px] rounded-full px-3 py-1 border-none cursor-pointer text-white"
                    style={{ background: VIP.primary }}
                  >
                    去使用
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="h-3" />
      </div>
    </div>
  );
}
