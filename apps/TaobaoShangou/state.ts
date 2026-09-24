import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION, ORDER_TICK, ORDER_REWARD_BEANS, REVIEW_REWARD_BEANS } from './constants';
import { TBSG_CONFIG } from './data';
import { cents, computeGroupAmounts, yuan } from './utils';
import type {
  TbCartLine, TbChatMsg, TbCoupon, TbMessage, TbOrder, TbsgActions, TbsgState,
} from './types';

const cfg = TBSG_CONFIG as unknown as Omit<TbsgState, 'chats' | 'currentAddressId' | 'myReviews' | 'burstUsedToday' | 'checkoutDraft' | 'route' | 'refundDraft'> & { appId: string };

const initialState: TbsgState = {
  ...JSON.parse(JSON.stringify(cfg)),
  chats: {
    'rider:o1001': [
      { id: 'rm1', from: 'peer', image: '/@app-assets/TaobaoShangou/banners/banner_night.jpg', ts: cfg.baseTs - 28 * 3600_000 },
      { id: 'rm2', from: 'peer', text: '您好,您的订单已经放在指定地点,请您尽快取用,谢谢!', ts: cfg.baseTs - 28 * 3600_000 + 60_000 },
    ],
    // 与消息列表(defaults.json messages 的 shop 会话)对应的聊天内容,避免点开为空
    'shop:s_xijie': [
      { id: 'xj1', from: 'peer', text: '亲,欢迎光临喜姐炸串~有什么可以帮您?', ts: cfg.baseTs - 26 * 3600_000 },
      { id: 'xj2', from: 'peer', text: '会员日专属红包已到账,今晚炸串5折起,记得下单前领取使用哦!', ts: cfg.baseTs - 26 * 3600_000 + 90_000 },
    ],
    'shop:s_huayu': [
      { id: 'hy1', from: 'peer', text: '感谢惠顾花语觅花艺~晒图评价可领3元店铺券,期待您的好评呢。', ts: cfg.baseTs - 30 * 3600_000 },
    ],
    'shop:s_feishu': [
      { id: 'fs1', from: 'peer', text: '群公告:每周三锅贴买十送二,老顾客欢迎常来~', ts: cfg.baseTs - 28 * 3600_000 },
    ],
  },
  currentAddressId: 'a1',
  myReviews: [
    { id: 'myrv1', orderId: 'o1006', shopId: 's_liwo', stars: 5, riderGood: true, text: '炸鸡很脆,酱油葱丝解腻,配送也快!', images: [], anonymous: false, ts: cfg.baseTs - 5 * 24 * 3600_000 },
    { id: 'myrv2', orderId: 'o1007', shopId: 's_lusen', stars: 4, riderGood: null, text: '自取很方便,牛奶日期新鲜。', images: [], anonymous: true, ts: cfg.baseTs - 9 * 24 * 3600_000 },
  ],
  burstUsedToday: false,
  checkoutDraft: null,
  route: '/',
  refundDraft: { reason: '', subReason: null },
};

let seq = 0;
const genId = (p: string) => `${p}_${TimeService.now()}_${seq++}`;

function shopAutoReply(input: string): string {
  if (/发票/.test(input)) return '亲,本店支持外卖小票扫码开票,如需纸质发票请留言备注哦~';
  if (/食安|售后|退|少|漏/.test(input)) return '非常抱歉给您带来不好的体验!请在订单页申请售后,我们会第一时间为您处理。';
  if (/多久|时间|到了|快/.test(input)) return '您的餐品正在加急制作,骑士很快就会取餐,请耐心等待~';
  return '好的收到,马上为您处理~祝您用餐愉快!';
}
function riderAutoReply(input: string): string {
  if (/放|门口|前台/.test(input)) return '好的,按您说的位置放,放好给您拍照片!';
  if (/快|急|多久/.test(input)) return '正在路上啦,预计几分钟内送达,请稍等~';
  return '收到!';
}
function serviceAutoReply(input: string): string {
  if (/少送|撒漏|没收到/.test(input)) return '非常抱歉!已为您登记问题,您可以点击「申请售后」提交退款申请,支持极速处理;需要人工介入可随时召唤我。';
  if (/退款/.test(input)) return '退款提交后商家会尽快处理,一般几分钟内完成打款,进度可在「订单-退款进度」查看哦。';
  return '您好,我是您的专属管家~您可以描述遇到的问题,或使用上方快捷按钮快速处理。';
}

