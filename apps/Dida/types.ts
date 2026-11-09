// 滴答清单(Dida) — 应用级类型定义

export type Priority = 'none' | 'low' | 'medium' | 'high';
/** 四象限:1=紧急重要 2=重要不紧急 3=紧急不重要 4=不紧急不重要 */
export type Quadrant = 1 | 2 | 3 | 4;
export type ListKind = 'inbox' | 'list' | 'smart';
export type FocusType = 'pomo' | 'stopwatch';
export type ThemePref = 'system' | 'light' | 'dark';
/** 强调色预设 */
export type AccentPref = 'orange' | 'blue' | 'green';
export type TimeFormat = '24h' | '12h';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  note: string;
  listId: string;
  priority: Priority;
  quadrant: Quadrant;
  /** 截止日期(simulated ts),null=无日期 */
  dueTs: number | null;
  /** dueTs 是否含具体时间(否则视为全天) */
  hasTime: boolean;
  /** 提醒设置值(展示用,不真弹通知) */
  reminder: string | null;
  /** 重复规则(展示用) */
  repeat: string | null;
  tags: string[];
  subtasks: Subtask[];
  completed: boolean;
  completedAt: number | null;
  pinned: boolean;
  order: number;
  createdAt: number;
}

export interface TaskList {
  id: string;
  name: string;
  /** 色板 key,映射 res/colors.ts */
  color: string;
  icon: string;
  kind: ListKind;
}

export interface FocusRecord {
  id: string;
  taskId: string | null;
  taskName: string;
  startTs: number;
  endTs: number;
  durationMin: number;
  type: FocusType;
}

export interface Settings {
  theme: ThemePref;
  accent: AccentPref;
  startOfWeek: number; // 0=Sun … 6=Sat
  timeFormat: TimeFormat;
  showCompleted: boolean;
  /** 四象限页是否显示已完成任务 */
  matrixShowCompleted: boolean;
  /** 四象限格子顺序：左上、右上、左下、右下 */
  quadrantOrder: Quadrant[];
  pomoMinutes: number;
}

export interface UserInfo {
  name: string;
  avatar: string;
  signature: string;
  level: number;
  badges: number;
  premium: boolean;
  loggedIn: boolean;
}

export interface Stats {
  totalFocusMin: number;
  totalPomo: number;
}

export interface FullState {
  _dataVersion: number;
  user: UserInfo;
  lists: TaskList[];
  tasks: Task[];
  records: FocusRecord[];
  settings: Settings;
  stats: Stats;
  /** 当前选中的清单/智能清单 id */
  currentListId: string;
  _temp: {
    toast: string;
    toastSeq: number;
    // 运行中的专注会话(存 store,导航离开仍继续;_temp 不持久化,刷新即重置)
    activeFocus: {
      type: FocusType;
      taskId: string | null;
      startedRealTs: number; // 本段运行开始的真实时钟
      accumSec: number; // 之前已累计秒数(暂停时冻结)
      paused: boolean;
    } | null;
  };
}

export interface AppActions {
  showToast: (msg: string) => void;
  setCurrentList: (listId: string) => void;
  addTask: (patch: Partial<Task>) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  togglePin: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  startFocus: (type: FocusType, taskId: string | null) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  stopFocus: () => void;
  setUser: (patch: Partial<UserInfo>) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  login: () => void;
  logout: () => void;
}
