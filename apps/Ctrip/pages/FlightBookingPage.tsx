import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Price, BottomSheet, usePanel } from '../components/ui';

/** 机票填单(spec flight.booking)。步骤条;乘机人弹层;保险选择;去支付→cashier(startBooking)。 */
const INSURANCE = [
  { id: 'none', label: '不购买', price: 0 },
  { id: 'std', label: '航意航延组合险', price: 30 },
  { id: 'pro', label: '尊享全保', price: 60 },
];

export default function FlightBookingPage() {
  const { no = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const flights = useCtripStore((s) => s.flights);
  const travelers = useCtripStore((s) => s.travelers);
  const startBooking = useCtripStore((s) => s.startBooking);
  const flight = flights.find((f) => f.id === no) ?? flights[0];
  const [selected, setSelected] = React.useState<string[]>([travelers[0]?.id ?? '']);
  const [ins, setIns] = React.useState('none');

  const toggle = (id: string) => setSelected((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const count = Math.max(1, selected.filter(Boolean).length);
  const insPrice = INSURANCE.find((i) => i.id === ins)?.price ?? 0;
  const amount = (flight.price + insPrice) * count;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="机票预订" />
      {/* 步骤条 */}
      <div className="shrink-0 bg-white flex justify-around py-2 text-[12px] border-b border-[#F0F0F0]">
        {['填订单', '选服务', '核对支付'].map((s, i) => (
          <span key={s} className={i === 0 ? 'text-[#0086F6] font-semibold' : 'text-[#999999]'}>{i + 1} {s}</span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 py-3">
          <div className="text-[15px] font-semibold">{flight.from} → {flight.to}</div>
          <div className="text-[12px] text-[#666666] mt-1">07-05 {flight.depart}起飞 · {flight.airline}{flight.flightNo} · {flight.cabin}</div>
        </div>

        {/* 乘机人 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-semibold">乘机人</span>
            <button {...bindTap({ kind: 'action', id: 'flightBooking.passenger.open' }, { onTrigger: () => open('passenger') })} className="text-[13px] text-[#0086F6] bg-transparent border-none cursor-pointer">+ 添加/选择</button>
          </div>
          {travelers.filter((p) => selected.includes(p.id)).map((p) => (
            <div key={p.id} className="py-2 border-b border-[#F5F5F5]">
              <div className="text-[14px] text-[#222222]">{p.name} <span className="text-[11px] text-[#999999]">成人</span></div>
              <div className="text-[11px] text-[#999999]">{p.idCard}</div>
            </div>
          ))}
        </div>

        {/* 保险 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[15px] font-semibold mb-2">航意航延组合险</div>
          {INSURANCE.map((i) => (
            <button
              key={i.id}
              {...bindTap({ kind: 'action', id: 'flightBooking.insurance.select.none' }, { params: { ins: i.id }, onTrigger: () => setIns(i.id) })}
              className="w-full flex items-center justify-between py-2.5 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <span className="text-[14px] text-[#222222]">{i.label} {i.price ? <span className="text-[#FF6A2C]">+¥{i.price}/人</span> : ''}</span>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${ins === i.id ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2">
        <div className="mr-auto"><Price value={amount} size="l" /><div className="text-[11px] text-[#999999]">{count}位乘机人</div></div>
        <button
          {...bindTap('flightBooking.toCashier', { beforeTrigger: () => startBooking({ category: 'flight', title: `${flight.from} → ${flight.to}`, subtitle: `${flight.airline}${flight.flightNo} · ${count}人`, amount }) })}
          className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-8 py-2.5 border-none cursor-pointer"
        >下一步</button>
      </div>

      {panel === 'passenger' && (
        <BottomSheet title="选择乘机人" onClose={close}>
          <div className="p-2">
            {travelers.map((p) => (
              <button key={p.id} onClick={() => toggle(p.id)} className="w-full flex items-center justify-between px-3 py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left">
                <div><div className="text-[14px]">{p.name}</div><div className="text-[11px] text-[#999999]">{p.idCard}</div></div>
                <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${selected.includes(p.id) ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
              </button>
            ))}
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">确定</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
