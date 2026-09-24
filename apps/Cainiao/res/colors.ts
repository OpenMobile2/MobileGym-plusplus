/**
 * Tier-2 组件色 token(随 OS 深色切换)。
 * 页面用 `bg-(--app-c-*)` / `text-(--app-c-*)`,由 CainiaoApp 按 useDarkMode 注入。
 */
export const colors = {
  page_bg: '#F0F3F8',
  card_bg: '#FFFFFF',
  brand: '#1677FF',
  brand_soft: '#EAF3FF',
  brand_mid: '#1C7FFE',
  header_from: '#1677FF',
  header_via: '#1C7FFE',
  header_to: '#8FC6FB',
  wash_from: '#DFF1FE',
  wash_to: '#F0F3F8',
  text_primary: '#1A1A1A',
  text_secondary: '#666666',
  text_muted: '#999999',
  border: '#EEF0F3',
  success: '#00B578',
  danger: '#F5222D',
  chip_bg: '#F4F6F9',
  divider: '#F4F6F9',
} as const;

export const colorsDark: Partial<Record<keyof typeof colors, string>> = {
  page_bg: '#0E1116',
  card_bg: '#1A1F27',
  brand: '#3B8BFF',
  brand_soft: '#152338',
  brand_mid: '#2A6FD6',
  header_from: '#0B2F66',
  header_via: '#123F80',
  header_to: '#1A2F4D',
  wash_from: '#152338',
  wash_to: '#0E1116',
  text_primary: '#F2F2F2',
  text_secondary: '#B4B4B4',
  text_muted: '#8A8A8A',
  border: '#2A3140',
  success: '#1DC88A',
  danger: '#FF6B5A',
  chip_bg: '#242A34',
  divider: '#2A3140',
};
