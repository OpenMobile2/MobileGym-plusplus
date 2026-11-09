// 滴答清单(Dida) — 结构性常量(非用户数据)
import type { Priority, Quadrant } from './types';

// defaults.json / store 结构变化时 +1,触发重置(见 state.ts afterHydration)
export const DATA_VERSION = 4;

/** 通用·番茄时长（分钟） */
export const POMO_MINUTE_OPTIONS = [15, 25, 45, 60] as const;

/** 底部 5 Tab 结构(路由 + i18n key + 图标 alias) */
export const TABS = [
  { path: '/', key: 'nav.tasks', icon: 'IcTasks' },
  { path: '/calendar', key: 'nav.calendar', icon: 'IcCalendar' },
  { path: '/matrix', key: 'nav.matrix', icon: 'IcMatrix' },
  { path: '/focus', key: 'nav.focus', icon: 'IcFocus' },
  { path: '/me', key: 'nav.me', icon: 'IcMe' },
] as const;

/** 优先级元数据:标签 i18n key + 色板 key(见 res/colors.ts) */
export const PRIORITY_META: Record<Priority, { key: string; color: string; rank: number }> = {
  high: { key: 'priority.high', color: 'priorityHigh', rank: 3 },
  medium: { key: 'priority.medium', color: 'priorityMedium', rank: 2 },
  low: { key: 'priority.low', color: 'priorityLow', rank: 1 },
  none: { key: 'priority.none', color: 'priorityNone', rank: 0 },
};

export const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low', 'none'];

/** 四象限元数据:标题 i18n key + 罗马数字 + 色板 key */
export const QUADRANT_META: Record<Quadrant, { key: string; roman: string; color: string }> = {
  1: { key: 'matrix.q1', roman: 'I', color: 'quadrant1' },
  2: { key: 'matrix.q2', roman: 'II', color: 'quadrant2' },
  3: { key: 'matrix.q3', roman: 'III', color: 'quadrant3' },
  4: { key: 'matrix.q4', roman: 'IV', color: 'quadrant4' },
};

export const QUADRANT_ORDER: Quadrant[] = [2, 1, 3, 4]; // 与真机 G-1 一致:左上Ⅱ 右上Ⅰ 左下Ⅲ 右下Ⅳ

/**
 * 四象限新建任务默认：优先级 + 截止偏移（相对今天天数；null=无日期）。
 * 紧急(Ⅰ/Ⅲ) → 今天(dueToday)，重要不紧急(Ⅱ) → 明天，不紧急不重要(Ⅳ) → 无日期。
 * 这样「今天」视图能看见紧急任务，优先级色与列表勾选框一致。
 */
export const QUADRANT_CREATE_DEFAULTS: Record<
  Quadrant,
  { priority: Priority; dueOffsetDays: number | null }
> = {
  1: { priority: 'high', dueOffsetDays: 0 },
  2: { priority: 'medium', dueOffsetDays: 1 },
  3: { priority: 'low', dueOffsetDays: 0 },
  4: { priority: 'none', dueOffsetDays: null },
};

/** 提醒预设(i18n key) */
export const REMINDER_PRESETS = [
  'reminder.none',
  'reminder.onTime',
  'reminder.5min',
  'reminder.30min',
  'reminder.1hour',
  'reminder.1day',
] as const;
