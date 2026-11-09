/**
 * Tier-2 组件色 token(随 OS 深色切换)。页面用 `bg-(--app-c-*)` / `text-(--app-c-*)`,
 * 由 DianpingApp 根据 useDarkMode 注入 light/dark 两套。Tier-1 语义色在 manifest.theme。
 */
export const colors = {
  page_bg: '#F5F5F5',
  card_bg: '#FFFFFF',
  wash: '#FFF5EE',
  text_primary: '#222222',
  text_secondary: '#666666',
  text_muted: '#999999',
  border: '#F0F0F0',
  brand: '#FF6633',
  brand_soft: '#FFF1EA',
  chip_bg: '#F5F5F5',
} as const;

export const colorsDark: Partial<Record<keyof typeof colors, string>> = {
  page_bg: '#121212',
  card_bg: '#1E1E1E',
  wash: '#241A14',
  text_primary: '#F2F2F2',
  text_secondary: '#B4B4B4',
  text_muted: '#8A8A8A',
  border: '#2C2C2C',
  brand: '#FF7A47',
  brand_soft: '#3A2318',
  chip_bg: '#262626',
};

/** 取色锚点见 docs/dianping-replication/design-tokens.md */
export const C = {
  brand: '#FF6633',
  brandDeep: '#FF6600',
  brandSoft: '#FFF1EA',
  page: '#F5F5F5',
  card: '#FFFFFF',
  homeWash: '#FFF5EE',
  text: '#222222',
  text2: '#666666',
  text3: '#999999',
  text4: '#CCCCCC',
  line: '#F0F0F0',
  green: '#00B578',
  badge: '#FF4B33',
  star: '#FF6633',
  starEmpty: '#E0E0E0',
} as const;
