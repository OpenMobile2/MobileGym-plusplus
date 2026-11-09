// apps/Didi/types.ts —— 状态模型(spec v0.3.0)。时间戳一律绝对 Unix 毫秒(TimeService)。

export interface DidiUser {
  id: string;
  name: string;
  phone: string;        // 1**********
  realName: string;     // **
  vLevel: number;       // V3
  growth: number;       // 成长值
  balance: number;      // 钱包余额(元)
  couponCount: number;
  tripCardCount: number;
  insuranceQuota: number; // 保障金(元)
  loanQuota: number;      // 借钱额度(元)
}

export interface DidiAddress {
  id: string;
  label: '家' | '公司' | '常用' | '历史';
  name: string;
  address: string;
  distanceKm: number;
  metro?: string; // 轨道交通标签
}

export interface DidiCarType {
  id: string;
  name: string;
  tag?: string;        // 折 / 惠 / 拼 / 省
  desc?: string;       // 站点拼车更便宜 / 包含19种车型
  etaSec?: number;     // N秒
  price: number;       // 一口价(元)
  discount?: number;   // 已优惠(元)
  checked: boolean;    // 勾选同呼
  callDirect?: boolean; // 「去呼叫」按钮样式(拼车类)
  priceSuffix?: string; // 起 / 打表计价
}

export interface DidiCarGroup {
  id: string;          // recommend / carpool / special / fast / comfort / six
  name: string;        // 推荐 / 拼车 / 特价出发 / 快速出发 / 舒适出发 / 六座
  rail: string;        // 左侧分类栏短名:推荐/拼车/特价/快速/舒适/六座
  types: DidiCarType[];
}

export interface DidiCoupon {
  id: string;
  title: string;
  amountText: string;  // ¥7 / 7折 / ¥7.1
  condition: string;
  expire: string;      // 2027/05/30 前
  category: 'travel' | 'owner' | 'delivery' | 'finance';
  usable: boolean;
  count?: number;      // ×3
}

export interface DidiRating {
  level: 'bad' | 'mid' | 'good';
  tags: string[];
  anonymous: boolean;
  text: string;
}

export interface DidiOrder {
  id: string;
  status: 'completed' | 'canceled' | 'toDepart' | 'unpaid';
  carType: string;      // 特惠快车 / 快车 / 滴滴特快
  from: string;
  to: string;
  via?: string;         // 途经点
  createdAt: number;
  fare: number;         // 实付
  estFare?: number;     // 预估
  discount?: number;    // 已优惠
  distanceKm: number;
  durationMin: number;
  payMethod: string;    // 免密支付
  rated: boolean;
  rating: DidiRating | null;
  invoiced: boolean;
}

export interface DidiMessageItem {
  title: string;
  body: string;
  time: string; // 展示串(2026-07-04 19:22)
}

export interface DidiMessageThread {
  id: string;
  kind: 'safety' | 'rental' | 'enterprise' | 'insurance' | 'pay';
  title: string;
  unread: number;
  preview: string;
  items: DidiMessageItem[];
}

export interface DidiChatMsg {
  from: 'me' | 'driver';
  text: string;
  time: string;
}

export interface DidiDriverChat {
  id: string;
  driver: string;      // 演示司机01
  badge: string;       // 快车 / 特惠快车
  plate: string;
  lastMsg: string;
  time: string;
  deleted: boolean;
  msgs: DidiChatMsg[];
}

export interface DidiDriver {
  name: string;        // 演示司机01
  plate: string;       // 测试·A001
  plateColor: string;  // 黑 / 蓝
  rating: number;      // 5.0
  tags: string[];      // 一年内新车 / 宽敞大车
}

export type TripPhase = 'idle' | 'waiting' | 'driver' | 'ongoing' | 'finished' | 'canceled';

export interface DidiLatLng {
  lat: number;
  lng: number;
}

export type DidiRouteLabelKey = 'fastest' | 'shortest' | 'noToll' | 'fewLights' | 'alternate';

/** 真实路网算出的候选路线（几何来自 Map 应用的离线 Google 路线快照）。 */
export interface DidiRouteOption {
  id: string;                   // r1/r2/r3
  labelKey: DidiRouteLabelKey;
  label: string;
  recommended: boolean;
  points: DidiLatLng[];         // 真实折线
  distanceKm: number;
  durationMin: number;
  trafficLights: number;
  tollFee: number;              // 高速路桥费(元)
}

