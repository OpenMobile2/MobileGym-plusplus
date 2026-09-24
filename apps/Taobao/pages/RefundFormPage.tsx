import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { REFUND_REASONS } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, Price, useToast } from '../components/ui';

/**
 * 退款申请表单(spec: orders.refundForm;qa:Q2 仅退款原因必填,金额只读)
 * 提交 → refunds 新增(模拟秒批为退款成功)→ 回订单列表退款tab
 */
export default function RefundFormPage() {
  const { orderId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const refundType = searchParams.get('type') ?? '退货/退款';
  const { bindTap, go } = useTaobaoGestures();
  const [toast, showToast] = useToast();

  const order = useTaobaoStore((s) => s.orders.find((o) => o.id === orderId));
  const submitRefund = useTaobaoStore((s) => s.submitRefund);
  const [reason, setReason] = useState<string | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F7]">
        <TopBar title="申请退款" />
        <div className="flex-1 flex items-center justify-center text-[#999999]">订单不存在</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title={refundType === '退货/退款' ? '申请退款' : `申请${refundType}`} />

      <div className="flex-1 overflow-y-auto px-2.5">
        {/* 商品摘要 */}
        <div className="bg-white rounded-xl mt-2 p-3 flex gap-2.5">
          <Img src={order.lines[0].image} className="w-16 h-16 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] line-clamp-1">{order.lines[0].title}</div>
            <div className="text-[11px] text-[#999999] mt-0.5">{order.lines[0].skuDesc}</div>
            <div className="text-[11px] text-[#999999] mt-0.5">售后类型:{refundType}</div>
          </div>
        </div>

        {/* 原因(必填) */}
        <div className="bg-white rounded-xl mt-2 p-3">
          <button
            {...bindTap({ kind: 'action', id: 'refund.reason.select.option' }, {
              onTrigger: () => setReasonOpen((v) => !v),
            })}
            className="w-full flex justify-between items-center bg-transparent border-none cursor-pointer"
          >
            <span className="text-[14px]">退款原因 <span className="text-[#FF0036]">*</span></span>
            <span className={`text-[13px] ${reason ? 'text-[#111111]' : 'text-[#999999]'}`}>
              {reason ?? '请选择'} ▾
            </span>
          </button>
          {reasonOpen && (
            <div className="mt-2 border-t border-[#F5F5F5]">
              {REFUND_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReason(r); setReasonOpen(false); }}
                  className={`w-full text-left py-2.5 text-[13px] bg-transparent border-none cursor-pointer border-b border-[#F8F8F8] ${
                    reason === r ? 'text-[#FF5000] font-semibold' : 'text-[#333333]'
                  }`}
                >
                  {r} {reason === r && '✓'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 金额(只读) */}
        <div className="bg-white rounded-xl mt-2 p-3 flex justify-between items-center">
          <span className="text-[14px]">退款金额</span>
          <Price value={order.paidAmount} size="m" />
        </div>
        <div className="text-[11px] text-[#999999] px-2 mt-1.5">
          不可修改,最多 ¥{order.paidAmount},含发货邮费 ¥0.00
        </div>
      </div>

      {/* 提交 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2">
        <button
          {...bindTap({ kind: 'action', id: 'refund.form.submit' }, {
            onTrigger: () => {
              if (!reason) { showToast('请选择退款原因'); return; }
              submitRefund(order.id, refundType, reason);
              showToast('提交成功,退款已极速到账');
              window.setTimeout(() => go('refund.done-open'), 600);
            },
          })}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[15px] border-none cursor-pointer disabled:opacity-40"
        >
          提交
        </button>
      </div>
      {toast}
    </div>
  );
}
