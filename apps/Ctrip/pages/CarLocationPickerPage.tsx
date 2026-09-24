import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar } from '../components/ui';
import { IcSearch } from '../res/icons';

/** 取车地点选择(spec car.locationPicker)。机场/火车站/汽车站 tab;地点条目→list。 */
const TABS = [{ id: 'airport', label: '机场' }, { id: 'train', label: '火车站' }, { id: 'bus', label: '汽车站' }, { id: 'city', label: '市区门店' }];
const PLACES: Record<string, string[]> = {
  airport: ['上海虹桥国际机场T1', '上海虹桥国际机场T2', '上海浦东国际机场T1', '上海浦东国际机场T2'],
  train: ['上海站', '上海虹桥站', '上海南站'],
  bus: ['上海长途客运总站', '虹桥汽车站'],
  city: ['人民广场门店', '陆家嘴门店', '徐家汇门店'],
};

export default function CarLocationPickerPage() {
  const { bindTap } = useCtripGestures();
  const [tab, setTab] = React.useState('airport');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="选择取车地点" />
      <div className="shrink-0 bg-white px-3 py-2">
        <div className="flex items-center bg-[#F2F4F7] rounded-full h-9 px-3 gap-2">
          <IcSearch size={16} className="text-[#999999]" />
          <span className="text-[14px] text-[#999999]">搜索机场/车站/门店</span>
        </div>
      </div>
      <div className="shrink-0 bg-white flex border-b border-[#F0F0F0]">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{t.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {(PLACES[tab] ?? []).map((p) => (
          <button key={p} {...bindTap('carLocation.select')} className="w-full text-left px-4 py-3.5 bg-white border-b border-[#F2F2F2] text-[15px] text-[#222222] border-x-0 border-t-0 cursor-pointer">{p}</button>
        ))}
      </div>
    </div>
  );
}
