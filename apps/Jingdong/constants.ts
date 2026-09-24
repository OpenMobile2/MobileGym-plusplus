// 结构性常量(非用户数据)。用户数据放 data/defaults.json。
export const DATA_VERSION = 5;

// 底部主 Tab(真机:首页/逛/消息/购物车/我的)
export const MAIN_TABS = [
  { id: 'home', path: '/', labelKey: 'tab_home', icon: 'IcTabHome', transitionId: 'tabbar.home-open' },
  { id: 'discover', path: '/discover', labelKey: 'tab_discover', icon: 'IcTabDiscover', transitionId: 'tabbar.discover-open' },
  { id: 'message', path: '/messages', labelKey: 'tab_message', icon: 'IcTabChat', transitionId: 'tabbar.message-open' },
  { id: 'cart', path: '/cart', labelKey: 'tab_cart', icon: 'IcTabCart', transitionId: 'tabbar.cart-open' },
  { id: 'mine', path: '/me', labelKey: 'tab_mine', icon: 'IcTabMine', transitionId: 'tabbar.mine-open' },
] as const;

export const TAB_PATHS = MAIN_TABS.map((t) => t.path) as string[];

// 订单状态 Tab(真机:全部/待付款/待收货/待使用/已完成)
export const ORDER_TABS = [
  { key: 'all', labelKey: 'order_all' },
  { key: 'unpaid', labelKey: 'order_unpaid' },
  { key: 'undelivered', labelKey: 'order_undelivered' },
  { key: 'unused', labelKey: 'order_unused' },
  { key: 'done', labelKey: 'order_done' },
] as const;

export const SORT_TABS = [
  { key: 'comprehensive', labelKey: 'sort_comprehensive' },
  { key: 'sales', labelKey: 'sort_sales' },
  { key: 'price', labelKey: 'sort_price' },
] as const;
