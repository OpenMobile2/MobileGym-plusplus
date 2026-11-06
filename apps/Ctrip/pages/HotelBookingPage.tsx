import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img, Price, Stepper } from '../components/ui';
import { systemMonthDay } from '../utils/travelDate';

/** 酒店填单：按 roomId 取对应房型。 */
export default function HotelBookingPage() {
  const s = useCtripStrings();
  const REQS = [s.t('无烟房'), s.t('高楼层'), s.t('大床'), s.t('双床'), s.t('安静房间'), s.t('需要电梯')];
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const roomId = sp.get('roomId') || '';
  const checkIn = sp.get('checkIn') || systemMonthDay();
  const checkOut = sp.get('checkOut') || systemMonthDay(1);
  const { bindTap } = useCtripGestures();
  const hotels = useCtripStore((st) => st.hotels);
  const travelers = useCtripStore((st) => st.travelers);
  const startBooking = useCtripStore((st) => st.startBooking);
  const recordTaskAudit = useCtripStore((st) => st.recordTaskAudit);
  const hotel = hotels.find((h) => h.id === id);
  const room = hotel?.rooms.find((r) => r.id === roomId) || hotel?.rooms[0];
  const [rooms, setRooms] = React.useState(1);
  const [reqs, setReqs] = React.useState<string[]>([]);
  const [name, setName] = React.useState(travelers[0]?.name || '陈一诺');
  const [phone, setPhone] = React.useState(travelers[0]?.phone || '138****0001');

  React.useEffect(() => {
    if (!hotel || !room) return;
    recordTaskAudit('hotelBookingDraft', {
      hotelId: hotel.id, roomId: room.id, breakfast: room.breakfast,
      rooms, checkIn, checkOut, guestName: name,
    });
  }, [hotel, room, rooms, checkIn, checkOut, name, recordTaskAudit]);

  const nights = React.useMemo(() => {
    const a = Number(checkIn.split('-').pop() || 5);
    const b = Number(checkOut.split('-').pop() || 6);
    return Math.max(1, b - a);
  }, [checkIn, checkOut]);

  if (!hotel || !room) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F8]">
        <TopBar title={s.t('填写订单')} />
        <div className="flex-1 flex items-center justify-center text-[14px] text-[#999999]">{s.t('未找到该酒店')}</div>
      </div>
    );
  }

  const amount = room.price * rooms * nights;
  const toggleReq = (r: string) => setReqs((xs) => (xs.includes(r) ? xs.filter((x) => x !== r) : [...xs, r]));

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('填写订单')} backTo={`/hotel/${encodeURIComponent(hotel.id)}/rooms${sp.toString() ? `?${sp.toString()}` : ''}`} />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white mx-2 mt-2 rounded-xl p-3 flex gap-2.5">
          <Img src={room.image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold line-clamp-1">{hotel.name}</div>
            <div className="text-[12px] text-[#666666] mt-1 line-clamp-1">{room.name}</div>
            <div className="text-[11px] text-[#999999] mt-0.5">{room.breakfast} · {room.cancelPolicy}</div>
          </div>
        </div>

        <div className="bg-white mx-2 mt-2 rounded-xl px-3 py-3">
          <div className="flex items-center justify-between">
            <div><div className="text-[11px] text-[#999999]">{s.t('入住')}</div><div className="text-[15px] font-semibold">{checkIn}</div></div>
            <span className="text-[12px] text-[#999999]">共{nights}晚</span>
            <div className="text-right"><div className="text-[11px] text-[#999999]">{s.t('离店')}</div><div className="text-[15px] font-semibold">{checkOut}</div></div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F2F2F2]">
            <span className="text-[14px] text-[#333333]">{s.t('房间数')}</span>
            <Stepper value={rooms} min={1} max={5} onChange={(d) => setRooms((x) => Math.max(1, x + d))} actionId="hotelBooking.rooms.step" />
          </div>
        </div>

        <div className="bg-white mx-2 mt-2 rounded-xl px-3 py-1">
          <Field label={s.t('住客姓名')}><input value={name} onChange={(e) => setName(e.target.value)} className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
          <Field label={s.t('联系手机')}><input value={phone} onChange={(e) => setPhone(e.target.value)} className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
          <Field label={s.t('离店赚积分')}><span className="text-[13px] text-[#FF6A2C]">预计+{Math.round(amount / 10)}积分</span></Field>
        </div>

        <div className="bg-white mx-2 mt-2 rounded-xl px-3 py-3">
          <div className="text-[14px] text-[#333333] mb-2">{s.t('特殊要求(尽量满足)')}</div>
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

        <div className="bg-white mx-2 mt-2 rounded-xl px-3">
          <Field label={s.t('发票')}><span className="text-[13px] text-[#999999]">{s.t('可离店后开具')}</span></Field>
        </div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2">
        <div className="mr-auto">
          <Price value={amount} size="l" />
          <div className="text-[11px] text-[#999999]">{s.t('在线支付')}</div>
        </div>
        <button
          {...bindTap('hotelBooking.toCashier', {
            beforeTrigger: () => startBooking({ category: 'hotel', title: hotel.name, subtitle: `${room.name} · ${rooms}间${nights}晚 · ${checkIn}至${checkOut}`, amount, image: hotel.image }),
          })}
          className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-8 py-2.5 border-none cursor-pointer"
        >{s.t('立即支付')}</button>
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
