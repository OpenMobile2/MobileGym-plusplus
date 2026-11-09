import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Price, BottomSheet, usePanel } from '../components/ui';
import { systemMonthDay } from '../utils/travelDate';

/** 火车票填单：乘客选择 + 选座面板。 */
export default function TrainBookingPage() {
  const s = useCtripStrings();
  const { no = '' } = useParams();
  const [sp] = useSearchParams();
  const date = sp.get('date') || systemMonthDay();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const trains = useCtripStore((st) => st.trains);
  const travelers = useCtripStore((st) => st.travelers);
  const startBooking = useCtripStore((st) => st.startBooking);
  const recordTaskAudit = useCtripStore((st) => st.recordTaskAudit);
  const train = trains.find((t) => t.id === no);
  const [selected, setSelected] = React.useState<string[]>([travelers[0]?.id ?? '']);
  const [phone, setPhone] = React.useState(travelers[0]?.phone || '138****0001');
  const [editingPhone, setEditingPhone] = React.useState(false);
  const [seatPick, setSeatPick] = React.useState('靠窗');

  React.useEffect(() => {
    if (!train) return;
    recordTaskAudit('trainBookingDraft', {
      trainId: train.id,
      trainNo: train.trainNo,
      from: train.from,
      to: train.to,
      date,
      travelerIds: selected.filter(Boolean),
      seatPick,
    });
  }, [train, selected, seatPick, date, recordTaskAudit]);

  if (!train) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F8]">
        <TopBar title="车次" />
        <div className="flex-1 flex items-center justify-center text-[14px] text-[#999999]">未找到该车次</div>
      </div>
    );
  }
  const seat = train.seats[0];
  const toggle = (id: string) => setSelected((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const count = selected.filter(Boolean).length;
  const amount = seat.price * Math.max(1, count);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('火车票预订')} />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 py-3">
          <div className="text-[15px] font-semibold">{train.from} → {train.to}</div>
          <div className="text-[12px] text-[#666666] mt-1">{date} {train.depart}开 · {train.trainNo} · {seat.name}</div>
        </div>
        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[15px] font-semibold mb-2">{s.t('选择乘客')}</div>
          {travelers.map((p) => (
            <button
              key={p.id}
              {...bindTap({ kind: 'action', id: 'trainBooking.passenger.toggle' }, { params: { id: p.id }, onTrigger: () => toggle(p.id) })}
              className="w-full flex items-center justify-between py-2.5 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <div>
                <div className="text-[14px] text-[#222222]">{p.name} <span className="text-[11px] text-[#999999]">{s.t('成人')}</span></div>
                <div className="text-[11px] text-[#999999]">{s.t('证件已认证')}</div>
              </div>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${selected.includes(p.id) ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
            </button>
          ))}
        </div>
        <div className="bg-white mt-2 px-4">
          <button {...bindTap({ kind: 'action', id: 'trainBooking.seat.open' }, { onTrigger: () => open('seat') })} className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer">
            <span className="text-[14px] text-[#333333]">{s.t('在线选座')}</span>
            <span className="text-[13px] text-[#0086F6]">{seatPick} ›</span>
          </button>
          <div className="flex items-center justify-between py-3">
            <span className="text-[14px] text-[#333333]">{s.t('联系手机')}</span>
            {editingPhone ? (
              <input autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setEditingPhone(false)} className="w-36 text-right text-[14px] border border-[#0086F6] rounded px-2 py-1 outline-none" />
            ) : (
              <button type="button" onClick={() => setEditingPhone(true)} className="text-[14px] bg-transparent border-none cursor-pointer text-[#0086F6]">{phone} · {s.t('修改')}</button>
            )}
          </div>
        </div>
      </div>
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2 flex items-center justify-between">
        <div className="text-[13px] text-[#666]">{count}人 · <Price value={amount} size="m" /></div>
        <button
          {...bindTap('trainBooking.toCashier', { beforeTrigger: () => startBooking({ category: 'train', title: `${train.from} → ${train.to}`, subtitle: `${train.trainNo} · ${seat.name} · ${seatPick}`, amount }) })}
          className="text-[14px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-6 py-2 border-none cursor-pointer"
        >{s.t('立即预订')}</button>
      </div>
      {panel === 'seat' && (
        <BottomSheet title={s.t('在线选座')} onClose={close}>
          <div className="p-4 space-y-2">
            {['靠窗', '过道', '随机分配', '中间座'].map((opt) => (
              <button key={opt} type="button" onClick={() => { setSeatPick(opt); close(); }} className={`w-full text-left px-4 py-3 rounded-xl border-none cursor-pointer text-[14px] ${seatPick === opt ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F7F8FA] text-[#333]'}`}>{opt}</button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
