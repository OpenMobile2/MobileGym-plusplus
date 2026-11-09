import {
  Home, Play, BadgePercent, MessageCircle, User, ArrowLeft, Search, Camera,
  Heart, Share2, Headphones, Store, ChevronRight, ChevronLeft, MapPin, Ticket,
  Wallet, Settings, Plus, Minus, X, Star, Truck, Clock, CheckCircle2, ShoppingBag,
  Grid3x3, Filter, ScanLine, Bell, FileText, Users, RefreshCw, ChevronDown, Trash2,
  Moon, Type, Globe, CreditCard, Package, Copy, Phone, Gift,
} from 'lucide-react';

// —— TabBar / 导航 ——
export const IcTabHome = Home;
export const IcTabVideo = Play;
export const IcTabSubsidy = BadgePercent;
export const IcTabChat = MessageCircle;
export const IcTabMine = User;
export const IcNavBack = ArrowLeft;
export const IcNavBackWhite = ChevronLeft;

// —— 通用 ——
export const IcSearch = Search;
export const IcCamera = Camera;
export const IcScan = ScanLine;
export const IcHeart = Heart;
export const IcShare = Share2;
export const IcHeadphones = Headphones;
export const IcStore = Store;
export const IcChevronRight = ChevronRight;
export const IcChevronDown = ChevronDown;
export const IcMapPin = MapPin;
export const IcTicket = Ticket;
export const IcWallet = Wallet;
export const IcSettings = Settings;
export const IcPlus = Plus;
export const IcMinus = Minus;
export const IcClose = X;
export const IcStar = Star;
export const IcTruck = Truck;
export const IcClock = Clock;
export const IcCheck = CheckCircle2;
export const IcGrid = Grid3x3;
export const IcFilter = Filter;
export const IcBell = Bell;
export const IcInvoice = FileText;
export const IcUsers = Users;
export const IcRefresh = RefreshCw;
export const IcTrash = Trash2;
export const IcMoon = Moon;
export const IcType = Type;
export const IcGlobe = Globe;
export const IcCard = CreditCard;
export const IcPackage = Package;
export const IcCopy = Copy;
export const IcPhone = Phone;
export const IcGift = Gift;
export const IcLauncher = ShoppingBag; // manifest launcher icon

export const ICON_REGISTRY: Record<string, typeof Home> = {
  IcTabHome, IcTabVideo, IcTabSubsidy, IcTabChat, IcTabMine, IcNavBack, IcNavBackWhite,
  IcSearch, IcCamera, IcScan, IcHeart, IcShare, IcHeadphones, IcStore, IcChevronRight,
  IcChevronDown, IcMapPin, IcTicket, IcWallet, IcSettings, IcPlus, IcMinus, IcClose,
  IcStar, IcTruck, IcClock, IcCheck, IcGrid, IcFilter, IcBell, IcInvoice, IcUsers,
  IcRefresh, IcTrash, IcMoon, IcType, IcGlobe, IcCard, IcPackage, IcCopy, IcPhone,
  IcGift, IcLauncher,
};
