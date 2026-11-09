/**
 * 卡皮记账 图标资源 —— 全部 Ic* 前缀别名(module-contract 规范)。
 * 彩色分类图标用 lucide 线性图标 + 品牌色圆底渲染(CategoryIcon 组件)。
 */
import React from 'react';
import {
  PiggyBank, Menu, Search, Eye, EyeOff, Plus, Minus, X, Check, Delete,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AudioLines, Camera,
  Image as ImageIcon, Trash2, Settings, CalendarDays, Wallet, Bell, RotateCcw,
  ThumbsUp, ThumbsDown, Copy, Lightbulb, Wand2, ArrowUp, ArrowRightLeft,
  SquarePen, Share2, ArrowDownUp, CirclePlus, Notebook, CreditCard, Banknote,
  Bus, Lock, HandCoins, ChartPie, TrendingUp, MessageCircle,
  // 分类
  Utensils, ShoppingBag, Car, House, Sandwich, Flame, Soup, CupSoda, Coffee,
  GlassWater, IceCreamCone, Grape, Cookie, ChefHat, Gamepad2, Stethoscope,
  GraduationCap, PawPrint, Baby, ShieldCheck, Ellipsis, Briefcase, Store,
  Clock, Gift, Trophy, Sparkles,
} from 'lucide-react';

export const IcLauncher = PiggyBank;

// 通用
export const IcMenu = Menu;
export const IcSearch = Search;
export const IcEye = Eye;
export const IcEyeOff = EyeOff;
export const IcPlus = Plus;
export const IcMinus = Minus;
export const IcClose = X;
export const IcCheck = Check;
export const IcBackspace = Delete;
export const IcNavBack = ChevronLeft;
export const IcArrowRight = ChevronRight;
export const IcArrowDown = ChevronDown;
export const IcArrowUp = ChevronUp;
export const IcVoice = AudioLines;
export const IcCamera = Camera;
export const IcImage = ImageIcon;
export const IcDelete = Trash2;
export const IcSettings = Settings;
export const IcCalendar = CalendarDays;
export const IcWallet = Wallet;
export const IcBell = Bell;
export const IcRefresh = RotateCcw;
export const IcLike = ThumbsUp;
export const IcDislike = ThumbsDown;
export const IcCopy = Copy;
export const IcBulb = Lightbulb;
export const IcWand = Wand2;
export const IcSend = ArrowUp;
export const IcSwap = ArrowRightLeft;
export const IcEdit = SquarePen;
export const IcShare = Share2;
export const IcSort = ArrowDownUp;
export const IcCirclePlus = CirclePlus;
export const IcLedger = Notebook;
export const IcCard = CreditCard;
export const IcCash = Banknote;
export const IcBus = Bus;
export const IcLock = Lock;
export const IcHandCoins = HandCoins;
export const IcChart = ChartPie;
export const IcTrend = TrendingUp;
export const IcWechat = MessageCircle;
export const IcAlipay = Wallet;
export const IcFood = Utensils;

// 分类图标注册表(数据驱动:categories[].icon 存 Ic* 名)
export const ICON_REGISTRY = {
  IcCatFood: Utensils,
  IcCatShopping: ShoppingBag,
  IcCatTransport: Car,
  IcCatHousing: House,
  IcCatFastFood: Sandwich,
  IcCatBBQ: Flame,
  IcCatHotpot: Soup,
  IcCatMilkTea: CupSoda,
  IcCatCoffee: Coffee,
  IcCatDrink: GlassWater,
  IcCatDessert: IceCreamCone,
  IcCatFruit: Grape,
  IcCatSnack: Cookie,
  IcCatGrocery: ChefHat,
  IcCatLeisure: Gamepad2,
  IcCatMedical: Stethoscope,
  IcCatStudy: GraduationCap,
  IcCatPet: PawPrint,
  IcCatBaby: Baby,
  IcCatTransfer: ArrowRightLeft,
  IcCatInsurance: ShieldCheck,
  IcCatOther: Ellipsis,
  // 收入
  IcCatSalary: Briefcase,
  IcCatBusiness: Store,
  IcCatInvest: TrendingUp,
  IcCatPartTime: Clock,
  IcCatGift: Gift,
  IcCatPrize: Trophy,
  IcCatWindfall: Sparkles,
  IcCatOtherIncome: Ellipsis,
} as const;

export type CategoryIconName = keyof typeof ICON_REGISTRY;

/** 数据驱动渲染分类图标 */
export function CategoryGlyph({
  name,
  size = 22,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Cmp = (ICON_REGISTRY as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name]
    ?? Ellipsis;
  return <Cmp size={size} className={className} />;
}
