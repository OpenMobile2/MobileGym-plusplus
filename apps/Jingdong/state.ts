import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { JD_CONFIG } from './data';
import type { JdState, JdActions, Order, OrderLine, CartLine } from './types';

const initialState: JdState = JSON.parse(JSON.stringify(JD_CONFIG));
initialState.settings.appearanceMode ??= initialState.settings.darkMode ? 'dark' : 'normal';
initialState.taskAudit = {};

let seq = 0;
const genId = (p: string) => `${p}_${TimeService.now()}_${seq++}`;
function makeOrderNo(): string {
  const base = String(TimeService.now());
  let tail = '';
  for (let i = 0; i < 6; i++) tail += String((seq * 7 + i * 3) % 10);
  return (base + tail).slice(0, 15).padEnd(15, '0');
}

export const useJingdongStore = createAppStoreWithActions<JdState, JdActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    recordTaskAudit: (patch) => set((s) => ({ taskAudit: { ...(s.taskAudit ?? {}), ...patch } })),
    toggleFavorite: (itemId) =>
      set((s) => ({
        favorites: s.favorites.includes(itemId) ? s.favorites.filter((f) => f !== itemId) : [itemId, ...s.favorites],
      })),
    removeFavorites: (itemIds) => set((s) => ({ favorites: s.favorites.filter((f) => !itemIds.includes(f)) })),
    addFootprint: (itemId) =>
      set((s) => {
        const today = s.footprints.find((d) => d.date === '今天');
        let footprints = s.footprints;
        if (today) {
          if (today.itemIds.includes(itemId)) {
            // 已有则置顶,仍算一次浏览
            footprints = s.footprints.map((d) =>
              d.date === '今天' ? { ...d, itemIds: [itemId, ...d.itemIds.filter((id) => id !== itemId)] } : d,
            );
          } else {
            footprints = s.footprints.map((d) => (d.date === '今天' ? { ...d, itemIds: [itemId, ...d.itemIds] } : d));
          }
        } else {
          footprints = [{ date: '今天', itemIds: [itemId] }, ...s.footprints];
        }
        const count = footprints.reduce((n, d) => n + d.itemIds.length, 0);
        return { footprints, user: { ...s.user, footprintCount: count } };
      }),
    followShop: (shopId) =>
      set((s) => ({
        followedShops: s.followedShops.includes(shopId) ? s.followedShops.filter((f) => f !== shopId) : [shopId, ...s.followedShops],
      })),

    addToCart: (itemId, qty, skuDesc, channel = 'shopping') => {
      const s = get();
      // 主站商品在 items;秒送/外卖菜品在 lifeShops[].dishes,两处都要能加购
      const item = s.items.find((i) => i.id === itemId);
      const lifeShop = item ? undefined : s.lifeShops.find((sh) => sh.dishes.some((d) => d.id === itemId));
      const dish = lifeShop?.dishes.find((d) => d.id === itemId);
      if (!item && !dish) return;
      const key = `${itemId}__${skuDesc}`;
      const existing = s.cart.find((c) => c.key === key);
      if (existing) {
        set((st) => ({ cart: st.cart.map((c) => (c.key === key ? { ...c, qty: c.qty + qty } : c)) }));
        return;
      }
      const line: CartLine = item
        ? {
            key, itemId, title: item.title, image: item.image, price: item.price, qty,
            skuDesc, checked: true, shopId: item.shopId,
            shopName: s.shops.find((sh) => sh.id === item.shopId)?.name ?? '京东自营',
            channel, self: item.self,
          }
        : {
            key, itemId, title: dish!.name, image: dish!.image, price: dish!.price, qty,
            skuDesc, checked: true, shopId: lifeShop!.id, shopName: lifeShop!.name,
            channel, self: lifeShop!.kind === 'super',
          };
      set((st) => ({ cart: [line, ...st.cart] }));
    },
    toggleCartCheck: (key) => set((s) => ({ cart: s.cart.map((c) => (c.key === key ? { ...c, checked: !c.checked } : c)) })),
    toggleShopCheck: (shopId) =>
      set((s) => {
        const shopLines = s.cart.filter((c) => c.shopId === shopId);
        const allOn = shopLines.length > 0 && shopLines.every((c) => c.checked);
        return { cart: s.cart.map((c) => (c.shopId === shopId ? { ...c, checked: !allOn } : c)) };
      }),
    setCartQty: (key, delta) =>
      set((s) => ({ cart: s.cart.map((c) => (c.key === key ? { ...c, qty: Math.max(1, c.qty + delta) } : c)) })),
    toggleSelectAll: (on) => set((s) => ({ cart: s.cart.map((c) => ({ ...c, checked: on })) })),
    removeCartLine: (key) => set((s) => ({ cart: s.cart.filter((c) => c.key !== key) })),

    placeOrder: (input) => {
      const s = get();
      const addr = s.addresses.find((a) => a.id === s.selectedAddressId) || s.addresses.find((a) => a.isDefault) || s.addresses[0];
      let lines: OrderLine[] = [];
      let shopId = 'shop_self';
      let shopName = '京东自营';
      let self = true;
      if (input.lines && input.lines.length) {
        // 外卖/秒送:直接给定订单行与门店(菜品不在 cart/items 中)
        lines = input.lines;
        shopId = input.shopId ?? shopId;
        shopName = input.shopName ?? shopName;
        self = input.self ?? self;
      } else if (input.keys && input.keys.length) {
        const picked = s.cart.filter((c) => input.keys!.includes(c.key));
        lines = picked.map((c) => ({ itemId: c.itemId, title: c.title, image: c.image, skuDesc: c.skuDesc, price: c.price, qty: c.qty }));
        if (picked[0]) { shopId = picked[0].shopId; shopName = picked[0].shopName; self = picked[0].self; }
      } else if (input.itemId) {
        const item = s.items.find((i) => i.id === input.itemId);
        if (!item) return '';
        const shop = s.shops.find((sh) => sh.id === item.shopId);
        shopId = item.shopId; shopName = shop ? shop.name : '京东自营'; self = item.self;
        lines = [{ itemId: item.id, title: item.title, image: item.image, skuDesc: input.skuDesc || '', price: item.price, qty: input.qty || 1 }];
      }
      const itemTotal = Math.round(lines.reduce((t, l) => t + l.price * l.qty, 0) * 100) / 100;
      // 实付:优先显式 paidAmount(外卖含打包费/补贴),否则商品金额减优惠券抵扣
      const paidAmount = input.paidAmount != null
        ? Math.round(input.paidAmount * 100) / 100
        : Math.max(0, Math.round((itemTotal - (input.discount ?? 0)) * 100) / 100);
      const orderId = genId('o');
      const order: Order = {
        id: orderId, orderNo: makeOrderNo(), channel: input.channel, shopId, shopName, self,
        lines, itemTotal, paidAmount, status: input.status ?? 'undelivered', payMethod: input.payMethod,
        createdAt: TimeService.now(), couponId: input.couponId, baitiaoPeriod: input.baitiaoPeriod,
        addressSnapshot: addr
          ? { name: addr.name, phone: addr.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), full: `${addr.region} ${addr.detail}` }
          : { name: '张先生', phone: '138****8000', full: '上海市浦东新区阳光家园3栋1801' },
        logistics: { company: '京东物流', trackingNo: 'JD' + makeOrderNo(), nodes: [{ time: '刚刚', text: '您提交了订单,请等待系统确认' }] },
        reviewed: false,
      };
      set((st) => ({
        orders: [order, ...st.orders],
        cart: input.keys ? st.cart.filter((c) => !input.keys!.includes(c.key)) : st.cart,
      }));
      return orderId;
    },
    payOrder: (orderId) => set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId
        ? { ...o, status: 'undelivered', paidAmount: o.paidAmount > 0 ? o.paidAmount : o.itemTotal }
        : o)),
    })),
    setOrderPayMethod: (orderId, payMethod, baitiaoPeriod) =>
      set((s) => ({
        orders: s.orders.map((o) => (
          o.id === orderId ? { ...o, payMethod, baitiaoPeriod } : o
        )),
      })),
    cancelOrder: (orderId) =>
      set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o)) })),
    confirmReceipt: (orderId) => set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'done' } : o)) })),
    submitRefund: (orderId, reason) => set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'refunding', refundReason: reason } : o)) })),
    submitReview: (orderId, rating) => set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, reviewed: true, reviewRating: rating } : o)) })),
    markOrderLogisticsViewed: (orderId) => set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, logisticsViewed: true } : o)) })),
    remindOrder: (orderId) => set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, reminded: true } : o)) })),

    saveAddress: (addr) =>
      set((s) => {
        if (addr.id && s.addresses.some((a) => a.id === addr.id)) {
          return { addresses: s.addresses.map((a) => (a.id === addr.id ? ({ ...a, ...addr } as typeof a) : a)) };
        }
        const id = addr.id || genId('addr');
        const newAddr = { ...addr, id } as JdState['addresses'][number];
        const list = newAddr.isDefault ? s.addresses.map((a) => ({ ...a, isDefault: false })) : s.addresses;
        return { addresses: [...list, newAddr] };
      }),
    removeAddress: (id) =>
      set((s) => {
        const next = s.addresses.filter((a) => a.id !== id);
        const selectedAddressId =
          s.selectedAddressId === id
            ? (next.find((a) => a.isDefault)?.id ?? next[0]?.id ?? '')
            : s.selectedAddressId;
        return { addresses: next, selectedAddressId };
      }),
    setDefaultAddress: (id) => set((s) => ({ addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })), selectedAddressId: id })),
    selectAddress: (id) => set({ selectedAddressId: id }),

    claimCoupon: (couponId) =>
      set((s) => {
        const c = s.couponCenter.find((x) => x.id === couponId);
        if (!c || c.claimed) return {};
        return {
          couponCenter: s.couponCenter.map((x) => (x.id === couponId ? { ...x, claimed: true } : x)),
          coupons: [{ ...c, claimed: true }, ...s.coupons],
          user: { ...s.user, couponCount: s.user.couponCount + 1 },
        };
      }),
    claimGuobu: (region) =>
      set((s) => ({ guobuRegions: s.guobuRegions.map((r) => (r.name === region ? { ...r, claimed: true } : r)) })),
    signIn: () =>
      set((s) => (s.signedToday ? {} : { signedToday: true, user: { ...s.user, jingdou: s.user.jingdou + 10 } })),

    ensureShopChat: (shopId) => {
      const s = get();
      const id = `ch_${shopId}`;
      const existing = s.chats.find((c) => c.shopId === shopId || c.id === id);
      if (existing) return existing.id;
      const shop = s.shops.find((sh) => sh.id === shopId);
      set((st) => ({
        chats: [
          {
            id, kind: 'shop', shopId, name: shop ? shop.name : '店铺客服',
            avatar: shop ? shop.logo : '', preview: '您好,在线客服很高兴为您服务', time: '刚刚', unread: 0,
            quickQuestions: ['有货吗', '什么时候发货', '怎么退换货', '开发票'],
            messages: [{ id: genId('m'), sender: 'peer', type: 'text', content: `您好,欢迎光临${shop ? shop.name : '本店'},在线客服很高兴为您服务!`, ts: TimeService.now() }],
          },
          ...st.chats,
        ],
      }));
      return id;
    },
    sendMessage: (chatId, text) =>
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, { id: genId('m'), sender: 'me', type: 'text', content: text, ts: TimeService.now() }, { id: genId('m'), sender: 'peer', type: 'text', content: '亲,已收到您的消息,正在为您查询,请稍等~', ts: TimeService.now() + 1 }] }
            : c,
        ),
      })),
    quickAsk: (chatId, question) =>
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, { id: genId('m'), sender: 'me', type: 'text', content: question, ts: TimeService.now() }, { id: genId('m'), sender: 'peer', type: 'text', content: '亲,相关操作可在「我的-我的订单」中完成哦~', ts: TimeService.now() + 1 }] }
            : c,
        ),
      })),
    markChatRead: (chatId) => set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)) })),
    clearUnread: () => set((s) => ({ chats: s.chats.map((c) => ({ ...c, unread: 0 })) })),

    addSearchHistory: (word) =>
      set((s) => {
        const w = word.trim();
        if (!w) return {};
        return { searchHistory: [w, ...s.searchHistory.filter((x) => x !== w)].slice(0, 12) };
      }),
    removeSearchHistory: (word) => set((s) => ({ searchHistory: s.searchHistory.filter((x) => x !== word) })),
    clearSearchHistory: () => set({ searchHistory: [] }),
    removeFootprint: (date, itemId) => set((s) => ({
      footprints: s.footprints
        .map((day) => day.date === date ? { ...day, itemIds: day.itemIds.filter((id) => id !== itemId) } : day)
        .filter((day) => day.itemIds.length > 0),
    })),

    setDarkMode: (on) => set((s) => ({ settings: { ...s.settings, darkMode: on } })),
    setAppearanceMode: (mode) => set((s) => ({ settings: { ...s.settings, appearanceMode: mode, darkMode: mode === 'dark' } })),
    setFontScale: (scale) => set((s) => ({ settings: { ...s.settings, fontScale: scale } })),
    setLanguage: (language) => set((s) => ({ settings: { ...s.settings, language } })),
  }),
  { persistName: `${manifest.id}_v${DATA_VERSION}` },
);
