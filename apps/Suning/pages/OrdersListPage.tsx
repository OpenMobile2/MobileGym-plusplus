import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcSearch, IcMore, IcChevronRight, IcCheck, IcClose, IcTruck } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { productOf, shopOf } from '../utils/detail';
import {
  ORDER_TABS, CANCEL_REASONS, asOrderTab, ordersOfTab, orderStatusLabelKey, fmtCountdown, orderQty,
  orderBatchAmount, orderBatchOf,
} from '../utils/order';
import { fmtMdHm } from '../utils/appTime';
import { launchGatewayPay } from '../utils/pay';
import type { RuntimeOrder } from '../types';

/**
 * 我的订单列表(spec orders.list,s328/s329 + frame:r1@68.4~85.2)。
 * 状态 Tab 走 ?tab= 动态 queryParam(键不作离散 uiState 键);取消原因弹层 ?sheet=cancelReason。
 */
export default function OrdersListPage() {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = asOrderTab(searchParams.get('tab'));
  const sheetOpen = searchParams.get('sheet') === 'cancelReason';

  const orders = useSuningStore((s) => s.orders);
  const showToast = useSuningStore((s) => s.showToast);

  const wontfix = () => showToast(S.toastNotOpen);
  const list = ordersOfTab(orders, tab);

  /** 常购商品横条:订单里出现过的商品去重前 4 条 */
  const frequent = [...new Set(orders.flatMap((o) => o.items.map((it) => it.productId)))]
    .map((id) => productOf(id))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .slice(0, 4);

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 / 我的订单·其他订单胶囊 / 搜索 / ··· */}
      <div className="flex items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="flex min-w-0 flex-1 justify-center">
          <div className="flex items-center rounded-full bg-[var(--app-c-chip-bg)] p-0.5">
            <span className="rounded-full bg-[var(--app-surface)] px-3 py-1 text-[13px] font-bold text-[var(--app-text)]">{S.myOrders}</span>
            <button
              {...bindTap('orders.list.otherOrders.open')}
              className="cursor-pointer rounded-full border-none bg-transparent px-3 py-1 text-[13px] text-[var(--app-text-muted)]"
            >
              {S.otherOrders}
            </button>
          </div>
        </div>
        <button
          {...bindTap('orders.list.search.open')}
          className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcSearch size={19} />
        </button>
        <button
          {...action('orders.list.wontfix.toast', wontfix)}
          className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcMore size={19} />
        </button>
      </div>

      {/* 状态 Tab 行 */}
      <div className="flex items-center bg-[var(--app-surface)] px-1 pb-1.5">
        {ORDER_TABS.map((t) => (
          <button
            key={t.key}
            {...action('orders.list.tab.switch', () => setSearchParams({ tab: t.key }, { replace: true }), {
              params: { tab: t.key },
            })}
            className={`relative min-w-0 flex-1 cursor-pointer border-none bg-transparent px-0 py-1 text-[13px] ${
              tab === t.key ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'
            }`}
          >
            {S[t.label]}
            {tab === t.key && <span className="absolute -bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 常购商品横条 + 常购清单侧条 */}
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {frequent.map((p) => (
              <button
                key={p.id}
                {...bindTap('orders.list.product.open', { params: { productId: p.id } })}
                className="h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border-none bg-[var(--app-c-chip-bg)] p-0"
              >
                <Img src={p.image} className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
          <button
            {...action('orders.list.wontfix.toast', wontfix)}
            className="flex w-6 shrink-0 cursor-pointer flex-col items-center border-none bg-transparent p-0 text-[10px] leading-3 text-[var(--app-text-muted)]"
          >
            {S.frequentList}
          </button>
        </div>

        {list.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
        {list.length === 0 && <div className="py-16 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.ordersEmpty}</div>}
        <div className="py-3 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.listEnd}</div>
      </div>

      {sheetOpen && (
        <CancelReasonSheet
          idPrefix="orders.list"
          onSubmitted={() => {
            back();
            showToast(S.toastOrderCancelled);
          }}
        />
      )}
    </div>
  );
}

/** 订单卡:店铺行 / 状态 / 倒计时或物流条 / 商品行 / 合计 / 按钮组(随状态变化) */
function OrderCard({ order }: { order: RuntimeOrder }) {
  const { bindTap, action, go } = useSuningGestures();
  const S = useStrings();
  const orders = useSuningStore((s) => s.orders);
  const showToast = useSuningStore((s) => s.showToast);
  const setTemp = useSuningStore((s) => s.setTemp);
  const paySuccess = useSuningStore((s) => s.paySuccess);
  const shop = shopOf(order.shopId);
  const wontfix = () => showToast(S.toastNotOpen);
  const firstProductId = order.items[0]?.productId ?? '';
  const latest = order.logistics[0];

  const cancelBtn = (
    <button
      {...bindTap('orders.list.cancelReason.open', {
        beforeTrigger: () => setTemp({ pendingCancelOrderId: order.id, cancelReason: '' }),
      })}
      className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]"
    >
      {S.cancelOrderBtn}
    </button>
  );
  const outlineBtn = 'cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]';
  const modifyBtn = (
    <button {...bindTap('orders.list.modify.open', { params: { orderId: order.id } })} className={outlineBtn}>
      {S.modifyOrderBtn}
    </button>
  );
  const refundBtn = (
    <button {...bindTap('orders.list.refundApply.open', { params: { orderId: order.id } })} className={outlineBtn}>
      {S.applyRefundBtn}
    </button>
  );
  /** 评价撰写页不在复刻范围(spec 该项 priority=wontfix),永久停在 toast */
  const reviewBtn = (
    <button {...action('orders.list.wontfix.toast', wontfix)} className={outlineBtn}>
      {S.reviewGiftBtn}
    </button>
  );
  const rebuyBtn = (
    <button
      {...bindTap('orders.list.rebuy.detail', { params: { productId: firstProductId } })}
      className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]"
    >
      {S.rebuyBtn}
    </button>
  );

  return (
    <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
      <div className="flex items-center gap-1">
        <button
          {...bindTap('orders.list.shop.open', { params: { shopId: order.shopId } })}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left"
        >
          <span className="h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-[var(--app-c-chip-bg)]">
            {shop && <Img src={shop.logo} className="h-full w-full object-cover" />}
          </span>
          <span className="truncate text-[13px] font-bold text-[var(--app-text)]">{shop?.name}</span>
          <IcChevronRight size={12} className="shrink-0 text-[var(--app-c-text-muted)]" />
        </button>
        <span className="shrink-0 text-[13px] font-bold text-[var(--app-primary)]">{S[orderStatusLabelKey(order)]}</span>
      </div>

      {order.status === 'pendingPay' && (
        <div className="mt-2 rounded bg-[#FFF3E8] px-2 py-1 text-[11px] text-[var(--app-primary)]">
          {S.countdownPrefix}
          {fmtCountdown(order.remainSec ?? 0)}
          {S.countdownSuffix}
        </div>
      )}
      {order.status !== 'pendingPay' && latest && (
        <button
          {...bindTap('orders.list.logistics.openFromStrip', { params: { orderId: order.id } })}
          className="mt-2 flex w-full cursor-pointer items-center gap-1 rounded border-none bg-[#F4F8FF] px-2 py-1.5 text-left"
        >
          <IcTruck size={13} className="shrink-0 text-[#2B6BD4]" />
          <span className="min-w-0 flex-1 truncate text-[11px] text-[#2B6BD4]">{latest.desc}</span>
          <span className="shrink-0 text-[10px] text-[#8FA9CF]">{fmtMdHm(latest.ts)}</span>
        </button>
      )}

      <button
        {...bindTap('orders.list.detail.open', { params: { orderId: order.id } })}
        className="mt-2 w-full cursor-pointer border-none bg-transparent p-0 text-left"
      >
        {order.items.map((it) => {
          const p = productOf(it.productId);
          return (
            <span key={it.productId + it.skuText} className="flex gap-2.5">
              <span className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
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
            </span>
          );
        })}
      </button>

      <div className="mt-2 text-right text-[12px] text-[var(--app-text-muted)]">
        {S.totalCountPrefix}
        {orderQty(order)}
        {S.totalCountSuffix}
        <span className="text-[15px] font-bold text-[var(--app-c-danger)]">¥{order.amount}</span>
      </div>

      <div className="mt-2 flex flex-wrap justify-end gap-2">
        {order.status === 'pendingPay' && (
          <>
            {cancelBtn}
            {modifyBtn}
            <button
              {...bindTap('orders.list.pay.open', {
                params: { orderId: order.id },
                onTrigger: () =>
                  launchGatewayPay(order, () => {
                    paySuccess(order.id);
                    go('orders.list.pay.open', { orderId: order.id });
                  }, orderBatchAmount(orderBatchOf(orders, order))),
              })}
              className="cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1 text-[12px] font-bold text-white"
            >
              {S.goPayBtn}
            </button>
          </>
        )}
        {(order.status === 'awaitShip' || order.status === 'supplierShip' || order.status === 'shipping') && (
          <>
            {rebuyBtn}
            {!order.refund && refundBtn}
            {modifyBtn}
            <button
              {...bindTap('orders.list.logistics.open', { params: { orderId: order.id } })}
              className="cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-primary)]"
            >
              {S.viewLogisticsBtn}
            </button>
          </>
        )}
        {order.status === 'completed' && (
          <>
            {rebuyBtn}
            {order.reviewed === false && reviewBtn}
          </>
        )}
        {order.status === 'cancelled' && rebuyBtn}
      </div>
    </div>
  );
}

/**
 * 取消原因弹层(s329,orders.list / order.detail 共用结构,action id 按宿主页分流)。
 * 未选原因时「提交」渲染为无 binding 的置灰按钮(只给有行为的控件打 tag)。
 */
export function CancelReasonSheet({
  idPrefix, onSubmitted,
}: { idPrefix: 'orders.list' | 'order.detail'; onSubmitted: () => void }) {
  const { action, bindBack } = useSuningGestures();
  const S = useStrings();
  const reason = useSuningStore((s) => s._temp.cancelReason);
  const pendingId = useSuningStore((s) => s._temp.pendingCancelOrderId);
  const setTemp = useSuningStore((s) => s.setTemp);
  const cancelOrder = useSuningStore((s) => s.cancelOrder);

  const submit = () => {
    if (!pendingId || !reason) return;
    cancelOrder(pendingId, reason);
    onSubmitted();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative max-h-[80%] overflow-y-auto overflow-x-hidden rounded-t-2xl bg-[var(--app-surface)]">
        <div className="sticky top-0 flex items-center bg-[var(--app-surface)] px-4 pb-2 pt-3">
          <span className="min-w-0 flex-1 text-center text-[15px] font-bold text-[var(--app-text)]">{S.cancelReasonTitle}</span>
          <button {...bindBack()} className="absolute right-3 cursor-pointer border-none bg-transparent p-1 text-[var(--app-c-text-muted)]">
            <IcClose size={18} />
          </button>
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-[#FFF7F0] px-2 py-1.5 text-[11px] leading-4 text-[var(--app-primary)]">
            {S.cancelReasonTip}
          </div>
          <div className="mt-3 text-[13px] text-[var(--app-text-muted)]">{S.cancelReasonRequired}</div>
          {CANCEL_REASONS.map((key) => {
            const text = S[key];
            return (
              <button
                key={key}
                {...action(
                  idPrefix === 'orders.list' ? 'orders.list.cancelReason.select' : 'order.detail.cancelReason.select',
                  () => setTemp({ cancelReason: text }),
                  { params: { reason: text } },
                )}
                className="flex w-full cursor-pointer items-center gap-2 border-none border-b border-[var(--app-border)] bg-transparent py-3 text-left"
              >
                <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{text}</span>
                {reason === text && <IcCheck size={16} className="shrink-0 text-[var(--app-primary)]" />}
              </button>
            );
          })}
          {reason ? (
            <button
              {...action(
                idPrefix === 'orders.list' ? 'orders.list.cancelReason.submit' : 'order.detail.cancelReason.submit',
                submit,
              )}
              className="mt-4 w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
            >
              {S.submitBtn}
            </button>
          ) : (
            <button disabled className="mt-4 w-full rounded-full border-none bg-[var(--app-c-chip-bg)] py-2.5 text-[15px] font-bold text-[var(--app-c-text-muted)]">
              {S.submitBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
