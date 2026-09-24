/**
 * 卡皮记账 结构性常量
 *
 * OS 宿主约束数值来源:os/data/simulatorConfig.ts —— OS 层更新时同步。
 */
export const OS = {
  STATUS_BAR_H: 40, // pt-10
  GESTURE_BAR_H: 16, // h-4
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
} as const;

/**
 * 每次修改 defaults.json 必须递增;persistName = `kapi_v${DATA_VERSION}`,
 * 版本变化清空 localStorage 强制重载种子数据。
 */
export const DATA_VERSION = 1;

/** 顶部主 Tab(记录 / AI助手),非底部 TabBar */
export const TOP_TABS = [
  { id: 'record', path: '/', label: '记录', transitionId: 'ai.home.open' },
  { id: 'ai', path: '/ai', label: 'AI助手', transitionId: 'home.ai.open' },
] as const;

/** 记账输入弹层 模式 Tab(手动记账 / AI记录) */
export const RECORD_MODES = [
  { id: 'manual', label: '手动记账' },
  { id: 'ai', label: 'AI记录' },
] as const;

/** 记账输入 收支类型子 Tab */
export const RECORD_TYPES = [
  { id: 'expense', label: '支出' },
  { id: 'income', label: '收入' },
  { id: 'transfer', label: '转账' },
] as const;

/** 统计周期 Tab */
export const STATS_PERIODS = [
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'year', label: '年' },
  { id: 'custom', label: '自定义' },
] as const;

/** 分类方案管理 分段(编辑分类 / 交易方识别 / 消费内容识别) */
export const CATEGORY_EDIT_SECTIONS = [
  { id: 'edit', label: '编辑分类' },
  { id: 'payeeRule', label: '交易方识别' },
  { id: 'contentRule', label: '消费内容识别' },
] as const;

/** 优惠类型快捷标签(bill.discount) */
export const DISCOUNT_TYPES = ['平台优惠', '银行优惠', '商家优惠', '积分抵扣'] as const;

/**
 * 添加账户 类型分组(asset.addAccount,IMG_9194)
 * icon 用 Ic* 别名(见 res/icons.tsx)
 */
export const ACCOUNT_TYPE_GROUPS = [
  {
    id: 'funds',
    label: '资金账户',
    items: [
      { id: 'debit', label: '储蓄卡', icon: 'IcCard' },
      { id: 'wechat', label: '微信', icon: 'IcWechat' },
      { id: 'alipay', label: '支付宝', icon: 'IcAlipay' },
      { id: 'cash', label: '现金', icon: 'IcCash' },
      { id: 'custom', label: '自定义', icon: 'IcWallet' },
    ],
  },
  {
    id: 'credit',
    label: '信用账户',
    items: [
      { id: 'creditCard', label: '信用卡', icon: 'IcCard' },
      { id: 'huabei', label: '花呗', icon: 'IcAlipay' },
      { id: 'baitiao', label: '京东白条', icon: 'IcCard' },
      { id: 'jiebei', label: '借呗', icon: 'IcAlipay' },
    ],
  },
  {
    id: 'recharge',
    label: '充值账户',
    items: [
      { id: 'busCard', label: '公交卡', icon: 'IcBus' },
      { id: 'mealCard', label: '饭卡', icon: 'IcFood' },
    ],
  },
  {
    id: 'finance',
    label: '理财账户',
    items: [
      { id: 'stock', label: '股票', icon: 'IcTrend' },
      { id: 'fund', label: '基金', icon: 'IcChart' },
      { id: 'yuebao', label: '余额宝', icon: 'IcWallet' },
      { id: 'lingqiantong', label: '零钱通', icon: 'IcWechat' },
      { id: 'deposit', label: '定期', icon: 'IcLock' },
    ],
  },
  {
    id: 'loan',
    label: '借贷账户',
    items: [{ id: 'loan', label: '借入借出', icon: 'IcHandCoins' }],
  },
] as const;
