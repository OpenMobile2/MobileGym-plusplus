import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img, Price, BottomSheet, usePanel, EmptyState } from '../components/ui';
import { systemMonthDay } from '../utils/travelDate';

/** 租车车型列表：顶栏展示取车地点。 */
export default function CarListPage() {
  const s = useCtripStrings();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [sp] = useSearchParams();
  const location = sp.get('location') || '上海虹桥机场T2';
  const pickupDate = sp.get('pickupDate') || systemMonthDay();
  const dropoffDate = sp.get('dropoffDate') || systemMonthDay(2);
  const pickupHour = sp.get('pickupHour') || '10';
  const cars = useCtripStore((st) => st.carModels);
  const [seat, setSeat] = React.useState<string | null>(null);
  const [energy, setEnergy] = React.useState<string | null>(null);
  const [service, setService] = React.useState<string | null>(null);

  const list = React.useMemo(() => {
    return cars.filter((c) => {
      if (seat === s.t('5座') && !/5座/.test(c.seats)) return false;
      if (seat === s.t('7座') && !/7座/.test(c.seats)) return false;
      if (seat === 'SUV' && !/SUV/i.test(c.seats) && !/SUV/i.test(c.name)) return false;
      if (energy === s.t('纯电') && !/电|纯电|EV/i.test(c.energy)) return false;
      if (energy === s.t('汽油') && !/油|汽油/.test(c.energy)) return false;
      if (energy === s.t('混动') && !/混/.test(c.energy)) return false;
      if (service === s.t('含无忧租') && !c.tags.some((t) => t.includes('无忧'))) return false;
      if (service === 'ETC' && !c.tags.some((t) => t.includes('ETC'))) return false;
      if (service === s.t('免押') && !c.tags.some((t) => t.includes('免押'))) return false;
      return true;
    });
  }, [cars, seat, energy, service, s]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('选择车型')} />
      <button {...bindTap({ kind: 'action', id: 'carList.editPickup.open' }, { onTrigger: () => open('edit') })} className="shrink-0 w-full bg-white px-4 py-2.5 text-left border-b border-[#F0F0F0] border-x-0 border-t-0 cursor-pointer flex items-center justify-between">
        <span className="text-[13px] text-[#333333] line-clamp-1">{location} 取 · {pickupDate} {pickupHour.padStart(2, '0')}:00 → {dropoffDate} {pickupHour.padStart(2, '0')}:00</span>
        <span className="text-[13px] text-[#0086F6]">{s.t('修改')}</span>
      </button>

      <div className="shrink-0 bg-white flex text-[13px] text-[#333333] border-b border-[#F0F0F0]">
        <button {...bindTap({ kind: 'action', id: 'carList.filter.open' }, { onTrigger: () => open('filter') })} className={`flex-1 py-2 bg-transparent border-none cursor-pointer ${seat || energy || service ? 'text-[#0086F6]' : ''}`}>综合排序 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'carList.filter.open' }, { onTrigger: () => open('filter') })} className={`flex-1 py-2 bg-transparent border-none cursor-pointer ${seat ? 'text-[#0086F6]' : ''}`}>座位/配置 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'carList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">更多筛选 ▾</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={s.t('暂无符合筛选的车型')} hint={s.t('试试清空座位/能源条件')} />
        ) : list.map((c) => (
          <div key={c.id} {...bindTap('carList.toDetail', { params: { id: c.id } })} className="bg-white mx-2 mt-2 rounded-xl p-3 cursor-pointer">
            <div className="flex gap-3">
              <Img src={c.image} className="w-28 h-20 object-contain shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold line-clamp-1">{c.name}</div>
                <div className="text-[11px] text-[#999999] mt-1">{c.seats} · {c.energy} · {c.range}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.tags.slice(0, 3).map((t) => <span key={t} className="text-[10px] text-[#0086F6] bg-[#EAF4FF] rounded px-1">{t}</span>)}
                </div>
                <div className="mt-2 text-right"><Price value={c.totalPrice} size="m" /><span className="text-[11px] text-[#999]"> /2天</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {panel === 'filter' && (
        <BottomSheet title={s.t('筛选')} onClose={close}>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-[13px] text-[#999999] mb-2">{s.t('座位')}</div>
              <div className="flex flex-wrap gap-2">
                {[s.t('5座'), s.t('7座'), 'SUV'].map((o) => (
                  <button key={o} type="button" {...bindTap({ kind: 'action', id: 'carList.filter.open' }, { params: { opt: o }, onTrigger: () => setSeat((x) => (x === o ? null : o)) })} className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${seat === o ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#999999] mb-2">{s.t('能源')}</div>
              <div className="flex flex-wrap gap-2">
                {[s.t('纯电'), s.t('汽油'), s.t('混动')].map((o) => (
                  <button key={o} type="button" {...bindTap({ kind: 'action', id: 'carList.filter.open' }, { params: { opt: o }, onTrigger: () => setEnergy((x) => (x === o ? null : o)) })} className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${energy === o ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{o}</button>
                ))}
              </div>
            </div>
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('确定')}</button>
          </div>
        </BottomSheet>
      )}
      {panel === 'edit' && (
        <BottomSheet title={s.t('修改取还车')} onClose={close}>
          <div className="p-4 text-[13px] text-[#666]">
            当前取车点：{location}
            <button {...bindTap('carHome.toLocation')} className="w-full mt-4 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('重新选择地点')}</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
