import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import {
  IcNavBack, IcChevronRight, IcChevronUp, IcCheck, IcMinus, IcPlus, IcClose, IcMapPin,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore, checkoutTotal } from '../state';
import { launchGatewayPay } from '../utils/pay';
import { useStrings } from '../i18n';
import { productOf, shopOf } from '../utils/detail';
import { addressLine } from '../utils/order';
import { orderBatchAmount, orderBatchOf } from '../utils/order';
import { etaTs, fmtMdWeek, fmtCnDateWeek } from '../utils/appTime';
import type { Address, CheckoutDraft, InvoiceType, WarrantyOption } from '../types';

const DELIVERY_SLOTS = ['09:00-12:00', '12:00-18:00', '18:00-21:00'] as const;
/** 送货日:今天+1 起共 7 个自然日(相对生成,勿写死) */
const DAY_OFFSETS = [1, 2, 3, 4, 5, 6, 7];

function Circle({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
        on ? 'bg-[var(--app-primary)] text-white' : 'border border-[var(--app-border)] bg-[var(--app-surface)] text-transparent'
      }`}
    >
      <IcCheck size={12} strokeWidth={3} />
    </span>
  );
}

/** 底部弹层外壳:蒙层 bindBack + 白圆角面板 + 右上关闭×;bottomInset 让出主页面底栏 */
function Sheet({
  title, children, bottomInset = false,
}: { title: string; children: React.ReactNode; bottomInset?: boolean }) {
  const { bindBack } = useSuningGestures();
  return (
    <div className={`absolute inset-x-0 top-0 z-40 flex flex-col justify-end ${bottomInset ? 'bottom-[54px]' : 'bottom-0'}`}>
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative max-h-[80%] overflow-y-auto overflow-x-hidden rounded-t-2xl bg-[var(--app-surface)]">
        <div className="sticky top-0 flex items-center bg-[var(--app-surface)] px-4 pb-2 pt-3">
          <span className="min-w-0 flex-1 text-center text-[15px] font-bold text-[var(--app-text)]">{title}</span>
          <button {...bindBack()} className="absolute right-3 cursor-pointer border-none bg-transparent p-1 text-[var(--app-c-text-muted)]">
            <IcClose size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** 结算页(spec checkout.main,s283/s284/s285/s286/s300 + frame:r1@44.4~54.0) */
export default function CheckoutPage() {
  const { bindTap, action, go } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const sheet = searchParams.get('sheet');
  const dialog = searchParams.get('dialog');

  const draft = useSuningStore((s) => s.checkoutDraft);
  const addresses = useSuningStore((s) => s.addresses);
  const showToast = useSuningStore((s) => s.showToast);
  const setCheckoutQty = useSuningStore((s) => s.setCheckoutQty);
  const setCheckoutWarranty = useSuningStore((s) => s.setCheckoutWarranty);
  const setPayMethod = useSuningStore((s) => s.setPayMethod);
  const toggleSubsidy = useSuningStore((s) => s.toggleSubsidy);
  const markSubsidyDialogSeen = useSuningStore((s) => s.markSubsidyDialogSeen);
  const placeOrder = useSuningStore((s) => s.placeOrder);
  const paySuccess = useSuningStore((s) => s.paySuccess);

  const items = draft?.items ?? [];
  const subsidyEligible = items.some((it) => productOf(it.productId)?.promoTag === 'gov');

  /* 进入页面自动弹国补弹窗(仅国补单、每次结算一次);StrictMode 双调用用 ref 守卫 */
  const autoDialogRef = useRef(false);
  useEffect(() => {
    if (autoDialogRef.current) return;
    if (!draft || draft.subsidyDialogSeen || !subsidyEligible) return;
    if (sheet || dialog) return;
    autoDialogRef.current = true;
    markSubsidyDialogSeen();
    go('checkout.main.subsidyDialog.open');
  }, [draft, subsidyEligible, sheet, dialog, go, markSubsidyDialogSeen]);

  const wontfix = () => showToast(S.toastNotOpen);

  if (!draft) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-bg)]">
        <TopBar title={S.checkoutTitle} />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="py-24 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.checkoutEmpty}</div>
        </div>
      </div>
    );
  }

  const address = addresses.find((a) => a.id === draft.addressId) ?? null;
  const goodsTotal = Math.round(items.reduce((sum, it) => sum + it.price * it.qty, 0) * 100) / 100;
  const total = checkoutTotal(draft);
  const shopIds = [...new Set(items.map((it) => it.shopId))];
  /** 延保区仅家电/3C 单品结算出现 */
  const warrantyList: WarrantyOption[] =
    items.length === 1 ? (productOf(items[0].productId)?.sku?.warranty ?? []) : [];

  const stepQty = (key: string, delta: number) => {
    const it = items.find((x) => (x.cartItemId ?? x.productId) === key);
    const limit = productOf(it?.productId ?? '')?.sku?.limitQty ?? 99;
    if (it && it.qty + delta > limit) {
      showToast(S.toastLimit);
      return;
    }
    setCheckoutQty(key, delta);
  };

  const pickWarranty = (w: WarrantyOption) =>
    setCheckoutWarranty(draft.warrantyId === w.id ? null : w.id, w.price);

  const invoiceText =
    draft.invoiceType === 'electronic'
      ? `${S.invoiceElectronicShort}-${address?.name ?? ''}`
      : S.invoiceNone;

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <TopBar title={S.checkoutTitle} />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 地址卡 */}
        <button
          {...bindTap('checkout.main.addressPicker.open')}
          className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-xl border-none bg-[var(--app-surface)] px-3 py-3 text-left"
        >
          <IcMapPin size={18} className="shrink-0 text-[var(--app-primary)]" />
          <span className="min-w-0 flex-1">
            {address ? (
              <>
                <span className="flex flex-wrap items-center gap-1">
                  {address.tags.map((t) => (
                    <span key={t} className="rounded-sm bg-[#FFF3E8] px-1 text-[10px] leading-4 text-[var(--app-primary)]">
                      {t}
                    </span>
                  ))}
                  <span className="text-[13px] text-[var(--app-text-muted)]">
                    {address.province}
                    {address.city}
                    {address.district}
                    {address.street}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[15px] font-bold text-[var(--app-text)]">{address.detail}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--app-text-muted)]">
                  {address.name} {address.phone}
                </span>
              </>
            ) : (
              <span className="text-[15px] text-[var(--app-c-text-muted)]">{S.addressEmpty}</span>
            )}
          </span>
          <IcChevronRight size={16} className="shrink-0 text-[var(--app-c-text-muted)]" />
        </button>

        {/* 店铺分组商品卡 */}
        {shopIds.map((shopId) => {
          const shop = shopOf(shopId);
          return (
            <div key={shopId} className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
              <button
                {...bindTap('checkout.main.shop.open', { params: { shopId } })}
                className="flex w-full cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left"
              >
                <span className="h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-[var(--app-c-chip-bg)]">
                  {shop && <Img src={shop.logo} className="h-full w-full object-cover" />}
                </span>
                <span className="truncate text-[14px] font-bold text-[var(--app-text)]">{shop?.name}</span>
                <IcChevronRight size={13} className="shrink-0 text-[var(--app-c-text-muted)]" />
              </button>

              {items
                .filter((it) => it.shopId === shopId)
                .map((it) => {
                  const p = productOf(it.productId);
                  const key = it.cartItemId ?? it.productId;
                  return (
                    <div key={key} className="mt-2.5 flex gap-2.5">
                      <button
                        {...bindTap('checkout.main.detail.open', { params: { productId: it.productId } })}
                        className="h-[86px] w-[86px] shrink-0 cursor-pointer overflow-hidden rounded-lg border-none bg-[var(--app-c-chip-bg)] p-0"
                      >
                        {p && <Img src={p.image} className="h-full w-full object-contain" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          {...bindTap('checkout.main.detail.open', { params: { productId: it.productId } })}
                          className="line-clamp-2 w-full cursor-pointer border-none bg-transparent p-0 text-left text-[13px] leading-[18px] text-[var(--app-text)]"
                        >
                          {p?.title}
                        </button>
                        <span className="mt-1 inline-flex max-w-full items-center truncate rounded bg-[var(--app-c-chip-bg)] px-1.5 py-0.5 text-[11px] text-[var(--app-text-muted)]">
                          {it.skuText}
                        </span>
                        <div className="mt-1 flex items-end gap-1.5">
                          <span className="text-[16px] font-bold leading-none text-[var(--app-c-danger)]">
                            <span className="text-[11px]">¥</span>
                            {it.price}
                          </span>
                          <span className="min-w-0 flex-1" />
                          <span className="flex items-center gap-2 rounded bg-[var(--app-c-chip-bg)] px-1.5 py-0.5">
                            <button
                              {...action('checkout.main.item.qty.change', () => stepQty(key, -1), {
                                params: { itemId: key, delta: -1 },
                              })}
                              className={`cursor-pointer border-none bg-transparent p-0 ${it.qty <= 1 ? 'text-[#CCC]' : 'text-[var(--app-text)]'}`}
                            >
                              <IcMinus size={13} />
                            </button>
                            <span className="min-w-4 text-center text-[13px] text-[var(--app-text)]">{it.qty}</span>
                            <button
                              {...action('checkout.main.item.qty.change', () => stepQty(key, 1), {
                                params: { itemId: key, delta: 1 },
                              })}
                              className="cursor-pointer border-none bg-transparent p-0 text-[var(--app-text)]"
                            >
                              <IcPlus size={13} />
                            </button>
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--app-text-muted)]">
                          {p?.detailTemplate === 'fresh' ? S.noReturn7 : `${S.worryFree} · ${S.pricePlus7}`}
                        </div>
                      </div>
                    </div>
                  );
                })}

              <div className="mt-2 border-t border-[var(--app-border)] pt-2 text-[12px] text-[var(--app-text-muted)]">
                {S.shipAfterPay48}
              </div>
              <div className="mt-1 text-[12px] text-[var(--app-text-muted)]">
                <span className="text-[var(--app-primary)]">{S.returnWorryFree}</span> {S.returnWorryFreeDesc}
              </div>
            </div>
          );
        })}

        {/* 服务行:延保单选(可再点取消) */}
        {warrantyList.length > 0 && (
          <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
            <div className="flex items-center">
              <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.optionalGuard}</span>
              <span className="text-[12px] text-[var(--app-primary)]">{S.warrantyDiscount9}</span>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {warrantyList.slice(0, 3).map((w) => (
                <button
                  key={w.id}
                  {...action('checkout.main.service.warranty.select', () => pickWarranty(w), {
                    params: { warrantyId: w.id },
                  })}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left ${
                    draft.warrantyId === w.id ? 'border-[var(--app-primary)] bg-[#FFF7F0]' : 'border-[var(--app-border)] bg-[var(--app-surface)]'
                  }`}
                >
                  <Circle on={draft.warrantyId === w.id} />
                  <span>
                    <span className="block text-[12px] text-[var(--app-text)]">{w.label}</span>
                    <span className="block text-[12px] font-bold text-[var(--app-c-danger)]">¥{w.price}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 配送行 / 发票行 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3">
          <button
            {...bindTap('checkout.main.deliveryTime.open')}
            className="flex w-full cursor-pointer items-center gap-2 border-none border-b border-[var(--app-border)] bg-transparent py-3 text-left"
          >
            <span className="w-14 shrink-0 text-[14px] text-[var(--app-text-muted)]">{S.deliveryRowTitle}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-text)]">
              {S.deliveryBySuning} {fmtMdWeek(etaTs(draft.deliveryDayOffset))} {draft.deliverySlot}
            </span>
            <span className="shrink-0 rounded-sm bg-[#FFF3E8] px-1 text-[10px] leading-4 text-[var(--app-primary)]">
              {S.deliveryPromise}
            </span>
            <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
          </button>
          <button
            {...bindTap('checkout.main.invoice.open')}
            className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-3 text-left"
          >
            <span className="w-14 shrink-0 text-[14px] text-[var(--app-text-muted)]">{S.invoiceRowTitle}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-text)]">{invoiceText}</span>
            <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
          </button>
        </div>

        {/* 金额区(含国补减免行,走查 0729-2) */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5 text-[13px]">
          <AmountRows
            S={S}
            goods={goodsTotal}
            warranty={draft.warrantyPrice}
            total={total}
            subsidyOff={
              draft.subsidyChecked
                ? Math.round((goodsTotal + draft.warrantyPrice - total) * 100) / 100
                : 0
            }
            subsidyEligible={subsidyEligible}
          />
          <div className="mt-1.5 text-[11px] text-[var(--app-c-text-muted)]">{S.hiddenAssets}</div>
        </div>

        {/* 支付方式单选组 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="text-[14px] font-bold text-[var(--app-text)]">{S.payMethodTitle}</div>
          <PayRow
            label={S.payAlipay}
            on={draft.payMethod === 'alipay'}
            tag={S.govTag}
            binding={action('checkout.main.payMethod.select.alipay', () => setPayMethod('alipay'))}
          />
          <button
            {...action('checkout.main.wontfix.toast', wontfix)}
            className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-2.5 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] text-[var(--app-text)]">{S.payNewCard}</span>
              <span className="block text-[11px] text-[var(--app-c-danger)]">
                {S.payNewCardDesc}:{S.payCcb} · {S.payBoc} · {S.payOtherBank}
              </span>
            </span>
            <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
          </button>
          <PayRow
            label={S.payWechat}
            on={draft.payMethod === 'wechat'}
            binding={action('checkout.main.payMethod.select.wechat', () => setPayMethod('wechat'))}
          />
          <button
            {...action('checkout.main.wontfix.toast', wontfix)}
            className="flex w-full cursor-pointer items-center gap-1 border-none bg-transparent py-2 text-left text-[13px] text-[var(--app-text-muted)]"
          >
            {S.payMore}
            <IcChevronRight size={13} className="text-[var(--app-c-text-muted)]" />
          </button>
          <div className="border-t border-[var(--app-border)] pt-2 text-[13px] text-[var(--app-text-muted)]">{S.installmentTitle}</div>
          <div className="mt-1.5 flex gap-2">
            {[S.payHuabei, S.payAbc].map((label) => (
              <button
                key={label}
                {...action('checkout.main.wontfix.toast', wontfix)}
                className="min-w-0 flex-1 cursor-pointer rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-2 text-left text-[12px] text-[var(--app-text)]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 国补行 + 已勾选时展示减免额(走查 0729) */}
        {subsidyEligible && (
          <button
            {...action('checkout.main.subsidy.toggle', toggleSubsidy)}
            className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-xl border-none bg-[var(--app-surface)] px-3 py-3 text-left"
          >
            <span className="shrink-0 rounded-sm bg-[var(--app-primary)] px-1 text-[10px] leading-4 text-white">{S.govTag}</span>
            <span className="min-w-0 flex-1 text-[12px] text-[var(--app-text)]">
              {S.subsidyRuleCheckout}
              {draft.subsidyChecked && (
                <span className="mt-0.5 block text-[12px] font-bold text-[var(--app-c-danger)]">
                  已享国补 -¥
                  {Math.round((goodsTotal + draft.warrantyPrice - total) * 100) / 100}
                </span>
              )}
            </span>
            <Circle on={draft.subsidyChecked} />
          </button>
        )}

        <div className="py-3 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.listEnd}</div>
      </div>

      {/* 底部支付栏 */}
      <div className="flex shrink-0 items-center gap-2 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-[var(--app-text)]">
            {S.subtotal}
            <span className="text-[17px] font-bold text-[var(--app-c-danger)]">¥{total}</span>
          </div>
        </div>
        <button
          {...bindTap('checkout.main.priceDetail.open')}
          className="flex shrink-0 cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 text-[12px] text-[var(--app-text-muted)]"
        >
          {S.detailLabel}
          <IcChevronUp size={13} />
        </button>
        <button
          {...bindTap('checkout.main.pay.open', {
            // 删除自建「苏宁支付」密码页:下单后直接走系统支付网关(ACTION_PAY),成功回调再落支付成功页
            onTrigger: () => {
              const id = placeOrder();
              if (!id) return;
              const created = useSuningStore.getState().orders.find((o) => o.id === id);
              if (created) {
                const batch = orderBatchOf(useSuningStore.getState().orders, created);
                launchGatewayPay(created, () => {
                  paySuccess(id);
                  go('checkout.main.pay.open', { orderId: id });
                }, orderBatchAmount(batch));
              }
            },
          })}
          className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-6 py-2 text-[15px] font-bold text-white"
        >
          {S.payNow} ¥{total}
        </button>
      </div>

      {sheet === 'addressPicker' && <AddressPickerSheet addresses={addresses} selectedId={draft.addressId} />}
      {sheet === 'deliveryTime' && <DeliveryTimeSheet draft={draft} />}
      {sheet === 'invoice' && <InvoiceSheet draft={draft} name={address?.name ?? ''} />}
      {sheet === 'priceDetail' && (
        <Sheet title={S.priceDetailTitle} bottomInset>
          <div className="px-4 pb-4 text-[13px]">
            <AmountRows
              S={S}
              goods={goodsTotal}
              warranty={draft.warrantyPrice}
              total={total}
              subsidyOff={
                draft.subsidyChecked
                  ? Math.round((goodsTotal + draft.warrantyPrice - total) * 100) / 100
                  : 0
              }
            />
            <button
              {...action('checkout.main.wontfix.toast', () => showToast(S.toastNoCoupon))}
              className="mt-2 flex w-full cursor-pointer items-center border-none bg-transparent p-0 py-1.5 text-left text-[13px] text-[var(--app-text-muted)]"
            >
              <span className="min-w-0 flex-1">{S.couponRow}</span>
              -¥0.00
              <IcChevronRight size={13} className="text-[var(--app-c-text-muted)]" />
            </button>
            <button
              {...action('checkout.main.wontfix.toast', wontfix)}
              className="flex w-full cursor-pointer items-center border-none bg-transparent p-0 py-1.5 text-left text-[13px] text-[var(--app-text-muted)]"
            >
              <span className="min-w-0 flex-1">{S.suningCardRow}</span>
              <IcChevronRight size={13} className="text-[var(--app-c-text-muted)]" />
            </button>
          </div>
        </Sheet>
      )}
      {dialog === 'addressDelete' && <AddressDeleteDialog />}
      {dialog === 'subsidy' && <SubsidyDialog />}
    </div>
  );
}

