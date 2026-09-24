import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, PriceYuan, EmptyState, showToast } from '../components/ui';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { ORDER_TABS } from '../constants';
import type { Order, OrderStatus } from '../types';

const STATUS_TEXT: Record<OrderStatus, string> = {
  pendingPayment: '等待付款',
  grouping: '拼团中 · 待分享成团',
  packing: '商家备货中',
  shipped: '待收货',
  completed: '交易成功',
  refunding: '退款处理中',
  refunded: '退款成功',
};

export function OrdersPage() {
  const [sp] = useSearchParams();
  const initStatus = sp.get('status') || 'all';
  const isQuickRefund = sp.get('refund') === 'quick';

  const { bindTap, bindBack, go, back } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const orders = usePinduoduoStore((st) => st.orders);
  const confirmQuickRefund = usePinduoduoStore((st) => st.confirmQuickRefund);
  const remindShip = usePinduoduoStore((st) => st.remindShip);
  const payOrder = usePinduoduoStore((st) => st.payOrder);
  const cancelOrder = usePinduoduoStore((st) => st.cancelOrder);
  const confirmReceipt = usePinduoduoStore((st) => st.confirmReceipt);
  const soloFinishGroup = usePinduoduoStore((st) => st.soloFinishGroup);

  const [tab, setTab] = useState<string>(initStatus);
  const [refundOid, setRefundOid] = useState<string>('');

  const list =
    tab === 'all' ? orders
    : tab === 'completed' ? orders.filter((o) => o.status === 'completed' && !o.reviewed)
    : orders.filter((o) => o.status === tab);
  const refundOrder = orders.find((o) => o.id === refundOid);
  const refundAmount = refundOrder ? (refundOrder.paidAmount > 0 ? refundOrder.paidAmount : refundOrder.itemTotal) : 0;

  const secBtn = 'px-3 h-7 rounded-full border border-[#DDD] text-[13px] text-[#666]';
  const priBtn = 'px-3 h-7 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white text-[13px]';

  const renderButtons = (o: Order) => {
    const btns: React.ReactNode[] = [];
    if (o.status === 'pendingPayment') {
      btns.push(
        <button key="cancel" className={secBtn}
          {...bindTap({ kind: 'action', id: 'orders.cancel.confirm' }, { stopPropagation: true, onTrigger: () => { cancelOrder(o.id); showToast('订单已取消'); } })}
        >取消订单</button>,
        <button key="pay" className={priBtn}
          {...bindTap({ kind: 'action', id: 'orders.pay.now' }, { stopPropagation: true, onTrigger: () => { payOrder(o.id); showToast('付款成功'); } })}
        >立即付款</button>,
      );
    } else if (o.status === 'grouping') {
      btns.push(
        <button key="reorder" className={secBtn}
          {...bindTap('orders.reorder-open', { params: { itemId: o.lines[0].itemId }, stopPropagation: true })}
        >再次拼单</button>,
        <button key="solo" className={priBtn}
          {...bindTap({ kind: 'action', id: 'orders.group.solo' }, { stopPropagation: true, onTrigger: () => { soloFinishGroup(o.id); showToast('拼单成功'); } })}
        >直接免拼</button>,
      );
    } else if (o.status === 'packing') {
      btns.push(
        <button key="refund" className={secBtn}
          {...bindTap('orders.refund.show', { stopPropagation: true, onTrigger: () => { setRefundOid(o.id); go('orders.refund.show'); } })}
        >申请退款</button>,
        <button key="remind" className={priBtn}
          {...bindTap({ kind: 'action', id: 'orders.remind.ship' }, { params: {}, stopPropagation: true, onTrigger: () => { remindShip(o.id); showToast('已提醒商家发货'); } })}
        >提醒发货</button>,
      );
    } else if (o.status === 'shipped') {
      btns.push(
        <button key="refund" className={secBtn}
          {...bindTap('refundform.open', { params: { orderId: o.id }, stopPropagation: true })}
        >申请退款</button>,
        <button key="receipt" className={priBtn}
          {...bindTap({ kind: 'action', id: 'orders.receipt.confirm' }, { stopPropagation: true, onTrigger: () => { confirmReceipt(o.id); showToast('确认收货成功'); } })}
        >确认收货</button>,
      );
    } else if (o.status === 'completed' && !o.reviewed) {
      btns.push(
        <button key="reorder" className={secBtn}
          {...bindTap('orders.reorder-open', { params: { itemId: o.lines[0].itemId }, stopPropagation: true })}
        >再次拼单</button>,
        <button key="review" className={priBtn}
          {...bindTap('orders.review-open', { params: { orderId: o.id }, stopPropagation: true })}
        >评价</button>,
      );
    } else {
      btns.push(
        <button key="reorder" className={priBtn}
          {...bindTap('orders.reorder-open', { params: { itemId: o.lines[0].itemId }, stopPropagation: true })}
        >再次拼单</button>,
      );
    }
    return btns;
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title={s.title_orders} className="bg-white" />

      {/* 状态 Tab 条 */}
      <div className="shrink-0 bg-white flex border-b border-[#F0F0F0]">
        {ORDER_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'orders.tab.select.status' }, {
                params: { status: t.key },
                onTrigger: () => setTab(t.key),
              })}
              className="flex-1 py-2.5 relative"
            >
              <span className={`text-[13px] ${active ? 'text-[#E22E1F] font-medium' : 'text-[#666]'}`}>
                {s[t.labelKey]}
              </span>
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#E22E1F] rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* 订单列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={s.empty_orders} />
        ) : (
          list.map((o) => (
            <div
              key={o.id}
              {...bindTap('orders.detail-open', { params: { orderId: o.id } })}
              className="mx-3 mt-3 bg-white rounded-xl overflow-hidden"
            >
              {/* 店铺行 */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#F5F5F5]">
                <span className="text-[13px] font-medium text-[#333] truncate">{o.shopName}</span>
                <span className="text-[13px] text-[#E22E1F]">{STATUS_TEXT[o.status]}</span>
              </div>
              {/* 商品图文行 */}
              {o.lines.map((ln, i) => (
                <div key={i} className="flex gap-3 px-3 py-2.5">
                  <Img src={ln.image} className="w-16 h-16 rounded-lg object-cover shrink-0" alt={ln.title} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#333] leading-snug line-clamp-2">{ln.title}</div>
                    <div className="text-[12px] text-[#999] mt-1 truncate">{ln.skuDesc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <PriceYuan value={ln.price} className="text-[#333] text-[14px]" symbolClass="text-[11px]" />
                    <div className="text-[12px] text-[#999] mt-1">x{ln.qty}</div>
                  </div>
                </div>
              ))}
              {/* 合计 + 按钮组 */}
              <div className="px-3 py-2.5 border-t border-[#F5F5F5] flex items-center justify-end gap-2">
                <span className="text-[12px] text-[#666] mr-auto">
                  共{o.lines.reduce((n, ln) => n + ln.qty, 0)}件 实付
                  <PriceYuan value={o.paidAmount} className="text-[#333] text-[14px] ml-0.5" symbolClass="text-[11px]" />
                </span>
                {renderButtons(o)}
              </div>
            </div>
          ))
        )}
        <div className="h-4" />
      </div>

      {/* 极速退款弹层 */}
      {isQuickRefund && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" {...bindBack()} />
          <div className="relative bg-white rounded-t-2xl p-5">
            <div className="text-center text-[16px] font-medium text-[#333]">商品未发货,享极速退款</div>
            <div className="text-center text-[28px] font-bold text-[#E22E1F] my-4">
              <PriceYuan value={refundAmount} className="text-[28px]" symbolClass="text-[16px]" />
            </div>
            <div className="text-center text-[12px] text-[#999] mb-4">款项将原路退回,预计 1-3 个工作日到账</div>
            <button
              {...bindTap({ kind: 'action', id: 'orders.quickrefund.confirm' }, {
                onTrigger: () => { confirmQuickRefund(refundOid); showToast('退款成功'); back(); },
              })}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium"
            >确认退款</button>
          </div>
        </div>
      )}
    </div>
  );
}
