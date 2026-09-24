/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts,勿手改
 */
export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

/** 每次修改 defaults.json 必须递增(persistName 版本化,变更即重置本地数据) */
export const DATA_VERSION = 5;

/** 底部主 tab(spec chrome.tabbar) */
export const MAIN_TABS = [
  { id: 'home', route: '/', labelKey: 'tabHome', icon: 'IcHouse', transitionId: 'tabbar.home-open' },
  { id: 'redpacket', route: '/daily-redpacket', labelKey: 'tabRedpacket', icon: 'IcTicket', transitionId: 'tabbar.redpacket-open' },
  { id: 'messages', route: '/messages', labelKey: 'tabMessages', icon: 'IcChat', transitionId: 'tabbar.message-open' },
  { id: 'cart', route: '/cart', labelKey: 'tabCart', icon: 'IcCart', transitionId: 'tabbar.cart-open' },
  { id: 'mine', route: '/mine', labelKey: 'tabMine', icon: 'IcUser', transitionId: 'tabbar.mine-open' },
] as const;

export const MAIN_TAB_ROUTES = ['/', '/daily-redpacket', '/messages', '/cart', '/mine'];

/** 订单状态自动推进节奏(qa:Q2/Q11,单位 ms,模拟时间) */
export const ORDER_TICK = {
  UNPAID_TIMEOUT: 15 * 60_000,   // 待支付15分钟超时自动取消
  PREPARING_TO_DELIVERING: 60_000,
  DELIVERING_TO_DELIVERED: 120_000,
  REFUND_PROCESSING_TO_DONE: 60_000,
} as const;

/** 评价奖励(证据:写20字+1图得20吃货豆) */
export const REVIEW_REWARD_BEANS = 20;
export const ORDER_REWARD_BEANS = 110;

/** 看病买药 一级药品分类(label 必须与 data 的 drugCat 一致) */
export const MED_CATEGORIES: { label: string; brand: string; color: string }[] = [
  { label: '感冒发烧', brand: '泰诺', color: '#F4685F' },
  { label: '儿科用药', brand: '小葵花', color: '#4FA9E8' },
  { label: '皮肤用药', brand: '皮炎平', color: '#7BC96F' },
  { label: '肠胃消化', brand: '达喜', color: '#F5C34E' },
  { label: '维生素滋补', brand: '善存', color: '#EA9E4C' },
  { label: '五官用药', brand: '开瑞坦', color: '#57B98A' },
  { label: '医疗器械', brand: '鱼跃', color: '#6C8CD5' },
];
