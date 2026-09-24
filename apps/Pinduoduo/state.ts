import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { PDD_CONFIG } from './data';
import type { PddState, PddActions, Order } from './types';

const initialState: PddState = JSON.parse(JSON.stringify(PDD_CONFIG));

let seq = 0;
const genId = (p: string) => `${p}_${TimeService.now()}_${seq++}`;

function makeOrderNo(): string {
  // 19 位数字订单号(仿真)
  const base = String(TimeService.now());
  let tail = '';
  for (let i = 0; i < 6; i++) tail += String((seq * 7 + i * 3) % 10);
  return (base + tail).slice(0, 19).padEnd(19, '0');
}

export const usePinduoduoStore = createAppStoreWithActions<PddState, PddActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    toggleFavorite: (itemId) =>
      set((s) => ({
        favorites: s.favorites.includes(itemId)
          ? s.favorites.filter((f) => f !== itemId)
          : [itemId, ...s.favorites],
      })),

    removeFavorites: (itemIds) =>
      set((s) => ({ favorites: s.favorites.filter((f) => !itemIds.includes(f)) })),

    addFootprint: (itemId) =>
      set((s) => {
        const today = s.footprints.find((d) => d.date === '今天');
        if (today) {
          if (today.itemIds.includes(itemId)) return {};
          return {
            footprints: s.footprints.map((d) =>
              d.date === '今天' ? { ...d, itemIds: [itemId, ...d.itemIds] } : d,
            ),
          };
        }
        return { footprints: [{ date: '今天', itemIds: [itemId] }, ...s.footprints] };
      }),

    followShop: (shopId) =>
      set((s) => ({
        followedShops: s.followedShops.includes(shopId)
          ? s.followedShops.filter((f) => f !== shopId)
          : [shopId, ...s.followedShops],
      })),

    placeOrder: (input) => {
      const s = get();
      const item = s.items.find((i) => i.id === input.itemId);
      if (!item) return '';
      const shop = s.shops.find((sh) => sh.id === item.shopId);
      const addr = s.addresses.find((a) => a.id === s.selectedAddressId) || s.addresses[0];
      const unit = input.mode === 'single' ? item.singlePrice : item.pinPrice;
      const total = Math.round(unit * input.qty * 100) / 100;
      const grouping = input.mode === 'group';
      const orderId = genId('o');
      const order: Order = {
        id: orderId,
        orderNo: makeOrderNo(),
        shopId: item.shopId,
        shopName: shop ? shop.name : '拼多多商家',
        lines: [
          { itemId: item.id, title: item.title, image: item.image, skuDesc: input.skuDesc, price: unit, qty: input.qty },
        ],
        itemTotal: total,
        paidAmount: input.fufei ? 0 : total,
        status: grouping ? 'grouping' : 'packing',
        payMethod: input.fufei ? '先用后付' : input.payMethod,
        fufei: input.fufei,
        groupNeed: grouping ? 1 : 0,
        addressSnapshot: addr
          ? { name: addr.name, phone: addr.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), full: `${addr.region} ${addr.detail}` }
          : { name: '张三', phone: '138****0152', full: '江苏省南京市栖霞区仙林大道163号' },
        createdAt: TimeService.now(),
        paidAt: input.fufei ? null : TimeService.now(),
        autoPayAmount: total,
        logistics: { trackingNo: '', company: '', nodes: [] },
        reviewed: false,
      };
      set((st) => ({ orders: [order, ...st.orders] }));
      return orderId;
    },

    soloFinishGroup: (orderId) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'packing', groupNeed: 0 } : o,
        ),
      })),

    payOrder: (orderId) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: 'packing', paidAmount: o.itemTotal, paidAt: TimeService.now() }
            : o,
        ),
      })),

    cancelOrder: (orderId) =>
      set((s) => ({ orders: s.orders.filter((o) => o.id !== orderId) })),

    confirmReceipt: (orderId) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'completed' } : o,
        ),
      })),

    confirmQuickRefund: (orderId) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'refunded', refundReason: '协商一致退款' } : o,
        ),
      })),

    submitRefundForm: (orderId, reason) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'refunding', refundReason: reason } : o,
        ),
      })),

    remindShip: () => {
      // 催发货:仅提示,不改状态
    },

    saveAddress: (addr) =>
      set((s) => {
        if (addr.id && s.addresses.some((a) => a.id === addr.id)) {
          return {
            addresses: s.addresses.map((a) => (a.id === addr.id ? { ...a, ...addr } as typeof a : a)),
          };
        }
        const id = addr.id || genId('addr');
        const newAddr = { ...addr, id } as PddState['addresses'][number];
        // 若设为默认,清除其它默认
        const list = newAddr.isDefault
          ? s.addresses.map((a) => ({ ...a, isDefault: false }))
          : s.addresses;
        return { addresses: [...list, newAddr] };
      }),

    setDefaultAddress: (id) =>
      set((s) => ({
        addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        selectedAddressId: id,
      })),

    selectAddress: (id) => set({ selectedAddressId: id }),

    claimCoupon: (couponId) =>
      set((s) => {
        const c = s.couponCenter.find((x) => x.id === couponId);
        if (!c || c.claimed) return {};
        return {
          couponCenter: s.couponCenter.map((x) => (x.id === couponId ? { ...x, claimed: true } : x)),
          coupons: [{ ...c, claimed: true }, ...s.coupons],
        };
      }),

    ensureShopChat: (shopId) => {
      const s = get();
      const id = `ch_${shopId}`;
      const existing = s.chats.find((c) => c.shopId === shopId || c.id === id);
      if (existing) return existing.id;
      const shop = s.shops.find((sh) => sh.id === shopId);
      set((st) => ({
        chats: [
          {
            id,
            kind: 'shop',
            shopId,
            name: shop ? shop.name : '店铺客服',
            avatar: shop ? shop.logo : '/@app-assets/Pinduoduo/avatars/s_daily.svg',
            unread: 0,
            badge: '',
            quickQuestions: ['有货吗', '什么时候发货', '怎么退货', '有优惠吗'],
            messages: [
              { id: genId('m'), sender: 'peer', type: 'text', content: `亲,欢迎光临${shop ? shop.name : '本店'},请问有什么可以帮您?`, ts: TimeService.now() },
            ],
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
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: genId('m'), sender: 'me', type: 'text', content: text, ts: TimeService.now() },
                  { id: genId('m'), sender: 'peer', type: 'text', content: '亲,已收到您的消息,正在为您查询,请稍等~', ts: TimeService.now() + 1 },
                ],
              }
            : c,
        ),
      })),

    quickAsk: (chatId, question) =>
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: genId('m'), sender: 'me', type: 'text', content: question, ts: TimeService.now() },
                  { id: genId('m'), sender: 'peer', type: 'text', content: '亲,这个问题小多为您解答:相关操作可在「个人中心-我的订单」中完成哦~', ts: TimeService.now() + 1 },
                ],
              }
            : c,
        ),
      })),

    markChatRead: (chatId) =>
      set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)) })),

    submitReview: (orderId, _rating) =>
      set((s) => ({
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, reviewed: true } : o)),
      })),

    addSearchHistory: (word) =>
      set((s) => {
        const w = word.trim();
        if (!w) return {};
        return { searchHistory: [w, ...s.searchHistory.filter((x) => x !== w)].slice(0, 12) };
      }),

    clearSearchHistory: () => set({ searchHistory: [] }),

    setFufeiEnabled: (on) => set((s) => ({ settings: { ...s.settings, fufeiEnabled: on } })),
    setDarkMode: (on) => set((s) => ({ settings: { ...s.settings, darkMode: on } })),
    setFontScale: (scale) => set((s) => ({ settings: { ...s.settings, fontScale: scale } })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
  },
);
