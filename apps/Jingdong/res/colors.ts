// Tier-2 颜色:Tailwind 不易表达的品牌色/渐变(取色自真机,见 design-tokens.md)。
// Tier-1(primary/background/surface…)已在 manifest.ts theme.colors。
export const colors = {
  primary: '#E22E1F', // 拼多多红
  priceRed: '#E22E1F',
  couponRed: '#FB1A2E',
  fufeiGreen: '#20B010', // 先用后付/极速退款绿
  subsidyGold: '#FFD24D',
  pinGradient: 'linear-gradient(90deg,#FF4D2E 0%,#E22E1F 100%)', // 拼单大按钮
  tagOrangeBg: '#FFF0E8',
} as const;

export const colorsDark: Partial<typeof colors> = {};
