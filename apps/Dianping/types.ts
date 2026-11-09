export type DayHours = { open: string; close: string };

export interface ShopDeal {
  id: string;
  title: string;
  price: number;
  origin: number;
  sold: string;
  kind: 'voucher' | 'setmeal';
  rules?: string;
  /** 套餐明细:含什么(菜品名 + 份数) */
  items?: { name: string; qty: number }[];
}

export interface ShopDish {
  id: string;
  name: string;
  price: number;
  recommendCount: number;
  liked?: boolean;
  image?: string;
}

export interface ShopReview {
  id: string;
  userName: string;
  score: number;
  body: string;
  tags: string[];
  dateLabel: string;
  hasPhoto?: boolean;
  avgPriceText?: string;
  fromUser?: boolean;
  /** 用户自己写评价时选的相册图(优先于占位菜品图显示) */
  photos?: string[];
  taste?: number;
  env?: number;
  service?: number;
  dishNames?: string[];
  /** 商家回复 */
  reply?: string;
}

export interface Shop {
  id: string;
  name: string;
  category: string;
  district: string;
  avgPrice: number;
  score: number;
  taste: number;
  env: number;
  service: number;
  ingredient?: number;
  reviewCount: number;
  distanceM: number;
  address: string;
  hours: DayHours;
  tags: string[];
  coverColor: string;
  coverLabel: string;
  coverImage?: string;
  deals: ShopDeal[];
  dishes: ShopDish[];
  reviews: ShopReview[];
  foodTabs: Array<'restaurant' | 'cafe' | 'snack' | 'hotpot'>;
}

export interface NoteCard {
  id: string;
  title: string;
  author: string;
  likes: number;
  shopId?: string;
  coverColor: string;
  body?: string;
}

export interface BrowseEntry {
  id: string;
  kind: 'shop' | 'deal' | 'content';
  refId: string;
  title: string;
  subtitle: string;
  ts: number;
}

export type OrderStatus = 'pending_pay' | 'usable' | 'used' | 'refunding' | 'refunded';

export interface DpOrder {
  id: string;
  shopId: string;
  shopName: string;
  dealId: string;
  dealTitle: string;
  unitPrice: number;
  originPrice: number;
  qty: number;
  payAmount: number;
  status: OrderStatus;
  code: string;
  createdAt: number;
  paidAt?: number;
  paymentMethod?: 'wechat' | 'alipay';
  refundReason?: string;
  coverColor: string;
}

export interface PlatformCoupon {
  id: string;
  title: string;
  amount: number;
  usable: boolean;
  subText: string;
  expireText: string;
  tag?: string;
  reason?: string;
}

export interface PendingCheckout {
  shopId: string;
  dealId: string;
  qty: number;
  couponId?: string | null;
}

export interface DraftReview {
  shopId: string;
  score: number;
  taste: number;
  env: number;
  service: number;
  body: string;
  avgPrice: string;
  dishIds: string[];
  photos?: string[];
}

export interface UserReviewRecord {
  id: string;
  shopId: string;
  shopName: string;
  score: number;
  body: string;
  createdAt: number;
  /** 写评价时选的相册图,发布后带到评价里显示 */
  photos?: string[];
  taste?: number;
  env?: number;
  service?: number;
  avgPriceText?: string;
  dishNames?: string[];
  /** 商家回复(与消息互动页展示的一致) */
  reply?: string;
}

export interface UserProfile {
  nickname: string;
  gender: string;
  bio: string;
  birthday: string;
  hometown: string;
  residence: string;
}

export interface SystemMessage {
  id: string;
  title: string;
  body: string;
  ts: number;
}

export interface ReviewDraftRecord {
  id: string;
  shopId: string;
  shopName: string;
  score: number;
  body: string;
  ts: number;
}

export interface DianpingState {
  _dataVersion: number;
  city: string;
  shops: Shop[];
  notes: NoteCard[];
  favoriteShopIds: string[];
  favoriteDishIds: string[];
  browseHistory: BrowseEntry[];
  orders: DpOrder[];
  searchHistory: string[];
  checkins: { shopId: string; ts: number; mood?: string; note?: string }[];
  checkinsViewed: boolean;
  userReviews: UserReviewRecord[];
  userProfile: UserProfile;
  msgUnread: { system: number; activity: number; likes: number; comment: number; fans: number };
  systemMessages: SystemMessage[];
  reviewDrafts: ReviewDraftRecord[];
  favoriteDealIds: string[];
  draftReview: DraftReview | null;
  pendingCheckout: PendingCheckout | null;
  lastPaidOrderId: string | null;
  _temp: { toast: string; toastSeq: number };
}

export interface DianpingActions {
  showToast: (msg: string) => void;
  setCity: (city: string) => void;
  toggleFavoriteShop: (shopId: string) => void;
  toggleFavoriteDish: (shopId: string, dishId: string) => void;
  toggleDishLike: (shopId: string, dishId: string) => void;
  recordBrowseShop: (shopId: string) => void;
  clearBrowseHistory: () => void;
  addSearchHistory: (q: string) => void;
  clearSearchHistory: () => void;
  setPendingCheckout: (p: PendingCheckout | null) => void;
  setCheckoutQty: (qty: number) => void;
  selectPlatformCoupon: (couponId: string | null) => void;
  createPendingOrder: () => string | null;
  payOrder: (orderId: string, paymentMethod?: 'wechat' | 'alipay') => void;
  applyRefund: (orderId: string, reason: string) => void;
  completeRefund: (orderId: string) => void;
  setDraftReview: (d: DraftReview | null) => void;
  publishReview: () => void;
  addCheckin: (shopId: string, mood?: string, note?: string) => void;
  recordCheckinsView: () => void;
  updateUserProfile: (patch: Partial<UserProfile>) => void;
  markMsgRead: (kind: 'system' | 'activity' | 'likes' | 'comment' | 'fans' | 'all') => void;
  pushSystemMessage: (title: string, body: string) => void;
  saveReviewDraft: (d: { shopId: string; shopName: string; score: number; body: string }) => void;
  deleteReviewDraft: (id: string) => void;
  toggleFavoriteDeal: (key: string) => void;
}
