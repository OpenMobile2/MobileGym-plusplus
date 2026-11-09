/** Tier-2 品牌色(取色自 design-tokens.md)。Tier-1 在 manifest.theme.colors。 */
export const colors = {
  buy_red: '#FF4400',
  buy_gradient: 'linear-gradient(90deg,#FF6A00,#FF3000)',
  price_red: '#FF3B30',
  chat_btn_bg: '#FFF7D6',
  chat_btn_text: '#3A2E00',
  market_orange: '#FF8A00',
  success: '#1CB854',
  tag_bg: '#FFF3E0',
} as const;

/** 深色覆盖:只声明变化项 */
export const colorsDark: Partial<typeof colors> = {
  chat_btn_bg: '#3A3420',
  chat_btn_text: '#FFE411',
  tag_bg: '#3A2E14',
};
