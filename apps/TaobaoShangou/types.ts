// 淘宝闪购 状态模型(所有 timestamp 均为绝对 Unix 毫秒,经 TimeService 读取)

export interface SkuOption { label: string; delta: number }
export interface SkuGroup { name: string; type: 'single' | 'multi'; options: SkuOption[] }

export interface TbItem {
  id: string;          // `${shopId}__${slug}`
  slug: string;        // 图片键 items/<slug>.jpg
  shopId: string;
  name: string;
  desc: string;
  price: number;
  origPrice: number | null;
  monthlySales: number;
  tags: string[];
  skuGroups: SkuGroup[] | null;
  image: string;
  // 药品字段(仅看病买药频道的药店商品携带;普通商品为 undefined)
  drugKey?: string;     // 同一药品跨药店归组键
  drugCat?: string;     // 一级药品分类(如"感冒发烧")
  drugSub?: string;     // 二级分类(如"感冒药")
  funcs?: string[];     // 功能主治标签
  isRx?: boolean;       // 是否处方药
  spec?: string;        // 规格(如 0.65g*18片/盒)
  brand?: string;       // 品牌(如 泰诺)
}

export interface TbShopCoupon { id: string; amount: number; threshold: number; name: string; claimed: boolean }

export interface TbShop {
  id: string;
  name: string;
  branch: string;
  fullName: string;
  category: string;
  type: 'restaurant' | 'retail';
  brandColor: string;
  logo: string;
  rating: number;
  monthlySales: string;
  minOrder: number;
  deliveryFee: number;
  deliveryFeeOrig: number;
  deliveryMinutes: number;
  distanceKm: number;
  features: string[];
  promos: { full: number; off: number }[];
  shopCoupon: TbShopCoupon;
  burstCoupon: { amount: number; threshold: number };
  mustPickCat: string | null;
  notice: string;
  address: string;
  hours: string;
  phone: string;
  supportsPickup: boolean;
  ratingTaste: number;
  ratingPack: number;
  menu: { cat: string; itemIds: string[] }[];
}

export interface TbReview {
  id: string; userId: string; userName: string; avatar: string;
  stars: number; tasteStars: number; packStars: number;
  ts: number; text: string; itemName: string; images: string[];
  reply: string | null; hasContent: boolean;
}

export interface TbCartLine {
  id: string;
  shopId: string;
  itemId: string;
  skuDesc: string | null;
  qty: number;
  price: number;      // 含SKU加价的单价
  selected: boolean;
}

export type OrderStatus =
  | 'unpaid' | 'preparing' | 'delivering' | 'delivered'
  | 'canceled' | 'refunding' | 'refunded';

export interface TbOrderLine {
  itemId: string; name: string; image: string;
  skuDesc: string | null; qty: number; price: number; origPrice: number;
}

export interface TbRefund {
  status: 'processing' | 'done';
  amount: number;
  couponsBack: number;
  reason?: string;
  subReason?: string | null;
  desc?: string;
  lineIds?: number[];       // 勾选的行下标
  timeline: [string, number][];
}

export interface TbOrder {
  id: string;
  shopId: string;
  status: OrderStatus;
  createdAt: number;
  statusChangedAt: number;
  lines: TbOrderLine[];
  packFee: number;
  deliveryFee: number;
  deliveryFeeOrig: number;
  couponDiscount: number;
  totalPaid: number;
  totalDiscount: number;
  mode: 'delivery' | 'pickup';
  remark: string | null;
  tableware: string | null;
  reviewed: boolean;
  riderName?: string;
  cancelReason?: string;
  refundReason?: string;
  refund?: TbRefund;
  timeline: [string, number][];
  addressId?: string;
  couponIds?: string[];
  beansClaimed?: boolean;
}

export type CouponStatus = 'unclaimed' | 'claimed' | 'used' | 'refunded';
export interface TbCoupon {
  id: string; name: string;
  type: 'platform' | 'burst' | 'item' | 'shop';
  amount: number; threshold: number;
  expireAt: number; status: CouponStatus;
  burstable: boolean; scope: string;
  shopId?: string;
}

export interface TbMessage {
  id: string; kind: 'banner' | 'notice' | 'rider' | 'shop';
  title: string; sub?: string; ts?: number; icon?: string;
  orderId?: string; shopId?: string; unread?: number; closable?: boolean;
}

export interface TbChatMsg {
  id: string; from: 'me' | 'peer'; text?: string; image?: string; ts: number;
}

export interface TbAddress {
  id: string; poi: string; detail: string; name: string;
  gender: '先生' | '女士'; phone: string; tag: string;
  isDefault: boolean; pinned: boolean;
}

export interface TbMyReview {
  id: string; orderId: string; shopId: string; stars: number;
  riderGood: boolean | null; text: string; images: string[];
  anonymous: boolean; ts: number;
}

