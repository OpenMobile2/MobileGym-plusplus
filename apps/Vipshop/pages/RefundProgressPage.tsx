import React from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, useToast, VIP } from '../components/ui';
import { formatDateTime } from '../utils/format';
import { IcCheck } from '../res/icons';

const STEPS = ['已提交申请', '平台审核中', '商家处理中', '退款完成'];

export default function RefundProgressPage() {
  const { id = '' } = useParams();
  const { bindTap, back } = useVipshopGestures();
  const [toast, showToast] = useToast();

  const refunds = useVipshopStore((s) => s.refunds);
  const cancelRefund = useVipshopStore((s) => s.cancelRefund);

  // 该订单最新一笔售后
  const refund = refunds.find((r) => r.orderId === id) ?? refunds[0] ?? null;
  const canceled = refund?.status === 'canceled';
  // 进度:审核中定位到第 2 步(index 1)
  const activeStep = canceled ? 0 : refund?.status === 'success' ? STEPS.length - 1 : 1;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="售后进度" />

      <div className="flex-1 overflow-y-auto">
        {/* 概要 */}
        <div className="px-4 py-4 text-white" style={{ background: `linear-gradient(135deg,#FF6FA5,${VIP.primary})` }}>
          <div className="text-[18px] font-semibold">
            {canceled ? '售后已撤销' : refund?.status === 'success' ? '退款成功' : '售后处理中'}
          </div>
          {refund && (
            <div className="text-[12px] opacity-90 mt-1">
              {refund.refundType} · 退款金额 ¥{refund.amount.toFixed(2)}
            </div>
          )}
        </div>

        {/* 时间轴 */}
        <div className="bg-white mt-2 px-4 py-4">
          {STEPS.map((s, i) => {
            const done = i <= activeStep && !canceled;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={s} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={done ? { background: VIP.primary } : { background: '#EEEEEE' }}
                  >
                    {done ? <IcCheck size={14} className="text-white" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#BBBBBB]" />}
                  </span>
                  {!isLast && <span className="w-px flex-1 min-h-8" style={{ background: done ? VIP.primary : '#EEEEEE' }} />}
                </div>
                <div className="pb-6">
                  <div className="text-[14px]" style={{ color: done ? '#222222' : '#999999', fontWeight: i === activeStep && !canceled ? 600 : 400 }}>{s}</div>
                  {i === 0 && refund && (
                    <div className="text-[11px] text-[#888888] mt-0.5">{formatDateTime(refund.createdAt)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部撤销 */}
      {!canceled && refund?.status === 'processing' && (
        <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center justify-center px-3 h-14">
          <button
            {...bindTap({ kind: 'action', id: 'refundProgress.cancel.submit' }, {
              onTrigger: () => { if (refund) { cancelRefund(refund.id); showToast('已撤销申请'); back(); } },
            })}
            className="text-[14px] rounded-full px-8 py-2 border cursor-pointer bg-white"
            style={{ color: VIP.primary, borderColor: VIP.primary }}
          >
            撤销申请
          </button>
        </div>
      )}
      {toast}
    </div>
  );
}