function TopBar({ title }: { title: string }) {
  const { bindBack } = useSuningGestures();
  return (
    <div className="flex items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
      <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
        <IcNavBack size={24} />
      </button>
      <div className="flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{title}</div>
      <div className="w-8" />
    </div>
  );
}

function AmountRows({
  S, goods, warranty, total, subsidyOff = 0, subsidyEligible = false,
}: {
  S: ReturnType<typeof useStrings>;
  goods: number;
  warranty: number;
  total: number;
  subsidyOff?: number;
  subsidyEligible?: boolean;
}) {
  const rows: [string, string, string?][] = [
    [S.goodsTotal, `¥${goods}`],
    [S.shippingFeeRow, '¥0.00'],
  ];
  if (warranty > 0) rows.push([S.optionalGuard, `¥${warranty}`]);
  if (subsidyOff > 0) {
    rows.push([`${S.govTag}优惠`, `-¥${subsidyOff}`, 'sub']);
  } else if (subsidyEligible) {
    rows.push([`${S.govTag}优惠`, '未领取', 'muted']);
  }
  return (
    <>
      {rows.map(([label, value, tone]) => (
        <div key={label} className="flex py-0.5 text-[13px] text-[var(--app-text-muted)]">
          <span className="min-w-0 flex-1">{label}</span>
          <span
            className={
              tone === 'sub'
                ? 'font-semibold text-[var(--app-c-danger)]'
                : tone === 'muted'
                  ? 'text-[var(--app-c-text-muted)]'
                  : 'text-[var(--app-text)]'
            }
          >
            {value}
          </span>
        </div>
      ))}
      <div className="flex py-0.5 text-[13px]">
        <span className="min-w-0 flex-1 text-[var(--app-text-muted)]">{S.totalLabel}</span>
        <span className="text-[15px] font-bold text-[var(--app-c-danger)]">¥{total}</span>
      </div>
    </>
  );
}

