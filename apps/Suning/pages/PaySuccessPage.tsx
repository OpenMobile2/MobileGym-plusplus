import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcCircleCheck, IcTruck, IcPlus, IcShield } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';
import { addressLine, orderBatchAmount, orderBatchOf } from '../utils/order';
import { fmtYmd } from '../utils/appTime';

/**
 * 支付成功页(spec pay.success,a352)。状态联动已在 pay.password 支付成功时完成,本页纯展示 + 出口。
 * 抽奖九宫格(Q15)与公众号横幅(阶段④审核)已按拍板移除,不复刻。
 */
export default function PaySuccessPage() {
  const { bindTap } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';

  const orders = useSuningStore((s) => s.orders);
  const addresses = useSuningStore((s) => s.addresses);
  const cartItems = useSuningStore((s) => s.cartItems);
  const setTemp = useSuningStore((s) => s.setTemp);

  const order = orders.find((o) => o.id === orderId) ?? null;
  const paidOrders = order ? orderBatchOf(orders, order) : [];
  const paidAmount = orderBatchAmount(paidOrders);
  const isBatch = paidOrders.length > 1;
  const address = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const recommends = SUNING_CONFIG.products
    .filter((p) => !cartItems.some((i) => i.productId === p.id))
    .slice(0, 4);

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        {/* 支付链终点:返回 = 去我的订单(Q16=B),导航栈折叠掉收银台/结算页 */}
        <button
          {...bindTap('pay.success.ordersList.close', {
            params: { tab: 'all' },
            nav: { mode: 'replace', popTo: '/checkout' },
          })}
          className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcNavBack size={24} />
        </button>
        <div className="w-8 flex-1" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex flex-col items-center bg-[var(--app-surface)] py-6">
          <IcCircleCheck size={44} className="text-[var(--app-primary)]" />
          <div className="mt-2 text-[20px] font-bold text-[var(--app-text)]">{S.paySuccessTitle}</div>
          <div className="mt-1 text-[14px] text-[var(--app-text-muted)]">
            {S.paidLabel}
            <span className="text-[16px] font-bold text-[var(--app-c-danger)]">¥{paidAmount}</span>
          </div>
        </div>

        {/* 配送条 */}
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--app-surface)] px-3 py-3">
          <IcTruck size={20} className="shrink-0 text-[var(--app-primary)]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] text-[var(--app-text)]">
              {address ? `${address.name} ${address.phone} ${addressLine(address)}` : ''}
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--app-text-muted)]">
              {S.etaPrefix}
              {order?.etaTs ? fmtYmd(order.etaTs) : ''}
              {S.etaSuffix}
            </div>
          </div>
          {order && (
            <button
              {...(isBatch
                ? bindTap('pay.success.batchOrders.open', {
                    params: { tab: 'all' },
                    nav: { mode: 'replace', popTo: '/checkout' },
                  })
                : bindTap('pay.success.orderDetail.open', { params: { orderId: order.id } }))}
              className="shrink-0 cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-primary)]"
            >
              {S.viewOrder}
            </button>
          )}
        </div>

        {/* 安全提醒 */}
        <div className="mt-2 flex gap-2 rounded-xl bg-[var(--app-surface)] px-3 py-3">
          <IcShield size={16} className="mt-0.5 shrink-0 text-[var(--app-text-muted)]" />
          <div className="min-w-0 flex-1 text-[12px] leading-[18px] text-[var(--app-text-muted)]">{S.safetyNotice}</div>
        </div>

        {/* 继续剁手 */}
        <div className="pb-4">
          <div className="py-3 text-center text-[14px] font-bold text-[var(--app-text)]">··· {S.keepShoppingTitle} ···</div>
          <div className="grid grid-cols-2 gap-2">
            {recommends.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl bg-[var(--app-surface)]">
                <button
                  {...bindTap('pay.success.recommend.open', { params: { productId: p.id } })}
                  className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
                >
                  <span className="block aspect-square w-full bg-[var(--app-c-chip-bg)]">
                    <Img src={p.image} className="h-full w-full object-contain" />
                  </span>
                  <span className="line-clamp-2 block px-2 pt-2 text-[12px] leading-4 text-[var(--app-text)]">{p.title}</span>
                </button>
                <div className="flex items-center px-2 pb-2 pt-1">
                  <span className="min-w-0 flex-1 text-[15px] font-bold text-[var(--app-c-danger)]">
                    <span className="text-[10px]">¥</span>
                    {p.price}
                  </span>
                  <button
                    {...bindTap('pay.success.skuAdd.open', {
                      params: { productId: p.id },
                      beforeTrigger: () => setTemp({ skuEntryHint: 'add' }),
                    })}
                    className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] p-1 text-white"
                  >
                    <IcPlus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
