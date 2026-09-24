/**
 * Taobao 状态模型
 * 所有 timestamp 字段均为绝对 Unix 毫秒(禁止负数相对偏移)。
 * 图片路径:/@app-assets/Taobao/<relPath>(相对 apps/Taobao/assets/)。
 */

export interface TbUser {
  id: string;
  nick: string;
  avatar: string;
  level: string;
  is88Vip: boolean;
  savedTotal: number;
  redPacketAmount: number;
  tmallPoints: number;
  rechargeBalance: number;
}

export interface TbShop {
  id: string;
  name: string;
  badge: 'tmall' | 'taobao';
  logo: string;
  rating: number;
  fans: string;
  positiveRate: string;
  certifiedText: string;
}

export interface TbSkuSpec {
  name: string;
  options: string[];
}

export interface TbItem {
  id: string;
  shopId: string;
  title: string;
  image: string;
  detailImages: string[];
  /** 单位:元 */
  price: number;
  originPrice: number;
  sold: string;
  tags: string[];
  specs: TbSkuSpec[];
  limitPerOrder?: number;
  favCount: number;
  reviewCount: number;
  reviewAiTags: string[];
  /** 主图轮播(可选,缺省退回 [image]) */
  gallery?: string[];
  freeShipping: boolean;
  category: string;
}

export interface TbReview {
  id: string;
  itemId: string;
  userNick: string;
  userAvatar: string;
  vipTag?: string;
  skuDesc: string;
  content: string;
  images: string[];
  timestamp: number;
}

export interface TbCartItem {
  id: string;
  itemId: string;
  skuDesc: string;
  qty: number;
  /** 加入时单价快照(元) */
  price: number;
  selected: boolean;
  invalid: boolean;
  addedAt: number;
}

export interface TbAddress {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  tag: string | null;
  isDefault: boolean;
}

export interface TbOrderLine {
  itemId: string;
  title: string;
  image: string;
  skuDesc: string;
  price: number;
  qty: number;
}

export type TbOrderStatus =
  | 'pendingPayment'
  | 'pendingShip'
  | 'shipped'
  | 'completed'
  | 'refunded';

export interface TbLogisticsNode {
  status: string;
  desc: string;
  timestamp: number;
}

export interface TbOrder {
  id: string;
  orderNo: string;
  shopId: string;
  shopName: string;
  shopBadge: 'tmall' | 'taobao';
  lines: TbOrderLine[];
  itemTotal: number;
  shopDiscount: number;
  shippingFee: number;
  paidAmount: number;
  status: TbOrderStatus;
  addressSnapshot: { name: string; phone: string; full: string };
  payMethod: string | null;
  createdAt: number;
  paidAt: number | null;
  shippedAt: number | null;
  completedAt: number | null;
  /** 待付款截止 */
  payDeadline: number | null;
  /** 自动确认收货时间 */
  autoConfirmAt: number | null;
  logistics: {
    noLogistics: boolean;
    company: string | null;
    trackingNo: string | null;
    nodes: TbLogisticsNode[];
  };
  reviewed: boolean;
  gift: string | null;
}

export interface TbRefund {
  id: string;
  orderId: string;
  line: TbOrderLine;
  shopName: string;
  shopBadge: 'tmall' | 'taobao';
  refundType: string;
  reason: string;
  amount: number;
  status: 'processing' | 'success';
  createdAt: number;
}

export interface TbChatMessage {
  id: string;
  sender: 'me' | 'peer';
  type: 'text' | 'itemCard' | 'addressConfirm';
  content: string;
  itemId?: string;
  timestamp: number;
  /** addressConfirm 卡片是否已确认 */
  confirmed?: boolean;
}

export interface TbChat {
  id: string;
  kind: 'shop' | 'system' | 'ai';
  shopId: string | null;
  name: string;
  avatar: string;
  unread: number;
  isSticky: boolean;
  messages: TbChatMessage[];
}

export interface TbCoupon {
  id: string;
  title: string;
  amount: number;
  thresholdText: string;
  scope: string;
  validText: string;
  used: boolean;
}

