/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts。数值同步于 OS 层。
 */
export const OS = {
  STATUS_BAR_H: 40, // pt-10
  GESTURE_BAR_H: 16, // h-4
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
} as const;

/**
 * DATA_VERSION —— 每次修改 data/defaults.json 必须递增,触发 localStorage 重置。
 */
export const DATA_VERSION = 4;

/** 底部导航 5 个 tab(与 spec chrome.tabbar 一致) */
export const TABS = [
  { path: '/', key: 'navTodo', icon: 'IcTodo' },
  { path: '/lock', key: 'navLock', icon: 'IcLock' },
  { path: '/stats', key: 'navStats', icon: 'IcStats' },
  { path: '/timeline', key: 'navTimeline', icon: 'IcTimeline' },
  { path: '/profile', key: 'navProfile', icon: 'IcProfile' },
] as const;

/** 待办类型 */
export const TODO_TYPES = ['normal', 'goal', 'habit'] as const;
/** 计时方式 */
export const TIMING_MODES = ['countdown', 'countup', 'none'] as const;
/** 快速时长(分钟) */
export const DURATIONS = [25, 35] as const;

/** 快速锁机常用时长(分钟) */
export const LOCK_QUICK_MINUTES = [2, 5, 10, 25, 60] as const;

/** 打卡分享卡类型 */
export const CHECKIN_TYPES = ['sleep', 'earlyrise', 'focus'] as const;
