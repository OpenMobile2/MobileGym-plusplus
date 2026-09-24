import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { CITY_GROUPS } from '../constants';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcSearch } from '../res/icons';

const LETTERS = 'ABCDEFGHJKLMNPQRSTWXYZ'.split('');

/** 城市/地铁商圈筛选(IMG_8418) */
const CityFilterPage: React.FC = () => {
  const { bindTap, action, back } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const [selected, setSelected] = useState(store.city);
  const [query, setQuery] = useState('');
  const recentCities = [...store.cityHistory, store.city].filter((city, index, cities) => cities.indexOf(city) === index);

  const allGroups = CITY_GROUPS.map((g) => ({
    ...g,
    cities: query ? g.cities.filter((c) => c.includes(query)) : g.cities,
  }));

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="城市/地铁商圈" />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[17px] font-semibold text-gray-900">城市</div>
        <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
          当前仅展示本次筛选城市结果,若需要更改工作城市,可切换「求职期望工作城市」
          <span style={{ color: COLORS.accent }}>去设置&gt;</span>
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5">
          <IcSearch size={16} className="text-gray-400" />
          <input
            {...({ 'data-action': 'city.search.input', 'data-action-type': 'input' } as object)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索城市名/拼音"
            className="w-full bg-transparent text-[14px] outline-none"
          />
        </div>

        <div className="mt-5 text-[16px] font-semibold text-gray-900">当前/历史访问城市</div>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          {recentCities.map((city) => (
            <button
              key={city}
              {...action('city.select.item', () => setSelected(city), { params: { city } })}
              className="rounded-lg px-3 py-2.5 text-[14px]"
              style={selected === city ? { backgroundColor: '#E6F5F4', color: COLORS.primary } : { backgroundColor: '#F5F5F5', color: '#374151' }}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="mt-5 text-[16px] font-semibold text-gray-900">推荐城市</div>
        {allGroups.map((g) => (
          <div key={g.title} className="mt-3">
            <div className="text-[13px] text-gray-500">{g.title}</div>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              {g.cities.map((c) => (
                <button
                  key={`${g.title}-${c}`}
                  {...action('city.select.item', () => setSelected(c), { params: { city: c } })}
                  className="rounded-lg px-3 py-2.5 text-[14px]"
                  style={selected === c ? { backgroundColor: '#E6F5F4', color: COLORS.primary } : { backgroundColor: '#F5F5F5', color: '#374151' }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-5 text-[13px] text-gray-500">相近城市圈</div>
        <div className="mt-2 text-[15px] font-semibold text-gray-900">已选</div>
        <div className="mt-1 text-[14px] text-gray-600">{selected}</div>

        {/* 右侧字母索引(装饰) */}
        <div className="pointer-events-none absolute right-1 top-40 flex flex-col items-center gap-0.5 text-[10px] text-gray-400">
          {LETTERS.map((l) => <span key={l}>{l}</span>)}
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-white px-4 py-3" data-keep-keyboard="true">
        <button
          {...action('city.selection.clear', () => setSelected(''))}
          className="w-28 rounded-full bg-[#F0F1F3] py-3 text-center text-[15px] text-gray-700"
        >
          {t.clear}
        </button>
        <button
          {...bindTap('city.confirm', { beforeTrigger: () => { if (selected) store.setCity(selected); }, onTrigger: () => back() })}
          className="flex-1 rounded-full py-3 text-center text-[15px] font-medium text-white"
          style={{ backgroundColor: COLORS.primaryBtn }}
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );
};

export default CityFilterPage;
