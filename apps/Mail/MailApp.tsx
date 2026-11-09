import React, { useCallback, useContext, useEffect } from 'react';
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  UNSAFE_NavigationContext,
} from 'react-router-dom';
import { dimensToCssVars, themeToCssVars } from '../../os/utils/themeToCssVars';
import { applySkinToThemeColors } from '../../os/SkinService';
import { useDarkMode } from '../../os/hooks/useDarkMode';
import { useAppNavigationHandler } from '../../os/hooks/useAppNavigationHandler';
import { AppNavigatorRegistry } from '../../os/AppNavigatorRegistry';
import { useActivityContext } from '../../os/ActivityContext';
import { manifest } from './manifest';
import { colors, colorsDark } from './res/colors';
import { useAppNavigate } from './navigation';
import { ToastHost } from './components/ui';
import MailboxHomePage from './pages/MailboxHomePage';
import MailListPage from './pages/MailListPage';
import MessageDetailPage from './pages/MessageDetailPage';
import ComposePage from './pages/ComposePage';
import SearchPage from './pages/SearchPage';

/** 把返回键与路由观测交给 OS */
const MailNavigationHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const { activityId } = useActivityContext();
  const { back } = useAppNavigate();
  const mem = navigator as { index?: number };

  const handleBackPress = useCallback((): boolean => {
    // 首页且历史栈见底 → 交回 OS（回桌面）
    if (location.pathname === '/' && location.search === '') return false;
    if ((mem.index ?? 0) <= 0) return false;
    back();
    return true;
  }, [back, location.pathname, location.search, mem]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'mail');
    return () => {
      AppNavigatorRegistry.unregisterActivity(activityId);
    };
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('mail', {
    onBack: handleBackPress,
    onNavigate: (path, navigateTo) => {
      const normalized = typeof path === 'string' ? (path.startsWith('/') ? path : `/${path}`) : null;
      if (!normalized) return;
      navigateTo(normalized);
    },
  });

  return null;
};

const MailApp: React.FC = () => {
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
      <MemoryRouter>
        <MailNavigationHandler />
        <div className="relative h-full w-full overflow-hidden bg-app-bg">
          <Routes>
            <Route path="/" element={<MailboxHomePage />} />
            <Route path="/mailbox/:mailboxId" element={<MailListPage />} />
            <Route path="/message/:mailId" element={<MessageDetailPage />} />
            <Route path="/compose" element={<ComposePage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
          <ToastHost />
        </div>
      </MemoryRouter>
    </div>
  );
};

export default MailApp;
