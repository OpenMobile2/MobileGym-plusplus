import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Price, Stepper, BottomSheet, usePanel } from '../components/ui';

/** 门票填单(spec ticket.booking)。日期条/优惠日历;票数步进;游客选择;去支付→cashier(startBooking)。 */
export default function TicketBookingPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const attractions = useCtripStore((s) => s.attractions);
  const travelers = useCtripStore((s) => s.travelers);
  const startBooking = useCtripStore((s) => s.startBooking);
  const a = attractions.find((x) => x.id === id) ?? attractions[0];
  const tk = a.ticketTypes[0];
  const [qty, setQty] = React.useState(1);
  const [date, setDate] = React.useState('07-05');
  const [visitor, setVisitor] = React.useState(travelers[0]?.id ?? '');

  const amount = tk.price * qty;
  const visitorName = travelers.find((t) => t.id === visitor)?.name ?? '待选择';

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="门票预订" />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 py-3">
          <div className="text-[15px] font-semibold">{a.name}</div>
          <div className="text-[12px] text-[#666666] mt-1">{tk.name} · {tk.desc}</div>
        </div>

        {/* 日期 */}
        <div className="bg-white mt-2 px-4">
          <button {...bindTap({ kind: 'action', id: 'ticketBooking.date.open' }, { onTrigger: () => open('date') })} className="w-full flex items-center justify-between py-3.5 bg-transparent border-none cursor-pointer">
            <span className="text-[14px] text-[#333333]">游玩日期</span>
            <span className="text-[14px] text-[#0086F6]">{date} 周六 ›</span>
          </button>
        </div>

        {/* 票数 */}
        <div className="bg-white mt-2 px-4">
          <div className="flex items-center justify-between py-3.5">
            <div><div className="text-[14px] text-[#222222]">{tk.name}</div><Price value={tk.price} size="s" className="mt-0.5 block" /></div>
            <Stepper value={qty} min={1} max={10} onChange={(d) => setQty((x) => Math.max(1, x + d))} actionId="ticketBooking.qty.step" />
          </div>
        </div>

        {/* 游客 */}
        <div className="bg-white mt-2 px-4">
          <button {...bindTap({ kind: 'action', id: 'ticketBooking.visitor.open' }, { onTrigger: () => open('visitor') })} className="w-full flex items-center justify-between py-3.5 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer">
            <span className="text-[14px] text-[#333333]">出游人</span>
            <span className="text-[14px] text-[#0086F6]">{visitorName} ›</span>
          </button>
          <div className="flex items-center justify-between py-3.5">
            <span className="text-[14px] text-[#333333]">联系手机</span>
            <span className="text-[14px]">180****9152</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2">
        <div className="mr-auto"><Price value={amount} size="l" /><div className="text-[11px] text-[#999999]">{qty}张</div></div>
        <button
          {...bindTap('ticketBooking.toCashier', { beforeTrigger: () => startBooking({ category: 'ticket', title: a.name, subtitle: `${tk.name} · ${qty}张 · ${date}`, amount, image: a.image }) })}
          className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-8 py-2.5 border-none cursor-pointer"
        >去支付</button>
      </div>

      {panel === 'date' && (
        <BottomSheet title="选择游玩日期" onClose={close}>
          <div className="p-4 grid grid-cols-7 gap-1 text-center text-[13px]">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <button key={d} onClick={() => { setDate(`07-${String(d).padStart(2, '0')}`); close(); }} className={`py-2 rounded border-none cursor-pointer ${d === 5 ? 'bg-[#0086F6] text-white' : 'bg-[#F7F8FA] text-[#333333]'}`}>{d}</button>
            ))}
          </div>
        </BottomSheet>
      )}
      {panel === 'visitor' && (
        <BottomSheet title="选择出游人" onClose={close}>
          <div className="p-2">
            {travelers.map((t) => (
              <button key={t.id} onClick={() => { setVisitor(t.id); close(); }} className="w-full flex items-center justify-between px-3 py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left">
                <div><div className="text-[14px]">{t.name}</div><div className="text-[11px] text-[#999999]">{t.idCard}</div></div>
                <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${visitor === t.id ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
