// 小日常 —— App 级类型。
// 依据 docs/xiaorichang-replication/spec.json (frozen v1.0.0) 的 dataModel。

/** 打卡三态。术语取自真机官方「打卡教程」(s222):未完成态官方称【待定】。 */
export type CheckinStatus = 'done' | 'failed' | 'pending';

/** 循环规则。真机「循环设置」(s207)。 */
export type Recurrence =
  | { kind: 'daily' }
  | { kind: 'weekly'; weekdays: number[] } // 1=周一 … 7=周日
  | { kind: 'weeklyCount'; count: number } // 每周任选 N 天；达到配额后本周不再安排
  | { kind: 'monthly'; days: number[] }
  | { kind: 'monthlyCount'; count: number } // 每月任选 N 天；达到配额后本月不再安排
  | { kind: 'interval'; everyDays: number };

export interface Habit {
  id: string;
  name: string;
  /** res/icons.tsx 里的 Ic* 别名 */
  icon: string;
  /** 图标底色。⚠ 打卡按钮的「已完成」底色 = 该习惯的 icon 色,不是固定值 */
  color: string;
  contextId: string;
  /** 完成一次得到的光芒值;标记失败则扣同等数值(R1 录屏证明) */
  reward: number;
  recurrence: Recurrence;
  /** 量化记录:开启后打卡需填数量 */
  quantify?: { enabled: boolean; unit: string; target: number };
  /** 「需要番茄钟专注计时」开关。⚠ 专注完成**不会**自动打卡(Q8 裁定,以截图为准) */
  focusRequired: boolean;
  /** 与习惯详情 ♡ 是同一字段,不得拆成两个状态 */
  important: boolean;
  /** 一键打卡:今日页单击未打卡图标直接完成;关闭则弹打卡弹层(R2) */
  oneTap: boolean;
  /** 图标风格:图形(Lucide)或文字/emoji */
  iconStyle?: 'graphic' | 'text';
  iconText?: string;
  /** 自我激励文案 */
  motivation?: string;
  reminders?: Reminder[];
  archived: boolean;
  order: number;
  createdAt: number;
}

/** 习惯提醒(s245「添加提醒」弹层)。强提醒入口先通过系统收银台开通高级会员。 */
export interface Reminder {
  id: string;
  /** 'soft' 通过通知提醒(唯一可实现的一档) */
  mode: 'soft';
  /** 'HH:MM' */
  time: string;
  repeat: 'daily' | 'workday' | 'weekend' | 'custom';
  /** 提示音 id;无音频资产,不实际发声 */
  sound: string;
}

/** 今日卡片存进卡包后的一张卡(lab.cards) */
export interface SavedCard {
  id: string;
  date: string;
  streakDays: number;
  doneHabits: number;
  glow: number;
  quote: string;
  note?: string;
  photo: number;
  /** 保存卡片时，当日计划习惯是否全部完成。 */
  allScheduledDone?: boolean;
}

/** 情境(晨间/日间/晚间…),今日页按此分组 */
export interface HabitContext {
  id: string;
  name: string;
  order: number;
}

/** 习惯组 */
export interface HabitGroup {
  id: string;
  name: string;
  habitIds: string[];
  /** 新版习惯组表单要求的时段；老存档可为空。 */
  contextId?: string;
}

/** 一天一条。date 为 'YYYY-MM-DD'。 */
export interface CheckinLog {
  habitId: string;
  date: string;
  status: CheckinStatus;
  /** 打卡时间戳,**追加不覆盖**(R1 录屏证明) */
  stamps: number[];
  note?: string;
  quantity?: number;
}

/**
 * 光芒值。⚠ 不是标量 —— 真机「光芒与心愿」页(s219)有三个独立字段。
 * available = cumulative - redeemed
 */
export interface Glow {
  cumulative: number;
  redeemed: number;
}

export interface Wish {
  id: string;
  name: string;
  cost: number;
  redeemedAt?: number;
}

