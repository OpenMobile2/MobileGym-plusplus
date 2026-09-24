import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { REFUND_REASONS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack } from '../res/icons';

export default function RefundApplyPage() {
  const { orderId = '' } = useParams();
  const [sp] = useSearchParams();
  const sheet = sp.get('sheet');
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action, go, back } = useDianpingGestures();
  const order = useDianpingStore((st) => st.orders.find((o) => o.id === orderId));
  const applyRefund = useDianpingStore((st) => st.applyRefund);
  const showToast = useDianpingStore((st) => st.showToast);
  const [reason, setReason] = useState('');

  if (!order) {
    return (
      <div className="p-4">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="flex h-11 items-center gap-1 bg-white px-1">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold">{s.applyRefund}</div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pt-3" data-scroll-container="refund" data-scroll-direction="vertical">
        <div className="rounded-[10px] bg-white p-3">
          <div className="text-[14px] font-medium">{order.dealTitle}</div>
          <div className="mt-1 text-[12px] text-[#999]">
            {s.refundQty}: {order.qty}
          </div>
        </div>
        <button
          type="button"
          className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-[10px] border-none bg-white px-3 py-3 text-left"
          {...bindTap('refund.reason-open', { params: { orderId: order.id } })}
        >
          <span className="text-[14px]">{s.refundReason}</span>
          <span className={`text-[13px] ${reason ? 'text-[#222]' : 'text-[#999]'}`}>
            {reason || s.pleaseSelect} ›
          </span>
        </button>
      </div>
      <div className="border-t border-[#EEE] bg-white p-3">
        <button
          type="button"
          className="w-full cursor-pointer rounded-full border-none bg-[#FF6600] py-3 text-[15px] font-semibold text-white"
          {...action('refund.submit.commit', () => {
            if (!reason) {
              showToast(s.pleaseSelect);
              return;
            }
            applyRefund(order.id, reason);
            back();
          })}
        >
          {s.submitRefund}
        </button>
      </div>

      {sheet === 'reason' ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40">
          <div className="max-h-[70%] overflow-y-auto rounded-t-2xl bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px] font-semibold">{s.refundReason}</span>
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent text-[13px] text-[#999]"
                {...bindTap('refund.reason-close', { params: { orderId: order.id } })}
              >
                {s.close}
              </button>
            </div>
            {REFUND_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className="flex w-full cursor-pointer items-center justify-between border-none border-b border-[#F5F5F5] bg-transparent px-4 py-3.5 text-left text-[14px]"
                {...action(
                  'refund.reason.select.target',
                  () => {
                    setReason(r);
                    go('refund.reason-close', { orderId: order.id });
                  },
                  { params: { reason: r } },
                )}
              >
                {r}
                {reason === r ? <span className="text-[#FF6633]">✓</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
