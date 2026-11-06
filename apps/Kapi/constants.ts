/**
 * 卡皮记账 结构性常量
 *
 * OS 宿主约束数值来源:os/data/simulatorConfig.ts —— OS 层更新时同步。
 * 文案统一走 res/strings 的 labelKey(spec: i18n),组件内用 `s[item.labelKey]` 解析展示。
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
export const DATA_VERSION = 2;

/** 顶部主 Tab(记录 / AI助手),非底部 TabBar */
export const TOP_TABS = [
  { id: 'record', path: '/', labelKey: 'tabRecord', transitionId: 'ai.home.open' },
  { id: 'ai', path: '/ai', labelKey: 'tabAi', transitionId: 'home.ai.open' },
] as const;

/** 记账输入弹层 模式 Tab(手动记账 / AI记录) */
export const RECORD_MODES = [
  { id: 'manual', labelKey: 'recordModeManual' },
  { id: 'ai', labelKey: 'recordModeAi' },
] as const;

/** 记账输入 收支类型子 Tab */
export const RECORD_TYPES = [
  { id: 'expense', labelKey: 'expense' },
  { id: 'income', labelKey: 'income' },
  { id: 'transfer', labelKey: 'recordTypeTransfer' },
] as const;

/** 统计周期 Tab */
export const STATS_PERIODS = [
  { id: 'week', labelKey: 'periodWeek' },
  { id: 'month', labelKey: 'periodMonth' },
  { id: 'year', labelKey: 'periodYear' },
  { id: 'custom', labelKey: 'periodCustom' },
] as const;

/** 分类方案管理 分段(编辑分类 / 交易方识别 / 消费内容识别) */
export const CATEGORY_EDIT_SECTIONS = [
  { id: 'edit', labelKey: 'categoryEditSectionEdit' },
  { id: 'payeeRule', labelKey: 'categoryEditSectionPayeeRule' },
  { id: 'contentRule', labelKey: 'categoryEditSectionContentRule' },
] as const;

/**
 * 优惠类型快捷标签(bill.discount)。id 即写入 bill.discount.type 的存储值(维持原中文,
 * 避免影响已有数据格式),labelKey 仅用于展示态的语言切换。
 */
export const DISCOUNT_TYPES = [
  { id: '平台优惠', labelKey: 'discountTypePlatform' },
  { id: '银行优惠', labelKey: 'discountTypeBank' },
  { id: '商家优惠', labelKey: 'discountTypeMerchant' },
  { id: '积分抵扣', labelKey: 'discountTypePoints' },
] as const;

/** 性别选项(profile.gender 弹层)。id 即写入 user.gender 的存储值,同理保留原中文。 */
export const GENDER_OPTIONS = [
  { id: '男', labelKey: 'genderMale' },
  { id: '女', labelKey: 'genderFemale' },
  { id: '保密', labelKey: 'genderPrivate' },
] as const;

/** 交易方搜索建议(示例商户名,业务数据,保持中文) */
export const PAYEE_SUGGESTIONS = ['老乡鸡', '喜茶', '盒马', '滴滴出行', '海底捞'];

/**
 * 添加账户 类型分组(asset.addAccount,IMG_9194)
 * icon 用 Ic* 别名(见 res/icons.tsx)
 */
export const ACCOUNT_TYPE_GROUPS = [
  {
    id: 'funds',
    labelKey: 'accountGroupFunds',
    items: [
      { id: 'debit', labelKey: 'accountTypeDebit', icon: 'IcCard' },
      { id: 'wechat', labelKey: 'accountTypeWechat', icon: 'IcWechat' },
      { id: 'alipay', labelKey: 'accountTypeAlipay', icon: 'IcAlipay' },
      { id: 'cash', labelKey: 'accountTypeCash', icon: 'IcCash' },
      { id: 'custom', labelKey: 'accountTypeCustom', icon: 'IcWallet' },
    ],
  },
  {
    id: 'credit',
    labelKey: 'accountGroupCredit',
    items: [
      { id: 'creditCard', labelKey: 'accountTypeCreditCard', icon: 'IcCard' },
      { id: 'huabei', labelKey: 'accountTypeHuabei', icon: 'IcAlipay' },
      { id: 'baitiao', labelKey: 'accountTypeBaitiao', icon: 'IcCard' },
      { id: 'jiebei', labelKey: 'accountTypeJiebei', icon: 'IcAlipay' },
    ],
  },
  {
    id: 'recharge',
    labelKey: 'accountGroupRecharge',
    items: [
      { id: 'busCard', labelKey: 'accountTypeBusCard', icon: 'IcBus' },
      { id: 'mealCard', labelKey: 'accountTypeMealCard', icon: 'IcFood' },
    ],
  },
  {
    id: 'finance',
    labelKey: 'accountGroupFinance',
    items: [
      { id: 'stock', labelKey: 'accountTypeStock', icon: 'IcTrend' },
      { id: 'fund', labelKey: 'accountTypeFund', icon: 'IcChart' },
      { id: 'yuebao', labelKey: 'accountTypeYuebao', icon: 'IcWallet' },
      { id: 'lingqiantong', labelKey: 'accountTypeLingqiantong', icon: 'IcWechat' },
      { id: 'deposit', labelKey: 'accountTypeDeposit', icon: 'IcLock' },
    ],
  },
  {
    id: 'loan',
    labelKey: 'accountGroupLoan',
    items: [{ id: 'loan', labelKey: 'accountTypeLoanType', icon: 'IcHandCoins' }],
  },
] as const;
