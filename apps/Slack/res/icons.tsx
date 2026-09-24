import React from 'react';
import {
  House,
  MessageSquare,
  MessagesSquare,
  Bell,
  Menu,
  Search,
  Plus,
  Hash,
  Lock,
  ListFilter,
  SquarePen,
  Settings,
  Headphones,
  Bookmark,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MoreVertical,
  X,
  Check,
  Trash2,
  BellOff,
  Star,
  Copy,
  LogOut,
  Smile,
  Paperclip,
  Send,
  AtSign,
  Users,
  UserPlus,
  Monitor,
  Lightbulb,
  Eye,
  Pin,
  Clock,
  Link2,
  Share,
  Share2,
  Image,
  Camera,
  Video,
  FolderOpen,
  Globe,
  CircleUser,
  Building2,
  CircleHelp,
  Languages,
  Palette,
  ArrowRight,
  ArrowLeft,
  Reply,
  ExternalLink,
  Info,
  Type,
  BookOpen,
  CreditCard,
  Gauge,
  Bug,
  Plug,
  RotateCcw,
  MoveRight,
  Pencil,
  CaseSensitive,
  Slash,
  Mic,
  PenTool,
  Folder,
  Forward,
  Archive,
  Grip,
  type LucideProps,
} from 'lucide-react';

// 底栏 Tab
export const IcHome = (p: LucideProps) => <House {...p} />;
export const IcDm = (p: LucideProps) => <MessagesSquare {...p} />;
export const IcActivity = (p: LucideProps) => <Bell {...p} />;
export const IcMore = (p: LucideProps) => <Menu {...p} />;
export const IcSearch = (p: LucideProps) => <Search {...p} />;

// 顶栏 / 主页
export const IcFilter = (p: LucideProps) => <ListFilter {...p} />;
export const IcCompose = (p: LucideProps) => <SquarePen {...p} />;
export const IcPlus = (p: LucideProps) => <Plus {...p} />;
export const IcHash = (p: LucideProps) => <Hash {...p} />;
export const IcLock = (p: LucideProps) => <Lock {...p} />;
export const IcGear = (p: LucideProps) => <Settings {...p} />;

// 快速视图卡
export const IcHuddle = (p: LucideProps) => <Headphones {...p} />;
export const IcSaved = (p: LucideProps) => <Bookmark {...p} />;
export const IcDrafts = (p: LucideProps) => <FileText {...p} />;
export const IcThread = (p: LucideProps) => <MessageSquare {...p} />;
export const IcUnreadTidy = (p: LucideProps) => <Eye {...p} />;

// 引导卡
export const IcAddMember = (p: LucideProps) => <UserPlus {...p} />;
export const IcDesktop = (p: LucideProps) => <Monitor {...p} />;
export const IcTip = (p: LucideProps) => <Lightbulb {...p} />;

// 通用导航
export const IcBack = (p: LucideProps) => <ChevronLeft {...p} />;
export const IcForward = (p: LucideProps) => <ChevronRight {...p} />;
export const IcChevronRight = (p: LucideProps) => <ChevronRight {...p} />;
export const IcChevronDown = (p: LucideProps) => <ChevronDown {...p} />;
export const IcChevronUp = (p: LucideProps) => <ChevronUp {...p} />;
export const IcArrowRight = (p: LucideProps) => <ArrowRight {...p} />;
export const IcArrowLeft = (p: LucideProps) => <ArrowLeft {...p} />;
export const IcOverflow = (p: LucideProps) => <MoreHorizontal {...p} />;
export const IcOverflowV = (p: LucideProps) => <MoreVertical {...p} />;
export const IcClose = (p: LucideProps) => <X {...p} />;
export const IcCheck = (p: LucideProps) => <Check {...p} />;

// 消息操作
export const IcTrash = (p: LucideProps) => <Trash2 {...p} />;
export const IcMute = (p: LucideProps) => <BellOff {...p} />;
export const IcStar = (p: LucideProps) => <Star {...p} />;
export const IcCopy = (p: LucideProps) => <Copy {...p} />;
export const IcLeave = (p: LucideProps) => <LogOut {...p} />;
export const IcEmoji = (p: LucideProps) => <Smile {...p} />;
export const IcAttach = (p: LucideProps) => <Paperclip {...p} />;
export const IcSend = (p: LucideProps) => <Send {...p} />;
export const IcAt = (p: LucideProps) => <AtSign {...p} />;
export const IcPin = (p: LucideProps) => <Pin {...p} />;
export const IcClock = (p: LucideProps) => <Clock {...p} />;
export const IcShare = (p: LucideProps) => <Share2 {...p} />;
/** 抱团弹层：复制链接（链环） */
export const IcHuddleLink = (p: LucideProps) => <Link2 {...p} />;
/** 抱团弹层：分享（向右箭头） */
export const IcHuddleShare = (p: LucideProps) => <Share {...p} />;
export const IcReply = (p: LucideProps) => <Reply {...p} />;

