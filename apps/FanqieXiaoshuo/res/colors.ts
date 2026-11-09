/**
 * Tier-2 组件色(Tier-1 语义色在 manifest.theme.colors)。
 * 注入前缀 `--app-c-`,页面用 `bg-(--app-c-bg-card)` / `text-(--app-c-text-primary)` 引用。
 * 浅色值即真机取色(design-tokens.md);colorsDark 只覆盖需要变的键,深色跟随 OS。
 *
 * 注:阅读器正文/菜单不在这套 token 里——它有 7 档纸张主题(READER_THEMES),
 * 夜间档由用户或「我的」的夜间开关选择,属 App 内设置而非 OS 深色。
 */
export const colors = {
  // —— 底与面 ——
  bg_page: '#F5F5F5',        // 页面底(书城/书架/我的)
  bg_page_alt: '#F5F6F7',    // 略偏冷的页面底(我的/搜索结果)
  bg_card: '#FFFFFF',        // 卡片/列表/顶栏面
  bg_fill: '#F5F5F5',        // 输入框、胶囊、浅底块
  bg_fill_weak: '#F7F7F7',   // 更浅的分隔块
  bg_mask: 'rgba(0,0,0,0.40)', // 弹层遮罩

  // —— 线 ——
  divider: '#F0F0F0',
  border: '#EEEEEE',
  border_input: '#E8E8E8',

  // —— 字 ——
  text_primary: '#1A1A1A',
  text_regular: '#3A3A3A',
  text_secondary: '#8A8A8A',
  text_tertiary: '#9A9A9A',
  text_quaternary: '#B5B5B5',
  text_disabled: '#C9C9C9',
  text_on_brand: '#FFFFFF',

  // —— 品牌 ——
  brand: '#FA6E3D',
  brand_dark: '#E85A20',
  brand_weak: '#FBAF97',     // 置灰态的橙(搜索按钮未输入)
  brand_soft: '#FDEDE6',     // 橙色浅底(标签/推荐位)
  brand_soft_alt: '#FFF3EC', // 更淡的橙底(抽屉头/金币条)
  coin: '#FFC94D',
  badge_red: '#E5453D',

  // —— 米色系(书籍详情顶部 / 福利页底 / 出版标签) ——
  bg_paper_top: '#FBF6EC',
  bg_paper_page: '#F6F1E8',
  tag_warm_bg: '#F1E9DA',
  tag_warm_text: '#8A6A45',
  /** 次要实心按钮(详情页「加入书架」) */
  btn_secondary: '#333333',
} as const;

export const colorsDark: { [K in keyof typeof colors]?: string } = {
  bg_page: '#121212',
  bg_page_alt: '#121212',
  bg_card: '#1E1E1E',
  bg_fill: '#2A2A2A',
  bg_fill_weak: '#242424',
  bg_mask: 'rgba(0,0,0,0.60)',

  divider: '#2E2E2E',
  border: '#333333',
  border_input: '#3A3A3A',

  text_primary: '#E8E8E8',
  text_regular: '#CFCFCF',
  text_secondary: '#9A9A9A',
  text_tertiary: '#8A8A8A',
  text_quaternary: '#6E6E6E',
  text_disabled: '#5A5A5A',

  brand_weak: '#8A4A32',
  brand_soft: '#3A241B',
  brand_soft_alt: '#2E1E16',

  bg_paper_top: '#1F1B16',
  bg_paper_page: '#161412',
  tag_warm_bg: '#3A2E20',
  tag_warm_text: '#D8B98A',
  btn_secondary: '#3F3F3F',
} as const;
