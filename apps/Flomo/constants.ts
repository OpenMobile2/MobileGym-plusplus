// apps/Flomo/constants.ts
/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts。OS 层更新时同步。
 */
export const OS = {
  STATUS_BAR_H: 40, // 顶部状态栏浮层,pt-10 = 40px
  GESTURE_BAR_H: 16, // 底部手势条浮层
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44, // App 自身 TopBar 高度
} as const;

/**
 * DATA_VERSION —— 每次修改 defaults.json 必须递增。
 * state.ts 的 persistName = `flomo_v${DATA_VERSION}`,版本变化清空 localStorage。
 */
export const DATA_VERSION = 3;

/**
 * flomo 没有底部多 Tab。主体 = 笔记流主页 + 左侧标签抽屉 + 绿色 + FAB。
 * 抽屉里的系统分组(内容类型筛选)。
 */
export const SYSTEM_FILTERS = [
  { id: 'all', label: '全部笔记' },
  { id: 'images', label: '有图片' },
  { id: 'links', label: '有链接' },
  { id: 'audio', label: '有语音' },
  { id: 'untagged', label: '无标签' },
  { id: 'wechat', label: '微信输入' },
] as const;
