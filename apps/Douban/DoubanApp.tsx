import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '@/os/utils/themeToCssVars';
import { applySkinToThemeColors } from '@/os/SkinService';
import { manifest } from './manifest';
import { TAB_ROUTES } from './constants';
import { ROUTES } from './pages/routes.generated';
import HomeFeedPage from './pages/HomeFeedPage';
import { ChromeTabbar } from './components/ChromeTabbar';
import { ChromeDrawer } from './components/ChromeDrawer';
import { Toast } from './components/Toast';
import { GlobalFakePlayerBar } from './components/FakePlayerBar';
import { colors, colorsDark } from './res/colors';

/** 注册 OS 返回键 + navigator(MemoryRouter 栈式返回)。 */
function DoubanNavigationHandler() {
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

function AppShell() {
  const location = useLocation();
  const { isDark } = useDarkMode();
  // 书影音是一个一级 Tab,其下电视/读书/播客/音乐/同城 各自独立频道路由(/bm/xxx 单段)保留底部 TabBar(书影音高亮);
  // 更深的子页(如 /bm/tv/hot 全部展开页)是 push 子页,不显示 TabBar。
  const isTabRoute =
    (TAB_ROUTES as readonly string[]).includes(location.pathname) ||
    /^\/bm\/[^/]+$/.test(location.pathname);
  return (
    <div
      className="flex flex-col h-full bg-app-bg"
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      data-navigation-bar-foreground={isDark ? 'light' : 'dark'}
    >
      {/* OS 状态栏安全区 */}
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<HomeFeedPage />} />
        </Routes>
        {/* 左侧抽屉浮层(?drawer=open 时可见,URL 驱动) */}
        <ChromeDrawer />
        {/* 假迷你播放条(qa:Q1/Q2):store.player 非空时跨页驻留 */}
        <GlobalFakePlayerBar />
        <Toast />
      </div>
      {/* 底部 TabBar:仅五个一级 Tab 路由常驻 */}
      {isTabRoute && <ChromeTabbar />}
      {/* 底部手势条安全区 */}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function DoubanApp() {
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(applySkinToThemeColors(themeColors)),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
    // 豆瓣页面 C.* 语义色跟随 OS
    '--db-bg': themeColors.background,
    '--db-surface': themeColors.surface ?? '#FFFFFF',
    '--db-text': themeColors.textPrimary,
    '--db-sub': themeColors.textSecondary,
    '--db-border': themeColors.border ?? '#EDEDED',
    '--db-green-soft': isDark ? (colorsDark.green_soft ?? '#1A3D22') : colors.green_soft,
  } as React.CSSProperties;
  return (
    <div className="h-full w-full" style={cssVars}>
      <MemoryRouter initialEntries={['/']}>
        <DoubanNavigationHandler />
        <AppShell />
      </MemoryRouter>
    </div>
  );
}
