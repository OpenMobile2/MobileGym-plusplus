import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { ORDER_TABS } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, Price, ShopBadge, EmptyState, BottomSheet, usePanel, useToast } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { fmt } from '../utils/format';
import type { TbOrder, TbOrderStatus } from '../types';

function matchTab(o: TbOrder, tab: string): boolean {
  if (tab === 'all') return o.status !== 'refunded';
  if (tab === 'review') return o.status === 'completed' && !o.reviewed;
  if (tab === 'refund') return false; // refund tab 展示 refunds 列表
  return o.status === tab;
}

/** 我的订单(spec: orders.list + confirmReceiptPanel) */
export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'all';
  const { value: panel, open: openPanel, searchParams: sp } = usePanel();
  const confirmOrderId = sp.get('order');
  const { bindTap, back } = useTaobaoGestures();
  const s = useStrings();
  const STATUS_LABEL: Record<TbOrderStatus, string> = {
    pendingPayment: s.orderStatusPendingPayment,
    pendingShip: s.orderStatusPendingShip,
    shipped: s.orderStatusShipped,
    completed: s.orderStatusCompleted,
    refunded: s.orderStatusRefunded,
  };
  const [toast, showToast] = useToast();
  const [orderQuery, setOrderQuery] = useState('');

  const orders = useTaobaoStore((s) => s.orders);
  const refunds = useTaobaoStore((s) => s.refunds);
  const items = useTaobaoStore((s) => s.items);
  const confirmReceipt = useTaobaoStore((s) => s.confirmReceipt);
  const extendReceipt = useTaobaoStore((s) => s.extendReceipt);
  const deleteRefundRecord = useTaobaoStore((s) => s.deleteRefundRecord);

  const kw = orderQuery.trim().toLowerCase();
  const shown = orders.filter((o) => matchTab(o, tab) &&
    (!kw || o.lines.some((l) => l.title.toLowerCase().includes(kw)) || o.shopName.toLowerCase().includes(kw)));
  const confirmOrder = orders.find((o) => o.id === confirmOrderId);
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={
        <span className="flex items-center gap-1 bg-[#F5F5F5] rounded-full px-3 py-1 w-full">
          <span className="text-app-text-muted text-[13px]">⌕</span>
          <input
            value={orderQuery}
            {...bindTap({ kind: 'action', id: 'orders.search.input' }, { onTrigger: () => {} })}
            onChange={(e) => setOrderQuery(e.target.value)}
            placeholder={s.ordersSearchPlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-left"
            data-keep-keyboard="true"
          />
          {orderQuery && (
            <button onClick={() => setOrderQuery('')} className="bg-transparent border-none cursor-pointer text-app-text-muted text-[12px]">x</button>
          )}
        </span>
      } />

      {/* 业务 Tab(静态)+ 状态 Tab */}
      <div className="bg-app-surface shrink-0">
        <div className="flex gap-5 px-4 h-9 items-center text-[14px]">
          <span className="font-semibold">{s.ordersAllOrdersTab}</span>
          <span className="text-[#FF5000] font-semibold border-b-2 border-[#FF5000] pb-1">{s.ordersShoppingTab}</span>
          <span className="text-app-text-muted">{s.ordersFlashTab} <span className="text-[8px] text-white bg-[#FF0036] rounded px-0.5">{s.ordersFlashBadge}</span></span>
          <span className="text-app-text-muted">{s.ordersFliggyTab} <span className="text-[8px] text-white bg-[#FFB800] rounded px-0.5">{s.ordersFliggyBadge}</span></span>
        </div>
        <div className="flex px-2 h-10 items-center overflow-x-auto" data-scroll-container="orders-tabs" data-scroll-direction="horizontal">
          {ORDER_TABS.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'orders.tab.select.target' }, {
                params: { tab: t.id },
                onTrigger: () => setSearchParams((p) => { p.set('tab', t.id); return p; }, { replace: true }),
              })}
              className={`shrink-0 px-2.5 text-[13px] bg-transparent border-none cursor-pointer relative pb-1 ${
                tab === t.id ? 'text-[#FF5000] font-semibold' : 'text-app-text'
              }`}
            >
              {t.label}
              {tab === t.id && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF5000]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="orders-list" data-scroll-direction="vertical">
        {tab === 'refund' ? (
          refunds.length === 0 ? (
            <EmptyState text={s.ordersRefundEmpty} />
          ) : (
            refunds.map((r) => (
              <div key={r.id} className="mx-2.5 mt-2 bg-app-surface rounded-xl p-3">
                <div className="flex items-center text-[13px]">
                  <ShopBadge badge={r.shopBadge} />
                  <span className="font-semibold">{r.shopName}</span>
                  <span className="flex-1" />
                  <span className="text-[#FF5000]">{r.status === 'success' ? s.refundSuccessLabel : s.refundProcessingLabel}</span>
                </div>
                <div className="flex gap-2.5 mt-2">
                  <Img src={r.line.image} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] line-clamp-1">{r.line.title}</div>
                    <div className="text-[11px] text-app-text-muted mt-0.5">{r.line.skuDesc}</div>
                    <div className="text-[12px] mt-1">
                      {r.status === 'success' ? s.refundSuccessLabel : s.refundProcessingLongLabel}{s.refundAmountLabel} <Price value={r.amount} size="s" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    {...bindTap({ kind: 'action', id: 'orders.refund.deleteRecord' }, {
                      params: { refundId: r.id },
                      onTrigger: () => deleteRefundRecord(r.id),
                    })}
                    className="text-[12px] rounded-full border border-[#DDDDDD] bg-app-surface px-3 py-1.5 cursor-pointer"
                  >
                    {s.deleteRecordLabel}
                  </button>
                  <button className="text-[12px] rounded-full border border-[#DDDDDD] bg-app-surface px-3 py-1.5 cursor-pointer"
                    onClick={() => showToast(s.moneyReturnedToast)}>
                    {s.moneyDestinationLabel}
                  </button>
                  <button className="text-[12px] rounded-full border border-[#FF5000] text-[#FF5000] bg-app-surface px-3 py-1.5 cursor-pointer"
                    onClick={() => showToast(s.transferredToServiceToast)}>
                    {s.contactMerchantLabel}
                  </button>
                </div>
              </div>
            ))
          )
        ) : shown.length === 0 ? (
          <>
            <div className="bg-app-surface mx-2.5 mt-2 rounded-xl">
              <EmptyState text={s.ordersEmptyText} />
            </div>
            <div className="text-[13px] text-app-text-muted px-4 mt-4 mb-2">{s.recommendForYou}</div>
            <div className="pb-3">
              <ItemGrid items={items.slice(0, 4)} bindingOf={(it) => bindTap('home.item-open', { params: { itemId: it.id } })} />
            </div>
          </>
        ) : (
          shown.map((o) => (
            <div key={o.id} className="mx-2.5 mt-2 bg-app-surface rounded-xl p-3">
              <div
                {...bindTap('orders.detail-open', { params: { orderId: o.id } })}
                className="cursor-pointer"
              >
                <div className="flex items-center text-[13px]">
                  <ShopBadge badge={o.shopBadge} />
                  <span className="font-semibold">{o.shopName}</span>
                  <span className="flex-1" />
                  <span className="text-[#FF5000]">{STATUS_LABEL[o.status]}{o.status === 'shipped' && o.logistics.nodes.length === 0 ? '' : ''}</span>
                </div>
                {o.lines.map((l) => (
                  <div key={l.itemId} className="flex gap-2.5 mt-2">
                    <Img src={l.image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] line-clamp-1">{l.title}</div>
                      <div className="text-[11px] text-app-text-muted mt-0.5">{l.skuDesc}</div>
                      <div className="text-[11px] text-app-text-muted mt-0.5">{s.orderGuaranteeLine}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <Price value={l.price} size="s" />
                      <div className="text-[11px] text-app-text-muted">x{l.qty}</div>
                    </div>
                  </div>
                ))}
                <div className="text-right text-[12px] mt-1.5">
                  {s.paidAmountLabel} <Price value={o.paidAmount} size="m" />
                </div>
              </div>
              {/* 操作按钮 */}
              <div className="flex justify-end gap-2 mt-2">
                {o.status === 'shipped' && (
                  <>
                    <button
                      {...bindTap({ kind: 'action', id: 'orders.receipt.extend' }, {
                        params: { orderId: o.id },
                        onTrigger: () => { extendReceipt(o.id); showToast(s.extendedReceiptToast); },
                      })}
                      className="text-[12px] rounded-full border border-[#DDDDDD] bg-app-surface px-3 py-1.5 cursor-pointer"
                    >
                      {s.extendReceiptLabel}
                    </button>
                    <button
                      {...bindTap('orders.logistics-open', { params: { orderId: o.id } })}
                      className="text-[12px] rounded-full border border-[#DDDDDD] bg-app-surface px-3 py-1.5 cursor-pointer"
                    >
                      {s.viewLogisticsLabel}
                    </button>
                    <button
                      {...bindTap({ kind: 'action', id: 'orders.confirmReceipt.open' }, {
                        params: { orderId: o.id },
                        onTrigger: () => openPanel('confirmReceipt', { order: o.id }),
                      })}
                      className="text-[12px] rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white px-3 py-1.5 border-none cursor-pointer"
                    >
                      {s.confirmReceiptLabel}
                    </button>
                  </>
                )}
                {o.status === 'pendingPayment' && (
                  <button
                    {...bindTap('orders.detail-open', { params: { orderId: o.id } })}
                    className="text-[12px] rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white px-3 py-1.5 border-none cursor-pointer"
                  >
                    {s.continuePaymentLabel}
                  </button>
                )}
                {o.status === 'completed' && !o.reviewed && (
                  <button
                    {...bindTap('reviewCenter.write-open', { params: { orderId: o.id } })}
                    className="text-[12px] rounded-full border border-[#FF5000] text-[#FF5000] bg-app-surface px-3 py-1.5 cursor-pointer"
                  >
                    {s.goReviewLabel}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div className="h-3" />
      </div>

      {/* 确认收货弹层 */}
      {panel === 'confirmReceipt' && confirmOrder && (
        <BottomSheet onClose={() => back()} title={s.confirmReceiptTitle}>
          <div className="px-4 pb-2">
            <div className="flex items-center text-[13px] mb-2">
              <ShopBadge badge={confirmOrder.shopBadge} />
              <span className="font-semibold">{confirmOrder.shopName}</span>
              <span className="flex-1" />
              <span className="text-[#FF5000]">{fmt(s.confirmReceiptStatusFmt, { status: STATUS_LABEL[confirmOrder.status] })}</span>
            </div>
            {confirmOrder.lines.map((l) => (
              <div key={l.itemId} className="flex gap-2.5 py-2">
                <Img src={l.image} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] line-clamp-1">{l.title}</div>
                  <div className="text-[11px] text-app-text-muted mt-0.5">{l.skuDesc}</div>
                  <div className="text-[11px] text-app-text-muted mt-0.5">{s.orderGuaranteeLine}</div>
                </div>
                <Price value={l.price} size="s" />
              </div>
            ))}
            {shippedCount > 1 && (
              <div className="text-[12px] text-app-text-muted mt-1">{fmt(s.moreShippedOrdersFmt, { count: shippedCount - 1 })}</div>
            )}
            <div className="text-[11px] text-app-text-muted mt-2 text-center">{s.confirmReceiptHint}</div>
            <button
              {...bindTap({ kind: 'action', id: 'orders.confirmReceipt.confirm' }, {
                params: { orderId: confirmOrder.id },
                onTrigger: () => { confirmReceipt(confirmOrder.id); back(); showToast(s.confirmReceiptSuccessToast); },
              })}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[15px] font-medium border-none cursor-pointer mt-3 mb-2"
            >
              {s.confirmReceiptLabel}
            </button>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
