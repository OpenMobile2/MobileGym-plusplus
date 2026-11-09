/**
 * Keep 图标资源 —— 全部 Ic* 前缀别名(module-contract 规范)
 */
import React from 'react';
import {
  Dumbbell, CalendarDays, Footprints, Compass, User, Search, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, X, Check, Bell, Settings, Share2, MoreHorizontal, Play, Pause,
  Music, Heart, Star, MessageCircle, Plus, Minus, MapPin, Route as RouteIc, Flame,
  Timer, Lock, Unlock, Watch, ScanLine, Menu, ShoppingCart, Headphones, Wallet,
  Ticket, Gift, Medal, Trophy, Camera, ThumbsUp, Crown, Zap, CircleHelp, Home,
  Calendar, Ruler, TrendingUp, Volume2, SkipForward, SkipBack, RotateCcw, Send,
  Moon, Utensils, Scale, Bike, PersonStanding, RefreshCw, Coins, Activity, Circle,
} from 'lucide-react';

export const IcLauncher = Dumbbell;

// 底部 TabBar
export const IcTabCourse = Dumbbell;
export const IcTabSchedule = CalendarDays;
export const IcTabSport = Footprints;
export const IcTabDiscover = Compass;
export const IcTabMe = User;

// 通用
export const IcSearch = Search;
export const IcNavBack = ChevronLeft;
export const IcArrowRight = ChevronRight;
export const IcArrowDown = ChevronDown;
export const IcArrowUp = ChevronUp;
export const IcClose = X;
export const IcCheck = Check;
export const IcBell = Bell;
export const IcSettings = Settings;
export const IcShare = Share2;
export const IcMore = MoreHorizontal;
export const IcPlus = Plus;
export const IcMinus = Minus;
export const IcHome = Home;
export const IcHelp = CircleHelp;
export const IcMenu = Menu;
export const IcSend = Send;

// 训练/跑步
export const IcPlay = Play;
export const IcPause = Pause;
export const IcMusic = Music;
export const IcFlame = Flame;
export const IcTimer = Timer;
export const IcLock = Lock;
export const IcUnlock = Unlock;
export const IcSkipNext = SkipForward;
export const IcSkipPrev = SkipBack;
export const IcRestart = RotateCcw;
export const IcMapPin = MapPin;
export const IcRoute = RouteIc;
export const IcRuler = Ruler;
export const IcTrend = TrendingUp;
export const IcVolume = Volume2;
export const IcWatch = Watch;
export const IcScan = ScanLine;
export const IcCalendar = Calendar;

// 社区/会员/商城
export const IcHeart = Heart;
export const IcStar = Star;
export const IcComment = MessageCircle;
export const IcThumbsUp = ThumbsUp;
export const IcCrown = Crown;
export const IcZap = Zap;
export const IcCart = ShoppingCart;
export const IcHeadphones = Headphones;
export const IcWallet = Wallet;
export const IcTicket = Ticket;
export const IcGift = Gift;
export const IcMedal = Medal;
export const IcTrophy = Trophy;
export const IcCamera = Camera;
export const IcMoon = Moon;
export const IcUtensils = Utensils;
export const IcScale = Scale;
export const IcBike = Bike;
export const IcPerson = PersonStanding;
export const IcRefresh = RefreshCw;
export const IcCoins = Coins;
export const IcActivity = Activity;
export const IcCircle = Circle;
export const IcFootprints = Footprints;
export const IcDumbbell = Dumbbell;

export const ICON_REGISTRY = {
  IcLauncher, IcTabCourse, IcTabSchedule, IcTabSport, IcTabDiscover, IcTabMe,
  IcSearch, IcNavBack, IcArrowRight, IcArrowDown, IcArrowUp, IcClose, IcCheck,
  IcBell, IcSettings, IcShare, IcMore, IcPlus, IcMinus, IcHome, IcHelp, IcMenu, IcSend,
  IcPlay, IcPause, IcMusic, IcFlame, IcTimer, IcLock, IcUnlock, IcSkipNext, IcSkipPrev,
  IcRestart, IcMapPin, IcRoute, IcRuler, IcTrend, IcVolume, IcWatch, IcScan, IcCalendar,
  IcHeart, IcStar, IcComment, IcThumbsUp, IcCrown, IcZap, IcCart, IcHeadphones,
  IcWallet, IcTicket, IcGift, IcMedal, IcTrophy, IcCamera,
  IcMoon, IcUtensils, IcScale, IcBike, IcPerson, IcRefresh, IcCoins, IcActivity,
  IcCircle, IcFootprints, IcDumbbell,
} as const;

export type IconName = keyof typeof ICON_REGISTRY;

export function IconRenderer({ name, size = 22, className = '' }: { name: string; size?: number; className?: string }) {
  const Cmp = (ICON_REGISTRY as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  if (!Cmp) return null;
  return <Cmp size={size} className={className} />;
}
