/**
 * Tier-2 组件色(Tier-1 语义色在 manifest.theme.colors / colorsDark)。
 * 页面优先用 --app-* / --app-c-* token,随 OS 深色切换。
 */
export const colors = {
  page_bg: '#F1F1F1',
  card_bg: '#ffffff',
  text_primary: '#262626',
  text_secondary: '#757575',
  text_muted: '#9AA3AF',
  brand: '#FD7101',
  brand_end: '#FB5603',
  danger: '#F13A21',
  border: '#EEEEEE',
  border_light: '#F5F5F5',
  chip_bg: '#F7F7F7',
} as const;

export const colorsDark: Partial<typeof colors> = {
  page_bg: '#121212',
  card_bg: '#1E1E1E',
  text_primary: '#F2F2F2',
  text_secondary: '#A8A8A8',
  text_muted: '#8A8A8A',
  brand: '#FD7101',
  brand_end: '#FB5603',
  danger: '#FF6B5A',
  border: '#2C2C2C',
  border_light: '#2A2A2A',
  chip_bg: '#2A2A2A',
};
