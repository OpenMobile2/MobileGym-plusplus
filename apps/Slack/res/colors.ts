// Slack — 色值（取自真机截图，见 docs/slack-replication/design-tokens.md）
// ⚠️ iOS 截图为 Display P3，下列值均已转换到 sRGB，可直接用于 CSS，不要自行调整。

/** 品牌紫系 */
export const PURPLE = {
  /** 品牌基色 Aubergine */
  aubergine: '#4A154B',
  /** 顶栏底色（比 aubergine 深一档，三页取样一致） */
  topbar: '#420E43',
  /** 顶栏内胶囊 / 分段选中填充 */
  pill: '#611E68',
  /** 右下悬浮 ＋ 按钮 */
  fab: '#502051',
  /** 底栏选中态图标 */
  tabActive: '#4A1562',
  /** 底栏「活动」未读小圆点 */
  unreadDot: '#82388A',
};

/** 绿 —— 主行动 / 成功。发送键、编辑确认、完成按钮、tab 下划线、会议按钮同一值 */
export const GREEN = {
  primary: '#007A5A',
  /** 头像右下在线绿点 */
  online: '#21A170',
};

/** 红 —— 破坏性 / 取消 */
export const RED = {
  /** 编辑取消 ✕、「清除」 */
  primary: '#E01E5A',
  /** 「删除消息」文字 */
  destructive: '#C01343',
};

/** 蓝 —— 链接 / 强调 */
export const BLUE = {
  /** 「全部清除」、「N 条回复」、@提及、URL、tab 选中 */
  link: '#1264A3',
  /** 自己点过的 reaction 胶囊描边 */
  reactionActiveBorder: '#1264A3',
  /** 自己点过的 reaction 胶囊填充 */
  reactionActiveBg: '#E4F8FD',
  /** 提示卡浅蓝底 */
  noticeBg: '#E3F8FF',
};

/** 中性色 */
export const NEUTRAL = {
  bg: '#FFFFFF',
  /** 消息输入框填充 */
  bgInput: '#FBFBFA',
  /** 长按面板方块按钮 / 频道开篇按钮的灰底 */
  bgPanelBtn: '#F8F8F8',
  textPrimary: '#1D1C1D',
  textSecondary: '#5E5D5F',
  divider: '#EAEAEA',
};

/**
 * 高亮底色。@提及整块浅黄、正在编辑、搜索命中三处数值极近，
 * 按 design-tokens.md §6 统一用一个值。
 */
export const HIGHLIGHT = '#FDF4D9';

/** 头像色板 —— 无图头像的圆角方块底色（Slack 用圆角矩形头像，不是圆形） */
export const AVATAR_COLORS: Record<string, string> = {
  avatarPurple: '#4A154B',
  avatarBlue: '#1264A3',
  avatarGreen: '#007A5A',
  avatarOrange: '#DE7C00',
  avatarRed: '#E01E5A',
  avatarTeal: '#2EB67D',
};

export function avatarColor(key: string): string {
  return AVATAR_COLORS[key] ?? AVATAR_COLORS.avatarPurple;
}
