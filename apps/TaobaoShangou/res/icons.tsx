import {
  ArrowLeft, Bell, Calendar, Camera, ChevronDown, ChevronRight, ChevronUp, CircleAlert,
  Clock, Copy, CreditCard, Ellipsis, Headset, Heart, Home, House, ListOrdered, MapPin,
  MessageCircle, Mic, Minus, Pencil, Phone, Plus, Search, Send, Settings, Share2,
  ShieldCheck, ShoppingBag, ShoppingCart, Smile, Star, Store, Ticket, Trash2, User, Wallet, X,
} from 'lucide-react';

/** launcher 图标:橙底白字「淘宝闪购」+ 底部蓝带「e·饿了么」(参考真机 IMG_6098) */
const LAUNCHER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="tbsgRound"><rect width="100" height="100" rx="23"/></clipPath>
    <linearGradient id="tbsgOrange" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF934A"/><stop offset="1" stop-color="#ED6C2C"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#tbsgRound)">
    <rect width="100" height="100" fill="url(#tbsgOrange)"/>
    <path d="M0 74 Q25 67 50 73 T100 73 L100 100 L0 100 Z" fill="#2CA9E8"/>
    <path d="M0 74 Q25 67 50 73 T100 73" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.85"/>
    <text x="50" y="37" text-anchor="middle" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-weight="800" font-size="27" fill="#FFFFFF">淘宝</text>
    <text x="50" y="65" text-anchor="middle" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-weight="800" font-size="27" fill="#FFFFFF">闪购</text>
    <circle cx="30" cy="87.5" r="6.2" fill="#FFFFFF"/>
    <text x="30" y="91" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-style="italic" font-size="9" fill="#2CA9E8">e</text>
    <text x="40" y="91.5" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-weight="700" font-size="12.5" fill="#FFFFFF">饿了么</text>
  </g>
</svg>`;
export const IcLauncher = `data:image/svg+xml,${encodeURIComponent(LAUNCHER_SVG)}`;

export const IcBack = ArrowLeft;
export const IcBell = Bell;
export const IcCalendar = Calendar;
export const IcCamera = Camera;
export const IcDown = ChevronDown;
export const IcRight = ChevronRight;
export const IcUp = ChevronUp;
export const IcAlert = CircleAlert;
export const IcClock = Clock;
export const IcCopy = Copy;
export const IcCard = CreditCard;
export const IcMore = Ellipsis;
export const IcService = Headset;
export const IcHeart = Heart;
export const IcHome = Home;
export const IcHouse = House;
export const IcOrders = ListOrdered;
export const IcPin = MapPin;
export const IcChat = MessageCircle;
export const IcMic = Mic;
export const IcMinus = Minus;
export const IcEdit = Pencil;
export const IcPhone = Phone;
export const IcPlus = Plus;
export const IcSearch = Search;
export const IcSend = Send;
export const IcSettings = Settings;
export const IcShare = Share2;
export const IcShield = ShieldCheck;
export const IcBag = ShoppingBag;
export const IcCart = ShoppingCart;
export const IcSmile = Smile;
export const IcStar = Star;
export const IcShop = Store;
export const IcTicket = Ticket;
export const IcTrash = Trash2;
export const IcUser = User;
export const IcWallet = Wallet;
export const IcClose = X;
