import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, useToast, BottomSheet, usePanel } from '../components/ui';
import { daysInMonth, startOfSystemDay } from '../utils/travelDate';

/** 改签申请：仅机票/火车票可用；选日后可确认改签。 */
export default function OrdersRebookPage() {
  const s = useCtripStrings();
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const [toast] = useToast();
  const { value: panel, open, close } = usePanel();
  const orders = useCtripStore((st) => st.orders);
  const flights = useCtripStore((st) => st.flights);
  const recordTaskAudit = useCtripStore((st) => st.recordTaskAudit);
  const order = orders.find((o) => o.id === id);
  const travelers = useCtripStore((st) => st.travelers);
  const [passenger, setPassenger] = React.useState(travelers[0]?.id ?? '');
  const today = React.useMemo(() => startOfSystemDay(), []);
  const [day, setDay] = React.useState(today.getDate());
  const [confirmedDate, setConfirmedDate] = React.useState(false);
  const dateLabel = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F8]">
        <TopBar title={s.t('改签')} />
        <div className="flex-1 flex items-center justify-center text-[14px] text-[#999999]">{s.t('未找到该订单')}</div>
      </div>
    );
  }

  const canRebook = order.category === 'flight' || order.category === 'train';
  const submitLabel = order.category === 'train' ? s.t('查看可改签车次') : s.t('查看可改签航班');

  const onSubmit = () => {
    const routeFlights = flights.filter((flight) => order.title.includes(flight.from) && order.title.includes(flight.to));
    recordTaskAudit('rebookOptionsViewed', {
      orderId: order.id,
      date: dateLabel,
      optionIds: routeFlights.map((flight) => flight.id),
    });
    open('flights');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={canRebook ? s.t('改签') : s.t('订单变更')} />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 py-3">
          <div className="text-[14px] font-semibold line-clamp-1">{order.title}</div>
          <div className="text-[12px] text-[#999999] mt-1">{order.subtitle}</div>
        </div>

        {!canRebook ? (
          <div className="bg-white mt-2 mx-2 rounded-xl px-4 py-6 text-center">
            <div className="text-[15px] text-[#333333] font-semibold">{s.t('该订单不支持改签')}</div>
            <div className="text-[13px] text-[#999999] mt-2 leading-relaxed">
              {order.category === 'hotel'
                ? s.t('酒店订单如需变更日期或房型，请取消后重新预订，或联系酒店协商。')
                : s.t('当前品类暂不支持在线改签，请联系客服处理。')}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white mt-2 px-4 py-2">
              <div className="text-[13px] text-[#999999] py-2">{s.t('选择改签乘客')}</div>
              {travelers.map((p) => (
                <button key={p.id} onClick={() => setPassenger(p.id)} className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left">
                  <span className="text-[14px]">{p.name}</span>
                  <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${passenger === p.id ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
                </button>
              ))}
            </div>

            <div className="bg-white mt-2 px-4 py-3">
              <div className="text-[14px] text-[#333333]">{s.t('修改行程')}</div>
              <button
                type="button"
                onClick={() => open('date')}
                className="w-full text-left text-[12px] text-[#0086F6] mt-1 bg-transparent border-none cursor-pointer px-0"
              >出发日期:{confirmedDate ? dateLabel : '请选择'} → {s.t('请选择新日期')}</button>
            </div>
          </>
        )}
      </div>
      {canRebook && (
        <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2">
          <button
            {...bindTap({ kind: 'action', id: 'rebook.viewflights.open' }, { onTrigger: onSubmit })}
            className="w-full py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer"
          >{submitLabel}</button>
        </div>
      )}
      {panel === 'date' && (
        <BottomSheet title={s.t('选择新出发日期')} onClose={close}>
          <div className="p-4 grid grid-cols-7 gap-1 text-center text-[13px]">
            {Array.from({ length: daysInMonth(today) }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                onClick={() => { setDay(d); setConfirmedDate(true); close(); }}
                className={`py-2 rounded border-none cursor-pointer ${d === day && confirmedDate ? 'bg-[#0086F6] text-white' : 'bg-[#F7F8FA]'}`}
              >{d}</button>
            ))}
          </div>
        </BottomSheet>
      )}
      {panel === 'flights' && (
        <BottomSheet title={s.t('可改签航班')} onClose={close}>
          <div className="p-3 space-y-2">
            {flights.filter((flight) => order.title.includes(flight.from) && order.title.includes(flight.to)).map((flight) => (
              <div key={flight.id} className="rounded-xl bg-[#F7F8FA] px-4 py-3">
                <div className="flex items-center justify-between text-[15px] font-semibold">
                  <span>{flight.depart} → {flight.arrive}</span><span className="text-[#FF6A2C]">¥{flight.price}</span>
                </div>
                <div className="mt-1 text-[12px] text-[#666666]">{flight.airline} {flight.flightNo} · {flight.fromAirport} → {flight.toAirport}</div>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
