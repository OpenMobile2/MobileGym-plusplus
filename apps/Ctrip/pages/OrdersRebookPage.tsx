import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 改签申请(spec orders.rebook)。选乘客/行程/改城市日期;查看航班→wontfix(改签后端)。 */
export default function OrdersRebookPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const orders = useCtripStore((s) => s.orders);
  const order = orders.find((o) => o.id === id) ?? orders[0];
  const travelers = useCtripStore((s) => s.travelers);
  const [passenger, setPassenger] = React.useState(travelers[0]?.id ?? '');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="改签" />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 py-3">
          <div className="text-[14px] font-semibold line-clamp-1">{order.title}</div>
          <div className="text-[12px] text-[#999999] mt-1">{order.subtitle}</div>
        </div>

        <div className="bg-white mt-2 px-4 py-2">
          <div className="text-[13px] text-[#999999] py-2">选择改签乘客</div>
          {travelers.map((p) => (
            <button key={p.id} onClick={() => setPassenger(p.id)} className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left">
              <span className="text-[14px]">{p.name}</span>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${passenger === p.id ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
            </button>
          ))}
        </div>

        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[14px] text-[#333333]">修改行程</div>
          <div className="text-[12px] text-[#999999] mt-1">出发日期:07-05 → 请选择新日期</div>
        </div>
      </div>
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2">
        <button {...bindTap({ kind: 'action', id: 'rebook.viewflights.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="w-full py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">查看可改签航班</button>
      </div>
      {toast}
    </div>
  );
}
