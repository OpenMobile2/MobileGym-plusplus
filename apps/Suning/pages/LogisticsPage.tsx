import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import {
  IcNavBack, IcMore, IcHelp, IcService, IcCopy, IcChevronRight, IcClose, IcBell, IcPlus,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';
import { addressLine, orderAddressOf } from '../utils/order';
import { fmtMdHm, fmtYmd } from '../utils/appTime';
import { ClipboardService } from '@/os/ClipboardService';
import type { RuntimeOrder } from '../types';

/** 状态卡文案:待发货=发货准备中 / 待供应商发货=供应商已接单 / 运输中 / 已签收(s333 + frame:r3@6.0) */
function statusKey(o: RuntimeOrder) {
  if (o.status === 'supplierShip') return 'logisticsSupplierAccepted' as const;
  if (o.status === 'shipping') return 'logisticsInTransit' as const;
  if (o.status === 'completed') return 'logisticsSigned' as const;
  return 'logisticsPreparing' as const;
}

/**
 * 物流信息(spec logistics.detail,s333 preparing / frame:r3@6.0 supplierAccepted)。
 * ?orderId= 定位订单(spec v1.6.0 路由改写);时间轴取订单种子数据,时间经 TimeService 相对生成。
 */
export default function LogisticsPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';

  const orders = useSuningStore((s) => s.orders);
  const addresses = useSuningStore((s) => s.addresses);
  const notifyClosed = useSuningStore((s) => s._temp.logisticsNotifyClosed);
  const showToast = useSuningStore((s) => s.showToast);
  const setTemp = useSuningStore((s) => s.setTemp);

  const order = orders.find((o) => o.id === orderId) ?? null;
  const wontfix = () => showToast(S.toastNotOpen);

  const topBar = (
    <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
      <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
        <IcNavBack size={24} />
      </button>
      <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{S.logisticsTitle}</span>
      <button
        {...action('logistics.detail.wontfix.toast', wontfix)}
        className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
      >
        <IcHelp size={18} />
      </button>
      <button
        {...action('logistics.detail.wontfix.toast', wontfix)}
        className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
      >
        <IcMore size={19} />
      </button>
    </div>
  );

  if (!order) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-bg)]">
        {topBar}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="py-24 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.orderNotFound}</div>
        </div>
      </div>
    );
  }

  const item = order.items[0];
  const product = item ? productOf(item.productId) : null;
  const address = orderAddressOf(order, addresses);
  // 快递单号(由订单号稳定派生,展示 + 复制共用同一值)
  const trackingNo = `YT${String(Math.abs(order.orderNo.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 1e13).padStart(13, '0')}`;
  const picks = SUNING_CONFIG.products
    .filter((p) => !order.items.some((it) => it.productId === p.id))
    .slice(0, 4);
  const etaText = order.etaTs != null ? ` ${S.etaPrefix}${fmtYmd(order.etaTs)}${S.etaSuffix}` : '';

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      {topBar}

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 状态卡:状态橙字 + 商品缩略图 + 在线客服 + 运单(走查 0729 / added_2) */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-3">
          <div className="flex items-center gap-2.5">
            <button
              {...bindTap('logistics.detail.product.open', { params: { productId: item?.productId ?? '' } })}
              className="h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border-none bg-[var(--app-c-chip-bg)] p-0"
            >
              {product && <Img src={product.image} className="h-full w-full object-contain" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-[var(--app-primary)]">{S[statusKey(order)]}</div>
              {order.etaTs != null && (
                <div className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">
                  {S.etaPrefix}
                  {fmtYmd(order.etaTs)}
                  {S.etaSuffix}
                </div>
              )}
            </div>
            <button
              {...bindTap('logistics.detail.chat.open', { params: { shopId: order.shopId } })}
              className="flex shrink-0 cursor-pointer flex-col items-center border-none bg-transparent p-0 text-[10px] text-[var(--app-text-muted)]"
            >
              <IcService size={17} className="text-[var(--app-text)]" />
              {S.logisticsOnlineService}
            </button>
            <button
              {...action('logistics.detail.wontfix.toast', wontfix)}
              className="flex shrink-0 cursor-pointer flex-col items-center border-none bg-transparent p-0 text-[10px] text-[var(--app-text-muted)]"
            >
              <IcCopy size={17} className="text-[var(--app-text)]" />
              物流电话
            </button>
          </div>
          {(order.status === 'shipping' || order.status === 'completed') && (
            <div className="mt-2 flex items-center gap-1 border-t border-[var(--app-border)] pt-2 text-[12px] text-[var(--app-text-muted)]">
              <span>圆通速递</span>
              <span className="text-[var(--app-text)]">{trackingNo}</span>
              <button
                {...action('logistics.detail.address.copy', () => {
                  ClipboardService.copyText(trackingNo, 'suning');
                  showToast(S.toastCopied);
                })}
                className="ml-1 cursor-pointer border-none bg-transparent p-0 text-[#2B6BD4]"
              >
                <IcCopy size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 物流卡:收货地址 + 复制 + 时间轴 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-3">
          {address && (
            <div className="flex items-start gap-1 border-b border-[var(--app-border)] pb-2.5">
              <span className="min-w-0 flex-1 text-[12px] leading-5 text-[var(--app-text)]">
                <span className="text-[var(--app-primary)]">{S.logisticsAddressLabel}</span> {address.name} {address.phone}
                <br />
                {addressLine(address)}
              </span>
              <button
                {...action('logistics.detail.address.copy', () => {
                  ClipboardService.copyText(`${address.name} ${address.phone} ${addressLine(address)}`, 'suning');
                  showToast(S.toastCopied);
                })}
                className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-c-text-muted)]"
              >
                <IcCopy size={14} />
              </button>
            </div>
          )}

          {order.logistics.length === 0 ? (
            <div className="py-6 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.logisticsEmpty}</div>
          ) : (
            <div className="pt-3">
              {order.logistics.map((n, i) => (
                <div key={`${n.ts}-${n.title}`} className="flex gap-2.5">
                  <div className="flex w-3 shrink-0 flex-col items-center">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${i === 0 ? 'bg-[var(--app-primary)]' : 'bg-[#DDD]'}`} />
                    {i < order.logistics.length - 1 && <span className="w-px flex-1 bg-[#EEE]" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-4">
                    <div className={`text-[13px] ${i === 0 ? 'font-bold text-[var(--app-text)]' : 'text-[var(--app-text-muted)]'}`}>
                      {n.title}
                    </div>
                    <div className="mt-0.5 text-[12px] leading-4 text-[var(--app-text-muted)]">
                      {n.desc}
                      {i === 0 ? etaText : ''}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--app-c-text-muted)]">{fmtMdHm(n.ts)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 精选好物双列(与 order.detail 同款) */}
        <div className={notifyClosed ? 'pb-4' : 'pb-16'}>
          <div className="py-2 text-center text-[14px] font-bold text-[var(--app-text)]">{S.pickGoods}</div>
          <div className="grid grid-cols-2 gap-2">
            {picks.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl bg-[var(--app-surface)]">
                <button
                  {...bindTap('logistics.detail.product.open', { params: { productId: p.id } })}
                  className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
                >
                  <span className="block aspect-square w-full bg-[var(--app-c-chip-bg)]">
                    <Img src={p.image} className="h-full w-full object-contain" />
                  </span>
                  <span className="block px-2 pt-2">
                    <span className="line-clamp-2 block text-[12px] leading-4 text-[var(--app-text)]">{p.title}</span>
                  </span>
                </button>
                <div className="flex items-center px-2 pb-2 pt-1">
                  <span className="min-w-0 flex-1 text-[15px] font-bold text-[var(--app-c-danger)]">
                    <span className="text-[10px]">¥</span>
                    {p.price}
                  </span>
                  <button
                    {...bindTap('logistics.detail.skuAdd.open', {
                      params: { productId: p.id },
                      beforeTrigger: () => setTemp({ skuEntryHint: 'add' }),
                    })}
                    className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] p-1 text-white"
                  >
                    <IcPlus size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部开启通知条(可关,本次会话内不再出现) */}
      {!notifyClosed && (
        <div className="absolute inset-x-2.5 bottom-2 z-30 flex items-center gap-2 rounded-xl bg-[#3A3A3A]/95 px-3 py-2.5">
          <IcBell size={15} className="shrink-0 text-[#FFC107]" />
          <span className="min-w-0 flex-1 text-[11px] leading-4 text-white">{S.logisticsNotifyText}</span>
          <button
            {...action('logistics.detail.wontfix.toast', wontfix)}
            className="flex shrink-0 cursor-pointer items-center rounded-full border-none bg-[var(--app-primary)] px-2.5 py-1 text-[11px] text-white"
          >
            {S.logisticsNotifyBtn}
            <IcChevronRight size={11} />
          </button>
          <button
            {...action('logistics.detail.notifyBar.close', () => setTemp({ logisticsNotifyClosed: true }))}
            className="shrink-0 cursor-pointer border-none bg-transparent p-0.5 text-white/60"
          >
            <IcClose size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