// 附件 / 文件
export const IcImage = (p: LucideProps) => <Image {...p} />;
export const IcCamera = (p: LucideProps) => <Camera {...p} />;
export const IcVideo = (p: LucideProps) => <Video {...p} />;
export const IcFile = (p: LucideProps) => <FolderOpen {...p} />;
export const IcLink = (p: LucideProps) => <Globe {...p} />;

// 更多页 / 设置
export const IcMembers = (p: LucideProps) => <Users {...p} />;
export const IcProfile = (p: LucideProps) => <CircleUser {...p} />;
export const IcWorkspace = (p: LucideProps) => <Building2 {...p} />;
export const IcHelp = (p: LucideProps) => <CircleHelp {...p} />;
export const IcLanguage = (p: LucideProps) => <Languages {...p} />;
export const IcTheme = (p: LucideProps) => <Palette {...p} />;
export const IcGlobe = (p: LucideProps) => <Globe {...p} />;
export const IcExternalLink = (p: LucideProps) => <ExternalLink {...p} />;
export const IcInfo = (p: LucideProps) => <Info {...p} />;
export const IcText = (p: LucideProps) => <Type {...p} />;
export const IcLibrary = (p: LucideProps) => <BookOpen {...p} />;
export const IcBilling = (p: LucideProps) => <CreditCard {...p} />;
export const IcAnalytics = (p: LucideProps) => <Gauge {...p} />;
export const IcDebug = (p: LucideProps) => <Bug {...p} />;
export const IcNetwork = (p: LucideProps) => <Plug {...p} />;
export const IcFeedback = (p: LucideProps) => <RotateCcw {...p} />;
export const IcSwipe = (p: LucideProps) => <MoveRight {...p} />;

// 会话域
export const IcEdit = (p: LucideProps) => <Pencil {...p} />;
export const IcFormat = (p: LucideProps) => <CaseSensitive {...p} />;
export const IcSlash = (p: LucideProps) => <Slash {...p} />;
export const IcMic = (p: LucideProps) => <Mic {...p} />;
export const IcCanvas = (p: LucideProps) => <PenTool {...p} />;
export const IcFolder = (p: LucideProps) => <Folder {...p} />;
/** 「前进」（转发）用的曲线箭头，和列表右侧的 ChevronRight 不是一个 */
export const IcForwardMsg = (p: LucideProps) => <Forward {...p} />;

// 频道管理域
/** 通知行的铃铛。和底栏「活动」同形，但语义不同，各留一个别名 */
export const IcBell = (p: LucideProps) => <Bell {...p} />;
export const IcArchive = (p: LucideProps) => <Archive {...p} />;
export const IcApps = (p: LucideProps) => <Grip {...p} />;

export const ICON_REGISTRY: Record<string, React.FC<LucideProps>> = {
  IcHome,
  IcDm,
  IcActivity,
  IcMore,
  IcSearch,
  IcFilter,
  IcCompose,
  IcPlus,
  IcHash,
  IcLock,
  IcGear,
  IcHuddle,
  IcSaved,
  IcDrafts,
  IcThread,
  IcUnreadTidy,
  IcAddMember,
  IcDesktop,
  IcTip,
  IcBack,
  IcForward,
  IcChevronRight,
  IcChevronDown,
  IcChevronUp,
  IcArrowRight,
  IcArrowLeft,
  IcOverflow,
  IcOverflowV,
  IcClose,
  IcCheck,
  IcTrash,
  IcMute,
  IcStar,
  IcCopy,
  IcLeave,
  IcEmoji,
  IcAttach,
  IcSend,
  IcAt,
  IcPin,
  IcClock,
  IcShare,
  IcReply,
  IcImage,
  IcCamera,
  IcVideo,
  IcFile,
  IcLink,
  IcMembers,
  IcProfile,
  IcWorkspace,
  IcHelp,
  IcLanguage,
  IcTheme,
  IcGlobe,
  IcExternalLink,
  IcInfo,
  IcText,
  IcLibrary,
  IcBilling,
  IcAnalytics,
  IcDebug,
  IcNetwork,
  IcFeedback,
  IcSwipe,
  IcEdit,
  IcFormat,
  IcSlash,
  IcMic,
  IcCanvas,
  IcFolder,
  IcForwardMsg,
  IcBell,
  IcArchive,
  IcApps,
};

export const IconRenderer: React.FC<{ name: string } & LucideProps> = ({ name, ...rest }) => {
  const Cmp = ICON_REGISTRY[name];
  if (!Cmp) return null;
  return <Cmp {...rest} />;
};
