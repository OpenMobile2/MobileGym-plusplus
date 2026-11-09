import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useTaobaoStore } from '../state';
import { REFUND_TYPES } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, Price, ShopBadge, BottomSheet, usePanel, useToast } from '../components/ui';
import { PayPanel } from '../components/PayPanel';
import { formatCountdown, formatDateTime, formatRemain, fmt } from '../utils/format';
import type { TaobaoStringKey } from '../res/strings';

const SERVICE_ITEM_KEYS: { nameKey: TaobaoStringKey; descKey: TaobaoStringKey }[] = [
  { nameKey: 'serviceReturnGuaranteeName', descKey: 'serviceReturnGuaranteeDesc' },
  { nameKey: 'servicePriceGuardName', descKey: 'servicePriceGuardDesc' },
  { nameKey: 'serviceAllergyReturnName', descKey: 'serviceAllergyReturnDesc' },
  { nameKey: 'serviceFakeCompensationName', descKey: 'serviceFakeCompensationDesc' },
  { nameKey: 'serviceFastRefundName', descKey: 'serviceFastRefundDesc' },
  { nameKey: 'serviceNoReasonReturnName', descKey: 'serviceNoReasonReturnDesc' },
];

/** 订单详情(spec: orders.detail + refundType/service/pay 弹层) */
export default function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const { value: panel, open: openPanel } = usePanel();
  const { bindTap, back, go } = useTaobaoGestures();
  const s = useStrings();
  const [toast, showToast] = useToast();

  const order = useTaobaoStore((st) => st.orders.find((o) => o.id === orderId));
  const markOrderPaid = useTaobaoStore((st) => st.markOrderPaid);
  const confirmReceipt = useTaobaoStore((st) => st.confirmReceipt);
  const extendReceipt = useTaobaoStore((st) => st.extendReceipt);
  const buyAgain = useTaobaoStore((st) => st.buyAgain);

  const [refundType, setRefundType] = useState(REFUND_TYPES[0].label);
  const [tick, setTick] = useState(0);

  // 倒计时刷新(模拟时间)
  useEffect(() => {
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  void tick;

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-app-bg">
        <TopBar title={s.orderDetailTitle} />
        <div className="flex-1 flex items-center justify-center text-app-text-muted">{s.orderNotFound}</div>
      </div>
    );
  }

  const now = TimeService.now();
  const statusHead =
    order.status === 'pendingPayment'
      ? { title: s.orderStatusPendingPayment, sub: order.payDeadline ? fmt(s.autoCloseCountdownFmt, { time: formatCountdown(order.payDeadline - now) }) : '' }
      : order.status === 'pendingShip'
        ? { title: s.orderStatusPendingShip, sub: s.itemDetailGuarantee48h }
        : order.status === 'shipped'
          ? { title: s.orderStatusShipped, sub: order.autoConfirmAt ? fmt(s.autoConfirmCountdownFmt, { time: formatRemain(order.autoConfirmAt - now) }) : '' }
          : order.status === 'completed'
            ? { title: s.orderStatusCompleted, sub: '' }
            : { title: s.orderStatusRefunded, sub: '' };

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={s.orderDetailTitle} />

      <div className="flex-1 overflow-y-auto px-2.5" data-scroll-container="order-detail" data-scroll-direction="vertical">
        {/* 状态头 */}
        <div className="mt-2 bg-gradient-to-r from-[#FF5000] to-[#FF7A45] rounded-t-xl text-white px-3 py-3">
          <div className="text-[17px] font-bold">{statusHead.title}</div>
          {statusHead.sub && <div className="text-[12px] opacity-90 mt-0.5">{statusHead.sub}</div>}
        </div>

        {/* 物流摘要 + 地址 */}
        <div className="bg-app-surface px-3 py-2.5">
          {order.status === 'shipped' || order.status === 'completed' ? (
            <div
              {...bindTap('orders.logistics-open', { params: { orderId: order.id } })}
              className="text-[13px] cursor-pointer pb-2 border-b border-[#F5F5F5]"
            >
              <span className="text-[#FF5000] font-semibold">
                {order.logistics.noLogistics ? s.noLogisticsShippedText : (order.logistics.nodes[0]?.status ?? s.orderStatusShipped)}
              </span>
              {!order.logistics.noLogistics && order.logistics.nodes[0] && (
                <span className="text-app-text-muted ml-2">{order.logistics.nodes[0].desc}</span>
              )}
              <span className="text-app-text-muted float-right">›</span>
            </div>
          ) : null}
          <div className="flex gap-2 pt-2">
            <span>📍</span>
            <div className="flex-1 text-[13px]">
              <div>{order.addressSnapshot.full}</div>
              <div className="text-app-text-muted text-[12px] mt-0.5">
                {order.addressSnapshot.name} {order.addressSnapshot.phone}
                <span className="ml-1 text-[10px] border border-[#CCCCCC] rounded px-0.5">{s.numberProtectedLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 商品 */}
        <div className="bg-app-surface rounded-b-xl px-3 py-2.5 mt-px">
          <div className="flex items-center text-[13px] mb-1">
            <ShopBadge badge={order.shopBadge} />
            <span className="font-semibold">{order.shopName}</span>
          </div>
          {order.lines.map((l) => (
            <div
              key={l.itemId}
              {...bindTap('orderDetail.item-open', { params: { itemId: l.itemId } })}
              className="flex gap-2.5 py-2 cursor-pointer"
            >
              <Img src={l.image} className="w-18 h-18 w-20 h-20 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] line-clamp-2 leading-snug">{l.title}</div>
                <div className="text-[11px] text-app-text-muted mt-0.5">{l.skuDesc}</div>
                <div className="text-[11px] text-[#FF5000] mt-0.5">{s.noReasonReturnUnsupported}</div>
              </div>
              <div className="text-right shrink-0">
                <Price value={l.price} size="s" />
                <div className="text-[11px] text-app-text-muted">x{l.qty}</div>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-1">
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.order.buyAgain' }, {
                params: { orderId: order.id },
                onTrigger: () => { buyAgain(order.id); showToast(s.addedToCartToast); },
              })}
              className="text-[12px] rounded-full border border-[#DDDDDD] bg-app-surface px-3 py-1.5 cursor-pointer"
            >
              {s.addToCart}
            </button>
            {(order.status === 'pendingShip' || order.status === 'shipped' || order.status === 'completed') && (
              <button
                {...bindTap({ kind: 'action', id: 'orderDetail.refund.open' }, {
                  params: { orderId: order.id },
                  onTrigger: () => openPanel('refundType'),
                })}
                className="text-[12px] rounded-full border border-[#DDDDDD] bg-app-surface px-3 py-1.5 cursor-pointer"
              >
                {s.applyAfterSalesLabel}
              </button>
            )}
          </div>
          {order.gift && (
            <div className="flex justify-between text-[12px] text-app-text-muted border-t border-[#F8F8F8] pt-2 mt-2">
              <span>{fmt(s.giftLabelFmt, { name: order.gift })}</span><span>{s.oneItemLabel}</span>
            </div>
          )}
        </div>

        {/* 金额 */}
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-1">
          <KV k={fmt(s.itemTotalFmt, { count: order.lines.length })} v={`¥${order.itemTotal}`} />
          {order.shopDiscount > 0 && <KV k={s.shopDiscountLabel} v={`-¥${order.shopDiscount}`} red />}
          <KV k={s.shippingFeeLabel} v={`¥${order.shippingFee}`} />
          <div className="flex justify-between py-2.5 text-[13px]">
            <span className="font-semibold">{order.status === 'pendingPayment' ? s.needToPayLabel : s.paidAmountLabel}</span>
            <Price value={order.paidAmount} size="m" />
          </div>
        </div>

        {/* 订单信息 */}
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-1">
          <div className="flex justify-between items-center py-2.5 text-[13px]">
            <span className="text-app-text-muted">{fmt(s.orderNoFmt, { no: order.orderNo })}</span>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.orderNo.copy' }, {
                onTrigger: () => {
                  window.__OS__?.clipboard?.copyText?.(order.orderNo);
                  showToast(s.copiedToast);
                },
              })}
              className="text-[12px] text-app-text border border-[#DDDDDD] rounded-full px-2 py-0.5 bg-app-surface cursor-pointer"
            >
              {s.copyLabel}
            </button>
          </div>
          {order.payMethod && <KV k={s.payMethodLabel} v={order.payMethod} />}
          <KV k={s.transactionSnapshotLabel} v={s.transactionSnapshotDesc} />
          <KV k={s.createdAtLabel} v={formatDateTime(order.createdAt)} />
          {order.paidAt && <KV k={s.paidAtLabel} v={formatDateTime(order.paidAt)} />}
          {order.shippedAt && <KV k={s.shippedAtLabel} v={formatDateTime(order.shippedAt)} />}
          {order.completedAt && <KV k={s.completedAtLabel} v={formatDateTime(order.completedAt)} />}
        </div>

        {/* 服务保障 */}
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-2.5 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-semibold">{s.serviceGuaranteeLabel}</span>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.service.open' }, {
                onTrigger: () => openPanel('service'),
              })}
              className="text-[12px] text-app-text-muted bg-transparent border-none cursor-pointer"
            >
              {s.moreArrow}
            </button>
          </div>
          <div className="flex gap-3 mt-1.5 text-[12px] text-app-text-muted">
            <span>🛡️ {s.serviceReturnGuaranteeName}</span><span>{s.servicePriceGuardName}</span><span>{s.serviceFakeCompensationName}</span><span>{s.serviceFastRefundName}</span>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="shrink-0 bg-app-surface border-t border-app-border flex items-center justify-end px-3 py-2 gap-2">
        {order.status === 'pendingPayment' && (
          <>
            <span className="mr-auto text-[13px]">{s.cartTotalLabel} <Price value={order.paidAmount} size="m" /></span>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.pay.open' }, { onTrigger: () => openPanel('pay') })}
              className="rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[14px] px-5 py-2.5 border-none cursor-pointer"
            >
              {s.continuePaymentLabel} {order.payDeadline ? fmt(s.remainingTimeFmt, { time: formatCountdown(order.payDeadline - now) }) : ''}
            </button>
          </>
        )}
        {order.status === 'shipped' && (
          <>
            <button
              {...bindTap({ kind: 'action', id: 'orders.receipt.extend' }, {
                params: { orderId: order.id },
                onTrigger: () => { extendReceipt(order.id); showToast(s.extendedReceiptToast); },
              })}
              className="text-[13px] rounded-full border border-[#DDDDDD] bg-app-surface px-3.5 py-2 cursor-pointer"
            >
              {s.extendReceiptLabel}
            </button>
            <button
              {...bindTap('orders.logistics-open', { params: { orderId: order.id } })}
              className="text-[13px] rounded-full border border-[#DDDDDD] bg-app-surface px-3.5 py-2 cursor-pointer"
            >
              {s.viewLogisticsLabel}
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.receipt.confirm' }, {
                params: { orderId: order.id },
                onTrigger: () => openPanel('confirmReceipt'),
              })}
              className="text-[13px] rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white px-3.5 py-2 border-none cursor-pointer"
            >
              {s.confirmReceiptLabel}
            </button>
          </>
        )}
        {order.status === 'completed' && (
          <>
            <button
              {...bindTap('orders.logistics-open', { params: { orderId: order.id } })}
              className="text-[13px] rounded-full border border-[#DDDDDD] bg-app-surface px-3.5 py-2 cursor-pointer"
            >
              {s.viewLogisticsLabel}
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.order.buyAgain' }, {
                params: { orderId: order.id },
                onTrigger: () => { buyAgain(order.id); showToast(s.addedToCartToast); },
              })}
              className="text-[13px] rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white px-3.5 py-2 border-none cursor-pointer"
            >
              {s.buyAgainLabel}
            </button>
          </>
        )}
      </div>

      {/* 售后类型弹层 */}
      {panel === 'refundType' && (
        <BottomSheet onClose={() => back()} title={s.selectAfterSalesTypeTitle}>
          <div className="px-4 pb-2">
          <div className="flex gap-2 items-center mb-1">
            <Img src={order.lines[0].image} className="w-12 h-12 rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] line-clamp-1">{order.lines[0].title}</div>
              <div className="text-[11px] text-app-text-muted">{order.lines[0].skuDesc}</div>
            </div>
          </div>
          <div className="text-[11px] text-[#C2410C] bg-[#FFF7EC] rounded px-2 py-1 mb-1">{s.returnGuaranteeBannerText}</div>
          {REFUND_TYPES.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'refund.type.select.option' }, {
                params: { type: t.label },
                onTrigger: () => setRefundType(t.label),
              })}
              className="w-full flex items-center justify-between py-3 bg-transparent border-none border-b border-[#F8F8F8] cursor-pointer"
            >
              <span className="text-left">
                <span className="text-[14px]">{t.label}</span>
                <span className="block text-[11px] text-app-text-muted mt-0.5">{t.desc}</span>
              </span>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 ${
                refundType === t.label ? 'bg-[#FF5000] border-[#FF5000] text-white' : 'border-[#CCCCCC] text-transparent'
              }`}>✓</span>
            </button>
          ))}
          <button
            {...bindTap('refund.form-open', { params: { orderId: order.id, type: refundType } })}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[15px] border-none cursor-pointer mt-3 mb-2"
          >
            {s.nextStepLabel}
          </button>
          </div>
        </BottomSheet>
      )}

      {/* 服务保障弹层 */}
      {panel === 'service' && (
        <BottomSheet onClose={() => back()} title={s.serviceGuaranteeLabel}>
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            {SERVICE_ITEM_KEYS.map((item) => (
              <div key={item.nameKey} className="bg-[#FAFAFA] rounded-xl p-3">
                <div className="text-[13px] font-semibold">{s[item.nameKey]} <span className="text-[#00B578]">✓</span></div>
                <div className="text-[11px] text-app-text-muted mt-1 leading-relaxed">{s[item.descKey]}</div>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* 继续付款弹层 */}
      {panel === 'pay' && (
        <PayPanel
          amount={order.paidAmount}
          onSuccess={() => {
            markOrderPaid(order.id);
            go('pay.success-open', { orderId: order.id });
          }}
          onClose={() => back()}
        />
      )}

      {/* 确认收货弹层(复用 orders.list 的 actionId) */}
      {panel === 'confirmReceipt' && (
        <BottomSheet onClose={() => back()} title={s.confirmReceiptTitle}>
          <div className="px-4 pb-2">
            <div className="text-[12px] text-app-text-muted mb-2">{s.confirmReceiptHint}</div>
            <button
              {...bindTap({ kind: 'action', id: 'orders.confirmReceipt.confirm' }, {
                params: { orderId: order.id },
                onTrigger: () => { confirmReceipt(order.id); back(); showToast(s.confirmReceiptSuccessToast); },
              })}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[15px] border-none cursor-pointer mb-2"
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

function KV({ k, v, red }: { k: string; v: string; red?: boolean }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-[#F8F8F8] text-[13px] last:border-0">
      <span className="text-app-text-muted">{k}</span>
      <span className={red ? 'text-[#FF0036]' : 'text-app-text'}>{v}</span>
    </div>
  );
}
