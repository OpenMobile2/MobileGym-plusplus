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
import { dimensToCssVars, themeToCssVars } from '../../os/utils/themeToCssVars';
import { manifest } from './manifest';
import { colors, colorsDark } from './res/colors';
import { useYoukuDark } from './hooks/useYoukuDark';
import { useAppNavigate } from './navigation';
import { TAB_PATH_PATTERNS } from './constants';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import HomeMainPage from './pages/HomeMainPage';
import HomeChannelPage from './pages/HomeChannelPage';
import HomeChannelLitePage from './pages/HomeChannelLitePage';
import SearchEntryPage from './pages/SearchEntryPage';
import SearchResultsPage from './pages/SearchResultsPage';
import FilterPage from './pages/FilterPage';
import PlayerMoviePage from './pages/PlayerMoviePage';
import PlayerSeriesPage from './pages/PlayerSeriesPage';
import EpisodesSheet from './pages/EpisodesSheet';
import RatingPage from './pages/RatingPage';
import ShareSheet from './pages/ShareSheet';
import SpeedSheet from './pages/SpeedSheet';
import TimerSheet from './pages/TimerSheet';
import ShortsFeedPage from './pages/ShortsFeedPage';
import ShortsWatchedPage from './pages/ShortsWatchedPage';
import ShortsDramaListPage from './pages/ShortsDramaListPage';
import TaoHotPage from './pages/TaoHotPage';
import TaoJieshuoPage from './pages/TaoJieshuoPage';
import TaoPublishSheet from './pages/TaoPublishSheet';
import TaoUpcomingPage from './pages/TaoUpcomingPage';
import VipPage from './pages/VipPage';
import MePage from './pages/MePage';
import MyProfilePage from './pages/MyProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import FollowingPage from './pages/FollowingPage';
import FansPage from './pages/FansPage';
import LibraryPage from './pages/LibraryPage';
import HistoryPage from './pages/HistoryPage';
import FavTypesPage from './pages/FavTypesPage';
import DownloadsPage from './pages/DownloadsPage';
import OrdersPage from './pages/OrdersPage';
import CouponsPage from './pages/CouponsPage';
import SettingsPage from './pages/SettingsPage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import MsgCenterPage from './pages/MsgCenterPage';
import MsgNoticesPage from './pages/MsgNoticesPage';
import MsgFansPage from './pages/MsgFansPage';
import MsgSystemPage from './pages/MsgSystemPage';
import PublishEditorPage from './pages/PublishEditorPage';
import PublishTopicPage from './pages/PublishTopicPage';
import PublishShowPage from './pages/PublishShowPage';

// spec home.main 声明 route 为 /home,但 OS 合同要求 App 主页在 '/'(OS 会 activityNav('/') 复位)
const HOME_PATH = '/';

function YoukuNavigationHandler() {
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
    if (location.pathname !== HOME_PATH) {
      go('chrome.tabbar.home.open', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'youku');
    return () => {
      AppNavigatorRegistry.unregisterActivity(activityId);
    };
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('youku', { onBack: handleBackPress });
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isTab = TAB_PATH_PATTERNS.some((re) => re.test(pathname));
  return (
    <div className="relative h-full w-full overflow-hidden bg-(--app-c-page-bg)">
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

function YoukuRoot() {
  return (
    <MemoryRouter>
      <YoukuNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeMainPage />} />
          <Route path="/home/channel/:channelId" element={<HomeChannelPage />} />
          <Route path="/home/channel-lite/:channelId" element={<HomeChannelLitePage />} />
          <Route path="/search" element={<SearchEntryPage />} />
          <Route path="/search/results" element={<SearchResultsPage />} />
          <Route path="/filter" element={<FilterPage />} />
          <Route path="/player" element={<PlayerMoviePage />} />
          <Route path="/player/series" element={<PlayerSeriesPage />} />
          <Route path="/player/series/episodes" element={<EpisodesSheet />} />
          <Route path="/player/rating" element={<RatingPage />} />
          <Route path="/player/share" element={<ShareSheet />} />
          <Route path="/player/speed" element={<SpeedSheet />} />
          <Route path="/player/timer" element={<TimerSheet />} />
          <Route path="/shorts" element={<ShortsFeedPage />} />
          <Route path="/shorts/watched" element={<ShortsWatchedPage />} />
          <Route path="/shorts/dramas" element={<ShortsDramaListPage />} />
          <Route path="/taohaopian" element={<TaoHotPage />} />
          <Route path="/taohaopian/jieshuo" element={<TaoJieshuoPage />} />
          <Route path="/taohaopian/jieshuo/publish" element={<TaoPublishSheet />} />
          <Route path="/taohaopian/upcoming" element={<TaoUpcomingPage />} />
          <Route path="/vip" element={<VipPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/me/profile" element={<MyProfilePage />} />
          <Route path="/me/profile/edit" element={<ProfileEditPage />} />
          <Route path="/me/following" element={<FollowingPage />} />
          <Route path="/me/fans" element={<FansPage />} />
          <Route path="/me/library" element={<LibraryPage />} />
          <Route path="/me/history" element={<HistoryPage />} />
          <Route path="/me/favtypes" element={<FavTypesPage />} />
          <Route path="/me/downloads" element={<DownloadsPage />} />
          <Route path="/me/orders" element={<OrdersPage />} />
          <Route path="/me/coupons" element={<CouponsPage />} />
          <Route path="/me/settings" element={<SettingsPage />} />
          <Route path="/user/:userId" element={<CreatorProfilePage />} />
          <Route path="/messages" element={<MsgCenterPage />} />
          <Route path="/messages/notices/:type" element={<MsgNoticesPage />} />
          <Route path="/messages/fans" element={<MsgFansPage />} />
          <Route path="/messages/system/:convId" element={<MsgSystemPage />} />
          <Route path="/publish" element={<PublishEditorPage />} />
          <Route path="/publish/topic" element={<PublishTopicPage />} />
          <Route path="/publish/show" element={<PublishShowPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const YoukuApp: React.FC = () => {
  // 默认深色;浅色强制亮;跟随系统读 OS
  const isDark = useYoukuDark();
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
      className="h-full w-full"
      style={cssVars as React.CSSProperties}
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      data-navigation-bar-foreground={isDark ? 'light' : 'dark'}
    >
      <YoukuRoot />
    </div>
  );
};

export default YoukuApp;
