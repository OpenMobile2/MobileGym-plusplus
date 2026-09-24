import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { seedTs, dayStart, etaTs } from './utils/appTime';
import { ruleReply } from './utils/detail';
import { SUNING_CONFIG } from './data';
import { DATA_VERSION } from './constants';
import type {
  FullState,
  AppActions,
  TempState,
  Address,
  CartItem,
  CheckoutDraft,
  CheckoutDraftItem,
  FollowedProduct,
  MsgSettings,
  RuntimeHistoryEntry,
  RuntimeMessageEntry,
  RuntimeOrder,
  RuntimeProductReviews,
  SearchFilterState,
  SeedAt,
} from './types';

const ts = (at: SeedAt) => seedTs(at.dayOffset, at.hm);

/* ============ 种子映射(SeedAt → 绝对时间戳,深拷贝) ============ */

function seedOrders(): RuntimeOrder[] {
  return SUNING_CONFIG.orders.map((o) => {
    const { timestamps, logistics, refund, etaDayOffset, ...rest } = o;
    return {
      ...rest,
      items: o.items.map((it) => ({ ...it })),
      invoice: o.invoice ? { ...o.invoice } : null,
      timestamps: {
        placed: ts(timestamps.placed),
        paid: timestamps.paid ? ts(timestamps.paid) : undefined,
        shipped: timestamps.shipped ? ts(timestamps.shipped) : undefined,
        delivered: timestamps.delivered ? ts(timestamps.delivered) : undefined,
        cancelled: timestamps.cancelled ? ts(timestamps.cancelled) : undefined,
      },
      logistics: logistics.map((n) => ({ ts: ts(n.at), title: n.title, desc: n.desc })),
      refund: refund
        ? {
            serviceNo: refund.serviceNo,
            status: refund.status,
            reason: refund.reason,
            amount: refund.amount,
            qty: refund.qty,
            steps: [...refund.steps],
            currentStep: refund.currentStep,
            appliedAtTs: ts(refund.appliedAt),
          }
        : undefined,
      etaTs: etaDayOffset != null ? etaTs(etaDayOffset) : undefined,
    };
  });
}

function seedCart(): CartItem[] {
  return SUNING_CONFIG.cart.items.map((i) => ({ ...i, tags: i.tags ? [...i.tags] : undefined }));
}

function seedHistory(): RuntimeHistoryEntry[] {
  // 同日内按种子顺序递减 1 分钟,保持列表顺序稳定
  return SUNING_CONFIG.history.map((e, idx) => ({
    productId: e.productId,
    ts: seedTs(e.dayOffset, '12:00') - idx * 60000,
  }));
}

function seedReviews(): Record<string, RuntimeProductReviews> {
  const out: Record<string, RuntimeProductReviews> = {};
  for (const [pid, r] of Object.entries(SUNING_CONFIG.reviews)) {
    out[pid] = {
      summary: { ...r.summary },
      items: r.items.map((it) => {
        const { at, ...rest } = it;
        return { ...rest, images: it.images ? [...it.images] : undefined, ts: ts(at) };
      }),
    };
  }
  return out;
}

function seedMsgs(): RuntimeMessageEntry[] {
  const now = TimeService.now();
  const raw = SUNING_CONFIG.messages.map((m) => {
    const { at, ...rest } = m;
    return { ...rest, ts: ts(at) };
  });
  // 种子若落在「模拟现在」之后(如 hm=18:59 而当前更早),整体前移,避免新消息被顶到假 18:59
  const maxSeed = raw.reduce((m, x) => Math.max(m, x.ts), 0);
  const skew = maxSeed > now ? maxSeed - now + 60_000 : 0;
  return skew > 0 ? raw.map((m) => ({ ...m, ts: m.ts - skew })) : raw;
}

const EMPTY_FILTER: SearchFilterState = { dims: {}, pricePreset: null, priceMin: '', priceMax: '' };

const cloneFilter = (f: SearchFilterState): SearchFilterState => ({
  dims: Object.fromEntries(Object.entries(f.dims).map(([k, v]) => [k, [...v]])),
  pricePreset: f.pricePreset,
  priceMin: f.priceMin,
  priceMax: f.priceMax,
});

const filterIsEmpty = (f: SearchFilterState): boolean =>
  Object.values(f.dims).every((v) => v.length === 0) &&
  f.pricePreset === null &&
  f.priceMin === '' &&
  f.priceMax === '';

