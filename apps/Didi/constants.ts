// apps/Didi/constants.ts
/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts。OS 层更新时同步。
 */
export const OS = {
  STATUS_BAR_H: 40, // 顶部状态栏浮层,pt-10 = 40px
  GESTURE_BAR_H: 16, // 底部手势条浮层
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44, // App 自身 TopBar 高度
  TAB_BAR_H: 52, // 底部 TabBar 高度
} as const;

/**
 * DATA_VERSION —— 每次修改 defaults.json 必须递增。
 * state.ts 的 persistName = `didi_v${DATA_VERSION}`,版本变化清空 localStorage。
 */
export const DATA_VERSION = 7;

/**
 * 底部 TabBar —— provisional,待真机截图核对 tab 数量/顺序/图标。
 * route 必须与 navigation.declaration 的 tab 路由一致。
 */
export const TABS = [
  { id: 'home', route: '/', label: '首页', icon: 'IcTabHome' },
  { id: 'messages', route: '/messages', label: '消息', icon: 'IcTabMessages' },
  { id: 'trips', route: '/trips', label: '行程', icon: 'IcTabOrders' },
  { id: 'me', route: '/me', label: '我的', icon: 'IcTabMe' },
] as const;

/** tab 切换用的 transitionId(与 chrome.tabbar 声明一致) */
export const TAB_TRANSITIONS: Record<string, string> = {
  home: 'home.tab',
  messages: 'messages.tab',
  trips: 'trips.tab',
  me: 'me.tab',
};
