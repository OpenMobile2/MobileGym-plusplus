/** 结构性常量(Tab/网格布局);用户数据在 data/defaults.json */
// v11: 0814 复查——街道(翠屏街道)与收件人/抬头(苏宁用户)进一步脱敏,重置持久化生效
export const DATA_VERSION = 12;

export const TAB_PATHS = ['/', '/discover', '/cart', '/me'] as const;

/** 底部主 Tab(走查 0729:选中仍显示「发现」) */
export const MAIN_TABS = [
  { path: '/', key: 'tabHome', icon: 'IcHome' },
  { path: '/discover', key: 'tabDiscover', icon: 'IcDiscover' },
  { path: '/cart', key: 'tabCart', icon: 'IcCart' },
  { path: '/me', key: 'tabMe', icon: 'IcUser' },
] as const;
