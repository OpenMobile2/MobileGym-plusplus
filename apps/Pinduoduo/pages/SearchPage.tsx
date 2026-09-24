import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { IcNavBack, IcSearch, IcTrash } from '../res/icons';

export function SearchPage() {
  const { bindTap, bindBack } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const searchHistory = usePinduoduoStore((st) => st.searchHistory);
  const hotSearch = usePinduoduoStore((st) => st.hotSearch);
  const allItems = usePinduoduoStore((st) => st.items);
  const addSearchHistory = usePinduoduoStore((st) => st.addSearchHistory);
  const clearSearchHistory = usePinduoduoStore((st) => st.clearSearchHistory);
  const [query, setQuery] = useState('');

  const q = query.trim();
  const suggestions = q
    ? Array.from(
        new Set([
          ...hotSearch.filter((w) => w.includes(q)),
          ...allItems.filter((i) => i.title.includes(q) || i.category.includes(q)).map((i) => i.title.slice(0, 16)),
          `${q} 包邮`,
          `${q} 旗舰店`,
          `${q} 百亿补贴`,
        ]),
      ).slice(0, 10)
    : [];

  return (
    <div className="h-full flex flex-col pt-10 overflow-hidden bg-white" data-status-bar-foreground="dark">
      {/* 顶部:返回 + 输入框 + 搜索按钮 */}
      <div className="shrink-0 h-12 flex items-center gap-1 px-1.5 border-b border-[#F0F0F0]">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={24} />
        </button>
        <div className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5">
          <IcSearch size={16} className="text-[#999]" />
          <input
            {...bindTap({ kind: 'action', id: 'search.input.type' }, { params: { value: query }, onTrigger: () => {} })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.search_placeholder}
            className="flex-1 bg-transparent text-[14px] text-[#333] outline-none placeholder:text-[#BBB]"
          />
        </div>
        <button
          {...bindTap('search.submit', {
            params: { q: query },
            onTrigger: () => addSearchHistory(query),
          })}
          className="px-3 text-[15px] text-[#E22E1F] font-medium"
        >
          {s.btn_search}
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container
        data-scroll-direction="vertical"
      >
        {/* 联想词(输入时) */}
        {suggestions.length > 0 && (
          <div className="flex flex-col">
            {suggestions.map((word) => (
              <button
                key={word}
                {...bindTap('search.suggest-open', { params: { q: word } })}
                className="flex items-center gap-2 px-3 h-11 border-b border-[#F5F5F5] text-left"
              >
                <IcSearch size={16} className="text-[#BBB]" />
                <span className="text-[14px] text-[#333] truncate">{word}</span>
              </button>
            ))}
          </div>
        )}

        {/* 最近搜索(无输入时) */}
        {suggestions.length === 0 && searchHistory.length > 0 && (
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] text-[#333] font-medium">最近搜索</span>
              <button
                {...bindTap(
                  { kind: 'action', id: 'search.history.clear' },
                  { onTrigger: clearSearchHistory },
                )}
                aria-label="清空搜索历史"
                className="w-7 h-7 flex items-center justify-center text-[#999]"
              >
                <IcTrash size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((word) => (
                <button
                  key={word}
                  {...bindTap('search.suggest-open', { params: { q: word } })}
                  className="px-3 py-1.5 rounded-full bg-[#F5F5F5] text-[13px] text-[#333]"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索发现(无输入时) */}
        {suggestions.length === 0 && (
        <div className="px-3 pt-4">
          <div className="text-[14px] text-[#333] font-medium mb-2">搜索发现</div>
          <div className="flex flex-wrap gap-2">
            {hotSearch.map((word) => (
              <button
                key={word}
                {...bindTap('search.suggest-open', { params: { q: word } })}
                className="px-3 py-1.5 rounded-full bg-[#FFF0E8] text-[13px] text-[#E22E1F]"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
