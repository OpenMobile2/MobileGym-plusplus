/**
 * 腾讯视频 图标资源 —— 全部 Ic* 前缀别名(module-contract 规范)。
 * IcLauncher = 手绘三色描边播放三角(蓝/绿/橙红,照真机 logo 风格,无文字)。
 */
import React from 'react';
import {
  Home, Clapperboard, Crown, Film, User, Search, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, X, Check, Settings, Share2, MoreHorizontal, MoreVertical,
  Play, Pause, Download, Heart, Star, MessageCircle, Plus, Menu, ScanLine,
  Bell, History, CalendarCheck, Coins, Tv, Cast, Lock, Filter, ThumbsUp, Send,
  Users, Maximize, Minimize, MessageSquareDashed, PictureInPicture2, Flame,
  Mic, Camera, SkipForward, Captions, Gauge, ListVideo, Volume2, VolumeX,
  Gift, Sparkles, Unlock, Moon, Disc3, Ban, Headphones, Repeat, TriangleAlert,
  SquarePen, Palette, Shirt, CircleUser, PanelTop, Egg, Image as ImageIcon, Wand2,
  Gamepad2,
} from 'lucide-react';

/** 启动器图标:三色描边播放三角(蓝 #1E6FFF / 绿 #06BFB8 / 橙红 #FF6510),白底由 manifest.iconBackground 提供。 */
export const IcLauncher = ({ size = 24, className }: { size?: number | string; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* 左侧竖边:蓝 */}
    <path d="M16 13.5 C 14.6 20.5, 14.6 27.5, 16 34.5" stroke="#1E6FFF" strokeWidth="6.5" strokeLinecap="round" />
    {/* 右上斜边:绿 */}
    <path d="M17.5 11.8 C 24.5 14.2, 31 17.8, 36.5 22.4" stroke="#06BFB8" strokeWidth="6.5" strokeLinecap="round" />
    {/* 右下斜边:橙红 */}
    <path d="M36.5 25.6 C 31 30.2, 24.5 33.8, 17.5 36.2" stroke="#FF6510" strokeWidth="6.5" strokeLinecap="round" />
  </svg>
);

// 底部 TabBar
export const IcTabHome = Home;
export const IcTabShortdrama = Clapperboard;
export const IcTabVipzone = Crown;
export const IcTabHaopian = Film;
export const IcTabMe = User;

// 通用
export const IcSearch = Search;
export const IcNavBack = ChevronLeft;
export const IcArrowRight = ChevronRight;
export const IcArrowDown = ChevronDown;
export const IcArrowUp = ChevronUp;
export const IcClose = X;
export const IcCheck = Check;
export const IcSettings = Settings;
export const IcShare = Share2;
export const IcMore = MoreHorizontal;
export const IcMoreVertical = MoreVertical;
export const IcPlus = Plus;
export const IcMenu = Menu;
export const IcScan = ScanLine;
export const IcBell = Bell;
export const IcFilter = Filter;
export const IcSend = Send;
/** 首页搜索条右侧游戏中心入口(证据 832;禁 emoji) */
export const IcGamepad = Gamepad2;

// 播放/内容
export const IcPlay = Play;
export const IcPause = Pause;
export const IcDownload = Download;
export const IcHeart = Heart;
export const IcStar = Star;
export const IcComment = MessageCircle;
export const IcThumbsUp = ThumbsUp;
export const IcHistory = History;
export const IcFollow = CalendarCheck;
export const IcCoin = Coins;
export const IcTv = Tv;
export const IcCast = Cast;
export const IcLock = Lock;
export const IcUnlock = Unlock;
export const IcCrown = Crown;

// 播放器控件(详情/竖屏/全屏)
export const IcTogether = Users;
export const IcFullscreen = Maximize;
export const IcExitFullscreen = Minimize;
export const IcDanmaku = MessageSquareDashed;
export const IcPip = PictureInPicture2;
export const IcHeat = Flame;
export const IcMic = Mic;
export const IcCamera = Camera;
export const IcNext = SkipForward;
export const IcSubtitle = Captions;
export const IcSpeed = Gauge;
export const IcEpisodes = ListVideo;
export const IcVolume = Volume2;
export const IcMute = VolumeX;
export const IcGift = Gift;
export const IcSparkle = Sparkles;

// 播放器弹层组(更多 10 项 / 弹幕开关组 / 滤镜)
export const IcTimer = Moon;
export const IcAudioMode = Disc3;
export const IcBan = Ban;
export const IcBackground = Headphones;
export const IcLoop = Repeat;
export const IcReport = TriangleAlert;
export const IcFeedback = SquarePen;
export const IcPalette = Palette;
export const IcShirt = Shirt;
export const IcRoleAvatar = CircleUser;
export const IcTopDanmaku = PanelTop;
export const IcEgg = Egg;
export const IcPoster = ImageIcon;
export const IcMagic = Wand2;

export const ICON_REGISTRY = {
  IcLauncher, IcTabHome, IcTabShortdrama, IcTabVipzone, IcTabHaopian, IcTabMe,
  IcSearch, IcNavBack, IcArrowRight, IcArrowDown, IcArrowUp, IcClose, IcCheck,
  IcSettings, IcShare, IcMore, IcMoreVertical, IcPlus, IcMenu, IcScan, IcBell,
  IcFilter, IcSend, IcGamepad, IcPlay, IcPause, IcDownload, IcHeart, IcStar, IcComment,
  IcThumbsUp, IcHistory, IcFollow, IcCoin, IcTv, IcCast, IcLock, IcUnlock, IcCrown,
  IcTogether, IcFullscreen, IcExitFullscreen, IcDanmaku, IcPip, IcHeat, IcMic,
  IcCamera, IcNext, IcSubtitle, IcSpeed, IcEpisodes, IcVolume, IcMute, IcGift,
  IcSparkle, IcTimer, IcAudioMode, IcBan, IcBackground, IcLoop, IcReport,
  IcFeedback, IcPalette, IcShirt, IcRoleAvatar, IcTopDanmaku, IcEgg, IcPoster, IcMagic,
} as const;

export type IconName = keyof typeof ICON_REGISTRY;

export function IconRenderer({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICON_REGISTRY[name as IconName];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}
