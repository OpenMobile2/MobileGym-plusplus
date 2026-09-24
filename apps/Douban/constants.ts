// apps/Douban/constants.ts
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
 * state.ts 的 persistName = `douban_v${DATA_VERSION}`,版本变化清空 localStorage。
 */
export const DATA_VERSION = 14;

/**
 * 底部 TabBar:首页/书影音/小组/市集/我的(spec chrome.tabbar)。
 * transition id 必须在绑定点用字符串字面量,此表仅供布局判断(路由可见性),
 * 不得用于向 bindTap 传变量 id。
 */
export const TAB_ROUTES = ['/', '/bm/movie', '/group', '/market', '/mine'] as const;

/** 左侧抽屉(spec chrome.drawer)的宿主路由:这些页面左上有汉堡/头像入口。 */
export const DRAWER_HOST_ROUTES = ['/', '/bm/movie', '/group', '/mine'] as const;
