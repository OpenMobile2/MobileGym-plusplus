import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img } from '../components/ui';
import { IcSearch, IcClose } from '../res/icons';

/**
 * 全局搜索(spec search.result):输入框联想 / 热搜chips / 历史。
 * 联想行、热搜chip → 酒店列表(结果聚合简化)。
 */
const HOT = ['上海迪士尼', '外滩', '亚朵酒店', '虹桥机场', '杭州西湖', '东方明珠'];

export default function SearchResultPage() {
  const { bindTap, back } = useCtripGestures();
  const history = useCtripStore((s) => s.searchHistory);
  const submitSearch = useCtripStore((s) => s.submitSearch);
  const removeSearchHistory = useCtripStore((s) => s.removeSearchHistory);
  const [q, setQ] = React.useState('');

  const suggestions = q.trim()
    ? [q, `${q} 酒店`, `${q} 景点门票`, `${q} 机票`]
    : [];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="shrink-0 flex items-center gap-2 px-2 py-2 border-b border-[#F0F0F0]" data-status-bar-foreground="dark">
        <div className="flex-1 flex items-center bg-[#F2F4F7] rounded-full h-9 px-3 gap-2">
          <IcSearch size={16} className="text-[#999999]" />
          <input
            {...bindTap({ kind: 'action', id: 'search.input.value' }, { onTrigger: () => {} })}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索目的地/酒店/景点/航班"
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
          />
          {q && <button onClick={() => setQ('')} className="bg-transparent border-none cursor-pointer p-0"><IcClose size={15} className="text-[#BBBBBB]" /></button>}
        </div>
        <button onClick={() => back()} className="text-[14px] text-[#333333] bg-transparent border-none cursor-pointer px-1">取消</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {suggestions.length > 0 ? (
          <div className="py-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                {...bindTap('search.toList', { beforeTrigger: () => submitSearch(s) })}
                className="w-full flex items-center gap-2.5 py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
              >
                <IcSearch size={16} className="text-[#BBBBBB]" />
                <span className="text-[14px] text-[#222222]">{s}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {history.length > 0 && (
              <div className="pt-4">
                <div className="text-[13px] text-[#999999] mb-2">历史搜索</div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <span key={h} className="flex items-center bg-[#F2F4F7] rounded-full pl-3 pr-1 py-1.5 text-[13px] text-[#444444]">
                      <button {...bindTap('search.chip-toList')} className="bg-transparent border-none cursor-pointer p-0 text-[13px] text-[#444444]">{h}</button>
                      <button onClick={() => removeSearchHistory(h)} className="ml-1 bg-transparent border-none cursor-pointer p-0"><IcClose size={13} className="text-[#BBBBBB]" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-5">
              <div className="text-[13px] text-[#999999] mb-2">热门搜索</div>
              <div className="flex flex-wrap gap-2">
                {HOT.map((h) => (
                  <button key={h} {...bindTap('search.chip-toList')} className="bg-[#F2F4F7] rounded-full px-3 py-1.5 text-[13px] text-[#444444] border-none cursor-pointer">{h}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
