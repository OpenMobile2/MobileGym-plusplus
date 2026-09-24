/** Ctrip 应用类型。时间戳一律绝对 Unix 毫秒(见 module-contract)。资源路径 /@app-assets/Ctrip/... */

export interface CtripUser {
  name: string;
  memberLevel: string;       // 铂金贵宾
  points: number;            // 积分
  avatar: string;
  phone: string;
  favorites: number;
  footprints: number;
  coupons: number;
}

export interface Hotel {
  id: string;
  name: string;
  image: string;            // 列表/封面主图
  gallery: string[];        // 详情相册
  star: number;             // 钻级 2-5
  score: number;            // 评分 4.8
  reviewCount: number;
  city: string;
  district: string;
  tags: string[];           // 免费停车场/拍照出片...
  price: number;            // 起价
  oldPrice?: number;
  rankLabel?: string;       // 西湖风景区高档酒店榜 No.18
  lat?: number; lng?: number;
  facilities: string[];
  openYear?: string;
  rooms: HotelRoom[];
}

export interface HotelRoom {
  id: string;
  name: string;             // 雅致大床房-回弹Spa记忆枕
  image: string;
  bed: string;              // 1张1.8米大床
  area: string;             // 25㎡
  occupancy: string;        // 2人入住
  breakfast: string;        // 无早餐/1份早餐/2份早餐
  price: number;
  cancelPolicy: string;     // 入住当天12:00前可免费取消
  remaining: number;        // 仅剩2间
}

export interface HotelReview {
  id: string;
  user: string;
  avatar: string;
  level: string;            // 黄金贵宾
  score: number;
  date: string;
  roomType: string;
  content: string;
  images: string[];
}

export interface Train {
  id: string;
  trainNo: string;          // G986
  from: string; to: string;
  depart: string; arrive: string;  // 07:05 / 12:21
  duration: string;         // 5时16分
  type: string;             // 复兴号/高铁
  seats: TrainSeat[];
  stops: TrainStop[];
}
export interface TrainSeat { name: string; price: number; status: string; }   // 二等座/有票
export interface TrainStop { station: string; arrive: string; depart: string; stay: string; }

export interface Flight {
  id: string;
  flightNo: string;         // HO1167
  airline: string;          // 吉祥航空
  from: string; to: string;
  fromAirport: string; toAirport: string;
  depart: string; arrive: string;
  duration: string;
  transfer?: string;        // 中转城市,直飞为空
  price: number;
  cabin: string;            // 经济舱
  petFriendly?: boolean;
}

export interface Attraction {
  id: string;
  name: string;
  image: string;
  gallery: string[];
  score: number;
  reviewCount: string;      // 30.5万条点评
  hot: number;              // 热度 10
  district: string;
  distance: string;         // 距您25.1km
  tags: string[];           // 随买随用/可订今日
  ticketTypes: TicketType[];
  intro: string;
  openTime: string;         // 08:30-21:30开放
}
export interface TicketType {
  id: string;
  name: string;             // 成人票/儿童票/青少年票
  price: number;
  desc: string;             // 不可退/无需取票
}

export interface CarModel {
  id: string;
  name: string;             // 特斯拉Model Y
  image: string;
  seats: string;            // SUV5座
  energy: string;           // 纯电动
  range: string;            // 545-821km
  pricePerDay: number;
  totalPrice: number;
  tags: string[];           // 含无忧租
  rankLabel?: string;
}

export interface CtripOrder {
  id: string;
  category: 'hotel' | 'train' | 'flight' | 'ticket' | 'car';
  title: string;            // 卡斯顿大酒店 / 上海→潍坊
  subtitle: string;
  date: string;
  status: 'unpaid' | 'upcoming' | 'completed' | 'cancelled' | 'refunded';
  statusText: string;       // 待付款/已出票/已完成/已取消/已退款
  price: number;
  image?: string;
  refundInfo?: string;
}

export interface CtripNotification {
  id: string;
  group: string;            // 账户通知/订单出行/会员服务
  title: string;
  time: string;
  content: string;
  detail?: string;          // 查看详情展开内容
}

export interface CsMessage { role: 'user' | 'assistant'; text: string; }

export interface Traveler {
  id: string;
  name: string;
  idCard: string;           // 已掩码
  phone: string;
}

export interface CtripState {
  user: CtripUser;
  hotels: Hotel[];
  hotelReviews: Record<string, HotelReview[]>;   // hotelId -> reviews
  trains: Train[];
  flights: Flight[];
  attractions: Attraction[];
  carModels: CarModel[];
  orders: CtripOrder[];
  notifications: CtripNotification[];
  travelers: Traveler[];
  searchHistory: string[];
  favoriteHotels: string[];        // 收藏的酒店 id
  settings: Record<string, boolean>;  // 开关类设置
  // 临时下单态(收银台用,不持久化)
  _pendingOrder?: { category: CtripOrder['category']; title: string; subtitle: string; amount: number; image?: string };
  _csLog?: CsMessage[];            // 当前客服会话(volatile)
}

export interface CtripActions {
  submitSearch: (q: string) => void;
  removeSearchHistory: (w: string) => void;
  toggleHotelFavorite: (id: string) => void;
  toggleSetting: (key: string) => void;
  startBooking: (o: NonNullable<CtripState['_pendingOrder']>) => void;
  payPending: () => string;        // 返回新订单 id
  cancelOrder: (id: string) => void;
  addTraveler: (name: string, idCard: string, phone: string) => void;
  removeTraveler: (id: string) => void;
  csAsk: (text: string) => void;   // 客服模拟问答
  resetCs: () => void;
}
