import type { SkuGroup, TbCartLine, TbCoupon, TbShop, TbsgState } from './types';

/** 金额:分为单位计算,元展示 */
export const yuan = (cents: number) => Math.round(cents) / 100;
export const cents = (y: number) => Math.round(y * 100);
export const fmt = (y: number) => {
  const v = Math.round(y * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(v * 10 === Math.round(v * 10) ? 1 : 2);
};

/** SKU 选择 → 描述串 + 加价 */
export function skuDescOf(groups: SkuGroup[], sel: Record<string, string[]>): { desc: string; delta: number } {
  const parts: string[] = [];
  let delta = 0;
  for (const g of groups) {
    const chosen = sel[g.name] ?? [];
    for (const label of chosen) {
      const opt = g.options.find((o) => o.label === label);
      if (opt) {
        parts.push(label);
        delta += cents(opt.delta);
      }
    }
  }
  return { desc: parts.join('/'), delta: yuan(delta) };
}

/** 店铺内购物车行 */
export const shopCartLines = (s: Pick<TbsgState, 'cart'>, shopId: string): TbCartLine[] =>
  s.cart.filter((l) => l.shopId === shopId);

export const cartSubtotal = (lines: TbCartLine[]) =>
  yuan(lines.reduce((acc, l) => acc + cents(l.price) * l.qty, 0));

/** 满减:取满足门槛的最大档 */
export function promoOff(shop: TbShop, subtotal: number): number {
  let best = 0;
  for (const p of shop.promos) if (subtotal >= p.full && p.off > best) best = p.off;
  return best;
}

/** 必选品校验(spec D3):mustPickCat 分类中至少加购1件 */
export function mustPickSatisfied(shop: TbShop, lines: TbCartLine[]): boolean {
  if (!shop.mustPickCat) return true;
  const cat = shop.menu.find((m) => m.cat === shop.mustPickCat);
  if (!cat) return true;
  return lines.some((l) => cat.itemIds.includes(l.itemId));
}

/** 券是否可用于该金额 */
export const couponUsable = (c: TbCoupon, subtotal: number) =>
  c.status === 'claimed' && subtotal >= c.threshold;

/** 单店结算金额(qa:Q7 多店时逐店计算) */
export interface GroupAmounts {
  subtotal: number;
  packFee: number;
  deliveryFee: number;
  deliveryFeeOrig: number;
  promoOff: number;
  platformCouponOff: number;
  shopCouponOff: number;
  total: number;
  totalDiscount: number;
}

export function computeGroupAmounts(
  shop: TbShop,
  lines: TbCartLine[],
  opts: {
    mode: 'delivery' | 'pickup';
    platformCoupon?: TbCoupon | null;
    shopCoupon?: TbCoupon | null;
    vasFee?: number;
  },
): GroupAmounts {
  const subtotal = cartSubtotal(lines);
  const packFee = shop.type === 'restaurant' ? 2 : 0;
  const deliveryFee = opts.mode === 'pickup' ? 0 : shop.deliveryFee;
  const deliveryFeeOrig = opts.mode === 'pickup' ? 0 : shop.deliveryFeeOrig;
  const off = promoOff(shop, subtotal);
  const pOff = opts.platformCoupon && couponUsable(opts.platformCoupon, subtotal) ? opts.platformCoupon.amount : 0;
  const sOff = opts.shopCoupon && couponUsable(opts.shopCoupon, subtotal) ? opts.shopCoupon.amount : 0;
  const gross = cents(subtotal) + cents(packFee) + cents(deliveryFee) + cents(opts.vasFee ?? 0);
  const disc = cents(off) + cents(pOff) + cents(sOff);
  const total = yuan(Math.max(cents(0.01), gross - disc));
  const totalDiscount = yuan(disc + cents(deliveryFeeOrig) - cents(deliveryFee));
  return {
    subtotal, packFee, deliveryFee, deliveryFeeOrig,
    promoOff: off, platformCouponOff: pOff, shopCouponOff: sOff,
    total, totalDiscount,
  };
}

/** 距离到期的展示文案 */
export function expireText(expireAt: number, now: number): string {
  const d = expireAt - now;
  if (d <= 0) return '已过期';
  if (d < 24 * 3600_000) return '今日 23:59 到期';
  const days = Math.ceil(d / (24 * 3600_000));
  return `${days}天后到期`;
}
