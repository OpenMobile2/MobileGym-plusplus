/**
 * Ctrip 图标:launcher + TabBar + 金刚区。全部 Ic 前缀(模块合同)。
 * 业务图标统一用 lucide,launcher 用 inline SVG(海豚蓝)。
 */
import React from 'react';
import {
  Home, MessageSquare, CalendarDays, User,
  Hotel, Plane, TrainFront, MapPinned, Camera, Car, Ship, Ticket,
  Bus, Tent, Compass, ChevronLeft, Search, Settings, Headphones,
  Heart, Share2, MoreHorizontal, MapPin, X, Plus, Minus, Check,
} from 'lucide-react';

export type IconProps = { size?: number; className?: string };

// Launcher:携程海豚蓝圆角方块 + 简化海豚/出行符号
export const IcLauncher = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#0086F6"/><path d="M26 60c10 6 22 6 33-2 8-6 13-14 15-24-2 13-9 24-20 31-9 6-19 7-28 4z" fill="#fff"/><circle cx="63" cy="34" r="5" fill="#fff"/></svg>`,
)}`;

export const IcTabHome = (p: IconProps) => <Home size={p.size} className={p.className} />;
export const IcTabMessage = (p: IconProps) => <MessageSquare size={p.size} className={p.className} />;
export const IcTabTrip = (p: IconProps) => <CalendarDays size={p.size} className={p.className} />;
export const IcTabMine = (p: IconProps) => <User size={p.size} className={p.className} />;

export const IcHotel = (p: IconProps) => <Hotel size={p.size} className={p.className} />;
export const IcFlight = (p: IconProps) => <Plane size={p.size} className={p.className} />;
export const IcTrain = (p: IconProps) => <TrainFront size={p.size} className={p.className} />;
export const IcGuide = (p: IconProps) => <MapPinned size={p.size} className={p.className} />;
export const IcTour = (p: IconProps) => <Compass size={p.size} className={p.className} />;
export const IcHomestay = (p: IconProps) => <Tent size={p.size} className={p.className} />;
export const IcTicket = (p: IconProps) => <Ticket size={p.size} className={p.className} />;
export const IcPickup = (p: IconProps) => <Camera size={p.size} className={p.className} />;
export const IcCar = (p: IconProps) => <Car size={p.size} className={p.className} />;
export const IcGroup = (p: IconProps) => <Bus size={p.size} className={p.className} />;
export const IcShip = (p: IconProps) => <Ship size={p.size} className={p.className} />;

export const IcBack = (p: IconProps) => <ChevronLeft size={p.size} className={p.className} />;
export const IcSearch = (p: IconProps) => <Search size={p.size} className={p.className} />;
export const IcSettings = (p: IconProps) => <Settings size={p.size} className={p.className} />;
export const IcService = (p: IconProps) => <Headphones size={p.size} className={p.className} />;
export const IcHeart = (p: IconProps) => <Heart size={p.size} className={p.className} />;
export const IcShare = (p: IconProps) => <Share2 size={p.size} className={p.className} />;
export const IcMore = (p: IconProps) => <MoreHorizontal size={p.size} className={p.className} />;
export const IcMapPin = (p: IconProps) => <MapPin size={p.size} className={p.className} />;
export const IcClose = (p: IconProps) => <X size={p.size} className={p.className} />;
export const IcPlus = (p: IconProps) => <Plus size={p.size} className={p.className} />;
export const IcMinus = (p: IconProps) => <Minus size={p.size} className={p.className} />;
export const IcCheck = (p: IconProps) => <Check size={p.size} className={p.className} />;

/** 名字 -> 组件(金刚区 constants 用字符串引用,module-contract res 规则)。 */
export const ICON_REGISTRY: Record<string, (p: IconProps) => React.ReactElement> = {
  IcHotel, IcFlight, IcTrain, IcGuide, IcTour, IcHomestay, IcTicket, IcPickup, IcCar, IcGroup, IcShip,
  IcTabHome, IcTabMessage, IcTabTrip, IcTabMine,
  IcBack, IcSearch, IcSettings, IcService, IcHeart, IcShare, IcMore, IcMapPin, IcClose, IcPlus, IcMinus, IcCheck,
};

export function IconRenderer({ name, size, className }: { name: string; size?: number; className?: string }) {
  const C = ICON_REGISTRY[name];
  return C ? <C size={size} className={className} /> : null;
}
