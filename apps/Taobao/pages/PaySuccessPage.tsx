import React from 'react';
import { useParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { Price } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { IcCheck } from '../res/icons';

/** 支付成功页(spec: order.paySuccess,inferred —— Gate4 实测验收) */
export default function PaySuccessPage() {
  const { orderId = '' } = useParams();
  const { bindTap } = useTaobaoGestures();
  const order = useTaobaoStore((s) => s.orders.find((o) => o.id === orderId));
  const items = useTaobaoStore((s) => s.items);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-b from-[#FF5000] to-[#FF7A45] pt-8 pb-10 flex flex-col items-center text-white">
          <IcCheck size={48} />
          <div className="text-[17px] font-semibold mt-2">支付成功</div>
          {order && <div className="mt-1.5"><span className="text-white text-[20px] font-bold">¥{order.paidAmount}</span></div>}
          <div className="text-[11px] opacity-80 mt-1">🌱 已获得绿色能量 5g</div>
        </div>
        <div className="flex gap-3 justify-center -mt-5">
          <button
            {...bindTap('paySuccess.order-open', { params: { orderId } })}
            className="bg-white text-[#333333] text-[14px] rounded-full px-6 py-2.5 border border-[#EEEEEE] cursor-pointer"
          >
            查看订单
          </button>
          <button
            {...bindTap('paySuccess.home-open')}
            className="bg-white text-[#333333] text-[14px] rounded-full px-6 py-2.5 border border-[#EEEEEE] cursor-pointer"
          >
            返回首页
          </button>
        </div>
        <div className="text-[13px] text-[#999999] px-4 mt-5 mb-2">为你推荐</div>
        <div className="pb-3">
          <ItemGrid
            items={items.slice(0, 6)}
            bindingOf={(it) => bindTap('home.item-open', { params: { itemId: it.id } })}
          />
        </div>
      </div>
    </div>
  );
}
