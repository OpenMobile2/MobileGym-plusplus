// 京东 App 数据模型。defaults.json 结构与 store 状态均以此为准。

export interface JdUser {
  name: string;
  avatar: string;
  memberLevel: string; // 银牌会员
  jingdou: number; // 京豆
  couponCount: number;
  redpacket: number;
  baitiao: number; // 白条可用额度
  footprintCount: number;
  favoriteCount: number;
  followCount: number;
}

export type ShopType = 'self' | 'flagship' | 'thirdparty'; // 京东自营 / 旗舰店 / 第三方

export interface Shop {
  id: string;
  name: string;
  logo: string;
  type: ShopType;
  fans: string; // 关注数文案
}

export interface ItemSpec {
  name: string; // 规格维度,如「颜色」「版本」
  options: string[];
}

export interface Item {
  id: string;
  shopId: string;
  title: string;
  image: string;
  gallery: string[];
  detailImages: string[];
  price: number; // 到手价/售价
  originPrice: number; // 划线原价
  guobu: boolean; // 国家补贴
  guobuOff: number; // 国补已减金额
  self: boolean; // 京东自营
  jdLogistics: boolean; // 京东物流
  baitiaoPeriods: number[]; // 白条免息期数,如 [3,6]
  sold: string; // 已售文案
  goodRate: string; // 好评率
  tags: string[];
  specs: ItemSpec[];
  reviewCount: number;
  reviewTags: string[];
  category: string;
}

export interface Review {
  id: string;
  itemId: string;
  user: string;
  avatar: string;
  rating: number;
  content: string;
  images: string[];
  tags: string[];
  plus: boolean;
}

export interface CartLine {
  key: string;
  itemId: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  skuDesc: string;
  checked: boolean;
  shopId: string;
  shopName: string;
  channel: 'shopping' | 'miaosong'; // 购物 / 秒送外卖
  self: boolean;
}

export type OrderStatus =
  | 'unpaid' // 待付款
  | 'undelivered' // 待收货(已下单/备货/运输)
  | 'unused' // 待使用(服务类)
  | 'done' // 已完成
  | 'refunding' // 退款中
  | 'refunded' // 退款成功
  | 'cancelled'; // 已取消

export type OrderChannel = 'shopping' | 'miaosong' | 'service';

export interface OrderLine {
  itemId: string;
  title: string;
  image: string;
  skuDesc: string;
  price: number;
  qty: number;
}

export interface LogiNode {
  time: string;
  text: string;
}

export interface Order {
  id: string;
  orderNo: string;
  channel: OrderChannel;
  shopId: string;
  shopName: string;
  self: boolean;
  lines: OrderLine[];
  itemTotal: number;
  paidAmount: number;
  status: OrderStatus;
  payMethod: string;
  createdAt: number;
  addressSnapshot: { name: string; phone: string; full: string };
  logistics: { company: string; trackingNo: string; nodes: LogiNode[] };
  reviewed: boolean;
  reviewRating?: number;
  couponId?: string;
  baitiaoPeriod?: number;
  reminded?: boolean;
  logisticsViewed?: boolean;
  refundReason?: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  region: string; // 省市区
  detail: string; // 详细地址
  tag: string; // 家/公司/学校
  isDefault: boolean;
}

export interface Coupon {
  id: string;
  amount: number;
  threshold: number; // 满 N 可用
  scope: string; // 使用范围文案
  expire: string;
  claimed: boolean;
  channel: 'shopping' | 'miaosong';
}

export interface FootprintDay {
  date: string;
  itemIds: string[];
}

export interface CategoryChild {
  name: string;
  icon: string; // 商品图作图标
}
export interface CategoryGroup {
  key: string;
  name: string;
  children: CategoryChild[];
}

export type MsgKind = 'rider' | 'cs' | 'shop' | 'official';
export interface ChatMessage {
  id: string;
  sender: 'me' | 'peer';
  type: 'text';
  content: string;
  ts: number;
}
export interface Chat {
  id: string;
  kind: MsgKind;
  shopId?: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread: number;
  quickQuestions: string[];
  messages: ChatMessage[];
}

export interface GuobuRegion {
  name: string;
  quota: string;
  claimed: boolean;
}

