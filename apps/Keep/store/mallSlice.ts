// apps/Keep/store/mallSlice.ts —— Mall 域 actions(簇C:商城/SKU/购物车/下单/支付/订单)
import * as TimeService from '@/os/TimeService';
import type {
  KeepSet, KeepGet, KeepOrder, KeepOrderDraft, KeepOrderDraftItem, KeepProduct,
} from '../types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function nowDateTime(): string {
  const d = TimeService.getDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 普通促销品按成交价计；带自动代金券的新人品按划线价计后再抵券。 */
function draftUnitPrice(product: KeepProduct): number {
  return product.coupon ? (product.origPrice ?? product.price) : product.price;
}

/** 满 99 自动减 47；主商品数量和顺手买加购都参与门槛计算。 */
function couponForDraft(draft: KeepOrderDraft, products: KeepProduct[]): number {
  const itemTotal = draft.items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return sum + (product ? draftUnitPrice(product) * item.count : 0);
  }, 0);
  const addonTotal = draft.addonIds.reduce((sum, id) => {
    const product = products.find((candidate) => candidate.id === id);
    return sum + (product?.price ?? 0);
  }, 0);
  return itemTotal + addonTotal >= 99 ? 47 : 0;
}

export interface DraftTotals {
  /** 商品总价(按划线原价计) */
  goodsTotal: number;
  /** 自动领取的代金券抵扣 */
  coupon: number;
  /** 小计 = 总价 - 券 */
  subtotal: number;
  /** 运动币抵扣 */
  coinDeduct: number;
  /** 实际支付 */
  payable: number;
  /** 已优惠 */
  saved: number;
  /** 共 n 件 */
  count: number;
}

/** 下单草稿合计(order.confirm / order.pay 共用;evidence recI:196 → 券-47 → 币-2.48 → 146.52) */
export function computeDraftTotals(draft: KeepOrderDraft, products: KeepProduct[]): DraftTotals {
  let goodsTotal = 0;
  let coinAvail = 0;
  let count = 0;
  for (const it of draft.items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) continue;
    goodsTotal += draftUnitPrice(p) * it.count;
    coinAvail += (p.coinDeduct ?? 0) * it.count;
    count += it.count;
  }
  for (const pid of draft.addonIds) {
    const p = products.find((x) => x.id === pid);
    if (!p) continue;
    goodsTotal += p.price;
    count += 1;
  }
  goodsTotal = round2(goodsTotal);
  const coupon = draft.couponAmount;
  const subtotal = round2(goodsTotal - coupon);
  const coinDeduct = draft.coinChecked ? round2(coinAvail) : 0;
  const payable = round2(Math.max(0, subtotal - coinDeduct));
  const saved = round2(goodsTotal - payable);
  return { goodsTotal, coupon, subtotal, coinDeduct, payable, saved, count };
}

export interface MallActions {
  /** SKU 弹层加购:合并购物车条目,toast「已加入购物车」,角标 +1 */
  addToCart: (productId: string, skuId: string, count: number) => void;
  /** 购物车行勾选切换 */
  toggleCartItemChecked: (productId: string, skuId: string) => void;
  /** 购物车全选/取消全选 */
  setCartAllChecked: (checked: boolean) => void;
  /** 购物车数量 ±(最小 1) */
  stepCartQty: (productId: string, skuId: string, delta: number) => void;
  /** 管理态删除已勾选商品行 */
  removeCheckedCartItems: () => void;
  /** 新人 ¥100 券包领取 */
  claimNewuserCoupon: () => void;
  /** 进入下单链路:写入草稿(mall.sku 直接购买 / mall.cart 去结算) */
  beginOrderDraft: (items: KeepOrderDraftItem[], addonIds?: string[]) => void;
  /** order.confirm 进入时一次性自动领券(满99 -¥47)+ toast */
  autoClaimOrderCoupon: () => void;
  /** 确认订单页数量 ± */
  stepDraftQty: (index: number, delta: number) => void;
  /** 顺手买一件勾选切换 */
  toggleDraftAddon: (productId: string) => void;
  /** 运动币抵扣勾选切换 */
  toggleDraftCoin: () => void;
  /** 支付方式单选(支付宝支付/微信支付) */
  setDraftPayMethod: (method: string) => void;
  /** mock 支付成功:订单写入列表顶部(待收货),清草稿,清对应购物车行 */
  completePayment: () => void;
  /** 订单列表删除订单 */
  deleteOrder: (orderId: string) => void;
}

