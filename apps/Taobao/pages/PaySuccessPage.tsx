import React from 'react';
import { useParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { Price } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { IcCheck } from '../res/icons';

/** 支付成功页(spec: order.paySuccess,inferred —— Gate4 实测验收) */
export default function PaySuccessPage() {
  const { orderId = '' } = useParams();
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const order = useTaobaoStore((st) => st.orders.find((o) => o.id === orderId));
  const items = useTaobaoStore((st) => st.items);

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-b from-[#FF5000] to-[#FF7A45] pt-8 pb-10 flex flex-col items-center text-white">
          <IcCheck size={48} />
          <div className="text-[17px] font-semibold mt-2">{s.paySuccessTitle}</div>
          {order && <div className="mt-1.5"><span className="text-white text-[20px] font-bold">¥{order.paidAmount}</span></div>}
          <div className="text-[11px] opacity-80 mt-1">{s.greenEnergyEarnedText}</div>
        </div>
        <div className="flex gap-3 justify-center -mt-5">
          <button
            {...bindTap('paySuccess.order-open', { params: { orderId } })}
            className="bg-app-surface text-app-text text-[14px] rounded-full px-6 py-2.5 border border-app-border cursor-pointer"
          >
            {s.viewOrderLabel}
          </button>
          <button
            {...bindTap('paySuccess.home-open')}
            className="bg-app-surface text-app-text text-[14px] rounded-full px-6 py-2.5 border border-app-border cursor-pointer"
          >
            {s.backToHomeLabel}
          </button>
        </div>
        <div className="text-[13px] text-app-text-muted px-4 mt-5 mb-2">{s.recommendForYou}</div>
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
