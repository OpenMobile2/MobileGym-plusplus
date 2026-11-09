// apps/Broadcast/res/icons.tsx — 苹果播客图标注册表(全部 Ic* 前缀)
import {
  Podcast, House, LayoutGrid, Search,
  Play, Pause, SkipForward, SkipBack, RotateCcw,
  Download, Bookmark, BookmarkCheck, Share, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronDown, Check, Plus, X,
  Star, Moon, Gauge, ListMusic, AirVent, Mic, Bell,
  CircleX, CirclePlus, Heart, Rss, Clock, Volume1, Volume2,
  Laptop, BriefcaseBusiness, ChartNoAxesCombined, BadgeCheck, Brain,
  TrendingUp, SearchCheck, MoonStar, Landmark, Globe2, Laugh, Coffee,
} from 'lucide-react';

// Launcher 图标(供 manifest 引用)
export const IcLauncher = Podcast;

// 底部 Tab
export const IcTabHome = House;
export const IcTabBrowse = LayoutGrid;
export const IcTabLibrary = Podcast;
export const IcTabSearch = Search;
export const IcSearch = Search;

// 播放器
export const IcPlay = Play;
export const IcPause = Pause;
export const IcSkipForward = SkipForward;
export const IcSkipBack = SkipBack;
export const IcReplay = RotateCcw;        // 快进/回退 30/15s 的圆弧箭头
export const IcSpeed = Gauge;
export const IcSleep = Moon;
export const IcAirplay = AirVent;
export const IcQueue = ListMusic;
export const IcVolumeLow = Volume1;
export const IcVolumeHigh = Volume2;

// 单集/节目操作
export const IcDownload = Download;
export const IcSave = Bookmark;
export const IcSaved = BookmarkCheck;
export const IcShare = Share;
export const IcMore = MoreHorizontal;
export const IcStar = Star;
export const IcFollow = Plus;
export const IcFollowed = Check;
export const IcHeart = Heart;
export const IcRss = Rss;
export const IcClock = Clock;
export const IcMic = Mic;
export const IcBell = Bell;
export const IcGenreTech = Laptop;
export const IcGenreBusiness = BriefcaseBusiness;
export const IcGenreManagement = ChartNoAxesCombined;
export const IcGenreCareer = BadgeCheck;
export const IcGenrePhilosophy = Brain;
export const IcGenreInvest = TrendingUp;
export const IcGenreMystery = SearchCheck;
export const IcGenreSleep = MoonStar;
export const IcGenreHistory = Landmark;
export const IcGenreSociety = Globe2;
export const IcGenreComedy = Laugh;
export const IcGenreLeisure = Coffee;

// 通用导航
export const IcBack = ChevronLeft;
export const IcChevronRight = ChevronRight;
export const IcChevronDown = ChevronDown;
export const IcCheck = Check;
export const IcClose = X;
export const IcCloseCircle = CircleX;
export const IcPlusCircle = CirclePlus;

export const ICON_REGISTRY = {
  IcLauncher, IcTabHome, IcTabBrowse, IcTabLibrary, IcTabSearch, IcSearch,
  IcPlay, IcPause, IcSkipForward, IcSkipBack, IcReplay, IcSpeed, IcSleep, IcAirplay, IcQueue, IcVolumeLow, IcVolumeHigh,
  IcDownload, IcSave, IcSaved, IcShare, IcMore, IcStar, IcFollow, IcFollowed, IcHeart, IcRss, IcClock, IcMic, IcBell,
  IcGenreTech, IcGenreBusiness, IcGenreManagement, IcGenreCareer, IcGenrePhilosophy, IcGenreInvest,
  IcGenreMystery, IcGenreSleep, IcGenreHistory, IcGenreSociety, IcGenreComedy, IcGenreLeisure,
  IcBack, IcChevronRight, IcChevronDown, IcCheck, IcClose, IcCloseCircle, IcPlusCircle,
};
