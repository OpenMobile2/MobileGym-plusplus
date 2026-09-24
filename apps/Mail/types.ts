/** 邮件 App 类型定义 — 对应底稿 docs/mail-replication/spec.json v1.0.0 */

/** 邮件所属的智能分类（iOS 26 Categories）。用户自己发出的邮件一律 primary。 */
export type MailCategory = 'primary' | 'transactions' | 'updates' | 'promotions';

/** 账号下的标准文件夹。custom 文件夹用 `folder:<id>` 形式存在 customFolders 里。 */
export type StandardFolder = 'inbox' | 'drafts' | 'sent' | 'junk' | 'trash';

export interface MailAccount {
  id: string;
  /** 首页分组标题，如 stu.example.edu.cn / Gmail / QQ / Outlook */
  label: string;
  /** 本账号的自己的地址，用于 From / Bcc 预填 */
  address: string;
  /** 显示名，撰写签名用 */
  displayName: string;
}

export interface MailAddress {
  name: string;
  address: string;
}

export interface MailAttachment {
  name: string;
  /** 已格式化好的大小文本，如 "3 KB" / "6.5 MB" */
  size: string;
  /** 决定卡片上显示什么类型图标 */
  kind: 'ics' | 'zip' | 'pdf' | 'image' | 'other';
}

/** 正文块。图文邮件用多个块拼出 iOS 里那种图文混排效果。 */
export type MailBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'link'; text: string }
  | { kind: 'logo'; text: string }
  | { kind: 'img'; src: string; alt: string }
  | { kind: 'feature'; title: string; items: string[]; img?: string; alt?: string };

export interface Mail {
  id: string;
  accountId: string;
  /** 标准文件夹名，或用户新建文件夹的 id */
  folder: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;
  /** 列表里那两行预览文字 */
  preview: string;
  body: MailBlock[];
  /** 收到/发出的时间戳（TimeService.resolveDataTimestamp 解析后的 ms） */
  receivedAt: number;
  isRead: boolean;
  isFlagged: boolean;
  /** 会话里显示"已回复"小箭头 */
  isReplied: boolean;
  attachments: MailAttachment[];
  category: MailCategory;
  /** 同一 threadId 的邮件在详情页聚合成「N Messages」 */
  threadId?: string;
  /** 被 Remind Me 标记过 → 进 Follow Up 邮箱 */
  remindedAt?: number;
  isMuted?: boolean;
  notifyMe?: boolean;
  /** 长按预览卡顶部的时效徽标，如 "Time-Sensitive Transaction" */
  badge?: string;
}

export interface MailContact {
  id: string;
  name: string;
  address: string;
  /** 头像圆圈里的字，中文取姓、英文取首字母 */
  initial: string;
  /** 通讯录分组字母；中文名归到 '#' */
  section: string;
  /** 真机里自己那条显示 "me" */
  isMe?: boolean;
}

/** 用户新建的邮箱文件夹 */
export interface CustomFolder {
  id: string;
  name: string;
  accountId: string;
}

/** 首页智能邮箱行的种类 */
export type SmartMailboxId = 'unread' | 'all-inboxes' | 'follow-up' | 'send-later' | `acct:${string}`;

/** 列表显示模式（⋯ 菜单里切换，持久化） */
export type ViewMode = 'categories' | 'list';

export interface MailSettings {
  viewMode: ViewMode;
  showContactPhotos: boolean;
}
