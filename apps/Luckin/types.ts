export type FulfillmentMode = 'pickup' | 'delivery';
export type MenuTab = 'classic' | 'daily99' | 'usual';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  price: number;
  originalPrice: number;
  color: string;
  badge?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  checked: boolean;
  spec: string;
}

export interface Order {
  id: string;
  status: 'unpaid' | 'making' | 'ready' | 'done';
  productId: string;
  quantity: number;
  amount: number;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  distance: string;
  open: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  tag: string;
  isDefault: boolean;
}

export interface Coupon {
  id: string;
  title: string;
  amount: number;
  threshold: string;
  expiry: string;
  kind: 'drink' | 'instant' | 'bought';
  claimed: boolean;
}

export interface LuckinState {
  products: Product[];
  instantProducts: Product[];
  stores: Store[];
  addresses: Address[];
  coupons: Coupon[];
  orders: Order[];
  cart: CartItem[];
  instantCart: CartItem[];
  mode: FulfillmentMode;
  menuTab: MenuTab;
  category: string;
  selections: Record<string, string>;
  inputs: Record<string, string>;
  flags: Record<string, boolean>;
  favorites: string[];
  memberActive: boolean;
  toast: string | null;
}

export interface LuckinActions {
  setMode: (mode: FulfillmentMode) => void;
  setMenuTab: (tab: MenuTab) => void;
  setCategory: (category: string) => void;
  setSelection: (key: string, value: string) => void;
  setInput: (key: string, value: string) => void;
  toggleFlag: (key: string) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  addToCart: (productId: string, quantity?: number) => void;
  addToInstantCart: (productId: string) => void;
  changeCartQty: (productId: string, delta: number, instant?: boolean) => void;
  toggleCartItem: (productId: string) => void;
  clearCart: () => void;
  createOrder: () => string;
  setOrderStatus: (id: string, status: Order['status']) => void;
  toggleFavorite: (productId: string) => void;
  claimCoupon: (couponId: string) => void;
  saveAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  activateMember: () => void;
}
