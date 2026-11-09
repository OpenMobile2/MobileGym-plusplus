import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, showToast } from '../components/ui';
import { IcCheck } from '../res/icons';
import { REFUND_REASONS } from '../constants';

export function RefundFormPage() {
  const [sp] = useSearchParams();
  const orderId = sp.get('orderId') || '';
  const { bindTap, back } = usePinduoduoGestures();
  const order = usePinduoduoStore((st) => st.orders.find((o) => o.id === orderId));
  const submitRefundForm = usePinduoduoStore((st) => st.submitRefundForm);

  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');

  if (!order) {
    return (
      <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
        <TopBar title="申请退款" className="bg-white" />
        <div className="flex-1 flex items-center justify-center text-[#999]">订单不存在</div>
      </div>
    );
  }

  const line = order.lines[0];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="申请退款" className="bg-white" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 商品行 */}
        <div className="bg-white flex gap-2.5 px-3 py-3">
          <Img src={line.image} className="w-16 h-16 rounded-md object-cover shrink-0" alt={line.title} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[#333] line-clamp-2 leading-[17px]">{line.title}</div>
            <div className="text-[12px] text-[#999] mt-1 truncate">{line.skuDesc}</div>
          </div>
        </div>

        {/* 退款金额 */}
        <div className="bg-white mt-2 px-3 py-3 flex items-center justify-between">
          <span className="text-[14px] text-[#333]">退款金额</span>
          <span className="text-[16px] text-[#E22E1F] font-bold">¥{order.itemTotal.toFixed(2)}</span>
        </div>

        {/* 退款原因 */}
        <div className="bg-white mt-2">
          <div className="px-3 py-2 text-[13px] text-[#999]">退款原因</div>
          {REFUND_REASONS.map((r) => {
            const on = reason === r;
            return (
              <button
                key={r}
                {...bindTap({ kind: 'action', id: 'refundform.reason.select' }, { params: { reason: r }, onTrigger: () => setReason(r) })}
                className="w-full flex items-center justify-between px-3 py-3 border-t border-[#F5F5F5] text-left"
              >
                <span className="text-[14px] text-[#333]">{r}</span>
                {on ? (
                  <IcCheck size={18} className="text-[#E22E1F]" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-[#CCC]" />
                )}
              </button>
            );
          })}
        </div>

        {/* 问题描述 */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="text-[13px] text-[#999] mb-2">问题描述</div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="补充描述问题(选填),有助于商家更快处理"
            className="w-full h-24 text-[14px] text-[#333] bg-[#F7F7F7] rounded-lg p-2.5 resize-none outline-none"
          />
        </div>
        <div className="h-20" />
      </div>

      {/* 底部提交 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] p-3" data-hide-on-keyboard>
        <button
          {...bindTap({ kind: 'action', id: 'refundform.form.submit' }, { onTrigger: () => { submitRefundForm(orderId, reason || REFUND_REASONS[0]); showToast('退款申请已提交'); back(); } })}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium"
        >
          提交
        </button>
      </div>
    </div>
  );
}
