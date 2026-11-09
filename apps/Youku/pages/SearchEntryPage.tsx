import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { contentNavParams } from '../utils/openContent';
import {
  DISCOVER_BATCHES, HOTWORDS, RANK_TABS, type RankTabId,
  progressText, rankItems, suggestWords, typeChar,
} from '../components/search/searchLib';
import {
  Hi, IcMic, IcRefresh, IcSearch, IcTrash, PosterBadge, RankCorner,
} from '../components/search/SearchBits';
import HScroll from './home/HScroll';
import {
  REGION_OPTIONS, SORT_OPTIONS, TYPE_OPTIONS, filterCatalog, genreOptionsForType, optLabel,
} from './filter/filterLib';

/**
 * spec 节点 search.entry(route /search)—— 搜索入口页(s228/s232~s236)。
 * uiStates:browse(历史+发现+榜单)/ suggest(输入联想候选)/ rankTab(榜单子tab切换)。
 */
export default function SearchEntryPage() {
  const { bindTap, action, bindBack, go } = useYoukuGestures();
  const { t, locale } = useI18n();
  const [sp] = useSearchParams();
  const kwParam = sp.get('keyword') ?? '';

  const input = useYoukuStore((s) => s._temp.searchInput);
  const searchHistory = useYoukuStore((s) => s.searchHistory);
  const discoverBatch = useYoukuStore((s) => s.discoverBatch);
  const setTemp = useYoukuStore((s) => s.setTemp);
  const addSearchHistory = useYoukuStore((s) => s.addSearchHistory);
  const clearSearchHistory = useYoukuStore((s) => s.clearSearchHistory);
  const refreshDiscover = useYoukuStore((s) => s.refreshDiscover);
  const showToast = useYoukuStore((s) => s.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const inputRef = useRef<HTMLInputElement>(null);
  const [rankTab, setRankTab] = useState<RankTabId>('hot');
  // 榜单 / 筛选找片 面板切换(阶段⑥走查补做,参考 added_2)
  const [panel, setPanel] = useState<'rank' | 'filter'>('rank');
  const [fType, setFType] = useState('all');
  const [fGenre, setFGenre] = useState('all');
  const [fRegion, setFRegion] = useState('all');
  const [fSort, setFSort] = useState('hot');
  const genreOptions = genreOptionsForType(fType);
  const filtered = filterCatalog({ type: fType, genre: fGenre, region: fRegion, year: 'all', pay: 'all', sort: fSort });
  const selectFType = (key: string) => {
    setFType(key);
    setFGenre('all'); // 切大类时题材回到全部
  };
  // 搜索框轮播热词占位(s228:如"古董局中局")
  const [hotIdx, setHotIdx] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setHotIdx((i) => (i + 1) % HOTWORDS.length), 4000);
    return () => window.clearInterval(timer);
  }, []);

  // 进入本页:带 keyword(结果页回跳)则回填并聚焦进入 suggest 态;否则清空回 browse 态(s232)
  useEffect(() => {
    setTemp({ searchInput: kwParam });
    if (kwParam) inputRef.current?.focus();
  }, [kwParam, setTemp]);

  const placeholder = HOTWORDS[hotIdx]?.word ?? '';
  const trimmed = input.trim();
  const suggestMode = trimmed.length > 0;
  const btnKeyword = trimmed || placeholder;
  const candidates = suggestWords(trimmed);
  const discover = DISCOVER_BATCHES[discoverBatch % DISCOVER_BATCHES.length] ?? [];
  const ranks = rankItems(rankTab);

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 + 搜索框(轮播热词占位/可输入+麦克风) + 搜索按钮 */}
      <div className="flex h-13 shrink-0 items-center gap-2 px-3 py-2">
        <button {...bindBack()} aria-label={t('common.back')} className="flex h-8 w-6 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-[22px] leading-none text-(--app-c-text-primary)">
          ‹
        </button>
        <div className="flex h-9 min-w-0 flex-1 items-center rounded-full bg-(--app-c-chip-bg) px-3.5">
          <input
            ref={inputRef}
            data-action="search.entry.input.change"
            data-action-type="input"
            value={input}
            onChange={(e) => setTemp({ searchInput: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && btnKeyword) {
                addSearchHistory(btnKeyword);
                go('search.entry.results.open', { keyword: btnKeyword });
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-(--app-c-text-primary) outline-none placeholder:text-[#666666]"
          />
          <button {...action('search.entry.voice.wontfixToast', wontfix)} className="ml-2 shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#999999]">
            <IcMic size={18} />
          </button>
        </div>
        <button
          {...bindTap('search.entry.results.open', {
            params: { keyword: btnKeyword },
            beforeTrigger: () => addSearchHistory(btnKeyword),
          })}
          className="shrink-0 cursor-pointer border-none bg-transparent text-[17px] font-medium text-(--app-c-text-primary)"
        >
          {t('search.common.searchBtn')}
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto">
        {suggestMode ? (
          /* ---------------- suggest 联想候选态(qa:Q14):覆盖历史/发现/榜单区 ---------------- */
          <div className="px-3 pt-1">
            <div
              {...bindTap('search.entry.results.open', {
                params: { keyword: trimmed },
                beforeTrigger: () => addSearchHistory(trimmed),
              })}
              className="flex cursor-pointer items-center gap-3 border-b border-(--app-c-border) py-3.5"
            >
              <IcSearch size={16} className="shrink-0 text-[#666666]" />
              <span className="min-w-0 truncate text-[15px] text-[#3D8BFF]">{t('search.entry.suggest.direct', { kw: trimmed })}</span>
            </div>
            {candidates.map((word) => (
              <div
                key={word}
                {...bindTap('search.entry.results.open', {
                  params: { keyword: word },
                  beforeTrigger: () => addSearchHistory(word),
                })}
                className="flex cursor-pointer items-center gap-3 border-b border-(--app-c-border) py-3.5"
              >
                <IcSearch size={16} className="shrink-0 text-[#666666]" />
                <span className="min-w-0 truncate text-[15px] text-(--app-c-text-primary)"><Hi text={word} kw={trimmed} /></span>
              </div>
            ))}
          </div>
        ) : (
          /* ---------------- browse 默认浏览态(s228) ---------------- */
          <div className="pb-6">
            {/* 历史搜索:清空后整区隐藏 */}
            {searchHistory.length > 0 && (
              <div className="px-3 pt-2">
                <div className="flex items-center">
                  <span className="text-[19px] font-bold">{t('search.entry.history')}</span>
                  <button {...action('search.entry.history.clear', clearSearchHistory)} className="ml-auto cursor-pointer border-none bg-transparent p-1 text-[#999999]">
                    <IcTrash size={17} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {searchHistory.map((word) => (
                    <button
                      key={word}
                      {...bindTap('search.entry.results.open', {
                        params: { keyword: word },
                        beforeTrigger: () => addSearchHistory(word),
                      })}
                      className="max-w-full cursor-pointer truncate rounded-full border-none bg-(--app-c-chip-bg) px-4 py-2 text-[14px] text-(--app-c-text-primary)"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 搜索发现:标签云(部分带 荐/热/类型 橙色角标)+ 换一批 */}
            <div className="px-3 pt-6">
              <div className="flex items-center">
                <span className="text-[19px] font-bold">{t('search.entry.discover')}</span>
                <button {...action('search.entry.discover.refresh', refreshDiscover)} className="ml-auto cursor-pointer border-none bg-transparent p-1 text-[#999999]">
                  <IcRefresh size={17} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {discover.map((tag) => (
                  <button
                    key={tag.word}
                    {...bindTap('search.entry.results.open', {
                      params: { keyword: tag.word },
                      beforeTrigger: () => addSearchHistory(tag.word),
                    })}
                    className="max-w-full cursor-pointer truncate rounded-full border-none bg-(--app-c-chip-bg) px-4 py-2 text-[14px] text-(--app-c-text-primary)"
                  >
                    {tag.word}
                    {tag.tag ? <span className="text-[#FF6000]"> ·{tag.tag}</span> : null}
                  </button>
                ))}
              </div>
            </div>

            {/* 榜单区:榜单 / 筛选找片 面板切换 */}
            <div className="pt-7">
              <div className="flex items-baseline gap-5 px-3">
                <button
                  {...action('search.entry.panel.select.rank', () => setPanel('rank'))}
                  className={`cursor-pointer border-none bg-transparent p-0 ${
                    panel === 'rank' ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[16px] text-[#8A8A8A]'
                  }`}
                >
                  {t('search.entry.rank')}
                </button>
                <button
                  {...action('search.entry.panel.select.filter', () => setPanel('filter'))}
                  className={`cursor-pointer border-none bg-transparent p-0 ${
                    panel === 'filter' ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[16px] text-[#8A8A8A]'
                  }`}
                >
                  {t('search.entry.filter')}
                </button>
              </div>

              {panel === 'rank' ? (
                <>
                  <div className="mt-3 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
                    {RANK_TABS.map((tab) => (
                      <button
                        key={tab}
                        {...action('search.entry.select.rankTab', () => setRankTab(tab), { params: { value: tab } })}
                        className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border-none px-3.5 py-1.5 text-[15px] ${
                          rankTab === tab ? 'bg-(--app-c-chip-bg) font-bold text-(--app-c-text-primary)' : 'bg-transparent text-[#8A8A8A]'
                        }`}
                      >
                        {t(`search.entry.rankTab.${tab}`)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4 px-3">
                    {ranks.map((item, idx) => {
                      const prog = progressText(item, t);
                      const char = typeChar(item.type, t);
                      const overlay = rankTab === 'hot' ? [char, prog].filter(Boolean).join(' / ') : prog;
                      return (
                        <div key={item.id} {...bindTap('search.entry.player.open', { params: contentNavParams(item) })} className="cursor-pointer">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                            <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
                            <RankCorner index={idx} />
                            <PosterBadge text={item.badge} />
                            {overlay && (
                              <span className="absolute bottom-1 right-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
                                {overlay}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 truncate text-[15px] text-(--app-c-text-primary)">{item.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* 类型筛选(大类:全部/剧集/电影…) */}
                  <div className="mt-3 flex items-center gap-2 px-3">
                    <span className="shrink-0 rounded-full bg-(--app-c-chip-bg) px-3 py-1 text-[14px] font-medium">{t('filter.rowType')}</span>
                    <HScroll className="items-center gap-3.5">
                      {TYPE_OPTIONS.map((o) => (
                        <button
                          key={o.key}
                          {...action('search.entry.filter.select.type', () => selectFType(o.key), { params: { value: o.key } })}
                          className={`shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent p-0 text-[15px] ${
                            fType === o.key ? 'font-bold text-(--app-c-text-primary)' : 'text-[#8A8A8A]'
                          }`}
                        >
                          {optLabel(o, locale === 'en')}
                        </button>
                      ))}
                    </HScroll>
                  </div>
                  {/* 题材子类型(随大类变化:如电视剧下 古装/爱情…,参考补拍) */}
                  {genreOptions.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 px-3">
                      <span className="shrink-0 rounded-full bg-(--app-c-chip-bg) px-3 py-1 text-[14px] font-medium">{t('filter.rowGenre')}</span>
                      <HScroll className="items-center gap-3.5">
                        {genreOptions.map((o) => (
                          <button
                            key={o.key}
                            {...action('search.entry.filter.select.genre', () => setFGenre(o.key), { params: { value: o.key } })}
                            className={`shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent p-0 text-[15px] ${
                              fGenre === o.key ? 'font-bold text-(--app-c-text-primary)' : 'text-[#8A8A8A]'
                            }`}
                          >
                            {optLabel(o, locale === 'en')}
                          </button>
                        ))}
                      </HScroll>
                    </div>
                  )}
                  {/* 地区 */}
                  <div className="mt-2 flex items-center gap-2 px-3">
                    <span className="shrink-0 rounded-full bg-(--app-c-chip-bg) px-3 py-1 text-[14px] font-medium">{t('filter.rowRegion')}</span>
                    <HScroll className="items-center gap-3.5">
                      {REGION_OPTIONS.map((o) => (
                        <button
                          key={o.key}
                          {...action('search.entry.filter.select.region', () => setFRegion(o.key), { params: { value: o.key } })}
                          className={`shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent p-0 text-[15px] ${
                            fRegion === o.key ? 'font-bold text-(--app-c-text-primary)' : 'text-[#8A8A8A]'
                          }`}
                        >
                          {optLabel(o, locale === 'en')}
                        </button>
                      ))}
                    </HScroll>
                  </div>
                  {/* 排序 */}
                  <div className="mt-2 flex items-center gap-2 px-3">
                    <span className="shrink-0 rounded-full bg-(--app-c-chip-bg) px-3 py-1 text-[14px] font-medium">{t('filter.rowSort')}</span>
                    <HScroll className="items-center gap-3.5">
                      {SORT_OPTIONS.map((o) => (
                        <button
                          key={o.key}
                          {...action('search.entry.filter.select.sort', () => setFSort(o.key), { params: { value: o.key } })}
                          className={`shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent p-0 text-[15px] ${
                            fSort === o.key ? 'font-bold text-(--app-c-text-primary)' : 'text-[#8A8A8A]'
                          }`}
                        >
                          {optLabel(o, locale === 'en')}
                        </button>
                      ))}
                    </HScroll>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4 px-3">
                    {filtered.map((item) => {
                      const prog = progressText(item, t);
                      const char = typeChar(item.type, t);
                      const overlay = [char, prog].filter(Boolean).join(' / ');
                      return (
                        <div key={item.id} {...bindTap('search.entry.player.open', { params: contentNavParams(item) })} className="cursor-pointer">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                            <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
                            <PosterBadge text={item.badge} />
                            {overlay && (
                              <span className="absolute bottom-1 right-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
                                {overlay}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 truncate text-[15px] text-(--app-c-text-primary)">{item.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
