export type AppLocale = 'zh' | 'en';

export type TodoType = 'normal' | 'goal' | 'habit';
export type TimingMode = 'countdown' | 'countup' | 'none';

export interface Todo {
  id: string;
  name: string;
  type: TodoType;
  timing: TimingMode;
  /** 倒计时时长(分钟);正向/不计时可为 0 */
  durationMin: number;
  /** 卡片背景图 key(assets/index 的 cardBg),缺失回落纯色 */
  bgKey: string;
  /** 兜底纯色 */
  bgColor: string;
  order: number;
  /** 今日已专注次数 */
  todayFocusCount: number;
  /** 不计时/普通待办 今日完成次数 */
  todayDoneCount: number;
  /** 习惯:今日已累计分钟 / 目标分钟(每天) */
  habitTodayMin?: number;
  habitTargetMin?: number;
  /** 定目标:目标日期(绝对 ms)/ 目标总量(小时) */
  goalDate?: number;
  goalHours?: number;
  /** 高级设置 */
  note?: string;
  hideNextDay?: boolean;
}

export interface FocusRecord {
  id: string;
  todoId: string;
  todoName: string;
  startTs: number;
  endTs: number;
  durationMin: number;
  status: 'done';
  percent?: number; // 习惯/目标完成百分比
  reflection?: string; // 心得
}

export interface FutureCountdown {
  id: string;
  name: string;
  remark: string;
  targetDate: number; // 绝对 ms
}

export interface Settings {
  /** 默认休息时长(分钟),0 = 不休息 */
  restDurationMin: number;
  studyMode: boolean;
  strictMode: boolean;
  midnightMode: boolean;
  noStrikethrough: boolean;
  fixedOrder: boolean;
  pullSearch: boolean;
  /** 可见性 */
  focusVisible: boolean;
  wakeVisible: boolean;
  /** 锁机 */
  lockCountStats: boolean;
  /** 主题色 key */
  themeColor: string;
}

export interface UserInfo {
  name: string;
  signature: string;
  avatarKey: string;
  account: string;
}

export interface Stats {
  totalCount: number;
  totalMinutes: number;
  streakDays: number;
  totalDays: number;
  /** 本月主动退出锁机次数 */
  monthlyLockExit: number;
}

export interface AppState {
  todos: Todo[];
  records: FocusRecord[];
  futures: FutureCountdown[];
  user: UserInfo;
  settings: Settings;
  stats: Stats;
  _dataVersion: number;
  _temp: {
    toast: string;
    toastSeq: number;
    /** 当前正在进行的专注会话 */
    activeFocus: { todoId: string; startTs: number } | null;
    /** 添加/编辑待办草稿 */
    draft: Partial<Todo> | null;
  };
}

export interface AppActions {
  showToast: (msg: string) => void;
  addTodo: (t: Partial<Todo>) => string;
  updateTodo: (id: string, patch: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  moveTodoToTop: (id: string) => void;
  reorderTodos: (ids: string[]) => void;
  completeTodoOnce: (id: string) => void;
  /** 记录一次专注(计时结束调用),返回 recordId */
  finishFocus: (todoId: string, durationMin: number) => string;
  addRecordNote: (recordId: string, reflection: string) => void;
  updateRecord: (recordId: string, patch: Partial<FocusRecord>) => void;
  deleteRecord: (id: string) => void;
  addFuture: (f: Partial<FutureCountdown>) => string;
  deleteFuture: (id: string) => void;
  toggleSetting: (key: keyof Settings) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setUser: (patch: Partial<UserInfo>) => void;
  incMonthlyLockExit: () => void;
  setDraft: (patch: Partial<Todo> | null) => void;
}

export type FullState = AppState & AppActions;
