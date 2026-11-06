import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '@/os/utils/themeToCssVars';
import { applySkinToThemeColors } from '@/os/SkinService';
import { manifest } from './manifest';
import { ROUTES } from './pages/routes.generated';
import HomeFeedPage from './pages/HomeFeedPage';
import { Toast, UndoBar, ImageLightbox } from './components/Sheet';
import { THEME_VARS } from './components/ui';
import { useFlomoStore } from './state';
import { colors, colorsDark } from './res/colors';

/** 注册 OS 返回键 + navigator(back-stack:从抽屉打开的页返回回抽屉)。 */
function FlomoNavigationHandler() {
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
  const { isDark } = useDarkMode();
  // 跟随 OS 深色；应用内 theme=dark 仍可作为额外开关
  const settingsTheme = useFlomoStore((s) => s.settings.theme);
  const theme = isDark || settingsTheme === 'dark' ? 'dark' : 'light';
  const vars = THEME_VARS[theme] ?? THEME_VARS.light;
  return (
    <div
      className="flex flex-col h-full"
      style={{ ...(vars as React.CSSProperties), background: 'var(--fl-bg)' }}
      data-status-bar-foreground={theme === 'dark' ? 'light' : 'dark'}
      data-navigation-bar-foreground={theme === 'dark' ? 'light' : 'dark'}
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
        <Toast />
        <UndoBar />
        <ImageLightbox />
      </div>
      {/* 底部手势条安全区(flomo 无底部 TabBar) */}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function FlomoApp() {
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(applySkinToThemeColors(themeColors)),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
  };
  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter initialEntries={['/']}>
        <FlomoNavigationHandler />
        <AppShell />
      </MemoryRouter>
    </div>
  );
}
