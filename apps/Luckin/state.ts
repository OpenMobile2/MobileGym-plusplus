import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { ADDRESSES, COUPONS, INSTANT_PRODUCTS, ORDERS, PRODUCTS, STORES } from './data/defaults';
import type { Address, LuckinActions, LuckinState, Order } from './types';

const initialState: LuckinState = {
  products: PRODUCTS,
  instantProducts: INSTANT_PRODUCTS,
  stores: STORES,
  addresses: ADDRESSES,
  coupons: COUPONS,
  orders: ORDERS,
  cart: [],
  directPurchase: null,
  instantCart: [{ productId: 'instant-01', quantity: 1, checked: true, spec: 'instant.standard' }],
  mode: 'pickup',
  menuTab: 'classic',
  category: 'popular',
  selections: { size: 'large', temperature: 'iced', sweetness: 'noSugar', orderTab: 'all', couponTab: 'drink' },
  inputs: { search: '', note: '', password: '', service: '', redeem: '' },
  flags: { cartOpen: false, clearAsk: false, memberAgree: false, storeMute: false, favorite: false },
  favorites: [],
  memberActive: false,
  memberPlan: null,
  memberSince: null,
  savedFlavors: {},
  toast: null,
};

const formatSystemTime = (includeTime: boolean) => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
}).format(TimeService.fromTimestamp(TimeService.now())).replaceAll('/', '-');

export const useLuckinStore = createAppStoreWithActions<LuckinState, LuckinActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    setMode: (mode) => set({ mode }),
    setMenuTab: (menuTab) => set({ menuTab }),
    setCategory: (category) => set({ category }),
    setSelection: (key, value) => set((state) => ({ selections: { ...state.selections, [key]: value } })),
    setInput: (key, value) => set((state) => ({ inputs: { ...state.inputs, [key]: value } })),
    toggleFlag: (key) => set((state) => ({ flags: { ...state.flags, [key]: !state.flags[key] } })),
    showToast: (toast) => set({ toast }),
    clearToast: () => set({ toast: null }),
    addToCart: (productId, quantity = 1, spec = 'coffee.default') => set((state) => {
      const found = state.cart.find((item) => item.productId === productId);
      if (found) return { cart: state.cart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity, spec } : item) };
      return { cart: [...state.cart, { productId, quantity, checked: true, spec }] };
    }),
    // 立即购买是独立结算：只提交当前商品，不继承购物车里的历史商品。
    buyNow: (productId, quantity, spec) => set({ directPurchase: { productId, quantity, checked: true, spec } }),
    clearDirectPurchase: () => set({ directPurchase: null }),
    addToInstantCart: (productId) => set((state) => {
      const found = state.instantCart.find((item) => item.productId === productId);
      if (found) return { instantCart: state.instantCart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item) };
      return { instantCart: [...state.instantCart, { productId, quantity: 1, checked: true, spec: 'instant.standard' }] };
    }),
    changeCartQty: (productId, delta, instant = false) => set((state) => {
      const key = instant ? 'instantCart' : 'cart';
      const list = state[key].map((item) => item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter((item) => item.quantity > 0);
      return { [key]: list } as Pick<LuckinState, typeof key>;
    }),
    toggleCartItem: (productId) => set((state) => ({ cart: state.cart.map((item) => item.productId === productId ? { ...item, checked: !item.checked } : item) })),
    clearCart: () => set({ cart: [] }),
    createOrder: () => {
      const id = `o-local-${get().orders.length + 1}`;
      const state = get();
      const items = (state.directPurchase ? [state.directPurchase] : state.cart.filter((item) => item.checked)).map((item) => ({ ...item }));
      const first = items[0];
      const productId = first?.productId ?? 'orange-c';
      const subtotal = items.reduce((sum, item) => {
        const price = state.selections.exchangeProduct === item.productId
          ? 6.9
          : (state.products.find((product) => product.id === item.productId)?.price ?? 0);
        return sum + price * item.quantity;
      }, 0);
      const coupon = state.coupons.find((item) => item.id === state.selections.orderCoupon && item.claimed);
      const thresholdMatch = coupon?.threshold.match(/(?:满|满\s*)(\d+(?:\.\d+)?)/);
      const minimum = thresholdMatch ? Number(thresholdMatch[1]) : 0;
      const validCoupon = coupon && subtotal >= minimum ? coupon : undefined;
      const discount = validCoupon ? Math.min(validCoupon.amount, subtotal) : 0;
      const defaultAddress = state.addresses.find((address) => address.isDefault) ?? state.addresses[0];
      const order: Order = {
        id,
        status: 'unpaid',
        productId,
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        amount: Math.round(Math.max(0, subtotal - discount) * 10) / 10,
        createdAt: formatSystemTime(true),
        items,
        fulfillmentMode: state.mode,
        storeId: state.selections.storeId ?? state.stores[0]?.id,
        addressId: state.mode === 'delivery' ? (state.selections.addressId ?? defaultAddress?.id) : undefined,
        couponId: validCoupon?.id,
        note: state.inputs.note,
        paymentMethod: state.selections.payment ?? 'wechat',
      };
      const purchased = new Set(items.map((item) => item.productId));
      set((current) => ({
        orders: [order, ...current.orders],
        cart: current.directPurchase ? current.cart : current.cart.filter((item) => !purchased.has(item.productId)),
        directPurchase: null,
      }));
      return id;
    },
    setOrderStatus: (id, status) => set((state) => ({ orders: state.orders.map((order) => order.id === id ? { ...order, status } : order) })),
    toggleFavorite: (productId) => set((state) => ({ favorites: state.favorites.includes(productId) ? state.favorites.filter((id) => id !== productId) : [...state.favorites, productId] })),
    claimCoupon: (couponId) => set((state) => ({ coupons: state.coupons.map((coupon) => coupon.id === couponId ? { ...coupon, claimed: true } : coupon) })),
    inflateCoupon: (couponId) => set((state) => ({
      coupons: state.coupons.map((coupon) =>
        coupon.id === couponId
          ? { ...coupon, amount: Math.round(Math.min(13.9, coupon.amount + 3) * 10) / 10, claimed: true }
          : coupon,
      ),
    })),
    saveAddress: (address: Address) => set((state) => ({
      addresses: [
        address,
        ...state.addresses
          .filter((item) => item.id !== address.id)
          .map((item) => address.isDefault ? { ...item, isDefault: false } : item),
      ],
      selections: { ...state.selections, addressId: address.id },
    })),
    deleteAddress: (id) => set((state) => ({ addresses: state.addresses.filter((item) => item.id !== id) })),
    activateMember: () => set({ memberActive: true }),
    purchaseMember: (memberPlan) => set({
      memberActive: true,
      memberPlan,
      memberSince: formatSystemTime(false),
    }),
    saveFlavor: (productId, spec) => set((state) => ({ savedFlavors: { ...state.savedFlavors, [productId]: spec } })),
  }),
  { persistName: `${manifest.id}_v${DATA_VERSION}` },
);
