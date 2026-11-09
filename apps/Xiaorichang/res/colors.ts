// 小日常 品牌色。取值来自 docs/xiaorichang-replication/design-tokens.md
// (真机 PNG 区域众数采样,非目测)。仅收纳 Tailwind 表达不了的品牌色/渐变。

export const colors = {
  brand: '#F7CE45',
  brandSun: '#F9DC7F',
  brandSoft: '#FFF5D5',
  brandWash: '#FFF9E7',
  vip: '#E69F4B',

  ink: '#212121',
  inkStrong: '#424242',

  /** 标记失败 */
  stateFail: '#C67171',
  /** 番茄停止按钮 */
  focusStop: '#DE625B',

  /** 光芒 +N toast(上浮) */
  toastUpBg: '#FFF9E7',
  toastUpPill: '#FFF5D5',
  /** 光芒 −N toast(下沉) */
  toastDownBg: '#FAEFF0',
  toastDownPill: '#F7E6E8',
} as const;

/** 番茄专注时长预设的配色(真机 s169) */
export const FOCUS_PRESET_COLORS: Record<string, string> = {
  countUp: '#F18085',
  min25: '#E9E7AA',
  min45: '#BAD8E4',
  min60: '#E2B6AB',
  min90: '#B7E0B5',
  selected: '#424242',
};

/**
 * 习惯图标底色调色板(真机 s166 图标库 14 色)。
 * ⚠ design-tokens.md §U1:色块小且带阴影,采样不可靠,按视觉近似取值(inferred)。
 * 影响仅限图标底色。
 */
export const HABIT_COLORS = [
  '#B2967D', '#E5A663', '#E9C46A', '#A8C686', '#7FB685', '#6FB1A0', '#6BAED6',
  '#7C9EDB', '#9B8FD1', '#C08FC8', '#DE8FA6', '#D97A7A', '#9AA5B1', '#7A8794',
] as const;

/**
 * 深色态色阶。⚠ 无深色真机截图,由中性反转外推(inferred),阶段⑥ 需补图校准。
 * 深色态下品牌色不参与页面着色(真机 s184:「手机处于暗黑模式下时,主题将暂不呈现」),
 * 但习惯图标的固有色不受影响。
 */
export const colorsDark: { [K in keyof typeof colors]?: string } = {
  brandSun: '#A9872E',
  brandSoft: '#3A3422',
  brandWash: '#181817',
  ink: '#F4F3EE',
  inkStrong: '#FFFFFF',
  stateFail: '#E38B8B',
  focusStop: '#EA7770',
  toastUpBg: '#302B1D',
  toastUpPill: '#3A3422',
  toastDownBg: '#302224',
  toastDownPill: '#432B2F',
};

/** 兼容旧命名；新页面统一使用 colorsDark 合并后的 --app-c-* token。 */
export const darkColors = colorsDark;
