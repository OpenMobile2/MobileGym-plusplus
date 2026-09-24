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
import TodoPage from './pages/TodoPage';
import FocusPage from './pages/FocusPage';
import FocusRestPage from './pages/FocusRestPage';
import LockPage from './pages/LockPage';
import LockActivePage from './pages/LockActivePage';
import BreathPage from './pages/BreathPage';
import StatsPage from './pages/StatsPage';
import TimelinePage from './pages/TimelinePage';
import ProfilePage from './pages/ProfilePage';
import AccountPage from './pages/AccountPage';
import SettingsPage from './pages/SettingsPage';
import FuturePage from './pages/FuturePage';
import FutureAddPage from './pages/FutureAddPage';
import FutureDetailPage from './pages/FutureDetailPage';
import CheckinPage from './pages/CheckinPage';

const TAB_PATHS = ['/', '/lock', '/stats', '/timeline', '/profile'];
// 全屏页(无 TabBar):专注/锁机进行中/冥想/打卡分享
const FULLSCREEN_PATHS = ['/focus', '/focus/rest', '/lock/active', '/lock/breath', '/checkin'];

function FanqieTodoNavigationHandler() {
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
      go('tabbar.todo', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'fanqietodo');
    return () => {
      AppNavigatorRegistry.unregisterActivity(activityId);
    };
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('fanqietodo', { onBack: handleBackPress });
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isTab = TAB_PATHS.includes(pathname);
  const isFullscreen = FULLSCREEN_PATHS.includes(pathname);
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F4F6F8]">
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

function FanqieTodoRoot() {
  return (
    <MemoryRouter>
      <FanqieTodoNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TodoPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/focus/rest" element={<FocusRestPage />} />
          <Route path="/lock" element={<LockPage />} />
          <Route path="/lock/active" element={<LockActivePage />} />
          <Route path="/lock/breath" element={<BreathPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/account" element={<AccountPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/future" element={<FuturePage />} />
          <Route path="/future/add" element={<FutureAddPage />} />
          <Route path="/future/detail" element={<FutureDetailPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const FanqieTodoApp: React.FC = () => {
  void manifest;
  return (
    <div className="h-full w-full">
      <FanqieTodoRoot />
    </div>
  );
};

export default FanqieTodoApp;
