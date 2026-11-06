/**
 * Taobao 结构性常量
 *
 * OS 宿主约束数值来源:os/data/simulatorConfig.ts —— OS 层更新时同步。
 *
 * i18n 例外说明:ADDRESS_TAGS、REFUND_TYPES.label、REFUND_REASONS 的取值会被写入
 * store(addresses.tag / refunds.refundType / refunds.reason)并被 bench_env
 * 的任务判题(taobao/defs/AddNewAddress.py、RefundOrder.py、BuyThenRefund.py 等,
 * 以及 taobao/app.py 的 TAOBAO_REFUND_REASONS)按中文原文精确匹配。这些常量因此
 * 保持中文不做 labelKey 化,与 defaults.json 中「商品标题」的例外同理——它们是
 * 判题用的业务数据,不是纯 UI 文案。其余结构性 Tab/宫格标签已迁移到 res/strings。
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
 * 每次修改 defaults.json 必须递增;persistName = `taobao_v${DATA_VERSION}`,
 * 版本变化清空 localStorage 强制重载种子数据。
 */
export const DATA_VERSION = 3;

/** 底部 TabBar(spec: chrome.tabbar)；文案走 res/strings 的 labelKey */
export const MAIN_TABS = [
  { id: 'home', path: '/', labelKey: 'tabHome', transitionId: 'tabbar.home-open' },
  { id: 'video', path: '/video', labelKey: 'tabVideo', transitionId: 'tabbar.video-open' },
  { id: 'message', path: '/messages', labelKey: 'tabMessage', transitionId: 'tabbar.message-open' },
  { id: 'cart', path: '/cart', labelKey: 'tabCart', transitionId: 'tabbar.cart-open' },
  { id: 'mine', path: '/me', labelKey: 'tabMine', transitionId: 'tabbar.mine-open' },
] as const;

/** 首页顶部频道 Tab(spec: home.feed uiStates;非 recommend 为静态/轻实现);文案走 res/strings 的 labelKey */
export const HOME_CHANNELS = [
  { id: 'follow', labelKey: 'channelFollow' },
  { id: 'recommend', labelKey: 'channelRecommend' },
  { id: 'flash', labelKey: 'channelFlash', tagKey: 'channelFlashTag' },
  { id: 'gov', labelKey: 'channelGov' },
  { id: '618', labelKey: 'channel618' },
  { id: 'fliggy', labelKey: 'channelFliggy' },
  { id: 'outfit', labelKey: 'channelOutfit' },
] as const;

/** 首页金刚区(wontfix:仅展示);文案走 res/strings 的 labelKey */
export const KINGKONG_GRID = [
  { id: 'farm', labelKey: 'kingkongFarm', color: '#22C55E' },
  { id: 'card', labelKey: 'kingkongCard', color: '#F59E0B' },
  { id: 'flash', labelKey: 'kingkongFlash', color: '#EF4444' },
  { id: 'global', labelKey: 'kingkongGlobal', color: '#8B5CF6' },
  { id: 'cainiao', labelKey: 'kingkongCainiao', color: '#0EA5E9' },
  { id: 'signin', labelKey: 'kingkongSignin', color: '#F43F5E' },
  { id: 'trial', labelKey: 'kingkongTrial', color: '#F97316' },
  { id: 'factory', labelKey: 'kingkongFactory', color: '#E11D48' },
  { id: 'calendar', labelKey: 'kingkongCalendar', color: '#06B6D4' },
  { id: 'recharge', labelKey: 'kingkongRecharge', color: '#3B82F6' },
] as const;

/** 订单状态 Tab(spec: orders.list);文案走 res/strings 的 labelKey */
export const ORDER_TABS = [
  { id: 'all', labelKey: 'orderTabAll' },
  { id: 'pendingPayment', labelKey: 'orderTabPendingPayment' },
  { id: 'pendingShip', labelKey: 'orderTabPendingShip' },
  { id: 'shipped', labelKey: 'orderTabShipped' },
  { id: 'review', labelKey: 'orderTabReview' },
  { id: 'refund', labelKey: 'orderTabRefund' },
] as const;

/**
 * 地址标签(spec: address.edit)
 * i18n 例外:写入 addresses[].tag,被 AddNewAddress.py 按中文精确匹配判题,保持原文。
 */
export const ADDRESS_TAGS = ['家', '公司', '学校', '父母', '朋友'] as const;

/**
 * 售后类型(spec: orders.refundTypePanel)
 * i18n 例外:label 会写入 refunds[].refundType,被 test_tasks.py / BuyThenRefund 等
 * 按中文「退货/退款」精确匹配判题,保持原文。
 */
export const REFUND_TYPES = [
  { id: 'refund', label: '退货/退款', desc: '建议先与商家协商一致' },
  { id: 'exchange', label: '换货', desc: '需要更换商品' },
  { id: 'resend', label: '补寄', desc: '商品少件/漏件,需要补寄' },
  { id: 'priceGuard', label: '价保', desc: '买贵了申请价保退差额' },
] as const;

/**
 * 退款原因列表(qa:Q2 仅原因必填)
 * i18n 例外:写入 refunds[].reason,被 RefundOrder.py / BuyThenRefund.py 的
 * TAOBAO_REFUND_REASONS 按中文精确匹配判题,保持原文。
 */
export const REFUND_REASONS = [
  '不想要了',
  '空包裹',
  '未按约定时间发货',
  '快递/物流一直未送达',
  '货物破损已拒签',
  '质量问题',
  '与商品描述不符',
] as const;

/** 搜索排序项(spec: search.result);文案走 res/strings 的 labelKey */
export const SORT_OPTIONS = [
  { id: 'default', labelKey: 'sortComprehensive' },
  { id: 'sales', labelKey: 'sortSales' },
  { id: 'price', labelKey: 'sortPrice' },
] as const;
