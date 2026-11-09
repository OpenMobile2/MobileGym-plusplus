import React from 'react';
import {
  CheckSquare,
  Calendar,
  LayoutGrid,
  Target,
  Settings2,
  Settings,
  Plus,
  MoreHorizontal,
  Menu,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Flag,
  Tag,
  Clock,
  AlarmClock,
  Repeat,
  ArrowRight,
  Play,
  Pause,
  Square,
  Music,
  Sun,
  Trash2,
  Check,
  X,
  Inbox,
  CalendarDays,
  Crown,
  Sparkles,
  Paperclip,
  ListChecks,
  Pin,
  type LucideProps,
} from 'lucide-react';

// Tab 图标
export const IcTasks = (p: LucideProps) => <CheckSquare {...p} />;
export const IcCalendar = (p: LucideProps) => <Calendar {...p} />;
export const IcMatrix = (p: LucideProps) => <LayoutGrid {...p} />;
export const IcFocus = (p: LucideProps) => <Target {...p} />;
export const IcMe = (p: LucideProps) => <Settings2 {...p} />;
export const IcGear = (p: LucideProps) => <Settings {...p} />;
// 通用
export const IcPlus = (p: LucideProps) => <Plus {...p} />;
export const IcMore = (p: LucideProps) => <MoreHorizontal {...p} />;
export const IcMenu = (p: LucideProps) => <Menu {...p} />;
export const IcBell = (p: LucideProps) => <Bell {...p} />;
export const IcSearch = (p: LucideProps) => <Search {...p} />;
export const IcBack = (p: LucideProps) => <ChevronLeft {...p} />;
export const IcChevronRight = (p: LucideProps) => <ChevronRight {...p} />;
export const IcChevronDown = (p: LucideProps) => <ChevronDown {...p} />;
export const IcSwitch = (p: LucideProps) => <ChevronsUpDown {...p} />;
export const IcFlag = (p: LucideProps) => <Flag {...p} />;
export const IcTag = (p: LucideProps) => <Tag {...p} />;
export const IcClock = (p: LucideProps) => <Clock {...p} />;
export const IcAlarm = (p: LucideProps) => <AlarmClock {...p} />;
export const IcRepeat = (p: LucideProps) => <Repeat {...p} />;
export const IcMove = (p: LucideProps) => <ArrowRight {...p} />;
export const IcPlay = (p: LucideProps) => <Play {...p} />;
export const IcPause = (p: LucideProps) => <Pause {...p} />;
export const IcStop = (p: LucideProps) => <Square {...p} />;
export const IcMusic = (p: LucideProps) => <Music {...p} />;
export const IcBrightness = (p: LucideProps) => <Sun {...p} />;
export const IcTrash = (p: LucideProps) => <Trash2 {...p} />;
export const IcCheck = (p: LucideProps) => <Check {...p} />;
export const IcClose = (p: LucideProps) => <X {...p} />;
export const IcInbox = (p: LucideProps) => <Inbox {...p} />;
export const IcToday = (p: LucideProps) => <CalendarDays {...p} />;
export const IcCrown = (p: LucideProps) => <Crown {...p} />;
export const IcAI = (p: LucideProps) => <Sparkles {...p} />;
export const IcAttach = (p: LucideProps) => <Paperclip {...p} />;
export const IcChecklist = (p: LucideProps) => <ListChecks {...p} />;
export const IcPin = (p: LucideProps) => <Pin {...p} />;

export const ICON_REGISTRY: Record<string, (p: LucideProps) => React.ReactElement> = {
  IcTasks, IcCalendar, IcMatrix, IcFocus, IcMe, IcGear,
  IcPlus, IcMore, IcMenu, IcBell, IcSearch, IcBack, IcChevronRight, IcChevronDown, IcSwitch,
  IcFlag, IcTag, IcClock, IcAlarm, IcRepeat, IcMove, IcPlay, IcPause, IcStop, IcMusic,
  IcBrightness, IcTrash, IcCheck, IcClose, IcInbox, IcToday, IcCrown, IcAI, IcAttach, IcChecklist, IcPin,
};

export const IconRenderer: React.FC<{ name: string } & LucideProps> = ({ name, ...p }) => {
  const C = ICON_REGISTRY[name];
  return C ? C(p) : null;
};
