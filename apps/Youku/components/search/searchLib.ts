import { YOUKU_CONFIG } from '../../data';
import type { CatalogItem, Creator, ShortDrama, ShortVideo } from '../../types';

/**
 * 搜索模块共享数据层(search.entry / search.results 专用,纯函数无绑定)。
 * 数据全部来自 YOUKU_CONFIG(片库 catalog / 短剧 shortDramas / 短视频 shorts /
 * 创作者 creators / 榜单 ranks / 热词 searchHotwords / 发现 discoverTags)。
 */

export const CATALOG = YOUKU_CONFIG.catalog as unknown as CatalogItem[];
export const SHORT_DRAMAS = YOUKU_CONFIG.shortDramas as unknown as ShortDrama[];
export const SHORTS = YOUKU_CONFIG.shorts as unknown as ShortVideo[];
export const CREATORS = YOUKU_CONFIG.creators as unknown as Creator[];
export const RANKS = YOUKU_CONFIG.ranks as unknown as Record<string, string[]>;
export const HOTWORDS = YOUKU_CONFIG.searchHotwords as unknown as Array<{ word: string; tag: string }>;
export const DISCOVER_BATCHES = YOUKU_CONFIG.discoverTags as unknown as Array<Array<{ word: string; tag: string }>>;

// ---------------------------------------------------------------- 榜单
export type RankTabId = 'hot' | 'drama' | 'variety' | 'movie' | 'anime' | 'kids' | 'microdrama';
export const RANK_TABS: RankTabId[] = ['hot', 'drama', 'variety', 'movie', 'anime', 'kids', 'microdrama'];

/** 榜单卡统一条目(片库条目 ∪ 短剧条目) */
export interface RankItem {
  id: string;
  type: string;
  title: string;
  poster: string;
  badge: string;
  episodeCount?: number;
  updatedTo?: number;
}

function toRankItem(id: string): RankItem | null {
  const c = CATALOG.find((x) => x.id === id);
  if (c) {
    return { id: c.id, type: String(c.type), title: c.title, poster: c.poster, badge: c.badge, episodeCount: c.episodeCount, updatedTo: c.updatedTo };
  }
  const d = SHORT_DRAMAS.find((x) => x.id === id);
  if (d) {
    return { id: d.id, type: String(d.type), title: d.title, poster: d.cover, badge: '', episodeCount: d.episodeCount, updatedTo: d.updatedTo };
  }
  return null;
}

export function rankItems(tab: RankTabId): RankItem[] {
  return (RANKS[tab] ?? []).map(toRankItem).filter((x): x is RankItem => x !== null);
}

type TFn = (key: string, params?: Record<string, string | number>) => string;

/** 剧/综/影/漫/少/微 单字类型角标 */
export function typeChar(type: string, t: TFn): string {
  if (type === 'movie' || type === 'series' || type === 'variety' || type === 'anime' || type === 'kids' || type === 'drama') {
    return t(`search.common.typeChar.${type}`);
  }
  return '';
}

/** 更新至N集 / N集全(话/期按类型) */
export function progressText(item: { type: string; episodeCount?: number; updatedTo?: number }, t: TFn): string {
  if (!item.episodeCount) return '';
  const unitKey = item.type === 'anime' ? 'hua' : item.type === 'variety' || item.type === 'kids' ? 'qi' : 'ep';
  const unit = t(`search.common.unit.${unitKey}`);
  if (item.updatedTo && item.updatedTo < item.episodeCount) {
    return t('search.common.updatedTo', { n: item.updatedTo, unit });
  }
  return t('search.common.totalEp', { n: item.episodeCount, unit });
}

// ---------------------------------------------------------------- 关键词匹配
function scoreCatalog(item: CatalogItem, kw: string): number {
  if (!kw) return 0;
  if (item.title === kw) return 100;
  if (item.title.includes(kw)) return 80;
  if (kw.includes(item.title)) return 60;
  if (item.tags.some((x) => x.includes(kw) || (x.length >= 2 && kw.includes(x)))) return 40;
  if (item.recTitle.includes(kw) || item.desc.includes(kw)) return 30;
  if (item.actors.some((a) => kw.includes(a)) || (item.director && kw.includes(item.director))) return 20;
  return 0;
}

/**
 * 片库检索:matched 靠前(exact = 精确命中片名);
 * 结果不足时按 spec(广告卡移除,同类内容卡补齐)用热搜榜 + 其余片库补满版面。
 */
export function searchCatalog(kw: string): { exact: CatalogItem | null; list: CatalogItem[] } {
  const k = kw.trim();
  const matched = CATALOG
    .map((it) => ({ it, s: scoreCatalog(it, k) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.it);
  const exact = matched.length > 0 && matched[0].title === k ? matched[0] : null;
  const seen = new Set(matched.map((m) => m.id));
  const fill: CatalogItem[] = [];
  for (const id of RANKS.hot ?? []) {
    const c = CATALOG.find((x) => x.id === id);
    if (c && !seen.has(c.id)) { fill.push(c); seen.add(c.id); }
  }
  for (const c of CATALOG) {
    if (!seen.has(c.id)) { fill.push(c); seen.add(c.id); }
  }
  return { exact, list: [...matched.filter((m) => m !== exact), ...fill] };
}

export type SortId = 'mixed' | 'newest' | 'hottest' | 'rated';
export const SORTS: SortId[] = ['mixed', 'newest', 'hottest', 'rated'];

/** 排序行(轻做:每种排序一套预置顺序) */
export function sortList(list: CatalogItem[], sort: SortId): CatalogItem[] {
  if (sort === 'mixed') return list;
  const arr = [...list];
  if (sort === 'newest') arr.sort((a, b) => b.year - a.year);
  else if (sort === 'hottest') arr.sort((a, b) => b.heat - a.heat);
  else arr.sort((a, b) => b.rating - a.rating);
  return arr;
}

/** 短视频tab:标题命中优先,其余补齐版面 */
export function searchShorts(kw: string): ShortVideo[] {
  const k = kw.trim();
  const matched = k ? SHORTS.filter((s) => s.title.includes(k)) : [];
  const rest = SHORTS.filter((s) => !matched.includes(s));
  return [...matched, ...rest];
}

/** 用户tab:昵称/认证命中;无命中给少量通用用户卡 */
export function searchCreators(kw: string): Creator[] {
  const k = kw.trim();
  const matched = k ? CREATORS.filter((c) => c.name.includes(k) || c.verify.includes(k)) : [];
  return matched.length > 0 ? matched : CREATORS.slice(0, 4);
}

export function creatorName(creatorId: string): string {
  return CREATORS.find((c) => c.id === creatorId)?.name ?? '';
}

/** 联想候选(suggest 态):片库/短剧/短视频/热词/发现词按输入前缀过滤 */
export function suggestWords(input: string): string[] {
  const k = input.trim();
  if (!k) return [];
  const pool: string[] = [
    ...CATALOG.map((c) => c.title),
    ...SHORT_DRAMAS.map((d) => d.title),
    ...HOTWORDS.map((h) => h.word),
    ...DISCOVER_BATCHES.flat().map((d) => d.word),
    ...SHORTS.map((s) => s.title),
  ];
  const out: string[] = [];
  for (const w of pool) {
    if (w.includes(k) && w !== k && !out.includes(w)) out.push(w);
    if (out.length >= 10) break;
  }
  return out;
}
