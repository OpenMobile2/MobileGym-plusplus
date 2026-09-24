import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { TAOBAO_CONFIG } from './data';
import type {
  TaobaoState, TaobaoActions, TbCartItem, TbOrder, TbOrderLine, TbChatMessage,
} from './types';

const initialState: TaobaoState = JSON.parse(JSON.stringify(TAOBAO_CONFIG));

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** AI 购物助手脚本化回复(P2,不接真模型) */
function aiReply(input: string): string {
  if (/订单|物流|快递/.test(input)) return '你可以在「我的淘宝-我的订单」里查看订单状态和物流信息哦~';
  if (/护手霜|美妆|礼盒/.test(input)) return '为你推荐清风山旗舰店的山雾香氛护手霜,2000+人付款,好评关键词:包装精美、滋润不油。';
  if (/便宜|比价|价格/.test(input)) return '在商品详情页和购物车里点「明细」可以查看近3个月价格走势,买贵了还能申请价保~';
  return '收到!我可以帮你找商品、查订单、比价格,描述得越具体我找得越准哦~';
}

export const useTaobaoStore = createAppStoreWithActions<TaobaoState, TaobaoActions>(
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
    removeSearchHistory: (word) => {
      set((s) => ({ searchHistory: s.searchHistory.filter((w) => w !== word) }));
    },

    // ---------- 详情 / SKU ----------
    addToCart: (itemId, skuDesc, qty) => {
      const item = get().items.find((i) => i.id === itemId);
      if (!item) return;
      set((s) => {
        const existing = s.cart.find(
          (c) => c.itemId === itemId && c.skuDesc === skuDesc && !c.invalid,
        );
        if (existing) {
          return {
            cart: s.cart.map((c) =>
              c.id === existing.id ? { ...c, qty: c.qty + qty } : c,
            ),
          };
        }
        const entry: TbCartItem = {
          id: genId('c'), itemId, skuDesc, qty, price: item.price,
          selected: false, invalid: false, addedAt: TimeService.now(),
        };
        return { cart: [entry, ...s.cart] };
      });
    },
    toggleFavorite: (itemId) => {
      set((s) => ({
        favorites: s.favorites.includes(itemId)
          ? s.favorites.filter((f) => f !== itemId)
          : [itemId, ...s.favorites],
      }));
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

    // ---------- 购物车 ----------
    toggleCartSelect: (cartItemId) => {
      set((s) => ({
        cart: s.cart.map((c) =>
          c.id === cartItemId && !c.invalid ? { ...c, selected: !c.selected } : c,
        ),
      }));
    },
    toggleCartShopSelect: (shopId) => {
      const { cart, items } = get();
      const inShop = (c: TbCartItem) =>
        items.find((i) => i.id === c.itemId)?.shopId === shopId && !c.invalid;
      const allSelected = cart.filter(inShop).every((c) => c.selected);
      set((s) => ({
        cart: s.cart.map((c) => (inShop(c) ? { ...c, selected: !allSelected } : c)),
      }));
    },
    toggleCartSelectAll: () => {
      const valid = get().cart.filter((c) => !c.invalid);
      const allSelected = valid.length > 0 && valid.every((c) => c.selected);
      set((s) => ({
        cart: s.cart.map((c) => (c.invalid ? c : { ...c, selected: !allSelected })),
      }));
    },
    changeCartQty: (cartItemId, delta) => {
      set((s) => ({
        cart: s.cart.map((c) =>
          c.id === cartItemId ? { ...c, qty: Math.max(1, c.qty + delta) } : c,
        ),
      }));
    },
    deleteCartItems: (cartItemIds) => {
      set((s) => ({ cart: s.cart.filter((c) => !cartItemIds.includes(c.id)) }));
    },
    moveCartToFavorites: (cartItemIds) => {
      set((s) => {
        const moved = s.cart.filter((c) => cartItemIds.includes(c.id)).map((c) => c.itemId);
        return {
          cart: s.cart.filter((c) => !cartItemIds.includes(c.id)),
          favorites: [...new Set([...moved, ...s.favorites])],
        };
      });
    },
    setPriceAlert: (itemId) => {
      set((s) => ({
        priceAlerts: s.priceAlerts.includes(itemId) ? s.priceAlerts : [...s.priceAlerts, itemId],
      }));
    },

    // ---------- 下单 / 支付 ----------
    beginCheckout: ({ lines, shopId, source, sourceCartLineIds }) => {
      const def = get().addresses.find((a) => a.isDefault) ?? get().addresses[0];
      set(() => ({
        checkout: {
          lines, shopId, source,
          sourceCartLineIds: sourceCartLineIds ? [...new Set(sourceCartLineIds)] : undefined,
          addressId: def ? def.id : '',
          payMethod: '支付宝',
          note: '',
        },
      }));
    },
    setCheckoutAddress: (addressId) => {
      set((s) => (s.checkout ? { checkout: { ...s.checkout, addressId } } : {}));
    },
    setCheckoutPayMethod: (m) => {
      set((s) => (s.checkout ? { checkout: { ...s.checkout, payMethod: m } } : {}));
    },
    setCheckoutNote: (note) => {
      set((s) => (s.checkout ? { checkout: { ...s.checkout, note } } : {}));
    },
    createOrder: () => {
      const s = get();
      const ck = s.checkout;
      if (!ck || ck.lines.length === 0) return '';
      const shop = s.shops.find((x) => x.id === ck.shopId);
      const addr = s.addresses.find((a) => a.id === ck.addressId) ?? s.addresses[0];
      const itemTotal = round2(ck.lines.reduce((sum, l) => sum + l.price * l.qty, 0));
      const orderId = genId('o');
      const order: TbOrder = {
        id: orderId,
        orderNo: `33${String(TimeService.now())}9${String(seq).padStart(3, '0')}`,
        shopId: ck.shopId,
        shopName: shop ? shop.name : '',
        shopBadge: shop ? shop.badge : 'taobao',
        lines: ck.lines,
        itemTotal,
        shopDiscount: 0,
        shippingFee: 0,
        paidAmount: itemTotal,
        status: 'pendingPayment',
        addressSnapshot: {
          name: addr.name,
          phone: addr.phone.slice(0, 3) + '****' + addr.phone.slice(-4),
          full: addr.region.replace(/ /g, '') + addr.detail,
        },
        payMethod: null,
        createdAt: TimeService.now(),
        paidAt: null, shippedAt: null, completedAt: null,
        payDeadline: TimeService.now() + 2 * 3600_000,
        autoConfirmAt: null,
        logistics: { noLogistics: false, company: null, trackingNo: null, nodes: [] },
        reviewed: false,
        gift: null,
      };
      // 购物车来源:移除已购入的选中项
      const boughtCartIds =
        ck.source === 'cart'
          ? ck.sourceCartLineIds?.length
            ? ck.sourceCartLineIds
            : s.cart.filter((c) => c.selected && !c.invalid).map((c) => c.id)
          : [];
      set((st) => ({
        orders: [order, ...st.orders],
        cart: st.cart.filter((c) => !boughtCartIds.includes(c.id)),
      }));
      return orderId;
    },
    markOrderPaid: (orderId) => {
      const payMethod = get().checkout?.payMethod ?? '支付宝';
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'pendingShip' as const,
                payMethod,
                paidAt: TimeService.now(),
                payDeadline: null,
              }
            : o,
        ),
        checkout: null,
      }));
    },

    // ---------- 订单 ----------
    confirmReceipt: (orderId) => {
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: 'completed' as const, completedAt: TimeService.now(), autoConfirmAt: null }
            : o,
        ),
      }));
    },
    extendReceipt: (orderId) => {
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId && o.autoConfirmAt
            ? { ...o, autoConfirmAt: o.autoConfirmAt + 3 * 86400000 }
            : o,
        ),
      }));
    },
    buyAgain: (orderId) => {
      const order = get().orders.find((o) => o.id === orderId);
      if (!order) return;
      set((s) => {
        const entries: TbCartItem[] = order.lines.map((l: TbOrderLine) => ({
          id: genId('c'), itemId: l.itemId, skuDesc: l.skuDesc, qty: l.qty,
          price: l.price, selected: true, invalid: false, addedAt: TimeService.now(),
        }));
        return { cart: [...entries, ...s.cart] };
      });
    },
    deleteRefundRecord: (refundId) => {
      set((s) => ({ refunds: s.refunds.filter((r) => r.id !== refundId) }));
    },
    submitRefund: (orderId, refundType, reason) => {
      const order = get().orders.find((o) => o.id === orderId);
      if (!order) return;
      set((s) => ({
        refunds: [
          {
            id: genId('rf'), orderId,
            line: order.lines[0],
            shopName: order.shopName, shopBadge: order.shopBadge,
            refundType, reason,
            amount: order.paidAmount,
            // 模拟秒批
            status: 'success' as const,
            createdAt: TimeService.now(),
          },
          ...s.refunds,
        ],
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'refunded' as const } : o,
        ),
      }));
    },
    submitReview: (orderId, itemId, content) => {
      set((s) => ({
        myReviews: [
          { orderId, itemId, content, timestamp: TimeService.now() },
          ...s.myReviews,
        ],
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, reviewed: true } : o)),
      }));
    },

    // ---------- 地址 ----------
    saveAddress: (addr) => {
      set((s) => {
        if (addr.id) {
          return {
            addresses: s.addresses.map((a) =>
              a.id === addr.id ? { ...a, ...addr, id: addr.id! } : a,
            ),
          };
        }
        return {
          addresses: [...s.addresses, { ...addr, id: genId('addr'), isDefault: false }],
        };
      });
    },
    setDefaultAddress: (addressId) => {
      set((s) => ({
        addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === addressId })),
      }));
    },

    // ---------- 店铺 / 消息 ----------
    toggleFollowShop: (shopId) => {
      set((s) => ({
        followedShops: s.followedShops.includes(shopId)
          ? s.followedShops.filter((x) => x !== shopId)
          : [shopId, ...s.followedShops],
      }));
    },
    joinShopMember: (shopId) => {
      set((s) => ({
        memberShops: s.memberShops.includes(shopId) ? s.memberShops : [...s.memberShops, shopId],
      }));
    },
    ensureShopChat: (shopId) => {
      const existing = get().chats.find((c) => c.shopId === shopId);
      if (existing) return existing.id;
      const shop = get().shops.find((s) => s.id === shopId);
      const chatId = `ch_${shopId}`;
      set((s) => ({
        chats: [
          {
            id: chatId, kind: 'shop' as const, shopId,
            name: shop ? shop.name : '店铺客服',
            avatar: shop ? shop.logo : '',
            unread: 0, isSticky: false,
            messages: [{
              id: genId('m'), sender: 'peer' as const, type: 'text' as const,
              content: `欢迎光临${shop ? shop.name : '本店'},请问有什么可以帮到宝的呢~`,
              timestamp: TimeService.now(),
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
      const mine: TbChatMessage = {
        id: genId('m'), sender: 'me', type: 'text', content: content.trim(),
        timestamp: TimeService.now(),
      };
      const replies: TbChatMessage[] = [];
      if (chat.kind === 'ai') {
        replies.push({
          id: genId('m'), sender: 'peer', type: 'text', content: aiReply(content),
          timestamp: TimeService.now() + 1000,
        });
      } else if (chat.kind === 'shop') {
        replies.push({
          id: genId('m'), sender: 'peer', type: 'text',
          content: '亲亲您好,客服这边收到啦,马上为您处理哦~',
          timestamp: TimeService.now() + 1000,
        });
      }
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId ? { ...c, messages: [...c.messages, mine, ...replies] } : c,
        ),
      }));
    },
    sendChatItemCard: (chatId, itemId) => {
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: genId('m'), sender: 'me' as const, type: 'itemCard' as const,
                    content: '', itemId, timestamp: TimeService.now(),
                  },
                ],
              }
            : c,
        ),
      }));
    },
    confirmChatAddress: (chatId, messageId) => {
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...c.messages.map((m) =>
                    m.id === messageId ? { ...m, confirmed: true } : m,
                  ),
                  {
                    id: genId('m'), sender: 'me' as const, type: 'text' as const,
                    content: '已确认收货地址', timestamp: TimeService.now(),
                  },
                ],
              }
            : c,
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
    clearAllUnread: () => {
      set((st) => ({ chats: st.chats.map((c) => ({ ...c, unread: 0 })) }));
    },
    markChatRead: (chatId) => {
      set((s) => ({
        chats: s.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)),
      }));
    },

    // ---------- 收藏 / 其他 ----------
    removeFavorite: (itemId) => {
      set((s) => ({ favorites: s.favorites.filter((f) => f !== itemId) }));
    },
    claimCenterCoupon: (title, amount, thresholdText) => {
      set((s) => {
        const claimed = s.claimedCenterCoupons ?? [];
        if (claimed.includes(title)) return {};
        return {
          claimedCenterCoupons: [...claimed, title],
          coupons: [
            { id: genId('cp'), title, amount, thresholdText,
              scope: '购物', validText: '618品类周专享', used: false },
            ...s.coupons,
          ],
        };
      });
    },
    claimHomeCoupon: () => {
      set((s) =>
        s.homeCouponClaimed
          ? {}
          : {
              homeCouponClaimed: true,
              coupons: [
                {
                  id: genId('cp'), title: '消费券', amount: 250, thresholdText: '满500可用',
                  scope: '购物', validText: '618 开门红专享', used: false,
                },
                ...s.coupons,
              ],
            },
      );
    },
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<TaobaoState>;
    },
  },
);