function PayRow({
  label, on, tag, binding,
}: {
  label: string;
  on: boolean;
  tag?: string;
  binding: React.ComponentProps<'button'>;
}) {
  return (
    <button
      {...binding}
      className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-2.5 text-left"
    >
      <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{label}</span>
      {tag && <span className="shrink-0 rounded-sm bg-[#FFF3E8] px-1 text-[10px] leading-4 text-[var(--app-primary)]">{tag}</span>}
      <Circle on={on} />
    </button>
  );
}

/** ?sheet=addressPicker(s285):选中/删除/修改/新增 */
function AddressPickerSheet({ addresses, selectedId }: { addresses: Address[]; selectedId: string }) {
  const { bindTap, action, back } = useSuningGestures();
  const S = useStrings();
  const setCheckoutAddress = useSuningStore((s) => s.setCheckoutAddress);
  const setTemp = useSuningStore((s) => s.setTemp);
  const setAddressDraft = useSuningStore((s) => s.setAddressDraft);

  return (
    <Sheet title={S.pickAddressTitle}>
      <div className="px-3 pb-4">
        {addresses.map((a) => (
          <div
            key={a.id}
            className={`mt-2 rounded-xl px-3 py-2.5 ${a.id === selectedId ? 'bg-[#FFF7F0]' : 'bg-[var(--app-c-chip-bg)]'}`}
          >
            <button
              {...action('checkout.main.address.select', () => {
                setCheckoutAddress(a.id);
                back();
              }, { params: { addressId: a.id } })}
              className="flex w-full cursor-pointer items-start gap-2 border-none bg-transparent p-0 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1">
                  {a.tags.map((t) => (
                    <span key={t} className="rounded-sm bg-[#FFF3E8] px-1 text-[10px] leading-4 text-[var(--app-primary)]">
                      {t}
                    </span>
                  ))}
                  <span className="text-[12px] text-[var(--app-text-muted)]">
                    {a.province}
                    {a.city}
                    {a.district}
                    {a.street}
                  </span>
                </span>
                <span className="mt-0.5 block text-[14px] font-bold text-[var(--app-text)]">{a.detail}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--app-text-muted)]">
                  {a.name} {a.phone}
                </span>
              </span>
              {a.id === selectedId && <IcCheck size={16} className="shrink-0 text-[var(--app-primary)]" />}
            </button>
            <div className="mt-2 flex justify-end gap-3 border-t border-[var(--app-border)] pt-2">
              <button
                {...bindTap('checkout.main.addressDelete.open', {
                  beforeTrigger: () => setTemp({ pendingDeleteAddressId: a.id }),
                })}
                className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-[var(--app-text-muted)]"
              >
                {S.deleteBtn}
              </button>
              <button
                {...bindTap('checkout.main.addressEdit.open', {
                  params: { addressId: a.id },
                  beforeTrigger: () => {
                    setAddressDraft(null);
                    setTemp({ addressEditFromCheckout: true });
                  },
                })}
                className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-[var(--app-primary)]"
              >
                {S.modify}
              </button>
            </div>
          </div>
        ))}
        <button
          {...bindTap('checkout.main.addressAdd.open', {
            beforeTrigger: () => {
              setAddressDraft(null);
              setTemp({ addressEditFromCheckout: true });
            },
          })}
          className="mt-3 w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
        >
          {S.addAddress}
        </button>
      </div>
    </Sheet>
  );
}

