import React, { useState } from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, EmptyState, useToast } from '../components/ui';

type ReviewTab = 'pending' | 'append' | 'done';

/** 评价中心(spec: orders.reviewCenter,IMG_8729;迭代#3:状态 Tab 浅实现) */
export default function ReviewCenterPage() {
  const { bindTap } = useTaobaoGestures();
  const orders = useTaobaoStore((s) => s.orders);
  const myReviews = useTaobaoStore((s) => s.myReviews);
  const items = useTaobaoStore((s) => s.items);
  const [tab, setTab] = useState<ReviewTab>('pending');
  const [toast, showToast] = useToast();

  const pending = orders.filter((o) => o.status === 'completed' && !o.reviewed);
  const done = myReviews;

  const TABS: Array<[ReviewTab, string]> = [
    ['pending', `待评价 ${pending.length}`],
    ['append', '可追评'],
    ['done', `已评价 ${done.length}`],
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title={
        <span>评价 <span className="text-[13px] text-[#999999] font-normal cursor-pointer"
          onClick={() => showToast('问答暂未开放')}>问答</span></span>
      } />
      {/* 数据条 */}
      <div className="bg-white shrink-0 flex items-center px-6 py-3 gap-8">
        <Stat n={115} label="被浏览" />
        <Stat n={0} label="被点赞" />
        <Stat n={0} label="被评论" />
      </div>
      {/* 状态 Tab(迭代#3:可切换) */}
      <div className="bg-white shrink-0 flex gap-8 px-5 h-10 items-center border-t border-[#F8F8F8]">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            {...bindTap({ kind: 'action', id: 'reviewCenter.tab.select.target' }, {
              params: { tab: id },
              onTrigger: () => setTab(id),
            })}
            className={`bg-transparent border-none cursor-pointer text-[14px] pb-1 ${
              tab === id ? 'font-semibold border-b-2 border-[#FF5000] text-[#111111]' : 'text-[#666666]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="review-center" data-scroll-direction="vertical">
        {tab === 'append' ? (
          <EmptyState text="暂无可追评的订单" hint="评价后 30 天内可追评" />
        ) : tab === 'done' ? (
          done.length === 0 ? (
            <EmptyState text="还没有发布过评价" />
          ) : (
            done.map((r) => {
              const it = items.find((i) => i.id === r.itemId);
              return (
                <div key={r.orderId + r.itemId} className="mx-2.5 mt-2 bg-white rounded-xl p-3">
                  <div className="flex items-center gap-2.5">
                    {it && <Img src={it.image} className="w-12 h-12 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] line-clamp-1">{it ? it.title : r.itemId}</div>
                      <div className="text-[12px] text-[#666666] mt-1 line-clamp-2">{r.content}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : pending.length === 0 ? (
          <EmptyState text="暂无待评价订单" hint="- 到底了 -" />
        ) : (
          pending.map((o) => (
            <div key={o.id} className="mx-2.5 mt-2 bg-white rounded-xl p-3">
              <div className="text-[12px] text-[#999999] mb-1.5">
                <span className="text-[#FF5000] font-bold mr-1">淘宝</span>{o.shopName}
              </div>
              <div className="flex items-center gap-2.5">
                <Img src={o.lines[0].image} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium line-clamp-1">{o.lines[0].title}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5">{o.lines[0].skuDesc}</div>
                </div>
                <button
                  {...bindTap('reviewCenter.write-open', { params: { orderId: o.id } })}
                  className="text-[13px] text-[#FF5000] bg-[#FFF1E8] rounded-lg px-4 py-2 border-none cursor-pointer shrink-0"
                >
                  去评价
                </button>
              </div>
              <div className="flex items-center justify-between bg-[#FAFAFA] rounded-lg px-3 py-2 mt-2 text-[12px] text-[#999999]">
                <span>商品怎么样?评价一下吧</span>
                <span className="flex gap-3"><span>💐差评</span><span>💐中评</span><span>💐好评</span></span>
              </div>
            </div>
          ))
        )}
        {tab === 'pending' && pending.length > 0 && (
          <div className="text-center text-[12px] text-[#999999] py-4">- 到底了 -</div>
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
      <span className="text-[12px] text-[#999999]">{label}</span>
    </span>
  );
}
