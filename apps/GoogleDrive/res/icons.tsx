// apps/GoogleDrive/res/icons.tsx — Google Drive 图标注册表(全部 Ic* 前缀)
import {
  HardDrive, House, Star, Users, Folder, FolderOpen, Search, Menu, Sparkles,
  MoreVertical, ArrowUp, ArrowDown, LayoutGrid, List, Plus, X, Check, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp, ScanLine, Link2, Pencil, FolderInput, Copy,
  Info, Trash2, Printer, Download, Forward, Move3d, Share2, UserCog, CircleCheck,
  Palette, FolderPlus, FileUp, Camera, ScanText, RotateCcw, CircleX, Clock,
  CloudUpload, CloudOff, ShieldAlert, Settings, CircleHelp, Bell, MessageSquare,
  ThumbsUp, ThumbsDown, Globe, Cloud, Sheet, Presentation, FileText, FileType,
  Image, File, Filter, Calendar, User, CircleUser, ArrowUpRight, Sparkle, ListTree,
} from 'lucide-react';

// Launcher 图标(供 manifest 引用)
export const IcLauncher = HardDrive;

// 底部四个主 Tab
export const IcTabHome = House;
export const IcTabStarred = Star;
export const IcTabShared = Users;
export const IcTabFiles = Folder;

// 顶栏
export const IcMenu = Menu;
export const IcSearch = Search;
export const IcGemini = Sparkles;
export const IcAvatar = CircleUser;

// 通用导航 / 控件
export const IcBack = ChevronLeft;
export const IcChevronRight = ChevronRight;
export const IcChevronDown = ChevronDown;
export const IcChevronUp = ChevronUp;
export const IcClose = X;
export const IcCheck = Check;
export const IcMore = MoreVertical;
export const IcSortAsc = ArrowUp;
export const IcSortDesc = ArrowDown;
export const IcViewGrid = LayoutGrid;
export const IcViewList = List;
export const IcPlus = Plus;
export const IcFilter = Filter;
export const IcCalendar = Calendar;
export const IcPerson = User;

// FAB
export const IcScan = ScanLine;

// 文件/文件夹菜单项
export const IcShare = Share2;
export const IcManageAccess = UserCog;
export const IcStar = Star;
export const IcOffline = CircleCheck;
export const IcDownload = Download;
export const IcCopyLink = Link2;
export const IcSendCopy = Forward;
export const IcOpenIn = Move3d;
export const IcRename = Pencil;
export const IcMove = FolderInput;
export const IcMakeCopy = Copy;
export const IcDetails = Info;
export const IcShortcut = ListTree;
export const IcPrint = Printer;
export const IcRemove = Trash2;
export const IcChangeColor = Palette;

// 抽屉
export const IcRecent = Clock;
export const IcUploads = CloudUpload;
export const IcOfflineNav = CloudOff;
export const IcSpam = ShieldAlert;
export const IcTrash = Trash2;
export const IcSettings = Settings;
export const IcHelp = CircleHelp;
export const IcStorage = Cloud;

// 回收站
export const IcRestore = RotateCcw;
export const IcDeleteForever = CircleX;

// 新建菜单
export const IcUploadFile = FileUp;
export const IcTakePhoto = Camera;
export const IcScanDoc = ScanText;
export const IcNewFolder = FolderPlus;

// 预览 / Gemini
export const IcComment = MessageSquare;
export const IcThumbUp = ThumbsUp;
export const IcThumbDown = ThumbsDown;
export const IcGlobe = Globe;
export const IcSparkle = Sparkle;
export const IcExternal = ArrowUpRight;

// 设置
export const IcBell = Bell;

// 文件类型图标
export const IcFileDoc = FileText;
export const IcFileSheet = Sheet;
export const IcFileSlide = Presentation;
export const IcFilePdf = FileType;
export const IcFileImage = Image;
export const IcFileGeneric = File;
export const IcFolder = Folder;
export const IcFolderOpen = FolderOpen;

export const ICON_REGISTRY = {
  IcLauncher, IcTabHome, IcTabStarred, IcTabShared, IcTabFiles,
  IcMenu, IcSearch, IcGemini, IcAvatar,
  IcBack, IcChevronRight, IcChevronDown, IcChevronUp, IcClose, IcCheck, IcMore,
  IcSortAsc, IcSortDesc, IcViewGrid, IcViewList, IcPlus, IcFilter, IcCalendar, IcPerson,
  IcScan,
  IcShare, IcManageAccess, IcStar, IcOffline, IcDownload, IcCopyLink, IcSendCopy,
  IcOpenIn, IcRename, IcMove, IcMakeCopy, IcDetails, IcShortcut, IcPrint, IcRemove, IcChangeColor,
  IcRecent, IcUploads, IcOfflineNav, IcSpam, IcTrash, IcSettings, IcHelp, IcStorage,
  IcRestore, IcDeleteForever,
  IcUploadFile, IcTakePhoto, IcScanDoc, IcNewFolder,
  IcComment, IcThumbUp, IcThumbDown, IcGlobe, IcSparkle, IcExternal,
  IcBell,
  IcFileDoc, IcFileSheet, IcFileSlide, IcFilePdf, IcFileImage, IcFileGeneric,
  IcFolder, IcFolderOpen,
};
