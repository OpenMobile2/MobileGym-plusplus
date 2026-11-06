/**
 * Ctrip 结构性常量。OS 宿主约束来源:os/data/simulatorConfig.ts。
 */
export const OS = {
  STATUS_BAR_H: 40, // pt-10
  GESTURE_BAR_H: 16, // h-4
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

/** 改 defaults.json 必须递增;persistName = `ctrip_v${DATA_VERSION}` */
export const DATA_VERSION = 10;

/** 底部 4 Tab(spec chrome.tabbar;真实App有「社区」,本复刻按用户决定砍掉)。path 与 navigation.declaration 对齐 */
export const MAIN_TABS = [
  { id: 'home', path: '/', labelKey: 'tabHome' as const },
  { id: 'message', path: '/message', labelKey: 'tabMessage' as const },
  { id: 'trip', path: '/trip', labelKey: 'tabTrip' as const },
  { id: 'mine', path: '/mine', labelKey: 'tabMine' as const },
] as const;

/** 首页金刚区(spec home.main)。kind: page=进真页, toast=暂未开放 */
export const KINGKONG = [
  { id: 'hotel', labelKey: 'kingkongHotel' as const, icon: 'IcHotel', color: '#FF7A45', kind: 'page', transitionId: 'home.hotel-open' },
  { id: 'guide', labelKey: 'kingkongGuide' as const, icon: 'IcGuide', color: '#FF9F45', kind: 'page', transitionId: 'home.dest-open' },
  { id: 'flight', labelKey: 'kingkongFlight' as const, icon: 'IcFlight', color: '#3B9BFF', kind: 'page', transitionId: 'home.flight-open' },
  { id: 'train', labelKey: 'kingkongTrain' as const, icon: 'IcTrain', color: '#7B7BFF', kind: 'page', transitionId: 'home.train-open' },
  { id: 'tour', labelKey: 'kingkongTour' as const, icon: 'IcTour', color: '#37C7A0', kind: 'toast' },
  { id: 'homestay', labelKey: 'kingkongHomestay' as const, icon: 'IcHomestay', color: '#FF7A45', kind: 'page', transitionId: 'home.homestay-open' },
  { id: 'ticket', labelKey: 'kingkongTicket' as const, icon: 'IcTicket', color: '#FF9F45', kind: 'page', transitionId: 'home.ticket2-open' },
  { id: 'pickup', labelKey: 'kingkongPickup' as const, icon: 'IcPickup', color: '#3B9BFF', kind: 'page', transitionId: 'home.carpickup-open' },
  { id: 'car', labelKey: 'kingkongCar' as const, icon: 'IcCar', color: '#7B7BFF', kind: 'page', transitionId: 'home.car-open' },
  { id: 'group', labelKey: 'kingkongGroup' as const, icon: 'IcGroup', color: '#37C7A0', kind: 'toast' },
] as const;

/** 首页本地 feed 子 tab — id 稳定，展示走 strings */
export const HOME_FEED_TABS = [
  { id: 'worldwide', labelKey: 'feedWorldwide' as const },
  { id: 'shanghai', labelKey: 'feedShanghai' as const },
  { id: 'nearby', labelKey: 'feedNearby' as const },
  { id: 'attraction', labelKey: 'feedAttraction' as const },
  { id: 'stay', labelKey: 'feedStay' as const },
  { id: 'food', labelKey: 'feedFood' as const },
] as const;

/** 酒店搜索住宿类型 tab(spec hotel.search uiStates) */
export const HOTEL_TABS = [
  { id: 'domestic', label: '国内' },
  { id: 'oversea', label: '海外' },
  { id: 'homestay', label: '民宿·短租' },
  { id: 'hourly', label: '钟点房' },
] as const;

/** 酒店列表排序(spec hotel.list) */
export const HOTEL_SORTS = [
  { id: 'popularity', label: '欢迎度排序' },
  { id: 'rating', label: '好评优先' },
  { id: 'priceAsc', label: '低价优先' },
  { id: 'priceDesc', label: '高价优先' },
  { id: 'star', label: '高星优先' },
] as const;

/** 酒店详情 tab */
export const HOTEL_DETAIL_TABS = ['封面', '亮点', '设施', '点评', '位置', '政策'] as const;

/** 火车票车次方案 tab */
export const TRAIN_TABS = [
  { id: 'recommend', label: '推荐' },
  { id: 'direct', label: '直达' },
  { id: 'transfer', label: '中转' },
  { id: 'bus', label: '汽车' },
] as const;

/** 机票行程类型 */
export const FLIGHT_TRIP_TYPES = [
  { id: 'oneway', label: '单程' },
  { id: 'roundtrip', label: '往返' },
  { id: 'multi', label: '多程' },
] as const;

/** 门票列表分类 tab */
export const TICKET_TABS = [
  { id: 'featured', label: '精选' },
  { id: 'tickets', label: '景点门票' },
  { id: 'fun', label: '玩乐/体验' },
  { id: 'dayTour', label: '一日游' },
  { id: 'boat', label: '船类体验' },
] as const;

/** 订单列表状态 tab(spec orders.list uiStates) */
export const ORDER_TABS = [
  { id: 'all', label: '全部' },
  { id: 'unpaid', label: '待付款' },
  { id: 'upcoming', label: '未出行' },
  { id: 'refund', label: '退款/售后' },
  { id: 'toReview', label: '待点评' },
] as const;

/** 支付方式(spec cashier.main) */
export const PAY_METHODS = [
  { id: 'bankcard', labelKey: 'payBankcard' as const, subKey: 'payBankcardSub' as const, recommend: true },
  { id: 'alipay', labelKey: 'payAlipay' as const, subKey: '' as const, recommend: false },
] as const;

export const WONTFIX_TOAST_KEY = 'wontfix' as const;
/** @deprecated use strings via useCtripStrings().wontfix */
export const WONTFIX_TOAST = '该功能暂未开放';