export interface TbFootprint {
  itemId: string;
  /** 浏览日期(当天 0 点的绝对时间戳) */
  date: number;
}

export interface TbMyReview {
  orderId: string;
  itemId: string;
  content: string;
  timestamp: number;
}

export interface TbCheckout {
  lines: TbOrderLine[];
  shopId: string;
  source: 'cart' | 'buyNow';
  /** Exact cart rows represented by this checkout; absent for legacy checkout state. */
  sourceCartLineIds?: string[];
  addressId: string;
  payMethod: string;
  note: string;
}

export interface TaobaoState {
  user: TbUser;
  shops: TbShop[];
  items: TbItem[];
  reviews: TbReview[];
  cart: TbCartItem[];
  addresses: TbAddress[];
  orders: TbOrder[];
  refunds: TbRefund[];
  chats: TbChat[];
  coupons: TbCoupon[];
  favorites: string[];
  footprints: TbFootprint[];
  followedShops: string[];
  memberShops: string[];
  searchHistory: string[];
  searchDiscover: string[];
  hotSearch: string[];
  myReviews: TbMyReview[];
  priceAlerts: string[];
  /** 领券中心已领过的券标题(幂等) */
  claimedCenterCoupons: string[];
  /** 首页底部消费券横幅是否已领 */
  homeCouponClaimed: boolean;
  /** 下单上下文(进入确认订单页前由 cart/skuPanel 写入) */
  checkout: TbCheckout | null;
}

export interface TaobaoActions {
  // 搜索
  submitSearch: (q: string) => void;
  removeSearchHistory: (word: string) => void;
  // 详情/SKU
  addToCart: (itemId: string, skuDesc: string, qty: number) => void;
  toggleFavorite: (itemId: string) => void;
  recordFootprint: (itemId: string) => void;
  // 购物车
  toggleCartSelect: (cartItemId: string) => void;
  toggleCartShopSelect: (shopId: string) => void;
  toggleCartSelectAll: () => void;
  changeCartQty: (cartItemId: string, delta: number) => void;
  deleteCartItems: (cartItemIds: string[]) => void;
  moveCartToFavorites: (cartItemIds: string[]) => void;
  setPriceAlert: (itemId: string) => void;
  // 下单/支付
  beginCheckout: (checkout: Omit<TbCheckout, 'addressId' | 'payMethod' | 'note'>) => void;
  setCheckoutAddress: (addressId: string) => void;
  setCheckoutPayMethod: (m: string) => void;
  setCheckoutNote: (note: string) => void;
  /** 立即支付:创建待付款订单,返回 orderId */
  createOrder: () => string;
  /** 支付完成:待付款 → 待发货 */
  markOrderPaid: (orderId: string) => void;
  // 订单
  confirmReceipt: (orderId: string) => void;
  extendReceipt: (orderId: string) => void;
  buyAgain: (orderId: string) => void;
  deleteRefundRecord: (refundId: string) => void;
  submitRefund: (orderId: string, refundType: string, reason: string) => void;
  submitReview: (orderId: string, itemId: string, content: string) => void;
  // 地址
  saveAddress: (addr: Omit<TbAddress, 'id'> & { id?: string }) => void;
  setDefaultAddress: (addressId: string) => void;
  // 店铺/消息
  toggleFollowShop: (shopId: string) => void;
  joinShopMember: (shopId: string) => void;
  /** 确保该店铺存在会话(无则创建),返回 chatId —— 修复"所有客服跳同一家店" */
  ensureShopChat: (shopId: string) => string;
  sendChatMessage: (chatId: string, content: string) => void;
  sendChatItemCard: (chatId: string, itemId: string) => void;
  confirmChatAddress: (chatId: string, messageId: string) => void;
  toggleChatSticky: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  markChatRead: (chatId: string) => void;
  clearAllUnread: () => void;
  // 收藏/其他
  removeFavorite: (itemId: string) => void;
  claimHomeCoupon: () => void;
  /** 领券中心领券(幂等,按标题) */
  claimCenterCoupon: (title: string, amount: number, thresholdText: string) => void;
}
