import React, { useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcSearch, IcDoc } from '../res/icons';
import { shopCoverUrl } from '../assets';
import * as TimeService from '../../../os/TimeService';

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'nanjing', label: '南京' },
];

export default function PendingReviewsPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const orders = useDianpingStore((st) => st.orders);
  const userReviews = useDianpingStore((st) => st.userReviews);
  const shops = useDianpingStore((st) => st.shops);
  const reviewDrafts = useDianpingStore((st) => st.reviewDrafts);
  const showToast = useDianpingStore((st) => st.showToast);
  const [filter, setFilter] = useState('all');

  const reviewedShopIds = new Set(userReviews.map((r) => r.shopId));
  const pending = orders.filter(
    (o) => (o.status === 'usable' || o.status === 'used') && !reviewedShopIds.has(o.shopId),
  );

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center justify-center bg-white px-1">
        <button type="button" className="absolute left-1 border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold text-[#222]">{s.pendingReviews}</div>
        <button
          type="button"
          className="absolute right-3 flex items-center gap-1 border-none bg-transparent text-[13px] text-[#333] cursor-pointer"
          {...bindTap('pending.drafts-open')}
        >
          <IcDoc size={16} />
          {s.drafts}
          {reviewDrafts.length > 0 ? `(${reviewDrafts.length})` : ''}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="pending" data-scroll-direction="vertical">
        <div className="bg-white px-3 py-2">
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-full border-none bg-[#F5F5F5] px-3 text-left text-[13px] text-[#999] cursor-pointer"
            {...action('pending.search.open.disabled', () => showToast(s.notOpen))}
          >
            <IcSearch size={15} className="text-[#999]" />
            搜索附近商户
          </button>
        </div>

        <div className="mx-3 mt-2 flex h-[70px] items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7A1F14] to-[#B33A22] px-4 text-[16px] font-black italic text-[#F5D9A8]">
          是评友 · 也是脱友 · 邀评友免费看脱口秀 ›
        </div>

        <div className="flex gap-2 px-3 py-2.5">
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                className={`rounded-full border-none px-4 py-1 text-[13px] font-medium cursor-pointer ${
                  active ? 'bg-[#FFE7DE] text-[#FF6633]' : 'bg-[#EEE] text-[#555]'
                }`}
                {...action('pending.filter.select.target', () => setFilter(f.id), { params: { target: f.id } })}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {pending.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#999]">暂无待评价商户</div>
        ) : (
          pending.map((o) => {
            const shop = shops.find((x) => x.id === o.shopId);
            const dateLabel = TimeService.fromTimestamp(o.paidAt ?? o.createdAt)
              .toISOString()
              .slice(0, 10);
            return (
              <div key={o.id} className="mx-3 mt-2 rounded-[12px] bg-white p-3">
                <div className="flex items-start gap-2.5">
                  <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: o.coverColor }}>
                    {shopCoverUrl(o.shopId) ? <img src={shopCoverUrl(o.shopId)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-[#222]">{o.shopName}</div>
                    <div className="mt-1 text-[12px] text-[#999]">{dateLabel} 打卡</div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full border-none bg-[#FF6633] px-4 py-1.5 text-[13px] font-medium text-white cursor-pointer"
                    {...bindTap('pending.write-open', { params: { shopId: o.shopId } })}
                  >
                    {s.writeReview}
                  </button>
                </div>
                <div className="mt-2 border-t border-[#F5F5F5] pt-2 text-[12px] text-[#FF6633]">
                  写评价开新人礼盒，最高得50元
                </div>
              </div>
            );
          })
        )}
        <div className="py-4 text-center text-[13px] text-[#999]">{s.noMoreShops}</div>
      </div>
    </div>
  );
}
