import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcMore, IcChevronRight, IcCopy, IcCheck } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';
import { isSupplierOrder } from '../utils/order';
import { ClipboardService } from '@/os/ClipboardService';
import { fmtFull } from '../utils/appTime';

/**
 * 退款详情(spec refund.detail,frame:r3@38.4/39.6/45.6)。
 * ?serviceId= 定位退款单(spec v1.6.0 路由改写);?dialog=cancelConfirm URL 驱动。
 * mock 固定停留「等待审核」第 1 步,不模拟审核推进。
 */
export default function RefundDetailPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId') ?? '';
  const dialogOpen = searchParams.get('dialog') === 'cancelConfirm';

  const orders = useSuningStore((s) => s.orders);
  const showToast = useSuningStore((s) => s.showToast);

  const order = orders.find((o) => o.refund?.serviceNo === serviceId) ?? null;
  const refund = order?.refund ?? null;
  const wontfix = () => showToast(S.toastNotOpen);

  const topBar = (
    <div className="flex shrink-0 items-center gap-1 px-2 pb-2 pt-10">
      <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-white">
        <IcNavBack size={24} />
      </button>
      <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-white">{S.refundDetailTitle}</span>
      <button
        {...action('refund.detail.wontfix.toast', wontfix)}
        className="cursor-pointer border-none bg-transparent p-1 text-white"
      >
        <IcMore size={19} />
      </button>
    </div>
  );

  if (!order || !refund) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-bg)]" data-status-bar-foreground="light">
        <div className="bg-gradient-to-b from-[#FE790C] to-[#FFB74D]">{topBar}</div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="py-24 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.refundNotFound}</div>
        </div>
      </div>
    );
  }

  const steps = [S.refundStep1, S.refundStep2, S.refundStep3, S.refundStep4];
  const item = order.items[0];
  const product = item ? productOf(item.productId) : null;

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]" data-status-bar-foreground="light">
      {/* 橙渐变进度头:状态 + 四步进度条(固定停第 1 步) */}
      <div className="shrink-0 bg-gradient-to-b from-[#FE790C] to-[#FFB74D] pb-6">
        {topBar}
        <div className="px-4 pt-1 text-[19px] font-bold text-white">{S.refundStatusWaiting}</div>
        <div className="mt-4 flex px-4">
          {steps.map((label, i) => (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span className={`h-[2px] min-w-0 flex-1 ${i === 0 ? 'bg-transparent' : 'bg-white/40'}`} />
                <span
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                    i <= refund.currentStep ? 'bg-[var(--app-surface)] text-[var(--app-primary)]' : 'bg-white/40 text-transparent'
                  }`}
                >
                  <IcCheck size={9} strokeWidth={4} />
                </span>
                <span className={`h-[2px] min-w-0 flex-1 ${i === steps.length - 1 ? 'bg-transparent' : 'bg-white/40'}`} />
              </div>
              <span
                className={`mt-1 truncate text-[10px] ${i <= refund.currentStep ? 'font-bold text-white' : 'text-white/70'}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="-mt-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5" data-scroll-container="main" data-scroll-direction="vertical">
        {isSupplierOrder(order) && (
          <div className="mb-2 rounded-lg bg-[#FFF3E8] px-3 py-2 text-[11px] leading-4 text-[var(--app-primary)]">
            {S.refundSupplierTip}
          </div>
        )}

        {/* 说明卡 + 催审核 / 取消申请 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-3">
          <button
            {...action('refund.detail.wontfix.toast', wontfix)}
            className="flex w-full cursor-pointer items-start border-none bg-transparent p-0 text-left"
          >
            <span className="min-w-0 flex-1 text-[13px] leading-5 text-[var(--app-text)]">{S.refundWaitingDesc}</span>
            <IcChevronRight size={14} className="mt-0.5 shrink-0 text-[var(--app-c-text-muted)]" />
          </button>
          <div className="mt-1 text-[11px] text-[var(--app-c-text-muted)]">
            {S.refundAppliedAt} {fmtFull(refund.appliedAtTs)}
          </div>
          <ul className="mt-2 list-none p-0 text-[11px] leading-5 text-[var(--app-text-muted)]">
            <li>· {S.refundBullet1}</li>
            <li>· {S.refundBullet2}</li>
          </ul>
          <div className="mt-3 flex justify-end gap-2">
            <button
              {...action('refund.detail.wontfix.toast', () => showToast(S.toastRefundUrged))}
              className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-1.5 text-[12px] text-[var(--app-text)]"
            >
              {S.refundUrgeBtn}
            </button>
            <button
              {...bindTap('refund.detail.cancelConfirm.open')}
              className="cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-4 py-1.5 text-[12px] text-[var(--app-primary)]"
            >
              {S.refundCancelBtn}
            </button>
          </div>
        </div>

        {/* 退货信息卡 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="pb-2 text-[14px] font-bold text-[var(--app-text)]">{S.refundGoodsInfo}</div>
          <div className="flex gap-2.5">
            <span className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
              {product && <Img src={product.image} className="h-full w-full object-contain" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-[13px] leading-[18px] text-[var(--app-text)]">{product?.title}</span>
              <span className="mt-1 block truncate text-[11px] text-[var(--app-c-text-muted)]">{item?.skuText}</span>
            </span>
          </div>
          <div className="mt-2 text-[13px]">
            <div className="flex items-center py-0.5">
              <span className="min-w-0 flex-1 text-[var(--app-text-muted)]">{S.refundOrderNoRow}</span>
              <span className="text-[var(--app-text)]">{order.orderNo}</span>
              <button
                {...action('refund.detail.orderNo.copy', () => {
                  ClipboardService.copyText(order.orderNo, 'suning');
                  showToast(S.toastCopied);
                })}
                className="ml-2 flex cursor-pointer items-center gap-0.5 rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 text-[11px] text-[var(--app-text-muted)]"
              >
                <IcCopy size={11} />
                {S.copyBtn}
              </button>
            </div>
            <Row label={S.aftersaleServiceNo} value={refund.serviceNo} />
            <Row label={S.refundQtyApplied} value={`x${refund.qty}`} />
            <Row label={S.refundAmountApplied} value={`¥${refund.amount}`} />
            <Row label={S.refundAppliedAt} value={fmtFull(refund.appliedAtTs)} />
            <Row label={S.refundReasonApplied} value={refund.reason} />
            {refund.note && <Row label={S.refundNoteRow} value={refund.note} />}
          </div>
        </div>

        {/* 底部常见问题条 */}
        <button
          {...action('refund.detail.wontfix.toast', wontfix)}
          className="mb-4 flex w-full cursor-pointer items-center rounded-xl border-none bg-[var(--app-surface)] px-3 py-3 text-left"
        >
          <span className="min-w-0 flex-1 text-[13px] text-[var(--app-text)]">{S.refundFaq}</span>
          <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
        </button>
      </div>

      {dialogOpen && <CancelRefundDialog orderId={order.id} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-0.5">
      <span className="min-w-0 flex-1 text-[var(--app-text-muted)]">{label}</span>
      <span className="max-w-[60%] truncate text-[var(--app-text)]">{value}</span>
    </div>
  );
}

/** ?dialog=cancelConfirm(qa:Q11=A):取消 = bindBack;确认后撤销退款单并退出本页回售后中心 */
function CancelRefundDialog({ orderId }: { orderId: string }) {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const cancelRefund = useSuningStore((s) => s.cancelRefund);
  const showToast = useSuningStore((s) => s.showToast);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative w-[70%] rounded-2xl bg-[var(--app-surface)] px-4 pb-2 pt-5">
        <div className="text-center text-[15px] text-[var(--app-text)]">{S.refundCancelAsk}</div>
        <div className="mt-4 flex border-t border-[var(--app-border)]">
          <button {...bindBack()} className="flex-1 cursor-pointer border-none bg-transparent py-3 text-[15px] text-[var(--app-text-muted)]">
            {S.cancel}
          </button>
          <button
            {...action('refund.detail.cancelConfirm.submit', () => {
              cancelRefund(orderId);
              // 关弹窗 + 退出退款详情,回售后中心
              back(2);
              showToast(S.toastRefundCancelled);
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