export interface DidiTrip {
  phase: TripPhase;
  from: string;
  to: string;
  fromLatLng: DidiLatLng | null;  // 真实起点坐标(上车点)
  toLatLng: DidiLatLng | null;    // 真实终点坐标
  distanceKm: number;
  durationMin: number;
  estMin: number;       // 预估价低
  estMax: number;       // 预估价高
  fare: number;         // 成单一口价
  discount: number;
  carType: string;      // 本次呼叫成交/计价车型名
  driver: DidiDriver | null;
  appended: string[];   // 追加车型 id
  waypoints: string[];
  routeId: string;      // r1/r2/r3
  routePref: string;    // smart/time/cheap
  routeOptions: DidiRouteOption[]; // 当前起终点的真实候选路线
  orderId: string | null; // 完成后生成的订单
}

export interface DidiPayChannel {
  id: string;
  name: string;
  on: boolean;
}

export interface DidiCancelReasonGroup {
  group: string;       // 平台原因 / 司机原因 / 我的原因
  options: string[];
}

export interface DidiFaq {
  id: string;
  q: string;
  a: string;
}

export interface DidiSettings {
  realtimeTraffic: boolean;
  splashTips: boolean;
  vibrate: boolean;
  shakeAds: boolean;
  elderMode: boolean;
  clipboardRead: boolean;
  skin: string;          // default / wanganyu / football
  autoShareTrip: boolean;
  emergencyContacts: string[];
  cacheMB: number;
  /** 是否已设置支付密码（getState 可见） */
  payPasswordSet: boolean;
}

export interface DidiState {
  user: DidiUser;
  /** Session-only system album URI. Kept out of persistence by privacy.ts. */
  avatarUri: string | null;
  addresses: DidiAddress[];
  carGroups: DidiCarGroup[];
  coupons: DidiCoupon[];
  orders: DidiOrder[];
  messageThreads: DidiMessageThread[];
  driverChats: DidiDriverChat[];
  payChannels: DidiPayChannel[];
  cancelReasons: DidiCancelReasonGroup[];
  rateTagsGood: string[];
  rateTagsBad: string[];
  helpFaqs: DidiFaq[];
  settings: DidiSettings;

  // ---- 运行时 ----
  trip: DidiTrip;
  destQuery: string;
  pickupPoint: string;
  mapPickerSource: 'home' | 'destination';
  placeSearchTarget: 'destination' | 'pickup';
  /** 地点搜索是否从上车点/目的地地图打开（返回应回到地图而不是首页） */
  placeSearchFromMap: boolean;
  mapPickerMode: 'destination' | 'pickup';
  mapAnchorId: string;
  selectedMapPlaceId: string;
  selectedPickupId: string;
  // 评价草稿(trip.finish / order.detail 共用,按 currentOrderId)
  currentOrderId: string | null;
  rateLevel: 'bad' | 'mid' | 'good' | null;
  rateTags: string[];
  rateAnonymous: boolean;
  rateText: string;
  // 取消流
  cancelKeep: boolean;        // 挽留层可见
  cancelPicked: string[];     // 已勾选原因
  // 列表/筛选 UI
  tripsSection: 'mine' | 'all'; // 我的行程(空态) / 全部订单
  tripsTab: 'all' | 'completed' | 'unrated' | 'toDepart' | 'unpaid' | 'canceled';
  tripsFilterTypes: string[];
  couponsCat: 'all' | 'travel' | 'owner' | 'delivery' | 'finance';
  msgTab: 'chat' | 'pay';
  hitchTab: 'passenger' | 'owner';
  reserveTab: 'reserve' | 'airport' | 'charter';
  reserveTime: string | null;
  deliveryTab: 'cargo' | 'move';
  familyTab: 'iPay' | 'payMe';
  feeStep: 'order' | 'accept' | 'trip' | 'pay';
  couponsClaimed: boolean;   // 行程结束页 4张5折券
  // 发票流
  invoiceSelected: string[];
  invoiceHeadType: 'company' | 'org' | 'personal';
  invoiceFields: Record<string, string>;
  invoiceItinerary: boolean;
  invoiceApplications: {
    id: string; orderIds: string[]; headType: 'company' | 'org' | 'personal';
    fields: Record<string, string>; itinerary: boolean; submittedAt: number;
  }[];
  taskAudit: { viewedCouponId?: string };
  // 当前打开的消息线程/会话
  currentThreadId: string | null;
  currentChatId: string | null;
  currentFaqId: string | null;
  lastToast: string | null;
}

