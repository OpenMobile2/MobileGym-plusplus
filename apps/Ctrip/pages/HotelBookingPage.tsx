import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, Stepper } from '../components/ui';

/** 酒店填单(spec hotel.booking)。间数步进/特殊要求chip;立即支付→cashier(startBooking 挂起态)。 */
const REQS = ['无烟房', '高楼层', '大床', '双床', '安静房间', '需要电梯'];

export default function HotelBookingPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const hotels = useCtripStore((s) => s.hotels);
  const user = useCtripStore((s) => s.user);
  const startBooking = useCtripStore((s) => s.startBooking);
  const hotel = hotels.find((h) => h.id === id) ?? hotels[0];
  const room = hotel.rooms[0];
  const [rooms, setRooms] = React.useState(1);
  const [reqs, setReqs] = React.useState<string[]>([]);
  const [name, setName] = React.useState('李明');
  const [phone, setPhone] = React.useState('180****9152');

  const amount = room.price * rooms;
  const toggleReq = (r: string) => setReqs((xs) => (xs.includes(r) ? xs.filter((x) => x !== r) : [...xs, r]));

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="填写订单" />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 房型摘要 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-3 flex gap-2.5">
          <Img src={room.image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold line-clamp-1">{hotel.name}</div>
            <div className="text-[12px] text-[#666666] mt-1 line-clamp-1">{room.name}</div>
            <div className="text-[11px] text-[#999999] mt-0.5">{room.breakfast} · {room.cancelPolicy}</div>
          </div>
        </div>

        {/* 入离信息 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-3 py-3">
          <div className="flex items-center justify-between">
            <div><div className="text-[11px] text-[#999999]">入住</div><div className="text-[15px] font-semibold">07-05 周六</div></div>
            <span className="text-[12px] text-[#999999]">共1晚</span>
            <div className="text-right"><div className="text-[11px] text-[#999999]">离店</div><div className="text-[15px] font-semibold">07-06 周日</div></div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F2F2F2]">
            <span className="text-[14px] text-[#333333]">房间数</span>
            <Stepper value={rooms} min={1} max={5} onChange={(d) => setRooms((x) => Math.max(1, x + d))} actionId="hotelBooking.rooms.step" />
          </div>
        </div>

        {/* 住客信息 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-3 py-1">
          <Field label="住客姓名"><input value={name} onChange={(e) => setName(e.target.value)} className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
          <Field label="联系手机"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
          <Field label="离店赚积分"><span className="text-[13px] text-[#FF6A2C]">预计+{Math.round(amount / 10)}积分</span></Field>
        </div>

        {/* 特殊要求 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-3 py-3">
          <div className="text-[14px] text-[#333333] mb-2">特殊要求(尽量满足)</div>
          <div className="flex flex-wrap gap-2">
            {REQS.map((r) => (
              <button
                key={r}
                {...bindTap({ kind: 'action', id: 'hotelBooking.req.select.elevator' }, { params: { req: r }, onTrigger: () => toggleReq(r) })}
                className={`text-[12px] rounded-full px-3 py-1 border cursor-pointer ${reqs.includes(r) ? 'bg-[#E6F3FF] text-[#0086F6] border-[#0086F6]' : 'bg-[#F7F8FA] text-[#555555] border-transparent'}`}
              >{r}</button>
            ))}
          </div>
        </div>

        {/* 发票 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-3">
          <Field label="发票"><span className="text-[13px] text-[#999999]">可离店后开具</span></Field>
        </div>
      </div>

      {/* 底部支付栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2">
        <div className="mr-auto">
          <Price value={amount} size="l" />
          <div className="text-[11px] text-[#999999]">在线支付</div>
        </div>
        <button
          {...bindTap('hotelBooking.toCashier', {
            beforeTrigger: () => startBooking({ category: 'hotel', title: hotel.name, subtitle: `${room.name} · ${rooms}间1晚`, amount, image: hotel.image }),
          })}
          className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-8 py-2.5 border-none cursor-pointer"
        >立即支付</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F2F2F2] last:border-0">
      <span className="text-[14px] text-[#333333] shrink-0 mr-3">{label}</span>
      {children}
    </div>
  );
}
