import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, Outlet,
  useLocation, useNavigate, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '../../os/hooks/useAppNavigationHandler';
import { useDarkMode } from '../../os/hooks/useDarkMode';
import { dimensToCssVars, themeToCssVars } from '../../os/utils/themeToCssVars';
import { AppNavigatorRegistry } from '../../os/AppNavigatorRegistry';
import { useActivityContext } from '../../os/ActivityContext';
import { manifest } from './manifest';
import { colors, colorsDark } from './res/colors';
import { useAppNavigate } from './navigation';
import { useXiaorichangStore } from './state';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import NoticeDialog from './components/NoticeDialog';
import TodayPage from './pages/TodayPage';
import TodayCardPage from './pages/TodayCardPage';
import CheckinTutorialPage from './pages/CheckinTutorialPage';
import CheckinNotePage from './pages/CheckinNotePage';
import HabitManagePage from './pages/HabitManagePage';
import HabitEditPage from './pages/HabitEditPage';
import IconPickerPage from './pages/IconPickerPage';
import ReminderPage from './pages/ReminderPage';
import ReminderAddPage from './pages/ReminderAddPage';
import GroupCreatePage from './pages/GroupCreatePage';
import GroupHabitPickerPage from './pages/GroupHabitPickerPage';
import ContextManagePage from './pages/ContextManagePage';
import ArchivedPage from './pages/ArchivedPage';
import TemplatePage from './pages/TemplatePage';
import HabitDetailPage from './pages/HabitDetailPage';
import HabitLogsPage from './pages/HabitLogsPage';
import GlowPage from './pages/GlowPage';
import WishCreatePage from './pages/WishCreatePage';
import FocusPage from './pages/FocusPage';
import FocusRecordsPage from './pages/FocusRecordsPage';
import FocusTargetPage from './pages/FocusTargetPage';
import FocusDurationPage from './pages/FocusDurationPage';
import NoteListPage from './pages/NoteListPage';
import NoteEditorPage from './pages/NoteEditorPage';
import NoteCardMenuPage from './pages/NoteCardMenuPage';
import NoteSectionMenuPage from './pages/NoteSectionMenuPage';
import TodoListPage from './pages/TodoListPage';
import TodoQuickAddPage from './pages/TodoQuickAddPage';
import TodoItemMenuPage from './pages/TodoItemMenuPage';
import TodoListMenuPage from './pages/TodoListMenuPage';
import TodoSortMenuPage from './pages/TodoSortMenuPage';
import StatsPage from './pages/StatsPage';
import AiReviewPage from './pages/AiReviewPage';
import GlowBallsPage from './pages/GlowBallsPage';
import TimelinePage from './pages/TimelinePage';
import ProfilePage from './pages/ProfilePage';
import AccountPage from './pages/AccountPage';
import DataManagePage from './pages/DataManagePage';
import SettingsPage from './pages/SettingsPage';
import PersonalizePage from './pages/PersonalizePage';
import ExportPage from './pages/ExportPage';
import ModuleManagePage from './pages/ModuleManagePage';
import WidgetPage from './pages/WidgetPage';
import LabPage from './pages/LabPage';
import LabShortcutsPage from './pages/LabShortcutsPage';
import LabCardsPage from './pages/LabCardsPage';
import LabChimePage from './pages/LabChimePage';
import AiPlannerPage from './pages/AiPlannerPage';
import SupportPage from './pages/SupportPage';
import FaqPage from './pages/FaqPage';

const TAB_PATHS = ['/', '/habits', '/focus', '/stats', '/me'];

