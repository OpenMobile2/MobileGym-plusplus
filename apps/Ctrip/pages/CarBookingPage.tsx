import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Price } from '../components/ui';
import { IcCheck } from '../res/icons';
import { systemMonthDay } from '../utils/travelDate';

/** 租车填单(spec car.booking)。无忧租/取还车/驾驶员选择/证件;去支付→cashier(Q14 共用收银台)。 */
export default function CarBookingPage() {
  const s = useCtripStrings();
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const pickupDate = sp.get('pickupDate') || systemMonthDay();
  const dropoffDate = sp.get('dropoffDate') || systemMonthDay(2);
  const pickupHour = (sp.get('pickupHour') || '10').padStart(2, '0');
  const { bindTap } = useCtripGestures();
  const cars = useCtripStore((s) => s.carModels);
  const travelers = useCtripStore((s) => s.travelers);
  const startBooking = useCtripStore((s) => s.startBooking);
  const c = cars.find((x) => x.id === id);
  const [driver, setDriver] = React.useState(travelers[0]?.id ?? '');
  if (!c) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F8]">
        <TopBar title="车型" />
        <div className="flex-1 flex items-center justify-center text-[14px] text-[#999999]">未找到该车型</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('租车填单')} />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 py-3">
          <div className="text-[15px] font-semibold">{c.name}</div>
          <div className="text-[12px] text-[#666666] mt-1">{c.seats} · {c.energy}</div>
        </div>

        <div className="bg-[#EAF4FF] mx-4 mt-2 rounded-lg px-3 py-2 text-[12px] text-[#0086F6] flex items-center gap-1.5">
          <IcCheck size={15} />{s.t('无忧租保障已含,事故 0 自付')}</div>

        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[13px] text-[#999999]">{s.t('取还车')}</div>
          <div className="text-[14px] mt-1">{sp.get('location') || '虹桥机场T2'} · {pickupDate} {pickupHour}:00 → {dropoffDate} {pickupHour}:00</div>
        </div>

        {/* 驾驶员 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[15px] font-semibold mb-2">{s.t('驾驶员')}</div>
          {travelers.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'carBooking.driver.toggle' }, { params: { id: t.id }, onTrigger: () => setDriver(t.id) })}
              className="w-full flex items-center justify-between py-2.5 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <div><div className="text-[14px]">{t.name}</div><div className="text-[11px] text-[#999999]">{s.t('证件已认证 · 演示数据')}</div></div>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${driver === t.id ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
            </button>
          ))}
        </div>

        <div className="bg-white mt-2 px-4 py-3 text-[12px] text-[#666666]">{s.t('证件要求:取车需驾驶员本人身份证 + 驾驶证原件,信用免押。')}</div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2">
        <div className="mr-auto"><Price value={c.totalPrice} size="l" /><div className="text-[11px] text-[#999999]">{s.t('2天总价')}</div></div>
        <button
          {...bindTap('carBooking.toCashier', { beforeTrigger: () => startBooking({ category: 'car', title: c.name, subtitle: '虹桥机场T2 · 2天', amount: c.totalPrice, image: c.image }) })}
          className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-8 py-2.5 border-none cursor-pointer"
        >{s.t('去支付')}</button>
      </div>
    </div>
  );
}
