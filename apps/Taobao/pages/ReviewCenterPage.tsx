import React, { useState } from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, EmptyState, useToast } from '../components/ui';
import { fmt } from '../utils/format';

type ReviewTab = 'pending' | 'append' | 'done';

/** 评价中心(spec: orders.reviewCenter,IMG_8729;迭代#3:状态 Tab 浅实现) */
export default function ReviewCenterPage() {
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const orders = useTaobaoStore((st) => st.orders);
  const myReviews = useTaobaoStore((st) => st.myReviews);
  const items = useTaobaoStore((st) => st.items);
  const [tab, setTab] = useState<ReviewTab>('pending');
  const [toast, showToast] = useToast();

  const pending = orders.filter((o) => o.status === 'completed' && !o.reviewed);
  const done = myReviews;

  const TABS: Array<[ReviewTab, string]> = [
    ['pending', fmt(s.pendingReviewCountFmt, { count: pending.length })],
    ['append', s.canFollowUpLabel],
    ['done', fmt(s.reviewedCountFmt, { count: done.length })],
  ];

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={
        <span>{s.reviewsTitle} <span className="text-[13px] text-app-text-muted font-normal cursor-pointer"
          onClick={() => showToast(s.qnaUnavailable)}>{s.qnaLabel}</span></span>
      } />
      {/* 数据条 */}
      <div className="bg-app-surface shrink-0 flex items-center px-6 py-3 gap-8">
        <Stat n={115} label={s.statViewed} />
        <Stat n={0} label={s.statLiked} />
        <Stat n={0} label={s.statCommented} />
      </div>
      {/* 状态 Tab(迭代#3:可切换) */}
      <div className="bg-app-surface shrink-0 flex gap-8 px-5 h-10 items-center border-t border-[#F8F8F8]">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            {...bindTap({ kind: 'action', id: 'reviewCenter.tab.select.target' }, {
              params: { tab: id },
              onTrigger: () => setTab(id),
            })}
            className={`bg-transparent border-none cursor-pointer text-[14px] pb-1 ${
              tab === id ? 'font-semibold border-b-2 border-[#FF5000] text-app-text' : 'text-app-text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="review-center" data-scroll-direction="vertical">
        {tab === 'append' ? (
          <EmptyState text={s.noFollowUpOrdersText} hint={s.followUpHint} />
        ) : tab === 'done' ? (
          done.length === 0 ? (
            <EmptyState text={s.noReviewsPublishedText} />
          ) : (
            done.map((r) => {
              const it = items.find((i) => i.id === r.itemId);
              return (
                <div key={r.orderId + r.itemId} className="mx-2.5 mt-2 bg-app-surface rounded-xl p-3">
                  <div className="flex items-center gap-2.5">
                    {it && <Img src={it.image} className="w-12 h-12 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] line-clamp-1">{it ? it.title : r.itemId}</div>
                      <div className="text-[12px] text-app-text-muted mt-1 line-clamp-2">{r.content}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : pending.length === 0 ? (
          <EmptyState text={s.noPendingReviewsText} hint={s.reachedBottomText} />
        ) : (
          pending.map((o) => (
            <div key={o.id} className="mx-2.5 mt-2 bg-app-surface rounded-xl p-3">
              <div className="text-[12px] text-app-text-muted mb-1.5">
                <span className="text-[#FF5000] font-bold mr-1">{s.appName}</span>{o.shopName}
              </div>
              <div className="flex items-center gap-2.5">
                <Img src={o.lines[0].image} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium line-clamp-1">{o.lines[0].title}</div>
                  <div className="text-[11px] text-app-text-muted mt-0.5">{o.lines[0].skuDesc}</div>
                </div>
                <button
                  {...bindTap('reviewCenter.write-open', { params: { orderId: o.id } })}
                  className="text-[13px] text-[#FF5000] bg-[#FFF1E8] rounded-lg px-4 py-2 border-none cursor-pointer shrink-0"
                >
                  {s.goReviewLabel}
                </button>
              </div>
              <div className="flex items-center justify-between bg-[#FAFAFA] rounded-lg px-3 py-2 mt-2 text-[12px] text-app-text-muted">
                <span>{s.howIsProductText}</span>
                <span className="flex gap-3"><span>{s.reviewBad}</span><span>{s.reviewNeutral}</span><span>{s.reviewGood}</span></span>
              </div>
            </div>
          ))
        )}
        {tab === 'pending' && pending.length > 0 && (
          <div className="text-center text-[12px] text-app-text-muted py-4">{s.reachedBottomText}</div>
        )}
      </div>
      {toast}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="text-center">
      <span className="block text-[18px] font-bold">{n}</span>
      <span className="text-[12px] text-app-text-muted">{label}</span>
    </span>
  );
}
