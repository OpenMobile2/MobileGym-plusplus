import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { COLORS } from '../res/colors';
import { IcBack, IcTrash, IcSearch } from '../res/icons';

/** 搜索页(IMG_8503):输入 + AI问闪闪开关 + 历史搜索 + 搜索发现 */
const SearchLandingPage: React.FC = () => {
  const { bindTap, action, bindBack } = useBossGestures();
  const store = useBossStore();
  const searchHistory = useBossStore((s) => s.searchHistory);
  const [query, setQuery] = useState('');

  const submitBind = bindTap('search.submit', {
    params: { kw: query },
    beforeTrigger: () => { if (query) store.addSearchHistory(query); },
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-4 pt-12">
        <div className="rounded-xl border-2 px-3 py-2" style={{ borderColor: COLORS.primary }}>
          <div className="flex items-center gap-2">
            <button {...bindBack()} className="-m-1 p-1 text-gray-500" aria-label="返回"><IcBack size={18} /></button>
            <input
              {...({ 'data-action': 'search.query.input', 'data-action-type': 'input' } as object)}
              data-keep-keyboard="true"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="嵌入式linux"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-300"
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <button
              {...action('search.ai.toast', () => store.showNotice('AI 问闪闪暂未开放，请点击“我知道了”继续使用普通搜索。'), { params: {} })}
              className="flex items-center gap-1 rounded-full bg-[#F0F1F3] px-2 py-1 text-[12px] text-gray-600"
            >
              <span className="font-semibold">Ai</span> 问闪闪
              <span className="ml-1 inline-block h-3.5 w-6 rounded-full bg-gray-300 p-0.5"><span className="block h-2.5 w-2.5 rounded-full bg-white" /></span>
            </button>
            <button {...submitBind} data-keep-keyboard="true" className="rounded-lg px-4 py-1.5 text-[14px] font-medium text-white" style={{ backgroundColor: COLORS.primaryBtn }}>
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {searchHistory.length > 0 && (
          <>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[17px] font-semibold text-gray-900">历史搜索</span>
              <button {...action('search.history.clear', () => store.clearSearchHistory())} className="p-1 text-gray-400" aria-label="清空历史">
                <IcTrash size={16} />
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {searchHistory.map((kw) => (
                <button key={kw} {...bindTap('search.history-open', { params: { kw } })} className="rounded-lg bg-[#F5F5F5] px-3 py-2 text-[13px] text-gray-700">
                  {kw}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[17px] font-semibold text-gray-900">搜索发现</span>
          <span className="flex items-center gap-2 text-gray-400"><IcSearch size={15} /></span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
          {BOSS_CONFIG.searchDiscover.map((kw, i) => (
            <button key={kw} {...bindTap('search.discover-open', { params: { kw } })} className="flex items-center gap-1 truncate text-left text-[14px] text-gray-700">
              <span className="truncate">{kw}</span>
              {(i === 4 || i === 8) && <span className="shrink-0 rounded bg-[#FF5F2E] px-1 text-[10px] text-white">热</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchLandingPage;
