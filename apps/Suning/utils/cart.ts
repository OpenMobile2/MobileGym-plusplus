/**
 * 购物车域共享派生逻辑(M3):店铺分组、勾选合计、PK 对比参数表。
 * PK 按购物车商品品类动态分组(走查 0729-2);同品类满 2 件可对比,不足时用同品类目录商品补齐。
 */
import { SUNING_CONFIG } from '../data';
import type { CartItem, CompareGroup, CompareParamKey, Product, ProductCategory } from '../types';

export interface CartShopGroup {
  shopId: string;
  items: CartItem[];
}

/** 按店铺分组,保持条目原顺序(店铺首次出现的先后) */
export function shopGroups(items: CartItem[]): CartShopGroup[] {
  const order: string[] = [];
  for (const it of items) if (!order.includes(it.shopId)) order.push(it.shopId);
  return order.map((shopId) => ({ shopId, items: items.filter((i) => i.shopId === shopId) }));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** 合计 = Σ勾选项现价×数量(s297:9.6+5299+7749=13057.6) */
export function selectedTotal(items: CartItem[], selectedIds: string[]): number {
  return round2(
    items.filter((i) => selectedIds.includes(i.id)).reduce((sum, i) => sum + i.price * i.qty, 0),
  );
}

/** 件数 = Σ数量(tabbar 角标与结算按钮 (n) 同口径) */
export const totalQty = (items: CartItem[]): number => items.reduce((sum, i) => sum + i.qty, 0);

export const COUPON_TAG = '领券';

/** 勾选项含可领券商品 → 结算按钮文案变体「领券结算(n)」(s297) */
export const hasCouponItem = (items: CartItem[]): boolean =>
  items.some((i) => (i.tags ?? []).includes(COUPON_TAG));

/** 勾选项含自营免运费件 → 运费行显示「免运费」(s297) */
export const hasFreeShipping = (items: CartItem[]): boolean => items.some((i) => i.freeShipping);

/* ============ PK 对比 ============ */

const CAT_LABEL: Partial<Record<ProductCategory, string>> = {
  laptop: '电脑品类',
  phone: '手机品类',
  tablet: '平板品类',
  ac: '空调品类',
  fan: '风扇品类',
  fridge: '冰箱品类',
  washer: '洗衣机品类',
  tv: '电视品类',
  kitchen: '厨电品类',
  tissue: '纸品品类',
  drink: '饮品品类',
  food: '食品品类',
  clean: '清洁品类',
};

const PARAM_KEYS: Partial<Record<ProductCategory, CompareParamKey[]>> = {
  laptop: SUNING_CONFIG.cart.compareGroup.paramKeys,
  phone: [
    { key: 'brand', label: '品牌' },
    { key: 'storage', label: '存储' },
    { key: 'screen', label: '屏幕' },
    { key: 'color', label: '颜色' },
  ],
  tablet: [
    { key: 'brand', label: '品牌' },
    { key: 'storage', label: '存储容量' },
    { key: 'screen', label: '屏幕尺寸' },
    { key: 'color', label: '颜色' },
  ],
  ac: [
    { key: 'brand', label: '品牌' },
    { key: 'hp', label: '匹数' },
    { key: 'energy', label: '能效' },
  ],
  fan: [
    { key: 'brand', label: '品牌' },
    { key: 'type', label: '类型' },
    { key: 'control', label: '控制方式' },
    { key: 'gears', label: '风力档位' },
  ],
};

function genericParamKeys(products: Product[]): CompareParamKey[] {
  const keys = new Set<string>(['brand']);
  for (const p of products) {
    for (const k of Object.keys(p.attrs)) {
      if (keys.size >= 10) break;
      keys.add(k);
    }
  }
  const labelOf: Record<string, string> = {
    brand: '品牌',
    model: '型号',
    spec: '规格',
    type: '类型',
    os: '系统',
    ram: '内存',
    rom: '存储',
    storage: '存储',
    screen: '屏幕',
  };
  return [...keys].map((key) => ({ key, label: labelOf[key] ?? key }));
}

const productOf = (id: string) => SUNING_CONFIG.products.find((p) => p.id === id);

/**
 * 从购物车动态生成可对比品类组(走查 0729-3:仅购物车内商品,购物车变更即同步)。
 * 同品类满 2 件才可对比;不从目录补齐。
 */
export function cartPkGroups(cartItems: CartItem[]): CompareGroup[] {
  const order: ProductCategory[] = [];
  const idsByCat = new Map<ProductCategory, string[]>();
  for (const it of cartItems) {
    const p = productOf(it.productId);
    if (!p) continue;
    if (!idsByCat.has(p.category)) {
      idsByCat.set(p.category, []);
      order.push(p.category);
    }
    const ids = idsByCat.get(p.category)!;
    if (!ids.includes(p.id)) ids.push(p.id);
  }

  const groups: CompareGroup[] = [];
  for (const cat of order) {
    let ids = [...(idsByCat.get(cat) ?? [])];
    if (ids.length < 2) continue;
    ids = ids.slice(0, 4);
    const products = ids.map((id) => productOf(id)).filter((p): p is Product => p != null);
    const paramKeys = PARAM_KEYS[cat] ?? genericParamKeys(products);
    groups.push({
      name: CAT_LABEL[cat] ?? `${cat}品类`,
      category: cat,
      productIds: ids,
      paramKeys,
      reputation: products.map((p) => ({
        productId: p.id,
        reviewText: `评价${p.reviewCount}·${p.goodRate}%好评`,
      })),
      service: {
        delivery: products.map((p) =>
          SUNING_CONFIG.shops.find((s) => s.id === p.shopId)?.type === 'self' ? '苏宁发货' : '店铺发货',
        ),
        deliveryEtaDayOffsets: products.map((_, i) => 2 + (i % 3)),
        install: '均无需安装',
        warranty: '支持延长保',
      },
    });
  }
  return groups;
}

/** 按 category / ids 取一组;缺省回落购物车第一组或种子电脑组 */
export const compareGroupOf = (
  groupId: string | null,
  idsCsv?: string | null,
  cartItems?: CartItem[],
): CompareGroup => {
  const dynamic = cartItems ? cartPkGroups(cartItems) : [];
  const ids = (idsCsv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const byCat =
    (groupId && dynamic.find((g) => g.category === groupId || g.name === groupId)) ||
    dynamic.find((g) => ids.length >= 2 && ids.every((id) => g.productIds.includes(id))) ||
    dynamic[0];

  const base = byCat ?? SUNING_CONFIG.cart.compareGroup;
  // 仅保留仍在购物车中的 ids(与 PK Tab 同步)
  const cartIdSet = cartItems ? new Set(cartItems.map((i) => i.productId)) : null;
  const useIds = cartIdSet ? ids.filter((id) => cartIdSet.has(id)) : ids;
  if (useIds.length >= 2) {
    const products = useIds.map((id) => productOf(id)).filter((p): p is Product => p != null);
    return {
      ...base,
      productIds: useIds,
      paramKeys: PARAM_KEYS[base.category] ?? genericParamKeys(products),
      reputation: products.map(
        (p) =>
          base.reputation.find((r) => r.productId === p.id) ?? {
            productId: p.id,
            reviewText: `评价${p.reviewCount}·${p.goodRate}%好评`,
          },
      ),
      service: {
        ...base.service,
        delivery: products.map(
          (_, i) => base.service.delivery[i] ?? (i === 0 ? '苏宁发货' : '店铺发货'),
        ),
        deliveryEtaDayOffsets: products.map((_, i) => base.service.deliveryEtaDayOffsets[i] ?? 2 + i),
      },
    };
  }
  return base;
};

export const compareProducts = (group: CompareGroup): Product[] =>
  group.productIds
    .map((id) => SUNING_CONFIG.products.find((p) => p.id === id))
    .filter((p): p is Product => p != null);

export interface CompareRow {
  key: string;
  label: string;
  values: string[];
  same: boolean;
}

/** 参数值:brand 取 Product.brand,其余取 attrs(数组用「/」连接) */
function paramValue(p: Product, key: string): string {
  if (key === 'brand') return p.brand;
  const raw = p.attrs[key];
  if (raw == null) return '-';
  return Array.isArray(raw) ? raw.join(' / ') : raw;
}

/** 参数逐行;same=各列取值相同,「只看不同」时过滤 */
export function compareRows(group: CompareGroup, products: Product[]): CompareRow[] {
  return group.paramKeys.map(({ key, label }) => {
    const values = products.map((p) => paramValue(p, key));
    return { key, label, values, same: new Set(values).size === 1 };
  });
}
