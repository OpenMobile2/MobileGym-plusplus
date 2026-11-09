/**
 * 搜索匹配 + 筛选条件求值(搜索结果页 / 品牌专场共用)。
 *
 * 两条硬约束:
 * 1. 关键词匹配不到时返回空数组,绝不回落成"全部商品" —— 否则一排序就把无关品类顶上来。
 * 2. 筛选项由当前候选集动态派生,不用写死清单 —— 写死的选项会和数据漂移
 *    (如"粉色/蓝色/控油"在商品里一件都没有,选了必然空列表)。
 */
import type { VipItem } from '../types';
import { catLabel } from '../constants';

/** 联想词会拼出"裙子特价/裙子包邮",这些营销后缀不参与匹配 */
const QUERY_NOISE = ['特价', '包邮', '正品', '旗舰店', '官方', '专柜', '新款', '爆款', '断码', '清仓'];

/** 无区分度的单字,不足以判定品类("裙子"里的"子") */
const WEAK_CHARS = new Set(['子', '的', '款', '式', '类', '装', '品']);

export function normalizeQuery(q: string): string {
  let s = q.trim();
  for (const w of QUERY_NOISE) s = s.split(w).join('');
  return s.trim();
}

function haystack(it: VipItem): string {
  return `${it.title} ${it.subCategory} ${it.brandName} ${it.tags.join('')} ${catLabel(it.category)}`;
}

/**
 * 关键词 → 商品集合。三级匹配,命中即止:
 *  1) 整词命中(标题/二级分类/品牌/标签/一级品类名)
 *  2) 查询词包含二级分类("平底凉鞋" → 凉鞋)
 *  3) 查询词的有效单字命中二级分类/一级品类("裙子" → 连衣裙、半身裙)
 * 三级都不中则返回空 —— 交由调用方显示空态,而不是把整个商品库倒出来。
 */
export function matchItems(items: VipItem[], q: string): VipItem[] {
  const nq = normalizeQuery(q);
  if (!nq) return items;

  const direct = items.filter((it) => {
    if (haystack(it).includes(nq)) return true;
    if (!it.subCategory || !nq.includes(it.subCategory)) return false;
    const extra = nq.split(it.subCategory).join('').trim();
    if (!extra) return true;
    return it.title.includes(extra) || it.tags.some((tag) => tag.includes(extra));
  });
  if (direct.length > 0) return direct;

  const chars = [...nq].filter((c) => !WEAK_CHARS.has(c));
  if (chars.length === 0) return [];
  return items.filter((it) =>
    chars.some((c) => it.subCategory.includes(c) || catLabel(it.category).includes(c)),
  );
}

/**
 * "2.3万人购买" → 23000。
 * 销量排序必须用卡片上真正展示的 sold 字段:数据里的 reviewCount 是 13×price+800
 * 的派生值(等价于价格降序),拿它排完,用户看到的 sold 数字仍是乱的,就成了"点了没变化"。
 */
export function soldCount(sold: string): number {
  const m = /([\d.]+)\s*(万|千)?/.exec(sold || '');
  if (!m) return 0;
  const n = parseFloat(m[1]) || 0;
  if (m[2] === '万') return n * 10000;
  if (m[2] === '千') return n * 1000;
  return n;
}

/**
 * 主品类锁定:结果里某一级品类占比过半时只保留它。
 * 防止少量误入的别品类商品在价格升序时被顶到最前。
 */
export function lockPrimaryCategory(items: VipItem[]): VipItem[] {
  if (items.length === 0) return items;
  const freq = new Map<string, number>();
  items.forEach((it) => freq.set(it.category, (freq.get(it.category) ?? 0) + 1));
  let best: string | null = null;
  let bestN = 0;
  freq.forEach((n, c) => { if (n > bestN) { bestN = n; best = c; } });
  return best && bestN / items.length >= 0.5 ? items.filter((it) => it.category === best) : items;
}

/* ---------------- 筛选 ---------------- */

export interface FilterGroup {
  id: string;
  label: string;
  options: string[];
}

const PRICE_BUCKETS = [
  { id: '100以下', min: 0, max: 100 },
  { id: '100-200', min: 100, max: 200 },
  { id: '200-300', min: 200, max: 300 },
  { id: '300以上', min: 300, max: Number.POSITIVE_INFINITY },
] as const;

/** 选中项编码成 `分组:选项`,这样求值时知道该比哪个字段 */
export function filterToken(groupId: string, option: string): string {
  return `${groupId}:${option}`;
}

function topByFreq(values: string[], n: number): string[] {
  const freq = new Map<string, number>();
  values.forEach((v) => { if (v) freq.set(v, (freq.get(v) ?? 0) + 1); });
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map((e) => e[0]);
}

/**
 * 按当前候选集派生筛选分组。只保留选项数 >1 的分组
 * ——只有一个选项的分组选了等于没筛,白占版面。
 */
export function buildFilterGroups(items: VipItem[]): FilterGroup[] {
  const groups: FilterGroup[] = [
    {
      id: 'price',
      label: '价格区间',
      options: PRICE_BUCKETS.filter((b) => items.some((it) => it.price >= b.min && it.price < b.max)).map((b) => b.id),
    },
    { id: 'brand', label: '品牌', options: topByFreq(items.map((it) => it.brandName), 8) },
    { id: 'category', label: '分类', options: topByFreq(items.map((it) => it.subCategory), 8) },
    { id: 'tag', label: '风格 / 属性', options: topByFreq(items.flatMap((it) => it.tags), 10) },
  ];
  return groups.filter((g) => g.options.length > 1);
}

function matchOption(it: VipItem, groupId: string, option: string): boolean {
  if (groupId === 'price') {
    const b = PRICE_BUCKETS.find((x) => x.id === option);
    return !!b && it.price >= b.min && it.price < b.max;
  }
  if (groupId === 'brand') return it.brandName === option;
  if (groupId === 'category') return it.subCategory === option;
  if (groupId === 'tag') return it.tags.includes(option);
  return true;
}

/** 组内 OR、组间 AND(电商筛选的通行语义) */
export function applyFilters(items: VipItem[], selected: string[]): VipItem[] {
  if (selected.length === 0) return items;
  const byGroup = new Map<string, string[]>();
  for (const token of selected) {
    const i = token.indexOf(':');
    if (i < 0) continue;
    const g = token.slice(0, i);
    const o = token.slice(i + 1);
    byGroup.set(g, [...(byGroup.get(g) ?? []), o]);
  }
  return items.filter((it) => {
    for (const [g, opts] of byGroup) {
      if (!opts.some((o) => matchOption(it, g, o))) return false;
    }
    return true;
  });
}
