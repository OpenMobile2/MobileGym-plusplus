/**
 * Tier-2 组件色(Tier-1 语义色在 manifest.theme.colors / colorsDark)。
 * 页面优先用 --app-* / --app-c-* token,随 OS 深色切换。
 */
export const colors = {
  page_bg: '#F4F6F8',
  page_tint: '#EAF2FB',
  card_bg: '#ffffff',
  text_primary: '#222222',
  text_secondary: '#8A8F99',
  text_muted: '#B8BCC4',
  brand: '#4A90D9',
  brand_soft: '#DCEBFB',
  danger: '#E5533C',
  border: '#EEF0F3',
  chip_bg: '#F1F3F5',
} as const;

export const colorsDark: Partial<typeof colors> = {
  page_bg: '#121212',
  page_tint: '#1A2330',
  card_bg: '#1E1E1E',
  text_primary: '#F2F2F2',
  text_secondary: '#A8A8A8',
  text_muted: '#8A8A8A',
  brand: '#6AA8E8',
  brand_soft: '#243447',
  danger: '#FF6B5A',
  border: '#2C2C2C',
  chip_bg: '#2A2A2A',
};