function XiaorichangNavigationHandler() {
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
    const appState = useXiaorichangStore.getState();
    if (appState._temp.notice) {
      appState.dismissNotice();
      return true;
    }
    const memoryNavigator = navigator as { index?: number };
    const currentIndex =
      typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (currentIndex > 0) {
      back();
      return true;
    }
    // 深页直接返回时收敛到今日 tab 根(§5.2 back-reachability)
    if (location.pathname !== '/') {
      go('tabbar.today', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'xiaorichang');
    return () => {
      AppNavigatorRegistry.unregisterActivity(activityId);
    };
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('xiaorichang', { onBack: handleBackPress });
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isTab = TAB_PATHS.includes(pathname);
  return (
    <div className="relative h-full w-full overflow-hidden bg-app-bg text-app-text">
      <div className="flex h-full w-full flex-col">
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>
      {isTab && <TabBar />}
      <Toast />
      <NoticeDialog />
    </div>
  );
}

function XiaorichangRoot() {
  return (
    <MemoryRouter>
      <XiaorichangNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/today/card" element={<TodayCardPage />} />
          <Route path="/checkin/tutorial" element={<CheckinTutorialPage />} />
          <Route path="/checkin/note" element={<CheckinNotePage />} />
          <Route path="/habits" element={<HabitManagePage />} />
          <Route path="/habits/edit" element={<HabitEditPage />} />
          <Route path="/habits/edit/icon" element={<IconPickerPage />} />
          <Route path="/habits/reminder" element={<ReminderPage />} />
          <Route path="/habits/reminder/add" element={<ReminderAddPage />} />
          <Route path="/habits/group/new" element={<GroupCreatePage />} />
          <Route path="/habits/group/pick" element={<GroupHabitPickerPage />} />
          <Route path="/habits/contexts" element={<ContextManagePage />} />
          <Route path="/habits/archived" element={<ArchivedPage />} />
          <Route path="/habits/templates" element={<TemplatePage />} />
          <Route path="/habit" element={<HabitDetailPage />} />
          <Route path="/habit/logs" element={<HabitLogsPage />} />
          <Route path="/glow" element={<GlowPage />} />
          <Route path="/glow/new" element={<WishCreatePage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/focus/records" element={<FocusRecordsPage />} />
          <Route path="/focus/target" element={<FocusTargetPage />} />
          <Route path="/focus/duration" element={<FocusDurationPage />} />
          <Route path="/notes" element={<NoteListPage />} />
          <Route path="/notes/editor" element={<NoteEditorPage />} />
          <Route path="/notes/cardmenu" element={<NoteCardMenuPage />} />
          <Route path="/notes/sectionmenu" element={<NoteSectionMenuPage />} />
          <Route path="/todos" element={<TodoListPage />} />
          <Route path="/todos/quickadd" element={<TodoQuickAddPage />} />
          <Route path="/todos/itemmenu" element={<TodoItemMenuPage />} />
          <Route path="/todos/menu" element={<TodoListMenuPage />} />
          <Route path="/todos/menu/sort" element={<TodoSortMenuPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/stats/review" element={<AiReviewPage />} />
          <Route path="/stats/balls" element={<GlowBallsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/me/account" element={<AccountPage />} />
          <Route path="/me/data" element={<DataManagePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/personalize" element={<PersonalizePage />} />
          <Route path="/settings/export" element={<ExportPage />} />
          <Route path="/settings/modules" element={<ModuleManagePage />} />
          <Route path="/settings/widget" element={<WidgetPage />} />
          <Route path="/settings/lab" element={<LabPage />} />
          <Route path="/settings/lab/shortcuts" element={<LabShortcutsPage />} />
          <Route path="/settings/lab/cards" element={<LabCardsPage />} />
          <Route path="/settings/lab/chime" element={<LabChimePage />} />
          <Route path="/ai/planner" element={<AiPlannerPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/faq" element={<FaqPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const XiaorichangApp: React.FC = () => {
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(themeColors),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
  };
  return (
    <div
      className="h-full w-full bg-app-bg text-app-text"
      data-app-dark={isDark ? 'true' : 'false'}
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      data-navigation-bar-foreground={isDark ? 'light' : 'dark'}
      style={cssVars as React.CSSProperties}
    >
      <XiaorichangRoot />
    </div>
  );
};

export default XiaorichangApp;
