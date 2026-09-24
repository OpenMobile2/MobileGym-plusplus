/**
 * 猫眼 App 状态模型。
 * 所有 timestamp 均为绝对 Unix 毫秒(如 1783958400000),禁止负数相对偏移。
 * 图片路径:/@app-assets/Maoyan/gen/xxx.png
 */

export interface CastMember {
  name: string;
  role: string; // 导演 / 饰: xxx
  avatar: string;
}

export interface Movie {
  id: string;
  title: string;
  titleEn: string;
  poster: string;
  /** 详情页沉浸主题色(海报主色暗化,design-tokens §3) */
  themeColor: string;
  /** hot=正在热映 upcoming=待映 classic=已下映(可搜可看信息,不购票) */
  status: 'hot' | 'upcoming' | 'classic';
  /** 0 表示暂无评分(热映新片)*/
  score: number;
  /** 点映评分(待映片,0=无) */
  previewScore: number;
  wishCount: number;
  genres: string[];
  duration: number; // 分钟
  releaseDate: string; // '2026-07-11'
  releaseNote: string; // '2026-07-11 09:00中国大陆上映'
  cast: CastMember[];
  synopsis: string;
  formats: string[]; // ['IMAX 2D','CINITY 2D']
  presale: boolean; // 待映片是否可预售
  cinemaCount: number; // 今天N家影院放映
  sessionCount: number;
}

export interface Review {
  id: string;
  movieId: string;
  user: string;
  avatar: string;
  level: number;
  stars: number; // 1~10 分
  text: string;
  likes: number;
  replies: number;
  timestamp: number; // 绝对毫秒
  region: string;
  bought: boolean; // 购票标
  mine: boolean;
}

export interface Cinema {
  id: string;
  city: string;
  name: string;
  address: string;
  district: string; // 行政区
  zone: string; // 商圈
  metro: string; // 地铁站
  brand: string;
  distanceKm: number;
  minPrice: number;
  services: string[]; // 可退票/可改签/小吃/3D眼镜免费
  hallTypes: string[]; // 激光厅/杜比全景声…
  favorite: boolean;
  promo: string; // 营销行文案,可为空
}

export interface Session {
  id: string;
  cinemaId: string;
  movieId: string;
  /** 相对今天的天数偏移 0/1/2(数据种子按 TimeService 动态换算日期展示) */
  dayOffset: number;
  start: string; // '13:15'
  end: string; // '14:45'
  lang: string; // 国语/英语
  dim: string; // 2D/3D/IMAX 2D
  hall: string; // 2号厅
  price: number; // 到手价
  origPrice: number;
  tag: string; // 特惠标签,可为空
}

export interface Snack {
  id: string;
  name: string;
  image: string;
  price: number;
  origPrice: number;
  tag: string; // 销量最高/超值
  kind: 'snack' | 'merch';
}

/** 选座草稿(购票进行中) */
export interface SeatDraft {
  sessionId: string;
  seats: string[]; // '4-07' 排-座
  snackIds: string[];
  agreed: boolean;
  /** 随票加购的影城卡 id(''=不购卡);勾选后本单加卡费、减开卡立减 */
  cardId: string;
}

export interface TicketCode {
  qrToken: string;
  phone: string;
  verify: string; // '0504 70 2 3819 4'
}

export interface Order {
  id: string;
  kind: 'movie' | 'show';
  status: 'upcoming' | 'finished' | 'changed';
  title: string;
  poster: string;
  cinemaOrVenue: string;
  /** 电影票字段 */
  movieId: string;
  sessionDesc: string; // '2026-07-13 10:00-12:17 国语2D'
  hallSeats: string; // '5号沙发激光厅 3排04座 3排05座'
  count: number;
  total: number;
  code: TicketCode | null;
  snacks: string[];
  /** 演出票字段 */
  showId: string;
  tierDesc: string; // '全价票380元×1张'
  viewerName: string;
  timestamp: number; // 下单绝对毫秒
  rated: boolean;
  /** 本单随票开通的影城卡 id(''=无) */
  cardId: string;
}

export interface ShowTier {
  id: string;
  name: string; // 全价票/VIP单人票
  price: number;
}

export interface ShowEvent {
  id: string;
  title: string;
  poster: string;
  category: string; // concert/talkshow/drama/musicfest/classical/crosstalk/exhibition/kids
  artist: string;
  venue: string;
  city: string;
  cityStops: string[]; // ['西安站','温州站']
  dateDesc: string; // '2026-08-22(SAT) 19:00'
  sessionDesc: string; // '2026-07-26 周日 20:00'
  priceMin: number;
  priceMax: number;
  distanceKm: number;
  tags: string[]; // 不支持退/官方直营/凭证件入场/电子票
  tiers: ShowTier[];
  discount: string; // '8.8折' 临演特价标,可为空
  intro: string;
  wished: boolean;
  artistFollowed: boolean;
  notices: string[]; // 购票观演须知
}

export interface ViewerProfile {
  id: string;
  name: string;
  idMasked: string; // '230************426'
}

