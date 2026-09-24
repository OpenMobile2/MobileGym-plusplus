// 结构性常量(非用户数据)。用户数据放 data/defaults.json。

// 改动 defaults.json 时 +1,重置本地 localStorage。
export const DATA_VERSION = 2;

// 底部主 Tab(真机:首页/多多视频/618会场→复刻用百亿补贴/聊天/个人中心)
export const MAIN_TABS = [
  { id: 'home', path: '/', labelKey: 'tab_home', icon: 'IcTabHome', transitionId: 'tabbar.home-open' },
  { id: 'video', path: '/video', labelKey: 'tab_video', icon: 'IcTabVideo', transitionId: 'tabbar.video-open' },
  { id: 'subsidy', path: '/subsidy', labelKey: 'tab_subsidy', icon: 'IcTabSubsidy', transitionId: 'tabbar.subsidy-open' },
  { id: 'chat', path: '/chat', labelKey: 'tab_chat', icon: 'IcTabChat', transitionId: 'tabbar.chat-open' },
  { id: 'mine', path: '/me', labelKey: 'tab_mine', icon: 'IcTabMine', transitionId: 'tabbar.mine-open' },
] as const;

export const TAB_PATHS = MAIN_TABS.map((t) => t.path) as string[];

// 订单状态 Tab(顺序即真机)
export const ORDER_TABS = [
  { key: 'all', labelKey: 'order_all' },
  { key: 'pendingPayment', labelKey: 'order_unpaid' },
  { key: 'grouping', labelKey: 'order_group' },
  { key: 'packing', labelKey: 'order_undelivered' },
  { key: 'shipped', labelKey: 'order_unreceived' },
  { key: 'completed', labelKey: 'order_unreviewed' },
] as const;

export const SORT_TABS = [
  { key: 'comprehensive', labelKey: 'sort_comprehensive' },
  { key: 'sales', labelKey: 'sort_sales' },
  { key: 'price', labelKey: 'sort_price' },
] as const;

// 退款原因(填表用)
export const REFUND_REASONS = [
  '不想要了', '拍错/多拍', '快递问题', '商品质量问题', '商家发错货', '协商一致退款',
] as const;

// 百亿补贴频道 Tab
export const SUBSIDY_TABS = ['精选', '奢品馆', '极速达', '天天折扣'] as const;
