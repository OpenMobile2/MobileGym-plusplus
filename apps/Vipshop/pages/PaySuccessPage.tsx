import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Price, VIP } from '../components/ui';
import { IcCheck } from '../res/icons';

export default function PaySuccessPage() {
  const { bindTap } = useVipshopGestures();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const orders = useVipshopStore((s) => s.orders);
  // 优先按 orderId 查找,否则取最新一笔(createOrder 前插)
  const order = (orderId && orders.find((o) => o.id === orderId)) || orders[0] || null;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10">
      <div className="flex-1 flex flex-col items-center px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mt-16"
          style={{ background: VIP.primary }}
        >
          <IcCheck size={40} className="text-white" />
        </div>
        <div className="text-[20px] font-semibold text-[#222222] mt-4">支付成功</div>
        {order && (
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-[13px] text-[#888888]">实付</span>
            <Price value={order.paidAmount} size="l" />
          </div>
        )}
        <div className="text-[12px] text-[#888888] mt-2 text-center">
          您的订单已提交,商家正在为您备货
        </div>

        <div className="flex gap-3 mt-10 w-full max-w-[300px]">
          <button
            {...bindTap('paySuccess.orders-open')}
            className="flex-1 h-10 rounded-full border cursor-pointer bg-white text-[14px] font-medium"
            style={{ color: VIP.primary, borderColor: VIP.primary }}
          >
            查看订单
          </button>
          <button
            {...bindTap('paySuccess.home-open')}
            className="flex-1 h-10 rounded-full border-none cursor-pointer text-white text-[14px] font-medium"
            style={{ background: VIP.ctaBlack }}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
