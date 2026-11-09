/**
 * 搜索域共享逻辑(M1):关键词匹配 / 排序 / 快捷筛选 / 筛选面板过滤。
 * 纯函数,数据来自 SUNING_CONFIG(spec search.results:种子词全量结果,其余词回退通用列表)。
 */
import { SUNING_CONFIG } from '../data';
import type { Product, ProductCategory, SearchFilterState } from '../types';

/** 关键词里出现这些词 → 限定品类(title 命中不足以跨品类,如「风扇」匹配空调扇文案) */
const CATEGORY_WORDS: Array<[string, ProductCategory]> = [
  ['循环扇', 'fan'],
  ['落地扇', 'fan'],
  ['塔扇', 'fan'],
  ['风扇', 'fan'],
  ['平板', 'tablet'],
  ['matepad', 'tablet'],
  ['空调', 'ac'],
  ['冰箱', 'fridge'],
  ['洗衣机', 'washer'],
  ['电视', 'tv'],
  ['手机', 'phone'],
  ['iphone', 'phone'],
  ['笔记本', 'laptop'],
  ['电脑', 'laptop'],
  ['抽纸', 'tissue'],
  ['纸巾', 'tissue'],
  ['可乐', 'drink'],
  ['面包', 'food'],
  ['榴莲', 'food'],
  ['洗洁精', 'clean'],
];

/** 金刚区/频道词 → 多品类并集(走查 0729:家电/超市/手机电脑列表) */
const CHANNEL_CATS: Array<[string, ProductCategory[]]> = [
  ['家电', ['ac', 'fridge', 'washer', 'tv', 'fan', 'kitchen']],
  ['超市', ['tissue', 'drink', 'food', 'clean']],
  ['手机电脑', ['phone', 'tablet', 'laptop']],
];

const ALL_BRANDS = [...new Set(SUNING_CONFIG.products.map((p) => p.brand))];

export interface KeywordMatch {
  products: Product[];
  /** true=未命中任何种子商品,回退通用列表(spec:其余词回退通用结果列表) */
  fallback: boolean;
}

/** 结果按 keyword 过滤 products(title/brand/category 匹配) */
export function matchProducts(keywordRaw: string): KeywordMatch {
  const kw = keywordRaw.trim().toLowerCase();
  const all = SUNING_CONFIG.products;
  if (!kw) return { products: fallbackList(), fallback: true };

  for (const [w, cats] of CHANNEL_CATS) {
    if (kw === w || kw.includes(w)) {
      const list = all.filter((p) => cats.includes(p.category));
      if (list.length > 0) return { products: list, fallback: false };
    }
  }

  const cats = new Set<ProductCategory>();
  for (const [w, c] of CATEGORY_WORDS) if (kw.includes(w)) cats.add(c);
  const brands = ALL_BRANDS.filter((b) => kw.includes(b.toLowerCase()));

  let list = all.filter((p) => {
    const title = p.title.toLowerCase();
    if (cats.size > 0 && !cats.has(p.category)) return false;
    if (brands.length > 0 && !brands.some((b) => p.brand === b || title.includes(b.toLowerCase()))) return false;
    if (cats.size === 0 && brands.length === 0) return title.includes(kw) || p.brand.toLowerCase() === kw;
    return true;
  });
  // 纯 title 子串兜底(如「拯救者」命中拯救者Y900)
  if (list.length === 0) list = all.filter((p) => p.title.toLowerCase().includes(kw));
  if (list.length === 0) return { products: fallbackList(), fallback: true };
  return { products: list, fallback: false };
}

/** 按当前结果集裁剪品牌选项 + 价格档(纸巾不会出现「5000以上」) */
export function adaptFilterDims(
  dims: import('../types').FilterDim[],
  products: Product[],
): import('../types').FilterDim[] {
  const brands = [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'zh'));
  const prices = products.map((p) => p.price);
  const max = prices.length ? Math.max(...prices) : 0;
  const presets =
    max <= 50
      ? ['0-10', '10-20', '20-50', '50以上']
      : max <= 200
        ? ['0-50', '50-99', '100-199', '200以上']
        : max <= 1000
          ? ['0-99', '100-499', '500-999', '1000以上']
          : max <= 4000
            ? ['0-999', '1000-1999', '2000-3999', '4000以上']
            : ['0-1999', '2000-3999', '4000-5999', '6000以上'];
  return dims.map((d) => {
    if (d.key === 'brand') return { ...d, options: brands.length > 0 ? brands : d.options };
    if (d.key === 'priceRange') return { ...d, presets };
    return d;
  });
}

/** 通用回退列表:按月销 Top 10(deterministic) */
function fallbackList(): Product[] {
  return [...SUNING_CONFIG.products].sort((a, b) => b.rankFields.sales - a.rankFields.sales).slice(0, 10);
}

/** 结果集主品类(spec:筛选维度按当前结果主品类选 fan/tablet/generic) */
export function primaryCategory(list: Product[]): ProductCategory | null {
  const count = new Map<ProductCategory, number>();
  for (const p of list) count.set(p.category, (count.get(p.category) ?? 0) + 1);
  let best: ProductCategory | null = null;
  let bestN = 0;
  for (const [c, n] of count) if (n > bestN) { best = c; bestN = n; }
  return best;
}

export type SortKey = 'default' | 'sales' | 'priceAsc' | 'priceDesc' | 'shop';

