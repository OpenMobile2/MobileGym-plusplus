import { createAppStoreWithActions } from '@/os/createAppStore';
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
  cart: [{ productId: 'coconut-latte', quantity: 1, checked: true, spec: 'coffee.default' }],
  instantCart: [{ productId: 'instant-01', quantity: 1, checked: true, spec: 'instant.standard' }],
  mode: 'pickup',
  menuTab: 'classic',
  category: 'popular',
  selections: { size: 'large', temperature: 'iced', sweetness: 'noSugar', orderTab: 'all', couponTab: 'drink' },
  inputs: { search: '', note: '', password: '', service: '', redeem: '' },
  flags: { cartOpen: false, clearAsk: false, memberAgree: false, storeMute: false, favorite: false },
  favorites: [],
  memberActive: false,
  toast: null,
};

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
    addToCart: (productId, quantity = 1) => set((state) => {
      const found = state.cart.find((item) => item.productId === productId);
      if (found) return { cart: state.cart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item) };
      return { cart: [...state.cart, { productId, quantity, checked: true, spec: 'coffee.default' }] };
    }),
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
      const first = get().cart[0];
      const productId = first?.productId ?? 'orange-c';
      const product = get().products.find((item) => item.id === productId);
      const order: Order = { id, status: 'unpaid', productId, quantity: first?.quantity ?? 1, amount: product?.price ?? 12.9, createdAt: '2026-07-13 13:30' };
      set((state) => ({ orders: [order, ...state.orders] }));
      return id;
    },
    setOrderStatus: (id, status) => set((state) => ({ orders: state.orders.map((order) => order.id === id ? { ...order, status } : order) })),
    toggleFavorite: (productId) => set((state) => ({ favorites: state.favorites.includes(productId) ? state.favorites.filter((id) => id !== productId) : [...state.favorites, productId] })),
    claimCoupon: (couponId) => set((state) => ({ coupons: state.coupons.map((coupon) => coupon.id === couponId ? { ...coupon, claimed: true } : coupon) })),
    saveAddress: (address: Address) => set((state) => ({ addresses: [address, ...state.addresses.filter((item) => item.id !== address.id)] })),
    deleteAddress: (id) => set((state) => ({ addresses: state.addresses.filter((item) => item.id !== id) })),
    activateMember: () => set({ memberActive: true }),
  }),
  { persistName: `${manifest.id}_v${DATA_VERSION}` },
);
