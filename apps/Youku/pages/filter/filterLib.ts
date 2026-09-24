import { YOUKU_CONFIG } from '../../data';
import type { CatalogItem } from '../../types';

/**
 * 筛选找片共享逻辑(阶段⑥走查补做:参考 youku_images/added_2)。
 * 全量基于既有 40 条片库(catalog),按类型/地区/年份/付费/排序过滤;
 * 供 FilterPage(独立筛选页)与 SearchEntryPage(内联筛选找片面板)复用。
 */

const CATALOG = YOUKU_CONFIG.catalog as unknown as CatalogItem[];

export interface FilterOption {
  key: string;
  zh: string;
  en: string;
}

/** 类型:key 直接对应 catalog.type('剧集'=series,'少儿'=kids) */
export const TYPE_OPTIONS: FilterOption[] = [
  { key: 'all', zh: '全部', en: 'All' },
  { key: 'series', zh: '剧集', en: 'Series' },
  { key: 'movie', zh: '电影', en: 'Movie' },
  { key: 'variety', zh: '综艺', en: 'Variety' },
  { key: 'anime', zh: '动漫', en: 'Anime' },
  { key: 'kids', zh: '少儿', en: 'Kids' },
];

/** 付费类型:由海报角标派生(VIP/SVIP → 会员,其余含限免均按免费) */
export const PAY_OPTIONS: FilterOption[] = [
  { key: 'all', zh: '全部', en: 'All' },
  { key: 'free', zh: '免费', en: 'Free' },
  { key: 'vip', zh: '会员', en: 'VIP' },
];

/** 排序 */
export const SORT_OPTIONS: FilterOption[] = [
  { key: 'hot', zh: '热度最高', en: 'Hottest' },
  { key: 'new', zh: '最新上线', en: 'Newest' },
  { key: 'rating', zh: '评分最高', en: 'Top rated' },
];

/** 地区:全部 + 片库出现过的地区(按出现频次) */
export const REGION_OPTIONS: FilterOption[] = (() => {
  const counts = new Map<string, number>();
  for (const c of CATALOG) {
    if (!c.region) continue;
    counts.set(c.region, (counts.get(c.region) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r);
  return [{ key: 'all', zh: '全部', en: 'All' }, ...sorted.map((r) => ({ key: r, zh: r, en: r }))];
})();

/** 年份:全部年份 + 倒序年份 */
export const YEAR_OPTIONS: FilterOption[] = (() => {
  const years = [...new Set(CATALOG.map((c) => c.year).filter(Boolean))].sort((a, b) => b - a);
  return [
    { key: 'all', zh: '全部年份', en: 'All years' },
    ...years.map((y) => ({ key: String(y), zh: String(y), en: String(y) })),
  ];
})();

export function itemPay(item: CatalogItem): 'free' | 'vip' {
  const b = item.badge || '';
  return /VIP|SVIP|会员|付费/.test(b) ? 'vip' : 'free';
}

/**
 * 题材(子类型)选项:随所选大类动态变化(参考 added_2:电视剧下 古装/爱情…,电影下 动作/悬疑…)。
 * 由该类目片库实际 tags 派生(按频次),保证每个题材都有命中,不出空结果。
 */
export function genreOptionsForType(type: string): FilterOption[] {
  if (type === 'all') return [];
  const counts = new Map<string, number>();
  for (const c of CATALOG) {
    if (c.type !== type) continue;
    for (const tg of c.tags ?? []) counts.set(tg, (counts.get(tg) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  if (sorted.length === 0) return [];
  return [{ key: 'all', zh: '全部', en: 'All' }, ...sorted.map((g) => ({ key: g, zh: g, en: g }))];
}

export interface FilterState {
  type: string;
  genre: string;
  region: string;
  year: string;
  pay: string;
  sort: string;
}

export const DEFAULT_FILTER: FilterState = {
  type: 'all',
  genre: 'all',
  region: 'all',
  year: 'all',
  pay: 'all',
  sort: 'hot',
};

/** 读 URLSearchParams → FilterState(缺省回落 DEFAULT_FILTER) */
export function readFilter(get: (k: string) => string | null): FilterState {
  return {
    type: get('ftype') || 'all',
    genre: get('fgenre') || 'all',
    region: get('fregion') || 'all',
    year: get('fyear') || 'all',
    pay: get('fpay') || 'all',
    sort: get('fsort') || 'hot',
  };
}

/** 按筛选条件过滤 + 排序 */
export function filterCatalog(f: FilterState): CatalogItem[] {
  let list = CATALOG.slice();
  if (f.type !== 'all') list = list.filter((c) => c.type === f.type);
  if (f.genre !== 'all') list = list.filter((c) => (c.tags ?? []).includes(f.genre));
  if (f.region !== 'all') list = list.filter((c) => c.region === f.region);
  if (f.year !== 'all') list = list.filter((c) => String(c.year) === f.year);
  if (f.pay !== 'all') list = list.filter((c) => itemPay(c) === f.pay);

  if (f.sort === 'new') list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  else if (f.sort === 'rating') list.sort((a, b) => (b.douban ?? 0) - (a.douban ?? 0));
  else list.sort((a, b) => (b.heat ?? 0) - (a.heat ?? 0));
  return list;
}

export function optLabel(o: FilterOption, isEn: boolean): string {
  return isEn ? o.en : o.zh;
}