/** 订单状态推进(qa:Q2/Q11):按 statusChangedAt 与模拟时间差推进 */
function advanceOrder(o: TbOrder, now: number, pushMsg: (m: TbMessage) => void): TbOrder {
  let cur = o;
  let guard = 0;
  while (guard++ < 4) {
    const dt = now - cur.statusChangedAt;
    if (cur.status === 'unpaid' && dt >= ORDER_TICK.UNPAID_TIMEOUT) {
      cur = {
        ...cur, status: 'canceled', statusChangedAt: cur.statusChangedAt + ORDER_TICK.UNPAID_TIMEOUT,
        cancelReason: '超时未支付,系统自动取消',
        timeline: [...cur.timeline, ['订单已取消(超时未支付)', cur.statusChangedAt + ORDER_TICK.UNPAID_TIMEOUT]],
      };
    } else if (cur.status === 'preparing' && dt >= ORDER_TICK.PREPARING_TO_DELIVERING) {
      const ts = cur.statusChangedAt + ORDER_TICK.PREPARING_TO_DELIVERING;
      cur = {
        ...cur, status: 'delivering', statusChangedAt: ts, riderName: cur.riderName ?? '骑士小赵',
        timeline: [...cur.timeline, ['骑士已接单,正在配送', ts]],
      };
    } else if (cur.status === 'delivering' && dt >= ORDER_TICK.DELIVERING_TO_DELIVERED) {
      const ts = cur.statusChangedAt + ORDER_TICK.DELIVERING_TO_DELIVERED;
      cur = {
        ...cur, status: 'delivered', statusChangedAt: ts,
        timeline: [...cur.timeline, ['已送达', ts]],
      };
      pushMsg({ id: genId('m'), kind: 'notice', title: '订单已送达', sub: '您的订单已送达,记得及时取餐', ts, icon: 'delivered', orderId: cur.id });
    } else if (cur.status === 'refunding' && cur.refund && now - (cur.refund.timeline[cur.refund.timeline.length - 1]?.[1] ?? cur.statusChangedAt) >= ORDER_TICK.REFUND_PROCESSING_TO_DONE) {
      const ts = (cur.refund.timeline[cur.refund.timeline.length - 1]?.[1] ?? cur.statusChangedAt) + ORDER_TICK.REFUND_PROCESSING_TO_DONE;
      cur = {
        ...cur, status: 'refunded', statusChangedAt: ts,
        refund: { ...cur.refund, status: 'done', timeline: [...cur.refund.timeline, ['打款成功', ts]] },
        timeline: [...cur.timeline, ['退款成功', ts]],
      };
    } else break;
  }
  return cur;
}

