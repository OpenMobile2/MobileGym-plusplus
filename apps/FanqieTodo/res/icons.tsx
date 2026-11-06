import React from 'react';
import {
  ListTodo,
  Lock,
  PieChart,
  ListFilter,
  User,
  Plus,
  MoreVertical,
  Clock,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sun,
  Music,
  Trash2,
  Check,
  X,
  Share2,
  ArrowUpDown,
  Bell,
  MessageCircle,
  Moon,
  Pin,
  Search,
  Shirt,
  Leaf,
  Grid3x3,
  ChartColumn,
  Download,
  RefreshCw,
  type LucideProps,
} from 'lucide-react';

// Tab 图标(Ic 前缀,ICON_REGISTRY 键与导出名一致)
export const IcTodo = (p: LucideProps) => <ListTodo {...p} />;
export const IcLock = (p: LucideProps) => <Lock {...p} />;
export const IcStats = (p: LucideProps) => <PieChart {...p} />;
export const IcTimeline = (p: LucideProps) => <ListFilter {...p} />;
export const IcProfile = (p: LucideProps) => <User {...p} />;
// 通用
export const IcPlus = (p: LucideProps) => <Plus {...p} />;
export const IcMore = (p: LucideProps) => <MoreVertical {...p} />;
export const IcClock = (p: LucideProps) => <Clock {...p} />;
export const IcBack = (p: LucideProps) => <ChevronLeft {...p} />;
export const IcChevronRight = (p: LucideProps) => <ChevronRight {...p} />;
export const IcPlay = (p: LucideProps) => <Play {...p} />;
export const IcPause = (p: LucideProps) => <Pause {...p} />;
export const IcReset = (p: LucideProps) => <RotateCcw {...p} />;
export const IcStop = (p: LucideProps) => <Square {...p} />;
export const IcBrightness = (p: LucideProps) => <Sun {...p} />;
export const IcMusic = (p: LucideProps) => <Music {...p} />;
export const IcTrash = (p: LucideProps) => <Trash2 {...p} />;
export const IcCheck = (p: LucideProps) => <Check {...p} />;
export const IcClose = (p: LucideProps) => <X {...p} />;
export const IcShare = (p: LucideProps) => <Share2 {...p} />;
export const IcSort = (p: LucideProps) => <ArrowUpDown {...p} />;
export const IcBell = (p: LucideProps) => <Bell {...p} />;
export const IcMotto = (p: LucideProps) => <MessageCircle {...p} />;
export const IcMoon = (p: LucideProps) => <Moon {...p} />;
export const IcPin = (p: LucideProps) => <Pin {...p} />;
export const IcSearch = (p: LucideProps) => <Search {...p} />;
export const IcShirt = (p: LucideProps) => <Shirt {...p} />;
export const IcLeaf = (p: LucideProps) => <Leaf {...p} />;
export const IcGrid = (p: LucideProps) => <Grid3x3 {...p} />;
export const IcWeek = (p: LucideProps) => <ChartColumn {...p} />;
export const IcDownload = (p: LucideProps) => <Download {...p} />;
export const IcRefresh = (p: LucideProps) => <RefreshCw {...p} />;

/** 时间轴「今」:日历框内「今」字 */
export const IcToday = ({ size = 22, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 2.5v3M16 2.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <text x="12" y="17.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor">今</text>
  </svg>
);

export const ICON_REGISTRY: Record<string, (p: LucideProps) => React.ReactElement> = {
  IcTodo, IcLock, IcStats, IcTimeline, IcProfile,
  IcPlus, IcMore, IcClock, IcBack, IcChevronRight, IcPlay, IcPause, IcReset, IcStop,
  IcBrightness, IcMusic, IcTrash, IcCheck, IcClose,
  IcShare, IcSort, IcBell, IcMotto, IcMoon, IcPin, IcSearch, IcShirt, IcLeaf,
  IcGrid, IcWeek, IcDownload, IcRefresh,
};

export const IconRenderer: React.FC<{ name: string } & LucideProps> = ({ name, ...p }) => {
  const C = ICON_REGISTRY[name];
  return C ? C(p) : null;
};
