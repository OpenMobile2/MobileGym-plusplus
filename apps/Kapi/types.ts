/** 卡皮记账 数据模型。所有 timestamp 为绝对 Unix 毫秒。 */

export type FlowType = 'expense' | 'income' | 'transfer';

export interface KapiUser {
  id: string;
  nick: string;
  avatar: string;
  gender: string;
  phone: string;
  appVersion: string;
  recordDays: number;
  totalRecords: number;
  streakDays: number;
}

export interface KapiCategory {
  id: string;
  name: string;
  /** res/icons.tsx ICON_REGISTRY 中的 Ic* 名 */
  icon: string;
  /** 图标圆底色 */
  color: string;
  subs?: Array<{ id: string; name: string }>;
}

export interface KapiAccount {
  id: string;
  /** ACCOUNT_TYPE_GROUPS 中的类型 id */
  type: string;
  typeLabel: string;
  name: string;
  /** 余额(信用账户为负债额) */
  balance: number;
  bank?: string;
  last4?: string;
  note?: string;
  includeInTotal: boolean;
  special: boolean;
  defaultPay: boolean;
}

export interface KapiLedger {
  id: string;
  name: string;
  type: 'personal' | 'shared';
  cover: string;
  includeInTotal: boolean;
}

export interface KapiBillDiscount {
  type: string;
  amount: number;
}

export interface KapiBillRefund {
  amount: number;
  accountId: string | null;
  date: number;
}

export interface KapiBill {
  id: string;
  type: FlowType;
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  /** 正数金额 */
  amount: number;
  note: string;
  /** 账单时间(绝对 Unix 毫秒) */
  date: number;
  ledgerId: string;
  accountId: string | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  payee?: string;
  tags: string[];
  discount?: KapiBillDiscount | null;
  refund?: KapiBillRefund | null;
  reimburse: boolean;
  excludeFlow: boolean;
  excludeBudget: boolean;
}

export interface KapiCategoryBudget {
  categoryId: string;
  amount: number;
}

export interface KapiBudget {
  monthly: number;
  /** key = 'YYYY-MM-DD' */
  daily: Record<string, number>;
  categories: KapiCategoryBudget[];
}

export interface KapiRule {
  id: string;
  kind: 'payee' | 'content';
  keyword: string;
  categoryId: string;
  categoryName: string;
}

export interface KapiAiMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  ts: number;
  /** 内嵌日预算日历卡(仅 AI 总结消息) */
  calendarCard?: boolean;
}

export interface KapiSettings {
  monthStartDay: number;
  currency: string;
  catReplyStyle: string;
  flags: {
    autoScreenshot: boolean;
    location: boolean;
    coupon: boolean;
    push: boolean;
  };
  pushItems: Record<string, boolean>;
}

/** 记账输入弹层的工作草稿(跨组件共享:分类弹层回填到此) */
export interface KapiDraft {
  type: FlowType;
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  /** 金额表达式(支持 + −),完成时求值 */
  amountExpr: string;
  note: string;
  date: number;
  ledgerId: string;
  accountId: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
  discount: KapiBillDiscount | null;
}

export interface KapiState {
  user: KapiUser;
  ledgers: KapiLedger[];
  currentLedgerId: string;
  accounts: KapiAccount[];
  categories: { expense: KapiCategory[]; income: KapiCategory[] };
  bills: KapiBill[];
  budget: KapiBudget;
  rules: KapiRule[];
  aiMessages: KapiAiMessage[];
  searchHistory: string[];
  settings: KapiSettings;
  /** 金额可见性(眼睛图标) */
  amountVisible: boolean;
  /** 首页顶卡视图 */
  topCardView: 'budget' | 'flow';
  /** sheet 上下文:当前操作的账单 id */
  _activeBillId: string | null;
  /** 记账工作草稿 */
  _draft: KapiDraft;
  /** 分类弹层回填目标 */
  _categoryTarget: 'record' | 'budget' | 'rule';
  /** 最近选中的分类(供 budget/rule 流读取) */
  _pickedCategoryId: string | null;
  /** 属性弹层(日期/账户/账本/优惠)的写入目标 */
  _editContext: 'draft' | 'bill';
  /** 统计页自定义区间(gate4:F5,日历弹层回填) */
  _statsRange: { start: number; end: number } | null;
}

export type BillDraft = Omit<KapiBill, 'id'>;

export interface KapiActions {
  addBill: (draft: BillDraft) => string;
  deleteBill: (id: string) => void;
  updateBill: (id: string, patch: Partial<KapiBill>) => void;
  toggleBillFlag: (id: string, flag: 'reimburse' | 'excludeFlow' | 'excludeBudget') => void;
  setActiveBill: (id: string | null) => void;

  setCurrentLedger: (id: string) => void;
  addLedger: (draft: Omit<KapiLedger, 'id'>) => string;

  addAccount: (draft: Omit<KapiAccount, 'id'>) => string;

  setMonthlyBudget: (amount: number) => void;
  setDailyBudget: (dateKey: string, amount: number) => void;
  addCategoryBudget: (categoryId: string, amount: number) => void;

  addRule: (kind: 'payee' | 'content', keyword: string, categoryId: string, categoryName: string) => void;

  sendAiMessage: (text: string) => void;

  toggleAmountVisible: () => void;
  setTopCardView: (view: 'budget' | 'flow') => void;

  toggleSettingFlag: (key: keyof KapiSettings['flags']) => void;
  togglePushItem: (key: string) => void;
  updateProfile: (field: keyof KapiUser, value: string) => void;
  purgeAllBills: () => void;

  addSearchHistory: (q: string) => void;

  draftReset: (type?: FlowType) => void;
  draftPatch: (patch: Partial<KapiDraft>) => void;
  draftAmountKey: (key: string) => void;
  draftCommit: () => string | null;
  setCategoryTarget: (target: 'record' | 'budget' | 'rule') => void;
  pickCategory: (categoryId: string) => void;
  setEditContext: (ctx: 'draft' | 'bill') => void;
  /** 属性弹层统一回填:按 _editContext 写入 draft 或 active bill */
  applyAttr: (patch: Partial<KapiBill> & Partial<KapiDraft>) => void;
  /** 设置统计自定义区间(gate4:F5) */
  setStatsRange: (range: { start: number; end: number } | null) => void;
}
