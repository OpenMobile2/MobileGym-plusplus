import { createAppStoreWithActions, readPersistedAppState } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { DIANPING_CONFIG } from './data';
import { DATA_VERSION } from './constants';
import { manifest } from './manifest';

// 版本化重置:zustand persist 默认只做浅合并、从不比对版本,导致改了种子数据后
// 老浏览器仍读旧持久化(如残留的"111"评价、被改成别的城市)。这里在 create 之前
// 比对持久化的 _dataVersion,不一致就清空该 key,让 store 从 initialState 全新播种。
try {
  if (typeof localStorage !== 'undefined') {
    const persisted = readPersistedAppState(manifest.id);
    if (persisted && persisted._dataVersion !== DATA_VERSION) {
      localStorage.removeItem(manifest.id);
    }
  }
} catch {
  /* ignore storage errors */
}
import type {
  BrowseEntry,
  DianpingActions,
  DianpingState,
  DpOrder,
  Shop,
} from './types';

function cloneShops(): Shop[] {
  return DIANPING_CONFIG.shops.map((s) => ({
    ...s,
    dishes: s.dishes.map((d) => ({ ...d })),
    reviews: s.reviews.map((r) => ({ ...r })),
    deals: s.deals.map((d) => ({ ...d })),
    tags: [...s.tags],
    foodTabs: [...s.foodTabs],
  }));
}

function genCode() {
  return String(Math.floor(100000000000 + (TimeService.now() % 899999999999)));
}

const initialState: DianpingState = {
  _dataVersion: DATA_VERSION,
  city: DIANPING_CONFIG.city,
  shops: cloneShops(),
  notes: DIANPING_CONFIG.notes.map((n) => ({ ...n })),
  favoriteShopIds: [...DIANPING_CONFIG.favoriteShopIds],
  favoriteDishIds: [...DIANPING_CONFIG.favoriteDishIds],
  browseHistory: [
    { id: 'browse_seed_1', kind: 'shop', refId: 'wangheli', title: '王和李·海鲜火锅大排档', subtitle: '仙林万达店', ts: 1787068800000 },
    { id: 'browse_seed_2', kind: 'shop', refId: 'luckin', title: '瑞幸咖啡', subtitle: '南大仙林店', ts: 1786982400000 },
  ],
  orders: [...(DIANPING_CONFIG.orders ?? [])],
  searchHistory: [...DIANPING_CONFIG.searchHistory],
  checkins: [
    { shopId: 'wangheli', ts: 1785904800000, mood: 'happy', note: '和朋友的火锅局' },
    { shopId: 'luckin', ts: 1785309600000, mood: 'charge', note: '今年第1次喝咖啡' },
  ],
  checkinsViewed: false,
  userReviews: [...(DIANPING_CONFIG.userReviews ?? [])],
  userProfile: { ...DIANPING_CONFIG.userProfile },
  msgUnread: { system: 2, activity: 1, likes: 3, comment: 1, fans: 0 },
  systemMessages: [
    {
      id: 'sys_seed_1',
      title: '退款成功',
      body: '你的“双人烤肉套餐”退款 ¥128 已按原路退回，预计1-3个工作日到账。',
      ts: 1753121000000,
    },
    {
      id: 'sys_seed_2',
      title: '购买成功',
      body: '你购买的“100元代金券”已到账，可到店出示券码使用。',
      ts: 1753720100000,
    },
  ],
  reviewDrafts: [
    { id: 'draft_seed_1', shopId: 'pangpang', shopName: 'PangPang·熊(仙林万达店)', score: 5, body: '蛋糕造型很可爱，等待补充图片。', ts: 1786982400000 },
  ],
  favoriteDealIds: [],
  draftReview: null,
  pendingCheckout: null,
  lastPaidOrderId: null,
  _temp: { toast: '', toastSeq: 0 },
};

