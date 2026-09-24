// Slack 复刻 — 应用级类型。字段与 docs/slack-replication/spec.json (frozen v1.0.0) 的 seedData 对应。

import type React from 'react';

/**
 * bindTap / bindLongPress / action / bindInput / bindBack 返回的 DOM 绑定。
 * 组件把它整份展开到元素上；data-* 键显式列出，否则会被 TS 的 weak type 检查拒掉。
 */
export type Bind = React.HTMLAttributes<HTMLElement> & {
  'data-trigger'?: string;
  'data-trigger-type'?: string;
  'data-trigger-params'?: string;
  'data-action'?: string;
  'data-action-type'?: string;
  'data-action-params'?: string;
};

export interface SlackUser {
  id: string;
  /** @提及用的 handle，如 lin.xiao */
  handle: string;
  /** 显示名，如「林筱」 */
  displayName: string;
  title: string;
  /** res/colors.ts AVATAR_COLORS 的 key */
  avatarColor: string;
  /** 无图头像上的字 */
  initial: string;
  /** Layer 4：生成头像资源路径（有则优先于色块） */
  avatarSrc?: string;
  online: boolean;
  statusEmoji: string;
  statusText: string;
  isBot: boolean;
  isSelf: boolean;
  email: string;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

/** 消息附件：图片 / 文件 / 链接预览 */
export interface Attachment {
  kind: 'image' | 'file' | 'link';
  /** 文件名或图片标题 */
  name?: string;
  /** 系统相册选出的图片 path/uri（优先于色块占位） */
  uri?: string;
  /** 图片占位底色（Layer 4 换成生成图） */
  color?: string;
  /** 图片宽高比，用于占位块 */
  ratio?: number;
  /** 文件大小文案，如「1.2 MB」 */
  size?: string;
  ext?: string;
  /** 链接预览 */
  url?: string;
  title?: string;
  domain?: string;
  desc?: string;
}

/** 转发消息带的引用块（左侧竖线 + 原作者 + 原文） */
export interface Quote {
  userId: string;
  text: string;
  /** 原会话名，如「education」 */
  convName: string;
}

export interface Message {
  id: string;
  /** 所属会话（频道 / 私信 / 群私信） */
  convId: string;
  userId: string;
  text: string;
  ts: number;
  edited: boolean;
  reactions: Reaction[];
  attachments: Attachment[];
  /** 非 null 表示这是某条主消息的消息列回复 */
  threadParentId: string | null;
  /** 主消息被回复的次数（消息列入口显示「N 条回复」） */
  replyCount: number;
  /** 参与回复的人（消息列入口的小头像堆叠） */
  replyUserIds: string[];
  pinned: boolean;
  saved: boolean;
  /** 含 @自己 → 整块浅黄底 */
  isMention: boolean;
  /** 「XX 加入了频道」这类居中灰字系统行 */
  system: boolean;
  /** 已删除 → 显示「此消息已删除」灰字占位 */
  deleted: boolean;
  /** 整条只有 emoji → 放大显示 */
  bigEmoji: boolean;
  /** 转发进来的消息带引用块 */
  quote: Quote | null;
  /** 消息列回复且勾了「同时发送至 #频道」→ 主时间线里带来源标记 */
  alsoSent: boolean;
}

/** 「提醒我」注册的定时提醒 */
export interface Reminder {
  id: string;
  messageId: string;
  convId: string;
  dueTs: number;
}

export type ConvKind = 'channel' | 'dm' | 'group';

export interface Conversation {
  id: string;
  kind: ConvKind;
  /** 频道名（不带 #）或对方显示名 */
  name: string;
  isPrivate: boolean;
  topic: string;
  description: string;
  memberIds: string[];
  /** 所属分区 id（主页按分区分组时用） */
  sectionId: string;
  /** 徽章数字。按 Q四-1：只有 @提及 和私信才给数字 */
  unreadCount: number;
  /** 有新消息 → 频道名加粗 */
  hasUnread: boolean;
  /** 「新消息」红线插在这条 ts 之后 */
  lastReadTs: number;
  muted: boolean;
  starred: boolean;
  /** 归档后从主页消失，只在「浏览频道」的已归档里出现 */
  archived: boolean;
  /** 设置和详情里的「频道成员建议」：关掉后 @非成员不再出现添加提示条 */
  memberSuggestion: boolean;
  /** 「X 在 ⋯ 创建了这个频道。」 */
  creatorId: string;
  createdTs: number;
  /** 未发送的输入框内容，同时出现在「草稿」页 */
  draft: string;
  /** 最近活动时间，主页按时间排序时用 */
  lastActivityTs: number;
}

export interface Section {
  id: string;
  name: string;
  collapsed: boolean;
}

export type ActivityKind = 'mention' | 'reaction' | 'thread' | 'invite';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  userId: string;
  convId: string;
  messageId: string;
  /** 摘要文案 */
  text: string;
  emoji: string;
  ts: number;
  /** false 时行内显示紫点；全部为 true 后底栏紫点才消失 */
  read: boolean;
}

export interface UserStatus {
  emoji: string;
  text: string;
  /** 「清除时间」文案，如「今天」「不清除」 */
  clearAfter: string;
  /** 到点自动清除的时间戳；null = 不清除 */
  clearAtTs: number | null;
}