const initialTemp: TempState = {
  toast: '',
  toastSeq: 0,
  multiSelect: [],
  editSelect: [],
  cancelReason: '',
  refundDraft: { reason: '', note: '' },
  nicknameDraft: '',
  profileDot: true,
  priceWatchDraft: '',
  payDigits: '',
  payingOrderId: null,
  pendingCancelOrderId: null,
  pendingDeleteAddressId: null,
  pendingDeleteOrderId: null,
  orderModifyDraft: null,
  orderModifyDraftId: null,
  orderModifyRegion: [],
  addressRegion: [],
  addressLabelDraft: '',
  addressPasteDraft: '',
  addressPickTarget: null,
  addressEditFromCheckout: false,
  logisticsNotifyClosed: false,
  filterDraft: cloneFilter(EMPTY_FILTER),
  filterApplied: null,
  skuEntryHint: null,
};

const initialState: FullState = {
  _dataVersion: DATA_VERSION,
  user: { ...SUNING_CONFIG.user },
  cartItems: seedCart(),
  checkoutDraft: null,
  orders: seedOrders(),
  addresses: SUNING_CONFIG.addresses.map((a) => ({ ...a, tags: [...a.tags] })),
  addressDraft: null,
  coupons: {
    yigou: SUNING_CONFIG.coupons.yigou.map((c) => ({ ...c })),
    redpacket: SUNING_CONFIG.coupons.redpacket.map((c) => ({ ...c })),
    lijin: SUNING_CONFIG.coupons.lijin,
  },
  followedProducts: SUNING_CONFIG.follows.products.map((p) => ({ ...p })),
  followedShops: [...SUNING_CONFIG.follows.shops],
  followedCreators: [...SUNING_CONFIG.follows.creators],
  history: seedHistory(),
  subsidyClaimedIds: [],
  reviews: seedReviews(),
  transMsgs: seedMsgs(),
  chatSessions: {},
  unread: {
    trade: SUNING_CONFIG.messages.filter((m) => m.channel === 'trade').length,
    notice: SUNING_CONFIG.messages.filter((m) => m.channel === 'notice').length,
    interact: SUNING_CONFIG.messages.filter((m) => m.channel === 'interact').length,
  },
  msgSettings: { ...SUNING_CONFIG.msgSettings },
  recentSearches: [...SUNING_CONFIG.searchConfig.recentDefault],
  likedReviewIds: [],
  taskAudit: {},
  _temp: { ...initialTemp },
};

/* ============ id / 订单号(禁 Math.random,R7 合规) ============ */

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

