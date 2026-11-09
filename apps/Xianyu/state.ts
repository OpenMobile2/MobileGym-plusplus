import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { XIANYU_CONFIG } from './data';
import type {
  XianyuState, XianyuActions, XyOrder, XyChatMessage, XyItem, XyReview,
} from './types';

const initialState: XianyuState = JSON.parse(JSON.stringify(XIANYU_CONFIG));

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

/** 卖家脚本化回复(P2,不接真模型) */
function sellerReply(input: string): string {
  if (/多少|价|刀|便宜/.test(input)) return '亲这个价格真的很实在啦,诚心要可以小刀一点点~';
  if (/发货|物流|快递/.test(input)) return '拍下我就安排发货,一般当天或次日发出哦';
  if (/验货|真|正品/.test(input)) return '支持验货宝的,假一赔三,可以放心拍~';
  return '在的在的,亲有什么想了解的都可以问我~';
}

export const useXianyuStore = createAppStoreWithActions<XianyuState, XianyuActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    // ---------- 搜索 ----------
    submitSearch: (q) => {
      const word = q.trim();
      if (!word) return;
      set((s) => ({
        searchHistory: [word, ...s.searchHistory.filter((w) => w !== word)].slice(0, 10),
      }));
    },
    clearSearchHistory: () => set({ searchHistory: [] }),
    subscribeSearch: (q) => {
      const word = q.trim();
      if (!word) return;
      set((s) => ({ subscribedSearches: [word, ...s.subscribedSearches.filter((w) => w !== word)] }));
    },

    // ---------- 详情 ----------
    toggleFavorite: (itemId) => {
      set((s) => ({
        favorites: s.favorites.includes(itemId)
          ? s.favorites.filter((f) => f !== itemId)
          : [itemId, ...s.favorites],
      }));
    },
    removeFavorite: (itemId) => {
      set((s) => ({ favorites: s.favorites.filter((f) => f !== itemId) }));
    },
    recordFootprint: (itemId) => {
      const today = TimeService.now() - (TimeService.now() % 86400000);
      set((s) => ({
        footprints: [
          { itemId, date: today },
          ...s.footprints.filter((f) => !(f.itemId === itemId && f.date === today)),
        ],
      }));
    },
    clearFootprints: () => set({ footprints: [] }),
    toggleFollowSeller: (sellerId) => {
      set((s) => ({
        followedSellers: s.followedSellers.includes(sellerId)
          ? s.followedSellers.filter((x) => x !== sellerId)
          : [sellerId, ...s.followedSellers],
      }));
    },
    addComment: (itemId, content) => {
      if (!content.trim()) return;
      set((s) => ({
        comments: {
          ...s.comments,
          [itemId]: [
            ...(s.comments[itemId] ?? []),
            {
              id: genId('cm'), user: s.user.name, avatar: s.user.avatar,
              content: content.trim(), likes: 0, liked: false, timestamp: TimeService.now(),
            },
          ],
        },
      }));
    },
    toggleCommentLike: (itemId, commentId) => {
      set((s) => ({
        comments: {
          ...s.comments,
          [itemId]: (s.comments[itemId] ?? []).map((c) =>
            c.id === commentId
              ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
              : c,
          ),
        },
      }));
    },

    // ---------- 圈子 ----------
    joinCircle: (circleId) => {
      set((s) => ({
        joinedCircles: s.joinedCircles.includes(circleId)
          ? s.joinedCircles
          : [circleId, ...s.joinedCircles],
      }));
    },

    // ---------- 私信 ----------
    ensureChat: (sellerId, itemId) => {
      const existing = get().chats.find((c) => c.sellerId === sellerId);
      if (existing) {
        if (itemId && existing.itemId !== itemId) {
          set((s) => ({
            chats: s.chats.map((c) => (c.id === existing.id ? { ...c, itemId } : c)),
          }));
        }
        return existing.id;
      }
      const seller = get().sellers.find((x) => x.id === sellerId);
      const chatId = `ch_${sellerId}`;
      set((s) => ({
        chats: [
          {
            id: chatId, sellerId, name: seller ? seller.name : '卖家',
            avatar: seller ? seller.avatar : '', itemId,
            unread: 0, isSticky: false,
            messages: [{
              id: genId('m'), sender: 'peer', type: 'text',
              content: '在的,亲有什么想了解的都可以问我~', timestamp: TimeService.now(),
            }],
          },
          ...s.chats,
        ],
      }));
      return chatId;
    },
    sendChatMessage: (chatId, content) => {
      const chat = get().chats.find((c) => c.id === chatId);
      if (!chat || !content.trim()) return;
      const mine: XyChatMessage = {
        id: genId('m'), sender: 'me', type: 'text', content: content.trim(),
        timestamp: TimeService.now(),
      };
      const reply: XyChatMessage = {
        id: genId('m'), sender: 'peer', type: 'text', content: sellerReply(content),
        timestamp: TimeService.now() + 1000,
      };
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId ? { ...c, messages: [...c.messages, mine, reply] } : c,
        ),
      }));
    },
    toggleChatSticky: (chatId) => {
      set((s) => ({
        chats: s.chats.map((c) => (c.id === chatId ? { ...c, isSticky: !c.isSticky } : c)),
      }));
    },
    deleteChat: (chatId) => {
      set((s) => ({ chats: s.chats.filter((c) => c.id !== chatId) }));
    },
    markChatRead: (chatId) => {
      set((s) => ({
        chats: s.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)),
      }));
    },

    // ---------- 下单 / 支付 ----------
    beginCheckout: (itemId) => {
      const def = get().addresses.find((a) => a.isDefault) ?? get().addresses[0];
      set({
        checkout: {
          itemId,
          addressId: def ? def.id : '',
          delivery: 'express',
          payMethod: '支付宝',
        },
      });
    },
    setCheckoutAddress: (addressId) => {
      set((s) => (s.checkout ? { checkout: { ...s.checkout, addressId } } : {}));
    },
    setCheckoutDelivery: (delivery) => {
      set((s) => (s.checkout ? { checkout: { ...s.checkout, delivery } } : {}));
    },
    setCheckoutPayMethod: (payMethod) => {
      set((s) => (s.checkout ? { checkout: { ...s.checkout, payMethod } } : {}));
    },
    createOrder: () => {
      const s = get();
      const ck = s.checkout;
      if (!ck) return '';
      const item = s.items.find((i) => i.id === ck.itemId);
      if (!item) return '';
      const seller = s.sellers.find((x) => x.id === item.sellerId);
      const addr = s.addresses.find((a) => a.id === ck.addressId) ?? s.addresses[0];
      const orderId = genId('o');
      const order: XyOrder = {
        id: orderId,
        orderNo: String(TimeService.now()).slice(-10),
        role: 'buyer',
        itemId: item.id,
        title: item.title,
        image: item.images[0],
        price: item.price,
        sellerId: item.sellerId,
        sellerName: seller ? seller.name : '卖家',
        buyerName: s.user.name,
        status: 'pendingPayment',
        addressSnapshot: addr
          ? { name: addr.name, phone: addr.phone.slice(0, 3) + '****' + addr.phone.slice(-4), full: addr.region.replace(/ /g, '') + addr.detail }
          : null,
        payMethod: null,
        delivery: ck.delivery,
        inspected: item.inspected,
        reviewed: false,
        createdAt: TimeService.now(),
        paidAt: null, shippedAt: null, completedAt: null,
        payDeadline: TimeService.now() + 2 * 3600_000,
      };
      set((st) => ({ orders: [order, ...st.orders] }));
      return orderId;
    },
    markOrderPaid: (orderId) => {
      const payMethod = get().checkout?.payMethod ?? '支付宝';
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: 'pendingShip' as const, payMethod, paidAt: TimeService.now(), payDeadline: null }
            : o,
        ),
        checkout: null,
      }));
    },

    // ---------- 订单 ----------
    cancelOrder: (orderId, reason) => {
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'closed' as const, cancelReason: reason } : o,
        ),
      }));
    },
    deleteOrder: (orderId) => {
      set((s) => ({ orders: s.orders.filter((o) => o.id !== orderId) }));
    },
    confirmReceipt: (orderId) => {
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: 'pendingReview' as const, completedAt: TimeService.now() }
            : o,
        ),
      }));
    },

    // ---------- 评价 ----------
    submitReview: (orderId, rating, content, anonymous, images = []) => {
      const order = get().orders.find((o) => o.id === orderId);
      if (!order) return;
      const review: XyReview = {
        orderId, itemId: order.itemId, rating, content: content.trim(),
        images, anonymous, timestamp: TimeService.now(),
      };
      set((s) => ({
        reviews: [review, ...s.reviews],
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, reviewed: true, status: 'completed' as const } : o,
        ),
      }));
    },
    appendReview: (orderId, content) => {
      set((s) => ({
        reviews: s.reviews.map((r) =>
          r.orderId === orderId ? { ...r, append: content.trim() } : r,
        ),
      }));
    },

    // ---------- 发布 ----------
    publishItem: (draft) => {
      const s = get();
      const itemId = genId('i');
      const newItem: XyItem = {
        id: itemId,
        title: draft.title || '闲置好物',
        desc: draft.desc,
        images: draft.images.length ? draft.images : [],
        price: draft.price ?? 0,
        wantCount: 0,
        viewCount: 0,
        condition: draft.condition,
        category: draft.category ?? '闲置',
        sellerId: 'me',
        location: s.addresses.find((a) => a.isDefault)?.region.split(' ').slice(0, 2).join('·') ?? '上海·浦东新区',
        distanceKm: 0,
        freeShipping: true,
        inspected: draft.inspected,
        tags: draft.inspected ? ['验货宝'] : [],
      };
      set((st) => ({
        items: [newItem, ...st.items],
        listings: [{ itemId, status: 'onSale' as const, publishedAt: TimeService.now() }, ...st.listings],
      }));
      return itemId;
    },
    saveDraft: (draft) => {
      set((s) => ({
        drafts: [
          { ...draft, id: genId('d'), savedAt: TimeService.now() },
          ...s.drafts,
        ],
      }));
    },

    // ---------- 地址 ----------
    saveAddress: (addr) => {
      set((s) => {
        if (addr.id) {
          return {
            addresses: s.addresses.map((a) =>
              a.id === addr.id
                ? { ...a, ...addr, id: addr.id! }
                : (addr.isDefault ? { ...a, isDefault: false } : a),
            ),
          };
        }
        const created = {
          id: genId('addr'),
          name: addr.name ?? '', phone: addr.phone ?? '',
          region: addr.region ?? '', detail: addr.detail ?? '',
          tag: addr.tag, isDefault: Boolean(addr.isDefault),
        };
        return {
          addresses: [
            ...s.addresses.map((a) => (created.isDefault ? { ...a, isDefault: false } : a)),
            created,
          ],
        };
      });
    },
    deleteAddress: (addressId) => {
      set((s) => ({ addresses: s.addresses.filter((a) => a.id !== addressId) }));
    },
    setDefaultAddress: (addressId) => {
      set((s) => ({
        addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === addressId })),
      }));
    },
    saveReturnAddress: (addr) => {
      set((s) => {
        if (addr.id) {
          return {
            returnAddresses: s.returnAddresses.map((a) =>
              a.id === addr.id
                ? { ...a, ...addr, id: addr.id! }
                : (addr.isDefault ? { ...a, isDefault: false } : a),
            ),
          };
        }
        const created = {
          id: genId('ra'),
          name: addr.name ?? '', phone: addr.phone ?? '',
          region: addr.region ?? '', detail: addr.detail ?? '', isDefault: Boolean(addr.isDefault),
        };
        return {
          returnAddresses: [
            ...s.returnAddresses.map((a) => (created.isDefault ? { ...a, isDefault: false } : a)),
            created,
          ],
        };
      });
    },

    // ---------- 卡券 ----------
    claimCoupon: (couponId) => {
      set((s) => ({
        coupons: s.coupons.map((c) => (c.id === couponId ? { ...c, claimed: true, used: false } : c)),
      }));
      void couponId;
    },

    // ---------- 设置 ----------
    toggleDarkMode: () => set((s) => ({ settings: { ...s.settings, darkMode: !s.settings.darkMode } })),
    setLanguage: (language) => set((s) => ({ settings: { ...s.settings, language } })),
    recordTaskAudit: (key, value) => set((s) => ({ taskAudit: { ...s.taskAudit, [key]: value } })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<XianyuState>;
    },
  },
);