/** ?dialog=addressDelete(推断确认弹窗):取消 = bindBack */
function AddressDeleteDialog() {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const pendingId = useSuningStore((s) => s._temp.pendingDeleteAddressId);
  const deleteAddress = useSuningStore((s) => s.deleteAddress);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative w-[70%] rounded-2xl bg-[var(--app-surface)] px-4 pb-2 pt-5">
        <div className="text-center text-[15px] text-[var(--app-text)]">{S.addressDeleteAsk}</div>
        <div className="mt-4 flex border-t border-[var(--app-border)]">
          <button {...bindBack()} className="flex-1 cursor-pointer border-none bg-transparent py-3 text-[15px] text-[var(--app-text-muted)]">
            {S.cancel}
          </button>
          <button
            {...action('checkout.main.address.delete.confirm', () => {
              if (pendingId) deleteAddress(pendingId);
              back();
            }, { params: { addressId: pendingId ?? '' } })}
            className="flex-1 cursor-pointer border-l border-[var(--app-border)] bg-transparent py-3 text-[15px] font-bold text-[var(--app-primary)]"
          >
            {S.deleteBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ?sheet=deliveryTime(s284):日期×时段本地暂存,「保存并使用」才落 draft,关闭×不保存 */
function DeliveryTimeSheet({ draft }: { draft: CheckoutDraft }) {
  const { action, back } = useSuningGestures();
  const S = useStrings();
  const setDeliverySlot = useSuningStore((s) => s.setDeliverySlot);
  const [day, setDay] = useState(draft.deliveryDayOffset);
  const [slot, setSlot] = useState(draft.deliverySlot);

  return (
    <Sheet title={S.deliveryRowTitle}>
      <div className="px-3 pb-4">
        <div className="py-1.5 text-[13px] text-[var(--app-text-muted)]">{S.deliveryTimeLabel}</div>
        <div className="flex gap-3">
          <div className="max-h-[240px] w-[45%] shrink-0 overflow-y-auto overflow-x-hidden">
            {DAY_OFFSETS.map((d) => (
              <button
                key={d}
                {...action('checkout.main.deliveryTime.selectDate', () => setDay(d), {
                  params: { date: fmtMdWeek(etaTs(d)) },
                })}
                className={`w-full cursor-pointer border-none py-2.5 text-left text-[13px] ${
                  day === d ? 'bg-[var(--app-surface)] font-bold text-[var(--app-primary)]' : 'bg-[var(--app-c-chip-bg)] text-[var(--app-text)]'
                }`}
              >
                {fmtCnDateWeek(etaTs(d))}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            {DELIVERY_SLOTS.map((deliverySlot) => (
              <button
                key={deliverySlot}
                {...action('checkout.main.deliveryTime.selectSlot', () => setSlot(deliverySlot), { params: { slot: deliverySlot } })}
                className={`block w-full cursor-pointer rounded-full border px-3 py-1.5 text-[13px] ${
                  slot === deliverySlot ? 'border-[var(--app-primary)] text-[var(--app-primary)]' : 'border-[var(--app-border)] text-[var(--app-text)]'
                }`}
              >
                {deliverySlot}
              </button>
            ))}
          </div>
        </div>
        <button
          {...action('checkout.main.deliveryTime.save', () => {
            setDeliverySlot(day, slot);
            back();
          })}
          className="mt-4 w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
        >
          {S.saveAndUse}
        </button>
      </div>
    </Sheet>
  );
}

/** ?sheet=invoice(推断):不开发票 / 电子普通发票,单选即关闭并回填 */
function InvoiceSheet({ draft, name }: { draft: CheckoutDraft; name: string }) {
  const { action, back } = useSuningGestures();
  const S = useStrings();
  const setInvoice = useSuningStore((s) => s.setInvoice);
  const options: { type: InvoiceType; label: string; sub?: string }[] = [
    { type: 'none', label: S.invoiceNone },
    { type: 'electronic', label: S.invoiceElectronic, sub: `${S.invoiceTitleLabel}:${name} ${S.personalLabel}` },
  ];
  return (
    <Sheet title={S.invoiceRowTitle}>
      <div className="px-3 pb-4">
        {options.map((o) => (
          <button
            key={o.type}
            {...action('checkout.main.invoice.select', () => {
              setInvoice(o.type);
              back();
            }, { params: { invoiceType: o.type } })}
            className="flex w-full cursor-pointer items-center gap-2 border-none border-b border-[var(--app-border)] bg-transparent py-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] text-[var(--app-text)]">{o.label}</span>
              {o.sub && <span className="mt-0.5 block text-[12px] text-[var(--app-text-muted)]">{o.sub}</span>}
            </span>
            <Circle on={draft.invoiceType === o.type} />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/** ?dialog=subsidy(frame:r1@44.4):取消 = bindBack 只关弹窗;去领取 = 关窗 + 自动勾国补 */
function SubsidyDialog() {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const claimSubsidy = useSuningStore((s) => s.claimSubsidy);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative w-[76%] rounded-2xl bg-[var(--app-surface)] px-4 pb-2 pt-5">
        <div className="text-center text-[16px] font-bold text-[var(--app-text)]">{S.subsidyDialogTitle}</div>
        <div className="mt-2 text-center text-[13px] leading-5 text-[var(--app-text-muted)]">{S.subsidyDialogDesc}</div>
        <div className="mt-4 flex border-t border-[var(--app-border)]">
          <button {...bindBack()} className="flex-1 cursor-pointer border-none bg-transparent py-3 text-[15px] text-[var(--app-text-muted)]">
            {S.cancel}
          </button>
          <button
            {...action('checkout.main.subsidy.claim', () => {
              claimSubsidy();
              back();
            })}
            className="flex-1 cursor-pointer border-l border-[var(--app-border)] bg-transparent py-3 text-[15px] font-bold text-[var(--app-primary)]"
          >
            {S.goClaim}
          </button>
        </div>
      </div>
    </div>
  );
}