export function sortProducts(list: Product[], sort: SortKey): Product[] {
  const out = [...list];
  if (sort === 'sales') out.sort((a, b) => b.rankFields.sales - a.rankFields.sales);
  else if (sort === 'priceAsc') out.sort((a, b) => a.price - b.price);
  else if (sort === 'priceDesc') out.sort((a, b) => b.price - a.price);
  return out;
}

const serviceOf = (p: Product): string[] => {
  const s = p.attrs['service'];
  return Array.isArray(s) ? s : typeof s === 'string' ? [s] : [];
};

/** 新品判定:上市天数 ≤30(rankFields.newness 越小越新) */
export const isNewProduct = (p: Product): boolean => p.rankFields.newness <= 30;

/** 快捷筛选 chips(政府补贴/苏宁服务/24小时发货/新品/价保) */
export function matchQuickFilter(p: Product, chip: string): boolean {
  if (chip === '政府补贴') return p.promoTag === 'gov';
  if (chip === '苏宁服务') return serviceOf(p).length > 0;
  if (chip === '新品') return isNewProduct(p);
  return serviceOf(p).includes(chip); // 24小时发货 / 价保 / 省心购…
}

/** 「500以上」/「0-99」→ [min,max] */
function parsePreset(preset: string): [number, number] {
  if (preset.includes('-')) {
    const [lo, hi] = preset.split('-');
    return [Number(lo) || 0, Number(hi) || Infinity];
  }
  return [parseFloat(preset) || 0, Infinity];
}

/** 维度值匹配:attr 为数组则含选值;字符串按包含;「N档及以上/N以上」按数值比较 */
function matchAttrValue(attrVal: string | string[] | undefined, sel: string): boolean {
  if (attrVal === undefined) return false;
  if (Array.isArray(attrVal)) return attrVal.includes(sel);
  if (/以上$/.test(sel)) {
    const n = parseFloat(sel);
    const v = parseFloat(attrVal);
    return Number.isFinite(n) && Number.isFinite(v) && v >= n;
  }
  return attrVal.includes(sel.replace(/及以上$/, ''));
}

/** 筛选面板条件过滤(dims ANY-within/AND-across + 价格区间;brand 走 Product.brand) */
export function applyFilterState(list: Product[], f: SearchFilterState | null): Product[] {
  if (!f) return list;
  return list.filter((p) => {
    for (const [dim, values] of Object.entries(f.dims)) {
      if (values.length === 0) continue;
      let ok: boolean;
      if (dim === 'brand') ok = values.some((v) => p.brand === v || p.title.includes(v));
      else if (dim === 'service') ok = values.some((v) => serviceOf(p).includes(v) || (v === '政府补贴' && p.promoTag === 'gov'));
      else ok = values.some((v) => matchAttrValue(p.attrs[dim], v));
      if (!ok) return false;
    }
    let lo = 0;
    let hi = Infinity;
    if (f.pricePreset) [lo, hi] = parsePreset(f.pricePreset);
    if (f.priceMin !== '') lo = Math.max(lo, parseFloat(f.priceMin) || 0);
    if (f.priceMax !== '') hi = Math.min(hi, parseFloat(f.priceMax) || Infinity);
    return p.price >= lo && p.price <= hi;
  });
}

export const filterStateActive = (f: SearchFilterState | null): boolean =>
  f !== null &&
  (Object.values(f.dims).some((v) => v.length > 0) || f.pricePreset !== null || f.priceMin !== '' || f.priceMax !== '');

/** 促销标文案 */
export function promoLabel(p: Product): string | null {
  if (p.promoTag === 'gov') return '政府补贴';
  if (p.promoTag === 'baibu') return '百亿补贴';
  if (p.promoTag === 'juhui') return '大聚惠';
  return null;
}

/** 瀑布流「近N天搜索过万」文案(deterministic,s274 样式) */
export function searchHint(p: Product): string {
  const s = p.rankFields.sales;
  if (s >= 10000) return '近30天搜索过万';
  if (s >= 1000) return '近15天搜索过万';
  if (s >= 300) return '近7天搜索过千';
  return '近7天浏览过千';
}

/** 结果卡「已售」文案(s276:200+已售) */
export function soldText(p: Product): string {
  const s = p.rankFields.sales;
  if (s >= 10000) return `${Math.floor(s / 10000)}万+已售`;
  if (s >= 100) return `${Math.floor(s / 100) * 100}+已售`;
  return `${p.reviewCount}评价`;
}

export const shopNameOf = (shopId: string): string =>
  SUNING_CONFIG.shops.find((s) => s.id === shopId)?.name ?? '苏宁易购';

export const isSelfShop = (shopId: string): boolean =>
  SUNING_CONFIG.shops.find((s) => s.id === shopId)?.type === 'self';

/** 输入联想:词表组(前缀命中)+ 商品 title/brand 前缀过滤,去重,cap 8(r1@3.6) */
export function suggestWords(input: string): string[] {
  const kw = input.trim().toLowerCase();
  if (!kw) return [];
  const out: string[] = [];
  for (const g of SUNING_CONFIG.searchConfig.suggest) {
    if (g.prefix.toLowerCase().startsWith(kw) || kw.startsWith(g.prefix.toLowerCase())) {
      out.push(...g.words);
    }
  }
  for (const p of SUNING_CONFIG.products) {
    if (p.brand.toLowerCase().startsWith(kw) || p.title.toLowerCase().includes(kw)) {
      const short = `${p.brand}${p.category === 'fan' ? '风扇' : ''} ${p.title.split(' ')[1] ?? ''}`.trim();
      out.push(short);
    }
  }
  return [...new Set(out)].slice(0, 8);
}
