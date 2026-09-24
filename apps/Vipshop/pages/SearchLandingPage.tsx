import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { useToast, VIP } from '../components/ui';
import { IcNavBack, IcSearch, IcDelete } from '../res/icons';

export default function SearchLandingPage() {
  const { bindTap, bindBack } = useVipshopGestures();
  const [toast] = useToast();

  const searchHistory = useVipshopStore((s) => s.searchHistory);
  const hotSearches = useVipshopStore((s) => s.hotSearches);
  const clearSearchHistory = useVipshopStore((s) => s.clearSearchHistory);

  const [keyword, setKeyword] = useState('');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部:返回 + 搜索输入框 */}
      <div className="shrink-0 flex items-center gap-2 px-2 h-11 border-b border-[#EEEEEE]">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcNavBack size={24} className="text-[#222222]" />
        </button>
        <div className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5">
          <IcSearch size={15} className="text-[#888888]" />
          <input
            {...(bindTap('searchLanding.suggest-open', { params: { q: keyword } }) as any)}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="雪纺连衣裙"
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#222222] placeholder:text-[#BBBBBB]"
          />
        </div>
        <button
          {...bindTap('searchLanding.suggest-open', { params: { q: keyword } })}
          className="text-[14px] bg-transparent border-none cursor-pointer px-1"
          style={{ color: VIP.primary }}
        >
          搜索
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-landing" data-scroll-direction="vertical">
        {/* 历史搜索 */}
        {searchHistory.length > 0 && (
          <div className="px-3 pt-3">
            <div className="flex items-center">
              <span className="text-[14px] font-semibold text-[#222222] flex-1">历史搜索</span>
              <button
                {...bindTap({ kind: 'action', id: 'searchLanding.clearHistory.submit' }, { onTrigger: () => clearSearchHistory() })}
                className="bg-transparent border-none cursor-pointer text-[#888888]"
                aria-label="清空历史"
              >
                <IcDelete size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {searchHistory.map((word) => (
                <button
                  key={word}
                  {...bindTap('searchLanding.history-open', { params: { q: word } })}
                  className="text-[12px] rounded-full px-3 py-1.5 border-none cursor-pointer text-[#333333] bg-[#F5F5F5]"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 猜你想搜 */}
        <div className="px-3 pt-4">
          <span className="text-[14px] font-semibold text-[#222222]">猜你想搜</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {hotSearches.slice(0, 6).map((word) => (
              <button
                key={word}
                {...bindTap('searchLanding.hot-open', { params: { q: word } })}
                className="text-[12px] rounded-full px-3 py-1.5 border-none cursor-pointer text-[#333333]"
                style={{ background: '#FDECF5', color: VIP.primary }}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* 唯YOUNG热榜 */}
        <div className="px-3 pt-5">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-[#222222]">唯YOUNG热榜</span>
            <span className="text-[10px] text-white rounded px-1 py-0.5" style={{ background: VIP.red }}>HOT</span>
          </div>
          <div className="mt-2 flex flex-col">
            {hotSearches.map((word, i) => (
              <button
                key={word}
                {...bindTap('searchLanding.hot-open', { params: { q: word } })}
                className="flex items-center gap-2.5 py-2 bg-transparent border-none cursor-pointer text-left"
              >
                <span
                  className="w-5 text-center text-[14px] font-bold"
                  style={{ color: i < 3 ? VIP.red : '#BBBBBB' }}
                >
                  {i + 1}
                </span>
                <span className="text-[14px] text-[#222222] flex-1">{word}</span>
                {i < 3 && <span className="text-[10px] text-[#FF7A00]">热</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}
