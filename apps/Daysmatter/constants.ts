/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts
 */
export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

/**
 * DATA_VERSION —— 每次修改 defaults.json 必须递增,变化会清空 localStorage 重载。
 */
export const DATA_VERSION = 2;

/** 底部 Tab 定义(分离 pathname 路由) */
export const TABS = [
  { id: 'home', route: '/', label: '倒数日' },
  { id: 'notebook', route: '/notebooks', label: '倒数本' },
  { id: 'discover', route: '/discover', label: '发现' },
  { id: 'account', route: '/account', label: '我的' },
  { id: 'more', route: '/more', label: '更多' },
] as const;

/** 重复方式选项 */
export const REPEAT_OPTIONS = [
  { id: 'none', label: '不重复' },
  { id: 'week', label: '每周重复' },
  { id: 'month', label: '每月重复' },
  { id: 'year', label: '每年重复' },
  { id: 'custom', label: '自定义' },
] as const;

/** 定期提醒频率选项 */
export const REMINDER_OPTIONS = [
  { id: 'none', label: '未设置' },
  { id: 'daily', label: '每日提醒' },
  { id: 'weekly', label: '每周提醒' },
  { id: 'monthly', label: '每月提醒' },
  { id: 'yearly', label: '每年提醒' },
  { id: 'custom', label: '自定义间隔时间' },
] as const;

/** 事件列表排序方式 */
export const SORT_OPTIONS = [
  { id: 'eventTime', label: '事件时间' },
  { id: 'createTime', label: '创建时间' },
  { id: 'name', label: '名称' },
] as const;

/** 新建本子可选图标(emoji) */
export const NOTEBOOK_ICONS = ['📔', '💼', '🚀', '💕', '🎂', '❤️', '⭐', '🌍', '💿', '💎', '💰', '🖥️'];

/** 新建本子可选封面(对应 assets/covers/*.png 的 key,缺图回落纯色) */
export const NOTEBOOK_COVERS = [
  { id: 'blank', label: '自选封面', pro: true, color: '#E4E2DC' },
  { id: 'cover_work', label: '星空', pro: false, color: '#2E3A59' },
  { id: 'cover_anniv', label: '蛋糕', pro: false, color: '#C0392B' },
  { id: 'cover_rocket', label: '火箭', pro: false, color: '#2B2B2B' },
  { id: 'cover_life', label: '皮革', pro: false, color: '#8B5A2B' },
  { id: 'cover_travel', label: '旅行', pro: false, color: '#2E8B82' },
  { id: 'cover_warm', label: '暖橙', pro: false, color: '#E0985A' },
  { id: 'cover_green', label: '墨绿', pro: false, color: '#2F4F3E' },
  { id: 'cover_star', label: '星星', pro: false, color: '#F2C94C' },
];