export interface Note {
  id: string;
  title?: string;
  body: string;
  color: string;
  createdAt: number;
}

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  /** Q11:小事**不进**光芒值体系,即便快捷输入条上有 🌞 数字 */
  reward?: number;
  flag?: 'gray' | 'green' | 'blue' | 'red';
  dueAt?: number;
  doneAt?: number;
  createdAt?: number;
  order: number;
}

export interface FocusRecord {
  id: string;
  /** 绑定的习惯;可为空(纯专注) */
  habitId?: string;
  startTs: number;
  endTs: number;
  minutes: number;
  note?: string;
}

export type TodoSort = 'createdAt' | 'dueAt' | 'manual';

export interface Settings {
  followSystemDark: boolean;
  /** 'system' | 'zh' | 'en' */
  language: 'system' | 'zh' | 'en';
  /** 『我的』宫格功能块的显隐与顺序(module.manage) */
  modules: { id: string; enabled: boolean; order: number }[];
  todoSort: TodoSort;
  /** 小事模块是否在今日页显示。与 module.manage 的小事开关是同一字段。 */
  todoHomeDisplay: boolean;
  hideCompleted: boolean;
  showArchived: boolean;
  // --- 设置页开关(s200) ---
  dailyReminder: boolean;
  reminderTime: string;
  weekStart: 'mon' | 'sun';
  keySound: boolean;
  haptic: boolean;
  /** 关闭后打卡不再弹光芒 toast */
  glowBanner: boolean;
  badge: boolean;
  /** 个性化主题 */
  themeId: string;
  /** 自定义主题图（系统相册选中后写入，getState 可见） */
  customThemeImage?: string;
  /** 个性化 → 色板(s248)。习惯图标调色板 */
  paletteId: string;
  customPalettes: { id: string; colors: string[] }[];
  /** 个性化 → 边框(s258):今日页习惯图标形状。⚠ 直接驱动 today.main 渲染 */
  iconShape: 'circle' | 'squircle';
  /** 个性化 → 版式(s259):今日页习惯网格密度。舒适3列 / 紧凑4列 / 紧密5列 */
  layoutDensity: 'comfortable' | 'compact' | 'tight';
  /** 实验室 → 整点报时(s251):开启报时的整点(0-23) */
  chimeHours: number[];
  // --- 番茄专注(s169/s207) ---
  focusMusic: string;
  focusKeepAwake: boolean;
  focusAutoLoop: boolean;
  /** 自定义时长(分钟),出现在预设行 */
  customDurations: number[];
  // --- 小组件(s186) ---
  widget: { directCheckin: boolean; keepVisible: boolean; bgColor: string };
}

export interface UserInfo {
  nickname: string;
  avatar: string;
  bio?: string;
  vip: boolean;
}

export interface FullState {
  _dataVersion: number;
  user: UserInfo;
  contexts: HabitContext[];
  habits: Habit[];
  groups: HabitGroup[];
  logs: CheckinLog[];
  glow: Glow;
  wishes: Wish[];
  notes: Note[];
  todos: Todo[];
  records: FocusRecord[];
  /** 卡包(today.card『存进卡包』的落点) */
  cards: SavedCard[];
  settings: Settings;
  _temp: {
    toast: string;
    toastSeq: number;
    /** 需要用户手动确认的明确提示，不使用一闪而过的 toast。 */
    notice: string;
    noticeSeq: number;
    /** 光芒值变化横幅(R4:习惯图标 + 名称 + 「光芒上升啦!」+ 药丸「+N ✦」) */
    glowToast: { habitId: string; delta: number } | null;
    /** 运行中的专注;null = 未在专注 */
    activeFocus: { startTs: number; targetMin: number; habitId?: string; countUp: boolean } | null;
    /** 规划模式(铅笔 ✎ 进入) */
    planning: boolean;
    /** 正在打卡/编辑的草稿 */
    draft: Record<string, unknown> | null;
  };
}
