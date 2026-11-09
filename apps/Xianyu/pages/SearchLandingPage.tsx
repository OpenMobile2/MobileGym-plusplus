import React, { useState } from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useToast } from '../components/ui';
import { IcNavBack, IcSearch, IcCamera, IcSparkles, IcDelete } from '../res/icons';

export default function SearchLandingPage() {
  const { bindTap, bindBack, go } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const hotSearches = useXianyuStore((s) => s.hotSearches);
  const searchHistory = useXianyuStore((s) => s.searchHistory);
  const clearSearchHistory = useXianyuStore((s) => s.clearSearchHistory);

  const [q, setQ] = useState('');
  const [aiOn, setAiOn] = useState(true);

  const placeholder = hotSearches[0] ?? '二手好物';
  const keyword = q.trim() || placeholder;

  // 前两条热词作「猜你可能在找」,其余作「闲鱼热搜」
  const guess = hotSearches.slice(0, 4);
  const hot = hotSearches.slice(4);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      {/* 顶部搜索栏 */}
      <div className="bg-white shrink-0 flex items-center gap-1 px-2 py-2">
        <button {...bindBack()} aria-label="返回" className="bg-transparent border-none cursor-pointer p-1 text-[#111]">
          <IcNavBack size={26} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#F4F4F4] rounded-full h-9 px-3">
          <IcSearch size={17} className="text-[#999999]" />
          <input
            {...bindTap({ kind: 'action', id: 'search.keyword.input' }, { onTrigger: () => {} })}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') go('search.submit-open', { keyword }); }}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#111] placeholder:text-[#999999]"
          />
          <button
            onClick={() => showToast('该功能暂未开放')}
            aria-label="相机识图"
            className="bg-transparent border-none cursor-pointer p-0 text-[#666]"
          >
            <IcCamera size={18} />
          </button>
        </div>
        <button
          {...bindTap('search.submit-open', { params: { keyword } })}
          className="bg-transparent border-none cursor-pointer text-[15px] text-[#111] font-medium px-1"
        >
          搜索
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="SearchLandingPage-main"
        data-scroll-direction="vertical"
      >
        {/* AI 智搜开关 */}
        <div className="bg-white flex items-center gap-2 px-3 py-2.5 border-b border-[#F2F2F2]">
          <IcSparkles size={16} className="text-[#FF8A00]" />
          <span className="text-[13px] text-[#111] flex-1">AI 智搜 · 更懂你的搜索</span>
          <button
            {...bindTap({ kind: 'action', id: 'search.aiToggle.toggle' }, { onTrigger: () => setAiOn((v) => !v) })}
            aria-label="AI 智搜开关"
            className={`relative w-10 h-6 rounded-full border-none cursor-pointer transition-colors ${aiOn ? 'bg-[#FFE411]' : 'bg-[#DDDDDD]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${aiOn ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>

        {/* 猜你可能在找 */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="text-[14px] font-semibold text-[#111] mb-2">猜你可能在找</div>
          <div className="flex flex-wrap gap-2">
            {guess.map((w) => (
              <button
                key={w}
                {...bindTap('search.submit-open', { params: { keyword: w } })}
                className="text-[13px] text-[#333] bg-[#F4F4F4] rounded-full px-3 py-1.5 border-none cursor-pointer"
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* 闲鱼热搜 */}
        {hot.length > 0 && (
          <div className="bg-white mt-2 px-3 py-3">
            <div className="text-[14px] font-semibold text-[#111] mb-2">闲鱼热搜</div>
            <div className="flex flex-wrap gap-2">
              {hot.map((w, i) => (
                <button
                  key={w}
                  {...bindTap('search.submit-open', { params: { keyword: w } })}
                  className="text-[13px] text-[#333] bg-[#FFF7E0] rounded-full px-3 py-1.5 border-none cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="text-[#FF3B30] font-bold text-[12px]">{i + 1}</span>{w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索历史 */}
        {searchHistory.length > 0 && (
          <div className="bg-white mt-2 px-3 py-3">
            <div className="flex items-center mb-2">
              <span className="text-[14px] font-semibold text-[#111] flex-1">搜索历史</span>
              <button
                {...bindTap({ kind: 'action', id: 'search.history.clear' }, { onTrigger: () => clearSearchHistory() })}
                aria-label="清空历史"
                className="bg-transparent border-none cursor-pointer text-[#999] p-0"
              >
                <IcDelete size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((w) => (
                <button
                  key={w}
                  {...bindTap('search.submit-open', { params: { keyword: w } })}
                  className="text-[13px] text-[#666] bg-[#F4F4F4] rounded-full px-3 py-1.5 border-none cursor-pointer"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {toast}
    </div>
  );
}