export interface TbsgState {
  baseTs: number;
  /** 当前 app 内路由(pathname+search)的只读镜像,供 __SIM__ 状态可观测(不持久化) */
  route: string;
  /** 售后原因跨页草稿(选原因→表单→提交) */
  refundDraft: { reason: string; subReason: string | null };
  user: {
    id: string; nickname: string; signature: string; avatar: string;
    phoneMasked: string; beans: number; svip: boolean; svipExpire: string;
  };
  city: string;
  locationPoi: string;
  kingkong: { id: string; label: string; route: string | null }[];
  shops: TbShop[];
  items: TbItem[];
  reviews: Record<string, TbReview[]>;
  orders: TbOrder[];
  cart: TbCartLine[];
  coupons: TbCoupon[];
  foodCard: { owned: boolean; count: number };
  messages: TbMessage[];
  chats: Record<string, TbChatMsg[]>;      // key: shop:<id> / rider:<orderId> / service
  addresses: TbAddress[];
  currentAddressId: string;
  favorites: string[];
  recentShops: string[];
  frequentShops: { shopId: string; times: number }[];
  searchHistory: string[];
  searchDiscover: string[];
  myReviews: TbMyReview[];
  settings: {
    bannerNotify: boolean; aliNoPwdPay: boolean; balanceNoPwdPay: boolean;
    imgQuality: 'high' | 'low'; cacheMB: number; defaultRemark: string; alwaysTableware: boolean;
    faceLogin: boolean; loginPwdSet: boolean; payPwdSet: boolean;
    notifSwitches: Record<string, boolean>;
  };
  monthSpend: { month: string; amount: number };
  reviewStats: { viewed: number; liked: number; quality: number };
  burstUsedToday: boolean;
  /** 下单页草稿(从店铺/购物车进入结算时写入) */
  checkoutDraft: {
    /** 预生成的首订单id(支付/弃单跳转参数在渲染期即已知) */
    draftOrderId: string;
    shopGroups: { shopId: string; lines: TbCartLine[] }[];
    mode: 'delivery' | 'pickup';
    fromCart: boolean;
    platformCouponId: string | null;
    shopCouponIds: Record<string, string>;
    remark: string;
    tableware: string | null;
    scheduled: string | null;      // null=立即送出
    vas: { rush: boolean; latePay: boolean };
  } | null;
}

export interface TbsgActions {
  // 搜索
  submitSearch: (q: string) => void;
  clearSearchHistory: () => void;
  // 店铺购物车(与tab购物车同源)
  addToCart: (itemId: string, skuDesc: string | null, unitPrice: number, qty?: number) => void;
  changeCartQty: (lineId: string, delta: number) => void;
  toggleCartSelect: (lineId: string, shopId?: string) => void;
  toggleCartSelectAll: (value: boolean) => void;
  removeCartLines: (lineIds: string[]) => void;
  clearShopCart: (shopId: string) => void;
  // 收藏/浏览
  toggleFavorite: (shopId: string) => void;
  touchRecentShop: (shopId: string) => void;
  // 券
  claimCoupon: (couponId: string) => void;
  claimShopCoupon: (shopId: string) => void;
  claimNightCoupons: () => void;
  burstDaily: () => void;
  buyFoodCard: () => void;
  // 结算
  beginCheckout: (shopId: string | null, mode: 'delivery' | 'pickup') => void;
  setCheckoutCoupon: (kind: 'platform' | 'shop', couponId: string | null, shopId?: string) => void;
  setCheckoutField: (patch: Partial<NonNullable<TbsgState['checkoutDraft']>>) => void;
  setCurrentAddress: (addressId: string) => void;
  setLocationPoi: (poi: string) => void;
  setCity: (city: string) => void;
  setRoute: (route: string) => void;
  setRefundDraft: (patch: Partial<{ reason: string; subReason: string | null }>) => void;
  payCheckout: () => string | null;          // 返回新订单id(多店取第一个)
  abandonPay: () => string | null;           // 收银台×:生成待支付订单(qa:R4)
  // 订单
  tickOrders: () => void;
  payUnpaidOrder: (orderId: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  submitCancelReason: (orderId: string, reason: string) => void;
  reorder: (orderId: string) => void;
  claimOrderBeans: (orderId: string) => void;
  // 退款
  submitRefund: (orderId: string, reason: string, subReason: string | null, lineIdxs: number[], desc: string) => void;
  withdrawRefund: (orderId: string) => void;
  // 评价
  submitReview: (orderId: string, stars: number, riderGood: boolean | null, text: string, images: string[], anonymous: boolean) => void;
  // 消息/聊天
  sendChat: (chatKey: string, text: string) => void;
  markAllRead: () => void;
  markMessageRead: (msgId: string) => void;
  dismissBanner: (msgId: string) => void;
  clearMessages: () => void;
  // 地址
  saveAddress: (addr: Omit<TbAddress, 'id'> & { id?: string }) => void;
  deleteAddress: (id: string) => void;
  pinAddress: (id: string) => void;
  // 设置
  updateSettings: (patch: Partial<TbsgState['settings']>) => void;
  updateProfile: (patch: Partial<Pick<TbsgState['user'], 'nickname' | 'signature' | 'avatar'>>) => void;
  clearCache: () => void;
}
