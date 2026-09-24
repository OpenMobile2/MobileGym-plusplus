import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { VIPSHOP_CONFIG } from './data';
import type {
  VipshopState, VipshopActions, VipCartItem, VipOrder, VipOrderLine,
} from './types';

const initialState: VipshopState = JSON.parse(JSON.stringify(VIPSHOP_CONFIG));
// 专场/秒杀倒计时:按当前 sim 时间 + endsInHours 计算,避免固定过去时间导致 00:00:00
initialState.brands = initialState.brands.map((b) => ({
  ...b,
  endsAt: TimeService.now() + (b.endsInHours ?? 6) * 3600_000,
}));

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** 唯小蜜脚本化回复(P0,不接真模型) */
function botReplyText(q: string): string {
  if (/尺码|大小|偏大|偏小/.test(q)) return '为您推荐:身高160-165cm、体重50kg左右建议选 M 码~ 详情页「尺码信息」也有对照表哦。';
  if (/价保|价格保护|便宜|降价/.test(q)) return '下单后15天内商品降价可申请价格保护,退还差价~ 您可在「我的订单-申请售后-价格保护」提交。';
  if (/物流|快递|发货|收货/.test(q)) return '唯品会默认顺丰配送,您可在「我的订单」查看实时物流。有需要我也可以帮您催一下哦~';
  if (/退货|退款|售后|换货/.test(q)) return '支持7天无理由退换,在「我的订单-申请售后」即可发起,退款极速到账~';
  if (/正品|假货|真的/.test(q)) return '唯品会100%正品保障,所有商品官方渠道采购,支持专柜验货,假一赔十!';
  return '收到啦~ 我可以帮您查订单物流、尺码推荐、价保申请、优惠券等,您也可以点上方「猜你想问」快速咨询哦!';
}

