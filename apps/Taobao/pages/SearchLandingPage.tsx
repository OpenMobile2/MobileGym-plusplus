import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { IcNavBack, IcCamera, IcDelete, IcClose } from '../res/icons';

/**
 * 搜索中间页 + 联想态(spec: search.landing / search.suggest)
 * 输入非空 → 联想列表;空 → 历史/猜你想搜/搜索发现。
 * 历史删除:垃圾桶进入删除态,逐个 X(qa:Q3)。
 */
export default function SearchLandingPage() {
  const { bindTap, bindBack, go } = useTaobaoGestures();
  const history = useTaobaoStore((s) => s.searchHistory);
  const discover = useTaobaoStore((s) => s.searchDiscover);
  const hot = useTaobaoStore((s) => s.hotSearch);
  const items = useTaobaoStore((s) => s.items);
  const submitSearch = useTaobaoStore((s) => s.submitSearch);
  const removeSearchHistory = useTaobaoStore((s) => s.removeSearchHistory);
  const [, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);

  // 联想态是声明的 uiState(taobao.search.suggest,q='*'),输入同步到 URL(replace,不污染历史)
  const updateQuery = (v: string) => {
    setQ(v);
    setSearchParams((p) => {
      if (v.trim()) p.set('q', v.trim());
      else p.delete('q');
      return p;
    }, { replace: true });
  };

  const submit = (word: string) => {
    const w = word.trim();
    if (!w) return;
    submitSearch(w);
    go('search.submit', { q: w });
  };

  // 联想:商品标题/搜索发现词的前缀与包含匹配
  const suggests = q.trim()
    ? [
        ...new Set(
          [...discover, ...hot, ...items.map((i) => i.title.split(' ')[0] + ' ' + i.title.split(' ')[1])]
            .filter((w) => w.toLowerCase().includes(q.trim().toLowerCase())),
        ),
      ].slice(0, 10)
    : [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 搜索头 */}
      <div className="flex items-center gap-2 px-2 h-12 shrink-0">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer">
          <IcNavBack size={24} className="text-[#111111]" />
        </button>
        <div className="flex-1 flex items-center bg-[#F5F5F5] rounded-full h-9 px-3 gap-2">
          <input
            autoFocus
            value={q}
            {...bindTap({ kind: 'action', id: 'search.input.type' }, { onTrigger: () => {} })}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(q); }}
            placeholder="搜索宝贝"
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
            data-keep-keyboard="true"
          />
          {q && (
            <button onClick={() => updateQuery('')} className="bg-transparent border-none cursor-pointer p-0">
              <IcClose size={15} className="text-[#999999]" />
            </button>
          )}
          <IcCamera size={17} className="text-[#666666]" />
        </div>
        <button
          {...bindTap('search.submit', {
            params: { q },
            beforeTrigger: () => submitSearch(q),
          })}
          className="bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[14px] rounded-full px-4 py-1.5 border-none cursor-pointer"
        >
          搜索
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="search-landing" data-scroll-direction="vertical">
        {q.trim() ? (
          /* 联想列表 */
          <div>
            {suggests.map((w) => (
              <div
                key={w}
                {...bindTap('search.submit', { params: { q: w }, beforeTrigger: () => submitSearch(w) })}
                className="flex items-center gap-2 h-11 border-b border-[#F5F5F5] cursor-pointer"
              >
                <span className="text-[#CCCCCC]">⌕</span>
                <span className="text-[14px]">
                  <span className="text-[#FF5000]">{w.slice(0, q.length)}</span>
                  {w.slice(q.length)}
                </span>
              </div>
            ))}
            {suggests.length === 0 && (
              <div className="text-[13px] text-[#999999] py-6 text-center">无联想结果,回车直接搜索</div>
            )}
          </div>
        ) : (
          <>
            {/* 历史搜索 */}
            {history.length > 0 && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[14px] font-semibold">历史搜索</span>
                  <button
                    {...bindTap({ kind: 'action', id: 'search.history.deleteMode.toggle' }, {
                      onTrigger: () => setDeleteMode((m) => !m),
                    })}
                    className="bg-transparent border-none cursor-pointer text-[#999999]"
                  >
                    {deleteMode ? <span className="text-[12px]">完成</span> : <IcDelete size={15} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((w) => (
                    <span key={w} className="relative">
                      <button
                        {...bindTap('search.submit', { params: { q: w }, beforeTrigger: () => submitSearch(w) })}
                        className="bg-[#F5F5F5] text-[#333333] text-[13px] rounded-full px-3 py-1.5 border-none cursor-pointer"
                      >
                        {w}
                      </button>
                      {deleteMode && (
                        <button
                          {...bindTap({ kind: 'action', id: 'search.history.item.delete' }, {
                            params: { word: w },
                            onTrigger: () => removeSearchHistory(w),
                          })}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#999999] text-white text-[9px] leading-4 border-none cursor-pointer p-0"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 猜你想搜 */}
            <div className="mt-5">
              <div className="text-[14px] font-semibold mb-2">猜你想搜</div>
              <div className="grid grid-cols-2 gap-x-4">
                {hot.map((w) => (
                  <div
                    key={w}
                    {...bindTap('search.submit', { params: { q: w }, beforeTrigger: () => submitSearch(w) })}
                    className="h-9 leading-9 text-[13px] text-[#333333] truncate cursor-pointer"
                  >
                    {w}
                  </div>
                ))}
              </div>
            </div>

            {/* 搜索发现 */}
            <div className="mt-3">
              <div className="text-[14px] font-semibold mb-2">搜索发现</div>
              <div className="grid grid-cols-2 gap-x-4">
                {discover.map((w) => (
                  <div
                    key={w}
                    {...bindTap('search.submit', { params: { q: w }, beforeTrigger: () => submitSearch(w) })}
                    className="h-9 leading-9 text-[13px] text-[#666666] truncate cursor-pointer"
                  >
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
