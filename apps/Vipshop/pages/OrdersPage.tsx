import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, EmptyState, useToast, NOT_OPEN, VIP } from '../components/ui';
import { ORDER_TABS } from '../constants';
import type { VipOrder, VipOrderStatus } from '../types';

const STATUS_LABEL: Record<VipOrderStatus, string> = {
  pendingPayment: '待付款',
  pendingReceipt: '待收货',
  completed: '已完成',
  canceled: '已取消',
  refunding: '退款中',
};

type BindTap = ReturnType<typeof useVipshopGestures>['bindTap'];

export default function OrdersPage() {
  const { bindTap } = useVipshopGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'all';
  const [toast, showToast] = useToast();

  const orders = useVipshopStore((s) => s.orders);
  const shown = tab === 'all' ? orders : orders.filter((o) => o.status === tab);

  const selectTab = (id: string) => {
    setSearchParams((p) => {
      if (id === 'all') p.delete('tab');
      else p.set('tab', id);
      return p;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="我的订单" />

      {/* 状态 tab(sticky) */}
      <div className="shrink-0 bg-white flex border-b border-[#EEEEEE]">
        {ORDER_TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'orders.statusTab.select.target' }, {
                params: { target: t.id },
                onTrigger: () => selectTab(t.id),
              })}
              className="flex-1 py-2.5 text-[13px] bg-transparent border-none cursor-pointer relative"
              style={on ? { color: VIP.primary, fontWeight: 600 } : { color: '#666666' }}
            >
              {t.label}
              {on && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-0.5 w-6 rounded-full" style={{ background: VIP.primary }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="orders-list" data-scroll-direction="vertical">
        {shown.length === 0 && <EmptyState text="暂无相关订单" hint="快去挑选心仪好物吧~" />}
        {shown.map((o) => (
          <OrderCard key={o.id} order={o} bindTap={bindTap} showToast={showToast} />
        ))}
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}

function OrderCard({
  order: o, bindTap, showToast,
}: { order: VipOrder; bindTap: BindTap; showToast: (m: string) => void }) {
  return (
    <div className="bg-white mt-2 mx-2 rounded-lg overflow-hidden">
      {/* 头部:品牌 + 状态 */}
      <div
        {...bindTap('orders.detail-open', { params: { id: o.id } })}
        className="flex items-center px-3 py-2.5 border-b border-[#F5F5F5] cursor-pointer"
      >
        <span className="text-[13px] font-semibold text-[#222222] truncate">{o.brandName}</span>
        <span className="flex-1" />
        <span className="text-[12px]" style={{ color: o.status === 'pendingPayment' ? VIP.primary : '#888888' }}>
          {STATUS_LABEL[o.status]}
        </span>
      </div>

      {/* 商品行 */}
      <div
        {...bindTap('orders.detail-open', { params: { id: o.id } })}
        className="px-3 py-2 cursor-pointer"
      >
        {o.lines.map((l, i) => (
          <div key={`${l.itemId}_${i}`} className="flex gap-2.5 py-1.5">
            <Img src={l.image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#222222] line-clamp-2">{l.title}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">{l.skuDesc}</div>
            </div>
            <div className="text-right shrink-0">
              <Price value={l.price} size="s" />
              <div className="text-[11px] text-[#888888] mt-0.5">x{l.qty}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 金额 */}
      <div className="px-3 py-1.5 text-right text-[12px] text-[#666666] border-t border-[#F5F5F5]">
        共{o.lines.reduce((s, l) => s + l.qty, 0)}件 实付
        <span className="ml-1 font-semibold" style={{ color: VIP.price }}>¥{o.paidAmount.toFixed(2)}</span>
      </div>

      {/* 状态驱动按钮 */}
      <div className="px-3 py-2 flex items-center justify-end gap-2 flex-wrap border-t border-[#F5F5F5]">
        <button
          {...bindTap({ kind: 'action', id: 'orders.invoice.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white text-[#666666] border-[#DDDDDD]"
        >
          发票详情
        </button>
        <button
          {...bindTap('orders.refund-open', { params: { id: o.id } })}
          className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white text-[#666666] border-[#DDDDDD]"
        >
          申请售后
        </button>

        {o.status === 'pendingPayment' && (
          <>
            <button
              {...bindTap({ kind: 'action', id: 'orders.friendPay.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white text-[#666666] border-[#DDDDDD]"
            >
              找朋友付
            </button>
            <button
              {...bindTap('orders.pay-open', { params: { orderId: o.id } })}
              className="text-[12px] rounded-full px-4 py-1 border-none cursor-pointer text-white"
              style={{ background: VIP.ctaBlack }}
            >
              去付款
            </button>
          </>
        )}

        {o.status === 'completed' && !o.reviewed && (
          <button
            {...bindTap('orders.review-open', { params: { id: o.id } })}
            className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white"
            style={{ color: VIP.primary, borderColor: VIP.primary }}
          >
            评价有礼
          </button>
        )}

        {/* 再次购买:全状态可见 */}
        <button
          {...bindTap('orders.buyAgain-open', { params: { id: o.lines[0].itemId } })}
          className="text-[12px] rounded-full px-4 py-1 border cursor-pointer bg-white"
          style={{ color: VIP.primary, borderColor: VIP.primary }}
        >
          再次购买
        </button>
      </div>
    </div>
  );
}
