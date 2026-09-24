import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, NOT_OPEN, MY, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcSearch, IcTrash, IcNavBack } from '../res/icons';
import { FUN_CATEGORIES } from '../constants';

/** 搜索中间页(anchor_search_landing.jpg) */
export default function SearchLandingPage() {
  const statusFg = useStatusBarFg();
  const { bindTap, bindBack, go } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [q, setQ] = React.useState('');

  const searchHistory = useMaoyanStore((st) => st.searchHistory);
  const hotSearch = useMaoyanStore((st) => st.hotSearch);
  const wishRank = useMaoyanStore((st) => st.wishRank);
  const scenics = useMaoyanStore((st) => st.scenics);
  const submitSearch = useMaoyanStore((st) => st.submitSearch);
  const clearSearchHistory = useMaoyanStore((st) => st.clearSearchHistory);

  const doSearch = (word: string) => {
    if (!word.trim()) return;
    submitSearch(word);
  };

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground={statusFg}>
      {toast}
      {/* 搜索栏 */}
      <div className="shrink-0 flex items-center gap-1 px-2 py-2 bg-app-surface">
        <button {...bindBack()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcNavBack size={22} className="text-[#DC4038]" />
        </button>
        <div className="flex-1 flex items-center h-9 rounded-full bg-(--app-c-fill) px-3 gap-1.5">
          <IcSearch size={15} className="text-(--app-c-text-3)" />
          <input
            {...bindTap({ kind: 'action', id: 'search.query.input' }, { params: { value: 'q' }, onTrigger: () => { /* 受控输入 */ } }) as any}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { doSearch(q); go('search.submit-open', { q: q.trim() }); } }}
            placeholder="小黄人承包你的暑期快乐 爆笑热映"
            className="flex-1 text-[13px] border-none outline-none bg-transparent"
          />
        </div>
        {q.trim() ? (
          <button
            {...bindTap('search.submit-open', { params: { q: q.trim() }, beforeTrigger: () => doSearch(q) })}
            className="text-[14px] bg-transparent border-none cursor-pointer px-2 font-medium"
            style={{ color: MY.cta }}
          >
            {s.search}
          </button>
        ) : (
          <span className="text-[14px] text-(--app-c-text-4) px-2">{s.search}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="search-landing" data-scroll-direction="vertical">
        {/* 历史记录 */}
        {searchHistory.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center text-[13px] text-app-text-muted mb-2">
              🕐 {s.searchHistory}
              <button
                {...bindTap({ kind: 'action', id: 'search.history.clear' }, { onTrigger: () => clearSearchHistory() })}
                className="ml-auto bg-transparent border-none cursor-pointer text-(--app-c-text-3)"
                aria-label="清除历史"
              >
                <IcTrash size={15} />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {searchHistory.map((w) => (
                <button
                  key={w}
                  {...bindTap('search.history-open', { params: { q: w }, beforeTrigger: () => doSearch(w) })}
                  className="text-[13px] bg-app-surface rounded-full px-3 py-1.5 border-none cursor-pointer text-(--app-c-text-2)"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 全国热搜 + 电影想看榜 */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 bg-app-surface rounded-xl p-3">
            <div className="text-[14px] font-bold text-app-text mb-2">🔥 {s.hotSearch}</div>
            {hotSearch.map((w, i) => (
              <button
                key={w}
                {...bindTap('search.hotword-open', { params: { q: w }, beforeTrigger: () => doSearch(w) })}
                className="w-full flex items-center gap-2 py-1.5 bg-transparent border-none cursor-pointer text-left"
              >
                <span className={`text-[13px] font-bold w-4 ${i < 3 ? 'text-[#F5303E]' : 'text-[#FFA820]'}`}>{i + 1}</span>
                <span className="text-[13px] text-(--app-c-text-2) truncate">{w}</span>
                {i === 0 && <span className="text-[9px] text-white bg-[#F5303E] rounded px-0.5 shrink-0">爆</span>}
                {i > 0 && i < 8 && <span className="text-[9px] text-white bg-[#FF8800] rounded px-0.5 shrink-0">热</span>}
              </button>
            ))}
          </div>
          <div className="flex-1 bg-app-surface rounded-xl p-3">
            <div className="text-[14px] font-bold text-app-text mb-2">💗 {s.wishRank}</div>
            {wishRank.map((w, i) => (
              <button
                key={w}
                {...bindTap('search.hotword-open', { params: { q: w }, beforeTrigger: () => doSearch(w) })}
                className="w-full flex items-center gap-2 py-1.5 bg-transparent border-none cursor-pointer text-left"
              >
                <span className={`text-[13px] font-bold w-4 ${i < 3 ? 'text-[#F5A0B4]' : 'text-[#FFA820]'}`}>{i + 1}</span>
                <span className="text-[13px] text-(--app-c-text-2) truncate">{w}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 热门景点 + 休闲玩乐(wontfix) */}
        <div className="flex gap-2 mt-3 mb-3">
          <div className="flex-1 bg-app-surface rounded-xl p-3">
            <div className="text-[14px] font-bold text-app-text mb-2">热门景点 <span className="text-[9px] text-white bg-[#FF5A8C] rounded px-1">必玩</span></div>
            {scenics.slice(0, 3).map((x, i) => (
              <button
                key={x.id}
                {...bindTap({ kind: 'action', id: 'search.local.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="w-full flex items-center gap-2 py-1.5 bg-transparent border-none cursor-pointer text-left"
              >
                <span className="text-[12px] font-bold text-[#FFA820] w-4">{i + 1}</span>
                <span className="text-[13px] text-(--app-c-text-2) truncate flex-1">{x.name}</span>
                <span className="text-[11px] text-[#F5303E] shrink-0">¥{x.priceFrom}起</span>
              </button>
            ))}
          </div>
          <div className="flex-1 bg-app-surface rounded-xl p-3">
            <div className="text-[14px] font-bold text-app-text mb-2">休闲玩乐</div>
            <div className="grid grid-cols-2 gap-2">
              {FUN_CATEGORIES.slice(1, 7).map((c) => (
                <button
                  key={c}
                  {...bindTap({ kind: 'action', id: 'search.local.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                  className="text-[12px] text-(--app-c-text-2) bg-app-bg rounded-lg py-2 border-none cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