/** 订单号:G30 + 时间戳数字串,对齐种子样式 G3001617207 */
function genOrderNo(): string {
  idCounter += 1;
  return `G30${String(TimeService.now() % 10000000).padStart(7, '0')}${String(idCounter % 1000).padStart(3, '0')}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const shopNameOf = (shopId: string): string =>
  SUNING_CONFIG.shops.find((s) => s.id === shopId)?.name ?? '苏宁易购';

const productOf = (productId: string) => SUNING_CONFIG.products.find((p) => p.id === productId);

const limitQtyOf = (productId: string): number => productOf(productId)?.sku?.limitQty ?? 99;

function channelMsg(
  channel: 'trade' | 'notice' | 'interact',
  title: string,
  desc: string,
  orderId: string,
  productId?: string,
): RuntimeMessageEntry {
  // 展示时间 = 实际支付/操作时刻(走查 0729-3);种子已在 seedMsgs 前移到 now 之前,故可直接用 now
  return {
    id: genId('tm'),
    channel,
    title,
    desc,
    ts: TimeService.now(),
    orderId,
    image: productId ? productOf(productId)?.image : undefined,
  };
}

function tradeMsg(title: string, desc: string, orderId: string, productId?: string): RuntimeMessageEntry {
  return channelMsg('trade', title, desc, orderId, productId);
}

function noticeMsg(title: string, desc: string, orderId: string, productId?: string): RuntimeMessageEntry {
  return channelMsg('notice', title, desc, orderId, productId);
}

/** 结算合计换算(供页面展示与 placeOrder 共用同一规则:商品总额+延保,勾国补 ×0.85) */
export function checkoutTotal(d: CheckoutDraft): number {
  const goods = d.items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const total = goods + d.warrantyPrice;
  return round2(d.subsidyChecked ? total * 0.85 : total);
}

function makeCheckoutDraft(
  items: CheckoutDraftItem[],
  source: 'cart' | 'buyNow',
  addressId: string,
  subsidyClaimedIds: string[],
): CheckoutDraft {
  const claimed = items.some((it) => subsidyClaimedIds.includes(it.productId));
  return {
    source,
    items,
    addressId,
    payMethod: 'alipay',
    deliveryDayOffset: 1,
    deliverySlot: '09:00-21:00',
    invoiceType: 'none',
    warrantyId: null,
    warrantyPrice: 0,
    subsidyChecked: claimed,
    subsidyDialogSeen: claimed,
  };
}

export const useSuningStore = createAppStoreWithActions<FullState, AppActions>(
  'suning',
  initialState,
  (set, get) => ({
    showToast: (msg) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),

    setTemp: (patch) => set((s) => ({ _temp: { ...s._temp, ...patch } })),
    toggleReviewLike: (reviewId) => set((s) => ({
      likedReviewIds: s.likedReviewIds.includes(reviewId)
        ? s.likedReviewIds.filter((id) => id !== reviewId)
        : [...s.likedReviewIds, reviewId],
    })),
    recordTaskAudit: (patch) => set((s) => ({ taskAudit: { ...s.taskAudit, ...patch } })),

    /* ---- 购物车 ---- */

    addToCart: (productId, skuText, price, qty = 1) =>
      set((s) => {
        // 同商品同规格合并(数量+n 且自动勾选),否则新条目自动勾选,其余保持原勾选态(frame:r1@39.6)
        const exist = s.cartItems.find((i) => i.productId === productId && i.skuText === skuText);
        if (exist) {
          const limit = limitQtyOf(productId);
          return {
            cartItems: s.cartItems.map((i) =>
              i.id === exist.id ? { ...i, qty: Math.min(i.qty + qty, limit), selected: true } : i,
            ),
          };
        }
        const item: CartItem = {
          id: genId('cart'),
          shopId: productOf(productId)?.shopId ?? 'shop-suning-self',
          productId,
          skuText,
          qty,
          price,
          selected: true,
        };
        return { cartItems: [item, ...s.cartItems] };
      }),

    toggleCartItem: (itemId) =>
      set((s) => ({
        cartItems: s.cartItems.map((i) => (i.id === itemId ? { ...i, selected: !i.selected } : i)),
      })),

    toggleCartShop: (shopId) =>
      set((s) => {
        const shopItems = s.cartItems.filter((i) => i.shopId === shopId);
        const allSelected = shopItems.length > 0 && shopItems.every((i) => i.selected);
        return {
          cartItems: s.cartItems.map((i) =>
            i.shopId === shopId ? { ...i, selected: !allSelected } : i,
          ),
        };
      }),

    toggleCartSelectAll: () =>
      set((s) => {
        const allSelected = s.cartItems.length > 0 && s.cartItems.every((i) => i.selected);
        return { cartItems: s.cartItems.map((i) => ({ ...i, selected: !allSelected })) };
      }),

    setCartQty: (itemId, qty) =>
      set((s) => ({
        cartItems: s.cartItems.map((i) =>
          i.id === itemId
            ? { ...i, qty: Math.max(1, Math.min(qty, limitQtyOf(i.productId))) }
            : i,
        ),
      })),

    removeCartItems: (itemIds) =>
      set((s) => ({
        cartItems: s.cartItems.filter((i) => !itemIds.includes(i.id)),
        _temp: { ...s._temp, editSelect: [] },
      })),

    moveCartToFollow: (itemIds) =>
      set((s) => {
        const moved = s.cartItems.filter((i) => itemIds.includes(i.id));
        const followed = new Set(s.followedProducts.map((f) => f.productId));
        const added: FollowedProduct[] = [];
        for (const it of moved) {
          if (!followed.has(it.productId)) {
            followed.add(it.productId);
            added.push({ productId: it.productId, subscribePrice: null });
          }
        }
        return {
          cartItems: s.cartItems.filter((i) => !itemIds.includes(i.id)),
          followedProducts: [...added, ...s.followedProducts],
          _temp: { ...s._temp, editSelect: [] },
        };
      }),

    // 快速清理:移除商品池中已不存在的失效条目(种子购物车无失效品→无变化,页面 toast「暂无可清理的商品」)
    clearInvalidCartItems: () =>
      set((s) => ({ cartItems: s.cartItems.filter((i) => productOf(i.productId) != null) })),

    /* ---- 结算 + 支付 ---- */

    beginCheckout: (itemIds) => {
      const s = get();
      const picked = s.cartItems.filter((i) => itemIds.includes(i.id));
      if (picked.length === 0) return;
      const items: CheckoutDraftItem[] = picked.map((i) => ({
        cartItemId: i.id,
        productId: i.productId,
        shopId: i.shopId,
        skuText: i.skuText,
        price: i.price,
        qty: i.qty,
      }));
      const addressId = s.addresses.find((a) => a.isDefault)?.id ?? s.addresses[0]?.id ?? '';
      set(() => ({ checkoutDraft: makeCheckoutDraft(items, 'cart', addressId, s.subsidyClaimedIds) }));
    },

    beginBuyNow: (productId, skuText, price, qty = 1) => {
      const s = get();
      const items: CheckoutDraftItem[] = [
        {
          cartItemId: null,
          productId,
          shopId: productOf(productId)?.shopId ?? 'shop-suning-self',
          skuText,
          price,
          qty,
        },
      ];
      const addressId = s.addresses.find((a) => a.isDefault)?.id ?? s.addresses[0]?.id ?? '';
      set(() => ({ checkoutDraft: makeCheckoutDraft(items, 'buyNow', addressId, s.subsidyClaimedIds) }));
    },

    // cartItemKey:cart 来源=购物车条目 id;buyNow 单品传 productId
    setCheckoutQty: (cartItemKey, delta) =>
      set((s) => {
        const d = s.checkoutDraft;
        if (!d) return {};
        return {
          checkoutDraft: {
            ...d,
            items: d.items.map((it) =>
              (it.cartItemId ?? it.productId) === cartItemKey
                ? { ...it, qty: Math.max(1, Math.min(it.qty + delta, limitQtyOf(it.productId))) }
                : it,
            ),
          },
        };
      }),

    setCheckoutAddress: (addressId) =>
      set((s) => (s.checkoutDraft ? { checkoutDraft: { ...s.checkoutDraft, addressId } } : {})),

    setPayMethod: (method) =>
      set((s) => (s.checkoutDraft ? { checkoutDraft: { ...s.checkoutDraft, payMethod: method } } : {})),

    setDeliverySlot: (dayOffset, slot) =>
      set((s) =>
        s.checkoutDraft
          ? { checkoutDraft: { ...s.checkoutDraft, deliveryDayOffset: dayOffset, deliverySlot: slot } }
          : {},
      ),

    setInvoice: (invoiceType) =>
      set((s) => (s.checkoutDraft ? { checkoutDraft: { ...s.checkoutDraft, invoiceType } } : {})),

    setCheckoutWarranty: (warrantyId, price) =>
      set((s) =>
        s.checkoutDraft
          ? { checkoutDraft: { ...s.checkoutDraft, warrantyId, warrantyPrice: warrantyId ? price : 0 } }
          : {},
      ),

    toggleSubsidy: () =>
      set((s) =>
        s.checkoutDraft
          ? { checkoutDraft: { ...s.checkoutDraft, subsidyChecked: !s.checkoutDraft.subsidyChecked } }
          : {},
      ),

    // dialog=subsidy「去领取」:关弹窗 + 自动勾选国补行(Q2=B)
    claimSubsidy: () =>
      set((s) =>
        s.checkoutDraft
          ? { checkoutDraft: { ...s.checkoutDraft, subsidyChecked: true, subsidyDialogSeen: true } }
          : {},
      ),

    markSubsidyDialogSeen: () =>
      set((s) =>
        s.checkoutDraft ? { checkoutDraft: { ...s.checkoutDraft, subsidyDialogSeen: true } } : {},
      ),

    // 「立即支付」点击即创建订单(待支付,弃单不回滚,frame:r1@67.2);多店铺拆单同批次
    placeOrder: () => {
      const s = get();
      const d = s.checkoutDraft;
      if (!d || d.items.length === 0) return null;
      const now = TimeService.now();
      const addr = s.addresses.find((a) => a.id === d.addressId) ?? s.addresses[0];
      const payLabel = d.payMethod === 'wechat' ? '微信' : '支付宝';
      const shopIds = [...new Set(d.items.map((it) => it.shopId))];
      const batchId = shopIds.length > 1 ? genId('batch') : undefined;
      const orders: RuntimeOrder[] = shopIds.map((shopId, idx) => {
        const groupItems = d.items.filter((it) => it.shopId === shopId);
        const goods = groupItems.reduce((sum, it) => sum + it.price * it.qty, 0);
        // 延保价计入首个分组(延保仅家电/3C 单品结算出现)
        const total = goods + (idx === 0 ? d.warrantyPrice : 0);
        return {
          id: genId('order'),
          orderNo: genOrderNo(),
          status: 'pendingPay',
          shopId,
          items: groupItems.map((it) => ({
            productId: it.productId,
            skuText: it.skuText,
            qty: it.qty,
            price: it.price,
          })),
          amount: round2(d.subsidyChecked ? total * 0.85 : total),
          payMethod: null,
          chosenPayMethod: payLabel,
          timestamps: { placed: now },
          logistics: [],
          invoice:
            d.invoiceType === 'electronic'
              ? { type: '电子普通发票', title: addr?.name ?? '苏宁用户', status: '未开票' }
              : { type: '不开发票', status: '未开票' },
          remainSec: 86340,
          etaTs: etaTs(d.deliveryDayOffset),
          etaRange: d.deliverySlot,
          cartItemIds: groupItems
            .map((it) => it.cartItemId)
            .filter((x): x is string => x !== null),
          batchId,
        };
      });
      // payingOrderId:URL 参数在控件 bind 期已固化,新建单 id 只能经 _temp 交接给 pay.password
      const submitMsgs = orders.map((o) =>
        tradeMsg(
          '订单已提交',
          `您的订单已提交成功,请尽快完成支付 >>`,
          o.id,
          o.items[0]?.productId,
        ),
      );
      set((st) => ({
        orders: [...orders, ...st.orders],
        transMsgs: [...st.transMsgs, ...submitMsgs],
        unread: { ...st.unread, trade: st.unread.trade + submitMsgs.length },
        _temp: { ...st._temp, payingOrderId: orders[0].id, payDigits: '' },
      }));
      return orders[0].id;
    },

    // 任意6位密码即支付成功:订单转待发货 + 清车 + 交易物流消息(spec pay.password 全链联动)
    paySuccess: (orderId) =>
      set((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target || target.status !== 'pendingPay') return {};
        const now = TimeService.now();
        const inBatch = (o: RuntimeOrder) =>
          o.status === 'pendingPay' &&
          (o.id === orderId || (target.batchId != null && o.batchId === target.batchId));
        const batch = s.orders.filter(inBatch);
        const removedCartIds = new Set(batch.flatMap((o) => o.cartItemIds ?? []));
        const msgs = batch.map((o) =>
          tradeMsg(
            '订单已支付',
            `您的订单已支付成功,${shopNameOf(o.shopId)}将尽快为您发货 >>`,
            o.id,
            o.items[0]?.productId,
          ),
        );
        return {
          orders: s.orders.map((o) => {
            if (!inBatch(o)) return o;
            const eta = o.etaTs ?? etaTs(4);
            return {
              ...o,
              status: 'awaitShip' as const,
              payMethod: o.chosenPayMethod ?? '支付宝',
              remainSec: undefined,
              timestamps: { ...o.timestamps, paid: now },
              etaTs: eta,
              etaRange: o.etaRange ?? '09:00-21:00',
              logistics: [
                {
                  ts: now,
                  title: '已支付',
                  desc: `已支付,${shopNameOf(o.shopId)}为您发货,预计送达`,
                },
                {
                  ts: o.timestamps.placed,
                  title: '已提交订单',
                  desc: '您提交了订单,请等待系统确认',
                },
                ...o.logistics,
              ],
            };
          }),
          cartItems: s.cartItems.filter((i) => !removedCartIds.has(i.id)),
          checkoutDraft: null,
          transMsgs: [...s.transMsgs, ...msgs],
          unread: { ...s.unread, trade: s.unread.trade + msgs.length },
          _temp: { ...s._temp, payDigits: '' },
        };
      }),

    /* ---- 订单 ---- */

    cancelOrder: (orderId, reason) =>
      set((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target) return {};
        const now = TimeService.now();
        const msg = tradeMsg(
          '订单已取消',
          `您的订单已取消,如有支付款项将原路退回 >>`,
          orderId,
          target.items[0]?.productId,
        );
        return {
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'cancelled' as const,
                  cancelReason: reason,
                  remainSec: undefined,
                  timestamps: { ...o.timestamps, cancelled: now },
                }
              : o,
          ),
          transMsgs: [...s.transMsgs, msg],
          unread: { ...s.unread, trade: s.unread.trade + 1 },
          _temp: { ...s._temp, cancelReason: '', pendingCancelOrderId: null },
        };
      }),

    deleteOrder: (orderId) =>
      set((s) => ({
        orders: s.orders.filter((o) => o.id !== orderId),
        _temp: { ...s._temp, pendingDeleteOrderId: null },
      })),

    confirmReceipt: (orderId) =>
      set((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target || target.status !== 'shipping') return {};
        const now = TimeService.now();
        const msg = tradeMsg(
          '订单已签收',
          `您的包裹已签收,感谢您在苏宁易购购物 >>`,
          orderId,
          target.items[0]?.productId,
        );
        return {
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'completed' as const,
                  reviewed: false,
                  timestamps: { ...o.timestamps, delivered: now },
                  logistics: [
                    {
                      ts: now,
                      title: '已签收',
                      desc: '您的包裹已签收,感谢您在苏宁易购购物',
                    },
                    ...o.logistics,
                  ],
                }
              : o,
          ),
          transMsgs: [...s.transMsgs, msg],
          unread: { ...s.unread, trade: s.unread.trade + 1 },
        };
      }),

    // 改地址只落到本单快照(不动地址簿),Toast 由页面发
    modifyOrderAddress: (orderId, address) =>
      set((s) => {
        if (!s.orders.some((o) => o.id === orderId)) return {};
        return {
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, address: { ...address } } : o)),
          _temp: { ...s._temp, orderModifyDraft: null, orderModifyDraftId: null, orderModifyRegion: [] },
        };
      }),

    /* ---- 退款 / 售后 ---- */

    applyRefund: (orderId, reason, note) =>
      set((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target || target.refund) return {};
        const now = TimeService.now();
        const item = target.items[0];
        const titleBit = item ? productOf(item.productId)?.title.slice(0, 18) ?? '商品' : '商品';
        const trade = tradeMsg(
          '退款申请已提交',
          '您的退款申请已提交,请耐心等待供应商审核 >>',
          orderId,
          item?.productId,
        );
        const notice = noticeMsg(
          '退款进度通知',
          `您申请的${titleBit}…退款正在审核中,请耐心等待`,
          orderId,
          item?.productId,
        );
        return {
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  refund: {
                    serviceNo: genOrderNo(),
                    status: '等待审核',
                    reason,
                    note: note || undefined,
                    amount: o.amount,
                    qty: o.items.reduce((sum, it) => sum + it.qty, 0),
                    appliedAtTs: now,
                    steps: ['发起申请', '供应商审核', '退款处理', '退款完成'],
                    currentStep: 0,
                  },
                }
              : o,
          ),
          transMsgs: [...s.transMsgs, trade, notice],
          unread: {
            ...s.unread,
            trade: s.unread.trade + 1,
            notice: s.unread.notice + 1,
          },
          _temp: { ...s._temp, refundDraft: { reason: '', note: '' } },
        };
      }),

    // Q11=A:取消申请后售后记录消失,订单恢复「申请退款」入口
    cancelRefund: (orderId) =>
      set((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target?.refund) return {};
        const msg = noticeMsg(
          '退款进度通知',
          '您已取消退款申请,订单恢复可申请退款状态',
          orderId,
          target.items[0]?.productId,
        );
        return {
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, refund: undefined } : o)),
          transMsgs: [...s.transMsgs, msg],
          unread: { ...s.unread, notice: s.unread.notice + 1 },
        };
      }),

    /* ---- 商详联动 ---- */

    // 进商详记入当日足迹(同日同商品去重前插,me.main 足迹计数=entries.length 由组件算)
    recordHistory: (productId) =>
      set((s) => {
        const now = TimeService.now();
        const todayStart = dayStart(now);
        return {
          history: [
            { productId, ts: now },
            ...s.history.filter((e) => !(e.productId === productId && e.ts >= todayStart)),
          ],
        };
      }),

    // 商详「政府补贴 立即领取」:该商品结算默认勾国补
    claimProductSubsidy: (productId) =>
      set((s) =>
        s.subsidyClaimedIds.includes(productId)
          ? {}
          : { subsidyClaimedIds: [...s.subsidyClaimedIds, productId] },
      ),

    /* ---- 客服会话(按 shopId 隔离:每店独立消息记录,禁止全局单会话) ---- */

    sendChatText: (shopId, textRaw) =>
      set((s) => {
        const text = textRaw.trim();
        if (!text) return {};
        const now = TimeService.now();
        return {
          chatSessions: {
            ...s.chatSessions,
            [shopId]: [
              ...(s.chatSessions[shopId] ?? []),
              { id: genId('cm'), role: 'user' as const, kind: 'text' as const, text, ts: now },
              { id: genId('cm'), role: 'bot' as const, kind: 'text' as const, text: ruleReply(text), ts: now },
            ],
          },
        };
      }),

    sendChatProduct: (shopId, productId) =>
      set((s) => {
        const now = TimeService.now();
        const title = productOf(productId)?.title ?? '';
        return {
          chatSessions: {
            ...s.chatSessions,
            [shopId]: [
              ...(s.chatSessions[shopId] ?? []),
              { id: genId('cm'), role: 'user' as const, kind: 'product' as const, text: title, productId, ts: now },
              {
                id: genId('cm'),
                role: 'bot' as const,
                kind: 'text' as const,
                text: `已收到您咨询的商品:${title}。该商品支持在线下单,如需了解补贴/发货/售后,直接问我就好~`,
                ts: now,
              },
            ],
          },
        };
      }),

    /* ---- 关注域 ---- */

    toggleFollowProduct: (productId) =>
      set((s) => ({
        followedProducts: s.followedProducts.some((f) => f.productId === productId)
          ? s.followedProducts.filter((f) => f.productId !== productId)
          : [{ productId, subscribePrice: null }, ...s.followedProducts],
      })),

    unfollowProducts: (productIds) =>
      set((s) => ({
        followedProducts: s.followedProducts.filter((f) => !productIds.includes(f.productId)),
        _temp: { ...s._temp, multiSelect: [] },
      })),

    toggleFollowShop: (shopId) =>
      set((s) => ({
        followedShops: s.followedShops.includes(shopId)
          ? s.followedShops.filter((id) => id !== shopId)
          : [...s.followedShops, shopId],
      })),

    toggleFollowCreator: (creatorId) =>
      set((s) => ({
        followedCreators: s.followedCreators.includes(creatorId)
          ? s.followedCreators.filter((id) => id !== creatorId)
          : [...s.followedCreators, creatorId],
      })),

    // 降价通知订阅价(未关注则先关注再订阅;Toast 页面发)
    setPriceWatch: (productId, price) =>
      set((s) => ({
        followedProducts: s.followedProducts.some((f) => f.productId === productId)
          ? s.followedProducts.map((f) =>
              f.productId === productId ? { ...f, subscribePrice: price } : f,
            )
          : [{ productId, subscribePrice: price }, ...s.followedProducts],
      })),

    /* ---- 足迹 ---- */

    removeHistory: (productIds) =>
      set((s) => ({
        history: s.history.filter((e) => !productIds.includes(e.productId)),
        _temp: { ...s._temp, multiSelect: [] },
      })),

    /* ---- 消息 ---- */

    readChannel: (ch) => set((s) => ({ unread: { ...s.unread, [ch]: 0 } })),

    clearAllMessages: () =>
      set(() => ({ transMsgs: [], unread: { trade: 0, notice: 0, interact: 0 } })),

    // 顶栏「清除未读」:三频道未读归零(仅消红点,保留消息列表,走查 0814 反馈①)
    markAllRead: () => set(() => ({ unread: { trade: 0, notice: 0, interact: 0 } })),

    // 消息设置「清空聊天记录」:清空全部客服会话(实体写入 store,ChatServicePage 重开即空)
    clearChatSessions: () => set(() => ({ chatSessions: {} })),

    toggleMsgSetting: (key) =>
      set((s) => ({
        msgSettings: { ...s.msgSettings, [key]: !s.msgSettings[key] } as MsgSettings,
      })),

    /* ---- 地址 ---- */

    // 传入 tags 不含「默认」,由 isDefault 统一归一化
    saveAddress: (a) => {
      let id = a.id ?? '';
      const normalize = (addr: Address, isDefault: boolean): Address => ({
        ...addr,
        isDefault,
        tags: isDefault
          ? ['默认', ...addr.tags.filter((t) => t !== '默认')]
          : addr.tags.filter((t) => t !== '默认'),
      });
      // 地址簿恒有一个默认项:取消掉唯一默认后由第一条顶上(结算/商详的默认地址取数不能落空)
      const ensureDefault = (list: Address[]): Address[] =>
        list.length === 0 || list.some((x) => x.isDefault)
          ? list
          : list.map((x, i) => (i === 0 ? normalize(x, true) : x));
      set((s) => {
        if (id && s.addresses.some((x) => x.id === id)) {
          const makeDefault = a.isDefault === true;
          return {
            addresses: ensureDefault(
              s.addresses.map((x) => {
                if (x.id === id) return normalize({ ...x, ...a, id } as Address, makeDefault);
                return makeDefault ? normalize(x, false) : x;
              }),
            ),
            addressDraft: null,
          };
        }
        id = genId('addr');
        const makeDefault = a.isDefault === true || s.addresses.length === 0;
        const na = normalize(
          {
            id,
            name: a.name ?? '',
            phone: a.phone ?? '',
            tags: a.tags ? [...a.tags] : [],
            province: a.province ?? '',
            city: a.city ?? '',
            district: a.district ?? '',
            street: a.street ?? '',
            detail: a.detail ?? '',
            isDefault: makeDefault,
          },
          makeDefault,
        );
        return {
          addresses: makeDefault
            ? [na, ...s.addresses.map((x) => normalize(x, false))]
            : [na, ...s.addresses],
          addressDraft: null,
        };
      });
      return id;
    },

    // 删除默认地址后剩余第一条自动成为默认(spec address.list);删空则保持空态由页面提示
    deleteAddress: (addressId) =>
      set((s) => {
        const remain = s.addresses.filter((x) => x.id !== addressId);
        const removedDefault = s.addresses.find((x) => x.id === addressId)?.isDefault ?? false;
        const addresses =
          removedDefault && remain.length > 0
            ? remain.map((x, idx) =>
                idx === 0
                  ? { ...x, isDefault: true, tags: ['默认', ...x.tags.filter((t) => t !== '默认')] }
                  : x,
              )
            : remain;
        const draft = s.checkoutDraft;
        return {
          addresses,
          checkoutDraft:
            draft && draft.addressId === addressId
              ? { ...draft, addressId: addresses[0]?.id ?? '' }
              : draft,
          _temp: { ...s._temp, pendingDeleteAddressId: null },
        };
      }),

    setDefaultAddress: (addressId) =>
      set((s) => ({
        addresses: s.addresses.map((x) =>
          x.id === addressId
            ? { ...x, isDefault: true, tags: ['默认', ...x.tags.filter((t) => t !== '默认')] }
            : { ...x, isDefault: false, tags: x.tags.filter((t) => t !== '默认') },
        ),
      })),

    setAddressDraft: (patch) =>
      set((s) => {
        if (patch === null) return { addressDraft: null };
        const base = s.addressDraft ?? {
          id: null,
          name: '',
          phone: '',
          province: '',
          city: '',
          district: '',
          street: '',
          detail: '',
          tag: '',
          customLabels: [],
          isDefault: false,
        };
        return { addressDraft: { ...base, ...patch } };
      }),

    /* ---- 个人信息 ---- */

    setNickname: (name) =>
      set((s) => {
        const next = name.trim().slice(0, 20);
        if (!next) return {};
        return {
          user: { ...s.user, nickname: next },
          _temp: { ...s._temp, nicknameDraft: '' },
        };
      }),

    /* ---- 搜索 ---- */

    addRecentSearch: (word) =>
      set((s) => {
        const w = word.trim();
        if (!w) return {};
        return { recentSearches: [w, ...s.recentSearches.filter((x) => x !== w)].slice(0, 10) };
      }),

    clearRecentSearches: () => set(() => ({ recentSearches: [] })),

    /* ---- 筛选(集合选择放 _temp;排序/快捷筛选等离散态走页面 URL) ---- */

    openFilterDraft: () =>
      set((s) => ({
        _temp: {
          ...s._temp,
          filterDraft: s._temp.filterApplied ? cloneFilter(s._temp.filterApplied) : cloneFilter(EMPTY_FILTER),
        },
      })),

    toggleFilterDim: (dim, value, multi = true) =>
      set((s) => {
        const cur = s._temp.filterDraft.dims[dim] ?? [];
        const next = cur.includes(value)
          ? cur.filter((v) => v !== value)
          : multi
            ? [...cur, value]
            : [value];
        return {
          _temp: {
            ...s._temp,
            filterDraft: {
              ...s._temp.filterDraft,
              dims: { ...s._temp.filterDraft.dims, [dim]: next },
            },
          },
        };
      }),

    // 预设档与手输互斥:设预设清手输,手输清预设(spec a361)
    setFilterPrice: (patch) =>
      set((s) => {
        const d = s._temp.filterDraft;
        let next = { ...d, ...patch };
        if (patch.pricePreset !== undefined && patch.pricePreset !== null) {
          next = { ...next, priceMin: '', priceMax: '' };
        } else if (patch.priceMin !== undefined || patch.priceMax !== undefined) {
          next = { ...next, pricePreset: null };
        }
        return { _temp: { ...s._temp, filterDraft: next } };
      }),

    resetFilterDraft: () =>
      set((s) => ({ _temp: { ...s._temp, filterDraft: cloneFilter(EMPTY_FILTER) } })),

    applyFilter: () =>
      set((s) => ({
        _temp: {
          ...s._temp,
          filterApplied: filterIsEmpty(s._temp.filterDraft)
            ? null
            : cloneFilter(s._temp.filterDraft),
        },
      })),

    clearFilter: () =>
      set((s) => ({
        _temp: { ...s._temp, filterDraft: cloneFilter(EMPTY_FILTER), filterApplied: null },
      })),
  }),
  {
    persistName: `suning_v${DATA_VERSION}`,
    partialize: (state) => {
      const { _temp, ...rest } = state as FullState & AppActions;
      void _temp;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<FullState>;
    },
  },
);
