import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, PrimaryBtn, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 接送机(spec car.pickup,金刚区入口)。接机/送机 tab;查询→toast(链路wontfix,入口保留)。 */
export default function CarPickupPage() {
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const [tab, setTab] = React.useState('arrival');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="接送机" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white flex px-2">
          {[{ id: 'arrival', label: '去机场接您' }, { id: 'departure', label: '送机' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold border-b-2 border-[#0086F6]' : 'text-[#666666]'}`}>{t.label}</button>
          ))}
        </div>
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <div className="py-3 border-b border-[#F2F2F2]">
            <div className="text-[13px] text-[#999999]">关联航班</div>
            <div className="text-[16px] font-semibold mt-1">HO1167 · 08:40 抵达</div>
          </div>
          <div className="py-3 border-b border-[#F2F2F2]">
            <div className="text-[13px] text-[#999999]">{tab === 'arrival' ? '目的地' : '出发地'}</div>
            <div className="text-[16px] font-semibold mt-1">市中心酒店</div>
          </div>
          <PrimaryBtn binding={bindTap({ kind: 'action', id: 'carPickup.query.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="w-full mt-3">查询</PrimaryBtn>
        </div>
      </div>
      {toast}
    </div>
  );
}
