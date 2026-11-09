import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '@/os/utils/themeToCssVars';
import { applySkinToThemeColors } from '@/os/SkinService';
import { manifest } from './manifest';
import { colors, colorsDark } from './res/colors';
import { MAIN_TABS } from './constants';
import { useFanqieGestures } from './hooks/useFanqieGestures';
import { useFanqieStrings } from './components/ui';
import {
  IcTabHome, IcTabWelfare, IcTabShelf, IcTabMine,
} from './res/icons';

import HomePage from './pages/HomePage';
import RankPage from './pages/RankPage';
import CategoryPage from './pages/CategoryPage';
import TagResultPage from './pages/TagResultPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import BookDetailPage from './pages/BookDetailPage';
import ReviewsPage from './pages/ReviewsPage';
import ReviewWritePage from './pages/ReviewWritePage';
import ReaderPage from './pages/ReaderPage';
import ShelfPage from './pages/ShelfPage';
import HistoryPage from './pages/HistoryPage';
import WelfarePage from './pages/WelfarePage';
import MinePage from './pages/MinePage';
import ProfilePage from './pages/ProfilePage';
import EarningsPage from './pages/EarningsPage';
import MessagesPage from './pages/MessagesPage';
import AuthorPage from './pages/AuthorPage';

const TAB_PATHS: string[] = MAIN_TABS.map((t) => t.path);
const TAB_ICONS = {
  home: IcTabHome, welfare: IcTabWelfare, shelf: IcTabShelf, mine: IcTabMine,
} as const;

function FanqieNavigationHandler() {
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);
  const navRef = useRef(navigator as { index?: number; go?: (d: number) => void });
  navRef.current = navigator as { index?: number; go?: (d: number) => void };

  useEffect(() => {
    const mem = navigator as { index?: number };
    if (typeof mem.index === 'number') historyIndexRef.current = mem.index;
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const mem = navRef.current;
    const idx = typeof mem.index === 'number' ? mem.index : historyIndexRef.current;
    if (idx > 0) {
      mem.go?.(-1);
      return true;
    }
    return false; // 栈底:交还 OS 退到桌面
  }, []);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

function TabBar() {
  const location = useLocation();
  const { bindTap } = useFanqieGestures();
  const s = useFanqieStrings();

  if (!TAB_PATHS.includes(location.pathname)) return null;

  // 绑定点必须是字符串字面量(AGENTS DOM Tagging 规则)
  const TAB_BINDINGS: Record<string, object> = {
    home: bindTap('tabbar.home-open'),
    welfare: bindTap('tabbar.welfare-open'),
    shelf: bindTap('tabbar.shelf-open'),
    mine: bindTap('tabbar.mine-open'),
  };

  return (
    <div data-hide-on-keyboard className="shrink-0 bg-(--app-c-bg-card) border-t border-(--app-c-border) flex">
      {MAIN_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id as keyof typeof TAB_ICONS];
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.id}
            {...TAB_BINDINGS[tab.id]}
            className="flex-1 flex flex-col items-center pt-1.5 pb-1 gap-0.5 bg-transparent border-none cursor-pointer"
          >
            <Icon size={22} className={active ? 'text-(--app-c-brand)' : 'text-(--app-c-text-tertiary)'} />
            <span className={`text-[10px] ${active ? 'text-(--app-c-brand) font-semibold' : 'text-(--app-c-text-tertiary)'}`}>
              {s[tab.label as keyof typeof s]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const inReader = location.pathname.startsWith('/reader/');
  const { isDark } = useDarkMode();
  const themeColors = useMemo(
    () => (isDark
      ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
      : manifest.theme.colors),
    [isDark],
  );
  const cssVars = useMemo(
    () => ({
      ...themeToCssVars(applySkinToThemeColors(themeColors)),
      ...dimensToCssVars(isDark ? { ...colors, ...colorsDark } : colors, { prefix: '--app-c-' }),
    }),
    [themeColors, isDark],
  );
  // 阅读器沉浸态自带纸张主题,状态栏前景由 ReaderPage 自行声明
  const statusFg = themeColors.statusBarForeground ?? (isDark ? 'light' : 'dark');
  return (
    <div
      className="flex flex-col h-full bg-(--app-c-bg-page)"
      style={cssVars as React.CSSProperties}
      data-status-bar-foreground={statusFg}
      data-navigation-bar-foreground={themeColors.navigationBarForeground ?? statusFg}
    >
      {/* OS 状态栏安全区(阅读器沉浸态自行处理背景) */}
      {!inReader && <div className="h-10 shrink-0" />}
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/category/tag" element={<TagResultPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/book/:id" element={<BookDetailPage />} />
          <Route path="/book/:id/reviews" element={<ReviewsPage />} />
          <Route path="/book/:id/review/write" element={<ReviewWritePage />} />
          <Route path="/reader/:id" element={<ReaderPage />} />
          <Route path="/shelf" element={<ShelfPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/welfare" element={<WelfarePage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/me/profile" element={<ProfilePage />} />
          <Route path="/me/earnings" element={<EarningsPage />} />
          <Route path="/me/messages" element={<MessagesPage />} />
          <Route path="/author/:id" element={<AuthorPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <TabBar />
      {/* 底部手势条安全区 */}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function FanqieXiaoshuoApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <FanqieNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}
