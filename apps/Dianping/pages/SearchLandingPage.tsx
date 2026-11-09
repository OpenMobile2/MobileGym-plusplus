import React, { useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { HOT_SEARCHES } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcSearch } from '../res/icons';

export default function SearchLandingPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action, go } = useDianpingGestures();
  const history = useDianpingStore((st) => st.searchHistory);
  const addSearchHistory = useDianpingStore((st) => st.addSearchHistory);
  const clearSearchHistory = useDianpingStore((st) => st.clearSearchHistory);
  const [q, setQ] = useState('');

  const submit = (query: string) => {
    const t = query.trim();
    if (!t) return;
    addSearchHistory(t);
    go('search.submit', { q: t });
  };

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex h-11 items-center gap-2 px-2">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="flex h-9 flex-1 items-center rounded-full bg-[#F5F5F5] px-3">
          <IcSearch size={15} className="text-[#999]" />
          <input
            className="ml-1.5 w-full border-none bg-transparent text-[13px] outline-none"
            placeholder={s.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit(q);
            }}
          />
        </div>
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent px-1 text-[14px] font-medium text-[#FF6633]"
          {...action('search.hot.select.target', () => submit(q || HOT_SEARCHES[0]), {
            params: { q: q || HOT_SEARCHES[0] },
          })}
        >
          {s.search}
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto px-3 pt-3"
        data-scroll-container="search-landing"
        data-scroll-direction="vertical"
      >
        {history.length > 0 ? (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#222]">{s.searchHistory}</span>
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent text-[12px] text-[#999]"
                {...action('search.history.clear.action', () => clearSearchHistory())}
              >
                {s.clear}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={h}
                  type="button"
                  className="cursor-pointer rounded-full border-none bg-[#F5F5F5] px-3 py-1.5 text-[12px] text-[#333]"
                  {...action('search.hot.select.target', () => submit(h), { params: { q: h } })}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mb-2 text-[13px] font-semibold text-[#222]">{s.hotSearch}</div>
        <div className="flex flex-wrap gap-2">
          {HOT_SEARCHES.map((h) => (
            <button
              key={h}
              type="button"
              className="cursor-pointer rounded-full border-none bg-[#FFF1EA] px-3 py-1.5 text-[12px] text-[#FF6633]"
              {...action('search.hot.select.target', () => submit(h), { params: { q: h } })}
            >
              {h}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
