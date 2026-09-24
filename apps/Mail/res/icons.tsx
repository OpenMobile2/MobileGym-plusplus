// Tier-2 drawable icons — 单色图标用 currentColor
// 图标选型对照 mail_images/ 里的 iOS 26 邮件截图，形似即可
import React from 'react';
import {
  // Navigation
  ChevronLeft,
  ChevronRight,
  ChevronDown,

  // Mailboxes
  Inbox,
  Mail,
  MailOpen,
  MailWarning,
  FileText,
  Send,
  Trash2,
  Folder,
  FolderPlus,
  Star,
  Flag,
  Clock,

  // Categories
  User,
  ShoppingCart,
  MessageSquare,
  Megaphone,

  // Actions
  Search,
  Mic,
  SquarePen,
  ListFilter,
  MoreHorizontal,
  X,
  Plus,
  Check,
  Reply,
  ReplyAll,
  Forward,
  Bell,
  BellOff,
  Copy,
  ContactRound,
  Paperclip,
  ArrowDown,
  ArrowUp,
  Menu,
  Circle,
  CircleCheck,
  Calendar,
  FileArchive,
  Ban,
} from 'lucide-react';
export type { LucideIcon } from 'lucide-react';

// === Navigation ===
export const IcNavBack = ChevronLeft;
export const IcChevronRight = ChevronRight;
export const IcChevronDown = ChevronDown;
export const IcClose = X;

// === Mailboxes ===
export const IcInbox = Inbox;
export const IcUnread = Mail;
export const IcFollowUp = MailWarning;
export const IcSendLater = Clock;
export const IcDrafts = FileText;
export const IcSent = Send;
export const IcJunk = Ban;
export const IcTrash = Trash2;
export const IcFolder = Folder;
export const IcNewFolder = FolderPlus;
export const IcStar = Star;
export const IcFlag = Flag;
export const IcMarkRead = MailOpen;

// === Categories（分类标签行）===
export const IcPrimary = User;
export const IcTransactions = ShoppingCart;
export const IcUpdates = MessageSquare;
export const IcPromotions = Megaphone;
export const IcAllMail = Inbox;

// === Actions ===
export const IcSearch = Search;
export const IcMic = Mic;
export const IcCompose = SquarePen;
export const IcFilter = ListFilter;
export const IcMore = MoreHorizontal;
export const IcPlus = Plus;
export const IcCheck = Check;
export const IcReply = Reply;
export const IcReplyAll = ReplyAll;
export const IcForward = Forward;
export const IcNotifyMe = Bell;
export const IcMute = BellOff;
export const IcCopy = Copy;
export const IcContactCard = ContactRound;
export const IcAttachment = Paperclip;
export const IcDownload = ArrowDown;
export const IcSend = ArrowUp;
export const IcDrag = Menu;
export const IcSelectOff = Circle;
export const IcSelectOn = CircleCheck;

// === Attachment kinds ===
export const IcFileIcs = Calendar;
export const IcFileZip = FileArchive;
export const IcFileOther = FileText;

/** 桌面图标：iOS 邮件的白色信封 */
export const IcLauncher: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    <path
      d="M8 15.5C8 13.567 9.567 12 11.5 12h25c1.933 0 3.5 1.567 3.5 3.5v17c0 1.933-1.567 3.5-3.5 3.5h-25C9.567 36 8 34.433 8 32.5v-17Z"
      fill="currentColor"
    />
    <path
      d="M9.5 15 24 26l14.5-11"
      stroke="#1E7BF5"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// === ICON_REGISTRY for dynamic lookup ===
export const ICON_REGISTRY: Record<string, any> = {
  IcNavBack,
  IcChevronRight,
  IcChevronDown,
  IcClose,
  IcInbox,
  IcUnread,
  IcFollowUp,
  IcSendLater,
  IcDrafts,
  IcSent,
  IcJunk,
  IcTrash,
  IcFolder,
  IcNewFolder,
  IcStar,
  IcFlag,
  IcMarkRead,
  IcPrimary,
  IcTransactions,
  IcUpdates,
  IcPromotions,
  IcAllMail,
  IcSearch,
  IcMic,
  IcCompose,
  IcFilter,
  IcMore,
  IcPlus,
  IcCheck,
  IcReply,
  IcReplyAll,
  IcForward,
  IcNotifyMe,
  IcMute,
  IcCopy,
  IcContactCard,
  IcAttachment,
  IcDownload,
  IcSend,
  IcDrag,
  IcSelectOff,
  IcSelectOn,
  IcFileIcs,
  IcFileZip,
  IcFileOther,
  IcLauncher,
};

/** 数据驱动渲染用：按名字取图标组件 */
export const IconRenderer: React.FC<{ name: string; size?: number; className?: string; style?: React.CSSProperties }> = ({
  name,
  ...rest
}) => {
  const Cmp = ICON_REGISTRY[name] ?? IcFolder;
  return <Cmp {...rest} />;
};