export function createMallSlice(set: KeepSet, get: KeepGet): MallActions {
  return {
    addToCart: (productId, skuId, count) =>
      set((s) => {
        const exist = s.cart.find((c) => c.productId === productId && c.skuId === skuId);
        const cart = exist
          ? s.cart.map((c) =>
              c.productId === productId && c.skuId === skuId ? { ...c, count: c.count + count } : c,
            )
          : [...s.cart, { productId, skuId, count, checked: true }];
        return { cart, lastToast: '已加入购物车' };
      }),

    toggleCartItemChecked: (productId, skuId) =>
      set((s) => ({
        cart: s.cart.map((c) =>
          c.productId === productId && c.skuId === skuId ? { ...c, checked: !(c.checked ?? true) } : c,
        ),
      })),

    setCartAllChecked: (checked) =>
      set((s) => ({ cart: s.cart.map((c) => ({ ...c, checked })) })),

    stepCartQty: (productId, skuId, delta) =>
      set((s) => ({
        cart: s.cart.map((c) =>
          c.productId === productId && c.skuId === skuId
            ? { ...c, count: Math.max(1, c.count + delta) }
            : c,
        ),
      })),

    removeCheckedCartItems: () =>
      set((s) => ({
        cart: s.cart.filter((c) => !(c.checked ?? true)),
        lastToast: '已删除所选商品',
      })),

    claimNewuserCoupon: () => {
      if (get().newuserCouponClaimed) {
        set(() => ({ lastToast: '券包已领取' }));
        return;
      }
      set(() => ({ newuserCouponClaimed: true, lastToast: '券包领取成功' }));
    },

    beginOrderDraft: (items, addonIds = []) =>
      set(() => ({
        orderDraft: {
          items,
          addonIds,
          couponAmount: 0,
          couponToasted: false,
          coinChecked: true,
          payMethod: '支付宝支付',
        },
      })),

    autoClaimOrderCoupon: () => {
      const s = get();
      const draft = s.orderDraft;
      if (!draft) return;
      const coupon = couponForDraft(draft, s.products);
      const shouldToast = coupon > 0 && !draft.couponToasted;
      set(() => ({
        orderDraft: { ...draft, couponAmount: coupon, couponToasted: draft.couponToasted || coupon > 0 },
        ...(shouldToast ? { lastToast: '已帮您自动领取一张优惠券,下单更省钱!' } : {}),
      }));
    },

    stepDraftQty: (index, delta) =>
      set((s) => {
        if (!s.orderDraft) return {};
        const nextDraft = {
          ...s.orderDraft,
          items: s.orderDraft.items.map((it, i) =>
            i === index ? { ...it, count: Math.max(1, it.count + delta) } : it,
          ),
        };
        return {
          orderDraft: { ...nextDraft, couponAmount: couponForDraft(nextDraft, s.products) },
        };
      }),

    toggleDraftAddon: (productId) =>
      set((s) => {
        if (!s.orderDraft) return {};
        const on = s.orderDraft.addonIds.includes(productId);
        const nextDraft = {
          ...s.orderDraft,
          addonIds: on
            ? s.orderDraft.addonIds.filter((id) => id !== productId)
            : [...s.orderDraft.addonIds, productId],
        };
        return {
          orderDraft: { ...nextDraft, couponAmount: couponForDraft(nextDraft, s.products) },
        };
      }),

    toggleDraftCoin: () =>
      set((s) => (s.orderDraft ? { orderDraft: { ...s.orderDraft, coinChecked: !s.orderDraft.coinChecked } } : {})),

    setDraftPayMethod: (method) =>
      set((s) => (s.orderDraft ? { orderDraft: { ...s.orderDraft, payMethod: method } } : {})),

    completePayment: () => {
      const s = get();
      const draft = s.orderDraft;
      if (!draft || draft.items.length === 0) return;
      const totals = computeDraftTotals(draft, s.products);
      const first = s.products.find((p) => p.id === draft.items[0].productId);
      const firstSku = first?.skus.find((k) => k.id === draft.items[0].skuId);
      const d = TimeService.getDate();
      const orderIdBase = `KP${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
      const sameSecondCount = s.orders.filter((order) => order.id === orderIdBase || order.id.startsWith(`${orderIdBase}_`)).length;
      const orderId = sameSecondCount === 0 ? orderIdBase : `${orderIdBase}_${sameSecondCount + 1}`;
      const extra = totals.count - draft.items[0].count;
      const order: KeepOrder = {
        id: orderId,
        type: '商城',
        title: `${first?.title ?? '商城商品'}${extra > 0 ? ` 等${totals.count}件` : ''}`,
        status: '待收货',
        amount: totals.goodsTotal,
        paidAmount: totals.payable,
        sku: firstSku?.label ?? '',
        payMethod: draft.payMethod,
        payTime: nowDateTime(),
        createTime: nowDateTime(),
        addressName: s.settings.address.name,
        addressPhone: s.settings.address.phone,
        address: s.settings.address.detail,
        cover: first?.cover ?? 'banner_newuser',
      };
      const draftKeys = draft.items.map((it) => `${it.productId}|${it.skuId}`);
      set((st) => ({
        orders: [order, ...st.orders],
        cart: st.cart.filter((c) => !draftKeys.includes(`${c.productId}|${c.skuId}`)),
        orderDraft: null,
        current: { ...st.current, orderId },
      }));
    },

    deleteOrder: (orderId) =>
      set((s) => ({
        orders: s.orders.filter((o) => o.id !== orderId),
        lastToast: '订单已删除',
      })),
  };
}
