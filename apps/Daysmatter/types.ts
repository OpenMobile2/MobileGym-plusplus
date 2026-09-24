export type CalendarKind = 'solar' | 'lunar';
export type RepeatKind = 'none' | 'week' | 'month' | 'year' | 'custom';
export type ReminderKind = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type SortKind = 'eventTime' | 'createTime' | 'name';
export type AppLocale = 'zh' | 'en';

export interface DMEvent {
  id: string;
  title: string;
  /** 目标日:绝对 Unix 毫秒(当天本地 00:00) */
  targetDate: number;
  notebookId: string;
  calendar: CalendarKind;
  pinned: boolean;
  showOnHome: boolean;
  repeat: RepeatKind;
  reminder: ReminderKind;
  /** 正数包含起始日(+1天) */
  plusOne: boolean;
  /** 进阶:结束时间(停止计数) */
  hasEndDate: boolean;
  /** 进阶:结束日期(hasEndDate 为 true 时生效),绝对 Unix 毫秒 */
  endDate?: number | null;
  /** 小倒数日:所属父事件 id(null=普通顶层事件) */
  parentId?: string | null;
  archived: boolean;
  /** 创建时间:绝对 Unix 毫秒 */
  createdAt: number;
}

export interface DMNotebook {
  id: string;
  name: string;
  /** emoji 图标 */
  icon: string;
  /** 封面 key,对应 assets/covers/<key>.png;缺图回落纯色 */
  cover: string;
  /** 系统默认本子:不可删,可改名/图标 */
  isSystem: boolean;
  order: number;
}

export type HomeFilter =
  | { kind: 'home' }
  | { kind: 'all' }
  | { kind: 'notebook'; notebookId: string };

export interface DMSettings {
  bigFont: boolean;
  cardAnim: boolean;
  autoPin: boolean;
  hideAffix: boolean;
  sortBy: SortKind;
  adsHidden: boolean;
  /** 应用界面语言(不影响用户自定义的事件/本子名称) */
  locale: AppLocale;
}

export interface DMUser {
  loggedIn: boolean;
  name: string;
}

/** 新建/编辑事件草稿(跨子页传值,不持久化) */
export interface EventDraft {
  id: string | null;
  title: string;
  targetDate: number;
  notebookId: string;
  calendar: CalendarKind;
  pinned: boolean;
  showOnHome: boolean;
  repeat: RepeatKind;
  reminder: ReminderKind;
  plusOne: boolean;
  hasEndDate: boolean;
  endDate?: number | null;
  /** 小倒数日:所属父事件 id */
  parentId?: string | null;
}

export interface DMState {
  user: DMUser;
  events: DMEvent[];
  notebooks: DMNotebook[];
  settings: DMSettings;
  /** 首页筛选(抽屉/本子选择驱动) */
  filter: HomeFilter;
  /** 小组件绑定的事件 id */
  widgetEventId: string | null;
  /** 一次性 UI 反馈 + 事件草稿,不持久化 */
  _temp: { toast: string | null; toastSeq: number; draft: EventDraft | null };
}

export interface DMActions {
  showToast: (msg: string) => void;
  initDraft: (d: EventDraft) => void;
  patchDraft: (patch: Partial<EventDraft>) => void;
  clearDraft: () => void;
  addEvent: (e: Partial<DMEvent>) => string;
  updateEvent: (id: string, patch: Partial<DMEvent>) => void;
  deleteEvent: (id: string) => void;
  setArchived: (id: string, archived: boolean) => void;
  togglePin: (id: string) => void;
  addNotebook: (n: Partial<DMNotebook>) => string;
  updateNotebook: (id: string, patch: Partial<DMNotebook>) => void;
  deleteNotebook: (id: string) => void;
  reorderNotebook: (id: string, dir: -1 | 1) => void;
  /** 拖拽排序:把 id 移动到目标可见序位 */
  moveNotebook: (id: string, toIndex: number) => void;
  setFilter: (f: HomeFilter) => void;
  patchSettings: (patch: Partial<DMSettings>) => void;
  setWidgetEvent: (eventId: string) => void;
  login: (name?: string) => void;
  logout: () => void;
}
