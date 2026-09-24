/**
 * 猫眼图标资源 —— 全部 Ic* 前缀别名(module-contract 规范)
 */
import {
  House, Clapperboard, Ticket, Gamepad2, CircleUserRound,
  Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X,
  MapPin, Star, Heart, Share2, Bell, Settings, ThumbsUp,
  Plus, Minus, CircleCheck, Clock, QrCode, Trash2, SquarePen,
  Ellipsis, Headset, Gift, Wallet, CreditCard, Coins, Film,
  ListFilter, ArrowUpDown, Phone, Navigation, CircleAlert, Users,
  BadgePercent, Popcorn, Music, Mic, Drama, Landmark, PartyPopper,
  Dumbbell, Monitor, Puzzle, Waves, Palette, Baby, Piano, Speech,
  Theater, MicVocal, FerrisWheel, Send, CalendarDays, Bookmark,
} from 'lucide-react';

export const IcLauncher = Clapperboard;

// TabBar 五格
export const IcTabHome = House;
export const IcTabMovie = Clapperboard;
export const IcTabShow = Ticket;
export const IcTabFun = Gamepad2;
export const IcTabMine = CircleUserRound;

// 通用
export const IcSearch = Search;
export const IcNavBack = ChevronLeft;
export const IcArrowRight = ChevronRight;
export const IcArrowDown = ChevronDown;
export const IcArrowUp = ChevronUp;
export const IcClose = X;
export const IcPin = MapPin;
export const IcStar = Star;
export const IcHeart = Heart;
export const IcShare = Share2;
export const IcBell = Bell;
export const IcSettings = Settings;
export const IcLike = ThumbsUp;
export const IcPlus = Plus;
export const IcMinus = Minus;
export const IcCheck = CircleCheck;
export const IcClock = Clock;
export const IcQr = QrCode;
export const IcTrash = Trash2;
export const IcEdit = SquarePen;
export const IcMore = Ellipsis;
export const IcService = Headset;
export const IcGift = Gift;
export const IcWallet = Wallet;
export const IcCard = CreditCard;
export const IcCoins = Coins;
export const IcFilm = Film;
export const IcFilter = ListFilter;
export const IcSort = ArrowUpDown;
export const IcPhone = Phone;
export const IcNavigate = Navigation;
export const IcAlert = CircleAlert;
export const IcUsers = Users;
export const IcCoupon = BadgePercent;
export const IcPopcorn = Popcorn;
export const IcSend = Send;
export const IcCalendar = CalendarDays;
export const IcBookmark = Bookmark;
export const IcTicket = Ticket;

// 演出/玩乐分类
export const IcMusic = Music;
export const IcMic = Mic;
export const IcDrama = Drama;
export const IcLandmark = Landmark;
export const IcParty = PartyPopper;
export const IcGym = Dumbbell;
export const IcMonitor = Monitor;
export const IcPuzzle = Puzzle;
export const IcWaves = Waves;
export const IcPalette = Palette;
export const IcBaby = Baby;
export const IcPiano = Piano;
export const IcSpeech = Speech;
export const IcTheater = Theater;
export const IcMicVocal = MicVocal;
export const IcFerrisWheel = FerrisWheel;
export const IcGamepad = Gamepad2;

export const ICON_REGISTRY = {
  IcMusic, IcMic, IcDrama, IcLandmark, IcParty, IcGym, IcMonitor,
  IcPuzzle, IcWaves, IcPalette, IcBaby, IcPiano, IcSpeech, IcTheater,
  IcMicVocal, IcFerrisWheel, IcGamepad, IcTicket, IcFilm, IcPopcorn,
} as const;

export type IconName = keyof typeof ICON_REGISTRY;

export function IconRenderer({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Cmp = ICON_REGISTRY[name as IconName];
  if (!Cmp) return null;
  return <Cmp size={size} className={className} />;
}
