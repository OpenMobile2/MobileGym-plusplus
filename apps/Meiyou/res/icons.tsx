/**
 * 美柚图标(Lucide 别名,全部 Ic 前缀)+ launcher 图标。
 */
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, Plus, X, Check,
  Heart, MessageCircle, Star, Share2, MoreVertical, MoreHorizontal,
  Camera, Image as ImageIcon, Hash, Smile, BarChart3, Sparkles,
  Calendar, Droplet, Bell, Settings, Wallet, Package, User, Users,
  ScanLine, Gift, PenLine, Mic, Send, Bookmark, ThumbsUp, CircleHelp, AlignJustify,
  type LucideProps,
} from 'lucide-react';

export const IcNavBack = ChevronLeft;
export const IcArrowRight = ChevronRight;
export const IcArrowDown = ChevronDown;
export const IcArrowUp = ChevronUp;
export const IcSearch = Search;
export const IcPlus = Plus;
export const IcClose = X;
export const IcCheck = Check;
export const IcHeart = Heart;
export const IcComment = MessageCircle;
export const IcStar = Star;
export const IcShare = Share2;
export const IcMoreV = MoreVertical;
export const IcMoreH = MoreHorizontal;
export const IcCamera = Camera;
export const IcImage = ImageIcon;
export const IcTopic = Hash;
export const IcEmoji = Smile;
export const IcPoll = BarChart3;
export const IcAI = Sparkles;
export const IcCalendar = Calendar;
export const IcDrop = Droplet;
export const IcBell = Bell;
export const IcSettings = Settings;
export const IcWallet = Wallet;
export const IcOrder = Package;
export const IcUser = User;
export const IcUsers = Users;
export const IcScan = ScanLine;
export const IcGift = Gift;
export const IcPen = PenLine;
export const IcMic = Mic;
export const IcSend = Send;
export const IcBookmark = Bookmark;
export const IcLike = ThumbsUp;
export const IcHelp = CircleHelp;
export const IcAnalysis = BarChart3;
export const IcMenu2 = AlignJustify;

export const ICON_REGISTRY: Record<string, React.ComponentType<LucideProps>> = {
  IcNavBack, IcArrowRight, IcArrowDown, IcArrowUp, IcSearch, IcPlus, IcClose, IcCheck,
  IcHeart, IcComment, IcStar, IcShare, IcMoreV, IcMoreH, IcCamera, IcImage, IcTopic,
  IcEmoji, IcPoll, IcAI, IcCalendar, IcDrop, IcBell, IcSettings, IcWallet, IcOrder,
  IcUser, IcUsers, IcScan, IcGift, IcPen, IcMic, IcSend, IcBookmark, IcLike, IcHelp, IcAnalysis, IcMenu2,
};

/** launcher 图标:美柚粉圆角方块 + 白色花瓣(设计规范 A1) */
export const IcLauncher = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23FA4B85"/><g fill="%23ffffff"><ellipse cx="50" cy="32" rx="11" ry="15"/><ellipse cx="50" cy="68" rx="11" ry="15"/><ellipse cx="32" cy="50" rx="15" ry="11"/><ellipse cx="68" cy="50" rx="15" ry="11"/><circle cx="50" cy="50" r="9" fill="%23FFD9E6"/></g></svg>`;