export const useTbsgStore = createAppStoreWithActions<TbsgState, TbsgActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    // ---------- 搜索 ----------
    submitSearch: (q) => {
      const w = q.trim();
      if (!w) return;
      set((s) => ({ searchHistory: [w, ...s.searchHistory.filter((x) => x !== w)].slice(0, 10) }));
    },
    clearSearchHistory: () => set({ searchHistory: [] }),

    // ---------- 购物车 ----------
    addToCart: (itemId, skuDesc, unitPrice, qty = 1) => {
      const item = get().items.find((i) => i.id === itemId);
      if (!item) return;
      set((s) => {
        const existing = s.cart.find((l) => l.itemId === itemId && l.skuDesc === skuDesc);
        if (existing) {
          return { cart: s.cart.map((l) => (l.id === existing.id ? { ...l, qty: l.qty + qty } : l)) };
        }
        const line: TbCartLine = {
          id: genId('c'), shopId: item.shopId, itemId, skuDesc,
          qty, price: unitPrice, selected: false,
        };
        return { cart: [...s.cart, line] };
      });
    },
    changeCartQty: (lineId, delta) =>
      set((s) => ({
        cart: s.cart
          .map((l) => (l.id === lineId ? { ...l, qty: l.qty + delta } : l))
          .filter((l) => l.qty > 0),
      })),
    toggleCartSelect: (lineId, shopId) =>
      set((s) => {
        if (shopId) {
          const shopLines = s.cart.filter((l) => l.shopId === shopId);
          const allSel = shopLines.every((l) => l.selected);
          return { cart: s.cart.map((l) => (l.shopId === shopId ? { ...l, selected: !allSel } : l)) };
        }
        return { cart: s.cart.map((l) => (l.id === lineId ? { ...l, selected: !l.selected } : l)) };
      }),
    toggleCartSelectAll: (value) => set((s) => ({ cart: s.cart.map((l) => ({ ...l, selected: value })) })),
    removeCartLines: (lineIds) => set((s) => ({ cart: s.cart.filter((l) => !lineIds.includes(l.id)) })),
    clearShopCart: (shopId) => set((s) => ({ cart: s.cart.filter((l) => l.shopId !== shopId) })),

    // ---------- 收藏/足迹 ----------
    toggleFavorite: (shopId) =>
      set((s) => ({
        favorites: s.favorites.includes(shopId)
          ? s.favorites.filter((x) => x !== shopId)
          : [shopId, ...s.favorites],
      })),
    touchRecentShop: (shopId) =>
      set((s) => ({ recentShops: [shopId, ...s.recentShops.filter((x) => x !== shopId)].slice(0, 10) })),

    // ---------- 券 ----------
    claimCoupon: (couponId) =>
      set((s) => ({
        coupons: s.coupons.map((c) => (c.id === couponId && c.status === 'unclaimed' ? { ...c, status: 'claimed' } : c)),
      })),
    claimShopCoupon: (shopId) =>
      set((s) => {
        const shop = s.shops.find((x) => x.id === shopId);
        if (!shop || shop.shopCoupon.claimed) return {};
        const c: TbCoupon = {
          id: shop.shopCoupon.id, name: `${shop.shopCoupon.name}·${shop.name}`,
          type: 'shop', amount: shop.shopCoupon.amount, threshold: shop.shopCoupon.threshold,
          expireAt: TimeService.now() + 7 * 24 * 3600_000, status: 'claimed',
          burstable: false, scope: `仅${shop.fullName}可用`, shopId,
        };
        return {
          shops: s.shops.map((x) => (x.id === shopId ? { ...x, shopCoupon: { ...x.shopCoupon, claimed: true } } : x)),
          coupons: [...s.coupons, c],
          favorites: s.favorites.includes(shopId) ? s.favorites : [shopId, ...s.favorites],
        };
      }),
    claimNightCoupons: () =>
      set((s) => ({
        coupons: s.coupons.map((c) => (c.id.startsWith('night') ? { ...c, status: c.status === 'unclaimed' ? 'claimed' : c.status } : c)),
      })),
    burstDaily: () => {
      if (get().burstUsedToday) return;
      const amounts = [3, 5, 8, 12, 18.8];
      const amount = amounts[TimeService.now() % amounts.length];
      const c: TbCoupon = {
        id: genId('burst'), name: '天天必爆红包', type: 'burst', amount,
        threshold: Math.max(3, Math.round(amount * 2.5)),
        expireAt: TimeService.now() + 24 * 3600_000, status: 'claimed',
        burstable: true, scope: '全平台外卖商家可用',
      };
      set((s) => ({ coupons: [c, ...s.coupons], burstUsedToday: true }));
    },
    buyFoodCard: () =>
      set((s) => (s.foodCard.owned ? {} : { foodCard: { owned: true, count: 12 } })),

    // ---------- 结算 ----------
    beginCheckout: (shopId, mode) =>
      set((s) => {
        const lines = shopId
          ? s.cart.filter((l) => l.shopId === shopId)
          : s.cart.filter((l) => l.selected);
        const byShop = new Map<string, TbCartLine[]>();
        for (const l of lines) {
          byShop.set(l.shopId, [...(byShop.get(l.shopId) ?? []), l]);
        }
        const groups = [...byShop.entries()].map(([sid, ls]) => ({ shopId: sid, lines: ls }));
        if (!groups.length) return {};
        const subtotal0 = groups[0].lines.reduce((a, l) => a + cents(l.price) * l.qty, 0) / 100;
        const best = s.coupons
          .filter((c) => (c.type === 'platform' || c.type === 'burst') && c.status === 'claimed' && subtotal0 >= c.threshold)
          .sort((a, b) => b.amount - a.amount)[0];
        return {
          checkoutDraft: {
            draftOrderId: genId('o'),
            shopGroups: groups,
            mode,
            fromCart: !shopId,
            platformCouponId: best?.id ?? null,
            shopCouponIds: {},
            remark: s.settings.defaultRemark,
            tableware: s.settings.alwaysTableware ? '需要餐具,商家依据餐量提供' : null,
            scheduled: null,
            vas: { rush: false, latePay: false },
          },
        };
      }),
    setCheckoutCoupon: (kind, couponId, shopId) =>
      set((s) => {
        if (!s.checkoutDraft) return {};
        if (kind === 'platform') return { checkoutDraft: { ...s.checkoutDraft, platformCouponId: couponId } };
        const sid = shopId ?? s.checkoutDraft.shopGroups[0]?.shopId;
        const next = { ...s.checkoutDraft.shopCouponIds };
        if (couponId) next[sid] = couponId;
        else delete next[sid];
        return { checkoutDraft: { ...s.checkoutDraft, shopCouponIds: next } };
      }),
    setCheckoutField: (patch) =>
      set((s) => (s.checkoutDraft ? { checkoutDraft: { ...s.checkoutDraft, ...patch } } : {})),
    setCurrentAddress: (addressId) => set({ currentAddressId: addressId }),
    setLocationPoi: (poi) => set({ locationPoi: poi }),
    setCity: (city) => set({ city }),
    setRoute: (route) => set({ route }),
    setRefundDraft: (patch) => set((s) => ({ refundDraft: { ...s.refundDraft, ...patch } })),

    payCheckout: () => {
      const created = buildOrdersFromDraft(get(), 'preparing');
      if (!created) return null;
      set(created.patch);
      return created.firstId;
    },
    abandonPay: () => {
      const created = buildOrdersFromDraft(get(), 'unpaid');
      if (!created) return null;
      set(created.patch);
      return created.firstId;
    },

    // ---------- 订单 ----------
    tickOrders: () => {
      const now = TimeService.now();
      const newMsgs: TbMessage[] = [];
      const next = get().orders.map((o) => advanceOrder(o, now, (m) => newMsgs.push(m)));
      const changed = next.some((o, i) => o !== get().orders[i]);
      if (changed || newMsgs.length) {
        set((s) => ({ orders: next, messages: [...newMsgs, ...s.messages] }));
      }
    },
    payUnpaidOrder: (orderId) => {
      const now = TimeService.now();
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId && o.status === 'unpaid'
            ? {
              ...o, status: 'preparing', statusChangedAt: now,
              timeline: [...o.timeline, ['支付成功,商家接单中', now]],
            }
            : o,
        ),
        coupons: s.coupons.map((c) => {
          const o = s.orders.find((x) => x.id === orderId);
          return o?.couponIds?.includes(c.id) ? { ...c, status: 'used' } : c;
        }),
      }));
    },
    cancelOrder: (orderId, reason) => {
      const now = TimeService.now();
      set((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== orderId || !['unpaid', 'preparing', 'delivering'].includes(o.status)) return o;
          const paid = o.status !== 'unpaid';
          return {
            ...o, status: 'canceled', statusChangedAt: now, cancelReason: reason ?? '你取消了订单',
            refund: paid
              ? {
                status: 'done', amount: o.totalPaid, couponsBack: o.couponIds?.length ?? 0,
                timeline: [['订单已取消', now], ['打款成功', now + 1000]],
              }
              : undefined,
            timeline: [...o.timeline, ['订单已取消', now]],
          };
        }),
        coupons: s.coupons.map((c) => {
          const o = s.orders.find((x) => x.id === orderId);
          return o?.couponIds?.includes(c.id) && o.status !== 'unpaid'
            ? { ...c, status: 'refunded' } : c;
        }),
      }));
    },
    submitCancelReason: (orderId, reason) =>
      set((s) => ({
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, cancelReason: reason } : o)),
      })),
    reorder: (orderId) => {
      // qa:Q6 再买一单:原商品加回该店购物车
      const o = get().orders.find((x) => x.id === orderId);
      if (!o) return;
      set((s) => {
        let cart = [...s.cart];
        for (const li of o.lines) {
          const item = s.items.find((i) => i.id === li.itemId);
          if (!item) continue;
          const existing = cart.find((l) => l.itemId === li.itemId && l.skuDesc === li.skuDesc);
          if (existing) {
            cart = cart.map((l) => (l.id === existing.id ? { ...l, qty: l.qty + li.qty } : l));
          } else {
            cart.push({
              id: genId('c'), shopId: o.shopId, itemId: li.itemId,
              skuDesc: li.skuDesc, qty: li.qty, price: li.price, selected: false,
            });
          }
        }
        return { cart, recentShops: [o.shopId, ...s.recentShops.filter((x) => x !== o.shopId)].slice(0, 10) };
      });
    },
    claimOrderBeans: (orderId) =>
      set((s) => {
        const o = s.orders.find((x) => x.id === orderId);
        if (!o || o.beansClaimed) return {};
        return {
          orders: s.orders.map((x) => (x.id === orderId ? { ...x, beansClaimed: true } : x)),
          user: { ...s.user, beans: s.user.beans + ORDER_REWARD_BEANS },
        };
      }),

    // ---------- 退款 ----------
    submitRefund: (orderId, reason, subReason, lineIdxs, desc) => {
      const now = TimeService.now();
      set((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o;
          const all = lineIdxs.length >= o.lines.length;
          const amount = all
            ? o.totalPaid
            : yuan(lineIdxs.reduce((a, i) => a + cents(o.lines[i]?.price ?? 0) * (o.lines[i]?.qty ?? 0), 0));
          return {
            ...o, status: 'refunding', statusChangedAt: now, refundReason: reason,
            refund: {
              status: 'processing', amount, couponsBack: all ? (o.couponIds?.length ?? 0) : 0,
              reason, subReason, desc, lineIds: lineIdxs,
              timeline: [['申请已提交', now], ['商家处理中', now + 1000]],
            },
            timeline: [...o.timeline, ['申请售后', now]],
          };
        }),
      }));
    },
    withdrawRefund: (orderId) =>
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId && o.status === 'refunding'
            ? { ...o, status: 'delivered', statusChangedAt: TimeService.now(), refund: undefined, refundReason: undefined }
            : o,
        ),
      })),

    // ---------- 评价 ----------
    submitReview: (orderId, stars, riderGood, text, images, anonymous) => {
      const now = TimeService.now();
      const o = get().orders.find((x) => x.id === orderId);
      if (!o) return;
      const qualifies = text.length >= 20 && images.length >= 1;
      set((s) => ({
        orders: s.orders.map((x) => (x.id === orderId ? { ...x, reviewed: true } : x)),
        myReviews: [
          { id: genId('myrv'), orderId, shopId: o.shopId, stars, riderGood, text, images, anonymous, ts: now },
          ...s.myReviews,
        ],
        reviews: {
          ...s.reviews,
          [o.shopId]: [
            {
              id: genId('rv'), userId: s.user.id,
              userName: anonymous ? '匿名用户' : s.user.nickname,
              avatar: s.user.avatar, stars, tasteStars: stars, packStars: stars,
              ts: now, text, itemName: o.lines[0]?.name ?? '', images,
              reply: null, hasContent: text.length > 0,
            },
            ...(s.reviews[o.shopId] ?? []),
          ],
        },
        user: { ...s.user, beans: s.user.beans + (qualifies ? REVIEW_REWARD_BEANS : 5) },
      }));
    },

    // ---------- 消息/聊天 ----------
    sendChat: (chatKey, text) => {
      const now = TimeService.now();
      const me: TbChatMsg = { id: genId('cm'), from: 'me', text, ts: now };
      const replyText = chatKey.startsWith('shop:')
        ? shopAutoReply(text)
        : chatKey.startsWith('rider:')
          ? riderAutoReply(text)
          : serviceAutoReply(text);
      const peer: TbChatMsg = { id: genId('cm'), from: 'peer', text: replyText, ts: now + 1500 };
      set((s) => ({
        chats: { ...s.chats, [chatKey]: [...(s.chats[chatKey] ?? []), me, peer] },
      }));
    },
    markAllRead: () =>
      set((s) => ({ messages: s.messages.map((m) => (m.unread ? { ...m, unread: 0 } : m)) })),
    markMessageRead: (msgId) =>
      set((s) => ({ messages: s.messages.map((m) => (m.id === msgId ? { ...m, unread: 0 } : m)) })),
    dismissBanner: (msgId) =>
      set((s) => ({ messages: s.messages.filter((m) => m.id !== msgId) })),
    clearMessages: () =>
      set((s) => ({ messages: s.messages.filter((m) => m.kind === 'banner') })),

    // ---------- 地址 ----------
    saveAddress: (addr) =>
      set((s) => {
        if (addr.id) {
          return { addresses: s.addresses.map((a) => (a.id === addr.id ? { ...a, ...addr, id: addr.id } : a)) };
        }
        const na = { ...addr, id: genId('a'), isDefault: false, pinned: false };
        return { addresses: [...s.addresses, na] };
      }),
    deleteAddress: (id) =>
      set((s) => ({
        addresses: s.addresses.filter((a) => a.id !== id),
        currentAddressId: s.currentAddressId === id ? (s.addresses.find((a) => a.id !== id)?.id ?? '') : s.currentAddressId,
      })),
    pinAddress: (id) =>
      set((s) => {
        const target = s.addresses.find((a) => a.id === id);
        if (!target) return {};
        return { addresses: [target, ...s.addresses.filter((a) => a.id !== id)] };
      }),

    // ---------- 设置 ----------
    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    updateProfile: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
    clearCache: () => set((s) => ({ settings: { ...s.settings, cacheMB: 0 } })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        // route 为运行时镜像,刷新即由导航 effect 重置,不持久化
        if (typeof v !== 'function' && k !== 'route') result[k] = v;
      }
      return result as Partial<TbsgState>;
    },
  },
);

