import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

export default function OrderSuccessPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useDianpingGestures();
  const [sp] = useSearchParams();
  const orderId = sp.get('orderId') || useDianpingStore.getState().lastPaidOrderId || '';
  const order = useDianpingStore((st) => st.orders.find((o) => o.id === orderId));

  return (
    <div className="flex h-full flex-col bg-(--app-c-card-bg)" data-status-bar-foreground="dark">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8FFF5] text-[28px] text-[#00B578]">
          ✓
        </div>
        <div className="mt-4 text-[18px] font-bold text-(--app-c-text-primary)">{s.paySuccess}</div>
        <div className="mt-2 text-[13px] text-(--app-c-text-muted)">{order?.dealTitle}</div>
        <div className="mt-1 text-[20px] font-bold text-[#FF6633]">¥{order?.payAmount ?? '--'}</div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-full border border-[#FF6633] bg-(--app-c-card-bg) py-2.5 text-[14px] font-medium text-[#FF6633]"
          {...bindTap('success.order-open', { params: { orderId } })}
        >
          {s.viewCoupon}
        </button>
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-full border-none bg-[#FF6633] py-2.5 text-[14px] font-medium text-white"
          {...bindTap('tabbar.home-open')}
        >
          {s.backHome}
        </button>
      </div>
    </div>
  );
}
