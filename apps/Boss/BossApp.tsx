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
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import NoticeDialog from './components/NoticeDialog';

import JobsPage from './pages/JobsPage';
import CityFilterPage from './pages/CityFilterPage';
import FilterPanelPage from './pages/FilterPanelPage';
import ExpectManagePage from './pages/ExpectManagePage';
import ExpectEditPage from './pages/ExpectEditPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import JobDetailPage from './pages/JobDetailPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import MapViewPage from './pages/MapViewPage';
import FavoritesPage from './pages/FavoritesPage';
import MessagesPage from './pages/MessagesPage';
import ChatSessionPage from './pages/ChatSessionPage';
import QuickreplyManagePage from './pages/QuickreplyManagePage';
import QuickreplyEditPage from './pages/QuickreplyEditPage';
import FeedPage from './pages/FeedPage';
import FeedDetailPage from './pages/FeedDetailPage';
import FeedCommentsPage from './pages/FeedCommentsPage';
import MinePage from './pages/MinePage';
import ResumeOnlinePage from './pages/ResumeOnlinePage';
import ResumeEditPage from './pages/ResumeEditPage';
import ResumeAttachPage from './pages/ResumeAttachPage';
import ResumeVerifyPage from './pages/ResumeVerifyPage';
import ProfileHomePage from './pages/ProfileHomePage';
import ProfileFollowPage from './pages/ProfileFollowPage';
import ProfileEditPage from './pages/ProfileEditPage';
import InterviewSchedulePage from './pages/InterviewSchedulePage';
import InterviewAddPage from './pages/InterviewAddPage';
import RecordsPage from './pages/RecordsPage';
import AssessmentListPage from './pages/AssessmentListPage';
import AssessmentMbtiPage from './pages/AssessmentMbtiPage';
import CompetitivenessBuyPage from './pages/CompetitivenessBuyPage';
import CompetitivenessDetailPage from './pages/CompetitivenessDetailPage';
import VipMemberPage from './pages/VipMemberPage';
import InternshipPage from './pages/InternshipPage';
import GuidancePage from './pages/GuidancePage';
import SupportPage from './pages/SupportPage';
import BossProfilePage from './pages/BossProfilePage';
import FeedComposePage from './pages/FeedComposePage';
import FeedAnswerPage from './pages/FeedAnswerPage';
import FeedAskPage from './pages/FeedAskPage';
import SettingsPage from './pages/SettingsPage';

const TAB_PATHS = ['/', '/feed', '/messages', '/me'];

function BossNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { back, go } = useAppNavigate();
  const { activityId } = useActivityContext();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const memoryNavigator = navigator as { index?: number };
    if (typeof memoryNavigator.index === 'number') historyIndexRef.current = memoryNavigator.index;
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const memoryNavigator = navigator as { index?: number };
    const currentIndex = typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (currentIndex > 0) {
      back();
      return true;
    }
    if (location.pathname !== '/') {
      go('tabbar.jobs-open', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'boss');
    return () => AppNavigatorRegistry.unregisterActivity(activityId);
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('boss', { onBack: handleBackPress });
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
        {isTab && <TabBar />}
      </div>
      <Toast />
      <NoticeDialog />
    </div>
  );
}

function BossRoot() {
  return (
    <MemoryRouter>
      <BossNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<JobsPage />} />
          <Route path="/city" element={<CityFilterPage />} />
          <Route path="/filter" element={<FilterPanelPage />} />
          <Route path="/expect" element={<ExpectManagePage />} />
          <Route path="/expect/edit" element={<ExpectEditPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/job" element={<JobDetailPage />} />
          <Route path="/company" element={<CompanyDetailPage />} />
          <Route path="/map" element={<MapViewPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/chat" element={<ChatSessionPage />} />
          <Route path="/chat/quickreply" element={<QuickreplyManagePage />} />
          <Route path="/chat/quickreply/edit" element={<QuickreplyEditPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/feed/post" element={<FeedDetailPage />} />
          <Route path="/feed/comments" element={<FeedCommentsPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/resume" element={<ResumeOnlinePage />} />
          <Route path="/resume/edit" element={<ResumeEditPage />} />
          <Route path="/resume/attach" element={<ResumeAttachPage />} />
          <Route path="/resume/verify" element={<ResumeVerifyPage />} />
          <Route path="/profile" element={<ProfileHomePage />} />
          <Route path="/profile/follow" element={<ProfileFollowPage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/interview" element={<InterviewSchedulePage />} />
          <Route path="/interview/add" element={<InterviewAddPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/assessment" element={<AssessmentListPage />} />
          <Route path="/assessment/mbti" element={<AssessmentMbtiPage />} />
          <Route path="/competitiveness/buy" element={<CompetitivenessBuyPage />} />
          <Route path="/competitiveness/detail" element={<CompetitivenessDetailPage />} />
          <Route path="/vip" element={<VipMemberPage />} />
          <Route path="/internship" element={<InternshipPage />} />
          <Route path="/guidance" element={<GuidancePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/boss" element={<BossProfilePage />} />
          <Route path="/feed/compose" element={<FeedComposePage />} />
          <Route path="/feed/answer" element={<FeedAnswerPage />} />
          <Route path="/feed/ask" element={<FeedAskPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const BossApp: React.FC = () => {
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
      <BossRoot />
    </div>
  );
};

export default BossApp;
