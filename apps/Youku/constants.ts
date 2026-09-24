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

/** 每次修改 defaults.json 结构必须递增(afterHydration 版本不符即重置) */
// v9(走查3):补 director/actors + 残留测试状态一次性重置
// v10(走查4):动态改多图(moment.images)+ 短视频/短剧评论分池,结构变更需重置
// v11(走查5):评论头像素材化 + 清理旧动态评论状态
export const DATA_VERSION = 12;

/** 底部 5 tab(纯文字无图标,design-tokens):路径 → 中文名(spec home.main 的 /home 映射为 '/',OS 合同) */
export const TABS = [
  { path: '/', key: 'tab.home' },
  { path: '/shorts', key: 'tab.shorts' },
  { path: '/vip', key: 'tab.vip' },
  { path: '/taohaopian', key: 'tab.taohaopian' },
  { path: '/me', key: 'tab.me' },
] as const;

/**
 * 显示底部 tabbar 的路径(一级页 + 其子tab/频道页,spec chrome.tabbar)。
 * 频道页带 :channelId,用前缀正则匹配。
 */
export const TAB_PATH_PATTERNS: readonly RegExp[] = [
  /^\/$/,
  /^\/home\/channel\/[^/]+$/,
  /^\/home\/channel-lite\/[^/]+$/,
  /^\/shorts$/,
  /^\/shorts\/watched$/,
  /^\/shorts\/dramas$/,
  /^\/vip$/,
  /^\/taohaopian$/,
  /^\/taohaopian\/jieshuo$/,
  /^\/taohaopian\/upcoming$/,
  /^\/me$/,
];

/** 内容频道(home.channel)与长尾轻量频道(home.channelLite)的 channelId 集合 */
export const CONTENT_CHANNELS = ['drama', 'anime', 'movie', 'variety', 'kids'] as const;
export const LITE_CHANNELS = ['documentary', 'sports', 'humanities', 'game'] as const;

/** 倍速选项(spec s261) */
export const SPEED_OPTIONS = ['4.0X', '3.0X', '2.0X', '1.5X', '1.25X', '1.0X', '0.75X'] as const;

/** 定时关闭选项(spec s262) */
export const TIMER_OPTIONS = ['off', 'current', '30:00', '60:00'] as const;

/** 通用 wontfix 提示文案 */
export const WONTFIX_TOAST = '该功能暂未开放';
