import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import {
  IcNavBack, IcMore, IcSearch, IcInvoice, IcChevronDown, IcChevronUp,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { productOf, shopOf } from '../utils/detail';
import { orderMatches } from '../utils/order';
import { fmtYmd } from '../utils/appTime';
import type { RuntimeOrder } from '../types';

/**
 * 我的发票(spec invoice.list,s337)。
 * 提示卡展开态落 ?tip=collapsed|expanded(spec v1.6.0,离散 UI 态一律 URL 驱动)。
 * 发票卡由订单的 invoice 字段派生(不开发票/电子普通发票两种,对齐 a350/a351)。
 */
export default function InvoicePage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const expanded = searchParams.get('tip') === 'expanded';
  const [kw, setKw] = useState('');

  const orders = useSuningStore((s) => s.orders);
  const showToast = useSuningStore((s) => s.showToast);
  const recordTaskAudit = useSuningStore((s) => s.recordTaskAudit);
  const wontfix = () => showToast(S.toastNotOpen);

  const titleOf = (id: string) => productOf(id)?.title ?? '';
  const list = orders
    .filter((o) => o.invoice != null)
    .filter((o) => orderMatches(o, kw, titleOf));

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      <div className="shrink-0 bg-[var(--app-surface)]">
        <div className="flex items-center gap-1 px-2 pb-2 pt-10">
          <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
            <IcNavBack size={24} />
          </button>
          <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{S.invoiceTitle}</span>
          <button
            {...action('invoice.list.wontfix.toast', wontfix)}
            className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
          >
            <IcMore size={19} />
          </button>
        </div>
        <div className="px-2.5 pb-2">
          <div className="flex h-8 items-center gap-1.5 rounded-full bg-[var(--app-c-chip-bg)] px-3">
            <IcSearch size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
            <input
              data-action="invoice.list.query.filter"
              data-action-type="input"
              value={kw}
              onChange={(e) => { setKw(e.target.value); recordTaskAudit({ invoiceSearch: e.target.value }); }}
              placeholder={S.ordersSearchPlaceholder}
              data-keep-keyboard="true"
              className="min-w-0 flex-1 border-none bg-transparent text-[12px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 温馨提示卡:收起/展开 */}
        <div className="mb-2 rounded-xl bg-[#FFFBF5] px-3 py-2.5">
          <div className="flex items-center gap-1 pb-1">
            <IcInvoice size={13} className="shrink-0 text-[var(--app-primary)]" />
            <span className="text-[12px] font-bold text-[#8A5A2B]">{S.invoiceTipTitle}</span>
          </div>
          <div className={`text-[11px] leading-[18px] text-[#8A5A2B] ${expanded ? '' : 'line-clamp-2'}`}>
            {S.invoiceTipShort}
            {expanded ? ` ${S.invoiceTipMore}` : ''}
          </div>
          <button
            {...action('invoice.list.tip.toggle', () =>
              setSearchParams(expanded ? {} : { tip: 'expanded' }, { replace: true }),
            )}
            className="mt-1 flex cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 text-[11px] text-[var(--app-primary)]"
          >
            {expanded ? S.invoiceCollapse : S.invoiceExpand}
            {expanded ? <IcChevronUp size={12} /> : <IcChevronDown size={12} />}
          </button>
        </div>

        {list.map((o) => (
          <InvoiceCard key={o.id} order={o} />
        ))}
        {list.length === 0 && <div className="py-20 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.invoiceEmpty}</div>}
        <div className="py-3 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.invoiceListEnd}</div>
      </div>
    </div>
  );
}

/** 发票卡:店铺名 / 发票类型 / 发票状态 / 下单时间 / 商品行 / 联系客服 + 补开发票 */
function InvoiceCard({ order }: { order: RuntimeOrder }) {
  const { bindTap, action } = useSuningGestures();
  const S = useStrings();
  const showToast = useSuningStore((s) => s.showToast);
  const shop = shopOf(order.shopId);
  const item = order.items[0];
  const p = item ? productOf(item.productId) : null;
  const invoice = order.invoice;

  return (
    <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
      <div className="flex items-center gap-1 border-b border-[var(--app-border)] pb-2">
        <span className="h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-[var(--app-c-chip-bg)]">
          {shop && <Img src={shop.logo} className="h-full w-full object-cover" />}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[var(--app-text)]">{shop?.name}</span>
      </div>
      <div className="py-2 text-[12px]">
        <Row label={S.invoiceTypeLabel} value={invoice?.type ?? S.invoiceNone} />
        <Row label={S.invoiceStatusLabel} value={invoice?.status ?? ''} />
        {invoice?.title && <Row label={S.invoiceTitleLabel} value={invoice.title} />}
        <Row label={S.invoiceOrderTimeLabel} value={fmtYmd(order.timestamps.placed)} />
      </div>
      <div className="flex gap-2.5 border-t border-[var(--app-border)] pt-2">
        <span className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
          {p && <Img src={p.image} className="h-full w-full object-contain" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[12px] leading-4 text-[var(--app-text)]">{p?.title}</span>
        </span>
        <span className="shrink-0 text-right text-[12px] text-[var(--app-text)]">
          ¥{item?.price}
          <span className="block text-[11px] text-[var(--app-c-text-muted)]">x{item?.qty}</span>
        </span>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          {...bindTap('invoice.list.chat.open', { params: { shopId: order.shopId } })}
          className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]"
        >
          {S.contactService}
        </button>
        <button
          {...action('invoice.list.wontfix.toast', () => showToast(S.toastNotOpen))}
          className="cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-primary)]"
        >
          {S.invoiceReissueBtn}
        </button>
      </div>
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