export const useVipshopStore = createAppStoreWithActions<VipshopState, VipshopActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    // ---------- 登录 ----------
    login: (phone) => {
      set((s) => ({
        session: { ...s.session, loggedIn: true, phone: phone || s.session.phone, nick: '唯品用户' },
      }));
    },
    logout: () => {
      set((s) => ({ session: { ...s.session, loggedIn: false } }));
    },

    // ---------- 搜索 ----------
    submitSearch: (q) => {
      const word = q.trim();
      if (!word) return;
      set((s) => ({
        searchHistory: [word, ...s.searchHistory.filter((w) => w !== word)].slice(0, 12),
      }));
    },
    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    // ---------- 收藏 / 足迹 ----------
    toggleFavorite: (itemId) => {
      set((s) => ({
        favorites: s.favorites.includes(itemId)
          ? s.favorites.filter((f) => f !== itemId)
          : [itemId, ...s.favorites],
      }));
    },
    toggleFavoriteBrand: (brandId) => {
      set((s) => ({
        favoriteBrands: s.favoriteBrands.includes(brandId)
          ? s.favoriteBrands.filter((f) => f !== brandId)
          : [brandId, ...s.favoriteBrands],
      }));
    },
    toggleSubscribe: (brandId) => {
      set((s) => ({
        subscribedBrands: s.subscribedBrands.includes(brandId)
          ? s.subscribedBrands.filter((f) => f !== brandId)
          : [brandId, ...s.subscribedBrands],
      }));
    },
    recordFootprint: (itemId) => {
      const today = TimeService.now();
      set((s) => ({
        footprints: [
          { itemId, date: today },
          ...s.footprints.filter((f) => f.itemId !== itemId),
        ],
      }));
    },
    setPriceAlert: (itemId) => {
      set((s) => ({
        priceAlerts: s.priceAlerts.includes(itemId) ? s.priceAlerts : [...s.priceAlerts, itemId],
      }));
    },

    // ---------- 购物车 ----------
    addToCart: (itemId, skuDesc, qty) => {
      const item = get().items.find((i) => i.id === itemId);
      if (!item) return;
      set((s) => {
        const existing = s.cart.find((c) => c.itemId === itemId && c.skuDesc === skuDesc);
        if (existing) {
          return { cart: s.cart.map((c) => (c.id === existing.id ? { ...c, qty: c.qty + qty } : c)) };
        }
        const entry: VipCartItem = {
          id: genId('c'), itemId, skuDesc, qty, price: item.price,
          selected: true, addedAt: TimeService.now(), tags: item.stockTight ? ['库存紧张'] : [],
        };
        return { cart: [entry, ...s.cart] };
      });
    },
    toggleCartSelect: (cartItemId) => {
      set((s) => ({
        cart: s.cart.map((c) => (c.id === cartItemId ? { ...c, selected: !c.selected } : c)),
      }));
    },
    toggleCartSelectAll: () => {
      const all = get().cart.length > 0 && get().cart.every((c) => c.selected);
      set((s) => ({ cart: s.cart.map((c) => ({ ...c, selected: !all })) }));
    },
    changeCartQty: (cartItemId, delta) => {
      set((s) => ({
        cart: s.cart.map((c) => (c.id === cartItemId ? { ...c, qty: Math.max(1, c.qty + delta) } : c)),
      }));
    },
    deleteCartItems: (ids) => set((s) => ({ cart: s.cart.filter((c) => !ids.includes(c.id)) })),
    moveCartToFavorites: (ids) => {
      set((s) => {
        const moved = s.cart.filter((c) => ids.includes(c.id)).map((c) => c.itemId);
        return {
          cart: s.cart.filter((c) => !ids.includes(c.id)),
          favorites: [...new Set([...moved, ...s.favorites])],
        };
      });
    },

    // ---------- 下单 ----------
    beginCheckout: ({ lines, brandName, source }) => {
      const def = get().addresses.find((a) => a.isDefault) ?? get().addresses[0];
      set(() => ({
        checkout: {
          lines, brandName, source,
          addressId: def ? def.id : '',
          payMethod: '唯品支付', couponId: null, svip: false,
        },
      }));
    },
    setCheckoutAddress: (addressId) =>
      set((s) => (s.checkout ? { checkout: { ...s.checkout, addressId } } : {})),
    setCheckoutPayMethod: (m) =>
      set((s) => (s.checkout ? { checkout: { ...s.checkout, payMethod: m } } : {})),
    setCheckoutCoupon: (couponId) =>
      set((s) => (s.checkout ? { checkout: { ...s.checkout, couponId } } : {})),
    toggleCheckoutSvip: () =>
      set((s) => (s.checkout ? { checkout: { ...s.checkout, svip: !s.checkout.svip } } : {})),
    createOrder: () => {
      const s = get();
      const ck = s.checkout;
      if (!ck || ck.lines.length === 0) return '';
      const addr = s.addresses.find((a) => a.id === ck.addressId) ?? s.addresses[0];
      const itemTotal = round2(ck.lines.reduce((sum, l) => sum + l.price * l.qty, 0));
      const coupon = ck.couponId ? s.coupons.find((c) => c.id === ck.couponId) : null;
      const discount = coupon ? coupon.amount : 0;
      const paidAmount = Math.max(0, round2(itemTotal - discount));
      const orderId = genId('o');
      const order: VipOrder = {
        id: orderId,
        orderNo: `V${String(TimeService.now())}${String(seq).padStart(2, '0')}`,
        brandName: ck.brandName,
        lines: ck.lines,
        itemTotal, shippingFee: 0, paidAmount,
        status: 'pendingReceipt',
        addressSnapshot: addr
          ? { name: addr.name, phone: addr.phone.slice(0, 3) + '****' + addr.phone.slice(-4), full: addr.region.replace(/ /g, '') + addr.detail }
          : { name: '', phone: '', full: '' },
        payMethod: ck.payMethod,
        createdAt: TimeService.now(),
        payDeadline: null,
        trackingNo: 'SF' + String(TimeService.now()).slice(-12),
        courier: '顺丰速运',
        logistics: [{ time: '刚刚', text: '您的订单已提交,商家正在备货中' }],
        reviewed: false, isInternational: false,
      };
      const boughtCartIds =
        ck.source === 'cart' ? s.cart.filter((c) => c.selected).map((c) => c.id) : [];
      set((st) => ({
        orders: [order, ...st.orders],
        cart: st.cart.filter((c) => !boughtCartIds.includes(c.id)),
        coupons: coupon ? st.coupons.map((c) => (c.id === coupon.id ? { ...c, used: true } : c)) : st.coupons,
        checkout: null,
      }));
      return orderId;
    },

    // ---------- 订单 ----------
    confirmReceipt: (orderId) => {
      set((s) => ({
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'completed' as const } : o)),
      }));
    },
    buyAgainToCart: (orderId) => {
      const order = get().orders.find((o) => o.id === orderId);
      if (!order) return;
      set((s) => {
        const entries: VipCartItem[] = order.lines.map((l: VipOrderLine) => ({
          id: genId('c'), itemId: l.itemId, skuDesc: l.skuDesc, qty: l.qty,
          price: l.price, selected: true, addedAt: TimeService.now(), tags: [],
        }));
        return { cart: [...entries, ...s.cart] };
      });
    },
    submitRefund: (orderId, refundType) => {
      const order = get().orders.find((o) => o.id === orderId);
      if (!order) return;
      set((s) => ({
        refunds: [
          {
            id: genId('rf'), orderId, line: order.lines[0], refundType,
            amount: order.paidAmount, status: 'processing' as const, createdAt: TimeService.now(),
          },
          ...s.refunds,
        ],
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'refunding' as const } : o)),
      }));
    },
    cancelRefund: (refundId) => {
      set((s) => ({
        refunds: s.refunds.map((r) => (r.id === refundId ? { ...r, status: 'canceled' as const } : r)),
      }));
    },
    submitReview: (orderId) => {
      set((s) => ({
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, reviewed: true } : o)),
      }));
    },

    // ---------- 地址 ----------
    saveAddress: (addr) => {
      set((s) => {
        if (addr.id) {
          return { addresses: s.addresses.map((a) => (a.id === addr.id ? { ...a, ...addr, id: addr.id! } : a)) };
        }
        const nd = !!addr.isDefault;
        return {
          addresses: [
            ...(nd ? s.addresses.map((a) => ({ ...a, isDefault: false })) : s.addresses),
            {
              id: genId('addr'), name: addr.name, phone: addr.phone, region: addr.region,
              detail: addr.detail, tag: addr.tag ?? '家庭', isDefault: nd,
            },
          ],
        };
      });
    },
    deleteAddress: (id) => set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),
    setDefaultAddress: (id) => {
      set((s) => ({ addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })) }));
    },

    // ---------- 优惠券 ----------
    claimCoupon: (title, amount, thresholdText) => {
      set((s) => ({
        coupons: [
          { id: genId('cp'), title, amount, thresholdText, scope: '专享', validText: '7天内有效', type: '专享', used: false },
          ...s.coupons,
        ],
      }));
    },

    // ---------- 客服 ----------
    sendChatMessage: (content) => {
      const text = content.trim();
      if (!text) return;
      set((s) => ({
        chatMessages: [
          ...s.chatMessages,
          { id: genId('m'), sender: 'me' as const, type: 'text' as const, content: text, timestamp: TimeService.now() },
          { id: genId('m'), sender: 'bot' as const, type: 'text' as const, content: botReplyText(text), timestamp: TimeService.now() + 800 },
        ],
      }));
    },
    botReply: (question) => {
      set((s) => ({
        chatMessages: [
          ...s.chatMessages,
          { id: genId('m'), sender: 'me' as const, type: 'text' as const, content: question, timestamp: TimeService.now() },
          { id: genId('m'), sender: 'bot' as const, type: 'text' as const, content: botReplyText(question), timestamp: TimeService.now() + 800 },
        ],
      }));
    },

    // ---------- 设置 ----------
    clearCache: () => {
      // 模拟清缓存:不动业务数据
      set(() => ({}));
    },
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<VipshopState>;
    },
  },
);
