/**
 * 品牌色(像素采样自真机截图,见 docs/boss-replication/design-tokens.md)。
 * 标准灰阶直接用 Tailwind,不在此重复。
 */
export const COLORS = {
  /** 品牌主色:顶栏 logo 字、激活态 */
  primary: '#12ADA9',
  /** 主行动按钮填充(继续沟通/开启提醒) */
  primaryBtn: '#15B3B3',
  /** 己方聊天气泡 */
  bubble: '#00A3A3',
  /** 薪资数字、tag 文字、可点链接 */
  accent: '#119FA4',
  /** VIP 深色卡背景 */
  vipCard: '#275D65',
  /** VIP 金(按钮渐变起止) */
  vipGoldFrom: '#C79759',
  vipGoldTo: '#F7CEB1',
  /** 付费页橙色 CTA */
  payOrange: '#FF7D3A',
  /** 页面灰底 */
  pageBg: '#F5F6F7',
  /** 首屏顶栏青→白渐变起色 */
  headerTint: '#BDE8E6',
} as const;

/** App 颜色 token 的标准导出；由 BossApp 注入为 --app-c-*。 */
export const colors = COLORS;

/** 跟随 OS 深色模式覆盖需要反转的组件色。 */
export const colorsDark: { [K in keyof typeof colors]?: string } = {
  primary: '#35C8C3',
  primaryBtn: '#2BC0BC',
  bubble: '#168D8B',
  accent: '#51D0CD',
  vipCard: '#173E43',
  pageBg: '#121719',
  headerTint: '#183B3A',
};
