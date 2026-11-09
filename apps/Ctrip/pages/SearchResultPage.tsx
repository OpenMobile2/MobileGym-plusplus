import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { IcSearch, IcClose } from '../res/icons';
import { resolveSearchCity } from '../utils/searchCity';

/**
 * 全局搜索:景点精确命中→景点详情；目的地词→城市页；其余→酒店列表。
 */
const HOT = ['上海迪士尼', '长春', '亚朵酒店', '成都·九眼桥', '杭州西湖', '北京王府井'];

function isOrderedSubsequence(query: string, target: string): boolean {
  let index = 0;
  for (const char of target) {
    if (char === query[index]) index += 1;
    if (index === query.length) return true;
  }
  return false;
}

export default function SearchResultPage() {
  const s = useCtripStrings();
  const { bindTap, back, go } = useCtripGestures();
  const history = useCtripStore((st) => st.searchHistory);
  const submitSearch = useCtripStore((st) => st.submitSearch);
  const setHotelCity = useCtripStore((st) => st.setHotelCity);
  const removeSearchHistory = useCtripStore((st) => st.removeSearchHistory);
  const storeCity = useCtripStore((st) => st.hotelCity);
  const hotels = useCtripStore((st) => st.hotels);
  const attractions = useCtripStore((st) => st.attractions);
  const [q, setQ] = React.useState('');

  const suggestions = q.trim()
    ? [q.trim(), `${q.trim()} 酒店`, `${q.trim()} 景点门票`, `${q.trim()} 机票`]
    : [];

  const jumpSearchResult = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const city = resolveSearchCity(text, storeCity || '上海');
    submitSearch(text);
    const compact = text.replace(/[\s·/景点门票酒店]/g, '');
    const attraction = attractions.find((item) => {
      const name = item.name.replace(/\s/g, '');
      return compact.includes(name) || name.includes(compact) || isOrderedSubsequence(compact, name);
    });
    if (attraction) {
      go('search.toAttraction', { id: attraction.id });
      return;
    }
    const hotel = hotels.find((item) => {
      const name = item.name.replace(/\s/g, '');
      return compact.includes(name) || name.includes(compact);
    });
    if (!hotel && compact === city) {
      go('search.toDestination', { city });
      return;
    }
    setHotelCity(city);
    go('search.toList', { city, q: text });
  };

  const bindSearchJump = (raw: string) => {
    const text = raw.trim();
    return bindTap({ kind: 'action', id: 'search.submit.smart' }, {
      params: { value: text },
      onTrigger: () => jumpSearchResult(text),
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="shrink-0 flex items-center gap-2 px-2 py-2 border-b border-[#F0F0F0]" data-status-bar-foreground="dark">
        <div className="flex-1 flex items-center bg-[#F2F4F7] rounded-full h-9 px-3 gap-2">
          <button
            type="button"
            {...(q.trim()
              ? bindSearchJump(q)
              : bindTap({ kind: 'action', id: 'search.input.value' }, { onTrigger: () => {} }))}
            className="bg-transparent border-none cursor-pointer p-0 flex items-center"
            aria-label={s.t('搜索')}
          >
            <IcSearch size={16} className="text-[#999999]" />
          </button>
          <input
            {...bindTap({ kind: 'action', id: 'search.input.value' }, { params: { value: q } })}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && q.trim()) jumpSearchResult(q);
            }}
            placeholder={s.t('搜索目的地/酒店/景点/航班')}
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
          />
          {q && <button onClick={() => setQ('')} className="bg-transparent border-none cursor-pointer p-0"><IcClose size={15} className="text-[#BBBBBB]" /></button>}
        </div>
        <button
          type="button"
          {...(q.trim()
            ? bindSearchJump(q)
            : bindTap({ kind: 'action', id: 'search.cancel' }, { onTrigger: () => back() }))}
          className="text-[14px] text-[#0086F6] bg-transparent border-none cursor-pointer px-1 shrink-0"
        >{q.trim() ? s.t('搜索') : s.t('取消')}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {suggestions.length > 0 ? (
          <div className="py-1">
            {suggestions.map((text, i) => (
              <button
                key={`${text}-${i}`}
                {...bindSearchJump(text)}
                className="w-full flex items-center gap-2.5 py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
              >
                <IcSearch size={16} className="text-[#BBBBBB]" />
                <span className="text-[14px] text-[#222222]">{text}</span>
                <span className="ml-auto text-[11px] text-[#999999]">{resolveSearchCity(text, storeCity || '上海')}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {history.length > 0 && (
              <div className="pt-4">
                <div className="text-[13px] text-[#999999] mb-2">{s.t('历史搜索')}</div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <span key={h} className="flex items-center bg-[#F2F4F7] rounded-full pl-3 pr-1 py-1.5 text-[13px] text-[#444444]">
                      <button {...bindSearchJump(h)} className="bg-transparent border-none cursor-pointer p-0 text-[13px] text-[#444444]">{h}</button>
                      <button onClick={() => removeSearchHistory(h)} className="ml-1 bg-transparent border-none cursor-pointer p-0"><IcClose size={13} className="text-[#BBBBBB]" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-5">
              <div className="text-[13px] text-[#999999] mb-2">{s.t('热门搜索')}</div>
              <div className="flex flex-wrap gap-2">
                {HOT.map((h) => (
                  <button key={h} {...bindSearchJump(h)} className="bg-[#F2F4F7] rounded-full px-3 py-1.5 text-[13px] text-[#444444] border-none cursor-pointer">{h}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
