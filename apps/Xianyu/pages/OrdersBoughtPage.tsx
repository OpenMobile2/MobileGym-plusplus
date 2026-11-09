import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { ItemImage } from '../components/ItemImage';
import { EmptyState, Price } from '../components/ui';
import { BOUGHT_TABS } from '../constants';
import type { XyOrder, XyOrderStatus } from '../types';

const STATUS_TEXT: Record<XyOrderStatus, string> = {
  pendingPayment: '等待付款',
  pendingShip: '等待卖家发货',
  pendingReceipt: '等待收货',
  pendingReview: '待评价',
  completed: '交易成功',
  refunding: '退款中',
  closed: '交易关闭',
};

export default function OrdersBoughtPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const orders = useXianyuStore((s) => s.orders);

  const tab = searchParams.get('tab') ?? 'all';
  const bought = orders.filter((o) => o.role === 'buyer');
  const list = tab === 'all' ? bought : bought.filter((o) => o.status === tab);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="我买到的" />

      {/* 状态 tab */}
      <div
        className="bg-white shrink-0 flex items-center gap-4 px-3 border-b border-[#EEEEEE] overflow-x-auto"
        data-scroll-container="ordersBought-tabs" data-scroll-direction="horizontal"
      >
        {BOUGHT_TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'ordersBought.tab.select.target' },
                {
                  params: { target: t.id },
                  onTrigger: () =>
                    setSearchParams((p) => {
                      if (t.id === 'all') p.delete('tab');
                      else p.set('tab', t.id);
                      return p;
                    }, { replace: true }),
                },
              )}
              className={`bg-transparent border-none cursor-pointer py-2.5 text-[14px] whitespace-nowrap relative ${
                active ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {t.label}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-0.5 rounded bg-[#FFE411]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="OrdersBoughtPage-main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text="还没有相关订单" hint="逛逛闲鱼淘个好物吧" />
        ) : (
          list.map((o) => <OrderCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  );
}

function OrderCard({ order: o }: { order: XyOrder }) {
  const { bindTap } = useXianyuGestures();
  return (
    <div
      {...bindTap('order.detail-open', { params: { orderId: o.id } })}
      className="bg-white mx-3 mt-3 rounded-xl p-3 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#666]">{o.sellerName}</span>
        <span className={`text-[13px] font-medium ${o.status === 'closed' ? 'text-[#999]' : 'text-[#FF3B30]'}`}>
          {STATUS_TEXT[o.status]}
        </span>
      </div>
      <div className="flex gap-2 mt-2">
        <ItemImage seed={o.itemId} src={o.image} label={o.title} className="w-16 h-16 rounded-lg" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[#1A1A1A] line-clamp-2">{o.title}</div>
        </div>
        <Price value={o.price} size={15} />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          {...bindTap('detail.chat-open', { params: { chatId: `ch_${o.sellerId}`, itemId: o.itemId }, stopPropagation: true })}
          className="text-[13px] px-4 py-1.5 rounded-full border border-[#DDD] bg-white text-[#333] cursor-pointer"
        >联系卖家</button>
        {o.status === 'pendingPayment' && (
          <button
            {...bindTap('order.pay-open', { params: { orderId: o.id }, stopPropagation: true })}
            className="text-[13px] px-4 py-1.5 rounded-full border-none text-white cursor-pointer"
            style={{ background: 'linear-gradient(90deg,#FF6A00,#FF3000)' }}
          >去付款</button>
        )}
        {o.status === 'pendingReview' && (
          <button
            {...bindTap('review.write-open', { params: { orderId: o.id }, stopPropagation: true })}
            className="text-[13px] px-4 py-1.5 rounded-full border border-[#FF3B30] bg-white text-[#FF3B30] cursor-pointer"
          >去评价</button>
        )}
        {o.status === 'completed' && (
          <button
            {...bindTap('review.detail-open', { params: { orderId: o.id }, stopPropagation: true })}
            className="text-[13px] px-4 py-1.5 rounded-full border border-[#DDD] bg-white text-[#333] cursor-pointer"
          >查看评价</button>
        )}
      </div>
    </div>
  );
}
