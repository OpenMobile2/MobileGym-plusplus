import React from 'react';
import {
  Check, LayoutGrid, BarChart3, User, Plus, MoreHorizontal, MoreVertical,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, Pencil, EyeOff, Eye,
  Clock, Timer, MessageSquare, AlignLeft, CreditCard, PlusSquare, Sun, Heart,
  Headphones, Settings, Music, ListChecks, Trash2, X, HelpCircle, Sparkles,
  Sunrise, Droplet, BookOpen, Book, Footprints, Wind, Moon, PenLine, Bell,
  Archive, RotateCcw, Upload, Flag, Calendar, Crown, Send, CircleDot, Dumbbell,
  Brain, Cat, Dog, Coffee, Utensils, Bike, Music2, Smile, Leaf, Star,
  type LucideProps,
} from 'lucide-react';
import { AsyncFsImage } from '@/os/components/AsyncFsImage';

// tabbar
export const IcCheck = (p: LucideProps) => <Check {...p} />;
export const IcGrid = (p: LucideProps) => <LayoutGrid {...p} />;
export const IcTomato = (p: LucideProps) => <Timer {...p} />;
export const IcBars = (p: LucideProps) => <BarChart3 {...p} />;
export const IcUser = (p: LucideProps) => <User {...p} />;
// 通用 chrome
export const IcPlus = (p: LucideProps) => <Plus {...p} />;
export const IcMoreH = (p: LucideProps) => <MoreHorizontal {...p} />;
export const IcMoreV = (p: LucideProps) => <MoreVertical {...p} />;
export const IcBack = (p: LucideProps) => <ChevronLeft {...p} />;
export const IcRight = (p: LucideProps) => <ChevronRight {...p} />;
export const IcDown = (p: LucideProps) => <ChevronDown {...p} />;
export const IcUp = (p: LucideProps) => <ChevronUp {...p} />;
export const IcSearch = (p: LucideProps) => <Search {...p} />;
export const IcPen = (p: LucideProps) => <Pencil {...p} />;
export const IcPenLine = (p: LucideProps) => <PenLine {...p} />;
export const IcEyeOff = (p: LucideProps) => <EyeOff {...p} />;
export const IcEye = (p: LucideProps) => <Eye {...p} />;
export const IcClock = (p: LucideProps) => <Clock {...p} />;
export const IcMessage = (p: LucideProps) => <MessageSquare {...p} />;
export const IcTimeline = (p: LucideProps) => <AlignLeft {...p} />;
export const IcCard = (p: LucideProps) => <CreditCard {...p} />;
export const IcPlusSquare = (p: LucideProps) => <PlusSquare {...p} />;
export const IcSun = (p: LucideProps) => <Sun {...p} />;
export const IcHeart = (p: LucideProps) => <Heart {...p} />;
export const IcHeadphones = (p: LucideProps) => <Headphones {...p} />;
export const IcSettings = (p: LucideProps) => <Settings {...p} />;
export const IcMusic = (p: LucideProps) => <Music {...p} />;
export const IcList = (p: LucideProps) => <ListChecks {...p} />;
export const IcTrash = (p: LucideProps) => <Trash2 {...p} />;
export const IcClose = (p: LucideProps) => <X {...p} />;
export const IcHelp = (p: LucideProps) => <HelpCircle {...p} />;
export const IcSparkles = (p: LucideProps) => <Sparkles {...p} />;
export const IcBell = (p: LucideProps) => <Bell {...p} />;
export const IcArchive = (p: LucideProps) => <Archive {...p} />;
export const IcReset = (p: LucideProps) => <RotateCcw {...p} />;
export const IcExport = (p: LucideProps) => <Upload {...p} />;
export const IcFlag = (p: LucideProps) => <Flag {...p} />;
export const IcCalendar = (p: LucideProps) => <Calendar {...p} />;
export const IcCrown = (p: LucideProps) => <Crown {...p} />;
export const IcSend = (p: LucideProps) => <Send {...p} />;
export const IcDot = (p: LucideProps) => <CircleDot {...p} />;
// 习惯图标库(数据驱动,defaults.json 用 Ic* 名引用)
export const IcSunrise = (p: LucideProps) => <Sunrise {...p} />;
export const IcDroplet = (p: LucideProps) => <Droplet {...p} />;
export const IcBookOpen = (p: LucideProps) => <BookOpen {...p} />;
export const IcBook = (p: LucideProps) => <Book {...p} />;
export const IcRun = (p: LucideProps) => <Footprints {...p} />;
export const IcWind = (p: LucideProps) => <Wind {...p} />;
export const IcMoon = (p: LucideProps) => <Moon {...p} />;
export const IcDumbbell = (p: LucideProps) => <Dumbbell {...p} />;
export const IcBrain = (p: LucideProps) => <Brain {...p} />;
export const IcCat = (p: LucideProps) => <Cat {...p} />;
export const IcDog = (p: LucideProps) => <Dog {...p} />;
export const IcCoffee = (p: LucideProps) => <Coffee {...p} />;
export const IcMeal = (p: LucideProps) => <Utensils {...p} />;
export const IcBike = (p: LucideProps) => <Bike {...p} />;
export const IcMusicNote = (p: LucideProps) => <Music2 {...p} />;
export const IcSmile = (p: LucideProps) => <Smile {...p} />;
export const IcLeaf = (p: LucideProps) => <Leaf {...p} />;
export const IcStar = (p: LucideProps) => <Star {...p} />;

export const ICON_REGISTRY: Record<string, (p: LucideProps) => React.JSX.Element> = {
  IcCheck, IcGrid, IcTomato, IcBars, IcUser, IcPlus, IcMoreH, IcMoreV, IcBack,
  IcRight, IcDown, IcUp, IcSearch, IcPen, IcPenLine, IcEyeOff, IcEye, IcClock,
  IcMessage, IcTimeline, IcCard, IcPlusSquare, IcSun, IcHeart, IcHeadphones,
  IcSettings, IcMusic, IcList, IcTrash, IcClose, IcHelp, IcSparkles, IcBell,
  IcArchive, IcReset, IcExport, IcFlag, IcCalendar, IcCrown, IcSend, IcDot,
  IcSunrise, IcDroplet, IcBookOpen, IcBook, IcRun, IcWind, IcMoon, IcDumbbell,
  IcBrain, IcCat, IcDog, IcCoffee, IcMeal, IcBike, IcMusicNote, IcSmile, IcLeaf, IcStar,
};

export function IconRenderer({ name, ...p }: { name: string } & LucideProps) {
  if (name.startsWith('/')) {
    const size = p.size ?? 24;
    return (
      <span className={`inline-flex shrink-0 overflow-hidden rounded ${p.className ?? ''}`}
        style={{ width: size, height: size }}>
        <AsyncFsImage path={name} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  if (/^(blob:|data:|content:|https?:)/.test(name)) {
    const size = p.size ?? 24;
    return <img src={name} alt="" className={`shrink-0 rounded object-cover ${p.className ?? ''}`}
      style={{ width: size, height: size }} />;
  }
  const C = ICON_REGISTRY[name] ?? IcCheck;
  return <C {...p} />;
}
