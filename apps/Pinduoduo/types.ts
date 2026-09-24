// 拼多多 App 数据模型类型。defaults.json 结构与 store 状态均以此为准。

export type ShopBadge = 'flagship' | 'brand' | 'normal';

export interface Shop {
  id: string;
  name: string;
  logo: string;
  badge: ShopBadge;
  soldTip: string; // 如「近期本店已拼3万件」
  guarantees: string[]; // 保障标签
}

export interface ItemSpec {
  name: string; // 规格名,如「颜色」「尺码」
  options: string[];
}

export interface Item {
  id: string;
  shopId: string;
  title: string;
  image: string;
  gallery: string[];
  detailImages: string[];
  pinPrice: number; // 拼单价(默认展示)
  singlePrice: number; // 单独购买价(> 拼单价)
  originPrice: number; // 划线原价
  sold: string; // 如「已拼705件」
  tags: string[];
  specs: ItemSpec[];
  reviewCount: number;
  reviewTags: string[];
  freeShipping: boolean;
  fufei: boolean; // 支持先用后付
  subsidy: boolean; // 百亿补贴
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
}

export type OrderStatus =
  | 'pendingPayment' // 待付款
  | 'grouping' // 拼团中(待分享)
  | 'packing' // 打包中(待发货)
  | 'shipped' // 待收货
  | 'completed' // 交易成功
  | 'refunding' // 退款中
  | 'refunded'; // 退款成功

export interface OrderLine {
  itemId: string;
  title: string;
  image: string;
  skuDesc: string;
  price: number;
  qty: number;
}

export interface LogisticsNode {
  time: string;
  text: string;
  done: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  shopId: string;
  shopName: string;
  lines: OrderLine[];
  itemTotal: number;
  paidAmount: number; // 先用后付时为 0
  status: OrderStatus;
  payMethod: string | null; // 先用后付 / 微信 / 支付宝 / 多多钱包
  fufei: boolean; // 是否先用后付下单
  groupNeed: number; // 拼团中还差几人(0=已成团)
  addressSnapshot: { name: string; phone: string; full: string };
  createdAt: number;
  paidAt: number | null;
  autoPayAmount: number; // 确认收货后自动付款金额
  logistics: { trackingNo: string; company: string; nodes: LogisticsNode[] };
  reviewed: boolean;
  refundReason?: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  region: string; // 省 市 区
  detail: string;
  tag: string | null; // 家/公司/学校
  isDefault: boolean;
}

export interface Coupon {
  id: string;
  amount: number; // 面额(元)或折扣标识
  kind: 'cut' | 'discount'; // 满减 / 折扣
  threshold: number; // 满 X 元可用(0=无门槛)
  desc: string;
  expire: string;
  scope: string;
  claimed: boolean; // 是否已领取(领券中心用)
}

export type ChatKind = 'official' | 'shop' | 'system';
export type MsgSender = 'me' | 'peer';

export interface ChatMessage {
  id: string;
  sender: MsgSender;
  type: 'text' | 'itemCard';
  content: string;
  itemId?: string;
  ts: number;
}

export interface Chat {
  id: string;
  kind: ChatKind;
  shopId: string | null;
  name: string;
  avatar: string;
  unread: number;
  badge?: string; // 如「官方」
  quickQuestions: string[];
  messages: ChatMessage[];
}

export interface CategoryGroup {
  id: string;
  name: string;
  subs: { name: string; icon: string }[];
  itemIds: string[];
}

export interface FootprintDay {
  date: string;
  itemIds: string[];
}

export interface PddUser {
  nick: string;
  avatar: string;
  pddId: string;
}

export interface PddSettings {
  fufeiEnabled: boolean;
  darkMode: boolean;
  fontScale: number;
}

export interface PddState {
  user: PddUser;
  shops: Shop[];
  items: Item[];
  reviews: Review[];
  orders: Order[];
  addresses: Address[];
  coupons: Coupon[];
  couponCenter: Coupon[];
  favorites: string[];
  footprints: FootprintDay[];
  followedShops: string[];
  chats: Chat[];
  searchHistory: string[];
  hotSearch: string[];
  categories: CategoryGroup[];
  homeFeedTabs: string[];
  subsidyTabs: string[];
  settings: PddSettings;
  selectedAddressId: string;
}

export interface PddActions {
  toggleFavorite: (itemId: string) => void;
  removeFavorites: (itemIds: string[]) => void;
  addFootprint: (itemId: string) => void;
  followShop: (shopId: string) => void;
  placeOrder: (input: {
    itemId: string;
    skuDesc: string;
    qty: number;
    mode: 'group' | 'single' | 'join';
    payMethod: string;
    fufei: boolean;
  }) => string; // returns new orderId
  soloFinishGroup: (orderId: string) => void;
  payOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  confirmReceipt: (orderId: string) => void;
  confirmQuickRefund: (orderId: string) => void;
  submitRefundForm: (orderId: string, reason: string) => void;
  remindShip: (orderId: string) => void;
  saveAddress: (addr: Omit<Address, 'id'> & { id?: string }) => void;
  setDefaultAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  claimCoupon: (couponId: string) => void;
  ensureShopChat: (shopId: string) => string;
  sendMessage: (chatId: string, text: string) => void;
  quickAsk: (chatId: string, question: string) => void;
  markChatRead: (chatId: string) => void;
  submitReview: (orderId: string, rating: number) => void;
  addSearchHistory: (word: string) => void;
  clearSearchHistory: () => void;
  setFufeiEnabled: (on: boolean) => void;
  setDarkMode: (on: boolean) => void;
  setFontScale: (scale: number) => void;
}
