import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcMore, IcSearch, IcFilter, IcChevronRight, IcInbox } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { productOf, shopOf } from '../utils/detail';
import { AFTERSALE_TABS, asAftersaleTab, canAftersale, orderMatches } from '../utils/order';
import { fmtYmd } from '../utils/appTime';
import type { RuntimeOrder } from '../types';

/**
 * 售后中心(spec aftersale.main,s336 + frame:r3@25.2~38.4)。
 * 三 Tab 走 ?tab= 动态 queryParam(键不作离散 uiState 键);搜索框为本地过滤。
 */
export default function AftersalePage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = asAftersaleTab(searchParams.get('tab'));
  const [kw, setKw] = useState('');

  const orders = useSuningStore((s) => s.orders);
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);

  const titleOf = (id: string) => productOf(id)?.title ?? '';
  const match = (o: RuntimeOrder) => orderMatches(o, kw, titleOf);
  const applyList = orders.filter((o) => canAftersale(o)).filter(match);
  const recordList = orders.filter((o) => o.refund != null).filter(match);

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏 + 三 Tab 行 */}
      <div className="shrink-0 bg-[var(--app-surface)]">
        <div className="flex items-center gap-1 px-2 pb-1 pt-10">
          <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
            <IcNavBack size={24} />
          </button>
          <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{S.aftersaleTitle}</span>
          <button
            {...action('aftersale.main.wontfix.toast', wontfix)}
            className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
          >
            <IcMore size={19} />
          </button>
        </div>
        <div className="flex items-center px-2 pb-1.5">
          {AFTERSALE_TABS.map((t) => (
            <button
              key={t.key}
              {...action('aftersale.main.tab.switch', () => setSearchParams({ tab: t.key }, { replace: true }), {
                params: { tab: t.key },
              })}
              className={`relative min-w-0 flex-1 cursor-pointer border-none bg-transparent px-0 py-1 text-[13px] ${
                tab === t.key ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'
              }`}
            >
              {S[t.label]}
              {tab === t.key && (
                <span className="absolute -bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 搜索框 + 筛选icon */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-[var(--app-surface)] px-3">
            <IcSearch size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
            <input
              data-action="aftersale.main.query.filter"
              data-action-type="input"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              placeholder={tab === 'apply' ? S.aftersaleSearchApply : S.aftersaleSearchRecords}
              data-keep-keyboard="true"
              className="min-w-0 flex-1 border-none bg-transparent text-[12px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            />
          </div>
          <button
            {...action('aftersale.main.wontfix.toast', wontfix)}
            className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text-muted)]"
          >
            <IcFilter size={16} />
          </button>
        </div>

        {/* 省心购横幅 */}
        <button
          {...action('aftersale.main.wontfix.toast', wontfix)}
          className="mb-2 flex w-full cursor-pointer items-center rounded-xl border-none bg-gradient-to-r from-[#FFF3E8] to-[#FFF9F4] px-3 py-2.5 text-left"
        >
          <span className="min-w-0 flex-1 text-[12px] text-[#8A5A2B]">{S.aftersaleBanner}</span>
          <span className="flex shrink-0 items-center text-[11px] text-[var(--app-primary)]">
            {S.aftersaleBannerLink}
            <IcChevronRight size={11} />
          </span>
        </button>

        {tab === 'apply' && (
          <>
            {applyList.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
            {applyList.length === 0 && <Empty text={S.aftersaleEmptyApply} />}
          </>
        )}
        {tab === 'records' && (
          <>
            {recordList.map((o) => (
              <RecordCard key={o.id} order={o} />
            ))}
            {recordList.length === 0 && <Empty text={S.aftersaleEmptyRecords} />}
          </>
        )}
        {tab === 'services' && <Empty text={S.aftersaleEmptyServices} />}
        <div className="py-3 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.invoiceListEnd}</div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-20 text-center">
      <IcInbox size={44} className="mx-auto text-[#DDD]" />
      <div className="mt-2 text-[13px] text-[var(--app-c-text-muted)]">{text}</div>
    </div>
  );
}

/** 售后申请 Tab 的订单卡:在途售后单按钮变「退款详情」(frame:r3@31.2 两卡对照) */
function OrderCard({ order }: { order: RuntimeOrder }) {
  const { bindTap } = useSuningGestures();
  const S = useStrings();
  return (
    <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
      <CardHead order={order} />
      <GoodsRow order={order} />
      <div className="mt-2 flex justify-end">
        {order.refund ? (
          <button
            {...bindTap('aftersale.main.refundDetail.open', { params: { serviceId: order.refund.serviceNo } })}
            className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]"
          >
            {S.aftersaleRefundDetailBtn}
          </button>
        ) : (
          <button
            {...bindTap('aftersale.main.refundApply.open', { params: { orderId: order.id } })}
            className="cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-primary)]"
          >
            {S.applyRefundBtn}
          </button>
        )}
      </div>
    </div>
  );
}

/** 退换记录 Tab 的售后单卡:服务单号 + 退货服务·审核中 + 查看详情 */
function RecordCard({ order }: { order: RuntimeOrder }) {
  const { bindTap } = useSuningGestures();
  const S = useStrings();
  const refund = order.refund!;
  return (
    <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
      <CardHead order={order} />
      <GoodsRow order={order} />
      <div className="mt-2 flex items-center">
        <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--app-c-text-muted)]">
          {S.aftersaleServiceNo} {refund.serviceNo}
        </span>
        <span className="shrink-0 text-[12px] text-[var(--app-text)]">{S.aftersaleServiceType}</span>
        <span className="ml-1 shrink-0 text-[12px] font-bold text-[var(--app-primary)]">{S.refundStatusWaiting}</span>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          {...bindTap('aftersale.main.recordDetail.open', { params: { serviceId: refund.serviceNo } })}
          className="cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-primary)]"
        >
          {S.aftersaleViewDetailBtn}
        </button>
      </div>
    </div>
  );
}

function CardHead({ order }: { order: RuntimeOrder }) {
  const S = useStrings();
  const shop = shopOf(order.shopId);
  return (
    <div className="flex items-center gap-1 pb-2">
      <span className="h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-[var(--app-c-chip-bg)]">
        {shop && <Img src={shop.logo} className="h-full w-full object-cover" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--app-text-muted)]">
        {S.orderNoLabel} {order.orderNo}
      </span>
      <span className="shrink-0 text-[11px] text-[var(--app-c-text-muted)]">{fmtYmd(order.timestamps.placed)}</span>
    </div>
  );
}

function GoodsRow({ order }: { order: RuntimeOrder }) {
  const item = order.items[0];
  const p = item ? productOf(item.productId) : null;
  return (
    <div className="flex gap-2.5">
      <span className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
        {p && <Img src={p.image} className="h-full w-full object-contain" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-[13px] leading-[18px] text-[var(--app-text)]">{p?.title}</span>
        <span className="mt-1 block truncate text-[11px] text-[var(--app-c-text-muted)]">{item?.skuText}</span>
      </span>
      <span className="shrink-0 text-right text-[11px] text-[var(--app-c-text-muted)]">x{item?.qty}</span>
    </div>
  );
}
