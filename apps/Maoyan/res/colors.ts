/**
 * 猫眼 Tier-2 应用色(Tier-1 语义色在 manifest.theme.colors/colorsDark)。
 * 注入为 `--app-c-*` CSS 变量,页面用 `text-(--app-c-text-3)` / `bg-(--app-c-fill)` 消费,
 * 深色由 colorsDark 覆盖,跟随 OS 深色开关(useDarkMode)。
 * 取色来源:docs/maoyan-replication/design-tokens.md
 */
export const colors = {
  /* 品牌色(深浅共用,仅深色下按对比度微调) */
  primary: '#DC4038',
  cta: '#F53E3E',
  ctaGradient: 'linear-gradient(90deg,#F04048,#F85862)',
  wishOrange: '#FFA820',
  presaleBlue: '#4B9EF8',
  scoreOrange: '#FFB400',
  seatPicked: '#34B96F',

  /* 中性文字层级(text-1 = manifest textPrimary,text-muted = textSecondary) */
  text_2: '#333333',
  text_3: '#999999',
  text_4: '#BBBBBB',

  /* 填充/描边层级 */
  fill: '#F4F4F5',
  fillStrong: '#E8E8EA',
  borderStrong: '#DDDDDD',

  /* 品牌浅底(选中chip/营销条) */
  brandTint: '#FDECEB',
  brandTintText: '#D8574E',
  goldTint: '#FFF4D6',
  goldText: '#B8860B',
} as const;

/** 深色覆盖:只覆盖需要变的键,其余继承 colors */
export const colorsDark: Partial<Record<keyof typeof colors, string>> = {
  cta: '#FF5A5F',
  ctaGradient: 'linear-gradient(90deg,#E4373F,#F04B55)',

  text_2: '#C9C9CE',
  text_3: '#8A8A90',
  text_4: '#6E6E75',

  fill: '#26262A',
  fillStrong: '#34343A',
  borderStrong: '#3A3A3E',

  brandTint: '#3A1E1D',
  brandTintText: '#FF8B84',
  goldTint: '#332B18',
  goldText: '#E0B85C',
};
