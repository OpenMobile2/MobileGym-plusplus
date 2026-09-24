import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcMore, IcChevronRight, IcClose, IcCheck, IcInfo, IcImagePlus } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';
import { REFUND_REASONS_STORE, REFUND_REASONS_SUPPLIER, isSupplierOrder, orderQty } from '../utils/order';
import { pickImages } from '@/os/albumBridge';
import { getFileUriAsync } from '@/os/FileSystemService';

const NOTE_MAX = 60;

/**
 * 申请退款(spec refund.apply,s331/s332 + frame:r3@10.8~25.2)。
 * ?orderId= 定位订单(spec v1.6.0);?sheet=reason 原因弹层 URL 驱动,进页面自动弹一次。
 * 提交走 refund.apply.submit.toOrders:回订单列表,并 popTo 折叠掉支付成功/订单详情/退款表单
 * 这几个"已完成流程节点"(走查 0813 反馈④:返回不再回到待发货→支付成功页)。
 */
export default function RefundApplyPage() {
  const { bindTap, action, bindBack, go } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const sheetOpen = searchParams.get('sheet') === 'reason';

  const orders = useSuningStore((s) => s.orders);
  const refundDraft = useSuningStore((s) => s._temp.refundDraft);
  const setTemp = useSuningStore((s) => s.setTemp);
  const showToast = useSuningStore((s) => s.showToast);
  const applyRefund = useSuningStore((s) => s.applyRefund);
  const [proofs, setProofs] = useState<string[]>([]);

  const order = orders.find((o) => o.id === orderId) ?? null;
  const wontfix = () => showToast(S.toastNotOpen);

  // 上传凭证:走系统相册标准选图接口(albumBridge.pickImages),相册图 uri 为空时异步取 Blob URL
  const pickProof = () => {
    void pickImages({ multiple: true, maxSelect: 9 - proofs.length }).then(async (r) => {
      if (r.cancelled || !r.selected.length) return;
      const uris = await Promise.all(
        r.selected.map(async (x) => x.uri || (await getFileUriAsync(x.path).catch(() => null)) || ''),
      );
      setProofs((prev) => [...prev, ...uris.filter(Boolean)].slice(0, 9));
    });
  };

  /* 进页面清草稿 + 自动弹一次原因弹层(frame:r3@10.8);StrictMode 双调用用 ref 守卫 */
  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current || !order) return;
    autoRef.current = true;
    setTemp({ refundDraft: { reason: '', note: '' } });
    if (!sheetOpen) go('refund.apply.reason.open');
  }, [order, sheetOpen, go, setTemp]);

  if (!order) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-bg)]">
        <div className="flex items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
          <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
            <IcNavBack size={24} />
          </button>
          <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{S.refundApplyTitle}</span>
          <button
            {...action('refund.apply.wontfix.toast', wontfix)}
            className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
          >
            <IcMore size={19} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="py-24 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.orderNotFound}</div>
        </div>
      </div>
    );
  }

  const reason = refundDraft.reason;
  const note = refundDraft.note;
  const item = order.items[0];
  const product = item ? productOf(item.productId) : null;

  const submit = () => {
    applyRefund(order.id, reason, note);
    showToast(S.toastRefundSubmitted);
  };

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{S.refundApplyTitle}</span>
        <button
          {...action('refund.apply.wontfix.toast', wontfix)}
          className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcMore size={19} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {isSupplierOrder(order) && (
          <div className="mb-2 rounded-lg bg-[#FFF3E8] px-3 py-2 text-[11px] leading-4 text-[var(--app-primary)]">
            {S.refundSupplierTip}
          </div>
        )}

        {/* 商品卡 */}
        <div className="mb-2 flex gap-2.5 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <span className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
            {product && <Img src={product.image} className="h-full w-full object-contain" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 block text-[13px] leading-[18px] text-[var(--app-text)]">{product?.title}</span>
            <span className="mt-1 block truncate text-[11px] text-[var(--app-c-text-muted)]">{item?.skuText}</span>
            <span className="mt-1 block text-[11px] text-[var(--app-text-muted)]">
              {S.refundQtyRow} x{orderQty(order)}
            </span>
          </span>
        </div>

        {/* 退款金额 / 退款原因 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3">
          <div className="flex items-center border-b border-[var(--app-border)] py-3">
            <span className="min-w-0 flex-1 text-[13px] text-[var(--app-text)]">{S.refundAmountRow}</span>
            <span className="text-[15px] font-bold text-[var(--app-c-danger)]">¥{order.amount}</span>
            {/* ⓘ 的 toast 文案与「暂未开放」不同,但生成器把节点内所有 effect=toast 并成一个 action */}
            <button
              {...action('refund.apply.wontfix.toast', () => showToast(S.refundAmountHint))}
              className="ml-1 cursor-pointer border-none bg-transparent p-0 text-[var(--app-c-text-muted)]"
            >
              <IcInfo size={13} />
            </button>
          </div>
          <button
            {...bindTap('refund.apply.reason.open')}
            className="flex w-full cursor-pointer items-center border-none bg-transparent px-0 py-3 text-left"
          >
            <span className="min-w-0 flex-1 text-[13px] text-[var(--app-text)]">{S.refundReasonRow}</span>
            <span className={`truncate text-[13px] ${reason ? 'text-[var(--app-text)]' : 'text-[var(--app-c-text-muted)]'}`}>
              {reason || S.refundReasonPick}
            </span>
            <IcChevronRight size={13} className="ml-0.5 shrink-0 text-[var(--app-c-text-muted)]" />
          </button>
        </div>

        {/* 退款说明 + 上传凭证 */}
        <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-3">
          <div className="text-[13px] text-[var(--app-text)]">{S.refundNoteRow}</div>
          <textarea
            data-action="refund.apply.note.input"
            data-action-type="input"
            value={note}
            rows={3}
            onChange={(e) => setTemp({ refundDraft: { reason, note: e.target.value.slice(0, NOTE_MAX) } })}
            placeholder={S.refundNotePlaceholder}
            data-keep-keyboard="true"
            className="mt-2 w-full resize-none rounded-lg border-none bg-[var(--app-c-chip-bg)] p-2 text-[13px] leading-5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
          />
          <div className="text-right text-[11px] text-[var(--app-c-text-muted)]">
            {note.length}/{NOTE_MAX}
          </div>
          <div className="mt-2 flex items-center">
            <span className="min-w-0 flex-1 text-[13px] text-[var(--app-text)]">{S.refundUploadRow}</span>
            <span className="text-[11px] text-[var(--app-c-text-muted)]">{S.refundUploadHint}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {proofs.map((uri) => (
              <span key={uri} className="h-[68px] w-[68px] overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                <img src={uri} alt="" className="h-full w-full object-cover" />
              </span>
            ))}
            {proofs.length < 9 && (
              <button
                {...action('refund.apply.proof.pick', pickProof)}
                className="flex h-[68px] w-[68px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--app-border)] bg-[#FAFAFA] text-[var(--app-c-text-muted)]"
              >
                <IcImagePlus size={22} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 底部提交:未选原因渲染成无 binding 的置灰按钮 */}
      <div className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
        {reason ? (
          <button
            {...bindTap('refund.apply.submit.toOrders', {
              params: { tab: 'all' },
              nav: { mode: 'replace', popTo: '/pay/success', popToInclusive: true },
              beforeTrigger: submit,
            })}
            className="w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
          >
            {S.submitApply}
          </button>
        ) : (
          <button disabled className="w-full rounded-full border-none bg-[var(--app-c-chip-bg)] py-2.5 text-[15px] font-bold text-[var(--app-c-text-muted)]">
            {S.submitApply}
          </button>
        )}
      </div>

      {sheetOpen && <ReasonSheet supplier={isSupplierOrder(order)} />}
    </div>
  );
}

