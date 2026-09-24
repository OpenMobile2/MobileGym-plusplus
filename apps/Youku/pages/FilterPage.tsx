import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { contentNavParams } from '../utils/openContent';
import Img from '../components/Img';
import { IcBack } from './me/meShared';
import { IcSearch } from './home/homeUi';
import HScroll from './home/HScroll';
import {
  PAY_OPTIONS, REGION_OPTIONS, SORT_OPTIONS, TYPE_OPTIONS, YEAR_OPTIONS,
  filterCatalog, genreOptionsForType, optLabel, readFilter, type FilterOption,
} from './filter/filterLib';
import type { CatalogItem } from '../types';

/**
 * spec 节点 filter.main(route /filter?panel?=&ftype?=&fregion?=&fyear?=&fpay?=&fsort?=)。
 * 阶段⑥走查补做:首页「+」菜单/频道页筛选按钮进入(参考 youku_images/added_2)。
 * 筛选 tab:类型/地区/年份/付费/排序 多行胶囊 + 三列网格;榜单 tab:热度榜。
 */
export default function FilterPage() {
  const { bindTap, action, bindBack } = useYoukuGestures();
  const { t, locale } = useI18n();
  const isEn = locale === 'en';
  const [sp, setSearchParams] = useSearchParams();

  const panel = sp.get('panel') === 'rank' ? 'rank' : 'filter';
  const f = readFilter((k) => sp.get(k));

  const setParam = (key: string, value: string) =>
    setSearchParams(
      (p) => {
        if (value === 'all') p.delete(key);
        else p.set(key, value);
        // 切大类时清掉题材(题材随大类变化)
        if (key === 'ftype') p.delete('fgenre');
        return p;
      },
      { replace: true },
    );

  const selectPanel = (next: 'filter' | 'rank') =>
    setSearchParams(
      (p) => {
        if (next === 'filter') p.delete('panel');
        else p.set('panel', next);
        return p;
      },
      { replace: true },
    );

  const results = filterCatalog(f);
  const genreOptions = genreOptionsForType(f.type);
  const rankList = filterCatalog({
    type: 'all', genre: 'all', region: 'all', year: 'all', pay: 'all', sort: 'hot',
  });

  const row = (
    label: string,
    current: string,
    options: FilterOption[],
    bindOption: (key: string) => React.HTMLAttributes<HTMLButtonElement>,
  ) => (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="shrink-0 rounded-full bg-(--app-c-chip-bg) px-3 py-1.5 text-[14px] font-medium text-(--app-c-text-primary)">
        {label}
      </span>
      <HScroll className="items-center gap-3.5">
        {options.map((o) => (
          <button
            key={o.key}
            {...bindOption(o.key)}
            className={`shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent p-0 text-[15px] ${
              current === o.key ? 'font-bold text-(--app-c-text-primary)' : 'text-[#8A8A8A]'
            }`}
          >
            {optLabel(o, isEn)}
          </button>
        ))}
      </HScroll>
    </div>
  );

  const gridCard = (item: CatalogItem, rank?: number) => (
    <div
      key={item.id}
      {...bindTap('filter.card.open', { params: contentNavParams(item) })}
      className="cursor-pointer"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
        <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
        {item.badge && (
          <span className="absolute right-0 top-0 rounded-bl-lg bg-black/55 px-1.5 py-0.5 text-[10px] leading-4 text-[#E8C87E]">
            {item.badge}
          </span>
        )}
        {rank != null && (
          <span className="absolute bottom-0 left-1 text-[24px] font-bold italic leading-none text-[#3D8BFF] drop-shadow">
            {String(rank + 1).padStart(2, '0')}
          </span>
        )}
        {item.episodeCount != null && (
          <span className="absolute bottom-1 right-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
            {item.updatedTo != null && item.updatedTo < item.episodeCount
              ? `更新至${item.updatedTo}集`
              : `${item.episodeCount}集全`}
          </span>
        )}
      </div>
      <div className="mt-1.5 truncate text-[15px] text-(--app-c-text-primary)">{item.title}</div>
      <div className="mt-0.5 truncate text-[12px] text-[#999999]">{item.recTitle}</div>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 / 筛选·榜单 / 搜索 */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button
          {...bindBack()}
          aria-label={t('common.back')}
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-6">
          <button
            {...action('filter.panel.select.filter', () => selectPanel('filter'))}
            className={`cursor-pointer border-none bg-transparent p-0 ${
              panel === 'filter' ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[16px] text-[#8A8A8A]'
            }`}
          >
            {t('filter.tabFilter')}
          </button>
          <button
            {...action('filter.panel.select.rank', () => selectPanel('rank'))}
            className={`cursor-pointer border-none bg-transparent p-0 ${
              panel === 'rank' ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[16px] text-[#8A8A8A]'
            }`}
          >
            {t('filter.tabRank')}
          </button>
        </div>
        <button
          {...bindTap('filter.search.open')}
          aria-label={t('common.search')}
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcSearch size={22} />
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-4">
        {panel === 'filter' ? (
          <>
            <div className="pb-1 pt-1">
              {row(t('filter.rowType'), f.type, TYPE_OPTIONS, (key) =>
                action('filter.select.type', () => setParam('ftype', key), { params: { value: key } }),
              )}
              {f.type !== 'all' &&
                row(t('filter.rowRegion'), f.region, REGION_OPTIONS, (key) =>
                  action('filter.select.region', () => setParam('fregion', key), { params: { value: key } }),
                )}
              {genreOptions.length > 0 &&
                row(t('filter.rowGenre'), f.genre, genreOptions, (key) =>
                  action('filter.select.genre', () => setParam('fgenre', key), { params: { value: key } }),
                )}
              {row(t('filter.rowYear'), f.year, YEAR_OPTIONS, (key) =>
                action('filter.select.year', () => setParam('fyear', key), { params: { value: key } }),
              )}
              {row(t('filter.rowPay'), f.pay, PAY_OPTIONS, (key) =>
                action('filter.select.pay', () => setParam('fpay', key), { params: { value: key } }),
              )}
              {row(t('filter.rowSort'), f.sort, SORT_OPTIONS, (key) =>
                action('filter.select.sort', () => setParam('fsort', key), { params: { value: key } }),
              )}
            </div>
            {results.length === 0 ? (
              <div className="px-3 py-16 text-center text-[14px] text-[#8A8A8A]">{t('filter.empty')}</div>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-4 px-3">
                {results.map((item) => gridCard(item))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4 px-3">
            {rankList.map((item, i) => gridCard(item, i))}
          </div>
        )}
      </div>
    </div>
  );
}
