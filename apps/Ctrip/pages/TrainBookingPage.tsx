import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Price, useToast } from '../components/ui';

/** 火车票填单(spec train.booking)。乘客一键添加/选座;立即预订→cashier(startBooking)。 */
export default function TrainBookingPage() {
  const { no = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const trains = useCtripStore((s) => s.trains);
  const travelers = useCtripStore((s) => s.travelers);
  const startBooking = useCtripStore((s) => s.startBooking);
  const train = trains.find((t) => t.id === no) ?? trains[0];
  const seat = train.seats[0];
  const [selected, setSelected] = React.useState<string[]>([travelers[0]?.id ?? '']);
  const [phone] = React.useState('180****9152');

  const toggle = (id: string) => setSelected((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const count = selected.filter(Boolean).length;
  const amount = seat.price * Math.max(1, count);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="火车票预订" />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 方案摘要 */}
        <div className="bg-white px-4 py-3">
          <div className="text-[15px] font-semibold">{train.from} → {train.to}</div>
          <div className="text-[12px] text-[#666666] mt-1">07-05 {train.depart}开 · {train.trainNo} · {seat.name}</div>
        </div>

        {/* 乘客 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[15px] font-semibold mb-2">选择乘客</div>
          {travelers.map((p) => (
            <button
              key={p.id}
              {...bindTap({ kind: 'action', id: 'trainBooking.passenger.toggle' }, { params: { id: p.id }, onTrigger: () => toggle(p.id) })}
              className="w-full flex items-center justify-between py-2.5 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <div>
                <div className="text-[14px] text-[#222222]">{p.name} <span className="text-[11px] text-[#999999]">成人</span></div>
                <div className="text-[11px] text-[#999999]">{p.idCard}</div>
              </div>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${selected.includes(p.id) ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
            </button>
          ))}
        </div>

        {/* 选座 / 手机 */}
        <div className="bg-white mt-2 px-4">
          <button {...bindTap({ kind: 'action', id: 'trainBooking.seat.open' }, { onTrigger: () => showToast('在线选座:靠窗/过道(演示)') })} className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer">
            <span className="text-[14px] text-[#333333]">在线选座</span>
            <span className="text-[13px] text-[#0086F6]">去选座 ›</span>
          </button>
          <div className="flex items-center justify-between py-3">
            <span className="text-[14px] text-[#333333]">联系手机</span>
            <span className="text-[14px]">{phone}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2">
        <div className="mr-auto"><Price value={amount} size="l" /><div className="text-[11px] text-[#999999]">{count || 1}位乘客</div></div>
        <button
          {...bindTap('trainBooking.toCashier', { beforeTrigger: () => startBooking({ category: 'train', title: `${train.from} → ${train.to}`, subtitle: `${train.trainNo} · ${seat.name} · ${count || 1}人`, amount }) })}
          className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-8 py-2.5 border-none cursor-pointer"
        >立即预订</button>
      </div>
      {toast}
    </div>
  );
}
