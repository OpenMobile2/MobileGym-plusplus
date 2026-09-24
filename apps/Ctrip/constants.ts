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
export const DATA_VERSION = 1;

/** 底部 4 Tab(spec chrome.tabbar;真实App有「社区」,本复刻按用户决定砍掉)。path 与 navigation.declaration 对齐 */
export const MAIN_TABS = [
  { id: 'home', path: '/', label: '首页' },
  { id: 'message', path: '/message', label: '消息' },
  { id: 'trip', path: '/trip', label: '行程' },
  { id: 'mine', path: '/mine', label: '我的' },
] as const;

/** 首页金刚区(spec home.main)。kind: page=进真页, toast=暂未开放 */
export const KINGKONG = [
  { id: 'hotel', label: '酒店', icon: 'IcHotel', color: '#FF7A45', kind: 'page', transitionId: 'home.hotel-open' },
  { id: 'guide', label: '攻略/景点', icon: 'IcGuide', color: '#FF9F45', kind: 'page', transitionId: 'home.dest-open' },
  { id: 'flight', label: '机票', icon: 'IcFlight', color: '#3B9BFF', kind: 'page', transitionId: 'home.flight-open' },
  { id: 'train', label: '火车票', icon: 'IcTrain', color: '#7B7BFF', kind: 'page', transitionId: 'home.train-open' },
  { id: 'tour', label: '旅游/定制', icon: 'IcTour', color: '#37C7A0', kind: 'toast' },
  { id: 'homestay', label: '民宿/客栈', icon: 'IcHomestay', color: '#FF7A45', kind: 'page', transitionId: 'home.hotel-open' },
  { id: 'ticket', label: '门票/玩乐', icon: 'IcTicket', color: '#FF9F45', kind: 'page', transitionId: 'home.ticket2-open' },
  { id: 'pickup', label: '接送机/包车', icon: 'IcPickup', color: '#3B9BFF', kind: 'page', transitionId: 'home.carpickup-open' },
  { id: 'car', label: '租车自驾', icon: 'IcCar', color: '#7B7BFF', kind: 'page', transitionId: 'home.car-open' },
  { id: 'group', label: '跟团游', icon: 'IcGroup', color: '#37C7A0', kind: 'toast' },
] as const;

/** 首页本地 feed 子 tab */
export const HOME_FEED_TABS = ['全世界', '上海', '附近', '景点', '住宿', '美食'] as const;

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
  { id: 'bankcard', label: '招商银行储蓄卡(8969)', sub: '程支付', recommend: true },
  { id: 'alipay', label: '支付宝支付', sub: '' },
] as const;

export const WONTFIX_TOAST = '该功能暂未开放';