export interface Settings {
  /** 首选项 → 语言。'system' 跟随系统 */
  language: 'system' | 'zh' | 'en';
  /** 只做浅色；选深色/系统会提示「功能暂未开放」 */
  colorMode: 'light';
  /** 主页排序方式 */
  homeSort: 'section' | 'recent';
  /** 未读和提及：置顶 / 按顺序显示 */
  unreadSort: 'top' | 'inline';
  /** 主页「自定义」里各卡片的顺序 */
  customizeOrder: string[];
  /** 各快速视图卡的开关 */
  customizeEnabled: Record<string, boolean>;
  /** 暂停通知到什么时候；null = 未暂停 */
  notificationsPausedUntil: number | null;
  notifyMode: 'all' | 'mentions' | 'nothing';
  /** 文件页类型多选 */
  fileTypeFilters: string[];
  messagePreview: boolean;
  soundEnabled: boolean;
}

export interface TempState {
  toast: string;
  /** 提示文案的 i18n key；非空时优先于 toast，用来让「暂未开放」跟随语言 */
  toastKey: string;
  toastSeq: number;
  /** 引导卡「全部清除」只在当次会话生效，刷新后复现（阶段④ 订正） */
  guideCleared: boolean;
  /** 多选删除态的草稿 id */
  draftSelection: string[];
  /** 设置状态页顶部提示卡 */
  statusNoticeDismissed: boolean;
}

export interface FullState {
  _dataVersion: number;
  users: SlackUser[];
  sections: Section[];
  conversations: Conversation[];
  messages: Message[];
  /** 关掉了回复通知的消息列（主消息 id） */
  mutedThreads: string[];
  reminders: Reminder[];
  activity: ActivityItem[];
  searchHistory: string[];
  status: UserStatus;
  settings: Settings;
  workspace: { name: string; url: string; memberCount: number };
  /** 消息列已读时间戳（父消息 id → 读到的最后回复 ts） */
  threadReadTs: Record<string, number>;
  /** 留待以后处理：已完成 / 已归档（业务态，须持久化，勿进 _temp） */
  savedBuckets: Record<string, 'done' | 'archived'>;
  _temp: TempState;
}

export interface AppActions {
  showToast: (msg: string) => void;
  notImplemented: () => void;

  /** 消息 */
  sendMessage: (
    convId: string,
    text: string,
    opts?: {
      threadParentId?: string | null;
      attachments?: Attachment[];
      alsoSent?: boolean;
      quote?: Quote | null;
    },
  ) => string;
  editMessage: (id: string, text: string) => void;
  deleteMessage: (id: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  toggleSaved: (messageId: string) => void;
  togglePinned: (messageId: string) => void;
  /** 「不获取回复通知」：切换某消息列的通知开关 */
  toggleThreadMute: (messageId: string) => void;
  /** 「提醒我」：按分钟注册一条应用内提醒 */
  addReminder: (messageId: string, minutes: number) => void;
  /**
   * 到点的提醒由 Slackbot 私信发出（会话页轮询调用）。
   * store 里没有 i18n，提醒语前缀由调用方按当前语言传进来。
   */
  fireDueReminders: (noticePrefix: string) => void;
  /** 「前进」：把消息带引用块转发到目标会话 */
  forwardMessage: (messageId: string, targetConvId: string, note: string) => void;

  /** 会话 */
  setDraft: (convId: string, text: string) => void;
  clearDraft: (convId: string) => void;
  markRead: (convId: string) => void;
  markUnread: (convId: string, fromTs: number) => void;
  markThreadRead: (parentMessageId: string, ts?: number) => void;
  toggleMute: (convId: string) => void;
  toggleStar: (convId: string) => void;
  createChannel: (
    name: string,
    isPrivate: boolean,
    opts?: { joinText?: (name: string) => string },
  ) => string;
  updateChannel: (convId: string, patch: Partial<Conversation>) => void;
  leaveChannel: (convId: string) => void;
  /** 归档：频道从主页消失，进「浏览频道」的已归档 */
  archiveChannel: (convId: string) => void;
  /** 转为私人频道：# → 🔒 */
  convertToPrivate: (convId: string) => void;
  toggleMemberSuggestion: (convId: string) => void;
  /**
   * 加人：写入成员名单 + 每人补一条「X 已加入 #频道.」系统消息。
   * 系统消息文案在 store 外拼好传进来（store 里没有 i18n）。
   */
  addMembers: (convId: string, userIds: string[], joinText?: (name: string) => string) => void;
  openDm: (userId: string) => string;
  /** 群私信：多个收件人开一个新会话 */
  openGroupDm: (userIds: string[]) => string;
  /** Slackbot 关键词自动回复（会话页延时 1–2 秒后调用） */
  replyAsUser: (convId: string, userId: string, text: string) => void;

  /** 分区 */
  toggleSection: (sectionId: string) => void;

  /** 活动 */
  readActivity: (id: string) => void;

  /** 搜索 */
  pushSearchHistory: (q: string) => void;
  clearSearchHistory: () => void;

  /** 我 */
  togglePresence: () => void;
  setStatus: (patch: Partial<UserStatus>) => void;
  clearStatus: () => void;
  dismissStatusNotice: () => void;
  completeSavedItem: (messageId: string, bucket: 'done' | 'archived') => void;
  /** 新增一条「留待以后处理」笔记（挂在任意已有会话上，仅用于 Later 列表） */
  addSavedItem: (text: string) => string | null;
  toggleFileTypeFilter: (typeId: string) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  pauseNotifications: (untilTs: number | null) => void;
  moveCustomizeItem: (id: string, dir: 'before' | 'after') => void;
  toggleCustomizeCard: (id: string) => void;

  /** 用户资料 */
  updateUser: (userId: string, patch: Partial<Pick<SlackUser, 'displayName' | 'title' | 'email'>>) => void;

  /** 引导卡（仅当次会话） */
  clearGuideCards: () => void;

  /** 草稿多选 */
  toggleDraftSelection: (convId: string) => void;
  resetDraftSelection: () => void;
  deleteSelectedDrafts: () => void;
}
