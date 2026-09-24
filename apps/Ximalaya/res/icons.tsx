import {
  Home, Radio, Crown, User, ChevronLeft, ChevronRight, ChevronDown, Search, X,
  Play, Pause, SkipBack, SkipForward, Rewind, FastForward, ListMusic, Timer,
  Download, Gauge, ThumbsUp, ThumbsDown, Heart, MoreHorizontal, Share2, MessageCircle,
  Plus, Menu, Settings, Bell, Clock, Trash2, Star, Ticket, Headphones, ScanLine,
  Mic, Filter, ArrowUpDown, Check, CheckCheck, Gift, Palette,
  Car, Cast, Flag, FileWarning, MessageSquareWarning, Rss, Medal, Pencil,
  ChevronsRight, Volume2, Sparkles, ListPlus, Bookmark, CircleUser, Wifi,
} from 'lucide-react';

// —— TabBar ——
export const IcTabHome = Home;
export const IcTabQuick = Radio;
export const IcTabMember = Crown;
export const IcTabMine = User;

// —— 导航 ——
export const IcNavBack = ChevronLeft;
export const IcChevronRight = ChevronRight;
export const IcChevronDown = ChevronDown;
export const IcClose = X;
export const IcMenu = Menu;

// —— 通用 ——
export const IcSearch = Search;
export const IcMic = Mic;
export const IcScan = ScanLine;
export const IcPlus = Plus;
export const IcSettings = Settings;
export const IcBell = Bell;
export const IcClock = Clock;
export const IcTrash = Trash2;
export const IcStar = Star;          // 收藏
export const IcBookmark = Bookmark;
export const IcTicket = Ticket;      // 月票
export const IcGift = Gift;          // 领积分
export const IcFilter = Filter;
export const IcSort = ArrowUpDown;
export const IcCheck = Check;
export const IcCheckAll = CheckCheck;
export const IcRss = Rss;            // 广播
export const IcMedal = Medal;        // 勋章
export const IcPencil = Pencil;      // 编辑资料
export const IcWifi = Wifi;

// —— 播放器 ——
export const IcPlay = Play;
export const IcPause = Pause;
export const IcPrev = SkipBack;
export const IcNext = SkipForward;
export const IcBack15 = Rewind;
export const IcForward15 = FastForward;
export const IcList = ListMusic;
export const IcTimer = Timer;
export const IcDownload = Download;
export const IcSpeed = Gauge;
export const IcLike = ThumbsUp;
export const IcDislike = ThumbsDown;
export const IcHeart = Heart;
export const IcMore = MoreHorizontal;
export const IcShare = Share2;
export const IcComment = MessageCircle;
export const IcSkin = Palette;       // 播放器皮肤
export const IcQuality = Volume2;    // 音质音效
export const IcCar = Car;            // 驾驶模式
export const IcCast = Cast;          // 连接外设
export const IcFlag = Flag;          // 举报
export const IcCopyright = FileWarning;      // 版权申诉
export const IcFeedback = MessageSquareWarning; // 意见反馈
export const IcAddList = ListPlus;   // 添加到听单
export const IcSparkles = Sparkles;  // AI
export const IcHeadphones = Headphones;
export const IcNextForward = ChevronsRight;
export const IcUserCircle = CircleUser;

export const IcLauncher = Headphones; // manifest launcher 图标(红底白耳机)

export const ICON_REGISTRY: Record<string, typeof Home> = {
  IcTabHome, IcTabQuick, IcTabMember, IcTabMine, IcNavBack, IcChevronRight,
  IcChevronDown, IcClose, IcMenu, IcSearch, IcMic, IcScan, IcPlus, IcSettings,
  IcBell, IcClock, IcTrash, IcStar, IcBookmark, IcTicket, IcGift, IcFilter, IcSort,
  IcCheck, IcCheckAll, IcRss, IcMedal, IcPencil, IcWifi, IcPlay, IcPause, IcPrev,
  IcNext, IcBack15, IcForward15, IcList, IcTimer, IcDownload, IcSpeed, IcLike,
  IcDislike, IcHeart, IcMore, IcShare, IcComment, IcSkin, IcQuality, IcCar, IcCast,
  IcFlag, IcCopyright, IcFeedback, IcAddList, IcSparkles, IcHeadphones, IcNextForward,
  IcUserCircle, IcLauncher,
};

export function IconRenderer({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Ic = ICON_REGISTRY[name] ?? Home;
  return <Ic size={size} className={className} />;
}
