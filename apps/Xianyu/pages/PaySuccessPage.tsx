import React from 'react';
import { useParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { ItemImage } from '../components/ItemImage';
import { IcCheck } from '../res/icons';

export default function PaySuccessPage() {
  const { orderId = '' } = useParams();
  const { bindTap, go } = useXianyuGestures();
  const order = useXianyuStore((s) => s.orders.find((o) => o.id === orderId));

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <div className="h-11 shrink-0 bg-white" />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white flex flex-col items-center py-8">
          <span className="w-14 h-14 rounded-full bg-[#1CB854] flex items-center justify-center"><IcCheck size={34} className="text-white" /></span>
          <div className="text-[18px] font-bold text-[#111] mt-3">付款成功</div>
          <div className="text-[13px] text-[#999] mt-1">等待卖家发货</div>
        </div>

        {order && (
          <div className="bg-white mt-2 px-3 py-3 flex gap-2">
            <ItemImage seed={order.itemId} src={order.image} label={order.title} className="w-14 h-14 rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#1A1A1A] line-clamp-2">{order.title}</div>
              <div className="text-[12px] text-[#999] mt-1">{order.sellerName} · 实付 ¥{order.price}</div>
              {order.payMethod && <div className="text-[11px] text-[#999]">支付方式:{order.payMethod}</div>}
            </div>
          </div>
        )}

        <div className="flex gap-3 px-4 mt-5">
          <button
            {...bindTap('order.detail-open', { params: { orderId } })}
            className="flex-1 h-10 rounded-full border border-[#DDD] bg-white text-[#333] text-[14px] cursor-pointer"
          >查看订单</button>
          <button
            onClick={() => go('tabbar.home-open', {}, { mode: 'replace' })}
            className="flex-1 h-10 rounded-full bg-[#FFE411] text-[#111] font-semibold text-[14px] border-none cursor-pointer"
          >返回首页</button>
        </div>
      </div>
    </div>
  );
}
