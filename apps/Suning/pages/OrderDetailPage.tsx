import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import {
  IcNavBack, IcCart, IcMore, IcChevronRight, IcTruck, IcService, IcCopy, IcMapPin,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf, shopOf } from '../utils/detail';
import { totalQty } from '../utils/cart';
import {
  addressLine, goodsAmountOf, orderAddressOf, orderBatchAmount, orderBatchOf,
  orderStatusLabelKey, STATUS_SUBTITLE,
} from '../utils/order';
import { fmtFull, fmtMdHm, fmtYmd } from '../utils/appTime';
import { CancelReasonSheet } from './OrdersListPage';
import { sharePlainText } from '@/os/shareBridge';
import { ClipboardService } from '@/os/ClipboardService';
import { launchGatewayPay } from '../utils/pay';

const IN_TRANSIT = ['awaitShip', 'supplierShip', 'shipping'];

/**
 * 订单详情(spec order.detail,a350 cancelled / a351 awaitShip / frame:r3@3.6 supplierShip
 * + pendingPay、completed 两推断态 qa:Q4)。?sheet=cancelReason、?dialog=deleteConfirm 均 URL 驱动。
 */
export default function OrderDetailPage() {
  const { bindTap, action, bindBack, back, go } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const sheetOpen = searchParams.get('sheet') === 'cancelReason';
  const dialogOpen = searchParams.get('dialog') === 'deleteConfirm';

  const orders = useSuningStore((s) => s.orders);
  const addresses = useSuningStore((s) => s.addresses);
  const cartItems = useSuningStore((s) => s.cartItems);
  const showToast = useSuningStore((s) => s.showToast);
  const setTemp = useSuningStore((s) => s.setTemp);
  const addToCart = useSuningStore((s) => s.addToCart);
  const paySuccess = useSuningStore((s) => s.paySuccess);

  const order = orders.find((o) => o.id === orderId) ?? null;
  const wontfix = () => showToast(S.toastNotOpen);

  if (!order) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-bg)]">
        <div className="bg-gradient-to-b from-[#FE790C] to-[#FFB74D] px-2 pb-4 pt-10">
          <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-white">
            <IcNavBack size={24} />
          </button>
        </div>
        <div className="py-24 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.orderNotFound}</div>
      </div>
    );
  }

  const shop = shopOf(order.shopId);
  // order.modify 改过则用本单地址快照,否则回落地址簿默认地址
  const address = orderAddressOf(order, addresses);
  // 退款中不再显示「48小时内发货」等履约副文案
  const subtitleKey = order.refund != null && order.status !== 'cancelled' ? null : STATUS_SUBTITLE[order.status];
  const latest = order.logistics[0];
  const firstProductId = order.items[0]?.productId ?? '';
  const goods = goodsAmountOf(order);
  const canRefund = IN_TRANSIT.includes(order.status) && !order.refund;
  const picks = SUNING_CONFIG.products.filter((p) => !order.items.some((it) => it.productId === p.id)).slice(0, 4);

  const barBtn = 'cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-[12px] text-[var(--app-text)]';
  /** 「更多」「分享订单」「评价有礼」在 spec 里都是 wontfix,永久停在合并 toast */
  const toastBtn = (label: string, key: string) => (
    <button key={key} {...action('order.detail.wontfix.toast', wontfix)} className={barBtn}>
      {label}
    </button>
  );
  const modifyBtn = (
    <button {...bindTap('order.detail.modify.open', { params: { orderId: order.id } })} className={barBtn}>
      {S.modifyOrderBtn}
    </button>
  );
  const rebuyBtn = (
    <button
      {...bindTap('order.detail.rebuy.detail', { params: { productId: firstProductId } })}
      className="cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[12px] font-bold text-white"
    >
      {S.rebuyBtn}
    </button>
  );
  const deleteBtn = (
    <button
      {...bindTap('order.detail.deleteConfirm.open')}
      className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-[12px] text-[var(--app-text)]"
    >
      {S.deleteOrderBtn}
    </button>
  );

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]" data-status-bar-foreground="light">
      {/* 橙渐变顶栏:返回 / 状态标题+副文案 / 购物车(角标) / ··· */}
      <div className="shrink-0 bg-gradient-to-b from-[#FE790C] to-[#FFB74D] px-2 pb-5 pt-10">
        <div className="flex items-center gap-1">
          <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-white">
            <IcNavBack size={24} />
          </button>
          <span className="min-w-0 flex-1 text-[17px] font-bold text-white">{S[orderStatusLabelKey(order)]}</span>
          <button
            {...bindTap('order.detail.cart.open')}
            className="relative cursor-pointer border-none bg-transparent p-1 text-white"
          >
            <IcCart size={20} />
            {cartItems.length > 0 && (
              <span className="absolute right-0 top-0 min-w-[14px] rounded-full bg-[var(--app-c-danger)] px-1 text-[9px] leading-[14px] text-white">
                {totalQty(cartItems)}
              </span>
            )}
          </button>
          <button
            {...action('order.detail.wontfix.toast', wontfix)}
            className="cursor-pointer border-none bg-transparent p-1 text-white"
          >
            <IcMore size={20} />
          </button>
        </div>
        {subtitleKey && <div className="px-2 pt-1 text-[12px] text-white/90">{S[subtitleKey]}</div>}
      </div>

      <div className="-mt-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 物流条(蓝字,非待支付/已取消) */}
        {latest && order.status !== 'pendingPay' && order.status !== 'cancelled' && (
          <button
            {...bindTap('order.detail.logistics.openFromStrip', { params: { orderId: order.id } })}
            className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-xl border-none bg-[var(--app-surface)] px-3 py-2.5 text-left"
          >
            <IcTruck size={16} className="shrink-0 text-[#2B6BD4]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-[#2B6BD4]">
                {latest.desc}
                {order.etaTs ? ` ${S.etaPrefix}${fmtYmd(order.etaTs)}${S.etaSuffix}` : ''}
              </span>
              <span className="mt-0.5 block text-[11px] text-[var(--app-c-text-muted)]">{fmtMdHm(latest.ts)}</span>
            </span>
            <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
          </button>
        )}

        {/* 地址条 */}
        {address && (
          <div className="mb-2 flex items-start gap-2 rounded-xl bg-[var(--app-surface)] px-3 py-3">
            <IcMapPin size={16} className="mt-0.5 shrink-0 text-[var(--app-primary)]" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-[var(--app-text)]">
                {address.name} {address.phone}
              </div>
              <div className="mt-0.5 text-[12px] leading-4 text-[var(--app-text-muted)]">{addressLine(address)}</div>
            </div>
          </div>
        )}

        {/* 店铺行 + 分享订单 / 商品卡 + 按钮 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="flex items-center gap-1">
            <button
              {...bindTap('order.detail.shop.open', { params: { shopId: order.shopId } })}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left"
            >
              <span className="h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-[var(--app-c-chip-bg)]">
                {shop && <Img src={shop.logo} className="h-full w-full object-cover" />}
              </span>
              <span className="truncate text-[13px] font-bold text-[var(--app-text)]">{shop?.name}</span>
              <IcChevronRight size={12} className="shrink-0 text-[var(--app-c-text-muted)]" />
            </button>
            <button
              {...action('order.detail.share.open', () => {
                const text = `苏宁订单 ${order.orderNo} ¥${order.amount}`;
                const launched = sharePlainText(text, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
                if (!launched) showToast(S.toastNotOpen);
              })}
              className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[12px] text-[var(--app-text-muted)]"
            >
              {S.shareOrder} &gt;
            </button>
          </div>

          {order.items.map((it) => {
            const p = productOf(it.productId);
            return (
              <div key={it.productId + it.skuText} className="mt-2.5">
                <button
                  {...bindTap('order.detail.product.open', { params: { productId: it.productId } })}
                  className="flex w-full cursor-pointer gap-2.5 border-none bg-transparent p-0 text-left"
                >
                  <span className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                    {p && <Img src={p.image} className="h-full w-full object-contain" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[13px] leading-[18px] text-[var(--app-text)]">{p?.title}</span>
                    <span className="mt-1 block truncate text-[11px] text-[var(--app-c-text-muted)]">{it.skuText}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[13px] text-[var(--app-text)]">¥{it.price}</span>
                    <span className="block text-[11px] text-[var(--app-c-text-muted)]">x{it.qty}</span>
                  </span>
                </button>
                <div className="mt-2 flex justify-end gap-2">
                  {canRefund && (
                    <button
                      {...bindTap('order.detail.refundApply.open', { params: { orderId: order.id } })}
                      className={barBtn}
                    >
                      {S.applyRefundBtn}
                    </button>
                  )}
                  <button
                    {...action('order.detail.cart.add', () => {
                      addToCart(it.productId, it.skuText, it.price, it.qty);
                      showToast(S.toastAddedCart);
                    })}
                    className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]"
                  >
                    {S.addToCart}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 联系客服 */}
        <button
          {...bindTap('order.detail.chat.open', { params: { shopId: order.shopId } })}
          className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-xl border-none bg-[var(--app-surface)] px-3 py-3 text-left"
        >
          <IcService size={16} className="shrink-0 text-[var(--app-text-muted)]" />
          <span className="min-w-0 flex-1 text-[13px] text-[var(--app-text)]">{S.contactService}</span>
          <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
        </button>

        {/* 发票区 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5 text-[13px]">
          <div className="pb-1 text-[14px] font-bold text-[var(--app-text)]">{S.invoiceSection}</div>
          {order.invoice?.title && (
            <Row label={S.invoiceTitleLabel} value={order.invoice.title} />
          )}
          <Row label={S.invoiceTypeLabel} value={order.invoice?.type ?? S.invoiceNone} />
        </div>

        {/* 金额区 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5 text-[13px]">
          <Row label={S.payMethodLabel} value={order.payMethod ?? order.chosenPayMethod ?? '-'} />
          <Row label={S.goodsAmount} value={`¥${goods}`} />
          <Row label={S.shippingFeeRow} value="¥0.00" />
          <div className="flex py-0.5">
            <span className="min-w-0 flex-1 text-[var(--app-text-muted)]">{S.actualPaid}</span>
            <span className="text-[16px] font-bold text-[var(--app-c-danger)]">¥{order.amount}</span>
          </div>
        </div>

        {/* 订单号 + 时间明细 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5 text-[13px]">
          <div className="flex items-center py-0.5">
            <span className="min-w-0 flex-1 text-[var(--app-text-muted)]">{S.orderNoLabel}</span>
            <span className="text-[var(--app-text)]">{order.orderNo}</span>
            <button
              {...action('order.detail.orderNo.copy', () => {
                ClipboardService.copyText(order.orderNo, 'suning');
                showToast(S.toastCopied);
              })}
              className="ml-2 flex cursor-pointer items-center gap-0.5 rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 text-[11px] text-[var(--app-text-muted)]"
            >
              <IcCopy size={11} />
              {S.copyBtn}
            </button>
          </div>
          <Row label={S.timePlaced} value={fmtFull(order.timestamps.placed)} />
          {order.timestamps.paid != null && <Row label={S.timePaid} value={fmtFull(order.timestamps.paid)} />}
          {order.timestamps.cancelled != null && (
            <Row label={S.timeCancelled} value={fmtFull(order.timestamps.cancelled)} />
          )}
          {order.etaTs != null && order.status !== 'cancelled' && (
            <Row label={S.timeEta} value={`${fmtYmd(order.etaTs)} ${order.etaRange ?? ''}`} />
          )}
        </div>

        {/* 精选好物双列 */}
        <div className="pb-4">
          <div className="py-2 text-center text-[14px] font-bold text-[var(--app-text)]">{S.pickGoods}</div>
          <div className="grid grid-cols-2 gap-2">
            {picks.map((p) => (
              <button
                key={p.id}
                {...bindTap('order.detail.product.open', { params: { productId: p.id } })}
                className="cursor-pointer overflow-hidden rounded-xl border-none bg-[var(--app-surface)] p-0 text-left"
              >
                <span className="block aspect-square w-full bg-[var(--app-c-chip-bg)]">
                  <Img src={p.image} className="h-full w-full object-contain" />
                </span>
                <span className="block p-2">
                  <span className="line-clamp-2 block text-[12px] leading-4 text-[var(--app-text)]">{p.title}</span>
                  <span className="mt-1 block text-[15px] font-bold text-[var(--app-c-danger)]">
                    <span className="text-[10px]">¥</span>
                    {p.price}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部按钮栏(随状态变化) */}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
        {order.status === 'pendingPay' && (
          <>
            <button
              {...bindTap('order.detail.cancelReason.open', {
                beforeTrigger: () => setTemp({ pendingCancelOrderId: order.id, cancelReason: '' }),
              })}
              className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-[12px] text-[var(--app-text)]"
            >
              {S.cancelOrderBtn}
            </button>
            {modifyBtn}
            <button
              {...bindTap('order.detail.pay.open', {
                params: { orderId: order.id },
                onTrigger: () =>
                  launchGatewayPay(order, () => {
                    paySuccess(order.id);
                    go('order.detail.pay.open', { orderId: order.id });
                  }, orderBatchAmount(orderBatchOf(orders, order))),
              })}
              className="cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[12px] font-bold text-white"
            >
              {S.goPayBtn}
            </button>
          </>
        )}
        {IN_TRANSIT.includes(order.status) && (
          <>
            {order.status === 'supplierShip' && toastBtn(S.moreBtn, 'more')}
            {modifyBtn}
            {canRefund && (
              <button
                {...bindTap('order.detail.refundApply.open', { params: { orderId: order.id } })}
                className={barBtn}
              >
                {S.applyRefundBtn}
              </button>
            )}
            <button
              {...bindTap('order.detail.logistics.open', { params: { orderId: order.id } })}
              className="cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-3 py-1.5 text-[12px] text-[var(--app-primary)]"
            >
              {S.viewLogisticsBtn}
            </button>
          </>
        )}
        {order.status === 'completed' && (
          <>
            {deleteBtn}
            {order.reviewed === false && toastBtn(S.reviewGiftBtn, 'review')}
            {rebuyBtn}
          </>
        )}
        {order.status === 'cancelled' && (
          <>
            {deleteBtn}
            {rebuyBtn}
          </>
        )}
      </div>

      {sheetOpen && (
        <CancelReasonSheet
          idPrefix="order.detail"
          onSubmitted={() => {
            back();
            showToast(S.toastOrderCancelled);
          }}
        />
      )}
      {dialogOpen && <DeleteOrderDialog orderId={order.id} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-0.5">
      <span className="min-w-0 flex-1 text-[var(--app-text-muted)]">{label}</span>
      <span className="text-[var(--app-text)]">{value}</span>
    </div>
  );
}

/** ?dialog=deleteConfirm(qa:Q9):取消 = bindBack;确认删除后回订单列表 */
function DeleteOrderDialog({ orderId }: { orderId: string }) {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const deleteOrder = useSuningStore((s) => s.deleteOrder);
  const showToast = useSuningStore((s) => s.showToast);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative w-[70%] rounded-2xl bg-[var(--app-surface)] px-4 pb-2 pt-5">
        <div className="text-center text-[15px] text-[var(--app-text)]">{S.deleteOrderAsk}</div>
        <div className="mt-4 flex border-t border-[var(--app-border)]">
          <button {...bindBack()} className="flex-1 cursor-pointer border-none bg-transparent py-3 text-[15px] text-[var(--app-text-muted)]">
            {S.cancel}
          </button>
          <button
            {...action('order.detail.delete.confirm', () => {
              deleteOrder(orderId);
              // 关弹窗 + 退出详情页,回到订单列表
              back(2);
              showToast(S.toastOrderDeleted);
            })}
            className="flex-1 cursor-pointer border-l border-[var(--app-border)] bg-transparent py-3 text-[15px] font-bold text-[var(--app-primary)]"
          >
            {S.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
