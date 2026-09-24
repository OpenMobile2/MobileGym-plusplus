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
  Play,
  Pause,
  RotateCcw,
  Square,
  Sun,
  Music,
  Trash2,
  Check,
  X,
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
export const IcPlay = (p: LucideProps) => <Play {...p} />;
export const IcPause = (p: LucideProps) => <Pause {...p} />;
export const IcReset = (p: LucideProps) => <RotateCcw {...p} />;
export const IcStop = (p: LucideProps) => <Square {...p} />;
export const IcBrightness = (p: LucideProps) => <Sun {...p} />;
export const IcMusic = (p: LucideProps) => <Music {...p} />;
export const IcTrash = (p: LucideProps) => <Trash2 {...p} />;
export const IcCheck = (p: LucideProps) => <Check {...p} />;
export const IcClose = (p: LucideProps) => <X {...p} />;

export const ICON_REGISTRY: Record<string, (p: LucideProps) => React.ReactElement> = {
  IcTodo, IcLock, IcStats, IcTimeline, IcProfile,
  IcPlus, IcMore, IcClock, IcBack, IcPlay, IcPause, IcReset, IcStop,
  IcBrightness, IcMusic, IcTrash, IcCheck, IcClose,
};

export const IconRenderer: React.FC<{ name: string } & LucideProps> = ({ name, ...p }) => {
  const C = ICON_REGISTRY[name];
  return C ? C(p) : null;
};