/** ?sheet=reason:选项按店铺类型两版(s331 专营店 6 项 / frame:r3@12.0 供应商国补 9 项),点选回填并自动关闭 */
function ReasonSheet({ supplier }: { supplier: boolean }) {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const refundDraft = useSuningStore((s) => s._temp.refundDraft);
  const setTemp = useSuningStore((s) => s.setTemp);
  const keys = supplier ? REFUND_REASONS_SUPPLIER : REFUND_REASONS_STORE;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative max-h-[75%] overflow-y-auto overflow-x-hidden rounded-t-2xl bg-[var(--app-surface)]">
        <div className="sticky top-0 flex items-center bg-[var(--app-surface)] px-4 pb-2 pt-3">
          <span className="min-w-0 flex-1 text-center text-[15px] font-bold text-[var(--app-text)]">{S.refundReasonSheetTitle}</span>
          <button {...bindBack()} className="absolute right-3 cursor-pointer border-none bg-transparent p-1 text-[var(--app-c-text-muted)]">
            <IcClose size={18} />
          </button>
        </div>
        <div className="px-4 pb-6">
          {keys.map((key) => {
            const text = S[key];
            const on = refundDraft.reason === text;
            return (
              <button
                key={key}
                {...action(
                  'refund.apply.reason.select',
                  () => {
                    setTemp({ refundDraft: { reason: text, note: refundDraft.note } });
                    back();
                  },
                  { params: { reason: text } },
                )}
                className="flex w-full cursor-pointer items-center gap-2 border-none border-b border-[var(--app-border)] bg-transparent py-3 text-left"
              >
                <span className={`min-w-0 flex-1 text-[14px] ${on ? 'text-[var(--app-c-danger)]' : 'text-[var(--app-text)]'}`}>{text}</span>
                {on && <IcCheck size={16} className="shrink-0 text-[var(--app-c-danger)]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
