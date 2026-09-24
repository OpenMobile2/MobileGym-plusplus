// 小日常 结构性常量。用户数据一律放 data/defaults.json。
import type { TodoSort } from './types';

/**
 * DATA_VERSION —— 每次修改 data/defaults.json 或 FullState 结构**必须递增**,
 * 由 state.ts 的 afterHydration 钩子比对,不一致就把 localStorage 里的旧存档重置回种子数据。
 *
 * 1 → 2:Gate4 第一轮。新增 cards / chimeHours / paletteId / customPalettes / 结构化 reminders。
 * 2 → 3:Gate4 第二轮。hideCompleted 默认值 false → true(R4 实证);_temp 新增 glowToast。
 * 3 → 4:三个缺口补拍。settings 新增 iconShape / layoutDensity(s258/s259)。
 */
export const DATA_VERSION = 5;

/** 版式 → 今日页习惯网格列数(s259) */
export const LAYOUT_COLUMNS: Record<string, number> = {
  comfortable: 3,
  compact: 4,
  tight: 5,
};

/** 底部 tabbar。路由与 navigation.declaration.ts 一致。 */
export const TABS = [
  { id: 'today', path: '/', labelKey: 'tabToday', icon: 'IcCheck' },
  { id: 'habits', path: '/habits', labelKey: 'tabHabits', icon: 'IcGrid' },
  { id: 'focus', path: '/focus', labelKey: 'tabFocus', icon: 'IcTomato' },
  { id: 'stats', path: '/stats', labelKey: 'tabStats', icon: 'IcBars' },
  { id: 'profile', path: '/me', labelKey: 'tabProfile', icon: 'IcUser' },
] as const;

/** 今日页顶部快捷条(真机 s151/s216 五项) */
export const QUICK_ENTRIES = [
  { id: 'card', labelKey: 'quickTodayCard', icon: 'IcCard' },
  { id: 'todo', labelKey: 'quickTodo', icon: 'IcPlusSquare' },
  { id: 'note', labelKey: 'quickNote', icon: 'IcMessage' },
  { id: 'focus', labelKey: 'quickFocus', icon: 'IcClock' },
  { id: 'timeline', labelKey: 'quickTimeline', icon: 'IcTimeline' },
] as const;

/** 番茄专注时长预设(真机 s169)。countUp = 正计时。 */
export const FOCUS_PRESETS = [
  { id: 'countUp', minutes: 0, countUp: true },
  { id: 'min25', minutes: 25, countUp: false },
  { id: 'min45', minutes: 45, countUp: false },
  { id: 'min60', minutes: 60, countUp: false },
  { id: 'min90', minutes: 90, countUp: false },
] as const;

/** 「达成率」分母 = 当月自然日天数(s231→s233 两点定式,非「已安排天数」) */
export const RATE_DENOMINATOR = 'daysInMonth' as const;

/** 专注低于该分钟数直接作废,不写记录(R3 录屏证明) */
export const FOCUS_MIN_MINUTES = 1;

export const TODO_SORTS: TodoSort[] = ['createdAt', 'dueAt', 'manual'];

/** 今日页可排序/开关的功能块(功能块管理页) */
export const MODULE_IDS = ['todo', 'note', 'checkin', 'focusChip'] as const;
