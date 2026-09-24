/**
 * Taobao 结构性常量
 *
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
 * 每次修改 defaults.json 必须递增;persistName = `taobao_v${DATA_VERSION}`,
 * 版本变化清空 localStorage 强制重载种子数据。
 */
export const DATA_VERSION = 3;

/** 底部 TabBar(spec: chrome.tabbar) */
export const MAIN_TABS = [
  { id: 'home', path: '/', label: '首页', transitionId: 'tabbar.home-open' },
  { id: 'video', path: '/video', label: '视频', transitionId: 'tabbar.video-open' },
  { id: 'message', path: '/messages', label: '消息', transitionId: 'tabbar.message-open' },
  { id: 'cart', path: '/cart', label: '购物车', transitionId: 'tabbar.cart-open' },
  { id: 'mine', path: '/me', label: '我的淘宝', transitionId: 'tabbar.mine-open' },
] as const;

/** 首页顶部频道 Tab(spec: home.feed uiStates;非 recommend 为静态/轻实现) */
export const HOME_CHANNELS = [
  { id: 'follow', label: '关注' },
  { id: 'recommend', label: '推荐' },
  { id: 'flash', label: '闪购', tag: '外卖' },
  { id: 'gov', label: '国补' },
  { id: '618', label: '618' },
  { id: 'fliggy', label: '飞猪' },
  { id: 'outfit', label: '穿搭' },
] as const;

/** 首页金刚区(wontfix:仅展示) */
export const KINGKONG_GRID = [
  { id: 'farm', label: '芭芭农场', color: '#22C55E' },
  { id: 'card', label: '省钱卡', color: '#F59E0B' },
  { id: 'flash', label: '淘宝闪购', color: '#EF4444' },
  { id: 'global', label: '天猫国际', color: '#8B5CF6' },
  { id: 'cainiao', label: '菜鸟驿站', color: '#0EA5E9' },
  { id: 'signin', label: '红包签到', color: '#F43F5E' },
  { id: 'trial', label: '试用领取', color: '#F97316' },
  { id: 'factory', label: '淘工厂', color: '#E11D48' },
  { id: 'calendar', label: '活动日历', color: '#06B6D4' },
  { id: 'recharge', label: '充值中心', color: '#3B82F6' },
] as const;

/** 订单状态 Tab(spec: orders.list) */
export const ORDER_TABS = [
  { id: 'all', label: '全部' },
  { id: 'pendingPayment', label: '待付款' },
  { id: 'pendingShip', label: '待发货' },
  { id: 'shipped', label: '待收货' },
  { id: 'review', label: '评价' },
  { id: 'refund', label: '退款/售后' },
] as const;

/** 地址标签(spec: address.edit) */
export const ADDRESS_TAGS = ['家', '公司', '学校', '父母', '朋友'] as const;

/** 售后类型(spec: orders.refundTypePanel) */
export const REFUND_TYPES = [
  { id: 'refund', label: '退货/退款', desc: '建议先与商家协商一致' },
  { id: 'exchange', label: '换货', desc: '需要更换商品' },
  { id: 'resend', label: '补寄', desc: '商品少件/漏件,需要补寄' },
  { id: 'priceGuard', label: '价保', desc: '买贵了申请价保退差额' },
] as const;

/** 退款原因列表(qa:Q2 仅原因必填) */
export const REFUND_REASONS = [
  '不想要了',
  '空包裹',
  '未按约定时间发货',
  '快递/物流一直未送达',
  '货物破损已拒签',
  '质量问题',
  '与商品描述不符',
] as const;

/** 搜索排序项(spec: search.result) */
export const SORT_OPTIONS = [
  { id: 'default', label: '综合' },
  { id: 'sales', label: '销量' },
  { id: 'price', label: '价格' },
] as const;