// 秒送/外卖门店(商超或餐厅)
export interface Dish {
  id: string;
  name: string;
  image: string;
  price: number;
  originPrice: number;
  sold: string;
  cat: string; // 门店内分类
  specs?: ItemSpec[]; // 有则弹规格
}
export interface LifeShop {
  id: string;
  kind: 'restaurant' | 'super';
  name: string;
  logo: string;
  cover: string;
  rating: number;
  sold: string;
  eta: string; // 31分钟达
  distance: string;
  cats: string[]; // 门店内分类
  dishes: Dish[];
}

export interface JdSettings {
  darkMode: boolean;
  appearanceMode: 'normal' | 'dark' | 'system';
  fontScale: number;
  fufeiEnabled: boolean;
  /** App 内语言,不写进系统全局 locale */
  language: 'zh-Hans' | 'en';
}

export interface JdState {
  user: JdUser;
  shops: Shop[];
  items: Item[];
  reviews: Review[];
  cart: CartLine[];
  orders: Order[];
  addresses: Address[];
  coupons: Coupon[];
  couponCenter: Coupon[];
  favorites: string[];
  followedShops: string[];
  footprints: FootprintDay[];
  chats: Chat[];
  searchHistory: string[];
  hotSearch: string[];
  categories: CategoryGroup[];
  guobuRegions: GuobuRegion[];
  lifeShops: LifeShop[];
  settings: JdSettings;
  selectedAddressId: string;
  signedToday: boolean;
  taskAudit: {
    reviewFilter?: { itemId: string; tag: string };
    searchResult?: { query: string; sort: string; filters: string[]; addressId: string };
    messageSubtab?: string;
    messageSubtabsViewed?: string[];
    mineFavoriteCount?: number;
  };
}

export interface JdActions {
  toggleFavorite: (itemId: string) => void;
  removeFavorites: (itemIds: string[]) => void;
  addFootprint: (itemId: string) => void;
  followShop: (shopId: string) => void;
  // 购物车
  addToCart: (itemId: string, qty: number, skuDesc: string, channel?: 'shopping' | 'miaosong') => void;
  toggleCartCheck: (key: string) => void;
  toggleShopCheck: (shopId: string) => void;
  setCartQty: (key: string, delta: number) => void;
  toggleSelectAll: (on: boolean) => void;
  removeCartLine: (key: string) => void;
  // 下单
  placeOrder: (input: {
    keys?: string[];
    itemId?: string;
    qty?: number;
    skuDesc?: string;
    // 外卖/秒送:菜品不在 cart/items,直接传订单行 + 门店 + 实付金额
    lines?: OrderLine[];
    shopId?: string;
    shopName?: string;
    self?: boolean;
    paidAmount?: number; // 显式实付(外卖含打包费/补贴时用)
    discount?: number; // 优惠券抵扣(购物路径:实付 = 商品金额 - discount)
    couponId?: string;
    baitiaoPeriod?: number;
    channel: OrderChannel;
    payMethod: string;
    /** 默认 undelivered;购物确认页点立即支付时传 unpaid,输密码成功后再 payOrder */
    status?: OrderStatus;
  }) => string;
  payOrder: (orderId: string) => void;
  setOrderPayMethod: (orderId: string, payMethod: string, baitiaoPeriod?: number) => void;
  cancelOrder: (orderId: string) => void;
  confirmReceipt: (orderId: string) => void;
  submitRefund: (orderId: string, reason: string) => void;
  submitReview: (orderId: string, rating: number) => void;
  markOrderLogisticsViewed: (orderId: string) => void;
  remindOrder: (orderId: string) => void;
  // 地址
  saveAddress: (addr: Omit<Address, 'id'> & { id?: string }) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  // 券/京豆
  claimCoupon: (couponId: string) => void;
  claimGuobu: (region: string) => void;
  signIn: () => void;
  // 消息
  ensureShopChat: (shopId: string) => string;
  sendMessage: (chatId: string, text: string) => void;
  quickAsk: (chatId: string, question: string) => void;
  markChatRead: (chatId: string) => void;
  clearUnread: () => void;
  // 搜索
  addSearchHistory: (word: string) => void;
  removeSearchHistory: (word: string) => void;
  clearSearchHistory: () => void;
  removeFootprint: (date: string, itemId: string) => void;
  // 设置
  setDarkMode: (on: boolean) => void;
  setAppearanceMode: (mode: 'normal' | 'dark' | 'system') => void;
  setFontScale: (scale: number) => void;
  setLanguage: (language: 'zh-Hans' | 'en') => void;
  recordTaskAudit: (patch: Partial<JdState['taskAudit']>) => void;
}
