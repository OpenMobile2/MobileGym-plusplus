// apps/Slack/SlackApp.tsx — Slack 入口
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  UNSAFE_NavigationContext,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { themeToCssVars } from '@/os/utils/themeToCssVars';
import { manifest } from './manifest';
import { TABS } from './constants';
import { useI18n } from './i18n';
import { useSlackStore } from './state';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import ChannelConversationPage from './pages/ChannelConversationPage';
import DmConversationPage from './pages/DmConversationPage';
import ThreadPage from './pages/ThreadPage';
import PinnedPage from './pages/PinnedPage';
import ForwardPage from './pages/ForwardPage';
import ImageViewerPage from './pages/ImageViewerPage';
import WebViewPage from './pages/WebViewPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import DmListPage from './pages/DmListPage';
import ActivityPage from './pages/ActivityPage';
import MorePage from './pages/MorePage';
import SearchPage from './pages/SearchPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SavedPage from './pages/SavedPage';
import DraftsPage from './pages/DraftsPage';
import NewMessagePage from './pages/NewMessagePage';
import HuddlePage from './pages/HuddlePage';
import CreateChannelPage from './pages/CreateChannelPage';
import CreateChannelMembersPage from './pages/CreateChannelMembersPage';
import BrowseChannelsPage from './pages/BrowseChannelsPage';
import BrowseSectionsPage from './pages/BrowseSectionsPage';
import AddMembersPage from './pages/AddMembersPage';
import ChannelSettingsPage from './pages/ChannelSettingsPage';
import MembersPage from './pages/MembersPage';
import ChannelEditPage from './pages/ChannelEditPage';
import FilesPage from './pages/FilesPage';
import AssignedPage from './pages/AssignedPage';
import ExternalPage from './pages/ExternalPage';
import MePanelPage from './pages/MePanelPage';
import PrefsPage from './pages/PrefsPage';
import PrefsLanguagePage from './pages/PrefsLanguagePage';
import PrefsColorModePage from './pages/PrefsColorModePage';
import PrefsNotificationsPage from './pages/PrefsNotificationsPage';
import StatusPage from './pages/StatusPage';
import PauseNotificationsPage from './pages/PauseNotificationsPage';
import UnreadsPage from './pages/UnreadsPage';

const TAB_PATHS: string[] = TABS.map((tab) => tab.path);

/** 「提醒我」到点后由 Slackbot 私信发出，所以轮询要挂在整个 App 上而不是某个页面 */
const ReminderTicker: React.FC = () => {
  const { t } = useI18n();
  const fireDueReminders = useSlackStore((s) => s.fireDueReminders);
  useEffect(() => {
    const timer = window.setInterval(() => fireDueReminders(t('remind.notice')), 15_000);
    return () => window.clearInterval(timer);
  }, [fireDueReminders, t]);
  return null;
};

const NavigationHandler: React.FC = () => {
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);
  const navRef = useRef(navigator as { index?: number; go?: (delta: number) => void });
  navRef.current = navigator as { index?: number; go?: (delta: number) => void };

  useEffect(() => {
    const memoryNavigator = navigator as { index?: number };
    if (typeof memoryNavigator.index === 'number') historyIndexRef.current = memoryNavigator.index;
  }, [location, navigator]);

  const handleBack = useCallback((): boolean => {
    const memoryNavigator = navRef.current;
    const index =
      typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (index > 0) {
      memoryNavigator.go?.(-1);
      return true;
    }
    return false;
  }, []);

  useAppNavigationHandler('slack', { onBack: handleBack });
  return null;
};

/**
 * 4 个主 Tab 常驻挂载（display 切换，保住滚动位置），二级页走 Outlet 覆盖在上层。
 * 底栏只在主 Tab 出现；Toast 挂最外层一次。
 */
const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const [sp] = useSearchParams();
  // 抽屉 / 弹层 / 长按面板都要盖住底栏；FAB 快捷卡（sheet=fabMenu）保留底栏，让用户看见 ＋
  const sheet = sp.get('sheet');
  const overlayOpen =
    ['drawer', 'modal', 'menu'].some((key) => sp.get(key)) ||
    Boolean(sheet && sheet !== 'fabMenu');
  const isMainTab = TAB_PATHS.includes(pathname);

  return (
    <div
      data-app-root="slack"
      className="relative flex h-full flex-col overflow-hidden bg-white font-sans"
    >
      <div className="relative min-h-0 flex-1">
        <div style={{ display: pathname === '/' ? 'block' : 'none', height: '100%' }}>
          <HomePage />
        </div>
        <div style={{ display: pathname === '/dms' ? 'block' : 'none', height: '100%' }}>
          <DmListPage />
        </div>
        <div style={{ display: pathname === '/activity' ? 'block' : 'none', height: '100%' }}>
          <ActivityPage />
        </div>
        <div style={{ display: pathname === '/more' ? 'block' : 'none', height: '100%' }}>
          <MorePage />
        </div>
        {!isMainTab && (
          <div className="absolute inset-0 overflow-hidden bg-white">
            <Outlet />
          </div>
        )}
      </div>

      {isMainTab && !overlayOpen && <TabBar />}
      <ReminderTicker />
      <Toast />
    </div>
  );
};

export const SlackApp: React.FC = () => {
  const cssVars = themeToCssVars(manifest.theme.colors);
  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter initialEntries={['/']}>
        <NavigationHandler />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="dms" element={<DmListPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="more" element={<MorePage />} />
            <Route path="channel/create" element={<CreateChannelPage />} />
            <Route path="channel/create/members" element={<CreateChannelMembersPage />} />
            <Route path="channel/:convId" element={<ChannelConversationPage />} />
            <Route path="channel/:convId/thread/:messageId" element={<ThreadPage />} />
            <Route path="channel/:convId/pinned" element={<PinnedPage />} />
            <Route path="channel/:convId/settings" element={<ChannelSettingsPage />} />
            <Route path="channel/:convId/members" element={<MembersPage />} />
            <Route path="channel/:convId/edit" element={<ChannelEditPage />} />
            <Route path="channel/:convId/members/add" element={<AddMembersPage />} />
            <Route path="channels/browse" element={<BrowseChannelsPage />} />
            <Route path="browse/sections" element={<BrowseSectionsPage />} />
            <Route path="dm/new" element={<NewMessagePage />} />
            <Route path="dm/:convId" element={<DmConversationPage />} />
            <Route path="forward" element={<ForwardPage />} />
            <Route path="media/:messageId" element={<ImageViewerPage />} />
            <Route path="webview" element={<WebViewPage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="profile/:userId/edit" element={<ProfileEditPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="search/results" element={<SearchResultsPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="drafts" element={<DraftsPage />} />
            <Route path="huddle" element={<HuddlePage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="assigned" element={<AssignedPage />} />
            <Route path="external" element={<ExternalPage />} />
            <Route path="unreads" element={<UnreadsPage />} />
            <Route path="me" element={<MePanelPage />} />
            <Route path="me/status" element={<StatusPage />} />
            <Route path="me/pause" element={<PauseNotificationsPage />} />
            <Route path="preferences" element={<PrefsPage />} />
            <Route path="preferences/language" element={<PrefsLanguagePage />} />
            <Route path="preferences/colorMode" element={<PrefsColorModePage />} />
            <Route path="preferences/notifications" element={<PrefsNotificationsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>
  );
};

export default SlackApp;
