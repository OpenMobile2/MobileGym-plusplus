import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { IcCheck } from '../res/icons';

export function OrderSuccessPage() {
  const { bindTap } = usePinduoduoGestures();
  const orders = usePinduoduoStore((s) => s.orders);
  const order = orders[0];

  if (!order) {
    return <div className="h-full pt-10 flex items-center justify-center text-[#999]">暂无订单</div>;
  }

  return (
    <div className="h-full flex flex-col pt-10 bg-white overflow-hidden" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        <div className="flex flex-col items-center pt-16 pb-8 px-4">
          <IcCheck size={56} className="text-[#20B010]" />
          <div className="mt-4 text-[19px] font-bold text-[#333]">下单成功</div>
          <div className="mt-2 text-[13px] text-[#20B010] text-center leading-relaxed">
            确认收货后自动付款 ¥{order.autoPayAmount}
            <br />
            预计后天送达
          </div>
        </div>

        <div className="px-4 mt-4 flex flex-col gap-3">
          <button
            {...bindTap('ordersuccess.detail-open', { params: { orderId: order.id } })}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white text-[16px] font-medium"
          >
            查看订单详情
          </button>
          <button
            {...bindTap('ordersuccess.home-open')}
            className="w-full h-12 rounded-full border border-[#DDD] text-[#666] text-[16px]"
          >
            继续逛
          </button>
        </div>
      </div>
    </div>
  );
}
