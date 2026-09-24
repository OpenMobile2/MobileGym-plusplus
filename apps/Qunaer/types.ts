export interface Session {
  loggedIn: boolean;
  name: string;
  level: string;
  phone: string;
  avatar: string;
}

export interface Passenger {
  id: string;
  name: string;
  type: string;
  idNo: string;
  phone: string;
}

export interface HotelItem {
  id: string;
  name: string;
  score: number;
  reviews: number;
  distance: string;
  price: number;
  image: string;
}

export interface ScenicItem {
  id: string;
  name: string;
  score: number;
  distance: string;
  price: number;
  image: string;
}

export interface WorldItem {
  id: string;
  title: string;
  author: string;
  likes: number;
  image: string;
  city?: string;
}

export type OrderStatus = '待支付' | '待出行' | '已完成' | '已取消';

export interface TravelOrder {
  id: string;
  kind: string;
  title: string;
  status: OrderStatus;
  amount: number;
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export type CityTarget = 'hotel' | 'flight-from' | 'flight-to' | 'train-from' | 'train-to';

export interface PendingBooking {
  kind: string;
  title: string;
  amount: number;
}

// 用户在详情页选中的具体房型/舱位/席别，携带单价，供下单页计算总价。
export interface SelectedRoom {
  title: string;
  price: number;
}

// 机票舱位 / 火车席别的选中项，和 SelectedRoom 同构但语义独立，避免与酒店房型串味。
export type SelectedFare = SelectedRoom;

// 下单页把「按晚数/间数/人数」算好的最终金额写回，收银台据此出单。
export interface BookingDraft {
  title: string;
  amount: number;
}

// 往返机票/火车的单程航段（去程或返程）。
export interface RoundTripLeg {
  d: string;
  a: string;
  carrier: string;
  price: number;
  date: string;
  from: string;
  to: string;
}

// 往返选择：去程 + 返程两段，供舱位确认页与下单页合并计价。
export interface RoundTripSelection {
  train: boolean;
  depart: RoundTripLeg;
  return: RoundTripLeg;
}

// 民宿 / 海外酒店 频道的位置·日期·人数选择，跨频道页 → 详情页 → 下单页共享，用于按晚数×间数计价。
export interface StaySelection {
  city: string;
  overseas: boolean;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  guests: number;
}

// 租车频道的取车城市·取还时间·天数，供车型列表按天数计价。
export interface CarSelection {
  city: string;
  dropCity: string;
  pickup: string;
  ret: string;
  days: number;
}

// 接送机的下车点与里程，里程越远接送价越高（下车点由用户填写/选择）。
export interface TransferSelection {
  mode: 'pickup' | 'dropoff';
  airport: string;
  flight: string;
  time: string;
  drop: string;
  distanceKm: number;
}

export interface SearchState {
  fromCity: string;
  toCity: string;
  hotelCity: string;
  trainFrom: string;
  trainTo: string;
  departDate: string;
  returnDate: string;
  hotelCheckIn: string;
  hotelCheckOut: string;
  hotelKeyword: string;
  tripType: string;
  trainTripType: string;
  trainHighSpeed: boolean;
  vacationCity: string;
}

export interface ActionRecord {
  id: string;
  label: string;
  timestamp: number;
}

export interface QunaerState {
  session: Session;
  search: SearchState;
  passengers: Passenger[];
  selectedPassengerIds: string[];
  hotels: HotelItem[];
  scenics: ScenicItem[];
  world: WorldItem[];
  orders: TravelOrder[];
  favorites: string[];
  actionLog: ActionRecord[];
  selected: Record<string, number>;
  lastFeedback: string;
  lastOrderId: string;
  currentOrderId: string;
  pendingOrderId: string;
  pendingBooking: PendingBooking | null;
  selectedRoom: SelectedRoom | null;
  selectedFare: SelectedFare | null;
  bookingDraft: BookingDraft | null;
  roundTrip: RoundTripSelection | null;
  stay: StaySelection;
  car: CarSelection;
  transfer: TransferSelection;
  collectedWorld: string[];
  cityTarget: CityTarget;
  dateTarget: 'depart' | 'return';
  editingPassengerId: string | null;
  currentWorldId: string | null;
  chat: { ai: ChatMessage[]; merchant: ChatMessage[] };
  settings: { language: string; tripSync: boolean };
}

export interface QunaerActions {
  recordAction: (id: string, label: string) => void;
  recordNavigation: (id: string) => void;
  clearFeedback: () => void;
  addPassenger: (name: string, idNo: string) => void;
  togglePassengerSelected: (id: string) => void;
  setCity: (target: CityTarget, city: string) => void;
  setCityTarget: (target: CityTarget) => void;
  cancelOrder: (orderId: string) => void;
  setCurrentOrder: (orderId: string) => void;
  setPendingOrder: (orderId: string) => void;
  sendChat: (thread: 'ai' | 'merchant', text: string) => void;
  setDepartDate: (date: string) => void;
  setReturnDate: (date: string) => void;
  setHotelDates: (checkIn: string, checkOut: string) => void;
  setHotelKeyword: (keyword: string) => void;
  setSelectedRoom: (room: SelectedRoom | null) => void;
  setSelectedFare: (fare: SelectedFare | null) => void;
  setBookingDraft: (draft: BookingDraft | null) => void;
  setRoundTrip: (selection: RoundTripSelection | null) => void;
  setStay: (patch: Partial<StaySelection>) => void;
  setCar: (patch: Partial<CarSelection>) => void;
  setTransfer: (patch: Partial<TransferSelection>) => void;
  toggleWorldCollect: (id: string) => void;
  setTripType: (value: string) => void;
  setTrainTripType: (value: string) => void;
  setTrainHighSpeed: (value: boolean) => void;
  setVacationCity: (city: string) => void;
  setDateTarget: (target: 'depart' | 'return') => void;
  swapTrainCities: () => void;
  setEditingPassenger: (id: string | null) => void;
  setCurrentWorld: (id: string) => void;
}
