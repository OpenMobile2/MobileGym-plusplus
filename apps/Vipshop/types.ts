/** 唯品会 App 级类型定义 */

export interface VipSpec {
  name: string;       // 规格名(颜色/尺码)
  options: string[];
}

export interface VipItem {
  id: string;
  title: string;
  brandId: string;
  brandName: string;
  category: string;      // 一级品类 id(CATEGORY_TAXONOMY 的 key)
  subCategory: string;   // 二级品类(该一级下的智能分类,中文标签)
  image: string;
  gallery: string[];
  detailImages: string[];
  price: number;      // 特卖价
  originPrice: number;
  discountText: string;   // 折扣,如 "6.2折"
  sold: string;
  tags: string[];
  specs: VipSpec[];
  reviewCount: number;
  goodRate: string;
  reviewTags: string[];
  stockTight?: boolean;
}

export interface VipBrand {
  id: string;
  name: string;
  logo: string;
  banner: string;
  slogan: string;
  discountText: string;   // 如 "1.5折起"
  endsAt: number;         // 专场倒计时结束(store 初始化时按 sim now + endsInHours 计算)
  endsInHours: number;    // 距结束小时数(运行时相对当前 sim 时间)
  category: string;       // 品牌主类目(用于专场子分类按类目派生)
  subscribers: string;
  itemIds: string[];
}

export interface VipReview {
  id: string;
  itemId: string;
  userNick: string;
  userAvatar: string;
  skuDesc: string;
  content: string;
  images: string[];
  tag: string;            // 买家秀 / 尺码偏大 / 尺码偏小 / 全部
}

export interface VipCartItem {
  id: string;
  itemId: string;
  skuDesc: string;
  qty: number;
  price: number;
  selected: boolean;
  addedAt: number;
  tags: string[];         // 降价 / 库存紧张 / 常购
}

export interface VipCoupon {
  id: string;
  title: string;
  amount: number;
  thresholdText: string;
  scope: string;
  validText: string;
  type: string;           // 全场 / 品类 / 品牌
  used: boolean;
}

export interface VipOrderLine {
  itemId: string;
  title: string;
  image: string;
  skuDesc: string;
  price: number;
  qty: number;
}

export type VipOrderStatus =
  | 'pendingPayment' | 'pendingReceipt' | 'completed' | 'canceled' | 'refunding';

export interface VipLogisticsNode {
  time: string;
  text: string;
}

export interface VipOrder {
  id: string;
  orderNo: string;
  brandName: string;
  lines: VipOrderLine[];
  itemTotal: number;
  shippingFee: number;
  paidAmount: number;
  status: VipOrderStatus;
  addressSnapshot: { name: string; phone: string; full: string };
  payMethod: string | null;
  createdAt: number;
  payDeadline: number | null;
  trackingNo: string;
  courier: string;
  logistics: VipLogisticsNode[];
  reviewed: boolean;
  isInternational: boolean;   // 唯品国际 → 可溯源
}

export interface VipRefund {
  id: string;
  orderId: string;
  line: VipOrderLine;
  refundType: string;
  amount: number;
  status: 'processing' | 'success' | 'canceled';
  createdAt: number;
}

export interface VipAddress {
  id: string;
  name: string;
  phone: string;
  region: string;     // "广东省 广州市 天河区"
  detail: string;
  tag: string;        // 家庭 / 公司 / 其他
  isDefault: boolean;
}

export interface VipChatMessage {
  id: string;
  sender: 'me' | 'bot';
  type: 'text' | 'coupon';
  content: string;
  timestamp: number;
}

export interface VipFootprint {
  itemId: string;
  date: number;
}

export interface VipSession {
  loggedIn: boolean;
  phone: string;
  nick: string;
  avatar: string;
  isSuperV: boolean;
  vipcoin: number;
}

export interface VipshopState {
  session: VipSession;
  items: VipItem[];
  brands: VipBrand[];
  reviews: VipReview[];
  cart: VipCartItem[];
  favorites: string[];       // itemIds
  favoriteBrands: string[];  // brandIds
  subscribedBrands: string[];
  footprints: VipFootprint[];
  coupons: VipCoupon[];
  orders: VipOrder[];
  refunds: VipRefund[];
  addresses: VipAddress[];
  searchHistory: string[];
  hotSearches: string[];
  chatMessages: VipChatMessage[];
  priceAlerts: string[];
  // 结算上下文
  checkout: {
    lines: VipOrderLine[];
    brandName: string;
    source: 'cart' | 'buyNow';
    addressId: string;
    payMethod: string;
    couponId: string | null;
    svip: boolean;
  } | null;
}

export interface VipshopActions {
  // 登录
  login: (phone: string) => void;
  logout: () => void;
  // 搜索
  submitSearch: (q: string) => void;
  clearSearchHistory: () => void;
  // 商品/收藏/足迹
  toggleFavorite: (itemId: string) => void;
  toggleFavoriteBrand: (brandId: string) => void;
  toggleSubscribe: (brandId: string) => void;
  recordFootprint: (itemId: string) => void;
  setPriceAlert: (itemId: string) => void;
  // 购物车
  addToCart: (itemId: string, skuDesc: string, qty: number) => void;
  toggleCartSelect: (cartItemId: string) => void;
  toggleCartSelectAll: () => void;
  changeCartQty: (cartItemId: string, delta: number) => void;
  deleteCartItems: (ids: string[]) => void;
  moveCartToFavorites: (ids: string[]) => void;
  // 下单
  beginCheckout: (arg: { lines: VipOrderLine[]; brandName: string; source: 'cart' | 'buyNow' }) => void;
  setCheckoutAddress: (addressId: string) => void;
  setCheckoutPayMethod: (m: string) => void;
  setCheckoutCoupon: (couponId: string | null) => void;
  toggleCheckoutSvip: () => void;
  createOrder: () => string;
  // 订单
  confirmReceipt: (orderId: string) => void;
  buyAgainToCart: (orderId: string) => void;
  submitRefund: (orderId: string, refundType: string) => void;
  cancelRefund: (refundId: string) => void;
  submitReview: (orderId: string) => void;
  // 地址
  saveAddress: (addr: Partial<VipAddress> & { name: string; phone: string; region: string; detail: string }) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  // 优惠券
  claimCoupon: (title: string, amount: number, thresholdText: string) => void;
  // 客服
  sendChatMessage: (content: string) => void;
  botReply: (question: string) => void;
  // 设置
  clearCache: () => void;
}
