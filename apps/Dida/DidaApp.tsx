import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
  UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '../../os/hooks/useAppNavigationHandler';
import { AppNavigatorRegistry } from '../../os/AppNavigatorRegistry';
import { useActivityContext } from '../../os/ActivityContext';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import CalendarPage from './pages/CalendarPage';
import MatrixPage from './pages/MatrixPage';
import FocusPage from './pages/FocusPage';
import FocusRunningPage from './pages/FocusRunningPage';
import FocusStatsPage from './pages/FocusStatsPage';
import MePage from './pages/MePage';
import ProfilePage from './pages/ProfilePage';
import PremiumPage from './pages/PremiumPage';
import AppearancePage from './pages/AppearancePage';
import DateTimePage from './pages/DateTimePage';
import GeneralPage from './pages/GeneralPage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';
import { useDidaTheme } from './hooks/useDidaTheme';
import './theme.css';

const TAB_PATHS = ['/', '/calendar', '/matrix', '/focus', '/me'];
// 全屏页(隐藏 TabBar):专注运行、登录
const FULLSCREEN_PATHS = ['/focus/run', '/login'];

function DidaNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { back, go } = useAppNavigate();
  const { activityId } = useActivityContext();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const memoryNavigator = navigator as { index?: number };
    if (typeof memoryNavigator.index === 'number') {
      historyIndexRef.current = memoryNavigator.index;
    }
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const memoryNavigator = navigator as { index?: number };
    const currentIndex =
      typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (currentIndex > 0) {
      back();
      return true;
    }
    if (location.pathname !== '/') {
      go('tabbar.tasks', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'dida');
    return () => {
      AppNavigatorRegistry.unregisterActivity(activityId);
    };
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('dida', { onBack: handleBackPress });
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isTab = TAB_PATHS.includes(pathname);
  const isFullscreen = FULLSCREEN_PATHS.includes(pathname);
  const { isDark, cssVars } = useDidaTheme();
  return (
    <div
      className="dida-shell relative h-full w-full overflow-hidden"
      data-theme={isDark ? 'dark' : 'light'}
      style={cssVars}
    >
      <div className="flex h-full w-full flex-col">
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
        {isTab && !isFullscreen && <TabBar />}
      </div>
      <Toast />
    </div>
  );
}

function DidaRoot() {
  return (
    <MemoryRouter>
      <DidaNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TasksPage />} />
          <Route path="/task/:id" element={<TaskDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/matrix" element={<MatrixPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/focus/run" element={<FocusRunningPage />} />
          <Route path="/focus/stats" element={<FocusStatsPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/me/profile" element={<ProfilePage />} />
          <Route path="/me/premium" element={<PremiumPage />} />
          <Route path="/me/appearance" element={<AppearancePage />} />
          <Route path="/me/datetime" element={<DateTimePage />} />
          <Route path="/me/general" element={<GeneralPage />} />
          <Route path="/me/about" element={<AboutPage />} />
          <Route path="/me/help" element={<HelpPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const DidaApp: React.FC = () => {
  void manifest;
  return (
    <div className="h-full w-full">
      <DidaRoot />
    </div>
  );
};

export default DidaApp;
