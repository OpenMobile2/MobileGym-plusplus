import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { Price } from '../components/ui';
import { IcCheck } from '../res/icons';

/** 支付成功(spec cashier.success,inferred)。展示最近订单;查看订单→orders,返回首页→home。 */
export default function CashierSuccessPage() {
  const { bindTap } = useCtripGestures();
  const orders = useCtripStore((s) => s.orders);
  const latest = orders[0];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <div className="h-11 shrink-0" />
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pt-10" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="w-16 h-16 rounded-full bg-[#38A169] flex items-center justify-center">
          <IcCheck size={36} className="text-white" />
        </div>
        <div className="text-[20px] font-semibold text-[#111111] mt-4">支付成功</div>
        {latest && (
          <>
            <div className="mt-2"><Price value={latest.price} size="l" className="text-[26px]" /></div>
            <div className="text-[13px] text-[#999999] mt-2 text-center line-clamp-2">{latest.title}</div>
            <div className="text-[12px] text-[#999999] mt-1">{latest.statusText}</div>
          </>
        )}

        <div className="w-full mt-10 flex gap-3">
          <button {...bindTap('paySuccess.toHome')} className="flex-1 py-2.5 rounded-full border border-[#DDDDDD] bg-white text-[15px] text-[#333333] cursor-pointer">返回首页</button>
          <button {...bindTap('paySuccess.toOrders')} className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#33A5FF] to-[#0086F6] text-white text-[15px] border-none cursor-pointer">查看订单</button>
        </div>
      </div>
      <div className="h-4 shrink-0" />
    </div>
  );
}
