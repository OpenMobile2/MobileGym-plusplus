import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { PriceYuan } from '../components/ui';
import { IcNavBack, IcCheck, IcChevronRight, IcClock } from '../res/icons';

export function WaimaiSuccessPage() {
  const { bindTap, bindBack } = useJingdongGestures();
  const orders = useJingdongStore((s) => s.orders);

  const order = orders.find((o) => o.channel === 'miaosong') ?? orders[0];
  const orderId = order?.id ?? 'o_demo';

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="light">
      {/* 顶部成功状态头(暖色渐变) */}
      <div className="shrink-0 pt-10 bg-gradient-to-b from-[#FF5A3C] to-[#FF7A45] text-white">
        <div className="h-11 flex items-center px-2">
          <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center">
            <IcNavBack size={22} className="text-white" />
          </button>
          <span className="flex-1 text-center text-[17px] font-medium">下单成功</span>
          <div className="w-8" />
        </div>
        <div className="flex flex-col items-center pt-2 pb-6">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <IcCheck size={40} className="text-white" />
          </div>
          <div className="text-[20px] font-bold mt-2">下单成功</div>
          <div className="text-[13px] text-white/85 mt-1 flex items-center gap-1"><IcClock size={14} />商家接单中,请耐心等待</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mt-3">
        {/* 订单卡 */}
        <div className="bg-white mx-2 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#1A1A1A]">{order?.shopName ?? '京东秒送'}</span>
            <span className="text-[13px] text-[#FF4E33]">商家接单中</span>
          </div>
          {order && order.lines.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {order.lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#333] truncate flex-1 mr-2">{l.title} ×{l.qty}</span>
                  <PriceYuan value={l.price} className="text-[#1A1A1A] text-[13px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-[13px] text-[#999]">订单已提交,骑手将尽快为您配送</div>
          )}
          <div className="mt-3 pt-3 border-t border-[#F5F5F5] flex items-center justify-between">
            <span className="text-[13px] text-[#666]">实付金额</span>
            <PriceYuan value={order?.paidAmount ?? 0} className="text-[#FF2D2D] text-[17px]" />
          </div>
        </div>

        {/* 操作入口 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-3">
          <button {...bindTap('waimaisuccess.detail-open', { params: { orderId } })} className="w-full flex items-center justify-between py-3.5 border-b border-[#F5F5F5]">
            <span className="text-[14px] text-[#1A1A1A]">查看订单详情</span>
            <IcChevronRight size={18} className="text-[#CCC]" />
          </button>
          <button {...bindTap('waimaisuccess.review-open')} className="w-full flex items-center justify-between py-3.5">
            <span className="text-[14px] text-[#1A1A1A]">去评价</span>
            <IcChevronRight size={18} className="text-[#CCC]" />
          </button>
        </div>

        <div className="text-center text-[12px] text-[#BBB] mt-6">感谢您的下单,祝您用餐愉快</div>
      </div>
    </div>
  );
}
