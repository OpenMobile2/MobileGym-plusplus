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
import HomePage from './pages/HomePage';
import NotebookHomePage from './pages/NotebookHomePage';
import DiscoverPage from './pages/DiscoverPage';
import AccountPage from './pages/AccountPage';
import MorePage from './pages/MorePage';
import EventDetailPage from './pages/EventDetailPage';
import EventAddPage from './pages/EventAddPage';
import EventEditPage from './pages/EventEditPage';
import NotebookSelectPage from './pages/NotebookSelectPage';
import RepeatPage from './pages/RepeatPage';
import ReminderPage from './pages/ReminderPage';
import SearchPage from './pages/SearchPage';
import NotebookManagePage from './pages/NotebookManagePage';
import NotebookAddPage from './pages/NotebookAddPage';
import SettingsPage from './pages/SettingsPage';
import DateCalcPage from './pages/DateCalcPage';
import WidgetManagePage from './pages/WidgetManagePage';
import AlbumPage from './pages/AlbumPage';
import ProPage from './pages/ProPage';
import FaqPage from './pages/FaqPage';
import ArchivePage from './pages/ArchivePage';
import LanguagePage from './pages/LanguagePage';

const TAB_PATHS = ['/', '/notebooks', '/discover', '/account', '/more'];

function DaysmatterNavigationHandler() {
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
      go('tabbar.home-open', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'daysmatter');
    return () => {
      AppNavigatorRegistry.unregisterActivity(activityId);
    };
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('daysmatter', { onBack: handleBackPress });
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isTab = TAB_PATHS.includes(pathname);
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F2F1EC]">
      <div className="flex h-full w-full flex-col">
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
        {isTab && <TabBar />}
      </div>
      <Toast />
    </div>
  );
}

function DaysmatterLayout() {
  return (
    <MemoryRouter>
      <DaysmatterNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/notebooks" element={<NotebookHomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/event/add" element={<EventAddPage />} />
          <Route path="/event/edit/:id" element={<EventEditPage />} />
          <Route path="/event/notebook-select" element={<NotebookSelectPage />} />
          <Route path="/event/repeat" element={<RepeatPage />} />
          <Route path="/event/reminder" element={<ReminderPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notebooks/manage" element={<NotebookManagePage />} />
          <Route path="/notebooks/add" element={<NotebookAddPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/language" element={<LanguagePage />} />
          <Route path="/date-calculator" element={<DateCalcPage />} />
          <Route path="/widgets" element={<WidgetManagePage />} />
          <Route path="/album" element={<AlbumPage />} />
          <Route path="/pro" element={<ProPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/archive" element={<ArchivePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const DaysmatterApp: React.FC = () => {
  void manifest;
  return (
    <div className="h-full w-full">
      <DaysmatterLayout />
    </div>
  );
};

export default DaysmatterApp;
