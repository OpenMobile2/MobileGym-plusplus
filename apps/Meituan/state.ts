import { createAppStoreWithActions } from '@/os/createAppStore';
import { now as simNow, fromTimestamp } from '@/os/TimeService';
import { MEITUAN_CONFIG } from './data';

interface CartItem {
  dishId: string;
  name: string;
  price: number;
  count: number;
}

interface MeituanOrder {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered';
  address: string;
  time: string;
}

interface MeituanState {
  cart: {
    restaurantId: string | null;
    items: CartItem[];
  };
  orders: MeituanOrder[];
  user: typeof MEITUAN_CONFIG.user;
}

interface MeituanActions {
  addToCart: (restaurantId: string, dish: { id: string; name: string; price: number }) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  placeOrder: (restaurantId: string, restaurantName: string, deliveryFee: number) => string;
}

const initialState: MeituanState = {
  cart: { restaurantId: null, items: [] },
  orders: MEITUAN_CONFIG.orders.map(o => ({
    id: o.id,
    restaurantId: '',
    restaurantName: o.restaurantName,
    items: o.items.map(i => ({ dishId: i.name, name: i.name, price: i.price / 1, count: i.count })),
    total: o.total,
    deliveryFee: o.deliveryFee,
    status: o.status as MeituanOrder['status'],
    address: MEITUAN_CONFIG.user.address,
    time: o.time,
  })),
  user: MEITUAN_CONFIG.user,
};

export const useMeituanStore = createAppStoreWithActions<MeituanState, MeituanActions>(
  'meituan',
  initialState,
  (set, get) => ({
    addToCart: (restaurantId, dish) => {
      set((s) => {
        const items = s.cart.restaurantId === restaurantId ? [...s.cart.items] : [];
        const existing = items.find(i => i.dishId === dish.id);
        if (existing) {
          existing.count += 1;
        } else {
          items.push({ dishId: dish.id, name: dish.name, price: dish.price, count: 1 });
        }
        return { cart: { restaurantId, items } };
      });
    },
    removeFromCart: (dishId) => {
      set((s) => {
        const items = s.cart.items
          .map(i => i.dishId === dishId ? { ...i, count: i.count - 1 } : i)
          .filter(i => i.count > 0);
        return { cart: { ...s.cart, items } };
      });
    },
    clearCart: () => {
      set(() => ({ cart: { restaurantId: null, items: [] } }));
    },
    placeOrder: (restaurantId, restaurantName, deliveryFee) => {
      const { cart } = get();
      const total = cart.items.reduce((sum, i) => sum + i.price * i.count, 0) + deliveryFee;
      const orderId = `o${Date.now()}`;
      const newOrder: MeituanOrder = {
        id: orderId,
        restaurantId,
        restaurantName,
        items: [...cart.items],
        total,
        deliveryFee,
        status: 'preparing',
        address: get().user.address,
        time: fromTimestamp(simNow()).toLocaleString('zh-CN'),
      };
      set((s) => ({
        orders: [newOrder, ...s.orders],
        cart: { restaurantId: null, items: [] },
      }));
      return orderId;
    },
  }),
);
