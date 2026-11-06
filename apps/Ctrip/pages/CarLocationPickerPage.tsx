import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar } from '../components/ui';
import { IcSearch } from '../res/icons';

/** 取/还车地点选择：还车写入 dropoff，取车写入 location，互不覆盖。 */
const TABS = [{ id: 'airport', label: '机场' }, { id: 'train', label: '火车站' }, { id: 'bus', label: '汽车站' }, { id: 'city', label: '市区门店' }];
const PLACES: Record<string, string[]> = {
  airport: [
    '上海虹桥国际机场T1', '上海虹桥国际机场T2', '上海浦东国际机场T1', '上海浦东国际机场T2',
    '北京首都国际机场T2', '北京大兴国际机场', '杭州萧山国际机场', '成都双流国际机场', '长春龙嘉国际机场',
  ],
  train: ['上海站', '上海虹桥站', '上海南站', '北京南站', '杭州东站', '成都东站', '长春站'],
  bus: ['上海长途客运总站', '虹桥汽车站', '北京赵公口客运站'],
  city: ['人民广场门店', '陆家嘴门店', '徐家汇门店', '望京门店', '春熙路门店'],
};

export default function CarLocationPickerPage() {
  const s = useCtripStrings();
  const { bindTap } = useCtripGestures();
  const [sp] = useSearchParams();
  const locTarget = sp.get('locTarget') || 'pickup';
  const keepPickup = sp.get('location') || '';
  const keepDropoff = sp.get('dropoff') || '';
  const [tab, setTab] = React.useState('airport');
  const [q, setQ] = React.useState('');
  const places = (PLACES[tab] ?? []).filter((p) => !q.trim() || p.includes(q.trim()));

  const selectParams = (p: string) => {
    if (locTarget === 'dropoff') {
      return { location: keepPickup, dropoff: p, locTarget: 'dropoff' };
    }
    return { location: p, dropoff: keepDropoff, locTarget: 'pickup' };
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={locTarget === 'dropoff' ? s.t('选择还车地点') : s.t('选择取车地点')} />
      <div className="shrink-0 bg-white px-3 py-2">
        <div className="flex items-center bg-[#F2F4F7] rounded-full h-9 px-3 gap-2">
          <IcSearch size={16} className="text-[#999999]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索机场/车站/门店"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#333]"
          />
        </div>
      </div>
      <div className="shrink-0 bg-white flex border-b border-[#F0F0F0]">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{t.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {places.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-[#999]">{s.t('暂无匹配地点')}</div>
        ) : places.map((p) => (
          <button key={p} {...bindTap('carLocation.select', { params: selectParams(p) })} className="w-full text-left px-4 py-3.5 bg-white border-b border-[#F2F2F2] text-[15px] text-[#222222] border-x-0 border-t-0 cursor-pointer">{p}</button>
        ))}
      </div>
    </div>
  );
}
