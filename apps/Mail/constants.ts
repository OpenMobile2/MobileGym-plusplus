/**
 * 结构常量 —— App 的固定骨架，用户改不了的那些。
 * 用户能改的（哪些智能邮箱显示、排序、视图模式）在 state.ts；邮件内容在 data/defaults.json。
 */
import type { MailCategory, StandardFolder } from './types';
import type { MailStringKey } from './res/strings';

export const DATA_VERSION = 1;

/** 首页智能邮箱清单。visibleByDefault=false 的那些在 Edit 模式里未勾选（对照 IMG_2164）。 */
export const SMART_MAILBOXES: ReadonlyArray<{
  id: string;
  icon: string;
  labelKey: MailStringKey;
  visibleByDefault: boolean;
  /** 是否可在 Edit 模式里取消勾选。账号 Inbox 行是动态生成的，不在此列。 */
  editable: boolean;
}> = [
  { id: 'unread', icon: 'IcUnread', labelKey: 'mb_unread', visibleByDefault: true, editable: true },
  { id: 'all-inboxes', icon: 'IcAllMail', labelKey: 'mb_all_inboxes', visibleByDefault: true, editable: true },
  { id: 'follow-up', icon: 'IcFollowUp', labelKey: 'mb_follow_up', visibleByDefault: true, editable: true },
  { id: 'send-later', icon: 'IcSendLater', labelKey: 'mb_send_later', visibleByDefault: true, editable: true },
  { id: 'flagged', icon: 'IcFlag', labelKey: 'mb_flagged', visibleByDefault: false, editable: true },
  { id: 'to-or-cc', icon: 'IcPrimary', labelKey: 'mb_to_or_cc', visibleByDefault: false, editable: true },
  { id: 'attachments', icon: 'IcAttachment', labelKey: 'mb_attachments', visibleByDefault: false, editable: true },
  { id: 'thread-notifications', icon: 'IcNotifyMe', labelKey: 'mb_thread_notifications', visibleByDefault: false, editable: true },
  { id: 'all-sent', icon: 'IcSent', labelKey: 'mb_all_sent', visibleByDefault: false, editable: true },
  { id: 'all-trash', icon: 'IcTrash', labelKey: 'mb_all_trash', visibleByDefault: false, editable: true },
  { id: 'all-junk', icon: 'IcJunk', labelKey: 'mb_all_junk', visibleByDefault: false, editable: true },
];

/** 每个账号下的标准文件夹（Virus Items 已按阶段④审核移除）。 */
export const ACCOUNT_FOLDERS: ReadonlyArray<{
  folder: StandardFolder;
  icon: string;
  labelKey: MailStringKey;
  /** 首页该行右侧是否显示条数（真机只有 Drafts 显示） */
  showCount: boolean;
}> = [
  { folder: 'inbox', icon: 'IcInbox', labelKey: 'folder_inbox', showCount: false },
  { folder: 'drafts', icon: 'IcDrafts', labelKey: 'folder_drafts', showCount: true },
  { folder: 'sent', icon: 'IcSent', labelKey: 'folder_sent', showCount: false },
  { folder: 'junk', icon: 'IcJunk', labelKey: 'folder_junk', showCount: false },
  { folder: 'trash', icon: 'IcTrash', labelKey: 'folder_trash', showCount: false },
];

/** 分类标签行。顺序即真机从左到右的顺序（对照 IMG_2168）。 */
export const CATEGORY_TABS: ReadonlyArray<{
  id: MailCategory | 'all';
  icon: string;
  labelKey: MailStringKey;
  colorKey: 'catPrimary' | 'catTransactions' | 'catUpdates' | 'catPromotions' | 'catAllMail';
  /** 该分类是否按发件人聚合成 bundle（Primary 和 All Mail 不聚合） */
  bundled: boolean;
}> = [
  { id: 'primary', icon: 'IcPrimary', labelKey: 'cat_primary', colorKey: 'catPrimary', bundled: false },
  { id: 'transactions', icon: 'IcTransactions', labelKey: 'cat_transactions', colorKey: 'catTransactions', bundled: true },
  { id: 'updates', icon: 'IcUpdates', labelKey: 'cat_updates', colorKey: 'catUpdates', bundled: true },
  { id: 'promotions', icon: 'IcPromotions', labelKey: 'cat_promotions', colorKey: 'catPromotions', bundled: true },
  { id: 'all', icon: 'IcAllMail', labelKey: 'cat_all_mail', colorKey: 'catAllMail', bundled: false },
];

/** 三个分类各自的说明横幅（Primary / All Mail 没有横幅）。 */
export const CATEGORY_BANNERS: Record<string, { titleKey: MailStringKey; bodyKey: MailStringKey; bgKey: string; textKey: string }> = {
  transactions: {
    titleKey: 'banner_transactions_title',
    bodyKey: 'banner_transactions_body',
    bgKey: 'bannerTransactionsBg',
    textKey: 'bannerTransactionsText',
  },
  updates: {
    titleKey: 'banner_updates_title',
    bodyKey: 'banner_updates_body',
    bgKey: 'bannerUpdatesBg',
    textKey: 'bannerUpdatesText',
  },
  promotions: {
    titleKey: 'banner_promotions_title',
    bodyKey: 'banner_promotions_body',
    bgKey: 'bannerPromotionsBg',
    textKey: 'bannerPromotionsText',
  },
};

/** Remind Me 子菜单选项。offsetMinutes 用于计算 remindedAt。 */
export const REMIND_OPTIONS: ReadonlyArray<{ id: string; labelKey: MailStringKey; offsetMinutes: number }> = [
  { id: 'in1h', labelKey: 'remind_1h', offsetMinutes: 60 },
  { id: 'tonight', labelKey: 'remind_tonight', offsetMinutes: 60 * 6 },
  { id: 'tomorrow', labelKey: 'remind_tomorrow', offsetMinutes: 60 * 24 },
  { id: 'later', labelKey: 'remind_later', offsetMinutes: 60 * 48 },
];

/** 布局参数 */
export const LAYOUT = {
  /** 左滑露出三个按钮的总宽度（More / Flag / Trash 各 72） */
  swipeLeftWidth: 216,
  /** 右滑露出两个按钮的总宽度（Unread / Remind Me 各 76） */
  swipeRightWidth: 152,
  /** 开始判定为拖动的位移阈值 */
  dragThreshold: 8,
  /**
   * 从关闭态滑出多少就吸附到全开。取小值（不是宽度的一半），
   * 这样轻轻一滑就整组展开，不用一路拖到底。
   */
  swipeOpenThreshold: 48,
  /** 已展开时往回滑多少就吸附到全收。比开启阈值更小 —— 收回要更容易触发。 */
  swipeCloseThreshold: 28,
  /** 长按弹出操作菜单的判定时长，与平台 useTriggerGestures 的默认值保持一致 */
  longPressMs: 400,
  /** 邮件行头像方块边长 */
  avatarSize: 40,
} as const;
