import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { DIANPING_CONFIG } from '../data';
import { PLATFORM_COUPONS } from '../constants';
import { shopCoverUrl } from '../assets';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcChevronDown } from '../res/icons';

export default function OrderConfirmPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action, go } = useDianpingGestures();
  const [sp] = useSearchParams();
  const shopId = sp.get('shopId') || '';
  const dealId = sp.get('dealId') || '';
  const sheet = sp.get('sheet');
  const shops = useDianpingStore((st) => st.shops);
  const pending = useDianpingStore((st) => st.pendingCheckout);
  const setPendingCheckout = useDianpingStore((st) => st.setPendingCheckout);
  const setCheckoutQty = useDianpingStore((st) => st.setCheckoutQty);
  const selectPlatformCoupon = useDianpingStore((st) => st.selectPlatformCoupon);
  const createPendingOrder = useDianpingStore((st) => st.createPendingOrder);
  const showToast = useDianpingStore((st) => st.showToast);
  const shop = shops.find((x) => x.id === shopId);
  const deal = shop?.deals.find((d) => d.id === dealId);
  const qty = pending?.shopId === shopId && pending.dealId === dealId ? pending.qty : 1;
  const couponId =
    pending?.shopId === shopId && pending.dealId === dealId ? pending.couponId ?? null : null;
  const [expandUnusable, setExpandUnusable] = useState<string | null>(null);

  useEffect(() => {
    if (shopId && dealId) setPendingCheckout({ shopId, dealId, qty: 1, couponId: null });
  }, [shopId, dealId, setPendingCheckout]);

  if (!shop || !deal) {
    return (
      <div className="p-4">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="mt-8 text-center text-(--app-c-text-muted)">Deal not found</div>
      </div>
    );
  }

  const gross = Number((deal.price * qty).toFixed(2));
  const selected = PLATFORM_COUPONS.find((c) => c.id === couponId && c.usable);
  const discount = selected ? selected.amount : 0;
  const pay = Number(Math.max(0.01, gross - discount).toFixed(2));
  const cover = shopCoverUrl(shop.id);
  const usable = PLATFORM_COUPONS.filter((c) => c.usable);
  const unusable = PLATFORM_COUPONS.filter((c) => !c.usable);

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground="dark">
      <div className="flex h-11 items-center gap-1 bg-(--app-c-card-bg) px-1">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="min-w-0 flex-1 truncate text-center text-[13px] font-medium text-(--app-c-text-secondary)">
          随时退 · 过期自动退 · 到店
        </div>
        <span className="w-9" />
      </div>
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="order-confirm"
        data-scroll-direction="vertical"
      >
        <div className="mx-3 mt-3 flex gap-3 rounded-[10px] bg-(--app-c-card-bg) p-3">
          <div
            className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
            style={{ background: shop.coverColor }}
          >
            {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-(--app-c-text-primary)">{deal.title}</div>
            <div className="mt-1 truncate text-[11px] text-(--app-c-text-muted)">
              周一至周日 · 部分可用
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[16px] font-bold text-(--app-c-text-primary)">¥{deal.price}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-7 w-7 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[16px]"
                  {...action('order.qty.dec.action', () => setCheckoutQty(qty - 1))}
                >
                  −
                </button>
                <span className="w-6 text-center text-[14px] font-semibold">{qty}</span>
                <button
                  type="button"
                  className="h-7 w-7 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[16px]"
                  {...action('order.qty.inc.action', () => setCheckoutQty(qty + 1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-2 rounded-[10px] bg-(--app-c-card-bg) px-3 py-2 text-[13px] text-(--app-c-text-secondary)">
          <div className="flex justify-between py-2">
            <span>
              商品总价 (共{qty}件)
            </span>
            <span className="text-(--app-c-text-primary)">¥{gross}</span>
          </div>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-2 text-left text-[13px] text-(--app-c-text-secondary)"
            {...bindTap('order.coupon-open', { params: { shopId, dealId } })}
          >
            <span>活动优惠</span>
            <span className="inline-flex items-center gap-0.5 font-medium text-[#FF6633]">
              {discount > 0 ? `-¥${discount}` : s.meituanCoupon}
              <IcChevronDown size={12} className="text-(--app-c-text-muted)" />
            </span>
          </button>
          <div className="flex justify-between border-t border-[#F5F5F5] py-2">
            <span>{s.phone}</span>
            <span>{DIANPING_CONFIG.user.phone ?? '138****0000'}</span>
          </div>
        </div>

        <div className="mx-3 mt-2 rounded-[10px] bg-(--app-c-card-bg) px-3 py-3 text-[12px] leading-5 text-(--app-c-text-muted)">
          {deal.rules || s.dealRules}
        </div>
      </div>
      <div className="flex h-14 items-center justify-between border-t border-(--app-c-border) bg-(--app-c-card-bg) px-3">
        <div className="text-[13px]">
          {s.payAmount}{' '}
          <span className="text-[20px] font-bold text-[#FF6633]">¥{pay}</span>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-full border-none bg-[#FF6600] px-6 py-2.5 text-[15px] font-semibold text-white"
          {...action('order.submit.commit', () => {
            const id = createPendingOrder();
            if (!id) {
              showToast(s.sliceHint);
              return;
            }
            go('order.submit', { orderId: id });
          })}
        >
          {s.submitOrder}
        </button>
      </div>

      {sheet === 'coupon' ? (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/45">
          <button
            type="button"
            className="min-h-0 flex-1 cursor-pointer border-none bg-transparent"
            aria-label="close"
            {...bindTap('order.coupon-dismiss', { params: { shopId, dealId } })}
          />
          <div
            className="max-h-[78%] overflow-y-auto rounded-t-[16px] bg-(--app-c-page-bg) pb-4"
            data-scroll-container="coupon-picker"
            data-scroll-direction="vertical"
          >
            <div className="sticky top-0 z-10 bg-(--app-c-card-bg) px-4 pb-2 pt-3 text-center text-[16px] font-bold text-(--app-c-text-primary)">
              {s.meituanCoupon}
            </div>
            <div className="px-3 pt-2">
              <div className="mb-2 text-[14px] font-bold text-(--app-c-text-primary)">此订单可用的券</div>
              {usable.map((c) => {
                const on = couponId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="mb-2 flex w-full cursor-pointer items-stretch gap-0 overflow-hidden rounded-[10px] border border-(--app-c-border) bg-(--app-c-card-bg) p-0 text-left"
                    {...action(
                      'coupon.select.target',
                      () => {
                        selectPlatformCoupon(on ? null : c.id);
                        go('order.coupon-dismiss', { shopId, dealId });
                      },
                      { params: { target: c.id } },
                    )}
                  >
                    <div className="flex w-[88px] shrink-0 flex-col items-center justify-center bg-[#FFF7F2] px-2 py-3 text-[#FF6633]">
                      <div className="text-[22px] font-bold leading-none">
                        <span className="text-[13px]">¥</span>
                        {c.amount}
                      </div>
                      <div className="mt-1 text-center text-[9px] leading-tight text-[#FF8A5C]">
                        {c.subText}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between px-3 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-(--app-c-text-primary)">{c.title}</div>
                        <div className="mt-1 text-[11px] text-(--app-c-text-muted)">{c.expireText}</div>
                      </div>
                      <span
                        className={`ml-2 h-5 w-5 shrink-0 rounded-full border-2 ${
                          on ? 'border-[#FF6633] bg-[#FF6633]' : 'border-[#CCC] bg-(--app-c-card-bg)'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}

              <div className="mb-2 mt-3 text-[14px] font-bold text-(--app-c-text-primary)">此订单不可用的券</div>
              {unusable.map((c) => {
                const open = expandUnusable === c.id;
                return (
                  <div
                    key={c.id}
                    className="mb-2 overflow-hidden rounded-[10px] border border-(--app-c-border) bg-(--app-c-card-bg)"
                  >
                    <div className="flex items-stretch">
                      <div className="relative flex w-[88px] shrink-0 flex-col items-center justify-center bg-(--app-c-page-bg) px-2 py-3 text-(--app-c-text-muted)">
                        {c.tag ? (
                          <span className="absolute left-0 top-0 rounded-br-[6px] bg-[#DDD] px-1.5 text-[9px] text-(--app-c-text-secondary)">
                            {c.tag}
                          </span>
                        ) : null}
                        <div className="text-[22px] font-bold leading-none">
                          <span className="text-[13px]">¥</span>
                          {c.amount}
                        </div>
                        <div className="mt-1 text-[10px]">{c.subText}</div>
                      </div>
                      <div className="flex min-w-0 flex-1 items-center justify-between px-3 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-(--app-c-text-muted)">{c.title}</div>
                          <div className="mt-1 text-[11px] text-[#BBB]">{c.expireText}</div>
                        </div>
                        <span className="ml-2 h-5 w-5 shrink-0 rounded-full bg-[#E8E8E8]" />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between border-none border-t border-[#F5F5F5] bg-transparent px-3 py-2 text-left"
                      {...action('coupon.unusable.expand', () =>
                        setExpandUnusable(open ? null : c.id),
                      )}
                    >
                      <span className="text-[12px] text-[#FF6633]">本单不可用原因</span>
                      <IcChevronDown
                        size={12}
                        className={`text-[#FF6633] transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {open && c.reason ? (
                      <div className="px-3 pb-2 text-[11px] leading-4 text-(--app-c-text-muted)">
                        不可用原因：{c.reason}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
