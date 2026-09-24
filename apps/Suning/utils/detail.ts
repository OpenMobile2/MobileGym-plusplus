/**
 * 商详域共享逻辑(M2):SKU 默认选中/已选文案/联动价格、快捷加购默认规格、评价标签云。
 * 纯函数,数据来自 SUNING_CONFIG(spec product.detail / product.reviews)。
 */
import { SUNING_CONFIG } from '../data';
import type { Product, RuntimeReviewItem, ReviewSummary } from '../types';

/** groupName -> optionId 的选中映射 */
export type SkuSelection = Record<string, string>;

/** 默认选中:每组取 hot 项,无 hot 取第一个未禁用项(s281 台地两用【3档调节】默认橙描边) */
export function defaultSelection(p: Product): SkuSelection {
  const sel: SkuSelection = {};
  for (const g of p.sku?.groups ?? []) {
    const hot = g.options.find((o) => o.hot && !o.disabled);
    const first = g.options.find((o) => !o.disabled);
    const pick = hot ?? first;
    if (pick) sel[g.name] = pick.id;
  }
  return sel;
}

/** 已选文案:各组选中项 label 空格连接;无 SKU 商品为空串(已选条显示「1件」) */
export function selectionText(p: Product, sel: SkuSelection): string {
  const parts: string[] = [];
  for (const g of p.sku?.groups ?? []) {
    const opt = g.options.find((o) => o.id === sel[g.name]);
    if (opt) parts.push(opt.label);
  }
  return parts.join(' ');
}

/** 选中项 id 连接(checkout.open 的 skuId 参数) */
export function selectionId(p: Product, sel: SkuSelection): string {
  const parts: string[] = [];
  for (const g of p.sku?.groups ?? []) {
    if (sel[g.name]) parts.push(sel[g.name]);
  }
  return parts.join('_') || 'default';
}

/** 联动价格:倒序找带价的选中项(平板价格挂在「配置」组),否则回落商品价 */
export function selectionPrice(p: Product, sel: SkuSelection): { price: number; priceOriginal: number } {
  const groups = p.sku?.groups ?? [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const opt = groups[i].options.find((o) => o.id === sel[groups[i].name]);
    if (opt?.price != null) {
      return { price: opt.price, priceOriginal: opt.priceOriginal ?? p.priceOriginal };
    }
  }
  return { price: p.price, priceOriginal: p.priceOriginal };
}

/** 快捷加购(店铺网格小按钮)的默认规格文案:默认选中组合;无 SKU 用「默认规格」 */
export function defaultSkuText(p: Product): string {
  const text = selectionText(p, defaultSelection(p));
  return text || '默认规格';
}

/** 评价标签云关键词表(s341:质量优/使用方便/风很柔和…;计数=命中评价条数) */
const TAG_KEYWORDS: Array<[string, string[]]> = [
  ['质量优', ['质量', '品质']],
  ['使用方便', ['方便', '顺手', '好用']],
  ['风很柔和', ['柔和', '睡眠风']],
  ['底座很稳', ['底座', '很稳']],
  ['静音', ['安静', '静音']],
  ['睡眠风不错', ['睡眠风']],
  ['材质很好', ['材质']],
  ['噪音很小', ['噪音', '噪声']],
  ['遥控方便', ['遥控']],
  ['屏幕细腻', ['屏幕', '细腻', '高刷']],
  ['续航满意', ['续航', '电池']],
  ['运行流畅', ['流畅', '不卡']],
  ['新鲜度好', ['新鲜', '果肉']],
  ['口感好', ['口感', '好吃', '香甜', '好喝']],
  ['包装完好', ['包装']],
  ['发货快', ['发货', '物流', '送货']],
];

export interface ReviewTag {
  label: string;
  count: number;
}

/** 从评价文本推标签云(deterministic;计数与列表过滤共用同一命中逻辑) */
export function reviewTags(items: RuntimeReviewItem[]): ReviewTag[] {
  const out: ReviewTag[] = [];
  for (const [label, kws] of TAG_KEYWORDS) {
    const count = items.filter((it) => kws.some((k) => it.text.includes(k))).length;
    if (count > 0) out.push({ label, count });
  }
  return out;
}

/** 某条评价是否命中标签 */
export function reviewHasTag(item: RuntimeReviewItem, tagLabel: string): boolean {
  const entry = TAG_KEYWORDS.find(([label]) => label === tagLabel);
  if (!entry) return false;
  return entry[1].some((k) => item.text.includes(k));
}

/** 优质评价判定(≥4星且文字充实;与 summary.quality 的口径注记一致) */
export const isPremiumReview = (it: RuntimeReviewItem): boolean => it.stars >= 4 && it.text.length >= 12;

/** 无全量评价种子的列表级商品:按商品字段合成 summary(items 空 → 页面空态) */
export function fallbackSummary(p: Product): ReviewSummary {
  return {
    total: p.reviewCount,
    withImages: Math.floor(p.reviewCount / 5),
    quality: Math.floor((p.reviewCount * p.goodRate) / 100),
    mid: Math.max(0, Math.floor(p.reviewCount / 20)),
    bad: 0,
    goodRate: p.goodRate,
  };
}

export const productOf = (productId: string): Product | undefined =>
  SUNING_CONFIG.products.find((p) => p.id === productId);

export const shopOf = (shopId: string) => SUNING_CONFIG.shops.find((s) => s.id === shopId);

/** 客服会话标题(chatConfig.byShop;兜底店名/苏宁客服) */
export function chatTitleOf(shopId: string): string {
  const cfg = SUNING_CONFIG.chatConfig.byShop.find((c) => c.shopId === shopId);
  if (cfg) return cfg.title;
  return shopOf(shopId)?.name ?? '苏宁客服';
}

/** 规则回复引擎:命中关键词 → 预设答案,未命中 → 兜底(热门问题/chips/自由输入共用) */
export function ruleReply(text: string): string {
  for (const r of SUNING_CONFIG.chatConfig.common.rules) {
    if (r.keywords.some((k) => text.includes(k))) return r.reply;
  }
  return SUNING_CONFIG.chatConfig.common.fallback;
}

/** attrs 键 → 规格参数表行名(Q13=A:商详图文详情区按品类推断的参数表) */
const ATTR_LABELS: Record<string, string> = {
  type: '类型',
  control: '控制方式',
  gears: '风力档位',
  windMode: '风类型',
  blades: '扇叶数',
  display: '显示方式',
  features: '功能',
  storage: '存储容量',
  screen: '屏幕尺寸',
  ram: '运行内存',
  os: '操作系统',
  resolution: '分辨率',
  cpuCores: 'CPU核数',
  weight: '机身重量',
  spec: '规格',
  flavor: '口味',
  origin: '产地',
  capacity: '容量',
  power: '功率',
  energy: '能效等级',
  service: '服务',
};

export interface AttrRow {
  label: string;
  value: string;
}

/** 规格参数表行(4~8 行;service 等多值键用「/」连接,未知键跳过) */
export function attrRows(p: Product): AttrRow[] {
  const rows: AttrRow[] = [];
  for (const [key, raw] of Object.entries(p.attrs)) {
    const label = ATTR_LABELS[key];
    if (!label) continue;
    const value = Array.isArray(raw) ? raw.join(' / ') : raw;
    if (value) rows.push({ label, value });
  }
  return rows.slice(0, 8);
}

/** 粉丝数文案:7.6万 / 492.9万 / 514 */
export const fansText = (n: number): string =>
  n >= 10000 ? `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万` : String(n);
