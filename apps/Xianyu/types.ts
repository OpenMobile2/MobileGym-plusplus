/** 闲鱼 数据模型。所有 timestamp 为绝对 Unix 毫秒。 */

export interface XySeller {
  id: string;
  name: string;
  avatar: string;
  /** 鱼小铺等级 0=个人闲置, 1-5=鱼小铺星级 */
  shopLevel: number;
  isShop: boolean;
  goodRate: number; // 好评率 %
  fishScore: number; // 鱼力值
}

export interface XyItem {
  id: string;
  title: string;
  desc: string;
  images: string[];
  price: number;
  originalPrice?: number;
  wantCount: number;
  viewCount: number;
  condition: string; // 成色
  category: string;
  brand?: string;
  model?: string;
  sellerId: string;
  location: string; // 城市·区
  distanceKm?: number; // 同城距离
  freeShipping: boolean;
  inspected: boolean; // 验货宝(卖家侧开启,买家侧仅展示绿标)
  soldOut?: boolean;
  marketLowPct?: number; // 集市:比行情价低 X%
  tags: string[];
}

export type XyOrderStatus =
  | 'pendingPayment'
  | 'pendingShip'
  | 'pendingReceipt'
  | 'pendingReview'
  | 'completed'
  | 'refunding'
  | 'closed';

export interface XyAddressSnapshot {
  name: string;
  phone: string;
  full: string;
}

export interface XyOrder {
  id: string;
  orderNo: string;
  role: 'buyer' | 'seller';
  itemId: string;
  title: string;
  image: string;
  price: number;
  sellerId: string;
  sellerName: string;
  buyerName: string;
  status: XyOrderStatus;
  addressSnapshot: XyAddressSnapshot | null;
  payMethod: string | null;
  inspected: boolean;
  reviewed: boolean;
  createdAt: number;
  paidAt: number | null;
  shippedAt: number | null;
  completedAt: number | null;
  payDeadline: number | null;
  cancelReason?: string;
  delivery?: 'express' | 'pickup';
}

export interface XyChatMessage {
  id: string;
  sender: 'me' | 'peer';
  type: 'text' | 'itemCard' | 'system';
  content: string;
  itemId?: string;
  timestamp: number;
}

export interface XyChat {
  id: string;
  sellerId: string;
  name: string;
  avatar: string;
  itemId?: string;
  unread: number;
  isSticky: boolean;
  messages: XyChatMessage[];
}

export interface XyAddress {
  id: string;
  name: string;
  phone: string;
  region: string; // 省 市 区
  detail: string;
  tag?: string;
  isDefault: boolean;
}

export interface XyReturnAddress {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

export interface XyCircle {
  id: string;
  name: string;
  icon: string;
  desc: string;
  memberCount: number;
  tag?: 'HOT' | 'NEW' | '';
  category: string;
}

export interface XyCoupon {
  id: string;
  title: string;
  amount: number;
  thresholdText: string;
  scope: string;
  validText: string;
  used: boolean;
  claimed?: boolean;
  kind: 'redpacket' | 'coupon' | 'other';
}

export interface XyReview {
  orderId: string;
  itemId: string;
  rating: number; // 1-5
  content: string;
  images: string[];
  anonymous: boolean;
  timestamp: number;
  append?: string;
}

export interface XyFootprint {
  itemId: string;
  date: number;
}

export interface XyListing {
  itemId: string;
  status: 'onSale' | 'offShelf';
  publishedAt: number;
}

export interface XyDraft {
  id: string;
  title: string;
  desc: string;
  price: number | null;
  condition: string;
  category?: string;
  images: string[];
  inspected: boolean;
  savedAt: number;
}

export interface XyComment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  likes: number;
  liked: boolean;
  timestamp: number;
}

export interface XyCheckout {
  itemId: string;
  addressId: string;
  delivery: 'express' | 'pickup';
  payMethod: string; // '支付宝' | '余额'
}

export interface XyUser {
  id: string;
  name: string;
  avatar: string;
  fishScore: number;
  followers: number;
  following: number;
}

export interface XySettings {
  darkMode: boolean;
  language: 'zh' | 'en';
}

export interface XianyuState {
  user: XyUser;
  sellers: XySeller[];
  items: XyItem[];
  circles: XyCircle[];
  orders: XyOrder[];
  chats: XyChat[];
  addresses: XyAddress[];
  returnAddresses: XyReturnAddress[];
  coupons: XyCoupon[];
  reviews: XyReview[];
  comments: Record<string, XyComment[]>;
  favorites: string[];
  footprints: XyFootprint[];
  followedSellers: string[];
  joinedCircles: string[];
  listings: XyListing[];
  drafts: XyDraft[];
  searchHistory: string[];
  subscribedSearches: string[];
  hotSearches: string[];
  checkout: XyCheckout | null;
  settings: XySettings;
  taskAudit: Record<string, unknown>;
}

export interface XianyuActions {
  // 搜索
  submitSearch: (q: string) => void;
  clearSearchHistory: () => void;
  subscribeSearch: (q: string) => void;
  // 详情
  toggleFavorite: (itemId: string) => void;
  removeFavorite: (itemId: string) => void;
  recordFootprint: (itemId: string) => void;
  clearFootprints: () => void;
  toggleFollowSeller: (sellerId: string) => void;
  addComment: (itemId: string, content: string) => void;
  toggleCommentLike: (itemId: string, commentId: string) => void;
  // 圈子
  joinCircle: (circleId: string) => void;
  // 私信
  ensureChat: (sellerId: string, itemId?: string) => string;
  sendChatMessage: (chatId: string, content: string) => void;
  toggleChatSticky: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  markChatRead: (chatId: string) => void;
  // 下单 / 支付
  beginCheckout: (itemId: string) => void;
  setCheckoutAddress: (addressId: string) => void;
  setCheckoutDelivery: (d: 'express' | 'pickup') => void;
  setCheckoutPayMethod: (m: string) => void;
  createOrder: () => string;
  markOrderPaid: (orderId: string) => void;
  // 订单
  cancelOrder: (orderId: string, reason: string) => void;
  deleteOrder: (orderId: string) => void;
  confirmReceipt: (orderId: string) => void;
  // 评价
  submitReview: (orderId: string, rating: number, content: string, anonymous: boolean, images?: string[]) => void;
  appendReview: (orderId: string, content: string) => void;
  // 发布
  publishItem: (draft: Omit<XyDraft, 'id' | 'savedAt'>) => string;
  saveDraft: (draft: Omit<XyDraft, 'id' | 'savedAt'>) => void;
  // 地址
  saveAddress: (addr: Partial<XyAddress> & { id?: string }) => void;
  deleteAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
  saveReturnAddress: (addr: Partial<XyReturnAddress> & { id?: string }) => void;
  // 卡券
  claimCoupon: (couponId: string) => void;
  // 设置
  toggleDarkMode: () => void;
  setLanguage: (lang: 'zh' | 'en') => void;
  recordTaskAudit: (key: string, value: unknown) => void;
}
