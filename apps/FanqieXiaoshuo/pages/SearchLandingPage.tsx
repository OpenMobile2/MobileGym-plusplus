import React, { useState } from 'react';
import { KeyboardService } from '@/os/keyboard';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useNotOpenToast } from '../components/ui';
import { IcBack, IcSearch, IcTrash, IcArrowRight } from '../res/icons';

/** 联想词高亮:匹配段橙色 */
function Highlight({ word, kw }: { word: string; kw: string }) {
  const idx = word.indexOf(kw);
  if (idx < 0 || !kw) return <span className="text-(--app-c-text-primary)">{word}</span>;
  return (
    <span className="text-(--app-c-text-primary)">
      {word.slice(0, idx)}
      <span className="text-(--app-c-brand)">{kw}</span>
      {word.slice(idx + kw.length)}
    </span>
  );
}

export default function SearchLandingPage() {
  const { bindTap, bindBack } = useFanqieGestures();
  const str = useFanqieStrings();
  const [notOpenNode, showNotOpen] = useNotOpenToast();
  const [keyword, setKeyword] = useState('');

  const books = useFanqieStore((s) => s.books);
  const authors = useFanqieStore((s) => s.authors);
  const searchHistory = useFanqieStore((s) => s.searchHistory);
  const hotSearch = useFanqieStore((s) => s.hotSearch);
  const guessWords = useFanqieStore((s) => s.guessWords);
  const addSearchHistory = useFanqieStore((s) => s.addSearchHistory);
  const clearSearchHistory = useFanqieStore((s) => s.clearSearchHistory);

  const kw = keyword.trim();
  // 联想:书名 + 作者名 includes 匹配(去重)
  const suggests = kw
    ? [
      ...books.filter((b) => b.title.includes(kw)).map((b) => b.title),
      ...authors.filter((a) => a.name.includes(kw)).map((a) => a.name),
    ].filter((w, i, arr) => arr.indexOf(w) === i).slice(0, 10)
    : [];

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-card) relative">
      {/* 顶部:返回 + 输入框 + 搜索 */}
      <div className="shrink-0 flex items-center gap-2 pl-1 pr-3 h-12">
        {/* 取消/返回:输入框 autoFocus 会拉起键盘,不先收键盘的话这一下只会被键盘吃掉(走查轮3 #1) */}
        <button
          {...bindBack({ beforeTrigger: () => KeyboardService.hide() })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="back"
        >
          <IcBack size={22} className="text-(--app-c-text-primary)" />
        </button>
        <div className="flex-1 h-9 bg-(--app-c-bg-card) border border-(--app-c-border-input) rounded-lg flex items-center px-2.5 gap-1.5 min-w-0">
          <IcSearch size={15} className="text-(--app-c-text-disabled) shrink-0" />
          <input
            {...(bindTap({ kind: 'action', id: 'search.keyword.input' }, { onTrigger: () => {} }) as any)}
            autoFocus
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={str.searchPlaceholder}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[14px] text-(--app-c-text-primary) placeholder:text-(--app-c-text-disabled)"
          />
        </div>
        <button
          {...(kw
            ? bindTap('search.result-open', { params: { q: kw }, beforeTrigger: () => addSearchHistory(kw) })
            : {})}
          className={`text-[15px] bg-transparent border-none px-0.5 shrink-0 ${kw ? 'text-(--app-c-brand) font-semibold cursor-pointer' : 'text-(--app-c-brand-weak)'}`}
        >
          {str.search}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-landing" data-scroll-direction="vertical">
        {kw ? (
          /* ===== 联想列表 ===== */
          <div className="pt-1">
            {suggests.map((word) => (
              <button
                key={word}
                {...bindTap('search.result-open', { params: { q: word }, beforeTrigger: () => addSearchHistory(word) })}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-transparent border-none cursor-pointer text-left border-b border-(--app-c-divider)"
              >
                <IcSearch size={15} className="text-(--app-c-text-disabled) shrink-0" />
                <span className="text-[14px] truncate">
                  <Highlight word={word} kw={kw} />
                </span>
              </button>
            ))}
            {suggests.length === 0 && (
              <button
                {...bindTap('search.result-open', { params: { q: kw }, beforeTrigger: () => addSearchHistory(kw) })}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-transparent border-none cursor-pointer text-left"
              >
                <IcSearch size={15} className="text-(--app-c-text-disabled) shrink-0" />
                <span className="text-[14px] truncate"><Highlight word={kw} kw={kw} /></span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ① AI 搜索入口条(wontfix) */}
            <button
              {...bindTap({ kind: 'action', id: 'search.ai.disabled' }, { onTrigger: showNotOpen })}
              className="mx-3 mt-1 flex items-center gap-2 w-[calc(100%-24px)] rounded-xl bg-(--app-c-brand-soft) border-none px-3 py-2.5 cursor-pointer text-left"
            >
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#7C5CFF] to-[#4DA0FF] text-white text-[11px] font-bold flex items-center justify-center shrink-0">Ai</span>
              <span className="text-[14px] font-semibold text-(--app-c-text-primary) shrink-0">番茄AI搜索</span>
              <span className="text-[12px] text-(--app-c-text-tertiary) flex-1 truncate">在找书?来试试用AI帮你</span>
              <IcArrowRight size={15} className="text-(--app-c-text-disabled) shrink-0" />
            </button>

            {/* ② 猜你想搜(两词,frame r2_5:无标题两列) */}
            <div className="grid grid-cols-2 gap-x-4 px-4 mt-4">
              {guessWords.slice(0, 2).map((word) => (
                <button
                  key={word}
                  {...bindTap('search.result-open', { params: { q: word }, beforeTrigger: () => addSearchHistory(word) })}
                  className="text-left text-[14px] text-(--app-c-text-primary) bg-transparent border-none cursor-pointer p-0 truncate"
                >
                  {word}
                </button>
              ))}
            </div>

            {/* ③ 搜索历史 */}
            {searchHistory.length > 0 && (
              <div className="px-4 mt-5">
                <div className="flex items-center">
                  <span className="text-[15px] font-semibold text-(--app-c-text-primary) flex-1">{str.searchHistory}</span>
                  <button
                    {...bindTap({ kind: 'action', id: 'search.history.clear' }, { onTrigger: () => clearSearchHistory() })}
                    className="bg-transparent border-none cursor-pointer text-(--app-c-text-tertiary) p-1"
                    aria-label="清空搜索历史"
                  >
                    <IcTrash size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mt-3">
                  {searchHistory.map((word) => (
                    <button
                      key={word}
                      {...bindTap('search.result-open', { params: { q: word }, beforeTrigger: () => addSearchHistory(word) })}
                      className="text-left text-[14px] text-(--app-c-text-primary) bg-transparent border-none cursor-pointer p-0 truncate"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ④ 番茄热搜榜 */}
            <div className="mx-3 mt-5 mb-4 rounded-xl border border-(--app-c-divider) px-3 pt-3 pb-2"
              style={{ background: 'linear-gradient(180deg, var(--app-c-brand-soft-alt), var(--app-c-bg-card))' }}>
              <div className="text-[16px] font-bold text-[#E8552E]">{str.hotSearch}</div>
              <div className="mt-1">
                {hotSearch.map((h, i) => (
                  <button
                    key={h.word}
                    {...bindTap('search.result-open', { params: { q: h.word }, beforeTrigger: () => addSearchHistory(h.word) })}
                    className="w-full flex items-start gap-2.5 py-2 bg-transparent border-none cursor-pointer text-left"
                  >
                    <span className={`w-4 text-center text-[15px] font-bold italic leading-5 shrink-0 ${i < 3 ? 'text-(--app-c-brand)' : 'text-(--app-c-text-disabled)'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[14px] text-(--app-c-text-primary) truncate">{h.word}</span>
                        {h.tag && (
                          <span className="text-[9px] px-1 py-px rounded-sm bg-[#FFF3E0] text-[#B7770D] border border-[#EFD9A7] shrink-0">
                            {h.tag}
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-(--app-c-text-quaternary) mt-0.5">{h.heat}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {notOpenNode}
    </div>
  );
}