/** 影城卡(会员卡):可购买、可抵扣、可自动续费 */
export interface CinemaCard {
  id: string;
  name: string;
  /** 适用影院品牌,''=全城通用 */
  brand: string;
  /** 有效期文案 + 月数 */
  periodLabel: string;
  periodMonths: number;
  price: number;
  origPrice: number;
  /** 每单立减金额 */
  discountPerOrder: number;
  /** 卡面渐变(与 Movie.themeColor 同类:随数据走的展示色) */
  bg: string;
  /** 已开卡 */
  owned: boolean;
  /** 开卡后是否连续续费(单独开卡=是,随票加购=否) */
  autoRenew: boolean;
  /** 到期绝对毫秒,0=未开卡 */
  expiryTs: number;
  /** 已休卡(暂停使用) */
  suspended: boolean;
}

export interface Coupon {
  id: string;
  amount: number;
  threshold: string; // 无门槛 / 30元以上可用
  title: string;
  kind: string; // 商家券/代金券
  expiry: string; // '2026-03-17 23:59'
  status: 'valid' | 'expired' | 'used';
}

export interface FunMerchant {
  id: string;
  name: string;
  image: string;
  rating: number;
  category: string; // 台球/网吧电竞…
  zone: string;
  distanceKm: number;
  perCapita: number; // 人均,0=不展示
  deals: string[]; // 团购行文案
}

export interface Scenic {
  id: string;
  name: string;
  image: string;
  priceFrom: number;
}

export interface City {
  id: string;
  name: string;
  hot: boolean;
}

export interface Artist {
  id: string;
  name: string;
  nameEn: string;
  avatar: string;
  role: string;
  works: string[];
  showIds: string[];
  movieIds: string[];
  followed: boolean;
}

export interface MaoyanState {
  session: { loggedIn: boolean; phone: string; nick: string; avatar: string };
  city: string; // 当前城市名
  cities: City[];
  movies: Movie[];
  reviews: Review[];
  /** 想看的电影 id 列表(想看/看过互斥,qa:Q8) */
  wishMovies: string[];
  /** 看过记录:movieId -> {stars, text, ts};stars=0 表示待评价 */
  watched: Record<string, { stars: number; text: string; tags?: string[]; timestamp: number }>;
  wishShows: string[];
  cinemas: Cinema[];
  sessions: Session[];
  snacks: Snack[];
  shows: ShowEvent[];
  artists: Artist[];
  orders: Order[];
  profiles: ViewerProfile[];
  coupons: Coupon[];
  cinemaCards: CinemaCard[];
  funMerchants: FunMerchant[];
  scenics: Scenic[];
  searchHistory: string[];
  hotSearch: string[];
  wishRank: string[]; // 电影想看榜(标题)
  miaoCoins: number;
  /** 购票草稿(选座页→确认订单→收银台) */
  seatDraft: SeatDraft | null;
  /** 演出下单草稿 */
  showDraft: { showId: string; tierId: string; qty: number; viewerId: string; contact: string } | null;
  /** 收银台上下文:'movie' | 'show' */
  payContext: 'movie' | 'show';
  payMethod: string;
  /** 最近一次成功订单 id(出票页跳转用) */
  lastOrderId: string;
  /** 只记录任务要求但不天然落业务实体的浏览证据，供 verifier 判定。 */
  taskAudit: {
    expandedSynopsisMovieId?: string;
    cinemaBrowse?: { sort: string; service: string };
    cinemaSchedule?: { cinemaId: string; movieId: string; dayOffset: number };
    viewedShowNoticeId?: string;
  };
}

export interface MaoyanActions {
  login: (phone: string) => void;
  logout: () => void;
  switchCity: (name: string) => void;
  // 想看/看过/评分
  toggleWishMovie: (movieId: string) => void;
  toggleWishShow: (showId: string) => void;
  publishReview: (movieId: string, stars: number, text: string, tags?: string[]) => void;
  toggleReviewLike: (reviewId: string) => void;
  followArtist: (showId: string) => void;
  // 搜索
  submitSearch: (q: string) => void;
  clearSearchHistory: () => void;
  // 影院
  toggleCinemaFav: (cinemaId: string) => void;
  // 选座购票
  startSeatDraft: (sessionId: string) => void;
  toggleSeat: (seat: string) => boolean; // 返回是否成功(上限6)
  applyRecommendSeats: (n: number, free: string[]) => void;
  clearSeats: () => void;
  setAgreed: (v: boolean) => void;
  toggleDraftSnack: (snackId: string) => void;
  switchDraftSession: (sessionId: string) => void;
  // 演出购票
  startShowDraft: (showId: string) => void;
  setShowDraft: (patch: Partial<{ tierId: string; qty: number; viewerId: string; contact: string }>) => void;
  // 支付
  setPayContext: (ctx: 'movie' | 'show') => void;
  setPayMethod: (m: string) => void;
  confirmPay: () => string; // 生成订单,返回订单 id
  // 影城卡
  /** 开卡:autoRenew=true 表示连续续费(单独开卡),false 为随票加购的首期卡 */
  buyCard: (cardId: string, autoRenew: boolean) => void;
  /** 开关自动续费 */
  toggleCardAutoRenew: (cardId: string) => void;
  /** 确认订单页勾选/取消随票加购影城卡 */
  setDraftCard: (cardId: string) => void;
  // 观演人
  addProfile: (name: string, idNo: string) => void;
  removeProfile: (id: string) => void;
  recordSynopsisExpanded: (movieId: string) => void;
  recordCinemaBrowse: (patch: Partial<{ sort: string; service: string }>) => void;
  recordCinemaSchedule: (cinemaId: string, movieId: string, dayOffset: number) => void;
  recordShowNoticeViewed: (showId: string) => void;
}
