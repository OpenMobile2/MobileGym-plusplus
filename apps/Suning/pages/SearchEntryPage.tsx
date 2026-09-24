import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcTrash, IcRefresh, IcFlame } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { suggestWords } from '../utils/search';

const GUESS_SHOW = 8;

/** 品类卡示例图(热搜品类榜:手机/冰箱,s275) */
const HOT_CAT_IMAGE: Record<string, string> = {
  手机: '/@app-assets/Suning/products/phone-iphone17-256.png',
  冰箱: '/@app-assets/Suning/products/fridge-haier-539.png',
};

/**
 * 搜索入口页(spec search.entry,s275/r1@1.2~3.6):
 * base=最近搜索+猜你想搜+热搜品类榜;输入非空整屏切联想列表(suggest,本地态非 URL);
 * ?dialog=clearHistory=清空历史确认弹窗(Q8=B,URL 驱动)。
 */
export default function SearchEntryPage() {
  const { bindTap, action, bindBack, go, back } = useSuningGestures();
  const S = useStrings();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const placeholder = sp.get('placeholder') ?? '';
  const clearDialogOpen = sp.get('dialog') === 'clearHistory';

  const recent = useSuningStore((s) => s.recentSearches);
  const addRecentSearch = useSuningStore((s) => s.addRecentSearch);
  const clearRecentSearches = useSuningStore((s) => s.clearRecentSearches);
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);

  const [kw, setKw] = useState('');
  const [guessOffset, setGuessOffset] = useState(0);

  const cfg = SUNING_CONFIG.searchConfig;
  const guessPool = [...cfg.guessWords, ...cfg.placeholders];
  const guessShown = Array.from({ length: Math.min(GUESS_SHOW, guessPool.length) }, (_, i) => guessPool[(guessOffset + i) % guessPool.length]);
  const suggests = suggestWords(kw);

  /** 搜索按钮/键盘搜索键:空输入用占位词;写入最近搜索(前插去重) */
  const doSearch = () => {
    const word = (kw.trim() || placeholder).trim();
    if (!word) return;
    addRecentSearch(word);
    go('search.entry.results.open', { keyword: word });
  };

  return (
    <div className="flex h-full flex-col bg-[var(--app-surface)]">
      {/* 顶栏:返回 + 搜商品/AI搜索 双Tab */}
      <div className="flex items-center gap-1 px-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="relative px-2 pb-1">
          <span className="text-[17px] font-bold text-[var(--app-text)]">{S.searchGoods}</span>
          <span className="absolute bottom-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />
        </div>
        {/* AI搜索:放弃清单,Tab 保留 toast */}
        <button
          {...action('search.entry.wontfix.toast', wontfix)}
          className="flex cursor-pointer items-center gap-1 border-none bg-transparent px-2 pb-1"
        >
          <span className="text-[16px] text-[var(--app-text-muted)]">{S.aiSearch}</span>
          <span className="rounded-full rounded-bl-none bg-[#EEF3FB] px-1.5 text-[10px] leading-4 text-[#4A6FA5]">
            {S.aiGuide}
          </span>
        </button>
      </div>

      {/* 搜索框:输入(联想)+ 橙「搜索」按钮 */}
      <div className="px-3 pt-2">
        <div className="flex h-11 items-center rounded-xl bg-[var(--app-c-chip-bg)] pl-3 pr-1">
          <input
            data-action="search.entry.keyword.input"
            data-action-type="input"
            value={kw}
            autoFocus
            onChange={(e) => setKw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doSearch();
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-none bg-transparent text-[14px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            data-keep-keyboard="true"
          />
          <button
            {...bindTap('search.entry.results.open', {
              params: { keyword: kw.trim() || placeholder },
              beforeTrigger: () => addRecentSearch(kw.trim() || placeholder),
            })}
            data-keep-keyboard="true"
            className="cursor-pointer rounded-lg border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[14px] font-bold text-white"
          >
            {S.search}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {kw.trim() ? (
          /* suggest 态:联想词列表(命中前缀高亮;0.3.0 已删「相关店铺」首行) */
          <div className="pt-1">
            {suggests.length === 0 && (
              <div className="py-8 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>
            )}
            {suggests.map((w) => (
              <button
                key={w}
                {...bindTap('search.entry.suggest.open', {
                  params: { keyword: w },
                  beforeTrigger: () => addRecentSearch(w),
                })}
                className="flex w-full cursor-pointer items-center border-b border-[var(--app-border)] bg-transparent py-3 text-left"
              >
                <span className="truncate text-[14px] text-[var(--app-text)]">
                  {w.toLowerCase().startsWith(kw.trim().toLowerCase()) ? (
                    <>
                      <span className="text-[var(--app-primary)]">{w.slice(0, kw.trim().length)}</span>
                      {w.slice(kw.trim().length)}
                    </>
                  ) : (
                    w
                  )}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* 最近搜索:chips + 垃圾桶(清空为持久操作,Q8=B 先确认) */}
            {recent.length > 0 && (
              <div className="pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[16px] font-bold text-[var(--app-text)]">{S.recentSearch}</span>
                  <button
                    {...bindTap('search.entry.clearHistory.open')}
                    className="cursor-pointer border-none bg-transparent p-1 text-[#8A8A8A]"
                  >
                    <IcTrash size={17} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recent.map((w) => (
                    <button
                      key={w}
                      {...bindTap('search.entry.history.open', {
                        params: { keyword: w },
                        beforeTrigger: () => addRecentSearch(w),
                      })}
                      className="cursor-pointer rounded-lg border-none bg-[var(--app-c-chip-bg)] px-3 py-1.5 text-[13px] text-[var(--app-text)]"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 猜你想搜:双列 8 条 + 换一换(本地词池轮换) */}
            <div className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold text-[var(--app-text)]">{S.guessSearch}</span>
                <button
                  {...action('search.entry.guess.refresh', () => setGuessOffset((o) => (o + GUESS_SHOW) % guessPool.length))}
                  className="cursor-pointer border-none bg-transparent p-1 text-[#8A8A8A]"
                >
                  <IcRefresh size={15} />
                </button>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-6">
                {guessShown.map((w, i) => (
                  <button
                    key={w}
                    {...bindTap('search.entry.guess.open', {
                      params: { keyword: w },
                      beforeTrigger: () => addRecentSearch(w),
                    })}
                    className="flex cursor-pointer items-center gap-1 border-none bg-transparent py-2 text-left"
                  >
                    <span className="truncate text-[14px] text-[var(--app-text)]">{w}</span>
                    {i === 0 && <IcFlame size={14} className="shrink-0 text-[var(--app-c-danger)]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 热搜品类榜:品类卡 + Top3 品牌卡 */}
            <div className="pt-3">
              <div className="text-[16px] font-bold text-[var(--app-text)]">{S.hotCategory}</div>
              <div className="mt-2 rounded-xl border border-[#FBD5B5] bg-[#FFFBF7] p-2">
                {cfg.hotCategories.map((cat) => (
                  <div key={cat.name} className="flex gap-2 py-1.5">
                    <button
                      {...bindTap('search.entry.hot.open', {
                        params: { keyword: cat.name },
                        beforeTrigger: () => addRecentSearch(cat.name),
                      })}
                      className="relative h-24 w-[88px] shrink-0 cursor-pointer overflow-hidden rounded-lg border-none bg-[var(--app-c-chip-bg)] p-0"
                    >
                      {HOT_CAT_IMAGE[cat.name] && (
                        <Img src={HOT_CAT_IMAGE[cat.name]} className="h-full w-full object-cover" />
                      )}
                      <span className="absolute bottom-1 left-1 rounded bg-black/45 px-1 text-left text-[11px] font-bold leading-4 text-white">
                        {cat.name}
                        <span className="block text-[9px] font-normal leading-3">{cat.heatText}</span>
                      </span>
                    </button>
                    {cat.topBrands.map((b, bi) => (
                      <button
                        key={b}
                        {...bindTap('search.entry.hot.open', {
                          params: { keyword: b },
                          beforeTrigger: () => addRecentSearch(b),
                        })}
                        className="relative flex h-24 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-none bg-[var(--app-surface)]"
                      >
                        <span
                          className={`absolute left-0 top-0 rounded-br-lg rounded-tl-lg px-1.5 text-[10px] font-bold leading-4 text-white ${
                            bi === 0 ? 'bg-[var(--app-c-danger)]' : bi === 1 ? 'bg-[#FD9A2E]' : 'bg-[#8FA3C0]'
                          }`}
                        >
                          {bi + 1}
                        </span>
                        <span className="text-[15px] font-black text-[var(--app-text)]">{b}</span>
                        <span className="text-[12px] text-[var(--app-text-muted)]">{b}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ?dialog=clearHistory:清空历史确认(居中弹窗,取消灰/确定橙;蒙层与取消=back) */}
      {clearDialogOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div {...bindBack()} className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 w-64 rounded-2xl bg-[var(--app-surface)] p-4">
            <div className="py-3 text-center text-[15px] font-semibold text-[var(--app-text)]">{S.clearHistoryAsk}</div>
            <div className="mt-2 flex gap-2">
              <button
                {...bindBack()}
                className="flex-1 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-2 text-[14px] text-[var(--app-text-muted)]"
              >
                {S.cancel}
              </button>
              <button
                {...action('search.entry.history.clear', () => {
                  clearRecentSearches();
                  back();
                })}
                className="flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2 text-[14px] font-bold text-white"
              >
                {S.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
