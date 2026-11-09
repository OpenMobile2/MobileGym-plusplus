import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Navigate, Routes, Route, useLocation, useNavigate, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '@/os/utils/themeToCssVars';
import { applySkinToThemeColors } from '@/os/SkinService';
import { memoryHistoryPopTo } from '@/os/utils/memoryHistoryPopTo';
import { manifest } from './manifest';
import { ROUTES } from './pages/routes.generated';
import { TabBar, TAB_ROUTES } from './components/TabBar';
import { Toast } from './components/ui';
import { ensureRoadNetwork } from './routing';
import { useDidiStore } from './state';
import { colors, colorsDark } from './res/colors';

/** 注册 OS 返回键 + navigator。栈底交还 OS 退到桌面。 */
function DidiNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);
  const navRef = useRef(navigator as { index?: number; go?: (d: number) => void });
  navRef.current = navigator as { index?: number; go?: (d: number) => void };

  useEffect(() => {
    const mem = navigator as { index?: number };
    if (typeof mem.index === 'number') historyIndexRef.current = mem.index;
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const appState = useDidiStore.getState();
    const path = location.pathname;
    const terminalTripPage = path === '/trip/finish'
      || (path === '/trip/cancel' && appState.trip.phase === 'canceled');
    if (terminalTripPage) {
      appState.resetTrip();
      // 先 pop 到首页条目再 replace，避免结束页残留在高 index，根页 back 误退回行程栈。
      memoryHistoryPopTo(navigator, '/', { inclusive: false });
      navigate('/', { replace: true });
      return true;
    }

    // Tab 根页一律交还 OS 退出应用（不走 MemoryRouter 脏历史）。
    if ((TAB_ROUTES as readonly string[]).includes(path)) return false;

    const mem = navRef.current;
    const idx = typeof mem.index === 'number' ? mem.index : historyIndexRef.current;
    if (idx > 0) {
      mem.go?.(-1);
      return true;
    }
    return false;
  }, [location.pathname, navigate, navigator]);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      if (typeof path !== 'string') return; // 防御:外部可能传非字符串
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

function AppShell() {
  const { pathname } = useLocation();
  const { isDark } = useDarkMode();
  const [focusModality, setFocusModality] = React.useState<'pointer' | 'keyboard'>('pointer');
  const isTab = TAB_ROUTES.includes(pathname);
  return (
    <div
      className="flex flex-col h-full bg-app-bg"
      data-app-id={manifest.id}
      data-app-surface={manifest.id}
      data-focus-modality={focusModality}
      onPointerDownCapture={() => setFocusModality('pointer')}
      onKeyDownCapture={(event) => {
        if (event.key === 'Tab') setFocusModality('keyboard');
      }}
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      data-navigation-bar-foreground={isDark ? 'light' : 'dark'}
    >
      {/* OS 状态栏安全区 */}
      <div className="h-10 shrink-0" />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast />
      </div>
      {isTab && <TabBar />}
      {/* 底部手势条安全区 */}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function DidiApp() {
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(applySkinToThemeColors(themeColors)),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
  };

  // 路网图约 300KB，挂载时就预热，等用户选完终点时算路可以同步完成。
  useEffect(() => {
    let active = true;
    ensureRoadNetwork().then(() => {
      if (active) useDidiStore.getState().refreshRouteOptions();
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter initialEntries={['/']}>
        <DidiNavigationHandler />
        <AppShell />
      </MemoryRouter>
    </div>
  );
}
