/**
 * 闲鱼 结构性常量
 * OS 宿主约束数值来源:os/data/simulatorConfig.ts —— OS 层更新时同步。
 */
export const OS = {
  STATUS_BAR_H: 40, // pt-10
  GESTURE_BAR_H: 16, // h-4
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

/**
 * 每次修改 defaults.json 必须递增;persistName = `xianyu_v${DATA_VERSION}`,
 * 版本变化清空 localStorage 强制重载种子数据。
 */
export const DATA_VERSION = 4;

/** 底部 TabBar(spec: chrome.tabbar)。中间 publish 为凸起发布相机键,不是普通 tab 路由 */
export const MAIN_TABS = [
  { id: 'home', path: '/', label: '闲鱼', transitionId: 'tabbar.home-open' },
  { id: 'nearby', path: '/nearby', label: '同城', transitionId: 'tabbar.nearby-open' },
  { id: 'publish', path: '/publish', label: '', transitionId: 'tabbar.publish-open' },
  { id: 'message', path: '/messages', label: '消息', transitionId: 'tabbar.message-open' },
  { id: 'mine', path: '/me', label: '我的', transitionId: 'tabbar.mine-open' },
] as const;

/** 首页顶部分段(spec: 集市/圈子/回收 均为独立分段页,非 uiState) */
export const HOME_SEGMENTS = [
  { id: 'home', label: '首页', path: '/', transitionId: 'home.home-open' },
  { id: 'market', label: '闲鱼集市', path: '/market', transitionId: 'home.market-open' },
  { id: 'circle', label: '圈子', path: '/circle', transitionId: 'home.circle-open' },
  { id: 'recycle', label: '回收', path: '/recycle', transitionId: 'home.recycle-open' },
] as const;

/** 首页频道行(home.feed uiState channel=;非 recommend 为轻实现) */
export const HOME_CHANNELS = [
  { id: 'follow', label: '关注' },
  { id: 'recommend', label: '推荐' },
  { id: 'fresh', label: '新发' },
  { id: 'service', label: '找服务' },
  { id: 'hot', label: '热点' },
  { id: 'digital', label: '数码' },
] as const;

/** 首页金刚区(部分 wontfix:仅展示/占位) */
export const KINGKONG_GRID = [
  { id: 'redpacket', label: '领红包', color: '#FF4400', wontfix: true },
  { id: 'fun', label: '吃喝玩乐', color: '#FF8A00', wontfix: true },
  { id: 'digital', label: '手机数码', color: '#2A7FFF', keyword: '手机数码' },
  { id: 'recycle', label: '上门回收', color: '#1CB854', route: '/recycle' },
  { id: 'live', label: '闲鱼直播', color: '#FF3B30', wontfix: true },
  { id: 'rent', label: '租房', color: '#8B5CF6', wontfix: true },
] as const;

/** 买到的订单状态 Tab(spec: orders.bought) */
export const BOUGHT_TABS = [
  { id: 'all', label: '全部' },
  { id: 'pendingPayment', label: '待付款' },
  { id: 'pendingShip', label: '待发货' },
  { id: 'pendingReceipt', label: '待收货' },
  { id: 'pendingReview', label: '待评价' },
  { id: 'refunding', label: '退款中' },
] as const;

/** 卖出的订单状态 Tab(spec: orders.sold,卖家视角) */
export const SOLD_TABS = [
  { id: 'all', label: '全部' },
  { id: 'pendingPayment', label: '待付款' },
  { id: 'pendingShip', label: '待发货' },
  { id: 'pendingReceipt', label: '待收货' },
  { id: 'pendingReview', label: '待评价' },
  { id: 'completed', label: '已完成' },
] as const;

/** 我的发布 Tab(spec: mine.published) */
export const PUBLISHED_TABS = [
  { id: 'onSale', label: '在卖' },
  { id: 'draft', label: '草稿' },
  { id: 'offShelf', label: '已下架' },
] as const;

/** 商品成色(spec: publish.edit) */
export const CONDITIONS = ['全新', '几乎全新', '95新', '9成新', '8成新', '7成新及以下'] as const;

/** 支付方式(qa:Q10 支付宝 + 余额 两种可切换) */
export const PAY_METHODS = [
  { id: 'alipay', label: '支付宝', desc: '担保交易' },
  { id: 'balance', label: '余额', desc: '闲鱼余额支付' },
] as const;

/** 搜索结果排序(spec: search.result) */
export const SORT_OPTIONS = [
  { id: 'default', label: '综合' },
  { id: 'price', label: '价格' },
  { id: 'reduce', label: '降价' },
  { id: 'fresh', label: '新发' },
] as const;

/** 圈内子 tab(spec: home.circle.detail,Q1 浏览壳) */
export const CIRCLE_TABS = [
  { id: 'goods', label: '好物' },
  { id: 'market', label: '热门行情' },
  { id: 'talk', label: '交流区' },
] as const;