export interface DidiActions {
  toast: (msg: string | null) => void;

  // 叫车链路
  setDestQuery: (q: string) => void;
  setPickup: (p: string) => void;
  setMapPickerSource: (source: DidiState['mapPickerSource']) => void;
  setPlaceSearchTarget: (target: DidiState['placeSearchTarget'], fromMap?: boolean) => void;
  setMapPickerMode: (mode: DidiState['mapPickerMode']) => void;
  focusMapPlace: (placeId: string) => void;
  choosePickupPlace: (placeId: string) => void;
  selectPickupCandidate: (placeId: string, pickupId: string) => void;
  selectMapDestination: (placeId: string) => void;
  chooseDest: (name: string) => void;              // 设定终点+预估
  toggleCarType: (typeId: string) => void;
  callCars: () => void;                            // → waiting
  appendCarType: (typeId: string) => void;
  confirmAppendCarTypes: (typeIds: string[]) => void;
  driverAccept: () => void;                        // → driver
  startTrip: () => void;                           // → ongoing
  arriveTrip: () => void;                          // → finished,生成订单(免密扣款)
  addWaypoint: (name: string) => void;
  /** 路网图异步就绪后按当前起终点补算真实路线 */
  refreshRouteOptions: () => void;
  setRoute: (routeId: string) => void;
  setRoutePref: (pref: string) => void;
  changeDest: (name: string) => void;
  resetTrip: () => void;                           // 回 idle(评完/取消完)

  // 取消流
  showCancelKeep: (v: boolean) => void;
  confirmCancel: () => void;                       // → canceled
  toggleCancelReason: (opt: string) => void;
  submitCancelSurvey: () => void;

  // 评价(作用于 currentOrderId)
  setCurrentOrderId: (orderId: string | null) => void;
  openRate: (orderId: string) => void;
  setRateLevel: (l: 'bad' | 'mid' | 'good') => void;
  toggleRateTag: (t: string) => void;
  setRateAnonymous: (v: boolean) => void;
  setRateText: (t: string) => void;
  submitRate: (quick?: boolean) => void;
  claimFinishCoupons: () => void;
  claimHomeCoupons: () => void;

  // 订单/发票
  setTripsSection: (s: 'mine' | 'all') => void;
  setTripsTab: (t: DidiState['tripsTab']) => void;
  toggleTripsFilterType: (t: string) => void;
  resetTripsFilter: () => void;
  toggleInvoiceTrip: (orderId: string) => void;
  setInvoiceSelected: (orderIds: string[]) => void;
  setInvoiceHeadType: (t: 'company' | 'org' | 'personal') => void;
  setInvoiceField: (k: string, v: string) => void;
  clearInvoiceDraft: () => void;
  toggleInvoiceItinerary: () => void;
  submitInvoice: () => void;
  recordCouponViewed: (couponId: string) => void;

  // 消息/聊天
  setMsgTab: (t: 'chat' | 'pay') => void;
  markMessagesRead: () => void;
  clearMessages: () => void;
  clearMessageThread: (id: string) => void;
  openThread: (id: string) => void;
  deleteChat: (id: string) => void;
  sendChat: (chatId: string, text: string) => void;
  openChat: (id: string | null) => void;
  openTripChat: () => void;                        // 打开当前行程司机会话

  // 钱包/券/支付
  setCouponsCat: (c: DidiState['couponsCat']) => void;
  togglePayChannel: (id: string) => void;
  setFamilyTab: (t: 'iPay' | 'payMe') => void;

  // 着陆页 UI
  setHitchTab: (t: 'passenger' | 'owner') => void;
  setReserveTab: (t: 'reserve' | 'airport' | 'charter') => void;
  setReserveTime: (t: string | null) => void;
  setDeliveryTab: (t: 'cargo' | 'move') => void;
  setFeeStep: (s: DidiState['feeStep']) => void;

  // 设置/安全
  toggleSetting: (key: keyof DidiSettings) => void;
  setPayPasswordConfigured: (on: boolean) => void;
  setSkin: (skin: string) => void;
  clearCache: () => void;
  clearPrivateData: () => void;
  addEmergencyContact: (name: string) => void;
  setAddress: (label: '家' | '公司', name: string) => void;
  setUserName: (name: string) => void;
  setAvatarUri: (uri: string | null) => void;
  openFaq: (id: string | null) => void;
}
