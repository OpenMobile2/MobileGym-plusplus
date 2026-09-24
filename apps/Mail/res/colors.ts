/**
 * 邮件 App 特殊色值 —— 取自 mail_images/ 里的 iOS 26 截图，Tailwind 表达不了的才放这里。
 * 标准灰阶直接用 Tailwind 类，不在此重复定义。
 */
export const colors = {
  /** iOS 系统蓝：链接、选中态、发送键 */
  accent: '#007AFF',
  /** 分组列表背景（首页那种浅灰） */
  groupedBg: '#F2F2F7',
  /** 卡片/列表白底 */
  surface: '#FFFFFF',
  /** 分隔线 */
  separator: '#E5E5EA',
  /** 二级文字（时间、预览文本） */
  secondaryLabel: '#8E8E93',
  /** 三级文字（占位符） */
  tertiaryLabel: '#C7C7CC',

  /** 分类标签选中态底色 */
  catPrimary: '#3B7BF6',
  catTransactions: '#2FA84F',
  catUpdates: '#5E5CE6',
  catPromotions: '#D6316B',
  catAllMail: '#1C1C1E',

  /** 分类说明横幅底色（浅色版） */
  bannerTransactionsBg: '#E4F3E7',
  bannerTransactionsText: '#2A7D42',
  bannerUpdatesBg: '#E8E7FB',
  bannerUpdatesText: '#4B49C4',
  bannerPromotionsBg: '#FBE4EC',
  bannerPromotionsText: '#B32A5E',

  /** 手势操作按钮 */
  swipeMore: '#8E8E93',
  swipeFlag: '#FF9500',
  swipeTrash: '#FF3B30',
  swipeUnread: '#007AFF',
  swipeRemind: '#5E5CE6',

  /** 未读蓝点 */
  unreadDot: '#007AFF',
  /** 已标记橙旗 */
  flagOrange: '#FF9500',
  /** 危险操作红字 */
  destructive: '#FF3B30',

  /** 发件人头像方块默认底色（企业类邮件） */
  avatarCorp: '#A8C0E8',
} as const;

export const colorsDark = {
  groupedBg: '#000000',
  surface: '#1C1C1E',
  separator: '#38383A',
  secondaryLabel: '#98989F',
  tertiaryLabel: '#5A5A5F',
  bannerTransactionsBg: '#12301A',
  bannerUpdatesBg: '#1D1C3A',
  bannerPromotionsBg: '#35131F',
  avatarCorp: '#3A4A63',
} as const;
