import React, { useMemo } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, EmptyState, Stars5, ReviewTag } from '../components/ui';

/** 我的全部评价:此前发出去的评价只能在各个商品详情里翻,没有汇总入口 */
export default function MyReviewsPage() {
  const { bindTap } = useVipshopGestures();
  const reviews = useVipshopStore((s) => s.reviews);
  const items = useVipshopStore((s) => s.items);

  const mine = useMemo(
    () => reviews.filter((r) => r.mine).map((r) => ({ review: r, item: items.find((it) => it.id === r.itemId) })),
    [reviews, items],
  );

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title={`我的评价(${mine.length})`} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="myreviews-list" data-scroll-direction="vertical">
        {mine.length === 0 ? (
          <EmptyState text="还没有发表过评价" hint="确认收货后来说说使用感受吧~" />
        ) : (
          mine.map(({ review: r, item }) => (
            <div key={r.id} className="bg-white mt-2 px-3 py-3">
              <button
                {...bindTap('myReviews.item-open', { params: { id: r.itemId } })}
                className="flex items-center gap-2.5 w-full bg-transparent border-none cursor-pointer p-0 text-left"
              >
                <Img src={item?.image ?? ''} className="w-12 h-12 rounded object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#222222] line-clamp-1">{item?.title ?? r.itemId}</div>
                  <div className="text-[11px] text-[#888888] mt-0.5">{r.skuDesc}</div>
                </div>
              </button>
              {/* 与商品评价列表保持同一套展示字段:星级 + 正文 + 图片 + 标签
                  (skuDesc 已在上面的商品行显示,这里不再重复) */}
              {r.rating ? <div className="mt-2"><Stars5 value={r.rating} /></div> : null}
              <div className="text-[13px] text-[#333333] mt-1 leading-relaxed">{r.content}</div>
              {r.images.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {r.images.map((src) => (
                    <Img key={src} src={src} className="w-16 h-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <div className="mt-1.5"><ReviewTag text={r.tag} /></div>
            </div>
          ))
        )}
        <div className="h-3" />
      </div>
    </div>
  );
}