/** 从 checkoutDraft 生成订单(qa:Q7 多店拆单;status=preparing 已支付 / unpaid 待支付) */
function buildOrdersFromDraft(
  s: TbsgState & TbsgActions,
  status: 'preparing' | 'unpaid',
): { patch: Partial<TbsgState>; firstId: string } | null {
  const draft = s.checkoutDraft;
  if (!draft || !draft.shopGroups.length) return null;
  const now = TimeService.now();
  const usedCouponIds: string[] = [];
  const orders: TbOrder[] = draft.shopGroups.map((g, gi) => {
    const orderId = gi === 0 ? draft.draftOrderId : genId('o');
    const shop = s.shops.find((x) => x.id === g.shopId)!;
    const platformCoupon = gi === 0 && draft.platformCouponId
      ? s.coupons.find((c) => c.id === draft.platformCouponId) ?? null : null;
    const shopCouponId = draft.shopCouponIds[g.shopId];
    const shopCoupon = shopCouponId ? s.coupons.find((c) => c.id === shopCouponId) ?? null : null;
    const vasFee = (draft.vas.rush ? 2 : 0) + (draft.vas.latePay ? 1.21 : 0);
    const am = computeGroupAmounts(shop, g.lines, { mode: draft.mode, platformCoupon, shopCoupon, vasFee });
    const couponIds = [platformCoupon?.id, shopCoupon?.id].filter(Boolean) as string[];
    if (status === 'preparing') usedCouponIds.push(...couponIds);
    return {
      id: orderId,
      shopId: g.shopId,
      status,
      createdAt: now,
      statusChangedAt: now,
      lines: g.lines.map((l) => {
        const item = s.items.find((i) => i.id === l.itemId)!;
        return {
          itemId: l.itemId, name: item.name, image: item.image,
          skuDesc: l.skuDesc, qty: l.qty, price: l.price,
          origPrice: item.origPrice ?? l.price,
        };
      }),
      packFee: am.packFee,
      deliveryFee: am.deliveryFee,
      deliveryFeeOrig: am.deliveryFeeOrig,
      couponDiscount: yuan(cents(am.platformCouponOff) + cents(am.shopCouponOff)),
      totalPaid: am.total,
      totalDiscount: am.totalDiscount,
      mode: draft.mode,
      remark: draft.remark || null,
      tableware: draft.tableware,
      reviewed: false,
      timeline: status === 'preparing'
        ? [['下单', now], ['支付成功,商家接单中', now]] as [string, number][]
        : [['下单(待支付)', now]] as [string, number][],
      addressId: s.currentAddressId,
      couponIds,
      beansClaimed: false,
    };
  });
  const removedLineIds = new Set(draft.shopGroups.flatMap((g) => g.lines.map((l) => l.id)));
  return {
    firstId: orders[0].id,
    patch: {
      orders: [...orders, ...s.orders],
      cart: s.cart.filter((l) => !removedLineIds.has(l.id)),
      coupons: s.coupons.map((c) => (usedCouponIds.includes(c.id) ? { ...c, status: 'used' } : c)),
      checkoutDraft: null,
    },
  };
}
