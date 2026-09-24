// apps/GoogleDrive/res/dimens.ts — 多处复用的关键尺寸
// 来源 design-tokens.md：pt 数值直接当 px 用，不做 440→360 缩放
export const DIM = {
  pagePadding: 16,   // 页面左右边距
  topBarH: 56,       // 顶部搜索栏高
  rowH: 72,          // 双行列表行高（相邻图标中心距实测三次均为 72.0）
  sheetItemH: 56,    // 底部弹层菜单项高（连续 7 项实测均为 56.0）
  itemIcon: 24,      // 列表项图标尺寸
  itemIconLeft: 24,  // 列表项图标左边距
  iconButton: 32,    // 圆形图标按钮直径
  fab: 56,           // FAB 直径
  tabBarH: 64,       // 底部 Tab 栏区高
  sheetRadius: 8,    // 底部弹层圆角
  dialogRadius: 28,  // 对话框圆角
  toastRadius: 4,
} as const;
