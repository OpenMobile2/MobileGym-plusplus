import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { ItemImage } from '../components/ItemImage';
import { EmptyState, Price } from '../components/ui';
import { SOLD_TABS } from '../constants';
import type { XyOrder, XyOrderStatus } from '../types';

const STATUS_TEXT: Record<XyOrderStatus, string> = {
  pendingPayment: '买家待付款',
  pendingShip: '待发货',
  pendingReceipt: '待买家收货',
  pendingReview: '待评价',
  completed: '交易成功',
  refunding: '退款中',
  closed: '交易关闭',
};

export default function OrdersSoldPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const orders = useXianyuStore((s) => s.orders);
  const recordTaskAudit = useXianyuStore((s) => s.recordTaskAudit);

  const tab = searchParams.get('tab') ?? 'all';
  const sold = orders.filter((o) => o.role === 'seller');
  const list = tab === 'all' ? sold : sold.filter((o) => o.status === tab);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="我卖出的" />

      {/* 状态 tab */}
      <div
        className="bg-white shrink-0 flex items-center gap-4 px-3 border-b border-[#EEEEEE] overflow-x-auto"
        data-scroll-container="ordersSold-tabs" data-scroll-direction="horizontal"
      >
        {SOLD_TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'ordersSold.tab.select.target' },
                {
                  params: { target: t.id },
                  onTrigger: () => {
                    recordTaskAudit('soldOrdersTabViewed', t.id);
                    setSearchParams((p) => {
                      if (t.id === 'all') p.delete('tab');
                      else p.set('tab', t.id);
                      return p;
                    }, { replace: true });
                  },
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

      <div className="flex-1 overflow-y-auto" data-scroll-container="OrdersSoldPage-main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text="还没有卖出的订单" hint="发布闲置赚点小钱吧" />
        ) : (
          list.map((o) => <SoldCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  );
}

function SoldCard({ order: o }: { order: XyOrder }) {
  const { bindTap } = useXianyuGestures();
  return (
    <div
      {...bindTap('order.detail-open', { params: { orderId: o.id } })}
      className="bg-white mx-3 mt-3 rounded-xl p-3 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#666]">买家 {o.buyerName}</span>
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
    </div>
  );
}
