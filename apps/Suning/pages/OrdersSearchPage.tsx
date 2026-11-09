import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcClose, IcSearch, IcTruck, IcChevronRight } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { productOf, shopOf } from '../utils/detail';
import { STATUS_LABEL, orderMatches, orderQty } from '../utils/order';
import { fmtMdHm } from '../utils/appTime';
import type { RuntimeOrder } from '../types';

const IN_TRANSIT = ['awaitShip', 'supplierShip', 'shipping'];

/**
 * 订单搜索(spec orders.search,s334 入口态 / s335 结果态)。
 * 关键词落 ?keyword= (spec v1.6.0),三态由 keyword 有无与命中数派生;结果卡结构同 orders.list。
 */
export default function OrdersSearchPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';
  const [draft, setDraft] = useState(keyword);

  const orders = useSuningStore((s) => s.orders);
  const showToast = useSuningStore((s) => s.showToast);
  const recordTaskAudit = useSuningStore((s) => s.recordTaskAudit);
  const wontfix = () => showToast(S.toastNotOpen);

  const titleOf = (id: string) => productOf(id)?.title ?? '';
  const submit = () => {
    const kw = draft.trim();
    recordTaskAudit({ orderSearch: kw });
    setSearchParams(kw ? { keyword: kw } : {}, { replace: true });
  };
  const clear = () => {
    setDraft('');
    setSearchParams({}, { replace: true });
  };

  const list = keyword ? orders.filter((o) => orderMatches(o, keyword, titleOf)) : [];
  /** 常购商品横条:订单里出现过的商品去重前 4 条(与 orders.list 顶部横条共用数据) */
  const frequent = [...new Set(orders.flatMap((o) => o.items.map((it) => it.productId)))]
    .map((id) => productOf(id))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .slice(0, 4);

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 / 搜索框(关键词+清除×)/ 搜索 */}
      <div className="flex items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-[var(--app-c-chip-bg)] px-3">
          <IcSearch size={15} className="shrink-0 text-[var(--app-c-text-muted)]" />
          <input
            data-action="orders.search.query.submit"
            data-action-type="input"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder={S.ordersSearchPlaceholder}
            data-keep-keyboard="true"
            className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
          />
          {draft.length > 0 && (
            <button
              {...action('orders.search.query.clear', clear)}
              className="shrink-0 cursor-pointer rounded-full border-none bg-[#CCC] p-0.5 text-white"
            >
              <IcClose size={11} />
            </button>
          )}
        </div>
        <button
          {...action('orders.search.query.submit', submit)}
          className="shrink-0 cursor-pointer border-none bg-transparent px-1.5 text-[14px] font-bold text-[var(--app-primary)]"
        >
          {S.search}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 我的常购横条 + 常购清单侧条 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="pb-1.5 text-[13px] font-bold text-[var(--app-text)]">{S.frequentBuyTitle}</div>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {frequent.map((p) => (
                <button
                  key={p.id}
                  {...bindTap('orders.search.product.open', { params: { productId: p.id } })}
                  className="w-12 shrink-0 cursor-pointer border-none bg-transparent p-0"
                >
                  <span className="block h-12 w-12 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                    <Img src={p.image} className="h-full w-full object-contain" />
                  </span>
                  <span className="mt-0.5 block text-center text-[10px] text-[var(--app-c-danger)]">¥{p.price}</span>
                </button>
              ))}
            </div>
            <button
              {...action('orders.search.wontfix.toast', wontfix)}
              className="flex w-6 shrink-0 cursor-pointer flex-col items-center border-none bg-transparent p-0 text-[10px] leading-3 text-[var(--app-text-muted)]"
            >
              {S.frequentList}
            </button>
          </div>
        </div>

        {keyword.length > 0 && list.length > 0 && (
          <div className="pb-1 pl-1 text-[12px] text-[var(--app-text-muted)]">
            {S.ordersSearchHitPrefix}
            <span className="px-0.5 font-bold text-[var(--app-primary)]">{list.length}</span>
            {S.ordersSearchHitSuffix}
          </div>
        )}
        {list.map((o) => (
          <ResultCard key={o.id} order={o} />
        ))}
        {keyword.length > 0 && list.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-[14px] text-[var(--app-text-muted)]">{S.ordersSearchEmpty}</div>
            <div className="mt-1 text-[12px] text-[var(--app-c-text-muted)]">{S.ordersSearchEmptyHint}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 结果订单卡(结构同 orders.list,按钮组挂 orders.search.* transition) */
function ResultCard({ order }: { order: RuntimeOrder }) {
  const { bindTap } = useSuningGestures();
  const S = useStrings();
  const shop = shopOf(order.shopId);
  const latest = order.logistics[0];
  const firstProductId = order.items[0]?.productId ?? '';
  const inTransit = IN_TRANSIT.includes(order.status);
  const btn = 'cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]';

  return (
    <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
      <div className="flex items-center gap-1">
        <span className="h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-[var(--app-c-chip-bg)]">
          {shop && <Img src={shop.logo} className="h-full w-full object-cover" />}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[var(--app-text)]">{shop?.name}</span>
        <span className="shrink-0 text-[13px] font-bold text-[var(--app-primary)]">{S[STATUS_LABEL[order.status]]}</span>
      </div>
      <div className="mt-1 text-[11px] text-[var(--app-c-text-muted)]">
        {S.orderNoLabel} {order.orderNo}
      </div>

      {latest && (
        <button
          {...bindTap('orders.search.logistics.open', { params: { orderId: order.id } })}
          className="mt-2 flex w-full cursor-pointer items-center gap-1 rounded border-none bg-[#F4F8FF] px-2 py-1.5 text-left"
        >
          <IcTruck size={13} className="shrink-0 text-[#2B6BD4]" />
          <span className="min-w-0 flex-1 truncate text-[11px] text-[#2B6BD4]">{latest.desc}</span>
          <span className="shrink-0 text-[10px] text-[#8FA9CF]">{fmtMdHm(latest.ts)}</span>
        </button>
      )}

      <button
        {...bindTap('orders.search.detail.open', { params: { orderId: order.id } })}
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
        <button {...bindTap('orders.search.rebuy.detail', { params: { productId: firstProductId } })} className={btn}>
          {S.rebuyBtn}
        </button>
        {inTransit && !order.refund && (
          <button {...bindTap('orders.search.refundApply.open', { params: { orderId: order.id } })} className={btn}>
            {S.applyRefundBtn}
          </button>
        )}
        {(inTransit || order.status === 'pendingPay') && (
          <button {...bindTap('orders.search.modify.open', { params: { orderId: order.id } })} className={btn}>
            {S.modifyOrderBtn}
          </button>
        )}
        {latest && (
          <button
            {...bindTap('orders.search.logistics.open', { params: { orderId: order.id } })}
            className="flex cursor-pointer items-center gap-0.5 rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-primary)]"
          >
            {S.viewLogisticsBtn}
            <IcChevronRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
