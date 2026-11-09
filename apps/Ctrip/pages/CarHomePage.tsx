import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, PrimaryBtn, BottomSheet, usePanel, Img } from '../components/ui';
import { systemMonthDay } from '../utils/travelDate';

/** 租车自驾：取还车地点可分开；取还时间可改。 */
export default function CarHomePage() {
  const s = useCtripStrings();
  const BIZ_TABS = [{ id: 'domestic', label: s.t('国内租车') }, { id: 'intl', label: s.t('国际租车') }, { id: 'pickup', label: s.t('接送机') }];
  const { bindTap, go } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [sp] = useSearchParams();
  const [tab, setTab] = React.useState('domestic');
  const [pickup, setPickup] = React.useState(sp.get('location') || '上海虹桥机场');
  const [dropoff, setDropoff] = React.useState(sp.get('dropoff') || '');
  const [pickupOffset, setPickupOffset] = React.useState(0);
  const [dropoffOffset, setDropoffOffset] = React.useState(2);
  const [pickupHour, setPickupHour] = React.useState(10);
  const sameSpot = !dropoff || dropoff === pickup;
  const dropLabel = sameSpot ? s.t('同取车点') : dropoff;

  React.useEffect(() => {
    const loc = sp.get('location');
    const drop = sp.get('dropoff');
    if (loc) setPickup(loc);
    if (drop) setDropoff(drop);
  }, [sp]);

  const openLoc = (target: 'pickup' | 'dropoff') => {
    go('carHome.toLocation', {
      locTarget: target,
      location: pickup,
      dropoff: dropoff || '',
    });
  };

  const timeText = `${systemMonthDay(pickupOffset)} ${String(pickupHour).padStart(2, '0')}:00 - ${systemMonthDay(dropoffOffset)} ${String(pickupHour).padStart(2, '0')}:00`;
  const queryParams = {
    location: pickup,
    dropoff: sameSpot ? pickup : dropoff,
    pickupDate: systemMonthDay(pickupOffset),
    dropoffDate: systemMonthDay(dropoffOffset),
    pickupHour: String(pickupHour),
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('租车自驾')} />
      <div className="shrink-0 bg-white flex px-2 border-b border-[#F0F0F0]">
        {BIZ_TABS.map((t) => (
          <button
            key={t.id}
            {...bindTap({ kind: 'action', id: 'carHome.tab.select.pickup' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
            className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'pickup' ? (
          <div className="bg-white mx-2 mt-2 rounded-xl p-4 text-[14px] text-[#666666]">
            {s.t('接送机服务：选择航班后预约专车，当前请先用「国内租车」查询车辆。')}
          </div>
        ) : tab === 'intl' ? (
          <div className="bg-white mx-2 mt-2 rounded-xl p-4 text-[14px] text-[#666666]">
            {s.t('国际租车：当前示例数据为国内门店，请切换「国内租车」。')}
          </div>
        ) : (
          <div className="bg-white mx-2 mt-2 rounded-xl p-3">
            <button {...bindTap('carHome.toLocation', { params: { locTarget: 'pickup', location: pickup, dropoff: dropoff || '' }, onTrigger: () => openLoc('pickup') })} className="w-full flex items-center justify-between py-3 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
              <span className="text-[13px] text-[#999999]">{s.t('取车地点')}</span>
              <span className="text-[15px] font-semibold text-right max-w-[70%] line-clamp-1">{pickup} ›</span>
            </button>
            <button {...bindTap('carHome.toLocation', { params: { locTarget: 'dropoff', location: pickup, dropoff: dropoff || '' }, onTrigger: () => openLoc('dropoff') })} className="w-full flex items-center justify-between py-3 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
              <span className="text-[13px] text-[#999999]">{s.t('还车地点')}</span>
              <span className="text-[15px] font-semibold text-right max-w-[70%] line-clamp-1">{dropLabel} ›</span>
            </button>
            <button {...bindTap({ kind: 'action', id: 'carHome.date.open' }, { onTrigger: () => open('date') })} className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer">
              <span className="text-[13px] text-[#999999]">{s.t('取还时间')}</span>
              <span className="text-[14px]">{timeText} ›</span>
            </button>
            <PrimaryBtn binding={bindTap({ kind: 'action', id: 'carHome.query' }, { params: queryParams, onTrigger: () => go('carHome.query', queryParams) })} className="w-full mt-3">{s.t('查询车辆')}</PrimaryBtn>
          </div>
        )}

        <div className="mx-2 mt-2 rounded-xl overflow-hidden relative h-24">
          <Img src="/@app-assets/Ctrip/gen/banner_car.jpg" className="w-full h-full object-cover" />
          <span className="absolute left-3 top-3 text-white text-[14px] font-semibold drop-shadow">{s.t('新客专享 · 首租立减')}</span>
        </div>
      </div>

      {panel === 'date' && (
        <BottomSheet title={s.t('取还车时间')} onClose={close}>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-[13px] text-[#999] mb-2">{s.t('取车日期')}</div>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map((offset) => (
                  <button key={offset} type="button" onClick={() => { setPickupOffset(offset); if (dropoffOffset <= offset) setDropoffOffset(offset + 2); }} className={`px-3 py-1.5 rounded-full border-none cursor-pointer text-[13px] ${pickupOffset === offset ? 'bg-[#0086F6] text-white' : 'bg-[#F2F4F7]'}`}>{systemMonthDay(offset)}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#999] mb-2">{s.t('还车日期')}</div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((offset) => (
                  <button key={offset} type="button" disabled={offset <= pickupOffset} onClick={() => setDropoffOffset(offset)} className={`px-3 py-1.5 rounded-full border-none cursor-pointer text-[13px] ${dropoffOffset === offset ? 'bg-[#0086F6] text-white' : 'bg-[#F2F4F7]'} disabled:opacity-40`}>{systemMonthDay(offset)}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#999] mb-2">{s.t('取车时刻')}</div>
              <div className="flex flex-wrap gap-2">
                {[8, 10, 12, 14, 16, 18].map((h) => (
                  <button key={h} type="button" onClick={() => setPickupHour(h)} className={`px-3 py-1.5 rounded-full border-none cursor-pointer text-[13px] ${pickupHour === h ? 'bg-[#0086F6] text-white' : 'bg-[#F2F4F7]'}`}>{h}:00</button>
                ))}
              </div>
            </div>
            <div className="text-[13px] text-[#666]">{timeText}（共{Math.max(1, dropoffOffset - pickupOffset)}天）</div>
            <button type="button" onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('确定')}</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