export const useDianpingStore = createAppStoreWithActions<DianpingState, DianpingActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    showToast: (msg) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),

    setCity: (city) => set(() => ({ city })),

    toggleFavoriteShop: (shopId) =>
      set((s) => {
        const has = s.favoriteShopIds.includes(shopId);
        return {
          favoriteShopIds: has
            ? s.favoriteShopIds.filter((id) => id !== shopId)
            : [shopId, ...s.favoriteShopIds],
        };
      }),

    toggleFavoriteDish: (shopId, dishId) =>
      set((s) => {
        const key = `${shopId}:${dishId}`;
        const has = s.favoriteDishIds.includes(key);
        return {
          favoriteDishIds: has
            ? s.favoriteDishIds.filter((id) => id !== key)
            : [key, ...s.favoriteDishIds],
        };
      }),

    toggleDishLike: (shopId, dishId) =>
      set((s) => ({
        shops: s.shops.map((shop) => {
          if (shop.id !== shopId) return shop;
          return {
            ...shop,
            dishes: shop.dishes.map((d) => {
              if (d.id !== dishId) return d;
              const liked = !d.liked;
              return { ...d, liked, recommendCount: d.recommendCount + (liked ? 1 : -1) };
            }),
          };
        }),
      })),

    recordBrowseShop: (shopId) => {
      const shop = get().shops.find((x) => x.id === shopId);
      if (!shop) return;
      const entry: BrowseEntry = {
        id: `bh_${shopId}_${TimeService.now()}`,
        kind: 'shop',
        refId: shopId,
        title: shop.name,
        subtitle: `${shop.score}分 · ¥${shop.avgPrice}/人`,
        ts: TimeService.now(),
      };
      set((s) => ({
        browseHistory: [
          entry,
          ...s.browseHistory.filter((e) => !(e.kind === 'shop' && e.refId === shopId)),
        ].slice(0, 30),
      }));
    },

    clearBrowseHistory: () => set(() => ({ browseHistory: [] })),

    addSearchHistory: (q) => {
      const t = q.trim();
      if (!t) return;
      set((s) => ({
        searchHistory: [t, ...s.searchHistory.filter((x) => x !== t)].slice(0, 12),
      }));
    },

    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    setPendingCheckout: (p) =>
      set(() => ({
        pendingCheckout: p
          ? { couponId: null, ...p }
          : null,
      })),

    setCheckoutQty: (qty) =>
      set((s) => {
        if (!s.pendingCheckout) return {};
        const q = Math.max(1, Math.min(100, Math.floor(qty)));
        return { pendingCheckout: { ...s.pendingCheckout, qty: q } };
      }),

    selectPlatformCoupon: (couponId) =>
      set((s) => {
        if (!s.pendingCheckout) return {};
        const cur = s.pendingCheckout.couponId ?? null;
        const next = couponId && couponId === cur ? null : couponId;
        return { pendingCheckout: { ...s.pendingCheckout, couponId: next } };
      }),

    createPendingOrder: () => {
      const { pendingCheckout, shops } = get();
      if (!pendingCheckout) return null;
      const shop = shops.find((x) => x.id === pendingCheckout.shopId);
      const deal = shop?.deals.find((d) => d.id === pendingCheckout.dealId);
      if (!shop || !deal) return null;
      const id = `ord_${TimeService.now()}`;
      const gross = deal.price * pendingCheckout.qty;
      const couponOff =
        pendingCheckout.couponId === 'c_surprise' ? 1 : 0;
      const order: DpOrder = {
        id,
        shopId: shop.id,
        shopName: shop.name,
        dealId: deal.id,
        dealTitle: deal.title,
        unitPrice: deal.price,
        originPrice: deal.origin,
        qty: pendingCheckout.qty,
        payAmount: Number(Math.max(0.01, gross - couponOff).toFixed(2)),
        status: 'pending_pay',
        code: genCode(),
        createdAt: TimeService.now(),
        coverColor: shop.coverColor,
      };
      set((s) => ({
        orders: [order, ...s.orders],
        pendingCheckout: null,
        lastPaidOrderId: null,
      }));
      return id;
    },

    payOrder: (orderId, paymentMethod) =>
      set((s) => {
        const order = s.orders.find((o) => o.id === orderId);
        const sysMsg = order
          ? [
              {
                id: `sys_${TimeService.now()}_${s.systemMessages.length}`,
                title: '购买成功',
                body: `你购买的“${order.dealTitle}”已到账，可到店出示券码使用。`,
                ts: TimeService.now(),
              },
              ...s.systemMessages,
            ]
          : s.systemMessages;
        return {
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'usable' as const, paidAt: TimeService.now(), paymentMethod } : o,
          ),
          lastPaidOrderId: orderId,
          systemMessages: sysMsg,
          msgUnread: order ? { ...s.msgUnread, system: s.msgUnread.system + 1 } : s.msgUnread,
        };
      }),

    applyRefund: (orderId, reason) =>
      set((s) => {
        const order = s.orders.find((o) => o.id === orderId);
        const sysMsg = order
          ? [
              {
                id: `sys_${TimeService.now()}_${s.systemMessages.length}`,
                title: '退款申请已提交',
                body: `你的“${order.dealTitle}”退款申请正在处理中，退款原因：${reason}。`,
                ts: TimeService.now(),
              },
              ...s.systemMessages,
            ]
          : s.systemMessages;
        return {
          orders: s.orders.map((o) =>
            o.id === orderId && o.status === 'usable'
              ? { ...o, status: 'refunding' as const, refundReason: reason }
              : o,
          ),
          systemMessages: sysMsg,
          msgUnread: order ? { ...s.msgUnread, system: s.msgUnread.system + 1 } : s.msgUnread,
        };
      }),

    completeRefund: (orderId) =>
      set((s) => {
        const order = s.orders.find((o) => o.id === orderId);
        const sysMsg =
          order && order.status === 'refunding'
            ? [
                {
                  id: `sys_${TimeService.now()}_${s.systemMessages.length}`,
                  title: '退款成功',
                  body: `你的“${order.dealTitle}”退款 ¥${order.payAmount} 已按原路退回。`,
                  ts: TimeService.now(),
                },
                ...s.systemMessages,
              ]
            : s.systemMessages;
        return {
          orders: s.orders.map((o) =>
            o.id === orderId && o.status === 'refunding'
              ? { ...o, status: 'refunded' as const }
              : o,
          ),
          systemMessages: sysMsg,
          msgUnread:
            order && order.status === 'refunding'
              ? { ...s.msgUnread, system: s.msgUnread.system + 1 }
              : s.msgUnread,
        };
      }),

    setDraftReview: (d) => set(() => ({ draftReview: d })),

    publishReview: () => {
      const draft = get().draftReview;
      if (!draft || draft.score < 1) return;
      const shop = get().shops.find((x) => x.id === draft.shopId);
      if (!shop) return;
      const id = `ur_${TimeService.now()}`;
      const photos = draft.photos ?? [];
      const dishNames = draft.dishIds
        .map((did) => shop.dishes.find((d) => d.id === did)?.name)
        .filter((n): n is string => Boolean(n));
      const review = {
        id,
        userName: get().userProfile.nickname,
        score: draft.score,
        body: draft.body || '（无文字评价）',
        tags: draft.dishIds.length ? ['推荐菜'] : ['刚写的'],
        dateLabel: '刚刚',
        hasPhoto: photos.length > 0,
        photos,
        taste: draft.taste || draft.score,
        env: draft.env || draft.score,
        service: draft.service || draft.score,
        dishNames,
        avgPriceText: draft.avgPrice ? `¥${draft.avgPrice}/人` : undefined,
        fromUser: true,
      };
      set((s) => ({
        shops: s.shops.map((sh) =>
          sh.id !== draft.shopId
            ? sh
            : {
                ...sh,
                reviews: [review, ...sh.reviews],
                reviewCount: sh.reviewCount + 1,
              },
        ),
        userReviews: [
          {
            id,
            shopId: draft.shopId,
            shopName: shop.name,
            score: draft.score,
            body: review.body,
            createdAt: TimeService.now(),
            photos,
            taste: review.taste,
            env: review.env,
            service: review.service,
            avgPriceText: review.avgPriceText,
            dishNames,
          },
          ...s.userReviews,
        ],
        reviewDrafts: s.reviewDrafts.filter((x) => x.shopId !== draft.shopId),
        draftReview: null,
      }));
    },

    addCheckin: (shopId, mood, note) =>
      set((s) => ({
        checkins: [{ shopId, ts: TimeService.now(), mood, note }, ...s.checkins].slice(0, 50),
      })),

    recordCheckinsView: () => set(() => ({ checkinsViewed: true })),

    updateUserProfile: (patch) =>
      set((s) => ({ userProfile: { ...s.userProfile, ...patch } })),

    markMsgRead: (kind) =>
      set((s) => {
        if (kind === 'all') {
          return { msgUnread: { system: 0, activity: 0, likes: 0, comment: 0, fans: 0 } };
        }
        return { msgUnread: { ...s.msgUnread, [kind]: 0 } };
      }),

    pushSystemMessage: (title, body) =>
      set((s) => ({
        systemMessages: [
          { id: `sys_${TimeService.now()}_${s.systemMessages.length}`, title, body, ts: TimeService.now() },
          ...s.systemMessages,
        ],
        msgUnread: { ...s.msgUnread, system: s.msgUnread.system + 1 },
      })),

    saveReviewDraft: (d) =>
      set((s) => ({
        reviewDrafts: [
          { id: `dr_${TimeService.now()}`, ts: TimeService.now(), ...d },
          ...s.reviewDrafts.filter((x) => x.shopId !== d.shopId),
        ],
      })),

    deleteReviewDraft: (id) =>
      set((s) => ({ reviewDrafts: s.reviewDrafts.filter((x) => x.id !== id) })),

    toggleFavoriteDeal: (key) =>
      set((s) => ({
        favoriteDealIds: s.favoriteDealIds.includes(key)
          ? s.favoriteDealIds.filter((k) => k !== key)
          : [key, ...s.favoriteDealIds],
      })),
  }),
  {
    // 走查场景:每次刷新回到干净的种子演示状态。只持久化 _dataVersion,
    // 其余(订单/评价/打卡/浏览/收藏/草稿/系统消息/搜索历史等运行时·测试数据)
    // 刷新后都从 initialState 重新播种,不再累积测试数据。
    partialize: (s) => ({ _dataVersion: s._dataVersion }),
  },
);
