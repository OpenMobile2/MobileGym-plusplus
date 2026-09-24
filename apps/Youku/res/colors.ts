/**
 * Tier-2 组件色 token(随 App 外观:深色默认 / 浅色 / 跟随系统)。
 * 页面用 `bg-(--app-c-*)` / `text-(--app-c-*)`,由 YoukuApp 注入。
 */
export const colors = {
  page_bg: '#F5F5F5',
  card_bg: '#FFFFFF',
  brand: '#0C7BFF',
  brand_soft: '#E8F2FF',
  text_primary: '#1A1A1A',
  text_secondary: '#666666',
  text_muted: '#999999',
  border: '#E8E8E8',
  danger: '#F5265C',
  vip_gold: '#B8860B',
  chip_bg: '#F0F0F0',
  divider: '#EEEEEE',
} as const;

/** 深色模式(App 默认) */
export const colorsDark: Partial<Record<keyof typeof colors, string>> = {
  page_bg: '#000000',
  card_bg: '#1A1A1A',
  brand: '#3D9BFF',
  brand_soft: '#0C2F5C',
  text_primary: '#F5F5F5',
  text_secondary: '#A0A0A0',
  text_muted: '#8A8A8A',
  border: '#2A2A2A',
  danger: '#FF4D7A',
  vip_gold: '#E8C87E',
  chip_bg: '#222222',
  divider: '#1A1A1A',
};
